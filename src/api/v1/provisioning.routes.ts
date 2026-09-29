/**
 * BummptEducation — Phase 10C Institutional & Administrator Provisioning Routes (/api/v1/provisioning)
 *
 * Server-authoritative endpoints for:
 * - GET  /api/v1/provisioning/status          (Super Admin / State Officer read-only readiness check)
 * - GET  /api/v1/provisioning/organizations   (Super Admin / State Officer list organizations)
 * - POST /api/v1/provisioning/organizations   (Super Admin only: provision organization)
 * - POST /api/v1/provisioning/schools         (Super Admin only: provision school under organization)
 * - POST /api/v1/provisioning/administrators  (Super Admin / scoped Principal: provision admin/staff user)
 *
 * SECURITY CONTRACT:
 * - Zero unrestricted public organization/school/admin creation endpoints.
 * - All endpoints require valid server-verified authentication & RBAC clearance.
 */

import { Router, Response } from 'express';
import { authenticateUser, requireRole } from '../../auth/middleware';
import {
  provisionOrganization,
  provisionSchool,
  provisionAdministrator,
  verifyProvisioningState,
  ProvisioningError,
} from '../../auth/provisioning.service';
import { organizationRepository } from '../../db/repositories/organization.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const provisioningRouter = Router();

function handleProvisioningRouteError(res: Response, error: any, fallbackMessage: string) {
  if (error instanceof ProvisioningError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.code,
      message: error.message,
    });
  }
  console.error('[ProvisioningAPI] Error:', error?.message || error);
  return res.status(500).json({
    success: false,
    error: 'PROVISIONING_SERVER_ERROR',
    message: fallbackMessage,
  });
}

/**
 * GET /api/v1/provisioning/status
 * Returns read-only provisioning verification status for platform administrators.
 */
provisioningRouter.get(
  '/status',
  authenticateUser,
  requireRole('super_admin', 'state_officer'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const report = await verifyProvisioningState();
      return res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      return handleProvisioningRouteError(res, error, 'Failed to verify provisioning state.');
    }
  }
);

/**
 * GET /api/v1/provisioning/organizations
 * Lists all authoritative organizations for platform administrators.
 */
provisioningRouter.get(
  '/organizations',
  authenticateUser,
  requireRole('super_admin', 'state_officer'),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const organizations = await organizationRepository.listAll();
      return res.json({
        success: true,
        count: organizations.length,
        data: organizations,
      });
    } catch (error: any) {
      return handleProvisioningRouteError(res, error, 'Failed to list organizations.');
    }
  }
);

/**
 * POST /api/v1/provisioning/organizations
 * Provisions an authoritative organization record. Restricted to Super Admin.
 */
provisioningRouter.post(
  '/organizations',
  authenticateUser,
  requireRole('super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, code } = req.body || {};
      const created = await provisionOrganization(
        { name, code },
        {
          user: req.user,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        }
      );
      return res.status(201).json({
        success: true,
        message: `Organization '${created.name}' (${created.code}) provisioned successfully.`,
        data: created,
      });
    } catch (error: any) {
      return handleProvisioningRouteError(res, error, 'Failed to provision organization.');
    }
  }
);

/**
 * POST /api/v1/provisioning/schools
 * Provisions an authoritative school under an organization. Restricted to Super Admin.
 */
provisioningRouter.post(
  '/schools',
  authenticateUser,
  requireRole('super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        organizationId,
        organization_id,
        name,
        code,
        lga,
        senatorialZone,
        senatorial_zone,
        category,
        principalName,
        principal_name,
        bursarName,
        bursar_name,
        vicePrincipalAcademic,
        vice_principal_academic,
        phone,
        email,
        address,
        establishedYear,
        established_year,
        isActive,
        is_active,
      } = req.body || {};

      const created = await provisionSchool(
        {
          organizationId: organizationId || organization_id,
          name,
          code,
          lga,
          senatorialZone: senatorialZone || senatorial_zone,
          category,
          principalName: principalName ?? principal_name ?? null,
          bursarName: bursarName ?? bursar_name ?? null,
          vicePrincipalAcademic: vicePrincipalAcademic ?? vice_principal_academic ?? null,
          phone: phone ?? null,
          email: email ?? null,
          address: address ?? null,
          establishedYear: establishedYear ?? established_year ?? null,
          isActive: isActive ?? is_active ?? true,
        },
        {
          user: req.user,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        }
      );

      return res.status(201).json({
        success: true,
        message: `School '${created.name}' (${created.code}) provisioned successfully.`,
        data: created,
      });
    } catch (error: any) {
      return handleProvisioningRouteError(res, error, 'Failed to provision school.');
    }
  }
);

/**
 * POST /api/v1/provisioning/administrators
 * Provisions an authorized administrator or school staff user with full RBAC & staff linkage.
 */
provisioningRouter.post(
  '/administrators',
  authenticateUser,
  requireRole('super_admin', 'principal'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        email,
        password,
        fullName,
        full_name,
        firstName,
        first_name,
        middleName,
        middle_name,
        surname,
        phone,
        role,
        organizationId,
        organization_id,
        schoolId,
        school_id,
        staffIdNumber,
        staff_id_number,
        designation,
        qualifications,
        trcnNumber,
        trcn_number,
      } = req.body || {};

      const result = await provisionAdministrator(
        {
          email,
          password,
          fullName: fullName || full_name,
          firstName: firstName || first_name || null,
          middleName: middleName || middle_name || null,
          surname: surname || null,
          phone: phone || null,
          role,
          organizationId: organizationId || organization_id || null,
          schoolId: schoolId !== undefined ? schoolId : school_id,
          staffIdNumber: staffIdNumber || staff_id_number || null,
          designation: designation || null,
          qualifications: qualifications || null,
          trcnNumber: trcnNumber || trcn_number || null,
        },
        {
          user: req.user,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        }
      );

      return res.status(201).json({
        success: true,
        message: `Administrator account '${result.user.email}' (${result.user.role}) provisioned successfully.`,
        data: result,
      });
    } catch (error: any) {
      return handleProvisioningRouteError(res, error, 'Failed to provision administrator account.');
    }
  }
);
