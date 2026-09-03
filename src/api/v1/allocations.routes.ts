/**
 * BummptEducation — Academic Allocations API Routes (/api/v1/academic/allocations)
 * 
 * Server-authoritative endpoints for class-subject allocations,
 * teacher assignments, period distribution, and curriculum scheduling.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { classSubjectAllocationRepository } from '../../db/repositories/classSubjectAllocation.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const allocationsRouter = Router();

/**
 * GET /api/v1/academic/allocations
 * Retrieves class-subject allocations within caller's tenant scope.
 */
allocationsRouter.get(
  '/',
  authenticateUser,
  requirePermission('allocations.view'),
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

      const allocations = await classSubjectAllocationRepository.findBySchool(targetSchoolId, {
        classId: (req.query.class_id as string) || (req.query.classId as string),
        subjectId: (req.query.subject_id as string) || (req.query.subjectId as string),
        teacherId: (req.query.teacher_id as string) || (req.query.teacherId as string),
        academicSessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
        academicTermId: (req.query.term_id as string) || (req.query.academic_term_id as string),
      });

      res.json({
        success: true,
        count: allocations.length,
        data: allocations,
      });
    } catch (error: any) {
      console.error('[AllocationsAPI] Failed to fetch allocations:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve academic allocations.',
      });
    }
  }
);

/**
 * POST /api/v1/academic/allocations
 * Allocates a subject to a class for a specific term and assigns a teacher.
 */
allocationsRouter.post(
  '/',
  authenticateUser,
  requirePermission('allocations.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        school_id,
        schoolId,
        class_id,
        classId,
        subject_id,
        subjectId,
        teacher_id,
        teacherId,
        academic_session_id,
        academicSessionId,
        academic_term_id,
        academicTermId,
        periods_per_week,
        periodsPerWeek,
      } = req.body;

      let targetSchoolId = school_id || schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId;
      }

      const targetClassId = class_id || classId;
      const targetSubjectId = subject_id || subjectId;
      const targetTermId = academic_term_id || academicTermId;
      const targetSessionId = academic_session_id || academicSessionId;
      const targetTeacherId = teacher_id || teacherId;
      const targetPeriods = periods_per_week || periodsPerWeek;

      if (!targetSchoolId || !targetClassId || !targetSubjectId || !targetTermId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'class_id, subject_id, and academic_term_id are required fields.',
        });
        return;
      }

      const allocation = await classSubjectAllocationRepository.allocateSubject({
        schoolId: targetSchoolId,
        classId: targetClassId,
        subjectId: targetSubjectId,
        teacherId: targetTeacherId || null,
        academicSessionId: targetSessionId || null,
        academicTermId: targetTermId,
        periodsPerWeek: targetPeriods ? Number(targetPeriods) : 4,
      });

      res.status(201).json({
        success: true,
        message: 'Class-subject allocation successfully created.',
        data: allocation,
      });
    } catch (error: any) {
      console.error('[AllocationsAPI] Failed to allocate subject:', error);

      if (error.message?.includes('DUPLICATE_ALLOCATION')) {
        res.status(409).json({
          success: false,
          error: 'DUPLICATE_ALLOCATION',
          message: error.message,
        });
        return;
      }

      if (
        error.message?.includes('CROSS_SCHOOL') ||
        error.message?.includes('NOT_FOUND') ||
        error.message?.includes('MISMATCH') ||
        error.message?.includes('INVALID')
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
        message: error.message || 'Failed to create class-subject allocation.',
      });
    }
  }
);

/**
 * PATCH /api/v1/academic/allocations/:id
 * Updates an allocation's assigned teacher or periods per week.
 */
allocationsRouter.patch(
  '/:id',
  authenticateUser,
  requirePermission('allocations.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { teacher_id, teacherId, periods_per_week, periodsPerWeek } = req.body;

      const callerSchoolId = (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) 
        ? req.user?.schoolId 
        : undefined;

      const updated = await classSubjectAllocationRepository.updateAllocation(
        id,
        {
          teacherId: teacher_id !== undefined ? teacher_id : teacherId,
          periodsPerWeek: periods_per_week !== undefined ? Number(periods_per_week) : (periodsPerWeek !== undefined ? Number(periodsPerWeek) : undefined),
        },
        callerSchoolId
      );

      res.json({
        success: true,
        message: 'Allocation updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AllocationsAPI] Failed to update allocation:', error);
      if (error.message?.includes('CROSS_SCHOOL') || error.message?.includes('NOT_FOUND') || error.message?.includes('INVALID')) {
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
        message: error.message || 'Failed to update allocation.',
      });
    }
  }
);

/**
 * DELETE /api/v1/academic/allocations/:id
 * Deletes an allocation with tenant isolation check.
 */
allocationsRouter.delete(
  '/:id',
  authenticateUser,
  requirePermission('allocations.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const callerSchoolId = (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) 
        ? req.user?.schoolId 
        : undefined;

      const deleted = await classSubjectAllocationRepository.deleteAllocation(id, callerSchoolId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Allocation record not found or access denied.',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Allocation deleted successfully.',
      });
    } catch (error: any) {
      console.error('[AllocationsAPI] Failed to delete allocation:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete allocation.',
      });
    }
  }
);
