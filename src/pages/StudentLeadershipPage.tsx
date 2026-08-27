import React, { useState } from 'react';
import { 
  Users, 
  Crown, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Trophy, 
  Flame, 
  Send, 
  MessageSquare, 
  BookOpen, 
  HeartHandshake, 
  Sparkles, 
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { NavigationPage } from '../types';

interface StudentLeadershipPageProps {
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
}

export const StudentLeadershipPage: React.FC<StudentLeadershipPageProps> = ({ onNavigate }) => {
  const [selectedCouncilTab, setSelectedCouncilTab] = useState<'senior' | 'primary' | 'houses'>('senior');
  const [suggestionName, setSuggestionName] = useState('');
  const [suggestionArm, setSuggestionArm] = useState<'Primary' | 'Secondary'>('Secondary');
  const [suggestionText, setSuggestionText] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);

  const navigateTo = (page: NavigationPage, subTab?: string, param?: any) => {
    if (onNavigate) {
      onNavigate(page, subTab, param);
    }
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;
    setSubmittedFeedback(true);
  };

  const seniorPrefects = [
    {
      title: 'Senior Prefect / Head Girl',
      name: 'Dooshima Matthew Beeun',
      class: 'SSS 2 Science',
      house: 'Eagle House (Blue)',
      portfolio: 'Apex student representative, liaison between student body and General Administrator, speaker of the Student Assembly.',
      badge: 'Executive Apex'
    },
    {
      title: 'Head Boy',
      name: 'Emmanuel Terkula Agbo',
      class: 'SSS 2 Science',
      house: 'Falcon House (Red)',
      portfolio: 'Chief pupil disciplinary coordinator, morning assembly parade commander, and student welfare advocate.',
      badge: 'Executive Apex'
    },
    {
      title: 'Academic & Peer-Tutor Prefect',
      name: 'Amina Bello',
      class: 'SSS 2 Science',
      house: 'Falcon House (Red)',
      portfolio: 'Directs peer study circles, evening prep study clinics, Science & Math Olympiad study clubs.',
      badge: 'Academic Wing'
    },
    {
      title: 'Library & Research Prefect',
      name: 'Chinedu Obi',
      class: 'SSS 2 Arts',
      house: 'Cheetah House (Green)',
      portfolio: 'Maintains decorum in the Senior Library Commons, e-library resource access, and book circulation audits.',
      badge: 'Academic Wing'
    },
    {
      title: 'Health, Sanitation & Clinic Prefect',
      name: 'Kator Shima',
      class: 'SSS 2 Commercial',
      house: 'Lion House (Yellow)',
      portfolio: 'Oversees campus hygiene inspection, handwashing stations, clinic escorts, and dormitory sanitation.',
      badge: 'Welfare & Health'
    },
    {
      title: 'Sports & Athletics Captain',
      name: 'Favour Adebayo',
      class: 'SSS 2 Science',
      house: 'Eagle House (Blue)',
      portfolio: 'Coordinates Inter-House Athletics, football tournaments, basketball league, and physical fitness conditioning.',
      badge: 'Sports'
    },
    {
      title: 'Social, Culture & Welfare Prefect',
      name: 'Precious Ene',
      class: 'SSS 2 Commercial',
      house: 'Cheetah House (Green)',
      portfolio: 'Organizes cultural day fiestas, spelling bee debates, drama club festivals, and boarding welfare.',
      badge: 'Social'
    },
    {
      title: 'Labor & Campus Discipline Prefect',
      name: 'Paul Terfa',
      class: 'SSS 2 Science',
      house: 'Lion House (Yellow)',
      portfolio: 'Supervises compound beautification, environmental sustainability, recycling drives, and hall order.',
      badge: 'Discipline'
    }
  ];

  const primaryPupilLeaders = [
    {
      title: 'Primary Pupil Head Girl',
      name: 'Miss Emmanuella Chidera Okafor',
      class: 'Basic 6',
      house: 'Falcon House (Red)',
      portfolio: 'Leads Primary Morning Circle, Junior National Anthem recitation, and monitors pupil kindness & decorum.'
    },
    {
      title: 'Primary Pupil Head Boy',
      name: 'Master Kenechukwu Okafor',
      class: 'Basic 6',
      house: 'Eagle House (Blue)',
      portfolio: 'Coordinates Primary playground safety, line-up orderly transitions, and junior peer assistance.'
    },
    {
      title: 'Junior Spelling & Literacy Ambassador',
      name: 'Tersoo Daniel Beeun',
      class: 'KG 3 / Basic Transition',
      house: 'Eagle House (Blue)',
      portfolio: 'Kindergarten & Early Primary transition model, phonics recital lead, and junior library helper.'
    },
    {
      title: 'Junior Environmental Monitor',
      name: 'Fatima Musa',
      class: 'Basic 5',
      house: 'Cheetah House (Green)',
      portfolio: 'Maintains classroom neatness, flowerbed care, and junior recycling awareness across Basic 1-6.'
    }
  ];

  const houseChampionships = [
    {
      name: 'Eagle House',
      color: 'Blue',
      motto: 'Soaring with Intellectual Rigor',
      points: 1420,
      rank: 1,
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      badge: 'bg-blue-600 text-white',
      captain: 'Favour Adebayo & Dooshima Beeun'
    },
    {
      name: 'Falcon House',
      color: 'Red',
      motto: 'Courage, Precision & Honor',
      points: 1385,
      rank: 2,
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      badge: 'bg-rose-600 text-white',
      captain: 'Emmanuel Agbo & Amina Bello'
    },
    {
      name: 'Cheetah House',
      color: 'Green',
      motto: 'Speed, Agility & Team Spirit',
      points: 1340,
      rank: 3,
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      badge: 'bg-emerald-600 text-white',
      captain: 'Chinedu Obi & Precious Ene'
    },
    {
      name: 'Lion House',
      color: 'Yellow / Amber',
      motto: 'Valour, Fortitude & Leadership',
      points: 1290,
      rank: 4,
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      badge: 'bg-amber-600 text-white',
      captain: 'Paul Terfa & Kator Shima'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10" id="student-leadership-page-root">
      {/* Breadcrumb / Top Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
          <Crown className="h-4 w-4 text-amber-500" />
          <span>Governance & Student Voice: Student & Pupil Leadership Councils</span>
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-8 sm:p-10 border border-indigo-800/40 shadow-xl">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-900/80 px-3 py-1 text-xs font-bold text-indigo-200 border border-indigo-700">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Democratic Representation • Peer Mentorship • Character Excellence</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Student & Pupil <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-indigo-200 to-purple-200">Leadership Councils</span>
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed max-w-3xl">
              Operating across Kindergarten, Primary (Basic 1–6), and Secondary (JSS 1–SSS 3), the Student & Pupil Leadership Councils empower learners with responsibility, peer advocacy, civic integrity, and collaborative governance under the guidance of the General Administrator and Sub-Heads.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedCouncilTab('senior')}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition cursor-pointer"
              >
                <Users className="h-4 w-4" />
                <span>Senior College Prefect Roster</span>
              </button>

              <button
                onClick={() => setSelectedCouncilTab('primary')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-indigo-200 hover:bg-slate-700 transition border border-indigo-700/50 cursor-pointer"
              >
                <Award className="h-4 w-4 text-emerald-400" />
                <span>Primary Pupil Council</span>
              </button>

              <button
                onClick={() => setSelectedCouncilTab('houses')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
              >
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Inter-House Championship</span>
              </button>
            </div>
          </div>

          {/* Quick Leadership Card */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-indigo-900/40 p-5 border border-indigo-500/30 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-3 border-b border-indigo-500/20 pb-3">
                <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
                  👑
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-indigo-300 font-bold block">Senior Prefect Apex</span>
                  <h3 className="text-sm font-bold text-white">Dooshima Matthew Beeun</h3>
                  <p className="text-[11px] text-indigo-200">Head Girl & Council President</p>
                </div>
              </div>

              <div className="text-[11px] text-indigo-200 space-y-1.5 leading-tight">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Head Boy:</span>
                  <strong className="text-white">Emmanuel Terkula Agbo</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Primary Head Girl:</span>
                  <strong className="text-amber-300">Miss Emmanuella Chidera</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Primary Head Boy:</span>
                  <strong className="text-amber-300">Master Kenechukwu Okafor</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bi-Weekly Forum:</span>
                  <strong className="text-emerald-300">With General Administrator</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Navigation Tabs for Councils */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSelectedCouncilTab('senior')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedCouncilTab === 'senior'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Crown className="h-4 w-4" />
          <span>Senior College Prefect Council (Secondary)</span>
        </button>

        <button
          onClick={() => setSelectedCouncilTab('primary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedCouncilTab === 'primary'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Primary Pupil Leadership Council (Basic 1–6)</span>
        </button>

        <button
          onClick={() => setSelectedCouncilTab('houses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedCouncilTab === 'houses'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Inter-House Championship League</span>
        </button>
      </div>

      {/* Tab 1: Senior Prefect Roster */}
      {selectedCouncilTab === 'senior' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Senior College Prefects Council (2025/2026 Academic Session)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Vetted through competitive academic standing, peer elections, and faculty screening.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
              8 Specialized Portfolios
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {seniorPrefects.map((prefect, index) => (
              <div
                key={index}
                className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      {prefect.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{prefect.class}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900">{prefect.title}</h3>
                  <p className="text-xs font-bold text-indigo-600">{prefect.name}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {prefect.portfolio}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>House:</span>
                  <strong className="text-slate-800">{prefect.house}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 2: Primary Pupil Council */}
      {selectedCouncilTab === 'primary' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Primary Pupil Leadership Council (Basic 1 to Basic 6)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Cultivating early responsibility, classroom assistance, and positive peer influence.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              Basic Education Leaders
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {primaryPupilLeaders.map((pupil, index) => (
              <div
                key={index}
                className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Primary Wing
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{pupil.class}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900">{pupil.title}</h3>
                  <p className="text-xs font-bold text-emerald-700">{pupil.name}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {pupil.portfolio}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>House:</span>
                  <strong className="text-slate-800">{pupil.house}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: House Championship */}
      {selectedCouncilTab === 'houses' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Annual Inter-House Championship Standings
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Encompassing Kindergarten, Primary, and Secondary athletic, academic, debate, and disciplinary points.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
              Live House Points
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {houseChampionships.map((house) => (
              <div
                key={house.name}
                className={`rounded-2xl p-5 border shadow-xs space-y-4 flex flex-col justify-between ${house.bg}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${house.badge}`}>
                      Rank #{house.rank}
                    </span>
                    <span className="text-xs font-bold opacity-80">{house.color}</span>
                  </div>

                  <h3 className="font-extrabold text-base">{house.name}</h3>
                  <p className="text-xs italic opacity-90 leading-relaxed">"{house.motto}"</p>
                  
                  <div className="pt-2">
                    <div className="text-2xl font-black">{house.points.toLocaleString()} pts</div>
                    <p className="text-[10px] opacity-75">Cumulative Academic & Athletic Points</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900/10 text-[11px]">
                  <span className="block text-[10px] uppercase font-bold opacity-75">House Captains:</span>
                  <strong>{house.captain}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Leadership Charter & Principles */}
      <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">Institutional Mandate</span>
          <h2 className="text-xl font-bold text-white mt-0.5">
            Prefect Governance Charter & Leadership Oath
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <ShieldCheck className="h-4 w-4" />
              <h4>1. Servant Leadership & Empathy</h4>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Prefects are guardians of pupil welfare, leading through humility, listening to peer grievances, and resolving issues without intimidation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Award className="h-4 w-4" />
              <h4>2. Academic Exemplarity</h4>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Every council member maintains a minimum terminal average of 75% (A1/B2 credit standard) to model scholarly discipline.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <Calendar className="h-4 w-4" />
              <h4>3. Bi-Weekly Management Consultations</h4>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Direct parliamentary sessions with the General Administrator and Sub-Heads every 2nd and 4th Friday to review student proposals.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Student & Pupil Suggestion Box */}
      <section className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700">
            <MessageSquare className="h-4 w-4" />
            <span>Interactive Student Senate Portal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Submit a Proposal or Feedback to the Prefect Council
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            All pupils and students can submit constructive suggestions regarding library hours, cafeteria menus, sporting leagues, and academic prep clinics.
          </p>
        </div>

        {submittedFeedback ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="font-bold text-emerald-900 text-sm">Feedback Successfully Transmitted to Council!</h3>
            <p className="text-xs text-emerald-700 max-w-lg mx-auto leading-relaxed">
              Your suggestion has been logged in the Prefect Council docket and will be deliberated during the upcoming bi-weekly management session with the General Administrator.
            </p>
            <button
              onClick={() => {
                setSubmittedFeedback(false);
                setSuggestionText('');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-600 transition cursor-pointer"
            >
              Submit Another Suggestion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSuggestionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name & Class (Optional for Anonymous):
                </label>
                <input
                  type="text"
                  value={suggestionName}
                  onChange={(e) => setSuggestionName(e.target.value)}
                  placeholder="e.g. Samuel Audu (SSS 1 Science) or Leave Blank"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Educational Arm / Wing:
                </label>
                <select
                  value={suggestionArm}
                  onChange={(e) => setSuggestionArm(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Secondary">Secondary College (JSS 1 - SSS 3)</option>
                  <option value="Primary">Primary School (Basic 1 - 6)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Suggestion, Petition or Inquiry:
              </label>
              <textarea
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="Type your suggestion regarding academic clubs, facilities, cafeteria, or student activities..."
                rows={3}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Transmit Suggestion to Council</span>
            </button>
          </form>
        )}
      </section>

      {/* Bottom Cross-Navigation Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 text-xs">
        <span className="font-bold text-slate-700">Explore Educational Arms:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigateTo('kindergarten-arm')}
            className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
          >
            Kindergarten Arm (KG 1 - 3) →
          </button>
          <button
            onClick={() => navigateTo('primary-arm')}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
          >
            Primary School Arm (Basic 1 - 6) →
          </button>
          <button
            onClick={() => navigateTo('secondary-arm')}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
          >
            Secondary College Arm (JSS - SSS) →
          </button>
        </div>
      </div>
    </div>
  );
};
