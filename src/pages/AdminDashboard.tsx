import React, { useState } from 'react';
import { 
  Student, 
  Staff, 
  FeeSchedule, 
  FeePayment, 
  AdmissionApplication, 
  StaffApplicant,
  ClassLevel,
  SchoolArm,
  getSchoolArm
} from '../types';
import { formatNaira } from '../utils/grading';
import { 
  INITIAL_FEE_SCHEDULES, 
  INITIAL_PAYMENTS, 
  INITIAL_ADMISSIONS, 
  INITIAL_STAFF 
} from '../data/mockData';
import { 
  Building2, 
  CreditCard, 
  UserPlus, 
  CalendarCheck, 
  Users2, 
  UserMinus, 
  Receipt, 
  Printer, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  ShieldCheck, 
  DollarSign, 
  Check, 
  X,
  FileCheck2,
  Baby,
  BookOpen,
  School,
  Layers,
  Sparkles,
  ClipboardCheck,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  SlidersHorizontal,
  RefreshCw,
  Copy,
  Trash2,
  UserCheck
} from 'lucide-react';

import { NavigationPage } from '../types';
import { WingAccessGatekeeper } from '../components/WingAccessGatekeeper';
import { AccessManagementModal } from '../components/AccessManagementModal';
import { AccountRequestsManager } from '../components/AccountRequestsManager';
import {
  getStoredSession,
  saveStoredSession,
  getIssuedPasskeys,
  issueNewPasskey,
  revokePasskey,
  IssuedPasskey,
  RestrictedWing,
  generateRandomPasskey,
  getGlobalReportCardPublicationStatus,
  setGlobalReportCardPublicationStatus
} from '../utils/securityContext';

interface AdminDashboardProps {
  students: Student[];
  initialTab?: 'fees' | 'admissions' | 'attendance' | 'hr' | 'transfers' | 'security' | 'account-requests';
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  onOpenReceiptModal: (payment: FeePayment, student?: Student) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  initialTab,
  onNavigate,
  onOpenReceiptModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'fees' | 'admissions' | 'attendance' | 'hr' | 'transfers' | 'security' | 'account-requests'>(initialTab || 'fees');
  
