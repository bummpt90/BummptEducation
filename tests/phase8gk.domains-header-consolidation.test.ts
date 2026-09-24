/**
 * BummptEducation — Phase 8G-K.1 Automated Verification Test Suite
 * 
 * Verifies:
 * 1. Authoritative Report-Card Data Integrity (Removal of all synthetic ratings, attendance, DOB, rank, and dates)
 * 2. Header Navigation Consolidation (Zero standalone duplicate Admissions or Report Cards deep links)
 * 3. Desktop Navigation Responsiveness (Nav container flex, min-w-0, and absence of horizontal overflow)
 * 4. Domains of Education Database & Grading Behavior (UUID vs natural ID lookup, zero-rating "Not Assessed" state)
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { query, closeDatabasePool } from '../src/db';
import { reportCardRepository } from '../src/db/repositories/reportCard.repository';
import { getDomainRatingDescription } from '../src/utils/grading';

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

async function runTestSuite() {
  console.log('======================================================================');
  console.log('BummptEducation — Phase 8G-K.1 Authoritative Report-Card & Header Verification');
  console.log('======================================================================\n');

  const reportCardModalPath = path.join(process.cwd(), 'src/components/ReportCardModal.tsx');
  const reportCardModalContent = fs.readFileSync(reportCardModalPath, 'utf-8');

  const pdfPath = path.join(process.cwd(), 'src/utils/pdfGenerator.ts');
  const pdfContent = fs.readFileSync(pdfPath, 'utf-8');

  const parentPortalModalPath = path.join(process.cwd(), 'src/components/ParentReportPortalModal.tsx');
  const parentPortalModalContent = fs.readFileSync(parentPortalModalPath, 'utf-8');

  const reportCardRepoPath = path.join(process.cwd(), 'src/db/repositories/reportCard.repository.ts');
  const reportCardRepoContent = fs.readFileSync(reportCardRepoPath, 'utf-8');

  const headerPath = path.join(process.cwd(), 'src/components/Header.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');

  const academicDashboardPath = path.join(process.cwd(), 'src/pages/AcademicDashboard.tsx');
  const academicDashboardContent = fs.readFileSync(academicDashboardPath, 'utf-8');

  // -------------------------------------------------------------------------
  // CATEGORY 1: Removal of Synthetic Business Data & Domain Ratings
  // -------------------------------------------------------------------------
  console.log('--- Category 1: Authoritative Report-Card Data Integrity ---');

  // 1. ReportCardModal contains no synthetic domain ratings (no || 5, || 4 in domain state initialization)
  const hasSyntheticDomainFallbacksInModal = /affective:\s*\{[^}]*\|\|\s*[45]/s.test(reportCardModalContent) ||
    /psychomotor:\s*\{[^}]*\|\|\s*[45]/s.test(reportCardModalContent);
  record(
    'Category 1',
    'ReportCardModal contains no synthetic domain ratings (no || 4 or || 5 fallbacks in domain fields)',
    !hasSyntheticDomainFallbacksInModal,
    hasSyntheticDomainFallbacksInModal ? 'Synthetic || 4 / || 5 found in ReportCardModal' : 'Clean authoritative domain mapping'
  );

  // 2. pdfGenerator contains no synthetic attendance fallbacks (no || 60, || 58)
  const hasSyntheticAttendanceInPdf = pdfContent.includes('|| 60') || pdfContent.includes('|| 58') || pdfContent.includes('opened = 60');
  record(
    'Category 1',
    'pdfGenerator contains no synthetic attendance (no || 60, || 58 or hardcoded 60 days)',
    !hasSyntheticAttendanceInPdf,
    hasSyntheticAttendanceInPdf ? 'Synthetic attendance numbers found in pdfGenerator' : 'Authoritative attendance only'
  );

  // 3. PDF contains no synthetic date of birth ('2010-05-14')
  const hasSyntheticDobInPdf = pdfContent.includes('2010-05-14');
  record(
    'Category 1',
    'pdfGenerator contains no synthetic date of birth (2010-05-14)',
    !hasSyntheticDobInPdf,
    hasSyntheticDobInPdf ? 'Synthetic DOB 2010-05-14 found in pdfGenerator' : 'Clean DOB logic'
  );

  // 4. ReportCardModal contains no synthetic date of birth ('2010-05-14')
  const hasSyntheticDobInModal = reportCardModalContent.includes('2010-05-14');
  record(
    'Category 1',
    'ReportCardModal contains no synthetic date of birth (2010-05-14)',
    !hasSyntheticDobInModal,
    hasSyntheticDobInModal ? 'Synthetic DOB 2010-05-14 found in ReportCardModal' : 'Authoritative/unrecorded DOB displayed'
  );

  // 5. ParentReportPortalModal contains no fabricated class population such as 38 or '1st out of 38'
  const hasFabricatedRankInParentPortal = parentPortalModalContent.includes('1st out of 38') ||
    parentPortalModalContent.includes('totalStudentsInClass || 38');
  record(
    'Category 1',
    'ParentReportPortalModal contains no fabricated class population (no "1st out of 38" or "|| 38")',
    !hasFabricatedRankInParentPortal,
    hasFabricatedRankInParentPortal ? 'Fabricated class rank/population found in ParentReportPortalModal' : 'Authoritative rank representation'
  );

  // 6. ReportCardModal & AcademicDashboard contain no hardcoded synthetic resumption dates ('Monday 4th May, 2026')
  const hasSyntheticResumptionDate = reportCardModalContent.includes('Monday 4th May, 2026') ||
    academicDashboardContent.includes('Monday 4th May, 2026') ||
    pdfContent.includes('Monday 4th May, 2026');
  record(
    'Category 1',
    'Production report-card files contain no synthetic resumption date ("Monday 4th May, 2026")',
    !hasSyntheticResumptionDate,
    hasSyntheticResumptionDate ? 'Hardcoded "Monday 4th May, 2026" found' : 'Unpublished/authoritative resumption date used'
  );

  // 7. reportCard.repository.ts does not fallback missing rank or population to 1
  const hasRankFallbackToOne = reportCardRepoContent.includes('positionInClass || 1') ||
    reportCardRepoContent.includes('academicResult.summary.classPosition || 1') ||
    reportCardRepoContent.includes('totalStudentsInClass || 1') ||
    reportCardRepoContent.includes('academicResult.summary.totalStudentsInClass || 1');
  record(
    'Category 1',
    'reportCard.repository.ts does not fallback missing rank or class population to 1',
    !hasRankFallbackToOne,
    hasRankFallbackToOne ? 'Found fallback to 1 in reportCard.repository.ts' : 'Rank and population preserve null/unranked state'
  );

  // 8. Focused test for zero/unrecorded domain traits (0 -> "Not Assessed", 1-5 -> mapped accurately)
  const traitZero = getDomainRatingDescription(0);
  const traitNull = getDomainRatingDescription(null as any);
  const traitUndefined = getDomainRatingDescription(undefined as any);
  const traitOne = getDomainRatingDescription(1);
  const traitFive = getDomainRatingDescription(5);

  const zeroHandledProperly = traitZero.label === 'Not Assessed' && traitZero.rating === 0;
  const nullHandledProperly = traitNull.label === 'Not Assessed' && traitNull.rating === 0;
  const undefinedHandledProperly = traitUndefined.label === 'Not Assessed' && traitUndefined.rating === 0;
  const oneHandledProperly = traitOne.rating === 1 && traitOne.label.includes('1/5');
  const fiveHandledProperly = traitFive.rating === 5 && traitFive.label.includes('5/5');

  const domainTraitsAccurate = zeroHandledProperly && nullHandledProperly && undefinedHandledProperly && oneHandledProperly && fiveHandledProperly;
  record(
    'Category 1',
    'Domain grading helper handles 0, null, undefined as "Not Assessed" without transforming to 4 or 5',
    domainTraitsAccurate,
    `0: "${traitZero.label}", 1: "${traitOne.label}", 5: "${traitFive.label}"`
  );

  // -------------------------------------------------------------------------
  // CATEGORY 2: Header Navigation Consolidation & Redundant Deep Link Removal
  // -------------------------------------------------------------------------
  console.log('\n--- Category 2: Header Navigation Consolidation ---');

  // 9. Header contains no standalone Admissions navigation item (id="nav-link-admissions" removed)
  const hasStandaloneAdmissionsBtn = headerContent.includes('id="nav-link-admissions"');
  record(
    'Category 2',
    'Header contains no standalone Admissions navigation item (id="nav-link-admissions" removed)',
    !hasStandaloneAdmissionsBtn,
    hasStandaloneAdmissionsBtn ? 'Found standalone nav-link-admissions in Header.tsx' : 'Redundant standalone link removed'
  );

  // 10. Header contains no standalone Report Cards navigation item (no standalone top-level button)
  const hasStandaloneReportCardsBtn = headerContent.includes('id="nav-link-reports"') ||
    headerContent.includes('id="nav-link-report-cards"');
  record(
    'Category 2',
    'Header contains no standalone Report Cards navigation item in top-level bar',
    !hasStandaloneReportCardsBtn,
    hasStandaloneReportCardsBtn ? 'Found standalone top-level Report Cards button' : 'No redundant top-level report card link'
  );

  // 11. Header still contains the legitimate Academic Wing -> Official Report Cards entry
  const hasAcademicWingReportCards = headerContent.includes("navigateTo('academic', 'reports')") &&
    headerContent.includes('Official Report Cards');
  record(
    'Category 2',
    'Header retains the legitimate Academic Wing -> Official Report Cards dropdown destination',
    hasAcademicWingReportCards,
    hasAcademicWingReportCards ? 'Academic Wing dropdown destination verified' : 'Official Report Cards missing from Academic Wing'
  );

  // 12. Header still contains Bursary & Admin -> Admissions functionality
  const hasAdminAdmissions = headerContent.includes("navigateTo('admin', 'admissions')") &&
    headerContent.includes('Bursary & Admin');
  record(
    'Category 2',
    'Header retains Bursary & Admin -> Admissions navigation capability',
    hasAdminAdmissions,
    hasAdminAdmissions ? 'Bursary & Admin -> Admissions route verified' : 'Admissions missing from Bursary & Admin'
  );

  // -------------------------------------------------------------------------
  // CATEGORY 3: Desktop Header Responsiveness Verification
  // -------------------------------------------------------------------------
  console.log('\n--- Category 3: Desktop Header Responsiveness ---');

  // 13. The responsive test specifically checks the desktop nav container rather than merely finding overflow-x-auto anywhere
  const desktopNavMatch = headerContent.match(/<nav\s+className="([^"]*hidden lg:flex[^"]*)"/);
  const desktopNavClasses = desktopNavMatch ? desktopNavMatch[1] : '';
  const desktopNavHasFlexShrinkOrMinW0 = desktopNavClasses.includes('min-w-0') ||
    desktopNavClasses.includes('flex-shrink') ||
    desktopNavClasses.includes('flex-wrap');

  const navbarContainerHasMinW0 = headerContent.includes('max-w-[1600px] mx-auto flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 min-w-0');

  const desktopResponsivenessSound = Boolean(desktopNavMatch && desktopNavHasFlexShrinkOrMinW0 && navbarContainerHasMinW0);
  record(
    'Category 3',
    'Desktop navigation container has robust responsive flex, shrink, and min-w-0 attributes',
    desktopResponsivenessSound,
    `Nav classes: "${desktopNavClasses}", Container has min-w-0: ${navbarContainerHasMinW0}`
  );

  // 14. Parent Portal CTA button is accessible on desktop
  const hasDesktopParentPortalBtn = headerContent.includes('id="header-desktop-parent-portal-btn"') &&
    headerContent.includes('Parent Portal');
  record(
    'Category 3',
    'Parent Portal CTA button remains prominently accessible on desktop navbar',
    hasDesktopParentPortalBtn,
    'Parent Portal CTA verified'
  );

  // 15. Mobile navigation continues to use the dedicated mobile drawer
  const hasMobileDrawer = headerContent.includes('id="mobile-nav-toggle"') &&
    headerContent.includes('mobileMenuOpen');
  record(
    'Category 3',
    'Mobile navigation continues using dedicated responsive drawer architecture',
    hasMobileDrawer,
    'Mobile drawer verified'
  );

  // -------------------------------------------------------------------------
  // CATEGORY 4: Database Repository Identifier Safety
  // -------------------------------------------------------------------------
  console.log('\n--- Category 4: Database Repository Identifier Safety ---');

  // 16. reportCardRepository uses correct students table columns (no last_name or passport_photo_url)
  const hasInvalidColumnRefs = reportCardRepoContent.includes('last_name') || reportCardRepoContent.includes('passport_photo_url');
  record(
    'Category 4',
    'reportCard.repository.ts contains zero invalid student column references',
    !hasInvalidColumnRefs,
    hasInvalidColumnRefs ? 'Invalid columns detected' : 'Clean column references verified'
  );

  // 17. Database query: getClassDomainAssessments with class string identifier
  let classDomainLookupWorked = false;
  let sampleClassResult: any = null;
  try {
    const classRow = await query<{ school_id: string; level: string }>(
      "SELECT school_id, level FROM classes WHERE level = 'SSS 2 Science' LIMIT 1;"
    );
    if (classRow.rows[0]) {
      sampleClassResult = await reportCardRepository.getClassDomainAssessments(
        classRow.rows[0].school_id,
        'SSS 2 Science'
      );
      classDomainLookupWorked = Boolean(sampleClassResult && sampleClassResult.classId);
    }
  } catch (err: any) {
    console.error('Error during getClassDomainAssessments test:', err);
  }
  record(
    'Category 4',
    'reportCardRepository.getClassDomainAssessments resolves non-UUID class identifiers cleanly',
    classDomainLookupWorked,
    sampleClassResult ? `Resolved class: ${sampleClassResult.className}` : 'Failed to query'
  );

  // 18. Database query: getStudentDomainAssessment with admission number
  let studentLookupWorked = false;
  try {
    const stuRes = await query<{ id: string; admission_number: string; school_id: string }>(
      'SELECT id, admission_number, school_id FROM students WHERE admission_number IS NOT NULL LIMIT 1;'
    );
    if (stuRes.rows[0]) {
      const res = await reportCardRepository.getStudentDomainAssessment(
        stuRes.rows[0].school_id,
        stuRes.rows[0].admission_number,
        'First Term'
      );
      studentLookupWorked = Boolean(res && res.studentId === stuRes.rows[0].id);
    }
  } catch (err: any) {
    console.error('Error during student domain assessment lookup:', err);
  }
  record(
    'Category 4',
    'reportCardRepository.getStudentDomainAssessment resolves non-UUID admission number cleanly',
    studentLookupWorked,
    'Admission number lookup successful'
  );

  // Cleanup DB pool
  await closeDatabasePool();

  // Summary
  console.log('\n======================================================================');
  console.log('Phase 8G-K.1 Test Suite Summary:');
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  console.log(`Total Assertions Evaluated : ${results.length}`);
  console.log(`Assertions Passed          : ${passed}`);
  console.log(`Assertions Failed          : ${failed}`);
  console.log(`Overall Pass Rate          : ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
