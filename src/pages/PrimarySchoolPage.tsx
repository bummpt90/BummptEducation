import React, { useState } from 'react';
import { 
  BookOpen, 
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
  Calculator,
  Laptop,
  Globe2,
  Microscope,
  Compass,
  Trophy,
  Brain
} from 'lucide-react';
import { NavigationPage, Student, StudentReportCard } from '../types';

interface PrimarySchoolPageProps {
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  onOpenReportCardModal?: (student: Student, reportCard: StudentReportCard) => void;
}

export const PrimarySchoolPage: React.FC<PrimarySchoolPageProps> = ({
  onNavigate,
  onOpenReportCardModal
}) => {
  const [selectedCurriculumTier, setSelectedCurriculumTier] = useState<'lower' | 'upper'>('upper');

  const navigateTo = (page: NavigationPage, subTab?: string, param?: any) => {
    if (onNavigate) {
      onNavigate(page, subTab, param);
    }
  };

  const handleLaunchSampleReportCard = () => {
    const samplePrimaryStudent: Student = {
      id: 'STU-PRI-001',
      admissionNumber: 'BEDU/PRI/2020/088',
      fullName: 'Emmanuella Chidera Okafor',
      gender: 'Female',
      dateOfBirth: '2014-06-18',
      currentClass: 'Basic 6',
      arm: 'primary',
      house: 'Falcon House (Red)',
      guardianName: 'Dr. (Mrs.) Grace Nkechi Okafor',
      guardianPhone: '+234 803 234 5678',
      guardianEmail: 'graceokafor@gmail.com',
      address: 'Owner Occupier Housing Estate, Makurdi',
      stateOfOrigin: 'Anambra',
      dateEnrolled: '2020-09-10',
      status: 'Active',
    };

    const samplePrimaryReportCard: StudentReportCard = {
      id: 'RC-STU-PRI-001-2nd Term',
      studentId: 'STU-PRI-001',
      arm: 'primary',
      classLevel: 'Basic 6',
      term: '2nd Term',
      academicYear: '2025/2026',
      scores: [
        {
          studentId: 'STU-PRI-001',
          subjectId: 'SUB-PRI-MAT',
          classLevel: 'Basic 6',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 10,
          ca2: 10,
          assignment: 10,
          attendance: 10,
          totalCa: 40,
          examScore: 57,
          totalScore: 97,
          grade: 'A+',
          remark: 'Distinction in arithmetic, fractions & word problem logic',
        },
        {
          studentId: 'STU-PRI-001',
          subjectId: 'SUB-PRI-ENG',
          classLevel: 'Basic 6',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 9,
          ca2: 10,
          assignment: 9,
          attendance: 10,
          totalCa: 38,
          examScore: 54,
          totalScore: 92,
          grade: 'A+',
          remark: 'Fluent reading, accurate grammar & creative essay expression',
        },
        {
          studentId: 'STU-PRI-001',
          subjectId: 'SUB-PRI-QRE',
          classLevel: 'Basic 6',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 10,
          ca2: 10,
          assignment: 10,
          attendance: 10,
          totalCa: 40,
          examScore: 58,
          totalScore: 98,
          grade: 'A+',
          remark: 'Exceptional quantitative logic, speed and accuracy in NCEE drills',
        },
        {
          studentId: 'STU-PRI-001',
          subjectId: 'SUB-PRI-BSC',
          classLevel: 'Basic 6',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 9,
          ca2: 9,
          assignment: 9,
          attendance: 10,
          totalCa: 37,
          examScore: 52,
          totalScore: 89,
          grade: 'A',
          remark: 'Strong scientific inquiry and understanding of living systems',
        },
        {
          studentId: 'STU-PRI-001',
          subjectId: 'SUB-PRI-ICT',
          classLevel: 'Basic 6',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 10,
          ca2: 9,
          assignment: 10,
          attendance: 10,
          totalCa: 39,
          examScore: 55,
          totalScore: 94,
          grade: 'A+',
          remark: 'Mastery of basic Scratch coding logic, keyboarding and algorithms',
        }
      ],
      totalScoreObtained: 470,
      totalPossibleScore: 500,
      overallPercentage: 94.0,
      classAverage: 76.5,
      positionInClass: 1,
      totalStudentsInClass: 32,
      psychomotor: {
        punctuality: 5,
        neatness: 5,
        politeness: 5,
        honesty: 5,
        peerRelationship: 5,
        leadership: 5,
        handwriting: 5,
        sportsAndGames: 4,
        craftsAndPractical: 5,
        attentiveness: 5,
      },
      formTutorRemark: 'Emmanuella is an exceptional scholar, Primary Pupil Head Girl, and brilliant analytical thinker ready to excel in the National Common Entrance.',
      formTutorName: 'Mr. Moses Terfa Aondo',
      principalRemark: 'Outstanding terminal performance. Emmanuella exemplifies academic excellence and pristine leadership.',
      principalName: 'Mrs. Grace Iveren Shima',
      principalTitle: 'Headmistress (Basic Education Wing)',
      promotionalStatus: 'Eligible for NCEE & Common Entrance',
      attendanceTotalDays: 60,
      attendancePresent: 60,
      nextTermBegins: '2026-05-04',
    };

    if (onOpenReportCardModal) {
      onOpenReportCardModal(samplePrimaryStudent, samplePrimaryReportCard);
    } else {
      navigateTo('academic', 'reports');
    }
  };

  const primaryClasses = [
    { class: 'Basic 1', tier: 'Lower Primary (Ages 5 – 6)', focus: 'Phonetic Reading, Elementary Number Bonds & Handwriting' },
    { class: 'Basic 2', tier: 'Lower Primary (Ages 6 – 7)', focus: 'Sentence Construction, Multiplication Tables & Social Habits' },
    { class: 'Basic 3', tier: 'Lower Primary (Ages 7 – 8)', focus: 'Reading Comprehension, Quantitative Thinking & Basic Science' },
    { class: 'Basic 4', tier: 'Upper Primary (Ages 8 – 9)', focus: 'Fractions, Decimals, Civic Responsibilities & Scratch Coding' },
    { class: 'Basic 5', tier: 'Upper Primary (Ages 9 – 10)', focus: 'Algebraic Basics, Science Experiments & Essay Writing' },
    { class: 'Basic 6', tier: 'Upper Primary (Ages 10 – 11)', focus: 'National Common Entrance (NCEE) Mastery & JSS Transition' },
  ];

  const primarySubjects = [
    { name: 'English Studies & Phonics', code: 'PRI-ENG', category: 'Language & Literacy' },
    { name: 'General Mathematics', code: 'PRI-MAT', category: 'Mathematical Sciences' },
    { name: 'Basic Science & Technology', code: 'PRI-BSC', category: 'Science & STEM' },
    { name: 'Quantitative Reasoning', code: 'PRI-QRE', category: 'Aptitude & Logic' },
    { name: 'Verbal Reasoning', code: 'PRI-VRE', category: 'Aptitude & Logic' },
    { name: 'Social Studies & Citizenship', code: 'PRI-SOC', category: 'National Values' },
    { name: 'Civic Education', code: 'PRI-CIV', category: 'National Values' },
    { name: 'Computer Studies / Coding & Robotics', code: 'PRI-ICT', category: 'Digital Technology' },
    { name: 'Agricultural Science', code: 'PRI-AGR', category: 'Applied Science' },
    { name: 'Cultural & Creative Arts (CCA)', code: 'PRI-CCA', category: 'Creative Arts' },
    { name: 'Christian Religious Studies (CRS)', code: 'PRI-CRS', category: 'Religious Studies' },
    { name: 'Physical & Health Education (PHE)', code: 'PRI-PHE', category: 'Health & Wellness' },
    { name: 'French Language', code: 'PRI-FRE', category: 'Foreign Languages' },
    { name: 'Hausa / Mother Tongue', code: 'PRI-HAU', category: 'Indigenous Languages' },
  ];

  const faculty = [
    {
      name: 'Mrs. Grace Iveren Shima',
      role: 'Headmistress & Sub-Head (Primary Wing)',
      qualifications: 'M.Ed Primary School Administration, B.Ed Primary Education Studies, TRCN',
      email: 'headmistress@bummpteducation.edu.ng',
      scope: 'Universal Basic Education 1–6 Supervision, Curriculum Quality & Common Entrance Lead'
    },
    {
      name: 'Mr. Moses Terfa Aondo',
      role: 'Basic 6 Form Tutor & Common Entrance Lead',
      qualifications: 'B.Sc. (Ed) Mathematics, TRCN Certified',
      email: 'm.aondo@bummpteducation.edu.ng',
      scope: 'Quantitative Reasoning, Primary Mathematics & NCEE Prep'
    },
    {
      name: 'Mrs. Hadiza Abubakar',
      role: 'Basic 3 Form Tutor & Primary Literacy Lead',
      qualifications: 'B.A. (Ed) English, NCE Primary Education',
      email: 'h.abubakar@bummpteducation.edu.ng',
      scope: 'English Studies, Verbal Reasoning & Remedial Reading'
    },
    {
      name: 'Mr. Jude Chukwudi Okafor',
      role: 'Primary STEM, ICT & Robotics Specialist',
      qualifications: 'B.Tech Computer Science, PGDE',
      email: 'j.okafor@bummpteducation.edu.ng',
      scope: 'Elementary Coding, Robotics Kits & Basic Science Labs'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10" id="primary-school-page-root">
      {/* Breadcrumb / Top Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <BookOpen className="h-4 w-4" />
          <span>Educational Wing 2: Primary School / Basic Education Arm (Basic 1 – 6)</span>
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white p-8 sm:p-10 border border-emerald-800/40 shadow-xl">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-900/80 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-700">
              <Brain className="h-3.5 w-3.5 text-emerald-300" />
              <span>Universal Basic Education (UBE 1-6) • STEM Lab • Common Entrance Drills</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Primary School & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">Basic Education Arm</span> (Basic 1 – 6)
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl">
              Presided over by Sub-Head <strong>Mrs. Grace Iveren Shima</strong> (Headmistress) under Central Governance (<strong>Dr. Matthew Ternenge Beeun</strong>), our Primary Arm delivers rigorous 9-year basic education foundations, mental arithmetic, STEM discovery, verbal/quantitative reasoning, and high pass-rates in the National Common Entrance Examination (NCEE).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigateTo('lesson-notes')}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition cursor-pointer"
              >
                <FileText className="h-4 w-4 text-indigo-200" />
                <span>Download Primary Lesson Notes (PDF)</span>
              </button>

              <button
                onClick={handleLaunchSampleReportCard}
                id="view-primary-sample-report-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>View Live Basic 6 Distinction Report Card</span>
              </button>

              <button
                onClick={() => navigateTo('academic', 'broadsheet')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-emerald-200 hover:bg-slate-700 transition border border-emerald-700/50 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>Primary Broadsheet (Basic 1–6)</span>
              </button>

              <button
                onClick={() => navigateTo('admin', 'fees')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
              >
                <CreditCard className="h-4 w-4 text-amber-400" />
                <span>Primary Fee Schedule</span>
              </button>
            </div>
          </div>

          {/* Sub-Head Card */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-emerald-900/40 p-5 border border-emerald-500/30 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                  GS
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-emerald-300 font-bold block">Sub-Head Officer</span>
                  <h3 className="text-sm font-bold text-white">Mrs. Grace Iveren Shima</h3>
                  <p className="text-[11px] text-emerald-200">Headmistress Basic Education</p>
                </div>
              </div>

              <div className="text-[11px] text-emerald-200 space-y-1.5 leading-tight">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reporting Line:</span>
                  <strong className="text-white">General Administrator</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assessment System:</span>
                  <strong className="text-emerald-300">40% CA + 60% Exam</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Grading Scale:</span>
                  <strong className="text-white">Distinction Scale (A+ to F)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scope:</span>
                  <strong className="text-white">Basic 1 to Basic 6</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Class Levels (Basic 1 to 6) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Primary Education Classes (Basic 1 to Basic 6)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Structured into Lower Basic (Foundation) and Upper Basic (Advanced Reasoning & Placement Preparatory).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {primaryClasses.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {item.class}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">{item.tier}</span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {item.focus}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Term Assessment:</span>
                <span className="font-bold text-emerald-700">CA 40 / Exam 60</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 14 Primary Curriculum Subjects */}
      <section className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">Curricular Spectrum</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              14 Universal Basic Education Academic Subjects
            </h2>
          </div>
          <button
            onClick={() => navigateTo('academic', 'scoresheet')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer self-start sm:self-auto"
          >
            <span>Open Primary Scoresheets</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {primarySubjects.map((sub, index) => (
            <div key={index} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-200 transition flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 block">{sub.code}</span>
                <h4 className="font-bold text-xs text-slate-900">{sub.name}</h4>
                <p className="text-[11px] text-emerald-700 font-medium">{sub.category}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Assessment Architecture & Distinction Scale */}
      <section className="rounded-3xl bg-emerald-50/70 p-6 sm:p-8 border border-emerald-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <Award className="h-4 w-4 text-emerald-600" />
              <span>Assessment & Evaluation Standards</span>
            </div>
            <h2 className="text-xl font-black text-emerald-950 mt-0.5">
              Primary Distinction Grading Scale (A+ to F)
            </h2>
          </div>
          <div className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-lg">
            40% Continuous Assessment • 60% Terminal Examination
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-emerald-300 text-center space-y-1">
            <span className="text-sm font-black text-emerald-700">A+ (90-100%)</span>
            <p className="text-[10px] font-bold text-slate-800 uppercase">Distinction</p>
            <p className="text-[10px] text-slate-500">Exceptional Mastery</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-center space-y-1">
            <span className="text-sm font-black text-emerald-600">A (80-89%)</span>
            <p className="text-[10px] font-bold text-slate-800 uppercase">Excellent</p>
            <p className="text-[10px] text-slate-500">Above Standard</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-blue-200 text-center space-y-1">
            <span className="text-sm font-black text-blue-600">B (70-79%)</span>
            <p className="text-[10px] font-bold text-slate-800 uppercase">Very Good</p>
            <p className="text-[10px] text-slate-500">Strong Competence</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-cyan-200 text-center space-y-1">
            <span className="text-sm font-black text-cyan-600">C (60-69%)</span>
            <p className="text-[10px] font-bold text-slate-800 uppercase">Good</p>
            <p className="text-[10px] text-slate-500">Standard Met</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-amber-200 text-center space-y-1">
            <span className="text-sm font-black text-amber-600">D (50-59%)</span>
            <p className="text-[10px] font-bold text-slate-800 uppercase">Pass</p>
            <p className="text-[10px] text-slate-500">Fair Understanding</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-rose-200 text-center space-y-1">
            <span className="text-sm font-black text-rose-600">F (0-49%)</span>
            <p className="text-[10px] font-bold text-slate-800 uppercase">Remedial</p>
            <p className="text-[10px] text-slate-500">Intervention Needed</p>
          </div>
        </div>
      </section>

      {/* Special Spotlight: National Common Entrance Examination (NCEE) */}
      <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">Placement Excellence</span>
            <h2 className="text-xl font-bold text-white">
              Basic 6 National Common Entrance & Placement Clinic
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-900 text-emerald-200 text-xs font-bold border border-emerald-700">
              100% Placement Record
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Calculator className="h-4 w-4" />
              <h4>Quantitative & Mental Math Clinics</h4>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Daily 2-hour problem-solving workshops focusing on speed arithmetic, geometric sequences, and complex reasoning patterns.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <BookOpen className="h-4 w-4" />
              <h4>Verbal Aptitude & Essay Composition</h4>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Advanced vocabulary drilling, analogies, antonyms/synonyms, and structured formal paragraph composition.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Trophy className="h-4 w-4" />
              <h4>Simulated CBT Testing Series</h4>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Weekly computerized timed tests in our ICT laboratory to build student stamina and zero-error test-taking habits.
            </p>
          </div>
        </div>
      </section>

      {/* Primary Faculty Directory */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Primary Teaching Faculty & STEM Specialists
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Dedicated educators certified by Teachers Registration Council of Nigeria (TRCN).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {faculty.map((member, index) => (
            <div key={index} className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase block">{member.role}</span>
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
            onClick={() => navigateTo('secondary-arm')}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
          >
            Secondary College Arm (JSS - SSS) →
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
