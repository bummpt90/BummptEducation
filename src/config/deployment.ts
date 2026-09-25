/**
 * BummptEducation — Phase 10A Production Deployment Configuration & Readiness Engine
 *
 * Enforces the production deployment contract:
 * 1. Port & Host binding (process.env.PORT with safe default 3000 on 0.0.0.0)
 * 2. Production startup verification (DATABASE_URL, AUTH_SECRET, ENCRYPTION_SECRET, HTTPS APP_URL/Origin)
 * 3. Sanitized health & readiness endpoints (/api/health and /api/health/db) that never leak
 *    secrets, credentials, tenant records, stack traces, or internal paths.
 */

import type { Request, Response } from 'express';
import { getDatabaseConfig, checkDatabaseHealth, query } from '../db';
import { getAuthSecret } from '../auth/token';
import { getEncryptionKey } from '../security/encryption';

export const DEFAULT_PORT = 3000;
export const DEFAULT_HOST = '0.0.0.0';

/**
 * Resolves the active server port from process.env.PORT with a safe default of 3000.
 */
export function getServerPort(envPort: string | undefined = process.env.PORT): number {
  if (!envPort || envPort.trim() === '') {
    return DEFAULT_PORT;
  }
  const parsed = Number(envPort.trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return DEFAULT_PORT;
  }
  return parsed;
}

/**
 * Resolves the bind host. Always binds to 0.0.0.0 unless explicitly overridden.
 */
export function getServerHost(envHost: string | undefined = process.env.HOST): string {
  if (envHost && envHost.trim().length > 0) {
    return envHost.trim();
  }
  return DEFAULT_HOST;
}

export interface ProductionValidationResult {
  valid: boolean;
  environment: string;
  port: number;
  host: string;
  httpsOriginConfigured: boolean;
  errors: string[];
}

/**
 * Validates all required production environment variables and security boundaries without exposing secret values.
 */
export function validateProductionStartupConfig(): ProductionValidationResult {
  const environment = process.env.NODE_ENV || 'development';
  const isProd = environment === 'production';
  const port = getServerPort();
  const host = getServerHost();
  const errors: string[] = [];

  if (isProd) {
    // 1. Validate DATABASE_URL
    try {
      const dbCfg = getDatabaseConfig();
      if (!dbCfg.isConfigured || !dbCfg.connectionString) {
        errors.push('DATABASE_URL is required in production.');
      }
    } catch {
      errors.push('DATABASE_URL is required in production.');
    }

    // 2. Validate AUTH_SECRET
    try {
      getAuthSecret();
    } catch {
      errors.push('AUTH_SECRET is required and must be at least 32 characters in production (JWT_SECRET fallback is prohibited).');
    }

    // 3. Validate ENCRYPTION_SECRET
    try {
      getEncryptionKey();
    } catch {
      errors.push('ENCRYPTION_SECRET is required in production and must be an independent 32-byte Base64 secret.');
    }

    // 4. Validate APP_URL (if provided in strict production, must use HTTPS and not wildcard)
    if (process.env.APP_URL && process.env.APP_URL.trim().length > 0) {
      const appUrl = process.env.APP_URL.trim().toLowerCase();
      if (appUrl === '*' || (!process.env.AI_STUDIO_PREVIEW && !appUrl.startsWith('https://'))) {
        errors.push('APP_URL must be a valid https:// origin in production.');
      }
    }

    // 5. Validate ALLOWED_ORIGINS (if provided in strict production, no wildcard and must use HTTPS)
    if (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.trim().length > 0) {
      const parts = process.env.ALLOWED_ORIGINS.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
      for (const origin of parts) {
        if (origin === '*') {
          errors.push('Wildcard (*) in ALLOWED_ORIGINS is strictly prohibited.');
        } else if (!process.env.AI_STUDIO_PREVIEW && !origin.startsWith('https://')) {
          errors.push('All ALLOWED_ORIGINS entries in production must use https://.');
        }
      }
    }
  }

  const httpsOriginConfigured = Boolean(
    (process.env.APP_URL && process.env.APP_URL.trim().toLowerCase().startsWith('https://')) ||
    (process.env.ALLOWED_ORIGINS &&
      process.env.ALLOWED_ORIGINS
        .split(',')
        .map(o => o.trim().toLowerCase())
        .some(o => o.startsWith('https://')))
  );

  return {
    valid: errors.length === 0,
    environment,
    port,
    host,
    httpsOriginConfigured,
    errors,
  };
}

