# BummptEducation — Phase 10A Production Deployment Architecture & Environment Specification

## Status Declarations

```text
CODE PRODUCTION CONTRACT:
READY

LIVE DEPLOYMENT:
NOT YET EXECUTED

PRODUCTION DATABASE:
NOT YET PROVISIONED

REAL SCHOOL:
NOT YET ONBOARDED
```

---

## 1. BummptEducation Production Architecture

BummptEducation operates on a unified, provider-neutral, four-layer architecture where the browser communicates exclusively over HTTPS with the Node.js / Express backend server, which enforces RBAC, multi-tenant isolation, and cryptographic checks before executing parameterized SQL queries against PostgreSQL:

```text
Browser (React 19 SPA served from dist/)
   │
   ▼
HTTPS (TLS 1.2+ / HSTS enforced)
   │
   ▼
Node.js / Express Server (dist/server.cjs on 0.0.0.0:PORT)
   │  • OWASP HTTP Security Headers (HSTS, CSP, X-Frame-Options, nosniff)
   │  • Strict CORS Origin Verification (APP_URL / ALLOWED_ORIGINS)
   │  • CSRF Double-Submit Cookie & Header Verification
   │  • HS256 JWT Session Verification & Argon2id Credential Hashing
   │  • AES-256-GCM Field Encryption (ENCRYPTION_SECRET)
   │  • TenantContext & RBAC Authorization
   ▼
PostgreSQL 15+ Relational Database (SSL/TLS Pool)
```

- **Single Unified Backend:** Express 4 serves both the `/api/v1/*` REST endpoints and the compiled static React SPA bundle (`dist/`). No secondary backend framework is required.
- **Zero Direct Browser-to-Database Access:** The browser never receives `DATABASE_URL` or database credentials.

---

## 2. Required Production Environment Variables

| Variable | Classification | Requirement & Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | **Production-Required** | Must be set to `production` to activate fail-closed startup guards, secure cookies, and seeder lockouts. |
| `PORT` | **Production-Required** | TCP port dynamically supplied by the hosting platform (defaults safely to `3000` if omitted). Production host is always `0.0.0.0` regardless of any `HOST` override. |
| `APP_URL` | **Production-Required** | Mandatory in production. Must be a valid `https://` origin URL (not `*`). `ALLOWED_ORIGINS` cannot substitute for `APP_URL`. |
| `DATABASE_URL` | **Production-Required** | PostgreSQL connection URI (`postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require`). |
| `DATABASE_POOL_SIZE` | **Production-Required** | Maximum PostgreSQL pool connections (default: `10` in production, `5` in development). |
| `DATABASE_SSL` | **Production-Required** | Mandatory in production; must be explicitly set to `require` or `true` (`disable` or `false` is rejected). |
| `AUTH_SECRET` | **Production-Required** | High-entropy secret (minimum 32 characters) for signing HS256 JWT authentication tokens. |
| `ENCRYPTION_SECRET` | **Production-Required** | Dedicated 32-byte Base64-encoded key for AES-256-GCM symmetric encryption. |
| `ALLOWED_ORIGINS` | Optional (Prod/Dev) | Comma-separated additional `https://` origins permitted for CORS (wildcard `*` prohibited). |
| `AUTH_TOKEN_EXPIRES_IN` | Optional | JWT session lifetime (default: `8h`). |
| `DEBUG_SQL` | Development-Only | Must remain `false` in production. |
| `GEMINI_API_KEY` | Optional Platform | Injected in AI Studio preview environments; not required by any BummptEducation production workflow. |

---

## 3. Secret Requirements

### `AUTH_SECRET`
- **Mandatory in Production:** Server startup and `getAuthSecret()` fail closed if `AUTH_SECRET` is unset or empty when `NODE_ENV=production`.
- **Minimum Length:** At least 32 characters (recommended: 64+ hex characters generated via `crypto.randomBytes(48).toString('hex')`).
- **No `JWT_SECRET` Fallback:** Legacy `JWT_SECRET` is strictly rejected in production mode.
- **Zero Exposure:** Never logged, never sent to the browser, never returned in `/api/health`, `/api/health/db`, or error payloads.

