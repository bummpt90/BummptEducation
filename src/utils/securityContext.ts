import { SchoolArm, ClassLevel, Term, AcademicYear, UserRole } from '../types';

export type RestrictedWing = 'academic' | 'bursary' | 'admin' | 'benue_moe' | 'all';

export interface IssuedPasskey {
  id: string;
  passkey: string;
  staffId: string;
  staffName: string;
  role: string;
  wing: RestrictedWing;
  arm: SchoolArm | 'All';
  assignedClass?: ClassLevel;
  issuedBy: string;
  issuingOffice: string;
  issuedDate: string;
  expiresAt: string;
  status: 'Active' | 'Revoked' | 'Suspended';
  notes?: string;
  permissions: string[];
}

export interface ParentAccessRecord {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  parentPin: string;
  academicYear: AcademicYear;
  term: Term;
  isUploadedForDownload: boolean;
  uploadedAt?: string;
  uploadedBy?: string;
  downloadCount: number;
}

export interface SecuritySession {
  isAcademicUnlocked: boolean;
  isBursaryUnlocked: boolean;
  isAdminUnlocked: boolean;
  isBenueHQUnlocked?: boolean;
  authenticatedStaff?: {
    name: string;
    role: string;
    staffId: string;
    wing: RestrictedWing;
    passkeyUsed: string;
  };
}

const STORAGE_KEY_PASSKEYS = 'bummpt_issued_passkeys_v1';
const STORAGE_KEY_SESSION = 'bummpt_security_session_v1';
const STORAGE_KEY_PARENT_ACCESS = 'bummpt_parent_report_access_v1';
const STORAGE_KEY_GLOBAL_PUBLISH = 'bummpt_report_cards_published_status_v1';

// Default Master & Departmental Passkeys
export const DEFAULT_DEPARTMENT_PASSKEYS = {
  MASTER: 'PRINCIPAL999',
  ACADEMIC: 'ACADEMIC2026',
  BURSARY: 'BURSARY2026',
  ADMIN: 'ADMIN2026',
  TEACHER: 'TEACHER2026',
  EXAM_OFFICER: 'EXAM2026',
  EARLY_YEARS: 'MONTESSORI2026',
  PRIMARY: 'BASIC2026',
  BENUE_MOE: 'BENUEMOE2026',
  COMMISSIONER: 'COMMISSIONER999',
  SUBEB: 'SUBEB2026',
  PERMSEC: 'PERMSEC2026',
  QUALITY_ASSURANCE: 'QA2026',
  INSPECTOR: 'INSPECTOR2026',
};

