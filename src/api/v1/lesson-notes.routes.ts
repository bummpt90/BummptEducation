/**
 * BummptEducation — Lesson Notes & Inquiries API Routes (/api/v1/lesson-notes)
 * 
 * Phase 8D: Final Security, Authorization, Audit & Production-Seed Hardening
 * 
 * Server-authoritative endpoints for curriculum publication, student/parent
 * lesson material downloads, teacher consultations, and administrative telemetry
 * backed by PostgreSQL.
 * 
 * Security Guarantees:
 * 1. Strict Authentication: All read, write, download, inquiry, and reply endpoints
 *    require valid JWT authentication via authenticateUser (no optionalAuth).
 * 2. Multi-Tenant Isolation & IDOR Protection: Ordinary staff, teachers, parents,
 *    and students are strictly confined to their authenticated school context.
 *    Client-supplied schoolId parameters are ignored for non-supervisory roles.
 * 3. Authoritative Parent/Student Inquiries: Parent submissions resolve linked
 *    students through authoritative parent_guardians and parent_student_links tables.
 * 4. Scoped Inquiry Visibility: Parents can only read inquiries for their own
 *    linked children; educators view their school's inquiries; IDOR is blocked.
 * 5. Atomic PostgreSQL Deletion + Audit Logging: Deletions run inside an atomic
 *    transaction that verifies tenant ownership, removes the lesson note, and inserts
 *    a NOTE_DELETED audit record. Audit log FK uses ON DELETE SET NULL to preserve history.
 * 6. Safe API Error Responses: Internal database details, queries, and stack traces
 *    are never returned to client responses.
 */

import { Router } from 'express';
import type { Response } from 'express';
import { authenticateUser, requirePermission } from '../../auth/middleware';
import { lessonNoteRepository } from '../../db/repositories/lessonNote.repository';
import { lessonInquiryRepository } from '../../db/repositories/lessonInquiry.repository';
import { parentRepository } from '../../db/repositories/parent.repository';
import { query } from '../../db/client';
import type { AuthenticatedRequest } from '../../auth/types';
import type { LessonNoteDbEntity, LessonInquiryDbEntity } from '../../db/types';

export const lessonNotesRouter = Router();

function mapDbToLessonNote(entity: LessonNoteDbEntity) {
  return {
    id: entity.id,
    title: entity.title,
    subjectId: entity.subject_id || '',
    subjectName: entity.subject_name || '',
    classLevel: entity.class_level,
    arm: entity.arm as 'kindergarten' | 'primary' | 'secondary',
    term: entity.term || '1st Term',
    academicYear: entity.academic_year || '2025/2026',
    weekNumber: entity.week_number,
    teacherId: entity.teacher_id || '',
    teacherName: entity.teacher_name || '',
    topic: entity.topic,
    subTopics: entity.sub_topics || [],
    learningObjectives: entity.learning_objectives || [],
    instructionalMaterials: entity.instructional_materials || [],
    contentSummary: entity.content_summary,
    contentBody: entity.content_body,
    evaluationQuestions: entity.evaluation_questions || [],
    keyTerms: entity.key_terms || [],
    pdfFileName: entity.pdf_file_name || undefined,
    pdfFileSize: entity.pdf_file_size || undefined,
    pdfUrl: entity.pdf_url || undefined,
    downloadCount: entity.download_count || 0,
    status: entity.status || 'Published',
    createdAt: typeof entity.created_at === 'string' ? entity.created_at : (entity.created_at ? new Date(entity.created_at).toISOString() : new Date().toISOString()),
    uploadedAt: typeof entity.uploaded_at === 'string' ? entity.uploaded_at : (entity.uploaded_at ? new Date(entity.uploaded_at).toISOString() : undefined),
    schoolId: entity.school_id,
    schoolName: entity.school_name,
    schoolCode: entity.school_code,
    feedbackCount: entity.feedback_count || 0,
    pendingFeedbackCount: entity.pending_feedback_count || 0,
  };
}

function mapDbToFeedback(entity: LessonInquiryDbEntity) {
  return {
    id: entity.id,
    lessonNoteId: entity.lesson_note_id,
    parentName: entity.parent_name,
    studentName: entity.student_name || '',
    guardianPhone: entity.guardian_phone || undefined,
    question: entity.question,
    reply: entity.teacher_reply || entity.reply || undefined,
    repliedBy: entity.replied_by_name || undefined,
    status: entity.status,
    createdAt: typeof entity.created_at === 'string' ? entity.created_at : (entity.created_at ? new Date(entity.created_at).toISOString() : new Date().toISOString()),
    repliedAt: entity.replied_at ? (typeof entity.replied_at === 'string' ? entity.replied_at : new Date(entity.replied_at).toISOString()) : undefined,
  };
}

