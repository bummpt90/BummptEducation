/**
 * BummptEducation — Phase 8G-K Automated Verification Test Suite
 * 
 * Verifies:
 * 1. Header Navigation Consolidation (Zero Duplication & Desktop Layout)
 * 2. Domains of Education Workflow Hardening (UUID vs Human Identifier Support, Database Schema Integrity)
 * 3. Report Card Modal & PDF Authoritative Integrity (Zero Synthetic Defaults, Dynamic Trait Aggregation)
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
  console.log('BummptEducation — Phase 8G-K Domains & Header Consolidation Verification');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // CATEGORY 1: Header Navigation Consolidation
  // -------------------------------------------------------------------------
  console.log('--- Category 1: Header Navigation Consolidation ---');

  const headerPath = path.join(process.cwd(), 'src/components/Header.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');

  // 1. Exactly one Report Cards button in navigation
  const reportCardsMatches = (headerContent.match(/Report Cards/g) || []).length;
  record(
    'Category 1',
    'Header.tsx has consolidated Report Cards button without duplication',
    reportCardsMatches === 1,
    `Occurrences in Header.tsx: ${reportCardsMatches}`
  );

  // 2. Exactly one Admissions link/button in navigation
  const admissionsBtnMatches = (headerContent.match(/>Admissions<\/span>/g) || []).length;
  record(
    'Category 1',
    'Header.tsx has consolidated Admissions button without duplication',
    admissionsBtnMatches === 1,
    `Occurrences in Header.tsx: ${admissionsBtnMatches}`
  );

  // 3. Desktop navigation layout has overflow-x-auto and no horizontal breaking
  const hasDesktopOverflowControl = headerContent.includes('overflow-x-auto') || headerContent.includes('min-w-0');
  record(
    'Category 1',
    'Desktop navigation has responsive overflow control',
    hasDesktopOverflowControl,
    'Responsive flex/overflow styles confirmed'
  );

  // 4. Mobile drawer navigation contains 3-column quick action grid
  const hasMobileGrid = headerContent.includes('grid grid-cols-3');
  record(
    'Category 1',
    'Mobile navigation uses structured 3-column grid without redundant items',
    hasMobileGrid,
    'Grid confirmed in mobile drawer'
  );

  // -------------------------------------------------------------------------
  // CATEGORY 2: Domains of Education Workflow Hardening & Identifier Safety
  // -------------------------------------------------------------------------
  console.log('\n--- Category 2: Domains Workflow Hardening & Identifier Safety ---');

  // 5. getDomainRatingDescription handles rating 0 as "Not Assessed"
  const zeroRating = getDomainRatingDescription(0);
  const handlesZeroCleanly = zeroRating.label === 'Not Assessed' && zeroRating.rating === 0;
  record(
    'Category 2',
    'getDomainRatingDescription gracefully handles unassessed trait (rating 0)',
    handlesZeroCleanly,
    `Rating 0 label: "${zeroRating.label}"`
  );

  // 6. getDomainRatingDescription handles valid ratings 1 to 5
  const validRatings = [1, 2, 3, 4, 5].every(num => {
    const r = getDomainRatingDescription(num);
    return r.rating === num && r.label.length > 0;
  });
  record(
    'Category 2',
    'getDomainRatingDescription maps standard 1-5 rating scale correctly',
    validRatings,
    'Scale 1-5 mapped'
  );

  // 7. Verify reportCard.repository.ts uses correct students table columns (no last_name)
  const repoPath = path.join(process.cwd(), 'src/db/repositories/reportCard.repository.ts');
  const repoContent = fs.readFileSync(repoPath, 'utf-8');
  const hasLastNameRef = repoContent.includes('last_name') || repoContent.includes('passport_photo_url');
  record(
    'Category 2',
    'reportCard.repository.ts contains zero invalid student column references (no last_name or passport_photo_url)',
    !hasLastNameRef,
    hasLastNameRef ? 'Invalid column references detected' : 'Clean column references'
  );

  // 8. Test getClassDomainAssessments with string class name (e.g., 'SSS 2 Science') against database
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
    'Category 2',
    'reportCardRepository.getClassDomainAssessments resolves non-UUID class identifiers without SQL syntax error',
    classDomainLookupWorked,
    sampleClassResult ? `Resolved class: ${sampleClassResult.className}` : 'Failed to query'
  );

  // 9. Test getClassDomainAssessments with actual class UUID
  let uuidClassLookupWorked = false;
  try {
    const clsRes = await query<{ id: string; school_id: string }>('SELECT id, school_id FROM classes LIMIT 1;');
    if (clsRes.rows[0]) {
      const res = await reportCardRepository.getClassDomainAssessments(
        clsRes.rows[0].school_id,
        clsRes.rows[0].id
      );
      uuidClassLookupWorked = Boolean(res && res.classId === clsRes.rows[0].id);
    }
  } catch (err: any) {
    console.error('Error during UUID class lookup:', err);
  }
  record(
    'Category 2',
    'reportCardRepository.getClassDomainAssessments resolves UUID class identifier properly',
    uuidClassLookupWorked,
    'UUID lookup successful'
  );

  // 10. Test getStudentDomainAssessment with admission number (non-UUID)
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
    'Category 2',
    'reportCardRepository.getStudentDomainAssessment resolves non-UUID admission number without SQL error',
    studentLookupWorked,
    'Admission number lookup successful'
  );

  // -------------------------------------------------------------------------
  // CATEGORY 3: Report Card Modal & PDF Authoritative Integrity
  // -------------------------------------------------------------------------
  console.log('\n--- Category 3: Report Card Modal & PDF Authoritative Integrity ---');

  const modalPath = path.join(process.cwd(), 'src/components/ReportCardModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  // 11. Zero duplicated attendance/rank blocks in ReportCardModal.tsx
  const rankCountInModal = (modalContent.match(/Class Rank/g) || []).length;
  record(
    'Category 3',
    'ReportCardModal.tsx contains exactly one Class Rank matrix entry (zero duplicated cards)',
    rankCountInModal === 1,
    `Class Rank count in modal: ${rankCountInModal}`
  );

  // 12. Zero synthetic principal / tutor names in ReportCardModal.tsx
  const forbiddenSyntheticNames = [
    'Grace Nkechi Okafor',
    'Abigail Folashade Balogun',
    'Grace Iveren Shima',
    'Blessing Aondoaver',
    'Terkula Tyav',
    'Comfort Agbo',
    'Moses Terfa Aondo',
    'Rita Iorfa'
  ];

  const foundModalSynthetic = forbiddenSyntheticNames.filter(n => modalContent.includes(n));
  record(
    'Category 3',
    'ReportCardModal.tsx contains zero synthetic default educator names',
    foundModalSynthetic.length === 0,
    foundModalSynthetic.length > 0 ? `Found: ${foundModalSynthetic.join(', ')}` : 'Zero synthetic names'
  );

  // 13. Zero synthetic educator names in pdfGenerator.ts
  const pdfPath = path.join(process.cwd(), 'src/utils/pdfGenerator.ts');
  const pdfContent = fs.readFileSync(pdfPath, 'utf-8');
  const foundPdfSynthetic = forbiddenSyntheticNames.filter(n => pdfContent.includes(n));
  record(
    'Category 3',
    'pdfGenerator.ts contains zero synthetic default educator names',
    foundPdfSynthetic.length === 0,
    foundPdfSynthetic.length > 0 ? `Found: ${foundPdfSynthetic.join(', ')}` : 'Zero synthetic names'
  );

  // 14. PDF domain traits default to empty / N/A rather than hardcoded 5s or 4s
  const hasHardcodedPdfDefaults = pdfContent.includes('punctuality: 5, neatness: 5');
  record(
    'Category 3',
    'pdfGenerator.ts affective traits use authoritative values without synthetic default 5s',
    !hasHardcodedPdfDefaults,
    hasHardcodedPdfDefaults ? 'Hardcoded trait ratings found' : 'Authoritative traits verified'
  );

  // 15. ReportCardModal dynamic domain averages
  const hasDynamicAverages = modalContent.includes('assessed = [') && modalContent.includes('Not assessed');
  record(
    'Category 3',
    'ReportCardModal calculates domain averages dynamically from recorded scores with Not Assessed indicator',
    hasDynamicAverages,
    'Dynamic domain average computation verified'
  );

  // Cleanup DB pool
  await closeDatabasePool();

  // Summary
  console.log('\n======================================================================');
  console.log('Phase 8G-K Test Suite Summary:');
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
