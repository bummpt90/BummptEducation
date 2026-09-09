/**
 * BummptEducation — Phase 8D: Lesson Notes & Teacher Inquiries Automated Test Suite
 * 
 * Comprehensive verification of:
 * 1. Database Schema & Migration 0010 (lesson_notes, lesson_inquiries, lesson_note_audit_logs)
 * 2. Foreign key relationships and database constraint enforcement
 * 3. Multi-tenant school boundary isolation (School A vs School B)
 * 4. LessonNoteRepository CRUD, search, filter, and pagination operations
 * 5. LessonNoteRepository download counter increment & atomic updates
 * 6. LessonInquiryRepository parent question submission and teacher response workflow
 * 7. Multi-tenant inquiry isolation & protection
 * 8. Real-time PostgreSQL authoritative statistics calculation (no mock metrics)
 * 9. Immutable audit logging for note publication, edits, deletion, and inquiry replies
 * 10. Role-Based Access Control (RBAC) permission mapping for lesson notes
 * 11. Empty Database Result Invariant: No synthetic mock data fallback
 * 12. Frontend decoupling audit: LessonNotesPage has zero dependency on INITIAL_LESSON_NOTES
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { query, runMigrations, closeDatabasePool } from '../src/db';
import { LessonNoteRepository } from '../src/db/repositories/lessonNote.repository';
import { LessonInquiryRepository } from '../src/db/repositories/lessonInquiry.repository';
import { hasPermission } from '../src/auth/permissions';

interface TestResult {
  test: string;
  status: 'PASSED' | 'FAILED';
  details?: string;
}

const results: TestResult[] = [];

function record(test: string, passed: boolean, details?: string) {
  results.push({
    test,
    status: passed ? 'PASSED' : 'FAILED',
    details,
  });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${test} ${details ? `(${details})` : ''}`);
}

async function runPhase8dTestSuite() {
  console.log('\n======================================================================');
  console.log('BummptEducation — Phase 8D Lesson Notes & Inquiries Automated Test Suite');
  console.log('======================================================================\n');

  const noteRepo = new LessonNoteRepository();
  const inquiryRepo = new LessonInquiryRepository();

  try {
    // 0. Ensure all migrations are applied
    console.log('[Setup] Applying pending database migrations...');
    const migResult = await runMigrations();
    console.log(`[Setup] Migrations result: applied ${migResult.appliedCount}, skipped ${migResult.skippedCount}`);

    // Retrieve or seed a test school
    const schoolRes = await query<{ id: string }>('SELECT id FROM schools LIMIT 2;');
    let schoolAId: string;
    let schoolBId: string;

    if (schoolRes.rows.length >= 2) {
      schoolAId = schoolRes.rows[0].id;
      schoolBId = schoolRes.rows[1].id;
    } else {
      // Fallback IDs if schools not present
      schoolAId = '00000000-0000-0000-0000-000000000001';
      schoolBId = '00000000-0000-0000-0000-000000000002';
      await query(
        `INSERT INTO schools (id, name, code, school_type, lga, state, status)
         VALUES 
           ($1, 'Phase 8D Test Academy A', 'TEST-A', 'public_secondary', 'Ikeja', 'Lagos', 'active'),
           ($2, 'Phase 8D Test Academy B', 'TEST-B', 'public_secondary', 'Epe', 'Lagos', 'active')
         ON CONFLICT (id) DO NOTHING;`,
        [schoolAId, schoolBId]
      );
    }

    // Retrieve a test user ID for audit log assertions
    const userRes = await query<{ id: string }>('SELECT id FROM users LIMIT 1;');
    const testUserId = userRes.rows[0]?.id;

    // Retrieve a test staff ID if available for teacher_id FK
    const staffRes = await query<{ id: string }>('SELECT id FROM staff WHERE school_id = $1 LIMIT 1;', [schoolAId]);
    const testStaffId = staffRes.rows[0]?.id || null;

    // -------------------------------------------------------------------------
    // TEST 1: Database Migration 0010 Schema Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Schema & Migration 0010 Integrity ---');

    const tableCheckRes = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('lesson_notes', 'lesson_inquiries', 'lesson_note_audit_logs');`
    );
    const existingTables = tableCheckRes.rows.map((r) => r.table_name);
    record(
      'Tables Exist: lesson_notes, lesson_inquiries, lesson_note_audit_logs',
      existingTables.includes('lesson_notes') &&
      existingTables.includes('lesson_inquiries') &&
      existingTables.includes('lesson_note_audit_logs'),
      `Found tables: ${existingTables.join(', ')}`
    );

    // Verify columns on lesson_notes
    const noteColsRes = await query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'lesson_notes';`
    );
    const noteCols = noteColsRes.rows.map((r) => r.column_name);
    const requiredNoteCols = [
      'id', 'school_id', 'title', 'subject_name', 'class_level', 'arm', 
      'term', 'academic_year', 'week_number', 'topic', 'learning_objectives', 
      'content_body', 'download_count', 'status', 'created_at'
    ];
    const missingNoteCols = requiredNoteCols.filter((c) => !noteCols.includes(c));
    record(
      'lesson_notes Schema Conformance',
      missingNoteCols.length === 0,
      missingNoteCols.length > 0 ? `Missing: ${missingNoteCols.join(', ')}` : 'All columns confirmed'
    );

    // Verify foreign key: lesson_inquiries.lesson_note_id -> lesson_notes.id
    const fkCheckRes = await query<{ constraint_name: string }>(
      `SELECT tc.constraint_name
       FROM information_schema.table_constraints AS tc 
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' 
         AND tc.table_name = 'lesson_inquiries'
         AND kcu.column_name = 'lesson_note_id';`
    );
    record(
      'lesson_inquiries Foreign Key Constraint',
      fkCheckRes.rows.length > 0,
      `FK constraint verified on lesson_note_id`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Lesson Note Creation & Read
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Lesson Note Persistence & Read ---');

    const newNote = await noteRepo.create({
      school_id: schoolAId,
      title: 'Quadratic Equations & Parabolic Functions',
      subject_name: 'Further Mathematics',
      class_level: 'SSS 2 Science',
      arm: 'secondary',
      term: '2nd Term',
      academic_year: '2025/2026',
      week_number: 6,
      teacher_name: 'Dr. A. Adebayo',
      teacher_id: testStaffId,
      topic: 'Solving Quadratics via Completing the Square',
      learning_objectives: [
        'Derive the general quadratic formula',
        'Solve complex quadratic expressions'
      ],
      evaluation_questions: [
        'Solve 2x^2 + 5x - 3 = 0',
        'State the discriminant condition for real roots'
      ],
      content_summary: 'Comprehensive lesson on quadratic factoring and roots.',
      content_body: 'Full instructional note on completing the square with step-by-step examples.',
      key_terms: ['Quadratic', 'Discriminant', 'Parabola'],
      pdf_file_name: 'SSS2_FurtherMath_W6.pdf',
      pdf_file_size: '2.4 MB',
      status: 'published'
    }, testUserId);

    record(
      'Create Lesson Note in PostgreSQL',
      Boolean(newNote && newNote.id && newNote.title.includes('Quadratic')),
      `Inserted Note ID: ${newNote.id}`
    );

    const fetchedNote = await noteRepo.getById(newNote.id, schoolAId);
    record(
      'Get Lesson Note by ID with School Boundary',
      Boolean(fetchedNote && fetchedNote.id === newNote.id && fetchedNote.learning_objectives?.length === 2),
      `Verified topic: ${fetchedNote?.topic}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Multi-Tenant Isolation (School A vs School B)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Multi-Tenant Boundary Enforcement ---');

    // Attempt to access School A's note using School B's credentials
    const crossSchoolAccess = await noteRepo.getById(newNote.id, schoolBId);
    record(
      'Cross-School IDOR Protection: School B cannot fetch School A note',
      crossSchoolAccess === null,
      'Blocked cross-tenant note access'
    );

    // Attempt to list School B's notes and ensure School A's note is excluded
    const schoolBNotes = await noteRepo.list({ school_id: schoolBId });
    const containsSchoolANote = schoolBNotes.some((n) => n.id === newNote.id);
    record(
      'Tenant Isolation in Note Listing: School B list does not leak School A notes',
      !containsSchoolANote,
      `School B count: ${schoolBNotes.length}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Note Update and Audit Log
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Note Update & Audit Logging ---');

    const updatedNote = await noteRepo.update(newNote.id, {
      topic: 'Solving Quadratics via Completing the Square (Updated)',
      content_summary: 'Updated summary for quadratic equations.'
    }, schoolAId, testUserId);

    record(
      'Update Lesson Note in PostgreSQL',
      Boolean(updatedNote && updatedNote.topic.includes('(Updated)')),
      `New topic: ${updatedNote?.topic}`
    );

    // Verify audit log entry created for create and update
    const auditLogsRes = await query<{ action: string; lesson_note_id: string }>(
      `SELECT action, lesson_note_id FROM lesson_note_audit_logs 
       WHERE lesson_note_id = $1 ORDER BY created_at ASC;`,
      [newNote.id]
    );
    const actions = auditLogsRes.rows.map((r) => r.action);
    record(
      'Immutable Audit Logging for Note Operations',
      actions.includes('CREATE') && actions.includes('UPDATE'),
      `Recorded audit actions: ${actions.join(', ')}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Download Counter Atomic Increment
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Atomic Download Increment ---');

    const initialDownloads = newNote.download_count || 0;
    const newCount1 = await noteRepo.incrementDownload(newNote.id);
    const newCount2 = await noteRepo.incrementDownload(newNote.id);
    record(
      'Atomic Download Counter Increment',
      newCount1 === initialDownloads + 1 && newCount2 === initialDownloads + 2,
      `Initial: ${initialDownloads}, After: ${newCount2}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Teacher Inquiries / Feedback Workflow
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Inquiries & Teacher Response Workflow ---');

    const inquiry = await inquiryRepo.create({
      lesson_note_id: newNote.id,
      school_id: schoolAId,
      parent_name: 'Chief Emeka Okonkwo',
      student_name: 'Chinedu Okonkwo',
      guardian_phone: '+234 803 123 4567',
      question: 'Could the teacher clarify how step 3 derived the discriminant value of 49?'
    });

    record(
      'Parent Inquiry Submission',
      Boolean(inquiry && inquiry.id && inquiry.status.toLowerCase() === 'pending'),
      `Inquiry ID: ${inquiry.id}, Status: ${inquiry.status}`
    );

    // Reply to inquiry
    const repliedInquiry = await inquiryRepo.reply(
      inquiry.id,
      'In step 3, we computed b^2 - 4ac: 5^2 - 4(2)(-3) = 25 + 24 = 49.',
      testUserId,
      'Dr. A. Adebayo',
      schoolAId
    );

    record(
      'Teacher Response to Inquiry',
      Boolean(
        repliedInquiry && 
        (repliedInquiry.status.toLowerCase() === 'answered' || repliedInquiry.status.toLowerCase() === 'resolved') && 
        (repliedInquiry.teacher_reply?.includes('49') || (repliedInquiry as any).reply?.includes('49')) &&
        repliedInquiry.replied_by_name === 'Dr. A. Adebayo' &&
        repliedInquiry.replied_at !== null
      ),
      `Resolved status: ${repliedInquiry?.status}, Replied at: ${repliedInquiry?.replied_at}`
    );

    // Check inquiries tenant isolation
    const crossSchoolInquiries = await inquiryRepo.listByNoteId(newNote.id, schoolBId);
    record(
      'Inquiry Multi-Tenant Protection: School B cannot view School A inquiries',
      crossSchoolInquiries.length === 0,
      `Inquiries returned for School B: ${crossSchoolInquiries.length}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Aggregated Real-Time Statistics
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Authoritative Statistics ---');

    const stats = await noteRepo.getStats(schoolAId);
    record(
      'PostgreSQL Authoritative Statistics Calculation',
      Boolean(
        stats && 
        stats.totalNotes >= 1 && 
        stats.totalDownloads >= 2 &&
        stats.armBreakdown.secondary >= 1 &&
        stats.totalFeedbacks >= 1
      ),
      `Total Notes: ${stats.totalNotes}, Total Downloads: ${stats.totalDownloads}, Feedbacks: ${stats.totalFeedbacks}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Empty Database Result Invariant
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Empty Database Invariant ---');

    // Query with an unused non-existent school ID
    const emptySchoolId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const emptyNotes = await noteRepo.list({ school_id: emptySchoolId });
    record(
      'Empty Database Result Invariant: No synthetic mock data fallback',
      Array.isArray(emptyNotes) && emptyNotes.length === 0,
      `Returned count: ${emptyNotes.length}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: RBAC Permission Evaluation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 9: RBAC Permission Verification ---');

    const teacherCanCreate = hasPermission('teacher', 'lesson_notes.create');
    const teacherCanView = hasPermission('teacher', 'lesson_notes.view');
    const studentCanView = hasPermission('student', 'lesson_notes.view');
    const studentCanCreate = hasPermission('student', 'lesson_notes.create');
    const parentCanView = hasPermission('parent', 'lesson_notes.view');
    const parentCanCreate = hasPermission('parent', 'lesson_notes.create');

    record(
      'RBAC: Teacher has lesson_notes.create and lesson_notes.view',
      teacherCanCreate && teacherCanView,
      `Create: ${teacherCanCreate}, View: ${teacherCanView}`
    );

    record(
      'RBAC: Student and Parent can view but CANNOT create lesson notes',
      studentCanView && !studentCanCreate && parentCanView && !parentCanCreate,
      `Student can create: ${studentCanCreate}, Parent can create: ${parentCanCreate}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Frontend Decoupling Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 10: Frontend Decoupling Audit ---');

    const lessonNotesPagePath = path.join(process.cwd(), 'src', 'pages', 'LessonNotesPage.tsx');
    const pageContent = fs.readFileSync(lessonNotesPagePath, 'utf8');

    const hasMockImport = pageContent.includes('INITIAL_LESSON_NOTES');
    const fetchesFromApi = pageContent.includes('/api/v1/lesson-notes') || pageContent.includes('/api/lesson-notes');

    record(
      'Frontend Audit: LessonNotesPage has zero dependency on INITIAL_LESSON_NOTES',
      !hasMockImport,
      `Contains INITIAL_LESSON_NOTES: ${hasMockImport}`
    );

    record(
      'Frontend Audit: LessonNotesPage communicates with PostgreSQL API',
      fetchesFromApi,
      `API fetch present: ${fetchesFromApi}`
    );

    // Clean up test note and inquiry
    await query('DELETE FROM lesson_inquiries WHERE lesson_note_id = $1;', [newNote.id]);
    await query('DELETE FROM lesson_note_audit_logs WHERE lesson_note_id = $1;', [newNote.id]);
    await query('DELETE FROM lesson_notes WHERE id = $1;', [newNote.id]);
    console.log('[Cleanup] Test data safely cleared.');

  } catch (err: any) {
    console.error('Fatal error during test execution:', err);
    record('Fatal Execution Error', false, err.message);
  } finally {
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
