# BummptEducation — Phase 10D: First-School Onboarding & Institutional Readiness

## 1. Overview & Phase Boundary

Phase 10D establishes the controlled, provider-neutral, repeatable server-side workflow for onboarding provisioned schools in PostgreSQL until they are institutionally configured and verified as ready for a separately authorized operational launch.

### Strict Core Principle
> **"Onboarding verifies persisted configuration; it does not create it."**

Onboarding does not create, repair, infer, or select academic configuration during evaluation. Administrators use the standard class creation (`POST /api/v1/classes`) and subject allocation (`POST /api/v1/academic/allocations`) endpoints to configure classrooms and teaching assignments explicitly. Dedicated administrative screens are deferred to a later phase.

### Authoritative School Configuration vs Demo-Only Seed Data

| Property | Authoritative School Configuration | Demo-Only Seed Data |
| :--- | :--- | :--- |
| **Origin** | Explicitly entered by authenticated administrators | Hardcoded fixtures in development/test scripts |
| **Persistence** | Persisted in PostgreSQL relational schema | Seed scripts only (`src/db/seed/`) |
| **Validation** | Strict server-side validation & foreign keys | Unvalidated mock or sample payloads |
| **Scoping** | Strictly scoped to tenant organization & school | Demo or simulated global presets |
| **Production Use** | Evaluated and verified by onboarding readiness | **Never** applied by production onboarding, routes, startup, provisioning, or readiness |

### Strict Non-Goals & Architectural Boundaries in Phase 10D
- **OPERATIONAL LAUNCH: NOT AUTHORIZED** — Onboarding readiness (`ONBOARDING_READY`) verifies foundational compliance only; operational launch requires distinct ministerial directive in Phase 10E.
- **LIVE PRODUCTION DATABASE: NOT YET PROVISIONED** — Destructive tests execute strictly against dedicated test databases (`phase10d_*_test`).
- **REAL SCHOOL DATA: NOT YET LOADED** — Zero real institutional records are populated during onboarding.
- **REAL STUDENT DATA: NOT YET LOADED** — Strict zero student record boundary (`students` count = 0, `fee_invoices` count = 0).
- **Zero Seeder Coupling** — Demo seeders (`auth.seed.ts`, `operational.seed.ts`, `financial.seed.ts`, `lessonNotes.seed.ts`) are completely isolated and never invoked.
- **Migration System Integrity** — All 11 migrations (`0001` through `0011`) remain checksum-verified and immutable.

---

## 2. Authoritative Staff Registry vs Deprecated Legacy Columns

The institutional staff registry (`users` joined with `staff`) is the sole server-authoritative source of truth for school leadership:
- **School Principal**: Verified through `users.role = 'principal'` atomically linked to `staff.user_id = users.id`, with `users.is_active = TRUE`, `staff.is_active = TRUE`, and matching `school_id`.
- **Deprecated Columns**: `schools.principal_name`, `schools.vice_principal_academic`, and `schools.bursar_name` are deprecated legacy text columns. Direct updates to these fields via onboarding endpoints are strictly rejected with `400 LEGACY_LEADERSHIP_FIELDS_PROHIBITED`.
- **Display Labeling**: The onboarding UI and API responses identify staff-derived leadership with `(From staff registry)`. Legacy text columns cannot override active staff registry records.

---

## 3. The 7-Step Institutional Readiness Lifecycle

Each provisioned school in PostgreSQL is evaluated through a 7-step checklist in `src/auth/onboarding.service.ts`:

### Step 1: School Identity & Institutional Profile
- **Fields Verified**:
  - `name`: Authoritative registered school name (>= 3 chars)
  - `code`: Unique institutional code
  - `organization`: Parent organization reference (`organizations` table)
  - `lga`: Host Local Government Area in Benue State (e.g., Makurdi, Gboko)
  - `senatorial_zone`: Assigned Benue senatorial zone (Zone A, B, or C)
  - `category`: School category (e.g., Secondary, Primary, Basic Education)
  - `contact`: Institutional phone number and correspondence email
  - `address`: Campus physical address in host LGA (>= 5 chars)
  - `established_year`: Official year of establishment (1840 to current year)
  - `is_active`: Active status in the institutional registry (`TRUE`)
