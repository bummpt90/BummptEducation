/**
 * BummptEducation — PostgreSQL Database Configuration
 * 
 * Manages database connection settings, environment variables,
 * pool sizing, and SSL parameters.
 */

import 'dotenv/config';

export interface DatabaseConfig {
  connectionString: string | null;
  maxPoolSize: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl: boolean | { rejectUnauthorized: boolean };
  isConfigured: boolean;
}

export function getDatabaseConfig(): DatabaseConfig {
  const connectionString = process.env.DATABASE_URL?.trim() || null;
  const isConfigured = Boolean(connectionString && connectionString.length > 0);

  // Pool size settings
  const maxPoolSize = process.env.DATABASE_POOL_SIZE 
    ? parseInt(process.env.DATABASE_POOL_SIZE, 10) 
    : (process.env.NODE_ENV === 'production' ? 10 : 5);

  const idleTimeoutMillis = process.env.DATABASE_IDLE_TIMEOUT_MS 
    ? parseInt(process.env.DATABASE_IDLE_TIMEOUT_MS, 10) 
    : 30000;

  const connectionTimeoutMillis = process.env.DATABASE_CONNECTION_TIMEOUT_MS
    ? parseInt(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 10)
    : 5000;

  // SSL configuration
  // When running against cloud providers (Neon, Cloud SQL, Supabase, RDS), SSL is required.
  const sslExplicit = process.env.DATABASE_SSL;
  let ssl: boolean | { rejectUnauthorized: boolean } = false;

  if (sslExplicit === 'true' || sslExplicit === 'require') {
    // For hosted cloud databases (like Neon, AWS RDS, Supabase), rejectUnauthorized is set to false
    // unless explicitly enforced to allow flexible SSL certificate verification.
    ssl = { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' };
  } else if (sslExplicit === 'false' || sslExplicit === 'disable') {
    ssl = false;
  } else if (connectionString && (connectionString.includes('neon.tech') || connectionString.includes('supabase') || connectionString.includes('sslmode=require'))) {
    ssl = { rejectUnauthorized: false };
  } else if (process.env.NODE_ENV === 'production') {
    ssl = { rejectUnauthorized: false };
  }

  return {
    connectionString,
    maxPoolSize: isNaN(maxPoolSize) ? 5 : maxPoolSize,
    idleTimeoutMillis: isNaN(idleTimeoutMillis) ? 30000 : idleTimeoutMillis,
    connectionTimeoutMillis: isNaN(connectionTimeoutMillis) ? 5000 : connectionTimeoutMillis,
    ssl,
    isConfigured,
  };
}

export interface SanitizedConfigSummary {
  configured: boolean;
  engine: string;
  maxPoolSize: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  sslEnabled: boolean;
  hasSslRejection: boolean;
  hostType: 'neon' | 'cloud' | 'local' | 'none';
}

export function getSanitizedConfigSummary(): SanitizedConfigSummary {
  const cfg = getDatabaseConfig();
  let hostType: 'neon' | 'cloud' | 'local' | 'none' = 'none';
  if (cfg.connectionString) {
    if (cfg.connectionString.includes('neon.tech')) {
      hostType = 'neon';
    } else if (cfg.connectionString.includes('localhost') || cfg.connectionString.includes('127.0.0.1')) {
      hostType = 'local';
    } else {
      hostType = 'cloud';
    }
  }

  const sslEnabled = Boolean(cfg.ssl);
  const hasSslRejection = typeof cfg.ssl === 'object' ? Boolean(cfg.ssl.rejectUnauthorized) : false;

  return {
    configured: cfg.isConfigured,
    engine: 'PostgreSQL',
    maxPoolSize: cfg.maxPoolSize,
    idleTimeoutMillis: cfg.idleTimeoutMillis,
    connectionTimeoutMillis: cfg.connectionTimeoutMillis,
    sslEnabled,
    hasSslRejection,
    hostType,
  };
}
