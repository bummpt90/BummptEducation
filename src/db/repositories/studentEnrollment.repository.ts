/**
 * BummptEducation — Student Enrollment Repository
 * 
 * Provides database access for longitudinal student enrollments,
 * preserving historical class and academic session trajectories.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { StudentEnrollmentDbEntity, QueryOptions } from '../types';

export class StudentEnrollmentRepository extends BaseRepository<StudentEnrollmentDbEntity> {
  protected readonly tableName = 'student_enrollments';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  /**
   * Retrieves all enrollment records for a student across all sessions/classes
   */
  public async findByStudentId(
    studentId: string,
    options?: QueryOptions
  ): Promise<StudentEnrollmentDbEntity[]> {
    return this.findMany(`student_id = $1`, [studentId], {
      ...options,
      orderBy: 'start_date DESC',
    });
  }

  /**
   * Creates a new enrollment record
   */
  public async createEnrollment(
    data: {
      schoolId: string;
      studentId: string;
      classId: string;
      academicSessionId: string;
      academicTermId?: string | null;
      organizationId?: string | null;
      startDate?: Date | string;
      status?: 'Active' | 'Enrolled' | 'Promoted' | 'Repeated' | 'Withdrawn' | 'Transferred' | 'Graduated';
      remarks?: string | null;
    },
    client?: PoolClient
  ): Promise<StudentEnrollmentDbEntity> {
    const sql = `
      INSERT INTO ${this.tableName} (
        school_id,
        organization_id,
        student_id,
        class_id,
        academic_session_id,
        academic_term_id,
        enrollment_date,
        start_date,
        status,
        remarks
      ) VALUES (
        $1,
        COALESCE($2, (SELECT organization_id FROM schools WHERE id = $1)),
        $3, $4, $5, $6,
        CURRENT_DATE,
        COALESCE($7::date, CURRENT_DATE),
        $8, $9
      )
      RETURNING *;
    `;

    const params = [
      data.schoolId,
      data.organizationId || null,
      data.studentId,
      data.classId,
      data.academicSessionId,
      data.academicTermId || null,
      data.startDate || null,
      data.status || 'Active',
      data.remarks || 'Standard Academic Enrollment',
    ];

    const rows = await this.executeQuery<StudentEnrollmentDbEntity>(sql, params, client);
    return rows[0];
  }
}
