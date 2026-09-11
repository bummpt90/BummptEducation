# BummptEducation — Phase 8 Execution Roadmap: 100% Server-Authoritative Production Integration

**Document Version:** 1.0.0  
**Phase:** 8 (Full Production Data Integration)  
**Parent Strategy:** Zero-Mock Production Architecture  
**Execution Sequence:** Phase 8A (Complete) → Phase 8B → Phase 8C → Phase 8D → Phase 8E → Phase 8F → Phase 8G  

---

## Executive Roadmap Overview

Phase 8 transitions BummptEducation from a prototype with hybrid PostgreSQL and local/mock fallbacks into a **100% server-authoritative enterprise education platform**. 

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 8A: AUDIT & INVENTORY (COMPLETED)                                     │
│ - Inventory all mock data, localStorage, in-memory stores, and fallbacks    │
│ - Establish Production Data Rule & formal system scorecard                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ PHASE 8B: PARENT AUTHENTICATION & SECURE REPORT PORTAL                      │
│ - Wire PostgreSQL parent_guardians, parent_student_links, parent_access_pins │
│ - REST API: /api/v1/parents/verify-pin & /api/v1/parents/report-card        │
│ - Replace ParentReportPortalModal mock student & assessment reads           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ PHASE 8C: ATTENDANCE SERVER-AUTHORITATIVE REGISTERS (COMPLETED)             │
│ - Eliminate localStorage primary store in AttendancePage.tsx                │
│ - Full-term register retrieval & persistence via /api/v1/attendance         │
│ - Automatic attendance percentage computation in PostgreSQL                 │
│ - Verified: tests/phase8c.attendance.test.ts (15/15 passed)                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ PHASE 8D: LESSON NOTES & FEEDBACK RELATIONAL STORAGE (COMPLETED)             │
│ - Migration 0010: lesson_notes, lesson_inquiries, lesson_note_audit_logs    │
│ - LessonNoteRepository & LessonInquiryRepository with atomic transactions   │
│ - Strict authenticateUser, tenant isolation (IDOR protection), RBAC enforced │
│ - Verified: tests/phase8d.lesson-notes.test.ts (47/47 passed)               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ PHASE 8E: BENUE STATE HQ TELEMETRY & MINISTRY DIRECTIVES                    │
│ - Dynamic SQL aggregation of all 23 LGAs from live PostgreSQL schools       │
│ - API routes: /api/v1/hq/telemetry, /api/v1/directives, /api/v1/hq/chat     │
│ - Decommission benue_state_school_overrides_v1 in localStorage              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ PHASE 8F: LEGACY PASSKEY RETIREMENT & RBAC UNIFICATION                      │
│ - Replace verifyPasskeyForWing with server-verified JWT permissions         │
│ - Retire bummpt_issued_passkeys_v1 & bummpt_security_session_v1             │
│ - Unify department access across academic, bursary, admin, and HQ           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ PHASE 8G: DATACONTEXT SANITIZATION & ZERO-MOCK PRODUCTION VERIFICATION      │
│ - Sever all INITIAL_* fallbacks in DataContext.tsx                          │
│ - Explicit loading, empty-tenant, and error state handling                 │
│ - End-to-end multi-tenant isolation and automated regression test sign-off │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 8B: Parent & Guardian Identity, PIN Authentication & Terminal Report Access

### 1. Objective & Problem Statement
Currently, `ParentReportPortalModal.tsx` verifies PINs using `localStorage.getItem('bummpt_parent_report_access_v1')` and returns static mock report cards from `INITIAL_STUDENTS` and `INITIAL_ASSESSMENTS`. In production, parents must securely authenticate their child's admission number and confidential PIN against PostgreSQL, viewing verified terminal results.

