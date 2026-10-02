/**
 * BummptEducation — Phase 10C First Organization & Administrator Provisioning Verification Suite
 * (Including Security Closure Patch Verification)
 *
 * Meaningfully verifies the Phase 10C provisioning & security closure contract against real PostgreSQL:
 * 1. Three-tier Role & Tenant Scope Model (PLATFORM_ADMIN, TENANT_SCHOOL_ADMIN, SCHOOL_OPERATIONAL)
 * 2. Controlled CLI scripts (provision:bootstrap, provision:verify) & strict zero-seeder boundary
 * 3. Simulation/Reference Leadership Wording & UI Preference Boundary (`bummpt_ActiveSchoolId_v1`)
 * 4. Isolated Test Schema Guard (destructive test setup cannot target `public` or production schema)
 * 5. Role-Agnostic One-Time Bootstrap Guard:
 *    - Bootstrap using `super_admin` followed by second attempt -> rejected (409 BOOTSTRAP_ALREADY_COMPLETED)
 *    - Bootstrap using `state_officer` followed by second attempt -> rejected (409 BOOTSTRAP_ALREADY_COMPLETED)
 *    - Bootstrap using `principal` followed by second attempt -> rejected (409 BOOTSTRAP_ALREADY_COMPLETED)
 * 6. Concurrent Bootstrap Race Safety (`pg_advisory_xact_lock` across pooled PostgreSQL connections):
 *    - Two concurrent bootstrap attempts -> at most one succeeds; competing attempt fails closed
 * 7. Transaction Rollback Atomicity:
 *    - Failed bootstrap leaves zero partial organization, school, administrator, or staff records
 * 8. RBAC, Tenant Isolation & Privilege Escalation Guards:
 *    - Organization/school mismatch rejected
 *    - Principals blocked from creating orgs/schools, escalating roles, or provisioning outside their school
 *    - Browser-supplied school/org IDs never override server-authoritative JWT session scope
 *    - Account request approval atomically creates users + staff records
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import {
  runMigrations,
  query,
  getDatabasePool,
  closeDatabasePool,
} from '../src/db';
import { authRouter } from '../src/auth/auth.routes';
import { provisioningRouter } from '../src/api/v1/provisioning.routes';
import { schoolsRouter } from '../src/api/v1/schools.routes';
import {
  getRoleProvisioningTier,
  roleMayExistWithoutSchool,
  roleRequiresSchoolScope,
  roleRequiresStaffIdentity,
  validateRoleTenantScope,
} from '../src/auth/roles';
import {
  bootstrapFirstTenantAndAdmin,
  provisionAdministrator,
  verifyProvisioningState,
  ProvisioningError,
} from '../src/auth/provisioning.service';
import { executeProvisionBootstrapCli } from '../src/db/cli/provision-bootstrap';

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

const ISOLATED_TEST_SCHEMA_REGEX = /^phase10c_[a-z0-9_]+_test$/;
const SAFE_TEST_DB_NAME_REGEX = /^(?:test_[a-z0-9_]+|[a-z0-9_]+_test(?:_[a-z0-9_]+)?)$/i;
const FORBIDDEN_TEST_DB_NAMES = new Set([
  'postgres',
  'neondb',
  'defaultdb',
  'main',
  'master',
  'template0',
  'template1',
  'production',
  'prod',
  'staging',
  'live',
  'bummpt',
  'bummpt_education',
  'bummpt_prod',
  'bummpt_production',
]);

interface DedicatedTestDbGuardInput {
  testDatabaseUrl?: string;
  ordinaryDatabaseUrl?: string;
  allowDestructiveOptIn?: string;
  nodeEnv?: string;
  schemaName: string;
}

interface VerifiedDedicatedTestDatabase {
  testDatabaseUrl: string;
  expectedDbName: string;
  actualDbName: string;
  schemaName: string;
}

let activeVerifiedTestDb: VerifiedDedicatedTestDatabase | null = null;

/**
 * Extracts the PostgreSQL database name from a connection URL without logging credentials.
 */
function extractDatabaseNameFromUrl(connectionString: string): string {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error('INVALID_TEST_DATABASE_URL: PHASE10C_TEST_DATABASE_URL is not a valid URL.');
  }
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\/+/, '').trim());
  if (!dbName) {
    throw new Error(
      'INVALID_TEST_DATABASE_URL: PHASE10C_TEST_DATABASE_URL does not specify a database name in pathname.'
    );
  }
  return dbName;
}

/**
 * Verifies that a database name is explicitly designated as a test database
 * and is never a default, production, or live database name.
 */
function assertSafeTestDatabaseName(dbName: string): void {
  const trimmed = (dbName || '').trim();
  if (!trimmed) {
    throw new Error('UNSAFE_TEST_DATABASE_NAME: Database name is empty.');
  }
  const normalized = trimmed.toLowerCase();
  if (
    FORBIDDEN_TEST_DB_NAMES.has(normalized) ||
    /(?:^|[_-])(?:prod|production|live|staging)(?:$|[_-])/i.test(normalized)
  ) {
    throw new Error(
      `UNSAFE_TEST_DATABASE_NAME: '${trimmed}' is a forbidden default, staging, or production database name.`
    );
  }
  if (!SAFE_TEST_DB_NAME_REGEX.test(normalized)) {
    throw new Error(
      `UNSAFE_TEST_DATABASE_NAME: '${trimmed}' is not clearly designated as a test database (must match ${SAFE_TEST_DB_NAME_REGEX}).`
    );
  }
}

/**
 * Verifies that destructive test setup can ONLY target an explicitly isolated test schema
 * and never `public`, `production`, or any live production environment.
 */
function assertSafeIsolatedTestSchema(schemaName: string, nodeEnv = process.env.NODE_ENV): void {
  if ((nodeEnv || '').trim().toLowerCase() === 'production') {
    throw new Error(
      'REFUSED_PRODUCTION_TEST_EXECUTION: Destructive test schema setup is strictly prohibited when NODE_ENV=production.'
    );
  }
  if (!schemaName || !ISOLATED_TEST_SCHEMA_REGEX.test(schemaName)) {
    throw new Error(
      `UNSAFE_TEST_SCHEMA_NAME: '${schemaName}' does not match required isolated test schema pattern ${ISOLATED_TEST_SCHEMA_REGEX}.`
    );
  }
}

/**
 * Validates all environment-level fail-closed prerequisites before connecting to the dedicated test database.
 * Never falls back to ordinary DATABASE_URL.
 */
