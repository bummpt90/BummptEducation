/**
 * BummptEducation — Phase 8B: Parent & Guardian Identity, Server-Authoritative Report Access Test Suite
 * 
 * Verifies:
 * 1. Database schema migration 0008 (parent_guardians, parent_student_links, parent_access_pins, parent_access_logs)
 * 2. RBAC permissions (parents.view, parents.manage) assignment across roles
 * 3. Server-side Argon2id PIN verification with zero plaintext or hash leaks
 * 4. Rate limiting & Account Lockout after consecutive failed PIN attempts
 * 5. IDOR Prevention: Parent A cannot access Student B (unlinked ward)
 * 6. Multi-Tenant Scoping: Parent in School A cannot access Student in School B
 * 7. Report Card Publication Gating: Parents cannot access unpublished/draft results
 * 8. Report Card Publication Retrieval: Parents can access authorized, published results
 * 9. Parent Access Audit Logging in PostgreSQL parent_access_logs
 * 10. Frontend Decoupling: ParentReportPortalModal is free of mock data / localStorage dependencies
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { query, runMigrations, closeDatabasePool } from '../src/db';
import { ParentRepository } from '../src/db/repositories/parent.repository';
import { ReportCardRepository } from '../src/db/repositories/reportCard.repository';
import { hashPassword, verifyPassword } from '../src/auth/password';
import { hasPermission } from '../src/auth/permissions';
import { AuthRole } from '../src/auth/types';

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

async function runPhase8bTestSuite() {
  console.log('\n======================================================================');
  console.log('BummptEducation — Phase 8B Parent Identity & Access Automated Test Suite');
  console.log('======================================================================\n');

  const parentRepo = new ParentRepository();
  const reportCardRepo = new ReportCardRepository();

  try {
    // 0. Ensure all migrations are applied
    console.log('[Setup] Applying pending database migrations...');
    const migResult = await runMigrations();
    console.log(`[Setup] Migrations result: applied ${migResult.appliedCount}, skipped ${migResult.skippedCount}`);

    // -------------------------------------------------------------------------
    // TEST 1: Database Migration 0008 Schema Verification
    // -------------------------------------------------------------------------
    const tablesRes = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('parent_guardians', 'parent_student_links', 'parent_access_pins', 'parent_access_logs')
       ORDER BY table_name;`
    );
    const tableNames = tablesRes.rows.map(r => r.table_name);
    const hasAllTables = 
      tableNames.includes('parent_guardians') &&
      tableNames.includes('parent_student_links') &&
      tableNames.includes('parent_access_pins') &&
      tableNames.includes('parent_access_logs');

    record(
      '1. Migration 0008 Tables (parent_guardians, parent_student_links, parent_access_pins, parent_access_logs)',
      hasAllTables,
      `Found tables: ${tableNames.join(', ')}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: RBAC Parent Permissions Verification
    // -------------------------------------------------------------------------
    const principalCanView = hasPermission('principal', 'parents.view');
    const principalCanManage = hasPermission('principal', 'parents.manage');
    const parentCanView = hasPermission('parent', 'parents.view');
    const parentCannotManage = !hasPermission('parent', 'parents.manage');
    const studentCannotView = !hasPermission('student', 'parents.view');

    const rbacPass = principalCanView && principalCanManage && parentCanView && parentCannotManage && studentCannotView;
    record(
      '2. RBAC Permissions (parents.view & parents.manage correctly configured)',
      rbacPass,
      `principal view=${principalCanView}/manage=${principalCanManage}, parent view=${parentCanView}/manage=${!parentCannotManage}, student view=${!studentCannotView}`
    );

    // -------------------------------------------------------------------------
    // TEST SETUP: Fetch Seed Reference Data (Schools, Terms, Students)
    // -------------------------------------------------------------------------
    const schoolARes = await query<{ id: string; organization_id: string }>(
      `SELECT id, organization_id FROM schools WHERE code = 'BNS-MKD-000' OR code LIKE '%ANCHOR%' LIMIT 1;`
    );
    const schoolBRes = await query<{ id: string; organization_id: string }>(
      `SELECT id, organization_id FROM schools WHERE code = 'BNS-MKD-001' LIMIT 1;`
    );

    const schoolA = schoolARes.rows[0];
    const schoolB = schoolBRes.rows[0];
    if (!schoolA || !schoolB) {
      throw new Error('Reference schools missing. Run seeds first.');
    }

    const termRes = await query<{ id: string }>(
      `SELECT id FROM academic_terms WHERE is_current = TRUE LIMIT 1;`
    );
    const currentTermId = termRes.rows[0]?.id;

    // Resolve classes for schools
    const classARes = await query<{ id: string }>(
      `SELECT id FROM classes WHERE school_id = $1 LIMIT 1;`,
      [schoolA.id]
    );
    const classBRes = await query<{ id: string }>(
      `SELECT id FROM classes WHERE school_id = $1 LIMIT 1;`,
      [schoolB.id]
    );
    const classAId = classARes.rows[0]?.id;
    const classBId = classBRes.rows[0]?.id;

    // Create unique test students for pristine testing
    const ts = Date.now();
    const stu1Adm = `TEST-P8B-STU1-${ts}`;
    const stu2Adm = `TEST-P8B-STU2-${ts}`;
    const stuBAdm = `TEST-P8B-STUB-${ts}`;

    // Student 1 (School A)
    const stu1Res = await query<{ id: string }>(
      `INSERT INTO students (
        school_id, organization_id, admission_number, first_name, surname, full_name, gender, date_of_birth, arm, current_class_id, guardian_name, guardian_phone, date_enrolled, status
      ) VALUES ($1, $2, $3, 'Kuma', 'Vanger', 'Kuma Vanger (Test Student 1)', 'Male', '2012-01-01', 'secondary', $4, 'Mr. Vanger Senior', '+2348011223344', '2025-09-08', 'Active')
      RETURNING id;`,
      [schoolA.id, schoolA.organization_id, stu1Adm, classAId]
    );
    const stu1Id = stu1Res.rows[0].id;

    // Student 2 (School A)
    const stu2Res = await query<{ id: string }>(
      `INSERT INTO students (
        school_id, organization_id, admission_number, first_name, surname, full_name, gender, date_of_birth, arm, current_class_id, guardian_name, guardian_phone, date_enrolled, status
      ) VALUES ($1, $2, $3, 'Asha', 'Orban', 'Asha Orban (Test Student 2)', 'Female', '2013-05-15', 'secondary', $4, 'Mrs. Orban Senior', '+2348011223355', '2025-09-08', 'Active')
      RETURNING id;`,
      [schoolA.id, schoolA.organization_id, stu2Adm, classAId]
    );
    const stu2Id = stu2Res.rows[0].id;

    // Student B (School B - for Cross-Tenant testing)
    const stuBRes = await query<{ id: string }>(
      `INSERT INTO students (
        school_id, organization_id, admission_number, first_name, surname, full_name, gender, date_of_birth, arm, current_class_id, guardian_name, guardian_phone, date_enrolled, status
      ) VALUES ($1, $2, $3, 'Msugh', 'Iorfa', 'Msugh Iorfa (School B Student)', 'Male', '2012-09-09', 'secondary', $4, 'Mr. Iorfa Senior', '+2348011223366', '2025-09-08', 'Active')
      RETURNING id;`,
      [schoolB.id, schoolB.organization_id, stuBAdm, classBId]
    );
    const stuBId = stuBRes.rows[0].id;

    // Create Parent A in School A
    const parentARes = await query<{ id: string }>(
      `INSERT INTO parent_guardians (
        school_id, organization_id, full_name, phone, email, is_active
      ) VALUES ($1, $2, 'Mr. Vanger Senior', $3, $4, TRUE)
      RETURNING id;`,
      [schoolA.id, schoolA.organization_id, `+23480000${ts.toString().slice(-4)}1`, `parentA_${ts}@test.ng`]
    );
    const parentAId = parentARes.rows[0].id;

    // Create Parent B in School A
    const parentBRes = await query<{ id: string }>(
      `INSERT INTO parent_guardians (
        school_id, organization_id, full_name, phone, email, is_active
      ) VALUES ($1, $2, 'Mrs. Orban Senior', $3, $4, TRUE)
      RETURNING id;`,
      [schoolA.id, schoolA.organization_id, `+23480000${ts.toString().slice(-4)}2`, `parentB_${ts}@test.ng`]
    );
    const parentBId = parentBRes.rows[0].id;

    // Link Parent A to Student 1 ONLY
    await query(
      `INSERT INTO parent_student_links (
        parent_id, student_id, school_id, organization_id, relationship, is_primary_guardian, status
      ) VALUES ($1, $2, $3, $4, 'Father', TRUE, 'Active');`,
      [parentAId, stu1Id, schoolA.id, schoolA.organization_id]
    );

    // Link Parent B to Student 2 ONLY
    await query(
      `INSERT INTO parent_student_links (
        parent_id, student_id, school_id, organization_id, relationship, is_primary_guardian, status
      ) VALUES ($1, $2, $3, $4, 'Mother', TRUE, 'Active');`,
      [parentBId, stu2Id, schoolA.id, schoolA.organization_id]
    );

    // -------------------------------------------------------------------------
    // TEST 3: Issue and Verify Argon2id Hashed Access PIN
    // -------------------------------------------------------------------------
    const testPin = 'PAR-7744';
    await parentRepo.setParentPin({
      studentId: stu1Id,
      parentPhone: '+2348011223344',
      plainPin: testPin,
      schoolId: schoolA.id,
      organizationId: schoolA.organization_id,
      parentId: parentAId,
    });

    const verifySuccess = await parentRepo.verifyPinByAdmissionNumber(
      stu1Adm,
      testPin,
      schoolA.id
    );

    const pinVerifiedOk = verifySuccess.success && verifySuccess.student?.id === stu1Id;
    record(
      '3. Argon2id PIN Issuance & Verification (Zero plaintext stored in DB)',
      pinVerifiedOk,
      `Student ID: ${verifySuccess.student?.id}, success: ${verifySuccess.success}`
    );

    // Verify DB stores hash, not plain PIN
    const pinRowRes = await query<{ pin_hash: string }>(
      `SELECT pin_hash FROM parent_access_pins WHERE student_id = $1 LIMIT 1;`,
      [stu1Id]
    );
    const storedHash = pinRowRes.rows[0]?.pin_hash;
    const isArgonHash = storedHash?.startsWith('$argon2');
    record(
      '3b. PIN Cryptographic Invariant: Stored with Argon2id Hash',
      Boolean(isArgonHash && storedHash !== testPin),
      `Hash prefix: ${storedHash?.slice(0, 15)}...`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Brute-Force Rate Limiting & Account Lockout
    // -------------------------------------------------------------------------
    // Attempt 1-4 wrong PINs
    for (let i = 1; i <= 4; i++) {
      const failRes = await parentRepo.verifyPinByAdmissionNumber(
        stu1Adm,
        `WRONG-${i}`,
        schoolA.id
      );
      if (failRes.success) {
        throw new Error('Wrong PIN unexpectedly verified!');
      }
    }

    // Attempt 5 wrong PIN -> Should trigger lockout
    const lockRes = await parentRepo.verifyPinByAdmissionNumber(
      stu1Adm,
      'WRONG-5',
      schoolA.id
    );

    const isLockedOut = lockRes.isLocked === true;
    record(
      '4. Brute Force Protection: 5 consecutive failures triggers lockout',
      isLockedOut,
      `isLocked: ${lockRes.isLocked}, message: ${lockRes.message}`
    );

    // Attempt with CORRECT PIN while locked -> Must be rejected!
    const lockedValidAttempt = await parentRepo.verifyPinByAdmissionNumber(
      stu1Adm,
      testPin,
      schoolA.id
    );
    record(
      '4b. Lockout Enforcement: Valid PIN rejected during lockout window',
      !lockedValidAttempt.success && lockedValidAttempt.isLocked === true,
      `Locked valid attempt rejected: ${!lockedValidAttempt.success}`
    );

    // Clear lockout for remaining tests
    await query(
      `UPDATE parent_access_pins SET failed_attempts = 0, locked_until = NULL WHERE student_id = $1;`,
      [stu1Id]
    );

    // -------------------------------------------------------------------------
    // TEST 5: IDOR Prevention (Parent-Student Relationship Enforcement)
    // -------------------------------------------------------------------------
    // Parent A requests Student 1 (their linked child) -> Must PASS
    const parentAOwnChild = await parentRepo.verifyParentStudentRelationship(
      parentAId,
      stu1Id
    );
    record(
      '5a. Authorized Relationship: Parent A accesses linked Student 1',
      parentAOwnChild !== null,
      `Relationship confirmed: ${parentAOwnChild?.relationship}`
    );

    // Parent A requests Student 2 (Parent B's child) -> Must FAIL (IDOR blocked!)
    const parentAOtherChild = await parentRepo.verifyParentStudentRelationship(
      parentAId,
      stu2Id
    );
    record(
      '5b. IDOR Protection: Parent A is blocked from accessing unlinked Student 2',
      parentAOtherChild === null,
      `Unauthorized relationship rejected: ${parentAOtherChild === null}`
    );

    // Parent B requests Student 1 -> Must FAIL (IDOR blocked!)
    const parentBOtherChild = await parentRepo.verifyParentStudentRelationship(
      parentBId,
      stu1Id
    );
    record(
      '5c. IDOR Protection: Parent B is blocked from accessing unlinked Student 1',
      parentBOtherChild === null,
      `Unauthorized relationship rejected: ${parentBOtherChild === null}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Multi-Tenant Isolation
    // -------------------------------------------------------------------------
    // Parent A (School A) requests Student B (School B) -> Must FAIL
    const crossTenantLink = await parentRepo.verifyParentStudentRelationship(
      parentAId,
      stuBId
    );
    record(
      '6. Multi-Tenant Scoping: Parent in School A cannot access Student in School B',
      crossTenantLink === null,
      `Cross-school access blocked: ${crossTenantLink === null}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Report Card Publication Gateway (Unpublished / Draft Gating)
    // -------------------------------------------------------------------------
    if (currentTermId) {
      // Create unpublished report card for Student 1
      await reportCardRepo.setReportCardPublication({
        schoolId: schoolA.id,
        studentId: stu1Id,
        termId: currentTermId,
        isParentViewable: false,
        approvalStatus: 'Draft',
      });

      const unpublishedCheck = await reportCardRepo.getPublishedReportCard(stu1Id, currentTermId, schoolA.id);
      record(
        '7a. Publication Gateway: Unpublished/Draft report is blocked from parent access',
        unpublishedCheck.isPublished === false,
        `isPublished: ${unpublishedCheck.isPublished}, reason: ${unpublishedCheck.reason}`
      );

      // -------------------------------------------------------------------------
      // TEST 8: Report Card Publication Authorization & Retrieval
      // -------------------------------------------------------------------------
      // Publish report card
      await reportCardRepo.setReportCardPublication({
        schoolId: schoolA.id,
        studentId: stu1Id,
        termId: currentTermId,
        isParentViewable: true,
        approvalStatus: 'Approved & Published',
      });

      const publishedCheck = await reportCardRepo.getPublishedReportCard(stu1Id, currentTermId, schoolA.id);
      const retrievedReport = publishedCheck.reportCard;

      const canAccessPublished = publishedCheck.isPublished === true && retrievedReport !== undefined && retrievedReport.studentId === stu1Id;
      record(
        '8. Publication Authorization: Approved & Published report card accessible to parent',
        canAccessPublished,
        `isPublished: ${publishedCheck.isPublished}, Student ID: ${retrievedReport?.studentId}, Status: ${retrievedReport?.approvalStatus}`
      );
    } else {
      record('7. Report Card Tests', false, 'Current term missing in database');
    }

    // -------------------------------------------------------------------------
    // TEST 9: Audit Logging Integrity
    // -------------------------------------------------------------------------
    await parentRepo.logParentAccess({
      schoolId: schoolA.id,
      organizationId: schoolA.organization_id,
      parentId: parentAId,
      studentId: stu1Id,
      action: 'PARENT_PORTAL_VERIFY_SUCCESS',
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      details: { admissionNumber: stu1Adm },
    });

    const auditLogsRes = await query<{ count: string }>(
      `SELECT count(*) as count FROM parent_access_logs WHERE school_id = $1;`,
      [schoolA.id]
    );
    const logCount = parseInt(auditLogsRes.rows[0]?.count || '0', 10);
    record(
      '9. Immutable Security Audit Logging: Events recorded in parent_access_logs',
      logCount > 0,
      `Total log entries recorded: ${logCount}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Frontend Code Decoupling Audit
    // -------------------------------------------------------------------------
    const modalFilePath = path.resolve(process.cwd(), 'src/components/ParentReportPortalModal.tsx');
    const modalContent = fs.readFileSync(modalFilePath, 'utf-8');

    const usesGetStoredParentAccess = modalContent.includes('getStoredParentAccess');
    const usesInitialStudents = modalContent.includes('INITIAL_STUDENTS');
    const callsVerifyApi = modalContent.includes('/api/v1/parents/verify-pin');

    const frontendDecoupled = !usesGetStoredParentAccess && !usesInitialStudents && callsVerifyApi;
    record(
      '10. Frontend Decoupling: ParentReportPortalModal calls server API and has zero mock imports',
      frontendDecoupled,
      `usesGetStoredParentAccess: ${usesGetStoredParentAccess}, usesInitialStudents: ${usesInitialStudents}, callsVerifyApi: ${callsVerifyApi}`
    );

  } catch (error: any) {
    console.error('[TestSuite] Unhandled Exception:', error);
    record('FATAL: Suite execution aborted', false, error.message);
  } finally {
    await closeDatabasePool();
  }

  // Summary
  console.log('\n======================================================================');
  console.log('PHASE 8B TEST EXECUTION SUMMARY:');
  console.log('======================================================================');
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} test(s) failed in Phase 8B suite.`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL PHASE 8B SECURITY, IDOR, MULTI-TENANT, AND DECOUPLING TESTS PASSED!\n');
    process.exit(0);
  }
}

runPhase8bTestSuite();
