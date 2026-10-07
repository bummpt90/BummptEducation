import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Users,
  Calendar,
  Layers,
  BookOpen,
  ClipboardCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Edit3,
  Sparkles,
  Save,
  X,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { SchoolOnboardingStatusReport, SchoolProfileUpdates } from '../auth/onboarding.service';

interface SchoolOnboardingChecklistProps {
  schoolId?: string;
  onRefreshParentMetrics?: () => void;
}

export const SchoolOnboardingChecklist: React.FC<SchoolOnboardingChecklistProps> = ({
  schoolId: propSchoolId,
  onRefreshParentMetrics,
}) => {
  const { currentUser } = useAuth();
  const effectiveSchoolId = propSchoolId || currentUser?.schoolId || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SchoolOnboardingStatusReport | null>(null);

  // Profile Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<SchoolProfileUpdates>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Action States
  const [isInitStructureLoading, setIsInitStructureLoading] = useState(false);
  const [isVerifyingLoading, setIsVerifyingLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchOnboardingStatus = useCallback(async () => {
    if (!effectiveSchoolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/v1/schools/${effectiveSchoolId}/onboarding`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch onboarding status.');
      }

      setReport(json.data);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with onboarding server.');
    } finally {
      setLoading(false);
    }
  }, [effectiveSchoolId]);

  useEffect(() => {
    fetchOnboardingStatus();
  }, [fetchOnboardingStatus]);

  const handleOpenEditModal = () => {
    if (!report) return;
    setEditFormData({
      name: report.institutionalProfile.name,
      lga: report.institutionalProfile.lga,
      senatorialZone: report.institutionalProfile.senatorialZone,
      category: report.institutionalProfile.category,
      phone: report.institutionalProfile.phone,
      email: report.institutionalProfile.email,
      address: report.institutionalProfile.address,
      establishedYear: report.institutionalProfile.establishedYear,
      principalName: report.institutionalProfile.principalName,
      vicePrincipalAcademic: report.institutionalProfile.vicePrincipalAcademic,
      bursarName: report.institutionalProfile.bursarName,
    });
    setProfileSuccessMsg(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSchoolId) return;

    try {
      setIsSavingProfile(true);
      setError(null);

      const res = await fetch(`/api/v1/schools/${effectiveSchoolId}/onboarding/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update institutional profile.');
      }

      setReport(json.data);
      setProfileSuccessMsg('School institutional profile updated successfully.');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setProfileSuccessMsg(null);
      }, 1200);

      if (onRefreshParentMetrics) onRefreshParentMetrics();
    } catch (err: any) {
      alert(`Error updating profile: ${err.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleInitStructure = async () => {
    if (!effectiveSchoolId) return;
    const confirmInit = window.confirm(
      'Initialize standard canonical classroom structure (e.g. JSS 1–3, SSS 1–3 or Basic 1–6) and assign core subjects for this school?'
    );
    if (!confirmInit) return;

    try {
      setIsInitStructureLoading(true);
      setActionFeedback(null);

      const res = await fetch(
        `/api/v1/schools/${effectiveSchoolId}/onboarding/academic-structure`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to initialize academic structure.');
      }

      setReport(json.data);
      setActionFeedback({
        type: 'success',
        message: json.message || 'Academic classes and curriculum subjects established.',
      });

      if (onRefreshParentMetrics) onRefreshParentMetrics();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to initialize academic structure.',
      });
    } finally {
      setIsInitStructureLoading(false);
    }
  };

  const handleVerifyOnboarding = async () => {
    if (!effectiveSchoolId) return;

    try {
      setIsVerifyingLoading(true);
      setActionFeedback(null);

      const res = await fetch(`/api/v1/schools/${effectiveSchoolId}/onboarding/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Onboarding verification rejected by server.');
      }

      setReport(json.data);
      setActionFeedback({
        type: 'success',
        message: json.message || 'School onboarding successfully verified by server.',
      });

      if (onRefreshParentMetrics) onRefreshParentMetrics();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Verification rejected.',
      });
    } finally {
      setIsVerifyingLoading(false);
    }
  };

  if (!effectiveSchoolId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-800">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <h3 className="font-bold text-lg">No School Context Available</h3>
        <p className="text-sm mt-1">
          Please log in as an administrator or select an authoritative school to review its onboarding lifecycle.
        </p>
      </div>
    );
  }

  if (loading && !report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
        <p className="font-semibold text-sm">Evaluating server-authoritative onboarding checklist...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <h3 className="font-bold text-lg">Failed to Load Onboarding Lifecycle</h3>
        <p className="text-sm mt-1">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={fetchOnboardingStatus}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 transition"
        >
          Retry Evaluation
        </button>
      </div>
    );
  }

  const isReady = report.overallStatus === 'ONBOARDING_READY';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Phase 10D: Institutional Readiness
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-700 text-slate-300 border border-slate-600">
                PostgreSQL Authoritative
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">{report.schoolName}</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Institutional code: <strong className="text-white font-mono">{report.schoolCode}</strong> | Organization: <strong className="text-white">{report.organizationName}</strong> ({report.organizationCode}) | {report.institutionalProfile.lga} LGA
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={handleOpenEditModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit School Profile
            </button>
            <button
              onClick={fetchOnboardingStatus}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Readiness Status Badges & Progress */}
        <div className="mt-6 pt-6 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Onboarding State</div>
            <div className="mt-1 flex items-center gap-2">
              {isReady ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm font-black text-emerald-300 tracking-wide">ONBOARDING_READY</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm font-black text-amber-300 tracking-wide">ONBOARDING_INCOMPLETE</span>
                </>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {report.completedStepsCount} of {report.totalStepsCount} lifecycle steps completed ({report.completionPercentage}%)
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operational Launch Gate</div>
            <div className="mt-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-black text-indigo-200">LAUNCH NOT AUTHORIZED</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Distinct Phase 10E ministerial gate
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Production Database</div>
            <div className="mt-1 text-xs font-bold text-slate-300">
              NOT YET PROVISIONED
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Zero mock/synthetic live tables
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Real Student Records</div>
            <div className="mt-1 text-xs font-bold text-emerald-400">
              0 Loaded (Strict Boundary)
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              No real students or marks in Phase 10D
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isReady ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              style={{ width: `${report.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 7-Step Detailed Checklist */}
      <div className="space-y-4">
        {report.steps.map((step) => {
          const stepIcons: Record<string, React.ReactNode> = {
            school_profile: <Building2 className="w-5 h-5 text-emerald-600" />,
            leadership_and_staff: <Users className="w-5 h-5 text-blue-600" />,
            academic_calendar: <Calendar className="w-5 h-5 text-purple-600" />,
            classes_and_subjects: <Layers className="w-5 h-5 text-indigo-600" />,
            staff_assignments: <BookOpen className="w-5 h-5 text-teal-600" />,
            review_completeness: <ClipboardCheck className="w-5 h-5 text-amber-600" />,
            operational_readiness: <ShieldAlert className="w-5 h-5 text-slate-700" />,
          };

          return (
            <div
              key={step.id}
              className={`bg-white rounded-xl border p-5 transition shadow-sm ${
                step.isComplete
                  ? 'border-emerald-200/80 bg-emerald-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 mt-0.5">
                    {stepIcons[step.id] || <FileCheck2 className="w-5 h-5 text-slate-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        Step {step.stepNumber}
                      </span>
                      {step.isComplete ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-0.5">{step.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                  </div>
                </div>

                {/* Section Specific Quick Actions */}
                <div className="shrink-0 flex items-center gap-2">
                  {step.id === 'school_profile' && (
                    <button
                      onClick={handleOpenEditModal}
                      className="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                    >
                      Edit Profile
                    </button>
                  )}
                  {step.id === 'classes_and_subjects' && step.items[0]?.isComplete === false && (
                    <button
                      onClick={handleInitStructure}
                      disabled={isInitStructureLoading}
                      className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isInitStructureLoading ? 'Initializing...' : 'Initialize Standard Classes'}
                    </button>
                  )}
                  {step.id === 'review_completeness' && (
                    <button
                      onClick={handleVerifyOnboarding}
                      disabled={isVerifyingLoading || !report.isReadyForVerification}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 ${
                        report.isReadyForVerification
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      {isVerifyingLoading ? 'Verifying...' : 'Verify Onboarding Readiness'}
                    </button>
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {step.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border text-xs ${
                      item.isComplete
                        ? 'bg-white border-emerald-200/60'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-800">{item.label}</div>
                      {item.isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{item.description}</div>
                    {item.value !== undefined && item.value !== null && (
                      <div className="mt-2 text-[11px] font-mono font-medium text-slate-700 bg-slate-100/80 px-2 py-1 rounded break-all">
                        {String(item.value)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit School Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Edit Institutional School Profile</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update contact, address, establishment, and institutional metadata in PostgreSQL
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {profileSuccessMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">LGA</label>
                  <input
                    type="text"
                    value={editFormData.lga || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, lga: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Senatorial Zone</label>
                  <input
                    type="text"
                    value={editFormData.senatorialZone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, senatorialZone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editFormData.category || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Established Year</label>
                  <input
                    type="number"
                    min="1840"
                    max={new Date().getFullYear()}
                    value={editFormData.establishedYear || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        establishedYear: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="e.g. info@school.benuestate.gov.ng"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="e.g. +234 803 000 0000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Physical Address</label>
                <textarea
                  rows={2}
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  placeholder="e.g. Km 4, Gboko Road, Makurdi, Benue State"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Principal Name</label>
                  <input
                    type="text"
                    value={editFormData.principalName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, principalName: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">VP Academic</label>
                  <input
                    type="text"
                    value={editFormData.vicePrincipalAcademic || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, vicePrincipalAcademic: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bursar Name</label>
                  <input
                    type="text"
                    value={editFormData.bursarName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, bursarName: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
