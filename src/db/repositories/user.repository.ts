/**
 * BummptEducation — User Repository
 * 
 * Provides type-safe database queries for User management, authentication,
 * login attempts tracking, and account security.
 */

import type { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import type { UserDbEntity } from '../types';

export class UserRepository extends BaseRepository<UserDbEntity> {
  protected readonly tableName = 'users';
  protected readonly isMultiTenant = false; // Users can be global (Super Admin / State HQ) or school-scoped

  /**
   * Finds a user by email address (case-insensitive)
   */
  public async findByEmail(email: string, client?: PoolClient): Promise<UserDbEntity | null> {
    const cleanEmail = email.trim().toLowerCase();
    const sql = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE LOWER(email) = LOWER($1) 
      LIMIT 1;
    `;
    const rows = await this.executeQuery<UserDbEntity>(sql, [cleanEmail], client);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Creates a new user record with secure password hash
   */
  public async createUser(
    userData: {
      email: string;
      passwordHash: string;
      fullName: string;
      role: string;
      schoolId?: string | null;
      phone?: string | null;
      isActive?: boolean;
      emailVerified?: boolean;
    },
    client?: PoolClient
  ): Promise<UserDbEntity> {
    const cleanEmail = userData.email.trim().toLowerCase();
    const sql = `
      INSERT INTO ${this.tableName} (
        school_id, email, phone, password_hash, full_name, role, is_active, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      userData.schoolId || null,
      cleanEmail,
      userData.phone || null,
      userData.passwordHash,
      userData.fullName,
      userData.role,
      userData.isActive ?? true,
      userData.emailVerified ?? false,
    ];

    const rows = await this.executeQuery<UserDbEntity>(sql, params, client);
    return rows[0];
  }

  /**
   * Updates user records upon successful authentication
   */
  public async updateLoginSuccess(id: string, client?: PoolClient): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET 
        failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = NOW(),
        updated_at = NOW()
      WHERE id = $1;
    `;
    await this.executeQuery(sql, [id], client);
  }

  /**
   * Increments failed login count and locks account if threshold exceeded
   */
  public async recordFailedAttempt(
    id: string,
    maxAttempts = 5,
    lockoutMinutes = 15,
    client?: PoolClient
  ): Promise<{ failedAttempts: number; isLocked: boolean; lockedUntil: Date | null }> {
    // Increment failed attempts
    const incSql = `
      UPDATE ${this.tableName}
      SET 
        failed_login_attempts = failed_login_attempts + 1,
        updated_at = NOW()
      WHERE id = $1
      RETURNING failed_login_attempts;
    `;
    const incRows = await this.executeQuery<{ failed_login_attempts: number }>(incSql, [id], client);
    const failedAttempts = incRows[0]?.failed_login_attempts || 1;

    if (failedAttempts >= maxAttempts) {
      const lockSql = `
        UPDATE ${this.tableName}
        SET 
          locked_until = NOW() + ($2 || ' minutes')::interval,
          updated_at = NOW()
        WHERE id = $1
        RETURNING locked_until;
      `;
      const lockRows = await this.executeQuery<{ locked_until: Date }>(lockSql, [id, `${lockoutMinutes}`], client);
      return {
        failedAttempts,
        isLocked: true,
        lockedUntil: lockRows[0]?.locked_until || null,
      };
    }

    return {
      failedAttempts,
      isLocked: false,
      lockedUntil: null,
    };
  }

  /**
   * Manually locks or unlocks a user account
   */
  public async setAccountLock(id: string, lockedUntil: Date | null, client?: PoolClient): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET 
        locked_until = $2,
        updated_at = NOW()
      WHERE id = $1;
    `;
    await this.executeQuery(sql, [id, lockedUntil], client);
  }

  /**
   * Updates user password hash
   */
  public async updatePassword(id: string, newPasswordHash: string, client?: PoolClient): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET 
        password_hash = $2,
        password_changed_at = NOW(),
        failed_login_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
      WHERE id = $1;
    `;
    await this.executeQuery(sql, [id, newPasswordHash], client);
  }
}

export const userRepository = new UserRepository();
