# BummptEducation — Developer Documentation
### Engineering Reference, Security Architecture & Implementation Manual

**System Version:** 2.4.0 (Phases 1–7 Unified)  
**Platform Architecture:** Full-Stack Enterprise (Express 4 / TypeScript 5 / PostgreSQL 15+ / React 19 / Vite 6 / Tailwind CSS 4)  
**Compliance Standard:** Benue State Ministry of Education & SUBEB Regulatory Framework; OWASP Top 10 Identity & Access Standards  

---

## Table of Contents
1. [Architectural Overview & Principles](#1-architectural-overview--principles)
2. [Security & Authentication Gateway (Phase 7)](#2-security--authentication-gateway-phase-7)
3. [Identity, Sessions & Cryptography](#3-identity-sessions--cryptography)
4. [Role-Based Access Control (RBAC) Matrix](#4-role-based-access-control-rbac-matrix)
5. [Multi-Tenant Data Isolation Strategy](#5-multi-tenant-data-isolation-strategy)
6. [Database Schema & Migrations Reference](#6-database-schema--migrations-reference)
7. [API Routes & Middleware Specifications](#7-api-routes--middleware-specifications)
8. [Controlled Account Request Workflow](#8-controlled-account-request-workflow)
9. [Automated Test Suite & Verification](#9-automated-test-suite--verification)
10. [Local Development & Deployment Guide](#10-local-development--deployment-guide)

---

## 1. Architectural Overview & Principles

BummptEducation is engineered on a strict **server-authoritative, multi-tenant** architecture. The application is built to manage early childhood, primary, secondary, and state-level educational operations across Benue State's 23 Local Government Areas.

### Core Engineering Invariants
1. **The Backend Is the Authoritative Security Boundary:** Frontend routing guards and UI conditional displays are purely user experience conveniences. All authorization, tenant scoping, cryptographic validation, and data mutations are enforced on the Node.js / Express backend layer.
2. **Zero Direct Client Role Elevation:** Public visitors cannot assign or grant themselves privileged administrative, state, or teaching roles. Self-registration generates a `user_account_requests` record with status `PENDING`, which must be reviewed and approved by an authorized institutional authority.
3. **Multi-Tenant Isolation by Default:** All database queries handling school-scoped resources (`classes`, `staff`, `students`, `enrollments`, `fee_structures`, `invoices`, `payments`, `account_requests`) must evaluate the user's `TenantContext`. Principals and school staff cannot read or mutate data outside their assigned `schoolId`.
4. **Argon2id Password Hashing:** All credentials are cryptographically secured using memory-hard Argon2id (`v=19`, `m=65536`, `t=3`, `p=4`). Plaintext passwords or legacy MD5/SHA hashes are strictly forbidden.
5. **OWASP Anti-Enumeration for Public Endpoints:** The `/forgot-password` endpoint returns an identical generic response regardless of whether an email exists in the database to prevent account harvesting.

---

## 2. Security & Authentication Gateway (Phase 7)

### Transition from Open Access to Authenticated Gateway
In Phase 7, BummptEducation transitioned from an open application homepage into a secured enterprise portal. 

```
Unauthenticated Request -> [Authentication Gateway]
                                |-> Login Form (Verified Credentials)
                                |-> Account Request Form (Controlled Signup)
                                |-> Forgot Password Form (Anti-Enumeration)
                                |-> Institutional Verification Highlights
Authenticated Request   -> [Session Restored via JWT Cookie]
                                |-> Multi-Arm Campus Dashboard
                                |-> Role-Scoped Navigation & Broadsheets
                                |-> Admin Dashboard / Account Requests Tab
```

### Gateway Components
- **Client Route Guard (`src/App.tsx`):** Reads `isAuthenticated` and `isLoading` from `AuthContext`. If unauthenticated, it renders `AuthenticationGateway` instead of the internal application.
- **Micro Auth Button (`src/components/Header.tsx`):** Displays authenticated user identity, active role pill, and a direct `Sign Out` button which triggers server-side cookie invalidation and session termination.
- **Account Requests Manager (`src/components/AccountRequestsManager.tsx`):** Mounted within the Executive Administration Dashboard, allowing principals and state officers to audit, approve, or reject incoming registration requests with audit logging.

---

## 3. Identity, Sessions & Cryptography

### Session Architecture
Authentication is implemented via **server-signed, HTTP-only JWTs** coupled with a persistent database session ledger (`user_sessions`).

| Parameter | Specification | Purpose |
| :--- | :--- | :--- |
| **Token Format** | HMAC-SHA256 JWT | Stateless request verification |
| **Cookie Storage** | `httpOnly: true`, `sameSite: 'lax'`, `secure: production` | XSS-resilient token storage |
| **Token Payload** | `{ userId, email, role, schoolId, isSuperAdmin, sessionId }` | Immediate permission evaluation |
| **Session Invalidation** | `DELETE /api/v1/auth/logout` | Revokes cookie and updates `user_sessions` |
| **Audit Trail** | `auth_audit_logs` table | Immutable forensic ledger of logins, lockouts, signups |

### Password Cryptography
```typescript
import * as argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });
}
```

---

## 4. Role-Based Access Control (RBAC) Matrix

BummptEducation defines eight standard roles across educational, financial, and ministry tiers.

| Role | Scope | Key Permissions |
| :--- | :--- | :--- |
| `super_admin` | Global / Statewide | `system.manage`, `account_requests.manage`, `schools.*`, `bursary.*`, `state_hq.*` |
| `state_officer` | Benue State HQ / SUBEB | `state_hq.view`, `state_hq.dispatch`, `account_requests.view`, `directives.publish` |
| `principal` | Single School Campus | `account_requests.manage`, `staff.manage`, `students.manage`, `results.publish` |
| `examination_officer`| Single School Campus | `assessments.enter`, `assessments.edit`, `results.view`, `results.publish` |
| `bursar` | Single School Campus | `fees.manage`, `invoices.create`, `payments.record`, `payments.reconcile` |
| `teacher` | Assigned Classes/Subjects | `attendance.mark`, `assessments.enter`, `lesson_notes.create` |
| `student` | Individual Record | `results.view`, `invoices.view` (personal records only) |
| `parent` | Enrolled Wards | `results.view`, `invoices.view`, `payments.view` (wards only) |

---

## 5. Multi-Tenant Data Isolation Strategy

### Tenant Context Representation
```typescript
export interface TenantContext {
  schoolId?: string;
  userId?: string;
  role?: string;
  isSuperAdmin?: boolean;
}
```

### Isolation Rules
1. **Global Authorities:** Users with `isSuperAdmin === true` or `role === 'state_officer'` can view across all institutional boundaries.
2. **Institutional Users:** Users with `schoolId` populated can only query and mutate records where `school_id = tenantContext.schoolId`.
3. **Cross-School Rejection:** Any attempt by a principal of School A to create a student, assign a staff member, or review an account request for School B is aborted with an HTTP 403 `TENANT_ISOLATION_VIOLATION`.

---

## 6. Database Schema & Migrations Reference

The database consists of 7 serial SQL migrations located in `src/db/migrations/`:

### Migration Chronology
- `0001_multi_tenant_foundation.sql`: Defines `organizations`, `schools`, `users`, `user_sessions`, and `auth_audit_logs`.
- `0002_academic_calendar_classes.sql`: Adds `academic_years`, `terms`, and `classes`.
- `0003_staff_registry.sql`: Adds `staff` and `staff_allocations`.
- `0004_student_registry.sql`: Adds `students` and `enrollments`.
- `0005_assessments_broadsheets.sql`: Adds `continuous_assessments`, `examinations`, and `report_cards`.
- `0006_financial_operations.sql`: Adds `fee_structures`, `invoices`, `invoice_items`, `payments`, `receipts`, `bursary_awards`, and `financial_audit_logs`.
- `0007_account_requests_foundation.sql`: Adds `user_account_requests` for controlled registration.

### `user_account_requests` Schema
```sql
CREATE TABLE IF NOT EXISTS user_account_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  requested_school_id UUID REFERENCES schools(id),
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  surname VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  requested_role VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_requests_status ON user_account_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_requests_school ON user_account_requests(requested_school_id);
CREATE INDEX IF NOT EXISTS idx_account_requests_email ON user_account_requests(LOWER(email));
```

---

## 7. API Routes & Middleware Specifications

### Public Endpoints (No Token Required)
- `POST /api/v1/auth/login`: Authenticates credentials, generates Argon2id comparison, sets HTTP-only cookie.
- `POST /api/v1/auth/logout`: Clears session cookie and updates session status.
- `POST /api/v1/auth/forgot-password`: Anti-enumeration password reset acknowledgment.
- `POST /api/v1/auth/account-requests`: Submits a controlled registration request (status `PENDING`).
- `GET /api/v1/schools/public`: Returns list of active schools for registration dropdown.

### Protected Account Request Endpoints
- `GET /api/v1/auth/account-requests`: Lists requests. Requires `account_requests.view`. Scoped by school for principals; global for state officers.
- `GET /api/v1/auth/account-requests/:id`: Retrieves specific request detail.
- `POST /api/v1/auth/account-requests/:id/approve`: Approves request, provisions user in `users`, records reviewer. Requires `account_requests.manage`.
- `POST /api/v1/auth/account-requests/:id/reject`: Rejects request with formal reason. Requires `account_requests.manage`.

---

## 8. Controlled Account Request Workflow

```
1. Applicant Submits -> Form validated on client & server
   - Malformed emails rejected
   - Missing names rejected
   - super_admin or state_officer roles blocked immediately

2. Database Persistence -> user_account_requests
   - Password hashed with Argon2id
   - Status marked PENDING
   - Audit action SIGNUP_REQUESTED logged

3. Administrative Review -> Admin Dashboard / Account Requests Tab
   - Principal sees requests for their school
   - State Officer / Super Admin sees statewide requests

4a. Approval Flow:
   - Status updated to APPROVED
   - User account provisioned in users table
   - Audit action ACCOUNT_APPROVED logged

4b. Rejection Flow:
   - Status updated to REJECTED
   - Rejection reason recorded
   - Audit action ACCOUNT_REJECTED logged
```

---

## 9. Automated Test Suite & Verification

The test suite validates the system against security regressions:

```bash
# Run Phase 4 Tenant Isolation Suite
npm run test:phase4

# Run Phase 5 Academic Operations Suite
npm run test:phase5

# Run Phase 6 Admissions & Financial Suite
npm run test:phase6

# Run Phase 7 Authentication Gateway & Controlled Sign-Up Suite
npm run test:phase7
```

### Phase 7 Test Coverage (11 Verification Vectors)
1. Public Account Request Creation with PENDING status.
2. Repository `findById` retrieval and data fidelity.
3. Privileged Role Block Rule (`super_admin` & `state_officer` blocked from public registration).
4. HMAC-SHA256 JWT Token Signing & Cryptographic Verification.
5. Tampered/Forged JWT Signature Rejection.
6. RBAC Permission Boundaries for `account_requests.view` & `account_requests.manage`.
7. Multi-Tenant Scoping: Principal queries isolated to designated school ID.
8. State HQ Cross-School Visibility: State officers can audit all regional requests.
9. Account Request Approval Transition (`status=APPROVED`, reviewer recorded).
10. Account Request Rejection Transition (`status=REJECTED` with formal reason).
11. Security Audit Log Integrity in PostgreSQL `auth_audit_logs`.

---

## 10. Local Development & Deployment Guide

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (with `DATABASE_URL` configured in `.env`)
- npm or bun

### Environment Configuration
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/bummpt_education
JWT_SECRET=your-secure-production-random-secret-key-at-least-32-chars
NODE_ENV=development
```

### Commands
```bash
# Install dependencies
npm install

# Start development server with tsx and Vite middleware
npm run dev

# Run TypeScript linter
npm run lint

# Build for production (outputs bundled server to dist/server.cjs)
npm run build

# Start production server
npm start
```
