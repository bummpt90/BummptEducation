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
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Baby,
  School,
  GitFork,
  Landmark,
  Building2,
  MapPin,
  Printer,
  Code2,
  Terminal,
  Database
} from 'lucide-react';
import { BummptechLogo } from '../components/BummptechLogo';
import { NavigationPage } from '../types';

interface DocumentationPageProps {
  initialSection?: 'arms' | 'grading' | 'reports' | 'broadsheet' | 'fees' | 'admissions' | 'organogram' | 'lesson-notes' | 'benue-state-hq' | 'changelog';
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ 
  initialSection = 'arms',
  onNavigate 
}) => {
  const [activeSection, setActiveSection] = useState<'arms' | 'grading' | 'reports' | 'broadsheet' | 'fees' | 'admissions' | 'organogram' | 'lesson-notes' | 'benue-state-hq' | 'changelog'>(initialSection);

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
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            <BookOpen className="h-3.5 w-3.5" />
            <span>BummptEducation Multi-Arm Educational Manual</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            System Documentation & User Operational Guide
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Standard user and administrative guide for navigating school arms, continuous assessment, Bursary, and Benue State 23 LGAs.
          </p>
        </div>

        <button
          onClick={() => navigateTo('dev-docs')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-extrabold text-xs transition shadow-md border border-slate-700 cursor-pointer shrink-0"
        >
          <Code2 className="h-4 w-4 text-emerald-400" />
          <span>View Developer Architecture Docs</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>

      {/* Developer Docs Notice Banner */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <span className="font-black text-white block">Are you a Software Developer, DevOps Engineer, or Architect?</span>
            <span className="text-slate-400 text-[11px]">Looking for the tech stack (React/Vite/Express/Tailwind), database models, TypeScript types, and REST APIs? Check out the dedicated technical documentation.</span>
          </div>
        </div>
        <button
          onClick={() => navigateTo('dev-docs')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shrink-0"
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Open Developer Specs</span>
        </button>
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
            onClick={() => setActiveSection('benue-state-hq')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'benue-state-hq' ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Landmark className="h-4 w-4 text-amber-400" />
              <span>9. Benue State HQ & 23 LGAs Portal</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">State HQ</span>
          </button>

          <button
            onClick={() => setActiveSection('changelog')}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
              activeSection === 'changelog' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>10. System Updates & Changelog</span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('dev-docs')}
            className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 hover:bg-slate-900 text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span>Developer & Architecture Docs</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono border border-emerald-700">Code / DB</span>
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

          {/* SECTION 9: BENUE STATE HQ & 23 LGAS INSTITUTIONAL PORTAL */}
          {activeSection === 'benue-state-hq' && (
            <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider mb-1">
                    <Landmark className="h-3 w-3" /> State Ministry of Education & SUBEB HQ Command
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    9. Benue State HQ & 23 LGAs Institutional Portal (Primary & Secondary)
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Statewide governance covering all 23 Local Government Areas, 138+ government primary & secondary institutions, and 4 statutory performance audit pillars for the Executive Governor.
                  </p>
                </div>
                <button
                  onClick={() => navigateTo('benue-state-hq')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Building2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Launch Benue State HQ</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              {/* 1. Statewide Scope & Dropdown Architecture */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  <span>1. 23 Local Governments, Primary School Integration & Level-Filtered Dropdown</span>
                </h3>
                <p className="text-slate-600">
                  The portal encompasses the entire territorial jurisdiction of Benue State across 3 Senatorial Districts. For each LGA, a specialized <strong>School Dropdown Menu</strong> allows state officials and SUBEB inspectors to select any government institution—whether a <strong>State Government Primary School (LGEA / SUBEB Basic 1–6)</strong>, <strong>Senior Secondary College</strong>, or <strong>Government Technical College</strong>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block text-xs">Zone A (Benue North-East)</span>
                    <span className="text-[11px] text-slate-500">7 LGAs: Katsina-Ala, Ukum, Logo, Vandeikya, Gboko, Ushongo, Kwande (Secondary, Technical, and SUBEB Model Primary Schools).</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block text-xs">Zone B (Benue North-West)</span>
                    <span className="text-[11px] text-slate-500">7 LGAs: Makurdi (State Capital), Guma, Gwer East, Gwer West, Buruku, Tarka, Konshisha (Primary, Science, and Technical Schools).</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block text-xs">Zone C (Benue South)</span>
                    <span className="text-[11px] text-slate-500">9 LGAs: Otukpo, Ohimini, Okpokwu, Apa, Ado, Agatu, Obi, Ogbadibo, Oju (Basic Education, Colleges, and Special Education Centers).</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 mt-2">
                  <strong className="block font-black text-emerald-900">Hierarchical Level-Based Filtering:</strong>
                  <span>Users can filter the dropdown list by <em>All Institutions</em>, <em>Primary Schools (SUBEB/LGEA)</em>, <em>Secondary Colleges</em>, or <em>Technical/Vocational Colleges</em>. When a primary school is clicked, the system dynamically switches from secondary metrics (WAEC/BECE) to foundational literacy and common entrance indicators (NCEE/PSLE/EGRA/EGMA).</span>
                </div>
              </div>

              {/* 2. Four Statutory Review Pillars */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  2. Four Statutory Terminal Audit Pillars (Primary vs Secondary Logic)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5">
                    <span className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Pillar 1: Teachers Performance Audit</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                      <li>Biometric Clock-In Compliance Rate (%) & Punctuality.</li>
                      <li>Curriculum Syllabus Coverage Rate tracked by week.</li>
                      <li>Lesson Notes Submission vetted by VP Academic (Secondary) or Assistant Head (Primary).</li>
                      <li>Teacher Qualification Profile: TRCN Certified %, B.Ed / PGDE, NCE (Primary), Master's & Doctorate.</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
                    <span className="font-black text-blue-950 text-xs flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-blue-700" />
                      <span>Pillar 2: Students & Pupils Academic Benchmarks</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                      <li><strong>Primary Schools:</strong> National Common Entrance (NCEE) Pass %, Primary School Leaving Certificate (PSLE) %, Early Grade Reading Assessment (EGRA), Early Grade Mathematics (EGMA), and Home-Grown School Feeding Program (HGSFP) compliance.</li>
                      <li><strong>Secondary Colleges:</strong> WAEC 5-credit benchmark pass %, BECE transition %, and STEM track enrollment ratio.</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5">
                    <span className="font-black text-amber-950 text-xs flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-amber-700" />
                      <span>Pillar 3: Financial Statement & Subvention Audit</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                      <li>State Government Subventions & UBEC Counterpart matching grants.</li>
                      <li>PTA Levies, School Based Management Committee (SBMC) receipts, and examination remittances.</li>
                      <li>Itemized Expenditure: Primers & Textbooks, Jolly Phonics Kits, Science Consumables, and Desk Repairs.</li>
                      <li>Internal Auditor, Bursar, and LGEA Bursary Officer Reconciliation sign-off.</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-1.5">
                    <span className="font-black text-purple-950 text-xs flex items-center gap-1.5">
                      <Landmark className="h-3.5 w-3.5 text-purple-700" />
                      <span>Pillar 4: Governor's Executive Memo & Infrastructure</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                      <li>Classrooms, Pupil Dual Desks, Early Discovery Kits, ICT CBT Hall, and Library Corner condition.</li>
                      <li>Solar Potable Water, VIP Latrines, and Perimeter Fencing security.</li>
                      <li>Automated Executive Memo Generator with one-click print styling for the State Governor.</li>
                      <li>SUBEB Quality Assurance & Zonal Inspection directives.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3. Terminal Progression Simulator */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>3. Dynamic Term Progress Simulation (Weeks 1 to 13)</span>
                  </span>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">Live Scrubber</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  As the term progresses from Week 1 (Resumption) to Week 7 (Mid-Term) and Week 13 (Terminal Exams), all metrics—syllabus coverage, CA upload status, financial subvention execution, and attendance—recalculate dynamically across both primary and secondary institutions, allowing the Ministry to track execution at any point during the term.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 10: CHANGELOG & SYSTEM UPDATES */}
          {activeSection === 'changelog' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  10. Comprehensive System Changelog & Updates
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Track all architectural changes, feature rollouts, and portal enhancements made to BummptEducation.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs">v3.2 - State Government Primary Schools & SUBEB Integration</span>
                    <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">Latest</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li><strong>Full 23-LGA Primary School Expansion:</strong> Populated all 23 Local Government Areas with representative State Government Primary Schools (LGEA / SUBEB Basic 1–6 models).</li>
                    <li><strong>Hierarchical Level Filter:</strong> Added interactive Level Filter buttons (All Institutions, Primary Schools, Secondary Colleges, Technical Colleges) above the LGA dropdown menu.</li>
                    <li><strong>Primary-Differentiated KPIs:</strong> Implemented dedicated metrics for National Common Entrance (NCEE), Primary School Leaving Exam (PSLE), Early Grade Reading (EGRA), Early Grade Math (EGMA), and Home-Grown School Feeding Program (HGSFP) compliance.</li>
                    <li><strong>SUBEB Financial & Infrastructure Auditing:</strong> Integrated UBEC matching grant schedules, free instructional primer disbursements, pupil dual desk metrics, and solar water scores.</li>
                    <li><strong>Governor's Basic Education Brief:</strong> Enhanced printable executive memo to dynamically reflect SUBEB quality assurance findings for primary schools.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">v3.0 - Benue State HQ Ministry Portal & 23 LGAs School Dropdown</span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">Stable</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li><strong>Full Statewide Coverage:</strong> Integration of all 23 Local Government Areas across Zones A, B, and C with 138+ mapped government schools.</li>
                    <li><strong>LGA School Dropdown Selector:</strong> Dropdown menu for every LGA allowing governing officials to pick any school and immediately view terminal summary records.</li>
                    <li><strong>4 Statutory Review Pillars:</strong> Comprehensive audit metrics for Teachers, Students, Bursary, and Governor Brief.</li>
                    <li><strong>Dynamic Term Progress Simulator:</strong> Interactive Week 1 to 13 progression timeline.</li>
                  </ul>
                </div>

                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-xs">v2.5 - Dynamic Live Header Academic Context & Multi-Arm Switcher</span>
                    <span className="text-[10px] font-mono bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-bold">Stable</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li><strong>Global Real-Time State Sync:</strong> Academic Session, School Term, and Active Class Level dynamically synchronized across header and all controllers.</li>
                    <li><strong>Header Quick Switcher:</strong> Added interactive "Switch Context" dropdown directly in the top utility bar and mobile drawer.</li>
                    <li><strong>Arm-Colored Badges:</strong> Dynamic visual pill badges color-coded by educational arm.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">v2.4 - Lesson Notes (PDF) & Executive Portrait Integration</span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">Stable</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li>Added official Class Lesson Notes repository with client & server-side endpoints for PDF compilation.</li>
                    <li>Integrated real executive photograph of Lead Developer and Founder Matthew Ternenge Beeun to About Executive page.</li>
                    <li>Refined global navigation header layout.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">v2.0 - Tri-Arm Educational Continuum Expansion</span>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">Stable</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li>Launched specialized Kindergarten (KG 1–3) and Primary School (Basic 1–6) arm portals alongside Secondary College.</li>
                    <li>Implemented differentiated continuous assessment (CA 40/60).</li>
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
