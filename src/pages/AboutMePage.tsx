import React from 'react';
import { BummptechLogo } from '../components/BummptechLogo';
import { 
  Award, 
  Binary, 
  BarChart, 
  BrainCircuit, 
  HeartHandshake, 
  Sparkles, 
  FileSpreadsheet, 
  Database, 
  GraduationCap, 
  Compass, 
  CheckCircle,
  ExternalLink,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export const AboutMePage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12" id="about-me-page-root">
      {/* Executive Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Executive Portrait Container (4 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 opacity-75 blur-sm group-hover:opacity-100 transition duration-300" />
              
              {/* Executive photo card container */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl w-full max-w-sm aspect-[3/4]">
                {/* Developer / Executive Photo */}
                <img
                  src="/developer_portrait.jpg"
                  alt="Matthew Ternenge Beeun - Founder, CEO & Lead Developer"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to local generated asset path if needed
                    const target = e.currentTarget;
                    if (target.src.indexOf('developer_standing_portrait') === -1) {
                      target.src = '/src/assets/images/developer_standing_portrait_1787835545409.jpg';
                    }
                  }}
                />

                {/* Subtle dark gradient overlay to ensure crystal clear text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-5">
                  {/* Top corner badge with Bummptech branding */}
                  <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-750 p-2 rounded-xl backdrop-blur-md shadow-lg">
                    <BummptechLogo variant="compact" size="sm" />
                  </div>

                  <div className="space-y-1 z-10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold border border-blue-400/40 backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 text-amber-300" />
                      Lead Developer, Founder & CEO
                    </div>
                    <h3 className="text-xl font-extrabold text-white drop-shadow-md">Matthew Ternenge Beeun</h3>
                    <p className="text-xs text-slate-200 font-medium drop-shadow-sm">
                      Bummptech Global Concepts • Makurdi, Benue State
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs font-mono text-slate-400">
                Architect of BummptEducation Secondary School Portal
              </span>
            </div>
          </div>

          {/* Biography & Mission Statement (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-900/60 px-3 py-1 text-xs font-semibold text-blue-200 border border-blue-700/50">
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>Career Identity Statement & Executive Leadership</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-snug">
              Innovating Educational Technology with Mathematical Precision & Human-Centric Leadership
            </h1>

            {/* Exact Career Identity Statement */}
            <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-700/80 shadow-inner">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic font-serif">
                "I am a goal-driven professional with a strong foundation in Mathematics and Computer Science , complemented by advanced certifications in Data Analytics, Business Statistics, and Human Resources Management. I thrive in high-pressure environments, leveraging a technical toolkit that includes SQL, Tableau, R, and Spreadsheets to extract actionable insights and drive data-informed decision-making. By integrating Generative AI into my workflow, I augment analytical efficiency, automate complex data synthesis, and refine strategic execution. My career is anchored in integrity and a collaborative spirit, blending technical precision with human-centric leadership. I am a resilient, lifelong learner with the emotional intelligence and strategic mindset required to innovate solutions in dynamic, forward-thinking organizations."
              </p>
            </div>

            {/* Core Competencies Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <Binary className="h-4 w-4 text-blue-400 mb-1" />
                <strong className="block text-white text-xs">Math & CS</strong>
                <span className="text-[10px] text-slate-400">Algorithmic rigor</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <BarChart className="h-4 w-4 text-emerald-400 mb-1" />
                <strong className="block text-white text-xs">Data Analytics</strong>
                <span className="text-[10px] text-slate-400">SQL, Tableau, R</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <BrainCircuit className="h-4 w-4 text-purple-400 mb-1" />
                <strong className="block text-white text-xs">Generative AI</strong>
                <span className="text-[10px] text-slate-400">Automated synthesis</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <HeartHandshake className="h-4 w-4 text-amber-400 mb-1" />
                <strong className="block text-white text-xs">HR & Strategy</strong>
                <span className="text-[10px] text-slate-400">Human-centric scale</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Bummptech Global Concepts */}
      <section className="rounded-3xl bg-white p-8 sm:p-10 border border-slate-200 shadow-xs space-y-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <BummptechLogo size="sm" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">About Bummptech Global Concepts</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
            <strong>Bummptech Global Concepts</strong> is a progressive technology and educational engineering firm dedicated to transforming institutional operations across West Africa. We engineer bespoke software solutions that automate complex school grading, terminal assessments, financial auditing, and human capital workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">West African & Global Academic Rigor</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every formula, scoresheet, and ranking in BummptEducation adheres faithfully to the WAEC/NECO 40% Continuous Assessment and 60% Terminal Examination framework, perfectly prepping students for WAEC WASSCE, NECO SSCE, BECE, SAT, Cambridge IGCSE, and JAMB UTME.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Zero-Leakage Bursary Security</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated school fee schedules, digital receipt validation, and exam docket clearances eliminate revenue leakages and ensure total fiscal compliance.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">Empowering Educators with AI</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Form Tutors and Principals leverage embedded Generative AI remark generators to craft constructive, highly individualized academic comments in seconds.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
