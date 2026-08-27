import React, { useState } from 'react';
import { ORGANOGRAM_DATA } from '../data/mockData';
import { OrganogramNode, NavigationPage } from '../types';
import { 
  GitFork, 
  ShieldCheck, 
  GraduationCap, 
  Building2, 
  Users, 
  Crown, 
  ChevronRight, 
  Award, 
  CheckCircle2, 
  Briefcase, 
  Baby, 
  BookOpen, 
  School, 
  Layers, 
  ArrowDown,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface OrganogramPageProps {
  onNavigate?: (page: NavigationPage) => void;
}

export const OrganogramPage: React.FC<OrganogramPageProps> = ({ onNavigate }) => {
  const [selectedNode, setSelectedNode] = useState<OrganogramNode>(ORGANOGRAM_DATA[0]);

  const navigateTo = (page: NavigationPage) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const wings = [
    { 
      id: 'Executive', 
      label: 'Central Executive Governance & General Administration', 
      icon: Crown, 
      color: 'text-amber-500 bg-amber-50 border-amber-200',
      page: 'about' as NavigationPage
    },
    { 
      id: 'Early Childhood Wing', 
      label: 'Early Childhood & Kindergarten Arm (KG 1 - 3)', 
      icon: Baby, 
      color: 'text-purple-500 bg-purple-50 border-purple-200',
      page: 'kindergarten-arm' as NavigationPage
    },
    { 
      id: 'Primary School Wing', 
      label: 'Primary School / Basic Education Arm (Basic 1 - 6)', 
      icon: BookOpen, 
      color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
      page: 'primary-arm' as NavigationPage
    },
    { 
      id: 'Secondary College Wing', 
      label: 'Secondary College Arm (JSS 1 - SSS 3)', 
      icon: School, 
      color: 'text-blue-500 bg-blue-50 border-blue-200',
      page: 'secondary-arm' as NavigationPage
    },
    { 
      id: 'Student Leadership', 
      label: 'Student & Pupil Leadership Councils', 
      icon: Users, 
      color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
      page: 'student-leadership' as NavigationPage
    },
  ];

  const getPageForArm = (arm?: string): NavigationPage | null => {
    if (arm === 'kindergarten') return 'kindergarten-arm';
    if (arm === 'primary') return 'primary-arm';
    if (arm === 'secondary') return 'secondary-arm';
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="organogram-page-root">
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
          <GitFork className="h-3.5 w-3.5" />
          <span>Integrated Multi-Arm Educational Organogram</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Institutional Governance & Multi-Wing Leadership Hierarchy
        </h1>
        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed mt-1">
          Our unified school system incorporates three distinct pedagogical arms—Kindergarten (KG 1–3), Primary (Basic 1–6), and Secondary (JSS 1–SSS 3)—governed through the Central General Administrator with autonomous sub-heads.
        </p>
      </div>

      {/* Visual Hierarchy Flow Chart Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">Central Governance Architecture</span>
          <h2 className="text-xl font-bold">Unified School System Administrative Nexus</h2>
          <p className="text-xs text-slate-400">Single governing apex supervising three specialized educational arms</p>
        </div>

        {/* Top Node: Board & General Admin */}
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-slate-800 rounded-2xl border border-amber-400/40 text-center max-w-md w-full shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Central Apex</span>
            <h3 className="font-extrabold text-sm text-white">Board of Governors & General Administrator</h3>
            <p className="text-xs text-slate-300">Dr. Matthew Ternenge Beeun (General Administrator)</p>
            <button
              onClick={() => navigateTo('about')}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition cursor-pointer"
            >
              <span>View Executive Profile</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <ArrowDown className="h-5 w-5 text-slate-500 animate-bounce" />

          {/* Three Arms Branches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Wing 1: Kindergarten */}
            <div className="p-4 rounded-2xl bg-purple-950/60 border border-purple-600/40 space-y-2 text-center flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-900 text-purple-200 inline-block">
                  Kindergarten Arm (KG 1-3)
                </span>
                <h4 className="font-bold text-xs text-white">Sub-Head: Mrs. Abigail Balogun</h4>
                <p className="text-[11px] text-purple-200">Head of Early Childhood</p>
                <div className="pt-2 border-t border-purple-800/60 text-[10px] text-slate-300">
                  Montessori, Phonics, Sensory Discovery & Early Numeracy
                </div>
              </div>
              <button
                onClick={() => navigateTo('kindergarten-arm')}
                id="organogram-open-kg-page-btn"
                className="w-full mt-3 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Open Kindergarten Page</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Wing 2: Primary */}
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600/40 space-y-2 text-center flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 inline-block">
                  Primary School Arm (Basic 1-6)
                </span>
                <h4 className="font-bold text-xs text-white">Sub-Head: Mrs. Grace Iveren Shima</h4>
                <p className="text-[11px] text-emerald-200">Headmistress Basic Education</p>
                <div className="pt-2 border-t border-emerald-800/60 text-[10px] text-slate-300">
                  UBE Curriculum, STEM Labs, Reasoning & NCEE Lead
                </div>
              </div>
              <button
                onClick={() => navigateTo('primary-arm')}
                id="organogram-open-pri-page-btn"
                className="w-full mt-3 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Open Primary School Page</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Wing 3: Secondary */}
            <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-600/40 space-y-2 text-center flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-900 text-blue-200 inline-block">
                  Secondary College Arm (JSS 1 - SSS 3)
                </span>
                <h4 className="font-bold text-xs text-white">Sub-Head: Dr. (Mrs.) Grace Nkechi Okafor</h4>
                <p className="text-[11px] text-blue-200">Principal (Ph.D)</p>
                <div className="pt-2 border-t border-blue-800/60 text-[10px] text-slate-300">
                  WAEC, NECO, Cambridge IGCSE, SAT & JAMB Center
                </div>
              </div>
              <button
                onClick={() => navigateTo('secondary-arm')}
                id="organogram-open-sec-page-btn"
                className="w-full mt-3 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Open Secondary College Page</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Student & Pupil Leadership Councils Banner */}
          <div className="w-full pt-2">
            <button
              onClick={() => navigateTo('student-leadership')}
              className="w-full p-3 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 hover:bg-indigo-900/80 transition flex items-center justify-between px-5 cursor-pointer"
            >
              <div className="flex items-center gap-2 text-left">
                <Users className="h-4 w-4 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Student and Pupil Leadership Councils</h4>
                  <p className="text-[11px] text-indigo-200">Senior Prefect Council, Primary Pupil Monitors & House Captains</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <span>View Leadership Charter</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Hierarchy Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Interactive Tree & Wing List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {wings.map((w) => {
            const WingIcon = w.icon;
            const nodesInWing = ORGANOGRAM_DATA.filter((n) => n.wing === w.id);

            return (
              <div key={w.id} className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WingIcon className="h-4 w-4 text-slate-700" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">{w.label}</h3>
                  </div>
                  {w.page && (
                    <button
                      onClick={() => navigateTo(w.page)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Dedicated Page</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  {nodesInWing.map((node) => {
                    const isSelected = selectedNode.id === node.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between group cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-300 shadow-xs ring-1 ring-blue-400'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                              {node.title}
                            </span>
                            {node.reportsTo && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ➔ Reports to: {node.reportsTo}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">{node.holderName}</p>
                        </div>
                        <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail Card for Selected Role (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl bg-white border border-slate-200 shadow-lg p-6 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-100 text-blue-800">
                {selectedNode.wing}
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-2">{selectedNode.title}</h2>
              <p className="text-xs font-semibold text-blue-700">{selectedNode.holderName}</p>
              {selectedNode.reportsTo && (
                <p className="text-xs text-slate-500 mt-1">
                  <strong>Direct Reporting Line:</strong> {selectedNode.reportsTo}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Institutional Mandate:
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {selectedNode.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Primary Operational Responsibilities:
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {selectedNode.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct Page Link If Applicable */}
            {(() => {
              const armPage = getPageForArm(selectedNode.arm);
              if (armPage) {
                return (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => navigateTo(armPage)}
                      className="w-full py-2 px-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs hover:bg-blue-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Open {selectedNode.arm ? selectedNode.arm.toUpperCase() : ''} Educational Arm Page</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* Multi-Arm Governance Matrix Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
          Multi-Arm Accountability & Sub-Head Coordination Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-white font-bold text-left">
                <th className="p-3 border-b border-slate-700">Arm / Educational Wing</th>
                <th className="p-3 border-b border-slate-700">Sub-Head Officer</th>
                <th className="p-3 border-b border-slate-700">Reporting Line</th>
                <th className="p-3 border-b border-slate-700">Core Academic Standard & Exams</th>
                <th className="p-3 border-b border-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold text-purple-900">Kindergarten (KG 1 - 3)</td>
                <td className="p-3 font-semibold text-slate-800">Mrs. Abigail Folashade Balogun</td>
                <td className="p-3 text-slate-600">General Administrator</td>
                <td className="p-3 text-slate-600">Early Learning Milestones, Sensory Development, Phonics & Transition to Basic 1</td>
                <td className="p-3">
                  <button
                    onClick={() => navigateTo('kindergarten-arm')}
                    className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 font-bold text-[11px] hover:bg-purple-200 transition cursor-pointer"
                  >
                    View Page →
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold text-emerald-900">Primary School (Basic 1 - 6)</td>
                <td className="p-3 font-semibold text-slate-800">Mrs. Grace Iveren Shima</td>
                <td className="p-3 text-slate-600">General Administrator</td>
                <td className="p-3 text-slate-600">Universal Basic Education (UBE 1-6), Distinction Scale (A+ to F), National Common Entrance (NCEE)</td>
                <td className="p-3">
                  <button
                    onClick={() => navigateTo('primary-arm')}
                    className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] hover:bg-emerald-200 transition cursor-pointer"
                  >
                    View Page →
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold text-blue-900">Secondary College (JSS 1 - SSS 3)</td>
                <td className="p-3 font-semibold text-slate-800">Dr. (Mrs.) Grace Nkechi Okafor</td>
                <td className="p-3 text-slate-600">General Administrator</td>
                <td className="p-3 text-slate-600">BECE / Junior WAEC, WAEC WASSCE, NECO SSCE, Cambridge IGCSE, SAT & JAMB UTME</td>
                <td className="p-3">
                  <button
                    onClick={() => navigateTo('secondary-arm')}
                    className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-bold text-[11px] hover:bg-blue-200 transition cursor-pointer"
                  >
                    View Page →
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 bg-slate-50/60 font-bold">
                <td className="p-3 text-indigo-900">Student & Pupil Leadership Councils</td>
                <td className="p-3 text-slate-800">Dooshima Beeun (Senior Prefect) / Emmanuel Agbo (Head Boy)</td>
                <td className="p-3 text-slate-600">Principal & General Administrator</td>
                <td className="p-3 text-slate-600">Democratic Peer Governance, Assembly Roster, Inter-House Sports & Student Senate</td>
                <td className="p-3">
                  <button
                    onClick={() => navigateTo('student-leadership')}
                    className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-bold text-[11px] hover:bg-indigo-200 transition cursor-pointer"
                  >
                    View Page →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
