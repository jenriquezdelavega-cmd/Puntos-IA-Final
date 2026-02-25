# Agents

## Cursor Cloud specific instructions

### Overview

**Punto IA** is a SaaS loyalty/rewards platform for small businesses. It is a single Next.js 16 application (in `web/`) that serves both the frontend and all API routes (App Router). PostgreSQL is the database, accessed via Prisma ORM.

### Prerequisites

- **Node.js 22** (available via nvm)
- **PostgreSQL 16** – must be running locally; the update script does NOT start it automatically
- A `.env` file in `web/` with at least `DATABASE_URL` pointing to a local PostgreSQL database

### Starting services

1. **Start PostgreSQL** (if not already running):
   ```
   sudo pg_ctlcluster 16 main start
   ```
2. **Start the dev server**:
   ```
   cd web && npm run dev
   ```
   The app listens on `http://localhost:3000`.

### Key commands

| Task | Command | Working dir |
|---|---|---|
| Install deps | `npm install` | `web/` |
| Prisma generate | `npx prisma generate` | `web/` |
| Prisma migrate | `npx prisma migrate dev` | `web/` |
| Lint | `npx eslint .` | `web/` |
| Dev server | `npm run dev` | `web/` |
| Build | `npm run build` | `web/` |

### Gotchas

- The existing Prisma migration history was originally created for SQLite. If you hit error `P3019` (provider mismatch), remove `prisma/migrations/` and re-run `npx prisma migrate dev --name init` to recreate them for PostgreSQL.
- `next.config.mjs` has `ignoreBuildErrors: true`, so TypeScript errors won't block `npm run build`.
- ESLint reports ~74 pre-existing warnings/errors (mostly `@typescript-eslint/no-explicit-any`); these are not from your changes.
- `MASTER_PASSWORD` defaults to `superadmin2026` if not set in `.env`.
- Set `NEXT_PUBLIC_PRELAUNCH_MODE=false` in `.env` to use the full app instead of the lead-capture teaser.