### `ENCRYPTION_SECRET`
- **Mandatory in Production:** Enforced at startup via `enforceProductionStartupConfig()` and at runtime via `getEncryptionKey()`.
- **Strict Independence:** Must be completely distinct from `AUTH_SECRET` and `JWT_SECRET`. Reusing `AUTH_SECRET` as `ENCRYPTION_SECRET` throws a `CryptographicConfigurationError`.
- **Format & Entropy:** Valid Base64 string decoding to **exactly 32 bytes (256 bits)** for AES-256-GCM (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
- **No Auto-Generation:** Production never auto-generates a transient encryption key at runtime.

---

## 4. PostgreSQL Requirements

- **Engine Version:** PostgreSQL 15 or higher.
- **Mandatory `DATABASE_URL`:** In `NODE_ENV=production`, `getDatabaseConfig()` immediately throws if `DATABASE_URL` is missing or empty.
- **Mandatory `DATABASE_SSL`:** In `NODE_ENV=production`, `DATABASE_SSL` must be explicitly configured as `require` or `true`. Any insecure value (`disable`, `false`, or unset) fails production startup validation and throws in `getDatabaseConfig()`. Development/preview (`NODE_ENV !== 'production'`) may continue to use `DATABASE_SSL=disable`.
- **Connection Pooling:** Managed via `pg.Pool` (`DATABASE_POOL_SIZE`, default `10` in production, `5000ms` connection timeout, `30000ms` idle timeout).
- **Credential Redaction:** `sanitizeDatabaseErrorMessage()` strips any `postgresql://` URI or password parameter before logging or returning diagnostic states.

---

## 5. HTTPS Requirements

- Production deployments must terminate TLS (HTTPS) at the ingress load balancer or reverse proxy and forward traffic to the Node/Express container.
- Express configures `app.set('trust proxy', 1)` when `NODE_ENV=production` so `req.secure` and `X-Forwarded-Proto: https` are respected for secure cookie transmission.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS) is emitted on all responses by `securityHeadersMiddleware`.

---

## 6. `APP_URL` / Origin Configuration

- `APP_URL` is **mandatory in production** and defines the canonical public HTTPS origin of the deployment (e.g., `https://portal.school.edu.ng`).
- When `NODE_ENV=production`, missing or empty `APP_URL` fails production validation (`validateProductionStartupConfig().valid === false`) and causes `enforceProductionStartupConfig()` to throw. `ALLOWED_ORIGINS` cannot substitute for `APP_URL`.
- In production (`NODE_ENV=production`), `APP_URL` and any entries in `ALLOWED_ORIGINS` must be valid `https://` origin URLs. Plaintext `http://` origins and wildcard `*` origins are strictly rejected.

---

## 7. Cookie Requirements

Authentication cookies (`bummpt_auth_token`) are issued via `getAuthCookieOptions()` in `src/auth/token.ts`:
- `httpOnly: true` — Prevents client-side JavaScript (`document.cookie`) from reading the session JWT (XSS mitigation).
- `secure: true` (when `NODE_ENV === 'production'`) — Ensures cookies are transmitted exclusively over encrypted HTTPS connections.
- `sameSite: 'lax'` — Protects against cross-site request forgery while supporting standard top-level navigation.
- `path: '/'` and `maxAge: 28800000` (8 hours).

CSRF cookies (`bummpt_csrf_token`) are paired with required `X-CSRF-Token` / `X-Requested-With` headers on all state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) authenticated via cookies.

---

## 8. CORS Requirements

Implemented in `src/security/cors.ts`:
- **No Wildcard with Credentials:** `Access-Control-Allow-Origin: *` is strictly prohibited.
- **Explicit Origin Matching:** Cross-origin requests are permitted only if the request `Origin` matches the normalized `APP_URL` or an entry in `ALLOWED_ORIGINS`.
- **HTTPS Enforcement in Production:** When `NODE_ENV === 'production'`, any non-HTTPS `Origin` header is rejected.
- **`AI_STUDIO_PREVIEW` Never Weakens Production Security:** Production CORS and startup rules depend strictly on `process.env.NODE_ENV === 'production'`. Setting `AI_STUDIO_PREVIEW=true` in production never bypasses HTTPS enforcement, wildcard blocking, or trusted-origin validation.
- **Preflight Rejection:** Disallowed origins receive `403 CORS_FORBIDDEN` on `OPTIONS` preflight requests and never receive `Access-Control-Allow-Origin` headers.

---

