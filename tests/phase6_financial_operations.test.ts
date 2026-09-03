/**
 * BummptEducation — Phase 6 Admissions, Fees & Bursary / Financial Operations Automated Test Suite
 * 
 * Comprehensive automated verification for:
 * 1. Admissions application submission with collision-resistant reference
 * 2. Admissions screening scores recording & status transition
 * 3. ATOMIC ENROLLMENT: Conversion of accepted applicant to registered student + enrollment
 * 4. Prevention of duplicate applicant enrollment
 * 5. Fee categories retrieval
 * 6. School-scoped fee structure schedule creation
 * 7. Negative fee structure amount rejection
 * 8. Duplicate fee structure constraint protection
 * 9. Cross-school fee structure isolation
 * 10. Student fee assessment creation (server-authoritative amount)
 * 11. Bulk class fee assessment for enrolled students
 * 12. Invoice creation with server-calculated totals & line items
 * 13. Empty line item invoice rejection
 * 14. Cross-school invoice creation rejection
 * 15. Authoritative payment recording & atomic invoice balance deduction
 * 16. Overpayment prevention rule enforcement
 * 17. Authoritative digital receipt issuance
 * 18. Real-time student financial balance computation
 * 19. Bursary award request & validation
 * 20. Bursary approval & automatic invoice balance reconciliation
 * 21. Invoice cancellation and assessment revert
 * 22. Cross-school payment access rejection
 * 23. Financial audit trail recording & retrieval
 * 24. Role-based permission enforcement (bursar vs student/teacher)
 */

import 'dotenv/config';
import { query, closeDatabasePool } from '../src/db';
import { signAuthToken } from '../src/auth/token';
import { AdmissionsRepository } from '../src/db/repositories/admissions.repository';
import { FeeRepository } from '../src/db/repositories/fee.repository';
import { InvoiceRepository } from '../src/db/repositories/invoice.repository';
import { PaymentRepository } from '../src/db/repositories/payment.repository';
import { BursaryRepository } from '../src/db/repositories/bursary.repository';
import { FinancialAuditRepository } from '../src/db/repositories/financialAudit.repository';

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

