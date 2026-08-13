# Grossimarché — full platform (one command)

Backend + storefront + back-office behind a single nginx gateway.

```
                       ┌─────────────────────────── one public door ───────────────────────────┐
  Browser ──▶ :8088 ──▶│ nginx proxy                                                             │
                       │   /api  /ws  ─▶ backend (Spring Boot :8080) ─▶ Postgres 17 · Redis 7    │
                       │   /admin      ─▶ admin  (Vite SPA, nginx :80)                           │
                       │   /           ─▶ store  (Next.js SSR :3000)                             │
                       └─────────────────────────────────────────────────────────────────────────┘
                                 (everything except the proxy stays on the private network)
```

## Layout

This folder is a **sibling** of the three project folders:

```
Downloads/
├── grossimarche/backend                        # Spring Boot API (has its own Dockerfile)
├── kachabazar-1.8.0/kachabazar/
│   ├── store-without-stripe                     # Next.js storefront (Dockerfile added)
│   └── admin                                    # Vite back-office (Dockerfile + nginx.conf added)
└── grossimarche-platform/                       # ← you are here
    ├── docker-compose.yml
    ├── .env.example
    └── proxy/  (nginx.conf + Dockerfile)
```

## Run

```bash
cp .env.example .env      # then edit NEXTAUTH_SECRET
docker compose up -d --build
```

First build takes a few minutes (Maven + two Node builds). Then:

| What | URL |
|---|---|
| **Storefront** | http://localhost:8088/ |
| **Back-office** | http://localhost:8088/admin/ |
| **API** | http://localhost:8088/api/v1/... |
| **Health** | http://localhost:8088/api/v1/../actuator/health |

## Logging in (passwordless OTP)

There are no passwords. Both apps sign in with a one-time code (SMS/email).
In the demo (`local` profile) the code is **printed to the backend log**:

```bash
docker compose logs -f backend | grep "code="
```

- **Storefront**: any phone/email works — first verify creates a `CLIENT` account.
- **Back-office**: only `ADMIN` / `STORE_MANAGER` accounts get in. Promote a user once:

```bash
docker compose exec postgres psql -U grossimarche -d grossimarche \
  -c "UPDATE users SET role='ADMIN' WHERE email='you@example.ma';"
```

(then log into the storefront once with that email so the account exists, or create staff
from the back-office afterwards.)

## What each service does

- **backend** — the Grossimarché REST API. Runs the `local` profile here: ephemeral JWT key,
  Flyway seed data (24 products, 2 demo coupons `BIENVENUE10` / `GROSSI50`), OTP codes to the log.
- **store** — Next.js storefront. The browser calls `/api/v1` same-origin through the gateway;
  server-side rendering + NextAuth call the backend directly at `http://backend:8080` on the
  private network (`INTERNAL_API_URL`). COD-only checkout; coupons; product reviews.
- **admin** — Vite SPA built with `--base=/admin/`, served static by nginx under `/admin/`.
- **proxy** — the only container with a published port. Routes by URL; adds WebSocket upgrade.

## Going to real production

The demo runs the backend `local` profile for convenience. For production:

1. Switch `SPRING_PROFILES_ACTIVE: prod` and supply the required secrets
   (`JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, DB creds, `OTP_PROVIDER=live` + provider keys).
2. Set a strong `NEXTAUTH_SECRET` and a real `PUBLIC_ORIGIN` (your domain).
3. Terminate TLS at the proxy (add a 443 server block + certificates; e.g. Let's Encrypt).
4. Keep Postgres/Redis on the private network (already the case — no published ports).