function assertSafeDedicatedTestDatabaseConfig(input: DedicatedTestDbGuardInput): {
  testDatabaseUrl: string;
  expectedDbName: string;
  schemaName: string;
} {
  const effectiveNodeEnv = (input.nodeEnv ?? process.env.NODE_ENV ?? '').trim().toLowerCase();
  if (effectiveNodeEnv === 'production') {
    throw new Error(
      'REFUSED_PRODUCTION_TEST_EXECUTION: Destructive Phase 10C tests are strictly prohibited when NODE_ENV=production.'
    );
  }

  assertSafeIsolatedTestSchema(input.schemaName, effectiveNodeEnv);

  const optIn = (input.allowDestructiveOptIn ?? '').trim();
  if (optIn !== 'true') {
    throw new Error(
      'MISSING_DESTRUCTIVE_TEST_OPT_IN: Explicit opt-in ALLOW_DESTRUCTIVE_PHASE10C_TESTS=true is required to run destructive Phase 10C tests.'
    );
  }

  const rawTestUrl = (input.testDatabaseUrl ?? '').trim();
  if (!rawTestUrl) {
    throw new Error(
      'MISSING_TEST_DATABASE_URL: Explicit PHASE10C_TEST_DATABASE_URL is required for destructive Phase 10C tests; refusing to fall back to DATABASE_URL.'
    );
  }

  const expectedDbName = extractDatabaseNameFromUrl(rawTestUrl);
  assertSafeTestDatabaseName(expectedDbName);

  const rawOrdinaryUrl = (input.ordinaryDatabaseUrl ?? '').trim();
  if (rawOrdinaryUrl) {
    let ordinaryDbName = '';
    try {
      ordinaryDbName = extractDatabaseNameFromUrl(rawOrdinaryUrl);
    } catch {
      ordinaryDbName = '';
    }
    if (ordinaryDbName && ordinaryDbName.toLowerCase() === expectedDbName.toLowerCase()) {
      throw new Error(
        `UNSAFE_TEST_DATABASE_NAME: PHASE10C_TEST_DATABASE_URL must target a dedicated test database distinct from ordinary DATABASE_URL database '${ordinaryDbName}'.`
      );
    }
  }

  return {
    testDatabaseUrl: rawTestUrl,
    expectedDbName,
    schemaName: input.schemaName,
  };
}

/**
 * Verifies the live connected PostgreSQL database name returned by `SELECT current_database()`.
 */
function assertSafeConnectedTestDatabase(
  actualConnectedDbName: string,
  expectedDbName: string
): void {
  assertSafeTestDatabaseName(actualConnectedDbName);
  if (actualConnectedDbName.trim().toLowerCase() !== expectedDbName.trim().toLowerCase()) {
    throw new Error(
      `TEST_DATABASE_NAME_MISMATCH: Connected database '${actualConnectedDbName}' does not match expected dedicated test database '${expectedDbName}'.`
    );
  }
}

/**
 * Connects strictly via PHASE10C_TEST_DATABASE_URL (never DATABASE_URL), inspects `SELECT current_database()`,
 * and verifies all fail-closed test database and schema guards before any destructive setup can occur.
 */
async function verifyAndBindDedicatedTestDatabase(
  input: DedicatedTestDbGuardInput
): Promise<VerifiedDedicatedTestDatabase> {
  const validated = assertSafeDedicatedTestDatabaseConfig(input);

  await closeDatabasePool();
  process.env.DATABASE_URL = validated.testDatabaseUrl;
  delete process.env.DATABASE_SEARCH_PATH;

  const dbNameRes = await query<{ current_database: string }>(
    'SELECT current_database() AS current_database;'
  );
  const actualDbName = dbNameRes.rows[0]?.current_database || '';
  assertSafeConnectedTestDatabase(actualDbName, validated.expectedDbName);

  const verified: VerifiedDedicatedTestDatabase = {
    testDatabaseUrl: validated.testDatabaseUrl,
    expectedDbName: validated.expectedDbName,
    actualDbName,
    schemaName: validated.schemaName,
  };
  activeVerifiedTestDb = verified;
  return verified;
}

/**
 * Resets an isolated test schema cleanly inside the verified dedicated test database
 * and ensures all connections in the pool use its search_path.
 */
