/**
 * BummptEducation — Read-Only PostgreSQL Migration Verification CLI (npm run db:migrate:verify)
 *
 * Provider-neutral verification command that checks:
 * 1. Database connectivity
 * 2. Existence of schema_migrations tracking table
 * 3. All expected migrations (0001..0011) are applied
 * 4. All SHA-256 migration checksums match
 * 5. Zero pending or mismatched migrations
 *
 * CRITICAL SAFETY:
 * - Strictly read-only: NEVER modifies schema or business data.
 * - Never exposes DATABASE_URL or credentials.
 * - Exits with code 0 when ready, and code 1 when not ready.
 */

import 'dotenv/config';
import {
  getDatabaseConfig,
  verifyMigrations,
  closeDatabasePool,
  sanitizeDatabaseErrorMessage,
} from '../index';

export async function executeMigrationVerifyCli(): Promise<{ exitCode: number; message: string }> {
  try {
    const rawUrl = process.env.DATABASE_URL?.trim() || '';
    if (!rawUrl) {
      const msg = 'FATAL: DATABASE_URL is required to verify database migrations.';
      console.error(`[db:migrate:verify] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    // Enforces production SSL rules when NODE_ENV === 'production'
    const config = getDatabaseConfig();
    if (!config.isConfigured || !config.connectionString) {
      const msg = 'FATAL: Database configuration is incomplete.';
      console.error(`[db:migrate:verify] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    const report = await verifyMigrations();

    console.log('======================================================================');
    console.log('BummptEducation — PostgreSQL Migration Verification Report');
    console.log('======================================================================');
    console.log(`Connected             : ${report.connected}`);
    console.log(`Tracking Table Exists : ${report.trackingTableExists}`);
    console.log(`Expected Migrations   : ${report.expectedCount}`);
    console.log(`Applied Migrations    : ${report.appliedCount}`);
    console.log(`Pending Migrations    : ${report.pendingVersions.length === 0 ? 'None' : report.pendingVersions.join(', ')}`);
    console.log(`Checksum Mismatches   : ${report.checksumMismatches.length === 0 ? 'None' : report.checksumMismatches.map(m => m.version).join(', ')}`);
    console.log(`Migration Ready       : ${report.ready}`);
    console.log('======================================================================');

    if (!report.ready) {
      const safeErr = sanitizeDatabaseErrorMessage(report.error || 'Database migrations are not ready.');
      console.error(`[db:migrate:verify] NOT READY: ${safeErr}`);
      return { exitCode: 1, message: safeErr };
    }

    const summary = `All ${report.appliedCount}/${report.expectedCount} migrations applied and SHA-256 checksums verified.`;
    console.log(`[db:migrate:verify] READY: ${summary}`);
    return { exitCode: 0, message: summary };
  } catch (err: any) {
    const safeErr = sanitizeDatabaseErrorMessage(err?.message || 'Migration verification failed.');
    console.error(`[db:migrate:verify] FATAL ERROR: ${safeErr}`);
    return { exitCode: 1, message: safeErr };
  } finally {
    await closeDatabasePool();
  }
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('src/db/cli/migrate-verify.ts');

if (isDirectExecution) {
  executeMigrationVerifyCli().then(({ exitCode }) => {
    process.exit(exitCode);
  });
}
