/**
 * BummptEducation — Read-Only School Onboarding Verification CLI (npm run onboarding:verify)
 * 
 * Provider-neutral command that verifies the 7-step institutional onboarding
 * lifecycle for a target school in PostgreSQL:
 * 1. School Identity & Institutional Profile
 * 2. Authorized Leadership & Staff Registry
 * 3. Academic Calendar & Term Configuration
 * 4. Class & Subject Configuration
 * 5. Academic Responsibilities & Staff Allocations
 * 6. Review & Verification Completeness
 * 7. Explicit Operational Gate (Distinguishes onboarding readiness from operational launch)
 * 
 * CRITICAL SAFETY:
 * - Strictly read-only: NEVER modifies schema or business data.
 * - Never creates student, parent, or financial records.
 * - Never invokes development/demo seeders.
 * - Exits with code 0 when ONBOARDING_READY, and code 1 when ONBOARDING_INCOMPLETE.
 */

import 'dotenv/config';
import {
  getDatabaseConfig,
  verifyMigrations,
  closeDatabasePool,
  sanitizeDatabaseErrorMessage,
  query,
} from '../index';
import { getSchoolOnboardingStatus } from '../../auth/onboarding.service';

export async function executeOnboardingVerifyCli(): Promise<{
  exitCode: number;
  message: string;
}> {
  try {
    const rawUrl = process.env.DATABASE_URL?.trim() || '';
    if (!rawUrl) {
      const msg = 'FATAL: DATABASE_URL is required to verify school onboarding state.';
      console.error(`[onboarding:verify] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    const config = getDatabaseConfig();
    if (!config.isConfigured || !config.connectionString) {
      const msg = 'FATAL: Database configuration is incomplete.';
      console.error(`[onboarding:verify] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    const migrationReport = await verifyMigrations();
    if (!migrationReport.ready) {
      const safeErr = sanitizeDatabaseErrorMessage(
        migrationReport.error || 'Database migrations are not ready.'
      );
      console.error(`[onboarding:verify] MIGRATIONS NOT READY: ${safeErr}`);
      return { exitCode: 1, message: safeErr };
    }

    // Resolve target school via env or CLI arg or first school
    const inputCode = (
      process.env.SCHOOL_CODE ||
      process.env.ONBOARDING_SCHOOL_CODE ||
      process.argv[2] ||
      ''
    ).trim();

    const inputId = (
      process.env.SCHOOL_ID ||
      process.env.ONBOARDING_SCHOOL_ID ||
      ''
    ).trim();

    let schoolId = inputId;
    if (!schoolId && inputCode) {
      const schoolRes = await query<{ id: string; name: string }>(
        'SELECT id, name FROM schools WHERE UPPER(code) = UPPER($1) LIMIT 1;',
        [inputCode]
      );
      if (!schoolRes.rows[0]) {
        const msg = `School with code '${inputCode}' not found in database.`;
        console.error(`[onboarding:verify] ${msg}`);
        return { exitCode: 1, message: msg };
      }
      schoolId = schoolRes.rows[0].id;
    }

    if (!schoolId) {
      // Pick the first authoritative school in the registry
      const firstSchoolRes = await query<{ id: string; code: string; name: string }>(
        'SELECT id, code, name FROM schools ORDER BY created_at ASC LIMIT 1;'
      );
      if (!firstSchoolRes.rows[0]) {
        const msg = 'No authoritative schools found in database. Run provision:bootstrap first.';
        console.error(`[onboarding:verify] ${msg}`);
        return { exitCode: 1, message: msg };
      }
      schoolId = firstSchoolRes.rows[0].id;
    }

    // Evaluate onboarding status using internal CLI system caller
    const cliCaller = {
      user: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'system.cli@bummpt.internal',
        role: 'super_admin' as const,
        isSuperAdmin: true,
        isStateOfficer: false,
        schoolId: null,
      },
      ipAddress: 'CLI_ONBOARDING_VERIFY',
      userAgent: 'BummptEducation-OnboardingVerifyCLI',
    };

    const report = await getSchoolOnboardingStatus(schoolId, cliCaller);

    console.log('======================================================================');
    console.log('BummptEducation — School Onboarding & Institutional Readiness Report');
    console.log('======================================================================');
    console.log(`School Name                  : ${report.schoolName}`);
    console.log(`School Code                  : ${report.schoolCode}`);
    console.log(`Organization                 : ${report.organizationName} (${report.organizationCode})`);
    console.log(`LGA & Senatorial Zone        : ${report.institutionalProfile.lga} (${report.institutionalProfile.senatorialZone})`);
    console.log(`Educational Category         : ${report.institutionalProfile.category}`);
    console.log(`Onboarding Readiness Status  : ${report.overallStatus}`);
    console.log(`Operational Launch Gate      : ${report.operationalLaunchStatus}`);
    console.log(`Completion Progress          : ${report.completionPercentage}% (${report.completedStepsCount}/${report.totalStepsCount} steps completed)`);
    console.log(`Teaching Staff Count         : ${report.metrics.teachingStaffCount}`);
    console.log(`Total Staff Count            : ${report.metrics.totalStaffCount}`);
    console.log(`Classes Configured           : ${report.metrics.classesCount}`);
    console.log(`Curriculum Allocations       : ${report.metrics.allocationsCount}`);
    console.log(`Enrolled Student Count       : ${report.metrics.studentsCount} (Strict Phase 10D: zero real records)`);
    console.log('----------------------------------------------------------------------');
    console.log('7-STEP ONBOARDING CHECKLIST BREAKDOWN:');
    for (const step of report.steps) {
      const icon = step.isComplete ? '✅' : '⏳';
      console.log(` ${icon} Step ${step.stepNumber}: ${step.title} [${step.status}]`);
      for (const item of step.items) {
        const itemIcon = item.isComplete ? '  ✓' : '  ✗';
        const valStr = item.value !== undefined && item.value !== null ? ` -> ${item.value}` : '';
        console.log(`   ${itemIcon} ${item.label}${valStr}`);
      }
    }
    console.log('======================================================================');

    if (report.overallStatus === 'ONBOARDING_READY') {
      const summary = `School '${report.schoolName}' (${report.schoolCode}) is ONBOARDING_READY. Operational launch remains ${report.operationalLaunchStatus}.`;
      console.log(`[onboarding:verify] SUCCESS: ${summary}`);
      return { exitCode: 0, message: summary };
    } else {
      const incompleteSteps = report.steps
        .filter((s) => !s.isComplete)
        .map((s) => s.title);
      const summary = `School '${report.schoolName}' is ONBOARDING_INCOMPLETE. Incomplete steps: ${incompleteSteps.join(', ')}.`;
      console.warn(`[onboarding:verify] INCOMPLETE: ${summary}`);
      return { exitCode: 1, message: summary };
    }
  } catch (err: any) {
    const safeErr = sanitizeDatabaseErrorMessage(
      err?.message || 'School onboarding verification failed.'
    );
    console.error(`[onboarding:verify] FATAL ERROR: ${safeErr}`);
    return { exitCode: 1, message: safeErr };
  } finally {
    await closeDatabasePool();
  }
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('src/db/cli/onboarding-verify.ts');

if (isDirectExecution) {
  executeOnboardingVerifyCli().then(({ exitCode }) => {
    process.exit(exitCode);
  });
}
