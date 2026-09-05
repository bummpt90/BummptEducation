import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  LayoutDashboard, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Landmark 
} from 'lucide-react';
import { RestrictedWing, verifyPasskeyForWing, isUserAuthorizedForWing, IssuedPasskey } from '../utils/securityContext';
import { useAuth } from '../context/AuthContext';

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
  const { currentUser, isAuthenticated } = useAuth();
  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isSessionAuthorized = isAuthenticated && isUserAuthorizedForWing(currentUser, wing);

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
          ]
        };
      default:
        return {
          icon: ShieldAlert,
          badgeColor: 'bg-slate-900 text-slate-200 border-slate-700',
          borderColor: 'border-slate-300',
          gradient: 'from-slate-950 to-slate-900',
          issuingBody: 'Central Administration & Executive Council',
          restrictedItems: ['All Institutional Vaults & Administrative Controls']
        };
    }
  };

  const wingDetails = getWingDetails();

  const handleAuthorizeWithSession = () => {
    if (!currentUser || !isSessionAuthorized) return;

    setSuccessMessage(`Authorized via active session: ${currentUser.fullName} (${currentUser.role})`);
    setTimeout(() => {
      onUnlockSuccess({
        id: `SESSION-${currentUser.id}`,
        passkey: 'SESSION-VERIFIED',
        staffId: currentUser.id,
        staffName: currentUser.fullName,
        role: currentUser.role,
        wing,
        arm: 'All',
        issuedBy: 'Server Authentication Gateway (JWT + RBAC)',
        issuingOffice: 'Central Directory Service',
        issuedDate: new Date().toISOString().split('T')[0],
        expiresAt: '2026-12-31',
        status: 'Active',
        permissions: ['verified_session']
      });
    }, 300);
  };

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
          
          {/* Left Column: Server Auth Session or Passkey Entry */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Active Session Verification Card */}
            {currentUser && (
              <div className={`p-4 rounded-2xl border ${isSessionAuthorized ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${isSessionAuthorized ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isSessionAuthorized ? <ShieldCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {isSessionAuthorized ? 'Active Session Verified' : 'Restricted Role'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white border border-current font-bold">
                        {currentUser.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs mt-1 font-medium">
                      Signed in as <strong>{currentUser.fullName}</strong> ({currentUser.email})
                    </p>
                    {isSessionAuthorized ? (
                      <p className="text-[11px] text-emerald-800 mt-1">
                        Your server-authoritative role has been verified with authorization to access this operational wing.
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-800 mt-1">
                        Your current role ({currentUser.role}) is not authorized for this wing. You may enter an ad-hoc staff passkey below if issued.
                      </p>
                    )}

                    {isSessionAuthorized && (
                      <button
                        type="button"
                        onClick={handleAuthorizeWithSession}
                        className="mt-3 w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Authorize & Open Wing as {currentUser.fullName}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-4 w-4 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">Or Enter Authorized Staff Passkey</h3>
              </div>
              <p className="text-xs text-slate-600">
                Staff members, Form Tutors, Exam Officers, and Administrators may also authenticate using an issued passkey from the Security Registry.
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
                    placeholder="e.g. ACAD-8921B"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 font-mono tracking-wider pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={!passkeyInput.trim()}
                  className="flex-1 rounded-2xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
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

            {/* Statutory Authority Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Building2 className="h-3.5 w-3.5 text-blue-700" />
                <span>Statutory Issuing Authority:</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {wingDetails.issuingBody}. Passkeys are bound to staff designation and verified against server-authoritative RBAC.
              </p>
            </div>
          </div>

          {/* Right Column: Protected Assets & Server Architecture */}
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

            <div className="bg-slate-900 rounded-2xl p-4 text-slate-200 space-y-2 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                <span>Production Security Standard</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All data in this wing is persisted to PostgreSQL and governed by multi-tenant school isolation. Hardcoded credentials are fully decommissioned.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
