/**
 * BummptEducation — CSRF Defense Engine (Phase 8F)
 * 
 * Provides defense-in-depth against Cross-Site Request Forgery for cookie-authenticated sessions:
 * - Issues cryptographically strong CSRF tokens
 * - Protects state-changing methods: POST, PUT, PATCH, DELETE
 * - Enforces CSRF token validation when requests authenticate via HTTP-only ambient cookies
 * - Permits Bearer token authorization (safe from ambient cross-origin injection)
 */

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE_NAME } from '../auth/token';

export const CSRF_COOKIE_NAME = 'bummpt_csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generates a high-entropy CSRF token (32 bytes hex)
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes an HMAC digest of the CSRF token using the server auth secret
 */
export function signCsrfToken(token: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

/**
 * Public routes that do not require CSRF token validation because they are
 * unauthenticated credential submission or verification portals
 */
const CSRF_EXEMPT_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/csrf-token',
  '/api/v1/parents/verify-pin',
  '/api/v1/schools/register-request',
];

/**
 * Middleware enforcing CSRF validation for cookie-authenticated state-changing requests
 */
export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();

  // Safe methods do not modify server state
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // Exempt routes
  const path = req.path.toLowerCase();
  if (CSRF_EXEMPT_ROUTES.some(exempt => path === exempt || path.endsWith(exempt))) {
    return next();
  }

  // Check if request is relying on ambient HTTP-only cookie authentication
  const hasAuthCookie = req.cookies && req.cookies[AUTH_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const isBearerHeader = authHeader && authHeader.startsWith('Bearer ');

  // If request uses Bearer token, custom header requirement was already met (CORS preflight required)
  if (isBearerHeader) {
    return next();
  }

  // If request has NO cookie at all (unauthenticated), let auth middleware handle 401
  if (!hasAuthCookie) {
    return next();
  }

  // Request is using Cookie authentication: MUST have valid CSRF token header or X-Requested-With
  const csrfHeaderToken = req.headers[CSRF_HEADER_NAME] || req.headers['x-requested-with'];
  const csrfCookieToken = req.cookies && req.cookies[CSRF_COOKIE_NAME];

  if (!csrfHeaderToken) {
    res.status(403).json({
      success: false,
      error: 'CSRF_MISSING',
      message: 'CSRF protection check failed: missing required X-CSRF-Token or X-Requested-With header for cookie-authenticated request.',
    });
    return;
  }

  // If a CSRF cookie was issued, ensure the submitted token matches
  if (csrfCookieToken && csrfHeaderToken !== csrfCookieToken && csrfHeaderToken !== 'XMLHttpRequest') {
    res.status(403).json({
      success: false,
      error: 'CSRF_INVALID',
      message: 'CSRF protection check failed: submitted CSRF token does not match cookie token.',
    });
    return;
  }

  next();
}

/**
 * Express handler to issue a new CSRF token and set the CSRF cookie
 */
export function getCsrfTokenHandler(req: Request, res: Response): void {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by client JS to set the header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({
    success: true,
    csrfToken: token,
  });
}
