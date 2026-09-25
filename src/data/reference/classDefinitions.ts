/**
 * BummptEducation — Structural Class Reference Definitions
 *
 * AUTHORITATIVE REFERENCE DATA ONLY:
 * Contains the 21 standard academic class structures (KG 1 to SSS 3) with
 * structural attributes only (level, arm, class name, category, classroom block, capacity).
 *
 * ARCHITECTURAL INVARIANT:
 * Zero personal staff or operational form-master details may be stored here.
 * Operational staff and form-master assignments are strictly retrieved from PostgreSQL.
 */

import { ClassLevel, SchoolArm } from '../../types';

export interface ClassReferenceDefinition {
  level: ClassLevel;
  arm: SchoolArm;
  name: string;
  category: 'Kindergarten & Early Years' | 'Primary Basic Education' | 'Junior Secondary' | 'Senior Secondary';
  classroomBlock: string;
  capacity: number;
}

export const CLASS_REFERENCE_DEFINITIONS: ClassReferenceDefinition[] = [
  // Kindergarten Arm
  {
    level: 'KG 1',
    arm: 'kindergarten',
    name: 'Kindergarten 1 (Early Foundation • Age 2-3)',
    category: 'Kindergarten & Early Years',
    classroomBlock: 'Early Years Wing Block A - Room 1',
    capacity: 25,
  },
  {
    level: 'KG 2',
    arm: 'kindergarten',
    name: 'Kindergarten 2 (Montessori Discovery • Age 3-4)',
    category: 'Kindergarten & Early Years',
    classroomBlock: 'Early Years Wing Block A - Room 2',
    capacity: 25,
  },
  {
    level: 'KG 3',
    arm: 'kindergarten',
    name: 'Kindergarten 3 (Transition to Primary • Age 4-5)',
    category: 'Kindergarten & Early Years',
    classroomBlock: 'Early Years Wing Block A - Room 3',
    capacity: 25,
  },

  // Primary School Arm (Basic 1 - 6)
  {
    level: 'Basic 1',
    arm: 'primary',
    name: 'Basic 1 (Primary 1 Foundation Class)',
    category: 'Primary Basic Education',
    classroomBlock: 'Primary Block 1 - Ground Floor Room 101',
    capacity: 30,
  },
  {
    level: 'Basic 2',
    arm: 'primary',
    name: 'Basic 2 (Primary 2 Elementary Class)',
    category: 'Primary Basic Education',
    classroomBlock: 'Primary Block 1 - Ground Floor Room 102',
    capacity: 30,
  },
  {
    level: 'Basic 3',
    arm: 'primary',
    name: 'Basic 3 (Primary 3 Lower Primary Class)',
    category: 'Primary Basic Education',
    classroomBlock: 'Primary Block 1 - First Floor Room 201',
    capacity: 30,
  },
  {
    level: 'Basic 4',
    arm: 'primary',
    name: 'Basic 4 (Primary 4 Middle Primary Class)',
    category: 'Primary Basic Education',
    classroomBlock: 'Primary Block 2 - Ground Floor Room 103',
    capacity: 30,
  },
  {
    level: 'Basic 5',
    arm: 'primary',
    name: 'Basic 5 (Primary 5 Upper Primary Class)',
    category: 'Primary Basic Education',
    classroomBlock: 'Primary Block 2 - First Floor Room 202',
    capacity: 30,
  },
  {
    level: 'Basic 6',
    arm: 'primary',
    name: 'Basic 6 (Primary 6 Common Entrance Exam Class)',
    category: 'Primary Basic Education',
    classroomBlock: 'Primary Block 2 - First Floor Room 203 (Graduating Wing)',
    capacity: 30,
  },

  // Junior Secondary Arm (JSS 1 - 3)
  {
    level: 'JSS 1',
    arm: 'secondary',
    name: 'Junior Secondary School 1 (JSS 1 Freshers)',
    category: 'Junior Secondary',
    classroomBlock: 'College Wing - Junior Complex Block J1',
    capacity: 35,
  },
  {
    level: 'JSS 2',
    arm: 'secondary',
    name: 'Junior Secondary School 2 (JSS 2 Intermediate)',
    category: 'Junior Secondary',
    classroomBlock: 'College Wing - Junior Complex Block J2',
    capacity: 35,
  },
  {
    level: 'JSS 3',
    arm: 'secondary',
    name: 'Junior Secondary School 3 (BECE / Junior WAEC Class)',
    category: 'Junior Secondary',
    classroomBlock: 'College Wing - Junior Complex Block J3',
    capacity: 35,
  },

  // Senior Secondary 1
  {
    level: 'SSS 1 Science',
    arm: 'secondary',
    name: 'Senior Secondary 1 - Science Faculty',
    category: 'Senior Secondary',
    classroomBlock: 'Senior College Block - Science Wing Room S101',
    capacity: 35,
  },
  {
    level: 'SSS 1 Arts',
    arm: 'secondary',
    name: 'Senior Secondary 1 - Arts & Humanities',
    category: 'Senior Secondary',
    classroomBlock: 'Senior College Block - Arts Wing Room A101',
    capacity: 35,
  },
  {
    level: 'SSS 1 Commercial',
    arm: 'secondary',
    name: 'Senior Secondary 1 - Business & Commercial',
    category: 'Senior Secondary',
    classroomBlock: 'Senior College Block - Commercial Wing Room C101',
    capacity: 35,
  },

  // Senior Secondary 2
  {
    level: 'SSS 2 Science',
    arm: 'secondary',
    name: 'Senior Secondary 2 - Science Faculty',
    category: 'Senior Secondary',
    classroomBlock: 'Senior College Block - Science Wing Room S201',
    capacity: 35,
  },
  {
    level: 'SSS 2 Arts',
    arm: 'secondary',
    name: 'Senior Secondary 2 - Arts & Humanities',
    category: 'Senior Secondary',
    classroomBlock: 'Senior College Block - Arts Wing Room A201',
    capacity: 35,
  },
  {
    level: 'SSS 2 Commercial',
    arm: 'secondary',
    name: 'Senior Secondary 2 - Business & Commercial',
    category: 'Senior Secondary',
    classroomBlock: 'Senior College Block - Commercial Wing Room C201',
    capacity: 35,
  },

  // Senior Secondary 3
  {
    level: 'SSS 3 Science',
    arm: 'secondary',
    name: 'Senior Secondary 3 - Science (WAEC & NECO Candidates)',
    category: 'Senior Secondary',
    classroomBlock: 'Senior College Block - Finals Wing Room S301',
    capacity: 35,
  },
  {
    level: 'SSS 3 Arts',
    arm: 'secondary',
    name: 'Senior Secondary 3 - Arts (WAEC & NECO Candidates)',
    category: 'Senior Secondary',
    classroomBlock: 'Senior College Block - Finals Wing Room A301',
    capacity: 35,
  },
  {
    level: 'SSS 3 Commercial',
    arm: 'secondary',
    name: 'Senior Secondary 3 - Commercial (WAEC & NECO Candidates)',
    category: 'Senior Secondary',
    classroomBlock: 'Senior College Block - Finals Wing Room C301',
    capacity: 35,
  },
];