/**
 * Resolve tenant scope for an authenticated request.
 * Super Admins and State Officers may query globally or specify a schoolId.
 * All other roles are strictly confined to their user.schoolId.
 */
function resolveAuthorizedSchoolScope(req: AuthenticatedRequest): { schoolId?: string; isGlobal: boolean } {
  const user = req.user!;
  if (user.isSuperAdmin || user.isStateOfficer) {
    const querySchoolId = (req.query.schoolId as string) || (req.query.school_id as string) || undefined;
    return { schoolId: querySchoolId, isGlobal: !querySchoolId };
  }
  return { schoolId: user.schoolId || undefined, isGlobal: false };
}

/**
 * GET /api/v1/lesson-notes/stats
 * Return PostgreSQL-authoritative curriculum metrics.
 * Requires authenticated access and enforces tenant scope.
 */
lessonNotesRouter.get('/stats', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { schoolId, isGlobal } = resolveAuthorizedSchoolScope(req);

    if (!isGlobal && !schoolId) {
      res.status(403).json({
        success: false,
        error: 'TENANT_CONTEXT_REQUIRED',
        message: 'User is not associated with an authorized school.',
      });
      return;
    }

    const stats = await lessonNoteRepository.getLessonNotesStats(schoolId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[LessonNotesAPI] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred while fetching lesson notes statistics.',
    });
  }
});

/**
 * GET /api/v1/lesson-notes
 * Search and filter lesson notes backed by PostgreSQL.
 * Requires authentication and strictly scopes results to the caller's school.
 */
lessonNotesRouter.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { schoolId, isGlobal } = resolveAuthorizedSchoolScope(req);

    if (!isGlobal && !schoolId) {
      res.status(403).json({
        success: false,
        error: 'TENANT_CONTEXT_REQUIRED',
        message: 'User is not associated with an authorized school.',
      });
      return;
    }

    const {
      arm,
      classLevel,
      classId,
      subjectId,
      subjectName,
      termId,
      term,
      weekNumber,
      status,
      search,
      limit,
      offset,
    } = req.query;

    const result = await lessonNoteRepository.listLessonNotes(
      {
        schoolId,
        arm: arm as string,
        classLevel: classLevel as string,
        classId: classId as string,
        subjectId: subjectId as string,
        subjectName: subjectName as string,
        termId: termId as string,
        term: term as string,
        weekNumber: weekNumber ? parseInt(weekNumber as string, 10) : undefined,
        status: status as string,
        search: search as string,
      },
      {
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      }
    );

    const formatted = result.data.map(mapDbToLessonNote);

    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    });
  } catch (error: any) {
    console.error('[LessonNotesAPI] Error listing lesson notes:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred while retrieving lesson notes.',
    });
  }
});

/**
 * Helper to fetch inquiries for a specific note, respecting the caller's role.
 */
async function getInquiriesForUserRole(noteId: string, schoolId: string, user: AuthenticatedRequest['user']) {
  if (!user) return [];

  // Super Admin and State Officers have supervisory visibility
  if (user.isSuperAdmin || user.isStateOfficer) {
    return lessonInquiryRepository.listInquiriesForNote(noteId, schoolId);
  }

  // School educators, administrators, and principals see all inquiries for their school's note
  if (['teacher', 'principal', 'vice_principal', 'headmistress', 'admin'].includes(user.role)) {
    return lessonInquiryRepository.listInquiriesForNote(noteId, schoolId);
  }

  // Parents are strictly restricted to inquiries for their own linked children
  if (user.role === 'parent') {
    const parent = await parentRepository.findParentByUserId(user.id);
    if (!parent) return [];
    const linkedStudents = await parentRepository.getLinkedStudents(parent.id, schoolId);
    const studentIds = linkedStudents.map((s) => s.id);
    return lessonInquiryRepository.listInquiriesForNote(noteId, schoolId, {
      parentId: parent.id,
      studentIds,
    });
  }

  // Students are strictly restricted to inquiries regarding themselves
  if (user.role === 'student') {
    return lessonInquiryRepository.listInquiriesForNote(noteId, schoolId, {
      studentId: user.id,
    });
  }

  return [];
}

