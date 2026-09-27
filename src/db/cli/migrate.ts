/**
 * BummptEducation — Explicit PostgreSQL Schema Migration CLI (npm run db:migrate)
 *
 * Provider-neutral command that executes pending DDL migrations against DATABASE_URL.
 *
 * CRITICAL PRODUCTION CONTRACT:
 * - Requires DATABASE_URL (fails closed with exit code 1 if missing).
 * - Enforces DATABASE_SSL='require'|'true' when NODE_ENV='production'.
 * - Uses the authoritative migration runner (runMigrations & verifyMigrations).
 * - NEVER imports or executes development/demo/reference seeders.
 * - NEVER creates demo schools, demo users, or preview identities.
 * - Never prints DATABASE_URL or database credentials.
 * - Exits with code 0 on full success, and code 1 on any failure.
 */

import 'dotenv/config';
import {
  getDatabaseConfig,
  runMigrations,
  verifyMigrations,
  closeDatabasePool,
  sanitizeDatabaseErrorMessage,
} from '../index';

export async function executeMigrationCli(): Promise<{ exitCode: number; message: string }> {
  try {
    const rawUrl = process.env.DATABASE_URL?.trim() || '';
    if (!rawUrl) {
      const msg = 'FATAL: DATABASE_URL is required to execute database migrations.';
      console.error(`[db:migrate] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    // Validates DATABASE_URL and enforces DATABASE_SSL='require'|'true' when NODE_ENV='production'
    const config = getDatabaseConfig();
    if (!config.isConfigured || !config.connectionString) {
      const msg = 'FATAL: Database configuration is incomplete.';
      console.error(`[db:migrate] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    console.log('======================================================================');
    console.log('BummptEducation — PostgreSQL Schema Migration Runner');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'} | SSL Enabled: ${Boolean(config.ssl)}`);
    console.log('======================================================================');

    const result = await runMigrations();
    if (!result.success) {
      const safeErr = sanitizeDatabaseErrorMessage(result.error || 'Migration execution failed.');
      console.error(`[db:migrate] FAILED: ${safeErr}`);
      return { exitCode: 1, message: safeErr };
    }

    const verification = await verifyMigrations();
    if (!verification.ready) {
      const safeErr = sanitizeDatabaseErrorMessage(
        verification.error || 'Post-migration verification failed.'
      );
      console.error(`[db:migrate] VERIFICATION FAILED: ${safeErr}`);
      return { exitCode: 1, message: safeErr };
    }

    const summary = `Migrations complete: ${result.appliedCount} applied, ${result.skippedCount} skipped (${verification.appliedCount}/${verification.expectedCount} verified).`;
    console.log(`[db:migrate] SUCCESS: ${summary}`);
    return { exitCode: 0, message: summary };
  } catch (err: any) {
    const safeErr = sanitizeDatabaseErrorMessage(err?.message || 'Unexpected migration CLI failure.');
    console.error(`[db:migrate] FATAL ERROR: ${safeErr}`);
    return { exitCode: 1, message: safeErr };
  } finally {
    await closeDatabasePool();
  }
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('src/db/cli/migrate.ts');

if (isDirectExecution) {
  executeMigrationCli().then(({ exitCode }) => {
    process.exit(exitCode);
  });
}
