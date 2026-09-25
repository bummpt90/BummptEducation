# BummptEducation — Phase 9 Data Provenance Inventory

## 1. Executive Summary
This document provides a comprehensive inventory of all static, reference, operational, and demonstration data structures across the BummptEducation codebase (`src/`).

The audit strictly categorizes every data asset into one of six standard data provenance classifications:
- **A. AUTHORITATIVE OPERATIONAL DATA**: Real-time business data strictly backed by PostgreSQL and retrieved through server endpoints.
- **B. REFERENCE/CONFIGURATION DATA**: Immutable structural reference constants (e.g., LGA boundaries, official curricula, subject catalogues, national examination grading rules).
- **C. DEVELOPMENT/TEST FIXTURE**: Sample entities used exclusively for local dev or automated test runners, strictly prevented from executing in `production`.
- **D. PUBLIC MARKETING CONTENT**: Static informational and descriptive copy for prospective parents, students, and visitors.
- **E. PROHIBITED PRODUCTION FALLBACK**: Fallback values or random generators previously used that have now been audited, removed, or isolated.
- **F. NEEDS MIGRATION TO DATABASE**: Operational entities that are scheduled for runtime database persistence.

---

## 2. Whole-Application Inventory Matrix

| Source Path | Data Item / Entity | Classification | Status & Mitigation / Boundary Rule |
| :--- | :--- | :--- | :--- |
| `src/data/reference/benueReference.ts` | 23 Benue Local Government Areas, Senatorial Zones, Headquarters | **B. REFERENCE/CONFIGURATION DATA** | Isolated into dedicated reference module. Zero synthetic metrics. |
| `src/data/benueStateData.ts` | Historical LGA educational profiles, school templates | **B. REFERENCE/CONFIGURATION DATA** | Math.random() and term week simulations removed. All live telemetry routed to PostgreSQL. |
| `src/data/demo/sampleReportCards.ts` | Sample KG, Primary, and Senior Secondary Report Cards & Students | **C. DEVELOPMENT/TEST FIXTURE** | Isolated with explicit `isDemo: true` flags and visual banner in `ReportCardModal.tsx`. |
| `src/data/reference/classDefinitions.ts` | `CLASS_REFERENCE_DEFINITIONS` (KG 1 to SSS 3 structural class tiers) | **B. REFERENCE/CONFIGURATION DATA** | Pure structural class reference (level, arm, name, category, classroomBlock, capacity). Zero personal staff data. |
| `src/data/attendanceData.ts` | `TERM_CALENDAR_DAYS` (13-week term calendar & pure calculation utilities) | **B. REFERENCE/CONFIGURATION DATA** | Official calendar reference & pure summary calculators; live attendance strictly retrieved via PostgreSQL. |
| `src/db/seed/seed.ts` | Reference data seeder orchestrator (`runReferenceDataSeeder`) | **C. DEVELOPMENT/TEST FIXTURE** | Hardened with fail-closed security exception: aborts before any query or transaction if `NODE_ENV === 'production'`. |
| `src/db/seed/auth.seed.ts` | Initial admin & staff credential hashes | **C. DEVELOPMENT/TEST FIXTURE** | Hardened with fail-closed security exception: aborts if `NODE_ENV === 'production'`. |
| `src/db/seed/operational.seed.ts` | Initial sample classes and students | **C. DEVELOPMENT/TEST FIXTURE** | Hardened with fail-closed security exception: aborts if `NODE_ENV === 'production'`. |
| `src/db/seed/financial.seed.ts` | Initial fee structures and invoices | **C. DEVELOPMENT/TEST FIXTURE** | Hardened with fail-closed security exception: aborts if `NODE_ENV === 'production'`. |
| `src/db/seed/lessonNotes.seed.ts` | Initial sample lesson plans | **C. DEVELOPMENT/TEST FIXTURE** | Hardened with fail-closed security exception: aborts if `NODE_ENV === 'production'`. |
| `src/db/repositories/payment.repository.ts` | Transaction ID generation | **A. AUTHORITATIVE OPERATIONAL DATA** | Hardened: `Math.random()` replaced with cryptographically secure `crypto.randomInt()`. |
| `src/db/repositories/invoice.repository.ts` | Invoice ID generation | **A. AUTHORITATIVE OPERATIONAL DATA** | Hardened: `Math.random()` replaced with `crypto.randomInt()`. |
| `src/db/repositories/admissions.repository.ts` | Application number generation | **A. AUTHORITATIVE OPERATIONAL DATA** | Hardened: `Math.random()` replaced with `crypto.randomInt()`. |
| `src/pages/HomePage.tsx` | Announcement broadcast IDs | **A. AUTHORITATIVE OPERATIONAL DATA** | Hardened: `Math.random()` replaced with deterministic `Date.now()` timestamping. |
| `src/pages/EarlyChildhoodPage.tsx` | KG sample report card trigger | **D. PUBLIC MARKETING CONTENT** | Uses isolated fixture from `sampleReportCards.ts` with prominent DEMO warning. |
| `src/pages/PrimarySchoolPage.tsx` | Primary sample report card trigger | **D. PUBLIC MARKETING CONTENT** | Uses isolated fixture from `sampleReportCards.ts` with prominent DEMO warning. |
| `src/pages/SecondaryCollegePage.tsx` | Secondary sample report card trigger | **D. PUBLIC MARKETING CONTENT** | Uses isolated fixture from `sampleReportCards.ts` with prominent DEMO warning. |
| `src/components/ReportCardModal.tsx` | Domain ratings, attendance totals, DOB, resumption date | **A. AUTHORITATIVE OPERATIONAL DATA** | Strict server-authoritative display: unrecorded traits show 'Not assessed', no synthetic defaults. |
| `src/utils/pdfGenerator.ts` | Report card PDF attendance & ratings | **A. AUTHORITATIVE OPERATIONAL DATA** | Strictly renders server values or 'Not recorded'; zero hardcoded fallback calculations. |
| `src/auth/token.ts` | JWT Signing Secret (`AUTH_SECRET`) | **B. REFERENCE/CONFIGURATION DATA** | Hardened: strictly requires 32+ character `AUTH_SECRET` in production; zero dev fallback. |
| `src/db/config.ts` | PostgreSQL Connection (`DATABASE_URL`) | **B. REFERENCE/CONFIGURATION DATA** | Hardened: throws fatal configuration error if missing in production. |

---

## 3. Boundary Rules & Prohibitions Enforced

1. **No Runtime Randomness**: Operational identifiers must never use `Math.random()`. They must use database-generated sequences or `crypto.randomInt()`.
2. **Zero-Mock Production Paths**: Operational tables (students, attendance, grades, finances, admissions, telemetry) must never fall back to static arrays in production. If no record exists, an empty state or explicit `'Not recorded'` is displayed.
3. **Seeder Inviolability**: Database seeders cannot run automatically when `NODE_ENV === 'production'`. All seeders throw an uncatchable security exception when executed in production.
4. **Demonstration Isolation**: All demonstration assets live under `src/data/demo/` and display prominent visual watermarks when rendered.
