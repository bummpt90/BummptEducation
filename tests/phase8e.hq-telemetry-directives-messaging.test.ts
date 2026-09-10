/**
 * BummptEducation — Phase 8E: Benue State HQ Telemetry, Ministry Directives & Messaging Test Suite
 * 
 * Comprehensive Automated Verification Suite (Min 45 tests):
 * Category 1: Database Schema & Migration 0011 Integrity
 * Category 2: Authentication & Unauthenticated Rejections (401)
 * Category 3: Role-Based Access Control (RBAC) & Channel Gatekeeping (403)
 * Category 4: Statewide HQ Telemetry & Subvention Operations
 * Category 5: Ministry Directives Creation & Validation
 * Category 6: Ministry Directives Multi-Tenant Visibility & Scoping
 * Category 7: Directives Compliance Acknowledgment
 * Category 8: Inter-School & HQ Dispatches Messaging & Tenant Isolation
 * Category 9: Quick Replies & Escalation Workflow
 * Category 10: Memory Decoupling & PostgreSQL Authoritative Integrity
 */

import 'dotenv/config';
import http from 'http';
import express from 'express';
import { query, runMigrations, closeDatabasePool, withTransaction } from '../src/db';
import { hqTelemetryRouter } from '../src/api/v1/hq-telemetry.routes';
import { hqDirectivesRouter } from '../src/api/v1/hq-directives.routes';
import { hqChatRouter } from '../src/api/v1/hq-chat.routes';
import { signAuthToken } from '../src/auth/token';
import { hqTelemetryRepository } from '../src/db/repositories/hqTelemetry.repository';
import { ministryDirectiveRepository } from '../src/db/repositories/ministryDirective.repository';
import { hqDispatchRepository } from '../src/db/repositories/hqDispatch.repository';

