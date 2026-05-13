# IdealPrix - Tunisian E-commerce Platform

A production-ready e-commerce monorepo for the Tunisian market. This repository contains a Medusa backend and a React/Vite storefront (storefront uses Vite). The project uses a monorepo layout (apps/) and Turborepo for running tasks.

Tech stack
- Backend: Medusa (Node/TypeScript)
- Frontend: React + Vite (storefront)
- DB: PostgreSQL (recommended for production)
- Monorepo: Turborepo
- Node: 20+

Repository layout
- apps/backend — Medusa backend and API
- apps/storefront — React storefront (Vite)

Quickstart (local)
1. Clone and install deps:
   git clone <repo_url>
   cd idealprix-backend
   pnpm install

2. Backend env/setup:
   cp apps/backend/.env.template apps/backend/.env
   # Edit DATABASE_URL and other secrets in apps/backend/.env

3. Run migrations & seed (backend):
   cd apps/backend
   pnpm medusa db:migrate
   pnpm medusa seed -- --file migration-scripts/initial-data-seed.ts

4. Create admin user (dev):
   pnpm medusa user -e admin@idealprix.tn -p Idealprix2024!

5. Start backend (dev):
   pnpm dev --filter=@dtc/backend

6. Storefront env:
   cp apps/storefront/.env.template apps/storefront/.env.local
   # Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY and NEXT_PUBLIC_MEDUSA_BACKEND_URL

7. Start storefront (dev):
   pnpm dev --filter=@dtc/storefront

Common scripts (root package.json)
- pnpm dev           # start local dev for workspaces (via turbo)
- pnpm build         # build all workspaces
- pnpm test          # run tests (vitest / jest as configured)

Security folder
A new `/security` folder has been added with practical middleware and guidance (Zod validation examples, security headers, CSRF notes, rate limiting, payment guidance and checklist). Use these as drop-in examples and adapt into apps/backend.

Recommendations (short):
- Validate input server-side using Zod (examples in /security/zod-schemas.ts).
- Enforce strong security headers (helmet + CSP); see /security/headers.ts.
- Protect forms and state-changing endpoints from CSRF; see /security/csrf.md.
- Use Stripe Elements/Checkout for payments; follow /security/payment.md.
- Enable rate limiting, secrets management, HTTPS, dependency scanning, monitoring.

Where to look next
- apps/backend — backend source and admin tools
- apps/storefront — storefront source
- security/ — security guidelines and example middleware

If you want, run the dev servers now or I can open a PR with these changes and wire the middleware into the backend startup file.
