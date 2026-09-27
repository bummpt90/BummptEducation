import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import {
  BenueLGA,
  GovSchool,
  SchoolLeadershipRoster,
  OrganogramNode
} from '../types';
import {
  BENUE_LGAS_METADATA,
  BENUE_GOVERNMENT_SCHOOLS,
  getSchoolsByLGA,
  getAllBenueGovSchools,
  getGovSchoolById,
  resolveSchoolLeadershipRoster,
  SIMULATION_LEADERSHIP_PRESETS,
  SimulationLeadershipPreset
} from '../data/benueStateData';
import { buildDynamicOrganogramForSchool } from '../data/reference/organogram';

interface SchoolSimulationContextType {
  activeSchool: GovSchool;
  selectActiveSchool: (school: GovSchool) => void;
  selectSchoolById: (schoolId: string) => void;
  selectedLga: BenueLGA;
  selectLga: (lga: BenueLGA, autoSelectFirstSchool?: boolean) => void;
  lgaSchools: GovSchool[];
  allStateSchools: GovSchool[];
  leadershipRoster: SchoolLeadershipRoster;
  dynamicOrganogram: OrganogramNode[];
  selectedPresetId: string;
  presets: SimulationLeadershipPreset[];
  hasCustomOverride: boolean;
  applySimulationPreset: (presetId: string, schoolId?: string) => void;
  updateSchoolLeadershipOverride: (override: Partial<SchoolLeadershipRoster>, schoolId?: string) => void;
  resetSchoolLeadership: (schoolId?: string) => void;
  isLeadershipModalOpen: boolean;
  setIsLeadershipModalOpen: (open: boolean) => void;
}

const SchoolSimulationContext = createContext<SchoolSimulationContextType | undefined>(undefined);

interface SchoolSimulationProviderProps {
  children: ReactNode;
  activeSchool: GovSchool;
  onSelectActiveSchool: (school: GovSchool) => void;
}

