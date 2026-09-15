import { Subject } from '../../types';

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

export const CURRICULUM_SUBJECTS = ALL_SUBJECTS;
