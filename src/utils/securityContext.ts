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

// Default Master & Departmental Passkeys (Deprecated in Phase 8 - replaced by server-authoritative RBAC)
export const DEFAULT_DEPARTMENT_PASSKEYS: Record<string, string> = {};

// Initial Seed of Issued Authorization Credentials (Empty - retired in Phase 8 for server RBAC)
export const INITIAL_ISSUED_PASSKEYS: IssuedPasskey[] = [];

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

// Role-Based Access Control Evaluation (Server-Authoritative)
export function isUserAuthorizedForWing(user: any, targetWing: RestrictedWing): boolean {
  if (!user) return false;
  if (user.isSuperAdmin || user.role === 'super_admin') return true;
  if (user.isStateOfficer || user.role === 'state_officer') {
    return targetWing === 'benue_moe' || targetWing === 'academic' || targetWing === 'admin' || targetWing === 'all';
  }
  if (user.role === 'principal') {
    return targetWing === 'academic' || targetWing === 'bursary' || targetWing === 'admin';
  }
  if (user.role === 'bursar') {
    return targetWing === 'bursary';
  }
  if (user.role === 'teacher' || user.role === 'exam_officer') {
    return targetWing === 'academic';
  }
  if (user.role === 'headmistress') {
    return targetWing === 'academic' || targetWing === 'admin';
  }
  if (user.role === 'administrator') {
    return targetWing === 'admin' || targetWing === 'bursary';
  }
  return false;
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

export function lockAllWings(): void {
  saveStoredSession({
    isAcademicUnlocked: false,
    isBursaryUnlocked: false,
    isAdminUnlocked: false,
    isBenueHQUnlocked: false,
  });
}

export function unlockAllWings(): void {
  saveStoredSession({
    isAcademicUnlocked: true,
    isBursaryUnlocked: true,
    isAdminUnlocked: true,
    isBenueHQUnlocked: true,
  });
}

export function updateSecuritySessionStaff(staff: SecuritySession['authenticatedStaff']): void {
  const current = getStoredSession();
  saveStoredSession({
    ...current,
    authenticatedStaff: staff,
  });
}

export function clearSecuritySession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  } catch (e) {
    console.error('Failed to clear security session from storage', e);
  }
}

