/**
 * BummptEducation — Phase 10D: School Onboarding & Institutional Readiness Service
 * 
 * Provides server-authoritative evaluation and management of the 7-step onboarding
 * lifecycle for provisioned schools in PostgreSQL:
 * 1. School Identity & Institutional Profile
 * 2. Authorized School Leadership & Staff Registry
 * 3. Academic Calendar & Term Configuration
 * 4. Class & Subject Configuration
 * 5. Academic Responsibilities & Staff Allocations
 * 6. Review & Verification of Onboarding Completeness
 * 7. Explicit Readiness for Future Operational Launch
 * 
 * STRICT ARCHITECTURAL GUARANTEES:
 * - Derives readiness exclusively from persisted server-side records in PostgreSQL.
 * - Never trusts frontend state, localStorage preferences, or simulation presets.
 * - Never loads or creates real student, parent, fee, invoice, or attendance records.
 * - Enforces multi-tenant isolation: Principals are strictly restricted to their assigned school.
 * - Records all meaningful profile updates and verification sign-offs in auth_audit_logs.
 * - Retains operationalLaunchStatus = 'OPERATIONAL_LAUNCH_NOT_AUTHORIZED'.
 */

import type { PoolClient } from 'pg';
import { query, withTransaction, sanitizeDatabaseErrorMessage } from '../db/client';
import { logAuthEvent } from './audit';
import { hasPermission } from './permissions';
import type { SafeUser, AuthRole, Permission } from './types';

export interface AuthenticatedCaller {
  user?: (Partial<SafeUser> & {
    id?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
    isStateOfficer?: boolean;
    schoolId?: string | null;
  }) | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export type OnboardingReadinessStatus = 'ONBOARDING_INCOMPLETE' | 'ONBOARDING_READY';
export type OperationalLaunchStatus = 'OPERATIONAL_LAUNCH_NOT_AUTHORIZED';

export interface OnboardingStepItem {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  value?: string | number | null;
  required: boolean;
  details?: Record<string, any>;
}

export interface OnboardingStep {
  stepNumber: number;
  id: 'school_profile' | 'leadership_and_staff' | 'academic_calendar' | 'classes_and_subjects' | 'staff_assignments' | 'review_completeness' | 'operational_readiness';
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  isComplete: boolean;
  items: OnboardingStepItem[];
}

export interface SchoolOnboardingStatusReport {
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  overallStatus: OnboardingReadinessStatus;
  operationalLaunchStatus: OperationalLaunchStatus;
  completionPercentage: number;
  completedStepsCount: number;
  totalStepsCount: number;
  isReadyForVerification: boolean;
  lastVerifiedAt: string | null;
  lastVerifiedBy: string | null;
  steps: OnboardingStep[];
  institutionalProfile: {
    name: string;
    code: string;
    lga: string;
    senatorialZone: string;
    category: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    establishedYear: number | null;
    isActive: boolean;
  };
  authoritativeLeadership?: {
    principal: string;
    principalUserId: string | null;
    principalStaffId: string | null;
    teachingStaffCount: number;
    totalStaffCount: number;
  };
  metrics: {
    teachingStaffCount: number;
    nonTeachingStaffCount: number;
    totalStaffCount: number;
    classesCount: number;
    allocationsCount: number;
    studentsCount: number; // Must be 0 in Phase 10D
  };
  declarations: {
    liveProductionDatabase: 'NOT_YET_PROVISIONED';
    realSchoolData: 'NOT_YET_LOADED';
    realStudentData: 'NOT_YET_LOADED';
    operationalLaunchAuthorized: false;
  };
}

export interface SchoolProfileUpdates {
  name?: string;
  lga?: string;
  senatorialZone?: string;
  category?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  establishedYear?: number | null;
}

export class OnboardingError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: string, message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = 'OnboardingError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function runOnboardingTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  let capturedOnboardingError: OnboardingError | null = null;
  try {
    return await withTransaction(async (client) => {
      try {
        return await callback(client);
      } catch (err: any) {
        if (err instanceof OnboardingError) {
          capturedOnboardingError = err;
        }
        throw err;
      }
    });
  } catch (err: any) {
    if (capturedOnboardingError) {
      throw capturedOnboardingError;
    }
    if (err instanceof OnboardingError) {
      throw err;
    }
    throw err;
  }
}

/**
 * Validates that an authenticated caller is authorized to view or manage onboarding for a specific school.
 * Requires BOTH legitimate permission and valid tenant scope.
 */
export function assertCallerSchoolAuthority(
  schoolId: string,
  caller: AuthenticatedCaller,
  actionDescription = 'access school onboarding',
  requiredPermission: Permission = 'schools.view'
): void {
  const user = caller.user;
  if (!user) {
    throw new OnboardingError('UNAUTHENTICATED', 'Authentication required.', 401);
  }

  // Super Admin possesses universal platform-wide authority
  if (user.isSuperAdmin || user.role === 'super_admin') {
    return;
  }

  // State Officer: platform-level role that has schools.view, but NOT schools.manage
  if (user.isStateOfficer || user.role === 'state_officer') {
    if (!hasPermission('state_officer', requiredPermission)) {
      throw new OnboardingError(
        'FORBIDDEN',
        `Access denied: State officers do not possess '${requiredPermission}' authority to ${actionDescription}.`,
        403
      );
    }
    return;
  }

  // Non-platform callers: must possess required school scope
  if (!user.schoolId || user.schoolId !== schoolId) {
    throw new OnboardingError(
      'TENANT_ISOLATION_VIOLATION',
      `Access denied: You are not authorized to ${actionDescription} for another school.`,
      403
    );
  }

  // Non-platform callers: must possess required permission via role permission matrix
  const role = (user.role || 'student') as AuthRole;
  if (!hasPermission(role, requiredPermission)) {
    throw new OnboardingError(
      'FORBIDDEN',
      `Access denied: Role '${user.role}' lacks '${requiredPermission}' permission to ${actionDescription}.`,
      403
    );
  }
}