/**
 * Enforces production configuration at server startup. Throws a fatal error if NODE_ENV=production
 * and any required secret or configuration is missing or invalid.
 */
export function enforceProductionStartupConfig(): ProductionValidationResult {
  const result = validateProductionStartupConfig();
  if (process.env.NODE_ENV === 'production' && !result.valid) {
    throw new Error(
      `FATAL PRODUCTION STARTUP ERROR: Unsafe or incomplete production configuration: ${result.errors.join(' ')}`
    );
  }
  return result;
}

/**
 * Sanitized Application Health & Readiness Endpoint Handler (GET /api/health)
 * Distinguishes between application healthy and production configuration missing/invalid.
 * Never exposes secrets, credentials, stack traces, or internal paths.
 */
export function handleAppHealthCheck(_req: Request, res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  const validation = validateProductionStartupConfig();

  if (isProd && !validation.valid) {
    res.status(503).json({
      status: 'configuration_invalid',
      readiness: 'not_ready',
      server: 'BummptEducation Backend Express API',
      environment: 'production',
      timestamp: new Date().toISOString(),
      message: 'Production configuration is missing or invalid.',
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    readiness: 'ready',
    server: 'BummptEducation Backend Express API',
    environment: isProd ? 'production' : 'development',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Sanitized Database Health & Readiness Endpoint Handler (GET /api/health/db)
 * Clearly distinguishes between:
 * - application & database healthy ('ok' / 200)
 * - database unavailable ('degraded' / 503)
 * - production configuration missing/invalid ('configuration_invalid' / 503)
 * Never exposes DATABASE_URL, credentials, database names, SQL errors, or stack traces.
 */
export async function handleDatabaseHealthCheck(_req: Request, res: Response): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production';
  const validation = validateProductionStartupConfig();

  if (isProd && !validation.valid) {
    res.status(503).json({
      status: 'configuration_invalid',
      database: 'unconfigured',
      engine: 'PostgreSQL',
      configured: false,
      migrationReady: false,
      timestamp: new Date().toISOString(),
      message: 'Production configuration is missing or invalid.',
    });
    return;
  }

  try {
    const dbHealth = await checkDatabaseHealth();

    let migrationReady = false;
    if (dbHealth.status === 'connected') {
      try {
        const migRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM schema_migrations;');
        migrationReady = parseInt(migRes.rows[0]?.count || '0', 10) > 0;
      } catch {
        migrationReady = false;
      }
    }

    const isOk = dbHealth.status === 'connected' && (!isProd || migrationReady);
    const httpStatus = isOk ? 200 : (isProd ? 503 : (dbHealth.status === 'unconfigured' ? 200 : 503));

    const safeDatabaseState =
      dbHealth.status === 'connected'
        ? 'connected'
        : dbHealth.status === 'unconfigured'
        ? 'unconfigured'
        : 'unavailable';

    res.status(httpStatus).json({
      status:
        dbHealth.status === 'connected'
          ? migrationReady
            ? 'ok'
            : 'pending_migrations'
          : dbHealth.status === 'unconfigured'
          ? 'unconfigured'
          : 'degraded',
      database: safeDatabaseState,
      engine: 'PostgreSQL',
      configured: dbHealth.configured,
      migrationReady,
      latencyMs: typeof dbHealth.latencyMs === 'number' ? dbHealth.latencyMs : undefined,
      timestamp: new Date().toISOString(),
      message:
        dbHealth.status === 'connected'
          ? migrationReady
            ? 'PostgreSQL database connected and operational'
            : 'Database connected, schema migration pending'
          : dbHealth.status === 'unconfigured'
          ? 'Database unconfigured. Running in development/preview mode.'
          : 'Database connection unavailable.',
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      database: 'unavailable',
      engine: 'PostgreSQL',
      configured: false,
      migrationReady: false,
      timestamp: new Date().toISOString(),
      message: 'Database connection unavailable.',
    });
  }
}
