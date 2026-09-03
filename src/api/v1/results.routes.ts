/**
 * BummptEducation — Academic Results & Broadsheet API Routes (/api/v1/results)
 * 
 * Server-authoritative endpoints for student terminal results,
 * class broadsheet compilation, position ranking, and multi-tenant isolation.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { academicResultRepository } from '../../db/repositories/academicResult.repository';
import { query } from '../../db/client';
import type { AuthenticatedRequest } from '../../auth/types';

export const resultsRouter = Router();

/**
 * GET /api/v1/results/student/:id
 * Retrieves comprehensive term result card for a specific student.
 */
resultsRouter.get(
  '/student/:id',
  authenticateUser,
  requirePermission('results.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const studentId = req.params.id;
      let targetSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      // If user is a student, ensure they can only view their own result
      if (req.user?.role === 'student') {
        const studentUserRes = await query<{ id: string }>(
          'SELECT id FROM students WHERE user_id = $1 OR id = $2 LIMIT 1;',
          [req.user.id, studentId]
        );
        if (!studentUserRes.rows[0] || studentUserRes.rows[0].id !== studentId) {
          res.status(403).json({
            success: false,
            error: 'ACCESS_DENIED',
            message: 'Students may only access their own academic results.',
          });
          return;
        }
      }

      // Verify student belongs to target school
      const studentCheck = await query<{ school_id: string }>(
        'SELECT school_id FROM students WHERE id = $1 LIMIT 1;',
        [studentId]
      );

      if (!studentCheck.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'STUDENT_NOT_FOUND',
          message: 'Student record not found.',
        });
        return;
      }

      const actualSchoolId = studentCheck.rows[0].school_id;

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (actualSchoolId !== targetSchoolId) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: Student belongs to another school tenant.',
          });
          return;
        }
      }

      // Determine term
      let termId = (req.query.term_id as string) || (req.query.termId as string);
      if (!termId) {
        const currentTermRes = await query<{ id: string }>(
          'SELECT id FROM academic_terms WHERE is_current = TRUE LIMIT 1;'
        );
        termId = currentTermRes.rows[0]?.id;
      }

      if (!termId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_TERM_ID',
          message: 'term_id query parameter is required.',
        });
        return;
      }

      const result = await academicResultRepository.getStudentTermResult(
        actualSchoolId,
        studentId,
        termId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[ResultsAPI] Failed to retrieve student result:', error);
      if (error.message?.includes('NOT_FOUND')) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve student result.',
      });
    }
  }
);

/**
 * GET /api/v1/results/broadsheet/:classId
 * Compiles full class broadsheet with all students x subjects matrix.
 * Restricted to academic staff and administration (blocked for parent & student roles).
 */
resultsRouter.get(
  '/broadsheet/:classId',
  authenticateUser,
  requirePermission('results.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Security Check: Parents and students cannot view whole class broadsheets
      if (req.user?.role === 'parent' || req.user?.role === 'student') {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN_ROLE',
          message: 'Class broadsheets may only be viewed by academic faculty and school administration.',
        });
        return;
      }

      const classId = req.params.classId;

      // Verify class exists and check school ownership
      const classCheck = await query<{ id: string; school_id: string }>(
        'SELECT id, school_id FROM classes WHERE id = $1 LIMIT 1;',
        [classId]
      );

      if (!classCheck.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'CLASS_NOT_FOUND',
          message: 'Specified class does not exist.',
        });
        return;
      }

      const classSchoolId = classCheck.rows[0].school_id;

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (classSchoolId !== req.user?.schoolId) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: Class belongs to another school tenant.',
          });
          return;
        }
      }

      // Determine term
      let termId = (req.query.term_id as string) || (req.query.termId as string);
      if (!termId) {
        const currentTermRes = await query<{ id: string }>(
          'SELECT id FROM academic_terms WHERE is_current = TRUE LIMIT 1;'
        );
        termId = currentTermRes.rows[0]?.id;
      }

      if (!termId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_TERM_ID',
          message: 'term_id query parameter is required.',
        });
        return;
      }

      const broadsheet = await academicResultRepository.getClassBroadsheet(
        classSchoolId,
        classId,
        termId
      );

      res.json({
        success: true,
        data: broadsheet,
      });
    } catch (error: any) {
      console.error('[ResultsAPI] Failed to retrieve class broadsheet:', error);
      if (error.message?.includes('NOT_FOUND')) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to generate class broadsheet.',
      });
    }
  }
);

/**
 * GET /api/v1/results/class/:id
 * Retrieves class results summary.
 */
resultsRouter.get(
  '/class/:id',
  authenticateUser,
  requirePermission('results.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const classId = req.params.id;

      const classCheck = await query<{ id: string; school_id: string }>(
        'SELECT id, school_id FROM classes WHERE id = $1 LIMIT 1;',
        [classId]
      );

      if (!classCheck.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'CLASS_NOT_FOUND',
          message: 'Class not found.',
        });
        return;
      }

      const classSchoolId = classCheck.rows[0].school_id;

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (classSchoolId !== req.user?.schoolId) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: Class belongs to another school tenant.',
          });
          return;
        }
      }

      let termId = (req.query.term_id as string) || (req.query.termId as string);
      if (!termId) {
        const currentTermRes = await query<{ id: string }>(
          'SELECT id FROM academic_terms WHERE is_current = TRUE LIMIT 1;'
        );
        termId = currentTermRes.rows[0]?.id;
      }

      if (!termId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_TERM_ID',
          message: 'term_id is required.',
        });
        return;
      }

      const broadsheet = await academicResultRepository.getClassBroadsheet(
        classSchoolId,
        classId,
        termId
      );

      res.json({
        success: true,
        data: {
          class: broadsheet.class,
          term: broadsheet.term,
          analytics: broadsheet.analytics,
          studentCount: broadsheet.students.length,
        },
      });
    } catch (error: any) {
      console.error('[ResultsAPI] Failed to retrieve class results:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve class results.',
      });
    }
  }
);
