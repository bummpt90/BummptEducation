import React, { useState, useEffect } from 'react';
import { 
  LessonNote, 
  ClassLevel, 
  SchoolArm, 
  Term, 
  NavigationPage 
} from '../types';
import { INITIAL_LESSON_NOTES } from '../data/lessonNotesData';
import { LessonNoteViewerModal } from '../components/LessonNoteViewerModal';
import { UploadLessonNoteModal } from '../components/UploadLessonNoteModal';
import { downloadLessonNoteAsPDF } from '../utils/pdfGenerator';
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Filter, 
  UploadCloud, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  GraduationCap, 
  School, 
  Baby, 
  Calendar, 
  User, 
  ArrowUpDown, 
  Grid, 
  List, 
  Check, 
  MessageSquare,
  HelpCircle,
  Clock,
  ShieldCheck,
  Award,
  PhoneCall,
  RefreshCw,
  FolderDown
} from 'lucide-react';

interface LessonNotesPageProps {
  onNavigate: (page: NavigationPage) => void;
}

export const LessonNotesPage: React.FC<LessonNotesPageProps> = ({ onNavigate }) => {
  const [lessonNotes, setLessonNotes] = useState<LessonNote[]>(INITIAL_LESSON_NOTES);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArm, setSelectedArm] = useState<'All' | SchoolArm>('All');
  const [selectedClass, setSelectedClass] = useState<'All' | ClassLevel>('All');
  const [selectedTerm, setSelectedTerm] = useState<'All' | Term>('All');
  const [selectedWeek, setSelectedWeek] = useState<'All' | number>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [activeViewerNote, setActiveViewerNote] = useState<LessonNote | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Fetch from backend API
  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedArm !== 'All') params.append('arm', selectedArm);
      if (selectedClass !== 'All') params.append('classLevel', selectedClass);
      if (selectedTerm !== 'All') params.append('term', selectedTerm);
      if (selectedWeek !== 'All') params.append('week', selectedWeek.toString());
      if (selectedSubject !== 'All') params.append('subject', selectedSubject);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/lesson-notes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setLessonNotes(data.data);
        }
      }
    } catch (err) {
      console.log('Using local store fallback', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedArm, selectedClass, selectedTerm, selectedWeek, selectedSubject, searchQuery]);

  const handleDownload = (note: LessonNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadLessonNoteAsPDF(note);
    
    // Update local count & ping API
    setLessonNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, downloadCount: (n.downloadCount || 0) + 1 } : n))
    );

    setDownloadSuccessToast(`Downloaded: ${note.pdfFileName || note.topic}`);
    setTimeout(() => setDownloadSuccessToast(null), 3500);

    try {
      fetch(`/api/lesson-notes/${note.id}/increment-download`, { method: 'POST' }).catch(() => {});
    } catch {}
  };

  const handleOpenViewer = (note: LessonNote) => {
    setActiveViewerNote(note);
    setIsViewerOpen(true);
  };

  const handleUploadSuccess = (newNote: LessonNote) => {
    setLessonNotes((prev) => [newNote, ...prev]);
    setDownloadSuccessToast(`Successfully published: ${newNote.topic}`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  const handleBulkDownload = () => {
    if (filteredNotes.length === 0) return;
    filteredNotes.forEach((note, index) => {
      setTimeout(() => {
        downloadLessonNoteAsPDF(note);
      }, index * 400);
    });
    setDownloadSuccessToast(`Downloading ${filteredNotes.length} Lesson Notes as PDFs...`);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  // Filtered Notes
  const filteredNotes = lessonNotes.filter((note) => {
    if (selectedArm !== 'All' && note.arm !== selectedArm) return false;
    if (selectedClass !== 'All' && note.classLevel !== selectedClass) return false;
    if (selectedTerm !== 'All' && note.term !== selectedTerm) return false;
    if (selectedWeek !== 'All' && note.weekNumber !== selectedWeek) return false;
    if (selectedSubject !== 'All' && !note.subjectName.toLowerCase().includes(selectedSubject.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(q) ||
        note.topic.toLowerCase().includes(q) ||
        note.subjectName.toLowerCase().includes(q) ||
        note.teacherName.toLowerCase().includes(q) ||
        note.contentSummary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const subjectsList = Array.from(new Set(lessonNotes.map((n) => n.subjectName)));

  const classListByArm: Record<SchoolArm, ClassLevel[]> = {
    kindergarten: ['KG 1', 'KG 2', 'KG 3'],
    primary: ['Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6'],
    secondary: [
      'JSS 1', 'JSS 2', 'JSS 3',
      'SSS 1 Science', 'SSS 1 Arts', 'SSS 1 Commercial',
      'SSS 2 Science', 'SSS 2 Arts', 'SSS 2 Commercial',
      'SSS 3 Science', 'SSS 3 Arts', 'SSS 3 Commercial'
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Toast Notification */}
        {downloadSuccessToast && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-600 px-5 py-3 text-white text-xs font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{downloadSuccessToast}</span>
          </div>
        )}

        {/* 1. Header & Hero Section */}
        <div className="rounded-3xl bg-linear-to-r from-blue-900/50 via-slate-800 to-indigo-900/50 border border-blue-500/20 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/30 px-3.5 py-1 text-xs font-bold text-blue-300">
                <FileText className="h-3.5 w-3.5" />
                <span>BummptEducation E-Learning & Parent Download Portal</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Class Lesson Notes & PDF Repository
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Parents and guardians can download certified weekly lesson notes, worked examples, homework exercises, and curriculum guides uploaded directly by teachers for each class platform across Kindergarten, Primary, and Secondary college levels.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 text-xs sm:text-sm font-bold transition shadow-lg hover:shadow-blue-500/25 cursor-pointer"
                id="btn-upload-lesson-note"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload Lesson Note</span>
              </button>
              {filteredNotes.length > 0 && (
                <button
                  onClick={handleBulkDownload}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-3 text-xs sm:text-sm font-bold transition cursor-pointer"
                  title="Download all filtered lesson notes"
                >
                  <FolderDown className="h-4 w-4 text-emerald-400" />
                  <span>Download Pack ({filteredNotes.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-700/60 text-xs">
            <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/50">
              <span className="text-slate-400 block text-[11px] font-semibold">Total Published Notes</span>
              <span className="text-xl font-extrabold text-white">{lessonNotes.length} Modules</span>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/50">
              <span className="text-slate-400 block text-[11px] font-semibold">Active Class Platforms</span>
              <span className="text-xl font-extrabold text-blue-400">KG 1 to SSS 3</span>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/50">
              <span className="text-slate-400 block text-[11px] font-semibold">Total Parent Downloads</span>
              <span className="text-xl font-extrabold text-emerald-400">
                {lessonNotes.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0)} Copies
              </span>
            </div>
            <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/50">
              <span className="text-slate-400 block text-[11px] font-semibold">Accreditation Standard</span>
              <span className="text-xl font-extrabold text-amber-400">UBE & NERDC</span>
            </div>
          </div>
        </div>

        {/* 2. Arm Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => { setSelectedArm('All'); setSelectedClass('All'); }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer border ${
              selectedArm === 'All'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>All School Wings ({lessonNotes.length})</span>
          </button>

          <button
            onClick={() => { setSelectedArm('kindergarten'); setSelectedClass('All'); }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer border ${
              selectedArm === 'kindergarten'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Baby className="h-4 w-4 text-amber-300" />
            <span>Kindergarten & Early Years (KG 1-3)</span>
          </button>

          <button
            onClick={() => { setSelectedArm('primary'); setSelectedClass('All'); }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer border ${
              selectedArm === 'primary'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="h-4 w-4 text-emerald-300" />
            <span>Primary School (Basic 1-6)</span>
          </button>

          <button
            onClick={() => { setSelectedArm('secondary'); setSelectedClass('All'); }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer border ${
              selectedArm === 'secondary'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <School className="h-4 w-4 text-indigo-300" />
            <span>Secondary College (JSS 1 - SSS 3)</span>
          </button>
        </div>

        {/* 3. Search & Interactive Filter Controls Panel */}
        <div className="rounded-2xl bg-slate-800/70 border border-slate-700/80 p-4 sm:p-5 space-y-4 shadow-lg">
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by topic, subject (Physics, Math, Phonics), keyword, or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={fetchNotes}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                title="Refresh notes list"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Specific Class Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Class Level
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as any)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="All">All Class Levels</option>
                {selectedArm !== 'All' ? (
                  classListByArm[selectedArm].map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))
                ) : (
                  Object.values(classListByArm).flat().map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))
                )}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="All">All Subjects</option>
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Term Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Academic Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value as any)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="All">All Terms</option>
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>

            {/* Week Filter */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Academic Week
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="All">All Weeks (1-12)</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. Lesson Notes Content Listing */}
        {filteredNotes.length === 0 ? (
          <div className="rounded-3xl bg-slate-800/40 border border-slate-700/60 p-12 text-center space-y-4">
            <BookOpen className="h-12 w-12 text-slate-500 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-white">No Lesson Notes Found</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              No lesson notes match your current filters. Try changing the class level, term, or search query.
            </p>
            <button
              onClick={() => {
                setSelectedArm('All');
                setSelectedClass('All');
                setSelectedTerm('All');
                setSelectedWeek('All');
                setSelectedSubject('All');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => {
              const armTheme = 
                note.arm === 'kindergarten'
                  ? 'border-amber-500/30 hover:border-amber-400'
                  : note.arm === 'primary'
                  ? 'border-emerald-500/30 hover:border-emerald-400'
                  : 'border-blue-500/30 hover:border-blue-400';

              const badgeColor =
                note.arm === 'kindergarten'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : note.arm === 'primary'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

              return (
                <div
                  key={note.id}
                  className={`flex flex-col justify-between rounded-3xl bg-slate-800/80 border ${armTheme} p-6 shadow-xl hover:shadow-2xl transition duration-200 group relative`}
                >
                  <div className="space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-xl px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border ${badgeColor}`}>
                        {note.classLevel}
                      </span>
                      <span className="rounded-xl bg-slate-900/90 border border-slate-700 px-2.5 py-1 text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-blue-400" />
                        <span>Week {note.weekNumber} • {note.term}</span>
                      </span>
                    </div>

                    {/* Subject & Topic */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                        {note.subjectName}
                      </div>
                      <h3 className="text-base font-extrabold text-white group-hover:text-blue-300 transition line-clamp-2 leading-snug">
                        {note.topic}
                      </h3>
                    </div>

                    {/* Content Summary */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {note.contentSummary}
                    </p>

                    {/* Learning Objectives Snapshot */}
                    {note.learningObjectives && note.learningObjectives.length > 0 && (
                      <div className="space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50 text-[11px]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Key Learning Objective:
                        </span>
                        <p className="text-slate-200 font-medium line-clamp-1">
                          ✓ {note.learningObjectives[0]}
                        </p>
                      </div>
                    )}

                    {/* Teacher in Charge */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-[10px] font-bold text-blue-300">
                          {note.teacherName.charAt(0)}
                        </div>
                        <span className="text-[11px] font-medium text-slate-300 line-clamp-1">
                          {note.teacherName}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {note.downloadCount || 0} downloads
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-700/60">
                    <button
                      onClick={() => handleOpenViewer(note)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 px-3 py-2 text-xs font-bold transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-400" />
                      <span>Preview & Study</span>
                    </button>
                    <button
                      onClick={(e) => handleDownload(note, e)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        ) : (
          
          /* COMPACT TABLE VIEW */
          <div className="rounded-3xl bg-slate-800/80 border border-slate-700/80 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="px-5 py-4">Class & Arm</th>
                    <th className="px-5 py-4">Subject</th>
                    <th className="px-5 py-4">Topic / Module</th>
                    <th className="px-5 py-4">Week & Term</th>
                    <th className="px-5 py-4">Teacher</th>
                    <th className="px-5 py-4 text-center">Size</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-200">
                  {filteredNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-slate-700/40 transition">
                      <td className="px-5 py-4 font-bold text-white">
                        <span className="rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 text-[10px]">
                          {note.classLevel}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-blue-400">{note.subjectName}</td>
                      <td className="px-5 py-4 font-bold text-slate-100 max-w-xs truncate">{note.topic}</td>
                      <td className="px-5 py-4 text-slate-300 whitespace-nowrap">Week {note.weekNumber} • {note.term}</td>
                      <td className="px-5 py-4 text-slate-300 whitespace-nowrap">{note.teacherName}</td>
                      <td className="px-5 py-4 text-center text-slate-400 text-[11px]">{note.pdfFileSize}</td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenViewer(note)}
                            className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 transition cursor-pointer"
                            title="Preview Note"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDownload(note, e)}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Parent Guide & Study Support Footer Card */}
        <div className="rounded-3xl bg-linear-to-r from-slate-800 to-slate-900 border border-slate-700/80 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <ShieldCheck className="h-5 w-5" />
              <span>Certified Weekly Curriculum</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every lesson note is structured in accordance with NERDC, Universal Basic Education (UBE), and WAEC standards, complete with behavioral objectives and worked solutions.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Award className="h-5 w-5" />
              <span>Parent Supervision Exercises</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Each module includes formative evaluation questions and homework tasks enabling parents to measure comprehension and guide home revisions effectively.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <PhoneCall className="h-5 w-5" />
              <span>Academic Inquiries Desk</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Need syllabus clarifications or custom tutoring assistance? Contact our curriculum office at <strong>+234 811 523 1834</strong> or email <strong>bummpt90@gmail.com</strong>.
            </p>
          </div>
        </div>

      </div>

      {/* Interactive Modals */}
      <LessonNoteViewerModal
        note={activeViewerNote}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />

      <UploadLessonNoteModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};
