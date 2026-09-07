/**
 * BummptEducation — Attendance API Routes (/api/v1/attendance)
 * 
 * Server-authoritative endpoints for student attendance marking,
 * daily classroom registers, telemetry aggregation, RBAC enforcement,
 * and multi-tenant isolation.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { attendanceRepository } from '../../db/repositories/attendance.repository';
import { parentRepository } from '../../db/repositories/parent.repository';
import { query } from '../../db/client';
import type { AuthenticatedRequest } from '../../auth/types';

export const attendanceRouter = Router();

/**
 * Helper to resolve the student record linked to an authenticated student user.
 */
async function getStudentForUser(userId: string): Promise<{ id: string; school_id: string } | null> {
  const res = await query<{ id: string; school_id: string }>(
    `SELECT s.id, s.school_id FROM students s
     JOIN users u ON (u.id = $1 OR u.email = s.guardian_email OR u.username = s.admission_number)
     WHERE u.id = $1 LIMIT 1;`,
    [userId]
  );
  return res.rows[0] || null;
}

/**
 * Helper to check student access authorization across all roles:
 * - super_admin: unrestricted
 * - state_officer: within state schools
 * - principal / vice_principal: within assigned school
 * - teacher: student is in a class the teacher is authorized for
 * - parent: parent must have active link in parent_student_links
 * - student: student can only access their own record
 */
async function verifyStudentAccessAuthorization(
  req: AuthenticatedRequest,
  studentId: string,
  schoolId: string
): Promise<{ authorized: boolean; reason?: string; httpStatus?: number }> {
  const user = req.user;
  if (!user) {
    return { authorized: false, reason: 'UNAUTHENTICATED', httpStatus: 401 };
  }

  if (user.isSuperAdmin) {
    return { authorized: true };
  }

  if (user.isStateOfficer) {
    return { authorized: true };
  }

  // 1. Verify student exists and belongs to school
  const studentCheck = await query<{ id: string; school_id: string; current_class_id: string }>(
    'SELECT id, school_id, current_class_id FROM students WHERE id = $1 LIMIT 1;',
    [studentId]
  );
  const student = studentCheck.rows[0];
  if (!student) {
    return { authorized: false, reason: 'STUDENT_NOT_FOUND', httpStatus: 404 };
  }

  if (student.school_id !== schoolId) {
    return { authorized: false, reason: 'CROSS_SCHOOL_UNAUTHORIZED', httpStatus: 403 };
  }

  // 2. Role-specific validations
  if (user.role === 'student') {
    const selfStudent = await getStudentForUser(user.id);
    if (!selfStudent || selfStudent.id !== studentId) {
      return { authorized: false, reason: 'CROSS_STUDENT_UNAUTHORIZED', httpStatus: 403 };
    }
    return { authorized: true };
  }

  if (user.role === 'parent') {
    const parent = await parentRepository.findParentByUserId(user.id);
    if (!parent) {
      return { authorized: false, reason: 'PARENT_RECORD_NOT_FOUND', httpStatus: 403 };
    }

    const link = await parentRepository.verifyParentStudentRelationship(parent.id, studentId);
    if (!link) {
      return { authorized: false, reason: 'UNAUTHORIZED_STUDENT_ACCESS', httpStatus: 403 };
    }
    return { authorized: true };
  }

  if (user.role === 'teacher') {
    // Check if teacher is assigned to student's current class OR any historical class where attendance was marked
    const isAuthorized = await attendanceRepository.checkTeacherClassAuthorization(
      schoolId,
      user.id,
      student.current_class_id
    );
    if (!isAuthorized) {
      return { authorized: false, reason: 'TEACHER_STUDENT_UNAUTHORIZED', httpStatus: 403 };
    }
    return { authorized: true };
  }

  // School administrative roles (principal, vice_principal, etc.)
  if (user.schoolId && user.schoolId !== student.school_id) {
    return { authorized: false, reason: 'CROSS_SCHOOL_UNAUTHORIZED', httpStatus: 403 };
  }

  return { authorized: true };
}

/**
 * GET /api/v1/attendance
 * Retrieves attendance records based on class/date, student history, or school query.
 */
