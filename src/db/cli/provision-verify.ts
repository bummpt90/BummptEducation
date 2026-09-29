/**
 * BummptEducation — Read-Only Provisioning Verification CLI (npm run provision:verify)
 *
 * Provider-neutral command that verifies:
 * 1. Database connectivity & migration readiness (0001..0011)
 * 2. Presence of at least one authoritative organization in PostgreSQL
 * 3. Presence of at least one active administrator in PostgreSQL
 * 4. Zero school-scoped users missing a school_id
 * 5. Zero active school principals missing a linked staff identity record
 *
 * CRITICAL SAFETY:
 * - Strictly read-only: NEVER modifies schema or business data.
 * - Never exposes DATABASE_URL or credentials.
 * - Exits with code 0 when ready, and code 1 when not ready.
 */

import 'dotenv/config';
import {
  getDatabaseConfig,
  verifyMigrations,
  closeDatabasePool,
  sanitizeDatabaseErrorMessage,
} from '../index';
import { verifyProvisioningState } from '../../auth/provisioning.service';

export async function executeProvisionVerifyCli(): Promise<{
  exitCode: number;
  message: string;
}> {
  try {
    const rawUrl = process.env.DATABASE_URL?.trim() || '';
    if (!rawUrl) {
      const msg = 'FATAL: DATABASE_URL is required to verify provisioning state.';
      console.error(`[provision:verify] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    const config = getDatabaseConfig();
    if (!config.isConfigured || !config.connectionString) {
      const msg = 'FATAL: Database configuration is incomplete.';
      console.error(`[provision:verify] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    const migrationReport = await verifyMigrations();
    if (!migrationReport.ready) {
      const safeErr = sanitizeDatabaseErrorMessage(
        migrationReport.error || 'Database migrations are not ready.'
      );
      console.error(`[provision:verify] MIGRATIONS NOT READY: ${safeErr}`);
      return { exitCode: 1, message: safeErr };
    }

    const report = await verifyProvisioningState();

    console.log('======================================================================');
    console.log('BummptEducation — Institutional & Administrator Provisioning Report');
    console.log('======================================================================');
    console.log(`Organizations Count          : ${report.organizationsCount}`);
    console.log(`Schools Count                : ${report.schoolsCount}`);
    console.log(`Active Super Admins Count    : ${report.activeSuperAdminsCount}`);
    console.log(`Active Administrators Count  : ${report.activeAdminsCount}`);
    console.log(`Staff-Linked Users Count     : ${report.staffLinkedUsersCount}`);
    console.log(`Invalid Scope Users Count    : ${report.invalidScopeUsersCount}`);
    console.log(`Unlinked School Principals   : ${report.unlinkedSchoolStaffAdminsCount}`);
    console.log(`Provisioning Ready           : ${report.ready}`);
    console.log('======================================================================');

    if (!report.ready) {
      const issueSummary =
        report.issues.join(' | ') || 'Institutional provisioning is incomplete.';
      console.error(`[provision:verify] NOT READY: ${issueSummary}`);
      return { exitCode: 1, message: issueSummary };
    }

    const summary = `Provisioning verified: ${report.organizationsCount} organization(s), ${report.schoolsCount} school(s), ${report.activeAdminsCount} active administrator(s).`;
    console.log(`[provision:verify] READY: ${summary}`);
    return { exitCode: 0, message: summary };
  } catch (err: any) {
    const safeErr = sanitizeDatabaseErrorMessage(
      err?.message || 'Provisioning verification failed.'
    );
    console.error(`[provision:verify] FATAL ERROR: ${safeErr}`);
    return { exitCode: 1, message: safeErr };
  } finally {
    await closeDatabasePool();
  }
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('src/db/cli/provision-verify.ts');

if (isDirectExecution) {
  executeProvisionVerifyCli().then(({ exitCode }) => {
    process.exit(exitCode);
  });
}
