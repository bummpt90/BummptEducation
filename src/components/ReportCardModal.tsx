import React, { useState } from 'react';
import { Student, StudentReportCard, Subject, getSchoolArm, AssessmentScore, AffectiveDomain, PsychomotorDomain } from '../types';
import { calculateGrade, calculatePrimaryGrade, evaluatePromotionStatus, getDomainRatingDescription, calculateGpa } from '../utils/grading';
import { downloadReportCardAsPDF } from '../utils/pdfGenerator';
import { BummptechLogo } from './BummptechLogo';
import { 
  Printer, X, Award, CheckCircle2, School, ShieldCheck, Sparkles, 
  Star, Edit3, Download, Check, Save, UserCheck, Activity, HeartHandshake,
  Calendar, FileText, CheckCircle, ArrowLeft, FileSpreadsheet, ChevronUp,
  RotateCcw, BookOpen
} from 'lucide-react';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  reportCard: StudentReportCard;
  subjects?: Subject[];
  onOpenAiRemarkModal?: () => void;
  onSaveReportCard?: (updatedReportCard: StudentReportCard) => void;
  onNavigate?: (page: any, subTab?: string, param?: any) => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  isOpen,
  onClose,
  student,
  reportCard: initialReportCard,
  subjects = [],
  onOpenAiRemarkModal,
  onSaveReportCard,
  onNavigate,
}) => {
  if (!isOpen) return null;

  // Local editable copy for live preview and correction mode
  const [reportCard, setReportCard] = useState<StudentReportCard>(() => {
    // Ensure default domains exist
    const defaultAffective: AffectiveDomain = {
      punctuality: initialReportCard.affective?.punctuality || (initialReportCard.psychomotor as any)?.punctuality || 5,
      neatness: initialReportCard.affective?.neatness || (initialReportCard.psychomotor as any)?.neatness || 5,
      politeness: initialReportCard.affective?.politeness || (initialReportCard.psychomotor as any)?.politeness || 5,
      honesty: initialReportCard.affective?.honesty || (initialReportCard.psychomotor as any)?.honesty || 5,
      peerRelationship: initialReportCard.affective?.peerRelationship || (initialReportCard.psychomotor as any)?.peerRelationship || 4,
      leadership: initialReportCard.affective?.leadership || (initialReportCard.psychomotor as any)?.leadership || (student.isPrefect ? 5 : 4),
      emotionalStability: initialReportCard.affective?.emotionalStability || 4,
      obedience: initialReportCard.affective?.obedience || 5,
      attentiveness: initialReportCard.affective?.attentiveness || (initialReportCard.psychomotor as any)?.attentiveness || 5,
      perseverance: initialReportCard.affective?.perseverance || 4,
    };

    const defaultPsychomotor: PsychomotorDomain = {
      handwriting: initialReportCard.psychomotor?.handwriting || 4,
      sportsAndGames: initialReportCard.psychomotor?.sportsAndGames || (initialReportCard.psychomotor as any)?.sports || 4,
      craftsAndPractical: initialReportCard.psychomotor?.craftsAndPractical || (initialReportCard.psychomotor as any)?.crafts || 4,
      verbalFluency: initialReportCard.psychomotor?.verbalFluency || (initialReportCard.psychomotor as any)?.speechFluency || 5,
      musicalDramatic: initialReportCard.psychomotor?.musicalDramatic || 4,
      handlingOfTools: initialReportCard.psychomotor?.handlingOfTools || 4,
      physicalAgility: initialReportCard.psychomotor?.physicalAgility || 4,
    };

    const defaultAttendance = initialReportCard.attendance || {
      timesSchoolOpened: initialReportCard.attendanceTotalDays || 60,
      timesPresent: initialReportCard.attendancePresent || 58,
      timesAbsent: (initialReportCard.attendanceTotalDays || 60) - (initialReportCard.attendancePresent || 58),
      timesPunctual: 56,
    };

    return {
      ...initialReportCard,
      affective: defaultAffective,
      psychomotor: defaultPsychomotor,
      attendance: defaultAttendance,
      sportsMasterRemark: initialReportCard.sportsMasterRemark || `Active sporting participation in ${student.house}. Displays high athletic stamina and teamwork.`,
      sportsMasterName: initialReportCard.sportsMasterName || 'Coach Terkula Tyav (P.E. & Sports Lead)',
      guidanceCounselorRemark: initialReportCard.guidanceCounselorRemark || `${student.fullName} exhibits admirable emotional maturity, moral rectitude, and commendable focus on academic and personal aspirations.`,
      guidanceCounselorName: initialReportCard.guidanceCounselorName || 'Mrs. Comfort Agbo (Guidance & Counseling Head)',
      approvalStatus: initialReportCard.approvalStatus || 'Approved & Published',
      nextTermFeesEstimate: initialReportCard.nextTermFeesEstimate || 'Tuition and statutory fees payable into official school bank accounts before term resumption.',
    };
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const arm = student.arm || getSchoolArm(student.currentClass || reportCard.classLevel);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadReportCardAsPDF(reportCard, student, subjects);
  };

  const getSubjectName = (subId: string) => {
    const sub = subjects.find((s) => s.id === subId);
    return sub ? sub.name : subId;
  };

  // Recalculate totals and percentage dynamically
  const recomputeScores = (updatedScores: AssessmentScore[]) => {
    const totalScoreObtained = updatedScores.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
    const totalPossibleScore = updatedScores.length * 100;
    const overallPercentage = totalPossibleScore > 0 
      ? Math.round((totalScoreObtained / totalPossibleScore) * 1000) / 10 
      : 0;
    const gpa = calculateGpa(updatedScores);

    setReportCard(prev => ({
      ...prev,
      scores: updatedScores,
      totalScoreObtained,
      totalPossibleScore,
      overallPercentage,
      gpa,
    }));
  };

  const handleScoreFieldChange = (
    subjectId: string,
    field: 'ca1' | 'ca2' | 'assignment' | 'attendance' | 'examScore' | 'remark',
    val: string | number
  ) => {
    const newScores = reportCard.scores.map(s => {
      if (s.subjectId !== subjectId) return s;

      const updated = { ...s };
      if (field === 'remark') {
        updated.remark = String(val);
      } else {
        const numVal = Math.max(0, Number(val) || 0);
        if (field === 'ca1') updated.ca1 = Math.min(10, numVal);
        if (field === 'ca2') updated.ca2 = Math.min(10, numVal);
        if (field === 'assignment') updated.assignment = Math.min(10, numVal);
        if (field === 'attendance') updated.attendance = Math.min(10, numVal);
        if (field === 'examScore') updated.examScore = Math.min(60, numVal);

        const totalCa = (updated.ca1 || 0) + (updated.ca2 || 0) + (updated.assignment || 0) + (updated.attendance || 0);
        const totalScore = Math.round((totalCa + (updated.examScore || 0)) * 10) / 10;
        const gradeObj = arm === 'primary' 
          ? calculatePrimaryGrade(totalScore) 
          : calculateGrade(totalScore);

        updated.totalCa = totalCa;
        updated.totalScore = totalScore;
        updated.grade = gradeObj.grade;
        if (!updated.remark || updated.remark === s.remark) {
          updated.remark = gradeObj.remark;
        }
      }
      return updated;
    });

    recomputeScores(newScores);
  };

  const handleAffectiveRatingChange = (key: keyof AffectiveDomain, val: number) => {
    setReportCard(prev => ({
      ...prev,
      affective: {
        ...prev.affective,
        [key]: val,
      },
    }));
  };

  const handlePsychomotorRatingChange = (key: keyof PsychomotorDomain, val: number) => {
    setReportCard(prev => ({
      ...prev,
      psychomotor: {
        ...prev.psychomotor,
        [key]: val,
      },
    }));
  };

  const handleAttendanceChange = (field: 'timesSchoolOpened' | 'timesPresent' | 'timesAbsent' | 'timesPunctual', val: number) => {
    setReportCard(prev => {
      const att = { ...prev.attendance, [field]: val };
      if (field === 'timesPresent') {
        att.timesAbsent = Math.max(0, att.timesSchoolOpened - val);
      }
      return {
        ...prev,
        attendance: att,
        attendancePresent: att.timesPresent,
        attendanceTotalDays: att.timesSchoolOpened,
      };
    });
  };

  const handleSaveCorrections = () => {
    if (onSaveReportCard) {
      onSaveReportCard(reportCard);
    }
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setIsEditMode(false);
    }, 1200);
  };

  const promoEvaluation = evaluatePromotionStatus(
    reportCard.scores.map((s) => ({
      subjectId: s.subjectId,
      totalScore: s.totalScore,
      grade: s.grade,
    })),
    reportCard.classLevel
  );

  const getHeaderInfo = () => {
    switch (arm) {
      case 'kindergarten':
        return {
          title: 'BUMMPTECH INTERNATIONAL EARLY YEARS & MONTESSORI ACADEMY',
          subTitle: 'Montessori & Early Childhood Care and Education (ECCE) Center • Ages 2–5 Years',
          centerBadge: 'ECCE Approval No: BN/ECCE/2024/091 • Govt. Reg: BN/ED/KG/041',
          subHeadTitle: 'Head of Kindergarten & Early Learning',
          subHeadName: reportCard.principalName || 'Mrs. Abigail Folashade Balogun (M.Ed)',
          tutorTitle: 'Early Years Lead Educator / Facilitator',
          tutorName: reportCard.formTutorName || 'Miss Rita Iorfa',
          ratingSystemName: 'Early Learning Mastery Scale (Exceeding • Proficient • Developing • Emerging)',
        };
      case 'primary':
        return {
          title: 'BUMMPTECH INTERNATIONAL PRIMARY & BASIC MODEL SCHOOL',
          subTitle: 'Approved Universal Basic Education (UBE) & Cambridge Primary Model Center • Basic 1 – 6',
          centerBadge: 'National UBE Center No: BN/UBE/PRI/1042 • Basic 1 – 6 Approved',
          subHeadTitle: 'Headmistress (Primary Model School)',
          subHeadName: reportCard.principalName || 'Mrs. Grace Iveren Shima (M.Ed)',
          tutorTitle: 'Primary Class Master / Tutor',
          tutorName: reportCard.formTutorName || 'Mr. Moses Terfa Aondo',
          ratingSystemName: 'Primary Distinction Standard (A+ • A • B • C • D • E • F)',
        };
      case 'secondary':
      default:
        return {
          title: 'BUMMPTECH INTERNATIONAL COLLEGE (JSS 1 – SSS 3)',
          subTitle: 'Approved WAEC, NECO, Cambridge IGCSE, SAT & JAMB Examination Center',
          centerBadge: 'WAEC / NECO Center No: 028491 • JAMB CBT Code: 49021 • BN/MOE/SEC/2021/489',
          subHeadTitle: 'Principal (Secondary College)',
          subHeadName: reportCard.principalName || 'Dr. (Mrs.) Grace Nkechi Okafor (Ph.D)',
          tutorTitle: 'Senior Form Tutor',
          tutorName: reportCard.formTutorName || 'Mrs. Blessing Aondoaver (M.Sc)',
          ratingSystemName: 'West African Standard 9-Point Scale (A1 to F9)',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm print:p-0 print:bg-white print:overflow-visible">
      <div className="min-h-screen w-full flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 print:p-0">
        <div 
          id="official-report-card-modal-sheet"
          className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-4 print:shadow-none print:border-none print:my-0 print:w-full print:max-w-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* ==================== STICKY TOP CONTROLS & RETURN ACTION BAR ==================== */}
          <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 sm:px-6 py-3.5 text-white shadow-md print:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Primary Return Button */}
              <button
                onClick={onClose}
                id="return-to-academic-dashboard-top-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs font-bold transition shadow-md cursor-pointer border border-blue-400/30"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Academic & Entry Page</span>
              </button>

              {onNavigate && (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('academic', 'scoresheet', { classLevel: reportCard.classLevel });
                    }}
                    title="Jump directly to score entry sheet"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
                    <span>Score Entry</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('academic', 'broadsheet', { classLevel: reportCard.classLevel });
                    }}
                    title="Jump directly to class master broadsheet"
                    className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Broadsheet</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* View / Edit Mode Switcher */}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                id="toggle-report-edit-mode-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition shadow-xs cursor-pointer ${
                  isEditMode
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditMode ? 'Exit Correction' : 'Preview & Correct Marks'}</span>
              </button>

              {isEditMode && (
                <button
                  onClick={handleSaveCorrections}
                  id="save-report-card-changes-btn"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition cursor-pointer animate-pulse"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </button>
              )}

              {onOpenAiRemarkModal && (
                <button
                  onClick={onOpenAiRemarkModal}
                  id="open-ai-remark-generator-btn"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/60 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/80 transition cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">AI Remark</span>
                </button>
              )}

              <button
                onClick={handleDownloadPdf}
                id="download-report-pdf-btn"
                title="Download Official High-Resolution PDF"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-3 py-2 text-xs font-bold transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <button
                onClick={handlePrint}
                id="print-report-card-btn"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={onClose}
                title="Close report preview"
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Correction Mode Notification Banner */}
          {isEditMode && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 font-medium print:hidden">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Live Correction Mode Enabled:</strong> Modify subject marks (CA 40 / Exam 60), evaluate domain trait scores (1-5), and update educator remarks directly. Scores & averages recalculate in real-time.
                </span>
              </div>
              <button
                onClick={handleSaveCorrections}
                className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition shrink-0 ml-2"
              >
                Save & Apply
              </button>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="bg-emerald-600 text-white px-6 py-2 flex items-center justify-center gap-2 text-xs font-bold animate-in fade-in print:hidden">
              <CheckCircle2 className="h-4 w-4 text-emerald-200" />
              <span>Report Card and Educational Domain traits updated and synchronized successfully!</span>
            </div>
          )}

          {/* ==================== OFFICIAL PRINTABLE REPORT CARD SHEET ==================== */}
          <div className="p-6 md:p-8 space-y-6 text-slate-900 bg-white print:p-4 print:space-y-3 font-sans">
            
            {/* Institutional Crest & Address Header */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <BummptechLogo className="h-20 w-20 text-blue-900 drop-shadow-sm shrink-0 print:h-16 print:w-16" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                      <h1 className="text-lg md:text-xl font-black tracking-tight text-blue-950 uppercase font-serif">
                        {headerInfo.title}
                      </h1>
                    </div>
                    <p className="text-xs font-bold text-blue-800">
                      {headerInfo.subTitle}
                    </p>
                    <p className="text-xs text-slate-700 font-medium">
                      Address: <strong className="text-slate-900">Akperan Orshi Ave, Housing Estate, Makurdi, Benue State, Nigeria</strong>
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Tel: +234 811 523 1834, +234 803 123 4567 • Email: info@bummptech.edu.ng • Web: www.bummptech.edu.ng
                    </p>
                    <p className="text-[10px] text-blue-900 font-semibold italic">
                      Motto: "Excellence in Character, Innovation & Scholarship"
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 hidden sm:flex sm:flex-col sm:items-end border-l-2 border-slate-200 pl-4 space-y-1.5">
                  <div className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-800 border border-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                    Official Terminal Record
                  </div>
                  <div className="text-[10px] font-mono text-slate-700 font-bold">
                    {headerInfo.centerBadge}
                  </div>
                  
                  {/* Academic Session High-Contrast Badges */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded font-mono shadow-xs">
                      {reportCard.academicYear} SESSION
                    </span>
                    <span className="text-[11px] font-bold text-blue-900 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded font-mono shadow-xs">
                      {reportCard.term.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prominent Session & Term Banner Ribbon */}
              <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 px-4 py-2 text-center sm:text-left text-xs font-bold tracking-wider text-white uppercase rounded-xl border border-blue-800 shadow-xs">
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Comprehensive Student Terminal Assessment & Domains Evaluation Sheet</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black font-sans text-[10px]">
                    {reportCard.academicYear} SESSION
                  </span>
                  <span className="text-blue-200">
                    STAMP: RC-{student.admissionNumber.replace(/\//g, '-')}-{reportCard.term.replace(/\s+/g, '')}
                  </span>
                </div>
              </div>
            </div>

            {/* Student Profile & Bio Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Student Full Name:</span>
                <strong className="text-slate-900 text-sm font-bold">{student.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Admission / Reg No:</span>
                <span className="font-mono font-bold text-blue-800">{student.admissionNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Current Class & Arm:</span>
                <strong className="text-slate-800">{reportCard.classLevel} ({arm.toUpperCase()})</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Sporting House:</span>
                <span className="font-semibold text-slate-700">{student.house}</span>
              </div>

              <div>
                <span className="text-slate-500 block font-medium">Gender & DOB:</span>
                <span className="text-slate-700">{student.gender} • {student.dateOfBirth || '2010-05-14'}</span>
              </div>

              <div>
                <span className="text-slate-500 block font-medium">Academic Session & Term:</span>
                <span className="font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200 text-[11px]">
                  {reportCard.academicYear} • {reportCard.term}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block font-medium">Times School Opened:</span>
                {isEditMode ? (
                  <input
                    type="number"
                    value={reportCard.attendance.timesSchoolOpened}
                    onChange={(e) => handleAttendanceChange('timesSchoolOpened', Number(e.target.value))}
                    className="w-16 rounded border border-slate-300 px-1 py-0.5 font-bold text-slate-900"
                  />
                ) : (
                  <span className="font-semibold text-slate-800">{reportCard.attendance.timesSchoolOpened} days</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block font-medium">Times Present & Absent:</span>
                {isEditMode ? (
                  <input
                    type="number"
                    value={reportCard.attendance.timesPresent}
                    onChange={(e) => handleAttendanceChange('timesPresent', Number(e.target.value))}
                    className="w-16 rounded border border-slate-300 px-1 py-0.5 font-bold text-emerald-700"
                  />
                ) : (
                  <span className="font-semibold text-emerald-700">
                    {reportCard.attendance.timesPresent} days ({reportCard.attendance.timesAbsent} absent)
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block font-medium">Class Rank & Position:</span>
                <span className="font-bold text-blue-700">
                  {reportCard.positionInClass === 1 ? '1st' : reportCard.positionInClass === 2 ? '2nd' : `${reportCard.positionInClass}th`} out of {reportCard.totalStudentsInClass} Pupils
                </span>
              </div>

              <div>
                <span className="text-slate-500 block font-medium">Class Average:</span>
                <span className="font-bold text-slate-800">{reportCard.classAverage}%</span>
              </div>

              <div>
                <span className="text-slate-500 block font-medium">Overall Percentage:</span>
                <span className="font-black text-blue-900 text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {reportCard.overallPercentage}%
                </span>
              </div>

              <div>
                <span className="text-slate-500 block font-medium">Grade Point Average (GPA):</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {reportCard.gpa || calculateGpa(reportCard.scores)} / 5.0
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block font-medium">Times School Opened:</span>
              {isEditMode ? (
                <input
                  type="number"
                  value={reportCard.attendance.timesSchoolOpened}
                  onChange={(e) => handleAttendanceChange('timesSchoolOpened', Number(e.target.value))}
                  className="w-16 rounded border border-slate-300 px-1 py-0.5 font-bold text-slate-900"
                />
              ) : (
                <span className="font-semibold text-slate-800">{reportCard.attendance.timesSchoolOpened} days</span>
              )}
            </div>

            <div>
              <span className="text-slate-500 block font-medium">Times Present:</span>
              {isEditMode ? (
                <input
                  type="number"
                  value={reportCard.attendance.timesPresent}
                  onChange={(e) => handleAttendanceChange('timesPresent', Number(e.target.value))}
                  className="w-16 rounded border border-slate-300 px-1 py-0.5 font-bold text-emerald-700"
                />
              ) : (
                <span className="font-semibold text-emerald-700">
                  {reportCard.attendance.timesPresent} days ({reportCard.attendance.timesAbsent} absent)
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500 block font-medium">Class Rank & Cohort:</span>
              <span className="font-bold text-blue-700">
                {reportCard.positionInClass === 1 ? '1st' : reportCard.positionInClass === 2 ? '2nd' : `${reportCard.positionInClass}th`} out of {reportCard.totalStudentsInClass} Pupils
              </span>
            </div>
          </div>

          {/* ==================== 1. COGNITIVE DOMAIN: SUBJECT SCORES TABLE ==================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <School className="h-4 w-4 text-blue-700" />
                1. Cognitive Domain: Subject Academic Performance Breakdown
              </h3>
              <span className="text-[11px] text-slate-500 font-medium italic">
                CA: 40% (CA1: 10 + CA2: 10 + Assign: 10 + Attnd: 10) • Exam: 60% • Total: 100%
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2 border-r border-slate-300">#</th>
                    <th className="p-2 border-r border-slate-300">Subject / Curriculum Area</th>
                    <th className="p-2 text-center border-r border-slate-300">CA1 (10)</th>
                    <th className="p-2 text-center border-r border-slate-300">CA2 (10)</th>
                    <th className="p-2 text-center border-r border-slate-300">Assign (10)</th>
                    <th className="p-2 text-center border-r border-slate-300">Attnd (10)</th>
                    <th className="p-2 text-center bg-blue-50 font-bold border-r border-slate-300">Tot CA (40)</th>
                    <th className="p-2 text-center bg-amber-50 font-bold border-r border-slate-300">Exam (60)</th>
                    <th className="p-2 text-center bg-indigo-50 font-black border-r border-slate-300">Total (100)</th>
                    <th className="p-2 text-center border-r border-slate-300">Grade</th>
                    <th className="p-2 text-center border-r border-slate-300">Pos</th>
                    <th className="p-2">Educator Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportCard.scores.map((score, index) => {
                    const gradeDetail = arm === 'primary' 
                      ? calculatePrimaryGrade(score.totalScore) 
                      : calculateGrade(score.totalScore);

                    return (
                      <tr key={score.subjectId} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-2 font-mono text-slate-500 border-r border-slate-200">{index + 1}</td>
                        <td className="p-2 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          {getSubjectName(score.subjectId)}
                        </td>

                        {/* CA1 */}
                        <td className="p-1.5 text-center font-mono border-r border-slate-200">
                          {isEditMode ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={score.ca1}
                              onChange={(e) => handleScoreFieldChange(score.subjectId, 'ca1', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 px-1 py-0.5 text-xs font-bold"
                            />
                          ) : (
                            score.ca1
                          )}
                        </td>

                        {/* CA2 */}
                        <td className="p-1.5 text-center font-mono border-r border-slate-200">
                          {isEditMode ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={score.ca2}
                              onChange={(e) => handleScoreFieldChange(score.subjectId, 'ca2', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 px-1 py-0.5 text-xs font-bold"
                            />
                          ) : (
                            score.ca2
                          )}
                        </td>

                        {/* Assignment */}
                        <td className="p-1.5 text-center font-mono border-r border-slate-200">
                          {isEditMode ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={score.assignment}
                              onChange={(e) => handleScoreFieldChange(score.subjectId, 'assignment', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 px-1 py-0.5 text-xs font-bold"
                            />
                          ) : (
                            score.assignment
                          )}
                        </td>

                        {/* Attendance */}
                        <td className="p-1.5 text-center font-mono border-r border-slate-200">
                          {isEditMode ? (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={score.attendance}
                              onChange={(e) => handleScoreFieldChange(score.subjectId, 'attendance', e.target.value)}
                              className="w-12 text-center rounded border border-slate-300 px-1 py-0.5 text-xs font-bold"
                            />
                          ) : (
                            score.attendance
                          )}
                        </td>

                        {/* Total CA */}
                        <td className="p-2 text-center font-mono font-bold text-blue-900 bg-blue-50/40 border-r border-slate-200">
                          {score.totalCa}
                        </td>

                        {/* Exam */}
                        <td className="p-1.5 text-center font-mono font-bold text-amber-900 bg-amber-50/40 border-r border-slate-200">
                          {isEditMode ? (
                            <input
                              type="number"
                              min="0"
                              max="60"
                              step="0.5"
                              value={score.examScore}
                              onChange={(e) => handleScoreFieldChange(score.subjectId, 'examScore', e.target.value)}
                              className="w-14 text-center rounded border border-amber-300 bg-amber-50 px-1 py-0.5 text-xs font-bold text-amber-900"
                            />
                          ) : (
                            score.examScore
                          )}
                        </td>

                        {/* Total */}
                        <td className="p-2 text-center font-mono font-black text-indigo-900 bg-indigo-50/40 border-r border-slate-200">
                          {score.totalScore}
                        </td>

                        {/* Grade */}
                        <td className="p-2 text-center font-bold border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${gradeDetail.color}`}>
                            {score.grade}
                          </span>
                        </td>

                        {/* Position in Subject */}
                        <td className="p-2 text-center font-mono font-semibold text-slate-700 border-r border-slate-200">
                          {score.positionInSubject ? `${score.positionInSubject}${score.positionInSubject === 1 ? 'st' : score.positionInSubject === 2 ? 'nd' : 'th'}` : '-'}
                        </td>

                        {/* Remark */}
                        <td className="p-1.5 text-slate-700 text-[11px]">
                          {isEditMode ? (
                            <input
                              type="text"
                              value={score.remark || gradeDetail.remark}
                              onChange={(e) => handleScoreFieldChange(score.subjectId, 'remark', e.target.value)}
                              className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-[11px]"
                            />
                          ) : (
                            <span className="italic">{score.remark || gradeDetail.remark}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={6} className="p-2.5 text-right uppercase tracking-wider text-xs">
                      Total Obtained / Maximum Obtainable:
                    </td>
                    <td colSpan={2} className="p-2 text-center font-bold text-slate-800 text-xs">
                      {reportCard.totalScoreObtained} / {reportCard.totalPossibleScore}
                    </td>
                    <td className="p-2 text-center font-black text-blue-900 text-sm bg-blue-100">
                      {reportCard.overallPercentage}%
                    </td>
                    <td colSpan={3} className="p-2 text-left text-xs font-semibold text-slate-700">
                      Class Average: <strong>{reportCard.classAverage}%</strong> • GPA: <strong>{reportCard.gpa || calculateGpa(reportCard.scores)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ==================== 2. DOMAINS OF EDUCATION: AFFECTIVE & PSYCHOMOTOR EVALUATION ==================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <HeartHandshake className="h-4 w-4 text-emerald-700" />
                2. Domains of Education Evaluation (Non-Academic Assessment • 5-Point Rating Scale)
              </h3>
              <div className="text-[10px] text-slate-600 font-semibold hidden md:flex items-center gap-3">
                <span className="text-emerald-700">5: Exceptional</span>
                <span className="text-blue-700">4: Commendable</span>
                <span className="text-slate-700">3: Satisfactory</span>
                <span className="text-amber-700">2: Developing</span>
                <span className="text-rose-700">1: Weak</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Affective Domain (Character, Morals & Behaviors) */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-blue-700" />
                    Affective Domain (Character & Conduct)
                  </h4>
                  <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded">
                    Avg: 4.8 / 5
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'punctuality', label: 'Punctuality & Time Mgmt' },
                    { key: 'neatness', label: 'Neatness & Personal Hygiene' },
                    { key: 'politeness', label: 'Politeness & Courtesy' },
                    { key: 'honesty', label: 'Honesty & Integrity' },
                    { key: 'peerRelationship', label: 'Relationship with Peers' },
                    { key: 'leadership', label: 'Leadership & Initiative' },
                    { key: 'emotionalStability', label: 'Emotional Stability' },
                    { key: 'obedience', label: 'Obedience & Compliance' },
                    { key: 'attentiveness', label: 'Classroom Attentiveness' },
                    { key: 'perseverance', label: 'Perseverance & Tenacity' },
                  ].map(({ key, label }) => {
                    const rating = reportCard.affective[key as keyof AffectiveDomain] || 5;
                    const ratingDesc = getDomainRatingDescription(rating);

                    return (
                      <div key={key} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-700 text-[11px] font-medium">{label}:</span>
                        {isEditMode ? (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleAffectiveRatingChange(key as keyof AffectiveDomain, num)}
                                className={`h-5 w-5 rounded text-[10px] font-bold transition cursor-pointer ${
                                  rating === num
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ratingDesc.badgeColor}`}>
                            {rating}/5
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Psychomotor Domain (Physical, Practical & Expressive Skills) */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-700" />
                    Psychomotor & Practical Skills
                  </h4>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    Avg: 4.6 / 5
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'handwriting', label: 'Handwriting & Penmanship' },
                    { key: 'sportsAndGames', label: 'Sports, Games & Athletics' },
                    { key: 'craftsAndPractical', label: 'Creative Arts & Crafts' },
                    { key: 'verbalFluency', label: 'Verbal Fluency & Speech' },
                    { key: 'musicalDramatic', label: 'Musical & Dramatic Skills' },
                    { key: 'handlingOfTools', label: 'STEM & Tool Handling' },
                    { key: 'physicalAgility', label: 'Physical Agility & Fitness' },
                  ].map(({ key, label }) => {
                    const rating = reportCard.psychomotor[key as keyof PsychomotorDomain] || 4;
                    const ratingDesc = getDomainRatingDescription(rating);

                    return (
                      <div key={key} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-700 text-[11px] font-medium">{label}:</span>
                        {isEditMode ? (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handlePsychomotorRatingChange(key as keyof PsychomotorDomain, num)}
                                className={`h-5 w-5 rounded text-[10px] font-bold transition cursor-pointer ${
                                  rating === num
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ratingDesc.badgeColor}`}>
                            {rating}/5
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== KINDERGARTEN DEVELOPMENTAL MILESTONES (KG ONLY) ==================== */}
          {arm === 'kindergarten' && (
            <div className="space-y-2 border border-purple-200 bg-purple-50/40 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-purple-600 fill-purple-600" />
                  Early Learning Developmental Milestones & Montessori Competency Matrix
                </h4>
                <span className="text-[10px] text-purple-800 font-semibold">
                  Standard ECCE Early Learning Framework
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs pt-1">
                <div className="p-2.5 bg-white rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-purple-900">1. Jolly Phonics & Speech Fluency:</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">Exceeding (4/4)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Blends 3-letter words accurately and recites alphabet sounds with confident phonemic awareness.</p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-purple-900">2. Early Numeracy & Pattern Logic:</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">Exceeding (4/4)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Counts to 100 with ease, sorts Montessori sensory blocks, and identifies 2D/3D shapes.</p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-purple-900">3. Fine Motor Skills & Handwriting:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Proficient (3/4)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Tripod pencil grip established. Traces within lines and maneuvers child-safe scissors neatly.</p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-purple-900">4. Social Habits, Sharing & Toilet Routine:</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">Exceeding (4/4)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Fully independent in personal hygiene, courteous, shares play materials cheerfully with classmates.</p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 3. ACADEMIC DECISION & PROMOTION STATUS ==================== */}
          <div className="rounded-xl bg-slate-900 text-white p-4 space-y-2 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                  Official Academic Decision & Wing Progression Status:
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                {promoEvaluation.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {promoEvaluation.reason}
            </p>
          </div>

          {/* ==================== 4. COMPREHENSIVE MULTI-ROLE REMARKS & SIGNATURES ==================== */}
          <div className="space-y-3">
            <h3 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-blue-700" />
              3. Statutory Endorsements, Pedagogical & Extracurricular Remarks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form Tutor / Class Teacher Remark */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 block uppercase tracking-wide">
                    {headerInfo.tutorTitle}'s Remark:
                  </span>
                </div>
                {isEditMode ? (
                  <textarea
                    rows={3}
                    value={reportCard.formTutorRemark}
                    onChange={(e) => setReportCard({ ...reportCard, formTutorRemark: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                    placeholder="Enter class teacher remarks..."
                  />
                ) : (
                  <p className="text-xs text-slate-900 font-medium italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                    "{reportCard.formTutorRemark || `${student.fullName} has made remarkable progress throughout the term, demonstrating high discipline, sharp cognitive synthesis, and model conduct.`}"
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <span>Educator: <strong className="text-slate-800">{headerInfo.tutorName}</strong></span>
                  <span>Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong></span>
                </div>
              </div>

              {/* Sports Master / Physical Education Remark */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 block uppercase tracking-wide">
                    Sports Master / Athletic Coach's Remark:
                  </span>
                </div>
                {isEditMode ? (
                  <textarea
                    rows={3}
                    value={reportCard.sportsMasterRemark}
                    onChange={(e) => setReportCard({ ...reportCard, sportsMasterRemark: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                    placeholder="Enter sports and athletic evaluation remarks..."
                  />
                ) : (
                  <p className="text-xs text-slate-900 font-medium italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                    "{reportCard.sportsMasterRemark || `Active sporting participation in ${student.house}. Displays high athletic stamina, teamwork, and fair play.`}"
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <span>Coach: <strong className="text-slate-800">{reportCard.sportsMasterName || 'Coach Terkula Tyav'}</strong></span>
                  <span className="text-emerald-700 font-bold">House: {student.house}</span>
                </div>
              </div>

              {/* Guidance Counselor Remark */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 block uppercase tracking-wide">
                    Guidance Counselor / House Master Remark:
                  </span>
                </div>
                {isEditMode ? (
                  <textarea
                    rows={3}
                    value={reportCard.guidanceCounselorRemark}
                    onChange={(e) => setReportCard({ ...reportCard, guidanceCounselorRemark: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                    placeholder="Enter guidance counselor remarks..."
                  />
                ) : (
                  <p className="text-xs text-slate-900 font-medium italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                    "{reportCard.guidanceCounselorRemark || `${student.fullName} demonstrates deep emotional poise, polite character, and great leadership qualities.`}"
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <span>Counselor: <strong className="text-slate-800">{reportCard.guidanceCounselorName || 'Mrs. Comfort Agbo'}</strong></span>
                  <span className="text-blue-700 font-semibold">Moral Conduct: Distinction</span>
                </div>
              </div>

              {/* Head of School / Principal Endorsement */}
              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 block uppercase tracking-wide">
                    {headerInfo.subHeadTitle}'s Official Endorsement:
                  </span>
                </div>
                {isEditMode ? (
                  <textarea
                    rows={3}
                    value={reportCard.principalRemark}
                    onChange={(e) => setReportCard({ ...reportCard, principalRemark: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                    placeholder="Enter Principal / Head of School remarks..."
                  />
                ) : (
                  <p className="text-xs text-slate-900 font-medium italic bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                    "{reportCard.principalRemark || `A truly commendable performance. ${student.fullName} exemplifies the high standards of character and scholarship championed by Bummptech International.`}"
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <div>
                    <span>Endorsed By: <strong className="text-slate-800 block">{headerInfo.subHeadName}</strong></span>
                  </div>
                  <div className="px-3 py-1 border border-indigo-300 bg-indigo-50 rounded-lg text-center">
                    <span className="text-[9px] font-bold text-indigo-900 block font-mono uppercase">INSTITUTIONAL SEAL</span>
                    <span className="text-[8px] text-indigo-700 block font-sans font-medium">Digitally Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== 5. RESUMPTION & FEE NOTICE FOOTER STRIP ==================== */}
          <div className="border-t-2 border-slate-900 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-blue-700 shrink-0" />
              <span>
                NEXT TERM RESUMPTION DATE: <strong className="text-slate-900 text-[11px]">{reportCard.nextTermBegins || 'Monday 4th May, 2026'}</strong>
              </span>
            </div>
            <div className="text-center text-slate-500 font-sans">
              <span>{reportCard.nextTermFeesEstimate || 'Tuition and statutory levies are payable before resumption via official bank channels.'}</span>
            </div>
            <div className="text-right">
              <span className="text-blue-900 font-bold">Report ID: RC-{student.admissionNumber.replace(/\//g, '-')}-T2</span>
            </div>
          </div>

          {/* ==================== 6. MODAL BOTTOM RETURN & ACTION CONTROLS (Hidden during printing) ==================== */}
          <div className="border-t border-slate-200 bg-slate-100 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl print:hidden">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                onClick={onClose}
                id="modal-bottom-return-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold transition shadow-md cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="h-4 w-4 text-amber-400" />
                <span>Return to Academic & Entry Page</span>
              </button>

              {onNavigate && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('academic', 'scoresheet', { classLevel: reportCard.classLevel });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 text-xs font-bold border border-slate-300 transition cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  <span>Open Score Sheet & Entry</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              {isEditMode ? (
                <button
                  onClick={handleSaveCorrections}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold transition shadow-md cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Corrections & Return</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 text-xs font-bold transition shadow-md cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit / Correct Marks</span>
                </button>
              )}

              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2.5 text-xs font-bold transition cursor-pointer border border-slate-700"
              >
                <Download className="h-4 w-4 text-blue-400" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-xs font-bold transition shadow-md cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Report</span>
              </button>

              <button
                onClick={() => {
                  const modal = document.getElementById('official-report-card-modal-sheet');
                  modal?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                title="Scroll to Top of Report Sheet"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