/**
 * GET /api/v1/lesson-notes/:id
 * Retrieve a single lesson note along with parent feedback consultation history.
 * Enforces authenticated tenant boundary (IDOR protection).
 */
lessonNotesRouter.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { schoolId, isGlobal } = resolveAuthorizedSchoolScope(req);

    if (!isGlobal && !schoolId) {
      res.status(403).json({
        success: false,
        error: 'TENANT_CONTEXT_REQUIRED',
        message: 'User is not associated with an authorized school.',
      });
      return;
    }

    const note = await lessonNoteRepository.getLessonNoteById(id, schoolId);
    if (!note) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Lesson note not found or access denied.',
      });
      return;
    }

    // Role-authorized inquiry retrieval
    const inquiries = await getInquiriesForUserRole(id, note.school_id, req.user);

    res.json({
      success: true,
      data: mapDbToLessonNote(note),
      feedbacks: inquiries.map(mapDbToFeedback),
    });
  } catch (error: any) {
    console.error('[LessonNotesAPI] Error fetching lesson note:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred while retrieving lesson note details.',
    });
  }
});

/**
 * POST /api/v1/lesson-notes
 * Create and publish a new lesson note.
 * Protected by authentication and RBAC ('lesson_notes.create').
 */
lessonNotesRouter.post(
  '/',
  authenticateUser,
  requirePermission('lesson_notes.create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const body = req.body || {};
      const {
        title,
        topic,
        classLevel,
        arm,
        subjectName,
        contentSummary,
        contentBody,
        weekNumber,
        subTopics,
        learningObjectives,
        instructionalMaterials,
        evaluationQuestions,
        keyTerms,
        pdfFileName,
        pdfFileSize,
        pdfUrl,
        term,
        academicYear,
        schoolId,
        teacherName,
      } = body;

      // Validation
      if (!title || !topic || !classLevel || !arm || !subjectName || !contentSummary || !contentBody) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Missing required curriculum fields: title, topic, classLevel, arm, subjectName, contentSummary, contentBody.',
        });
        return;
      }

      // Tenant isolation: Non-supervisors cannot publish notes to other schools
      let targetSchoolId = user.schoolId;
      if (user.isSuperAdmin || user.isStateOfficer) {
        targetSchoolId = schoolId || user.schoolId;
      } else {
        if (schoolId && user.schoolId && schoolId !== user.schoolId) {
          res.status(403).json({
            success: false,
            error: 'CROSS_SCHOOL_UNAUTHORIZED',
            message: 'You cannot publish lesson notes for another school.',
          });
          return;
        }
      }

      if (!targetSchoolId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_CONTEXT',
          message: 'An authorized school context is required to publish lesson notes.',
        });
        return;
      }

      // Resolve staff id if available, otherwise null to satisfy FK to staff(id)
      let resolvedTeacherId: string | null = null;
      const staffRes = await query<{ id: string }>('SELECT id FROM staff WHERE user_id = $1 LIMIT 1;', [user.id]);
      if (staffRes.rows.length > 0) {
        resolvedTeacherId = staffRes.rows[0].id;
      }

      const createdNote = await lessonNoteRepository.createLessonNote({
        schoolId: targetSchoolId,
        teacherId: resolvedTeacherId,
        teacherName: teacherName || user.fullName || 'Academic Educator',
        classLevel,
        arm,
        subjectName,
        weekNumber: weekNumber ? parseInt(weekNumber, 10) : 1,
        title,
        topic,
        subTopics: Array.isArray(subTopics) ? subTopics : [],
        learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [],
        instructionalMaterials: Array.isArray(instructionalMaterials) ? instructionalMaterials : [],
        contentSummary,
        contentBody,
        evaluationQuestions: Array.isArray(evaluationQuestions) ? evaluationQuestions : [],
        keyTerms: Array.isArray(keyTerms) ? keyTerms : [],
        pdfFileName,
        pdfFileSize,
        pdfUrl,
        term,
        academicYear,
        status: 'Published',
      });

      // Immutable Audit Log
      await lessonNoteRepository.recordAuditLog({
        schoolId: createdNote.school_id,
        organizationId: createdNote.organization_id,
        lessonNoteId: createdNote.id,
        userId: user.id,
        action: 'NOTE_CREATED',
        details: {
          title: createdNote.title,
          classLevel: createdNote.class_level,
          subjectName: createdNote.subject_name,
        },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: mapDbToLessonNote(createdNote),
        message: 'Lesson note published successfully to PostgreSQL curriculum registry.',
      });
    } catch (error: any) {
      console.error('[LessonNotesAPI] Error creating lesson note:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An internal error occurred while publishing the lesson note.',
      });
    }
  }
);