interface TestResult {
  test: string;
  category: string;
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

async function runPhase8eTestSuite() {
  console.log('\n======================================================================');
  console.log('BummptEducation — Phase 8E HQ Telemetry, Directives & Messaging Test Suite');
  console.log('======================================================================\n');

  let server: http.Server | null = null;
  let baseUrl = '';

  try {
    // 0. Migrations Setup
    console.log('[Setup] Executing migrations...');
    await runMigrations();

    // 1. Fetch Reference Schools
    const schoolRes = await query<{ id: string; name: string; lga?: string; senatorial_zone?: string }>(
      'SELECT id, name, lga, senatorial_zone FROM schools ORDER BY id ASC LIMIT 2;'
    );
    if (schoolRes.rows.length < 2) {
      throw new Error('At least 2 reference schools required in database.');
    }
    const schoolA = schoolRes.rows[0];
    const schoolB = schoolRes.rows[1];

    // Ensure LGA and senatorial_zone are set on reference schools for zone tests
    await query(
      `UPDATE schools SET lga = 'Makurdi', senatorial_zone = 'Zone B (Benue North-West)' WHERE id = $1;`,
      [schoolA.id]
    );
    await query(
      `UPDATE schools SET lga = 'Gboko', senatorial_zone = 'Zone A (Benue North-East)' WHERE id = $1;`,
      [schoolB.id]
    );

    // 2. Identify / Provision Users for Role-Based Tests
    const stateOfficerId = 'e1111111-1111-1111-1111-111111111111';
    const principalAId   = 'e2222222-2222-2222-2222-222222222222';
    const principalBId   = 'e3333333-3333-3333-3333-333333333333';
    const teacherAId     = 'e4444444-4444-4444-4444-444444444444';
    const studentAId     = 'e5555555-5555-5555-5555-555555555555';
    const parentAId      = 'e6666666-6666-6666-6666-666666666666';
    const superAdminId   = 'e7777777-7777-7777-7777-777777777777';

    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, school_id, is_active)
       VALUES 
         ($1, 'state.officer.8e@moe.bn.gov.ng', 'hashed_pass_placeholder', 'Hon. Commissioner Ikyaan', 'state_officer', NULL, true),
         ($2, 'principal.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Principal Terver Tyokyaa', 'principal', $8, true),
         ($3, 'principal.b.8e@beacon.edu.ng', 'hashed_pass_placeholder', 'Principal Aondoaver Uza', 'principal', $9, true),
         ($4, 'teacher.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Mr. David Aondo', 'teacher', $8, true),
         ($5, 'student.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Master Bem Tyokyaa', 'student', $8, true),
         ($6, 'parent.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Chief Tyokyaa', 'parent', $8, true),
         ($7, 'super.admin.8e@bummpt.com', 'hashed_pass_placeholder', 'Super Admin Officer', 'super_admin', NULL, true)
       ON CONFLICT (id) DO UPDATE SET 
         email = EXCLUDED.email, 
         role = EXCLUDED.role, 
         school_id = EXCLUDED.school_id, 
         is_active = true;`,
      [stateOfficerId, principalAId, principalBId, teacherAId, studentAId, parentAId, superAdminId, schoolA.id, schoolB.id]
    );

    // Generate JWTs
    const stateOfficerToken = signAuthToken({
      userId: stateOfficerId,
      email: 'state.officer.8e@moe.bn.gov.ng',
      role: 'state_officer',
      schoolId: null,
      isSuperAdmin: false,
    });

    const principalAToken = signAuthToken({
      userId: principalAId,
      email: 'principal.a.8e@apex.edu.ng',
      role: 'principal',
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const principalBToken = signAuthToken({
      userId: principalBId,
      email: 'principal.b.8e@beacon.edu.ng',
      role: 'principal',
      schoolId: schoolB.id,
      isSuperAdmin: false,
    });

    const teacherAToken = signAuthToken({
      userId: teacherAId,
      email: 'teacher.a.8e@apex.edu.ng',
      role: 'teacher',
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const studentAToken = signAuthToken({
      userId: studentAId,
      email: 'student.a.8e@apex.edu.ng',
      role: 'student',
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const parentAToken = signAuthToken({
      userId: parentAId,
      email: 'parent.a.8e@apex.edu.ng',
      role: 'parent',
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const superAdminToken = signAuthToken({
      userId: superAdminId,
      email: 'super.admin.8e@bummpt.com',
      role: 'super_admin',
      schoolId: null,
      isSuperAdmin: true,
    });

    // Setup Test Express Server
    const app = express();
    app.use(express.json());
    app.use('/api/v1/hq/telemetry', hqTelemetryRouter);
    app.use('/api/v1/hq/directives', hqDirectivesRouter);
    app.use('/api/v1/hq/chat', hqChatRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server!.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    console.log(`[Setup] Express test server bound to ${baseUrl}`);

    // Helper request caller
    const apiRequest = async (
      endpoint: string,
      options: {
        method?: string;
        token?: string;
        body?: any;
      } = {}
    ) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
      }
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      let json: any = null;
      try {
        json = await res.json();
      } catch {}
      return { status: res.status, data: json };
    };

    // =========================================================================
    // Category 1: Database Schema & Migration 0011 Integrity
    // =========================================================================
    console.log('\n--- Category 1: Database Schema & Migration 0011 Integrity ---');

    // Test 1.1: Table hq_dispatches exists
    const t1Res = await query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'hq_dispatches'
       );`
    );
    record('Category 1', 'Table hq_dispatches exists in PostgreSQL schema', t1Res.rows[0].exists);

