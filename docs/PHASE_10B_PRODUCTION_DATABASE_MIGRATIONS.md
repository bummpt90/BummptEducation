# BummptEducation — Phase 10B Production Database & Migration Procedure

## Status Declarations

```text
PHASE 10B CODE STATUS:
READY

LIVE PRODUCTION DATABASE:
NOT YET PROVISIONED

REAL SCHOOL DATA:
NOT YET LOADED
```

---

## 1. PostgreSQL Architecture

BummptEducation uses PostgreSQL as its single authoritative relational database engine across all multi-tenant institutional, academic, attendance, financial, parent, and Ministry oversight domains:

```text
Browser (React SPA)
   │
   ▼  HTTPS REST API (/api/v1/*)
Node.js / Express Backend Server
   │  • Server-only PostgreSQL Pool (src/db/client.ts & src/db/config.ts)
   │  • Atomic Transaction Wrapper (withTransaction: BEGIN / COMMIT / ROLLBACK)
   │  • Deterministic Schema Migrator & SHA-256 Checksum Verifier (src/db/migrator.ts)
   ▼  TLS-Encrypted TCP Connection (DATABASE_SSL=require)
PostgreSQL 15+ Authoritative Relational Database
```

- **Zero Direct Browser Connectivity:** Client/browser bundles never import `pg` and never receive `DATABASE_URL` or database credentials.
- **Connection Pooling:** Managed by `src/db/client.ts` (`getDatabasePool()`) using configurable pool limits (`DATABASE_POOL_SIZE`, default `10` in production, `5` in development; `5000ms` connection timeout; `30000ms` idle timeout).

---

## 2. Production Database Requirements

Any future production PostgreSQL instance provisioned for BummptEducation must satisfy the following provider-neutral baseline requirements:
- **Database Engine:** PostgreSQL 15 or higher.
- **Required PostgreSQL Extensions:** `pgcrypto` (for `gen_random_uuid()`) and `uuid-ossp`. Both are enabled idempotently in migration `0001`.
- **Transport Encryption:** Mandatory TLS/SSL (`DATABASE_SSL=require` or `DATABASE_SSL=true`). Unencrypted production connections (`DATABASE_SSL=disable` or `false`) are rejected at startup and by migration CLI commands.
- **Character Encoding & Timezone:** UTF-8 encoding (`UTF8`); all audit and lifecycle timestamps use timezone-aware `TIMESTAMPTZ`.
- **Transactional DDL Support:** Full ACID transactional DDL execution so each migration file runs atomically inside `BEGIN ... COMMIT`.

---

## 3. Required Environment Variables

| Variable | Production Requirement | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables fail-closed production database, SSL, and seeder lockouts. |
| `DATABASE_URL` | **Mandatory** | Server-only PostgreSQL connection URI (`postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require`). |
| `DATABASE_SSL` | **Mandatory (`require` or `true`)** | Enforces encrypted TLS transport to PostgreSQL in production (`disable` and `false` fail closed). |
| `DATABASE_POOL_SIZE` | Optional (Default `10` in prod) | Maximum concurrent connections in the server's PostgreSQL pool. |
| `DATABASE_IDLE_TIMEOUT_MS` | Optional (Default `30000`) | Milliseconds before an idle client in the pool is closed. |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Optional (Default `5000`) | Milliseconds to wait when acquiring a connection before failing. |

---

## 4. Migration Inventory

All SQL migrations reside in `src/db/migrations/` and are registered deterministically in `src/db/migrator.ts` (`MIGRATIONS`).

The 11 migrations contain no demo/reference seed `INSERT` operations and are safe to execute against a new empty database. Some migrations (such as `0004`, `0005`, `0006`, and `0009`) also contain controlled schema-transition/backfill `UPDATE` operations required to migrate existing records safely when evolving an already-populated schema (which are safe no-ops on an empty database):

