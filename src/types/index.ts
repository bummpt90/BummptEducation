export type NavigationPage = 
  | 'home' 
  | 'state-hq'
  | 'benue-state-hq'
  | 'academic' 
  | 'lesson-notes'
  | 'admin' 
  | 'organogram' 
  | 'about' 
  | 'contact' 
  | 'docs' 
  | 'dev-docs'
  | 'developer-docs'
  | 'privacy'
  | 'kindergarten-arm'
  | 'primary-arm'
  | 'secondary-arm'
  | 'student-leadership';

export type UserRole = 'principal' | 'administrator' | 'headmistress' | 'head_kindergarten' | 'teacher' | 'bursar' | 'student' | 'parent';

export type SchoolArm = 'kindergarten' | 'primary' | 'secondary';

export type ClassLevel = 
  // Kindergarten / Early Years
  | 'KG 1'
  | 'KG 2'
  | 'KG 3'
  // Primary / Basic Education
  | 'Basic 1'
  | 'Basic 2'
  | 'Basic 3'
  | 'Basic 4'
  | 'Basic 5'
  | 'Basic 6'
  // Secondary / College
  | 'JSS 1' 
  | 'JSS 2' 
  | 'JSS 3' 
  | 'SSS 1 Science' 
  | 'SSS 1 Arts' 
  | 'SSS 1 Commercial' 
  | 'SSS 2 Science' 
  | 'SSS 2 Arts' 
  | 'SSS 2 Commercial' 
  | 'SSS 3 Science' 
  | 'SSS 3 Arts' 
  | 'SSS 3 Commercial';

export function getSchoolArm(classLevel: string | ClassLevel): SchoolArm {
  if (!classLevel) return 'secondary';
  if (classLevel.startsWith('KG') || classLevel === 'KG 1' || classLevel === 'KG 2' || classLevel === 'KG 3') {
    return 'kindergarten';
  }
  if (classLevel.startsWith('Basic') || classLevel.startsWith('Primary')) {
    return 'primary';
  }
  return 'secondary';
}

export type Term = '1st Term' | '2nd Term' | '3rd Term';
export type AcademicYear = '2024/2025' | '2025/2026' | '2026/2027';

export type SubjectCategory = 
  | 'Core' 
  | 'Science & Math' 
  | 'Humanities & Arts' 
  | 'Business & Commercial' 
  | 'Vocational & Tech' 
  | 'Languages' 
  | 'Early Learning' 
  | 'Primary Basic';

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: SubjectCategory;
  departmentId: string;
  arm: SchoolArm | 'All';
  applicableLevels: ('KG' | 'Primary' | 'JSS' | 'SSS_Science' | 'SSS_Arts' | 'SSS_Commercial')[];
}

// Grading scales for the different arms
export type StandardGrade = 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';
export type WaecGrade = StandardGrade; // alias for backwards compatibility

export type PrimaryGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type EarlyYearsMastery = 'Exceeding' | 'Proficient' | 'Developing' | 'Emerging';

export interface EarlyYearsMilestone {
  domain: 'Communication & Phonics' | 'Early Numeracy & Shapes' | 'Physical & Fine Motor Skills' | 'Personal & Social Development' | 'Creative Arts & Rhymes' | 'Sensory & Discovery';
  skill: string;
  mastery: EarlyYearsMastery;
  ratingScore: number; // 1-4
  teacherComment: string;
}

export interface AffectiveDomain {
  punctuality: number; // 1-5
  neatness: number; // 1-5
  politeness: number; // 1-5
  honesty: number; // 1-5
  peerRelationship: number; // 1-5
  leadership: number; // 1-5
  emotionalStability: number; // 1-5
  obedience: number; // 1-5
  attentiveness: number; // 1-5
  perseverance: number; // 1-5
}

