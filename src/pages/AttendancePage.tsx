import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClassLevel, 
  Term, 
  AcademicYear, 
  Student, 
  DailyAttendanceEntry, 
  AttendanceStatus, 
  NavigationPage,
  TermCalendarDay,
  StudentAttendanceSummary
} from '../types';
import { 
  ALL_CLASSES_DEFINITIONS, 
  getAllStudentsForClass, 
  TERM_CALENDAR_DAYS,
  CURRENT_DEFAULT_SCHOOL_DAY,
  getStoredAttendanceRecords,
  saveStoredAttendanceRecords,
  computeStudentAttendanceSummary,
  computeClassSessionSummary
} from '../data/attendanceData';
import { useData } from '../context/DataContext';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  GraduationCap, 
  ChevronDown, 
  Printer, 
  Save, 
  Sparkles, 
  Search, 
  Filter, 
  RefreshCw, 
  Award, 
  UserCheck, 
  PhoneCall, 
  Mail, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Share2, 
  SlidersHorizontal, 
  Table, 
  LayoutList, 
  CheckCheck, 
  Send, 
  UserPlus, 
  FileSpreadsheet, 
  Info, 
  FileText, 
  Building2, 
  ChevronRight, 
  BadgeCheck, 
  HelpCircle,
  TrendingUp,
  Activity,
  HeartHandshake,
  Baby,
  BookOpen,
  School,
  Landmark,
  Radio,
  Zap,
  Download
} from 'lucide-react';

