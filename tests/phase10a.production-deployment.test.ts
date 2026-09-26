/**
 * BummptEducation — Phase 10A Production Deployment Architecture & Environment Verification Suite
 *
 * Verifies the complete Phase 10A production deployment contract:
 * 1. Environment Variables & .env.example Contract (No real secrets, clear prod vs dev separation)
 * 2. AUTH_SECRET Production Enforcement (>= 32 chars, no JWT_SECRET fallback, zero leakage)
 * 3. ENCRYPTION_SECRET Production Enforcement (32-byte Base64, independent from AUTH_SECRET/JWT_SECRET)
 * 4. DATABASE_URL & DATABASE_SSL Production Enforcement & Credential Redaction
 * 5. Port & Host Binding Contract (process.env.PORT, safe default 3000, 0.0.0.0 binding)
 * 6. APP_URL, HTTPS Origin, CORS & Secure Cookie Enforcement in Production
 * 7. Production Startup Validator & Seeder Lockout (Fail-closed startup, all seeders blocked)
 * 8. Health & Readiness Endpoints (/api/health & /api/health/db sanitization & state distinction)
 * 9. Build & Start Contract & Documentation Consistency (dist/server.cjs, zero JWT_SECRET conflict)
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';
import crypto from 'crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import { getAuthSecret, getAuthCookieOptions, setAuthCookie, AUTH_COOKIE_NAME } from '../src/auth/token';
import { getEncryptionKey } from '../src/security/encryption';
import { getDatabaseConfig, sanitizeDatabaseErrorMessage, closeDatabasePool } from '../src/db';
import { isAllowedOrigin, corsMiddleware } from '../src/security/cors';
import {
  getServerPort,
  getServerHost,
  validateProductionStartupConfig,
  enforceProductionStartupConfig,
  handleAppHealthCheck,
  handleDatabaseHealthCheck,
} from '../src/config/deployment';
import { runReferenceDataSeeder } from '../src/db/seed/seed';
import { seedDevelopmentAuthIdentities } from '../src/db/seed/auth.seed';
import { seedOperationalFoundation } from '../src/db/seed/operational.seed';
import { seedFinancialFoundation } from '../src/db/seed/financial.seed';
import { seedLessonNotesFoundation } from '../src/db/seed/lessonNotes.seed';

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

async function runPhase10aSuite() {
  console.log('======================================================================');
  console.log('BummptEducation — Phase 10A Production Deployment Contract Verification');
  console.log('======================================================================\n');

  // Save original environment snapshot
  const savedEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    APP_URL: process.env.APP_URL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    AI_STUDIO_PREVIEW: process.env.AI_STUDIO_PREVIEW,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_SSL: process.env.DATABASE_SSL,
    DATABASE_POOL_SIZE: process.env.DATABASE_POOL_SIZE,
    AUTH_SECRET: process.env.AUTH_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  };

  function restoreEnv() {
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }

  try {
    // =========================================================================
    // 1. .env.example & Environment Variable Documentation Contract
    // =========================================================================
    const envExamplePath = path.join(process.cwd(), '.env.example');
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');

    const requiredEnvKeys = [
      'NODE_ENV',
      'PORT',
      'APP_URL',
      'DATABASE_URL',
      'DATABASE_POOL_SIZE',
      'DATABASE_SSL',
      'AUTH_SECRET',
      'ENCRYPTION_SECRET',
    ];
    const allKeysDocumented = requiredEnvKeys.every(k => envExampleContent.includes(`${k}=`));
    record(
      '1. Environment Contract',
      '.env.example documents all mandatory production variables (NODE_ENV, PORT, APP_URL, DATABASE_URL, DATABASE_POOL_SIZE, DATABASE_SSL, AUTH_SECRET, ENCRYPTION_SECRET)',
      allKeysDocumented,
      `Verified ${requiredEnvKeys.length}/${requiredEnvKeys.length} keys`
    );

    const distinguishesProdFromDev =
      envExampleContent.includes('PRODUCTION-REQUIRED VARIABLES') &&
      envExampleContent.includes('DEVELOPMENT / PREVIEW VARIABLES');
    record(
      '1. Environment Contract',
      '.env.example clearly distinguishes PRODUCTION-REQUIRED VARIABLES from DEVELOPMENT / PREVIEW VARIABLES',
      distinguishesProdFromDev
    );

    const hasNoRealSecretsInEnvExample =
      !envExampleContent.includes('ep-falling-breeze') &&
      !envExampleContent.includes('npg_') &&
      !envExampleContent.includes('AIzaSy');
    record(
      '1. Environment Contract',
      '.env.example contains placeholder templates only and zero real database or API secrets',
      hasNoRealSecretsInEnvExample
    );

    // =========================================================================
    // 2. AUTH_SECRET Production Enforcement
    // =========================================================================
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.AUTH_SECRET;
      process.env.JWT_SECRET = 'legacy_jwt_secret_that_is_over_32_characters_long_and_must_fail';

      let rejectedMissingAuthSecret = false;
      try {
        getAuthSecret();
      } catch (err: any) {
        if (err?.message?.includes('AUTH_SECRET must be set in production')) {
          rejectedMissingAuthSecret = true;
        }
      }
      record(
        '2. AUTH_SECRET Security',
        'getAuthSecret() fails closed in production when AUTH_SECRET is missing and refuses JWT_SECRET fallback',
        rejectedMissingAuthSecret
      );

      const weakCanary = 'short_secret_canary_value';
      process.env.AUTH_SECRET = weakCanary;
      let rejectedShortSecret = false;
      let leakedWeakSecret = false;
      try {
        getAuthSecret();
      } catch (err: any) {
        if (err?.message?.includes('at least 32 characters')) {
          rejectedShortSecret = true;
        }
        if (err?.message?.includes(weakCanary)) {
          leakedWeakSecret = true;
        }
      }
      record(
        '2. AUTH_SECRET Security',
        'getAuthSecret() rejects secrets < 32 chars in production without leaking secret material in error',
        rejectedShortSecret && !leakedWeakSecret
      );

      const strongAuthSecret = crypto.randomBytes(32).toString('hex');
      process.env.AUTH_SECRET = strongAuthSecret;
      const resolvedAuth = getAuthSecret();
      record(
        '2. AUTH_SECRET Security',
        'getAuthSecret() accepts valid >= 32-character AUTH_SECRET in production',
        resolvedAuth === strongAuthSecret
      );
    } finally {
      restoreEnv();
    }

    // =========================================================================
    // 3. ENCRYPTION_SECRET Production Enforcement
    // =========================================================================
    try {
      process.env.NODE_ENV = 'production';
      const valid32ByteBase64 = crypto.randomBytes(32).toString('base64');

      // Missing ENCRYPTION_SECRET
      delete process.env.ENCRYPTION_SECRET;
      process.env.AUTH_SECRET = valid32ByteBase64;
      process.env.JWT_SECRET = valid32ByteBase64;
      let rejectedMissingEnc = false;
      try {
        getEncryptionKey();
      } catch {
        rejectedMissingEnc = true;
      }
      record(
        '3. ENCRYPTION_SECRET Security',
        'getEncryptionKey() fails closed when ENCRYPTION_SECRET is missing and never falls back to AUTH_SECRET or JWT_SECRET',
        rejectedMissingEnc
      );

      // Reusing AUTH_SECRET as ENCRYPTION_SECRET must fail closed
      process.env.AUTH_SECRET = valid32ByteBase64;
      process.env.ENCRYPTION_SECRET = valid32ByteBase64;
      let rejectedDuplicateSecret = false;
      try {
        getEncryptionKey();
      } catch (err: any) {
        if (err?.message?.includes('strictly independent')) {
          rejectedDuplicateSecret = true;
        }
      }
      record(
        '3. ENCRYPTION_SECRET Security',
        'getEncryptionKey() rejects ENCRYPTION_SECRET if it duplicates AUTH_SECRET',
        rejectedDuplicateSecret
      );

      // Distinct valid 32-byte Base64 secret succeeds
      delete process.env.JWT_SECRET;
      process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
      process.env.ENCRYPTION_SECRET = valid32ByteBase64;
      const keyBuf = getEncryptionKey();
      record(
        '3. ENCRYPTION_SECRET Security',
        'getEncryptionKey() decodes independent 32-byte Base64 ENCRYPTION_SECRET accurately',
        Buffer.isBuffer(keyBuf) && keyBuf.length === 32
      );
    } finally {
      restoreEnv();
    }

    // =========================================================================
    // 4. DATABASE_URL, DATABASE_SSL & Credential Sanitization
    // =========================================================================
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;

      let dbFailedClosed = false;
      try {
        getDatabaseConfig();
      } catch (err: any) {
        if (err?.message?.includes('DATABASE_URL environment variable is required in production')) {
          dbFailedClosed = true;
        }
      }
      record(
        '4. Database Configuration',
        'getDatabaseConfig() fails closed in production when DATABASE_URL is missing (prohibits preview fallback)',
        dbFailedClosed
      );

      process.env.DATABASE_URL = 'postgresql://prod_user:super_secret_pw_123@db.example.edu.ng:5432/bummpt_prod?sslmode=require';
      process.env.DATABASE_SSL = 'require';
      const prodDbCfg = getDatabaseConfig();
      record(
        '4. Database Configuration',
        'getDatabaseConfig() enables SSL and production pool sizing in NODE_ENV=production',
        prodDbCfg.isConfigured === true && Boolean(prodDbCfg.ssl) === true && prodDbCfg.maxPoolSize === 10
      );

      const rawErrorWithUri = 'Connection failed to postgresql://prod_user:super_secret_pw_123@db.example.edu.ng:5432/bummpt_prod timeout';
      const scrubbed = sanitizeDatabaseErrorMessage(rawErrorWithUri);
      const credentialsScrubbed = !scrubbed.includes('super_secret_pw_123') && !scrubbed.includes('prod_user') && scrubbed.includes('[REDACTED_DATABASE_URI]');
      record(
        '4. Database Configuration',
        'sanitizeDatabaseErrorMessage() redacts database connection strings and passwords from error strings',
        credentialsScrubbed,
        `Sanitized: "${scrubbed}"`
      );
    } finally {
      restoreEnv();
    }

    // =========================================================================
    // 5. Port & Host Configuration (Including TEST D — Production HOST)
    // =========================================================================
    try {
      delete process.env.PORT;
      const defaultPort = getServerPort(undefined);
      const customPort = getServerPort('8080');
      const invalidPortFallback = getServerPort('invalid_port');
      const defaultHost = getServerHost(undefined);

      record(
        '5. Port & Host Binding',
        'getServerPort() honors process.env.PORT (e.g. 8080) and defaults safely to 3000 when unset or invalid',
        defaultPort === 3000 && customPort === 8080 && invalidPortFallback === 3000,
        `default=${defaultPort}, custom=${customPort}, invalidFallback=${invalidPortFallback}`
      );

      // TEST D — Production HOST must resolve to 0.0.0.0 regardless of unsafe HOST override
      process.env.NODE_ENV = 'production';
      process.env.HOST = '127.0.0.1';
      const prodHostFromLoopback = getServerHost();

      process.env.HOST = 'localhost';
      const prodHostFromLocalhost = getServerHost();

      process.env.NODE_ENV = 'development';
      process.env.HOST = '127.0.0.1';
      const devHostOverride = getServerHost();
      delete process.env.HOST;
      const devHostDefault = getServerHost();

      record(
        '5. Port & Host Binding',
        'TEST D: Production HOST resolves to 0.0.0.0 even when HOST=127.0.0.1 or HOST=localhost, while preserving development host behavior',
        prodHostFromLoopback === '0.0.0.0' &&
          prodHostFromLocalhost === '0.0.0.0' &&
          devHostOverride === '127.0.0.1' &&
          devHostDefault === '0.0.0.0',
        `prod(127.0.0.1)=${prodHostFromLoopback}, prod(localhost)=${prodHostFromLocalhost}, dev(127.0.0.1)=${devHostOverride}`
      );
    } finally {
      restoreEnv();
    }

    const serverSource = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf-8');
    const bindsToAllInterfaces = serverSource.includes('getServerPort()') && serverSource.includes('getServerHost()');
    record(
      '5. Port & Host Binding',
      'server.ts binds to 0.0.0.0 and dynamically resolves PORT via getServerPort()',
      bindsToAllInterfaces
    );

    // =========================================================================
    // 6. APP_URL, HTTPS Origin, CORS & Secure Cookie Enforcement (Including TEST C)
    // =========================================================================
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.AI_STUDIO_PREVIEW;
      process.env.APP_URL = 'https://portal.bummpteducation.edu.ng';
      process.env.ALLOWED_ORIGINS = 'https://hq.bummpteducation.edu.ng';

      const allowsAppUrlHttps = isAllowedOrigin('https://portal.bummpteducation.edu.ng');
      const allowsConfiguredHttps = isAllowedOrigin('https://hq.bummpteducation.edu.ng');
      const blocksPlainHttpInProd = !isAllowedOrigin('http://portal.bummpteducation.edu.ng');
      const blocksLocalhostInProd = !isAllowedOrigin('http://localhost:3000');
      const blocksWildcard = !isAllowedOrigin('*');
      const blocksUntrustedHttps = !isAllowedOrigin('https://attacker.example.com');

      record(
        '6. Origin, CORS & Cookies',
        'Production CORS trusts configured HTTPS APP_URL and ALLOWED_ORIGINS while blocking HTTP, localhost, wildcard (*), and untrusted origins',
        allowsAppUrlHttps && allowsConfiguredHttps && blocksPlainHttpInProd && blocksLocalhostInProd && blocksWildcard && blocksUntrustedHttps
      );

      // TEST C — AI_STUDIO_PREVIEW cannot bypass production CORS
      process.env.NODE_ENV = 'production';
      process.env.AI_STUDIO_PREVIEW = 'true';
      process.env.APP_URL = 'https://portal.example.com';
      delete process.env.ALLOWED_ORIGINS;

      const testCAllowsTrustedHttps = isAllowedOrigin('https://portal.example.com') === true;
      const testCRejectsHttp = isAllowedOrigin('http://portal.example.com') === false;
      const testCRejectsUntrusted = isAllowedOrigin('https://attacker.example.com') === false;
      const testCRejectsWildcard = isAllowedOrigin('*') === false;

      record(
        '6. Origin, CORS & Cookies',
        'TEST C: AI_STUDIO_PREVIEW=true cannot bypass production CORS (allows https://portal.example.com, rejects http://, untrusted origins, and "*")',
        testCAllowsTrustedHttps && testCRejectsHttp && testCRejectsUntrusted && testCRejectsWildcard
      );

      const prodCookieOpts = getAuthCookieOptions();
      record(
        '6. Origin, CORS & Cookies',
        'Production authentication cookies enforce httpOnly=true, secure=true, and sameSite="lax"',
        prodCookieOpts.httpOnly === true && prodCookieOpts.secure === true && prodCookieOpts.sameSite === 'lax'
      );
    } finally {
      restoreEnv();
    }

    // =========================================================================
    // 7. Production Startup Validation & Seeder Lockout (Including TEST A & TEST B)
    // =========================================================================
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.AI_STUDIO_PREVIEW;
      delete process.env.DATABASE_URL;
      delete process.env.DATABASE_SSL;
      delete process.env.AUTH_SECRET;
      delete process.env.ENCRYPTION_SECRET;
      delete process.env.JWT_SECRET;
      process.env.APP_URL = 'http://insecure-origin.example.com';

      const invalidStartup = validateProductionStartupConfig();
      let startupThrew = false;
      try {
        enforceProductionStartupConfig();
      } catch (err: any) {
        if (err?.message?.includes('FATAL PRODUCTION STARTUP ERROR')) {
          startupThrew = true;
        }
      }

      record(
        '7. Startup & Seeder Safety',
        'enforceProductionStartupConfig() fails closed when DATABASE_URL, DATABASE_SSL, AUTH_SECRET, ENCRYPTION_SECRET, or HTTPS APP_URL are invalid in production',
        !invalidStartup.valid && invalidStartup.errors.length >= 4 && startupThrew,
        `Detected ${invalidStartup.errors.length} configuration violations`
      );

      // TEST A — Missing APP_URL must fail production validation even when all other settings are valid
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@db.example.edu.ng:5432/prod_db?sslmode=require';
      process.env.DATABASE_SSL = 'require';
      process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
      process.env.ENCRYPTION_SECRET = crypto.randomBytes(32).toString('base64');
      delete process.env.JWT_SECRET;
      delete process.env.APP_URL;
      process.env.ALLOWED_ORIGINS = 'https://hq.example.com'; // Must NOT substitute for missing APP_URL

      const missingAppUrlCheck = validateProductionStartupConfig();
      const hasMissingAppUrlError = missingAppUrlCheck.errors.some(e => e.includes('APP_URL'));
      let missingAppUrlThrew = false;
      try {
        enforceProductionStartupConfig();
      } catch (err: any) {
        if (err?.message?.includes('APP_URL')) {
          missingAppUrlThrew = true;
        }
      }

      record(
        '7. Startup & Seeder Safety',
        'TEST A: Missing APP_URL in production causes validateProductionStartupConfig().valid === false and enforceProductionStartupConfig() to throw',
        missingAppUrlCheck.valid === false && hasMissingAppUrlError && missingAppUrlThrew,
        `valid=${missingAppUrlCheck.valid}, errors=${missingAppUrlCheck.errors.join('; ')}`
      );

      // TEST B — DATABASE_SSL=disable and DATABASE_SSL=false must fail in production, while DATABASE_SSL=require succeeds
      process.env.APP_URL = 'https://portal.bummpteducation.edu.ng';
      delete process.env.ALLOWED_ORIGINS;
      process.env.DATABASE_SSL = 'disable';

      const disabledSslCheck = validateProductionStartupConfig();
      const hasSslError = disabledSslCheck.errors.some(e => e.includes('DATABASE_SSL'));
      let disabledSslStartupThrew = false;
      try {
        enforceProductionStartupConfig();
      } catch (err: any) {
        if (err?.message?.includes('DATABASE_SSL')) {
          disabledSslStartupThrew = true;
        }
      }
      let disabledSslDbConfigThrew = false;
      try {
        getDatabaseConfig();
      } catch (err: any) {
        if (err?.message?.includes('DATABASE_SSL')) {
          disabledSslDbConfigThrew = true;
        }
      }

      process.env.DATABASE_SSL = 'false';
      const falseSslCheck = validateProductionStartupConfig();

      // Now set DATABASE_SSL=require and verify valid === true
      process.env.DATABASE_SSL = 'require';
      const validStartup = validateProductionStartupConfig();

      record(
        '7. Startup & Seeder Safety',
        'TEST B: DATABASE_SSL=disable or false fails closed in production and throws on startup, while DATABASE_SSL=require succeeds',
        disabledSslCheck.valid === false &&
          hasSslError &&
          disabledSslStartupThrew &&
          disabledSslDbConfigThrew &&
          falseSslCheck.valid === false &&
          validStartup.valid === true,
        `disableValid=${disabledSslCheck.valid}, falseValid=${falseSslCheck.valid}, requireValid=${validStartup.valid}`
      );

      record(
        '7. Startup & Seeder Safety',
        'validateProductionStartupConfig() succeeds when all production secrets, DATABASE_URL, DATABASE_SSL=require, and HTTPS APP_URL are valid',
        validStartup.valid === true && validStartup.errors.length === 0
      );

      // Verify all 5 seeders fail closed at runtime in NODE_ENV=production
      const seederCalls = [
        () => runReferenceDataSeeder(),
        () => seedDevelopmentAuthIdentities(),
        () => seedOperationalFoundation(),
        () => seedFinancialFoundation(),
        () => seedLessonNotesFoundation(),
      ];
      let blockedCount = 0;
      for (const fn of seederCalls) {
        try {
          await fn();
        } catch (err: any) {
          if (err?.message?.toLowerCase().includes('security exception')) {
            blockedCount++;
          }
        }
      }
      record(
        '7. Startup & Seeder Safety',
        'All 5 reference and operational seeders fail closed at runtime when NODE_ENV=production',
        blockedCount === 5,
        `Blocked ${blockedCount}/5 seeders`
      );
    } finally {
      restoreEnv();
    }

    // =========================================================================
    // 8. Health & Readiness Endpoints (/api/health and /api/health/db)
    // =========================================================================
    const healthApp = express();
    healthApp.use(corsMiddleware);
    healthApp.use(cookieParser());
    healthApp.get('/api/health', handleAppHealthCheck);
    healthApp.get('/api/health/db', handleDatabaseHealthCheck);
    healthApp.get('/api/test-cookie', (_req, res) => {
      setAuthCookie(res, 'sample-jwt-token');
      res.json({ ok: true });
    });

    const testServer = http.createServer(healthApp);
    await new Promise<void>(resolve => testServer.listen(0, '127.0.0.1', () => resolve()));
    const port = (testServer.address() as any).port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 8a. Healthy development/connected state
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const healthJson = await healthRes.json();
      const dbHealthRes = await fetch(`${baseUrl}/api/health/db`);
      const dbHealthJson = await dbHealthRes.json();

      record(
        '8. Health & Readiness',
        'GET /api/health returns 200 OK with status="ok" and readiness="ready" when configuration is valid',
        healthRes.status === 200 && healthJson.status === 'ok' && healthJson.readiness === 'ready'
      );

      record(
        '8. Health & Readiness',
        'GET /api/health/db returns 200 OK when PostgreSQL is connected and migrations are applied',
        dbHealthRes.status === 200 && dbHealthJson.status === 'ok' && dbHealthJson.database === 'connected' && dbHealthJson.migrationReady === true
      );

      // 8b. Verify zero sensitive leakage in health payloads
      const combinedHealthPayload = JSON.stringify({ healthJson, dbHealthJson });
      const leaksSecrets =
        (process.env.DATABASE_URL && combinedHealthPayload.includes(process.env.DATABASE_URL)) ||
        (process.env.AUTH_SECRET && combinedHealthPayload.includes(process.env.AUTH_SECRET)) ||
        (process.env.ENCRYPTION_SECRET && combinedHealthPayload.includes(process.env.ENCRYPTION_SECRET)) ||
        combinedHealthPayload.includes('ep-falling-breeze') ||
        combinedHealthPayload.includes('password');

      record(
        '8. Health & Readiness',
        'Health endpoints never expose DATABASE_URL, AUTH_SECRET, ENCRYPTION_SECRET, hostnames, or credentials',
        !leaksSecrets
      );

      // 8c. Production misconfiguration state (503 configuration_invalid)
      process.env.NODE_ENV = 'production';
      delete process.env.AUTH_SECRET;
      const misconfigHealthRes = await fetch(`${baseUrl}/api/health`);
      const misconfigHealthJson = await misconfigHealthRes.json();
      const misconfigDbRes = await fetch(`${baseUrl}/api/health/db`);
      const misconfigDbJson = await misconfigDbRes.json();

      record(
        '8. Health & Readiness',
        'Health endpoints return 503 status="configuration_invalid" when production configuration is incomplete',
        misconfigHealthRes.status === 503 &&
          misconfigHealthJson.status === 'configuration_invalid' &&
          misconfigDbRes.status === 503 &&
          misconfigDbJson.status === 'configuration_invalid'
      );

      // 8d. Verify Set-Cookie header in production mode includes HttpOnly, Secure, SameSite=Lax
      process.env.AUTH_SECRET = crypto.randomBytes(32).toString('hex');
      process.env.ENCRYPTION_SECRET = crypto.randomBytes(32).toString('base64');
      const cookieRes = await fetch(`${baseUrl}/api/test-cookie`);
      const setCookieHeader = cookieRes.headers.get('set-cookie') || '';
      const hasSecureCookieFlags =
        setCookieHeader.includes(AUTH_COOKIE_NAME) &&
        setCookieHeader.includes('HttpOnly') &&
        setCookieHeader.includes('Secure') &&
        setCookieHeader.includes('SameSite=Lax');

      record(
        '8. Health & Readiness',
        'HTTP response Set-Cookie header in production includes HttpOnly, Secure, and SameSite=Lax flags',
        hasSecureCookieFlags,
        `Set-Cookie verified`
      );
    } finally {
      restoreEnv();
      testServer.close();
      await closeDatabasePool();
    }

    // =========================================================================
    // 9. Build/Start Contract & Documentation Consistency
    // =========================================================================
    const pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
    const buildStartContractValid =
      pkgJson.scripts?.build?.includes('vite build') &&
      pkgJson.scripts?.build?.includes('outfile=dist/server.cjs') &&
      pkgJson.scripts?.start === 'node dist/server.cjs';

    record(
      '9. Build & Docs Contract',
      'package.json preserves standard "npm run build" -> "dist/server.cjs" and "npm start" -> "node dist/server.cjs" contract',
      buildStartContractValid
    );

    const devDocsContent = fs.readFileSync(path.join(process.cwd(), 'DEVELOPER_DOCUMENTATION.md'), 'utf-8');
    const hasNoJwtSecretInDevDocs = !devDocsContent.includes('JWT_SECRET=');
    record(
      '9. Build & Docs Contract',
      'DEVELOPER_DOCUMENTATION.md uses AUTH_SECRET and ENCRYPTION_SECRET with zero contradictory JWT_SECRET instructions',
      hasNoJwtSecretInDevDocs && devDocsContent.includes('AUTH_SECRET=') && devDocsContent.includes('ENCRYPTION_SECRET=')
    );

    const phase10aDocPath = path.join(process.cwd(), 'docs/PHASE_10A_PRODUCTION_DEPLOYMENT.md');
    const phase10aDocExists = fs.existsSync(phase10aDocPath);
    const phase10aDocContent = phase10aDocExists ? fs.readFileSync(phase10aDocPath, 'utf-8') : '';
    const hasStatusDeclarations =
      phase10aDocContent.includes('CODE PRODUCTION CONTRACT:\nREADY') &&
      phase10aDocContent.includes('LIVE DEPLOYMENT:\nNOT YET EXECUTED');

    record(
      '9. Build & Docs Contract',
      'docs/PHASE_10A_PRODUCTION_DEPLOYMENT.md exists and declares CODE PRODUCTION CONTRACT: READY and LIVE DEPLOYMENT: NOT YET EXECUTED',
      phase10aDocExists && hasStatusDeclarations
    );
  } catch (err: any) {
    console.error('Unhandled error in Phase 10A test suite:', err);
    record('FATAL', 'Unhandled exception', false, err?.message || String(err));
  } finally {
    restoreEnv();
    await closeDatabasePool();
  }

  console.log('\n======================================================================');
  console.log('PHASE 10A TEST RESULTS SUMMARY:');
  const passedCount = results.filter(r => r.status === 'PASSED').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('======================================================================\n');

  if (failedCount > 0) {
    console.error('❌ Phase 10A verification failed.');
    process.exit(1);
  } else {
    console.log('✅ Phase 10A production deployment architecture & environment contract verified!');
    process.exit(0);
  }
}

runPhase10aSuite();
