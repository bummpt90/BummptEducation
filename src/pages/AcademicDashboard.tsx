import React, { useState, useEffect } from 'react';
import { 
  Student, 
  Subject, 
  AssessmentScore, 
  ClassLevel, 
  Term, 
  AcademicYear,
  StudentReportCard,
  SchoolArm,
  getSchoolArm
} from '../types';
import { 
  calculateGrade, 
  calculatePrimaryGrade, 
  getEarlyYearsMasteryBadge, 
  computeTotalCa, 
  computeTotalScore, 
  evaluatePromotionStatus 
} from '../utils/grading';
import { 
  Award, 
  FileSpreadsheet, 
  FileEdit, 
  BarChart3, 
  GraduationCap, 
  CheckCircle2, 
  Sparkles, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertCircle,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Star,
  Baby,
  BookOpen,
  School
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { NavigationPage } from '../types';

interface AcademicDashboardProps {
  students: Student[];
  subjects: Subject[];
  assessments: AssessmentScore[];
  initialTab?: 'reports' | 'broadsheet' | 'scoresheet' | 'analytics' | 'transcript' | 'promotions';
  initialClass?: ClassLevel;
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  onOpenReportCardModal: (student: Student, reportCard: StudentReportCard) => void;
  onOpenAiRemarkModal: (student: Student, reportCard: StudentReportCard) => void;
}

export const AcademicDashboard: React.FC<AcademicDashboardProps> = ({
  students,
  subjects,
  assessments,
  initialTab,
  initialClass,
  onNavigate,
  onOpenReportCardModal,
  onOpenAiRemarkModal,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'broadsheet' | 'scoresheet' | 'analytics' | 'transcript' | 'promotions'>(initialTab || 'reports');
  const [selectedArm, setSelectedArm] = useState<'All' | SchoolArm>('All');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(initialClass || 'SSS 2 Science');
  const [selectedTerm, setSelectedTerm] = useState<Term>('2nd Term');
  const [selectedSession, setSelectedSession] = useState<AcademicYear>('2025/2026');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('SUB-MAT');
  const [searchQuery, setSearchQuery] = useState('');

  // Current active arm based on selectedClass
  const currentArm = getSchoolArm(selectedClass);

  // Sync state when props change
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialClass) {
      setSelectedClass(initialClass);
      setSelectedArm(getSchoolArm(initialClass));
    }
  }, [initialClass]);

  // Editable scoresheet state for active subject and class
  const [localAssessments, setLocalAssessments] = useState<AssessmentScore[]>(assessments);
  const [saveMessage, setSaveMessage] = useState('');

  // Class list definition across all 3 arms
  const allClassLevels: { level: ClassLevel; arm: SchoolArm; label: string }[] = [
    // Kindergarten (KG 1 - 3)
    { level: 'KG 1', arm: 'kindergarten', label: 'KG 1 (Early Foundation • Age 2-3)' },
    { level: 'KG 2', arm: 'kindergarten', label: 'KG 2 (Montessori Discovery • Age 3-4)' },
    { level: 'KG 3', arm: 'kindergarten', label: 'KG 3 (Transition to Primary • Age 4-5)' },
    // Primary (Basic 1 - 6)
    { level: 'Basic 1', arm: 'primary', label: 'Basic 1 (Primary 1 - Foundation)' },
    { level: 'Basic 2', arm: 'primary', label: 'Basic 2 (Primary 2 - Elementary)' },
    { level: 'Basic 3', arm: 'primary', label: 'Basic 3 (Primary 3 - Lower Primary)' },
    { level: 'Basic 4', arm: 'primary', label: 'Basic 4 (Primary 4 - Middle Primary)' },
    { level: 'Basic 5', arm: 'primary', label: 'Basic 5 (Primary 5 - Upper Primary)' },
    { level: 'Basic 6', arm: 'primary', label: 'Basic 6 (Primary 6 - Common Entrance NCEE Lead)' },
    // Junior Secondary (JSS 1 - 3)
    { level: 'JSS 1', arm: 'secondary', label: 'JSS 1 (Junior Secondary Year 1)' },
    { level: 'JSS 2', arm: 'secondary', label: 'JSS 2 (Junior Secondary Year 2)' },
    { level: 'JSS 3', arm: 'secondary', label: 'JSS 3 (BECE / Junior WAEC / Checkpoint)' },
    // Senior Secondary (SSS 1 - 3)
    { level: 'SSS 1 Science', arm: 'secondary', label: 'SSS 1 Science' },
    { level: 'SSS 1 Arts', arm: 'secondary', label: 'SSS 1 Arts' },
    { level: 'SSS 1 Commercial', arm: 'secondary', label: 'SSS 1 Commercial' },
    { level: 'SSS 2 Science', arm: 'secondary', label: 'SSS 2 Science' },
    { level: 'SSS 2 Arts', arm: 'secondary', label: 'SSS 2 Arts' },
    { level: 'SSS 2 Commercial', arm: 'secondary', label: 'SSS 2 Commercial' },
    { level: 'SSS 3 Science', arm: 'secondary', label: 'SSS 3 Science (WAEC / NECO / IGCSE / SAT / JAMB)' },
    { level: 'SSS 3 Arts', arm: 'secondary', label: 'SSS 3 Arts (WAEC / NECO / IGCSE / SAT / JAMB)' },
    { level: 'SSS 3 Commercial', arm: 'secondary', label: 'SSS 3 Commercial (WAEC / NECO / IGCSE / SAT / JAMB)' }
  ];

  // Filter available classes when arm filter is toggled
  const filteredClasses = selectedArm === 'All'
    ? allClassLevels
    : allClassLevels.filter((c) => c.arm === selectedArm);

  // Filter students by selected class
  const classStudents = students.filter((s) => s.currentClass === selectedClass);

  // Filter subjects applicable for the selected class & arm
  const classSubjects = subjects.filter((s) => {
    if (s.arm && s.arm !== currentArm) return false;
    if (currentArm === 'kindergarten') return s.category === 'Early Learning';
    if (currentArm === 'primary') return s.category === 'Primary Basic';
    
    // Secondary levels
    if (selectedClass.startsWith('JSS')) return s.applicableLevels.includes('JSS');
    if (selectedClass.includes('Science')) return s.applicableLevels.includes('SSS_Science');
    if (selectedClass.includes('Arts')) return s.applicableLevels.includes('SSS_Arts');
    if (selectedClass.includes('Commercial')) return s.applicableLevels.includes('SSS_Commercial');
    return true;
  });

  // Ensure selectedSubjectId is valid for current class
  useEffect(() => {
    if (classSubjects.length > 0) {
      const exists = classSubjects.some((s) => s.id === selectedSubjectId);
      if (!exists) {
        setSelectedSubjectId(classSubjects[0].id);
      }
    }
  }, [selectedClass, classSubjects, selectedSubjectId]);

  // Helper to get or create report card for a student
  const getStudentReportCard = (student: Student): StudentReportCard => {
    const studentScores = localAssessments.filter(
      (a) => a.studentId === student.id && a.term === selectedTerm
    );

    const stuArm = student.arm || currentArm;

    // Fallback if demo scores empty
    const effectiveScores = studentScores.length > 0 ? studentScores : classSubjects.map((sub) => {
      const baseCa = 35;
      const baseExam = 50;
      const total = baseCa + baseExam;
      const grade = stuArm === 'primary' 
        ? calculatePrimaryGrade(total).grade 
        : calculateGrade(total).grade;

      return {
        studentId: student.id,
        subjectId: sub.id,
        classLevel: selectedClass,
        term: selectedTerm,
        academicYear: selectedSession,
        ca1: 9,
        ca2: 9,
        assignment: 8.5,
        attendance: 8.5,
        totalCa: baseCa,
        examScore: baseExam,
        totalScore: total,
        grade,
        remark: 'Very Good grasp of curriculum concepts',
      };
    });

    const totalScoreObtained = effectiveScores.reduce((acc, curr) => acc + curr.totalScore, 0);
    const totalPossibleScore = effectiveScores.length * 100;
    const overallPercentage = totalPossibleScore > 0 ? Math.round((totalScoreObtained / totalPossibleScore) * 1000) / 10 : 0;

    let tutorRemark = '';
    let principalRemark = '';

    if (stuArm === 'kindergarten') {
      tutorRemark = `${student.fullName} has made wonderful progress in phonic blending, sensory discovery, and classroom etiquette.`;
      principalRemark = 'Remarkable early childhood milestones achieved. Ready for continuous learning.';
    } else if (stuArm === 'primary') {
      tutorRemark = `${student.fullName} is an active and conscientious pupil with high proficiency in numeracy and English.`;
      principalRemark = 'Commendable academic progress. Promoted with praise.';
    } else {
      tutorRemark = student.id === 'STU-001' 
        ? 'An exceptional, highly focused performance. Displays remarkable leadership and mastery in all subjects.' 
        : 'Good effort and active participation. Keep working hard to maintain high credit standing.';
      principalRemark = 'Outstanding scholarly achievement. Keep up the high standard.';
    }

    return {
      id: `RC-${student.id}-${selectedTerm}`,
      studentId: student.id,
      arm: stuArm,
      classLevel: selectedClass,
      term: selectedTerm,
      academicYear: selectedSession,
      scores: effectiveScores,
      totalScoreObtained,
      totalPossibleScore,
      overallPercentage,
      classAverage: 74.2,
      positionInClass: student.id === 'STU-001' || student.id === 'STU-KG-001' || student.id === 'STU-PRI-001' ? 1 : 2,
      totalStudentsInClass: Math.max(classStudents.length, 15),
      psychomotor: {
        punctuality: 5,
        neatness: 5,
        politeness: 5,
        honesty: 5,
        peerRelationship: 4,
        leadership: student.isPrefect ? 5 : 4,
        handwriting: 4,
        sportsAndGames: 4,
        craftsAndPractical: 4,
        attentiveness: 5,
      },
      attendancePresent: 58,
      attendanceTotalDays: 60,
      formTutorRemark: tutorRemark,
      formTutorName: stuArm === 'kindergarten' ? 'Miss Rita Iorfa' : stuArm === 'primary' ? 'Mr. Moses Aondo' : 'Mrs. Blessing Aondoaver',
      principalRemark: principalRemark,
      principalName: stuArm === 'kindergarten' ? 'Mrs. Abigail Balogun' : stuArm === 'primary' ? 'Mrs. Grace Iveren Shima' : 'Dr. (Mrs.) Grace Nkechi Okafor',
      promotionalStatus: 'Promoted to Next Class',
      nextTermBegins: 'Monday 4th May, 2026',
    };
  };

  // Handle live score change in scoresheet
  const handleScoreChange = (
    studentId: string,
    field: 'ca1' | 'ca2' | 'assignment' | 'attendance' | 'examScore',
    value: number
  ) => {
    setLocalAssessments((prev) => {
      const existingIdx = prev.findIndex(
        (a) => a.studentId === studentId && a.subjectId === selectedSubjectId && a.term === selectedTerm
      );

      const current = existingIdx >= 0 ? prev[existingIdx] : {
        studentId,
        subjectId: selectedSubjectId,
        classLevel: selectedClass,
        term: selectedTerm,
        academicYear: selectedSession,
        ca1: 0,
        ca2: 0,
        assignment: 0,
        attendance: 0,
        totalCa: 0,
        examScore: 0,
        totalScore: 0,
        grade: 'F9' as const,
        remark: 'Fail',
      };

      const updated = { ...current, [field]: Number(value) || 0 };
      const totalCa = computeTotalCa(updated.ca1, updated.ca2, updated.assignment, updated.attendance);
      const totalScore = computeTotalScore(totalCa, updated.examScore);
      
      let grade = '';
      let remark = '';

      if (currentArm === 'primary') {
        const pGrade = calculatePrimaryGrade(totalScore);
        grade = pGrade.grade;
        remark = pGrade.remark;
      } else {
        const sGrade = calculateGrade(totalScore);
        grade = sGrade.grade;
        remark = sGrade.remark;
      }

      updated.totalCa = totalCa;
      updated.totalScore = totalScore;
      updated.grade = grade as any;
      updated.remark = remark;

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = updated;
        return next;
      } else {
        return [...prev, updated];
      }
    });
  };

  const handleSaveScoresheet = () => {
    setSaveMessage('Scores successfully locked & committed to BummptEducation central examination registry!');
    setTimeout(() => setSaveMessage(''), 4000);
  };

  // Leadership & Examination Info Banner depending on currentArm
  const getArmHeaderBadge = () => {
    if (currentArm === 'kindergarten') {
      return {
        badge: 'Early Childhood & Kindergarten Wing (KG 1 - 3)',
        subHead: 'Head of Early Childhood: Mrs. Abigail Folashade Balogun (M.Ed)',
        examInfo: 'Montessori Competency Framework & Early Learning Milestones (Phonics, Numeracy, Motor Skills)',
        color: 'border-purple-300 bg-purple-50 text-purple-900',
        badgeColor: 'bg-purple-600 text-white'
      };
    }
    if (currentArm === 'primary') {
      return {
        badge: 'Primary School / Basic Education Wing (Basic 1 - 6)',
        subHead: 'Headmistress: Mrs. Grace Iveren Shima (M.Ed)',
        examInfo: 'Universal Basic Education (UBE) & National Common Entrance (NCEE) Preparation (CA 40% + Exam 60%)',
        color: 'border-emerald-300 bg-emerald-50 text-emerald-900',
        badgeColor: 'bg-emerald-600 text-white'
      };
    }
    return {
      badge: 'Secondary College Wing (JSS 1 - SSS 3)',
      subHead: 'Principal: Dr. (Mrs.) Grace Nkechi Okafor (Ph.D) • VP Academics: Mr. Emmanuel Iorfa',
      examInfo: 'WAEC WASSCE, NECO SSCE, Cambridge IGCSE, SAT & JAMB UTME Accredited Center No: 028491',
      color: 'border-blue-300 bg-blue-50 text-blue-900',
      badgeColor: 'bg-blue-600 text-white'
    };
  };

  const armHeader = getArmHeaderBadge();

  // Grade distribution data for analytics
  const gradeDistributionData = currentArm === 'primary' ? [
    { grade: 'A+ (90-100%)', count: 12, fill: '#7C3AED' },
    { grade: 'A (80-89%)', count: 18, fill: '#10B981' },
    { grade: 'B (70-79%)', count: 15, fill: '#2563EB' },
    { grade: 'C (60-69%)', count: 10, fill: '#06B6D4' },
    { grade: 'D (50-59%)', count: 4, fill: '#F59E0B' },
    { grade: 'E-F (<50%)', count: 1, fill: '#EF4444' },
  ] : [
    { grade: 'A1 (80-100%)', count: 18, fill: '#10B981' },
    { grade: 'B2 (75-79%)', count: 14, fill: '#059669' },
    { grade: 'B3 (70-74%)', count: 19, fill: '#2563EB' },
    { grade: 'C4-C6 (50-69%)', count: 26, fill: '#06B6D4' },
    { grade: 'D7-E8 (40-49%)', count: 6, fill: '#F59E0B' },
    { grade: 'F9 (0-39%)', count: 2, fill: '#EF4444' },
  ];

  const subjectAverageData = currentArm === 'kindergarten' ? [
    { subject: 'Phonics & Sounds', average: 92.4 },
    { subject: 'Early Numeracy', average: 89.1 },
    { subject: 'Fine Motor Skills', average: 86.5 },
    { subject: 'Social Etiquette', average: 94.0 },
    { subject: 'Sensory Discovery', average: 88.0 },
    { subject: 'Creative Arts', average: 90.5 }
  ] : currentArm === 'primary' ? [
    { subject: 'English Studies', average: 84.2 },
    { subject: 'Mathematics', average: 82.5 },
    { subject: 'Basic Science', average: 79.8 },
    { subject: 'Quant Reasoning', average: 88.0 },
    { subject: 'Verbal Reasoning', average: 85.4 },
    { subject: 'Coding & Robotics', average: 91.2 },
    { subject: 'Social Studies', average: 83.0 }
  ] : [
    { subject: 'Mathematics', average: 78.4 },
    { subject: 'English', average: 81.2 },
    { subject: 'Physics', average: 74.8 },
    { subject: 'Chemistry', average: 76.5 },
    { subject: 'Biology', average: 79.1 },
    { subject: 'ICT/Comp', average: 88.6 },
    { subject: 'Economics', average: 72.0 },
    { subject: 'Civic Ed', average: 83.5 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="academic-dashboard-root">
      
      {/* ==================== MULTI-ARM SWITCHER HEADER BANNER ==================== */}
      <div className="rounded-2xl border bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${armHeader.badgeColor}`}>
                {currentArm} arm
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                Controlled by General Administrator: Matthew Ternenge Beeun
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Multi-Arm Academic & Assessment Controller
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Unified educational management connecting Kindergarten (KG 1–3), Primary (Basic 1–6), and Secondary (JSS 1–SSS 3).
            </p>
          </div>

          {/* School Arm Fast Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedArm('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedArm === 'All' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Arms
            </button>
            <button
              onClick={() => {
                setSelectedArm('kindergarten');
                setSelectedClass('KG 3');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedArm === 'kindergarten' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-900 hover:bg-purple-100'
              }`}
            >
              <Baby className="h-3.5 w-3.5" />
              Kindergarten (KG 1-3)
            </button>
            <button
              onClick={() => {
                setSelectedArm('primary');
                setSelectedClass('Basic 6');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedArm === 'primary' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Primary (Basic 1-6)
            </button>
            <button
              onClick={() => {
                setSelectedArm('secondary');
                setSelectedClass('SSS 2 Science');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedArm === 'secondary' ? 'bg-blue-700 text-white shadow-xs' : 'text-blue-900 hover:bg-blue-100'
              }`}
            >
              <School className="h-3.5 w-3.5" />
              Secondary (JSS & SSS)
            </button>
          </div>
        </div>

        {/* Arm Specific Sub-Head & Exam Accreditation Notice */}
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${armHeader.color}`}>
          <div className="space-y-0.5">
            <span className="font-bold block text-slate-900">{armHeader.badge}</span>
            <span className="font-semibold text-slate-700">{armHeader.subHead}</span>
          </div>
          <div className="sm:text-right">
            <span className="text-[11px] font-mono font-bold block">{armHeader.examInfo}</span>
          </div>
        </div>

        {/* Class & Term Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Active Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:border-blue-500"
                id="select-class-filter"
              >
                {filteredClasses.map((c) => (
                  <option key={c.level} value={c.level}>
                    [{c.arm.toUpperCase()}] {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Term:</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value as Term)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs focus:outline-none"
                id="select-term-filter"
              >
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term (Active)</option>
                <option value="3rd Term">3rd Term (Promotional)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Academic Year:</label>
              <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-200">
                {selectedSession}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Enrolled in {selectedClass}: <strong className="text-slate-900">{classStudents.length} Students/Pupils</strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('reports')}
          id="tab-reports-btn"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Terminal Report Cards</span>
        </button>

        <button
          onClick={() => setActiveTab('broadsheet')}
          id="tab-broadsheet-btn"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'broadsheet'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Class Master Broadsheet</span>
        </button>

        <button
          onClick={() => setActiveTab('scoresheet')}
          id="tab-scoresheet-btn"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'scoresheet'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileEdit className="h-4 w-4" />
          <span>Scoresheet & Marks Entry (40% CA / 60% Exam)</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          id="tab-analytics-btn"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Performance Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          id="tab-promotions-btn"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'promotions'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Promotions & Transitions</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          id="tab-transcript-btn"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'transcript'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Academic Transcript</span>
        </button>
      </div>

      {/* ==================== TAB 1: TERMINAL REPORT CARD GENERATOR ==================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Student Terminal Reports for {selectedClass} ({selectedTerm})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Generate official stamped terminal reports with AI remark assistance tailored for {currentArm.toUpperCase()}.
              </p>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidate name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 w-64 shadow-xs"
              />
            </div>
          </div>

          {classStudents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Award className="h-12 w-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">No student records registered for {selectedClass}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Please select another class from the filter or enroll new pupils into this arm via the Admin Admissions portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classStudents
                .filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((student) => {
                  const report = getStudentReportCard(student);
                  return (
                    <div
                      key={student.id}
                      className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {student.admissionNumber}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-1">{student.fullName}</h4>
                            <span className="text-[11px] text-slate-500 font-medium">{student.currentClass} • {student.house}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            currentArm === 'kindergarten' ? 'bg-purple-100 text-purple-800' :
                            currentArm === 'primary' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {currentArm}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] block">Average</span>
                            <strong className="text-blue-900 font-black">{report.overallPercentage}%</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Position</span>
                            <strong className="text-emerald-700 font-black">{report.positionInClass === 1 ? '1st' : `${report.positionInClass}th`}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Attendance</span>
                            <strong className="text-slate-800 font-bold">{report.attendancePresent}/{report.attendanceTotalDays}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => onOpenReportCardModal(student, report)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Official Report</span>
                        </button>
                        <button
                          onClick={() => onOpenAiRemarkModal(student, report)}
                          title="Generate AI Pedagogical Remark"
                          className="p-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                        >
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: CLASS MASTER BROADSHEET ==================== */}
      {activeTab === 'broadsheet' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Master Broadsheet Matrix • {selectedClass} ({selectedTerm} - {selectedSession})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Central multi-subject evaluation broadsheet. Certified for internal audits and ministry inspections.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Broadsheet</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3 border-r border-slate-800">#</th>
                  <th className="p-3 border-r border-slate-800">Admission No</th>
                  <th className="p-3 border-r border-slate-800 min-w-[180px]">Student / Pupil Full Name</th>
                  {classSubjects.map((sub) => (
                    <th key={sub.id} className="p-3 text-center border-r border-slate-800 min-w-[70px]">
                      {sub.code}
                    </th>
                  ))}
                  <th className="p-3 text-center bg-blue-950 border-r border-slate-800">Total</th>
                  <th className="p-3 text-center bg-blue-900 border-r border-slate-800">Avg %</th>
                  <th className="p-3 text-center bg-emerald-900 border-r border-slate-800">Pos</th>
                  <th className="p-3 text-center">Promotional Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classStudents.map((student, idx) => {
                  const report = getStudentReportCard(student);
                  const promo = evaluatePromotionStatus(
                    report.scores.map(s => ({ subjectId: s.subjectId, totalScore: s.totalScore, grade: s.grade })),
                    selectedClass
                  );

                  return (
                    <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-800 border-r border-slate-200">{student.admissionNumber}</td>
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-200">{student.fullName}</td>
                      {classSubjects.map((sub) => {
                        const scoreObj = report.scores.find(s => s.subjectId === sub.id);
                        const score = scoreObj ? scoreObj.totalScore : 75;
                        const grade = scoreObj ? scoreObj.grade : 'B';
                        return (
                          <td key={sub.id} className="p-2.5 text-center font-mono border-r border-slate-200">
                            <span className="font-bold text-slate-900 block">{score}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{grade}</span>
                          </td>
                        );
                      })}
                      <td className="p-3 text-center font-mono font-black text-blue-900 bg-blue-50/40 border-r border-slate-200">
                        {report.totalScoreObtained}
                      </td>
                      <td className="p-3 text-center font-mono font-black text-blue-900 bg-blue-100/40 border-r border-slate-200">
                        {report.overallPercentage}%
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-800 border-r border-slate-200">
                        {report.positionInClass === 1 ? '1st' : report.positionInClass === 2 ? '2nd' : `${report.positionInClass}th`}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {promo.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SCORESHEET & MARKS ENTRY ==================== */}
      {activeTab === 'scoresheet' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50/60 p-4 rounded-2xl border border-blue-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Subject Scoresheet Entry • {selectedClass} ({selectedTerm})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Input CA components (CA1: 10, CA2: 10, Assignment: 10, Attendance: 10) + Terminal Exam: 60.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Subject:</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 shadow-xs focus:outline-none"
                  id="scoresheet-subject-selector"
                >
                  {classSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveScoresheet}
                id="save-scoresheet-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Commit & Lock Scores</span>
              </button>
            </div>
          </div>

          {saveMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {saveMessage}
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-3 border-r border-slate-200">#</th>
                  <th className="p-3 border-r border-slate-200">Admission No</th>
                  <th className="p-3 border-r border-slate-200 min-w-[180px]">Candidate Full Name</th>
                  <th className="p-3 text-center border-r border-slate-200">CA 1 (10)</th>
                  <th className="p-3 text-center border-r border-slate-200">CA 2 (10)</th>
                  <th className="p-3 text-center border-r border-slate-200">Assign (10)</th>
                  <th className="p-3 text-center border-r border-slate-200">Attnd (10)</th>
                  <th className="p-3 text-center bg-blue-50 font-bold border-r border-slate-200">Total CA (40)</th>
                  <th className="p-3 text-center bg-amber-50 font-bold border-r border-slate-200">Exam (60)</th>
                  <th className="p-3 text-center bg-indigo-50 font-black border-r border-slate-200">Total (100)</th>
                  <th className="p-3 text-center border-r border-slate-200">Grade</th>
                  <th className="p-3">Educator Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classStudents.map((student, idx) => {
                  const scoreRecord = localAssessments.find(
                    (a) => a.studentId === student.id && a.subjectId === selectedSubjectId && a.term === selectedTerm
                  ) || {
                    ca1: 8,
                    ca2: 8,
                    assignment: 8,
                    attendance: 8,
                    totalCa: 32,
                    examScore: 48,
                    totalScore: 80,
                    grade: currentArm === 'primary' ? 'A' : 'A1',
                    remark: 'Excellent',
                  };

                  return (
                    <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-800 border-r border-slate-200">{student.admissionNumber}</td>
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-200">{student.fullName}</td>
                      
                      <td className="p-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          max={10}
                          min={0}
                          value={scoreRecord.ca1}
                          onChange={(e) => handleScoreChange(student.id, 'ca1', Number(e.target.value))}
                          className="w-14 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          max={10}
                          min={0}
                          value={scoreRecord.ca2}
                          onChange={(e) => handleScoreChange(student.id, 'ca2', Number(e.target.value))}
                          className="w-14 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          max={10}
                          min={0}
                          value={scoreRecord.assignment}
                          onChange={(e) => handleScoreChange(student.id, 'assignment', Number(e.target.value))}
                          className="w-14 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          max={10}
                          min={0}
                          value={scoreRecord.attendance}
                          onChange={(e) => handleScoreChange(student.id, 'attendance', Number(e.target.value))}
                          className="w-14 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                        />
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-blue-900 bg-blue-50/40 border-r border-slate-200">
                        {scoreRecord.totalCa}
                      </td>

                      <td className="p-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          max={60}
                          min={0}
                          value={scoreRecord.examScore}
                          onChange={(e) => handleScoreChange(student.id, 'examScore', Number(e.target.value))}
                          className="w-16 rounded-lg border border-amber-300 bg-amber-50/40 p-1 text-center font-mono font-bold text-amber-950 focus:border-amber-500 focus:outline-none"
                        />
                      </td>

                      <td className="p-3 text-center font-mono font-black text-indigo-900 bg-indigo-50/40 border-r border-slate-200">
                        {scoreRecord.totalScore}
                      </td>

                      <td className="p-3 text-center font-bold border-r border-slate-200">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                          {scoreRecord.grade}
                        </span>
                      </td>

                      <td className="p-3 text-slate-700 text-[11px] italic">
                        {scoreRecord.remark}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: PERFORMANCE ANALYTICS ==================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  {currentArm === 'primary' ? 'Primary Grade Distribution (A+ to F)' : 'WAEC/NECO Grade Distribution (A1 to F9)'}
                </h4>
                <span className="text-xs text-slate-500 font-medium">{selectedClass}</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistributionData}>
                    <XAxis dataKey="grade" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]}>
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  Subject Mean Score Performance (%)
                </h4>
                <span className="text-xs text-slate-500 font-medium">{selectedClass}</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectAverageData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                    <YAxis dataKey="subject" type="category" stroke="#64748b" fontSize={11} width={90} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: PROMOTIONS & TRANSITIONS ==================== */}
      {activeTab === 'promotions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md space-y-2">
            <h3 className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Automated Academic Promotion & Transition Decision Engine
            </h3>
            <p className="text-xs text-blue-100 leading-relaxed max-w-3xl">
              Evaluates student qualification for standard promotion, promotional trial, repeat conditions, or transition certifications (KG 3 to Basic 1, Basic 6 NCEE eligibility, and SSS 3 WAEC/NECO/IGCSE/SAT/JAMB eligibility).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classStudents.map((student) => {
              const report = getStudentReportCard(student);
              const promo = evaluatePromotionStatus(
                report.scores.map(s => ({ subjectId: s.subjectId, totalScore: s.totalScore, grade: s.grade })),
                selectedClass
              );

              return (
                <div key={student.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{student.fullName}</h4>
                      <span className="text-[11px] font-mono text-slate-500">{student.admissionNumber}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {report.overallPercentage}% Avg
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-600">Decision Status:</span>
                      <strong className="text-emerald-700">{promo.status}</strong>
                    </div>
                    <p className="text-[11px] text-slate-600 italic leading-relaxed pt-1 border-t border-slate-200">
                      {promo.reason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 6: ACADEMIC TRANSCRIPT ==================== */}
      {activeTab === 'transcript' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-2">
            <h3 className="text-base font-bold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-400" />
              Comprehensive Multi-Year Academic Transcript
            </h3>
            <p className="text-xs text-slate-300">
              Official institutional transcripts summarizing student performance across all terms and sessions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Select Student for Official Transcript Generation</h4>
                <p className="text-xs text-slate-500">Includes authenticated seals from General Administrator and School Registrar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    const rc = getStudentReportCard(student);
                    onOpenReportCardModal(student, rc);
                  }}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition text-left cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {student.admissionNumber}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {student.arm}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">{student.fullName}</h5>
                  <p className="text-xs text-slate-500 mt-1">{student.currentClass} • Enrolled {student.dateEnrolled}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
