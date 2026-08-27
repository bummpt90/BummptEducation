import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_LESSON_NOTES, INITIAL_LESSON_FEEDBACKS } from './src/data/lessonNotesData';
import { LessonNote, LessonFeedback } from './src/types';

// In-memory persistent state during server runtime
let lessonNotesStore: LessonNote[] = [...INITIAL_LESSON_NOTES];
let lessonFeedbacksStore: LessonFeedback[] = [...INITIAL_LESSON_FEEDBACKS];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // =========================================================================
  // API ROUTES (Mounted BEFORE Vite Middleware)
  // =========================================================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      server: 'BummptEducation Backend Express API',
      timestamp: new Date().toISOString() 
    });
  });

  // 1. GET /api/lesson-notes (Search, filter by class, subject, term, arm, week)
  app.get('/api/lesson-notes', (req, res) => {
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

  // 4. POST /api/lesson-notes (Upload/Create New Lesson Note by Teacher)
  app.post('/api/lesson-notes', (req, res) => {
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
        teacherId: teacherId || 'staff-gen-01',
        teacherName: teacherName || 'Staff Teacher',
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BummptEducation Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