export interface PsychomotorDomain {
  handwriting: number; // 1-5
  sportsAndGames: number; // 1-5
  craftsAndPractical: number; // 1-5
  verbalFluency: number; // 1-5
  musicalDramatic: number; // 1-5
  handlingOfTools: number; // 1-5
  physicalAgility: number; // 1-5
}

// Backward compatible alias
export interface PsychomotorAssessment extends AffectiveDomain, PsychomotorDomain {
  sports?: number;
  crafts?: number;
  speechFluency?: number;
}

export interface AssessmentScore {
  studentId: string;
  subjectId: string;
  classLevel: ClassLevel;
  term: Term;
  academicYear: AcademicYear;
  ca1: number; // Max 10
  ca2: number; // Max 10
  assignment: number; // Max 10
  attendance: number; // Max 10
  totalCa: number; // Max 40 (computed)
  examScore: number; // Max 60
  totalScore: number; // Max 100 (computed)
  grade: StandardGrade | PrimaryGrade | string;
  remark: string;
  positionInSubject?: number;
  classMin?: number;
  classMax?: number;
  classAverage?: number;
}

export interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  currentClass: ClassLevel;
  arm: SchoolArm;
  house: 'Eagle House (Blue)' | 'Falcon House (Red)' | 'Cheetah House (Green)' | 'Lion House (Yellow)';
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  stateOfOrigin: string;
  dateEnrolled: string;
  status: 'Active' | 'Withdrawn' | 'Graduated' | 'Suspended';
  isPrefect?: boolean;
  prefectRole?: string;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  timesSchoolOpened: number;
  timesPresent: number;
  timesAbsent: number;
  timesPunctual: number;
}

export interface StudentReportCard {
  id: string;
  studentId: string;
  classLevel: ClassLevel;
  arm: SchoolArm;
  term: Term;
  academicYear: AcademicYear;
  scores: AssessmentScore[];
  earlyYearsMilestones?: EarlyYearsMilestone[]; // For Kindergarten arm
  totalScoreObtained: number;
  totalPossibleScore: number;
  overallPercentage: number;
  classAverage: number;
  classHighest?: number;
  classLowest?: number;
  positionInClass: number;
  totalStudentsInClass: number;
  gpa?: number; // 5.0 scale for Secondary / 4.0 scale
  affective: AffectiveDomain;
  psychomotor: PsychomotorDomain;
  attendance?: AttendanceRecord;
  attendancePresent?: number; // legacy fallback
  attendanceTotalDays?: number; // legacy fallback
  formTutorRemark: string;
  formTutorName: string;
  formTutorSignatureDate?: string;
  sportsMasterRemark?: string;
  sportsMasterName?: string;
  guidanceCounselorRemark?: string;
  guidanceCounselorName?: string;
  principalRemark: string; // Sub-head / Sectional Head / Principal remark
  principalName: string;
  principalTitle?: string; // e.g. "Head of Kindergarten", "Headmistress (Primary)", "Principal (Secondary)"
  promotionalStatus?: 
    | 'Promoted to Next Class' 
    | 'Promoted on Trial' 
    | 'Resit Deficient Subjects' 
    | 'Repeat Class' 
    | 'Eligible for Finals (WAEC / NECO / IGCSE / SAT / JAMB)' 
    | 'Eligible for NCEE & Common Entrance'
    | 'Ready for Primary Transition (Basic 1)'
    | 'N/A';
  nextTermBegins: string;
  nextTermFeesEstimate?: string;
  approvalStatus?: 'Draft' | 'Approved & Published' | 'Requires Correction';
  isParentViewable?: boolean;
}

