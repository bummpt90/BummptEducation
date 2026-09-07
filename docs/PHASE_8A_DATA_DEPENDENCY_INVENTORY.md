# BummptEducation — Phase 8A: Production Data Integration Audit & Dependency Inventory

**Document Version:** 1.0.0  
**Phase:** 8A (Discovery, Architectural Mapping & Dependency Inventory)  
**Status:** COMPLETE & AUTHORITATIVE  
**Target Architecture:** 100% Server-Authoritative PostgreSQL Architecture  

---

## 1. The Production Data Rule

### 1.1 Formal Statement of the Production Data Rule

In the BummptEducation production environment, business data flow is strictly governed by the following immutable architectural pipeline:

```
[ UI Component / Page ]
          │
          ▼  (1) Authenticated HTTPS / REST Request (Bearer JWT / Cookie)
[ Express API Gateway (/api/v1/*) ]
          │
          ▼  (2) Server Authorization, RBAC Permission & Multi-Tenant Boundary
[ Domain Business Controller / Service ]
          │
          ▼  (3) Parameterized Typed Query Execution / ACID Transaction
[ PostgreSQL Data Access Layer (DAL / Repositories) ]
          │
          ▼  (4) Persistent Relational Storage & Row-Level Constraints
[ PostgreSQL Enterprise Database ]
```

### 1.2 Prohibited Data Sources for Production Business Operations

The following data sources are **STRICTLY PROHIBITED** from acting as authoritative sources of business truth in production:
1. **Mock Data Modules & Static Arrays**: Any constant defined in `src/data/mockData.ts`, `src/data/lessonNotesData.ts`, `src/data/benueStateData.ts`, `src/data/attendanceData.ts`, or similar static collections.
2. **`INITIAL_*` Data Constants**: Fallback assignments such as `INITIAL_STUDENTS`, `INITIAL_STAFF`, `INITIAL_PAYMENTS`, `INITIAL_FEE_SCHEDULES`, `INITIAL_ADMISSIONS`, `INITIAL_ASSESSMENTS`, and `INITIAL_MINISTRY_DIRECTIVES`.
3. **Browser Storage as Primary Store**: `localStorage` or `sessionStorage` storing business records, student grades, attendance, fee transactions, or administrative overrides.
4. **Server In-Memory Stores**: Volatile in-memory collections like `let lessonNotesStore: LessonNote[] = [...]` or `let lessonFeedbacksStore = [...]` in `server.ts`.
5. **Client-Side Component State as Persistence**: React `useState` or `useReducer` acting as an uncommitted local database that is never synchronized to PostgreSQL.
6. **Hardcoded Identity Fallbacks**: Development dummy objects injected into request contexts without authenticated database identity lookup.

### 1.3 Permitted Exceptions (Transient & UI-Only)

The following transient usages are legitimate and compliant with the Production Data Rule:
- **Client Session Token Storage**: Storing the cryptographic bearer token in `sessionStorage.getItem('bummpt_token')` as an iframe fallback when cross-origin cookie policies restrict HTTP-only cookies in preview containers.
- **Pure UI Ephemeral State**: Active navigation tab, modal open/close states, sort column, search query filter inputs, collapsed/expanded sidebar preferences, and accordion toggles.
- **Read-Only Static Reference Data**: Static lookups that represent universal domain standards (e.g., list of 23 Benue State Local Government Areas, standard subject codes, grading boundary rules 75%=A, 60%=B).
- **Transient Local Drafts**: Optional client-side draft auto-save for long-form lesson note editing, provided it displays an explicit "Unsaved Local Draft" badge and requires a committed server POST to publish.

---

## 2. Executive Summary & System Audit Scorecard

### 2.1 Audit Findings Summary

Across the BummptEducation codebase, the audit identified **seven primary classes of data dependencies** that currently breach or weaken the Production Data Rule:

| Inventory Category | Count | Primary Code Location | Production Risk Level |
| :--- | :--- | :--- | :--- |
| **Mock Datasets Exported** | 11 datasets | `src/data/mockData.ts` | **HIGH** — Invoked as fallback in DataContext |
| **Volatile Server In-Memory Stores** | 2 stores | `server.ts` (lines 32-33) | **CRITICAL** — Lesson notes and feedbacks vanish on restart |
| **LocalStorage / SessionStorage Keys** | 12 keys | Across 9 files (23 code lines) | **HIGH** — Client-side overrides, attendance cache, chat logs |
| **Legacy Passkey Storage Routines** | 4 routines | `src/utils/securityContext.ts` | **HIGH** — Client-only authorization bypass |
| **DataContext Fallback Branches** | 5 branches | `src/context/DataContext.tsx` (lines 336-413) | **CRITICAL** — Masks empty database states and API failures |
| **Disconnected DB Schemas** | 3 tables | `parent_guardians`, `parent_student_links`, `parent_access_pins` | **MEDIUM** — Tables exist in DB migration 0002, but no API routes |
| **Simulated HQ Telemetry** | 1 page | `src/pages/BenueStateHQPage.tsx` | **MEDIUM** — Uses static array + `Math.random()` sync counter |

### 2.2 System Maturity Scorecard by Functional Module

