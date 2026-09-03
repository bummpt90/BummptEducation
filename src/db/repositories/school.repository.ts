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
}
