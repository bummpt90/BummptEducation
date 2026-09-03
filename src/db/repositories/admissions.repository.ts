/**
 * BummptEducation — Admissions Repository
 * 
 * Provides type-safe database queries for student applications, screening/examination scores,
 * status workflows, and atomic transition from accepted applicant to enrolled student.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { AdmissionApplicationDbEntity, QueryOptions, PaginatedResult } from '../types';
import { DatabaseQueryError, TenantIsolationError } from '../errors';
import { withTransaction } from '../client';
import { StudentRepository } from './student.repository';

export interface CreateApplicationPayload {
  schoolId: string;
  applicationNumber?: string;
  studentName: string;
  appliedClass: string;
  arm: 'kindergarten' | 'primary' | 'secondary' | string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string | null;
  previousSchool?: string | null;
  developmentalReadinessScore?: number | null;
  immunizationCompleted?: boolean;
  toiletTrained?: boolean;
  entranceExamScore?: number | null;
  interviewScore?: number | null;
  status?: string;
  academicSessionId?: string | null;
  classId?: string | null;
  submittedDate?: string | Date;
  createdBy?: string | null;
}

export interface ApplicationFilter {
  schoolId?: string;
  academicSessionId?: string;
  classId?: string;
  status?: string;
  search?: string;
}

export class AdmissionsRepository extends BaseRepository<AdmissionApplicationDbEntity> {
  protected readonly tableName = 'admission_applications';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  private studentRepo = new StudentRepository();

  /**
   * Generates a collision-resistant institutional application reference
   */
  public generateApplicationNumber(schoolCode = 'SCH', year = new Date().getFullYear()): string {
    const randomHex = Math.floor(Math.random() * 90000 + 10000);
    return `APP-${schoolCode.toUpperCase().slice(0, 4)}-${year}-${randomHex}`;
  }

  /**
   * Submits and records a new admission application
   */
  public async createApplication(
    payload: CreateApplicationPayload,
    options?: QueryOptions
  ): Promise<AdmissionApplicationDbEntity> {
    const appNumber = payload.applicationNumber || this.generateApplicationNumber('BUMP');

    const sql = `
      INSERT INTO ${this.tableName} (
        school_id, application_number, student_name, applied_class, arm,
        guardian_name, guardian_phone, guardian_email, previous_school,
        developmental_readiness_score, immunization_completed, toilet_trained,
        entrance_exam_score, interview_score, status, academic_session_id,
        class_id, submitted_date, created_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15, $16,
        $17, COALESCE($18, CURRENT_DATE), $19
      )
      RETURNING *;
    `;

    const params = [
      payload.schoolId,
      appNumber,
      payload.studentName.trim(),
      payload.appliedClass.trim(),
      payload.arm.toLowerCase(),
      payload.guardianName.trim(),
      payload.guardianPhone.trim(),
      payload.guardianEmail ? payload.guardianEmail.trim() : null,
      payload.previousSchool ? payload.previousSchool.trim() : null,
      payload.developmentalReadinessScore ?? null,
      payload.immunizationCompleted ?? false,
      payload.toiletTrained ?? false,
      payload.entranceExamScore ?? null,
      payload.interviewScore ?? null,
      payload.status || 'APPLIED',
      payload.academicSessionId || null,
      payload.classId || null,
      payload.submittedDate || null,
      payload.createdBy || null,
    ];

    const rows = await this.executeQuery<AdmissionApplicationDbEntity>(sql, params, options?.client);
    return rows[0];
  }

  /**
   * Retrieves an application by ID with joined school, session and class metadata
   */
  public async findByIdWithDetails(
    id: string,
    options?: QueryOptions
  ): Promise<AdmissionApplicationDbEntity | null> {
    const initialParams = [id];
    const { whereSql, params } = this.applyTenantScope(
      `a.id = $1`,
      initialParams,
      options?.tenantContext,
      'a'
    );

    const sql = `
      SELECT 
        a.*,
        s.name AS school_name,
        c.name AS class_name,
        ses.session_name AS session_name
      FROM ${this.tableName} a
      JOIN schools s ON a.school_id = s.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN academic_sessions ses ON a.academic_session_id = ses.id
      ${whereSql}
      LIMIT 1;
    `;

    const rows = await this.executeQuery<AdmissionApplicationDbEntity>(sql, params, options?.client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Lists admission applications with filtering, search, and pagination
   */
  public async findApplications(
    filter: ApplicationFilter = {},
    options?: QueryOptions
  ): Promise<PaginatedResult<AdmissionApplicationDbEntity>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.schoolId) {
      params.push(filter.schoolId);
      conditions.push(`a.school_id = $${params.length}`);
    }

    if (filter.academicSessionId) {
      params.push(filter.academicSessionId);
      conditions.push(`a.academic_session_id = $${params.length}`);
    }

    if (filter.classId) {
      params.push(filter.classId);
      conditions.push(`a.class_id = $${params.length}`);
    }

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`UPPER(a.status) = UPPER($${params.length})`);
    }

    if (filter.search) {
      params.push(`%${filter.search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(`(
        LOWER(a.student_name) LIKE $${pIdx} OR 
        LOWER(a.application_number) LIKE $${pIdx} OR 
        LOWER(a.guardian_name) LIKE $${pIdx} OR
        LOWER(a.guardian_phone) LIKE $${pIdx}
      )`);
    }

    const customWhere = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    const { whereSql, params: scopedParams } = this.applyTenantScope(
      customWhere,
      params,
      options?.tenantContext,
      'a'
    );

    // Count total matching
    const countSql = `SELECT COUNT(*)::int AS count FROM ${this.tableName} a ${whereSql};`;
    const countRows = await this.executeQuery<{ count: number }>(countSql, scopedParams, options?.client);
    const total = countRows[0]?.count || 0;

    // Fetch data page
    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const offset = options?.offset && options.offset >= 0 ? options.offset : 0;
    const orderBy = options?.orderBy || 'a.created_at DESC';

    const queryParams = [...scopedParams, limit, offset];
    const dataSql = `
      SELECT 
        a.*,
        s.name AS school_name,
        c.name AS class_name,
        ses.session_name AS session_name
      FROM ${this.tableName} a
      JOIN schools s ON a.school_id = s.id
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN academic_sessions ses ON a.academic_session_id = ses.id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `;

    const data = await this.executeQuery<AdmissionApplicationDbEntity>(dataSql, queryParams, options?.client);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  /**
   * Updates an application's review scores, status and decision notes
   */
  public async updateDecision(
    id: string,
    decision: 'ACCEPTED' | 'REJECTED' | 'WAITLISTED' | 'UNDER_REVIEW',
    notes?: string | null,
    reviewedBy?: string | null,
    options?: QueryOptions
  ): Promise<AdmissionApplicationDbEntity | null> {
    const initialParams = [id, decision, notes || null, reviewedBy || null];
    const { whereSql, params } = this.applyTenantScope(
      `id = $1`,
      initialParams,
      options?.tenantContext
    );

    const statusMap: Record<string, string> = {
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      WAITLISTED: 'WAITLISTED',
      UNDER_REVIEW: 'UNDER_REVIEW',
    };

    const sql = `
      UPDATE ${this.tableName}
      SET 
        decision = $2,
        status = '${statusMap[decision] || decision}',
        decision_notes = $3,
        reviewed_by = $4,
        decision_date = NOW(),
        updated_at = NOW()
      ${whereSql}
      RETURNING *;
    `;

    const rows = await this.executeQuery<AdmissionApplicationDbEntity>(sql, params, options?.client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * ATOMIC ENROLLMENT:
   * Transitions an accepted applicant into a full registered student and longitudinal enrollment.
   * Runs inside an ACID transaction to guarantee non-duplication and data integrity.
   */
  public async enrollApplicant(
    id: string,
    payload: {
      classId: string;
      academicSessionId: string;
      academicTermId?: string | null;
      admissionNumber?: string;
      gender?: 'Male' | 'Female';
      dateOfBirth?: string | Date;
      organizationId?: string | null;
      enrolledByUserId?: string | null;
    },
    options?: QueryOptions
  ): Promise<{ student: any; application: AdmissionApplicationDbEntity }> {
    return withTransaction(async (client: PoolClient) => {
      // 1. Fetch application with pessimistic lock
      const appSql = `
        SELECT * 
        FROM ${this.tableName} 
        WHERE id = $1 
        FOR UPDATE;
      `;
      const appRes = await client.query(appSql, [id]);
      if (appRes.rows.length === 0) {
        throw new DatabaseQueryError(`Application with ID ${id} not found.`);
      }

      const application = appRes.rows[0] as AdmissionApplicationDbEntity;

      // School boundary check
      if (
        options?.tenantContext?.schoolId &&
        !options.tenantContext.isSuperAdmin &&
        application.school_id !== options.tenantContext.schoolId
      ) {
        throw new TenantIsolationError(
          `Admissions: cannot enroll applicant belonging to another school.`
        );
      }

      if (application.student_id) {
        throw new DatabaseQueryError(
          `Application ${application.application_number} is already enrolled as student ID ${application.student_id}.`
        );
      }

      // 2. Generate or format official student admission number
      const admNumber = (
        payload.admissionNumber ||
        `BE/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000 + 1000)}`
      ).trim().toUpperCase();

      // Check non-duplication of admission number in school
      const dupCheck = await client.query(
        `SELECT id FROM students WHERE school_id = $1 AND UPPER(admission_number) = $2 LIMIT 1;`,
        [application.school_id, admNumber]
      );
      if (dupCheck.rows.length > 0) {
        throw new DatabaseQueryError(
          `Admission number '${admNumber}' is already assigned to another student in this school.`
        );
      }

      // Name breakdown
      const parts = application.student_name.trim().split(' ');
      const surname = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      const firstName = parts[0];
      const middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : null;

      // Resolve arm
      const arm = (application.arm || 'primary').toLowerCase() as 'kindergarten' | 'primary' | 'secondary';

      // 3. Create student record
      const studentInsertSql = `
        INSERT INTO students (
          organization_id, school_id, admission_number, first_name, middle_name,
          surname, full_name, gender, date_of_birth, current_class_id,
          current_academic_session_id, current_academic_term_id, arm,
          guardian_name, guardian_phone, guardian_email, date_enrolled, status
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16, CURRENT_DATE, 'Active'
        )
        RETURNING *;
      `;

      const studentRes = await client.query(studentInsertSql, [
        payload.organizationId || null,
        application.school_id,
        admNumber,
        firstName,
        middleName,
        surname,
        application.student_name.trim(),
        payload.gender || 'Male',
        payload.dateOfBirth || '2015-01-01',
        payload.classId,
        payload.academicSessionId,
        payload.academicTermId || null,
        arm,
        application.guardian_name,
        application.guardian_phone,
        application.guardian_email || null,
      ]);

      const student = studentRes.rows[0];

      // 4. Create longitudinal enrollment record
      // Get organization_id if null
      let orgId = payload.organizationId;
      if (!orgId) {
        const schRes = await client.query(`SELECT organization_id FROM schools WHERE id = $1;`, [application.school_id]);
        orgId = schRes.rows[0]?.organization_id;
      }

      await client.query(`
        INSERT INTO student_enrollments (
          organization_id, school_id, student_id, academic_session_id, academic_term_id,
          class_id, enrollment_date, start_date, status, remarks
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, CURRENT_DATE, CURRENT_DATE, 'Enrolled', $7
        )
        ON CONFLICT (student_id, academic_session_id, class_id) DO UPDATE 
        SET status = 'Enrolled', updated_at = NOW();
      `, [
        orgId,
        application.school_id,
        student.id,
        payload.academicSessionId,
        payload.academicTermId || null,
        payload.classId,
        `Enrolled from Application #${application.application_number}`,
      ]);

      // 5. Update admission_application status to ENROLLED
      const updateAppSql = `
        UPDATE ${this.tableName}
        SET 
          status = 'ENROLLED',
          decision = 'ACCEPTED',
          student_id = $2,
          admission_number = $3,
          class_id = $4,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;
      const updatedAppRes = await client.query(updateAppSql, [
        id,
        student.id,
        admNumber,
        payload.classId,
      ]);

      return {
        student,
        application: updatedAppRes.rows[0] as AdmissionApplicationDbEntity,
      };
    });
  }
}
