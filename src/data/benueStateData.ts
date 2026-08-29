import { 
  BenueLGA, 
  SenatorialZone, 
  LGAMetadata, 
  GovSchool 
} from '../types';

// ==================== ALL 23 BENUE STATE LOCAL GOVERNMENTS ====================

export const BENUE_LGAS_METADATA: LGAMetadata[] = [
  // Zone A (Benue North-East)
  {
    lga: 'Katsina-Ala',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Katsina-Ala',
    educationSecretary: 'Dr. Terver James Akaa',
    totalGovernmentSchools: 14,
    totalStudentPopulation: 11840,
    totalTeacherCount: 462,
    averagePassRate: 79.4,
    subventionDisbursedNaira: 42500000,
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Konshisha',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Tse-Agberagba',
    educationSecretary: 'Mrs. Dooshima Comfort Iorliam',
    totalGovernmentSchools: 11,
    totalStudentPopulation: 8920,
    totalTeacherCount: 318,
    averagePassRate: 73.1,
    subventionDisbursedNaira: 31200000,
    priorityFlag: 'Normal'
  },
  {
    lga: 'Kwande',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Adikpo (London of Benue)',
    educationSecretary: 'Hon. Shima Clement Ugba',
    totalGovernmentSchools: 15,
    totalStudentPopulation: 13400,
    totalTeacherCount: 490,
    averagePassRate: 81.2,
    subventionDisbursedNaira: 48000000,
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Logo',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Ugba',
    educationSecretary: 'Mr. Emmanuel Terna Tyokyaa',
    totalGovernmentSchools: 9,
    totalStudentPopulation: 6840,
    totalTeacherCount: 245,
    averagePassRate: 68.4,
    subventionDisbursedNaira: 27500000,
    priorityFlag: 'Intervention Required'
  },
  {
    lga: 'Ukum',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Zaki Biam',
    educationSecretary: 'Chief Aondoakaa David Msugh',
    totalGovernmentSchools: 10,
    totalStudentPopulation: 7650,
    totalTeacherCount: 260,
    averagePassRate: 67.2,
    subventionDisbursedNaira: 29000000,
    priorityFlag: 'Needs Attention'
  },
  {
    lga: 'Ushongo',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Lessel',
    educationSecretary: 'Mrs. Bridget Nguvan Chia',
    totalGovernmentSchools: 12,
    totalStudentPopulation: 9810,
    totalTeacherCount: 354,
    averagePassRate: 76.5,
    subventionDisbursedNaira: 34800000,
    priorityFlag: 'Normal'
  },
  {
    lga: 'Vandeikya',
    zone: 'Zone A (Benue North-East)',
    headquarters: 'Vandeikya',
    educationSecretary: 'Dr. Joseph Vershima Kator',
    totalGovernmentSchools: 16,
    totalStudentPopulation: 14200,
    totalTeacherCount: 520,
    averagePassRate: 83.8,
    subventionDisbursedNaira: 51200000,
    priorityFlag: 'Excellence Zone'
  },

  // Zone B (Benue North-West)
  {
    lga: 'Buruku',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Buruku',
    educationSecretary: 'Mr. Terungwa Moses Agber',
    totalGovernmentSchools: 10,
    totalStudentPopulation: 7920,
    totalTeacherCount: 285,
    averagePassRate: 71.8,
    subventionDisbursedNaira: 30000000,
    priorityFlag: 'Normal'
  },
  {
    lga: 'Gboko',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Gboko (Traditional Capital)',
    educationSecretary: 'Prof. Gabriel Aondover Chia',
    totalGovernmentSchools: 22,
    totalStudentPopulation: 23150,
    totalTeacherCount: 840,
    averagePassRate: 85.6,
    subventionDisbursedNaira: 76500000,
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Guma',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Gbajimba',
    educationSecretary: 'Hon. Benjamin Terhemba Hembafan',
    totalGovernmentSchools: 8,
    totalStudentPopulation: 5890,
    totalTeacherCount: 215,
    averagePassRate: 64.9,
    subventionDisbursedNaira: 24000000,
    priorityFlag: 'Intervention Required'
  },
  {
    lga: 'Gwer East',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Aliade',
    educationSecretary: 'Mrs. Monica Member Tarkumbur',
    totalGovernmentSchools: 13,
    totalStudentPopulation: 10540,
    totalTeacherCount: 390,
    averagePassRate: 77.2,
    subventionDisbursedNaira: 38000000,
    priorityFlag: 'Normal'
  },
  {
    lga: 'Gwer West',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Naka',
    educationSecretary: 'Mr. Francis Iorwuese Tyough',
    totalGovernmentSchools: 9,
    totalStudentPopulation: 6980,
    totalTeacherCount: 250,
    averagePassRate: 69.5,
    subventionDisbursedNaira: 26800000,
    priorityFlag: 'Needs Attention'
  },
  {
    lga: 'Makurdi',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Makurdi (State Capital)',
    educationSecretary: 'Dr. (Mrs.) Helen Ngodoo Tsegba',
    totalGovernmentSchools: 26,
    totalStudentPopulation: 29400,
    totalTeacherCount: 1120,
    averagePassRate: 88.3,
    subventionDisbursedNaira: 98000000,
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Tarka',
    zone: 'Zone B (Benue North-West)',
    headquarters: 'Wannune',
    educationSecretary: 'Hon. Simon Terkula Waniko',
    totalGovernmentSchools: 8,
    totalStudentPopulation: 6200,
    totalTeacherCount: 228,
    averagePassRate: 74.0,
    subventionDisbursedNaira: 25500000,
    priorityFlag: 'Normal'
  },

  // Zone C (Benue South)
  {
    lga: 'Ado',
    zone: 'Zone C (Benue South)',
    headquarters: 'Igumale',
    educationSecretary: 'Elder Sunday Ogbu Onu',
    totalGovernmentSchools: 9,
    totalStudentPopulation: 6720,
    totalTeacherCount: 236,
    averagePassRate: 70.8,
    subventionDisbursedNaira: 27000000,
    priorityFlag: 'Needs Attention'
  },
  {
    lga: 'Agatu',
    zone: 'Zone C (Benue South)',
    headquarters: 'Obagaji',
    educationSecretary: 'Mr. Suleiman Audu Ejembi',
    totalGovernmentSchools: 7,
    totalStudentPopulation: 5180,
    totalTeacherCount: 195,
    averagePassRate: 65.4,
    subventionDisbursedNaira: 22500000,
    priorityFlag: 'Intervention Required'
  },
  {
    lga: 'Apa',
    zone: 'Zone C (Benue South)',
    headquarters: 'Ugbokpo',
    educationSecretary: 'Mrs. Grace Ene Ochigbo',
    totalGovernmentSchools: 8,
    totalStudentPopulation: 6110,
    totalTeacherCount: 218,
    averagePassRate: 72.3,
    subventionDisbursedNaira: 24800000,
    priorityFlag: 'Normal'
  },
  {
    lga: 'Obi',
    zone: 'Zone C (Benue South)',
    headquarters: 'Obarike-Ito',
    educationSecretary: 'Mr. Joseph Ocheje Ode',
    totalGovernmentSchools: 7,
    totalStudentPopulation: 5430,
    totalTeacherCount: 202,
    averagePassRate: 71.0,
    subventionDisbursedNaira: 23200000,
    priorityFlag: 'Normal'
  },
  {
    lga: 'Ogbadibo',
    zone: 'Zone C (Benue South)',
    headquarters: 'Otukpa',
    educationSecretary: 'Hon. Peter Idoko Abah',
    totalGovernmentSchools: 12,
    totalStudentPopulation: 9340,
    totalTeacherCount: 340,
    averagePassRate: 78.6,
    subventionDisbursedNaira: 35000000,
    priorityFlag: 'Normal'
  },
  {
    lga: 'Ohimini',
    zone: 'Zone C (Benue South)',
    headquarters: 'Idekpa',
    educationSecretary: 'Mrs. Mary Onyeche Agbo',
    totalGovernmentSchools: 8,
    totalStudentPopulation: 5980,
    totalTeacherCount: 214,
    averagePassRate: 73.9,
    subventionDisbursedNaira: 25000000,
    priorityFlag: 'Normal'
  },
  {
    lga: 'Oju',
    zone: 'Zone C (Benue South)',
    headquarters: 'Oju',
    educationSecretary: 'Dr. Michael Ikape Ominyi',
    totalGovernmentSchools: 13,
    totalStudentPopulation: 10850,
    totalTeacherCount: 382,
    averagePassRate: 77.8,
    subventionDisbursedNaira: 39500000,
    priorityFlag: 'Normal'
  },
  {
    lga: 'Okpokwu',
    zone: 'Zone C (Benue South)',
    headquarters: 'Okpoga',
    educationSecretary: 'Mr. Godwin Enokela Uloko',
    totalGovernmentSchools: 14,
    totalStudentPopulation: 11200,
    totalTeacherCount: 410,
    averagePassRate: 80.1,
    subventionDisbursedNaira: 43000000,
    priorityFlag: 'Excellence Zone'
  },
  {
    lga: 'Otukpo',
    zone: 'Zone C (Benue South)',
    headquarters: 'Otukpo (Heartland of Idoma)',
    educationSecretary: 'Chief (Mrs.) Victoria Ene Adaji',
    totalGovernmentSchools: 20,
    totalStudentPopulation: 19800,
    totalTeacherCount: 715,
    averagePassRate: 84.9,
    subventionDisbursedNaira: 69000000,
    priorityFlag: 'Excellence Zone'
  }
];

// ==================== ALL GOVERNMENT SCHOOLS DATABASE ====================

