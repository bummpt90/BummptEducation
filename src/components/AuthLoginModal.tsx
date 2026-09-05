/**
 * BummptEducation — Production Identity & Authentication Modal
 * 
 * Provides:
 * - Production email & password login against /api/v1/auth/login
 * - Fast development test identity selector (Argon2id verified)
 * - User profile display with verified tenant scope, role, and permissions
 * - Session sign-out
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  ShieldCheck, 
  Building2, 
  Landmark, 
  User, 
  Sparkles,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DevIdentity {
  id: string;
  email: string;
  full_name: string;
  role: string;
  school_id: string | null;
  school_name?: string | null;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, isAuthenticated, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devIdentities, setDevIdentities] = useState<DevIdentity[]>([]);
  const [loadingDevIdentities, setLoadingDevIdentities] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      // Fetch dev identities if in development
      fetchDevIdentities();
    }
  }, [isOpen]);

  const fetchDevIdentities = async () => {
    try {
      setLoadingDevIdentities(true);
      const res = await fetch('/api/v1/auth/dev-identities');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setDevIdentities(data.data);
        }
      }
    } catch (err) {
      // Ignored in prod or if offline
    } finally {
      setLoadingDevIdentities(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Authentication successful! Identity verified.');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMessage(result.message || 'Invalid email or password.');
    }
  };

  const handleSelectDevIdentity = (devId: DevIdentity) => {
    setEmail(devId.email);
    setPassword('');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-600/40 text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                BummptEducation Production Identity
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-mono">
                  Argon2id + RBAC
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Server-enforced authentication & multi-tenant isolation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isAuthenticated && currentUser ? (
            /* Authenticated User Profile View */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-bold text-lg">
                      {currentUser.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{currentUser.fullName}</h4>
                      <p className="text-xs text-slate-300 font-mono">{currentUser.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-900/80 text-blue-200 border border-blue-700 uppercase tracking-wide">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {currentUser.schoolName || (currentUser.isStateOfficer ? 'State Ministry HQ' : 'Global Network')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Tenant Scope: <strong className="text-emerald-300">{currentUser.schoolId ? 'School-Scoped' : 'Global Authority'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Permissions Accordion / Pill Grid */}
              <div>
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Active Verified Server Permissions ({currentUser.permissions.length})
                </h5>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  {currentUser.permissions.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Close Window
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    setSuccessMessage('Logged out successfully.');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-semibold transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out of Session
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/50 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/50 flex items-start gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. principal@anchor.bummpt.edu.ng"
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700 pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-700 pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Verifying Credentials with Argon2id...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Sign In Securely
                  </>
                )}
              </button>

              {/* Development Quick-Select Identity Panel */}
              {devIdentities.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-amber-300/90 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      Development Test Identities (1-Click Fill)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Click to fill email
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1">
                    {devIdentities.map((devId) => (
                      <button
                        type="button"
                        key={devId.id}
                        onClick={() => handleSelectDevIdentity(devId)}
                        className={`text-left p-2 rounded-lg border transition text-xs flex flex-col ${
                          email === devId.email
                            ? 'bg-blue-950/70 border-blue-500 text-white'
                            : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate max-w-[170px]">{devId.full_name.split('(')[0]}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 font-mono">
                            {devId.role}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-slate-400 truncate">{devId.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
