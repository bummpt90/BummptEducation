/**
 * BummptEducation — Phase 4 Operational Data Seeder (Staff & Students)
 * 
 * Provisions clearly identified DEVELOPMENT/DEMO staff and student records
 * to establish the operational foundation in PostgreSQL.
 * 
 * CRITICAL SAFETY RULES:
 * - Strictly DEMO/TEST data — NO real personal information.
 * - Idempotent execution — avoids duplicates.
 * - Links staff records to Phase 3 authenticated user identities.
 * - Atomic student + enrollment generation.
 */

import 'dotenv/config';
import type { PoolClient } from 'pg';
import { query, withTransaction, closeDatabasePool } from '../index';
import { StaffRepository } from '../repositories/staff.repository';
import { StudentRepository } from '../repositories/student.repository';

export interface OperationalSeedReport {
  staffCreated: number;
  studentsCreated: number;
  enrollmentsCreated: number;
  schoolsSeeded: string[];
}

export async function seedOperationalFoundation(externalClient?: PoolClient): Promise<OperationalSeedReport> {
  console.log('[OperationalSeed] Seeding development staff and demo students foundation...');

  const staffRepo = new StaffRepository();
  const studentRepo = new StudentRepository();

  const executeSeed = async (client: PoolClient): Promise<OperationalSeedReport> => {
    // 1. Resolve Schools
    const schoolARes = await client.query<{ id: string; code: string; organization_id: string }>(
      `SELECT id, code, organization_id FROM schools WHERE code = 'BNS-MKD-000' OR code LIKE '%ANCHOR%' LIMIT 1;`
    );
    const schoolBRes = await client.query<{ id: string; code: string; organization_id: string }>(
      `SELECT id, code, organization_id FROM schools WHERE code = 'BNS-MKD-001' LIMIT 1;`
    );

    const schoolA = schoolARes.rows[0];
    const schoolB = schoolBRes.rows[0];

    if (!schoolA || !schoolB) {
      throw new Error('Reference schools missing. Run reference migrations first.');
    }

    // 2. Resolve Active Session & Term
    const sessionRes = await client.query<{ id: string; session_name: string }>(
      `SELECT id, session_name FROM academic_sessions WHERE is_current = TRUE LIMIT 1;`
    );
    const currentSession = sessionRes.rows[0];
    if (!currentSession) {
      throw new Error('Active academic session (2025/2026) missing.');
    }

    const termRes = await client.query<{ id: string; term_name: string }>(
      `SELECT id, term_name FROM academic_terms WHERE session_id = $1 AND is_current = TRUE LIMIT 1;`,
      [currentSession.id]
    );
    const currentTerm = termRes.rows[0];

    // 3. Resolve sample classes for School A and School B
    const classARes = await client.query<{ id: string; name: string; level: string; arm: string }>(
      `SELECT id, name, level, arm FROM classes WHERE school_id = $1 ORDER BY level ASC;`,
      [schoolA.id]
    );
    const classBRes = await client.query<{ id: string; name: string; level: string; arm: string }>(
      `SELECT id, name, level, arm FROM classes WHERE school_id = $1 ORDER BY level ASC;`,
      [schoolB.id]
    );

    const jss1ClassA = classARes.rows.find((c) => c.level === 'JSS 1') || classARes.rows[0];
    const basic1ClassA = classARes.rows.find((c) => c.level === 'Basic 1') || classARes.rows[0];
    const kg2ClassA = classARes.rows.find((c) => c.level === 'KG 2') || classARes.rows[0];
    const jss1ClassB = classBRes.rows.find((c) => c.level === 'JSS 1') || classBRes.rows[0];

    // 4. Resolve users to link with staff records
    const usersRes = await client.query<{ id: string; email: string; full_name: string; role: string; school_id: string }>(
      `SELECT id, email, full_name, role, school_id FROM users;`
    );
    const userMap = new Map(usersRes.rows.map((u) => [u.email, u]));

    // 5. Seed Demo Staff Records
    const demoStaffDefinitions = [
      // School A Staff
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        userEmail: 'principal@anchor.bummpt.edu.ng',
        staffIdNumber: 'STAFF-ANCHOR-001',
        firstName: 'Grace',
        middleName: 'Nkechi',
        surname: 'Okafor',
        fullName: 'Dr. (Mrs.) Grace Nkechi Okafor (Principal)',
        staffType: 'Teaching' as const,
        arm: 'secondary',
        designation: 'Principal & Executive Director of Academics',
        role: 'principal',
        departmentId: 'Administration',
        qualifications: 'B.Ed, M.Ed, Ph.D Educational Administration',
        trcnNumber: 'TRCN/BN/2012/04881',
        phone: '+234 803 200 0001',
      },
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        userEmail: 'vp.academic@anchor.bummpt.edu.ng',
        staffIdNumber: 'STAFF-ANCHOR-002',
        firstName: 'Emmanuel',
        middleName: null,
        surname: 'Agba',
        fullName: 'Mr. Emmanuel Agba (VP Academic)',
        staffType: 'Teaching' as const,
        arm: 'secondary',
        designation: 'Vice Principal (Academic & Curriculum)',
        role: 'vice_principal',
        departmentId: 'Sciences',
        qualifications: 'B.Sc (Ed) Chemistry, M.Sc Curriculum Studies',
        trcnNumber: 'TRCN/BN/2015/09122',
        phone: '+234 803 200 0002',
      },
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        userEmail: 'headmistress@anchor.bummpt.edu.ng',
        staffIdNumber: 'STAFF-ANCHOR-003',
        firstName: 'Grace',
        middleName: 'Iveren',
        surname: 'Shima',
        fullName: 'Mrs. Grace Iveren Shima (Headmistress)',
        staffType: 'Teaching' as const,
        arm: 'primary',
        designation: 'Headmistress (Primary Basic Education)',
        role: 'headmistress',
        departmentId: 'Primary Section',
        qualifications: 'B.Ed Primary Education Studies',
        trcnNumber: 'TRCN/BN/2014/07331',
        phone: '+234 803 200 0003',
      },
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        userEmail: 'head.kindergarten@anchor.bummpt.edu.ng',
        staffIdNumber: 'STAFF-ANCHOR-004',
        firstName: 'Abigail',
        middleName: 'Folashade',
        surname: 'Balogun',
        fullName: 'Mrs. Abigail Folashade Balogun (EY Head)',
        staffType: 'Teaching' as const,
        arm: 'kindergarten',
        designation: 'Head of Early Years & Montessori Foundation',
        role: 'head_kindergarten',
        departmentId: 'Early Years',
        qualifications: 'B.Ed Early Childhood Education, AMI Montessori Diploma',
        trcnNumber: 'TRCN/BN/2018/11044',
        phone: '+234 803 200 0004',
      },
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        userEmail: 'exam.officer@anchor.bummpt.edu.ng',
        staffIdNumber: 'STAFF-ANCHOR-005',
        firstName: 'Emmanuel',
        middleName: null,
        surname: 'Agbo',
        fullName: 'Mr. Emmanuel Agbo (Exam Officer)',
        staffType: 'Teaching' as const,
        arm: 'secondary',
        designation: 'Dean of Examinations & Quality Assurance',
        role: 'exam_officer',
        departmentId: 'Examinations',
        qualifications: 'B.Sc Statistics & Education',
        trcnNumber: 'TRCN/BN/2016/08543',
        phone: '+234 803 200 0005',
      },
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        userEmail: 'bursar@anchor.bummpt.edu.ng',
        staffIdNumber: 'STAFF-ANCHOR-006',
        firstName: 'Patrick',
        middleName: 'Terver',
        surname: 'Gbilekaa',
        fullName: 'Mr. Patrick Terver Gbilekaa (Chief Bursar)',
        staffType: 'Non-Teaching' as const,
        arm: 'administration',
        designation: 'Chief Bursar & Head of Financial Accounts',
        role: 'bursar',
        departmentId: 'Bursary & Finance',
        qualifications: 'B.Sc Accounting, ACA, CNA',
        phone: '+234 803 200 0006',
      },
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        userEmail: 'admissions@anchor.bummpt.edu.ng',
        staffIdNumber: 'STAFF-ANCHOR-007',
        firstName: 'Bridget',
        middleName: 'Ngunan',
        surname: 'Tor',
        fullName: 'Mrs. Bridget Ngunan Tor (Registrar)',
        staffType: 'Non-Teaching' as const,
        arm: 'administration',
        designation: 'Registrar & Admissions Officer',
        role: 'admissions_officer',
        departmentId: 'Registry',
        qualifications: 'B.A English & Public Relations',
        phone: '+234 803 200 0007',
      },
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        userEmail: 'teacher@anchor.bummpt.edu.ng',
        staffIdNumber: 'STAFF-ANCHOR-008',
        firstName: 'Christopher',
        middleName: null,
        surname: 'Terwase',
        fullName: 'Mr. Christopher Terwase (Physics & Maths Teacher)',
        staffType: 'Teaching' as const,
        arm: 'secondary',
        designation: 'Senior Physics & Mathematics Master',
        role: 'teacher',
        departmentId: 'Sciences',
        assignedClassId: jss1ClassA.id,
        qualifications: 'B.Sc (Ed) Physics',
        trcnNumber: 'TRCN/BN/2019/12450',
        phone: '+234 803 200 0008',
      },
      // School B Staff (Government College Makurdi)
      {
        schoolId: schoolB.id,
        organizationId: schoolB.organization_id,
        userEmail: 'principal.gcmkd@bummpt.edu.ng',
        staffIdNumber: 'STAFF-GCMKD-001',
        firstName: 'Jacob',
        middleName: null,
        surname: 'Iorliam',
        fullName: 'Dr. Jacob Iorliam (Principal - Govt College Makurdi)',
        staffType: 'Teaching' as const,
        arm: 'secondary',
        designation: 'Principal, Government College Makurdi',
        role: 'principal',
        departmentId: 'Administration',
        qualifications: 'Ph.D Educational Management',
        trcnNumber: 'TRCN/BN/2010/03112',
        phone: '+234 803 300 0001',
      },
    ];

    let staffCount = 0;
    for (const def of demoStaffDefinitions) {
      const linkedUser = userMap.get(def.userEmail);
      const existing = await staffRepo.findByStaffNumber(def.schoolId, def.staffIdNumber, client);

      if (!existing) {
        await staffRepo.createStaff(
          {
            schoolId: def.schoolId,
            organizationId: def.organizationId,
            staffIdNumber: def.staffIdNumber,
            userId: linkedUser?.id || null,
            firstName: def.firstName,
            middleName: def.middleName,
            surname: def.surname,
            fullName: def.fullName,
            staffType: def.staffType,
            arm: def.arm,
            designation: def.designation,
            role: def.role,
            departmentId: def.departmentId,
            assignedClassId: (def as any).assignedClassId || null,
            qualifications: def.qualifications,
            trcnNumber: (def as any).trcnNumber || null,
            phone: def.phone,
            email: def.userEmail,
            status: 'Active',
            isActive: true,
          },
          client
        );
        staffCount++;
      } else if (linkedUser && !existing.user_id) {
        await client.query(`UPDATE staff SET user_id = $1 WHERE id = $2;`, [linkedUser.id, existing.id]);
      }
    }

    // 6. Seed Demo Students (School A & School B)
    const demoStudentDefinitions = [
      // School A Demo Student 1 (Senior Secondary / JSS 1)
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        admissionNumber: 'ANCHOR/2025/001',
        firstName: 'Somtochukwu',
        middleName: 'Emeka',
        surname: 'Okafor',
        fullName: 'Somtochukwu Emeka Okafor (Demo Student)',
        gender: 'Male' as const,
        dateOfBirth: '2012-05-14',
        currentClassId: jss1ClassA.id,
        arm: 'secondary' as const,
        house: 'Benue Blue House',
        guardianName: 'Engr. Emeka Okafor (Parent Guardian)',
        guardianPhone: '+234 803 400 0001',
        guardianEmail: 'parent@anchor.bummpt.edu.ng',
        address: 'Plot 12, High-Level Housing Estate, Makurdi',
        stateOfOrigin: 'Benue',
        dateEnrolled: '2025-09-08',
        status: 'Active' as const,
        isPrefect: true,
        prefectRole: 'Senior Prefect (Boy)',
      },
      // School A Demo Student 2 (Primary Arm)
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        admissionNumber: 'ANCHOR/2025/002',
        firstName: 'Dooshima',
        middleName: 'Mary',
        surname: 'Terwase',
        fullName: 'Dooshima Mary Terwase (Demo Pupil)',
        gender: 'Female' as const,
        dateOfBirth: '2018-03-22',
        currentClassId: basic1ClassA.id,
        arm: 'primary' as const,
        house: 'Katsina-Ala Green House',
        guardianName: 'Mr. Christopher Terwase',
        guardianPhone: '+234 803 400 0002',
        guardianEmail: 'c.terwase.parent@demo.ng',
        address: '15 Wurukum Road, Makurdi',
        stateOfOrigin: 'Benue',
        dateEnrolled: '2025-09-08',
        status: 'Active' as const,
        isPrefect: false,
      },
      // School A Demo Student 3 (Early Years)
      {
        schoolId: schoolA.id,
        organizationId: schoolA.organization_id,
        admissionNumber: 'ANCHOR/2025/003',
        firstName: 'Terna',
        middleName: 'David',
        surname: 'Shima',
        fullName: 'Terna David Shima (Demo Toddler)',
        gender: 'Male' as const,
        dateOfBirth: '2021-08-11',
        currentClassId: kg2ClassA.id,
        arm: 'kindergarten' as const,
        house: 'Niger Yellow House',
        guardianName: 'Mrs. Grace Iveren Shima',
        guardianPhone: '+234 803 400 0003',
        guardianEmail: 'shima.parent@demo.ng',
        address: '8 North Bank Layout, Makurdi',
        stateOfOrigin: 'Benue',
        dateEnrolled: '2025-09-08',
        status: 'Active' as const,
        isPrefect: false,
      },
      // School B Demo Student 1 (Government College Makurdi — For Cross-School Boundary Isolation Testing)
      {
        schoolId: schoolB.id,
        organizationId: schoolB.organization_id,
        admissionNumber: 'GCM/2025/001',
        firstName: 'Aondona',
        middleName: 'Paul',
        surname: 'Iorliam',
        fullName: 'Aondona Paul Iorliam (GCM Demo Student)',
        gender: 'Male' as const,
        dateOfBirth: '2011-11-03',
        currentClassId: jss1ClassB.id,
        arm: 'secondary' as const,
        house: 'Governor House',
        guardianName: 'Dr. Jacob Iorliam',
        guardianPhone: '+234 803 400 0004',
        guardianEmail: 'j.iorliam.parent@demo.ng',
        address: 'Government College Staff Quarters, Makurdi',
        stateOfOrigin: 'Benue',
        dateEnrolled: '2025-09-08',
        status: 'Active' as const,
        isPrefect: false,
      },
    ];

    let studentsCount = 0;
    let enrollmentsCount = 0;

    for (const def of demoStudentDefinitions) {
      const existing = await studentRepo.findByAdmissionNumber(def.schoolId, def.admissionNumber, client);
      if (!existing) {
        const { student, enrollment } = await studentRepo.createStudentWithEnrollment(
          {
            ...def,
            currentAcademicSessionId: currentSession.id,
            currentAcademicTermId: currentTerm?.id || null,
          },
          client
        );
        studentsCount++;
        if (enrollment) enrollmentsCount++;
      }
    }

    return {
      staffCreated: staffCount,
      studentsCreated: studentsCount,
      enrollmentsCreated: enrollmentsCount,
      schoolsSeeded: [schoolA.code, schoolB.code],
    };
  };

  if (externalClient) {
    return executeSeed(externalClient);
  }
  return withTransaction(executeSeed);
}

// Direct CLI execution
if (process.argv[1]?.includes('operational.seed')) {
  seedOperationalFoundation()
    .then((report) => {
      console.log('[OperationalSeed] Completed successfully:', report);
      return closeDatabasePool();
    })
    .catch((err) => {
      console.error('[OperationalSeed] Failed:', err);
      return closeDatabasePool();
    });
}
