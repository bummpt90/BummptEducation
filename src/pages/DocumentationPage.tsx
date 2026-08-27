import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Award, 
  FileSpreadsheet, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap, 
  HelpCircle,
  FileText,
  Sliders,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Baby,
  School,
  GitFork
} from 'lucide-react';
import { BummptechLogo } from '../components/BummptechLogo';
import { NavigationPage } from '../types';

interface DocumentationPageProps {
  initialSection?: 'arms' | 'grading' | 'reports' | 'broadsheet' | 'fees' | 'admissions' | 'organogram' | 'lesson-notes' | 'changelog';
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ 
  initialSection = 'arms',
  onNavigate 
}) => {
  const [activeSection, setActiveSection] = useState<'arms' | 'grading' | 'reports' | 'broadsheet' | 'fees' | 'admissions' | 'organogram' | 'lesson-notes' | 'changelog'>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const navigateTo = (page: NavigationPage, subTab?: string, param?: any) => {
    if (onNavigate) {
      onNavigate(page, subTab, param);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="documentation-page-root">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
          <BookOpen className="h-3.5 w-3.5" />
          <span>BummptEducation Multi-Arm Educational Manual</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          System Documentation & Educational Architecture
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Standard operational guide for Kindergarten (KG 1–3), Primary (Basic 1–6), and Secondary College (JSS 1–SSS 3).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-2 sticky top-24">
          <button
            onClick={() => setActiveSection('arms')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'arms' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <School className="h-4 w-4" />
              <span>1. Multi-Arm School Structure</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('grading')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'grading' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Award className="h-4 w-4" />
              <span>2. Differentiated Grading & Scoring</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('reports')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'reports' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4" />
              <span>3. Terminal Report Cards & AI Remarks</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('broadsheet')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'broadsheet' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="h-4 w-4" />
              <span>4. Master Broadsheets & Rankings</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('fees')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'fees' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4" />
              <span>5. Bursary & Arm-Specific Fees</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('admissions')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'admissions' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap className="h-4 w-4" />
              <span>6. Differentiated Admissions Terms</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('organogram')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'organogram' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GitFork className="h-4 w-4" />
              <span>7. Governance & Organogram</span>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('lesson-notes')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'lesson-notes' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>8. Lesson Notes & PDF Downloads</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">New</span>
          </button>

          <button
            onClick={() => setActiveSection('changelog')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'changelog' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>9. System Updates & Changelog</span>
            </div>
          </button>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={() => navigateTo('home')}
              className="w-full text-left p-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer flex items-center justify-between"
            >
              <span>← Back to Portal Overview</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl bg-white p-8 border border-slate-200 shadow-xs space-y-6">
          
          {/* SECTION 1: MULTI-ARM SCHOOL STRUCTURE */}
          {activeSection === 'arms' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  1. Multi-Arm School System Architecture
                </h2>
                <button
                  onClick={() => navigateTo('academic', 'reports')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer shrink-0"
                >
                  <span>Explore Academic Wings</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <p>
                BummptEducation integrates the entire primary and post-primary continuum under unified central governance while maintaining distinct pedagogical arms, each supervised by its dedicated sub-head:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3">
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                    <Baby className="h-4 w-4 text-purple-700" />
                    <span>Kindergarten (KG 1 - 3)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <strong>Sub-Head:</strong> Mrs. Abigail Balogun<br/>
                    <strong>Focus:</strong> Sensory exploration, phonic blending, early numeracy, social interaction, and motor development.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                    <BookOpen className="h-4 w-4 text-emerald-700" />
                    <span>Primary School (Basic 1 - 6)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <strong>Sub-Head:</strong> Mrs. Grace Iveren Shima<br/>
                    <strong>Focus:</strong> Universal Basic Education (UBE), quantitative reasoning, STEM fundamentals, and National Common Entrance (NCEE).
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                    <School className="h-4 w-4 text-blue-700" />
                    <span>Secondary College (JSS & SSS)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <strong>Sub-Head:</strong> Dr. (Mrs.) Grace Nkechi Okafor<br/>
                    <strong>Focus:</strong> BECE, WAEC WASSCE, NECO SSCE, Cambridge IGCSE, SAT, and JAMB UTME university matriculation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: GRADING & SCORING */}
          {activeSection === 'grading' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  2. Continuous Assessment (CA) & Differentiated Grading Scales
                </h2>
                <button
                  onClick={() => navigateTo('academic', 'scoresheet')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer shrink-0"
                >
                  <span>Open Scoresheet</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <p>
                The school adheres strictly to the <strong>40% Continuous Assessment (CA) + 60% Terminal Examination</strong> structure across all arms, but interprets results through age-appropriate standards:
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                  <h4 className="font-bold text-purple-900">A. Early Childhood / Kindergarten Milestone Scale:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Exceeding Expectations (85 - 100%):</strong> Independent mastery and advanced application of skills.</li>
                    <li><strong>Proficient / Expected Standard (70 - 84%):</strong> Consistently demonstrates target developmental milestones.</li>
                    <li><strong>Developing / Progressing (50 - 69%):</strong> Acquiring skills with educator scaffolding.</li>
                    <li><strong>Emerging (0 - 49%):</strong> Early introductory phase needing focused sensory guidance.</li>
                  </ul>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <h4 className="font-bold text-emerald-900">B. Primary School Distinction Grading Scale (Basic 1 - 6):</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-white rounded border">A+ : 90 - 100% (High Distinction)</div>
                    <div className="p-2 bg-white rounded border">A : 80 - 89% (Distinction)</div>
                    <div className="p-2 bg-white rounded border">B : 70 - 79% (Very Good)</div>
                    <div className="p-2 bg-white rounded border">C : 60 - 69% (Credit / Good)</div>
                    <div className="p-2 bg-white rounded border">D : 50 - 59% (Pass)</div>
                    <div className="p-2 bg-white rounded border">E : 40 - 49% (Fair)</div>
                    <div className="p-2 bg-white rounded border">F : 0 - 39% (Ungraded / Needs Remedial)</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                  <h4 className="font-bold text-blue-900">C. Secondary College 9-Point WAEC / NECO / IGCSE Scale:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-white rounded border">A1 : 80 - 100% (Distinction)</div>
                    <div className="p-2 bg-white rounded border">B2 : 75 - 79% (Very Good)</div>
                    <div className="p-2 bg-white rounded border">B3 : 70 - 74% (Good)</div>
                    <div className="p-2 bg-white rounded border">C4 : 65 - 69% (Credit)</div>
                    <div className="p-2 bg-white rounded border">C5 : 60 - 64% (Credit)</div>
                    <div className="p-2 bg-white rounded border">C6 : 50 - 59% (Credit)</div>
                    <div className="p-2 bg-white rounded border">D7 : 45 - 49% (Pass)</div>
                    <div className="p-2 bg-white rounded border">E8 : 40 - 44% (Pass)</div>
                    <div className="p-2 bg-white rounded border">F9 : 0 - 39% (Fail)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: REPORT CARDS & AI REMARKS */}
          {activeSection === 'reports' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  3. Terminal Report Cards & AI Pedagogical Remarks
                </h2>
                <button
                  onClick={() => navigateTo('academic', 'reports')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer shrink-0"
                >
                  <span>Launch Report Cards</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <p>
                Report Cards automatically adjust their visual styling, badge labels, sub-head signatories, and remark logic based on whether the student belongs to Kindergarten, Primary, or Secondary.
              </p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li><strong>Kindergarten:</strong> Features early milestones, phonics acquisition, potty independence, and fine motor tracking.</li>
                <li><strong>Primary:</strong> Displays cognitive breakdown in quantitative/verbal reasoning, science experiments, and National Common Entrance readiness.</li>
                <li><strong>Secondary:</strong> Highlights 9-point WAEC grades, class broadsheet rank, affective rating, and external exam eligibility (WASSCE, SSCE, IGCSE, SAT, JAMB).</li>
              </ul>
            </div>
          )}

          {/* SECTION 4: MASTER BROADSHEET */}
          {activeSection === 'broadsheet' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  4. Master Broadsheet & Examination Locking
                </h2>
                <button
                  onClick={() => navigateTo('academic', 'broadsheet')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer shrink-0"
                >
                  <span>Open Broadsheet</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <p>
                The Master Broadsheet provides an exhaustive horizontal matrix of all students across all subjects in the selected class. It automatically calculates total scores, class averages, and student positions. Once locked by the Examination Officer and approved by the Sub-Head and General Administrator, records are digitally sealed.
              </p>
            </div>
          )}

          {/* SECTION 5: BURSARY & FEES */}
          {activeSection === 'fees' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  5. Bursary & Arm-Specific Fee Schedules
                </h2>
                <button
                  onClick={() => navigateTo('admin', 'fees')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer shrink-0"
                >
                  <span>Open Bursary Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <p>
                Fees are customized according to arm necessities:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Kindergarten:</strong> Early childhood tuition, sensory kits, nursery snacks, and soft-play facilities.</li>
                <li><strong>Primary:</strong> Basic academic tuition, smart computer lab fees, PTA dues, and NCEE examination fees for Basic 6.</li>
                <li><strong>Secondary:</strong> Secondary tuition, Science Laboratory reagents, ICT/Robotics fees, WAEC/NECO/IGCSE/SAT registration packages, and graduation dues.</li>
              </ul>
            </div>
          )}

          {/* SECTION 6: ADMISSIONS */}
          {activeSection === 'admissions' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  6. Differentiated Admission & Screening Terms
                </h2>
                <button
                  onClick={() => navigateTo('admin', 'admissions')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition cursor-pointer shrink-0"
                >
                  <span>Open Admissions</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <p>
                Admission criteria differ across the 3 arms:
              </p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li><strong>Kindergarten:</strong> Age verification (2 - 5 years), potty training verification, health/immunization records, and parent interaction.</li>
                <li><strong>Primary:</strong> Literacy and numeracy diagnostic placement test, reading fluency check, and previous early childhood records.</li>
                <li><strong>Secondary:</strong> National Common Entrance (NCEE) test, BECE certificate verification for SSS candidates, academic stream allocation (Science, Arts, Commercial), and WAEC/NECO center clearance.</li>
              </ul>
            </div>
          )}

          {/* SECTION 7: ORGANOGRAM */}
          {activeSection === 'organogram' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  7. Multi-Arm Leadership Hierarchy & Governance
                </h2>
                <button
                  onClick={() => navigateTo('organogram')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition cursor-pointer shrink-0"
                >
                  <span>View Full Organogram</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <p>
                Under the Central General Administrator (Dr. Matthew Ternenge Beeun), each arm is spearheaded by its Sub-Head who is responsible for day-to-day curriculum fidelity, staff discipline, and examination integrity. Central support services (Bursary, Registry, E-Library, Health Bay) operate transversally to service all pupils and students across the entire institution.
              </p>
            </div>
          )}

          {/* SECTION 8: LESSON NOTES & PDF REPOSITORY */}
          {activeSection === 'lesson-notes' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    8. Class Lesson Notes & PDF Download Repository
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Multi-Arm digital curriculum notes with instant PDF generation for parents, students, and educators.
                  </p>
                </div>
                <button
                  onClick={() => navigateTo('lesson-notes')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition cursor-pointer shrink-0"
                >
                  <span>Open Lesson Notes Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>

              <p>
                The <strong>Class Lesson Notes Repository</strong> bridges classroom instruction with home study, allowing parents and students to access, review, and print official syllabus notes prepared by certified subject tutors.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Parent & Student Features</span>
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li><strong>Filter by School Arm:</strong> Instant toggle between Early Childhood (KG 1–3), Primary School (Basic 1–6), and Secondary College (JSS 1–SSS 3).</li>
                    <li><strong>Search by Topic/Subject:</strong> Quick search across Mathematics, English Diction, Basic Science, Physics, Phonics, etc.</li>
                    <li><strong>One-Click PDF Download:</strong> High-resolution printable PDF generation with official school seal, teacher credentials, and structured objectives.</li>
                    <li><strong>Interactive In-App Viewer:</strong> Read lesson outlines, key concepts, and home revision questions directly in browser.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span>Teacher & Administrative Controls</span>
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li><strong>Upload New Lesson Notes:</strong> Dedicated modal allowing teachers to input topics, behavioral objectives, and key content notes.</li>
                    <li><strong>Full-Stack REST Endpoints:</strong> Express API routes (<code>/api/lesson-notes</code>) supporting CRUD and feedback logs.</li>
                    <li><strong>Curricular Alignment:</strong> Adheres strictly to NERDC, WAEC/NECO, Cambridge IGCSE, and Universal Basic Education guidelines.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: CHANGELOG & SYSTEM UPDATES */}
          {activeSection === 'changelog' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  9. Comprehensive System Changelog & Updates
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Track all architectural changes, feature rollouts, and portal enhancements made to BummptEducation.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-xs">v2.4 - Lesson Notes (PDF) & Executive Portrait Integration</span>
                    <span className="text-[10px] font-mono bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-bold">Latest</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li>Added official Class Lesson Notes repository with client & server-side endpoints for PDF compilation.</li>
                    <li>Integrated real executive photograph of Lead Developer and Founder Matthew Ternenge Beeun to About Executive page.</li>
                    <li>Refined global navigation header layout, removed exam acronyms and JSS 1 - SSS 3 logo taglines for universal multi-arm branding.</li>
                    <li>Expanded central documentation manual with operational guides for lesson notes and releases.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">v2.0 - Tri-Arm Educational Continuum Expansion</span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">Stable</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li>Launched specialized Kindergarten (KG 1–3) and Primary School (Basic 1–6) arm portals alongside Secondary College.</li>
                    <li>Implemented differentiated continuous assessment (CA 40/60) with early childhood milestone badges, primary distinctions, and WAEC 9-point scales.</li>
                    <li>Integrated Executive Organogram page detailing Central Administrator and Sub-Head leadership governance.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
