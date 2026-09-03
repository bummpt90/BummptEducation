/**
 * BummptEducation — Fee Invoice Repository
 * 
 * Provides type-safe database queries for student termly invoices, server-calculated line items,
 * balance tracking, and transaction-safe lifecycle management.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { 
  FeeInvoiceDbEntity, 
  FeeInvoiceItemDbEntity, 
  QueryOptions, 
  PaginatedResult 
} from '../types';
import { DatabaseQueryError, TenantIsolationError } from '../errors';
import { withTransaction } from '../client';

export interface CreateInvoicePayload {
  schoolId: string;
  studentId: string;
  academicSessionId: string;
  academicTermId: string;
  classId?: string | null;
  dueDate?: string | Date | null;
  items: Array<{
    categoryId?: string | null;
    feeStructureId?: string | null;
    assessmentId?: string | null;
    name: string;
    amount: number;
  }>;
  createdBy?: string | null;
}

export interface InvoiceFilter {
  schoolId?: string;
  studentId?: string;
  academicSessionId?: string;
  academicTermId?: string;
  status?: string;
  search?: string;
}

export class InvoiceRepository extends BaseRepository<FeeInvoiceDbEntity> {
  protected readonly tableName = 'fee_invoices';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  /**
   * Generates a collision-resistant institutional invoice reference
   */
  public generateInvoiceNumber(schoolCode = 'SCH', year = new Date().getFullYear()): string {
    const randomHex = Math.floor(Math.random() * 900000 + 100000);
    return `INV-${schoolCode.toUpperCase().slice(0, 4)}-${year}-${randomHex}`;
  }

  /**
   * Creates a formal fee invoice with server-calculated totals and line items inside an ACID transaction
   */
  public async createInvoice(
    payload: CreateInvoicePayload,
    options?: QueryOptions
  ): Promise<FeeInvoiceDbEntity> {
    if (!payload.items || payload.items.length === 0) {
      throw new DatabaseQueryError('An invoice must contain at least one line item.');
    }

    return withTransaction(async (client: PoolClient) => {
      // 1. Verify student exists and belongs to school
      const studentRes = await client.query(
        `SELECT id, school_id, current_class_id FROM students WHERE id = $1 LIMIT 1;`,
        [payload.studentId]
      );
      if (studentRes.rows.length === 0) {
        throw new DatabaseQueryError(`Student with ID ${payload.studentId} not found.`);
      }

      const student = studentRes.rows[0];
      if (
        options?.tenantContext?.schoolId &&
        !options.tenantContext.isSuperAdmin &&
        student.school_id !== options.tenantContext.schoolId
      ) {
        throw new TenantIsolationError('Invoice creation: student belongs to another school.');
      }

      // 2. Server-side authoritative total calculation
      let totalBilled = 0;
      for (const item of payload.items) {
        if (item.amount < 0) {
          throw new DatabaseQueryError('Invoice item amount cannot be negative.');
        }
        totalBilled += Number(item.amount);
      }

      const invoiceNumber = this.generateInvoiceNumber('BUMP');
      const classId = payload.classId || student.current_class_id;

      // 3. Insert invoice header
      const insertInvoiceSql = `
        INSERT INTO fee_invoices (
          invoice_number, school_id, student_id, term_id, academic_session_id,
          class_id, total_billed, amount_paid, balance, status, issue_date,
          due_date, created_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, 0.00, $7, 'UNPAID', CURRENT_DATE,
          $8, $9
        )
        RETURNING *;
      `;

      const invoiceRes = await client.query(insertInvoiceSql, [
        invoiceNumber,
        payload.schoolId,
        payload.studentId,
        payload.academicTermId,
        payload.academicSessionId,
        classId,
        totalBilled,
        payload.dueDate || null,
        payload.createdBy || null,
      ]);

      const invoice = invoiceRes.rows[0] as FeeInvoiceDbEntity;

      // 4. Insert invoice line items & update assessment statuses if linked
      const items: FeeInvoiceItemDbEntity[] = [];
      for (const item of payload.items) {
        const itemRes = await client.query(`
          INSERT INTO fee_invoice_items (
            invoice_id, category_id, fee_structure_id, assessment_id, name, amount
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
        `, [
          invoice.id,
          item.categoryId || null,
          item.feeStructureId || null,
          item.assessmentId || null,
          item.name.trim(),
          item.amount,
        ]);

        items.push(itemRes.rows[0]);

        if (item.assessmentId) {
          await client.query(`
            UPDATE student_fee_assessments 
            SET status = 'INVOICED', updated_at = NOW() 
            WHERE id = $1;
          `, [item.assessmentId]);
        }
      }

      invoice.items = items;
      return invoice;
    });
  }

  /**
   * Generates an invoice automatically from pending student fee assessments
   */
  public async generateInvoiceFromPendingAssessments(
    payload: {
      schoolId: string;
      studentId: string;
      academicSessionId: string;
      academicTermId: string;
      assessmentIds?: string[];
      dueDate?: string | Date | null;
      createdBy?: string | null;
    },
    options?: QueryOptions
  ): Promise<FeeInvoiceDbEntity> {
    return withTransaction(async (client: PoolClient) => {
      let assessmentsSql = `
        SELECT sfa.*, fc.name AS category_name
        FROM student_fee_assessments sfa
        JOIN fee_categories fc ON sfa.category_id = fc.id
        WHERE sfa.school_id = $1 
          AND sfa.student_id = $2 
          AND sfa.academic_term_id = $3
          AND sfa.status = 'PENDING'
      `;
      const params: any[] = [payload.schoolId, payload.studentId, payload.academicTermId];

      if (payload.assessmentIds && payload.assessmentIds.length > 0) {
        params.push(payload.assessmentIds);
        assessmentsSql += ` AND sfa.id = ANY($${params.length})`;
      }

      const assessRes = await client.query(assessmentsSql, params);
      const assessments = assessRes.rows;

      if (assessments.length === 0) {
        throw new DatabaseQueryError(
          'No pending assessments found to invoice for this student and term.'
        );
      }

      const items = assessments.map((a) => ({
        categoryId: a.category_id,
        feeStructureId: a.fee_structure_id,
        assessmentId: a.id,
        name: a.category_name || 'Academic Fee',
        amount: Number(a.amount),
      }));

      return this.createInvoice({
        schoolId: payload.schoolId,
        studentId: payload.studentId,
        academicSessionId: payload.academicSessionId,
        academicTermId: payload.academicTermId,
        dueDate: payload.dueDate,
        createdBy: payload.createdBy,
        items,
      }, { ...options, client });
    });
  }

  /**
   * Retrieves an invoice by ID with all itemized line items and student/school metadata
   */
  public async findByIdWithItems(
    id: string,
    options?: QueryOptions
  ): Promise<FeeInvoiceDbEntity | null> {
    const initialParams = [id];
    const { whereSql, params } = this.applyTenantScope(
      `fi.id = $1`,
      initialParams,
      options?.tenantContext,
      'fi'
    );

    const sql = `
      SELECT 
        fi.*,
        st.full_name AS student_name,
        st.admission_number,
        s.name AS school_name,
        t.term_name AS term_name,
        ses.session_name AS session_name
      FROM fee_invoices fi
      JOIN students st ON fi.student_id = st.id
      JOIN schools s ON fi.school_id = s.id
      JOIN academic_terms t ON fi.term_id = t.id
      LEFT JOIN academic_sessions ses ON fi.academic_session_id = ses.id
      ${whereSql}
      LIMIT 1;
    `;

    const rows = await this.executeQuery<FeeInvoiceDbEntity>(sql, params, options?.client);
    if (rows.length === 0) return null;

    const invoice = rows[0];

    // Fetch line items
    const itemsSql = `
      SELECT fii.*, fc.name AS category_name
      FROM fee_invoice_items fii
      LEFT JOIN fee_categories fc ON fii.category_id = fc.id
      WHERE fii.invoice_id = $1
      ORDER BY fii.created_at ASC;
    `;
    const items = await this.executeQuery<FeeInvoiceItemDbEntity>(itemsSql, [id], options?.client);
    invoice.items = items;

    return invoice;
  }

  /**
   * Lists fee invoices with filtering, search, and pagination
   */
  public async findInvoices(
    filter: InvoiceFilter = {},
    options?: QueryOptions
  ): Promise<PaginatedResult<FeeInvoiceDbEntity>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.schoolId) {
      params.push(filter.schoolId);
      conditions.push(`fi.school_id = $${params.length}`);
    }

    if (filter.studentId) {
      params.push(filter.studentId);
      conditions.push(`fi.student_id = $${params.length}`);
    }

    if (filter.academicSessionId) {
      params.push(filter.academicSessionId);
      conditions.push(`fi.academic_session_id = $${params.length}`);
    }

    if (filter.academicTermId) {
      params.push(filter.academicTermId);
      conditions.push(`fi.term_id = $${params.length}`);
    }

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`UPPER(fi.status) = UPPER($${params.length})`);
    }

    if (filter.search) {
      params.push(`%${filter.search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(`(
        LOWER(fi.invoice_number) LIKE $${pIdx} OR 
        LOWER(st.full_name) LIKE $${pIdx} OR 
        LOWER(st.admission_number) LIKE $${pIdx}
      )`);
    }

    const customWhere = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    const { whereSql, params: scopedParams } = this.applyTenantScope(
      customWhere,
      params,
      options?.tenantContext,
      'fi'
    );

    const countSql = `
      SELECT COUNT(*)::int AS count 
      FROM fee_invoices fi 
      JOIN students st ON fi.student_id = st.id
      ${whereSql};
    `;
    const countRows = await this.executeQuery<{ count: number }>(countSql, scopedParams, options?.client);
    const total = countRows[0]?.count || 0;

    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const offset = options?.offset && options.offset >= 0 ? options.offset : 0;
    const orderBy = options?.orderBy || 'fi.created_at DESC';

    const queryParams = [...scopedParams, limit, offset];
    const dataSql = `
      SELECT 
        fi.*,
        st.full_name AS student_name,
        st.admission_number,
        s.name AS school_name,
        t.term_name AS term_name,
        ses.session_name AS session_name
      FROM fee_invoices fi
      JOIN students st ON fi.student_id = st.id
      JOIN schools s ON fi.school_id = s.id
      JOIN academic_terms t ON fi.term_id = t.id
      LEFT JOIN academic_sessions ses ON fi.academic_session_id = ses.id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `;

    const data = await this.executeQuery<FeeInvoiceDbEntity>(dataSql, queryParams, options?.client);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  /**
   * CANCEL INVOICE:
   * Sets invoice status to 'CANCELLED', verifies no completed payments exist,
   * and reverts linked assessments back to 'PENDING'.
   */
  public async cancelInvoice(
    id: string,
    options?: QueryOptions
  ): Promise<FeeInvoiceDbEntity> {
    return withTransaction(async (client: PoolClient) => {
      const invRes = await client.query(`SELECT * FROM fee_invoices WHERE id = $1 FOR UPDATE;`, [id]);
      if (invRes.rows.length === 0) {
        throw new DatabaseQueryError(`Invoice with ID ${id} not found.`);
      }
      const invoice = invRes.rows[0];

      if (Number(invoice.amount_paid) > 0) {
        throw new DatabaseQueryError(
          `Cannot cancel invoice ${invoice.invoice_number} because payments of ₦${invoice.amount_paid} have already been recorded.`
        );
      }

      // Revert linked assessments
      await client.query(`
        UPDATE student_fee_assessments 
        SET status = 'PENDING', updated_at = NOW()
        WHERE id IN (
          SELECT assessment_id FROM fee_invoice_items WHERE invoice_id = $1 AND assessment_id IS NOT NULL
        );
      `, [id]);

      // Update invoice status
      const updated = await client.query(`
        UPDATE fee_invoices
        SET status = 'CANCELLED', updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `, [id]);

      return updated.rows[0];
    });
  }

  /**
   * RECOMPUTE INVOICE BALANCE:
   * Recalculates invoice amount_paid, bursary deductions, and balance from authoritative ledgers.
   */
  public async recomputeBalance(
    invoiceId: string,
    client: PoolClient
  ): Promise<FeeInvoiceDbEntity> {
    const invRes = await client.query(`SELECT * FROM fee_invoices WHERE id = $1 FOR UPDATE;`, [invoiceId]);
    if (invRes.rows.length === 0) {
      throw new DatabaseQueryError(`Invoice ${invoiceId} not found.`);
    }
    const invoice = invRes.rows[0];

    // Sum completed payments
    const payRes = await client.query(`
      SELECT COALESCE(SUM(amount_paid), 0) AS total_paid
      FROM fee_payments
      WHERE invoice_id = $1 AND UPPER(status) IN ('FULLY PAID', 'PAID', 'PARTIAL', 'PARTIALLY PAID', 'COMPLETED');
    `, [invoiceId]);
    const totalPaid = Number(payRes.rows[0].total_paid);

    // Sum approved bursaries/scholarships explicitly assigned to this invoice
    const burRes = await client.query(`
      SELECT COALESCE(SUM(award_amount), 0) AS total_bursary
      FROM bursary_awards
      WHERE invoice_id = $1 AND status = 'APPROVED';
    `, [invoiceId]);
    const totalBursary = Number(burRes.rows[0].total_bursary);

    const totalBilled = Number(invoice.total_billed);
    const balance = Math.max(0, totalBilled - totalPaid - totalBursary);

    let status = 'UNPAID';
    if (balance <= 0) {
      status = 'FULLY PAID';
    } else if (totalPaid > 0 || totalBursary > 0) {
      status = 'PARTIAL';
    }

    const updateRes = await client.query(`
      UPDATE fee_invoices
      SET amount_paid = $1, balance = $2, status = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `, [totalPaid, balance, status, invoiceId]);

    return updateRes.rows[0];
  }
}
