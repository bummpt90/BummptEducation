# BummptEducation — Phase 8E: Benue State HQ Telemetry, Ministry Directives & Messaging Specification

**Status:** COMPLETED & VERIFIED  
**Architecture:** 100% Server-Authoritative PostgreSQL Persistence  
**Test Suite:** `tests/phase8e.hq-telemetry-directives-messaging.test.ts` (56/56 Tests Passed)  
**Security Standard:** Strict Authentication, Multi-Tenant Boundary Isolation (Cross-School Privacy Protection), Authoritative JWT Identity Derivation, Idempotent Compliance Acknowledgement, and Immutable Audit Trails.

---

## 1. Executive Summary

Phase 8E converts the Benue State Ministry of Education Headquarters operations and inter-school communication architecture from browser-simulated localStorage and mock stores into an authoritative PostgreSQL system.

All statewide operational telemetry across all 23 Local Government Areas (LGAs), official Ministry directives, school compliance acknowledgements, inter-school messaging dispatches, and executive escalations are now processed, stored, and audited through dedicated PostgreSQL tables and Express v1 REST APIs.

Legacy fallback stores (`benue_state_school_overrides_v1`, `benue_moe_hq_chat_messages_v1`, and `INITIAL_MINISTRY_DIRECTIVES`) have been completely decoupled from production workflows and views.

---

## 2. PostgreSQL Relational Foundation (Migration 0011)

The Phase 8E operational model is defined in `src/db/migrations/0011_hq_telemetry_directives_messaging.sql`:

### 2.1 Table: `hq_dispatches` (Extended)
- **Primary Key:** `id` (UUIDv4)
- **Official Tracking:** `official_ref_number` (`VARCHAR(100)` UNIQUE, deterministic format: `BN/HQ/[LGA]/[YEAR]/[SEQ]`)
- **Authoritative Sender:** `sender_user_id` (UUID references `users(id)`), `sender_name`, `sender_role`
- **School Scoping & Isolation:** `school_id` (UUID references `schools(id)`), `school_name`, `lga`, `zone`
- **Targeting & Audience:** `target_school_id` (UUID references `schools(id)`), `target_school_name`, `audience_type` (`SPECIFIC_SCHOOL`, `ALL_SCHOOLS`, `ZONE`, `LGA`)
- **Channel & Classification:** `channel_id`, `message_type` (`update`, `complaint`, `request`, `directive`, `executive`), `priority` (`low`, `normal`, `high`, `urgent`)
- **Workflow & Escalation:** `status` (`received`, `in-review`, `forwarded-to-head`, `approved`, `resolved`), `is_escalated_to_commissioner` (BOOLEAN)
- **Official Response:** `hq_response_content`, `hq_responder_name`, `hq_responder_role`, `hq_responded_at`

### 2.2 Table: `hq_dispatch_replies` (Extended)
- **Primary Key:** `id` (UUIDv4)
- **Dispatch Link:** `dispatch_id` (UUID references `hq_dispatches(id)` ON DELETE CASCADE)
- **Authoritative Sender:** `user_id` (UUID references `users(id)` ON DELETE SET NULL), `school_id` (UUID references `schools(id)` ON DELETE SET NULL), `sender_type` (`HQ`, `SCHOOL_HEAD`), `responder_name`, `responder_role`
- **Content:** `reply_content`, `created_at`

### 2.3 Table: `ministry_directives` (Extended)
- **Primary Key:** `id` (UUIDv4)
- **Official Reference:** `reference_number` (`VARCHAR(100)` UNIQUE, format: `BN/MOE/DIR/[YEAR]/[SEQ]`)
- **Content:** `title`, `category`, `priority`, `content`, `action_required`, `status`
- **Audience Scoping:** `audience_type` (`ALL_SCHOOLS`, `SPECIFIC_SCHOOL`, `ZONE`, `LGA`), `target_school_id`, `target_school_name`, `target_lga`, `target_zone`, `target_audience`
- **Authority:** `issued_by`, `issuing_office`, `issued_by_user_id` (UUID references `users(id)`), `issued_date`, `effective_date`

### 2.4 Table: `directive_acknowledgements`
- **Primary Key:** `id` (UUIDv4)
- **Composite Unique Constraint:** `(directive_id, school_id)` guaranteeing idempotent, single-acknowledgement semantics per school
- **Authoritative Compliance:** `directive_id`, `school_id`, `school_name`, `acknowledged_by_user_id`, `head_name`, `head_role`, `acknowledged_at`, `notes`

### 2.5 Table: `hq_audit_logs`
- **Primary Key:** `id` (UUIDv4)
- **Audit Context:** `organization_id`, `school_id`, `user_id`, `user_name`, `user_role`, `action`, `resource_id`, `resource_type`, `details` (`JSONB`), `ip_address`, `created_at`
- **Tracked Actions:** `DIRECTIVE_CREATED`, `DIRECTIVE_ACKNOWLEDGED`, `HQ_DISPATCH_CREATED`, `HQ_DISPATCH_REPLY_CREATED`, `HQ_DISPATCH_STATUS_CHANGED`, `DISPATCH_ESCALATED`, `SUBVENTION_DISBURSED`

---

## 3. Data Access Layer & Repositories

