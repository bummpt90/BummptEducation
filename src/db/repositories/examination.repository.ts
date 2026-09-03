/**
 * BummptEducation — Terminal Examination Repository
 * 
 * Provides server-authoritative tracking for terminal examination scores,
 * 60% exam weighting, grade determination, and multi-tenant isolation.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { query } from '../client';
import { calculateGrade, calculatePrimaryGrade } from '../../utils/grading';
import type { TerminalExaminationDbEntity, QueryOptions } from '../types';

export class ExaminationRepository extends BaseRepository<TerminalExaminationDbEntity> {
  protected readonly tableName = 'terminal_examinations';
  protected readonly primaryKey = 'id';
  protected readonly tenantColumn = 'school_id';
  protected readonly isMultiTenant = true;

  /**
   * Records or updates a Terminal Examination score with strict validation.
   */
  async recordExaminationScore(
    data: {
      schoolId: string;
      studentId: string;
      classId: string;
      subjectId: string;
      academicSessionId?: string | null;
      academicTermId: string;
      score: number;
      maxScore?: number;
      examDate?: string | null;
      recordedByUserId?: string | null;
      recordedByStaffId?: string | null;
    },
    client?: PoolClient
  ): Promise<TerminalExaminationDbEntity> {
    const maxScore = data.maxScore ?? 60.0;
    const score = Number(data.score);

    // 1. Strict score bounds checking
    if (isNaN(score) || score < 0) {
      throw new Error('INVALID_SCORE: Examination score cannot be less than zero.');
    }
    if (score > maxScore) {
      throw new Error(`SCORE_EXCEEDS_MAX: Examination score (${score}) exceeds the maximum permissible score (${maxScore}).`);
    }

    // 2. Tenant & School Isolation: Verify student belongs to school
    const studentCheck = await query<{ id: string; school_id: string }>(
      'SELECT id, school_id FROM students WHERE id = $1 LIMIT 1;',
      [data.studentId],
      client
    );
    if (!studentCheck.rows[0]) {
      throw new Error('STUDENT_NOT_FOUND: Specified student does not exist.');
    }
    if (studentCheck.rows[0].school_id !== data.schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Student does not belong to the specified school tenant.');
    }

    // 3. Verify class belongs to school
    const classCheck = await query<{ id: string; school_id: string; arm: string }>(
      'SELECT id, school_id, arm FROM classes WHERE id = $1 LIMIT 1;',
      [data.classId],
      client
    );
    if (!classCheck.rows[0]) {
      throw new Error('CLASS_NOT_FOUND: Specified class does not exist.');
    }
    if (classCheck.rows[0].school_id !== data.schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Class does not belong to the specified school tenant.');
    }

    // 4. Verify subject exists
    const subjectCheck = await query<{ id: string }>(
      'SELECT id FROM subjects WHERE id = $1 LIMIT 1;',
      [data.subjectId],
      client
    );
    if (!subjectCheck.rows[0]) {
      throw new Error('SUBJECT_NOT_FOUND: Specified subject does not exist.');
    }

    // 5. Verify term & resolve session
    const termCheck = await query<{ id: string; session_id: string }>(
      'SELECT id, session_id FROM academic_terms WHERE id = $1 LIMIT 1;',
      [data.academicTermId],
      client
    );
    if (!termCheck.rows[0]) {
      throw new Error('TERM_NOT_FOUND: Specified academic term does not exist.');
    }

    const resolvedSessionId = data.academicSessionId || termCheck.rows[0].session_id;
    if (data.academicSessionId && termCheck.rows[0].session_id !== data.academicSessionId) {
      throw new Error('SESSION_TERM_MISMATCH: Term does not belong to the specified academic session.');
    }

    // 6. Upsert into terminal_examinations table
    const upsertSql = `
      INSERT INTO terminal_examinations (
        school_id, student_id, class_id, subject_id, academic_session_id, academic_term_id,
        score, max_score, exam_date, recorded_by_user_id, recorded_by_staff_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      ON CONFLICT (student_id, subject_id, academic_term_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        max_score = EXCLUDED.max_score,
        exam_date = EXCLUDED.exam_date,
        recorded_by_user_id = EXCLUDED.recorded_by_user_id,
        recorded_by_staff_id = EXCLUDED.recorded_by_staff_id,
        updated_at = NOW()
      RETURNING *;
    `;

    const res = await query<TerminalExaminationDbEntity>(
      upsertSql,
      [
        data.schoolId,
        data.studentId,
        data.classId,
        data.subjectId,
        resolvedSessionId,
        data.academicTermId,
        score,
        maxScore,
        data.examDate || null,
        data.recordedByUserId || null,
        data.recordedByStaffId || null,
      ],
      client
    );

    // 7. Sync composite assessment_scores table
    await this.syncCompositeExamScore(
      {
        schoolId: data.schoolId,
        studentId: data.studentId,
        classId: data.classId,
        subjectId: data.subjectId,
        academicSessionId: resolvedSessionId,
        termId: data.academicTermId,
        examScore: score,
        arm: classCheck.rows[0].arm,
      },
      client
    );

    return res.rows[0];
  }

  /**
   * Internal helper to sync exam score and recalculate grade in `assessment_scores`.
   */
  private async syncCompositeExamScore(
    data: {
      schoolId: string;
      studentId: string;
      classId: string;
      subjectId: string;
      academicSessionId: string;
      termId: string;
      examScore: number;
      arm: string;
    },
    client?: PoolClient
  ): Promise<void> {
    try {
      // Calculate total CA score for this subject
      const caRes = await query<{ sum_score: string }>(
        `SELECT COALESCE(SUM(score), 0) AS sum_score
         FROM continuous_assessments
         WHERE student_id = $1 AND subject_id = $2 AND academic_term_id = $3;`,
        [data.studentId, data.subjectId, data.termId],
        client
      );

      const caTotal = Number(caRes.rows[0]?.sum_score || 0);
      const totalScore = caTotal + data.examScore;

      const gradeResult = data.arm === 'primary' || data.arm === 'kindergarten'
        ? calculatePrimaryGrade(totalScore)
        : calculateGrade(totalScore);

      const sql = `
        INSERT INTO assessment_scores (
          school_id, student_id, class_id, subject_id, academic_session_id, term_id,
          exam_score, grade, remark
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (student_id, subject_id, term_id)
        DO UPDATE SET
          exam_score = EXCLUDED.exam_score,
          academic_session_id = EXCLUDED.academic_session_id,
          grade = EXCLUDED.grade,
          remark = EXCLUDED.remark;
      `;

      await query(
        sql,
        [
          data.schoolId,
          data.studentId,
          data.classId,
          data.subjectId,
          data.academicSessionId,
          data.termId,
          data.examScore,
          gradeResult.grade,
          gradeResult.remark,
        ],
        client
      );
    } catch (err) {
      console.warn('[ExaminationRepository] Note on syncCompositeExamScore:', err);
    }
  }

  /**
   * Finds terminal examinations with joined student and subject details.
   */
  async findExaminations(
    schoolId: string,
    filters: {
      studentId?: string;
      classId?: string;
      subjectId?: string;
      academicTermId?: string;
      academicSessionId?: string;
    },
    options?: QueryOptions
  ): Promise<TerminalExaminationDbEntity[]> {
    const params: any[] = [schoolId];
    const conditions: string[] = ['e.school_id = $1'];

    if (filters.studentId) {
      params.push(filters.studentId);
      conditions.push(`e.student_id = $${params.length}`);
    }

    if (filters.classId) {
      params.push(filters.classId);
      conditions.push(`e.class_id = $${params.length}`);
    }

    if (filters.subjectId) {
      params.push(filters.subjectId);
      conditions.push(`e.subject_id = $${params.length}`);
    }

    if (filters.academicTermId) {
      params.push(filters.academicTermId);
      conditions.push(`e.academic_term_id = $${params.length}`);
    }

    if (filters.academicSessionId) {
      params.push(filters.academicSessionId);
      conditions.push(`e.academic_session_id = $${params.length}`);
    }

    const sql = `
      SELECT 
        e.*,
        s.full_name AS student_name,
        s.admission_number,
        sub.name AS subject_name,
        sub.code AS subject_code,
        c.name AS class_name
      FROM terminal_examinations e
      JOIN students s ON e.student_id = s.id
      JOIN subjects sub ON e.subject_id = sub.id
      JOIN classes c ON e.class_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sub.name ASC;
    `;

    return this.executeQuery<TerminalExaminationDbEntity>(sql, params, options?.client);
  }

  /**
   * Updates an examination score by its ID.
   */
  async updateExaminationScore(
    id: string,
    data: { score: number; maxScore?: number; examDate?: string | null },
    schoolId?: string,
    client?: PoolClient
  ): Promise<TerminalExaminationDbEntity> {
    const existingRes = await query<TerminalExaminationDbEntity>(
      'SELECT * FROM terminal_examinations WHERE id = $1 LIMIT 1;',
      [id],
      client
    );
    const existing = existingRes.rows[0];
    if (!existing) {
      throw new Error('EXAMINATION_NOT_FOUND: Examination record does not exist.');
    }

    if (schoolId && existing.school_id !== schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Cannot modify examination score of another school.');
    }

    const maxScore = data.maxScore ?? existing.max_score;
    const score = Number(data.score);

    if (isNaN(score) || score < 0) {
      throw new Error('INVALID_SCORE: Examination score cannot be less than zero.');
    }
    if (score > maxScore) {
      throw new Error(`SCORE_EXCEEDS_MAX: Examination score (${score}) exceeds maximum (${maxScore}).`);
    }

    const updateSql = `
      UPDATE terminal_examinations
      SET score = $1, max_score = $2, exam_date = COALESCE($3, exam_date), updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;

    const res = await query<TerminalExaminationDbEntity>(updateSql, [score, maxScore, data.examDate || null, id], client);
    return res.rows[0];
  }
}

export const examinationRepository = new ExaminationRepository();
