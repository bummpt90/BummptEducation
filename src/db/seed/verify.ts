/**
 * BummptEducation — Phase 2C Reference Data Validation & Idempotency Suite
 * 
 * Verifies:
 * 1. Target table row counts match exact reference models
 * 2. Foreign key and relational integrity
 * 3. Idempotency test (executes second seed run to confirm zero duplication)
 * 4. Sample analytical queries across domains
 */

import 'dotenv/config';
import { query, closeDatabasePool } from '../index';
import { runReferenceDataSeeder } from './seed';

export interface ValidationReport {
  timestamp: string;
  tableCounts: Record<string, { expected: number; actual: number; status: 'PASS' | 'FAIL' }>;
  foreignKeys: Record<string, 'PASS' | 'FAIL'>;
  idempotencyTest: 'PASS' | 'FAIL';
  overallStatus: 'PASS' | 'FAIL';
}

export async function runReferenceValidationSuite(): Promise<ValidationReport> {
  console.log('\n===============================================================');
  console.log('  BummptEducation — Phase 2C Validation & Integrity Suite');
  console.log('===============================================================');

  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    tableCounts: {},
    foreignKeys: {},
    idempotencyTest: 'FAIL',
    overallStatus: 'PASS',
  };

  // 1. Table Count Verification
  console.log('[1/4] Checking reference table row counts against specifications:');
  const countChecks: { table: string; expected: number }[] = [
    { table: 'organizations', expected: 1 },
    { table: 'schools', expected: 14 }, // 1 Anchor Demonstration + 13 Benue Government Reference
    { table: 'lga_metadata', expected: 23 }, // 23 Benue LGAs
    { table: 'academic_sessions', expected: 3 }, // 2024/2025, 2025/2026, 2026/2027
    { table: 'academic_terms', expected: 9 }, // 3 terms * 3 sessions
    { table: 'subjects', expected: 46 }, // 8 EY + 14 Primary + 24 Secondary
    { table: 'classes', expected: 27 }, // 21 Anchor + 6 Govt College Makurdi
    { table: 'fee_categories', expected: 8 }, // 8 standard fee categories
    { table: 'organogram_nodes', expected: 13 }, // 13 organogram hierarchy nodes
    { table: 'ministry_directives', expected: 4 }, // 4 statutory policy directives
  ];

  for (const check of countChecks) {
    const res = await query<{ count: string }>(`SELECT count(*)::text as count FROM ${check.table};`);
    const actual = parseInt(res.rows[0].count, 10);
    const pass = actual === check.expected;
    report.tableCounts[check.table] = {
      expected: check.expected,
      actual,
      status: pass ? 'PASS' : 'FAIL',
    };
    if (!pass) report.overallStatus = 'FAIL';

    console.log(
      `  • ${check.table.padEnd(24)}: Actual = ${String(actual).padEnd(4)} | Expected = ${String(check.expected).padEnd(4)} [${pass ? 'PASS' : 'FAIL'}]`
    );
  }

  // 2. Foreign Key and Referential Integrity Checks
  console.log('\n[2/4] Validating Foreign Key and Relational Integrity:');

  // FK Check 1: Schools -> Organizations
  const fkSchools = await query<{ orphan_count: number }>(`
    SELECT count(*)::int AS orphan_count
    FROM schools s
    LEFT JOIN organizations o ON s.organization_id = o.id
    WHERE s.organization_id IS NOT NULL AND o.id IS NULL;
  `);
  const fkSchoolsPass = fkSchools.rows[0].orphan_count === 0;
  report.foreignKeys['schools_to_organizations'] = fkSchoolsPass ? 'PASS' : 'FAIL';
  console.log(`  • schools -> organizations FK:        ${fkSchoolsPass ? 'PASS (0 orphans)' : 'FAIL'}`);

  // FK Check 2: Classes -> Schools
  const fkClasses = await query<{ orphan_count: number }>(`
    SELECT count(*)::int AS orphan_count
    FROM classes c
    LEFT JOIN schools s ON c.school_id = s.id
    WHERE c.school_id IS NOT NULL AND s.id IS NULL;
  `);
  const fkClassesPass = fkClasses.rows[0].orphan_count === 0;
  report.foreignKeys['classes_to_schools'] = fkClassesPass ? 'PASS' : 'FAIL';
  console.log(`  • classes -> schools FK:              ${fkClassesPass ? 'PASS (0 orphans)' : 'FAIL'}`);

  // FK Check 3: Academic Terms -> Academic Sessions
  const fkTerms = await query<{ orphan_count: number }>(`
    SELECT count(*)::int AS orphan_count
    FROM academic_terms t
    LEFT JOIN academic_sessions s ON t.session_id = s.id
    WHERE t.session_id IS NOT NULL AND s.id IS NULL;
  `);
  const fkTermsPass = fkTerms.rows[0].orphan_count === 0;
  report.foreignKeys['terms_to_sessions'] = fkTermsPass ? 'PASS' : 'FAIL';
  console.log(`  • academic_terms -> sessions FK:      ${fkTermsPass ? 'PASS (0 orphans)' : 'FAIL'}`);

  // 3. Domain Sample Queries
  console.log('\n[3/4] Validating Domain Queries:');
  const currentSessionRes = await query<{ session_name: string; term_name: string }>(`
    SELECT s.session_name, t.term_name
    FROM academic_terms t
    JOIN academic_sessions s ON t.session_id = s.id
    WHERE s.is_current = TRUE AND t.is_current = TRUE;
  `);
  console.log(
    `  • Active Session & Term: ${currentSessionRes.rows[0]?.session_name || 'N/A'} - ${currentSessionRes.rows[0]?.term_name || 'N/A'} (Expected: 2025/2026 - 2nd Term)`
  );

  const lgaZoneCountRes = await query<{ zone: string; lga_count: number }>(`
    SELECT zone, count(*)::int as lga_count
    FROM lga_metadata
    GROUP BY zone
    ORDER BY zone;
  `);
  for (const row of lgaZoneCountRes.rows) {
    console.log(`  • ${row.zone}: ${row.lga_count} LGAs`);
  }

  // 4. Idempotency Test: Run seed a second time
  console.log('\n[4/4] Executing Idempotency Test (Second Seeder Run):');
  try {
    const secondRunReport = await runReferenceDataSeeder();
    let idempotencyPass = true;

    for (const [table, stats] of Object.entries(secondRunReport.tables)) {
      // In the second run, inserted must be 0 and updated must equal total
      if (stats.inserted > 0 || stats.updated !== stats.total) {
        idempotencyPass = false;
        console.error(`  ❌ Idempotency failed for ${table}: inserted=${stats.inserted}, updated=${stats.updated}`);
      }
    }

    report.idempotencyTest = idempotencyPass ? 'PASS' : 'FAIL';
    console.log(`  • Idempotency Run: ${report.idempotencyTest} (Zero duplicate rows created, 100% updated in place)`);
  } catch (err) {
    report.idempotencyTest = 'FAIL';
    report.overallStatus = 'FAIL';
    console.error('  ❌ Second seed run failed with error:', err);
  }

  console.log('\n===============================================================');
  console.log(`  OVERALL VALIDATION STATUS: ${report.overallStatus}`);
  console.log('===============================================================\n');

  return report;
}

// Direct CLI Execution
if (process.argv[1]?.endsWith('verify.ts') || process.argv[1]?.endsWith('verify.js')) {
  runReferenceValidationSuite()
    .then(async (res) => {
      await closeDatabasePool();
      process.exit(res.overallStatus === 'PASS' ? 0 : 1);
    })
    .catch(async (err) => {
      console.error('Fatal Verification Error:', err);
      await closeDatabasePool();
      process.exit(1);
    });
}
