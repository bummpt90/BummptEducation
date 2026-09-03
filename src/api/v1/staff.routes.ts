/**
 * BummptEducation — Staff API Routes (/api/v1/staff)
 * 
 * Server-authoritative endpoints for Staff & Faculty Registry management,
 * institutional staff numbers, employment designations, and classroom assignments.
 */

import { Router } from 'express';
import { authenticateUser, requirePermission, requireSchoolScope } from '../../auth/middleware';
import { StaffRepository } from '../../db/repositories/staff.repository';
import { ClassRepository } from '../../db/repositories/class.repository';
import type { AuthenticatedRequest } from '../../auth/types';

export const staffRouter = Router();
const staffRepo = new StaffRepository();
const classRepo = new ClassRepository();

/**
 * GET /api/v1/staff
 * Lists staff members within authorized tenant scope.
 * Supports filtering by role, staff_type, department, status, and search query.
 */
staffRouter.get(
  '/',
  authenticateUser,
  requirePermission('staff.view'),
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

      if (req.query.staff_type) {
        params.push(req.query.staff_type);
        whereClauses.push(`staff_type = $${params.length}`);
      }

      if (req.query.role) {
        params.push(req.query.role);
        whereClauses.push(`role = $${params.length}`);
      }

      if (req.query.status) {
        params.push(req.query.status);
        whereClauses.push(`status = $${params.length}`);
      }

      if (req.query.is_active !== undefined) {
        const isActive = req.query.is_active === 'true';
        params.push(isActive);
        whereClauses.push(`is_active = $${params.length}`);
      }

      if (req.query.search) {
        params.push(`%${req.query.search}%`);
        whereClauses.push(
          `(full_name ILIKE $${params.length} OR staff_id_number ILIKE $${params.length} OR designation ILIKE $${params.length})`
        );
      }

      const customWhere = whereClauses.length > 0 ? whereClauses.join(' AND ') : undefined;

      const result = await staffRepo.findPaginated(customWhere, params, {
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
      console.error('[StaffAPI] Failed to fetch staff list:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_STAFF_FAILED',
        message: 'Failed to retrieve staff records.',
      });
    }
  }
);

/**
 * GET /api/v1/staff/:id
 * Retrieves a single staff member by ID.
 * Strict multi-tenant isolation: cannot view staff of another school.
 */
staffRouter.get(
  '/:id',
  authenticateUser,
  requirePermission('staff.view'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const staff = await staffRepo.findById(id);

      if (!staff) {
        res.status(404).json({
          success: false,
          error: 'STAFF_NOT_FOUND',
          message: `Staff record with ID ${id} not found.`,
        });
        return;
      }

      // School-level tenant check
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (staff.school_id !== req.user?.schoolId) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: Cannot view staff record belonging to another school.',
          });
          return;
        }
      }

      res.json({
        success: true,
        data: staff,
      });
    } catch (error: any) {
      console.error('[StaffAPI] Failed to fetch staff details:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_STAFF_FAILED',
        message: 'Failed to retrieve staff record details.',
      });
    }
  }
);

/**
 * POST /api/v1/staff
 * Creates a new staff member record in the institutional registry.
 * Validates uniqueness of staff number within the school.
 * Strictly prevents cross-school classroom assignments.
 */
