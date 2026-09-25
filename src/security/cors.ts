/**
 * BummptEducation — Hardened CORS Middleware (Phase 8F / Phase 10A)
 * 
 * Enforces strict origin control and credentials handling:
 * - Prohibits Access-Control-Allow-Origin: * when credentials are supported
 * - Validates Origin against explicit allowlist (APP_URL, ALLOWED_ORIGINS) and approved preview domains
 * - Enforces HTTPS for cross-origin requests in production
 * - Fails closed on untrusted cross-origin requests
 */

import type { Request, Response, NextFunction } from 'express';

function normalizeOrigin(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, '').toLowerCase();
  if (!trimmed || trimmed === '*') return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.origin.toLowerCase();
  } catch {
    return trimmed;
  }
}

export function getConfiguredTrustedOrigins(): string[] {
  const origins = new Set<string>();

  if (process.env.APP_URL) {
    const appOrigin = normalizeOrigin(process.env.APP_URL);
    if (appOrigin) {
      origins.add(appOrigin);
    }
  }

  if (process.env.ALLOWED_ORIGINS) {
    for (const part of process.env.ALLOWED_ORIGINS.split(',')) {
      const normalized = normalizeOrigin(part);
      if (normalized) {
        origins.add(normalized);
      }
    }
  }

  return Array.from(origins);
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Same-origin or server-to-server request (no Origin header)

  const trimmedOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();
  if (!trimmedOrigin || trimmedOrigin === '*') {
    return false; // Wildcard origin is strictly prohibited
  }

  const isProd = process.env.NODE_ENV === 'production' && !process.env.AI_STUDIO_PREVIEW;

  // In strict production mode, cross-origin requests MUST use HTTPS
  if (isProd && !trimmedOrigin.startsWith('https://')) {
    return false;
  }

  // 1. Check explicitly configured APP_URL and ALLOWED_ORIGINS
  const customOrigins = getConfiguredTrustedOrigins();
  if (customOrigins.includes(trimmedOrigin)) {
    return true;
  }

  // 2. In development or preview environments, permit local and AI Studio container domains
  if (!isProd) {
    if (
      trimmedOrigin.startsWith('http://localhost:') ||
      trimmedOrigin.startsWith('http://127.0.0.1:') ||
      trimmedOrigin.endsWith('.run.app') ||
      trimmedOrigin.endsWith('.google.com') ||
      trimmedOrigin.endsWith('.googleusercontent.com') ||
      trimmedOrigin === 'https://ai.studio'
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
      res.setHeader('Vary', 'Origin');
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