export const BENUE_GOVERNMENT_SCHOOLS: GovSchool[] = [
  // 1. MAKURDI LGA
  {
    id: 'SCH-MKD-001',
    code: 'BNS-MKD-001',
    name: 'Government College Makurdi',
    lga: 'Makurdi',
    zone: 'Zone B (Benue North-West)',
    category: 'Senior Secondary College',
    principalName: 'Dr. Matthew Ternenge Beeun (FSTAN)',
    vicePrincipalAcademic: 'Mrs. Blessing Aondoaver (M.Ed)',
    bursarName: 'Mr. Jude Msugh Iorliam (CNA)',
    phone: '+234 811 523 1834',
    email: 'gcmakurdi@benue.gov.ng',
    address: 'Old GRA / Wurukum Expressway, Makurdi, Benue State',
    establishedYear: 1976,
    totalStudents: 1680,
    maleStudents: 910,
    femaleStudents: 770,
    boardingStudents: 940,
    dayStudents: 740,
    specialNeedsStudents: 14,
    totalTeachers: 68,
    trcnCertifiedTeachers: 62,
    nonAcademicStaff: 24,
    teacherStudentRatio: '1:25',
    totalClassrooms: 36,
    studentCapacityUtilization: 93,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 14:30:00'
    },
    teacherKPIs: {
      attendanceRate: 94.8,
      punctualityScore: 92.4,
      lessonNoteSubmissionRate: 97.2,
      curriculumCoverageRate: 82.5,
      trcnComplianceRate: 91.2,
      qualificationBreakdown: { nce: 6, bsc_bed: 48, msc_med: 12, phd: 2 },
      topPerformingDepartments: ['Science & Mathematics', 'Technical & Vocational', 'Languages'],
      teacherDeficitSubjects: ['Further Mathematics', 'Technical Drawing'],
      averageWeeklyWorkloadPeriods: 18,
      lastVettingDate: '2026-08-25',
      staffCommendationCount: 8,
      staffQueryCount: 1
    },
    studentKPIs: {
      overallPassRate: 88.6,
      averageScore: 74.2,
      waecBenchmarkPassRate: 86.4,
      becePassRate: 91.0,
      attendanceRate: 95.2,
      dropoutRiskCount: 2,
      genderParityIndex: 0.85,
      gradeDistribution: { distinctions: 340, credits: 980, passes: 290, fails: 70 },
      scienceEnrollmentPercentage: 58.4,
      topPerformingSubjects: ['Physics', 'Chemistry', 'English Language', 'Computer Studies', 'Agricultural Science'],
      subjectsRequiringIntervention: ['Further Mathematics', 'French Language'],
      scholarshipRecipientsCount: 38
    },
    financialStatement: {
      stateSubventionAllocated: 14500000,
      stateSubventionDisbursed: 14500000,
      ptaLevyTarget: 8400000,
      ptaLevyCollected: 7980000,
      examinationFeesRemitted: 5200000,
      specialGrantReceived: 3500000,
      instructionalMaterialsExp: 3200000,
      labConsumablesExp: 2900000,
      facilityMaintenanceExp: 2400000,
      utilitiesAndSecurityExp: 1850000,
      sportsAndCoCurricularExp: 950000,
      staffWelfareAndAllowances: 1600000,
      totalRevenue: 31580000,
      totalExpenditure: 24900000,
      netOperatingBalance: 6680000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-15',
      auditorRemarks: 'Bursary accounts reconciled with zero variances. Laboratory grants appropriately expended.',
      bursarName: 'Mr. Jude Msugh Iorliam (CNA)'
    },
    governingBodyReview: {
      stateRanking: 1,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 26,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 5,
        scienceLabs: 5,
        ictCenter: 5,
        library: 4,
        sportsFacilities: 5,
        waterAndSanitation: 4,
        perimeterSecurity: 5,
        powerSupplyCondition: 'Grid & Solar Backup'
      },
      keyInterventionAlerts: [
        'Roofing refurbishment needed for Technical Workshop Annex B',
        'Request 2 additional TRCN-certified Physics & Further Math teachers'
      ],
      headquarterInspectionRemarks: 'Exemplary flagship state college. Top WAEC/JAMB scores statewide. Highly organized broadsheets and continuous assessment records.',
      governorBriefRecommendation: 'Recommend as the designated Center of Academic Excellence for the Benue State STEM Innovation Initiative.',
      governorPriorityFlag: 'Stable & Exemplary',
      lastHqInspectionDate: '2026-08-20',
      zonalInspectorName: 'Dr. Helen Ngodoo Tsegba'
    }
  },
  {
    id: 'SCH-MKD-002',
    code: 'BNS-MKD-002',
    name: 'Special Science Senior Secondary School Makurdi',
    lga: 'Makurdi',
    zone: 'Zone B (Benue North-West)',
    category: 'Special Science Secondary School',
    principalName: 'Engr. Terkula Joseph Damsa',
    vicePrincipalAcademic: 'Mr. Isaac Kwaghtagher',
    bursarName: 'Mrs. Patience Eneche',
    phone: '+234 803 445 9912',
    email: 'ssss.makurdi@benue.gov.ng',
    address: 'High Level, Makurdi, Benue State',
    establishedYear: 1988,
    totalStudents: 1120,
    maleStudents: 600,
    femaleStudents: 520,
    boardingStudents: 780,
    dayStudents: 340,
    specialNeedsStudents: 6,
    totalTeachers: 48,
    trcnCertifiedTeachers: 45,
    nonAcademicStaff: 18,
    teacherStudentRatio: '1:23',
    totalClassrooms: 24,
    studentCapacityUtilization: 96,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 12:00:00'
    },
    teacherKPIs: {
      attendanceRate: 96.2,
      punctualityScore: 94.0,
      lessonNoteSubmissionRate: 98.5,
      curriculumCoverageRate: 85.0,
      trcnComplianceRate: 93.8,
      qualificationBreakdown: { nce: 2, bsc_bed: 36, msc_med: 9, phd: 1 },
      topPerformingDepartments: ['Science & Mathematics', 'ICT & Robotics'],
      teacherDeficitSubjects: ['Biology Lab Technologist'],
      averageWeeklyWorkloadPeriods: 16,
      lastVettingDate: '2026-08-24',
      staffCommendationCount: 11,
      staffQueryCount: 0
    },
    studentKPIs: {
      overallPassRate: 92.4,
      averageScore: 78.5,
      waecBenchmarkPassRate: 91.2,
      becePassRate: 95.0,
      attendanceRate: 97.0,
      dropoutRiskCount: 0,
      genderParityIndex: 0.87,
      gradeDistribution: { distinctions: 310, credits: 670, passes: 110, fails: 30 },
      scienceEnrollmentPercentage: 100.0,
      topPerformingSubjects: ['Chemistry', 'Physics', 'Biology', 'General Mathematics', 'Data Processing'],
      subjectsRequiringIntervention: ['Civic Education'],
      scholarshipRecipientsCount: 52
    },
    financialStatement: {
      stateSubventionAllocated: 12000000,
      stateSubventionDisbursed: 12000000,
      ptaLevyTarget: 6200000,
      ptaLevyCollected: 6100000,
      examinationFeesRemitted: 4800000,
      specialGrantReceived: 5000000,
      instructionalMaterialsExp: 3800000,
      labConsumablesExp: 4200000,
      facilityMaintenanceExp: 1800000,
      utilitiesAndSecurityExp: 1600000,
      sportsAndCoCurricularExp: 750000,
      staffWelfareAndAllowances: 1400000,
      totalRevenue: 28000000,
      totalExpenditure: 21550000,
      netOperatingBalance: 6450000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-18',
      auditorRemarks: 'Science reagents and ICT hardware inventory properly documented and audited.',
      bursarName: 'Mrs. Patience Eneche'
    },
    governingBodyReview: {
      stateRanking: 2,
      totalSchoolsInState: 115,
      lgaRanking: 2,
      totalSchoolsInLGA: 26,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 5,
        scienceLabs: 5,
        ictCenter: 5,
        library: 5,
        sportsFacilities: 4,
        waterAndSanitation: 4,
        perimeterSecurity: 5,
        powerSupplyCondition: 'Solar Primary'
      },
      keyInterventionAlerts: [
        'Procure 30 additional laptops for Computer Based Test (CBT) Center'
      ],
      headquarterInspectionRemarks: 'Pristine science facilities. 100% student enrollment in pure science and engineering tracks.',
      governorBriefRecommendation: 'Governor to commend staff for leading national Science Olympiad competitions.',
      governorPriorityFlag: 'Stable & Exemplary',
      lastHqInspectionDate: '2026-08-21',
      zonalInspectorName: 'Dr. Helen Ngodoo Tsegba'
    }
  },

  // 2. GBOKO LGA
  {
    id: 'SCH-GBK-001',
    code: 'BNS-GBK-001',
    name: 'Government College Gboko',
    lga: 'Gboko',
    zone: 'Zone B (Benue North-West)',
    category: 'Senior Secondary College',
    principalName: 'Chief Tor Gboko Emmanuel Terzungwe',
    vicePrincipalAcademic: 'Mrs. Victoria Nguwasen Akor',
    bursarName: 'Mr. Solomon Aondover',
    phone: '+234 805 771 2289',
    email: 'gcgboko@benue.gov.ng',
    address: 'Captain Downes Road, Gboko, Benue State',
    establishedYear: 1978,
    totalStudents: 1540,
    maleStudents: 820,
    femaleStudents: 720,
    boardingStudents: 850,
    dayStudents: 690,
    specialNeedsStudents: 8,
    totalTeachers: 60,
    trcnCertifiedTeachers: 54,
    nonAcademicStaff: 22,
    teacherStudentRatio: '1:26',
    totalClassrooms: 32,
    studentCapacityUtilization: 91,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-27 16:15:00'
    },
    teacherKPIs: {
      attendanceRate: 93.5,
      punctualityScore: 91.0,
      lessonNoteSubmissionRate: 95.0,
      curriculumCoverageRate: 80.2,
      trcnComplianceRate: 90.0,
      qualificationBreakdown: { nce: 8, bsc_bed: 42, msc_med: 9, phd: 1 },
      topPerformingDepartments: ['Humanities & Arts', 'Science & Mathematics', 'Business Studies'],
      teacherDeficitSubjects: ['Government', 'Literature in English'],
      averageWeeklyWorkloadPeriods: 19,
      lastVettingDate: '2026-08-23',
      staffCommendationCount: 7,
      staffQueryCount: 2
    },
    studentKPIs: {
      overallPassRate: 86.2,
      averageScore: 72.8,
      waecBenchmarkPassRate: 83.5,
      becePassRate: 89.0,
      attendanceRate: 94.0,
      dropoutRiskCount: 3,
      genderParityIndex: 0.88,
      gradeDistribution: { distinctions: 280, credits: 910, passes: 260, fails: 90 },
      scienceEnrollmentPercentage: 52.0,
      topPerformingSubjects: ['General Mathematics', 'Economics', 'Government', 'Chemistry', 'Agricultural Science'],
      subjectsRequiringIntervention: ['Literature in English', 'Technical Drawing'],
      scholarshipRecipientsCount: 29
    },
    financialStatement: {
      stateSubventionAllocated: 13800000,
      stateSubventionDisbursed: 13800000,
      ptaLevyTarget: 7700000,
      ptaLevyCollected: 7300000,
      examinationFeesRemitted: 4900000,
      specialGrantReceived: 2800000,
      instructionalMaterialsExp: 2900000,
      labConsumablesExp: 2500000,
      facilityMaintenanceExp: 2200000,
      utilitiesAndSecurityExp: 1700000,
      sportsAndCoCurricularExp: 900000,
      staffWelfareAndAllowances: 1500000,
      totalRevenue: 29200000,
      totalExpenditure: 23100000,
      netOperatingBalance: 6100000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-14',
      auditorRemarks: 'Bursary registers audited with satisfactory compliance.',
      bursarName: 'Mr. Solomon Aondover'
    },
    governingBodyReview: {
      stateRanking: 3,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 22,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 4,
        scienceLabs: 4,
        ictCenter: 4,
        library: 4,
        sportsFacilities: 5,
        waterAndSanitation: 4,
        perimeterSecurity: 4,
        powerSupplyCondition: 'Grid & Solar Backup'
      },
      keyInterventionAlerts: [
        'Deploy 2 additional Literature and History graduate teachers',
        'Hostel drainage expansion before rainy season peak'
      ],
      headquarterInspectionRemarks: 'Strong academic culture and sports discipline. High community respect in Tivland.',
      governorBriefRecommendation: 'Approved for solar micro-grid pilot program by the State Ministry of Energy.',
      governorPriorityFlag: 'Stable & Exemplary',
      lastHqInspectionDate: '2026-08-19',
      zonalInspectorName: 'Prof. Gabriel Aondover Chia'
    }
  },
  {
    id: 'SCH-GBK-002',
    code: 'BNS-GBK-002',
    name: 'Government Technical College Gboko',
    lga: 'Gboko',
    zone: 'Zone B (Benue North-West)',
    category: 'Technical & Vocational College',
    principalName: 'Engr. Daniel Iorbee',
    vicePrincipalAcademic: 'Mr. Kenneth Msughter',
    bursarName: 'Mrs. Deborah Ugba',
    phone: '+234 802 884 1902',
    email: 'gtcgboko@benue.gov.ng',
    address: 'Mkar Road, Gboko, Benue State',
    establishedYear: 1982,
    totalStudents: 980,
    maleStudents: 680,
    femaleStudents: 300,
    boardingStudents: 520,
    dayStudents: 460,
    specialNeedsStudents: 5,
    totalTeachers: 42,
    trcnCertifiedTeachers: 36,
    nonAcademicStaff: 20,
    teacherStudentRatio: '1:23',
    totalClassrooms: 22,
    studentCapacityUtilization: 88,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 09:30:00'
    },
    teacherKPIs: {
      attendanceRate: 91.0,
      punctualityScore: 89.5,
      lessonNoteSubmissionRate: 93.0,
      curriculumCoverageRate: 78.4,
      trcnComplianceRate: 85.7,
      qualificationBreakdown: { nce: 10, bsc_bed: 26, msc_med: 5, phd: 1 },
      topPerformingDepartments: ['Vocational & Technical', 'Applied Sciences'],
      teacherDeficitSubjects: ['Automobile Mechanics', 'Electrical Installation'],
      averageWeeklyWorkloadPeriods: 20,
      lastVettingDate: '2026-08-22',
      staffCommendationCount: 5,
      staffQueryCount: 1
    },
    studentKPIs: {
      overallPassRate: 82.5,
      averageScore: 70.1,
      waecBenchmarkPassRate: 79.0,
      becePassRate: 86.5,
      attendanceRate: 92.5,
      dropoutRiskCount: 4,
      genderParityIndex: 0.44,
      gradeDistribution: { distinctions: 160, credits: 580, passes: 190, fails: 50 },
      scienceEnrollmentPercentage: 45.0,
      topPerformingSubjects: ['Technical Drawing', 'General Metalwork', 'Woodwork', 'Basic Electricity', 'General Mathematics'],
      subjectsRequiringIntervention: ['English Language', 'Physics'],
      scholarshipRecipientsCount: 22
    },
    financialStatement: {
      stateSubventionAllocated: 11500000,
      stateSubventionDisbursed: 11500000,
      ptaLevyTarget: 4900000,
      ptaLevyCollected: 4500000,
      examinationFeesRemitted: 3600000,
      specialGrantReceived: 4200000,
      instructionalMaterialsExp: 2600000,
      labConsumablesExp: 3800000,
      facilityMaintenanceExp: 2500000,
      utilitiesAndSecurityExp: 1400000,
      sportsAndCoCurricularExp: 600000,
      staffWelfareAndAllowances: 1100000,
      totalRevenue: 23800000,
      totalExpenditure: 19600000,
      netOperatingBalance: 4200000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-10',
      auditorRemarks: 'Workshop machinery acquisition and fuel expenditure fully verified.',
      bursarName: 'Mrs. Deborah Ugba'
    },
    governingBodyReview: {
      stateRanking: 8,
      totalSchoolsInState: 115,
      lgaRanking: 2,
      totalSchoolsInLGA: 22,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 4,
        scienceLabs: 4,
        ictCenter: 4,
        library: 3,
        sportsFacilities: 4,
        waterAndSanitation: 3,
        perimeterSecurity: 4,
        powerSupplyCondition: 'Generator Only'
      },
      keyInterventionAlerts: [
        'Upgrade heavy woodworking machinery in Block 3',
        'Boost female student enrollment in technical crafts'
      ],
      headquarterInspectionRemarks: 'Outstanding technical skills production. Students fabricated school desks for surrounding primary schools.',
      governorBriefRecommendation: 'Recommend partnership with Industrial Training Fund (ITF) for student stipend support.',
      governorPriorityFlag: 'Needs Infrastructure Upgrade',
      lastHqInspectionDate: '2026-08-16',
      zonalInspectorName: 'Prof. Gabriel Aondover Chia'
    }
  },

  // 3. OTUKPO LGA
  {
    id: 'SCH-OTK-001',
    code: 'BNS-OTK-001',
    name: 'Government Secondary School Otukpo',
    lga: 'Otukpo',
    zone: 'Zone C (Benue South)',
    category: 'Senior Secondary College',
    principalName: 'Chief Michael Ochefu Ochigbo (FCAI)',
    vicePrincipalAcademic: 'Mrs. Christiana Ene Audu',
    bursarName: 'Mr. Emmanuel Oche',
    phone: '+234 803 762 1190',
    email: 'gssotukpo@benue.gov.ng',
    address: 'Federal Polytechnic Road, Otukpo, Benue State',
    establishedYear: 1974,
    totalStudents: 1490,
    maleStudents: 780,
    femaleStudents: 710,
    boardingStudents: 720,
    dayStudents: 770,
    specialNeedsStudents: 9,
    totalTeachers: 58,
    trcnCertifiedTeachers: 53,
    nonAcademicStaff: 21,
    teacherStudentRatio: '1:25',
    totalClassrooms: 30,
    studentCapacityUtilization: 92,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 11:45:00'
    },
    teacherKPIs: {
      attendanceRate: 94.2,
      punctualityScore: 92.0,
      lessonNoteSubmissionRate: 96.5,
      curriculumCoverageRate: 81.6,
      trcnComplianceRate: 91.4,
      qualificationBreakdown: { nce: 7, bsc_bed: 40, msc_med: 10, phd: 1 },
      topPerformingDepartments: ['Science & Mathematics', 'Humanities & Arts', 'Commercial Studies'],
      teacherDeficitSubjects: ['Agricultural Science Teacher'],
      averageWeeklyWorkloadPeriods: 18,
      lastVettingDate: '2026-08-24',
      staffCommendationCount: 8,
      staffQueryCount: 1
    },
    studentKPIs: {
      overallPassRate: 87.4,
      averageScore: 73.6,
      waecBenchmarkPassRate: 85.0,
      becePassRate: 90.2,
      attendanceRate: 95.0,
      dropoutRiskCount: 2,
      genderParityIndex: 0.91,
      gradeDistribution: { distinctions: 295, credits: 890, passes: 245, fails: 60 },
      scienceEnrollmentPercentage: 54.0,
      topPerformingSubjects: ['Biology', 'English Language', 'Financial Accounting', 'Government', 'General Mathematics'],
      subjectsRequiringIntervention: ['Physics Practical', 'Yoruba/Hausa'],
      scholarshipRecipientsCount: 34
    },
    financialStatement: {
      stateSubventionAllocated: 13500000,
      stateSubventionDisbursed: 13500000,
      ptaLevyTarget: 7450000,
      ptaLevyCollected: 7100000,
      examinationFeesRemitted: 4600000,
      specialGrantReceived: 3000000,
      instructionalMaterialsExp: 2800000,
      labConsumablesExp: 2600000,
      facilityMaintenanceExp: 2100000,
      utilitiesAndSecurityExp: 1650000,
      sportsAndCoCurricularExp: 850000,
      staffWelfareAndAllowances: 1450000,
      totalRevenue: 28650000,
      totalExpenditure: 22500000,
      netOperatingBalance: 6150000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-16',
      auditorRemarks: 'Bursary ledgers up to date. Excellent fee tracking record.',
      bursarName: 'Mr. Emmanuel Oche'
    },
    governingBodyReview: {
      stateRanking: 4,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 20,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 5,
        scienceLabs: 4,
        ictCenter: 4,
        library: 4,
        sportsFacilities: 4,
        waterAndSanitation: 4,
        perimeterSecurity: 5,
        powerSupplyCondition: 'Grid & Solar Backup'
      },
      keyInterventionAlerts: [
        'Procure modern microscopes and spectrophotometer for Biology lab'
      ],
      headquarterInspectionRemarks: 'Leading government secondary school in Zone C. Strong academic results and functional PTA.',
      governorBriefRecommendation: 'Commend principal for fiscal transparency and consistent above-average WAEC pass rate.',
      governorPriorityFlag: 'Stable & Exemplary',
      lastHqInspectionDate: '2026-08-22',
      zonalInspectorName: 'Chief (Mrs.) Victoria Ene Adaji'
    }
  },

  // 4. KATSINA-ALA LGA
  {
    id: 'SCH-KTA-001',
    code: 'BNS-KTA-001',
    name: 'Government College Katsina-Ala',
    lga: 'Katsina-Ala',
    zone: 'Zone A (Benue North-East)',
    category: 'Senior Secondary College',
    principalName: 'Dr. Joseph Tersoo Shima',
    vicePrincipalAcademic: 'Mr. Isaac Aondoakaa',
    bursarName: 'Mrs. Faith Ngoundu',
    phone: '+234 803 559 8721',
    email: 'gckatsinaala@benue.gov.ng',
    address: 'Old Wukari Road, Katsina-Ala, Benue State',
    establishedYear: 1914, // Historic premier college in Northern Nigeria
    totalStudents: 1620,
    maleStudents: 920,
    femaleStudents: 700,
    boardingStudents: 980,
    dayStudents: 640,
    specialNeedsStudents: 7,
    totalTeachers: 64,
    trcnCertifiedTeachers: 58,
    nonAcademicStaff: 25,
    teacherStudentRatio: '1:25',
    totalClassrooms: 34,
    studentCapacityUtilization: 94,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 15:00:00'
    },
    teacherKPIs: {
      attendanceRate: 95.1,
      punctualityScore: 93.0,
      lessonNoteSubmissionRate: 97.0,
      curriculumCoverageRate: 83.2,
      trcnComplianceRate: 90.6,
      qualificationBreakdown: { nce: 5, bsc_bed: 45, msc_med: 12, phd: 2 },
      topPerformingDepartments: ['Science & Mathematics', 'Humanities & Arts'],
      teacherDeficitSubjects: ['Computer Science Specialist'],
      averageWeeklyWorkloadPeriods: 17,
      lastVettingDate: '2026-08-25',
      staffCommendationCount: 9,
      staffQueryCount: 1
    },
    studentKPIs: {
      overallPassRate: 89.1,
      averageScore: 75.0,
      waecBenchmarkPassRate: 87.2,
      becePassRate: 92.5,
      attendanceRate: 95.8,
      dropoutRiskCount: 1,
      genderParityIndex: 0.76,
      gradeDistribution: { distinctions: 330, credits: 940, passes: 280, fails: 70 },
      scienceEnrollmentPercentage: 56.0,
      topPerformingSubjects: ['General Mathematics', 'Chemistry', 'Physics', 'History', 'Civic Education'],
      subjectsRequiringIntervention: ['Economics', 'Data Processing'],
      scholarshipRecipientsCount: 41
    },
    financialStatement: {
      stateSubventionAllocated: 14000000,
      stateSubventionDisbursed: 14000000,
      ptaLevyTarget: 8100000,
      ptaLevyCollected: 7800000,
      examinationFeesRemitted: 5000000,
      specialGrantReceived: 3200000,
      instructionalMaterialsExp: 3100000,
      labConsumablesExp: 2800000,
      facilityMaintenanceExp: 2300000,
      utilitiesAndSecurityExp: 1800000,
      sportsAndCoCurricularExp: 900000,
      staffWelfareAndAllowances: 1550000,
      totalRevenue: 30300000,
      totalExpenditure: 24200000,
      netOperatingBalance: 6100000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-17',
      auditorRemarks: 'Historic institution heritage maintenance funds judiciously accounted for.',
      bursarName: 'Mrs. Faith Ngoundu'
    },
    governingBodyReview: {
      stateRanking: 5,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 14,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 5,
        scienceLabs: 5,
        ictCenter: 4,
        library: 5,
        sportsFacilities: 5,
        waterAndSanitation: 4,
        perimeterSecurity: 5,
        powerSupplyCondition: 'Grid & Solar Backup'
      },
      keyInterventionAlerts: [
        'Complete perimeter fence reinforcement along the eastern agricultural farm boundary'
      ],
      headquarterInspectionRemarks: 'Historic premier college of the state. Outstanding academic discipline, alumni endowment support, and agricultural farm productivity.',
      governorBriefRecommendation: 'Governor to consider special heritage restoration grant for century-old administrative block.',
      governorPriorityFlag: 'Stable & Exemplary',
      lastHqInspectionDate: '2026-08-21',
      zonalInspectorName: 'Dr. Terver James Akaa'
    }
  },

  // 5. KWANDE LGA
  {
    id: 'SCH-KWD-001',
    code: 'BNS-KWD-001',
    name: 'Government College Adikpo',
    lga: 'Kwande',
    zone: 'Zone A (Benue North-East)',
    category: 'Senior Secondary College',
    principalName: 'Mr. Clement Terkura Igbana',
    vicePrincipalAcademic: 'Mrs. Comfort Sewuese Tyowua',
    bursarName: 'Mr. David Aondo',
    phone: '+234 812 334 9081',
    email: 'gcadikpo@benue.gov.ng',
    address: 'Jato-Aka Road, Adikpo, Kwande LGA, Benue State',
    establishedYear: 1980,
    totalStudents: 1350,
    maleStudents: 710,
    femaleStudents: 640,
    boardingStudents: 680,
    dayStudents: 670,
    specialNeedsStudents: 5,
    totalTeachers: 52,
    trcnCertifiedTeachers: 47,
    nonAcademicStaff: 19,
    teacherStudentRatio: '1:26',
    totalClassrooms: 28,
    studentCapacityUtilization: 90,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 10:00:00'
    },
    teacherKPIs: {
      attendanceRate: 93.8,
      punctualityScore: 91.5,
      lessonNoteSubmissionRate: 95.8,
      curriculumCoverageRate: 80.5,
      trcnComplianceRate: 90.3,
      qualificationBreakdown: { nce: 6, bsc_bed: 37, msc_med: 8, phd: 1 },
      topPerformingDepartments: ['Science & Mathematics', 'Humanities & Arts'],
      teacherDeficitSubjects: ['Geography Teacher'],
      averageWeeklyWorkloadPeriods: 18,
      lastVettingDate: '2026-08-23',
      staffCommendationCount: 6,
      staffQueryCount: 1
    },
    studentKPIs: {
      overallPassRate: 85.0,
      averageScore: 72.1,
      waecBenchmarkPassRate: 82.4,
      becePassRate: 88.6,
      attendanceRate: 94.2,
      dropoutRiskCount: 3,
      genderParityIndex: 0.90,
      gradeDistribution: { distinctions: 240, credits: 810, passes: 230, fails: 70 },
      scienceEnrollmentPercentage: 51.0,
      topPerformingSubjects: ['Agricultural Science', 'Biology', 'English Language', 'General Mathematics', 'CRS'],
      subjectsRequiringIntervention: ['Chemistry Practical', 'Geography'],
      scholarshipRecipientsCount: 26
    },
    financialStatement: {
      stateSubventionAllocated: 12500000,
      stateSubventionDisbursed: 12500000,
      ptaLevyTarget: 6750000,
      ptaLevyCollected: 6400000,
      examinationFeesRemitted: 4100000,
      specialGrantReceived: 2500000,
      instructionalMaterialsExp: 2600000,
      labConsumablesExp: 2300000,
      facilityMaintenanceExp: 1950000,
      utilitiesAndSecurityExp: 1500000,
      sportsAndCoCurricularExp: 800000,
      staffWelfareAndAllowances: 1300000,
      totalRevenue: 25750000,
      totalExpenditure: 20250000,
      netOperatingBalance: 5500000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-12',
      auditorRemarks: 'Bursary accounts reconciled. Good expenditure management.',
      bursarName: 'Mr. David Aondo'
    },
    governingBodyReview: {
      stateRanking: 6,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 15,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 4,
        scienceLabs: 4,
        ictCenter: 4,
        library: 4,
        sportsFacilities: 5,
        waterAndSanitation: 4,
        perimeterSecurity: 4,
        powerSupplyCondition: 'Solar Primary'
      },
      keyInterventionAlerts: [
        'Deploy additional senior Geography teacher'
      ],
      headquarterInspectionRemarks: 'Top-performing upland institution with serene environment and dedicated teaching personnel.',
      governorBriefRecommendation: 'Maintain steady grant releases for highland science camp project.',
      governorPriorityFlag: 'Stable & Exemplary',
      lastHqInspectionDate: '2026-08-18',
      zonalInspectorName: 'Hon. Shima Clement Ugba'
    }
  },

  // 6. VANDEIKYA LGA
  {
    id: 'SCH-VDK-001',
    code: 'BNS-VDK-001',
    name: 'Government Secondary School Vandeikya',
    lga: 'Vandeikya',
    zone: 'Zone A (Benue North-East)',
    category: 'Senior Secondary College',
    principalName: 'Mrs. Scholastica Doofan Uzer',
    vicePrincipalAcademic: 'Mr. Felix Terhemba Kange',
    bursarName: 'Mr. Peter Wuhe',
    phone: '+234 806 912 0045',
    email: 'gssvandeikya@benue.gov.ng',
    address: 'Tsar-Mbadede Road, Vandeikya LGA, Benue State',
    establishedYear: 1979,
    totalStudents: 1410,
    maleStudents: 730,
    femaleStudents: 680,
    boardingStudents: 710,
    dayStudents: 700,
    specialNeedsStudents: 6,
    totalTeachers: 55,
    trcnCertifiedTeachers: 50,
    nonAcademicStaff: 20,
    teacherStudentRatio: '1:25',
    totalClassrooms: 30,
    studentCapacityUtilization: 91,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 13:10:00'
    },
    teacherKPIs: {
      attendanceRate: 94.6,
      punctualityScore: 92.8,
      lessonNoteSubmissionRate: 96.2,
      curriculumCoverageRate: 82.0,
      trcnComplianceRate: 90.9,
      qualificationBreakdown: { nce: 5, bsc_bed: 39, msc_med: 10, phd: 1 },
      topPerformingDepartments: ['Science & Mathematics', 'Humanities & Arts', 'Vocational Studies'],
      teacherDeficitSubjects: ['Physics Lab Technologist'],
      averageWeeklyWorkloadPeriods: 18,
      lastVettingDate: '2026-08-24',
      staffCommendationCount: 7,
      staffQueryCount: 1
    },
    studentKPIs: {
      overallPassRate: 87.8,
      averageScore: 74.0,
      waecBenchmarkPassRate: 85.8,
      becePassRate: 91.2,
      attendanceRate: 95.4,
      dropoutRiskCount: 2,
      genderParityIndex: 0.93,
      gradeDistribution: { distinctions: 270, credits: 850, passes: 230, fails: 60 },
      scienceEnrollmentPercentage: 55.0,
      topPerformingSubjects: ['Agricultural Science', 'General Mathematics', 'Chemistry', 'English Language', 'Economics'],
      subjectsRequiringIntervention: ['Further Mathematics'],
      scholarshipRecipientsCount: 31
    },
    financialStatement: {
      stateSubventionAllocated: 13000000,
      stateSubventionDisbursed: 13000000,
      ptaLevyTarget: 7050000,
      ptaLevyCollected: 6800000,
      examinationFeesRemitted: 4400000,
      specialGrantReceived: 2700000,
      instructionalMaterialsExp: 2750000,
      labConsumablesExp: 2450000,
      facilityMaintenanceExp: 2050000,
      utilitiesAndSecurityExp: 1550000,
      sportsAndCoCurricularExp: 850000,
      staffWelfareAndAllowances: 1400000,
      totalRevenue: 26950000,
      totalExpenditure: 21300000,
      netOperatingBalance: 5650000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-15',
      auditorRemarks: 'Bursary audited satisfactorily with zero audit queries.',
      bursarName: 'Mr. Peter Wuhe'
    },
    governingBodyReview: {
      stateRanking: 7,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 16,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 5,
        scienceLabs: 4,
        ictCenter: 4,
        library: 4,
        sportsFacilities: 4,
        waterAndSanitation: 4,
        perimeterSecurity: 4,
        powerSupplyCondition: 'Grid & Solar Backup'
      },
      keyInterventionAlerts: [
        'Science laboratory borehole solar inverter battery replacement needed'
      ],
      headquarterInspectionRemarks: 'High performing rural model college. High female education retention and great agriculture practicals.',
      governorBriefRecommendation: 'Recommend for the State Agricultural Mechanization in Schools Grant.',
      governorPriorityFlag: 'Stable & Exemplary',
      lastHqInspectionDate: '2026-08-20',
      zonalInspectorName: 'Dr. Joseph Vershima Kator'
    }
  },

  // 7. GWER EAST LGA
  {
    id: 'SCH-GWE-001',
    code: 'BNS-GWE-001',
    name: 'Government Secondary School Aliade',
    lga: 'Gwer East',
    zone: 'Zone B (Benue North-West)',
    category: 'Senior Secondary College',
    principalName: 'Mr. Simon Terver Apuu',
    vicePrincipalAcademic: 'Mrs. Rose Mwuese Iorwuese',
    bursarName: 'Mr. Moses Orpin',
    phone: '+234 805 219 4410',
    email: 'gssaliade@benue.gov.ng',
    address: 'Makurdi-Otukpo Highway, Aliade, Benue State',
    establishedYear: 1981,
    totalStudents: 1280,
    maleStudents: 670,
    femaleStudents: 610,
    boardingStudents: 610,
    dayStudents: 670,
    specialNeedsStudents: 5,
    totalTeachers: 49,
    trcnCertifiedTeachers: 44,
    nonAcademicStaff: 18,
    teacherStudentRatio: '1:26',
    totalClassrooms: 26,
    studentCapacityUtilization: 89,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 11:00:00'
    },
    teacherKPIs: {
      attendanceRate: 92.5,
      punctualityScore: 90.0,
      lessonNoteSubmissionRate: 94.5,
      curriculumCoverageRate: 79.5,
      trcnComplianceRate: 89.8,
      qualificationBreakdown: { nce: 7, bsc_bed: 34, msc_med: 7, phd: 1 },
      topPerformingDepartments: ['Science & Mathematics', 'Humanities & Arts'],
      teacherDeficitSubjects: ['Chemistry Lab Assistant'],
      averageWeeklyWorkloadPeriods: 19,
      lastVettingDate: '2026-08-22',
      staffCommendationCount: 5,
      staffQueryCount: 1
    },
    studentKPIs: {
      overallPassRate: 84.1,
      averageScore: 71.5,
      waecBenchmarkPassRate: 81.2,
      becePassRate: 87.5,
      attendanceRate: 93.8,
      dropoutRiskCount: 3,
      genderParityIndex: 0.91,
      gradeDistribution: { distinctions: 210, credits: 760, passes: 240, fails: 70 },
      scienceEnrollmentPercentage: 49.0,
      topPerformingSubjects: ['General Mathematics', 'Agricultural Science', 'Biology', 'Civic Education', 'CRS'],
      subjectsRequiringIntervention: ['Physics', 'Commerce'],
      scholarshipRecipientsCount: 22
    },
    financialStatement: {
      stateSubventionAllocated: 12000000,
      stateSubventionDisbursed: 12000000,
      ptaLevyTarget: 6400000,
      ptaLevyCollected: 6050000,
      examinationFeesRemitted: 3950000,
      specialGrantReceived: 2300000,
      instructionalMaterialsExp: 2450000,
      labConsumablesExp: 2200000,
      facilityMaintenanceExp: 1850000,
      utilitiesAndSecurityExp: 1450000,
      sportsAndCoCurricularExp: 750000,
      staffWelfareAndAllowances: 1250000,
      totalRevenue: 24700000,
      totalExpenditure: 19550000,
      netOperatingBalance: 5150000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-11',
      auditorRemarks: 'Accounts verified with good compliance.',
      bursarName: 'Mr. Moses Orpin'
    },
    governingBodyReview: {
      stateRanking: 11,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 13,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 4,
        scienceLabs: 4,
        ictCenter: 3,
        library: 4,
        sportsFacilities: 4,
        waterAndSanitation: 3,
        perimeterSecurity: 4,
        powerSupplyCondition: 'Grid & Solar Backup'
      },
      keyInterventionAlerts: [
        'ICT Lab computer systems require upgrade to support JAMB CBT registration center'
      ],
      headquarterInspectionRemarks: 'Strategic school along main transport corridor. High daily attendance.',
      governorBriefRecommendation: 'Provision of 20 additional desktop computers for the ICT laboratory.',
      governorPriorityFlag: 'Normal Operations',
      lastHqInspectionDate: '2026-08-17',
      zonalInspectorName: 'Mrs. Monica Member Tarkumbur'
    }
  },

  // 8. GUMA LGA
  {
    id: 'SCH-GMA-001',
    code: 'BNS-GMA-001',
    name: 'Government Science Secondary School Gbajimba',
    lga: 'Guma',
    zone: 'Zone B (Benue North-West)',
    category: 'Special Science Secondary School',
    principalName: 'Mr. Benjamin Aondohemba',
    vicePrincipalAcademic: 'Mr. Paul Torkwase',
    bursarName: 'Mrs. Eunice Agbo',
    phone: '+234 813 671 9022',
    email: 'gsssgbajimba@benue.gov.ng',
    address: 'Gbajimba Town, Guma LGA, Benue State',
    establishedYear: 1991,
    totalStudents: 890,
    maleStudents: 490,
    femaleStudents: 400,
    boardingStudents: 450,
    dayStudents: 440,
    specialNeedsStudents: 4,
    totalTeachers: 34,
    trcnCertifiedTeachers: 29,
    nonAcademicStaff: 14,
    teacherStudentRatio: '1:26',
    totalClassrooms: 18,
    studentCapacityUtilization: 84,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 08:30:00'
    },
    teacherKPIs: {
      attendanceRate: 88.5,
      punctualityScore: 86.0,
      lessonNoteSubmissionRate: 91.0,
      curriculumCoverageRate: 74.0,
      trcnComplianceRate: 85.3,
      qualificationBreakdown: { nce: 6, bsc_bed: 24, msc_med: 4, phd: 0 },
      topPerformingDepartments: ['Science & Mathematics'],
      teacherDeficitSubjects: ['Physics Teacher', 'Biology Teacher', 'Mathematics Teacher'],
      averageWeeklyWorkloadPeriods: 22,
      lastVettingDate: '2026-08-20',
      staffCommendationCount: 4,
      staffQueryCount: 2
    },
    studentKPIs: {
      overallPassRate: 76.5,
      averageScore: 66.8,
      waecBenchmarkPassRate: 72.0,
      becePassRate: 80.5,
      attendanceRate: 89.0,
      dropoutRiskCount: 8,
      genderParityIndex: 0.81,
      gradeDistribution: { distinctions: 110, credits: 490, passes: 210, fails: 80 },
      scienceEnrollmentPercentage: 78.0,
      topPerformingSubjects: ['Agricultural Science', 'General Mathematics', 'Chemistry'],
      subjectsRequiringIntervention: ['Physics', 'English Language', 'Further Mathematics'],
      scholarshipRecipientsCount: 18
    },
    financialStatement: {
      stateSubventionAllocated: 9500000,
      stateSubventionDisbursed: 9500000,
      ptaLevyTarget: 4450000,
      ptaLevyCollected: 3800000,
      examinationFeesRemitted: 2700000,
      specialGrantReceived: 3500000,
      instructionalMaterialsExp: 2100000,
      labConsumablesExp: 2300000,
      facilityMaintenanceExp: 2400000,
      utilitiesAndSecurityExp: 1600000,
      sportsAndCoCurricularExp: 450000,
      staffWelfareAndAllowances: 950000,
      totalRevenue: 19500000,
      totalExpenditure: 16200000,
      netOperatingBalance: 3300000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-08',
      auditorRemarks: 'Security fencing and rehabilitation grants accounted for.',
      bursarName: 'Mrs. Eunice Agbo'
    },
    governingBodyReview: {
      stateRanking: 28,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 8,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 3,
        scienceLabs: 3,
        ictCenter: 3,
        library: 3,
        sportsFacilities: 3,
        waterAndSanitation: 3,
        perimeterSecurity: 4,
        powerSupplyCondition: 'Solar Primary'
      },
      keyInterventionAlerts: [
        'Deploy 4 additional STEM teachers to ease heavy teaching workload',
        'Special hardship allowances recommended for rural teachers'
      ],
      headquarterInspectionRemarks: 'Resilient learning community making steady progress. Requires additional subject specialist postings.',
      governorBriefRecommendation: 'Governor to approve posting of 5 newly recruited Science graduate teachers.',
      governorPriorityFlag: 'Needs Staffing Support',
      lastHqInspectionDate: '2026-08-15',
      zonalInspectorName: 'Hon. Benjamin Terhemba Hembafan'
    }
  },

  // 9. OKPOKWU LGA
  {
    id: 'SCH-OKP-001',
    code: 'BNS-OKP-001',
    name: 'Government College Ugbokolo',
    lga: 'Okpokwu',
    zone: 'Zone C (Benue South)',
    category: 'Senior Secondary College',
    principalName: 'Rev. Fr. (Dr.) Anthony Ejeh',
    vicePrincipalAcademic: 'Mrs. Janet Onyeje',
    bursarName: 'Mr. Francis Ochoche',
    phone: '+234 803 892 4115',
    email: 'gcugbokolo@benue.gov.ng',
    address: 'Otukpo-Enugu Expressway, Ugbokolo, Benue State',
    establishedYear: 1976,
    totalStudents: 1390,
    maleStudents: 740,
    femaleStudents: 650,
    boardingStudents: 780,
    dayStudents: 610,
    specialNeedsStudents: 6,
    totalTeachers: 54,
    trcnCertifiedTeachers: 49,
    nonAcademicStaff: 20,
    teacherStudentRatio: '1:25',
    totalClassrooms: 28,
    studentCapacityUtilization: 92,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 14:00:00'
    },
    teacherKPIs: {
      attendanceRate: 95.0,
      punctualityScore: 93.2,
      lessonNoteSubmissionRate: 96.8,
      curriculumCoverageRate: 83.0,
      trcnComplianceRate: 90.7,
      qualificationBreakdown: { nce: 6, bsc_bed: 38, msc_med: 9, phd: 1 },
      topPerformingDepartments: ['Science & Mathematics', 'Languages', 'Humanities & Arts'],
      teacherDeficitSubjects: ['Further Mathematics'],
      averageWeeklyWorkloadPeriods: 18,
      lastVettingDate: '2026-08-24',
      staffCommendationCount: 8,
      staffQueryCount: 0
    },
    studentKPIs: {
      overallPassRate: 88.0,
      averageScore: 74.5,
      waecBenchmarkPassRate: 86.2,
      becePassRate: 91.5,
      attendanceRate: 95.6,
      dropoutRiskCount: 2,
      genderParityIndex: 0.88,
      gradeDistribution: { distinctions: 280, credits: 830, passes: 220, fails: 60 },
      scienceEnrollmentPercentage: 54.0,
      topPerformingSubjects: ['Chemistry', 'Physics', 'English Language', 'General Mathematics', 'Literature in English'],
      subjectsRequiringIntervention: ['Technical Drawing'],
      scholarshipRecipientsCount: 33
    },
    financialStatement: {
      stateSubventionAllocated: 13200000,
      stateSubventionDisbursed: 13200000,
      ptaLevyTarget: 6950000,
      ptaLevyCollected: 6700000,
      examinationFeesRemitted: 4300000,
      specialGrantReceived: 2800000,
      instructionalMaterialsExp: 2700000,
      labConsumablesExp: 2500000,
      facilityMaintenanceExp: 2000000,
      utilitiesAndSecurityExp: 1600000,
      sportsAndCoCurricularExp: 800000,
      staffWelfareAndAllowances: 1350000,
      totalRevenue: 27250000,
      totalExpenditure: 21650000,
      netOperatingBalance: 5600000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-14',
      auditorRemarks: 'Excellent bursary bookkeeping and timely remittance.',
      bursarName: 'Mr. Francis Ochoche'
    },
    governingBodyReview: {
      stateRanking: 8,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 14,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 5,
        scienceLabs: 4,
        ictCenter: 4,
        library: 5,
        sportsFacilities: 4,
        waterAndSanitation: 4,
        perimeterSecurity: 5,
        powerSupplyCondition: 'Grid & Solar Backup'
      },
      keyInterventionAlerts: [
        'Expansion of Physics laboratory equipment storage'
      ],
      headquarterInspectionRemarks: 'High discipline, top moral ethos and excellent science practical sessions.',
      governorBriefRecommendation: 'Recommend as examination center of excellence for southern senatorial district.',
      governorPriorityFlag: 'Stable & Exemplary',
      lastHqInspectionDate: '2026-08-19',
      zonalInspectorName: 'Mr. Godwin Enokela Uloko'
    }
  },

  // 10. OJU LGA
  {
    id: 'SCH-OJU-001',
    code: 'BNS-OJU-001',
    name: 'Government Secondary School Oju',
    lga: 'Oju',
    zone: 'Zone C (Benue South)',
    category: 'Senior Secondary College',
    principalName: 'Mr. Isaac Ogbu Ikape',
    vicePrincipalAcademic: 'Mrs. Grace Ene Ominyi',
    bursarName: 'Mr. Patrick Ode',
    phone: '+234 816 772 1044',
    email: 'gssoju@benue.gov.ng',
    address: 'Ibilla Road, Oju LGA, Benue State',
    establishedYear: 1980,
    totalStudents: 1220,
    maleStudents: 640,
    femaleStudents: 580,
    boardingStudents: 590,
    dayStudents: 630,
    specialNeedsStudents: 5,
    totalTeachers: 46,
    trcnCertifiedTeachers: 41,
    nonAcademicStaff: 17,
    teacherStudentRatio: '1:26',
    totalClassrooms: 24,
    studentCapacityUtilization: 88,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 12:30:00'
    },
    teacherKPIs: {
      attendanceRate: 93.0,
      punctualityScore: 90.5,
      lessonNoteSubmissionRate: 94.8,
      curriculumCoverageRate: 79.8,
      trcnComplianceRate: 89.1,
      qualificationBreakdown: { nce: 6, bsc_bed: 33, msc_med: 6, phd: 1 },
      topPerformingDepartments: ['Science & Mathematics', 'Humanities & Arts'],
      teacherDeficitSubjects: ['Physics Teacher'],
      averageWeeklyWorkloadPeriods: 19,
      lastVettingDate: '2026-08-22',
      staffCommendationCount: 6,
      staffQueryCount: 1
    },
    studentKPIs: {
      overallPassRate: 83.5,
      averageScore: 71.0,
      waecBenchmarkPassRate: 80.5,
      becePassRate: 87.0,
      attendanceRate: 93.5,
      dropoutRiskCount: 4,
      genderParityIndex: 0.91,
      gradeDistribution: { distinctions: 195, credits: 710, passes: 235, fails: 80 },
      scienceEnrollmentPercentage: 48.0,
      topPerformingSubjects: ['Agricultural Science', 'Biology', 'General Mathematics', 'English Language', 'Civic Education'],
      subjectsRequiringIntervention: ['Physics', 'Economics'],
      scholarshipRecipientsCount: 20
    },
    financialStatement: {
      stateSubventionAllocated: 11800000,
      stateSubventionDisbursed: 11800000,
      ptaLevyTarget: 6100000,
      ptaLevyCollected: 5800000,
      examinationFeesRemitted: 3750000,
      specialGrantReceived: 2400000,
      instructionalMaterialsExp: 2400000,
      labConsumablesExp: 2150000,
      facilityMaintenanceExp: 1800000,
      utilitiesAndSecurityExp: 1400000,
      sportsAndCoCurricularExp: 700000,
      staffWelfareAndAllowances: 1200000,
      totalRevenue: 24100000,
      totalExpenditure: 19050000,
      netOperatingBalance: 5050000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-10',
      auditorRemarks: 'Bursary audited satisfactorily.',
      bursarName: 'Mr. Patrick Ode'
    },
    governingBodyReview: {
      stateRanking: 14,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 13,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 4,
        scienceLabs: 4,
        ictCenter: 3,
        library: 4,
        sportsFacilities: 4,
        waterAndSanitation: 3,
        perimeterSecurity: 4,
        powerSupplyCondition: 'Solar Primary'
      },
      keyInterventionAlerts: [
        'Drilling of motorized solar water borehole for female boarding hostel'
      ],
      headquarterInspectionRemarks: 'Consistent performance with strong agricultural produce yield from school farm.',
      governorBriefRecommendation: 'Grant approval for school farm agro-processing machinery.',
      governorPriorityFlag: 'Normal Operations',
      lastHqInspectionDate: '2026-08-18',
      zonalInspectorName: 'Dr. Michael Ikape Ominyi'
    }
  },

  // 11. TARKA LGA
  {
    id: 'SCH-TRK-001',
    code: 'BNS-TRK-001',
    name: 'Government Secondary School Wannune',
    lga: 'Tarka',
    zone: 'Zone B (Benue North-West)',
    category: 'Senior Secondary College',
    principalName: 'Chief Terkula Waniko Joseph',
    vicePrincipalAcademic: 'Mrs. Esther Kaseve',
    bursarName: 'Mr. Moses Asen',
    phone: '+234 802 991 3042',
    email: 'gsswannune@benue.gov.ng',
    address: 'Makurdi-Gboko Road, Wannune, Tarka LGA, Benue State',
    establishedYear: 1982,
    totalStudents: 1050,
    maleStudents: 560,
    femaleStudents: 490,
    boardingStudents: 520,
    dayStudents: 530,
    specialNeedsStudents: 4,
    totalTeachers: 41,
    trcnCertifiedTeachers: 37,
    nonAcademicStaff: 15,
    teacherStudentRatio: '1:25',
    totalClassrooms: 22,
    studentCapacityUtilization: 87,
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 10:15:00'
    },
    teacherKPIs: {
      attendanceRate: 93.4,
      punctualityScore: 91.0,
      lessonNoteSubmissionRate: 95.0,
      curriculumCoverageRate: 80.0,
      trcnComplianceRate: 90.2,
      qualificationBreakdown: { nce: 5, bsc_bed: 29, msc_med: 6, phd: 1 },
      topPerformingDepartments: ['Science & Mathematics', 'Humanities & Arts'],
      teacherDeficitSubjects: ['ICT Instructor'],
      averageWeeklyWorkloadPeriods: 18,
      lastVettingDate: '2026-08-23',
      staffCommendationCount: 5,
      staffQueryCount: 1
    },
    studentKPIs: {
      overallPassRate: 84.5,
      averageScore: 71.8,
      waecBenchmarkPassRate: 81.8,
      becePassRate: 88.0,
      attendanceRate: 94.0,
      dropoutRiskCount: 2,
      genderParityIndex: 0.88,
      gradeDistribution: { distinctions: 170, credits: 620, passes: 200, fails: 60 },
      scienceEnrollmentPercentage: 50.0,
      topPerformingSubjects: ['General Mathematics', 'Agricultural Science', 'Biology', 'Civic Education'],
      subjectsRequiringIntervention: ['Physics Practical', 'Economics'],
      scholarshipRecipientsCount: 21
    },
    financialStatement: {
      stateSubventionAllocated: 11000000,
      stateSubventionDisbursed: 11000000,
      ptaLevyTarget: 5250000,
      ptaLevyCollected: 5000000,
      examinationFeesRemitted: 3200000,
      specialGrantReceived: 2100000,
      instructionalMaterialsExp: 2200000,
      labConsumablesExp: 2000000,
      facilityMaintenanceExp: 1700000,
      utilitiesAndSecurityExp: 1300000,
      sportsAndCoCurricularExp: 650000,
      staffWelfareAndAllowances: 1100000,
      totalRevenue: 21550000,
      totalExpenditure: 17150000,
      netOperatingBalance: 4400000,
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-11',
      auditorRemarks: 'Bursary accounts reconciled properly.',
      bursarName: 'Mr. Moses Asen'
    },
    governingBodyReview: {
      stateRanking: 13,
      totalSchoolsInState: 115,
      lgaRanking: 1,
      totalSchoolsInLGA: 8,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: 4,
        scienceLabs: 4,
        ictCenter: 3,
        library: 4,
        sportsFacilities: 4,
        waterAndSanitation: 4,
        perimeterSecurity: 4,
        powerSupplyCondition: 'Grid & Solar Backup'
      },
      keyInterventionAlerts: [
        'Deploy dedicated ICT computer instructor'
      ],
      headquarterInspectionRemarks: 'Good administrative discipline in Joseph Sarwuan Tarka home LGA.',
      governorBriefRecommendation: 'Provide 15 desktop computers to upgrade ICT lab.',
      governorPriorityFlag: 'Normal Operations',
      lastHqInspectionDate: '2026-08-16',
      zonalInspectorName: 'Hon. Simon Terkula Waniko'
    }
  }
];

