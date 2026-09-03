/**
 * BummptEducation — Classes API Routes (/api/v1/classes)
 * 
 * Server-authoritative endpoints for institutional classes,
 * educational levels, arms, capacity, and form master linkages.
 */

import { Router } from 'express';
import { authenticateUser } from '../../auth/middleware';
import { ClassRepository } from '../../db/repositories/class.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const classesRouter = Router();
const classRepo = new ClassRepository();

/**
 * GET /api/v1/classes
 * Lists classes for a school tenant.
 * School-scoped users can only list classes for their own school.
 */
classesRouter.get(
  '/',
  authenticateUser,
  async (req: AuthenticatedRequest, res) => {
    try {
      const requestedSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);
      let targetSchoolId = requestedSchoolId;

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (requestedSchoolId && requestedSchoolId !== req.user?.schoolId) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: Cannot query classes of another school.',
          });
          return;
        }
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'school_id query parameter is required for global authorities.',
        });
        return;
      }

      const arm = req.query.arm as ('kindergarten' | 'primary' | 'secondary') | undefined;
      const classes = await classRepo.findBySchool(targetSchoolId, arm);

      res.json({
        success: true,
        count: classes.length,
        data: classes,
      });
    } catch (error: any) {
      console.error('[ClassesAPI] Failed to fetch classes:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_CLASSES_FAILED',
        message: 'Failed to retrieve classes.',
      });
    }
  }
);