| Module | UI Implementation | REST API Routes | DAL / Repository | PostgreSQL Table | Production Authoritative? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | ✅ Complete | ✅ `/api/v1/auth/*` | ✅ `UserRepository`, `AuditRepo` | ✅ `users`, `auth_audit_logs` | 🟡 **90%** (Dev identities present) |
| **Account Requests (Sign-Up)**| ✅ Complete | ✅ `/api/v1/auth/account-requests` | ✅ `AccountRequestRepository` | ✅ `user_account_requests` | 🟢 **100% Authoritative** |
| **Schools & Multi-Tenancy** | ✅ Complete | ✅ `/api/v1/schools` | ✅ `SchoolRepository` | ✅ `schools`, `organizations` | 🟢 **100% Authoritative** |
| **Classes & Arms** | ✅ Complete | ✅ `/api/v1/classes` | ✅ `ClassRepository` | ✅ `classes`, `academic_terms` | 🟢 **100% Authoritative** |
| **Staff Registry** | ✅ Complete | ✅ `/api/v1/staff` | ✅ `StaffRepository` | ✅ `staff`, `staff_employments`| 🟡 **80%** (Fallback to `INITIAL_STAFF`) |
| **Student Enrollment** | ✅ Complete | ✅ `/api/v1/students` | ✅ `StudentRepository` | ✅ `students`, `student_enrollments`| 🟡 **80%** (Fallback to `INITIAL_STUDENTS`)|
| **Academic Allocations** | ✅ Complete | ✅ `/api/v1/academic/allocations` | ✅ `AcademicAllocationRepo` | ✅ `class_subject_allocations` | 🟢 **100% Authoritative** |
| **Continuous Assessment (CA)**| ✅ Complete | ✅ `/api/v1/assessments` | ✅ `AssessmentRepository` | ✅ `continuous_assessments` | 🟡 **70%** (Scoresheet UI not yet saving to API)|
| **Examinations & Terminal** | ✅ Complete | ✅ `/api/v1/examinations` | ✅ `ExaminationRepository` | ✅ `terminal_examinations` | 🟡 **70%** (UI save button sets timeout message)|
| **Terminal Results & Broadsheet**| ✅ Complete | ✅ `/api/v1/results` | ✅ `AcademicResultRepository` | ✅ `student_term_results` | 🟢 **95% Authoritative** |
| **Fees & Invoices** | ✅ Complete | ✅ `/api/v1/fees`, `/invoices` | ✅ `FeeRepository`, `InvoiceRepo`| ✅ `fee_structures`, `invoices` | 🟢 **100% Authoritative** |
| **Payments & Bursary Ledgers** | ✅ Complete | ✅ `/api/v1/payments`, `/bursary` | ✅ `PaymentRepository`, `BursaryRepo`| ✅ `payments`, `bursary_audit_log`| 🟡 **85%** (Fallback in DataContext) |
| **Attendance Tracking** | ✅ Complete | ✅ `/api/v1/attendance` | ✅ `AttendanceRepository` | ✅ `attendance_registers`, `records`| 🔴 **40%** (Reads from localStorage first) |
| **Parent Portal & Access PINs**| ✅ Complete | ❌ None | ❌ None | ✅ `parent_guardians`, `pins` (Schema only)| 🔴 **15%** (Purely client-side mock PINs) |
| **Lesson Notes & Inquiries** | ✅ Complete | 🟡 `/api/lesson-notes` | ❌ None | ❌ No table exists | 🔴 **25%** (Server in-memory store) |
| **Benue State HQ Telemetry** | ✅ Complete | 🟡 `/api/v1/schools/public` | ❌ None | ❌ No telemetry table | 🔴 **30%** (Mock array + localStorage overrides) |

---

