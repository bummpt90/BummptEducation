# BummptEducation — System Documentation
### High-Level Architectural Specification & Infrastructure Blueprint

**Document Reference:** BUMP-SYS-DOC-V2.4  
**Classification:** Institutional Technical Specification  
**Authority:** Benue State Educational Computing Initiative  

---

## 1. System Topology & Tier Architecture

BummptEducation operates on a four-tier architecture designed for regional reliability, low latency, and zero-trust security.

```
+-----------------------------------------------------------------------------------+
| 1. PRESENTATION LAYER (React 19 + Tailwind CSS 4 + Vite Single Page Application)  |
| - Authentication Gateway (Login, Sign-Up Request, Password Reset)                 |
| - Executive Admin Dashboard & Account Requests Management Console                |
| - Multi-Arm Academic Portals (Kindergarten, Primary, Secondary)                   |
| - Benue State Ministry of Education 23-LGA Dispatch Console                       |
+-----------------------------------------------------------------------------------+
                                         │ HTTPS / Cookie Authenticated API Calls
                                         ▼
+-----------------------------------------------------------------------------------+
| 2. APPLICATION & ROUTING LAYER (Node.js + Express 4 + TypeScript)                 |
| - Authentication & Token Verification Middleware (JWT, Cookie Parser, Argon2id)   |
| - RBAC Policy Enforcement Engine (Permission Matrix)                              |
| - Multi-Tenant Boundary Guard (TenantContext Resolver)                            |
| - RESTful Domain Routers (/auth, /schools, /classes, /staff, /students, etc.)     |
+-----------------------------------------------------------------------------------+
                                         │ Type-Safe Parameterized SQL Queries
                                         ▼
+-----------------------------------------------------------------------------------+
| 3. PERSISTENCE & DATA LAYER (PostgreSQL 15+ Enterprise Relational Database)       |
| - Tenant Boundaries & Foreign Key Constraints                                     |
| - Serial Schema Migrations (0001 through 0007)                                    |
| - Immutable Security & Financial Audit Ledgers                                    |
| - Connection Pooling with Graceful Drain & Error Handling                         |
+-----------------------------------------------------------------------------------+
                                         │ Asynchronous Reporting & Directives
                                         ▼
+-----------------------------------------------------------------------------------+
| 4. EXTERNAL & REGULATORY INTEGRATION LAYER                                        |
| - Benue State Ministry of Education & SUBEB Registry Verification                 |
| - TRCN (Teachers Registration Council of Nigeria) Credential Alignment            |
| - NERDC Assessment & Grading Standard Compliant Computation                       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### Subsystem A: Authentication Gateway & Identity Provider
- **Entry Gatekeeper:** Intercepts unauthenticated sessions before accessing administrative or instructional modules.
- **Controlled Sign-Up Pipeline:** Collects registration data, enforces organization and school associations, and marks submissions as `PENDING` for administrative vetting.
- **Session Manager:** Issues cryptographically signed HTTP-only cookies containing user ID, role, and school scoping.
- **Forensic Audit Logger:** Continuously records IP address, user agent, action timestamp, and success/failure classification to `auth_audit_logs`.

### Subsystem B: Multi-Tenant Operational Registry
- **School Registry:** Models educational institutions across Benue State's 23 LGAs, indexed by institutional code (e.g., `BNS-MKD-000`).
- **Staff Registry:** Maintains educator profiles, TRCN certification status, rank, and teaching class allocations.
- **Student Registry:** Tracks pupil identity, parent contact, class assignment, and longitudinal academic records.

### Subsystem C: Academic Operations & Continuous Assessment Engine
- **Grading Scale Standard:** 10 marks (1st CA) + 10 marks (2nd CA) + 20 marks (Practical/Project) + 60 marks (Exam) = 100 marks total.
- **Broadsheet Aggregator:** Calculates subject totals, class rank, grade point average (GPA), and term standing.
- **Report Card Generator:** Produces print-ready terminal report cards with verification hashes.

### Subsystem D: Financial Operations & Bursary
- **Fee Structures:** Class-specific and termly billable amounts for tuition, PTA, development, and exams.
- **Invoicing & Ledger:** Generates student invoices, reconciles partial payments, and issues collision-resistant receipts.
- **Bursary Awards:** Supports scholarship allocations and administrative invoice balance adjustments.

---

## 3. Entity-Relationship Data Architecture

```
[organizations]
       │ 1:N
       ▼
   [schools] ────────────┐ 1:N
       │ 1:N              ▼
       │             [classes] ◄──────────────┐
       │                  │ 1:N                │
       │                  ▼                    │ 1:N
       ├──────────────► [students] ─────► [enrollments]
       │                  │ 1:N
       │                  ▼
       │            [invoices] ──────────► [payments] ──► [receipts]
       │                  │ 1:N
       │                  ▼
       │           [invoice_items]
       │
       ├──────────────► [staff] ─────────► [staff_allocations]
       │
       ├──────────────► [user_account_requests] (Pending Review)
       │
       ▼
    [users] ──────────► [user_sessions]
       │
       ▼
[auth_audit_logs]
```

---

## 4. Security & Compliance Profile

1. **Least Privilege Principle:** Every role is bounded by explicit permissions mapped in `src/auth/permissions.ts`.
2. **Tenant Scoping:** All SQL queries on multi-tenant tables inject parameterized tenant checks (`WHERE school_id = $1`).
3. **OWASP Top 10 Mitigation:**
   - **Broken Access Control:** Server-side verification on every API route; client flags cannot bypass authorization.
   - **Cryptographic Failures:** Argon2id with 64MB memory cost for passwords; signed JWTs for sessions.
   - **Injection:** 100% parameterized queries using `pg` driver; zero string concatenation in SQL.
   - **Identification & Authentication Failures:** Rate limiting hooks, session revocation, and uniform error responses.

---

## 5. Deployment & Reliability

- **High Availability Containerization:** Designed to operate in standard Cloud Run / Docker container environments.
- **Port Invariant:** Dev and production environments bind to port `3000` on `0.0.0.0` to comply with reverse-proxy routing.
- **Build Output:** esbuild packages `server.ts` into a self-contained CommonJS artifact (`dist/server.cjs`), eliminating ESM resolution overhead at startup.
