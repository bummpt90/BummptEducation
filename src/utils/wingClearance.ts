/**
 * BummptEducation — Wing Clearance UI Display Helpers (Phase 8F)
 * 
 * NON-AUTHORITATIVE UI DISPLAY HELPERS ONLY.
 * 
 * IMPORTANT ARCHITECTURAL RULE:
 * This file contains purely client-side visual display helpers for conditional UI navigation.
 * It is NOT an authorization authority. Real security authorization is enforced
 * exclusively on the server side via JWT verification, PostgreSQL user record status,
 * and Role-Based Access Control (RBAC) middleware.
 */

export type RestrictedWing = 'academic' | 'bursary' | 'admin' | 'benue_moe' | 'all';

/**
 * Checks whether an authenticated user's role grants display clearance to a wing.
 * Used solely for frontend view rendering and conditional prompts.
 */
export function isUserAuthorizedForWingDisplay(
  user: { role?: string; isSuperAdmin?: boolean; isStateOfficer?: boolean } | null,
  targetWing: RestrictedWing
): boolean {
  if (!user) return false;

  // Super Admin has universal access
  if (user.isSuperAdmin || user.role === 'super_admin') {
    return true;
  }

  // State Officer / Ministry of Education roles
  if (user.isStateOfficer || user.role === 'state_officer') {
    return (
      targetWing === 'benue_moe' ||
      targetWing === 'academic' ||
      targetWing === 'admin' ||
      targetWing === 'all'
    );
  }

  // Institutional School Leadership
  if (user.role === 'principal' || user.role === 'headmistress' || user.role === 'head_kindergarten') {
    return (
      targetWing === 'academic' ||
      targetWing === 'bursary' ||
      targetWing === 'admin' ||
      targetWing === 'benue_moe'
    );
  }

  // Bursar & Financial Officers
  if (user.role === 'bursar') {
    return targetWing === 'bursary';
  }

  // Academic Teaching & Examination Staff
  if (user.role === 'teacher' || user.role === 'exam_officer') {
    return targetWing === 'academic';
  }

  // Administrative / Admissions Staff
  if (user.role === 'admissions_officer' || user.role === 'administrator') {
    return targetWing === 'admin' || targetWing === 'bursary';
  }

  return false;
}
