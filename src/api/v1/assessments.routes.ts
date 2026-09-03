/**
 * BummptEducation — Continuous Assessments API Routes (/api/v1/assessments)
 * 
 * Server-authoritative endpoints for continuous assessments (CA),
 * 40% weighting components, score entry validation, and multi-tenant isolation.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { assessmentRepository } from '../../db/repositories/assessment.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const assessmentsRouter = Router();

/**
 * GET /api/v1/assessments
 * Retrieves continuous assessments matching query parameters.
 */
assessmentsRouter.get(
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

      const assessments = await assessmentRepository.findAssessments(targetSchoolId, {
        studentId: (req.query.student_id as string) || (req.query.studentId as string),
        classId: (req.query.class_id as string) || (req.query.classId as string),
        subjectId: (req.query.subject_id as string) || (req.query.subjectId as string),
        academicTermId: (req.query.term_id as string) || (req.query.academic_term_id as string),
        academicSessionId: (req.query.session_id as string) || (req.query.academic_session_id as string),
      });

      res.json({
        success: true,
        count: assessments.length,
        data: assessments,
      });
    } catch (error: any) {
      console.error('[AssessmentsAPI] Failed to retrieve assessments:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve assessment records.',
      });
    }
  }
);

/**
 * POST /api/v1/assessments
 * Records or updates a continuous assessment score for a student.
 */
assessmentsRouter.post(
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
        assessment_type,
        assessmentType,
        score,
        max_score,
        maxScore,
        weight_percentage,
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
      const targetType = assessment_type || assessmentType;

      if (!targetSchoolId || !targetStudentId || !targetClassId || !targetSubjectId || !targetTermId || !targetType) {
        res.status(400).json({
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'student_id, class_id, subject_id, academic_term_id, assessment_type, and score are required.',
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
      const numMaxScore = (max_score !== undefined || maxScore !== undefined) ? Number(max_score ?? maxScore) : 10.0;

      // Validation bounds
      if (isNaN(numScore) || numScore < 0) {
        res.status(400).json({
          success: false,
          error: 'INVALID_SCORE',
          message: 'Assessment score cannot be less than zero.',
        });
        return;
      }

      if (numScore > numMaxScore) {
        res.status(400).json({
          success: false,
          error: 'SCORE_EXCEEDS_MAX',
          message: `Assessment score (${numScore}) exceeds the maximum permissible score (${numMaxScore}).`,
        });
        return;
      }

      const record = await assessmentRepository.recordContinuousAssessment({
        schoolId: targetSchoolId,
        studentId: targetStudentId,
        classId: targetClassId,
        subjectId: targetSubjectId,
        academicSessionId: targetSessionId || null,
        academicTermId: targetTermId,
        assessmentType: targetType,
        score: numScore,
        maxScore: numMaxScore,
        weightPercentage: weight_percentage ? Number(weight_percentage) : 10.0,
        recordedByUserId: req.user?.id || null,
      });

      res.status(201).json({
        success: true,
        message: 'Continuous assessment score recorded successfully.',
        data: record,
      });
    } catch (error: any) {
      console.error('[AssessmentsAPI] Failed to record assessment:', error);

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
        message: error.message || 'Failed to record continuous assessment score.',
      });
    }
  }
);

/**
 * PATCH /api/v1/assessments/:id
 * Updates an existing continuous assessment score.
 */
assessmentsRouter.patch(
  '/:id',
  authenticateUser,
  requirePermission('assessments.edit'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { score, max_score, maxScore } = req.body;

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

      const updated = await assessmentRepository.updateAssessmentScore(
        id,
        {
          score: Number(score),
          maxScore: (max_score !== undefined || maxScore !== undefined) ? Number(max_score ?? maxScore) : undefined,
        },
        callerSchoolId
      );

      res.json({
        success: true,
        message: 'Assessment score updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[AssessmentsAPI] Failed to update assessment:', error);
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
        message: error.message || 'Failed to update assessment score.',
      });
    }
  }
);
