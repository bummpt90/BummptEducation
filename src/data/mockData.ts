import { 
  Student, 
  Staff, 
  Subject, 
  AssessmentScore, 
  FeeSchedule, 
  FeePayment, 
  AdmissionApplication, 
  OrganogramNode, 
  Announcement,
  ClassLevel,
  EarlyYearsMilestone
} from '../types';

export const ALL_SUBJECTS: Subject[] = [
  // ==================== KINDERGARTEN / EARLY YEARS LEARNING DOMAINS ====================
  { id: 'SUB-KG-PHO', code: 'EY-PHO', name: 'Phonics, Rhymes & Letter Sounds', category: 'Early Learning', departmentId: 'DEP-EY', arm: 'kindergarten', applicableLevels: ['KG'] },
  { id: 'SUB-KG-NUM', code: 'EY-NUM', name: 'Early Numeracy, Counting & Shapes', category: 'Early Learning', departmentId: 'DEP-EY', arm: 'kindergarten', applicableLevels: ['KG'] },
  { id: 'SUB-KG-DIS', code: 'EY-DIS', name: 'Sensory Discovery & Nature Science', category: 'Early Learning', departmentId: 'DEP-EY', arm: 'kindergarten', applicableLevels: ['KG'] },
  { id: 'SUB-KG-SOC', code: 'EY-SOC', name: 'Social Habits, Courtesy & Etiquette', category: 'Early Learning', departmentId: 'DEP-EY', arm: 'kindergarten', applicableLevels: ['KG'] },
  { id: 'SUB-KG-ART', code: 'EY-ART', name: 'Creative Arts, Coloring & Craft', category: 'Early Learning', departmentId: 'DEP-EY', arm: 'kindergarten', applicableLevels: ['KG'] },
  { id: 'SUB-KG-MOT', code: 'EY-MOT', name: 'Fine Motor Skills & Handwriting Readiness', category: 'Early Learning', departmentId: 'DEP-EY', arm: 'kindergarten', applicableLevels: ['KG'] },
  { id: 'SUB-KG-MUS', code: 'EY-MUS', name: 'Music, Movement & Nursery Rhymes', category: 'Early Learning', departmentId: 'DEP-EY', arm: 'kindergarten', applicableLevels: ['KG'] },
  { id: 'SUB-KG-HEA', code: 'EY-HEA', name: 'Personal Health, Hygiene & Safety', category: 'Early Learning', departmentId: 'DEP-EY', arm: 'kindergarten', applicableLevels: ['KG'] },

  // ==================== PRIMARY SCHOOL (BASIC 1 - 6) CURRICULUM ====================
  { id: 'SUB-PRI-ENG', code: 'PRI-ENG', name: 'English Studies & Phonics', category: 'Primary Basic', departmentId: 'DEP-PRI-LANG', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-MAT', code: 'PRI-MAT', name: 'General Mathematics', category: 'Primary Basic', departmentId: 'DEP-PRI-MATH', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-BSC', code: 'PRI-BSC', name: 'Basic Science & Technology', category: 'Primary Basic', departmentId: 'DEP-PRI-SCI', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-SOC', code: 'PRI-SOC', name: 'Social Studies & Citizenship', category: 'Primary Basic', departmentId: 'DEP-PRI-HUM', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-CIV', code: 'PRI-CIV', name: 'National Values / Civic Education', category: 'Primary Basic', departmentId: 'DEP-PRI-HUM', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-QRE', code: 'PRI-QRE', name: 'Quantitative Reasoning', category: 'Primary Basic', departmentId: 'DEP-PRI-MATH', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-VRE', code: 'PRI-VRE', name: 'Verbal Reasoning', category: 'Primary Basic', departmentId: 'DEP-PRI-LANG', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-AGR', code: 'PRI-AGR', name: 'Agricultural Science', category: 'Primary Basic', departmentId: 'DEP-PRI-SCI', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-ICT', code: 'PRI-ICT', name: 'Computer Studies / Coding & Robotics', category: 'Primary Basic', departmentId: 'DEP-PRI-VOC', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-CCA', code: 'PRI-CCA', name: 'Cultural & Creative Arts (CCA)', category: 'Primary Basic', departmentId: 'DEP-PRI-VOC', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-CRS', code: 'PRI-CRS', name: 'Christian Religious Studies (CRS)', category: 'Primary Basic', departmentId: 'DEP-PRI-HUM', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-PHE', code: 'PRI-PHE', name: 'Physical & Health Education (PHE)', category: 'Primary Basic', departmentId: 'DEP-PRI-SCI', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-FRE', code: 'PRI-FRE', name: 'French Language', category: 'Primary Basic', departmentId: 'DEP-PRI-LANG', arm: 'primary', applicableLevels: ['Primary'] },
  { id: 'SUB-PRI-HAU', code: 'PRI-HAU', name: 'Hausa Language / Mother Tongue', category: 'Primary Basic', departmentId: 'DEP-PRI-LANG', arm: 'primary', applicableLevels: ['Primary'] },

  // ==================== SECONDARY SCHOOL CURRICULUM (JSS & SSS) ====================
  // Core Compulsory
  { id: 'SUB-ENG', code: 'ENG101', name: 'English Language', category: 'Core', departmentId: 'DEP-LANG', arm: 'secondary', applicableLevels: ['JSS', 'SSS_Science', 'SSS_Arts', 'SSS_Commercial'] },
  { id: 'SUB-MAT', code: 'MAT101', name: 'General Mathematics', category: 'Core', departmentId: 'DEP-MATH', arm: 'secondary', applicableLevels: ['JSS', 'SSS_Science', 'SSS_Arts', 'SSS_Commercial'] },
  { id: 'SUB-CIV', code: 'CIV101', name: 'Civic Education', category: 'Core', departmentId: 'DEP-HUM', arm: 'secondary', applicableLevels: ['JSS', 'SSS_Science', 'SSS_Arts', 'SSS_Commercial'] },
  { id: 'SUB-ICT', code: 'ICT101', name: 'Computer Studies / ICT', category: 'Core', departmentId: 'DEP-VOC', arm: 'secondary', applicableLevels: ['JSS', 'SSS_Science', 'SSS_Arts', 'SSS_Commercial'] },
  { id: 'SUB-ENT', code: 'ENT101', name: 'Trade & Entrepreneurship', category: 'Core', departmentId: 'DEP-VOC', arm: 'secondary', applicableLevels: ['SSS_Science', 'SSS_Arts', 'SSS_Commercial'] },

  // Junior Secondary Specific
  { id: 'SUB-BSC', code: 'BSC001', name: 'Basic Science & Technology', category: 'Science & Math', departmentId: 'DEP-SCI', arm: 'secondary', applicableLevels: ['JSS'] },
  { id: 'SUB-SOC', code: 'SOC001', name: 'Social Studies', category: 'Humanities & Arts', departmentId: 'DEP-HUM', arm: 'secondary', applicableLevels: ['JSS'] },
  { id: 'SUB-BUS', code: 'BUS001', name: 'Business Studies', category: 'Business & Commercial', departmentId: 'DEP-COM', arm: 'secondary', applicableLevels: ['JSS'] },
  { id: 'SUB-AGR', code: 'AGR001', name: 'Agricultural Science', category: 'Vocational & Tech', departmentId: 'DEP-SCI', arm: 'secondary', applicableLevels: ['JSS', 'SSS_Science'] },
  { id: 'SUB-CRS', code: 'CRS001', name: 'Christian Religious Studies', category: 'Humanities & Arts', departmentId: 'DEP-HUM', arm: 'secondary', applicableLevels: ['JSS', 'SSS_Arts'] },
  { id: 'SUB-FRE', code: 'FRE001', name: 'French Language', category: 'Languages', departmentId: 'DEP-LANG', arm: 'secondary', applicableLevels: ['JSS', 'SSS_Arts'] },
  { id: 'SUB-HAU', code: 'HAU001', name: 'Hausa / Nigerian Language', category: 'Languages', departmentId: 'DEP-LANG', arm: 'secondary', applicableLevels: ['JSS', 'SSS_Arts'] },

  // Senior Secondary Science Track
  { id: 'SUB-PHY', code: 'PHY201', name: 'Physics', category: 'Science & Math', departmentId: 'DEP-SCI', arm: 'secondary', applicableLevels: ['SSS_Science'] },
  { id: 'SUB-CHM', code: 'CHM201', name: 'Chemistry', category: 'Science & Math', departmentId: 'DEP-SCI', arm: 'secondary', applicableLevels: ['SSS_Science'] },
  { id: 'SUB-BIO', code: 'BIO201', name: 'Biology', category: 'Science & Math', departmentId: 'DEP-SCI', arm: 'secondary', applicableLevels: ['SSS_Science', 'SSS_Arts', 'SSS_Commercial'] },
  { id: 'SUB-FUR', code: 'FUR201', name: 'Further Mathematics', category: 'Science & Math', departmentId: 'DEP-MATH', arm: 'secondary', applicableLevels: ['SSS_Science'] },
  { id: 'SUB-TDG', code: 'TDG201', name: 'Technical Drawing', category: 'Vocational & Tech', departmentId: 'DEP-VOC', arm: 'secondary', applicableLevels: ['SSS_Science'] },

  // Senior Secondary Arts Track
  { id: 'SUB-LIT', code: 'LIT201', name: 'Literature-in-English', category: 'Humanities & Arts', departmentId: 'DEP-LANG', arm: 'secondary', applicableLevels: ['SSS_Arts'] },
  { id: 'SUB-GOV', code: 'GOV201', name: 'Government', category: 'Humanities & Arts', departmentId: 'DEP-HUM', arm: 'secondary', applicableLevels: ['SSS_Arts', 'SSS_Commercial'] },
  { id: 'SUB-HIS', code: 'HIS201', name: 'History', category: 'Humanities & Arts', departmentId: 'DEP-HUM', arm: 'secondary', applicableLevels: ['SSS_Arts'] },
  { id: 'SUB-ECO', code: 'ECO201', name: 'Economics', category: 'Business & Commercial', departmentId: 'DEP-COM', arm: 'secondary', applicableLevels: ['SSS_Science', 'SSS_Arts', 'SSS_Commercial'] },

  // Senior Secondary Commercial Track
  { id: 'SUB-ACC', code: 'ACC201', name: 'Financial Accounting', category: 'Business & Commercial', departmentId: 'DEP-COM', arm: 'secondary', applicableLevels: ['SSS_Commercial'] },
  { id: 'SUB-COM', code: 'COM201', name: 'Commerce', category: 'Business & Commercial', departmentId: 'DEP-COM', arm: 'secondary', applicableLevels: ['SSS_Commercial'] },
  { id: 'SUB-MKT', code: 'MKT201', name: 'Marketing', category: 'Business & Commercial', departmentId: 'DEP-COM', arm: 'secondary', applicableLevels: ['SSS_Commercial'] }
];

