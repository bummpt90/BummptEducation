/**
 * BummptEducation — Controlled First-Organization & Administrator Bootstrap CLI
 * (npm run provision:bootstrap)
 *
 * Provider-neutral command that provisions the first authoritative organization,
 * optional first school, and first administrator account in PostgreSQL.
 *
 * CRITICAL PRODUCTION CONTRACT:
 * - Requires DATABASE_URL and enforces DATABASE_SSL='require'|'true' in production.
 * - Requires all 11 migrations (0001..0011) to be applied and checksum-verified first.
 * - Requires explicit BOOTSTRAP_* environment variables (never uses demo/hardcoded defaults).
 * - Fails closed if any organization, school, user, or successful BOOTSTRAP_PROVISIONED
 *   audit record already exists, independent of initial administrator role (one-time bootstrap guard).
 * - NEVER imports or executes development/demo seeders.
 * - NEVER logs plaintext passwords or DATABASE_URL credentials.
 */

import 'dotenv/config';
import {
  getDatabaseConfig,
  verifyMigrations,
  closeDatabasePool,
  sanitizeDatabaseErrorMessage,
} from '../index';
import {
  bootstrapFirstTenantAndAdmin,
  ProvisioningError,
} from '../../auth/provisioning.service';

export async function executeProvisionBootstrapCli(): Promise<{
  exitCode: number;
  message: string;
}> {
  try {
    const rawUrl = process.env.DATABASE_URL?.trim() || '';
    if (!rawUrl) {
      const msg = 'FATAL: DATABASE_URL is required to execute provisioning bootstrap.';
      console.error(`[provision:bootstrap] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    const config = getDatabaseConfig();
    if (!config.isConfigured || !config.connectionString) {
      const msg = 'FATAL: Database configuration is incomplete.';
      console.error(`[provision:bootstrap] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    // Validate required explicit bootstrap inputs before touching the database
    const orgName = process.env.BOOTSTRAP_ORG_NAME?.trim() || '';
    const orgCode = process.env.BOOTSTRAP_ORG_CODE?.trim() || '';
    const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim() || '';
    const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
    const adminName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || '';
    const adminPhone = process.env.BOOTSTRAP_ADMIN_PHONE?.trim() || null;
    const adminRole = (process.env.BOOTSTRAP_ADMIN_ROLE?.trim().toLowerCase() ||
      'super_admin') as 'super_admin' | 'state_officer' | 'principal';

    const missingVars: string[] = [];
    if (!orgName) missingVars.push('BOOTSTRAP_ORG_NAME');
    if (!orgCode) missingVars.push('BOOTSTRAP_ORG_CODE');
    if (!adminEmail) missingVars.push('BOOTSTRAP_ADMIN_EMAIL');
    if (!adminPassword) missingVars.push('BOOTSTRAP_ADMIN_PASSWORD');
    if (!adminName) missingVars.push('BOOTSTRAP_ADMIN_NAME');

    if (missingVars.length > 0) {
      const msg = `FATAL: Missing required bootstrap environment variables: ${missingVars.join(', ')}`;
      console.error(`[provision:bootstrap] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    // Optional first school parameters
    const schoolName = process.env.BOOTSTRAP_SCHOOL_NAME?.trim() || '';
    const schoolCode = process.env.BOOTSTRAP_SCHOOL_CODE?.trim() || '';
    const schoolLga = process.env.BOOTSTRAP_SCHOOL_LGA?.trim() || '';
    const schoolZone = process.env.BOOTSTRAP_SCHOOL_ZONE?.trim() || '';
    const schoolCategory = process.env.BOOTSTRAP_SCHOOL_CATEGORY?.trim() || '';

    const anySchoolVarProvided = Boolean(
      schoolName || schoolCode || schoolLga || schoolZone || schoolCategory
    );
    if (
      anySchoolVarProvided &&
      (!schoolName || !schoolCode || !schoolLga || !schoolZone || !schoolCategory)
    ) {
      const msg =
        'FATAL: Incomplete school bootstrap configuration. When provisioning a first school, BOOTSTRAP_SCHOOL_NAME, BOOTSTRAP_SCHOOL_CODE, BOOTSTRAP_SCHOOL_LGA, BOOTSTRAP_SCHOOL_ZONE, and BOOTSTRAP_SCHOOL_CATEGORY are all required.';
      console.error(`[provision:bootstrap] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    // Optional dedicated first school principal
    const principalEmail = process.env.BOOTSTRAP_PRINCIPAL_EMAIL?.trim() || '';
    const principalPassword = process.env.BOOTSTRAP_PRINCIPAL_PASSWORD || '';
    const principalName = process.env.BOOTSTRAP_PRINCIPAL_NAME?.trim() || '';
    const principalPhone = process.env.BOOTSTRAP_PRINCIPAL_PHONE?.trim() || null;

    const anyPrincipalVarProvided = Boolean(principalEmail || principalPassword || principalName);
    if (anyPrincipalVarProvided && (!principalEmail || !principalPassword || !principalName)) {
      const msg =
        'FATAL: Incomplete school principal bootstrap configuration. BOOTSTRAP_PRINCIPAL_EMAIL, BOOTSTRAP_PRINCIPAL_PASSWORD, and BOOTSTRAP_PRINCIPAL_NAME are all required when provisioning a school principal.';
      console.error(`[provision:bootstrap] ${msg}`);
      return { exitCode: 1, message: msg };
    }

    // Verify migrations are applied before provisioning
    const migrationReport = await verifyMigrations();
    if (!migrationReport.ready) {
      const safeErr = sanitizeDatabaseErrorMessage(
        migrationReport.error ||
          'Database schema migrations are not ready. Run npm run db:migrate first.'
      );
      console.error(`[provision:bootstrap] MIGRATIONS NOT READY: ${safeErr}`);
      return { exitCode: 1, message: safeErr };
    }

    const result = await bootstrapFirstTenantAndAdmin({
      organization: {
        name: orgName,
        code: orgCode,
      },
      school: anySchoolVarProvided
        ? {
            name: schoolName,
            code: schoolCode,
            lga: schoolLga,
            senatorialZone: schoolZone,
            category: schoolCategory,
          }
        : null,
      admin: {
        email: adminEmail,
        password: adminPassword,
        fullName: adminName,
        phone: adminPhone,
        role: adminRole,
      },
      schoolPrincipal:
        anyPrincipalVarProvided && anySchoolVarProvided
          ? {
              email: principalEmail,
              password: principalPassword,
              fullName: principalName,
              phone: principalPhone,
            }
          : null,
      ipAddress: 'CLI_BOOTSTRAP',
      userAgent: 'BummptEducation-ProvisionBootstrapCLI',
    });

    const summary = `Provisioned Organization '${result.organization.code}'${
      result.school ? `, School '${result.school.code}'` : ''
    }, and Administrator '${result.admin.user.email}' (${result.admin.user.role})${
      result.schoolPrincipal
        ? ` + School Principal '${result.schoolPrincipal.user.email}'`
        : ''
    }.`;
    console.log(`[provision:bootstrap] SUCCESS: ${summary}`);
    return { exitCode: 0, message: summary };
  } catch (err: any) {
    const rawMsg =
      err instanceof ProvisioningError
        ? `${err.code}: ${err.message}`
        : err?.message || 'Unexpected provisioning bootstrap failure.';
    const safeErr = sanitizeDatabaseErrorMessage(rawMsg);
    console.error(`[provision:bootstrap] FAILED: ${safeErr}`);
    return { exitCode: 1, message: safeErr };
  } finally {
    await closeDatabasePool();
  }
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, '/').endsWith('src/db/cli/provision-bootstrap.ts');

if (isDirectExecution) {
  executeProvisionBootstrapCli().then(({ exitCode }) => {
    process.exit(exitCode);
  });
}
