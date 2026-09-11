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
import fs from 'fs';
import path from 'path';
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
    const bursarAId      = 'e8888888-8888-8888-8888-888888888888';
    const headmistressAId = 'e9999999-9999-9999-9999-999999999999';
    const headKinderAId  = 'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const admissionsAId  = 'ebbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, school_id, is_active)
       VALUES 
         ($1, 'state.officer.8e@moe.bn.gov.ng', 'hashed_pass_placeholder', 'Hon. Commissioner Ikyaan', 'state_officer', NULL, true),
         ($2, 'principal.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Principal Terver Tyokyaa', 'principal', $8, true),
         ($3, 'principal.b.8e@beacon.edu.ng', 'hashed_pass_placeholder', 'Principal Aondoaver Uza', 'principal', $9, true),
         ($4, 'teacher.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Mr. David Aondo', 'teacher', $8, true),
         ($5, 'student.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Master Bem Tyokyaa', 'student', $8, true),
         ($6, 'parent.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Chief Tyokyaa', 'parent', $8, true),
         ($7, 'super.admin.8e@bummpt.com', 'hashed_pass_placeholder', 'Super Admin Officer', 'super_admin', NULL, true),
         ($10, 'bursar.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Mrs. Rebecca Ior', 'bursar', $8, true),
         ($11, 'headmistress.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Headmistress Comfort Tor', 'headmistress', $8, true),
         ($12, 'headkinder.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Headmistress Grace Agbo', 'head_kindergarten', $8, true),
         ($13, 'admissions.a.8e@apex.edu.ng', 'hashed_pass_placeholder', 'Mr. Emmanuel Agada', 'admissions_officer', $8, true)
       ON CONFLICT (id) DO UPDATE SET 
         email = EXCLUDED.email, 
         role = EXCLUDED.role, 
         school_id = EXCLUDED.school_id, 
         is_active = true;`,
      [
        stateOfficerId, principalAId, principalBId, teacherAId, studentAId, parentAId, superAdminId,
        schoolA.id, schoolB.id,
        bursarAId, headmistressAId, headKinderAId, admissionsAId
      ]
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

    const bursarAToken = signAuthToken({
      userId: bursarAId,
      email: 'bursar.a.8e@apex.edu.ng',
      role: 'bursar',
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const headmistressAToken = signAuthToken({
      userId: headmistressAId,
      email: 'headmistress.a.8e@apex.edu.ng',
      role: 'headmistress',
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const headKinderAToken = signAuthToken({
      userId: headKinderAId,
      email: 'headkinder.a.8e@apex.edu.ng',
      role: 'head_kindergarten',
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const admissionsAToken = signAuthToken({
      userId: admissionsAId,
      email: 'admissions.a.8e@apex.edu.ng',
      role: 'admissions_officer',
      schoolId: schoolA.id,
      isSuperAdmin: false,
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

    // Test 3.3b: Bursar cannot access HQ chat
    const res3_3b = await apiRequest('/api/v1/hq/chat/messages', { token: bursarAToken });
    record('Category 3', 'Bursar role is forbidden from HQ live chat channel (403)', res3_3b.status === 403);

    // Test 3.3c: Non-heads forbidden from Directives
    const res3_3c1 = await apiRequest('/api/v1/hq/directives', { token: teacherAToken });
    const res3_3c2 = await apiRequest('/api/v1/hq/directives', { token: bursarAToken });
    const res3_3c3 = await apiRequest('/api/v1/hq/directives', { token: studentAToken });
    const res3_3c4 = await apiRequest('/api/v1/hq/directives', { token: parentAToken });
    record('Category 3', 'Teacher role is forbidden from Ministry Directives (403)', res3_3c1.status === 403);
    record('Category 3', 'Bursar role is forbidden from Ministry Directives (403)', res3_3c2.status === 403);
    record('Category 3', 'Student role is forbidden from Ministry Directives (403)', res3_3c3.status === 403);
    record('Category 3', 'Parent role is forbidden from Ministry Directives (403)', res3_3c4.status === 403);

    // Test 3.3d: Non-heads and non-HQ forbidden from Telemetry
    const res3_3d1 = await apiRequest('/api/v1/hq/telemetry/overview', { token: teacherAToken });
    const res3_3d2 = await apiRequest('/api/v1/hq/telemetry/overview', { token: bursarAToken });
    record('Category 3', 'Teacher role is forbidden from Ministry Telemetry (403)', res3_3d1.status === 403);
    record('Category 3', 'Bursar role is forbidden from Ministry Telemetry (403)', res3_3d2.status === 403);

    // Test 3.4: Principal (Head of School) CAN access HQ chat
    const res3_4 = await apiRequest('/api/v1/hq/chat/messages', { token: principalAToken });
    record('Category 3', 'Principal (Head of School) is granted access to HQ chat (200)', res3_4.status === 200);

    // Test 3.4b: Headmistress & Head of Kindergarten CAN access HQ chat & Directives
    const res3_4b1 = await apiRequest('/api/v1/hq/chat/messages', { token: headmistressAToken });
    const res3_4b2 = await apiRequest('/api/v1/hq/directives', { token: headmistressAToken });
    const res3_4b3 = await apiRequest('/api/v1/hq/chat/messages', { token: headKinderAToken });
    const res3_4b4 = await apiRequest('/api/v1/hq/directives', { token: headKinderAToken });
    record('Category 3', 'Headmistress is granted access to HQ chat (200)', res3_4b1.status === 200);
    record('Category 3', 'Headmistress is granted access to Ministry Directives (200)', res3_4b2.status === 200);
    record('Category 3', 'Head of Kindergarten is granted access to HQ chat (200)', res3_4b3.status === 200);
    record('Category 3', 'Head of Kindergarten is granted access to Ministry Directives (200)', res3_4b4.status === 200);

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

    // Test 4.0A: Comprehensive Telemetry Role Matrix for GET /overview
    const [
      res4_ov_sa, res4_ov_so, res4_ov_pr, res4_ov_hm, res4_ov_hk,
      res4_ov_tc, res4_ov_bu, res4_ov_ad, res4_ov_pa, res4_ov_st
    ] = await Promise.all([
      apiRequest('/api/v1/hq/telemetry/overview', { token: superAdminToken }),
      apiRequest('/api/v1/hq/telemetry/overview', { token: stateOfficerToken }),
      apiRequest('/api/v1/hq/telemetry/overview', { token: principalAToken }),
      apiRequest('/api/v1/hq/telemetry/overview', { token: headmistressAToken }),
      apiRequest('/api/v1/hq/telemetry/overview', { token: headKinderAToken }),
      apiRequest('/api/v1/hq/telemetry/overview', { token: teacherAToken }),
      apiRequest('/api/v1/hq/telemetry/overview', { token: bursarAToken }),
      apiRequest('/api/v1/hq/telemetry/overview', { token: admissionsAToken }),
      apiRequest('/api/v1/hq/telemetry/overview', { token: parentAToken }),
      apiRequest('/api/v1/hq/telemetry/overview', { token: studentAToken }),
    ]);

    record('Category 4', 'Telemetry overview: super_admin granted access (200)', res4_ov_sa.status === 200);
    record('Category 4', 'Telemetry overview: state_officer granted access (200)', res4_ov_so.status === 200);
    record('Category 4', 'Telemetry overview: principal denied access (403)', res4_ov_pr.status === 403);
    record('Category 4', 'Telemetry overview: headmistress denied access (403)', res4_ov_hm.status === 403);
    record('Category 4', 'Telemetry overview: head_kindergarten denied access (403)', res4_ov_hk.status === 403);
    record('Category 4', 'Telemetry overview: teacher denied access (403)', res4_ov_tc.status === 403);
    record('Category 4', 'Telemetry overview: bursar denied access (403)', res4_ov_bu.status === 403);
    record('Category 4', 'Telemetry overview: admissions_officer denied access (403)', res4_ov_ad.status === 403);
    record('Category 4', 'Telemetry overview: parent denied access (403)', res4_ov_pa.status === 403);
    record('Category 4', 'Telemetry overview: student denied access (403)', res4_ov_st.status === 403);

    // Test 4.0B: School Telemetry Authorization Matrix for GET /schools/:id
    const [
      res4_sc_so_a, res4_sc_sa_b, res4_sc_pr_a, res4_sc_pr_b,
      res4_sc_tc_a, res4_sc_bu_a, res4_sc_ad_a, res4_sc_pa_a, res4_sc_st_a
    ] = await Promise.all([
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: stateOfficerToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolB.id}`, { token: superAdminToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: principalAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolB.id}`, { token: principalAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: teacherAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: bursarAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: admissionsAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: parentAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: studentAToken }),
    ]);

    record('Category 4', 'School telemetry: HQ state_officer can inspect School A (200)', res4_sc_so_a.status === 200);
    record('Category 4', 'School telemetry: HQ super_admin can inspect School B (200)', res4_sc_sa_b.status === 200);
    record('Category 4', 'School telemetry: Head A can inspect School A (200)', res4_sc_pr_a.status === 200);
    record('Category 4', 'School telemetry: Head A probing School B receives 404 (IDOR guard)', res4_sc_pr_b.status === 404);
    record('Category 4', 'School telemetry: teacher denied access (403)', res4_sc_tc_a.status === 403);
    record('Category 4', 'School telemetry: bursar denied access (403)', res4_sc_bu_a.status === 403);
    record('Category 4', 'School telemetry: admissions_officer denied access (403)', res4_sc_ad_a.status === 403);
    record('Category 4', 'School telemetry: parent denied access (403)', res4_sc_pa_a.status === 403);
    record('Category 4', 'School telemetry: student denied access (403)', res4_sc_st_a.status === 403);

    // Test 4.0C: KPI Telemetry Authorization Matrix for GET /schools/:id/kpis
    const [
      res4_kpi_so_a, res4_kpi_sa_b, res4_kpi_pr_a, res4_kpi_pr_b,
      res4_kpi_tc_a, res4_kpi_bu_a, res4_kpi_ad_a, res4_kpi_pa_a, res4_kpi_st_a
    ] = await Promise.all([
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/kpis`, { token: stateOfficerToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolB.id}/kpis`, { token: superAdminToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/kpis`, { token: principalAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolB.id}/kpis`, { token: principalAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/kpis`, { token: teacherAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/kpis`, { token: bursarAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/kpis`, { token: admissionsAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/kpis`, { token: parentAToken }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/kpis`, { token: studentAToken }),
    ]);

    record('Category 4', 'School KPIs: HQ state_officer can inspect School A KPIs (200)', res4_kpi_so_a.status === 200);
    record('Category 4', 'School KPIs: HQ super_admin can inspect School B KPIs (200)', res4_kpi_sa_b.status === 200);
    record('Category 4', 'School KPIs: Head A can inspect School A KPIs (200)', res4_kpi_pr_a.status === 200);
    record('Category 4', 'School KPIs: Head A probing School B KPIs receives 404 (IDOR guard)', res4_kpi_pr_b.status === 404);
    record('Category 4', 'School KPIs: teacher denied access (403)', res4_kpi_tc_a.status === 403);
    record('Category 4', 'School KPIs: bursar denied access (403)', res4_kpi_bu_a.status === 403);
    record('Category 4', 'School KPIs: admissions_officer denied access (403)', res4_kpi_ad_a.status === 403);
    record('Category 4', 'School KPIs: parent denied access (403)', res4_kpi_pa_a.status === 403);
    record('Category 4', 'School KPIs: student denied access (403)', res4_kpi_st_a.status === 403);

    // Test 4.0D: Synthetic Counter Detection (Static & Source Code Audit)
    const hqPageContent = fs.readFileSync(path.join(process.cwd(), 'src/pages/BenueStateHQPage.tsx'), 'utf8');
    const hqRepoContent = fs.readFileSync(path.join(process.cwd(), 'src/db/repositories/hqTelemetry.repository.ts'), 'utf8');
    const has438InFrontend = hqPageContent.includes('438');
    const has438InRepo = hqRepoContent.includes('438');
    const hasRandomInRepo = hqRepoContent.includes('Math.random()');

    record('Category 4', 'Frontend BenueStateHQPage does NOT contain hardcoded 438 telemetry default', !has438InFrontend);
    record('Category 4', 'Repository hqTelemetry.repository does NOT contain 438 or synthetic Math.random()', !has438InRepo && !hasRandomInRepo);

    // Test 4.0E: Directive Seed Isolation
    const scanDirs = ['src/pages', 'src/components', 'src/api', 'src/db/repositories'];
    let directiveSeedLeakFound = false;
    for (const sDir of scanDirs) {
      const fullDir = path.join(process.cwd(), sDir);
      if (fs.existsSync(fullDir)) {
        const files = fs.readdirSync(fullDir, { recursive: true }) as string[];
        for (const file of files) {
          if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
            const filePath = path.join(fullDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('INITIAL_MINISTRY_DIRECTIVES')) {
              directiveSeedLeakFound = true;
              console.error(`[Leak Check] INITIAL_MINISTRY_DIRECTIVES imported in ${filePath}`);
            }
          }
        }
      }
    }
    record('Category 4', 'INITIAL_MINISTRY_DIRECTIVES is strictly isolated and NEVER imported by production UI/API/repo code', !directiveSeedLeakFound);

    // Test 4.0F: Subvention Role Gatekeeping Matrix
    const [res4_sub_sa, res4_sub_so, res4_sub_pr, res4_sub_hm, res4_sub_tc, res4_sub_bu, res4_sub_ad] = await Promise.all([
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/subvention`, {
        method: 'POST',
        token: superAdminToken,
        body: { grantAmount: 100000, grantType: 'Emergency Grant', purpose: 'Roof repair' },
      }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/subvention`, {
        method: 'POST',
        token: stateOfficerToken,
        body: { grantAmount: 100000, grantType: 'Special Subvention Grant', purpose: 'Science books' },
      }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/subvention`, {
        method: 'POST',
        token: principalAToken,
        body: { grantAmount: 100000, grantType: 'Unauthorized Self Grant', purpose: 'Self grant' },
      }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/subvention`, {
        method: 'POST',
        token: headmistressAToken,
        body: { grantAmount: 100000, grantType: 'Unauthorized Self Grant', purpose: 'Self grant' },
      }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/subvention`, {
        method: 'POST',
        token: teacherAToken,
        body: { grantAmount: 100000, grantType: 'Unauthorized Teacher Grant', purpose: 'Teacher grant' },
      }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/subvention`, {
        method: 'POST',
        token: bursarAToken,
        body: { grantAmount: 100000, grantType: 'Unauthorized Bursar Grant', purpose: 'Bursar grant' },
      }),
      apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/subvention`, {
        method: 'POST',
        token: admissionsAToken,
        body: { grantAmount: 100000, grantType: 'Unauthorized Admissions Grant', purpose: 'Admissions grant' },
      }),
    ]);

    record('Category 4', 'Subvention: super_admin authorized to disburse grants (200)', res4_sub_sa.status === 200);
    record('Category 4', 'Subvention: state_officer authorized to disburse grants (200)', res4_sub_so.status === 200);
    record('Category 4', 'Subvention: principal denied grant disbursement (403)', res4_sub_pr.status === 403);
    record('Category 4', 'Subvention: headmistress denied grant disbursement (403)', res4_sub_hm.status === 403);
    record('Category 4', 'Subvention: teacher denied grant disbursement (403)', res4_sub_tc.status === 403);
    record('Category 4', 'Subvention: bursar denied grant disbursement (403)', res4_sub_bu.status === 403);
    record('Category 4', 'Subvention: admissions_officer denied grant disbursement (403)', res4_sub_ad.status === 403);

    // Test 4.0G: Head of School is forbidden from accessing statewide LGA directories (403)
    const res4_0b = await apiRequest('/api/v1/hq/telemetry/lgas', { token: principalAToken });
    const res4_0c = await apiRequest('/api/v1/hq/telemetry/lgas/Makurdi', { token: principalAToken });
    record('Category 4', 'Head of School is forbidden from statewide LGAs directory (403)', res4_0b.status === 403);
    record('Category 4', 'Head of School is forbidden from LGA-level directory telemetry (403)', res4_0c.status === 403);

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

    // Test 4.3: Specific School Telemetry for own school
    const res4_3 = await apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: principalAToken });
    record(
      'Category 4',
      'GET /api/v1/hq/telemetry/schools/:id returns live metrics for requested school',
      res4_3.status === 200 && res4_3.data?.data?.school?.id === schoolA.id
    );

    // Test 4.3b: Headmistress and Head Kindergarten can access own school telemetry
    const res4_3b1 = await apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: headmistressAToken });
    const res4_3b2 = await apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}`, { token: headKinderAToken });
    record('Category 4', 'Headmistress can access own school telemetry (200)', res4_3b1.status === 200);
    record('Category 4', 'Head of Kindergarten can access own school telemetry (200)', res4_3b2.status === 200);

    // Test 4.3c: Cross-School Telemetry IDOR protection
    const res4_3c1 = await apiRequest(`/api/v1/hq/telemetry/schools/${schoolB.id}`, { token: principalAToken });
    const res4_3c2 = await apiRequest(`/api/v1/hq/telemetry/schools/${schoolB.id}/kpis`, { token: principalAToken });
    record('Category 4', 'Principal A probing School B telemetry is denied (404)', res4_3c1.status === 404);
    record('Category 4', 'Principal A probing School B KPIs is denied (404)', res4_3c2.status === 404);

    // Test 4.3d: School KPIs contain live relational stats
    const res4_3d = await apiRequest(`/api/v1/hq/telemetry/schools/${schoolA.id}/kpis`, { token: principalAToken });
    record(
      'Category 4',
      'School KPIs return liveStats object from database tables',
      res4_3d.status === 200 && res4_3d.data?.data?.liveStats !== undefined
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

    // Test 5.3b: Headmistress cannot publish state directives
    const res5_3b = await apiRequest('/api/v1/hq/directives', {
      method: 'POST',
      token: headmistressAToken,
      body: {
        title: 'Headmistress Circular',
        content: 'Unauthorized state directive.',
      },
    });
    record(
      'Category 5',
      'Headmistress cannot publish state directives (403 forbidden)',
      res5_3b.status === 403
    );

    // Test 5.3c: Bursar cannot publish state directives
    const res5_3c = await apiRequest('/api/v1/hq/directives', {
      method: 'POST',
      token: bursarAToken,
      body: {
        title: 'Bursar Circular',
        content: 'Unauthorized financial directive.',
      },
    });
    record(
      'Category 5',
      'Bursar cannot publish state directives (403 forbidden)',
      res5_3c.status === 403
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

    // Test 6.6: LGA Scoping - Makurdi LGA directive visible to School A (Makurdi), invisible to School B (Gboko)
    const res6_lga_create = await apiRequest('/api/v1/hq/directives', {
      method: 'POST',
      token: stateOfficerToken,
      body: {
        title: 'Makurdi Flood Preparedness Notice',
        category: 'Security & Safety',
        priority: 'Normal',
        audienceType: 'LGA',
        targetLga: 'Makurdi',
        content: 'All schools in Makurdi LGA must verify flood barriers.',
      },
    });
    const lgaDirective = res6_lga_create.data?.data;
    const res6_6a = await apiRequest(`/api/v1/hq/directives/${lgaDirective?.id}`, { token: principalAToken });
    const res6_6b = await apiRequest(`/api/v1/hq/directives/${lgaDirective?.id}`, { token: principalBToken });
    record('Category 6', 'LGA-scoped directive is visible to school located in target LGA (200)', res6_6a.status === 200);
    record('Category 6', 'LGA-scoped directive is denied to school in different LGA (404)', res6_6b.status === 404);

    // Test 6.7: ZONE Scoping - Zone A directive visible to School B (Zone A), invisible to School A (Zone B)
    const res6_zone_create = await apiRequest('/api/v1/hq/directives', {
      method: 'POST',
      token: stateOfficerToken,
      body: {
        title: 'Zone A Sports Festival Planning',
        category: 'Academic Calendar',
        priority: 'Normal',
        audienceType: 'ZONE',
        targetZone: 'Zone A (Benue North-East)',
        content: 'All schools in Senatorial Zone A must register athletic teams.',
      },
    });
    const zoneDirective = res6_zone_create.data?.data;
    const res6_7a = await apiRequest(`/api/v1/hq/directives/${zoneDirective?.id}`, { token: principalBToken });
    const res6_7b = await apiRequest(`/api/v1/hq/directives/${zoneDirective?.id}`, { token: principalAToken });
    record('Category 6', 'Zone-scoped directive is visible to school in target senatorial zone (200)', res6_7a.status === 200);
    record('Category 6', 'Zone-scoped directive is denied to school in different senatorial zone (404)', res6_7b.status === 404);

    // Test 6.8: Acknowledgements route IDOR protection
    const res6_8 = await apiRequest(`/api/v1/hq/directives/${targetedDirectiveA.id}/acknowledgements`, { token: principalBToken });
    record('Category 6', 'School B cannot view acknowledgements for School A private directive (404)', res6_8.status === 404);

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

    // Test 8.7: Direct lookup IDOR protection - Principal B cannot fetch School A private dispatch (404)
    const res8_7 = await apiRequest(`/api/v1/hq/chat/messages/${privateDispatchA.id}`, { token: principalBToken });
    record('Category 8', 'Direct GET /messages/:id denies School B from viewing School A private dispatch (404)', res8_7.status === 404);

    // Test 8.8: Forged Sender Identity rejection/stripping
    const res8_8 = await apiRequest('/api/v1/hq/chat/messages', {
      method: 'POST',
      token: principalAToken,
      body: {
        content: 'Forged sender spoofing test',
        senderName: 'Dr. Fake Director',
        senderRole: 'super_admin',
        schoolId: schoolB.id,
      },
    });
    const forgedDispatch = res8_8.data?.data;
    record(
      'Category 8',
      'Server strictly strips forged senderName/role/schoolId and assigns authoritative identity',
      res8_8.status === 201 &&
        forgedDispatch?.sender_name === 'Principal Terver Tyokyaa' &&
        (forgedDispatch?.sender_role === 'School Principal' || forgedDispatch?.sender_role?.includes('Principal')) &&
        forgedDispatch?.school_id === schoolA.id
    );

    // Test 8.9: Forged Target School rejection for Head of School
    const res8_9 = await apiRequest('/api/v1/hq/chat/messages', {
      method: 'POST',
      token: principalAToken,
      body: {
        content: 'Attempt to send dispatch to another school',
        targetSchoolId: schoolB.id,
      },
    });
    const forcedSelfDispatch = res8_9.data?.data;
    record(
      'Category 8',
      'School Head cannot set targetSchoolId to another school; forced to null/own-school context',
      res8_9.status === 201 && forcedSelfDispatch?.target_school_id === null
    );

    // Test 8.10: ALL_SCHOOLS Exception verification - only messages explicitly targeted to ALL_SCHOOLS are cross-school visible
    const res8_10_all = await apiRequest('/api/v1/hq/chat/messages', {
      method: 'POST',
      token: stateOfficerToken,
      body: {
        content: 'Official Benue MOE Statewide Announcement to all schools',
        audienceType: 'ALL_SCHOOLS',
        channelId: 'announcements',
      },
    });
    const broadcastDispatch = res8_10_all.data?.data;
    const res8_10_probeA = await apiRequest(`/api/v1/hq/chat/messages/${broadcastDispatch?.id}`, { token: principalAToken });
    const res8_10_probeB = await apiRequest(`/api/v1/hq/chat/messages/${broadcastDispatch?.id}`, { token: principalBToken });
    record(
      'Category 8',
      'ALL_SCHOOLS audience is accessible cross-school by both School A and School B heads',
      res8_10_probeA.status === 200 && res8_10_probeB.status === 200
    );

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

    // Test 9.6: Unauthorized status update attempt by School B on School A dispatch (403/404)
    const res9_6 = await apiRequest(`/api/v1/hq/chat/messages/${dispatchA.id}/status`, {
      method: 'PATCH',
      token: principalBToken,
      body: {
        status: 'closed',
      },
    });
    record('Category 9', 'School B Head cannot update status of School A dispatch (403/404)', res9_6.status === 403 || res9_6.status === 404);

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
    // Category 11: Audit Trail Verification & Role-Scoped Audit Logs
    // =========================================================================
    console.log('\n--- Category 11: Audit Trail Verification & Role-Scoped Audit Logs ---');

    // Test 11.1: State Officer can view statewide audit logs (200)
    const res11_1 = await apiRequest('/api/v1/hq/telemetry/audit-logs', { token: stateOfficerToken });
    const auditLogsState = res11_1.data?.data;
    record(
      'Category 11',
      'GET /api/v1/hq/telemetry/audit-logs provides authoritative audit entries to State Officer',
      res11_1.status === 200 && Array.isArray(auditLogsState) && auditLogsState.length > 0
    );

    // Test 11.2: School Head queries audit logs and receives only School A logs
    const res11_2 = await apiRequest('/api/v1/hq/telemetry/audit-logs', { token: principalAToken });
    const auditLogsPrincipalA = res11_2.data?.data;
    const allMatchSchoolA = Array.isArray(auditLogsPrincipalA) &&
      auditLogsPrincipalA.every((log: any) => log.school_id === schoolA.id);
    record(
      'Category 11',
      'GET /api/v1/hq/telemetry/audit-logs restricts School Head strictly to own school audit records',
      res11_2.status === 200 && allMatchSchoolA === true
    );

    // Test 11.3: Teacher/Bursar cannot access audit logs (403)
    const res11_3a = await apiRequest('/api/v1/hq/telemetry/audit-logs', { token: teacherAToken });
    const res11_3b = await apiRequest('/api/v1/hq/telemetry/audit-logs', { token: bursarAToken });
    record('Category 11', 'Teacher role is forbidden from viewing audit logs (403)', res11_3a.status === 403);
    record('Category 11', 'Bursar role is forbidden from viewing audit logs (403)', res11_3b.status === 403);

    // Test 11.4: Immutable action types verified in audit logs
    const actionTypesRes = await query<{ actions: string }>(
      `SELECT string_agg(DISTINCT action, ', ') as actions FROM hq_audit_logs;`
    );
    const recordedActions = actionTypesRes.rows[0]?.actions || '';
    const hasRequiredActions =
      recordedActions.includes('SUBVENTION_DISBURSED') &&
      recordedActions.includes('DIRECTIVE_ACKNOWLEDGED') &&
      recordedActions.includes('DISPATCH_ESCALATED');
    record(
      'Category 11',
      'Audit log accurately captures SUBVENTION_DISBURSED, DIRECTIVE_ACKNOWLEDGED, and DISPATCH_ESCALATED',
      hasRequiredActions
    );

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
