/**
 * BummptEducation — Academic Result & Broadsheet Repository
 * 
 * Provides server-authoritative compilation of student term results,
 * subject-level 40/60 score aggregation, class broadsheet matrices,
 * positions, averages, and multi-tenant isolation.
 */

import type { PoolClient } from 'pg';
import { query } from '../client';
import { calculateGrade, calculatePrimaryGrade } from '../../utils/grading';

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
  classAverage?: number;
  subjectPosition?: number;
}

export interface StudentResultCard {
  student: {
    id: string;
    admissionNumber: string;
    fullName: string;
    gender: string;
    schoolId: string;
    schoolName?: string;
    className: string;
    classLevel: string;
    classArm: string;
  };
  term: {
    id: string;
    name: string;
    sessionName?: string;
  };
  subjects: SubjectResult[];
  summary: {
    totalSubjects: number;
    totalScoreObtained: number;
    totalPossibleScore: number;
    averageScore: number;
    classPosition?: number;
    totalStudentsInClass: number;
    bestSubject?: string;
    weakestSubject?: string;
  };
}

export interface BroadsheetStudentRow {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  gender: string;
  scores: Record<string, {
    caScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
  }>;
  totalScore: number;
  averageScore: number;
  position: number;
}

export interface ClassBroadsheet {
  class: {
    id: string;
    name: string;
    level: string;
    arm: string;
    schoolId: string;
    schoolName?: string;
  };
  term: {
    id: string;
    name: string;
    sessionName?: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  students: BroadsheetStudentRow[];
  analytics: {
    totalEnrolled: number;
    classMeanAverage: number;
    highestAverage: number;
    lowestAverage: number;
    passRatePercentage: number;
  };
}

export class AcademicResultRepository {
  /**
   * Retrieves comprehensive term results for a specific student.
   */
  async getStudentTermResult(
    schoolId: string,
    studentId: string,
    termId: string,
    client?: PoolClient
  ): Promise<StudentResultCard> {
    // 1. Fetch student info and class info
    const studentRes = await query<{
      id: string;
      admission_number: string;
      full_name: string;
      gender: string;
      school_id: string;
      school_name: string;
      class_id: string;
      class_name: string;
      class_level: string;
      class_arm: string;
    }>(
      `SELECT 
        s.id,
        s.admission_number,
        s.full_name,
        s.gender,
        s.school_id,
        sch.name AS school_name,
        s.current_class_id AS class_id,
        c.name AS class_name,
        c.level AS class_level,
        c.arm AS class_arm
      FROM students s
      JOIN schools sch ON s.school_id = sch.id
      JOIN classes c ON s.current_class_id = c.id
      WHERE s.id = $1 AND s.school_id = $2
      LIMIT 1;`,
      [studentId, schoolId],
      client
    );

    const student = studentRes.rows[0];
    if (!student) {
      throw new Error('STUDENT_NOT_FOUND: Student record not found for this school tenant.');
    }

    // 2. Fetch term info
    const termRes = await query<{ id: string; name: string; session_name: string }>(
      `SELECT t.id, t.term_name AS name, ses.session_name AS session_name
       FROM academic_terms t
       LEFT JOIN academic_sessions ses ON t.session_id = ses.id
       WHERE t.id = $1 LIMIT 1;`,
      [termId],
      client
    );
    const term = termRes.rows[0];
    if (!term) {
      throw new Error('TERM_NOT_FOUND: Academic term not found.');
    }

    // 3. Fetch all subjects allocated to or assessed in the class
    const subjectsRes = await query<{
      id: string;
      name: string;
      code: string;
    }>(
      `SELECT DISTINCT sub.id, sub.name, sub.code
       FROM subjects sub
       WHERE sub.id IN (
         SELECT subject_id FROM class_subject_allocations WHERE class_id = $1 AND (academic_term_id = $2 OR academic_term_id IS NULL)
         UNION
         SELECT subject_id FROM continuous_assessments WHERE class_id = $1 AND academic_term_id = $2
         UNION
         SELECT subject_id FROM terminal_examinations WHERE class_id = $1 AND academic_term_id = $2
       )
       ORDER BY sub.name ASC;`,
      [student.class_id, termId],
      client
    );

    // 4. Fetch student CA scores grouped by subject
    const caRes = await query<{
      subject_id: string;
      total_ca: string;
    }>(
      `SELECT subject_id, COALESCE(SUM(score), 0) AS total_ca
       FROM continuous_assessments
       WHERE student_id = $1 AND academic_term_id = $2
       GROUP BY subject_id;`,
      [studentId, termId],
      client
    );
    const caMap = new Map<string, number>();
    for (const r of caRes.rows) {
      caMap.set(r.subject_id, Number(r.total_ca));
    }

    // 5. Fetch student exam scores by subject
    const examRes = await query<{
      subject_id: string;
      score: string;
    }>(
      `SELECT subject_id, score
       FROM terminal_examinations
       WHERE student_id = $1 AND academic_term_id = $2;`,
      [studentId, termId],
      client
    );
    const examMap = new Map<string, number>();
    for (const r of examRes.rows) {
      examMap.set(r.subject_id, Number(r.score));
    }

    const isPrimary = student.class_arm === 'primary' || student.class_arm === 'kindergarten';
    const subjectResults: SubjectResult[] = [];
    let totalScoreObtained = 0;

    for (const sub of subjectsRes.rows) {
      const ca = Number((caMap.get(sub.id) ?? 0).toFixed(2));
      const exam = Number((examMap.get(sub.id) ?? 0).toFixed(2));
      const total = Number((ca + exam).toFixed(2));

      // Skip subjects where student has no records at all unless allocated
      if (ca === 0 && exam === 0 && !caMap.has(sub.id) && !examMap.has(sub.id)) {
        continue;
      }

      const gradeInfo = isPrimary ? calculatePrimaryGrade(total) : calculateGrade(total);
      totalScoreObtained += total;

      subjectResults.push({
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        caScore: ca,
        examScore: exam,
        totalScore: total,
        grade: gradeInfo.grade,
        remark: gradeInfo.remark,
      });
    }

    // Sort subjects by best performance
    subjectResults.sort((a, b) => b.totalScore - a.totalScore);

    const totalSubjects = subjectResults.length;
    const totalPossible = totalSubjects * 100;
    const averageScore = totalSubjects > 0 ? Number((totalScoreObtained / totalSubjects).toFixed(2)) : 0;

    // 6. Get class ranking
    const broadsheet = await this.getClassBroadsheet(schoolId, student.class_id, termId, client);
    const studentRow = broadsheet.students.find((s) => s.studentId === studentId);
    const classPosition = studentRow?.position;

    return {
      student: {
        id: student.id,
        admissionNumber: student.admission_number,
        fullName: student.full_name,
        gender: student.gender,
        schoolId: student.school_id,
        schoolName: student.school_name,
        className: student.class_name,
        classLevel: student.class_level,
        classArm: student.class_arm,
      },
      term: {
        id: term.id,
        name: term.name,
        sessionName: term.session_name,
      },
      subjects: subjectResults,
      summary: {
        totalSubjects,
        totalScoreObtained,
        totalPossibleScore: totalPossible,
        averageScore,
        classPosition,
        totalStudentsInClass: broadsheet.students.length,
        bestSubject: subjectResults[0]?.subjectName,
        weakestSubject: subjectResults[subjectResults.length - 1]?.subjectName,
      },
    };
  }

