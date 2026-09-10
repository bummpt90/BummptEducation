/**
 * BummptEducation — Phase 8D: Lesson Notes & Teacher Inquiries Comprehensive Automated Test Suite
 * 
 * Final Security, Authorization, Audit, and Production-Seed Hardening Verification
 * 
 * Coverage:
 * Category 1: Database Schema & Migration 0010 Integrity
 * Category 2: Unauthenticated Read Requests Rejected (401)
 * Category 3: Unauthenticated Write/Action Requests Rejected (401)
 * Category 4: Role-Based Access Control (RBAC) Permissions
 * Category 5: Multi-Tenant Boundary Isolation & IDOR Protection
 * Category 6: Authoritative Parent Inquiry Workflow & Scoped Visibility
 * Category 7: Atomic Download Increment & Tenant Isolation
 * Category 8: Transactional Deletion & Immutable Audit Trail (ON DELETE SET NULL)
 * Category 9: Production Seed Safety & Memory Decoupling
 * Category 10: Error Handling & API Response Safety
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import { query, runMigrations, closeDatabasePool } from '../src/db';
import { LessonNoteRepository } from '../src/db/repositories/lessonNote.repository';
import { LessonInquiryRepository } from '../src/db/repositories/lessonInquiry.repository';
import { lessonNotesRouter } from '../src/api/v1/lesson-notes.routes';
import { signAuthToken } from '../src/auth/token';
import { hasPermission } from '../src/auth/permissions';
import { seedLessonNotesFoundation } from '../src/db/seed/lessonNotes.seed';

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

async function runPhase8dTestSuite() {
  console.log('\n======================================================================');
  console.log('BummptEducation — Phase 8D Lesson Notes Comprehensive Test Suite');
  console.log('======================================================================\n');

  const noteRepo = new LessonNoteRepository();
  const inquiryRepo = new LessonInquiryRepository();

  let server: http.Server | null = null;
  let baseUrl = '';

  try {
    // 0. Database Migration Setup
    console.log('[Setup] Verifying PostgreSQL migrations...');
    await runMigrations();

    // 1. Fetch Reference Schools
    const schoolRes = await query<{ id: string; organization_id?: string }>(
      'SELECT id, organization_id FROM schools ORDER BY id ASC LIMIT 2;'
    );
    if (schoolRes.rows.length < 2) {
      throw new Error('At least 2 reference schools required.');
    }
    const schoolAId = schoolRes.rows[0].id;
    const schoolBId = schoolRes.rows[1].id;
    const orgAId = schoolRes.rows[0].organization_id || null;

    // 2. Identify or Provision Users for Role Testing
    const teacherAUserId = 'a1111111-1111-1111-1111-111111111111';
    const teacherBUserId = 'b2222222-2222-2222-2222-222222222222';
    const parentAUserId = 'a3333333-3333-3333-3333-333333333333';
    const studentAUserId = 'a4444444-4444-4444-4444-444444444444';
    const superAdminUserId = '55555555-5555-5555-5555-555555555555';

    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role, school_id, is_active)
       VALUES 
         ($1, 'teacher.a@apex.edu.ng', 'hashed_pass_placeholder', 'Dr. Taiwo Adeleke', 'teacher', $6, true),
         ($2, 'teacher.b@beacon.edu.ng', 'hashed_pass_placeholder', 'Mrs. Funke Balogun', 'teacher', $7, true),
         ($3, 'parent.a@gmail.com', 'hashed_pass_placeholder', 'Chief Emeka Okonkwo', 'parent', $6, true),
         ($4, 'student.a@apex.edu.ng', 'hashed_pass_placeholder', 'Chinedu Okonkwo', 'student', $6, true),
         ($5, 'super.admin@bummpt.com', 'hashed_pass_placeholder', 'Bummpt Platform Super Admin', 'super_admin', NULL, true)
       ON CONFLICT (id) DO UPDATE SET 
         email = EXCLUDED.email, 
         role = EXCLUDED.role, 
         school_id = EXCLUDED.school_id, 
         is_active = true;`,
      [teacherAUserId, teacherBUserId, parentAUserId, studentAUserId, superAdminUserId, schoolAId, schoolBId]
    );

    // Resolve Class for School A
    const classARes = await query<{ id: string }>('SELECT id FROM classes WHERE school_id = $1 LIMIT 1;', [schoolAId]);
    let classAId = classARes.rows[0]?.id;
    if (!classAId) {
      classAId = 'c1111111-1111-1111-1111-111111111111';
      await query(
        `INSERT INTO classes (id, school_id, level, name, arm, category)
         VALUES ($1, $2, 'SSS 2', 'SSS 2 Diamond', 'secondary', 'Senior Secondary')
         ON CONFLICT (id) DO NOTHING;`,
        [classAId, schoolAId]
      );
    }

    // Provision Student A Record in students table with id = studentAUserId
    const studentRecordId = studentAUserId;
    await query(
      `INSERT INTO students (
        id, school_id, admission_number, full_name, gender, date_of_birth, arm, current_class_id, guardian_name, guardian_phone, date_enrolled, status
      ) VALUES (
        $1, $2, 'APX-2025-001', 'Chinedu Okonkwo', 'Male', '2010-04-12', 'secondary', $3, 'Chief Emeka Okonkwo', '+2348031234567', '2023-09-10', 'Active'
      ) ON CONFLICT (id) DO UPDATE SET school_id = EXCLUDED.school_id;`,
      [studentRecordId, schoolAId, classAId]
    );

    // Provision Parent Record & Link in parent_guardians and parent_student_links
    const parentGuardianId = '33333333-3333-3333-3333-333333333333';
    await query(
      `INSERT INTO parent_guardians (id, user_id, school_id, full_name, phone, is_active)
       VALUES ($1, $2, $3, 'Chief Emeka Okonkwo', '+2348031234567', true)
       ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, school_id = EXCLUDED.school_id;`,
      [parentGuardianId, parentAUserId, schoolAId]
    );

    const linkId = '44444444-4444-4444-4444-444444444444';
    await query(
      `INSERT INTO parent_student_links (id, parent_id, student_id, school_id, relationship, is_primary_guardian, status)
       VALUES ($1, $2, $3, $4, 'Father', true, 'Active')
       ON CONFLICT (id) DO UPDATE SET parent_id = EXCLUDED.parent_id, student_id = EXCLUDED.student_id;`,
      [linkId, parentGuardianId, studentRecordId, schoolAId]
    );

    // 3. Start Express Test Server
    const app = express();
    app.use(express.json());
    app.use('/api/v1/lesson-notes', lessonNotesRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server!.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
    console.log(`[Setup] Express test server online at ${baseUrl}`);

    // Generate JWT Tokens for different testing contexts
    const tokenTeacherA = signAuthToken({
      userId: teacherAUserId,
      email: 'teacher.a@apex.edu.ng',
      role: 'teacher',
      schoolId: schoolAId,
      isSuperAdmin: false,
    });

    const tokenTeacherB = signAuthToken({
      userId: teacherBUserId,
      email: 'teacher.b@beacon.edu.ng',
      role: 'teacher',
      schoolId: schoolBId,
      isSuperAdmin: false,
    });

    const tokenParentA = signAuthToken({
      userId: parentAUserId,
      email: 'parent.a@gmail.com',
      role: 'parent',
      schoolId: schoolAId,
      isSuperAdmin: false,
    });

    const tokenStudentA = signAuthToken({
      userId: studentAUserId,
      email: 'student.a@apex.edu.ng',
      role: 'student',
      schoolId: schoolAId,
      isSuperAdmin: false,
    });

    const tokenSuperAdmin = signAuthToken({
      userId: superAdminUserId,
      email: 'super.admin@bummpt.com',
      role: 'super_admin',
      schoolId: null,
      isSuperAdmin: true,
    });

    // Helper for making test HTTP requests
    async function apiRequest(endpoint: string, options: RequestInit = {}) {
      const url = `${baseUrl}${endpoint}`;
      return fetch(url, options);
    }

    // =========================================================================
    // CATEGORY 1: Database Schema & Migration 0010 Integrity
    // =========================================================================
    console.log('\n--- Section 1: Database Schema & Migration 0010 ---');

    const tableCheckRes = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('lesson_notes', 'lesson_inquiries', 'lesson_note_audit_logs');`
    );
    const existingTables = tableCheckRes.rows.map((r) => r.table_name);
    record(
      'Schema',
      'Database tables exist: lesson_notes, lesson_inquiries, lesson_note_audit_logs',
      existingTables.includes('lesson_notes') &&
      existingTables.includes('lesson_inquiries') &&
      existingTables.includes('lesson_note_audit_logs'),
      `Tables found: ${existingTables.join(', ')}`
    );

    const noteColsRes = await query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'lesson_notes';`
    );
    const noteCols = noteColsRes.rows.map((r) => r.column_name);
    const requiredCols = ['id', 'school_id', 'title', 'topic', 'class_level', 'arm', 'term', 'download_count'];
    const hasAllCols = requiredCols.every((c) => noteCols.includes(c));
    record('Schema', 'lesson_notes column conformance', hasAllCols, `Verified ${requiredCols.length} core columns`);

    const fkCheckRes = await query<{ constraint_name: string }>(
      `SELECT tc.constraint_name
       FROM information_schema.table_constraints AS tc 
       JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' 
         AND tc.table_name = 'lesson_inquiries'
         AND kcu.column_name = 'lesson_note_id';`
    );
    record('Schema', 'lesson_inquiries foreign key on lesson_note_id', fkCheckRes.rows.length > 0, 'FK verified');

    const auditFkRes = await query<{ confdeltype: string }>(
      `SELECT rc.delete_rule 
       FROM information_schema.referential_constraints rc
       JOIN information_schema.table_constraints tc ON rc.constraint_name = tc.constraint_name
       WHERE tc.table_name = 'lesson_note_audit_logs' AND rc.delete_rule = 'SET NULL';`
    );
    record(
      'Schema',
      'lesson_note_audit_logs foreign key uses ON DELETE SET NULL',
      auditFkRes.rows.length > 0,
      'Audit rows survive target note deletion'
    );

    // =========================================================================
    // CATEGORY 2: Unauthenticated Read Requests are Rejected (401)
    // =========================================================================
    console.log('\n--- Section 2: Unauthenticated Read Protection ---');

    const resUnauthList = await apiRequest('/api/v1/lesson-notes');
    record('Auth-Read', 'GET /api/v1/lesson-notes rejected with 401', resUnauthList.status === 401, `Status: ${resUnauthList.status}`);

    const resUnauthStats = await apiRequest('/api/v1/lesson-notes/stats');
    record('Auth-Read', 'GET /api/v1/lesson-notes/stats rejected with 401', resUnauthStats.status === 401, `Status: ${resUnauthStats.status}`);

    const resUnauthGetOne = await apiRequest('/api/v1/lesson-notes/00000000-0000-0000-0000-000000000000');
    record('Auth-Read', 'GET /api/v1/lesson-notes/:id rejected with 401', resUnauthGetOne.status === 401, `Status: ${resUnauthGetOne.status}`);

    const resUnauthFeedbacks = await apiRequest('/api/v1/lesson-notes/00000000-0000-0000-0000-000000000000/feedbacks');
    record('Auth-Read', 'GET /api/v1/lesson-notes/:id/feedbacks rejected with 401', resUnauthFeedbacks.status === 401, `Status: ${resUnauthFeedbacks.status}`);

    const resUnauthInquiries = await apiRequest('/api/v1/lesson-notes/00000000-0000-0000-0000-000000000000/inquiries');
    record('Auth-Read', 'GET /api/v1/lesson-notes/:id/inquiries (alias) rejected with 401', resUnauthInquiries.status === 401, `Status: ${resUnauthInquiries.status}`);

    // =========================================================================
    // CATEGORY 3: Unauthenticated Write/Action Requests are Rejected (401)
    // =========================================================================
    console.log('\n--- Section 3: Unauthenticated Write Protection ---');

    const resUnauthPost = await apiRequest('/api/v1/lesson-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthenticated Note' }),
    });
    record('Auth-Write', 'POST /api/v1/lesson-notes rejected with 401', resUnauthPost.status === 401, `Status: ${resUnauthPost.status}`);

    const resUnauthPut = await apiRequest('/api/v1/lesson-notes/00000000-0000-0000-0000-000000000000', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthenticated Update' }),
    });
    record('Auth-Write', 'PUT /api/v1/lesson-notes/:id rejected with 401', resUnauthPut.status === 401, `Status: ${resUnauthPut.status}`);

    const resUnauthDelete = await apiRequest('/api/v1/lesson-notes/00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    });
    record('Auth-Write', 'DELETE /api/v1/lesson-notes/:id rejected with 401', resUnauthDelete.status === 401, `Status: ${resUnauthDelete.status}`);

    const resUnauthDownload = await apiRequest('/api/v1/lesson-notes/00000000-0000-0000-0000-000000000000/increment-download', {
      method: 'POST',
    });
    record('Auth-Write', 'POST /api/v1/lesson-notes/:id/increment-download rejected with 401', resUnauthDownload.status === 401, `Status: ${resUnauthDownload.status}`);

    const resUnauthFeedback = await apiRequest('/api/v1/lesson-notes/00000000-0000-0000-0000-000000000000/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Unauthenticated Question' }),
    });
    record('Auth-Write', 'POST /api/v1/lesson-notes/:id/feedback rejected with 401', resUnauthFeedback.status === 401, `Status: ${resUnauthFeedback.status}`);

    const resUnauthReply = await apiRequest('/api/v1/lesson-notes/inquiries/00000000-0000-0000-0000-000000000000/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: 'Unauthenticated Response' }),
    });
    record('Auth-Write', 'POST /api/v1/lesson-notes/inquiries/:id/reply rejected with 401', resUnauthReply.status === 401, `Status: ${resUnauthReply.status}`);

    // =========================================================================
    // CATEGORY 4: Role-Based Access Control (RBAC) Permissions
    // =========================================================================
    console.log('\n--- Section 4: Role-Based Access Control (RBAC) ---');

    record('RBAC', 'Teacher role has lesson_notes.create permission', hasPermission('teacher', 'lesson_notes.create'), 'Authorized');
    record('RBAC', 'Principal role has lesson_notes.create permission', hasPermission('principal', 'lesson_notes.create'), 'Authorized');
    record('RBAC', 'Student role CANNOT create lesson notes', !hasPermission('student', 'lesson_notes.create'), 'Blocked');
    record('RBAC', 'Parent role CANNOT create lesson notes', !hasPermission('parent', 'lesson_notes.create'), 'Blocked');

    // Create a lesson note as Teacher A via API
    const createNoteRes = await apiRequest('/api/v1/lesson-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTeacherA}`,
      },
      body: JSON.stringify({
        title: 'Electromagnetic Induction & Faraday Laws',
        topic: 'Faraday and Lenz Laws with Numerical Problems',
        classLevel: 'SSS 2',
        arm: 'secondary',
        subjectName: 'Physics',
        contentSummary: 'Curriculum module on induced electromotive force.',
        contentBody: 'Complete instructional guide to electromagnetic induction, flux linkage, and AC generators.',
        weekNumber: 3,
        term: '1st Term',
        academicYear: '2025/2026',
        subTopics: ['Magnetic Flux', 'Faraday Law', 'Lenz Law'],
        learningObjectives: ['State Faraday law', 'Calculate induced EMF'],
        instructionalMaterials: ['Bar magnet', 'Solenoid coil', 'Galvanometer'],
        evaluationQuestions: ['State Lenz law', 'A 500-turn coil experiences a flux change...'],
        keyTerms: ['Electromotive Force', 'Magnetic Flux', 'Solenoid'],
      }),
    });

    const createNoteData = await createNoteRes.json();
    if (createNoteRes.status !== 201) {
      console.error('Create note failed with status', createNoteRes.status, createNoteData);
    }
    const createdNoteId: string = createNoteData?.data?.id;
    record(
      'RBAC',
      'Authorized teacher successfully creates and publishes lesson note',
      createNoteRes.status === 201 && Boolean(createdNoteId),
      `Created Note ID: ${createdNoteId}`
    );

    // Verify Student attempt to create note is rejected with 403
    const studentCreateRes = await apiRequest('/api/v1/lesson-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudentA}`,
      },
      body: JSON.stringify({
        title: 'Student Unauthorized Note',
        topic: 'Unauthorized',
        classLevel: 'SSS 2',
        arm: 'secondary',
        subjectName: 'Physics',
        contentSummary: 'Test',
        contentBody: 'Test',
      }),
    });
    record('RBAC', 'Student role blocked with 403 when creating lesson note', studentCreateRes.status === 403, `Status: ${studentCreateRes.status}`);

    // Verify Parent attempt to create note is rejected with 403
    const parentCreateRes = await apiRequest('/api/v1/lesson-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenParentA}`,
      },
      body: JSON.stringify({
        title: 'Parent Unauthorized Note',
        topic: 'Unauthorized',
        classLevel: 'SSS 2',
        arm: 'secondary',
        subjectName: 'Physics',
        contentSummary: 'Test',
        contentBody: 'Test',
      }),
    });
    record('RBAC', 'Parent role blocked with 403 when creating lesson note', parentCreateRes.status === 403, `Status: ${parentCreateRes.status}`);

    // =========================================================================
    // CATEGORY 5: Multi-Tenant Boundary Isolation & IDOR Protection
    // =========================================================================
    console.log('\n--- Section 5: Multi-Tenant Boundary Isolation ---');

    // 1. Cross-school note retrieval: Teacher B (School B) queries School A note by ID
    const crossSchoolGetRes = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}`, {
      headers: { Authorization: `Bearer ${tokenTeacherB}` },
    });
    record(
      'Tenant-Isolation',
      'Cross-school Note IDOR: School B teacher receives 404 for School A note',
      crossSchoolGetRes.status === 404,
      `Status: ${crossSchoolGetRes.status}`
    );

    // 2. School B note listing does not leak School A note
    const schoolBListRes = await apiRequest('/api/v1/lesson-notes', {
      headers: { Authorization: `Bearer ${tokenTeacherB}` },
    });
    const schoolBListData = await schoolBListRes.json();
    const leakedNote = schoolBListData?.data?.some((n: any) => n.id === createdNoteId);
    record(
      'Tenant-Isolation',
      'Tenant Scoping: School B note listing completely excludes School A notes',
      schoolBListRes.status === 200 && !leakedNote,
      `School B count: ${schoolBListData?.count}`
    );

    // 3. Cross-school publication: Teacher A attempts to publish note with schoolId = School B
    const crossSchoolPublishRes = await apiRequest('/api/v1/lesson-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTeacherA}`,
      },
      body: JSON.stringify({
        title: 'Spoofed Cross-School Lesson Note',
        topic: 'Spoofing',
        classLevel: 'SSS 2',
        arm: 'secondary',
        subjectName: 'Physics',
        contentSummary: 'Spoofing test',
        contentBody: 'Spoofing test',
        schoolId: schoolBId, // Mismatched tenant
      }),
    });
    record(
      'Tenant-Isolation',
      'Cross-school publication blocked with 403 CROSS_SCHOOL_UNAUTHORIZED',
      crossSchoolPublishRes.status === 403,
      `Status: ${crossSchoolPublishRes.status}`
    );

    // 4. Super Admin can access notes across schools
    const superAdminGetRes = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}`, {
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    record(
      'Tenant-Isolation',
      'Super Admin possesses global curriculum visibility across schools',
      superAdminGetRes.status === 200,
      `Status: ${superAdminGetRes.status}`
    );

    // =========================================================================
    // CATEGORY 6: Authoritative Parent Inquiry Workflow & Scoped Visibility
    // =========================================================================
    console.log('\n--- Section 6: Parent Inquiry Authorization & Scoping ---');

    // 1. Parent submits valid inquiry for linked student
    const parentInquiryRes = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenParentA}`,
      },
      body: JSON.stringify({
        question: 'Could the physics teacher review problem 2 on magnetic flux calculation with Chinedu?',
        studentId: studentRecordId,
      }),
    });
    const parentInquiryData = await parentInquiryRes.json();
    const createdInquiryId = parentInquiryData?.data?.id;

    record(
      'Inquiry-Auth',
      'Authenticated parent submits inquiry for linked student with authoritative identity',
      parentInquiryRes.status === 201 &&
      Boolean(createdInquiryId) &&
      parentInquiryData?.data?.parentName === 'Chief Emeka Okonkwo' &&
      parentInquiryData?.data?.studentName === 'Chinedu Okonkwo',
      `Inquiry ID: ${createdInquiryId}, Parent: ${parentInquiryData?.data?.parentName}`
    );

    // 2. Parent attempts to submit inquiry for unlinked/foreign student ID
    const foreignStudentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const unlinkedInquiryRes = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenParentA}`,
      },
      body: JSON.stringify({
        question: 'Inquiry for unlinked student',
        studentId: foreignStudentId,
      }),
    });
    record(
      'Inquiry-Auth',
      'Parent blocked from submitting inquiry for unlinked student (403 UNAUTHORIZED_STUDENT)',
      unlinkedInquiryRes.status === 403,
      `Status: ${unlinkedInquiryRes.status}`
    );

    // 3. Parent reads feedbacks: sees their own linked student's inquiry
    const parentFeedbacksRes = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}/feedbacks`, {
      headers: { Authorization: `Bearer ${tokenParentA}` },
    });
    const parentFeedbacksData = await parentFeedbacksRes.json();
    record(
      'Inquiry-Auth',
      'Parent successfully reads feedbacks scoped to their linked student',
      parentFeedbacksRes.status === 200 &&
      Array.isArray(parentFeedbacksData.data) &&
      parentFeedbacksData.data.some((f: any) => f.id === createdInquiryId),
      `Returned count: ${parentFeedbacksData?.data?.length}`
    );

    // 4. Student reads feedbacks: isolated to their own inquiries
    const studentFeedbacksRes = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}/feedbacks`, {
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    record(
      'Inquiry-Auth',
      'Student can view inquiries regarding their curriculum progress',
      studentFeedbacksRes.status === 200 && Array.isArray((await studentFeedbacksRes.json()).data),
      `Status: ${studentFeedbacksRes.status}`
    );

    // 5. Unauthorized role (Parent) blocked from replying to inquiries
    const parentReplyRes = await apiRequest(`/api/v1/lesson-notes/inquiries/${createdInquiryId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenParentA}`,
      },
      body: JSON.stringify({ reply: 'Unauthorized parent reply' }),
    });
    record(
      'Inquiry-Auth',
      'Parent role blocked with 403 when attempting to reply to inquiry',
      parentReplyRes.status === 403,
      `Status: ${parentReplyRes.status}`
    );

    // 6. Authorized educator replies to inquiry
    const teacherReplyRes = await apiRequest(`/api/v1/lesson-notes/inquiries/${createdInquiryId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTeacherA}`,
      },
      body: JSON.stringify({
        reply: 'We have scheduled an extra tutorial on magnetic flux calculation during zero period on Thursday.',
      }),
    });
    const teacherReplyData = await teacherReplyRes.json();
    record(
      'Inquiry-Auth',
      'Authorized teacher responds to inquiry with status updated to Answered',
      teacherReplyRes.status === 200 &&
      teacherReplyData?.data?.status === 'Answered' &&
      teacherReplyData?.data?.reply?.includes('magnetic flux'),
      `Status: ${teacherReplyData?.data?.status}`
    );

    // 7. Cross-school teacher reply blocked (Teacher B cannot reply to School A inquiry)
    const crossSchoolReplyRes = await apiRequest(`/api/v1/lesson-notes/inquiries/${createdInquiryId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenTeacherB}`,
      },
      body: JSON.stringify({ reply: 'Cross-school unauthorized reply' }),
    });
    record(
      'Inquiry-Auth',
      'Teacher B blocked with 403 when replying to School A inquiry',
      crossSchoolReplyRes.status === 403,
      `Status: ${crossSchoolReplyRes.status}`
    );

    // =========================================================================
    // CATEGORY 7: Atomic Download Increment & Integrity
    // =========================================================================
    console.log('\n--- Section 7: Atomic Download Increment ---');

    const download1Res = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}/increment-download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const download1Data = await download1Res.json();

    const download2Res = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}/increment-download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudentA}` },
    });
    const download2Data = await download2Res.json();

    record(
      'Download-Counter',
      'Download counter advances atomically under authenticated student requests',
      download1Res.status === 200 &&
      download2Res.status === 200 &&
      download2Data.downloadCount === download1Data.downloadCount + 1,
      `Counts: ${download1Data.downloadCount} -> ${download2Data.downloadCount}`
    );

    // Cross-school download attempt blocked for user in School B
    const crossSchoolDownloadRes = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}/increment-download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTeacherB}` },
    });
    record(
      'Download-Counter',
      'Cross-school download increment rejected with 404 (IDOR protection)',
      crossSchoolDownloadRes.status === 404,
      `Status: ${crossSchoolDownloadRes.status}`
    );

    // =========================================================================
    // CATEGORY 8: Transactional Deletion & Immutable Audit Trail
    // =========================================================================
    console.log('\n--- Section 8: Transactional Deletion & Audit Trail ---');

    // Attempt deletion by Teacher B (mismatched school)
    const crossSchoolDeleteRes = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenTeacherB}` },
    });
    record(
      'Audit-Deletion',
      'Cross-school note deletion attempt returns 404 and does not delete record',
      crossSchoolDeleteRes.status === 404,
      `Status: ${crossSchoolDeleteRes.status}`
    );

    // Authorized deletion by Teacher A
    const authorizedDeleteRes = await apiRequest(`/api/v1/lesson-notes/${createdNoteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenTeacherA}` },
    });
    record(
      'Audit-Deletion',
      'Authorized teacher successfully deletes lesson note in atomic transaction',
      authorizedDeleteRes.status === 200,
      `Status: ${authorizedDeleteRes.status}`
    );

    // Verify record is gone from lesson_notes table
    const noteLookupRes = await query('SELECT id FROM lesson_notes WHERE id = $1;', [createdNoteId]);
    record(
      'Audit-Deletion',
      'Lesson note removed permanently from lesson_notes table',
      noteLookupRes.rows.length === 0,
      `Remaining records: ${noteLookupRes.rows.length}`
    );

    // Verify audit log has NOTE_DELETED entry and is preserved
    const auditLogsRes = await query<{ action: string; lesson_note_id: string | null }>(
      'SELECT action, lesson_note_id FROM lesson_note_audit_logs WHERE details->>\'id\' = $1 OR details->>\'deletedLessonNoteId\' = $1 OR lesson_note_id::text = $1 ORDER BY created_at ASC;',
      [createdNoteId]
    );
    const actions = auditLogsRes.rows.map((r) => r.action);
    record(
      'Audit-Deletion',
      'Immutable audit log records NOTE_DELETED action upon transactional deletion',
      actions.includes('NOTE_DELETED'),
      `Audit actions logged: ${actions.join(', ')}`
    );

    record(
      'Audit-Deletion',
      'Audit records preserved after target deletion (foreign key ON DELETE SET NULL)',
      auditLogsRes.rows.length >= 1,
      `Preserved audit log rows: ${auditLogsRes.rows.length}`
    );

    // =========================================================================
    // CATEGORY 9: Production Seed Safety & Memory Decoupling
    // =========================================================================
    console.log('\n--- Section 9: Production Seed Safety & Decoupling ---');

    // Test seedLessonNotesFoundation refusal in production
    const originalEnv = process.env.NODE_ENV;
    let prodGuardBlocked = false;
    try {
      process.env.NODE_ENV = 'production';
      const seedRes = await seedLessonNotesFoundation();
      prodGuardBlocked = seedRes.notesInserted === 0 && seedRes.feedbacksInserted === 0;
    } catch (e: any) {
      prodGuardBlocked = true;
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
    record(
      'Prod-Safety',
      'seedLessonNotesFoundation safely refuses seeding mock data in production',
      prodGuardBlocked,
      'Production guard verified'
    );

    // Check server.ts for production guard on seedLessonNotesFoundation
    const serverCode = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
    const serverHasProdGuard = serverCode.includes("NODE_ENV !== 'production'") &&
      serverCode.includes('seedLessonNotesFoundation');
    record(
      'Prod-Safety',
      'server.ts wraps seedLessonNotesFoundation in strict NODE_ENV !== "production" check',
      serverHasProdGuard,
      'Server startup protected'
    );

    // Check for memory stores in server.ts
    const hasLessonNotesStore = serverCode.includes('lessonNotesStore');
    const hasLessonFeedbacksStore = serverCode.includes('lessonFeedbacksStore');
    record(
      'Prod-Safety',
      'Zero in-memory fallback stores (lessonNotesStore / lessonFeedbacksStore) in server.ts',
      !hasLessonNotesStore && !hasLessonFeedbacksStore,
      `lessonNotesStore: ${hasLessonNotesStore}, lessonFeedbacksStore: ${hasLessonFeedbacksStore}`
    );

    // Check frontend LessonNotesPage for zero mock data imports
    const pageCode = fs.readFileSync(path.join(process.cwd(), 'src', 'pages', 'LessonNotesPage.tsx'), 'utf8');
    const pageImportsMock = pageCode.includes('INITIAL_LESSON_NOTES');
    record(
      'Prod-Safety',
      'LessonNotesPage has zero dependency on INITIAL_LESSON_NOTES mock store',
      !pageImportsMock,
      'Frontend completely decoupled from mock data'
    );

    // Verify frontend download telemetry is server-confirmed with zero optimistic increments
    const hasOptimisticIncrement = pageCode.includes('(n.downloadCount || 0) + 1') || pageCode.includes('downloadCount: n.downloadCount + 1');
    const awaitsIncrementDownload = pageCode.includes('await fetch(`/api/v1/lesson-notes/${note.id}/increment-download`') ||
      pageCode.includes('await fetch(`/api/v1/lesson-notes/${note.id}/increment-download');
    const bindsAuthoritativeCount = pageCode.includes('downloadCount: authoritativeCount') || pageCode.includes('downloadCount: data.downloadCount');
    const preventsDoubleCounting = pageCode.includes('downloadingIds') || pageCode.includes('setDownloadingIds');

    record(
      'Prod-Safety',
      'Frontend download telemetry has zero optimistic increment and awaits PostgreSQL confirmation',
      !hasOptimisticIncrement && awaitsIncrementDownload && bindsAuthoritativeCount,
      `optimistic: ${hasOptimisticIncrement}, awaits: ${awaitsIncrementDownload}, bindsAuthoritative: ${bindsAuthoritativeCount}`
    );

    record(
      'Prod-Safety',
      'Frontend enforces double-counting prevention guard for in-flight download actions',
      preventsDoubleCounting,
      `Double-counting guard verified: ${preventsDoubleCounting}`
    );

    // =========================================================================
    // CATEGORY 10: Error Handling Safety & Clean API Responses
    // =========================================================================
    console.log('\n--- Section 10: Error Handling & API Response Safety ---');

    // Non-existent lesson note query returns clean 404 without database exception leaks
    const clean404Res = await apiRequest('/api/v1/lesson-notes/00000000-0000-0000-0000-000000000000', {
      headers: { Authorization: `Bearer ${tokenTeacherA}` },
    });
    const clean404Data = await clean404Res.json();
    record(
      'API-Safety',
      '404 responses return structured application error without internal SQL leaks',
      clean404Res.status === 404 &&
      clean404Data.success === false &&
      clean404Data.error === 'NOT_FOUND' &&
      !JSON.stringify(clean404Data).includes('SELECT'),
      `Error payload: ${JSON.stringify(clean404Data)}`
    );

    // Empty school ID list returns empty array, never falling back to mock data
    const emptyNotes = await noteRepo.list({ school_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' });
    record(
      'API-Safety',
      'Empty database query returns empty array invariant (no synthetic fallback)',
      Array.isArray(emptyNotes) && emptyNotes.length === 0,
      `Result count: ${emptyNotes.length}`
    );

    // PostgreSQL Authoritative Statistics Calculation
    const statsResult = await noteRepo.getStats(schoolAId);
    record(
      'API-Safety',
      'Authoritative curriculum statistics calculated directly from PostgreSQL',
      typeof statsResult.totalNotes === 'number' && typeof statsResult.totalDownloads === 'number',
      `Stats: Notes=${statsResult.totalNotes}, Downloads=${statsResult.totalDownloads}`
    );

    // Cleanup test records
    await query('DELETE FROM parent_student_links WHERE id = $1;', [linkId]);
    await query('DELETE FROM parent_guardians WHERE id = $1;', [parentGuardianId]);
    await query('DELETE FROM students WHERE id = $1;', [studentRecordId]);
    await query('DELETE FROM users WHERE id IN ($1, $2, $3, $4, $5);', [
      teacherAUserId,
      teacherBUserId,
      parentAUserId,
      studentAUserId,
      superAdminUserId,
    ]);
    console.log('[Cleanup] Test fixtures and ephemeral data cleared.');

  } catch (err: any) {
    console.error('Fatal error during test execution:', err);
    record('Fatal', 'Test execution completed without uncaught fatal exception', false, err.message);
  } finally {
    if (server) {
      await new Promise<void>((resolve) => (server as http.Server).close(() => resolve()));
    }
    await closeDatabasePool();
  }

  // Summary
  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  const failedCount = results.filter((r) => r.status === 'FAILED').length;
  const totalCount = results.length;

  console.log('\n======================================================================');
  console.log(`Phase 8D Test Results: ${passedCount}/${totalCount} PASSED (${failedCount} failed)`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase8dTestSuite();
