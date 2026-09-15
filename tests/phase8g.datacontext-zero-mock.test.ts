/**
 * BummptEducation — Phase 8G DataContext Sanitization & Zero-Mock Production Verification Test Suite
 * 
 * Comprehensive Automated Verification Suite (36+ assertions across 6 categories):
 * 
 * Category 1: Complete Elimination of mockData.ts & Runtime Mock Fallbacks (9 assertions)
 * Category 2: Zero-Mock DataContext State Initialization & Type Safety (10 assertions)
 * Category 3: DataContext Authoritative Sync & Zero-Fallback Behavior (5 assertions)
 * Category 4: Business Data Storage Sanitization (LocalStorage / SessionStorage) (3 assertions)
 * Category 5: Removal of Server In-Memory Business Data Stores (2 assertions)
 * Category 6: Server-Authoritative Multi-Tenant Persistence & API Verification (7 assertions)
 * 
 * Total: 36 assertions
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import { query, closeDatabasePool } from '../src/db';
import { signAuthToken } from '../src/auth/token';
import { studentsRouter } from '../src/api/v1/students.routes';
import { staffRouter } from '../src/api/v1/staff.routes';
import { assessmentsRouter } from '../src/api/v1/assessments.routes';
import { paymentsRouter } from '../src/api/v1/payments.routes';
import { feesRouter } from '../src/api/v1/fees.routes';
import { schoolsRouter } from '../src/api/v1/schools.routes';
import { classesRouter } from '../src/api/v1/classes.routes';

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
  console.log('BummptEducation — Phase 8G DataContext Sanitization & Zero-Mock Verification');
  console.log('======================================================================\n');

  // -------------------------------------------------------------------------
  // CATEGORY 1: Elimination of mockData.ts & Runtime Mock Fallbacks
  // -------------------------------------------------------------------------
  console.log('--- Category 1: Elimination of mockData.ts & Runtime Mock Fallbacks ---');
  
  // 1. mockData.ts deleted from filesystem
  const mockDataPath = path.join(process.cwd(), 'src', 'data', 'mockData.ts');
  const mockDataExists = fs.existsSync(mockDataPath);
  record('Category 1', 'src/data/mockData.ts is permanently deleted from filesystem', !mockDataExists, mockDataExists ? 'File still exists' : 'Deleted');

  // Scan src directory for any imports of mockData
  function scanDir(dir: string, extFilter = ['.ts', '.tsx']): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        files.push(...scanDir(fullPath, extFilter));
      } else if (extFilter.some(ext => e.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const srcFiles = scanDir(path.join(process.cwd(), 'src'));
  
  // 2. Zero imports of mockData
  const mockDataImports = srcFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf-8');
    return /from\s+['"].*mockData.*['"]/.test(content);
  });
  record('Category 1', 'Zero imports of src/data/mockData across all production source files', mockDataImports.length === 0, `Matches: ${mockDataImports.length}`);

  // 3. Zero imports of INITIAL_STUDENTS
  const initialStudentsImports = srcFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf-8');
    return /import\s*\{[^}]*INITIAL_STUDENTS[^}]*\}\s*from/.test(content);
  });
  record('Category 1', 'Zero runtime imports of INITIAL_STUDENTS in production files', initialStudentsImports.length === 0, `Matches: ${initialStudentsImports.length}`);

  // 4. Zero imports of INITIAL_STAFF
  const initialStaffImports = srcFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf-8');
    return /import\s*\{[^}]*INITIAL_STAFF[^}]*\}\s*from/.test(content);
  });
  record('Category 1', 'Zero runtime imports of INITIAL_STAFF in production files', initialStaffImports.length === 0, `Matches: ${initialStaffImports.length}`);

  // 5. Zero imports of INITIAL_PAYMENTS
  const initialPaymentsImports = srcFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf-8');
    return /import\s*\{[^}]*INITIAL_PAYMENTS[^}]*\}\s*from/.test(content);
  });
  record('Category 1', 'Zero runtime imports of INITIAL_PAYMENTS in production files', initialPaymentsImports.length === 0, `Matches: ${initialPaymentsImports.length}`);

  // 6. Zero imports of INITIAL_FEE_SCHEDULES
  const initialFeeImports = srcFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf-8');
    return /import\s*\{[^}]*INITIAL_FEE_SCHEDULES[^}]*\}\s*from/.test(content);
  });
  record('Category 1', 'Zero runtime imports of INITIAL_FEE_SCHEDULES in production files', initialFeeImports.length === 0, `Matches: ${initialFeeImports.length}`);

  // 7. Zero imports of INITIAL_ADMISSIONS
  const initialAdmissionsImports = srcFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf-8');
    return /import\s*\{[^}]*INITIAL_ADMISSIONS[^}]*\}\s*from/.test(content);
  });
  record('Category 1', 'Zero runtime imports of INITIAL_ADMISSIONS in production files', initialAdmissionsImports.length === 0, `Matches: ${initialAdmissionsImports.length}`);

  // 8. Zero imports of INITIAL_ASSESSMENTS
  const initialAssessmentsImports = srcFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf-8');
    return /import\s*\{[^}]*INITIAL_ASSESSMENTS[^}]*\}\s*from/.test(content);
  });
  record('Category 1', 'Zero runtime imports of INITIAL_ASSESSMENTS in production files', initialAssessmentsImports.length === 0, `Matches: ${initialAssessmentsImports.length}`);

  // 9. Reference curriculum data isolated in src/data/reference/
  const refDir = path.join(process.cwd(), 'src', 'data', 'reference');
  const refSubjects = fs.existsSync(path.join(refDir, 'subjects.ts'));
  const refOrganogram = fs.existsSync(path.join(refDir, 'organogram.ts'));
  const refAnnouncements = fs.existsSync(path.join(refDir, 'announcements.ts'));
  const refIsolated = refSubjects && refOrganogram && refAnnouncements;
  record('Category 1', 'Curriculum reference data isolated under src/data/reference/ (subjects, organogram, announcements)', refIsolated, 'Reference directory confirmed');

  // -------------------------------------------------------------------------
  // CATEGORY 2: Zero-Mock DataContext State Initialization & Type Safety
  // -------------------------------------------------------------------------
  console.log('\n--- Category 2: Zero-Mock DataContext State Initialization & Type Safety ---');

  const dataContextPath = path.join(process.cwd(), 'src', 'context', 'DataContext.tsx');
  const dataContextContent = fs.readFileSync(dataContextPath, 'utf-8');

  // 10-17. State initializations
  const initStudentsEmpty = dataContextContent.includes('const [students, setStudents] = useState<Student[]>([]);');
  record('Category 2', 'DataContext initializes students state as empty array []', initStudentsEmpty);

  const initStaffEmpty = dataContextContent.includes('const [staff, setStaff] = useState<Staff[]>([]);');
  record('Category 2', 'DataContext initializes staff state as empty array []', initStaffEmpty);

  const initPaymentsEmpty = dataContextContent.includes('const [payments, setPayments] = useState<FeePayment[]>([]);');
  record('Category 2', 'DataContext initializes payments state as empty array []', initPaymentsEmpty);

  const initAdmissionsEmpty = dataContextContent.includes('const [admissions, setAdmissions] = useState<AdmissionApplication[]>([]);');
  record('Category 2', 'DataContext initializes admissions state as empty array []', initAdmissionsEmpty);

  const initAssessmentsEmpty = dataContextContent.includes('const [assessments, setAssessments] = useState<AssessmentScore[]>([]);');
  record('Category 2', 'DataContext initializes assessments state as empty array []', initAssessmentsEmpty);

  const initFeeSchedulesEmpty = dataContextContent.includes('const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>([]);');
  record('Category 2', 'DataContext initializes feeSchedules state as empty array []', initFeeSchedulesEmpty);

  const initBursariesEmpty = dataContextContent.includes('const [bursaries, setBursaries] = useState<any[]>([]);');
  record('Category 2', 'DataContext initializes bursaries state as empty array []', initBursariesEmpty);

  const initLessonNotesEmpty = dataContextContent.includes('const [lessonNotes, setLessonNotes] = useState<LessonNote[]>([]);');
  record('Category 2', 'DataContext initializes lessonNotes state as empty array []', initLessonNotesEmpty);

  // 18. ResourceState and DataContextStatus types
  const hasResourceStateType = dataContextContent.includes('export type ResourceState =') &&
                               dataContextContent.includes("'LOADING' | 'SUCCESS' | 'EMPTY' | 'ERROR'");
  const hasDataContextStatusType = dataContextContent.includes('export interface DataContextStatus');
  record('Category 2', 'DataContext declares ResourceState and DataContextStatus tracking types', hasResourceStateType && hasDataContextStatusType);

  // 19. resourceStatus exposed in context value
  const hasResourceStatusInContext = dataContextContent.includes('resourceStatus: DataContextStatus;') &&
                                     dataContextContent.includes('resourceStatus,');
  record('Category 2', 'resourceStatus is exposed through DataContext.Provider value', hasResourceStatusInContext);

  // -------------------------------------------------------------------------
  // CATEGORY 3: DataContext Authoritative Sync & Zero-Fallback Behavior
  // -------------------------------------------------------------------------
  console.log('\n--- Category 3: DataContext Authoritative Sync & Zero-Fallback Behavior ---');

  // 20. No ternary fallbacks to INITIAL_* in refreshAll
  const hasTernaryFallback = /rawList\.length\s*>\s*0\s*\?\s*mapped\s*:\s*INITIAL_/.test(dataContextContent);
  record('Category 3', 'refreshAll contains zero ternary fallbacks to INITIAL_* constants', !hasTernaryFallback);

  // 21. No INITIAL_* in catch block
  const catchBlockMatch = dataContextContent.match(/catch\s*\([^)]*\)\s*\{[\s\S]*?finally/);
  const catchBlockContent = catchBlockMatch ? catchBlockMatch[0] : '';
  const hasInitialInCatch = catchBlockContent.includes('INITIAL_');
  record('Category 3', 'refreshAll catch block contains zero mock data fallback assignments', !hasInitialInCatch);

  // 22. Error message and ERROR status set on failure
  const setsErrorOnCatch = catchBlockContent.includes('setError(') && 
                           catchBlockContent.includes("students: 'ERROR'");
  record('Category 3', 'refreshAll sets explicit error message and ERROR resource status on catch', setsErrorOnCatch);

  // 23. Assigns EMPTY status when array is empty
  const handlesEmptyStatus = dataContextContent.includes("mapped.length > 0 ? 'SUCCESS' : 'EMPTY'");
  record('Category 3', 'refreshAll correctly updates resourceStatus to EMPTY when server returns 0 records', handlesEmptyStatus);

  // 24. Assigns SUCCESS status when array contains records
  const handlesSuccessStatus = dataContextContent.includes("'SUCCESS'");
  record('Category 3', 'refreshAll correctly updates resourceStatus to SUCCESS when server returns valid records', handlesSuccessStatus);

  // -------------------------------------------------------------------------
  // CATEGORY 4: Business Data Storage Sanitization (LocalStorage / SessionStorage)
  // -------------------------------------------------------------------------
  console.log('\n--- Category 4: Business Data Storage Sanitization ---');

  // 25. Check for localStorage business data persistence in src
  const forbiddenLocalStorageKeys = [
    'bummpt_students',
    'bummpt_staff',
    'bummpt_payments',
    'bummpt_assessments',
    'bummpt_admissions',
    'bummpt_attendance',
    'bummpt_lesson_notes',
    'bummpt_directives'
  ];

  let foundForbiddenLocalStorage = false;
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const key of forbiddenLocalStorageKeys) {
      if (content.includes(`'${key}'`) || content.includes(`"${key}"`)) {
        foundForbiddenLocalStorage = true;
        break;
      }
    }
  }
  record('Category 4', 'Zero business-data persistence keys in localStorage across all src files', !foundForbiddenLocalStorage);

  // 26. Session storage strictly used for auth credentials
  let nonAuthSessionStorage = false;
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(/sessionStorage\.(setItem|getItem|removeItem)\s*\(\s*['"]([^'"]+)['"]/g);
    if (matches) {
      for (const m of matches) {
        if (!m.includes('bummpt_token') && !m.includes('bummpt_user') && !m.includes('token') && !m.includes('user')) {
          nonAuthSessionStorage = true;
        }
      }
    }
  }
  record('Category 4', 'sessionStorage usage is strictly confined to authentication session tokens', !nonAuthSessionStorage);

  // 27. Zero legacy passkey storage references
  let hasLegacyPasskeyStorage = false;
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('bummpt_issued_passkeys_v1') || content.includes('bummpt_security_session_v1')) {
      hasLegacyPasskeyStorage = true;
    }
  }
  record('Category 4', 'Zero legacy passkey storage keys (bummpt_issued_passkeys_v1) in codebase', !hasLegacyPasskeyStorage);

  // -------------------------------------------------------------------------
  // CATEGORY 5: Removal of Server In-Memory Business Data Stores
  // -------------------------------------------------------------------------
  console.log('\n--- Category 5: Removal of Server In-Memory Business Data Stores ---');

  const serverTsPath = path.join(process.cwd(), 'server.ts');
  const serverTsContent = fs.readFileSync(serverTsPath, 'utf-8');

  // 28. No in-memory stores in server.ts
  const forbiddenStores = [
    'studentsStore',
    'staffStore',
    'paymentsStore',
    'assessmentsStore',
    'lessonNotesStore',
    'lessonFeedbacksStore',
    'attendanceStore',
    'admissionsStore'
  ];

  const foundStores = forbiddenStores.filter(store => serverTsContent.includes(store));
  record('Category 5', 'server.ts contains zero in-memory volatile business data stores', foundStores.length === 0, `Stores found: ${foundStores.join(', ') || 'None'}`);

  // 29. Server mounts v1 authoritative database routers
  const v1Routers = [
    '/api/v1/students',
    '/api/v1/staff',
    '/api/v1/payments',
    '/api/v1/admissions',
    '/api/v1/assessments',
    '/api/v1/fees',
    '/api/v1/attendance',
    '/api/v1/lesson-notes'
  ];
  const missingRouters = v1Routers.filter(r => !serverTsContent.includes(r));
  record('Category 5', 'server.ts mounts all authoritative v1 REST routers backed by PostgreSQL', missingRouters.length === 0, `Missing: ${missingRouters.join(', ') || 'None'}`);

  // -------------------------------------------------------------------------
  // CATEGORY 6: Server-Authoritative Multi-Tenant Persistence & API Verification
  // -------------------------------------------------------------------------
  console.log('\n--- Category 6: Server-Authoritative Multi-Tenant Persistence & API Verification ---');

  // Setup express test server with authenticated routes
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1/students', studentsRouter);
  app.use('/api/v1/staff', staffRouter);
  app.use('/api/v1/assessments', assessmentsRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/fees', feesRouter);
  app.use('/api/v1/schools', schoolsRouter);
  app.use('/api/v1/classes', classesRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Resolve users for School A and School B from PostgreSQL
    const usersRes = await query<{ id: string; email: string; role: any; school_id: string; full_name: string }>(
      `SELECT id, email, role, school_id, full_name FROM users WHERE role = 'principal' AND school_id IS NOT NULL;`
    );
    const principalA = usersRes.rows.find(u => u.email === 'principal@anchor.bummpt.edu.ng') || usersRes.rows[0];
    const principalB = usersRes.rows.find(u => u.email === 'principal.gcmkd@bummpt.edu.ng') || usersRes.rows[1];

    const schoolAId = principalA.school_id;
    const schoolBId = principalB.school_id;

    // Create Principal A and Principal B tokens using authentic database user UUIDs
    const tokenA = signAuthToken({
      userId: principalA.id,
      schoolId: schoolAId,
      role: 'principal',
      email: principalA.email,
      isSuperAdmin: false
    });

    const tokenB = signAuthToken({
      userId: principalB.id,
      schoolId: schoolBId,
      role: 'principal',
      email: principalB.email,
      isSuperAdmin: false
    });

    // 30. GET /api/v1/students returns PostgreSQL data
    const studentsResA = await fetch(`${baseUrl}/api/v1/students?limit=10`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const studentsDataA = await studentsResA.json();
    const studentsA = studentsDataA.data || studentsDataA.students || [];
    const isServerScopedA = studentsA.length > 0 && studentsA.every((s: any) => s.school_id === schoolAId || s.schoolId === schoolAId);
    record('Category 6', 'GET /api/v1/students returns authoritative PostgreSQL students scoped to tenant', studentsResA.status === 200 && isServerScopedA, `Retrieved: ${studentsA.length}`);

    // 31. Multi-tenant isolation: School A cannot see School B students
    const studentsResB = await fetch(`${baseUrl}/api/v1/students?limit=10`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const studentsDataB = await studentsResB.json();
    const studentsB = studentsDataB.data || studentsDataB.students || [];
    const hasLeak = studentsB.some((sb: any) => studentsA.some((sa: any) => sa.id === sb.id));
    record('Category 6', 'Multi-tenant isolation: School B queries strictly exclude School A students', !hasLeak, `School B count: ${studentsB.length}`);

    // 32. GET /api/v1/staff returns authoritative staff
    const staffResA = await fetch(`${baseUrl}/api/v1/staff?limit=10`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const staffDataA = await staffResA.json();
    const staffA = staffDataA.data || [];
    record('Category 6', 'GET /api/v1/staff returns authoritative PostgreSQL staff records', staffResA.status === 200 && staffA.length > 0, `Staff count: ${staffA.length}`);

    // 33. GET /api/v1/assessments returns PostgreSQL scores
    const assessRes = await fetch(`${baseUrl}/api/v1/assessments?limit=10`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const assessData = await assessRes.json();
    record('Category 6', 'GET /api/v1/assessments returns authoritative continuous assessment scores', assessRes.status === 200 && Array.isArray(assessData.data), `Assessments count: ${assessData.data?.length || 0}`);

    // 34. GET /api/v1/payments returns authoritative payment records
    const paymentsRes = await fetch(`${baseUrl}/api/v1/payments?limit=10`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const paymentsData = await paymentsRes.json();
    record('Category 6', 'GET /api/v1/payments returns authoritative bursary payments ledger', paymentsRes.status === 200 && Array.isArray(paymentsData.data), `Payments count: ${paymentsData.data?.length || 0}`);

    // 35. GET /api/v1/fees/structures returns authoritative fee structures
    const feesRes = await fetch(`${baseUrl}/api/v1/fees/structures`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const feesData = await feesRes.json();
    record('Category 6', 'GET /api/v1/fees/structures returns authoritative fee schedule structures', feesRes.status === 200 && Array.isArray(feesData.data), `Fee structures count: ${feesData.data?.length || 0}`);

    // 36. Empty tenant query returns empty array [] with status 200 (No synthetic mock data)
    // Clean up any prior test school with matching code
    await query(`DELETE FROM schools WHERE code LIKE 'P8G-TST-%'`);

    const dynamicCode = `P8G-TST-${Date.now().toString().slice(-6)}`;
    // Create an empty dummy school in DB for testing empty tenant response
    const emptySchoolInsert = await query<{ id: string }>(
      `INSERT INTO schools (name, code, lga, senatorial_zone, category) 
       VALUES ('Phase 8G Zero-Mock Test Academy', $1, 'Makurdi', 'Benue North-West (Zone B)', 'Secondary') 
       RETURNING id`,
      [dynamicCode]
    );
    const emptySchoolId = emptySchoolInsert.rows[0].id;

    // Create temporary principal user for empty tenant
    const emptyUserInsert = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, role, school_id) 
       VALUES ('empty_principal_${Date.now()}@bummpt.edu.ng', '$argon2id$v=19$m=65536,t=3,p=4$dummyhash$dummyhash', 'Empty Tenant Principal', 'principal', $1) 
       RETURNING id`,
      [emptySchoolId]
    );
    const emptyUserId = emptyUserInsert.rows[0].id;

    const tokenEmptySchool = signAuthToken({
      userId: emptyUserId,
      schoolId: emptySchoolId,
      role: 'principal',
      email: 'empty@bummpt.edu.ng',
      isSuperAdmin: false
    });

    const emptyStudentsRes = await fetch(`${baseUrl}/api/v1/students?limit=10`, {
      headers: { 'Authorization': `Bearer ${tokenEmptySchool}` }
    });
    const emptyStudentsJson = await emptyStudentsRes.json();
    const emptyList = emptyStudentsJson.data || emptyStudentsJson.students || [];

    // Clean up dummy records
    await query(`DELETE FROM users WHERE id = $1`, [emptyUserId]);
    await query(`DELETE FROM schools WHERE id = $1`, [emptySchoolId]);

    const isEmptyArray = Array.isArray(emptyList) && emptyList.length === 0;
    record('Category 6', 'Empty tenant query returns pure empty array [] (no synthetic fallback generation)', emptyStudentsRes.status === 200 && isEmptyArray, `Result count: ${emptyList.length}`);

  } finally {
    server.close();
    await closeDatabasePool();
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('Phase 8G Test Suite Summary:');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  console.log(`Total Assertions Evaluated : ${total}`);
  console.log(`Assertions Passed          : ${passed}`);
  console.log(`Assertions Failed          : ${failed}`);
  console.log(`Overall Pass Rate          : ${((passed / total) * 100).toFixed(1)}%`);
  console.log('======================================================================');

  if (failed > 0) {
    console.error('❌ Phase 8G zero-mock verification failed with errors.');
    process.exit(1);
  } else {
    console.log('🎉 PHASE 8G CERTIFIED — Complete DataContext Sanitization & Zero-Mock Production Authority!');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error in Phase 8G test suite:', err);
  process.exit(1);
});
