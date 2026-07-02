# Deployment Guide — GitHub + Vercel + Neon

Deploy the **Accident Inspection Report** app to production using GitHub, Neon (PostgreSQL), and Vercel.

## Architecture

```
GitHub repo ──push──► Vercel ──connects──► Neon (PostgreSQL)
```

| Concern         | Solution                                  |
|-----------------|-------------------------------------------|
| Database        | Neon serverless PostgreSQL                |
| ORM             | Prisma 6 (PostgreSQL provider)            |
| Migrations      | `prisma/migrations/` (run via `db:migrate:deploy`) |
| Auth            | Custom JWT (jose) signed with `AUTH_SECRET` |
| Hosting         | Vercel (Next.js 16, Turbopack build)      |

## Step 1 — Create a Neon database

1. Go to **https://neon.tech** and sign up (free).
2. **Create Project** → name it → pick a region.
3. Copy **two** connection strings from Connection Details:
   - **Pooled connection** (host contains `-pooler`) → `DATABASE_URL`
   - **Direct connection** (no `-pooler`) → `DIRECT_DATABASE_URL`

## Step 2 — Push to GitHub

```bash
git remote add origin https://github.com/<USER>/<REPO>.git
git add -A
git commit -m "Production-ready: PostgreSQL/Neon + RBAC + profile management"
git branch -M main
git push -u origin main
```

## Step 3 — Deploy to Vercel

1. Go to **https://vercel.com/new** → sign in with GitHub.
2. **Import** the repository.
3. Add these **Environment Variables** (apply to all environments):

   | Name                  | Value                                                |
   |-----------------------|------------------------------------------------------|
   | `DATABASE_URL`        | Neon pooled connection string                        |
   | `DIRECT_DATABASE_URL` | Neon direct connection string                        |
   | `AUTH_SECRET`         | `openssl rand -base64 32`                            |

4. Click **Deploy**. Build runs `postinstall: prisma generate` + `bun run build`.

## Step 4 — Create database schema

```bash
DIRECT_DATABASE_URL='postgresql://...' bun run db:migrate:deploy
```

## Step 5 — Seed admin user

```bash
DATABASE_URL='postgresql://...pooler...' \
SEED_ADMIN_EMAIL='admin@mvi.local' \
SEED_ADMIN_PASSWORD='your-password' \
  bun run db:seed
```

## Step 6 — Verify

Visit your Vercel URL → check `/api` returns `healthy` → log in with admin credentials.

## Environment variables reference

| Variable                | Required | Used by                       |
|-------------------------|:--------:|-------------------------------|
| `DATABASE_URL`          | ✅       | App runtime (Prisma Client)   |
| `DIRECT_DATABASE_URL`   | ✅       | Prisma migrate / db push      |
| `AUTH_SECRET`           | ✅       | JWT signing (sessions)        |
| `SEED_ADMIN_EMAIL`      | optional | `bun run db:seed`             |
| `SEED_ADMIN_PASSWORD`   | optional | `bun run db:seed`             |

## Useful commands

```bash
bun run dev                  # Local dev server
bun run build                # Production build
bun run db:migrate:deploy    # Apply migrations (production / Neon)
bun run db:seed              # Create the admin user
```

## RBAC & User Management

- **USER role**: can create/edit/delete their own reports, manage their own profile (name, email, password).
- **ADMIN role**: can manage all reports (view/edit/delete any), plus manage all users (create, edit role, reset password, delete) via the **Admin** tab.
- Every user can update their own **name, email, and password** in the **Profile** tab.
- Guardrails: cannot delete self, cannot demote/delete the last remaining admin.
