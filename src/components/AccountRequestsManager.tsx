/**
 * BummptEducation — Administrative Account Requests Management Component
 * 
 * Provides authorized administrators (Super Admin, State Officers, Principals) with:
 * - Real-time review queue of applicant account requests
 * - Role verification and approval with campus assignment
 * - Formal rejection with recorded rationale
 * - Multi-tenant enforcement (principals restricted to their campus)
 * - Audit logging tracking all approvals and rejections
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Building2, 
  School, 
  ShieldCheck, 
  Mail, 
  Phone, 
  RefreshCw,
  Check,
  X,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { AuthRole } from '../auth/types';

export interface AccountRequestItem {
  id: string;
  organization_id: string;
  requested_school_id: string | null;
  first_name: string;
  middle_name: string | null;
  surname: string;
  email: string;
  phone: string | null;
  requested_role: AuthRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  school_name?: string;
  school_code?: string;
  reviewer_name?: string;
}

export const AccountRequestsManager: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();

  const [requests, setRequests] = useState<AccountRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Action Modals State
  const [selectedRequest, setSelectedRequest] = useState<AccountRequestItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [assignedRole, setAssignedRole] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('bummpt_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const res = await fetch(`/api/v1/auth/account-requests?${params.toString()}`, {
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to load account requests (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRequests(json.data);
      } else {
        setRequests([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to account requests service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleOpenApproveModal = (req: AccountRequestItem) => {
    setSelectedRequest(req);
    setAssignedRole(req.requested_role);
    setAdminNotes('');
    setActionType('approve');
  };

  const handleOpenRejectModal = (req: AccountRequestItem) => {
    setSelectedRequest(req);
    setRejectionReason('Institutional credentials could not be verified on official roster.');
    setAdminNotes('');
    setActionType('reject');
  };

  const handleExecuteApproval = async () => {
    if (!selectedRequest) return;
    setActionSubmitting(true);
    try {
      const token = sessionStorage.getItem('bummpt_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/auth/account-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          assignedRole,
          adminNotes: adminNotes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to approve account request.');
      }

      setActionNotice({
        type: 'success',
        message: json.message || `Account for ${selectedRequest.email} has been approved and activated.`,
      });
      setSelectedRequest(null);
      setActionType(null);
      await fetchRequests();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Error occurred while approving account.',
      });
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleExecuteRejection = async () => {
    if (!selectedRequest) return;
    setActionSubmitting(true);
    try {
      const token = sessionStorage.getItem('bummpt_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/auth/account-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          rejectionReason,
          adminNotes: adminNotes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to reject account request.');
      }

      setActionNotice({
        type: 'success',
        message: json.message || `Account request for ${selectedRequest.email} has been rejected.`,
      });
      setSelectedRequest(null);
      setActionType(null);
      await fetchRequests();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Error occurred while rejecting request.',
      });
    } finally {
      setActionSubmitting(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6" id="account-requests-manager-panel">
      {/* Header & Stats Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Institutional Account Requests Queue</h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">
              Phase 7 Controlled Sign-Up
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review applicant identities, verify institutional affiliation, and authorize role provisioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            title="Refresh requests queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} Pending Review</span>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start justify-between gap-3 animate-fadeIn ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
            placeholder="Search by name, email, or role..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium">Retrieving institutional account requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Account Requests Found</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter === 'PENDING'
                ? 'All registration requests for your institutional authority have been processed.'
                : 'No account requests match the specified criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Applicant Identity</th>
                  <th className="px-4 py-3">Requested Role</th>
                  <th className="px-4 py-3">Target Campus</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((item) => {
                  const fullName = [item.first_name, item.middle_name, item.surname].filter(Boolean).join(' ');
                  const isPending = item.status === 'PENDING';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{fullName}</div>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {item.email}
                          </span>
                          {item.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {item.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10.5px] font-bold uppercase">
                          {item.requested_role.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.school_name || 'Central / Unassigned'}</span>
                        </div>
                        {item.school_code && (
                          <span className="text-[10px] text-slate-400 font-mono">Code: {item.school_code}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {item.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {item.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                              title="Approve request and provision user"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition cursor-pointer"
                              title="Reject registration request"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">
                            <span>Reviewed by: {item.reviewer_name || 'Administrator'}</span>
                            {item.admin_notes && (
                              <p className="italic truncate max-w-[160px] text-slate-500">"{item.admin_notes}"</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPROVE MODAL */}
      {actionType === 'approve' && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <UserCheck className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Approve Account Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                You are authorizing <span className="font-bold text-slate-900">{selectedRequest.first_name} {selectedRequest.surname}</span> (<span className="font-mono text-slate-700">{selectedRequest.email}</span>) to receive production platform access.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Operational Role *
                </label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="teacher">Classroom Teacher / Faculty</option>
                  <option value="bursar">Bursar / Accounts Officer</option>
                  <option value="admissions_officer">Admissions Officer</option>
                  <option value="exam_officer">Examination & Records Officer</option>
                  <option value="principal">Principal / Head of School</option>
                  <option value="vice_principal">Vice Principal</option>
                  <option value="headmistress">Headmistress (Basic / Primary)</option>
                  <option value="head_kindergarten">Head of Kindergarten (Early Years)</option>
                  <option value="parent">Parent / Guardian</option>
                  <option value="student">Student</option>
                  {currentUser?.isSuperAdmin && (
                    <>
                      <option value="state_officer">State Ministry Officer (Benue MOE)</option>
                      <option value="super_admin">Super Administrator (Central Authority)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrative Clearance Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Identity verified against official Benue SUBEB / Teaching Service Commission staff roll."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionType(null)}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteApproval}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Confirm & Activate Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {actionType === 'reject' && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-700">
                <UserX className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Reject Account Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setActionType(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              <p>
                Rejecting this request will prevent <span className="font-bold text-slate-900">{selectedRequest.first_name} {selectedRequest.surname}</span> ({selectedRequest.email}) from receiving access to the platform.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the institutional reason for declining this request..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Administrative Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional internal notes for audit compliance..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionType(null)}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRejection}
                disabled={actionSubmitting || !rejectionReason.trim()}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-md shadow-red-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
