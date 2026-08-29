import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  UserCheck, 
  Building2, 
  LayoutDashboard, 
  Search, 
  Calendar, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Printer, 
  Users, 
  Layers,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  IssuedPasskey, 
  getStoredPasskeys, 
  saveStoredPasskeys, 
  generateRandomPasskey, 
  RestrictedWing,
  ParentAccessRecord,
  getStoredParentAccess,
  saveStoredParentAccess,
  getGlobalReportCardPublicationStatus,
  setGlobalReportCardPublicationStatus
} from '../utils/securityContext';
import { INITIAL_STAFF } from '../data/mockData';
import { SchoolArm, ClassLevel } from '../types';

interface AccessManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWingFilter?: RestrictedWing | 'all';
  onPasskeysUpdated?: () => void;
}

export const AccessManagementModal: React.FC<AccessManagementModalProps> = ({
  isOpen,
  onClose,
  initialWingFilter = 'all',
  onPasskeysUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'passkeys' | 'generate' | 'parents' | 'audit'>('passkeys');
  const [passkeys, setPasskeys] = useState<IssuedPasskey[]>(getStoredPasskeys());
  const [parentRecords, setParentRecords] = useState<ParentAccessRecord[]>(getStoredParentAccess());
  const [globalPublished, setGlobalPublished] = useState<boolean>(getGlobalReportCardPublicationStatus());
  
  const [wingFilter, setWingFilter] = useState<RestrictedWing | 'all'>(initialWingFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPassId, setCopiedPassId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Passkey Generation Form State
  const [selectedStaffId, setSelectedStaffId] = useState(INITIAL_STAFF[0]?.id || '');
  const [customStaffName, setCustomStaffName] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [selectedWing, setSelectedWing] = useState<RestrictedWing>('academic');
  const [selectedArm, setSelectedArm] = useState<SchoolArm | 'All'>('All');
  const [assignedClass, setAssignedClass] = useState<ClassLevel | ''>('');
  const [generatedCode, setGeneratedCode] = useState(generateRandomPasskey('ACAD'));
  const [expiryMonths, setExpiryMonths] = useState(12);
  const [issuingOfficer, setIssuingOfficer] = useState('Matthew Ternenge Beeun (Executive Director)');
  const [issuingOfficeName, setIssuingOfficeName] = useState('Directorate of Academic Planning & Quality Assurance');
  const [authorizationNotes, setAuthorizationNotes] = useState('Authorized for official continuous assessment, scoresheet marks collation, and broadsheet compilation.');

  // Printable Authorization Slip preview state
  const [activeSlip, setActiveSlip] = useState<IssuedPasskey | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleCopyPasskey = (pass: IssuedPasskey) => {
    navigator.clipboard.writeText(pass.passkey);
    setCopiedPassId(pass.id);
    showToast(`Passkey ${pass.passkey} copied to clipboard!`);
    setTimeout(() => setCopiedPassId(null), 2000);
  };

  const handleToggleStatus = (passId: string) => {
    const updated = passkeys.map((p) => {
      if (p.id === passId) {
        const nextStatus = p.status === 'Active' ? 'Suspended' : 'Active';
        return { ...p, status: nextStatus as any };
      }
      return p;
    });
    setPasskeys(updated);
    saveStoredPasskeys(updated);
    if (onPasskeysUpdated) onPasskeysUpdated();
    showToast('Authorization passkey status updated.');
  };

  const handleRevokePasskey = (passId: string) => {
    const updated = passkeys.filter((p) => p.id !== passId);
    setPasskeys(updated);
    saveStoredPasskeys(updated);
    if (onPasskeysUpdated) onPasskeysUpdated();
    showToast('Passkey permanently removed.');
  };

  const handleRegenerateCode = () => {
    const prefix = selectedWing === 'academic' ? 'ACAD' : selectedWing === 'bursary' ? 'BURS' : 'ADM';
    setGeneratedCode(generateRandomPasskey(prefix));
  };

  const handleCreatePasskey = (e: React.FormEvent) => {
    e.preventDefault();

    const matchedStaff = INITIAL_STAFF.find((s) => s.id === selectedStaffId);
    const staffName = customStaffName || matchedStaff?.fullName || 'Authorized Staff';
    const role = customRole || matchedStaff?.role || 'Educator / Officer';

    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(now.getMonth() + Number(expiryMonths));

    const newPass: IssuedPasskey = {
      id: `PASS-${Date.now().toString().slice(-4)}`,
      passkey: generatedCode.toUpperCase(),
      staffId: selectedStaffId || 'STF-CUSTOM',
      staffName,
      role,
      wing: selectedWing,
      arm: selectedArm,
      assignedClass: assignedClass ? (assignedClass as ClassLevel) : undefined,
      issuedBy: issuingOfficer,
      issuingOffice: issuingOfficeName,
      issuedDate: now.toISOString().split('T')[0],
      expiresAt: expiryDate.toISOString().split('T')[0],
      status: 'Active',
      notes: authorizationNotes,
      permissions: selectedWing === 'academic' 
        ? ['view_scoresheet', 'edit_scoresheet', 'view_broadsheet', 'evaluate_domains'] 
        : selectedWing === 'bursary'
        ? ['view_fees', 'issue_receipts', 'edit_fee_schedule']
        : ['view_admissions', 'manage_staff', 'system_audit']
    };

    const updated = [newPass, ...passkeys];
    setPasskeys(updated);
    saveStoredPasskeys(updated);
    if (onPasskeysUpdated) onPasskeysUpdated();

    setActiveSlip(newPass);
    showToast(`New authorization passkey ${newPass.passkey} generated successfully!`);
    setActiveTab('passkeys');
    handleRegenerateCode();
  };

  const handleToggleGlobalPublish = () => {
    const next = !globalPublished;
    setGlobalPublished(next);
    setGlobalReportCardPublicationStatus(next);
    
    // Also update parent access records
    const updated = parentRecords.map(r => ({
      ...r,
      isUploadedForDownload: next,
      uploadedAt: next ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined,
      uploadedBy: next ? 'Directorate of Academic Planning & Examination Board' : undefined,
    }));
    setParentRecords(updated);
    saveStoredParentAccess(updated);

    showToast(next ? 'All terminal report cards uploaded & published for Parent Portal download!' : 'Parent Portal report card downloads restricted to Draft mode.');
  };

  const filteredPasskeys = passkeys.filter((p) => {
    const matchWing = wingFilter === 'all' || p.wing === wingFilter || p.wing === 'all';
    const matchSearch = p.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.passkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.issuingOffice.toLowerCase().includes(searchQuery.toLowerCase());
    return matchWing && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto animate-in fade-in" id="access-management-modal">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 relative flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">SECURITY HUB</span>
                  <span className="text-xs text-slate-300">Statutory Authorization & Access Passes</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
                  Wing Access Control & Staff Credential Generator
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              id="close-access-modal-btn"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs inside modal */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto border-t border-slate-800 pt-3">
            <button
              onClick={() => setActiveTab('passkeys')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'passkeys'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Issued Passkeys ({passkeys.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'generate'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Issue New Authorization Pass</span>
            </button>

            <button
              onClick={() => setActiveTab('parents')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'parents'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Parent Report Card Upload & PINs</span>
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in slide-in-from-top">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6">

          {/* ================= TAB 1: ISSUED PASSKEYS REGISTRY ================= */}
          {activeTab === 'passkeys' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-600">Filter Wing:</span>
                  {(['all', 'benue_moe', 'academic', 'bursary', 'admin'] as (RestrictedWing | 'all')[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWingFilter(w)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer border ${
                        wingFilter === w
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {w === 'all' ? 'All Wings' : w === 'benue_moe' ? 'Benue MOE / State HQ' : `${w} Wing`}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search staff name or passkey..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-60 rounded-xl border border-slate-300 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Passkeys Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <th className="p-3 border-r border-slate-200">Staff & Designation</th>
                      <th className="p-3 border-r border-slate-200">Authorized Wing</th>
                      <th className="p-3 border-r border-slate-200">Issued Passkey</th>
                      <th className="p-3 border-r border-slate-200">Issuing Authority</th>
                      <th className="p-3 border-r border-slate-200">Validity</th>
                      <th className="p-3 text-center border-r border-slate-200">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredPasskeys.map((pass) => (
                      <tr key={pass.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 border-r border-slate-200">
                          <div className="font-bold text-slate-900">{pass.staffName}</div>
                          <div className="text-[11px] text-slate-500">{pass.role}</div>
                          {pass.assignedClass && (
                            <span className="inline-block mt-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                              {pass.assignedClass}
                            </span>
                          )}
                        </td>

                        <td className="p-3 border-r border-slate-200">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            pass.wing === 'all' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            pass.wing === 'academic' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            pass.wing === 'bursary' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}>
                            {pass.wing} Wing
                          </span>
                        </td>

                        <td className="p-3 font-mono border-r border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-blue-900 bg-slate-100 px-2 py-1 rounded text-xs tracking-wider">
                              {pass.passkey}
                            </span>
                            <button
                              onClick={() => handleCopyPasskey(pass)}
                              className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition cursor-pointer"
                              title="Copy Passkey"
                            >
                              {copiedPassId === pass.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>

                        <td className="p-3 border-r border-slate-200 text-slate-700 text-[11px]">
                          <div className="font-medium text-slate-900">{pass.issuingOffice}</div>
                          <div className="text-[10px] text-slate-500">Signatory: {pass.issuedBy}</div>
                        </td>

                        <td className="p-3 border-r border-slate-200 text-[11px] font-mono text-slate-600">
                          <div>Issued: {pass.issuedDate}</div>
                          <div className="text-rose-700 font-semibold">Expires: {pass.expiresAt}</div>
                        </td>

                        <td className="p-3 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleToggleStatus(pass.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition border ${
                              pass.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                            }`}
                          >
                            {pass.status}
                          </button>
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setActiveSlip(pass)}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="View & Print Authorization Slip"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRevokePasskey(pass.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Revoke and Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Printable Slip Preview Card (if open) */}
              {activeSlip && (
                <div className="bg-white rounded-2xl p-6 border-2 border-blue-400 shadow-lg space-y-4 animate-in fade-in">
                  <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-800 uppercase tracking-widest block">
                        OFFICIAL STATUTORY DISPATCH SLIP • BUMMPT EDUCATION
                      </span>
                      <h4 className="font-black text-slate-900 text-base mt-0.5">
                        Staff Security Clearance & Access Pass Voucher
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveSlip(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Close Slip ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Clearance Holder</span>
                      <strong className="text-slate-900 block font-bold">{activeSlip.staffName}</strong>
                      <span className="text-[10px] text-slate-600">{activeSlip.role}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Authorized Wing</span>
                      <strong className="text-blue-900 block font-bold uppercase">{activeSlip.wing} Wing</strong>
                      <span className="text-[10px] text-slate-600">Arm: {activeSlip.arm}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Security Passkey Code</span>
                      <strong className="text-emerald-700 block font-mono font-black text-sm">{activeSlip.passkey}</strong>
                      <span className="text-[10px] text-slate-500">Keep strictly confidential</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Issuing Authority</span>
                      <strong className="text-slate-900 block font-bold">{activeSlip.issuingOffice}</strong>
                      <span className="text-[10px] text-slate-600">{activeSlip.issuedBy}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                    <p className="italic text-[11px]">
                      "This pass authorizes the holder to access protected scoresheets, broadsheets, and institutional financial registers. Do not share credentials."
                    </p>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer transition shadow-xs whitespace-nowrap"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: GENERATE NEW STAFF PASSKEY ================= */}
          {activeTab === 'generate' && (
            <form onSubmit={handleCreatePasskey} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Generate Staff Authorization Passkey
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Issue an official encrypted passkey to a teacher, exam officer, or administrator from the respective area of authorization.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Staff Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Staff Member:
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => {
                      setSelectedStaffId(e.target.value);
                      const s = INITIAL_STAFF.find(st => st.id === e.target.value);
                      if (s) {
                        setCustomStaffName(s.fullName);
                        setCustomRole(s.role);
                        if (s.assignedClass) setAssignedClass(s.assignedClass);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    {INITIAL_STAFF.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.fullName} ({staff.role} - {staff.designation})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Wing Clearance */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorized Wing Clearance:
                  </label>
                  <select
                    value={selectedWing}
                    onChange={(e) => {
                      const newWing = e.target.value as RestrictedWing;
                      setSelectedWing(newWing);
                      const prefix = newWing === 'benue_moe' ? 'MOE' : newWing === 'academic' ? 'ACAD' : newWing === 'bursary' ? 'BURS' : 'ADM';
                      setGeneratedCode(generateRandomPasskey(prefix));
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="benue_moe">Benue State Ministry of Education & SUBEB HQ (23 LGAs Command)</option>
                    <option value="academic">Academic Wing (Report Cards, Broadsheet, Scoresheet, Domains)</option>
                    <option value="bursary">Bursary Wing (Fee Schedules, Payment Receipts, Accounts)</option>
                    <option value="admin">Central Administration (Admissions, HR Registry, System Audit)</option>
                    <option value="all">Executive Master (Full Clearance across All Wings)</option>
                  </select>
                </div>

                {/* Educational Arm */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Educational Arm:
                  </label>
                  <select
                    value={selectedArm}
                    onChange={(e) => setSelectedArm(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="All">All Arms (Cross-Institutional)</option>
                    <option value="secondary">Secondary College (JSS 1 - SSS 3)</option>
                    <option value="primary">Primary Basic School (Basic 1 - 6)</option>
                    <option value="kindergarten">Early Childhood & KG (KG 1 - 3)</option>
                  </select>
                </div>

                {/* Generated Passkey Code with refresh */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Generated Passkey / PIN:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={generatedCode}
                      onChange={(e) => setGeneratedCode(e.target.value.toUpperCase())}
                      className="flex-1 rounded-xl border-2 border-blue-300 bg-blue-50/50 p-2 text-xs font-mono font-black text-blue-900 tracking-wider text-center focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Regenerate Random Code"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Issuing Authority */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issuing Office:
                  </label>
                  <input
                    type="text"
                    value={issuingOfficeName}
                    onChange={(e) => setIssuingOfficeName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Authorizing Officer */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorizing Officer / Signatory:
                  </label>
                  <input
                    type="text"
                    value={issuingOfficer}
                    onChange={(e) => setIssuingOfficer(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Statutory Authorization Purpose / Notes:
                </label>
                <textarea
                  rows={2}
                  value={authorizationNotes}
                  onChange={(e) => setAuthorizationNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('passkeys')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="generate-passkey-submit-btn"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Issue & Dispatch Passkey</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= TAB 3: PARENT REPORT CARD UPLOAD & PIN MANAGER ================= */}
          {activeTab === 'parents' && (
            <div className="space-y-6">
              
              {/* Global Parent Download Upload Control Banner */}
              <div className={`p-5 rounded-2xl border ${
                globalPublished 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              } space-y-3`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      globalPublished ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {globalPublished ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          globalPublished ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {globalPublished ? 'UPLOADED & PUBLISHED' : 'LOCKED / DRAFT RESTRICTED'}
                        </span>
                        <span className="text-xs font-bold">Parent Download Authorization Status</span>
                      </div>
                      <p className="text-xs mt-0.5 opacity-90">
                        {globalPublished
                          ? 'Report cards are currently approved and uploaded for download by parents using their student admission number and PIN.'
                          : 'Report cards are currently restricted. Parents attempting to download will receive an official notification that terminal results are pending authorization.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleGlobalPublish}
                    id="toggle-global-parent-upload-btn"
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      globalPublished 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {globalPublished ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    <span>{globalPublished ? 'Restrict Parent Downloads (Draft Mode)' : 'Upload & Publish All Results to Parents'}</span>
                  </button>
                </div>
              </div>

              {/* Parent Access PINs Registry */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Parent Portal Access PINs & Verification Roster</h4>
                    <p className="text-xs text-slate-500">Parents use these secure 4-digit PINs along with their ward's admission number to authenticate downloads.</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-200">
                        <th className="p-2.5 border-r border-slate-200">Admission No</th>
                        <th className="p-2.5 border-r border-slate-200">Student Name</th>
                        <th className="p-2.5 border-r border-slate-200">Parent / Guardian</th>
                        <th className="p-2.5 border-r border-slate-200">Parent Portal PIN</th>
                        <th className="p-2.5 border-r border-slate-200">Upload Status</th>
                        <th className="p-2.5 text-center">Downloads</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {parentRecords.map((rec) => (
                        <tr key={rec.studentId} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-blue-800 border-r border-slate-200">
                            {rec.admissionNumber}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">
                            {rec.studentName}
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-slate-600">
                            <div>{rec.parentName}</div>
                            <span className="text-[10px] text-slate-400">{rec.parentPhone}</span>
                          </td>
                          <td className="p-2.5 font-mono border-r border-slate-200">
                            <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {rec.parentPin}
                            </span>
                          </td>
                          <td className="p-2.5 border-r border-slate-200">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.isUploadedForDownload
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {rec.isUploadedForDownload ? 'Uploaded for Download' : 'Restricted (Draft)'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-700">
                            {rec.downloadCount} times
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
