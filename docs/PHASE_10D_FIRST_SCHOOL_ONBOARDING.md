# BummptEducation — Phase 10D: First-School Onboarding & Institutional Readiness

## 1. Overview & Phase Boundary

Phase 10D establishes the controlled, provider-neutral, repeatable server-side workflow for onboarding provisioned schools in PostgreSQL until they are institutionally configured and verified as ready for a separately authorized operational launch.

### Strict Non-Goals in Phase 10D
- **No live cloud production database** is provisioned in this phase.
- **No real student, parent, fee, invoice, payment, attendance, assessment, or mark records** are loaded during onboarding.
- **No operational launch authorization** is granted merely because onboarding is complete.
- **No demo or development seeders** (`auth.seed.ts`, `operational.seed.ts`, `financial.seed.ts`, `lessonNotes.seed.ts`) are ever invoked by production onboarding or verification scripts.
- **No modification of Phase 10B migration SQL** (all 11 migrations 0001..0011 remain checksum-protected).

---

## 2. The 7-Step Onboarding Lifecycle & Checklist

Each provisioned school in PostgreSQL follows an authoritative 7-step onboarding checklist managed via `src/auth/onboarding.service.ts`:

### Step 1: School Identity & Institutional Profile
- **Fields Verified**:
  - `name`: Authoritative registered school name (>= 3 chars)
  - `code`: Unique institutional code (normalized uppercase)
  - `organization`: Parent organization reference (`organizations` table)
  - `lga`: Host Local Government Area in Benue State (e.g. Makurdi, Gboko, Otukpo)
  - `senatorial_zone`: Assigned zone (Zone A, Zone B, or Zone C)
  - `category`: School category (Secondary, Primary, Basic Education, Science & Technical)
  - `contact`: Institutional phone number and correspondence email
  - `address`: Campus physical address in the host LGA
  - `established_year`: Official year of establishment (1840 to current year)
  - `is_active`: Active status in the institutional registry (`TRUE`)
- **API**: `PATCH /api/v1/schools/:id/onboarding/profile`

### Step 2: Authorized School Leadership & Staff Registry
- **Requirements**:
  - Authorized School Principal user account (`users.role = 'principal'`, `users.school_id = school.id`, `users.is_active = TRUE`)
  - Relational `staff` record atomically linked to the principal (`staff.user_id = users.id`, `staff.school_id = school.id`, `staff.status = 'Active'`)
  - Teaching staff complement registered in PostgreSQL (`staff.staff_type = 'Teaching'`)
  - **Zero Simulation Reliance**: Staff identities originate exclusively from PostgreSQL records; frontend simulation presets (`SchoolSimulationContext`, `ActiveSchoolContextBar`) are strictly non-authoritative presentation preferences.

### Step 3: Academic Calendar & Term Configuration
- **Requirements**:
  - Active academic session configured in PostgreSQL (`academic_sessions.is_current = TRUE`)
  - Active statutory term configured (`academic_terms.is_current = TRUE`)
  - Resumption date and vacation date boundary definitions populated

### Step 4: Class & Subject Configuration
- **Requirements**:
  - At least one authoritative classroom/arm created in `classes` (`school_id = school.id`, level, arm, name, category, capacity)
  - Approved state curriculum subjects available in `subjects` table
- **API**: `POST /api/v1/schools/:id/onboarding/academic-structure` establishes canonical grade levels (e.g. JSS 1–3, SSS 1–3 or Basic 1–6)

### Step 5: Academic Responsibilities & Staff Allocations
- **Requirements**:
  - Class-subject allocations configured in `class_subject_allocations` for the current academic session and term
  - Qualified teaching staff assigned to allocations (`teacher_id` points to verified active `staff` of the same school)
  - Form master assigned to oversee classrooms where applicable

### Step 6: Review & Verification of Onboarding Completeness
- **Requirements**:
  - All 5 preceding configuration sections evaluated and verified against real PostgreSQL records
  - Zero student records boundary verified (`students` count = 0)
  - Formal administrative sign-off executed via `POST /api/v1/schools/:id/onboarding/verify`
  - Creates a durable `SCHOOL_ONBOARDING_VERIFIED` record in `auth_audit_logs`

### Step 7: Explicit Operational Launch Gate
- **Distinction**:
  - Onboarding Readiness Status: transitions from `ONBOARDING_INCOMPLETE` to `ONBOARDING_READY`
  - Operational Launch Status: remains strictly `OPERATIONAL_LAUNCH_NOT_AUTHORIZED`
  - Onboarding readiness verifies that institutional profile, staff, calendar, classes, and allocations are ready; operational launch requires distinct ministerial directive and live enrollment authorization in Phase 10E.

---