export const INITIAL_SUBJECTS = ALL_SUBJECTS;

export const INITIAL_STAFF: Staff[] = [
  // ==================== CENTRAL INSTITUTIONAL LEADERSHIP ====================
  {
    id: 'STF-000',
    staffId: 'BEDU/STAFF/ADMIN',
    fullName: 'Matthew Ternenge Beeun',
    type: 'Non-Teaching',
    departmentId: 'DEP-EXEC',
    arm: 'All',
    designation: 'General Administrator & Executive Director',
    role: 'Administrator',
    qualifications: 'B.Sc Software Engineering, M.Sc Enterprise Architecture, Certified Education Technologist',
    email: 'administrator@bummpteducation.edu.ng',
    phone: '+234 811 523 1834',
    dateJoined: '2018-01-10',
    status: 'Active',
  },

  // ==================== KINDERGARTEN / EARLY YEARS ARM ====================
  {
    id: 'STF-EY-01',
    staffId: 'BEDU/STAFF/EY01',
    fullName: 'Mrs. Abigail Folashade Balogun',
    type: 'Teaching',
    departmentId: 'DEP-EY',
    arm: 'kindergarten',
    designation: 'Head of Early Childhood & Kindergarten Wing (Sub-Head)',
    role: 'Head of Kindergarten',
    qualifications: 'M.Ed Early Childhood Education, Montessori Diploma, B.Ed Guidance & Counseling',
    email: 'head.kindergarten@bummpteducation.edu.ng',
    phone: '+234 807 889 0011',
    dateJoined: '2020-08-01',
    status: 'Active',
  },
  {
    id: 'STF-EY-02',
    staffId: 'BEDU/STAFF/EY02',
    fullName: 'Miss Rita Nguveren Iorfa',
    type: 'Teaching',
    departmentId: 'DEP-EY',
    arm: 'kindergarten',
    designation: 'Lead Educator (KG 3 - Transition Class)',
    role: 'Form Tutor',
    assignedClass: 'KG 3',
    qualifications: 'B.Ed Early Childhood Care & Education, TRCN',
    email: 'r.iorfa@bummpteducation.edu.ng',
    phone: '+234 813 445 6677',
    dateJoined: '2021-09-01',
    status: 'Active',
  },
  {
    id: 'STF-EY-03',
    staffId: 'BEDU/STAFF/EY03',
    fullName: 'Mrs. Comfort Chisom Eze',
    type: 'Teaching',
    departmentId: 'DEP-EY',
    arm: 'kindergarten',
    designation: 'Early Years Phonics & Sensory Facilitator (KG 1 & 2)',
    role: 'Form Tutor',
    assignedClass: 'KG 1',
    qualifications: 'NCE Early Childhood Education, B.A. (Ed) English',
    email: 'c.eze@bummpteducation.edu.ng',
    phone: '+234 809 223 3445',
    dateJoined: '2022-01-15',
    status: 'Active',
  },

  // ==================== PRIMARY SCHOOL / BASIC EDUCATION ARM ====================
  {
    id: 'STF-PRI-01',
    staffId: 'BEDU/STAFF/PRI01',
    fullName: 'Mrs. Grace Iveren Shima',
    type: 'Teaching',
    departmentId: 'DEP-PRI',
    arm: 'primary',
    designation: 'Headmistress & Sub-Head (Primary Wing)',
    role: 'Headmistress',
    qualifications: 'M.Ed Primary School Administration, B.Ed Primary Education Studies, TRCN',
    email: 'headmistress@bummpteducation.edu.ng',
    phone: '+234 803 771 9922',
    dateJoined: '2019-06-15',
    status: 'Active',
  },
  {
    id: 'STF-PRI-02',
    staffId: 'BEDU/STAFF/PRI02',
    fullName: 'Mr. Moses Terfa Aondo',
    type: 'Teaching',
    departmentId: 'DEP-PRI',
    arm: 'primary',
    designation: 'Class Teacher (Basic 6 - Common Entrance Lead)',
    role: 'Form Tutor',
    assignedClass: 'Basic 6',
    assignedSubjects: ['SUB-PRI-MAT', 'SUB-PRI-QRE', 'SUB-PRI-BSC'],
    qualifications: 'B.Sc. (Ed) Mathematics, TRCN',
    email: 'm.aondo@bummpteducation.edu.ng',
    phone: '+234 802 331 4455',
    dateJoined: '2020-09-01',
    status: 'Active',
  },
  {
    id: 'STF-PRI-03',
    staffId: 'BEDU/STAFF/PRI03',
    fullName: 'Mrs. Hadiza Abubakar',
    type: 'Teaching',
    departmentId: 'DEP-PRI',
    arm: 'primary',
    designation: 'Class Teacher (Basic 3) & Primary Literacy Lead',
    role: 'Form Tutor',
    assignedClass: 'Basic 3',
    assignedSubjects: ['SUB-PRI-ENG', 'SUB-PRI-VRE', 'SUB-PRI-SOC'],
    qualifications: 'B.A. (Ed) English, NCE Primary Education',
    email: 'h.abubakar@bummpteducation.edu.ng',
    phone: '+234 805 112 3344',
    dateJoined: '2021-01-10',
    status: 'Active',
  },
  {
    id: 'STF-PRI-04',
    staffId: 'BEDU/STAFF/PRI04',
    fullName: 'Mr. Jude Chukwudi Okafor',
    type: 'Teaching',
    departmentId: 'DEP-PRI',
    arm: 'primary',
    designation: 'Primary STEM, ICT & Robotics Specialist',
    role: 'Subject Teacher',
    assignedSubjects: ['SUB-PRI-ICT', 'SUB-PRI-BSC'],
    qualifications: 'B.Tech Computer Science, PGDE',
    email: 'j.okafor@bummpteducation.edu.ng',
    phone: '+234 814 667 8899',
    dateJoined: '2022-03-01',
    status: 'Active',
  },

  // ==================== SECONDARY SCHOOL / COLLEGE ARM ====================
  {
    id: 'STF-001',
    staffId: 'BEDU/STAFF/01',
    fullName: 'Dr. (Mrs.) Grace Nkechi Okafor',
    type: 'Teaching',
    departmentId: 'DEP-ADMIN',
    arm: 'secondary',
    designation: 'Principal & Sub-Head (Secondary Wing)',
    role: 'Principal',
    qualifications: 'Ph.D. Educational Administration, M.Ed, B.Sc. (Ed) Chemistry',
    email: 'principal@bummpteducation.edu.ng',
    phone: '+234 803 234 5678',
    dateJoined: '2019-09-01',
    status: 'Active',
  },
  {
    id: 'STF-002',
    staffId: 'BEDU/STAFF/02',
    fullName: 'Mr. Emmanuel Terkula Iorfa',
    type: 'Teaching',
    departmentId: 'DEP-ACAD',
    arm: 'secondary',
    designation: 'Vice-Principal (Academics - Secondary)',
    role: 'VP Academic',
    qualifications: 'M.Sc. Mathematics, B.Sc. (Ed) Mathematics',
    email: 'vp.academic@bummpteducation.edu.ng',
    phone: '+234 802 345 6789',
    dateJoined: '2020-01-15',
    status: 'Active',
  },
  {
    id: 'STF-003',
    staffId: 'BEDU/STAFF/03',
    fullName: 'Barr. Samuel Adebayo',
    type: 'Non-Teaching',
    departmentId: 'DEP-ADMIN',
    arm: 'All',
    designation: 'Registrar & Head of Institutional Legal Affairs',
    role: 'VP Admin',
    qualifications: 'LL.B, B.L, PGDE, Member NIM',
    email: 'registrar@bummpteducation.edu.ng',
    phone: '+234 805 678 9012',
    dateJoined: '2020-09-01',
    status: 'Active',
  },
  {
    id: 'STF-004',
    staffId: 'BEDU/STAFF/04',
    fullName: 'Mrs. Fatima Al-Hassan',
    type: 'Teaching',
    departmentId: 'DEP-EXAM',
    arm: 'secondary',
    designation: 'Chief Examination Officer (WAEC, NECO, IGCSE, SAT & JAMB)',
    role: 'Exam Officer',
    qualifications: 'M.Ed Measurement & Evaluation, B.Sc Physics',
    email: 'exams@bummpteducation.edu.ng',
    phone: '+234 809 111 2233',
    dateJoined: '2021-02-10',
    status: 'Active',
  },
  {
    id: 'STF-005',
    staffId: 'BEDU/STAFF/05',
    fullName: 'Mr. Jude Msughter Tyav',
    type: 'Non-Teaching',
    departmentId: 'DEP-BURSARY',
    arm: 'All',
    designation: 'School Bursar & Central Chief Financial Officer',
    role: 'Bursar',
    qualifications: 'B.Sc. Accounting, ACA (ICAN)',
    email: 'bursar@bummpteducation.edu.ng',
    phone: '+234 811 523 1834',
    dateJoined: '2020-05-18',
    status: 'Active',
  },
  {
    id: 'STF-006',
    staffId: 'BEDU/STAFF/06',
    fullName: 'Mr. David Olatunji',
    type: 'Teaching',
    departmentId: 'DEP-SCI',
    arm: 'secondary',
    designation: 'HOD Sciences & Senior Physics Master',
    role: 'HOD',
    assignedClass: 'SSS 3 Science',
    assignedSubjects: ['SUB-PHY'],
    qualifications: 'B.Sc. Physics, PGDE',
    email: 'd.olatunji@bummpteducation.edu.ng',
    phone: '+234 803 999 8877',
    dateJoined: '2021-09-01',
    status: 'Active',
  },
  {
    id: 'STF-007',
    staffId: 'BEDU/STAFF/07',
    fullName: 'Mrs. Blessing Aondoaver',
    type: 'Teaching',
    departmentId: 'DEP-LANG',
    arm: 'secondary',
    designation: 'Form Tutor (SSS 2 Arts) & English Lead',
    role: 'Form Tutor',
    assignedClass: 'SSS 2 Arts',
    assignedSubjects: ['SUB-ENG', 'SUB-LIT'],
    qualifications: 'B.A. (Ed) English Literature',
    email: 'b.aondoaver@bummpteducation.edu.ng',
    phone: '+234 814 333 4455',
    dateJoined: '2022-01-10',
    status: 'Active',
  },
  {
    id: 'STF-008',
    staffId: 'BEDU/STAFF/08',
    fullName: 'Mr. Chidi Eze',
    type: 'Teaching',
    departmentId: 'DEP-MATH',
    arm: 'secondary',
    designation: 'Form Tutor (JSS 3) & Mathematics Master',
    role: 'Form Tutor',
    assignedClass: 'JSS 3',
    assignedSubjects: ['SUB-MAT'],
    qualifications: 'B.Sc. Mathematics & Statistics, TRCN',
    email: 'c.eze@bummpteducation.edu.ng',
    phone: '+234 816 777 8899',
    dateJoined: '2022-08-15',
    status: 'Active',
  }
];