### 3.1 `HqTelemetryRepository` (`src/db/repositories/hqTelemetry.repository.ts`)
- `getOverview()`: Aggregates active schools, student enrollment, teacher headcounts, active curriculum notes, and financial metrics across all 23 Benue LGAs directly from live PostgreSQL relations.
- `getLgaDetails(lgaName)`: Gathers real-time performance indicators and school rosters for a designated LGA.
- `getSchoolDetailsWithKpis(schoolId)`: Returns comprehensive school-level telemetry including attendance rates, fee collection, staff counts, and curriculum velocity.
- `disburseSubvention(schoolId, amount, purpose, user, ipAddress)`: Atomically logs a government subvention grant in an audit-tracked PostgreSQL transaction.

### 3.2 `MinistryDirectiveRepository` (`src/db/repositories/ministryDirective.repository.ts`)
- `getDirectives(user, filters)`: Retrieves official directives scoped dynamically to the authenticated user's role and database tenant assignment.
- `getDirectiveById(id, user)`: Resolves an individual directive, strictly verifying tenant audience boundaries (cross-school targeted directives return 404).
- `createDirective(dto, user, ipAddress)`: Restricted to State Officers and Super Admins; generates official reference numbers and records immutable audit trail entries.
- `acknowledgeDirective(directiveId, user, notes, ipAddress)`: Head-of-school exclusive endpoint recording compliance idempotently (`ON CONFLICT (directive_id, school_id) DO UPDATE`).
- `getAcknowledgements(directiveId, user)`: Provides state officers and heads of school with transparent compliance tracking.

### 3.3 `HqDispatchRepository` (`src/db/repositories/hqDispatch.repository.ts`)
- `getMessages(user, queryParams)`: Filters communications such that School Heads only see statewide broadcasts and dispatches involving their assigned school. Other schools' communications are strictly omitted.
- `createMessage(dto, user, ipAddress)`: Derives sender identity authoritatively from the validated JWT and database school registry. Browser client payload attempts to forge sender metadata are completely ignored.
- `createReply(dispatchId, replyContent, user, ipAddress)`: Permitted only to HQ Officers and the Head of the school involved with the dispatch. Cross-school reply attempts are rejected with 403.
- `updateStatus(dispatchId, status, isEscalated, user, ipAddress)`: Handles administrative workflow state changes and executive escalations to the Commissioner's desk.

---

## 4. REST API Routing & Access Control

The Phase 8E endpoints are organized under `/api/v1/hq/*`:

| Router | Method | Route | Access Control | Function |
| :--- | :--- | :--- | :--- | :--- |
| **Telemetry** | `GET` | `/api/v1/hq/telemetry/overview` | `authenticateUser` | Statewide KPIs across all 23 LGAs |
| **Telemetry** | `GET` | `/api/v1/hq/telemetry/lgas` | `authenticateUser` | Directory of 23 LGAs with live metrics |
| **Telemetry** | `GET` | `/api/v1/hq/telemetry/schools/:id` | `authenticateUser` | Live school telemetry & KPIs |
| **Telemetry** | `POST` | `/api/v1/hq/telemetry/subvention` | `state_officer`, `super_admin` | State subvention grant disbursement |
| **Directives** | `GET` | `/api/v1/hq/directives` | `authenticateUser` | Scoped list of Ministry Directives |
| **Directives** | `GET` | `/api/v1/hq/directives/:id` | `authenticateUser` | Directive detail with tenant validation |
| **Directives** | `POST` | `/api/v1/hq/directives` | `state_officer`, `super_admin` | Broadcast or target official directive |
| **Directives** | `POST` | `/api/v1/hq/directives/:id/acknowledge` | Head of School (`principal`, etc.) | Acknowledge institutional compliance |
| **Directives** | `GET` | `/api/v1/hq/directives/:id/acknowledgements` | `authenticateUser` | Compliance verification audit |
| **Messaging** | `GET` | `/api/v1/hq/chat/messages` | HQ Officers & Heads of School | Multi-tenant isolated dispatch stream |
| **Messaging** | `POST` | `/api/v1/hq/chat/messages` | HQ Officers & Heads of School | Authoritative dispatch submission |
| **Messaging** | `POST` | `/api/v1/hq/chat/messages/:id/reply` | HQ Officers & Owning Head | Official threaded response |
| **Messaging** | `PATCH`| `/api/v1/hq/chat/messages/:id/status` | HQ Officers & Owning Head | Status update / Commissioner escalation |

---

## 5. Security & Privacy Guarantees

1. **Strict Cross-School Isolation:** Private dispatches and school-targeted directives for School A are completely invisible to School B. Attempts to access them via IDOR directly return 404.
2. **Authoritative Sender Derivation:** `sender_name`, `sender_role`, `school_id`, and `school_name` are populated directly from the authenticated session and `schools` table.
3. **Dynamic Assignment Tracking:** If a Principal is reassigned to another school in the database, their future communications and visibility instantly shift to the new tenant without browser session caching.
4. **Non-Repudiation & Auditability:** All directive publications, compliance acknowledgements, dispatches, replies, and status transitions generate immutable logs in `hq_audit_logs`.
5. **Zero Mock Invariant:** Directives, LGA performance stats, and dispatches are sourced exclusively from PostgreSQL.
