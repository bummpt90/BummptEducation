# BummptEducation — Phase 8D: Digital Lesson Notes & Teacher Inquiries Specification

**Status:** COMPLETED & VERIFIED  
**Architecture:** 100% Server-Authoritative PostgreSQL Persistence  
**Test Suite:** `tests/phase8d.lesson-notes.test.ts` (49/49 Tests Passed)  
**Security Standard:** Strict Authentication, Multi-Tenant Boundary Isolation (IDOR Protection), RBAC Enforcement, Immutable Audit Logging, and Production Seed Protection.

---

## 1. Executive Summary

Phase 8D transitions the BummptEducation digital curriculum and teacher-parent consultation engine from ephemeral in-memory JavaScript structures (`lessonNotesStore` and `lessonFeedbacksStore`) into a hardened, multi-tenant relational system backed by PostgreSQL.

All lesson notes, feedback inquiries, atomic download counters, and curriculum audit trails are authored, validated, stored, and retrieved directly from PostgreSQL. Mock data stores (`INITIAL_LESSON_NOTES`, `INITIAL_LESSON_FEEDBACKS`) have been strictly decoupled from production workflows and frontend view components.

---

## 2. PostgreSQL Relational Foundation (Migration 0010)

The digital curriculum layer is governed by Migration `0010_lesson_notes_and_inquiries.sql`:

### 2.1 Table: `lesson_notes`
- **Primary Key:** `id` (UUIDv4)
- **Tenant Scoping:** `school_id` (UUID references `schools(id)` ON DELETE CASCADE), `organization_id` (UUID references `organizations(id)` ON DELETE CASCADE)
- **Pedagogical Metadata:** `teacher_id` (references `staff(id)` ON DELETE SET NULL), `teacher_name`, `class_level`, `arm` (`kindergarten`, `primary`, `secondary`), `subject_name`, `week_number` (1–20), `term` (`1st Term`, `2nd Term`, `3rd Term`), `academic_year`
- **Curriculum Content:** `title`, `topic`, `sub_topics` (`TEXT[]`), `learning_objectives` (`TEXT[]`), `instructional_materials` (`TEXT[]`), `content_summary`, `content_body`, `evaluation_questions` (`TEXT[]`), `key_terms` (`TEXT[]`)
- **Document Attachments:** `pdf_file_name`, `pdf_file_size`, `pdf_url`
- **Telemetry:** `download_count` (integer, checked non-negative, incremented atomically)
- **Lifecycle:** `status` (`Published`, `Draft`, `Archived`), `created_at`, `updated_at`

### 2.2 Table: `lesson_inquiries`
- **Primary Key:** `id` (UUIDv4)
- **Foreign Key:** `lesson_note_id` (UUID references `lesson_notes(id)` ON DELETE CASCADE)
- **Authoritative Identity:** `parent_id` (references `parent_guardians(id)`), `student_id` (references `students(id)`), `parent_name`, `student_name`, `guardian_phone`
- **Question & Response:** `question`, `teacher_reply`, `replied_by_staff_id`, `replied_by_user_id`, `replied_by_name`, `replied_at`
- **Status:** `status` (`Pending`, `Answered`, `Closed`)

### 2.3 Table: `lesson_note_audit_logs`
- **Primary Key:** `id` (UUIDv4)
- **Audit Target:** `lesson_note_id` (UUID references `lesson_notes(id)` ON DELETE SET NULL), preserving the permanent audit history even when a target lesson note is removed.
- **Security Context:** `school_id`, `organization_id`, `user_id`, `action` (`NOTE_CREATED`, `NOTE_UPDATED`, `NOTE_DELETED`, `INQUIRY_SUBMITTED`, `INQUIRY_REPLIED`), `details` (`JSONB`), `ip_address`, `created_at`

---

## 3. Data Access Layer & Repositories

### 3.1 `LessonNoteRepository` (`src/db/repositories/lessonNote.repository.ts`)
- `createLessonNote(data, client?)`: Inserts structured curriculum record with validation.
- `getLessonNoteById(id, schoolId?, client?)`: Retrieves single lesson note with tenant isolation and aggregate inquiry count.
- `listLessonNotes(filters, options)`: Filtered, paginated, and keyword-searchable curriculum catalogue.
- `updateLessonNote(id, schoolId, data, client?)`: Scoped mutation preventing cross-tenant modifications.
- `incrementDownloadCount(id, schoolId)`: Atomic SQL execution (`UPDATE lesson_notes SET download_count = download_count + 1 WHERE id = $1 AND school_id = $2 RETURNING download_count`) eliminating race conditions.
- `deleteLessonNoteWithAudit(id, schoolId, actorId?, ipAddress?)`: Executes in an atomic PostgreSQL transaction using `withTransaction`, acquiring a row lock, removing the note, and writing an immutable `NOTE_DELETED` audit log entry with preserved ID and timestamp.
- `getStats(schoolId?)`: Aggregates active notes, term coverage, and total downloads directly from PostgreSQL.

