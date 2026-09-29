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
 * Phase 10C Role Tier Classification
 * A. PLATFORM_ADMIN: Super Admin, State Officer (may exist without school_id)
 * B. TENANT_SCHOOL_ADMIN: Principal, Vice Principal, Headmistress, Head of Kindergarten (must belong to a school + organization)
 * C. SCHOOL_OPERATIONAL: Exam Officer, Bursar, Admissions Officer, Teacher, Parent, Student (must belong to a school + organization)
 */
export type RoleProvisioningTier =
  | 'PLATFORM_ADMIN'
  | 'TENANT_SCHOOL_ADMIN'
  | 'SCHOOL_OPERATIONAL';

export const PLATFORM_ADMIN_ROLES: AuthRole[] = [
  'super_admin',
  'state_officer',
];

export const TENANT_SCHOOL_ADMIN_ROLES: AuthRole[] = [
  'principal',
  'vice_principal',
  'headmistress',
  'head_kindergarten',
];

export const SCHOOL_OPERATIONAL_ROLES: AuthRole[] = [
  'exam_officer',
  'bursar',
  'admissions_officer',
  'teacher',
  'parent',
  'student',
];

export const STAFF_BACKED_ROLES: AuthRole[] = [
  'principal',
  'vice_principal',
  'headmistress',
  'head_kindergarten',
  'exam_officer',
  'bursar',
  'admissions_officer',
  'teacher',
];

export function getRoleProvisioningTier(role: AuthRole): RoleProvisioningTier {
  if (PLATFORM_ADMIN_ROLES.includes(role)) {
    return 'PLATFORM_ADMIN';
  }
  if (TENANT_SCHOOL_ADMIN_ROLES.includes(role)) {
    return 'TENANT_SCHOOL_ADMIN';
  }
  return 'SCHOOL_OPERATIONAL';
}

/**
 * Returns true if the role may exist without a school_id (Platform-level administration)
 */
export function roleMayExistWithoutSchool(role: AuthRole): boolean {
  return PLATFORM_ADMIN_ROLES.includes(role);
}

/**
 * Returns true if the role MUST belong to a specific school_id
 */
export function roleRequiresSchoolScope(role: AuthRole): boolean {
  return !PLATFORM_ADMIN_ROLES.includes(role);
}

/**
 * Returns true if provisioning this school role requires an authoritative staff record
 */
export function roleRequiresStaffIdentity(role: AuthRole): boolean {
  return STAFF_BACKED_ROLES.includes(role);
}

/**
 * Validates that the role and schoolId combination satisfies the Phase 10C provisioning boundary
 */
export function validateRoleTenantScope(
  role: string,
  schoolId?: string | null
): { valid: boolean; error?: string; reason?: string } {
  if (!isValidRole(role)) {
    return {
      valid: false,
      error: 'INVALID_ROLE',
      reason: `Role '${role}' is not a valid BummptEducation system role.`,
    };
  }

  const normalizedSchoolId = schoolId && typeof schoolId === 'string' && schoolId.trim().length > 0
    ? schoolId.trim()
    : null;

  if (roleRequiresSchoolScope(role) && !normalizedSchoolId) {
    return {
      valid: false,
      error: 'SCHOOL_SCOPE_REQUIRED',
      reason: `Role '${role}' (${getRoleProvisioningTier(role)}) must belong to an authoritative school (school_id is required).`,
    };
  }

  return { valid: true };
}

/**
 * Returns default staff profile metadata when provisioning a staff-backed school role
 */
export function getDefaultStaffProfileForRole(role: AuthRole): {
  staffType: 'Teaching' | 'Non-Teaching';
  arm: string;
  designation: string;
  roleLabel: string;
  staffCodePrefix: string;
} {
  switch (role) {
    case 'principal':
      return {
        staffType: 'Teaching',
        arm: 'Executive & Secondary',
        designation: 'School Principal & Chief Accounting Officer',
        roleLabel: 'Principal',
        staffCodePrefix: 'PRIN',
      };
    case 'vice_principal':
      return {
        staffType: 'Teaching',
        arm: 'Secondary Wing',
        designation: 'Vice Principal (Academic)',
        roleLabel: 'Vice Principal',
        staffCodePrefix: 'VPAC',
      };
    case 'headmistress':
      return {
        staffType: 'Teaching',
        arm: 'Primary Wing',
        designation: 'Headmistress (Primary Basic Education)',
        roleLabel: 'Headmistress',
        staffCodePrefix: 'HDMS',
      };
    case 'head_kindergarten':
      return {
        staffType: 'Teaching',
        arm: 'Early Years Wing',
        designation: 'Head of Early Childhood & Kindergarten',
        roleLabel: 'Head of Kindergarten',
        staffCodePrefix: 'HDKG',
      };
    case 'exam_officer':
      return {
        staffType: 'Teaching',
        arm: 'Academic Registry',
        designation: 'Examination & Broadsheet Records Officer',
        roleLabel: 'Exam Officer',
        staffCodePrefix: 'EXAM',
      };
    case 'bursar':
      return {
        staffType: 'Non-Teaching',
        arm: 'Bursary & Finance',
        designation: 'Chief Bursar & Head of School Finance',
        roleLabel: 'Bursar',
        staffCodePrefix: 'BURS',
      };
    case 'admissions_officer':
      return {
        staffType: 'Non-Teaching',
        arm: 'Admissions Registry',
        designation: 'Registrar & Admissions Officer',
        roleLabel: 'Admissions Officer',
        staffCodePrefix: 'ADMS',
      };
    case 'teacher':
    default:
      return {
        staffType: 'Teaching',
        arm: 'Academic Faculty',
        designation: 'Subject Teacher & Form Tutor',
        roleLabel: 'Teacher',
        staffCodePrefix: 'TCHR',
      };
  }
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
