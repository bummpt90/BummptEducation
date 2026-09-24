/**
-- ============================================================================
-- BummptEducation — Report Card & Publication Data Access Layer
-- Phase 8B: Server-Authoritative Report Card Repository
-- ============================================================================
*/

import type { PoolClient } from 'pg';
import { query, withTransaction } from '../client';
import { academicResultRepository } from './academicResult.repository';
import type { StudentReportCard, AffectiveDomain, PsychomotorDomain } from '../../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val?: string | null): boolean => Boolean(val && UUID_REGEX.test(val.trim()));

export type DomainAssessmentStatus = 'Not started' | 'In progress' | 'Saved' | 'Returned for correction';

export const AFFECTIVE_TRAITS = [
  'punctuality',
  'neatness',
  'politeness',
  'honesty',
  'peerRelationship',
  'leadership',
  'emotionalStability',
  'obedience',
  'attentiveness',
  'perseverance',
] as const;

export const PSYCHOMOTOR_TRAITS = [
  'handwriting',
  'sportsAndGames',
  'craftsAndPractical',
  'verbalFluency',
  'musicalDramatic',
  'handlingOfTools',
  'physicalAgility',
] as const;

export interface StudentDomainAssessment {
  studentId: string;
  studentName?: string;
  admissionNumber?: string;
  classId: string;
  className?: string;
  classLevel?: string;
  classArm?: string;
  termId: string;
  termName?: string;
  affective: Partial<AffectiveDomain>;
  psychomotor: Partial<PsychomotorDomain>;
  formTutorRemark?: string | null;
  formTutorName?: string | null;
  formTutorSignatureDate?: string | null;
  sportsMasterRemark?: string | null;
  sportsMasterName?: string | null;
  guidanceCounselorRemark?: string | null;
  guidanceCounselorName?: string | null;
  principalRemark?: string | null;
  principalName?: string | null;
  principalTitle?: string | null;
  approvalStatus: string;
  isAssessed: boolean;
  status: DomainAssessmentStatus;
  updatedAt?: string;
}

export interface ClassDomainProgress {
  classId: string;
  className: string;
  classLevel: string;
  classArm: string;
  termId: string;
  termName: string;
  totalStudents: number;
  assessedCount: number;
  inProgressCount: number;
  unassessedCount: number;
  returnedCount: number;
  students: StudentDomainAssessment[];
}

export interface SaveDomainAssessmentInput {
  schoolId: string;
  studentId: string;
  classId?: string;
  termId: string;
  affective?: Partial<AffectiveDomain> | null;
  psychomotor?: Partial<PsychomotorDomain> | null;
  formTutorRemark?: string | null;
  sportsMasterRemark?: string | null;
  guidanceCounselorRemark?: string | null;
  principalRemark?: string | null;
  formTutorName?: string | null;
  sportsMasterName?: string | null;
  guidanceCounselorName?: string | null;
  principalName?: string | null;
  principalTitle?: string | null;
  approvalStatus?: 'Draft' | 'Approved & Published' | 'Requires Correction';
  authenticatedUser: {
    id: string;
    role: string;
    schoolId?: string;
    fullName: string;
    isSuperAdmin?: boolean;
    isStateOfficer?: boolean;
  };
}

export function evaluateDomainStatus(
  affective: any,
  psychomotor: any,
  remarks: {
    formTutorRemark?: string | null;
    sportsMasterRemark?: string | null;
    guidanceCounselorRemark?: string | null;
    principalRemark?: string | null;
  },
  approvalStatus?: string
): { status: DomainAssessmentStatus; isAssessed: boolean; ratedTraitsCount: number } {
  if (approvalStatus === 'Requires Correction') {
    return { status: 'Returned for correction', isAssessed: true, ratedTraitsCount: 0 };
  }

  let ratedCount = 0;
  if (affective && typeof affective === 'object') {
    for (const key of AFFECTIVE_TRAITS) {
      const val = affective[key];
      if (typeof val === 'number' && Number.isInteger(val) && val >= 1 && val <= 5) {
        ratedCount++;
      }
    }
  }

  if (psychomotor && typeof psychomotor === 'object') {
    for (const key of PSYCHOMOTOR_TRAITS) {
      const val = psychomotor[key];
      if (typeof val === 'number' && Number.isInteger(val) && val >= 1 && val <= 5) {
        ratedCount++;
      }
    }
  }

  const hasRemarks = Boolean(
    remarks.formTutorRemark?.trim() ||
    remarks.sportsMasterRemark?.trim() ||
    remarks.guidanceCounselorRemark?.trim() ||
    remarks.principalRemark?.trim()
  );

  const totalTraits = AFFECTIVE_TRAITS.length + PSYCHOMOTOR_TRAITS.length;

  if (ratedCount === 0 && !hasRemarks) {
    return { status: 'Not started', isAssessed: false, ratedTraitsCount: 0 };
  }

  if (ratedCount >= totalTraits) {
    return { status: 'Saved', isAssessed: true, ratedTraitsCount: ratedCount };
  }

  return { status: 'In progress', isAssessed: true, ratedTraitsCount: ratedCount };
}