| # | Filename | Purpose | Creates / Alters Tables (+ Controlled Backfills) | Indexes & Constraints | Seed / Business `INSERT`s | Safe for Empty Prod DB |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `0001` | `0001_initial_foundation.sql` | Enables `pgcrypto` & `uuid-ossp`; creates `schema_migrations`, `organizations`, and `schools`. | Creates `schema_migrations`, `organizations`, `schools` | PKs, unique codes, FK `schools.organization_id`, `idx_schools_code`, `idx_schools_lga` | **None (0 rows)** | **Yes** |
| `0002` | `0002_production_schema.sql` | Core multi-school relational schema across academic sessions, terms, users, classes, staff, students, parents, subjects, assessments, report cards, attendance, fees, admissions, lesson notes, and HQ telemetry. | Alters `schools`; creates 30 core domain tables | Foreign keys, composite `UNIQUE` constraints, `CHECK` constraints, and lookup indexes | **None (0 rows)** | **Yes** |
| `0003` | `0003_auth_and_identity_foundation.sql` | Adds authentication lockout/lifecycle columns to `users`; creates `user_sessions` and `auth_audit_logs`. | Alters `users`; creates `user_sessions`, `auth_audit_logs` | Session token hash & expiration indexes, lowercase email index, FK constraints | **None (0 rows)** | **Yes** |
| `0004` | `0004_operational_foundations.sql` | Adds organization scoping and granular name fields to `staff` and `students`; creates `student_enrollments`; backfills `organization_id` for any existing staff/student rows. | Alters `staff`, `students` (+ controlled `organization_id` backfill `UPDATE`); creates `student_enrollments` | `students_status_check`, unique `(student_id, academic_session_id, class_id)`, tenant indexes | **None (0 rows)** | **Yes** |
| `0005` | `0005_academic_operations_foundation.sql` | Adds session scoping to allocations/attendance/scores; creates `continuous_assessments` and `terminal_examinations`; backfills `academic_session_id` for existing rows. | Alters `class_subject_allocations`, `daily_attendance`, `assessment_scores` (+ controlled `academic_session_id` backfill `UPDATE`); creates `continuous_assessments`, `terminal_examinations` | Score range `CHECK` constraints (`0..10`, `0..60`), composite unique keys, session indexes | **None (0 rows)** | **Yes** |
| `0006` | `0006_admissions_fees_bursary_foundation.sql` | Enhances admissions, invoices, and payments; creates `fee_structures`, `student_fee_assessments`, `fee_invoice_items`, `bursary_awards`, and `financial_audit_logs`; backfills `academic_session_id` on existing admissions/invoices. | Alters `admission_applications`, `fee_invoices`, `fee_payments` (+ controlled `academic_session_id` backfill `UPDATE`); creates 5 financial/audit tables | Non-negative monetary `CHECK` constraints, unique `payment_reference` partial index, FKs | **None (0 rows)** | **Yes** |
| `0007` | `0007_account_requests_foundation.sql` | Creates `user_account_requests` table for controlled account request and approval workflows. | Creates `user_account_requests` | Status `CHECK` constraint (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), email/school indexes | **None (0 rows)** | **Yes** |
| `0008` | `0008_parent_identity_and_access.sql` | Extends parent tables with tenant scoping and PIN lockout counters; creates `parent_access_logs`. | Alters `parent_guardians`, `parent_student_links`, `parent_access_pins`; creates `parent_access_logs` | Tenant FKs, link status `CHECK` constraint, parent audit indexes | **None (0 rows)** | **Yes** |
| `0009` | `0009_attendance_server_authority.sql` | Extends `daily_attendance` with organization/term/enrollment FKs, backfills existing attendance references, enforces unique `(student_id, attendance_date)`, and creates `attendance_audit_logs`. | Alters `daily_attendance` (+ controlled `organization_id`/`term_id`/`enrollment_id` backfill `UPDATE`); creates `attendance_audit_logs` | `daily_attendance_student_date_unique`, multi-tenant attendance & audit indexes | **None (0 rows)** | **Yes** |
| `0010` | `0010_lesson_notes_and_inquiries.sql` | Hardens `lesson_notes` and creates `lesson_inquiries` and `lesson_note_audit_logs`. | Creates/alters `lesson_notes`, `lesson_inquiries`, `lesson_note_audit_logs` | Week range & download count `CHECK` constraints, tenant/subject/term indexes | **None (0 rows)** | **Yes** |
| `0011` | `0011_hq_telemetry_directives_messaging.sql` | Extends `hq_dispatches`, `hq_dispatch_replies`, and `ministry_directives`; creates `directive_acknowledgements` and `hq_audit_logs`. | Alters 3 HQ tables; creates `directive_acknowledgements`, `hq_audit_logs` | Audience & sender type `CHECK` constraints, unique `(directive_id, school_id)`, audit indexes | **None (0 rows)** | **Yes** |

---

## 5. Migration Tracking and Checksum Behavior

