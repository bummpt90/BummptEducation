/**
 * BummptEducation — Authentication & Authorization Middleware Suite
 * 
 * Provides production-grade Express middleware for:
 * - JWT authentication & database identity verification
 * - Role-Based Access Control (RBAC)
 * - Permission verification
 * - Multi-school tenant isolation enforcement
 * - Development preview compatibility isolation
 */

import type { Response, NextFunction } from 'express';
import { AUTH_COOKIE_NAME, verifyAuthToken, isTokenRevoked, buildSafeUser } from './token';
import { userRepository } from '../db/repositories/user.repository';
import { query } from '../db';
import { logAuthEvent } from './audit';
import { hasPermission } from './permissions';
import { AuthRole, Permission, AuthenticatedRequest, SafeUser } from './types';

/**
 * Extracts authentication token from either HTTP-only cookie or Authorization header
 */
export function extractToken(req: AuthenticatedRequest): string | null {
  // 1. Check HTTP-only cookie first
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Core Authentication Middleware
 * Validates token, checks revocation, verifies database user status, and sets trusted req.user & req.tenantContext.
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHENTICATED',
        message: 'Authentication required. No valid session or token provided.',
      });
      return;
    }

    // Verify token cryptographic signature
    const decoded = verifyAuthToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or expired. Please log in again.',
      });
      return;
    }

    // Check if token session has been revoked in database
    const revoked = await isTokenRevoked(token);
    if (revoked) {
      res.status(401).json({
        success: false,
        error: 'REVOKED_SESSION',
        message: 'Session has been invalidated or logged out. Please log in again.',
      });
      return;
    }

    // Verify user in PostgreSQL database
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account associated with this session no longer exists.',
      });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
      return;
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      res.status(403).json({
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: `Account is temporarily locked until ${new Date(user.locked_until).toLocaleTimeString()}.`,
      });
      return;
    }

    // Resolve school name if school-scoped
    let schoolName: string | null = null;
    if (user.school_id) {
      const schoolRes = await query<{ name: string }>('SELECT name FROM schools WHERE id = $1 LIMIT 1;', [user.school_id]);
      schoolName = schoolRes.rows[0]?.name || null;
    }

    // Construct sanitized identity
    const safeUser = buildSafeUser(user, schoolName);

    // Attach to request
    req.user = safeUser;
    req.tokenPayload = decoded;
    req.tenantContext = {
      userId: user.id,
      schoolId: user.school_id || undefined,
      role: user.role,
      isSuperAdmin: user.role === 'super_admin' || user.role === 'state_officer',
    };

    next();
  } catch (error: any) {
    console.error('[AuthMiddleware] Error during authentication:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_AUTH_ERROR',
      message: 'An internal error occurred while verifying identity.',
    });
  }
}

/**
 * Optional Authentication Middleware
 * If token is present, establishes identity. If absent, proceeds without req.user.
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next();
  }
  return authenticateUser(req, res, next);
}

/**
 * Role-Based Authorization Middleware
 * Enforces that the authenticated user possesses one of the required roles.
 */
export function requireRole(...allowedRoles: AuthRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHENTICATED',
        message: 'Authentication required.',
      });
      return;
    }

    // Super Admin always has universal access
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Log unauthorized attempt
    logAuthEvent({
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      status: 'BLOCKED',
      userId: req.user.id,
      email: req.user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        attemptedPath: req.originalUrl,
        method: req.method,
        userRole: req.user.role,
        allowedRoles,
      },
    });

    res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ROLE',
      message: `Access denied. This action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
    });
  };
}

/**
 * Permission-Based Authorization Middleware
 * Enforces that the user has all specified granular permissions.
 */
export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHENTICATED',
        message: 'Authentication required.',
      });
      return;
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) => hasPermission(req.user!.role, perm));
    if (hasAll) {
      return next();
    }

    logAuthEvent({
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      status: 'BLOCKED',
      userId: req.user.id,
      email: req.user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        attemptedPath: req.originalUrl,
        requiredPermissions,
        userPermissions: req.user.permissions,
      },
    });

    res.status(403).json({
      success: false,
      error: 'FORBIDDEN_PERMISSION',
      message: `Access denied. Missing required permission: [${requiredPermissions.join(', ')}]`,
    });
  };
}

/**
 * Multi-School Tenant Isolation Middleware
 * Prevents school-level users from accessing or passing another school's school_id.
 * State Officers and Super Admins are permitted global cross-school inspection.
 */
export function requireSchoolScope() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHENTICATED', message: 'Authentication required.' });
      return;
    }

    // Global roles can inspect any school
    if (req.user.isSuperAdmin || req.user.isStateOfficer) {
      return next();
    }

    const trustedSchoolId = req.user.schoolId;
    if (!trustedSchoolId) {
      res.status(403).json({
        success: false,
        error: 'TENANT_SCOPE_MISSING',
        message: 'User does not belong to a valid school tenant.',
      });
      return;
    }

    // Inspect if client attempted to explicitly specify school_id in body, query, or params
    const clientSuppliedSchoolId =
      req.body?.school_id ||
      req.body?.schoolId ||
      req.query?.school_id ||
      req.query?.schoolId ||
      req.params?.schoolId;

    if (clientSuppliedSchoolId && clientSuppliedSchoolId !== trustedSchoolId) {
      logAuthEvent({
        action: 'TENANT_VIOLATION_ATTEMPT',
        status: 'BLOCKED',
        userId: req.user.id,
        email: req.user.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          trustedSchoolId,
          attemptedSchoolId: clientSuppliedSchoolId,
          path: req.originalUrl,
        },
      });

      res.status(403).json({
        success: false,
        error: 'TENANT_ISOLATION_VIOLATION',
        message: 'Access denied: Cross-school tenant operations are strictly prohibited.',
      });
      return;
    }

    // Ensure tenantContext always reflects trusted server identity
    if (req.tenantContext) {
      req.tenantContext.schoolId = trustedSchoolId;
    }

    next();
  };
}

/**
 * Development Preview Compatibility Middleware
 * 
 * Used for legacy preview routes where unauthenticated demo exploration is expected.
 * CRITICAL SAFETY: Strictly locked out when NODE_ENV === 'production'.
 */
export async function devAuthCompatibility(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // SAFETY CHECK: NEVER allow dev bypass in production
  if (process.env.NODE_ENV === 'production') {
    await authenticateUser(req, res, next);
    return;
  }

  // In development, if already authenticated with valid token, proceed
  const token = extractToken(req);
  if (token) {
    const decoded = verifyAuthToken(token);
    if (decoded) {
      await authenticateUser(req, res, next);
      return;
    }
  }

  // Development-only fallback identity for preview mode
  const devUser: SafeUser = {
    id: 'dev-preview-user',
    email: 'preview.teacher@bummpt.edu.ng',
    fullName: 'Development Preview Staff',
    role: 'teacher',
    schoolId: '00000000-0000-0000-0000-000000000001', // Anchor school
    schoolName: 'Anchor Demonstration Model College',
    phone: '+234 803 000 0000',
    isSuperAdmin: false,
    isStateOfficer: false,
    permissions: [
      'lesson_notes.view',
      'lesson_notes.create',
      'students.view',
      'attendance.view',
      'attendance.mark',
      'assessments.view',
      'results.view',
      'directives.view',
    ],
  };

  req.user = devUser;
  req.tenantContext = {
    userId: devUser.id,
    schoolId: devUser.schoolId || undefined,
    role: devUser.role,
    isSuperAdmin: false,
  };

  next();
}
