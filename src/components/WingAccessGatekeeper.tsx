import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  UserCheck, 
  Building2, 
  LayoutDashboard, 
  FileSpreadsheet, 
  HelpCircle,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  Landmark
} from 'lucide-react';
import { RestrictedWing, verifyPasskeyForWing, DEFAULT_DEPARTMENT_PASSKEYS, IssuedPasskey } from '../utils/securityContext';
import { BummptechLogo } from './BummptechLogo';

interface WingAccessGatekeeperProps {
  wing: RestrictedWing;
  title: string;
  subtitle: string;
  onUnlockSuccess: (matchedPass?: IssuedPasskey) => void;
  onReturnHome: () => void;
  onOpenPasskeyManager?: () => void;
}

export const WingAccessGatekeeper: React.FC<WingAccessGatekeeperProps> = ({
  wing,
  title,
  subtitle,
  onUnlockSuccess,
  onReturnHome,
  onOpenPasskeyManager,
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPresetCredentials, setShowPresetCredentials] = useState(true);

  const getWingDetails = () => {
    switch (wing) {
      case 'benue_moe':
        return {
          icon: Landmark,
          badgeColor: 'bg-emerald-900 text-emerald-200 border-emerald-700',
          borderColor: 'border-emerald-400',
          gradient: 'from-slate-950 via-emerald-950 to-slate-900',
          issuingBody: 'Benue State Ministry of Education, Science & Technology & SUBEB Headquarters, Makurdi',
          restrictedItems: [
            'Statewide Educational Telemetry & Monitoring (All 23 LGAs)',
            'Executive Governor\'s Real-Time Briefing Engine & State Reports',
            'Ministry Directives, Circulars & Statewide Policy Broadcasts',
            'State Subvention Disbursals, Lab Grants & Financial Audits',
            'TRCN Teacher Deployment, Deficit Allocations & School Accreditation'
          ],
          presets: [
            { label: 'Hon. Commissioner for Education (Full State Mandate)', code: 'COMMISSIONER999', holder: 'Prof. Frederick Ikyaan' },
            { label: 'Executive Chairman, Benue SUBEB (Basic Education)', code: 'BENUEMOE2026', holder: 'Dr. (Mrs.) Grace Adagba' },
            { label: 'Permanent Secretary, Ministry of Education', code: 'PERMSEC2026', holder: 'Barr. Terlumun Iorfa' },
            { label: 'Director of Quality Assurance & Standards', code: 'QA2026', holder: 'Dr. Simon Tor-Anyiin' },
            { label: 'Zonal Chief Education Inspector (Zone B)', code: 'INSPECTOR2026', holder: 'Mr. Emmanuel Agba' },
            { label: 'Executive Director & Super-Admin Master Key', code: 'PRINCIPAL999', holder: 'Matthew Ternenge Beeun' }
          ]
        };
      case 'academic':
        return {
          icon: LayoutDashboard,
          badgeColor: 'bg-blue-900 text-blue-200 border-blue-700',
          borderColor: 'border-blue-300',
          gradient: 'from-slate-900 via-blue-950 to-indigo-950',
          issuingBody: 'Directorate of Academic Planning, Examination Board & Principal\'s Office',
          restrictedItems: [
            'Terminal Report Cards (Full Subject Marks & GPA)',
            'Master Broadsheet Matrix & Cross-Subject Ranks',
            'Continuous Assessment (40%) & Terminal Exam (60%) Scoresheets',
            'Affective & Psychomotor Behavioral Domain Evaluations',
            'Result Approval & Official Parent Portal Publication Control'
          ],
          presets: [
            { label: 'Principal Master Key (Full Clearance)', code: 'PRINCIPAL999', holder: 'Matthew Ternenge Beeun (Director)' },
            { label: 'VP Academic / Senior Principal Pass', code: 'ACADEMIC2026', holder: 'Dr. (Mrs.) Grace Nkechi Okafor' },
            { label: 'Senior Exam Officer Pass (SSS 2 Science)', code: 'EXAM2026', holder: 'Mr. Emmanuel Agbo' },
            { label: 'Head of Kindergarten Pass (Early Years)', code: 'MONTESSORI2026', holder: 'Mrs. Abigail Balogun' },
            { label: 'Primary Headmistress Pass (Basic 1-6)', code: 'BASIC2026', holder: 'Mrs. Grace Iveren Shima' }
          ]
        };
      case 'bursary':
      case 'admin':
        return {
          icon: Building2,
          badgeColor: 'bg-amber-900 text-amber-200 border-amber-700',
          borderColor: 'border-amber-300',
          gradient: 'from-slate-950 via-slate-900 to-amber-950',
          issuingBody: 'Chief Bursar\'s Office, Internal Auditor & Executive Directorate',
          restrictedItems: [
            'School Fee Schedules & Compulsory Levy Structures',
            'Student Fee Payments, Bank Teller & POS Receipts',
            'Official Stamped Fee Clearance Vouchers & Invoicing',
            'Staff Recruitment, HR Registry & Security Authorization Hub',
            'Admission Entrance Examinations & Student Transfers'
          ],
          presets: [
            { label: 'Principal Master Key (Full Clearance)', code: 'PRINCIPAL999', holder: 'Matthew Ternenge Beeun (Director)' },
            { label: 'Chief Bursar Pass (Finance & Receipts)', code: 'BURSARY2026', holder: 'Mr. Patrick Terver Gbilekaa' },
            { label: 'Central Admin & Registrar Pass (Admissions & HR)', code: 'ADMIN2026', holder: 'Mrs. Bridget Ngunan Tor' }
          ]
        };
      default:
        return {
          icon: ShieldAlert,
          badgeColor: 'bg-slate-900 text-slate-200 border-slate-700',
          borderColor: 'border-slate-300',
          gradient: 'from-slate-950 to-slate-900',
          issuingBody: 'Central Administration & Executive Council',
          restrictedItems: ['All Institutional Vaults & Administrative Controls'],
          presets: [
            { label: 'Principal Master Key', code: 'PRINCIPAL999', holder: 'Executive Director' }
          ]
        };
    }
  };

  const wingDetails = getWingDetails();
  const IconComponent = wingDetails.icon;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const result = verifyPasskeyForWing(passkeyInput, wing);
    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        onUnlockSuccess(result.matchedPass);
      }, 400);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleApplyPreset = (code: string) => {
    setPasskeyInput(code);
    setErrorMessage('');
    setSuccessMessage('');
    const result = verifyPasskeyForWing(code, wing);
    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        onUnlockSuccess(result.matchedPass);
      }, 400);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 lg:p-8" id="wing-security-gatekeeper">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
        
        {/* Institutional Security Header */}
        <div className={`bg-gradient-to-r ${wingDetails.gradient} text-white p-6 sm:p-8 relative`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                <Lock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                    RESTRICTED ACCESS WING
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Bummpt Education Suite</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">{title}</h2>
              </div>
            </div>

            <button
              onClick={onReturnHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Main Body Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Passkey Entry Form & Issuance Info */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-4 w-4 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">Enter Authorized Staff Passkey</h3>
              </div>
              <p className="text-xs text-slate-600">
                Staff members, Form Tutors, Exam Officers, and Administrators must authenticate with their official passkey issued by the authorization office.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Authorization Passkey / PIN:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passkeyInput}
                    onChange={(e) => {
                      setPasskeyInput(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="e.g. ACADEMIC2026 or EXAM2026..."
                    id="wing-passkey-input"
                    className="w-full rounded-2xl border-2 border-slate-300 bg-slate-50/50 px-4 py-3 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-inner pr-12 uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  id="submit-wing-passkey-btn"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 text-sm shadow-md transition cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Authenticate & Open Wing</span>
                </button>

                {onOpenPasskeyManager && (
                  <button
                    type="button"
                    onClick={onOpenPasskeyManager}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <UserCheck className="h-4 w-4 text-blue-700" />
                    <span>Issue Passkeys</span>
                  </button>
                )}
              </div>
            </form>

            {/* Issuing Authority Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Building2 className="h-3.5 w-3.5 text-blue-700" />
                <span>Statutory Issuing Authority:</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {wingDetails.issuingBody}. Passkeys are bound to staff designation and automatically expire at the conclusion of each academic session.
              </p>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Need a passkey issued?</span>
                <span className="font-bold text-blue-700">Contact Executive Directorate</span>
              </div>
            </div>
          </div>

          {/* Right Column: Protected Assets & Quick Test Demonstrator */}
          <div className="lg:col-span-5 space-y-5 lg:border-l lg:border-slate-200 lg:pl-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Restricted Institutional Assets
              </span>
              <h4 className="font-bold text-slate-900 text-xs">Items protected under this wing clearance:</h4>
            </div>

            <ul className="space-y-2">
              {wingDetails.restrictedItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>

            {/* Quick Test Demo Keys for Verification */}
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl p-4 border border-blue-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-700" />
                  <span className="text-xs font-bold text-blue-950">Quick-Select Issued Passkeys</span>
                </div>
                <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-bold">Testing Preset</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Click any pre-issued authorization credential below to test role-specific clearance:
              </p>

              <div className="space-y-1.5">
                {wingDetails.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset.code)}
                    className="w-full text-left p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        {preset.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Holder: {preset.holder} • Pass: <strong className="text-blue-900">{preset.code}</strong>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