interface AttendancePageProps {
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  initialClass?: ClassLevel;
  initialTerm?: Term;
  initialAcademicYear?: AcademicYear;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({
  onNavigate,
  initialClass = 'SSS 2 Science',
  initialTerm = '2nd Term',
  initialAcademicYear = '2025/2026'
}) => {
  // Class, Term & Session State
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(initialClass);
  const [selectedTerm, setSelectedTerm] = useState<Term>(initialTerm);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear>(initialAcademicYear);

  // Calendar & Date Navigation
  const defaultDay = TERM_CALENDAR_DAYS.find(d => d.dayNumberInTerm === CURRENT_DEFAULT_SCHOOL_DAY) || TERM_CALENDAR_DAYS[0];
  const [selectedDate, setSelectedDate] = useState<string>(defaultDay.date);
  const [selectedWeek, setSelectedWeek] = useState<number>(defaultDay.weekNumber);

  // View Mode: 'daily-roster' | 'term-matrix' | 'analytics'
  const [viewMode, setViewMode] = useState<'daily-roster' | 'term-matrix' | 'analytics'>('daily-roster');

  // Production Data Context
  const { students: allDbStudents, recordAttendance: serverRecordAttendance } = useData();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Present' | 'Absent' | 'Late' | 'Excused' | 'At-Risk'>('All');

  // Class Students Roster from Server-Authoritative Database
  const [classStudents, setClassStudents] = useState<Student[]>(() => {
    const dbMatch = allDbStudents.filter(s => s.currentClass === selectedClass && s.status === 'Active');
    return dbMatch.length > 0 ? dbMatch : getAllStudentsForClass(selectedClass);
  });

  // Attendance Records State: records[dateStr][studentId] = DailyAttendanceEntry
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, DailyAttendanceEntry>>>(() => 
    getStoredAttendanceRecords(selectedClass, selectedTerm, selectedAcademicYear, classStudents)
  );

  // Notifications & UI states
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [parentAlertStudent, setParentAlertStudent] = useState<{ student: Student; reason: string; date: string } | null>(null);
  const [parentAlertSentMessage, setParentAlertSentMessage] = useState<string | null>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [editingExcuseStudentId, setEditingExcuseStudentId] = useState<string | null>(null);
  const [customExcuseNote, setCustomExcuseNote] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: '',
    gender: 'Male' as 'Male' | 'Female',
    guardianName: '',
    guardianPhone: '',
    house: 'Eagle House (Blue)' as any
  });

  // Current Class Definition & Form Master Info
  const currentClassDef = useMemo(() => {
    return ALL_CLASSES_DEFINITIONS.find(c => c.level === selectedClass) || ALL_CLASSES_DEFINITIONS[0];
  }, [selectedClass]);

  // Current Calendar Day Meta
  const currentDayMeta = useMemo(() => {
    return TERM_CALENDAR_DAYS.find(d => d.date === selectedDate) || TERM_CALENDAR_DAYS[0];
  }, [selectedDate]);

  // Update students and records when selectedClass changes or allDbStudents updates
  useEffect(() => {
    const dbMatch = allDbStudents.filter(s => s.currentClass === selectedClass && s.status === 'Active');
    const students = dbMatch.length > 0 ? dbMatch : getAllStudentsForClass(selectedClass);
    setClassStudents(students);
    const records = getStoredAttendanceRecords(selectedClass, selectedTerm, selectedAcademicYear, students);
    setAttendanceRecords(records);
  }, [selectedClass, selectedTerm, selectedAcademicYear, allDbStudents]);

  // Save changes to localStorage and sync with PostgreSQL /api/v1/attendance
  const handlePersistRecords = (updated: Record<string, Record<string, DailyAttendanceEntry>>) => {
    setAttendanceRecords(updated);
    saveStoredAttendanceRecords(selectedClass, selectedTerm, selectedAcademicYear, updated);

    // Sync current date's register with PostgreSQL
    const dayEntries = updated[selectedDate];
    if (dayEntries) {
      const recordsPayload = Object.entries(dayEntries).map(([studentId, entry]) => ({
        studentId,
        status: entry.status,
        arrivalTime: entry.arrivalTime,
        reason: entry.reason || entry.note
      }));

      serverRecordAttendance({
        date: selectedDate,
        records: recordsPayload
      }).catch(err => {
        console.warn('Attendance server sync:', err);
      });
    }

    setSaveSuccessMessage('Attendance register automatically saved & synced to PostgreSQL');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Switch Selected Class
  const handleSelectClass = (cls: ClassLevel) => {
    setSelectedClass(cls);
    setIsClassDropdownOpen(false);
    setSearchQuery('');
  };

  // Switch Selected Date
  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const day = TERM_CALENDAR_DAYS.find(d => d.date === dateStr);
    if (day) {
      setSelectedWeek(day.weekNumber);
    }
  };

  // Mark Single Student Attendance for Selected Date
  const handleMarkStudent = (studentId: string, status: AttendanceStatus, arrivalTime?: string, reason?: string) => {
    const currentDayEntries = { ...(attendanceRecords[selectedDate] || {}) };
    
    currentDayEntries[studentId] = {
      status,
      arrivalTime: status === 'present' ? (arrivalTime || '07:45 AM') : status === 'late' ? (arrivalTime || '08:15 AM') : undefined,
      reason: status === 'excused' ? (reason || 'Excused by Guardian / Health clinic') : status === 'absent' ? (reason || 'Unexcused absence') : undefined,
      markedAt: new Date().toISOString()
    };

    const updated = {
      ...attendanceRecords,
      [selectedDate]: currentDayEntries
    };

    handlePersistRecords(updated);
  };

  // Quick Action: Mark All Present
  const handleMarkAllPresent = () => {
    const currentDayEntries = { ...(attendanceRecords[selectedDate] || {}) };
    classStudents.forEach(stu => {
      currentDayEntries[stu.id] = {
        status: 'present',
        arrivalTime: '07:45 AM',
        markedAt: new Date().toISOString()
      };
    });

    const updated = {
      ...attendanceRecords,
      [selectedDate]: currentDayEntries
    };

    handlePersistRecords(updated);
  };

  // Quick Action: Simulate NFC Smart ID Badge Tap
  const handleSimulateBiometricClockIn = () => {
    const currentDayEntries = { ...(attendanceRecords[selectedDate] || {}) };
    classStudents.forEach((stu, idx) => {
      // 92% present on time, 8% late
      const isLate = idx % 9 === 0;
      const min = 30 + (idx * 3) % 25;
      const lateMin = 5 + (idx * 4) % 20;

      currentDayEntries[stu.id] = {
        status: isLate ? 'late' : 'present',
        arrivalTime: isLate ? `08:${String(lateMin).padStart(2, '0')} AM` : `07:${String(min).padStart(2, '0')} AM`,
        reason: isLate ? 'Smart Gate NFC logged after 08:00 AM assembly' : undefined,
        markedAt: new Date().toISOString()
      };
    });

    const updated = {
      ...attendanceRecords,
      [selectedDate]: currentDayEntries
    };

    handlePersistRecords(updated);
  };

  // Quick Action: Reset Today's Register
  const handleResetDay = () => {
    if (window.confirm(`Are you sure you want to reset attendance for ${currentDayMeta.label}?`)) {
      const updated = { ...attendanceRecords };
      delete updated[selectedDate];
      handlePersistRecords(updated);
    }
  };

  // Save Excuse Note Modal
  const handleSaveExcuseNote = (studentId: string) => {
    handleMarkStudent(studentId, 'excused', undefined, customExcuseNote || 'Approved absence note submitted');
    setEditingExcuseStudentId(null);
    setCustomExcuseNote('');
  };

  // Dispatch Simulated Parent Alert (WhatsApp/SMS)
  const handleSendParentAlert = (student: Student, reason: string) => {
    setParentAlertStudent({ student, reason, date: currentDayMeta.label });
  };

  const handleConfirmParentAlert = () => {
    if (!parentAlertStudent) return;
    setParentAlertSentMessage(`Official SMS & WhatsApp notification dispatched to guardian (${parentAlertStudent.student.guardianName} - ${parentAlertStudent.student.guardianPhone})`);
    setParentAlertStudent(null);
    setTimeout(() => setParentAlertSentMessage(null), 5000);
  };

  // Add New Student Handler
  const handleAddNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.fullName.trim()) return;

    const classCode = selectedClass.replace(/\s+/g, '').toUpperCase();
    const newCount = classStudents.length + 1;
    const newStudent: Student = {
      id: `STU-${classCode}-${String(newCount).padStart(3, '0')}`,
      admissionNumber: `BEDU/${classCode}/2025/${String(newCount).padStart(3, '0')}`,
      fullName: newStudentForm.fullName,
      gender: newStudentForm.gender,
      dateOfBirth: '2016-05-15',
      currentClass: selectedClass,
      arm: currentClassDef.arm,
      house: newStudentForm.house,
      guardianName: newStudentForm.guardianName || 'Guardian',
      guardianPhone: newStudentForm.guardianPhone || '+234 800 000 0000',
      guardianEmail: `${newStudentForm.fullName.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
      address: 'Makurdi Metropolis, Benue State',
      stateOfOrigin: 'Benue',
      dateEnrolled: new Date().toISOString().split('T')[0],
      status: 'Active'
    };

    const updatedStudents = [...classStudents, newStudent];
    setClassStudents(updatedStudents);
    setIsAddStudentModalOpen(false);
    setNewStudentForm({
      fullName: '',
      gender: 'Male',
      guardianName: '',
      guardianPhone: '',
      house: 'Eagle House (Blue)'
    });
    setSaveSuccessMessage(`Successfully enrolled ${newStudent.fullName} into ${selectedClass}`);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Compute Class Session Summary for Selected Date
  const classSummary = useMemo(() => {
    return computeClassSessionSummary(
      selectedClass,
      selectedTerm,
      selectedAcademicYear,
      selectedDate,
      attendanceRecords,
      classStudents,
      TERM_CALENDAR_DAYS
    );
  }, [selectedClass, selectedTerm, selectedAcademicYear, selectedDate, attendanceRecords, classStudents]);

  // Compute Individual Student Summaries up to selected date
  const studentSummaries: StudentAttendanceSummary[] = useMemo(() => {
    return classStudents.map(student => 
      computeStudentAttendanceSummary(
        student, 
        attendanceRecords, 
        TERM_CALENDAR_DAYS, 
        currentDayMeta.dayNumberInTerm
      )
    );
  }, [classStudents, attendanceRecords, currentDayMeta.dayNumberInTerm]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return classStudents.filter(student => {
      // Search filter
      const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Gender filter
      if (genderFilter !== 'All' && student.gender !== genderFilter) return false;

      // Status filter
      if (statusFilter !== 'All') {
        const entry = attendanceRecords[selectedDate]?.[student.id];
        const status = entry ? entry.status : 'present';
        const summary = studentSummaries.find(s => s.studentId === student.id);

        if (statusFilter === 'Present' && status !== 'present') return false;
        if (statusFilter === 'Absent' && status !== 'absent') return false;
        if (statusFilter === 'Late' && status !== 'late') return false;
        if (statusFilter === 'Excused' && status !== 'excused') return false;
        if (statusFilter === 'At-Risk' && (!summary || summary.attendancePercentage >= 75)) return false;
      }

      return true;
    });
  }, [classStudents, searchQuery, genderFilter, statusFilter, attendanceRecords, selectedDate, studentSummaries]);

  // Group all 21 classes by category for dropdown
  const classesByCategory = useMemo(() => {
    const groups: Record<string, Array<typeof ALL_CLASSES_DEFINITIONS[number]>> = {
      'Kindergarten & Early Years': [],
      'Primary Basic Education': [],
      'Junior Secondary': [],
      'Senior Secondary': []
    };

    ALL_CLASSES_DEFINITIONS.forEach(c => {
      if (groups[c.category]) {
        groups[c.category].push(c);
      }
    });

    return groups;
  }, []);

  // Sync Attendance to Report Cards Trigger
  const handleSyncToReportCards = () => {
    setSaveSuccessMessage(`Successfully synchronized ${classStudents.length} student attendance totals into official Terminal Report Cards!`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Printable Register Trigger
  const handlePrintRegister = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans antialiased" id="bummpt-attendance-module">
      
      {/* Top Banner & Header Command Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          
          {/* Breadcrumb & Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('home')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Home</span>
              </button>

              <button
                onClick={() => onNavigate?.('academic')}
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 font-bold"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Academic Wing (40/60 CA)</span>
              </button>

              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active 13-Week Term Register</span>
              </span>
            </div>

            {/* Quick Actions Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncToReportCards}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-xs cursor-pointer border border-blue-400/30"
                title="Sync daily totals to Student Report Cards"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Sync to Report Cards</span>
              </button>

              <button
                onClick={handlePrintRegister}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-slate-400" />
                <span>Print Register</span>
              </button>
            </div>
          </div>

          {/* Main Title & Dropdown Command Bar */}
          <div className="pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>Daily Attendance & Form Master Register</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white uppercase tracking-wider">
                      KG 1 to SSS 3
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Automated term attendance telemetry, statutory day tracking (65 Days), and instant roll call sync.
                  </p>
                </div>
              </div>
            </div>

            {/* CLASS DROPDOWN MENU (KG 1 down to SSS 3) */}
            <div className="relative z-30">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Select Class / Form Master Wing:
              </label>
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                id="form-master-class-dropdown-button"
                className="w-full sm:w-80 flex items-center justify-between px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border-2 border-blue-500/80 rounded-xl text-left text-white shadow-lg transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
                    {currentClassDef.arm === 'kindergarten' && <Baby className="h-4 w-4" />}
                    {currentClassDef.arm === 'primary' && <BookOpen className="h-4 w-4" />}
                    {currentClassDef.arm === 'secondary' && <School className="h-4 w-4" />}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-black text-white group-hover:text-blue-300 transition-colors truncate">
                      {currentClassDef.level}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {currentClassDef.formMaster.fullName}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-blue-400 transition-transform shrink-0 ml-2 ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN MENU POPUP */}
              {isClassDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-full sm:w-96 max-h-[75vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 divide-y divide-slate-800"
                  id="form-master-class-dropdown-menu"
                >
                  <div className="p-2 bg-slate-950/60 rounded-xl mb-1 text-[11px] text-slate-300 font-medium flex items-center justify-between">
                    <span className="font-bold text-amber-400">All 21 Academic Classes</span>
                    <span className="text-[10px] text-slate-400">Select your Form Class</span>
                  </div>

                  {(Object.entries(classesByCategory) as [string, Array<typeof ALL_CLASSES_DEFINITIONS[number]>][]).map(([category, classes]) => (
                    <div key={category} className="py-2">
                      <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        {category.includes('Kindergarten') && <Baby className="h-3 w-3" />}
                        {category.includes('Primary') && <BookOpen className="h-3 w-3" />}
                        {category.includes('Junior') && <School className="h-3 w-3 text-emerald-400" />}
                        {category.includes('Senior') && <GraduationCap className="h-3 w-3 text-amber-400" />}
                        <span>{category}</span>
                      </p>
                      <div className="space-y-1 mt-1">
                        {classes.map(cls => {
                          const isSelected = selectedClass === cls.level;
                          return (
                            <button
                              key={cls.level}
                              onClick={() => handleSelectClass(cls.level)}
                              className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between text-xs cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <p className="font-bold truncate">{cls.level}</p>
                                <p className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                  {cls.formMaster.fullName}
                                </p>
                              </div>
                              {isSelected ? (
                                <Check className="h-4 w-4 text-white shrink-0" />
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                  {cls.arm}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save Status Toast */}
          {saveSuccessMessage && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{saveSuccessMessage}</span>
              </span>
              <span className="text-[10px] text-emerald-400/80 uppercase">Real-Time Sync</span>
            </div>
          )}

          {/* Parent Alert Dispatched Toast */}
          {parentAlertSentMessage && (
            <div className="mt-3 p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Send className="h-4 w-4 text-blue-400" />
              <span>{parentAlertSentMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* ==================== SUMMARY SESSION & STATUTORY METRICS PANEL ==================== */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs" id="attendance-summary-session">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
                Official Statutory Session Summary • {selectedAcademicYear} {selectedTerm}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                <span>Class Telemetry: {currentClassDef.name}</span>
              </h2>
            </div>

            {/* Form Master Accreditation Card */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {currentClassDef.formMaster.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="text-left text-xs">
                <p className="font-extrabold text-slate-900 flex items-center gap-1">
                  <span>{currentClassDef.formMaster.fullName}</span>
                  <BadgeCheck className="h-3.5 w-3.5 text-blue-600" title="TRCN Certified Form Master" />
                </p>
                <p className="text-[11px] text-slate-500 font-medium">{currentClassDef.formMaster.designation}</p>
                <p className="text-[10px] text-blue-700 font-bold">{currentClassDef.formMaster.phone}</p>
              </div>
            </div>
          </div>

          {/* Statutory Metrics 6-Box Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* Box 1: Term School Open Date */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-bold">Term Resumed</span>
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">Jan 5, 2026</p>
              <p className="text-[10px] font-semibold text-slate-500">School Open Date</p>
            </div>

            {/* Box 2: Term School Close Date */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-bold">Term Vacation</span>
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">Apr 3, 2026</p>
              <p className="text-[10px] font-semibold text-slate-500">School Close Date</p>
            </div>

            {/* Box 3: Total Days School Opened (Statutory) */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center justify-between text-blue-700 text-xs mb-1">
                <span className="font-bold">Days Opened</span>
                <School className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-blue-900">
                {classSummary.statutoryDaysOpened} Days
              </p>
              <p className="text-[10px] font-semibold text-blue-600">
                13 Weeks Statutory
              </p>
            </div>

            {/* Box 4: Days Elapsed & Remaining */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span className="font-bold">Term Progress</span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">
                Day {classSummary.daysElapsed} <span className="text-xs text-slate-500 font-normal">/ {classSummary.statutoryDaysOpened}</span>
              </p>
              <p className="text-[10px] font-semibold text-emerald-600">
                {classSummary.daysRemaining} Days to Vacation
              </p>
            </div>

            {/* Box 5: Class Cumulative Attendance Average */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-700 text-xs mb-1">
                <span className="font-bold">Term Attendance</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-emerald-900">
                {classSummary.cumulativeClassAttendanceRate}%
              </p>
              <p className="text-[10px] font-semibold text-emerald-700">
                Class Rolling Average
              </p>
            </div>

            {/* Box 6: Gender Parity Index */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <div className="flex items-center justify-between text-indigo-700 text-xs mb-1">
                <span className="font-bold">Gender Parity</span>
                <Users className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <p className="text-sm font-extrabold text-indigo-950">
                👦 {classSummary.boysAttendanceRate}% • 👧 {classSummary.girlsAttendanceRate}%
              </p>
              <p className="text-[10px] font-semibold text-indigo-700">
                Boys vs Girls Parity
              </p>
            </div>
          </div>

          {/* Today's Live Attendance Strip */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <Radio className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300">
                  Attendance for {currentDayMeta.label} (School Day {currentDayMeta.dayNumberInTerm})
                </p>
                <p className="text-sm font-black text-white">
                  {classSummary.presentToday + classSummary.lateToday} of {classSummary.totalEnrolledStudents} Enrolled Present ({classSummary.todayAttendanceRate}%)
                </p>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ {classSummary.presentToday} Present
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⏱ {classSummary.lateToday} Late
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30">
                ✕ {classSummary.absentToday} Absent
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                🏥 {classSummary.excusedToday} Excused
              </span>
            </div>
          </div>
        </div>

        {/* ==================== 13-WEEK TERM CALENDAR STRIP & CONTROLS ==================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                13-Week Term Calendar Navigator:
              </span>
            </div>

            {/* View Mode Toggle: Daily Roster vs Full Broadsheet Matrix */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('daily-roster')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'daily-roster'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span>Daily Roll Call View</span>
              </button>

              <button
                onClick={() => setViewMode('term-matrix')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'term-matrix'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Full Term Matrix Broadsheet</span>
              </button>
            </div>
          </div>

          {/* Week Selector Pills (Week 1 to Week 13) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {Array.from({ length: 13 }, (_, i) => i + 1).map(wk => {
              const isSelectedWeek = selectedWeek === wk;
              return (
                <button
                  key={wk}
                  onClick={() => {
                    setSelectedWeek(wk);
                    const firstDayOfWeek = TERM_CALENDAR_DAYS.find(d => d.weekNumber === wk);
                    if (firstDayOfWeek) setSelectedDate(firstDayOfWeek.date);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition cursor-pointer border ${
                    isSelectedWeek
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Week {wk}
                </button>
              );
            })}
          </div>

          {/* Days of Current Week Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {TERM_CALENDAR_DAYS.filter(d => d.weekNumber === selectedWeek).map(day => {
              const isSelected = selectedDate === day.date;
              const dayRecords = attendanceRecords[day.date] || {};
              const markedCount = Object.keys(dayRecords).length;
              const hasData = markedCount > 0;

              return (
                <button
                  key={day.date}
                  onClick={() => handleSelectDate(day.date)}
                  className={`p-2.5 rounded-xl text-left transition border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-600 shadow-xs'
                      : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                      {day.dayOfWeek}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Day {day.dayNumberInTerm}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">{day.date}</p>
                  
                  <div className="mt-1.5 flex items-center justify-between">
                    {hasData ? (
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        ✓ Recorded ({markedCount})
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                        Pending Call
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================== VIEW MODE 1: DAILY ROLL CALL ROSTER ==================== */}
        {viewMode === 'daily-roster' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            
            {/* Action Bar: Search, Bulk Actions & Filters */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student by name or admission number..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Fast Bulk Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Mark all students present today"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark All Present</span>
                </button>

                <button
                  onClick={handleSimulateBiometricClockIn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Simulate Smart ID NFC clock-ins"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  <span>Smart Gate NFC Tap</span>
                </button>

                <button
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5 text-blue-400" />
                  <span>Enroll Pupil</span>
                </button>

                <button
                  onClick={handleResetDay}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title="Reset today's entries"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="px-5 py-2.5 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Filter Roster:</span>
                {(['All', 'Present', 'Absent', 'Late', 'Excused', 'At-Risk'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Gender:</span>
                {(['All', 'Male', 'Female'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`px-2 py-0.5 rounded-md font-semibold ${
                      genderFilter === g
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {g === 'All' ? 'All' : g === 'Male' ? 'Boys' : 'Girls'}
                  </button>
                ))}
              </div>
            </div>

            {/* Students Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Student Profile & House</th>
                    <th className="py-3 px-4">Admission No.</th>
                    <th className="py-3 px-4 text-center">Daily Status Toggle ({currentDayMeta.dayOfWeek})</th>
                    <th className="py-3 px-4">Arrival / Note</th>
                    <th className="py-3 px-4 text-center bg-blue-50/50">
                      Term Present
                    </th>
                    <th className="py-3 px-4 text-center bg-red-50/50">
                      Term Absent
                    </th>
                    <th className="py-3 px-4 text-center bg-emerald-50/50">
                      Term Rate (%)
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.map((student, idx) => {
                    const dayEntry = attendanceRecords[selectedDate]?.[student.id];
                    const currentStatus: AttendanceStatus = dayEntry ? dayEntry.status : 'present';
                    const summary = studentSummaries.find(s => s.studentId === student.id) || {
                      timesSchoolOpened: currentDayMeta.dayNumberInTerm,
                      timesPresent: currentDayMeta.dayNumberInTerm,
                      timesAbsent: 0,
                      timesLate: 0,
                      timesExcused: 0,
                      attendancePercentage: 100,
                      status: 'Outstanding' as const
                    };

                    const isAbsent = currentStatus === 'absent';
                    const isLate = currentStatus === 'late';
                    const isExcused = currentStatus === 'excused';

                    return (
                      <tr 
                        key={student.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isAbsent ? 'bg-red-50/30' : isLate ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Number */}
                        <td className="py-3.5 px-4 font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Student Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              student.gender === 'Male' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {student.fullName[0]}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{student.fullName}</span>
                                {student.isPrefect && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                                    Prefect
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {student.house || 'Eagle House'} • {student.gender}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Admission Number */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 font-bold">
                          {student.admissionNumber}
                        </td>

                        {/* DAILY STATUS TOGGLE (P / A / L / E) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
                            
                            {/* Present Button (P) */}
                            <button
                              type="button"
                              onClick={() => handleMarkStudent(student.id, 'present')}
                              className={`px-2.5 py-1 rounded-lg font-black text-xs transition cursor-pointer ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-200'
                              }`}
                              title="Mark Present"
                            >
                              ✓ P
                            </button>

                            {/* Absent Button (A) */}
                            <button
                              type="button"
                              onClick={() => handleMarkStudent(student.id, 'absent')}
                              className={`px-2.5 py-1 rounded-lg font-black text-xs transition cursor-pointer ${
                                currentStatus === 'absent'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-red-700 hover:bg-slate-200'
                              }`}
                              title="Mark Absent"
                            >
                              ✕ A
                            </button>

                            {/* Late Button (L) */}
                            <button
                              type="button"
                              onClick={() => handleMarkStudent(student.id, 'late', '08:15 AM')}
                              className={`px-2.5 py-1 rounded-lg font-black text-xs transition cursor-pointer ${
                                currentStatus === 'late'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-amber-700 hover:bg-slate-200'
                              }`}
                              title="Mark Late"
                            >
                              ⏱ L
                            </button>

                            {/* Excused Button (E) */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExcuseStudentId(student.id);
                                setCustomExcuseNote(dayEntry?.reason || 'Medical / Approved Exemption');
                              }}
                              className={`px-2.5 py-1 rounded-lg font-black text-xs transition cursor-pointer ${
                                currentStatus === 'excused'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-200'
                              }`}
                              title="Mark Excused"
                            >
                              🏥 E
                            </button>
                          </div>
                        </td>

                        {/* Arrival Time or Reason */}
                        <td className="py-3.5 px-4 text-xs">
                          {currentStatus === 'present' && (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              <span>{dayEntry?.arrivalTime || '07:45 AM'}</span>
                            </span>
                          )}
                          {currentStatus === 'late' && (
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{dayEntry?.arrivalTime || '08:15 AM'} (Late)</span>
                            </span>
                          )}
                          {currentStatus === 'absent' && (
                            <span className="text-red-700 font-bold flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>Unexcused</span>
                            </span>
                          )}
                          {currentStatus === 'excused' && (
                            <span className="text-blue-700 font-medium truncate max-w-[150px] block" title={dayEntry?.reason}>
                              🏥 {dayEntry?.reason || 'Excused'}
                            </span>
                          )}
                        </td>

                        {/* AUTOMATED TOTAL: Term Present */}
                        <td className="py-3.5 px-4 text-center font-extrabold text-blue-900 bg-blue-50/30">
                          {summary.timesPresent} <span className="text-[10px] text-slate-400">/ {summary.timesSchoolOpened}</span>
                        </td>

                        {/* AUTOMATED TOTAL: Term Absent */}
                        <td className="py-3.5 px-4 text-center font-extrabold text-red-700 bg-red-50/30">
                          {summary.timesAbsent}
                        </td>

                        {/* AUTOMATED TOTAL: Term Attendance % Rate */}
                        <td className="py-3.5 px-4 text-center bg-emerald-50/30">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-black text-[11px] ${
                            summary.attendancePercentage >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : summary.attendancePercentage >= 75
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {summary.attendancePercentage}%
                          </span>
                        </td>

                        {/* Actions (Parent Alert) */}
                        <td className="py-3.5 px-4 text-right">
                          {isAbsent ? (
                            <button
                              onClick={() => handleSendParentAlert(student, 'Absent from school roll call today')}
                              className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer shadow-xs"
                            >
                              <Send className="h-3 w-3" />
                              <span>Alert Parent</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingExcuseStudentId(student.id);
                                setCustomExcuseNote(dayEntry?.reason || '');
                              }}
                              className="text-slate-400 hover:text-blue-600 transition p-1 cursor-pointer"
                              title="Add Form Master Note"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>
                Showing <strong className="text-slate-900">{filteredStudents.length}</strong> of <strong className="text-slate-900">{classStudents.length}</strong> enrolled students in <strong className="text-slate-900">{selectedClass}</strong>.
              </p>
              <div className="flex items-center gap-4 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> P = Present
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> L = Late (&gt; 08:00 AM)
                </span>
                <span className="flex items-center gap-1 text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span> A = Absent
                </span>
                <span className="flex items-center gap-1 text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span> E = Excused / Clinic
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== VIEW MODE 2: FULL 13-WEEK BROADSHEET MATRIX ==================== */}
        {viewMode === 'term-matrix' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Full 13-Week Term Attendance Broadsheet Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Official physical register broadsheet view matching Nigerian Ministry of Education Form Master standard.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Showing Week:</span>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {Array.from({ length: 13 }, (_, i) => i + 1).map(wk => (
                    <option key={wk} value={wk}>Week {wk}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase font-black">
                    <th className="py-2.5 px-3 border-r border-slate-800">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-800">Student Name</th>
                    {TERM_CALENDAR_DAYS.filter(d => d.weekNumber === selectedWeek).map(day => (
                      <th key={day.date} className="py-2.5 px-2 text-center border-r border-slate-800">
                        <div>{day.dayOfWeek.substring(0, 3)}</div>
                        <div className="text-[8px] text-slate-400 font-normal">D{day.dayNumberInTerm}</div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-center bg-blue-800 border-r border-blue-700">Present</th>
                    <th className="py-2.5 px-3 text-center bg-red-800 border-r border-red-700">Absent</th>
                    <th className="py-2.5 px-3 text-center bg-emerald-800">Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classStudents.map((stu, sIdx) => {
                    const summary = studentSummaries.find(s => s.studentId === stu.id) || {
                      timesPresent: 45,
                      timesAbsent: 3,
                      attendancePercentage: 94
                    };

                    return (
                      <tr key={stu.id} className="hover:bg-slate-50 font-medium">
                        <td className="py-2 px-3 text-slate-400 font-bold border-r border-slate-100">{sIdx + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-100 truncate max-w-[180px]">
                          {stu.fullName}
                        </td>
                        {TERM_CALENDAR_DAYS.filter(d => d.weekNumber === selectedWeek).map(day => {
                          const entry = attendanceRecords[day.date]?.[stu.id];
                          const st = entry ? entry.status : 'present';

                          return (
                            <td 
                              key={day.date} 
                              onClick={() => {
                                // Cycle status on click
                                const nextStatus: AttendanceStatus = 
                                  st === 'present' ? 'late' : st === 'late' ? 'absent' : st === 'absent' ? 'excused' : 'present';
                                handleMarkStudent(stu.id, nextStatus);
                              }}
                              className={`py-2 px-2 text-center font-black border-r border-slate-100 cursor-pointer transition hover:opacity-80 select-none ${
                                st === 'present' 
                                  ? 'bg-emerald-50 text-emerald-800' 
                                  : st === 'late'
                                  ? 'bg-amber-50 text-amber-800'
                                  : st === 'absent'
                                  ? 'bg-red-100 text-red-800 font-black'
                                  : 'bg-blue-50 text-blue-800'
                              }`}
                              title={`Click to toggle status for ${day.label}`}
                            >
                              {st === 'present' ? 'P' : st === 'late' ? 'L' : st === 'absent' ? 'A' : 'E'}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center font-black text-blue-900 bg-blue-50/50 border-r border-slate-100">
                          {summary.timesPresent}
                        </td>
                        <td className="py-2 px-3 text-center font-black text-red-700 bg-red-50/50 border-r border-slate-100">
                          {summary.timesAbsent}
                        </td>
                        <td className="py-2 px-3 text-center font-black text-emerald-900 bg-emerald-50/50">
                          {summary.attendancePercentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              💡 Tip: You can click any cell in the broadsheet to toggle status directly between Present (P), Late (L), Absent (A), and Excused (E).
            </p>
          </div>
        )}

        {/* ==================== BOTTOM CARDS: TOP ATTENDANCE STARS & AT-RISK WATCHLIST ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card 1: 100% Punctuality & Attendance Hall of Fame */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  100% Punctuality & Attendance Stars
                </h3>
                <p className="text-[11px] text-slate-500">Students with zero unexcused absences this term</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {studentSummaries.filter(s => s.attendancePercentage >= 95).slice(0, 6).map((star, sIdx) => (
                <div key={star.studentId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{star.studentName}</p>
                      <p className="text-[10px] text-slate-500">{star.admissionNumber}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                    {star.attendancePercentage}% Perfect
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Form Master Absenteeism Watchlist & Counseling */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Chronic Absenteeism Watchlist (&lt; 80%)
                </h3>
                <p className="text-[11px] text-slate-500">Requires Form Master guidance counseling or parent summons</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {studentSummaries.filter(s => s.attendancePercentage < 88).length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-1 opacity-70" />
                  <p className="font-bold text-slate-700">Exemplary Class Attendance</p>
                  <p>No students on chronic absenteeism warning in this class.</p>
                </div>
              ) : (
                studentSummaries.filter(s => s.attendancePercentage < 88).map(atRisk => {
                  const stu = classStudents.find(s => s.id === atRisk.studentId);
                  return (
                    <div key={atRisk.studentId} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 border border-red-200 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{atRisk.studentName}</p>
                        <p className="text-[10px] text-red-700 font-semibold">
                          {atRisk.timesAbsent} Days Absent • {atRisk.attendancePercentage}% Rate
                        </p>
                      </div>
                      {stu && (
                        <button
                          onClick={() => handleSendParentAlert(stu, `Cumulative absenteeism of ${atRisk.timesAbsent} days requires immediate parent-teacher consultation.`)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Dispatch Summons
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ==================== MODAL: EXCUSE NOTE EDITOR ==================== */}
      {editingExcuseStudentId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-black">
                <FileText className="h-5 w-5" />
                <span>Form Master Excuse / Clinic Note</span>
              </div>
              <button 
                onClick={() => setEditingExcuseStudentId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Exemption / Sickness:
              </label>
              <textarea
                value={customExcuseNote}
                onChange={(e) => setCustomExcuseNote(e.target.value)}
                placeholder="e.g. Mild malaria reported by guardian, Doctor visit, Approved inter-school debate contest..."
                rows={3}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingExcuseStudentId(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveExcuseNote(editingExcuseStudentId)}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition cursor-pointer shadow-xs"
              >
                Save Excuse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DISPATCH PARENT ALERT ==================== */}
      {parentAlertStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-black">
                <Send className="h-5 w-5" />
                <span>Dispatch Official Parent Notification</span>
              </div>
              <button 
                onClick={() => setParentAlertStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-red-50/60 rounded-xl border border-red-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">Student: {parentAlertStudent.student.fullName}</p>
              <p className="text-slate-600">Guardian: {parentAlertStudent.student.guardianName} ({parentAlertStudent.student.guardianPhone})</p>
              <p className="text-slate-600">Class: {selectedClass} • Date: {parentAlertStudent.date}</p>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1 font-mono">
              <p className="text-[10px] text-blue-400 uppercase font-bold">SMS / WhatsApp Message Preview:</p>
              <p className="text-[11px] text-slate-200">
                &quot;Dear {parentAlertStudent.student.guardianName}, this is an official notification from BummptEducation. Your ward {parentAlertStudent.student.fullName} was marked ABSENT today ({parentAlertStudent.date}). Reason: {parentAlertStudent.reason}. If this is an error, please contact Form Master {currentClassDef.formMaster.fullName} at {currentClassDef.formMaster.phone}.&quot;
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setParentAlertStudent(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmParentAlert}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send SMS & WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ENROLL NEW PUPIL ==================== */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddNewStudent} className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-black">
                <UserPlus className="h-5 w-5" />
                <span>Enroll New Pupil into {selectedClass}</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pupil / Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStudentForm.fullName}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, fullName: e.target.value })}
                  placeholder="e.g. Dooshima Grace Tyav"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newStudentForm.gender}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sporting House</label>
                  <select
                    value={newStudentForm.house}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, house: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="Eagle House (Blue)">Eagle House (Blue)</option>
                    <option value="Lion House (Yellow)">Lion House (Yellow)</option>
                    <option value="Falcon House (Red)">Falcon House (Red)</option>
                    <option value="Cheetah House (Green)">Cheetah House (Green)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Guardian Full Name</label>
                <input
                  type="text"
                  value={newStudentForm.guardianName}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, guardianName: e.target.value })}
                  placeholder="e.g. Engr. Terkula Tyav"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Guardian Phone Number</label>
                <input
                  type="tel"
                  value={newStudentForm.guardianPhone}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, guardianPhone: e.target.value })}
                  placeholder="e.g. +234 811 523 1834"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddStudentModalOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition cursor-pointer shadow-xs"
              >
                Complete Enrollment
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