// Initial Seed of Issued Authorization Credentials
export const INITIAL_ISSUED_PASSKEYS: IssuedPasskey[] = [
  {
    id: 'PASS-001',
    passkey: 'PRINCIPAL999',
    staffId: 'STF-000',
    staffName: 'Matthew Ternenge Beeun',
    role: 'Administrator & Executive Director',
    wing: 'all',
    arm: 'All',
    issuedBy: 'Board of Governors / Executive Council',
    issuingOffice: 'Office of the Executive Director',
    issuedDate: '2026-01-05',
    expiresAt: '2027-01-05',
    status: 'Active',
    notes: 'Full institutional super-admin and executive clearance across all wings, financial vaults, and state HQ.',
    permissions: ['all_wings', 'publish_results', 'audit_financials', 'issue_passkeys', 'override_grades', 'hr_control', 'benue_state_command']
  },
  {
    id: 'PASS-MOE-01',
    passkey: 'COMMISSIONER999',
    staffId: 'MOE-EXEC-01',
    staffName: 'Prof. Frederick Ikyaan',
    role: 'Hon. Commissioner for Education, Science & Technology',
    wing: 'benue_moe',
    arm: 'All',
    issuedBy: 'Executive Council of Benue State',
    issuingOffice: 'Cabinet Office, Benue State Government House',
    issuedDate: '2026-01-02',
    expiresAt: '2027-12-31',
    status: 'Active',
    notes: 'Full constitutional oversight across all 23 LGAs, SUBEB basic schools, secondary colleges, and state subvention funds.',
    permissions: ['all_23_lgas', 'approve_subventions', 'publish_state_circulars', 'teacher_deployment', 'governor_briefing']
  },
  {
    id: 'PASS-MOE-02',
    passkey: 'BENUEMOE2026',
    staffId: 'MOE-HQ-02',
    staffName: 'Dr. (Mrs.) Grace Adagba',
    role: 'Executive Chairman, Benue SUBEB',
    wing: 'benue_moe',
    arm: 'All',
    issuedBy: 'Benue State Universal Basic Education Board',
    issuingOffice: 'Headquarters Directorate, Makurdi',
    issuedDate: '2026-01-03',
    expiresAt: '2026-12-31',
    status: 'Active',
    notes: 'Authorized for Primary & Junior Secondary educational telemetry, UBEC grants, and LGEA school operations across 23 LGAs.',
    permissions: ['subeb_oversight', 'basic_education_kpis', 'lga_inspectorate', 'publish_state_circulars']
  },
  {
    id: 'PASS-MOE-03',
    passkey: 'PERMSEC2026',
    staffId: 'MOE-HQ-03',
    staffName: 'Barr. Terlumun Iorfa',
    role: 'Permanent Secretary, Ministry of Education',
    wing: 'benue_moe',
    arm: 'All',
    issuedBy: 'Office of the Head of Service, Benue State',
    issuingOffice: 'Ministry of Education Secretariat, High-Level Makurdi',
    issuedDate: '2026-01-04',
    expiresAt: '2026-12-31',
    status: 'Active',
    notes: 'Statutory accounting officer and administrative clearance across state secondary schools and technical colleges.',
    permissions: ['admin_clearance', 'state_budget_reconciliation', 'teacher_posting', 'audit_signoff']
  },
  {
    id: 'PASS-MOE-04',
    passkey: 'QA2026',
    staffId: 'MOE-QA-04',
    staffName: 'Dr. Simon Tor-Anyiin',
    role: 'Director, Quality Assurance & Standards',
    wing: 'benue_moe',
    arm: 'All',
    issuedBy: 'Benue State Ministry of Education',
    issuingOffice: 'Department of Inspectorate & Quality Assurance',
    issuedDate: '2026-01-05',
    expiresAt: '2026-12-31',
    status: 'Active',
    notes: 'Statewide curriculum compliance, TRCN accreditation audit, and school rating oversight across 23 LGAs.',
    permissions: ['quality_assurance', 'school_accreditation', 'inspection_reports', 'issue_queries']
  },
  {
    id: 'PASS-MOE-05',
    passkey: 'INSPECTOR2026',
    staffId: 'MOE-ZN-05',
    staffName: 'Mr. Emmanuel Agba (Zone B Chief Inspector)',
    role: 'Zonal Chief Inspector of Education (Benue North-West)',
    wing: 'benue_moe',
    arm: 'All',
    issuedBy: 'Directorate of Inspectorate & Field Services',
    issuingOffice: 'Zonal Inspectorate Office, Gboko / Makurdi',
    issuedDate: '2026-01-08',
    expiresAt: '2026-12-31',
    status: 'Active',
    notes: 'Field telemetry inspection and weekly term progress supervision across Zone B government colleges.',
    permissions: ['zonal_inspection', 'school_vetting', 'field_telemetry']
  },
  {
    id: 'PASS-002',
    passkey: 'ACADEMIC2026',
    staffId: 'STF-SEC-01',
    staffName: 'Dr. (Mrs.) Grace Nkechi Okafor',
    role: 'Principal & VP Academic',
    wing: 'academic',
    arm: 'secondary',
    issuedBy: 'Office of the Executive Director',
    issuingOffice: 'Directorate of Academic Planning & Quality Assurance',
    issuedDate: '2026-01-10',
    expiresAt: '2026-12-31',
    status: 'Active',
    notes: 'Authorized to review, moderate, approve, and publish secondary school terminal broadsheets and report cards.',
    permissions: ['view_scoresheet', 'edit_scoresheet', 'view_broadsheet', 'publish_results', 'sign_report_cards']
  },
  {
    id: 'PASS-003',
    passkey: 'EXAM2026',
    staffId: 'STF-SEC-03',
    staffName: 'Mr. Emmanuel Agbo',
    role: 'Senior Exam Officer & Form Tutor (SSS 2 Science)',
    wing: 'academic',
    arm: 'secondary',
    assignedClass: 'SSS 2 Science',
    issuedBy: 'Dr. (Mrs.) Grace Nkechi Okafor',
    issuingOffice: 'Examination & Records Board',
    issuedDate: '2026-01-12',
    expiresAt: '2026-08-31',
    status: 'Active',
    notes: 'Authorized for scoresheet entry, continuous assessment collation, and broadsheet generation.',
    permissions: ['view_scoresheet', 'edit_scoresheet', 'view_broadsheet', 'evaluate_domains']
  },
  {
    id: 'PASS-004',
    passkey: 'MONTESSORI2026',
    staffId: 'STF-EY-01',
    staffName: 'Mrs. Abigail Folashade Balogun',
    role: 'Head of Early Childhood & Kindergarten Wing',
    wing: 'academic',
    arm: 'kindergarten',
    issuedBy: 'Office of the Executive Director',
    issuingOffice: 'Early Childhood Education Board',
    issuedDate: '2026-01-08',
    expiresAt: '2026-12-31',
    status: 'Active',
    notes: 'Academic authorization for Early Years developmental milestone evaluation and progress reports.',
    permissions: ['view_scoresheet', 'edit_scoresheet', 'evaluate_milestones', 'sign_report_cards']
  },
  {
    id: 'PASS-005',
    passkey: 'BASIC2026',
    staffId: 'STF-PRI-01',
    staffName: 'Mrs. Grace Iveren Shima',
    role: 'Headmistress (Primary Basic Education)',
    wing: 'academic',
    arm: 'primary',
    issuedBy: 'Office of the Executive Director',
    issuingOffice: 'Primary Education Directorate',
    issuedDate: '2026-01-08',
    expiresAt: '2026-12-31',
    status: 'Active',
    notes: 'Primary wing academic authorization and Common Entrance preparation records.',
    permissions: ['view_scoresheet', 'edit_scoresheet', 'view_broadsheet', 'sign_report_cards']
  },
  {
    id: 'PASS-006',
    passkey: 'BURSARY2026',
    staffId: 'STF-BUR-01',
    staffName: 'Mr. Patrick Terver Gbilekaa',
    role: 'Chief Bursar & Head of Finance',
    wing: 'bursary',
    arm: 'All',
    issuedBy: 'Office of the Executive Director',
    issuingOffice: 'Bursary & Accounts Directorate',
    issuedDate: '2026-01-06',
    expiresAt: '2026-12-31',
    status: 'Active',
    notes: 'Authorized for school fee billing, receipt issuance, POS reconciliation, and financial auditing.',
    permissions: ['view_fees', 'issue_receipts', 'edit_fee_schedule', 'export_financial_reports']
  },
  {
    id: 'PASS-007',
    passkey: 'ADMIN2026',
    staffId: 'STF-ADM-02',
    staffName: 'Mrs. Bridget Ngunan Tor',
    role: 'Registrar & Human Resources Manager',
    wing: 'admin',
    arm: 'All',
    issuedBy: 'Office of the Executive Director',
    issuingOffice: 'Central Registry & Human Resources',
    issuedDate: '2026-01-06',
    expiresAt: '2026-12-31',
    status: 'Active',
    notes: 'Authorized for student admissions screening, staff recruitment logs, and institutional attendance.',
    permissions: ['view_admissions', 'approve_admissions', 'manage_staff', 'issue_access_passes']
  }
];

