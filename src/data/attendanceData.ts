import { 
  ClassLevel, 
  SchoolArm, 
  Term, 
  AcademicYear, 
  Student, 
  DailyAttendanceEntry, 
  TermCalendarDay, 
  StudentAttendanceSummary, 
  ClassAttendanceSessionSummary 
} from '../types';
import { INITIAL_STUDENTS } from './mockData';

// ==================== ALL 21 CLASSES STRUCTURE (KG 1 to SSS 3) ====================
export interface ClassDefinition {
  level: ClassLevel;
  arm: SchoolArm;
  name: string;
  category: 'Kindergarten & Early Years' | 'Primary Basic Education' | 'Junior Secondary' | 'Senior Secondary';
  formMaster: {
    fullName: string;
    staffId: string;
    designation: string;
    phone: string;
    email: string;
    qualifications: string;
    trcnNumber: string;
  };
  classroom: string;
  capacity: number;
}

export const ALL_CLASSES_DEFINITIONS: ClassDefinition[] = [
  // Kindergarten Arm
  {
    level: 'KG 1',
    arm: 'kindergarten',
    name: 'Kindergarten 1 (Early Foundation • Age 2-3)',
    category: 'Kindergarten & Early Years',
    formMaster: {
      fullName: 'Mrs. Comfort Chisom Eze',
      staffId: 'BEDU/STAFF/EY03',
      designation: 'Form Mistress (KG 1) & Phonics Specialist',
      phone: '+234 809 223 3445',
      email: 'c.eze@bummpteducation.edu.ng',
      qualifications: 'NCE Early Childhood Education, B.A. (Ed) English, TRCN Certified',
      trcnNumber: 'TRCN/BN/2019/78214'
    },
    classroom: 'Early Years Wing Block A - Room 1',
    capacity: 25
  },
  {
    level: 'KG 2',
    arm: 'kindergarten',
    name: 'Kindergarten 2 (Montessori Discovery • Age 3-4)',
    category: 'Kindergarten & Early Years',
    formMaster: {
      fullName: 'Mrs. Abigail Folashade Balogun',
      staffId: 'BEDU/STAFF/EY01',
      designation: 'Head of Early Years & KG 2 Form Mistress',
      phone: '+234 807 889 0011',
      email: 'head.kindergarten@bummpteducation.edu.ng',
      qualifications: 'M.Ed Early Childhood, Montessori Diploma, B.Ed Guidance & Counseling',
      trcnNumber: 'TRCN/BN/2015/44109'
    },
    classroom: 'Early Years Wing Block A - Room 2',
    capacity: 25
  },
  {
    level: 'KG 3',
    arm: 'kindergarten',
    name: 'Kindergarten 3 (Transition to Primary • Age 4-5)',
    category: 'Kindergarten & Early Years',
    formMaster: {
      fullName: 'Miss Rita Nguveren Iorfa',
      staffId: 'BEDU/STAFF/EY02',
      designation: 'Lead Educator & KG 3 Form Mistress',
      phone: '+234 813 445 6677',
      email: 'r.iorfa@bummpteducation.edu.ng',
      qualifications: 'B.Ed Early Childhood Care & Education, TRCN Certified',
      trcnNumber: 'TRCN/BN/2021/98552'
    },
    classroom: 'Early Years Wing Block A - Room 3',
    capacity: 25
  },

  // Primary School Arm (Basic 1 - 6)
  {
    level: 'Basic 1',
    arm: 'primary',
    name: 'Basic 1 (Primary 1 Foundation Class)',
    category: 'Primary Basic Education',
    formMaster: {
      fullName: 'Mrs. Mercy Mngunengen Tyav',
      staffId: 'BEDU/STAFF/PRI05',
      designation: 'Class Teacher (Basic 1) & Primary Literacy Lead',
      phone: '+234 814 556 7788',
      email: 'm.tyav@bummpteducation.edu.ng',
      qualifications: 'B.Ed Primary Education Studies, TRCN Certified',
      trcnNumber: 'TRCN/BN/2020/66301'
    },
    classroom: 'Primary Block 1 - Ground Floor Room 101',
    capacity: 30
  },
  {
    level: 'Basic 2',
    arm: 'primary',
    name: 'Basic 2 (Primary 2 Elementary Class)',
    category: 'Primary Basic Education',
    formMaster: {
      fullName: 'Mr. Stephen Aernan Gbande',
      staffId: 'BEDU/STAFF/PRI06',
      designation: 'Class Teacher (Basic 2) & Numeracy Specialist',
      phone: '+234 803 661 2299',
      email: 's.gbande@bummpteducation.edu.ng',
      qualifications: 'B.Sc. (Ed) Mathematics, NCE Primary Education',
      trcnNumber: 'TRCN/BN/2018/31204'
    },
    classroom: 'Primary Block 1 - Ground Floor Room 102',
    capacity: 30
  },
  {
    level: 'Basic 3',
    arm: 'primary',
    name: 'Basic 3 (Primary 3 Lower Primary Class)',
    category: 'Primary Basic Education',
    formMaster: {
      fullName: 'Mrs. Hadiza Abubakar',
      staffId: 'BEDU/STAFF/PRI03',
      designation: 'Class Teacher (Basic 3) & Diction Facilitator',
      phone: '+234 805 112 3344',
      email: 'h.abubakar@bummpteducation.edu.ng',
      qualifications: 'B.A. (Ed) English, NCE Primary Education',
      trcnNumber: 'TRCN/BN/2019/55489'
    },
    classroom: 'Primary Block 1 - First Floor Room 201',
    capacity: 30
  },
  {
    level: 'Basic 4',
    arm: 'primary',
    name: 'Basic 4 (Primary 4 Middle Primary Class)',
    category: 'Primary Basic Education',
    formMaster: {
      fullName: 'Mr. Jude Chukwudi Okafor',
      staffId: 'BEDU/STAFF/PRI04',
      designation: 'Class Teacher (Basic 4) & Primary STEM Specialist',
      phone: '+234 814 667 8899',
      email: 'j.okafor@bummpteducation.edu.ng',
      qualifications: 'B.Tech Computer Science, PGDE, TRCN Certified',
      trcnNumber: 'TRCN/BN/2021/80112'
    },
    classroom: 'Primary Block 2 - Ground Floor Room 103',
    capacity: 30
  },
  {
    level: 'Basic 5',
    arm: 'primary',
    name: 'Basic 5 (Primary 5 Upper Primary Class)',
    category: 'Primary Basic Education',
    formMaster: {
      fullName: 'Mrs. Scholastica Nkechi Igwe',
      staffId: 'BEDU/STAFF/PRI07',
      designation: 'Class Teacher (Basic 5) & Science Lead',
      phone: '+234 806 882 1100',
      email: 's.igwe@bummpteducation.edu.ng',
      qualifications: 'B.Ed Science Education (Biology), TRCN Certified',
      trcnNumber: 'TRCN/BN/2017/29045'
    },
    classroom: 'Primary Block 2 - First Floor Room 202',
    capacity: 30
  },
  {
    level: 'Basic 6',
    arm: 'primary',
    name: 'Basic 6 (Primary 6 Common Entrance Exam Class)',
    category: 'Primary Basic Education',
    formMaster: {
      fullName: 'Mr. Moses Terfa Aondo',
      staffId: 'BEDU/STAFF/PRI02',
      designation: 'Class Teacher (Basic 6) & NCEE Examination Lead',
      phone: '+234 802 331 4455',
      email: 'm.aondo@bummpteducation.edu.ng',
      qualifications: 'B.Sc. (Ed) Mathematics, TRCN Master Educator',
      trcnNumber: 'TRCN/BN/2016/19088'
    },
    classroom: 'Primary Block 2 - First Floor Room 203 (Graduating Wing)',
    capacity: 30
  },

  // Junior Secondary Arm (JSS 1 - 3)
  {
    level: 'JSS 1',
    arm: 'secondary',
    name: 'Junior Secondary School 1 (JSS 1 Freshers)',
    category: 'Junior Secondary',
    formMaster: {
      fullName: 'Mr. Somtochukwu Paul Nnamdi Snr',
      staffId: 'BEDU/STAFF/09',
      designation: 'Form Tutor (JSS 1) & Basic Technology Master',
      phone: '+234 803 771 9922',
      email: 's.nnamdi@bummpteducation.edu.ng',
      qualifications: 'B.Eng Mechanical Engineering, PGDE, TRCN Certified',
      trcnNumber: 'TRCN/BN/2020/55120'
    },
    classroom: 'College Wing - Junior Complex Block J1',
    capacity: 35
  },
  {
    level: 'JSS 2',
    arm: 'secondary',
    name: 'Junior Secondary School 2 (JSS 2 Intermediate)',
    category: 'Junior Secondary',
    formMaster: {
      fullName: 'Mrs. Keren Kator Tersoo',
      staffId: 'BEDU/STAFF/10',
      designation: 'Form Tutor (JSS 2) & Social Studies Lead',
      phone: '+234 816 441 5566',
      email: 'k.tersoo@bummpteducation.edu.ng',
      qualifications: 'B.A. (Ed) History & International Studies',
      trcnNumber: 'TRCN/BN/2019/33091'
    },
    classroom: 'College Wing - Junior Complex Block J2',
    capacity: 35
  },
  {
    level: 'JSS 3',
    arm: 'secondary',
    name: 'Junior Secondary School 3 (BECE / Junior WAEC Class)',
    category: 'Junior Secondary',
    formMaster: {
      fullName: 'Mr. Chidi Eze',
      staffId: 'BEDU/STAFF/08',
      designation: 'Form Tutor (JSS 3) & Mathematics Master',
      phone: '+234 816 777 8899',
      email: 'c.eze@bummpteducation.edu.ng',
      qualifications: 'B.Sc. Mathematics & Statistics, TRCN Certified',
      trcnNumber: 'TRCN/BN/2018/67401'
    },
    classroom: 'College Wing - Junior Complex Block J3',
    capacity: 35
  },

  // Senior Secondary 1
  {
    level: 'SSS 1 Science',
    arm: 'secondary',
    name: 'Senior Secondary 1 - Science Faculty',
    category: 'Senior Secondary',
    formMaster: {
      fullName: 'Mr. Anthony Terungwa Igbawase',
      staffId: 'BEDU/STAFF/11',
      designation: 'Form Tutor (SSS 1 Science) & Chemistry Specialist',
      phone: '+234 803 112 9900',
      email: 'a.igbawase@bummpteducation.edu.ng',
      qualifications: 'B.Sc. Pure Chemistry, PGDE, TRCN Certified',
      trcnNumber: 'TRCN/BN/2017/44912'
    },
    classroom: 'Senior College Block - Science Wing Room S101',
    capacity: 35
  },
  {
    level: 'SSS 1 Arts',
    arm: 'secondary',
    name: 'Senior Secondary 1 - Arts & Humanities',
    category: 'Senior Secondary',
    formMaster: {
      fullName: 'Mrs. Fatima Al-Hassan',
      staffId: 'BEDU/STAFF/04',
      designation: 'Chief Exam Officer & SSS 1 Arts Form Tutor',
      phone: '+234 809 111 2233',
      email: 'exams@bummpteducation.edu.ng',
      qualifications: 'M.Ed Measurement & Evaluation, B.A. Literature, TRCN',
      trcnNumber: 'TRCN/BN/2015/12803'
    },
    classroom: 'Senior College Block - Arts Wing Room A101',
    capacity: 35
  },
  {
    level: 'SSS 1 Commercial',
    arm: 'secondary',
    name: 'Senior Secondary 1 - Business & Commercial',
    category: 'Senior Secondary',
    formMaster: {
      fullName: 'Mr. Jude Msughter Tyav',
      staffId: 'BEDU/STAFF/05',
      designation: 'School Bursar & SSS 1 Commercial Form Tutor',
      phone: '+234 811 523 1834',
      email: 'bursar@bummpteducation.edu.ng',
      qualifications: 'B.Sc. Accounting, ACA (ICAN), TRCN Certified',
      trcnNumber: 'TRCN/BN/2016/88902'
    },
    classroom: 'Senior College Block - Commercial Wing Room C101',
    capacity: 35
  },

  // Senior Secondary 2
  {
    level: 'SSS 2 Science',
    arm: 'secondary',
    name: 'Senior Secondary 2 - Science Faculty',
    category: 'Senior Secondary',
    formMaster: {
      fullName: 'Mr. Emmanuel Terkula Iorfa',
      staffId: 'BEDU/STAFF/02',
      designation: 'Vice-Principal (Academics) & SSS 2 Science Form Tutor',
      phone: '+234 802 345 6789',
      email: 'vp.academic@bummpteducation.edu.ng',
      qualifications: 'M.Sc. Mathematics, B.Sc. (Ed) Mathematics, TRCN Fellow',
      trcnNumber: 'TRCN/BN/2014/09121'
    },
    classroom: 'Senior College Block - Science Wing Room S201',
    capacity: 35
  },
  {
    level: 'SSS 2 Arts',
    arm: 'secondary',
    name: 'Senior Secondary 2 - Arts & Humanities',
    category: 'Senior Secondary',
    formMaster: {
      fullName: 'Mrs. Blessing Aondoaver',
      staffId: 'BEDU/STAFF/07',
      designation: 'Form Tutor (SSS 2 Arts) & English Lead',
      phone: '+234 814 333 4455',
      email: 'b.aondoaver@bummpteducation.edu.ng',
      qualifications: 'B.A. (Ed) English Literature, TRCN Certified',
      trcnNumber: 'TRCN/BN/2019/66710'
    },
    classroom: 'Senior College Block - Arts Wing Room A201',
    capacity: 35
  },
  {
    level: 'SSS 2 Commercial',
    arm: 'secondary',
    name: 'Senior Secondary 2 - Business & Commercial',
    category: 'Senior Secondary',
    formMaster: {
      fullName: 'Barr. Samuel Adebayo',
      staffId: 'BEDU/STAFF/03',
      designation: 'Registrar & SSS 2 Commercial Form Tutor',
      phone: '+234 805 678 9012',
      email: 'registrar@bummpteducation.edu.ng',
      qualifications: 'LL.B, B.L, PGDE, TRCN Certified',
      trcnNumber: 'TRCN/BN/2017/33902'
    },
    classroom: 'Senior College Block - Commercial Wing Room C201',
    capacity: 35
  },

  // Senior Secondary 3
  {
    level: 'SSS 3 Science',
    arm: 'secondary',
    name: 'Senior Secondary 3 - Science (WAEC & NECO Candidates)',
    category: 'Senior Secondary',
    formMaster: {
      fullName: 'Mr. David Olatunji',
      staffId: 'BEDU/STAFF/06',
      designation: 'HOD Sciences & SSS 3 Science Form Master',
      phone: '+234 803 999 8877',
      email: 'd.olatunji@bummpteducation.edu.ng',
      qualifications: 'B.Sc. Physics, PGDE, TRCN Senior Examiner',
      trcnNumber: 'TRCN/BN/2013/00451'
    },
    classroom: 'Senior College Block - Finals Wing Room S301',
    capacity: 35
  },
  {
    level: 'SSS 3 Arts',
    arm: 'secondary',
    name: 'Senior Secondary 3 - Arts (WAEC & NECO Candidates)',
    category: 'Senior Secondary',
    formMaster: {
      fullName: 'Dr. Matthew Ternenge Beeun',
      staffId: 'BEDU/STAFF/ADMIN',
      designation: 'General Administrator & SSS 3 Arts Supervisory Form Master',
      phone: '+234 811 523 1834',
      email: 'administrator@bummpteducation.edu.ng',
      qualifications: 'Ph.D. Educational Technology, M.Sc., Certified Enterprise Architect',
      trcnNumber: 'TRCN/BN/2012/00101'
    },
    classroom: 'Senior College Block - Finals Wing Room A301',
    capacity: 35
  },
  {
    level: 'SSS 3 Commercial',
    arm: 'secondary',
    name: 'Senior Secondary 3 - Commercial (WAEC & NECO Candidates)',
    category: 'Senior Secondary',
    formMaster: {
      fullName: 'Mr. Jude Msughter Tyav',
      staffId: 'BEDU/STAFF/05',
      designation: 'Chief Financial Officer & Senior Form Master',
      phone: '+234 811 523 1834',
      email: 'bursar@bummpteducation.edu.ng',
      qualifications: 'B.Sc. Accounting, ACA (ICAN)',
      trcnNumber: 'TRCN/BN/2016/88902'
    },
    classroom: 'Senior College Block - Finals Wing Room C301',
    capacity: 35
  }
];