/**
 * Normalizes and validates school profile updates.
 */
function validateProfileUpdates(updates: SchoolProfileUpdates & Record<string, any>): SchoolProfileUpdates {
  const clean: SchoolProfileUpdates = {};

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (trimmed.length < 3 || trimmed.length > 255) {
      throw new OnboardingError(
        'INVALID_SCHOOL_NAME',
        'School name must be between 3 and 255 characters long.'
      );
    }
    clean.name = trimmed;
  }

  if (updates.lga !== undefined) {
    const trimmed = updates.lga.trim();
    if (!trimmed) {
      throw new OnboardingError('INVALID_LGA', 'LGA cannot be empty.');
    }
    clean.lga = trimmed;
  }

  if (updates.senatorialZone !== undefined) {
    const trimmed = updates.senatorialZone.trim();
    if (!trimmed) {
      throw new OnboardingError('INVALID_ZONE', 'Senatorial zone cannot be empty.');
    }
    clean.senatorialZone = trimmed;
  }

  if (updates.category !== undefined) {
    const trimmed = updates.category.trim();
    if (!trimmed) {
      throw new OnboardingError('INVALID_CATEGORY', 'School category cannot be empty.');
    }
    clean.category = trimmed;
  }

  if (updates.email !== undefined) {
    if (updates.email === null || updates.email === '') {
      clean.email = null;
    } else {
      const email = updates.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new OnboardingError('INVALID_EMAIL', 'A valid institutional email address is required.');
      }
      clean.email = email;
    }
  }

  if (updates.phone !== undefined) {
    if (updates.phone === null || updates.phone === '') {
      clean.phone = null;
    } else {
      const phone = updates.phone.trim();
      if (phone.length < 7 || phone.length > 50) {
        throw new OnboardingError('INVALID_PHONE', 'Phone number must be between 7 and 50 characters.');
      }
      clean.phone = phone;
    }
  }

  if (updates.address !== undefined) {
    clean.address = updates.address ? updates.address.trim() : null;
  }

  if (updates.establishedYear !== undefined) {
    if (updates.establishedYear === null) {
      clean.establishedYear = null;
    } else {
      const year = Number(updates.establishedYear);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(year) || year < 1840 || year > currentYear) {
        throw new OnboardingError(
          'INVALID_ESTABLISHED_YEAR',
          `Established year must be an integer between 1840 and ${currentYear}.`
        );
      }
      clean.establishedYear = year;
    }
  }

  if (
    updates.principalName !== undefined ||
    updates.vicePrincipalAcademic !== undefined ||
    updates.bursarName !== undefined
  ) {
    throw new OnboardingError(
      'LEGACY_LEADERSHIP_FIELDS_PROHIBITED',
      'Direct updates to principalName, vicePrincipalAcademic, or bursarName text fields are prohibited. Authoritative school leadership must be assigned through verified user accounts and linked staff registry records.',
      400
    );
  }

  return clean;
}

/**
 * Evaluates the full server-authoritative onboarding lifecycle checklist for an existing school in PostgreSQL.
 */
