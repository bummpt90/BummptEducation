/**
 * BummptEducation — Phase 6 Financial & Admissions Seeder
 * 
 * Provisions clearly identified DEVELOPMENT/DEMO fee structures, assessments,
 * invoices, payments, receipts, bursaries, and admission applications in PostgreSQL.
 * 
 * CRITICAL SAFETY RULES:
 * - Strictly DEMO/TEST data — NO real money, real cards, or real personal information.
 * - Idempotent execution — avoids duplicates.
 * - Sourced strictly server-side.
 */

import 'dotenv/config';
import type { PoolClient } from 'pg';
import { query, withTransaction } from '../index';
import { FeeRepository } from '../repositories/fee.repository';
import { AdmissionsRepository } from '../repositories/admissions.repository';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { BursaryRepository } from '../repositories/bursary.repository';

export interface FinancialSeedReport {
  feeStructuresCreated: number;
  applicationsCreated: number;
  assessmentsCreated: number;
  invoicesCreated: number;
  paymentsCreated: number;
  bursariesCreated: number;
}

export async function seedFinancialFoundation(externalClient?: PoolClient): Promise<FinancialSeedReport> {
  console.log('[FinancialSeed] Seeding development admissions, fees, and financial operations...');

  const feeRepo = new FeeRepository();
  const admissionsRepo = new AdmissionsRepository();
  const invoiceRepo = new InvoiceRepository();
  const paymentRepo = new PaymentRepository();
  const bursaryRepo = new BursaryRepository();

  const executeSeed = async (client: PoolClient): Promise<FinancialSeedReport> => {
    let feeStructuresCreated = 0;
    let applicationsCreated = 0;
    let assessmentsCreated = 0;
    let invoicesCreated = 0;
    let paymentsCreated = 0;
    let bursariesCreated = 0;

    // 1. Resolve Anchor School
    const schoolRes = await client.query<{ id: string; code: string; organization_id: string }>(
      `SELECT id, code, organization_id FROM schools WHERE code = 'BNS-MKD-000' OR code LIKE '%ANCHOR%' LIMIT 1;`
    );
    const school = schoolRes.rows[0];
    if (!school) {
      console.warn('[FinancialSeed] Anchor school not found. Skipping financial seeding.');
      return {
        feeStructuresCreated: 0,
        applicationsCreated: 0,
        assessmentsCreated: 0,
        invoicesCreated: 0,
        paymentsCreated: 0,
        bursariesCreated: 0,
      };
    }

    // 2. Resolve Active Session & Term
    const sessionRes = await client.query<{ id: string }>(
      `SELECT id FROM academic_sessions WHERE is_current = TRUE LIMIT 1;`
    );
    const session = sessionRes.rows[0];
    if (!session) {
      console.warn('[FinancialSeed] Active session not found.');
      return {
        feeStructuresCreated: 0,
        applicationsCreated: 0,
        assessmentsCreated: 0,
        invoicesCreated: 0,
        paymentsCreated: 0,
        bursariesCreated: 0,
      };
    }

    const termRes = await client.query<{ id: string }>(
      `SELECT id FROM academic_terms WHERE session_id = $1 AND is_current = TRUE LIMIT 1;`,
      [session.id]
    );
    const term = termRes.rows[0];
    if (!term) {
      console.warn('[FinancialSeed] Active term not found.');
      return {
        feeStructuresCreated: 0,
        applicationsCreated: 0,
        assessmentsCreated: 0,
        invoicesCreated: 0,
        paymentsCreated: 0,
        bursariesCreated: 0,
      };
    }

    // 3. Resolve Classes
    const classRes = await client.query<{ id: string; name: string }>(
      `SELECT id, name FROM classes WHERE school_id = $1 LIMIT 5;`,
      [school.id]
    );
    const classes = classRes.rows;

    // 4. Resolve Categories
    const catRes = await client.query<{ id: string; name: string }>(
      `SELECT id, name FROM fee_categories ORDER BY name ASC;`
    );
    const categories = catRes.rows;
    const tuitionCat = categories.find((c) => c.name.toLowerCase().includes('tuition')) || categories[0];
    const devCat = categories.find((c) => c.name.toLowerCase().includes('development')) || categories[1];
    const ptaCat = categories.find((c) => c.name.toLowerCase().includes('pta')) || categories[2];

    // 5. Seed Fee Structures for classes
    for (const cls of classes) {
      if (tuitionCat) {
        const checkTuition = await client.query(
          `SELECT id FROM fee_structures WHERE school_id = $1 AND class_id = $2 AND category_id = $3 AND academic_term_id = $4;`,
          [school.id, cls.id, tuitionCat.id, term.id]
        );
        if (checkTuition.rows.length === 0) {
          await feeRepo.createFeeStructure({
            schoolId: school.id,
            academicSessionId: session.id,
            academicTermId: term.id,
            classId: cls.id,
            categoryId: tuitionCat.id,
            name: `${cls.name} Term Tuition Fee`,
            amount: 45000.00,
            isMandatory: true,
          }, { client });
          feeStructuresCreated++;
        }
      }

      if (devCat) {
        const checkDev = await client.query(
          `SELECT id FROM fee_structures WHERE school_id = $1 AND class_id = $2 AND category_id = $3 AND academic_term_id = $4;`,
          [school.id, cls.id, devCat.id, term.id]
        );
        if (checkDev.rows.length === 0) {
          await feeRepo.createFeeStructure({
            schoolId: school.id,
            academicSessionId: session.id,
            academicTermId: term.id,
            classId: cls.id,
            categoryId: devCat.id,
            name: 'Capital Development Levy',
            amount: 10000.00,
            isMandatory: true,
          }, { client });
          feeStructuresCreated++;
        }
      }
    }

    // 6. Seed Demo Admission Applications
    const demoApps = [
      {
        studentName: 'Chidinma Grace Okon',
        appliedClass: 'Primary 1',
        arm: 'primary',
        guardianName: 'Elder Okon Bassey',
        guardianPhone: '08031234567',
        status: 'APPLIED',
        entranceExamScore: 82,
        interviewScore: 88,
      },
      {
        studentName: 'Amina Fatima Bello',
        appliedClass: 'Kindergarten 2',
        arm: 'kindergarten',
        guardianName: 'Alhaji Bello Idris',
        guardianPhone: '08029876543',
        status: 'ACCEPTED',
        developmentalReadinessScore: 90,
        immunizationCompleted: true,
        toiletTrained: true,
      },
      {
        studentName: 'David Emeka Nwosu',
        appliedClass: 'JSS 1',
        arm: 'secondary',
        guardianName: 'Engr. Nwosu Peter',
        guardianPhone: '08055551212',
        status: 'UNDER_REVIEW',
        entranceExamScore: 68,
        interviewScore: 72,
      },
    ];

    for (const app of demoApps) {
      const checkApp = await client.query(
        `SELECT id FROM admission_applications WHERE school_id = $1 AND student_name = $2;`,
        [school.id, app.studentName]
      );
      if (checkApp.rows.length === 0) {
        await admissionsRepo.createApplication({
          schoolId: school.id,
          studentName: app.studentName,
          appliedClass: app.appliedClass,
          arm: app.arm,
          guardianName: app.guardianName,
          guardianPhone: app.guardianPhone,
          status: app.status,
          entranceExamScore: app.entranceExamScore,
          interviewScore: app.interviewScore,
          developmentalReadinessScore: app.developmentalReadinessScore,
          immunizationCompleted: app.immunizationCompleted,
          toiletTrained: app.toiletTrained,
          academicSessionId: session.id,
          classId: classes[0]?.id,
        }, { client });
        applicationsCreated++;
      }
    }

    // 7. Seed Demo Student Assessments, Invoices, Payments, Bursary
    const studentRes = await client.query<{ id: string; current_class_id: string }>(
      `SELECT id, current_class_id FROM students WHERE school_id = $1 LIMIT 2;`,
      [school.id]
    );

    if (studentRes.rows.length > 0 && tuitionCat) {
      const demoStudent = studentRes.rows[0];

      // Check existing invoice for this student and term
      const invCheck = await client.query(
        `SELECT id FROM fee_invoices WHERE student_id = $1 AND term_id = $2 LIMIT 1;`,
        [demoStudent.id, term.id]
      );

      if (invCheck.rows.length === 0) {
        // Create assessment
        const assess = await feeRepo.assessStudentFee({
          schoolId: school.id,
          studentId: demoStudent.id,
          academicSessionId: session.id,
          academicTermId: term.id,
          classId: demoStudent.current_class_id,
          categoryId: tuitionCat.id,
          amount: 45000.00,
        }, { client });
        assessmentsCreated++;

        // Create invoice
        const invoice = await invoiceRepo.createInvoice({
          schoolId: school.id,
          studentId: demoStudent.id,
          academicSessionId: session.id,
          academicTermId: term.id,
          classId: demoStudent.current_class_id,
          items: [
            {
              categoryId: tuitionCat.id,
              assessmentId: assess.id,
              name: 'First Term Tuition',
              amount: 45000.00,
            },
            {
              categoryId: devCat?.id || null,
              name: 'Development Levy',
              amount: 10000.00,
            },
          ],
        }, { client });
        invoicesCreated++;

        // Record a partial payment
        const payment = await paymentRepo.recordPayment({
          schoolId: school.id,
          studentId: demoStudent.id,
          invoiceId: invoice.id,
          amount: 30000.00,
          paymentMethod: 'Bank Transfer',
          paymentReference: `DEMO-PAY-${Date.now()}`,
          bankReference: 'FBN-TRF-98218273',
        }, { client });
        paymentsCreated++;

        // Award a bursary
        await bursaryRepo.createAward({
          schoolId: school.id,
          studentId: demoStudent.id,
          academicSessionId: session.id,
          academicTermId: term.id,
          awardType: 'MERIT_SCHOLARSHIP',
          awardAmount: 15000.00,
          reason: 'Academic Excellence Award — Top scoring pupil in class.',
          invoiceId: invoice.id,
        }, { client });
        bursariesCreated++;
      }
    }

    return {
      feeStructuresCreated,
      applicationsCreated,
      assessmentsCreated,
      invoicesCreated,
      paymentsCreated,
      bursariesCreated,
    };
  };

  if (externalClient) {
    return executeSeed(externalClient);
  }
  return withTransaction(executeSeed);
}
