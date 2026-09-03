/**
 * BummptEducation — Version 1 Authentication Router
 * 
 * Endpoints:
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/logout
 * - GET  /api/v1/auth/me
 * - POST /api/v1/auth/refresh
 * - GET  /api/v1/auth/dev-identities (Strictly disabled in production)
 */

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { userRepository } from '../db/repositories/user.repository';
import { verifyPassword } from './password';
import {
  signAuthToken,
  createSessionRecord,
  revokeTokenSession,
  setAuthCookie,
  clearAuthCookie,
  buildSafeUser,
} from './token';
import { authenticateUser, extractToken } from './middleware';
import { logAuthEvent } from './audit';
import { query } from '../db';
import { AuthenticatedRequest, LoginRequestBody, LoginResponsePayload } from './types';
import { accountRequestsRouter } from './account-request.routes';

export const authRouter = Router();

// Mount controlled account-requests submodule
authRouter.use('/account-requests', accountRequestsRouter);

// In-memory IP rate limiter for brute-force protection
interface RateLimitBucket {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitBucket>();

function checkIpRateLimit(ip: string, maxAttempts = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const bucket = ipRateLimits.get(ip);

  if (!bucket || bucket.resetTime < now) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  bucket.count++;
  if (bucket.count > maxAttempts) {
    return false;
  }
  return true;
}

/**
 * POST /api/v1/auth/login
 * Primary credential authentication endpoint
 */
authRouter.post('/login', async (req: Request<{}, {}, LoginRequestBody>, res: Response<LoginResponsePayload | any>) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // 1. IP Rate limit check
  if (!checkIpRateLimit(clientIp)) {
    logAuthEvent({
      action: 'LOGIN_FAILURE',
      status: 'BLOCKED',
      ipAddress: clientIp,
      userAgent,
      details: { reason: 'RATE_LIMIT_EXCEEDED' },
    });
    return res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts from this IP. Please wait 60 seconds before trying again.',
    });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CREDENTIALS_PAYLOAD',
        message: 'Email and password are required fields.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Locate user in database
    const user = await userRepository.findByEmail(cleanEmail);

    // Generic response message to prevent account enumeration
    const genericFailureMsg = 'Invalid email or password.';