### 2. Relational Schema Alignment
The required database tables were created in migration `0002_production_schema.sql`:
- `parent_guardians` (id, organization_id, school_id, full_name, phone, email, is_active).
- `parent_student_links` (parent_id, student_id, relationship, is_primary_guardian, access_granted).
- `parent_access_pins` (id, school_id, student_id, parent_phone, pin_hash, is_active, expires_at).

### 3. Data Access Layer Implementation
- File: `src/db/repositories/parent.repository.ts`
- Methods:
  - `verifyParentPin(schoolId: string, admissionNumber: string, rawPin: string): Promise<{ success: boolean; studentId?: string; parentId?: string; error?: string }>`
  - `getParentLinkedStudents(parentId: string): Promise<Student[]>`
  - `getStudentReportCard(schoolId: string, studentId: string, termId: string): Promise<StudentTermResult | null>`
  - `logReportDownload(studentId: string, termId: string, parentId: string): Promise<void>`

### 4. Express REST API Specification
- Mount Path: `/api/v1/parents`
- Endpoints:
  - `POST /api/v1/parents/verify-pin`: Public rate-limited endpoint (Argon2id PIN verification); returns a short-lived scoped `ParentToken` containing `studentId`, `schoolId`, and `parentId`.
  - `GET /api/v1/parents/report-card`: Authenticated with `ParentToken`; returns official academic report card with all subject marks, affective domain ratings, and principal/tutor remarks.
  - `POST /api/v1/parents/report-card/download`: Records official parent download timestamp and increments audit counter.

### 5. Frontend Wire-Up & Component Migration
- Refactor `src/components/ParentReportPortalModal.tsx` to call `/api/v1/parents/verify-pin` and fetch real results.
- Remove all imports of `INITIAL_STUDENTS` and `INITIAL_ASSESSMENTS`.
- Support real PDF download backed by server-verified data.