export interface Staff {
  id: string;
  staffId: string;
  fullName: string;
  type: 'Teaching' | 'Non-Teaching';
  departmentId: string;
  arm: SchoolArm | 'All';
  designation: string;
  role: 
    | 'Administrator'
    | 'Head of Kindergarten'
    | 'Headmistress'
    | 'Principal' 
    | 'VP Academic' 
    | 'VP Admin' 
    | 'HOD' 
    | 'Form Tutor' 
    | 'Subject Teacher' 
    | 'Exam Officer' 
    | 'Bursar' 
    | 'Librarian' 
    | 'Facility Manager' 
    | 'Staff';
  assignedClass?: ClassLevel;
  assignedSubjects?: string[];
  qualifications: string;
  email: string;
  phone: string;
  dateJoined: string;
  status: 'Active' | 'On Leave' | 'Resigned';
}

export interface StaffApplicant {
  id: string;
  fullName: string;
  arm: SchoolArm | 'All';
  roleApplied: string;
  qualifications: string;
  yearsExperience: number;
  interviewScore: number; // 0-100
  phone: string;
  email: string;
  status: 'Shortlisted' | 'Interviewed' | 'Hired' | 'Rejected';
  appliedDate: string;
}

export interface CourseAllocation {
  id: string;
  staffId: string;
  subjectId: string;
  classLevel: ClassLevel;
  periodsPerWeek: number;
}

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  isCompulsory: boolean;
  category: 'Tuition' | 'Development' | 'PTA' | 'Laboratory' | 'ICT & STEM' | 'Boarding' | 'Uniform & Books' | 'Early Years Kit & Meals' | 'Common Entrance Prep';
}

export interface FeeSchedule {
  classLevel: ClassLevel;
  arm: SchoolArm;
  term: Term;
  academicYear: AcademicYear;
  items: FeeItem[];
  totalAmount: number;
}

export interface FeePayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  classLevel: ClassLevel;
  arm: SchoolArm;
  term: Term;
  academicYear: AcademicYear;
  amountPaid: number;
  totalBilled: number;
  balance: number;
  paymentDate: string;
  paymentMethod: 'Bank Transfer' | 'POS' | 'Cash / Bank Teller' | 'Online Gateway';
  status: 'Fully Paid' | 'Partial' | 'Unpaid';
  collectedBy: string;
}

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  studentName: string;
  appliedClass: ClassLevel;
  arm: SchoolArm;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  previousSchool?: string;
  // Arm-specific intake criteria
  developmentalReadinessScore?: number; // 0-100 for Kindergarten
  immunizationCompleted?: boolean;
  toiletTrained?: boolean;
  entranceExamScore?: number; // 0-100 for Primary & Secondary
  interviewScore?: number; // 0-100
  status: 'Pending Review' | 'Entrance Exam Scheduled' | 'Developmental Screening Scheduled' | 'Passed - Admitted' | 'Waitlisted' | 'Rejected';
  submittedDate: string;
}

export interface DailyAttendanceRecord {
  date: string;
  classLevel: ClassLevel;
  records: {
    studentId: string;
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    remark?: string;
  }[];
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  arm?: SchoolArm | 'All';
  category: 'Academic' | 'Administrative' | 'Sports & Events' | 'Examination' | 'Early Years';
  content: string;
  targetAudience: 'All' | 'Students & Parents' | 'Teachers & Staff' | 'Kindergarten Parents' | 'Primary Parents' | 'Secondary Parents';
  isImportant?: boolean;
}

export interface OrganogramNode {
  id: string;
  title: string;
  holderName: string;
  wing: 'Executive' | 'Early Years Wing' | 'Primary Wing' | 'Secondary Academic Wing' | 'Central Administrative Wing' | 'Student Leadership';
  arm?: SchoolArm | 'Executive' | 'Central';
  reportsTo?: string;
  description: string;
  responsibilities: string[];
}

export interface LessonNote {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  classLevel: ClassLevel;
  arm: SchoolArm;
  term: Term;
  academicYear: AcademicYear;
  weekNumber: number; // 1 to 12
  teacherId: string;
  teacherName: string;
  topic: string;
  subTopics: string[];
  learningObjectives: string[];
  instructionalMaterials?: string[];
  contentSummary: string;
  contentBody: string;
  evaluationQuestions: string[];
  pdfUrl?: string;
  pdfFileName: string;
  pdfFileSize: string;
  uploadedAt: string;
  downloadCount: number;
  status: 'Published' | 'Draft' | 'Archived';
  keyTerms?: string[];
}

