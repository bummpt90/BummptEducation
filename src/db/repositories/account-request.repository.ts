/**
 * BummptEducation — Account Request Repository
 * 
 * Provides database operations for controlled sign-up account requests,
 * administrative approval workflows, and audit validation.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { UserAccountRequestDbEntity, TenantContext } from '../types';

export interface CreateAccountRequestDto {
  organizationId: string;
  requestedSchoolId?: string | null;
  firstName: string;
  middleName?: string | null;
  surname: string;
  email: string;
  phone?: string | null;
  requestedRole: string;
  passwordHash: string;
}

export class AccountRequestRepository extends BaseRepository<UserAccountRequestDbEntity> {
  protected readonly tableName = 'user_account_requests';
  protected readonly tenantColumn = 'requested_school_id';
  protected readonly isMultiTenant = true;

  /**
   * Creates a new controlled account request with Argon2id password hash
   */
  public async createRequest(
    data: CreateAccountRequestDto,
    client?: PoolClient
  ): Promise<UserAccountRequestDbEntity> {
    const cleanEmail = data.email.trim().toLowerCase();
    const sql = `
      INSERT INTO ${this.tableName} (
        organization_id,
        requested_school_id,
        first_name,
        middle_name,
        surname,
        email,
        phone,
        requested_role,
        password_hash,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
      RETURNING *;
    `;
    const params = [
      data.organizationId,
      data.requestedSchoolId || null,
      data.firstName.trim(),
      data.middleName?.trim() || null,
      data.surname.trim(),
      cleanEmail,
      data.phone?.trim() || null,
      data.requestedRole.toLowerCase().trim(),
      data.passwordHash,
    ];

    const rows = await this.executeQuery<UserAccountRequestDbEntity>(sql, params, client);
    return rows[0];
  }

  /**
   * Finds an active pending account request for an email address
   */
  public async findPendingByEmail(email: string, client?: PoolClient): Promise<UserAccountRequestDbEntity | null> {
    const cleanEmail = email.trim().toLowerCase();
    const sql = `
      SELECT *
      FROM ${this.tableName}
      WHERE LOWER(email) = LOWER($1) AND status = 'PENDING'
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const rows = await this.executeQuery<UserAccountRequestDbEntity>(sql, [cleanEmail], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Finds any account request by ID with joined school and reviewer details
   */
  public async findByIdWithDetails(
    id: string,
    client?: PoolClient
  ): Promise<UserAccountRequestDbEntity | null> {
    const sql = `
      SELECT 
        r.*,
        s.name as school_name,
        u.full_name as reviewer_name
      FROM ${this.tableName} r
      LEFT JOIN schools s ON r.requested_school_id = s.id
      LEFT JOIN users u ON r.reviewed_by = u.id
      WHERE r.id = $1
      LIMIT 1;
    `;
    const rows = await this.executeQuery<UserAccountRequestDbEntity>(sql, [id], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Lists account requests with tenant boundary enforcement
   */
  public async listRequests(
    filters: {
      status?: string;
      schoolId?: string;
      role?: string;
      search?: string;
    },
    tenantContext?: TenantContext,
    client?: PoolClient
  ): Promise<UserAccountRequestDbEntity[]> {
    const params: any[] = [];
    const conditions: string[] = [];

    // Tenant boundary: Principals can only see their school's requests
    if (tenantContext?.schoolId && !tenantContext.isSuperAdmin && tenantContext.role !== 'state_officer') {
      params.push(tenantContext.schoolId);
      conditions.push(`r.requested_school_id = $${params.length}`);
    } else if (filters.schoolId) {
      params.push(filters.schoolId);
      conditions.push(`r.requested_school_id = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status.toUpperCase());
      conditions.push(`r.status = $${params.length}`);
    }

    if (filters.role) {
      params.push(filters.role.toLowerCase());
      conditions.push(`r.requested_role = $${params.length}`);
    }

    if (filters.search && filters.search.trim()) {
      params.push(`%${filters.search.trim()}%`);
      conditions.push(`(
        r.first_name ILIKE $${params.length} OR 
        r.surname ILIKE $${params.length} OR 
        r.email ILIKE $${params.length} OR 
        r.phone ILIKE $${params.length}
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        r.*,
        s.name as school_name,
        u.full_name as reviewer_name
      FROM ${this.tableName} r
      LEFT JOIN schools s ON r.requested_school_id = s.id
      LEFT JOIN users u ON r.reviewed_by = u.id
      ${whereClause}
      ORDER BY 
        CASE WHEN r.status = 'PENDING' THEN 0 ELSE 1 END,
        r.created_at DESC;
    `;

    return this.executeQuery<UserAccountRequestDbEntity>(sql, params, client);
  }

  /**
   * Updates status to APPROVED
   */
  public async approveRequest(
    id: string,
    reviewedBy: string,
    adminNotes?: string | null,
    client?: PoolClient
  ): Promise<UserAccountRequestDbEntity> {
    const sql = `
      UPDATE ${this.tableName}
      SET 
        status = 'APPROVED',
        reviewed_by = $2,
        reviewed_at = NOW(),
        admin_notes = COALESCE($3, admin_notes),
        updated_at = NOW()
      WHERE id = $1 AND status = 'PENDING'
      RETURNING *;
    `;
    const rows = await this.executeQuery<UserAccountRequestDbEntity>(sql, [id, reviewedBy, adminNotes || null], client);
    if (rows.length === 0) {
      throw new Error(`Request ${id} not found or not in PENDING status`);
    }
    return rows[0];
  }

  /**
   * Updates status to REJECTED
   */
  public async rejectRequest(
    id: string,
    reviewedBy: string,
    rejectionReason: string,
    adminNotes?: string | null,
    client?: PoolClient
  ): Promise<UserAccountRequestDbEntity> {
    const sql = `
      UPDATE ${this.tableName}
      SET 
        status = 'REJECTED',
        reviewed_by = $2,
        reviewed_at = NOW(),
        rejection_reason = $3,
        admin_notes = COALESCE($4, admin_notes),
        updated_at = NOW()
      WHERE id = $1 AND status = 'PENDING'
      RETURNING *;
    `;
    const rows = await this.executeQuery<UserAccountRequestDbEntity>(
      sql,
      [id, reviewedBy, rejectionReason, adminNotes || null],
      client
    );
    if (rows.length === 0) {
      throw new Error(`Request ${id} not found or not in PENDING status`);
    }
    return rows[0];
  }
}

export const accountRequestRepository = new AccountRequestRepository();