// ==================== STATEWIDE AGGREGATE SUMMARY HELPER ====================

export function getStatewideAggregateKPIs() {
  const totalLgas = BENUE_LGAS_METADATA.length;
  const totalSchools = BENUE_LGAS_METADATA.reduce((acc, l) => acc + l.totalGovernmentSchools, 0);
  const totalStudents = BENUE_LGAS_METADATA.reduce((acc, l) => acc + l.totalStudentPopulation, 0);
  const totalTeachers = BENUE_LGAS_METADATA.reduce((acc, l) => acc + l.totalTeacherCount, 0);
  const totalSubventionDisbursed = BENUE_LGAS_METADATA.reduce((acc, l) => acc + l.subventionDisbursedNaira, 0);
  const averageStatePassRate = Number(
    (BENUE_LGAS_METADATA.reduce((acc, l) => acc + l.averagePassRate, 0) / totalLgas).toFixed(1)
  );

  const zoneSummaries = [
    {
      zone: 'Zone A (Benue North-East)',
      lgasCount: 7,
      schoolsCount: BENUE_LGAS_METADATA.filter(l => l.zone === 'Zone A (Benue North-East)').reduce((acc, l) => acc + l.totalGovernmentSchools, 0),
      studentsCount: BENUE_LGAS_METADATA.filter(l => l.zone === 'Zone A (Benue North-East)').reduce((acc, l) => acc + l.totalStudentPopulation, 0),
      teachersCount: BENUE_LGAS_METADATA.filter(l => l.zone === 'Zone A (Benue North-East)').reduce((acc, l) => acc + l.totalTeacherCount, 0),
      averagePass: 76.4
    },
    {
      zone: 'Zone B (Benue North-West)',
      lgasCount: 7,
      schoolsCount: BENUE_LGAS_METADATA.filter(l => l.zone === 'Zone B (Benue North-West)').reduce((acc, l) => acc + l.totalGovernmentSchools, 0),
      studentsCount: BENUE_LGAS_METADATA.filter(l => l.zone === 'Zone B (Benue North-West)').reduce((acc, l) => acc + l.totalStudentPopulation, 0),
      teachersCount: BENUE_LGAS_METADATA.filter(l => l.zone === 'Zone B (Benue North-West)').reduce((acc, l) => acc + l.totalTeacherCount, 0),
      averagePass: 77.5
    },
    {
      zone: 'Zone C (Benue South)',
      lgasCount: 9,
      schoolsCount: BENUE_LGAS_METADATA.filter(l => l.zone === 'Zone C (Benue South)').reduce((acc, l) => acc + l.totalGovernmentSchools, 0),
      studentsCount: BENUE_LGAS_METADATA.filter(l => l.zone === 'Zone C (Benue South)').reduce((acc, l) => acc + l.totalStudentPopulation, 0),
      teachersCount: BENUE_LGAS_METADATA.filter(l => l.zone === 'Zone C (Benue South)').reduce((acc, l) => acc + l.totalTeacherCount, 0),
      averagePass: 75.8
    }
  ];

  return {
    totalLgas,
    totalSchools,
    totalStudents,
    totalTeachers,
    totalSubventionDisbursed,
    averageStatePassRate,
    stateTeacherStudentRatio: '1:27',
    stateTrcnComplianceRate: 91.4,
    stateWaecPassReadiness: 83.2,
    zoneSummaries
  };
}

