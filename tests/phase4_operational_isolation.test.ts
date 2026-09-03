/**
 * BummptEducation — Phase 4 Operational Data Foundation & Multi-Tenant Security Tests
 * 
 * Validates:
 * 1. Schools, Staff, and Student API endpoints
 * 2. Strict school-level multi-tenant isolation (School A vs. School B)
 * 3. Cross-school access rejection (viewing, updating, deleting across tenant boundaries)
 * 4. Cross-school class assignment rejection
 * 5. Unique constraints: staff ID per school, admission number per school
 * 6. Permitted duplicate admission numbers across different schools (institutional scoping)
 * 7. Server-authoritative role and permission enforcement
 * 8. Atomic student creation and longitudinal enrollment record generation
 */

import 'dotenv/config';
import { query, closeDatabasePool } from '../src/db';
import { signAuthToken } from '../src/auth/token';
import { DEV_DEFAULT_PASSWORD } from '../src/db/seed/auth.seed';
import { SchoolRepository } from '../src/db/repositories/school.repository';
import { StaffRepository } from '../src/db/repositories/staff.repository';
import { StudentRepository } from '../src/db/repositories/student.repository';
import { ClassRepository } from '../src/db/repositories/class.repository';
import { StudentEnrollmentRepository } from '../src/db/repositories/studentEnrollment.repository';

interface TestResult {
  test: string;
  status: 'PASSED' | 'FAILED';
  details?: string;
}

const results: TestResult[] = [];

