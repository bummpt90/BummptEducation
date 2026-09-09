/**
 * BummptEducation — Lesson Notes & Inquiries API Routes (/api/v1/lesson-notes)
 * 
 * Server-authoritative endpoints for curriculum publication, student/parent
 * lesson material downloads, teacher consultations, and administrative telemetry
 * backed by PostgreSQL.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticateUser, requirePermission } from '../../auth/middleware';
import { lessonNoteRepository } from '../../db/repositories/lessonNote.repository';
import { lessonInquiryRepository } from '../../db/repositories/lessonInquiry.repository';
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
 * Optional Authentication Helper:
 * Extracts user if Authorization header is present, but doesn't block unauthenticated callers.
 */
function optionalAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authenticateUser(req as AuthenticatedRequest, res, next);
  } else {
    next();
  }
}

/**
 * GET /api/v1/lesson-notes/stats
 * Return PostgreSQL-authoritative curriculum metrics.
 */
lessonNotesRouter.get('/stats', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let targetSchoolId = (req.query.schoolId as string) || (req.query.school_id as string);
    if (req.user && !req.user.isSuperAdmin && !req.user.isStateOfficer && req.user.schoolId) {
      targetSchoolId = req.user.schoolId;
    }

    const stats = await lessonNoteRepository.getLessonNotesStats(targetSchoolId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[LessonNotesAPI] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error?.message || 'Failed to fetch lesson notes statistics.',
    });
  }
});

/**
 * GET /api/v1/lesson-notes
 * Search and filter lesson notes backed by PostgreSQL.
 */
lessonNotesRouter.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
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

    let targetSchoolId = (req.query.schoolId as string) || (req.query.school_id as string);
    if (req.user && !req.user.isSuperAdmin && !req.user.isStateOfficer && req.user.schoolId) {
      targetSchoolId = req.user.schoolId;
    }

    const result = await lessonNoteRepository.listLessonNotes(
      {
        schoolId: targetSchoolId,
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
      message: error?.message || 'Failed to retrieve lesson notes.',
    });
  }
});

/**
 * GET /api/v1/lesson-notes/:id
 * Retrieve a single lesson note along with parent feedback consultation history.
 */
lessonNotesRouter.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    let targetSchoolId = (req.query.schoolId as string) || (req.query.school_id as string);
    if (req.user && !req.user.isSuperAdmin && !req.user.isStateOfficer && req.user.schoolId) {
      targetSchoolId = req.user.schoolId;
    }

    const note = await lessonNoteRepository.getLessonNoteById(id, targetSchoolId);
    if (!note) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Lesson note not found.',
      });
      return;
    }

    const inquiries = await lessonInquiryRepository.listInquiriesForNote(id, targetSchoolId);

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
      message: error?.message || 'Failed to retrieve lesson note details.',
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
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'UNAUTHENTICATED' });
        return;
      }

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

      // Tenant isolation: Staff / Teachers cannot publish notes to other schools
      let targetSchoolId = schoolId || user.schoolId;
      if (!user.isSuperAdmin && !user.isStateOfficer) {
        if (schoolId && user.schoolId && schoolId !== user.schoolId) {
          res.status(403).json({
            success: false,
            error: 'CROSS_SCHOOL_UNAUTHORIZED',
            message: 'You cannot publish lesson notes for another school.',
          });
          return;
        }
        targetSchoolId = user.schoolId;
      }

      const createdNote = await lessonNoteRepository.createLessonNote({
        schoolId: targetSchoolId,
        teacherId: user.id,
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
        message: error?.message || 'Failed to publish lesson note.',
      });
    }
  }
);

/**
 * PUT /api/v1/lesson-notes/:id
 * Update an existing lesson note.
 */
lessonNotesRouter.put(
  '/:id',
  authenticateUser,
  requirePermission('lesson_notes.create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const targetSchoolId = user?.schoolId || (req.body.schoolId as string);

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
        userId: user?.id,
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
        message: error?.message || 'Failed to update lesson note.',
      });
    }
  }
);

/**
 * DELETE /api/v1/lesson-notes/:id
 * Delete a lesson note permanently with tenant protection.
 */
