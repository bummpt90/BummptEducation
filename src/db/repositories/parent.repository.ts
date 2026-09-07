/**
-- ============================================================================
-- BummptEducation — Parent & Guardian Data Access Layer
-- Phase 8B: Server-Authoritative Parent Identity & Linkage Repository
-- ============================================================================
*/

import type { PoolClient } from 'pg';
import { query } from '../client';
import { hashPassword, verifyPassword } from '../../auth/password';

export interface ParentGuardianRecord {
  id: string;
  userId?: string | null;
  schoolId?: string | null;
  organizationId?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  relationship?: string | null;
  occupation?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedStudentSummary {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  schoolId: string;
  schoolName: string;
  currentClassId?: string;
  className?: string;
  classLevel?: string;
  arm?: string;
  house?: string;
  status: string;
  linkId: string;
  relationship: string;
  isPrimaryGuardian: boolean;
  linkStatus: string;
}

export interface ParentStudentLinkRecord {
  id: string;
  parentId: string;
  studentId: string;
  schoolId?: string;
  organizationId?: string;
  relationship: string;
  isPrimaryGuardian: boolean;
  status: 'Active' | 'Revoked' | 'Pending';
  createdBy?: string;
  createdAt: string;
}

export interface PinVerificationResult {
  success: boolean;
  error?: 'INVALID_PIN' | 'PIN_LOCKED' | 'PIN_NOT_FOUND' | 'STUDENT_NOT_FOUND';
  message?: string;
  isLocked?: boolean;
  attemptsRemaining?: number;
  lockedUntil?: string;
  studentId?: string;
  student?: LinkedStudentSummary;
  parentId?: string;
}

export class ParentRepository {
  /**
   * Look up parent record by authenticated user ID
   */
  async findParentByUserId(userId: string, client?: PoolClient): Promise<ParentGuardianRecord | null> {
    const res = await query<any>(
      `SELECT 
        id,
        user_id AS "userId",
        school_id AS "schoolId",
        organization_id AS "organizationId",
        full_name AS "fullName",
        phone,
        email,
        address,
        relationship,
        occupation,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM parent_guardians
      WHERE user_id = $1 AND is_active = TRUE
      LIMIT 1;`,
      [userId],
      client
    );
    return res.rows[0] || null;
  }

  /**
   * Look up parent record by parent ID
   */
  async findParentById(parentId: string, client?: PoolClient): Promise<ParentGuardianRecord | null> {
    const res = await query<any>(
      `SELECT 
        id,
        user_id AS "userId",
        school_id AS "schoolId",
        organization_id AS "organizationId",
        full_name AS "fullName",
        phone,
        email,
        address,
        relationship,
        occupation,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM parent_guardians
      WHERE id = $1
      LIMIT 1;`,
      [parentId],
      client
    );
    return res.rows[0] || null;
  }

  /**
   * Retrieves all verified, active linked students for an authoritative parent
   */
  async getLinkedStudents(
    parentId: string,
    schoolId?: string,
    client?: PoolClient
  ): Promise<LinkedStudentSummary[]> {
    const sql = `
      SELECT 
        s.id,
        s.admission_number AS "admissionNumber",
        s.full_name AS "fullName",
        s.gender,
        s.date_of_birth::text AS "dateOfBirth",
        s.school_id AS "schoolId",
        sch.name AS "schoolName",
        s.current_class_id AS "currentClassId",
        c.name AS "className",
        c.level AS "classLevel",
        c.arm,
        s.house,
        s.status,
        l.id AS "linkId",
        l.relationship,
        l.is_primary_guardian AS "isPrimaryGuardian",
        l.status AS "linkStatus"
      FROM parent_student_links l
      JOIN students s ON l.student_id = s.id
      JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN classes c ON s.current_class_id = c.id
      WHERE l.parent_id = $1 
        AND l.status = 'Active' 
        AND s.status = 'Active'
        AND ($2::uuid IS NULL OR s.school_id = $2)
      ORDER BY s.full_name ASC;
    `;
    const res = await query<LinkedStudentSummary>(sql, [parentId, schoolId || null], client);
    return res.rows;
  }

