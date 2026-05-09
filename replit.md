# CareerCopilot

An AI-powered job application assistant SaaS that helps job seekers craft tailored applications, generate cover letters, analyze ATS compatibility, and track their entire job search in one place.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/career-copilot run dev` — run the frontend (port 25091)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `SUPABASE_URL` — Supabase project URL (e.g. https://xxx.supabase.co)
- Required env: `SUPABASE_ANON_KEY` — Supabase anon key (secret)
- Required env: `VITE_SUPABASE_URL` — same URL for frontend
- Required env: `VITE_SUPABASE_ANON_KEY` — same anon key for frontend (secret)
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit OpenAI proxy

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS v4, Wouter, shadcn/ui
- API: Express 5 + Supabase JWT auth middleware
- Auth: Supabase Auth (email/password + Google OAuth)
- DB: Supabase PostgreSQL (accessed via @supabase/supabase-js)
- AI: Replit OpenAI proxy (gpt-5-mini, gpt-5-nano)
- Validation: Zod (zod/v4)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/lib/supabase.ts` — Supabase client factory (getSupabaseClient)
- `artifacts/api-server/src/routes/auth.ts` — requireAuth middleware (JWT-based)
- `artifacts/api-server/src/routes/` — API route handlers: profiles, resumes, applications, ai, dashboard
- `artifacts/career-copilot/src/lib/supabase.ts` — frontend Supabase client
- `artifacts/career-copilot/src/lib/api.ts` — fetch wrapper (attaches Supabase JWT)
- `artifacts/career-copilot/src/context/AuthContext.tsx` — useAuth hook
- `artifacts/career-copilot/src/pages/` — All frontend pages

## Architecture decisions

- Supabase Auth: JWT tokens from Supabase are sent as `Authorization: Bearer <token>` headers
- Backend verifies JWT via `supabase.auth.getUser()` — no shared secret needed
- All DB access is server-side only; frontend only sees JSON through the API
- Dark mode is default, stored in localStorage under `career-copilot-theme`
- RLS is NOT used on Supabase tables — access control is enforced server-side (user_id checks)

## Supabase DB Schema (run in Supabase SQL Editor)

```sql
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  linkedin_url text,
  website_url text,
  bio text,
  current_title text,
  years_of_experience integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  job_title text not null,
  job_url text,
  job_description text,
  status text not null default 'saved',
  applied_at timestamptz,
  notes text,
  resume_id uuid references resumes(id) on delete set null,
  match_score integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists generated_responses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  type text not null,
  content text not null,
  created_at timestamptz default now()
);
```

## Product

CareerCopilot is an AI-powered job application assistant with:
- **Resume Manager**: Upload/paste resumes, set a default, manage multiple versions
- **Application Tracker**: Track applications across statuses (saved → applied → interview → offer/rejected)
- **AI Assistant**: Generate cover letters, resume summaries, ATS-optimized bullet points, and answers to common interview questions based on any job description
- **ATS Analysis**: Score how well a resume matches a job description with keyword gap analysis
- **Dashboard**: Stats overview, recent activity feed, application pipeline breakdown
- **Settings**: Profile management (name, contact info, LinkedIn, bio, experience level)
- **Landing page**: Full public marketing page with features, how-it-works, and pricing sections

## User preferences

_Populate as you build._

## Gotchas

- DB columns are snake_case (user_id, company_name, job_title, is_default, match_score, created_at, updated_at)
- Frontend pages use snake_case field names to match Supabase columns (app.job_title, app.company_name, etc.)
- Frontend env vars must be prefixed with `VITE_` to be available at runtime
- Do NOT run `pnpm dev` at workspace root — use workflow restart or the individual filter commands above
- Supabase anon key is safe to use on the frontend; it respects Row Level Security (RLS). Server-side checks user_id in every query
- The `requireAuth` middleware extracts userId from the verified JWT — never trust userId from the request body

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- All API calls go through `artifacts/career-copilot/src/lib/api.ts` which automatically attaches the Supabase session JWT
- Auth state is managed in `AuthContext.tsx` — use `useAuth()` hook in any component
