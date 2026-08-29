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
  getSchoolArm,
  AffectiveDomain,
  PsychomotorDomain,
  EarlyYearsMilestone
} from '../types';
import { 
  calculateGrade, 
  calculatePrimaryGrade, 
  getEarlyYearsMasteryBadge, 
  computeTotalCa, 
  computeTotalScore, 
  evaluatePromotionStatus,
  getDomainRatingDescription,
  calculateGpa
} from '../utils/grading';
import { downloadReportCardAsPDF } from '../utils/pdfGenerator';
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
  School,
  HeartHandshake,
  UserCheck,
  Activity,
  Save,
  Edit3,
  ChevronUp,
  Check,
  CheckCheck,
  List,
  LayoutGrid,
  ArrowUpDown,
  Calculator,
  ArrowRight,
  Table,
  Plus,
  Undo2,
  ListFilter,
  Sliders,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ShieldAlert
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
import { WingAccessGatekeeper } from '../components/WingAccessGatekeeper';
import { AccessManagementModal } from '../components/AccessManagementModal';
import { 
  getStoredSession, 
  saveStoredSession, 
  getGlobalReportCardPublicationStatus, 
  setGlobalReportCardPublicationStatus,
  IssuedPasskey 
} from '../utils/securityContext';

interface AcademicDashboardProps {
  students: Student[];
  subjects: Subject[];
  assessments: AssessmentScore[];
  initialTab?: 'reports' | 'domains' | 'broadsheet' | 'scoresheet' | 'analytics' | 'transcript' | 'promotions';
  initialClass?: ClassLevel;
  academicYear?: AcademicYear;
  onAcademicYearChange?: (year: AcademicYear) => void;
  selectedTerm?: Term;
  onTermChange?: (term: Term) => void;
  selectedClass?: ClassLevel;
  onClassChange?: (classLevel: ClassLevel) => void;
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
  academicYear = '2025/2026',
  onAcademicYearChange,
  selectedTerm: propSelectedTerm = '2nd Term',
  onTermChange,
  selectedClass: propSelectedClass,
  onClassChange,
  onNavigate,
  onOpenReportCardModal,
  onOpenAiRemarkModal,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'domains' | 'broadsheet' | 'scoresheet' | 'analytics' | 'transcript' | 'promotions'>(initialTab || 'reports');
  const [selectedArm, setSelectedArm] = useState<'All' | SchoolArm>('All');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(propSelectedClass || initialClass || 'SSS 2 Science');
  const [selectedTerm, setSelectedTerm] = useState<Term>(propSelectedTerm);
  const [selectedSession, setSelectedSession] = useState<AcademicYear>(academicYear);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('SUB-MAT');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Score Entry & At-a-glance controls
  const [scoresheetMode, setScoresheetMode] = useState<'by-subject' | 'by-student'>('by-subject');
  const [activeScoresheetStudentId, setActiveScoresheetStudentId] = useState<string>('');
  const [expandedScoresheetRowStudentId, setExpandedScoresheetRowStudentId] = useState<string | null>(null);
  const [showAllSubjectCards, setShowAllSubjectCards] = useState<boolean>(false);
  const [expandedCardStudentIds, setExpandedCardStudentIds] = useState<Record<string, boolean>>({});
  const [editingCardStudentIds, setEditingCardStudentIds] = useState<Record<string, boolean>>({});
  const [broadsheetInlineEdit, setBroadsheetInlineEdit] = useState<boolean>(false);

  // Current active arm based on selectedClass
  const currentArm = getSchoolArm(selectedClass);

