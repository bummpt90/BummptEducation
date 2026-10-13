/**
 * BummptEducation — Classes API Routes (/api/v1/classes)
 * 
 * Server-authoritative endpoints for institutional classes,
 * educational levels, arms, capacity, and form master linkages.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireAnyPermission, requireSchoolScope } from '../../auth/middleware';
import { ClassRepository } from '../../db/repositories/class.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const classesRouter = Router();
const classRepo = new ClassRepository();

/**
 * GET /api/v1/classes
 * Lists classes for a school tenant.
 * School-scoped users can only list classes for their own school.
 */
classesRouter.get(
  '/',
  authenticateUser,
  requireAnyPermission('schools.view', 'students.view', 'attendance.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const requestedSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);
      let targetSchoolId = requestedSchoolId;

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (requestedSchoolId && requestedSchoolId !== req.user?.schoolId) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: Cannot query classes of another school.',
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

      const arm = req.query.arm as ('kindergarten' | 'primary' | 'secondary') | undefined;
      const classes = await classRepo.findBySchool(targetSchoolId, arm);

      res.json({
        success: true,
        count: classes.length,
        data: classes,
      });
    } catch (error: any) {
      console.error('[ClassesAPI] Failed to fetch classes:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_CLASSES_FAILED',
        message: 'Failed to retrieve classes.',
      });
    }
  }
);

/**
 * POST /api/v1/classes
 * Creates an authoritative classroom/grade arm for a school.
 */
classesRouter.post(
  '/',
  authenticateUser,
  requirePermission('schools.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        school_id,
        schoolId,
        level,
        arm,
        name,
        category,
        classroom_block,
        classroomBlock,
        capacity,
        form_master_id,
        formMasterId,
      } = req.body || {};

      let targetSchoolId = school_id || schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId;
      }

      if (!targetSchoolId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'school_id is required.',
        });
        return;
      }

      const newClass = await classRepo.createClass({
        schoolId: targetSchoolId,
        level,
        arm,
        name,
        category,
        classroomBlock: classroom_block || classroomBlock,
        capacity,
        formMasterId: form_master_id || formMasterId,
      });

      res.status(201).json({
        success: true,
        message: 'Classroom successfully created.',
        data: newClass,
      });
    } catch (error: any) {
      if (
        error.message?.includes('INVALID_') ||
        error.message?.includes('STAFF_NOT_FOUND') ||
        error.message?.includes('VIOLATION')
      ) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_FAILED',
          message: error.message,
        });
        return;
      }
      if (error.code === '23505') {
        res.status(409).json({
          success: false,
          error: 'DUPLICATE_CLASS',
          message: 'A class with the same name and level already exists in this school.',
        });
        return;
      }
      console.error('[ClassesAPI] Failed to create class:', error);
      res.status(500).json({
        success: false,
        error: 'CREATE_CLASS_FAILED',
        message: 'Failed to create class.',
      });
    }
  }
);

/**
 * PATCH /api/v1/classes/:id
 * Updates an authoritative class record.
 */
classesRouter.patch(
  '/:id',
  authenticateUser,
  requirePermission('schools.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const {
        school_id,
        schoolId,
        level,
        arm,
        name,
        category,
        classroom_block,
        classroomBlock,
        capacity,
        form_master_id,
        formMasterId,
      } = req.body || {};

      let targetSchoolId = school_id || schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId;
      }

      if (!targetSchoolId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'school_id is required.',
        });
        return;
      }

      const updatedClass = await classRepo.updateClass(id, targetSchoolId, {
        level,
        arm,
        name,
        category,
        classroomBlock: classroom_block !== undefined ? classroom_block : classroomBlock,
        capacity,
        formMasterId: form_master_id !== undefined ? form_master_id : formMasterId,
      });

      res.json({
        success: true,
        message: 'Classroom successfully updated.',
        data: updatedClass,
      });
    } catch (error: any) {
      if (
        error.message?.includes('INVALID_') ||
        error.message?.includes('STAFF_NOT_FOUND') ||
        error.message?.includes('VIOLATION')
      ) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_FAILED',
          message: error.message,
        });
        return;
      }
      if (error.message?.includes('CLASS_NOT_FOUND')) {
        res.status(404).json({
          success: false,
          error: 'CLASS_NOT_FOUND',
          message: error.message,
        });
        return;
      }
      console.error('[ClassesAPI] Failed to update class:', error);
      res.status(500).json({
        success: false,
        error: 'UPDATE_CLASS_FAILED',
        message: 'Failed to update class.',
      });
    }
  }
);