lessonNotesRouter.delete(
  '/:id',
  authenticateUser,
  requirePermission('lesson_notes.create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const targetSchoolId = user?.schoolId || (req.query.schoolId as string);

      if (!targetSchoolId) {
        res.status(400).json({ success: false, error: 'MISSING_SCHOOL_CONTEXT' });
        return;
      }

      const deleted = await lessonNoteRepository.deleteLessonNote(id, targetSchoolId);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Lesson note not found or access denied.' });
        return;
      }

      await lessonNoteRepository.recordAuditLog({
        schoolId: targetSchoolId,
        lessonNoteId: id,
        userId: user?.id,
        action: 'NOTE_DELETED',
        details: { id },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Lesson note removed permanently from the curriculum registry.',
      });
    } catch (error: any) {
      console.error('[LessonNotesAPI] Error deleting lesson note:', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: error?.message || 'Failed to delete lesson note.',
      });
    }
  }
);

/**
 * POST /api/v1/lesson-notes/:id/increment-download
 * Increment download counter atomically in PostgreSQL.
 */
lessonNotesRouter.post('/:id/increment-download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const downloadCount = await lessonNoteRepository.incrementDownloadCount(id);

    res.json({
      success: true,
      downloadCount,
    });
  } catch (error: any) {
    console.error('[LessonNotesAPI] Error incrementing download count:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error?.message || 'Failed to increment download counter.',
    });
  }
});

/**
 * POST /api/v1/lesson-notes/:id/feedback
 * Submit a parent question or feedback regarding a lesson note.
 */
lessonNotesRouter.post('/:id/feedback', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parentName, studentName, guardianPhone, question } = req.body || {};

    if (!parentName || !question) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Parent name and question content are required.',
      });
      return;
    }

    // Verify note exists in PostgreSQL
    const note = await lessonNoteRepository.getLessonNoteById(id);
    if (!note) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'The requested lesson note does not exist.',
      });
      return;
    }

    const inquiry = await lessonInquiryRepository.createInquiry({
      schoolId: note.school_id,
      organizationId: note.organization_id || undefined,
      lessonNoteId: note.id,
      parentName,
      studentName,
      guardianPhone,
      question,
    });

    // Immutable Audit Log
    await lessonNoteRepository.recordAuditLog({
      schoolId: note.school_id,
      organizationId: note.organization_id,
      lessonNoteId: note.id,
      inquiryId: inquiry.id,
      action: 'INQUIRY_SUBMITTED',
      details: {
        parentName,
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
      message: error?.message || 'Failed to submit feedback.',
    });
  }
});

/**
 * GET /api/v1/lesson-notes/:id/feedbacks
 * Retrieve feedback list for a note.
 */
lessonNotesRouter.get('/:id/feedbacks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inquiries = await lessonInquiryRepository.listInquiriesForNote(id);
    res.json({
      success: true,
      data: inquiries.map(mapDbToFeedback),
    });
  } catch (error: any) {
    console.error('[LessonNotesAPI] Error listing feedback inquiries:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error?.message || 'Failed to list inquiries.',
    });
  }
});

/**
 * POST /api/v1/lesson-notes/inquiries/:id/reply
 * Teacher or educator responds to a parent inquiry.
 * Protected by authentication.
 */
lessonNotesRouter.post(
  '/inquiries/:id/reply',
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'UNAUTHENTICATED' });
        return;
      }

      const { id } = req.params;
      const { reply } = req.body || {};

      if (!reply || !reply.trim()) {
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

      // Check tenant isolation
      if (!user.isSuperAdmin && !user.isStateOfficer && user.schoolId && inquiry.school_id !== user.schoolId) {
        res.status(403).json({
          success: false,
          error: 'CROSS_SCHOOL_UNAUTHORIZED',
          message: 'Cannot reply to inquiries for a different school.',
        });
        return;
      }

      const updated = await lessonInquiryRepository.respondToInquiry(id, inquiry.school_id, {
        reply: reply.trim(),
        repliedByStaffId: user.id,
        repliedByUserId: user.id,
        repliedByName: user.fullName || 'Educator',
        status: 'Answered',
      });

      if (!updated) {
        res.status(500).json({ success: false, error: 'UPDATE_FAILED' });
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
        message: error?.message || 'Failed to reply to inquiry.',
      });
    }
  }
);
