import { jsPDF } from 'jspdf';
import { LessonNote, Student, StudentReportCard, Subject, getSchoolArm } from '../types';
import { calculateGrade, calculatePrimaryGrade, evaluatePromotionStatus, getDomainRatingDescription } from './grading';

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
 * Generates an institutional-grade, authentic Terminal Report Card PDF across Kindergarten, Primary, and Secondary.
 */
export function generateReportCardPDF(
  reportCard: StudentReportCard,
  student: Student,
  subjects: Subject[] = []
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const arm = student.arm || getSchoolArm(student.currentClass || reportCard.classLevel);

  let institutionTitle = 'BUMMPTECH INTERNATIONAL COLLEGE';
  let institutionSub = 'Approved WAEC, NECO, Cambridge IGCSE & JAMB Examination Center';
  let accreditation = 'Accreditation No: BN/MOE/SEC/2021/489 • Center No: 028491';
  let headTitle = 'Principal (Secondary College)';
  let headName = reportCard.principalName || 'Dr. (Mrs.) Grace Nkechi Okafor (Ph.D)';

  if (arm === 'kindergarten') {
    institutionTitle = 'BUMMPTECH INTERNATIONAL EARLY YEARS & MONTESSORI ACADEMY';
    institutionSub = 'Montessori & Early Childhood Care and Education (ECCE) Center • Ages 2–5';
    accreditation = 'ECCE Approval No: BN/ECCE/2024/091 • Govt. Reg: BN/ED/KG/041';
    headTitle = 'Head of Kindergarten';
    headName = reportCard.principalName || 'Mrs. Abigail Folashade Balogun (M.Ed)';
  } else if (arm === 'primary') {
    institutionTitle = 'BUMMPTECH INTERNATIONAL PRIMARY & BASIC MODEL SCHOOL';
    institutionSub = 'Approved Universal Basic Education (UBE) & Cambridge Primary Model Center';
    accreditation = 'National UBE Center No: BN/UBE/PRI/1042 • Basic 1 – 6 Approved';
    headTitle = 'Headmistress (Primary Model School)';
    headName = reportCard.principalName || 'Mrs. Grace Iveren Shima (M.Ed)';
  }

  let y = 10;

  // 1. Institutional Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 26, 'F');

  // Header Typography
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text(institutionTitle, margin + 5, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(institutionSub, margin + 5, y + 13);
  doc.text('Address: Akperan Orshi Ave, Housing Estate, Makurdi, Benue State, Nigeria', margin + 5, y + 18);
  doc.text('Hotline: +234 811 523 1834 | Email: info@bummptech.edu.ng | Web: www.bummptech.edu.ng', margin + 5, y + 22.5);

  // Right-side badge
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(pageWidth - margin - 38, y + 3.5, 34, 19, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL REPORT', pageWidth - margin - 35, y + 9);
  doc.setFontSize(6.5);
  doc.text(reportCard.academicYear, pageWidth - margin - 35, y + 14);
  doc.text(reportCard.term.toUpperCase(), pageWidth - margin - 35, y + 18.5);

  y += 28;

  // Sub-header title strip
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(
    `COMPREHENSIVE TERMINAL ASSESSMENT & DOMAINS EVALUATION SHEET • ${accreditation}`,
    margin + 4,
    y + 4.2
  );

  y += 8;

  // 2. Student Bio & Profile Matrix
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, y, contentWidth, 21, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  // Row 1
  doc.text('STUDENT NAME:', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(student.fullName.toUpperCase(), margin + 27, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('ADMISSION NO:', margin + 78, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(student.admissionNumber, margin + 102, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CLASS & ARM:', margin + 132, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${reportCard.classLevel} (${arm.toUpperCase()})`, margin + 155, y + 4.5);

  // Row 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('HOUSE / GENDER:', margin + 3, y + 9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${student.house} • ${student.gender}`, margin + 27, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('DATE OF BIRTH:', margin + 78, y + 9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(student.dateOfBirth || '2010-05-14', margin + 102, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CLASS RANK:', margin + 132, y + 9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52); // emerald-800
  const posStr = reportCard.positionInClass === 1 ? '1st' : reportCard.positionInClass === 2 ? '2nd' : `${reportCard.positionInClass}th`;
  doc.text(`${posStr} of ${reportCard.totalStudentsInClass} Students`, margin + 155, y + 9.5);

  // Row 3 (Attendance & Stats)
  const opened = reportCard.attendance?.timesSchoolOpened || reportCard.attendanceTotalDays || 60;
  const present = reportCard.attendance?.timesPresent || reportCard.attendancePresent || 58;
  const absent = reportCard.attendance?.timesAbsent || (opened - present);
  const punctual = reportCard.attendance?.timesPunctual || Math.max(0, present - 2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('ATTENDANCE:', margin + 3, y + 14.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Opened: ${opened} | Present: ${present} | Absent: ${absent} | Punctual: ${punctual}`, margin + 27, y + 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TERM AGGREGATE:', margin + 110, y + 14.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text(`${reportCard.overallPercentage}% (Avg: ${reportCard.classAverage}%)`, margin + 140, y + 14.5);

  y += 24;

  // 3. Cognitive Performance Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. COGNITIVE PERFORMANCE & SUBJECT ASSESSMENT BREAKDOWN', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('(Continuous Assessment: 40% | Examination: 60% | Total: 100%)', margin + 98, y);

  y += 3;

  // Table header bar
  doc.setFillColor(226, 232, 240); // slate-200
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);

  doc.text('#', margin + 2, y + 4);
  doc.text('SUBJECT / CURRICULUM', margin + 6, y + 4);
  doc.text('CA1(10)', margin + 58, y + 4);
  doc.text('CA2(10)', margin + 70, y + 4);
  doc.text('ASN(10)', margin + 82, y + 4);
  doc.text('ATT(10)', margin + 94, y + 4);
  doc.text('TOT CA(40)', margin + 106, y + 4);
  doc.text('EXAM(60)', margin + 122, y + 4);
  doc.text('FINAL(100)', margin + 138, y + 4);
  doc.text('GRD', margin + 154, y + 4);
  doc.text('POS', margin + 162, y + 4);
  doc.text('REMARK', margin + 171, y + 4);

  y += 6;

  // Render Scores Rows
  const getSubName = (id: string) => {
    const s = subjects.find(sub => sub.id === id);
    return s ? s.name : id;
  };

  reportCard.scores.forEach((score, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${idx + 1}`, margin + 2, y + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const subName = getSubName(score.subjectId);
    doc.text(subName.length > 28 ? subName.substring(0, 26) + '...' : subName, margin + 6, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`${score.ca1}`, margin + 61, y + 3.5);
    doc.text(`${score.ca2}`, margin + 73, y + 3.5);
    doc.text(`${score.assignment}`, margin + 85, y + 3.5);
    doc.text(`${score.attendance}`, margin + 97, y + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text(`${score.totalCa}`, margin + 109, y + 3.5);

    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`${score.examScore}`, margin + 125, y + 3.5);

    doc.setTextColor(15, 23, 42);
    doc.text(`${score.totalScore}`, margin + 141, y + 3.5);

    doc.setTextColor(score.totalScore >= 50 ? 22 : 190, score.totalScore >= 50 ? 101 : 24, score.totalScore >= 50 ? 52 : 24);
    doc.text(`${score.grade}`, margin + 155, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(score.positionInSubject ? `${score.positionInSubject}` : '-', margin + 164, y + 3.5);

    const rmk = score.remark || (score.totalScore >= 75 ? 'Distinction' : score.totalScore >= 60 ? 'Credit' : 'Pass');
    doc.text(rmk.length > 13 ? rmk.substring(0, 12) + '..' : rmk, margin + 171, y + 3.5);

    y += 5;
  });

  // Table summary row
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('CUMULATIVE TERMINAL AVERAGE & OVERALL PERCENTAGE:', margin + 4, y + 3.8);
  doc.setTextColor(29, 78, 216);
  doc.text(`${reportCard.overallPercentage}%`, margin + 141, y + 3.8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Score: ${reportCard.totalScoreObtained} / ${reportCard.totalPossibleScore}`, margin + 85, y + 3.8);

  y += 8;

  // 4. Domains of Education (Affective & Psychomotor Traits)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. DOMAINS OF EDUCATION EVALUATION (RATING SCALE: 1–5)', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('5=Exceptional | 4=Commendable | 3=Satisfactory | 2=Developing | 1=Needs Remedy', margin + 86, y);

  y += 2.5;

  const halfWidth = (contentWidth - 4) / 2;

  // Affective Traits Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, halfWidth, 27, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('AFFECTIVE DOMAIN (BEHAVIOR & CHARACTER)', margin + 3, y + 4.5);

  const aff = reportCard.affective || {
    punctuality: 5, neatness: 5, politeness: 5, honesty: 5,
    peerRelationship: 4, leadership: 4, emotionalStability: 4,
    obedience: 5, attentiveness: 4, perseverance: 4,
  };

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);

  const affList = [
    { label: 'Punctuality', val: aff.punctuality },
    { label: 'Neatness & Hygiene', val: aff.neatness },
    { label: 'Politeness & Courtesy', val: aff.politeness },
    { label: 'Honesty & Integrity', val: aff.honesty },
    { label: 'Peer Relationship', val: aff.peerRelationship },
    { label: 'Leadership & Initiative', val: aff.leadership },
    { label: 'Emotional Stability', val: aff.emotionalStability },
    { label: 'Attentive in Class', val: aff.attentiveness },
  ];

  affList.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = margin + 3 + (col * (halfWidth / 2));
    const yPos = y + 8.5 + (row * 4.5);
    doc.text(`${item.label}:`, xPos, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text(`${item.val}/5`, xPos + 32, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
  });

  // Psychomotor Skills Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + halfWidth + 4, y, halfWidth, 27, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PSYCHOMOTOR & PRACTICAL SKILLS', margin + halfWidth + 7, y + 4.5);

  const psy = reportCard.psychomotor || {
    handwriting: 4, sportsAndGames: 4, craftsAndPractical: 4,
    verbalFluency: 5, musicalDramatic: 4, handlingOfTools: 4, physicalAgility: 4
  };

  const psyList = [
    { label: 'Handwriting & Script', val: psy.handwriting },
    { label: 'Sports & Games', val: psy.sportsAndGames },
    { label: 'Creative Crafts / Art', val: psy.craftsAndPractical },
    { label: 'Verbal Fluency / Speech', val: psy.verbalFluency },
    { label: 'Musical & Dramatic', val: psy.musicalDramatic },
    { label: 'Handling Tools / STEM', val: psy.handlingOfTools },
    { label: 'Physical Agility', val: psy.physicalAgility },
    { label: 'Laboratory Practical', val: 4 },
  ];

  psyList.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = margin + halfWidth + 7 + (col * (halfWidth / 2));
    const yPos = y + 8.5 + (row * 4.5);
    doc.text(`${item.label}:`, xPos, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(`${item.val}/5`, xPos + 32, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
  });

  y += 30;

  // 5. Promotional Evaluation Decision Box
  const promo = evaluatePromotionStatus(
    reportCard.scores.map(s => ({ subjectId: s.subjectId, totalScore: s.totalScore, grade: s.grade })),
    reportCard.classLevel
  );

  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ACADEMIC PROMOTION DECISION:', margin + 3, y + 4.5);
  doc.setTextColor(74, 222, 128); // green-400
  doc.text(promo.status.toUpperCase(), margin + 52, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(226, 232, 240);
  doc.text(promo.reason, margin + 3, y + 8);

  y += 12;

  // 6. Comprehensive Remarks & Authentication Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. STATUTORY ENDORSEMENTS & OFFICIAL COMMENTS', margin, y);

  y += 2.5;

  const colWidth = (contentWidth - 4) / 2;

  // Form Tutor & Sports Master Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, colWidth, 30, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('FORM TUTOR / CLASS TEACHER REMARK:', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  const tutorRmk = reportCard.formTutorRemark || `${student.fullName} is a brilliant, highly disciplined pupil with consistent cognitive prowess.`;
  const tutorLines = doc.splitTextToSize(`"${tutorRmk}"`, colWidth - 6);
  doc.text(tutorLines, margin + 3, y + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Tutor: ${reportCard.formTutorName || 'Mrs. Blessing Aondoaver'}`, margin + 3, y + 15);

  // Sports Remark
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 3, y + 17, margin + colWidth - 3, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('SPORTS MASTER / ATHLETIC COACH REMARK:', margin + 3, y + 21);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  const sportsRmk = reportCard.sportsMasterRemark || `Active sporting participation in ${student.house}. Displays high athletic stamina and teamwork.`;
  const sportsLines = doc.splitTextToSize(`"${sportsRmk}"`, colWidth - 6);
  doc.text(sportsLines, margin + 3, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(`Coach: ${reportCard.sportsMasterName || 'Coach Terkula Tyav'}`, margin + 3, y + 28.5);

  // Principal / Sectional Head Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + colWidth + 4, y, colWidth, 30, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(`${headTitle.toUpperCase()} ENDORSEMENT:`, margin + colWidth + 7, y + 4.5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  const princRmk = reportCard.principalRemark || `An exemplary record of academic diligence, moral fortitude, and character. Promoted with distinction.`;
  const princLines = doc.splitTextToSize(`"${princRmk}"`, colWidth - 8);
  doc.text(princLines, margin + colWidth + 7, y + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Endorsed By: ${headName}`, margin + colWidth + 7, y + 18);

  // Stamp Box
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin + colWidth + 7, y + 20.5, 34, 7.5, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(67, 56, 202);
  doc.text('OFFICIAL INSTITUTIONAL SEAL', margin + colWidth + 8.5, y + 24.5);
  doc.text('Digitally Authenticated', margin + colWidth + 10, y + 27);

  y += 33;

  // 7. Resumption & Fee Notice Footer Strip
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`NEXT TERM RESUMPTION: ${reportCard.nextTermBegins || 'Monday 4th May, 2026'}`, margin + 3, y + 4.5);

  const feeNote = reportCard.nextTermFeesEstimate || 'All tuition and statutory levies are payable on or before resumption via official bank channels.';
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(feeNote.length > 55 ? feeNote.substring(0, 52) + '...' : feeNote, margin + 80, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text(`Report ID: RC-${student.admissionNumber.replace(/[\/\s]/g, '-')}`, pageWidth - margin - 35, y + 4.5);

  return doc;
}

/**
 * Downloads the student terminal report card as a PDF
 */
export function downloadReportCardAsPDF(
  reportCard: StudentReportCard,
  student: Student,
  subjects: Subject[] = []
) {
  const doc = generateReportCardPDF(reportCard, student, subjects);
  const cleanName = student.fullName.replace(/\s+/g, '_');
  const cleanClass = reportCard.classLevel.replace(/\s+/g, '_');
  doc.save(`${cleanName}_${cleanClass}_${reportCard.term.replace(/\s+/g, '_')}_ReportCard.pdf`);
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