export interface ReportCardEntity {
  id: string;
  schoolId: string;
  studentId: string;
  classId: string;
  termId: string;
  totalScoreObtained: number;
  totalPossibleScore: number;
  overallPercentage: number;
  positionInClass: number;
  totalStudentsInClass: number;
  classAverage: number;
  classHighest?: number;
  classLowest?: number;
  gpa?: number;
  affectiveDomain: AffectiveDomain;
  psychomotorDomain: PsychomotorDomain;
  earlyYearsMilestones?: any;
  attendanceSummary?: any;
  formTutorRemark?: string;
  formTutorName?: string;
  formTutorSignatureDate?: string;
  sportsMasterRemark?: string;
  sportsMasterName?: string;
  guidanceCounselorRemark?: string;
  guidanceCounselorName?: string;
  principalRemark?: string;
  principalName?: string;
  principalTitle?: string;
  promotionalStatus?: string;
  nextTermBegins?: string;
  nextTermFeesEstimate?: string;
  approvalStatus: 'Draft' | 'Approved & Published' | 'Requires Correction';
  isParentViewable: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class ReportCardRepository {
  /**
   * Retrieves the authoritative report card record from PostgreSQL
   */
  async findByStudentAndTerm(
    studentId: string,
    termId: string,
    client?: PoolClient
  ): Promise<ReportCardEntity | null> {
    const studentUuidClause = isUuid(studentId)
      ? 'rc.student_id = $1'
      : 'rc.student_id IN (SELECT id FROM students WHERE admission_number = $1)';
    const termUuidClause = isUuid(termId)
      ? 'rc.term_id = $2'
      : 'rc.term_id IN (SELECT id FROM academic_terms WHERE term_name ILIKE $2 OR is_current = TRUE)';

    const res = await query<any>(
      `SELECT 
        rc.id,
        rc.school_id AS "schoolId",
        rc.student_id AS "studentId",
        rc.class_id AS "classId",
        rc.term_id AS "termId",
        rc.total_score_obtained AS "totalScoreObtained",
        rc.total_possible_score AS "totalPossibleScore",
        rc.overall_percentage AS "overallPercentage",
        rc.position_in_class AS "positionInClass",
        rc.total_students_in_class AS "totalStudentsInClass",
        rc.class_average AS "classAverage",
        rc.class_highest AS "classHighest",
        rc.class_lowest AS "classLowest",
        rc.gpa,
        rc.affective_domain AS "affectiveDomain",
        rc.psychomotor_domain AS "psychomotorDomain",
        rc.early_years_milestones AS "earlyYearsMilestones",
        rc.attendance_summary AS "attendanceSummary",
        rc.form_tutor_remark AS "formTutorRemark",
        rc.form_tutor_name AS "formTutorName",
        rc.form_tutor_signature_date AS "formTutorSignatureDate",
        rc.sports_master_remark AS "sportsMasterRemark",
        rc.sports_master_name AS "sportsMasterName",
        rc.guidance_counselor_remark AS "guidanceCounselorRemark",
        rc.guidance_counselor_name AS "guidanceCounselorName",
        rc.principal_remark AS "principalRemark",
        rc.principal_name AS "principalName",
        rc.principal_title AS "principalTitle",
        rc.promotional_status AS "promotionalStatus",
        rc.next_term_begins AS "nextTermBegins",
        rc.next_term_fees_estimate AS "nextTermFeesEstimate",
        rc.approval_status AS "approvalStatus",
        rc.is_parent_viewable AS "isParentViewable",
        rc.published_at AS "publishedAt",
        rc.created_at AS "createdAt",
        rc.updated_at AS "updatedAt"
      FROM report_cards rc
      WHERE ${studentUuidClause} AND ${termUuidClause}
      LIMIT 1;`,
      [studentId, termId],
      client
    );

    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      totalScoreObtained: Number(row.totalScoreObtained),
      totalPossibleScore: Number(row.totalPossibleScore),
      overallPercentage: Number(row.overallPercentage),
      positionInClass: Number(row.positionInClass),
      totalStudentsInClass: Number(row.totalStudentsInClass),
      classAverage: Number(row.classAverage),
      classHighest: row.classHighest ? Number(row.classHighest) : undefined,
      classLowest: row.classLowest ? Number(row.classLowest) : undefined,
      gpa: row.gpa ? Number(row.gpa) : undefined,
    };
  }

