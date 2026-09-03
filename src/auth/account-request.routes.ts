/**
 * BummptEducation — Account Requests & Controlled Sign-Up Router
 * 
 * Endpoints:
 * - POST /api/v1/auth/account-requests              (Public registration request)
 * - GET  /api/v1/auth/account-requests              (Admin list pending/all requests)
 * - POST /api/v1/auth/account-requests/:id/approve  (Admin approve & provision user)
 * - POST /api/v1/auth/account-requests/:id/reject   (Admin reject request)
 */

import { Router, Request, Response } from 'express';
import { accountRequestRepository } from '../db/repositories/account-request.repository';
import { userRepository } from '../db/repositories/user.repository';
import { hashPassword, validatePasswordPolicy } from './password';
import { authenticateUser } from './middleware';
import { requirePermission } from './middleware';
import { logAuthEvent } from './audit';
import { withTransaction, query } from '../db';
import { isValidRole } from './roles';
import type { AuthenticatedRequest, AuthRole } from './types';

export const accountRequestsRouter = Router();

/**
 * Roles that are strictly FORBIDDEN from public self-registration requests.
 * These roles must be provisioned exclusively by Central State / Super Admin authorities.
 */
const PRIVILEGED_RESERVED_ROLES: string[] = [
  'super_admin',
  'state_officer',
];

/**
 * Roles that users can request via the public sign-up gateway
 */
const ALLOWED_REQUESTABLE_ROLES: AuthRole[] = [
  'principal',
  'vice_principal',
  'headmistress',
  'head_kindergarten',
  'exam_officer',
  'bursar',
  'admissions_officer',
  'teacher',
  'parent',
  'student',
];

/**
 * POST /api/v1/auth/account-requests
 * Public endpoint to submit a controlled sign-up / account request.
 * Note: Never automatically grants access or assigns roles directly.
 */
accountRequestsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      middleName,
      surname,
      email,
      phone,
      requestedRole,
      requestedSchoolId,
      password,
      confirmPassword,
      termsAccepted,
    } = req.body;

    // 1. Basic validation
    if (!firstName || !surname || !email || !password || !requestedRole) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'First name, surname, email, password, and requested role are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Please provide a valid email address.',
      });
    }

    // 2. Password validation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_MISMATCH',
        message: 'Password and confirmation password do not match.',
      });
    }

    const policyCheck = validatePasswordPolicy(password);
    if (!policyCheck.valid) {
      return res.status(400).json({
        success: false,
        error: 'PASSWORD_TOO_WEAK',
        message: policyCheck.reason || 'Password does not meet security requirements (minimum 8 characters).',
      });
    }

    // 3. Privileged role self-assignment guard (Zero-Trust Security Rule)
    const normalizedRole = requestedRole.toLowerCase().trim();
    if (PRIVILEGED_RESERVED_ROLES.includes(normalizedRole)) {
      logAuthEvent({
        action: 'PRIVILEGED_ROLE_REQUEST_BLOCKED',
        status: 'BLOCKED',
        email: cleanEmail,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { attemptedRole: normalizedRole },
      });

      return res.status(403).json({
        success: false,
        error: 'PRIVILEGED_ROLE_FORBIDDEN',
        message: 'Super Administrator and State Ministry Officer roles cannot be requested via public registration. These positions are provisioned exclusively by Central State Educational Authority.',
      });
    }

    if (!isValidRole(normalizedRole) || !ALLOWED_REQUESTABLE_ROLES.includes(normalizedRole as AuthRole)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_REQUESTED_ROLE',
        message: `The requested role '${requestedRole}' is not available for public registration requests.`,
      });
    }

    // 4. Duplicate identity check
    const existingUser = await userRepository.findByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'An active account with this email address already exists. Please sign in or use the password recovery option.',
      });
    }

    const pendingRequest = await accountRequestRepository.findPendingByEmail(cleanEmail);
    if (pendingRequest) {
      return res.status(409).json({
        success: false,
        error: 'REQUEST_ALREADY_PENDING',
        message: 'A registration request for this email address is already pending administrative review. You will be notified once reviewed.',
      });
    }

    // 5. Resolve Organization ID
    let organizationId: string | null = null;
    if (requestedSchoolId) {
      const schoolRes = await query<{ organization_id: string }>(
        'SELECT organization_id FROM schools WHERE id = $1 LIMIT 1;',
        [requestedSchoolId]
      );
      if (schoolRes.rows.length > 0) {
        organizationId = schoolRes.rows[0].organization_id;
      }
    }

    if (!organizationId) {
      const orgRes = await query<{ id: string }>('SELECT id FROM organizations LIMIT 1;');
      organizationId = orgRes.rows[0]?.id || null;
    }

    if (!organizationId) {
      return res.status(500).json({
        success: false,
        error: 'SYSTEM_CONFIG_ERROR',
        message: 'Default educational organization not configured on this instance.',
      });
    }

    // 6. Cryptographic Argon2id Password Hashing
    const passwordHash = await hashPassword(password);

    // 7. Store Account Request
    const createdRequest = await accountRequestRepository.createRequest({
      organizationId,
      requestedSchoolId: requestedSchoolId || null,
      firstName,
      middleName: middleName || null,
      surname,
      email: cleanEmail,
      phone: phone || null,
      requestedRole: normalizedRole,
      passwordHash,
    });

    // 8. Audit Logging
    logAuthEvent({
      action: 'SIGNUP_REQUESTED',
      status: 'SUCCESS',
      email: cleanEmail,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: {
        requestId: createdRequest.id,
        requestedRole: normalizedRole,
        requestedSchoolId: requestedSchoolId || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Account request submitted successfully. It has been queued for verification by an authorized administrator.',
      data: {
        id: createdRequest.id,
        email: createdRequest.email,
        fullName: `${createdRequest.first_name} ${createdRequest.surname}`,
        requestedRole: createdRequest.requested_role,
        status: createdRequest.status,
        createdAt: createdRequest.created_at,
      },
    });
  } catch (error: any) {
    console.error('[AccountRequestsRouter] Submit request error:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred while processing your account request.',
    });
  }
});

