/**
 * BummptEducation — Reference Organizations & Schools Seeder
 * 
 * Populates:
 * 1. Root Multi-Tenant Organization ('BUMMPTECH-GLOBAL' / Benue State Ministry of Education)
 * 2. Demonstration / Anchor Comprehensive School ('BNS-MKD-000')
 * 3. 13 Benue State Government Reference Catalogue Schools ('BNS-MKD-001' to 'BNS-OTK-001')
 * 
 * Idempotent: uses ON CONFLICT (code) DO UPDATE
 */

import type { PoolClient } from 'pg';
import { BENUE_GOVERNMENT_SCHOOLS } from '../../../data/benueStateData';

export interface SeedResultSummary {
  inserted: number;
  updated: number;
  total: number;
}

export async function seedOrganizationsAndSchools(client: PoolClient): Promise<{
  organizations: SeedResultSummary;
  schools: SeedResultSummary;
  anchorSchoolId: string;
}> {
  // 1. Root Organization
  const orgCode = 'BUMMPTECH-GLOBAL';
  const orgName = 'Bummptech Global Concepts / Benue State Educational Trust';

  const orgRes = await client.query<{ id: string; xmax: string }>(
    `INSERT INTO organizations (code, name)
     VALUES ($1, $2)
     ON CONFLICT (code) DO UPDATE
     SET name = EXCLUDED.name, updated_at = NOW()
     RETURNING id, (xmax = 0) AS is_inserted;`,
    [orgCode, orgName]
  );

  const organizationId = orgRes.rows[0].id;
  const isOrgInserted = Boolean((orgRes.rows[0] as any).is_inserted);

  // 2. Anchor Demonstration School
  const anchorSchoolCode = 'BNS-MKD-000';
  const anchorRes = await client.query<{ id: string; is_inserted: boolean }>(
    `INSERT INTO schools (
       organization_id, code, name, lga, senatorial_zone, category,
       principal_name, bursar_name, phone, email, address, is_active,
       established_year, vice_principal_academic
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11, $12,
       $13, $14
     )
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name,
       lga = EXCLUDED.lga,
       senatorial_zone = EXCLUDED.senatorial_zone,
       category = EXCLUDED.category,
       principal_name = EXCLUDED.principal_name,
       bursar_name = EXCLUDED.bursar_name,
       phone = EXCLUDED.phone,
       email = EXCLUDED.email,
       address = EXCLUDED.address,
       is_active = EXCLUDED.is_active,
       established_year = EXCLUDED.established_year,
       vice_principal_academic = EXCLUDED.vice_principal_academic,
       updated_at = NOW()
     RETURNING id, (xmax = 0) AS is_inserted;`,
    [
      organizationId,
      anchorSchoolCode,
      'BummptEducation Model Comprehensive College & Academy (Demonstration School)',
      'Makurdi',
      'Zone B (Benue North-West)',
      'Co-Educational Day & Boarding Model School (KG - SSS 3)',
      'Dr. (Mrs.) Grace Nkechi Okafor (Ph.D)',
      'Mr. Jude Msughter Tyav (ICAN)',
      '+234 811 523 1834',
      'info@bummpteducation.edu.ng',
      'Km 4, Gboko Road, Wurukum, Makurdi, Benue State',
      true,
      2018,
      'Mr. Emmanuel Terkula Iorfa (M.Sc)',
    ]
  );

  const anchorSchoolId = anchorRes.rows[0].id;

  // 3. 13 Government Reference Schools Catalogue
  let schoolsInserted = (anchorRes.rows[0] as any).is_inserted ? 1 : 0;
  let schoolsUpdated = (anchorRes.rows[0] as any).is_inserted ? 0 : 1;

  for (const school of BENUE_GOVERNMENT_SCHOOLS) {
    const res = await client.query<{ id: string; is_inserted: boolean }>(
      `INSERT INTO schools (
         organization_id, code, name, lga, senatorial_zone, category,
         principal_name, bursar_name, phone, email, address, is_active,
         established_year, vice_principal_academic
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12,
         $13, $14
       )
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         lga = EXCLUDED.lga,
         senatorial_zone = EXCLUDED.senatorial_zone,
         category = EXCLUDED.category,
         principal_name = EXCLUDED.principal_name,
         bursar_name = EXCLUDED.bursar_name,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         address = EXCLUDED.address,
         is_active = EXCLUDED.is_active,
         established_year = EXCLUDED.established_year,
         vice_principal_academic = EXCLUDED.vice_principal_academic,
         updated_at = NOW()
       RETURNING id, (xmax = 0) AS is_inserted;`,
      [
        organizationId,
        school.code,
        school.name,
        school.lga,
        school.zone,
        school.category,
        school.principalName,
        school.bursarName,
        school.phone,
        school.email,
        school.address,
        true,
        school.establishedYear,
        school.vicePrincipalAcademic,
      ]
    );

    if ((res.rows[0] as any).is_inserted) {
      schoolsInserted++;
    } else {
      schoolsUpdated++;
    }
  }

  return {
    organizations: {
      inserted: isOrgInserted ? 1 : 0,
      updated: isOrgInserted ? 0 : 1,
      total: 1,
    },
    schools: {
      inserted: schoolsInserted,
      updated: schoolsUpdated,
      total: 1 + BENUE_GOVERNMENT_SCHOOLS.length, // 1 anchor + 13 catalogue = 14
    },
    anchorSchoolId,
  };
}
