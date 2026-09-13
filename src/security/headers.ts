/**
 * BummptEducation — HTTP Security Headers Middleware (Phase 8F)
 * 
 * Enforces OWASP-recommended HTTP security headers across all API endpoints:
 * - X-Content-Type-Options: nosniff
 * - Strict-Transport-Security: HSTS for production SSL
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - X-Frame-Options: SAMEORIGIN (or frame-ancestors for AI Studio preview)
 * - Permissions-Policy: camera=(), microphone=(), geolocation=()
 * - X-XSS-Protection: 0 (OWASP recommendation for modern browsers)
 */

import type { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Suppress Express framework identification
  res.removeHeader('X-Powered-By');

  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Frame protection: SAMEORIGIN
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Modern referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict sensitive browser APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Disable obsolete buggy XSS auditor in favor of CSP
  res.setHeader('X-XSS-Protection', '0');

  // Enforce Strict-Transport-Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content-Security-Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://*.run.app https://ai.studio;"
  );

  next();
}