## 3. Existing Capabilities Reused vs Newly Implemented

| Domain | Existing Capability Reused | Newly Implemented in Phase 10D |
| :--- | :--- | :--- |
| **Schools & Tenants** | `schools` & `organizations` schema, `SchoolRepository` | Profile update API (`PATCH /api/v1/schools/:id/onboarding/profile`), institutional validation |
| **Leadership & Staff** | `users` & `staff` tables, `StaffRepository`, RBAC | Leadership verification engine, staff complement evaluation |
| **Academic Calendar** | `academic_sessions` & `academic_terms` tables | Calendar readiness evaluation |
| **Classes & Subjects** | `classes`, `subjects`, `class_subject_allocations` | Canonical structure initializer (`POST /api/v1/schools/:id/onboarding/academic-structure`) |
| **Onboarding Engine** | `withTransaction`, `logAuthEvent` | `src/auth/onboarding.service.ts`, 7-step checklist computation, fail-closed verification |
| **API Endpoints** | Express server, `authenticateUser` | `/api/v1/schools/:id/onboarding`, `/api/v1/onboarding` routes |
| **CLI Verification** | `npm run db:migrate:verify`, `npm run provision:verify` | `npm run onboarding:verify` (`src/db/cli/onboarding-verify.ts`) |
| **User Interface** | `AdminDashboard.tsx` tab infrastructure | `SchoolOnboardingChecklist.tsx` UI component, `'onboarding'` sub-tab |

---

## 4. Tenant Isolation & Authorization Rules

All onboarding operations enforce strict server-authoritative RBAC:
1. **Super Administrator & State Officer (`PLATFORM_ADMIN`)**:
   - May view, update profile, initialize structure, and verify onboarding for any school across the state.
2. **School Principal (`TENANT_SCHOOL_ADMIN`)**:
   - Scoped strictly to their own assigned `school_id`.
   - Any attempt to access or modify onboarding for another school returns `403 TENANT_ISOLATION_VIOLATION`.
3. **Other Roles & Public Callers**:
   - Denied access (`401 UNAUTHENTICATED` or `403 FORBIDDEN`).
4. **Client Preference Boundary**:
   - Client-side storage (`localStorage.bummpt_ActiveSchoolId_v1`) is strictly a UI presentation preference and cannot authorize access to operational or administrative data.

---

## 5. Audit Logging Specifications

All onboarding modifications and verification transitions record structured entries in `auth_audit_logs`:
- `SCHOOL_PROFILE_UPDATED`: Records actor, school ID, organization ID, and modified field names.
- `SCHOOL_ACADEMIC_STRUCTURE_INITIALIZED`: Records actor, school ID, classes created, and allocations created.
- `SCHOOL_ONBOARDING_VERIFIED`: Records actor, school ID, organization ID, `ONBOARDING_READY` status, and completion timestamp.
- `SCHOOL_ONBOARDING_VERIFICATION_REJECTED`: Records blocked verification attempt with missing prerequisite sections.

Plaintext passwords, secrets, and database connection strings are never logged.

---

## 6. Operator Workflow & CLI Procedures

### Step 1: Provision First Organization & Administrator (Phase 10C)
```bash
npm run provision:bootstrap
npm run provision:verify
```

### Step 2: Review Initial Onboarding Status (Read-Only)
```bash
SCHOOL_CODE="BNS-MKD-001" npm run onboarding:verify
```
*Reports `ONBOARDING_INCOMPLETE` until classes, calendar, and allocations are established.*

### Step 3: Complete Institutional Profile & Academic Setup
Through the Admin Dashboard (`/admin` -> "School Onboarding" tab) or API:
1. Review and update institutional contact info, address, established year.
2. Ensure active academic session and term are configured.
3. Initialize canonical classes and curriculum allocations.
4. Execute formal verification sign-off.

### Step 4: Verify Final Onboarding Readiness
```bash
SCHOOL_CODE="BNS-MKD-001" npm run onboarding:verify
```
*Exits with code `0` and confirms `ONBOARDING_READY`.*

---

## 7. What Remains for Phase 10E (Operational Launch)
- Live cloud database provisioning (e.g., Cloud SQL / production managed PostgreSQL).
- Ministerial operational launch directive and accreditation sign-off.
- Authoritative student admissions, enrollment batches, and parent PIN generation.
- Production SSL/TLS deployment and domain binding.

---

## 8. Declarations & Production Status

- **PHASE 10D CODE STATUS**: READY
- **LIVE PRODUCTION DATABASE**: NOT YET PROVISIONED
- **REAL SCHOOL DATA**: NOT YET LOADED
- **REAL STUDENT DATA**: NOT YET LOADED
- **PRODUCTION DEPLOYMENT**: NOT YET COMPLETED
