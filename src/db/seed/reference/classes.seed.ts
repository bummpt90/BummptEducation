/**
 * BummptEducation — Standard Class Definitions Seeder
 * 
 * Populates all 21 standard classes for the demonstration school:
 * - Kindergarten (3): KG 1, KG 2, KG 3
 * - Primary (6): Basic 1, Basic 2, Basic 3, Basic 4, Basic 5, Basic 6
 * - Junior Secondary (3): JSS 1, JSS 2, JSS 3
 * - Senior Secondary Pathways (9):
 *   - SSS 1 Science, SSS 1 Arts, SSS 1 Commercial
 *   - SSS 2 Science, SSS 2 Arts, SSS 2 Commercial
 *   - SSS 3 Science, SSS 3 Arts, SSS 3 Commercial
 * 
 * Idempotent: ON CONFLICT (school_id, level, name) DO UPDATE
 */

import type { PoolClient } from 'pg';
import { ALL_CLASSES_DEFINITIONS } from '../../../data/attendanceData';
import type { SeedResultSummary } from './organizations.seed';

export async function seedClasses(
  client: PoolClient,
  schoolId: string
): Promise<SeedResultSummary> {
  let inserted = 0;
  let updated = 0;

  for (const cls of ALL_CLASSES_DEFINITIONS) {
    const res = await client.query<{ id: string; is_inserted: boolean }>(
      `INSERT INTO classes (
         school_id, level, arm, name, category, classroom_block, capacity
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7
       )
       ON CONFLICT (school_id, level, name) DO UPDATE SET
         arm = EXCLUDED.arm,
         category = EXCLUDED.category,
         classroom_block = EXCLUDED.classroom_block,
         capacity = EXCLUDED.capacity,
         updated_at = NOW()
       RETURNING id, (xmax = 0) AS is_inserted;`,
      [
        schoolId,
        cls.level,
        cls.arm,
        cls.name,
        cls.category,
        cls.classroom,
        cls.capacity,
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
    total: ALL_CLASSES_DEFINITIONS.length,
  };
}