Implemented in `src/db/migrator.ts`:
1. **Tracking Table (`schema_migrations`):**
   - Columns: `id SERIAL PRIMARY KEY`, `version VARCHAR(100) UNIQUE NOT NULL`, `name VARCHAR(255) NOT NULL`, `checksum VARCHAR(64)`, `applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
2. **Deterministic SHA-256 Checksums (`computeMigrationChecksum()`):**
   - Each migration's SQL body is normalized (`\r\n` to `\n`, trimmed) and hashed with `SHA-256` to produce a 64-character hex digest.
3. **Deterministic Ordering (`validateMigrationOrdering()`):**
   - Verifies that migrations are non-empty, uniquely named and versioned, and strictly sequential (`0001` through `0011`) before any migration runs.
   - If a gap or out-of-order state is detected in `schema_migrations` (e.g., an earlier migration is unapplied while a later version is already recorded), `runMigrations()` fails closed with `FATAL MIGRATION ORDER VIOLATION`.
4. **Idempotent Skipping & Fail-Closed Checksum Verification:**
   - Already-applied migrations whose recorded `checksum` matches `computeMigrationChecksum(migration.sql)` are safely skipped.
   - If an already-applied migration's recorded `checksum` differs from the current migration SQL digest, `runMigrations()` and `verifyMigrations()` **fail closed immediately** (`FATAL MIGRATION CHECKSUM MISMATCH`).

---

## 6. How to Run Migrations

Execute the provider-neutral migration CLI command:

```bash
npm run db:migrate
```

Behavior of `npm run db:migrate` (`src/db/cli/migrate.ts`):
1. Verifies `DATABASE_URL` is present (exits with code `1` if missing).
2. Validates `getDatabaseConfig()` (which enforces `DATABASE_SSL=require` or `true` when `NODE_ENV=production`).
3. Executes `runMigrations()` to apply all pending migrations (`0001`..`0011`) in atomic per-migration transactions.
4. Executes `verifyMigrations()` immediately afterward to confirm all expected migrations and checksums are valid.
5. Prints a sanitized summary and exits with code `0` on success or code `1` on any failure.

---

## 7. How to Verify Migrations

Execute the read-only verification CLI command:

```bash
npm run db:migrate:verify
```

Behavior of `npm run db:migrate:verify` (`src/db/cli/migrate-verify.ts`):
1. Verifies database connectivity without modifying any schema or business data.
2. Confirms `schema_migrations` exists in the active schema.
3. Confirms all 11 expected migrations (`0001`..`0011`) are recorded in `schema_migrations`.
4. Verifies that every applied migration's stored SHA-256 `checksum` matches its expected digest.
5. Confirms zero pending migrations and zero unexpected migration versions.
6. Exits with code `0` if `ready === true`, or code `1` if the database is unconfigured, unreachable, pending migrations, or has a checksum mismatch.

---

## 8. Migration Failure Behavior

- **Transactional Rollback:** Each migration executes inside `withTransaction()` (`BEGIN ... COMMIT` with automatic `ROLLBACK` on error). If any SQL statement inside a migration fails, all DDL changes from that migration are rolled back and no row is inserted into `schema_migrations`.
- **Immediate Halt & Non-Zero Exit:** `runMigrations()` stops immediately on the first failed migration and returns `{ success: false, error }`. `npm run db:migrate` exits with code `1`.
- **Production Startup Protection (`server.ts`):** If `NODE_ENV=production` and startup migration execution fails, `server.ts` logs a critical error, closes the HTTP server and database pool, and exits with code `1` rather than continuing in an inconsistent schema state.
- **Health/Readiness Protection (`GET /api/health/db`):** `handleDatabaseHealthCheck` calls `verifyMigrations()` to determine `migrationReady`. If migrations are incomplete, missing, or have a checksum mismatch, `migrationReady` is `false` and `/api/health/db` returns `503 Service Unavailable` in production.

---

## 9. Production Seeding Boundary

- **Migrations Are Not Application/Demo Seeders:** `npm run db:migrate` and `npm run db:migrate:verify` **never** import or invoke `seed.ts`, `auth.seed.ts`, `operational.seed.ts`, `financial.seed.ts`, or `lessonNotes.seed.ts`. The production migration boundary remains strictly separate from development/reference seeders.
- **No Demo/Business Rows Inserted:** The 11 migrations contain no demo/reference seed `INSERT` operations and are safe to execute against a new empty database. No demo or business rows (schools, users, classes, staff, students, parents, assessments, attendance, invoices, payments, lesson notes, or directives) are inserted by the migration set.
- **Controlled Schema-Transition Backfills:** Some migrations (`0004`, `0005`, `0006`, `0009`) contain controlled schema-transition/backfill `UPDATE` operations required to migrate existing records safely during schema evolution (e.g., populating newly added `organization_id` or `academic_session_id` columns from existing foreign key relationships). On a new empty database, these `UPDATE` statements affect `0` rows and leave all tables empty.
- **Fail-Closed Seeder Guards:** All 5 development/reference seeders contain explicit `if (process.env.NODE_ENV === 'production') throw new Error(...)` fail-closed guards.

---

## 10. Empty Database Initialization Procedure

When a brand-new, completely empty PostgreSQL 15+ database is prepared in a future deployment phase, operators follow this exact sequence:

1. **Configure `DATABASE_URL`:** Set the server-side PostgreSQL connection string in the environment secret store.
2. **Configure `DATABASE_SSL` Securely:** Set `DATABASE_SSL=require` (or `true`).
3. **Run Schema Migrations:** Execute `npm run db:migrate` to create `schema_migrations` and apply migrations `0001` through `0011`.
4. **Verify Migration State:** Execute `npm run db:migrate:verify` and confirm `Migration Ready: true` (`11/11` applied, `0` pending, `0` checksum mismatches).
5. **Verify Application & Database Readiness:** Start the server and verify `GET /api/health` (`200 OK`) and `GET /api/health/db` (`200 OK`, `migrationReady: true`). At this stage, all business tables exist and contain `0` rows.
6. **Controlled Reference Data Provisioning (Future Phase):** Only after schema readiness is verified should approved institutional reference data be introduced through a controlled promotion/provisioning workflow.
7. **Controlled School Onboarding (Future Phase):** Only after reference provisioning should real school administrator accounts and operational records be onboarded.

---

## 11. Backup Prerequisite

Before executing migrations against any future live production PostgreSQL database:
- Automated daily physical snapshots/backups must be enabled on the PostgreSQL instance with an appropriate retention window (minimum 7–30 days).
- Continuous Write-Ahead Log (WAL) archiving / Point-in-Time Recovery (PITR) should be enabled where supported by the PostgreSQL environment.
- For subsequent schema upgrades on an existing production database, a manual pre-migration snapshot must be taken immediately prior to running `npm run db:migrate`.

*(Note: No live production database or backup infrastructure is provisioned in Phase 10B.)*

---

## 12. Restore Prerequisite

Before relying on any production PostgreSQL database for live school operations:
- A documented restore drill must be executed against an isolated staging/recovery PostgreSQL instance to prove that a snapshot can be restored cleanly.
- After restoring to the isolated recovery instance, `npm run db:migrate:verify` must be executed against the restored database to confirm schema and checksum integrity.

---

## 13. Production Database Security Requirements

- **Least-Privilege Credentials:** The application database user should have DDL/DML privileges only on the target application database and schema, not cluster-wide superuser privileges where avoidable.
- **Network Isolation & TLS:** Database access must be restricted to the backend application runtime over encrypted TLS (`DATABASE_SSL=require`).
- **Zero Credential Leakage:** `DATABASE_URL` and database passwords must never be sent to the browser, printed in logs, returned by `/api/health` or `/api/health/db`, or committed to Git. All database error messages pass through `sanitizeDatabaseErrorMessage()`, which replaces any `postgresql://...` URI or `password=...` segment with `[REDACTED_DATABASE_URI]` / `password=[REDACTED]`.

