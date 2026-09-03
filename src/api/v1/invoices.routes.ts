/**
 * BummptEducation — Fee Invoices API Routes (/api/v1/invoices)
 * 
 * Server-authoritative endpoints for creating official school fee invoices,
 * bundling assessed line items, tracking outstanding liabilities, and invoice cancellation.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { InvoiceRepository } from '../../db/repositories/invoice.repository';
import { FinancialAuditRepository } from '../../db/repositories/financialAudit.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const invoicesRouter = Router();
const invoiceRepo = new InvoiceRepository();
const auditRepo = new FinancialAuditRepository();

/**
 * POST /api/v1/invoices
 * Creates an invoice with explicit server-calculated line items
 */
invoicesRouter.post(
  '/',
  authenticateUser,
  requirePermission('invoices.create'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        schoolId,
        studentId,
        academicSessionId,
        academicTermId,
        classId,
        dueDate,
        items,
      } = req.body;

      let targetSchoolId = schoolId || req.user?.schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId || !studentId || !academicSessionId || !academicTermId || !items || !Array.isArray(items)) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'schoolId, studentId, academicSessionId, academicTermId, and items array are required.',
        });
        return;
      }

      const invoice = await invoiceRepo.createInvoice({
        schoolId: targetSchoolId,
        studentId,
        academicSessionId,
        academicTermId,
        classId,
        dueDate,
        items,
        createdBy: req.user?.id,
      }, { tenantContext: req.tenantContext });

      await auditRepo.logAction({
        schoolId: targetSchoolId,
        userId: req.user?.id,
        entityType: 'INVOICE',
        entityId: invoice.id,
        action: 'CREATE_INVOICE',
        amount: Number(invoice.total_billed),
        details: { invoiceNumber: invoice.invoice_number, studentId, itemCount: items.length },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      console.error('[InvoicesRouter] Error creating invoice:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'INVOICE_CREATE_ERROR',
        message: error.message || 'Failed to generate fee invoice.',
      });
    }
  }
);

/**
 * POST /api/v1/invoices/generate-from-assessments
 * Generates an official invoice automatically from pending student fee assessments
 */
invoicesRouter.post(
  '/generate-from-assessments',
  authenticateUser,
  requirePermission('invoices.create'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        schoolId,
        studentId,
        academicSessionId,
        academicTermId,
        assessmentIds,
        dueDate,
      } = req.body;

      let targetSchoolId = schoolId || req.user?.schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId || !studentId || !academicSessionId || !academicTermId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'schoolId, studentId, academicSessionId, and academicTermId are required.',
        });
        return;
      }

      const invoice = await invoiceRepo.generateInvoiceFromPendingAssessments({
        schoolId: targetSchoolId,
        studentId,
        academicSessionId,
        academicTermId,
        assessmentIds,
        dueDate,
        createdBy: req.user?.id,
      }, { tenantContext: req.tenantContext });

      await auditRepo.logAction({
        schoolId: targetSchoolId,
        userId: req.user?.id,
        entityType: 'INVOICE',
        entityId: invoice.id,
        action: 'GENERATE_INVOICE_FROM_ASSESSMENTS',
        amount: Number(invoice.total_billed),
        details: { invoiceNumber: invoice.invoice_number, studentId },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: `Successfully generated invoice #${invoice.invoice_number}`,
        data: invoice,
      });
    } catch (error: any) {
      console.error('[InvoicesRouter] Error generating invoice from assessments:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'INVOICE_GENERATION_ERROR',
        message: error.message || 'Failed to generate invoice from assessments.',
      });
    }
  }
);

/**
 * GET /api/v1/invoices
 * Lists invoices with filtering and pagination
 */
invoicesRouter.get(
  '/',
  authenticateUser,
  requirePermission('invoices.view'),
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
        search: req.query.search as string,
      };

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await invoiceRepo.findInvoices(filter, {
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
      console.error('[InvoicesRouter] Error querying invoices:', error);
      res.status(500).json({
        success: false,
        error: 'QUERY_ERROR',
        message: 'Failed to retrieve fee invoices.',
      });
    }
  }
);

/**
 * GET /api/v1/invoices/:id
 * Retrieves invoice details with line items
 */
invoicesRouter.get(
  '/:id',
  authenticateUser,
  requirePermission('invoices.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const invoice = await invoiceRepo.findByIdWithItems(req.params.id, {
        tenantContext: req.tenantContext,
      });

      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Invoice not found.',
        });
        return;
      }

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      console.error('[InvoicesRouter] Error retrieving invoice:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve invoice details.',
      });
    }
  }
);

/**
 * POST /api/v1/invoices/:id/cancel
 * Cancels an unpaid invoice and reverts any associated assessments
 */
invoicesRouter.post(
  '/:id/cancel',
  authenticateUser,
  requirePermission('fees.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const cancelled = await invoiceRepo.cancelInvoice(req.params.id, {
        tenantContext: req.tenantContext,
      });

      await auditRepo.logAction({
        schoolId: cancelled.school_id,
        userId: req.user?.id,
        entityType: 'INVOICE',
        entityId: cancelled.id,
        action: 'CANCEL_INVOICE',
        details: { invoiceNumber: cancelled.invoice_number },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `Invoice #${cancelled.invoice_number} successfully cancelled.`,
        data: cancelled,
      });
    } catch (error: any) {
      console.error('[InvoicesRouter] Error cancelling invoice:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'CANCEL_ERROR',
        message: error.message || 'Failed to cancel invoice.',
      });
    }
  }
);