export interface LessonFeedback {
  id: string;
  lessonNoteId: string;
  parentName: string;
  studentName: string;
  guardianPhone?: string;
  question: string;
  reply?: string;
  repliedBy?: string;
  createdAt: string;
  status: 'Answered' | 'Pending';
}

// ==================== BENUE STATE GOVERNANCE & 23 LGAS TYPES ====================

export type BenueLGA = 
  | 'Ado'
  | 'Agatu'
  | 'Apa'
  | 'Buruku'
  | 'Gboko'
  | 'Guma'
  | 'Gwer East'
  | 'Gwer West'
  | 'Katsina-Ala'
  | 'Konshisha'
  | 'Kwande'
  | 'Logo'
  | 'Makurdi'
  | 'Obi'
  | 'Ogbadibo'
  | 'Ohimini'
  | 'Oju'
  | 'Okpokwu'
  | 'Otukpo'
  | 'Tarka'
  | 'Ukum'
  | 'Ushongo'
  | 'Vandeikya';

export type SenatorialZone = 
  | 'Zone A (Benue North-East)' 
  | 'Zone B (Benue North-West)' 
  | 'Zone C (Benue South)';

export type GovSchoolCategory = 
  | 'State Government Model Primary School'
  | 'LGEA Primary School (SUBEB)'
  | 'LGEA Demonstration Primary School'
  | 'Special Education Model Primary School'
  | 'Universal Basic Education / Junior High'
  | 'State Model Basic / UBE'
  | 'Senior Secondary College'
  | 'Special Science Secondary School'
  | 'Technical & Vocational College'
  | 'Government Comprehensive High School'
  | 'Comprehensive High School';

export type GovEducationLevel = 'All' | 'Primary (Basic 1-6)' | 'Junior High (JSS 1-3)' | 'Senior College (SSS 1-3)' | 'Technical & Vocational';

export interface LGAMetadata {
  lga: BenueLGA;
  zone: SenatorialZone;
  headquarters: string;
  educationSecretary: string;
  totalGovernmentSchools: number;
  totalStudentPopulation: number;
  totalTeacherCount: number;
  averagePassRate: number;
  subventionDisbursedNaira: number;
  priorityFlag: 'Normal' | 'Needs Attention' | 'Intervention Required' | 'Excellence Zone';
}

export interface TeacherPerformanceKPIs {
  attendanceRate: number; // 0-100%
  punctualityScore: number; // 0-100%
  lessonNoteSubmissionRate: number; // 0-100%
  curriculumCoverageRate: number; // 0-100%
  trcnComplianceRate: number; // 0-100%
  qualificationBreakdown: {
    nce: number;
    bsc_bed: number;
    msc_med: number;
    phd: number;
  };
  topPerformingDepartments: string[];
  teacherDeficitSubjects: string[];
  averageWeeklyWorkloadPeriods: number;
  lastVettingDate: string;
  staffCommendationCount: number;
  staffQueryCount: number;
}

export interface StudentPerformanceKPIs {
  overallPassRate: number; // 0-100%
  averageScore: number; // 0-100
  waecBenchmarkPassRate: number; // % achieving 5+ credits including Math & English (or NCEE/PSLE pass rate for Primary)
  becePassRate: number; // % Basic Education pass
  attendanceRate: number; // 0-100%
  dropoutRiskCount: number;
  genderParityIndex: number; // female to male ratio
  gradeDistribution: {
    distinctions: number; // A1
    credits: number; // B2-C6
    passes: number; // D7-E8
    fails: number; // F9
  };
  scienceEnrollmentPercentage: number;
  topPerformingSubjects: string[];
  subjectsRequiringIntervention: string[];
  scholarshipRecipientsCount: number;
  // Primary / Basic Education specific metrics
  isPrimarySchool?: boolean;
  primarySchoolLeavingPassRate?: number;
  nationalCommonEntrancePassRate?: number;
  earlyGradeReadingIndex?: number; // 0-100% (EGRA)
  earlyGradeMathIndex?: number; // 0-100% (EGMA)
  schoolFeedingComplianceRate?: number; // 0-100% (HGSFP)
  transitionToJuniorSecondaryRate?: number; // 0-100%
}

