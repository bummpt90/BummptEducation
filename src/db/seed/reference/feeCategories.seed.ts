/**
 * BummptEducation — Standard Fee Categories Seeder
 * 
 * Populates institutional fee categories:
 * - Tuition & Academic Instruction
 * - Development & Capital Infrastructure Levy
 * - STEM, ICT & Robotics Laboratory Levy
 * - Phonics & Montessori Learning Materials
 * - Examination, BroadSheet & Terminal Report Card Fee
 * - Sports, Physical & Health Education Levy
 * - Medical & First Aid Retainership Fee
 * - Digital Parent Portal & SMS Notification Fee
 * 
 * Idempotent: ON CONFLICT (name) DO UPDATE
 */

import type { PoolClient } from 'pg';
import type { SeedResultSummary } from './organizations.seed';

export const STANDARD_FEE_CATEGORIES = [
  {
    name: 'Tuition & Academic Instruction',
    description: 'Core termly instructional fees across Early Years, Primary Basic, and Secondary wings.',
  },
  {
    name: 'Development & Capital Infrastructure Levy',
    description: 'School campus maintenance, lab modernization, security, and facility expansion fund.',
  },
  {
    name: 'STEM, ICT & Robotics Laboratory Levy',
    description: 'Practical reagents, computer laboratory access, robotics kits, and coding curriculum materials.',
  },
  {
    name: 'Phonics & Montessori Learning Materials',
    description: 'Specialized sensory aids, phonetics workbooks, and early childhood developmental toolkits.',
  },
  {
    name: 'Examination, BroadSheet & Terminal Report Card Fee',
    description: 'Terminal test stationery, standardized examination booklets, and digital BroadSheet verification.',
  },
  {
    name: 'Sports, Physical & Health Education Levy',
    description: 'Inter-house sports equipment, physical training gear, and athletic competition logistics.',
  },
  {
    name: 'Medical & First Aid Retainership Fee',
    description: 'Campus infirmary retainership, emergency medical supplies, and routine pediatric triage.',
  },
  {
    name: 'Digital Parent Portal & SMS Notification Fee',
    description: 'Real-time parent portal access, SMS attendance alerts, and cloud result processing.',
  },
];

export async function seedFeeCategories(client: PoolClient): Promise<SeedResultSummary> {
  let inserted = 0;
  let updated = 0;

  for (const cat of STANDARD_FEE_CATEGORIES) {
    const res = await client.query<{ id: string; is_inserted: boolean }>(
      `INSERT INTO fee_categories (name, description, is_active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (name) DO UPDATE SET
         description = EXCLUDED.description,
         is_active = TRUE
       RETURNING id, (xmax = 0) AS is_inserted;`,
      [cat.name, cat.description]
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
    total: STANDARD_FEE_CATEGORIES.length,
  };
}
