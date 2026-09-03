/**
 * BummptEducation — Bursary & Scholarships API Routes (/api/v1/bursary)
 * 
 * Server-authoritative endpoints for requesting financial aid, merit scholarships,
 * staff discounts, and executing formal administrative approval workflows.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { BursaryRepository } from '../../db/repositories/bursary.repository';
import { FinancialAuditRepository } from '../../db/repositories/financialAudit.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const bursaryRouter = Router();
const bursaryRepo = new BursaryRepository();
const auditRepo = new FinancialAuditRepository();

/**
 * POST /api/v1/bursary
 * Submits a new bursary or scholarship award request
 */
bursaryRouter.post(
  '/',
  authenticateUser,
  requirePermission('bursary.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        schoolId,
        studentId,
        academicSessionId,
        academicTermId,
        awardType,
        awardAmount,
        percentage,
        reason,
        invoiceId,
      } = req.body;

      let targetSchoolId = schoolId || req.user?.schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId || !studentId || !academicSessionId || !academicTermId || !awardType || awardAmount === undefined || !reason) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'schoolId, studentId, academicSessionId, academicTermId, awardType, awardAmount, and reason are required.',
        });
        return;
      }

      const award = await bursaryRepo.createAward({
        schoolId: targetSchoolId,
        studentId,
        academicSessionId,
        academicTermId,
        awardType,
        awardAmount: Number(awardAmount),
        percentage: percentage !== undefined && percentage !== null ? Number(percentage) : undefined,
        reason,
        invoiceId,
        createdBy: req.user?.id,
      }, { tenantContext: req.tenantContext });

      await auditRepo.logAction({
        schoolId: targetSchoolId,
        userId: req.user?.id,
        entityType: 'BURSARY',
        entityId: award.id,
        action: 'REQUEST_BURSARY_AWARD',
        amount: Number(awardAmount),
        details: { awardType, studentId, invoiceId },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Bursary award request submitted for administrative review.',
        data: award,
      });
    } catch (error: any) {
      console.error('[BursaryRouter] Error creating bursary request:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'BURSARY_REQUEST_ERROR',
        message: error.message || 'Failed to submit bursary award request.',
      });
    }
  }
);

/**
 * GET /api/v1/bursary
 * Lists bursary awards with filtering and pagination
 */
bursaryRouter.get(
  '/',
  authenticateUser,
  requirePermission('bursary.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      let targetSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      const filter = {
        schoolId: targetSchoolId || undefined,
        studentId: (req.query.student_id as string) || (req.query.studentId as string),
        academicSessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
        academicTermId: (req.query.term_id as string) || (req.query.academic_term_id as string),
        status: req.query.status as string,
        awardType: (req.query.award_type as string) || (req.query.awardType as string),
        search: req.query.search as string,
      };

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await bursaryRepo.findAwards(filter, {
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
      console.error('[BursaryRouter] Error querying bursaries:', error);
      res.status(500).json({
        success: false,
        error: 'QUERY_ERROR',
        message: 'Failed to retrieve bursary awards.',
      });
    }
  }
);

/**
 * PATCH /api/v1/bursary/:id/review
 * Approves or rejects a bursary award. If approved and linked to an invoice,
 * reconciles the invoice balance atomically.
 */
bursaryRouter.patch(
  '/:id/review',
  authenticateUser,
  requirePermission('bursary.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { decision } = req.body;
      if (!decision || !['APPROVED', 'REJECTED', 'CANCELLED'].includes(decision.toUpperCase())) {
        res.status(400).json({
          success: false,
          error: 'INVALID_DECISION',
          message: "decision must be 'APPROVED', 'REJECTED', or 'CANCELLED'.",
        });
        return;
      }

      const updated = await bursaryRepo.reviewAward(
        req.params.id,
        decision.toUpperCase() as any,
        req.user?.id || 'SYSTEM',
        { tenantContext: req.tenantContext }
      );

      await auditRepo.logAction({
        schoolId: updated.school_id,
        userId: req.user?.id,
        entityType: 'BURSARY',
        entityId: updated.id,
        action: `BURSARY_${decision.toUpperCase()}`,
        amount: Number(updated.award_amount),
        details: { invoiceId: updated.invoice_id, decision },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `Bursary award successfully marked as ${decision.toUpperCase()}.`,
        data: updated,
      });
    } catch (error: any) {
      console.error('[BursaryRouter] Error reviewing bursary award:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'REVIEW_ERROR',
        message: error.message || 'Failed to review bursary award.',
      });
    }
  }
);
