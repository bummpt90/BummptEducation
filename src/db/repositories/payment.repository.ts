/**
 * BummptEducation — Payment & Receipt Repository
 * 
 * Provides type-safe database queries for recording fee payments, issuing official digital receipts,
 * updating invoice balances atomically, and computing real-time student financial balances.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { 
  FeePaymentDbEntity, 
  StudentBalanceReport, 
  QueryOptions, 
  PaginatedResult 
} from '../types';
import { DatabaseQueryError, TenantIsolationError } from '../errors';
import { withTransaction } from '../client';
import { InvoiceRepository } from './invoice.repository';

export interface RecordPaymentPayload {
  schoolId: string;
  studentId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'Bank Transfer' | 'POS' | 'Cash / Bank Teller' | 'Online Gateway' | 'BANK_TRANSFER' | 'POS' | 'CASH' | string;
  paymentReference?: string | null;
  bankReference?: string | null;
  paymentDate?: string | Date;
  collectedBy?: string | null;
  recordedByUserId?: string | null;
}

export interface PaymentFilter {
  schoolId?: string;
  studentId?: string;
  invoiceId?: string;
  paymentMethod?: string;
  status?: string;
  search?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

export class PaymentRepository extends BaseRepository<FeePaymentDbEntity> {
  protected readonly tableName = 'fee_payments';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  private invoiceRepo = new InvoiceRepository();

  /**
   * Generates a collision-resistant institutional digital receipt number
   */
  public generateReceiptNumber(schoolCode = 'SCH', year = new Date().getFullYear()): string {
    const randomHex = Math.floor(Math.random() * 900000 + 100000);
    return `REC-${schoolCode.toUpperCase().slice(0, 4)}-${year}-${randomHex}`;
  }

  /**
   * RECORD PAYMENT:
   * Atomically records a payment against a valid invoice, checks balance constraints,
   * creates an immutable payment record, and updates the invoice balance in a single ACID transaction.
   */
  public async recordPayment(
    payload: RecordPaymentPayload,
    options?: QueryOptions
  ): Promise<FeePaymentDbEntity> {
    const amount = Number(payload.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new DatabaseQueryError('Payment amount must be strictly greater than 0.');
    }

    return withTransaction(async (client: PoolClient) => {
      // 1. Fetch invoice with row lock
      const invRes = await client.query(`
        SELECT * 
        FROM fee_invoices 
        WHERE id = $1 
        FOR UPDATE;
      `, [payload.invoiceId]);

      if (invRes.rows.length === 0) {
        throw new DatabaseQueryError(`Invoice ${payload.invoiceId} not found.`);
      }

      const invoice = invRes.rows[0];

      // Multi-tenant check
      if (
        options?.tenantContext?.schoolId &&
        !options.tenantContext.isSuperAdmin &&
        invoice.school_id !== options.tenantContext.schoolId
      ) {
        throw new TenantIsolationError('Payment recording: invoice belongs to another school.');
      }

      // Student ownership check
      if (invoice.student_id !== payload.studentId) {
        throw new DatabaseQueryError(
          `Payment student ID does not match the student owning invoice #${invoice.invoice_number}.`
        );
      }

      // Status check
      if (invoice.status === 'CANCELLED') {
        throw new DatabaseQueryError('Cannot record payment against a CANCELLED invoice.');
      }

      const currentBalance = Number(invoice.balance);
      if (currentBalance <= 0) {
        throw new DatabaseQueryError(
          `Invoice #${invoice.invoice_number} is already fully settled (balance: ₦0.00).`
        );
      }

      // Overpayment prevention rule
      if (amount > currentBalance) {
        throw new DatabaseQueryError(
          `Payment amount (₦${amount.toLocaleString()}) exceeds the outstanding balance (₦${currentBalance.toLocaleString()}) on invoice #${invoice.invoice_number}.`
        );
      }

      // Check unique payment reference if supplied
      if (payload.paymentReference) {
        const refCheck = await client.query(`
          SELECT id FROM fee_payments WHERE payment_reference = $1 LIMIT 1;
        `, [payload.paymentReference.trim()]);
        if (refCheck.rows.length > 0) {
          throw new DatabaseQueryError(
            `Payment reference '${payload.paymentReference}' has already been processed.`
          );
        }
      }

      // Fetch student details for class level & arm
      const stRes = await client.query(`
        SELECT s.arm, c.level AS class_level 
        FROM students s 
        LEFT JOIN classes c ON s.current_class_id = c.id 
        WHERE s.id = $1;
      `, [payload.studentId]);
      const classLevel = stRes.rows[0]?.class_level || 'General';
      const arm = stRes.rows[0]?.arm || 'primary';

      const receiptNumber = this.generateReceiptNumber('BUMP');
      const newBalance = Math.max(0, currentBalance - amount);
      const newStatus = newBalance === 0 ? 'Fully Paid' : 'Partial';

      // 2. Insert payment record
      const insertSql = `
        INSERT INTO fee_payments (
          school_id, receipt_number, payment_reference, student_id, invoice_id,
          term_id, academic_session_id, class_level, arm, amount_paid,
          total_billed, balance, payment_date, payment_method, bank_reference,
          status, payment_status, collected_by, recorded_by_user_id
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, COALESCE($13, CURRENT_DATE), $14, $15,
          $16, 'COMPLETED', $17, $18
        )
        RETURNING *;
      `;

      const payRes = await client.query(insertSql, [
        payload.schoolId,
        receiptNumber,
        payload.paymentReference ? payload.paymentReference.trim() : null,
        payload.studentId,
        payload.invoiceId,
        invoice.term_id,
        invoice.academic_session_id || null,
        classLevel,
        arm,
        amount,
        invoice.total_billed,
        newBalance,
        payload.paymentDate || null,
        payload.paymentMethod || 'Bank Transfer',
        payload.bankReference || null,
        newStatus,
        payload.collectedBy || 'Bursary Clearance Desk',
        payload.recordedByUserId || null,
      ]);

      const payment = payRes.rows[0];

      // 3. Atomically update invoice balance and status
      await this.invoiceRepo.recomputeBalance(payload.invoiceId, client);

      return payment;
    });
  }

  /**
   * Retrieves an authoritative receipt by receipt number or payment ID with joined student and school data
   */
  public async getAuthoritativeReceipt(
    receiptIdentifier: string,
    options?: QueryOptions
  ): Promise<FeePaymentDbEntity | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receiptIdentifier);
    const whereCondition = isUuid ? 'fp.id = $1' : 'UPPER(fp.receipt_number) = UPPER($1)';

    const initialParams = [receiptIdentifier];
    const { whereSql, params } = this.applyTenantScope(
      whereCondition,
      initialParams,
      options?.tenantContext
    );

    const sql = `
      SELECT 
        fp.*,
        st.full_name AS student_name,
        st.admission_number,
        s.name AS school_name,
        s.address AS school_address,
        s.phone AS school_phone,
        fi.invoice_number,
        fi.issue_date AS invoice_issue_date,
        u.full_name AS recorded_by_name
      FROM fee_payments fp
      JOIN students st ON fp.student_id = st.id
      JOIN schools s ON fp.school_id = s.id
      LEFT JOIN fee_invoices fi ON fp.invoice_id = fi.id
      LEFT JOIN users u ON fp.recorded_by_user_id = u.id
      ${whereSql}
      LIMIT 1;
    `;

    const rows = await this.executeQuery<FeePaymentDbEntity>(sql, params, options?.client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Lists fee payments with search and filtering
   */
  public async findPayments(
    filter: PaymentFilter = {},
    options?: QueryOptions
  ): Promise<PaginatedResult<FeePaymentDbEntity>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.schoolId) {
      params.push(filter.schoolId);
      conditions.push(`fp.school_id = $${params.length}`);
    }

    if (filter.studentId) {
      params.push(filter.studentId);
      conditions.push(`fp.student_id = $${params.length}`);
    }

    if (filter.invoiceId) {
      params.push(filter.invoiceId);
      conditions.push(`fp.invoice_id = $${params.length}`);
    }

    if (filter.paymentMethod) {
      params.push(filter.paymentMethod);
      conditions.push(`UPPER(fp.payment_method) = UPPER($${params.length})`);
    }

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`UPPER(fp.status) = UPPER($${params.length})`);
    }

    if (filter.search) {
      params.push(`%${filter.search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      conditions.push(`(
        LOWER(fp.receipt_number) LIKE $${pIdx} OR 
        LOWER(fp.payment_reference) LIKE $${pIdx} OR 
        LOWER(st.full_name) LIKE $${pIdx} OR 
        LOWER(st.admission_number) LIKE $${pIdx}
      )`);
    }

    const customWhere = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    const { whereSql, params: scopedParams } = this.applyTenantScope(
      customWhere,
      params,
      options?.tenantContext,
      'fp'
    );

    const countSql = `
      SELECT COUNT(*)::int AS count 
      FROM fee_payments fp 
      JOIN students st ON fp.student_id = st.id
      ${whereSql};
    `;
    const countRows = await this.executeQuery<{ count: number }>(countSql, scopedParams, options?.client);
    const total = countRows[0]?.count || 0;

    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const offset = options?.offset && options.offset >= 0 ? options.offset : 0;
    const orderBy = options?.orderBy || 'fp.payment_date DESC, fp.created_at DESC';

    const queryParams = [...scopedParams, limit, offset];
    const dataSql = `
      SELECT 
        fp.*,
        st.full_name AS student_name,
        st.admission_number,
        s.name AS school_name,
        fi.invoice_number
      FROM fee_payments fp
      JOIN students st ON fp.student_id = st.id
      JOIN schools s ON fp.school_id = s.id
      LEFT JOIN fee_invoices fi ON fp.invoice_id = fi.id
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `;

    const data = await this.executeQuery<FeePaymentDbEntity>(dataSql, queryParams, options?.client);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  /**
   * REAL-TIME STUDENT BALANCE COMPUTATION:
   * Aggregates total billed, total paid, and total approved bursary awards across all terms.
   * Net outstanding = total_invoiced - total_paid - total_bursary.
   */
  public async computeStudentBalance(
    studentId: string,
    options?: QueryOptions
  ): Promise<StudentBalanceReport> {
    // 1. Fetch student info
    const stSql = `
      SELECT id, school_id, full_name, admission_number 
      FROM students 
      WHERE id = $1 LIMIT 1;
    `;
    const stRows = await this.executeQuery<any>(stSql, [studentId], options?.client);
    if (stRows.length === 0) {
      throw new DatabaseQueryError(`Student with ID ${studentId} not found.`);
    }
    const student = stRows[0];

    // Multi-tenant validation
    if (
      options?.tenantContext?.schoolId &&
      !options.tenantContext.isSuperAdmin &&
      student.school_id !== options.tenantContext.schoolId
    ) {
      throw new TenantIsolationError('Balance computation: student belongs to another school.');
    }

    // 2. Sum active invoices (excluding CANCELLED)
    const invSql = `
      SELECT 
        COUNT(*)::int AS count,
        COALESCE(SUM(total_billed), 0)::numeric AS total_billed
      FROM fee_invoices 
      WHERE student_id = $1 AND status != 'CANCELLED';
    `;
    const invRes = await this.executeQuery<any>(invSql, [studentId], options?.client);
    const totalInvoiced = Number(invRes[0]?.total_billed || 0);
    const invoicesCount = Number(invRes[0]?.count || 0);

    // 3. Sum valid payments
    const paySql = `
      SELECT 
        COUNT(*)::int AS count,
        COALESCE(SUM(amount_paid), 0)::numeric AS total_paid
      FROM fee_payments 
      WHERE student_id = $1 
        AND UPPER(status) IN ('FULLY PAID', 'PAID', 'PARTIAL', 'PARTIALLY PAID', 'COMPLETED');
    `;
    const payRes = await this.executeQuery<any>(paySql, [studentId], options?.client);
    const totalPaid = Number(payRes[0]?.total_paid || 0);
    const paymentsCount = Number(payRes[0]?.count || 0);

    // 4. Sum approved bursaries
    const burSql = `
      SELECT 
        COUNT(*)::int AS count,
        COALESCE(SUM(award_amount), 0)::numeric AS total_bursary
      FROM bursary_awards 
      WHERE student_id = $1 AND status = 'APPROVED';
    `;
    const burRes = await this.executeQuery<any>(burSql, [studentId], options?.client);
    const totalBursary = Number(burRes[0]?.total_bursary || 0);
    const bursariesCount = Number(burRes[0]?.count || 0);

    const netOutstanding = Math.max(0, totalInvoiced - totalPaid - totalBursary);
    const isCleared = netOutstanding <= 0 && invoicesCount > 0;

    return {
      student_id: student.id,
      school_id: student.school_id,
      student_name: student.full_name,
      admission_number: student.admission_number,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_bursary_awarded: totalBursary,
      net_outstanding_balance: netOutstanding,
      invoices_count: invoicesCount,
      payments_count: paymentsCount,
      bursaries_count: bursariesCount,
      is_cleared_for_exam: isCleared,
    };
  }
}