  React.useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);
  
  // School Arm Filter for Admin views
  const [selectedArmFilter, setSelectedArmFilter] = useState<'All' | SchoolArm>('All');

  // Security Clearance & Access Passkeys State
  const [isBursaryUnlocked, setIsBursaryUnlocked] = useState<boolean>(() => {
    const sess = getStoredSession();
    return sess.isBursaryUnlocked || sess.isAdminUnlocked;
  });
  const [authenticatedStaff, setAuthenticatedStaff] = useState<IssuedPasskey | null>(null);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [passkeys, setPasskeys] = useState<IssuedPasskey[]>(() => getIssuedPasskeys());
  const [isParentPublished, setIsParentPublished] = useState<boolean>(() => getGlobalReportCardPublicationStatus());
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // New Passkey Form state for in-page Security Tab
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Senior Form Tutor & Exam Officer');
  const [newStaffWing, setNewStaffWing] = useState<RestrictedWing>('academic');
  const [newStaffArm, setNewStaffArm] = useState<SchoolArm | 'All'>('All');
  const [newCustomPasskey, setNewCustomPasskey] = useState('');
  const [passkeyCreationNotice, setPasskeyCreationNotice] = useState('');

  const refreshPasskeys = () => {
    setPasskeys(getIssuedPasskeys());
  };

  const handleGeneratePasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const generatedKey = newCustomPasskey.trim() || generateRandomPasskey(
      newStaffWing === 'academic' ? 'ACAD' : newStaffWing === 'bursary' ? 'BURS' : 'ADM'
    );

    const created = issueNewPasskey({
      passkey: generatedKey,
      staffId: `STF-${Math.floor(100 + Math.random() * 900)}`,
      staffName: newStaffName.trim(),
      role: newStaffRole,
      wing: newStaffWing,
      arm: newStaffArm,
      issuedBy: 'General Administrator (Matthew Ternenge Beeun)',
      issuingOffice: 'Executive Directorate',
      expiresAt: '2026-12-31',
      permissions: [newStaffWing],
      notes: `Authorized access to ${newStaffWing.toUpperCase()} wing operations for ${newStaffArm} arm.`
    });

    refreshPasskeys();
    setNewStaffName('');
    setNewCustomPasskey('');
    setPasskeyCreationNotice(`Passkey "${created.passkey}" successfully issued to ${created.staffName}!`);
    setTimeout(() => setPasskeyCreationNotice(''), 5000);
  };

  const handleRevokePass = (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke authorization passkey for ${name}?`)) {
      revokePasskey(id);
      refreshPasskeys();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(text);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleToggleParentAccess = () => {
    const next = !isParentPublished;
    setIsParentPublished(next);
    setGlobalReportCardPublicationStatus(next);
  };

  const handleLockBursary = () => {
    setIsBursaryUnlocked(false);
    setAuthenticatedStaff(null);
    const sess = getStoredSession();
    saveStoredSession({ ...sess, isBursaryUnlocked: false, isAdminUnlocked: false });
  };

  // Fees State
  const [payments, setPayments] = useState<FeePayment[]>(INITIAL_PAYMENTS);
  const [feeSchedules] = useState<FeeSchedule[]>(INITIAL_FEE_SCHEDULES);
  const [selectedFeeClass, setSelectedFeeClass] = useState<ClassLevel>('SSS 2 Science');
  
  // Admissions State
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>(INITIAL_ADMISSIONS);
  const [newApplicantName, setNewApplicantName] = useState('');
  const [newApplicantClass, setNewApplicantClass] = useState<ClassLevel>('JSS 1');
  const [newApplicantGuardian, setNewApplicantGuardian] = useState('');
  const [newApplicantPhone, setNewApplicantPhone] = useState('');
  const [newApplicantPreviousSchool, setNewApplicantPreviousSchool] = useState('');
  const [showAddApplicantForm, setShowAddApplicantForm] = useState(false);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState('2026-02-26');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>>({
    'STU-001': 'Present',
    'STU-002': 'Present',
    'STU-003': 'Present',
    'STU-004': 'Late',
    'STU-005': 'Present',
    'STU-006': 'Present',
    'STU-007': 'Present',
    'STU-008': 'Present',
    'STU-KG-001': 'Present',
    'STU-KG-002': 'Present',
    'STU-PRI-001': 'Present',
    'STU-PRI-002': 'Present'
  });

  // Staff State
  const [staffList] = useState<Staff[]>(INITIAL_STAFF);
  const [applicants] = useState<StaffApplicant[]>([
    {
      id: 'APP-01',
      fullName: 'Mr. Emmanuel Ochoche',
      roleApplied: 'Senior Physics & Technical Drawing Master',
      qualifications: 'B.Eng. Mechanical Engineering, PGDE (TRCN)',
      yearsExperience: 6,
      interviewScore: 88,
      phone: '+234 803 123 9900',
      email: 'e.ochoche@gmail.com',
      status: 'Hired',
      appliedDate: '2026-01-20'
    },
    {
      id: 'APP-02',
      fullName: 'Miss Veronica Kater',
      roleApplied: 'Primary Montessori Lead & Phonics Specialist',
      qualifications: 'B.Ed. Early Childhood Education, TRCN Certified',
      yearsExperience: 4,
      interviewScore: 90,
      phone: '+234 814 887 6622',
      email: 'v.kater@yahoo.com',
      status: 'Hired',
      appliedDate: '2026-01-28'
    },
    {
      id: 'APP-03',
      fullName: 'Mr. Jude Mba',
      roleApplied: 'IGCSE & SAT Mathematics Master',
      qualifications: 'B.Sc. Mathematics & Statistics (First Class Honours)',
      yearsExperience: 7,
      interviewScore: 94,
      phone: '+234 802 334 1122',
      email: 'jude.mba@edu.ng',
      status: 'Interviewed',
      appliedDate: '2026-02-05'
    }
  ]);

  const handleAddAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApplicantName) return;

    const arm = getSchoolArm(newApplicantClass);

    let specificReqs: any = {};
    if (arm === 'kindergarten') {
      specificReqs = {
        pottyTrained: true,
        immunizationVerified: true,
        earlyDevelopmentCheck: 'Excellent fine motor & phonics readiness',
      };
    } else if (arm === 'primary') {
      specificReqs = {
        placementTestScore: 82,
        readingFluencyLevel: 'Fluent',
        mentalMathRating: 'Proficient',
      };
    } else {
      specificReqs = {
        nationalCommonEntranceScore: 165,
        beceCertificateVerified: true,
        chosenTrack: newApplicantClass.includes('Science') ? 'Science' : newApplicantClass.includes('Arts') ? 'Arts' : 'Commercial',
      };
    }

    const newApp: AdmissionApplication = {
      id: `ADM-${Date.now()}`,
      applicationNumber: `BEDU/ADM/2026/${admissions.length + 48}`,
      studentName: newApplicantName,
      appliedClass: newApplicantClass,
      arm,
      guardianName: newApplicantGuardian || 'Guardian',
      guardianPhone: newApplicantPhone || '+234 800 000 0000',
      guardianEmail: 'applicant@gmail.com',
      previousSchool: newApplicantPreviousSchool || 'Previous Educational Institute',
      entranceExamScore: 85,
      interviewScore: 88,
      status: 'Entrance Exam Scheduled',
      submittedDate: new Date().toISOString().split('T')[0],
      ...specificReqs
    };

    setAdmissions([newApp, ...admissions]);
    setNewApplicantName('');
    setNewApplicantGuardian('');
    setNewApplicantPhone('');
    setNewApplicantPreviousSchool('');
    setShowAddApplicantForm(false);
  };

  const handleToggleAdmissionStatus = (id: string, newStatus: AdmissionApplication['status']) => {
    setAdmissions(admissions.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  // Filtered lists by selectedArmFilter
  const filteredAdmissions = selectedArmFilter === 'All'
    ? admissions
    : admissions.filter((a) => a.arm === selectedArmFilter);

  const filteredFeeSchedules = selectedArmFilter === 'All'
    ? feeSchedules
    : feeSchedules.filter((s) => s.arm === selectedArmFilter);

  const filteredPayments = selectedArmFilter === 'All'
    ? payments
    : payments.filter((p) => {
        const arm = getSchoolArm(p.classLevel);
        return arm === selectedArmFilter;
      });

  const filteredStaff = selectedArmFilter === 'All'
    ? staffList
    : staffList.filter((s) => s.arm === selectedArmFilter || s.arm === 'all');

  const filteredStudents = selectedArmFilter === 'All'
    ? students
    : students.filter((s) => (s.arm || getSchoolArm(s.currentClass)) === selectedArmFilter);

  const totalFeeCollected = filteredPayments.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalBilled = filteredPayments.reduce((acc, curr) => acc + curr.totalBilled, 0);

  // If attempting to access fees or security while locked, show gatekeeper
  if (!isBursaryUnlocked && (activeSubTab === 'fees' || activeSubTab === 'security')) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WingAccessGatekeeper
          wing="bursary"
          title="Bursary & Administrative Wing — Clearance Required"
          subtitle="Official tuition billing schedules, payment receipts, student finance ledgers, and staff authorization passkeys are restricted. Enter your authorized Bursar or Administrative passkey to proceed."
          onUnlockSuccess={(matchedPass) => {
            setIsBursaryUnlocked(true);
            setAuthenticatedStaff(matchedPass || null);
            const sess = getStoredSession();
            saveStoredSession({ ...sess, isBursaryUnlocked: true, isAdminUnlocked: true });
          }}
          onReturnHome={() => onNavigate?.('home')}
          onOpenPasskeyManager={() => setActiveSubTab('security')}
        />

        <AccessManagementModal
          isOpen={isPasskeyModalOpen}
          onClose={() => setIsPasskeyModalOpen(false)}
          initialWingFilter="bursary"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="admin-dashboard-root">
      
      {/* ==================== INSTITUTIONAL SECURITY CLEARANCE BAR ==================== */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-emerald-800/60 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">
                ADMIN & BURSARY CLEARANCE ACTIVE
              </span>
              <span className="text-xs font-bold text-slate-200">
                {authenticatedStaff ? `${authenticatedStaff.staffName} (${authenticatedStaff.role})` : 'Executive Administration Desk'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Authorized access to financial reconciliations, admissions registry, staff audits & authorization passkey generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* Parent Upload Status Toggle */}
          <button
            onClick={handleToggleParentAccess}
            id="admin-toggle-parent-portal-btn"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
              isParentPublished
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
            }`}
            title="Toggle whether parents can download report cards on the Parent Portal"
          >
            {isParentPublished ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            <span>Parent Download: {isParentPublished ? 'Published' : 'Locked'}</span>
          </button>

          {/* Quick Tab to Security */}
          <button
            onClick={() => setActiveSubTab('security')}
            id="admin-goto-security-tab-btn"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
              activeSubTab === 'security'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Generate Passkeys</span>
          </button>

          {/* Lock Bursary */}
          <button
            onClick={handleLockBursary}
            id="admin-lock-bursary-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition cursor-pointer border border-white/20"
            title="Lock Bursary & Admin clearance"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Lock Desk</span>
          </button>
        </div>
      </div>

      {/* Title Header with Central Administrator Governance */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Building2 className="h-3.5 w-3.5 text-emerald-700" />
            <span>Unified Institutional Control • General Administrator: Dr. Matthew Ternenge Beeun</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            School Operations, Bursary & Multi-Arm Admissions
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Synchronized administration connecting Early Childhood (KG 1–3), Primary Basic (Basic 1–6), and Secondary College (JSS & SSS).
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('fees')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'fees' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Bursary & Fees</span>
          </button>

          <button
            onClick={() => setActiveSubTab('admissions')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'admissions' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Admissions Portal</span>
          </button>

          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'attendance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>Attendance</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hr')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'hr' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users2 className="h-3.5 w-3.5" />
            <span>Staff & Sub-Heads</span>
          </button>

          <button
            onClick={() => setActiveSubTab('transfers')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'transfers' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserMinus className="h-3.5 w-3.5" />
            <span>Transfers & Clearance</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            id="admin-security-subtab-btn"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'security' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 bg-amber-100 hover:bg-amber-200'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-300" />
            <span>Access Passes & Security</span>
          </button>

          <button
            onClick={() => setActiveSubTab('account-requests')}
            id="admin-account-requests-subtab-btn"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSubTab === 'account-requests' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-950 bg-blue-100 hover:bg-blue-200 border border-blue-200 font-bold'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-blue-700" />
            <span>Account Requests</span>
          </button>
        </div>
      </div>

      {/* Global Arm Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Filter Records by Arm:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1 text-xs">
            <button
              onClick={() => setSelectedArmFilter('All')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedArmFilter === 'All' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Arms
            </button>
            <button
              onClick={() => setSelectedArmFilter('kindergarten')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedArmFilter === 'kindergarten' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <Baby className="h-3 w-3" />
              Kindergarten
            </button>
            <button
              onClick={() => setSelectedArmFilter('primary')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedArmFilter === 'primary' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <BookOpen className="h-3 w-3" />
              Primary
            </button>
            <button
              onClick={() => setSelectedArmFilter('secondary')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedArmFilter === 'secondary' ? 'bg-blue-700 text-white shadow-xs' : 'text-blue-900 hover:bg-blue-100'
              }`}
            >
              <School className="h-3 w-3" />
              Secondary
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing: <strong className="text-slate-900 capitalize">{selectedArmFilter} Arm Records</strong>
        </div>
      </div>

      {/* ==================== 1. BURSARY & FEES MANAGEMENT ==================== */}
      {activeSubTab === 'fees' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Billed ({selectedArmFilter}):</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{formatNaira(totalBilled)}</p>
              <span className="text-[11px] text-slate-400">Official termly fee schedule</span>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-emerald-200 bg-emerald-50/30 shadow-xs">
              <span className="text-xs font-semibold text-emerald-800">Total Realized Revenue:</span>
              <p className="text-xl font-extrabold text-emerald-700 mt-1 font-mono">{formatNaira(totalFeeCollected)}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Cleared for examination cards</span>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-rose-200 bg-rose-50/30 shadow-xs">
              <span className="text-xs font-semibold text-rose-800">Outstanding Receivables:</span>
              <p className="text-xl font-extrabold text-rose-700 mt-1 font-mono">{formatNaira(totalBilled - totalFeeCollected)}</p>
              <span className="text-[11px] text-rose-600 font-semibold">Pending Bursary clearances</span>
            </div>
          </div>

          {/* Fee Schedule Table & Payments List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Fee Breakdown by Class Level (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Termly Approved Fee Schedule
                </h3>
                <select
                  value={selectedFeeClass}
                  onChange={(e) => setSelectedFeeClass(e.target.value as ClassLevel)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="KG 2">KG 2 (Montessori Discovery)</option>
                  <option value="Basic 1">Basic 1 (Foundation Primary)</option>
                  <option value="Basic 6">Basic 6 (Primary NCEE Lead)</option>
                  <option value="JSS 1">JSS 1</option>
                  <option value="SSS 2 Science">SSS 2 Science</option>
                  <option value="SSS 3 Science">SSS 3 Science (WAEC/NECO/IGCSE/SAT)</option>
                </select>
              </div>

              {(() => {
                const schedule = feeSchedules.find((s) => s.classLevel === selectedFeeClass) || feeSchedules[0];
                return (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg text-slate-700 font-medium">
                      <span>Arm Wing: <strong className="capitalize text-slate-900">{schedule.arm}</strong></span>
                      <span className="font-mono font-bold text-blue-700">{schedule.academicYear} • {schedule.term}</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {schedule.items.map((item) => (
                        <div key={item.id} className="py-2 flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-800">{item.name}</span>
                            <span className="text-[10px] text-slate-400 block">{item.category}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">{formatNaira(item.amount)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center text-sm font-extrabold text-slate-900">
                      <span>Total Term Package:</span>
                      <span className="text-emerald-700 font-mono">{formatNaira(schedule.totalAmount)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Live Payments & Digital Receipts (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Bursary Collections & Official Receipts
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700">Digital Audit Trail</span>
              </div>

              <div className="space-y-3">
                {filteredPayments.map((p) => {
                  const student = students.find((s) => s.id === p.studentId);
                  const arm = getSchoolArm(p.classLevel);

                  return (
                    <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between hover:bg-slate-100/70 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">{p.receiptNumber}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'Fully Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                            {arm}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{student?.fullName || p.studentId}</h4>
                        <p className="text-[11px] text-slate-500">{p.classLevel} • Paid via {p.paymentMethod} on {p.paymentDate}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-sm font-extrabold text-emerald-700 block">
                          {formatNaira(p.amountPaid)}
                        </span>
                        <button
                          onClick={() => onOpenReceiptModal(p, student)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Print Receipt</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 2. ADMISSIONS & ENTRANCE EXAMINATION ==================== */}
      {activeSubTab === 'admissions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Multi-Arm Student Admissions & Screening Portal (2026/2027)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Differentiated entry pathways: Early Childhood Developmental Screening, Primary Placement Tests, and Secondary Entrance (NCEE/BECE/JAMB).
              </p>
            </div>

            <button
              onClick={() => setShowAddApplicantForm(!showAddApplicantForm)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Register Candidate</span>
            </button>
          </div>

          {/* Differentiated Requirements Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-2">
              <div className="flex items-center gap-2 text-purple-900 font-bold">
                <Baby className="h-4 w-4 text-purple-700" />
                <span>Kindergarten Entry Terms (Age 2-5)</span>
              </div>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                <li>Potty Training & Social Independence status</li>
                <li>Comprehensive Immunization & Pediatric Record</li>
                <li>Early sensory discovery & fine motor observation</li>
                <li>Parent/Guardian interaction interview</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <BookOpen className="h-4 w-4 text-emerald-700" />
                <span>Primary School Entry Terms (Basic 1-6)</span>
              </div>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                <li>Primary Placement Test (Maths & English Literacy)</li>
                <li>Reading Fluency & Phonics diagnostic rating</li>
                <li>Mental Mathematics & quantitative reasoning check</li>
                <li>Official transcript from previous Nursery / Primary</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <School className="h-4 w-4 text-blue-700" />
                <span>Secondary College Terms (JSS & SSS)</span>
              </div>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                <li>National Common Entrance (NCEE) & Aptitude Test</li>
                <li>BECE / Junior WAEC Result verification for SSS</li>
                <li>Track placement: Science, Arts, or Commercial</li>
                <li>WAEC, NECO, SAT & Cambridge candidate profiling</li>
              </ul>
            </div>
          </div>

          {/* New Applicant Form Drawer */}
          {showAddApplicantForm && (
            <form onSubmit={handleAddAdmission} className="p-5 rounded-2xl bg-white border border-blue-200 shadow-md space-y-4">
              <h4 className="font-bold text-xs text-blue-900 uppercase">New Candidate Entrance Registration</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                <div>
                  <label className="font-semibold block text-slate-700 mb-1">Student Full Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aondona Terseer"
                    value={newApplicantName}
                    onChange={(e) => setNewApplicantName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 mb-1">Applied Class & Arm:</label>
                  <select
                    value={newApplicantClass}
                    onChange={(e) => setNewApplicantClass(e.target.value as ClassLevel)}
                    className="w-full rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-blue-500 font-bold"
                  >
                    <optgroup label="Kindergarten Wing">
                      <option value="KG 1">KG 1 (Early Foundation)</option>
                      <option value="KG 2">KG 2 (Montessori Discovery)</option>
                      <option value="KG 3">KG 3 (Transition to Primary)</option>
                    </optgroup>
                    <optgroup label="Primary School Wing">
                      <option value="Basic 1">Basic 1 (Primary 1)</option>
                      <option value="Basic 2">Basic 2 (Primary 2)</option>
                      <option value="Basic 3">Basic 3 (Primary 3)</option>
                      <option value="Basic 4">Basic 4 (Primary 4)</option>
                      <option value="Basic 5">Basic 5 (Primary 5)</option>
                      <option value="Basic 6">Basic 6 (Primary 6 - NCEE)</option>
                    </optgroup>
                    <optgroup label="Secondary College Wing">
                      <option value="JSS 1">JSS 1</option>
                      <option value="JSS 2">JSS 2</option>
                      <option value="JSS 3">JSS 3 (BECE / Checkpoint)</option>
                      <option value="SSS 1 Science">SSS 1 Science</option>
                      <option value="SSS 1 Arts">SSS 1 Arts</option>
                      <option value="SSS 1 Commercial">SSS 1 Commercial</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 mb-1">Parent/Guardian Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Terseer"
                    value={newApplicantGuardian}
                    onChange={(e) => setNewApplicantGuardian(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 mb-1">Phone Number:</label>
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={newApplicantPhone}
                    onChange={(e) => setNewApplicantPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block text-slate-700 mb-1">Previous School/Crèche:</label>
                  <input
                    type="text"
                    placeholder="e.g. Radiant Heights Academy"
                    value={newApplicantPreviousSchool}
                    onChange={(e) => setNewApplicantPreviousSchool(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddApplicantForm(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700 cursor-pointer"
                >
                  Save Registration
                </button>
              </div>
            </form>
          )}

          {/* Admissions Table */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-bold">
                  <th className="p-3 text-left">App Number</th>
                  <th className="p-3 text-left">Candidate Name & Arm</th>
                  <th className="p-3 text-left">Applied Class</th>
                  <th className="p-3 text-left">Arm-Specific Screening Terms</th>
                  <th className="p-3 text-center">Aptitude Score</th>
                  <th className="p-3 text-center">Interview</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Action Decision</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmissions.map((adm, idx) => (
                  <tr key={adm.id} className={`border-b border-slate-200 hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="p-3 font-mono font-bold text-slate-700">{adm.applicationNumber}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{adm.studentName}</span>
                      <span className="text-[10px] text-slate-500 block font-normal">{adm.guardianName} ({adm.guardianPhone})</span>
                      <span className={`inline-block mt-1 text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                        adm.arm === 'kindergarten' ? 'bg-purple-100 text-purple-800' :
                        adm.arm === 'primary' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {adm.arm}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{adm.appliedClass}</td>
                    <td className="p-3 text-slate-600 text-[11px]">
                      {adm.arm === 'kindergarten' && (
                        <div>
                          <span>Potty Trained: {adm.pottyTrained ? '✅ Yes' : '⏳ Pending'}</span> | <span>Immunization: {adm.immunizationVerified ? '✅ Verified' : '❌ Pending'}</span>
                        </div>
                      )}
                      {adm.arm === 'primary' && (
                        <div>
                          <span>Placement Test: <strong>{adm.placementTestScore || 80}%</strong></span> | <span>Fluency: {adm.readingFluencyLevel || 'Fluent'}</span>
                        </div>
                      )}
                      {adm.arm === 'secondary' && (
                        <div>
                          <span>NCEE Score: <strong>{adm.nationalCommonEntranceScore || '160/200'}</strong></span> | <span>Track: {adm.chosenTrack || 'General'}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-blue-700">{adm.entranceExamScore || 'Pending'}</td>
                    <td className="p-3 text-center font-mono font-bold text-indigo-700">{adm.interviewScore || 'Pending'}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        adm.status === 'Passed - Admitted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        adm.status === 'Waitlisted' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {adm.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {adm.status !== 'Passed - Admitted' && (
                        <button
                          onClick={() => handleToggleAdmissionStatus(adm.id, 'Passed - Admitted')}
                          className="rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Admit
                        </button>
                      )}
                      {adm.status !== 'Waitlisted' && (
                        <button
                          onClick={() => handleToggleAdmissionStatus(adm.id, 'Waitlisted')}
                          className="rounded bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-700 cursor-pointer"
                        >
                          Waitlist
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 3. STUDENT ATTENDANCE REGISTER ==================== */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Daily Class Attendance Register & Roll Call
              </h3>
              <p className="text-xs text-slate-600">
                Mark morning devotion attendance. Threshold alerts triggered at &lt; 75% termly attendance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Date:</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-bold">
                  <th className="p-2.5 text-left w-12">#</th>
                  <th className="p-2.5 text-left">Student Full Name</th>
                  <th className="p-2.5 text-left">Arm</th>
                  <th className="p-2.5 text-left">Class</th>
                  <th className="p-2.5 text-left">House</th>
                  <th className="p-2.5 text-center">Status on {attendanceDate}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => {
                  const currentStatus = attendanceRecords[student.id] || 'Present';
                  const arm = student.arm || getSchoolArm(student.currentClass);

                  return (
                    <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2.5 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900">{student.fullName}</td>
                      <td className="p-2.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          arm === 'kindergarten' ? 'bg-purple-100 text-purple-800' :
                          arm === 'primary' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {arm}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-700 font-semibold">{student.currentClass}</td>
                      <td className="p-2.5 text-slate-600">{student.house}</td>
                      <td className="p-2.5 text-center">
                        <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-[10px]">
                          {(['Present', 'Late', 'Excused', 'Absent'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => setAttendanceRecords({ ...attendanceRecords, [student.id]: st })}
                              className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                                currentStatus === st
                                    ? st === 'Present' ? 'bg-emerald-600 text-white' :
                                      st === 'Late' ? 'bg-amber-600 text-white' :
                                      st === 'Absent' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 4. HR & STAFF REGISTRY ==================== */}
      {activeSubTab === 'hr' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Sub-Head Leadership Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Sub-Head: Kindergarten</span>
              <h4 className="text-sm font-bold text-purple-950">Mrs. Abigail Folashade Balogun</h4>
              <p className="text-[11px] text-purple-800">Head of Early Childhood (M.Ed. Early Childhood)</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Sub-Head: Primary School</span>
              <h4 className="text-sm font-bold text-emerald-950">Mrs. Grace Iveren Shima</h4>
              <p className="text-[11px] text-emerald-800">Headmistress Basic Education (M.Ed. Educational Mgt)</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Sub-Head: Secondary College</span>
              <h4 className="text-sm font-bold text-blue-950">Dr. (Mrs.) Grace Nkechi Okafor</h4>
              <p className="text-[11px] text-blue-800">Principal (Ph.D. Educational Administration)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Active Staff Roster (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Faculty & Support Staff Roster</h3>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {filteredStaff.length} Verified Staff in Selection
                </span>
              </div>

              <div className="space-y-3">
                {filteredStaff.map((stf) => (
                  <div key={stf.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-xs transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {stf.staffId}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            stf.arm === 'kindergarten' ? 'bg-purple-100 text-purple-800' :
                            stf.arm === 'primary' ? 'bg-emerald-100 text-emerald-800' :
                            stf.arm === 'secondary' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {stf.arm === 'all' ? 'Central Leadership' : `${stf.arm} arm`}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{stf.fullName}</h4>
                        <p className="text-xs font-semibold text-blue-700">{stf.designation}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {stf.type}
                      </span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                      <p><strong>Qualifications:</strong> {stf.qualifications}</p>
                      <p><strong>Contact:</strong> {stf.email} | {stf.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recruitment Pipeline (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Recruitment & Faculty Pipeline</h3>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Shortlisted Applicants
                </span>
              </div>

              <div className="space-y-3">
                {applicants.map((app) => (
                  <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{app.fullName}</h4>
                        <p className="text-[11px] text-slate-600 font-medium">{app.roleApplied}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {app.status}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                      <p><strong>Qualifications:</strong> {app.qualifications}</p>
                      <p><strong>Interview Rating:</strong> <span className="font-bold text-blue-700">{app.interviewScore}%</span> ({app.yearsExperience} yrs exp)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 5. WITHDRAWALS & TRANSFERS ==================== */}
      {activeSubTab === 'transfers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900">Student Transfer & Clearance Desk</h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Differentiated clearance protocols for Early Childhood transfers, Primary School Leaving Certificates (PSLC), and Secondary Testimonials with WAEC/NECO center dossiers.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 uppercase">Clearance Checklist by Arm:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                  <strong className="text-purple-900 block font-bold">Kindergarten Wing</strong>
                  <p className="text-[11px] text-slate-600">Early Learning Milestone Portfolio, Health Dossier, Bursary zero-balance.</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <strong className="text-emerald-900 block font-bold">Primary School Wing</strong>
                  <p className="text-[11px] text-slate-600">Basic 1-6 Master Record, Universal Basic Education ID, NCEE eligibility certificate.</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                  <strong className="text-blue-900 block font-bold">Secondary College Wing</strong>
                  <p className="text-[11px] text-slate-600">WAEC/NECO/IGCSE external exam record, science lab return clearance, graduation testimonial.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. ACCESS CONTROL & STAFF PASSKEYS GENERATOR ==================== */}
      {activeSubTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-200" id="admin-security-hub-section">
          {/* Header Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 text-white border border-slate-700 shadow-lg space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    Staff Authorization Passkeys & Wing Restriction Desk
                  </h3>
                  <p className="text-xs text-slate-300">
                    Issue cryptographically distinct passkeys to form tutors, exam officers, bursars, and departmental heads.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refreshPasskeys}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition cursor-pointer border border-white/10"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Passes</span>
                </button>
                <button
                  onClick={() => setIsPasskeyModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-xs"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Open Security Modal</span>
                </button>
              </div>
            </div>

            {/* Parent Portal Release Switch */}
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isParentPublished ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span className="font-bold text-xs text-white">Parent Report Card Portal Release Status:</span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded ${
                    isParentPublished ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isParentPublished ? 'ONLINE & READY FOR PARENT DOWNLOAD' : 'RESTRICTED / DRAFT MODE'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1">
                  When restricted, parents cannot download terminal report cards until the Academic Board explicitly uploads and publishes the term result batch.
                </p>
              </div>

              <button
                onClick={handleToggleParentAccess}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  isParentPublished
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                }`}
              >
                {isParentPublished ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                <span>{isParentPublished ? 'Revoke & Restrict Downloads' : 'Publish & Upload All Report Cards'}</span>
              </button>
            </div>
          </div>

          {/* Creation Form & Quick Reference */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                  <span>Issue New Staff Authorization Passkey</span>
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">Role-Based Clearance</span>
              </div>

              {passkeyCreationNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{passkeyCreationNotice}</span>
                </div>
              )}

              <form onSubmit={handleGeneratePasskey} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Staff / Officer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mrs. Blessing Aondoaver"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation / Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Form Tutor (SSS 2 Science)"
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Restricted Wing Authorization
                    </label>
                    <select
                      value={newStaffWing}
                      onChange={(e) => setNewStaffWing(e.target.value as RestrictedWing)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="academic">Academic Wing (Report Cards, Broadsheets, Scoresheets)</option>
                      <option value="bursary">Bursary Wing (Fee Schedules, Billing Ledgers, Receipts)</option>
                      <option value="admin">Administrative Wing (Admissions, HR & Student Registers)</option>
                      <option value="all">Full Executive Access (All Wings)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      School Arm Scope
                    </label>
                    <select
                      value={newStaffArm}
                      onChange={(e) => setNewStaffArm(e.target.value as SchoolArm | 'All')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="All">All School Arms (KG, Primary, Secondary)</option>
                      <option value="kindergarten">Kindergarten Arm Only (KG 1 - 3)</option>
                      <option value="primary">Primary Arm Only (Basic 1 - 6)</option>
                      <option value="secondary">Secondary College Arm Only (JSS 1 - SSS 3)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custom Passkey (Leave blank for automated 8-character generation)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SSS2-EXAM-2026 or leave blank"
                    value={newCustomPasskey}
                    onChange={(e) => setNewCustomPasskey(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
                  >
                    <KeyRound className="h-4 w-4 text-amber-400" />
                    <span>Generate & Issue Authorized Passkey</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Demo Reference Card */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Demonstration Passkeys</span>
                </h4>
              </div>

              <p className="text-xs text-slate-600">
                You can copy any of these default administrative demonstration passkeys to instantly test clearance:
              </p>

              <div className="space-y-2.5">
                {[
                  { wing: 'Academic Wing', role: 'VP Academics & Exam Officer', pass: 'ACADEMIC2026', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                  { wing: 'Bursary Desk', role: 'School Bursar & Accounts Office', pass: 'BURSARY2026', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                  { wing: 'Executive Admin', role: 'General Administrator / Principal', pass: 'BUMMPT2026', color: 'text-purple-700 bg-purple-50 border-purple-200' },
                  { wing: 'Kindergarten Desk', role: 'Head of Early Years Foundation', pass: 'KG-HEAD-2026', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                  { wing: 'Primary Wing', role: 'Headmistress (Basic 1-6)', pass: 'PRI-HEAD-2026', color: 'text-teal-700 bg-teal-50 border-teal-200' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border ${item.color} flex items-center justify-between text-xs`}>
                    <div>
                      <span className="font-bold block">{item.wing}</span>
                      <span className="text-[10px] text-slate-500">{item.role}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(item.pass)}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-mono font-bold text-[11px] text-slate-900 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                      title="Click to copy passkey"
                    >
                      <span>{item.pass}</span>
                      <Copy className="h-3 w-3 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Issued Passkeys Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Issued Staff Access Passkeys Registry ({passkeys.length})</h4>
                <p className="text-xs text-slate-500">Live registry of authorized personnel passkeys. Passkeys can be copied or revoked at any time.</p>
              </div>
              {copyFeedback && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
                  ✓ Copied "{copyFeedback}" to clipboard!
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Passkey ID / Code</th>
                    <th className="py-2.5 px-3">Staff Holder & Designation</th>
                    <th className="py-2.5 px-3">Wing Clearance</th>
                    <th className="py-2.5 px-3">Arm Scope</th>
                    <th className="py-2.5 px-3">Issued Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {passkeys.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <code className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-mono font-bold text-[11px]">
                            {p.passkey}
                          </code>
                          <button
                            onClick={() => handleCopy(p.passkey)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="Copy passkey"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <strong className="text-slate-900 block font-bold">{p.staffName}</strong>
                        <span className="text-[10px] text-slate-500">{p.role}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.wing === 'academic' ? 'bg-blue-100 text-blue-800' :
                          p.wing === 'bursary' ? 'bg-emerald-100 text-emerald-800' :
                          p.wing === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {p.wing}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-bold text-slate-700 uppercase">
                          {p.arm}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">
                        {p.issuedDate}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="h-3 w-3" />
                          Active
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleRevokePass(p.id, p.staffName)}
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200 transition cursor-pointer"
                          title="Revoke passkey"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 7. CONTROLLED ACCOUNT REQUESTS ==================== */}
      {activeSubTab === 'account-requests' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <AccountRequestsManager />
        </div>
      )}

      {/* Access Management Modal */}
      <AccessManagementModal
        isOpen={isPasskeyModalOpen}
        onClose={() => {
          setIsPasskeyModalOpen(false);
          refreshPasskeys();
        }}
        initialWingFilter="bursary"
      />
    </div>
  );
};