// Initial Parent Portal Access Seed
export const INITIAL_PARENT_ACCESS: ParentAccessRecord[] = [
  {
    studentId: 'STU-001',
    admissionNumber: 'BUM/2024/SEC/001',
    studentName: 'Somtochukwu Emeka Okafor',
    parentName: 'Engr. Emeka Okafor',
    parentPhone: '+234 803 123 4567',
    parentPin: 'PAR-8821',
    academicYear: '2025/2026',
    term: '2nd Term',
    isUploadedForDownload: true,
    uploadedAt: '2026-02-26 14:30',
    uploadedBy: 'Dr. (Mrs.) Grace Nkechi Okafor (Principal)',
    downloadCount: 2
  },
  {
    studentId: 'STU-002',
    admissionNumber: 'BUM/2024/SEC/002',
    studentName: 'Amina Fatima Abubakar',
    parentName: 'Alhaji Abubakar Danladi',
    parentPhone: '+234 802 987 6543',
    parentPin: 'PAR-4190',
    academicYear: '2025/2026',
    term: '2nd Term',
    isUploadedForDownload: true,
    uploadedAt: '2026-02-26 14:30',
    uploadedBy: 'Dr. (Mrs.) Grace Nkechi Okafor (Principal)',
    downloadCount: 1
  },
  {
    studentId: 'STU-003',
    admissionNumber: 'BUM/2024/SEC/003',
    studentName: 'Tersoo David Aondoaver',
    parentName: 'Barrister David Aondoaver',
    parentPhone: '+234 814 555 7890',
    parentPin: 'PAR-6632',
    academicYear: '2025/2026',
    term: '2nd Term',
    isUploadedForDownload: true,
    uploadedAt: '2026-02-26 14:30',
    uploadedBy: 'Dr. (Mrs.) Grace Nkechi Okafor (Principal)',
    downloadCount: 0
  },
  {
    studentId: 'STU-KG-001',
    admissionNumber: 'BUM/2025/EY/001',
    studentName: 'David Terhemen Aondo',
    parentName: 'Dr. Terhemen Aondo',
    parentPhone: '+234 803 555 1234',
    parentPin: 'PAR-1102',
    academicYear: '2025/2026',
    term: '2nd Term',
    isUploadedForDownload: true,
    uploadedAt: '2026-02-26 15:00',
    uploadedBy: 'Mrs. Abigail Folashade Balogun (Head of Early Childhood)',
    downloadCount: 3
  },
  {
    studentId: 'STU-PRI-001',
    admissionNumber: 'BUM/2024/PRI/001',
    studentName: 'Chiamaka Kimberly Eze',
    parentName: 'Mr. Kenneth Eze',
    parentPhone: '+234 803 444 8899',
    parentPin: 'PAR-3378',
    academicYear: '2025/2026',
    term: '2nd Term',
    isUploadedForDownload: true,
    uploadedAt: '2026-02-26 15:10',
    uploadedBy: 'Mrs. Grace Iveren Shima (Headmistress)',
    downloadCount: 1
  }
];

