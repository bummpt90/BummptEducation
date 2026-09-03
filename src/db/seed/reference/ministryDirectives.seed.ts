/**
 * BummptEducation — Ministry Directives & State Policies Seeder
 * 
 * Populates foundational statutory circulars & executive orders from the
 * Benue State Ministry of Education and SUBEB:
 * - 40/60 Continuous Assessment & Terminal Exam Compliance Guideline
 * - UBE Free Instructional Materials & School Feeding Quality Protocol
 * - STEM Laboratory Consumables & Practical Reagents Subventions
 * - Zonal Joint Security & Safe-Schools Advisory
 * 
 * Idempotent: ON CONFLICT (reference_number) DO UPDATE
 */

import type { PoolClient } from 'pg';
import { INITIAL_MINISTRY_DIRECTIVES } from '../../../data/benueDirectivesData';
import type { SeedResultSummary } from './organizations.seed';

export async function seedMinistryDirectives(client: PoolClient): Promise<SeedResultSummary> {
  let inserted = 0;
  let updated = 0;

  for (const dir of INITIAL_MINISTRY_DIRECTIVES) {
    const res = await client.query<{ id: string; is_inserted: boolean }>(
      `INSERT INTO ministry_directives (
         reference_number, title, category, priority,
         target_audience, target_lga, target_school_name,
         issued_by, issuing_office, issued_date, effective_date,
         content, action_required, status
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, $7,
         $8, $9, $10, $11,
         $12, $13, $14
       )
       ON CONFLICT (reference_number) DO UPDATE SET
         title = EXCLUDED.title,
         category = EXCLUDED.category,
         priority = EXCLUDED.priority,
         target_audience = EXCLUDED.target_audience,
         target_lga = EXCLUDED.target_lga,
         target_school_name = EXCLUDED.target_school_name,
         issued_by = EXCLUDED.issued_by,
         issuing_office = EXCLUDED.issuing_office,
         issued_date = EXCLUDED.issued_date,
         effective_date = EXCLUDED.effective_date,
         content = EXCLUDED.content,
         action_required = EXCLUDED.action_required,
         status = EXCLUDED.status,
         updated_at = NOW()
       RETURNING id, (xmax = 0) AS is_inserted;`,
      [
        dir.referenceNumber,
        dir.title,
        dir.category,
        dir.priority,
        dir.targetAudience,
        dir.targetLGA || null,
        dir.targetSchoolName || null,
        dir.issuedBy,
        dir.issuingOffice,
        dir.issuedDate,
        dir.effectiveDate,
        dir.content,
        dir.actionRequired,
        dir.status,
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
    total: INITIAL_MINISTRY_DIRECTIVES.length,
  };
}
