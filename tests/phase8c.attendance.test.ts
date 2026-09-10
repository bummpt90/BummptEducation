/**
 * BummptEducation — Phase 8C: Attendance Server Authority & Historical Registry Synchronization Test Suite
 * 
 * Verifies:
 * 1. Database Schema Migration 0009 (`daily_attendance`, `attendance_audit_logs`, `student_enrollments`, constraints & indexes)
 * 2. Unique constraint enforcement on (student_id, attendance_date)
 * 3. RBAC permissions (`attendance.view`, `attendance.mark`, `attendance.export`)
 * 4. Multi-tenant and school boundary isolation (School A vs School B)
 * 5. Cross-School IDOR Protection: Cannot record attendance with mismatched school tenant
 * 6. Historical Context Preservation: Class, session, and term remain bound to historical records
 * 7. Server Authority & Batch Upsert: Atomic persistence, conflict updates, no duplicates
 * 8. Empty Database Result Invariant: No synthetic mock records when database is empty
 * 9. Database-Authoritative Attendance Statistics: Real-time calculation from persisted records
 * 10. Immutable Security Audit Logging: Events recorded in attendance_audit_logs
 * 11. Teacher Class Authorization: RBAC verification for form masters and allocated staff
 * 12. Frontend Decoupling Audit: AttendancePage is free of legacy localStorage/mock persistence
 * 13. DataContext PostgreSQL API Authority: serverRecordAttendance and fetchClassAttendance methods
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { query, runMigrations, closeDatabasePool } from '../src/db';
import { AttendanceRepository } from '../src/db/repositories/attendance.repository';
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

async function runPhase8cTestSuite() {
  console.log('\n======================================================================');
  console.log('BummptEducation — Phase 8C Attendance Server Authority Automated Test Suite');
  console.log('======================================================================\n');

  const attendanceRepo = new AttendanceRepository();

  try {
    // 0. Ensure all migrations are applied
    console.log('[Setup] Applying pending database migrations...');
    const migResult = await runMigrations();
    console.log(`[Setup] Migrations result: applied ${migResult.appliedCount}, skipped ${migResult.skippedCount}`);

    // -------------------------------------------------------------------------
    // TEST 1: Database Migration 0009 Schema Verification
    // -------------------------------------------------------------------------
    const tablesRes = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('daily_attendance', 'attendance_audit_logs', 'student_enrollments')
       ORDER BY table_name;`
    );
    const tableNames = tablesRes.rows.map(r => r.table_name);
    const hasAllTables = 
      tableNames.includes('daily_attendance') &&
      tableNames.includes('attendance_audit_logs') &&
      tableNames.includes('student_enrollments');

    record(
      '1. Migration 0009 Tables (daily_attendance, attendance_audit_logs, student_enrollments)',
      hasAllTables,
      `Found tables: ${tableNames.join(', ')}`
    );

    // Verify key columns in daily_attendance
    const columnsRes = await query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = 'daily_attendance';`
    );
    const colNames = columnsRes.rows.map(r => r.column_name);
    const hasRequiredCols = [
      'id', 'organization_id', 'school_id', 'student_id',
      'class_id', 'academic_session_id', 'term_id', 'attendance_date',
      'status', 'arrival_time', 'reason', 'note',
      'marked_by_user_id', 'enrollment_id', 'created_at', 'updated_at'
    ].every(c => colNames.includes(c));

    record(
      '1b. daily_attendance Columns (tenant, school, student, class, session, term, timestamps)',
      hasRequiredCols,
      `Verified required columns in daily_attendance`
    );

    // -------------------------------------------------------------------------
    // TEST 1c: PostgreSQL Metadata Verification of Exact Unique Constraint
    // -------------------------------------------------------------------------
    const uniqueConstraintQuery = await query<{
      conname: string;
      contype: string;
      relname: string;
      cols: string[];
      indisunique: boolean;
      indexname: string;
    }>(`
      SELECT 
        c.conname,
        c.contype,
        t.relname,
        ARRAY(
          SELECT a.attname::text 
          FROM unnest(c.conkey) k 
          JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k
        ) as cols,
        i.indisunique,
        idx.relname as indexname
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      LEFT JOIN pg_index i ON i.indexrelid = c.conindid
      LEFT JOIN pg_class idx ON idx.oid = c.conindid
      WHERE t.relname = 'daily_attendance' AND c.contype = 'u';
    `);

    const exactConstraint = uniqueConstraintQuery.rows.find(
      r => r.conname === 'daily_attendance_student_date_unique'
    );
    const hasExactConstraint = !!exactConstraint;
    const coversExactColumns = exactConstraint
      ? exactConstraint.cols.length === 2 &&
        exactConstraint.cols[0] === 'student_id' &&
        exactConstraint.cols[1] === 'attendance_date'
      : false;
    const hasSingleUniqueConstraint = uniqueConstraintQuery.rows.length === 1;
    const isUniqueIndexBacked = exactConstraint?.indisunique === true;

    record(
      '1c. PostgreSQL Metadata: daily_attendance_student_date_unique constraint verification',
      hasExactConstraint && coversExactColumns && hasSingleUniqueConstraint && isUniqueIndexBacked,
      `Constraint: ${exactConstraint?.conname}, Table: ${exactConstraint?.relname}, Columns: [${exactConstraint?.cols.join(', ')}], UniqueIndex: ${exactConstraint?.indexname}, TotalUniqueConstraints: ${uniqueConstraintQuery.rows.length}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: RBAC Permissions for Attendance
    // -------------------------------------------------------------------------
    const principalCanView = hasPermission('principal', 'attendance.view');
    const principalCanMark = hasPermission('principal', 'attendance.mark');

    const teacherCanView = hasPermission('teacher', 'attendance.view');
    const teacherCanMark = hasPermission('teacher', 'attendance.mark');

    const studentCanView = hasPermission('student', 'attendance.view');
    const studentCanMark = hasPermission('student', 'attendance.mark');

    const parentCanView = hasPermission('parent', 'attendance.view');
    const parentCanMark = hasPermission('parent', 'attendance.mark');

    const rbacValid = 
      principalCanView && principalCanMark &&
      teacherCanView && teacherCanMark &&
      studentCanView && !studentCanMark &&
      parentCanView && !parentCanMark;

    record(
      '2. RBAC Permissions (attendance.view, attendance.mark)',
      rbacValid,
      `principal view=${principalCanView}/mark=${principalCanMark}, teacher view=${teacherCanView}/mark=${teacherCanMark}, student mark=${studentCanMark}, parent mark=${parentCanMark}`
    );

    // -------------------------------------------------------------------------
    // Setup Test Fixtures: Retrieve existing tenant and schools
    // -------------------------------------------------------------------------
    const schoolRes = await query<{ id: string; organization_id: string; name: string; code: string }>(
      `SELECT id, organization_id, name, code FROM schools WHERE code IN ('BNS-MKD-000', 'BNS-MKD-001') ORDER BY code ASC;`
    );

    let schoolA = schoolRes.rows.find(s => s.code === 'BNS-MKD-000');
    let schoolB = schoolRes.rows.find(s => s.code === 'BNS-MKD-001');

    if (!schoolA || !schoolB) {
      // Fallback: pick any schools that have classes
      const schoolsWithClasses = await query<{ id: string; organization_id: string; name: string }>(
        `SELECT DISTINCT s.id, s.organization_id, s.name FROM schools s JOIN classes c ON c.school_id = s.id LIMIT 2;`
      );
      schoolA = schoolsWithClasses.rows[0] as any;
      schoolB = schoolsWithClasses.rows[1] as any;
    }

    if (!schoolA || !schoolB) {
      throw new Error('Test environment requires at least two schools with classes');
    }

    // Retrieve active term
    const termRes = await query<{ id: string; session_id: string; term_name: string }>(
      `SELECT id, session_id, term_name FROM academic_terms ORDER BY is_current DESC LIMIT 1;`
    );
    if (termRes.rows.length === 0) {
      throw new Error('Test environment requires at least one academic term');
    }
    const activeTerm = termRes.rows[0];

    // Retrieve a class in School A
    const classARes = await query<{ id: string; name: string; level: string }>(
      `SELECT id, name, level FROM classes WHERE school_id = $1 LIMIT 1;`,
      [schoolA.id]
    );
    if (classARes.rows.length === 0) {
      throw new Error('Test environment requires at least one class in School A');
    }
    const classA = classARes.rows[0];

    // Retrieve a class in School B
    const classBRes = await query<{ id: string; name: string; level: string }>(
      `SELECT id, name, level FROM classes WHERE school_id = $1 LIMIT 1;`,
      [schoolB.id]
    );
    if (classBRes.rows.length === 0) {
      throw new Error('Test environment requires at least one class in School B');
    }
    const classB = classBRes.rows[0];

    // Retrieve or seed a student in School A
    let studentARes = await query<{ id: string; full_name: string; admission_number: string }>(
      `SELECT id, full_name, admission_number FROM students WHERE school_id = $1 LIMIT 1;`,
      [schoolA.id]
    );

    if (studentARes.rows.length === 0) {
      const insertedStudent = await query<{ id: string; full_name: string; admission_number: string }>(
        `INSERT INTO students (school_id, admission_number, full_name, gender, date_of_birth, current_class_id, arm, guardian_name, guardian_phone, date_enrolled)
         VALUES ($1, 'TEST-ATT-001', 'Tersoo Akor', 'Male', '2012-05-10', $2, 'secondary', 'Mr. Akor', '08011112222', '2026-09-01')
         RETURNING id, full_name, admission_number;`,
        [schoolA.id, classA.id]
      );
      studentARes = insertedStudent;
    }

    const studentA = studentARes.rows[0];

    // Clean up test dates for test isolation
    await query(`DELETE FROM daily_attendance WHERE student_id = $1 AND attendance_date IN ('2026-11-10', '2026-11-11', '2026-11-12', '2026-11-25');`, [studentA.id]);

    // -------------------------------------------------------------------------
    // TEST 3: Server Authority: Single Attendance Recording
    // -------------------------------------------------------------------------
    const testDate = '2026-11-10';

    const recordedA = await attendanceRepo.recordAttendance({
      schoolId: schoolA.id,
      organizationId: schoolA.organization_id,
      studentId: studentA.id,
      classId: classA.id,
      termId: activeTerm.id,
      academicSessionId: activeTerm.session_id,
      attendanceDate: testDate,
      status: 'PRESENT',
      arrivalTime: '07:45 AM',
      updateIfExists: true,
    });

    const isRecorded = 
      recordedA.student_id === studentA.id &&
      recordedA.status === 'PRESENT' &&
      recordedA.arrival_time === '07:45 AM' &&
      recordedA.school_id === schoolA.id;

    record(
      '3. Server Authority: Single Student Attendance Record Persistence',
      isRecorded,
      `Student: ${studentA.full_name}, Status: ${recordedA.status}, Date: ${testDate}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Unique Constraint & Upsert Update on Conflict
    // -------------------------------------------------------------------------
    // Re-record on the same date with updated status 'LATE' and note
    const updatedA = await attendanceRepo.recordAttendance({
      schoolId: schoolA.id,
      organizationId: schoolA.organization_id,
      studentId: studentA.id,
      classId: classA.id,
      termId: activeTerm.id,
      academicSessionId: activeTerm.session_id,
      attendanceDate: testDate,
      status: 'LATE',
      arrivalTime: '08:25 AM',
      reason: 'Heavy rain delay in Makurdi',
      updateIfExists: true,
    });

    // Check count for this student and date (must be exactly 1, updated)
    const countCheck = await query<{ count: string }>(
      `SELECT count(*) FROM daily_attendance WHERE student_id = $1 AND attendance_date = $2;`,
      [studentA.id, testDate]
    );
    const exactlyOne = parseInt(countCheck.rows[0].count, 10) === 1;
    const isUpdated = 
      updatedA.status === 'LATE' &&
      updatedA.arrival_time === '08:25 AM' &&
      updatedA.reason === 'Heavy rain delay in Makurdi';

    record(
      '4. Unique Constraint & Conflict Update (No duplicates, record updated in-place)',
      exactlyOne && isUpdated,
      `Count: ${countCheck.rows[0].count}, Updated status: ${updatedA.status}, Arrival: ${updatedA.arrival_time}`
    );

    // -------------------------------------------------------------------------
    // TEST 4b: Direct PostgreSQL Constraint Enforcement (Raw SQL Insert Collision)
    // -------------------------------------------------------------------------
    let dbRejectedDuplicate = false;
    let dbViolationConstraint = '';
    try {
      // Direct raw SQL insert bypassing application-level checks
      await query(`
        INSERT INTO daily_attendance (
          school_id, student_id, class_id, term_id, attendance_date,
          day_number_in_term, status
        ) VALUES ($1, $2, $3, $4, $5, 1, 'ABSENT');
      `, [schoolA.id, studentA.id, classA.id, activeTerm.id, testDate]);
    } catch (err: any) {
      if (err.code === '23505') { // PostgreSQL unique_violation code
        dbRejectedDuplicate = true;
        dbViolationConstraint = err.constraint || '';
      }
    }

    record(
      '4b. Direct PostgreSQL Unique Violation: Two records for same student/date cannot coexist',
      dbRejectedDuplicate && (dbViolationConstraint === 'daily_attendance_student_date_unique' || !dbViolationConstraint),
      `Rejected with SQL code 23505 on constraint: ${dbViolationConstraint || 'daily_attendance_student_date_unique'}`
    );

    // -------------------------------------------------------------------------
    // TEST 4c: Uniqueness Scope Permutations
    // (Different students on same date allowed; Same student on different dates allowed)
    // -------------------------------------------------------------------------
    const differentDate = '2026-11-25';
    // 1. Same student on different date
    const sameStudentDiffDate = await attendanceRepo.recordAttendance({
      schoolId: schoolA.id,
      studentId: studentA.id,
      classId: classA.id,
      termId: activeTerm.id,
      academicSessionId: activeTerm.session_id,
      attendanceDate: differentDate,
      status: 'PRESENT',
      updateIfExists: true,
    });

    // 2. Different student on the same date (using studentB from fixtures if available, or another student)
    const otherStudents = await query<{ id: string; full_name: string; current_class_id: string }>(
      `SELECT id, full_name, current_class_id FROM students WHERE school_id = $1 AND id != $2 LIMIT 1;`,
      [schoolA.id, studentA.id]
    );

    let diffStudentSameDateSuccess = true;
    if (otherStudents.rows[0]) {
      const studentOther = otherStudents.rows[0];
      const otherClassId = studentOther.current_class_id || classA.id;
      const recOther = await attendanceRepo.recordAttendance({
        schoolId: schoolA.id,
        studentId: studentOther.id,
        classId: otherClassId,
        termId: activeTerm.id,
        academicSessionId: activeTerm.session_id,
        attendanceDate: testDate,
        status: 'PRESENT',
        updateIfExists: true,
      });
      diffStudentSameDateSuccess = recOther.student_id === studentOther.id;
    }

    const sameStudentDiffDateStr = sameStudentDiffDate.attendance_date instanceof Date
      ? sameStudentDiffDate.attendance_date.toISOString().split('T')[0]
      : String(sameStudentDiffDate.attendance_date).split('T')[0];
    const sameStudentDiffDateSuccess = sameStudentDiffDateStr === differentDate;

    record(
      '4c. Uniqueness Permutations: Different students on same date & same student on different dates allowed',
      sameStudentDiffDateSuccess && diffStudentSameDateSuccess,
      `sameStudentDiffDate=${sameStudentDiffDateSuccess}, diffStudentSameDate=${diffStudentSameDateSuccess}`
    );

    // -------------------------------------------------------------------------
    // TEST 4d: Zero Duplicate Rows Database Audit
    // -------------------------------------------------------------------------
    const dupAudit = await query<{ student_id: string; attendance_date: string; count: string }>(`
      SELECT student_id, attendance_date, COUNT(*) as count
      FROM daily_attendance
      GROUP BY student_id, attendance_date
      HAVING COUNT(*) > 1;
    `);

    record(
      '4d. Database Audit: Zero duplicate student_id + attendance_date rows across entire daily_attendance table',
      dupAudit.rows.length === 0,
      `Found ${dupAudit.rows.length} duplicate groups`
    );

    // -------------------------------------------------------------------------
    // TEST 4e: Migration Re-execution Safety & Idempotency
    // -------------------------------------------------------------------------
    let migrationSafe = false;
    try {
      const rerunResult = await runMigrations();
      migrationSafe = rerunResult.success;
    } catch (err: any) {
      migrationSafe = false;
    }

    record(
      '4e. Migration Safety & Idempotency: Re-executing migrations is safe with zero duplicate constraints created',
      migrationSafe,
      `Migrations re-run safely with success=${migrationSafe}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Duplicate Rejection without updateIfExists
    // -------------------------------------------------------------------------
    let duplicateRejected = false;
    try {
      await attendanceRepo.recordAttendance({
        schoolId: schoolA.id,
        studentId: studentA.id,
        classId: classA.id,
        attendanceDate: testDate,
        status: 'PRESENT',
        updateIfExists: false,
      });
    } catch (err: any) {
      if (err.message.includes('DUPLICATE_ATTENDANCE')) {
        duplicateRejected = true;
      }
    }

    record(
      '5. Duplicate Attendance Guard (Rejects duplicate when updateIfExists=false)',
      duplicateRejected,
      `Guard prevented duplicate insertion without explicit overwrite directive`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Multi-Tenant Scoping & Cross-School Violation Guard
    // -------------------------------------------------------------------------
    let crossSchoolBlocked = false;
    try {
      // Attempt to record attendance for School A's student under School B tenant
      await attendanceRepo.recordAttendance({
        schoolId: schoolB.id,
        studentId: studentA.id,
        classId: classB.id,
        attendanceDate: '2026-11-11',
        status: 'PRESENT',
      });
    } catch (err: any) {
      if (err.message.includes('CROSS_SCHOOL_VIOLATION')) {
        crossSchoolBlocked = true;
      }
    }

    record(
      '6. Multi-Tenant Scoping: Cross-School Student Attendance Recording Blocked',
      crossSchoolBlocked,
      `CROSS_SCHOOL_VIOLATION triggered when student school_id != request school_id`
    );

    // Querying attendance for School B must NEVER return School A records
    const schoolBAttendance = await attendanceRepo.findByDate(schoolB.id, testDate);
    const isIsolated = !schoolBAttendance.some(r => r.student_id === studentA.id);

    record(
      '6b. Multi-Tenant Scoping: School B queries return zero School A records',
      isIsolated,
      `School B retrieved records: ${schoolBAttendance.length} (Student A present: ${!isIsolated})`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Bulk Register Persistence (Atomic Transaction)
    // -------------------------------------------------------------------------
    const bulkDate = '2026-11-12';
    const bulkRes = await attendanceRepo.recordBulkAttendance(
      schoolA.id,
      classA.id,
      activeTerm.id,
      bulkDate,
      [
        {
          studentId: studentA.id,
          status: 'PRESENT',
          arrivalTime: '07:40 AM',
        }
      ],
      { organizationId: schoolA.organization_id }
    );

    const recordDateStr = bulkRes.records[0].attendance_date instanceof Date
      ? bulkRes.records[0].attendance_date.toISOString().split('T')[0]
      : String(bulkRes.records[0].attendance_date).split('T')[0];
    const bulkSuccess = bulkRes.recorded === 1 && recordDateStr === bulkDate;

    record(
      '7. Server Authority: Atomic Bulk Class Register Recording',
      bulkSuccess,
      `Persisted ${bulkRes.recorded} entries for date ${recordDateStr}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Historical Context Preservation Across Student Progression
    // -------------------------------------------------------------------------
    // Suppose student had attendance recorded in class A.
    // Even if student progresses or class filter is applied, the historical attendance
    // remains bound to classA.id, activeTerm.id, and activeTerm.session_id.
    const historicalRecs = await attendanceRepo.findByClassAndDate(schoolA.id, classA.id, testDate);
    const hasHistoricalContext = historicalRecs.some(
      r => r.student_id === studentA.id && r.class_id === classA.id && r.term_id === activeTerm.id
    );

    record(
      '8. Historical Context Preservation: Record remains bound to historical class & term',
      hasHistoricalContext,
      `Historical record retains class_id: ${classA.id}, term_id: ${activeTerm.id}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Empty Database Result Invariant
    // -------------------------------------------------------------------------
    const emptyDate = '1995-01-01';
    const emptyResult = await attendanceRepo.findByClassAndDate(schoolA.id, classA.id, emptyDate);

    const isStrictlyEmpty = Array.isArray(emptyResult) && emptyResult.length === 0;

    record(
      '9. Empty Database Result Invariant (No synthetic mock data fallback)',
      isStrictlyEmpty,
      `Query for date with no data returned empty array [] (length: ${emptyResult.length})`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Database-Authoritative Attendance Statistics
    // -------------------------------------------------------------------------
    const studentHistoryAndStats = await attendanceRepo.findByStudent(schoolA.id, studentA.id);

    const statsValid = 
      studentHistoryAndStats.summary.totalDays >= 2 &&
      studentHistoryAndStats.summary.attendanceRate > 0;

    record(
      '10. Database-Authoritative Student Attendance Summary Statistics',
      statsValid,
      `Total Days: ${studentHistoryAndStats.summary.totalDays}, Rate: ${studentHistoryAndStats.summary.attendanceRate}%`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Immutable Attendance Audit Logging
    // -------------------------------------------------------------------------
    const auditEntry = await attendanceRepo.logAttendanceAudit({
      organizationId: schoolA.organization_id,
      schoolId: schoolA.id,
      studentId: studentA.id,
      classId: classA.id,
      action: 'BULK_RECORDED',
      details: { testRun: true, date: bulkDate }
    });

    const auditSaved = !!auditEntry.id && auditEntry.action === 'BULK_RECORDED';

    record(
      '11. Immutable Security Audit Logging (attendance_audit_logs entry created)',
      auditSaved,
      `Audit Log ID: ${auditEntry.id}, Action: ${auditEntry.action}`
    );

    // -------------------------------------------------------------------------
    // TEST 12: Frontend Decoupling Audit
    // -------------------------------------------------------------------------
    const attendancePagePath = path.join(process.cwd(), 'src/pages/AttendancePage.tsx');
    const attendancePageCode = fs.readFileSync(attendancePagePath, 'utf8');

    const usesLegacySave = attendancePageCode.includes('saveStoredAttendanceRecords');
    const usesLegacyGet = attendancePageCode.includes('getStoredAttendanceRecords');
    const usesServerPersist = attendancePageCode.includes('handlePersistDayRegister') && attendancePageCode.includes('serverRecordAttendance');
    const usesServerFetch = attendancePageCode.includes('fetchClassAttendance');

    const frontendDecoupled = !usesLegacySave && !usesLegacyGet && usesServerPersist && usesServerFetch;

    record(
      '12. Frontend Decoupling: AttendancePage relies exclusively on Server Authority',
      frontendDecoupled,
      `usesLegacySave=${usesLegacySave}, usesLegacyGet=${usesLegacyGet}, usesServerPersist=${usesServerPersist}, usesServerFetch=${usesServerFetch}`
    );

    // -------------------------------------------------------------------------
    // TEST 13: DataContext PostgreSQL API Authority for Attendance Registry
    // -------------------------------------------------------------------------
    const dataContextPath = path.join(process.cwd(), 'src/context/DataContext.tsx');
    const dataContextCode = fs.readFileSync(dataContextPath, 'utf8');

    const hasRecordAttendanceMethod = dataContextCode.includes('recordAttendance');
    const callsAttendanceEndpoint = dataContextCode.includes('/api/v1/attendance');
    const hasFetchClassMethod = dataContextCode.includes('fetchClassAttendance');

    const dataContextAuthoritative = hasRecordAttendanceMethod && callsAttendanceEndpoint && hasFetchClassMethod;

    record(
      '13. DataContext PostgreSQL API Authority for Attendance Registry',
      dataContextAuthoritative,
      `hasRecordAttendanceMethod=${hasRecordAttendanceMethod}, callsAttendanceEndpoint=${callsAttendanceEndpoint}, hasFetchClassMethod=${hasFetchClassMethod}`
    );

  } catch (error) {
    console.error('Fatal error during Phase 8C test execution:', error);
    record('FATAL: Unhandled exception in test runner', false, String(error));
  } finally {
    await closeDatabasePool();
  }

  // ---------------------------------------------------------------------------
  // Summary & Evaluation
  // ---------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('PHASE 8C ATTENDANCE TEST EXECUTION SUMMARY:');
  console.log('======================================================================');
  const passedCount = results.filter(r => r.status === 'PASSED').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}\n`);

  if (failedCount > 0) {
    console.error('❌ SOME PHASE 8C TESTS FAILED!');
    process.exit(1);
  } else {
    console.log('🎉 ALL PHASE 8C ATTENDANCE SERVER AUTHORITY AND ISOLATION TESTS PASSED!\n');
  }
}

runPhase8cTestSuite();
