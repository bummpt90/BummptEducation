import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_LESSON_NOTES, INITIAL_LESSON_FEEDBACKS } from './src/data/lessonNotesData';
import { LessonNote, LessonFeedback } from './src/types';
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
import { devAuthCompatibility, requirePermission, optionalAuthenticate } from './src/auth/middleware';
import { seedDevelopmentAuthIdentities } from './src/db/seed/auth.seed';
import { seedOperationalFoundation } from './src/db/seed/operational.seed';
import { seedFinancialFoundation } from './src/db/seed/financial.seed';
import type { AuthenticatedRequest } from './src/auth/types';

// In-memory persistent state during server runtime
let lessonNotesStore: LessonNote[] = [...INITIAL_LESSON_NOTES];
let lessonFeedbacksStore: LessonFeedback[] = [...INITIAL_LESSON_FEEDBACKS];

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

  // 1. GET /api/lesson-notes (Search, filter by class, subject, term, arm, week)
  app.get('/api/lesson-notes', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
    try {
      const { classLevel, arm, term, subject, week, search } = req.query;

      let results = [...lessonNotesStore];

      if (classLevel && typeof classLevel === 'string' && classLevel !== 'All') {
        results = results.filter((n) => n.classLevel.toLowerCase() === classLevel.toLowerCase());
      }

      if (arm && typeof arm === 'string' && arm !== 'All') {
        results = results.filter((n) => n.arm.toLowerCase() === arm.toLowerCase());
      }

      if (term && typeof term === 'string' && term !== 'All') {
        results = results.filter((n) => n.term.toLowerCase() === term.toLowerCase());
      }

      if (subject && typeof subject === 'string' && subject !== 'All') {
        results = results.filter(
          (n) =>
            n.subjectName.toLowerCase().includes(subject.toLowerCase()) ||
            n.subjectId.toLowerCase() === subject.toLowerCase()
        );
      }

      if (week && typeof week === 'string' && week !== 'All') {
        const weekNum = parseInt(week, 10);
        if (!isNaN(weekNum)) {
          results = results.filter((n) => n.weekNumber === weekNum);
        }
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const query = search.toLowerCase();
        results = results.filter(
          (n) =>
            n.title.toLowerCase().includes(query) ||
            n.topic.toLowerCase().includes(query) ||
            n.subjectName.toLowerCase().includes(query) ||
            n.teacherName.toLowerCase().includes(query) ||
            n.contentSummary.toLowerCase().includes(query) ||
            (n.keyTerms && n.keyTerms.some((t) => t.toLowerCase().includes(query)))
        );
      }

      res.json({
        success: true,
        count: results.length,
        data: results,
      });
    } catch (error: any) {
      console.error('Error fetching lesson notes:', error);
      res.status(500).json({ success: false, message: 'Server error fetching lesson notes', error: error.message });
    }
  });

  // 2. GET /api/lesson-notes/stats (Overview metrics for dashboard)
  app.get('/api/lesson-notes/stats', (req, res) => {
    try {
      const totalNotes = lessonNotesStore.length;
      const totalDownloads = lessonNotesStore.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);
      const armsCovered = {
        kindergarten: lessonNotesStore.filter((n) => n.arm === 'kindergarten').length,
        primary: lessonNotesStore.filter((n) => n.arm === 'primary').length,
        secondary: lessonNotesStore.filter((n) => n.arm === 'secondary').length,
      };

      const classesCovered = Array.from(new Set(lessonNotesStore.map((n) => n.classLevel)));
      const subjectsCovered = Array.from(new Set(lessonNotesStore.map((n) => n.subjectName)));

      res.json({
        success: true,
        data: {
          totalNotes,
          totalDownloads,
          totalFeedbacks: lessonFeedbacksStore.length,
          armsCovered,
          classesCoveredCount: classesCovered.length,
          subjectsCoveredCount: subjectsCovered.length,
          classesCovered,
          subjectsCovered,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to compute stats', error: error.message });
    }
  });

  // 3. GET /api/lesson-notes/:id (Single lesson note)
  app.get('/api/lesson-notes/:id', (req, res) => {
    try {
      const { id } = req.params;
      const note = lessonNotesStore.find((n) => n.id === id);

      if (!note) {
        return res.status(404).json({ success: false, message: 'Lesson note not found' });
      }

      const feedbacks = lessonFeedbacksStore.filter((f) => f.lessonNoteId === id);

      res.json({
        success: true,
        data: {
          ...note,
          feedbacks,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to retrieve note', error: error.message });
    }
  });

  // 4. POST /api/lesson-notes (Upload/Create New Lesson Note by Teacher - Protected)
  app.post(
    '/api/lesson-notes',
    devAuthCompatibility,
    requirePermission('lesson_notes.create'),
    (req: AuthenticatedRequest, res) => {
      try {
        const {
          title,
          subjectId,
          subjectName,
          classLevel,
          arm,
          term,
          academicYear,
          weekNumber,
          teacherId,
          teacherName,
          topic,
          subTopics,
          learningObjectives,
          instructionalMaterials,
          contentSummary,
          contentBody,
          evaluationQuestions,
          keyTerms,
        } = req.body;

        if (!title || !subjectName || !classLevel || !topic || !contentBody) {
          return res.status(400).json({
            success: false,
            message: 'Required fields missing: title, subjectName, classLevel, topic, contentBody are compulsory.',
          });
        }

        const newId = `note-${Date.now()}`;
        const safeWeek = weekNumber ? parseInt(weekNumber, 10) : 1;
        const cleanClassLevel = classLevel.replace(/\s+/g, '_');
        const cleanSubject = subjectName.replace(/\s+/g, '_');

        const newNote: LessonNote = {
          id: newId,
          title,
          subjectId: subjectId || `sub-${Date.now()}`,
          subjectName,
          classLevel,
          arm: arm || 'secondary',
          term: term || '2nd Term',
          academicYear: academicYear || '2025/2026',
          weekNumber: safeWeek,
          teacherId: req.user?.id || teacherId || 'staff-gen-01',
          teacherName: req.user?.fullName || teacherName || 'Staff Teacher',
          topic,
          subTopics: Array.isArray(subTopics) ? subTopics : subTopics ? [subTopics] : [],
          learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : learningObjectives ? [learningObjectives] : [],
          instructionalMaterials: Array.isArray(instructionalMaterials) ? instructionalMaterials : [],
          contentSummary: contentSummary || contentBody.slice(0, 160) + '...',
          contentBody,
          evaluationQuestions: Array.isArray(evaluationQuestions) ? evaluationQuestions : evaluationQuestions ? [evaluationQuestions] : [],
          keyTerms: Array.isArray(keyTerms) ? keyTerms : [],
          pdfFileName: `${cleanClassLevel}_${cleanSubject}_Week${safeWeek}_LessonNote.pdf`,
          pdfFileSize: '2.5 MB',
          uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          downloadCount: 0,
          status: 'Published',
        };

      lessonNotesStore.unshift(newNote);

      res.status(201).json({
        success: true,
        message: 'Lesson note successfully created and published for parent download!',
        data: newNote,
      });
    } catch (error: any) {
      console.error('Error creating lesson note:', error);
      res.status(500).json({ success: false, message: 'Failed to create lesson note', error: error.message });
    }
  });

  // 5. POST /api/lesson-notes/:id/increment-download (Increment download stats)
  app.post('/api/lesson-notes/:id/increment-download', (req, res) => {
    try {
      const { id } = req.params;
      const note = lessonNotesStore.find((n) => n.id === id);

      if (note) {
        note.downloadCount = (note.downloadCount || 0) + 1;
        return res.json({ success: true, downloadCount: note.downloadCount });
      }

      res.status(404).json({ success: false, message: 'Note not found' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 6. POST /api/lesson-notes/:id/feedback (Parent asks teacher a question)
  app.post('/api/lesson-notes/:id/feedback', (req, res) => {
    try {
      const { id } = req.params;
      const { parentName, studentName, guardianPhone, question } = req.body;

      if (!parentName || !question) {
        return res.status(400).json({ success: false, message: 'Parent name and question are required.' });
      }

      const newFeedback: LessonFeedback = {
        id: `fb-${Date.now()}`,
        lessonNoteId: id,
        parentName,
        studentName: studentName || 'Student',
        guardianPhone: guardianPhone || '',
        question,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Pending',
      };

      lessonFeedbacksStore.unshift(newFeedback);

      res.status(201).json({
        success: true,
        message: 'Your question has been forwarded directly to the subject teacher desk.',
        data: newFeedback,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Failed to post inquiry', error: error.message });
    }
  });

  // 7. GET /api/lesson-notes/:id/feedbacks
  app.get('/api/lesson-notes/:id/feedbacks', (req, res) => {
    const { id } = req.params;
    const feedbacks = lessonFeedbacksStore.filter((f) => f.lessonNoteId === id);
    res.json({ success: true, data: feedbacks });
  });

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
