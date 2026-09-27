/**
 * BummptEducation — Phase 10B Production Database & Migration Verification Suite
 *
 * Meaningfully verifies the Phase 10B database & migration contract:
 * 1. Migration directory & deterministic 0001..0011 sequence inventory
 * 2. Pure schema DDL boundary (zero business/demo/seed data inserted by migrations)
 * 3. SHA-256 checksum computation & deterministic ordering validator
 * 4. Production DATABASE_URL & DATABASE_SSL enforcement + credential redaction
 * 5. Explicit CLI commands (npm run db:migrate & npm run db:migrate:verify) & seeder isolation
 * 6. Real empty-database migration execution (0 -> 11), zero-row business table verification,
 *    idempotent re-run, checksum mismatch fail-closed behavior, atomic rollback on failure,
 *    and /api/health/db migrationReady accuracy.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';
import crypto from 'crypto';
import express from 'express';
import {
  MIGRATIONS,
  computeMigrationChecksum,
  validateMigrationOrdering,
  runMigrations,
  verifyMigrations,
  getDatabaseConfig,
  sanitizeDatabaseErrorMessage,
  query,
  closeDatabasePool,
} from '../src/db';
import { executeMigrationCli } from '../src/db/cli/migrate';
import { executeMigrationVerifyCli } from '../src/db/cli/migrate-verify';
import { handleDatabaseHealthCheck } from '../src/config/deployment';

interface TestResult {
  category: string;
  test: string;
  status: 'PASSED' | 'FAILED';
  details?: string;
}

const results: TestResult[] = [];

function record(category: string, test: string, passed: boolean, details?: string) {
  results.push({
    category,
    test,
    status: passed ? 'PASSED' : 'FAILED',
    details,
  });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${category}] ${test} ${details ? `(${details})` : ''}`);
}

const EXPECTED_MIGRATION_FILES = [
  '0001_initial_foundation.sql',
  '0002_production_schema.sql',
  '0003_auth_and_identity_foundation.sql',
  '0004_operational_foundations.sql',
  '0005_academic_operations_foundation.sql',
  '0006_admissions_fees_bursary_foundation.sql',
  '0007_account_requests_foundation.sql',
  '0008_parent_identity_and_access.sql',
  '0009_attendance_server_authority.sql',
  '0010_lesson_notes_and_inquiries.sql',
  '0011_hq_telemetry_directives_messaging.sql',
];

async function runPhase10bSuite() {
  console.log('======================================================================');
  console.log('BummptEducation — Phase 10B Production Database & Migration Verification');
  console.log('======================================================================\n');

  const savedEnv = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_SSL: process.env.DATABASE_SSL,
    DATABASE_POOL_SIZE: process.env.DATABASE_POOL_SIZE,
    AUTH_SECRET: process.env.AUTH_SECRET,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
    APP_URL: process.env.APP_URL,
  };

  function restoreEnv() {
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }

  try {
    // =========================================================================
    // 1. Migration Directory & Deterministic Sequence Inventory
    // =========================================================================
    const migrationsDir = path.join(process.cwd(), 'src/db/migrations');
    const dirExists = fs.existsSync(migrationsDir) && fs.statSync(migrationsDir).isDirectory();
    const actualFiles = dirExists
      ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
      : [];

    const exactFilesMatch =
      actualFiles.length === EXPECTED_MIGRATION_FILES.length &&
      EXPECTED_MIGRATION_FILES.every((f, idx) => actualFiles[idx] === f);

    record(
      '1. Migration Inventory',
      'src/db/migrations/ directory exists and contains all 11 expected migration files (0001..0011) in exact order',
      dirExists && exactFilesMatch,
      `Found ${actualFiles.length}/11 SQL files`
    );

    const registryMatchesFiles =
      MIGRATIONS.length === 11 &&
      MIGRATIONS.every((m, idx) => {
        const expectedVersion = String(idx + 1).padStart(4, '0');
        const expectedPrefix = `${m.version}_${m.name}.sql`;
        return m.version === expectedVersion && EXPECTED_MIGRATION_FILES[idx] === expectedPrefix;
      });

    record(
      '1. Migration Inventory',
      'MIGRATIONS registry in src/db/migrator.ts matches all 11 migration versions and filenames',
      registryMatchesFiles
    );

    // =========================================================================
    // 2. Deterministic Ordering & SHA-256 Checksum Logic
    // =========================================================================
    const validOrderCheck = validateMigrationOrdering(MIGRATIONS);
    const outOfOrderCheck = validateMigrationOrdering([
      MIGRATIONS[0],
      MIGRATIONS[2], // skips 0002
    ]);
    const duplicateVersionCheck = validateMigrationOrdering([
      MIGRATIONS[0],
      { ...MIGRATIONS[1], version: '0001' },
    ]);
    const emptyRegistryCheck = validateMigrationOrdering([]);

    record(
      '2. Ordering & Checksums',
      'validateMigrationOrdering() approves sequential 0001..0011 and rejects gaps, duplicates, or empty lists',
      validOrderCheck.valid === true &&
        outOfOrderCheck.valid === false &&
        duplicateVersionCheck.valid === false &&
        emptyRegistryCheck.valid === false
    );

    const checksumA = computeMigrationChecksum('CREATE TABLE test (id INT);\r\n');
    const checksumB = computeMigrationChecksum('  CREATE TABLE test (id INT);\n');
    const checksumC = computeMigrationChecksum('CREATE TABLE test (id BIGINT);');

    record(
      '2. Ordering & Checksums',
      'computeMigrationChecksum() produces deterministic 64-char SHA-256 digests normalized across line endings and sensitive to DDL changes',
      checksumA.length === 64 && checksumA === checksumB && checksumA !== checksumC
    );

    // =========================================================================
    // 3. Pure Schema DDL Boundary (Zero Seed/Business Data in Migrations)
    // =========================================================================
    let hasAnyBusinessInsertInFiles = false;
    for (const file of actualFiles) {
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      if (/INSERT\s+INTO\s+/i.test(sqlContent)) {
        hasAnyBusinessInsertInFiles = true;
      }
    }
    const hasAnyBusinessInsertInRegistry = MIGRATIONS.some((m) => /INSERT\s+INTO\s+/i.test(m.sql));

    record(
      '3. Pure DDL Boundary',
      'All 11 migration files and MIGRATIONS registry entries contain zero INSERT INTO statements',
      !hasAnyBusinessInsertInFiles && !hasAnyBusinessInsertInRegistry
    );

    // =========================================================================
    // 4. Production DATABASE_URL, DATABASE_SSL & Sanitization Enforcement
    // =========================================================================
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      process.env.DATABASE_SSL = 'require';

      let missingUrlThrew = false;
      try {
        getDatabaseConfig();
      } catch (err: any) {
        if (err?.message?.includes('DATABASE_URL')) {
          missingUrlThrew = true;
        }
      }

      const cliMissingUrl = await executeMigrationCli();
      const verifyCliMissingUrl = await executeMigrationVerifyCli();

      record(
        '4. Production DB Security',
        'Production requires DATABASE_URL (getDatabaseConfig throws, db:migrate and db:migrate:verify return exitCode 1)',
        missingUrlThrew && cliMissingUrl.exitCode === 1 && verifyCliMissingUrl.exitCode === 1
      );

      process.env.DATABASE_URL = 'postgresql://prod_user:secret_pass_99@db.example.edu.ng:5432/bummpt_prod';
      process.env.DATABASE_SSL = 'disable';

      let insecureSslThrew = false;
      try {
        getDatabaseConfig();
      } catch (err: any) {
        if (err?.message?.includes('DATABASE_SSL')) {
          insecureSslThrew = true;
        }
      }

      const cliInsecureSsl = await executeMigrationCli();
      const verifyCliInsecureSsl = await executeMigrationVerifyCli();

      record(
        '4. Production DB Security',
        'Production requires DATABASE_SSL=require|true (rejects DATABASE_SSL=disable across config, db:migrate, and db:migrate:verify)',
        insecureSslThrew && cliInsecureSsl.exitCode === 1 && verifyCliInsecureSsl.exitCode === 1
      );

      const rawErr = 'FATAL: connection to postgresql://admin_prod:TopSecretPass2026!@10.0.0.15:5432/prod_db failed (password=TopSecretPass2026!)';
      const sanitizedErr = sanitizeDatabaseErrorMessage(rawErr);
      const credentialsRedacted =
        !sanitizedErr.includes('TopSecretPass2026!') &&
        !sanitizedErr.includes('admin_prod') &&
        sanitizedErr.includes('[REDACTED_DATABASE_URI]') &&
        sanitizedErr.includes('password=[REDACTED]');

      record(
        '4. Production DB Security',
        'sanitizeDatabaseErrorMessage() strips connection strings, usernames, and passwords from error messages',
        credentialsRedacted
      );
    } finally {
      restoreEnv();
    }

    // =========================================================================
    // 5. CLI Commands & Strict Production Seeding Boundary
    // =========================================================================
    const pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
    const hasMigrateScripts =
      pkgJson.scripts?.['db:migrate'] === 'tsx src/db/cli/migrate.ts' &&
      pkgJson.scripts?.['db:migrate:verify'] === 'tsx src/db/cli/migrate-verify.ts';

    record(
      '5. CLI & Seeder Boundary',
      'package.json defines provider-neutral "db:migrate" and "db:migrate:verify" scripts',
      hasMigrateScripts
    );

    const migrateCliSource = fs.readFileSync(path.join(process.cwd(), 'src/db/cli/migrate.ts'), 'utf-8');
    const verifyCliSource = fs.readFileSync(path.join(process.cwd(), 'src/db/cli/migrate-verify.ts'), 'utf-8');
    const migratorSource = fs.readFileSync(path.join(process.cwd(), 'src/db/migrator.ts'), 'utf-8');

    const forbiddenSeederPatterns = [
      'seed/seed',
      'auth.seed',
      'operational.seed',
      'financial.seed',
      'lessonNotes.seed',
      'runReferenceDataSeeder',
      'seedDevelopmentAuthIdentities',
      'seedOperationalFoundation',
      'seedFinancialFoundation',
      'seedLessonNotesFoundation',
    ];

    const zeroSeederImports = forbiddenSeederPatterns.every(
      (pat) =>
        !migrateCliSource.includes(pat) &&
        !verifyCliSource.includes(pat) &&
        !migratorSource.includes(pat)
    );

    record(
      '5. CLI & Seeder Boundary',
      'Migration runner and CLI commands never import or execute any development/reference seeder',
      zeroSeederImports
    );

    // Execute CLI against current active schema to ensure checksum backfill and verification succeed
    const activeMigrateCliRes = await executeMigrationCli();
    const activeVerifyCliRes = await executeMigrationVerifyCli();

    record(
      '5. CLI & Seeder Boundary',
      'executeMigrationCli() and executeMigrationVerifyCli() succeed with exitCode 0 when all 11 migrations are applied',
      activeMigrateCliRes.exitCode === 0 && activeVerifyCliRes.exitCode === 0,
      activeVerifyCliRes.message
    );

    // =========================================================================
    // 6. Behavioral Empty-Database Migration, Checksum Mismatch, Rollback & Health Readiness
    // =========================================================================
    await closeDatabasePool();
    process.env.DATABASE_POOL_SIZE = '1';

    const healthApp = express();
    healthApp.get('/api/health/db', handleDatabaseHealthCheck);
    const testServer = http.createServer(healthApp);
    await new Promise<void>((resolve) => testServer.listen(0, '127.0.0.1', () => resolve()));
    const port = (testServer.address() as any).port;
    const healthDbUrl = `http://127.0.0.1:${port}/api/health/db`;

    try {
      // Create a completely empty isolated schema and set search_path on our single-connection pool
      await query('DROP SCHEMA IF EXISTS phase10b_empty_db_test CASCADE;');
      await query('CREATE SCHEMA phase10b_empty_db_test;');
      await query('SET search_path TO phase10b_empty_db_test, public;');

      // 6a. Verify uninitialized empty database reports ready=false and migrationReady=false
      const preVerify = await verifyMigrations();
      const preHealthRes = await fetch(healthDbUrl);
      const preHealthJson = await preHealthRes.json();

      record(
        '6. Empty DB & Readiness',
        'Before migrations run on an empty database, verifyMigrations().ready is false and /api/health/db reports migrationReady=false',
        preVerify.ready === false &&
          preVerify.trackingTableExists === false &&
          preVerify.pendingVersions.length === 11 &&
          preHealthJson.migrationReady === false &&
          preHealthJson.status === 'pending_migrations'
      );

      // 6b. Run all 11 migrations on the completely empty database schema
      const emptyDbMigResult = await runMigrations();
      const postVerify = await verifyMigrations();
      const postHealthRes = await fetch(healthDbUrl);
      const postHealthJson = await postHealthRes.json();

      record(
        '6. Empty DB & Readiness',
        'All 11 migrations (0001..0011) execute cleanly on a completely empty database and record SHA-256 checksums',
        emptyDbMigResult.success === true &&
          emptyDbMigResult.appliedCount === 11 &&
          emptyDbMigResult.skippedCount === 0 &&
          postVerify.ready === true &&
          postVerify.appliedCount === 11 &&
          postHealthJson.migrationReady === true &&
          postHealthJson.status === 'ok',
        `Applied: ${emptyDbMigResult.appliedCount}/11`
      );

      // 6c. Verify ZERO business/operational/reference records are inserted by migrations
      const businessTables = [
        'organizations',
        'schools',
        'users',
        'classes',
        'staff',
        'students',
        'student_enrollments',
        'parent_guardians',
        'fee_categories',
        'fee_structures',
        'fee_invoices',
        'fee_payments',
        'daily_attendance',
        'assessment_scores',
        'report_cards',
        'lesson_notes',
        'ministry_directives',
        'hq_dispatches',
      ];

      let totalBusinessRowsInserted = 0;
      for (const table of businessTables) {
        const countRes = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM ${table};`);
        totalBusinessRowsInserted += parseInt(countRes.rows[0]?.count || '0', 10);
      }

      record(
        '6. Empty DB & Readiness',
        'Migration execution on an empty database creates all tables with 0 rows of business, school, staff, student, or demo data',
        totalBusinessRowsInserted === 0,
        `Verified 0 rows across ${businessTables.length} tables`
      );

      // 6d. Verify idempotent re-run skips all 11 already-applied migrations
      const idempotentResult = await runMigrations();
      record(
        '6. Empty DB & Readiness',
        'Re-running runMigrations() skips all 11 already-applied migrations safely (appliedCount=0, skippedCount=11)',
        idempotentResult.success === true &&
          idempotentResult.appliedCount === 0 &&
          idempotentResult.skippedCount === 11
      );

      // 6e. Verify altered checksum fails closed in both runMigrations() and verifyMigrations() and sets migrationReady=false
      await query(
        `UPDATE schema_migrations SET checksum = '0000000000000000000000000000000000000000000000000000000000000000' WHERE version = '0005';`
      );

      const tamperedRunResult = await runMigrations();
      const tamperedVerifyReport = await verifyMigrations();
      const tamperedHealthRes = await fetch(healthDbUrl);
      const tamperedHealthJson = await tamperedHealthRes.json();

      record(
        '6. Empty DB & Readiness',
        'Tampered migration checksum fails closed in runMigrations(), verifyMigrations(), and sets /api/health/db migrationReady=false',
        tamperedRunResult.success === false &&
          Boolean(tamperedRunResult.error?.includes('FATAL MIGRATION CHECKSUM MISMATCH')) &&
          tamperedVerifyReport.ready === false &&
          tamperedVerifyReport.checksumMismatches.length === 1 &&
          tamperedVerifyReport.checksumMismatches[0].version === '0005' &&
          tamperedHealthJson.migrationReady === false
      );

      // Restore valid checksum for 0005
      const valid0005Checksum = computeMigrationChecksum(MIGRATIONS[4].sql);
      await query(`UPDATE schema_migrations SET checksum = $1 WHERE version = '0005';`, [
        valid0005Checksum,
      ]);

      // 6f. Verify failed migration rolls back atomically and is never marked as applied
      const failingMigrationsList = [
        ...MIGRATIONS,
        {
          version: '0012',
          name: 'atomic_rollback_verification',
          sql: `
            CREATE TABLE phase10b_rollback_probe (id SERIAL PRIMARY KEY);
            SELECT * FROM table_that_does_not_exist_and_triggers_rollback;
          `,
        },
      ];

      const failedMigResult = await runMigrations(failingMigrationsList);
      const probeTableCheck = await query<{ reg: string | null }>(
        `SELECT to_regclass('phase10b_rollback_probe')::text AS reg;`
      );
      const version0012Check = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM schema_migrations WHERE version = '0012';`
      );

      record(
        '6. Empty DB & Readiness',
        'Failed migration rolls back DDL changes atomically, returns success=false, and does not record 0012 in schema_migrations',
        failedMigResult.success === false &&
          probeTableCheck.rows[0]?.reg === null &&
          parseInt(version0012Check.rows[0]?.count || '0', 10) === 0
      );
    } finally {
      try {
        await query('SET search_path TO public;');
        await query('DROP SCHEMA IF EXISTS phase10b_empty_db_test CASCADE;');
      } catch {
        // ignore cleanup errors
      }
      testServer.close();
      restoreEnv();
      await closeDatabasePool();
    }
  } catch (err: any) {
    console.error('Unhandled error in Phase 10B test suite:', err);
    record('FATAL', 'Unhandled exception', false, err?.message || String(err));
  } finally {
    restoreEnv();
    await closeDatabasePool();
  }

  console.log('\n======================================================================');
  console.log('PHASE 10B TEST RESULTS SUMMARY:');
  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  const failedCount = results.filter((r) => r.status === 'FAILED').length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    console.error('❌ Phase 10B verification failed.');
    process.exit(1);
  } else {
    console.log('✅ Phase 10B production database & migration procedure verified!');
    process.exit(0);
  }
}

runPhase10bSuite();