/**
 * GET /api/v1/auth/account-requests
 * Administrative endpoint: list pending or historic account requests.
 * Enforces tenant isolation: Principals see only their school's requests.
 */
accountRequestsRouter.get(
  '/',
  authenticateUser,
  requirePermission('account_requests.view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, schoolId, role, search } = req.query;

      const requests = await accountRequestRepository.listRequests(
        {
          status: typeof status === 'string' ? status : undefined,
          schoolId: typeof schoolId === 'string' ? schoolId : undefined,
          role: typeof role === 'string' ? role : undefined,
          search: typeof search === 'string' ? search : undefined,
        },
        req.tenantContext
      );

      // Sanitize: Never expose password_hash to the client
      const sanitized = requests.map((r) => {
        const { password_hash, ...safe } = r;
        return safe;
      });

      return res.json({
        success: true,
        data: sanitized,
        count: sanitized.length,
      });
    } catch (error: any) {
      console.error('[AccountRequestsRouter] List error:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to retrieve account requests.',
      });
    }
  }
);

/**
 * POST /api/v1/auth/account-requests/:id/approve
 * Administrative endpoint: approve a pending account request and provision the user account.
 */
accountRequestsRouter.post(
  '/:id/approve',
  authenticateUser,
  requirePermission('account_requests.manage'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { assignedRole, assignedSchoolId, adminNotes } = req.body;

      const request = await accountRequestRepository.findByIdWithDetails(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'REQUEST_NOT_FOUND',
          message: 'The specified account request was not found.',
        });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'REQUEST_ALREADY_RESOLVED',
          message: `This account request has already been ${request.status.toLowerCase()}.`,
        });
      }

      // Security & Tenant Boundary Checks:
      // 1. If reviewer is Principal:
      if (req.user!.role === 'principal') {
        if (request.requested_school_id !== req.user!.schoolId) {
          return res.status(403).json({
            success: false,
            error: 'TENANT_BOUNDARY_VIOLATION',
            message: 'Principals are strictly restricted to reviewing account requests for their own campus.',
          });
        }
        // Principal cannot grant super_admin, state_officer, or principal
        if (assignedRole && (assignedRole === 'super_admin' || assignedRole === 'state_officer' || assignedRole === 'principal')) {
          return res.status(403).json({
            success: false,
            error: 'INSUFFICIENT_CLEARANCE',
            message: 'Principals cannot grant administrative executive roles.',
          });
        }
      }

      // 2. Only Super Admin can approve super_admin or state_officer
      const finalRole = (assignedRole || request.requested_role).toLowerCase().trim();
      if ((finalRole === 'super_admin' || finalRole === 'state_officer') && !req.user!.isSuperAdmin) {
        return res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_CLEARANCE',
          message: 'Only Super Administrators can provision State Officers or Super Administrators.',
        });
      }

      const finalSchoolId = assignedSchoolId !== undefined ? assignedSchoolId : request.requested_school_id;

      // 3. Atomically create the user and update the request status
      await withTransaction(async (client) => {
        const fullName = [request.first_name, request.middle_name, request.surname]
          .filter(Boolean)
          .join(' ')
          .trim();

        // Provision user in users table
        const userInsertSql = `
          INSERT INTO users (
            school_id, email, phone, password_hash, full_name, role, is_active, email_verified
          ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE)
          RETURNING id;
        `;
        const userInsertRes = await client.query(userInsertSql, [
          finalSchoolId || null,
          request.email,
          request.phone || null,
          request.password_hash,
          fullName,
          finalRole,
        ]);
        const createdUserId = userInsertRes.rows[0]?.id;

        // Mark account request as APPROVED
        const updateRequestSql = `
          UPDATE user_account_requests
          SET 
            status = 'APPROVED',
            reviewed_by = $1,
            reviewed_at = NOW(),
            admin_notes = COALESCE($2, admin_notes),
            updated_at = NOW()
          WHERE id = $3;
        `;
        await client.query(updateRequestSql, [req.user!.id, adminNotes || null, request.id]);

        // Audit logging
        const auditSql = `
          INSERT INTO auth_audit_logs (
            action, status, user_id, email, ip_address, user_agent, details
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;
        await client.query(auditSql, [
          'ACCOUNT_APPROVED',
          'SUCCESS',
          req.user!.id,
          request.email,
          req.ip,
          req.headers['user-agent'] || null,
          JSON.stringify({
            requestId: request.id,
            createdUserId,
            applicantEmail: request.email,
            assignedRole: finalRole,
            assignedSchoolId: finalSchoolId,
            approvedBy: req.user!.email,
          }),
        ]);
      });

      return res.json({
        success: true,
        message: `Account request for ${request.email} has been approved. The user account is now active with role '${finalRole}'.`,
      });
    } catch (error: any) {
      console.error('[AccountRequestsRouter] Approve error:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to approve account request.',
      });
    }
  }
);

/**
 * POST /api/v1/auth/account-requests/:id/reject
 * Administrative endpoint: reject a pending account request.
 */
accountRequestsRouter.post(
  '/:id/reject',
  authenticateUser,
  requirePermission('account_requests.manage'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { rejectionReason, adminNotes } = req.body;

      const request = await accountRequestRepository.findByIdWithDetails(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'REQUEST_NOT_FOUND',
          message: 'The specified account request was not found.',
        });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'REQUEST_ALREADY_RESOLVED',
          message: `This account request has already been ${request.status.toLowerCase()}.`,
        });
      }

      // If Principal, enforce school boundary
      if (req.user!.role === 'principal' && request.requested_school_id !== req.user!.schoolId) {
        return res.status(403).json({
          success: false,
          error: 'TENANT_BOUNDARY_VIOLATION',
          message: 'Principals cannot reject requests belonging to other educational institutions.',
        });
      }

      const reason = rejectionReason || 'Institutional review criteria were not satisfied.';
      await accountRequestRepository.rejectRequest(id, req.user!.id, reason, adminNotes);

      logAuthEvent({
        action: 'ACCOUNT_REJECTED',
        status: 'SUCCESS',
        userId: req.user!.id,
        email: request.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          requestId: request.id,
          rejectionReason: reason,
          rejectedBy: req.user!.email,
        },
      });

      return res.json({
        success: true,
        message: `Account request for ${request.email} was rejected.`,
      });
    } catch (error: any) {
      console.error('[AccountRequestsRouter] Reject error:', error);
      return res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to reject account request.',
      });
    }
  }
);
