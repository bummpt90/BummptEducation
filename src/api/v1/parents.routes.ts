/**
-- ============================================================================
-- BummptEducation — Parent & Guardian API Routes (/api/v1/parents)
-- Phase 8B: Server-Authoritative Parent Identity & Student Report Access
-- ============================================================================
*/

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { parentRepository } from '../../db/repositories/parent.repository';
import { reportCardRepository } from '../../db/repositories/reportCard.repository';
import { query } from '../../db/client';
import type { AuthenticatedRequest } from '../../auth/types';

export const parentsRouter = Router();

/**
 * GET /api/v1/parents/profile
 * Retrieves authenticated parent's profile
 */
parentsRouter.get(
  '/profile',
  authenticateUser,
  requirePermission('parents.view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'UNAUTHENTICATED' });
        return;
      }

      const parent = await parentRepository.findParentByUserId(req.user.id);
      if (!parent) {
        res.status(404).json({
          success: false,
          error: 'PARENT_PROFILE_NOT_FOUND',
          message: 'No registered parent profile found for the authenticated user.',
        });
        return;
      }

      res.json({
        success: true,
        data: parent,
      });
    } catch (error: any) {
      console.error('[ParentsAPI] Profile fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve parent profile.',
      });
    }
  }
);

/**
 * GET /api/v1/parents/students
 * Retrieves all verified, active linked students for the authenticated parent.
 * Strictly enforces parent identity from req.user (no client-supplied parentId parameter).
 */
parentsRouter.get(
  '/students',
  authenticateUser,
  requirePermission('parents.view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'UNAUTHENTICATED' });
        return;
      }

      const parent = await parentRepository.findParentByUserId(req.user.id);
      if (!parent) {
        // If user has role parent but no profile yet, return empty list
        if (req.user.role === 'parent') {
          res.json({ success: true, data: [] });
          return;
        }

        // For administrators inspecting, if parentId query param supplied
        const queryParentId = req.query.parentId as string;
        if (queryParentId && (req.user.isSuperAdmin || req.user.role === 'principal')) {
          const linked = await parentRepository.getLinkedStudents(queryParentId, req.user.schoolId);
          res.json({ success: true, data: linked });
          return;
        }

        res.status(404).json({
          success: false,
          error: 'PARENT_NOT_FOUND',
          message: 'Authenticated user is not linked to a parent record.',
        });
        return;
      }

      const students = await parentRepository.getLinkedStudents(parent.id, parent.schoolId || undefined);

      res.json({
        success: true,
        data: students,
      });
    } catch (error: any) {
      console.error('[ParentsAPI] Linked students fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve linked students.',
      });
    }
  }
);

/**
 * GET /api/v1/parents/students/:studentId/reports
 * Retrieves available published report terms for a linked student.
 * Strictly checks parent-student relationship to prevent IDOR!
 */
parentsRouter.get(
  '/students/:studentId/reports',
  authenticateUser,
  requirePermission('parents.view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const studentId = req.params.studentId;

      // IDOR Verification for parents
      if (req.user?.role === 'parent') {
        const { isLinked } = await parentRepository.verifyParentStudentRelationshipByUserId(
          req.user.id,
          studentId
        );
        if (!isLinked) {
          // Log unauthorized attempt
          await parentRepository.logParentAccess({
            userId: req.user.id,
            studentId,
            action: 'REPORT_VIEW_UNAUTHORIZED',
            status: 'BLOCKED',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            details: { reason: 'UNLINKED_PARENT_STUDENT_ATTEMPT' },
          });

          res.status(403).json({
            success: false,
            error: 'FORBIDDEN_RELATIONSHIP',
            message: 'You are not authorized to view academic records for this student.',
          });
          return;
        }
      }

      // Verify student belongs to tenant
      const stuRes = await query<{ school_id: string }>(
        'SELECT school_id FROM students WHERE id = $1 LIMIT 1;',
        [studentId]
      );
      if (!stuRes.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'STUDENT_NOT_FOUND',
          message: 'Student record not found.',
        });
        return;
      }

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (req.user?.schoolId && stuRes.rows[0].school_id !== req.user.schoolId) {
          res.status(403).json({
            success: false,
            error: 'CROSS_SCHOOL_VIOLATION',
            message: 'Access denied: Student belongs to another school tenant.',
          });
          return;
        }
      }

      const publishedTerms = await reportCardRepository.listPublishedTermsForStudent(studentId);

      res.json({
        success: true,
        data: publishedTerms,
      });
    } catch (error: any) {
      console.error('[ParentsAPI] Published terms fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve published report terms.',
      });
    }
  }
);

