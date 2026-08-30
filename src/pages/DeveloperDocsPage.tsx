import React, { useState, useMemo } from 'react';
import { 
  Code2, 
  Terminal, 
  Database, 
  Layers, 
  Cpu, 
  Server, 
  Workflow, 
  FolderTree, 
  FileCode, 
  GitBranch, 
  ShieldCheck, 
  Zap, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  BookOpen, 
  Landmark, 
  Settings, 
  Sparkles, 
  Box, 
  Braces, 
  Key, 
  HardDrive,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  Compass,
  Laptop
} from 'lucide-react';
import { NavigationPage } from '../types';

interface DeveloperDocsPageProps {
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
}

export const DeveloperDocsPage: React.FC<DeveloperDocsPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeDbTab, setActiveDbTab] = useState<'relational' | 'firestore' | 'types'>('relational');
  const [activeApiTab, setActiveApiTab] = useState<'notes' | 'stats' | 'feedback' | 'health'>('notes');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const sections = [
    { id: 'overview', title: '1. Architecture & Manifesto', icon: Cpu },
    { id: 'stack', title: '2. Software & Tech Stack', icon: Layers },
    { id: 'tree', title: '3. Folder Structure & Modules', icon: FolderTree },
    { id: 'types', title: '4. TypeScript Type Engine', icon: Braces },
    { id: 'database', title: '5. Database & Persistence', icon: Database },
    { id: 'backend', title: '6. Server & REST API Routes', icon: Server },
    { id: 'engines', title: '7. Core Algorithmic Engines', icon: Workflow },
    { id: 'design', title: '8. UI/UX & Design Tokens', icon: Sparkles },
    { id: 'onboarding', title: '9. Developer Onboarding & Setup', icon: Terminal },
    { id: 'extending', title: '10. How to Extend the Codebase', icon: GitBranch },
    { id: 'security', title: '11. Passkey & Wing Gatekeeper Security', icon: ShieldCheck },
    { id: 'directives', title: '12. Ministry Updates & Telemetry Ingestion', icon: Landmark },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter((s) => s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [searchQuery]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header / Hero Banner */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
                <Code2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Technical Architecture & Developer Documentation
                  </h1>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    v3.2 Production
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Engineering blueprint, software stack, database schemas, TypeScript models, API reference & onboarding guide
                </p>
              </div>
            </div>

            {/* Quick Actions & Mode Switcher */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onNavigate && onNavigate('docs')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                title="Switch to End-User Guide"
              >
                <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                <span>Switch to User Guide</span>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('benue-state-hq')}
                className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-700/50 cursor-pointer"
              >
                <Landmark className="h-3.5 w-3.5 text-emerald-400" />
                <span>Benue State 23 LGAs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search technical specs..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Navigation Menu Links */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-3 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Architecture Index
                </div>
                {filteredSections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className="truncate">{sec.title}</span>
                      </span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Developer Fast Facts Box */}
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/60 text-xs space-y-2 text-slate-400">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Developer Quick Specs</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-500">Language</span>
                    <span className="text-emerald-400">TypeScript 5.8</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-500">Frontend</span>
                    <span className="text-slate-300">React 19 + Vite 6</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-500">Backend</span>
                    <span className="text-slate-300">Express 4.21 + tsx</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-800/60">
                    <span className="text-slate-500">Styling</span>
                    <span className="text-slate-300">Tailwind CSS v4</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Dev Port</span>
                    <span className="text-amber-400">3000 (0.0.0.0)</span>
                  </div>
                </div>
              </div>

            </div>
          </aside>

          {/* Main Documentation Articles */}
          <main className="lg:col-span-9 space-y-12">
            
            {/* Section 1: Architecture & Engineering Manifesto */}
            <section id="section-overview" className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Cpu className="h-4 w-4" /> Section 1
              </div>
              <h2 className="text-2xl font-black text-white">System Architecture & Engineering Manifesto</h2>
              
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>
                  <strong>BummptEducation</strong> is engineered as a unified, enterprise-grade, multi-arm educational management and statewide governance platform. It provides end-to-end operational capabilities for all levels of Nigerian education—from <strong>Early Childhood (Kindergarten 1–3)</strong> and <strong>Universal Basic Education (Primary 1–6 / SUBEB)</strong> to <strong>Senior Secondary Colleges (JSS 1–SSS 3)</strong>, <strong>Technical Colleges</strong>, and <strong>State Ministry HQ Governance across all 23 LGAs of Benue State</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <div className="font-black text-emerald-400 text-xs uppercase font-mono">1. Unidirectional Flow</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Predictable single-source-of-truth state tree with decoupled UI presentation layers and dedicated computation utilities.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <div className="font-black text-blue-400 text-xs uppercase font-mono">2. Type-Safe Contracts</div>
                    <p className="text-xs text-slate-400 mt-1">
                      100% strict TypeScript types governing every assessment score, grade scale, financial voucher, and LGA institutional metric.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <div className="font-black text-amber-400 text-xs uppercase font-mono">3. Modular Multi-Wing</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Autonomous module boundaries for Kindergarten, Primary, Secondary, Lesson Notes Repo, Bursary, and Benue State 23 LGAs.
                    </p>
                  </div>
                </div>

                {/* High-Level Architecture Flow Diagram */}
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-3 font-mono">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-300 flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-emerald-400" />
                      Runtime Architecture Dataflow Diagram
                    </span>
                    <span className="text-[10px] text-slate-500">React 19 &bull; Express 4 &bull; Vite 6</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-700">
                      <div className="font-bold text-teal-400">1. Client Tier</div>
                      <div className="text-[10px] text-slate-400 mt-1">React 19 SPA</div>
                      <div className="text-[9px] text-slate-500">Tailwind + Motion</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-700">
                      <div className="font-bold text-blue-400">2. Vite Middleware</div>
                      <div className="text-[10px] text-slate-400 mt-1">HMR & Asset Pipeline</div>
                      <div className="text-[9px] text-slate-500">SPA Fallback Routing</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-700">
                      <div className="font-bold text-emerald-400">3. Express API Tier</div>
                      <div className="text-[10px] text-slate-400 mt-1">/api/* Endpoints</div>
                      <div className="text-[9px] text-slate-500">REST Controller & Validations</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-700">
                      <div className="font-bold text-amber-400">4. Storage Tier</div>
                      <div className="text-[10px] text-slate-400 mt-1">Runtime Store + Cache</div>
                      <div className="text-[9px] text-slate-500">PostgreSQL / Firestore Ready</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Software & Technology Stack */}
            <section id="section-stack" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Layers className="h-4 w-4" /> Section 2
              </div>
              <h2 className="text-2xl font-black text-white">Full Technology Stack & Dependencies</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  Every package in the application has been carefully chosen for performance, standard compliance, and zero runtime bloat.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                        <FileCode className="h-4 w-4 text-emerald-400" />
                        Core Frontend
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">Browser / UI</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300">
                      <li><strong className="text-white">React 19:</strong> Functional component architecture with custom hooks and React State primitives.</li>
                      <li><strong className="text-white">TypeScript 5.8:</strong> Full compile-time static type-checking and interface enforcement.</li>
                      <li><strong className="text-white">Tailwind CSS v4:</strong> Utility-first responsive styling via modern `@import "tailwindcss";` Vite engine.</li>
                      <li><strong className="text-white">Motion:</strong> Smooth hardware-accelerated transitions via `motion/react`.</li>
                      <li><strong className="text-white">Lucide React:</strong> Standardized vector icon typography across all modules.</li>
                      <li><strong className="text-white">Recharts:</strong> D3-backed responsive data visualizations for grade distributions and LGA benchmarks.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-400 text-sm flex items-center gap-1.5">
                        <Server className="h-4 w-4 text-blue-400" />
                        Server & Build Pipeline
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">Node / tsx</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300">
                      <li><strong className="text-white">Express 4.21:</strong> High-performance server-side REST API proxy mounted on port 3000.</li>
                      <li><strong className="text-white">tsx 4.21:</strong> Native TypeScript execution runner for hot backend server development.</li>
                      <li><strong className="text-white">Vite 6.2:</strong> Lightning fast frontend dev bundler mounted via Express middleware.</li>
                      <li><strong className="text-white">esbuild 0.25:</strong> Bundles `server.ts` into a single, self-contained `dist/server.cjs` file for production deployment.</li>
                      <li><strong className="text-white">jsPDF 4.2:</strong> Programmatic PDF document compilation for student report cards, bursary receipts, and Governor Memos.</li>
                    </ul>
                  </div>
                </div>

                {/* Package.json Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-emerald-400">package.json scripts & dependencies</span>
                    <button
                      onClick={() => handleCopy(`"scripts": {\n  "dev": "tsx server.ts",\n  "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",\n  "start": "node dist/server.cjs",\n  "lint": "tsc --noEmit"\n}`, 'pkg')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSnippet === 'pkg' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedSnippet === 'pkg' ? 'Copied' : 'Copy Scripts'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`{
  "name": "bummpt-education-platform",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "lint": "tsc --noEmit"
  }
}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Section 3: Folder Structure & Directory Blueprint */}
            <section id="section-tree" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <FolderTree className="h-4 w-4" /> Section 3
              </div>
              <h2 className="text-2xl font-black text-white">Folder Structure & Modular Hierarchy</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  The codebase adheres to strict separation of concerns. All files are categorized under semantic directories:
                </p>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                  <pre className="text-emerald-400 font-bold mb-2">├── / (Root Directory)</pre>
                  <pre className="text-slate-300">
{`├── server.ts                    # Express backend entry point + REST API + Vite middleware
├── package.json                 # Project dependencies, build/start/lint scripts
├── vite.config.ts               # Vite configuration with Tailwind CSS plugin
├── tsconfig.json                # TypeScript compiler configuration & strict rules
├── index.html                   # HTML5 Entry Point with dynamic SEO & OpenGraph tags
│
└── src/                         # Client-Side Application Root
    ├── main.tsx                 # React 19 root bootstrap & DOM mounting
    ├── App.tsx                  # Global App Router, navigation dispatch & modal state
    ├── index.css                # Tailwind CSS v4 entry (@import "tailwindcss";)
    │
    ├── types/                   # 100% Strict TypeScript Types & Interfaces
    │   └── index.ts             # Domain models (Student, Staff, WAEC, BenueLGA, etc.)
    │
    ├── data/                    # In-Memory Schemas, Seeding & Constants
    │   ├── mockData.ts          # Core students, subjects, assessments, fee payments
    │   ├── benueStateData.ts    # 23 Benue LGAs, schools, SUBEB basic education records
    │   └── lessonNotesData.ts   # Initial syllabus notes, parent inquiries & stats
    │
    ├── utils/                   # Business Logic, Algorithmic & Security Engines
    │   ├── grading.ts           # 40% CA + 60% Exam scoring, WAEC/Primary grade mappers
    │   ├── pdfGenerator.ts      # jsPDF programmatic report card & receipt compilers
    │   └── securityContext.ts   # Role-based access control, PIN & gatekeeper tokens
    │
    ├── components/              # Reusable Modular UI Components & Modals
    │   ├── Header.tsx           # Global responsive navigation header & context bar
    │   ├── Footer.tsx           # Institutional footer, accreditations & 23 LGAs banner
    │   ├── BummptechLogo.tsx    # SVG brand emblem component
    │   ├── ReportCardModal.tsx  # Interactive terminal report card & print layout
    │   ├── FeeReceiptModal.tsx  # Electronic bursary receipt & verification slip
    │   ├── AiRemarkModal.tsx    # Intelligent comment generator for form tutors
    │   ├── WingAccessGatekeeper # PIN passkey protection gate for sensitive wings
    │   ├── UploadLessonNoteModal# Teacher lesson note publishing interface
    │   └── LessonNoteViewerModal# Student & parent curriculum study viewer
    │
    └── pages/                   # Top-Level Page Views & Interactive Dashboards
        ├── HomePage.tsx         # Executive portal showcase & fast actions hub
        ├── AcademicDashboard.tsx# Continuous assessment recording & broadsheets
        ├── AdminDashboard.tsx   # Admissions, staff records, bursary & fee schedules
        ├── BenueStateHQPage.tsx # Benue State MOE/SUBEB 23 LGAs Institutional Portal
        ├── EarlyChildhoodPage.tsx # Kindergarten 1–3 developmental milestones
        ├── PrimarySchoolPage.tsx  # Basic 1–6 (SUBEB) & Common Entrance portal
        ├── SecondaryCollegePage.tsx # JSS 1–SSS 3, WAEC/NECO/JAMB senior wing
        ├── LessonNotesPage.tsx  # 24/7 Digital curriculum repository for parents
        ├── OrganogramPage.tsx   # Institutional administrative hierarchy & nodes
        ├── StudentLeadershipPage.tsx # Prefectorial board & house masters
        ├── DocumentationPage.tsx # End-user operational handbook & user guide
        ├── DeveloperDocsPage.tsx # Developer technical architecture (This Page)
        ├── AboutMePage.tsx      # System architect credentials & Bummptech info
        ├── ContactPage.tsx      # Multi-channel institutional support desk
        └── PrivacyTermsPage.tsx # Data governance, NDPR compliance & audit terms`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Section 4: TypeScript Type Architecture */}
            <section id="section-types" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Braces className="h-4 w-4" /> Section 4
              </div>
              <h2 className="text-2xl font-black text-white">TypeScript Data Models & Contracts</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  Located in <code className="text-emerald-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">/src/types/index.ts</code>, these type definitions establish strong structural typing across every feature:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-teal-400 font-mono">1. Institutional & Student Types</div>
                    <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                      <li><strong className="text-white">Student:</strong> Demographics, admission ID, currentClass, house, guardian, status.</li>
                      <li><strong className="text-white">ClassLevel:</strong> 21-level union (`KG 1` - `KG 3`, `Basic 1` - `Basic 6`, `JSS 1` - `SSS 3`).</li>
                      <li><strong className="text-white">SchoolArm:</strong> `'kindergarten' | 'primary' | 'secondary'`.</li>
                      <li><strong className="text-white">Staff:</strong> Designation, TRCN credentials, assigned subjects, wing role.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-bold text-amber-400 font-mono">2. Benue 23 LGAs Governance Types</div>
                    <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                      <li><strong className="text-white">BenueLGA:</strong> 23 Local Government union types (Makurdi, Gboko, Otukpo, etc.).</li>
                      <li><strong className="text-white">GovSchool:</strong> Institutional profile, TRCN ratio, pass rates, subventions.</li>
                      <li><strong className="text-white">TeacherKPIs:</strong> TRCN rate, lesson vetting rate, qualification distribution.</li>
                      <li><strong className="text-white">StudentKPIs:</strong> WAEC, NCEE, PSLE, EGRA, EGMA, Feeding (HGSFP).</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-emerald-400">Sample Model: GovSchool & StudentReportCard</span>
                    <button
                      onClick={() => handleCopy(`export interface GovSchool {\n  id: string;\n  code: string;\n  name: string;\n  lga: BenueLGA;\n  zone: SenatorialZone;\n  category: GovSchoolCategory;\n  totalStudents: number;\n  totalTeachers: number;\n  trcnCertifiedTeachers: number;\n  teacherKPIs: TeacherPerformanceKPIs;\n  studentKPIs: StudentPerformanceKPIs;\n  financialStatement: SchoolFinancialStatement;\n  governingBodyReview: GoverningBodyReview;\n}`, 'types-snippet')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSnippet === 'types-snippet' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>Copy Sample Interface</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-blue-300 overflow-x-auto">
{`export interface AssessmentScore {
  studentId: string;
  subjectId: string;
  classLevel: ClassLevel;
  term: Term;
  academicYear: AcademicYear;
  ca1: number;         // Max 10 (Continuous Assessment 1)
  ca2: number;         // Max 10 (Continuous Assessment 2)
  assignment: number;  // Max 10 (Homework / Projects)
  attendance: number;  // Max 10 (Punctuality & Presence)
  totalCa: number;     // Max 40 (Automated Sum)
  examScore: number;   // Max 60 (Terminal Examination)
  totalScore: number;  // Max 100 (Automated Sum)
  grade: StandardGrade | PrimaryGrade; // Computed A1-F9 or A+-F
  remark: string;
}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Section 5: Database Schemas & Persistence */}
            <section id="section-database" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Database className="h-4 w-4" /> Section 5
              </div>
              <h2 className="text-2xl font-black text-white">Database Architecture & Persistence Models</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  The application is architected with dual persistence pathways: an immediate, lightning-fast in-memory/REST runtime store and pre-modeled production schemas for both <strong>Relational SQL (PostgreSQL / Cloud SQL)</strong> and <strong>Document NoSQL (Firebase Firestore)</strong>.
                </p>

                {/* DB Tab Selector */}
                <div className="flex border-b border-slate-800 gap-2">
                  <button
                    onClick={() => setActiveDbTab('relational')}
                    className={`px-4 py-2 text-xs font-bold transition border-b-2 cursor-pointer ${
                      activeDbTab === 'relational'
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    PostgreSQL / Cloud SQL (Drizzle ORM DDL)
                  </button>
                  <button
                    onClick={() => setActiveDbTab('firestore')}
                    className={`px-4 py-2 text-xs font-bold transition border-b-2 cursor-pointer ${
                      activeDbTab === 'firestore'
                        ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Firebase Firestore (NoSQL Collection Schema)
                  </button>
                </div>

                {activeDbTab === 'relational' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-emerald-400">PostgreSQL Schema (tables: students, assessments, benue_schools)</span>
                      <button
                        onClick={() => handleCopy(`-- PostgreSQL DDL\nCREATE TABLE students (\n  id VARCHAR(64) PRIMARY KEY,\n  admission_number VARCHAR(32) UNIQUE NOT NULL,\n  full_name VARCHAR(255) NOT NULL,\n  gender VARCHAR(10) NOT NULL,\n  current_class VARCHAR(32) NOT NULL,\n  arm VARCHAR(32) NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);`, 'sql')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSnippet === 'sql' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copy SQL DDL</span>
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`-- PostgreSQL Schema for BummptEducation Enterprise

CREATE TABLE schools (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  lga VARCHAR(64) NOT NULL,
  zone VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  established_year INT DEFAULT 1980
);

CREATE TABLE students (
  id VARCHAR(64) PRIMARY KEY,
  school_id VARCHAR(64) REFERENCES schools(id) ON DELETE CASCADE,
  admission_number VARCHAR(32) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  current_class VARCHAR(32) NOT NULL,
  arm VARCHAR(32) NOT NULL,
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(32),
  status VARCHAR(32) DEFAULT 'Active'
);

CREATE TABLE assessment_scores (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) REFERENCES students(id) ON DELETE CASCADE,
  subject_id VARCHAR(64) NOT NULL,
  class_level VARCHAR(32) NOT NULL,
  term VARCHAR(32) NOT NULL,
  academic_year VARCHAR(32) NOT NULL,
  ca1 NUMERIC(4,1) DEFAULT 0,
  ca2 NUMERIC(4,1) DEFAULT 0,
  assignment NUMERIC(4,1) DEFAULT 0,
  attendance NUMERIC(4,1) DEFAULT 0,
  total_ca NUMERIC(4,1) GENERATED ALWAYS AS (ca1 + ca2 + assignment + attendance) STORED,
  exam_score NUMERIC(4,1) DEFAULT 0,
  total_score NUMERIC(5,1) GENERATED ALWAYS AS (ca1 + ca2 + assignment + attendance + exam_score) STORED,
  grade VARCHAR(5) NOT NULL,
  remark VARCHAR(255)
);

CREATE TABLE lesson_notes (
  id VARCHAR(64) PRIMARY KEY,
  subject_id VARCHAR(64) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  class_level VARCHAR(32) NOT NULL,
  week_number INT NOT NULL,
  teacher_id VARCHAR(64) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  content_body TEXT NOT NULL,
  download_count INT DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                    </pre>
                  </div>
                )}

                {activeDbTab === 'firestore' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-blue-400">Firestore Document Collections Structure</span>
                    </div>
                    <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-blue-300 overflow-x-auto">
{`// Cloud Firestore Collection Hierarchy
├── /schools/{schoolId}
│   ├── name: "Government College Makurdi"
│   ├── lga: "Makurdi"
│   ├── zone: "Zone B (Benue North-West)"
│   │
│   ├── /students/{studentId}
│   │   ├── fullName: "Terna Benjamin"
│   │   ├── currentClass: "SSS 2 Science"
│   │   ├── admissionNumber: "BNS/MKD/2024/001"
│   │   │
│   │   └── /assessments/{termYearId}
│   │       ├── term: "2nd Term"
│   │       ├── academicYear: "2025/2026"
│   │       └── scores: [ { subject: "Physics", totalScore: 84, grade: "A1" } ]
│   │
│   └── /staff/{staffId}
│       ├── fullName: "Dr. James Iorfa"
│       └── designation: "VP Academic"
│
├── /lesson_notes/{noteId}
│   ├── title: "Calculus & Derivatives"
│   ├── classLevel: "SSS 2 Science"
│   ├── downloadCount: 48
│   └── feedbacks: [ { parentName: "Mrs. Tor", question: "..." } ]
│
└── /benue_governance/{lgaId}
    ├── lga: "Gboko"
    └── totalGovernmentSchools: 18`}
                    </pre>
                  </div>
                )}
              </div>
            </section>

            {/* Section 6: Backend Server & REST API Routes */}
            <section id="section-backend" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Server className="h-4 w-4" /> Section 6
              </div>
              <h2 className="text-2xl font-black text-white">Backend Server & REST API Documentation</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  The backend service is located at <code className="text-emerald-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">server.ts</code>. All API routes are prefixed with <code className="text-amber-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">/api/*</code> and mounted prior to Vite SPA middleware.
                </p>

                {/* API Route Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-900 text-slate-300 font-mono text-[11px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-3">Method</th>
                        <th className="p-3">Route Endpoint</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Parameters / Body</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-emerald-400">GET</td>
                        <td className="p-3 font-mono text-white">/api/health</td>
                        <td className="p-3 text-slate-400">System health status and server heartbeat.</td>
                        <td className="p-3 text-slate-500 font-mono">None</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-emerald-400">GET</td>
                        <td className="p-3 font-mono text-white">/api/lesson-notes</td>
                        <td className="p-3 text-slate-400">Query and filter syllabus notes by class, arm, week, or text search.</td>
                        <td className="p-3 text-slate-400 font-mono">?classLevel&arm&term&week&search</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-emerald-400">GET</td>
                        <td className="p-3 font-mono text-white">/api/lesson-notes/stats</td>
                        <td className="p-3 text-slate-400">Aggregate statistics: total notes, downloads, feedback count.</td>
                        <td className="p-3 text-slate-500 font-mono">None</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-blue-400">POST</td>
                        <td className="p-3 font-mono text-white">/api/lesson-notes</td>
                        <td className="p-3 text-slate-400">Upload and publish a new lesson note by a teacher.</td>
                        <td className="p-3 text-slate-400 font-mono">JSON (title, topic, contentBody, etc.)</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-blue-400">POST</td>
                        <td className="p-3 font-mono text-white">/api/lesson-notes/:id/increment-download</td>
                        <td className="p-3 text-slate-400">Increments download telemetry counter when parent clicks PDF.</td>
                        <td className="p-3 text-slate-400 font-mono">URL param (:id)</td>
                      </tr>
                      <tr className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-blue-400">POST</td>
                        <td className="p-3 font-mono text-white">/api/lesson-notes/:id/feedback</td>
                        <td className="p-3 text-slate-400">Submits an inquiry from parent/student directly to teacher.</td>
                        <td className="p-3 text-slate-400 font-mono">JSON (parentName, question, phone)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 7: Core Algorithmic & Computation Engines */}
            <section id="section-engines" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Workflow className="h-4 w-4" /> Section 7
              </div>
              <h2 className="text-2xl font-black text-white">Core Business Logic & Algorithmic Engines</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-5">
                
                {/* 1. Grading Algorithm */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    1. 40% CA + 60% Exam Grading Computation Engine (/src/utils/grading.ts)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The statutory Nigerian assessment algorithm computes Continuous Assessment across 4 distinct pillars (max 40) plus Terminal Exam (max 60):
                  </p>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">Total Score</span> = CA1 (10) + CA2 (10) + Assignment (10) + Attendance (10) + Exam (60) = <span className="text-white font-bold">100 Max</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800"><span className="text-emerald-400 font-bold">75 - 100%:</span> A1 (Distinction)</div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800"><span className="text-blue-400 font-bold">70 - 74%:</span> B2 (Very Good)</div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800"><span className="text-cyan-400 font-bold">65 - 69%:</span> B3 (Good)</div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800"><span className="text-amber-400 font-bold">50 - 64%:</span> C4-C6 (Credit)</div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800"><span className="text-orange-400 font-bold">45 - 49%:</span> D7 (Pass)</div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800"><span className="text-yellow-400 font-bold">40 - 44%:</span> E8 (Pass)</div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 col-span-2"><span className="text-rose-400 font-bold">0 - 39%:</span> F9 (Fail / Remedial Action)</div>
                  </div>
                </div>

                {/* 2. Dynamic Term Progress Scrubber */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    2. Dynamic Term Progress Engine (Week 1 to 13 Simulation)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Statewide governance portals recalculate syllabus coverage, Continuous Assessment completion rates, subvention execution, and attendance using a deterministic linear progression formula:
                  </p>
                  <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-teal-300">
{`// Dynamic metric scaling factor based on current week (1-13)
const progressFactor = Math.min(week / totalWeeks, 1.0);
const dynamicSyllabusCoverage = Math.round(baseCoverage * progressFactor);
const dynamicSubventionExecuted = Math.round(allocatedSubvention * (0.3 + 0.7 * progressFactor));`}
                  </pre>
                </div>

                {/* 3. Programmatic PDF Generation Engine */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    3. Document & PDF Generation Engine (/src/utils/pdfGenerator.ts)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Utilizes <code className="text-purple-300 font-mono">jsPDF</code> alongside standard CSS <code className="text-purple-300 font-mono">@media print</code> rules to output vector-quality student report cards, bursary payment receipts, lesson note guides, and official Governor Executive Memoranda.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8: UI/UX Design System & Tokens */}
            <section id="section-design" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" /> Section 8
              </div>
              <h2 className="text-2xl font-black text-white">Design Tokens, Typography & Anti-Slop Rules</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  The application enforces strict design discipline to ensure high legibility, clean visual rhythm, and zero visual clutter.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="h-4 w-full rounded bg-emerald-500"></div>
                    <span className="font-bold text-white block">State Governance</span>
                    <span className="text-[11px] text-slate-400">Emerald #10b981 &bull; SUBEB</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="h-4 w-full rounded bg-blue-600"></div>
                    <span className="font-bold text-white block">Academic Wing</span>
                    <span className="text-[11px] text-slate-400">Blue #2563eb &bull; Secondary</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="h-4 w-full rounded bg-amber-500"></div>
                    <span className="font-bold text-white block">Bursary & Finance</span>
                    <span className="text-[11px] text-slate-400">Amber #f59e0b &bull; Receipts</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <div className="h-4 w-full rounded bg-purple-600"></div>
                    <span className="font-bold text-white block">Administration</span>
                    <span className="text-[11px] text-slate-400">Purple #9333ea &bull; Organogram</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                  <span className="font-bold text-white block">Architectural Design Rules Enforced:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li><strong className="text-slate-200">Nested Radius Math:</strong> Inner Corner Radius = Outer Radius - Padding.</li>
                    <li><strong className="text-slate-200">No AI-Slop Clichés:</strong> No random purple-to-cyan dark mode glowing shadows. Crisp, high-contrast borders and mathematically spaced paddings.</li>
                    <li><strong className="text-slate-200">Touch Accessibility:</strong> All interactive buttons maintain a minimum 44px touch target on mobile viewports.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 9: Developer Onboarding & Setup */}
            <section id="section-onboarding" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Terminal className="h-4 w-4" /> Section 9
              </div>
              <h2 className="text-2xl font-black text-white">Developer Onboarding & Local Environment Setup</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  New developers can clone the repository, install dependencies, and have the full-stack server running in under 2 minutes.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Step 1: Install Dependencies</span>
                    <div className="flex items-center justify-between">
                      <code className="text-emerald-400">npm install</code>
                      <button onClick={() => handleCopy('npm install', 's1')} className="text-slate-400 hover:text-white cursor-pointer">
                        {copiedSnippet === 's1' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Step 2: Launch Full-Stack Dev Server (Express + Vite)</span>
                    <div className="flex items-center justify-between">
                      <code className="text-emerald-400">npm run dev</code>
                      <button onClick={() => handleCopy('npm run dev', 's2')} className="text-slate-400 hover:text-white cursor-pointer">
                        {copiedSnippet === 's2' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans">Boots Express backend and Vite middleware on port 3000.</p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Step 3: Run Static Type Verification & Linter</span>
                    <div className="flex items-center justify-between">
                      <code className="text-emerald-400">npm run lint</code>
                      <button onClick={() => handleCopy('npm run lint', 's3')} className="text-slate-400 hover:text-white cursor-pointer">
                        {copiedSnippet === 's3' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Step 4: Build for Production Deployment</span>
                    <div className="flex items-center justify-between">
                      <code className="text-emerald-400">npm run build</code>
                      <button onClick={() => handleCopy('npm run build', 's4')} className="text-slate-400 hover:text-white cursor-pointer">
                        {copiedSnippet === 's4' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans">Compiles Vite static assets to `dist/` and esbuild bundles `dist/server.cjs`.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 10: How to Extend the Codebase */}
            <section id="section-extending" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <GitBranch className="h-4 w-4" /> Section 10
              </div>
              <h2 className="text-2xl font-black text-white">How to Extend & Maintain the Codebase</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  Follow these proven patterns to add new features, pages, LGA schools, or endpoints safely:
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-white block text-sm">A. Adding a New Government School / LGA</span>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                      <li>Open <code className="text-emerald-400 font-mono">/src/data/benueStateData.ts</code>.</li>
                      <li>Find the corresponding LGA object (e.g. `Makurdi`, `Gboko`, `Otukpo`).</li>
                      <li>Add a new item to the <code className="text-emerald-400 font-mono">BENUE_GOV_SCHOOLS</code> array conforming to the <code className="text-emerald-400 font-mono">GovSchool</code> type.</li>
                      <li>Set <code className="text-emerald-400 font-mono">category</code> to Primary (`'LGEA Primary School (SUBEB)'`) or Secondary (`'Senior Secondary College'`).</li>
                      <li>All dropdown selectors across the app will automatically ingest and render the school.</li>
                    </ol>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-white block text-sm">B. Adding a New API Endpoint</span>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                      <li>Open <code className="text-emerald-400 font-mono">server.ts</code>.</li>
                      <li>Add your new route handler before the Vite middleware section (e.g. <code className="text-blue-400 font-mono">app.get('/api/your-endpoint', ...)</code>).</li>
                      <li>Test the route locally using <code className="text-blue-400 font-mono">fetch('/api/your-endpoint')</code> from client code.</li>
                    </ol>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-white block text-sm">C. Adding a New Navigation Page</span>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                      <li>Add the page string literal to <code className="text-purple-400 font-mono">NavigationPage</code> union in <code className="text-purple-400 font-mono">/src/types/index.ts</code>.</li>
                      <li>Create the page component in <code className="text-purple-400 font-mono">/src/pages/YourNewPage.tsx</code>.</li>
                      <li>Import and render it conditionally in <code className="text-purple-400 font-mono">/src/App.tsx</code>.</li>
                      <li>Add a navigation link in <code className="text-purple-400 font-mono">/src/components/Header.tsx</code> and <code className="text-purple-400 font-mono">/src/components/Footer.tsx</code>.</li>
                    </ol>
                  </div>
                </div>

                <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-800/60 text-xs text-emerald-200 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <strong className="block font-black text-white">Need Support or Code Architecture Clarifications?</strong>
                    <p className="text-slate-400 text-[11px]">
                      Created and engineered by Matthew Beeun (Bummptech Global Concepts). Reach out for architectural consultations.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate && onNavigate('about')}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer transition"
                  >
                    View Lead Architect
                  </button>
                </div>
              </div>
            </section>

            {/* Section 11: Passkey & Wing Gatekeeper Security */}
            <section id="section-security" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" /> Section 11
              </div>
              <h2 className="text-2xl font-black text-white">Role-Based Passkey & Wing Gatekeeper Security</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  BummptEducation employs cryptographic-style role-based passkeys to safeguard sensitive academic data, bursary records, and the Benue State Ministry of Education Command Portal.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-purple-300 block">Academic Wing Gatekeeper</span>
                    <p className="text-slate-400 text-[11px]">Enforces clearance before modifying Continuous Assessment (40/60) scores, submitting broadsheets, or locking terminal grades.</p>
                  </div>
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-amber-300 block">Bursary & Accounts Gatekeeper</span>
                    <p className="text-slate-400 text-[11px]">Guards financial ledgers, fee invoice generation, and state subvention grants from unauthorized manipulation.</p>
                  </div>
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-emerald-300 block">Benue MOE & SUBEB Gatekeeper</span>
                    <p className="text-slate-400 text-[11px]">Restricted to authorized executive state officials for statewide audits, teacher deployments, and dispatching live updates.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 12: Ministry Directives & Telemetry Ingestion */}
            <section id="section-directives" className="space-y-4 pt-6">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Landmark className="h-4 w-4" /> Section 12
              </div>
              <h2 className="text-2xl font-black text-white">Ministry Directives, Live HQ Chat & Telemetry Ingestion</h2>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <p className="text-sm text-slate-300">
                  Headquarters representatives and Heads of Schools communicate seamlessly through the two-way command hub, live school heads dispatch chat, and multi-session telemetry sync.
                </p>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                  <div className="font-bold text-white text-sm">Key Capabilities:</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li><strong className="text-slate-200">Live School Heads ↔ HQ Chat</strong>: Two-way communication for circular clarifications, teacher requests, facility emergencies, and statutory subvention queries.</li>
                    <li><strong className="text-slate-200">Direct Commissioner Escalation</strong>: School complaints can be escalated straight to the Executive Governor’s memorandum queue.</li>
                    <li><strong className="text-slate-200">Statewide Telemetry</strong>: Aggregates real-time continuous assessment scores, TRCN staff punctuality, and bursary subventions across all 23 Benue State LGAs.</li>
                  </ul>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
};
