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
import type { SafeUser } from './types';

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
    principalName: string | null;
    bursarName: string | null;
    vicePrincipalAcademic: string | null;
    isActive: boolean;
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
  principalName?: string | null;
  bursarName?: string | null;
  vicePrincipalAcademic?: string | null;
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
 */
export function assertCallerSchoolAuthority(
  schoolId: string,
  caller: AuthenticatedCaller,
  actionDescription = 'access school onboarding'
): void {
  const user = caller.user;
  if (!user) {
    throw new OnboardingError('UNAUTHENTICATED', 'Authentication required.', 401);
  }

  // Super Admin and State Officer possess multi-school state-wide authority
  if (user.isSuperAdmin || user.role === 'super_admin' || user.isStateOfficer || user.role === 'state_officer') {
    return;
  }

  // School-scoped users (Principal, Vice Principal, Headmistress) can only manage their own school
  if (!user.schoolId || user.schoolId !== schoolId) {
    throw new OnboardingError(
      'TENANT_ISOLATION_VIOLATION',
      `Access denied: You are not authorized to ${actionDescription} for another school.`,
      403
    );
  }
}

/**
 * Normalizes and validates school profile updates.
 */
function validateProfileUpdates(updates: SchoolProfileUpdates): SchoolProfileUpdates {
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

  if (updates.principalName !== undefined) {
    clean.principalName = updates.principalName ? updates.principalName.trim() : null;
  }
  if (updates.vicePrincipalAcademic !== undefined) {
    clean.vicePrincipalAcademic = updates.vicePrincipalAcademic ? updates.vicePrincipalAcademic.trim() : null;
  }
  if (updates.bursarName !== undefined) {
    clean.bursarName = updates.bursarName ? updates.bursarName.trim() : null;
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
  assertCallerSchoolAuthority(schoolId, caller, 'retrieve onboarding checklist');

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
  const staffRes = await query<{
    staff_count: string;
    teaching_staff_count: string;
    non_teaching_staff_count: string;
    active_principal_count: string;
    principal_full_name: string | null;
    principal_user_email: string | null;
  }>(
    `SELECT 
       COUNT(*)::text AS staff_count,
       COUNT(*) FILTER (WHERE staff_type = 'Teaching')::text AS teaching_staff_count,
       COUNT(*) FILTER (WHERE staff_type = 'Non-Teaching')::text AS non_teaching_staff_count,
       COUNT(*) FILTER (WHERE LOWER(role) = 'principal' AND is_active = TRUE)::text AS active_principal_count,
       (SELECT full_name FROM staff WHERE school_id = $1 AND LOWER(role) = 'principal' AND is_active = TRUE LIMIT 1) AS principal_full_name,
       (SELECT u.email FROM users u INNER JOIN staff st ON st.user_id = u.id WHERE st.school_id = $1 AND LOWER(st.role) = 'principal' AND st.is_active = TRUE LIMIT 1) AS principal_user_email
     FROM staff
     WHERE school_id = $1 AND is_active = TRUE;`,
    [schoolId],
    client
  );

  const staffStats = staffRes.rows[0] || {
    staff_count: '0',
    teaching_staff_count: '0',
    non_teaching_staff_count: '0',
    active_principal_count: '0',
    principal_full_name: null,
    principal_user_email: null,
  };

  const totalStaffCount = parseInt(staffStats.staff_count, 10) || 0;
  const teachingStaffCount = parseInt(staffStats.teaching_staff_count, 10) || 0;
  const nonTeachingStaffCount = parseInt(staffStats.non_teaching_staff_count, 10) || 0;
  const activePrincipalCount = parseInt(staffStats.active_principal_count, 10) || 0;

  // 3. Fetch Academic Calendar State
  const calendarRes = await query<{
    current_session_id: string | null;
    current_session_name: string | null;
    current_term_id: string | null;
    current_term_name: string | null;
    resumption_date: string | null;
    vacation_date: string | null;
  }>(
    `SELECT 
       s.id AS current_session_id,
       s.session_name AS current_session_name,
       t.id AS current_term_id,
       t.term_name AS current_term_name,
       t.resumption_date::text AS resumption_date,
       t.vacation_date::text AS vacation_date
     FROM academic_sessions s
     LEFT JOIN academic_terms t ON t.session_id = s.id AND t.is_current = TRUE
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
  };

  // 4. Fetch Classes & Subjects State
  const classesRes = await query<{ class_count: string; classes_with_form_master: string }>(
    `SELECT 
       COUNT(*)::text AS class_count,
       COUNT(*) FILTER (WHERE form_master_id IS NOT NULL)::text AS classes_with_form_master
     FROM classes
     WHERE school_id = $1;`,
    [schoolId],
    client
  );
  const classesCount = parseInt(classesRes.rows[0]?.class_count || '0', 10);
  const formMastersCount = parseInt(classesRes.rows[0]?.classes_with_form_master || '0', 10);

  const subjectsRes = await query<{ subject_count: string }>(
    'SELECT COUNT(*)::text AS subject_count FROM subjects;',
    [],
    client
  );
  const stateSubjectsCount = parseInt(subjectsRes.rows[0]?.subject_count || '0', 10);

  // 5. Fetch Class-Subject Allocations State
  const allocationsRes = await query<{
    allocation_count: string;
    allocations_with_teachers: string;
  }>(
    `SELECT 
       COUNT(*)::text AS allocation_count,
       COUNT(*) FILTER (WHERE teacher_id IS NOT NULL)::text AS allocations_with_teachers
     FROM class_subject_allocations
     WHERE school_id = $1;`,
    [schoolId],
    client
  );
  const allocationsCount = parseInt(allocationsRes.rows[0]?.allocation_count || '0', 10);
  const allocationsWithTeachers = parseInt(allocationsRes.rows[0]?.allocations_with_teachers || '0', 10);

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
      value: staffStats.principal_user_email || null,
      required: true,
    },
    {
      id: 'leadership_principal_staff',
      label: 'Linked Principal Staff Record',
      description: 'Relational staff registry entry linked to the principal user account',
      isComplete: Boolean(staffStats.principal_full_name),
      value: staffStats.principal_full_name,
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
      description: 'Active statutory term (e.g. 1st Term, 2nd Term, 3rd Term)',
      isComplete: Boolean(calendar.current_term_id),
      value: calendar.current_term_name,
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
      label: 'Class-Subject Allocations',
      description: 'Subject allocations assigned to school classes',
      isComplete: allocationsCount > 0,
      value: `${allocationsCount} Allocations configured`,
      required: true,
      details: { allocationsCount },
    },
    {
      id: 'allocations_teachers_assigned',
      label: 'Teacher Responsibility Assignments',
      description: 'Allocations have qualified teaching staff assigned',
      isComplete: allocationsWithTeachers > 0,
      value: `${allocationsWithTeachers} Allocations assigned to teachers`,
      required: true,
      details: { allocationsWithTeachers, allocationsCount },
    },
    {
      id: 'allocations_form_master',
      label: 'Class Form Master Linkage',
      description: 'Form masters assigned to oversee classes',
      isComplete: formMastersCount > 0 || classesCount === 0,
      value: `${formMastersCount} Classes have assigned form masters`,
      required: false,
    },
  ];
  const isAllocationsComplete = allocationItems.filter((i) => i.required).every((item) => item.isComplete);

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
      description: 'Allocate curriculum subjects to classes and assign responsible teaching staff.',
      status: isAllocationsComplete ? 'COMPLETED' : allocationsCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
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
      principalName: school.principal_name,
      bursarName: school.bursar_name,
      vicePrincipalAcademic: school.vice_principal_academic,
      isActive: school.is_active,
    },
    metrics: {
      teachingStaffCount,
      nonTeachingStaffCount,
      totalStaffCount,
      classesCount,
      allocationsCount,
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
  assertCallerSchoolAuthority(schoolId, caller, 'update school institutional profile');

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
    if (clean.principalName !== undefined) {
      params.push(clean.principalName);
      setClauses.push(`principal_name = $${params.length}`);
    }
    if (clean.vicePrincipalAcademic !== undefined) {
      params.push(clean.vicePrincipalAcademic);
      setClauses.push(`vice_principal_academic = $${params.length}`);
    }
    if (clean.bursarName !== undefined) {
      params.push(clean.bursarName);
      setClauses.push(`bursar_name = $${params.length}`);
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
        userId: caller.user.id,
        email: caller.user.email,
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
 * Initializes canonical institutional class and curriculum structure for a school in PostgreSQL.
 * Used during onboarding to establish standard classroom grades (e.g. JS1–SS3 or Pri 1–6).
 */
export async function initializeSchoolAcademicStructure(
  schoolId: string,
  options: {
    tier?: 'Secondary' | 'Primary' | 'Basic Education';
  } = {},
  caller: AuthenticatedCaller,
  client?: PoolClient
): Promise<{ classesCreated: number; allocationsCreated: number }> {
  assertCallerSchoolAuthority(schoolId, caller, 'initialize school academic structure');

  const executeInit = async (txClient: PoolClient) => {
    const schoolRes = await txClient.query<{ id: string; organization_id: string; category: string }>(
      'SELECT id, organization_id, category FROM schools WHERE id = $1 LIMIT 1;',
      [schoolId]
    );
    const school = schoolRes.rows[0];
    if (!school) {
      throw new OnboardingError('SCHOOL_NOT_FOUND', `School with ID '${schoolId}' does not exist.`, 404);
    }

    const category = options.tier || school.category || 'Secondary';
    const isPrimary = category.toLowerCase().includes('primary');

    // Canonical classes to establish
    const canonicalClasses = isPrimary
      ? [
          { level: 'Basic 1', arm: 'primary', name: 'Primary 1 Gold', category: 'General' },
          { level: 'Basic 2', arm: 'primary', name: 'Primary 2 Gold', category: 'General' },
          { level: 'Basic 3', arm: 'primary', name: 'Primary 3 Gold', category: 'General' },
          { level: 'Basic 4', arm: 'primary', name: 'Primary 4 Gold', category: 'General' },
          { level: 'Basic 5', arm: 'primary', name: 'Primary 5 Gold', category: 'General' },
          { level: 'Basic 6', arm: 'primary', name: 'Primary 6 Gold', category: 'General' },
        ]
      : [
          { level: 'JSS 1', arm: 'secondary', name: 'JSS 1 Alpha', category: 'General' },
          { level: 'JSS 2', arm: 'secondary', name: 'JSS 2 Alpha', category: 'General' },
          { level: 'JSS 3', arm: 'secondary', name: 'JSS 3 Alpha', category: 'General' },
          { level: 'SSS 1', arm: 'secondary', name: 'SSS 1 Science', category: 'Science' },
          { level: 'SSS 2', arm: 'secondary', name: 'SSS 2 Science', category: 'Science' },
          { level: 'SSS 3', arm: 'secondary', name: 'SSS 3 Science', category: 'Science' },
        ];

    let classesCreated = 0;
    const createdClassIds: string[] = [];

    // Assign principal as temporary form master if exists
    const principalStaffRes = await txClient.query<{ id: string }>(
      "SELECT id FROM staff WHERE school_id = $1 AND LOWER(role) = 'principal' AND is_active = TRUE LIMIT 1;",
      [schoolId]
    );
    const formMasterId = principalStaffRes.rows[0]?.id || null;

    for (const c of canonicalClasses) {
      const inserted = await txClient.query<{ id: string }>(
        `INSERT INTO classes (school_id, level, arm, name, category, capacity, form_master_id)
         VALUES ($1, $2, $3, $4, $5, 40, $6)
         ON CONFLICT (school_id, level, name) DO NOTHING
         RETURNING id;`,
        [schoolId, c.level, c.arm, c.name, c.category, formMasterId]
      );
      if (inserted.rows[0]) {
        classesCreated++;
        createdClassIds.push(inserted.rows[0].id);
      }
    }

    // Allocate core subjects if current session & term exist
    let allocationsCreated = 0;
    const termRes = await txClient.query<{ session_id: string; term_id: string }>(
      `SELECT s.id AS session_id, t.id AS term_id
       FROM academic_sessions s
       INNER JOIN academic_terms t ON t.session_id = s.id
       WHERE s.is_current = TRUE
       LIMIT 1;`
    );

    if (termRes.rows[0] && formMasterId) {
      const { session_id, term_id } = termRes.rows[0];

      // Fetch top 3 subjects
      const subjectsRes = await txClient.query<{ id: string }>(
        'SELECT id FROM subjects ORDER BY code ASC LIMIT 3;'
      );

      // Fetch all classes of the school
      const schoolClasses = await txClient.query<{ id: string }>(
        'SELECT id FROM classes WHERE school_id = $1 LIMIT 6;',
        [schoolId]
      );

      for (const cls of schoolClasses.rows) {
        for (const subj of subjectsRes.rows) {
          const allocRes = await txClient.query(
            `INSERT INTO class_subject_allocations (
               school_id, class_id, subject_id, teacher_id, academic_session_id, academic_term_id, periods_per_week
             ) VALUES ($1, $2, $3, $4, $5, $6, 4)
             ON CONFLICT (class_id, subject_id, academic_term_id) DO NOTHING
             RETURNING id;`,
            [schoolId, cls.id, subj.id, formMasterId, session_id, term_id]
          );
          if (allocRes.rowCount && allocRes.rowCount > 0) {
            allocationsCreated++;
          }
        }
      }
    }

    await logAuthEvent(
      {
        userId: caller.user.id,
        email: caller.user.email,
        action: 'SCHOOL_ACADEMIC_STRUCTURE_INITIALIZED',
        status: 'SUCCESS',
        ipAddress: caller.ipAddress,
        userAgent: caller.userAgent,
        details: {
          schoolId,
          organizationId: school.organization_id,
          classesCreated,
          allocationsCreated,
        },
      },
      txClient
    );

    return { classesCreated, allocationsCreated };
  };

  if (client) {
    return executeInit(client);
  }
  return runOnboardingTransaction(executeInit);
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
  assertCallerSchoolAuthority(schoolId, caller, 'verify onboarding completeness');

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
