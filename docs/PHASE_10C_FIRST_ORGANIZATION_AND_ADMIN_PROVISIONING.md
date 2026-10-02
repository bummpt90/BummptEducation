# BummptEducation — Phase 10C: First Organization & Administrator Provisioning

## 1. Overview & Phase Boundary

Phase 10C establishes the controlled, provider-neutral, repeatable server-side procedure for provisioning:

1. **The first authoritative Organization / Tenant** (`organizations` table).
2. **The first authoritative School** under that Organization (`schools` table).
3. **The first authorized Administrator** (`users` table + linked `staff` identity where applicable).
4. **Strict RBAC & Tenant Context Relationships** across `organizations`, `schools`, `users`, `staff`, and `user_account_requests`.

### Strict Non-Goals in Phase 10C
- **No live cloud database provisioning** is performed in this phase.
- **No real student, parent, fee, invoice, payment, attendance, assessment, or mark records** are loaded during organization, school, or administrator provisioning.
- **No demo/development seeders** (`auth.seed.ts`, `operational.seed.ts`, `financial.seed.ts`, `lessonNotes.seed.ts`) are ever invoked by production provisioning or bootstrap commands.

---

## 2. Three-Tier Role & Tenant Scope Model

BummptEducation enforces a strict three-tier hierarchy defined in `src/auth/roles.ts`:

### Tier A — Platform-Level Administration (`PLATFORM_ADMIN`)
| Role | `school_id` Requirement | `organization_id` Scope | Linked `staff` Record | Description |
| :--- | :--- | :--- | :--- | :--- |
| `super_admin` | Optional (`NULL` permitted) | Platform / Organization-wide | Not required | Central Executive / Platform Super Administrator with full system & provisioning authority |
| `state_officer` | Optional (`NULL` permitted) | State / Ministry-wide | Not required | Benue State Ministry of Education / SUBEB Officer with statewide oversight & directive authority |

### Tier B — Organization / School Administration (`TENANT_SCHOOL_ADMIN`)
| Role | `school_id` Requirement | `organization_id` Scope | Linked `staff` Record | Description |
| :--- | :--- | :--- | :--- | :--- |
| `principal` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | **Required (Atomic)** | School Principal & Chief Accounting Officer for an individual school campus |
| `vice_principal` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | **Required (Atomic)** | Vice Principal (Academic) scoped to a single school |
| `headmistress` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | **Required (Atomic)** | Headmistress / Headmaster (Primary Basic Education) scoped to a single school |
| `head_kindergarten` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | **Required (Atomic)** | Head of Early Childhood & Kindergarten scoped to a single school |

### Tier C — School Operational Users (`SCHOOL_OPERATIONAL`)
| Role | `school_id` Requirement | `organization_id` Scope | Linked Domain Identity | Description |
| :--- | :--- | :--- | :--- | :--- |
| `exam_officer` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | `staff` record (Atomic) | Examination & Broadsheet Records Officer |
| `bursar` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | `staff` record (Atomic) | Chief Bursar & Head of School Finance |
| `admissions_officer` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | `staff` record (Atomic) | Registrar & Admissions Officer |
| `teacher` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | `staff` record (Atomic) | Subject Teacher & Form Master |
| `parent` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | `parent_guardians` record | Parent / Legal Guardian |
| `student` | **Required (`NOT NULL`)** | Inherited from `schools.organization_id` | `students` record | Enrolled Student |

---

## 3. Authoritative Provisioning Architecture

All provisioning operations are implemented in `src/auth/provisioning.service.ts` and reuse existing repositories (`organizationRepository`, `schoolRepository`, `userRepository`, `StaffRepository`), `withTransaction`, Argon2id (`hashPassword`, `validatePasswordPolicy`), and `logAuthEvent`.