// Extended complete school directory mapping for all 23 Benue LGAs (incorporating Senior Secondary, Junior/UBE, Technical, and LGEA/SUBEB Primary Schools)
const LGA_SCHOOL_TEMPLATES: Record<BenueLGA, { name: string; category: GovSchool['category']; address: string; established: number; rank: number }[]> = {
  'Makurdi': [
    { name: 'Government College Makurdi', category: 'Senior Secondary College', address: 'Old GRA / Wurukum Expressway, Makurdi', established: 1976, rank: 1 },
    { name: 'Special Science Senior Secondary School Makurdi', category: 'Special Science Secondary School', address: 'High Level, Makurdi', established: 1988, rank: 2 },
    { name: 'Government Model Secondary School North-Bank', category: 'Senior Secondary College', address: 'North Bank, Makurdi', established: 1994, rank: 9 },
    { name: 'Government Technical College Makurdi', category: 'Technical & Vocational College', address: 'Kanshio Industrial Layout, Makurdi', established: 1985, rank: 12 },
    { name: 'Community Day Secondary School Wurukum', category: 'Comprehensive High School', address: 'Wurukum Market Road, Makurdi', established: 2001, rank: 18 },
    { name: 'UBE Demonstration Model Junior Academy Makurdi', category: 'Universal Basic Education / Junior High', address: 'Modern Market Road, Makurdi', established: 2008, rank: 22 },
    // Primary / SUBEB Schools in Makurdi
    { name: 'LGEA Demonstration Model Primary School Wurukum', category: 'LGEA Demonstration Primary School', address: 'Wurukum Roundabout, Makurdi', established: 1968, rank: 1 },
    { name: 'Holy Ghost LGEA Primary School High Level', category: 'LGEA Primary School (SUBEB)', address: 'High Level, Makurdi', established: 1972, rank: 3 },
    { name: 'St. John\'s LGEA Model Primary School North Bank', category: 'State Government Model Primary School', address: 'North Bank Layout, Makurdi', established: 1980, rank: 5 },
    { name: 'LGEA Special Education Primary School Kanshio', category: 'Special Education Model Primary School', address: 'Kanshio, Makurdi', established: 1992, rank: 7 }
  ],
  'Gboko': [
    { name: 'Government College Gboko', category: 'Senior Secondary College', address: 'Captain Downes Road, Gboko', established: 1978, rank: 3 },
    { name: 'Government Technical College Gboko', category: 'Technical & Vocational College', address: 'Mkar Road, Gboko', established: 1982, rank: 8 },
    { name: 'Government Science Secondary School Mkar', category: 'Special Science Secondary School', address: 'Mkar Hill Road, Gboko', established: 1990, rank: 10 },
    { name: 'Community Secondary School Yandev', category: 'Senior Secondary College', address: 'Yandev Roundabout, Gboko', established: 1986, rank: 15 },
    { name: 'Government Girls Model College Gboko', category: 'Senior Secondary College', address: 'GRA, Gboko', established: 1995, rank: 19 },
    { name: 'UBE Model Junior Secondary School Gboko', category: 'Universal Basic Education / Junior High', address: 'Adekaa, Gboko', established: 2006, rank: 24 },
    // Primary / SUBEB Schools in Gboko
    { name: 'LGEA Central Demonstration Primary School Gboko', category: 'LGEA Demonstration Primary School', address: 'Captain Downes Road, Gboko', established: 1965, rank: 2 },
    { name: 'NKST LGEA Model Primary School Mkar', category: 'LGEA Primary School (SUBEB)', address: 'Mkar Town, Gboko', established: 1958, rank: 4 },
    { name: 'St. Theresa\'s LGEA Model Primary School Adekaa', category: 'State Government Model Primary School', address: 'Adekaa, Gboko', established: 1974, rank: 6 },
    { name: 'LGEA Primary School Yandev Central', category: 'LGEA Primary School (SUBEB)', address: 'Yandev Roundabout, Gboko', established: 1979, rank: 8 }
  ],
  'Otukpo': [
    { name: 'Government Secondary School Otukpo', category: 'Senior Secondary College', address: 'Federal Polytechnic Road, Otukpo', established: 1974, rank: 4 },
    { name: 'Special Science Senior Secondary School Otukpo', category: 'Special Science Secondary School', address: 'Upu Road, Otukpo', established: 1989, rank: 7 },
    { name: 'Government Technical College Otobi', category: 'Technical & Vocational College', address: 'Otobi Waterworks Road, Otukpo', established: 1984, rank: 14 },
    { name: 'Community Secondary School Akpa', category: 'Senior Secondary College', address: 'Allan-Akpa, Otukpo LGA', established: 1992, rank: 20 },
    { name: 'UBE Model Academy Otukpo-Town', category: 'Universal Basic Education / Junior High', address: 'Enugu Road, Otukpo', established: 2009, rank: 25 },
    // Primary / SUBEB Schools in Otukpo
    { name: 'LGEA Central Demonstration Primary School Otukpo', category: 'LGEA Demonstration Primary School', address: 'Enugu Road, Otukpo', established: 1962, rank: 3 },
    { name: 'St. Francis LGEA Model Primary School Otukpo', category: 'State Government Model Primary School', address: 'GRA, Otukpo', established: 1970, rank: 5 },
    { name: 'Methodist LGEA Primary School Otobi', category: 'LGEA Primary School (SUBEB)', address: 'Otobi Town, Otukpo LGA', established: 1976, rank: 8 },
    { name: 'LGEA Model Basic Primary School Allan-Akpa', category: 'LGEA Primary School (SUBEB)', address: 'Allan-Akpa, Otukpo LGA', established: 1983, rank: 11 }
  ],
  'Katsina-Ala': [
    { name: 'Government College Katsina-Ala', category: 'Senior Secondary College', address: 'Old Wukari Road, Katsina-Ala', established: 1914, rank: 5 },
    { name: 'Government Science Secondary School Katsina-Ala', category: 'Special Science Secondary School', address: 'Hospital Road, Katsina-Ala', established: 1987, rank: 11 },
    { name: 'Government Technical College Tor-Donga', category: 'Technical & Vocational College', address: 'Tor-Donga Town, Katsina-Ala LGA', established: 1991, rank: 17 },
    { name: 'Community Model Secondary School Abaji', category: 'Senior Secondary College', address: 'Abaji-Kpav, Katsina-Ala LGA', established: 1998, rank: 23 },
    { name: 'UBE Demonstration College Katsina-Ala', category: 'Universal Basic Education / Junior High', address: 'College Road, Katsina-Ala', established: 2007, rank: 28 },
    // Primary / SUBEB Schools in Katsina-Ala
    { name: 'LGEA Central Demonstration Primary School Katsina-Ala', category: 'LGEA Demonstration Primary School', address: 'Old Wukari Road, Katsina-Ala', established: 1960, rank: 4 },
    { name: 'RCM LGEA Model Primary School Tor-Donga', category: 'LGEA Primary School (SUBEB)', address: 'Tor-Donga, Katsina-Ala LGA', established: 1975, rank: 9 },
    { name: 'NKST LGEA Primary School Abaji-Kpav', category: 'LGEA Primary School (SUBEB)', address: 'Abaji-Kpav, Katsina-Ala LGA', established: 1981, rank: 12 }
  ],
  'Kwande': [
    { name: 'Government College Adikpo', category: 'Senior Secondary College', address: 'Jato-Aka Road, Adikpo, Kwande LGA', established: 1980, rank: 6 },
    { name: 'Government Science Secondary School Jato-Aka', category: 'Special Science Secondary School', address: 'Jato-Aka Main Road, Kwande LGA', established: 1992, rank: 13 },
    { name: 'Community Secondary School Ikyogen', category: 'Senior Secondary College', address: 'Cattle Ranch Road, Ikyogen', established: 1988, rank: 21 },
    { name: 'Government Technical College Nanev', category: 'Technical & Vocational College', address: 'Nanev Junction, Adikpo', established: 1996, rank: 26 },
    { name: 'UBE Junior High School Moon', category: 'Universal Basic Education / Junior High', address: 'Moon Valley, Kwande LGA', established: 2011, rank: 31 },
    // Primary / SUBEB Schools in Kwande
    { name: 'LGEA Central Demonstration Primary School Adikpo', category: 'LGEA Demonstration Primary School', address: 'Adikpo Township Center, Kwande', established: 1964, rank: 6 },
    { name: 'NKST LGEA Model Primary School Jato-Aka', category: 'LGEA Primary School (SUBEB)', address: 'Jato-Aka Road, Kwande LGA', established: 1973, rank: 10 },
    { name: 'LGEA Model Primary School Ikyogen', category: 'State Government Model Primary School', address: 'Cattle Ranch Road, Ikyogen', established: 1982, rank: 14 }
  ],
  'Vandeikya': [
    { name: 'Government Secondary School Vandeikya', category: 'Senior Secondary College', address: 'Tsar-Mbadede Road, Vandeikya', established: 1979, rank: 7 },
    { name: 'Government Science Secondary School Tsar', category: 'Special Science Secondary School', address: 'Tsar Town, Vandeikya LGA', established: 1991, rank: 12 },
    { name: 'Community Secondary School Mbagbera', category: 'Senior Secondary College', address: 'Mbagbera, Vandeikya LGA', established: 1987, rank: 18 },
    { name: 'Government Technical College Mbaakon', category: 'Technical & Vocational College', address: 'Mbaakon Junction, Vandeikya', established: 1994, rank: 22 },
    { name: 'UBE Model Secondary Academy Vandeikya', category: 'Universal Basic Education / Junior High', address: 'Township Center, Vandeikya', established: 2008, rank: 29 },
    // Primary / SUBEB Schools in Vandeikya
    { name: 'LGEA Central Model Primary School Vandeikya', category: 'State Government Model Primary School', address: 'Tsar-Mbadede Road, Vandeikya', established: 1966, rank: 7 },
    { name: 'St. Patrick\'s LGEA Primary School Tsar', category: 'LGEA Primary School (SUBEB)', address: 'Tsar Center, Vandeikya LGA', established: 1971, rank: 11 },
    { name: 'LGEA Demonstration Primary School Mbaakon', category: 'LGEA Demonstration Primary School', address: 'Mbaakon, Vandeikya LGA', established: 1980, rank: 15 }
  ],
  'Gwer East': [
    { name: 'Government Secondary School Aliade', category: 'Senior Secondary College', address: 'Makurdi-Otukpo Highway, Aliade', established: 1981, rank: 11 },
    { name: 'Government Science College Mbalom', category: 'Special Science Secondary School', address: 'Mbalom Town, Gwer East LGA', established: 1995, rank: 16 },
    { name: 'Community Secondary School Taraku', category: 'Senior Secondary College', address: 'Oil Mills Road, Taraku', established: 1986, rank: 22 },
    { name: 'Government Technical College Ikobi-Gwer', category: 'Technical & Vocational College', address: 'Ikobi, Gwer East LGA', established: 1998, rank: 27 },
    { name: 'UBE Model Junior High Aliade', category: 'Universal Basic Education / Junior High', address: 'Mission Road, Aliade', established: 2010, rank: 33 },
    // Primary / SUBEB Schools in Gwer East
    { name: 'LGEA Central Demonstration Primary School Aliade', category: 'LGEA Demonstration Primary School', address: 'Highway Junction, Aliade', established: 1967, rank: 8 },
    { name: 'St. Michael\'s LGEA Primary School Mbalom', category: 'LGEA Primary School (SUBEB)', address: 'Mbalom Center, Gwer East LGA', established: 1977, rank: 13 },
    { name: 'LGEA Model Primary School Taraku', category: 'State Government Model Primary School', address: 'Oil Mills Road, Taraku', established: 1984, rank: 16 }
  ],
  'Gwer West': [
    { name: 'Government Secondary School Naka', category: 'Senior Secondary College', address: 'Makurdi-Ankpa Road, Naka', established: 1982, rank: 15 },
    { name: 'Government Science Secondary School Agagbe', category: 'Special Science Secondary School', address: 'Agagbe Town, Gwer West LGA', established: 1993, rank: 19 },
    { name: 'Community High School Bunji', category: 'Senior Secondary College', address: 'Bunji Ward, Naka', established: 1990, rank: 25 },
    { name: 'Government Technical College Tyoughatee', category: 'Technical & Vocational College', address: 'Tyoughatee, Gwer West LGA', established: 1997, rank: 30 },
    { name: 'UBE Model College Sangev', category: 'Universal Basic Education / Junior High', address: 'Sangev, Gwer West LGA', established: 2012, rank: 35 },
    // Primary / SUBEB Schools in Gwer West
    { name: 'LGEA Central Model Primary School Naka', category: 'State Government Model Primary School', address: 'Makurdi-Ankpa Road, Naka', established: 1969, rank: 9 },
    { name: 'RCM LGEA Primary School Agagbe', category: 'LGEA Primary School (SUBEB)', address: 'Agagbe Town, Gwer West LGA', established: 1978, rank: 14 },
    { name: 'LGEA Demonstration Primary School Bunji', category: 'LGEA Demonstration Primary School', address: 'Bunji Ward, Naka', established: 1985, rank: 18 }
  ],
  'Guma': [
    { name: 'Government Science Secondary School Gbajimba', category: 'Special Science Secondary School', address: 'Gbajimba Town, Guma LGA', established: 1991, rank: 28 },
    { name: 'Government Secondary School Daudu', category: 'Senior Secondary College', address: 'Makurdi-Lafia Highway, Daudu', established: 1985, rank: 20 },
    { name: 'Community High School Agasha', category: 'Senior Secondary College', address: 'River Port Road, Agasha', established: 1989, rank: 24 },
    { name: 'UBE Model Academy Abinsi', category: 'Universal Basic Education / Junior High', address: 'Abinsi Riverside, Guma LGA', established: 2009, rank: 32 },
    // Primary / SUBEB Schools in Guma
    { name: 'LGEA Central Demonstration Primary School Gbajimba', category: 'LGEA Demonstration Primary School', address: 'Secretariat Road, Gbajimba', established: 1971, rank: 10 },
    { name: 'LGEA Model Primary School Daudu', category: 'State Government Model Primary School', address: 'Makurdi-Lafia Highway, Daudu', established: 1983, rank: 15 },
    { name: 'St. Augustine\'s LGEA Primary School Agasha', category: 'LGEA Primary School (SUBEB)', address: 'River Port Road, Agasha', established: 1979, rank: 19 }
  ],
  'Tarka': [
    { name: 'Government Secondary School Wannune', category: 'Senior Secondary College', address: 'Makurdi-Gboko Road, Wannune', established: 1982, rank: 13 },
    { name: 'Government Science Secondary School Asukunya', category: 'Special Science Secondary School', address: 'Asukunya, Tarka LGA', established: 1994, rank: 18 },
    { name: 'Community High School Mbakyaa', category: 'Senior Secondary College', address: 'Mbakyaa Ward, Tarka LGA', established: 1991, rank: 26 },
    { name: 'UBE Model Junior Academy Wannune', category: 'Universal Basic Education / Junior High', address: 'J.S. Tarka Way, Wannune', established: 2010, rank: 34 },
    // Primary / SUBEB Schools in Tarka
    { name: 'LGEA Central Demonstration Primary School Wannune', category: 'LGEA Demonstration Primary School', address: 'J.S. Tarka Way, Wannune', established: 1968, rank: 8 },
    { name: 'NKST LGEA Model Primary School Asukunya', category: 'LGEA Primary School (SUBEB)', address: 'Asukunya Center, Tarka LGA', established: 1976, rank: 13 },
    { name: 'LGEA Model Primary School Mbakyaa', category: 'State Government Model Primary School', address: 'Mbakyaa Ward, Tarka LGA', established: 1984, rank: 17 }
  ],
  'Buruku': [
    { name: 'Government Secondary School Buruku', category: 'Senior Secondary College', address: 'Katsina-Ala River Ferry Point, Buruku', established: 1983, rank: 16 },
    { name: 'Government Science Secondary School Tyowanye', category: 'Special Science Secondary School', address: 'Tyowanye Market Road, Buruku LGA', established: 1993, rank: 21 },
    { name: 'Community High School Binev', category: 'Senior Secondary College', address: 'Binev Ward, Buruku LGA', established: 1989, rank: 27 },
    { name: 'Government Technical College Tombo', category: 'Technical & Vocational College', address: 'Tombo, Buruku LGA', established: 1996, rank: 31 },
    { name: 'UBE Model Academy Mbaatirkyaa', category: 'Universal Basic Education / Junior High', address: 'Mbaatirkyaa, Buruku LGA', established: 2011, rank: 36 },
    // Primary / SUBEB Schools in Buruku
    { name: 'LGEA Central Model Primary School Buruku', category: 'State Government Model Primary School', address: 'Ferry Point Road, Buruku', established: 1970, rank: 11 },
    { name: 'LGEA Model Primary School Tyowanye', category: 'LGEA Primary School (SUBEB)', address: 'Market Center, Tyowanye', established: 1981, rank: 15 },
    { name: 'NKST LGEA Demonstration Primary School Binev', category: 'LGEA Demonstration Primary School', address: 'Binev Ward, Buruku LGA', established: 1986, rank: 20 }
  ],
  'Konshisha': [
    { name: 'Government Secondary School Tse-Agberagba', category: 'Senior Secondary College', address: 'Secretariat Road, Tse-Agberagba', established: 1981, rank: 14 },
    { name: 'Government Science Secondary School Korinya', category: 'Special Science Secondary School', address: 'Korinya City, Konshisha LGA', established: 1992, rank: 19 },
    { name: 'Community Model High School Mbake', category: 'Senior Secondary College', address: 'Mbake Ward, Konshisha LGA', established: 1988, rank: 25 },
    { name: 'Government Technical College Ikyurav-Tiev', category: 'Technical & Vocational College', address: 'Ikyurav-Tiev, Konshisha LGA', established: 1995, rank: 30 },
    { name: 'UBE Junior High School Gungul', category: 'Universal Basic Education / Junior High', address: 'Gungul Center, Konshisha LGA', established: 2010, rank: 35 },
    // Primary / SUBEB Schools in Konshisha
    { name: 'LGEA Central Demonstration Primary School Tse-Agberagba', category: 'LGEA Demonstration Primary School', address: 'Secretariat Road, Tse-Agberagba', established: 1968, rank: 9 },
    { name: 'LGEA Model Primary School Korinya', category: 'State Government Model Primary School', address: 'Korinya City, Konshisha LGA', established: 1978, rank: 14 },
    { name: 'St. Gabriel\'s LGEA Primary School Mbake', category: 'LGEA Primary School (SUBEB)', address: 'Mbake Ward, Konshisha LGA', established: 1984, rank: 18 }
  ],
  'Logo': [
    { name: 'Government Secondary School Ugba', category: 'Senior Secondary College', address: 'Wukari Road, Ugba, Logo LGA', established: 1984, rank: 27 },
    { name: 'Government Science College Anyiin', category: 'Special Science Secondary School', address: 'Anyiin Town, Logo LGA', established: 1996, rank: 22 },
    { name: 'Community High School Ayilamo', category: 'Senior Secondary College', address: 'Ayilamo Market Center, Logo LGA', established: 1991, rank: 29 },
    { name: 'UBE Model Academy Abeda', category: 'Universal Basic Education / Junior High', address: 'Abeda, Logo LGA', established: 2012, rank: 37 },
    // Primary / SUBEB Schools in Logo
    { name: 'LGEA Central Demonstration Primary School Ugba', category: 'LGEA Demonstration Primary School', address: 'Wukari Road, Ugba', established: 1972, rank: 12 },
    { name: 'LGEA Model Primary School Anyiin', category: 'State Government Model Primary School', address: 'Anyiin Center, Logo LGA', established: 1982, rank: 16 },
    { name: 'NKST LGEA Primary School Ayilamo', category: 'LGEA Primary School (SUBEB)', address: 'Ayilamo Market Road, Logo LGA', established: 1987, rank: 21 }
  ],
  'Ukum': [
    { name: 'Government Secondary School Zaki Biam', category: 'Senior Secondary College', address: 'Yam International Market Road, Zaki Biam', established: 1980, rank: 23 },
    { name: 'Government Science Secondary School Kyado', category: 'Special Science Secondary School', address: 'Kyado Town, Ukum LGA', established: 1993, rank: 26 },
    { name: 'Community Model High School Afia', category: 'Senior Secondary College', address: 'Afia Ward, Ukum LGA', established: 1989, rank: 31 },
    { name: 'Government Technical College Borikyo', category: 'Technical & Vocational College', address: 'Borikyo, Ukum LGA', established: 1997, rank: 34 },
    { name: 'UBE Model Junior Academy Tembur', category: 'Universal Basic Education / Junior High', address: 'Tembur, Ukum LGA', established: 2011, rank: 38 },
    // Primary / SUBEB Schools in Ukum
    { name: 'LGEA Central Demonstration Primary School Zaki Biam', category: 'LGEA Demonstration Primary School', address: 'Yam Market Road, Zaki Biam', established: 1969, rank: 10 },
    { name: 'LGEA Model Primary School Kyado', category: 'State Government Model Primary School', address: 'Kyado Town, Ukum LGA', established: 1980, rank: 15 },
    { name: 'RCM LGEA Primary School Afia', category: 'LGEA Primary School (SUBEB)', address: 'Afia Center, Ukum LGA', established: 1986, rank: 19 }
  ],
  'Ushongo': [
    { name: 'Government Secondary School Lessel', category: 'Senior Secondary College', address: 'Lessel Township Road, Ushongo LGA', established: 1982, rank: 15 },
    { name: 'Government Science Secondary School Manor', category: 'Special Science Secondary School', address: 'Manor Hill, Ushongo LGA', established: 1994, rank: 20 },
    { name: 'Community High School Ikov', category: 'Senior Secondary College', address: 'Ikov Ward, Ushongo LGA', established: 1988, rank: 26 },
    { name: 'Government Technical College Utange', category: 'Technical & Vocational College', address: 'Utange, Ushongo LGA', established: 1996, rank: 32 },
    { name: 'UBE Demonstration Model Academy Mbagwaza', category: 'Universal Basic Education / Junior High', address: 'Mbagwaza, Ushongo LGA', established: 2010, rank: 36 },
    // Primary / SUBEB Schools in Ushongo
    { name: 'LGEA Central Model Primary School Lessel', category: 'State Government Model Primary School', address: 'Lessel Township Road, Ushongo', established: 1967, rank: 9 },
    { name: 'NKST LGEA Primary School Manor', category: 'LGEA Primary School (SUBEB)', address: 'Manor Hill, Ushongo LGA', established: 1978, rank: 14 },
    { name: 'LGEA Demonstration Primary School Ikov', category: 'LGEA Demonstration Primary School', address: 'Ikov Ward, Ushongo LGA', established: 1985, rank: 18 }
  ],
  'Ado': [
    { name: 'Government Secondary School Igumale', category: 'Senior Secondary College', address: 'Railway Station Road, Igumale', established: 1978, rank: 24 },
    { name: 'Government Science Secondary School Apa-Agila', category: 'Special Science Secondary School', address: 'Agila Kingdom Road, Ado LGA', established: 1991, rank: 28 },
    { name: 'Community High School Ulayi', category: 'Senior Secondary College', address: 'Ulayi, Ado LGA', established: 1987, rank: 32 },
    { name: 'UBE Demonstration College Ijigban', category: 'Universal Basic Education / Junior High', address: 'Ijigban Center, Ado LGA', established: 2009, rank: 37 },
    // Primary / SUBEB Schools in Ado
    { name: 'LGEA Central Demonstration Primary School Igumale', category: 'LGEA Demonstration Primary School', address: 'Station Road, Igumale', established: 1965, rank: 11 },
    { name: 'Methodist LGEA Primary School Apa-Agila', category: 'LGEA Primary School (SUBEB)', address: 'Agila Kingdom Road, Ado LGA', established: 1976, rank: 16 },
    { name: 'LGEA Model Primary School Ulayi', category: 'State Government Model Primary School', address: 'Ulayi Center, Ado LGA', established: 1984, rank: 20 }
  ],
  'Agatu': [
    { name: 'Government Secondary School Obagaji', category: 'Senior Secondary College', address: 'River Benue Road, Obagaji, Agatu LGA', established: 1983, rank: 29 },
    { name: 'Government Science College Oshigbudu', category: 'Special Science Secondary School', address: 'Oshigbudu Junction, Agatu LGA', established: 1995, rank: 25 },
    { name: 'Community High School Okokolo', category: 'Senior Secondary College', address: 'Okokolo Town, Agatu LGA', established: 1990, rank: 33 },
    { name: 'Government Technical College Enogaje', category: 'Technical & Vocational College', address: 'Enogaje, Agatu LGA', established: 1998, rank: 38 },
    // Primary / SUBEB Schools in Agatu
    { name: 'LGEA Central Demonstration Primary School Obagaji', category: 'LGEA Demonstration Primary School', address: 'River Benue Road, Obagaji', established: 1970, rank: 13 },
    { name: 'LGEA Model Primary School Oshigbudu', category: 'State Government Model Primary School', address: 'Oshigbudu Junction, Agatu LGA', established: 1981, rank: 17 },
    { name: 'RCM LGEA Primary School Okokolo', category: 'LGEA Primary School (SUBEB)', address: 'Okokolo Town, Agatu LGA', established: 1987, rank: 22 }
  ],
  'Apa': [
    { name: 'Government Secondary School Ugbokpo', category: 'Senior Secondary College', address: 'Otukpo-Adoka Road, Ugbokpo, Apa LGA', established: 1981, rank: 17 },
    { name: 'Government Science College Ikobi', category: 'Special Science Secondary School', address: 'Ikobi Town, Apa LGA', established: 1994, rank: 22 },
    { name: 'Community High School Ofoke', category: 'Senior Secondary College', address: 'Ofoke Ward, Apa LGA', established: 1989, rank: 28 },
    { name: 'UBE Model Secondary Academy Igoro', category: 'Universal Basic Education / Junior High', address: 'Igoro, Apa LGA', established: 2011, rank: 35 },
    // Primary / SUBEB Schools in Apa
    { name: 'LGEA Central Model Primary School Ugbokpo', category: 'State Government Model Primary School', address: 'Otukpo-Adoka Road, Ugbokpo', established: 1968, rank: 10 },
    { name: 'St. Mary\'s LGEA Primary School Ikobi', category: 'LGEA Primary School (SUBEB)', address: 'Ikobi Town, Apa LGA', established: 1979, rank: 15 },
    { name: 'LGEA Demonstration Primary School Ofoke', category: 'LGEA Demonstration Primary School', address: 'Ofoke Center, Apa LGA', established: 1986, rank: 19 }
  ],
  'Obi': [
    { name: 'Government Secondary School Obarike-Ito', category: 'Senior Secondary College', address: 'Secretariat Road, Obarike-Ito, Obi LGA', established: 1982, rank: 18 },
    { name: 'Government Science College Adum-West', category: 'Special Science Secondary School', address: 'Adum-West, Obi LGA', established: 1993, rank: 23 },
    { name: 'Community High School Okwutungbe', category: 'Senior Secondary College', address: 'Okwutungbe, Obi LGA', established: 1988, rank: 29 },
    { name: 'UBE Model Academy Ito-Barracks', category: 'Universal Basic Education / Junior High', address: 'Ito Center, Obi LGA', established: 2010, rank: 36 },
    // Primary / SUBEB Schools in Obi
    { name: 'LGEA Central Demonstration Primary School Obarike-Ito', category: 'LGEA Demonstration Primary School', address: 'Secretariat Road, Obarike-Ito', established: 1969, rank: 11 },
    { name: 'LGEA Model Primary School Adum-West', category: 'State Government Model Primary School', address: 'Adum-West Center, Obi LGA', established: 1980, rank: 16 },
    { name: 'Methodist LGEA Primary School Okwutungbe', category: 'LGEA Primary School (SUBEB)', address: 'Okwutungbe Ward, Obi LGA', established: 1985, rank: 20 }
  ],
  'Ogbadibo': [
    { name: 'Government Secondary School Otukpa', category: 'Senior Secondary College', address: 'Branch Road, Otukpa, Ogbadibo LGA', established: 1977, rank: 10 },
    { name: 'Government Science College Orokam', category: 'Special Science Secondary School', address: 'Orokam Center, Ogbadibo LGA', established: 1989, rank: 15 },
    { name: 'Government Technical College Owukpa', category: 'Technical & Vocational College', address: 'Coal Fields Road, Owukpa', established: 1985, rank: 20 },
    { name: 'Community High School Ai-Oodo', category: 'Senior Secondary College', address: 'Ai-Oodo, Ogbadibo LGA', established: 1992, rank: 26 },
    { name: 'UBE Model Junior Academy Otukpa', category: 'Universal Basic Education / Junior High', address: 'Main Street, Otukpa', established: 2008, rank: 31 },
    // Primary / SUBEB Schools in Ogbadibo
    { name: 'LGEA Central Demonstration Primary School Otukpa', category: 'LGEA Demonstration Primary School', address: 'Branch Road, Otukpa', established: 1966, rank: 7 },
    { name: 'St. Paul\'s LGEA Primary School Orokam', category: 'LGEA Primary School (SUBEB)', address: 'Orokam Center, Ogbadibo LGA', established: 1975, rank: 12 },
    { name: 'LGEA Model Primary School Owukpa', category: 'State Government Model Primary School', address: 'Coal Fields Road, Owukpa', established: 1982, rank: 17 }
  ],
  'Ohimini': [
    { name: 'Government Secondary School Idekpa', category: 'Senior Secondary College', address: 'Onyagede Road, Idekpa, Ohimini LGA', established: 1983, rank: 16 },
    { name: 'Government Science College Onyagede', category: 'Special Science Secondary School', address: 'Onyagede Center, Ohimini LGA', established: 1994, rank: 21 },
    { name: 'Community High School Awume', category: 'Senior Secondary College', address: 'Awume Ward, Ohimini LGA', established: 1989, rank: 27 },
    { name: 'UBE Demonstration Academy Ochobo', category: 'Universal Basic Education / Junior High', address: 'Ochobo, Ohimini LGA', established: 2011, rank: 34 },
    // Primary / SUBEB Schools in Ohimini
    { name: 'LGEA Central Model Primary School Idekpa', category: 'State Government Model Primary School', address: 'Onyagede Road, Idekpa', established: 1967, rank: 10 },
    { name: 'LGEA Demonstration Primary School Onyagede', category: 'LGEA Demonstration Primary School', address: 'Onyagede Center, Ohimini LGA', established: 1978, rank: 15 },
    { name: 'RCM LGEA Primary School Awume', category: 'LGEA Primary School (SUBEB)', address: 'Awume Ward, Ohimini LGA', established: 1984, rank: 19 }
  ],
  'Oju': [
    { name: 'Government Secondary School Oju', category: 'Senior Secondary College', address: 'Ibilla Road, Oju LGA', established: 1980, rank: 14 },
    { name: 'Government Science Secondary School Ibilla', category: 'Special Science Secondary School', address: 'Ibilla Barracks Road, Oju LGA', established: 1992, rank: 19 },
    { name: 'Government Technical College Uwokwu', category: 'Technical & Vocational College', address: 'Uwokwu Hill Road, Oju LGA', established: 1987, rank: 25 },
    { name: 'Community High School Awe-Oju', category: 'Senior Secondary College', address: 'Awe Ward, Oju LGA', established: 1991, rank: 30 },
    { name: 'UBE Model Academy Oju-Township', category: 'Universal Basic Education / Junior High', address: 'Township Plaza, Oju', established: 2009, rank: 35 },
    // Primary / SUBEB Schools in Oju
    { name: 'LGEA Central Demonstration Primary School Oju', category: 'LGEA Demonstration Primary School', address: 'Ibilla Road, Oju Township', established: 1968, rank: 8 },
    { name: 'Methodist LGEA Primary School Ibilla', category: 'LGEA Primary School (SUBEB)', address: 'Ibilla Barracks Road, Oju LGA', established: 1977, rank: 13 },
    { name: 'LGEA Model Primary School Uwokwu', category: 'State Government Model Primary School', address: 'Uwokwu Hill Road, Oju LGA', established: 1983, rank: 18 }
  ],
  'Okpokwu': [
    { name: 'Government College Ugbokolo', category: 'Senior Secondary College', address: 'Otukpo-Enugu Expressway, Ugbokolo', established: 1976, rank: 8 },
    { name: 'Government Secondary School Okpoga', category: 'Senior Secondary College', address: 'Secretariat Road, Okpoga, Okpokwu LGA', established: 1981, rank: 12 },
    { name: 'Government Science College Ichama', category: 'Special Science Secondary School', address: 'Ichama Center, Okpokwu LGA', established: 1993, rank: 17 },
    { name: 'Community Model High School Eke', category: 'Senior Secondary College', address: 'Eke-Olengbecho, Okpokwu LGA', established: 1988, rank: 23 },
    { name: 'UBE Demonstration Academy Okpoga', category: 'Universal Basic Education / Junior High', address: 'Mission Compound, Okpoga', established: 2010, rank: 29 },
    // Primary / SUBEB Schools in Okpokwu
    { name: 'LGEA Central Demonstration Primary School Ugbokolo', category: 'LGEA Demonstration Primary School', address: 'Expressway Junction, Ugbokolo', established: 1965, rank: 6 },
    { name: 'St. Joseph\'s LGEA Model Primary School Okpoga', category: 'State Government Model Primary School', address: 'Secretariat Road, Okpoga', established: 1974, rank: 11 },
    { name: 'LGEA Primary School Ichama Central', category: 'LGEA Primary School (SUBEB)', address: 'Ichama Center, Okpokwu LGA', established: 1981, rank: 16 }
  ]
};