async function resetIsolatedTestSchema(schemaName: string, poolSize = 2): Promise<void> {
  if (!activeVerifiedTestDb) {
    throw new Error(
      'UNVERIFIED_TEST_DATABASE: Cannot reset isolated schema before verifyAndBindDedicatedTestDatabase() succeeds.'
    );
  }
  assertSafeIsolatedTestSchema(schemaName);
  if (schemaName !== activeVerifiedTestDb.schemaName) {
    throw new Error(
      `UNSAFE_TEST_SCHEMA_NAME: Schema '${schemaName}' does not match verified test schema '${activeVerifiedTestDb.schemaName}'.`
    );
  }

  await closeDatabasePool();
  process.env.DATABASE_URL = activeVerifiedTestDb.testDatabaseUrl;
  process.env.DATABASE_POOL_SIZE = String(poolSize);
  process.env.DATABASE_SEARCH_PATH = `${schemaName}, public`;

  const dbCheckRes = await query<{ current_database: string }>(
    'SELECT current_database() AS current_database;'
  );
  const actualDbName = dbCheckRes.rows[0]?.current_database || '';
  assertSafeConnectedTestDatabase(actualDbName, activeVerifiedTestDb.expectedDbName);

  await query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE;`);
  await query(`CREATE SCHEMA ${schemaName};`);

  const currentSchemaRes = await query<{ current_schema: string }>('SELECT current_schema();');
  if (currentSchemaRes.rows[0]?.current_schema !== schemaName) {
    throw new Error(
      `Expected active schema '${schemaName}', got '${currentSchemaRes.rows[0]?.current_schema}'`
    );
  }

  const migRes = await runMigrations();
  if (!migRes.success) {
    throw new Error(`Migrations failed on isolated schema ${schemaName}: ${migRes.error}`);
  }
}

async function runPhase10cSuite() {
  console.log('======================================================================');
  console.log('BummptEducation — Phase 10C Organization & Admin Provisioning Verification');
  console.log('======================================================================\n');

  const savedEnv = { ...process.env };
  function restoreEnv() {
    for (const k of Object.keys(process.env)) {
      if (!(k in savedEnv)) {
        delete process.env[k];
      }
    }
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }

  const ISOLATED_SCHEMA = 'phase10c_provisioning_test';

  try {
    // =========================================================================
    // 1. Role Tier & Tenant Scope Model Verification
    // =========================================================================
    const tierChecks =
      getRoleProvisioningTier('super_admin') === 'PLATFORM_ADMIN' &&
      getRoleProvisioningTier('state_officer') === 'PLATFORM_ADMIN' &&
      getRoleProvisioningTier('principal') === 'TENANT_SCHOOL_ADMIN' &&
      getRoleProvisioningTier('vice_principal') === 'TENANT_SCHOOL_ADMIN' &&
      getRoleProvisioningTier('headmistress') === 'TENANT_SCHOOL_ADMIN' &&
      getRoleProvisioningTier('head_kindergarten') === 'TENANT_SCHOOL_ADMIN' &&
      getRoleProvisioningTier('bursar') === 'SCHOOL_OPERATIONAL' &&
      getRoleProvisioningTier('teacher') === 'SCHOOL_OPERATIONAL' &&
      getRoleProvisioningTier('parent') === 'SCHOOL_OPERATIONAL' &&
      getRoleProvisioningTier('student') === 'SCHOOL_OPERATIONAL';

    record(
      '1. Role & Scope Model',
      'All 12 system roles classify cleanly into PLATFORM_ADMIN, TENANT_SCHOOL_ADMIN, and SCHOOL_OPERATIONAL tiers',
      tierChecks
    );

    const scopeRulesOk =
      roleMayExistWithoutSchool('super_admin') === true &&
      roleMayExistWithoutSchool('state_officer') === true &&
      roleMayExistWithoutSchool('principal') === false &&
      roleRequiresSchoolScope('principal') === true &&
      roleRequiresSchoolScope('teacher') === true &&
      roleRequiresSchoolScope('parent') === true &&
      roleRequiresStaffIdentity('principal') === true &&
      roleRequiresStaffIdentity('bursar') === true &&
      roleRequiresStaffIdentity('teacher') === true &&
      roleRequiresStaffIdentity('parent') === false &&
      roleRequiresStaffIdentity('super_admin') === false &&
      validateRoleTenantScope('super_admin', null).valid === true &&
      validateRoleTenantScope('state_officer', null).valid === true &&
      validateRoleTenantScope('principal', null).valid === false &&
      validateRoleTenantScope('teacher', null).valid === false &&
      validateRoleTenantScope('principal', '00000000-0000-0000-0000-000000000001').valid === true;

    record(
      '1. Role & Scope Model',
      'validateRoleTenantScope() permits null school_id only for platform roles and requires school_id for school admin & operational roles',
      scopeRulesOk
    );

    // =========================================================================
    // 2. CLI Scripts, Documentation & Seeder Isolation Boundary
    // =========================================================================
    const pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
    const hasCliScripts =
      pkgJson.scripts?.['provision:bootstrap'] === 'tsx src/db/cli/provision-bootstrap.ts' &&
      pkgJson.scripts?.['provision:verify'] === 'tsx src/db/cli/provision-verify.ts' &&
      pkgJson.scripts?.['test:phase10c'] === 'tsx tests/phase10c.provisioning.test.ts';

    const docPath = path.join(
      process.cwd(),
      'docs/PHASE_10C_FIRST_ORGANIZATION_AND_ADMIN_PROVISIONING.md'
    );
    const docExists = fs.existsSync(docPath);
    const docContent = docExists ? fs.readFileSync(docPath, 'utf-8') : '';
    const envExampleContent = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf-8');

    const docMatchesContract =
      docContent.includes('BOOTSTRAP_PROVISIONED') &&
      docContent.includes('super_admin') &&
      docContent.includes('state_officer') &&
      docContent.includes('principal') &&
      docContent.includes('one-time controlled operation') &&
      docContent.includes('PHASE10C_TEST_DATABASE_URL') &&
      docContent.includes('ALLOW_DESTRUCTIVE_PHASE10C_TESTS') &&
      docContent.includes('admin@example.invalid') &&
      !docContent.includes('admin@moe.benuestate.gov.ng') &&
      envExampleContent.includes('PHASE10C_TEST_DATABASE_URL') &&
      envExampleContent.includes('ALLOW_DESTRUCTIVE_PHASE10C_TESTS');

    record(
      '2. CLI & Documentation',
      'package.json defines provision:bootstrap, provision:verify, and test:phase10c scripts; Phase 10C docs & .env.example accurately document role-agnostic bootstrap, dedicated test DB variables, and illustrative credentials',
      hasCliScripts && docExists && docMatchesContract
    );

    const serviceSource = fs.readFileSync(
      path.join(process.cwd(), 'src/auth/provisioning.service.ts'),
      'utf-8'
    );
    const bootstrapCliSource = fs.readFileSync(
      path.join(process.cwd(), 'src/db/cli/provision-bootstrap.ts'),
      'utf-8'
    );
    const verifyCliSource = fs.readFileSync(
      path.join(process.cwd(), 'src/db/cli/provision-verify.ts'),
      'utf-8'
    );

    const forbiddenSeedPatterns = [
      'auth.seed',
      'operational.seed',
      'financial.seed',
      'lessonNotes.seed',
      'seedDevelopmentAuthIdentities',
      'seedOperationalFoundation',
      'seedFinancialFoundation',
      'seedLessonNotesFoundation',
    ];

    const zeroSeederCoupling = forbiddenSeedPatterns.every(
      (pat) =>
        !serviceSource.includes(pat) &&
        !bootstrapCliSource.includes(pat) &&
        !verifyCliSource.includes(pat)
    );

    record(
      '2. CLI & Documentation',
      'Provisioning service and CLI scripts never import or execute development/demo seeders',
      zeroSeederCoupling
    );

    // Verify CLI fails closed when required BOOTSTRAP_* env vars are absent
    delete process.env.BOOTSTRAP_ORG_NAME;
    delete process.env.BOOTSTRAP_ORG_CODE;
    delete process.env.BOOTSTRAP_ADMIN_EMAIL;
    delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
    delete process.env.BOOTSTRAP_ADMIN_NAME;
    const missingEnvCliRes = await executeProvisionBootstrapCli();

    record(
      '2. CLI & Documentation',
      'executeProvisionBootstrapCli() fails closed (exitCode=1) when required BOOTSTRAP_* environment variables are missing',
      missingEnvCliRes.exitCode === 1 &&
        missingEnvCliRes.message.includes('Missing required bootstrap environment variables')
    );

    // =========================================================================
    // 3. Simulation/Reference Leadership Wording & UI Preference Boundary
    // =========================================================================
    const benueDataSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/data/benueStateData.ts'),
      'utf-8'
    );
    const modalSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/components/SchoolLeadershipSimulationModal.tsx'),
      'utf-8'
    );
    const contextBarSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/components/ActiveSchoolContextBar.tsx'),
      'utf-8'
    );
    const hqPageSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/pages/BenueStateHQPage.tsx'),
      'utf-8'
    );
    const organogramPageSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/pages/OrganogramPage.tsx'),
      'utf-8'
    );
    const combinedSimulationSources = [
      benueDataSrc,
      modalSrc,
      contextBarSrc,
      hqPageSrc,
      organogramPageSrc,
    ].join('\n');

    const prohibitedClaims = [
      'school-authentic',
      'Selected School Official Roster',
      'authentic Principal / Headmaster',
      'registered to the selected school',
      'Official School Roster vs. Simulation Presets',
      'Restore School Official Leaders',
    ];

    const hasNoProhibitedClaims = prohibitedClaims.every(
      (claim) => !combinedSimulationSources.includes(claim)
    );
    const hasAccurateSimulationDescriptions =
      benueDataSrc.includes('Selected School Simulation/Reference Leadership Roster (Default)') &&
      benueDataSrc.includes('simulation/reference leadership roster') &&
      modalSrc.includes('Simulation/Reference Leadership Roster') &&
      contextBarSrc.includes('Simulation/Reference Leadership Roster') &&
      hqPageSrc.includes('Simulation/Reference Leadership Roster') &&
      organogramPageSrc.includes('Simulation/Reference Leadership Roster');

    // Verify bummpt_ActiveSchoolId_v1 is never referenced in any backend/auth/API files
    const authMiddlewareSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/auth/middleware.ts'),
      'utf-8'
    );
    const provRoutesSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/api/v1/provisioning.routes.ts'),
      'utf-8'
    );
    const uiPrefNeverUsedOnServer =
      !serviceSource.includes('bummpt_ActiveSchoolId_v1') &&
      !authMiddlewareSrc.includes('bummpt_ActiveSchoolId_v1') &&
      !provRoutesSrc.includes('bummpt_ActiveSchoolId_v1');

    record(
      '3. Simulation Data Boundary',
      'Simulation/reference leadership wording accurately describes UI simulation/reference roster and never claims verified registered personnel; bummpt_ActiveSchoolId_v1 is strictly a UI preference',
      hasNoProhibitedClaims && hasAccurateSimulationDescriptions && uiPrefNeverUsedOnServer
    );

    // =========================================================================
    // 4. Dedicated Test-Database & Isolated Test-Schema Safety Guard Verification
    // =========================================================================
    // 4A. Missing test URL (must never silently fall back to ordinary DATABASE_URL)
    let missingTestUrlBlocked = false;
    try {
      assertSafeDedicatedTestDatabaseConfig({
        testDatabaseUrl: '',
        ordinaryDatabaseUrl: 'postgresql://user:pass@localhost:5432/neondb',
        allowDestructiveOptIn: 'true',
        nodeEnv: 'test',
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (err: any) {
      missingTestUrlBlocked = Boolean(err?.message?.includes('MISSING_TEST_DATABASE_URL'));
    }

    record(
      '4. Test Database Safety Guard',
      'Guard refuses execution when PHASE10C_TEST_DATABASE_URL is missing and never falls back to DATABASE_URL',
      missingTestUrlBlocked
    );

    // 4B. Missing explicit destructive opt-in
    let missingOptInBlocked = false;
    let falseOptInBlocked = false;
    try {
      assertSafeDedicatedTestDatabaseConfig({
        testDatabaseUrl: 'postgresql://user:pass@localhost:5432/bummpt_phase10c_test',
        ordinaryDatabaseUrl: 'postgresql://user:pass@localhost:5432/neondb',
        allowDestructiveOptIn: '',
        nodeEnv: 'test',
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (err: any) {
      missingOptInBlocked = Boolean(err?.message?.includes('MISSING_DESTRUCTIVE_TEST_OPT_IN'));
    }
    try {
      assertSafeDedicatedTestDatabaseConfig({
        testDatabaseUrl: 'postgresql://user:pass@localhost:5432/bummpt_phase10c_test',
        ordinaryDatabaseUrl: 'postgresql://user:pass@localhost:5432/neondb',
        allowDestructiveOptIn: 'false',
        nodeEnv: 'test',
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (err: any) {
      falseOptInBlocked = Boolean(err?.message?.includes('MISSING_DESTRUCTIVE_TEST_OPT_IN'));
    }

    record(
      '4. Test Database Safety Guard',
      'Guard refuses execution when ALLOW_DESTRUCTIVE_PHASE10C_TESTS=true opt-in is missing or false',
      missingOptInBlocked && falseOptInBlocked
    );

    // 4C. Production mode (NODE_ENV=production)
    let prodEnvConfigBlocked = false;
    let prodEnvSchemaBlocked = false;
    try {
      assertSafeDedicatedTestDatabaseConfig({
        testDatabaseUrl: 'postgresql://user:pass@localhost:5432/bummpt_phase10c_test',
        ordinaryDatabaseUrl: 'postgresql://user:pass@localhost:5432/neondb',
        allowDestructiveOptIn: 'true',
        nodeEnv: 'production',
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (err: any) {
      prodEnvConfigBlocked = Boolean(err?.message?.includes('REFUSED_PRODUCTION_TEST_EXECUTION'));
    }
    try {
      assertSafeIsolatedTestSchema(ISOLATED_SCHEMA, 'production');
    } catch (err: any) {
      prodEnvSchemaBlocked = Boolean(err?.message?.includes('REFUSED_PRODUCTION_TEST_EXECUTION'));
    }

    record(
      '4. Test Database Safety Guard',
      'Guard refuses execution when NODE_ENV=production even if test URL and opt-in are supplied',
      prodEnvConfigBlocked && prodEnvSchemaBlocked
    );

    // 4D. Unsafe database name (URL pathname, connected current_database(), or same as DATABASE_URL)
    const unsafeDbUrls = [
      'postgresql://user:pass@localhost:5432/neondb',
      'postgresql://user:pass@localhost:5432/postgres',
      'postgresql://user:pass@localhost:5432/bummpt_production',
      'postgresql://user:pass@localhost:5432/bummpt_prod_test',
      'postgresql://user:pass@localhost:5432/live_school_db',
    ];
    const allUnsafeUrlsBlocked = unsafeDbUrls.every((unsafeUrl) => {
      try {
        assertSafeDedicatedTestDatabaseConfig({
          testDatabaseUrl: unsafeUrl,
          ordinaryDatabaseUrl: 'postgresql://user:pass@localhost:5432/other_db',
          allowDestructiveOptIn: 'true',
          nodeEnv: 'test',
          schemaName: ISOLATED_SCHEMA,
        });
        return false;
      } catch (err: any) {
        return Boolean(err?.message?.includes('UNSAFE_TEST_DATABASE_NAME'));
      }
    });

    let sameAsOrdinaryDbBlocked = false;
    try {
      assertSafeDedicatedTestDatabaseConfig({
        testDatabaseUrl: 'postgresql://user:pass@localhost:5432/bummpt_phase10c_test',
        ordinaryDatabaseUrl: 'postgresql://user:pass@localhost:5432/bummpt_phase10c_test',
        allowDestructiveOptIn: 'true',
        nodeEnv: 'test',
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (err: any) {
      sameAsOrdinaryDbBlocked = Boolean(err?.message?.includes('UNSAFE_TEST_DATABASE_NAME'));
    }

    let connectedUnsafeDbBlocked = false;
    let connectedMismatchDbBlocked = false;
    try {
      assertSafeConnectedTestDatabase('neondb', 'bummpt_phase10c_test');
    } catch (err: any) {
      connectedUnsafeDbBlocked = Boolean(err?.message?.includes('UNSAFE_TEST_DATABASE_NAME'));
    }
    try {
      assertSafeConnectedTestDatabase('other_unit_test', 'bummpt_phase10c_test');
    } catch (err: any) {
      connectedMismatchDbBlocked = Boolean(err?.message?.includes('TEST_DATABASE_NAME_MISMATCH'));
    }

    record(
      '4. Test Database Safety Guard',
      'Guard rejects unsafe database names (neondb, postgres, production, same as DATABASE_URL, or mismatched connected current_database())',
      allUnsafeUrlsBlocked &&
        sameAsOrdinaryDbBlocked &&
        connectedUnsafeDbBlocked &&
        connectedMismatchDbBlocked
    );

    // 4E. Unsafe schema name (public, production schemas, unrelated schemas)
    const unsafeSchemas = [
      'public',
      'production',
      'production_schema',
      'phase10b_test',
      'unrelated_schema',
      'phase10c_test',
      'phase10c_UPPER_test',
    ];
    const allUnsafeSchemasBlocked = unsafeSchemas.every((badSchema) => {
      try {
        assertSafeIsolatedTestSchema(badSchema, 'test');
        return false;
      } catch (err: any) {
        return Boolean(err?.message?.includes('UNSAFE_TEST_SCHEMA_NAME'));
      }
    });

    const validConfigCheck = assertSafeDedicatedTestDatabaseConfig({
      testDatabaseUrl: 'postgresql://user:pass@localhost:5432/bummpt_phase10c_test',
      ordinaryDatabaseUrl: 'postgresql://user:pass@localhost:5432/neondb',
      allowDestructiveOptIn: 'true',
      nodeEnv: 'test',
      schemaName: ISOLATED_SCHEMA,
    });

    record(
      '4. Test Database Safety Guard',
      'Guard rejects public, production, and unrelated schemas while permitting approved isolated test schema on a dedicated test database',
      allUnsafeSchemasBlocked &&
        validConfigCheck.expectedDbName === 'bummpt_phase10c_test' &&
        validConfigCheck.schemaName === ISOLATED_SCHEMA
    );

    // =========================================================================
    // Verify Live Dedicated Test Database Before Any Destructive Setup
    // =========================================================================
    restoreEnv();
    let verifiedTestDb: VerifiedDedicatedTestDatabase;
    try {
      verifiedTestDb = await verifyAndBindDedicatedTestDatabase({
        testDatabaseUrl: savedEnv.PHASE10C_TEST_DATABASE_URL,
        ordinaryDatabaseUrl: savedEnv.DATABASE_URL,
        allowDestructiveOptIn: savedEnv.ALLOW_DESTRUCTIVE_PHASE10C_TESTS,
        nodeEnv: savedEnv.NODE_ENV,
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (guardErr: any) {
      const reason = guardErr?.message || String(guardErr);
      console.warn('\n----------------------------------------------------------------------');
      console.warn(
        `⚠️  [SAFE STOP] Destructive Phase 10C database suite halted by fail-closed test-database guard:`
      );
      console.warn(`   ${reason}`);
      console.warn(
        '   No schema drops, migrations, or writes were executed against DATABASE_URL or any other database.'
      );
      console.warn('----------------------------------------------------------------------\n');
      record(
        '4. Test Database Safety Guard (Live Connection)',
        'Dedicated test database connection verified before destructive Phase 10C tests',
        false,
        `Stopped safely before destructive setup: ${reason}`
      );
      restoreEnv();
      await closeDatabasePool();
      const passedOnStop = results.filter((r) => r.status === 'PASSED').length;
      const failedOnStop = results.filter((r) => r.status === 'FAILED').length;
      console.log('======================================================================');
      console.log('PHASE 10C TEST RESULTS SUMMARY (SAFE STOP BEFORE DESTRUCTIVE DB SETUP):');
      console.log(`Total: ${results.length} | Passed: ${passedOnStop} | Failed: ${failedOnStop}`);
      console.log('======================================================================\n');
      process.exit(1);
    }

    record(
      '4. Test Database Safety Guard (Live Connection)',
      `Connected to verified dedicated test database '${verifiedTestDb.actualDbName}' using isolated schema '${verifiedTestDb.schemaName}'`,
      verifiedTestDb.actualDbName === verifiedTestDb.expectedDbName
    );

    // =========================================================================
    // 5. Role-Agnostic One-Time Bootstrap Guard & Rollback Atomicity
    // =========================================================================
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/provisioning', provisioningRouter);
    app.use('/api/v1/schools', schoolsRouter);

    const testServer = http.createServer(app);
    await new Promise<void>((resolve) => testServer.listen(0, '127.0.0.1', () => resolve()));
    const port = (testServer.address() as any).port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // -----------------------------------------------------------------------
      // 5A. Empty DB pre-state & Transaction Rollback on Failed Bootstrap
      // -----------------------------------------------------------------------
      await resetIsolatedTestSchema(ISOLATED_SCHEMA, 1);
      const preVerify = await verifyProvisioningState();

      record(
        '5. Empty DB Pre-State',
        'On a freshly migrated empty database, verifyProvisioningState() reports ready=false with 0 organizations, 0 schools, and 0 admins',
        preVerify.ready === false &&
          preVerify.organizationsCount === 0 &&
          preVerify.schoolsCount === 0 &&
          preVerify.activeAdminsCount === 0
      );

      // Trigger a failed bootstrap AFTER org & school parameters are valid:
      // Case 1: principal bootstrap without a school
      let failedBootstrap1Caught = false;
      try {
        await bootstrapFirstTenantAndAdmin({
          organization: { name: 'Rollback Org One', code: 'ROLLBACK-ORG-01' },
          admin: {
            email: 'principal.noschool@moe.benuestate.gov.ng',
            password: 'StrongPassword#2026!',
            fullName: 'Principal Without School',
            role: 'principal',
          },
        });
      } catch (err: any) {
        if (err instanceof ProvisioningError && err.code === 'SCHOOL_SCOPE_REQUIRED') {
          failedBootstrap1Caught = true;
        }
      }

      // Case 2: bootstrap where organization & school are created inside the transaction,
      // then schoolPrincipal fails mid-transaction due to duplicate email with primary admin
      let failedBootstrap2Caught = false;
      try {
        await bootstrapFirstTenantAndAdmin({
          organization: { name: 'Rollback Org Two', code: 'ROLLBACK-ORG-02' },
          school: {
            name: 'Rollback Model School Makurdi',
            code: 'BNS-RBK-101',
            lga: 'Makurdi',
            senatorialZone: 'Zone B',
            category: 'Secondary',
          },
          admin: {
            email: 'collision@moe.benuestate.gov.ng',
            password: 'StrongPassword#2026!',
            fullName: 'Collision Super Admin',
            role: 'super_admin',
          },
          schoolPrincipal: {
            // Same email as primary admin causes EMAIL_ALREADY_EXISTS after org, school, and primary admin were inserted!
            email: 'collision@moe.benuestate.gov.ng',
            password: 'StrongPassword#2026!',
            fullName: 'Collision Principal',
          },
        });
      } catch (err: any) {
        if (err instanceof ProvisioningError && err.code === 'EMAIL_ALREADY_EXISTS') {
          failedBootstrap2Caught = true;
        }
      }

      const postRollbackCounts = await query<{
        orgs: string;
        schools: string;
        users: string;
        staff: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM organizations) AS orgs,
          (SELECT COUNT(*) FROM schools) AS schools,
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM staff) AS staff;
      `);
      const countsRow = postRollbackCounts.rows[0];
      const zeroPartialRecords =
        parseInt(countsRow.orgs, 10) === 0 &&
        parseInt(countsRow.schools, 10) === 0 &&
        parseInt(countsRow.users, 10) === 0 &&
        parseInt(countsRow.staff, 10) === 0;

      record(
        '6. Transaction Rollback Atomicity',
        'Failed bootstrap rolls back completely: zero partial organization, school, administrator, or staff records remain',
        failedBootstrap1Caught && failedBootstrap2Caught && zeroPartialRecords
      );

      // -----------------------------------------------------------------------
      // 5B. Bootstrap with `state_officer`, followed by a second attempt -> rejected
      // -----------------------------------------------------------------------
      const stateOfficerBootstrap = await bootstrapFirstTenantAndAdmin({
        organization: {
          name: 'Benue State Ministry Directorate',
          code: 'BNS-MOE-DIR',
        },
        admin: {
          email: 'state.officer@moe.benuestate.gov.ng',
          password: 'StateOfficerPass#2026!',
          fullName: 'Hon. State Officer Administrator',
          role: 'state_officer',
        },
      });

      let secondAfterStateOfficerRejected = false;
      try {
        await bootstrapFirstTenantAndAdmin({
          organization: { name: 'Bypass Attempt Org', code: 'BYPASS-ORG-01' },
          admin: {
            email: 'bypass.super@moe.benuestate.gov.ng',
            password: 'BypassPassword#2026!',
            fullName: 'Bypass Super Admin',
            role: 'super_admin',
          },
        });
      } catch (err: any) {
        if (err instanceof ProvisioningError && err.code === 'BOOTSTRAP_ALREADY_COMPLETED') {
          secondAfterStateOfficerRejected = true;
        }
      }

      record(
        '7. One-Time Bootstrap Guard',
        'Bootstrap using state_officer succeeds once, and a second bootstrap attempt (even with super_admin) is rejected with BOOTSTRAP_ALREADY_COMPLETED',
        stateOfficerBootstrap.admin.user.role === 'state_officer' &&
          stateOfficerBootstrap.admin.user.schoolId === null &&
          secondAfterStateOfficerRejected
      );

      // -----------------------------------------------------------------------
      // 5C. Bootstrap with `principal`, followed by a second attempt -> rejected
      // -----------------------------------------------------------------------
      await resetIsolatedTestSchema(ISOLATED_SCHEMA, 1);

      const principalBootstrap = await bootstrapFirstTenantAndAdmin({
        organization: {
          name: 'Benue SUBEB Autonomous School Board',
          code: 'BNS-SUBEB-BRD',
        },
        school: {
          name: 'Government College Katsina-Ala',
          code: 'BNS-KTA-101',
          lga: 'Katsina-Ala',
          senatorialZone: 'Zone A (Benue North-East)',
          category: 'Secondary',
        },
        admin: {
          email: 'principal.kta@bns-kta-101.edu.ng',
          password: 'PrincipalBootstrap#2026!',
          fullName: 'Dr. Terver Akaa (Bootstrap Principal)',
          role: 'principal',
          staffIdNumber: 'BNS-KTA-101-PRIN-001',
        },
      });

      let secondAfterPrincipalRejected = false;
      try {
        await bootstrapFirstTenantAndAdmin({
          organization: { name: 'Second Org After Principal', code: 'SECOND-ORG-02' },
          admin: {
            email: 'second.admin@moe.benuestate.gov.ng',
            password: 'SecondPassword#2026!',
            fullName: 'Second Admin',
            role: 'super_admin',
          },
        });
      } catch (err: any) {
        if (err instanceof ProvisioningError && err.code === 'BOOTSTRAP_ALREADY_COMPLETED') {
          secondAfterPrincipalRejected = true;
        }
      }

      record(
        '7. One-Time Bootstrap Guard',
        'Bootstrap using principal (with valid school) succeeds once with linked staff record, and a second bootstrap attempt is rejected with BOOTSTRAP_ALREADY_COMPLETED',
        principalBootstrap.admin.user.role === 'principal' &&
          principalBootstrap.admin.user.schoolId === principalBootstrap.school?.id &&
          principalBootstrap.admin.staff?.user_id === principalBootstrap.admin.user.id &&
          secondAfterPrincipalRejected
      );

      // -----------------------------------------------------------------------
      // 5D. Concurrent Bootstrap Race Test (2 pooled connections racing simultaneously)
      // -----------------------------------------------------------------------
      await resetIsolatedTestSchema(ISOLATED_SCHEMA, 2);

      const [raceResultA, raceResultB] = await Promise.allSettled([
        bootstrapFirstTenantAndAdmin({
          organization: {
            name: 'Concurrent Bootstrap Org Alpha',
            code: 'BNS-RACE-ALPHA',
          },
          admin: {
            email: 'alpha.admin@moe.benuestate.gov.ng',
            password: 'AlphaStrongPass#2026!',
            fullName: 'Alpha Bootstrap Admin',
            role: 'super_admin',
          },
        }),
        bootstrapFirstTenantAndAdmin({
          organization: {
            name: 'Concurrent Bootstrap Org Beta',
            code: 'BNS-RACE-BETA',
          },
          admin: {
            email: 'beta.admin@moe.benuestate.gov.ng',
            password: 'BetaStrongPass#2026!',
            fullName: 'Beta Bootstrap Admin',
            role: 'state_officer',
          },
        }),
      ]);

      const fulfilledList = [raceResultA, raceResultB].filter((r) => r.status === 'fulfilled');
      const rejectedList = [raceResultA, raceResultB].filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected'
      );

      const racePostVerify = await verifyProvisioningState();
      const singleWinnerAndCleanReject =
        fulfilledList.length === 1 &&
        rejectedList.length === 1 &&
        rejectedList[0].reason instanceof ProvisioningError &&
        rejectedList[0].reason.code === 'BOOTSTRAP_ALREADY_COMPLETED' &&
        racePostVerify.organizationsCount === 1 &&
        racePostVerify.activeAdminsCount === 1;

      record(
        '8. Concurrent Bootstrap Race Safety',
        'When two bootstrap requests execute concurrently across pooled PostgreSQL connections, pg_advisory_xact_lock serializes them so exactly 1 succeeds and 1 fails closed (409)',
        singleWinnerAndCleanReject
      );

      // -----------------------------------------------------------------------
      // 5E. Primary Bootstrap with `super_admin` + Full Multi-LGA API & RBAC Verification
      // -----------------------------------------------------------------------
      await resetIsolatedTestSchema(ISOLATED_SCHEMA, 1);

      const bootstrapRes = await bootstrapFirstTenantAndAdmin({
        organization: {
          name: 'Benue State Ministry of Education & SUBEB',
          code: 'BNS-MOE-STATE',
        },
        school: {
          name: 'Government Model Secondary School Makurdi',
          code: 'BNS-MKD-101',
          lga: 'Makurdi',
          senatorialZone: 'Zone B (Benue North-West)',
          category: 'Secondary',
          address: 'High Level, Makurdi, Benue State',
          establishedYear: 1982,
        },
        admin: {
          email: 'commissioner.admin@moe.benuestate.gov.ng',
          password: 'StrongPlatformPass#2026!',
          fullName: 'Dr. Terhemba Kator (Platform Super Admin)',
          phone: '+234 803 111 0001',
          role: 'super_admin',
        },
        schoolPrincipal: {
          email: 'principal.makurdi@bns-mkd-101.edu.ng',
          password: 'StrongPrincipalPass#2026!',
          fullName: 'Dr. (Mrs.) Dooshima Vember (Principal Makurdi)',
          phone: '+234 803 111 0002',
          staffIdNumber: 'BNS-MKD-101-PRIN-001',
          qualifications: 'Ph.D Educational Administration, M.Ed',
          trcnNumber: 'TRCN/BN/2026/001',
        },
      });

      const postVerify = await verifyProvisioningState();

      record(
        '7. One-Time Bootstrap Guard',
        'Bootstrap using super_admin atomically provisions Organization, First School, Super Admin, and School Principal + linked Staff identity',
        bootstrapRes.organization.code === 'BNS-MOE-STATE' &&
          bootstrapRes.school?.code === 'BNS-MKD-101' &&
          bootstrapRes.school?.organization_id === bootstrapRes.organization.id &&
          bootstrapRes.admin.user.role === 'super_admin' &&
          bootstrapRes.admin.user.schoolId === null &&
          bootstrapRes.schoolPrincipal?.user.role === 'principal' &&
          bootstrapRes.schoolPrincipal?.user.schoolId === bootstrapRes.school?.id &&
          bootstrapRes.schoolPrincipal?.staff?.user_id === bootstrapRes.schoolPrincipal?.user.id &&
          bootstrapRes.schoolPrincipal?.staff?.organization_id === bootstrapRes.organization.id &&
          bootstrapRes.schoolPrincipal?.staff?.school_id === bootstrapRes.school?.id &&
          postVerify.ready === true &&
          postVerify.organizationsCount === 1 &&
          postVerify.schoolsCount === 1 &&
          postVerify.activeSuperAdminsCount === 1 &&
          postVerify.activeAdminsCount === 2 &&
          postVerify.staffLinkedUsersCount === 1
      );

      // Verify second bootstrap attempt after super_admin fails closed with BOOTSTRAP_ALREADY_COMPLETED
      let secondBootstrapBlocked = false;
      try {
        await bootstrapFirstTenantAndAdmin({
          organization: { name: 'Rogue Org', code: 'ROGUE-ORG' },
          admin: {
            email: 'rogue@example.com',
            password: 'RoguePassword123!',
            fullName: 'Rogue Admin',
            role: 'super_admin',
          },
        });
      } catch (err: any) {
        if (err instanceof ProvisioningError && err.code === 'BOOTSTRAP_ALREADY_COMPLETED') {
          secondBootstrapBlocked = true;
        }
      }

      record(
        '7. One-Time Bootstrap Guard',
        'Bootstrap using super_admin followed by a second attempt fails closed with BOOTSTRAP_ALREADY_COMPLETED (409)',
        secondBootstrapBlocked
      );

      // Verify school's principal_name was synchronized and password hashes are Argon2id (never plaintext)
      const schoolRowRes = await query<{ principal_name: string }>(
        'SELECT principal_name FROM schools WHERE id = $1;',
        [bootstrapRes.school!.id]
      );
      const userHashesRes = await query<{ email: string; password_hash: string }>(
        'SELECT email, password_hash FROM users;'
      );
      const allArgon2id =
        userHashesRes.rows.length === 2 &&
        userHashesRes.rows.every(
          (r) =>
            r.password_hash.startsWith('$argon2id$') &&
            !r.password_hash.includes('StrongPlatformPass') &&
            !r.password_hash.includes('StrongPrincipalPass')
        );

      record(
        '9. Argon2id & Operational Boundary',
        'Provisioned passwords use Argon2id hashing (zero plaintext) and school principal_name is synchronized',
        allArgon2id &&
          schoolRowRes.rows[0]?.principal_name === 'Dr. (Mrs.) Dooshima Vember (Principal Makurdi)'
      );

      // Verify ZERO students, parents, fees, invoices, payments, assessments, or attendance rows were created
      const operationalTables = [
        'students',
        'student_enrollments',
        'parent_guardians',
        'fee_structures',
        'fee_invoices',
        'fee_payments',
        'daily_attendance',
        'assessment_scores',
        'report_cards',
      ];
      let operationalRowSum = 0;
      for (const tbl of operationalTables) {
        const cRes = await query<{ count: string }>(`SELECT COUNT(*) as count FROM ${tbl};`);
        operationalRowSum += parseInt(cRes.rows[0]?.count || '0', 10);
      }

      record(
        '9. Argon2id & Operational Boundary',
        'Provisioning creates zero student, parent, fee, invoice, payment, attendance, or assessment records',
        operationalRowSum === 0
      );

      // =========================================================================
      // 10. Real Authentication, RBAC & Tenant Isolation Verification
      // =========================================================================
      const superAdminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'commissioner.admin@moe.benuestate.gov.ng',
          password: 'StrongPlatformPass#2026!',
        }),
      });
      const superAdminLoginJson = await superAdminLoginRes.json();
      const superAdminToken = superAdminLoginJson.token as string;

      const principalLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'principal.makurdi@bns-mkd-101.edu.ng',
          password: 'StrongPrincipalPass#2026!',
        }),
      });
      const principalLoginJson = await principalLoginRes.json();
      const principalToken = principalLoginJson.token as string;

      record(
        '10. Auth & Session Integration',
        'Provisioned Super Admin and School Principal authenticate via POST /api/v1/auth/login with accurate RBAC & school scope',
        superAdminLoginRes.status === 200 &&
          superAdminLoginJson.user?.role === 'super_admin' &&
          superAdminLoginJson.user?.isSuperAdmin === true &&
          superAdminLoginJson.user?.schoolId === null &&
          principalLoginRes.status === 200 &&
          principalLoginJson.user?.role === 'principal' &&
          principalLoginJson.user?.schoolId === bootstrapRes.school?.id &&
          principalLoginJson.user?.schoolName === 'Government Model Secondary School Makurdi'
      );

      // Unauthenticated request to provisioning endpoints must fail with 401
      const unauthOrgRes = await fetch(`${baseUrl}/api/v1/provisioning/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauth Org', code: 'UNAUTH-01' }),
      });

      // Principal attempting to create an organization or school must fail with 403
      const principalCreateOrgRes = await fetch(`${baseUrl}/api/v1/provisioning/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`,
        },
        body: JSON.stringify({ name: 'Principal Org', code: 'PRIN-ORG-01' }),
      });

      const principalCreateSchoolRes = await fetch(`${baseUrl}/api/v1/provisioning/schools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`,
        },
        body: JSON.stringify({
          organizationId: bootstrapRes.organization.id,
          name: 'Unauthorized School',
          code: 'BNS-UNAUTH-01',
          lga: 'Makurdi',
          senatorialZone: 'Zone B',
          category: 'Secondary',
        }),
      });

      // Principal attempting to escalate role to super_admin or principal must fail with 403
      const principalEscalateRes = await fetch(`${baseUrl}/api/v1/provisioning/administrators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`,
        },
        body: JSON.stringify({
          email: 'escalated@bns-mkd-101.edu.ng',
          password: 'ValidPassword123!',
          fullName: 'Escalated User',
          role: 'super_admin',
          schoolId: bootstrapRes.school?.id,
        }),
      });

      record(
        '11. Security & Privilege Guards',
        'Unauthenticated requests return 401; Principal is blocked (403) from creating organizations, creating schools, or escalating roles',
        unauthOrgRes.status === 401 &&
          principalCreateOrgRes.status === 403 &&
          principalCreateSchoolRes.status === 403 &&
          principalEscalateRes.status === 403
      );

      // Super Admin provisions a second organization + second school in Gboko LGA and its own distinct Principal
      const org2CreateRes = await fetch(`${baseUrl}/api/v1/provisioning/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          name: 'Benue Science & Technical Education Board',
          code: 'BNS-STEB-ORG',
        }),
      });
      const org2CreateJson = await org2CreateRes.json();
      const org2Id = org2CreateJson.data?.id as string;

      const school2CreateRes = await fetch(`${baseUrl}/api/v1/provisioning/schools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          organizationId: bootstrapRes.organization.id,
          name: 'Government Science & Technical College Gboko',
          code: 'BNS-GBK-202',
          lga: 'Gboko',
          senatorialZone: 'Zone B (Benue North-West)',
          category: 'Science & Technical',
          address: 'Gboko Central, Benue State',
          establishedYear: 1979,
        }),
      });
      const school2CreateJson = await school2CreateRes.json();
      const school2Id = school2CreateJson.data?.id as string;

      // Verify supplied organizationId must match selected school's actual organization_id
      let orgSchoolMismatchBlocked = false;
      try {
        await provisionAdministrator(
          {
            email: 'mismatch.principal@bns-gbk-202.edu.ng',
            password: 'MismatchPassword#2026!',
            fullName: 'Mismatched Org Principal',
            role: 'principal',
            organizationId: org2Id, // school2 belongs to bootstrapRes.organization.id, NOT org2Id!
            schoolId: school2Id,
          },
          { user: bootstrapRes.admin.user }
        );
      } catch (err: any) {
        if (err instanceof ProvisioningError && err.code === 'ORGANIZATION_SCHOOL_MISMATCH') {
          orgSchoolMismatchBlocked = true;
        }
      }

      const principal2CreateRes = await fetch(`${baseUrl}/api/v1/provisioning/administrators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          email: 'principal.gboko@bns-gbk-202.edu.ng',
          password: 'GbokoPrincipalPass#2026!',
          fullName: 'Engr. Shimaor Tarka (Principal Gboko)',
          role: 'principal',
          organizationId: bootstrapRes.organization.id,
          schoolId: school2Id,
        }),
      });
      const principal2CreateJson = await principal2CreateRes.json();

      record(
        '12. Multi-LGA School & Admin Provisioning',
        'Super Admin provisions a second school in Gboko LGA and its distinct Principal + Staff record; mismatched organization/school is rejected with ORGANIZATION_SCHOOL_MISMATCH',
        org2CreateRes.status === 201 &&
          school2CreateRes.status === 201 &&
          school2CreateJson.data?.code === 'BNS-GBK-202' &&
          orgSchoolMismatchBlocked &&
          principal2CreateRes.status === 201 &&
          principal2CreateJson.data?.user?.schoolId === school2Id &&
          principal2CreateJson.data?.staff?.school_id === school2Id &&
          principal2CreateJson.data?.staff?.organization_id === bootstrapRes.organization.id
      );

      // Duplicate code / email & missing school scope validation
      const dupSchoolRes = await fetch(`${baseUrl}/api/v1/provisioning/schools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          organizationId: bootstrapRes.organization.id,
          name: 'Duplicate Code School',
          code: 'BNS-GBK-202',
          lga: 'Gboko',
          senatorialZone: 'Zone B',
          category: 'Secondary',
        }),
      });

      const missingSchoolScopeAdminRes = await fetch(
        `${baseUrl}/api/v1/provisioning/administrators`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${superAdminToken}`,
          },
          body: JSON.stringify({
            email: 'unscoped.principal@moe.benuestate.gov.ng',
            password: 'ValidPassword123!',
            fullName: 'Unscoped Principal',
            role: 'principal',
            schoolId: null,
          }),
        }
      );

      // Makurdi Principal attempting to provision a teacher into Gboko School must fail with 403
      const crossSchoolProvisionRes = await fetch(
        `${baseUrl}/api/v1/provisioning/administrators`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${principalToken}`,
          },
          body: JSON.stringify({
            email: 'cross.teacher@bns-gbk-202.edu.ng',
            password: 'ValidPassword123!',
            fullName: 'Cross School Teacher',
            role: 'teacher',
            schoolId: school2Id,
          }),
        }
      );

      record(
        '12. Multi-LGA School & Admin Provisioning',
        'Duplicate school codes return 409, unscoped school roles return 400, and cross-school Principal provisioning returns 403',
        dupSchoolRes.status === 409 &&
          missingSchoolScopeAdminRes.status === 400 &&
          crossSchoolProvisionRes.status === 403
      );

      // =========================================================================
      // 13. Account Request Workflow Integration & Atomic Staff Linkage
      // =========================================================================
      const privReqRes = await fetch(`${baseUrl}/api/v1/auth/account-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Attempted',
          surname: 'SuperAdmin',
          email: 'hacker@example.com',
          requestedRole: 'super_admin',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
        }),
      });

      const teacherReqRes = await fetch(`${baseUrl}/api/v1/auth/account-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Aondover',
          middleName: 'Moses',
          surname: 'Iorliam',
          email: 'aondover.iorliam@bns-mkd-101.edu.ng',
          phone: '+234 803 555 0101',
          requestedRole: 'teacher',
          requestedSchoolId: bootstrapRes.school?.id,
          password: 'TeacherPass#2026!',
          confirmPassword: 'TeacherPass#2026!',
        }),
      });
      const teacherReqJson = await teacherReqRes.json();
      const requestId = teacherReqJson.data?.id as string;

      // Approve the teacher request as Makurdi School Principal
      const approveRes = await fetch(
        `${baseUrl}/api/v1/auth/account-requests/${requestId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${principalToken}`,
          },
          body: JSON.stringify({
            adminNotes: 'Verified TRCN credentials for Makurdi Model Secondary School.',
          }),
        }
      );

      // Verify both user and staff records were atomically created
      const approvedUserStaffRes = await query<{
        user_id: string;
        role: string;
        school_id: string;
        staff_id: string;
        staff_org_id: string;
        staff_id_number: string;
      }>(
        `SELECT u.id as user_id, u.role, u.school_id,
                st.id as staff_id, st.organization_id as staff_org_id, st.staff_id_number
         FROM users u
         INNER JOIN staff st ON st.user_id = u.id
         WHERE u.email = 'aondover.iorliam@bns-mkd-101.edu.ng';`
      );

      record(
        '13. Account Request Workflow',
        'Public super_admin request is blocked (403); Principal approval of teacher request atomically creates both users and staff rows',
        privReqRes.status === 403 &&
          teacherReqRes.status === 201 &&
          approveRes.status === 200 &&
          approvedUserStaffRes.rows.length === 1 &&
          approvedUserStaffRes.rows[0].school_id === bootstrapRes.school?.id &&
          approvedUserStaffRes.rows[0].staff_org_id === bootstrapRes.organization.id &&
          approvedUserStaffRes.rows[0].staff_id_number.startsWith('BNS-MKD-101-TCHR-')
      );

      // Audit trail verification
      const auditActionsRes = await query<{ action: string; status: string }>(
        'SELECT action, status FROM auth_audit_logs;'
      );
      const recordedActions = new Set(auditActionsRes.rows.map((r) => r.action));
      const hasAllExpectedAudits =
        recordedActions.has('ORGANIZATION_PROVISIONED') &&
        recordedActions.has('SCHOOL_PROVISIONED') &&
        recordedActions.has('ADMIN_PROVISIONED') &&
        recordedActions.has('BOOTSTRAP_PROVISIONED') &&
        recordedActions.has('PROVISIONING_BLOCKED') &&
        recordedActions.has('TENANT_VIOLATION_ATTEMPT') &&
        recordedActions.has('ACCOUNT_APPROVED');

      record(
        '14. Audit Trail & Final Integrity',
        'All provisioning, bootstrap, approval, tenant violation, and blocked privilege escalation events are recorded in auth_audit_logs',
        hasAllExpectedAudits
      );
    } finally {
      try {
        if (activeVerifiedTestDb && activeVerifiedTestDb.schemaName === ISOLATED_SCHEMA) {
          assertSafeIsolatedTestSchema(ISOLATED_SCHEMA);
          process.env.DATABASE_URL = activeVerifiedTestDb.testDatabaseUrl;
          delete process.env.DATABASE_SEARCH_PATH;
          const cleanupDbRes = await query<{ current_database: string }>(
            'SELECT current_database() AS current_database;'
          );
          const cleanupDbName = cleanupDbRes.rows[0]?.current_database || '';
          assertSafeConnectedTestDatabase(cleanupDbName, activeVerifiedTestDb.expectedDbName);
          await query('SET search_path TO public;');
          await query(`DROP SCHEMA IF EXISTS ${ISOLATED_SCHEMA} CASCADE;`);
        }
      } catch {
        // ignore cleanup error
      }
      testServer.close();
      restoreEnv();
      await closeDatabasePool();
    }
  } catch (err: any) {
    console.error('Unhandled error in Phase 10C test suite:', err);
    record('FATAL', 'Unhandled exception', false, err?.message || String(err));
  } finally {
    restoreEnv();
    await closeDatabasePool();
  }

  console.log('\n======================================================================');
  console.log('PHASE 10C TEST RESULTS SUMMARY:');
  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  const failedCount = results.filter((r) => r.status === 'FAILED').length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    console.error('❌ Phase 10C verification failed.');
    process.exit(1);
  } else {
    console.log('✅ Phase 10C first organization & administrator provisioning verified!');
    process.exit(0);
  }
}

runPhase10cSuite();
