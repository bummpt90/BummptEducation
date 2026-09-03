/**
 * BummptEducation — Database Layer Types & Context Definitions
 * 
 * Defines standardized TypeScript interfaces for database querying,
 * multi-tenant isolation, pagination, transactions, and diagnostics.
 */

import type { PoolClient, QueryResultRow } from 'pg';

/**
 * Multi-Tenant security context passed from authenticated requests.
 * Used by repositories to enforce school-level data boundary isolation.
 */
export interface TenantContext {
  schoolId?: string;
  userId?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

/**
 * Standard query options supported by repositories.
 */
export interface QueryOptions {
  /** Optional transaction client for atomic operations */
  client?: PoolClient;
  /** Multi-tenant context for automatic school boundary filtering */
  tenantContext?: TenantContext;
  /** Maximum number of records to return */
  limit?: number;
  /** Number of records to skip (for pagination) */
  offset?: number;
  /** Ordering column and direction (e.g. 'created_at DESC') */
  orderBy?: string;
}

/**
 * Standard paginated database result structure.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Database health check status report.
 */
export interface DatabaseHealthStatus {
  status: 'connected' | 'unconfigured' | 'error';
  database: string;
  configured: boolean;
  latencyMs?: number;
  serverVersion?: string;
  poolSize?: number;
  error?: string;
}

/**
 * Generic database entity with UUID primary key and audit timestamps.
 */
export interface BaseDbEntity extends QueryResultRow {
  id: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Core User entity representation in PostgreSQL
 */
export interface UserDbEntity extends BaseDbEntity {
  school_id: string | null;
  email: string;
  phone: string | null;
  password_hash: string;
  full_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  failed_login_attempts: number;
  locked_until: Date | string | null;
  last_login_at: Date | string | null;
  password_changed_at: Date | string | null;
  reset_password_token?: string | null;
  reset_password_expires_at?: Date | string | null;
}

/**
 * Server-side User Session representation in PostgreSQL
 */
export interface UserSessionDbEntity extends BaseDbEntity {
  user_id: string;
  token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date | string;
  revoked_at: Date | string | null;
}

/**
 * Identity & Authentication Audit Log entry in PostgreSQL
 */
export interface AuthAuditLogDbEntity extends QueryResultRow {
  id: string;
  user_id: string | null;
  email: string | null;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, any> | null;
  created_at: Date | string;
}

/**
 * School Entity in PostgreSQL
 */
export interface SchoolDbEntity extends BaseDbEntity {
  organization_id: string;
  code: string;
  name: string;
  lga: string;
  senatorial_zone: string;
  category: string;
  principal_name?: string | null;
  bursar_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active: boolean;
  established_year?: number | null;
  vice_principal_academic?: string | null;
}

/**
 * Class Entity in PostgreSQL
 */
export interface ClassDbEntity extends BaseDbEntity {
  school_id: string;
  level: string;
  arm: 'kindergarten' | 'primary' | 'secondary';
  name: string;
  category: string;
  classroom_block?: string | null;
  capacity?: number;
  form_master_id?: string | null;
}

/**
 * Staff Entity in PostgreSQL
 */
export interface StaffDbEntity extends BaseDbEntity {
  user_id: string | null;
  organization_id: string | null;
  school_id: string;
  staff_id_number: string;
  first_name?: string | null;
  middle_name?: string | null;
  surname?: string | null;
  full_name: string;
  staff_type: 'Teaching' | 'Non-Teaching';
  department_id?: string | null;
  arm: string;
  designation: string;
  role: string;
  assigned_class_id?: string | null;
  qualifications?: string | null;
  trcn_number?: string | null;
  status: 'Active' | 'On Leave' | 'Resigned' | 'Suspended';
  is_active: boolean;
  date_joined?: Date | string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Student Entity in PostgreSQL
 */
export interface StudentDbEntity extends BaseDbEntity {
  organization_id: string | null;
  school_id: string;
  admission_number: string;
  first_name?: string | null;
  middle_name?: string | null;
  surname?: string | null;
  full_name: string;
  gender: 'Male' | 'Female';
  date_of_birth: Date | string;
  current_class_id: string;
  current_academic_session_id?: string | null;
  current_academic_term_id?: string | null;
  arm: 'kindergarten' | 'primary' | 'secondary';
  house?: string | null;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string | null;
  address?: string | null;
  state_of_origin?: string | null;
  date_enrolled: Date | string;
  status: 'Active' | 'Admitted' | 'Graduated' | 'Withdrawn' | 'Transferred' | 'Suspended';
  is_prefect?: boolean;
  prefect_role?: string | null;
  avatar_url?: string | null;
}

/**
 * Student Enrollment Entity in PostgreSQL
 */
export interface StudentEnrollmentDbEntity extends BaseDbEntity {
  organization_id: string;
  school_id: string;
  student_id: string;
  academic_session_id: string;
  academic_term_id?: string | null;
  class_id: string;
  enrollment_date: Date | string;
  start_date: Date | string;
  end_date?: Date | string | null;
  status: 'Active' | 'Enrolled' | 'Promoted' | 'Repeated' | 'Withdrawn' | 'Transferred' | 'Graduated';
  remarks?: string | null;
}

/**
 * Subject Entity in PostgreSQL
 */
export interface SubjectDbEntity extends BaseDbEntity {
  name: string;
  code: string;
  category: 'sciences' | 'arts' | 'commercial' | 'general' | 'vocational' | 'languages';
  arm: 'kindergarten' | 'primary' | 'secondary' | 'all';
  description?: string | null;
  is_active: boolean;
}

/**
 * Class-Subject Allocation Entity in PostgreSQL
 */
export interface ClassSubjectAllocationDbEntity extends BaseDbEntity {
  school_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  academic_session_id?: string | null;
  academic_term_id?: string | null;
  periods_per_week: number;
  class_name?: string;
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string;
  teacher_staff_id?: string;
  term_name?: string;
  session_name?: string;
}

/**
 * Daily Attendance Entity in PostgreSQL
 */
export interface DailyAttendanceDbEntity extends BaseDbEntity {
  school_id: string;
  student_id: string;
  class_id: string;
  academic_session_id?: string | null;
  term_id: string;
  attendance_date: string | Date;
  day_number_in_term?: number | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | string;
  arrival_time?: string | null;
  reason?: string | null;
  note?: string | null;
  marked_by_staff_id?: string | null;
  marked_by_user_id?: string | null;
  marked_at?: Date | string;
  student_name?: string;
  admission_number?: string;
  class_name?: string;
}

/**
 * Continuous Assessment Entity in PostgreSQL (Granular 40% component)
 */
export interface ContinuousAssessmentDbEntity extends BaseDbEntity {
  school_id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  academic_session_id: string;
  academic_term_id: string;
  assessment_type: string; // 'CA1', 'CA2', 'ASSIGNMENT', 'PROJECT', etc.
  score: number;
  max_score: number;
  weight_percentage?: number;
  recorded_by_user_id?: string | null;
  recorded_by_staff_id?: string | null;
  student_name?: string;
  admission_number?: string;
  subject_name?: string;
  subject_code?: string;
  class_name?: string;
}

/**
 * Terminal Examination Entity in PostgreSQL (Granular 60% component)
 */
export interface TerminalExaminationDbEntity extends BaseDbEntity {
  school_id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  academic_session_id: string;
  academic_term_id: string;
  score: number;
  max_score: number;
  exam_date?: string | Date | null;
  recorded_by_user_id?: string | null;
  recorded_by_staff_id?: string | null;
  student_name?: string;
  admission_number?: string;
  subject_name?: string;
  subject_code?: string;
  class_name?: string;
}

/**
 * Composite Assessment Score Entity in PostgreSQL
 */
export interface AssessmentScoreDbEntity extends BaseDbEntity {
  school_id: string;
  student_id: string;
  class_id: string;
  subject_id: string;
  term_id: string;
  academic_session_id?: string | null;
  ca1_score?: number | null;
  ca2_score?: number | null;
  assignment_score?: number | null;
  attendance_score?: number | null;
  total_ca: number;
  exam_score?: number | null;
  total_score: number;
  grade?: string | null;
  remark?: string | null;
  is_submitted?: boolean;
  is_approved?: boolean;
}

/**
 * Admissions Application Entity in PostgreSQL
 */
export interface AdmissionApplicationDbEntity extends BaseDbEntity {
  school_id: string;
  application_number: string;
  student_name: string;
  applied_class: string;
  arm: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string | null;
  previous_school?: string | null;
  developmental_readiness_score?: number | null;
  immunization_completed?: boolean;
  toilet_trained?: boolean;
  entrance_exam_score?: number | null;
  interview_score?: number | null;
  status: string;
  submitted_date: string | Date;
  academic_session_id?: string | null;
  class_id?: string | null;
  admission_number?: string | null;
  decision?: string | null;
  decision_notes?: string | null;
  decision_date?: Date | string | null;
  student_id?: string | null;
  created_by?: string | null;
  reviewed_by?: string | null;
  school_name?: string;
  class_name?: string;
  session_name?: string;
}

/**
 * Fee Category Entity in PostgreSQL
 */
export interface FeeCategoryDbEntity extends BaseDbEntity {
  name: string;
  description?: string | null;
  is_active: boolean;
}

/**
 * Fee Structure Entity in PostgreSQL (School-scoped schedule item)
 */
export interface FeeStructureDbEntity extends BaseDbEntity {
  school_id: string;
  academic_session_id: string;
  academic_term_id: string;
  class_id: string;
  category_id: string;
  name: string;
  amount: number | string;
  is_mandatory: boolean;
  effective_date: string | Date;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  created_by?: string | null;
  category_name?: string;
  class_name?: string;
  session_name?: string;
  term_name?: string;
}

/**
 * Student Fee Assessment Entity in PostgreSQL (Individual student charges)
 */
export interface StudentFeeAssessmentDbEntity extends BaseDbEntity {
  school_id: string;
  student_id: string;
  academic_session_id: string;
  academic_term_id: string;
  class_id: string;
  fee_structure_id?: string | null;
  category_id: string;
  amount: number | string;
  due_date?: string | Date | null;
  status: 'PENDING' | 'INVOICED' | 'PAID' | 'PARTIALLY_PAID' | 'WAIVED' | 'CANCELLED';
  created_by?: string | null;
  student_name?: string;
  admission_number?: string;
  category_name?: string;
  class_name?: string;
}

/**
 * Fee Invoice Entity in PostgreSQL
 */
export interface FeeInvoiceDbEntity extends BaseDbEntity {
  invoice_number: string;
  school_id: string;
  student_id: string;
  term_id: string;
  academic_session_id?: string | null;
  class_id?: string | null;
  total_billed: number | string;
  amount_paid: number | string;
  balance: number | string;
  status: 'Fully Paid' | 'Partial' | 'Unpaid' | 'Overdue' | 'Cancelled' | 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | 'CANCELLED' | 'FULLY PAID' | 'PARTIALLY PAID';
  issue_date: string | Date;
  due_date?: string | Date | null;
  created_by?: string | null;
  student_name?: string;
  admission_number?: string;
  school_name?: string;
  term_name?: string;
  session_name?: string;
  items?: FeeInvoiceItemDbEntity[];
}

/**
 * Fee Invoice Item Entity in PostgreSQL
 */
export interface FeeInvoiceItemDbEntity extends BaseDbEntity {
  invoice_id: string;
  category_id?: string | null;
  fee_structure_id?: string | null;
  assessment_id?: string | null;
  name: string;
  amount: number | string;
  category_name?: string;
}

/**
 * Fee Payment Entity in PostgreSQL
 */
export interface FeePaymentDbEntity extends BaseDbEntity {
  school_id: string;
  receipt_number: string;
  payment_reference?: string | null;
  student_id: string;
  invoice_id?: string | null;
  term_id: string;
  academic_session_id?: string | null;
  class_level?: string | null;
  arm?: string | null;
  amount_paid: number | string;
  total_billed: number | string;
  balance: number | string;
  payment_date: string | Date;
  payment_method?: string | null;
  bank_reference?: string | null;
  status: string;
  payment_status?: string | null;
  collected_by?: string | null;
  recorded_by_user_id?: string | null;
  student_name?: string;
  admission_number?: string;
  school_name?: string;
}

/**
 * Bursary & Scholarship Award Entity in PostgreSQL
 */
export interface BursaryAwardDbEntity extends BaseDbEntity {
  school_id: string;
  student_id: string;
  academic_session_id: string;
  academic_term_id: string;
  award_type: string;
  award_amount: number | string;
  percentage?: number | string | null;
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string;
  invoice_id?: string | null;
  approved_by?: string | null;
  approval_date?: string | Date | null;
  created_by?: string | null;
  student_name?: string;
  admission_number?: string;
  approver_name?: string;
}

/**
 * Financial Audit Log Entity in PostgreSQL
 */
export interface FinancialAuditLogDbEntity extends QueryResultRow {
  id: string;
  school_id?: string | null;
  user_id?: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  amount?: number | string | null;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string | Date;
  user_name?: string;
  school_name?: string;
}

/**
 * Real-time Student Balance Computation Report
 */
export interface StudentBalanceReport {
  student_id: string;
  school_id: string;
  student_name: string;
  admission_number: string;
  total_invoiced: number;
  total_paid: number;
  total_bursary_awarded: number;
  net_outstanding_balance: number;
  invoices_count: number;
  payments_count: number;
  bursaries_count: number;
  is_cleared_for_exam: boolean;
}

/**
 * Controlled User Account Request Entity in PostgreSQL
 */
export interface UserAccountRequestDbEntity extends BaseDbEntity {
  organization_id: string;
  requested_school_id: string | null;
  first_name: string;
  middle_name?: string | null;
  surname: string;
  email: string;
  phone?: string | null;
  requested_role: string;
  password_hash: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewed_by?: string | null;
  reviewed_at?: string | Date | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  // Joined fields
  school_name?: string | null;
  reviewer_name?: string | null;
}