  /**
   * Compiles the full class broadsheet matrix for a given class and term.
   */
  async getClassBroadsheet(
    schoolId: string,
    classId: string,
    termId: string,
    client?: PoolClient
  ): Promise<ClassBroadsheet> {
    // 1. Verify class belongs to school
    const classRes = await query<{
      id: string;
      name: string;
      level: string;
      arm: string;
      school_id: string;
      school_name: string;
    }>(
      `SELECT c.id, c.name, c.level, c.arm, c.school_id, sch.name AS school_name
       FROM classes c
       JOIN schools sch ON c.school_id = sch.id
       WHERE c.id = $1 AND c.school_id = $2
       LIMIT 1;`,
      [classId, schoolId],
      client
    );
    const cls = classRes.rows[0];
    if (!cls) {
      throw new Error('CLASS_NOT_FOUND: Class record not found for this school tenant.');
    }

    // 2. Fetch term info
    const termRes = await query<{ id: string; name: string; session_name: string }>(
      `SELECT t.id, t.term_name AS name, ses.session_name AS session_name
       FROM academic_terms t
       LEFT JOIN academic_sessions ses ON t.session_id = ses.id
       WHERE t.id = $1 LIMIT 1;`,
      [termId],
      client
    );
    const term = termRes.rows[0];
    if (!term) {
      throw new Error('TERM_NOT_FOUND: Academic term not found.');
    }

    // 3. Fetch all students in the class
    const studentsRes = await query<{
      id: string;
      admission_number: string;
      full_name: string;
      gender: string;
    }>(
      `SELECT id, admission_number, full_name, gender
       FROM students
       WHERE current_class_id = $1 AND school_id = $2
       ORDER BY full_name ASC;`,
      [classId, schoolId],
      client
    );

    // 4. Fetch all subjects associated with the class
    const subjectsRes = await query<{
      id: string;
      name: string;
      code: string;
    }>(
      `SELECT DISTINCT sub.id, sub.name, sub.code
       FROM subjects sub
       WHERE sub.id IN (
         SELECT subject_id FROM class_subject_allocations WHERE class_id = $1 AND (academic_term_id = $2 OR academic_term_id IS NULL)
         UNION
         SELECT subject_id FROM continuous_assessments WHERE class_id = $1 AND academic_term_id = $2
         UNION
         SELECT subject_id FROM terminal_examinations WHERE class_id = $1 AND academic_term_id = $2
       )
       ORDER BY sub.name ASC;`,
      [classId, termId],
      client
    );
    const subjects = subjectsRes.rows;

    // 5. Fetch all CA scores in the class for this term
    const allCaRes = await query<{
      student_id: string;
      subject_id: string;
      ca_total: string;
    }>(
      `SELECT student_id, subject_id, COALESCE(SUM(score), 0) AS ca_total
       FROM continuous_assessments
       WHERE class_id = $1 AND academic_term_id = $2
       GROUP BY student_id, subject_id;`,
      [classId, termId],
      client
    );
    const caLookup = new Map<string, number>();
    for (const r of allCaRes.rows) {
      caLookup.set(`${r.student_id}:${r.subject_id}`, Number(r.ca_total));
    }

    // 6. Fetch all Exam scores in the class for this term
    const allExamRes = await query<{
      student_id: string;
      subject_id: string;
      score: string;
    }>(
      `SELECT student_id, subject_id, score
       FROM terminal_examinations
       WHERE class_id = $1 AND academic_term_id = $2;`,
      [classId, termId],
      client
    );
    const examLookup = new Map<string, number>();
    for (const r of allExamRes.rows) {
      examLookup.set(`${r.student_id}:${r.subject_id}`, Number(r.score));
    }

    const isPrimary = cls.arm === 'primary' || cls.arm === 'kindergarten';

    // 7. Compile each student's row in the broadsheet
    const studentRows: BroadsheetStudentRow[] = [];

    for (const stu of studentsRes.rows) {
      const scoresRecord: BroadsheetStudentRow['scores'] = {};
      let totalScore = 0;
      let assessedSubjectCount = 0;

      for (const sub of subjects) {
        const ca = caLookup.get(`${stu.id}:${sub.id}`) ?? 0;
        const exam = examLookup.get(`${stu.id}:${sub.id}`) ?? 0;
        const tot = Number((ca + exam).toFixed(2));

        const gradeInfo = isPrimary ? calculatePrimaryGrade(tot) : calculateGrade(tot);

        scoresRecord[sub.id] = {
          caScore: ca,
          examScore: exam,
          totalScore: tot,
          grade: (ca > 0 || exam > 0) ? gradeInfo.grade : '-',
        };

        if (ca > 0 || exam > 0) {
          totalScore += tot;
          assessedSubjectCount += 1;
        }
      }

      const averageScore = assessedSubjectCount > 0 
        ? Number((totalScore / assessedSubjectCount).toFixed(2)) 
        : 0;

      studentRows.push({
        studentId: stu.id,
        admissionNumber: stu.admission_number,
        studentName: stu.full_name,
        gender: stu.gender,
        scores: scoresRecord,
        totalScore: Number(totalScore.toFixed(2)),
        averageScore,
        position: 0, // Assigned below
      });
    }

    // 8. Rank students based on totalScore / averageScore descending
    studentRows.sort((a, b) => b.totalScore - a.totalScore);
    studentRows.forEach((row, index) => {
      row.position = index + 1;
    });

    // 9. Class Analytics
    const averages = studentRows.map((s) => s.averageScore).filter((avg) => avg > 0);
    const classMeanAverage = averages.length > 0
      ? Number((averages.reduce((acc, v) => acc + v, 0) / averages.length).toFixed(2))
      : 0;
    const highestAverage = averages.length > 0 ? Math.max(...averages) : 0;
    const lowestAverage = averages.length > 0 ? Math.min(...averages) : 0;
    const passingStudents = studentRows.filter((s) => s.averageScore >= 50).length;
    const passRatePercentage = studentRows.length > 0
      ? Number(((passingStudents / studentRows.length) * 100).toFixed(1))
      : 0;

    return {
      class: {
        id: cls.id,
        name: cls.name,
        level: cls.level,
        arm: cls.arm,
        schoolId: cls.school_id,
        schoolName: cls.school_name,
      },
      term: {
        id: term.id,
        name: term.name,
        sessionName: term.session_name,
      },
      subjects: subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
      students: studentRows,
      analytics: {
        totalEnrolled: studentRows.length,
        classMeanAverage,
        highestAverage,
        lowestAverage,
        passRatePercentage,
      },
    };
  }
}

export const academicResultRepository = new AcademicResultRepository();
