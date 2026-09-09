# BummptEducation — Phase 8C: Attendance Server Authority & Historical Registry Synchronization

**Document Version:** 1.1.0  
**Status:** COMPLETED & HARDENED  
**Phase:** 8C  
**Test Suite:** `tests/phase8c.attendance.test.ts` (20/20 Passed)

---

## 1. Executive Summary

Phase 8C establishes strict **Server Authority** for attendance tracking, eliminating legacy `localStorage` reliance (`bummpt_attendance_register_v2`) and synthetic mock defaults. All student attendance marks, class registers, longitudinal attendance trajectories, and analytical summaries are now persisted directly to and computed from **PostgreSQL**.

### Key Architectural Outcomes
1. **Zero-Mock & Zero-LocalStorage Dependency**: `AttendancePage.tsx` relies exclusively on `DataContext.tsx` authenticated endpoints (`/api/v1/attendance` and `/api/v1/attendance/class/:classId`).
2. **Atomic Batch Transactions**: Whole-class registers are written via transactional database persistence with unique constraint enforcement on `(student_id, attendance_date)`.
3. **Historical Registry Synchronization**: Attendance records preserve the original `class_id`, `academic_session_id`, and `term_id` at the time of recording, ensuring historical accuracy even when students progress through classes or terms.
4. **Empty Database Invariant**: An unrecorded class or school day returns an empty dataset (`[]`), rendering clear unrecorded states rather than defaulting to synthetic "present" marks.
5. **Multi-Tenant & RBAC Isolation**: Enforces tenant scoping across schools (`CROSS_SCHOOL_VIOLATION`), with RBAC checks guaranteeing only authorized staff (principals, teachers) can mark registers.
6. **Immutable Security Audit Trail**: All bulk saves and modifications generate records in `attendance_audit_logs`.

---

## 2. Relational Schema & Migration 0009

Migration file: `src/db/migrations/0009_attendance_server_authority.sql`

### Enhanced `daily_attendance` Schema
```sql
ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS academic_term_id UUID REFERENCES academic_terms(id) ON DELETE CASCADE;
ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL;
ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE daily_attendance 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
```

### Uniqueness Constraint & Composite Indexes
- Unique constraint: `(student_id, attendance_date)` prevents duplicate records while enabling clean atomic upserts.
- Indexes:
  - `idx_daily_attendance_org`: Scoping by organization tenant.
  - `idx_daily_attendance_school_class_date`: High-performance register lookups.
  - `idx_daily_attendance_enrollment`: Referential link to longitudinal enrollment history.
  - `idx_daily_attendance_session_term`: Fast filtering by academic calendar periods.

