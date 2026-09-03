/**
 * BummptEducation — Continuous Assessment Repository
 * 
 * Provides server-authoritative tracking for continuous assessments (CA),
 * 40/60 distribution rules, score validation, and multi-tenant isolation.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { query } from '../client';
import type { ContinuousAssessmentDbEntity, QueryOptions } from '../types';

export class AssessmentRepository extends BaseRepository<ContinuousAssessmentDbEntity> {
  protected readonly tableName = 'continuous_assessments';
  protected readonly primaryKey = 'id';
  protected readonly tenantColumn = 'school_id';
  protected readonly isMultiTenant = true;

  /**
   * Records or updates a Continuous Assessment score with strict validation.
   */
  async recordContinuousAssessment(
    data: {
      schoolId: string;
      studentId: string;
      classId: string;
      subjectId: string;
      academicSessionId?: string | null;
      academicTermId: string;
      assessmentType: string; // 'CA1', 'CA2', 'ASSIGNMENT', 'PROJECT', etc.
      score: number;
      maxScore?: number;
      weightPercentage?: number;
      recordedByUserId?: string | null;
      recordedByStaffId?: string | null;
    },
    client?: PoolClient
  ): Promise<ContinuousAssessmentDbEntity> {
    const maxScore = data.maxScore ?? 10.0;
    const score = Number(data.score);

    // 1. Strict score bounds checking
    if (isNaN(score) || score < 0) {
      throw new Error('INVALID_SCORE: Assessment score cannot be less than zero.');
    }
    if (score > maxScore) {
      throw new Error(`SCORE_EXCEEDS_MAX: Assessment score (${score}) exceeds the maximum permissible score (${maxScore}).`);
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
    const classCheck = await query<{ id: string; school_id: string }>(
      'SELECT id, school_id FROM classes WHERE id = $1 LIMIT 1;',
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

    const normalizedType = data.assessmentType.trim().toUpperCase();

    // 6. Upsert into continuous_assessments table
    const upsertSql = `
      INSERT INTO continuous_assessments (
        school_id, student_id, class_id, subject_id, academic_session_id, academic_term_id,
        assessment_type, score, max_score, weight_percentage, recorded_by_user_id, recorded_by_staff_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (student_id, subject_id, academic_term_id, assessment_type)
      DO UPDATE SET
        score = EXCLUDED.score,
        max_score = EXCLUDED.max_score,
        weight_percentage = EXCLUDED.weight_percentage,
        recorded_by_user_id = EXCLUDED.recorded_by_user_id,
        recorded_by_staff_id = EXCLUDED.recorded_by_staff_id,
        updated_at = NOW()
      RETURNING *;
    `;

    const res = await query<ContinuousAssessmentDbEntity>(
      upsertSql,
      [
        data.schoolId,
        data.studentId,
        data.classId,
        data.subjectId,
        resolvedSessionId,
        data.academicTermId,
        normalizedType,
        score,
        maxScore,
        data.weightPercentage ?? 10.0,
        data.recordedByUserId || null,
        data.recordedByStaffId || null,
      ],
      client
    );

    // 7. Sync composite assessment_scores table
    await this.syncCompositeScore(
      {
        schoolId: data.schoolId,
        studentId: data.studentId,
        classId: data.classId,
        subjectId: data.subjectId,
        academicSessionId: resolvedSessionId,
        termId: data.academicTermId,
        assessmentType: normalizedType,
        score,
      },
      client
    );

    return res.rows[0];
  }

  /**
   * Internal helper to sync scores into the composite `assessment_scores` summary table.
   */
  private async syncCompositeScore(
    data: {
      schoolId: string;
      studentId: string;
      classId: string;
      subjectId: string;
      academicSessionId: string;
      termId: string;
      assessmentType: string;
      score: number;
    },
    client?: PoolClient
  ): Promise<void> {
    try {
      const type = data.assessmentType;
      let targetColumn: 'ca1_score' | 'ca2_score' | 'assignment_score' | 'attendance_score' | null = null;

      if (type === 'CA1' || type === 'TEST1') targetColumn = 'ca1_score';
      else if (type === 'CA2' || type === 'TEST2') targetColumn = 'ca2_score';
      else if (type === 'ASSIGNMENT' || type === 'PROJECT') targetColumn = 'assignment_score';
      else if (type === 'ATTENDANCE') targetColumn = 'attendance_score';

      if (!targetColumn) return;

      const sql = `
        INSERT INTO assessment_scores (
          school_id, student_id, class_id, subject_id, academic_session_id, term_id, ${targetColumn}
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (student_id, subject_id, term_id)
        DO UPDATE SET
          ${targetColumn} = EXCLUDED.${targetColumn},
          academic_session_id = EXCLUDED.academic_session_id;
      `;

      await query(
        sql,
        [data.schoolId, data.studentId, data.classId, data.subjectId, data.academicSessionId, data.termId, data.score],
        client
      );
    } catch (err) {
      console.warn('[AssessmentRepository] Note on syncCompositeScore:', err);
    }
  }

  /**
   * Finds continuous assessments with student and subject details.
   */
  async findAssessments(
    schoolId: string,
    filters: {
      studentId?: string;
      classId?: string;
      subjectId?: string;
      academicTermId?: string;
      academicSessionId?: string;
    },
    options?: QueryOptions
  ): Promise<ContinuousAssessmentDbEntity[]> {
    const params: any[] = [schoolId];
    const conditions: string[] = ['ca.school_id = $1'];

    if (filters.studentId) {
      params.push(filters.studentId);
      conditions.push(`ca.student_id = $${params.length}`);
    }

    if (filters.classId) {
      params.push(filters.classId);
      conditions.push(`ca.class_id = $${params.length}`);
    }

    if (filters.subjectId) {
      params.push(filters.subjectId);
      conditions.push(`ca.subject_id = $${params.length}`);
    }

    if (filters.academicTermId) {
      params.push(filters.academicTermId);
      conditions.push(`ca.academic_term_id = $${params.length}`);
    }

    if (filters.academicSessionId) {
      params.push(filters.academicSessionId);
      conditions.push(`ca.academic_session_id = $${params.length}`);
    }

    const sql = `
      SELECT 
        ca.*,
        s.full_name AS student_name,
        s.admission_number,
        sub.name AS subject_name,
        sub.code AS subject_code,
        c.name AS class_name
      FROM continuous_assessments ca
      JOIN students s ON ca.student_id = s.id
      JOIN subjects sub ON ca.subject_id = sub.id
      JOIN classes c ON ca.class_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sub.name ASC, ca.assessment_type ASC;
    `;

    return this.executeQuery<ContinuousAssessmentDbEntity>(sql, params, options?.client);
  }

  /**
   * Updates an assessment score by its ID.
   */
  async updateAssessmentScore(
    id: string,
    data: { score: number; maxScore?: number },
    schoolId?: string,
    client?: PoolClient
  ): Promise<ContinuousAssessmentDbEntity> {
    const existingRes = await query<ContinuousAssessmentDbEntity>(
      'SELECT * FROM continuous_assessments WHERE id = $1 LIMIT 1;',
      [id],
      client
    );
    const existing = existingRes.rows[0];
    if (!existing) {
      throw new Error('ASSESSMENT_NOT_FOUND: Assessment record does not exist.');
    }

    if (schoolId && existing.school_id !== schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Cannot modify assessment of another school.');
    }

    const maxScore = data.maxScore ?? existing.max_score;
    const score = Number(data.score);

    if (isNaN(score) || score < 0) {
      throw new Error('INVALID_SCORE: Assessment score cannot be less than zero.');
    }
    if (score > maxScore) {
      throw new Error(`SCORE_EXCEEDS_MAX: Assessment score (${score}) exceeds maximum (${maxScore}).`);
    }

    const updateSql = `
      UPDATE continuous_assessments
      SET score = $1, max_score = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;

    const res = await query<ContinuousAssessmentDbEntity>(updateSql, [score, maxScore, id], client);
    return res.rows[0];
  }
}

export const assessmentRepository = new AssessmentRepository();
