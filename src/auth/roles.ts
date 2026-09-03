/**
 * BummptEducation — Role Architecture & Hierarchy
 * 
 * Defines system roles, administrative clearance levels, and bidirectional mapping
 * between legacy prototype passkeys/roles and server-side production AuthRoles.
 */

import { AuthRole } from './types';

export const ALL_ROLES: AuthRole[] = [
  'super_admin',
  'state_officer',
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
 * Validates if a string is an authentic system role
 */
export function isValidRole(role: string): role is AuthRole {
  return ALL_ROLES.includes(role as AuthRole);
}

/**
 * Maps legacy UI / passkey roles to standard server-side AuthRoles
 */
export function normalizeLegacyRole(legacyRoleOrWing: string): AuthRole {
  const normalized = legacyRoleOrWing.toLowerCase().trim();

  if (normalized.includes('commissioner') || normalized.includes('subeb') || normalized.includes('permsec') || normalized.includes('inspector') || normalized.includes('benue_moe') || normalized.includes('quality assurance')) {
    return 'state_officer';
  }
  if (normalized.includes('super') || normalized.includes('executive director') || normalized === 'administrator') {
    return 'super_admin';
  }
  if (normalized.includes('headmistress')) {
    return 'headmistress';
  }
  if (normalized.includes('early childhood') || normalized.includes('montessori') || normalized.includes('kindergarten')) {
    return 'head_kindergarten';
  }
  if (normalized.includes('vice principal') || normalized.includes('vp academic')) {
    return 'vice_principal';
  }
  if (normalized.includes('principal')) {
    return 'principal';
  }
  if (normalized.includes('exam') || normalized.includes('records')) {
    return 'exam_officer';
  }
  if (normalized.includes('bursar') || normalized.includes('accountant') || normalized.includes('finance')) {
    return 'bursar';
  }
  if (normalized.includes('registrar') || normalized.includes('admission') || normalized.includes('human resources')) {
    return 'admissions_officer';
  }
  if (normalized.includes('teacher') || normalized.includes('form tutor')) {
    return 'teacher';
  }
  if (normalized.includes('parent') || normalized.includes('guardian')) {
    return 'parent';
  }
  if (normalized.includes('student')) {
    return 'student';
  }

  // Fallback safe assignment
  return 'teacher';
}

/**
 * Checks if a role is a global administrative role (operates across all schools)
 */
export function isGlobalRole(role: AuthRole): boolean {
  return role === 'super_admin' || role === 'state_officer';
}

/**
 * Role display label helper
 */
export function getRoleDisplayName(role: AuthRole): string {
  const labels: Record<AuthRole, string> = {
    super_admin: 'Super Administrator & Executive Director',
    state_officer: 'Benue State Ministry of Education Officer',
    principal: 'School Principal',
    vice_principal: 'Vice Principal (Academic)',
    headmistress: 'Headmistress (Primary Basic Education)',
    head_kindergarten: 'Head of Early Childhood & Kindergarten',
    exam_officer: 'Examination & Records Officer',
    bursar: 'Chief Bursar & Head of Finance',
    admissions_officer: 'Registrar & Admissions Officer',
    teacher: 'Subject Teacher & Form Master',
    parent: 'Parent / Legal Guardian',
    student: 'Student',
  };
  return labels[role] || role;
}