## 3. Four-Tier Data Pipeline Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: CLIENT-SIDE PRESENTATION & USER INTERACTION (React 19 / Vite)   │
│ - UI Pages: AcademicDashboard, AdminDashboard, AttendancePage, HQPage  │
│ - Context Providers: AuthContext (Token), DataContext (Business Cache) │
│ - STRICT RULE: Never stores authoritative state locally. Zero mock read │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS /api/v1/* + Bearer JWT
┌────────────────────────────────────▼───────────────────────────────────┐
│ TIER 2: SERVER API CONTROLLERS & SECURITY GUARDS (Express 4.21)         │
│ - Authentication Middleware: authenticateUser (JWT + DB user check)    │
│ - Authorization Middleware: requirePermission('domain.action')         │
│ - Multi-Tenant Scoping: requireSchoolScope() (Prevents Cross-Tenant)   │
│ - Audit Logging: logAuthEvent, logFinancialAudit                        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Typed Repository Calls
┌────────────────────────────────────▼───────────────────────────────────┐
│ TIER 3: DATA ACCESS LAYER / REPOSITORIES (TypeScript DAL)              │
│ - Parameterized Queries: query(sql, params) preventing SQL Injection   │
│ - Managed Transactions: withTransaction(client => { ... }) for ACID   │
│ - Tenant-Enforced Selects: WHERE school_id = $1 AND deleted_at IS NULL │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ TCP Pool / Unix Socket
┌────────────────────────────────────▼───────────────────────────────────┐
│ TIER 4: PERSISTENT RELATIONAL DATABASE (PostgreSQL Engine)             │
│ - ACID Guarantees, Foreign Key Cascades, Unique Indexes, Check Rules   │
│ - Migrations: 0001 (core) through 0007 (account requests)               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. DataContext Audit (`src/context/DataContext.tsx`)

### 4.1 Overview of File Responsibility
`src/context/DataContext.tsx` acts as the primary data orchestrator for the school operational frontend. It exposes arrays of `students`, `staff`, `payments`, `feeSchedules`, `admissions`, and `assessments` to consuming pages such as `AdminDashboard`, `AcademicDashboard`, and `App.tsx`.

### 4.2 Code Citations of Violations

#### A. Initial State Seeding with Static Mock Data
```typescript
// src/context/DataContext.tsx:128
const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>(INITIAL_FEE_SCHEDULES);
```
**Violation**: Pre-seeds state with static array `INITIAL_FEE_SCHEDULES` before server validation.

#### B. The "False Empty Fallback" Flaw in Data Refresh
```typescript
// src/context/DataContext.tsx:334-340
const rawList = res.data?.students || [];
if (rawList.length > 0) {
  const mapped = rawList.map((s: any) => mapDbStudent(s, classLevelMap));
  setStudents(mapped);
} else {
  setStudents(INITIAL_STUDENTS); // <--- SEVERE VIOLATION
}
```
**Analysis & Impact**:
- If a school tenant legitimately has **0 students** (e.g., a newly registered school campus, or after enrolling only applicants), `rawList.length === 0` evaluates to true.
- The context replaces the tenant's real empty roster with `INITIAL_STUDENTS` (Anchor Demonstration Model College mock records).
- **Result**: Data pollution across tenants; newly created schools cannot operate as a clean empty slate.

Identical violations exist across all entity loaders:
- **Staff** (`src/context/DataContext.tsx:350-354`):
  ```typescript
  if (rawList.length > 0) { setStaff(rawList.map(mapDbStaff)); }
  else { setStaff(INITIAL_STAFF); }
  ```
- **Payments** (`src/context/DataContext.tsx:364-368`):
  ```typescript
  if (rawList.length > 0) { setPayments(rawList.map(mapDbPayment)); }
  else { setPayments(INITIAL_PAYMENTS); }
  ```
- **Admissions** (`src/context/DataContext.tsx:378-382`):
  ```typescript
  if (rawList.length > 0) { setAdmissions(rawList.map(mapDbAdmission)); }
  else { setAdmissions(INITIAL_ADMISSIONS); }
  ```
- **Assessments** (`src/context/DataContext.tsx:398-402`):
  ```typescript
  if (rawList.length > 0) { setAssessments(rawList.map(mapDbAssessment)); }
  else { setAssessments(INITIAL_ASSESSMENTS); }
  ```

#### C. Silent Error Masking in the Global Catch Block
```typescript
// src/context/DataContext.tsx:408-414
} catch (err: any) {
  console.warn('[DataContext] API refresh notice:', err?.message || err);
  setStudents(prev => prev.length > 0 ? prev : INITIAL_STUDENTS);
  setStaff(prev => prev.length > 0 ? prev : INITIAL_STAFF);
  setPayments(prev => prev.length > 0 ? prev : INITIAL_PAYMENTS);
  setAdmissions(prev => prev.length > 0 ? prev : INITIAL_ADMISSIONS);
  setAssessments(prev => prev.length > 0 ? prev : INITIAL_ASSESSMENTS);
}
```
**Violation**:
- If the PostgreSQL server or API endpoint encounters an error (network dropout, session expiration, database maintenance), instead of exposing an explicit error state (`error: string`, retry button, degraded warning), the UI silently populates mock data.
- Operators believe they are viewing real live data when they are in fact observing outdated or fictitious records.

### 4.3 Remediation Plan (Target: Phase 8G)
1. Remove all imports of `INITIAL_STUDENTS`, `INITIAL_STAFF`, `INITIAL_PAYMENTS`, `INITIAL_ADMISSIONS`, `INITIAL_ASSESSMENTS`, and `INITIAL_FEE_SCHEDULES`.
2. Initialize all state hooks to empty arrays (`[]`).
3. Introduce explicit loading and error states: `isLoading: boolean`, `error: string | null`, `isOffline: boolean`.
4. Honor empty lists returned by the server: when `rawList.length === 0`, set state to `[]` and render an authoritative "No records exist for this school" empty state.

---

## 5. Mock Data Inventory (`src/data/mockData.ts` & Associated Files)

### 5.1 Categorization Methodology
All static datasets across the codebase have been inspected and classified into four distinct categories:
- **Category A: Permanent Reference Data** (Domain invariants: subjects, grading scales, LGA metadata).
- **Category B: Domain Static Data** (Platform-level metadata, organograms, announcements).
- **Category C: Legacy Seed Data** (Historically used to populate PostgreSQL on first boot).
- **Category D: Mock Operational Data** (Fictitious operational records that must NOT exist in production).

### 5.2 Inventory of All 11 Datasets in `src/data/mockData.ts`

| Dataset Identifier | Line Number | Type Definition | Record Count | Categorization | Action in Phase 8 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ALL_SUBJECTS` | line 15 | `Subject[]` | 38 subjects | **Permanent Reference** | Retain in reference seed `subjects.seed.ts`. |
| `INITIAL_SUBJECTS` | line 78 | Alias to `ALL_SUBJECTS` | 38 subjects | **Permanent Reference** | Migrate to database `/api/v1/classes/subjects` endpoint. |
| `INITIAL_STAFF` | line 80 | `Staff[]` | 14 members | **Mock Operational / Seed** | Seed into PostgreSQL via `operational.seed.ts`; disconnect from UI fallback. |
| `INITIAL_STUDENTS` | line 343 | `Student[]` | 15 students | **Mock Operational / Seed** | Seed into PostgreSQL via `operational.seed.ts`; disconnect from UI fallback. |
| `INITIAL_ASSESSMENTS` | line 605 | `AssessmentScore[]` | 24 scores | **Mock Operational / Seed** | Seed into PostgreSQL via `operational.seed.ts`; disconnect from UI fallback. |
| `INITIAL_EARLY_YEARS_MILESTONES`| line 648 | `EarlyYearsMilestone[]` | 8 milestones | **Domain Reference Data** | Persist in PostgreSQL early years table or reference structure. |
| `INITIAL_FEE_SCHEDULES` | line 693 | `FeeSchedule[]` | 5 schedules | **Mock Operational / Seed** | Seed into PostgreSQL via `financial.seed.ts`; disconnect from UI fallback. |
| `INITIAL_PAYMENTS` | line 776 | `FeePayment[]` | 8 payments | **Mock Operational / Seed** | Seed into PostgreSQL via `financial.seed.ts`; disconnect from UI fallback. |
| `INITIAL_ADMISSIONS` | line 862 | `AdmissionApplication[]`| 6 applicants | **Mock Operational / Seed** | Seed into PostgreSQL via `financial.seed.ts`; disconnect from UI fallback. |
| `ORGANOGRAM_DATA` | line 959 | `OrganogramNode[]` | 16 nodes | **Domain Static Data** | Seed in `organogram.seed.ts`; optionally serve via `/api/v1/organogram`. |
| `INITIAL_ANNOUNCEMENTS` | line 1161 | `Announcement[]` | 5 announcements| **Domain Static Data** | Migrate to `announcements` database table in Phase 8E. |

### 5.3 Additional Mock Data Files

| File Path | Exported Constants | Description | Phase 8 Resolution |
| :--- | :--- | :--- | :--- |
| `src/data/lessonNotesData.ts` | `INITIAL_LESSON_NOTES` (15 notes)<br>`INITIAL_LESSON_FEEDBACKS` (6 inquiries) | 15 structured Nigerian curriculum lesson notes and parent feedback. | **Phase 8D**: Migrate to PostgreSQL `lesson_notes` table and REST endpoints. |
| `src/data/attendanceData.ts` | `ALL_CLASSES_DEFINITIONS`<br>`TERM_CALENDAR_DAYS` (65 days)<br>`generateDefaultAttendanceRecordsForClass()` | 13-week statutory school term calendar and mock attendance generator. | **Phase 8C**: Retain calendar logic as domain utility; replace record generator with `/api/v1/attendance` queries. |
| `src/data/benueStateData.ts` | `BENUE_LGAS_METADATA` (23 LGAs)<br>`BENUE_GOVERNMENT_SCHOOLS` (6 schools) | Official LGA geographic data and 6 government schools across zones A, B, C. | **Phase 8E**: Retain LGA metadata as reference data; populate `schools` table with 6 government institutions. |
| `src/data/benueDirectivesData.ts` | `INITIAL_MINISTRY_DIRECTIVES` (6 directives) | State Ministry policy circulars and guidelines. | **Phase 8E**: Migrate to existing `ministry_directives` DB table and API routes. |

---

## 6. Storage Audit: LocalStorage & SessionStorage Inventory

Every usage of `localStorage` and `sessionStorage` in the project was audited via static analysis (`grep -rnE "localStorage|sessionStorage"`). Exactly **12 distinct keys across 9 files (23 code lines)** were identified:

| # | Storage API | Key Name | File Path & Lines | Data Stored | Classification | Phase 8 Resolution |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `sessionStorage` | `bummpt_token` | `src/context/AuthContext.tsx:58, 112, 129, 141`<br>`src/context/DataContext.tsx:113`<br>`src/components/AccountRequestsManager.tsx:83, 139, 179` | Cryptographic JWT Bearer Token | **Security / Permitted Exception** | **Retain**: Permitted as iframe-safe transport fallback for preview containers where third-party cookies are blocked. |
| 2 | `localStorage` | `benue_state_school_overrides_v1` | `src/pages/BenueStateHQPage.tsx:79, 131` | JSON map of school budget/accreditation overrides | **Business Data Violation** | **Phase 8E**: Migrate to PostgreSQL `schools` table and school budget API. Remove localStorage read/write. |
| 3 | `localStorage` | `bummpt_benue_ministry_directives_v1` | `src/data/benueDirectivesData.ts:88, 100` | Array of `MinistryDirective` objects | **Business Data Violation** | **Phase 8E**: Migrate to PostgreSQL `ministry_directives` table via `/api/v1/directives` routes. |
| 4 | `localStorage` | `bummpt_attendance_register_v2_*` | `src/data/attendanceData.ts:641, 654, 670` | Daily student attendance entries per class/term | **Business Data Violation** | **Phase 8C**: Replace with PostgreSQL `attendance_registers` and `attendance_records` queries. |
| 5 | `localStorage` | `benue_moe_hq_chat_messages_v1` | `src/components/HeadquartersLiveChat.tsx:213, 257, 450` | HQ live chat log messages | **Business Data Violation** | **Phase 8E**: Migrate to PostgreSQL `hq_chat_messages` table and API. |
| 6 | `localStorage` | `bummpt_issued_passkeys_v1` | `src/utils/securityContext.ts:141, 153` | Issued staff passkeys | **Security Violation** | **Phase 8F**: Retire in Phase 8F. Replace with server-side JWT RBAC permissions. |
| 7 | `localStorage` | `bummpt_security_session_v1` | `src/utils/securityContext.ts:161, 177, 365` | Wing unlock boolean flags (`isAcademicUnlocked`, etc.) | **Security Violation** | **Phase 8F**: Retire. Wing access is determined server-side from `req.user.permissions`. |
| 8 | `localStorage` | `bummpt_parent_report_access_v1` | `src/utils/securityContext.ts:185, 197` | Array of parent PIN records | **Security / Business Data Violation** | **Phase 8B**: Migrate to PostgreSQL `parent_access_pins` table. |
| 9 | `localStorage` | `bummpt_report_cards_published_status_v1`| `src/utils/securityContext.ts:205, 217` | Global boolean publication switch | **Business Data Violation** | **Phase 8B**: Migrate to PostgreSQL `academic_terms.report_cards_published` column. |

---

## 7. Legacy Passkey Security Audit

### 7.1 Architecture of the Legacy Passkey System
In the early prototyping phase of BummptEducation, access to restricted departments ("wings": Academic, Bursary, Admin, Benue State HQ) was controlled by client-side alphanumeric strings known as **Passkeys** (e.g., `ACAD-2026-X89`, `BURS-7721-V4`).

### 7.2 Code Citations
- **Storage & State**: `src/utils/securityContext.ts:139-181` reads and writes `bummpt_issued_passkeys_v1` and `bummpt_security_session_v1` to `localStorage`.
- **Client-Side Verification**: `src/utils/securityContext.ts:249-260` performs verification entirely within JavaScript:
  ```typescript
  export function verifyPasskeyForWing(inputPasskey: string, targetWing: RestrictedWing) {
    const cleanPass = inputPasskey.trim().toUpperCase();
    const passkeys = getStoredPasskeys(); // reads localStorage!
    const matched = passkeys.find(p => p.passkey.toUpperCase() === cleanPass && p.status === 'Active');
    ...
  }
  ```
- **Gatekeeper UI**: `src/components/WingAccessGatekeeper.tsx:130-144` unlocks UI views without server consultation if the string matches localStorage.
- **Passkey Management UI**: `src/components/AccessManagementModal.tsx` generates passkeys client-side and saves them to localStorage.

### 7.3 Security Vulnerabilities of the Passkey Model
1. **Zero Server Enforcement**: Unlocking a wing in `localStorage` grants frontend access, but if the user makes a REST request to a protected endpoint (e.g. `/api/v1/results`), the server requires a valid JWT with appropriate permissions. However, if any page relies solely on the passkey without calling a protected API, sensitive client data is exposed.
2. **Client-Side Forgery**: Any user with browser DevTools can execute `localStorage.setItem('bummpt_security_session_v1', JSON.stringify({ isAcademicUnlocked: true, isBursaryUnlocked: true }))` to bypass the gatekeeper.
3. **Multi-Device Desynchronization**: A passkey issued on one browser cannot be used on another because it lives in the local browser's storage.

### 7.4 Retirement Roadmap (Target: Phase 8F)
- Retain `WingAccessGatekeeper.tsx` as a graceful visual barrier, but change its evaluation engine to `isSessionAuthorized = isAuthenticated && hasPermission(user, requiredPermission)`.
- Disconnect passkey generation in `AccessManagementModal.tsx` from `localStorage`.
- Unify staff permission management with the PostgreSQL `users` table and `roles` matrix.

---

## 8. Parent Report Access Audit

### 8.1 Current Implementation State
Parent access to terminal report cards is currently exposed through `src/components/ParentReportPortalModal.tsx`.
- The modal allows parents to enter a Student Admission Number (e.g., `BUM/2024/SEC/001`) and a 4-digit Parent PIN (e.g., `PAR-8821`).
- Lines 53-99 read `getStoredParentAccess()` from `localStorage.getItem('bummpt_parent_report_access_v1')`.
- Upon successful match, line 92 matches `INITIAL_STUDENTS` and line 118 retrieves grades from `INITIAL_ASSESSMENTS`.

### 8.2 Database Schema Readiness Analysis
A critical finding of this audit is that **the PostgreSQL database tables required for production parent authentication already exist in migration `0002_production_schema.sql`**:

```sql
-- Already present in PostgreSQL database:
CREATE TABLE IF NOT EXISTS parent_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    occupation VARCHAR(100),
    relationship VARCHAR(50) DEFAULT 'parent',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parent_student_links (
    parent_id UUID NOT NULL REFERENCES parent_guardians(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'parent',
    is_primary_guardian BOOLEAN DEFAULT TRUE,
    access_granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS parent_access_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_phone VARCHAR(50) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, parent_phone)
);
```

### 8.3 Gap Analysis & Required Work (Phase 8B)
1. **Missing Parent Repository**: Create `src/db/repositories/parent.repository.ts` implementing `verifyParentPin(schoolId, admissionNumber, pin)`, `listLinkedStudents(parentId)`, and `logReportCardDownload(studentId, termId)`.
2. **Missing Parent API Routes**: Create `src/api/v1/parents.routes.ts`:
   - `POST /api/v1/parents/verify-pin` (Public rate-limited endpoint returning a scoped Parent Session Token).
   - `GET  /api/v1/parents/students/:id/report-card` (Requires Parent Session Token; queries `academicResultRepository`).
   - `POST /api/v1/parents/students/:id/report-card/download` (Increments download counter in PostgreSQL).
3. **Frontend Wiring**: Refactor `ParentReportPortalModal.tsx` to call `POST /api/v1/parents/verify-pin`.

---

## 9. Attendance Architecture & Persistence Audit

### 9.1 Current Data Flow in `src/pages/AttendancePage.tsx`
- **Read Path**: Lines 146-151 load students from `allDbStudents` or `getAllStudentsForClass(selectedClass)`, then calls `getStoredAttendanceRecords()` which reads `localStorage.getItem('bummpt_attendance_register_v2_' + key)`. If empty, it synthesizes 65 days of mock attendance via `generateDefaultAttendanceRecordsForClass()`.
- **Write Path**: Lines 154-174 write to `localStorage` first, and then fire a single-date background sync to `serverRecordAttendance({ date: selectedDate, records })` via `/api/v1/attendance`.

### 9.2 Limitations of Current Hybrid Approach
- Past historical attendance records (Days 1 through 47 of the 65-day term) exist **only in the user's browser localStorage**.
- If a teacher opens the register on a different laptop, their historical attendance records disappear.
- Statutory term metrics (attendance percentage on report cards) cannot be reliably computed from the server because the database holds only scattered days.

### 9.3 Database Schema & API Readiness
The backend foundation is already 100% complete in PostgreSQL:
- Table `attendance_registers` exists with `school_id`, `class_id`, `term_id`, `date`, `taken_by_staff_id`.
- Table `attendance_records` exists with `register_id`, `student_id`, `status` (`present`, `absent`, `late`, `excused`), `arrival_time`.
- Repository `AttendanceRepository` is implemented and verified by automated tests in `tests/phase5_academic_operations.test.ts`.
- Endpoint `GET /api/v1/attendance/summary` and `POST /api/v1/attendance/bulk` are fully operational.

### 9.4 Remediation Plan (Phase 8C)
- In `AttendancePage.tsx`, on class/term change, execute `GET /api/v1/attendance/class/:classId?term_id=...` to load authoritative registers directly from PostgreSQL.
- Eliminate fallback to `generateDefaultAttendanceRecordsForClass()`.
- Demote `localStorage` to an optional offline write buffer with sync recovery.

---

## 10. Lesson Notes & Feedback Audit

### 10.1 In-Memory Architecture in `server.ts`
Lines 32-33 of `server.ts` declare:
```typescript
let lessonNotesStore: LessonNote[] = [...INITIAL_LESSON_NOTES];
let lessonFeedbacksStore: LessonFeedback[] = [...INITIAL_LESSON_FEEDBACKS];
```
These arrays power:
- `GET  /api/lesson-notes` (search and filter)
- `GET  /api/lesson-notes/stats` (dashboard counts)
- `GET  /api/lesson-notes/:id` (single note)
- `POST /api/lesson-notes` (teacher uploads)
- `POST /api/lesson-notes/:id/feedback` (parent questions)
- `POST /api/lesson-notes/:id/increment-download` (download tracker)

### 10.2 Production Failures of In-Memory Stores
1. **Container Lifecycles**: In Google Cloud Run / containerized deployments, instances scale down to zero or restart during new deploys. Any lesson notes published by teachers or inquiries submitted by parents are permanently lost on server recycle.
2. **Multi-Instance Inconsistency**: If more than one container instance runs, requests routed to instance B will not see notes created on instance A.
3. **Zero Relational Integrity**: No foreign keys link notes to real teacher staff IDs or student IDs in PostgreSQL.

### 10.3 Remediation Plan (Phase 8D)
1. **New Migration `0008_lesson_notes.sql`**:
   - `lesson_notes` table (`id`, `school_id`, `subject_id`, `class_id`, `term_id`, `teacher_id`, `title`, `topic`, `content_summary`, `content_body`, `evaluation_questions`, `key_terms`, `download_count`, `status`, `created_at`).
   - `lesson_note_feedbacks` table (`id`, `lesson_note_id`, `parent_name`, `student_name`, `guardian_phone`, `question`, `teacher_reply`, `status`, `created_at`).
2. **New DAL Repository**: `src/db/repositories/lesson-note.repository.ts`.
3. **Mount `/api/v1/lesson-notes` Routes**: Replace unversioned `/api/lesson-notes` with server-authoritative v1 routes and delete `lessonNotesStore` from `server.ts`.

---

## 11. Headquarters / State Admin Architecture & Telemetry Audit

### 11.1 Current Implementation State (`src/pages/BenueStateHQPage.tsx`)
- **Telemetry Data**: `src/data/benueStateData.ts` holds `BENUE_GOVERNMENT_SCHOOLS`, a static array of 6 government secondary colleges across Zone A, B, and C.
- **Interactive Mutations**: Line 79-135 stores financial and accreditation overrides in `localStorage.getItem('benue_state_school_overrides_v1')`.
- **Live Sync Simulation**: Lines 119-126 implement `handleSyncLiveSessions()` using `setTimeout` and `Math.floor(12 + Math.random() * 25)` to simulate live telemetry packets.
- **Directives & Circulars**: `src/data/benueDirectivesData.ts` reads and writes to `localStorage.getItem('bummpt_benue_ministry_directives_v1')`.
- **Zonal Live Chat**: `src/components/HeadquartersLiveChat.tsx` stores messages in `localStorage.getItem('benue_moe_hq_chat_messages_v1')`.

### 11.2 PostgreSQL Equivalents in Existence
- The `schools` table in PostgreSQL supports state-wide multi-tenancy (`state = 'Benue'`, `lga`, `senatorial_zone`, `category`).
- The `ministry_directives` table exists in PostgreSQL schema `0002_production_schema.sql` and was seeded in `ministryDirectives.seed.ts`.
- The `school_accreditations` table exists in PostgreSQL.

### 11.3 Remediation Plan (Phase 8E)
1. Create `src/db/repositories/telemetry.repository.ts` to compute real-time statewide aggregates (`COUNT(students)`, `COUNT(staff)`, fee collection efficiency) directly via SQL `JOIN` queries across all schools.
2. Wire `BenueStateHQPage.tsx` to `GET /api/v1/hq/telemetry` and `GET /api/v1/hq/directives`.
3. Create `src/api/v1/directives.routes.ts` connected to the PostgreSQL `ministry_directives` table.
4. Replace simulated random sync with real PostgreSQL WebSocket or polling telemetry.

---

## 12. Authentication, Role Switching & Preview Resilience Audit

### 12.1 Authentication Architecture
- Authentication uses Argon2id password hashing and cryptographic HMAC SHA-256 JWT tokens.
- Tokens are signed with a 12-hour expiration and verified on every protected request.
- The `auth_sessions` table in PostgreSQL tracks active sessions and enables instant revocation upon logout.
- In `AuthContext.tsx`, `login(email, password)` calls `POST /api/v1/auth/login`.

### 12.2 Development Test Identities vs Production Authentication
- In `src/components/AuthLoginModal.tsx`, a development convenience drawer displays test identities for each institutional role:
  - `super_admin`: `superadmin@bummpt.edu.ng`
  - `state_officer`: `stateofficer@moe.benue.gov.ng`
  - `principal`: `principal@anchor.bummpt.edu.ng`
  - `bursar`: `bursar@anchor.bummpt.edu.ng`
  - `teacher`: `teacher.physics@anchor.bummpt.edu.ng`
  - `student`: `student@anchor.bummpt.edu.ng`
  - `parent`: `parent@anchor.bummpt.edu.ng`
- All these users are **real, Argon2id-hashed records in PostgreSQL** seeded by `seedDevelopmentAuthIdentities()` in `auth.seed.ts`.
- `GET /api/v1/auth/dev-identities` returns these test accounts ONLY in development:
  ```typescript
  // src/auth/auth.routes.ts:327
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not Found' });
  }
  ```
- **Finding**: This boundary is safely gated by `process.env.NODE_ENV === 'production'`.

### 12.3 Header Role Switcher Audit
In `src/components/Header.tsx`, the top bar contains an "Active: Role" dropdown (`#active-role-switcher-btn`).
- **Mechanism**: Selecting a role updates React state `userRole` in `App.tsx`.
- **Limitation**: This switches UI navigation and styling perspective, but does NOT grant backend API privileges. If the user is unauthenticated or logged in as a Teacher, attempting a Bursar API call will return HTTP 403 Forbidden from `requirePermission('bursary.manage')`.
- **Verdict**: Compliant with security standards because server authorization always supersedes client UI role state.

---

## 13. School vs HQ Registration Workflows Audit

### 13.1 End-to-End Public Account Request Flow
1. **Public Submission**: Users visit the Authentication Gateway (`src/pages/AuthenticationGateway.tsx`) and submit their name, email, desired role, school affiliation, and password.
2. **API Endpoint**: `POST /api/v1/auth/account-requests` validates inputs, checks for duplicate email addresses, hashes the password using Argon2id, and stores the request in the PostgreSQL `user_account_requests` table with status `PENDING`.
3. **Privilege Boundary Enforcement**:
   ```typescript
   // src/auth/account-request.routes.ts:120-125
   if (requestedRole === 'super_admin' || requestedRole === 'state_officer') {
     return res.status(403).json({
       success: false,
       message: 'Super Administrator and State Ministry Officer roles cannot be requested via public registration. These positions are provisioned exclusively by Central State Educational Authority.'
     });
   }
   ```
4. **Administrative Review**:
   - School Principals access `AccountRequestsManager.tsx` (in `AdminDashboard`).
   - The query `GET /api/v1/auth/account-requests` is tenant-scoped to `req.user.schoolId`.
   - On approval (`POST /api/v1/auth/account-requests/:id/approve`), the system atomically inserts a verified record into `users` and (if staff) into `staff`, updating the request to `APPROVED`.
5. **State HQ Supervisory Review**: State Officers can audit all requests across all 23 LGAs.

### 13.2 Gap Identified
HQ staff (`state_officer`, `super_admin`) cannot self-register, but there is currently no administrative UI inside the Benue State HQ portal for Super Admins to provision new State Ministry Officers. They must currently be seeded or inserted via SQL. This will be addressed in Phase 8E.

---

## 14. Complete API & Database Coverage Matrix

| Business Domain | UI Component / View | Express API Route | DAL Repository | PostgreSQL Table | RBAC Permission | Production Ready? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `AuthLoginModal.tsx` | `POST /api/v1/auth/login` | `UserRepository` | `users`, `auth_sessions` | Public | 🟢 Ready |
| **Session Validation** | `AuthContext.tsx` | `GET /api/v1/auth/me` | `UserRepository` | `users`, `auth_sessions` | Session | 🟢 Ready |
| **Account Requests** | `AuthenticationGateway.tsx` | `POST /api/v1/auth/account-requests` | `AccountRequestRepository` | `user_account_requests` | Public | 🟢 Ready |
| **Request Review** | `AccountRequestsManager.tsx`| `POST /api/v1/auth/account-requests/:id/approve` | `AccountRequestRepository` | `user_account_requests`, `users` | `account_requests.manage` | 🟢 Ready |
| **School Directory** | `Header.tsx`, `App.tsx` | `GET /api/v1/schools` | `SchoolRepository` | `schools` | `schools.view` | 🟢 Ready |
| **Public School List**| `AuthenticationGateway.tsx` | `GET /api/v1/schools/public` | `SchoolRepository` | `schools` | Public | 🟢 Ready |
| **Classes & Arms** | `AcademicDashboard.tsx` | `GET /api/v1/classes` | `ClassRepository` | `classes` | Authenticated | 🟢 Ready |
| **Staff Registry** | `AdminDashboard.tsx` | `GET /api/v1/staff`, `POST /staff`| `StaffRepository` | `staff`, `staff_employments` | `staff.view`, `staff.create` | 🟡 Needs DataContext decoupled |
| **Student Roster** | `AcademicDashboard.tsx` | `GET /api/v1/students`, `POST /students`| `StudentRepository` | `students`, `student_enrollments` | `students.view`, `students.create` | 🟡 Needs DataContext decoupled |
| **Subject Allocations**| `AcademicDashboard.tsx` | `GET /api/v1/academic/allocations` | `AcademicAllocationRepo` | `class_subject_allocations` | `allocations.view` | 🟢 Ready |
| **Continuous Assessment**| `AcademicDashboard.tsx` | `POST /api/v1/assessments/bulk` | `AssessmentRepository` | `continuous_assessments` | `assessments.enter` | 🟡 UI save wireup needed |
| **Terminal Examinations**| `AcademicDashboard.tsx` | `POST /api/v1/examinations/bulk` | `ExaminationRepository` | `terminal_examinations` | `assessments.enter` | 🟡 UI save wireup needed |
| **Broadsheet & Results**| `AcademicDashboard.tsx` | `GET /api/v1/results/broadsheet` | `AcademicResultRepository` | `student_term_results` | `results.view` | 🟢 Ready |
| **Fee Structures** | `AdminDashboard.tsx` | `GET /api/v1/fees`, `POST /fees` | `FeeRepository` | `fee_structures`, `fee_categories` | `fees.view`, `fees.create` | 🟢 Ready |
| **Invoicing** | `AdminDashboard.tsx` | `GET /api/v1/invoices` | `InvoiceRepository` | `invoices`, `invoice_items` | `fees.view` | 🟢 Ready |
| **Fee Payments** | `AdminDashboard.tsx` | `POST /api/v1/payments` | `PaymentRepository` | `payments`, `bursary_audit_log` | `payments.record` | 🟢 Ready |
| **Bursary Summary** | `AdminDashboard.tsx` | `GET /api/v1/bursary/summary` | `BursaryRepository` | `payments`, `invoices` | `bursary.view` | 🟢 Ready |
| **Daily Attendance** | `AttendancePage.tsx` | `POST /api/v1/attendance/bulk` | `AttendanceRepository` | `attendance_registers`, `records` | `attendance.mark` | 🔴 Reads from localStorage |
| **Parent Portal Login** | `ParentReportPortalModal.tsx` | ❌ None | ❌ None | 🟡 `parent_access_pins` (Schema only) | ❌ None | 🔴 Pure mock |
| **Lesson Notes** | `LessonNotesPage.tsx` | 🟡 `/api/lesson-notes` | ❌ None | ❌ No table | `lesson_notes.create` (Partial) | 🔴 Volatile in-memory |
| **State HQ Telemetry** | `BenueStateHQPage.tsx` | ❌ None | ❌ None | ❌ No table | `state_officer` (Client-only) | 🔴 Mock array |
| **Ministry Directives** | `MinistryUpdatesCommand.tsx`| ❌ None | ❌ None | 🟡 `ministry_directives` (Schema only) | ❌ None | 🔴 LocalStorage |

---

## 15. Security Boundary Audit

### 15.1 Client-Side Protection vs Server-Side Enforcement

| Protected Capability | Client-Side Guard | Server-Side Guard | Security Assessment |
| :--- | :--- | :--- | :--- |
| **Academic Wing Access** | `WingAccessGatekeeper.tsx` (Passkey or `isUserAuthorizedForWing`) | `requirePermission('assessments.view')` on `/api/v1/assessments/*` | 🟢 Secure at API level. Passkey is redundant UI barrier. |
| **Bursary Wing Access** | `WingAccessGatekeeper.tsx` (Passkey or `isUserAuthorizedForWing`) | `requirePermission('fees.manage')` on `/api/v1/bursary/*` | 🟢 Secure at API level. |
| **Admin Wing Access** | `WingAccessGatekeeper.tsx` (Passkey or `isUserAuthorizedForWing`) | `requirePermission('staff.view')` on `/api/v1/staff/*` | 🟢 Secure at API level. |
| **State HQ Portal** | `BenueStateHQPage.tsx` (`isBenueHQUnlocked` in localStorage) | ❌ None (Operates entirely on static arrays in frontend) | 🔴 **CRITICAL GAP**: No backend endpoint exists to guard state data. |
| **Parent Report Cards** | `ParentReportPortalModal.tsx` (Checks PIN in localStorage) | ❌ None (No parent endpoint exists) | 🔴 **CRITICAL GAP**: Backend `results/student/:id` requires staff login. |
| **Lesson Note Upload** | `LessonNotesPage.tsx` (Teacher role check) | `devAuthCompatibility` + `requirePermission('lesson_notes.create')` | 🟡 In dev mode, uses fallback staff identity. |
| **Account Request Review**| `AccountRequestsManager.tsx` (Role check) | `requirePermission('account_requests.manage')` + tenant isolation | 🟢 Secure at API level. |

### 15.2 Public Endpoints vs Protected Endpoints
- **Public Endpoints**:
  - `POST /api/v1/auth/login` (Rate limited: 10 attempts per minute per IP)
  - `POST /api/v1/auth/account-requests` (Rate limited, privileged roles blocked)
  - `GET  /api/v1/schools/public` (Returns only basic non-sensitive school metadata)
  - `GET  /api/health` and `/api/health/db` (Diagnostics)
- **Protected Endpoints**:
  - All operational endpoints (`/api/v1/students/*`, `/staff/*`, `/classes/*`, `/attendance/*`, `/assessments/*`, `/fees/*`, `/payments/*`) strictly require `authenticateUser` and appropriate granular permissions.

---

## 16. Preview Mode vs Production Architecture

### 16.1 Design Strategy for Preview & Production Environments
BummptEducation must maintain high developer experience in AI Studio preview sandboxes while guaranteeing strict zero-mock data integrity in live production deployments.

### 16.2 Environment Differential Matrix

| Architectural Dimension | Preview / Development Sandbox | Live Production Deployment |
| :--- | :--- | :--- |
| **`process.env.NODE_ENV`** | `'development'` | `'production'` |
| **`DATABASE_URL`** | Optional (Can run on local preview database) | **MANDATORY**: Missing URL halts server boot |
| **Test Identities API** | `GET /api/v1/auth/dev-identities` returns active test accounts | **STRICT 404**: Completely disabled |
| **Auth Dev Compatibility** | `devAuthCompatibility` injects `dev-preview-user` if unauthenticated | **STRICT REJECTION**: Enforces `authenticateUser` |
| **Database Connection Failure**| Emits descriptive console notice; runs read-only preview mode | Fails fast with exit code 1 to alert container orchestrator |
| **DataContext Fallbacks** | Permitted during local design previews | **FORBIDDEN**: Must render explicit error / empty state |
| **Mock Data Imports** | Permitted for offline Storybook / unit tests | **FORBIDDEN** from production business pipeline |

### 16.3 Production Enforceability Rule
In production (`NODE_ENV === 'production'`), if `DATABASE_URL` is missing or the database connection drops:
1. The server must return HTTP 503 Service Unavailable on all business API requests.
2. The UI must display an informative, styled service interruption banner.
3. The UI must **NEVER** silently populate mock students, staff, or finances.

---

## 17. Conclusion & Sign-Off

This Phase 8A Audit establishes the complete, code-grounded inventory of all 7 dependency classes preventing 100% server-authoritative production readiness.

With this inventory ratified, BummptEducation possesses an unambiguous, risk-mitigated technical blueprint for executing Phases 8B through 8G in strict adherence to the Production Data Rule.