export async function getSchoolOnboardingStatus(
  schoolId: string,
  caller: AuthenticatedCaller,
  client?: PoolClient
): Promise<SchoolOnboardingStatusReport> {
  assertCallerSchoolAuthority(schoolId, caller, 'retrieve onboarding checklist', 'schools.view');

  // 1. Fetch Authoritative School and Organization Records
  const schoolRes = await query<{
    id: string;
    organization_id: string;
    code: string;
    name: string;
    lga: string;
    senatorial_zone: string;
    category: string;
    principal_name: string | null;
    bursar_name: string | null;
    vice_principal_academic: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    established_year: number | null;
    is_active: boolean;
    org_name: string;
    org_code: string;
  }>(
    `SELECT s.*, o.name AS org_name, o.code AS org_code
     FROM schools s
     INNER JOIN organizations o ON o.id = s.organization_id
     WHERE s.id = $1
     LIMIT 1;`,
    [schoolId],
    client
  );

  const school = schoolRes.rows[0];
  if (!school) {
    throw new OnboardingError('SCHOOL_NOT_FOUND', `School with ID '${schoolId}' does not exist.`, 404);
  }

  // 2. Fetch Authoritative Leadership & Staff Records
  const staffCountsRes = await query<{
    staff_count: string;
    teaching_staff_count: string;
    non_teaching_staff_count: string;
  }>(
    `SELECT 
       COUNT(*)::text AS staff_count,
       COUNT(*) FILTER (WHERE staff_type = 'Teaching')::text AS teaching_staff_count,
       COUNT(*) FILTER (WHERE staff_type = 'Non-Teaching')::text AS non_teaching_staff_count
     FROM staff
     WHERE school_id = $1 AND is_active = TRUE;`,
    [schoolId],
    client
  );

  const staffStats = staffCountsRes.rows[0] || {
    staff_count: '0',
    teaching_staff_count: '0',
    non_teaching_staff_count: '0',
  };

  const totalStaffCount = parseInt(staffStats.staff_count, 10) || 0;
  const teachingStaffCount = parseInt(staffStats.teaching_staff_count, 10) || 0;
  const nonTeachingStaffCount = parseInt(staffStats.non_teaching_staff_count, 10) || 0;

  // Authoritative Principal: verified strictly through users.role = 'principal' + staff.user_id + same school/org + active
  const principalRes = await query<{
    staff_id: string;
    staff_number: string | null;
    full_name: string;
    user_id: string;
    user_email: string;
  }>(
    `SELECT 
       st.id AS staff_id,
       st.staff_id_number AS staff_number,
       st.full_name,
       u.id AS user_id,
       u.email AS user_email
     FROM users u
     INNER JOIN staff st ON st.user_id = u.id AND st.school_id = u.school_id
     INNER JOIN schools s ON s.id = u.school_id
     WHERE u.school_id = $1
       AND u.role = 'principal'
       AND u.is_active = TRUE
       AND st.is_active = TRUE
     LIMIT 1;`,
    [schoolId],
    client
  );

  const principalRecord = principalRes.rows[0] || null;
  const activePrincipalCount = principalRecord ? 1 : 0;
  const principalFullName = principalRecord?.full_name || null;
  const principalUserEmail = principalRecord?.user_email || null;
  const principalStaffDisplay = principalRecord
    ? `${principalRecord.full_name} — Staff ID ${principalRecord.staff_number || principalRecord.staff_id}`
    : null;

  // 3. Fetch Academic Calendar State
  const calendarRes = await query<{
    current_session_id: string | null;
    current_session_name: string | null;
    current_term_id: string | null;
    current_term_name: string | null;
    resumption_date: string | null;
    vacation_date: string | null;
    term_session_mismatch: boolean;
  }>(
    `SELECT 
       s.id AS current_session_id,
       s.session_name AS current_session_name,
       t.id AS current_term_id,
       t.term_name AS current_term_name,
       t.resumption_date::text AS resumption_date,
       t.vacation_date::text AS vacation_date,
       CASE WHEN t.id IS NOT NULL AND t.session_id != s.id THEN TRUE ELSE FALSE END AS term_session_mismatch
     FROM academic_sessions s
     LEFT JOIN academic_terms t ON t.is_current = TRUE
     WHERE s.is_current = TRUE
     LIMIT 1;`,
    [],
    client
  );
  const calendar = calendarRes.rows[0] || {
    current_session_id: null,
    current_session_name: null,
    current_term_id: null,
    current_term_name: null,
    resumption_date: null,
    vacation_date: null,
    term_session_mismatch: false,
  };

  // 4. Fetch Classes & Subjects State
  const classesRes = await query<{
    class_count: string;
    classes_with_form_master: string;
    invalid_form_masters_count: string;
  }>(
    `SELECT 
       COUNT(*)::text AS class_count,
       COUNT(c.form_master_id)::text AS classes_with_form_master,
       COUNT(*) FILTER (
         WHERE c.form_master_id IS NOT NULL AND NOT EXISTS (
           SELECT 1 FROM staff st 
           WHERE st.id = c.form_master_id 
             AND st.school_id = c.school_id 
             AND st.is_active = TRUE
         )
       )::text AS invalid_form_masters_count
     FROM classes c
     WHERE c.school_id = $1;`,
    [schoolId],
    client
  );
  const classesCount = parseInt(classesRes.rows[0]?.class_count || '0', 10);
  const formMastersCount = parseInt(classesRes.rows[0]?.classes_with_form_master || '0', 10);
  const invalidFormMastersCount = parseInt(classesRes.rows[0]?.invalid_form_masters_count || '0', 10);

  const subjectsRes = await query<{ subject_count: string }>(
    'SELECT COUNT(*)::text AS subject_count FROM subjects;',
    [],
    client
  );
  const stateSubjectsCount = parseInt(subjectsRes.rows[0]?.subject_count || '0', 10);

  // 5. Fetch Class-Subject Allocations State (session- and term-specific)
  const activeSessionId = (!calendar.term_session_mismatch && calendar.current_session_id) ? calendar.current_session_id : null;
  const activeTermId = (!calendar.term_session_mismatch && calendar.current_term_id) ? calendar.current_term_id : null;

  const allocationsRes = await query<{
    total_allocations_count: string;
    active_term_allocations_count: string;
    active_allocations_with_teachers: string;
    active_allocations_valid_teachers_count: string;
    invalid_class_allocations_count: string;
    invalid_subject_allocations_count: string;
    invalid_teacher_allocations_count: string;
    invalid_term_session_allocations_count: string;
    active_allocations_missing_teacher_count: string;
  }>(
    `SELECT 
       COUNT(*)::text AS total_allocations_count,
       COUNT(*) FILTER (
         WHERE $2::uuid IS NOT NULL AND $3::uuid IS NOT NULL 
           AND a.academic_session_id = $2::uuid 
           AND a.academic_term_id = $3::uuid
       )::text AS active_term_allocations_count,
       COUNT(a.teacher_id) FILTER (
         WHERE $2::uuid IS NOT NULL AND $3::uuid IS NOT NULL 
           AND a.academic_session_id = $2::uuid 
           AND a.academic_term_id = $3::uuid
       )::text AS active_allocations_with_teachers,
       COUNT(*) FILTER (
         WHERE $2::uuid IS NOT NULL AND $3::uuid IS NOT NULL 
           AND a.academic_session_id = $2::uuid 
           AND a.academic_term_id = $3::uuid
           AND a.teacher_id IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM staff st 
             WHERE st.id = a.teacher_id 
               AND st.school_id = $1 
               AND st.is_active = TRUE
           )
       )::text AS active_allocations_valid_teachers_count,
       COUNT(*) FILTER (
         WHERE NOT EXISTS (
           SELECT 1 FROM classes c WHERE c.id = a.class_id AND c.school_id = $1
         )
       )::text AS invalid_class_allocations_count,
       COUNT(*) FILTER (
         WHERE NOT EXISTS (
           SELECT 1 FROM subjects sub WHERE sub.id = a.subject_id
         )
       )::text AS invalid_subject_allocations_count,
       COUNT(*) FILTER (
         WHERE a.teacher_id IS NOT NULL AND NOT EXISTS (
           SELECT 1 FROM staff st WHERE st.id = a.teacher_id AND st.school_id = $1 AND st.is_active = TRUE
         )
       )::text AS invalid_teacher_allocations_count,
       COUNT(*) FILTER (
         WHERE (a.academic_term_id IS NULL OR a.academic_session_id IS NULL)
            OR NOT EXISTS (
              SELECT 1 FROM academic_terms term 
              WHERE term.id = a.academic_term_id 
                AND term.session_id = a.academic_session_id
            )
       )::text AS invalid_term_session_allocations_count,
       COUNT(*) FILTER (
         WHERE $2::uuid IS NOT NULL AND $3::uuid IS NOT NULL 
           AND a.academic_session_id = $2::uuid 
           AND a.academic_term_id = $3::uuid
           AND a.teacher_id IS NULL
       )::text AS active_allocations_missing_teacher_count
     FROM class_subject_allocations a
     WHERE a.school_id = $1;`,
    [schoolId, activeSessionId, activeTermId],
    client
  );

  const totalAllocationsCount = parseInt(allocationsRes.rows[0]?.total_allocations_count || '0', 10);
  const activeTermAllocationsCount = parseInt(allocationsRes.rows[0]?.active_term_allocations_count || '0', 10);
  const activeAllocationsWithTeachers = parseInt(allocationsRes.rows[0]?.active_allocations_with_teachers || '0', 10);
  const activeAllocationsValidTeachersCount = parseInt(allocationsRes.rows[0]?.active_allocations_valid_teachers_count || '0', 10);
  const invalidClassAllocationsCount = parseInt(allocationsRes.rows[0]?.invalid_class_allocations_count || '0', 10);
  const invalidSubjectAllocationsCount = parseInt(allocationsRes.rows[0]?.invalid_subject_allocations_count || '0', 10);
  const invalidTeacherAllocationsCount = parseInt(allocationsRes.rows[0]?.invalid_teacher_allocations_count || '0', 10);
  const invalidTermSessionAllocationsCount = parseInt(allocationsRes.rows[0]?.invalid_term_session_allocations_count || '0', 10);
  const activeAllocationsMissingTeacherCount = parseInt(allocationsRes.rows[0]?.active_allocations_missing_teacher_count || '0', 10);

  // 6. Fetch Student Records (Must be strictly 0 in Phase 10D)
  const studentsRes = await query<{ student_count: string }>(
    'SELECT COUNT(*)::text AS student_count FROM students WHERE school_id = $1;',
    [schoolId],
    client
  );
  const studentsCount = parseInt(studentsRes.rows[0]?.student_count || '0', 10);

  // 7. Check for Last Verified Audit Sign-off
  const auditRes = await query<{ created_at: string; email: string }>(
    `SELECT created_at::text, email
     FROM auth_audit_logs
     WHERE action = 'SCHOOL_ONBOARDING_VERIFIED' 
       AND status = 'SUCCESS'
       AND (details->>'schoolId' = $1 OR details->>'school_id' = $1)
     ORDER BY created_at DESC
     LIMIT 1;`,
    [schoolId],
    client
  );
  const lastVerifiedAt = auditRes.rows[0]?.created_at || null;
  const lastVerifiedBy = auditRes.rows[0]?.email || null;

  // =========================================================================
  // Build Detailed 7-Step Onboarding Checklist
  // =========================================================================

  // Step 1: School Profile
  const profileItems: OnboardingStepItem[] = [
    {
      id: 'profile_name',
      label: 'Authoritative School Name',
      description: 'Registered institutional school name',
      isComplete: Boolean(school.name && school.name.trim().length >= 3),
      value: school.name,
      required: true,
    },
    {
      id: 'profile_code',
      label: 'Unique Institutional Code',
      description: 'System-wide unique school code identifier',
      isComplete: Boolean(school.code && school.code.trim().length >= 3),
      value: school.code,
      required: true,
    },
    {
      id: 'profile_organization',
      label: 'Parent Organization / Tenant',
      description: 'Authoritative Ministry of Education / Board organization',
      isComplete: Boolean(school.organization_id && school.org_name),
      value: `${school.org_name} (${school.org_code})`,
      required: true,
    },
    {
      id: 'profile_lga_zone',
      label: 'LGA & Senatorial Zone',
      description: 'Geographic LGA and Benue senatorial zone assignment',
      isComplete: Boolean(school.lga && school.senatorial_zone),
      value: `${school.lga} — ${school.senatorial_zone}`,
      required: true,
    },
    {
      id: 'profile_category',
      label: 'Educational Category',
      description: 'School tier (e.g. Secondary, Primary, Basic Education)',
      isComplete: Boolean(school.category && school.category.trim().length > 0),
      value: school.category,
      required: true,
    },
    {
      id: 'profile_contact',
      label: 'Institutional Contact Info',
      description: 'Official phone number and email for correspondence',
      isComplete: Boolean(school.email && school.phone),
      value: school.email ? `${school.email} | ${school.phone || 'No phone'}` : null,
      required: true,
    },
    {
      id: 'profile_address',
      label: 'Physical Campus Address',
      description: 'Campus address in the host LGA',
      isComplete: Boolean(school.address && school.address.trim().length >= 5),
      value: school.address,
      required: true,
    },
    {
      id: 'profile_established_year',
      label: 'Establishment Information',
      description: 'Year of official establishment',
      isComplete: Boolean(school.established_year && school.established_year >= 1840),
      value: school.established_year,
      required: true,
    },
    {
      id: 'profile_active_status',
      label: 'Active Institutional Status',
      description: 'School record is active in registry',
      isComplete: Boolean(school.is_active === true),
      value: school.is_active ? 'Active' : 'Inactive',
      required: true,
    },
  ];
  const isProfileComplete = profileItems.every((item) => item.isComplete);

  // Step 2: Leadership & Staff
  const leadershipItems: OnboardingStepItem[] = [
    {
      id: 'leadership_principal_user',
      label: 'Authorized School Principal Account',
      description: 'Server-authoritative user account with role="principal" scoped to this school',
      isComplete: activePrincipalCount > 0,
      value: principalUserEmail || null,
      required: true,
    },
    {
      id: 'leadership_principal_staff',
      label: 'Linked Principal Staff Record',
      description: 'Relational staff registry entry linked to the principal user account',
      isComplete: Boolean(principalRecord),
      value: principalStaffDisplay ? `${principalStaffDisplay} (From staff registry)` : null,
      required: true,
    },
    {
      id: 'leadership_teaching_staff',
      label: 'Teaching Staff Registry',
      description: 'At least one active teaching staff member registered in the school',
      isComplete: teachingStaffCount > 0,
      value: `${teachingStaffCount} Teaching Staff registered`,
      required: true,
      details: { teachingStaffCount, totalStaffCount },
    },
    {
      id: 'leadership_zero_simulation_reliance',
      label: 'Authoritative Identity Boundary',
      description: 'Staff identities originate strictly from database records, not UI simulation presets',
      isComplete: true,
      value: 'Enforced via server RBAC and PostgreSQL relational models',
      required: true,
    },
  ];
  const isLeadershipComplete = leadershipItems.every((item) => item.isComplete);

  // Step 3: Academic Calendar
  const calendarItems: OnboardingStepItem[] = [
    {
      id: 'calendar_session',
      label: 'Active Academic Session',
      description: 'Current academic year / session (e.g. 2025/2026)',
      isComplete: Boolean(calendar.current_session_id),
      value: calendar.current_session_name,
      required: true,
    },
    {
      id: 'calendar_term',
      label: 'Active Academic Term',
      description: 'Active statutory term belonging to the current session',
      isComplete: Boolean(calendar.current_term_id) && !calendar.term_session_mismatch,
      value: calendar.term_session_mismatch
        ? 'Active term does not belong to active session'
        : calendar.current_term_name || 'No active term',
      required: true,
    },
    {
      id: 'calendar_dates',
      label: 'Resumption & Vacation Dates',
      description: 'Statutory term resumption and vacation boundary dates',
      isComplete: Boolean(calendar.resumption_date && calendar.vacation_date),
      value: calendar.resumption_date ? `${calendar.resumption_date} to ${calendar.vacation_date}` : null,
      required: true,
    },
  ];
  const isCalendarComplete = calendarItems.every((item) => item.isComplete);

  // Step 4: Classes & Subjects
  const classItems: OnboardingStepItem[] = [
    {
      id: 'classes_configured',
      label: 'Institutional Classrooms & Arms',
      description: 'At least one class configured for this school in PostgreSQL',
      isComplete: classesCount > 0,
      value: `${classesCount} Classes configured`,
      required: true,
      details: { classesCount },
    },
    {
      id: 'classes_form_masters',
      label: 'Class Form Master Assignment',
      description: 'All classes must have active form masters from this school assigned',
      isComplete: classesCount > 0 && formMastersCount === classesCount && invalidFormMastersCount === 0,
      value: invalidFormMastersCount > 0
        ? `Invalid: ${invalidFormMastersCount} form master(s) inactive or outside school`
        : classesCount === 0
        ? 'No classes configured'
        : formMastersCount < classesCount
        ? `Incomplete: ${classesCount - formMastersCount} of ${classesCount} classes lack form masters`
        : `All ${classesCount} classes have active same-school form masters assigned`,
      required: true,
      details: { formMastersCount, classesCount, invalidFormMastersCount },
    },
    {
      id: 'subjects_available',
      label: 'Curriculum Subjects Available',
      description: 'Approved state curriculum subjects available in registry',
      isComplete: stateSubjectsCount > 0,
      value: `${stateSubjectsCount} Subjects in registry`,
      required: true,
      details: { stateSubjectsCount },
    },
  ];
  const isClassesComplete = classItems.every((item) => item.isComplete);

  // Step 5: Academic Responsibilities & Staff Allocations
  const allocationItems: OnboardingStepItem[] = [
    {
      id: 'allocations_present',
      label: 'Class-Subject Allocations (Active Term)',
      description: 'Subject allocations assigned to school classes for the active session and term',
      isComplete: Boolean(
        activeSessionId &&
        activeTermId &&
        !calendar.term_session_mismatch &&
        activeTermAllocationsCount > 0 &&
        invalidClassAllocationsCount === 0 &&
        invalidSubjectAllocationsCount === 0
      ),
      value: !activeSessionId || !activeTermId || calendar.term_session_mismatch
        ? 'Incomplete: No valid active academic session and term configured'
        : invalidClassAllocationsCount > 0
        ? `Invalid: ${invalidClassAllocationsCount} allocation(s) reference classes outside school`
        : invalidSubjectAllocationsCount > 0
        ? `Invalid: ${invalidSubjectAllocationsCount} allocation(s) reference non-existent subjects`
        : activeTermAllocationsCount === 0 && totalAllocationsCount > 0
        ? `Incomplete: ${totalAllocationsCount} historical allocation(s) exist, but 0 configured for active term (${calendar.current_term_name || 'No active term'})`
        : activeTermAllocationsCount === 0
        ? 'No allocations configured for active term'
        : `${activeTermAllocationsCount} Allocations configured for active term (${calendar.current_session_name} - ${calendar.current_term_name})`,
      required: true,
      details: {
        activeTermAllocationsCount,
        totalAllocationsCount,
        invalidClassAllocationsCount,
        invalidSubjectAllocationsCount,
        activeSessionId,
        activeTermId,
      },
    },
    {
      id: 'allocations_teachers_assigned',
      label: 'Teacher Responsibility Assignments',
      description: 'Active-term allocations must have qualified, active same-school teaching staff assigned',
      isComplete: Boolean(
        activeSessionId &&
        activeTermId &&
        activeTermAllocationsCount > 0 &&
        activeAllocationsWithTeachers === activeTermAllocationsCount &&
        invalidTeacherAllocationsCount === 0 &&
        activeAllocationsValidTeachersCount === activeTermAllocationsCount
      ),
      value: invalidTeacherAllocationsCount > 0
        ? `Invalid: ${invalidTeacherAllocationsCount} allocation(s) have inactive or outside-school teachers`
        : activeAllocationsMissingTeacherCount > 0
        ? `Incomplete: ${activeAllocationsMissingTeacherCount} of ${activeTermAllocationsCount} active-term allocations lack assigned teachers`
        : activeTermAllocationsCount === 0
        ? 'No allocations configured for active term'
        : `All ${activeTermAllocationsCount} active-term allocations assigned to active same-school teachers`,
      required: true,
      details: {
        activeAllocationsWithTeachers,
        activeTermAllocationsCount,
        invalidTeacherAllocationsCount,
        activeAllocationsValidTeachersCount,
        activeAllocationsMissingTeacherCount,
      },
    },
    {
      id: 'allocations_term_session_integrity',
      label: 'Allocation Term & Session Integrity',
      description: 'Allocations must reference terms belonging to their academic session',
      isComplete: Boolean(
        activeSessionId &&
        activeTermId &&
        activeTermAllocationsCount > 0 &&
        invalidTermSessionAllocationsCount === 0
      ),
      value: invalidTermSessionAllocationsCount > 0
        ? `Invalid: ${invalidTermSessionAllocationsCount} allocation(s) have term/session mismatch or missing session/term`
        : activeTermAllocationsCount === 0
        ? 'No allocations configured for active term'
        : 'All allocations have valid session/term integrity',
      required: true,
      details: { invalidTermSessionAllocationsCount, activeTermAllocationsCount },
    },
  ];
  const isAllocationsComplete = allocationItems.every((item) => item.isComplete);

  // Step 6: Review of Onboarding Completeness
  const prerequisitesMet =
    isProfileComplete && isLeadershipComplete && isCalendarComplete && isClassesComplete && isAllocationsComplete;

  const reviewItems: OnboardingStepItem[] = [
    {
      id: 'review_mandatory_prerequisites',
      label: 'Mandatory Configuration Prerequisites',
      description: 'Profile, leadership, calendar, classes, and allocations all complete',
      isComplete: prerequisitesMet,
      value: prerequisitesMet ? 'All 5 foundational sections complete' : 'Prerequisites incomplete',
      required: true,
    },
    {
      id: 'review_zero_student_records',
      label: 'Zero Student Record Boundary',
      description: 'Strict Phase 10D boundary: zero real student records loaded',
      isComplete: studentsCount === 0,
      value: `${studentsCount} Student records in database (expected: 0)`,
      required: true,
    },
    {
      id: 'review_admin_signoff',
      label: 'Authorized Administrator Sign-off',
      description: 'Verification review recorded in auth_audit_logs',
      isComplete: Boolean(lastVerifiedAt && prerequisitesMet),
      value: lastVerifiedAt ? `Verified by ${lastVerifiedBy} on ${new Date(lastVerifiedAt).toISOString().split('T')[0]}` : 'Pending administrative verification sign-off',
      required: true,
    },
  ];
  const isReviewComplete = reviewItems.every((item) => item.isComplete);

  // Step 7: Operational Launch Readiness
  const operationalItems: OnboardingStepItem[] = [
    {
      id: 'operational_readiness_onboarding',
      label: 'Institutional Onboarding State',
      description: 'School institutional setup is verified and complete',
      isComplete: isReviewComplete,
      value: isReviewComplete ? 'ONBOARDING_READY' : 'ONBOARDING_INCOMPLETE',
      required: true,
    },
    {
      id: 'operational_launch_boundary',
      label: 'Separate Operational Launch Gate',
      description: 'Operational launch requires distinct Phase 10E ministerial authorization',
      isComplete: true, // The gate is correctly active
      value: 'OPERATIONAL_LAUNCH_NOT_AUTHORIZED',
      required: true,
    },
    {
      id: 'operational_production_db_boundary',
      label: 'Production Database Boundary',
      description: 'Live cloud production database is not yet provisioned in Phase 10D',
      isComplete: true,
      value: 'LIVE PRODUCTION DATABASE: NOT YET PROVISIONED',
      required: true,
    },
  ];
  const isOperationalComplete = operationalItems.every((item) => item.isComplete);

  const steps: OnboardingStep[] = [
    {
      stepNumber: 1,
      id: 'school_profile',
      title: 'School Identity & Institutional Profile',
      description: 'Review and complete verified contact, address, LGA, and institutional metadata.',
      status: isProfileComplete ? 'COMPLETED' : 'IN_PROGRESS',
      isComplete: isProfileComplete,
      items: profileItems,
    },
    {
      stepNumber: 2,
      id: 'leadership_and_staff',
      title: 'Authorized School Leadership & Staff Registry',
      description: 'Confirm authoritative principal user and teaching staff records in PostgreSQL.',
      status: isLeadershipComplete ? 'COMPLETED' : totalStaffCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      isComplete: isLeadershipComplete,
      items: leadershipItems,
    },
    {
      stepNumber: 3,
      id: 'academic_calendar',
      title: 'Academic Calendar & Term Configuration',
      description: 'Verify current academic session, active term, and boundary dates.',
      status: isCalendarComplete ? 'COMPLETED' : calendar.current_session_id ? 'IN_PROGRESS' : 'NOT_STARTED',
      isComplete: isCalendarComplete,
      items: calendarItems,
    },
    {
      stepNumber: 4,
      id: 'classes_and_subjects',
      title: 'Class & Subject Configuration',
      description: 'Configure institutional classrooms, arms, capacity, and curriculum subjects.',
      status: isClassesComplete ? 'COMPLETED' : classesCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
      isComplete: isClassesComplete,
      items: classItems,
    },
    {
      stepNumber: 5,
      id: 'staff_assignments',
      title: 'Academic Responsibilities & Staff Allocations',
      description: 'Allocate curriculum subjects to classes and assign responsible teaching staff for active term.',
      status: isAllocationsComplete ? 'COMPLETED' : (activeTermAllocationsCount > 0 || totalAllocationsCount > 0) ? 'IN_PROGRESS' : 'NOT_STARTED',
      isComplete: isAllocationsComplete,
      items: allocationItems,
    },
    {
      stepNumber: 6,
      id: 'review_completeness',
      title: 'Review & Verification of Onboarding Completeness',
      description: 'Comprehensive audit review of all institutional configuration prerequisites.',
      status: isReviewComplete ? 'COMPLETED' : prerequisitesMet ? 'IN_PROGRESS' : 'NOT_STARTED',
      isComplete: isReviewComplete,
      items: reviewItems,
    },
    {
      stepNumber: 7,
      id: 'operational_readiness',
      title: 'Institutional Readiness & Operational Gate',
      description: 'Final institutional readiness state; distinguishes onboarding from operational launch.',
      status: isOperationalComplete ? 'COMPLETED' : 'NOT_STARTED',
      isComplete: isOperationalComplete,
      items: operationalItems,
    },
  ];

  const completedStepsCount = steps.filter((s) => s.isComplete).length;
  const totalStepsCount = steps.length;
  const completionPercentage = Math.round((completedStepsCount / totalStepsCount) * 100);

  const overallStatus: OnboardingReadinessStatus =
    isReviewComplete && isOperationalComplete ? 'ONBOARDING_READY' : 'ONBOARDING_INCOMPLETE';

  return {
    schoolId: school.id,
    schoolCode: school.code,
    schoolName: school.name,
    organizationId: school.organization_id,
    organizationName: school.org_name,
    organizationCode: school.org_code,
    overallStatus,
    operationalLaunchStatus: 'OPERATIONAL_LAUNCH_NOT_AUTHORIZED',
    completionPercentage,
    completedStepsCount,
    totalStepsCount,
    isReadyForVerification: prerequisitesMet,
    lastVerifiedAt,
    lastVerifiedBy,
    steps,
    institutionalProfile: {
      name: school.name,
      code: school.code,
      lga: school.lga,
      senatorialZone: school.senatorial_zone,
      category: school.category,
      phone: school.phone,
      email: school.email,
      address: school.address,
      establishedYear: school.established_year,
      isActive: school.is_active,
    },
    authoritativeLeadership: {
      principal: principalStaffDisplay ? `${principalStaffDisplay} (From staff registry)` : 'Unassigned',
      principalUserId: principalRecord?.user_id || null,
      principalStaffId: principalRecord?.staff_id || null,
      teachingStaffCount,
      totalStaffCount,
    },
    metrics: {
      teachingStaffCount,
      nonTeachingStaffCount,
      totalStaffCount,
      classesCount,
      allocationsCount: activeTermAllocationsCount,
      studentsCount,
    },
    declarations: {
      liveProductionDatabase: 'NOT_YET_PROVISIONED',
      realSchoolData: 'NOT_YET_LOADED',
      realStudentData: 'NOT_YET_LOADED',
      operationalLaunchAuthorized: false,
    },
  };
}