  /**
   * Verifies that an authoritative parent has an active relationship link with a student
   */
  async verifyParentStudentRelationship(
    parentId: string,
    studentId: string,
    client?: PoolClient
  ): Promise<ParentStudentLinkRecord | null> {
    const res = await query<any>(
      `SELECT 
        id,
        parent_id AS "parentId",
        student_id AS "studentId",
        school_id AS "schoolId",
        organization_id AS "organizationId",
        relationship,
        is_primary_guardian AS "isPrimaryGuardian",
        status,
        created_by AS "createdBy",
        created_at AS "createdAt"
      FROM parent_student_links
      WHERE parent_id = $1 AND student_id = $2 AND status = 'Active'
      LIMIT 1;`,
      [parentId, studentId],
      client
    );
    return res.rows[0] || null;
  }

  /**
   * Verifies relationship by user ID (resolving parent record first)
   */
  async verifyParentStudentRelationshipByUserId(
    userId: string,
    studentId: string,
    client?: PoolClient
  ): Promise<{ isLinked: boolean; parent?: ParentGuardianRecord; link?: ParentStudentLinkRecord }> {
    const parent = await this.findParentByUserId(userId, client);
    if (!parent) {
      return { isLinked: false };
    }
    const link = await this.verifyParentStudentRelationship(parent.id, studentId, client);
    return {
      isLinked: !!link,
      parent,
      link: link || undefined,
    };
  }

  /**
   * Look up student summary by admission number
   */
  async findStudentByAdmissionNumber(
    admissionNumber: string,
    schoolId?: string,
    client?: PoolClient
  ): Promise<LinkedStudentSummary | null> {
    const sql = `
      SELECT 
        s.id,
        s.admission_number AS "admissionNumber",
        s.full_name AS "fullName",
        s.gender,
        s.date_of_birth::text AS "dateOfBirth",
        s.school_id AS "schoolId",
        sch.name AS "schoolName",
        s.current_class_id AS "currentClassId",
        c.name AS "className",
        c.level AS "classLevel",
        c.arm,
        s.house,
        s.status,
        COALESCE(l.id, gen_random_uuid())::text AS "linkId",
        COALESCE(l.relationship, 'Guardian') AS "relationship",
        COALESCE(l.is_primary_guardian, TRUE) AS "isPrimaryGuardian",
        COALESCE(l.status, 'Active') AS "linkStatus"
      FROM students s
      JOIN schools sch ON s.school_id = sch.id
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN parent_student_links l ON l.student_id = s.id AND l.status = 'Active'
      WHERE LOWER(TRIM(s.admission_number)) = LOWER(TRIM($1))
        AND ($2::uuid IS NULL OR s.school_id = $2)
      LIMIT 1;
    `;
    const res = await query<LinkedStudentSummary>(sql, [admissionNumber, schoolId || null], client);
    return res.rows[0] || null;
  }

  /**
   * Sets or resets a parent access PIN with Argon2id hashing
   */
  async setParentPin(data: {
    studentId: string;
    parentPhone: string;
    plainPin: string;
    schoolId: string;
    organizationId?: string;
    parentId?: string;
    createdBy?: string;
  }, client?: PoolClient): Promise<{ id: string; studentId: string }> {
    const pinHash = await hashPassword(data.plainPin);

    // Upsert into parent_access_pins
    const sql = `
      INSERT INTO parent_access_pins (
        student_id, parent_phone, pin_hash, school_id, organization_id, parent_id,
        failed_attempts, locked_until, is_active, created_by, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, NULL, TRUE, $7, NOW())
      ON CONFLICT (student_id, parent_phone) DO UPDATE SET
        pin_hash = EXCLUDED.pin_hash,
        school_id = EXCLUDED.school_id,
        organization_id = EXCLUDED.organization_id,
        parent_id = COALESCE(EXCLUDED.parent_id, parent_access_pins.parent_id),
        failed_attempts = 0,
        locked_until = NULL,
        is_active = TRUE,
        updated_at = NOW()
      RETURNING id, student_id;
    `;
    const res = await query<{ id: string; student_id: string }>(
      sql,
      [
        data.studentId,
        data.parentPhone,
        pinHash,
        data.schoolId,
        data.organizationId || null,
        data.parentId || null,
        data.createdBy || null,
      ],
      client
    );
    return {
      id: res.rows[0].id,
      studentId: res.rows[0].student_id,
    };
  }

