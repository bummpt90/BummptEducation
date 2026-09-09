import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { checkDatabaseHealth, closeDatabasePool, runMigrations, getDatabaseConfig, query } from './src/db';
import { authRouter } from './src/auth/auth.routes';
import { schoolsRouter } from './src/api/v1/schools.routes';
import { classesRouter } from './src/api/v1/classes.routes';
import { staffRouter } from './src/api/v1/staff.routes';
import { studentsRouter } from './src/api/v1/students.routes';
import { allocationsRouter } from './src/api/v1/allocations.routes';
import { attendanceRouter } from './src/api/v1/attendance.routes';
import { assessmentsRouter } from './src/api/v1/assessments.routes';
import { examinationsRouter } from './src/api/v1/examinations.routes';
import { resultsRouter } from './src/api/v1/results.routes';
import { admissionsRouter } from './src/api/v1/admissions.routes';
import { feesRouter } from './src/api/v1/fees.routes';
import { invoicesRouter } from './src/api/v1/invoices.routes';
import { paymentsRouter } from './src/api/v1/payments.routes';
import { bursaryRouter } from './src/api/v1/bursary.routes';
import { financialAuditRouter } from './src/api/v1/financialAudit.routes';
import { parentsRouter } from './src/api/v1/parents.routes';
import { lessonNotesRouter } from './src/api/v1/lesson-notes.routes';
import { devAuthCompatibility, requirePermission, optionalAuthenticate } from './src/auth/middleware';
import { seedDevelopmentAuthIdentities } from './src/db/seed/auth.seed';
import { seedOperationalFoundation } from './src/db/seed/operational.seed';
import { seedFinancialFoundation } from './src/db/seed/financial.seed';
import { seedLessonNotesFoundation } from './src/db/seed/lessonNotes.seed';
import type { AuthenticatedRequest } from './src/auth/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cookie and JSON Body parsing
  app.use(cookieParser());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // =========================================================================
  // API ROUTES (Mounted BEFORE Vite Middleware)
  // =========================================================================

  // Production Authentication & RBAC API (v1)
  app.use('/api/v1/auth', authRouter);

  // Operational Data Foundations API (v1)
  app.use('/api/v1/schools', schoolsRouter);
  app.use('/api/v1/classes', classesRouter);
  app.use('/api/v1/staff', staffRouter);
  app.use('/api/v1/students', studentsRouter);

  // Academic Operations Foundation API (v1 - Phase 5)
  app.use('/api/v1/academic/allocations', allocationsRouter);
  app.use('/api/v1/attendance', attendanceRouter);
  app.use('/api/v1/assessments', assessmentsRouter);
  app.use('/api/v1/examinations', examinationsRouter);
  app.use('/api/v1/results', resultsRouter);

  // Admissions, Fees, Invoices, Payments, Bursary & Audit API (v1 - Phase 6)
  app.use('/api/v1/admissions', admissionsRouter);
  app.use('/api/v1/fees', feesRouter);
  app.use('/api/v1/invoices', invoicesRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/bursary', bursaryRouter);
  app.use('/api/v1/financial/audit', financialAuditRouter);

  // Parent & Guardian Identity & Report Access API (v1 - Phase 8B)
  app.use('/api/v1/parents', parentsRouter);

  // General server health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'BummptEducation Backend Express API',
      timestamp: new Date().toISOString() 
    });
  });

  // Dedicated PostgreSQL database health check
  app.get('/api/health/db', async (req, res) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      const isOk = dbHealth.status === 'connected' || dbHealth.status === 'unconfigured';
      res.status(isOk ? 200 : 503).json({
        status: dbHealth.status === 'connected' 
          ? 'ok' 
          : (dbHealth.status === 'unconfigured' ? 'preview_mode' : 'degraded'),
        database: dbHealth.status,
        engine: 'PostgreSQL',
        configured: dbHealth.configured,
        latencyMs: dbHealth.latencyMs,
        timestamp: new Date().toISOString(),
        message: dbHealth.status === 'connected'
          ? 'PostgreSQL database connected and operational'
          : (dbHealth.status === 'unconfigured'
              ? 'Database unconfigured. Running in safe development/preview mode.'
              : 'Database connection degraded. Safe preview active.'),
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        database: 'error',
        engine: 'PostgreSQL',
        timestamp: new Date().toISOString(),
        message: 'Database diagnostic check encountered an error.',
      });
    }
  });

  // =========================================================================
  // LESSON NOTES & TEACHER INQUIRIES API (PHASE 8D - POSTGRESQL AUTHORITATIVE)
  // =========================================================================
  app.use('/api/v1/lesson-notes', lessonNotesRouter);
  app.use('/api/lesson-notes', lessonNotesRouter);

  // =========================================================================
  // VITE & STATIC SPA FALLBACK HANDLING
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`BummptEducation Full-Stack Server running on http://0.0.0.0:${PORT}`);

    // Database startup verification (Non-blocking: safe fallback for preview mode)
    const dbConfig = getDatabaseConfig();
    if (dbConfig.isConfigured) {
      console.log('[PostgreSQL] Configuration detected. Running initial health check and migrations...');
      try {
        const health = await checkDatabaseHealth();
        if (health.status === 'connected') {
          console.log(`[PostgreSQL] Connected to ${health.database} (${health.serverVersion}) in ${health.latencyMs}ms`);
          const migrationResult = await runMigrations();
          if (migrationResult.success) {
            console.log(`[Migrations] Ready: ${migrationResult.appliedCount} applied, ${migrationResult.skippedCount} up to date.`);

            // Verify development auth test users exist
            try {
              const userCountRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM users;');
              if (parseInt(userCountRes.rows[0]?.count || '0', 10) === 0) {
                console.log('[AuthSeed] No users found. Seeding initial development authentication identities...');
                await seedDevelopmentAuthIdentities();
              }

              const staffCountRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM staff;');
              if (parseInt(staffCountRes.rows[0]?.count || '0', 10) === 0) {
                console.log('[OperationalSeed] No staff records found. Seeding operational foundation...');
                await seedOperationalFoundation();
              }

              const feeCountRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM fee_structures;');
              if (parseInt(feeCountRes.rows[0]?.count || '0', 10) === 0) {
                console.log('[FinancialSeed] No fee structures found. Seeding financial & admissions foundation...');
                await seedFinancialFoundation();
              }

              // Phase 8D: Lesson notes seeder is development/reference ONLY.
              // In production, the database remains strictly empty until published by educators.
              if (process.env.NODE_ENV !== 'production') {
                const lessonNotesCountRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM lesson_notes;');
                if (parseInt(lessonNotesCountRes.rows[0]?.count || '0', 10) === 0) {
                  console.log('[LessonNotesSeed] [DEV ONLY] No lesson notes found. Seeding initial reference lesson notes & inquiries...');
                  await seedLessonNotesFoundation();
                }
              } else {
                console.log('[LessonNotesSeed] Production environment detected. Skipping mock lesson notes seeding.');
              }
            } catch (seedErr: any) {
              console.warn('[OperationalSeed] Seeding notice:', seedErr?.message);
            }
          } else {
            console.warn(`[Migrations] Notice: ${migrationResult.error}`);
          }
        } else {
          console.warn(`[PostgreSQL] Connection check: ${health.error || 'Unavailable'}. Safe preview mode active.`);
        }
      } catch (err: any) {
        console.warn(`[PostgreSQL] Initialization notice: ${err?.message}. Continuing in safe development mode.`);
      }
    } else {
      console.log('[PostgreSQL] Running in preview/development mode without DATABASE_URL. Mock & local state active.');
    }
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await closeDatabasePool();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