/**
 * GET /api/v1/parents/students/:studentId/report
 * Retrieves the full published report card for parent viewing.
 * Requirements:
 * 1. Authenticated user
 * 2. Active parent-student link (if user is parent)
 * 3. Tenant school boundary check
 * 4. Report must be approved & published (is_parent_viewable = TRUE)
 */
parentsRouter.get(
  '/students/:studentId/report',
  authenticateUser,
  requirePermission('parents.view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const studentId = req.params.studentId;
      const termId = req.query.termId as string | undefined;

      // 1. IDOR Verification for parents
      let parentId: string | undefined;
      if (req.user?.role === 'parent') {
        const { isLinked, parent } = await parentRepository.verifyParentStudentRelationshipByUserId(
          req.user.id,
          studentId
        );
        if (!isLinked) {
          await parentRepository.logParentAccess({
            userId: req.user.id,
            studentId,
            action: 'REPORT_VIEW_UNAUTHORIZED',
            status: 'BLOCKED',
            termId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            details: { reason: 'UNLINKED_PARENT_STUDENT_ATTEMPT' },
          });

          res.status(403).json({
            success: false,
            error: 'FORBIDDEN_RELATIONSHIP',
            message: 'You are not authorized to view academic records for this student.',
          });
          return;
        }
        parentId = parent?.id;
      }

      // 2. Tenant Boundary Check
      const stuRes = await query<{ school_id: string; organization_id: string }>(
        'SELECT school_id, organization_id FROM students WHERE id = $1 LIMIT 1;',
        [studentId]
      );
      if (!stuRes.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'STUDENT_NOT_FOUND',
          message: 'Student record not found.',
        });
        return;
      }

      const studentSchoolId = stuRes.rows[0].school_id;

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (req.user?.schoolId && studentSchoolId !== req.user.schoolId) {
          res.status(403).json({
            success: false,
            error: 'CROSS_SCHOOL_VIOLATION',
            message: 'Access denied: Student belongs to another school tenant.',
          });
          return;
        }
      }

      // 3. Server-Authoritative Publication Gate
      const result = await reportCardRepository.getPublishedReportCard(
        studentId,
        termId,
        studentSchoolId
      );

      if (!result.isPublished || !result.reportCard) {
        await parentRepository.logParentAccess({
          schoolId: studentSchoolId,
          organizationId: stuRes.rows[0].organization_id,
          parentId,
          studentId,
          userId: req.user?.id,
          action: 'REPORT_VIEW_REJECTED',
          status: 'BLOCKED',
          termId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          details: { reason: result.reason || 'UNPUBLISHED_REPORT' },
        });

        res.status(403).json({
          success: false,
          error: 'REPORT_NOT_PUBLISHED',
          message: 'This report card is currently in draft or has not been approved and published for parent access.',
        });
        return;
      }

      // 4. Successful Report Retrieval — Audit Log
      await parentRepository.logParentAccess({
        schoolId: studentSchoolId,
        organizationId: stuRes.rows[0].organization_id,
        parentId,
        studentId,
        userId: req.user?.id,
        action: 'REPORT_VIEWED',
        status: 'SUCCESS',
        termId: result.reportCard.term,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: result.reportCard,
      });
    } catch (error: any) {
      console.error('[ParentsAPI] Report retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve student report card.',
      });
    }
  }
);

/**
 * POST /api/v1/parents/verify-pin
 * Server-authoritative Parent Portal PIN Verification Desk.
 * Accepts: { admissionNumber, pin, schoolId? }
 * Validates PIN with Argon2id against PostgreSQL parent_access_pins.
 * Implements rate limiting and lockout protection.
 * Returns authoritative student summary and published report status.
 */