attendanceRouter.get(
  '/',
  authenticateUser,
  requirePermission('attendance.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const browserSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);
      let targetSchoolId = browserSchoolId;

      // Server-authoritative tenant scoping
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (browserSchoolId && req.user?.schoolId && browserSchoolId !== req.user.schoolId) {
          res.status(403).json({
            success: false,
            error: 'CROSS_SCHOOL_OVERRIDE_FORBIDDEN',
            message: 'Browser-supplied school_id cannot override authenticated school context.',
          });
          return;
        }
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'school_id query parameter is required for global authorities.',
        });
        return;
      }

      const studentId = (req.query.student_id as string) || (req.query.studentId as string);
      const classId = (req.query.class_id as string) || (req.query.classId as string);
      const date = (req.query.date as string) || (req.query.attendance_date as string);

      // Student History Query
      if (studentId) {
        const authCheck = await verifyStudentAccessAuthorization(req, studentId, targetSchoolId);
        if (!authCheck.authorized) {
          res.status(authCheck.httpStatus || 403).json({
            success: false,
            error: authCheck.reason,
            message: 'You are not authorized to view attendance records for this student.',
          });
          return;
        }

        const result = await attendanceRepository.findByStudent(targetSchoolId, studentId, {
          academicSessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
          termId: (req.query.term_id as string) || (req.query.academic_term_id as string),
        });

        res.json({
          success: true,
          data: result,
        });
        return;
      }

      // Class or date register queries cannot be viewed by students or parents
      if (req.user?.role === 'student' || req.user?.role === 'parent') {
        res.status(403).json({
          success: false,
          error: 'CLASS_REGISTER_FORBIDDEN',
          message: 'Students and parents are not authorized to inspect class attendance registers.',
        });
        return;
      }

      // Teacher class authorization check
      if (req.user?.role === 'teacher' && classId) {
        const isAuthorized = await attendanceRepository.checkTeacherClassAuthorization(
          targetSchoolId,
          req.user.id,
          classId
        );
        if (!isAuthorized) {
          res.status(403).json({
            success: false,
            error: 'TEACHER_CLASS_UNAUTHORIZED',
            message: 'Teacher is not assigned to this class register.',
          });
          return;
        }
      }

      // Class and Date Register
      if (classId && date) {
        const records = await attendanceRepository.findByClassAndDate(targetSchoolId, classId, date);
        res.json({
          success: true,
          count: records.length,
          data: records,
        });
        return;
      }

      // Class register across dates/terms
      if (classId) {
        const records = await attendanceRepository.findByClass(targetSchoolId, classId, {
          date,
          termId: (req.query.term_id as string) || (req.query.academic_term_id as string),
          sessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
        });
        res.json({
          success: true,
          count: records.length,
          data: records,
        });
        return;
      }

      // School attendance by Date
      if (date) {
        const records = await attendanceRepository.findByDate(targetSchoolId, date);
        res.json({
          success: true,
          count: records.length,
          data: records,
        });
        return;
      }

      // School Attendance Aggregate Statistics
      const stats = await attendanceRepository.getAttendanceStatistics(targetSchoolId, {
        classId,
        termId: (req.query.term_id as string) || (req.query.academic_term_id as string),
        sessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
        date,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('[AttendanceAPI] Failed to retrieve attendance:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve attendance telemetry.',
      });
    }
  }
);

/**
 * GET /api/v1/attendance/student/:studentId
 * Dedicated route for student attendance history & metrics.
 */
attendanceRouter.get(
  '/student/:studentId',
  authenticateUser,
  requirePermission('attendance.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const studentId = req.params.studentId;
      let targetSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      // Resolve school from student if global authority didn't pass school_id
      if (!targetSchoolId) {
        const studentRes = await query<{ school_id: string }>(
          'SELECT school_id FROM students WHERE id = $1 LIMIT 1;',
          [studentId]
        );
        targetSchoolId = studentRes.rows[0]?.school_id || '';
      }

      const authCheck = await verifyStudentAccessAuthorization(req, studentId, targetSchoolId);
      if (!authCheck.authorized) {
        res.status(authCheck.httpStatus || 403).json({
          success: false,
          error: authCheck.reason,
          message: 'You are not authorized to view attendance records for this student.',
        });
        return;
      }

      const result = await attendanceRepository.findByStudent(targetSchoolId, studentId, {
        academicSessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
        termId: (req.query.term_id as string) || (req.query.academic_term_id as string),
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[AttendanceAPI] Failed to retrieve student attendance:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve student attendance history.',
      });
    }
  }
);

/**
 * GET /api/v1/attendance/class/:classId
 * Dedicated route for class attendance register.
 */