export const INITIAL_STUDENTS: Student[] = [
  // ==================== KINDERGARTEN (EARLY YEARS) STUDENTS ====================
  {
    id: 'STU-KG-001',
    admissionNumber: 'BEDU/KG/2024/001',
    fullName: 'Zainab Michelle Beeun',
    gender: 'Female',
    dateOfBirth: '2021-05-18',
    currentClass: 'KG 3',
    arm: 'kindergarten',
    house: 'Eagle House (Blue)',
    guardianName: 'Engr. Matthew Beeun',
    guardianPhone: '+234 811 523 1834',
    guardianEmail: 'bummpt90@gmail.com',
    address: 'Akperan Orshi Ave, Housing Estate, Makurdi',
    stateOfOrigin: 'Benue',
    dateEnrolled: '2024-09-09',
    status: 'Active',
    isPrefect: false
  },
  {
    id: 'STU-KG-002',
    admissionNumber: 'BEDU/KG/2025/002',
    fullName: 'Tariq Emmanuel Adeleke',
    gender: 'Male',
    dateOfBirth: '2022-03-10',
    currentClass: 'KG 2',
    arm: 'kindergarten',
    house: 'Lion House (Yellow)',
    guardianName: 'Dr. Femi Adeleke',
    guardianPhone: '+234 803 445 6677',
    guardianEmail: 'femi.adeleke@gmail.com',
    address: '14 High Level Crescent, Makurdi',
    stateOfOrigin: 'Osun',
    dateEnrolled: '2025-09-08',
    status: 'Active'
  },
  {
    id: 'STU-KG-003',
    admissionNumber: 'BEDU/KG/2025/003',
    fullName: 'Aisha Chloe Bello',
    gender: 'Female',
    dateOfBirth: '2022-11-22',
    currentClass: 'KG 1',
    arm: 'kindergarten',
    house: 'Falcon House (Red)',
    guardianName: 'Alhaji Usman Bello',
    guardianPhone: '+234 802 556 7788',
    guardianEmail: 'usman.bello@yahoo.com',
    address: '8 Wurukum Road, Makurdi',
    stateOfOrigin: 'Kano',
    dateEnrolled: '2025-09-08',
    status: 'Active'
  },

  // ==================== PRIMARY SCHOOL (BASIC 1 - 6) STUDENTS ====================
  {
    id: 'STU-PRI-001',
    admissionNumber: 'BEDU/PRI/2021/014',
    fullName: 'Kator Andrew Iorfa',
    gender: 'Male',
    dateOfBirth: '2015-08-14',
    currentClass: 'Basic 6',
    arm: 'primary',
    house: 'Cheetah House (Green)',
    guardianName: 'Mr. Emmanuel Iorfa',
    guardianPhone: '+234 802 345 6789',
    guardianEmail: 'vp.academic@bummpteducation.edu.ng',
    address: '12 North Bank, Makurdi',
    stateOfOrigin: 'Benue',
    dateEnrolled: '2021-09-06',
    status: 'Active',
    isPrefect: true,
    prefectRole: 'Primary Head Boy'
  },
  {
    id: 'STU-PRI-002',
    admissionNumber: 'BEDU/PRI/2023/045',
    fullName: 'Amarachi Chimamanda Obi',
    gender: 'Female',
    dateOfBirth: '2017-04-19',
    currentClass: 'Basic 3',
    arm: 'primary',
    house: 'Falcon House (Red)',
    guardianName: 'Mr. Kenneth Obi',
    guardianPhone: '+234 809 334 2211',
    guardianEmail: 'kenneth.obi@gmail.com',
    address: '22 Modern Market Rd, Makurdi',
    stateOfOrigin: 'Anambra',
    dateEnrolled: '2023-09-11',
    status: 'Active',
    isPrefect: true,
    prefectRole: 'Primary Health Prefect'
  },
  {
    id: 'STU-PRI-003',
    admissionNumber: 'BEDU/PRI/2025/088',
    fullName: 'David Msughter Tyav Jnr',
    gender: 'Male',
    dateOfBirth: '2019-02-05',
    currentClass: 'Basic 1',
    arm: 'primary',
    house: 'Lion House (Yellow)',
    guardianName: 'Mr. Jude Tyav (Bursar)',
    guardianPhone: '+234 811 523 1834',
    guardianEmail: 'bursar@bummpteducation.edu.ng',
    address: 'HUDCO Quarters, Makurdi',
    stateOfOrigin: 'Benue',
    dateEnrolled: '2025-09-08',
    status: 'Active'
  },

  // ==================== SECONDARY SCHOOL (JSS & SSS) STUDENTS ====================
  {
    id: 'STU-001',
    admissionNumber: 'BEDU/2023/001',
    fullName: 'Dooshima Matthew Beeun',
    gender: 'Female',
    dateOfBirth: '2009-04-12',
    currentClass: 'SSS 2 Science',
    arm: 'secondary',
    house: 'Eagle House (Blue)',
    guardianName: 'Engr. Matthew Beeun',
    guardianPhone: '+234 811 523 1834',
    guardianEmail: 'bummpt90@gmail.com',
    address: 'Akperan Orshi Ave, Housing Estate, Makurdi',
    stateOfOrigin: 'Benue',
    dateEnrolled: '2023-09-11',
    status: 'Active',
    isPrefect: true,
    prefectRole: 'Assistant Head Girl & Library Prefect'
  },
  {
    id: 'STU-002',
    admissionNumber: 'BEDU/2023/002',
    fullName: 'Oluwaseun Victor Adeleke',
    gender: 'Male',
    dateOfBirth: '2008-11-20',
    currentClass: 'SSS 3 Science',
    arm: 'secondary',
    house: 'Lion House (Yellow)',
    guardianName: 'Dr. Femi Adeleke',
    guardianPhone: '+234 803 445 6677',
    guardianEmail: 'femi.adeleke@gmail.com',
    address: '14 High Level Crescent, Makurdi',
    stateOfOrigin: 'Osun',
    dateEnrolled: '2021-09-08',
    status: 'Active',
    isPrefect: true,
    prefectRole: 'Head Boy'
  },
  {
    id: 'STU-003',
    admissionNumber: 'BEDU/2023/003',
    fullName: 'Amina Zainab Bello',
    gender: 'Female',
    dateOfBirth: '2009-02-14',
    currentClass: 'SSS 2 Arts',
    arm: 'secondary',
    house: 'Falcon House (Red)',
    guardianName: 'Alhaji Usman Bello',
    guardianPhone: '+234 802 556 7788',
    guardianEmail: 'usman.bello@yahoo.com',
    address: '8 Wurukum Road, Makurdi',
    stateOfOrigin: 'Kano',
    dateEnrolled: '2023-09-11',
    status: 'Active',
    isPrefect: true,
    prefectRole: 'Health & Sanitary Prefect'
  },
  {
    id: 'STU-004',
    admissionNumber: 'BEDU/2023/004',
    fullName: 'Chukwuemeka Daniel Obi',
    gender: 'Male',
    dateOfBirth: '2010-06-30',
    currentClass: 'SSS 1 Commercial',
    arm: 'secondary',
    house: 'Cheetah House (Green)',
    guardianName: 'Mr. Kenneth Obi',
    guardianPhone: '+234 809 334 2211',
    guardianEmail: 'kenneth.obi@gmail.com',
    address: '22 Modern Market Rd, Makurdi',
    stateOfOrigin: 'Anambra',
    dateEnrolled: '2024-09-09',
    status: 'Active',
    isPrefect: false
  },
  {
    id: 'STU-005',
    admissionNumber: 'BEDU/2024/005',
    fullName: 'Tersoo Kelvin Agber',
    gender: 'Male',
    dateOfBirth: '2011-08-18',
    currentClass: 'JSS 3',
    arm: 'secondary',
    house: 'Eagle House (Blue)',
    guardianName: 'Hon. Joseph Agber',
    guardianPhone: '+234 813 667 8899',
    guardianEmail: 'jagber@benuestate.gov.ng',
    address: '5 Judges Quarters, Gboko Road, Makurdi',
    stateOfOrigin: 'Benue',
    dateEnrolled: '2023-09-11',
    status: 'Active',
    isPrefect: true,
    prefectRole: 'Junior School Assembly Prefect'
  },
  {
    id: 'STU-006',
    admissionNumber: 'BEDU/2024/006',
    fullName: 'Deborah Folashade Balogun',
    gender: 'Female',
    dateOfBirth: '2012-01-25',
    currentClass: 'JSS 2',
    arm: 'secondary',
    house: 'Falcon House (Red)',
    guardianName: 'Mrs. Abigail Balogun',
    guardianPhone: '+234 807 889 0011',
    guardianEmail: 'abigail.balogun@outlook.com',
    address: '10 North Bank Expressway, Makurdi',
    stateOfOrigin: 'Kogi',
    dateEnrolled: '2024-09-09',
    status: 'Active'
  },
  {
    id: 'STU-007',
    admissionNumber: 'BEDU/2025/007',
    fullName: 'Somtochukwu Paul Nnamdi',
    gender: 'Male',
    dateOfBirth: '2013-05-10',
    currentClass: 'JSS 1',
    arm: 'secondary',
    house: 'Lion House (Yellow)',
    guardianName: 'Dr. (Mrs.) Ifeoma Nnamdi',
    guardianPhone: '+234 803 771 9922',
    guardianEmail: 'ifeoma.nnamdi@uniben.edu',
    address: '3 Benue Links Road, Makurdi',
    stateOfOrigin: 'Enugu',
    dateEnrolled: '2025-09-08',
    status: 'Active'
  },
  {
    id: 'STU-008',
    admissionNumber: 'BEDU/2023/008',
    fullName: 'Khadijah Maryam Shehu',
    gender: 'Female',
    dateOfBirth: '2008-09-05',
    currentClass: 'SSS 3 Arts',
    arm: 'secondary',
    house: 'Cheetah House (Green)',
    guardianName: 'Mallam Shehu Garba',
    guardianPhone: '+234 802 119 4433',
    guardianEmail: 'shehugarba@gmail.com',
    address: '19 Kashim Ibrahim Way, Makurdi',
    stateOfOrigin: 'Kaduna',
    dateEnrolled: '2021-09-08',
    status: 'Active',
    isPrefect: true,
    prefectRole: 'Head Girl'
  }
];

