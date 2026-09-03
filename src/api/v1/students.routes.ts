/**
 * BummptEducation — Students API Routes (/api/v1/students)
 * 
 * Server-authoritative endpoints for Student & Pupil Registry management,
 * institutional admission numbers, class placements, parent/guardian links,
 * and longitudinal academic enrollment histories.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { StudentRepository } from '../../db/repositories/student.repository';
import { ClassRepository } from '../../db/repositories/class.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const studentsRouter = Router();
const studentRepo = new StudentRepository();
const classRepo = new ClassRepository();

/**
 * GET /api/v1/students
 * Lists student records within the caller's authorized tenant scope.
 * Supports filtering by class_id, arm, status, and search query.
 */
studentsRouter.get(
  '/',
  authenticateUser,
  requirePermission('students.view'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const offset = (page - 1) * limit;

      const whereClauses: string[] = [];
      const params: any[] = [];

      // Multi-school authority filtering
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        params.push(req.user?.schoolId);
        whereClauses.push(`school_id = $${params.length}`);
      } else if (req.query.school_id || req.query.schoolId) {
        params.push(req.query.school_id || req.query.schoolId);
        whereClauses.push(`school_id = $${params.length}`);
      }

      if (req.query.class_id || req.query.classId) {
        params.push(req.query.class_id || req.query.classId);
        whereClauses.push(`current_class_id = $${params.length}`);
      }

      if (req.query.arm) {
        params.push(req.query.arm);
        whereClauses.push(`arm = $${params.length}`);
      }

      if (req.query.status) {
        params.push(req.query.status);
        whereClauses.push(`status = $${params.length}`);
      }

      if (req.query.search) {
        params.push(`%${req.query.search}%`);
        whereClauses.push(
          `(full_name ILIKE $${params.length} OR admission_number ILIKE $${params.length} OR guardian_name ILIKE $${params.length})`
        );
      }

      const customWhere = whereClauses.length > 0 ? whereClauses.join(' AND ') : undefined;

      const result = await studentRepo.findPaginated(customWhere, params, {
        limit,
        offset,
        orderBy: 'created_at DESC',
        tenantContext: req.tenantContext,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / limit),
          hasMore: result.hasMore,
        },
      });
    } catch (error: any) {
      console.error('[StudentsAPI] Failed to fetch students list:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_STUDENTS_FAILED',
        message: 'Failed to retrieve student records.',
      });
    }
  }
);

/**
 * GET /api/v1/students/:id
 * Retrieves a single student by ID with joined classroom details.
 * Enforces strict multi-tenant isolation.
 */
studentsRouter.get(
  '/:id',
  authenticateUser,
  requirePermission('students.view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const student = await studentRepo.findByIdWithClass(id);

      if (!student) {
        res.status(404).json({
          success: false,
          error: 'STUDENT_NOT_FOUND',
          message: `Student with ID ${id} not found.`,
        });
        return;
      }

      // School-level tenant check
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (student.school_id !== req.user?.schoolId) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: Cannot view student record belonging to another school.',
          });
          return;
        }
      }

      res.json({
        success: true,
        data: student,
      });
    } catch (error: any) {
      console.error('[StudentsAPI] Failed to fetch student details:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_STUDENT_FAILED',
        message: 'Failed to retrieve student details.',
      });
    }
  }
);

/**
 * POST /api/v1/students
 * Registers a new student and creates initial academic enrollment record atomically.
 * Enforces:
 * - Admission number uniqueness per school
 * - Classroom verification (must belong to target school)
 * - Academic session association
 */
