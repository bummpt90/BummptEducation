/**
 * BummptEducation — Phase 9 Automated Verification Test Suite
 * PRODUCTION READINESS, DATA PROVENANCE & DEPLOYMENT SAFETY
 * 
 * Verifies:
 * 1. Zero Math.random() in operational repositories or operational runtime state.
 * 2. Demo/sample report cards are explicitly isolated with visible demo warning indicators.
 * 3. Database seeders strictly refuse execution when NODE_ENV === 'production' (fail-closed).
 * 4. AUTH_SECRET enforcement fails securely when missing or weak in production mode.
 * 5. Production database configuration (DATABASE_URL) fails closed if missing in production.
 * 6. Reference datasets (LGAs, curricula) are cleanly isolated from operational business data paths.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getAuthSecret } from '../src/auth/token';
import { runReferenceDataSeeder } from '../src/db/seed/seed';
import { 
  SAMPLE_EARLY_YEARS_STUDENT, 
  SAMPLE_PRIMARY_STUDENT, 
  SAMPLE_SECONDARY_STUDENT,
  SAMPLE_EARLY_YEARS_REPORT_CARD
} from '../src/data/demo/sampleReportCards';
import { BENUE_LGAS_METADATA } from '../src/data/reference/benueReference';
import { CLASS_REFERENCE_DEFINITIONS } from '../src/data/reference/classDefinitions';

interface TestResult {
  category: string;
  test: string;
  status: 'PASSED' | 'FAILED';
  details?: string;
}

const results: TestResult[] = [];

function record(category: string, test: string, passed: boolean, details?: string) {
  results.push({
    category,
    test,
    status: passed ? 'PASSED' : 'FAILED',
    details,
  });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${category}] ${test} ${details ? `(${details})` : ''}`);
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('BummptEducation — Phase 9 Production Readiness & Provenance Verification');
  console.log('======================================================================\n');

  // ====================================================================
  // TEST 1: ZERO Math.random() in Operational Code
  // ====================================================================
  const filesToCheckForRandom = [
    'src/db/repositories/payment.repository.ts',
    'src/db/repositories/invoice.repository.ts',
    'src/db/repositories/admissions.repository.ts',
    'src/pages/HomePage.tsx',
    'src/data/benueStateData.ts'
  ];

  for (const relPath of filesToCheckForRandom) {
    const fullPath = path.join(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const linesWithMathRandom = content
        .split('\n')
        .map((line, idx) => ({ line, num: idx + 1 }))
        .filter(l => l.line.includes('Math.random()'));

      record(
        'Zero Runtime Randomness',
        `No Math.random() in ${relPath}`,
        linesWithMathRandom.length === 0,
        linesWithMathRandom.length === 0 
          ? 'Passed - zero Math.random()' 
          : `Found on lines: ${linesWithMathRandom.map(l => l.num).join(', ')}`
      );
    }
  }

  // ====================================================================
  // TEST 2: Demo/Sample Report-Card Isolation & Warning Indication
  // ====================================================================
  const reportCardModalPath = path.join(process.cwd(), 'src/components/ReportCardModal.tsx');
  const reportCardModalContent = fs.readFileSync(reportCardModalPath, 'utf-8');

  const hasDemoWarningBanner = reportCardModalContent.includes('DEMO / SAMPLE DATA — NOT A REAL STUDENT RECORD');
  record(
    'Demo Data Boundary',
    'ReportCardModal contains visible DEMO warning banner',
    hasDemoWarningBanner,
    hasDemoWarningBanner ? 'Visible warning banner rendered for sample student records' : 'Missing banner'
  );

  const sampleKgIsDemo = (SAMPLE_EARLY_YEARS_STUDENT as any).isDemo === true;
  const samplePriIsDemo = (SAMPLE_PRIMARY_STUDENT as any).isDemo === true;
  const sampleSecIsDemo = (SAMPLE_SECONDARY_STUDENT as any).isDemo === true;
  const sampleRcIsDemo = (SAMPLE_EARLY_YEARS_REPORT_CARD as any).isDemo === true;

  record(
    'Demo Data Boundary',
    'Sample report-card and student fixtures marked with explicit isDemo flag',
    sampleKgIsDemo && samplePriIsDemo && sampleSecIsDemo && sampleRcIsDemo,
    `Sample KG: ${sampleKgIsDemo}, Pri: ${samplePriIsDemo}, Sec: ${sampleSecIsDemo}, RC: ${sampleRcIsDemo}`
  );

  // Check that public pages import from demo module rather than having inlined developer data
  const earlyChildhoodPath = path.join(process.cwd(), 'src/pages/EarlyChildhoodPage.tsx');
  const earlyChildhoodContent = fs.readFileSync(earlyChildhoodPath, 'utf-8');
  const usesIsolatedDemoEarly = earlyChildhoodContent.includes('../data/demo/sampleReportCards');

  const primaryPath = path.join(process.cwd(), 'src/pages/PrimarySchoolPage.tsx');
  const primaryContent = fs.readFileSync(primaryPath, 'utf-8');
  const usesIsolatedDemoPrimary = primaryContent.includes('../data/demo/sampleReportCards');

  const secondaryPath = path.join(process.cwd(), 'src/pages/SecondaryCollegePage.tsx');
  const secondaryContent = fs.readFileSync(secondaryPath, 'utf-8');
  const usesIsolatedDemoSecondary = secondaryContent.includes('../data/demo/sampleReportCards');

  record(
    'Demo Data Boundary',
    'Public school pages route sample report card previews through isolated demo fixtures',
    usesIsolatedDemoEarly && usesIsolatedDemoPrimary && usesIsolatedDemoSecondary,
    'All three educational wings import from src/data/demo/sampleReportCards'
  );

  // ====================================================================
  // TEST 3: Database Seeders Refuse Execution in Production (Fail-Closed)
  // ====================================================================
  const seederFiles = [
    'src/db/seed/seed.ts',
    'src/db/seed/auth.seed.ts',
    'src/db/seed/operational.seed.ts',
    'src/db/seed/financial.seed.ts',
    'src/db/seed/lessonNotes.seed.ts'
  ];

  for (const seederRel of seederFiles) {
    const fullPath = path.join(process.cwd(), seederRel);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const hasProductionGuard = content.includes("process.env.NODE_ENV === 'production'") &&
      (content.includes('throw new Error') || content.includes('Security Exception'));

    record(
      'Seeder Production Safety',
      `${seederRel} blocks execution in NODE_ENV === 'production'`,
      hasProductionGuard,
      hasProductionGuard ? 'Production guard present (throws Security Exception)' : 'Missing production guard'
    );
  }

  // Verify runReferenceDataSeeder() source guard placement before any DB query or transaction
  const refSeederPath = path.join(process.cwd(), 'src/db/seed/seed.ts');
  const refSeederContent = fs.readFileSync(refSeederPath, 'utf-8');
  const guardIndex = refSeederContent.indexOf("if (process.env.NODE_ENV === 'production')");
  const throwIndex = refSeederContent.indexOf("FATAL SECURITY EXCEPTION: Reference seeding cannot be executed directly in production.");
  const txIndex = refSeederContent.indexOf('withTransaction(');
  const queryIndex = refSeederContent.indexOf('await query');
  const guardBeforeOps = guardIndex !== -1 && throwIndex !== -1 && guardIndex < txIndex && guardIndex < queryIndex;

  record(
    'Seeder Production Safety',
    'src/db/seed/seed.ts places explicit production guard before any DB queries or withTransaction()',
    guardBeforeOps,
    guardBeforeOps ? 'Guard verified before query() and withTransaction()' : 'Guard missing or placed too late'
  );

  // Runtime test: Execute runReferenceDataSeeder() with NODE_ENV=production
  const savedNodeEnvForSeeder = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    let seederFailedClosed = false;
    let seederErrorMessage = '';
    try {
      await runReferenceDataSeeder();
    } catch (err: any) {
      seederErrorMessage = err?.message || String(err);
      if (seederErrorMessage.includes('FATAL SECURITY EXCEPTION: Reference seeding cannot be executed directly in production.')) {
        seederFailedClosed = true;
      }
    }
    record(
      'Seeder Production Safety',
      'runReferenceDataSeeder() fails closed at runtime when NODE_ENV=production before any seed operation',
      seederFailedClosed,
      seederFailedClosed ? `Threw: "${seederErrorMessage}"` : `Did not throw expected error (got: "${seederErrorMessage}")`
    );
  } finally {
    process.env.NODE_ENV = savedNodeEnvForSeeder;
  }

  // ====================================================================
  // TEST 4: AUTH_SECRET Enforcement in Production Mode
  // ====================================================================
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalJwtSecret = process.env.JWT_SECRET;

  try {
    // Simulate production environment with missing AUTH_SECRET
    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_SECRET;
    delete process.env.JWT_SECRET;

    let threwExpectedError = false;
    try {
      getAuthSecret();
    } catch (e: any) {
      if (e.message && e.message.includes('FATAL SECURITY ERROR: AUTH_SECRET must be set')) {
        threwExpectedError = true;
      }
    }
    record(
      'Auth Secret Hardening',
      'getAuthSecret() throws fatal error when AUTH_SECRET is missing in production',
      threwExpectedError,
      threwExpectedError ? 'Threw fatal security exception' : 'Failed to throw error'
    );

    // Simulate production environment with weak secret (< 32 chars)
    process.env.AUTH_SECRET = 'short_insecure_secret';
    let threwWeakSecretError = false;
    try {
      getAuthSecret();
    } catch (e: any) {
      if (e.message && e.message.includes('must be at least 32 characters long in production')) {
        threwWeakSecretError = true;
      }
    }
    record(
      'Auth Secret Hardening',
      'getAuthSecret() rejects secrets shorter than 32 characters in production',
      threwWeakSecretError,
      threwWeakSecretError ? 'Rejected weak secret in production' : 'Accepted weak secret'
    );

    // Simulate production environment with fallback to JWT_SECRET (must be rejected)
    delete process.env.AUTH_SECRET;
    process.env.JWT_SECRET = 'some_sufficiently_long_jwt_secret_that_should_still_fail_production_test';
    let rejectedJwtSecretFallback = false;
    try {
      getAuthSecret();
    } catch (e: any) {
      if (e.message && e.message.includes('AUTH_SECRET must be set in production')) {
        rejectedJwtSecretFallback = true;
      }
    }
    record(
      'Auth Secret Hardening',
      'getAuthSecret() refuses legacy JWT_SECRET in production mode',
      rejectedJwtSecretFallback,
      rejectedJwtSecretFallback ? 'Strictly required AUTH_SECRET, rejected JWT_SECRET fallback' : 'Allowed legacy fallback'
    );
  } finally {
    // Restore environment
    process.env.NODE_ENV = originalNodeEnv;
    if (originalAuthSecret) process.env.AUTH_SECRET = originalAuthSecret;
    else delete process.env.AUTH_SECRET;
    if (originalJwtSecret) process.env.JWT_SECRET = originalJwtSecret;
    else delete process.env.JWT_SECRET;
  }

  // ====================================================================
  // TEST 5: Production Database Configuration Fail-Closed
  // ====================================================================
  const dbConfigPath = path.join(process.cwd(), 'src/db/config.ts');
  const dbConfigContent = fs.readFileSync(dbConfigPath, 'utf-8');

  const hasDbUrlProductionGuard = dbConfigContent.includes("process.env.NODE_ENV === 'production'") &&
    dbConfigContent.includes('DATABASE_URL environment variable is required in production');

  record(
    'Database Config Safety',
    'src/db/config.ts fails closed if DATABASE_URL is missing in production',
    hasDbUrlProductionGuard,
    hasDbUrlProductionGuard ? 'Fatal guard enforced' : 'Missing guard'
  );

  // ====================================================================
  // TEST 6: Reference Data Cleanly Isolated
  // ====================================================================
  record(
    'Reference Data Isolation',
    'benueReference.ts contains 23 authoritative LGAs without operational synthetic metrics',
    BENUE_LGAS_METADATA.length === 23,
    `Total LGAs: ${BENUE_LGAS_METADATA.length}`
  );

  const benueDataPath = path.join(process.cwd(), 'src/data/benueStateData.ts');
  const benueDataContent = fs.readFileSync(benueDataPath, 'utf-8');
  const hasSimulateTermWeek = benueDataContent.includes('function simulateTermWeekProgress');

  record(
    'Reference Data Isolation',
    'simulateTermWeekProgress removed from runtime state',
    !hasSimulateTermWeek,
    !hasSimulateTermWeek ? 'simulateTermWeekProgress eliminated' : 'simulateTermWeekProgress still present'
  );

  // Class Reference Data vs Attendance Data Boundary Verification
  const classesSeedPath = path.join(process.cwd(), 'src/db/seed/reference/classes.seed.ts');
  const classesSeedContent = fs.readFileSync(classesSeedPath, 'utf-8');
  const classesSeedImportsAttendanceData = classesSeedContent.includes('attendanceData');
  const classesSeedImportsClassDefinitions = classesSeedContent.includes('data/reference/classDefinitions');

  record(
    'Reference Data Isolation',
    'src/db/seed/reference/classes.seed.ts does NOT import src/data/attendanceData.ts and DOES import src/data/reference/classDefinitions.ts',
    !classesSeedImportsAttendanceData && classesSeedImportsClassDefinitions,
    `importsAttendanceData=${classesSeedImportsAttendanceData}, importsClassDefinitions=${classesSeedImportsClassDefinitions}`
  );

  const classDefsPath = path.join(process.cwd(), 'src/data/reference/classDefinitions.ts');
  const classDefsContent = fs.readFileSync(classDefsPath, 'utf-8');
  const hasNoStaffInfoInClassDefs =
    !classDefsContent.includes('formMaster') &&
    !classDefsContent.includes('trcnNumber') &&
    CLASS_REFERENCE_DEFINITIONS.length === 21 &&
    CLASS_REFERENCE_DEFINITIONS.every(c => !('formMaster' in (c as any)));

  record(
    'Reference Data Isolation',
    'src/data/reference/classDefinitions.ts contains 21 structural classes with zero personal staff/form-master data',
    hasNoStaffInfoInClassDefs,
    `Total structural classes: ${CLASS_REFERENCE_DEFINITIONS.length}, zero formMaster properties`
  );

  const attendanceDataPath = path.join(process.cwd(), 'src/data/attendanceData.ts');
  const attendanceDataContent = fs.readFileSync(attendanceDataPath, 'utf-8');
  const attendanceDataHasClassDefs = attendanceDataContent.includes('ALL_CLASSES_DEFINITIONS');

  record(
    'Reference Data Isolation',
    'src/data/attendanceData.ts no longer contains ALL_CLASSES_DEFINITIONS or embedded staff records',
    !attendanceDataHasClassDefs && !attendanceDataContent.includes('trcnNumber'),
    !attendanceDataHasClassDefs ? 'ALL_CLASSES_DEFINITIONS removed from attendanceData.ts' : 'Still contains ALL_CLASSES_DEFINITIONS'
  );

  // ====================================================================
  // SUMMARY
  // ====================================================================
  console.log('\n======================================================================');
  console.log('TEST RESULTS SUMMARY:');
  const passedCount = results.filter(r => r.status === 'PASSED').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    console.error('❌ Phase 9 verification failed.');
    process.exit(1);
  } else {
    console.log('✅ Phase 9 production readiness & data provenance verification passed successfully!');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
