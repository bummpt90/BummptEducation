import React, { useState } from 'react';
import { 
  FileText, 
  Lock, 
  Unlock, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Eye, 
  Search, 
  Award, 
  Calendar, 
  UserCheck, 
  Sparkles, 
  ShieldAlert,
  Building2,
  PhoneCall,
  GraduationCap,
  ArrowLeft,
  RotateCcw,
  Home,
  Check
} from 'lucide-react';
import { Student, StudentReportCard, ClassLevel, SchoolArm } from '../types';
import { 
  getStoredParentAccess, 
  getGlobalReportCardPublicationStatus,
  ParentAccessRecord
} from '../utils/securityContext';
import { INITIAL_STUDENTS, INITIAL_ASSESSMENTS } from '../data/mockData';

interface ParentReportPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReportCardModal: (student: Student, reportCard: StudentReportCard) => void;
}

export const ParentReportPortalModal: React.FC<ParentReportPortalModalProps> = ({
  isOpen,
  onClose,
  onOpenReportCardModal,
}) => {
  const [admissionNoInput, setAdmissionNoInput] = useState('BUM/2024/SEC/001');
  const [parentPinInput, setParentPinInput] = useState('PAR-8821');
  const [verifiedRecord, setVerifiedRecord] = useState<ParentAccessRecord | null>(null);
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploaded, setIsUploaded] = useState(false);

  if (!isOpen) return null;

  const parentRecords = getStoredParentAccess();
  const globalPublished = getGlobalReportCardPublicationStatus();

  const handleResetSearch = () => {
    setVerifiedRecord(null);
    setVerifiedStudent(null);
    setErrorMessage('');
  };

  const handleVerifyAccess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setVerifiedRecord(null);
    setVerifiedStudent(null);

    const cleanAdm = admissionNoInput.trim().toUpperCase();
    const cleanPin = parentPinInput.trim().toUpperCase();

    if (!cleanAdm || !cleanPin) {
      setErrorMessage('Please provide both the Student Admission Number and Parent Access PIN.');
      return;
    }

    const matched = parentRecords.find(
      (r) => r.admissionNumber.toUpperCase() === cleanAdm && r.parentPin.toUpperCase() === cleanPin
    );

    if (!matched) {
      // Check if admission number alone exists to give helpful feedback
      const admExists = parentRecords.find(r => r.admissionNumber.toUpperCase() === cleanAdm);
      if (admExists) {
        setErrorMessage('Incorrect Parent Portal Access PIN for this student admission number. Please check your official SMS dispatch slip.');
      } else {
        setErrorMessage('No student record found with this admission number. Please verify with the school registry.');
      }
      return;
    }

    // Match student object
    const stu = INITIAL_STUDENTS.find(s => s.id === matched.studentId || s.admissionNumber.toUpperCase() === cleanAdm) || INITIAL_STUDENTS[0];
    setVerifiedStudent(stu);
    setVerifiedRecord(matched);
    
    // Check if uploaded & published
    const effectivelyUploaded = globalPublished && matched.isUploadedForDownload;
    setIsUploaded(effectivelyUploaded);
  };

  const handleApplyPreset = (rec: ParentAccessRecord) => {
    setAdmissionNoInput(rec.admissionNumber);
    setParentPinInput(rec.parentPin);
    setErrorMessage('');
    
    const stu = INITIAL_STUDENTS.find(s => s.id === rec.studentId || s.admissionNumber === rec.admissionNumber) || INITIAL_STUDENTS[0];
    setVerifiedStudent(stu);
    setVerifiedRecord(rec);
    setIsUploaded(globalPublished && rec.isUploadedForDownload);
  };

  const handleLaunchReportCard = () => {
    if (!verifiedStudent) return;
    
    const stu = verifiedStudent;
    const isKg = stu.currentClass.startsWith('KG');
    const isPrimary = stu.currentClass.startsWith('Basic');
    const stuScores = INITIAL_ASSESSMENTS.filter(a => a.studentId === stu.id && a.term === '2nd Term');

    const rc: StudentReportCard = {
      id: `RC-${stu.id}-2026-T2`,
      studentId: stu.id,
      arm: stu.arm || (isKg ? 'kindergarten' : isPrimary ? 'primary' : 'secondary'),
      classLevel: stu.currentClass,
      term: '2nd Term',
      academicYear: '2025/2026',
      scores: stuScores.length > 0 ? stuScores : [
        {
          studentId: stu.id,
          subjectId: 'SUB-MAT',
          classLevel: stu.currentClass,
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 9,
          ca2: 9,
          assignment: 9,
          attendance: 9,
          totalCa: 36,
          examScore: 54,
          totalScore: 90,
          grade: isPrimary ? 'A+' : 'A1',
          remark: 'Distinction / Exceptional Mastery',
        }
      ],
      totalScoreObtained: 811,
      totalPossibleScore: 900,
      overallPercentage: 90.1,
      classAverage: 68.4,
      positionInClass: 1,
      totalStudentsInClass: 38,
      affective: {
        punctuality: 5, neatness: 5, politeness: 5, honesty: 5, peerRelationship: 5,
        leadership: 5, emotionalStability: 5, obedience: 5, attentiveness: 5, perseverance: 5,
      },
      psychomotor: {
        handwriting: 4, sportsAndGames: 4, craftsAndPractical: 5, verbalFluency: 5,
        musicalDramatic: 4, handlingOfTools: 5, physicalAgility: 5,
      },
      formTutorRemark: isKg 
        ? 'Exceptional sensory milestones, phonic blending, and joyful peer interaction.'
        : isPrimary
        ? 'Outstanding mastery in numeracy, verbal reasoning, and creative science projects.'
        : 'Exceptional academic discipline, analytical excellence, and exemplary decorum.',
      formTutorName: isKg ? 'Miss Rita Iorfa' : isPrimary ? 'Mr. Moses Aondo' : 'Mr. Emmanuel Agbo',
      principalRemark: isKg
        ? 'Thoroughly prepared for kindergarten transition with high developmental competence.'
        : isPrimary
        ? 'Commendable performance. Top candidate for the National Common Entrance Examination.'
        : 'Outstanding performance. Highly recommended for the National Academic Olympiad and WAEC/SAT distinctions.',
      principalName: isKg ? 'Mrs. Abigail Balogun' : isPrimary ? 'Mrs. Grace Iveren Shima' : 'Dr. (Mrs.) Grace Nkechi Okafor',
      attendanceTotalDays: 60,
      attendancePresent: 59,
      promotionalStatus: 'Promoted to Next Class',
      nextTermBegins: '2026-05-04',
      approvalStatus: 'Approved & Published',
      isParentViewable: true,
    };

    onClose();
    onOpenReportCardModal(stu, rc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in" id="parent-report-portal-modal">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">PARENT PORTAL</span>
                  <span className="text-xs text-slate-300">Terminal Result Verification & Download Desk</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
                  Student Report Card Download Center
                </h2>
              </div>
            </div>

            {/* Return / Close Controls in Header */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                id="return-from-parent-portal-top-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border border-white/20 shadow-xs"
                title="Return to Main Application"
              >
                <ArrowLeft className="h-4 w-4 text-slate-200" />
                <span className="hidden sm:inline">Return to Main Site</span>
                <span className="sm:hidden">Return</span>
              </button>

              <button
                onClick={onClose}
                id="close-parent-portal-btn"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                title="Close Parent Portal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2 max-w-xl">
            Parents and guardians can download their ward's terminal report card only after the Academic Board and Principal's Office have approved and uploaded the official results.
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6 bg-slate-50">
          
          {/* Form */}
          <form onSubmit={handleVerifyAccess} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Admission Number:
                </label>
                <input
                  type="text"
                  value={admissionNoInput}
                  onChange={(e) => setAdmissionNoInput(e.target.value)}
                  placeholder="e.g. BUM/2024/SEC/001"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Parent Access PIN:
                </label>
                <input
                  type="text"
                  value={parentPinInput}
                  onChange={(e) => setParentPinInput(e.target.value)}
                  placeholder="e.g. PAR-8821"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                id="verify-parent-report-btn"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 text-xs shadow-md transition cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Verify & Check Result Upload Status</span>
              </button>

              {verifiedRecord && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  id="reset-parent-search-btn"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-300"
                  title="Clear results and search another ward"
                >
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                  <span>Reset Search</span>
                </button>
              )}
            </div>
          </form>

          {/* Quick Demo Pre-filled Credentials */}
          <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Quick Test: Select Student Parent PIN</span>
              </div>
              <span className="text-[10px] text-indigo-700 font-normal">Click to test instant validation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {parentRecords.slice(0, 3).map((rec) => (
                <button
                  key={rec.studentId}
                  type="button"
                  onClick={() => handleApplyPreset(rec)}
                  className="text-left p-2 rounded-xl bg-white border border-indigo-200/80 hover:border-indigo-400 text-[11px] transition cursor-pointer shadow-2xs group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-indigo-700 truncate">{rec.studentName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Adm: {rec.admissionNumber}</div>
                  <div className="text-[10px] font-bold text-indigo-800 font-mono mt-0.5">PIN: {rec.parentPin}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Result Verification Outcome Box */}
          {verifiedRecord && verifiedStudent && (
            <div className="animate-in fade-in space-y-4" id="parent-portal-verified-outcome-box">
              {isUploaded ? (
                /* CASE A: REPORT CARD IS UPLOADED & PUBLISHED FOR PARENT DOWNLOAD */
                <div className="bg-white rounded-2xl p-6 border-2 border-emerald-400 shadow-md space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-emerald-300">
                            UPLOADED & READY FOR DOWNLOAD
                          </span>
                          <span className="text-xs font-bold text-slate-500">2nd Term 2025/2026</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 mt-0.5">
                          {verifiedStudent.fullName}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetSearch}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Check Another Ward</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Admission Number</span>
                      <strong className="text-slate-900 font-mono">{verifiedStudent.admissionNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Current Class</span>
                      <strong className="text-slate-900">{verifiedStudent.currentClass}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Class Position</span>
                      <strong className="text-emerald-700 font-bold">1st out of 38</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Overall Score %</span>
                      <strong className="text-blue-700 font-bold">90.1% (Distinction)</strong>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-emerald-950 block">Official Academic Clearance:</span>
                      <span className="text-[11px] text-emerald-800">
                        Uploaded by {verifiedRecord.uploadedBy || 'Academic Board'} on {verifiedRecord.uploadedAt || '2026-02-26'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleLaunchReportCard}
                        id="view-stamped-parent-report-btn"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer whitespace-nowrap"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download & View Stamped Report</span>
                      </button>
                      
                      <button
                        onClick={onClose}
                        id="return-home-from-success-btn"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs border border-slate-300 transition cursor-pointer"
                      >
                        <Home className="h-4 w-4 text-slate-600" />
                        <span>Return to Home</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* CASE B: REPORT CARD NOT YET UPLOADED / RESTRICTED BY AUTHORIZED USERS */
                <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-300 shadow-md space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-amber-400">
                          RESTRICTED • NOT YET UPLOADED FOR DOWNLOAD
                        </span>
                      </div>
                      <h4 className="text-base font-black text-amber-950 mt-1">
                        Report Card Pending Official Authorization Release
                      </h4>
                      <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                        The <strong>2nd Term 2025/2026</strong> terminal assessment report for <strong>{verifiedStudent.fullName}</strong> ({verifiedStudent.admissionNumber}) is currently undergoing statutory academic moderation and has <strong>NOT yet been uploaded for download</strong> by the Academic Board.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-amber-700" />
                      <span>Directives for Parents & Guardians:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                      <li>Report cards will be released simultaneously once the Principal's Office and Head of Academics finalize the approval sign-off.</li>
                      <li>Parents who require emergency transcripts for relocation or scholarship applications should contact the Principal's Office directly.</li>
                    </ul>
                  </div>

                  {/* Return and Action Bar for Restricted/Pending Result */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleResetSearch}
                        id="return-to-search-btn"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>← Return to Verification Search</span>
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        id="return-to-home-btn"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs border border-slate-300 shadow-xs transition cursor-pointer"
                      >
                        <Home className="h-4 w-4 text-slate-500" />
                        <span>Return to Main Website</span>
                      </button>
                    </div>

                    <a
                      href="tel:+2348115231834"
                      className="inline-flex items-center gap-1.5 text-xs text-amber-900 font-bold hover:underline"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-amber-700" />
                      <span>Bursary Desk: +234 811 523 1834</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Persistent Bottom Return Bar */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              id="bottom-return-btn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-slate-300" />
              <span>Return to Application / Close</span>
            </button>

            {verifiedRecord && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Verify Another Student</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Bummptech International Institutional Portal (Session 2025/2026)</span>
          </div>
        </div>

      </div>
    </div>
  );
};

