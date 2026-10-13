/**
 * BummptEducation — School Onboarding & Institutional Readiness API (/api/v1/onboarding & /api/v1/schools/:schoolId/onboarding)
 * 
 * Server-authoritative endpoints for managing the 7-step onboarding checklist,
 * updating institutional profile metadata, and formally verifying onboarding
 * readiness before operational launch.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import {
  getSchoolOnboardingStatus,
  updateSchoolProfile,
  verifySchoolOnboarding,
  OnboardingError,
} from '../../auth/onboarding.service';
import type { AuthenticatedRequest } from '../../auth/types';

export const onboardingRouter = Router({ mergeParams: true });

function resolveSchoolId(req: AuthenticatedRequest): string {
  const paramId = (req.params.schoolId || req.params.id || req.query.schoolId || req.query.school_id) as string;
  return paramId?.trim() || '';
}

/**
 * GET /:schoolId/onboarding or /:schoolId
 * Retrieves full server-authoritative onboarding checklist and readiness report.
 * Requires schools.view permission and tenant scope.
 */
onboardingRouter.get(
  '/',
  authenticateUser,
  requirePermission('schools.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const schoolId = resolveSchoolId(req);
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'School ID parameter is required.',
        });
      }

      const report = await getSchoolOnboardingStatus(schoolId, {
        user: req.user,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      return res.json({
        success: true,
        data: report,
      });
    } catch (err: any) {
      if (err instanceof OnboardingError) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.code,
          message: err.message,
          details: err.details,
        });
      }
      console.error('[OnboardingAPI] Failed to get onboarding status:', err);
      return res.status(500).json({
        success: false,
        error: 'ONBOARDING_STATUS_FAILED',
        message: 'Failed to retrieve school onboarding status.',
      });
    }
  }
);

/**
 * PATCH /:schoolId/onboarding/profile
 * Updates supported institutional profile fields for the school.
 * Requires schools.manage permission and tenant scope.
 */
onboardingRouter.patch(
  '/profile',
  authenticateUser,
  requirePermission('schools.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const schoolId = resolveSchoolId(req);
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'School ID parameter is required.',
        });
      }

      const report = await updateSchoolProfile(
        schoolId,
        req.body || {},
        {
          user: req.user,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        }
      );

      return res.json({
        success: true,
        message: 'School institutional profile updated successfully.',
        data: report,
      });
    } catch (err: any) {
      if (err instanceof OnboardingError) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.code,
          message: err.message,
          details: err.details,
        });
      }
      console.error('[OnboardingAPI] Failed to update school profile:', err);
      return res.status(500).json({
        success: false,
        error: 'UPDATE_PROFILE_FAILED',
        message: 'Failed to update school profile.',
      });
    }
  }
);

/**
 * PUT /:schoolId/onboarding/profile
 * Supports PUT as well for profile updates.
 * Requires schools.manage permission and tenant scope.
 */
onboardingRouter.put(
  '/profile',
  authenticateUser,
  requirePermission('schools.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const schoolId = resolveSchoolId(req);
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'School ID parameter is required.',
        });
      }

      const report = await updateSchoolProfile(
        schoolId,
        req.body || {},
        {
          user: req.user,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        }
      );

      return res.json({
        success: true,
        message: 'School institutional profile updated successfully.',
        data: report,
      });
    } catch (err: any) {
      if (err instanceof OnboardingError) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.code,
          message: err.message,
          details: err.details,
        });
      }
      console.error('[OnboardingAPI] Failed to update school profile:', err);
      return res.status(500).json({
        success: false,
        error: 'UPDATE_PROFILE_FAILED',
        message: 'Failed to update school profile.',
      });
    }
  }
);

/**
 * POST /:schoolId/onboarding/academic-structure
 * Deprecated endpoint: automatic academic structure initialization is removed.
 * Returns HTTP 410 (Gone) and performs no writes.
 */
onboardingRouter.post(
  '/academic-structure',
  authenticateUser,
  (_req: AuthenticatedRequest, res) => {
    return res.status(410).json({
      success: false,
      error: 'ENDPOINT_DEPRECATED',
      message: 'Academic structure initialization via onboarding is deprecated and removed. Classes and allocations must be configured explicitly through standard /api/v1/classes and /api/v1/academic/allocations routes.',
    });
  }
);

/**
 * POST /:schoolId/onboarding/verify
 * Formally reviews and verifies onboarding completeness. Fails closed if incomplete.
 * Requires schools.manage permission and tenant scope.
 */
onboardingRouter.post(
  '/verify',
  authenticateUser,
  requirePermission('schools.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const schoolId = resolveSchoolId(req);
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'School ID parameter is required.',
        });
      }

      const report = await verifySchoolOnboarding(schoolId, {
        user: req.user,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      return res.json({
        success: true,
        message: `School '${report.schoolName}' onboarding successfully verified. Status: ${report.overallStatus}. Operational launch remains ${report.operationalLaunchStatus}.`,
        data: report,
      });
    } catch (err: any) {
      if (err instanceof OnboardingError) {
        return res.status(err.statusCode).json({
          success: false,
          error: err.code,
          message: err.message,
          details: err.details,
        });
      }
      console.error('[OnboardingAPI] Failed to verify onboarding:', err);
      return res.status(500).json({
        success: false,
        error: 'VERIFY_ONBOARDING_FAILED',
        message: 'Failed to verify school onboarding.',
      });
    }
  }
);