### 3.2 `LessonInquiryRepository` (`src/db/repositories/lessonInquiry.repository.ts`)
- `createInquiry(data, client?)`: Stores parent questions with verified parent and student identities.
- `listInquiriesForNote(lessonNoteId, schoolId?, filters?)`: Returns inquiries for a note, supporting IDOR protection through optional `parentId` and `studentIds` filters.
- `respondToInquiry(id, schoolId, data, client?)`: Records educator answers, updating inquiry status to `Answered`.

---

## 4. API Security, Authorization & Tenant Boundary Enforcement

The REST router (`src/api/v1/lesson-notes.routes.ts`) is mounted at `/api/v1/lesson-notes`:

| Method | Route | Auth Requirement | Permission / Authorization | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/lesson-notes` | `authenticateUser` | Tenant Scope (`resolveAuthorizedSchoolScope`) | Lists notes scoped to user's school. |
| `GET` | `/api/v1/lesson-notes/stats` | `authenticateUser` | Tenant Scope (`resolveAuthorizedSchoolScope`) | SQL aggregated stats for user's school. |
| `GET` | `/api/v1/lesson-notes/:id` | `authenticateUser` | Tenant Scope (Cross-school IDOR returns 404) | Returns specific note details. |
| `GET` | `/api/v1/lesson-notes/:id/feedbacks` | `authenticateUser` | Scoped via `getInquiriesForUserRole` | Parent sees only linked children; Educator sees school. |
| `POST` | `/api/v1/lesson-notes` | `authenticateUser` | `requirePermission('lesson_notes.create')` | Authorizes teachers & principals to publish. |
| `PUT` | `/api/v1/lesson-notes/:id` | `authenticateUser` | `requirePermission('lesson_notes.create')` | Tenant-scoped note update. |
| `DELETE`| `/api/v1/lesson-notes/:id` | `authenticateUser` | `requirePermission('lesson_notes.create')` | Atomic transaction deletion with audit. |
| `POST` | `/api/v1/lesson-notes/:id/increment-download` | `authenticateUser` | Tenant Scope | Authenticated atomic download counter. |
| `POST` | `/api/v1/lesson-notes/:id/feedback` | `authenticateUser` | Verified Parent/Student Link | Submits inquiry with verified database identities. |
| `POST` | `/api/v1/lesson-notes/inquiries/:id/reply` | `authenticateUser` | `requirePermission('lesson_notes.create')` | Educator responds to parent inquiry. |

---

## 5. Production Seeding Safety & Zero-Mock Decoupling

1. **Production Guard:** `seedLessonNotesFoundation` in `src/db/seed/lessonNotes.seed.ts` explicitly verifies `process.env.NODE_ENV !== 'production'`. In production, it safely refuses execution and returns `{ notesInserted: 0, feedbacksInserted: 0, schoolId: '' }`.
2. **Server Startup Guard:** `server.ts` wraps curriculum seeder calls in strict non-production environment checks.
3. **Zero In-Memory Stores:** `lessonNotesStore` and `lessonFeedbacksStore` have been eradicated from `server.ts`.
4. **Frontend Decoupling & Server-Confirmed Telemetry:** `src/pages/LessonNotesPage.tsx` and `src/components/LessonNoteViewerModal.tsx` communicate exclusively with authenticated `/api/v1/lesson-notes` endpoints, with complete error handling and retry mechanisms. All reliance on `INITIAL_LESSON_NOTES` has been removed.
5. **Authoritative Server-Confirmed Download Telemetry:** In `LessonNotesPage.tsx`, local optimistic counter incrementing has been completely eliminated. When a user requests a lesson note download, the client invokes `POST /api/v1/lesson-notes/:id/increment-download` with authenticated headers and awaits the server response. Only upon receiving confirmation and the PostgreSQL-returned `downloadCount` is the displayed counter updated and success notification rendered. In-flight guards prevent double-counting. If the server request fails, the local counter is not incremented and a non-sensitive notification is displayed.

---

## 6. Verification Results

Automated test suite (`tests/phase8d.lesson-notes.test.ts`):
- **Total Tests:** 49
- **Passed:** 49 (100%)
- **Failed:** 0
- **Regression Suite:** Clean pass across all prior phases (Phases 4–8C).
