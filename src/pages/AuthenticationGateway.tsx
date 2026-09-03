/**
 * BummptEducation — Secure Authentication Gateway
 * 
 * Central institutional entry gateway providing:
 * - Production Authentication (Email & Argon2id Password)
 * - Controlled Account Request / Sign-Up Submission
 * - Password Reset Foundation
 * - Quick Developer Test Identity Selection (Development Mode Only)
 * - Institutional Security, Compliance & Multi-Tenant Scoping Telemetry
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BummptechLogo } from '../components/BummptechLogo';
import { 
  ShieldCheck, 
  Lock, 
  UserPlus, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  School, 
  GraduationCap, 
  Layers, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Phone, 
  Mail, 
  Sparkles,
  Info,
  HelpCircle,
  Clock,
  Check,
  ChevronRight
} from 'lucide-react';

interface PublicSchool {
  id: string;
  name: string;
  code: string;
  lga: string;
  category: string;
  senatorial_zone: string;
}

interface DevIdentity {
  id: string;
  email: string;
  full_name: string;
  role: string;
  school_id: string | null;
  school_name?: string | null;
}

export const AuthenticationGateway: React.FC = () => {
  const { login } = useAuth();

  // Active gateway tab
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign up / Account request form state
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [requestedRole, setRequestedRole] = useState('teacher');
  const [requestedSchoolId, setRequestedSchoolId] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<{ message: string; requestId?: string } | null>(null);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // Public schools list for dropdown
  const [schools, setSchools] = useState<PublicSchool[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  // Dev identities (for development and test previews)
  const [devIdentities, setDevIdentities] = useState<DevIdentity[]>([]);
  const [devIdentitiesLoading, setDevIdentitiesLoading] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

  // Fetch public schools directory
  useEffect(() => {
    const fetchSchools = async () => {
      setSchoolsLoading(true);
      try {
        const res = await fetch('/api/v1/schools/public');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setSchools(json.data);
            if (json.data.length > 0 && !requestedSchoolId) {
              setRequestedSchoolId(json.data[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('[AuthenticationGateway] Public schools fetch notice:', err);
      } finally {
        setSchoolsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // Fetch development identities if running in dev environment
  useEffect(() => {
    const fetchDevIdentities = async () => {
      setDevIdentitiesLoading(true);
      try {
        const res = await fetch('/api/v1/auth/dev-identities');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setDevIdentities(json.data);
          }
        }
      } catch {
        // Dev identities disabled or production
      } finally {
        setDevIdentitiesLoading(false);
      }
    };

    fetchDevIdentities();
  }, []);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail || !loginPassword) {
      setLoginError('Please provide both your institutional email and password.');
      return;
    }

    setLoginLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      if (!result.success) {
        setLoginError(result.message || 'Invalid credentials or account locked.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Fast Dev Login shortcut
  const handleDevLogin = async (identity: DevIdentity) => {
    setLoginEmail(identity.email);
    setLoginPassword('Bummpt2025!');
    setLoginError(null);
    setLoginLoading(true);

    try {
      const result = await login(identity.email, 'Bummpt2025!');
      if (!result.success) {
        setLoginError(result.message || 'Quick login failed.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Quick login error.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Controlled Sign Up submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    if (!firstName.trim() || !surname.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError('First name, surname, email, and password are required.');
      return;
    }

    if (signupPassword.length < 8) {
      setSignupError('Password must be at least 8 characters long.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!termsAccepted) {
      setSignupError('You must acknowledge the Institutional Acceptable Use Policy to request an account.');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await fetch('/api/v1/auth/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          middleName: middleName || undefined,
          surname,
          email: signupEmail,
          phone: signupPhone || undefined,
          requestedRole,
          requestedSchoolId: requestedSchoolId || undefined,
          password: signupPassword,
          confirmPassword: signupConfirmPassword,
          termsAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSignupError(data.message || 'Failed to submit account request.');
      } else {
        setSignupSuccess({
          message: data.message,
          requestId: data.data?.id,
        });
        // Reset form
        setFirstName('');
        setMiddleName('');
        setSurname('');
        setSignupEmail('');
        setSignupPhone('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        setTermsAccepted(false);
      }
    } catch (err: any) {
      setSignupError(err.message || 'Network connection failed while submitting request.');
    } finally {
      setSignupLoading(false);
    }
  };

  // Handle Forgot Password submission
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);

    if (!forgotEmail) {
      setForgotMessage('Please specify your registered institutional email.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      setForgotMessage(data.message || 'Password reset instructions have been logged for institutional processing.');
    } catch (err: any) {
      setForgotMessage('If an active account exists, password recovery instructions will be dispatched.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white" id="authentication-gateway-view">
      {/* Top Brand & Institutional Clearance Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <BummptechLogo className="w-9 h-9" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Bummpt<span className="text-blue-400">Education</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-blue-950/80 px-2 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-800/50 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                Auth Gateway
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden xs:block">
              Benue State Ministry of Education & SUBEB Unified Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:+2348115231834"
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-emerald-400 transition"
            title="Institutional Hotline"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>+234 811 523 1834</span>
          </a>

          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 border-l border-slate-800 pl-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry: 23 LGAs Online</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Viewport */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Platform Branding & Institutional Trust Overview */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6 text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-950/90 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-800/60 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Enterprise Educational Security</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Institutional <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                  Authentication Gateway
                </span>
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Welcome to BummptEducation. Access to student records, academic continuous assessments, exam broadsheets, and bursary accounting is restricted to verified personnel.
              </p>
            </div>

            {/* Security Pillars Checklist */}
            <div className="space-y-3.5 bg-slate-900/60 border border-slate-800/90 rounded-xl p-4 sm:p-5 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/60 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Zero-Trust Role-Based Access (RBAC)</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Server-authoritative permissions govern each view and mutation. Requested roles require administrative confirmation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Campus Tenant Isolation</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Institutional school records are isolated at the database layer. Cross-school data leakage is strictly prohibited.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Argon2id Cryptographic Security</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Passwords are never stored in plaintext. Industry-standard memory-hard Argon2id hashing safeguards all credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Institutional Alignment Badge */}
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
              <GraduationCap className="w-5 h-5 text-blue-400 shrink-0" />
              <span>Aligned with Benue State Ministry of Education & SUBEB Curriculum Directives.</span>
            </div>
          </div>

          {/* Right Column: Gateway Interactive Card (Sign In / Sign Up / Forgot Password) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative">
            
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
                  activeTab === 'login'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                id="gateway-tab-login"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setSignupError(null);
                  setSignupSuccess(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
                  activeTab === 'signup'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                id="gateway-tab-signup"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Request Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('forgot');
                  setForgotMessage(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
                  activeTab === 'forgot'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                id="gateway-tab-forgot"
                title="Forgot Password Recovery"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recovery</span>
              </button>
            </div>

            {/* TAB 1: SIGN IN FORM */}
            {activeTab === 'login' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-white tracking-tight">Staff & Faculty Portal Access</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter your verified institutional credentials to unlock your designated platform wing.
                  </p>
                </div>

                {loginError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold">Authentication Notice: </span>
                      <span>{loginError}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. principal@bummpteducation.ng"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        id="gateway-login-email"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab('forgot')}
                        className="text-[11px] text-blue-400 hover:text-blue-300 transition cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        id="gateway-login-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                        title={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide uppercase transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    id="gateway-login-submit"
                  >
                    {loginLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Security Clearance...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Authenticate & Enter Platform</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Development Mode Quick-Switch Identity Panel */}
                {devIdentities.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Quick Test Identity Switcher (Dev Mode)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        {isDevMenuOpen ? 'Hide Identities' : `Show ${devIdentities.length} Accounts`}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3">
                      One-click authentication for development inspection and evaluator reviews.
                    </p>

                    {isDevMenuOpen && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {devIdentities.map((identity) => (
                          <button
                            key={identity.id}
                            type="button"
                            onClick={() => handleDevLogin(identity)}
                            disabled={loginLoading}
                            className="text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500 transition group flex flex-col justify-between cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold text-[11px] text-slate-200 group-hover:text-blue-400 truncate">
                                {identity.full_name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                                {identity.role.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-slate-500 truncate mt-0.5">
                              {identity.email}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CONTROLLED SIGN UP / ACCOUNT REQUEST */}
            {activeTab === 'signup' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-white tracking-tight">Controlled Account Request</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Submit applicant credentials for administrative review and campus provisioning.
                  </p>
                </div>

                {/* Important Zero-Trust Security Callout */}
                <div className="mb-4 p-3 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-200 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-white">Institutional Policy: </span>
                    Submitted roles are treated as <span className="underline font-semibold">requests</span>, not direct authorizations. Super Admin and State Officer clearance levels cannot be requested online.
                  </div>
                </div>

                {signupError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{signupError}</span>
                  </div>
                )}

                {signupSuccess && (
                  <div className="mb-4 p-4 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs flex items-start gap-3 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">Request Queued Successfully!</h4>
                      <p className="text-[11.5px] leading-relaxed">{signupSuccess.message}</p>
                      {signupSuccess.requestId && (
                        <p className="font-mono text-[10px] text-emerald-300">
                          Tracking Reference: <span className="font-bold">{signupSuccess.requestId}</span>
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('login');
                          setSignupSuccess(null);
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-white underline cursor-pointer"
                      >
                        Return to Sign In
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Terver"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="signup-first-name"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="e.g. John"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="signup-middle-name"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Surname *
                      </label>
                      <input
                        type="text"
                        required
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="e.g. Tyokyaa"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="signup-surname"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Institutional Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="name@school.edu.ng"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="signup-email"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+234 811 000 0000"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="signup-phone"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Requested Institutional Role *
                      </label>
                      <select
                        value={requestedRole}
                        onChange={(e) => setRequestedRole(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        id="signup-requested-role"
                      >
                        <option value="teacher">Classroom Teacher / Faculty</option>
                        <option value="bursar">Bursar / Accounts Officer</option>
                        <option value="admissions_officer">Admissions Officer</option>
                        <option value="exam_officer">Examination & Records Officer</option>
                        <option value="principal">Principal / Head of School</option>
                        <option value="vice_principal">Vice Principal (Academic / Admin)</option>
                        <option value="headmistress">Headmistress (Basic / Primary)</option>
                        <option value="head_kindergarten">Head of Kindergarten (Early Years)</option>
                        <option value="parent">Parent / Guardian</option>
                        <option value="student">Student</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Target School / Campus *
                      </label>
                      <select
                        value={requestedSchoolId}
                        onChange={(e) => setRequestedSchoolId(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        id="signup-school-select"
                        disabled={schoolsLoading}
                      >
                        {schools.length === 0 && (
                          <option value="">Loading active schools directory...</option>
                        )}
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name} ({school.lga} LGA)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Password (Min. 8 characters) *
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full bg-slate-950/80 border border-slate-700 rounded-lg pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          id="signup-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="signup-confirm-password"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                        id="signup-terms-checkbox"
                      />
                      <span>
                        I confirm that the submitted identity information is accurate and agree to BummptEducation's Institutional Acceptable Use Policy and Academic Integrity Framework.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={signupLoading || !termsAccepted}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide uppercase transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    id="signup-submit-btn"
                  >
                    {signupLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Request for Review...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Submit Controlled Account Request</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: FORGOT PASSWORD RECOVERY */}
            {activeTab === 'forgot' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-white tracking-tight">Institutional Password Recovery</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Request secure credential recovery instructions through institutional security protocol.
                  </p>
                </div>

                {forgotMessage && (
                  <div className="mb-5 p-3.5 rounded-xl bg-blue-950/80 border border-blue-800/80 text-blue-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{forgotMessage}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Registered Institutional Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. staff@bummpteducation.ng"
                        className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        id="forgot-email-input"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    For compliance and anti-enumeration security, reset tokens are generated server-side and recorded in the audit ledger. Contact your institution's Principal or the Ministry Desk Officer if immediate access is needed.
                  </p>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide uppercase transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    id="forgot-submit-btn"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Dispatching Recovery Protocols...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Dispatch Recovery Instructions</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-xs text-slate-400 hover:text-white transition underline cursor-pointer"
                    >
                      Remember your password? Return to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer / Copyright & Compliance Ledger */}
      <footer className="border-t border-slate-800/80 bg-slate-950/70 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} BummptEducation • Designed & Engineered by{' '}
            <span className="font-semibold text-slate-400">Bummptech Global Concepts</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Founder: Dr. Matthew Ternenge Beeun</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>Benue State 23 LGAs Standard</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
