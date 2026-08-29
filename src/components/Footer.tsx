import React, { useState } from 'react';
import { BummptechLogo } from './BummptechLogo';
import { NavigationPage } from '../types';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Youtube, 
  Send, 
  Linkedin, 
  BookOpen, 
  ShieldCheck, 
  Award,
  FileText,
  Layers,
  Baby,
  School,
  Users,
  CheckCircle2,
  Clock,
  ArrowUp,
  FileSpreadsheet,
  Lock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Landmark,
  Code2,
  Terminal
} from 'lucide-react';

interface FooterProps {
  setActivePage?: (page: NavigationPage) => void;
  onNavigate?: (page: NavigationPage, subTab?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActivePage, onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const navigateTo = (page: NavigationPage, subTab?: string) => {
    if (onNavigate) {
      onNavigate(page, subTab);
    } else if (setActivePage) {
      setActivePage(page);
    }
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim() && newsletterEmail.includes('@')) {
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterEmail('');
      }, 3000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const accreditations = [
    { title: 'Benue MOE & SUBEB', desc: 'State Ministry & 23 LGAs' },
    { title: 'WAEC WASSCE', desc: 'West African Exams Council' },
    { title: 'NECO SSCE / BECE', desc: 'National Exams Council' },
    { title: 'Cambridge IGCSE', desc: 'International Assessment' },
    { title: 'JAMB UTME / UBE', desc: 'Basic Education & Tertiary' },
    { title: 'TRCN Certified', desc: 'Teachers Registration Council' },
  ];

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300 relative select-none" id="main-app-footer">
      
      {/* Top Accreditation & Academic Authority Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 py-4 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Award className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Accredited Assessment & Examination Center:</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full md:w-auto">
              {accreditations.map((acc, idx) => (
                <div 
                  key={idx} 
                  className="rounded-lg bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 text-center transition hover:border-slate-700 hover:bg-slate-800/60"
                >
                  <div className="text-[11px] font-extrabold text-blue-300 leading-tight">{acc.title}</div>
                  <div className="text-[9px] text-slate-500 font-medium truncate">{acc.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Sitemap Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Col 1: Branding, Mission & Social Links */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 inline-block shadow-inner">
              <BummptechLogo size="md" className="brightness-110" />
            </div>

            <p className="text-xs leading-relaxed text-slate-400 max-w-md">
              <strong className="text-slate-200">BummptEducation</strong> is a multi-tier academic and administrative enterprise system powering integrated management for Early Childhood (KG 1–3), Primary School (Basic 1–6), and Secondary College (JSS 1–SSS 3). Built with technological precision by <strong className="text-blue-400">Bummptech Global Concepts</strong>.
            </p>

            {/* Social & Communication Icons */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Official Institutional Channels
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://linkedin.com/in/matthew-beeun-18853a1b2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-slate-900 p-2.5 text-slate-400 hover:text-white hover:bg-blue-600 transition border border-slate-800 hover:border-blue-500"
                  title="General Administrator LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com/@matthewbeeun2967"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-slate-900 p-2.5 text-slate-400 hover:text-white hover:bg-rose-600 transition border border-slate-800 hover:border-rose-500"
                  title="Official Educational YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="https://t.me/matthew_beeun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-slate-900 p-2.5 text-slate-400 hover:text-white hover:bg-sky-500 transition border border-slate-800 hover:border-sky-400"
                  title="Telegram Executive Channel"
                >
                  <Send className="h-4 w-4" />
                </a>
                <a
                  href="https://bummpt90.blogspot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-slate-900 p-2.5 text-slate-400 hover:text-white hover:bg-amber-600 transition border border-slate-800 hover:border-amber-500"
                  title="Bummptech Insights Blog"
                >
                  <Globe className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Newsletter Alert Subscription Box */}
            <div className="pt-2">
              <form onSubmit={handleSubscribe} className="space-y-2 max-w-sm">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Parent & Faculty Terminal Broadcast
                </span>
                {newsletterSubscribed ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-700/80 px-3 py-2 text-xs text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Subscribed! You will receive terminal bulletins.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="email"
                      required
                      placeholder="Enter parent or faculty email..."
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                    >
                      Subscribe
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Col 2: Educational Arms & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5 pb-1 border-b border-slate-800/80">
              <Layers className="h-4 w-4 text-purple-400" />
              Educational Wings
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button 
                  onClick={() => navigateTo('benue-state-hq')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center justify-between group w-full p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/40 text-emerald-300 hover:text-white"
                >
                  <span className="flex items-center gap-2 font-bold">
                    <Landmark className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Benue State HQ (23 LGAs)</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">HQ Desk</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('kindergarten-arm')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-2 group w-full"
                >
                  <Baby className="h-3.5 w-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  <span className="group-hover:text-purple-300">Early Childhood & KG (1–3)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('primary-arm')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-2 group w-full"
                >
                  <BookOpen className="h-3.5 w-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  <span className="group-hover:text-emerald-300">Primary School (Basic 1–6)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('secondary-arm')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-2 group w-full"
                >
                  <School className="h-3.5 w-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                  <span className="group-hover:text-blue-300">Secondary College (JSS–SSS)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('student-leadership')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-2 group w-full"
                >
                  <Users className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  <span className="group-hover:text-indigo-300">Student Leadership Councils</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('organogram')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-2 group w-full pt-1"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  <span>Central School Organogram</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Academic Portals & Examination */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5 pb-1 border-b border-slate-800/80">
              <Award className="h-4 w-4 text-blue-400" />
              Academic Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button 
                  onClick={() => navigateTo('benue-state-hq')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-1.5 group font-bold text-emerald-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform"></span>
                  <span className="text-emerald-300 hover:text-white">23 LGAs Institutional Audit (MOE/SUBEB)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('lesson-notes')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-1.5 group font-bold text-blue-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 group-hover:scale-150 transition-transform"></span>
                  <span className="text-white">Lesson Notes & PDF Download</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('academic', 'reports')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-1.5 group"
                >
                  <span className="h-1 w-1 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></span>
                  <span>Terminal Report Card Generator</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('academic', 'broadsheet')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-1.5 group"
                >
                  <span className="h-1 w-1 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></span>
                  <span>Class Broadsheet Summaries</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('academic', 'scoresheet')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-1.5 group"
                >
                  <span className="h-1 w-1 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></span>
                  <span>Continuous Assessment (40/60)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('admin', 'fees')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-1.5 group"
                >
                  <span className="h-1 w-1 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform"></span>
                  <span>Fee Invoices & Digital Receipts</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('admin', 'admissions')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-1.5 group"
                >
                  <span className="h-1 w-1 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform"></span>
                  <span>Admissions & Entrance Screening</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('docs')} 
                  className="hover:text-white transition cursor-pointer text-left flex items-center gap-1.5 group"
                >
                  <span className="h-1 w-1 rounded-full bg-purple-500 group-hover:scale-150 transition-transform"></span>
                  <span>User Operational Manual</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('dev-docs')} 
                  className="hover:text-emerald-300 transition cursor-pointer text-left flex items-center justify-between group w-full p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Code2 className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Developer Architecture (Code/DB)</span>
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">Dev</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Executive Office & Helpdesk */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5 pb-1 border-b border-slate-800/80">
              <Phone className="h-4 w-4 text-amber-400" />
              Executive Campus
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">General Administrator:</span>
                <button 
                  onClick={() => navigateTo('about')}
                  className="font-bold text-slate-200 hover:text-blue-400 transition cursor-pointer text-left"
                >
                  Dr. Matthew Ternenge Beeun
                </button>
                <span className="text-[10px] text-slate-500 block">Founder & Chief Educational Technologist</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <a href="mailto:bummpt90@gmail.com" className="hover:text-blue-400 truncate">
                  bummpt90@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <a href="tel:+2348115231834" className="hover:text-emerald-400 font-semibold text-slate-300">
                  +234 811 523 1834
                </a>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight text-slate-400">
                  Mon – Fri: 7:30 AM – 5:00 PM (WAT)
                </span>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                <button 
                  onClick={() => navigateTo('contact')}
                  className="text-[11px] leading-relaxed hover:text-slate-200 text-left transition cursor-pointer"
                >
                  Akperan Orshi Avenue, Owner Occupier Housing Estate, Along George Akume Road, Makurdi, Benue State, Nigeria.
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Statewide Benue State Ministry & SUBEB 23 LGAs Institutional Portal Banner */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-blue-950/70 border border-emerald-800/50 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                <Landmark className="h-3 w-3 text-emerald-400" />
                Statewide Governance & SUBEB Basic Education
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Benue State HQ & 23 Local Government Areas Institutional Portal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Comprehensive statutory performance auditing covering all 23 LGAs across Zones A, B, and C. Unified tracking for State Government Primary Schools (SUBEB/LGEA Basic 1–6) and Secondary Colleges, WAEC/NCEE/PSLE benchmarks, UBEC subventions, and automated Governor's Executive Memoranda.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-300 border border-slate-700">
                  <MapPin className="h-2.5 w-2.5 text-emerald-400" /> Zone A (7 LGAs • Benue North-East)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-300 border border-slate-700">
                  <MapPin className="h-2.5 w-2.5 text-blue-400" /> Zone B (7 LGAs • Benue North-West)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-300 border border-slate-700">
                  <MapPin className="h-2.5 w-2.5 text-amber-400" /> Zone C (9 LGAs • Benue South)
                </span>
              </div>
            </div>

            <button
              onClick={() => navigateTo('benue-state-hq')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-lg hover:shadow-emerald-900/40 shrink-0 cursor-pointer border border-emerald-400/40"
            >
              <Landmark className="h-4 w-4" />
              <span>Launch 23 LGAs State Portal</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Security, Compliance & Trust Badges Strip */}
        <div className="mt-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>NDPR & FERPA Data Privacy Aligned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Ministry of Education Registered</span>
            </div>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-semibold transition cursor-pointer border border-slate-700"
            title="Scroll to top of page"
          >
            <span>Back to Top</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bottom Copyright & Legal Links */}
        <div className="mt-8 border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} BummptEducation • Unified Multi-Arm School Management System. Engineered by Bummptech Global Concepts.</p>
          
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => navigateTo('benue-state-hq')} className="text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer">
              Benue State HQ (23 LGAs)
            </button>
            <span>•</span>
            <button onClick={() => navigateTo('privacy')} className="hover:text-slate-300 transition cursor-pointer">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => navigateTo('privacy')} className="hover:text-slate-300 transition cursor-pointer">
              Terms of Service
            </button>
            <span>•</span>
            <button onClick={() => navigateTo('docs')} className="hover:text-slate-300 transition cursor-pointer">
              User Manual
            </button>
            <span>•</span>
            <button onClick={() => navigateTo('dev-docs')} className="text-emerald-400 hover:text-emerald-300 font-mono font-bold transition cursor-pointer">
              Developer Specs (Code/DB)
            </button>
            <span>•</span>
            <button onClick={() => navigateTo('contact')} className="hover:text-slate-300 transition cursor-pointer">
              Executive Desk
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