  /**
   * Retrieves the published report card for parent viewing.
   * Enforces: approval_status = 'Approved & Published' AND is_parent_viewable = TRUE.
   */
  async getPublishedReportCard(
    studentId: string,
    termId?: string,
    schoolId?: string,
    client?: PoolClient
  ): Promise<{ isPublished: boolean; reportCard?: StudentReportCard; reason?: string }> {
    // 1. Resolve term if not explicitly supplied
    let targetTermId = termId;
    if (!targetTermId) {
      // Find latest published term for this student
      const publishedTermRes = await query<{ term_id: string }>(
        `SELECT term_id FROM report_cards 
         WHERE student_id = $1 AND is_parent_viewable = TRUE AND approval_status = 'Approved & Published'
         ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT 1;`,
        [studentId],
        client
      );
      targetTermId = publishedTermRes.rows[0]?.term_id;

      if (!targetTermId) {
        // Fallback to active term
        const activeTermRes = await query<{ id: string }>(
          'SELECT id FROM academic_terms WHERE is_current = TRUE LIMIT 1;',
          [],
          client
        );
        targetTermId = activeTermRes.rows[0]?.id;
      }
    }

    if (!targetTermId) {
      return { isPublished: false, reason: 'TERM_NOT_FOUND' };
    }

    // 2. Fetch authoritative report_cards record
    const reportCardRow = await this.findByStudentAndTerm(studentId, targetTermId, client);

    if (!reportCardRow) {
      return {
        isPublished: false,
        reason: 'REPORT_NOT_FOUND',
      };
    }

    // 3. Strict Server-Authoritative Publication Gate
    if (!reportCardRow.isParentViewable || reportCardRow.approvalStatus !== 'Approved & Published') {
      return {
        isPublished: false,
        reason: 'NOT_PUBLISHED_FOR_PARENTS',
      };
    }

    // 4. Resolve School ID
    let resolvedSchoolId = schoolId || reportCardRow.schoolId;
    if (!resolvedSchoolId) {
      const studentSchoolQuery = isUuid(studentId)
        ? 'SELECT school_id FROM students WHERE id = $1 LIMIT 1;'
        : 'SELECT school_id FROM students WHERE admission_number = $1 LIMIT 1;';
      const studentSchoolRes = await query<{ school_id: string }>(
        studentSchoolQuery,
        [studentId],
        client
      );
      resolvedSchoolId = studentSchoolRes.rows[0]?.school_id;
    }

    // 5. Fetch comprehensive terminal results
    const academicResult = await academicResultRepository.getStudentTermResult(
      resolvedSchoolId,
      studentId,
      targetTermId,
      client
    );

    // 6. Assemble complete StudentReportCard
    const studentReportCard: StudentReportCard = {
      id: reportCardRow.id,
      studentId: studentId,
      arm: ((academicResult.student.classArm as any) || 'secondary') as any,
      academicYear: (academicResult.term.sessionName || '2025/2026') as any,
      term: academicResult.term.name as any,
      classLevel: academicResult.student.classLevel as any,
      scores: academicResult.subjects.map((s) => ({
        studentId: studentId,
        subjectId: s.subjectId,
        classLevel: academicResult.student.classLevel as any,
        term: academicResult.term.name as any,
        academicYear: (academicResult.term.sessionName || '2025/2026') as any,
        ca1: Math.round(s.caScore / 4),
        ca2: Math.round(s.caScore / 4),
        assignment: Math.round(s.caScore / 4),
        attendance: Math.round(s.caScore / 4),
        totalCa: s.caScore,
        examScore: s.examScore,
        totalScore: s.totalScore,
        grade: s.grade as any,
        remark: s.remark,
      })),
      totalScoreObtained: reportCardRow.totalScoreObtained || academicResult.summary.totalScoreObtained,
      totalPossibleScore: reportCardRow.totalPossibleScore || academicResult.summary.totalPossibleScore,
      overallPercentage: reportCardRow.overallPercentage || academicResult.summary.averageScore,
      positionInClass: (typeof reportCardRow.positionInClass === 'number' && reportCardRow.positionInClass > 0)
        ? reportCardRow.positionInClass
        : (typeof academicResult.summary.classPosition === 'number' && academicResult.summary.classPosition > 0)
          ? academicResult.summary.classPosition
          : undefined,
      totalStudentsInClass: (typeof reportCardRow.totalStudentsInClass === 'number' && reportCardRow.totalStudentsInClass > 0)
        ? reportCardRow.totalStudentsInClass
        : (typeof academicResult.summary.totalStudentsInClass === 'number' && academicResult.summary.totalStudentsInClass > 0)
          ? academicResult.summary.totalStudentsInClass
          : undefined,
      classAverage: reportCardRow.classAverage || academicResult.summary.averageScore,
      classHighest: reportCardRow.classHighest,
      classLowest: reportCardRow.classLowest,
      gpa: reportCardRow.gpa,
      affective: (reportCardRow.affectiveDomain && Object.keys(reportCardRow.affectiveDomain).length > 0)
        ? reportCardRow.affectiveDomain
        : null as any,
      psychomotor: (reportCardRow.psychomotorDomain && Object.keys(reportCardRow.psychomotorDomain).length > 0)
        ? reportCardRow.psychomotorDomain
        : null as any,
      attendance: reportCardRow.attendanceSummary || null,
      formTutorRemark: reportCardRow.formTutorRemark || undefined,
      formTutorName: reportCardRow.formTutorName || undefined,
      formTutorSignatureDate: reportCardRow.formTutorSignatureDate || undefined,
      sportsMasterRemark: reportCardRow.sportsMasterRemark || undefined,
      sportsMasterName: reportCardRow.sportsMasterName || undefined,
      guidanceCounselorRemark: reportCardRow.guidanceCounselorRemark || undefined,
      guidanceCounselorName: reportCardRow.guidanceCounselorName || undefined,
      principalRemark: reportCardRow.principalRemark || undefined,
      principalName: reportCardRow.principalName || undefined,
      principalTitle: reportCardRow.principalTitle || undefined,
      promotionalStatus: reportCardRow.promotionalStatus as any,
      nextTermBegins: reportCardRow.nextTermBegins || undefined,
      nextTermFeesEstimate: reportCardRow.nextTermFeesEstimate || undefined,
      approvalStatus: reportCardRow.approvalStatus,
      isParentViewable: reportCardRow.isParentViewable,
    };

    return {
      isPublished: true,
      reportCard: studentReportCard,
    };
  }