  /**
   * Verifies PIN for a student using Argon2id with rate limit & lockout protection
   */
  async verifyParentPin(data: {
    studentId: string;
    plainPin: string;
    parentPhone?: string;
    schoolId?: string;
  }, client?: PoolClient): Promise<PinVerificationResult> {
    // 1. Fetch active PIN record
    let pinSql = `
      SELECT 
        id,
        student_id,
        parent_id,
        parent_phone,
        pin_hash,
        failed_attempts,
        locked_until,
        is_active
      FROM parent_access_pins
      WHERE student_id = $1 AND is_active = TRUE
    `;
    const params: any[] = [data.studentId];

    if (data.parentPhone) {
      pinSql += ` AND parent_phone = $2`;
      params.push(data.parentPhone);
    }
    pinSql += ` ORDER BY updated_at DESC LIMIT 1;`;

    const pinRes = await query<any>(pinSql, params, client);
    const pinRecord = pinRes.rows[0];

    if (!pinRecord) {
      return {
        success: false,
        error: 'PIN_NOT_FOUND',
        message: 'No active parent access PIN exists for this student. Please contact the school administration.',
      };
    }

    // 2. Check lockout
    if (pinRecord.locked_until && new Date(pinRecord.locked_until) > new Date()) {
      return {
        success: false,
        isLocked: true,
        error: 'PIN_LOCKED',
        message: `Too many failed PIN attempts. Account access is temporarily locked until ${new Date(pinRecord.locked_until).toLocaleTimeString()}.`,
        lockedUntil: pinRecord.locked_until,
      };
    }

    // 3. Verify Argon2id hash
    const isValid = await verifyPassword(pinRecord.pin_hash, data.plainPin);

    if (!isValid) {
      const newFailed = (pinRecord.failed_attempts || 0) + 1;
      const MAX_ATTEMPTS = 5;
      let lockedUntil: string | null = null;

      if (newFailed >= MAX_ATTEMPTS) {
        // Lock for 15 minutes
        const lockDate = new Date(Date.now() + 15 * 60 * 1000);
        lockedUntil = lockDate.toISOString();
        await query(
          'UPDATE parent_access_pins SET failed_attempts = $1, locked_until = $2, updated_at = NOW() WHERE id = $3;',
          [newFailed, lockedUntil, pinRecord.id],
          client
        );
        return {
          success: false,
          isLocked: true,
          error: 'PIN_LOCKED',
          message: 'Too many failed PIN attempts. Account locked for 15 minutes.',
          lockedUntil,
          attemptsRemaining: 0,
        };
      }

      await query(
        'UPDATE parent_access_pins SET failed_attempts = $1, updated_at = NOW() WHERE id = $2;',
        [newFailed, pinRecord.id],
        client
      );

      return {
        success: false,
        error: 'INVALID_PIN',
        message: `Invalid access PIN. ${MAX_ATTEMPTS - newFailed} attempts remaining before account lockout.`,
        attemptsRemaining: MAX_ATTEMPTS - newFailed,
      };
    }

    // 4. Verification Successful — Reset failed attempts and update last accessed
    await query(
      'UPDATE parent_access_pins SET failed_attempts = 0, locked_until = NULL, last_accessed_at = NOW(), updated_at = NOW() WHERE id = $1;',
      [pinRecord.id],
      client
    );

    return {
      success: true,
      studentId: pinRecord.student_id,
      parentId: pinRecord.parent_id,
    };
  }

  /**
   * Helper to verify PIN directly via Admission Number
   */
  async verifyPinByAdmissionNumber(
    admissionNumber: string,
    plainPin: string,
    schoolId?: string,
    client?: PoolClient
  ): Promise<PinVerificationResult> {
    const student = await this.findStudentByAdmissionNumber(admissionNumber, schoolId, client);
    if (!student) {
      return {
        success: false,
        error: 'STUDENT_NOT_FOUND',
        message: 'No active student found matching this admission number.',
      };
    }

    const verification = await this.verifyParentPin(
      {
        studentId: student.id,
        plainPin,
        schoolId,
      },
      client
    );

    if (verification.success) {
      verification.student = student;
    }
    return verification;
  }

