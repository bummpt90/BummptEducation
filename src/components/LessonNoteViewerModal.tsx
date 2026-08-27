import React, { useState } from 'react';
import { LessonNote, LessonFeedback } from '../types';
import { downloadLessonNoteAsPDF } from '../utils/pdfGenerator';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  BookOpen, 
  Calendar, 
  User, 
  CheckCircle2, 
  HelpCircle, 
  Send, 
  MessageSquare, 
  Sparkles, 
  Check, 
  Layers, 
  Award,
  ChevronRight,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface LessonNoteViewerModalProps {
  note: LessonNote | null;
  isOpen: boolean;
  onClose: () => void;
  onPostFeedback?: (noteId: string, feedback: { parentName: string; studentName: string; question: string }) => Promise<boolean>;
}

export const LessonNoteViewerModal: React.FC<LessonNoteViewerModalProps> = ({
  note,
  isOpen,
  onClose,
  onPostFeedback,
}) => {
  if (!isOpen || !note) return null;

  const [parentName, setParentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'objectives' | 'homework' | 'qa'>('content');

  const handleDownload = () => {
    downloadLessonNoteAsPDF(note);
    // Ping download tracker on backend
    try {
      fetch(`/api/lesson-notes/${note.id}/increment-download`, { method: 'POST' }).catch(() => {});
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !question.trim()) return;

    setIsSubmitting(true);
    try {
      if (onPostFeedback) {
        await onPostFeedback(note.id, { parentName, studentName, question });
      } else {
        await fetch(`/api/lesson-notes/${note.id}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentName, studentName, question }),
        });
      }
      setSubmittedSuccess(true);
      setQuestion('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600/30 p-2 text-blue-400 border border-blue-500/40">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Official Lesson Note (PDF View)
                </span>
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-400/30">
                  Week {note.weekNumber} • {note.term}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white line-clamp-1">
                {note.topic}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-xs cursor-pointer"
              title="Download PDF Document"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
              title="Print Document"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800/80 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Metadata Banner Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Subject</span>
            <span className="font-bold text-slate-800">{note.subjectName}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Class & Arm</span>
            <span className="font-bold text-blue-700">{note.classLevel}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Subject Teacher</span>
            <span className="font-bold text-slate-800 line-clamp-1">{note.teacherName}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">File & Size</span>
            <span className="font-semibold text-emerald-700">{note.pdfFileSize} • Verified PDF</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-white space-x-2 pt-2">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Lesson Body & Notes
          </button>
          <button
            onClick={() => setActiveTab('objectives')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'objectives'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Learning Objectives ({note.learningObjectives?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'homework'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Homework & Evaluation ({note.evaluationQuestions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'qa'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Ask Teacher / Inquiry Desk
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-800 bg-white">
          
          {/* TAB 1: MAIN LESSON BODY */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              
              {/* Executive Summary Card */}
              <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>Executive Module Summary</span>
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed">
                  {note.contentSummary}
                </p>
              </div>

              {/* Subtopics Covered */}
              {note.subTopics && note.subTopics.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Subtopics Explored in this Lesson:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {note.subTopics.map((sub, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[10px] font-bold text-blue-800">
                          {i + 1}
                        </span>
                        <span className="font-medium">{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatted Content Body */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Comprehensive Lesson Text & Worked Examples:
                </h4>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {note.contentBody}
                </div>
              </div>

              {/* Key Vocabulary Terms */}
              {note.keyTerms && note.keyTerms.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Core Glossary & Key Terms
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {note.keyTerms.map((term, i) => (
                      <span key={i} className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OBJECTIVES */}
          {activeTab === 'objectives' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Behavioral Learning Objectives</span>
                </div>
                <p className="text-xs text-emerald-800">
                  By the end of this lesson, under parent supervision, the student should be able to:
                </p>
                <div className="space-y-2.5 pt-1">
                  {note.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-800 font-medium shadow-2xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {note.instructionalMaterials && note.instructionalMaterials.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Instructional Teaching Aids & Apparatus Used
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                    {note.instructionalMaterials.map((mat, i) => (
                      <li key={i}>{mat}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HOMEWORK */}
          {activeTab === 'homework' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-rose-50/70 border border-rose-200 p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <BookOpen className="h-5 w-5 text-rose-600" />
                  <span>Homework & Formative Evaluation Questions</span>
                </div>
                <p className="text-xs text-rose-800">
                  Parents and guardians are requested to supervise their children in solving the following exercises before the next academic contact:
                </p>
                <div className="space-y-2.5 pt-1">
                  {note.evaluationQuestions.map((q, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-xl border border-rose-100 text-xs text-slate-800 leading-relaxed shadow-2xs font-medium">
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARENT Q&A INQUIRY DESK */}
          {activeTab === 'qa' && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-4">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-1">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span>Parent-Teacher Consultation & Clarification Desk</span>
                </div>
                <p className="text-xs text-blue-950 leading-relaxed">
                  Have a question about this lesson topic or need homework guidance for your child? Post your inquiry below; {note.teacherName} will respond directly to your portal.
                </p>
              </div>

              {submittedSuccess ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 text-sm">Inquiry Submitted Successfully!</h4>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    Your question has been forwarded to <strong>{note.teacherName}</strong>. You will receive teacher feedback during morning consultation.
                  </p>
                  <button
                    onClick={() => setSubmittedSuccess(false)}
                    className="mt-2 text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitQuestion} className="space-y-3.5 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Parent / Guardian Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mr. John Audu"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Child / Student Name & Class
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. Joy Audu (${note.classLevel})`}
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Your Question or Clarification Request on this Lesson *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Please clarify question 3 regarding the formula steps..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Send Question to Teacher'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Academic Verification: <strong>BummptEducation Curriculum Directorate</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl bg-white border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-sm cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download Official PDF ({note.pdfFileSize})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