export const INITIAL_ASSESSMENTS: AssessmentScore[] = [
  // ==================== KINDERGARTEN ASSESSMENTS (Zainab Michelle Beeun - KG 3) ====================
  { studentId: 'STU-KG-001', subjectId: 'SUB-KG-PHO', classLevel: 'KG 3', term: '2nd Term', academicYear: '2025/2026', ca1: 10, ca2: 10, assignment: 10, attendance: 10, totalCa: 40, examScore: 56, totalScore: 96, grade: 'Exceeding', remark: 'Excellent phonemic awareness and sound blending', positionInSubject: 1 },
  { studentId: 'STU-KG-001', subjectId: 'SUB-KG-NUM', classLevel: 'KG 3', term: '2nd Term', academicYear: '2025/2026', ca1: 9.5, ca2: 10, assignment: 9.5, attendance: 10, totalCa: 39, examScore: 55, totalScore: 94, grade: 'Exceeding', remark: 'Masters counting up to 100 and basic addition', positionInSubject: 1 },
  { studentId: 'STU-KG-001', subjectId: 'SUB-KG-DIS', classLevel: 'KG 3', term: '2nd Term', academicYear: '2025/2026', ca1: 9, ca2: 9.5, assignment: 9, attendance: 10, totalCa: 37.5, examScore: 52.5, totalScore: 90, grade: 'Exceeding', remark: 'High curiosity in sensory observation', positionInSubject: 1 },
  { studentId: 'STU-KG-001', subjectId: 'SUB-KG-SOC', classLevel: 'KG 3', term: '2nd Term', academicYear: '2025/2026', ca1: 9.5, ca2: 9, assignment: 10, attendance: 10, totalCa: 38.5, examScore: 53.5, totalScore: 92, grade: 'Exceeding', remark: 'Polite, shares toys cheerfully and leads peers', positionInSubject: 1 },
  { studentId: 'STU-KG-001', subjectId: 'SUB-KG-ART', classLevel: 'KG 3', term: '2nd Term', academicYear: '2025/2026', ca1: 9, ca2: 9, assignment: 9.5, attendance: 10, totalCa: 37.5, examScore: 51.5, totalScore: 89, grade: 'Proficient', remark: 'Creative color mixing and neat patterns', positionInSubject: 2 },
  { studentId: 'STU-KG-001', subjectId: 'SUB-KG-MOT', classLevel: 'KG 3', term: '2nd Term', academicYear: '2025/2026', ca1: 9.5, ca2: 9.5, assignment: 9, attendance: 10, totalCa: 38, examScore: 54, totalScore: 92, grade: 'Exceeding', remark: 'Firm pencil tripod grip and steady strokes', positionInSubject: 1 },

  // ==================== PRIMARY ASSESSMENTS (Kator Andrew Iorfa - Basic 6) ====================
  { studentId: 'STU-PRI-001', subjectId: 'SUB-PRI-ENG', classLevel: 'Basic 6', term: '2nd Term', academicYear: '2025/2026', ca1: 9, ca2: 9.5, assignment: 9, attendance: 9.5, totalCa: 37, examScore: 53, totalScore: 90, grade: 'A+', remark: 'Distinction in grammar & essay writing', positionInSubject: 1 },
  { studentId: 'STU-PRI-001', subjectId: 'SUB-PRI-MAT', classLevel: 'Basic 6', term: '2nd Term', academicYear: '2025/2026', ca1: 10, ca2: 9.5, assignment: 10, attendance: 10, totalCa: 39.5, examScore: 55.5, totalScore: 95, grade: 'A+', remark: 'Exceptional speed in quantitative problems', positionInSubject: 1 },
  { studentId: 'STU-PRI-001', subjectId: 'SUB-PRI-BSC', classLevel: 'Basic 6', term: '2nd Term', academicYear: '2025/2026', ca1: 9, ca2: 8.5, assignment: 9, attendance: 9.5, totalCa: 36, examScore: 51, totalScore: 87, grade: 'A', remark: 'High grasp of basic living systems', positionInSubject: 1 },
  { studentId: 'STU-PRI-001', subjectId: 'SUB-PRI-QRE', classLevel: 'Basic 6', term: '2nd Term', academicYear: '2025/2026', ca1: 10, ca2: 10, assignment: 9.5, attendance: 10, totalCa: 39.5, examScore: 56.5, totalScore: 96, grade: 'A+', remark: 'Ready for National Common Entrance', positionInSubject: 1 },
  { studentId: 'STU-PRI-001', subjectId: 'SUB-PRI-VRE', classLevel: 'Basic 6', term: '2nd Term', academicYear: '2025/2026', ca1: 9, ca2: 9, assignment: 9, attendance: 9, totalCa: 36, examScore: 52, totalScore: 88, grade: 'A', remark: 'Strong vocabulary and analogy deduction', positionInSubject: 2 },
  { studentId: 'STU-PRI-001', subjectId: 'SUB-PRI-ICT', classLevel: 'Basic 6', term: '2nd Term', academicYear: '2025/2026', ca1: 9.5, ca2: 9.5, assignment: 10, attendance: 10, totalCa: 39, examScore: 55, totalScore: 94, grade: 'A+', remark: 'Constructed Scratch block animations successfully', positionInSubject: 1 },
  { studentId: 'STU-PRI-001', subjectId: 'SUB-PRI-CIV', classLevel: 'Basic 6', term: '2nd Term', academicYear: '2025/2026', ca1: 8.5, ca2: 9, assignment: 9, attendance: 9.5, totalCa: 36, examScore: 49, totalScore: 85, grade: 'A', remark: 'Exemplary civic knowledge & duty', positionInSubject: 2 },
  { studentId: 'STU-PRI-001', subjectId: 'SUB-PRI-AGR', classLevel: 'Basic 6', term: '2nd Term', academicYear: '2025/2026', ca1: 8.5, ca2: 8.5, assignment: 9, attendance: 9, totalCa: 35, examScore: 48, totalScore: 83, grade: 'A', remark: 'Active participation in school orchard', positionInSubject: 2 },

  // ==================== SECONDARY ASSESSMENTS ====================
  // Dooshima Matthew Beeun (SSS 2 Science)
  { studentId: 'STU-001', subjectId: 'SUB-ENG', classLevel: 'SSS 2 Science', term: '2nd Term', academicYear: '2025/2026', ca1: 9, ca2: 9, assignment: 9, attendance: 9, totalCa: 36, examScore: 54, totalScore: 90, grade: 'A1', remark: 'Excellent', positionInSubject: 1 },
  { studentId: 'STU-001', subjectId: 'SUB-MAT', classLevel: 'SSS 2 Science', term: '2nd Term', academicYear: '2025/2026', ca1: 10, ca2: 10, assignment: 10, attendance: 10, totalCa: 40, examScore: 56, totalScore: 96, grade: 'A1', remark: 'Distinction', positionInSubject: 1 },
  { studentId: 'STU-001', subjectId: 'SUB-PHY', classLevel: 'SSS 2 Science', term: '2nd Term', academicYear: '2025/2026', ca1: 8.5, ca2: 9, assignment: 9, attendance: 9.5, totalCa: 36, examScore: 52, totalScore: 88, grade: 'A1', remark: 'Excellent', positionInSubject: 1 },
  { studentId: 'STU-001', subjectId: 'SUB-CHM', classLevel: 'SSS 2 Science', term: '2nd Term', academicYear: '2025/2026', ca1: 8, ca2: 9, assignment: 9, attendance: 9, totalCa: 35, examScore: 50, totalScore: 85, grade: 'A1', remark: 'Excellent', positionInSubject: 2 },
  { studentId: 'STU-001', subjectId: 'SUB-BIO', classLevel: 'SSS 2 Science', term: '2nd Term', academicYear: '2025/2026', ca1: 9, ca2: 8.5, assignment: 9, attendance: 9.5, totalCa: 36, examScore: 51, totalScore: 87, grade: 'A1', remark: 'Excellent', positionInSubject: 1 },
  { studentId: 'STU-001', subjectId: 'SUB-ICT', classLevel: 'SSS 2 Science', term: '2nd Term', academicYear: '2025/2026', ca1: 10, ca2: 10, assignment: 10, attendance: 10, totalCa: 40, examScore: 58, totalScore: 98, grade: 'A1', remark: 'Outstanding Masterly', positionInSubject: 1 },
  { studentId: 'STU-001', subjectId: 'SUB-CIV', classLevel: 'SSS 2 Science', term: '2nd Term', academicYear: '2025/2026', ca1: 8, ca2: 8, assignment: 9, attendance: 9, totalCa: 34, examScore: 48, totalScore: 82, grade: 'A1', remark: 'Excellent', positionInSubject: 3 },
  { studentId: 'STU-001', subjectId: 'SUB-ECO', classLevel: 'SSS 2 Science', term: '2nd Term', academicYear: '2025/2026', ca1: 8, ca2: 8.5, assignment: 8, attendance: 9, totalCa: 33.5, examScore: 46.5, totalScore: 80, grade: 'A1', remark: 'Excellent', positionInSubject: 2 },
  { studentId: 'STU-001', subjectId: 'SUB-ENT', classLevel: 'SSS 2 Science', term: '2nd Term', academicYear: '2025/2026', ca1: 9, ca2: 9, assignment: 9, attendance: 9, totalCa: 36, examScore: 53, totalScore: 89, grade: 'A1', remark: 'Distinction', positionInSubject: 1 },

  // Tersoo Kelvin Agber (JSS 3)
  { studentId: 'STU-005', subjectId: 'SUB-ENG', classLevel: 'JSS 3', term: '2nd Term', academicYear: '2025/2026', ca1: 7.5, ca2: 8, assignment: 8, attendance: 9, totalCa: 32.5, examScore: 45, totalScore: 77.5, grade: 'B2', remark: 'Very Good', positionInSubject: 3 },
  { studentId: 'STU-005', subjectId: 'SUB-MAT', classLevel: 'JSS 3', term: '2nd Term', academicYear: '2025/2026', ca1: 8.5, ca2: 9, assignment: 9, attendance: 9, totalCa: 35.5, examScore: 50, totalScore: 85.5, grade: 'A1', remark: 'Excellent', positionInSubject: 2 },
  { studentId: 'STU-005', subjectId: 'SUB-BSC', classLevel: 'JSS 3', term: '2nd Term', academicYear: '2025/2026', ca1: 8, ca2: 8, assignment: 8.5, attendance: 9, totalCa: 33.5, examScore: 48, totalScore: 81.5, grade: 'A1', remark: 'Excellent', positionInSubject: 2 },
  { studentId: 'STU-005', subjectId: 'SUB-SOC', classLevel: 'JSS 3', term: '2nd Term', academicYear: '2025/2026', ca1: 7, ca2: 7.5, assignment: 8, attendance: 8.5, totalCa: 31, examScore: 42, totalScore: 73, grade: 'B3', remark: 'Good', positionInSubject: 5 },
  { studentId: 'STU-005', subjectId: 'SUB-BUS', classLevel: 'JSS 3', term: '2nd Term', academicYear: '2025/2026', ca1: 8, ca2: 8.5, assignment: 8, attendance: 9, totalCa: 33.5, examScore: 45, totalScore: 78.5, grade: 'B2', remark: 'Very Good', positionInSubject: 2 },
  { studentId: 'STU-005', subjectId: 'SUB-ICT', classLevel: 'JSS 3', term: '2nd Term', academicYear: '2025/2026', ca1: 9, ca2: 9.5, assignment: 9.5, attendance: 9, totalCa: 37, examScore: 53, totalScore: 90, grade: 'A1', remark: 'Excellent', positionInSubject: 1 },
  { studentId: 'STU-005', subjectId: 'SUB-AGR', classLevel: 'JSS 3', term: '2nd Term', academicYear: '2025/2026', ca1: 8, ca2: 7.5, assignment: 8, attendance: 8.5, totalCa: 32, examScore: 44, totalScore: 76, grade: 'B2', remark: 'Very Good', positionInSubject: 4 },
  { studentId: 'STU-005', subjectId: 'SUB-CRS', classLevel: 'JSS 3', term: '2nd Term', academicYear: '2025/2026', ca1: 7, ca2: 7, assignment: 8, attendance: 8, totalCa: 30, examScore: 41, totalScore: 71, grade: 'B3', remark: 'Good', positionInSubject: 6 },
  { studentId: 'STU-005', subjectId: 'SUB-CIV', classLevel: 'JSS 3', term: '2nd Term', academicYear: '2025/2026', ca1: 8, ca2: 8, assignment: 8, attendance: 9, totalCa: 33, examScore: 46, totalScore: 79, grade: 'B2', remark: 'Very Good', positionInSubject: 3 }
];