/**
 * PUT /api/v1/lesson-notes/:id
 * Update an existing lesson note with tenant boundary validation.
 */
lessonNotesRouter.put(
  '/:id',
  authenticateUser,
  requirePermission('lesson_notes.create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const { id } = req.params;
      const targetSchoolId = (user.isSuperAdmin || user.isStateOfficer)
        ? (req.body.schoolId as string) || user.schoolId
        : user.schoolId;

      if (!targetSchoolId) {
        res.status(400).json({ success: false, error: 'MISSING_SCHOOL_CONTEXT' });
        return;
      }

      const updated = await lessonNoteRepository.updateLessonNote(id, targetSchoolId, req.body);
      if (!updated) {
        res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Lesson note not found or access denied.' });
        return;
      }

      await lessonNoteRepository.recordAuditLog({
        schoolId: targetSchoolId,
        lessonNoteId: id,
        userId: user.id,
        action: 'NOTE_UPDATED',
        details: { id },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: mapDbToLessonNote(updated),
        message: 'Lesson note updated successfully.',
      });
    } catch (error: any) {
      console.error('[LessonNotesAPI] Error updating lesson note:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An internal error occurred while updating the lesson note.',
      });
    }
  }
);

/**
 * DELETE /api/v1/lesson-notes/:id
 * Atomically deletes a lesson note and creates a NOTE_DELETED audit record.
 * Wrapped in a single PostgreSQL transaction.
 */
lessonNotesRouter.delete(
  '/:id',
  authenticateUser,
  requirePermission('lesson_notes.create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const { id } = req.params;
      const targetSchoolId = (user.isSuperAdmin || user.isStateOfficer)
        ? (req.query.schoolId as string) || user.schoolId
        : user.schoolId;

      if (!targetSchoolId) {
        res.status(400).json({ success: false, error: 'MISSING_SCHOOL_CONTEXT' });
        return;
      }

      // Execute atomic transaction: verifies note & school -> deletes note -> logs audit event -> commits
      const deleted = await lessonNoteRepository.deleteLessonNoteWithAudit(id, targetSchoolId, user.id, req.ip);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Lesson note not found or access denied.',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Lesson note removed permanently from the curriculum registry.',
      });
    } catch (error: any) {
      console.error('[LessonNotesAPI] Error deleting lesson note:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An internal error occurred while deleting the lesson note.',
      });
    }
  }
);

/**
 * Handler for atomic download increment in PostgreSQL with tenant authorization.
 */
async function handleIncrementDownload(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Verify user has access to this lesson note's school
    const targetSchoolId = (user.isSuperAdmin || user.isStateOfficer) ? undefined : user.schoolId;
    if (!targetSchoolId && !user.isSuperAdmin && !user.isStateOfficer) {
      res.status(403).json({
        success: false,
        error: 'TENANT_CONTEXT_REQUIRED',
        message: 'User is not associated with an authorized school.',
      });
      return;
    }

    const note = await lessonNoteRepository.getLessonNoteById(id, targetSchoolId);
    if (!note) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Lesson note not found or access denied.',
      });
      return;
    }

    // Atomic PostgreSQL increment scoped to the note's school
    const downloadCount = await lessonNoteRepository.incrementDownloadCount(id, note.school_id);

    res.json({
      success: true,
      downloadCount,
    });
  } catch (error: any) {
    console.error('[LessonNotesAPI] Error incrementing download count:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred while updating the download counter.',
    });
  }
}

/**
 * POST /api/v1/lesson-notes/:id/increment-download
 * Increment download counter atomically in PostgreSQL (requires authentication).
 */
lessonNotesRouter.post('/:id/increment-download', authenticateUser, handleIncrementDownload);

/**
 * POST /api/v1/lesson-notes/:id/download (Route alias)
 */
lessonNotesRouter.post('/:id/download', authenticateUser, handleIncrementDownload);

/**
 * Handler for submitting a parent or student inquiry/feedback regarding a lesson note.
 * Integrates directly with Phase 8B parent authentication and authoritative student linkage.
 */
