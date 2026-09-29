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

### 3.1 First Organization Provisioning (`provisionOrganization`)
- Validates `name` (3–255 chars) and normalized uppercase `code` (`^[A-Z0-9][A-Z0-9_-]{2,49}$`).
- Enforces uniqueness across both `code` (`ORGANIZATION_CODE_EXISTS`) and `name` (`ORGANIZATION_NAME_EXISTS`).
- **Access Control**: Restricted strictly to an authenticated `super_admin` or the one-time controlled bootstrap runner (`isBootstrap: true`). Never exposed as a public endpoint.
- Records `ORGANIZATION_PROVISIONED` in `auth_audit_logs`.

### 3.2 First School Provisioning (`provisionSchool`)
- Validates `organizationId` (must reference an existing record in `organizations`), `name`, unique normalized uppercase `code`, `lga`, `senatorialZone`, `category`, and active status (`is_active`).
- Prevents duplicate school codes (`SCHOOL_CODE_EXISTS`).
- Creates **only** the authoritative `schools` row — never inserts students, parents, fees, assessments, attendance, or marks.
- **Access Control**: Restricted strictly to `super_admin` or controlled bootstrap (`POST /api/v1/provisioning/schools` and `POST /api/v1/schools`).
- Records `SCHOOL_PROVISIONED` in `auth_audit_logs`.

### 3.3 First Administrator Provisioning (`provisionAdministrator`)
- Normalizes `email` (lowercase) and prevents duplicates (`EMAIL_ALREADY_EXISTS`).
- Validates password policy (>= 8 chars, <= 128 chars) and hashes with **Argon2id** (`19 MiB` memory cost, `2` iterations). Plaintext passwords are never stored or logged.
- Enforces `validateRoleTenantScope(role, schoolId)`:
  - `super_admin` and `state_officer` may be provisioned with `schoolId: null`.
  - `principal` and all school-level roles **must** specify a valid active `schoolId` whose `organization_id` matches the target organization.
- For staff-backed roles (`principal`, `vice_principal`, `headmistress`, `head_kindergarten`, `exam_officer`, `bursar`, `admissions_officer`, `teacher`), atomically creates the linked `staff` row (`user_id`, `organization_id`, `school_id`, `staff_id_number`, `status = 'Active'`, `is_active = TRUE`) inside the same PostgreSQL transaction and synchronizes `principal_name` / `vice_principal_academic` / `bursar_name` on the school record when applicable.
- Records `ADMIN_PROVISIONED` in `auth_audit_logs`.

### 3.4 Controlled Account Request Approval (`account-request.routes.ts`)
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
Set the required explicit bootstrap environment variables (never hardcoded in source files) and execute:
```bash
BOOTSTRAP_ORG_NAME="Benue State Ministry of Education & SUBEB" \
BOOTSTRAP_ORG_CODE="BNS-MOE-HQ" \
BOOTSTRAP_SCHOOL_NAME="Government Model Secondary School Makurdi" \
BOOTSTRAP_SCHOOL_CODE="BNS-MKD-001" \
BOOTSTRAP_SCHOOL_LGA="Makurdi" \
BOOTSTRAP_SCHOOL_ZONE="Zone B (Benue North-West)" \
BOOTSTRAP_SCHOOL_CATEGORY="Secondary" \
BOOTSTRAP_ADMIN_EMAIL="admin@moe.benuestate.gov.ng" \
BOOTSTRAP_ADMIN_PASSWORD="<strong-secret-password>" \
BOOTSTRAP_ADMIN_NAME="State Platform Administrator" \
BOOTSTRAP_ADMIN_ROLE="super_admin" \
npm run provision:bootstrap
```
- **Fail-Closed Guarantee**: If any `super_admin` user already exists in PostgreSQL, `npm run provision:bootstrap` fails closed with `BOOTSTRAP_ALREADY_COMPLETED` (exit code `1`) and records `PROVISIONING_BLOCKED` in `auth_audit_logs`.

### Step 3: Verify Provisioning Readiness (Read-Only)
```bash
npm run provision:verify
```
Verifies that at least one organization and one active administrator exist, all school-scoped accounts have a valid `school_id`, and all active school principals have a linked `staff` identity record.

---

## 5. Production Status Summary

- **PHASE 10C CODE STATUS**: READY
- **LIVE PRODUCTION DATABASE**: NOT YET PROVISIONED
- **REAL SCHOOL DATA**: NOT YET LOADED
