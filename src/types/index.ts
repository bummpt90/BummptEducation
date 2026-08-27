export type NavigationPage = 
  | 'home' 
  | 'academic' 
  | 'lesson-notes'
  | 'admin' 
  | 'organogram' 
  | 'about' 
  | 'contact' 
  | 'docs' 
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

export function getSchoolArm(classLevel: ClassLevel): SchoolArm {
  if (classLevel === 'KG 1' || classLevel === 'KG 2' || classLevel === 'KG 3') {
    return 'kindergarten';
  }
  if (
    classLevel === 'Basic 1' ||
    classLevel === 'Basic 2' ||
    classLevel === 'Basic 3' ||
    classLevel === 'Basic 4' ||
    classLevel === 'Basic 5' ||
    classLevel === 'Basic 6'
  ) {
    return 'primary';
  }
  return 'secondary';
}

export type Term = '1st Term' | '2nd Term' | '3rd Term';
export type AcademicYear = '2025/2026' | '2026/2027';

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
}

export interface PsychomotorAssessment {
  punctuality: number; // 1-5
  neatness: number;
  politeness: number;
  honesty: number;
  peerRelationship: number;
  leadership: number;
  handwriting: number;
  sportsAndGames: number;
  craftsAndPractical: number;
  attentiveness: number;
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
  positionInClass: number;
  totalStudentsInClass: number;
  psychomotor: PsychomotorAssessment;
  attendancePresent: number;
  attendanceTotalDays: number;
  formTutorRemark: string;
  formTutorName: string;
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

