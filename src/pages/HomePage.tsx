import React, { useState } from 'react';
import { NavigationPage, Student, AssessmentScore, StudentReportCard, ClassLevel } from '../types';
import { 
  GraduationCap, 
  Award, 
  FileSpreadsheet, 
  CreditCard, 
  UserPlus, 
  ArrowRight, 
  Calendar, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Flame, 
  TrendingUp, 
  Layers,
  ChevronRight,
  Bell,
  UserCheck,
  PhoneCall,
  ExternalLink,
  Baby,
  School,
  FileText,
  Download
} from 'lucide-react';
import { INITIAL_ANNOUNCEMENTS } from '../data/mockData';

interface HomePageProps {
  setActivePage?: (page: NavigationPage) => void;
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  students?: Student[];
  assessments?: AssessmentScore[];
  onOpenReportCard?: (studentId: string) => void;
  onOpenReportCardModal?: (student: Student, reportCard: StudentReportCard) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  setActivePage, 
  onNavigate,
  students = [],
  assessments = [],
  onOpenReportCard,
  onOpenReportCardModal
}) => {
  const [announcementFilter, setAnnouncementFilter] = useState<'All' | 'Academic' | 'Administrative' | 'Sports & Events' | 'Examination'>('All');

  const navigateTo = (page: NavigationPage, subTab?: string, param?: any) => {
    if (onNavigate) {
      onNavigate(page, subTab, param);
    } else if (setActivePage) {
      setActivePage(page);
    }
  };

  const handleQuickReportCard = (studentId: string) => {
    if (onOpenReportCardModal && students.length > 0) {
      const stu = students.find(s => s.id === studentId) || students[0];
      const stuScores = assessments.filter(a => a.studentId === stu.id && a.term === '2nd Term');
      const isKg = stu.currentClass.startsWith('KG');
      const isPrimary = stu.currentClass.startsWith('Basic');

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
        psychomotor: {
          punctuality: 5,
          neatness: 5,
          politeness: 5,
          honesty: 5,
          peerRelationship: 5,
          leadership: 5,
          handwriting: 4,
          sportsAndGames: 4,
          craftsAndPractical: 5,
          attentiveness: 5,
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
      };
      onOpenReportCardModal(stu, rc);
    } else if (onOpenReportCard) {
      onOpenReportCard(studentId);
    } else {
      navigateTo('academic', 'reports');
    }
  };

  const filteredAnnouncements = announcementFilter === 'All'
    ? INITIAL_ANNOUNCEMENTS
    : INITIAL_ANNOUNCEMENTS.filter((a) => a.category === announcementFilter);

  return (
    <div className="space-y-12 pb-16" id="home-page-container">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-900/60 px-3 py-1.5 text-xs font-semibold text-blue-200 border border-blue-700/50 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Integrated Multi-Arm System • Kindergarten 1-3 | Basic 1-6 | JSS 1 - SSS 3</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Wholistic Educational Rigor & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">Institutional Mastery</span> from Early Years to Secondary College
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                BummptEducation unifies all 3 arms under central governance (General Administrator: Dr. Matthew Ternenge Beeun). Supporting Continuous Assessment (40%), Terminal Exams (60%), Early Childhood Milestones, Primary NCEE, and Secondary WAEC / NECO / Cambridge IGCSE / SAT / JAMB standards.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => navigateTo('academic', 'reports')}
                  id="hero-academic-portal-btn"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-500 transition active:scale-95 cursor-pointer"
                >
                  <GraduationCap className="h-5 w-5" />
                  <span>Launch Academic Controller</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>

                <button
                  onClick={() => navigateTo('lesson-notes')}
                  id="hero-lesson-notes-btn"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-500 transition active:scale-95 cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-indigo-200" />
                  <span>Download Lesson Notes (PDF)</span>
                </button>

                <button
                  onClick={() => navigateTo('admin', 'fees')}
                  id="hero-bursary-btn"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-slate-100 hover:bg-slate-700 transition border border-slate-700 cursor-pointer"
                >
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  <span>Bursary & Admissions</span>
                </button>

                <button
                  onClick={() => navigateTo('organogram')}
                  id="hero-organogram-btn"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-800 cursor-pointer"
                >
                  <Layers className="h-4 w-4 text-blue-400" />
                  <span>Multi-Arm Organogram</span>
                </button>

                <button
                  onClick={() => navigateTo('docs')}
                  id="hero-docs-btn"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-800 cursor-pointer"
                >
                  <BookOpen className="h-4 w-4 text-amber-400" />
                  <span>Documentation</span>
                </button>
              </div>

              {/* Verified Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
                <button 
                  onClick={() => navigateTo('academic', 'scoresheet')}
                  className="text-left hover:opacity-80 transition cursor-pointer"
                >
                  <span className="block text-xl font-extrabold text-blue-400">40% / 60%</span>
                  <span className="text-slate-400 text-[11px] underline decoration-blue-500/50">CA + Examination Matrix</span>
                </button>
                <button 
                  onClick={() => navigateTo('docs', 'grading')}
                  className="text-left hover:opacity-80 transition cursor-pointer"
                >
                  <span className="block text-xl font-extrabold text-emerald-400">WAEC • NECO</span>
                  <span className="text-slate-400 text-[11px] underline decoration-emerald-500/50">+ IGCSE / SAT / JAMB / NCEE</span>
                </button>
                <button 
                  onClick={() => navigateTo('organogram')}
                  className="text-left hover:opacity-80 transition cursor-pointer"
                >
                  <span className="block text-xl font-extrabold text-amber-400">3 Arms</span>
                  <span className="text-slate-400 text-[11px] underline decoration-amber-500/50">Unified Administration</span>
                </button>
              </div>
            </div>

            {/* Hero Quick Portal Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-800 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Live Multi-Arm Quick Actions
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                    Active Session 2025/2026
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleQuickReportCard('STU-001')}
                    className="w-full group flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-blue-600/20 border border-slate-700/60 hover:border-blue-500/50 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-600/20 p-2 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-300">
                          Secondary: SSS 2 Terminal Report Card
                        </h4>
                        <p className="text-[11px] text-slate-400">Dooshima Matthew Beeun (WAEC Track • 90.1%)</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
                  </button>

                  <button
                    onClick={() => handleQuickReportCard('STU-PRI-001')}
                    className="w-full group flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-emerald-600/20 border border-slate-700/60 hover:border-emerald-500/50 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-600/20 p-2 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">
                          Primary: Basic 6 Terminal Report Card
                        </h4>
                        <p className="text-[11px] text-slate-400">Emmanuella Chidera (NCEE Distinction • 91.5%)</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
                  </button>

                  <button
                    onClick={() => handleQuickReportCard('STU-KG-001')}
                    className="w-full group flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-purple-600/20 border border-slate-700/60 hover:border-purple-500/50 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-600/20 p-2 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                        <Baby className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-purple-300">
                          Kindergarten: KG 3 Milestone Report
                        </h4>
                        <p className="text-[11px] text-slate-400">Tersoo Daniel Beeun (Early Years Mastery • 92.4%)</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
                  </button>

                  <button
                    onClick={() => navigateTo('lesson-notes')}
                    className="w-full group flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/50 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-600/20 p-2 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">
                          Class Lesson Notes & PDF Repository
                        </h4>
                        <p className="text-[11px] text-slate-400">Download weekly teacher notes across all classes</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
                  </button>

                  <button
                    onClick={() => navigateTo('admin', 'admissions')}
                    className="w-full group flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-amber-600/20 border border-slate-700/60 hover:border-amber-500/50 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-amber-600/20 p-2 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300">
                          Multi-Arm Entrance Admissions & Screening
                        </h4>
                        <p className="text-[11px] text-slate-400">KG, Primary Basic & Secondary intake</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Containers */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Core Educational Wings: KG 1-3, Basic 1-6, JSS 1-3, SSS 1-3 */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              The Three Distinct Educational Wings
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Structured to meet international and West African educational standards, each arm features dedicated leadership and tailored curricula.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wing 1: Kindergarten */}
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-300 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-black text-sm">
                    KG
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Ages 2 - 5
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase text-purple-700 font-bold block mb-1">Sub-Head: Mrs. Abigail Balogun</span>
                <h3 className="font-bold text-slate-900 text-sm">Kindergarten Wing (KG 1 - 3)</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Montessori-grounded discovery, phonics sounds, early numeracy, social interaction, and motor development preparing toddlers for primary transition.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-600" /> Phonics & Letter Blending</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-600" /> Early Numeracy & Shapes</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-600" /> Sensory Discovery & Fine Motor</li>
                </ul>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigateTo('kindergarten-arm')}
                  id="home-kg-page-btn"
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>Explore KG Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleQuickReportCard('STU-KG-001')}
                  className="py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[11px] border border-purple-200 transition cursor-pointer"
                  title="View Sample KG Report Card"
                >
                  Report Card
                </button>
              </div>
            </div>

            {/* Wing 2: Primary */}
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                    PRI
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Basic 1 - 6
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block mb-1">Sub-Head: Mrs. Grace Iveren Shima</span>
                <h3 className="font-bold text-slate-900 text-sm">Primary School (Basic 1 - 6)</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Universal Basic Education (UBE) foundation with quantitative reasoning, science experiments, coding fundamentals, and National Common Entrance (NCEE) mastery.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> English & Verbal Reasoning</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Mathematics & Quant Reasoning</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Basic Science & Coding Fundamentals</li>
                </ul>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigateTo('primary-arm')}
                  id="home-primary-page-btn"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>Explore Primary Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleQuickReportCard('STU-PRI-001')}
                  className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition cursor-pointer"
                  title="View Sample Primary Report Card"
                >
                  Report Card
                </button>
              </div>
            </div>

            {/* Wing 3: Secondary */}
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm">
                    SEC
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    JSS 1 - SSS 3
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase text-blue-700 font-bold block mb-1">Sub-Head: Dr. (Mrs.) Grace Okafor</span>
                <h3 className="font-bold text-slate-900 text-sm">Secondary College (JSS 1 - SSS 3)</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  High-rigor secondary academic streams (Science, Arts, Commercial) preparing scholars for WAEC, NECO, Cambridge IGCSE, SAT, and JAMB UTME.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Science: Physics, Chem, Bio, Further Maths</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Arts: Literature, Government, CRS/IRS</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Commercial: Accounting, Economics, Commerce</li>
                </ul>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigateTo('secondary-arm')}
                  id="home-secondary-page-btn"
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>Explore Secondary Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleQuickReportCard('STU-SEC-001')}
                  className="py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] border border-blue-200 transition cursor-pointer"
                  title="View Sample SSS 2 Report Card"
                >
                  Report Card
                </button>
              </div>
            </div>
          </div>

          {/* Student & Pupil Leadership Council Promo */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white border border-indigo-800/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-lg shrink-0 shadow">
                👑
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Student & Pupil Leadership Councils</h4>
                <p className="text-xs text-indigo-200">
                  Democratically elected Senior Prefect Council (Head Girl: Dooshima Beeun) & Primary Pupil Monitors.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('student-leadership')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow"
            >
              <span>View Leadership Roster & Charter</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        {/* Live Notices & House Cup League */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Announcements & Bulletin (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Official School Bulletin & Notices</h3>
              </div>
              
              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {(['All', 'Academic', 'Examination', 'Administrative'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAnnouncementFilter(cat as any)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                      announcementFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className={`rounded-xl p-4 border transition ${
                    ann.isImportant
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      ann.category === 'Academic' ? 'bg-blue-100 text-blue-800' :
                      ann.category === 'Examination' ? 'bg-rose-100 text-rose-800' :
                      ann.category === 'Sports & Events' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {ann.category}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{ann.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">{ann.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* House Points Leaderboard & Key Dates (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* House System Standings */}
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Inter-House Championship 2026</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">Term Standings</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-blue-900 text-sm">1st</span>
                    <div>
                      <h4 className="text-xs font-bold text-blue-950">Eagle House (Blue)</h4>
                      <p className="text-[10px] text-blue-700">Senior Prefect: Dooshima Beeun</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-blue-900">1,240 Pts</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/80 border border-rose-200">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-rose-900 text-sm">2nd</span>
                    <div>
                      <h4 className="text-xs font-bold text-rose-950">Falcon House (Red)</h4>
                      <p className="text-[10px] text-rose-700">Captain: Amina Bello</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-rose-900">1,185 Pts</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-yellow-50/80 border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-amber-900 text-sm">3rd</span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">Lion House (Yellow)</h4>
                      <p className="text-[10px] text-amber-700">Captain: Oluwaseun Adeleke</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-amber-900">1,090 Pts</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-emerald-900 text-sm">4th</span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">Cheetah House (Green)</h4>
                      <p className="text-[10px] text-emerald-700">Captain: Khadijah Shehu</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-emerald-900">975 Pts</span>
                </div>
              </div>
            </div>

            {/* Multi-Arm Key Examination Timeline */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 shadow-md border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">2025/2026 Key Examination Calendar</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-300">Continuous Assessment (40%) Lock:</span>
                  <strong className="text-blue-400">March 6, 2026</strong>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-300">KG & Primary 2nd Term Exams (60%):</span>
                  <strong className="text-purple-400">March 16 - 25, 2026</strong>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-300">Basic 6 National Common Entrance (NCEE):</span>
                  <strong className="text-emerald-400">April 18, 2026</strong>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-300">WAEC / NECO / IGCSE / SAT / JAMB:</span>
                  <strong className="text-amber-400">May - June 2026</strong>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-300">3rd Term Resumption Date:</span>
                  <strong className="text-white">May 4, 2026</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