// Generate full realistic school profile if not explicitly in BENUE_GOVERNMENT_SCHOOLS
function generateCompleteGovSchool(lga: BenueLGA, template: { name: string; category: GovSchool['category']; address: string; established: number; rank: number }, index: number): GovSchool {
  const lgaMeta = getLgaMetadata(lga) || BENUE_LGAS_METADATA[0];
  const lgaCode = lga.substring(0, 3).toUpperCase();
  const isPrimary = template.category.includes('Primary') || template.category.includes('Basic') || template.category.includes('Special Education');
  const schoolCode = `BNS-${lgaCode}-${isPrimary ? 'PRM' : 'SEC'}-${String(index + 1).padStart(3, '0')}`;
  const schoolId = `SCH-${lgaCode}-${isPrimary ? 'PRM' : 'SEC'}-${String(index + 1).padStart(3, '0')}`;
  
  const avgStudents = Math.round(lgaMeta.totalStudentPopulation / lgaMeta.totalGovernmentSchools);
  const totalStudents = isPrimary 
    ? Math.max(380, Math.round(avgStudents * 0.65) + ((index % 3) * 60) - 30)
    : Math.max(650, avgStudents + ((index % 3) * 120) - 60);

  const maleStudents = Math.round(totalStudents * (0.51 + ((index % 2) * 0.02)));
  const femaleStudents = totalStudents - maleStudents;
  const boardingStudents = isPrimary ? 0 : Math.round(totalStudents * 0.48);
  const dayStudents = totalStudents - boardingStudents;
  
  const totalTeachers = isPrimary ? Math.max(18, Math.round(totalStudents / 22)) : Math.max(28, Math.round(totalStudents / 25));
  const trcnCertified = Math.round(totalTeachers * 0.94);
  const basePassRate = Math.min(97, Math.max(72, Number((lgaMeta.averagePassRate + (5 - index * 1.2)).toFixed(1))));

  const isExcellence = basePassRate >= 85;
  const isIntervention = basePassRate < 72;
  const priorityFlag = isExcellence ? 'Stable & Exemplary' : isIntervention ? 'High Priority Intervention' : 'Normal Operations';

  // Primary specific metrics vs Secondary metrics
  const nceePass = Math.min(98, basePassRate + 4);
  const pslePass = Math.min(99, basePassRate + 6);
  const egraReading = Math.min(96, basePassRate - 2 + (index % 4));
  const egmaMath = Math.min(95, basePassRate - 3 + (index % 4));
  const feedingRate = 96.5 + (index % 3);

  const principalTitle = isPrimary ? 'Headmaster/Headmistress' : 'Principal';
  const principalName = isPrimary 
    ? `Mrs. Eunice Mwuese ${lga} (NCE, B.Ed)`
    : `Mr. Dennis Terver ${lga} (M.Ed, TRCN)`;

  return {
    id: schoolId,
    code: schoolCode,
    name: template.name,
    lga,
    zone: lgaMeta.zone,
    category: template.category,
    principalName,
    vicePrincipalAcademic: isPrimary ? 'Mr. Jude Tersoo Aondo (NCE)' : 'Mrs. Judith Mwuese Akor (B.Ed)',
    bursarName: isPrimary ? 'Mrs. Grace Iorfa (LGEA Bursary Unit)' : 'Mr. Gabriel Iorpuu (CNA)',
    phone: `+234 80${index + 2} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(1000 + Math.random() * 8999)}`,
    email: `${template.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@subeb.benue.gov.ng`,
    address: `${template.address}, Benue State`,
    establishedYear: template.established,
    totalStudents,
    maleStudents,
    femaleStudents,
    boardingStudents,
    dayStudents,
    specialNeedsStudents: isPrimary ? (template.category.includes('Special') ? 42 : 4 + (index % 3)) : 3 + (index % 4),
    totalTeachers,
    trcnCertifiedTeachers: trcnCertified,
    nonAcademicStaff: isPrimary ? 8 + (index % 4) : 14 + (index % 6),
    teacherStudentRatio: `1:${Math.round(totalStudents / totalTeachers)}`,
    totalClassrooms: isPrimary ? 14 + (index % 4) : 20 + (index * 2),
    studentCapacityUtilization: 88 + (index % 7),
    currentTermProgress: {
      week: 8,
      totalWeeks: 13,
      term: '2nd Term',
      academicYear: '2025/2026',
      lastUpdated: '2026-08-28 14:00:00'
    },
    teacherKPIs: {
      attendanceRate: 93.0 + (index % 4),
      punctualityScore: 91.0 + (index % 4),
      lessonNoteSubmissionRate: 96.0 + (index % 3),
      curriculumCoverageRate: 79.0 + (index % 5),
      trcnComplianceRate: 92.0 + (index % 5),
      qualificationBreakdown: isPrimary 
        ? { nce: Math.round(totalTeachers * 0.55), bsc_bed: Math.round(totalTeachers * 0.40), msc_med: Math.round(totalTeachers * 0.05), phd: 0 }
        : { nce: 4, bsc_bed: totalTeachers - 10, msc_med: 5, phd: 1 },
      topPerformingDepartments: isPrimary 
        ? ['Early Childhood Care (ECCDE)', 'Primary Literacy & Phonics', 'Basic Science & Numeracy']
        : ['Science & Mathematics', 'Humanities & Languages', 'Vocational Studies'],
      teacherDeficitSubjects: isPrimary 
        ? ['Early Grade Phonics Specialist', 'Primary Science Facilitator']
        : (index % 2 === 0 ? ['Physics Specialist', 'Further Mathematics'] : ['Technical Drawing', 'Chemistry Technologist']),
      averageWeeklyWorkloadPeriods: isPrimary ? 22 : 18,
      lastVettingDate: '2026-08-24',
      staffCommendationCount: 6 + index,
      staffQueryCount: index % 2
    },
    studentKPIs: {
      overallPassRate: basePassRate,
      averageScore: Number((basePassRate * 0.89).toFixed(1)),
      waecBenchmarkPassRate: isPrimary ? nceePass : basePassRate,
      becePassRate: isPrimary ? 98.0 : Math.min(96, basePassRate + 5),
      attendanceRate: 94.2,
      dropoutRiskCount: isIntervention ? 4 : 1,
      genderParityIndex: Number((femaleStudents / maleStudents).toFixed(2)),
      gradeDistribution: {
        distinctions: Math.round(totalStudents * 0.22),
        credits: Math.round(totalStudents * 0.56),
        passes: Math.round(totalStudents * 0.16),
        fails: Math.round(totalStudents * 0.06)
      },
      scienceEnrollmentPercentage: isPrimary ? 100 : (template.category.includes('Science') ? 100 : 52.0),
      topPerformingSubjects: isPrimary 
        ? ['English Language & Reading', 'Basic Mathematics', 'Basic Science & Tech', 'Social Studies', 'Christian/Islamic Rel. Knowledge']
        : ['General Mathematics', 'Agricultural Science', 'Biology', 'English Language', 'Civic Education'],
      subjectsRequiringIntervention: isPrimary 
        ? ['Quantitative Reasoning Phonics', 'Cultural & Creative Arts']
        : ['Further Mathematics', 'Physics Practical'],
      scholarshipRecipientsCount: isPrimary ? 24 + index * 5 : 15 + index * 4,
      // SUBEB / Primary Specific
      isPrimarySchool: isPrimary,
      primarySchoolLeavingPassRate: pslePass,
      nationalCommonEntrancePassRate: nceePass,
      earlyGradeReadingIndex: egraReading,
      earlyGradeMathIndex: egmaMath,
      schoolFeedingComplianceRate: feedingRate,
      transitionToJuniorSecondaryRate: 98.5
    },
    financialStatement: {
      stateSubventionAllocated: isPrimary 
        ? Math.round((lgaMeta.subventionDisbursedNaira / lgaMeta.totalGovernmentSchools) * 0.55)
        : Math.round(lgaMeta.subventionDisbursedNaira / lgaMeta.totalGovernmentSchools),
      stateSubventionDisbursed: isPrimary 
        ? Math.round((lgaMeta.subventionDisbursedNaira / lgaMeta.totalGovernmentSchools) * 0.55)
        : Math.round(lgaMeta.subventionDisbursedNaira / lgaMeta.totalGovernmentSchools),
      ptaLevyTarget: isPrimary ? Math.round(totalStudents * 1800) : Math.round(totalStudents * 4500),
      ptaLevyCollected: isPrimary ? Math.round(totalStudents * 1700) : Math.round(totalStudents * 4200),
      examinationFeesRemitted: isPrimary ? Math.round(totalStudents * 1200) : Math.round(totalStudents * 2800),
      specialGrantReceived: isPrimary ? 3500000 + (index * 400000) : 2000000 + (index * 500000), // UBEC Matching Grant
      instructionalMaterialsExp: isPrimary ? 1600000 : 2200000,
      labConsumablesExp: isPrimary ? 800000 : 2000000,
      facilityMaintenanceExp: isPrimary ? 1200000 : 1800000,
      utilitiesAndSecurityExp: isPrimary ? 900000 : 1400000,
      sportsAndCoCurricularExp: isPrimary ? 550000 : 650000,
      staffWelfareAndAllowances: isPrimary ? 850000 : 1100000,
      totalRevenue: isPrimary 
        ? Math.round((lgaMeta.subventionDisbursedNaira / lgaMeta.totalGovernmentSchools) * 0.55) + Math.round(totalStudents * 1700) + 3500000
        : Math.round(lgaMeta.subventionDisbursedNaira / lgaMeta.totalGovernmentSchools) + Math.round(totalStudents * 4200) + 2000000,
      totalExpenditure: isPrimary 
        ? Math.round(((lgaMeta.subventionDisbursedNaira / lgaMeta.totalGovernmentSchools) * 0.55) * 0.8) + Math.round(totalStudents * 1700 * 0.75)
        : Math.round(lgaMeta.subventionDisbursedNaira / lgaMeta.totalGovernmentSchools * 0.82) + Math.round(totalStudents * 4200 * 0.8),
      netOperatingBalance: isPrimary ? 3100000 + (index * 200000) : 4200000 + (index * 300000),
      financialAuditStatus: 'Cleared & Verified',
      lastAuditDate: '2026-08-16',
      auditorRemarks: isPrimary 
        ? 'SUBEB Matching Grants and LGEA direct capitation verified without audit exceptions.'
        : 'Bursary accounts reconciled with zero variances.',
      bursarName: isPrimary ? 'Mrs. Grace Iorfa (LGEA Internal Auditor)' : 'Mr. Gabriel Iorpuu (CNA)'
    },
    governingBodyReview: {
      stateRanking: template.rank,
      totalSchoolsInState: 138,
      lgaRanking: index + 1,
      totalSchoolsInLGA: (LGA_SCHOOL_TEMPLATES[lga] || []).length,
      accreditationStatus: 'Full State Accreditation',
      infrastructure: {
        classrooms: isPrimary ? 4 : 4,
        scienceLabs: isPrimary ? 3 : (template.category.includes('Science') ? 5 : 4),
        ictCenter: isPrimary ? 3 : 4,
        library: isPrimary ? 4 : 4,
        sportsFacilities: 4,
        waterAndSanitation: 4,
        perimeterSecurity: 4,
        powerSupplyCondition: 'Grid & Solar Backup'
      },
      keyInterventionAlerts: [
        isPrimary 
          ? `Supply new standard classroom dual desks and primary English/Math textbooks from SUBEB central warehouse`
          : `Procure ${index % 2 === 0 ? 'additional solar backup batteries for ICT lab' : 'new glassware and reagents for chemistry laboratory'}`
      ],
      headquarterInspectionRemarks: isPrimary 
        ? `LGEA Model Primary Institution in ${lga} LGA with high pupil enrollment, active Home Grown School Feeding execution, and 94% TRCN compliance.`
        : `Accredited government institution in ${lga} LGA with stable pedagogical leadership and high TRCN compliance.`,
      governorBriefRecommendation: isPrimary 
        ? `Sustain SUBEB counterpart funding and include school in the State Universal Basic Education digital literacy pilot.`
        : `Maintain regular subvention disbursements and prioritize for the State ICT expansion scheme.`,
      governorPriorityFlag: priorityFlag,
      lastHqInspectionDate: '2026-08-20',
      zonalInspectorName: lgaMeta.educationSecretary
    }
  };
}