- **API**: `PATCH /api/v1/schools/:id/onboarding/profile` (requires `schools.manage` and `requireSchoolScope()`)

### Step 2: Authorized School Leadership & Staff Registry
- **Requirements**:
  - Verified Principal user account (`users.role = 'principal'`, `users.school_id = school.id`, active)
  - Linked Principal staff registry entry (`staff.user_id = users.id`, `staff.school_id = school.id`, active)
  - Active teaching staff registry entries (`staff.staff_type = 'Teaching'`, `is_active = TRUE`)
  - Authoritative identity boundary (no reliance on client simulation presets)

### Step 3: Academic Calendar & Term Configuration
- **Requirements**:
  - Active academic session configured in PostgreSQL (`academic_sessions.is_current = TRUE`)
  - Active statutory term configured (`academic_terms.is_current = TRUE`)
  - Statutory term belongs to the active session (`term.session_id = session.id`)
  - Resumption and vacation dates defined

### Step 4: Class & Subject Configuration
- **Requirements**:
  - At least one authoritative classroom created in `classes` (`school_id = target_school`)
  - All classes must have active form masters from the same school assigned (`c.form_master_id` -> active `staff` of same school)
  - Duplicate form-master assignments across classes in the same school are rejected
  - Approved state curriculum subjects available in registry (`subjects` table)

### Step 5: Academic Responsibilities & Staff Allocations (Session- & Term-Specific)
- **Requirements**:
  - Qualifying class-subject allocations must exist for the school's **active academic session and active academic term**.
  - Historical allocations from past sessions or terms do not satisfy current readiness; if a school has historical allocations but zero valid allocations for the active term, readiness remains `ONBOARDING_INCOMPLETE`.
  - Allocation creation (`POST /api/v1/academic/allocations`) requires explicit inputs:
    - `school_id`: Explicit target school ID
    - `class_id`: Authoritative classroom belonging to target school
    - `subject_id`: Approved state curriculum subject
    - `teacher_id`: Explicit active teaching staff member from the same school (never null, never inferred)
    - `academic_session_id`: Explicit session ID matching the term (session inference is prohibited)
    - `academic_term_id`: Explicit term ID belonging to the specified session
    - `periods_per_week`: Explicit integer between 1 and 30 (no implicit default)
  - Allocations referencing classes outside the school, inactive teachers, cross-school teachers, or with term/session mismatches fail validation closed with HTTP 400.

### Step 6: Review & Verification of Onboarding Completeness
- **Requirements**:
  - All 5 preceding configuration sections evaluated and verified against persisted relational records
  - Zero student records boundary verified (`students` count = 0, `fee_invoices` count = 0)
  - Formal administrative sign-off executed via `POST /api/v1/schools/:id/onboarding/verify`
  - Creates a durable `SCHOOL_ONBOARDING_VERIFIED` audit log in `auth_audit_logs`

### Step 7: Explicit Operational Launch Gate
- **Status Distinction**:
  - Institutional Onboarding State: transitions from `ONBOARDING_INCOMPLETE` to `ONBOARDING_READY`
  - Separate Operational Launch Gate: remains strictly `OPERATIONAL_LAUNCH_NOT_AUTHORIZED`
  - Onboarding readiness verifies that institutional profile, staff, calendar, classes, and active-term allocations are complete and valid; operational launch requires distinct ministerial authorization in Phase 10E.

---

## 4. Multi-School Tenant Isolation & Mutation Route Auditing