export interface SchoolFinancialStatement {
  stateSubventionAllocated: number; // in Naira (₦)
  stateSubventionDisbursed: number; // in Naira (₦)
  ptaLevyTarget: number;
  ptaLevyCollected: number;
  examinationFeesRemitted: number;
  specialGrantReceived: number;
  
  // Expenditures
  instructionalMaterialsExp: number;
  labConsumablesExp: number;
  facilityMaintenanceExp: number;
  utilitiesAndSecurityExp: number;
  sportsAndCoCurricularExp: number;
  staffWelfareAndAllowances: number;
  
  totalRevenue: number;
  totalExpenditure: number;
  netOperatingBalance: number;
  financialAuditStatus: 'Cleared & Verified' | 'Audit Pending' | 'Discrepancy Under Review' | 'Queries Issued';
  lastAuditDate: string;
  auditorRemarks: string;
  bursarName: string;
}

export interface SchoolInfrastructureRating {
  classrooms: number; // 1-5
  scienceLabs: number; // 1-5 (Physics, Chem, Biology)
  ictCenter: number; // 1-5 (Computers, Internet)
  library: number; // 1-5
  sportsFacilities: number; // 1-5
  waterAndSanitation: number; // 1-5
  perimeterSecurity: number; // 1-5
  powerSupplyCondition: 'Grid & Solar Backup' | 'Solar Primary' | 'Generator Only' | 'Unreliable Grid';
}

export interface GoverningBodyReview {
  stateRanking: number;
  totalSchoolsInState: number;
  lgaRanking: number;
  totalSchoolsInLGA: number;
  accreditationStatus: 'Full State Accreditation' | 'Interim Approval' | 'Subject to Science Lab Upgrade' | 'Special Intervention';
  infrastructure: SchoolInfrastructureRating;
  keyInterventionAlerts: string[];
  headquarterInspectionRemarks: string;
  governorBriefRecommendation: string;
  governorPriorityFlag: 'High Priority Intervention' | 'Stable & Exemplary' | 'Needs Staffing Support' | 'Needs Infrastructure Upgrade' | 'Normal Operations';
  lastHqInspectionDate: string;
  zonalInspectorName: string;
}

export interface GovSchool {
  id: string;
  code: string; // e.g. BNS-MKD-001
  name: string;
  lga: BenueLGA;
  zone: SenatorialZone;
  category: GovSchoolCategory;
  principalName: string;
  vicePrincipalAcademic: string;
  bursarName: string;
  phone: string;
  email: string;
  address: string;
  establishedYear: number;
  
  // Population
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  boardingStudents: number;
  dayStudents: number;
  specialNeedsStudents: number;
  totalTeachers: number;
  trcnCertifiedTeachers: number;
  nonAcademicStaff: number;
  teacherStudentRatio: string;
  totalClassrooms: number;
  studentCapacityUtilization: number; // e.g. 92%
  
  // Dynamic Term Progress
  currentTermProgress: {
    week: number; // 1 to 13
    totalWeeks: number;
    term: Term;
    academicYear: string;
    lastUpdated: string;
  };
  
  // Audited Performance Hubs
  teacherKPIs: TeacherPerformanceKPIs;
  studentKPIs: StudentPerformanceKPIs;
  financialStatement: SchoolFinancialStatement;
  governingBodyReview: GoverningBodyReview;
}


