/**
 * BummptEducation — Academic Session Repository (Reference Implementation)
 * 
 * Demonstrates the BaseRepository pattern for global state fixtures.
 * Note: Academic sessions are shared across all schools (isMultiTenant = false).
 */

import { BaseRepository } from './base.repository';
import type { BaseDbEntity, QueryOptions } from '../types';

export interface AcademicSessionEntity extends BaseDbEntity {
  session_name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
}

export class AcademicSessionRepository extends BaseRepository<AcademicSessionEntity> {
  protected readonly tableName = 'academic_sessions';
  protected readonly isMultiTenant = false; // State-wide shared entity

  /**
   * Retrieves the active current academic session.
   */
  public async getCurrentSession(options?: QueryOptions): Promise<AcademicSessionEntity | null> {
    const results = await this.findMany('is_current = true', [], {
      ...options,
      limit: 1,
    });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Retrieves an academic session by its human-readable name (e.g., "2025/2026").
   */
  public async findByName(sessionName: string, options?: QueryOptions): Promise<AcademicSessionEntity | null> {
    const results = await this.findMany('session_name = $1', [sessionName], {
      ...options,
      limit: 1,
    });
    return results.length > 0 ? results[0] : null;
  }
}

// Singleton repository instance
export const academicSessionRepository = new AcademicSessionRepository();
