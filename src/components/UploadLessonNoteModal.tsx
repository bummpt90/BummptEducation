import React, { useState } from 'react';
import { ClassLevel, SchoolArm, Term, LessonNote, getSchoolArm } from '../types';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface UploadLessonNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newNote: LessonNote) => void;
}

export const UploadLessonNoteModal: React.FC<UploadLessonNoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subjectName, setSubjectName] = useState('General Mathematics');
  const [classLevel, setClassLevel] = useState<ClassLevel>('Basic 5');
  const [term, setTerm] = useState<Term>('2nd Term');
  const [weekNumber, setWeekNumber] = useState(5);
  const [teacherName, setTeacherName] = useState('Staff Subject Teacher');
  const [contentSummary, setContentSummary] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [learningObjectives, setLearningObjectives] = useState<string[]>([
    'Define the fundamental concepts in this topic.',
    'Solve real-world application problems and exercises.',
  ]);
  const [evaluationQuestions, setEvaluationQuestions] = useState<string[]>([
    'Question 1: Explain the primary principles discussed in today\'s lesson.',
    'Question 2: Complete the assigned practice problem from textbook page 42.',
  ]);
  const [keyTerms, setKeyTerms] = useState('Concepts, Formula, Theory, Application');
  const [attachedPdfName, setAttachedPdfName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddObjective = () => {
    setLearningObjectives([...learningObjectives, '']);
  };

  const handleUpdateObjective = (index: number, val: string) => {
    const updated = [...learningObjectives];
    updated[index] = val;
    setLearningObjectives(updated);
  };

  const handleRemoveObjective = (index: number) => {
    setLearningObjectives(learningObjectives.filter((_, i) => i !== index));
  };

  const handleAddQuestion = () => {
    setEvaluationQuestions([...evaluationQuestions, '']);
  };

  const handleUpdateQuestion = (index: number, val: string) => {
    const updated = [...evaluationQuestions];
    updated[index] = val;
    setEvaluationQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setEvaluationQuestions(evaluationQuestions.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedPdfName(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !subjectName.trim() || !contentBody.trim()) {
      setErrorMsg('Please enter Topic, Subject, and detailed lesson body notes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const arm: SchoolArm = getSchoolArm(classLevel);
      const payload = {
        title: title || `${subjectName}: ${topic}`,
        subjectName,
        classLevel,
        arm,
        term,
        academicYear: '2025/2026',
        weekNumber: Number(weekNumber),
        teacherName,
        topic,
        learningObjectives: learningObjectives.filter((o) => o.trim() !== ''),
        evaluationQuestions: evaluationQuestions.filter((q) => q.trim() !== ''),
        contentSummary: contentSummary || contentBody.slice(0, 160) + '...',
        contentBody,
        keyTerms: keyTerms.split(',').map((t) => t.trim()).filter(Boolean),
        attachedPdfName,
      };

      const res = await fetch('/api/lesson-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        onSuccess(data.data);
        onClose();
      } else {
        setErrorMsg(data.message || 'Failed to upload lesson note.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Network error uploading lesson note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const classOptions: ClassLevel[] = [
    'KG 1', 'KG 2', 'KG 3',
    'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
    'JSS 1', 'JSS 2', 'JSS 3',
    'SSS 1 Science', 'SSS 1 Arts', 'SSS 1 Commercial',
    'SSS 2 Science', 'SSS 2 Arts', 'SSS 2 Commercial',
    'SSS 3 Science', 'SSS 3 Arts', 'SSS 3 Commercial',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600/30 p-2 text-blue-400 border border-blue-500/40">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Teacher / Administrator Lesson Note Upload
              </h3>
              <p className="text-xs text-slate-400">
                Upload teacher-approved notes to the class platform for instant parent PDF download.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800/80 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-slate-800 bg-white">
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Optional File Attachment Drag Zone */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:bg-slate-100 transition">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="lesson-file-input"
            />
            <label htmlFor="lesson-file-input" className="cursor-pointer block space-y-1">
              <UploadCloud className="h-8 w-8 text-blue-600 mx-auto" />
              <div className="text-xs font-bold text-slate-700">
                {attachedPdfName ? (
                  <span className="text-emerald-700 font-extrabold">Attached: {attachedPdfName}</span>
                ) : (
                  <span>Click to attach pre-formatted PDF document or fill the lesson plan below</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">Supports PDF, DOCX (Max 25MB)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Class Level *</label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {classOptions.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Subject Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Basic Science, Physics, Phonics"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Academic Week & Term *</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value as Term)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Lesson Topic *</label>
              <input
                type="text"
                required
                placeholder="e.g. Addition of Fractions with Unlike Denominators"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Subject Teacher in Charge</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. Mrs. Grace Iveren Shima"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Brief Parent Executive Summary</label>
            <input
              type="text"
              placeholder="e.g. Summary explaining core concepts taught during class for parent guidance."
              value={contentSummary}
              onChange={(e) => setContentSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Learning Objectives List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700">Learning Objectives for Students</label>
              <button
                type="button"
                onClick={handleAddObjective}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Objective</span>
              </button>
            </div>
            {learningObjectives.map((obj, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Objective ${idx + 1}...`}
                  value={obj}
                  onChange={(e) => handleUpdateObjective(idx, e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
                {learningObjectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Detailed Content Body */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Full Lesson Notes, Definitions, Examples & Steps *
            </label>
            <textarea
              required
              rows={8}
              placeholder={`1. INTRODUCTION:\nExplain the core concept here...\n\n2. WORKED EXAMPLES:\nStep-by-step solutions...\n\n3. SUMMARY & TAKEAWAYS:`}
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
              className="w-full font-mono rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Homework & Evaluation Questions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700">Homework & Parent Evaluation Tasks</label>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </button>
            </div>
            {evaluationQuestions.map((q, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Question ${idx + 1}...`}
                  value={q}
                  onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
                {evaluationQuestions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Key Vocabulary Terms (Comma separated)</label>
            <input
              type="text"
              value={keyTerms}
              onChange={(e) => setKeyTerms(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4" />
              <span>{isSubmitting ? 'Publishing Note...' : 'Publish PDF Note to Class Platform'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
