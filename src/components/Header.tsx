import React, { useState, useRef, useEffect } from 'react';
import { BummptechLogo } from './BummptechLogo';
import { NavigationPage, AcademicYear, Term, ClassLevel, getSchoolArm } from '../types';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Building2, 
  GitFork, 
  UserCheck, 
  BookOpen, 
  PhoneCall, 
  Menu, 
  X, 
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Baby,
  School,
  Users,
  Layers,
  Award,
  FileSpreadsheet,
  FileText,
  Phone,
  Check,
  ExternalLink,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Lock,
  ArrowRight,
  Calendar,
  KeyRound,
  Unlock,
  Landmark,
  MapPin,
  Code2,
  Terminal,
  Database
} from 'lucide-react';

export type ActivePage = NavigationPage;

interface HeaderProps {
  activePage: NavigationPage;
  setActivePage?: (page: NavigationPage) => void;
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  userRole?: string;
  setUserRole?: (role: any) => void;
  onRoleChange?: (role: any) => void;
  academicYear?: AcademicYear;
  onAcademicYearChange?: (year: AcademicYear) => void;
  selectedTerm?: Term;
  onTermChange?: (term: Term) => void;
  selectedClass?: ClassLevel;
  onClassChange?: (classLevel: ClassLevel) => void;
  onOpenSecurityModal?: () => void;
  onOpenParentPortalModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  setActivePage,
  onNavigate,
  userRole = 'principal',
  setUserRole,
  onRoleChange,
  academicYear = '2025/2026',
  onAcademicYearChange,
  selectedTerm = '2nd Term',
  onTermChange,
  selectedClass = 'SSS 2 Science',
  onClassChange,
  onOpenSecurityModal,
  onOpenParentPortalModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [armsDropdownOpen, setArmsDropdownOpen] = useState(false);
  const [academicDropdownOpen, setAcademicDropdownOpen] = useState(false);
  const [academicContextDropdownOpen, setAcademicContextDropdownOpen] = useState(false);
  const [docsDropdownOpen, setDocsDropdownOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const armsDropdownRef = useRef<HTMLDivElement>(null);
  const academicDropdownRef = useRef<HTMLDivElement>(null);
  const academicContextDropdownRef = useRef<HTMLDivElement>(null);
  const docsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (armsDropdownRef.current && !armsDropdownRef.current.contains(event.target as Node)) {
        setArmsDropdownOpen(false);
      }
      if (academicDropdownRef.current && !academicDropdownRef.current.contains(event.target as Node)) {
        setAcademicDropdownOpen(false);
      }
      if (academicContextDropdownRef.current && !academicContextDropdownRef.current.contains(event.target as Node)) {
        setAcademicContextDropdownOpen(false);
      }
      if (docsDropdownRef.current && !docsDropdownRef.current.contains(event.target as Node)) {
        setDocsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateTo = (page: NavigationPage, subTab?: string, param?: any) => {
    if (onNavigate) {
      onNavigate(page, subTab, param);
    } else if (setActivePage) {
      setActivePage(page);
    }
    setMobileMenuOpen(false);
    setArmsDropdownOpen(false);
    setAcademicDropdownOpen(false);
    setRoleDropdownOpen(false);
  };

  const handleRoleChange = (role: string) => {
    if (onRoleChange) {
      onRoleChange(role);
    } else if (setUserRole) {
      setUserRole(role);
    }
    setRoleDropdownOpen(false);
  };

  const navItems = [
    { id: 'home' as NavigationPage, label: 'Home', icon: GraduationCap },
    { id: 'state-hq' as NavigationPage, label: 'Benue State HQ', icon: Landmark, badge: '23 LGAs' },
    { id: 'academic' as NavigationPage, label: 'Academic Wing', icon: LayoutDashboard, hasDropdown: true },
    { id: 'lesson-notes' as NavigationPage, label: 'Lesson Notes (PDF)', icon: FileText, badge: 'Parents' },
    { id: 'admin' as NavigationPage, label: 'Bursary & Admin', icon: Building2 },
    { id: 'docs' as NavigationPage, label: 'User Guide', icon: BookOpen },
    { id: 'dev-docs' as NavigationPage, label: 'Developer Specs', icon: Code2, badge: 'Tech/DB' },
    { id: 'contact' as NavigationPage, label: 'Contact', icon: PhoneCall },
  ];

  const educationalArms = [
    { 
      id: 'kindergarten-arm' as NavigationPage, 
      label: 'Early Childhood & KG Arm', 
      grade: 'KG 1, KG 2, KG 3 (Ages 2–5)',
      sub: 'Montessori, Phonics & Early Numeracy • Mrs. Abigail Balogun',
      icon: Baby,
      badge: 'Early Years',
      theme: 'from-purple-500/10 to-purple-600/5 border-purple-200 text-purple-700 hover:border-purple-400'
    },
    { 
      id: 'primary-arm' as NavigationPage, 
      label: 'Primary School Arm', 
      grade: 'Basic 1 to Basic 6 (Universal Basic Ed)',
      sub: 'STEM Discovery, Numeracy & Reasoning • Mrs. Grace Iveren Shima',
      icon: BookOpen,
      badge: 'Basic 1-6',
      theme: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200 text-emerald-700 hover:border-emerald-400'
    },
    { 
      id: 'secondary-arm' as NavigationPage, 
      label: 'Secondary College Arm', 
      grade: 'JSS 1 – SSS 3 (Science, Arts, Commercial)',
      sub: 'Science, Arts & Commercial Tracks • Dr. (Mrs.) Grace Okafor',
      icon: School,
      badge: 'Secondary',
      theme: 'from-blue-500/10 to-blue-600/5 border-blue-200 text-blue-700 hover:border-blue-400'
    },
    { 
      id: 'student-leadership' as NavigationPage, 
      label: 'Student & Pupil Councils', 
      grade: 'Democratic Student Senate & House League',
      sub: 'Senior Prefects, Primary Monitors & House Championships',
      icon: Users,
      badge: 'Leadership',
      theme: 'from-indigo-500/10 to-indigo-600/5 border-indigo-200 text-indigo-700 hover:border-indigo-400'
    },
  ];

  const roles = [
    { 
      id: 'principal', 
      label: 'Principal / Administrator', 
      desc: 'Full executive oversight, broadsheets, admissions & staff audits',
      tag: 'Executive'
    },
    { 
      id: 'teacher', 
      label: 'Exam Officer & Form Tutor', 
      desc: 'CA score entry (40/60), class registers & automated remarks',
      tag: 'Academic'
    },
    { 
      id: 'bursar', 
      label: 'Bursar / Accounts Office', 
      desc: 'Fee invoicing, payment reconciliations & official receipts',
      tag: 'Finance'
    },
    { 
      id: 'student', 
      label: 'Student Portal', 
      desc: 'View term report cards, timetable, house points & exam prep',
      tag: 'Learner'
    },
    { 
      id: 'parent', 
      label: 'Parent / Guardian Portal', 
      desc: 'Real-time terminal grades, fee breakdown & attendance tracking',
      tag: 'Guardian'
    },
  ];

  const currentRoleObj = roles.find(r => r.id === userRole) || roles[0];
  const isArmPageActive = ['kindergarten-arm', 'primary-arm', 'secondary-arm', 'student-leadership'].includes(activePage);
  const currentClassArm = getSchoolArm(selectedClass);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-all duration-200 shadow-xs" id="main-app-header">
      {/* Top Utility Micro-Bar */}
      <div className="bg-slate-950 text-slate-300 border-b border-slate-800/80 px-3 sm:px-4 lg:px-6 py-1 text-[11px] select-none">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left Session, Term & Dynamic Active Class Indicators */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
            {/* Pulsing indicator with Live Session & Term */}
            <div className="inline-flex items-center gap-1.5 font-bold text-amber-400 shrink-0" id="header-live-session-term-indicator">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-amber-400">{academicYear} Session</span>
              <span className="text-amber-500/70">•</span>
              <span className="text-amber-300 font-extrabold">{selectedTerm}</span>
            </div>

            <span className="text-slate-700">|</span>

            {/* Dynamic Active Class Badge with Arm Styling */}
            <div className="inline-flex items-center gap-1.5 shrink-0" id="header-active-class-badge">
              <span className="text-slate-400 text-[10px] uppercase font-semibold hidden md:inline">Active:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-black border transition-all ${
                currentClassArm === 'kindergarten'
                  ? 'bg-purple-950/80 text-purple-200 border-purple-500/50'
                  : currentClassArm === 'primary'
                  ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50'
                  : 'bg-blue-950/80 text-blue-200 border-blue-500/50'
              }`}>
                {currentClassArm === 'kindergarten' && <Baby className="h-3 w-3 text-purple-400" />}
                {currentClassArm === 'primary' && <BookOpen className="h-3 w-3 text-emerald-400" />}
                {currentClassArm === 'secondary' && <School className="h-3 w-3 text-blue-400" />}
                <span>{selectedClass}</span>
              </span>
            </div>

            {/* Quick Context Switcher Dropdown */}
            <div className="relative" ref={academicContextDropdownRef}>
              <button
                onClick={() => setAcademicContextDropdownOpen(!academicContextDropdownOpen)}
                id="header-academic-context-btn"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition text-[10.5px] font-bold cursor-pointer"
                title="Change Academic Year, Term & Active Class"
              >
                <SlidersHorizontal className="h-3 w-3 text-amber-400" />
                <span className="hidden sm:inline">Switch Context</span>
                <span className="sm:hidden">Switch</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${academicContextDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {academicContextDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-200 text-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <div className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <span>Academic Context Settings</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Instantly updates session, term & active class across all dashboards.
                      </p>
                    </div>
                    <button
                      onClick={() => setAcademicContextDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Academic Session */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Academic Session / Year:
                      </label>
                      <select
                        value={academicYear}
                        onChange={(e) => onAcademicYearChange?.(e.target.value as AcademicYear)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                        id="header-select-session"
                      >
                        <option value="2024/2025">2024/2025 Session (Previous)</option>
                        <option value="2025/2026">2025/2026 Session (Current Active)</option>
                        <option value="2026/2027">2026/2027 Session (Next Academic Year)</option>
                      </select>
                    </div>

                    {/* School Term */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Current Term:
                      </label>
                      <select
                        value={selectedTerm}
                        onChange={(e) => onTermChange?.(e.target.value as Term)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                        id="header-select-term"
                      >
                        <option value="1st Term">1st Term (Advent / Resumption)</option>
                        <option value="2nd Term">2nd Term (Mid-Session Active)</option>
                        <option value="3rd Term">3rd Term (Promotional & Final)</option>
                      </select>
                    </div>

                    {/* Active Class */}
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Active Class Level:
                      </label>
                      <select
                        value={selectedClass}
                        onChange={(e) => onClassChange?.(e.target.value as ClassLevel)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                        id="header-select-class"
                      >
                        <optgroup label="Early Childhood & Kindergarten (KG 1–3)">
                          <option value="KG 1">KG 1 (Early Foundation • Age 2-3)</option>
                          <option value="KG 2">KG 2 (Montessori Discovery • Age 3-4)</option>
                          <option value="KG 3">KG 3 (Transition to Primary • Age 4-5)</option>
                        </optgroup>
                        <optgroup label="Primary Basic Education (Basic 1–6)">
                          <option value="Basic 1">Basic 1 (Primary 1)</option>
                          <option value="Basic 2">Basic 2 (Primary 2)</option>
                          <option value="Basic 3">Basic 3 (Primary 3)</option>
                          <option value="Basic 4">Basic 4 (Primary 4)</option>
                          <option value="Basic 5">Basic 5 (Primary 5)</option>
                          <option value="Basic 6">Basic 6 (Primary 6 - Common Entrance NCEE)</option>
                        </optgroup>
                        <optgroup label="Junior Secondary (JSS 1–3)">
                          <option value="JSS 1">JSS 1 (Junior Year 1)</option>
                          <option value="JSS 2">JSS 2 (Junior Year 2)</option>
                          <option value="JSS 3">JSS 3 (BECE / Junior WAEC / Checkpoint)</option>
                        </optgroup>
                        <optgroup label="Senior Secondary (SSS 1–3)">
                          <option value="SSS 1 Science">SSS 1 Science</option>
                          <option value="SSS 1 Arts">SSS 1 Arts</option>
                          <option value="SSS 1 Commercial">SSS 1 Commercial</option>
                          <option value="SSS 2 Science">SSS 2 Science</option>
                          <option value="SSS 2 Arts">SSS 2 Arts</option>
                          <option value="SSS 2 Commercial">SSS 2 Commercial</option>
                          <option value="SSS 3 Science">SSS 3 Science (WAEC / NECO / IGCSE / UTME)</option>
                          <option value="SSS 3 Arts">SSS 3 Arts (WAEC / NECO / IGCSE / UTME)</option>
                          <option value="SSS 3 Commercial">SSS 3 Commercial (WAEC / NECO / IGCSE / UTME)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Live Sync Enabled</span>
                      <button
                        onClick={() => setAcademicContextDropdownOpen(false)}
                        className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold hover:bg-blue-600 transition cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Hotline & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Developer Architecture Quick Link */}
            <button
              onClick={() => navigateTo('dev-docs')}
              id="header-micro-dev-docs-btn"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 hover:text-white hover:bg-emerald-900 border border-emerald-700/60 transition text-[10.5px] font-bold cursor-pointer"
              title="System Architecture, Database Schemas & Developer Documentation"
            >
              <Code2 className="h-3 w-3 text-emerald-400" />
              <span className="hidden sm:inline">Dev Specs</span>
              <span className="sm:hidden">Dev</span>
            </button>

            {/* Parent Result Portal button in micro-bar */}
            <button
              onClick={onOpenParentPortalModal}
              id="header-micro-parent-portal-btn"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 hover:text-white hover:bg-indigo-900 border border-indigo-700/60 transition text-[10.5px] font-bold cursor-pointer"
              title="Parent Report Card Verification & Download Portal"
            >
              <FileText className="h-3 w-3 text-indigo-400" />
              <span className="hidden sm:inline">Parent Portal</span>
              <span className="sm:hidden">Parents</span>
            </button>

            {/* Security Passkeys Quick Button */}
            <button
              onClick={onOpenSecurityModal}
              id="header-micro-security-btn"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 hover:text-white hover:bg-amber-900 border border-amber-700/60 transition text-[10.5px] font-bold cursor-pointer"
              title="Staff Authorization Passkeys & Wing Clearance"
            >
              <KeyRound className="h-3 w-3 text-amber-400" />
              <span className="hidden sm:inline">Passkeys</span>
            </button>

            <span className="hidden sm:inline text-slate-700">|</span>

            <a 
              href="tel:+2348115231834" 
              className="hidden sm:inline-flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition"
              title="Campus Administrative Hotline"
            >
              <Phone className="h-3 w-3 text-emerald-400" />
              <span>+234 811 523 1834</span>
            </a>

            <span className="hidden sm:inline text-slate-700">|</span>

            {/* Portal Role Switcher Dropdown */}
            <div className="relative" ref={roleDropdownRef}>
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition border border-slate-700 shadow-inner cursor-pointer"
                id="active-role-switcher-btn"
                aria-expanded={roleDropdownOpen}
              >
                <ShieldCheck className="h-3 w-3 text-blue-400" />
                <span className="text-slate-400 hidden xs:inline">Role:</span>
                <span className="text-blue-300 font-bold max-w-[110px] sm:max-w-none truncate">{currentRoleObj.label}</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 text-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Role Portal View
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Preview access permissions across administrative and academic desks.
                    </p>
                  </div>

                  <div className="space-y-1">
                    {roles.map((r) => {
                      const isSelected = userRole === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleRoleChange(r.id)}
                          className={`w-full text-left rounded-xl p-2 transition flex items-start justify-between group cursor-pointer ${
                            isSelected ? 'bg-blue-50/90 text-blue-900 border border-blue-200' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold">{r.label}</span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {r.tag}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 group-hover:text-slate-700">
                              {r.desc}
                            </p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Navbar */}
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2">
        
        {/* Left: Brand Identity */}
        <button 
          onClick={() => navigateTo('home')} 
          className="text-left focus:outline-none cursor-pointer group shrink-0 mr-2 lg:mr-3"
          id="brand-home-link"
          aria-label="BummptEducation Home"
        >
          <BummptechLogo size="md" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
          
          {/* Home */}
          <button
            onClick={() => navigateTo('home')}
            id="nav-link-home"
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activePage === 'home'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GraduationCap className={`h-3.5 w-3.5 ${activePage === 'home' ? 'text-white' : 'text-slate-500'}`} />
            <span>Home</span>
          </button>

          {/* Benue State HQ (23 LGAs Command Portal) */}
          <button
            onClick={() => navigateTo('state-hq')}
            id="nav-link-state-hq"
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activePage === 'state-hq'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100/90 hover:text-emerald-950 border border-emerald-300/80'
            }`}
          >
            <Landmark className={`h-3.5 w-3.5 ${activePage === 'state-hq' ? 'text-amber-300' : 'text-emerald-700'}`} />
            <span>Benue State HQ</span>
            <span className="rounded px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[9px] font-black uppercase shadow-2xs">
              23 LGAs
            </span>
          </button>

          {/* Academic Wing (With Quick Sub-Links Dropdown) */}
          <div className="relative" ref={academicDropdownRef}>
            <button
              onClick={() => {
                if (activePage !== 'academic') {
                  navigateTo('academic');
                } else {
                  setAcademicDropdownOpen(!academicDropdownOpen);
                }
              }}
              onMouseEnter={() => setAcademicDropdownOpen(true)}
              id="nav-link-academic"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activePage === 'academic'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className={`h-3.5 w-3.5 ${activePage === 'academic' ? 'text-white' : 'text-slate-500'}`} />
              <span>Academic Wing</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {academicDropdownOpen && (
              <div 
                className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 text-slate-800 z-50 animate-in fade-in duration-150"
                onMouseLeave={() => setAcademicDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Academic Portals & Scoring
                  </span>
                </div>
                <button
                  onClick={() => navigateTo('academic', 'scoresheet')}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  <div>
                    <div>Continuous Assessment (40/60)</div>
                    <span className="text-[10px] text-slate-400 font-normal">Test 1, Test 2, Project & Exam</span>
                  </div>
                </button>
                <button
                  onClick={() => navigateTo('academic', 'broadsheet')}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <Award className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div>Class Broadsheet Summary</div>
                    <span className="text-[10px] text-slate-400 font-normal">Terminal averages, positions & GPA</span>
                  </div>
                </button>
                <button
                  onClick={() => navigateTo('academic', 'attendance')}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span>Daily Attendance Register</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">KG-SSS3</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">Form master roll call, 65 days & automated totals</span>
                  </div>
                </button>
                <button
                  onClick={() => navigateTo('academic', 'reports')}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-purple-600" />
                  <div>
                    <div>Official Report Cards</div>
                    <span className="text-[10px] text-slate-400 font-normal">Printable cards with QR code & remarks</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* School Wings & Educational Arms Mega Dropdown */}
          <div className="relative" ref={armsDropdownRef}>
            <button
              onClick={() => setArmsDropdownOpen(!armsDropdownOpen)}
              onMouseEnter={() => setArmsDropdownOpen(true)}
              id="header-arms-dropdown-btn"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                isArmPageActive
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 bg-purple-50/80 hover:bg-purple-100/90 border border-purple-200/80'
              }`}
              aria-expanded={armsDropdownOpen}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>School Arms & Wings</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${armsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {armsDropdownOpen && (
              <div 
                className="absolute left-0 mt-1.5 w-96 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 text-slate-800 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                onMouseLeave={() => setArmsDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Dedicated Educational Arms & Councils
                  </span>
                  <button
                    onClick={() => navigateTo('organogram')}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Organogram</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {educationalArms.map((arm) => {
                    const Icon = arm.icon;
                    const isActive = activePage === arm.id;
                    return (
                      <button
                        key={arm.id}
                        onClick={() => navigateTo(arm.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition flex items-start gap-3 cursor-pointer group ${
                          isActive 
                            ? 'bg-blue-50 border-blue-300 text-blue-950 shadow-xs' 
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${arm.theme} shrink-0 mt-0.5 border`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                              {arm.label}
                            </span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                              {arm.badge}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-slate-600 line-clamp-1">
                            {arm.grade}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {arm.sub}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] px-1 text-slate-500">
                  <span>Executive Head: <strong>Dr. Matthew Ternenge Beeun</strong></span>
                  <button
                    onClick={() => navigateTo('about')}
                    className="font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View Executive Profile →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bursary & Admin */}
          <button
            onClick={() => navigateTo('admin')}
            id="nav-link-admin"
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activePage === 'admin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className={`h-3.5 w-3.5 ${activePage === 'admin' ? 'text-white' : 'text-slate-500'}`} />
            <span>Bursary & Admin</span>
          </button>

          {/* Documentation & Developer Architecture Mega Dropdown */}
          <div className="relative" ref={docsDropdownRef}>
            <button
              onClick={() => {
                if (activePage !== 'docs' && activePage !== 'dev-docs' && activePage !== 'developer-docs') {
                  navigateTo('docs');
                } else {
                  setDocsDropdownOpen(!docsDropdownOpen);
                }
              }}
              onMouseEnter={() => setDocsDropdownOpen(true)}
              id="nav-link-docs"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activePage === 'docs' || activePage === 'dev-docs' || activePage === 'developer-docs'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <BookOpen className={`h-3.5 w-3.5 ${activePage === 'docs' || activePage === 'dev-docs' || activePage === 'developer-docs' ? 'text-white' : 'text-slate-500'}`} />
              <span>Docs</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {docsDropdownOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-72 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 text-slate-800 z-50 animate-in fade-in duration-150"
                onMouseLeave={() => setDocsDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    System Documentation Hub
                  </span>
                </div>

                <button
                  onClick={() => {
                    navigateTo('docs');
                    setDocsDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                    activePage === 'docs' ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">1. User Operational Guide</div>
                    <span className="text-[10px] text-slate-500 font-normal leading-tight block mt-0.5">
                      Navigating continuous assessment, broadsheets, fee receipts, organogram & 23 LGAs.
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    navigateTo('dev-docs');
                    setDocsDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 cursor-pointer mt-1 ${
                    activePage === 'dev-docs' || activePage === 'developer-docs' ? 'bg-emerald-50 text-emerald-950 border border-emerald-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>2. Developer & Tech Docs</span>
                      <span className="text-[9px] bg-emerald-600 text-white font-mono px-1.5 py-0.2 rounded font-bold">New</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal leading-tight block mt-0.5">
                      React/Vite/Express stack, TypeScript types, database schemas & onboarding playbook.
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Contact */}
          <button
            onClick={() => navigateTo('contact')}
            id="nav-link-contact"
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activePage === 'contact'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PhoneCall className={`h-3.5 w-3.5 ${activePage === 'contact' ? 'text-white' : 'text-slate-500'}`} />
            <span>Contact</span>
          </button>
        </nav>

        {/* Right CTA Action Button (Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0">
          <button
            onClick={onOpenParentPortalModal}
            id="header-desktop-parent-portal-btn"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/90 px-2.5 py-1.5 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer shadow-xs whitespace-nowrap"
            title="Parent Report Card Verification & Download Portal"
          >
            <FileText className="h-3.5 w-3.5 text-indigo-600" />
            <span>Parent Portal</span>
          </button>

          <button
            onClick={() => navigateTo('academic', 'reports')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer whitespace-nowrap"
            title="Generate Official Terminal Report Card"
          >
            <Award className="h-3.5 w-3.5 text-amber-400" />
            <span>Report Cards</span>
          </button>

          <button
            onClick={() => navigateTo('admin', 'admissions')}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-1.5 text-xs font-bold hover:bg-blue-100 transition cursor-pointer whitespace-nowrap"
            title="Admissions Portal & Entrance Applications"
          >
            <span>Admissions</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none transition cursor-pointer"
            id="mobile-nav-toggle"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Responsive Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-2xl animate-in slide-in-from-top duration-200 max-h-[85vh] overflow-y-auto space-y-4">
          
          {/* Quick Actions in Mobile Drawer */}
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenParentPortalModal?.();
              }}
              className="p-2.5 rounded-xl bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-200 flex items-center justify-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
              <span>Parent Portal</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSecurityModal?.();
              }}
              className="p-2.5 rounded-xl bg-amber-50 text-amber-900 font-bold text-xs border border-amber-200 flex items-center justify-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
              <span>Passkeys</span>
            </button>
            <button
              onClick={() => navigateTo('academic', 'reports')}
              className="p-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span>Report Cards</span>
            </button>
            <button
              onClick={() => navigateTo('admin', 'admissions')}
              className="p-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1.5"
            >
              <span>Admissions</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Primary Nav Items */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
              Core Portals & Administration
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    isActive ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      isActive ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Educational Arms in Mobile Drawer */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
              Specialized Educational Arms & Wings
            </span>
            {educationalArms.map((arm) => {
              const Icon = arm.icon;
              const isActive = activePage === arm.id;
              return (
                <button
                  key={arm.id}
                  onClick={() => navigateTo(arm.id)}
                  className={`w-full flex items-center justify-between rounded-xl p-2.5 text-left text-xs font-bold transition border ${
                    isActive ? 'bg-purple-700 text-white border-purple-800' : 'bg-slate-50/80 border-slate-200/80 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                    <div>
                      <div>{arm.label}</div>
                      <span className={`text-[10px] font-normal block ${isActive ? 'text-purple-200' : 'text-slate-500'}`}>
                        {arm.grade}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </button>
              );
            })}
          </div>

          {/* Academic Context (Session, Term, Class) in Mobile Drawer */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Academic Context Settings
              </span>
              <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {academicYear} • {selectedTerm}
              </span>
            </div>
            
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Session:</label>
                  <select
                    value={academicYear}
                    onChange={(e) => onAcademicYearChange?.(e.target.value as AcademicYear)}
                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Term:</label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => onTermChange?.(e.target.value as Term)}
                    className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-blue-700"
                  >
                    <option value="1st Term">1st Term</option>
                    <option value="2nd Term">2nd Term</option>
                    <option value="3rd Term">3rd Term</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Active Class:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => onClassChange?.(e.target.value as ClassLevel)}
                  className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <optgroup label="Kindergarten (KG 1–3)">
                    <option value="KG 1">KG 1</option>
                    <option value="KG 2">KG 2</option>
                    <option value="KG 3">KG 3</option>
                  </optgroup>
                  <optgroup label="Primary (Basic 1–6)">
                    <option value="Basic 1">Basic 1</option>
                    <option value="Basic 2">Basic 2</option>
                    <option value="Basic 3">Basic 3</option>
                    <option value="Basic 4">Basic 4</option>
                    <option value="Basic 5">Basic 5</option>
                    <option value="Basic 6">Basic 6</option>
                  </optgroup>
                  <optgroup label="Junior Secondary">
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 2">JSS 2</option>
                    <option value="JSS 3">JSS 3</option>
                  </optgroup>
                  <optgroup label="Senior Secondary">
                    <option value="SSS 1 Science">SSS 1 Science</option>
                    <option value="SSS 1 Arts">SSS 1 Arts</option>
                    <option value="SSS 1 Commercial">SSS 1 Commercial</option>
                    <option value="SSS 2 Science">SSS 2 Science</option>
                    <option value="SSS 2 Arts">SSS 2 Arts</option>
                    <option value="SSS 2 Commercial">SSS 2 Commercial</option>
                    <option value="SSS 3 Science">SSS 3 Science</option>
                    <option value="SSS 3 Arts">SSS 3 Arts</option>
                    <option value="SSS 3 Commercial">SSS 3 Commercial</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* Role Switcher in Mobile Drawer */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
              Active Portal Role: <strong className="text-slate-800">{currentRoleObj.label}</strong>
            </span>
            <div className="grid grid-cols-1 gap-1.5 px-1">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRoleChange(r.id)}
                  className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition ${
                    userRole === r.id ? 'bg-blue-100 text-blue-800 font-bold border border-blue-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{r.label}</span>
                  {userRole === r.id && <Check className="h-3.5 w-3.5 text-blue-700" />}
                </button>
              ))}
            </div>
          </div>

          {/* Helpdesk Direct Contact */}
          <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500 space-y-1">
            <p>Direct Administrative Line: <a href="tel:+2348115231834" className="font-bold text-emerald-600">+234 811 523 1834</a></p>
            <p className="text-[11px]">Akperan Orshi Avenue, Makurdi, Benue State, Nigeria</p>
          </div>

        </div>
      )}
    </header>
  );
};