  /**
   * Retrieves a student's domain assessment for a specific term from PostgreSQL.
   * Returns empty/unassessed object if not yet evaluated (zero synthetic defaults).
   */
  async getStudentDomainAssessment(
    schoolId: string,
    studentId: string,
    termId?: string,
    client?: PoolClient
  ): Promise<StudentDomainAssessment> {
    // 1. Verify student exists and belongs to school
    const stuQuery = isUuid(studentId)
      ? `SELECT s.id, s.school_id, s.current_class_id, s.first_name, s.surname, s.full_name, s.admission_number,
               c.name as class_name, c.level as class_level, c.arm as class_arm
         FROM students s
         LEFT JOIN classes c ON s.current_class_id = c.id
         WHERE s.id = $1 LIMIT 1;`
      : `SELECT s.id, s.school_id, s.current_class_id, s.first_name, s.surname, s.full_name, s.admission_number,
               c.name as class_name, c.level as class_level, c.arm as class_arm
         FROM students s
         LEFT JOIN classes c ON s.current_class_id = c.id
         WHERE s.admission_number = $1 LIMIT 1;`;

    const stuRes = await query<{
      id: string;
      school_id: string;
      current_class_id: string;
      first_name?: string;
      surname?: string;
      full_name?: string;
      admission_number: string;
      class_name: string;
      class_level: string;
      class_arm: string;
    }>(
      stuQuery,
      [studentId],
      client
    );

    if (!stuRes.rows[0]) {
      throw new Error('STUDENT_NOT_FOUND: Student record not found.');
    }
    const student = stuRes.rows[0];
    if (student.school_id !== schoolId) {
      throw new Error('TENANT_ISOLATION_VIOLATION: Student belongs to another school tenant.');
    }

    // 2. Resolve term
    let resolvedTermId = termId || '';
    let termName = '';
    const termRes = isUuid(termId || '')
      ? await query<{ id: string; term_name: string }>(
          'SELECT id, term_name FROM academic_terms WHERE id = $1 LIMIT 1;',
          [termId],
          client
        )
      : { rows: [] };
    if (termRes.rows[0]) {
      resolvedTermId = termRes.rows[0].id;
      termName = termRes.rows[0].term_name;
    } else {
      const fallbackTerm = await query<{ id: string; term_name: string }>(
        'SELECT id, term_name FROM academic_terms WHERE term_name ILIKE $1 OR is_current = TRUE ORDER BY is_current DESC LIMIT 1;',
        [termId || '%'],
        client
      );
      if (!fallbackTerm.rows[0]) {
        throw new Error('TERM_NOT_FOUND: Academic term not found.');
      }
      resolvedTermId = fallbackTerm.rows[0].id;
      termName = fallbackTerm.rows[0].term_name;
    }

    // 3. Query report_cards
    const rcRes = await query<any>(
      `SELECT * FROM report_cards WHERE student_id = $1 AND term_id = $2 LIMIT 1;`,
      [student.id, resolvedTermId],
      client
    );

    const rc = rcRes.rows[0];
    const affective = (rc?.affective_domain && typeof rc.affective_domain === 'object') ? rc.affective_domain : {};
    const psychomotor = (rc?.psychomotor_domain && typeof rc.psychomotor_domain === 'object') ? rc.psychomotor_domain : {};
    const remarks = {
      formTutorRemark: rc?.form_tutor_remark || null,
      sportsMasterRemark: rc?.sports_master_remark || null,
      guidanceCounselorRemark: rc?.guidance_counselor_remark || null,
      principalRemark: rc?.principal_remark || null,
    };

    const statusEval = evaluateDomainStatus(affective, psychomotor, remarks, rc?.approval_status);

    return {
      studentId: student.id,
      studentName: student.full_name || `${student.first_name || ''} ${student.surname || ''}`.trim() || student.admission_number,
      admissionNumber: student.admission_number,
      classId: student.current_class_id,
      className: student.class_name,
      classLevel: student.class_level,
      classArm: student.class_arm,
      termId: resolvedTermId,
      termName,
      affective,
      psychomotor,
      formTutorRemark: remarks.formTutorRemark,
      formTutorName: rc?.form_tutor_name || null,
      formTutorSignatureDate: rc?.form_tutor_signature_date || null,
      sportsMasterRemark: remarks.sportsMasterRemark,
      sportsMasterName: rc?.sports_master_name || null,
      guidanceCounselorRemark: remarks.guidanceCounselorRemark,
      guidanceCounselorName: rc?.guidance_counselor_name || null,
      principalRemark: remarks.principalRemark,
      principalName: rc?.principal_name || null,
      principalTitle: rc?.principal_title || null,
      approvalStatus: rc?.approval_status || 'Draft',
      isAssessed: statusEval.isAssessed,
      status: statusEval.status,
      updatedAt: rc?.updated_at || undefined,
    };
  }

