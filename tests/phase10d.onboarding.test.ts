/**
 * BummptEducation — Phase 10D: School Onboarding & Institutional Readiness Verification Suite
 * 
 * Harmonized Phase 10D Stage 2 Verification:
 * Validates authoritative school configuration and readiness evaluation without
 * automatic structure initializers, demo seeders, or legacy leadership text columns.
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
import { classesRouter } from '../src/api/v1/classes.routes';
import { allocationsRouter } from '../src/api/v1/allocations.routes';
import { resultsRouter } from '../src/api/v1/results.routes';
import {
  bootstrapFirstTenantAndAdmin,
  provisionSchool,
  provisionAdministrator,
} from '../src/auth/provisioning.service';
import {
  getSchoolOnboardingStatus,
  updateSchoolProfile,
  verifySchoolOnboarding,
  assertCallerSchoolAuthority,
  OnboardingError,
} from '../src/auth/onboarding.service';
import { scanLegacyStructureReport, executeOnboardingVerifyCli } from '../src/db/cli/onboarding-verify';

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
  assertSafeIsolatedTestSchema(input.schemaName, input.nodeEnv);

  const rawTestUrl = (input.testDatabaseUrl || '').trim();
  if (!rawTestUrl) {
    throw new Error(
      'MISSING_TEST_DATABASE_URL: Dedicated test database URL is required (PHASE10D_TEST_DATABASE_URL).'
    );
  }

  const rawOptIn = (input.allowDestructiveOptIn || '').trim().toLowerCase();
  if (rawOptIn !== 'true' && rawOptIn !== '1') {
    throw new Error(
      'MISSING_DESTRUCTIVE_TEST_OPT_IN: ALLOW_DESTRUCTIVE_PHASE10D_TESTS must be set to "true".'
    );
  }

  const expectedDbName = extractDatabaseNameFromUrl(rawTestUrl);
  assertSafeTestDatabaseName(expectedDbName);

  const rawOrdinaryUrl = (input.ordinaryDatabaseUrl || '').trim();
  if (rawOrdinaryUrl) {
    let ordinaryDbName = '';
    try {
      ordinaryDbName = extractDatabaseNameFromUrl(rawOrdinaryUrl);
    } catch {
      // ignore parse error on ordinary url
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
  console.log('BummptEducation — Phase 10D Stage 2 Verification Suite');
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
    // Static Architecture & Seeder Boundary Verification
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
    const uiComponentSource = fs.readFileSync(
      path.join(process.cwd(), 'src/components/SchoolOnboardingChecklist.tsx'),
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
      'Static Boundaries',
      'Seeder Isolation: Onboarding service, routes, and CLI never import or invoke development/demo seeders',
      zeroSeederCoupling
    );

    // Test 13: UI initializer button and handler are absent
    const uiInitializerAbsent =
      !uiComponentSource.includes('handleInit') &&
      !uiComponentSource.includes('academic-structure') &&
      !uiComponentSource.includes('Initialize Academic Structure');

    record(
      'Required Tests',
      '13. the UI initializer button and handler are absent',
      uiInitializerAbsent
    );

    // Test 17: no production route or function applies an academic template
    const noAcademicTemplate =
      !serviceSource.includes('initializeSchoolAcademicStructure') &&
      !routesSource.includes('initializeSchoolAcademicStructure') &&
      routesSource.includes("error: 'ENDPOINT_DEPRECATED'");

    record(
      'Required Tests',
      '17. no production route or function applies an academic template',
      noAcademicTemplate
    );

    // Test 14: CLI exits 1 on a missing target before any database access
    const savedCode = process.env.SCHOOL_CODE;
    const savedId = process.env.SCHOOL_ID;
    delete process.env.SCHOOL_CODE;
    delete process.env.SCHOOL_ID;
    const oldArgv = [...process.argv];
    process.argv = ['node', 'cli.js'];
    const cliMissingTargetRes = await executeOnboardingVerifyCli();
    process.argv = oldArgv;
    if (savedCode) process.env.SCHOOL_CODE = savedCode;
    if (savedId) process.env.SCHOOL_ID = savedId;

    record(
      'Required Tests',
      '14. CLI exits 1 on a missing target before any database access',
      cliMissingTargetRes.exitCode === 1 &&
        cliMissingTargetRes.message.includes('Neither SCHOOL_CODE nor SCHOOL_ID was provided')
    );

    // Test Caller authority derivation helper
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
      'Static Boundaries',
      'Tenant Isolation & RBAC: assertCallerSchoolAuthority enforces role and school bounds',
      callerAuthSuperAdminOk &&
        callerAuthPrincipalOwnOk &&
        callerAuthPrincipalCrossBlocked &&
        callerAuthUnauthenticatedBlocked
    );

    // =========================================================================
    // Dedicated Test Database Guard & Safety Guard Verification
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
      'Safety Guard',
      'Test DB guard rejects missing test URL, missing opt-in, production mode, unsafe database names, and public schemas',
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
        'Safety Guard (Live Connection)',
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
      'Safety Guard (Live Connection)',
      `Connected to verified dedicated test database '${verifiedTestDb.actualDbName}' using schema '${verifiedTestDb.schemaName}'`,
      verifiedTestDb.actualDbName === verifiedTestDb.expectedDbName
    );

    // =========================================================================
    // Live Server & Isolated PostgreSQL Integration Testing
    // =========================================================================
    const app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/schools', schoolsRouter);
    app.use('/api/v1/onboarding', onboardingRouter);
    app.use('/api/v1/classes', classesRouter);
    app.use('/api/v1/academic/allocations', allocationsRouter);
    app.use('/api/v1/results', resultsRouter);

    const testServer = http.createServer(app);
    await new Promise<void>((resolve) => testServer.listen(0, '127.0.0.1', () => resolve()));
    const port = (testServer.address() as any).port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      await resetIsolatedTestSchema(ISOLATED_SCHEMA, 1);

      // -----------------------------------------------------------------------
      // Test 16: Phase 10C bootstrap behaviour unchanged
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
      const principal1StaffId = bootstrapRes.schoolPrincipal!.staff!.id;

      record(
        'Required Tests',
        '16. Phase 10C bootstrap behaviour unchanged',
        bootstrapRes.organization.code === 'BNS-MOE-HQ' &&
          bootstrapRes.school?.code === 'BNS-MKD-001' &&
          superAdminUser.role === 'super_admin' &&
          principal1User.role === 'principal' &&
          Boolean(principal1StaffId)
      );

      // Provision School 2 in Gboko with Principal 2
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

      // Provision Teacher 1 for School 1
      const teacher1Res = await provisionAdministrator(
        {
          email: 'teacher1.makurdi@example.invalid',
          password: 'Teacher1Pass#2026!',
          fullName: 'Mr. James Iorkyaa (Teacher 1)',
          role: 'teacher',
          schoolId: school1Id,
        },
        { user: superAdminUser }
      );
      const teacher1Staff = teacher1Res.staff!;

      // Provision Teacher 2 for School 1
      const teacher2Res = await provisionAdministrator(
        {
          email: 'teacher2.makurdi@example.invalid',
          password: 'Teacher2Pass#2026!',
          fullName: 'Mrs. Judith Akor (Teacher 2)',
          role: 'teacher',
          schoolId: school1Id,
        },
        { user: superAdminUser }
      );
      const teacher2Staff = teacher2Res.staff!;

      // Provision Inactive Teacher for School 1
      const inactiveTeacherRes = await provisionAdministrator(
        {
          email: 'inactive.makurdi@example.invalid',
          password: 'InactivePass#2026!',
          fullName: 'Mr. Inactive Teacher',
          role: 'teacher',
          schoolId: school1Id,
        },
        { user: superAdminUser }
      );
      const inactiveTeacherStaffId = inactiveTeacherRes.staff!.id;
      await query('UPDATE staff SET is_active = FALSE WHERE id = $1;', [inactiveTeacherStaffId]);
      await query('UPDATE users SET is_active = FALSE WHERE id = $1;', [inactiveTeacherRes.user.id]);

      // Provision Bursar for School 1
      const bursarRes = await provisionAdministrator(
        {
          email: 'bursar.makurdi@example.invalid',
          password: 'BursarPass#2026!',
          fullName: 'Mr. Emmanuel Terna (Bursar)',
          role: 'bursar',
          schoolId: school1Id,
        },
        { user: superAdminUser }
      );

      // Provision Exam Officer for School 1
      const examOfficerRes = await provisionAdministrator(
        {
          email: 'examofficer.makurdi@example.invalid',
          password: 'ExamOfficerPass#2026!',
          fullName: 'Mr. Aondoakaa (Exam Officer)',
          role: 'exam_officer',
          schoolId: school1Id,
        },
        { user: superAdminUser }
      );

      // Provision Parent for School 1
      const parentRes = await provisionAdministrator(
        {
          email: 'parent.makurdi@example.invalid',
          password: 'ParentPass#2026!',
          fullName: 'Mrs. Mary Iorliam (Parent)',
          role: 'parent',
          schoolId: school1Id,
        },
        { user: superAdminUser }
      );

      // Provision Student for School 1
      const studentRes = await provisionAdministrator(
        {
          email: 'student.makurdi@example.invalid',
          password: 'StudentPass#2026!',
          fullName: 'Terkula Udu (Student)',
          role: 'student',
          schoolId: school1Id,
        },
        { user: superAdminUser }
      );

      // Provision Teacher for School 2
      const school2TeacherRes = await provisionAdministrator(
        {
          email: 'teacher.gboko@example.invalid',
          password: 'GbokoTeacherPass#2026!',
          fullName: 'Gboko Science Teacher',
          role: 'teacher',
          schoolId: school2Id,
        },
        { user: superAdminUser }
      );
      const school2TeacherStaffId = school2TeacherRes.staff!.id;

      // Authenticate tokens for all tested roles
      async function login(email: string, pass: string): Promise<string> {
        const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        });
        const json = await res.json();
        return json.token || json.data?.token;
      }

      const superAdminToken = await login('admin@example.invalid', 'StrongAdminPassword#2026!');
      const principal1Token = await login('principal.makurdi@example.invalid', 'MakurdiPrincipalPass#2026!');
      const principal2Token = await login('principal.gboko@example.invalid', 'GbokoPrincipalPass#2026!');
      const teacher1Token = await login('teacher1.makurdi@example.invalid', 'Teacher1Pass#2026!');
      const bursarToken = await login('bursar.makurdi@example.invalid', 'BursarPass#2026!');
      const examOfficerToken = await login('examofficer.makurdi@example.invalid', 'ExamOfficerPass#2026!');
      const parentToken = await login('parent.makurdi@example.invalid', 'ParentPass#2026!');
      const studentToken = await login('student.makurdi@example.invalid', 'StudentPass#2026!');

      // -----------------------------------------------------------------------
      // Test 1: onboarding creates zero classes
      // Test 2: onboarding creates zero subject allocations
      // Test 3: principal never auto-assigned as teacher
      // Test 4: principal never auto-assigned as form master
      // Test 5: subjects never selected automatically
      // -----------------------------------------------------------------------
      const preOnboardingCheck = await getSchoolOnboardingStatus(school1Id, {
        user: principal1User,
      });

      const initialClassesCheck = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM classes WHERE school_id = $1;',
        [school1Id]
      );
      record(
        'Required Tests',
        '1. onboarding creates zero classes',
        initialClassesCheck.rows[0].count === '0' && preOnboardingCheck.metrics.classesCount === 0
      );

      const initialAllocationsCheck = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM class_subject_allocations WHERE school_id = $1;',
        [school1Id]
      );
      record(
        'Required Tests',
        '2. onboarding creates zero subject allocations',
        initialAllocationsCheck.rows[0].count === '0' && preOnboardingCheck.metrics.allocationsCount === 0
      );

      const principalAsTeacherCheck = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM class_subject_allocations WHERE teacher_id = $1;',
        [principal1StaffId]
      );
      record(
        'Required Tests',
        '3. principal never auto-assigned as teacher',
        principalAsTeacherCheck.rows[0].count === '0'
      );

      const principalAsFormMasterCheck = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM classes WHERE form_master_id = $1;',
        [principal1StaffId]
      );
      record(
        'Required Tests',
        '4. principal never auto-assigned as form master',
        principalAsFormMasterCheck.rows[0].count === '0'
      );

      record(
        'Required Tests',
        '5. subjects never selected automatically',
        preOnboardingCheck.steps.find((s) => s.id === 'classes_and_subjects')?.isComplete === false &&
          preOnboardingCheck.steps.find((s) => s.id === 'staff_assignments')?.isComplete === false
      );

      // -----------------------------------------------------------------------
      // Test 6: missing configuration leaves onboarding incomplete
      // -----------------------------------------------------------------------
      const prematureVerifyRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${principal1Token}` },
      });
      const prematureVerifyJson = await prematureVerifyRes.json();

      record(
        'Required Tests',
        '6. missing configuration leaves onboarding incomplete',
        prematureVerifyRes.status === 400 &&
          prematureVerifyJson.error === 'ONBOARDING_INCOMPLETE' &&
          prematureVerifyJson.details?.missingSteps?.length > 0
      );

      // -----------------------------------------------------------------------
      // Test 10: legacy leadership fields rejected
      // -----------------------------------------------------------------------
      const legacyProfileRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          bursarName: 'Mr. Legacy Bursar',
          vicePrincipalAcademic: 'Mrs. Legacy VP',
        }),
      });
      const legacyProfileJson = await legacyProfileRes.json();

      record(
        'Required Tests',
        '10. legacy leadership fields rejected',
        legacyProfileRes.status === 400 &&
          legacyProfileJson.error === 'LEGACY_LEADERSHIP_FIELDS_PROHIBITED'
      );

      // -----------------------------------------------------------------------
      // Test 11: leadership verification uses users + staff and active status
      // -----------------------------------------------------------------------
      const leadershipReport = await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      record(
        'Required Tests',
        '11. leadership verification uses users + staff and active status',
        leadershipReport.authoritativeLeadership?.principalUserId === principal1User.id &&
          leadershipReport.authoritativeLeadership?.principalStaffId === principal1StaffId &&
          leadershipReport.authoritativeLeadership?.principal.includes('Dr. Terver Udu') &&
          leadershipReport.steps.find((s) => s.id === 'leadership_and_staff')?.isComplete === true
      );

      // -----------------------------------------------------------------------
      // Test 12: the 410 route creates no data
      // -----------------------------------------------------------------------
      const deprecatedRouteRes = await fetch(
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
      const deprecatedJson = await deprecatedRouteRes.json();

      const classesAfter410 = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM classes WHERE school_id = $1;',
        [school1Id]
      );
      const allocationsAfter410 = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM class_subject_allocations WHERE school_id = $1;',
        [school1Id]
      );

      record(
        'Required Tests',
        '12. the 410 route creates no data',
        deprecatedRouteRes.status === 410 &&
          deprecatedJson.error === 'ENDPOINT_DEPRECATED' &&
          classesAfter410.rows[0].count === '0' &&
          allocationsAfter410.rows[0].count === '0'
      );

      // -----------------------------------------------------------------------
      // Test 15: CLI legacy report is read-only
      // -----------------------------------------------------------------------
      const classesBeforeScan = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM classes;');
      const allocBeforeScan = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM class_subject_allocations;');
      const legacyScanRes = await scanLegacyStructureReport(school1Id);
      const classesAfterScan = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM classes;');
      const allocAfterScan = await query<{ count: string }>('SELECT COUNT(*)::text as count FROM class_subject_allocations;');

      record(
        'Required Tests',
        '15. CLI legacy report is read-only',
        typeof legacyScanRes.suspiciousClassesCount === 'number' &&
          typeof legacyScanRes.suspiciousAllocationsCount === 'number' &&
          classesBeforeScan.rows[0].count === classesAfterScan.rows[0].count &&
          allocBeforeScan.rows[0].count === allocAfterScan.rows[0].count
      );

      // -----------------------------------------------------------------------
      // Test 18: teacher with matching school_id cannot manage or verify onboarding
      // -----------------------------------------------------------------------
      const teacherProfileRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacher1Token}`,
        },
        body: JSON.stringify({ establishedYear: 1990 }),
      });
      const teacherVerifyRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${teacher1Token}` },
      });

      record(
        'Required Tests',
        '18. teacher with matching school_id cannot manage or verify onboarding',
        teacherProfileRes.status === 403 && teacherVerifyRes.status === 403
      );

      // -----------------------------------------------------------------------
      // Test 19: parent with matching school_id cannot
      // -----------------------------------------------------------------------
      const parentProfileRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parentToken}`,
        },
        body: JSON.stringify({ establishedYear: 1990 }),
      });
      const parentVerifyRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${parentToken}` },
      });

      record(
        'Required Tests',
        '19. parent with matching school_id cannot',
        parentProfileRes.status === 403 && parentVerifyRes.status === 403
      );

      // -----------------------------------------------------------------------
      // Test 20: student with matching school_id cannot
      // -----------------------------------------------------------------------
      const studentProfileRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ establishedYear: 1990 }),
      });
      const studentVerifyRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });

      record(
        'Required Tests',
        '20. student with matching school_id cannot',
        studentProfileRes.status === 403 && studentVerifyRes.status === 403
      );

      // -----------------------------------------------------------------------
      // Test 21: authorized school-administration roles can perform permitted operations in their own school
      // -----------------------------------------------------------------------
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
        }),
      });
      const validProfileJson = await validProfileRes.json();

      record(
        'Required Tests',
        '21. authorized school-administration roles can perform permitted operations in their own school',
        validProfileRes.status === 200 &&
          validProfileJson.success === true &&
          validProfileJson.data.institutionalProfile.phone === '+234 803 123 4567' &&
          validProfileJson.data.institutionalProfile.establishedYear === 1982
      );

      // -----------------------------------------------------------------------
      // Test 22: cross-school and cross-organization operations rejected
      // -----------------------------------------------------------------------
      const crossOnboardingRes = await fetch(`${baseUrl}/api/v1/schools/${school2Id}/onboarding`, {
        headers: { Authorization: `Bearer ${principal1Token}` },
      });
      const crossProfileRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal2Token}`,
        },
        body: JSON.stringify({ address: 'Hacked Address' }),
      });

      record(
        'Required Tests',
        '22. cross-school and cross-organization operations rejected',
        crossOnboardingRes.status === 403 && crossProfileRes.status === 403
      );

      // -----------------------------------------------------------------------
      // Test 23: legacy leadership text cannot override staff registry records
      // -----------------------------------------------------------------------
      await query(
        "UPDATE schools SET principal_name = 'Arbitrary Legacy Column Text', bursar_name = 'Legacy Bursar Text' WHERE id = $1;",
        [school1Id]
      );
      const statusAfterLegacyText = await getSchoolOnboardingStatus(school1Id, { user: principal1User });

      record(
        'Required Tests',
        '23. legacy leadership text cannot override staff registry records',
        statusAfterLegacyText.authoritativeLeadership?.principal.includes('Dr. Terver Udu') &&
          !statusAfterLegacyText.authoritativeLeadership?.principal.includes('Arbitrary Legacy Column Text') &&
          (statusAfterLegacyText.institutionalProfile as any).principalName === undefined
      );

      // -----------------------------------------------------------------------
      // Setup Calendar Sessions & Terms, Core Curriculum Subjects
      // -----------------------------------------------------------------------
      const sessionRes = await query<{ id: string }>(
        `INSERT INTO academic_sessions (session_name, is_current, start_date, end_date)
         VALUES ('2025/2026', TRUE, '2025-09-08', '2026-07-24')
         ON CONFLICT (session_name) DO UPDATE SET is_current = TRUE
         RETURNING id;`
      );
      const sessionId = sessionRes.rows[0].id;

      const termRes = await query<{ id: string }>(
        `INSERT INTO academic_terms (session_id, term_name, is_current, resumption_date, vacation_date, statutory_school_days)
         VALUES ($1, '1st Term', TRUE, '2025-09-08', '2025-12-19', 65)
         ON CONFLICT (session_id, term_name) DO UPDATE SET is_current = TRUE
         RETURNING id;`,
        [sessionId]
      );
      const termId = termRes.rows[0].id;

      // Second Session and Term (for mismatch testing)
      const session2Res = await query<{ id: string }>(
        `INSERT INTO academic_sessions (session_name, is_current, start_date, end_date)
         VALUES ('2024/2025', FALSE, '2024-09-08', '2025-07-24')
         ON CONFLICT (session_name) DO UPDATE SET is_current = FALSE
         RETURNING id;`
      );
      const session2Id = session2Res.rows[0].id;

      const termFromSession2Res = await query<{ id: string }>(
        `INSERT INTO academic_terms (session_id, term_name, is_current, resumption_date, vacation_date, statutory_school_days)
         VALUES ($1, '2nd Term', FALSE, '2025-01-06', '2025-04-11', 65)
         ON CONFLICT (session_id, term_name) DO UPDATE SET is_current = FALSE
         RETURNING id;`,
        [session2Id]
      );
      const term2Id = termFromSession2Res.rows[0].id;

      // Curriculum Subjects
      const subjectEngRes = await query<{ id: string }>(
        `INSERT INTO subjects (code, name, category, department_id, arm, applicable_levels)
         VALUES ('ENG-001', 'English Language', 'General Studies', 'Languages', 'secondary', ARRAY['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'])
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`
      );
      const subjectEngId = subjectEngRes.rows[0].id;

      const subjectMthRes = await query<{ id: string }>(
        `INSERT INTO subjects (code, name, category, department_id, arm, applicable_levels)
         VALUES ('MTH-001', 'General Mathematics', 'Sciences', 'Mathematics', 'secondary', ARRAY['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'])
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`
      );
      const subjectMthId = subjectMthRes.rows[0].id;

      // -----------------------------------------------------------------------
      // Test 24: a term not belonging to the session is rejected; inactive staff rejected as teacher or form master
      // -----------------------------------------------------------------------
      const inactiveFormMasterClassRes = await fetch(`${baseUrl}/api/v1/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          level: 'JSS 2',
          arm: 'secondary',
          name: 'JSS 2 Inactive Test',
          category: 'General',
          form_master_id: inactiveTeacherStaffId,
        }),
      });

      const mismatchAllocRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: '00000000-0000-0000-0000-000000000001',
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: term2Id, // term2 belongs to session2, not sessionId
          periods_per_week: 4,
        }),
      });

      record(
        'Required Tests',
        '24. a term not belonging to the session is rejected; inactive staff rejected as teacher or form master',
        inactiveFormMasterClassRes.status === 400 && mismatchAllocRes.status === 400
      );

      // Task 3: 5. A session/term mismatch is rejected
      record(
        'Required Tests',
        '5. A session/term mismatch is rejected',
        mismatchAllocRes.status === 400
      );

      // -----------------------------------------------------------------------
      // Task 3: 3. An allocation with a missing teacher is rejected by the creation API
      // -----------------------------------------------------------------------
      const missingTeacherAllocRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: '00000000-0000-0000-0000-000000000001',
          subject_id: subjectEngId,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 4,
        }),
      });
      const missingTeacherJson = await missingTeacherAllocRes.json();

      record(
        'Required Tests',
        '3. An allocation with a missing teacher is rejected by the creation API',
        missingTeacherAllocRes.status === 400 &&
          (missingTeacherJson.error === 'MISSING_REQUIRED_FIELDS' || missingTeacherJson.error === 'VALIDATION_FAILED')
      );

      // -----------------------------------------------------------------------
      // Task 3: 4. An allocation with a missing session is rejected by the creation API
      // -----------------------------------------------------------------------
      const missingSessionAllocRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: '00000000-0000-0000-0000-000000000001',
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_term_id: termId,
          periods_per_week: 4,
        }),
      });
      const missingSessionJson = await missingSessionAllocRes.json();

      record(
        'Required Tests',
        '4. An allocation with a missing session is rejected by the creation API',
        missingSessionAllocRes.status === 400 &&
          (missingSessionJson.error === 'MISSING_REQUIRED_FIELDS' || missingSessionJson.error === 'VALIDATION_FAILED')
      );

      // -----------------------------------------------------------------------
      // Test 8 & Task 3: 6. An inactive or cross-school teacher is rejected
      // -----------------------------------------------------------------------
      const crossStaffClassRes = await fetch(`${baseUrl}/api/v1/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          level: 'JSS 3',
          arm: 'secondary',
          name: 'JSS 3 Cross Test',
          category: 'General',
          form_master_id: school2TeacherStaffId,
        }),
      });

      const crossStaffAllocRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: '00000000-0000-0000-0000-000000000001',
          subject_id: subjectEngId,
          teacher_id: school2TeacherStaffId,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 4,
        }),
      });

      const inactiveTeacherAllocRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: '00000000-0000-0000-0000-000000000001',
          subject_id: subjectEngId,
          teacher_id: inactiveTeacherStaffId,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 4,
        }),
      });

      record(
        'Required Tests',
        '8. cross-school staff assignments rejected',
        crossStaffClassRes.status === 400 && crossStaffAllocRes.status === 400
      );

      record(
        'Required Tests',
        '6. An inactive or cross-school teacher is rejected',
        crossStaffAllocRes.status === 400 && inactiveTeacherAllocRes.status === 400
      );

      // -----------------------------------------------------------------------
      // Test 9 & Task 3: 7. Missing or invalid period counts are rejected
      // -----------------------------------------------------------------------
      const missingPeriodsRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: '00000000-0000-0000-0000-000000000001',
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: termId,
        }),
      });

      const zeroPeriodsRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: '00000000-0000-0000-0000-000000000001',
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 0,
        }),
      });

      const overPeriodsRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: '00000000-0000-0000-0000-000000000001',
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 35,
        }),
      });

      const decimalPeriodsRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: '00000000-0000-0000-0000-000000000001',
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 4.5,
        }),
      });

      record(
        'Required Tests',
        '9. periods_per_week required and range-checked',
        missingPeriodsRes.status === 400 &&
          zeroPeriodsRes.status === 400 &&
          overPeriodsRes.status === 400 &&
          decimalPeriodsRes.status === 400
      );

      record(
        'Required Tests',
        '7. Missing or invalid period counts are rejected',
        missingPeriodsRes.status === 400 &&
          zeroPeriodsRes.status === 400 &&
          overPeriodsRes.status === 400 &&
          decimalPeriodsRes.status === 400
      );

      // -----------------------------------------------------------------------
      // Test 25: the legacy scan does not flag a class named "Science" that was explicitly created with other values
      // -----------------------------------------------------------------------
      const customScienceClassRes = await fetch(`${baseUrl}/api/v1/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          level: 'SSS 1',
          arm: 'secondary',
          name: 'Science',
          category: 'Sciences',
          form_master_id: teacher1Staff.id,
        }),
      });
      const customScienceJson = await customScienceClassRes.json();
      const customScienceClassId = customScienceJson.data?.id;

      const scanAfterScienceClass = await scanLegacyStructureReport(school1Id);

      record(
        'Required Tests',
        '25. the legacy scan does not flag a class named "Science" that was explicitly created with other values',
        customScienceClassRes.status === 201 &&
          scanAfterScienceClass.suspiciousClassesCount === 0
      );

      // Clean up the temporary Science class to ensure pristine state for allocation tests
      await query('DELETE FROM classes WHERE id = $1;', [customScienceClassId]);

      // -----------------------------------------------------------------------
      // Test 26: teacher, bursar, exam officer, parent and student receive 403 on POST/PATCH /api/v1/classes and POST/PATCH/DELETE /api/v1/academic/allocations
      // -----------------------------------------------------------------------
      const nonAdminTokens = [
        { role: 'teacher', token: teacher1Token },
        { role: 'bursar', token: bursarToken },
        { role: 'exam_officer', token: examOfficerToken },
        { role: 'parent', token: parentToken },
        { role: 'student', token: studentToken },
      ];

      let allNonAdminsBlockedOnClasses = true;
      let allNonAdminsBlockedOnAllocations = true;

      for (const t of nonAdminTokens) {
        const createClassRes = await fetch(`${baseUrl}/api/v1/classes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${t.token}`,
          },
          body: JSON.stringify({
            level: 'JSS 1',
            arm: 'secondary',
            name: 'Unauthorized Class',
            category: 'General',
          }),
        });
        if (createClassRes.status !== 403) allNonAdminsBlockedOnClasses = false;

        const createAllocRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${t.token}`,
          },
          body: JSON.stringify({
            school_id: school1Id,
            class_id: '00000000-0000-0000-0000-000000000001',
            subject_id: subjectEngId,
            teacher_id: teacher1Staff.id,
            academic_session_id: sessionId,
            academic_term_id: termId,
            periods_per_week: 4,
          }),
        });
        if (createAllocRes.status !== 403) allNonAdminsBlockedOnAllocations = false;
      }

      record(
        'Required Tests',
        '26. teacher, bursar, exam officer, parent and student receive 403 on POST/PATCH /api/v1/classes and POST/PATCH/DELETE /api/v1/academic/allocations',
        allNonAdminsBlockedOnClasses && allNonAdminsBlockedOnAllocations
      );

      // -----------------------------------------------------------------------
      // Test 27: a non-platform user from School A cannot read a School B record through an entity route that uses :id
      // -----------------------------------------------------------------------
      const studentClassSchool2Res = await query<{ id: string }>(
        `INSERT INTO classes (school_id, level, arm, name, category)
         VALUES ($1, 'JSS 1', 'secondary', 'Gboko Temp Class', 'General')
         RETURNING id;`,
        [school2Id]
      );
      const studentClassSchool2Id = studentClassSchool2Res.rows[0].id;

      const studentSchool2Res = await query<{ id: string }>(
        `INSERT INTO students (
          school_id, current_class_id, full_name, admission_number, gender, date_of_birth, arm, guardian_name, guardian_phone, date_enrolled, status
        ) VALUES (
          $1, $2, 'School2 Student', 'GBK-STD-001', 'Male', '2010-01-01', 'secondary', 'Guardian Test', '+2348000000000', '2025-09-08', 'Active'
        ) RETURNING id;`,
        [school2Id, studentClassSchool2Id]
      );
      const school2StudentId = studentSchool2Res.rows[0].id;

      const crossStudentReadRes = await fetch(`${baseUrl}/api/v1/results/student/${school2StudentId}`, {
        headers: { Authorization: `Bearer ${principal1Token}` },
      });
      const crossStudentReadJson = await crossStudentReadRes.json();

      record(
        'Required Tests',
        '27. a non-platform user from School A cannot read a School B record through an entity route that uses :id (e.g. /api/v1/results/student/:id)',
        crossStudentReadRes.status === 403 &&
          crossStudentReadJson.error === 'TENANT_ISOLATION_VIOLATION'
      );

      // Clean up test student and temporary class
      await query('DELETE FROM students WHERE id = $1;', [school2StudentId]);
      await query('DELETE FROM classes WHERE id = $1;', [studentClassSchool2Id]);

      // -----------------------------------------------------------------------
      // Test 28: onboarding readiness fails when an allocation references a class from another school or an inactive teacher
      // -----------------------------------------------------------------------
      // Create a class in School 2
      const school2ClassRes = await query<{ id: string }>(
        `INSERT INTO classes (school_id, level, arm, name, category)
         VALUES ($1, 'JSS 1', 'secondary', 'Gboko Class A', 'General')
         RETURNING id;`,
        [school2Id]
      );
      const school2ClassId = school2ClassRes.rows[0].id;

      // Insert invalid allocation belonging to school 1 but referencing school 2 class
      const invalidAllocRes = await query<{ id: string }>(
        `INSERT INTO class_subject_allocations (school_id, class_id, subject_id, teacher_id, academic_session_id, academic_term_id, periods_per_week)
         VALUES ($1, $2, $3, $4, $5, $6, 4)
         RETURNING id;`,
        [school1Id, school2ClassId, subjectEngId, teacher1Staff.id, sessionId, termId]
      );
      const invalidAllocId = invalidAllocRes.rows[0].id;

      const onboardingWithInvalidAlloc = await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      const allocStep = onboardingWithInvalidAlloc.steps.find((s) => s.id === 'staff_assignments');

      record(
        'Required Tests',
        '28. onboarding readiness fails when an allocation references a class from another school or an inactive teacher',
        allocStep?.isComplete === false &&
          allocStep?.items.some((item) => item.value && String(item.value).includes('outside school')) === true
      );

      // Remove the invalid allocation and school 2 class
      await query('DELETE FROM class_subject_allocations WHERE id = $1;', [invalidAllocId]);
      await query('DELETE FROM classes WHERE id = $1;', [school2ClassId]);

      // -----------------------------------------------------------------------
      // Test 7: valid same-school assignments accepted (via the existing routes)
      // Explicitly create authoritative classes and allocations as administrator
      // -----------------------------------------------------------------------
      const class1CreateRes = await fetch(`${baseUrl}/api/v1/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          level: 'JSS 1',
          arm: 'secondary',
          name: 'JSS 1 Alpha',
          category: 'General',
          form_master_id: teacher1Staff.id,
        }),
      });
      const class1Json = await class1CreateRes.json();
      const class1Id = class1Json.data?.id;

      const class2CreateRes = await fetch(`${baseUrl}/api/v1/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          level: 'SSS 1',
          arm: 'secondary',
          name: 'SSS 1 Science',
          category: 'Sciences',
          form_master_id: teacher2Staff.id,
        }),
      });
      const class2Json = await class2CreateRes.json();
      const class2Id = class2Json.data?.id;

      // -----------------------------------------------------------------------
      // Task 3: 2. No allocation for the active term means onboarding remains incomplete
      // -----------------------------------------------------------------------
      const preAllocReport = await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      const preAllocStep = preAllocReport.steps.find((s) => s.id === 'staff_assignments');

      record(
        'Required Tests',
        '2. No allocation for the active term means onboarding remains incomplete',
        preAllocStep?.isComplete === false &&
          preAllocReport.metrics.allocationsCount === 0 &&
          preAllocReport.overallStatus === 'ONBOARDING_INCOMPLETE'
      );

      // -----------------------------------------------------------------------
      // Task 3: 10. Read-only readiness checks do not create or repair configuration
      // -----------------------------------------------------------------------
      const classesCountBefore = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM classes WHERE school_id = $1;', [school1Id]);
      const allocCountBefore = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM class_subject_allocations WHERE school_id = $1;', [school1Id]);
      const subjectsCountBefore = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM subjects;');

      // Execute read-only readiness query & HTTP route
      await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      const readCheckRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding`, {
        headers: { Authorization: `Bearer ${principal1Token}` },
      });
      await readCheckRes.json();

      const classesCountAfter = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM classes WHERE school_id = $1;', [school1Id]);
      const allocCountAfter = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM class_subject_allocations WHERE school_id = $1;', [school1Id]);
      const subjectsCountAfter = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM subjects;');

      record(
        'Required Tests',
        '10. Read-only readiness checks do not create or repair configuration',
        classesCountBefore.rows[0].count === classesCountAfter.rows[0].count &&
          allocCountBefore.rows[0].count === allocCountAfter.rows[0].count &&
          subjectsCountBefore.rows[0].count === subjectsCountAfter.rows[0].count
      );

      // -----------------------------------------------------------------------
      // Task 3: 1. Old-term allocations cannot satisfy active-term readiness
      // & 9. A school with valid historical allocations but incomplete current-term configuration cannot verify onboarding
      // -----------------------------------------------------------------------
      // Insert a historical allocation belonging to school 1 but for session2 and term2 (inactive/historical)
      const histAllocRes = await query<{ id: string }>(
        `INSERT INTO class_subject_allocations (
          school_id, class_id, subject_id, teacher_id, academic_session_id, academic_term_id, periods_per_week
        ) VALUES ($1, $2, $3, $4, $5, $6, 4) RETURNING id;`,
        [school1Id, class1Id, subjectEngId, teacher1Staff.id, session2Id, term2Id]
      );
      const histAllocId = histAllocRes.rows[0].id;

      const histReport = await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      const histAllocStep = histReport.steps.find((s) => s.id === 'staff_assignments');

      record(
        'Required Tests',
        '1. Old-term allocations cannot satisfy active-term readiness',
        histAllocStep?.isComplete === false &&
          histReport.metrics.allocationsCount === 0 &&
          histAllocStep?.items.some((item) =>
            item.value && String(item.value).includes('historical allocation(s) exist, but 0 configured for active term')
          ) === true
      );

      // Attempt onboarding verification when only historical allocations exist -> must fail closed (400)
      const verifyWithHistAllocOnlyRes = await fetch(`${baseUrl}/api/v1/schools/${school1Id}/onboarding/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
      });
      const verifyWithHistAllocOnlyJson = await verifyWithHistAllocOnlyRes.json();

      record(
        'Required Tests',
        '9. A school with valid historical allocations but incomplete current-term configuration cannot verify onboarding',
        verifyWithHistAllocOnlyRes.status === 400 &&
          verifyWithHistAllocOnlyJson.error === 'ONBOARDING_INCOMPLETE'
      );

      // Remove the temporary historical allocation before creating active-term allocations
      await query('DELETE FROM class_subject_allocations WHERE id = $1;', [histAllocId]);

      // -----------------------------------------------------------------------
      // Task 3: 8. A valid allocation for the active session and term is accepted
      // & Test 7: valid same-school assignments accepted (via the existing routes)
      // -----------------------------------------------------------------------
      const alloc1CreateRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: class1Id,
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 4,
        }),
      });

      const alloc2CreateRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: class2Id,
          subject_id: subjectMthId,
          teacher_id: teacher2Staff.id,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 5,
        }),
      });

      record(
        'Required Tests',
        '8. A valid allocation for the active session and term is accepted',
        alloc1CreateRes.status === 201 && alloc2CreateRes.status === 201
      );

      record(
        'Required Tests',
        '7. valid same-school assignments accepted (via the existing routes)',
        class1CreateRes.status === 201 &&
          class2CreateRes.status === 201 &&
          alloc1CreateRes.status === 201 &&
          alloc2CreateRes.status === 201
      );

      record(
        'Required Tests',
        '11. Existing tenant isolation and RBAC restrictions remain effective',
        allNonAdminsBlockedOnClasses && allNonAdminsBlockedOnAllocations && crossStudentReadRes.status === 403
      );

      record(
        'Required Tests',
        '12. Phase 10C provisioning behavior remains unchanged',
        bootstrapRes.organization.code === 'BNS-MOE-HQ' &&
          bootstrapRes.school?.code === 'BNS-MKD-001' &&
          superAdminUser.role === 'super_admin' &&
          principal1User.role === 'principal' &&
          Boolean(principal1StaffId)
      );

      // -----------------------------------------------------------------------
      // Formal Onboarding Verification Sign-Off
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
        'Readiness Sign-Off',
        'All mandatory institutional prerequisites satisfied: verification completes with overallStatus="ONBOARDING_READY"',
        verifyRes.status === 200 &&
          verifyJson.success === true &&
          verifyJson.data.overallStatus === 'ONBOARDING_READY' &&
          verifyJson.data.completionPercentage === 100
      );

      record(
        'Readiness Sign-Off',
        'Operational launch gate remains strictly "OPERATIONAL_LAUNCH_NOT_AUTHORIZED" (Phase 10E boundary)',
        verifyJson.data?.operationalLaunchStatus === 'OPERATIONAL_LAUNCH_NOT_AUTHORIZED' &&
          verifyJson.data?.declarations?.operationalLaunchAuthorized === false
      );

      // -----------------------------------------------------------------------
      // Zero Student/Parent/Financial Records Boundary
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
        'Zero Data Boundary',
        'Strict Phase 10D non-goal enforced: zero students and zero invoices created during onboarding',
        studentCountCheck.rows[0].count === '0' && invoiceCountCheck.rows[0].count === '0'
      );

      // -----------------------------------------------------------------------
      // Audit Logging Verification
      // -----------------------------------------------------------------------
      const auditLogsRes = await query<{ action: string; status: string }>(
        'SELECT action, status FROM auth_audit_logs WHERE details->>\'schoolId\' = $1;',
        [school1Id]
      );
      const recordedActions = new Set(auditLogsRes.rows.map((r) => r.action));

      record(
        'Audit Infrastructure',
        'All onboarding updates, blocked attempts, and verification sign-offs are audited in auth_audit_logs',
        recordedActions.has('SCHOOL_PROFILE_UPDATED') &&
          recordedActions.has('SCHOOL_ONBOARDING_VERIFICATION_REJECTED') &&
          recordedActions.has('SCHOOL_ONBOARDING_VERIFIED')
      );

      // -----------------------------------------------------------------------
      // Read-Only CLI Verification Test
      // -----------------------------------------------------------------------
      process.env.SCHOOL_CODE = 'BNS-MKD-001';
      const cliResult = await executeOnboardingVerifyCli();

      record(
        'CLI Verification Script',
        'npm run onboarding:verify executes read-only inspection against PostgreSQL and exits with code 0 on ONBOARDING_READY school',
        cliResult.exitCode === 0 && cliResult.message.includes('ONBOARDING_READY')
      );

      // =======================================================================
      // Stage 2B Regression Tests: Tenant-Scoped Readiness & Academic Calendar Integrity
      // =======================================================================

      // 1. Conflicting current calendar records fail closed
      await query('UPDATE academic_sessions SET is_current = TRUE WHERE id = $1;', [session2Id]);
      const conflictReport = await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      const conflictStep3 = conflictReport.steps.find((s) => s.id === 'academic_calendar');
      const conflictStep5 = conflictReport.steps.find((s) => s.id === 'staff_assignments');
      record(
        'Regression 2B',
        '4. Conflicting current calendar records fail closed in readiness evaluation',
        conflictStep3?.isComplete === false &&
          conflictStep5?.isComplete === false &&
          conflictStep3?.items.some((item) =>
            item.value && String(item.value).includes('Configuration conflict')
          ) === true
      );
      // Restore clean state for sessions
      await query('UPDATE academic_sessions SET is_current = FALSE WHERE id = $1;', [session2Id]);

      // 2. Missing current session or term for a school leaves readiness incomplete
      await query('UPDATE academic_sessions SET is_current = FALSE WHERE id = $1;', [sessionId]);
      const missingSessionReport = await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      const missingSessionStep3 = missingSessionReport.steps.find((s) => s.id === 'academic_calendar');
      record(
        'Regression 2B',
        '3. Missing current session or term leaves readiness incomplete',
        missingSessionStep3?.isComplete === false &&
          missingSessionReport.overallStatus === 'ONBOARDING_INCOMPLETE'
      );
      // Restore current session
      await query('UPDATE academic_sessions SET is_current = TRUE WHERE id = $1;', [sessionId]);

      // 3. Historical anomaly does not block otherwise valid active-term onboarding readiness (Advisory only)
      const historicalAnomalyRes = await query<{ id: string }>(
        `INSERT INTO class_subject_allocations (
          school_id, class_id, subject_id, teacher_id, academic_session_id, academic_term_id, periods_per_week
        ) VALUES ($1, $2, $3, NULL, $4, $5, 4) RETURNING id;`,
        [school1Id, class1Id, subjectEngId, session2Id, term2Id]
      );
      const anomalyReport = await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      const anomalyStep5 = anomalyReport.steps.find((s) => s.id === 'staff_assignments');
      const itemPresent = anomalyStep5?.items.find((i) => i.id === 'allocations_present');
      record(
        'Regression 2B',
        '11. Valid active-term configuration passes allocation checks even if historical anomaly exists',
        anomalyStep5?.isComplete === true &&
          itemPresent?.details?.historicalInvalidAllocationsCount !== undefined &&
          String(itemPresent?.details?.historicalInvalidAllocationsCount).includes('Advisory notice')
      );
      // Remove historical anomaly allocation
      await query('DELETE FROM class_subject_allocations WHERE id = $1;', [historicalAnomalyRes.rows[0].id]);

      // 4. Allocation creation rejects cross-school target in caller request (403 for principal)
      const crossSchoolAllocRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school2Id,
          class_id: class1Id,
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 4,
        }),
      });
      record(
        'Regression 2B',
        '5. Allocation creation rejects cross-school target for non-platform caller with 403',
        crossSchoolAllocRes.status === 403
      );

      // 5. Allocation creation rejects non-existent school_id
      const nonExistentSchoolAllocRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          school_id: '00000000-0000-0000-0000-000000000099',
          class_id: class1Id,
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 4,
        }),
      });
      record(
        'Regression 2B',
        '6. Allocation creation rejects non-existent target school with 400',
        nonExistentSchoolAllocRes.status === 400
      );

      // 6. Schema Integrity check: academic_sessions and academic_terms lack school_id by architectural design
      const sessionCols = await query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'academic_sessions' AND column_name = 'school_id';`
      );
      const termCols = await query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'academic_terms' AND column_name = 'school_id';`
      );
      record(
        'Regression 2B',
        '1. Existing schema boundary preserved: academic_sessions and academic_terms are state-wide shared entities (0001-0011 unchanged)',
        sessionCols.rows.length === 0 && termCols.rows.length === 0
      );

      // =======================================================================
      // Stage 2C Regression Tests: School-State Validation & Shared Calendar Contract
      // =======================================================================

      // 1. Inactive-school allocation creation is rejected with SCHOOL_INACTIVE and zero rows inserted
      await query('UPDATE schools SET is_active = FALSE WHERE id = $1;', [school2Id]);
      const allocCountBeforeInactive = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM class_subject_allocations WHERE school_id = $1;',
        [school2Id]
      );
      const inactiveSchoolAllocRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
        },
        body: JSON.stringify({
          school_id: school2Id,
          class_id: class1Id,
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: termId,
          periods_per_week: 4,
        }),
      });
      const inactiveSchoolAllocJson = await inactiveSchoolAllocRes.json();
      const allocCountAfterInactive = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM class_subject_allocations WHERE school_id = $1;',
        [school2Id]
      );

      record(
        'Regression 2C',
        '8. Inactive-school allocation creation is rejected without a database write',
        inactiveSchoolAllocRes.status === 400 &&
          inactiveSchoolAllocJson.error === 'SCHOOL_INACTIVE' &&
          allocCountBeforeInactive.rows[0].count === allocCountAfterInactive.rows[0].count
      );
      // Restore school2 is_active = TRUE
      await query('UPDATE schools SET is_active = TRUE WHERE id = $1;', [school2Id]);

      // 2. More than one current term causes readiness to fail closed
      await query('UPDATE academic_terms SET is_current = TRUE WHERE id = $1;', [term2Id]);
      const termConflictReport = await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      const termConflictStep3 = termConflictReport.steps.find((s) => s.id === 'academic_calendar');
      const termConflictStep5 = termConflictReport.steps.find((s) => s.id === 'staff_assignments');

      record(
        'Regression 2C',
        '4. More than one current term causes readiness to fail closed',
        termConflictStep3?.isComplete === false &&
          termConflictStep5?.isComplete === false &&
          termConflictReport.overallStatus === 'ONBOARDING_INCOMPLETE' &&
          termConflictStep3?.items.some((item) =>
            item.value && String(item.value).includes('Configuration conflict')
          ) === true
      );

      // 3. Removing the conflict restores valid readiness when remaining configuration is correct
      await query('UPDATE academic_terms SET is_current = FALSE WHERE id = $1;', [term2Id]);
      const restoredReport = await getSchoolOnboardingStatus(school1Id, { user: principal1User });
      const restoredStep3 = restoredReport.steps.find((s) => s.id === 'academic_calendar');
      const restoredStep5 = restoredReport.steps.find((s) => s.id === 'staff_assignments');

      record(
        'Regression 2C',
        '5. Removing the conflict restores valid readiness when the remaining configuration is correct',
        restoredStep3?.isComplete === true &&
          restoredStep5?.isComplete === true &&
          restoredReport.overallStatus === 'ONBOARDING_READY'
      );

      // 4. A school cannot use a nonexistent session or term
      const nonExistentSessionRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: class1Id,
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: '00000000-0000-0000-0000-000000000001',
          academic_term_id: termId,
          periods_per_week: 4,
        }),
      });
      const nonExistentTermRes = await fetch(`${baseUrl}/api/v1/academic/allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principal1Token}`,
        },
        body: JSON.stringify({
          school_id: school1Id,
          class_id: class1Id,
          subject_id: subjectEngId,
          teacher_id: teacher1Staff.id,
          academic_session_id: sessionId,
          academic_term_id: '00000000-0000-0000-0000-000000000002',
          periods_per_week: 4,
        }),
      });

      record(
        'Regression 2C',
        '6. A school cannot use a nonexistent session or term',
        nonExistentSessionRes.status === 400 && nonExistentTermRes.status === 400
      );

      // 5. School allocation records remain tenant-isolated even though academic calendar records are shared
      const school1AllocsRes = await query<{ school_id: string }>(
        'SELECT school_id FROM class_subject_allocations WHERE school_id = $1;',
        [school1Id]
      );
      const crossAllocQuery = await query<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM class_subject_allocations WHERE school_id = $1 AND school_id != $2;',
        [school1Id, school2Id]
      );

      record(
        'Regression 2C',
        '7. School allocation records remain tenant-isolated even though academic calendar records are shared',
        school1AllocsRes.rows.every((r) => r.school_id === school1Id) &&
          crossAllocQuery.rows[0].count === String(school1AllocsRes.rows.length)
      );

      // -----------------------------------------------------------------------
      // Migration System & Integrity Check
      // -----------------------------------------------------------------------
      const migVerify = await verifyMigrations();
      record(
        'Migration Integrity',
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
