/**
 * BummptEducation — Admissions API Routes (/api/v1/admissions)
 * 
 * Server-authoritative endpoints for student applications, screening/examination scores,
 * admissions decisions, and atomic enrollment into the student registry.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { AdmissionsRepository } from '../../db/repositories/admissions.repository';
import { FinancialAuditRepository } from '../../db/repositories/financialAudit.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const admissionsRouter = Router();
const admissionsRepo = new AdmissionsRepository();
const auditRepo = new FinancialAuditRepository();

/**
 * POST /api/v1/admissions
 * Submits a new student application
 */
admissionsRouter.post(
  '/',
  authenticateUser,
  requirePermission('admissions.create'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        schoolId,
        studentName,
        appliedClass,
        arm,
        guardianName,
        guardianPhone,
        guardianEmail,
        previousSchool,
        developmentalReadinessScore,
        immunizationCompleted,
        toiletTrained,
        entranceExamScore,
        interviewScore,
        academicSessionId,
        classId,
        submittedDate,
      } = req.body;

      let targetSchoolId = schoolId || req.user?.schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'schoolId is required.',
        });
        return;
      }

      if (!studentName || !appliedClass || !guardianName || !guardianPhone) {
        res.status(400).json({
          success: false,
          error: 'INVALID_PAYLOAD',
          message: 'studentName, appliedClass, guardianName, and guardianPhone are required.',
        });
        return;
      }

      const application = await admissionsRepo.createApplication({
        schoolId: targetSchoolId,
        studentName,
        appliedClass,
        arm: arm || 'primary',
        guardianName,
        guardianPhone,
        guardianEmail,
        previousSchool,
        developmentalReadinessScore,
        immunizationCompleted,
        toiletTrained,
        entranceExamScore,
        interviewScore,
        academicSessionId,
        classId,
        submittedDate,
        createdBy: req.user?.id,
      }, { tenantContext: req.tenantContext });

      await auditRepo.logAction({
        schoolId: targetSchoolId,
        userId: req.user?.id,
        entityType: 'ADMISSION',
        entityId: application.id,
        action: 'CREATE_APPLICATION',
        details: { applicationNumber: application.application_number, studentName },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: application,
      });
    } catch (error: any) {
      console.error('[AdmissionsRouter] Error creating application:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'APPLICATION_CREATE_ERROR',
        message: error.message || 'Failed to submit admission application.',
      });
    }
  }
);

/**
 * GET /api/v1/admissions
 * Lists applications with filtering and pagination
 */
admissionsRouter.get(
  '/',
  authenticateUser,
  requirePermission('admissions.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      let targetSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      const filter = {
        schoolId: targetSchoolId || undefined,
        academicSessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
        classId: (req.query.class_id as string) || (req.query.classId as string),
        status: req.query.status as string,
        search: req.query.search as string,
      };

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await admissionsRepo.findApplications(filter, {
        limit,
        offset,
        tenantContext: req.tenantContext,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore,
        },
      });
    } catch (error: any) {
      console.error('[AdmissionsRouter] Error querying applications:', error);
      res.status(500).json({
        success: false,
        error: 'QUERY_ERROR',
        message: 'Failed to retrieve admission applications.',
      });
    }
  }
);

/**
 * GET /api/v1/admissions/:id
 * Retrieves application details
 */
admissionsRouter.get(
  '/:id',
  authenticateUser,
  requirePermission('admissions.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const application = await admissionsRepo.findByIdWithDetails(req.params.id, {
        tenantContext: req.tenantContext,
      });

      if (!application) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Admission application not found.',
        });
        return;
      }

      res.json({
        success: true,
        data: application,
      });
    } catch (error: any) {
      console.error('[AdmissionsRouter] Error retrieving application:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch application details.',
      });
    }
  }
);

/**
 * PATCH /api/v1/admissions/:id/decision
 * Updates admission status / decision (ACCEPTED, REJECTED, WAITLISTED, UNDER_REVIEW)
 */
admissionsRouter.patch(
  '/:id/decision',
  authenticateUser,
  requirePermission('admissions.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { decision, notes } = req.body;
      if (!decision || !['ACCEPTED', 'REJECTED', 'WAITLISTED', 'UNDER_REVIEW'].includes(decision.toUpperCase())) {
        res.status(400).json({
          success: false,
          error: 'INVALID_DECISION',
          message: "decision must be one of 'ACCEPTED', 'REJECTED', 'WAITLISTED', 'UNDER_REVIEW'.",
        });
        return;
      }

      const updated = await admissionsRepo.updateDecision(
        req.params.id,
        decision.toUpperCase() as any,
        notes,
        req.user?.id,
        { tenantContext: req.tenantContext }
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Admission application not found.',
        });
        return;
      }

      await auditRepo.logAction({
        schoolId: updated.school_id,
        userId: req.user?.id,
        entityType: 'ADMISSION',
        entityId: updated.id,
        action: `DECISION_${decision.toUpperCase()}`,
        details: { decision, notes },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      console.error('[AdmissionsRouter] Error updating decision:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'DECISION_ERROR',
        message: error.message || 'Failed to update admission decision.',
      });
    }
  }
);

/**
 * POST /api/v1/admissions/:id/enroll
 * ATOMIC ENROLLMENT:
 * Converts an accepted applicant into an enrolled student and creates enrollment ledger.
 */
admissionsRouter.post(
  '/:id/enroll',
  authenticateUser,
  requirePermission('admissions.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { classId, academicSessionId, academicTermId, admissionNumber, gender, dateOfBirth } = req.body;

      if (!classId || !academicSessionId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'classId and academicSessionId are required to enroll an applicant.',
        });
        return;
      }

      const result = await admissionsRepo.enrollApplicant(
        req.params.id,
        {
          classId,
          academicSessionId,
          academicTermId,
          admissionNumber,
          gender,
          dateOfBirth,
          enrolledByUserId: req.user?.id,
        },
        { tenantContext: req.tenantContext }
      );

      await auditRepo.logAction({
        schoolId: result.student.school_id,
        userId: req.user?.id,
        entityType: 'ADMISSION',
        entityId: req.params.id,
        action: 'ENROLL_APPLICANT',
        details: {
          studentId: result.student.id,
          admissionNumber: result.student.admission_number,
          classId,
        },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Applicant successfully enrolled as active student.',
        data: result,
      });
    } catch (error: any) {
      console.error('[AdmissionsRouter] Error enrolling applicant:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'ENROLLMENT_ERROR',
        message: error.message || 'Failed to enroll applicant.',
      });
    }
  }
);