function record(test: string, passed: boolean, details?: string) {
  results.push({
    test,
    status: passed ? 'PASSED' : 'FAILED',
    details,
  });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${passed ? 'PASS' : 'FAIL'}] ${test} ${details ? `(${details})` : ''}`);
}

async function runTests() {
  console.log('\n=================================================================');
  console.log('BummptEducation — Phase 4 Security & Operational Foundation Tests');
  console.log('=================================================================\n');

  try {
    const schoolRepo = new SchoolRepository();
    const staffRepo = new StaffRepository();
    const studentRepo = new StudentRepository();
    const classRepo = new ClassRepository();
    const enrollRepo = new StudentEnrollmentRepository();

    // 1. Fetch test tenants
    const schoolA = await schoolRepo.findByCode('BNS-MKD-000');
    const schoolB = await schoolRepo.findByCode('BNS-MKD-001');

    record('Resolve School A (Anchor) and School B (Govt College Makurdi)', Boolean(schoolA && schoolB), `A: ${schoolA?.id}, B: ${schoolB?.id}`);
    if (!schoolA || !schoolB) throw new Error('Reference schools missing.');

    // 2. Fetch users for token generation
    const usersRes = await query<{ id: string; email: string; role: any; school_id: string }>(
      `SELECT id, email, role, school_id FROM users;`
    );
    const userMap = new Map(usersRes.rows.map((u) => [u.email, u]));

    const superAdminUser = userMap.get('superadmin@bummpt.edu.ng')!;
    const principalAUser = userMap.get('principal@anchor.bummpt.edu.ng')!;
    const principalBUser = userMap.get('principal.gcmkd@bummpt.edu.ng')!;
    const teacherAUser = userMap.get('teacher@anchor.bummpt.edu.ng')!;
    const parentAUser = userMap.get('parent@anchor.bummpt.edu.ng')!;

    record('Resolve Authenticated Test Personas', Boolean(superAdminUser && principalAUser && principalBUser && teacherAUser), 'All 4 personas verified');

    // 3. Generate tokens
    const superAdminToken = signAuthToken({
      userId: superAdminUser.id,
      email: superAdminUser.email,
      role: superAdminUser.role,
      schoolId: null,
      isSuperAdmin: true,
    });

    const principalAToken = signAuthToken({
      userId: principalAUser.id,
      email: principalAUser.email,
      role: principalAUser.role,
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const principalBToken = signAuthToken({
      userId: principalBUser.id,
      email: principalBUser.email,
      role: principalBUser.role,
      schoolId: schoolB.id,
      isSuperAdmin: false,
    });

    const teacherAToken = signAuthToken({
      userId: teacherAUser.id,
      email: teacherAUser.email,
      role: teacherAUser.role,
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    const parentAToken = signAuthToken({
      userId: parentAUser.id,
      email: parentAUser.email,
      role: parentAUser.role,
      schoolId: schoolA.id,
      isSuperAdmin: false,
    });

    // Resolve classes for both schools
    const classesA = await classRepo.findBySchool(schoolA.id);
    const classesB = await classRepo.findBySchool(schoolB.id);
    record('Classes populated for both schools', classesA.length > 0 && classesB.length > 0, `School A: ${classesA.length}, School B: ${classesB.length}`);

    // Helper fetch wrapper
    const BASE_URL = 'http://127.0.0.1:3000';

    async function apiRequest(endpoint: string, options: { method?: string; token?: string; body?: any }) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
      }

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const json = await res.json().catch(() => ({}));
      return { status: res.status, ok: res.ok, data: json };
    }

    // =========================================================================
    // TEST SECTION 1: School Registry & Visibility Scoping
    // =========================================================================
    console.log('\n--- SECTION 1: School Registry & Visibility Scoping ---');

    // 1.1 Super Admin lists all schools
    const superAdminSchools = await apiRequest('/api/v1/schools', { token: superAdminToken });
    record(
      'Super Admin can view all active schools',
      superAdminSchools.status === 200 && superAdminSchools.data.count > 1,
      `Returned ${superAdminSchools.data.count} schools`
    );

    // 1.2 Principal A can only see their own school
    const principalASchools = await apiRequest('/api/v1/schools', { token: principalAToken });
    record(
      'Principal A scoped exclusively to School A in registry listing',
      principalASchools.status === 200 && principalASchools.data.count === 1 && principalASchools.data.data[0]?.id === schoolA.id,
      `Returned exactly 1 school: ${principalASchools.data.data[0]?.code}`
    );

    // 1.3 Principal A requests School B details -> REJECTED (403)
    const principalAInspectB = await apiRequest(`/api/v1/schools/${schoolB.id}`, { token: principalAToken });
    record(
      'Principal A CANNOT view School B details (Strict Tenant Violation)',
      principalAInspectB.status === 403 && principalAInspectB.data.error === 'TENANT_ISOLATION_VIOLATION',
      `HTTP ${principalAInspectB.status} - ${principalAInspectB.data.error}`
    );

    // 1.4 Unauthenticated request to /api/v1/schools -> REJECTED (401)
    const unauthSchools = await apiRequest('/api/v1/schools', {});
    record('Unauthenticated request to /api/v1/schools rejected (401)', unauthSchools.status === 401);

    // =========================================================================
    // TEST SECTION 2: Staff Registry & Tenant Isolation
    // =========================================================================
    console.log('\n--- SECTION 2: Staff Registry & Multi-Tenant Isolation ---');

    // 2.1 Principal A queries staff -> returns only School A staff
    const staffAList = await apiRequest('/api/v1/staff', { token: principalAToken });
    const allStaffBelongToA = staffAList.data.data.every((s: any) => s.school_id === schoolA.id);
    record(
      'Principal A lists only School A staff records',
      staffAList.status === 200 && staffAList.data.data.length > 0 && allStaffBelongToA,
      `Retrieved ${staffAList.data.data.length} staff records, all scoped to School A`
    );

    // 2.2 Principal B queries staff -> returns only School B staff
    const staffBList = await apiRequest('/api/v1/staff', { token: principalBToken });
    const allStaffBelongToB = staffBList.data.data.every((s: any) => s.school_id === schoolB.id);
    record(
      'Principal B lists only School B staff records',
      staffBList.status === 200 && staffBList.data.data.length > 0 && allStaffBelongToB,
      `Retrieved ${staffBList.data.data.length} staff records, all scoped to School B`
    );

    // 2.3 Principal A attempts to view a School B staff member by ID -> REJECTED (403)
    const staffBRecord = staffBList.data.data[0];
    const principalAViewStaffB = await apiRequest(`/api/v1/staff/${staffBRecord.id}`, { token: principalAToken });
    record(
      'Principal A CANNOT view School B staff record by ID (403 Tenant Violation)',
      principalAViewStaffB.status === 403 && principalAViewStaffB.data.error === 'TENANT_ISOLATION_VIOLATION',
      `HTTP ${principalAViewStaffB.status}`
    );

    // 2.4 Principal A attempts to create staff with school_id = School B -> REJECTED (403)
    const crossSchoolStaffCreate = await apiRequest('/api/v1/staff', {
      method: 'POST',
      token: principalAToken,
      body: {
        school_id: schoolB.id,
        staff_id_number: 'STAFF-HACK-001',
        full_name: 'Intruder Staff',
        role: 'teacher',
        arm: 'secondary',
        designation: 'Hacked Teacher',
        staff_type: 'Teaching',
      },
    });
    record(
      'Principal A CANNOT create staff in School B (403 Tenant Isolation)',
      crossSchoolStaffCreate.status === 403,
      `HTTP ${crossSchoolStaffCreate.status} - ${crossSchoolStaffCreate.data.error}`
    );

    // 2.5 Cross-school class assignment rejection:
    // Principal A attempts to create staff in School A, but assigns class from School B
    const crossClassStaffCreate = await apiRequest('/api/v1/staff', {
      method: 'POST',
      token: principalAToken,
      body: {
        school_id: schoolA.id,
        staff_id_number: 'STAFF-TEST-CLASS-001',
        full_name: 'Test Assignment Master',
        role: 'teacher',
        arm: 'secondary',
        designation: 'Form Master',
        staff_type: 'Teaching',
        assigned_class_id: classesB[0].id, // School B class!
      },
    });
    record(
      'Cross-school class assignment to staff is strictly rejected (400)',
      crossClassStaffCreate.status === 400 && crossClassStaffCreate.data.error === 'CROSS_SCHOOL_CLASS_INVALID',
      `HTTP ${crossClassStaffCreate.status} - ${crossClassStaffCreate.data.error}`
    );

    // 2.6 Unique staff ID number enforcement: duplicate in same school -> 409
    const existingStaffA = staffAList.data.data[0];
    const duplicateStaffCreate = await apiRequest('/api/v1/staff', {
      method: 'POST',
      token: principalAToken,
      body: {
        school_id: schoolA.id,
        staff_id_number: existingStaffA.staff_id_number, // duplicate!
        full_name: 'Duplicate Staff Member',
        role: 'teacher',
        arm: 'secondary',
        designation: 'Duplicate Teacher',
        staff_type: 'Teaching',
      },
    });
    record(
      'Duplicate staff ID number within school is rejected (409 Conflict)',
      duplicateStaffCreate.status === 409 && duplicateStaffCreate.data.error === 'STAFF_NUMBER_EXISTS',
      `HTTP ${duplicateStaffCreate.status} - ${duplicateStaffCreate.data.error}`
    );

    // =========================================================================
    // TEST SECTION 3: Student Registry, Atomic Enrollment & Isolation
    // =========================================================================
    console.log('\n--- SECTION 3: Student Registry & Atomic Enrollment ---');

    // 3.1 Principal A lists students -> all belong to School A
    const studentsAList = await apiRequest('/api/v1/students', { token: principalAToken });
    const allStudentsBelongToA = studentsAList.data.data.every((s: any) => s.school_id === schoolA.id);
    record(
      'Principal A lists only School A students',
      studentsAList.status === 200 && studentsAList.data.data.length > 0 && allStudentsBelongToA,
      `Retrieved ${studentsAList.data.data.length} students, all strictly School A`
    );

    // 3.2 Principal B lists students -> all belong to School B
    const studentsBList = await apiRequest('/api/v1/students', { token: principalBToken });
    const allStudentsBelongToB = studentsBList.data.data.every((s: any) => s.school_id === schoolB.id);
    record(
      'Principal B lists only School B students',
      studentsBList.status === 200 && studentsBList.data.data.length > 0 && allStudentsBelongToB,
      `Retrieved ${studentsBList.data.data.length} students, all strictly School B`
    );

    // 3.3 Principal A attempts to view School B student -> REJECTED (403)
    const studentBRecord = studentsBList.data.data[0];
    const principalAViewStudentB = await apiRequest(`/api/v1/students/${studentBRecord.id}`, { token: principalAToken });
    record(
      'Principal A CANNOT view School B student by ID (403 Tenant Violation)',
      principalAViewStudentB.status === 403 && principalAViewStudentB.data.error === 'TENANT_ISOLATION_VIOLATION',
      `HTTP ${principalAViewStudentB.status}`
    );

    // 3.4 Principal A attempts to update School B student -> REJECTED (403)
    const principalAUpdateStudentB = await apiRequest(`/api/v1/students/${studentBRecord.id}`, {
      method: 'PATCH',
      token: principalAToken,
      body: {
        guardian_phone: '+234 803 999 9999',
      },
    });
    record(
      'Principal A CANNOT update School B student (403 Tenant Violation)',
      principalAUpdateStudentB.status === 403 && principalAUpdateStudentB.data.error === 'TENANT_ISOLATION_VIOLATION',
      `HTTP ${principalAUpdateStudentB.status}`
    );

    // 3.5 Cross-school class assignment rejection for student registration:
    const crossClassStudentReg = await apiRequest('/api/v1/students', {
      method: 'POST',
      token: principalAToken,
      body: {
        school_id: schoolA.id,
        admission_number: 'ANCHOR/2026/TEST01',
        first_name: 'Test',
        surname: 'Student',
        gender: 'Male',
        date_of_birth: '2013-01-01',
        current_class_id: classesB[0].id, // School B class!
        arm: 'secondary',
        guardian_name: 'Test Guardian',
        guardian_phone: '+234 803 000 0000',
      },
    });
    record(
      'Cross-school class assignment during student registration rejected (400)',
      crossClassStudentReg.status === 400 && crossClassStudentReg.data.error === 'CROSS_SCHOOL_CLASS_INVALID',
      `HTTP ${crossClassStudentReg.status} - ${crossClassStudentReg.data.error}`
    );

    // 3.6 Valid student registration with atomic enrollment creation
    const uniqueTestAdm = `ANCHOR/TEST/${Date.now().toString().slice(-4)}`;
    const validStudentReg = await apiRequest('/api/v1/students', {
      method: 'POST',
      token: principalAToken,
      body: {
        school_id: schoolA.id,
        admission_number: uniqueTestAdm,
        first_name: 'Keren',
        middle_name: 'Ngoundu',
        surname: 'Iorapuu',
        gender: 'Female',
        date_of_birth: '2014-07-15',
        current_class_id: classesA[0].id,
        arm: 'secondary',
        guardian_name: 'Dr. Terver Iorapuu',
        guardian_phone: '+234 803 555 1212',
        guardian_email: 't.iorapuu@demo.ng',
        address: '10 Old Otukpo Road, Makurdi',
        state_of_origin: 'Benue',
      },
    });

    const studentCreated = validStudentReg.status === 201 && validStudentReg.data.data?.id;
    const enrollmentCreated = Boolean(validStudentReg.data.enrollment?.id);
    record(
      'Valid student registration succeeds (201) with atomic enrollment creation',
      studentCreated && enrollmentCreated,
      `Student ID: ${validStudentReg.data.data?.id}, Enrollment ID: ${validStudentReg.data.enrollment?.id}`
    );

    // 3.7 Duplicate admission number in SAME school -> REJECTED (409)
    const duplicateAdmSameSchool = await apiRequest('/api/v1/students', {
      method: 'POST',
      token: principalAToken,
      body: {
        school_id: schoolA.id,
        admission_number: uniqueTestAdm, // duplicate in School A
        first_name: 'Duplicate',
        surname: 'Person',
        gender: 'Male',
        date_of_birth: '2014-01-01',
        current_class_id: classesA[0].id,
        arm: 'secondary',
        guardian_name: 'Guardian',
        guardian_phone: '+234 803 111 2222',
      },
    });
    record(
      'Duplicate admission number in SAME school rejected (409 Conflict)',
      duplicateAdmSameSchool.status === 409 && duplicateAdmSameSchool.data.error === 'ADMISSION_NUMBER_EXISTS',
      `HTTP ${duplicateAdmSameSchool.status} - ${duplicateAdmSameSchool.data.error}`
    );

    // 3.8 Duplicate admission number in DIFFERENT school -> ALLOWED (Institutional Scoping)
    // Same admission number 'uniqueTestAdm' used in School B by Principal B
    const sameAdmDiffSchool = await apiRequest('/api/v1/students', {
      method: 'POST',
      token: principalBToken,
      body: {
        school_id: schoolB.id,
        admission_number: uniqueTestAdm, // same number, but in School B!
        first_name: 'Different',
        surname: 'SchoolStudent',
        gender: 'Male',
        date_of_birth: '2014-02-02',
        current_class_id: classesB[0].id,
        arm: 'secondary',
        guardian_name: 'School B Guardian',
        guardian_phone: '+234 803 222 3333',
      },
    });
    record(
      'Identical admission number in DIFFERENT school is permitted (Institutional Scoping)',
      sameAdmDiffSchool.status === 201,
      `School B successfully registered with same admission number '${uniqueTestAdm}' (HTTP ${sameAdmDiffSchool.status})`
    );

    // =========================================================================
    // TEST SECTION 4: Role-Based Access Control (RBAC)
    // =========================================================================
    console.log('\n--- SECTION 4: Role-Based Access Control (RBAC) ---');

    // 4.1 Parent attempting to create student -> REJECTED (403 Forbidden Permission)
    const parentCreateStudent = await apiRequest('/api/v1/students', {
      method: 'POST',
      token: parentAToken,
      body: {
        school_id: schoolA.id,
        admission_number: 'HACK/ADM/01',
        first_name: 'Unauthorized',
        surname: 'Attempt',
        gender: 'Male',
        date_of_birth: '2015-01-01',
        current_class_id: classesA[0].id,
        arm: 'secondary',
        guardian_name: 'Parent',
        guardian_phone: '+234 803 000 0000',
      },
    });
    record(
      'Parent role CANNOT register students (403 FORBIDDEN_PERMISSION)',
      parentCreateStudent.status === 403 && parentCreateStudent.data.error === 'FORBIDDEN_PERMISSION',
      `HTTP ${parentCreateStudent.status} - ${parentCreateStudent.data.error}`
    );

    // 4.2 Teacher attempting to create staff -> REJECTED (403 Forbidden Permission)
    const teacherCreateStaff = await apiRequest('/api/v1/staff', {
      method: 'POST',
      token: teacherAToken,
      body: {
        school_id: schoolA.id,
        staff_id_number: 'TEACHER-HACK-01',
        full_name: 'Unauthorized Staff',
        role: 'teacher',
        arm: 'secondary',
        designation: 'Teacher',
        staff_type: 'Teaching',
      },
    });
    record(
      'Teacher role CANNOT create staff records (403 FORBIDDEN_PERMISSION)',
      teacherCreateStaff.status === 403 && teacherCreateStaff.data.error === 'FORBIDDEN_PERMISSION',
      `HTTP ${teacherCreateStaff.status} - ${teacherCreateStaff.data.error}`
    );

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log('\n=================================================================');
    const passedCount = results.filter((r) => r.status === 'PASSED').length;
    const failedCount = results.filter((r) => r.status === 'FAILED').length;
    console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
    console.log('=================================================================\n');

    if (failedCount > 0) {
      console.error('Some tests failed!');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
}

runTests();