## 9. Build Procedure

```bash
npm run build
```

1. Executes `vite build`, compiling and minifying the React 19 TypeScript frontend into `dist/` (`dist/index.html` and hashed assets in `dist/assets/`).
2. Executes `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`, producing the self-contained production server artifact at `dist/server.cjs`.

---

## 10. Start Procedure

```bash
npm start
```

Executes `node dist/server.cjs`:
1. Runs `enforceProductionStartupConfig()` to verify `NODE_ENV`, `DATABASE_URL`, `DATABASE_SSL`, `AUTH_SECRET`, `ENCRYPTION_SECRET`, and `APP_URL`/`ALLOWED_ORIGINS`.
2. Always binds Express to `0.0.0.0` in production (`getServerHost()` returns `0.0.0.0` regardless of any unsafe `HOST` override such as `127.0.0.1` or `localhost`), while `PORT` remains dynamically supplied by the hosting platform via `process.env.PORT` (defaulting safely to `3000`).
3. Serves static frontend assets from `dist/` and mounts all `/api/v1/*` routers.

---

## 11. Production Startup Requirements

When `NODE_ENV=production`, server startup (`enforceProductionStartupConfig()` in `src/config/deployment.ts` and `server.ts`) enforces:
1. `DATABASE_URL` must be configured and non-empty.
2. `DATABASE_SSL` must be explicitly configured as `require` or `true` (`disable` or `false` is rejected).
3. `AUTH_SECRET` must be configured, at least 32 characters, and not using `JWT_SECRET`.
4. `ENCRYPTION_SECRET` must be configured, valid Base64 decoding to 32 bytes, and distinct from `AUTH_SECRET`.
5. `APP_URL` is mandatory and must be a valid `https://` origin URL (not `*`). `ALLOWED_ORIGINS` (if set) must also use `https://` and must never contain `*`.
6. Production bind host is always `0.0.0.0`, while `PORT` remains dynamically configurable via `process.env.PORT`.
7. `AI_STUDIO_PREVIEW` never weakens or bypasses any production security or CORS requirement.
8. All development/reference seeders (`seed.ts`, `auth.seed.ts`, `operational.seed.ts`, `financial.seed.ts`, `lessonNotes.seed.ts`) are disabled and throw fatal exceptions if invoked in production.
9. No demo schools, demo users, Super Admin accounts, or preview identities are ever created automatically.

---

## 12. Health and Readiness Endpoints

Both health endpoints return sanitized JSON and **never** expose `DATABASE_URL`, database credentials, `AUTH_SECRET`, `ENCRYPTION_SECRET`, `JWT_SECRET`, cookies, tenant/student/staff records, stack traces, filesystem paths, or raw SQL errors.

### `GET /api/health`
- **Application Healthy (`200 OK`):**
  ```json
  {
    "status": "ok",
    "readiness": "ready",
    "server": "BummptEducation Backend Express API",
    "environment": "production",
    "timestamp": "2026-09-25T12:00:00.000Z"
  }
  ```
- **Production Configuration Missing/Invalid (`503 Service Unavailable`):**
  ```json
  {
    "status": "configuration_invalid",
    "readiness": "not_ready",
    "server": "BummptEducation Backend Express API",
    "environment": "production",
    "timestamp": "2026-09-25T12:00:00.000Z",
    "message": "Production configuration is missing or invalid."
  }
  ```

### `GET /api/health/db`
- **Database Healthy & Migrations Applied (`200 OK`):**
  ```json
  {
    "status": "ok",
    "database": "connected",
    "engine": "PostgreSQL",
    "configured": true,
    "migrationReady": true,
    "latencyMs": 12,
    "timestamp": "2026-09-25T12:00:00.000Z",
    "message": "PostgreSQL database connected and operational"
  }
  ```
- **Database Unavailable (`503 Service Unavailable`):**
  ```json
  {
    "status": "degraded",
    "database": "unavailable",
    "engine": "PostgreSQL",
    "configured": true,
    "migrationReady": false,
    "timestamp": "2026-09-25T12:00:00.000Z",
    "message": "Database connection unavailable."
  }
  ```
- **Production Configuration Missing/Invalid (`503 Service Unavailable`):**
  ```json
  {
    "status": "configuration_invalid",
    "database": "unconfigured",
    "engine": "PostgreSQL",
    "configured": false,
    "migrationReady": false,
    "timestamp": "2026-09-25T12:00:00.000Z",
    "message": "Production configuration is missing or invalid."
  }
  ```