### Security Audit Logs Schema (`attendance_audit_logs`)
```sql
CREATE TABLE IF NOT EXISTS attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    attendance_id UUID REFERENCES daily_attendance(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- RECORDED, BULK_RECORDED, MODIFIED, CORRECTION, UNAUTHORIZED_ATTEMPT
    performed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    ip_address VARCHAR(100),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Data Access Layer (`AttendanceRepository`)

Located in `src/db/repositories/attendance.repository.ts`:

- `recordAttendance(data)`: Validates status against `['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']`, verifies school and class tenancy, links student enrollment, and inserts/updates the daily entry.
- `recordBulkAttendance(schoolId, classId, termId, attendanceDate, records, markedBy)`: Executes bulk register submissions inside a PostgreSQL transaction (`withTransaction`).
- `findByClassAndDate(schoolId, classId, date)`: Retrieves the class register with student details and academic calendar metadata.
- `findByClass(schoolId, classId, filters)`: Retrieves registers filtered by date, term, or session.
- `findByStudent(schoolId, studentId, filters)`: Computes individual student attendance statistics (`totalDays`, `present`, `absent`, `late`, `excused`, `attendanceRate`) directly from PostgreSQL records.
- `getAttendanceStatistics(schoolId, filters)`: Aggregates real-time school-wide or class-level attendance and punctuality rates.
- `updateAttendance(id, data, schoolId)`: Updates status, arrival time, notes, and records audit trail.
- `checkTeacherClassAuthorization(schoolId, userId, classId)`: Verifies if a teacher is the assigned form master or subject allocated teacher for the class.
- `logAttendanceAudit(data)`: Records audit entries into `attendance_audit_logs`.

---

## 4. REST API Specification

Mounted on `/api/v1/attendance` in `src/api/v1/attendance.routes.ts`:

1. **`POST /api/v1/attendance`**:
   - Permission: `attendance.mark`
   - Body: `{ class_id, term_id, date, records: [{ studentId, status, arrivalTime, reason }] }`
   - Atomically records daily register for the specified class and date.
2. **`GET /api/v1/attendance/class/:classId`**:
   - Permission: `attendance.view`
   - Query: `date`, `term_id`, `start_date`, `end_date`
   - Returns array of daily attendance entities matching the class filter.
3. **`GET /api/v1/attendance/student/:studentId`**:
   - Permission: `attendance.view`
   - Returns student attendance history and computed summaries.
4. **`GET /api/v1/attendance/statistics`**:
   - Permission: `attendance.view`
   - Aggregates attendance statistics for school/class.

---

## 5. Frontend Decoupling & UI States

In `src/pages/AttendancePage.tsx`:
- **Deprecated Legacy Functions**: `getStoredAttendanceRecords` and `saveStoredAttendanceRecords` removed from active workflow.
- **Server State Feedback**:
  - `IDLE`: Register ready for editing.
  - `SAVING`: Visual loading spinner and disabled submit actions.
  - `SUCCESS`: Confirmation banner notifying staff of persisted database synchronization.
  - `ERROR`: Clear alert banner displaying the exact error without silent failures.
- **Empty State Display**: Days without recorded attendance cleanly indicate "Register Unrecorded" rather than synthetically displaying all students as Present.

---

## 6. Verification & Automated Test Suite

Test Suite: `tests/phase8c.attendance.test.ts`

| Test # | Verification Item | Status |
|---|---|---|
| 1 | Migration 0009 Tables (`daily_attendance`, `attendance_audit_logs`, `student_enrollments`) | **PASSED** |
| 1b | `daily_attendance` Columns (tenants, dates, timestamps, enrollments) | **PASSED** |
| 1c | PostgreSQL Metadata: `daily_attendance_student_date_unique` verification | **PASSED** |
| 2 | RBAC Permissions (`attendance.view`, `attendance.mark` for principal/teacher, blocked for student/parent) | **PASSED** |
| 3 | Server Authority: Single Student Attendance Record Persistence | **PASSED** |
| 4 | Unique Constraint & Conflict Update (In-place update, zero duplicate rows) | **PASSED** |
| 4b | Direct PostgreSQL Unique Violation: Two records for same student/date cannot coexist (Error 23505) | **PASSED** |
| 4c | Uniqueness Permutations: Different students on same date & same student on different dates allowed | **PASSED** |
| 4d | Database Audit: Zero duplicate student_id + attendance_date rows across entire database | **PASSED** |
| 4e | Migration Safety & Idempotency: Re-executing migrations is safe with zero duplicate constraints created | **PASSED** |
| 5 | Duplicate Attendance Guard (Rejects duplicate when `updateIfExists: false`) | **PASSED** |
| 6 | Multi-Tenant Scoping: Cross-School Attendance Recording Blocked (`CROSS_SCHOOL_VIOLATION`) | **PASSED** |
| 6b | Multi-Tenant Scoping: School B queries return zero School A records | **PASSED** |
| 7 | Server Authority: Atomic Bulk Class Register Recording | **PASSED** |
| 8 | Historical Context Preservation: Record remains bound to historical class & term | **PASSED** |
| 9 | Empty Database Result Invariant (Returns `[]`, no synthetic fallback) | **PASSED** |
| 10 | Database-Authoritative Student Attendance Summary Statistics | **PASSED** |
| 11 | Immutable Security Audit Logging (`attendance_audit_logs` entry created) | **PASSED** |
| 12 | Frontend Decoupling: `AttendancePage` relies exclusively on Server Authority | **PASSED** |
| 13 | `DataContext` PostgreSQL API Authority for Attendance Registry | **PASSED** |

**Summary: 20/20 Tests Passed.**

---

## 7. Database Constraint Hardening & Uniqueness Guarantee

### Exact Uniqueness Rule
**ONE ATTENDANCE RECORD PER STUDENT PER DATE.**
The database strictly prevents duplicate attendance records for the same student on the same day across the entire institution.

### Exact Constraint and Index
- **Constraint Name:** `daily_attendance_student_date_unique`
- **Constraint Type:** `UNIQUE` (`contype = 'u'`)
- **Covered Columns:** `(student_id, attendance_date)`
- **Underlying Index:** `CREATE UNIQUE INDEX daily_attendance_student_date_unique ON public.daily_attendance USING btree (student_id, attendance_date)`

### How It Was Verified
1. **Catalog Metadata Introspection:** Queried `pg_constraint`, `pg_class`, `pg_index`, and `pg_attribute` to confirm the constraint name, column ordering (`conkey`), and backing unique index (`indisunique = true`).
2. **Direct Collision Testing:** Executed raw SQL insert collision bypassing application layers; verified that PostgreSQL natively raises error code `23505` (`unique_violation`) explicitly citing `daily_attendance_student_date_unique`.
3. **Scope Permutations:** Verified that different students on the same date and the same student on different dates can be safely recorded.
4. **Idempotency & Migration Safety:** Tested re-executing migrations against the active database; confirmed 0 duplicate constraints created and 0 errors thrown.

### Duplicate-Data Check Result
Executed deduplication check query across the entire `daily_attendance` table:
```sql
SELECT student_id, attendance_date, COUNT(*)
FROM daily_attendance
GROUP BY student_id, attendance_date
HAVING COUNT(*) > 1;
```
**Result:** **0 duplicate records found.** The database is 100% clean and compliant with the uniqueness invariant.
