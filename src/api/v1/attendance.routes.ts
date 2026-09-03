/**
 * BummptEducation — Attendance API Routes (/api/v1/attendance)
 * 
 * Server-authoritative endpoints for student attendance marking,
 * daily classroom registers, telemetry aggregation, and multi-tenant isolation.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { attendanceRepository } from '../../db/repositories/attendance.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const attendanceRouter = Router();

/**
 * GET /api/v1/attendance
 * Retrieves attendance records based on class/date or student history.
 */
attendanceRouter.get(
  '/',
  authenticateUser,
  requirePermission('attendance.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      let targetSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
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

      // If student_id provided, return student history and summary
      if (studentId) {
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

      // If class_id and date provided, return daily class register
      if (classId && date) {
        const records = await attendanceRepository.findByClassAndDate(targetSchoolId, classId, date);
        res.json({
          success: true,
          count: records.length,
          data: records,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'MISSING_QUERY_PARAMETERS',
        message: 'Must provide either student_id or both class_id and date query parameters.',
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

      let targetSchoolId = school_id || schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
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
 * Updates an attendance record.
 */
attendanceRouter.patch(
  '/:id',
  authenticateUser,
  requirePermission('attendance.mark'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status, arrival_time, arrivalTime, reason, note } = req.body;

      const callerSchoolId = (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) 
        ? req.user?.schoolId 
        : undefined;

      const updated = await attendanceRepository.updateAttendance(
        id,
        {
          status,
          arrivalTime: arrival_time !== undefined ? arrival_time : arrivalTime,
          reason,
          note,
          markedByUserId: req.user?.id,
        },
        callerSchoolId
      );

      res.json({
        success: true,
        message: 'Attendance record updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AttendanceAPI] Failed to update attendance:', error);
      if (error.message?.includes('CROSS_SCHOOL') || error.message?.includes('INVALID_STATUS') || error.message?.includes('NOT_FOUND')) {
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
        message: error.message || 'Failed to update attendance.',
      });
    }
  }
);
