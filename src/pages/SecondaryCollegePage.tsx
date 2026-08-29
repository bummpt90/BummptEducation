import React, { useState } from 'react';
import { 
  School, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Layers, 
  GraduationCap, 
  FileText, 
  CreditCard, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Atom,
  BookOpen,
  TrendingUp,
  Cpu,
  Globe,
  Compass,
  Trophy,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { NavigationPage, Student, StudentReportCard } from '../types';

interface SecondaryCollegePageProps {
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  onOpenReportCardModal?: (student: Student, reportCard: StudentReportCard) => void;
}

export const SecondaryCollegePage: React.FC<SecondaryCollegePageProps> = ({
  onNavigate,
  onOpenReportCardModal
}) => {
  const [selectedTrack, setSelectedTrack] = useState<'science' | 'arts' | 'commercial'>('science');

  const navigateTo = (page: NavigationPage, subTab?: string, param?: any) => {
    if (onNavigate) {
      onNavigate(page, subTab, param);
    }
  };

  const handleLaunchSampleReportCard = () => {
    const sampleSeniorStudent: Student = {
      id: 'STU-001',
      admissionNumber: 'BEDU/2022/001',
      fullName: 'Dooshima Matthew Beeun',
      gender: 'Female',
      dateOfBirth: '2008-05-14',
      currentClass: 'SSS 2 Science',
      arm: 'secondary',
      house: 'Eagle House (Blue)',
      guardianName: 'Dr. Matthew Ternenge Beeun',
      guardianPhone: '+234 811 523 1834',
      guardianEmail: 'matthewbeeun@gmail.com',
      address: 'Akperan Orshi Avenue, Makurdi, Benue State',
      stateOfOrigin: 'Benue',
      dateEnrolled: '2022-09-12',
      status: 'Active',
    };

    const sampleSeniorReportCard: StudentReportCard = {
      id: 'RC-STU-001-2nd Term',
      studentId: 'STU-001',
      arm: 'secondary',
      classLevel: 'SSS 2 Science',
      term: '2nd Term',
      academicYear: '2025/2026',
      scores: [
        {
          studentId: 'STU-001',
          subjectId: 'SUB-ENG',
          classLevel: 'SSS 2 Science',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 9,
          ca2: 10,
          assignment: 9,
          attendance: 10,
          totalCa: 38,
          examScore: 54,
          totalScore: 92,
          grade: 'A1',
          remark: 'Exceptional mastery of English grammar, phonetics and argumentative essay',
        },
        {
          studentId: 'STU-001',
          subjectId: 'SUB-MAT',
          classLevel: 'SSS 2 Science',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 10,
          ca2: 10,
          assignment: 10,
          attendance: 10,
          totalCa: 40,
          examScore: 58,
          totalScore: 98,
          grade: 'A1',
          remark: 'Outstanding mathematical reasoning, calculus & trigonometry accuracy',
        },
        {
          studentId: 'STU-001',
          subjectId: 'SUB-PHY',
          classLevel: 'SSS 2 Science',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 10,
          ca2: 9,
          assignment: 10,
          attendance: 10,
          totalCa: 39,
          examScore: 55,
          totalScore: 94,
          grade: 'A1',
          remark: 'Flawless physics practical deductions and mechanics problem solving',
        },
        {
          studentId: 'STU-001',
          subjectId: 'SUB-CHM',
          classLevel: 'SSS 2 Science',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 9,
          ca2: 10,
          assignment: 9,
          attendance: 10,
          totalCa: 38,
          examScore: 53,
          totalScore: 91,
          grade: 'A1',
          remark: 'Thorough grasp of stoichiometry, organic structures and volumetric titrations',
        },
        {
          studentId: 'STU-001',
          subjectId: 'SUB-BIO',
          classLevel: 'SSS 2 Science',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 10,
          ca2: 9,
          assignment: 10,
          attendance: 10,
          totalCa: 39,
          examScore: 52,
          totalScore: 91,
          grade: 'A1',
          remark: 'Impeccable biological drawings and ecological systems analysis',
        }
      ],
      totalScoreObtained: 466,
      totalPossibleScore: 500,
      overallPercentage: 93.2,
      classAverage: 68.4,
      positionInClass: 1,
      totalStudentsInClass: 38,
      affective: {
        punctuality: 5,
        neatness: 5,
        politeness: 5,
        honesty: 5,
        peerRelationship: 5,
        leadership: 5,
        emotionalStability: 5,
        obedience: 5,
        attentiveness: 5,
        perseverance: 5,
      },
      psychomotor: {
        handwriting: 5,
        sportsAndGames: 5,
        craftsAndPractical: 5,
        verbalFluency: 5,
        musicalDramatic: 5,
        handlingOfTools: 5,
        physicalAgility: 5,
      },
      formTutorRemark: 'Dooshima continues to demonstrate exceptional intellectual rigor, impeccable moral standing as Senior Prefect / Head Girl, and brilliant science leadership.',
      formTutorName: 'Mr. David Olatunji',
      principalRemark: 'A stellar academic performance that reflects great dedication and scholarly distinction. Strongly commended for national scholarship candidacy.',
      principalName: 'Dr. (Mrs.) Grace Nkechi Okafor',
      principalTitle: 'Principal & Sub-Head (Secondary College)',
      promotionalStatus: 'Eligible for Finals (WAEC / NECO / IGCSE / SAT / JAMB)',
      attendanceTotalDays: 60,
      attendancePresent: 60,
      nextTermBegins: '2026-05-04',
    };

    if (onOpenReportCardModal) {
      onOpenReportCardModal(sampleSeniorStudent, sampleSeniorReportCard);
    } else {
      navigateTo('academic', 'reports');
    }
  };

  const tracks = {
    science: {
      title: 'Senior Science & Technology Track',
      badge: 'STEM & Medical Preparatory',
      description: 'Prepares future engineers, medical doctors, software architects, and research scientists for WAEC, IGCSE, SAT, and university matriculation.',
      subjects: [
        'Physics (PHY201)',
        'Chemistry (CHM201)',
        'Biology (BIO201)',
        'Further Mathematics (FUR201)',
        'Technical Drawing (TDG201)',
        'Agricultural Science (AGR201)',
        'Computer Studies / ICT (ICT101)',
        'General Mathematics & English Language'
      ]
    },
    arts: {
      title: 'Senior Arts & Humanities Track',
      badge: 'Law, Diplomacy & Humanities',
      description: 'Prepares future attorneys, diplomats, journalists, authors, and sociologists with deep critical analysis, literary dissection, and civic mastery.',
      subjects: [
        'Literature-in-English (LIT201)',
        'Government & Politics (GOV201)',
        'History of West Africa & World (HIS201)',
        'Christian / Islamic Religious Studies',
        'Civic & Constitutional Education',
        'French & Indigenous Languages (Hausa)',
        'Economics (ECO201)',
        'General Mathematics & English Language'
      ]
    },
    commercial: {
      title: 'Senior Business & Commercial Track',
      badge: 'Finance, Banking & Accounting',
      description: 'Prepares future chartered accountants, corporate executives, economists, and entrepreneurs for ICAN, ACCA, and business degrees.',
      subjects: [
        'Financial Accounting (ACC201)',
        'Commerce & Global Trade (COM201)',
        'Economics (ECO201)',
        'Marketing & Brand Strategy (MKT201)',
        'Trade & Entrepreneurship (ENT101)',
        'Office Practice & Secretarial Studies',
        'General Mathematics & English Language',
        'Computer Studies & Spreadsheet Accounting'
      ]
    }
  };

  const examAccreditations = [
    { name: 'WAEC WASSCE', status: 'Full Center Accreditation (No: 028491)', type: 'Senior West African Certificate' },
    { name: 'NECO SSCE', status: 'National Senior School Certification', type: 'Federal Examination Council' },
    { name: 'BECE / Junior WAEC', status: 'Basic Education Certificate Examination', type: 'Junior Secondary Capstone' },
    { name: 'Cambridge IGCSE', status: 'British Council Registered Center', type: 'International Secondary General' },
    { name: 'SAT & IELTS', status: 'College Board Global Testing Partner', type: 'US & Global University Admissions' },
    { name: 'JAMB UTME CBT', status: '120 Terminals High-Speed Computer Center', type: 'Unified Tertiary Matriculation' },
  ];

  const collegeLeadership = [
    {
      name: 'Dr. (Mrs.) Grace Nkechi Okafor',
      role: 'Principal & Sub-Head (Secondary College)',
      qualifications: 'Ph.D. Educational Administration, M.Ed, B.Sc. (Ed) Chemistry',
      email: 'principal@bummpteducation.edu.ng',
      scope: 'Secondary College Apex, Academic Rigor, WAEC/NECO Quality & University Guidance'
    },
    {
      name: 'Mr. Emmanuel Terkula Iorfa',
      role: 'Vice-Principal (Academics - Secondary)',
      qualifications: 'M.Sc. Mathematics, B.Sc. (Ed) Mathematics',
      email: 'vp.academic@bummpteducation.edu.ng',
      scope: 'Curriculum Delivery, Timetables, HOD Audits & Continuous Assessment Standards'
    },
    {
      name: 'Mrs. Fatima Al-Hassan',
      role: 'Chief Examination Officer (Secondary)',
      qualifications: 'M.Ed Measurement & Evaluation, B.Sc Physics',
      email: 'exams@bummpteducation.edu.ng',
      scope: 'WAEC, NECO, IGCSE, SAT & JAMB Registration, Biometrics & CBT Operations'
    },
    {
      name: 'Mr. David Olatunji',
      role: 'Head of Department (Sciences) & Senior Physics Master',
      qualifications: 'B.Sc Physics, PGDE',
      email: 'd.olatunji@bummpteducation.edu.ng',
      scope: 'Science Laboratories, STEM Research Projects & Olympiad Coaching'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10" id="secondary-college-page-root">
      {/* Breadcrumb / Top Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          <School className="h-4 w-4" />
          <span>Educational Wing 3: Secondary College Arm (JSS 1 – SSS 3)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('organogram')}
            className="text-xs font-bold text-slate-600 hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Central Governance Organogram</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-10 border border-blue-800/40 shadow-xl">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-900/80 px-3 py-1 text-xs font-bold text-blue-200 border border-blue-700">
              <Globe className="h-3.5 w-3.5 text-blue-300" />
              <span>WAEC • NECO • Cambridge IGCSE • SAT • JAMB UTME Center (028491)</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Secondary College & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-indigo-200">Senior Academic Wing</span> (JSS 1 – SSS 3)
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-3xl">
              Led by Sub-Head <strong>Dr. (Mrs.) Grace Nkechi Okafor</strong> (Principal, Ph.D) under Central Executive Governance (<strong>Dr. Matthew Ternenge Beeun</strong>), the Secondary College provides world-class STEM, Humanities, and Business education. Our students achieve top distinctions in West African and International board examinations.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigateTo('lesson-notes')}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition cursor-pointer"
              >
                <FileText className="h-4 w-4 text-indigo-200" />
                <span>Download College Lesson Notes (PDF)</span>
              </button>

              <button
                onClick={handleLaunchSampleReportCard}
                id="view-secondary-sample-report-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-500 transition cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>View Live SSS 2 Science Report Card</span>
              </button>

              <button
                onClick={() => navigateTo('academic', 'broadsheet')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-blue-200 hover:bg-slate-700 transition border border-blue-700/50 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-blue-400" />
                <span>Secondary Broadsheet & Matrix</span>
              </button>

              <button
                onClick={() => navigateTo('academic', 'transcript')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
              >
                <GraduationCap className="h-4 w-4 text-amber-400" />
                <span>Official Transcripts (JSS–SSS)</span>
              </button>
            </div>
          </div>

          {/* Sub-Head Card */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-blue-900/40 p-5 border border-blue-500/30 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-3 border-b border-blue-500/20 pb-3">
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                  GO
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-blue-300 font-bold block">Sub-Head Officer</span>
                  <h3 className="text-sm font-bold text-white">Dr. (Mrs.) Grace Okafor</h3>
                  <p className="text-[11px] text-blue-200">Principal (Ph.D in Education)</p>
                </div>
              </div>

              <div className="text-[11px] text-blue-200 space-y-1.5 leading-tight">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reporting Line:</span>
                  <strong className="text-white">General Administrator</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Grading Scale:</span>
                  <strong className="text-amber-300">9-Point WAEC (A1 to F9)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assessment:</span>
                  <strong className="text-white">40% CA + 60% Exam</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scope:</span>
                  <strong className="text-white">JSS 1–3 • SSS 1–3</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Senior Specialized Academic Tracks (Science, Arts, Commercial) */}
      <section className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-mono">Senior Specialized Streams</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Senior Secondary Academic Career Streams (SSS 1 to SSS 3)
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTrack('science')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedTrack === 'science' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Science & Engineering
            </button>
            <button
              onClick={() => setSelectedTrack('arts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedTrack === 'arts' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Arts & Humanities
            </button>
            <button
              onClick={() => setSelectedTrack('commercial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedTrack === 'commercial' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Business & Commercial
            </button>
          </div>
        </div>

        {/* Selected Track Details */}
        {(() => {
          const track = tracks[selectedTrack];
          return (
            <div className="rounded-2xl bg-blue-50/50 p-6 border border-blue-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-base text-blue-950">{track.title}</h3>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                  {track.badge}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{track.description}</p>

              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Subject Syllabus Allocations:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {track.subjects.map((sub, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-blue-100 shadow-xs flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">{sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Official 9-Point WAEC / NECO Grade Scale */}
      <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Award className="h-4 w-4 text-amber-400" />
              <span>West African Examination Standards</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Official 9-Point WAEC / NECO Grading Scale
            </h2>
          </div>
          <div className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            Internal & External Standard Matrix
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 space-y-1">
            <span className="font-black text-sm text-emerald-300">A1</span>
            <p className="text-[10px] text-emerald-200 font-bold">75 - 100%</p>
            <p className="text-[9px] text-slate-300 uppercase">Excellent</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/40 space-y-1">
            <span className="font-black text-sm text-emerald-400">B2</span>
            <p className="text-[10px] text-emerald-200 font-bold">70 - 74%</p>
            <p className="text-[9px] text-slate-300 uppercase">Very Good</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-500/50 space-y-1">
            <span className="font-black text-sm text-blue-300">B3</span>
            <p className="text-[10px] text-blue-200 font-bold">65 - 69%</p>
            <p className="text-[9px] text-slate-300 uppercase">Good</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-600/40 space-y-1">
            <span className="font-black text-sm text-sky-300">C4</span>
            <p className="text-[10px] text-sky-200 font-bold">60 - 64%</p>
            <p className="text-[9px] text-slate-300 uppercase">Credit</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-700/40 space-y-1">
            <span className="font-black text-sm text-sky-300">C5</span>
            <p className="text-[10px] text-sky-200 font-bold">55 - 59%</p>
            <p className="text-[9px] text-slate-300 uppercase">Credit</p>
          </div>
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-700/40 space-y-1">
            <span className="font-black text-sm text-cyan-300">C6</span>
            <p className="text-[10px] text-cyan-200 font-bold">50 - 54%</p>
            <p className="text-[9px] text-slate-300 uppercase">Credit</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-1">
            <span className="font-black text-sm text-amber-400">D7</span>
            <p className="text-[10px] text-amber-200 font-bold">45 - 49%</p>
            <p className="text-[9px] text-slate-300 uppercase">Pass</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-1">
            <span className="font-black text-sm text-amber-300">E8</span>
            <p className="text-[10px] text-amber-200 font-bold">40 - 44%</p>
            <p className="text-[9px] text-slate-300 uppercase">Pass</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/40 space-y-1">
            <span className="font-black text-sm text-rose-400">F9</span>
            <p className="text-[10px] text-rose-200 font-bold">0 - 39%</p>
            <p className="text-[9px] text-slate-300 uppercase">Fail</p>
          </div>
        </div>
      </section>

      {/* External Accreditations & Examination Centers */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Accredited External Examination Center (Center No: 028491)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Full recognition by federal, regional, and international testing boards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {examAccreditations.map((item, index) => (
            <div key={index} className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-2">
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase block">{item.type}</span>
              <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
              <p className="text-xs text-emerald-700 font-semibold">{item.status}</p>
            </div>
          ))}
        </div>
      </section>

      {/* College Teaching Faculty & HODs */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Secondary College Academic Leadership & Faculty
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Committed to high academic performance, moral fortitude, and global admissions readiness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {collegeLeadership.map((member, index) => (
            <div key={index} className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase block">{member.role}</span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">{member.name}</h3>
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {member.scope}
                </p>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <strong>Email:</strong> {member.email}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Cross-Navigation Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 text-xs">
        <span className="font-bold text-slate-700">Explore Other Arms:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigateTo('kindergarten-arm')}
            className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
          >
            ← Early Childhood Arm (KG 1 - 3)
          </button>
          <button
            onClick={() => navigateTo('primary-arm')}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
          >
            ← Primary School Arm (Basic 1 - 6)
          </button>
          <button
            onClick={() => navigateTo('student-leadership')}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
          >
            Student Leadership Councils →
          </button>
        </div>
      </div>
    </div>
  );
};