### 3.1 Role-Agnostic One-Time Bootstrap & Concurrency Guarantee (`bootstrapFirstTenantAndAdmin`)
- **Transaction-Level Serialization**: Competing bootstrap attempts are serialized at the database level using a PostgreSQL transaction-level advisory lock (`pg_advisory_xact_lock(202610, 1003)`) acquired at the start of the transaction before checking bootstrap state.
- **Role-Agnostic One-Time Completion Rule**: Bootstrap is considered completed if **any** organization (`organizations`), school (`schools`), user (`users`), or successful `BOOTSTRAP_PROVISIONED` audit record (`auth_audit_logs` with `status = 'SUCCESS'`) exists. This rule is strictly independent of whether the initial administrator was provisioned as a `super_admin`, `state_officer`, or `principal`.
- **Atomic Execution & Rollback**: Organization creation, optional first school creation, primary administrator creation, optional school principal creation, linked `staff` records, and `BOOTSTRAP_PROVISIONED` audit logging execute inside a single PostgreSQL transaction. Any validation or constraint failure rolls back all records created by that attempt. Blocked attempts record a durable `PROVISIONING_BLOCKED` audit entry outside the rolled-back transaction.

### 3.2 First Organization Provisioning (`provisionOrganization`)
- Validates `name` (3–255 chars) and normalized uppercase `code` (`^[A-Z0-9][A-Z0-9_-]{2,49}$`).
- Enforces uniqueness across both `code` (`ORGANIZATION_CODE_EXISTS`) and `name` (`ORGANIZATION_NAME_EXISTS`).
- **Access Control**: Restricted strictly to an authenticated `super_admin` or the one-time controlled bootstrap runner (`isBootstrap: true`). Never exposed as a public endpoint.
- Records `ORGANIZATION_PROVISIONED` in `auth_audit_logs`.

### 3.3 First School Provisioning (`provisionSchool`)
- Validates `organizationId` (must reference an existing record in `organizations`), `name`, unique normalized uppercase `code`, `lga`, `senatorialZone`, `category`, and active status (`is_active`).
- Prevents duplicate school codes (`SCHOOL_CODE_EXISTS`).
- Creates **only** the authoritative `schools` row — never inserts students, parents, fees, assessments, attendance, or marks.
- **Access Control**: Restricted strictly to `super_admin` or controlled bootstrap (`POST /api/v1/provisioning/schools` and `POST /api/v1/schools`).
- Records `SCHOOL_PROVISIONED` in `auth_audit_logs`.

### 3.4 First Administrator Provisioning (`provisionAdministrator`)
- Normalizes `email` (lowercase) and prevents duplicates (`EMAIL_ALREADY_EXISTS`).
- Validates password policy (>= 8 chars, <= 128 chars) and hashes with **Argon2id** (`19 MiB` memory cost, `2` iterations). Plaintext passwords are never stored or logged.
- Enforces `validateRoleTenantScope(role, schoolId)`:
  - `super_admin` and `state_officer` may be provisioned with `schoolId: null`.
  - `principal` and all school-level roles **must** specify a valid active `schoolId` whose `organization_id` matches the target organization.
- For staff-backed roles (`principal`, `vice_principal`, `headmistress`, `head_kindergarten`, `exam_officer`, `bursar`, `admissions_officer`, `teacher`), atomically creates the linked `staff` row (`user_id`, `organization_id`, `school_id`, `staff_id_number`, `status = 'Active'`, `is_active = TRUE`) inside the same PostgreSQL transaction and synchronizes `principal_name` / `vice_principal_academic` / `bursar_name` on the school record when applicable.
- Records `ADMIN_PROVISIONED` in `auth_audit_logs`.

### 3.5 Controlled Account Request Approval (`account-request.routes.ts`)
- Public requests (`POST /api/v1/auth/account-requests`) strictly block `super_admin` and `state_officer` (`403 PRIVILEGED_ROLE_FORBIDDEN`).
- Administrative approval (`POST /api/v1/auth/account-requests/:id/approve`) validates role-to-school scope (`validateRoleTenantScope`), verifies the target school is active, prevents Principals from approving requests for other schools or escalating to executive roles, and atomically creates both the `users` record and the linked `staff` record (or `parent_guardians` record for parents) inside `withTransaction`.

---

## 4. Controlled CLI Bootstrap & Verification Procedure

### Step 1: Apply & Verify Database Migrations (Phase 10B)
```bash
npm run db:migrate
npm run db:migrate:verify
```

