import { Announcement } from '../../types';

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

export const PORTAL_ANNOUNCEMENTS = INITIAL_ANNOUNCEMENTS;