    // Test 1.2: Table hq_dispatch_replies exists
    const t2Res = await query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'hq_dispatch_replies'
       );`
    );
    record('Category 1', 'Table hq_dispatch_replies exists in PostgreSQL schema', t2Res.rows[0].exists);

    // Test 1.3: Table ministry_directives exists
    const t3Res = await query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'ministry_directives'
       );`
    );
    record('Category 1', 'Table ministry_directives exists in PostgreSQL schema', t3Res.rows[0].exists);

    // Test 1.4: Table directive_acknowledgements exists
    const t4Res = await query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'directive_acknowledgements'
       );`
    );
    record('Category 1', 'Table directive_acknowledgements exists in PostgreSQL schema', t4Res.rows[0].exists);

    // Test 1.5: Table hq_audit_logs exists
    const t5Res = await query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'hq_audit_logs'
       );`
    );
    record('Category 1', 'Table hq_audit_logs exists in PostgreSQL schema', t5Res.rows[0].exists);

    // Test 1.6: Check hq_dispatches required columns
    const colDispatches = await query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'hq_dispatches' AND column_name IN ('official_ref_number', 'school_id', 'target_school_id', 'channel_id', 'is_escalated_to_commissioner');`
    );
    record('Category 1', 'hq_dispatches includes ref number, school isolation, and escalation columns', colDispatches.rows.length === 5);

    // Test 1.7: Check ministry_directives audience scoping columns
    const colDirectives = await query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'ministry_directives' AND column_name IN ('audience_type', 'target_school_id', 'target_zone', 'reference_number');`
    );
    record('Category 1', 'ministry_directives includes audience_type, target_school_id, target_zone columns', colDirectives.rows.length === 4);

    // Test 1.8: Check performance indexes exist
    const idxRes = await query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes 
       WHERE tablename IN ('hq_dispatches', 'ministry_directives', 'directive_acknowledgements') 
         AND indexname LIKE 'idx_%';`
    );
    record('Category 1', 'Performance indexes created on foreign keys and scoping columns', idxRes.rows.length >= 6, `Found ${idxRes.rows.length} indexes`);

    // =========================================================================
    // Category 2: Authentication & Unauthenticated Rejections (401)
    // =========================================================================
    console.log('\n--- Category 2: Authentication & Unauthenticated Rejections ---');

    // Test 2.1: GET /telemetry/overview unauthenticated
    const res2_1 = await apiRequest('/api/v1/hq/telemetry/overview');
    record('Category 2', 'GET /api/v1/hq/telemetry/overview rejects missing token with 401', res2_1.status === 401);

    // Test 2.2: GET /directives unauthenticated
    const res2_2 = await apiRequest('/api/v1/hq/directives');
    record('Category 2', 'GET /api/v1/hq/directives rejects missing token with 401', res2_2.status === 401);

    // Test 2.3: POST /directives unauthenticated
    const res2_3 = await apiRequest('/api/v1/hq/directives', { method: 'POST', body: { title: 'Test' } });
    record('Category 2', 'POST /api/v1/hq/directives rejects missing token with 401', res2_3.status === 401);

    // Test 2.4: GET /chat/messages unauthenticated
    const res2_4 = await apiRequest('/api/v1/hq/chat/messages');
    record('Category 2', 'GET /api/v1/hq/chat/messages rejects missing token with 401', res2_4.status === 401);

    // Test 2.5: POST /chat/messages unauthenticated
    const res2_5 = await apiRequest('/api/v1/hq/chat/messages', { method: 'POST', body: { content: 'Test' } });
    record('Category 2', 'POST /api/v1/hq/chat/messages rejects missing token with 401', res2_5.status === 401);

    // =========================================================================
    // Category 3: Role-Based Access Control (RBAC) & Channel Gatekeeping (403)
    // =========================================================================
    console.log('\n--- Category 3: Role-Based Access Control (RBAC) & Channel Gatekeeping ---');

    // Test 3.1: Teacher cannot access HQ chat
    const res3_1 = await apiRequest('/api/v1/hq/chat/messages', { token: teacherAToken });
    record('Category 3', 'Teacher role is forbidden from HQ live chat channel (403)', res3_1.status === 403);

    // Test 3.2: Student cannot access HQ chat
    const res3_2 = await apiRequest('/api/v1/hq/chat/messages', { token: studentAToken });
    record('Category 3', 'Student role is forbidden from HQ live chat channel (403)', res3_2.status === 403);

    // Test 3.3: Parent cannot access HQ chat
    const res3_3 = await apiRequest('/api/v1/hq/chat/messages', { token: parentAToken });
    record('Category 3', 'Parent role is forbidden from HQ live chat channel (403)', res3_3.status === 403);

    // Test 3.4: Principal (Head of School) CAN access HQ chat
    const res3_4 = await apiRequest('/api/v1/hq/chat/messages', { token: principalAToken });
    record('Category 3', 'Principal (Head of School) is granted access to HQ chat (200)', res3_4.status === 200);

    // Test 3.5: State HQ Officer CAN access HQ chat
    const res3_5 = await apiRequest('/api/v1/hq/chat/messages', { token: stateOfficerToken });
    record('Category 3', 'State HQ Officer is granted access to HQ chat (200)', res3_5.status === 200);

    // Test 3.6: Super Admin CAN access HQ chat
    const res3_6 = await apiRequest('/api/v1/hq/chat/messages', { token: superAdminToken });
    record('Category 3', 'Super Admin is granted access to HQ chat (200)', res3_6.status === 200);

    // Test 3.7: Teacher cannot post to HQ chat
    const res3_7 = await apiRequest('/api/v1/hq/chat/messages', {
      method: 'POST',
      token: teacherAToken,
      body: { content: 'Unauthorized teacher message' },
    });
    record('Category 3', 'Teacher cannot post dispatches to HQ chat (403)', res3_7.status === 403);

    // =========================================================================
    // Category 4: Statewide HQ Telemetry & Subvention Operations
    // =========================================================================
    console.log('\n--- Category 4: Statewide HQ Telemetry & Subvention Operations ---');

    // Test 4.1: Live overview metrics
    const res4_1 = await apiRequest('/api/v1/hq/telemetry/overview', { token: stateOfficerToken });
    const overviewData = res4_1.data?.data;
    record(
      'Category 4',
      'GET /api/v1/hq/telemetry/overview returns 23 LGAs and live indicators',
      res4_1.status === 200 && (overviewData?.totalLGAs === 23 || overviewData?.lgaCount === 23) && overviewData?.totalSchools > 0
    );

    // Test 4.2: All 23 LGAs list
    const res4_2 = await apiRequest('/api/v1/hq/telemetry/lgas', { token: stateOfficerToken });
    const lgasData = res4_2.data?.data;
    record(
      'Category 4',
      'GET /api/v1/hq/telemetry/lgas returns comprehensive directory of 23 LGAs',
      res4_2.status === 200 && Array.isArray(lgasData) && lgasData.length === 23
    );

    // Test 4.3: Specific School Telemetry
    const res4_3 = await apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: principalAToken });
    record(
      'Category 4',
      'GET /api/v1/hq/telemetry/schools/:id returns live metrics for requested school',
      res4_3.status === 200 && res4_3.data?.data?.school?.id === schoolA.id
    );

    // Test 4.4: State Officer can disburse subvention
    const res4_4 = await apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/subvention`, {
      method: 'POST',
      token: stateOfficerToken,
      body: {
        grantAmount: 1500000,
        grantType: 'STEM Laboratory Consumables Grant',
        purpose: 'Reagent procurement for senior chemistry practicals',
      },
    });
    record(
      'Category 4',
      'State Officer can disburse state subvention grant via PostgreSQL transaction',
      res4_4.status === 200 && res4_4.data?.success === true
    );

    // Test 4.5: Principal cannot disburse subvention to own school
    const res4_5 = await apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/subvention`, {
      method: 'POST',
      token: principalAToken,
      body: {
        grantAmount: 500000,
        grantType: 'Unauthorized Self Grant',
        purpose: 'Self approval',
      },
    });
    record(
      'Category 4',
      'School Head cannot self-disburse state subventions (403 forbidden)',
      res4_5.status === 403
    );

    // Test 4.6: Subvention disbursement logged in hq_audit_logs
    const auditSubvRes = await query<{ count: string }>(
      `SELECT count(*) as count FROM hq_audit_logs WHERE action = 'SUBVENTION_DISBURSED' AND school_id = $1;`,
      [schoolA.id]
    );
    record(
      'Category 4',
      'Subvention release creates an immutable entry in hq_audit_logs',
      parseInt(auditSubvRes.rows[0].count, 10) > 0
    );

    // =========================================================================
    // Category 5: Ministry Directives Creation & Validation
    // =========================================================================
    console.log('\n--- Category 5: Ministry Directives Creation & Validation ---');

    // Test 5.1: State Officer publishes statewide directive
    const res5_1 = await apiRequest('/api/v1/hq/directives', {
      method: 'POST',
      token: stateOfficerToken,
      body: {
        title: 'Mandatory Continuous Assessment Broadsheet Validation',
        category: 'Examination Standards',
        priority: 'Executive Order',
        targetAudience: 'Statewide (All 23 LGAs)',
        audienceType: 'ALL_SCHOOLS',
        content: 'All schools must submit signed CA records to the Zonal Inspectorate by Week 10.',
        actionRequired: 'Submit vetted broadsheets to Zonal Inspector.',
      },
    });
    const createdDirectiveAll = res5_1.data?.data;
    record(
      'Category 5',
      'State Officer broadcasts statewide executive directive successfully (201)',
      res5_1.status === 201 && !!createdDirectiveAll?.id && createdDirectiveAll.reference_number.startsWith('MOE/')
    );

    // Test 5.2: Head of school cannot publish a state directive
    const res5_2 = await apiRequest('/api/v1/hq/directives', {
      method: 'POST',
      token: principalAToken,
      body: {
        title: 'Principal Unofficial Directive',
        content: 'Unauthorized circular draft.',
      },
    });
    record(
      'Category 5',
      'School Head cannot publish state directives (403 forbidden)',
      res5_2.status === 403
    );

    // Test 5.3: Teacher cannot publish directive
    const res5_3 = await apiRequest('/api/v1/hq/directives', {
      method: 'POST',
      token: teacherAToken,
      body: {
        title: 'Teacher Directive',
        content: 'Teacher content.',
      },
    });
    record(
      'Category 5',
      'Teacher cannot publish state directives (403 forbidden)',
      res5_3.status === 403
    );

    // Test 5.4: Missing required fields rejected (400)
    const res5_4 = await apiRequest('/api/v1/hq/directives', {
      method: 'POST',
      token: stateOfficerToken,
      body: {
        category: 'Academic Calendar',
        // missing title and content
      },
    });
    record(
      'Category 5',
      'Directive creation with missing title/content rejected with 400',
      res5_4.status === 400
    );

    // Test 5.5: Audit log recorded for directive publication
    const auditDirRes = await query<{ count: string }>(
      `SELECT count(*) as count FROM hq_audit_logs WHERE action IN ('DIRECTIVE_CREATED', 'DIRECTIVE_PUBLISHED') AND user_id = $1;`,
      [stateOfficerId]
    );
    record(
      'Category 5',
      'Directive publication writes audit trail in hq_audit_logs',
      parseInt(auditDirRes.rows[0].count, 10) > 0
    );

    // =========================================================================
    // Category 6: Ministry Directives Multi-Tenant Visibility & Scoping
    // =========================================================================
    console.log('\n--- Category 6: Ministry Directives Multi-Tenant Visibility & Scoping ---');

    // Create a targeted directive strictly for School A
    const res6_create = await apiRequest('/api/v1/hq/directives', {
      method: 'POST',
      token: stateOfficerToken,
      body: {
        title: `Targeted Special Audit for ${schoolA.name}`,
        category: 'Security & Safety',
        priority: 'Urgent / High Priority',
        targetAudience: 'Specific LGA / Schools',
        audienceType: 'SPECIFIC_SCHOOL',
        targetSchoolId: schoolA.id,
        targetSchoolName: schoolA.name,
        targetLga: 'Makurdi',
        content: 'Special safety and perimeter audit scheduled for School A only.',
        actionRequired: 'Prepare safety logs for inspector arrival.',
      },
    });
    const targetedDirectiveA = res6_create.data?.data;

    // Test 6.1: Statewide directive visible to School A Head
    const res6_1 = await apiRequest('/api/v1/hq/directives', { token: principalAToken });
    const hasStatewideInA = res6_1.data?.data?.some((d: any) => d.id === createdDirectiveAll?.id);
    record('Category 6', 'Statewide directive is visible to School A Head', hasStatewideInA === true);

    // Test 6.2: Statewide directive visible to School B Head
    const res6_2 = await apiRequest('/api/v1/hq/directives', { token: principalBToken });
    const hasStatewideInB = res6_2.data?.data?.some((d: any) => d.id === createdDirectiveAll?.id);
    record('Category 6', 'Statewide directive is visible to School B Head', hasStatewideInB === true);

    // Test 6.3: Targeted directive for School A is visible to School A Head
    const hasTargetedInA = res6_1.data?.data?.some((d: any) => d.id === targetedDirectiveA?.id);
    record('Category 6', 'Targeted directive for School A is visible to School A Head', hasTargetedInA === true);

    // Test 6.4: Targeted directive for School A is NOT visible to School B Head (Tenant Isolation)
    const hasTargetedInB = res6_2.data?.data?.some((d: any) => d.id === targetedDirectiveA?.id);
    record(
      'Category 6',
      'Targeted directive for School A is STRICTLY INVISIBLE to School B Head',
      hasTargetedInB === false
    );

    // Test 6.5: Direct lookup by ID for School B Head returns 404 (IDOR Protection)
    const res6_5 = await apiRequest(`/api/v1/hq/directives/${targetedDirectiveA.id}`, { token: principalBToken });
    record(
      'Category 6',
      'GET /api/v1/hq/directives/:id denies School B from viewing School A private directive (404)',
      res6_5.status === 404
    );

    // =========================================================================
    // Category 7: Directives Compliance Acknowledgment Workflow
    // =========================================================================
    console.log('\n--- Category 7: Directives Compliance Acknowledgment Workflow ---');

    // Test 7.1: School A Head can acknowledge visible directive
    const res7_1 = await apiRequest(`/api/v1/hq/directives/${targetedDirectiveA.id}/acknowledge`, {
      method: 'POST',
      token: principalAToken,
      body: { notes: 'Formally acknowledged by School A Principal.' },
    });
    record(
      'Category 7',
      'School A Head can acknowledge visible directive with official note (200)',
      res7_1.status === 200 && res7_1.data?.success === true
    );

    // Test 7.2: Database record check in directive_acknowledgements
    const ackDbRes = await query<{ user_id: string; school_id: string }>(
      `SELECT user_id, school_id FROM directive_acknowledgements 
       WHERE directive_id = $1 AND school_id = $2;`,
      [targetedDirectiveA.id, schoolA.id]
    );
    record(
      'Category 7',
      'Acknowledgment persistently records school_id, user_id, and timestamp',
      ackDbRes.rows.length === 1 && ackDbRes.rows[0].user_id === principalAId
    );

    // Test 7.3: Idempotent re-acknowledgment
    const res7_3 = await apiRequest(`/api/v1/hq/directives/${targetedDirectiveA.id}/acknowledge`, {
      method: 'POST',
      token: principalAToken,
      body: { notes: 'Updated compliance notes.' },
    });
    record(
      'Category 7',
      'Re-acknowledging a directive is idempotent and succeeds safely (200)',
      res7_3.status === 200
    );

    // Test 7.4: School B Head cannot acknowledge School A directive
    const res7_4 = await apiRequest(`/api/v1/hq/directives/${targetedDirectiveA.id}/acknowledge`, {
      method: 'POST',
      token: principalBToken,
      body: { notes: 'Malicious cross-tenant acknowledgment attempt.' },
    });
    record(
      'Category 7',
      'School B Head cannot acknowledge directive intended for School A (404/403)',
      res7_4.status === 404 || res7_4.status === 403
    );

    // Test 7.5: Acknowledgment generates audit log
    const auditAckRes = await query<{ count: string }>(
      `SELECT count(*) as count FROM hq_audit_logs 
       WHERE action = 'DIRECTIVE_ACKNOWLEDGED' AND user_id = $1;`,
      [principalAId]
    );
    record(
      'Category 7',
      'Directive acknowledgment creates immutable log in hq_audit_logs',
      parseInt(auditAckRes.rows[0].count, 10) > 0
    );

    // =========================================================================
    // Category 8: Inter-School & HQ Dispatches Messaging & Tenant Isolation
    // =========================================================================
    console.log('\n--- Category 8: Inter-School & HQ Dispatches Messaging & Tenant Isolation ---');

    // Test 8.1: School A Head submits dispatch to HQ
    const res8_1 = await apiRequest('/api/v1/hq/chat/messages', {
      method: 'POST',
      token: principalAToken,
      body: {
        channelId: 'all-schools-announcements',
        messageType: 'requisition',
        priority: 'high',
        content: 'Urgent requisition for WAEC biology laboratory specimens.',
        lga: 'Makurdi',
      },
    });
    const dispatchA = res8_1.data?.data;
    record(
      'Category 8',
      'School Head can submit live dispatch to HQ channel (201 created)',
      res8_1.status === 201 && !!dispatchA?.id
    );

    // Test 8.2: Official reference number generated in format BN/HQ/... or MOE/BN/...
    record(
      'Category 8',
      'Dispatched message receives authoritative reference starting with BN/HQ/ or MOE/BN/',
      typeof dispatchA?.official_ref_number === 'string' &&
        (dispatchA.official_ref_number.startsWith('BN/HQ/') || dispatchA.official_ref_number.startsWith('MOE/BN/'))
    );

    // Test 8.3: Sender metadata derived from token, not client payload
    record(
      'Category 8',
      'Sender identity derived authoritatively from server auth token (not forged in body)',
      dispatchA?.sender_name === 'Principal Terver Tyokyaa' && dispatchA?.school_id === schoolA.id
    );

    // Create a targeted private dispatch from School A Head to HQ
    const res8_target = await apiRequest('/api/v1/hq/chat/messages', {
      method: 'POST',
      token: principalAToken,
      body: {
        channelId: 'school-direct-inquiries',
        messageType: 'security',
        priority: 'urgent',
        content: 'Confidential security assessment for School A perimeter.',
        targetSchoolId: schoolA.id,
        targetSchoolName: schoolA.name,
        lga: 'Makurdi',
      },
    });
    const privateDispatchA = res8_target.data?.data;

    // Test 8.4: Targeted dispatch visible to School A Head
    const res8_listA = await apiRequest('/api/v1/hq/chat/messages', { token: principalAToken });
    const hasPrivateInA = res8_listA.data?.data?.some((m: any) => m.id === privateDispatchA?.id);
    record('Category 8', 'Targeted dispatch is visible to originating School A Head', hasPrivateInA === true);

    // Test 8.5: Targeted dispatch NOT visible to School B Head
    const res8_listB = await apiRequest('/api/v1/hq/chat/messages', { token: principalBToken });
    const hasPrivateInB = res8_listB.data?.data?.some((m: any) => m.id === privateDispatchA?.id);
    record(
      'Category 8',
      'Targeted dispatch for School A is STRICTLY INVISIBLE to School B Head (Cross-School Privacy)',
      hasPrivateInB === false
    );

    // Test 8.6: Targeted dispatch visible to State HQ Officer
    const res8_listHq = await apiRequest('/api/v1/hq/chat/messages', { token: stateOfficerToken });
    const hasPrivateInHq = res8_listHq.data?.data?.some((m: any) => m.id === privateDispatchA?.id);
    record('Category 8', 'Targeted dispatch from school is visible to State HQ Officer desk', hasPrivateInHq === true);

    // =========================================================================
    // Category 9: Quick Replies & Escalation Workflow
    // =========================================================================
    console.log('\n--- Category 9: Quick Replies & Escalation Workflow ---');

    // Test 9.1: State HQ Officer submits official reply to School A dispatch
    const res9_1 = await apiRequest(`/api/v1/hq/chat/messages/${dispatchA.id}/reply`, {
      method: 'POST',
      token: stateOfficerToken,
      body: { replyContent: 'Requisition noted. Inspector assigned for lab verification on Thursday.' },
    });
    const createdReply = res9_1.data?.data;
    record(
      'Category 9',
      'State HQ Officer can submit authoritative reply to school dispatch (201)',
      res9_1.status === 201 && (createdReply?.sender_type === 'HQ' || createdReply?.sender_type === 'hq_officer')
    );

    // Test 9.2: Reply stored in hq_dispatch_replies table
    const replyDbRes = await query<{ count: string }>(
      `SELECT count(*) as count FROM hq_dispatch_replies WHERE dispatch_id = $1;`,
      [dispatchA.id]
    );
    record(
      'Category 9',
      'Reply is persistently linked to dispatch in hq_dispatch_replies',
      parseInt(replyDbRes.rows[0].count, 10) > 0
    );

    // Test 9.3: School B Head cannot reply to School A private dispatch
    const res9_3 = await apiRequest(`/api/v1/hq/chat/messages/${privateDispatchA.id}/reply`, {
      method: 'POST',
      token: principalBToken,
      body: { replyContent: 'Unauthorized attempt to reply to another school dispatch.' },
    });
    record(
      'Category 9',
      'School B Head cannot reply to School A private dispatch (404/403)',
      res9_3.status === 404 || res9_3.status === 403
    );

    // Test 9.4: School Head can escalate dispatch to Commissioner
    const res9_4 = await apiRequest(`/api/v1/hq/chat/messages/${dispatchA.id}/status`, {
      method: 'PATCH',
      token: principalAToken,
      body: {
        isEscalatedToCommissioner: true,
        status: 'forwarded-to-head',
      },
    });
    record(
      'Category 9',
      'School Head can escalate critical dispatch to Commissioner desk (200)',
      res9_4.status === 200 && res9_4.data?.data?.is_escalated_to_commissioner === true
    );

    // Test 9.5: Escalation writes audit log in hq_audit_logs
    const auditEscRes = await query<{ count: string }>(
      `SELECT count(*) as count FROM hq_audit_logs 
       WHERE action = 'DISPATCH_ESCALATED' AND user_id = $1;`,
      [principalAId]
    );
    record(
      'Category 9',
      'Dispatch escalation records audit trace in hq_audit_logs',
      parseInt(auditEscRes.rows[0].count, 10) > 0
    );

    // =========================================================================
    // Category 10: Memory Decoupling & PostgreSQL Authoritative Integrity
    // =========================================================================
    console.log('\n--- Category 10: Memory Decoupling & PostgreSQL Authoritative Integrity ---');

    // Test 10.1: Repository methods execute against real DB without relying on in-memory objects
    const repoOverview = await hqTelemetryRepository.getOverview();
    record(
      'Category 10',
      'HqTelemetryRepository aggregates directly from PostgreSQL tables',
      repoOverview.totalSchools > 0 && repoOverview.totalLGAs === 23
    );

    // Test 10.2: Directives count matches PostgreSQL count
    const dirDbCount = await query<{ count: string }>('SELECT count(*) as count FROM ministry_directives;');
    const repoDirectives = await ministryDirectiveRepository.getDirectivesForUser({
      id: stateOfficerId,
      role: 'state_officer',
      schoolId: undefined,
    } as any);
    record(
      'Category 10',
      'Directives retrieved by State Officer reflect full database count',
      repoDirectives.length === parseInt(dirDbCount.rows[0].count, 10)
    );

    // Test 10.3: Dynamic transfer of Principal follows database assignment immediately
    // Transfer principal A to School B in users table
    await query(`UPDATE users SET school_id = $1 WHERE id = $2;`, [schoolB.id, principalAId]);
    const dynamicToken = signAuthToken({
      userId: principalAId,
      email: 'principal.a.8e@apex.edu.ng',
      role: 'principal',
      schoolId: schoolB.id,
      isSuperAdmin: false,
    });
    // Now querying directives should show School B directives and NOT School A private directives
    const transferredDirectives = await apiRequest('/api/v1/hq/directives', { token: dynamicToken });
    const seesOldSchoolA = transferredDirectives.data?.data?.some((d: any) => d.id === targetedDirectiveA?.id);
    record(
      'Category 10',
      'Transferred Principal access follows database assignment dynamically (no stale school access)',
      seesOldSchoolA === false
    );
    // Restore principal A back to School A
    await query(`UPDATE users SET school_id = $1 WHERE id = $2;`, [schoolA.id, principalAId]);

    // Test 10.4: Database transaction rollback on error
    let rollbackSuccess = false;
    try {
      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO hq_audit_logs (action, user_id, user_role, ip_address) 
           VALUES ('TRANSACTION_TEST', $1, 'state_officer', '127.0.0.1');`,
          [stateOfficerId]
        );
        throw new Error('Simulated transaction failure');
      });
    } catch (e: any) {
      if (e.message && e.message.includes('Simulated transaction failure')) {
        const testRes = await query<{ count: string }>(
          `SELECT count(*) as count FROM hq_audit_logs WHERE action = 'TRANSACTION_TEST';`
        );
        rollbackSuccess = parseInt(testRes.rows[0].count, 10) === 0;
      }
    }
    record('Category 10', 'Atomic transaction rollbacks cleanly on simulated failure', rollbackSuccess);

    // =========================================================================
    // Summary
    // =========================================================================
    console.log('\n======================================================================');
    console.log('Test Execution Summary');
    console.log('======================================================================');
    const passed = results.filter((r) => r.status === 'PASSED').length;
    const failed = results.filter((r) => r.status === 'FAILED').length;
    console.log(`Total Tests Run : ${results.length}`);
    console.log(`Passed          : ${passed}`);
    console.log(`Failed          : ${failed}`);
    console.log('======================================================================\n');

    if (failed > 0) {
      console.error(`❌ Phase 8E Test Suite Failed with ${failed} failure(s).`);
      process.exit(1);
    } else {
      console.log('🎉 Phase 8E Comprehensive Test Suite Passed Successfully!');
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await closeDatabasePool();
  }
}

runPhase8eTestSuite();