staffRouter.post(
  '/',
  authenticateUser,
  requirePermission('staff.create'),
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
      const staffNumber = (body.staff_id_number || body.staffIdNumber || '').trim();
      if (!staffNumber) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Staff ID number (staff_id_number) is required.',
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

      const staffType = body.staff_type || body.staffType || 'Teaching';
      const arm = body.arm || 'secondary';
      const designation = body.designation || 'Teacher';
      const role = body.role || 'teacher';
      const assignedClassId = body.assigned_class_id || body.assignedClassId || null;

      // 3. Uniqueness Check: (school_id, staff_id_number)
      const existing = await staffRepo.findByStaffNumber(targetSchoolId, staffNumber);
      if (existing) {
        res.status(409).json({
          success: false,
          error: 'STAFF_NUMBER_EXISTS',
          message: `Staff ID number '${staffNumber}' is already registered in this school.`,
        });
        return;
      }

      // 4. Verify Classroom Assignment Belongs to Target School
      if (assignedClassId) {
        const classBelongs = await classRepo.verifyClassBelongsToSchool(assignedClassId, targetSchoolId);
        if (!classBelongs) {
          res.status(400).json({
            success: false,
            error: 'CROSS_SCHOOL_CLASS_INVALID',
            message: 'Classroom assignment invalid: Assigned class does not belong to this school.',
          });
          return;
        }
      }

      // 5. Create Staff Record
      const createdStaff = await staffRepo.createStaff({
        schoolId: targetSchoolId,
        staffIdNumber: staffNumber,
        firstName: firstName || null,
        middleName: body.middle_name || body.middleName || null,
        surname: surname || null,
        fullName: fullName || `${surname} ${firstName}`.trim(),
        staffType,
        arm,
        designation,
        role,
        departmentId: body.department_id || body.departmentId || null,
        assignedClassId,
        qualifications: body.qualifications || null,
        trcnNumber: body.trcn_number || body.trcnNumber || null,
        status: body.status || 'Active',
        isActive: body.is_active !== undefined ? Boolean(body.is_active) : true,
        phone: body.phone || null,
        email: body.email || null,
        dateJoined: body.date_joined || body.dateJoined || new Date().toISOString().split('T')[0],
      });

      res.status(201).json({
        success: true,
        message: 'Staff record created successfully.',
        data: createdStaff,
      });
    } catch (error: any) {
      console.error('[StaffAPI] Failed to create staff record:', error);
      res.status(500).json({
        success: false,
        error: 'CREATE_STAFF_FAILED',
        message: 'Failed to create staff record.',
      });
    }
  }
);

/**
 * PATCH /api/v1/staff/:id
 * Updates an existing staff member record.
 * Strict multi-tenant isolation: cannot update staff of another school.
 */
staffRouter.patch(
  '/:id',
  authenticateUser,
  requirePermission('staff.update'),
  requireSchoolScope(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const body = req.body;

      const existing = await staffRepo.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'STAFF_NOT_FOUND',
          message: `Staff record with ID ${id} not found.`,
        });
        return;
      }

      // School-level tenant check
      if (!req.user?.isSuperAdmin && !req.user?.isStateOfficer) {
        if (existing.school_id !== req.user?.schoolId) {
          res.status(403).json({
            success: false,
            error: 'TENANT_ISOLATION_VIOLATION',
            message: 'Access denied: Cannot update staff record belonging to another school.',
          });
          return;
        }
      }

      // If updating assigned class, verify class belongs to this school
      const newClassId = body.assigned_class_id !== undefined ? body.assigned_class_id : body.assignedClassId;
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

      const updated = await staffRepo.updateStaff(
        id,
        {
          firstName: body.first_name || body.firstName,
          middleName: body.middle_name || body.middleName,
          surname: body.surname,
          fullName: body.full_name || body.fullName,
          designation: body.designation,
          role: body.role,
          staffType: body.staff_type || body.staffType,
          departmentId: body.department_id !== undefined ? body.department_id : body.departmentId,
          assignedClassId: newClassId,
          qualifications: body.qualifications,
          trcnNumber: body.trcn_number || body.trcnNumber,
          status: body.status,
          isActive: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
          phone: body.phone,
          email: body.email,
        },
        { tenantContext: req.tenantContext }
      );

      res.json({
        success: true,
        message: 'Staff record updated successfully.',
        data: updated,
      });
    } catch (error: any) {
      console.error('[StaffAPI] Failed to update staff record:', error);
      res.status(500).json({
        success: false,
        error: 'UPDATE_STAFF_FAILED',
        message: 'Failed to update staff record.',
      });
    }
  }
);