async function handleCreateInquiry(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { question, studentId: requestedStudentId } = req.body || {};

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'A valid question content string is required.',
      });
      return;
    }

    // 1. Verify lesson note existence
    const note = await lessonNoteRepository.getLessonNoteById(id);
    if (!note) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'The requested lesson note does not exist.',
      });
      return;
    }

    // 2. Tenant isolation check
    if (!user.isSuperAdmin && !user.isStateOfficer && user.schoolId && note.school_id !== user.schoolId) {
      res.status(403).json({
        success: false,
        error: 'CROSS_SCHOOL_UNAUTHORIZED',
        message: 'Cannot submit inquiries for a lesson note belonging to a different school.',
      });
      return;
    }

    // 3. Resolve authoritative identity based on role
    let resolvedParentId: string | null = null;
    let resolvedParentName: string = user.fullName || 'Parent/Guardian';
    let resolvedGuardianPhone: string | null = null;
    let resolvedStudentId: string | null = null;
    let resolvedStudentName: string = 'Student';

    if (user.role === 'parent') {
      const parent = await parentRepository.findParentByUserId(user.id);
      if (!parent) {
        res.status(403).json({
          success: false,
          error: 'PARENT_PROFILE_NOT_FOUND',
          message: 'Authenticated user has no registered parent profile.',
        });
        return;
      }

      resolvedParentId = parent.id;
      resolvedParentName = parent.fullName || user.fullName;
      resolvedGuardianPhone = parent.phone || null;

      // Authoritatively verify parent's linked students in this school
      const linkedStudents = await parentRepository.getLinkedStudents(parent.id, note.school_id);
      if (linkedStudents.length === 0) {
        res.status(403).json({
          success: false,
          error: 'NO_LINKED_STUDENT',
          message: 'Parent has no verified linked students in this school.',
        });
        return;
      }

      if (requestedStudentId) {
        const matched = linkedStudents.find((s) => s.id === requestedStudentId);
        if (!matched) {
          res.status(403).json({
            success: false,
            error: 'UNAUTHORIZED_STUDENT',
            message: 'Parent is not authorized to submit inquiries for the specified student.',
          });
          return;
        }
        resolvedStudentId = matched.id;
        resolvedStudentName = matched.fullName;
      } else {
        // Default to the first linked student in this school
        resolvedStudentId = linkedStudents[0].id;
        resolvedStudentName = linkedStudents[0].fullName;
      }
    } else if (user.role === 'student') {
      // Look up student authoritative record
      const studentRes = await query<{ id: string; full_name: string; guardian_name: string; guardian_phone: string; school_id: string }>(
        'SELECT id, full_name, guardian_name, guardian_phone, school_id FROM students WHERE id = $1 LIMIT 1;',
        [user.id]
      );
      const student = studentRes.rows[0];
      if (student && student.school_id !== note.school_id) {
        res.status(403).json({
          success: false,
          error: 'CROSS_SCHOOL_UNAUTHORIZED',
          message: 'Student does not belong to the lesson note school.',
        });
        return;
      }

      resolvedStudentId = student?.id || user.id;
      resolvedStudentName = student?.full_name || user.fullName;
      resolvedParentName = student?.guardian_name || `Guardian of ${resolvedStudentName}`;
      resolvedGuardianPhone = student?.guardian_phone || null;
    } else {
      // Staff, Teacher, Principal, or Super Admin submitting pedagogical consultation
      resolvedParentName = user.fullName || 'Authorized Staff';
      resolvedStudentName = req.body.studentName || 'Curriculum Inquiry';
      resolvedGuardianPhone = null;
    }

    // 4. Create authoritative inquiry in PostgreSQL
    const inquiry = await lessonInquiryRepository.createInquiry({
      schoolId: note.school_id,
      organizationId: note.organization_id || undefined,
      lessonNoteId: note.id,
      parentId: resolvedParentId,
      parentName: resolvedParentName,
      studentId: resolvedStudentId,
      studentName: resolvedStudentName,
      guardianPhone: resolvedGuardianPhone,
      question: question.trim(),
    });

    // 5. Immutable Audit Log
    await lessonNoteRepository.recordAuditLog({
      schoolId: note.school_id,
      organizationId: note.organization_id,
      lessonNoteId: note.id,
      inquiryId: inquiry.id,
      userId: user.id,
      action: 'INQUIRY_SUBMITTED',
      details: {
        parentId: resolvedParentId,
        studentId: resolvedStudentId,
        parentName: resolvedParentName,
        studentName: resolvedStudentName,
        questionPreview: question.substring(0, 100),
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: mapDbToFeedback(inquiry),
      message: 'Consultation inquiry submitted successfully. The subject teacher will be notified.',
    });
  } catch (error: any) {
    console.error('[LessonNotesAPI] Error submitting feedback inquiry:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred while submitting the inquiry.',
    });
  }
}

