import React from 'react';
import { Student, StudentReportCard, Subject, getSchoolArm } from '../types';
import { calculateGrade, calculatePrimaryGrade, getEarlyYearsMasteryBadge, evaluatePromotionStatus } from '../utils/grading';
import { BummptechLogo } from './BummptechLogo';
import { Printer, X, Award, CheckCircle, School, ShieldCheck, Sparkles, Star } from 'lucide-react';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  reportCard: StudentReportCard;
  subjects?: Subject[];
  onOpenAiRemarkModal?: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  isOpen,
  onClose,
  student,
  reportCard,
  subjects = [],
  onOpenAiRemarkModal,
}) => {
  if (!isOpen) return null;

  const arm = student.arm || getSchoolArm(student.currentClass || reportCard.classLevel);

  const handlePrint = () => {
    window.print();
  };

  const getSubjectName = (subId: string) => {
    const sub = subjects.find((s) => s.id === subId);
    return sub ? sub.name : subId;
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
          title: 'BUMMPTEDUCATION EARLY YEARS & KINDERGARTEN ACADEMY',
          subTitle: 'Montessori & Early Childhood Care & Education (ECCE) Center • Ages 2–5',
          centerBadge: 'ECCE Accreditation No: BN/ECCE/2024/091',
          subHeadTitle: 'Head of Early Childhood / Kindergarten',
          subHeadName: 'Mrs. Abigail Folashade Balogun (M.Ed)',
          tutorTitle: 'Early Years Lead Educator / Facilitator',
          tutorName: 'Miss Rita Iorfa',
          ratingSystemName: 'Early Learning Mastery Scale (Exceeding • Proficient • Developing • Emerging)',
        };
      case 'primary':
        return {
          title: 'BUMMPTEDUCATION PRIMARY & BASIC EDUCATION ACADEMY',
          subTitle: 'Approved Universal Basic Education (UBE) & Cambridge Primary Center • Basic 1 – 6',
          centerBadge: 'National UBE Center No: BN/UBE/PRI/1042',
          subHeadTitle: 'Headmistress (Primary Sub-Head)',
          subHeadName: 'Mrs. Grace Iveren Shima (M.Ed)',
          tutorTitle: 'Primary Class Master / Tutor',
          tutorName: 'Mr. Moses Terfa Aondo',
          ratingSystemName: 'Primary Distinction Standard (A+ • A • B • C • D • E • F)',
        };
      case 'secondary':
      default:
        return {
          title: 'BUMMPTEDUCATION SECONDARY COLLEGE',
          subTitle: 'Approved WAEC, NECO, Cambridge IGCSE, SAT & JAMB Examination Center',
          centerBadge: 'WAEC / NECO Center No: 028491 • JAMB CBT Code: 49021',
          subHeadTitle: 'Principal (Secondary Sub-Head)',
          subHeadName: 'Dr. (Mrs.) Grace Nkechi Okafor (Ph.D)',
          tutorTitle: 'Senior Form Tutor',
          tutorName: 'Mr. Emmanuel T. Iorfa (M.Sc)',
          ratingSystemName: 'West African Standard 9-Point Scale (A1 to F9)',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-sm print:p-0 print:bg-white">
      <div 
        id="official-report-card-sheet"
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:my-0 print:w-full print:max-w-none"
      >
        {/* Modal Top Action Bar (hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-800">
              Official Terminal Report Sheet • {student.fullName} ({reportCard.classLevel})
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              arm === 'kindergarten' ? 'bg-purple-100 text-purple-800' :
              arm === 'primary' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {arm} wing
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onOpenAiRemarkModal && (
              <button
                onClick={onOpenAiRemarkModal}
                id="open-ai-remark-generator-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                AI Remark Assistant
              </button>
            )}
            <button
              onClick={handlePrint}
              id="print-report-card-btn"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              <Printer className="h-4 w-4" />
              Print / Export PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ==================== OFFICIAL PRINTABLE REPORT CARD SHEET ==================== */}
        <div className="p-8 space-y-6 text-slate-900 bg-white print:p-6 print:space-y-4">
          
          {/* Institutional Crest & Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <BummptechLogo className="h-16 w-16 text-blue-900 drop-shadow-sm print:h-14 print:w-14" />
                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-blue-950 uppercase font-serif">
                    {headerInfo.title}
                  </h1>
                  <p className="text-xs md:text-sm font-semibold text-blue-800">
                    {headerInfo.subTitle}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    A Division of Bummptech Global Concepts • Matthew Ternenge Beeun (General Administrator)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Location: Akperan Orshi Ave, Housing Estate, Makurdi, Benue State, Nigeria • Contact: +234 811 523 1834
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block border-l-2 border-slate-300 pl-4">
                <div className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                  Official Transcript
                </div>
                <div className="text-[11px] font-mono text-slate-600 mt-1 font-bold">
                  {headerInfo.centerBadge}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Term: {reportCard.term} | Session: {reportCard.academicYear}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center bg-blue-950 py-1 text-center text-xs font-bold tracking-wider text-white uppercase rounded">
              Official Comprehensive Terminal Assessment & Progress Report Sheet
            </div>
          </div>

          {/* Student Profile & Bio Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block font-medium">Student Full Name:</span>
              <strong className="text-slate-900 text-sm font-bold">{student.fullName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Admission Number:</span>
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
              <span className="text-slate-700">{student.gender} • {student.dateOfBirth}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Times School Opened:</span>
              <span className="font-semibold text-slate-800">{reportCard.attendance.timesSchoolOpened} days</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Times Present:</span>
              <span className="font-semibold text-emerald-700">{reportCard.attendance.timesPresent} days</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Class Rank / Population:</span>
              <span className="font-bold text-blue-700">
                {reportCard.positionInClass === 1 ? '1st' : reportCard.positionInClass === 2 ? '2nd' : `${reportCard.positionInClass}th`} out of {reportCard.totalStudentsInClass} Pupils
              </span>
            </div>
          </div>

          {/* ==================== ACADEMIC SCORES TABLE (ARM DIFFERENTIATED) ==================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <School className="h-4 w-4 text-blue-700" />
                Cognitive Performance & Subject Assessment Breakdown
              </h3>
              <span className="text-[11px] text-slate-500 font-medium italic">
                CA: 40% (Continuous Assessment) • Exam: 60% • Total: 100%
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2.5 border-r border-slate-300">#</th>
                    <th className="p-2.5 border-r border-slate-300">Subject / Learning Domain</th>
                    <th className="p-2 text-center border-r border-slate-300">CA 1 (10)</th>
                    <th className="p-2 text-center border-r border-slate-300">CA 2 (10)</th>
                    <th className="p-2 text-center border-r border-slate-300">Assign (10)</th>
                    <th className="p-2 text-center border-r border-slate-300">Attnd (10)</th>
                    <th className="p-2 text-center bg-blue-50 font-bold border-r border-slate-300">Total CA (40)</th>
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
                        <td className="p-2 font-semibold text-slate-900 border-r border-slate-200">
                          {getSubjectName(score.subjectId)}
                        </td>
                        <td className="p-2 text-center font-mono border-r border-slate-200">{score.ca1}</td>
                        <td className="p-2 text-center font-mono border-r border-slate-200">{score.ca2}</td>
                        <td className="p-2 text-center font-mono border-r border-slate-200">{score.assignment}</td>
                        <td className="p-2 text-center font-mono border-r border-slate-200">{score.attendance}</td>
                        <td className="p-2 text-center font-mono font-bold text-blue-900 bg-blue-50/40 border-r border-slate-200">
                          {score.totalCa}
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-amber-900 bg-amber-50/40 border-r border-slate-200">
                          {score.examScore}
                        </td>
                        <td className="p-2 text-center font-mono font-black text-indigo-900 bg-indigo-50/40 border-r border-slate-200">
                          {score.totalScore}
                        </td>
                        <td className="p-2 text-center font-bold border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${gradeDetail.color}`}>
                            {score.grade}
                          </span>
                        </td>
                        <td className="p-2 text-center font-mono font-semibold text-slate-700 border-r border-slate-200">
                          {score.positionInSubject ? `${score.positionInSubject}${score.positionInSubject === 1 ? 'st' : score.positionInSubject === 2 ? 'nd' : 'th'}` : '-'}
                        </td>
                        <td className="p-2 text-slate-700 text-[11px] italic">
                          {score.remark || gradeDetail.remark}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={8} className="p-2.5 text-right uppercase tracking-wider text-xs">
                      Term Cumulative Aggregate & Percentage:
                    </td>
                    <td className="p-2 text-center font-black text-blue-900 text-sm bg-blue-100">
                      {reportCard.overallPercentage}%
                    </td>
                    <td colSpan={3} className="p-2 text-left text-xs font-semibold text-slate-700">
                      Total Obtained: {reportCard.totalMarksObtainable ? `${reportCard.scores.reduce((a, b) => a + b.totalScore, 0)} / ${reportCard.totalMarksObtainable}` : 'Satisfactory'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ==================== EARLY YEARS MILESTONES (KINDERGARTEN ONLY) ==================== */}
          {arm === 'kindergarten' && (
            <div className="space-y-2 border border-purple-200 bg-purple-50/30 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-purple-600 fill-purple-600" />
                  Early Childhood Developmental Milestones & Montessori Competency Matrix
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

          {/* ==================== AFFECTIVE & PSYCHOMOTOR SKILLS MATRIX ==================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Psychomotor Assessment */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Affective & Behavioral Traits (Rating: 1 - 5)
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Punctuality:</span>
                  <span className="font-bold text-blue-900">{reportCard.psychomotor.punctuality} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Neatness & Uniform:</span>
                  <span className="font-bold text-blue-900">{reportCard.psychomotor.neatness} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Politeness & Courtesy:</span>
                  <span className="font-bold text-blue-900">{reportCard.psychomotor.politeness} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Class Honesty:</span>
                  <span className="font-bold text-blue-900">{reportCard.psychomotor.honesty} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Leadership & Teamwork:</span>
                  <span className="font-bold text-blue-900">{reportCard.psychomotor.leadership} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Emotional Stability:</span>
                  <span className="font-bold text-blue-900">{reportCard.psychomotor.emotionalStability} / 5</span>
                </div>
              </div>
            </div>

            {/* Psychomotor & Practical Skills */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Psychomotor & Practical Skills (Rating: 1 - 5)
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Handwriting & Penmanship:</span>
                  <span className="font-bold text-emerald-800">{reportCard.psychomotor.handwriting} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Games & Athletics:</span>
                  <span className="font-bold text-emerald-800">{reportCard.psychomotor.sports} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Creative Crafts / Arts:</span>
                  <span className="font-bold text-emerald-800">{reportCard.psychomotor.crafts} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Speech & Oral Fluency:</span>
                  <span className="font-bold text-emerald-800">{reportCard.psychomotor.speechFluency} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Lab / Discovery Handling:</span>
                  <span className="font-bold text-emerald-800">{reportCard.psychomotor.attentiveness} / 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 py-0.5">
                  <span className="text-slate-600">Perseverance:</span>
                  <span className="font-bold text-emerald-800">{reportCard.psychomotor.perseverance} / 5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Promotion & Academic Decision Panel */}
          <div className="rounded-xl bg-slate-900 text-white p-4 space-y-2 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Official Academic Decision / Wing Promotion Status:
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

          {/* Official Comments and Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
                  {headerInfo.tutorTitle}'s Remarks:
                </span>
                <p className="text-xs text-slate-900 font-medium italic mt-1 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  "{reportCard.formTutorRemark || `${student.fullName} has made remarkable progress throughout the term, demonstrating high discipline, sharp cognitive synthesis, and model conduct.`}"
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
                <span>Signature: <strong className="font-serif italic font-normal text-slate-800">{headerInfo.tutorName}</strong></span>
                <span>Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong></span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">
                  {headerInfo.subHeadTitle}'s Endorsement:
                </span>
                <p className="text-xs text-slate-900 font-medium italic mt-1 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                  "{reportCard.principalRemark || `A truly commendable performance. ${student.fullName} exemplifies the high standards of character and scholarship championed by BummptEducation.`}"
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
                <span>Signature & Seal: <strong className="font-serif italic font-normal text-slate-800">{headerInfo.subHeadName}</strong></span>
                <div className="h-6 w-16 border border-dashed border-slate-400 flex items-center justify-center text-[9px] uppercase tracking-widest text-slate-400 font-mono">
                  [STAMP]
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Institutional Central Seal */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>BummptEducation Integrated Multi-Arm System • Bummptech Global Concepts</span>
            <span>Next Term Resumption Date: Monday 4th May 2026</span>
            <span>Report ID: REP-{student.admissionNumber.replace(/\//g, '-')}-T2</span>
          </div>

        </div>
      </div>
    </div>
  );
};