/**
 * Updates institutional profile fields for a school with strict server validation and tenant isolation.
 */
export async function updateSchoolProfile(
  schoolId: string,
  rawUpdates: SchoolProfileUpdates,
  caller: AuthenticatedCaller,
  client?: PoolClient
): Promise<SchoolOnboardingStatusReport> {
  assertCallerSchoolAuthority(schoolId, caller, 'update school institutional profile', 'schools.manage');

  const clean = validateProfileUpdates(rawUpdates);

  const executeUpdate = async (txClient: PoolClient) => {
    // Check school exists
    const existingRes = await txClient.query<{ id: string; organization_id: string; code: string; name: string }>(
      'SELECT id, organization_id, code, name FROM schools WHERE id = $1 LIMIT 1;',
      [schoolId]
    );
    const existing = existingRes.rows[0];
    if (!existing) {
      throw new OnboardingError('SCHOOL_NOT_FOUND', `School with ID '${schoolId}' does not exist.`, 404);
    }

    const setClauses: string[] = ['updated_at = NOW()'];
    const params: any[] = [schoolId];

    if (clean.name !== undefined) {
      params.push(clean.name);
      setClauses.push(`name = $${params.length}`);
    }
    if (clean.lga !== undefined) {
      params.push(clean.lga);
      setClauses.push(`lga = $${params.length}`);
    }
    if (clean.senatorialZone !== undefined) {
      params.push(clean.senatorialZone);
      setClauses.push(`senatorial_zone = $${params.length}`);
    }
    if (clean.category !== undefined) {
      params.push(clean.category);
      setClauses.push(`category = $${params.length}`);
    }
    if (clean.email !== undefined) {
      params.push(clean.email);
      setClauses.push(`email = $${params.length}`);
    }
    if (clean.phone !== undefined) {
      params.push(clean.phone);
      setClauses.push(`phone = $${params.length}`);
    }
    if (clean.address !== undefined) {
      params.push(clean.address);
      setClauses.push(`address = $${params.length}`);
    }
    if (clean.establishedYear !== undefined) {
      params.push(clean.establishedYear);
      setClauses.push(`established_year = $${params.length}`);
    }

    const sql = `
      UPDATE schools
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;
    await txClient.query(sql, params);

    // Audit log
    await logAuthEvent(
      {
        userId: caller.user?.id || null,
        email: caller.user?.email || null,
        action: 'SCHOOL_PROFILE_UPDATED',
        status: 'SUCCESS',
        ipAddress: caller.ipAddress,
        userAgent: caller.userAgent,
        details: {
          schoolId,
          organizationId: existing.organization_id,
          updatedFields: Object.keys(clean),
        },
      },
      txClient
    );
  };

  if (client) {
    await executeUpdate(client);
  } else {
    await runOnboardingTransaction(executeUpdate);
  }

  return getSchoolOnboardingStatus(schoolId, caller, client);
}

/**
 * Formally verifies and signs off on onboarding completeness for an authoritative school in PostgreSQL.
 * Fails closed if any prerequisite is unsatisfied.
 */
export async function verifySchoolOnboarding(
  schoolId: string,
  caller: AuthenticatedCaller,
  client?: PoolClient
): Promise<SchoolOnboardingStatusReport> {
  assertCallerSchoolAuthority(schoolId, caller, 'verify onboarding completeness', 'schools.manage');

  // 1. Evaluate current state before entering transaction to determine readiness
  const initialCheck = await getSchoolOnboardingStatus(schoolId, caller, client);

  // 2. Fail closed if not ready for verification and persist durable audit log
  if (!initialCheck.isReadyForVerification) {
    const missingSteps = initialCheck.steps
      .filter((s) => !s.isComplete && s.id !== 'review_completeness' && s.id !== 'operational_readiness')
      .map((s) => s.title);

    // Durably record verification rejection in auth_audit_logs
    await logAuthEvent(
      {
        userId: caller.user?.id || null,
        email: caller.user?.email || null,
        action: 'SCHOOL_ONBOARDING_VERIFICATION_REJECTED',
        status: 'BLOCKED',
        ipAddress: caller.ipAddress,
        userAgent: caller.userAgent,
        details: {
          schoolId,
          organizationId: initialCheck.organizationId,
          missingSteps,
        },
      },
      client
    );

    throw new OnboardingError(
      'ONBOARDING_INCOMPLETE',
      `Cannot verify onboarding: mandatory prerequisites are incomplete. Incomplete sections: ${missingSteps.join(', ')}`,
      400,
      { missingSteps, completionPercentage: initialCheck.completionPercentage }
    );
  }

  const executeVerify = async (txClient: PoolClient): Promise<SchoolOnboardingStatusReport> => {
    // Re-verify under transaction lock
    const report = await getSchoolOnboardingStatus(schoolId, caller, txClient);

    if (!report.isReadyForVerification) {
      const missingSteps = report.steps
        .filter((s) => !s.isComplete && s.id !== 'review_completeness' && s.id !== 'operational_readiness')
        .map((s) => s.title);

      throw new OnboardingError(
        'ONBOARDING_INCOMPLETE',
        `Cannot verify onboarding: mandatory prerequisites are incomplete. Incomplete sections: ${missingSteps.join(', ')}`,
        400,
        { missingSteps, completionPercentage: report.completionPercentage }
      );
    }

    // 3. Record verified sign-off audit log
    await logAuthEvent(
      {
        userId: caller.user?.id || null,
        email: caller.user?.email || null,
        action: 'SCHOOL_ONBOARDING_VERIFIED',
        status: 'SUCCESS',
        ipAddress: caller.ipAddress,
        userAgent: caller.userAgent,
        details: {
          schoolId,
          organizationId: report.organizationId,
          schoolCode: report.schoolCode,
          schoolName: report.schoolName,
          status: 'ONBOARDING_READY',
          operationalLaunchStatus: 'OPERATIONAL_LAUNCH_NOT_AUTHORIZED',
          completionPercentage: 100,
          verifiedByRole: caller.user?.role || 'admin',
        },
      },
      txClient
    );

    // Re-query to return refreshed verified report
    return getSchoolOnboardingStatus(schoolId, caller, txClient);
  };

  if (client) {
    return executeVerify(client);
  }
  return runOnboardingTransaction(executeVerify);
}
