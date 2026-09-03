/**
 * BummptEducation — Fee Structures & Assessments API Routes (/api/v1/fees)
 * 
 * Server-authoritative endpoints for managing termly approved fee schedules,
 * institutional fee categories, and assigning student charges.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { FeeRepository } from '../../db/repositories/fee.repository';
import { FinancialAuditRepository } from '../../db/repositories/financialAudit.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const feesRouter = Router();
const feeRepo = new FeeRepository();
const auditRepo = new FinancialAuditRepository();

/**
 * GET /api/v1/fees/categories
 * Returns active institutional fee categories
 */
feesRouter.get(
  '/categories',
  authenticateUser,
  requirePermission('fees.view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await feeRepo.getCategories();
      res.json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      console.error('[FeesRouter] Error fetching fee categories:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve fee categories.',
      });
    }
  }
);

/**
 * POST /api/v1/fees/structures
 * Creates a new school-scoped fee structure item for a class and term
 */
feesRouter.post(
  '/structures',
  authenticateUser,
  requirePermission('fees.create'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        schoolId,
        academicSessionId,
        academicTermId,
        classId,
        categoryId,
        name,
        amount,
        isMandatory,
        effectiveDate,
        status,
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

      if (!academicSessionId || !academicTermId || !classId || !categoryId || !name || amount === undefined) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'academicSessionId, academicTermId, classId, categoryId, name, and amount are required.',
        });
        return;
      }

      const structure = await feeRepo.createFeeStructure({
        schoolId: targetSchoolId,
        academicSessionId,
        academicTermId,
        classId,
        categoryId,
        name,
        amount: Number(amount),
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : true,
        effectiveDate,
        status: status || 'ACTIVE',
        createdBy: req.user?.id,
      }, { tenantContext: req.tenantContext });

      await auditRepo.logAction({
        schoolId: targetSchoolId,
        userId: req.user?.id,
        entityType: 'FEE_STRUCTURE',
        entityId: structure.id,
        action: 'CREATE_STRUCTURE',
        amount: Number(amount),
        details: { name, classId, categoryId },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: structure,
      });
    } catch (error: any) {
      console.error('[FeesRouter] Error creating fee structure:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'CREATE_ERROR',
        message: error.message || 'Failed to create fee structure.',
      });
    }
  }
);

/**
 * GET /api/v1/fees/structures
 * Lists fee structures by school, session, term, and class
 */
feesRouter.get(
  '/structures',
  authenticateUser,
  requirePermission('fees.view'),
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
        academicTermId: (req.query.term_id as string) || (req.query.academic_term_id as string),
        classId: (req.query.class_id as string) || (req.query.classId as string),
        categoryId: (req.query.category_id as string) || (req.query.categoryId as string),
        status: req.query.status as string,
      };

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await feeRepo.findFeeStructures(filter, {
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
      console.error('[FeesRouter] Error querying fee structures:', error);
      res.status(500).json({
        success: false,
        error: 'QUERY_ERROR',
        message: 'Failed to retrieve fee structures.',
      });
    }
  }
);

/**
 * POST /api/v1/fees/assessments
 * Assesses an individual student fee charge
 */
feesRouter.post(
  '/assessments',
  authenticateUser,
  requirePermission('fees.create'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        schoolId,
        studentId,
        academicSessionId,
        academicTermId,
        classId,
        feeStructureId,
        categoryId,
        amount,
        dueDate,
      } = req.body;

      let targetSchoolId = schoolId || req.user?.schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId || !studentId || !academicSessionId || !academicTermId || !classId || !categoryId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'schoolId, studentId, academicSessionId, academicTermId, classId, and categoryId are required.',
        });
        return;
      }

      const assessment = await feeRepo.assessStudentFee({
        schoolId: targetSchoolId,
        studentId,
        academicSessionId,
        academicTermId,
        classId,
        feeStructureId,
        categoryId,
        amount: amount !== undefined ? Number(amount) : undefined,
        dueDate,
        createdBy: req.user?.id,
      }, { tenantContext: req.tenantContext });

      await auditRepo.logAction({
        schoolId: targetSchoolId,
        userId: req.user?.id,
        entityType: 'ASSESSMENT',
        entityId: assessment.id,
        action: 'ASSESS_STUDENT_FEE',
        amount: Number(assessment.amount),
        details: { studentId, categoryId },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      console.error('[FeesRouter] Error assessing student fee:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'ASSESSMENT_ERROR',
        message: error.message || 'Failed to assess student fee.',
      });
    }
  }
);

/**
 * POST /api/v1/fees/assessments/bulk-class
 * Bulk assesses all active students in a class for a term based on active mandatory fee structures
 */
feesRouter.post(
  '/assessments/bulk-class',
  authenticateUser,
  requirePermission('fees.create'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { schoolId, academicSessionId, academicTermId, classId, dueDate } = req.body;

      let targetSchoolId = schoolId || req.user?.schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId || !academicSessionId || !academicTermId || !classId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'schoolId, academicSessionId, academicTermId, and classId are required.',
        });
        return;
      }

      const result = await feeRepo.assessClassFees(
        targetSchoolId,
        academicSessionId,
        academicTermId,
        classId,
        dueDate,
        req.user?.id,
        { tenantContext: req.tenantContext }
      );

      await auditRepo.logAction({
        schoolId: targetSchoolId,
        userId: req.user?.id,
        entityType: 'ASSESSMENT',
        entityId: classId,
        action: 'BULK_CLASS_ASSESSMENT',
        details: result,
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: `Successfully assessed fees for ${result.assessedStudentsCount} students (${result.assessmentsCreatedCount} charges created).`,
        data: result,
      });
    } catch (error: any) {
      console.error('[FeesRouter] Error running bulk class assessment:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'BULK_ASSESSMENT_ERROR',
        message: error.message || 'Failed to run bulk class fee assessment.',
      });
    }
  }
);

/**
 * GET /api/v1/fees/assessments/student/:studentId
 * Retrieves all fee assessments for a student
 */
feesRouter.get(
  '/assessments/student/:studentId',
  authenticateUser,
  requirePermission('fees.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const termId = (req.query.term_id as string) || (req.query.academic_term_id as string);
      const assessments = await feeRepo.getStudentAssessments(req.params.studentId, termId, {
        tenantContext: req.tenantContext,
      });

      res.json({
        success: true,
        data: assessments,
      });
    } catch (error: any) {
      console.error('[FeesRouter] Error retrieving student assessments:', error);
      res.status(500).json({
        success: false,
        error: 'QUERY_ERROR',
        message: 'Failed to retrieve student assessments.',
      });
    }
  }
);