Read permissions (`schools.view`, `students.view`, `attendance.view`, `allocations.view`) never authorize mutations:
- **Class Mutations**: `POST /api/v1/classes` and `PATCH /api/v1/classes/:id` require `schools.manage` and `requireSchoolScope()`.
- **Allocation Mutations**: `POST /api/v1/academic/allocations`, `PATCH /api/v1/academic/allocations/:id`, and `DELETE /api/v1/academic/allocations/:id` require `allocations.manage` and `requireSchoolScope()`.
- **Onboarding Mutations**: `PATCH /api/v1/schools/:id/onboarding/profile` and `POST /api/v1/schools/:id/onboarding/verify` require `schools.manage` and `requireSchoolScope()`.
- **Role Boundary**: Teachers, bursars, exam officers, parents, and students receive `403 FORBIDDEN` on all mutation endpoints, even when their `school_id` matches.
- **Entity Route Scoping**: Entity routes using `:id` parameters (e.g., `GET /api/v1/results/student/:id`) enforce school scoping in their own queries to block cross-school inspection.
- **Deprecated Endpoint**: `POST /api/v1/schools/:id/onboarding/academic-structure` returns `410 ENDPOINT_DEPRECATED` with zero writes.

---

## 5. Audit Logging Architecture

All onboarding modifications, blocked attempts, and verification transitions record structured entries in `auth_audit_logs`:
- `SCHOOL_PROFILE_UPDATED`: Records actor, school ID, organization ID, and sanitized field modifications.
- `SCHOOL_ONBOARDING_VERIFICATION_REJECTED`: Records blocked verification attempts with specific missing prerequisites.
- `SCHOOL_ONBOARDING_VERIFIED`: Records authorized verification sign-off, actor, school ID, and completion timestamp.
- Plaintext passwords, credentials, and database connection strings are never logged.

---

## 6. Testing Architecture & Destructive Database Safety Guard

Phase 10D tests implement a strict fail-closed database safety guard (`assertSafeTestDatabaseUrl`):

### Safe-Stop Result vs Full Dedicated Test DB Run

| Aspect | Safe-Stop Result | Full Dedicated Test DB Run |
| :--- | :--- | :--- |
| **Trigger** | Run without `PHASE10D_TEST_DATABASE_URL` or `ALLOW_DESTRUCTIVE_PHASE10D_TESTS=true` | Run with dedicated test DB URL (e.g. `bummpt_phase10d_test`) and `ALLOW_DESTRUCTIVE_PHASE10D_TESTS=true` |
| **Static Checks** | Validates code boundaries, seeder isolation, CLI exit 1 on missing target | Validates code boundaries, seeder isolation, CLI exit 1 on missing target |
| **Database Actions** | **Zero writes, zero schema drops, zero table creations**; halts safely | Drops/creates isolated test schema, runs migrations 0001–0011, executes full tests |
| **Pass/Fail Meaning** | Confirms safety guard works and refuses unsafe DB; **not a full passing integration suite** | **Full passing integration suite**; exercises all 28 Phase 10D tests and Stage 2A regression cases |
| **DATABASE_URL Policy** | Never touched, never used as fallback | Never touched, never used as fallback |

---

## 7. Operator Workflow & CLI Procedures

### Step 1: Provision Organization & School (Phase 10C)
```bash
npm run provision:bootstrap
npm run provision:verify
```

### Step 2: Check Initial Onboarding Status (Read-Only)
```bash
npm run onboarding:verify -- BNS-MKD-001
# Or via environment variables:
SCHOOL_CODE="BNS-MKD-001" npm run onboarding:verify
```
*Requires an explicit school target (exits with code 1 before database access if missing). Reports `ONBOARDING_INCOMPLETE` until configuration is complete.*

### Step 3: Configure Institutional Profile & Academic Structure
Through standard API endpoints:
1. Update institutional profile via `PATCH /api/v1/schools/:id/onboarding/profile`.
2. Configure active academic session and term in PostgreSQL.
3. Explicitly create classes via `POST /api/v1/classes` (assigning active same-school form masters).
4. Explicitly allocate subjects via `POST /api/v1/academic/allocations` (explicit teacher, explicit session/term, explicit `periods_per_week` 1–30).

