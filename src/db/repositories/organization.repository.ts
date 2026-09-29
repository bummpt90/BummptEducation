/**
 * BummptEducation — Organization Repository (Phase 10C)
 *
 * Provides type-safe PostgreSQL operations for authoritative Organization / Tenant
 * records (organizations table).
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { OrganizationDbEntity } from '../types';

export interface CreateOrganizationDto {
  name: string;
  code: string;
}

export class OrganizationRepository extends BaseRepository<OrganizationDbEntity> {
  protected readonly tableName = 'organizations';
  protected readonly isMultiTenant = false;

  /**
   * Finds an organization by its unique normalized institutional code
   */
  public async findByCode(code: string, client?: PoolClient): Promise<OrganizationDbEntity | null> {
    const cleanCode = code.trim().toUpperCase();
    const sql = `
      SELECT *
      FROM ${this.tableName}
      WHERE UPPER(code) = $1
      LIMIT 1;
    `;
    const rows = await this.executeQuery<OrganizationDbEntity>(sql, [cleanCode], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Finds an organization by its normalized name (case-insensitive)
   */
  public async findByName(name: string, client?: PoolClient): Promise<OrganizationDbEntity | null> {
    const cleanName = name.trim();
    const sql = `
      SELECT *
      FROM ${this.tableName}
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1;
    `;
    const rows = await this.executeQuery<OrganizationDbEntity>(sql, [cleanName], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Lists all provisioned organizations ordered by creation date
   */
  public async listAll(client?: PoolClient): Promise<OrganizationDbEntity[]> {
    const sql = `
      SELECT *
      FROM ${this.tableName}
      ORDER BY created_at ASC, name ASC;
    `;
    return this.executeQuery<OrganizationDbEntity>(sql, [], client);
  }

  /**
   * Creates a new authoritative organization record
   */
  public async createOrganization(
    data: CreateOrganizationDto,
    client?: PoolClient
  ): Promise<OrganizationDbEntity> {
    const cleanName = data.name.trim();
    const cleanCode = data.code.trim().toUpperCase();
    const sql = `
      INSERT INTO ${this.tableName} (
        name,
        code
      ) VALUES ($1, $2)
      RETURNING *;
    `;
    const rows = await this.executeQuery<OrganizationDbEntity>(sql, [cleanName, cleanCode], client);
    return rows[0];
  }
}

export const organizationRepository = new OrganizationRepository();
