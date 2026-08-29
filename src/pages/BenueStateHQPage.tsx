import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Award, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Printer, 
  Download, 
  ChevronRight, 
  Sliders, 
  Layers, 
  Eye, 
  PhoneCall, 
  Mail, 
  Landmark, 
  Sparkles,
  School,
  ArrowRight,
  BarChart3,
  PieChart,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { 
  BenueLGA, 
  SenatorialZone, 
  GovSchool, 
  LGAMetadata,
  NavigationPage
} from '../types';
import { 
  BENUE_LGAS_METADATA, 
  BENUE_GOVERNMENT_SCHOOLS, 
  getStatewideAggregateKPIs, 
  getSchoolsByLGA, 
  getLgaMetadata,
  simulateTermWeekProgress
} from '../data/benueStateData';
import { WingAccessGatekeeper } from '../components/WingAccessGatekeeper';
import { AccessManagementModal } from '../components/AccessManagementModal';
import { MinistryUpdatesCommand } from '../components/MinistryUpdatesCommand';
import { 
  IssuedPasskey, 
  getStoredSession, 
  saveStoredSession 
} from '../utils/securityContext';

interface BenueStateHQPageProps {
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
  onSelectActiveSchool?: (school: GovSchool) => void;
}

export function BenueStateHQPage({ onNavigate, onSelectActiveSchool }: BenueStateHQPageProps) {
  // Security Authentication Check for Benue State Education Headquarters
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const session = getStoredSession();
    return !!session.isBenueHQUnlocked;
  });
  const [authenticatedPasskey, setAuthenticatedPasskey] = useState<IssuedPasskey | null>(null);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState<boolean>(false);
  const [schoolOverrides, setSchoolOverrides] = useState<Record<string, Partial<GovSchool>>>(() => {
    try {
      const saved = localStorage.getItem('benue_state_school_overrides_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Cross-Session Live Telemetry State (Real-time updates as other sessions operate)
  const [isLiveFeedOpen, setIsLiveFeedOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [telemetryCount, setTelemetryCount] = useState<number>(438);

  const [selectedZone, setSelectedZone] = useState<SenatorialZone | 'All'>('All');
  const [selectedLGA, setSelectedLGA] = useState<BenueLGA>('Makurdi');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('SCH-MKD-001');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeReviewTab, setActiveReviewTab] = useState<'teachers' | 'students' | 'finances' | 'governor-brief' | 'ministry-command'>('teachers');
  
  // Term Progression Simulator (Week 1 to 13)
  const [currentWeek, setCurrentWeek] = useState<number>(8);
  const [isGovernorBriefModalOpen, setIsGovernorBriefModalOpen] = useState<boolean>(false);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState<boolean>(false);
  const [schoolCategoryFilter, setSchoolCategoryFilter] = useState<string>('All');
  const [schoolSearchTerm, setSchoolSearchTerm] = useState<string>('');

  const handleUnlockSuccess = (passkey: IssuedPasskey) => {
    const sess = getStoredSession();
    saveStoredSession({ ...sess, isBenueHQUnlocked: true });
    setIsUnlocked(true);
    setAuthenticatedPasskey(passkey);
  };

  const handleLockHQPortal = () => {
    const sess = getStoredSession();
    saveStoredSession({ ...sess, isBenueHQUnlocked: false });
    setIsUnlocked(false);
    setAuthenticatedPasskey(null);
  };

  const handleSyncLiveSessions = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTelemetryCount(prev => prev + Math.floor(12 + Math.random() * 25));
    }, 1200);
  };

  const persistSchoolOverrides = (newOverrides: Record<string, Partial<GovSchool>>) => {
    setSchoolOverrides(newOverrides);
    try {
      localStorage.setItem('benue_state_school_overrides_v1', JSON.stringify(newOverrides));
    } catch (e) {
      console.error('Failed to save school overrides', e);
    }
  };

  const handleUpdateSchoolFinancials = (grantAmount: number, grantType: string, purpose: string) => {
    const current = schoolOverrides[selectedSchoolId] || {};
    const baseFin = baseSelectedSchool.financialStatement;
    const currentFin = current.financialStatement ? { ...baseFin, ...current.financialStatement } : baseFin;
    const newDisbursed = currentFin.stateSubventionDisbursed + grantAmount;
    const newRevenue = currentFin.totalRevenue + grantAmount;
    const newBalance = newRevenue - currentFin.totalExpenditure;

    const updated: Record<string, Partial<GovSchool>> = {
      ...schoolOverrides,
      [selectedSchoolId]: {
        ...current,
        financialStatement: {
          ...currentFin,
          stateSubventionDisbursed: newDisbursed,
          totalRevenue: newRevenue,
          netOperatingBalance: newBalance,
          specialGrantReceived: (currentFin.specialGrantReceived || 0) + grantAmount
        }
      }
    };
    persistSchoolOverrides(updated);
  };

  const handleDeployTeacher = (subject: string, teacherName: string, qualification: string) => {
    const current = schoolOverrides[selectedSchoolId] || {};
    const baseKPIs = baseSelectedSchool.teacherKPIs;
    const currentKPIs = current.teacherKPIs ? { ...baseKPIs, ...current.teacherKPIs } : baseKPIs;
    const newDeficits = currentKPIs.teacherDeficitSubjects.filter(
      (s: string) => !s.toLowerCase().includes(subject.toLowerCase()) && !subject.toLowerCase().includes(s.toLowerCase())
    );
    const newTotal = (current.totalTeachers ?? baseSelectedSchool.totalTeachers) + 1;
    const newTrcn = (current.trcnCertifiedTeachers ?? baseSelectedSchool.trcnCertifiedTeachers) + 1;
    const newRatio = `1:${Math.round(baseSelectedSchool.totalStudents / newTotal)}`;

    const updated: Record<string, Partial<GovSchool>> = {
      ...schoolOverrides,
      [selectedSchoolId]: {
        ...current,
        totalTeachers: newTotal,
        trcnCertifiedTeachers: newTrcn,
        teacherStudentRatio: newRatio,
        teacherKPIs: {
          ...currentKPIs,
          teacherDeficitSubjects: newDeficits,
          staffCommendationCount: (currentKPIs.staffCommendationCount || 0) + 1
        }
      }
    };
    persistSchoolOverrides(updated);
  };

  const handleUpdateAccreditation = (status: string, remarks: string) => {
    const current = schoolOverrides[selectedSchoolId] || {};
    const baseGov = baseSelectedSchool.governingBodyReview;
    const currentGov = current.governingBodyReview ? { ...baseGov, ...current.governingBodyReview } : baseGov;

    const updated: Record<string, Partial<GovSchool>> = {
      ...schoolOverrides,
      [selectedSchoolId]: {
        ...current,
        governingBodyReview: {
          ...currentGov,
          accreditationStatus: status,
          headquarterInspectionRemarks: remarks
        }
      }
    };
    persistSchoolOverrides(updated);
  };

  // Filter LGAs by zone
  const filteredLGAs = useMemo(() => {
    if (selectedZone === 'All') return BENUE_LGAS_METADATA;
    return BENUE_LGAS_METADATA.filter(l => l.zone === selectedZone);
  }, [selectedZone]);

  // Current LGA metadata
  const currentLgaMeta = useMemo(() => {
    return getLgaMetadata(selectedLGA) || BENUE_LGAS_METADATA[0];
  }, [selectedLGA]);

  // Schools for current LGA (or search across state)
  const lgaSchools = useMemo(() => {
    let schools = getSchoolsByLGA(selectedLGA);
    if (schools.length === 0) {
      // If mock data has primary template for that LGA, fallback gracefully
      schools = BENUE_GOVERNMENT_SCHOOLS.filter(s => s.lga === selectedLGA);
      if (schools.length === 0) {
        // Synthesize dynamic school representation for that LGA
        const synthesized: GovSchool = {
          id: `SCH-${selectedLGA.substring(0, 3).toUpperCase()}-001`,
          code: `BNS-${selectedLGA.substring(0, 3).toUpperCase()}-001`,
          name: `Government Secondary School ${selectedLGA}`,
          lga: selectedLGA,
          zone: currentLgaMeta.zone,
          category: 'Senior Secondary College',
          principalName: `Mr. Dennis Terver ${selectedLGA}`,
          vicePrincipalAcademic: 'Mrs. Judith Msugh',
          bursarName: 'Mr. Gabriel Iorpuu',
          phone: '+234 803 123 4567',
          email: `gss.${selectedLGA.toLowerCase().replace(/\s+/g, '')}@benue.gov.ng`,
          address: `${currentLgaMeta.headquarters} Secretariat Road, ${selectedLGA} LGA, Benue State`,
          establishedYear: 1983,
          totalStudents: Math.round(currentLgaMeta.totalStudentPopulation / currentLgaMeta.totalGovernmentSchools),
          maleStudents: Math.round(currentLgaMeta.totalStudentPopulation / currentLgaMeta.totalGovernmentSchools * 0.52),
          femaleStudents: Math.round(currentLgaMeta.totalStudentPopulation / currentLgaMeta.totalGovernmentSchools * 0.48),
          boardingStudents: Math.round(currentLgaMeta.totalStudentPopulation / currentLgaMeta.totalGovernmentSchools * 0.45),
          dayStudents: Math.round(currentLgaMeta.totalStudentPopulation / currentLgaMeta.totalGovernmentSchools * 0.55),
          specialNeedsStudents: 4,
          totalTeachers: Math.round(currentLgaMeta.totalTeacherCount / currentLgaMeta.totalGovernmentSchools),
          trcnCertifiedTeachers: Math.round(currentLgaMeta.totalTeacherCount / currentLgaMeta.totalGovernmentSchools * 0.9),
          nonAcademicStaff: 16,
          teacherStudentRatio: '1:26',
          totalClassrooms: 24,
          studentCapacityUtilization: 88,
          currentTermProgress: {
            week: 8,
            totalWeeks: 13,
            term: '2nd Term',
            academicYear: '2025/2026',
            lastUpdated: '2026-08-28 12:00:00'
          },
          teacherKPIs: {
            attendanceRate: 92.0,
            punctualityScore: 90.0,
            lessonNoteSubmissionRate: 94.0,
            curriculumCoverageRate: 79.0,
            trcnComplianceRate: 89.0,
            qualificationBreakdown: { nce: 6, bsc_bed: 28, msc_med: 5, phd: 0 },
            topPerformingDepartments: ['Science & Mathematics', 'Humanities'],
            teacherDeficitSubjects: ['Physics Teacher'],
            averageWeeklyWorkloadPeriods: 18,
            lastVettingDate: '2026-08-23',
            staffCommendationCount: 5,
            staffQueryCount: 1
          },
          studentKPIs: {
            overallPassRate: currentLgaMeta.averagePassRate,
            averageScore: 71.0,
            waecBenchmarkPassRate: currentLgaMeta.averagePassRate - 2,
            becePassRate: currentLgaMeta.averagePassRate + 4,
            attendanceRate: 93.0,
            dropoutRiskCount: 3,
            genderParityIndex: 0.92,
            gradeDistribution: { distinctions: 180, credits: 620, passes: 190, fails: 60 },
            scienceEnrollmentPercentage: 48.0,
            topPerformingSubjects: ['General Mathematics', 'Agricultural Science', 'Biology', 'Civic Education'],
            subjectsRequiringIntervention: ['Physics Practical', 'Further Mathematics'],
            scholarshipRecipientsCount: 20
          },
          financialStatement: {
            stateSubventionAllocated: 11000000,
            stateSubventionDisbursed: 11000000,
            ptaLevyTarget: 5200000,
            ptaLevyCollected: 4900000,
            examinationFeesRemitted: 3400000,
            specialGrantReceived: 2000000,
            instructionalMaterialsExp: 2200000,
            labConsumablesExp: 2000000,
            facilityMaintenanceExp: 1700000,
            utilitiesAndSecurityExp: 1300000,
            sportsAndCoCurricularExp: 650000,
            staffWelfareAndAllowances: 1100000,
            totalRevenue: 21500000,
            totalExpenditure: 17350000,
            netOperatingBalance: 4150000,
            financialAuditStatus: 'Cleared & Verified',
            lastAuditDate: '2026-08-12',
            auditorRemarks: 'Bursary accounts reconciled with standard compliance.',
            bursarName: 'Mr. Gabriel Iorpuu'
          },
          governingBodyReview: {
            stateRanking: 15,
            totalSchoolsInState: 115,
            lgaRanking: 1,
            totalSchoolsInLGA: currentLgaMeta.totalGovernmentSchools,
            accreditationStatus: 'Full State Accreditation',
            infrastructure: {
              classrooms: 4,
              scienceLabs: 4,
              ictCenter: 3,
              library: 4,
              sportsFacilities: 4,
              waterAndSanitation: 3,
              perimeterSecurity: 4,
              powerSupplyCondition: 'Solar Primary'
            },
            keyInterventionAlerts: [
              'Deploy 2 additional TRCN Science teachers',
              'Solar borehole water storage expansion'
            ],
            headquarterInspectionRemarks: `High standard learning environment in ${selectedLGA} LGA headquarters.`,
            governorBriefRecommendation: `Sustain state subventions and approve lab reagents batch for ${selectedLGA}.`,
            governorPriorityFlag: 'Normal Operations',
            lastHqInspectionDate: '2026-08-18',
            zonalInspectorName: currentLgaMeta.educationSecretary
          }
        };
        schools = [synthesized];
      }
    }
    return schools;
  }, [selectedLGA, currentLgaMeta]);

  // Selected school with dynamic overrides from ministry actions
  const baseSelectedSchool = useMemo(() => {
    const found = lgaSchools.find(s => s.id === selectedSchoolId);
    const base = found || lgaSchools[0] || BENUE_GOVERNMENT_SCHOOLS[0];
    const override = schoolOverrides[base.id];
    if (!override) return base;
    return {
      ...base,
      ...override,
      financialStatement: override.financialStatement ? { ...base.financialStatement, ...override.financialStatement } : base.financialStatement,
      teacherKPIs: override.teacherKPIs ? { ...base.teacherKPIs, ...override.teacherKPIs } : base.teacherKPIs,
      governingBodyReview: override.governingBodyReview ? { ...base.governingBodyReview, ...override.governingBodyReview } : base.governingBodyReview
    };
  }, [lgaSchools, selectedSchoolId, schoolOverrides]);

  // Simulated school dynamically responding to term progress week
  const activeSchool = useMemo(() => {
    return simulateTermWeekProgress(baseSelectedSchool, currentWeek);
  }, [baseSelectedSchool, currentWeek]);

  // Statewide aggregate KPIs
  const stateSummary = useMemo(() => getStatewideAggregateKPIs(), []);

  // Filter schools inside current LGA for the dropdown menu
  const [educationLevelFilter, setEducationLevelFilter] = useState<'All' | 'Primary' | 'Secondary' | 'Technical'>('All');

  const filteredDropdownSchools = useMemo(() => {
    return lgaSchools.filter((sch) => {
      const isPrimary = sch.category.includes('Primary') || sch.category.includes('Basic') || sch.category.includes('Special Education');
      const isTechnical = sch.category.includes('Technical') || sch.category.includes('Vocational');
      const isSecondary = !isPrimary && !isTechnical;

      if (educationLevelFilter === 'Primary' && !isPrimary) return false;
      if (educationLevelFilter === 'Secondary' && !isSecondary) return false;
      if (educationLevelFilter === 'Technical' && !isTechnical) return false;

      const matchesSearch = 
        sch.name.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
        sch.code.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
        sch.principalName.toLowerCase().includes(schoolSearchTerm.toLowerCase());
      const matchesCategory = 
        schoolCategoryFilter === 'All' || sch.category === schoolCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [lgaSchools, schoolSearchTerm, schoolCategoryFilter, educationLevelFilter]);

  // Handle switching LGA
  const handleSelectLGA = (lga: BenueLGA) => {
    setSelectedLGA(lga);
    setIsSchoolDropdownOpen(false);
    setSchoolSearchTerm('');
    setSchoolCategoryFilter('All');
    const schools = getSchoolsByLGA(lga);
    if (schools.length > 0) {
      setSelectedSchoolId(schools[0].id);
    } else {
      setSelectedSchoolId(`SCH-${lga.substring(0, 3).toUpperCase()}-001`);
    }
  };

  // If locked, render the WingAccessGatekeeper
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4 flex flex-col justify-center items-center">
        <WingAccessGatekeeper
          wing="benue_moe"
          title="Benue State Education Headquarters — Ministry Command Access"
          subtitle="Restricted Central Headquarters. Only authorized executive officials from the Benue State Ministry of Education, Science & Technology and SUBEB can access statewide school records, telemetry, and dispatch school updates. Enter your authorized passkey."
          onUnlockSuccess={handleUnlockSuccess}
        />
        {isPasskeyModalOpen && (
          <AccessManagementModal
            onClose={() => setIsPasskeyModalOpen(false)}
            onPasskeysUpdated={() => {}}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* State Official Executive Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white border-b-4 border-amber-500 shadow-xl relative overflow-hidden">
        {/* Background decorative watermark pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <Landmark className="w-96 h-96 text-white" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          
          {/* Executive Security & Authenticated Clearance Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded">
                    MINISTRY OF EDUCATION HEADQUARTERS
                  </span>
                  <span className="text-[11px] text-emerald-300 font-bold">STATE SEC-HQ CLEARANCE</span>
                </div>
                <div className="text-xs text-white font-black mt-0.5">
                  {authenticatedPasskey?.staffName || 'Prof. Frederick Ikyaan'} — <span className="text-amber-300 font-medium">{authenticatedPasskey?.role || 'Hon. Commissioner for Education, Science & Technology'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Live Session Telemetry Counter */}
              <button
                onClick={handleSyncLiveSessions}
                id="sync-live-sessions-btn"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs border border-emerald-500/40 shadow-xs transition cursor-pointer ${isSyncing ? 'animate-pulse' : ''}`}
                title="Sync live records updating across schools and sessions"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Live School Sessions</span>
              </button>

              <button
                onClick={() => setIsLiveFeedOpen(!isLiveFeedOpen)}
                id="toggle-telemetry-feed-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
              >
                <TrendingUp className="h-3.5 w-3.5 text-amber-300" />
                <span>Live Feed ({telemetryCount} Synced)</span>
              </button>

              <button
                onClick={() => setIsPasskeyModalOpen(true)}
                id="manage-hq-passkeys-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-bold text-xs border border-white/20 transition cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Passkeys Hub</span>
              </button>

              <button
                onClick={handleLockHQPortal}
                id="lock-hq-portal-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                title="Secure and relock the Headquarters terminal"
              >
                <span>Relock HQ</span>
              </button>
            </div>
          </div>

          {/* Live Multi-Session Telemetry Stream Drawer / Bar */}
          {isLiveFeedOpen && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-white space-y-3 animate-in slide-in-from-top-2 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Real-Time Statewide Stream • Records Ingested As Sessions & Schools Are in Use
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Last Cross-Session Ingestion: <strong className="text-amber-300">{lastSyncTime}</strong> • 23 LGAs Live
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-emerald-400">Makurdi LGA • Gov College Makurdi</span>
                    <span>2 mins ago</span>
                  </div>
                  <p className="text-slate-200 text-[11px]">
                    420 SSS 2 continuous assessment scores uploaded to state exam registry (2025/2026 2nd Term).
                  </p>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-amber-400">Gboko LGA • GSS Gboko</span>
                    <span>6 mins ago</span>
                  </div>
                  <p className="text-slate-200 text-[11px]">
                    Term 2 PTA Subvention remittance verified (₦4,900,000 reconciled in bursary register).
                  </p>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-blue-400">Otukpo LGA • Jesus College Otukpo</span>
                    <span>11 mins ago</span>
                  </div>
                  <p className="text-slate-200 text-[11px]">
                    Biometric TRCN faculty attendance logged (94.2% teacher punctuality index across 18 periods).
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Benue State Ministry of Education, Science & Technology</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <span>Statewide Education Command & Governance Headquarters</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                Centralized monitoring and reporting platform covering all <strong className="text-amber-300">23 Local Government Areas</strong> of Benue State. Real-time term progress analytics across teachers performance, students academic standing, and audited financial statements for His Excellency, The Executive Governor of Benue State.
              </p>
            </div>

            {/* Quick Actions & Governor Brief Trigger */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsGovernorBriefModalOpen(true)}
                id="generate-gov-brief-top-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>Generate Governor's Brief</span>
              </button>

              <button
                onClick={() => window.print()}
                id="print-state-dashboard-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 shadow-md transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print State Memo</span>
              </button>
            </div>
          </div>

          {/* Statewide High-Level Metrics Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-300 uppercase font-semibold">Local Governments</div>
              <div className="text-2xl font-black text-white mt-1">23 LGAs</div>
              <div className="text-[10px] text-emerald-300 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3" /> 100% Deployed
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-300 uppercase font-semibold">Total Gov Schools</div>
              <div className="text-2xl font-black text-amber-300 mt-1">{stateSummary.totalSchools}</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Secondary & UBE Centers</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-300 uppercase font-semibold">Total Student Body</div>
              <div className="text-2xl font-black text-white mt-1">{stateSummary.totalStudents.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-300 mt-0.5">Gender Parity: 0.89</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-300 uppercase font-semibold">Registered Teachers</div>
              <div className="text-2xl font-black text-white mt-1">{stateSummary.totalTeachers.toLocaleString()}</div>
              <div className="text-[10px] text-amber-300 mt-0.5">{stateSummary.stateTrcnComplianceRate}% TRCN Certified</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-300 uppercase font-semibold">State WAEC Pass Rate</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{stateSummary.averageStatePassRate}%</div>
              <div className="text-[10px] text-slate-300 mt-0.5">5+ Credits incl. Eng & Math</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-300 uppercase font-semibold">Subvention Disbursed</div>
              <div className="text-xl font-black text-amber-300 mt-1">₦{(stateSummary.totalSubventionDisbursed / 1000000).toFixed(1)}M</div>
              <div className="text-[10px] text-emerald-300 mt-0.5">Audited & Reconciled</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ==================== CONTROL BAR: ZONE, LGA & SCHOOL SELECTOR ==================== */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-700" />
                <span>Benue State Institutional Command & LGA School Selector</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a Senatorial Zone, pick any of the 23 Local Governments, and use the School Dropdown Menu to view real-time terminal summary records.
              </p>
            </div>

            {/* Senatorial Zone Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {(['All', 'Zone A (Benue North-East)', 'Zone B (Benue North-West)', 'Zone C (Benue South)'] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setSelectedZone(z)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedZone === z 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {z === 'All' ? 'All 3 Zones' : z.split(' ')[0] + ' ' + z.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* 23 LGAs Selector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-700" />
                <span>1. Select Local Government Area (23 Benue LGAs):</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Quick Dropdown:</span>
                <select
                  id="lga-select-dropdown"
                  value={selectedLGA}
                  onChange={(e) => handleSelectLGA(e.target.value as BenueLGA)}
                  className="bg-slate-100 border border-slate-300 text-slate-900 rounded-lg px-3 py-1 text-xs font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {filteredLGAs.map((l) => (
                    <option key={l.lga} value={l.lga}>
                      {l.lga} LGA ({l.zone}) - {l.totalGovernmentSchools} Schools
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* LGA Grid Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {filteredLGAs.map((l) => {
                const isSelected = selectedLGA === l.lga;
                return (
                  <button
                    key={l.lga}
                    onClick={() => handleSelectLGA(l.lga)}
                    id={`lga-btn-${l.lga.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="text-xs font-extrabold truncate">{l.lga}</div>
                    <div className={`text-[10px] mt-1 flex items-center justify-between ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      <span>{l.totalGovernmentSchools} Schools</span>
                      <span className="font-bold">{l.averagePassRate}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* School Dropdown Selector for Selected LGA & Term Progress Scrub Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            {/* Prominent School Dropdown Menu for each Local Government */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <School className="h-4 w-4 text-emerald-700" />
                  <span>2. School Dropdown Menu for {selectedLGA} LGA ({lgaSchools.length} Schools):</span>
                </label>
                <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  LGA Seat: {currentLgaMeta.headquarters} • Sec: {currentLgaMeta.educationSecretary}
                </span>
              </div>

              {/* Education Level Quick Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold uppercase text-slate-500 px-2 shrink-0">Filter Level:</span>
                {[
                  { id: 'All', label: `All Schools (${lgaSchools.length})` },
                  { id: 'Primary', label: `Primary & Basic (SUBEB / LGEA)` },
                  { id: 'Secondary', label: `Secondary Colleges & Science` },
                  { id: 'Technical', label: `Technical & Vocational` }
                ].map(lvl => (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      setEducationLevelFilter(lvl.id as any);
                      setSchoolCategoryFilter('All');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      educationLevelFilter === lvl.id
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>

              {/* Native Accessible Select Dropdown */}
              <div className="space-y-1.5">
                <div className="relative">
                  <select
                    id="school-native-select-dropdown"
                    value={activeSchool.id}
                    onChange={(e) => {
                      setSelectedSchoolId(e.target.value);
                      setIsSchoolDropdownOpen(false);
                    }}
                    className="w-full bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl p-3.5 pr-10 border-2 border-emerald-600 shadow-sm focus:ring-2 focus:ring-amber-400 cursor-pointer appearance-none"
                  >
                    {filteredDropdownSchools.map((sch) => {
                      const isSchPrimary = sch.category.includes('Primary') || sch.category.includes('Basic') || sch.category.includes('Special Education');
                      return (
                        <option key={sch.id} value={sch.id} className="bg-slate-900 text-white py-1">
                          {sch.name} — [{sch.category}] • Code: {sch.code} ({isSchPrimary ? `NCEE: ${sch.studentKPIs.nceePassRate || 91}% • PSLE: ${sch.studentKPIs.pslePassRate || 94}%` : `WAEC: ${sch.studentKPIs.waecBenchmarkPassRate}%`}, Rank #{sch.governingBodyReview.stateRanking})
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-emerald-400">
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select any government primary or secondary school from the dropdown menu to inspect its full terminal performance summary.
                </p>
              </div>

              {/* Custom Interactive Dropdown Menu Trigger & Panel */}
              <div className="relative">
                <button
                  type="button"
                  id="toggle-school-dropdown-btn"
                  onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                  className={`w-full p-4 rounded-xl border transition cursor-pointer text-left flex items-center justify-between ${
                    isSchoolDropdownOpen
                      ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500 shadow-md'
                      : 'bg-slate-50 hover:bg-emerald-50/50 border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg text-white font-black text-xs ${
                      activeSchool.category.includes('Primary') || activeSchool.category.includes('Basic')
                        ? 'bg-emerald-700'
                        : activeSchool.category.includes('Science')
                        ? 'bg-purple-700'
                        : 'bg-slate-800'
                    }`}>
                      {activeSchool.code.split('-')[1] || 'SCH'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900">{activeSchool.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          activeSchool.category.includes('Primary') || activeSchool.category.includes('Basic')
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {activeSchool.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Rank #{activeSchool.governingBodyReview.stateRanking} in State
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span>{activeSchool.category.includes('Primary') ? 'Head Teacher:' : 'Principal:'} <strong className="text-slate-800">{activeSchool.principalName}</strong></span>
                        <span>•</span>
                        <span>Pupils/Students: <strong className="text-slate-800">{activeSchool.totalStudents}</strong></span>
                        <span>•</span>
                        <span>Teachers: <strong className="text-slate-800">{activeSchool.totalTeachers}</strong></span>
                        <span>•</span>
                        {activeSchool.category.includes('Primary') || activeSchool.category.includes('Basic') ? (
                          <span className="text-emerald-700 font-bold">NCEE Pass: {activeSchool.studentKPIs.nceePassRate || 92}% • PSLE: {activeSchool.studentKPIs.pslePassRate || 95}%</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">WAEC: {activeSchool.studentKPIs.waecBenchmarkPassRate}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 pl-2">
                    <span className="hidden sm:inline">{isSchoolDropdownOpen ? 'Close Menu' : 'Browse All'}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSchoolDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown Menu Overlay Panel */}
                {isSchoolDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-white rounded-2xl border-2 border-emerald-600 shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95">
                    {/* Search & Category Filter Inside Dropdown */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={schoolSearchTerm}
                          onChange={(e) => setSchoolSearchTerm(e.target.value)}
                          placeholder={`Search schools in ${selectedLGA} by name, code, or leader...`}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Category Filter Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {[
                          'All', 
                          'State Government Model Primary School',
                          'LGEA Demonstration Primary School',
                          'LGEA Primary School (SUBEB)',
                          'Senior Secondary College', 
                          'Special Science Secondary School', 
                          'Technical & Vocational College', 
                          'Universal Basic Education / Junior High'
                        ].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSchoolCategoryFilter(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                              schoolCategoryFilter === cat 
                                ? 'bg-emerald-800 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cat === 'All' ? `All Categories (${lgaSchools.length})` : cat.replace('Secondary School', 'Sec').replace('Primary School', 'Primary').replace('College', 'Col')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* School List Items in Dropdown */}
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {filteredDropdownSchools.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-500">
                          No schools found matching "<span className="font-bold text-slate-700">{schoolSearchTerm}</span>" in {selectedLGA} LGA.
                        </div>
                      ) : (
                        filteredDropdownSchools.map((sch) => {
                          const isSelected = activeSchool.id === sch.id;
                          const isSchPrimary = sch.category.includes('Primary') || sch.category.includes('Basic') || sch.category.includes('Special Education');
                          return (
                            <div
                              key={sch.id}
                              onClick={() => {
                                setSelectedSchoolId(sch.id);
                                setIsSchoolDropdownOpen(false);
                              }}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-slate-900">{sch.name}</span>
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                    {sch.code}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isSchPrimary ? 'bg-emerald-100 text-emerald-900' : 'bg-blue-100 text-blue-900'
                                  }`}>
                                    {sch.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                                  <span>{isSchPrimary ? 'Head Teacher:' : 'Principal:'} <strong>{sch.principalName}</strong></span>
                                  <span>•</span>
                                  <span>{sch.totalStudents} {isSchPrimary ? 'Pupils' : 'Students'}</span>
                                  <span>•</span>
                                  <span>{sch.totalTeachers} Teachers</span>
                                  <span>•</span>
                                  {isSchPrimary ? (
                                    <span className="text-emerald-700 font-bold">NCEE Pass: {sch.studentKPIs.nceePassRate || 92}% • PSLE: {sch.studentKPIs.pslePassRate || 95}%</span>
                                  ) : (
                                    <span className="text-emerald-700 font-bold">WAEC: {sch.studentKPIs.waecBenchmarkPassRate}%</span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 block mb-1">
                                  Rank #{sch.governingBodyReview.stateRanking}
                                </span>
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Term Progress Simulator Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Term Progress Timeline</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 font-bold">
                  2025/2026 • 2nd Term
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300">Terminal Cycle:</span>
                  <span className="font-extrabold text-amber-300 text-sm">Week {currentWeek} of 13</span>
                </div>
                
                {/* Scrub Range Slider */}
                <input 
                  type="range"
                  min="1"
                  max="13"
                  value={currentWeek}
                  onChange={(e) => setCurrentWeek(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Wk 1 (Resumption)</span>
                  <span>Wk 7 (Mid-Term)</span>
                  <span>Wk 13 (Exams & Reports)</span>
                </div>
              </div>

              <div className="bg-white/10 p-3 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Curriculum Syllabus Coverage:</span>
                  <span className="font-bold text-emerald-300">{activeSchool.teacherKPIs.curriculumCoverageRate}%</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeSchool.teacherKPIs.curriculumCoverageRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-300 pt-1">
                  <span>Continuous Assessment Upload:</span>
                  <span className="font-bold text-amber-300">
                    {currentWeek < 6 ? '1st Test Synced' : currentWeek < 11 ? 'Mid-Term Scores Recorded' : 'Final Terminal Computed'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                <span>Auto-Refresh Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Sync with Zonal Inspector
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== SELECTED SCHOOL DETAILED AUDIT DASHBOARD ==================== */}
        {(() => {
          const isPrimary = activeSchool.category.includes('Primary') || activeSchool.category.includes('Basic') || activeSchool.category.includes('Special Education');
          return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
              
              {/* Institutional School Identity Card Banner */}
              <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-white text-xs font-black px-2.5 py-0.5 rounded ${
                        isPrimary ? 'bg-emerald-600' : activeSchool.category.includes('Science') ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                        {activeSchool.category}
                      </span>
                      <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded">
                        {activeSchool.lga} LGA • {activeSchool.zone}
                      </span>
                      {isPrimary && (
                        <span className="bg-emerald-800 text-emerald-200 text-xs font-bold px-2 py-0.5 rounded border border-emerald-600">
                          SUBEB / LGEA Basic Education
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-mono">
                        EMIS Code: {activeSchool.code}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{activeSchool.name}</h2>
                    <p className="text-xs text-slate-300 flex items-center gap-4 flex-wrap pt-1">
                      <span>{isPrimary ? 'Head Teacher:' : 'Principal:'} <strong className="text-amber-300">{activeSchool.principalName}</strong></span>
                      <span>{isPrimary ? 'Assistant Head (Academic):' : 'VP Academic:'} <strong className="text-slate-100">{activeSchool.vicePrincipalAcademic}</strong></span>
                      <span>{isPrimary ? 'LGEA Bursary Officer:' : 'Bursar:'} <strong className="text-slate-100">{activeSchool.bursarName}</strong></span>
                      <span>Est: <strong className="text-slate-100">{activeSchool.establishedYear}</strong></span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                      <div className="text-[10px] text-slate-300 uppercase font-semibold">Statewide Position</div>
                      <div className="text-xl font-black text-amber-300">
                        Rank #{activeSchool.governingBodyReview.stateRanking} in Benue
                      </div>
                      <div className="text-[10px] text-emerald-300">
                        {isPrimary ? 'Top SUBEB Model in' : '#1 in'} {activeSchool.lga} LGA
                      </div>
                    </div>

                    <button
                      onClick={() => setIsGovernorBriefModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Governor Brief</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Review Desk Navigation Tabs */}
              <div className="px-6 border-b border-slate-200">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveReviewTab('teachers')}
                    className={`pb-3 px-3 text-xs font-extrabold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      activeReviewTab === 'teachers'
                        ? 'border-emerald-700 text-emerald-800'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>1. {isPrimary ? 'Primary Teaching Staff & TRCN Audit' : 'Teachers Performance & Staff Audit'}</span>
                  </button>

                  <button
                    onClick={() => setActiveReviewTab('students')}
                    className={`pb-3 px-3 text-xs font-extrabold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      activeReviewTab === 'students'
                        ? 'border-emerald-700 text-emerald-800'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>2. {isPrimary ? 'Pupil Academic Benchmarks (NCEE / PSLE / EGRA)' : 'Students Academic Performance (WAEC/BECE)'}</span>
                  </button>

                  <button
                    onClick={() => setActiveReviewTab('finances')}
                    className={`pb-3 px-3 text-xs font-extrabold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      activeReviewTab === 'finances'
                        ? 'border-emerald-700 text-emerald-800'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>3. {isPrimary ? 'SUBEB & LGEA Grants & Capitation Audit' : 'Financial Statement & Bursary Audit'}</span>
                  </button>

                  <button
                    onClick={() => setActiveReviewTab('governor-brief')}
                    className={`pb-3 px-3 text-xs font-extrabold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      activeReviewTab === 'governor-brief'
                        ? 'border-emerald-700 text-emerald-800'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Landmark className="h-4 w-4" />
                    <span>4. Governing Body & Executive Governor Memo</span>
                  </button>

                  <button
                    onClick={() => setActiveReviewTab('ministry-command')}
                    className={`pb-3 px-3 text-xs font-extrabold transition border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      activeReviewTab === 'ministry-command'
                        ? 'border-emerald-700 text-emerald-800'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>5. Ministry Directives & School Updates Command</span>
                    <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full">
                      2-WAY HUB
                    </span>
                  </button>
                </div>
              </div>

              {/* ==================== TAB 1: TEACHERS PERFORMANCE ==================== */}
              {activeReviewTab === 'teachers' && (
                <div className="p-6 space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {isPrimary ? 'LGEA Primary Faculty Competency, Phonics Delivery & Attendance Audit' : 'Faculty Competency, Lesson Note Compliance & Attendance Audit'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Biometric clock-in, weekly lesson note vetting records, and TRCN accreditation status for {activeSchool.name}.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      Staff Strength: {activeSchool.totalTeachers} Teachers ({activeSchool.trcnCertifiedTeachers} TRCN Registered)
                    </span>
                  </div>

                  {/* KPI Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">Teacher Attendance Rate</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">{activeSchool.teacherKPIs.attendanceRate}%</div>
                      <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> High Staff Punctuality
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">Lesson Notes Vetted</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">{activeSchool.teacherKPIs.lessonNoteSubmissionRate}%</div>
                      <div className="text-[11px] text-emerald-700 font-bold mt-1">
                        {isPrimary ? 'Checked by Asst. Head (Academic)' : 'Checked weekly by VP Academic'}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">Curriculum Coverage</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">{activeSchool.teacherKPIs.curriculumCoverageRate}%</div>
                      <div className="text-[11px] text-slate-500 mt-1">Week {currentWeek} of 13 Target</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">{isPrimary ? 'Pupil-to-Teacher Ratio' : 'Teacher-to-Student Ratio'}</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">{activeSchool.teacherStudentRatio}</div>
                      <div className="text-[11px] text-emerald-700 font-bold mt-1">{isPrimary ? 'SUBEB Standard Density' : 'Standard Class Density'}</div>
                    </div>
                  </div>

                  {/* Qualification Breakdown & Deficit Alerts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Award className="h-4 w-4 text-emerald-700" />
                        <span>Academic Qualification Distribution of Teaching Staff</span>
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div>
                          <div className="flex justify-between font-bold mb-1">
                            <span>Ph.D / Doctorate Holders:</span>
                            <span>{activeSchool.teacherKPIs.qualificationBreakdown.phd} Teachers</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(activeSchool.teacherKPIs.qualificationBreakdown.phd / activeSchool.totalTeachers) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-bold mb-1">
                            <span>Masters Degrees (M.Sc / M.Ed):</span>
                            <span>{activeSchool.teacherKPIs.qualificationBreakdown.msc_med} Teachers</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(activeSchool.teacherKPIs.qualificationBreakdown.msc_med / activeSchool.totalTeachers) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-bold mb-1">
                            <span>Bachelors Degrees (B.Sc / B.Ed / B.A):</span>
                            <span>{activeSchool.teacherKPIs.qualificationBreakdown.bsc_bed} Teachers</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(activeSchool.teacherKPIs.qualificationBreakdown.bsc_bed / activeSchool.totalTeachers) * 100}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between font-bold mb-1">
                            <span>Nigeria Certificate in Education (NCE):</span>
                            <span>{activeSchool.teacherKPIs.qualificationBreakdown.nce} Teachers</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(activeSchool.teacherKPIs.qualificationBreakdown.nce / activeSchool.totalTeachers) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>State Headquarters Staffing Audit & Subject Deficit Alerts</span>
                      </h4>

                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          <span className="font-bold block">{isPrimary ? 'Early Years / Primary Specialist Deficit:' : 'Subject Specialist Shortages Reported:'}</span>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {activeSchool.teacherKPIs.teacherDeficitSubjects.map((sub, i) => (
                              <li key={i} className="font-medium text-amber-950">{sub} ({isPrimary ? 'Requesting SUBEB LGEA Posting' : 'Requesting State TSB Posting'})</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                          <span className="font-bold block">Top Performing Departments:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {activeSchool.teacherKPIs.topPerformingDepartments.map((dept, i) => (
                              <span key={i} className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-bold">
                                {dept}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                          <span>Official Commendations: <strong className="text-emerald-700">{activeSchool.teacherKPIs.staffCommendationCount}</strong></span>
                          <span>Audit Queries Issued: <strong className="text-red-600">{activeSchool.teacherKPIs.staffQueryCount}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== TAB 2: STUDENTS PERFORMANCE ==================== */}
              {activeReviewTab === 'students' && (
                <div className="p-6 space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {isPrimary 
                          ? 'Primary School Academic Benchmarks, NCEE / PSLE Readiness & Literacy/Numeracy Indices' 
                          : 'Terminal Examinations, WAEC/BECE Readiness & Grade Distribution'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isPrimary 
                          ? `Foundational learning assessments, Common Entrance transitions, and Early Grade metrics for ${activeSchool.name}.`
                          : `Academic benchmarks, subject pass rates, and dropout risk mitigation for ${activeSchool.name}.`}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      Total {isPrimary ? 'Pupil Body' : 'Student Body'}: {activeSchool.totalStudents} ({activeSchool.maleStudents} Male, {activeSchool.femaleStudents} Female)
                    </span>
                  </div>

                  {/* KPI Metrics */}
                  {isPrimary ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                          <div className="text-xs text-emerald-900 font-semibold">NCEE Pass Rate</div>
                          <div className="text-2xl font-black text-emerald-800 mt-1">{activeSchool.studentKPIs.nceePassRate || 92.4}%</div>
                          <div className="text-[11px] text-emerald-700 mt-1">National Common Entrance</div>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                          <div className="text-xs text-blue-900 font-semibold">PSLE Pass Rate</div>
                          <div className="text-2xl font-black text-blue-800 mt-1">{activeSchool.studentKPIs.pslePassRate || 95.2}%</div>
                          <div className="text-[11px] text-blue-700 mt-1">Primary School Leaving Exam</div>
                        </div>

                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                          <div className="text-xs text-purple-900 font-semibold">EGRA Reading Index</div>
                          <div className="text-2xl font-black text-purple-800 mt-1">{activeSchool.studentKPIs.earlyGradeReadingIndex || 88.5}%</div>
                          <div className="text-[11px] text-purple-700 mt-1">Early Grade Reading Fluency</div>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                          <div className="text-xs text-amber-900 font-semibold">EGMA Math Index</div>
                          <div className="text-2xl font-black text-amber-800 mt-1">{activeSchool.studentKPIs.earlyGradeMathIndex || 87.0}%</div>
                          <div className="text-[11px] text-amber-700 mt-1">Early Grade Numeracy Skills</div>
                        </div>
                      </div>

                      {/* Primary Specific Highlights */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-slate-500 font-bold uppercase">School Feeding (HGSFP)</div>
                            <div className="text-xl font-black text-emerald-700">{activeSchool.studentKPIs.schoolFeedingComplianceRate || 98.4}%</div>
                            <div className="text-[10px] text-slate-500">Daily hot nutritious meals</div>
                          </div>
                          <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-lg">🍲</span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-slate-500 font-bold uppercase">Transition to JSS 1</div>
                            <div className="text-xl font-black text-blue-700">{activeSchool.studentKPIs.transitionToJuniorSecRate || 97.8}%</div>
                            <div className="text-[10px] text-slate-500">Basic 6 to JSS 1 Progression</div>
                          </div>
                          <span className="p-2 rounded-lg bg-blue-100 text-blue-800 text-lg">🎓</span>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-slate-500 font-bold uppercase">State Merit Scholars</div>
                            <div className="text-xl font-black text-amber-600">{activeSchool.studentKPIs.scholarshipRecipientsCount} Pupils</div>
                            <div className="text-[10px] text-slate-500">Benue Basic Education Awards</div>
                          </div>
                          <span className="p-2 rounded-lg bg-amber-100 text-amber-800 text-lg">⭐</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">WAEC Benchmark Pass Rate</div>
                        <div className="text-2xl font-black text-emerald-700 mt-1">{activeSchool.studentKPIs.waecBenchmarkPassRate}%</div>
                        <div className="text-[11px] text-slate-600 mt-1">5+ Credits incl. Eng & Maths</div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">BECE Junior Pass Rate</div>
                        <div className="text-2xl font-black text-emerald-700 mt-1">{activeSchool.studentKPIs.becePassRate}%</div>
                        <div className="text-[11px] text-slate-600 mt-1">Basic Education Transition</div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">Average Terminal Score</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{activeSchool.studentKPIs.averageScore}%</div>
                        <div className="text-[11px] text-slate-600 mt-1">Overall School Mean</div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">Scholarship Recipients</div>
                        <div className="text-2xl font-black text-amber-600 mt-1">{activeSchool.studentKPIs.scholarshipRecipientsCount}</div>
                        <div className="text-[11px] text-slate-600 mt-1">Benue State Merit Scholars</div>
                      </div>
                    </div>
                  )}

                  {/* Grade Distribution & Subject Highlights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-emerald-700" />
                        <span>Terminal Grade Distribution Curve (Out of {activeSchool.totalStudents} {isPrimary ? 'Pupils' : 'Students'})</span>
                      </h4>

                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <span className="text-[10px] text-emerald-700 font-bold block uppercase">{isPrimary ? 'Distinction' : 'Distinction (A1)'}</span>
                          <span className="text-lg font-black text-emerald-900 mt-1 block">{activeSchool.studentKPIs.gradeDistribution.distinctions}</span>
                          <span className="text-[10px] text-emerald-600">
                            {((activeSchool.studentKPIs.gradeDistribution.distinctions / activeSchool.totalStudents) * 100).toFixed(1)}%
                          </span>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                          <span className="text-[10px] text-blue-700 font-bold block uppercase">{isPrimary ? 'Credit' : 'Credit (B2-C6)'}</span>
                          <span className="text-lg font-black text-blue-900 mt-1 block">{activeSchool.studentKPIs.gradeDistribution.credits}</span>
                          <span className="text-[10px] text-blue-600">
                            {((activeSchool.studentKPIs.gradeDistribution.credits / activeSchool.totalStudents) * 100).toFixed(1)}%
                          </span>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <span className="text-[10px] text-amber-700 font-bold block uppercase">{isPrimary ? 'Pass' : 'Pass (D7-E8)'}</span>
                          <span className="text-lg font-black text-amber-900 mt-1 block">{activeSchool.studentKPIs.gradeDistribution.passes}</span>
                          <span className="text-[10px] text-amber-600">
                            {((activeSchool.studentKPIs.gradeDistribution.passes / activeSchool.totalStudents) * 100).toFixed(1)}%
                          </span>
                        </div>

                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                          <span className="text-[10px] text-red-700 font-bold block uppercase">{isPrimary ? 'Remedial' : 'Fail (F9)'}</span>
                          <span className="text-lg font-black text-red-900 mt-1 block">{activeSchool.studentKPIs.gradeDistribution.fails}</span>
                          <span className="text-[10px] text-red-600">
                            {((activeSchool.studentKPIs.gradeDistribution.fails / activeSchool.totalStudents) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <span>{isPrimary ? 'Basic Science & Computer Discovery Enrollment:' : 'Science & Technology Track Enrollment:'}</span>
                        <span className="font-extrabold text-emerald-800">
                          {isPrimary ? '100% of Primary 4-6 Pupils' : `${activeSchool.studentKPIs.scienceEnrollmentPercentage}% of Senior Students`}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald-700" />
                        <span>Subject Performance Highlights & Intervention Flags</span>
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="font-bold text-emerald-900 block mb-1">Top Performing Subjects:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeSchool.studentKPIs.topPerformingSubjects.map((sub, i) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                                ✓ {sub}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="font-bold text-amber-900 block mb-1">Subjects Flagged for Remedial State Clinics:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeSchool.studentKPIs.subjectsRequiringIntervention.map((sub, i) => (
                              <span key={i} className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-bold border border-amber-300">
                                ⚠ {sub}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                          <span>{isPrimary ? 'Pupil Attrition Risk:' : 'Dropout Risk Count:'} <strong className="text-slate-900">{activeSchool.studentKPIs.dropoutRiskCount} {isPrimary ? 'Pupils' : 'Students'}</strong></span>
                          <span>Gender Parity Index: <strong className="text-emerald-700">{activeSchool.studentKPIs.genderParityIndex}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== TAB 3: FINANCIAL STATEMENT ==================== */}
              {activeReviewTab === 'finances' && (
                <div className="p-6 space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {isPrimary ? 'Audited SUBEB & LGEA Primary Institutional Financial Statement' : 'Audited Institutional Financial Statement & Bursary Account'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isPrimary 
                          ? 'State Government running grant, UBEC matching subventions, PTA contributions, and instructional procurements.'
                          : 'State subventions, PTA collections, examination remittances, and instructional disbursements.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Status: {activeSchool.financialStatement.financialAuditStatus}
                      </span>
                      <span className="text-xs text-slate-500">
                        Last Audited: {activeSchool.financialStatement.lastAuditDate}
                      </span>
                    </div>
                  </div>

                  {/* Revenue vs Expenditure Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="text-xs font-bold text-emerald-900 uppercase">Total Revenue Inflow</div>
                      <div className="text-2xl font-black text-emerald-950 mt-1">
                        ₦{activeSchool.financialStatement.totalRevenue.toLocaleString()}
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-1">
                        Subvention: ₦{activeSchool.financialStatement.stateSubventionDisbursed.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                      <div className="text-xs font-bold text-amber-900 uppercase">Total Operating Expenditure</div>
                      <div className="text-2xl font-black text-amber-950 mt-1">
                        ₦{activeSchool.financialStatement.totalExpenditure.toLocaleString()}
                      </div>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Instructional & Kits: ₦{(activeSchool.financialStatement.instructionalMaterialsExp + activeSchool.financialStatement.labConsumablesExp).toLocaleString()}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900 text-white">
                      <div className="text-xs font-bold text-amber-300 uppercase">Net Operating Balance</div>
                      <div className="text-2xl font-black text-white mt-1">
                        ₦{activeSchool.financialStatement.netOperatingBalance.toLocaleString()}
                      </div>
                      <p className="text-[11px] text-emerald-300 mt-1">
                        Verified by {isPrimary ? 'LGEA Bursary Officer' : 'Bursar'} {activeSchool.financialStatement.bursarName}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Detailed Itemized Terminal Budget & Disbursement Schedule
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-300 text-slate-500 font-bold">
                            <th className="pb-2">Revenue / Expenditure Head</th>
                            <th className="pb-2">Target / Budgeted</th>
                            <th className="pb-2">Actual Realized</th>
                            <th className="pb-2">Variance / Audit Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          <tr>
                            <td className="py-2.5 font-bold">
                              {isPrimary ? 'Benue SUBEB / State Government Running Grant Subvention' : 'Benue State Government Running Grant Subvention'}
                            </td>
                            <td>₦{activeSchool.financialStatement.stateSubventionAllocated.toLocaleString()}</td>
                            <td className="font-bold text-emerald-700">₦{activeSchool.financialStatement.stateSubventionDisbursed.toLocaleString()}</td>
                            <td className="text-emerald-700">100% Cash Backed</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold">{isPrimary ? 'Community PTA & School Based Management Committee (SBMC)' : 'PTA Levy Collections'}</td>
                            <td>₦{activeSchool.financialStatement.ptaLevyTarget.toLocaleString()}</td>
                            <td className="font-bold text-emerald-700">₦{activeSchool.financialStatement.ptaLevyCollected.toLocaleString()}</td>
                            <td>{((activeSchool.financialStatement.ptaLevyCollected / activeSchool.financialStatement.ptaLevyTarget) * 100).toFixed(1)}% Recovery Rate</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold">{isPrimary ? 'Free Basic Textbooks, Primers & Early Years Literacy Kits' : 'Instructional & Curriculum Materials'}</td>
                            <td>₦{activeSchool.financialStatement.instructionalMaterialsExp.toLocaleString()}</td>
                            <td className="font-bold text-slate-900">₦{activeSchool.financialStatement.instructionalMaterialsExp.toLocaleString()}</td>
                            <td className="text-slate-500">{isPrimary ? 'SUBEB Free Distribution & Workbooks' : 'Textbooks, Chalkboards, Diaries'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold">{isPrimary ? 'Early Childhood Learning Kits, Phonics & Discovery Media' : 'Science Lab Consumables & Reagents'}</td>
                            <td>₦{activeSchool.financialStatement.labConsumablesExp.toLocaleString()}</td>
                            <td className="font-bold text-slate-900">₦{activeSchool.financialStatement.labConsumablesExp.toLocaleString()}</td>
                            <td className="text-slate-500">{isPrimary ? 'Jolly Phonics, Counting Kits, Models' : 'Physics, Chem, Bio Practical Kits'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 font-bold">{isPrimary ? 'Classroom Dual Desks Repairs & School Perimeter Upkeep' : 'Facility Repairs & Security Maintenance'}</td>
                            <td>₦{activeSchool.financialStatement.facilityMaintenanceExp.toLocaleString()}</td>
                            <td className="font-bold text-slate-900">₦{activeSchool.financialStatement.facilityMaintenanceExp.toLocaleString()}</td>
                            <td className="text-slate-500">{isPrimary ? 'Pupil Desks & Water Station Upkeep' : 'Hostel & Fence Upkeep'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                      <strong className="text-slate-900">Auditor-General & SUBEB Remarks: </strong>
                      <span>{activeSchool.financialStatement.auditorRemarks}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== TAB 4: GOVERNING BODY & EXECUTIVE BRIEF ==================== */}
              {activeReviewTab === 'governor-brief' && (
                <div className="p-6 space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {isPrimary ? 'State Universal Basic Education (SUBEB) Scorecard & Executive Governor Brief Desk' : 'State Governing Body Scorecard & Executive Governor Brief Desk'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Infrastructure condition, basic education standards, and actionable recommendations for the State Executive Council.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsGovernorBriefModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Open Printable Governor Memo</span>
                    </button>
                  </div>

                  {/* Infrastructure Ratings Matrix */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-emerald-700" />
                      <span>{isPrimary ? 'Primary Institution Infrastructure Rating (1-5 Star Standard)' : 'Institutional Infrastructure Rating (1-5 Star Standard)'}</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">{isPrimary ? 'Classrooms & Desks' : 'Classrooms'}</span>
                        <span className="text-xl font-black text-emerald-700 mt-1 block">
                          {activeSchool.governingBodyReview.infrastructure.classrooms} / 5
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">{isPrimary ? 'Discovery Lab / Kit' : 'Science Labs'}</span>
                        <span className="text-xl font-black text-emerald-700 mt-1 block">
                          {activeSchool.governingBodyReview.infrastructure.scienceLabs} / 5
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">{isPrimary ? 'Digital / CBT Hub' : 'ICT / CBT Center'}</span>
                        <span className="text-xl font-black text-blue-700 mt-1 block">
                          {activeSchool.governingBodyReview.infrastructure.ictCenter} / 5
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">{isPrimary ? 'Pupils Library Corner' : 'Library'}</span>
                        <span className="text-xl font-black text-purple-700 mt-1 block">
                          {activeSchool.governingBodyReview.infrastructure.library} / 5
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">{isPrimary ? 'Playground & Field' : 'Sports Field'}</span>
                        <span className="text-xl font-black text-amber-700 mt-1 block">
                          {activeSchool.governingBodyReview.infrastructure.sportsFacilities} / 5
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Water & Sanitation</span>
                        <span className="text-xl font-black text-emerald-700 mt-1 block">
                          {activeSchool.governingBodyReview.infrastructure.waterAndSanitation} / 5
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Alerts & Zonal Inspection Remarks */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-amber-900 font-bold">
                        <AlertTriangle className="h-4 w-4 text-amber-700" />
                        <span>Critical Headquarters Intervention Alerts:</span>
                      </div>
                      <ul className="space-y-2">
                        {activeSchool.governingBodyReview.keyInterventionAlerts.map((alert, i) => (
                          <li key={i} className="flex items-start gap-2 text-amber-950 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-1.5 flex-shrink-0"></span>
                            <span>{alert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <span>{isPrimary ? 'SUBEB Quality Assurance Inspector' : 'Zonal Inspector'} Remarks ({activeSchool.governingBodyReview.zonalInspectorName}):</span>
                      </div>
                      <p className="text-emerald-950 leading-relaxed font-medium">
                        "{activeSchool.governingBodyReview.headquarterInspectionRemarks}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== TAB 5: MINISTRY DIRECTIVES & SCHOOL UPDATES COMMAND ==================== */}
              {activeReviewTab === 'ministry-command' && (
                <div className="p-6 space-y-6 animate-in fade-in">
                  <MinistryUpdatesCommand
                    activeSchool={activeSchool}
                    onUpdateSchoolFinancials={handleUpdateSchoolFinancials}
                    onDeployTeacher={handleDeployTeacher}
                    onUpdateAccreditation={handleUpdateAccreditation}
                    currentLga={selectedLGA}
                    currentZone={activeSchool.zone}
                    authenticatedStaffName={authenticatedPasskey?.staffName || 'Prof. Frederick Ikyaan'}
                    authenticatedStaffRole={authenticatedPasskey?.role || 'Hon. Commissioner for Education, Science & Technology'}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* ==================== 23 LOCAL GOVERNMENTS LEAGUE TABLE ==================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-700" />
                <span>Benue State 23 Local Governments Comparative Education League Table</span>
              </h3>
              <p className="text-xs text-slate-500">
                Sorted summary across all 23 LGAs. Click any LGA row to immediately load its institutions.
              </p>
            </div>

            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              Showing 23 / 23 LGAs
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Local Government (LGA)</th>
                  <th className="p-3">Senatorial Zone</th>
                  <th className="p-3">Education Secretary</th>
                  <th className="p-3">Schools</th>
                  <th className="p-3">Student Pop.</th>
                  <th className="p-3">Teachers</th>
                  <th className="p-3">Pass Rate</th>
                  <th className="p-3">Subvention Disbursed</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {BENUE_LGAS_METADATA.map((lga, idx) => {
                  const isSelected = selectedLGA === lga.lga;
                  return (
                    <tr 
                      key={lga.lga}
                      onClick={() => handleSelectLGA(lga.lga)}
                      className={`hover:bg-emerald-50/50 transition cursor-pointer ${
                        isSelected ? 'bg-emerald-50/90 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 text-slate-500">#{idx + 1}</td>
                      <td className="p-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>{lga.lga}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                      </td>
                      <td className="p-3 text-slate-600">{lga.zone.split(' ')[0] + ' ' + lga.zone.split(' ')[1]}</td>
                      <td className="p-3 text-slate-600">{lga.educationSecretary}</td>
                      <td className="p-3 font-bold">{lga.totalGovernmentSchools}</td>
                      <td className="p-3">{lga.totalStudentPopulation.toLocaleString()}</td>
                      <td className="p-3">{lga.totalTeacherCount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          lga.averagePassRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {lga.averagePassRate}%
                        </span>
                      </td>
                      <td className="p-3 font-mono">₦{(lga.subventionDisbursedNaira / 1000000).toFixed(1)}M</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectLGA(lga.lga);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-900 text-white font-bold hover:bg-emerald-700 transition"
                        >
                          View LGA
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ==================== OFFICIAL GOVERNOR'S EXECUTIVE BRIEF MODAL ==================== */}
      {isGovernorBriefModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-slate-900 space-y-6 p-8 animate-in zoom-in-95">
            
            {/* Official Executive Header */}
            <div className="text-center border-b-2 border-slate-900 pb-6 space-y-2">
              <div className="flex items-center justify-center gap-3">
                <Landmark className="w-12 h-12 text-emerald-800" />
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-600">
                GOVERNMENT OF BENUE STATE OF NIGERIA
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                Executive Educational Performance Brief & Findings
              </h2>
              <div className="text-xs font-bold text-emerald-800">
                OFFICE OF THE HONORABLE COMMISSIONER FOR EDUCATION, SCIENCE & TECHNOLOGY
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                SUBMITTED TO: HIS EXCELLENCY, THE EXECUTIVE GOVERNOR OF BENUE STATE • DATE: {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>

            {/* Memorandum Header Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Institution:</span>
                <span className="font-black text-slate-900">{activeSchool.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">LGA & Senatorial Zone:</span>
                <span className="font-black text-slate-900">{activeSchool.lga} ({activeSchool.zone})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Academic Session / Term:</span>
                <span className="font-black text-slate-900">2025/2026 • 2nd Term (Wk {currentWeek})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">State Standing:</span>
                <span className="font-black text-emerald-800">Rank #{activeSchool.governingBodyReview.stateRanking} in Benue</span>
              </div>
            </div>

            {/* Executive Findings Sections */}
            {(() => {
              const isModalSchoolPrimary = activeSchool.category.includes('Primary') || activeSchool.category.includes('Basic') || activeSchool.category.includes('Special Education');
              return (
                <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
                  <div>
                    <h4 className="font-black text-sm text-slate-950 uppercase border-b border-slate-200 pb-1 mb-2">
                      1. Executive Summary & Institutional Findings
                    </h4>
                    <p>
                      Pursuant to the statutory mandate for statewide institutional quality assurance across all 23 Local Government Areas of Benue State, the Governing Body and {isModalSchoolPrimary ? 'State Universal Basic Education Board (SUBEB)' : 'Ministry of Education'} hereby presents the audited terminal records for <strong>{activeSchool.name}</strong>. The institution currently serves a verified enrollment of <strong>{activeSchool.totalStudents} {isModalSchoolPrimary ? 'pupils' : 'students'}</strong> with a faculty of <strong>{activeSchool.totalTeachers} teachers</strong> ({activeSchool.trcnCertifiedTeachers} TRCN registered professionals).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-slate-950 uppercase border-b border-slate-200 pb-1 mb-2">
                      2. Academic & Teaching Staff Performance Standing
                    </h4>
                    {isModalSchoolPrimary ? (
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>National Common Entrance (NCEE) Pass Rate:</strong> {activeSchool.studentKPIs.nceePassRate || 92.4}% of graduating Basic 6 candidates met high-merit federal & state college admission benchmarks.</li>
                        <li><strong>Primary School Leaving Certificate (PSLE):</strong> {activeSchool.studentKPIs.pslePassRate || 95.2}% overall success rate across core foundational subjects.</li>
                        <li><strong>Early Grade Literacy & Numeracy:</strong> EGRA Reading Fluency stands at <strong>{activeSchool.studentKPIs.earlyGradeReadingIndex || 88.5}%</strong> and EGMA Numeracy Index is <strong>{activeSchool.studentKPIs.earlyGradeMathIndex || 87.0}%</strong>.</li>
                        <li><strong>Home-Grown School Feeding Compliance:</strong> <strong>{activeSchool.studentKPIs.schoolFeedingComplianceRate || 98.4}%</strong> daily nutritional coverage recorded.</li>
                        <li><strong>Faculty Attendance & Punctuality:</strong> Biometric tracking records confirm a <strong>{activeSchool.teacherKPIs.attendanceRate}%</strong> teacher attendance index with <strong>{activeSchool.teacherKPIs.curriculumCoverageRate}%</strong> syllabus coverage.</li>
                      </ul>
                    ) : (
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>WAEC / BECE Benchmark Pass Rate:</strong> {activeSchool.studentKPIs.waecBenchmarkPassRate}% of candidates currently meet or exceed the state 5-credit benchmark including Mathematics & English Language.</li>
                        <li><strong>Curriculum Delivery Pace:</strong> Scheme of work coverage stands at <strong>{activeSchool.teacherKPIs.curriculumCoverageRate}%</strong> with a <strong>{activeSchool.teacherKPIs.lessonNoteSubmissionRate}%</strong> weekly vetted lesson notes compliance.</li>
                        <li><strong>Faculty Attendance & Punctuality:</strong> Biometric tracking records confirm a <strong>{activeSchool.teacherKPIs.attendanceRate}%</strong> teacher attendance index.</li>
                      </ul>
                    )}
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-slate-950 uppercase border-b border-slate-200 pb-1 mb-2">
                      3. Financial Accountability & Bursary Statement
                    </h4>
                    <p>
                      State Government running subvention & basic education grant of <strong>₦{activeSchool.financialStatement.stateSubventionDisbursed.toLocaleString()}</strong> has been 100% disbursed and accounted for under instructional procurement, learning aids, and facility maintenance with an audited net operating balance of <strong>₦{activeSchool.financialStatement.netOperatingBalance.toLocaleString()}</strong>.
                    </p>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 space-y-2 text-amber-950">
                    <h4 className="font-black text-xs uppercase text-amber-900">
                      4. Governor's Actionable Recommendations & Urgent Intervention Needs
                    </h4>
                    <p className="font-medium">
                      {activeSchool.governingBodyReview.governorBriefRecommendation}
                    </p>
                    <ul className="list-disc list-inside font-medium mt-1">
                      {activeSchool.governingBodyReview.keyInterventionAlerts.map((alert, i) => (
                        <li key={i}>{alert}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* Official Signatures Bar */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-900 text-xs">
              <div>
                <div className="font-mono text-slate-400">Electronic Signature Stamp:</div>
                <div className="font-black text-slate-900 mt-1">Hon. Commissioner for Education</div>
                <div className="text-[11px] text-slate-500">Ministry of Education, Science & Tech, Makurdi</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-slate-400">Authorized Date:</div>
                <div className="font-black text-slate-900 mt-1">{new Date().toISOString().split('T')[0]}</div>
                <div className="text-[11px] text-emerald-700 font-bold">STATE SEAL VERIFIED</div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => setIsGovernorBriefModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Close Executive Brief
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official State Memo</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Security & Access Management Modal */}
      {isPasskeyModalOpen && (
        <AccessManagementModal
          onClose={() => setIsPasskeyModalOpen(false)}
          onPasskeysUpdated={() => {}}
        />
      )}

    </div>
  );
}