parentsRouter.post('/verify-pin', async (req, res) => {
  try {
    const { admissionNumber, pin, schoolId } = req.body;

    if (!admissionNumber || typeof admissionNumber !== 'string' || !pin || typeof pin !== 'string') {
      res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Student Admission Number and Parent Access PIN are required.',
      });
      return;
    }

    const verification = await parentRepository.verifyPinByAdmissionNumber(
      admissionNumber.trim(),
      pin.trim(),
      schoolId || undefined
    );

    if (!verification.success) {
      // Audit log failed attempt
      await parentRepository.logParentAccess({
        studentId: verification.studentId,
        action: verification.error === 'PIN_LOCKED' ? 'PIN_LOCKED' : 'PIN_VERIFY_FAILED',
        status: 'FAILED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { admissionNumber, reason: verification.error },
      });

      const statusCode = verification.error === 'PIN_LOCKED' ? 429 : 401;
      res.status(statusCode).json({
        success: false,
        error: verification.error,
        message: verification.message,
        attemptsRemaining: verification.attemptsRemaining,
        lockedUntil: verification.lockedUntil,
      });
      return;
    }

    // PIN is valid! Check if report card is published
    const student = verification.student!;
    const publishedResult = await reportCardRepository.getPublishedReportCard(
      student.id,
      undefined,
      student.schoolId
    );

    // Audit log successful verification
    await parentRepository.logParentAccess({
      schoolId: student.schoolId,
      studentId: student.id,
      parentId: verification.parentId,
      action: 'PIN_VERIFY_SUCCESS',
      status: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { admissionNumber },
    });

    res.json({
      success: true,
      verified: true,
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        fullName: student.fullName,
        gender: student.gender,
        schoolId: student.schoolId,
        schoolName: student.schoolName,
        currentClassId: student.currentClassId,
        className: student.className,
        classLevel: student.classLevel,
        arm: student.arm,
        house: student.house,
        status: student.status,
      },
      isPublished: publishedResult.isPublished,
      publishedReport: publishedResult.isPublished ? publishedResult.reportCard : undefined,
    });
  } catch (error: any) {
    console.error('[ParentsAPI] PIN verification error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'Failed to verify parent access PIN.',
    });
  }
});

/**
 * ============================================================================
 * Administrative Endpoints (Principal, Admissions Officer, Super Admin)
 * ============================================================================
 */

/**
 * POST /api/v1/parents/links
 * Creates a verified parent-student link (Administrator controlled)
 */
parentsRouter.post(
  '/links',
  authenticateUser,
  requirePermission('parents.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { parentId, studentId, relationship, isPrimary, notes } = req.body;

      if (!parentId || !studentId || !relationship) {
        res.status(400).json({
          success: false,
          error: 'INVALID_INPUT',
          message: 'parentId, studentId, and relationship are required.',
        });
        return;
      }

      // Determine target school
      let targetSchoolId = req.user?.schoolId;
      if (req.user?.isSuperAdmin && req.body.schoolId) {
        targetSchoolId = req.body.schoolId;
      }

      if (!targetSchoolId) {
        // Look up student's school
        const stuRes = await query<{ school_id: string; organization_id: string }>(
          'SELECT school_id, organization_id FROM students WHERE id = $1 LIMIT 1;',
          [studentId]
        );
        if (!stuRes.rows[0]) {
          res.status(404).json({ success: false, error: 'STUDENT_NOT_FOUND' });
          return;
        }
        targetSchoolId = stuRes.rows[0].school_id;
      }

      // Verify parent exists
      const parent = await parentRepository.findParentById(parentId);
      if (!parent) {
        res.status(404).json({ success: false, error: 'PARENT_NOT_FOUND' });
        return;
      }

      const link = await parentRepository.linkStudentToParent({
        parentId,
        studentId,
        relationship,
        isPrimaryGuardian: isPrimary,
        schoolId: targetSchoolId,
        organizationId: parent.organizationId || req.user?.schoolId || '',
        createdBy: req.user?.id,
        notes,
      });

      await parentRepository.logParentAccess({
        schoolId: targetSchoolId,
        parentId,
        studentId,
        userId: req.user?.id,
        action: 'LINK_CREATED',
        status: 'SUCCESS',
        details: { relationship, isPrimary },
      });

      res.status(201).json({
        success: true,
        data: link,
      });
    } catch (error: any) {
      console.error('[ParentsAPI] Create link error:', error);
      res.status(error.message?.includes('CROSS_SCHOOL') ? 403 : 500).json({
        success: false,
        error: error.message?.includes('CROSS_SCHOOL') ? 'CROSS_SCHOOL_VIOLATION' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to create parent-student link.',
      });
    }
  }
);