studentsRouter.post(
  '/',
  authenticateUser,
  requirePermission('students.create'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body;

      // 1. Resolve Target School
      let targetSchoolId = body.school_id || body.schoolId;
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        targetSchoolId = req.user?.schoolId;
      }

      if (!targetSchoolId) {
        res.status(400).json({
          success: false,
          error: 'MISSING_SCHOOL_ID',
          message: 'Target school_id is required.',
        });
        return;
      }

      // 2. Validate Required Fields
      const admissionNumber = (body.admission_number || body.admissionNumber || '').trim();
      if (!admissionNumber) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Admission number (admission_number) is required.',
        });
        return;
      }

      const fullName = (body.full_name || body.fullName || '').trim();
      const firstName = (body.first_name || body.firstName || '').trim();
      const surname = (body.surname || '').trim();
      if (!fullName && (!firstName || !surname)) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Full name or both first_name and surname are required.',
        });
        return;
      }

      const classId = body.current_class_id || body.currentClassId;
      if (!classId) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Target class ID (current_class_id) is required.',
        });
        return;
      }

      const gender = body.gender || 'Male';
      const dateOfBirth = body.date_of_birth || body.dateOfBirth;
      if (!dateOfBirth) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Date of birth (date_of_birth) is required.',
        });
        return;
      }

      const arm = body.arm || 'secondary';
      const guardianName = (body.guardian_name || body.guardianName || '').trim();
      const guardianPhone = (body.guardian_phone || body.guardianPhone || '').trim();
      if (!guardianName || !guardianPhone) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Guardian name and guardian phone number are required.',
        });
        return;
      }

      // 3. Uniqueness Check: (school_id, admission_number)
      const existing = await studentRepo.findByAdmissionNumber(targetSchoolId, admissionNumber);
      if (existing) {
        res.status(409).json({
          success: false,
          error: 'ADMISSION_NUMBER_EXISTS',
          message: `Admission number '${admissionNumber}' is already in use at this school.`,
        });
        return;
      }

      // 4. Verify Classroom Assignment Belongs to Target School
      const classBelongs = await classRepo.verifyClassBelongsToSchool(classId, targetSchoolId);
      if (!classBelongs) {
        res.status(400).json({
          success: false,
          error: 'CROSS_SCHOOL_CLASS_INVALID',
          message: 'Classroom assignment invalid: Assigned class does not belong to this school.',
        });
        return;
      }

      // 5. Create Student with Enrollment Atomically
      const result = await studentRepo.createStudentWithEnrollment({
        schoolId: targetSchoolId,
        admissionNumber,
        firstName: firstName || null,
        middleName: body.middle_name || body.middleName || null,
        surname: surname || null,
        fullName: fullName || `${surname} ${firstName}`.trim(),
        gender,
        dateOfBirth,
        currentClassId: classId,
        currentAcademicSessionId: body.current_academic_session_id || body.currentAcademicSessionId || null,
        currentAcademicTermId: body.current_academic_term_id || body.currentAcademicTermId || null,
        arm,
        house: body.house || null,
        guardianName,
        guardianPhone,
        guardianEmail: body.guardian_email || body.guardianEmail || null,
        address: body.address || null,
        stateOfOrigin: body.state_of_origin || body.stateOfOrigin || 'Benue',
        dateEnrolled: body.date_enrolled || body.dateEnrolled || new Date().toISOString().split('T')[0],
        status: body.status || 'Active',
        isPrefect: body.is_prefect !== undefined ? Boolean(body.is_prefect) : false,
        prefectRole: body.prefect_role || body.prefectRole || null,
        avatarUrl: body.avatar_url || body.avatarUrl || null,
      });

      res.status(201).json({
        success: true,
        message: 'Student registered and enrolled successfully.',
        data: result.student,
        enrollment: result.enrollment,
      });
    } catch (error: any) {
      console.error('[StudentsAPI] Failed to register student:', error);
      res.status(500).json({
        success: false,
        error: 'CREATE_STUDENT_FAILED',
        message: error.message || 'Failed to register student.',
      });
    }
  }
);

/**
 * PATCH /api/v1/students/:id
 * Updates an existing student record.
 * Strict multi-tenant isolation: cannot update student of another school.
 */
studentsRouter.patch(
  '/:id',
  authenticateUser,
  requirePermission('students.update'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const body = req.body;

      const existing = await studentRepo.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'STUDENT_NOT_FOUND',
          message: `Student with ID ${id} not found.`,
        });
        return;
      }

      // School-level tenant check
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (existing.school_id !== req.user?.schoolId) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: Cannot update student record belonging to another school.',
          });
          return;
        }
      }

      // If updating class, verify class belongs to this school
      const newClassId = body.current_class_id !== undefined ? body.current_class_id : body.currentClassId;
      if (newClassId) {
        const classBelongs = await classRepo.verifyClassBelongsToSchool(newClassId, existing.school_id);
        if (!classBelongs) {
          res.status(400).json({
            success: false,
            error: 'CROSS_SCHOOL_CLASS_INVALID',
            message: 'Classroom assignment invalid: Assigned class does not belong to this school.',
          });
          return;
        }
      }

      const updated = await studentRepo.updateStudent(
        id,
        {
          firstName: body.first_name || body.firstName,
          middleName: body.middle_name || body.middleName,
          surname: body.surname,
          fullName: body.full_name || body.fullName,
          currentClassId: newClassId,
          status: body.status,
          guardianName: body.guardian_name || body.guardianName,
          guardianPhone: body.guardian_phone || body.guardianPhone,
          guardianEmail: body.guardian_email || body.guardianEmail,
          address: body.address,
          house: body.house,
          isPrefect: body.is_prefect !== undefined ? Boolean(body.is_prefect) : undefined,
          prefectRole: body.prefect_role || body.prefectRole,
        },
        { tenantContext: req.tenantContext }
      );

      res.json({
        success: true,
        message: 'Student record updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[StudentsAPI] Failed to update student record:', error);
      res.status(500).json({
        success: false,
        error: 'UPDATE_STUDENT_FAILED',
        message: 'Failed to update student record.',
      });
    }
  }
);
