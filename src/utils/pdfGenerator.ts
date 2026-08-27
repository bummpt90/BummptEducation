import { jsPDF } from 'jspdf';
import { LessonNote } from '../types';

/**
 * Generates an authentic, high-resolution BummptEducation Lesson Note PDF document
 * with institutional branding, structured sections, and download trigger.
 */
export function generateLessonNotePDF(note: LessonNote): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = 14;

  // 1. Decorative Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 22, 'F');

  // School Emblem / Title text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BUMMPTEDUCATION OFFICIAL LESSON REPOSITORY', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(190, 215, 255);
  doc.text(
    'By Bummptech Global Concepts • Multi-Arm Academic & Digital Learning Network',
    margin + 6,
    y + 14
  );
  doc.text(
    'Akperan Orshi Avenue, Makurdi, Benue State • Hotline: +234 811 523 1834',
    margin + 6,
    y + 18.5
  );

  // Status Stamp on Right Header
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(pageWidth - margin - 36, y + 4, 30, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('VERIFIED NOTE', pageWidth - margin - 34, y + 10);
  doc.setFontSize(7);
  doc.text('WEEK ' + note.weekNumber + ' • ' + note.term, pageWidth - margin - 34, y + 15);

  y += 27;

  // 2. Class & Subject Metadata Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`SUBJECT: ${note.subjectName.toUpperCase()}`, margin + 4, y + 6);
  doc.text(`CLASS: ${note.classLevel} (${note.arm.toUpperCase()} ARM)`, margin + 4, y + 12);
  doc.text(`TEACHER: ${note.teacherName}`, margin + 4, y + 18);
  doc.text(`DATE UPLOADED: ${note.uploadedAt}`, margin + 4, y + 23);

  doc.text(`ACADEMIC SESSION: ${note.academicYear}`, margin + (contentWidth / 2) + 2, y + 6);
  doc.text(`TERM: ${note.term}`, margin + (contentWidth / 2) + 2, y + 12);
  doc.text(`WEEK NUMBER: Week ${note.weekNumber}`, margin + (contentWidth / 2) + 2, y + 18);
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text(`STATUS: ${note.status.toUpperCase()} FOR PARENTS`, margin + (contentWidth / 2) + 2, y + 23);

  y += 31;

  // 3. Topic Header Box
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(49, 46, 129); // indigo-900
  const topicLines = doc.splitTextToSize(`TOPIC: ${note.topic}`, contentWidth - 8);
  doc.text(topicLines, margin + 4, y + 6);

  y += 18;

  // Helper function for adding page if space runs out
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      y = margin;
      // Add mini sub-header on extra pages
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`BummptEducation • ${note.subjectName} (${note.classLevel}) - Week ${note.weekNumber} Note (Contd.)`, margin + 4, y + 5.5);
      y += 12;
    }
  };

  // 4. Learning Objectives
  if (note.learningObjectives && note.learningObjectives.length > 0) {
    checkPageBreak(30);
    doc.setFillColor(240, 253, 244); // green-50
    doc.setDrawColor(187, 247, 208); // green-200
    doc.roundedRect(margin, y, contentWidth, 6 + (note.learningObjectives.length * 6), 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52); // green-800
    doc.text('BEHAVIORAL LEARNING OBJECTIVES:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(20, 83, 45);
    note.learningObjectives.forEach((obj, idx) => {
      const objLines = doc.splitTextToSize(`• [Obj ${idx + 1}] ${obj}`, contentWidth - 10);
      doc.text(objLines, margin + 6, y + 10 + (idx * 5.5));
    });

    y += 10 + (note.learningObjectives.length * 5.5) + 4;
  }

  // 5. Lesson Summary
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE LESSON SUMMARY:', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(note.contentSummary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += (summaryLines.length * 4.5) + 4;

  // 6. Detailed Lesson Body Content
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DETAILED LESSON NOTES & EXPLANATIONS:', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  // Split content body into lines and render with auto-pagination
  const bodyParagraphs = note.contentBody.split('\n');
  bodyParagraphs.forEach((paragraph) => {
    if (!paragraph.trim()) {
      y += 2.5;
      return;
    }
    
    // Check if it looks like a section header (e.g. "1. INTRODUCTION", "A)")
    const isSectionHeader = /^[0-9A-Z]+\.\s+[A-Z\s]+/.test(paragraph.trim());
    
    if (isSectionHeader) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 138); // blue-900
      const headerLines = doc.splitTextToSize(paragraph, contentWidth);
      doc.text(headerLines, margin, y);
      y += (headerLines.length * 4.5) + 1;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
    } else {
      const pLines = doc.splitTextToSize(paragraph, contentWidth);
      checkPageBreak(pLines.length * 4.2);
      doc.text(pLines, margin, y);
      y += (pLines.length * 4.2);
    }
  });

  y += 4;

  // 7. Homework & Evaluation Questions
  if (note.evaluationQuestions && note.evaluationQuestions.length > 0) {
    checkPageBreak(35 + (note.evaluationQuestions.length * 7));
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(254, 202, 202); // red-200
    doc.roundedRect(margin, y, contentWidth, 8 + (note.evaluationQuestions.length * 6.5), 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(153, 27, 27); // red-800
    doc.text('EVALUATION QUESTIONS & HOMEWORK TASKS (FOR PARENTS TO SUPERVISE):', margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(127, 29, 29);
    note.evaluationQuestions.forEach((q, idx) => {
      const qLines = doc.splitTextToSize(`${q}`, contentWidth - 10);
      doc.text(qLines, margin + 6, y + 11 + (idx * 6));
    });

    y += 11 + (note.evaluationQuestions.length * 6) + 6;
  }

  // 8. Signoff & Authentication Seal
  checkPageBreak(26);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This official lesson note is digitally issued by BummptEducation for parent study supervision and student home revision.',
    margin,
    y
  );
  doc.text(
    'Parent Inquiries & Feedback: Call +234 811 523 1834 | Email: bummpt90@gmail.com',
    margin,
    y + 4
  );

  // General Administrator Endorsement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Academic Verification Desk: Dr. Matthew Ternenge Beeun (General Administrator)', margin, y + 9);

  return doc;
}

/**
 * Downloads the generated PDF to the user's browser with correct filename.
 */
export function downloadLessonNoteAsPDF(note: LessonNote) {
  const doc = generateLessonNotePDF(note);
  doc.save(note.pdfFileName || `${note.subjectName}_${note.classLevel}_Week${note.weekNumber}.pdf`);
}

/**
 * Returns a Blob URL for instant iframe preview
 */
export function getLessonNotePDFBlobUrl(note: LessonNote): string {
  const doc = generateLessonNotePDF(note);
  return doc.output('bloburl').toString();
}
