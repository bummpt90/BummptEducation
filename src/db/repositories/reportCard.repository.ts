/**
-- ============================================================================
-- BummptEducation — Report Card & Publication Data Access Layer
-- Phase 8B: Server-Authoritative Report Card Repository
-- ============================================================================
*/

import type { PoolClient } from 'pg';
import { query } from '../client';
import { academicResultRepository } from './academicResult.repository';
import type { StudentReportCard, AffectiveDomain, PsychomotorDomain } from '../../types';

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
    const res = await query<any>(
      `SELECT 
        id,
        school_id AS "schoolId",
        student_id AS "studentId",
        class_id AS "classId",
        term_id AS "termId",
        total_score_obtained AS "totalScoreObtained",
        total_possible_score AS "totalPossibleScore",
        overall_percentage AS "overallPercentage",
        position_in_class AS "positionInClass",
        total_students_in_class AS "totalStudentsInClass",
        class_average AS "classAverage",
        class_highest AS "classHighest",
        class_lowest AS "classLowest",
        gpa,
        affective_domain AS "affectiveDomain",
        psychomotor_domain AS "psychomotorDomain",
        early_years_milestones AS "earlyYearsMilestones",
        attendance_summary AS "attendanceSummary",
        form_tutor_remark AS "formTutorRemark",
        form_tutor_name AS "formTutorName",
        form_tutor_signature_date AS "formTutorSignatureDate",
        sports_master_remark AS "sportsMasterRemark",
        sports_master_name AS "sportsMasterName",
        guidance_counselor_remark AS "guidanceCounselorRemark",
        guidance_counselor_name AS "guidanceCounselorName",
        principal_remark AS "principalRemark",
        principal_name AS "principalName",
        principal_title AS "principalTitle",
        promotional_status AS "promotionalStatus",
        next_term_begins AS "nextTermBegins",
        next_term_fees_estimate AS "nextTermFeesEstimate",
        approval_status AS "approvalStatus",
        is_parent_viewable AS "isParentViewable",
        published_at AS "publishedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM report_cards
      WHERE student_id = $1 AND term_id = $2
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
      const studentSchoolRes = await query<{ school_id: string }>(
        'SELECT school_id FROM students WHERE id = $1 LIMIT 1;',
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
      positionInClass: reportCardRow.positionInClass || academicResult.summary.classPosition || 1,
      totalStudentsInClass: reportCardRow.totalStudentsInClass || academicResult.summary.totalStudentsInClass || 1,
      classAverage: reportCardRow.classAverage || academicResult.summary.averageScore,
      classHighest: reportCardRow.classHighest,
      classLowest: reportCardRow.classLowest,
      gpa: reportCardRow.gpa,
      affective: reportCardRow.affectiveDomain || {
        punctuality: 5,
        neatness: 5,
        politeness: 5,
        honesty: 5,
        peerRelationship: 5,
        leadership: 4,
        emotionalStability: 5,
        obedience: 5,
        attentiveness: 4,
        perseverance: 5,
      },
      psychomotor: reportCardRow.psychomotorDomain || {
        handwriting: 4,
        sportsAndGames: 4,
        craftsAndPractical: 4,
        verbalFluency: 5,
        musicalDramatic: 3,
        handlingOfTools: 4,
        physicalAgility: 4,
      },
      attendance: reportCardRow.attendanceSummary,
      formTutorRemark: reportCardRow.formTutorRemark || 'An exemplary student demonstrating high academic diligence and upright character.',
      formTutorName: reportCardRow.formTutorName || 'Form Tutor',
      formTutorSignatureDate: reportCardRow.formTutorSignatureDate,
      sportsMasterRemark: reportCardRow.sportsMasterRemark,
      sportsMasterName: reportCardRow.sportsMasterName,
      guidanceCounselorRemark: reportCardRow.guidanceCounselorRemark,
      guidanceCounselorName: reportCardRow.guidanceCounselorName,
      principalRemark: reportCardRow.principalRemark || 'Outstanding academic performance. Keep up the high standard.',
      principalName: reportCardRow.principalName || 'Dr. (Mrs.) Grace Nkechi Okafor',
      principalTitle: reportCardRow.principalTitle || 'Principal & Executive Director of Academics',
      promotionalStatus: reportCardRow.promotionalStatus as any,
      nextTermBegins: reportCardRow.nextTermBegins || '2026-05-04',
      nextTermFeesEstimate: reportCardRow.nextTermFeesEstimate,
      approvalStatus: reportCardRow.approvalStatus,
      isParentViewable: reportCardRow.isParentViewable,
    };

    return {
      isPublished: true,
      reportCard: studentReportCard,
    };
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
    const stuRes = await query<{ school_id: string; current_class_id: string }>(
      'SELECT school_id, current_class_id FROM students WHERE id = $1 LIMIT 1;',
      [data.studentId],
      client
    );
    if (!stuRes.rows[0]) {
      throw new Error('STUDENT_NOT_FOUND: Student record not found.');
    }
    if (stuRes.rows[0].school_id !== data.schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Student belongs to another school tenant.');
    }

    const classId = stuRes.rows[0].current_class_id;
    const approvalStatus = data.approvalStatus || (data.isParentViewable ? 'Approved & Published' : 'Draft');

    // 2. Fetch or compute results
    const academicResult = await academicResultRepository.getStudentTermResult(
      data.schoolId,
      data.studentId,
      data.termId,
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
        academicResult.summary.classPosition || 1,
        academicResult.summary.totalStudentsInClass || 1,
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
