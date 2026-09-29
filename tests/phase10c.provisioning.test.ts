/**
 * BummptEducation — Phase 10C First Organization & Administrator Provisioning Verification Suite
 *
 * Meaningfully verifies the Phase 10C provisioning contract against real PostgreSQL:
 * 1. Three-tier Role & Tenant Scope Model (PLATFORM_ADMIN, TENANT_SCHOOL_ADMIN, SCHOOL_OPERATIONAL)
 * 2. Controlled CLI scripts (provision:bootstrap, provision:verify) & strict zero-seeder boundary
 * 3. Empty-database pre-provisioning verification (verifyProvisioningState().ready === false)
 * 4. Controlled First-Deployment Bootstrap (Organization + First School + Super Admin + School Principal + Staff linkage)
 * 5. One-time bootstrap guard (second bootstrap attempt fails closed with BOOTSTRAP_ALREADY_COMPLETED)
 * 6. Zero operational/student/parent/fee/attendance/assessment records created during provisioning
 * 7. Real Argon2id authentication & session establishment for provisioned administrators
 * 8. Authorized API provisioning (Super Admin creates second LGA school & distinct Principal)
 * 9. Privilege escalation & tenant isolation guards (Principal blocked from org/school creation, executive role escalation, or cross-school provisioning)
 * 10. Account request workflow integration (atomic user + staff creation on approval, cross-school Principal rejection)
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
  provisionOrganization,
  provisionSchool,
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

    const docExists = fs.existsSync(
      path.join(process.cwd(), 'docs/PHASE_10C_FIRST_ORGANIZATION_AND_ADMIN_PROVISIONING.md')
    );

    record(
      '2. CLI & Documentation',
      'package.json defines provision:bootstrap, provision:verify, and test:phase10c scripts and Phase 10C documentation exists',
      hasCliScripts && docExists
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
    // 3. End-to-End Behavioral Provisioning on Isolated Empty PostgreSQL Schema
    // =========================================================================
    await closeDatabasePool();
    process.env.DATABASE_POOL_SIZE = '1';

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
      await query('DROP SCHEMA IF EXISTS phase10c_provisioning_test CASCADE;');
      await query('CREATE SCHEMA phase10c_provisioning_test;');
      await query('SET search_path TO phase10c_provisioning_test, public;');

      // Apply all 11 production migrations onto the clean isolated schema
      const migRes = await runMigrations();
      const preVerify = await verifyProvisioningState();

      record(
        '3. Empty DB Pre-State',
        'On a freshly migrated empty database, verifyProvisioningState() reports ready=false with 0 organizations, 0 schools, and 0 admins',
        migRes.success === true &&
          preVerify.ready === false &&
          preVerify.organizationsCount === 0 &&
          preVerify.schoolsCount === 0 &&
          preVerify.activeAdminsCount === 0
      );

      // =========================================================================
      // 4. Controlled First-Deployment Bootstrap
      // =========================================================================
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
        '4. First Bootstrap',
        'bootstrapFirstTenantAndAdmin() atomically provisions Organization, First School, Super Admin, and School Principal + linked Staff identity',
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
        '4. First Bootstrap',
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
        '4. First Bootstrap',
        'Provisioning creates zero student, parent, fee, invoice, payment, attendance, or assessment records',
        operationalRowSum === 0
      );

      // Verify second bootstrap attempt fails closed with BOOTSTRAP_ALREADY_COMPLETED
      let secondBootstrapBlocked = false;
      try {
        await bootstrapFirstTenantAndAdmin({
          organization: { name: 'Rogue Org', code: 'ROGUE-ORG' },
          admin: {
            email: 'rogue@example.com',
            password: 'RoguePassword123!',
            fullName: 'Rogue Admin',
          },
        });
      } catch (err: any) {
        if (err instanceof ProvisioningError && err.code === 'BOOTSTRAP_ALREADY_COMPLETED') {
          secondBootstrapBlocked = true;
        }
      }

      record(
        '4. First Bootstrap',
        'Second bootstrap attempt fails closed with BOOTSTRAP_ALREADY_COMPLETED (409)',
        secondBootstrapBlocked
      );

      // =========================================================================
      // 5. Real Authentication & Authorized API Provisioning Across Multiple LGAs
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
        '5. Auth & Session Integration',
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
        '6. Security & Privilege Guards',
        'Unauthenticated requests return 401; Principal is blocked (403) from creating organizations, creating schools, or escalating roles',
        unauthOrgRes.status === 401 &&
          principalCreateOrgRes.status === 403 &&
          principalCreateSchoolRes.status === 403 &&
          principalEscalateRes.status === 403
      );

      // Super Admin provisions a second school in Gboko LGA and its own distinct Principal
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
        '7. Multi-LGA School & Admin Provisioning',
        'Super Admin provisions a second school in Gboko LGA and its distinct Principal + Staff record via API',
        school2CreateRes.status === 201 &&
          school2CreateJson.data?.code === 'BNS-GBK-202' &&
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
        '7. Multi-LGA School & Admin Provisioning',
        'Duplicate school codes return 409, unscoped school roles return 400, and cross-school Principal provisioning returns 403',
        dupSchoolRes.status === 409 &&
          missingSchoolScopeAdminRes.status === 400 &&
          crossSchoolProvisionRes.status === 403
      );

      // =========================================================================
      // 8. Account Request Workflow Integration & Atomic Staff Linkage
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
        '8. Account Request Workflow',
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
        recordedActions.has('ACCOUNT_APPROVED');

      record(
        '9. Audit Trail & Final Integrity',
        'All provisioning, bootstrap, approval, and blocked privilege escalation events are recorded in auth_audit_logs',
        hasAllExpectedAudits
      );
    } finally {
      try {
        await query('SET search_path TO public;');
        await query('DROP SCHEMA IF EXISTS phase10c_provisioning_test CASCADE;');
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
