/**
 * BummptEducation — Phase 3 Development Authentication & Identity Seeder
 * 
 * Generates strictly DEVELOPMENT-ONLY test accounts with Argon2id password hashes.
 * Covers all system roles and provides multi-tenant test boundaries (School A vs. School B).
 * 
 * CRITICAL SAFETY:
 * - Contains NO real personal data.
 * - All passwords hashed using Argon2id.
 * - Idempotent upserts ensuring zero duplicates.
 */

import 'dotenv/config';
import type { PoolClient } from 'pg';
import { query, withTransaction, closeDatabasePool } from '../index';
import { hashPassword } from '../../auth/password';

export interface AuthSeedReport {
  total: number;
  inserted: number;
  updated: number;
  accounts: Array<{ email: string; role: string; schoolCode: string | null }>;
}

export const DEV_DEFAULT_PASSWORD = 'BummptDev2026!';

export async function seedDevelopmentAuthIdentities(externalClient?: PoolClient): Promise<AuthSeedReport> {
  console.log('[AuthSeed] Seeding development authentication test identities with Argon2id...');

  const executeSeed = async (client: PoolClient) => {
    // 1. Resolve Anchor School (School A) and Government College Makurdi (School B)
    const schoolARes = await client.query<{ id: string; code: string }>(
      `SELECT id, code FROM schools WHERE code = 'BNS-MKD-000' OR code LIKE '%ANCHOR%' LIMIT 1;`
    );
    const schoolBRes = await client.query<{ id: string; code: string }>(
      `SELECT id, code FROM schools WHERE code = 'BNS-MKD-001' LIMIT 1;`
    );

    const schoolAId = schoolARes.rows[0]?.id || null;
    const schoolBId = schoolBRes.rows[0]?.id || null;

    if (!schoolAId || !schoolBId) {
      throw new Error('Reference schools missing. Please run reference seed first.');
    }

    // 2. Hash standard test password with Argon2id
    const standardPasswordHash = await hashPassword(DEV_DEFAULT_PASSWORD);

    const testUsers = [
      // 1. Super Administrator (Global - No school_id)
      {
        email: 'superadmin@bummpt.edu.ng',
        full_name: 'Matthew Ternenge Beeun (Super Admin)',
        role: 'super_admin',
        school_id: null,
        schoolCode: 'GLOBAL',
        phone: '+234 803 100 0001',
        is_active: true,
      },
      // 2. State Ministry Officer (Global - No school_id)
      {
        email: 'moe.officer@benuestate.gov.ng',
        full_name: 'Prof. Frederick Ikyaan (Hon. Commissioner)',
        role: 'state_officer',
        school_id: null,
        schoolCode: 'STATE_HQ',
        phone: '+234 803 100 0002',
        is_active: true,
      },
      // 3. School A - Principal
      {
        email: 'principal@anchor.bummpt.edu.ng',
        full_name: 'Dr. (Mrs.) Grace Nkechi Okafor (Principal)',
        role: 'principal',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 200 0001',
        is_active: true,
      },
      // 4. School A - Vice Principal
      {
        email: 'vp.academic@anchor.bummpt.edu.ng',
        full_name: 'Mr. Emmanuel Agba (VP Academic)',
        role: 'vice_principal',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 200 0002',
        is_active: true,
      },
      // 5. School A - Headmistress (Primary)
      {
        email: 'headmistress@anchor.bummpt.edu.ng',
        full_name: 'Mrs. Grace Iveren Shima (Headmistress)',
        role: 'headmistress',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 200 0003',
        is_active: true,
      },
      // 6. School A - Head of Early Childhood
      {
        email: 'head.kindergarten@anchor.bummpt.edu.ng',
        full_name: 'Mrs. Abigail Folashade Balogun (EY Head)',
        role: 'head_kindergarten',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 200 0004',
        is_active: true,
      },
      // 7. School A - Exam Officer
      {
        email: 'exam.officer@anchor.bummpt.edu.ng',
        full_name: 'Mr. Emmanuel Agbo (Exam Officer)',
        role: 'exam_officer',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 200 0005',
        is_active: true,
      },
      // 8. School A - Bursar
      {
        email: 'bursar@anchor.bummpt.edu.ng',
        full_name: 'Mr. Patrick Terver Gbilekaa (Chief Bursar)',
        role: 'bursar',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 200 0006',
        is_active: true,
      },
      // 9. School A - Admissions Officer
      {
        email: 'admissions@anchor.bummpt.edu.ng',
        full_name: 'Mrs. Bridget Ngunan Tor (Registrar)',
        role: 'admissions_officer',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 200 0007',
        is_active: true,
      },
      // 10. School A - Subject Teacher
      {
        email: 'teacher@anchor.bummpt.edu.ng',
        full_name: 'Mr. Christopher Terwase (Physics & Maths Teacher)',
        role: 'teacher',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 200 0008',
        is_active: true,
      },
      // 11. School A - Parent
      {
        email: 'parent@anchor.bummpt.edu.ng',
        full_name: 'Engr. Emeka Okafor (Parent Guardian)',
        role: 'parent',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 300 0001',
        is_active: true,
      },
      // 12. School A - Student
      {
        email: 'student@anchor.bummpt.edu.ng',
        full_name: 'Somtochukwu Emeka Okafor (Senior Prefect)',
        role: 'student',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 300 0002',
        is_active: true,
      },
      // 13. School B - Principal (Crucial for Multi-Tenant Isolation Testing!)
      {
        email: 'principal.gcmkd@bummpt.edu.ng',
        full_name: 'Dr. Jacob Iorliam (Principal - Govt College Makurdi)',
        role: 'principal',
        school_id: schoolBId,
        schoolCode: 'BNS-MKD-001',
        phone: '+234 803 400 0001',
        is_active: true,
      },
      // 14. Inactive Test Account (For Inactive Login Rejection Testing)
      {
        email: 'inactive.staff@anchor.bummpt.edu.ng',
        full_name: 'Inactive Former Staff (Deactivated)',
        role: 'teacher',
        school_id: schoolAId,
        schoolCode: 'BNS-MKD-000',
        phone: '+234 803 999 0000',
        is_active: false,
      },
    ];

    let inserted = 0;
    let updated = 0;

    const upsertSql = `
      INSERT INTO users (
        school_id, email, phone, password_hash, full_name, role, is_active, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      ON CONFLICT (email) DO UPDATE SET
        school_id = EXCLUDED.school_id,
        phone = EXCLUDED.phone,
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        failed_login_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
      RETURNING (xmax = 0) AS was_inserted;
    `;

    for (const u of testUsers) {
      const res = await client.query<{ was_inserted: boolean }>(upsertSql, [
        u.school_id,
        u.email,
        u.phone,
        standardPasswordHash,
        u.full_name,
        u.role,
        u.is_active,
      ]);

      if (res.rows[0]?.was_inserted) {
        inserted++;
      } else {
        updated++;
      }
    }

    console.log(`  ✓ Seeded ${testUsers.length} dev identities (${inserted} inserted, ${updated} synced).`);

    return {
      total: testUsers.length,
      inserted,
      updated,
      accounts: testUsers.map((u) => ({
        email: u.email,
        role: u.role,
        schoolCode: u.schoolCode,
      })),
    };
  };

  if (externalClient) {
    return executeSeed(externalClient);
  } else {
    return withTransaction(executeSeed);
  }
}

// Standalone execution entrypoint
if (process.argv[1]?.endsWith('auth.seed.ts') || process.argv[1]?.endsWith('auth.seed.js')) {
  seedDevelopmentAuthIdentities()
    .then(async (report) => {
      console.log('\n[AuthSeed] Complete Summary:');
      console.table(report.accounts);
      await closeDatabasePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[AuthSeed] Fatal seeding error:', err);
      await closeDatabasePool();
      process.exit(1);
    });
}
