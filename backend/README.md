# Grossimarché - Backend API

Wholesale (cash & carry) supermarket e-commerce REST API for the Moroccan market,
built with Spring Boot 4.1 on a **layered architecture**. Backend only - a Next.js web
app and a React Native app will both consume this API later, so it makes no client-specific
assumptions.

> **Status:** B1–B11 implemented. Skeleton, schema+seed, security (JWT/RS256), OTP auth,
> catalogue, cart/checkout/payment, loyalty, stores/profile/addresses/privacy, WebSocket
> order tracking, hardening (Docker/CI/compliance) and the ArchUnit-enforced test suite.
> `./mvnw verify` is green (26 tests via Testcontainers). See "Implemented" and "Deferred" below.

### Implemented (B1–B11)
- **Auth:** passwordless OTP (SMS/Email), JWT RS256 with `kid` rotation, refresh-token
  rotation with theft-revocation, denylist, rate limiting (Redis fixed-window).
- **Catalogue:** pricing tiers (`PricingService`), accent-insensitive search, admin CRUD,
  CSV import, image upload, Caffeine caching.
- **Orders:** idempotent checkout, atomic stock (never negative under concurrency), price/
  address snapshots, COD + CMI card (mock+real gateways), PDF invoices, state machine,
  cancellation with stock/loyalty reversal.
- **Loyalty:** config-driven earn/tiers/multipliers; balance == sum(ledger) invariant.
- **Privacy (loi 09-08):** account erasure (anonymise), data export, audit log, retention job.
- **Realtime:** STOMP `/ws` with per-topic subscription authorization, AFTER_COMMIT events.
- **Ops:** multi-stage Dockerfile (non-root), GitHub Actions CI, structured JSON logs (prod),
  Micrometer metrics, `docs/COMPLIANCE.md`, `docs/API.md`.
- **Tests:** ArchUnit (10 layered rules enforced), pricing, JWT, OTP auth flow, checkout
  (concurrency/idempotency/snapshot/authorization), loyalty invariant.

### Deferred (documented swaps, not gaps in the happy path)
- **Field encryption at rest** (phone/address) + blind index → high-risk retrofit to the
  phone/email lookup path; see `docs/COMPLIANCE.md` §6.
- **Redis-backed cache** (Caffeine used instead) and **Bucket4j** (Redis INCR limiter used) -
  avoided bleeding-edge Boot 4 wiring risk; both are swap-in points.
- **`openapi.json`** is generated from the running app (see `docs/API.md`), not committed.
- Exhaustive coverage gates: JaCoCo report runs; the doc's 90% target needs more tests.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| JDK | 21+ | Dossier targets Java 25 (LTS). The build is pinned to 21 (installed here) via `java.version` in `pom.xml`; bump that one value to 25 once JDK 25 is installed. Spring Boot 4.1 baseline is Java 17. |
| Docker + Compose | recent | Local Postgres 17 and Redis 7. |
| Maven | wrapper included | Use `./mvnw`. |

## Run locally

```bash
docker compose up -d          # Postgres :5433, Redis :6380
./mvnw spring-boot:run        # boots on the "local" profile
```

- Health: <http://localhost:8080/actuator/health> → `UP` (db + redis components `UP`)
- Swagger UI (local only): <http://localhost:8080/swagger-ui.html>
- OpenAPI JSON (local only): <http://localhost:8080/v3/api-docs>

If port 8080 is busy, run with `SERVER_PORT=8081 ./mvnw spring-boot:run`.

## Test

```bash
./mvnw test
```

Integration tests use **Testcontainers** (throwaway Postgres 17 + Redis 7 started
automatically). Docker must be running; you do **not** need `docker compose up` for tests.

## Environment variables

Local dev needs none - `application-local.yml` and `docker-compose.yml` share the same
non-secret credentials. See [`.env.example`](.env.example) for the full list; these
matter mainly for the `prod` profile, where all secrets are required from the env.

| Variable | Default (local) | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `local` | `local` or `prod`. Prod must set this. |
| `SERVER_PORT` | `8080` | HTTP port. |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | local dev values | Database (required in prod). |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6380` | Redis (required in prod). |
| `API_PUBLIC_URL` | `http://localhost:8080` | Advertised in the OpenAPI doc. |
| `CORS_ALLOWED_ORIGINS` | localhost:3000,3001 | CORS allowlist (used from B3). |

## Architecture - package by layer

```
com.grossimarche
├── config/          @Configuration, @ConfigurationProperties, cross-cutting filters
├── controller/      REST endpoints (admin under controller/admin/)
├── dto/             request/response records, by domain
│   ├── common/      ApiError, FieldError, PageResponse
│   └── mapper/      MapStruct mappers
├── entity/          JPA entities
│   └── enums/       domain enums
├── exception/       ErrorCode, BusinessException hierarchy, GlobalExceptionHandler
├── integration/     third-party adapters behind interfaces
│   ├── sms/  email/  payment/  storage/  pdf/
├── repository/      Spring Data JPA repositories
│   └── spec/        JPA Specifications
├── security/        SecurityConfig, JWT, filters, principal, rate limiting
├── service/         ALL business logic
└── websocket/       STOMP config, handlers, events
```

### Layer rules (enforced by ArchUnit in B11)

1. `controller → service → repository`. A controller never injects a repository.
2. A JPA entity never crosses the controller boundary - DTOs in, DTOs out; mapping in `service`.
3. `repository` depends only on `entity` and Spring Data.
4. `service` must not depend on `controller` or on `jakarta.servlet` types.
5. Every third-party call goes through an interface in `integration/` (real + local/test impls).
6. No `@Transactional` on controllers - transactions begin in `service`.
7. No business logic in controllers, entities, mappers or exception handlers.

## Conventions

- **Money** is `BigDecimal(scale 2)`, `HALF_UP`; never float/double.
- **Schema** is owned by Flyway; `spring.jpa.hibernate.ddl-auto=validate`.
- **Errors** all use the `ApiError` shape with an `ErrorCode`, carrying a `traceId`
  (also returned as the `X-Request-Id` header and stamped on every log line).
- **No secrets in the repo** - env vars only, documented in `.env.example`.

## Profiles

| Profile | Datasource / Redis | Swagger | Health detail |
|---|---|---|---|
| `local` | hardcoded dev values / compose | enabled | always |
| `prod`  | env vars, no defaults | disabled | when authorized |
| `test`  | Testcontainers (`@ServiceConnection`) | disabled | - |
