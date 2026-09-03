/**
 * BummptEducation — Terminal Examinations API Routes (/api/v1/examinations)
 * 
 * Server-authoritative endpoints for terminal examination scores,
 * 60% exam weighting, grade recalculation, and multi-tenant isolation.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { examinationRepository } from '../../db/repositories/examination.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const examinationsRouter = Router();

/**
 * GET /api/v1/examinations
 * Retrieves examination records matching query parameters.
 */
examinationsRouter.get(
  '/',
  authenticateUser,
  requirePermission('assessments.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      let targetSchoolId = (req.query.school_id as string) || (req.query.schoolId as string);

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId || '';
      }

      if (!targetSchoolId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'school_id query parameter is required for global authorities.',
        });
        return;
      }

      const exams = await examinationRepository.findExaminations(targetSchoolId, {
        studentId: (req.query.student_id as string) || (req.query.studentId as string),
        classId: (req.query.class_id as string) || (req.query.classId as string),
        subjectId: (req.query.subject_id as string) || (req.query.subjectId as string),
        academicTermId: (req.query.term_id as string) || (req.query.academic_term_id as string),
        academicSessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
      });

      res.json({
        success: true,
        count: exams.length,
        data: exams,
      });
    } catch (error: any) {
      console.error('[ExaminationsAPI] Failed to retrieve examinations:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve examination records.',
      });
    }
  }
);

/**
 * POST /api/v1/examinations
 * Records a terminal examination score for a student.
 */
examinationsRouter.post(
  '/',
  authenticateUser,
  requirePermission('assessments.enter'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        school_id,
        schoolId,
        student_id,
        studentId,
        class_id,
        classId,
        subject_id,
        subjectId,
        academic_session_id,
        academicSessionId,
        academic_term_id,
        academicTermId,
        term_id,
        score,
        max_score,
        maxScore,
        exam_date,
        examDate,
      } = req.body;

      let targetSchoolId = school_id || schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId;
      }

      const targetStudentId = student_id || studentId;
      const targetClassId = class_id || classId;
      const targetSubjectId = subject_id || subjectId;
      const targetTermId = academic_term_id || academicTermId || term_id;
      const targetSessionId = academic_session_id || academicSessionId;

      if (!targetSchoolId || !targetStudentId || !targetClassId || !targetSubjectId || !targetTermId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'student_id, class_id, subject_id, and academic_term_id are required.',
        });
        return;
      }

      if (score === undefined || score === null) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCORE',
          message: 'score is required.',
        });
        return;
      }

      const numScore = Number(score);
      const numMaxScore = (max_score !== undefined || maxScore !== undefined) ? Number(max_score ?? maxScore) : 60.0;

      // Score bounds check
      if (isNaN(numScore) || numScore < 0) {
        res.status(400).json({
          success: false,
          error: 'INVALID_SCORE',
          message: 'Examination score cannot be less than zero.',
        });
        return;
      }

      if (numScore > numMaxScore) {
        res.status(400).json({
          success: false,
          error: 'SCORE_EXCEEDS_MAX',
          message: `Examination score (${numScore}) exceeds the maximum permissible score (${numMaxScore}).`,
        });
        return;
      }

      const record = await examinationRepository.recordExaminationScore({
        schoolId: targetSchoolId,
        studentId: targetStudentId,
        classId: targetClassId,
        subjectId: targetSubjectId,
        academicSessionId: targetSessionId || null,
        academicTermId: targetTermId,
        score: numScore,
        maxScore: numMaxScore,
        examDate: exam_date || examDate || null,
        recordedByUserId: req.user?.id || null,
      });

      res.status(201).json({
        success: true,
        message: 'Examination score recorded successfully.',
        data: record,
      });
    } catch (error: any) {
      console.error('[ExaminationsAPI] Failed to record examination:', error);

      if (
        error.message?.includes('CROSS_SCHOOL') ||
        error.message?.includes('INVALID_SCORE') ||
        error.message?.includes('SCORE_EXCEEDS_MAX') ||
        error.message?.includes('NOT_FOUND') ||
        error.message?.includes('MISMATCH')
      ) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_FAILED',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to record examination score.',
      });
    }
  }
);

/**
 * PATCH /api/v1/examinations/:id
 * Updates an existing examination score.
 */
examinationsRouter.patch(
  '/:id',
  authenticateUser,
  requirePermission('assessments.edit'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { score, max_score, maxScore, exam_date, examDate } = req.body;

      if (score === undefined) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCORE',
          message: 'score is required for update.',
        });
        return;
      }

      const callerSchoolId = (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) 
        ? req.user?.schoolId 
        : undefined;

      const updated = await examinationRepository.updateExaminationScore(
        id,
        {
          score: Number(score),
          maxScore: (max_score !== undefined || maxScore !== undefined) ? Number(max_score ?? maxScore) : undefined,
          examDate: exam_date || examDate || null,
        },
        callerSchoolId
      );

      res.json({
        success: true,
        message: 'Examination score updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[ExaminationsAPI] Failed to update examination:', error);
      if (
        error.message?.includes('CROSS_SCHOOL') ||
        error.message?.includes('INVALID_SCORE') ||
        error.message?.includes('SCORE_EXCEEDS_MAX') ||
        error.message?.includes('NOT_FOUND')
      ) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_FAILED',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update examination score.',
      });
    }
  }
);
