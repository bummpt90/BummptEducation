/**
 * BummptEducation — PostgreSQL Database Client & Connection Pool
 * 
 * Provides a resilient connection pool, parameterized query execution,
 * atomic transaction management, and non-destructive health diagnostics.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { getDatabaseConfig } from './config';
import { DatabaseConnectionError, DatabaseQueryError, DatabaseTransactionError } from './errors';
import type { DatabaseHealthStatus } from './types';

let pool: Pool | null = null;
let isPoolInitialized = false;

/**
 * Initializes or returns the singleton PostgreSQL connection pool.
 * Returns null if DATABASE_URL is not configured in the current environment.
 */
export function getDatabasePool(): Pool | null {
  const config = getDatabaseConfig();

  if (!config.isConfigured || !config.connectionString) {
    return null;
  }

  if (!pool) {
    try {
      pool = new Pool({
        connectionString: config.connectionString,
        max: config.maxPoolSize,
        idleTimeoutMillis: config.idleTimeoutMillis,
        connectionTimeoutMillis: config.connectionTimeoutMillis,
        ssl: config.ssl,
      });

      pool.on('error', (err: Error) => {
        console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
      });

      isPoolInitialized = true;
    } catch (err: any) {
      console.warn('[PostgreSQL] Pool initialization warning:', err?.message || 'Unknown error');
      pool = null;
    }
  }

  return pool;
}

/**
 * Executes a parameterized SQL query safely against either an active transaction client
 * or the shared connection pool.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  client?: PoolClient
): Promise<QueryResult<T>> {
  const executor = client || getDatabasePool();
  if (!executor) {
    throw new DatabaseConnectionError('Database is not configured. DATABASE_URL is required for live queries.');
  }

  const start = Date.now();
  try {
    const res = await executor.query<T>(text, params);
    const duration = Date.now() - start;

    if (process.env.DEBUG_SQL === 'true') {
      // Safe query logging without sensitive parameters
      const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 100);
      console.log(`[SQL] (${duration}ms) [rows: ${res.rowCount}] ${snippet}${snippet.length === 100 ? '...' : ''}`);
    }

    return res;
  } catch (error: any) {
    const errorSnippet = text.replace(/\s+/g, ' ').trim().slice(0, 80);
    console.error('[SQL Error]', {
      code: error?.code,
      message: error?.message || 'Query execution error',
      snippet: errorSnippet,
    });
    throw new DatabaseQueryError(error?.message || 'Database query failed', error?.code, errorSnippet);
  }
}

/**
 * Executes a callback within a managed atomic SQL transaction (BEGIN / COMMIT / ROLLBACK).
 * Automatically releases the acquired client back to the pool upon completion or failure.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const activePool = getDatabasePool();
  if (!activePool) {
    throw new DatabaseConnectionError('Database is not configured. DATABASE_URL is required for transactions.');
  }

  let client: PoolClient;
  try {
    client = await activePool.connect();
  } catch (connErr: any) {
    throw new DatabaseConnectionError(`Failed to acquire client for transaction: ${connErr?.message || 'Connection timeout'}`);
  }

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr: any) {
      console.error('[PostgreSQL] Failed to rollback transaction:', rollbackErr?.message);
    }

    if (error instanceof DatabaseQueryError || error instanceof DatabaseConnectionError) {
      throw error;
    }
    throw new DatabaseTransactionError(error?.message || 'Transaction failed and was rolled back');
  } finally {
    client.release();
  }
}

/**
 * Performs a safe, non-destructive health check against PostgreSQL.
 * Never exposes credentials, passwords, or internal connection strings.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const config = getDatabaseConfig();

  if (!config.isConfigured || !config.connectionString) {
    return {
      status: 'unconfigured',
      database: 'PostgreSQL (Not Configured)',
      configured: false,
    };
  }

  const activePool = getDatabasePool();
  if (!activePool) {
    return {
      status: 'unconfigured',
      database: 'PostgreSQL',
      configured: false,
      error: 'Connection pool could not be initialized from configuration.',
    };
  }

  const start = Date.now();
  try {
    const result = await activePool.query('SELECT version(), current_database() as db_name');
    const latencyMs = Date.now() - start;
    const row = result.rows[0] || {};

    return {
      status: 'connected',
      database: row.db_name || 'PostgreSQL',
      configured: true,
      latencyMs,
      serverVersion: row.version ? row.version.split(' on ')[0] : 'PostgreSQL',
      poolSize: activePool.totalCount,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    return {
      status: 'error',
      database: 'PostgreSQL',
      configured: true,
      latencyMs,
      error: error?.message ? `Connection failed: ${error.message}` : 'Connection failed',
    };
  }
}

/**
 * Gracefully shuts down the connection pool (for server shutdown signals).
 */
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      isPoolInitialized = false;
      console.log('[PostgreSQL] Connection pool gracefully terminated.');
    } catch (err: any) {
      console.error('[PostgreSQL] Error closing connection pool:', err?.message);
    }
  }
}
