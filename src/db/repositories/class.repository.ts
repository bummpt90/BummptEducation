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

  /**
   * Retrieves a single class by id scoped to school
   */
  public async findByIdAndSchool(
    classId: string,
    schoolId: string,
    client?: PoolClient
  ): Promise<ClassDbEntity | null> {
    const sql = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE id = $1 AND school_id = $2 
      LIMIT 1;
    `;
    const rows = await this.executeQuery<ClassDbEntity>(sql, [classId, schoolId], client);
    return rows[0] || null;
  }

  /**
   * Creates a new class with server-side validation of school, capacity, and form master
   */
  public async createClass(
    data: {
      schoolId: string;
      level: string;
      arm: 'kindergarten' | 'primary' | 'secondary';
      name: string;
      category?: string;
      classroomBlock?: string | null;
      capacity?: number;
      formMasterId?: string | null;
    },
    client?: PoolClient
  ): Promise<ClassDbEntity> {
    const level = data.level?.trim();
    if (!level) {
      throw new Error('INVALID_CLASS_LEVEL: Class level is required.');
    }
    const name = data.name?.trim();
    if (!name || name.length < 2) {
      throw new Error('INVALID_CLASS_NAME: Class name must be at least 2 characters.');
    }
    const arm = data.arm;
    if (!['kindergarten', 'primary', 'secondary'].includes(arm)) {
      throw new Error('INVALID_ARM: Arm must be one of kindergarten, primary, secondary.');
    }
    const category = data.category?.trim() || 'General';
    const capacity = data.capacity !== undefined ? Number(data.capacity) : 30;
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
      throw new Error('INVALID_CAPACITY: Capacity must be an integer between 1 and 200.');
    }

    // Verify form master if provided
    if (data.formMasterId) {
      const staffCheck = await this.executeQuery<{ id: string; school_id: string; is_active: boolean }>(
        'SELECT id, school_id, is_active FROM staff WHERE id = $1 LIMIT 1;',
        [data.formMasterId],
        client
      );
      if (!staffCheck[0]) {
        throw new Error('STAFF_NOT_FOUND: Form master staff record not found.');
      }
      if (staffCheck[0].school_id !== data.schoolId) {
        throw new Error('CROSS_SCHOOL_STAFF_VIOLATION: Form master must belong to the same school.');
      }
      if (staffCheck[0].is_active === false) {
        throw new Error('INACTIVE_STAFF_VIOLATION: Cannot assign an inactive staff member as form master.');
      }
    }

    const sql = `
      INSERT INTO ${this.tableName} (
        school_id, level, arm, name, category, classroom_block, capacity, form_master_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const rows = await this.executeQuery<ClassDbEntity>(
      sql,
      [data.schoolId, level, arm, name, category, data.classroomBlock || null, capacity, data.formMasterId || null],
      client
    );
    return rows[0];
  }

  /**
   * Updates an existing class with server-side validation
   */
  public async updateClass(
    classId: string,
    schoolId: string,
    updates: {
      level?: string;
      arm?: 'kindergarten' | 'primary' | 'secondary';
      name?: string;
      category?: string;
      classroomBlock?: string | null;
      capacity?: number;
      formMasterId?: string | null;
    },
    client?: PoolClient
  ): Promise<ClassDbEntity> {
    const existing = await this.findByIdAndSchool(classId, schoolId, client);
    if (!existing) {
      throw new Error('CLASS_NOT_FOUND: Class record not found or access denied.');
    }

    // Verify form master if being updated
    if (updates.formMasterId !== undefined && updates.formMasterId !== null) {
      const staffCheck = await this.executeQuery<{ id: string; school_id: string; is_active: boolean }>(
        'SELECT id, school_id, is_active FROM staff WHERE id = $1 LIMIT 1;',
        [updates.formMasterId],
        client
      );
      if (!staffCheck[0]) {
        throw new Error('STAFF_NOT_FOUND: Form master staff record not found.');
      }
      if (staffCheck[0].school_id !== schoolId) {
        throw new Error('CROSS_SCHOOL_STAFF_VIOLATION: Form master must belong to the same school.');
      }
      if (staffCheck[0].is_active === false) {
        throw new Error('INACTIVE_STAFF_VIOLATION: Cannot assign an inactive staff member as form master.');
      }
    }

    const setClauses: string[] = ['updated_at = NOW()'];
    const params: any[] = [classId, schoolId];

    if (updates.level !== undefined) {
      const level = updates.level.trim();
      if (!level) throw new Error('INVALID_CLASS_LEVEL: Class level cannot be empty.');
      params.push(level);
      setClauses.push(`level = $${params.length}`);
    }

    if (updates.name !== undefined) {
      const name = updates.name.trim();
      if (!name || name.length < 2) throw new Error('INVALID_CLASS_NAME: Class name must be at least 2 characters.');
      params.push(name);
      setClauses.push(`name = $${params.length}`);
    }

    if (updates.arm !== undefined) {
      if (!['kindergarten', 'primary', 'secondary'].includes(updates.arm)) {
        throw new Error('INVALID_ARM: Arm must be one of kindergarten, primary, secondary.');
      }
      params.push(updates.arm);
      setClauses.push(`arm = $${params.length}`);
    }

    if (updates.category !== undefined) {
      params.push(updates.category.trim() || 'General');
      setClauses.push(`category = $${params.length}`);
    }

    if (updates.classroomBlock !== undefined) {
      params.push(updates.classroomBlock ? updates.classroomBlock.trim() : null);
      setClauses.push(`classroom_block = $${params.length}`);
    }

    if (updates.capacity !== undefined) {
      const capacity = Number(updates.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
        throw new Error('INVALID_CAPACITY: Capacity must be an integer between 1 and 200.');
      }
      params.push(capacity);
      setClauses.push(`capacity = $${params.length}`);
    }

    if (updates.formMasterId !== undefined) {
      params.push(updates.formMasterId || null);
      setClauses.push(`form_master_id = $${params.length}`);
    }

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND school_id = $2
      RETURNING *;
    `;
    const rows = await this.executeQuery<ClassDbEntity>(sql, params, client);
    return rows[0];
  }
}
