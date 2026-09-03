/**
 * BummptEducation — Class Repository
 * 
 * Provides database access for classes, arms (kindergarten, primary, secondary),
 * classroom capacity, and form master associations.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { ClassDbEntity, QueryOptions } from '../types';

export class ClassRepository extends BaseRepository<ClassDbEntity> {
  protected readonly tableName = 'classes';
  protected readonly isMultiTenant = true;
  protected readonly tenantColumn = 'school_id';

  /**
   * Retrieves all classes for a given school, optionally filtered by arm
   */
  public async findBySchool(
    schoolId: string,
    arm?: 'kindergarten' | 'primary' | 'secondary',
    client?: PoolClient
  ): Promise<ClassDbEntity[]> {
    const params: any[] = [schoolId];
    let sql = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE school_id = $1
    `;

    if (arm) {
      params.push(arm);
      sql += ` AND arm = $2`;
    }

    sql += ` ORDER BY level ASC, name ASC;`;
    return this.executeQuery<ClassDbEntity>(sql, params, client);
  }

  /**
   * Validates if a class belongs to a specific school (critical for preventing cross-school student assignments)
   */
  public async verifyClassBelongsToSchool(
    classId: string,
    schoolId: string,
    client?: PoolClient
  ): Promise<boolean> {
    const sql = `
      SELECT 1 
      FROM ${this.tableName} 
      WHERE id = $1 AND school_id = $2 
      LIMIT 1;
    `;
    const rows = await this.executeQuery(sql, [classId, schoolId], client);
    return rows.length > 0;
  }
}