// Helper Functions for Storage & Passkey Verification

export function getStoredPasskeys(): IssuedPasskey[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PASSKEYS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load passkeys from storage', e);
  }
  return INITIAL_ISSUED_PASSKEYS;
}

export function saveStoredPasskeys(passkeys: IssuedPasskey[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PASSKEYS, JSON.stringify(passkeys));
  } catch (e) {
    console.error('Failed to save passkeys to storage', e);
  }
}

export function getStoredSession(): SecuritySession {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SESSION);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load security session from storage', e);
  }
  return {
    isAcademicUnlocked: false,
    isBursaryUnlocked: false,
    isAdminUnlocked: false,
  };
}

export function saveStoredSession(session: SecuritySession) {
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save security session to storage', e);
  }
}

export function getStoredParentAccess(): ParentAccessRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PARENT_ACCESS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load parent access records', e);
  }
  return INITIAL_PARENT_ACCESS;
}

export function saveStoredParentAccess(records: ParentAccessRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PARENT_ACCESS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save parent access records', e);
  }
}

export function getGlobalReportCardPublicationStatus(): boolean {
  try {
    const data = localStorage.getItem(STORAGE_KEY_GLOBAL_PUBLISH);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load global publication status', e);
  }
  return true; // default published for initial demo, can be toggled
}

