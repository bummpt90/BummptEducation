/**
 * BummptEducation — School Repository
 * 
 * Provides type-safe database queries for School Registry management,
 * school code lookups, institutional status, and active multi-tenant boundaries.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { SchoolDbEntity, QueryOptions, TenantContext } from '../types';

export class SchoolRepository extends BaseRepository<SchoolDbEntity> {
  protected readonly tableName = 'schools';
  protected readonly isMultiTenant = false; // Schools are the institutional tenant entities themselves

  /**
   * Finds a school by unique institutional code (e.g., 'BNS-MKD-000')
   */
  public async findByCode(code: string, client?: PoolClient): Promise<SchoolDbEntity | null> {
    const cleanCode = code.trim().toUpperCase();
    const sql = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE UPPER(code) = $1 
      LIMIT 1;
    `;
    const rows = await this.executeQuery<SchoolDbEntity>(sql, [cleanCode], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Finds all active schools, optionally scoped to tenant context if not super admin / state officer
   */
  public async findPermittedSchools(tenantContext?: TenantContext, client?: PoolClient): Promise<SchoolDbEntity[]> {
    if (tenantContext?.isSuperAdmin || tenantContext?.role === 'state_officer' || !tenantContext?.schoolId) {
      // Global authorities can view all active schools
      const sql = `
        SELECT * 
        FROM ${this.tableName} 
        WHERE is_active = TRUE 
        ORDER BY lga ASC, name ASC;
      `;
      return this.executeQuery<SchoolDbEntity>(sql, [], client);
    }

    // Scoped institutional user can only view their own assigned school
    const sql = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE id = $1 AND is_active = TRUE 
      LIMIT 1;
    `;
    return this.executeQuery<SchoolDbEntity>(sql, [tenantContext.schoolId], client);
  }

  /**
   * Finds all active schools unconditionally for public directories or administrative lookups
   */
  public async findAllActive(client?: PoolClient): Promise<SchoolDbEntity[]> {
    const sql = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE is_active = TRUE 
      ORDER BY lga ASC, name ASC;
    `;
    return this.executeQuery<SchoolDbEntity>(sql, [], client);
  }

  /**
   * Retrieves a school by ID along with operational counts (staff, students, classes)
   */
  public async findByIdWithMetrics(
    id: string,
    client?: PoolClient
  ): Promise<(SchoolDbEntity & { staffCount: number; studentCount: number; classCount: number }) | null> {
    const sql = `
      SELECT 
        s.*,
        (SELECT COUNT(*)::int FROM staff st WHERE st.school_id = s.id AND st.is_active = TRUE) AS "staffCount",
        (SELECT COUNT(*)::int FROM students stu WHERE stu.school_id = s.id AND stu.status = 'Active') AS "studentCount",
        (SELECT COUNT(*)::int FROM classes c WHERE c.school_id = s.id) AS "classCount"
      FROM ${this.tableName} s
      WHERE s.id = $1
      LIMIT 1;
    `;
    const rows = await this.executeQuery<SchoolDbEntity & { staffCount: number; studentCount: number; classCount: number }>(
      sql,
      [id],
      client
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Lists all schools belonging to a specific organization
   */
  public async findByOrganization(organizationId: string, client?: PoolClient): Promise<SchoolDbEntity[]> {
    const sql = `
      SELECT *
      FROM ${this.tableName}
      WHERE organization_id = $1
      ORDER BY lga ASC, name ASC;
    `;
    return this.executeQuery<SchoolDbEntity>(sql, [organizationId], client);
  }

  /**
   * Creates an authoritative school record under a specified organization.
   * Never creates students, parents, fees, assessments, attendance, or marks.
   */
  public async createSchool(
    data: {
      organizationId: string;
      code: string;
      name: string;
      lga: string;
      senatorialZone: string;
      category: string;
      principalName?: string | null;
      bursarName?: string | null;
      vicePrincipalAcademic?: string | null;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      establishedYear?: number | null;
      isActive?: boolean;
    },
    client?: PoolClient
  ): Promise<SchoolDbEntity> {
    const cleanCode = data.code.trim().toUpperCase();
    const cleanName = data.name.trim();
    const sql = `
      INSERT INTO ${this.tableName} (
        organization_id,
        code,
        name,
        lga,
        senatorial_zone,
        category,
        principal_name,
        bursar_name,
        vice_principal_academic,
        phone,
        email,
        address,
        established_year,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;
    const params = [
      data.organizationId,
      cleanCode,
      cleanName,
      data.lga.trim(),
      data.senatorialZone.trim(),
      data.category.trim(),
      data.principalName?.trim() || null,
      data.bursarName?.trim() || null,
      data.vicePrincipalAcademic?.trim() || null,
      data.phone?.trim() || null,
      data.email ? data.email.trim().toLowerCase() : null,
      data.address?.trim() || null,
      data.establishedYear ?? null,
      data.isActive ?? true,
    ];
    const rows = await this.executeQuery<SchoolDbEntity>(sql, params, client);
    return rows[0];
  }
}

export const schoolRepository = new SchoolRepository();

