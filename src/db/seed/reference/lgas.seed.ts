/**
 * BummptEducation — Benue State 23 LGAs & Senatorial Zones Seeder
 * 
 * Populates all 23 Local Government Areas across:
 * - Zone A (Benue North-East) - 7 LGAs
 * - Zone B (Benue North-West) - 7 LGAs
 * - Zone C (Benue South)      - 9 LGAs
 * 
 * Idempotent: ON CONFLICT (lga) DO UPDATE
 */

import type { PoolClient } from 'pg';
import { BENUE_LGAS_METADATA } from '../../../data/benueStateData';
import type { SeedResultSummary } from './organizations.seed';

export async function seedBenueLgas(client: PoolClient): Promise<SeedResultSummary> {
  let inserted = 0;
  let updated = 0;

  for (const lga of BENUE_LGAS_METADATA) {
    const res = await client.query<{ id: string; is_inserted: boolean }>(
      `INSERT INTO lga_metadata (
         lga, zone, headquarters, education_secretary,
         total_government_schools, total_student_population, total_teacher_count,
         average_pass_rate, subvention_disbursed_naira, priority_flag
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, $7,
         $8, $9, $10
       )
       ON CONFLICT (lga) DO UPDATE SET
         zone = EXCLUDED.zone,
         headquarters = EXCLUDED.headquarters,
         education_secretary = EXCLUDED.education_secretary,
         total_government_schools = EXCLUDED.total_government_schools,
         total_student_population = EXCLUDED.total_student_population,
         total_teacher_count = EXCLUDED.total_teacher_count,
         average_pass_rate = EXCLUDED.average_pass_rate,
         subvention_disbursed_naira = EXCLUDED.subvention_disbursed_naira,
         priority_flag = EXCLUDED.priority_flag,
         updated_at = NOW()
       RETURNING id, (xmax = 0) AS is_inserted;`,
      [
        lga.lga,
        lga.zone,
        lga.headquarters,
        lga.educationSecretary,
        lga.totalGovernmentSchools,
        lga.totalStudentPopulation,
        lga.totalTeacherCount,
        lga.averagePassRate,
        lga.subventionDisbursedNaira,
        lga.priorityFlag,
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
    total: BENUE_LGAS_METADATA.length,
  };
}
