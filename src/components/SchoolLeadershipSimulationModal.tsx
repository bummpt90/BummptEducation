import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  UserCheck,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Sliders,
  School
} from 'lucide-react';
import { BenueLGA } from '../types';
import { useSchoolSimulation, BENUE_LGAS_METADATA } from '../context/SchoolSimulationContext';

export const SchoolLeadershipSimulationModal: React.FC = () => {
  const {
    activeSchool,
    selectActiveSchool,
    selectedLga,
    selectLga,
    lgaSchools,
    leadershipRoster,
    selectedPresetId,
    presets,
    hasCustomOverride,
    applySimulationPreset,
    updateSchoolLeadershipOverride,
    resetSchoolLeadership,
    isLeadershipModalOpen,
    setIsLeadershipModalOpen
  } = useSchoolSimulation();

  const [principalTitle, setPrincipalTitle] = useState(leadershipRoster.principalTitle);
  const [principalName, setPrincipalName] = useState(leadershipRoster.principalName);
  const [vicePrincipalAcademic, setVicePrincipalAcademic] = useState(leadershipRoster.vicePrincipalAcademic);
  const [headmistressPrimary, setHeadmistressPrimary] = useState(leadershipRoster.headmistressPrimary);
  const [headEarlyYears, setHeadEarlyYears] = useState(leadershipRoster.headEarlyYears);
  const [bursarName, setBursarName] = useState(leadershipRoster.bursarName);
  const [examOfficerName, setExamOfficerName] = useState(leadershipRoster.examOfficerName);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setPrincipalTitle(leadershipRoster.principalTitle);
    setPrincipalName(leadershipRoster.principalName);
    setVicePrincipalAcademic(leadershipRoster.vicePrincipalAcademic);
    setHeadmistressPrimary(leadershipRoster.headmistressPrimary);
    setHeadEarlyYears(leadershipRoster.headEarlyYears);
    setBursarName(leadershipRoster.bursarName);
    setExamOfficerName(leadershipRoster.examOfficerName);
  }, [leadershipRoster]);

  if (!isLeadershipModalOpen) return null;

  const handleSaveCustomRoster = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolLeadershipOverride({
      principalTitle: principalTitle.trim() || leadershipRoster.principalTitle,
      principalName: principalName.trim() || leadershipRoster.principalName,
      vicePrincipalAcademic: vicePrincipalAcademic.trim() || leadershipRoster.vicePrincipalAcademic,
      headmistressPrimary: headmistressPrimary.trim() || leadershipRoster.headmistressPrimary,
      headEarlyYears: headEarlyYears.trim() || leadershipRoster.headEarlyYears,
      bursarName: bursarName.trim() || leadershipRoster.bursarName,
      examOfficerName: examOfficerName.trim() || leadershipRoster.examOfficerName
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <School className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Statewide Multi-LGA School & Leadership Configurator
                </span>
                {hasCustomOverride && (
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Simulation Override Active
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5">
                {activeSchool.name} ({activeSchool.lga} LGA)
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsLeadershipModalOpen(false)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Select LGA & School */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                1. Select Local Government Area & Active Institution
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Benue State Local Government Area (23 LGAs)
                </label>
                <select
                  value={selectedLga}
                  onChange={(e) => selectLga(e.target.value as BenueLGA, true)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
                >
                  {BENUE_LGAS_METADATA.map((meta) => (
                    <option key={meta.lga} value={meta.lga}>
                      {meta.lga} LGA — {meta.zone} ({meta.headquarters})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Institution in {selectedLga} LGA ({lgaSchools.length} Schools)
                </label>
                <select
                  value={activeSchool.id}
                  onChange={(e) => {
                    const found = lgaSchools.find((s) => s.id === e.target.value);
                    if (found) selectActiveSchool(found);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
                >
                  {lgaSchools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} [{sch.category}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  Code: <strong className="text-slate-900">{activeSchool.code}</strong> • Category:{' '}
                  <strong className="text-slate-900">{activeSchool.category}</strong>
                </span>
              </div>
              <div>
                LGA Education Secretary:{' '}
                <strong className="text-emerald-800">{leadershipRoster.generalAdministrator}</strong>
              </div>
            </div>
          </div>

          {/* Step 2: Simulation Leadership Presets */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                  2. School Simulation Leadership Mode (Official School Roster vs. Simulation Presets)
                </h3>
              </div>
              {hasCustomOverride && (
                <button
                  type="button"
                  onClick={() => resetSchoolLeadership()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white px-2.5 py-1 rounded-md border border-emerald-300 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore School Official Leaders
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {presets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applySimulationPreset(preset.id)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-emerald-900 text-white border-emerald-950 shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">{preset.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
                    </div>
                    <p
                      className={`text-[11px] mt-1 leading-relaxed ${
                        isSelected ? 'text-emerald-100' : 'text-slate-500'
                      }`}
                    >
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Custom Leadership Roster Editor for Real School Simulation */}
          <form onSubmit={handleSaveCustomRoster} className="bg-white rounded-xl p-4 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  3. Active Leadership Roster for {activeSchool.name} (Editable for Simulation)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Changes propagate to Report Cards, Organogram, Wing Portals & Dashboards
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Head of Institution Title (Principal / Headmaster / Head Teacher)
                </label>
                <input
                  type="text"
                  value={principalTitle}
                  onChange={(e) => setPrincipalTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  placeholder="e.g. Principal or Headmaster / Head Teacher"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {principalTitle || 'Principal / Headmaster'} Full Name & Qualifications
                </label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {leadershipRoster.vicePrincipalTitle}
                </label>
                <input
                  type="text"
                  value={vicePrincipalAcademic}
                  onChange={(e) => setVicePrincipalAcademic(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  School Bursar / Chief Financial Officer
                </label>
                <input
                  type="text"
                  value={bursarName}
                  onChange={(e) => setBursarName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Wing Headmaster / Headmistress (SUBEB Basic 1–6)
                </label>
                <input
                  type="text"
                  value={headmistressPrimary}
                  onChange={(e) => setHeadmistressPrimary(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Early Childhood / Kindergarten Coordinator (ECCDE / KG 1–3)
                </label>
                <input
                  type="text"
                  value={headEarlyYears}
                  onChange={(e) => setHeadEarlyYears(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chief Examination & Continuous Assessment Officer
                </label>
                <input
                  type="text"
                  value={examOfficerName}
                  onChange={(e) => setExamOfficerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Every school selected across Benue&apos;s 23 LGAs loads its own distinct leadership by default.
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {savedNotice && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    Simulation Leadership Applied!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsLeadershipModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
                >
                  <UserCheck className="w-4 h-4" />
                  Apply Simulation Leadership Options
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
