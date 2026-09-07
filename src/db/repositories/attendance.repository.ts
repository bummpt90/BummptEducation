/**
 * BummptEducation — Attendance Repository
 * 
 * Provides server-authoritative tracking for student daily attendance,
 * class registers, attendance analytics, historical student trajectory preservation,
 * and multi-tenant isolation.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { query, withTransaction } from '../client';
import type { DailyAttendanceDbEntity, AttendanceAuditLogDbEntity, QueryOptions } from '../types';

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
      organizationId?: string | null;
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

    // 4. Resolve organization_id if not explicitly provided
    let organizationId = data.organizationId;
    if (!organizationId) {
      const orgRes = await query<{ organization_id: string }>(
        'SELECT organization_id FROM schools WHERE id = $1 LIMIT 1;',
        [data.schoolId],
        client
      );
      organizationId = orgRes.rows[0]?.organization_id || null;
    }

    // 5. Look up matching longitudinal student enrollment if available
    const enrollmentRes = await query<{ id: string }>(
      `SELECT id FROM student_enrollments 
       WHERE student_id = $1 AND class_id = $2 
         AND (academic_session_id = $3 OR academic_session_id IS NULL)
       ORDER BY start_date DESC LIMIT 1;`,
      [data.studentId, data.classId, resolvedSessionId],
      client
    );
    const resolvedEnrollmentId = enrollmentRes.rows[0]?.id || null;

    // 6. Check for duplicate attendance on the same date
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
          updated_at = NOW()
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

    // 7. Insert new record with full tenant & historical context
    const insertSql = `
      INSERT INTO daily_attendance (
        organization_id, school_id, student_id, class_id, academic_session_id, 
        term_id, academic_term_id, enrollment_id, attendance_date, day_number_in_term, 
        status, arrival_time, reason, note, marked_by_staff_id, marked_by_user_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *;
    `;

    const res = await query<DailyAttendanceDbEntity>(
      insertSql,
      [
        organizationId,
        data.schoolId,
        data.studentId,
        data.classId,
        resolvedSessionId,
        data.termId,
        data.termId,
        resolvedEnrollmentId,
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
    markedBy?: { staffId?: string | null; userId?: string | null; organizationId?: string | null }
  ): Promise<{ recorded: number; records: DailyAttendanceDbEntity[] }> {
    return withTransaction(async (client) => {
      const results: DailyAttendanceDbEntity[] = [];

      for (const record of records) {
        const item = await this.recordAttendance(
          {
            schoolId,
            organizationId: markedBy?.organizationId,
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
        c.name AS class_name,
        c.level AS class_level,
        c.arm AS class_arm,
        t.term_name,
        ses.session_name
      FROM daily_attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN academic_terms t ON a.term_id = t.id
      LEFT JOIN academic_sessions ses ON a.academic_session_id = ses.id
      WHERE a.school_id = $1 AND a.class_id = $2 AND a.attendance_date = $3
      ORDER BY s.full_name ASC;
    `;

    return this.executeQuery<DailyAttendanceDbEntity>(sql, [schoolId, classId, date], options?.client);
  }

  /**
   * Retrieves attendance records for a class with flexible date and term filters.
   */
  async findByClass(
    schoolId: string,
    classId: string,
    filters?: {
      date?: string;
      termId?: string;
      sessionId?: string;
      startDate?: string;
      endDate?: string;
    },
    options?: QueryOptions
  ): Promise<DailyAttendanceDbEntity[]> {
    const conditions: string[] = ['a.school_id = $1', 'a.class_id = $2'];
    const params: any[] = [schoolId, classId];

    if (filters?.date) {
      params.push(filters.date);
      conditions.push(`a.attendance_date = $${params.length}`);
    }
    if (filters?.termId) {
      params.push(filters.termId);
      conditions.push(`a.term_id = $${params.length}`);
    }
    if (filters?.sessionId) {
      params.push(filters.sessionId);
      conditions.push(`a.academic_session_id = $${params.length}`);
    }
    if (filters?.startDate) {
      params.push(filters.startDate);
      conditions.push(`a.attendance_date >= $${params.length}`);
    }
    if (filters?.endDate) {
      params.push(filters.endDate);
      conditions.push(`a.attendance_date <= $${params.length}`);
    }

    const sql = `
      SELECT 
        a.*,
        s.full_name AS student_name,
        s.admission_number,
        c.name AS class_name,
        c.level AS class_level,
        c.arm AS class_arm,
        t.term_name,
        ses.session_name
      FROM daily_attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN academic_terms t ON a.term_id = t.id
      LEFT JOIN academic_sessions ses ON a.academic_session_id = ses.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.attendance_date DESC, s.full_name ASC;
    `;

    return this.executeQuery<DailyAttendanceDbEntity>(sql, params, options?.client);
  }

  /**
   * Retrieves attendance records for an entire school on a given date.
   */
  async findByDate(
    schoolId: string,
    date: string,
    filters?: { classId?: string; termId?: string },
    options?: QueryOptions
  ): Promise<DailyAttendanceDbEntity[]> {
    const conditions: string[] = ['a.school_id = $1', 'a.attendance_date = $2'];
    const params: any[] = [schoolId, date];

    if (filters?.classId) {
      params.push(filters.classId);
      conditions.push(`a.class_id = $${params.length}`);
    }
    if (filters?.termId) {
      params.push(filters.termId);
      conditions.push(`a.term_id = $${params.length}`);
    }

    const sql = `
      SELECT 
        a.*,
        s.full_name AS student_name,
        s.admission_number,
        c.name AS class_name,
        c.level AS class_level,
        c.arm AS class_arm,
        t.term_name,
        ses.session_name
      FROM daily_attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN academic_terms t ON a.term_id = t.id
      LEFT JOIN academic_sessions ses ON a.academic_session_id = ses.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.level ASC, s.full_name ASC;
    `;

    return this.executeQuery<DailyAttendanceDbEntity>(sql, params, options?.client);
  }

  /**
   * Retrieves attendance history and summary counts for a specific student.
   * Preserves historical class and session context associated with each daily entry.
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
        s.full_name AS student_name,
        s.admission_number,
        c.name AS class_name,
        c.level AS class_level,
        c.arm AS class_arm,
        t.term_name,
        ses.session_name
      FROM daily_attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN academic_terms t ON a.term_id = t.id
      LEFT JOIN academic_sessions ses ON a.academic_session_id = ses.id
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
   * Calculates aggregate attendance statistics for a school or class.
   */
  async getAttendanceStatistics(
    schoolId: string,
    filters?: {
      classId?: string;
      termId?: string;
      sessionId?: string;
      date?: string;
    },
    options?: QueryOptions
  ): Promise<{
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
    punctualityRate: number;
  }> {
    const conditions: string[] = ['school_id = $1'];
    const params: any[] = [schoolId];

    if (filters?.classId) {
      params.push(filters.classId);
      conditions.push(`class_id = $${params.length}`);
    }
    if (filters?.termId) {
      params.push(filters.termId);
      conditions.push(`term_id = $${params.length}`);
    }
    if (filters?.sessionId) {
      params.push(filters.sessionId);
      conditions.push(`academic_session_id = $${params.length}`);
    }
    if (filters?.date) {
      params.push(filters.date);
      conditions.push(`attendance_date = $${params.length}`);
    }

    const sql = `
      SELECT 
        COUNT(*)::int AS total_records,
        COUNT(*) FILTER (WHERE status = 'PRESENT')::int AS present_count,
        COUNT(*) FILTER (WHERE status = 'ABSENT')::int AS absent_count,
        COUNT(*) FILTER (WHERE status = 'LATE')::int AS late_count,
        COUNT(*) FILTER (WHERE status = 'EXCUSED')::int AS excused_count
      FROM daily_attendance
      WHERE ${conditions.join(' AND ')};
    `;

    const res = await query<any>(sql, params, options?.client);
    const row = res.rows[0] || {
      total_records: 0,
      present_count: 0,
      absent_count: 0,
      late_count: 0,
      excused_count: 0,
    };

    const total = Number(row.total_records) || 0;
    const present = Number(row.present_count) || 0;
    const absent = Number(row.absent_count) || 0;
    const late = Number(row.late_count) || 0;
    const excused = Number(row.excused_count) || 0;

    const attendanceRate = total > 0 ? Number((((present + late) / total) * 100).toFixed(1)) : 0;
    const punctualityRate = (present + late) > 0 ? Number(((present / (present + late)) * 100).toFixed(1)) : 0;

    return {
      totalRecords: total,
      present,
      absent,
      late,
      excused,
      attendanceRate,
      punctualityRate,
    };
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

    const updates: string[] = ['updated_at = NOW()'];
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

  /**
   * Verifies if a teacher is authorized to view or mark attendance for a class.
   * Checks form master role, assigned class, and class-subject allocations.
   */
  async checkTeacherClassAuthorization(
    schoolId: string,
    userId: string,
    classId: string,
    client?: PoolClient
  ): Promise<boolean> {
    // 1. Resolve staff record for user
    const staffRes = await query<{ id: string; assigned_class_id: string | null }>(
      'SELECT id, assigned_class_id FROM staff WHERE user_id = $1 AND school_id = $2 LIMIT 1;',
      [userId, schoolId],
      client
    );
    const staff = staffRes.rows[0];
    if (!staff) {
      return false;
    }

    // 2. Check if assigned class matches
    if (staff.assigned_class_id === classId) {
      return true;
    }

    // 3. Check if form master of the class
    const formMasterRes = await query<{ id: string }>(
      'SELECT id FROM classes WHERE id = $1 AND form_master_id = $2 AND school_id = $3 LIMIT 1;',
      [classId, staff.id, schoolId],
      client
    );
    if (formMasterRes.rows.length > 0) {
      return true;
    }

    // 4. Check if allocated subject teacher for the class
    const allocationRes = await query<{ id: string }>(
      'SELECT id FROM class_subject_allocations WHERE class_id = $1 AND teacher_id = $2 AND school_id = $3 LIMIT 1;',
      [classId, staff.id, schoolId],
      client
    );
    if (allocationRes.rows.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Records an attendance audit log entry in PostgreSQL attendance_audit_logs.
   */
  async logAttendanceAudit(
    data: {
      organizationId?: string | null;
      schoolId: string;
      attendanceId?: string | null;
      studentId?: string | null;
      classId?: string | null;
      action: 'RECORDED' | 'BULK_RECORDED' | 'MODIFIED' | 'CORRECTION' | 'UNAUTHORIZED_ATTEMPT';
      performedByUserId?: string | null;
      userRole?: string | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      details?: Record<string, any> | null;
    },
    client?: PoolClient
  ): Promise<AttendanceAuditLogDbEntity> {
    const sql = `
      INSERT INTO attendance_audit_logs (
        organization_id, school_id, attendance_id, student_id, class_id,
        action, performed_by_user_id, user_role, ip_address, user_agent,
        details, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *;
    `;

    const res = await query<AttendanceAuditLogDbEntity>(
      sql,
      [
        data.organizationId || null,
        data.schoolId,
        data.attendanceId || null,
        data.studentId || null,
        data.classId || null,
        data.action,
        data.performedByUserId || null,
        data.userRole || null,
        data.ipAddress || null,
        data.userAgent || null,
        data.details ? JSON.stringify(data.details) : null,
      ],
      client
    );

    return res.rows[0];
  }
}

export const attendanceRepository = new AttendanceRepository();
