/**
 * BummptEducation — Lesson Note Repository
 * 
 * Provides server-authoritative persistence and query capabilities for
 * curriculum modules, lesson notes, syllabus coverage, and atomic download metrics
 * backed by PostgreSQL.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { query, withTransaction } from '../client';
import type { LessonNoteDbEntity, LessonNotesStats, QueryOptions, PaginatedResult } from '../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeNoteStatus(status?: string): 'Published' | 'Draft' | 'Archived' {
  if (!status) return 'Published';
  const lower = status.toLowerCase();
  if (lower === 'draft') return 'Draft';
  if (lower === 'archived') return 'Archived';
  return 'Published';
}

export interface LessonNoteFilterOptions {
  schoolId?: string;
  arm?: string;
  classLevel?: string;
  classId?: string;
  subjectId?: string;
  subjectName?: string;
  termId?: string;
  term?: string;
  weekNumber?: number;
  status?: string;
  search?: string;
}

export class LessonNoteRepository extends BaseRepository<LessonNoteDbEntity> {
  protected readonly tableName = 'lesson_notes';
  protected readonly primaryKey = 'id';
  protected readonly tenantColumn = 'school_id';
  protected readonly isMultiTenant = true;

  /**
   * Resolves default or fallback school ID if not provided.
   */
  async resolveDefaultSchoolId(client?: PoolClient): Promise<{ schoolId: string; orgId: string }> {
    const res = await query<{ id: string; organization_id: string }>(
      'SELECT id, organization_id FROM schools ORDER BY code ASC LIMIT 1;',
      [],
      client
    );
    if (!res.rows[0]) {
      throw new Error('NO_SCHOOL_AVAILABLE: No active school registered in the database.');
    }
    return { schoolId: res.rows[0].id, orgId: res.rows[0].organization_id };
  }

  /**
   * Create a new authoritative lesson note in PostgreSQL.
   */
  async createLessonNote(
    data: {
      schoolId?: string;
      organizationId?: string;
      teacherId?: string | null;
      teacherName: string;
      classId?: string | null;
      classLevel: string;
      arm: string;
      subjectId?: string | null;
      subjectName: string;
      academicSessionId?: string | null;
      academicTermId?: string | null;
      termId?: string | null;
      term?: string;
      academicYear?: string;
      weekNumber: number;
      title: string;
      topic: string;
      subTopics?: string[];
      learningObjectives?: string[];
      instructionalMaterials?: string[];
      contentSummary: string;
      contentBody: string;
      evaluationQuestions?: string[];
      keyTerms?: string[];
      pdfFileName?: string | null;
      pdfFileSize?: string | null;
      pdfUrl?: string | null;
      status?: 'Published' | 'Draft' | 'Archived';
    },
    client?: PoolClient
  ): Promise<LessonNoteDbEntity> {
    let schoolId = data.schoolId;
    let orgId = data.organizationId;

    if (!schoolId) {
      const defaultSchool = await this.resolveDefaultSchoolId(client);
      schoolId = defaultSchool.schoolId;
      orgId = orgId || defaultSchool.orgId;
    } else if (!orgId) {
      const orgRes = await query<{ organization_id: string }>(
        'SELECT organization_id FROM schools WHERE id = $1 LIMIT 1;',
        [schoolId],
        client
      );
      orgId = orgRes.rows[0]?.organization_id;
    }

    // Resolve term and session if not fully supplied
    let termId = data.academicTermId || data.termId;
    let sessionId = data.academicSessionId;
    let termName = data.term || '1st Term';
    let academicYear = data.academicYear || '2024/2025';

    if (!termId || !sessionId) {
      const termRes = await query<{ id: string; session_id: string; term_name: string; session_name?: string }>(
        `SELECT t.id, t.session_id, t.term_name, s.session_name
         FROM academic_terms t
         LEFT JOIN academic_sessions s ON s.id = t.session_id
         ORDER BY t.is_current DESC LIMIT 1;`,
        [],
        client
      );
      if (termRes.rows[0]) {
        termId = termId || termRes.rows[0].id;
        sessionId = sessionId || termRes.rows[0].session_id;
        termName = data.term || termRes.rows[0].term_name || termName;
        academicYear = data.academicYear || termRes.rows[0].session_name || academicYear;
      }
    }

    // Resolve classId if provided by level or name
    let classId = data.classId;
    if (!classId && data.classLevel) {
      const classRes = await query<{ id: string }>(
        'SELECT id FROM classes WHERE (level ILIKE $1 OR name ILIKE $1) AND school_id = $2 LIMIT 1;',
        [data.classLevel, schoolId],
        client
      );
      if (classRes.rows[0]) {
        classId = classRes.rows[0].id;
      }
    }

    // Resolve subjectId if provided by name
    let subjectId = data.subjectId;
    if (!subjectId && data.subjectName) {
      const subRes = await query<{ id: string }>(
        'SELECT id FROM subjects WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 1;',
        [data.subjectName],
        client
      );
      if (subRes.rows[0]) {
        subjectId = subRes.rows[0].id;
      }
    }

    const sql = `
      INSERT INTO lesson_notes (
        organization_id,
        school_id,
        teacher_id,
        teacher_name,
        class_id,
        class_level,
        arm,
        subject_id,
        subject_name,
        academic_session_id,
        academic_term_id,
        term_id,
        term,
        academic_year,
        week_number,
        title,
        topic,
        sub_topics,
        learning_objectives,
        instructional_materials,
        content_summary,
        content_body,
        evaluation_questions,
        key_terms,
        pdf_file_name,
        pdf_file_size,
        pdf_url,
        download_count,
        status,
        uploaded_at,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW(), NOW(), NOW()
      )
      RETURNING *;
    `;

    const params = [
      orgId || null,
      schoolId,
      data.teacherId || null,
      data.teacherName,
      classId || null,
      data.classLevel,
      data.arm,
      subjectId || null,
      data.subjectName,
      sessionId || null,
      termId || null,
      termId || null,
      termName,
      academicYear,
      data.weekNumber,
      data.title,
      data.topic,
      data.subTopics || [],
      data.learningObjectives || [],
      data.instructionalMaterials || [],
      data.contentSummary,
      data.contentBody,
      data.evaluationQuestions || [],
      data.keyTerms || [],
      data.pdfFileName || null,
      data.pdfFileSize || null,
      data.pdfUrl || null,
      0,
      normalizeNoteStatus(data.status),
    ];

    const res = await query<LessonNoteDbEntity>(sql, params, client);
    return res.rows[0];
  }

  /**
   * Find a single lesson note by ID with school boundary isolation.
   */
  async getLessonNoteById(
    id: string,
    schoolId?: string,
    client?: PoolClient
  ): Promise<LessonNoteDbEntity | null> {
    const conditions: string[] = ['ln.id = $1'];
    const params: any[] = [id];

    if (schoolId) {
      params.push(schoolId);
      conditions.push(`ln.school_id = $${params.length}`);
    }

    const sql = `
      SELECT 
        ln.*,
        sch.name as school_name,
        sch.code as school_code,
        COUNT(li.id)::int as feedback_count,
        COUNT(CASE WHEN li.status = 'Pending' THEN 1 END)::int as pending_feedback_count
      FROM lesson_notes ln
      LEFT JOIN schools sch ON sch.id = ln.school_id
      LEFT JOIN lesson_inquiries li ON li.lesson_note_id = ln.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY ln.id, sch.name, sch.code
      LIMIT 1;
    `;

    const res = await query<LessonNoteDbEntity>(sql, params, client);
    return res.rows[0] || null;
  }

  /**
   * Search and list lesson notes with rich filtering and pagination.
   */
  async listLessonNotes(
    filters: LessonNoteFilterOptions = {},
    options: QueryOptions = {}
  ): Promise<PaginatedResult<LessonNoteDbEntity>> {
    const conditions: string[] = [];
    const params: any[] = [];

    const effectiveSchoolId = filters.schoolId || (filters as any).school_id || options.tenantContext?.schoolId;
    if (effectiveSchoolId) {
      params.push(effectiveSchoolId);
      conditions.push(`ln.school_id = $${params.length}`);
    }

    if (filters.arm && filters.arm !== 'all') {
      params.push(filters.arm.toLowerCase());
      conditions.push(`LOWER(ln.arm) = $${params.length}`);
    }

    if (filters.classLevel) {
      params.push(filters.classLevel);
      conditions.push(`ln.class_level = $${params.length}`);
    }

    if (filters.classId) {
      params.push(filters.classId);
      conditions.push(`ln.class_id = $${params.length}`);
    }

    if (filters.subjectId) {
      params.push(filters.subjectId);
      conditions.push(`ln.subject_id = $${params.length}`);
    }

    if (filters.subjectName) {
      params.push(`%${filters.subjectName}%`);
      conditions.push(`ln.subject_name ILIKE $${params.length}`);
    }

    if (filters.termId) {
      params.push(filters.termId);
      conditions.push(`(ln.academic_term_id = $${params.length} OR ln.term_id = $${params.length})`);
    }

    if (filters.term && filters.term !== 'all') {
      params.push(`%${filters.term}%`);
      conditions.push(`ln.term ILIKE $${params.length}`);
    }

    if (filters.weekNumber) {
      params.push(filters.weekNumber);
      conditions.push(`ln.week_number = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`ln.status = $${params.length}`);
    }

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      params.push(term);
      const idx = params.length;
      conditions.push(
        `(ln.title ILIKE $${idx} OR ln.topic ILIKE $${idx} OR ln.content_summary ILIKE $${idx} OR ln.teacher_name ILIKE $${idx} OR ln.subject_name ILIKE $${idx})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countSql = `SELECT COUNT(*)::int as total FROM lesson_notes ln ${whereClause};`;
    const countRes = await query<{ total: number }>(countSql, params, options.client);
    const total = countRes.rows[0]?.total || 0;

    // Pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const dataSql = `
      SELECT 
        ln.*,
        sch.name as school_name,
        sch.code as school_code,
        COUNT(li.id)::int as feedback_count,
        COUNT(CASE WHEN li.status = 'Pending' THEN 1 END)::int as pending_feedback_count
      FROM lesson_notes ln
      LEFT JOIN schools sch ON sch.id = ln.school_id
      LEFT JOIN lesson_inquiries li ON li.lesson_note_id = ln.id
      ${whereClause}
      GROUP BY ln.id, sch.name, sch.code
      ORDER BY ln.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const dataRes = await query<LessonNoteDbEntity>(dataSql, params, options.client);

    return {
      data: dataRes.rows,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Update an existing lesson note with school tenant protection.
   */
  async updateLessonNote(
    id: string,
    schoolId: string,
    updates: Partial<LessonNoteDbEntity>,
    client?: PoolClient
  ): Promise<LessonNoteDbEntity | null> {
    const allowedFields = [
      'title',
      'topic',
      'sub_topics',
      'learning_objectives',
      'instructional_materials',
      'content_summary',
      'content_body',
      'evaluation_questions',
      'key_terms',
      'pdf_file_name',
      'pdf_file_size',
      'pdf_url',
      'status',
      'class_level',
      'arm',
      'subject_name',
      'week_number',
    ];

    const setClauses: string[] = ['updated_at = NOW()'];
    const params: any[] = [id, schoolId];

    for (const [key, val] of Object.entries(updates)) {
      if (allowedFields.includes(key) && val !== undefined) {
        const finalVal = key === 'status' ? normalizeNoteStatus(val as string) : val;
        params.push(finalVal);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    const sql = `
      UPDATE lesson_notes
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND school_id = $2
      RETURNING *;
    `;

    const res = await query<LessonNoteDbEntity>(sql, params, client);
    return res.rows[0] || null;
  }

  /**
   * Delete a lesson note permanently with tenant protection and atomic audit logging.
   * Atomic PostgreSQL transaction:
   * 1. Verifies note and tenant match
   * 2. Deletes lesson note row (foreign keys ON DELETE SET NULL preserve previous audit records)
   * 3. Inserts NOTE_DELETED audit log entry
   * 4. Commits (or rollbacks on error)
   */
  async deleteLessonNoteWithAudit(
    id: string,
    schoolId: string,
    actorId?: string | null,
    ipAddress?: string | null
  ): Promise<boolean> {
    return withTransaction(async (client: PoolClient) => {
      // 1. Verify target lesson note and tenant existence with row lock
      const noteRes = await client.query<{ id: string; school_id: string; organization_id: string; title: string }>(
        'SELECT id, school_id, organization_id, title FROM lesson_notes WHERE id = $1 AND school_id = $2 FOR UPDATE;',
        [id, schoolId]
      );
      const note = noteRes.rows[0];
      if (!note) {
        return false;
      }

      // 2. Delete lesson note (prior audit logs have lesson_note_id set to null via ON DELETE SET NULL)
      const delRes = await client.query('DELETE FROM lesson_notes WHERE id = $1 AND school_id = $2;', [id, schoolId]);
      if ((delRes.rowCount || 0) === 0) {
        return false;
      }

      // 3. Insert NOTE_DELETED audit event
      await this.recordAuditLog(
        {
          schoolId: note.school_id,
          organizationId: note.organization_id,
          lessonNoteId: null, // Note is deleted; id preserved in details
          userId: actorId || null,
          action: 'NOTE_DELETED',
          details: {
            id,
            deletedLessonNoteId: id,
            title: note.title,
            deletedAt: new Date().toISOString(),
          },
          ipAddress: ipAddress || null,
        },
        client
      );

      return true;
    });
  }

  /**
   * Delete a lesson note permanently with tenant protection.
   */
  async deleteLessonNote(id: string, schoolId: string, client?: PoolClient): Promise<boolean> {
    const res = await query(
      'DELETE FROM lesson_notes WHERE id = $1 AND school_id = $2;',
      [id, schoolId],
      client
    );
    return (res.rowCount || 0) > 0;
  }

  /**
   * Atomic download counter increment in PostgreSQL with tenant isolation.
   */
  async incrementDownloadCount(id: string, schoolId?: string, client?: PoolClient): Promise<number> {
    const sql = schoolId
      ? `UPDATE lesson_notes
         SET download_count = download_count + 1, updated_at = NOW()
         WHERE id = $1 AND school_id = $2
         RETURNING download_count;`
      : `UPDATE lesson_notes
         SET download_count = download_count + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING download_count;`;
    const params = schoolId ? [id, schoolId] : [id];
    const res = await query<{ download_count: number }>(sql, params, client);
    return res.rows[0]?.download_count || 0;
  }

  /**
   * Compute authoritative aggregate curriculum statistics directly from PostgreSQL.
   */
  async getLessonNotesStats(schoolId?: string, client?: PoolClient): Promise<LessonNotesStats> {
    const schoolFilter = schoolId ? 'WHERE ln.school_id = $1' : '';
    const inqFilter = schoolId ? 'WHERE li.school_id = $1' : '';
    const params = schoolId ? [schoolId] : [];

    const statsSql = `
      SELECT 
        COUNT(*)::int as total_notes,
        COALESCE(SUM(ln.download_count), 0)::int as total_downloads,
        COUNT(CASE WHEN LOWER(ln.arm) = 'kindergarten' THEN 1 END)::int as kindergarten_count,
        COUNT(CASE WHEN LOWER(ln.arm) = 'primary' THEN 1 END)::int as primary_count,
        COUNT(CASE WHEN LOWER(ln.arm) = 'secondary' THEN 1 END)::int as secondary_count,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT ln.class_level), NULL) as classes_covered,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT ln.subject_name), NULL) as subjects_covered
      FROM lesson_notes ln
      ${schoolFilter};
    `;

    const inqSql = `
      SELECT 
        COUNT(*)::int as total_feedbacks,
        COUNT(CASE WHEN li.status = 'Pending' THEN 1 END)::int as pending_feedbacks
      FROM lesson_inquiries li
      ${inqFilter};
    `;

    const [statsRes, inqRes] = await Promise.all([
      query<{
        total_notes: number;
        total_downloads: number;
        kindergarten_count: number;
        primary_count: number;
        secondary_count: number;
        classes_covered: string[] | null;
        subjects_covered: string[] | null;
      }>(statsSql, params, client),
      query<{
        total_feedbacks: number;
        pending_feedbacks: number;
      }>(inqSql, params, client),
    ]);

    const s = statsRes.rows[0] || {
      total_notes: 0,
      total_downloads: 0,
      kindergarten_count: 0,
      primary_count: 0,
      secondary_count: 0,
      classes_covered: [],
      subjects_covered: [],
    };

    const i = inqRes.rows[0] || {
      total_feedbacks: 0,
      pending_feedbacks: 0,
    };

    return {
      totalNotes: Number(s.total_notes) || 0,
      totalDownloads: Number(s.total_downloads) || 0,
      armBreakdown: {
        kindergarten: Number(s.kindergarten_count) || 0,
        primary: Number(s.primary_count) || 0,
        secondary: Number(s.secondary_count) || 0,
      },
      totalFeedbacks: Number(i.total_feedbacks) || 0,
      pendingFeedbacks: Number(i.pending_feedbacks) || 0,
      classesCovered: s.classes_covered || [],
      subjectsCovered: s.subjects_covered || [],
    };
  }

  /**
   * Log an immutable curriculum security or operational event to lesson_note_audit_logs.
   */
  async recordAuditLog(
    entry: {
      schoolId: string;
      organizationId?: string | null;
      lessonNoteId?: string | null;
      inquiryId?: string | null;
      userId?: string | null;
      action: string;
      details?: Record<string, any>;
      ipAddress?: string | null;
    },
    client?: PoolClient
  ): Promise<void> {
    await query(
      `INSERT INTO lesson_note_audit_logs (
        school_id, organization_id, lesson_note_id, inquiry_id, user_id, action, details, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());`,
      [
        entry.schoolId,
        entry.organizationId || null,
        entry.lessonNoteId || null,
        entry.inquiryId || null,
        entry.userId || null,
        entry.action,
        JSON.stringify(entry.details || {}),
        entry.ipAddress || null,
      ],
      client
    );
  }

  // Convenient Repository API Aliases
  async create(data: any, actorId?: string): Promise<LessonNoteDbEntity> {
    const payload = {
      schoolId: data.schoolId || data.school_id,
      organizationId: data.organizationId || data.organization_id,
      teacherId: data.teacherId || data.teacher_id,
      teacherName: data.teacherName || data.teacher_name,
      classId: data.classId || data.class_id,
      classLevel: data.classLevel || data.class_level,
      arm: data.arm,
      subjectId: data.subjectId || data.subject_id,
      subjectName: data.subjectName || data.subject_name,
      academicSessionId: data.academicSessionId || data.academic_session_id,
      academicTermId: data.academicTermId || data.academic_term_id,
      termId: data.termId || data.term_id,
      term: data.term,
      academicYear: data.academicYear || data.academic_year,
      weekNumber: data.weekNumber ?? data.week_number,
      title: data.title,
      topic: data.topic,
      subTopics: data.subTopics || data.sub_topics,
      learningObjectives: data.learningObjectives || data.learning_objectives,
      instructionalMaterials: data.instructionalMaterials || data.instructional_materials,
      contentSummary: data.contentSummary || data.content_summary,
      contentBody: data.contentBody || data.content_body,
      evaluationQuestions: data.evaluationQuestions || data.evaluation_questions,
      keyTerms: data.keyTerms || data.key_terms,
      pdfFileName: data.pdfFileName || data.pdf_file_name,
      pdfFileSize: data.pdfFileSize || data.pdf_file_size,
      pdfUrl: data.pdfUrl || data.pdf_url,
      status: data.status,
    };
    const created = await this.createLessonNote(payload);
    if (actorId && created.school_id) {
      await this.recordAuditLog({
        schoolId: created.school_id,
        organizationId: created.organization_id,
        lessonNoteId: created.id,
        userId: actorId,
        action: 'CREATE',
        details: { title: created.title, topic: created.topic },
      });
    }
    return created;
  }

  async getById(id: string, schoolId?: string): Promise<LessonNoteDbEntity | null> {
    return this.getLessonNoteById(id, schoolId);
  }

  async list(filters?: any, options?: QueryOptions): Promise<LessonNoteDbEntity[]> {
    const res = await this.listLessonNotes(filters, options);
    return res.data;
  }

  async update(id: string, data: any, schoolId?: string, actorId?: string): Promise<LessonNoteDbEntity | null> {
    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
      const existing = await this.getById(id);
      if (!existing) return null;
      targetSchoolId = existing.school_id;
    }

    const payload: Partial<LessonNoteDbEntity> = {
      title: data.title,
      topic: data.topic,
      class_level: data.classLevel || data.class_level,
      arm: data.arm,
      subject_name: data.subjectName || data.subject_name,
      week_number: data.weekNumber ?? data.week_number,
      content_summary: data.contentSummary || data.content_summary,
      content_body: data.contentBody || data.content_body,
      learning_objectives: data.learningObjectives || data.learning_objectives,
      evaluation_questions: data.evaluationQuestions || data.evaluation_questions,
      key_terms: data.keyTerms || data.key_terms,
      status: data.status,
    };
    const updated = await this.updateLessonNote(id, targetSchoolId, payload);
    if (updated && actorId && updated.school_id) {
      await this.recordAuditLog({
        schoolId: updated.school_id,
        organizationId: updated.organization_id,
        lessonNoteId: updated.id,
        userId: actorId,
        action: 'UPDATE',
        details: { changes: Object.keys(data) },
      });
    }
    return updated;
  }

  async incrementDownload(id: string, schoolId?: string): Promise<number> {
    return this.incrementDownloadCount(id, schoolId);
  }

  async delete(id: string, schoolId: string, actorId?: string, ipAddress?: string): Promise<boolean> {
    return this.deleteLessonNoteWithAudit(id, schoolId, actorId, ipAddress);
  }

  async getStats(schoolId?: string): Promise<LessonNotesStats> {
    return this.getLessonNotesStats(schoolId);
  }
}

export const lessonNoteRepository = new LessonNoteRepository();
