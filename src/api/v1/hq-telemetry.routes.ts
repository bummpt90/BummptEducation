/**
 * BummptEducation — Benue State HQ Telemetry API Routes (v1)
 * 
 * Endpoints for statewide educational indicators across all 23 LGAs.
 * Direct PostgreSQL persistence, zero localStorage or synthetic simulation.
 */

import { Router, Response } from 'express';
import { authenticateUser } from '../../auth/middleware';
import { AuthenticatedRequest } from '../../auth/types';
import { hqTelemetryRepository } from '../../db/repositories/hqTelemetry.repository';

export const hqTelemetryRouter = Router();

// Apply authentication universally across all telemetry endpoints
hqTelemetryRouter.use(authenticateUser);

const HQ_OFFICER_ROLES = ['super_admin', 'state_officer'];
const HEAD_OF_SCHOOL_ROLES = ['principal', 'headmistress', 'head_kindergarten'];
const MINISTRY_PORTAL_ROLES = [...HQ_OFFICER_ROLES, ...HEAD_OF_SCHOOL_ROLES];

function isHqOfficer(role: string): boolean {
  return HQ_OFFICER_ROLES.includes(role);
}

function isHeadOfSchool(role: string): boolean {
  return HEAD_OF_SCHOOL_ROLES.includes(role);
}

/**
 * Middleware: Enforces Ministry Portal Telemetry role boundary
 * Only authorized HQ Officers and authenticated Heads of School may enter.
 * Explicitly denies: teachers, bursars, admissions officers, parents, students (403)
 */
export function requireMinistryPortalAccess(req: AuthenticatedRequest, res: Response, next: () => void) {
  const user = req.user;
  if (!user || !MINISTRY_PORTAL_ROLES.includes(user.role)) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ROLE',
      message: 'Access denied. Ministry Portal Telemetry is strictly restricted to Ministry HQ Officers and authenticated Heads of School.',
    });
    return;
  }
  next();
}

hqTelemetryRouter.use(requireMinistryPortalAccess);

/**
 * Middleware: Enforces HQ-only statewide telemetry access
 * Heads of School are restricted to their own school and may NOT access statewide telemetry
 */
export function requireHqOfficer(req: AuthenticatedRequest, res: Response, next: () => void) {
  const user = req.user;
  if (!user || !isHqOfficer(user.role)) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ROLE',
      message: 'Heads of School and unauthorized personnel are not permitted to access statewide administration telemetry or disburse subventions.',
    });
    return;
  }
  next();
}

/**
 * GET /api/v1/hq/telemetry/overview
 * Live aggregate indicators across all 23 Benue State LGAs (HQ Officers only)
 */
hqTelemetryRouter.get('/overview', requireHqOfficer, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = await hqTelemetryRepository.getOverview();
    res.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    console.error('[HqTelemetryRoutes] Error fetching overview:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve statewide telemetry indicators.',
    });
  }
});

/**
 * GET /api/v1/hq/telemetry/lgas
 * List of all 23 LGAs metadata with schools, students, teachers, pass rates & subventions (HQ Officers only)
 */
hqTelemetryRouter.get('/lgas', requireHqOfficer, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lgas = await hqTelemetryRepository.getAllLgas();
    res.json({
      success: true,
      data: lgas,
    });
  } catch (error: any) {
    console.error('[HqTelemetryRoutes] Error fetching LGAs:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve LGA metadata directory.',
    });
  }
});

/**
 * GET /api/v1/hq/telemetry/lgas/:lga
 * Specific LGA telemetry indicators and registered schools (HQ Officers only)
 */
hqTelemetryRouter.get('/lgas/:lga', requireHqOfficer, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lga } = req.params;
    const details = await hqTelemetryRepository.getLgaDetails(lga);

    if (!details.lga) {
      res.status(404).json({
        success: false,
        error: 'LGA_NOT_FOUND',
        message: `Local Government Area '${lga}' not found in Benue State registry.`,
      });
      return;
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error: any) {
    console.error('[HqTelemetryRoutes] Error fetching LGA details:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve detailed indicators for the requested LGA.',
    });
  }
});

/**
 * GET /api/v1/hq/telemetry/schools/:id
 * Retrieves school details along with performance KPIs
 * HQ Officers: may inspect authorized schools statewide
 * Heads of School: strictly restricted to their own assigned school
 * Other roles (teacher, bursar, parent, student, etc.): forbidden (403)
 */
hqTelemetryRouter.get('/schools/:id', requireMinistryPortalAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Authorization Check: Non-HQ and non-Head roles receive 403 Forbidden
    if (!isHqOfficer(user.role)) {
      if (!isHeadOfSchool(user.role)) {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN_ROLE',
          message: 'Access denied. School telemetry is restricted to Ministry HQ Officers and authenticated Heads of School.',
        });
        return;
      }

      // Cross-School IDOR Guard: Head of School can only inspect their own school (404 for other schools)
      if (user.schoolId !== id) {
        res.status(404).json({
          success: false,
          error: 'SCHOOL_NOT_FOUND',
          message: `School with ID '${id}' not found in registry.`,
        });
        return;
      }
    }

    const details = await hqTelemetryRepository.getSchoolDetailsWithKpis(id);

    if (!details) {
      res.status(404).json({
        success: false,
        error: 'SCHOOL_NOT_FOUND',
        message: `School with ID '${id}' not found in registry.`,
      });
      return;
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error: any) {
    console.error('[HqTelemetryRoutes] Error fetching school details:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve school details.',
    });
  }
});