export const INITIAL_EARLY_YEARS_MILESTONES: EarlyYearsMilestone[] = [
  {
    domain: 'Communication & Phonics',
    skill: 'Letter Sound Recognition & Blending (Group 1 - 6 Jolly Phonics)',
    mastery: 'Exceeding',
    ratingScore: 4,
    teacherComment: 'Recognizes all 42 basic sounds accurately and reads 3-letter CVC words with high fluency.'
  },
  {
    domain: 'Early Numeracy & Shapes',
    skill: 'Counting, Number Identification (1-100) & Shape Geometry',
    mastery: 'Exceeding',
    ratingScore: 4,
    teacherComment: 'Sorts 2D/3D shapes effortlessly and computes simple addition problems using counters.'
  },
  {
    domain: 'Physical & Fine Motor Skills',
    skill: 'Tripod Pencil Grip, Scissor Cutting & Pattern Tracing',
    mastery: 'Proficient',
    ratingScore: 3,
    teacherComment: 'Good control with child-safe scissors, traces patterns inside boundaries with precision.'
  },
  {
    domain: 'Personal & Social Development',
    skill: 'Sharing, Emotional Expression, Classroom Etiquette & Independence',
    mastery: 'Exceeding',
    ratingScore: 4,
    teacherComment: 'Demonstrates deep empathy, takes off coat independently, cleans up play station responsibly.'
  },
  {
    domain: 'Creative Arts & Rhymes',
    skill: 'Singing, Role Play, Texture Exploration & Coloring',
    mastery: 'Proficient',
    ratingScore: 3,
    teacherComment: 'Loves dramatic role-play in the puppet theater, remembers all class nursery rhymes.'
  },
  {
    domain: 'Sensory & Discovery',
    skill: 'Observation of Living Things, Weather & Nature Exploration',
    mastery: 'Exceeding',
    ratingScore: 4,
    teacherComment: 'Asked brilliant questions about plant germination in the discovery garden.'
  }
];