/**
 * DELETE /api/v1/parents/links/:id
 * Revokes a parent-student link (Administrator controlled)
 */
parentsRouter.delete(
  '/links/:id',
  authenticateUser,
  requirePermission('parents.manage'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const linkId = req.params.id;

      const linkRes = await query<{ id: string; school_id: string; parent_id: string; student_id: string }>(
        'SELECT id, school_id, parent_id, student_id FROM parent_student_links WHERE id = $1 LIMIT 1;',
        [linkId]
      );

      if (!linkRes.rows[0]) {
        res.status(404).json({ success: false, error: 'LINK_NOT_FOUND' });
        return;
      }

      const link = linkRes.rows[0];

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (link.school_id && link.school_id !== req.user?.schoolId) {
          res.status(403).json({ success: false, error: 'CROSS_SCHOOL_VIOLATION' });
          return;
        }
      }

      await parentRepository.revokeParentStudentLink(linkId, req.user!.id);

      await parentRepository.logParentAccess({
        schoolId: link.school_id,
        parentId: link.parent_id,
        studentId: link.student_id,
        userId: req.user?.id,
        action: 'LINK_REVOKED',
        status: 'SUCCESS',
      });

      res.json({
        success: true,
        message: 'Parent-student link successfully revoked.',
      });
    } catch (error: any) {
      console.error('[ParentsAPI] Revoke link error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to revoke link.',
      });
    }
  }
);

/**
 * POST /api/v1/parents/pins
 * Issues or resets a parent access PIN with Argon2id hashing (Administrator controlled)
 */
parentsRouter.post(
  '/pins',
  authenticateUser,
  requirePermission('parents.manage'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { studentId, parentPhone, pin, parentId } = req.body;

      if (!studentId || !parentPhone || !pin) {
        res.status(400).json({
          success: false,
          error: 'INVALID_INPUT',
          message: 'studentId, parentPhone, and pin are required.',
        });
        return;
      }

      // Check student belongs to target school
      const stuRes = await query<{ school_id: string; organization_id: string }>(
        'SELECT school_id, organization_id FROM students WHERE id = $1 LIMIT 1;',
        [studentId]
      );
      if (!stuRes.rows[0]) {
        res.status(404).json({ success: false, error: 'STUDENT_NOT_FOUND' });
        return;
      }

      const targetSchoolId = stuRes.rows[0].school_id;

      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (targetSchoolId !== req.user?.schoolId) {
          res.status(403).json({ success: false, error: 'CROSS_SCHOOL_VIOLATION' });
          return;
        }
      }

      const result = await parentRepository.setParentPin({
        studentId,
        parentPhone,
        plainPin: pin,
        schoolId: targetSchoolId,
        organizationId: stuRes.rows[0].organization_id,
        parentId,
        createdBy: req.user?.id,
      });

      await parentRepository.logParentAccess({
        schoolId: targetSchoolId,
        parentId,
        studentId,
        userId: req.user?.id,
        action: 'PIN_RESET',
        status: 'SUCCESS',
      });

      res.status(201).json({
        success: true,
        message: 'Parent access PIN created and hashed with Argon2id successfully.',
        data: {
          id: result.id,
          studentId: result.studentId,
        },
      });
    } catch (error: any) {
      console.error('[ParentsAPI] Set PIN error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error.message || 'Failed to issue parent PIN.',
      });
    }
  }
);