attendanceRouter.get(
  '/class/:classId',
  authenticateUser,
  requirePermission('attendance.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const classId = req.params.classId;
      let targetSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      if (req.user?.role === 'student' || req.user?.role === 'parent') {
        res.status(403).json({
          success: false,
          error: 'CLASS_REGISTER_FORBIDDEN',
          message: 'Students and parents are not authorized to inspect class attendance registers.',
        });
        return;
      }

      if (req.user?.role === 'teacher') {
        const isAuthorized = await attendanceRepository.checkTeacherClassAuthorization(
          targetSchoolId,
          req.user.id,
          classId
        );
        if (!isAuthorized) {
          res.status(403).json({
            success: false,
            error: 'TEACHER_CLASS_UNAUTHORIZED',
            message: 'Teacher is not assigned to this class register.',
          });
          return;
        }
      }

      const date = (req.query.date as string) || (req.query.attendance_date as string);
      let records;
      if (date) {
        records = await attendanceRepository.findByClassAndDate(targetSchoolId, classId, date);
      } else {
        records = await attendanceRepository.findByClass(targetSchoolId, classId, {
          termId: (req.query.term_id as string) || (req.query.academic_term_id as string),
          sessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
        });
      }

      res.json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (error: any) {
      console.error('[AttendanceAPI] Failed to retrieve class attendance:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve class attendance register.',
      });
    }
  }
);

/**
 * POST /api/v1/attendance
 * Records attendance for a single student or multiple students in bulk.
 */
attendanceRouter.post(
  '/',
  authenticateUser,
  requirePermission('attendance.mark'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        school_id,
        schoolId,
        student_id,
        studentId,
        class_id,
        classId,
        term_id,
        termId,
        academic_term_id,
        academic_session_id,
        academicSessionId,
        attendance_date,
        attendanceDate,
        date,
        status,
        day_number_in_term,
        arrival_time,
        reason,
        note,
        records,
        update_if_exists,
      } = req.body;

      // Server-authoritative tenant scoping
      const browserSchoolId = school_id || schoolId;
      let targetSchoolId = browserSchoolId;

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (browserSchoolId && req.user?.schoolId && browserSchoolId !== req.user.schoolId) {
          // Log unauthorized tenant override attempt
          await attendanceRepository.logAttendanceAudit({
            schoolId: req.user.schoolId,
            action: 'UNAUTHORIZED_ATTEMPT',
            performedByUserId: req.user.id,
            userRole: req.user.role,
            details: { reason: 'Cross-school override attempt', attemptedSchoolId: browserSchoolId },
          });

          res.status(403).json({
            success: false,
            error: 'CROSS_SCHOOL_OVERRIDE_FORBIDDEN',
            message: 'Browser-supplied school_id cannot override authenticated school context.',
          });
          return;
        }
        targetSchoolId = req.user?.schoolId;
      }

      const targetClassId = class_id || classId;
      const targetTermId = term_id || termId || academic_term_id;
      const targetSessionId = academic_session_id || academicSessionId;
      const targetDate = attendance_date || attendanceDate || date || new Date().toISOString().split('T')[0];

      if (!targetSchoolId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'school_id is required.',
        });
        return;
      }

      // Teacher class authorization check
      if (req.user?.role === 'teacher' && targetClassId) {
        const isAuthorized = await attendanceRepository.checkTeacherClassAuthorization(
          targetSchoolId,
          req.user.id,
          targetClassId
        );
        if (!isAuthorized) {
          await attendanceRepository.logAttendanceAudit({
            schoolId: targetSchoolId,
            classId: targetClassId,
            action: 'UNAUTHORIZED_ATTEMPT',
            performedByUserId: req.user.id,
            userRole: req.user.role,
            details: { reason: 'Unauthorized teacher attempted to record attendance for class', targetClassId },
          });

          res.status(403).json({
            success: false,
            error: 'TEACHER_CLASS_UNAUTHORIZED',
            message: 'You are not assigned to record attendance for this class.',
          });
          return;
        }
      }

      // Handle Bulk Attendance Register Submission
      if (Array.isArray(records) && records.length > 0) {
        if (!targetClassId || !targetTermId) {
          res.status(400).json({
            success: false,
            error: 'MISSING_REQUIRED_FIELDS',
            message: 'class_id and term_id are required for bulk register submission.',
          });
          return;
        }

        const bulkResult = await attendanceRepository.recordBulkAttendance(
          targetSchoolId,
          targetClassId,
          targetTermId,
          targetDate,
          records.map((r) => ({
            studentId: r.student_id || r.studentId,
            status: r.status,
            arrivalTime: r.arrival_time || r.arrivalTime,
            reason: r.reason,
            note: r.note,
          })),
          { userId: req.user?.id }
        );

        // Audit log
        await attendanceRepository.logAttendanceAudit({
          schoolId: targetSchoolId,
          classId: targetClassId,
          action: 'BULK_RECORDED',
          performedByUserId: req.user?.id,
          userRole: req.user?.role,
          details: { recordedCount: bulkResult.recorded, attendanceDate: targetDate, termId: targetTermId },
        });

        res.status(201).json({
          success: true,
          message: `Recorded attendance for ${bulkResult.recorded} students.`,
          data: bulkResult,
        });
        return;
      }

      // Handle Single Student Attendance Submission
      const targetStudentId = student_id || studentId;
      if (!targetStudentId || !targetClassId || !targetTermId || !status) {
        res.status(400).json({
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'student_id, class_id, term_id, and status are required.',
        });
        return;
      }

      const record = await attendanceRepository.recordAttendance({
        schoolId: targetSchoolId,
        studentId: targetStudentId,
        classId: targetClassId,
        termId: targetTermId,
        academicSessionId: targetSessionId || null,
        attendanceDate: targetDate,
        status,
        dayNumberInTerm: day_number_in_term ? Number(day_number_in_term) : 1,
        arrivalTime: arrival_time || null,
        reason: reason || null,
        note: note || null,
        markedByUserId: req.user?.id || null,
        updateIfExists: Boolean(update_if_exists),
      });

      // Audit log
      await attendanceRepository.logAttendanceAudit({
        schoolId: targetSchoolId,
        attendanceId: record.id,
        studentId: targetStudentId,
        classId: targetClassId,
        action: 'RECORDED',
        performedByUserId: req.user?.id,
        userRole: req.user?.role,
        details: { status: record.status, attendanceDate: targetDate },
      });

      res.status(201).json({
        success: true,
        message: 'Attendance recorded successfully.',
        data: record,
      });
    } catch (error: any) {
      console.error('[AttendanceAPI] Failed to record attendance:', error);

      if (error.message?.includes('DUPLICATE_ATTENDANCE')) {
        res.status(409).json({
          success: false,
          error: 'DUPLICATE_ATTENDANCE',
          message: error.message,
        });
        return;
      }

      if (
        error.message?.includes('CROSS_SCHOOL') ||
        error.message?.includes('INVALID_STATUS') ||
        error.message?.includes('NOT_FOUND') ||
        error.message?.includes('MISMATCH')
      ) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_FAILED',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to record attendance.',
      });
    }
  }
);

