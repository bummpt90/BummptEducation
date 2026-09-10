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

/**
 * GET /api/v1/hq/telemetry/overview
 * Live aggregate indicators across all 23 Benue State LGAs
 */
hqTelemetryRouter.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
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
 * List of all 23 LGAs metadata with schools, students, teachers, pass rates & subventions
 */
hqTelemetryRouter.get('/lgas', async (req: AuthenticatedRequest, res: Response) => {
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
 * Specific LGA telemetry indicators and registered schools
 */
hqTelemetryRouter.get('/lgas/:lga', async (req: AuthenticatedRequest, res: Response) => {
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
 */
hqTelemetryRouter.get('/schools/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
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
 */
hqTelemetryRouter.get('/schools/:id/kpis', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
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
 * POST /api/v1/hq/telemetry/schools/:id/subvention
 * Approves and disburses special state grants/subventions to a school
 * Authorized: State Officers & Super Admins only
 */
hqTelemetryRouter.post('/schools/:id/subvention', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'super_admin' && user.role !== 'state_officer') {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ROLE',
        message: 'Only authorized Ministry of Education Officers can disburse state subventions.',
      });
      return;
    }

    const { id } = req.params;
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
      id,
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
  } catch (error: any) {
    console.error('[HqTelemetryRoutes] Error disbursing subvention:', error);
    res.status(error.message === 'School not found.' ? 404 : 500).json({
      success: false,
      error: error.message === 'School not found.' ? 'NOT_FOUND' : 'INTERNAL_ERROR',
      message: error.message || 'Failed to disburse state subvention.',
    });
  }
});