  /**
   * Retrieves class-level domain progress and status for all enrolled students.
   * Calculated strictly from PostgreSQL authoritative records.
   */
  async getClassDomainAssessments(
    schoolId: string,
    classId: string,
    termId?: string,
    client?: PoolClient
  ): Promise<ClassDomainProgress> {
    // 1. Resolve class
    let targetClassId = classId;
    let clsRes = isUuid(classId)
      ? await query<{ id: string; school_id: string; name: string; level: string; arm: string }>(
          'SELECT id, school_id, name, level, arm FROM classes WHERE id = $1 LIMIT 1;',
          [classId],
          client
        )
      : { rows: [] };

    if (!clsRes.rows[0]) {
      // Try resolving by name or level in the school
      clsRes = await query<{ id: string; school_id: string; name: string; level: string; arm: string }>(
        'SELECT id, school_id, name, level, arm FROM classes WHERE (name ILIKE $1 OR level ILIKE $1) AND school_id = $2 LIMIT 1;',
        [classId, schoolId],
        client
      );
    }

    if (!clsRes.rows[0]) {
      throw new Error('CLASS_NOT_FOUND: Class record not found.');
    }
    const cls = clsRes.rows[0];
    if (cls.school_id !== schoolId) {
      throw new Error('TENANT_ISOLATION_VIOLATION: Class belongs to another school tenant.');
    }
    targetClassId = cls.id;

    // 2. Resolve term
    let resolvedTermId = termId || '';
    let termName = '';
    const termRes = isUuid(termId || '')
      ? await query<{ id: string; term_name: string }>(
          'SELECT id, term_name FROM academic_terms WHERE id = $1 LIMIT 1;',
          [termId],
          client
        )
      : { rows: [] };
    if (termRes.rows[0]) {
      resolvedTermId = termRes.rows[0].id;
      termName = termRes.rows[0].term_name;
    } else {
      const fallbackTerm = await query<{ id: string; term_name: string }>(
        'SELECT id, term_name FROM academic_terms WHERE term_name ILIKE $1 OR is_current = TRUE ORDER BY is_current DESC LIMIT 1;',
        [termId || '%'],
        client
      );
      if (!fallbackTerm.rows[0]) {
        throw new Error('TERM_NOT_FOUND: Academic term not found.');
      }
      resolvedTermId = fallbackTerm.rows[0].id;
      termName = fallbackTerm.rows[0].term_name;
    }

    // 3. Query students enrolled in class with domain assessment report card
    const studentsRes = await query<any>(
      `SELECT 
        s.id as student_id,
        s.admission_number,
        s.first_name,
        s.surname,
        s.full_name,
        s.avatar_url,
        c.id as class_id,
        c.name as class_name,
        c.level as class_level,
        c.arm as class_arm,
        rc.id as report_card_id,
        rc.affective_domain,
        rc.psychomotor_domain,
        rc.form_tutor_remark,
        rc.form_tutor_name,
        rc.form_tutor_signature_date,
        rc.sports_master_remark,
        rc.sports_master_name,
        rc.guidance_counselor_remark,
        rc.guidance_counselor_name,
        rc.principal_remark,
        rc.principal_name,
        rc.principal_title,
        rc.approval_status,
        rc.updated_at
      FROM students s
      JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN report_cards rc ON rc.student_id = s.id AND rc.term_id = $2
      WHERE s.current_class_id = $1 AND s.school_id = $3
      ORDER BY COALESCE(s.surname, s.full_name) ASC, s.first_name ASC;`,
      [targetClassId, resolvedTermId, schoolId],
      client
    );

    let assessedCount = 0;
    let inProgressCount = 0;
    let unassessedCount = 0;
    let returnedCount = 0;

    const studentList: StudentDomainAssessment[] = studentsRes.rows.map((row) => {
      const affective = (row.affective_domain && typeof row.affective_domain === 'object') ? row.affective_domain : {};
      const psychomotor = (row.psychomotor_domain && typeof row.psychomotor_domain === 'object') ? row.psychomotor_domain : {};
      const remarks = {
        formTutorRemark: row.form_tutor_remark || null,
        sportsMasterRemark: row.sports_master_remark || null,
        guidanceCounselorRemark: row.guidance_counselor_remark || null,
        principalRemark: row.principal_remark || null,
      };

      const evalResult = evaluateDomainStatus(affective, psychomotor, remarks, row.approval_status);

      if (evalResult.status === 'Saved') assessedCount++;
      else if (evalResult.status === 'In progress') inProgressCount++;
      else if (evalResult.status === 'Returned for correction') returnedCount++;
      else unassessedCount++;

      return {
        studentId: row.student_id,
        studentName: row.full_name || `${row.first_name || ''} ${row.surname || ''}`.trim() || row.admission_number,
        admissionNumber: row.admission_number,
        classId: row.class_id,
        className: row.class_name,
        classLevel: row.class_level,
        classArm: row.class_arm,
        termId: resolvedTermId,
        termName,
        affective,
        psychomotor,
        formTutorRemark: remarks.formTutorRemark,
        formTutorName: row.form_tutor_name || null,
        formTutorSignatureDate: row.form_tutor_signature_date || null,
        sportsMasterRemark: remarks.sportsMasterRemark,
        sportsMasterName: row.sports_master_name || null,
        guidanceCounselorRemark: remarks.guidanceCounselorRemark,
        guidanceCounselorName: row.guidance_counselor_name || null,
        principalRemark: remarks.principalRemark,
        principalName: row.principal_name || null,
        principalTitle: row.principal_title || null,
        approvalStatus: row.approval_status || 'Draft',
        isAssessed: evalResult.isAssessed,
        status: evalResult.status,
        updatedAt: row.updated_at || undefined,
      };
    });

    return {
      classId: cls.id,
      className: cls.name,
      classLevel: cls.level,
      classArm: cls.arm,
      termId: resolvedTermId,
      termName,
      totalStudents: studentList.length,
      assessedCount,
      inProgressCount,
      unassessedCount,
      returnedCount,
      students: studentList,
    };
  }

