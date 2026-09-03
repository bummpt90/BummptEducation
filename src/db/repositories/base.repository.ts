/**
 * BummptEducation — Base Repository Architecture
 * 
 * Provides an abstract, type-safe data access foundation with built-in:
 * - Multi-tenant isolation enforcement (school-level boundary security)
 * - Parameterized query execution protecting against SQL injection
 * - Transparent transaction support via optional PoolClient pass-through
 * - Pagination and ordering utilities
 */

import type { PoolClient, QueryResultRow } from 'pg';
import { query } from '../client';
import { DatabaseQueryError, TenantIsolationError } from '../errors';
import type { BaseDbEntity, PaginatedResult, QueryOptions, TenantContext } from '../types';

export abstract class BaseRepository<T extends BaseDbEntity> {
  protected abstract readonly tableName: string;
  protected readonly primaryKey: string = 'id';
  protected readonly tenantColumn: string = 'school_id';
  protected readonly isMultiTenant: boolean = true;

  /**
   * Builds a safe WHERE clause enforcing multi-tenant isolation when schoolId is present.
   */
  protected applyTenantScope(
    customWhere?: string,
    initialParams: any[] = [],
    tenantContext?: TenantContext,
    tableAlias?: string
  ): { whereSql: string; params: any[] } {
    const params = [...initialParams];
    const conditions: string[] = [];

    if (customWhere && customWhere.trim().length > 0) {
      conditions.push(`(${customWhere})`);
    }

    // If the entity supports multi-tenancy and a schoolId is supplied in context
    if (this.isMultiTenant && tenantContext?.schoolId && !tenantContext.isSuperAdmin) {
      params.push(tenantContext.schoolId);
      const col = tableAlias ? `${tableAlias}.${this.tenantColumn}` : this.tenantColumn;
      conditions.push(`${col} = $${params.length}`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereSql, params };
  }

  /**
   * Executes a raw parameterized query within the repository context.
   */
  protected async executeQuery<R extends QueryResultRow = T>(
    sql: string,
    params: any[] = [],
    client?: PoolClient
  ): Promise<R[]> {
    const result = await query<R>(sql, params, client);
    return result.rows;
  }

  /**
   * Finds a single entity by its primary key with tenant isolation check.
   */
  public async findById(
    id: string,
    options?: QueryOptions
  ): Promise<T | null> {
    const initialParams = [id];
    const { whereSql, params } = this.applyTenantScope(
      `${this.primaryKey} = $1`,
      initialParams,
      options?.tenantContext
    );

    const sql = `SELECT * FROM ${this.tableName} ${whereSql} LIMIT 1;`;
    const rows = await this.executeQuery<T>(sql, params, options?.client);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Finds multiple entities matching an optional WHERE condition and tenant scope.
   */
  public async findMany(
    customWhere?: string,
    customParams: any[] = [],
    options?: QueryOptions
  ): Promise<T[]> {
    const { whereSql, params } = this.applyTenantScope(
      customWhere,
      customParams,
      options?.tenantContext
    );

    let sql = `SELECT * FROM ${this.tableName} ${whereSql}`;

    if (options?.orderBy) {
      // Safe order by column extraction (alphanumeric and underscores only)
      const sanitizedOrder = options.orderBy.replace(/[^a-zA-Z0-9_ ]/g, '').trim();
      if (sanitizedOrder) {
        sql += ` ORDER BY ${sanitizedOrder}`;
      }
    }

    if (options?.limit && options.limit > 0) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
    }

    if (options?.offset && options.offset > 0) {
      params.push(options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    sql += ';';

    return this.executeQuery<T>(sql, params, options?.client);
  }

  /**
   * Counts total matching records respecting tenant boundaries.
   */
  public async count(
    customWhere?: string,
    customParams: any[] = [],
    options?: QueryOptions
  ): Promise<number> {
    const { whereSql, params } = this.applyTenantScope(
      customWhere,
      customParams,
      options?.tenantContext
    );

    const sql = `SELECT COUNT(*)::int as count FROM ${this.tableName} ${whereSql};`;
    const rows = await this.executeQuery<{ count: number }>(sql, params, options?.client);

    return rows[0]?.count ?? 0;
  }

  /**
   * Finds paginated entities with metadata.
   */
  public async findPaginated(
    customWhere?: string,
    customParams: any[] = [],
    options: QueryOptions = {}
  ): Promise<PaginatedResult<T>> {
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = options.offset && options.offset >= 0 ? options.offset : 0;

    const total = await this.count(customWhere, customParams, options);
    const data = await this.findMany(customWhere, customParams, {
      ...options,
      limit,
      offset,
    });

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    };
  }

  /**
   * Validates that an entity belongs to the tenant before mutation.
   */
  protected async verifyTenantOwnership(
    id: string,
    tenantContext?: TenantContext,
    client?: PoolClient
  ): Promise<boolean> {
    if (!this.isMultiTenant || !tenantContext?.schoolId || tenantContext.isSuperAdmin) {
      return true;
    }

    const existing = await this.findById(id, { client, tenantContext });
    if (!existing) {
      throw new TenantIsolationError(`Tenant isolation check failed: ${this.tableName} with ID ${id} not accessible.`);
    }

    return true;
  }
}