---

## 14. Pre-Deployment Checklist

- [ ] PostgreSQL 15+ instance provisioned with UTF-8 encoding and TLS enabled (`DATABASE_SSL=require`).
- [ ] Automated backups and PITR configured and restore procedure verified on a staging target.
- [ ] `NODE_ENV=production`, `DATABASE_URL`, `DATABASE_SSL=require`, `AUTH_SECRET`, `ENCRYPTION_SECRET`, and `APP_URL` configured in the environment secret manager.
- [ ] `npm run lint` and `npm run build` pass with zero errors.
- [ ] `npm run db:migrate` executed cleanly with exit code `0`.

---

## 15. Post-Migration Verification

- [ ] `npm run db:migrate:verify` exits with code `0` and reports `Applied Migrations: 11`, `Pending Migrations: None`, `Checksum Mismatches: None`, `Migration Ready: true`.
- [ ] `GET /api/health/db` returns HTTP `200 OK` with `"status": "ok"`, `"database": "connected"`, and `"migrationReady": true`.
- [ ] No demo schools, demo staff, demo students, or development accounts exist in `schools`, `users`, `staff`, or `students`.

---

## 16. What This Phase Does NOT Do

- Does **not** provision a live cloud PostgreSQL database.
- Does **not** select or lock in a cloud hosting or database provider.
- Does **not** onboard a real school or insert real student, parent, staff, attendance, assessment, or financial records.
- Does **not** create production Super Admin or school administrator accounts.
