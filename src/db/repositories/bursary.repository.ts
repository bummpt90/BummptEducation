/**
 * BummptEducation — Bursary & Scholarship Award Repository
 * 
 * Provides type-safe database queries for scholarship grants, bursaries, fee discounts,
 * multi-tier approvals, and explicit reconciliation with student invoices.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { 
  BursaryAwardDbEntity, 
  QueryOptions, 
  PaginatedResult 
} from '../types';
import { DatabaseQueryError, TenantIsolationError } from '../errors';
import { withTransaction } from '../client';
import { InvoiceRepository } from './invoice.repository';

export interface CreateBursaryAwardPayload {
  schoolId: string;
  studentId: string;
  academicSessionId: string;
  academicTermId: string;
  awardType: 'MERIT_SCHOLARSHIP' | 'INDIGENT_BURSARY' | 'STAFF_CHILD_DISCOUNT' | 'GOVERNMENT_SUBVENTION' | string;
  awardAmount: number;
  percentage?: number | null;
  reason: string;
  invoiceId?: string | null;
  createdBy?: string | null;
}

export interface BursaryFilter {
  schoolId?: string;
  studentId?: string;
  academicSessionId?: string;
  academicTermId?: string;
  status?: string;
  awardType?: string;
  search?: string;
}

export class BursaryRepository extends BaseRepository<BursaryAwardDbEntity> {
  protected readonly tableName = 'bursary_awards';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  private invoiceRepo = new InvoiceRepository();

  /**
   * Records a new bursary or scholarship award request
   */
  public async createAward(
    payload: CreateBursaryAwardPayload,
    options?: QueryOptions
  ): Promise<BursaryAwardDbEntity> {
    if (payload.awardAmount < 0) {
      throw new DatabaseQueryError('Bursary award amount cannot be negative.');
    }

    if (payload.percentage !== undefined && payload.percentage !== null) {
      if (payload.percentage < 0 || payload.percentage > 100) {
        throw new DatabaseQueryError('Bursary award percentage must be between 0% and 100%.');
      }
    }

    if (!payload.reason || payload.reason.trim().length === 0) {
      throw new DatabaseQueryError('A clear justification reason is mandatory for any bursary award.');
    }

    return withTransaction(async (client: PoolClient) => {
      // 1. Verify student exists in this school
      const stRes = await client.query(
        `SELECT id, school_id FROM students WHERE id = $1 LIMIT 1;`,
        [payload.studentId]
      );
      if (stRes.rows.length === 0) {
        throw new DatabaseQueryError(`Student with ID ${payload.studentId} not found.`);
      }

      const student = stRes.rows[0];
      if (
        options?.tenantContext?.schoolId &&
        !options.tenantContext.isSuperAdmin &&
        student.school_id !== options.tenantContext.schoolId
      ) {
        throw new TenantIsolationError('Bursary award: student belongs to another school.');
      }

      // 2. If invoiceId is supplied, verify invoice belongs to same student and school
      if (payload.invoiceId) {
        const invRes = await client.query(
          `SELECT id, student_id, school_id, balance FROM fee_invoices WHERE id = $1 LIMIT 1;`,
          [payload.invoiceId]
        );
        if (invRes.rows.length === 0) {
          throw new DatabaseQueryError(`Invoice ${payload.invoiceId} not found.`);
        }
        const invoice = invRes.rows[0];
        if (invoice.student_id !== payload.studentId || invoice.school_id !== payload.schoolId) {
          throw new DatabaseQueryError(
            'Supplied invoice does not belong to the awarded student or school.'
          );
        }
      }

      const sql = `
        INSERT INTO ${this.tableName} (
          school_id, student_id, academic_session_id, academic_term_id,
          award_type, award_amount, percentage, status, reason,
          invoice_id, created_by
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, 'REQUESTED', $8,
          $9, $10
        )
        RETURNING *;
      `;

      const params = [
        payload.schoolId,
        payload.studentId,
        payload.academicSessionId,
        payload.academicTermId,
        payload.awardType,
        payload.awardAmount,
        payload.percentage || null,
        payload.reason.trim(),
        payload.invoiceId || null,
        payload.createdBy || null,
      ];

      const res = await client.query(sql, params);
      return res.rows[0];
    });
  }

  /**
   * APPROVE OR REJECT BURSARY AWARD:
   * Explicit, auditable state transition. If approved and attached to an invoice,
   * atomically updates the invoice balance.
   */
  public async reviewAward(
    id: string,
    decision: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    reviewedByUserId: string,
    options?: QueryOptions
  ): Promise<BursaryAwardDbEntity> {
    return withTransaction(async (client: PoolClient) => {
      // 1. Fetch award with lock
      const awardRes = await client.query(`SELECT * FROM ${this.tableName} WHERE id = $1 FOR UPDATE;`, [id]);
      if (awardRes.rows.length === 0) {
        throw new DatabaseQueryError(`Bursary award ${id} not found.`);
      }

      const award = awardRes.rows[0] as BursaryAwardDbEntity;

      // Multi-tenant check
      if (
        options?.tenantContext?.schoolId &&
        !options.tenantContext.isSuperAdmin &&
        award.school_id !== options.tenantContext.schoolId
      ) {
        throw new TenantIsolationError('Bursary review: award belongs to another school.');
      }

      // 2. Update award status
      const updateSql = `
        UPDATE ${this.tableName}
        SET 
          status = $2,
          approved_by = $3,
          approval_date = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;

      const updatedRes = await client.query(updateSql, [id, decision, reviewedByUserId]);
      const updatedAward = updatedRes.rows[0];

      // 3. If approved and linked to invoice, recompute invoice balance
      if (decision === 'APPROVED' && award.invoice_id) {
        await this.invoiceRepo.recomputeBalance(award.invoice_id, client);
      }

      return updatedAward;
    });
  }

  /**
   * Lists bursary awards with filtering and student details
   */
  public async findAwards(
    filter: BursaryFilter = {},
    options?: QueryOptions
  ): Promise<PaginatedResult<BursaryAwardDbEntity>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.schoolId) {
      params.push(filter.schoolId);
      conditions.push(`ba.school_id = $${params.length}`);
    }

    if (filter.studentId) {
      params.push(filter.studentId);
      conditions.push(`ba.student_id = $${params.length}`);
    }

    if (filter.academicSessionId) {
      params.push(filter.academicSessionId);
      conditions.push(`ba.academic_session_id = $${params.length}`);
    }

    if (filter.academicTermId) {
      params.push(filter.academicTermId);
      conditions.push(`ba.academic_term_id = $${params.length}`);
    }

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`UPPER(ba.status) = UPPER($${params.length})`);
    }

    if (filter.awardType) {
      params.push(filter.awardType);
      conditions.push(`UPPER(ba.award_type) = UPPER($${params.length})`);
    }

    if (filter.search) {
      params.push(`%${filter.search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(`(
        LOWER(st.full_name) LIKE $${pIdx} OR 
        LOWER(st.admission_number) LIKE $${pIdx} OR 
        LOWER(ba.reason) LIKE $${pIdx}
      )`);
    }

    const customWhere = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    const { whereSql, params: scopedParams } = this.applyTenantScope(
      customWhere,
      params,
      options?.tenantContext,
      'ba'
    );

    const countSql = `
      SELECT COUNT(*)::int AS count 
      FROM ${this.tableName} ba 
      JOIN students st ON ba.student_id = st.id
      ${whereSql};
    `;
    const countRows = await this.executeQuery<{ count: number }>(countSql, scopedParams, options?.client);
    const total = countRows[0]?.count || 0;

    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const offset = options?.offset && options.offset >= 0 ? options.offset : 0;
    const orderBy = options?.orderBy || 'ba.created_at DESC';

    const queryParams = [...scopedParams, limit, offset];
    const dataSql = `
      SELECT 
        ba.*,
        st.full_name AS student_name,
        st.admission_number,
        u.full_name AS approver_name
      FROM ${this.tableName} ba
      JOIN students st ON ba.student_id = st.id
      LEFT JOIN users u ON ba.approved_by = u.id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `;

    const data = await this.executeQuery<BursaryAwardDbEntity>(dataSql, queryParams, options?.client);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }
}