  /**
   * Atomically saves a student's affective domain, psychomotor domain, and authorized remarks.
   * Enforces server-authoritative RBAC, tenant isolation, and strict 1-5 integer rating validation.
   */
  async saveStudentDomainAssessment(
    input: SaveDomainAssessmentInput,
    externalClient?: PoolClient
  ): Promise<StudentDomainAssessment> {
    const execute = async (client: PoolClient): Promise<StudentDomainAssessment> => {
      const { authenticatedUser, schoolId, studentId } = input;

      // 1. Role validation
      if (authenticatedUser.role === 'parent' || authenticatedUser.role === 'student') {
        throw new Error('FORBIDDEN_ROLE: Parents and students are not permitted to assess student domains.');
      }

      // 2. Tenant isolation validation
      if (!authenticatedUser.isSuperAdmin && !authenticatedUser.isStateOfficer) {
        if (authenticatedUser.schoolId && authenticatedUser.schoolId !== schoolId) {
          throw new Error('TENANT_ISOLATION_VIOLATION: Cannot modify domains for a student belonging to another school.');
        }
      }

      // 3. Verify student exists and belongs to school
      const stuQuery = isUuid(studentId)
        ? 'SELECT id, school_id, current_class_id, first_name, surname, full_name, admission_number FROM students WHERE id = $1 LIMIT 1;'
        : 'SELECT id, school_id, current_class_id, first_name, surname, full_name, admission_number FROM students WHERE admission_number = $1 LIMIT 1;';

      const stuRes = await query<{
        id: string;
        school_id: string;
        current_class_id: string;
        first_name?: string;
        surname?: string;
        full_name?: string;
        admission_number: string;
      }>(
        stuQuery,
        [studentId],
        client
      );

      if (!stuRes.rows[0]) {
        throw new Error('STUDENT_NOT_FOUND: Student record not found.');
      }
      const student = stuRes.rows[0];
      if (student.school_id !== schoolId) {
        throw new Error('TENANT_ISOLATION_VIOLATION: Student belongs to another school tenant.');
      }

      // 4. Resolve class
      let targetClassId = input.classId || student.current_class_id;
      let clsRes = isUuid(targetClassId)
        ? await query<{
            id: string;
            school_id: string;
            name: string;
            level: string;
            arm: string;
            form_master_id: string | null;
          }>(
            'SELECT id, school_id, name, level, arm, form_master_id FROM classes WHERE id = $1 AND school_id = $2 LIMIT 1;',
            [targetClassId, schoolId],
            client
          )
        : { rows: [] };

      if (!clsRes.rows[0] && targetClassId) {
        // Fallback: match by name or level in the school tenant
        clsRes = await query<{
          id: string;
          school_id: string;
          name: string;
          level: string;
          arm: string;
          form_master_id: string | null;
        }>(
          'SELECT id, school_id, name, level, arm, form_master_id FROM classes WHERE (name ILIKE $1 OR level ILIKE $1) AND school_id = $2 LIMIT 1;',
          [targetClassId, schoolId],
          client
        );
      }

      if (!clsRes.rows[0] && student.current_class_id) {
        clsRes = isUuid(student.current_class_id)
          ? await query<{
              id: string;
              school_id: string;
              name: string;
              level: string;
              arm: string;
              form_master_id: string | null;
            }>(
              'SELECT id, school_id, name, level, arm, form_master_id FROM classes WHERE id = $1 AND school_id = $2 LIMIT 1;',
              [student.current_class_id, schoolId],
              client
            )
          : await query<{
              id: string;
              school_id: string;
              name: string;
              level: string;
              arm: string;
              form_master_id: string | null;
            }>(
              'SELECT id, school_id, name, level, arm, form_master_id FROM classes WHERE (name ILIKE $1 OR level ILIKE $1) AND school_id = $2 LIMIT 1;',
              [student.current_class_id, schoolId],
              client
            );
      }

      if (!clsRes.rows[0]) {
        throw new Error('CLASS_NOT_FOUND: Class record not found in school tenant.');
      }
      const cls = clsRes.rows[0];

      // 5. If user is a teacher, verify class assignment or allocation
      if (authenticatedUser.role === 'teacher') {
        const staffRes = await query<{ id: string; assigned_class_id: string | null }>(
          'SELECT id, assigned_class_id FROM staff WHERE user_id = $1 AND school_id = $2 LIMIT 1;',
          [authenticatedUser.id, schoolId],
          client
        );

        if (staffRes.rows.length > 0) {
          const staff = staffRes.rows[0];
          const isAssigned = staff.assigned_class_id === cls.id;
          const isFormMaster = cls.form_master_id === staff.id;

          const allocRes = await query<{ id: string }>(
            'SELECT id FROM class_subject_allocations WHERE class_id = $1 AND teacher_id = $2 AND school_id = $3 LIMIT 1;',
            [cls.id, staff.id, schoolId],
            client
          );
          const hasAllocation = allocRes.rows.length > 0;

          if (!isAssigned && !isFormMaster && !hasAllocation) {
            throw new Error('UNAUTHORIZED_CLASS_ACCESS: Teacher is not authorized to assess students in this class.');
          }
        }
      }

      // 6. Resolve term
      let resolvedTermId = input.termId;
      let termName = '';
      const termRes = isUuid(input.termId)
        ? await query<{ id: string; term_name: string }>(
            'SELECT id, term_name FROM academic_terms WHERE id = $1 LIMIT 1;',
            [input.termId],
            client
          )
        : { rows: [] };
      if (termRes.rows[0]) {
        resolvedTermId = termRes.rows[0].id;
        termName = termRes.rows[0].term_name;
      } else {
        const fallbackTerm = await query<{ id: string; term_name: string }>(
          'SELECT id, term_name FROM academic_terms WHERE term_name ILIKE $1 OR is_current = TRUE ORDER BY is_current DESC LIMIT 1;',
          [input.termId],
          client
        );
        if (!fallbackTerm.rows[0]) {
          throw new Error('TERM_NOT_FOUND: Academic term not found.');
        }
        resolvedTermId = fallbackTerm.rows[0].id;
        termName = fallbackTerm.rows[0].term_name;
      }

      // 7. Validate and sanitize Affective Domain ratings
      const cleanAffective: Record<string, number> = {};
      if (input.affective && typeof input.affective === 'object') {
        for (const [key, val] of Object.entries(input.affective)) {
          if (val === null || val === undefined) continue;
          if (!AFFECTIVE_TRAITS.includes(key as any)) {
            throw new Error(`INVALID_TRAIT: Unknown affective trait '${key}'.`);
          }
          if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5) {
            throw new Error(`INVALID_RATING: Trait '${key}' rating must be an integer between 1 and 5 (received ${val}).`);
          }
          cleanAffective[key] = val;
        }
      }

      // 8. Validate and sanitize Psychomotor Domain ratings
      const cleanPsychomotor: Record<string, number> = {};
      if (input.psychomotor && typeof input.psychomotor === 'object') {
        for (const [key, val] of Object.entries(input.psychomotor)) {
          if (val === null || val === undefined) continue;
          if (!PSYCHOMOTOR_TRAITS.includes(key as any)) {
            throw new Error(`INVALID_TRAIT: Unknown psychomotor trait '${key}'.`);
          }
          if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5) {
            throw new Error(`INVALID_RATING: Trait '${key}' rating must be an integer between 1 and 5 (received ${val}).`);
          }
          cleanPsychomotor[key] = val;
        }
      }

