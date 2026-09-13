import React from 'react';
import { 
  Lock, 
  ArrowLeft, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  LayoutDashboard, 
  AlertCircle, 
  Landmark,
  LogIn
} from 'lucide-react';
import { RestrictedWing, isUserAuthorizedForWingDisplay } from '../utils/wingClearance';
import { useAuth } from '../context/AuthContext';

interface WingAccessGatekeeperProps {
  wing: RestrictedWing;
  title: string;
  subtitle: string;
  onUnlockSuccess: () => void;
  onReturnHome: () => void;
  onOpenAuthModal?: () => void;
}

export const WingAccessGatekeeper: React.FC<WingAccessGatekeeperProps> = ({
  wing,
  title,
  subtitle,
  onUnlockSuccess,
  onReturnHome,
  onOpenAuthModal,
}) => {
  const { currentUser, isAuthenticated } = useAuth();

  const isSessionAuthorized = isAuthenticated && isUserAuthorizedForWingDisplay(currentUser, wing);

  const getWingDetails = () => {
    switch (wing) {
      case 'benue_moe':
        return {
          icon: Landmark,
          badgeColor: 'bg-emerald-900 text-emerald-200 border-emerald-700',
          borderColor: 'border-emerald-400',
          gradient: 'from-slate-950 via-emerald-950 to-slate-900',
          issuingBody: 'Benue State Ministry of Education, Science & Technology & SUBEB Headquarters, Makurdi',
          allowedRoles: 'Super Admin, State Education Officer, Principal / Head of School',
          restrictedItems: [
            'Statewide Educational Telemetry & Monitoring (All 23 LGAs)',
            "Executive Governor's Real-Time Briefing Engine & State Reports",
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
          issuingBody: "Directorate of Academic Planning, Examination Board & Principal's Office",
          allowedRoles: 'Super Admin, State Officer, Principal, Exam Officer, Teacher',
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
          issuingBody: "Chief Bursar's Office, Internal Auditor & Executive Directorate",
          allowedRoles: 'Super Admin, State Officer, Principal, Bursar, Administrator',
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
          icon: ShieldCheck,
          badgeColor: 'bg-slate-900 text-slate-200 border-slate-700',
          borderColor: 'border-slate-300',
          gradient: 'from-slate-950 to-slate-900',
          issuingBody: 'Central Administration & Executive Council',
          allowedRoles: 'Institutional Staff Accounts',
          restrictedItems: ['All Institutional Vaults & Administrative Controls']
        };
    }
  };

  const wingDetails = getWingDetails();

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
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-xs text-slate-300 font-medium">Server RBAC Protected</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  {title}
                </h2>
              </div>
            </div>

            <button
              onClick={onReturnHome}
              id="gatekeeper-return-home-btn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition self-start sm:self-center border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Public Portal</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Gatekeeper Clearance Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Active Server Identity Verification Card */}
          {isAuthenticated && currentUser ? (
            <div className={`p-5 rounded-2xl border transition ${
              isSessionAuthorized 
                ? 'bg-emerald-50 border-emerald-300' 
                : 'bg-amber-50 border-amber-300'
            }`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSessionAuthorized ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {isSessionAuthorized ? <UserCheck className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{currentUser.fullName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-white font-bold uppercase">
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 font-mono">
                      {currentUser.email} • School: {currentUser.schoolName || 'Central / Multi-School'}
                    </p>
                    <p className="text-xs mt-1 font-semibold">
                      {isSessionAuthorized ? (
                        <span className="text-emerald-700">✓ Server identity verified. Role grants clearance for this wing.</span>
                      ) : (
                        <span className="text-amber-800">
                          ⚠ Current role ({currentUser.role}) does not have clearance for this wing. Authorized roles: {wingDetails.allowedRoles}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {isSessionAuthorized ? (
                  <button
                    onClick={onUnlockSuccess}
                    id="gatekeeper-enter-wing-btn"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Enter Authorized Wing</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenAuthModal}
                    id="gatekeeper-switch-account-btn"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Switch Account</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Institutional Authentication Required</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Access to this wing requires a server-authenticated session. Please sign in with your verified institutional staff credentials.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onOpenAuthModal}
                  id="gatekeeper-signin-btn"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In with Institutional Account</span>
                </button>
              </div>
            </div>
          )}

          {/* Protected Assets Inventory */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Protected Assets in this Wing</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              {wingDetails.restrictedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-medium truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Governance Notice */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">Institutional Security Governance (Phase 8F):</p>
            <p>
              All data transmission and mutations are signed with server-authoritative JSON Web Tokens (JWT) verified against PostgreSQL. Client-side tampering is strictly prohibited; all requests without verified role credentials receive HTTP 401/403 responses.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
