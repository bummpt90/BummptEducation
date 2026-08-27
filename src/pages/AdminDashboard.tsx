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
  ClipboardCheck
} from 'lucide-react';

import { NavigationPage } from '../types';

interface AdminDashboardProps {
  students: Student[];
  initialTab?: 'fees' | 'admissions' | 'attendance' | 'hr' | 'transfers';
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  onOpenReceiptModal: (payment: FeePayment, student?: Student) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  initialTab,
  onNavigate,
  onOpenReceiptModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'fees' | 'admissions' | 'attendance' | 'hr' | 'transfers'>(initialTab || 'fees');
  
  React.useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);
  
  // School Arm Filter for Admin views
  const [selectedArmFilter, setSelectedArmFilter] = useState<'All' | SchoolArm>('All');

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="admin-dashboard-root">
      
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
    </div>
  );
};
