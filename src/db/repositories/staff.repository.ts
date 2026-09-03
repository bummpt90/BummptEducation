/**
 * BummptEducation — Staff Repository
 * 
 * Provides type-safe database queries for Staff & Faculty Registry management,
 * institutional staff numbers, roles, assigned classrooms, and user account linkages.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { StaffDbEntity, QueryOptions, PaginatedResult } from '../types';
import { TenantIsolationError } from '../errors';

export class StaffRepository extends BaseRepository<StaffDbEntity> {
  protected readonly tableName = 'staff';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  /**
   * Finds a staff record by school and staff number
   */
  public async findByStaffNumber(
    schoolId: string,
    staffIdNumber: string,
    client?: PoolClient
  ): Promise<StaffDbEntity | null> {
    const cleanNumber = staffIdNumber.trim().toUpperCase();
    const sql = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE school_id = $1 AND UPPER(staff_id_number) = $2 
      LIMIT 1;
    `;
    const rows = await this.executeQuery<StaffDbEntity>(sql, [schoolId, cleanNumber], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Finds a staff record by associated user ID
   */
  public async findByUserId(userId: string, client?: PoolClient): Promise<StaffDbEntity | null> {
    const sql = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE user_id = $1 
      LIMIT 1;
    `;
    const rows = await this.executeQuery<StaffDbEntity>(sql, [userId], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Creates a new staff record in the institutional registry
   */
  public async createStaff(
    data: {
      schoolId: string;
      staffIdNumber: string;
      firstName?: string | null;
      middleName?: string | null;
      surname?: string | null;
      fullName?: string;
      staffType: 'Teaching' | 'Non-Teaching';
      departmentId?: string | null;
      arm: string;
      designation: string;
      role: string;
      assignedClassId?: string | null;
      userId?: string | null;
      organizationId?: string | null;
      qualifications?: string | null;
      trcnNumber?: string | null;
      status?: 'Active' | 'On Leave' | 'Resigned' | 'Suspended';
      isActive?: boolean;
      dateJoined?: Date | string | null;
      phone?: string | null;
      email?: string | null;
    },
    client?: PoolClient
  ): Promise<StaffDbEntity> {
    // Construct full name if decomposed parts are provided
    const constructedFullName = data.fullName || [data.surname, data.firstName, data.middleName].filter(Boolean).join(' ').trim();
    if (!constructedFullName) {
      throw new Error('Staff record requires a valid full name or first/last name components.');
    }

    const sql = `
      INSERT INTO ${this.tableName} (
        school_id,
        organization_id,
        staff_id_number,
        first_name,
        middle_name,
        surname,
        full_name,
        staff_type,
        department_id,
        arm,
        designation,
        role,
        assigned_class_id,
        user_id,
        qualifications,
        trcn_number,
        status,
        is_active,
        date_joined,
        phone,
        email
      ) VALUES (
        $1,
        COALESCE($2, (SELECT organization_id FROM schools WHERE id = $1)),
        $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING *;
    `;

    const params = [
      data.schoolId,
      data.organizationId || null,
      data.staffIdNumber.trim().toUpperCase(),
      data.firstName || null,
      data.middleName || null,
      data.surname || null,
      constructedFullName,
      data.staffType,
      data.departmentId || null,
      data.arm,
      data.designation,
      data.role,
      data.assignedClassId || null,
      data.userId || null,
      data.qualifications || null,
      data.trcnNumber || null,
      data.status || 'Active',
      data.isActive ?? true,
      data.dateJoined || new Date().toISOString().split('T')[0],
      data.phone || null,
      data.email ? data.email.trim().toLowerCase() : null,
    ];

    const rows = await this.executeQuery<StaffDbEntity>(sql, params, client);
    return rows[0];
  }

  /**
   * Updates an existing staff record with strict tenant validation
   */
  public async updateStaff(
    id: string,
    updates: Partial<{
      firstName: string | null;
      middleName: string | null;
      surname: string | null;
      fullName: string;
      designation: string;
      role: string;
      staffType: 'Teaching' | 'Non-Teaching';
      departmentId: string | null;
      assignedClassId: string | null;
      qualifications: string | null;
      trcnNumber: string | null;
      status: 'Active' | 'On Leave' | 'Resigned' | 'Suspended';
      isActive: boolean;
      phone: string | null;
      email: string | null;
    }>,
    options?: QueryOptions
  ): Promise<StaffDbEntity | null> {
    await this.verifyTenantOwnership(id, options?.tenantContext, options?.client);

    const setClauses: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      middleName: 'middle_name',
      surname: 'surname',
      fullName: 'full_name',
      designation: 'designation',
      role: 'role',
      staffType: 'staff_type',
      departmentId: 'department_id',
      assignedClassId: 'assigned_class_id',
      qualifications: 'qualifications',
      trcnNumber: 'trcn_number',
      status: 'status',
      isActive: 'is_active',
      phone: 'phone',
      email: 'email',
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

    const rows = await this.executeQuery<StaffDbEntity>(sql, params, options?.client);
    return rows.length > 0 ? rows[0] : null;
  }
}
