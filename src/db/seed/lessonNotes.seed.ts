/**
 * BummptEducation — Lesson Notes & Inquiries Seeder (Phase 8D)
 * 
 * Populates PostgreSQL with foundational lesson notes, curriculum modules,
 * and parent inquiries/feedback for development and automated testing.
 */

import type { PoolClient } from 'pg';
import { query, withTransaction } from '../index';
import { INITIAL_LESSON_NOTES, INITIAL_LESSON_FEEDBACKS } from '../../data/lessonNotesData';

export interface LessonNotesSeedReport {
  notesInserted: number;
  feedbacksInserted: number;
  schoolId: string;
}

export async function seedLessonNotesFoundation(externalClient?: PoolClient): Promise<LessonNotesSeedReport> {
  const runner = async (client: PoolClient): Promise<LessonNotesSeedReport> => {
    // 1. Resolve Primary School & Org
    const schoolRes = await client.query<{ id: string; organization_id: string }>(
      'SELECT id, organization_id FROM schools ORDER BY code ASC LIMIT 1;'
    );
    const school = schoolRes.rows[0];
    if (!school) {
      throw new Error('No school available for seeding lesson notes.');
    }

    // 2. Resolve Active Session & Term
    const termRes = await client.query<{ id: string; session_id: string; term_name: string }>(
      'SELECT id, session_id, term_name FROM academic_terms ORDER BY is_current DESC LIMIT 1;'
    );
    const term = termRes.rows[0];

    // 3. Resolve a Staff member
    const staffRes = await client.query<{ id: string; full_name: string }>(
      'SELECT id, full_name FROM staff WHERE school_id = $1 LIMIT 1;',
      [school.id]
    );
    const defaultStaff = staffRes.rows[0];

    let notesInserted = 0;
    const noteIdMapping: Record<string, string> = {};

    for (const note of INITIAL_LESSON_NOTES) {
      // Find matching class
      const classRes = await client.query<{ id: string }>(
        'SELECT id FROM classes WHERE (level ILIKE $1 OR name ILIKE $1) AND school_id = $2 LIMIT 1;',
        [note.classLevel, school.id]
      );
      const classId = classRes.rows[0]?.id || null;

      // Find matching subject
      const subRes = await client.query<{ id: string }>(
        'SELECT id FROM subjects WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 1;',
        [note.subjectName]
      );
      const subjectId = subRes.rows[0]?.id || null;

      const insertRes = await client.query<{ id: string }>(
        `INSERT INTO lesson_notes (
          organization_id, school_id, teacher_id, teacher_name, class_id, class_level, arm,
          subject_id, subject_name, academic_session_id, academic_term_id, term_id, term,
          academic_year, week_number, title, topic, sub_topics, learning_objectives,
          instructional_materials, content_summary, content_body, evaluation_questions,
          key_terms, pdf_file_name, pdf_file_size, pdf_url, download_count, status,
          uploaded_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW(), NOW(), NOW()
        )
        RETURNING id;`,
        [
          school.organization_id,
          school.id,
          defaultStaff?.id || null,
          note.teacherName,
          classId,
          note.classLevel,
          note.arm,
          subjectId,
          note.subjectName,
          term?.session_id || null,
          term?.id || null,
          term?.id || null,
          note.term || '1st Term',
          note.academicYear || '2024/2025',
          note.weekNumber,
          note.title,
          note.topic,
          note.subTopics || [],
          note.learningObjectives || [],
          note.instructionalMaterials || [],
          note.contentSummary,
          note.contentBody,
          note.evaluationQuestions || [],
          note.keyTerms || [],
          note.pdfFileName || null,
          note.pdfFileSize || null,
          note.pdfUrl || null,
          note.downloadCount || 0,
          note.status || 'Published',
        ]
      );

      const realNoteId = insertRes.rows[0].id;
      noteIdMapping[note.id] = realNoteId;
      notesInserted++;
    }

    // Seed Feedbacks
    let feedbacksInserted = 0;
    for (const fb of INITIAL_LESSON_FEEDBACKS) {
      const realNoteId = noteIdMapping[fb.lessonNoteId];
      if (realNoteId) {
        await client.query(
          `INSERT INTO lesson_inquiries (
            organization_id, school_id, lesson_note_id, parent_name, student_name,
            guardian_phone, question, teacher_reply, reply, replied_by_name, status,
            created_at, updated_at, replied_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, NOW(), NOW(), NOW());`,
          [
            school.organization_id,
            school.id,
            realNoteId,
            fb.parentName,
            fb.studentName,
            fb.guardianPhone || null,
            fb.question,
            fb.reply || null,
            fb.repliedBy || null,
            fb.status || 'Answered',
          ]
        );
        feedbacksInserted++;
      }
    }

    return {
      notesInserted,
      feedbacksInserted,
      schoolId: school.id,
    };
  };

  if (externalClient) {
    return runner(externalClient);
  } else {
    return withTransaction(runner);
  }
}
