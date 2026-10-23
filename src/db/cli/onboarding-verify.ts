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

/**
 * Read-only advisory inspection that flags records matching obsolete Phase 10D initializer artifacts:
 * - Canonical pattern class names ("Primary N Gold", "JSS N Alpha", "SSS N Science")
 * - Principal-as-teacher / principal-as-form-master allocations
 * - Default 4 periods_per_week allocations
 */
export async function scanLegacyStructureReport(schoolId: string): Promise<{
  suspiciousClassesCount: number;
  suspiciousAllocationsCount: number;
}> {
  console.log('\n----------------------------------------------------------------------');
  console.log('[ADVISORY REPORT — REVIEW MANUALLY] Scanning for legacy auto-initializer patterns (read-only)...');
  console.log('----------------------------------------------------------------------');

  const legacyClassesRes = await query<{ id: string; name: string; level: string; form_master_id: string | null }>(
    `SELECT c.id, c.name, c.level, c.form_master_id
     FROM classes c
     WHERE c.school_id = $1
       AND c.name ~* '^(Primary [0-9]+ Gold|JSS [0-9]+ Alpha|SSS [0-9]+ Science)$';`,
    [schoolId]
  );

  const principalStaffRes = await query<{ id: string; full_name: string }>(
    `SELECT st.id, st.full_name
     FROM users u
     INNER JOIN staff st ON st.user_id = u.id AND st.school_id = u.school_id
     WHERE u.school_id = $1
       AND u.role = 'principal'
       AND u.is_active = TRUE
       AND st.is_active = TRUE
     LIMIT 1;`,
    [schoolId]
  );
  const principalStaffId = principalStaffRes.rows[0]?.id || null;

  const legacyAllocRes = await query<{ id: string; class_name: string; subject_code: string; periods_per_week: number; teacher_id: string | null }>(
    `SELECT a.id, c.name as class_name, s.code as subject_code, a.periods_per_week, a.teacher_id
     FROM class_subject_allocations a
     INNER JOIN classes c ON c.id = a.class_id
     INNER JOIN subjects s ON s.id = a.subject_id
     WHERE a.school_id = $1
       AND (
         ($2::uuid IS NOT NULL AND a.teacher_id = $2::uuid)
         OR (
           a.periods_per_week = 4
           AND c.name ~* '^(Primary [0-9]+ Gold|JSS [0-9]+ Alpha|SSS [0-9]+ Science)$'
         )
       );`,
    [schoolId, principalStaffId]
  );

  console.log(`Found ${legacyClassesRes.rows.length} class(es) matching old auto-generated naming conventions:`);
  for (const c of legacyClassesRes.rows) {
    console.log(`  - Class: "${c.name}" (${c.level}), ID: ${c.id}`);
  }

  console.log(`Found ${legacyAllocRes.rows.length} allocation(s) matching old defaults (principal-assigned or 4 periods/week on flagged classes):`);
  for (const a of legacyAllocRes.rows) {
    const isPrincipal = principalStaffId && a.teacher_id === principalStaffId ? ' [Principal as Teacher]' : '';
    console.log(`  - Allocation: ${a.class_name} -> ${a.subject_code} (${a.periods_per_week} periods/wk)${isPrincipal}`);
  }
  console.log('NOTE: Output is advisory — review manually. Existing data is never altered automatically.');
  console.log('----------------------------------------------------------------------\n');

  return {
    suspiciousClassesCount: legacyClassesRes.rows.length,
    suspiciousAllocationsCount: legacyAllocRes.rows.length,
  };
}

export async function executeOnboardingVerifyCli(): Promise<{
  exitCode: number;
  message: string;
}> {
  try {
    // 1. Resolve target school via env or CLI arg BEFORE ANY DB ACCESS OR CONFIG CHECK
    const checkLegacyFlag =
      process.argv.includes('--scan-legacy') ||
      process.argv.includes('--report-legacy') ||
      process.env.SCAN_LEGACY_STRUCTURE === 'true';

    const inputCode = (
      process.env.SCHOOL_CODE ||
      process.env.ONBOARDING_SCHOOL_CODE ||
      (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '') ||
      ''
    ).trim();

    const inputId = (
      process.env.SCHOOL_ID ||
      process.env.ONBOARDING_SCHOOL_ID ||
      ''
    ).trim();

    if (!inputCode && !inputId) {
      const usageMsg =
        'SAFE STOP: Neither SCHOOL_CODE nor SCHOOL_ID was provided.\n' +
        'Usage:\n' +
        '  npm run onboarding:verify -- <SCHOOL_CODE>\n' +
        '  SCHOOL_CODE=BNS-MKD-001 npm run onboarding:verify\n' +
        '  SCHOOL_ID=<uuid> npm run onboarding:verify\n' +
        'Optional advisory check:\n' +
        '  npm run onboarding:verify -- <SCHOOL_CODE> --scan-legacy';
      console.error(`[onboarding:verify] ${usageMsg}`);
      return { exitCode: 1, message: usageMsg };
    }

    // 2. Database URL and configuration checks
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
      const msg = 'Unable to resolve target school identifier.';
      console.error(`[onboarding:verify] ${msg}`);
      return { exitCode: 1, message: msg };
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

    // Optional advisory check for legacy auto-generated structure artifacts
    if (checkLegacyFlag) {
      await scanLegacyStructureReport(schoolId);
    }

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
    if (isDirectExecution) {
      await closeDatabasePool();
    }
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