  /**
   * Administrative creation of parent guardian record
   */
  async createParentGuardian(data: {
    userId?: string;
    schoolId: string;
    organizationId: string;
    fullName: string;
    phone: string;
    email?: string;
    address?: string;
    relationship?: string;
    occupation?: string;
  }, client?: PoolClient): Promise<ParentGuardianRecord> {
    const res = await query<any>(
      `INSERT INTO parent_guardians (
        user_id, school_id, organization_id, full_name, phone, email, address, relationship, occupation, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
      RETURNING 
        id,
        user_id AS "userId",
        school_id AS "schoolId",
        organization_id AS "organizationId",
        full_name AS "fullName",
        phone,
        email,
        address,
        relationship,
        occupation,
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt";`,
      [
        data.userId || null,
        data.schoolId,
        data.organizationId,
        data.fullName,
        data.phone,
        data.email || null,
        data.address || null,
        data.relationship || 'Guardian',
        data.occupation || null,
      ],
      client
    );
    return res.rows[0];
  }

  /**
   * Administrative linking of parent to student with tenant boundary verification
   */
  async linkStudentToParent(data: {
    parentId: string;
    studentId: string;
    relationship: string;
    isPrimaryGuardian?: boolean;
    schoolId: string;
    organizationId: string;
    createdBy?: string;
    notes?: string;
  }, client?: PoolClient): Promise<ParentStudentLinkRecord> {
    // 1. Verify student belongs to target school
    const stuCheck = await query<{ id: string; school_id: string }>(
      'SELECT id, school_id FROM students WHERE id = $1 LIMIT 1;',
      [data.studentId],
      client
    );
    if (!stuCheck.rows[0]) {
      throw new Error('STUDENT_NOT_FOUND: Student does not exist.');
    }
    if (stuCheck.rows[0].school_id !== data.schoolId) {
      throw new Error('CROSS_SCHOOL_VIOLATION: Student belongs to another school tenant.');
    }

    // 2. Insert or reactivate link
    const res = await query<any>(
      `INSERT INTO parent_student_links (
        parent_id, student_id, relationship, is_primary_guardian, school_id, organization_id,
        status, created_by, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Active', $7, $8, NOW())
      ON CONFLICT (parent_id, student_id) DO UPDATE SET
        relationship = EXCLUDED.relationship,
        is_primary_guardian = EXCLUDED.is_primary_guardian,
        school_id = EXCLUDED.school_id,
        organization_id = EXCLUDED.organization_id,
        status = 'Active',
        notes = EXCLUDED.notes,
        revoked_at = NULL,
        revoked_by = NULL
      RETURNING 
        id,
        parent_id AS "parentId",
        student_id AS "studentId",
        school_id AS "schoolId",
        organization_id AS "organizationId",
        relationship,
        is_primary_guardian AS "isPrimaryGuardian",
        status,
        created_by AS "createdBy",
        created_at AS "createdAt";`,
      [
        data.parentId,
        data.studentId,
        data.relationship,
        data.isPrimaryGuardian ?? true,
        data.schoolId,
        data.organizationId,
        data.createdBy || null,
        data.notes || null,
      ],
      client
    );
    return res.rows[0];
  }

  /**
   * Administrative revocation of a parent-student link
   */
  async revokeParentStudentLink(linkId: string, revokedBy: string, client?: PoolClient): Promise<boolean> {
    const res = await query(
      `UPDATE parent_student_links
       SET status = 'Revoked',
           revoked_at = NOW(),
           revoked_by = $1
       WHERE id = $2;`,
      [revokedBy, linkId],
      client
    );
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Log parent access audit event into PostgreSQL
   */
  async logParentAccess(data: {
    schoolId?: string;
    organizationId?: string;
    parentId?: string;
    studentId?: string;
    userId?: string;
    action: string;
    status: string;
    termId?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }, client?: PoolClient): Promise<void> {
    try {
      await query(
        `INSERT INTO parent_access_logs (
          school_id, organization_id, parent_id, student_id, user_id,
          action, status, term_id, ip_address, user_agent, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        [
          data.schoolId || null,
          data.organizationId || null,
          data.parentId || null,
          data.studentId || null,
          data.userId || null,
          data.action,
          data.status,
          data.termId || null,
          data.ipAddress || null,
          data.userAgent || null,
          data.details ? JSON.stringify(data.details) : null,
        ],
        client
      );
    } catch (err) {
      console.error('[ParentRepository] Failed to write parent access log:', err);
    }
  }
}

export const parentRepository = new ParentRepository();
