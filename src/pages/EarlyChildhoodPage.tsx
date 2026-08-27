import React, { useState } from 'react';
import { 
  Baby, 
  Sparkles, 
  Award, 
  BookOpen, 
  Smile, 
  Heart, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Layers, 
  GraduationCap, 
  FileText, 
  CreditCard, 
  ExternalLink,
  ChevronRight,
  Sun,
  Activity,
  Palette,
  Music,
  Footprints,
  Info
} from 'lucide-react';
import { NavigationPage, Student, StudentReportCard } from '../types';

interface EarlyChildhoodPageProps {
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  onOpenReportCardModal?: (student: Student, reportCard: StudentReportCard) => void;
}

export const EarlyChildhoodPage: React.FC<EarlyChildhoodPageProps> = ({
  onNavigate,
  onOpenReportCardModal
}) => {
  const [selectedMilestoneDomain, setSelectedMilestoneDomain] = useState<string>('Communication & Phonics');
  const [interactiveSkillIndex, setInteractiveSkillIndex] = useState<number>(0);
  const [interactiveMastery, setInteractiveMastery] = useState<'Exceeding' | 'Proficient' | 'Developing' | 'Emerging'>('Exceeding');

  const navigateTo = (page: NavigationPage, subTab?: string, param?: any) => {
    if (onNavigate) {
      onNavigate(page, subTab, param);
    }
  };

  const handleLaunchSampleReportCard = () => {
    const sampleKgStudent: Student = {
      id: 'STU-KG-001',
      admissionNumber: 'BEDU/KG/2024/001',
      fullName: 'Tersoo Daniel Beeun',
      gender: 'Male',
      dateOfBirth: '2021-04-12',
      currentClass: 'KG 3',
      arm: 'kindergarten',
      house: 'Eagle House (Blue)',
      guardianName: 'Dr. Matthew Ternenge Beeun',
      guardianPhone: '+234 811 523 1834',
      guardianEmail: 'matthewbeeun@gmail.com',
      address: 'Akperan Orshi Avenue, Makurdi, Benue State',
      stateOfOrigin: 'Benue',
      dateEnrolled: '2024-09-08',
      status: 'Active',
    };

    const sampleKgReportCard: StudentReportCard = {
      id: 'RC-STU-KG-001-2nd Term',
      studentId: 'STU-KG-001',
      arm: 'kindergarten',
      classLevel: 'KG 3',
      term: '2nd Term',
      academicYear: '2025/2026',
      scores: [
        {
          studentId: 'STU-KG-001',
          subjectId: 'SUB-KG-PHO',
          classLevel: 'KG 3',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 10,
          ca2: 10,
          assignment: 10,
          attendance: 10,
          totalCa: 40,
          examScore: 56,
          totalScore: 96,
          grade: 'Exceeding',
          remark: 'Mastered letter sounds, 3-letter word blending & recitation',
        },
        {
          studentId: 'STU-KG-001',
          subjectId: 'SUB-KG-NUM',
          classLevel: 'KG 3',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 9,
          ca2: 10,
          assignment: 9,
          attendance: 10,
          totalCa: 38,
          examScore: 54,
          totalScore: 92,
          grade: 'Exceeding',
          remark: 'Counts 1-100 effortlessly, identifies 2D/3D geometric shapes',
        },
        {
          studentId: 'STU-KG-001',
          subjectId: 'SUB-KG-DIS',
          classLevel: 'KG 3',
          term: '2nd Term',
          academicYear: '2025/2026',
          ca1: 9,
          ca2: 9,
          assignment: 9,
          attendance: 9,
          totalCa: 36,
          examScore: 52,
          totalScore: 88,
          grade: 'Exceeding',
          remark: 'Curious explorer of nature, senses and plant life cycles',
        }
      ],
      earlyYearsMilestones: [
        {
          domain: 'Communication & Phonics',
          skill: 'Phonic Blending & Story Re-telling',
          mastery: 'Exceeding',
          ratingScore: 4,
          teacherComment: 'Reads short phonetic decodable texts with clear enunciation.',
        },
        {
          domain: 'Early Numeracy & Shapes',
          skill: 'Quantity Association & Pattern Sequences',
          mastery: 'Exceeding',
          ratingScore: 4,
          teacherComment: 'Demonstrates strong spatial reasoning and number sense.',
        },
        {
          domain: 'Physical & Fine Motor Skills',
          skill: 'Pencil Grip, Scissor Cutting & Lacing',
          mastery: 'Proficient',
          ratingScore: 3,
          teacherComment: 'Tripod grip well established; neat coloring within boundaries.',
        },
        {
          domain: 'Personal & Social Development',
          skill: 'Sharing, Empathy & Potty Independence',
          mastery: 'Exceeding',
          ratingScore: 4,
          teacherComment: 'Polite, considerate, and helps peers during circle cleanup.',
        }
      ],
      totalScoreObtained: 276,
      totalPossibleScore: 300,
      overallPercentage: 92.0,
      classAverage: 74.2,
      positionInClass: 1,
      totalStudentsInClass: 24,
      psychomotor: {
        punctuality: 5,
        neatness: 5,
        politeness: 5,
        honesty: 5,
        peerRelationship: 5,
        leadership: 5,
        handwriting: 4,
        sportsAndGames: 5,
        craftsAndPractical: 5,
        attentiveness: 5,
      },
      formTutorRemark: 'Tersoo is a radiant, highly inquisitive young learner with stellar phonic recognition and exceptional social warmth.',
      formTutorName: 'Miss Rita Nguveren Iorfa',
      principalRemark: 'Exemplary early childhood foundation. Confidently recommended for smooth transition to Primary (Basic 1).',
      principalName: 'Mrs. Abigail Folashade Balogun',
      principalTitle: 'Head of Early Childhood & Kindergarten',
      promotionalStatus: 'Ready for Primary Transition (Basic 1)',
      attendanceTotalDays: 60,
      attendancePresent: 59,
      nextTermBegins: '2026-05-04',
    };

    if (onOpenReportCardModal) {
      onOpenReportCardModal(sampleKgStudent, sampleKgReportCard);
    } else {
      navigateTo('academic', 'reports');
    }
  };

  const kgLevels = [
    {
      level: 'KG 1 (Early Playgroup & Sensory Nursery)',
      ageRange: 'Ages 2 – 3 Years',
      theme: 'Sensory Exploration, Speech Readiness & Social Play',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Gentle, nurturing immersion fostering potty independence, auditory sound discrimination, motor coordination, and joyful peer socialization.',
      milestones: ['Jolly Phonics Phase 1 Sounds', 'Tactile Sand & Water Tables', 'Color & Shape Sorting', 'Self-feeding & Hygiene Habits']
    },
    {
      level: 'KG 2 (Middle Kindergarten / Discovery Stage)',
      ageRange: 'Ages 3 – 4 Years',
      theme: 'Early Literacy, Numeracy Concepts & Fine Motor Control',
      badgeColor: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      description: 'Structured exploration building phonemic awareness, pre-writing tripod grips, number counting up to 30, and creative imaginative arts.',
      milestones: ['Letter Formation & Tracing', 'Counting & Quantity Matching 1-30', 'Simple Rhymes & Story Drama', 'Independent Dressing & Sharing']
    },
    {
      level: 'KG 3 (Transition / Pre-Primary Reception)',
      ageRange: 'Ages 4 – 5 Years',
      theme: 'Phonic Blending, Elementary Arithmetic & Basic 1 Readiness',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Rigorous yet joyful foundation ensuring seamless graduation into Primary Basic 1. Pupils master CVC reading words, simple addition/subtraction, and civic courtesy.',
      milestones: ['CVC Word Blending & Decodable Readers', 'Addition with Concrete Counters', 'Early Scientific Observation', 'Formal Basic 1 Readiness Certification']
    },
  ];

  const milestoneDomains = [
    {
      domain: 'Communication & Phonics',
      icon: Smile,
      skills: [
        'Auditory sound discrimination & Jolly Phonics Letter Sounds (s, a, t, i, p, n)',
        'CVC 3-letter word blending (cat, pin, sun) and early sight words',
        'Expressive vocabulary, sentence construction, and listening comprehension',
        'Rhyme recitation, phonemic alliteration, and imaginative story narration'
      ]
    },
    {
      domain: 'Early Numeracy & Shapes',
      icon: Sparkles,
      skills: [
        'Rote counting (1 to 100) and one-to-one quantity correspondence',
        'Identification of 2D and 3D geometric shapes (circle, cube, cylinder)',
        'Simple addition and subtraction using Montessori bead frames & counters',
        'Pattern sequence recognition, size ordering, and spatial measurement'
      ]
    },
    {
      domain: 'Physical & Fine Motor Skills',
      icon: Footprints,
      skills: [
        'Pencil grip refinement (mature dynamic tripod grasp) and line tracing',
        'Bilateral hand-eye coordination: bead threading, scissor safety & lacing',
        'Gross motor agility: hopping, balancing beam, soft-ball catching & dancing',
        'Body awareness, personal spatial boundary respect, and active outdoor play'
      ]
    },
    {
      domain: 'Personal, Social & Emotional',
      icon: Heart,
      skills: [
        'Potty independence, proper handwashing, and mealtime table etiquette',
        'Sharing toys, taking turns, peer empathy, and resolving minor play conflicts',
        'Emotional self-regulation, following circle-time multi-step instructions',
        'Confidence in expressing needs, curiosity, and respect for caregivers'
      ]
    },
  ];

  const educators = [
    {
      name: 'Mrs. Abigail Folashade Balogun',
      role: 'Head of Early Childhood & Kindergarten Wing (Sub-Head)',
      qualifications: 'M.Ed Early Childhood Education, Montessori Certified Lead, B.Ed Guidance & Counseling',
      email: 'head.kindergarten@bummpteducation.edu.ng',
      experience: '14+ Years in Early Years Pedagogical Leadership'
    },
    {
      name: 'Miss Rita Nguveren Iorfa',
      role: 'Lead Educator (KG 3 - Pre-Primary Transition Class)',
      qualifications: 'B.Ed Early Childhood Care & Education, TRCN Certified',
      email: 'r.iorfa@bummpteducation.edu.ng',
      experience: '7+ Years in Phonics & Primary Readiness'
    },
    {
      name: 'Mrs. Comfort Chisom Eze',
      role: 'Early Years Phonics & Sensory Facilitator (KG 1 & 2)',
      qualifications: 'NCE Early Childhood Education, B.A. (Ed) English',
      email: 'c.eze@bummpteducation.edu.ng',
      experience: '6+ Years in Toddler Sensory Guidance'
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10" id="early-childhood-page-root">
      {/* Breadcrumb / Top Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
          <Baby className="h-4 w-4" />
          <span>Educational Wing 1: Early Childhood & Kindergarten Arm (KG 1 – 3)</span>
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
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-10 border border-purple-800/40 shadow-xl">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-900/80 px-3 py-1 text-xs font-bold text-purple-200 border border-purple-700">
              <Sun className="h-3.5 w-3.5 text-amber-300" />
              <span>Montessori Foundation • Jolly Phonics • Sensory Mastery</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Early Childhood & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300">Kindergarten Arm</span> (KG 1 – 3)
            </h1>

            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed max-w-3xl">
              Operating under central executive governance (General Administrator: <strong>Dr. Matthew Ternenge Beeun</strong>), the Early Childhood Arm is headed by <strong>Mrs. Abigail Folashade Balogun</strong>. We nurture foundational curiosity, phonics articulation, early mathematical confidence, sensory exploration, and emotional resilience in children ages 2 to 5.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigateTo('lesson-notes')}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition cursor-pointer"
              >
                <FileText className="h-4 w-4 text-indigo-200" />
                <span>Download KG Lesson Notes (PDF)</span>
              </button>

              <button
                onClick={handleLaunchSampleReportCard}
                id="view-kg-sample-report-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-purple-500 transition cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>View Live KG 3 Milestone Report Card</span>
              </button>

              <button
                onClick={() => navigateTo('academic', 'scoresheet')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-purple-200 hover:bg-slate-700 transition border border-purple-700/50 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-purple-400" />
                <span>Kindergarten Scoresheet</span>
              </button>

              <button
                onClick={() => navigateTo('admin', 'fees')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer"
              >
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span>KG Fee Schedule</span>
              </button>
            </div>
          </div>

          {/* Quick Sub-Head Card */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-purple-900/40 p-5 border border-purple-500/30 backdrop-blur-sm space-y-3">
              <div className="flex items-center gap-3 border-b border-purple-500/20 pb-3">
                <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                  AB
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-purple-300 font-bold block">Sub-Head Officer</span>
                  <h3 className="text-sm font-bold text-white">Mrs. Abigail Balogun</h3>
                  <p className="text-[11px] text-purple-200">Head of Early Childhood Wing</p>
                </div>
              </div>

              <div className="text-[11px] text-purple-200 space-y-1.5 leading-tight">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reporting Line:</span>
                  <strong className="text-white">General Administrator</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Grading Scale:</span>
                  <strong className="text-amber-300">Milestone Rubric (4 Levels)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Class Scope:</span>
                  <strong className="text-white">KG 1 • KG 2 • KG 3</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Age:</span>
                  <strong className="text-white">2.0 – 5.5 Years</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Class Progression Levels: KG 1, KG 2, KG 3 */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Kindergarten Class Progression & Age Levels
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Carefully stratified developmental stages designed to support seamless growth into Basic 1 primary education.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kgLevels.map((lvl, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${lvl.badgeColor}`}>
                    {lvl.ageRange}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">Stage {index + 1}</span>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900">{lvl.level}</h3>
                <p className="text-xs text-purple-700 font-semibold">{lvl.theme}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{lvl.description}</p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Key Target Milestones:</h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {lvl.milestones.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiated Early Learning Milestone Scale */}
      <section className="rounded-3xl bg-purple-50/70 p-6 sm:p-8 border border-purple-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-800 uppercase tracking-wider">
              <Award className="h-4 w-4 text-purple-600" />
              <span>Assessment Architecture</span>
            </div>
            <h2 className="text-xl font-black text-purple-950 mt-0.5">
              The 4-Tier Early Learning Milestone Rubric
            </h2>
          </div>
          <button
            onClick={() => navigateTo('docs', 'grading')}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Compare with Primary & Secondary Scales</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="text-xs text-slate-700 max-w-3xl leading-relaxed">
          Rather than rigid numerical failure metrics, kindergarten progress is evaluated through observational psychomotor, cognitive, and social-emotional milestone indicators:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-purple-300 shadow-xs space-y-2">
            <span className="inline-block px-2.5 py-1 rounded bg-purple-600 text-white font-extrabold text-xs">
              Exceeding (85 - 100%)
            </span>
            <h4 className="font-bold text-xs text-slate-900">Advanced Milestone Mastery</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Consistently demonstrates independent skill application, mentors peers, and extends phonic/numerical concepts beyond age expectation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-xs space-y-2">
            <span className="inline-block px-2.5 py-1 rounded bg-emerald-600 text-white font-extrabold text-xs">
              Proficient (70 - 84%)
            </span>
            <h4 className="font-bold text-xs text-slate-900">Expected Standard Met</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Regularly performs target developmental skills with minimal educator prompt. Solid grip, clear articulation, and steady counting.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-300 shadow-xs space-y-2">
            <span className="inline-block px-2.5 py-1 rounded bg-amber-500 text-white font-extrabold text-xs">
              Developing (50 - 69%)
            </span>
            <h4 className="font-bold text-xs text-slate-900">Emergent Skill Acquisition</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Gaining confidence; demonstrates the skill under direct teacher scaffolding and hands-on tactile demonstrations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-rose-300 shadow-xs space-y-2">
            <span className="inline-block px-2.5 py-1 rounded bg-rose-500 text-white font-extrabold text-xs">
              Emerging (0 - 49%)
            </span>
            <h4 className="font-bold text-xs text-slate-900">Introductory Guidance Needed</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Beginning phase of skill exploration. Receives targeted individualized sensory support and gentle reinforcement.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Milestone Domain Explorer */}
      <section className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 font-mono">Pedagogical Domains</span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Core Early Years Learning & Milestone Domains
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Click across the four domains below to inspect standard curricula and teacher assessment guidelines.
          </p>
        </div>

        {/* Domain Tabs */}
        <div className="flex flex-wrap gap-2">
          {milestoneDomains.map((d) => {
            const Icon = d.icon;
            const isSelected = selectedMilestoneDomain === d.domain;
            return (
              <button
                key={d.domain}
                onClick={() => setSelectedMilestoneDomain(d.domain)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{d.domain}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Domain Skills List */}
        {(() => {
          const currentDomain = milestoneDomains.find((d) => d.domain === selectedMilestoneDomain) || milestoneDomains[0];
          return (
            <div className="rounded-2xl bg-purple-50/50 p-6 border border-purple-200 space-y-4">
              <h3 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span>Curricular Competencies in {currentDomain.domain}:</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentDomain.skills.map((skill, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-purple-100 shadow-xs flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{skill}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Early Childhood Faculty & Care Team */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Dedicated Early Childhood Faculty & Care Team
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Trained in Montessori philosophy, British Early Years Foundation Stage (EYFS), and TRCN certification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {educators.map((edu, index) => (
            <div key={index} className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-600 uppercase block">{edu.role}</span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">{edu.name}</h3>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong>Qualifications:</strong> {edu.qualifications}
              </p>
              <div className="text-[11px] text-slate-500 space-y-1">
                <div><strong>Experience:</strong> {edu.experience}</div>
                <div><strong>Email:</strong> {edu.email}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Admissions & Screening Guidelines */}
      <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">Enrollment Protocol</span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Kindergarten Admission & Developmental Screening
            </h2>
          </div>
          <button
            onClick={() => navigateTo('admin', 'admissions')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition cursor-pointer self-start sm:self-auto"
          >
            <span>Open Admissions Portal</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <h4 className="font-bold text-purple-300">1. Age & Potty Screening</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Child must be at least 2.0 years for KG 1. Basic toilet-training readiness is assessed during the interactive play orientation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <h4 className="font-bold text-purple-300">2. Immunization & Health Bay</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Complete record of standard child vaccinations and allergies must be verified by the school clinic before start of term.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <h4 className="font-bold text-purple-300">3. Gentle Transition Camp</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              A 2-day parent-accompanied morning circle is hosted to ensure pupils adapt happily without separation anxiety.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Cross-Navigation Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 text-xs">
        <span className="font-bold text-slate-700">Explore Other Arms:</span>
        <div className="flex flex-wrap gap-2">
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
          <button
            onClick={() => navigateTo('student-leadership')}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
          >
            Student Leadership Councils →
          </button>
        </div>
      </div>
    </div>
  );
};