    if (!user) {
      logAuthEvent({
        action: 'LOGIN_FAILURE',
        status: 'FAILED',
        email: cleanEmail,
        ipAddress: clientIp,
        userAgent,
        details: { reason: 'USER_NOT_FOUND' },
      });
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: genericFailureMsg,
      });
    }

    // 3. Check account active status
    if (!user.is_active) {
      logAuthEvent({
        action: 'LOGIN_FAILURE',
        status: 'BLOCKED',
        userId: user.id,
        email: cleanEmail,
        ipAddress: clientIp,
        userAgent,
        details: { reason: 'ACCOUNT_DEACTIVATED' },
      });
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: 'Your account has been deactivated. Please contact your system administrator.',
      });
    }

    // 4. Check account lockout status
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      logAuthEvent({
        action: 'LOGIN_FAILURE',
        status: 'BLOCKED',
        userId: user.id,
        email: cleanEmail,
        ipAddress: clientIp,
        userAgent,
        details: { reason: 'ACCOUNT_CURRENTLY_LOCKED', lockedUntil: user.locked_until },
      });
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked due to repeated failed attempts. Please try again after ${new Date(user.locked_until).toLocaleTimeString()}.`,
      });
    }

    // 5. Verify Argon2id password hash
    const isValid = await verifyPassword(user.password_hash, password);

    if (!isValid) {
      // Record failed attempt and evaluate lockout threshold (5 attempts, 15 min lock)
      const lockStatus = await userRepository.recordFailedAttempt(user.id, 5, 15);

      if (lockStatus.isLocked) {
        logAuthEvent({
          action: 'ACCOUNT_LOCKOUT',
          status: 'BLOCKED',
          userId: user.id,
          email: cleanEmail,
          ipAddress: clientIp,
          userAgent,
          details: { failedAttempts: lockStatus.failedAttempts, lockedUntil: lockStatus.lockedUntil },
        });
        return res.status(403).json({
          success: false,
          error: 'ACCOUNT_LOCKED',
          message: 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.',
        });
      }

      logAuthEvent({
        action: 'LOGIN_FAILURE',
        status: 'FAILED',
        userId: user.id,
        email: cleanEmail,
        ipAddress: clientIp,
        userAgent,
        details: { failedAttempts: lockStatus.failedAttempts },
      });

      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: genericFailureMsg,
      });
    }

    // 6. Successful authentication: reset failed attempts & record login timestamp
    await userRepository.updateLoginSuccess(user.id);

    // Resolve school name
    let schoolName: string | null = null;
    if (user.school_id) {
      const schoolRes = await query<{ name: string }>('SELECT name FROM schools WHERE id = $1 LIMIT 1;', [user.school_id]);
      schoolName = schoolRes.rows[0]?.name || null;
    }

    const safeUser = buildSafeUser(user, schoolName);

    // 7. Sign server token
    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      role: safeUser.role,
      schoolId: user.school_id,
      isSuperAdmin: safeUser.isSuperAdmin,
    });

    // 8. Register session ledger
    await createSessionRecord(user.id, token, clientIp, userAgent);

    // 9. Record audit event
    logAuthEvent({
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      userId: user.id,
      email: cleanEmail,
      ipAddress: clientIp,
      userAgent,
      details: { role: user.role, schoolId: user.school_id },
    });

    // 10. Set secure HTTP-only cookie
    setAuthCookie(res, token);

    // Return sanitized response (never expose password_hash or internal secrets)
    return res.json({
      success: true,
      message: 'Authentication successful.',
      user: safeUser,
      token, // Also returned in body to support iframe preview & non-cookie clients
    });
  } catch (error: any) {
    console.error('[AuthRouter] Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred during authentication.',
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Invalidate session and clear authentication cookie
 */
authRouter.post('/logout', async (req: AuthenticatedRequest, res: Response) => {
  const token = extractToken(req);
  if (token) {
    await revokeTokenSession(token);
    logAuthEvent({
      action: 'LOGOUT',
      status: 'SUCCESS',
      userId: req.user?.id || null,
      email: req.user?.email || null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
  clearAuthCookie(res);
  return res.json({
    success: true,
    message: 'Successfully logged out.',
  });
});

/**
 * GET /api/v1/auth/me
 * Returns current authenticated identity, role, tenant scope, and permissions
 */
authRouter.get('/me', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /api/v1/auth/refresh
 * Issues a fresh token for an already authenticated, valid session
 */
authRouter.post('/refresh', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated.' });
  }

  const newToken = signAuthToken({
    userId: req.user.id,
    email: req.user.email,
    role: req.user.role,
    schoolId: req.user.schoolId,
    isSuperAdmin: req.user.isSuperAdmin,
  });

  await createSessionRecord(req.user.id, newToken, req.ip, req.headers['user-agent']);
  setAuthCookie(res, newToken);

  logAuthEvent({
    action: 'TOKEN_REFRESH',
    status: 'SUCCESS',
    userId: req.user.id,
    email: req.user.email,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({
    success: true,
    message: 'Token refreshed.',
    user: req.user,
    token: newToken,
  });
});

/**
 * GET /api/v1/auth/dev-identities
 * DEVELOPMENT ONLY: Returns list of test user emails and roles for quick UI preview switching.
 * STRICT SAFETY: Always returns 404 in production environment.
 */
authRouter.get('/dev-identities', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not Found' });
  }

  try {
    const sql = `
      SELECT u.id, u.email, u.full_name, u.role, u.school_id, s.name as school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE u.is_active = TRUE
      ORDER BY u.role, u.full_name;
    `;
    const rows = await query<any>(sql);
    return res.json({
      success: true,
      data: rows.rows,
      environment: 'development',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Password Reset Foundation
 * Safely handles password reset requests without leaking identity existence.
 */
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'A valid email address is required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(cleanEmail);

    if (user && user.is_active) {
      // Generate cryptographically secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Update token with 1 hour expiration in users table
      await query(
        `UPDATE users
         SET reset_password_token = $1,
             reset_password_expires_at = NOW() + INTERVAL '1 hour',
             updated_at = NOW()
         WHERE id = $2;`,
        [tokenHash, user.id]
      );

      logAuthEvent({
        action: 'PASSWORD_RESET_REQUESTED',
        status: 'SUCCESS',
        userId: user.id,
        email: cleanEmail,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { expires: '1 hour' },
      });
    } else {
      // Log event even if user not found (for anomaly/reconnaissance detection)
      logAuthEvent({
        action: 'PASSWORD_RESET_REQUESTED',
        status: 'BLOCKED',
        email: cleanEmail,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { reason: 'EMAIL_NOT_FOUND_OR_INACTIVE' },
      });
    }

    // Always return uniform response (OWASP anti-enumeration standard)
    return res.json({
      success: true,
      message: 'If an active account exists for this email, password reset instructions and security token have been logged for institutional processing.',
    });
  } catch (error: any) {
    console.error('[AuthRouter] Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred while processing password reset request.',
    });
  }
});