export const INITIAL_FEE_SCHEDULES: FeeSchedule[] = [
  // ==================== KINDERGARTEN (KG 1 - 3) ====================
  {
    classLevel: 'KG 3',
    arm: 'kindergarten',
    term: '2nd Term',
    academicYear: '2025/2026',
    items: [
      { id: 'FEE-KG-TUI', name: 'Early Childhood Tuition & Guided Learning', amount: 45000, isCompulsory: true, category: 'Tuition' },
      { id: 'FEE-KG-KIT', name: 'Montessori Sensory Kits & Workbooks', amount: 15000, isCompulsory: true, category: 'Early Years Kit & Meals' },
      { id: 'FEE-KG-MEA', name: 'Mid-day Nutritious Snack & Fruit Scheme', amount: 12000, isCompulsory: true, category: 'Early Years Kit & Meals' },
      { id: 'FEE-KG-DEV', name: 'Playground & Soft-Surface Maintenance', amount: 8000, isCompulsory: true, category: 'Development' },
      { id: 'FEE-KG-PTA', name: 'Early Years PTA & Family Day Levy', amount: 5000, isCompulsory: true, category: 'PTA' },
      { id: 'FEE-KG-MED', name: 'Pediatric Clinic & First Aid Coverage', amount: 5000, isCompulsory: true, category: 'Tuition' }
    ],
    totalAmount: 90000
  },

  // ==================== PRIMARY SCHOOL (BASIC 1 - 6) ====================
  {
    classLevel: 'Basic 6',
    arm: 'primary',
    term: '2nd Term',
    academicYear: '2025/2026',
    items: [
      { id: 'FEE-PRI-TUI', name: 'Primary Academic Tuition & Instructional Materials', amount: 55000, isCompulsory: true, category: 'Tuition' },
      { id: 'FEE-PRI-NCE', name: 'National Common Entrance Exam (NCEE) & Placement Prep', amount: 20000, isCompulsory: true, category: 'Common Entrance Prep' },
      { id: 'FEE-PRI-ICT', name: 'Computer Coding, Smart Lab & STEM Robotics', amount: 12000, isCompulsory: true, category: 'ICT & STEM' },
      { id: 'FEE-PRI-DEV', name: 'Primary School Development Levy', amount: 10000, isCompulsory: true, category: 'Development' },
      { id: 'FEE-PRI-PTA', name: 'Primary PTA Dues', amount: 5000, isCompulsory: true, category: 'PTA' },
      { id: 'FEE-PRI-LIB', name: 'Junior E-Library & Readers Society Access', amount: 4000, isCompulsory: true, category: 'Tuition' }
    ],
    totalAmount: 106000
  },

  // ==================== SECONDARY SCHOOL (JSS & SSS) ====================
  {
    classLevel: 'JSS 1',
    arm: 'secondary',
    term: '2nd Term',
    academicYear: '2025/2026',
    items: [
      { id: 'FEE-TUI', name: 'Tuition & Academic Instructional Fee', amount: 65000, isCompulsory: true, category: 'Tuition' },
      { id: 'FEE-DEV', name: 'School Development & Capital Levy', amount: 15000, isCompulsory: true, category: 'Development' },
      { id: 'FEE-ICT', name: 'ICT, Coding & Smart Lab Maintenance', amount: 12000, isCompulsory: true, category: 'ICT & STEM' },
      { id: 'FEE-PTA', name: 'Parent-Teacher Association (PTA) Dues', amount: 5000, isCompulsory: true, category: 'PTA' },
      { id: 'FEE-MED', name: 'Medical Clinic & First Aid Insurance', amount: 6000, isCompulsory: true, category: 'Tuition' },
      { id: 'FEE-LIB', name: 'E-Library & Resource Center Subscription', amount: 4500, isCompulsory: true, category: 'Tuition' },
    ],
    totalAmount: 107500
  },
  {
    classLevel: 'SSS 2 Science',
    arm: 'secondary',
    term: '2nd Term',
    academicYear: '2025/2026',
    items: [
      { id: 'FEE-TUI', name: 'Tuition & Senior Academic Delivery', amount: 80000, isCompulsory: true, category: 'Tuition' },
      { id: 'FEE-DEV', name: 'School Development & Infrastructure Levy', amount: 15000, isCompulsory: true, category: 'Development' },
      { id: 'FEE-LAB', name: 'Science Laboratory Reagents & Practicals (Physics/Chem/Bio)', amount: 20000, isCompulsory: true, category: 'Laboratory' },
      { id: 'FEE-ICT', name: 'ICT, Robotics & CBT Examination Platform', amount: 15000, isCompulsory: true, category: 'ICT & STEM' },
      { id: 'FEE-PTA', name: 'Parent-Teacher Association (PTA) Dues', amount: 5000, isCompulsory: true, category: 'PTA' },
      { id: 'FEE-MED', name: 'Medical Health Clinic & Comprehensive Insurance', amount: 6000, isCompulsory: true, category: 'Tuition' },
    ],
    totalAmount: 141000
  },
  {
    classLevel: 'SSS 3 Science',
    arm: 'secondary',
    term: '2nd Term',
    academicYear: '2025/2026',
    items: [
      { id: 'FEE-TUI', name: 'Tuition & Intensive Extension Coaching', amount: 95000, isCompulsory: true, category: 'Tuition' },
      { id: 'FEE-WEC', name: 'WAEC (WASSCE) & NECO Senior Examination Registration', amount: 45000, isCompulsory: true, category: 'Tuition' },
      { id: 'FEE-INT', name: 'Cambridge IGCSE, SAT & JAMB UTME Preparatory & CBT Registration', amount: 35000, isCompulsory: true, category: 'Tuition' },
      { id: 'FEE-LAB', name: 'Advanced Laboratory Chemicals & Specimen', amount: 25000, isCompulsory: true, category: 'Laboratory' },
      { id: 'FEE-PTA', name: 'PTA Dues & Valedictory Graduation Levy', amount: 15000, isCompulsory: true, category: 'PTA' },
      { id: 'FEE-ICT', name: 'CBT Mock WAEC/JAMB/SAT/IGCSE Software Package', amount: 10000, isCompulsory: true, category: 'ICT & STEM' }
    ],
    totalAmount: 225000
  }
];

export const INITIAL_PAYMENTS: FeePayment[] = [
  // Kindergarten Payment
  {
    id: 'PAY-KG-001',
    receiptNumber: 'REC-2026-KG01',
    studentId: 'STU-KG-001',
    classLevel: 'KG 3',
    arm: 'kindergarten',
    term: '2nd Term',
    academicYear: '2025/2026',
    amountPaid: 90000,
    totalBilled: 90000,
    balance: 0,
    paymentDate: '2026-01-12',
    paymentMethod: 'Online Gateway',
    status: 'Fully Paid',
    collectedBy: 'Bursary Automated Gateway'
  },
  // Primary Payment
  {
    id: 'PAY-PRI-001',
    receiptNumber: 'REC-2026-PRI01',
    studentId: 'STU-PRI-001',
    classLevel: 'Basic 6',
    arm: 'primary',
    term: '2nd Term',
    academicYear: '2025/2026',
    amountPaid: 106000,
    totalBilled: 106000,
    balance: 0,
    paymentDate: '2026-01-13',
    paymentMethod: 'Bank Transfer',
    status: 'Fully Paid',
    collectedBy: 'Mr. Jude Msughter Tyav (Bursar)'
  },
  // Secondary Payments
  {
    id: 'PAY-001',
    receiptNumber: 'REC-2026-0891',
    studentId: 'STU-001',
    classLevel: 'SSS 2 Science',
    arm: 'secondary',
    term: '2nd Term',
    academicYear: '2025/2026',
    amountPaid: 141000,
    totalBilled: 141000,
    balance: 0,
    paymentDate: '2026-01-14',
    paymentMethod: 'Bank Transfer',
    status: 'Fully Paid',
    collectedBy: 'Mr. Jude Msughter Tyav (Bursar)'
  },
  {
    id: 'PAY-002',
    receiptNumber: 'REC-2026-0892',
    studentId: 'STU-002',
    classLevel: 'SSS 3 Science',
    arm: 'secondary',
    term: '2nd Term',
    academicYear: '2025/2026',
    amountPaid: 225000,
    totalBilled: 225000,
    balance: 0,
    paymentDate: '2026-01-10',
    paymentMethod: 'Online Gateway',
    status: 'Fully Paid',
    collectedBy: 'Bursary Automated Gateway'
  },
  {
    id: 'PAY-003',
    receiptNumber: 'REC-2026-0893',
    studentId: 'STU-005',
    classLevel: 'JSS 3',
    arm: 'secondary',
    term: '2nd Term',
    academicYear: '2025/2026',
    amountPaid: 80000,
    totalBilled: 115000,
    balance: 35000,
    paymentDate: '2026-01-20',
    paymentMethod: 'POS',
    status: 'Partial',
    collectedBy: 'Mr. Jude Msughter Tyav (Bursar)'
  }
];

