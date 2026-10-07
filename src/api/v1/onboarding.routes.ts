/**
 * BummptEducation — School Onboarding & Institutional Readiness API (/api/v1/onboarding & /api/v1/schools/:schoolId/onboarding)
 * 
 * Server-authoritative endpoints for managing the 7-step onboarding checklist,
 * updating institutional profile metadata, initializing academic structure,
 * and formally verifying onboarding readiness before operational launch.
 */

import { Router } from 'express';
import { authenticateUser } from '../../auth/middleware';
import {
  getSchoolOnboardingStatus,
  updateSchoolProfile,
  initializeSchoolAcademicStructure,
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
 */
onboardingRouter.get(
  '/',
  authenticateUser,
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
 * PATCH /:schoolId/onboarding/profile or PUT /:schoolId/onboarding/profile
 * Updates supported institutional profile fields for the school.
 */
onboardingRouter.patch(
  '/profile',
  authenticateUser,
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

// Support PUT as well for profile updates
onboardingRouter.put('/profile', authenticateUser, async (req: AuthenticatedRequest, res) => {
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
});

/**
 * POST /:schoolId/onboarding/academic-structure
 * Initializes canonical class and subject curriculum structures for the school.
 */
onboardingRouter.post(
  '/academic-structure',
  authenticateUser,
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

      const result = await initializeSchoolAcademicStructure(
        schoolId,
        req.body || {},
        {
          user: req.user,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        }
      );

      const refreshedReport = await getSchoolOnboardingStatus(schoolId, {
        user: req.user,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      });

      return res.json({
        success: true,
        message: `Initialized ${result.classesCreated} classes and ${result.allocationsCreated} academic allocations.`,
        data: refreshedReport,
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
      console.error('[OnboardingAPI] Failed to initialize academic structure:', err);
      return res.status(500).json({
        success: false,
        error: 'INIT_STRUCTURE_FAILED',
        message: 'Failed to initialize academic structure.',
      });
    }
  }
);

/**
 * POST /:schoolId/onboarding/verify
 * Formally reviews and verifies onboarding completeness. Fails closed if incomplete.
 */
onboardingRouter.post(
  '/verify',
  authenticateUser,
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
