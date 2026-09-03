/**
 * BummptEducation — Financial Audit Repository
 * 
 * Provides an immutable, school-isolated audit trail for all financial mutations:
 * fee structures, student assessments, invoices, payments, and bursary grants.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { FinancialAuditLogDbEntity, QueryOptions, PaginatedResult } from '../types';

export interface LogFinancialActionPayload {
  schoolId?: string | null;
  userId?: string | null;
  entityType: 'FEE_STRUCTURE' | 'ASSESSMENT' | 'INVOICE' | 'PAYMENT' | 'RECEIPT' | 'BURSARY' | 'ADMISSION';
  entityId: string;
  action: string;
  amount?: number | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
}

export class FinancialAuditRepository extends BaseRepository<FinancialAuditLogDbEntity> {
  protected readonly tableName = 'financial_audit_logs';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  /**
   * Sanitizes sensitive fields before writing audit trail records
   */
  private sanitizeMetadata(details?: Record<string, any> | null): Record<string, any> | null {
    if (!details) return null;
    const sanitized = { ...details };
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'authSecret', 'databaseUrl', 'secret'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  /**
   * Records a financial audit log entry
   */
  public async logAction(
    payload: LogFinancialActionPayload,
    client?: PoolClient
  ): Promise<FinancialAuditLogDbEntity> {
    const safeDetails = this.sanitizeMetadata(payload.details);

    const sql = `
      INSERT INTO ${this.tableName} (
        school_id, user_id, entity_type, entity_id, action, amount, details, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const params = [
      payload.schoolId || null,
      payload.userId || null,
      payload.entityType,
      payload.entityId,
      payload.action.toUpperCase(),
      payload.amount ?? null,
      safeDetails ? JSON.stringify(safeDetails) : null,
      payload.ipAddress || null,
    ];

    const rows = await this.executeQuery<FinancialAuditLogDbEntity>(sql, params, client);
    return rows[0];
  }

  /**
   * Retrieves financial audit logs for a school or entity
   */
  public async getAuditLogs(
    filter: {
      schoolId?: string;
      entityType?: string;
      entityId?: string;
      userId?: string;
    },
    options?: QueryOptions
  ): Promise<PaginatedResult<FinancialAuditLogDbEntity>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.schoolId) {
      params.push(filter.schoolId);
      conditions.push(`fal.school_id = $${params.length}`);
    }

    if (filter.entityType) {
      params.push(filter.entityType.toUpperCase());
      conditions.push(`fal.entity_type = $${params.length}`);
    }

    if (filter.entityId) {
      params.push(filter.entityId);
      conditions.push(`fal.entity_id = $${params.length}`);
    }

    if (filter.userId) {
      params.push(filter.userId);
      conditions.push(`fal.user_id = $${params.length}`);
    }

    const customWhere = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    const { whereSql, params: scopedParams } = this.applyTenantScope(
      customWhere,
      params,
      options?.tenantContext
    );

    const countSql = `SELECT COUNT(*)::int AS count FROM ${this.tableName} fal ${whereSql};`;
    const countRows = await this.executeQuery<{ count: number }>(countSql, scopedParams, options?.client);
    const total = countRows[0]?.count || 0;

    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const offset = options?.offset && options.offset >= 0 ? options.offset : 0;

    const queryParams = [...scopedParams, limit, offset];
    const dataSql = `
      SELECT 
        fal.*,
        u.full_name AS user_name,
        s.name AS school_name
      FROM ${this.tableName} fal
      LEFT JOIN users u ON fal.user_id = u.id
      LEFT JOIN schools s ON fal.school_id = s.id
      ${whereSql}
      ORDER BY fal.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length};
    `;

    const data = await this.executeQuery<FinancialAuditLogDbEntity>(dataSql, queryParams, options?.client);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }
}
