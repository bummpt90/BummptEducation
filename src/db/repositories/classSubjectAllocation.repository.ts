/**
 * BummptEducation — Class-Subject Allocation Repository
 * 
 * Provides server-authoritative data access for class-subject allocations,
 * teacher assignments, period scheduling, and multi-tenant isolation.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { query } from '../client';
import type { ClassSubjectAllocationDbEntity, QueryOptions } from '../types';

export class ClassSubjectAllocationRepository extends BaseRepository<ClassSubjectAllocationDbEntity> {
  protected readonly tableName = 'class_subject_allocations';
  protected readonly primaryKey = 'id';
  protected readonly tenantColumn = 'school_id';
  protected readonly isMultiTenant = true;

  /**
   * Retrieves allocations for a school with joined class, subject, teacher, and term names.
   */
  async findBySchool(
    schoolId: string,
    filters?: {
      classId?: string;
      subjectId?: string;
      teacherId?: string;
      academicSessionId?: string;
      academicTermId?: string;
    },
    options?: QueryOptions
  ): Promise<ClassSubjectAllocationDbEntity[]> {
    const params: any[] = [schoolId];
    const conditions: string[] = ['a.school_id = $1'];

    if (filters?.classId) {
      params.push(filters.classId);
      conditions.push(`a.class_id = $${params.length}`);
    }

    if (filters?.subjectId) {
      params.push(filters.subjectId);
      conditions.push(`a.subject_id = $${params.length}`);
    }

    if (filters?.teacherId) {
      params.push(filters.teacherId);
      conditions.push(`a.teacher_id = $${params.length}`);
    }

    if (filters?.academicSessionId) {
      params.push(filters.academicSessionId);
      conditions.push(`a.academic_session_id = $${params.length}`);
    }

    if (filters?.academicTermId) {
      params.push(filters.academicTermId);
      conditions.push(`a.academic_term_id = $${params.length}`);
    }

    const sql = `
      SELECT 
        a.id,
        a.school_id,
        a.class_id,
        a.subject_id,
        a.teacher_id,
        a.academic_session_id,
        a.academic_term_id,
        a.periods_per_week,
        a.created_at,
        a.updated_at,
        c.name AS class_name,
        c.level AS class_level,
        s.name AS subject_name,
        s.code AS subject_code,
        st.full_name AS teacher_name,
        st.staff_id_number AS teacher_staff_id,
        t.term_name AS term_name,
        ses.session_name AS session_name
      FROM class_subject_allocations a
      JOIN classes c ON a.class_id = c.id
      JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN staff st ON a.teacher_id = st.id
      LEFT JOIN academic_terms t ON a.academic_term_id = t.id
      LEFT JOIN academic_sessions ses ON a.academic_session_id = ses.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.name ASC, s.name ASC;
    `;

    return this.executeQuery<ClassSubjectAllocationDbEntity>(sql, params, options?.client);
  }

  /**
   * Finds an existing allocation to prevent duplicates on (class_id, subject_id, academic_term_id).
   */
  async findExisting(
    classId: string,
    subjectId: string,
    academicTermId: string,
    client?: PoolClient
  ): Promise<ClassSubjectAllocationDbEntity | null> {
    const sql = `
      SELECT * FROM class_subject_allocations
      WHERE class_id = $1 AND subject_id = $2 AND academic_term_id = $3
      LIMIT 1;
    `;
    const rows = await this.executeQuery<ClassSubjectAllocationDbEntity>(sql, [classId, subjectId, academicTermId], client);
    return rows[0] || null;
  }

  /**
   * Creates a new class-subject allocation with strict boundary validations.
   */
  async allocateSubject(
    data: {
      schoolId: string;
      classId: string;
      subjectId: string;
      teacherId?: string | null;
      academicSessionId?: string | null;
      academicTermId: string;
      periodsPerWeek?: number;
    },
    client?: PoolClient
  ): Promise<ClassSubjectAllocationDbEntity> {
    // 1. Verify class belongs to the school
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

    // 2. Verify subject exists
    const subjectCheck = await query<{ id: string }>(
      'SELECT id FROM subjects WHERE id = $1 LIMIT 1;',
      [data.subjectId],
      client
    );
    if (!subjectCheck.rows[0]) {
      throw new Error('SUBJECT_NOT_FOUND: Specified subject does not exist.');
    }

    // 3. Verify teacher belongs to the same school if assigned
    if (data.teacherId) {
      const teacherCheck = await query<{ id: string; school_id: string; is_active: boolean }>(
        'SELECT id, school_id, is_active FROM staff WHERE id = $1 LIMIT 1;',
        [data.teacherId],
        client
      );
      if (!teacherCheck.rows[0]) {
        throw new Error('TEACHER_NOT_FOUND: Specified teacher staff record does not exist.');
      }
      if (teacherCheck.rows[0].school_id !== data.schoolId) {
        throw new Error('CROSS_SCHOOL_TEACHER_VIOLATION: Teacher staff member does not belong to this school.');
      }
    }

    // 4. Verify academic term & resolve academic session
    const termCheck = await query<{ id: string; session_id: string }>(
      'SELECT id, session_id FROM academic_terms WHERE id = $1 LIMIT 1;',
      [data.academicTermId],
      client
    );
    if (!termCheck.rows[0]) {
      throw new Error('TERM_NOT_FOUND: Specified academic term does not exist.');
    }

    const resolvedSessionId = data.academicSessionId || termCheck.rows[0].session_id;

    // Verify session integrity if session provided
    if (data.academicSessionId && termCheck.rows[0].session_id !== data.academicSessionId) {
      throw new Error('SESSION_TERM_MISMATCH: The specified term does not belong to the specified academic session.');
    }

    // 5. Check for duplicate allocation
    const existing = await this.findExisting(data.classId, data.subjectId, data.academicTermId, client);
    if (existing) {
      throw new Error('DUPLICATE_ALLOCATION: An allocation for this class, subject, and term already exists.');
    }

    const periods = data.periodsPerWeek && data.periodsPerWeek > 0 ? data.periodsPerWeek : 4;

    const insertSql = `
      INSERT INTO class_subject_allocations (
        school_id, class_id, subject_id, teacher_id, academic_session_id, academic_term_id, periods_per_week
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const res = await query<ClassSubjectAllocationDbEntity>(
      insertSql,
      [data.schoolId, data.classId, data.subjectId, data.teacherId || null, resolvedSessionId, data.academicTermId, periods],
      client
    );

    return res.rows[0];
  }

  /**
   * Updates an existing allocation (e.g. reassign teacher or periods per week).
   */
  async updateAllocation(
    id: string,
    data: {
      teacherId?: string | null;
      periodsPerWeek?: number;
    },
    schoolId?: string,
    client?: PoolClient
  ): Promise<ClassSubjectAllocationDbEntity> {
    const existingRes = await query<ClassSubjectAllocationDbEntity>(
      'SELECT * FROM class_subject_allocations WHERE id = $1 LIMIT 1;',
      [id],
      client
    );
    const existing = existingRes.rows[0];
    if (!existing) {
      throw new Error('ALLOCATION_NOT_FOUND: Allocation does not exist.');
    }

    if (schoolId && existing.school_id !== schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Cannot update allocation belonging to another school.');
    }

    if (data.teacherId !== undefined && data.teacherId !== null) {
      const teacherCheck = await query<{ id: string; school_id: string }>(
        'SELECT id, school_id FROM staff WHERE id = $1 LIMIT 1;',
        [data.teacherId],
        client
      );
      if (!teacherCheck.rows[0]) {
        throw new Error('TEACHER_NOT_FOUND: Specified teacher staff member does not exist.');
      }
      if (teacherCheck.rows[0].school_id !== existing.school_id) {
        throw new Error('CROSS_SCHOOL_TEACHER_VIOLATION: Teacher staff member belongs to another school.');
      }
    }

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [id];

    if (data.teacherId !== undefined) {
      params.push(data.teacherId);
      updates.push(`teacher_id = $${params.length}`);
    }

    if (data.periodsPerWeek !== undefined) {
      if (data.periodsPerWeek <= 0) {
        throw new Error('INVALID_PERIODS: Periods per week must be greater than zero.');
      }
      params.push(data.periodsPerWeek);
      updates.push(`periods_per_week = $${params.length}`);
    }

    const updateSql = `
      UPDATE class_subject_allocations
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;

    const res = await query<ClassSubjectAllocationDbEntity>(updateSql, params, client);
    return res.rows[0];
  }

  /**
   * Deletes an allocation enforcing tenant isolation.
   */
  async deleteAllocation(id: string, schoolId?: string, client?: PoolClient): Promise<boolean> {
    const params: any[] = [id];
    let sql = 'DELETE FROM class_subject_allocations WHERE id = $1';

    if (schoolId) {
      params.push(schoolId);
      sql += ' AND school_id = $2';
    }

    sql += ' RETURNING id;';
    const res = await query(sql, params, client);
    return (res.rowCount ?? 0) > 0;
  }
}

export const classSubjectAllocationRepository = new ClassSubjectAllocationRepository();