/**
 * PATCH /api/v1/attendance/:id
 * Updates an attendance record (attendance correction).
 */
attendanceRouter.patch(
  '/:id',
  authenticateUser,
  requirePermission('attendance.mark'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const attendanceId = req.params.id;
      const { status, arrival_time, reason, note } = req.body;

      const targetSchoolId = req.user?.isSuperAdmin || req.user?.isStateOfficer
        ? undefined
        : req.user?.schoolId;

      const existing = await attendanceRepository.findById(attendanceId);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'ATTENDANCE_NOT_FOUND',
          message: 'Attendance record not found.',
        });
        return;
      }

      if (req.user?.role === 'teacher') {
        const isAuthorized = await attendanceRepository.checkTeacherClassAuthorization(
          existing.school_id,
          req.user.id,
          existing.class_id
        );
        if (!isAuthorized) {
          await attendanceRepository.logAttendanceAudit({
            schoolId: existing.school_id,
            attendanceId: existing.id,
            action: 'UNAUTHORIZED_ATTEMPT',
            performedByUserId: req.user.id,
            userRole: req.user.role,
            details: { reason: 'Unauthorized teacher attempted attendance modification' },
          });

          res.status(403).json({
            success: false,
            error: 'TEACHER_CLASS_UNAUTHORIZED',
            message: 'Teacher is not authorized to modify attendance for this class.',
          });
          return;
        }
      }

      const updated = await attendanceRepository.updateAttendance(
        attendanceId,
        {
          status,
          arrivalTime: arrival_time,
          reason,
          note,
          markedByUserId: req.user?.id || null,
        },
        targetSchoolId
      );

      // Audit log correction
      await attendanceRepository.logAttendanceAudit({
        schoolId: updated.school_id,
        attendanceId: updated.id,
        studentId: updated.student_id,
        classId: updated.class_id,
        action: 'CORRECTION',
        performedByUserId: req.user?.id,
        userRole: req.user?.role,
        details: { previousStatus: existing.status, newStatus: updated.status },
      });

      res.json({
        success: true,
        message: 'Attendance record updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AttendanceAPI] Failed to update attendance:', error);

      if (error.message?.includes('CROSS_SCHOOL')) {
        res.status(403).json({
          success: false,
          error: 'CROSS_SCHOOL_VIOLATION',
          message: error.message,
        });
        return;
      }

      if (error.message?.includes('INVALID_STATUS')) {
        res.status(400).json({
          success: false,
          error: 'INVALID_STATUS',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update attendance record.',
      });
    }
  }
);