### Step 2: Run One-Time First Organization & Administrator Bootstrap
`npm run provision:bootstrap` is a **one-time controlled operation** for initializing an empty, freshly migrated database. Set the required explicit bootstrap environment variables using placeholder-free operator secrets at runtime (never hardcoded in source files or committed to version control):
```bash
BOOTSTRAP_ORG_NAME="Example State Education Board" \
BOOTSTRAP_ORG_CODE="EX-EDU-HQ" \
BOOTSTRAP_SCHOOL_NAME="Example Model Secondary School" \
BOOTSTRAP_SCHOOL_CODE="EX-SCH-001" \
BOOTSTRAP_SCHOOL_LGA="Makurdi" \
BOOTSTRAP_SCHOOL_ZONE="Zone B (Benue North-West)" \
BOOTSTRAP_SCHOOL_CATEGORY="Secondary" \
BOOTSTRAP_ADMIN_EMAIL="admin@example.invalid" \
BOOTSTRAP_ADMIN_PASSWORD="<replace-with-strong-secret-password>" \
BOOTSTRAP_ADMIN_NAME="Initial Platform Administrator" \
BOOTSTRAP_ADMIN_ROLE="super_admin" \
npm run provision:bootstrap
```
- **Fail-Closed Guarantee**: Bootstrap is considered completed if **any** organization, school, user, or successful `BOOTSTRAP_PROVISIONED` audit record already exists in PostgreSQL (independent of whether the initial administrator was a `super_admin`, `state_officer`, or `principal`). Any subsequent invocation of `npm run provision:bootstrap` fails closed with `BOOTSTRAP_ALREADY_COMPLETED` (exit code `1`) and records `PROVISIONING_BLOCKED` in `auth_audit_logs`.

### Step 3: Verify Provisioning Readiness (Read-Only)
```bash
npm run provision:verify
```
Verifies that at least one organization and one active administrator exist, all school-scoped accounts have a valid `school_id`, and all active school principals have a linked `staff` identity record.

---

## 5. Dedicated Test-Database Requirements for Phase 10C Verification Suite

The destructive Phase 10C verification suite (`tests/phase10c.provisioning.test.ts` / `npm run test:phase10c`) enforces a fail-closed test-database guard before any schema reset or migration:

1. **Dedicated Test Database URL Required**: `PHASE10C_TEST_DATABASE_URL` must be explicitly provided. The test suite **never** falls back to the ordinary `DATABASE_URL`.
2. **Explicit Destructive Opt-In Required**: `ALLOW_DESTRUCTIVE_PHASE10C_TESTS=true` must be explicitly set.
3. **Production Mode Prohibited**: Execution is strictly refused if `NODE_ENV=production`.
4. **Verified Test-Designated Database Name**: Both the URL pathname and the live PostgreSQL connection (`SELECT current_database()`) must resolve to an explicitly test-designated database name (such as `bummpt_phase10c_test`) and must be distinct from `DATABASE_URL`, `neondb`, `postgres`, or any production database.
5. **Isolated Test Schema Restriction**: Destructive setup and cleanup only target the approved isolated schema pattern (`^phase10c_[a-z0-9_]+_test$`, specifically `phase10c_provisioning_test`) and refuse `public`, `production`, or any unrelated schema.
6. **Safe Stop When Unavailable**: If a safe, dedicated test database is not configured or available, the suite stops safely without performing any destructive operations against any database.

### Illustrative Test Execution (Never Use Production Credentials)
```bash
NODE_ENV="test" \
ALLOW_DESTRUCTIVE_PHASE10C_TESTS="true" \
PHASE10C_TEST_DATABASE_URL="postgresql://TEST_USER:<placeholder-test-password>@localhost:5432/bummpt_phase10c_test?sslmode=disable" \
npm run test:phase10c
```

---

## 6. Production Status Summary

- **PHASE 10C CODE STATUS**: READY
- **LIVE PRODUCTION DATABASE**: NOT YET PROVISIONED
- **REAL SCHOOL DATA**: NOT YET LOADED
- **REAL STUDENT DATA**: NOT YET LOADED
