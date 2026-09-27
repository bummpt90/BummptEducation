import React from 'react';
import {
  MapPin,
  School,
  UserCheck,
  Sliders,
  Sparkles
} from 'lucide-react';
import { BenueLGA } from '../types';
import { useSchoolSimulation, BENUE_LGAS_METADATA } from '../context/SchoolSimulationContext';

export const ActiveSchoolContextBar: React.FC = () => {
  const {
    activeSchool,
    selectActiveSchool,
    selectedLga,
    selectLga,
    lgaSchools,
    leadershipRoster,
    hasCustomOverride,
    setIsLeadershipModalOpen
  } = useSchoolSimulation();

  return (
    <div
      className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2 text-xs shadow-xs"
      id="active-school-leadership-bar"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: LGA & School Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/90 border border-emerald-700/60 text-emerald-300 font-bold">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-emerald-400">LGA:</span>
            <select
              aria-label="Select Local Government Area"
              value={selectedLga}
              onChange={(e) => selectLga(e.target.value as BenueLGA, true)}
              className="bg-transparent text-white font-extrabold text-xs focus:outline-none cursor-pointer pr-1"
            >
              {BENUE_LGAS_METADATA.map((meta) => (
                <option key={meta.lga} value={meta.lga} className="bg-slate-900 text-white">
                  {meta.lga} LGA ({meta.zone.split(' ')[0]} {meta.zone.split(' ')[1]})
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-white font-bold max-w-full">
            <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0">School:</span>
            <select
              aria-label="Select School in LGA"
              value={activeSchool.id}
              onChange={(e) => {
                const found = lgaSchools.find((s) => s.id === e.target.value);
                if (found) selectActiveSchool(found);
              }}
              className="bg-transparent text-amber-300 font-extrabold text-xs focus:outline-none cursor-pointer truncate max-w-[260px] sm:max-w-[360px]"
            >
              {lgaSchools.map((sch) => (
                <option key={sch.id} value={sch.id} className="bg-slate-900 text-white">
                  {sch.name} ({sch.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Active School's Distinct Leadership & Simulation Options Trigger */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400">{leadershipRoster.principalTitle}:</span>{' '}
              <strong className="text-white font-bold">{leadershipRoster.principalName}</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">
              <span className="text-slate-400">
                {leadershipRoster.isPrimarySchool ? 'Asst. Head:' : 'VP Academic:'}
              </span>{' '}
              <strong className="text-slate-200">{leadershipRoster.vicePrincipalAcademic}</strong>
            </span>
            <span className="hidden xl:inline text-slate-600">|</span>
            <span className="hidden xl:inline">
              <span className="text-slate-400">Bursar:</span>{' '}
              <strong className="text-slate-200">{leadershipRoster.bursarName}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsLeadershipModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer shrink-0 ${
              hasCustomOverride
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs'
                : 'bg-emerald-700/90 hover:bg-emerald-600 text-white border border-emerald-500/40'
            }`}
            title="Switch LGA School or configure real school simulation leadership options"
          >
            {hasCustomOverride ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <Sliders className="w-3.5 h-3.5" />
            )}
            <span>
              {hasCustomOverride ? 'Simulation Leaders Active' : 'School Leadership Options'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
