/**
 * BummptEducation — Authentication & RBAC Core Types
 */

import type { Request } from 'express';
import type { TenantContext } from '../db/types';

/**
 * Standardized Production Roles
 */
export type AuthRole =
  | 'super_admin'
  | 'state_officer'
  | 'principal'
  | 'vice_principal'
  | 'headmistress'
  | 'head_kindergarten'
  | 'exam_officer'
  | 'bursar'
  | 'admissions_officer'
  | 'teacher'
  | 'parent'
  | 'student';

/**
 * Granular System Permissions
 */
export type Permission =
  // User Management & Controlled Access
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.disable'
  | 'account_requests.view'
  | 'account_requests.manage'
  // Schools & Institutional Registry
  | 'schools.view'
  | 'schools.manage'
  // Staff & Faculty Management
  | 'staff.view'
  | 'staff.create'
  | 'staff.update'
  | 'staff.delete'
  // Student Information System
  | 'students.view'
  | 'students.create'
  | 'students.update'
  | 'students.delete'
  // Attendance Telemetry
  | 'attendance.view'
  | 'attendance.mark'
  // Academic Operations & Allocations
  | 'allocations.view'
  | 'allocations.manage'
  // Continuous Assessment & Broadsheets
  | 'assessments.view'
  | 'assessments.enter'
  | 'assessments.edit'
  | 'results.view'
  | 'results.publish'
  // Bursary & Financial Accounts
  | 'fees.view'
  | 'fees.create'
  | 'fees.manage'
  | 'invoices.view'
  | 'invoices.create'
  | 'payments.record'
  | 'payments.reconcile'
  | 'bursary.view'
  | 'bursary.manage'
  // Digital Lesson Notes
  | 'lesson_notes.view'
  | 'lesson_notes.create'
  | 'lesson_notes.publish'
  // Admissions Registry
  | 'admissions.view'
  | 'admissions.create'
  | 'admissions.manage'
  // Ministry of Education & State HQ
  | 'state_hq.view'
  | 'state_hq.dispatch'
  | 'directives.view'
  | 'directives.publish'
  // System Administration
  | 'system.manage';

/**
 * Safe, sanitized user identity exposed to client/frontend
 */
export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: AuthRole;
  schoolId: string | null;
  schoolName?: string | null;
  phone?: string | null;
  isSuperAdmin: boolean;
  isStateOfficer: boolean;
  permissions: Permission[];
}

/**
 * Decoded payload inside server-signed JWT tokens
 */
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: AuthRole;
  schoolId: string | null;
  isSuperAdmin: boolean;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated Request extending Express Request with trusted identity
 */
export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
  tokenPayload?: AuthTokenPayload;
  tenantContext?: TenantContext;
}

/**
 * Login Request Body
 */
export interface LoginRequestBody {
  email?: string;
  password?: string;
}

/**
 * Login Response Payload
 */
export interface LoginResponsePayload {
  success: boolean;
  message: string;
  user?: SafeUser;
  token?: string; // Also set in HTTP-only cookie
}
