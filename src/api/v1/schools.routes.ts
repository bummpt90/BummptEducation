/**
 * BummptEducation — Schools API Routes (/api/v1/schools)
 * 
 * Server-authoritative endpoints for School Registry management,
 * institutional details, metrics, and multi-tenant school visibility.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireRole } from '../../auth/middleware';
import { SchoolRepository } from '../../db/repositories/school.repository';
import { provisionSchool, ProvisioningError } from '../../auth/provisioning.service';
import { onboardingRouter } from './onboarding.routes';
import type { AuthenticatedRequest } from '../../auth/types';

export const schoolsRouter = Router();
const schoolRepo = new SchoolRepository();

// Mount Phase 10D school onboarding sub-router
schoolsRouter.use('/:schoolId/onboarding', onboardingRouter);
schoolsRouter.use('/:id/onboarding', onboardingRouter);

/**
 * GET /api/v1/schools/public
 * Public endpoint returning active institutional schools for sign-up dropdowns.
 * Only returns public metadata (id, name, code, lga, category).
 */
schoolsRouter.get('/public', async (req, res) => {
  try {
    const schools = await schoolRepo.findAllActive();
    const publicList = schools.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      lga: s.lga,
      category: s.category,
      senatorial_zone: s.senatorial_zone,
    }));
    return res.json({
      success: true,
      count: publicList.length,
      data: publicList,
    });
  } catch (error: any) {
    console.error('[SchoolsAPI] Failed to fetch public schools:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch school directory.',
    });
  }
});

/**
 * GET /api/v1/schools
 * Lists accessible schools based on caller authority:
 * - Super Administrators & State Officers: All active schools in Benue State
 * - School Principals & Institutional Users: Only their assigned school
 */
schoolsRouter.get(
  '/',
  authenticateUser,
  requirePermission('schools.view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const schools = await schoolRepo.findPermittedSchools(req.tenantContext);
      res.json({
        success: true,
        count: schools.length,
        data: schools,
      });
    } catch (error: any) {
      console.error('[SchoolsAPI] Failed to fetch schools:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_SCHOOLS_FAILED',
        message: 'Failed to retrieve school registry records.',
      });
    }
  }
);

/**
 * GET /api/v1/schools/:id
 * Retrieves school profile and institutional metrics.
 * Enforces school-level tenant boundary.
 */
schoolsRouter.get(
  '/:id',
  authenticateUser,
  requirePermission('schools.view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      // School isolation check: school-scoped users cannot view other schools
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (req.user?.schoolId !== id) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: You do not have permission to view institutional details of another school.',
          });
          return;
        }
      }

      const school = await schoolRepo.findByIdWithMetrics(id);
      if (!school) {
        res.status(404).json({
          success: false,
          error: 'SCHOOL_NOT_FOUND',
          message: `School with ID ${id} not found.`,
        });
        return;
      }

      res.json({
        success: true,
        data: school,
      });
    } catch (error: any) {
      console.error('[SchoolsAPI] Failed to fetch school details:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_SCHOOL_FAILED',
        message: 'Failed to retrieve school details.',
      });
    }
  }
);

/**
 * POST /api/v1/schools
 * Controlled provisioning endpoint for creating an authoritative school under an organization.
 * Restricted strictly to Super Administrators.
 */
schoolsRouter.post(
  '/',
  authenticateUser,
  requireRole('super_admin'),
  async (req: AuthenticatedRequest, res) => {
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

      res.status(201).json({
        success: true,
        message: `School '${created.name}' (${created.code}) provisioned successfully.`,
        data: created,
      });
    } catch (error: any) {
      if (error instanceof ProvisioningError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.code,
          message: error.message,
        });
        return;
      }
      console.error('[SchoolsAPI] Failed to provision school:', error);
      res.status(500).json({
        success: false,
        error: 'PROVISION_SCHOOL_FAILED',
        message: 'Failed to provision school record.',
      });
    }
  }
);