### 6. Verification & Automated Tests
- Test file: `tests/phase8b_parent_portal.test.ts`
- Verifies: PIN verification success, incorrect PIN rejection, student isolation (parent cannot access another student's report card), and download logging in PostgreSQL.

---

## Phase 8C: Attendance Server Authority & Historical Registry Synchronization

### 1. Objective & Problem Statement
`AttendancePage.tsx` currently writes daily records to `localStorage.getItem('bummpt_attendance_register_v2')` and performs a fire-and-forget single-date sync to `/api/v1/attendance`. This leaves the server with incomplete historical data and causes data loss when switching devices.

### 2. Relational Schema Alignment
Tables `attendance_registers` and `attendance_records` already exist in PostgreSQL with full referential integrity to `classes`, `academic_terms`, and `students`.

### 3. Data Access Layer Expansion
- File: `src/db/repositories/attendance.repository.ts`
- Methods to expand:
  - `getClassTermRegisters(schoolId: string, classId: string, termId: string): Promise<AttendanceRegister[]>`
  - `getStudentTermAttendanceStats(schoolId: string, studentId: string, termId: string): Promise<{ totalDays: number; present: number; absent: number; late: number; percentage: number }>`

### 4. Express REST API Specification
- Endpoints to enhance in `src/api/v1/attendance.routes.ts`:
  - `GET /api/v1/attendance/class/:classId`: Retrieves all daily attendance entries for a class across the entire term in one request.
  - `POST /api/v1/attendance/bulk`: Atomic transaction recording all student statuses for a given date.

### 5. Frontend Wire-Up & Decommissioning
- In `AttendancePage.tsx`, on class/term selection, fetch registers from `/api/v1/attendance/class/:classId`.
- Remove fallback to `generateDefaultAttendanceRecordsForClass()`.
- Use `localStorage` purely as an offline temporary recovery buffer.

### 6. Verification & Automated Tests
- Test file: `tests/phase8c_attendance_authority.test.ts`
- Verifies: Full-term attendance querying, bulk save atomic transactions, and multi-tenant scoping.

---

## Phase 8D: Lesson Notes & Teacher Inquiries Relational Storage

### 1. Objective & Problem Statement
Currently, `server.ts` stores lesson notes and parent feedback inquiries in memory (`lessonNotesStore` and `lessonFeedbacksStore`). When the server restarts or scales in a containerized environment, all published notes and parent inquiries are permanently lost.

### 2. Relational Schema Migration
- New Migration File: `src/db/migrations/0008_lesson_notes.sql`
- Tables:
  ```sql
  CREATE TABLE IF NOT EXISTS lesson_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      term_id UUID NOT NULL REFERENCES academic_terms(id) ON DELETE CASCADE,
      teacher_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      topic VARCHAR(255) NOT NULL,
      sub_topics TEXT[] DEFAULT '{}',
      week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 15),
      learning_objectives TEXT[] DEFAULT '{}',
      instructional_materials TEXT[] DEFAULT '{}',
      content_summary TEXT NOT NULL,
      content_body TEXT NOT NULL,
      evaluation_questions TEXT[] DEFAULT '{}',
      key_terms TEXT[] DEFAULT '{}',
      pdf_file_name VARCHAR(255),
      pdf_file_size VARCHAR(50),
      download_count INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Published',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lesson_note_feedbacks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lesson_note_id UUID NOT NULL REFERENCES lesson_notes(id) ON DELETE CASCADE,
      parent_name VARCHAR(255) NOT NULL,
      student_name VARCHAR(255) NOT NULL,
      guardian_phone VARCHAR(50),
      question TEXT NOT NULL,
      teacher_reply TEXT,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      replied_at TIMESTAMP WITH TIME ZONE
  );
  ```

### 3. Data Access Layer Implementation
- File: `src/db/repositories/lesson-note.repository.ts`
- Implements full CRUD, filtering by class, arm, subject, term, and keyword search.

### 4. Express REST API Routes
- File: `src/api/v1/lesson-notes.routes.ts`
- Routes:
  - `GET  /api/v1/lesson-notes` (Search and filtered list with tenant isolation)
  - `GET  /api/v1/lesson-notes/stats` (Authoritative statistics computed by SQL)
  - `GET  /api/v1/lesson-notes/:id` (Single note with parent feedbacks)
  - `POST /api/v1/lesson-notes` (Protected by `requirePermission('lesson_notes.create')`)
  - `POST /api/v1/lesson-notes/:id/feedback` (Parent inquiry submission)
  - `POST /api/v1/lesson-notes/:id/increment-download` (Atomic download counter)

### 5. Decommissioning In-Memory Stores
- Remove `lessonNotesStore` and `lessonFeedbacksStore` variables from `server.ts`.
- Replace legacy unversioned `/api/lesson-notes` handlers with `app.use('/api/v1/lesson-notes', lessonNotesRouter)`.

### 6. Verification & Automated Tests
- Test file: `tests/phase8d.lesson-notes.test.ts`
- Documentation: `docs/PHASE_8D_LESSON_NOTES.md`
- Status: **COMPLETED & VERIFIED (47/47 Tests Passed)**
- Verifies:
  1. Migration 0010 schema conformance and foreign key constraints (ON DELETE SET NULL audit safety).
  2. Strict authentication enforcement across all GET, POST, PUT, DELETE endpoints (rejection of unauthenticated requests with 401).
  3. Tenant isolation and IDOR protection (cross-school queries, increments, and updates return 404 or 403).
  4. RBAC boundaries (teacher/principal vs. student/parent authorization).
  5. Authoritative parent inquiry verification against `parent_student_links` and scoped visibility.
  6. Atomic download increment without race conditions.
  7. Transactional deletion with atomic row locking and immutable audit logging.
  8. Production seed safety guards preventing execution in `NODE_ENV === 'production'`.
  9. Clean, structured error handling without internal SQL leakage.

---

## Phase 8E: Benue State HQ Telemetry & Ministry Directives PostgreSQL Integration (Hardened Phase 8E-H)

### 1. Objective & Problem Statement
`BenueStateHQPage.tsx` previously relied on static data, stored local overrides in `localStorage`, and used simulation or synthetic offsets for live telemetry. In production, State Ministry Officers require live aggregation across all 23 LGAs, while Heads of School require strictly scoped operational KPIs, directives compliance workflows, and inter-school communication dispatches with multi-tenant privacy.

### 2. Relational Schema & Seeding (Migration 0011)
- Seed `schools` table with all Benue Government Model Colleges and pilot institutions across Zone A, Zone B, and Zone C.
- Create migration `0011_hq_telemetry_directives_messaging.sql`:
  - `hq_dispatches`: Multi-tenant message bus with deterministic references (`BN/HQ/...`), audience types (`ALL_SCHOOLS`, `SPECIFIC_SCHOOL`, `LGA`, `ZONE`), and commissioner escalation tracking.
  - `hq_dispatch_replies`: Threaded dispatch responses linked to verified users and school contexts.
  - `ministry_directives`: Official circulars and policies with multi-tiered audience scoping.
  - `directive_acknowledgements`: Idempotent compliance logging (`ON CONFLICT (directive_id, school_id) DO UPDATE`).
  - `hq_audit_logs`: Immutable audit logging for directives, acknowledgements, subventions, and dispatches.

### 3. Data Access Layer Implementation
- `src/db/repositories/hqTelemetry.repository.ts`: Live PostgreSQL aggregation across 23 LGAs without synthetic counters, school-level operational KPIs, transactional subvention disbursement, and role-scoped audit logs.
- `src/db/repositories/ministryDirective.repository.ts`: Directives publishing, multi-tenant audience filtering, IDOR-protected single retrieval, and idempotent institutional acknowledgement.
- `src/db/repositories/hqDispatch.repository.ts`: Authoritative sender identity derivation, multi-tenant dispatch filtering, cross-school privacy enforcement, and status/escalation updates.

### 4. Express REST API Routes
- `src/api/v1/hq-telemetry.routes.ts`: `GET /overview`, `GET /lgas`, `GET /schools/:id`, `GET /schools/:id/kpis`, `GET /audit-logs`, `POST /subvention`.
- `src/api/v1/hq-directives.routes.ts`: `GET /directives`, `GET /directives/:id`, `POST /directives`, `POST /directives/:id/acknowledge`, `GET /directives/:id/acknowledgements`.
- `src/api/v1/hq-chat.routes.ts`: `GET /messages`, `GET /messages/:id`, `POST /messages`, `POST /messages/:id/reply`, `PATCH /messages/:id/status`.

### 5. Role Boundary & Security Enforcement (Phase 8E-H)
- **Ministry Portal Role Boundary:** Only Authorized HQ Officers (`super_admin`, `state_officer`) and Authenticated Heads of School (`principal`, `headmistress`, `head_kindergarten`) have portal access. All other roles (`teacher`, `bursar`, `admissions_officer`, `parent`, `student`, etc.) receive HTTP 403 Forbidden.
- **Zero Synthetic Telemetry:** All metrics derived from PostgreSQL queries over `schools`, `students`, `staff`, `lesson_notes`, and `attendance_registers`.
- **Cross-School Privacy & IDOR Protection:** Foreign directives and private dispatches return 404 Not Found to unauthorized school heads.
- **Authoritative Identity Derivation:** Client attempts to forge sender name, role, or target schools are stripped on the server.

### 6. Verification & Automated Tests
- Test file: `tests/phase8e.hq-telemetry-directives-messaging.test.ts`
- Documentation: `docs/PHASE_8E_HQ_TELEMETRY_DIRECTIVES_MESSAGING.md`
- Status: **CERTIFIED COMPLETE & HARDENED (92/92 Tests Passed across 11 Verification Categories)**

---

## Phase 8F: Legacy Passkey Retirement & RBAC Unification

### 1. Objective & Problem Statement
Client-side passkey verification in `src/utils/securityContext.ts` (`verifyPasskeyForWing`) stores credentials in `localStorage` and provides no cryptographic backend security. It must be replaced by server-authoritative JWT RBAC.

### 2. RBAC Permission Mapping for Department Wings

| Department Wing | Legacy Passkey Prefix | Server RBAC Permission Required | Permitted Roles |
| :--- | :--- | :--- | :--- |
| **Academic Wing** | `ACAD-` | `assessments.view`, `results.view` | `principal`, `headmistress`, `teacher`, `exam_officer`, `super_admin`, `state_officer` |
| **Bursary Wing** | `BURS-` | `bursary.view`, `fees.manage` | `bursar`, `principal`, `administrator`, `super_admin` |
| **Admin Wing** | `ADM-` | `staff.view`, `schools.view` | `principal`, `headmistress`, `administrator`, `super_admin` |
| **Benue HQ Wing**| `MOE-` | `state_analytics.view` | `state_officer`, `super_admin` |

### 3. Execution Plan
1. Update `WingAccessGatekeeper.tsx`:
   - If the user is authenticated and holds the required permission, unlock the wing automatically.
   - If the user lacks the permission, display a formal "Access Restricted: Insufficient Administrative Clearance" message.
2. Deprecate client-side passkey input forms and PIN generation in `AccessManagementModal.tsx`.
3. Clear `bummpt_issued_passkeys_v1` and `bummpt_security_session_v1` from `localStorage`.

### 4. Verification & Automated Tests
- Test file: `tests/phase8f_rbac_unification.test.ts`
- Verifies: Role-based wing authorization, token rejection when unauthorized, and zero localStorage reliance.

---

## Phase 8G: DataContext Sanitization & Zero-Mock Production Verification

### 1. Objective & Problem Statement
The final sub-phase severs the remaining fallback ties in `src/context/DataContext.tsx`. When the server returns 0 records, the context must preserve the empty state rather than populating `INITIAL_*` mock arrays.

### 2. Execution Plan
1. **Remove All Mock Fallbacks**:
   - `setStudents(rawList.length > 0 ? mapped : INITIAL_STUDENTS)` → `setStudents(mapped)`
   - `setStaff(rawList.length > 0 ? mapped : INITIAL_STAFF)` → `setStaff(mapped)`
   - `setPayments(rawList.length > 0 ? mapped : INITIAL_PAYMENTS)` → `setPayments(mapped)`
   - `setAdmissions(rawList.length > 0 ? mapped : INITIAL_ADMISSIONS)` → `setAdmissions(mapped)`
   - `setAssessments(rawList.length > 0 ? mapped : INITIAL_ASSESSMENTS)` → `setAssessments(mapped)`
2. **Handle Empty Tenants Gracefully**:
   - Verify that all table views (`AdminDashboard`, `AcademicDashboard`, `Scoresheet`) render clean, styled empty state cards when an array is empty.
3. **Handle Network Failures Explicitly**:
   - When API fails or returns 500/503, set `error: 'Unable to connect to school server. Please verify your internet connection.'` and display a non-intrusive banner.
4. **Final Mock Data File Deletion / Isolation**:
   - Relocate `src/data/mockData.ts` to `src/db/seed/data/initialSeeds.ts` for database seed scripts only. Ensure zero runtime frontend imports.

### 5. Final Acceptance Verification
- Full automated test suite execution:
  - `npm run test:phase4` (Operational Isolation)
  - `npm run test:phase5` (Academic Operations)
  - `npm run test:phase6` (Financial Controls)
  - `npm run test:phase7` (Auth Gateway & Sign-Up)
  - `npm run test:phase8a` (Data Boundary & Inventory)
  - Complete integration test covering Phases 8B through 8G.

---

## Sign-Off & Governance

Phase 8 guarantees that BummptEducation operates with enterprise data integrity, complete multi-tenancy, and full auditability for educational authorities across Benue State and Nigeria.
