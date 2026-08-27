import { StandardGrade, PrimaryGrade, EarlyYearsMastery, SchoolArm, ClassLevel, getSchoolArm } from '../types';

// ==================== SECONDARY SCHOOL GRADING (WAEC / NECO / IGCSE / SAT) ====================
export function calculateGrade(totalScore: number): { grade: StandardGrade; remark: string; points: number; color: string } {
  if (totalScore >= 80) {
    return { grade: 'A1', remark: 'Excellent', points: 9, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
  } else if (totalScore >= 75) {
    return { grade: 'B2', remark: 'Very Good', points: 8, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  } else if (totalScore >= 70) {
    return { grade: 'B3', remark: 'Good', points: 7, color: 'text-blue-700 bg-blue-50 border-blue-200' };
  } else if (totalScore >= 65) {
    return { grade: 'C4', remark: 'Credit', points: 6, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
  } else if (totalScore >= 60) {
    return { grade: 'C5', remark: 'Credit', points: 5, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
  } else if (totalScore >= 50) {
    return { grade: 'C6', remark: 'Credit', points: 4, color: 'text-sky-700 bg-sky-50 border-sky-200' };
  } else if (totalScore >= 45) {
    return { grade: 'D7', remark: 'Pass', points: 3, color: 'text-amber-700 bg-amber-50 border-amber-200' };
  } else if (totalScore >= 40) {
    return { grade: 'E8', remark: 'Pass', points: 2, color: 'text-orange-700 bg-orange-50 border-orange-200' };
  } else {
    return { grade: 'F9', remark: 'Fail', points: 0, color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }
}

// ==================== PRIMARY SCHOOL GRADING (BASIC 1 - 6) ====================
export function calculatePrimaryGrade(totalScore: number): { grade: PrimaryGrade; remark: string; points: number; color: string } {
  if (totalScore >= 90) {
    return { grade: 'A+', remark: 'Distinction / Star Performer', points: 5, color: 'text-purple-700 bg-purple-50 border-purple-300' };
  } else if (totalScore >= 80) {
    return { grade: 'A', remark: 'Excellent', points: 5, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
  } else if (totalScore >= 70) {
    return { grade: 'B', remark: 'Very Good', points: 4, color: 'text-blue-700 bg-blue-50 border-blue-200' };
  } else if (totalScore >= 60) {
    return { grade: 'C', remark: 'Good / Credit', points: 3, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
  } else if (totalScore >= 50) {
    return { grade: 'D', remark: 'Fair / Pass', points: 2, color: 'text-amber-700 bg-amber-50 border-amber-200' };
  } else if (totalScore >= 40) {
    return { grade: 'E', remark: 'Weak Pass', points: 1, color: 'text-orange-700 bg-orange-50 border-orange-200' };
  } else {
    return { grade: 'F', remark: 'Needs Improvement', points: 0, color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }
}

// ==================== KINDERGARTEN / EARLY YEARS MASTERY RATING ====================
export function getEarlyYearsMasteryBadge(mastery: EarlyYearsMastery): { label: string; stars: number; color: string; description: string } {
  switch (mastery) {
    case 'Exceeding':
      return {
        label: 'Exceeding Expected Development (EX)',
        stars: 4,
        color: 'text-purple-700 bg-purple-100 border-purple-300',
        description: 'Demonstrates advanced mastery independently with high creativity.',
      };
    case 'Proficient':
      return {
        label: 'Proficient / Meeting Goals (P)',
        stars: 3,
        color: 'text-emerald-700 bg-emerald-100 border-emerald-300',
        description: 'Consistently demonstrates expected developmental milestones.',
      };
    case 'Developing':
      return {
        label: 'Developing / In Progress (D)',
        stars: 2,
        color: 'text-blue-700 bg-blue-100 border-blue-300',
        description: 'Shows good progress with gentle guidance and scaffolding.',
      };
    case 'Emerging':
    default:
      return {
        label: 'Emerging / Needs Encouragement (E)',
        stars: 1,
        color: 'text-amber-700 bg-amber-100 border-amber-300',
        description: 'Beginning to explore this developmental concept with teacher support.',
      };
  }
}

export function computeTotalCa(ca1: number, ca2: number, assignment: number, attendance: number): number {
  const clamp = (val: number, max: number) => Math.min(Math.max(0, val || 0), max);
  return clamp(ca1, 10) + clamp(ca2, 10) + clamp(assignment, 10) + clamp(attendance, 10);
}

export function computeTotalScore(totalCa: number, examScore: number): number {
  const clamp = (val: number, max: number) => Math.min(Math.max(0, val || 0), max);
  return Math.round((clamp(totalCa, 40) + clamp(examScore, 60)) * 10) / 10;
}

export function evaluatePromotionStatus(
  scores: { subjectId: string; totalScore: number; grade: StandardGrade | PrimaryGrade | string }[],
  classLevel: ClassLevel = 'SSS 2 Science'
): {
  status: 
    | 'Promoted to Next Class' 
    | 'Promoted on Trial' 
    | 'Resit Deficient Subjects' 
    | 'Repeat Class' 
    | 'Eligible for Finals (WAEC / NECO / IGCSE / SAT / JAMB)'
    | 'Eligible for NCEE & Common Entrance'
    | 'Ready for Primary Transition (Basic 1)';
  creditsCount: number;
  hasMathCredit: boolean;
  hasEngCredit: boolean;
  overallAverage: number;
  reason: string;
} {
  const arm = getSchoolArm(classLevel);
  const total = scores.reduce((acc, curr) => acc + (curr.totalScore || 0), 0);
  const average = scores.length > 0 ? total / scores.length : 0;

  if (arm === 'kindergarten') {
    if (classLevel === 'KG 3') {
      return {
        status: 'Ready for Primary Transition (Basic 1)',
        creditsCount: scores.length,
        hasMathCredit: true,
        hasEngCredit: true,
        overallAverage: Math.round(average * 10) / 10,
        reason: 'Successfully achieved Early Childhood Learning Milestones and demonstrates readiness for Basic 1.',
      };
    }
    return {
      status: 'Promoted to Next Class',
      creditsCount: scores.length,
      hasMathCredit: true,
      hasEngCredit: true,
      overallAverage: Math.round(average * 10) / 10,
      reason: 'Satisfactory completion of age-appropriate early learning goals and developmental milestones.',
    };
  }

  if (arm === 'primary') {
    const isPassing = (g: string) => ['A+', 'A', 'B', 'C', 'D'].includes(g);
    const passes = scores.filter((s) => isPassing(s.grade)).length;
    const mathScore = scores.find((s) => s.subjectId.includes('MAT') || s.subjectId.includes('NUM'));
    const engScore = scores.find((s) => s.subjectId.includes('ENG') || s.subjectId.includes('LIT'));

    const hasMathCredit = mathScore ? isPassing(mathScore.grade) : true;
    const hasEngCredit = engScore ? isPassing(engScore.grade) : true;

    if (classLevel === 'Basic 6') {
      return {
        status: 'Eligible for NCEE & Common Entrance',
        creditsCount: passes,
        hasMathCredit,
        hasEngCredit,
        overallAverage: Math.round(average * 10) / 10,
        reason: `Completed Universal Basic Education Primary curriculum with ${passes} passes and ${average.toFixed(1)}% average. Fully eligible for National Common Entrance and Junior Secondary enrollment.`,
      };
    }

    if (average >= 50 && hasMathCredit && hasEngCredit) {
      return {
        status: 'Promoted to Next Class',
        creditsCount: passes,
        hasMathCredit,
        hasEngCredit,
        overallAverage: Math.round(average * 10) / 10,
        reason: `Satisfactory academic performance with an overall average of ${average.toFixed(1)}%. Promoted to next primary class.`,
      };
    } else if (average >= 45) {
      return {
        status: 'Promoted on Trial',
        creditsCount: passes,
        hasMathCredit,
        hasEngCredit,
        overallAverage: Math.round(average * 10) / 10,
        reason: `Average of ${average.toFixed(1)}%. Promoted on trial with mandatory holiday literacy/numeracy support.`,
      };
    } else {
      return {
        status: 'Repeat Class',
        creditsCount: passes,
        hasMathCredit,
        hasEngCredit,
        overallAverage: Math.round(average * 10) / 10,
        reason: `Requires foundational reinforcement (${average.toFixed(1)}% average). Advised to repeat for academic solidity.`,
      };
    }
  }

  // Secondary Arm
  const isCredit = (g: string) => ['A1', 'B2', 'B3', 'C4', 'C5', 'C6'].includes(g);
  const credits = scores.filter((s) => isCredit(s.grade)).length;
  const mathScore = scores.find((s) => s.subjectId === 'SUB-MAT');
  const engScore = scores.find((s) => s.subjectId === 'SUB-ENG');

  const hasMathCredit = mathScore ? isCredit(mathScore.grade) : false;
  const hasEngCredit = engScore ? isCredit(engScore.grade) : false;

  if (classLevel === 'SSS 3 Science' || classLevel === 'SSS 3 Arts' || classLevel === 'SSS 3 Commercial') {
    return {
      status: 'Eligible for Finals (WAEC / NECO / IGCSE / SAT / JAMB)',
      creditsCount: credits,
      hasMathCredit,
      hasEngCredit,
      overallAverage: Math.round(average * 10) / 10,
      reason: `Eligible for WAEC WASSCE, NECO SSCE, Cambridge IGCSE, SAT, and JAMB UTME with ${credits} credits.`,
    };
  }

  let status: 'Promoted to Next Class' | 'Promoted on Trial' | 'Resit Deficient Subjects' | 'Repeat Class';
  let reason = '';

  if (credits >= 5 && hasMathCredit && hasEngCredit && average >= 50) {
    status = 'Promoted to Next Class';
    reason = `Passed with ${credits} credits (including Mathematics and English Language) and an average of ${average.toFixed(1)}%.`;
  } else if (credits >= 4 && (hasMathCredit || hasEngCredit) && average >= 48) {
    status = 'Promoted on Trial';
    reason = `Obtained ${credits} credits with average of ${average.toFixed(1)}%. Must show improvement next session.`;
  } else if (credits >= 3 && average >= 40) {
    status = 'Resit Deficient Subjects';
    reason = `Deficient in core requirements (${credits} credits). Candidate is eligible for holiday resit exams.`;
  } else {
    status = 'Repeat Class';
    reason = `Failed to achieve minimum benchmark (${credits} credits, average ${average.toFixed(1)}%). Advised to repeat for solid foundation.`;
  }

  return {
    status,
    creditsCount: credits,
    hasMathCredit,
    hasEngCredit,
    overallAverage: Math.round(average * 10) / 10,
    reason,
  };
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

