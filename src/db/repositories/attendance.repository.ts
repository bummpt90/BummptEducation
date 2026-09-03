/**
 * BummptEducation — Attendance Repository
 * 
 * Provides server-authoritative tracking for student daily attendance,
 * class registers, attendance analytics, and multi-tenant isolation.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { query, withTransaction } from '../client';
import type { DailyAttendanceDbEntity, QueryOptions } from '../types';

export const VALID_ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
export type AttendanceStatus = typeof VALID_ATTENDANCE_STATUSES[number];

export class AttendanceRepository extends BaseRepository<DailyAttendanceDbEntity> {
  protected readonly tableName = 'daily_attendance';
  protected readonly primaryKey = 'id';
  protected readonly tenantColumn = 'school_id';
  protected readonly isMultiTenant = true;

  /**
   * Records attendance for a single student on a given date.
   */
  async recordAttendance(
    data: {
      schoolId: string;
      studentId: string;
      classId: string;
      termId: string;
      academicSessionId?: string | null;
      attendanceDate: string; // 'YYYY-MM-DD'
      status: string;
      dayNumberInTerm?: number;
      arrivalTime?: string | null;
      reason?: string | null;
      note?: string | null;
      markedByStaffId?: string | null;
      markedByUserId?: string | null;
      updateIfExists?: boolean;
    },
    client?: PoolClient
  ): Promise<DailyAttendanceDbEntity> {
    const normalizedStatus = data.status.toUpperCase();
    if (!VALID_ATTENDANCE_STATUSES.includes(normalizedStatus as AttendanceStatus)) {
      throw new Error(`INVALID_STATUS: Status must be one of [${VALID_ATTENDANCE_STATUSES.join(', ')}]. Received '${data.status}'.`);
    }

    // 1. Verify student belongs to school
    const studentCheck = await query<{ id: string; school_id: string; current_class_id: string }>(
      'SELECT id, school_id, current_class_id FROM students WHERE id = $1 LIMIT 1;',
      [data.studentId],
      client
    );
    if (!studentCheck.rows[0]) {
      throw new Error('STUDENT_NOT_FOUND: Specified student does not exist.');
    }
    if (studentCheck.rows[0].school_id !== data.schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Student does not belong to the specified school tenant.');
    }

    // 2. Verify class belongs to school
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

    // 3. Verify term & resolve session
    const termCheck = await query<{ id: string; session_id: string }>(
      'SELECT id, session_id FROM academic_terms WHERE id = $1 LIMIT 1;',
      [data.termId],
      client
    );
    if (!termCheck.rows[0]) {
      throw new Error('TERM_NOT_FOUND: Specified academic term does not exist.');
    }

    const resolvedSessionId = data.academicSessionId || termCheck.rows[0].session_id;
    if (data.academicSessionId && termCheck.rows[0].session_id !== data.academicSessionId) {
      throw new Error('SESSION_TERM_MISMATCH: Term does not belong to the specified academic session.');
    }

    // 4. Check for duplicate attendance on the same date
    const existingCheck = await query<DailyAttendanceDbEntity>(
      'SELECT id, status FROM daily_attendance WHERE student_id = $1 AND attendance_date = $2 LIMIT 1;',
      [data.studentId, data.attendanceDate],
      client
    );

    if (existingCheck.rows[0] && !data.updateIfExists) {
      throw new Error('DUPLICATE_ATTENDANCE: Attendance record already exists for this student on this date.');
    }

    if (existingCheck.rows[0] && data.updateIfExists) {
      const updateSql = `
        UPDATE daily_attendance
        SET 
          status = $1,
          arrival_time = $2,
          reason = $3,
          note = $4,
          marked_by_staff_id = $5,
          marked_by_user_id = $6,
          marked_at = NOW()
        WHERE id = $7
        RETURNING *;
      `;
      const res = await query<DailyAttendanceDbEntity>(
        updateSql,
        [
          normalizedStatus,
          data.arrivalTime || null,
          data.reason || null,
          data.note || null,
          data.markedByStaffId || null,
          data.markedByUserId || null,
          existingCheck.rows[0].id,
        ],
        client
      );
      return res.rows[0];
    }

    // 5. Insert new record
    const insertSql = `
      INSERT INTO daily_attendance (
        school_id, student_id, class_id, academic_session_id, term_id,
        attendance_date, day_number_in_term, status, arrival_time, reason,
        note, marked_by_staff_id, marked_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;

    const res = await query<DailyAttendanceDbEntity>(
      insertSql,
      [
        data.schoolId,
        data.studentId,
        data.classId,
        resolvedSessionId,
        data.termId,
        data.attendanceDate,
        data.dayNumberInTerm || 1,
        normalizedStatus,
        data.arrivalTime || null,
        data.reason || null,
        data.note || null,
        data.markedByStaffId || null,
        data.markedByUserId || null,
      ],
      client
    );

    return res.rows[0];
  }

  /**
   * Records bulk attendance for an entire class register in a single transaction.
   */
  async recordBulkAttendance(
    schoolId: string,
    classId: string,
    termId: string,
    attendanceDate: string,
    records: Array<{
      studentId: string;
      status: string;
      arrivalTime?: string | null;
      reason?: string | null;
      note?: string | null;
    }>,
    markedBy?: { staffId?: string | null; userId?: string | null }
  ): Promise<{ recorded: number; records: DailyAttendanceDbEntity[] }> {
    return withTransaction(async (client) => {
      const results: DailyAttendanceDbEntity[] = [];

      for (const record of records) {
        const item = await this.recordAttendance(
          {
            schoolId,
            studentId: record.studentId,
            classId,
            termId,
            attendanceDate,
            status: record.status,
            arrivalTime: record.arrivalTime,
            reason: record.reason,
            note: record.note,
            markedByStaffId: markedBy?.staffId,
            markedByUserId: markedBy?.userId,
            updateIfExists: true,
          },
          client
        );
        results.push(item);
      }

      return { recorded: results.length, records: results };
    });
  }

  /**
   * Retrieves daily attendance records for a class on a specific date.
   */
  async findByClassAndDate(
    schoolId: string,
    classId: string,
    date: string,
    options?: QueryOptions
  ): Promise<DailyAttendanceDbEntity[]> {
    const sql = `
      SELECT 
        a.*,
        s.full_name AS student_name,
        s.admission_number,
        c.name AS class_name
      FROM daily_attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      WHERE a.school_id = $1 AND a.class_id = $2 AND a.attendance_date = $3
      ORDER BY s.full_name ASC;
    `;

    return this.executeQuery<DailyAttendanceDbEntity>(sql, [schoolId, classId, date], options?.client);
  }

  /**
   * Retrieves attendance history and summary counts for a specific student.
   */
  async findByStudent(
    schoolId: string,
    studentId: string,
    filters?: { academicSessionId?: string; termId?: string },
    options?: QueryOptions
  ): Promise<{
    history: DailyAttendanceDbEntity[];
    summary: {
      totalDays: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendanceRate: number;
    };
  }> {
    const params: any[] = [schoolId, studentId];
    const conditions: string[] = ['a.school_id = $1', 'a.student_id = $2'];

    if (filters?.academicSessionId) {
      params.push(filters.academicSessionId);
      conditions.push(`a.academic_session_id = $${params.length}`);
    }

    if (filters?.termId) {
      params.push(filters.termId);
      conditions.push(`a.term_id = $${params.length}`);
    }

    const sql = `
      SELECT 
        a.*,
        c.name AS class_name
      FROM daily_attendance a
      JOIN classes c ON a.class_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.attendance_date DESC;
    `;

    const history = await this.executeQuery<DailyAttendanceDbEntity>(sql, params, options?.client);

    const summary = {
      totalDays: history.length,
      present: history.filter((r) => r.status === 'PRESENT').length,
      absent: history.filter((r) => r.status === 'ABSENT').length,
      late: history.filter((r) => r.status === 'LATE').length,
      excused: history.filter((r) => r.status === 'EXCUSED').length,
      attendanceRate: 0,
    };

    summary.attendanceRate = summary.totalDays > 0 
      ? Number((((summary.present + summary.late) / summary.totalDays) * 100).toFixed(1))
      : 0;

    return { history, summary };
  }

  /**
   * Updates an existing attendance record.
   */
  async updateAttendance(
    id: string,
    data: {
      status?: string;
      arrivalTime?: string | null;
      reason?: string | null;
      note?: string | null;
      markedByStaffId?: string | null;
      markedByUserId?: string | null;
    },
    schoolId?: string,
    client?: PoolClient
  ): Promise<DailyAttendanceDbEntity> {
    const existingRes = await query<DailyAttendanceDbEntity>(
      'SELECT * FROM daily_attendance WHERE id = $1 LIMIT 1;',
      [id],
      client
    );
    const existing = existingRes.rows[0];
    if (!existing) {
      throw new Error('ATTENDANCE_NOT_FOUND: Attendance record not found.');
    }

    if (schoolId && existing.school_id !== schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Cannot modify attendance of another school.');
    }

    const updates: string[] = ['marked_at = NOW()'];
    const params: any[] = [id];

    if (data.status) {
      const normalizedStatus = data.status.toUpperCase();
      if (!VALID_ATTENDANCE_STATUSES.includes(normalizedStatus as AttendanceStatus)) {
        throw new Error(`INVALID_STATUS: Status must be one of [${VALID_ATTENDANCE_STATUSES.join(', ')}].`);
      }
      params.push(normalizedStatus);
      updates.push(`status = $${params.length}`);
    }

    if (data.arrivalTime !== undefined) {
      params.push(data.arrivalTime);
      updates.push(`arrival_time = $${params.length}`);
    }

    if (data.reason !== undefined) {
      params.push(data.reason);
      updates.push(`reason = $${params.length}`);
    }

    if (data.note !== undefined) {
      params.push(data.note);
      updates.push(`note = $${params.length}`);
    }

    if (data.markedByStaffId !== undefined) {
      params.push(data.markedByStaffId);
      updates.push(`marked_by_staff_id = $${params.length}`);
    }

    if (data.markedByUserId !== undefined) {
      params.push(data.markedByUserId);
      updates.push(`marked_by_user_id = $${params.length}`);
    }

    const updateSql = `
      UPDATE daily_attendance
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;

    const res = await query<DailyAttendanceDbEntity>(updateSql, params, client);
    return res.rows[0];
  }
}

export const attendanceRepository = new AttendanceRepository();