export function setGlobalReportCardPublicationStatus(status: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_PUBLISH, JSON.stringify(status));
  } catch (e) {
    console.error('Failed to save global publication status', e);
  }
}

// Verification Logic
export function verifyPasskeyForWing(
  inputPasskey: string,
  targetWing: RestrictedWing
): { success: boolean; message: string; matchedPass?: IssuedPasskey } {
  const cleanPass = inputPasskey.trim().toUpperCase();
  if (!cleanPass) {
    return { success: false, message: 'Please enter a valid authorization passkey.' };
  }

  const passkeys = getStoredPasskeys();
  
  // Find matching active passkey
  const matched = passkeys.find(
    (p) => p.passkey.toUpperCase() === cleanPass && p.status === 'Active'
  );

  if (!matched) {
    // Check fallback master
    if (cleanPass === DEFAULT_DEPARTMENT_PASSKEYS.MASTER) {
      return {
        success: true,
        message: 'Master Executive Authorization Approved.',
        matchedPass: {
          id: 'MASTER-AUTO',
          passkey: cleanPass,
          staffId: 'STF-000',
          staffName: 'Executive Director',
          role: 'Administrator',
          wing: 'all',
          arm: 'All',
          issuedBy: 'Board of Governors',
          issuingOffice: 'Office of the Executive Director',
          issuedDate: '2026-01-01',
          expiresAt: '2030-01-01',
          status: 'Active',
          permissions: ['all_wings']
        }
      };
    }
    return { success: false, message: 'Invalid or revoked authorization passkey. Access denied.' };
  }

  // Check wing clearance
  if (matched.wing === 'all' || matched.wing === targetWing || targetWing === 'all') {
    return {
      success: true,
      message: `Authorization Granted: ${matched.staffName} (${matched.role})`,
      matchedPass: matched,
    };
  }

  return {
    success: false,
    message: `Access Denied: This passkey is restricted to the ${matched.wing.toUpperCase()} wing. You are attempting to access the ${targetWing.toUpperCase()} wing.`,
  };
}

// Generate a random cryptographically formatted passkey
export function generateRandomPasskey(prefix: 'ACAD' | 'BURS' | 'ADM' | 'TUTR' | 'EXAM' | 'MOE' = 'ACAD'): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${prefix}-${randomNum}${randomLetter}`;
}

export function generateParentPin(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PAR-${randomNum}`;
}

// Convenient passkey operations
export function getIssuedPasskeys(): IssuedPasskey[] {
  return getStoredPasskeys();
}

export function issueNewPasskey(newPass: Omit<IssuedPasskey, 'id' | 'issuedDate' | 'status'> & { id?: string; issuedDate?: string; status?: 'Active' | 'Revoked' | 'Suspended' }): IssuedPasskey {
  const current = getStoredPasskeys();
  const created: IssuedPasskey = {
    id: newPass.id || `PASS-${Date.now()}`,
    passkey: newPass.passkey.toUpperCase().trim(),
    staffId: newPass.staffId || `STF-${Math.floor(100 + Math.random() * 900)}`,
    staffName: newPass.staffName,
    role: newPass.role,
    wing: newPass.wing,
    arm: newPass.arm,
    assignedClass: newPass.assignedClass,
    issuedBy: newPass.issuedBy || 'Administrator',
    issuingOffice: newPass.issuingOffice || 'Executive Admin Desk',
    issuedDate: newPass.issuedDate || new Date().toISOString().split('T')[0],
    expiresAt: newPass.expiresAt || '2026-12-31',
    status: newPass.status || 'Active',
    notes: newPass.notes || '',
    permissions: newPass.permissions || ['general_access']
  };

  const updated = [created, ...current];
  saveStoredPasskeys(updated);
  return created;
}

export function revokePasskey(passkeyId: string): boolean {
  const current = getStoredPasskeys();
  const index = current.findIndex(p => p.id === passkeyId);
  if (index >= 0) {
    current[index].status = 'Revoked';
    saveStoredPasskeys([...current]);
    return true;
  }
  return false;
}