      // 9. Validate Remarks authorization
      const isLeadership = [
        'super_admin',
        'state_officer',
        'principal',
        'vice_principal',
        'headmistress',
        'head_kindergarten',
      ].includes(authenticatedUser.role);

      if (input.principalRemark !== undefined && input.principalRemark !== null && !isLeadership) {
        throw new Error('FORBIDDEN_FIELD: Only school leadership (Principal/Head) is authorized to enter or update the principal remark.');
      }

      let formTutorName = input.formTutorName || null;
      let formTutorSignatureDate = null;
      if (input.formTutorRemark && input.formTutorRemark.trim()) {
        formTutorName = formTutorName || authenticatedUser.fullName;
        formTutorSignatureDate = new Date().toISOString().split('T')[0];
      }

      let principalName = input.principalName || null;
      let principalTitle = input.principalTitle || null;
      if (isLeadership && input.principalRemark && input.principalRemark.trim()) {
        principalName = principalName || authenticatedUser.fullName;
        principalTitle = principalTitle || (authenticatedUser.role === 'principal' ? 'Principal' : 'Head of Academics');
      }

      // 10. Atomic Upsert into report_cards
      const upsertSql = `
        INSERT INTO report_cards (
          school_id, student_id, class_id, term_id,
          affective_domain, psychomotor_domain,
          form_tutor_remark, form_tutor_name, form_tutor_signature_date,
          sports_master_remark, sports_master_name,
          guidance_counselor_remark, guidance_counselor_name,
          principal_remark, principal_name, principal_title,
          approval_status, is_parent_viewable,
          total_score_obtained, total_possible_score, overall_percentage,
          position_in_class, total_students_in_class, class_average,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5::jsonb, $6::jsonb,
          $7, $8, $9,
          $10, $11,
          $12, $13,
          $14, $15, $16,
          COALESCE($17, 'Draft'), FALSE,
          0, 0, 0, 1, 1, 0,
          NOW(), NOW()
        )
        ON CONFLICT (student_id, term_id) DO UPDATE SET
          class_id = EXCLUDED.class_id,
          affective_domain = $5::jsonb,
          psychomotor_domain = $6::jsonb,
          form_tutor_remark = CASE WHEN $7 IS NOT NULL THEN $7 ELSE report_cards.form_tutor_remark END,
          form_tutor_name = CASE WHEN $8 IS NOT NULL THEN $8 ELSE report_cards.form_tutor_name END,
          form_tutor_signature_date = CASE WHEN $9 IS NOT NULL THEN $9::date ELSE report_cards.form_tutor_signature_date END,
          sports_master_remark = CASE WHEN $10 IS NOT NULL THEN $10 ELSE report_cards.sports_master_remark END,
          sports_master_name = CASE WHEN $11 IS NOT NULL THEN $11 ELSE report_cards.sports_master_name END,
          guidance_counselor_remark = CASE WHEN $12 IS NOT NULL THEN $12 ELSE report_cards.guidance_counselor_remark END,
          guidance_counselor_name = CASE WHEN $13 IS NOT NULL THEN $13 ELSE report_cards.guidance_counselor_name END,
          principal_remark = CASE WHEN $18 = TRUE THEN (CASE WHEN $14 IS NOT NULL THEN $14 ELSE report_cards.principal_remark END) ELSE report_cards.principal_remark END,
          principal_name = CASE WHEN $18 = TRUE THEN (CASE WHEN $15 IS NOT NULL THEN $15 ELSE report_cards.principal_name END) ELSE report_cards.principal_name END,
          principal_title = CASE WHEN $18 = TRUE THEN (CASE WHEN $16 IS NOT NULL THEN $16 ELSE report_cards.principal_title END) ELSE report_cards.principal_title END,
          approval_status = CASE WHEN $17 IS NOT NULL THEN $17 ELSE report_cards.approval_status END,
          updated_at = NOW()
        RETURNING *;
      `;

      const res = await query<any>(
        upsertSql,
        [
          schoolId,
          studentId,
          cls.id,
          resolvedTermId,
          JSON.stringify(cleanAffective),
          JSON.stringify(cleanPsychomotor),
          input.formTutorRemark ?? null,
          formTutorName,
          formTutorSignatureDate,
          input.sportsMasterRemark ?? null,
          input.sportsMasterName ?? null,
          input.guidanceCounselorRemark ?? null,
          input.guidanceCounselorName ?? null,
          input.principalRemark ?? null,
          principalName,
          principalTitle,
          input.approvalStatus ?? null,
          isLeadership,
        ],
        client
      );

      const savedRow = res.rows[0];
      const savedAffective = savedRow.affective_domain || {};
      const savedPsychomotor = savedRow.psychomotor_domain || {};
      const savedRemarks = {
        formTutorRemark: savedRow.form_tutor_remark || null,
        sportsMasterRemark: savedRow.sports_master_remark || null,
        guidanceCounselorRemark: savedRow.guidance_counselor_remark || null,
        principalRemark: savedRow.principal_remark || null,
      };

      const evalResult = evaluateDomainStatus(savedAffective, savedPsychomotor, savedRemarks, savedRow.approval_status);