/**
 * POST /api/v1/lesson-notes/:id/feedback
 * Submit a parent or student inquiry regarding a lesson note.
 * Requires authentication and authoritative parent-student identity verification.
 */
lessonNotesRouter.post('/:id/feedback', authenticateUser, handleCreateInquiry);

/**
 * POST /api/v1/lesson-notes/:id/inquiries (Route alias)
 */
lessonNotesRouter.post('/:id/inquiries', authenticateUser, handleCreateInquiry);

/**
 * Handler for retrieving inquiries for a lesson note with strict IDOR protection.
 */
async function handleListInquiries(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { schoolId, isGlobal } = resolveAuthorizedSchoolScope(req);

    const note = await lessonNoteRepository.getLessonNoteById(id, schoolId);
    if (!note) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Lesson note not found or access denied.',
      });
      return;
    }

    const inquiries = await getInquiriesForUserRole(id, note.school_id, user);

    res.json({
      success: true,
      data: inquiries.map(mapDbToFeedback),
    });
  } catch (error: any) {
    console.error('[LessonNotesAPI] Error listing feedback inquiries:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An internal error occurred while retrieving inquiries.',
    });
  }
}

/**
 * GET /api/v1/lesson-notes/:id/feedbacks
 * Retrieve feedback inquiries for a note. Requires authentication and enforces role scoping.
 */
lessonNotesRouter.get('/:id/feedbacks', authenticateUser, handleListInquiries);

/**
 * GET /api/v1/lesson-notes/:id/inquiries (Route alias)
 */
lessonNotesRouter.get('/:id/inquiries', authenticateUser, handleListInquiries);

/**
 * POST /api/v1/lesson-notes/inquiries/:id/reply
 * Teacher or educator responds to a parent inquiry.
 * Requires authentication, educator role authorization, and tenant verification.
 */
lessonNotesRouter.post(
  '/inquiries/:id/reply',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;

      // Verify that caller has educator / pedagogical permissions
      const isEducator =
        user.isSuperAdmin ||
        user.isStateOfficer ||
        ['teacher', 'principal', 'vice_principal', 'headmistress', 'admin'].includes(user.role);

      if (!isEducator) {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Only authorized educators and school administrators can reply to inquiries.',
        });
        return;
      }

      const { id } = req.params;
      const { reply } = req.body || {};

      if (!reply || typeof reply !== 'string' || !reply.trim()) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Reply message cannot be empty.',
        });
        return;
      }

      const inquiry = await lessonInquiryRepository.getInquiryById(id);
      if (!inquiry) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Inquiry not found.',
        });
        return;
      }

      // Check cross-school isolation
      if (!user.isSuperAdmin && !user.isStateOfficer && user.schoolId && inquiry.school_id !== user.schoolId) {
        res.status(403).json({
          success: false,
          error: 'CROSS_SCHOOL_UNAUTHORIZED',
          message: 'Cannot reply to inquiries for a different school.',
        });
        return;
      }

      // Resolve staff id if available, otherwise null to satisfy FK to staff(id)
      let resolvedStaffId: string | null = null;
      const staffRes = await query<{ id: string }>('SELECT id FROM staff WHERE user_id = $1 LIMIT 1;', [user.id]);
      if (staffRes.rows.length > 0) {
        resolvedStaffId = staffRes.rows[0].id;
      }

      const updated = await lessonInquiryRepository.respondToInquiry(id, inquiry.school_id, {
        reply: reply.trim(),
        repliedByStaffId: resolvedStaffId || undefined,
        repliedByUserId: user.id,
        repliedByName: user.fullName || 'Educator',
        status: 'Answered',
      });

      if (!updated) {
        res.status(500).json({
          success: false,
          error: 'UPDATE_FAILED',
          message: 'Failed to record response in database.',
        });
        return;
      }

      await lessonNoteRepository.recordAuditLog({
        schoolId: inquiry.school_id,
        lessonNoteId: inquiry.lesson_note_id,
        inquiryId: inquiry.id,
        userId: user.id,
        action: 'INQUIRY_ANSWERED',
        details: {
          inquiryId: id,
          repliedByName: user.fullName,
        },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: mapDbToFeedback(updated),
        message: 'Inquiry response recorded and published.',
      });
    } catch (error: any) {
      console.error('[LessonNotesAPI] Error replying to inquiry:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'An internal error occurred while replying to inquiry.',
      });
    }
  }
);
