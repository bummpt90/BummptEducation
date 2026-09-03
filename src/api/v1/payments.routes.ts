/**
 * BummptEducation — Fee Payments & Receipts API Routes (/api/v1/payments)
 * 
 * Server-authoritative endpoints for recording verified student fee payments,
 * issuing collision-resistant digital receipts, updating balances atomically,
 * and generating student balance and exam clearance reports.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { PaymentRepository } from '../../db/repositories/payment.repository';
import { FinancialAuditRepository } from '../../db/repositories/financialAudit.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const paymentsRouter = Router();
const paymentRepo = new PaymentRepository();
const auditRepo = new FinancialAuditRepository();

/**
 * POST /api/v1/payments
 * Records a payment against an invoice inside an ACID transaction
 */
paymentsRouter.post(
  '/',
  authenticateUser,
  requirePermission('payments.record'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        schoolId,
        studentId,
        invoiceId,
        amount,
        paymentMethod,
        paymentReference,
        bankReference,
        paymentDate,
        collectedBy,
      } = req.body;

      let targetSchoolId = schoolId || req.user?.schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId || !studentId || !invoiceId || amount === undefined) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'schoolId, studentId, invoiceId, and amount are required.',
        });
        return;
      }

      const payment = await paymentRepo.recordPayment({
        schoolId: targetSchoolId,
        studentId,
        invoiceId,
        amount: Number(amount),
        paymentMethod: paymentMethod || 'Bank Transfer',
        paymentReference,
        bankReference,
        paymentDate,
        collectedBy,
        recordedByUserId: req.user?.id,
      }, { tenantContext: req.tenantContext });

      await auditRepo.logAction({
        schoolId: targetSchoolId,
        userId: req.user?.id,
        entityType: 'PAYMENT',
        entityId: payment.id,
        action: 'RECORD_PAYMENT',
        amount: Number(amount),
        details: {
          receiptNumber: payment.receipt_number,
          invoiceId,
          studentId,
          paymentMethod,
        },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: `Payment successfully recorded. Receipt #${payment.receipt_number} issued.`,
        data: payment,
      });
    } catch (error: any) {
      console.error('[PaymentsRouter] Error recording payment:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'PAYMENT_ERROR',
        message: error.message || 'Failed to record payment.',
      });
    }
  }
);

/**
 * GET /api/v1/payments
 * Lists payments with filtering and pagination
 */
paymentsRouter.get(
  '/',
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
        studentId: (req.query.student_id as string) || (req.query.studentId as string),
        invoiceId: (req.query.invoice_id as string) || (req.query.invoiceId as string),
        paymentMethod: req.query.payment_method as string,
        status: req.query.status as string,
        search: req.query.search as string,
      };

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await paymentRepo.findPayments(filter, {
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
      console.error('[PaymentsRouter] Error querying payments:', error);
      res.status(500).json({
        success: false,
        error: 'QUERY_ERROR',
        message: 'Failed to retrieve fee payments.',
      });
    }
  }
);

/**
 * GET /api/v1/payments/receipt/:receiptNumberOrId
 * Retrieves an authoritative institutional digital receipt
 */
paymentsRouter.get(
  '/receipt/:receiptNumberOrId',
  authenticateUser,
  requirePermission('fees.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const receipt = await paymentRepo.getAuthoritativeReceipt(req.params.receiptNumberOrId, {
        tenantContext: req.tenantContext,
      });

      if (!receipt) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Receipt not found.',
        });
        return;
      }

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error: any) {
      console.error('[PaymentsRouter] Error fetching receipt:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve authoritative receipt.',
      });
    }
  }
);

/**
 * GET /api/v1/payments/student-balance/:studentId
 * Computes live real-time balance and examination clearance for a student
 */
paymentsRouter.get(
  '/student-balance/:studentId',
  authenticateUser,
  requirePermission('fees.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const balanceReport = await paymentRepo.computeStudentBalance(req.params.studentId, {
        tenantContext: req.tenantContext,
      });

      res.json({
        success: true,
        data: balanceReport,
      });
    } catch (error: any) {
      console.error('[PaymentsRouter] Error computing student balance:', error);
      res.status(400).json({
        success: false,
        error: error.code || 'BALANCE_ERROR',
        message: error.message || 'Failed to compute student balance.',
      });
    }
  }
);
