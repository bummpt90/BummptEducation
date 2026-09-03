/**
 * BummptEducation — Authentication & Security Audit Logger
 * 
 * Records security-sensitive identity events to the PostgreSQL auth_audit_logs ledger.
 */

import { query } from '../db';

export type AuthAuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'ACCOUNT_LOCKOUT'
  | 'LOGOUT'
  | 'TOKEN_REFRESH'
  | 'PASSWORD_CHANGE'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'TENANT_VIOLATION_ATTEMPT'
  | 'SIGNUP_REQUESTED'
  | 'PRIVILEGED_ROLE_REQUEST_BLOCKED'
  | 'ACCOUNT_APPROVED'
  | 'ACCOUNT_REJECTED'
  | 'PASSWORD_RESET_REQUESTED';

export interface AuditLogParams {
  action: AuthAuditAction;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  userId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, any>;
}

export async function logAuthEvent(params: AuditLogParams): Promise<void> {
  try {
    const sql = `
      INSERT INTO auth_audit_logs (
        user_id, email, action, status, ip_address, user_agent, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;
    await query(sql, [
      params.userId || null,
      params.email || null,
      params.action,
      params.status,
      params.ipAddress || null,
      params.userAgent || null,
      params.details ? JSON.stringify(params.details) : null,
    ]);
  } catch (error) {
    // Audit log failure must not crash main operation, but log to server console
    console.error('[AuthAudit] Failed to persist audit record:', error);
  }
}