      return {
        studentId: student.id,
        studentName: student.full_name || `${student.first_name || ''} ${student.surname || ''}`.trim() || student.admission_number,
        admissionNumber: student.admission_number,
        classId: cls.id,
        className: cls.name,
        classLevel: cls.level,
        classArm: cls.arm,
        termId: resolvedTermId,
        termName,
        affective: savedAffective,
        psychomotor: savedPsychomotor,
        formTutorRemark: savedRemarks.formTutorRemark,
        formTutorName: savedRow.form_tutor_name || null,
        formTutorSignatureDate: savedRow.form_tutor_signature_date || null,
        sportsMasterRemark: savedRemarks.sportsMasterRemark,
        sportsMasterName: savedRow.sports_master_name || null,
        guidanceCounselorRemark: savedRemarks.guidanceCounselorRemark,
        guidanceCounselorName: savedRow.guidance_counselor_name || null,
        principalRemark: savedRemarks.principalRemark,
        principalName: savedRow.principal_name || null,
        principalTitle: savedRow.principal_title || null,
        approvalStatus: savedRow.approval_status || 'Draft',
        isAssessed: evalResult.isAssessed,
        status: evalResult.status,
        updatedAt: savedRow.updated_at,
      };
    };

    if (externalClient) {
      return execute(externalClient);
    }
    return withTransaction((client) => execute(client));
  }

  /**
   * Sets report publication state (Principal/Exam Officer authorization only)
   */
  async setReportCardPublication(data: {
    schoolId: string;
    studentId: string;
    termId: string;
    isParentViewable: boolean;
    approvalStatus?: 'Draft' | 'Approved & Published' | 'Requires Correction';
    publishedBy?: string;
  }, client?: PoolClient): Promise<ReportCardEntity> {
    // 1. Resolve student and class info
    const stuQuery = isUuid(data.studentId)
      ? 'SELECT id, school_id, current_class_id FROM students WHERE id = $1 LIMIT 1;'
      : 'SELECT id, school_id, current_class_id FROM students WHERE admission_number = $1 LIMIT 1;';
    const stuRes = await query<{ id: string; school_id: string; current_class_id: string }>(
      stuQuery,
      [data.studentId],
      client
    );
    if (!stuRes.rows[0]) {
      throw new Error('STUDENT_NOT_FOUND: Student record not found.');
    }
    if (stuRes.rows[0].school_id !== data.schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Student belongs to another school tenant.');
    }

    const resolvedStudentId = stuRes.rows[0].id;
    const classId = stuRes.rows[0].current_class_id;

    let resolvedTermId = data.termId;
    const termRes = isUuid(data.termId)
      ? await query<{ id: string }>('SELECT id FROM academic_terms WHERE id = $1 LIMIT 1;', [data.termId], client)
      : { rows: [] };
    if (termRes.rows[0]) {
      resolvedTermId = termRes.rows[0].id;
    } else {
      const fb = await query<{ id: string }>('SELECT id FROM academic_terms WHERE term_name ILIKE $1 OR is_current = TRUE ORDER BY is_current DESC LIMIT 1;', [data.termId], client);
      if (fb.rows[0]) resolvedTermId = fb.rows[0].id;
    }

    const approvalStatus = data.approvalStatus || (data.isParentViewable ? 'Approved & Published' : 'Draft');

    // 2. Fetch or compute results
    const academicResult = await academicResultRepository.getStudentTermResult(
      data.schoolId,
      resolvedStudentId,
      resolvedTermId,
      client
    );

    const publishedAt = data.isParentViewable ? new Date().toISOString() : null;

    const upsertSql = `
      INSERT INTO report_cards (
        school_id, student_id, class_id, term_id,
        total_score_obtained, total_possible_score, overall_percentage,
        position_in_class, total_students_in_class, class_average,
        approval_status, is_parent_viewable, published_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (student_id, term_id) DO UPDATE SET
        class_id = EXCLUDED.class_id,
        total_score_obtained = EXCLUDED.total_score_obtained,
        total_possible_score = EXCLUDED.total_possible_score,
        overall_percentage = EXCLUDED.overall_percentage,
        position_in_class = EXCLUDED.position_in_class,
        total_students_in_class = EXCLUDED.total_students_in_class,
        class_average = EXCLUDED.class_average,
        approval_status = EXCLUDED.approval_status,
        is_parent_viewable = EXCLUDED.is_parent_viewable,
        published_at = EXCLUDED.published_at,
        updated_at = NOW()
      RETURNING *;
    `;

    const res = await query<any>(
      upsertSql,
      [
        data.schoolId,
        data.studentId,
        classId,
        data.termId,
        academicResult.summary.totalScoreObtained,
        academicResult.summary.totalPossibleScore,
        academicResult.summary.averageScore,
        (academicResult.summary.classPosition && academicResult.summary.classPosition > 0) ? academicResult.summary.classPosition : null,
        (academicResult.summary.totalStudentsInClass && academicResult.summary.totalStudentsInClass > 0) ? academicResult.summary.totalStudentsInClass : null,
        academicResult.summary.averageScore,
        approvalStatus,
        data.isParentViewable,
        publishedAt,
      ],
      client
    );

    return res.rows[0];
  }

  /**
   * List all published terms for a student
   */
  async listPublishedTermsForStudent(studentId: string, client?: PoolClient): Promise<Array<{
    termId: string;
    termName: string;
    sessionName: string;
    publishedAt: string;
    approvalStatus: string;
  }>> {
    const sql = `
      SELECT 
        rc.term_id AS "termId",
        t.term_name AS "termName",
        s.session_name AS "sessionName",
        rc.published_at AS "publishedAt",
        rc.approval_status AS "approvalStatus"
      FROM report_cards rc
      JOIN academic_terms t ON rc.term_id = t.id
      JOIN academic_sessions s ON t.session_id = s.id
      WHERE rc.student_id = $1 
        AND rc.is_parent_viewable = TRUE 
        AND rc.approval_status = 'Approved & Published'
      ORDER BY rc.published_at DESC NULLS LAST;
    `;
    const res = await query<any>(sql, [studentId], client);
    return res.rows;
  }
}

export const reportCardRepository = new ReportCardRepository();