export const SchoolSimulationProvider: React.FC<SchoolSimulationProviderProps> = ({
  children,
  activeSchool,
  onSelectActiveSchool
}) => {
  const [selectedLgaState, setSelectedLgaState] = useState<BenueLGA>(activeSchool.lga);
  const [selectedPresetBySchool, setSelectedPresetBySchool] = useState<Record<string, string>>({});
  const [overridesBySchool, setOverridesBySchool] = useState<Record<string, Partial<SchoolLeadershipRoster>>>({});
  const [isLeadershipModalOpen, setIsLeadershipModalOpen] = useState(false);

  // Keep selectedLga synchronized with activeSchool.lga when activeSchool changes externally
  const selectedLga: BenueLGA = selectedLgaState || activeSchool.lga;

  const allStateSchools = useMemo(() => getAllBenueGovSchools(), []);

  const lgaSchools = useMemo(() => getSchoolsByLGA(selectedLga), [selectedLga]);

  const selectActiveSchool = useCallback(
    (school: GovSchool) => {
      setSelectedLgaState(school.lga);
      onSelectActiveSchool(school);
    },
    [onSelectActiveSchool]
  );

  const selectSchoolById = useCallback(
    (schoolId: string) => {
      const found = getGovSchoolById(schoolId) || allStateSchools.find((s) => s.id === schoolId);
      if (found) {
        selectActiveSchool(found);
      }
    },
    [allStateSchools, selectActiveSchool]
  );

  const selectLga = useCallback(
    (lga: BenueLGA, autoSelectFirstSchool = true) => {
      setSelectedLgaState(lga);
      if (autoSelectFirstSchool) {
        const schoolsInLga = getSchoolsByLGA(lga);
        if (schoolsInLga.length > 0) {
          onSelectActiveSchool(schoolsInLga[0]);
        }
      }
    },
    [onSelectActiveSchool]
  );

  const currentSchoolOverride = useMemo(
    () => overridesBySchool[activeSchool.id] || null,
    [overridesBySchool, activeSchool.id]
  );

  const selectedPresetId = useMemo(
    () => selectedPresetBySchool[activeSchool.id] || 'school-authentic',
    [selectedPresetBySchool, activeSchool.id]
  );

  const hasCustomOverride = useMemo(
    () => Boolean(currentSchoolOverride && Object.keys(currentSchoolOverride).length > 0),
    [currentSchoolOverride]
  );

  const leadershipRoster = useMemo(
    () => resolveSchoolLeadershipRoster(activeSchool, currentSchoolOverride),
    [activeSchool, currentSchoolOverride]
  );

  const dynamicOrganogram = useMemo(
    () => buildDynamicOrganogramForSchool(activeSchool, currentSchoolOverride),
    [activeSchool, currentSchoolOverride]
  );

  const applySimulationPreset = useCallback(
    (presetId: string, schoolId?: string) => {
      const targetId = schoolId || activeSchool.id;
      setSelectedPresetBySchool((prev) => ({ ...prev, [targetId]: presetId }));

      if (presetId === 'school-authentic') {
        setOverridesBySchool((prev) => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
        return;
      }

      const preset = SIMULATION_LEADERSHIP_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setOverridesBySchool((prev) => ({
          ...prev,
          [targetId]: {
            principalTitle: preset.principalTitle,
            principalName: preset.principalName,
            vicePrincipalAcademic: preset.vicePrincipalAcademic,
            bursarName: preset.bursarName,
            headmistressPrimary: preset.headmistressPrimary,
            headEarlyYears: preset.headEarlyYears,
            examOfficerName: preset.examOfficerName
          }
        }));
      }
    },
    [activeSchool.id]
  );

  const updateSchoolLeadershipOverride = useCallback(
    (override: Partial<SchoolLeadershipRoster>, schoolId?: string) => {
      const targetId = schoolId || activeSchool.id;
      setSelectedPresetBySchool((prev) => ({ ...prev, [targetId]: 'custom' }));
      setOverridesBySchool((prev) => ({
        ...prev,
        [targetId]: {
          ...(prev[targetId] || {}),
          ...override
        }
      }));
    },
    [activeSchool.id]
  );

  const resetSchoolLeadership = useCallback(
    (schoolId?: string) => {
      const targetId = schoolId || activeSchool.id;
      setSelectedPresetBySchool((prev) => ({ ...prev, [targetId]: 'school-authentic' }));
      setOverridesBySchool((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    },
    [activeSchool.id]
  );

  const value = useMemo<SchoolSimulationContextType>(
    () => ({
      activeSchool,
      selectActiveSchool,
      selectSchoolById,
      selectedLga,
      selectLga,
      lgaSchools,
      allStateSchools,
      leadershipRoster,
      dynamicOrganogram,
      selectedPresetId,
      presets: SIMULATION_LEADERSHIP_PRESETS,
      hasCustomOverride,
      applySimulationPreset,
      updateSchoolLeadershipOverride,
      resetSchoolLeadership,
      isLeadershipModalOpen,
      setIsLeadershipModalOpen
    }),
    [
      activeSchool,
      selectActiveSchool,
      selectSchoolById,
      selectedLga,
      selectLga,
      lgaSchools,
      allStateSchools,
      leadershipRoster,
      dynamicOrganogram,
      selectedPresetId,
      hasCustomOverride,
      applySimulationPreset,
      updateSchoolLeadershipOverride,
      resetSchoolLeadership,
      isLeadershipModalOpen
    ]
  );

  return (
    <SchoolSimulationContext.Provider value={value}>
      {children}
    </SchoolSimulationContext.Provider>
  );
};

export function useSchoolSimulation(): SchoolSimulationContextType {
  const ctx = useContext(SchoolSimulationContext);
  if (!ctx) {
    // Fallback if used outside provider
    const defaultSchool = BENUE_GOVERNMENT_SCHOOLS[0];
    const defaultRoster = resolveSchoolLeadershipRoster(defaultSchool, null);
    return {
      activeSchool: defaultSchool,
      selectActiveSchool: () => {},
      selectSchoolById: () => {},
      selectedLga: defaultSchool.lga,
      selectLga: () => {},
      lgaSchools: getSchoolsByLGA(defaultSchool.lga),
      allStateSchools: getAllBenueGovSchools(),
      leadershipRoster: defaultRoster,
      dynamicOrganogram: buildDynamicOrganogramForSchool(defaultSchool, null),
      selectedPresetId: 'school-authentic',
      presets: SIMULATION_LEADERSHIP_PRESETS,
      hasCustomOverride: false,
      applySimulationPreset: () => {},
      updateSchoolLeadershipOverride: () => {},
      resetSchoolLeadership: () => {},
      isLeadershipModalOpen: false,
      setIsLeadershipModalOpen: () => {}
    };
  }
  return ctx;
}

export { BENUE_LGAS_METADATA };