export const INITIAL_ADMISSIONS: AdmissionApplication[] = [
  // Kindergarten Intake Application
  {
    id: 'ADM-KG-001',
    applicationNumber: 'BEDU/ADM/KG/2026/001',
    studentName: 'Torkwase Michelle Akume',
    appliedClass: 'KG 1',
    arm: 'kindergarten',
    guardianName: 'Barr. Terhemen Akume',
    guardianPhone: '+234 803 112 4455',
    guardianEmail: 'takume@gmail.com',
    previousSchool: 'Home Care / Crèche',
    developmentalReadinessScore: 92,
    immunizationCompleted: true,
    toiletTrained: true,
    interviewScore: 95,
    status: 'Passed - Admitted',
    submittedDate: '2026-02-10'
  },
  // Primary Placement Application
  {
    id: 'ADM-PRI-001',
    applicationNumber: 'BEDU/ADM/PRI/2026/012',
    studentName: 'Emmanuel Chukwudi Nnaji',
    appliedClass: 'Basic 4',
    arm: 'primary',
    guardianName: 'Dr. Christopher Nnaji',
    guardianPhone: '+234 814 889 2233',
    guardianEmail: 'c.nnaji@hospital.gov.ng',
    previousSchool: 'Premier Heights International, Abuja',
    entranceExamScore: 84,
    interviewScore: 88,
    status: 'Passed - Admitted',
    submittedDate: '2026-02-14'
  },
  // Secondary Admission Application (JSS 1)
  {
    id: 'ADM-001',
    applicationNumber: 'BEDU/ADM/2026/041',
    studentName: 'Marvelous Iveren Terwase',
    appliedClass: 'JSS 1',
    arm: 'secondary',
    guardianName: 'Engr. Terwase Gabriel',
    guardianPhone: '+234 803 881 2299',
    guardianEmail: 'terwase.g@gmail.com',
    previousSchool: 'St. Louis Primary School, Makurdi',
    entranceExamScore: 88,
    interviewScore: 92,
    status: 'Passed - Admitted',
    submittedDate: '2026-02-12'
  },
  // Secondary Admission Application (SSS 1)
  {
    id: 'ADM-002',
    applicationNumber: 'BEDU/ADM/2026/042',
    studentName: 'Precious Oghenetega Oghene',
    appliedClass: 'SSS 1 Science',
    arm: 'secondary',
    guardianName: 'Mrs. Eloho Oghene',
    guardianPhone: '+234 814 552 1100',
    guardianEmail: 'eloho.oghene@yahoo.com',
    previousSchool: 'Federal Government College, Vandeikya',
    entranceExamScore: 79,
    interviewScore: 84,
    status: 'Passed - Admitted',
    submittedDate: '2026-02-15'
  },
  {
    id: 'ADM-003',
    applicationNumber: 'BEDU/ADM/2026/043',
    studentName: 'Farouk Ahmed Bello',
    appliedClass: 'JSS 1',
    arm: 'secondary',
    guardianName: 'Dr. Bello Farouk',
    guardianPhone: '+234 806 777 4433',
    guardianEmail: 'fbello@benuestate.gov',
    previousSchool: 'Nurudeen Academy, Makurdi',
    entranceExamScore: 64,
    interviewScore: 70,
    status: 'Waitlisted',
    submittedDate: '2026-02-18'
  },
  {
    id: 'ADM-004',
    applicationNumber: 'BEDU/ADM/2026/044',
    studentName: 'Chiamaka Joy Nwosu',
    appliedClass: 'JSS 1',
    arm: 'secondary',
    guardianName: 'Elder Chidi Nwosu',
    guardianPhone: '+234 802 331 9988',
    guardianEmail: 'cnwosu@gmail.com',
    previousSchool: 'Christ the King Model School',
    status: 'Entrance Exam Scheduled',
    submittedDate: '2026-02-22'
  }
];

