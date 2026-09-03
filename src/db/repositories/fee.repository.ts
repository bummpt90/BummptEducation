/**
 * BummptEducation — Fee Structure & Student Assessment Repository
 * 
 * Provides type-safe database queries for fee categories, school-scoped termly fee schedules,
 * and server-authoritative student fee assessments.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { 
  FeeStructureDbEntity, 
  FeeCategoryDbEntity, 
  StudentFeeAssessmentDbEntity, 
  QueryOptions, 
  PaginatedResult 
} from '../types';
import { DatabaseQueryError, TenantIsolationError } from '../errors';
import { withTransaction } from '../client';

export interface CreateFeeStructurePayload {
  schoolId: string;
  academicSessionId: string;
  academicTermId: string;
  classId: string;
  categoryId: string;
  name: string;
  amount: number;
  isMandatory?: boolean;
  effectiveDate?: string | Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdBy?: string | null;
}

export interface FeeStructureFilter {
  schoolId?: string;
  academicSessionId?: string;
  academicTermId?: string;
  classId?: string;
  categoryId?: string;
  status?: string;
}

export interface AssessFeePayload {
  schoolId: string;
  studentId: string;
  academicSessionId: string;
  academicTermId: string;
  classId: string;
  feeStructureId?: string | null;
  categoryId: string;
  amount?: number; // Sourced server-side if not provided
  dueDate?: string | Date | null;
  status?: 'PENDING' | 'INVOICED' | 'PAID' | 'PARTIALLY_PAID' | 'WAIVED' | 'CANCELLED';
  createdBy?: string | null;
}

export class FeeRepository extends BaseRepository<FeeStructureDbEntity> {
  protected readonly tableName = 'fee_structures';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  /**
   * Retrieves all active fee categories (Tuition, Development Levy, STEM/Robotics, etc.)
   */
  public async getCategories(client?: PoolClient): Promise<FeeCategoryDbEntity[]> {
    const sql = `
      SELECT * 
      FROM fee_categories 
      WHERE is_active = TRUE 
      ORDER BY name ASC;
    `;
    const rows = await this.executeQuery<FeeCategoryDbEntity>(sql, [], client);
    return rows;
  }

  /**
   * Retrieves a category by ID
   */
  public async getCategoryById(id: string, client?: PoolClient): Promise<FeeCategoryDbEntity | null> {
    const sql = `SELECT * FROM fee_categories WHERE id = $1 LIMIT 1;`;
    const rows = await this.executeQuery<FeeCategoryDbEntity>(sql, [id], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Creates a school-scoped fee structure item for a specific class and term
   */
  public async createFeeStructure(
    payload: CreateFeeStructurePayload,
    options?: QueryOptions
  ): Promise<FeeStructureDbEntity> {
    if (payload.amount < 0) {
      throw new DatabaseQueryError('Fee structure amount cannot be negative.');
    }

    const sql = `
      INSERT INTO ${this.tableName} (
        school_id, academic_session_id, academic_term_id, class_id,
        category_id, name, amount, is_mandatory, effective_date,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, COALESCE($9, CURRENT_DATE),
        $10, $11
      )
      RETURNING *;
    `;

    const params = [
      payload.schoolId,
      payload.academicSessionId,
      payload.academicTermId,
      payload.classId,
      payload.categoryId,
      payload.name.trim(),
      payload.amount,
      payload.isMandatory !== undefined ? payload.isMandatory : true,
      payload.effectiveDate || null,
      payload.status || 'ACTIVE',
      payload.createdBy || null,
    ];

    try {
      const rows = await this.executeQuery<FeeStructureDbEntity>(sql, params, options?.client);
      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new DatabaseQueryError(
          'An active fee structure item for this school, class, session, term, and category already exists.'
        );
      }
      throw err;
    }
  }

  /**
   * Lists fee structures with joined category, class, term and session details
   */
  public async findFeeStructures(
    filter: FeeStructureFilter = {},
    options?: QueryOptions
  ): Promise<PaginatedResult<FeeStructureDbEntity>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.schoolId) {
      params.push(filter.schoolId);
      conditions.push(`fs.school_id = $${params.length}`);
    }

    if (filter.academicSessionId) {
      params.push(filter.academicSessionId);
      conditions.push(`fs.academic_session_id = $${params.length}`);
    }

    if (filter.academicTermId) {
      params.push(filter.academicTermId);
      conditions.push(`fs.academic_term_id = $${params.length}`);
    }

    if (filter.classId) {
      params.push(filter.classId);
      conditions.push(`fs.class_id = $${params.length}`);
    }

    if (filter.categoryId) {
      params.push(filter.categoryId);
      conditions.push(`fs.category_id = $${params.length}`);
    }

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`UPPER(fs.status) = UPPER($${params.length})`);
    }

    const customWhere = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    const { whereSql, params: scopedParams } = this.applyTenantScope(
      customWhere,
      params,
      options?.tenantContext,
      'fs'
    );

    const countSql = `SELECT COUNT(*)::int AS count FROM ${this.tableName} fs ${whereSql};`;
    const countRows = await this.executeQuery<{ count: number }>(countSql, scopedParams, options?.client);
    const total = countRows[0]?.count || 0;

    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const offset = options?.offset && options.offset >= 0 ? options.offset : 0;
    const orderBy = options?.orderBy || 'c.name ASC, fc.name ASC';

    const queryParams = [...scopedParams, limit, offset];
    const dataSql = `
      SELECT 
        fs.*,
        fc.name AS category_name,
        c.name AS class_name,
        ses.session_name AS session_name,
        t.term_name AS term_name
      FROM ${this.tableName} fs
      JOIN fee_categories fc ON fs.category_id = fc.id
      JOIN classes c ON fs.class_id = c.id
      JOIN academic_sessions ses ON fs.academic_session_id = ses.id
      JOIN academic_terms t ON fs.academic_term_id = t.id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `;

    const data = await this.executeQuery<FeeStructureDbEntity>(dataSql, queryParams, options?.client);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  /**
   * Assesses an individual student fee.
   * Authoritative amount is fetched server-side from fee_structures if not explicitly provided by admin.
   */
  public async assessStudentFee(
    payload: AssessFeePayload,
    options?: QueryOptions
  ): Promise<StudentFeeAssessmentDbEntity> {
    let finalAmount = payload.amount;

    // Server-authoritative amount check: if feeStructureId is provided or amount is undefined
    if (payload.feeStructureId && (finalAmount === undefined || finalAmount === null)) {
      const fs = await this.findById(payload.feeStructureId, options);
      if (!fs) {
        throw new DatabaseQueryError(`Fee structure ${payload.feeStructureId} not found.`);
      }
      finalAmount = Number(fs.amount);
    }

    if (finalAmount === undefined || finalAmount < 0) {
      throw new DatabaseQueryError('Authoritative fee assessment amount must be 0 or greater.');
    }

    const sql = `
      INSERT INTO student_fee_assessments (
        school_id, student_id, academic_session_id, academic_term_id,
        class_id, fee_structure_id, category_id, amount, due_date,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9,
        $10, $11
      )
      RETURNING *;
    `;

    const params = [
      payload.schoolId,
      payload.studentId,
      payload.academicSessionId,
      payload.academicTermId,
      payload.classId,
      payload.feeStructureId || null,
      payload.categoryId,
      finalAmount,
      payload.dueDate || null,
      payload.status || 'PENDING',
      payload.createdBy || null,
    ];

    const rows = await this.executeQuery<StudentFeeAssessmentDbEntity>(sql, params, options?.client);
    return rows[0];
  }

  /**
   * BULK CLASS FEE ASSESSMENT:
   * Assesses all active students enrolled in a class for a specific term
   * based on all active mandatory fee structures for that class.
   * Runs in an atomic transaction.
   */
  public async assessClassFees(
    schoolId: string,
    academicSessionId: string,
    academicTermId: string,
    classId: string,
    dueDate?: string | Date | null,
    createdBy?: string | null,
    options?: QueryOptions
  ): Promise<{ assessedStudentsCount: number; assessmentsCreatedCount: number }> {
    return withTransaction(async (client: PoolClient) => {
      // 1. Fetch active mandatory fee structures for this class
      const fsSql = `
        SELECT * 
        FROM fee_structures 
        WHERE school_id = $1 
          AND academic_session_id = $2 
          AND academic_term_id = $3 
          AND class_id = $4 
          AND is_mandatory = TRUE 
          AND status = 'ACTIVE';
      `;
      const fsRes = await client.query(fsSql, [schoolId, academicSessionId, academicTermId, classId]);
      const structures = fsRes.rows;

      if (structures.length === 0) {
        throw new DatabaseQueryError(
          'No active mandatory fee structures found for the specified class, session, and term.'
        );
      }

      // 2. Fetch all active students currently in this class
      const studentsSql = `
        SELECT id 
        FROM students 
        WHERE school_id = $1 
          AND current_class_id = $2 
          AND status = 'Active';
      `;
      const studentsRes = await client.query(studentsSql, [schoolId, classId]);
      const students = studentsRes.rows;

      if (students.length === 0) {
        return { assessedStudentsCount: 0, assessmentsCreatedCount: 0 };
      }

      let createdCount = 0;
      for (const student of students) {
        for (const structure of structures) {
          // Check if an assessment already exists for this student + structure
          const checkSql = `
            SELECT id FROM student_fee_assessments 
            WHERE student_id = $1 AND fee_structure_id = $2 AND academic_term_id = $3;
          `;
          const checkRes = await client.query(checkSql, [student.id, structure.id, academicTermId]);

          if (checkRes.rows.length === 0) {
            await client.query(`
              INSERT INTO student_fee_assessments (
                school_id, student_id, academic_session_id, academic_term_id,
                class_id, fee_structure_id, category_id, amount, due_date,
                status, created_by
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10);
            `, [
              schoolId,
              student.id,
              academicSessionId,
              academicTermId,
              classId,
              structure.id,
              structure.category_id,
              structure.amount,
              dueDate || null,
              createdBy || null,
            ]);
            createdCount++;
          }
        }
      }

      return {
        assessedStudentsCount: students.length,
        assessmentsCreatedCount: createdCount,
      };
    });
  }

  /**
   * Retrieves all fee assessments for a specific student
   */
  public async getStudentAssessments(
    studentId: string,
    termId?: string,
    options?: QueryOptions
  ): Promise<StudentFeeAssessmentDbEntity[]> {
    const conditions: string[] = ['sfa.student_id = $1'];
    const params: any[] = [studentId];

    if (termId) {
      params.push(termId);
      conditions.push(`sfa.academic_term_id = $${params.length}`);
    }

    const { whereSql, params: scopedParams } = this.applyTenantScope(
      conditions.join(' AND '),
      params,
      options?.tenantContext
    );

    const sql = `
      SELECT 
        sfa.*,
        st.full_name AS student_name,
        st.admission_number,
        fc.name AS category_name,
        c.name AS class_name
      FROM student_fee_assessments sfa
      JOIN students st ON sfa.student_id = st.id
      JOIN fee_categories fc ON sfa.category_id = fc.id
      JOIN classes c ON sfa.class_id = c.id
      ${whereSql}
      ORDER BY sfa.created_at DESC;
    `;

    return this.executeQuery<StudentFeeAssessmentDbEntity>(sql, scopedParams, options?.client);
  }
}
