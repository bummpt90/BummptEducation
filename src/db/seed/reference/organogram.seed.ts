/**
 * BummptEducation — Organogram & Leadership Hierarchy Seeder
 * 
 * Populates all 13 institutional organogram nodes spanning:
 * - Executive Leadership & Governance (Proprietor & Executive Director)
 * - Early Years Wing (Head of Early Childhood & Facilitators)
 * - Primary Wing (Headmistress & Class Masters)
 * - Secondary Academic Wing (Principal, VP Academics, Exam Officer, HODs)
 * - Central Administrative Wing (Registrar, Bursar)
 * - Student Leadership & Prefect Councils
 * 
 * Idempotent: ON CONFLICT (node_key) DO UPDATE
 */

import type { PoolClient } from 'pg';
import { ORGANOGRAM_DATA } from '../../../data/mockData';
import type { SeedResultSummary } from './organizations.seed';

export async function seedOrganogramNodes(client: PoolClient): Promise<SeedResultSummary> {
  let inserted = 0;
  let updated = 0;

  let sortOrder = 1;
  for (const node of ORGANOGRAM_DATA) {
    const res = await client.query<{ id: string; is_inserted: boolean }>(
      `INSERT INTO organogram_nodes (
         node_key, title, holder_name, wing, arm,
         reports_to_node_key, description, responsibilities, sort_order
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9
       )
       ON CONFLICT (node_key) DO UPDATE SET
         title = EXCLUDED.title,
         holder_name = EXCLUDED.holder_name,
         wing = EXCLUDED.wing,
         arm = EXCLUDED.arm,
         reports_to_node_key = EXCLUDED.reports_to_node_key,
         description = EXCLUDED.description,
         responsibilities = EXCLUDED.responsibilities,
         sort_order = EXCLUDED.sort_order,
         updated_at = NOW()
       RETURNING id, (xmax = 0) AS is_inserted;`,
      [
        node.id, // e.g. 'ORG-01', 'ORG-EY-01'
        node.title,
        node.holderName,
        node.wing,
        node.arm || 'central',
        node.reportsTo || null,
        node.description,
        node.responsibilities || [],
        sortOrder++,
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
    total: ORGANOGRAM_DATA.length,
  };
}
