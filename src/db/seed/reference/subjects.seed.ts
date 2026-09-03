/**
 * BummptEducation — Curriculum / Subject Catalogue Seeder
 * 
 * Populates all 41 subjects across:
 * - Kindergarten / Early Years (8 learning domains)
 * - Primary School Basic Education (14 UBE subjects)
 * - Secondary School Curriculum (19 JSS & SSS core/departmental subjects)
 * 
 * Idempotent: ON CONFLICT (code) DO UPDATE
 */

import type { PoolClient } from 'pg';
import { ALL_SUBJECTS } from '../../../data/mockData';
import type { SeedResultSummary } from './organizations.seed';

export async function seedSubjects(client: PoolClient): Promise<SeedResultSummary> {
  let inserted = 0;
  let updated = 0;

  for (const subject of ALL_SUBJECTS) {
    const res = await client.query<{ id: string; is_inserted: boolean }>(
      `INSERT INTO subjects (
         code, name, category, department_id, arm, applicable_levels
       ) VALUES (
         $1, $2, $3, $4, $5, $6
       )
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         department_id = EXCLUDED.department_id,
         arm = EXCLUDED.arm,
         applicable_levels = EXCLUDED.applicable_levels,
         updated_at = NOW()
       RETURNING id, (xmax = 0) AS is_inserted;`,
      [
        subject.code,
        subject.name,
        subject.category,
        subject.departmentId,
        subject.arm,
        subject.applicableLevels,
      ]
    );

    if ((res.rows[0] as any).is_inserted) {
      inserted++;
    } else {
      updated++;
    }
  }

  return {
    inserted,
    updated,
    total: ALL_SUBJECTS.length,
  };
}
