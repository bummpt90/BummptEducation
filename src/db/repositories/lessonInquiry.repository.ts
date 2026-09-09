/**
 * BummptEducation — Lesson Inquiry & Feedback Repository
 * 
 * Provides server-authoritative persistence for parent consultations,
 * teacher feedback, questions, and pedagogical resolution backed by PostgreSQL.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { query } from '../client';
import type { LessonInquiryDbEntity, QueryOptions, PaginatedResult } from '../types';

export class LessonInquiryRepository extends BaseRepository<LessonInquiryDbEntity> {
  protected readonly tableName = 'lesson_inquiries';
  protected readonly primaryKey = 'id';
  protected readonly tenantColumn = 'school_id';
  protected readonly isMultiTenant = true;

  /**
   * Submit a new parent inquiry regarding a specific lesson note.
   */
  async createInquiry(
    data: {
      schoolId?: string;
      organizationId?: string;
      lessonNoteId: string;
      studentId?: string | null;
      studentName?: string | null;
      parentId?: string | null;
      parentName: string;
      guardianPhone?: string | null;
      question: string;
    },
    client?: PoolClient
  ): Promise<LessonInquiryDbEntity> {
    // Resolve school_id and organization_id from the lesson_note if not passed
    let schoolId = data.schoolId;
    let orgId = data.organizationId;

    if (!schoolId || !orgId) {
      const noteRes = await query<{ school_id: string; organization_id: string }>(
        'SELECT school_id, organization_id FROM lesson_notes WHERE id = $1 LIMIT 1;',
        [data.lessonNoteId],
        client
      );
      if (!noteRes.rows[0]) {
        throw new Error('LESSON_NOTE_NOT_FOUND: Referenced lesson note does not exist.');
      }
      schoolId = schoolId || noteRes.rows[0].school_id;
      orgId = orgId || noteRes.rows[0].organization_id;
    }

    const sql = `
      INSERT INTO lesson_inquiries (
        organization_id,
        school_id,
        lesson_note_id,
        student_id,
        student_name,
        parent_id,
        parent_name,
        guardian_phone,
        question,
        teacher_reply,
        reply,
        status,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, NULL, 'Pending', NOW(), NOW()
      )
      RETURNING *;
    `;

    const params = [
      orgId || null,
      schoolId,
      data.lessonNoteId,
      data.studentId || null,
      data.studentName || null,
      data.parentId || null,
      data.parentName,
      data.guardianPhone || null,
      data.question,
    ];

    const res = await query<LessonInquiryDbEntity>(sql, params, client);
    return res.rows[0];
  }

  /**
   * Fetch a single inquiry by ID with optional tenant restriction.
   */
  async getInquiryById(
    id: string,
    schoolId?: string,
    client?: PoolClient
  ): Promise<LessonInquiryDbEntity | null> {
    const conditions = ['li.id = $1'];
    const params: any[] = [id];

    if (schoolId) {
      params.push(schoolId);
      conditions.push(`li.school_id = $${params.length}`);
    }

    const sql = `
      SELECT 
        li.*,
        COALESCE(li.teacher_reply, li.reply) as reply,
        ln.title as lesson_title,
        ln.topic as lesson_topic,
        sch.name as school_name
      FROM lesson_inquiries li
      LEFT JOIN lesson_notes ln ON ln.id = li.lesson_note_id
      LEFT JOIN schools sch ON sch.id = li.school_id
      WHERE ${conditions.join(' AND ')}
      LIMIT 1;
    `;

    const res = await query<LessonInquiryDbEntity>(sql, params, client);
    return res.rows[0] || null;
  }

  /**
   * Retrieve all inquiries/feedbacks submitted for a specific lesson note.
   * Supports optional parentId/studentIds filter to guarantee parent/student isolation.
   */
  async listInquiriesForNote(
    lessonNoteId: string,
    schoolId?: string,
    filters?: {
      parentId?: string;
      studentIds?: string[];
      studentId?: string;
    },
    client?: PoolClient
  ): Promise<LessonInquiryDbEntity[]> {
    const conditions = ['li.lesson_note_id = $1'];
    const params: any[] = [lessonNoteId];

    if (schoolId) {
      params.push(schoolId);
      conditions.push(`li.school_id = $${params.length}`);
    }

    if (filters?.parentId && filters?.studentIds && filters.studentIds.length > 0) {
      params.push(filters.parentId);
      const parentParamIdx = params.length;
      params.push(filters.studentIds);
      const studentArrIdx = params.length;
      conditions.push(`(li.parent_id = $${parentParamIdx} OR li.student_id = ANY($${studentArrIdx}))`);
    } else if (filters?.parentId) {
      params.push(filters.parentId);
      conditions.push(`li.parent_id = $${params.length}`);
    } else if (filters?.studentId) {
      params.push(filters.studentId);
      conditions.push(`li.student_id = $${params.length}`);
    } else if (filters?.studentIds && filters.studentIds.length > 0) {
      params.push(filters.studentIds);
      conditions.push(`li.student_id = ANY($${params.length})`);
    }

    const sql = `
      SELECT 
        li.*,
        COALESCE(li.teacher_reply, li.reply) as reply,
        ln.title as lesson_title,
        ln.topic as lesson_topic
      FROM lesson_inquiries li
      LEFT JOIN lesson_notes ln ON ln.id = li.lesson_note_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY li.created_at DESC;
    `;

    const res = await query<LessonInquiryDbEntity>(sql, params, client);
    return res.rows;
  }

  /**
   * Retrieve all inquiries submitted across a school with filtering and pagination.
   */
  async listInquiriesForSchool(
    schoolId: string,
    filters: {
      status?: string;
      staffId?: string;
      studentId?: string;
      limit?: number;
      offset?: number;
    } = {},
    client?: PoolClient
  ): Promise<PaginatedResult<LessonInquiryDbEntity>> {
    const conditions = ['li.school_id = $1'];
    const params: any[] = [schoolId];

    if (filters.status && filters.status !== 'all') {
      params.push(filters.status);
      conditions.push(`li.status = $${params.length}`);
    }

    if (filters.staffId) {
      params.push(filters.staffId);
      conditions.push(`li.replied_by_staff_id = $${params.length}`);
    }

    if (filters.studentId) {
      params.push(filters.studentId);
      conditions.push(`li.student_id = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countSql = `SELECT COUNT(*)::int as total FROM lesson_inquiries li ${whereClause};`;
    const countRes = await query<{ total: number }>(countSql, params, client);
    const total = countRes.rows[0]?.total || 0;

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const dataSql = `
      SELECT 
        li.*,
        COALESCE(li.teacher_reply, li.reply) as reply,
        ln.title as lesson_title,
        ln.topic as lesson_topic,
        sch.name as school_name
      FROM lesson_inquiries li
      LEFT JOIN lesson_notes ln ON ln.id = li.lesson_note_id
      LEFT JOIN schools sch ON sch.id = li.school_id
      ${whereClause}
      ORDER BY li.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const dataRes = await query<LessonInquiryDbEntity>(dataSql, params, client);

    return {
      data: dataRes.rows,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Answer / reply to an inquiry with teacher credentials.
   */
  async respondToInquiry(
    id: string,
    schoolId: string,
    response: {
      reply: string;
      repliedByStaffId?: string | null;
      repliedByUserId?: string | null;
      repliedByName?: string | null;
      status?: 'Answered' | 'Closed';
    },
    client?: PoolClient
  ): Promise<LessonInquiryDbEntity | null> {
    const sql = `
      UPDATE lesson_inquiries
      SET 
        teacher_reply = $1,
        reply = $1,
        replied_by_staff_id = $2,
        replied_by_user_id = $3,
        replied_by_name = $4,
        status = $5,
        replied_at = NOW(),
        updated_at = NOW()
      WHERE id = $6 AND school_id = $7
      RETURNING *;
    `;

    const params = [
      response.reply,
      response.repliedByStaffId || null,
      response.repliedByUserId || null,
      response.repliedByName || null,
      response.status || 'Answered',
      id,
      schoolId,
    ];

    const res = await query<LessonInquiryDbEntity>(sql, params, client);
    return res.rows[0] || null;
  }

  /**
   * Update inquiry status directly.
   */
  async updateInquiryStatus(
    id: string,
    schoolId: string,
    status: 'Pending' | 'Answered' | 'Closed',
    client?: PoolClient
  ): Promise<LessonInquiryDbEntity | null> {
    const sql = `
      UPDATE lesson_inquiries
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND school_id = $3
      RETURNING *;
    `;
    const res = await query<LessonInquiryDbEntity>(sql, [status, id, schoolId], client);
    return res.rows[0] || null;
  }

  // Convenient Repository API Aliases
  async create(data: any): Promise<LessonInquiryDbEntity> {
    return this.createInquiry({
      schoolId: data.schoolId || data.school_id,
      organizationId: data.organizationId || data.organization_id,
      lessonNoteId: data.lessonNoteId || data.lesson_note_id,
      studentId: data.studentId || data.student_id,
      studentName: data.studentName || data.student_name,
      parentId: data.parentId || data.parent_id,
      parentName: data.parentName || data.parent_name,
      guardianPhone: data.guardianPhone || data.guardian_phone,
      question: data.question,
    });
  }

  async listByNoteId(noteId: string, schoolId?: string): Promise<LessonInquiryDbEntity[]> {
    return this.listInquiriesForNote(noteId, schoolId);
  }

  async reply(
    inquiryId: string,
    replyText: string,
    repliedByUserId?: string,
    repliedByName?: string,
    schoolId?: string
  ): Promise<LessonInquiryDbEntity | null> {
    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
      const inq = await this.getInquiryById(inquiryId);
      if (!inq) return null;
      targetSchoolId = inq.school_id;
    }
    return this.respondToInquiry(inquiryId, targetSchoolId, {
      reply: replyText,
      repliedByUserId,
      repliedByName,
      status: 'Answered',
    });
  }
}

export const lessonInquiryRepository = new LessonInquiryRepository();
