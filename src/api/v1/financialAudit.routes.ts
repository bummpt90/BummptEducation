/**
 * BummptEducation — Financial Audit Logs API Routes (/api/v1/financial/audit)
 * 
 * Server-authoritative endpoints for inspecting immutable ledger audit trails.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { FinancialAuditRepository } from '../../db/repositories/financialAudit.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const financialAuditRouter = Router();
const auditRepo = new FinancialAuditRepository();

/**
 * GET /api/v1/financial/audit
 * Retrieves audit logs for the authenticated school or entity
 */
financialAuditRouter.get(
  '/',
  authenticateUser,
  requirePermission('fees.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      let targetSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      const filter = {
        schoolId: targetSchoolId || undefined,
        entityType: req.query.entity_type as string,
        entityId: req.query.entity_id as string,
        userId: req.query.user_id as string,
      };

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await auditRepo.getAuditLogs(filter, {
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
      console.error('[FinancialAuditRouter] Error querying audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'QUERY_ERROR',
        message: 'Failed to retrieve financial audit logs.',
      });
    }
  }
);