/**
 * GET /api/v1/hq/telemetry/schools/:id/kpis
 * Performance KPIs (Teachers, Students, Inspections, Governing Reviews) for a school
 * HQ Officers: may inspect authorized schools statewide
 * Heads of School: strictly restricted to their own assigned school
 * Other roles (teacher, bursar, parent, student, etc.): forbidden (403)
 */
hqTelemetryRouter.get('/schools/:id/kpis', requireMinistryPortalAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Authorization Check: Non-HQ and non-Head roles receive 403 Forbidden
    if (!isHqOfficer(user.role)) {
      if (!isHeadOfSchool(user.role)) {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN_ROLE',
          message: 'Access denied. School telemetry KPIs are restricted to Ministry HQ Officers and authenticated Heads of School.',
        });
        return;
      }

      // Cross-School IDOR Guard: Head of School can only inspect their own school KPIs (404 for other schools)
      if (user.schoolId !== id) {
        res.status(404).json({
          success: false,
          error: 'SCHOOL_NOT_FOUND',
          message: `School with ID '${id}' not found in registry.`,
        });
        return;
      }
    }

    const kpis = await hqTelemetryRepository.getSchoolKpis(id);
    res.json({
      success: true,
      data: kpis,
    });
  } catch (error: any) {
    console.error('[HqTelemetryRoutes] Error fetching school KPIs:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve school performance KPIs.',
    });
  }
});

/**
 * Helper to process subvention disbursements
 */
async function handleSubventionDisbursement(req: AuthenticatedRequest, res: Response, targetSchoolId: string) {
  const user = req.user!;
  if (!isHqOfficer(user.role)) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ROLE',
      message: 'Only authorized Ministry of Education Officers can disburse state subventions.',
    });
    return;
  }

  const { grantAmount, grantType, purpose } = req.body;

  if (!grantAmount || typeof grantAmount !== 'number' || grantAmount <= 0) {
    res.status(400).json({
      success: false,
      error: 'INVALID_GRANT_AMOUNT',
      message: 'A valid positive grant amount is required.',
    });
    return;
  }

  const result = await hqTelemetryRepository.disburseSubvention(
    targetSchoolId,
    grantAmount,
    grantType || 'Special Subvention Grant',
    purpose || 'State education intervention',
    user,
    req.ip
  );

  res.json({
    success: true,
    message: `₦${grantAmount.toLocaleString()} subvention grant approved and recorded.`,
    data: result,
  });
}

/**
 * POST /api/v1/hq/telemetry/schools/:id/subvention
 * Approves and disburses special state grants/subventions to a school
 * Authorized: State Officers & Super Admins only (Heads and other roles denied 403)
 */
hqTelemetryRouter.post('/schools/:id/subvention', requireHqOfficer, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await handleSubventionDisbursement(req, res, id);
  } catch (error: any) {
    console.error('[HqTelemetryRoutes] Error disbursing subvention:', error);
    res.status(error.message === 'School not found.' ? 404 : 500).json({
      success: false,
      error: error.message === 'School not found.' ? 'NOT_FOUND' : 'INTERNAL_ERROR',
      message: error.message || 'Failed to disburse state subvention.',
    });
  }
});

/**
 * POST /api/v1/hq/telemetry/subvention
 * Generic subvention endpoint where target school ID is in the payload
 * Authorized: State Officers & Super Admins only (Heads and other roles denied 403)
 */
hqTelemetryRouter.post('/subvention', requireHqOfficer, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.body.schoolId || req.body.targetSchoolId;
    if (!schoolId) {
      res.status(400).json({
        success: false,
        error: 'MISSING_SCHOOL_ID',
        message: 'A target schoolId is required to disburse state subventions.',
      });
      return;
    }
    await handleSubventionDisbursement(req, res, schoolId);
  } catch (error: any) {
    console.error('[HqTelemetryRoutes] Error disbursing subvention:', error);
    res.status(error.message === 'School not found.' ? 404 : 500).json({
      success: false,
      error: error.message === 'School not found.' ? 'NOT_FOUND' : 'INTERNAL_ERROR',
      message: error.message || 'Failed to disburse state subvention.',
    });
  }
});

/**
 * GET /api/v1/hq/telemetry/audit-logs
 * Retrieves security-sensitive audit logs scoped by role and school boundary
 * Authorized: HQ Officers (statewide) & Heads of School (own school only)
 */
hqTelemetryRouter.get('/audit-logs', requireMinistryPortalAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const logs = await hqTelemetryRepository.getAuditLogs(user, limit);
    res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error('[HqTelemetryRoutes] Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve telemetry audit logs.',
    });
  }
});
