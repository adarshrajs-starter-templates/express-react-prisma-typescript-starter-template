# Headless Full-Stack Starter (TypeScript)

A decoupled React + Vite SPA and Express REST API, using Prisma ORM, JWT authentication, role-based authorization, validation, CRUD examples, and a root dev command.

## Requirements
- Node.js 20.19+ (or a current supported Node 22 release) and npm
- No database server is required for the default local setup: SQLite is used.

## Quick start

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
npm run db:setup
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). API health check: `http://localhost:4000/api/health`.

Run each side independently with `npm run dev:backend` and `npm run dev:frontend`, or from the relevant directory with `npm run dev`.

### Default super-admin
- Email: `admin@example.com`
- Password: `admin@123`

These are development defaults only. Change them in `backend/.env` before any shared, public, or production deployment. The seed creates/updates the configured admin account. Re-run `npm run db:seed` after changing credentials.

## Environment files
- `frontend/.env`: `VITE_API_URL` controls the API base URL. Empty means the local API at `http://localhost:4000/api`.
- `backend/.env`: database URL, JWT secret, seed-admin credentials, port, and allowed browser origins.
- `backend/.env.example` and `frontend/.env.example` document the variables. Local `.env` files are included as requested for clone-and-run convenience; **never commit real production secrets**. Replace the sample JWT secret and credentials before deployment.

Vite variables prefixed with `VITE_` are embedded in browser code and are public. Do not put secrets in frontend `.env`.

## Security model: important CORS limitation
The backend validates browser `Origin` against `CORS_ORIGINS` and rejects disallowed origins when an Origin header is present. Configure it in **backend/.env** to match the frontend origins, for example:
`CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://your-app.example.com`

The frontend `.env` cannot securely control backend access: it is delivered to every browser user and can be changed by anyone. CORS is a browser policy, **not authentication or a firewall**; scripts such as curl/server clients can spoof or omit Origin. Actual access control is enforced by JWT authentication, authorization, validation, and deployment/network controls. Do not rely on CORS alone to protect sensitive APIs.

## Included features
- Strict TypeScript for frontend and backend
- React SPA with responsive layout and API-backed task CRUD
- REST endpoints under `/api`
- Register/login/current-user/logout UI; bcrypt password hashing; signed JWT; role-based guards
- Roles: `USER`, `ADMIN`, `SUPER_ADMIN`
- Example task CRUD, pagination, Zod request validation, centralized errors
- User listing/deactivation for admins; super-admin seed
- Helmet, rate limiting, CORS allowlist, request-size limit, Prisma
- Root scripts for concurrent dev, build, typecheck, and database setup
- Repomix config; environment files are included by Repomix because `.gitignore` does not exclude `.env`

## REST API overview
- `GET /api/health` — health check
- `POST /api/auth/register` — create user
- `POST /api/auth/login` — login
- `GET /api/auth/me` — current authenticated user
- `GET /api/tasks?page=1&limit=10` — list own tasks (admins can see all)
- `POST /api/tasks` — create task
- `GET /api/tasks/:id`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`
- `GET /api/users` — admin/super-admin list users
- `PATCH /api/users/:id/role` — super-admin role update
- `PATCH /api/users/:id/status` — admin deactivate/reactivate users

All protected routes require `Authorization: Bearer <token>`. The browser demo stores its token in `localStorage` for simplicity. For production apps with higher security requirements, consider secure, HttpOnly, SameSite cookies plus CSRF protections and a refresh-token rotation strategy.

## Prisma database switching
Prisma is the data-access layer; it does not make every database interchangeable by changing only the URL. **Both** `backend/prisma/schema.prisma`'s `provider` and `DATABASE_URL` must match the target connector. Provider changes can require schema adjustments and new migrations. MongoDB uses a different ID/relation model and requires Mongo-compatible schema changes; it is not a drop-in swap for this relational SQLite schema. Back up data and follow Prisma's provider-specific migration/import guidance when switching.

Default SQLite:
```prisma
provider = "sqlite"
url      = env("DATABASE_URL")
```
`backend/.env` uses `DATABASE_URL="file:./dev.db"`.

For PostgreSQL, change provider to `postgresql` and set a PostgreSQL URL. For MySQL use `mysql`; for MongoDB use `mongodb` and adapt the schema (including `@db.ObjectId` IDs and relation rules) per Prisma documentation. Then run `npm run db:generate` and the provider-appropriate migration/deployment workflow. `db:push` is convenient for local prototyping; use reviewed migrations (`prisma migrate dev` / `prisma migrate deploy`) for relational production databases. MongoDB uses `prisma db push`, not Prisma Migrate.

## Deployment (Render, AWS, VPS)
Deploy frontend and backend as separate services. Set frontend `VITE_API_URL` to the deployed API base URL, e.g. `https://api.example.com/api`; set backend `CORS_ORIGINS` to the exact deployed frontend origin(s), `DATABASE_URL` to your managed database, `JWT_SECRET` to a long random secret, and `NODE_ENV=production`. Build with `npm ci && npm run build` at root, or install/build each service independently. Backend start command: `npm start --prefix backend`; frontend static output: `frontend/dist` (configure SPA fallback to `index.html`). Configure environment variables in the hosting provider rather than committing production `.env` files.

For production relational databases, create and apply migrations as part of release/deployment. Do not expose the database publicly unless required; use managed database networking and TLS.

## Git and Repomix
`repomix.config.json` includes `frontend/**` and `backend/**`, including `.env` files. This is intentional per request, but it means a generated XML bundle may contain secrets. **Do not share or upload `repomix-output.xml` to an LLM until you have scrubbed secrets.** Repomix has security checks, but they are not a substitute for manual review.

## Project structure
```text
frontend/       React/Vite SPA
backend/        Express REST API, Prisma schema and seed
repomix.config.json
package.json    root orchestration scripts
```
