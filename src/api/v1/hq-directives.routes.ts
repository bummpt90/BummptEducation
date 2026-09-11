/**
 * BummptEducation — Ministry Directives API Routes (v1)
 * 
 * Endpoints for statewide and targeted circulars, policy directives, and
 * Head of School acknowledgements.
 * 
 * Strict Privacy:
 * Directives targeted to a specific school are NEVER visible to other schools.
 */

import { Router, Response } from 'express';
import { authenticateUser } from '../../auth/middleware';
import { AuthenticatedRequest } from '../../auth/types';
import { ministryDirectiveRepository } from '../../db/repositories/ministryDirective.repository';

export const hqDirectivesRouter = Router();

hqDirectivesRouter.use(authenticateUser);

const HQ_OFFICER_ROLES = ['super_admin', 'state_officer'];
const HEAD_OF_SCHOOL_ROLES = ['principal', 'headmistress', 'head_kindergarten'];
const MINISTRY_PORTAL_ROLES = [...HQ_OFFICER_ROLES, ...HEAD_OF_SCHOOL_ROLES];

/**
 * Middleware: Enforces Ministry Portal Directives access
 * Only authorized HQ Officers and authenticated Heads of School may access Ministry Directives.
 * Explicitly denies: teachers, bursars, admissions officers, parents, students (403)
 */
hqDirectivesRouter.use((req: AuthenticatedRequest, res: Response, next) => {
  const user = req.user;
  if (!user || !MINISTRY_PORTAL_ROLES.includes(user.role)) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ROLE',
      message: 'Access denied. Ministry Directives are strictly restricted to Ministry HQ Officers and authenticated Heads of School.',
    });
    return;
  }
  next();
});

/**
 * GET /api/v1/hq/directives
 * Lists directives visible to the authenticated user under strict tenant & role scoping
 */
hqDirectivesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { category, priority, search } = req.query;

    const directives = await ministryDirectiveRepository.getDirectivesForUser(user, {
      category: category as string,
      priority: priority as string,
      search: search as string,
    });

    res.json({
      success: true,
      data: directives,
    });
  } catch (error: any) {
    console.error('[HqDirectivesRoutes] Error fetching directives:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve ministry directives.',
    });
  }
});

/**
 * GET /api/v1/hq/directives/:id
 * Retrieves a single directive by ID, strictly enforcing privacy boundaries
 */
hqDirectivesRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const directive = await ministryDirectiveRepository.getDirectiveById(id, user);

    if (!directive) {
      res.status(404).json({
        success: false,
        error: 'DIRECTIVE_NOT_FOUND',
        message: 'Ministry directive not found or access denied under tenant scoping rules.',
      });
      return;
    }

    res.json({
      success: true,
      data: directive,
    });
  } catch (error: any) {
    console.error('[HqDirectivesRoutes] Error fetching directive by ID:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve directive.',
    });
  }
});

/**
 * POST /api/v1/hq/directives
 * Issues and broadcasts a new Ministry Directive
 * Authorized: State HQ Officers & Super Admins only
 */
hqDirectivesRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (!ministryDirectiveRepository.isHqOfficer(user.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ROLE',
        message: 'Only authorized Ministry Officers and Super Administrators can issue official directives.',
      });
      return;
    }

    const { title, content, category, priority } = req.body;
    if (!title || !content || !category || !priority) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Title, content, category, and priority are required fields.',
      });
      return;
    }

    const directive = await ministryDirectiveRepository.createDirective(req.body, user, req.ip);

    res.status(201).json({
      success: true,
      message: `Ministry Directive '${directive.title}' successfully broadcasted.`,
      data: directive,
    });
  } catch (error: any) {
    console.error('[HqDirectivesRoutes] Error creating directive:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to issue ministry directive.',
    });
  }
});

/**
 * POST /api/v1/hq/directives/:id/acknowledge
 * Head of School officially acknowledges receipt and compliance of a directive
 * Authorized: Heads of School & State Officers
 */
hqDirectivesRouter.post('/:id/acknowledge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const isHead = ministryDirectiveRepository.isHeadOfSchool(user.role);
    const isHq = ministryDirectiveRepository.isHqOfficer(user.role);

    if (!isHead && !isHq) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ROLE',
        message: 'Only the authenticated Head of School can formally acknowledge Ministry Directives.',
      });
      return;
    }

    if (!user.schoolId && isHead) {
      res.status(400).json({
        success: false,
        error: 'NO_SCHOOL_ASSIGNMENT',
        message: 'User is not assigned to a valid school tenant.',
      });
      return;
    }

    const { id } = req.params;
    const { notes } = req.body;

    const result = await ministryDirectiveRepository.acknowledgeDirective(id, user, notes, req.ip);

    res.json({
      success: true,
      message: 'Directive compliance officially acknowledged.',
      data: result,
    });
  } catch (error: any) {
    console.error('[HqDirectivesRoutes] Error acknowledging directive:', error);
    const msg = error.message || '';
    if (msg.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Directive not found.',
      });
      return;
    }
    if (msg.includes('targeted to another school') || msg.includes('cannot be acknowledged')) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN_SCHOOL',
        message: 'This directive is targeted to another school and cannot be acknowledged.',
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to record directive acknowledgement.',
    });
  }
});

/**
 * GET /api/v1/hq/directives/:id/acknowledgements
 * Lists school compliance acknowledgements for a given directive
 */
hqDirectivesRouter.get('/:id/acknowledgements', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Verify user is authorized to see this directive first
    const directive = await ministryDirectiveRepository.getDirectiveById(id, user);
    if (!directive) {
      res.status(404).json({
        success: false,
        error: 'DIRECTIVE_NOT_FOUND',
        message: 'Ministry directive not found or access denied under tenant scoping rules.',
      });
      return;
    }

    const acks = await ministryDirectiveRepository.getDirectiveAcknowledgements(id, user);

    res.json({
      success: true,
      data: acks,
    });
  } catch (error: any) {
    console.error('[HqDirectivesRoutes] Error fetching acknowledgements:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve directive acknowledgements.',
    });
  }
});
