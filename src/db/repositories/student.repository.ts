/**
 * BummptEducation — Student Repository
 * 
 * Provides type-safe database queries for Student & Pupil Registry management,
 * admission numbers, class placements, parent/guardian links, and longitudinal enrollments.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { StudentDbEntity, QueryOptions, PaginatedResult } from '../types';
import { DatabaseQueryError, TenantIsolationError } from '../errors';
import { withTransaction } from '../client';
import { StudentEnrollmentRepository } from './studentEnrollment.repository';
import { ClassRepository } from './class.repository';

export interface CreateStudentPayload {
  schoolId: string;
  admissionNumber: string;
  firstName?: string | null;
  middleName?: string | null;
  surname?: string | null;
  fullName?: string;
  gender: 'Male' | 'Female';
  dateOfBirth: Date | string;
  currentClassId: string;
  currentAcademicSessionId?: string | null;
  currentAcademicTermId?: string | null;
  arm: 'kindergarten' | 'primary' | 'secondary';
  house?: string | null;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string | null;
  address?: string | null;
  stateOfOrigin?: string | null;
  dateEnrolled?: Date | string;
  status?: 'Active' | 'Admitted' | 'Graduated' | 'Withdrawn' | 'Transferred' | 'Suspended';
  isPrefect?: boolean;
  prefectRole?: string | null;
  avatarUrl?: string | null;
  organizationId?: string | null;
}

export class StudentRepository extends BaseRepository<StudentDbEntity> {
  protected readonly tableName = 'students';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  private classRepo = new ClassRepository();
  private enrollmentRepo = new StudentEnrollmentRepository();

  /**
   * Finds a student by school ID and admission number (unique institutional pair)
   */
  public async findByAdmissionNumber(
    schoolId: string,
    admissionNumber: string,
    client?: PoolClient
  ): Promise<StudentDbEntity | null> {
    const cleanNumber = admissionNumber.trim().toUpperCase();
    const sql = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE school_id = $1 AND UPPER(admission_number) = $2 
      LIMIT 1;
    `;
    const rows = await this.executeQuery<StudentDbEntity>(sql, [schoolId, cleanNumber], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Retrieves a student by ID with joined class details
   */
  public async findByIdWithClass(
    id: string,
    options?: QueryOptions
  ): Promise<(StudentDbEntity & { className?: string; classLevel?: string }) | null> {
    const student = await this.findById(id, { client: options?.client });
    if (!student) return null;

    if (options?.tenantContext?.schoolId && !options.tenantContext.isSuperAdmin) {
      if (student.school_id !== options.tenantContext.schoolId) {
        return null;
      }
    }

    const classInfo = await this.classRepo.findById(student.current_class_id, { client: options?.client });
    return {
      ...student,
      className: classInfo?.name,
      classLevel: classInfo?.level,
    };
  }

  /**
   * Creates a student and creates their initial enrollment record atomically in a transaction.
   * Enforces cross-school class integrity check prior to insertion.
   */
  public async createStudentWithEnrollment(
    data: CreateStudentPayload,
    clientOverride?: PoolClient
  ): Promise<{ student: StudentDbEntity; enrollment: any }> {
    const executionBlock = async (client: PoolClient) => {
      // 1. Verify class belongs to the assigned school
      const classBelongs = await this.classRepo.verifyClassBelongsToSchool(
        data.currentClassId,
        data.schoolId,
        client
      );

      if (!classBelongs) {
        throw new DatabaseQueryError(
          `Class integrity failure: Class ${data.currentClassId} does not belong to school ${data.schoolId}. Cross-school class assignment is forbidden.`,
          'CROSS_SCHOOL_CLASS_INVALID'
        );
      }

      // 2. Resolve or fallback active academic session
      let sessionId = data.currentAcademicSessionId;
      if (!sessionId) {
        const sessionRes = await client.query(`SELECT id FROM academic_sessions WHERE is_current = TRUE LIMIT 1;`);
        sessionId = sessionRes.rows[0]?.id;
      }

      if (!sessionId) {
        throw new DatabaseQueryError(
          'No active academic session found for student enrollment.',
          'MISSING_ACADEMIC_SESSION'
        );
      }

      // 3. Resolve active term if not provided
      let termId = data.currentAcademicTermId;
      if (!termId) {
        const termRes = await client.query(`SELECT id FROM academic_terms WHERE session_id = $1 AND is_current = TRUE LIMIT 1;`, [sessionId]);
        termId = termRes.rows[0]?.id || null;
      }

      // 4. Construct name
      const constructedFullName = data.fullName || [data.surname, data.firstName, data.middleName].filter(Boolean).join(' ').trim();
      if (!constructedFullName) {
        throw new Error('Student record requires a valid full name or first/last name components.');
      }

      // 5. Insert Student
      const studentSql = `
        INSERT INTO ${this.tableName} (
          school_id,
          organization_id,
          admission_number,
          first_name,
          middle_name,
          surname,
          full_name,
          gender,
          date_of_birth,
          current_class_id,
          current_academic_session_id,
          current_academic_term_id,
          arm,
          house,
          guardian_name,
          guardian_phone,
          guardian_email,
          address,
          state_of_origin,
          date_enrolled,
          status,
          is_prefect,
          prefect_role,
          avatar_url
        ) VALUES (
          $1,
          COALESCE($2, (SELECT organization_id FROM schools WHERE id = $1)),
          $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
        )
        RETURNING *;
      `;

      const studentParams = [
        data.schoolId,
        data.organizationId || null,
        data.admissionNumber.trim().toUpperCase(),
        data.firstName || null,
        data.middleName || null,
        data.surname || null,
        constructedFullName,
        data.gender,
        data.dateOfBirth,
        data.currentClassId,
        sessionId,
        termId,
        data.arm,
        data.house || null,
        data.guardianName,
        data.guardianPhone,
        data.guardianEmail || null,
        data.address || null,
        data.stateOfOrigin || null,
        data.dateEnrolled || new Date().toISOString().split('T')[0],
        data.status || 'Active',
        data.isPrefect ?? false,
        data.prefectRole || null,
        data.avatarUrl || null,
      ];

      const studentResult = await client.query<StudentDbEntity>(studentSql, studentParams);
      const student = studentResult.rows[0];

      // 6. Insert initial enrollment record
      const enrollment = await this.enrollmentRepo.createEnrollment(
        {
          schoolId: data.schoolId,
          organizationId: data.organizationId || null,
          studentId: student.id,
          classId: data.currentClassId,
          academicSessionId: sessionId,
          academicTermId: termId,
          startDate: data.dateEnrolled || new Date(),
          status: 'Active',
          remarks: 'Initial institutional admission & class placement',
        },
        client
      );

      return { student, enrollment };
    };

    if (clientOverride) {
      return executionBlock(clientOverride);
    }
    return withTransaction(executionBlock);
  }

  /**
   * Updates an existing student record with strict tenant validation
   */
  public async updateStudent(
    id: string,
    updates: Partial<{
      firstName: string | null;
      middleName: string | null;
      surname: string | null;
      fullName: string;
      currentClassId: string;
      status: 'Active' | 'Admitted' | 'Graduated' | 'Withdrawn' | 'Transferred' | 'Suspended';
      guardianName: string;
      guardianPhone: string;
      guardianEmail: string | null;
      address: string | null;
      house: string | null;
      isPrefect: boolean;
      prefectRole: string | null;
    }>,
    options?: QueryOptions
  ): Promise<StudentDbEntity | null> {
    await this.verifyTenantOwnership(id, options?.tenantContext, options?.client);

    // If updating class, verify class belongs to the student's school
    if (updates.currentClassId) {
      const student = await this.findById(id, options);
      if (student) {
        const belongs = await this.classRepo.verifyClassBelongsToSchool(
          updates.currentClassId,
          student.school_id,
          options?.client
        );
        if (!belongs) {
          throw new DatabaseQueryError(
            `Target class ${updates.currentClassId} does not belong to school ${student.school_id}. Cross-school class assignment is forbidden.`,
            'CROSS_SCHOOL_CLASS_INVALID'
          );
        }
      }
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      middleName: 'middle_name',
      surname: 'surname',
      fullName: 'full_name',
      currentClassId: 'current_class_id',
      status: 'status',
      guardianName: 'guardian_name',
      guardianPhone: 'guardian_phone',
      guardianEmail: 'guardian_email',
      address: 'address',
      house: 'house',
      isPrefect: 'is_prefect',
      prefectRole: 'prefect_role',
    };

    for (const [key, dbCol] of Object.entries(fieldMap)) {
      if (key in updates) {
        params.push((updates as any)[key]);
        setClauses.push(`${dbCol} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return this.findById(id, options);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);
    const sql = `
      UPDATE ${this.tableName}
      SET ${setClauses.join(', ')}
      WHERE id = $${params.length}
      RETURNING *;
    `;

    const rows = await this.executeQuery<StudentDbEntity>(sql, params, options?.client);
    return rows.length > 0 ? rows[0] : null;
  }
}