  // Sync state when props change
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const nextClass = propSelectedClass || initialClass;
    if (nextClass && nextClass !== selectedClass) {
      setSelectedClass(nextClass);
      setSelectedArm(getSchoolArm(nextClass));
    }
  }, [propSelectedClass, initialClass]);

  useEffect(() => {
    if (propSelectedTerm && propSelectedTerm !== selectedTerm) {
      setSelectedTerm(propSelectedTerm);
    }
  }, [propSelectedTerm]);

  useEffect(() => {
    if (academicYear && academicYear !== selectedSession) {
      setSelectedSession(academicYear);
    }
  }, [academicYear]);

  const handleClassChange = (newClass: ClassLevel) => {
    setSelectedClass(newClass);
    setSelectedArm(getSchoolArm(newClass));
    onClassChange?.(newClass);
  };

  const handleTermChange = (newTerm: Term) => {
    setSelectedTerm(newTerm);
    onTermChange?.(newTerm);
  };

  const handleSessionChange = (newSession: AcademicYear) => {
    setSelectedSession(newSession);
    onAcademicYearChange?.(newSession);
  };

  // Editable scoresheet state for active subject and class
  const [localAssessments, setLocalAssessments] = useState<AssessmentScore[]>(assessments);
  const [saveMessage, setSaveMessage] = useState('');

  // Non-academic educational domains & remarks state mapped by student ID
  const [localDomains, setLocalDomains] = useState<Record<string, {
    affective: AffectiveDomain;
    psychomotor: PsychomotorDomain;
    sportsMasterRemark?: string;
    sportsMasterName?: string;
    guidanceCounselorRemark?: string;
    guidanceCounselorName?: string;
    formTutorRemark?: string;
    principalRemark?: string;
  }>>({});
  const [domainSaveMessage, setDomainSaveMessage] = useState('');

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

  // Ensure selectedSubjectId and activeScoresheetStudentId are valid for current class
  useEffect(() => {
    if (classSubjects.length > 0) {
      const exists = classSubjects.some((s) => s.id === selectedSubjectId);
      if (!exists) {
        setSelectedSubjectId(classSubjects[0].id);
      }
    }
  }, [selectedClass, classSubjects, selectedSubjectId]);

  useEffect(() => {
    if (classStudents.length > 0) {
      const exists = classStudents.some((s) => s.id === activeScoresheetStudentId);
      if (!exists) {
        setActiveScoresheetStudentId(classStudents[0].id);
      }
    }
  }, [selectedClass, classStudents, activeScoresheetStudentId]);

  // Helper to get or build deterministic single subject score
  const getSubjectScore = (studentId: string, subjectId: string): AssessmentScore => {
    const existing = localAssessments.find(
      (a) => a.studentId === studentId && a.subjectId === subjectId && a.term === selectedTerm
    );
    if (existing) return existing;

    const stu = students.find((s) => s.id === studentId);
    const stuArm = stu?.arm || currentArm;
    const isTopStudent = studentId === 'STU-001' || studentId === 'STU-KG-001' || studentId === 'STU-PRI-001';
    
    // Deterministic base marks based on student ID hash
    const charCode = studentId.charCodeAt(studentId.length - 1) || 0;
    const baseCa = isTopStudent ? 36 : 30 + (charCode % 7);
    const baseExam = isTopStudent ? 54 : 42 + ((charCode * 3) % 15);
    const total = baseCa + baseExam;
    
    const grade = stuArm === 'primary' 
      ? calculatePrimaryGrade(total).grade 
      : calculateGrade(total).grade;
    const remark = stuArm === 'primary'
      ? calculatePrimaryGrade(total).remark
      : calculateGrade(total).remark;

    return {
      studentId,
      subjectId,
      classLevel: selectedClass,
      term: selectedTerm,
      academicYear: selectedSession,
      ca1: Math.round(baseCa * 0.25 * 10) / 10,
      ca2: Math.round(baseCa * 0.25 * 10) / 10,
      assignment: Math.round(baseCa * 0.25 * 10) / 10,
      attendance: Math.round(baseCa * 0.25 * 10) / 10,
      totalCa: baseCa,
      examScore: baseExam,
      totalScore: total,
      grade: grade as any,
      remark,
    };
  };

  // Dynamically compute report cards and positions for all students in current class
  const classReportCards = React.useMemo(() => {
    // 1. Build preliminary report card with effective scores for each student
    const reports = classStudents.map((student) => {
      const stuArm = student.arm || currentArm;
      const effectiveScores = classSubjects.map((sub) => getSubjectScore(student.id, sub.id));

      const totalScoreObtained = effectiveScores.reduce((acc, curr) => acc + curr.totalScore, 0);
      const totalPossibleScore = effectiveScores.length * 100;
      const overallPercentage = totalPossibleScore > 0 
        ? Math.round((totalScoreObtained / totalPossibleScore) * 1000) / 10 
        : 0;

      return {
        student,
        effectiveScores,
        totalScoreObtained,
        totalPossibleScore,
        overallPercentage,
        gpa: calculateGpa(effectiveScores),
      };
    });

    // 2. Sort by totalScoreObtained descending to assign real rank
    const sorted = [...reports].sort((a, b) => b.totalScoreObtained - a.totalScoreObtained);
    const ranks = new Map<string, number>();
    sorted.forEach((item, index) => {
      ranks.set(item.student.id, index + 1);
    });

    const classAverageCalc = reports.length > 0
      ? Math.round((reports.reduce((acc, r) => acc + r.overallPercentage, 0) / reports.length) * 10) / 10
      : 74.2;

    // 3. Construct complete StudentReportCard
    const resultMap = new Map<string, StudentReportCard>();
    reports.forEach((item) => {
      const student = item.student;
      const stuArm = student.arm || currentArm;
      const studentDomain = localDomains[student.id];

      const tutorRemark = stuArm === 'kindergarten' 
        ? `${student.fullName} has made wonderful progress in phonic blending, sensory discovery, and classroom etiquette.`
        : stuArm === 'primary'
        ? `${student.fullName} is an active and conscientious pupil with high proficiency in numeracy and English.`
        : item.overallPercentage >= 80
        ? 'An exceptional, highly focused performance. Displays remarkable leadership, scholarship and discipline.'
        : 'Good effort and active participation. Keep working hard to maintain high credit standing across all modules.';

      const principalRemark = item.overallPercentage >= 80
        ? 'Outstanding scholarly achievement. Keep up the high standard.'
        : 'Commendable academic progress. Promoted with praise.';

      const affective: AffectiveDomain = studentDomain?.affective || {
        punctuality: 5,
        neatness: 5,
        politeness: 5,
        honesty: 5,
        peerRelationship: 4,
        leadership: student.isPrefect ? 5 : 4,
        emotionalStability: 4,
        obedience: 5,
        attentiveness: 5,
        perseverance: 4,
      };

      const psychomotor: PsychomotorDomain = studentDomain?.psychomotor || {
        handwriting: 4,
        sportsAndGames: 4,
        craftsAndPractical: 4,
        verbalFluency: 5,
        musicalDramatic: 4,
        handlingOfTools: 4,
        physicalAgility: 4,
      };

      const attendanceRecord = {
        timesSchoolOpened: 60,
        timesPresent: 58,
        timesAbsent: 2,
        timesPunctual: 56,
      };

      resultMap.set(student.id, {
        id: `RC-${student.id}-${selectedTerm}`,
        studentId: student.id,
        arm: stuArm,
        classLevel: selectedClass,
        term: selectedTerm,
        academicYear: selectedSession,
        scores: item.effectiveScores,
        totalScoreObtained: item.totalScoreObtained,
        totalPossibleScore: item.totalPossibleScore,
        overallPercentage: item.overallPercentage,
        classAverage: classAverageCalc,
        positionInClass: ranks.get(student.id) || 1,
        totalStudentsInClass: Math.max(classStudents.length, 1),
        affective,
        psychomotor,
        attendance: attendanceRecord,
        attendancePresent: attendanceRecord.timesPresent,
        attendanceTotalDays: attendanceRecord.timesSchoolOpened,
        formTutorRemark: studentDomain?.formTutorRemark || tutorRemark,
        formTutorName: stuArm === 'kindergarten' ? 'Miss Rita Iorfa' : stuArm === 'primary' ? 'Mr. Moses Aondo' : 'Mrs. Blessing Aondoaver',
        sportsMasterRemark: studentDomain?.sportsMasterRemark || `Active sporting participation in ${student.house}. Displays high athletic stamina and teamwork.`,
        sportsMasterName: studentDomain?.sportsMasterName || 'Coach Terkula Tyav (P.E. & Sports Lead)',
        guidanceCounselorRemark: studentDomain?.guidanceCounselorRemark || `${student.fullName} exhibits admirable emotional maturity, moral rectitude, and commendable focus on academic and personal aspirations.`,
        guidanceCounselorName: studentDomain?.guidanceCounselorName || 'Mrs. Comfort Agbo (Guidance & Counseling Head)',
        principalRemark: studentDomain?.principalRemark || principalRemark,
        principalName: stuArm === 'kindergarten' ? 'Mrs. Abigail Balogun' : stuArm === 'primary' ? 'Mrs. Grace Iveren Shima' : 'Dr. (Mrs.) Grace Nkechi Okafor',
        promotionalStatus: item.overallPercentage >= 50 ? 'Promoted to Next Class' : 'Repeat Class',
        nextTermBegins: 'Monday 4th May, 2026',
        approvalStatus: 'Approved & Published',
        gpa: item.gpa,
      });
    });

    return resultMap;
  }, [classStudents, classSubjects, localAssessments, selectedTerm, selectedClass, selectedSession, currentArm, localDomains]);

  // Helper to get or create report card for a student
  const getStudentReportCard = (student: Student): StudentReportCard => {
    const existing = classReportCards.get(student.id);
    if (existing) return existing;
    
    // Fallback if not yet in map
    const stuArm = student.arm || currentArm;
    return {
      id: `RC-${student.id}-${selectedTerm}`,
      studentId: student.id,
      arm: stuArm,
      classLevel: selectedClass,
      term: selectedTerm,
      academicYear: selectedSession,
      scores: classSubjects.map((sub) => getSubjectScore(student.id, sub.id)),
      totalScoreObtained: 800,
      totalPossibleScore: classSubjects.length * 100,
      overallPercentage: 80,
      classAverage: 74.2,
      positionInClass: 1,
      totalStudentsInClass: classStudents.length,
      affective: {
        punctuality: 5, neatness: 5, politeness: 5, honesty: 5,
        peerRelationship: 4, leadership: 4, emotionalStability: 4,
        obedience: 5, attentiveness: 5, perseverance: 4,
      },
      psychomotor: {
        handwriting: 4, sportsAndGames: 4, craftsAndPractical: 4,
        verbalFluency: 5, musicalDramatic: 4, handlingOfTools: 4, physicalAgility: 4,
      },
      attendance: {
        timesSchoolOpened: 60,
        timesPresent: 58,
        timesAbsent: 2,
        timesPunctual: 56,
      },
      attendancePresent: 58,
      attendanceTotalDays: 60,
      formTutorRemark: 'Satisfactory performance.',
      formTutorName: 'Mrs. Blessing Aondoaver',
      sportsMasterRemark: 'Good athletic participation.',
      sportsMasterName: 'Coach Terkula Tyav',
      guidanceCounselorRemark: 'Exhibits good character and moral focus.',
      guidanceCounselorName: 'Mrs. Comfort Agbo',
      principalRemark: 'Commendable result.',
      principalName: 'Dr. (Mrs.) Grace Nkechi Okafor',
      promotionalStatus: 'Promoted to Next Class',
      nextTermBegins: 'Monday 4th May, 2026',
      approvalStatus: 'Approved & Published',
      gpa: 4.5,
    };
  };

  // Universal score update handler: updates in localAssessments with live reactive total and grading
  const handleScoreChange = (
    studentId: string,
    subjectId: string,
    field: 'ca1' | 'ca2' | 'assignment' | 'attendance' | 'examScore' | 'totalCa',
    value: number
  ) => {
    setLocalAssessments((prev) => {
      const existingIdx = prev.findIndex(
        (a) => a.studentId === studentId && a.subjectId === subjectId && a.term === selectedTerm
      );

      const baseScore = existingIdx >= 0 ? prev[existingIdx] : getSubjectScore(studentId, subjectId);

      const updated = { ...baseScore, [field]: Number(value) || 0 };
      
      let totalCa = updated.totalCa;
      if (field === 'totalCa') {
        totalCa = Math.min(40, Math.max(0, Number(value) || 0));
        updated.totalCa = totalCa;
        // Distribute proportionally across sub-components
        updated.ca1 = Math.round(totalCa * 0.25 * 10) / 10;
        updated.ca2 = Math.round(totalCa * 0.25 * 10) / 10;
        updated.assignment = Math.round(totalCa * 0.25 * 10) / 10;
        updated.attendance = Math.round(totalCa * 0.25 * 10) / 10;
      } else if (['ca1', 'ca2', 'assignment', 'attendance'].includes(field)) {
        totalCa = computeTotalCa(updated.ca1, updated.ca2, updated.assignment, updated.attendance);
        updated.totalCa = totalCa;
      }

      const examScore = Math.min(60, Math.max(0, Number(updated.examScore) || 0));
      updated.examScore = examScore;
      
      const totalScore = computeTotalScore(totalCa, examScore);
      updated.totalScore = totalScore;

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

  // Access Control & Wing Restriction State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const sess = getStoredSession();
    return sess.isAcademicUnlocked;
  });
  const [authenticatedStaff, setAuthenticatedStaff] = useState<IssuedPasskey | null>(null);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState<boolean>(false);
  const [isParentUploadPublished, setIsParentUploadPublished] = useState<boolean>(() => getGlobalReportCardPublicationStatus());

  const handleLockWing = () => {
    setIsUnlocked(false);
    setAuthenticatedStaff(null);
    const sess = getStoredSession();
    saveStoredSession({ ...sess, isAcademicUnlocked: false });
  };

  const handleToggleParentUpload = () => {
    const next = !isParentUploadPublished;
    setIsParentUploadPublished(next);
    setGlobalReportCardPublicationStatus(next);
  };

  // If Wing is Locked, show Institutional Gatekeeper Barrier
  if (!isUnlocked) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WingAccessGatekeeper
          wing="academic"
          title="Academic Wing — Restricted Authorization Clearance"
          subtitle="Access to terminal report cards, master broadsheets, continuous assessment (40/60) scoresheets, and behavioral evaluations is restricted. Enter your authorized staff passkey issued by the Directorate of Academic Planning & Examination Board."
          onUnlockSuccess={(matchedPass) => {
            setIsUnlocked(true);
            setAuthenticatedStaff(matchedPass || null);
            const sess = getStoredSession();
            saveStoredSession({ ...sess, isAcademicUnlocked: true });
          }}
          onReturnHome={() => onNavigate?.('home')}
          onOpenPasskeyManager={() => setIsPasskeyModalOpen(true)}
        />

        <AccessManagementModal
          isOpen={isPasskeyModalOpen}
          onClose={() => setIsPasskeyModalOpen(false)}
          initialWingFilter="academic"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="academic-dashboard-root">
      
      {/* ==================== INSTITUTIONAL SECURITY CLEARANCE BAR ==================== */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-blue-800/60 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">
                CLEARANCE ACTIVE
              </span>
              <span className="text-xs font-bold text-slate-200">
                {authenticatedStaff ? `${authenticatedStaff.staffName} (${authenticatedStaff.role})` : 'Academic Board & Directorate Clearance'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Authorized access to live scoresheets, master broadsheets, student remark editors & parent upload switches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* Parent Upload Status Pill / Toggle */}
          <button
            onClick={handleToggleParentUpload}
            id="academic-toggle-parent-upload-btn"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
              isParentUploadPublished
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
            }`}
            title="Toggle whether parents can download report cards on the Parent Portal"
          >
            {isParentUploadPublished ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            <span>Parent Download: {isParentUploadPublished ? 'Uploaded & Published' : 'Draft / Restricted'}</span>
          </button>

          {/* Passkey Manager */}
          <button
            onClick={() => setIsPasskeyModalOpen(true)}
            id="academic-open-passkeys-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Staff Passkeys</span>
          </button>

          {/* Lock Wing */}
          <button
            onClick={handleLockWing}
            id="academic-lock-wing-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition cursor-pointer border border-white/20"
            title="Lock Academic Wing session"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Lock Wing</span>
          </button>
        </div>
      </div>

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
                handleClassChange('KG 3');
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
                handleClassChange('Basic 6');
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
                handleClassChange('SSS 2 Science');
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

        {/* Class, Term & Academic Year Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Active Class:</label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value as ClassLevel)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:border-blue-500 cursor-pointer"
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
                onChange={(e) => handleTermChange(e.target.value as Term)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                id="select-term-filter"
              >
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term (Active)</option>
                <option value="3rd Term">3rd Term (Promotional)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Academic Year:</label>
              <select
                value={selectedSession}
                onChange={(e) => handleSessionChange(e.target.value as AcademicYear)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                id="select-session-filter"
              >
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
              </select>
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
          onClick={() => setActiveTab('domains')}
          id="tab-domains-btn"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'domains'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <HeartHandshake className="h-4 w-4" />
          <span>Domain Assessment (Non-Academic Traits)</span>
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
                Generate official stamped terminal reports with comprehensive academic scores, affective/psychomotor domains, and multi-role comments for {currentArm.toUpperCase()}.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAllSubjectCards(!showAllSubjectCards)}
                id="toggle-all-subject-breakdown-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs border ${
                  showAllSubjectCards 
                    ? 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Table className="h-3.5 w-3.5" />
                <span>{showAllSubjectCards ? 'Collapse All Subject Scores' : 'Expand All Subject Scores At A Glance'}</span>
              </button>

              <button
                onClick={() => setActiveTab('scoresheet')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <FileEdit className="h-3.5 w-3.5" />
                <span>Scoresheet Entry</span>
              </button>

              <button
                onClick={() => setActiveTab('domains')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <HeartHandshake className="h-3.5 w-3.5" />
                <span>Evaluate Non-Academic Domains</span>
              </button>

              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search candidate name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 w-52 shadow-xs"
                />
              </div>
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
                  const isCardExpanded = showAllSubjectCards || !!expandedCardStudentIds[student.id];
                  const isCardEditing = !!editingCardStudentIds[student.id];

                  return (
                    <div
                      key={student.id}
                      className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
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

                        {/* Core Summary Metrics */}
                        <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                          <div>
                            <span className="text-slate-500 text-[10px] block">Average</span>
                            <strong className="text-blue-900 font-black">{report.overallPercentage}%</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Position</span>
                            <strong className="text-emerald-700 font-black">
                              {report.positionInClass === 1 ? '1st' : report.positionInClass === 2 ? '2nd' : report.positionInClass === 3 ? '3rd' : `${report.positionInClass}th`}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">GPA</span>
                            <strong className="text-purple-900 font-bold">{report.gpa?.toFixed(2) || '4.00'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] block">Attendance</span>
                            <strong className="text-slate-800 font-bold">{report.attendancePresent}/{report.attendanceTotalDays}</strong>
                          </div>
                        </div>

                        {/* Subject Scores At-A-Glance Panel */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Table className="h-3.5 w-3.5 text-blue-700" />
                              <span className="text-xs font-bold text-slate-800">
                                Subject Scores at a Glance ({report.scores.length} Subjects)
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingCardStudentIds(prev => ({ ...prev, [student.id]: !prev[student.id] }))}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition cursor-pointer border ${
                                  isCardEditing 
                                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                }`}
                                title="Edit scores directly on this card"
                              >
                                {isCardEditing ? 'Done Editing' : 'Edit Marks'}
                              </button>

                              <button
                                onClick={() => setExpandedCardStudentIds(prev => ({ ...prev, [student.id]: !prev[student.id] }))}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
                                title={isCardExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isCardExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>

                          {isCardEditing && (
                            <p className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200 font-medium">
                              ✏️ Editing mode enabled: Changing CA or Exam recalculates subject total, grade, and overall average in real time!
                            </p>
                          )}

                          {/* Scores List / Table */}
                          <div className={`space-y-1.5 ${isCardExpanded ? 'max-h-72 overflow-y-auto pr-1' : 'max-h-36 overflow-y-auto pr-1'}`}>
                            {report.scores.map((scoreObj) => {
                              const sub = subjects.find(s => s.id === scoreObj.subjectId);
                              const subName = sub ? sub.name : scoreObj.subjectId;
                              const subCode = sub ? sub.code : scoreObj.subjectId;

                              if (isCardEditing) {
                                return (
                                  <div key={scoreObj.subjectId} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] space-y-1 shadow-2xs">
                                    <div className="flex items-center justify-between font-bold text-slate-800">
                                      <span className="truncate max-w-[140px]" title={subName}>{subCode} - {subName}</span>
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        Total: {scoreObj.totalScore} ({scoreObj.grade})
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      <div className="flex items-center gap-1">
                                        <label className="text-[10px] text-slate-500 font-bold">CA (40):</label>
                                        <input
                                          type="number"
                                          min={0}
                                          max={40}
                                          value={scoreObj.totalCa}
                                          onChange={(e) => handleScoreChange(student.id, scoreObj.subjectId, 'totalCa', Number(e.target.value))}
                                          className="w-12 rounded border border-slate-300 p-0.5 text-center font-mono font-bold text-blue-900 focus:border-blue-500 focus:outline-none"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <label className="text-[10px] text-slate-500 font-bold">Exam (60):</label>
                                        <input
                                          type="number"
                                          min={0}
                                          max={60}
                                          value={scoreObj.examScore}
                                          onChange={(e) => handleScoreChange(student.id, scoreObj.subjectId, 'examScore', Number(e.target.value))}
                                          className="w-12 rounded border border-amber-300 bg-amber-50/50 p-0.5 text-center font-mono font-bold text-amber-950 focus:border-amber-500 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div 
                                  key={scoreObj.subjectId}
                                  className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-[11px]"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-mono font-bold text-slate-700 text-[10px] bg-slate-100 px-1 py-0.5 rounded">
                                      {subCode}
                                    </span>
                                    <span className="font-medium text-slate-800 truncate max-w-[120px]" title={subName}>
                                      {subName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 font-mono flex-shrink-0">
                                    <span className="text-[10px] text-slate-500">
                                      CA:<strong className="text-slate-800">{scoreObj.totalCa}</strong> Exam:<strong className="text-slate-800">{scoreObj.examScore}</strong>
                                    </span>
                                    <span className="font-bold text-blue-900 text-xs">
                                      {scoreObj.totalScore}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      scoreObj.totalScore >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                                      scoreObj.totalScore >= 60 ? 'bg-blue-50 text-blue-700 border border-blue-300' :
                                      scoreObj.totalScore >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-300' :
                                      'bg-rose-50 text-rose-700 border border-rose-300'
                                    }`}>
                                      {scoreObj.grade}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100">
                          <span>Affective & Psychomotor:</span>
                          <span className="font-bold text-blue-900">Evaluated (1-5 Scale)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onOpenReportCardModal(student, report)}
                          id={`preview-report-btn-${student.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Preview & Print Result</span>
                        </button>

                        <button
                          onClick={() => downloadReportCardAsPDF(report, student, subjects)}
                          title="Export Official PDF"
                          className="p-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          <Download className="h-4 w-4 text-blue-700" />
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

      {/* ==================== TAB 2: DOMAIN ASSESSMENT & NON-ACADEMIC EVALUATION ==================== */}
      {activeTab === 'domains' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-emerald-700" />
                Domains of Education Evaluation Matrix • {selectedClass} ({selectedTerm})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Assess affective behaviors (character/discipline), psychomotor practical skills, sports participation, and statutory remarks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDomainSaveMessage('All Educational Domains and Statutory Remarks synchronized successfully!');
                  setTimeout(() => setDomainSaveMessage(''), 2500);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 text-xs font-bold transition cursor-pointer shadow-md"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save All Domains</span>
              </button>
            </div>
          </div>

          {domainSaveMessage && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              <span>{domainSaveMessage}</span>
            </div>
          )}

          {/* Rating Scale Legend */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-800">5-Point Domain Rating Key:</span>
            <div className="flex items-center gap-3 flex-wrap text-[11px] font-semibold">
              <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">5 - Exceptional (A)</span>
              <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">4 - Commendable (B)</span>
              <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">3 - Satisfactory (C)</span>
              <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">2 - Developing (D)</span>
              <span className="px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">1 - Weak (E)</span>
            </div>
          </div>

          {/* Students Domains List */}
          <div className="space-y-6">
            {classStudents.map((student) => {
              const studentDomain = localDomains[student.id] || {
                affective: {
                  punctuality: 5,
                  neatness: 5,
                  politeness: 5,
                  honesty: 5,
                  peerRelationship: 4,
                  leadership: student.isPrefect ? 5 : 4,
                  emotionalStability: 4,
                  obedience: 5,
                  attentiveness: 5,
                  perseverance: 4,
                },
                psychomotor: {
                  handwriting: 4,
                  sportsAndGames: 4,
                  craftsAndPractical: 4,
                  verbalFluency: 5,
                  musicalDramatic: 4,
                  handlingOfTools: 4,
                  physicalAgility: 4,
                },
                sportsMasterRemark: `Active sporting participation in ${student.house}. Displays high athletic stamina and teamwork.`,
                guidanceCounselorRemark: `${student.fullName} exhibits admirable emotional maturity, moral rectitude, and commendable focus on academic and personal aspirations.`,
                formTutorRemark: `${student.fullName} is an attentive, well-behaved and conscientious learner who participates actively in class activities.`,
              };

              const updateAffective = (trait: keyof AffectiveDomain, val: number) => {
                setLocalDomains(prev => ({
                  ...prev,
                  [student.id]: {
                    ...studentDomain,
                    affective: {
                      ...studentDomain.affective,
                      [trait]: val,
                    }
                  }
                }));
              };

              const updatePsychomotor = (trait: keyof PsychomotorDomain, val: number) => {
                setLocalDomains(prev => ({
                  ...prev,
                  [student.id]: {
                    ...studentDomain,
                    psychomotor: {
                      ...studentDomain.psychomotor,
                      [trait]: val,
                    }
                  }
                }));
              };

              const updateRemark = (field: 'sportsMasterRemark' | 'guidanceCounselorRemark' | 'formTutorRemark', text: string) => {
                setLocalDomains(prev => ({
                  ...prev,
                  [student.id]: {
                    ...studentDomain,
                    [field]: text,
                  }
                }));
              };

              return (
                <div key={student.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
                        <UserCheck className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{student.fullName}</h4>
                          <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {student.admissionNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{student.currentClass} • Sporting House: <strong className="text-slate-800">{student.house}</strong></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const rc = getStudentReportCard(student);
                          onOpenReportCardModal(student, rc);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview Report Card</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Affective Traits Matrix */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                      Affective Domain Traits (Character, Discipline & Conduct)
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
                      {[
                        { key: 'punctuality', label: 'Punctuality' },
                        { key: 'neatness', label: 'Neatness' },
                        { key: 'politeness', label: 'Politeness' },
                        { key: 'honesty', label: 'Honesty' },
                        { key: 'peerRelationship', label: 'Peer Relations' },
                        { key: 'leadership', label: 'Leadership' },
                        { key: 'emotionalStability', label: 'Self Control' },
                        { key: 'obedience', label: 'Obedience' },
                        { key: 'attentiveness', label: 'Attentiveness' },
                        { key: 'perseverance', label: 'Perseverance' },
                      ].map(({ key, label }) => {
                        const val = studentDomain.affective[key as keyof AffectiveDomain] || 5;
                        return (
                          <div key={key} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-1.5">
                            <span className="text-[11px] font-medium text-slate-700">{label}:</span>
                            <div className="flex items-center justify-between gap-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => updateAffective(key as keyof AffectiveDomain, rating)}
                                  className={`h-5 w-5 rounded text-[10px] font-bold transition cursor-pointer ${
                                    val === rating
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                >
                                  {rating}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Psychomotor Traits Matrix */}
                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-emerald-600" />
                      Psychomotor Skills (Practical, Athletics & Physical Expression)
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                      {[
                        { key: 'handwriting', label: 'Handwriting' },
                        { key: 'sportsAndGames', label: 'Sports & Games' },
                        { key: 'craftsAndPractical', label: 'Creative Crafts' },
                        { key: 'verbalFluency', label: 'Verbal Fluency' },
                        { key: 'musicalDramatic', label: 'Music & Drama' },
                        { key: 'handlingOfTools', label: 'Tool Handling' },
                        { key: 'physicalAgility', label: 'Physical Agility' },
                      ].map(({ key, label }) => {
                        const val = studentDomain.psychomotor[key as keyof PsychomotorDomain] || 4;
                        return (
                          <div key={key} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-1.5">
                            <span className="text-[11px] font-medium text-slate-700">{label}:</span>
                            <div className="flex items-center justify-between gap-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => updatePsychomotor(key as keyof PsychomotorDomain, rating)}
                                  className={`h-5 w-5 rounded text-[10px] font-bold transition cursor-pointer ${
                                    val === rating
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                >
                                  {rating}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Statutory & Extracurricular Remarks */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Form Tutor / Class Teacher Remark:
                      </label>
                      <textarea
                        rows={2}
                        value={studentDomain.formTutorRemark}
                        onChange={(e) => updateRemark('formTutorRemark', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        placeholder="Class teacher comments..."
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Sports Master / Athletic Coach Remark:
                      </label>
                      <textarea
                        rows={2}
                        value={studentDomain.sportsMasterRemark}
                        onChange={(e) => updateRemark('sportsMasterRemark', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        placeholder="Sports and athletics remark..."
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Guidance Counselor Remark:
                      </label>
                      <textarea
                        rows={2}
                        value={studentDomain.guidanceCounselorRemark}
                        onChange={(e) => updateRemark('guidanceCounselorRemark', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        placeholder="Guidance and moral conduct remark..."
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                Central multi-subject evaluation broadsheet. Real-time dynamic ranking and promotion status across all subjects.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setBroadsheetInlineEdit(!broadsheetInlineEdit)}
                id="toggle-broadsheet-edit-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs border ${
                  broadsheetInlineEdit
                    ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{broadsheetInlineEdit ? 'Finish In-Cell Editing' : 'Enable Live In-Cell Editing'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-slate-800 transition cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Broadsheet</span>
              </button>
            </div>
          </div>

          {broadsheetInlineEdit && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>In-Cell Editing Active: Edit any student's total mark directly below. Student total, average %, class rank, and promotional status update dynamically in real time!</span>
              </div>
              <button
                onClick={handleSaveScoresheet}
                className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer transition shadow-2xs"
              >
                Save Changes
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-3 border-r border-slate-800">#</th>
                  <th className="p-3 border-r border-slate-800">Admission No</th>
                  <th className="p-3 border-r border-slate-800 min-w-[180px]">Student / Pupil Full Name</th>
                  {classSubjects.map((sub) => (
                    <th key={sub.id} className="p-3 text-center border-r border-slate-800 min-w-[75px]" title={sub.name}>
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
                      <td className="p-3 font-bold text-slate-900 border-r border-slate-200">
                        <div className="flex items-center justify-between">
                          <span>{student.fullName}</span>
                          <button
                            onClick={() => onOpenReportCardModal(student, report)}
                            title="Preview Result"
                            className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-2"
                          >
                            Preview
                          </button>
                        </div>
                      </td>
                      {classSubjects.map((sub) => {
                        const scoreObj = report.scores.find(s => s.subjectId === sub.id) || getSubjectScore(student.id, sub.id);
                        
                        if (broadsheetInlineEdit) {
                          return (
                            <td key={sub.id} className="p-1 text-center border-r border-slate-200 bg-amber-50/30">
                              <input
                                type="number"
                                min={0}
                                max={60}
                                value={scoreObj.examScore}
                                onChange={(e) => handleScoreChange(student.id, sub.id, 'examScore', Number(e.target.value))}
                                className="w-11 rounded border border-amber-300 p-1 text-center font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                                title={`Exam score (out of 60) for ${sub.code}`}
                              />
                            </td>
                          );
                        }

                        return (
                          <td key={sub.id} className="p-2.5 text-center font-mono border-r border-slate-200">
                            <span className="font-bold text-slate-900 block">{scoreObj.totalScore}</span>
                            <span className={`text-[10px] font-bold ${
                              scoreObj.totalScore >= 75 ? 'text-emerald-700' :
                              scoreObj.totalScore >= 60 ? 'text-blue-700' :
                              scoreObj.totalScore >= 50 ? 'text-amber-700' : 'text-rose-700'
                            }`}>{scoreObj.grade}</span>
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
                        {report.positionInClass === 1 ? '1st' : report.positionInClass === 2 ? '2nd' : report.positionInClass === 3 ? '3rd' : `${report.positionInClass}th`}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          promo.status.includes('Promoted') 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
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
          {/* Top Control Bar with Mode Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-blue-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">LIVE ENTRY</span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Continuous Assessment (40%) & Examination (60%) Registry
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Scores entered appear right here at a glance with instant recalculation of totals, grades, class positions, and candidate averages.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Dual Mode Switcher */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                <button
                  onClick={() => setScoresheetMode('by-subject')}
                  id="scoresheet-mode-subject-btn"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    scoresheetMode === 'by-subject'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>By Subject</span>
                </button>
                <button
                  onClick={() => setScoresheetMode('by-student')}
                  id="scoresheet-mode-student-btn"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    scoresheetMode === 'by-student'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>By Student</span>
                </button>
              </div>

              {scoresheetMode === 'by-subject' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Subject:</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-800 shadow-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    id="scoresheet-subject-selector"
                  >
                    {classSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {saveMessage}
            </div>
          )}

          {/* ================= MODE 1: BY SUBJECT ================= */}
          {scoresheetMode === 'by-subject' && (
            <div className="space-y-4">
              {/* Subject Performance Overview Bar */}
              {(() => {
                const currentSubject = subjects.find(s => s.id === selectedSubjectId) || classSubjects[0];
                const subjectScores = classStudents.map(s => getSubjectScore(s.id, selectedSubjectId));
                const totalMarks = subjectScores.reduce((acc, curr) => acc + curr.totalScore, 0);
                const avgMark = subjectScores.length > 0 ? Math.round((totalMarks / subjectScores.length) * 10) / 10 : 0;
                const maxMark = subjectScores.length > 0 ? Math.max(...subjectScores.map(s => s.totalScore)) : 0;
                const minMark = subjectScores.length > 0 ? Math.min(...subjectScores.map(s => s.totalScore)) : 0;
                const distinctions = subjectScores.filter(s => s.totalScore >= 75).length;
                const credits = subjectScores.filter(s => s.totalScore >= 60 && s.totalScore < 75).length;
                const passes = subjectScores.filter(s => s.totalScore >= 50 && s.totalScore < 60).length;
                const fails = subjectScores.filter(s => s.totalScore < 50).length;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Active Subject</span>
                      <strong className="text-slate-900 font-black text-sm truncate block">{currentSubject?.code} - {currentSubject?.name}</strong>
                    </div>
                    <div className="text-center sm:border-l border-slate-100">
                      <span className="text-[10px] text-slate-500 font-bold block">Subject Average</span>
                      <strong className="text-blue-900 font-black text-base">{avgMark}%</strong>
                    </div>
                    <div className="text-center sm:border-l border-slate-100">
                      <span className="text-[10px] text-slate-500 font-bold block">Highest Mark</span>
                      <strong className="text-emerald-700 font-black text-base">{maxMark}/100</strong>
                    </div>
                    <div className="text-center sm:border-l border-slate-100">
                      <span className="text-[10px] text-slate-500 font-bold block">Lowest Mark</span>
                      <strong className="text-slate-800 font-black text-base">{minMark}/100</strong>
                    </div>
                    <div className="text-center sm:border-l border-slate-100">
                      <span className="text-[10px] text-slate-500 font-bold block">Grade Spread</span>
                      <div className="flex items-center justify-center gap-1 mt-0.5 text-[10px] font-bold">
                        <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Distinctions (75%+)">{distinctions} A</span>
                        <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Credits (60-74%)">{credits} B/C</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200" title="Passes (50-59%)">{passes} P</span>
                        {fails > 0 && <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Fails (<50%)">{fails} F</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Scoresheet Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="p-3 border-r border-slate-200">#</th>
                      <th className="p-3 border-r border-slate-200">Admission No</th>
                      <th className="p-3 border-r border-slate-200 min-w-[190px]">Candidate Full Name</th>
                      <th className="p-3 text-center border-r border-slate-200">CA 1 (10)</th>
                      <th className="p-3 text-center border-r border-slate-200">CA 2 (10)</th>
                      <th className="p-3 text-center border-r border-slate-200">Assign (10)</th>
                      <th className="p-3 text-center border-r border-slate-200">Attnd (10)</th>
                      <th className="p-3 text-center bg-blue-50 font-bold border-r border-slate-200">Total CA (40)</th>
                      <th className="p-3 text-center bg-amber-50 font-bold border-r border-slate-200">Exam (60)</th>
                      <th className="p-3 text-center bg-indigo-50 font-black border-r border-slate-200">Total (100)</th>
                      <th className="p-3 text-center border-r border-slate-200">Grade</th>
                      <th className="p-3 border-r border-slate-200 min-w-[150px]">Educator Remarks</th>
                      <th className="p-3 text-center">At-a-Glance Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {classStudents.map((student, idx) => {
                      const scoreRecord = getSubjectScore(student.id, selectedSubjectId);
                      const report = getStudentReportCard(student);
                      const isExpandedRow = expandedScoresheetRowStudentId === student.id;

                      return (
                        <React.Fragment key={student.id}>
                          <tr className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/70 transition' : 'bg-slate-50/50 hover:bg-slate-100/70 transition'}>
                            <td className="p-3 font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-blue-800 border-r border-slate-200">{student.admissionNumber}</td>
                            <td className="p-3 border-r border-slate-200">
                              <div className="font-bold text-slate-900">{student.fullName}</div>
                              <div className="text-[10px] text-slate-500">
                                Class Rank: <strong className="text-emerald-700">{report.positionInClass === 1 ? '1st' : `${report.positionInClass}th`}</strong> • Avg: <strong className="text-blue-900">{report.overallPercentage}%</strong>
                              </div>
                            </td>
                            
                            <td className="p-2 text-center border-r border-slate-200">
                              <input
                                type="number"
                                max={10}
                                min={0}
                                value={scoreRecord.ca1}
                                onChange={(e) => handleScoreChange(student.id, selectedSubjectId, 'ca1', Number(e.target.value))}
                                className="w-13 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2 text-center border-r border-slate-200">
                              <input
                                type="number"
                                max={10}
                                min={0}
                                value={scoreRecord.ca2}
                                onChange={(e) => handleScoreChange(student.id, selectedSubjectId, 'ca2', Number(e.target.value))}
                                className="w-13 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2 text-center border-r border-slate-200">
                              <input
                                type="number"
                                max={10}
                                min={0}
                                value={scoreRecord.assignment}
                                onChange={(e) => handleScoreChange(student.id, selectedSubjectId, 'assignment', Number(e.target.value))}
                                className="w-13 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2 text-center border-r border-slate-200">
                              <input
                                type="number"
                                max={10}
                                min={0}
                                value={scoreRecord.attendance}
                                onChange={(e) => handleScoreChange(student.id, selectedSubjectId, 'attendance', Number(e.target.value))}
                                className="w-13 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                              />
                            </td>

                            <td className="p-3 text-center font-mono font-bold text-blue-900 bg-blue-50/40 border-r border-slate-200">
                              <div className="text-sm">{scoreRecord.totalCa}</div>
                              <span className="text-[9px] text-blue-600 block font-sans">/40</span>
                            </td>

                            <td className="p-2 text-center border-r border-slate-200 bg-amber-50/20">
                              <input
                                type="number"
                                max={60}
                                min={0}
                                value={scoreRecord.examScore}
                                onChange={(e) => handleScoreChange(student.id, selectedSubjectId, 'examScore', Number(e.target.value))}
                                className="w-16 rounded-lg border border-amber-300 bg-white p-1 text-center font-mono font-bold text-amber-950 focus:border-amber-500 focus:outline-none shadow-2xs"
                              />
                              <span className="text-[9px] text-amber-700 block mt-0.5">/60</span>
                            </td>

                            <td className="p-3 text-center font-mono font-black text-indigo-900 bg-indigo-50/40 border-r border-slate-200">
                              <div className="text-base">{scoreRecord.totalScore}</div>
                              <span className="text-[9px] text-indigo-600 block font-sans">/100</span>
                            </td>

                            <td className="p-3 text-center font-bold border-r border-slate-200">
                              <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                                scoreRecord.totalScore >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                scoreRecord.totalScore >= 60 ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                scoreRecord.totalScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                'bg-rose-50 text-rose-700 border-rose-300'
                              }`}>
                                {scoreRecord.grade}
                              </span>
                            </td>

                            <td className="p-3 text-slate-700 text-[11px] italic border-r border-slate-200">
                              {scoreRecord.remark}
                            </td>

                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setExpandedScoresheetRowStudentId(isExpandedRow ? null : student.id)}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer text-[11px] font-bold inline-flex items-center gap-1 ${
                                    isExpandedRow 
                                      ? 'bg-blue-700 text-white border-blue-700' 
                                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                  }`}
                                  title="View all subjects at a glance for this student"
                                >
                                  <Table className="h-3.5 w-3.5" />
                                  <span>{isExpandedRow ? 'Hide' : 'All Subjects'}</span>
                                </button>

                                <button
                                  onClick={() => onOpenReportCardModal(student, report)}
                                  className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs"
                                  title="Preview complete official terminal report card"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Preview</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Full-Student Subject Matrix Row */}
                          {isExpandedRow && (
                            <tr className="bg-blue-50/40 border-b-2 border-blue-300">
                              <td colSpan={13} className="p-4">
                                <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-slate-900">{student.fullName}'s Complete Subject Portfolio</span>
                                      <span className="text-xs text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                        Overall Avg: {report.overallPercentage}% • Rank: #{report.positionInClass}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setActiveScoresheetStudentId(student.id);
                                        setScoresheetMode('by-student');
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                                    >
                                      Switch to Student Full Edit Mode →
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                    {report.scores.map((subScore) => {
                                      const sub = subjects.find(s => s.id === subScore.subjectId);
                                      const isCurrentSelected = subScore.subjectId === selectedSubjectId;

                                      return (
                                        <div 
                                          key={subScore.subjectId} 
                                          className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                            isCurrentSelected 
                                              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/30' 
                                              : 'bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          <div>
                                            <div className="font-bold text-slate-800 truncate max-w-[130px]">{sub?.code} - {sub?.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">CA: {subScore.totalCa} | Exam: {subScore.examScore}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-black text-blue-900 font-mono text-xs">{subScore.totalScore}</div>
                                            <span className="text-[10px] font-bold text-emerald-700">{subScore.grade}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MODE 2: BY STUDENT ================= */}
          {scoresheetMode === 'by-student' && (
            <div className="space-y-4">
              {/* Candidate Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                {classStudents.map((student) => {
                  const report = getStudentReportCard(student);
                  const isActive = (activeScoresheetStudentId || classStudents[0]?.id) === student.id;

                  return (
                    <button
                      key={student.id}
                      onClick={() => setActiveScoresheetStudentId(student.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{student.fullName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                        isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{report.positionInClass}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Candidate All-Subjects Entry Matrix */}
              {(() => {
                const currentStudent = classStudents.find(s => s.id === (activeScoresheetStudentId || classStudents[0]?.id)) || classStudents[0];
                if (!currentStudent) return null;

                const report = getStudentReportCard(currentStudent);

                return (
                  <div className="space-y-4">
                    {/* Student Holistic Header Banner */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-800 font-black text-sm">
                          {currentStudent.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{currentStudent.fullName}</h4>
                            <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {currentStudent.admissionNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {currentStudent.currentClass} • {currentStudent.house} • {currentStudent.arm?.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">Class Position</span>
                          <strong className="text-emerald-700 font-black text-sm">
                            {report.positionInClass === 1 ? '1st' : report.positionInClass === 2 ? '2nd' : report.positionInClass === 3 ? '3rd' : `${report.positionInClass}th`}
                          </strong>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">Overall Average</span>
                          <strong className="text-blue-900 font-black text-sm">{report.overallPercentage}%</strong>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">Total Obtained</span>
                          <strong className="text-purple-900 font-black text-sm">{report.totalScoreObtained}/{report.totalPossibleScore}</strong>
                        </div>
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 font-bold block">GPA</span>
                          <strong className="text-indigo-900 font-black text-sm">{report.gpa?.toFixed(2) || '4.00'}</strong>
                        </div>

                        <button
                          onClick={() => onOpenReportCardModal(currentStudent, report)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Preview Full Report Card</span>
                        </button>
                      </div>
                    </div>

                    {/* All Subjects Score Table for this Candidate */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                            <th className="p-3 border-r border-slate-200">#</th>
                            <th className="p-3 border-r border-slate-200 min-w-[200px]">Subject Title</th>
                            <th className="p-3 text-center border-r border-slate-200">CA 1 (10)</th>
                            <th className="p-3 text-center border-r border-slate-200">CA 2 (10)</th>
                            <th className="p-3 text-center border-r border-slate-200">Assign (10)</th>
                            <th className="p-3 text-center border-r border-slate-200">Attnd (10)</th>
                            <th className="p-3 text-center bg-blue-50 font-bold border-r border-slate-200">Total CA (40)</th>
                            <th className="p-3 text-center bg-amber-50 font-bold border-r border-slate-200">Exam (60)</th>
                            <th className="p-3 text-center bg-indigo-50 font-black border-r border-slate-200">Total (100)</th>
                            <th className="p-3 text-center border-r border-slate-200">Grade</th>
                            <th className="p-3 min-w-[200px]">Remark</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {classSubjects.map((sub, idx) => {
                            const scoreRecord = getSubjectScore(currentStudent.id, sub.id);

                            return (
                              <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="p-3 font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                                <td className="p-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900">{sub.name}</div>
                                  <div className="text-[10px] font-mono text-slate-500 font-bold">{sub.code} • {sub.category}</div>
                                </td>

                                <td className="p-2 text-center border-r border-slate-200">
                                  <input
                                    type="number"
                                    max={10}
                                    min={0}
                                    value={scoreRecord.ca1}
                                    onChange={(e) => handleScoreChange(currentStudent.id, sub.id, 'ca1', Number(e.target.value))}
                                    className="w-13 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </td>
                                <td className="p-2 text-center border-r border-slate-200">
                                  <input
                                    type="number"
                                    max={10}
                                    min={0}
                                    value={scoreRecord.ca2}
                                    onChange={(e) => handleScoreChange(currentStudent.id, sub.id, 'ca2', Number(e.target.value))}
                                    className="w-13 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </td>
                                <td className="p-2 text-center border-r border-slate-200">
                                  <input
                                    type="number"
                                    max={10}
                                    min={0}
                                    value={scoreRecord.assignment}
                                    onChange={(e) => handleScoreChange(currentStudent.id, sub.id, 'assignment', Number(e.target.value))}
                                    className="w-13 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </td>
                                <td className="p-2 text-center border-r border-slate-200">
                                  <input
                                    type="number"
                                    max={10}
                                    min={0}
                                    value={scoreRecord.attendance}
                                    onChange={(e) => handleScoreChange(currentStudent.id, sub.id, 'attendance', Number(e.target.value))}
                                    className="w-13 rounded-lg border border-slate-300 p-1 text-center font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </td>

                                <td className="p-3 text-center font-mono font-bold text-blue-900 bg-blue-50/40 border-r border-slate-200">
                                  {scoreRecord.totalCa}
                                </td>

                                <td className="p-2 text-center border-r border-slate-200 bg-amber-50/20">
                                  <input
                                    type="number"
                                    max={60}
                                    min={0}
                                    value={scoreRecord.examScore}
                                    onChange={(e) => handleScoreChange(currentStudent.id, sub.id, 'examScore', Number(e.target.value))}
                                    className="w-16 rounded-lg border border-amber-300 bg-white p-1 text-center font-mono font-bold text-amber-950 focus:border-amber-500 focus:outline-none shadow-2xs"
                                  />
                                </td>

                                <td className="p-3 text-center font-mono font-black text-indigo-900 bg-indigo-50/40 border-r border-slate-200">
                                  {scoreRecord.totalScore}
                                </td>

                                <td className="p-3 text-center font-bold border-r border-slate-200">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                    scoreRecord.totalScore >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                    scoreRecord.totalScore >= 60 ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                    scoreRecord.totalScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                    'bg-rose-50 text-rose-700 border-rose-300'
                                  }`}>
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
                );
              })()}
            </div>
          )}
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

      {/* Access Passkeys & Authorization Hub Modal */}
      <AccessManagementModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
        initialWingFilter="academic"
      />

    </div>
  );
};