export const ORGANOGRAM_DATA: OrganogramNode[] = [
  // ==================== EXECUTIVE CENTRAL GOVERNANCE ====================
  {
    id: 'ORG-01',
    title: 'Board of Governors / Proprietor',
    holderName: 'Chief (Dr.) S. J. Akperan & Executive Board',
    wing: 'Executive',
    arm: 'Executive',
    description: 'The highest governing body of BummptEducation, steering institutional governance, capital investments, regulatory accreditation across all arms (KG to SSS 3), and strategic policy.',
    responsibilities: [
      'Institutional charter, educational philosophy & moral direction',
      'Approval of annual capital and recurrent budgets for all arms',
      'Appointment of the General Administrator, Principal, Headmistress & Early Years Head',
      'Compliance with Federal Ministry of Education, WAEC, NECO, UBEC, Cambridge & College Board'
    ]
  },
  {
    id: 'ORG-02',
    title: 'General School Administrator / Executive Director',
    holderName: 'Matthew Ternenge Beeun (Bummptech Global Concepts)',
    wing: 'Executive',
    arm: 'Executive',
    reportsTo: 'Board of Governors / Proprietor',
    description: 'The central executive authority coordinating all 3 school arms (Kindergarten, Primary & Secondary), overseeing institutional synergy, digital architecture, HR governance, and cross-arm educational continuity.',
    responsibilities: [
      'Central control and monitoring of Kindergarten, Primary and Secondary Sub-Heads',
      'Deployment of BummptEducation digital infrastructure and unified database architecture',
      'Strategic HR performance, cross-arm quality assurance, and fiscal integrity',
      'Executive liaison with WAEC, NECO, UBEC, Cambridge Assessment, College Board and JAMB'
    ]
  },

  // ==================== KINDERGARTEN / EARLY YEARS WING ====================
  {
    id: 'ORG-EY-01',
    title: 'Head of Early Childhood / Kindergarten (Sub-Head)',
    holderName: 'Mrs. Abigail Folashade Balogun (M.Ed)',
    wing: 'Early Years Wing',
    arm: 'kindergarten',
    reportsTo: 'General School Administrator / Executive Director',
    description: 'Executive Sub-Head commanding the Kindergarten wing (KG 1, KG 2, KG 3), driving Montessori pedagogical standards, phonics fluency, sensory development, and child safety.',
    responsibilities: [
      'Early Childhood Care and Education (ECCE) curriculum delivery',
      'Supervision of Kindergarten educators, assistant care-givers, and play environments',
      'Developmental milestones assessments and qualitative report cards',
      'Kindergarten entry screening, family orientation, and graduation transition to Basic 1'
    ]
  },
  {
    id: 'ORG-EY-02',
    title: 'Kindergarten Class Teachers & Early Years Facilitators',
    holderName: 'Miss Rita Iorfa (KG 3), Mrs. Comfort Eze (KG 1 & 2)',
    wing: 'Early Years Wing',
    arm: 'kindergarten',
    reportsTo: 'Head of Early Childhood / Kindergarten (Sub-Head)',
    description: 'Frontline early childhood educators delivering personalized phonics, early numeracy, handwriting motor readiness, and emotional development.',
    responsibilities: [
      'Classroom circle time, Jolly Phonics sounds, rhymes and sensory stations',
      'Daily observation of psychomotor and emotional milestones',
      'Child hygiene, nutrition monitoring, and close parent daily feedback'
    ]
  },

  // ==================== PRIMARY SCHOOL / BASIC EDUCATION WING ====================
  {
    id: 'ORG-PRI-01',
    title: 'Headmistress (Primary Sub-Head)',
    holderName: 'Mrs. Grace Iveren Shima (M.Ed)',
    wing: 'Primary Wing',
    arm: 'primary',
    reportsTo: 'General School Administrator / Executive Director',
    description: 'Sub-Head in charge of the Primary School (Basic 1 to Basic 6), driving Universal Basic Education (UBE) standards, Cambridge Primary curriculum, and National Common Entrance success.',
    responsibilities: [
      'Supervision of Primary teaching faculty and class teachers across Basic 1 to 6',
      'Monitoring of primary Continuous Assessment (40%) and Terminal Examinations (60%)',
      'Coordination of National Common Entrance Examination (NCEE) and state placement clinics',
      'Primary pupil pastoral care, code of conduct, and parent-teacher consultations'
    ]
  },
  {
    id: 'ORG-PRI-02',
    title: 'Primary Class Masters & Subject Specialists',
    holderName: 'Mr. Moses Aondo (Basic 6 Lead), Mrs. Hadiza Abubakar (Basic 3 Lead), Mr. Jude Okafor (STEM)',
    wing: 'Primary Wing',
    arm: 'primary',
    reportsTo: 'Headmistress (Primary Sub-Head)',
    description: 'Dedicated primary educators delivering structured curricula in literacy, mathematics, science, national values, quantitative reasoning, and computer coding.',
    responsibilities: [
      'Daily instructional lesson delivery and workbook vetting',
      'Administration of mid-term tests and primary terminal examinations',
      'Diagnostic remediation in reading, handwriting, spelling and mental arithmetic'
    ]
  },

  // ==================== SECONDARY SCHOOL / COLLEGE WING ====================
  {
    id: 'ORG-03',
    title: 'Principal (Secondary Sub-Head)',
    holderName: 'Dr. (Mrs.) Grace Nkechi Okafor (Ph.D)',
    wing: 'Secondary Academic Wing',
    arm: 'secondary',
    reportsTo: 'General School Administrator / Executive Director',
    description: 'The central secondary academic and administrative leader responsible for secondary compliance, senior college-prep curricula, and high pass rates in WAEC, NECO, IGCSE, SAT & JAMB.',
    responsibilities: [
      'Supervision of the Secondary Academic Faculty and Vice-Principals',
      'Signing of official Secondary Terminal Report Cards & Academic Transcripts',
      'Quality assurance in WAEC WASSCE, NECO SSCE, BECE, Cambridge IGCSE, SAT & JAMB UTME',
      'Secondary student discipline, prefect council mentorship, and university guidance'
    ]
  },
  {
    id: 'ORG-04',
    title: 'Vice-Principal (Academics - Secondary)',
    holderName: 'Mr. Emmanuel Terkula Iorfa (M.Sc)',
    wing: 'Secondary Academic Wing',
    arm: 'secondary',
    reportsTo: 'Principal (Secondary Sub-Head)',
    description: 'Oversees the secondary teaching faculty, academic timetable, senior subject syllabus delivery, continuous assessment rigor, and teacher development.',
    responsibilities: [
      'Secondary curriculum supervision and lesson plan auditing',
      'Direct coordination of Heads of Departments (HODs)',
      'Management of termly broadsheets, WAEC/NECO/SAT/IGCSE prep clinics, and student promotions'
    ]
  },
  {
    id: 'ORG-05',
    title: 'Chief Examination Officer (Secondary)',
    holderName: 'Mrs. Fatima Al-Hassan (M.Ed)',
    wing: 'Secondary Academic Wing',
    arm: 'secondary',
    reportsTo: 'Vice-Principal (Academics - Secondary)',
    description: 'Secondary school post commanding internal termly examinations, continuous assessments (40%), and external examinations (WAEC WASSCE, NECO SSCE, BECE, Cambridge IGCSE, SAT, and JAMB UTME).',
    responsibilities: [
      'Generation of unified examination timetables & hall invigilation',
      'Strict WAEC, NECO, Cambridge IGCSE, SAT, and JAMB UTME candidate registration & CBT scheduling',
      'Examination security, vetting of question papers & marking guides',
      'Compilation of official school broadsheets, WAEC grade reports, and academic transcripts'
    ]
  },
  {
    id: 'ORG-06',
    title: 'Secondary Heads of Departments (HODs)',
    holderName: 'Sciences, Humanities, Languages, Commercial, Vocational',
    wing: 'Secondary Academic Wing',
    arm: 'secondary',
    reportsTo: 'Vice-Principal (Academics - Secondary)',
    description: 'Academic subject leaders presiding over secondary subject masters to ensure subject mastery and high pedagogical delivery.',
    responsibilities: [
      'HOD Sciences: Biology, Chemistry, Physics, AgriScience, F/Maths',
      'HOD Humanities: Civic, Government, Social Studies, CRS/IRS, History',
      'HOD Languages: English Language, Literature, French, Hausa',
      'HOD Commercial: Accounting, Commerce, Economics, Marketing',
      'HOD Vocational: ICT/Computer, Technical Drawing, Home Economics'
    ]
  },

  // ==================== CENTRAL ADMINISTRATIVE & OPERATIONS WING ====================
  {
    id: 'ORG-08',
    title: 'Registrar & Head of Institutional Legal Affairs',
    holderName: 'Barr. Samuel Adebayo (LL.B, B.L)',
    wing: 'Central Administrative Wing',
    arm: 'Central',
    reportsTo: 'General School Administrator / Executive Director',
    description: 'Directs institutional support operations, legal adherence, multi-arm student admissions registry, logistics, and child safeguarding policies across all arms.',
    responsibilities: [
      'Multi-arm staff recruitment pipeline, onboarding, and personnel welfare',
      'Institutional student admissions registry, certificates, and transfers',
      'Campus security, sanitation, health protocols & infrastructure'
    ]
  },
  {
    id: 'ORG-09',
    title: 'Central School Bursar (Chief Financial Officer)',
    holderName: 'Mr. Jude Msughter Tyav (ICAN)',
    wing: 'Central Administrative Wing',
    arm: 'Central',
    reportsTo: 'General School Administrator / Executive Director',
    description: 'Guardian of fiscal integrity, multi-arm fee collection, digital receipts, payroll processing, and financial reporting across Kindergarten, Primary, and Secondary wings.',
    responsibilities: [
      'Multi-arm school fee schedules and payment reconciliations',
      'Issuance of official BummptEducation digital fee receipts',
      'Vendor management, procurement audits, and annual balance sheets',
      'Clearance of students for termly examination cards across all arms'
    ]
  },
  {
    id: 'ORG-10',
    title: 'Student Leadership & Prefect Councils',
    holderName: 'Head Boy, Head Girl & Junior Assembly Prefects',
    wing: 'Student Leadership',
    arm: 'secondary',
    reportsTo: 'Principal (Secondary Sub-Head)',
    description: 'Democratic student leadership bodies representing pupils and students from Primary through Senior Secondary.',
    responsibilities: [
      'Secondary Head Boy & Head Girl: Overarching student representation',
      'Primary Head Boy & Head Girl: Primary assembly and peer leadership',
      'Library, Health, Sports & Labor Prefects: Campus decorum and wellness'
    ]
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ANN-000',
    title: 'Unified Institutional Directive: Multi-Arm Continuous Assessment Audit & Central Resumption',
    date: '2026-02-25',
    arm: 'All',
    category: 'Academic',
    content: 'The General School Administrator reminds all Sub-Heads (Early Childhood, Primary & Secondary) that mid-term Continuous Assessment scores must be validated centrally in the BummptEducation portal. All arms operate in synchronization.',
    targetAudience: 'All',
    isImportant: true
  },
  {
    id: 'ANN-001',
    title: 'Kindergarten & Early Years: Phonics Showcase & Sensory Garden Exhibition',
    date: '2026-02-24',
    arm: 'kindergarten',
    category: 'Early Years',
    content: 'Parents of KG 1, KG 2, and KG 3 pupils are warmly invited to the Early Years Phonics Recitation & Sensory Discovery Day on Thursday. Transition readiness for KG 3 entering Basic 1 will also be discussed.',
    targetAudience: 'Kindergarten Parents',
    isImportant: false
  },
  {
    id: 'ANN-002',
    title: 'Primary 6 National Common Entrance Examination (NCEE) Intensive Mock Camp',
    date: '2026-02-22',
    arm: 'primary',
    category: 'Examination',
    content: 'Basic 6 pupils will commence their intensive National Common Entrance and Junior Scholarship mock testing series on Monday. Quantitative and Verbal Reasoning clinics run daily from 2:00 PM to 4:00 PM.',
    targetAudience: 'Primary Parents',
    isImportant: true
  },
  {
    id: 'ANN-003',
    title: 'WAEC, NECO, Cambridge IGCSE, SAT & JAMB 2026 Candidate Biometric & CBT Registration',
    date: '2026-02-20',
    arm: 'secondary',
    category: 'Examination',
    content: 'SSS 3 candidates for WAEC WASSCE, NECO SSCE, Cambridge IGCSE, SAT and JAMB UTME must complete their biometric thumbprinting and subject validation at the Chief Examination Officer’s desk before Friday 27th February 2026.',
    targetAudience: 'Secondary Parents',
    isImportant: true
  },
  {
    id: 'ANN-004',
    title: 'Annual Inter-House Athletics Championship 2026 (All Arms Participating)',
    date: '2026-02-15',
    arm: 'All',
    category: 'Sports & Events',
    content: 'The 18th Annual Inter-House Sports Fiesta will feature pupils and students from Kindergarten, Primary, and Secondary. Eagle House (Blue), Falcon House (Red), Cheetah House (Green), and Lion House (Yellow) will compete.',
    targetAudience: 'All',
    isImportant: false
  }
];
