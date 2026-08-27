import React, { useState, useRef, useEffect } from 'react';
import { BummptechLogo } from './BummptechLogo';
import { NavigationPage } from '../types';
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
  ArrowRight
} from 'lucide-react';

export type ActivePage = NavigationPage;

interface HeaderProps {
  activePage: NavigationPage;
  setActivePage?: (page: NavigationPage) => void;
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  userRole?: string;
  setUserRole?: (role: any) => void;
  onRoleChange?: (role: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  setActivePage,
  onNavigate,
  userRole = 'principal',
  setUserRole,
  onRoleChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [armsDropdownOpen, setArmsDropdownOpen] = useState(false);
  const [academicDropdownOpen, setAcademicDropdownOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const armsDropdownRef = useRef<HTMLDivElement>(null);
  const academicDropdownRef = useRef<HTMLDivElement>(null);

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
    { id: 'academic' as NavigationPage, label: 'Academic Wing', icon: LayoutDashboard, badge: 'CA 40/60', hasDropdown: true },
    { id: 'lesson-notes' as NavigationPage, label: 'Lesson Notes (PDF)', icon: FileText, badge: 'Parents' },
    { id: 'admin' as NavigationPage, label: 'Bursary & Admin', icon: Building2 },
    { id: 'organogram' as NavigationPage, label: 'Organogram', icon: GitFork },
    { id: 'about' as NavigationPage, label: 'About Executive', icon: UserCheck },
    { id: 'docs' as NavigationPage, label: 'Documentation', icon: BookOpen },
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-all duration-200 shadow-xs" id="main-app-header">
      {/* Top Utility Micro-Bar */}
      <div className="bg-slate-950 text-slate-300 border-b border-slate-800/80 px-4 py-1.5 text-[11px] select-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
          
          {/* Left Session & Accreditation Indicators */}
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="inline-flex items-center gap-1.5 font-bold text-amber-400 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              2025/2026 Session • 2nd Term
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-300 truncate font-medium">
              Unified Multi-Arm System: <strong className="text-white">KG (1–3)</strong> • <strong className="text-white">Primary (1–6)</strong> • <strong className="text-white">Secondary (JSS–SSS)</strong>
            </span>
          </div>

          {/* Right Hotline & Role Switcher */}
          <div className="flex items-center gap-3 shrink-0">
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        
        {/* Left: Brand Identity */}
        <button 
          onClick={() => navigateTo('home')} 
          className="text-left focus:outline-none cursor-pointer group pr-4 sm:pr-6 lg:pr-8 xl:pr-10 shrink-0"
          id="brand-home-link"
          aria-label="BummptEducation Home"
        >
          <BummptechLogo size="md" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          
          {/* Home */}
          <button
            onClick={() => navigateTo('home')}
            id="nav-link-home"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
              activePage === 'home'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GraduationCap className={`h-4 w-4 ${activePage === 'home' ? 'text-white' : 'text-slate-500'}`} />
            <span>Home</span>
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
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activePage === 'academic'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className={`h-4 w-4 ${activePage === 'academic' ? 'text-white' : 'text-slate-500'}`} />
              <span>Academic Wing</span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-tight ${
                activePage === 'academic' ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800'
              }`}>
                CA 40/60
              </span>
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
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                isArmPageActive
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 bg-purple-50/80 hover:bg-purple-100/90 border border-purple-200/80'
              }`}
              aria-expanded={armsDropdownOpen}
            >
              <Layers className="h-4 w-4" />
              <span>School Arms & Wings</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${armsDropdownOpen ? 'rotate-180' : ''}`} />
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
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
              activePage === 'admin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className={`h-4 w-4 ${activePage === 'admin' ? 'text-white' : 'text-slate-500'}`} />
            <span>Bursary & Admin</span>
          </button>

          {/* Organogram */}
          <button
            onClick={() => navigateTo('organogram')}
            id="nav-link-organogram"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
              activePage === 'organogram'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GitFork className={`h-4 w-4 ${activePage === 'organogram' ? 'text-white' : 'text-slate-500'}`} />
            <span>Organogram</span>
          </button>

          {/* About Founder & School */}
          <button
            onClick={() => navigateTo('about')}
            id="nav-link-about"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
              activePage === 'about'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCheck className={`h-4 w-4 ${activePage === 'about' ? 'text-white' : 'text-slate-500'}`} />
            <span>About</span>
          </button>

          {/* Documentation */}
          <button
            onClick={() => navigateTo('docs')}
            id="nav-link-docs"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
              activePage === 'docs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className={`h-4 w-4 ${activePage === 'docs' ? 'text-white' : 'text-slate-500'}`} />
            <span>Docs</span>
          </button>

          {/* Contact */}
          <button
            onClick={() => navigateTo('contact')}
            id="nav-link-contact"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
              activePage === 'contact'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PhoneCall className={`h-4 w-4 ${activePage === 'contact' ? 'text-white' : 'text-slate-500'}`} />
            <span>Contact</span>
          </button>
        </nav>

        {/* Right CTA Action Button (Desktop) */}
        <div className="hidden lg:flex items-center gap-2.5">
          <button
            onClick={() => navigateTo('academic', 'reports')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
            title="Generate Official Terminal Report Card"
          >
            <Award className="h-3.5 w-3.5 text-amber-400" />
            <span>Report Cards</span>
          </button>

          <button
            onClick={() => navigateTo('admin', 'admissions')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 px-3 py-2 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
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
