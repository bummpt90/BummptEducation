/**
 * BummptEducation — Hardened CORS Middleware (Phase 8F)
 * 
 * Enforces strict origin control and credentials handling:
 * - Prohibits Access-Control-Allow-Origin: * when credentials are supported
 * - Validates Origin against explicit allowlist (ALLOWED_ORIGINS) and approved preview domains
 * - Fails closed on untrusted cross-origin requests
 */

import type { Request, Response, NextFunction } from 'express';

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Same-origin or server-to-server request (no Origin header)

  // 1. Check custom ALLOWED_ORIGINS environment variable
  const customOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().toLowerCase())
    : [];

  const lowerOrigin = origin.toLowerCase();
  if (customOrigins.includes(lowerOrigin)) {
    return true;
  }

  // 2. In development or preview environments, permit local and AI Studio container domains
  if (process.env.NODE_ENV !== 'production' || process.env.AI_STUDIO_PREVIEW) {
    if (
      lowerOrigin.startsWith('http://localhost:') ||
      lowerOrigin.startsWith('http://127.0.0.1:') ||
      lowerOrigin.endsWith('.run.app') ||
      lowerOrigin.endsWith('.google.com') ||
      lowerOrigin.endsWith('.googleusercontent.com') ||
      lowerOrigin === 'https://ai.studio'
    ) {
      return true;
    }
  }

  return false;
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin as string | undefined;

  if (origin) {
    if (isAllowedOrigin(origin)) {
      // Set specific reflected origin (NEVER wildcard with credentials)
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept'
      );
      res.setHeader('Access-Control-Max-Age', '86400');
    } else {
      // Origin not permitted: do not set Access-Control-Allow-Origin
      if (req.method === 'OPTIONS') {
        res.status(403).json({
          success: false,
          error: 'CORS_FORBIDDEN',
          message: 'Origin not allowed by server CORS policy.',
        });
        return;
      }
    }
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
