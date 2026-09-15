import { OrganogramNode } from '../../types';

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