// ==================== COMPREHENSIVE STUDENT ROSTER ACROSS ALL 21 CLASSES ====================
// Builds on INITIAL_STUDENTS and guarantees every class has 10–16 realistic students
export function getAllStudentsForClass(classLevel: ClassLevel): Student[] {
  // First check if INITIAL_STUDENTS has students for this class
  const existing = INITIAL_STUDENTS.filter(s => s.currentClass === classLevel);
  if (existing.length >= 8) {
    return existing;
  }

  // Supplementary generator to ensure full, rich roster for every class
  const classDef = ALL_CLASSES_DEFINITIONS.find(c => c.level === classLevel) || ALL_CLASSES_DEFINITIONS[0];
  const arm = classDef.arm;

  const namesByClass: Record<string, Array<{ name: string; gender: 'Male' | 'Female'; house: 'Eagle House (Blue)' | 'Falcon House (Red)' | 'Cheetah House (Green)' | 'Lion House (Yellow)'; guardian: string; phone: string; address: string }>> = {
    'KG 1': [
      { name: 'Aisha Chloe Bello', gender: 'Female', house: 'Falcon House (Red)', guardian: 'Alhaji Usman Bello', phone: '+234 802 556 7788', address: '8 Wurukum Road, Makurdi' },
      { name: 'Gabriel Terver Shima', gender: 'Male', house: 'Eagle House (Blue)', guardian: 'Mr. Terver Shima', phone: '+234 803 221 4455', address: '12 Modern Market Rd, Makurdi' },
      { name: 'Kamsiyochukwu Sophia Obi', gender: 'Female', house: 'Lion House (Yellow)', guardian: 'Dr. Kenneth Obi', phone: '+234 809 334 2211', address: '4 High Level, Makurdi' },
      { name: 'Victor Msughter Tyav', gender: 'Male', house: 'Cheetah House (Green)', guardian: 'Mr. Jude Tyav', phone: '+234 811 523 1834', address: 'HUDCO Quarters, Makurdi' },
      { name: 'Hadiza Zainab Mohammed', gender: 'Female', house: 'Falcon House (Red)', guardian: 'Mal. Mohammed Sani', phone: '+234 802 119 0022', address: '19 Kashim Ibrahim Way, Makurdi' },
      { name: 'Favour Dooshima Iorfa', gender: 'Female', house: 'Eagle House (Blue)', guardian: 'Mr. Emmanuel Iorfa', phone: '+234 802 345 6789', address: '12 North Bank, Makurdi' },
      { name: 'Bryan Chukwuemeka Eze', gender: 'Male', house: 'Lion House (Yellow)', guardian: 'Mr. Chidi Eze', phone: '+234 816 777 8899', address: '6 Rail Way Quarters, Makurdi' },
      { name: 'Zoe Nguavese Agber', gender: 'Female', house: 'Cheetah House (Green)', guardian: 'Hon. Joseph Agber', phone: '+234 813 667 8899', address: '5 Judges Quarters, Makurdi' },
      { name: 'David Oluwatobiloba Adeleke', gender: 'Male', house: 'Falcon House (Red)', guardian: 'Dr. Femi Adeleke', phone: '+234 803 445 6677', address: '14 High Level Crescent, Makurdi' },
      { name: 'Miracle Ngodoo Aondoaver', gender: 'Female', house: 'Eagle House (Blue)', guardian: 'Mrs. Blessing Aondoaver', phone: '+234 814 333 4455', address: '10 Owner Occupier Estate, Makurdi' },
      { name: 'Precious Somtochukwu Nnamdi', gender: 'Female', house: 'Lion House (Yellow)', guardian: 'Dr. Ifeoma Nnamdi', phone: '+234 803 771 9922', address: '3 Benue Links Road, Makurdi' },
      { name: 'Divine Terlumun Beeun', gender: 'Male', house: 'Cheetah House (Green)', guardian: 'Engr. Matthew Beeun', phone: '+234 811 523 1834', address: 'Akperan Orshi Ave, Housing Estate, Makurdi' }
    ],
    'KG 2': [
      { name: 'Tariq Emmanuel Adeleke', gender: 'Male', house: 'Lion House (Yellow)', guardian: 'Dr. Femi Adeleke', phone: '+234 803 445 6677', address: '14 High Level Crescent, Makurdi' },
      { name: 'Blessing Mnguember Iorfa', gender: 'Female', house: 'Eagle House (Blue)', guardian: 'Mr. Emmanuel Iorfa', phone: '+234 802 345 6789', address: '12 North Bank, Makurdi' },
      { name: 'Chidubem Kevin Okafor', gender: 'Male', house: 'Falcon House (Red)', guardian: 'Mr. Jude Okafor', phone: '+234 814 667 8899', address: '8 High Level, Makurdi' },
      { name: 'Fatima Maryam Shehu', gender: 'Female', house: 'Cheetah House (Green)', guardian: 'Mallam Shehu Garba', phone: '+234 802 119 4433', address: '19 Kashim Ibrahim Way, Makurdi' },
      { name: 'Kator Raymond Agber', gender: 'Male', house: 'Eagle House (Blue)', guardian: 'Hon. Joseph Agber', phone: '+234 813 667 8899', address: '5 Judges Quarters, Makurdi' },
      { name: 'Cherish Nguveren Tyav', gender: 'Female', house: 'Lion House (Yellow)', guardian: 'Mr. Jude Tyav', phone: '+234 811 523 1834', address: 'HUDCO Quarters, Makurdi' },
      { name: 'Daniel Chinaza Obi', gender: 'Male', house: 'Falcon House (Red)', guardian: 'Mr. Kenneth Obi', phone: '+234 809 334 2211', address: '22 Modern Market Rd, Makurdi' },
      { name: 'Hannah Msoo Aondo', gender: 'Female', house: 'Cheetah House (Green)', guardian: 'Mr. Moses Aondo', phone: '+234 802 331 4455', address: '15 High Level, Makurdi' },
      { name: 'Ezekiel Terngu Beeun', gender: 'Male', house: 'Eagle House (Blue)', guardian: 'Engr. Matthew Beeun', phone: '+234 811 523 1834', address: 'Housing Estate, Makurdi' },
      { name: 'Halima Sadiq Bello', gender: 'Female', house: 'Falcon House (Red)', guardian: 'Alhaji Usman Bello', phone: '+234 802 556 7788', address: '8 Wurukum Road, Makurdi' }
    ],
    'KG 3': [
      { name: 'Zainab Michelle Beeun', gender: 'Female', house: 'Eagle House (Blue)', guardian: 'Engr. Matthew Beeun', phone: '+234 811 523 1834', address: 'Akperan Orshi Ave, Housing Estate, Makurdi' },
      { name: 'Joshua Msughter Tyav', gender: 'Male', house: 'Lion House (Yellow)', guardian: 'Mr. Jude Tyav', phone: '+234 811 523 1834', address: 'HUDCO Quarters, Makurdi' },
      { name: 'Princess Nguavese Iorfa', gender: 'Female', house: 'Falcon House (Red)', guardian: 'Mr. Emmanuel Iorfa', phone: '+234 802 345 6789', address: '12 North Bank, Makurdi' },
      { name: 'Kelechi Michael Obi', gender: 'Male', house: 'Cheetah House (Green)', guardian: 'Mr. Kenneth Obi', phone: '+234 809 334 2211', address: '22 Modern Market Rd, Makurdi' },
      { name: 'Amina Khadija Bello', gender: 'Female', house: 'Eagle House (Blue)', guardian: 'Alhaji Usman Bello', phone: '+234 802 556 7788', address: '8 Wurukum Road, Makurdi' },
      { name: 'Terdoo Samuel Agber', gender: 'Male', house: 'Lion House (Yellow)', guardian: 'Hon. Joseph Agber', phone: '+234 813 667 8899', address: '5 Judges Quarters, Makurdi' },
      { name: 'Grace Chisom Eze', gender: 'Female', house: 'Falcon House (Red)', guardian: 'Mr. Chidi Eze', phone: '+234 816 777 8899', address: '6 Rail Way Quarters, Makurdi' },
      { name: 'Elijah Oluwaseyi Adeleke', gender: 'Male', house: 'Cheetah House (Green)', guardian: 'Dr. Femi Adeleke', phone: '+234 803 445 6677', address: '14 High Level Crescent, Makurdi' },
      { name: 'Marvelous Doom Aondoaver', gender: 'Female', house: 'Eagle House (Blue)', guardian: 'Mrs. Blessing Aondoaver', phone: '+234 814 333 4455', address: '10 Owner Occupier Estate, Makurdi' },
      { name: 'Caleb Somto Nnamdi', gender: 'Male', house: 'Lion House (Yellow)', guardian: 'Dr. Ifeoma Nnamdi', phone: '+234 803 771 9922', address: '3 Benue Links Road, Makurdi' }
    ]
  };

  // Base list of supplementary students if class not explicitly hardcoded in dictionary
  const fallbackList = [
    { name: 'David Msughter Tyav Jnr', gender: 'Male', house: 'Lion House (Yellow)', guardian: 'Mr. Jude Tyav (Bursar)', phone: '+234 811 523 1834', address: 'HUDCO Quarters, Makurdi' },
    { name: 'Amarachi Chimamanda Obi', gender: 'Female', house: 'Falcon House (Red)', guardian: 'Mr. Kenneth Obi', phone: '+234 809 334 2211', address: '22 Modern Market Rd, Makurdi' },
    { name: 'Kator Andrew Iorfa', gender: 'Male', house: 'Cheetah House (Green)', guardian: 'Mr. Emmanuel Iorfa', phone: '+234 802 345 6789', address: '12 North Bank, Makurdi' },
    { name: 'Zainab Fatima Bello', gender: 'Female', house: 'Eagle House (Blue)', guardian: 'Alhaji Usman Bello', phone: '+234 802 556 7788', address: '8 Wurukum Road, Makurdi' },
    { name: 'Tersoo Emmanuel Agber', gender: 'Male', house: 'Lion House (Yellow)', guardian: 'Hon. Joseph Agber', phone: '+234 813 667 8899', address: '5 Judges Quarters, Makurdi' },
    { name: 'Chidera Victoria Eze', gender: 'Female', house: 'Falcon House (Red)', guardian: 'Mr. Chidi Eze', phone: '+234 816 777 8899', address: '6 Rail Way Quarters, Makurdi' },
    { name: 'Oluwadamilola Victor Adeleke', gender: 'Male', house: 'Cheetah House (Green)', guardian: 'Dr. Femi Adeleke', phone: '+234 803 445 6677', address: '14 High Level Crescent, Makurdi' },
    { name: 'Nguember Abigail Beeun', gender: 'Female', house: 'Eagle House (Blue)', guardian: 'Engr. Matthew Beeun', phone: '+234 811 523 1834', address: 'Akperan Orshi Ave, Makurdi' },
    { name: 'Solomon Terkula Gbande', gender: 'Male', house: 'Lion House (Yellow)', guardian: 'Mr. Stephen Gbande', phone: '+234 803 661 2299', address: 'High Level, Makurdi' },
    { name: 'Hadiza Sadiq Shehu', gender: 'Female', house: 'Falcon House (Red)', guardian: 'Mallam Shehu Garba', phone: '+234 802 119 4433', address: '19 Kashim Ibrahim Way, Makurdi' },
    { name: 'Emeka Divine Okafor', gender: 'Male', house: 'Cheetah House (Green)', guardian: 'Mr. Jude Okafor', phone: '+234 814 667 8899', address: 'High Level, Makurdi' },
    { name: 'Dooshima Praise Aondoaver', gender: 'Female', house: 'Eagle House (Blue)', guardian: 'Mrs. Blessing Aondoaver', phone: '+234 814 333 4455', address: 'Owner Occupier Estate, Makurdi' }
  ];

  const sourceList = namesByClass[classLevel] || fallbackList;

  const generatedList: Student[] = sourceList.map((item, index) => {
    const rawClassCode = classLevel.replace(/\s+/g, '').toUpperCase();
    const admNum = `BEDU/${rawClassCode}/2025/${String(index + 1).padStart(3, '0')}`;
    const stuId = `STU-${rawClassCode}-${String(index + 1).padStart(3, '0')}`;

    return {
      id: stuId,
      admissionNumber: admNum,
      fullName: item.name,
      gender: item.gender as 'Male' | 'Female',
      dateOfBirth: '2016-04-12',
      currentClass: classLevel,
      arm: arm,
      house: item.house as any,
      guardianName: item.guardian,
      guardianPhone: item.phone,
      guardianEmail: `${item.guardian.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
      address: item.address,
      stateOfOrigin: 'Benue',
      dateEnrolled: '2025-09-08',
      status: 'Active',
      isPrefect: index === 0 || index === 1,
      prefectRole: index === 0 ? `${classLevel} Class Captain` : index === 1 ? `${classLevel} Assistant Captain` : undefined
    };
  });

  // Combine with existing if any to avoid duplication
  const combined = [...existing];
  generatedList.forEach(gen => {
    if (!combined.some(c => c.fullName.toLowerCase() === gen.fullName.toLowerCase())) {
      combined.push(gen);
    }
  });

  return combined;
}

// ==================== 13-WEEK TERM CALENDAR ENGINE ====================
// Term 2 (2025/2026 Academic Session):
// School Resumes / Open Date: Monday, January 5, 2026
// School Closes / Vacation Date: Friday, April 3, 2026
// Total Statutory School Days: 65 Days (13 Weeks x 5 Days per week, Mon - Fri)
export const TERM_OPEN_DATE = '2026-01-05';
export const TERM_CLOSE_DATE = '2026-04-03';
export const TOTAL_STATUTORY_SCHOOL_DAYS = 65;
export const CURRENT_DEFAULT_SCHOOL_DAY = 48; // Day 48 of 65 (Week 10 - Wednesday, March 11, 2026)

export function generate13WeekTermCalendar(term: Term = '2nd Term', academicYear: AcademicYear = '2025/2026'): TermCalendarDay[] {
  const days: TermCalendarDay[] = [];
  const startDate = new Date(2026, 0, 5); // Jan 5, 2026 (Monday)

  let dayCount = 0;
  let currentDate = new Date(startDate);

  // Generate 13 weeks (65 school weekdays)
  for (let week = 1; week <= 13; week++) {
    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      dayCount++;
      const dateStr = currentDate.toISOString().split('T')[0];
      const weekdayNames: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
      ];
      const dayName = weekdayNames[dayIndex];

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedLabel = `${dayName.substring(0, 3)}, ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

      // Check for mid-term break (e.g. Week 7 Thursday & Friday)
      const isMidTerm = week === 7 && (dayIndex === 3 || dayIndex === 4);
      // Check for public holidays (e.g. Armed Forces Remembrance Jan 15)
      const isHoliday = dateStr === '2026-01-15';
      const holidayName = isHoliday ? 'Armed Forces Remembrance Day' : isMidTerm ? '2nd Term Mid-Term Break' : undefined;

      days.push({
        date: dateStr,
        weekNumber: week,
        dayOfWeek: dayName,
        dayNumberInTerm: dayCount,
        isSchoolDay: !isHoliday && !isMidTerm,
        isHoliday,
        holidayName,
        isMidTermBreak: isMidTerm,
        label: formattedLabel
      });

      // Move to next calendar day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    // Skip weekend (Saturday & Sunday)
    currentDate.setDate(currentDate.getDate() + 2);
  }

  return days;
}

// Global cached calendar
export const TERM_CALENDAR_DAYS = generate13WeekTermCalendar('2nd Term', '2025/2026');

// ==================== DETERMINISTIC HISTORICAL ATTENDANCE GENERATOR ====================
// Generates realistic attendance history from Day 1 to Day 48 for all students
export function generateDefaultAttendanceRecordsForClass(
  classLevel: ClassLevel,
  students: Student[],
  calendarDays: TermCalendarDay[] = TERM_CALENDAR_DAYS
): Record<string, Record<string, DailyAttendanceEntry>> {
  // Structure: records[dateStr][studentId] = DailyAttendanceEntry
  const records: Record<string, Record<string, DailyAttendanceEntry>> = {};

  const effectiveDays = calendarDays.filter(d => d.dayNumberInTerm <= CURRENT_DEFAULT_SCHOOL_DAY && d.isSchoolDay);

  effectiveDays.forEach((day, dayIdx) => {
    records[day.date] = {};

    students.forEach((student, stuIdx) => {
      // Deterministic pseudorandom based on student ID hash and day index
      const hash = (student.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + dayIdx * 7) % 100;

      // 90% Present, 5% Late, 3% Absent, 2% Excused
      if (hash < 88) {
        records[day.date][student.id] = {
          status: 'present',
          arrivalTime: `07:${String(30 + (hash % 15)).padStart(2, '0')} AM`,
          markedAt: `${day.date}T07:55:00Z`
        };
      } else if (hash < 94) {
        records[day.date][student.id] = {
          status: 'late',
          arrivalTime: `08:${String(5 + (hash % 20)).padStart(2, '0')} AM`,
          reason: 'Morning vehicular traffic along Makurdi-Gboko expressway',
          markedAt: `${day.date}T08:25:00Z`
        };
      } else if (hash < 97) {
        records[day.date][student.id] = {
          status: 'excused',
          reason: 'Medical clinic appointment / mild fever reported by guardian',
          markedAt: `${day.date}T07:45:00Z`
        };
      } else {
        records[day.date][student.id] = {
          status: 'absent',
          reason: 'Unexcused absence / Parent notification dispatched',
          markedAt: `${day.date}T08:30:00Z`
        };
      }
    });
  });

  return records;
}

// ==================== STORAGE & PERSISTENCE ENGINE ====================
const STORAGE_KEY_PREFIX = 'bummpt_attendance_register_v2';

export function getStoredAttendanceRecords(
  classLevel: ClassLevel,
  term: Term = '2nd Term',
  academicYear: AcademicYear = '2025/2026',
  students: Student[]
): Record<string, Record<string, DailyAttendanceEntry>> {
  if (typeof window === 'undefined') {
    return generateDefaultAttendanceRecordsForClass(classLevel, students);
  }

  const key = `${STORAGE_KEY_PREFIX}_${classLevel.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}_${academicYear.replace(/\//g, '_')}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse attendance records from storage, generating fresh seed:', err);
  }

  const initial = generateDefaultAttendanceRecordsForClass(classLevel, students);
  try {
    localStorage.setItem(key, JSON.stringify(initial));
  } catch (e) {
    // Ignore storage quota limits
  }
  return initial;
}

export function saveStoredAttendanceRecords(
  classLevel: ClassLevel,
  term: Term = '2nd Term',
  academicYear: AcademicYear = '2025/2026',
  records: Record<string, Record<string, DailyAttendanceEntry>>
): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_KEY_PREFIX}_${classLevel.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}_${academicYear.replace(/\//g, '_')}`;
  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save attendance records:', err);
  }
}

// ==================== ATTENDANCE COMPUTATIONS & TOTALS ====================
export function computeStudentAttendanceSummary(
  student: Student,
  records: Record<string, Record<string, DailyAttendanceEntry>>,
  calendarDays: TermCalendarDay[] = TERM_CALENDAR_DAYS,
  upToDayNumber: number = CURRENT_DEFAULT_SCHOOL_DAY
): StudentAttendanceSummary {
  const eligibleSchoolDays = calendarDays.filter(
    d => d.dayNumberInTerm <= upToDayNumber && d.isSchoolDay
  );
  const totalDaysOpened = eligibleSchoolDays.length;

  let timesPresent = 0;
  let timesAbsent = 0;
  let timesLate = 0;
  let timesExcused = 0;
  let unexcusedAbsences = 0;
  let streak = 0;
  let consecutivePresent = 0;

  // Process chronologically to compute streak
  eligibleSchoolDays.forEach(day => {
    const dayEntry = records[day.date]?.[student.id];
    const status = dayEntry ? dayEntry.status : 'present'; // fallback default

    if (status === 'present') {
      timesPresent++;
      consecutivePresent++;
    } else if (status === 'late') {
      timesPresent++; // Late counts as present in Nigerian education standards
      timesLate++;
      consecutivePresent++;
    } else if (status === 'excused') {
      timesExcused++;
      consecutivePresent = 0;
    } else if (status === 'absent') {
      timesAbsent++;
      unexcusedAbsences++;
      consecutivePresent = 0;
    }
  });

  streak = consecutivePresent;

  const attendancePercentage = totalDaysOpened > 0 
    ? Math.round(((timesPresent + (timesLate * 0.8)) / totalDaysOpened) * 100)
    : 100;

  const punctualityScore = totalDaysOpened > 0
    ? Math.round(((timesPresent - timesLate) / Math.max(1, timesPresent)) * 100)
    : 100;

  let ratingStatus: 'Outstanding' | 'Satisfactory' | 'Needs Improvement' | 'Critical Warning' = 'Outstanding';
  if (attendancePercentage >= 95) {
    ratingStatus = 'Outstanding';
  } else if (attendancePercentage >= 85) {
    ratingStatus = 'Satisfactory';
  } else if (attendancePercentage >= 75) {
    ratingStatus = 'Needs Improvement';
  } else {
    ratingStatus = 'Critical Warning';
  }

  return {
    studentId: student.id,
    studentName: student.fullName,
    admissionNumber: student.admissionNumber,
    gender: student.gender,
    currentClass: student.currentClass,
    house: student.house,
    timesSchoolOpened: totalDaysOpened,
    timesPresent,
    timesAbsent,
    timesLate,
    timesExcused,
    attendancePercentage: Math.min(100, Math.max(0, attendancePercentage)),
    punctualityScore: Math.min(100, Math.max(0, punctualityScore)),
    consecutivePresentStreak: streak,
    status: ratingStatus,
    unexcusedAbsences
  };
}

export function computeClassSessionSummary(
  classLevel: ClassLevel,
  term: Term = '2nd Term',
  academicYear: AcademicYear = '2025/2026',
  selectedDate: string,
  records: Record<string, Record<string, DailyAttendanceEntry>>,
  students: Student[],
  calendarDays: TermCalendarDay[] = TERM_CALENDAR_DAYS
): ClassAttendanceSessionSummary {
  const classDef = ALL_CLASSES_DEFINITIONS.find(c => c.level === classLevel) || ALL_CLASSES_DEFINITIONS[0];
  const currentDayMeta = calendarDays.find(d => d.date === selectedDate) || calendarDays[CURRENT_DEFAULT_SCHOOL_DAY - 1];

  const totalEnrolled = students.length;
  const dayRecords = records[selectedDate] || {};

  let presentToday = 0;
  let absentToday = 0;
  let lateToday = 0;
  let excusedToday = 0;

  students.forEach(s => {
    const entry = dayRecords[s.id];
    const status = entry ? entry.status : 'present';
    if (status === 'present') presentToday++;
    else if (status === 'absent') absentToday++;
    else if (status === 'late') lateToday++;
    else if (status === 'excused') excusedToday++;
  });

  const todayEffectivePresent = presentToday + lateToday;
  const todayAttendanceRate = totalEnrolled > 0 
    ? Math.round((todayEffectivePresent / totalEnrolled) * 100)
    : 100;

  // Compute all student summaries up to selected date's day number
  const studentSummaries = students.map(s => 
    computeStudentAttendanceSummary(s, records, calendarDays, currentDayMeta.dayNumberInTerm)
  );

  const avgCumulativeRate = studentSummaries.length > 0
    ? Math.round(studentSummaries.reduce((acc, s) => acc + s.attendancePercentage, 0) / studentSummaries.length)
    : 100;

  const boys = studentSummaries.filter(s => s.gender === 'Male');
  const girls = studentSummaries.filter(s => s.gender === 'Female');

  const boysRate = boys.length > 0
    ? Math.round(boys.reduce((acc, s) => acc + s.attendancePercentage, 0) / boys.length)
    : 100;

  const girlsRate = girls.length > 0
    ? Math.round(girls.reduce((acc, s) => acc + s.attendancePercentage, 0) / girls.length)
    : 100;

  const daysElapsed = currentDayMeta.dayNumberInTerm;
  const daysRemaining = Math.max(0, TOTAL_STATUTORY_SCHOOL_DAYS - daysElapsed);

  return {
    classLevel,
    term,
    academicYear,
    termOpenDate: TERM_OPEN_DATE,
    termCloseDate: TERM_CLOSE_DATE,
    statutoryDaysOpened: TOTAL_STATUTORY_SCHOOL_DAYS,
    daysElapsed,
    daysRemaining,
    selectedDate,
    selectedWeek: currentDayMeta.weekNumber,
    totalEnrolledStudents: totalEnrolled,
    presentToday,
    absentToday,
    lateToday,
    excusedToday,
    todayAttendanceRate,
    cumulativeClassAttendanceRate: avgCumulativeRate,
    boysAttendanceRate: boysRate,
    girlsAttendanceRate: girlsRate,
    formMaster: classDef.formMaster
  };
}
