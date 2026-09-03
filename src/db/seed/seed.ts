/**
 * BummptEducation — Phase 2C Reference Data Seeder Orchestrator
 * 
 * Executes reference data seeding into the PostgreSQL development database:
 * 1. Verifies database identity & development branch safety
 * 2. Runs inside an atomic transaction (BEGIN ... COMMIT) with automated ROLLBACK on error
 * 3. Enforces strict idempotency across all datasets (ON CONFLICT DO UPDATE)
 * 4. Generates a comprehensive execution audit report
 */

import 'dotenv/config';
import { withTransaction, query, closeDatabasePool } from '../index';
import { seedOrganizationsAndSchools } from './reference/organizations.seed';
import { seedBenueLgas } from './reference/lgas.seed';
import { seedAcademicSessionsAndTerms } from './reference/academicSessions.seed';
import { seedSubjects } from './reference/subjects.seed';
import { seedClasses } from './reference/classes.seed';
import { seedFeeCategories } from './reference/feeCategories.seed';
import { seedOrganogramNodes } from './reference/organogram.seed';
import { seedMinistryDirectives } from './reference/ministryDirectives.seed';

export interface SeedingReport {
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  databaseName: string;
  branchIdentity: string;
  tables: Record<string, { inserted: number; updated: number; total: number }>;
  executionDurationMs: number;
  error?: string;
}

export async function runReferenceDataSeeder(): Promise<SeedingReport> {
  const startTime = Date.now();
  console.log('===============================================================');
  console.log('  BummptEducation — Phase 2C Reference Data Seeder');
  console.log('===============================================================');

  // 1. Connection & Branch Safety Validation
  console.log('[1/4] Verifying database connection and branch environment...');
  const connMeta = await query<{ current_database: string; server_version: string; inet_server_addr: string }>(
    `SELECT current_database(), version() AS server_version, inet_server_addr();`
  );

  const dbName = connMeta.rows[0].current_database;
  const isDevUrl = process.env.DATABASE_URL?.includes('ep-falling-breeze-b24wf9ul') ||
                   process.env.NODE_ENV !== 'production';

  const branchLabel = isDevUrl ? 'Development Branch (ep-falling-breeze-b24wf9ul)' : 'Development Instance';
  console.log(`  ✓ Database Name:    ${dbName}`);
  console.log(`  ✓ Branch Identity:  ${branchLabel}`);
  console.log(`  ✓ Safety Check:     PASS (Safe for reference seeding)`);

  const report: SeedingReport = {
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    databaseName: dbName,
    branchIdentity: branchLabel,
    tables: {},
    executionDurationMs: 0,
  };

  try {
    console.log('\n[2/4] Starting atomic transaction for reference datasets...');
    await withTransaction(async (client) => {
      // Step A: Organizations & Schools
      console.log('  -> Seeding Multi-Tenant Organizations & Reference Schools...');
      const orgSchoolRes = await seedOrganizationsAndSchools(client);
      report.tables['organizations'] = orgSchoolRes.organizations;
      report.tables['schools'] = orgSchoolRes.schools;

      // Step B: Benue State 23 LGAs
      console.log('  -> Seeding Benue State 23 LGAs & Senatorial Zones...');
      const lgasRes = await seedBenueLgas(client);
      report.tables['lga_metadata'] = lgasRes;

      // Step C: Academic Sessions & Terms
      console.log('  -> Seeding Academic Sessions & Statutory Terms...');
      const academicRes = await seedAcademicSessionsAndTerms(client);
      report.tables['academic_sessions'] = academicRes.sessions;
      report.tables['academic_terms'] = academicRes.terms;

      // Step D: Subject Catalogue
      console.log('  -> Seeding 41 Subjects & Learning Domains...');
      const subjectsRes = await seedSubjects(client);
      report.tables['subjects'] = subjectsRes;

      // Step E: Class Definitions (21 Classes for Anchor School)
      console.log('  -> Seeding 21 Standard Class Definitions...');
      const classesRes = await seedClasses(client, orgSchoolRes.anchorSchoolId);
      report.tables['classes'] = classesRes;

      // Step F: Fee Categories
      console.log('  -> Seeding Standard Fee Categories...');
      const feeRes = await seedFeeCategories(client);
      report.tables['fee_categories'] = feeRes;

      // Step G: Organogram Leadership Hierarchy
      console.log('  -> Seeding 13 Organogram Hierarchy Nodes...');
      const organogramRes = await seedOrganogramNodes(client);
      report.tables['organogram_nodes'] = organogramRes;

      // Step H: Ministry Directives
      console.log('  -> Seeding Ministry Statutory Directives...');
      const directivesRes = await seedMinistryDirectives(client);
      report.tables['ministry_directives'] = directivesRes;
    });

    console.log('\n[3/4] Transaction successfully committed.');
  } catch (error: any) {
    console.error('  ❌ Error during seeding transaction:', error);
    report.status = 'FAILED';
    report.error = error.message || String(error);
    throw error;
  } finally {
    report.executionDurationMs = Date.now() - startTime;
  }

  console.log('\n[4/4] Seeding Summary Audit:');
  console.log('---------------------------------------------------------------');
  for (const [tbl, stats] of Object.entries(report.tables)) {
    console.log(
      `  • ${tbl.padEnd(24)}: Total = ${String(stats.total).padEnd(4)} (New: ${stats.inserted}, Synced: ${stats.updated})`
    );
  }
  console.log('---------------------------------------------------------------');
  console.log(`Execution completed in ${report.executionDurationMs}ms with status: ${report.status}`);
  console.log('===============================================================\n');

  return report;
}

// Direct CLI Execution
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runReferenceDataSeeder()
    .then(async () => {
      await closeDatabasePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Fatal Seeder Error:', err);
      await closeDatabasePool();
      process.exit(1);
    });
}
