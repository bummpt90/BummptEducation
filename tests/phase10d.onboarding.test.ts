/**
 * BummptEducation — Phase 10D: School Onboarding & Institutional Readiness Verification Suite
 * 
 * Verifies the Phase 10D school onboarding workflow against PostgreSQL:
 * 1. Role & Tenant Scope: Caller authority derivation, cross-school access rejection
 * 2. Dedicated Test Database & Isolated Schema Safety Guard:
 *    - Never silently falls back to ordinary DATABASE_URL
 *    - Rejects production mode (NODE_ENV=production)
 *    - Validates test database name via SELECT current_database()
 *    - Restricts destructive operations to /^phase10d_[a-z0-9_]+_test$/
 * 3. 7-Step Onboarding Lifecycle Evaluation:
 *    - Step 1: School Profile (name, code, LGA, zone, category, contact, address, year)
 *    - Step 2: Leadership & Staff (verified principal user, staff link, teaching staff)
 *    - Step 3: Academic Calendar (current session, term, resumption/vacation dates)
 *    - Step 4: Classes & Subjects (canonical classes, state curriculum subjects)
 *    - Step 5: Staff Allocations (subject-class assignments to verified teachers)
 *    - Step 6: Completeness Review (fail-closed check before sign-off)
 *    - Step 7: Operational Launch Gate (distinguishes onboarding readiness from operational launch)
 * 4. School Profile Update & Validation (server-authoritative validation & sanitization)
 * 5. Academic Structure Initialization (canonical classes & allocations)
 * 6. Audit Logging (SCHOOL_PROFILE_UPDATED, SCHOOL_ACADEMIC_STRUCTURE_INITIALIZED, SCHOOL_ONBOARDING_VERIFIED)
 * 7. Zero Real Student/Financial Record Boundary (0 students, 0 fees created)
 * 8. Zero Seeder Coupling (never invokes development/demo seeders)
 * 9. CLI Verification (onboarding:verify script contract)
 * 10. Phase 10C Provisioning & Phase 10B Migration Integrity Preserved
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
  verifyMigrations,
} from '../src/db';
import { authRouter } from '../src/auth/auth.routes';
import { schoolsRouter } from '../src/api/v1/schools.routes';
import { onboardingRouter } from '../src/api/v1/onboarding.routes';
import {
  bootstrapFirstTenantAndAdmin,
  provisionSchool,
  provisionAdministrator,
} from '../src/auth/provisioning.service';
import {
  getSchoolOnboardingStatus,
  updateSchoolProfile,
  initializeSchoolAcademicStructure,
  verifySchoolOnboarding,
  assertCallerSchoolAuthority,
  OnboardingError,
} from '../src/auth/onboarding.service';
import { executeOnboardingVerifyCli } from '../src/db/cli/onboarding-verify';

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

const ISOLATED_TEST_SCHEMA_REGEX = /^phase10d_[a-z0-9_]+_test$/;
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

function extractDatabaseNameFromUrl(connectionString: string): string {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error('INVALID_TEST_DATABASE_URL: PHASE10D_TEST_DATABASE_URL is not a valid URL.');
  }
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\/+/, '').trim());
  if (!dbName) {
    throw new Error('INVALID_TEST_DATABASE_URL: Database name missing in pathname.');
  }
  return dbName;
}

function assertSafeTestDatabaseName(dbName: string): void {
  const trimmed = (dbName || '').trim();
  if (!trimmed) throw new Error('UNSAFE_TEST_DATABASE_NAME: Database name is empty.');
  const normalized = trimmed.toLowerCase();
  if (
    FORBIDDEN_TEST_DB_NAMES.has(normalized) ||
    /(?:^|[_-])(?:prod|production|live|staging)(?:$|[_-])/i.test(normalized)
  ) {
    throw new Error(`UNSAFE_TEST_DATABASE_NAME: '${trimmed}' is a forbidden default/production database name.`);
  }
  if (!SAFE_TEST_DB_NAME_REGEX.test(normalized)) {
    throw new Error(`UNSAFE_TEST_DATABASE_NAME: '${trimmed}' is not clearly designated as a test database.`);
  }
}

function assertSafeIsolatedTestSchema(schemaName: string, nodeEnv = process.env.NODE_ENV): void {
  if ((nodeEnv || '').trim().toLowerCase() === 'production') {
    throw new Error('REFUSED_PRODUCTION_TEST_EXECUTION: Destructive operations prohibited when NODE_ENV=production.');
  }
  if (!schemaName || !ISOLATED_TEST_SCHEMA_REGEX.test(schemaName)) {
    throw new Error(`UNSAFE_TEST_SCHEMA_NAME: '${schemaName}' does not match ${ISOLATED_TEST_SCHEMA_REGEX}.`);
  }
}

function assertSafeDedicatedTestDatabaseConfig(input: DedicatedTestDbGuardInput): {
  testDatabaseUrl: string;
  expectedDbName: string;
  schemaName: string;
} {
  const effectiveNodeEnv = (input.nodeEnv ?? process.env.NODE_ENV ?? '').trim().toLowerCase();
  if (effectiveNodeEnv === 'production') {
    throw new Error('REFUSED_PRODUCTION_TEST_EXECUTION: Destructive tests prohibited when NODE_ENV=production.');
  }

  assertSafeIsolatedTestSchema(input.schemaName, effectiveNodeEnv);

  const optIn = (input.allowDestructiveOptIn ?? '').trim();
  if (optIn !== 'true') {
    throw new Error('MISSING_DESTRUCTIVE_TEST_OPT_IN: ALLOW_DESTRUCTIVE_PHASE10D_TESTS=true required.');
  }

  const rawTestUrl = (input.testDatabaseUrl ?? '').trim();
  if (!rawTestUrl) {
    throw new Error('MISSING_TEST_DATABASE_URL: PHASE10D_TEST_DATABASE_URL required; refusing to use DATABASE_URL.');
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
      throw new Error(`UNSAFE_TEST_DATABASE_NAME: Test DB URL must not match ordinary DATABASE_URL database '${ordinaryDbName}'.`);
    }
  }

  return { testDatabaseUrl: rawTestUrl, expectedDbName, schemaName: input.schemaName };
}

function assertSafeConnectedTestDatabase(actualConnectedDbName: string, expectedDbName: string): void {
  assertSafeTestDatabaseName(actualConnectedDbName);
  if (actualConnectedDbName.trim().toLowerCase() !== expectedDbName.trim().toLowerCase()) {
    throw new Error(`TEST_DATABASE_NAME_MISMATCH: Connected DB '${actualConnectedDbName}' !== expected '${expectedDbName}'.`);
  }
}

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

async function resetIsolatedTestSchema(schemaName: string, poolSize = 2): Promise<void> {
  if (!activeVerifiedTestDb) {
    throw new Error('UNVERIFIED_TEST_DATABASE: Cannot reset schema before database is verified.');
  }
  assertSafeIsolatedTestSchema(schemaName);

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
    throw new Error(`Expected active schema '${schemaName}', got '${currentSchemaRes.rows[0]?.current_schema}'`);
  }

  const migRes = await runMigrations();
  if (!migRes.success) {
    throw new Error(`Migrations failed on schema ${schemaName}: ${migRes.error}`);
  }
}

async function runPhase10dSuite() {
  console.log('======================================================================');
  console.log('BummptEducation — Phase 10D School Onboarding & Readiness Verification');
  console.log('======================================================================\n');

  const savedEnv = { ...process.env };
  function restoreEnv() {
    for (const k of Object.keys(process.env)) {
      if (!(k in savedEnv)) delete process.env[k];
    }
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  const ISOLATED_SCHEMA = 'phase10d_onboarding_test';

  try {
    // =========================================================================
    // 1. Role, Authorization & Seeder Boundary Static Verification
    // =========================================================================
    const serviceSource = fs.readFileSync(
      path.join(process.cwd(), 'src/auth/onboarding.service.ts'),
      'utf-8'
    );
    const cliSource = fs.readFileSync(
      path.join(process.cwd(), 'src/db/cli/onboarding-verify.ts'),
      'utf-8'
    );
    const routesSource = fs.readFileSync(
      path.join(process.cwd(), 'src/api/v1/onboarding.routes.ts'),
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
    ];

    const zeroSeederCoupling = forbiddenSeedPatterns.every(
      (pat) => !serviceSource.includes(pat) && !cliSource.includes(pat) && !routesSource.includes(pat)
    );

    record(
      '1. Seeder Isolation Boundary',
      'Onboarding service, API routes, and verification CLI never import or invoke development/demo seeders',
      zeroSeederCoupling
    );

    // Verify localStorage UI preference cannot override server authority
    const uiPreferenceNotTrusted =
      !serviceSource.includes('bummpt_ActiveSchoolId_v1') &&
      !routesSource.includes('bummpt_ActiveSchoolId_v1');

    record(
      '1. Presentation Preference Boundary',
      'Server-side onboarding service and API routes never read or trust client-side localStorage preference (bummpt_ActiveSchoolId_v1)',
      uiPreferenceNotTrusted
    );

    // Verify caller authority derivation helper
    let callerAuthSuperAdminOk = false;
    let callerAuthPrincipalOwnOk = false;
    let callerAuthPrincipalCrossBlocked = false;
    let callerAuthUnauthenticatedBlocked = false;

    try {
      assertCallerSchoolAuthority('00000000-0000-0000-0000-000000000001', {
        user: { id: 'u1', email: 'sa@test.com', role: 'super_admin', isSuperAdmin: true },
      });
      callerAuthSuperAdminOk = true;
    } catch {
      callerAuthSuperAdminOk = false;
    }

    try {
      assertCallerSchoolAuthority('00000000-0000-0000-0000-000000000001', {
        user: { id: 'u2', email: 'p@test.com', role: 'principal', schoolId: '00000000-0000-0000-0000-000000000001' },
      });
      callerAuthPrincipalOwnOk = true;
    } catch {
      callerAuthPrincipalOwnOk = false;
    }

    try {
      assertCallerSchoolAuthority('00000000-0000-0000-0000-000000000002', {
        user: { id: 'u2', email: 'p@test.com', role: 'principal', schoolId: '00000000-0000-0000-0000-000000000001' },
      });
    } catch (err: any) {
      if (err instanceof OnboardingError && err.code === 'TENANT_ISOLATION_VIOLATION') {
        callerAuthPrincipalCrossBlocked = true;
      }
    }

    try {
      assertCallerSchoolAuthority('00000000-0000-0000-0000-000000000001', { user: null as any });
    } catch (err: any) {
      if (err instanceof OnboardingError && err.code === 'UNAUTHENTICATED') {
        callerAuthUnauthenticatedBlocked = true;
      }
    }

    record(
      '2. Tenant Isolation & RBAC',
      'assertCallerSchoolAuthority() permits Super Admin and assigned Principal, while strictly blocking cross-school access and unauthenticated calls',
      callerAuthSuperAdminOk &&
        callerAuthPrincipalOwnOk &&
        callerAuthPrincipalCrossBlocked &&
        callerAuthUnauthenticatedBlocked
    );

    // =========================================================================
    // 2. Dedicated Test Database Guard & Safety Guard Verification
    // =========================================================================
    let missingTestUrlBlocked = false;
    try {
      assertSafeDedicatedTestDatabaseConfig({
        testDatabaseUrl: '',
        ordinaryDatabaseUrl: 'postgresql://u:p@localhost:5432/neondb',
        allowDestructiveOptIn: 'true',
        nodeEnv: 'test',
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (err: any) {
      missingTestUrlBlocked = Boolean(err?.message?.includes('MISSING_TEST_DATABASE_URL'));
    }

    let missingOptInBlocked = false;
    try {
      assertSafeDedicatedTestDatabaseConfig({
        testDatabaseUrl: 'postgresql://u:p@localhost:5432/bummpt_phase10d_test',
        ordinaryDatabaseUrl: 'postgresql://u:p@localhost:5432/neondb',
        allowDestructiveOptIn: 'false',
        nodeEnv: 'test',
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (err: any) {
      missingOptInBlocked = Boolean(err?.message?.includes('MISSING_DESTRUCTIVE_TEST_OPT_IN'));
    }

    let prodModeBlocked = false;
    try {
      assertSafeDedicatedTestDatabaseConfig({
        testDatabaseUrl: 'postgresql://u:p@localhost:5432/bummpt_phase10d_test',
        ordinaryDatabaseUrl: 'postgresql://u:p@localhost:5432/neondb',
        allowDestructiveOptIn: 'true',
        nodeEnv: 'production',
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (err: any) {
      prodModeBlocked = Boolean(err?.message?.includes('REFUSED_PRODUCTION_TEST_EXECUTION'));
    }

    let unsafeDbBlocked = false;
    try {
      assertSafeDedicatedTestDatabaseConfig({
        testDatabaseUrl: 'postgresql://u:p@localhost:5432/neondb',
        ordinaryDatabaseUrl: 'postgresql://u:p@localhost:5432/other_db',
        allowDestructiveOptIn: 'true',
        nodeEnv: 'test',
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (err: any) {
      unsafeDbBlocked = Boolean(err?.message?.includes('UNSAFE_TEST_DATABASE_NAME'));
    }

    let unsafeSchemaBlocked = false;
    try {
      assertSafeIsolatedTestSchema('public', 'test');
    } catch (err: any) {
      unsafeSchemaBlocked = Boolean(err?.message?.includes('UNSAFE_TEST_SCHEMA_NAME'));
    }

    record(
      '3. Fail-Closed Test DB Guard',
      'Test DB guard rejects missing test URL, missing opt-in, production mode, unsafe database names, and public/unrelated schemas',
      missingTestUrlBlocked && missingOptInBlocked && prodModeBlocked && unsafeDbBlocked && unsafeSchemaBlocked
    );

    // =========================================================================
    // Verify & Connect Live Dedicated Test Database Before Destructive Setup
    // =========================================================================
    restoreEnv();
    const testUrl =
      process.env.PHASE10D_TEST_DATABASE_URL ||
      process.env.PHASE10C_TEST_DATABASE_URL ||
      '';
    const optIn =
      process.env.ALLOW_DESTRUCTIVE_PHASE10D_TESTS ||
      process.env.ALLOW_DESTRUCTIVE_PHASE10C_TESTS ||
      '';

    let verifiedTestDb: VerifiedDedicatedTestDatabase;
    try {
      verifiedTestDb = await verifyAndBindDedicatedTestDatabase({
        testDatabaseUrl: testUrl,
        ordinaryDatabaseUrl: savedEnv.DATABASE_URL,
        allowDestructiveOptIn: optIn,
        nodeEnv: savedEnv.NODE_ENV,
        schemaName: ISOLATED_SCHEMA,
      });
    } catch (guardErr: any) {
      const reason = guardErr?.message || String(guardErr);
      console.warn('\n----------------------------------------------------------------------');
      console.warn(`⚠️  [SAFE STOP] Destructive Phase 10D test suite halted by fail-closed test-database guard:`);
      console.warn(`   ${reason}`);
      console.warn('   No schema drops, migrations, or writes were executed against DATABASE_URL or any other database.');
      console.warn('----------------------------------------------------------------------\n');
      record(
        '3. Fail-Closed Test DB Guard (Live Connection)',
        'Dedicated test database connection verified before destructive Phase 10D tests',
        false,
        `Stopped safely: ${reason}`
      );
      restoreEnv();
      await closeDatabasePool();
      console.log('======================================================================');
      console.log('PHASE 10D TEST RESULTS SUMMARY (SAFE STOP BEFORE DESTRUCTIVE DB SETUP):');
      const passedOnStop = results.filter((r) => r.status === 'PASSED').length;
      const failedOnStop = results.filter((r) => r.status === 'FAILED').length;
      console.log(`Total: ${results.length} | Passed: ${passedOnStop} | Failed: ${failedOnStop}`);
      console.log('======================================================================\n');
      process.exit(1);
    }

    record(
      '3. Fail-Closed Test DB Guard (Live Connection)',
      `Connected to verified dedicated test database '${verifiedTestDb.actualDbName}' using schema '${verifiedTestDb.schemaName}'`,
      verifiedTestDb.actualDbName === verifiedTestDb.expectedDbName
    );

    // =========================================================================
    // 3. Isolated PostgreSQL Integration Testing
    // =========================================================================
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/schools', schoolsRouter);
    app.use('/api/v1/onboarding', onboardingRouter);

    const testServer = http.createServer(app);
    await new Promise<void>((resolve) => testServer.listen(0, '127.0.0.1', () => resolve()));
    const port = (testServer.address() as any).port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      await resetIsolatedTestSchema(ISOLATED_SCHEMA, 2);

      // -----------------------------------------------------------------------
      // 3A. Provision First Organization, First School & Administrators
      // -----------------------------------------------------------------------
      const bootstrapRes = await bootstrapFirstTenantAndAdmin({
        organization: {
          name: 'Benue State Ministry of Education & SUBEB',
          code: 'BNS-MOE-HQ',
        },
        school: {
          name: 'Government Model Secondary School Makurdi',
          code: 'BNS-MKD-001',
          lga: 'Makurdi',
          senatorialZone: 'Zone B (Benue North-West)',
          category: 'Secondary',
        },
        admin: {
          email: 'admin@example.invalid',
          password: 'StrongAdminPassword#2026!',
          fullName: 'State Platform Administrator',
          role: 'super_admin',
        },
        schoolPrincipal: {
          email: 'principal.makurdi@example.invalid',
          password: 'MakurdiPrincipalPass#2026!',
          fullName: 'Dr. Terver Udu (Principal Makurdi)',
        },
      });

      const school1Id = bootstrapRes.school!.id;
      const superAdminUser = bootstrapRes.admin.user;
      const principal1User = bootstrapRes.schoolPrincipal!.user;

      // Provision a second school in Gboko with a distinct Principal
      const school2Res = await provisionSchool(
        {
          organizationId: bootstrapRes.organization.id,
          name: 'Government Science College Gboko',
          code: 'BNS-GBK-002',
          lga: 'Gboko',
          senatorialZone: 'Zone B (Benue North-West)',
          category: 'Secondary',
        },
        { user: superAdminUser }
      );
      const school2Id = school2Res.id;

      const principal2Res = await provisionAdministrator(
        {
          email: 'principal.gboko@example.invalid',
          password: 'GbokoPrincipalPass#2026!',
          fullName: 'Mrs. Dooshima Agbo (Principal Gboko)',
          role: 'principal',
          schoolId: school2Id,
          organizationId: bootstrapRes.organization.id,
        },
        { user: superAdminUser }
      );
      const principal2User = principal2Res.user;

      // Authenticate tokens
      const superAdminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.invalid', password: 'StrongAdminPassword#2026!' }),
      });
      const superAdminJson = await superAdminLoginRes.json();
      const superAdminToken = superAdminJson.token || superAdminJson.data?.token;

      const principal1LoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'principal.makurdi@example.invalid', password: 'MakurdiPrincipalPass#2026!' }),
      });
      const principal1Json = await principal1LoginRes.json();
      const principal1Token = principal1Json.token || principal1Json.data?.token;

      const principal2LoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'principal.gboko@example.invalid', password: 'GbokoPrincipalPass#2026!' }),
      });
      const principal2Json = await principal2LoginRes.json();
      const principal2Token = principal2Json.token || principal2Json.data?.token;

      // -----------------------------------------------------------------------
      // 3B. Initial Onboarding Retrieval & Cross-School Tenant Boundary
      // -----------------------------------------------------------------------
      // Principal 1 retrieves own school onboarding
      const getOwnOnboardingRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding`, {
        headers: { Authorization: `Bearer ${principal1Token}` },
      });
      const getOwnOnboardingJson = await getOwnOnboardingRes.json();

      record(
        '4. Onboarding Retrieval & Scope',
        'Authorized Principal retrieves server-authoritative onboarding status for assigned school',
        getOwnOnboardingRes.status === 200 &&
          getOwnOnboardingJson.success === true &&
          getOwnOnboardingJson.data.schoolCode === 'BNS-MKD-001' &&
          getOwnOnboardingJson.data.overallStatus === 'ONBOARDING_INCOMPLETE'
      );

      // Principal 1 attempts to access Gboko School (School 2) -> 403 Forbidden
      const getCrossOnboardingRes = await fetch(`${baseUrl}/api/v1/schools/${school2Id}/onboarding`, {
        headers: { Authorization: `Bearer ${principal1Token}` },
      });
      const getCrossOnboardingJson = await getCrossOnboardingRes.json();

      record(
        '4. Onboarding Retrieval & Scope',
        'Cross-school onboarding access is strictly blocked with 403 TENANT_ISOLATION_VIOLATION',
        getCrossOnboardingRes.status === 403 &&
          getCrossOnboardingJson.error === 'TENANT_ISOLATION_VIOLATION'
      );

      // Super Admin retrieves any school onboarding
      const superAdminViewSchool2Res = await fetch(`${baseUrl}/api/v1/schools/${school2Id}/onboarding`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      record(
        '4. Onboarding Retrieval & Scope',
        'Super Admin can retrieve onboarding status across all schools in the organization',
        superAdminViewSchool2Res.status === 200
      );

      // -----------------------------------------------------------------------
      // 3C. Premature Verification Rejection (Fail-Closed Gate)
      // -----------------------------------------------------------------------
      // Attempting to verify onboarding when classes and allocations are missing fails closed
      const prematureVerifyRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${principal1Token}` },
      });
      const prematureVerifyJson = await prematureVerifyRes.json();

      record(
        '5. Fail-Closed Verification Gate',
        'Attempting to verify onboarding before mandatory prerequisites are complete is rejected with 400 ONBOARDING_INCOMPLETE',
        prematureVerifyRes.status === 400 &&
          prematureVerifyJson.error === 'ONBOARDING_INCOMPLETE' &&
          prematureVerifyJson.details?.missingSteps?.length > 0
      );

      // -----------------------------------------------------------------------
      // 3D. Institutional School Profile Update & Validation
      // -----------------------------------------------------------------------
      // Invalid year rejected
      const invalidProfileRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({ establishedYear: 1800 }),
      });
      const invalidProfileJson = await invalidProfileRes.json();

      record(
        '6. Profile Validation & Updates',
        'Profile updates validate inputs server-side (rejects established year outside 1840..currentYear)',
        invalidProfileRes.status === 400 &&
          invalidProfileJson.error === 'INVALID_ESTABLISHED_YEAR'
      );

      // Valid profile update
      const validProfileRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          phone: '+234 803 123 4567',
          email: 'model.makurdi@moe.benuestate.gov.ng',
          address: 'Km 4, Aliade Road, Makurdi, Benue State',
          establishedYear: 1982,
          bursarName: 'Mr. Emmanuel Terna (Bursar)',
          vicePrincipalAcademic: 'Mrs. Janet Iorliam (VP Academic)',
        }),
      });
      const validProfileJson = await validProfileRes.json();

      record(
        '6. Profile Validation & Updates',
        'Authorized Principal updates institutional contact, address, establishment, and administrative officers in PostgreSQL',
        validProfileRes.status === 200 &&
          validProfileJson.success === true &&
          validProfileJson.data.institutionalProfile.phone === '+234 803 123 4567' &&
          validProfileJson.data.institutionalProfile.establishedYear === 1982 &&
          validProfileJson.data.institutionalProfile.bursarName === 'Mr. Emmanuel Terna (Bursar)'
      );

      // Cross-school profile update attempt by Principal 2 on School 1 is rejected
      const crossProfileRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal2Token}`,
        },
        body: JSON.stringify({ address: 'Hacked Address' }),
      });
      record(
        '6. Profile Validation & Updates',
        'Cross-school profile modification attempt is strictly rejected with 403',
        crossProfileRes.status === 403
      );

      // -----------------------------------------------------------------------
      // 3E. Academic Calendar & Structure Initialization
      // -----------------------------------------------------------------------
      // Configure an active academic session and term in PostgreSQL
      const sessionRes = await query<{ id: string }>(
        `INSERT INTO academic_sessions (session_name, is_current, start_date, end_date)
         VALUES ('2025/2026', TRUE, '2025-09-08', '2026-07-24')
         ON CONFLICT (session_name) DO UPDATE SET is_current = TRUE
         RETURNING id;`
      );
      const sessionId = sessionRes.rows[0].id;

      await query(
        `INSERT INTO academic_terms (session_id, term_name, is_current, resumption_date, vacation_date, statutory_school_days)
         VALUES ($1, '1st Term', TRUE, '2025-09-08', '2025-12-19', 65)
         ON CONFLICT (session_id, term_name) DO UPDATE SET is_current = TRUE;`,
        [sessionId]
      );

      // Configure a core curriculum subject in PostgreSQL
      await query(
        `INSERT INTO subjects (code, name, category, department_id, arm, applicable_levels)
         VALUES 
           ('ENG-001', 'English Language', 'General Studies', 'Languages', 'secondary', ARRAY['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']),
           ('MTH-001', 'General Mathematics', 'Sciences', 'Mathematics', 'secondary', ARRAY['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'])
         ON CONFLICT (code) DO NOTHING;`
      );

      // Initialize canonical classes for School 1
      const initStructureRes = await fetch(
        `${baseUrl}/api/v1/schools/${school1Id}/onboarding/academic-structure`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${principal1Token}`,
          },
          body: JSON.stringify({}),
        }
      );
      const initStructureJson = await initStructureRes.json();

      record(
        '7. Academic Structure Configuration',
        'Authorized Principal initializes canonical classes and subject curriculum allocations for the school',
        initStructureRes.status === 200 &&
          initStructureJson.success === true &&
          initStructureJson.data.metrics.classesCount >= 6 &&
          initStructureJson.data.metrics.allocationsCount >= 2
      );

      // -----------------------------------------------------------------------
      // 3F. Formal Onboarding Verification Sign-Off
      // -----------------------------------------------------------------------
      const verifyRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
      });
      const verifyJson = await verifyRes.json();

      record(
        '8. Onboarding Verification & Gate',
        'All mandatory institutional prerequisites satisfied: verification completes with overallStatus="ONBOARDING_READY"',
        verifyRes.status === 200 &&
          verifyJson.success === true &&
          verifyJson.data.overallStatus === 'ONBOARDING_READY' &&
          verifyJson.data.completionPercentage === 100
      );

      record(
        '8. Onboarding Verification & Gate',
        'Operational launch gate remains strictly "OPERATIONAL_LAUNCH_NOT_AUTHORIZED" (Phase 10E boundary)',
        verifyJson.data.operationalLaunchStatus === 'OPERATIONAL_LAUNCH_NOT_AUTHORIZED' &&
          verifyJson.data.declarations.operationalLaunchAuthorized === false
      );

      // -----------------------------------------------------------------------
      // 3G. Zero Student/Parent/Financial Records Boundary
      // -----------------------------------------------------------------------
      const studentCountCheck = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM students WHERE school_id = $1;',
        [school1Id]
      );
      const invoiceCountCheck = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM fee_invoices WHERE school_id = $1;',
        [school1Id]
      );

      record(
        '9. Zero Student/Financial Records Boundary',
        'Strict Phase 10D non-goal enforced: zero students and zero invoices created during onboarding',
        studentCountCheck.rows[0].count === '0' && invoiceCountCheck.rows[0].count === '0'
      );

      // -----------------------------------------------------------------------
      // 3H. Audit Logging Verification
      // -----------------------------------------------------------------------
      const auditLogsRes = await query<{ action: string; status: string }>(
        'SELECT action, status FROM auth_audit_logs WHERE details->>\'schoolId\' = $1;',
        [school1Id]
      );
      const recordedActions = new Set(auditLogsRes.rows.map((r) => r.action));

      record(
        '10. Audit Infrastructure',
        'All onboarding updates, structural initializations, blocked attempts, and verification sign-offs are audited in auth_audit_logs',
        recordedActions.has('SCHOOL_PROFILE_UPDATED') &&
          recordedActions.has('SCHOOL_ACADEMIC_STRUCTURE_INITIALIZED') &&
          recordedActions.has('SCHOOL_ONBOARDING_VERIFICATION_REJECTED') &&
          recordedActions.has('SCHOOL_ONBOARDING_VERIFIED')
      );

      // -----------------------------------------------------------------------
      // 3I. Read-Only CLI Verification Test
      // -----------------------------------------------------------------------
      process.env.SCHOOL_CODE = 'BNS-MKD-001';
      const cliResult = await executeOnboardingVerifyCli();

      record(
        '11. CLI Verification Script',
        'npm run onboarding:verify executes read-only inspection against PostgreSQL and exits with code 0 on ONBOARDING_READY school',
        cliResult.exitCode === 0 && cliResult.message.includes('ONBOARDING_READY')
      );

      // -----------------------------------------------------------------------
      // 3J. Migration System & Integrity Check
      // -----------------------------------------------------------------------
      const migVerify = await verifyMigrations();
      record(
        '12. Migration System Integrity',
        'All 11 migrations (0001..0011) remain checksum-verified and ready',
        migVerify.ready === true && migVerify.appliedCount === 11
      );
    } finally {
      testServer.close();
      try {
        if (activeVerifiedTestDb && activeVerifiedTestDb.schemaName === ISOLATED_SCHEMA) {
          process.env.DATABASE_URL = activeVerifiedTestDb.testDatabaseUrl;
          delete process.env.DATABASE_SEARCH_PATH;
          await query('SET search_path TO public;');
          await query(`DROP SCHEMA IF EXISTS ${ISOLATED_SCHEMA} CASCADE;`);
        }
      } catch {
        // ignore cleanup error
      }
      restoreEnv();
      await closeDatabasePool();
    }
  } catch (err: any) {
    console.error('Unhandled error in Phase 10D test suite:', err);
    record('FATAL', 'Unhandled exception', false, err?.message || String(err));
  } finally {
    restoreEnv();
    await closeDatabasePool();
  }

  console.log('\n======================================================================');
  console.log('PHASE 10D TEST RESULTS SUMMARY:');
  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  const failedCount = results.filter((r) => r.status === 'FAILED').length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    console.error('❌ Phase 10D verification failed.');
    process.exit(1);
  } else {
    console.log('✅ Phase 10D school onboarding & institutional readiness verified!');
    process.exit(0);
  }
}

runPhase10dSuite();