### Step 4: Optional Read-Only Advisory Scan
```bash
npm run onboarding:verify -- BNS-MKD-001 --scan-legacy
```
*Read-only inspection that flags obsolete naming conventions ("Primary N Gold", "JSS N Alpha", "SSS N Science") or principal allocations. Output is labeled "advisory — review manually" and never alters data.*

### Step 5: Execute Onboarding Verification Sign-Off
```bash
POST /api/v1/schools/:id/onboarding/verify
```
*Transitions school status to `ONBOARDING_READY`. Operational launch remains `OPERATIONAL_LAUNCH_NOT_AUTHORIZED`.*

---

## 8. Phase 10D Stage 2B: Tenant-Scoped Readiness & Academic Calendar Integrity

### Academic Calendar Conflict Detection & Fail-Closed Behavior
- **No Unscoped `LIMIT 1`**: Academic calendar lookups never select an arbitrary record using `LIMIT 1` when multiple records are active.
- **Fail-Closed on Configuration Conflicts**:
  - If multiple academic sessions have `is_current = TRUE`, the evaluator marks Step 3 as incomplete with a clear diagnostic: `Configuration conflict: Multiple (...) academic sessions are marked current`.
  - If multiple academic terms have `is_current = TRUE`, Step 3 fails closed with `Configuration conflict: Multiple (...) academic terms are marked current`.
  - If no active session or term exists, Step 3 fails closed with `No active academic session/term configured`.
  - If the active term's `session_id` does not match the active session's `id`, Step 3 fails closed with `Active term does not belong to active session`.
- **Statutory Schema Invariant**: Under migrations 0001–0011, `academic_sessions` and `academic_terms` are state-wide shared reference fixtures (`isMultiTenant = false`). The database schema intentionally does not contain a `school_id` column on either table, maintaining statutory calendar alignment across all Benue State schools.

### Allocation API Tenant Ownership Enforcements
In `POST /api/v1/allocations` and `allocateSubject`:
1. **Target School Scope**: Caller's school must match target `school_id` unless the caller possesses platform-level authorization (`super_admin` or `state_officer`). Cross-school allocation requests by non-platform users are rejected with HTTP 403 `CROSS_SCHOOL_FORBIDDEN`.
2. **Target School Existence**: Target school must exist in PostgreSQL and be active; non-existent schools are rejected with HTTP 400 (`SCHOOL_NOT_FOUND`).
3. **Class Tenant Scope**: Specified class must exist and belong strictly to the target school (`classes.school_id = targetSchoolId`). Cross-school class assignments are rejected with HTTP 400 (`CROSS_SCHOOL_VIOLATION`).
4. **Teaching Staff Tenant Scope**: Teacher must exist in `staff`, have `status = 'ACTIVE'`, and belong strictly to the target school (`staff.school_id = targetSchoolId`). Inactive teachers and cross-school staff members are rejected with HTTP 400 (`TEACHER_INACTIVE` or `CROSS_SCHOOL_TEACHER_VIOLATION`).
5. **Session/Term Integrity**: Explicit `academic_session_id` and `academic_term_id` are required (zero inference). Term must belong to the session (`term.session_id = session.id`), rejecting mismatches with HTTP 400 (`SESSION_TERM_MISMATCH`).
6. **Periods Per Week**: Explicit integer from 1 through 30 required (`INVALID_PERIODS`).
7. **Duplicate Prevention**: Rejects duplicate allocations with HTTP 409 (`DUPLICATE_ALLOCATION`).

### Active-Term Readiness vs Historical Advisory Findings
- **Active-Term Scope**: Readiness Step 5 strictly evaluates allocations matching the resolved active academic session and active academic term (`academic_session_id = activeSessionId AND academic_term_id = activeTermId`).
- **Isolation from Historical Anomalies**: Historical allocations from previous terms or sessions do NOT count towards active-term readiness and do NOT block an otherwise-valid current-term configuration.
- **Advisory Diagnostics**: Any anomalies in historical allocations (such as missing subjects or reassigned staff from past academic years) are captured and reported separately under `details.historicalInvalidAllocationsCount` as read-only advisory notices without blocking onboarding completion.