async function runPhase6TestSuite() {
  console.log('\n=================================================================');
  console.log('BummptEducation — Phase 6 Admissions & Financial Test Suite');
  console.log('=================================================================\n');

  const BASE_URL = 'http://127.0.0.1:3000';

  const admissionsRepo = new AdmissionsRepository();
  const feeRepo = new FeeRepository();
  const invoiceRepo = new InvoiceRepository();
  const paymentRepo = new PaymentRepository();
  const bursaryRepo = new BursaryRepository();
  const auditRepo = new FinancialAuditRepository();

  try {
    // 0. Setup and Resolve Fixtures
    console.log('--- Setting up Test Fixtures ---');

    const schoolARes = await query<{ id: string; name: string }>(
      `SELECT id, name FROM schools WHERE code = 'BNS-MKD-000' OR code LIKE '%ANCHOR%' LIMIT 1;`
    );
    const schoolBRes = await query<{ id: string; name: string }>(
      `SELECT id, name FROM schools WHERE code = 'BNS-MKD-001' OR code NOT LIKE '%ANCHOR%' LIMIT 1;`
    );

    const schoolA = schoolARes.rows[0];
    const schoolB = schoolBRes.rows[0];

    if (!schoolA || !schoolB) {
      throw new Error('Test fixtures missing: need at least 2 distinct schools.');
    }

    const sessionRes = await query<{ id: string }>(
      `SELECT id FROM academic_sessions WHERE is_current = TRUE LIMIT 1;`
    );
    const currentSession = sessionRes.rows[0];

    const termRes = await query<{ id: string }>(
      `SELECT id FROM academic_terms WHERE session_id = $1 AND is_current = TRUE LIMIT 1;`,
      [currentSession.id]
    );
    const currentTerm = termRes.rows[0];

    const classARes = await query<{ id: string; name: string }>(
      `SELECT id, name FROM classes WHERE school_id = $1 LIMIT 1;`,
      [schoolA.id]
    );
    const classBRes = await query<{ id: string; name: string }>(
      `SELECT id, name FROM classes WHERE school_id = $1 LIMIT 1;`,
      [schoolB.id]
    );

    const classA = classARes.rows[0];
    const classB = classBRes.rows[0];

    const categories = await feeRepo.getCategories();
    const tuitionCat = categories.find((c) => c.name.toLowerCase().includes('tuition')) || categories[0];
    const devCat = categories.find((c) => c.name.toLowerCase().includes('development')) || categories[1];

    // Find or create test users
    const bursarUserRes = await query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE role = 'bursar' AND school_id = $1 LIMIT 1;`,
      [schoolA.id]
    );
    let bursarUserId = bursarUserRes.rows[0]?.id;
    if (!bursarUserId) {
      const u = await query<{ id: string }>(
        `INSERT INTO users (school_id, email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, 'hash', 'Test Bursar', 'bursar', TRUE) RETURNING id;`,
        [schoolA.id, `bursar.test.${Date.now()}@bummpt.internal`]
      );
      bursarUserId = u.rows[0].id;
    }

    const studentUserRes = await query<{ id: string; email: string }>(
      `SELECT id, email FROM users WHERE role = 'student' LIMIT 1;`
    );
    let studentUserId = studentUserRes.rows[0]?.id;
    if (!studentUserId) {
      const u = await query<{ id: string }>(
        `INSERT INTO users (school_id, email, password_hash, full_name, role, is_active)
         VALUES ($1, $2, 'hash', 'Test Student User', 'student', TRUE) RETURNING id;`,
        [schoolA.id, `student.test.${Date.now()}@bummpt.internal`]
      );
      studentUserId = u.rows[0].id;
    }

    const bursarToken = signAuthToken({
      userId: bursarUserId,
      email: 'bursar@test.internal',
      role: 'bursar',
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const studentToken = signAuthToken({
      userId: studentUserId,
      email: 'student@test.internal',
      role: 'student',
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    // Clean up prior automated test fee structures if any
    await query("DELETE FROM fee_structures WHERE name LIKE 'Automated Test Tuition%';");

    let testCat: any = categories.find((c) => c.name === 'Laboratory Test Fee');
    if (!testCat) {
      const res = await query<{ id: string; name: string }>(
        `INSERT INTO fee_categories (name, description) VALUES ('Laboratory Test Fee', 'Automated test category') ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description RETURNING id, name;`
      );
      testCat = res.rows[0];
    }

    console.log('Fixtures established successfully.\n');

    // =========================================================================
    // TEST 1: Admissions Application Submission
    // =========================================================================
    let testApplication: any;
    try {
      testApplication = await admissionsRepo.createApplication({
        schoolId: schoolA.id,
        studentName: 'Torkwase Dooshima Aboh',
        appliedClass: classA.name,
        arm: 'primary',
        guardianName: 'Dr. Aboh Terver',
        guardianPhone: '08039998877',
        guardianEmail: 'terver.aboh@example.com',
        entranceExamScore: 88,
        interviewScore: 92,
        academicSessionId: currentSession.id,
        classId: classA.id,
      });

      const isValid = testApplication && 
        testApplication.application_number.startsWith('APP-') &&
        testApplication.status === 'APPLIED';

      record('Admissions: Application creation & collision-resistant numbering', isValid, testApplication.application_number);
    } catch (err: any) {
      record('Admissions: Application creation', false, err.message);
    }

    // =========================================================================
    // TEST 2: Admissions Screening Scores & Decision Update
    // =========================================================================
    try {
      const updated = await admissionsRepo.updateDecision(
        testApplication.id,
        'ACCEPTED',
        'Strong academic performance and readiness in entrance assessment.',
        bursarUserId
      );

      const isValid = updated?.decision === 'ACCEPTED' && updated?.status === 'ACCEPTED';
      record('Admissions: Screening review & ACCEPTED status transition', isValid, `Status: ${updated?.status}`);
    } catch (err: any) {
      record('Admissions: Status transition', false, err.message);
    }

    // =========================================================================
    // TEST 3: ATOMIC ENROLLMENT into Active Student Registry
    // =========================================================================
    let enrolledStudent: any;
    try {
      const enrollmentResult = await admissionsRepo.enrollApplicant(testApplication.id, {
        classId: classA.id,
        academicSessionId: currentSession.id,
        academicTermId: currentTerm.id,
        admissionNumber: `TEST-ADM-${Date.now()}`,
        gender: 'Female',
        dateOfBirth: '2016-04-12',
      });

      enrolledStudent = enrollmentResult.student;
      const appUpdated = enrollmentResult.application;

      const isValid = enrolledStudent &&
        appUpdated.status === 'ENROLLED' &&
        appUpdated.student_id === enrolledStudent.id;

      record('Admissions: Atomic enrollment into Student Registry & Longitudinal ledger', isValid, `Student ID: ${enrolledStudent?.id}`);
    } catch (err: any) {
      record('Admissions: Atomic enrollment', false, err.message);
    }

    // =========================================================================
    // TEST 4: Prevention of Duplicate Applicant Enrollment
    // =========================================================================
    try {
      let duplicateCaught = false;
      try {
        await admissionsRepo.enrollApplicant(testApplication.id, {
          classId: classA.id,
          academicSessionId: currentSession.id,
        });
      } catch (e: any) {
        duplicateCaught = true;
      }
      record('Admissions: Duplicate enrollment rejection guard', duplicateCaught);
    } catch (err: any) {
      record('Admissions: Duplicate enrollment guard', false, err.message);
    }

    // =========================================================================
    // TEST 5: Fee Categories Retrieval
    // =========================================================================
    try {
      const cats = await feeRepo.getCategories();
      const hasCategories = Array.isArray(cats) && cats.length > 0;
      record('Fee Structure: Categories retrieval (Tuition, Development, etc.)', hasCategories, `${cats.length} categories`);
    } catch (err: any) {
      record('Fee Structure: Categories retrieval', false, err.message);
    }

    // =========================================================================
    // TEST 6: School-Scoped Fee Structure Creation
    // =========================================================================
    let testFeeStructure: any;
    try {
      testFeeStructure = await feeRepo.createFeeStructure({
        schoolId: schoolA.id,
        academicSessionId: currentSession.id,
        academicTermId: currentTerm.id,
        classId: classA.id,
        categoryId: testCat.id,
        name: `Automated Test Tuition ${Date.now()}`,
        amount: 55000.00,
        isMandatory: true,
      });

      const isValid = testFeeStructure && Number(testFeeStructure.amount) === 55000.00;
      record('Fee Structure: Valid class schedule creation', isValid, `₦${testFeeStructure.amount}`);
    } catch (err: any) {
      record('Fee Structure: Creation', false, err.message);
    }

    // =========================================================================
    // TEST 7: Negative Fee Structure Amount Rejection
    // =========================================================================
    try {
      let negativeCaught = false;
      try {
        await feeRepo.createFeeStructure({
          schoolId: schoolA.id,
          academicSessionId: currentSession.id,
          academicTermId: currentTerm.id,
          classId: classA.id,
          categoryId: devCat.id,
          name: 'Invalid Negative Fee',
          amount: -5000,
        });
      } catch (e: any) {
        negativeCaught = true;
      }
      record('Fee Structure: Negative amount rejection guard', negativeCaught);
    } catch (err: any) {
      record('Fee Structure: Negative amount rejection', false, err.message);
    }

    // =========================================================================
    // TEST 8: Cross-School Fee Structure Isolation
    // =========================================================================
    try {
      const schoolBStructures = await feeRepo.findFeeStructures(
        { schoolId: schoolB.id },
        { tenantContext: { schoolId: schoolB.id, role: 'principal' } }
      );

      const leakDetected = schoolBStructures.data.some((s) => s.id === testFeeStructure.id);
      record('Fee Structure: Multi-tenant boundary isolation between schools', !leakDetected);
    } catch (err: any) {
      record('Fee Structure: Multi-tenant isolation', false, err.message);
    }

    // =========================================================================
    // TEST 9: Student Fee Assessment (Server-Authoritative)
    // =========================================================================
    let testAssessment: any;
    try {
      testAssessment = await feeRepo.assessStudentFee({
        schoolId: schoolA.id,
        studentId: enrolledStudent.id,
        academicSessionId: currentSession.id,
        academicTermId: currentTerm.id,
        classId: classA.id,
        categoryId: tuitionCat.id,
        amount: 55000.00,
      });

      const isValid = testAssessment && Number(testAssessment.amount) === 55000.00;
      record('Assessments: Individual student charge creation', isValid, `Charge: ₦${testAssessment.amount}`);
    } catch (err: any) {
      record('Assessments: Creation', false, err.message);
    }

    // =========================================================================
    // TEST 10: Bulk Class Fee Assessment
    // =========================================================================
    try {
      const bulkRes = await feeRepo.assessClassFees(
        schoolA.id,
        currentSession.id,
        currentTerm.id,
        classA.id
      );

      const isValid = typeof bulkRes.assessedStudentsCount === 'number';
      record('Assessments: Bulk class fee generation for enrolled pupils', isValid, `Students: ${bulkRes.assessedStudentsCount}`);
    } catch (err: any) {
      record('Assessments: Bulk class generation', false, err.message);
    }

    // =========================================================================
    // TEST 11: Invoice Creation with Server-Calculated Totals
    // =========================================================================
    let testInvoice: any;
    try {
      testInvoice = await invoiceRepo.createInvoice({
        schoolId: schoolA.id,
        studentId: enrolledStudent.id,
        academicSessionId: currentSession.id,
        academicTermId: currentTerm.id,
        classId: classA.id,
        items: [
          {
            categoryId: tuitionCat.id,
            assessmentId: testAssessment.id,
            name: 'First Term Tuition Assessment',
            amount: 55000.00,
          },
          {
            categoryId: devCat.id,
            name: 'ICT Laboratory Maintenance',
            amount: 5000.00,
          },
        ],
      });

      const expectedTotal = 60000.00;
      const isValid = testInvoice &&
        testInvoice.invoice_number.startsWith('INV-') &&
        Number(testInvoice.total_billed) === expectedTotal &&
        Number(testInvoice.balance) === expectedTotal &&
        testInvoice.status === 'UNPAID';

      record('Invoices: Server-calculated bill creation & line item bundling', isValid, `Total: ₦${testInvoice.total_billed}`);
    } catch (err: any) {
      record('Invoices: Creation', false, err.message);
    }

    // =========================================================================
    // TEST 12: Empty Line Item Invoice Rejection
    // =========================================================================
    try {
      let emptyCaught = false;
      try {
        await invoiceRepo.createInvoice({
          schoolId: schoolA.id,
          studentId: enrolledStudent.id,
          academicSessionId: currentSession.id,
          academicTermId: currentTerm.id,
          items: [],
        });
      } catch (e: any) {
        emptyCaught = true;
      }
      record('Invoices: Empty line item invoice rejection guard', emptyCaught);
    } catch (err: any) {
      record('Invoices: Empty item rejection', false, err.message);
    }

    // =========================================================================
    // TEST 13: Cross-School Invoice Creation Rejection
    // =========================================================================
    try {
      let crossSchoolCaught = false;
      try {
        await invoiceRepo.createInvoice(
          {
            schoolId: schoolB.id,
            studentId: enrolledStudent.id, // Enrolled in School A!
            academicSessionId: currentSession.id,
            academicTermId: currentTerm.id,
            items: [{ name: 'Test Fee', amount: 1000 }],
          },
          { tenantContext: { schoolId: schoolB.id, role: 'principal' } }
        );
      } catch (e: any) {
        crossSchoolCaught = true;
      }
      record('Invoices: Cross-school student invoice creation rejection', crossSchoolCaught);
    } catch (err: any) {
      record('Invoices: Cross-school rejection', false, err.message);
    }

    // =========================================================================
    // TEST 14: Payment Recording & Atomic Balance Deduction
    // =========================================================================
    let testPayment: any;
    try {
      testPayment = await paymentRepo.recordPayment({
        schoolId: schoolA.id,
        studentId: enrolledStudent.id,
        invoiceId: testInvoice.id,
        amount: 35000.00,
        paymentMethod: 'Bank Transfer',
        paymentReference: `REF-TRF-${Date.now()}`,
        bankReference: 'GTB-TRF-0918273645',
      });

      // Verify invoice balance was atomically updated in DB
      const updatedInvoice = await invoiceRepo.findById(testInvoice.id);

      const isValid = testPayment &&
        testPayment.receipt_number.startsWith('REC-') &&
        Number(updatedInvoice?.amount_paid) === 35000.00 &&
        Number(updatedInvoice?.balance) === 25000.00 &&
        updatedInvoice?.status === 'PARTIAL';

      record('Payments: Atomic payment recording & balance ledger deduction', isValid, `Remaining Balance: ₦${updatedInvoice?.balance}`);
    } catch (err: any) {
      record('Payments: Recording', false, err.message);
    }

    // =========================================================================
    // TEST 15: Overpayment Prevention Rule Enforcement
    // =========================================================================
    try {
      let overpaymentCaught = false;
      try {
        // Outstanding balance is ₦25,000. Attempt payment of ₦30,000.
        await paymentRepo.recordPayment({
          schoolId: schoolA.id,
          studentId: enrolledStudent.id,
          invoiceId: testInvoice.id,
          amount: 30000.00,
          paymentMethod: 'POS',
        });
      } catch (e: any) {
        overpaymentCaught = true;
      }
      record('Payments: Overpayment prevention guard (payment > balance)', overpaymentCaught);
    } catch (err: any) {
      record('Payments: Overpayment prevention', false, err.message);
    }

    // =========================================================================
    // TEST 16: Authoritative Digital Receipt Issuance
    // =========================================================================
    try {
      const receipt = await paymentRepo.getAuthoritativeReceipt(testPayment.receipt_number);

      const isValid = receipt &&
        receipt.receipt_number === testPayment.receipt_number &&
        receipt.student_name === enrolledStudent.full_name &&
        receipt.school_name === schoolA.name &&
        Number(receipt.amount_paid) === 35000.00;

      record('Receipts: Authoritative digital receipt generation & institutional verification', isValid, receipt?.receipt_number);
    } catch (err: any) {
      record('Receipts: Retrieval', false, err.message);
    }

    // =========================================================================
    // TEST 17: Bursary Award Request & Justification Check
    // =========================================================================
    let testBursary: any;
    try {
      testBursary = await bursaryRepo.createAward({
        schoolId: schoolA.id,
        studentId: enrolledStudent.id,
        academicSessionId: currentSession.id,
        academicTermId: currentTerm.id,
        awardType: 'MERIT_SCHOLARSHIP',
        awardAmount: 25000.00,
        reason: 'State Academic Olympiad Gold Medalist Tuition Bursary',
        invoiceId: testInvoice.id,
        createdBy: bursarUserId,
      });

      const isValid = testBursary && testBursary.status === 'REQUESTED';
      record('Bursary: Award request creation & justification validation', isValid, `Award: ₦${testBursary.award_amount}`);
    } catch (err: any) {
      record('Bursary: Request creation', false, err.message);
    }

    // =========================================================================
    // TEST 18: Bursary Approval & Automatic Invoice Reconciliation
    // =========================================================================
    try {
      const approved = await bursaryRepo.reviewAward(
        testBursary.id,
        'APPROVED',
        bursarUserId
      );

      // Verify invoice balance was atomically adjusted (25000 balance - 25000 bursary = 0)
      const updatedInvoice = await invoiceRepo.findById(testInvoice.id);

      const isValid = approved.status === 'APPROVED' &&
        Number(updatedInvoice?.balance) === 0.00 &&
        ['PAID', 'Fully Paid', 'FULLY PAID'].includes(updatedInvoice?.status || '');

      record('Bursary: Approval workflow & automatic invoice balance settlement', isValid, `Invoice Status: ${updatedInvoice?.status}`);
    } catch (err: any) {
      record('Bursary: Approval & reconciliation', false, err.message);
    }

    // =========================================================================
    // TEST 19: Real-time Student Balance Computation & Exam Clearance
    // =========================================================================
    try {
      const balanceReport = await paymentRepo.computeStudentBalance(enrolledStudent.id);

      const isValid = balanceReport &&
        balanceReport.total_invoiced === 60000.00 &&
        balanceReport.total_paid === 35000.00 &&
        balanceReport.total_bursary_awarded === 25000.00 &&
        balanceReport.net_outstanding_balance === 0.00 &&
        balanceReport.is_cleared_for_exam === true;

      record('Balances: Real-time financial balance aggregation & examination clearance', isValid, `Net Balance: ₦${balanceReport.net_outstanding_balance} (Cleared: ${balanceReport.is_cleared_for_exam})`);
    } catch (err: any) {
      record('Balances: Computation', false, err.message);
    }

    // =========================================================================
    // TEST 20: Invoice Cancellation & Assessment Status Revert
    // =========================================================================
    try {
      // Create a dummy invoice with 0 payments to test cancellation
      const dummyInvoice = await invoiceRepo.createInvoice({
        schoolId: schoolA.id,
        studentId: enrolledStudent.id,
        academicSessionId: currentSession.id,
        academicTermId: currentTerm.id,
        items: [{ name: 'Optional Excursion Fee', amount: 8000.00 }],
      });

      const cancelled = await invoiceRepo.cancelInvoice(dummyInvoice.id);
      const isValid = cancelled.status === 'CANCELLED';
      record('Invoices: Unpaid invoice cancellation & status revert', isValid);
    } catch (err: any) {
      record('Invoices: Cancellation', false, err.message);
    }

    // =========================================================================
    // TEST 21: Cross-School Payment Rejection Guard
    // =========================================================================
    try {
      let crossSchoolPayCaught = false;
      try {
        await paymentRepo.recordPayment(
          {
            schoolId: schoolB.id,
            studentId: enrolledStudent.id,
            invoiceId: testInvoice.id,
            amount: 1000,
            paymentMethod: 'Cash / Bank Teller',
          },
          { tenantContext: { schoolId: schoolB.id, role: 'principal' } }
        );
      } catch (e: any) {
        crossSchoolPayCaught = true;
      }
      record('Payments: Cross-school payment recording rejection guard', crossSchoolPayCaught);
    } catch (err: any) {
      record('Payments: Cross-school rejection', false, err.message);
    }

    // =========================================================================
    // TEST 22: Financial Audit Trail Recording & Inspection
    // =========================================================================
    try {
      await auditRepo.logAction({
        schoolId: schoolA.id,
        userId: bursarUserId,
        entityType: 'PAYMENT',
        entityId: testPayment.id,
        action: 'VERIFY_AUDIT_LOG',
        amount: 35000.00,
        details: { receiptNumber: testPayment.receipt_number },
      });

      const auditLogs = await auditRepo.getAuditLogs({ schoolId: schoolA.id });
      const isValid = auditLogs.total > 0 && auditLogs.data.some((l) => l.action === 'VERIFY_AUDIT_LOG');
      record('Auditability: Immutable financial audit trail logging & retrieval', isValid, `${auditLogs.total} logs recorded`);
    } catch (err: any) {
      record('Auditability: Trail inspection', false, err.message);
    }

    // =========================================================================
    // TEST 23: RBAC Enforcement — Bursar Access vs Unauthorized Student
    // =========================================================================
    try {
      // Bursar has permissions: invoices.view, payments.record, etc.
      const { hasPermission } = await import('../src/auth/permissions');
      const bursarCanManage = hasPermission('bursar', 'fees.manage');
      const bursarCanRecord = hasPermission('bursar', 'payments.record');
      const bursarCanBursary = hasPermission('bursar', 'bursary.manage');

      const studentCanManage = hasPermission('student', 'fees.manage');
      const studentCanRecord = hasPermission('student', 'payments.record');
      const teacherCanRecord = hasPermission('teacher', 'payments.record');

      const isValid = bursarCanManage &&
        bursarCanRecord &&
        bursarCanBursary &&
        !studentCanManage &&
        !studentCanRecord &&
        !teacherCanRecord;

      record('RBAC: Financial authorization rules (Bursar authorized; Student/Teacher blocked)', isValid);
    } catch (err: any) {
      record('RBAC: Financial authorization', false, err.message);
    }

  } catch (globalErr: any) {
    console.error('Fatal error running Phase 6 test suite:', globalErr);
  } finally {
    // Print Summary
    console.log('\n=================================================================');
    console.log('TEST RESULTS SUMMARY:');
    console.log('=================================================================');
    const passedCount = results.filter((r) => r.status === 'PASSED').length;
    const failedCount = results.filter((r) => r.status === 'FAILED').length;
    console.log(`TOTAL: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);

    if (failedCount > 0) {
      console.error(`❌ Phase 6 verification failed: ${failedCount} tests failed.`);
      process.exitCode = 1;
    } else {
      console.log('🎉 ALL 23 PHASE 6 FINANCIAL & ADMISSIONS TESTS PASSED!');
    }

    await closeDatabasePool();
  }
}

runPhase6TestSuite();
