/**
 * BummptEducation — Headquarters Live Chat & Inter-School Messaging Routes (v1)
 * 
 * Secure communication bridge between Benue State Ministry of Education and
 * authenticated Heads of School across all 23 LGAs.
 * 
 * Strict Privacy & RBAC:
 * Accessible ONLY to:
 * 1. Authorized State/HQ administrative officers (super_admin, state_officer)
 * 2. Authenticated Heads of School (principal, headmistress, head_kindergarten)
 * 
 * Non-head staff (teachers, bursars, admissions officers), students, and parents
 * are strictly forbidden (403).
 * A message intended for a PARTICULAR SCHOOL is NEVER visible to another school.
 */

import { Router, Response } from 'express';
import { authenticateUser } from '../../auth/middleware';
import { AuthenticatedRequest } from '../../auth/types';
import { hqDispatchRepository } from '../../db/repositories/hqDispatch.repository';

export const hqChatRouter = Router();

hqChatRouter.use(authenticateUser);

/**
 * Middleware: Enforces Ministry Portal communication access
 * Only HQ Officers and authenticated Heads of School may enter
 */
function requireMinistryPortalAccess(req: AuthenticatedRequest, res: Response, next: Function) {
  const user = req.user!;
  const isHq = hqDispatchRepository.isHqOfficer(user.role);
  const isHead = hqDispatchRepository.isHeadOfSchool(user.role);

  if (!isHq && !isHead) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ROLE',
      message: 'Access to the Benue State Ministry Portal communication channel is strictly restricted to State HQ Administrative Officers and authenticated Heads of School.',
    });
    return;
  }

  next();
}

hqChatRouter.use(requireMinistryPortalAccess);

/**
 * GET /api/v1/hq/chat/messages
 * Retrieves live dispatch feed filtered by tenant privacy boundaries
 */
hqChatRouter.get('/messages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { channelId, lga, zone, status, priority, search } = req.query;

    const messages = await hqDispatchRepository.getMessages(user, {
      channelId: channelId as string,
      lga: lga as string,
      zone: zone as string,
      status: status as string,
      priority: priority as string,
      search: search as string,
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    console.error('[HqChatRoutes] Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to retrieve HQ dispatches.',
    });
  }
});

/**
 * GET /api/v1/hq/chat/messages/:id
 * Retrieves a single dispatch, strictly blocking cross-school snooping
 */
hqChatRouter.get('/messages/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const message = await hqDispatchRepository.getMessageById(id, user);

    if (!message) {
      res.status(404).json({
        success: false,
        error: 'MESSAGE_NOT_FOUND',
        message: 'Dispatch not found or restricted under school privacy boundaries.',
      });
      return;
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error('[HqChatRoutes] Error fetching dispatch by ID:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve dispatch.',
    });
  }
});

/**
 * POST /api/v1/hq/chat/messages
 * Sends a new official dispatch or statutory inquiry
 * Sender identity is derived securely from server authentication
 */
hqChatRouter.post('/messages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { content, channelId, messageType, priority } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Message content is required.',
      });
      return;
    }

    const payload = {
      channelId: channelId || 'direct-hq-helpdesk',
      messageType: messageType || 'update',
      priority: priority || 'normal',
      content: content.trim(),
      attachmentName: req.body.attachmentName,
      attachmentUrl: req.body.attachmentUrl,
      isEscalatedToCommissioner: req.body.isEscalatedToCommissioner,
      targetSchoolId: req.body.targetSchoolId,
      targetSchoolName: req.body.targetSchoolName,
      audienceType: req.body.audienceType,
      lga: req.body.lga,
      zone: req.body.zone,
    };

    const dispatch = await hqDispatchRepository.createMessage(payload, user, req.ip);

    res.status(201).json({
      success: true,
      message: 'Dispatch successfully submitted to Ministry Command.',
      data: dispatch,
    });
  } catch (error: any) {
    console.error('[HqChatRoutes] Error creating dispatch:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to dispatch message.',
    });
  }
});

/**
 * POST /api/v1/hq/chat/messages/:id/reply
 * Appends an official reply from HQ Desk or the assigned School Head
 */
hqChatRouter.post('/messages/:id/reply', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { replyContent } = req.body;

    if (!replyContent || !replyContent.trim()) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Reply content is required.',
      });
      return;
    }

    const reply = await hqDispatchRepository.createReply(id, replyContent, user, req.ip);

    res.status(201).json({
      success: true,
      message: 'Official reply appended.',
      data: reply,
    });
  } catch (error: any) {
    console.error('[HqChatRoutes] Error appending reply:', error);
    const isForbidden = error.message.includes('FORBIDDEN');
    const isNotFound = error.message.includes('not found');
    res.status(isForbidden ? 403 : isNotFound ? 404 : 500).json({
      success: false,
      error: isForbidden ? 'FORBIDDEN_ACTION' : isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR',
      message: error.message || 'Failed to post reply.',
    });
  }
});

/**
 * PATCH /api/v1/hq/chat/messages/:id/status
 * Updates dispatch workflow status or Commissioner escalation (HQ Admins only)
 */
hqChatRouter.patch('/messages/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const isHq = hqDispatchRepository.isHqOfficer(user.role);
    const isHead = hqDispatchRepository.isHeadOfSchool(user.role);

    if (!isHq && !isHead) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ROLE',
        message: 'Only State HQ Officers and authenticated Heads of School may alter dispatch workflow status or escalate.',
      });
      return;
    }

    const { id } = req.params;
    const { status, isEscalatedToCommissioner } = req.body;

    const updated = await hqDispatchRepository.updateStatus(
      id,
      status,
      isEscalatedToCommissioner,
      user,
      req.ip
    );

    res.json({
      success: true,
      message: 'Dispatch status updated.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[HqChatRoutes] Error updating dispatch status:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to update dispatch status.',
    });
  }
});