---

## 13. Migration Expectations

- Schema migrations live in `src/db/migrations/` (`0001` through `0011`) and are tracked in the `migrations` table using SHA-256 checksums.
- Each migration executes inside an atomic `BEGIN ... COMMIT` transaction (`src/db/migrator.ts`).
- Already-applied migrations are skipped idempotently; modified migration checksums fail closed to prevent schema drift.

---

## 14. Secret Management

- Secrets (`DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_SECRET`) must be stored in the hosting platform's encrypted secret manager or environment vault and injected at container runtime.
- `.env` files containing real credentials must never be committed to Git (`.gitignore` excludes `.env*` except `.env.example`).
- `AUTH_SECRET` and `ENCRYPTION_SECRET` must be generated independently using a CSPRNG (`crypto.randomBytes`).

---

## 15. What Production Must NEVER Do

1. **Never** run with missing or weak `AUTH_SECRET`, `ENCRYPTION_SECRET`, or `DATABASE_URL`.
2. **Never** fall back to `JWT_SECRET` or share the same secret between `AUTH_SECRET` and `ENCRYPTION_SECRET`.
3. **Never** fall back to mock, synthetic, or `localStorage` business data.
4. **Never** execute `seed.ts`, `auth.seed.ts`, `operational.seed.ts`, `financial.seed.ts`, or `lessonNotes.seed.ts`.
5. **Never** auto-create demo schools, demo staff/students, or default Super Admin accounts on startup.
6. **Never** expose `/api/v1/auth/dev-identities` (returns `404 Not Found` in production).
7. **Never** allow `Access-Control-Allow-Origin: *` with credentials or permit plain `http://` cross-origin requests.
8. **Never** leak secrets, connection strings, SQL queries, or stack traces in health or error responses.

---

## 16. Development/Preview vs. Production Differences

| Capability | Development / Preview (`NODE_ENV !== 'production'`) | Production (`NODE_ENV === 'production'`) |
| :--- | :--- | :--- |
| **Frontend Serving** | Vite dev middleware with HMR | Pre-compiled static assets from `dist/` |
| **Missing `DATABASE_URL`** | Permitted for safe local preview | **Fatal startup error** (fails closed) |
| **Missing `AUTH_SECRET` / `ENCRYPTION_SECRET`** | Dev fallback for `AUTH_SECRET`; `ENCRYPTION_SECRET` required on encrypt | **Fatal startup error** (both mandatory at startup) |
| **Database Seeders** | Controlled dev seeding when tables are empty | **Strictly disabled** (throws Fatal Security Exception) |
| **`/api/v1/auth/dev-identities`** | Enabled for development persona switching | **Disabled** (returns `404 Not Found`) |
| **Auth Cookie `secure` Flag** | `false` (allows `http://localhost`) | `true` (HTTPS required) |
| **CORS Origins** | Permits `localhost` and preview domains | Permits only explicit `https://` origins (`APP_URL` / `ALLOWED_ORIGINS`) |

---

## 17. Deployment Sequence for a Future Live Deployment

When a hosting provider and production PostgreSQL cluster are selected in a subsequent phase:
1. Provision a managed PostgreSQL 15+ instance with TLS (`sslmode=require`) and automated backups.
2. Generate independent production cryptographic secrets (`AUTH_SECRET` >= 32 chars, `ENCRYPTION_SECRET` = 32-byte Base64).
3. Configure production environment variables (`NODE_ENV=production`, `PORT`, `APP_URL`, `DATABASE_URL`, `DATABASE_POOL_SIZE`, `DATABASE_SSL`, `AUTH_SECRET`, `ENCRYPTION_SECRET`) in the host secret manager.
4. Execute `npm ci && npm run build` in the CI/CD build pipeline to produce `dist/` and `dist/server.cjs`.
5. Start the production service with `npm start` (`node dist/server.cjs`).
6. Verify schema migration completion and readiness via `GET /api/health` (`200 OK`) and `GET /api/health/db` (`200 OK`, `migrationReady: true`).
7. Onboard institutional reference data and initial administrator accounts through an explicitly controlled promotion/onboarding workflow (Phase 10B+).
