import { BenueLGA, SenatorialZone } from '../types';

export interface MinistryDirective {
  id: string;
  referenceNumber: string;
  title: string;
  category: 'Academic Calendar' | 'Examination Standards' | 'Teacher Deployment' | 'Financial Grant' | 'Security & Safety' | 'Curriculum & Textbooks';
  priority: 'Executive Order' | 'Urgent / High Priority' | 'Routine Circular' | 'Statutory Notice';
  targetAudience: 'Statewide (All 23 LGAs)' | 'Zone A (North-East)' | 'Zone B (North-West)' | 'Zone C (South)' | 'Specific LGA / Schools';
  targetLGA?: BenueLGA;
  targetSchoolName?: string;
  issuedBy: string;
  issuingOffice: string;
  issuedDate: string;
  effectiveDate: string;
  content: string;
  actionRequired: string;
  status: 'Broadcasted & Active' | 'Acknowledged by Principals' | 'Archived';
}

export const INITIAL_MINISTRY_DIRECTIVES: MinistryDirective[] = [
  {
    id: 'DIR-MOE-2026-001',
    referenceNumber: 'MOE/ST/ADM/CIR/2026/014',
    title: 'Harmonized Continuous Assessment (40%) & Terminal Examination (60%) Compliance Guideline',
    category: 'Examination Standards',
    priority: 'Executive Order',
    targetAudience: 'Statewide (All 23 LGAs)',
    issuedBy: 'Prof. Frederick Ikyaan',
    issuingOffice: 'Office of the Hon. Commissioner for Education, Science & Technology, Makurdi',
    issuedDate: '2026-01-15',
    effectiveDate: '2026-01-19',
    content: 'All Government Secondary Colleges, Science Academies, and SUBEB Basic Schools across all 23 Local Government Areas must strictly implement the 40% Continuous Assessment (comprising 2 Tests, Homework, and Class Attendance) and 60% Terminal Examination framework. No student shall sit for terminal exams without a vetted CA broadsheet registered with the Zonal Inspectorate.',
    actionRequired: 'Submit standardized broadsheets to the Zonal Chief Inspector by Week 11 of the term.',
    status: 'Broadcasted & Active'
  },
  {
    id: 'DIR-MOE-2026-002',
    referenceNumber: 'SUBEB/HQ/MKT/2026/088',
    title: 'Universal Basic Education (UBE) Free Instructional Materials & Home-Grown School Feeding Quality Protocol',
    category: 'Curriculum & Textbooks',
    priority: 'Urgent / High Priority',
    targetAudience: 'Statewide (All 23 LGAs)',
    issuedBy: 'Dr. (Mrs.) Grace Adagba',
    issuingOffice: 'Benue State Universal Basic Education Board (SUBEB) Headquarters, Makurdi',
    issuedDate: '2026-02-02',
    effectiveDate: '2026-02-05',
    content: 'Headteachers and LGEA Education Secretaries across the 23 Local Government Areas are instructed to verify inventory of newly distributed mathematics, science, and English textbooks. Collection of any unauthorized levy for learning aids is strictly prohibited under executive penalty.',
    actionRequired: 'LGEA Education Secretaries to submit weekly verification logs to SUBEB Headquarters.',
    status: 'Broadcasted & Active'
  },
  {
    id: 'DIR-MOE-2026-003',
    referenceNumber: 'MOE/FIN/SUBV/2026/032',
    title: 'Disbursement of 2nd Term STEM Laboratory Consumables & Practical Reagents Subventions',
    category: 'Financial Grant',
    priority: 'Statutory Notice',
    targetAudience: 'Zone B (North-West)',
    issuedBy: 'Barr. Terlumun Iorfa',
    issuingOffice: 'Directorate of Finance & Accounts, Ministry of Education Secretariat',
    issuedDate: '2026-02-10',
    effectiveDate: '2026-02-12',
    content: 'Approval is hereby granted for the release of laboratory consumables and practical reagents grants to designated Senior Science Secondary Colleges in Makurdi, Gboko, Gwer West, Gwer East, and Buruku LGAs ahead of WAEC/NECO practical mock sessions.',
    actionRequired: 'College Principals and Bursars to sign clearance certificates upon receipt.',
    status: 'Broadcasted & Active'
  },
  {
    id: 'DIR-MOE-2026-004',
    referenceNumber: 'MOE/QA/TRCN/2026/059',
    title: 'Mandatory TRCN Licensure Verification and Subject Deficit Re-Deployment Exercise',
    category: 'Teacher Deployment',
    priority: 'Urgent / High Priority',
    targetAudience: 'Statewide (All 23 LGAs)',
    issuedBy: 'Dr. Simon Tor-Anyiin',
    issuingOffice: 'Department of Quality Assurance & Teacher Standards, Makurdi',
    issuedDate: '2026-02-18',
    effectiveDate: '2026-02-23',
    content: 'A statewide review of secondary school teaching staff has commenced. Schools with deficit postings in Physics, Chemistry, Further Mathematics, and Technical Drawing will receive expedited postings from the Benue State Teaching Service Board (TSB).',
    actionRequired: 'Principals with subject deficits must lodge deployment requests via the State Command Headquarters.',
    status: 'Broadcasted & Active'
  }
];

const STORAGE_KEY_DIRECTIVES = 'benue_state_moe_directives_v1';

export function getStoredDirectives(): MinistryDirective[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DIRECTIVES);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load directives from storage', e);
  }
  return INITIAL_MINISTRY_DIRECTIVES;
}

export function saveStoredDirectives(directives: MinistryDirective[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DIRECTIVES, JSON.stringify(directives));
  } catch (e) {
    console.error('Failed to save directives to storage', e);
  }
}