export function getSchoolsByLGA(lga: BenueLGA): GovSchool[] {
  // Check if we have explicit entries in BENUE_GOVERNMENT_SCHOOLS
  const explicit = BENUE_GOVERNMENT_SCHOOLS.filter(s => s.lga === lga);
  const templates = LGA_SCHOOL_TEMPLATES[lga] || [];
  
  if (explicit.length >= templates.length && explicit.length > 0) {
    return explicit;
  }

  // Merge explicit entries with template generated entries to guarantee 4-6 schools per LGA
  const schools: GovSchool[] = [...explicit];
  const existingNames = new Set(explicit.map(s => s.name.toLowerCase().trim()));

  templates.forEach((tmpl, idx) => {
    if (!existingNames.has(tmpl.name.toLowerCase().trim())) {
      schools.push(generateCompleteGovSchool(lga, tmpl, idx));
    }
  });

  return schools;
}

export function getSchoolsByZone(zone: SenatorialZone): GovSchool[] {
  const lgasInZone = BENUE_LGAS_METADATA.filter(l => l.zone === zone).map(l => l.lga);
  const allSchools: GovSchool[] = [];
  lgasInZone.forEach(lga => {
    allSchools.push(...getSchoolsByLGA(lga));
  });
  return allSchools;
}

export function getGovSchoolById(id: string): GovSchool | undefined {
  const direct = BENUE_GOVERNMENT_SCHOOLS.find(s => s.id === id || s.code === id);
  if (direct) return direct;

  // Search across all LGA generated schools
  for (const lgaMeta of BENUE_LGAS_METADATA) {
    const schools = getSchoolsByLGA(lgaMeta.lga);
    const found = schools.find(s => s.id === id || s.code === id || s.name.toLowerCase() === id.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

export function getLgaMetadata(lga: BenueLGA): LGAMetadata | undefined {
  return BENUE_LGAS_METADATA.find(l => l.lga === lga);
}

// Dynamically simulate term progression impact on school KPIs
export function simulateTermWeekProgress(school: GovSchool, targetWeek: number): GovSchool {
  const weekRatio = targetWeek / 13;
  const simulatedCoverage = Math.min(100, Math.round(weekRatio * 100));
  const simulatedAttendance = Math.min(99, Math.round(90 + (Math.sin(targetWeek) * 4)));
  const simulatedPassRate = Math.min(98, Math.round(school.studentKPIs.overallPassRate + ((targetWeek - 8) * 0.4)));

  return {
    ...school,
    currentTermProgress: {
      ...school.currentTermProgress,
      week: targetWeek,
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19)
    },
    teacherKPIs: {
      ...school.teacherKPIs,
      curriculumCoverageRate: simulatedCoverage,
      attendanceRate: simulatedAttendance
    },
    studentKPIs: {
      ...school.studentKPIs,
      overallPassRate: simulatedPassRate,
      attendanceRate: simulatedAttendance
    }
  };
}

