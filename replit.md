# CareerCopilot

An AI-powered job application assistant SaaS that helps job seekers craft tailored applications, generate cover letters, analyze ATS compatibility, and track their entire job search in one place.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/career-copilot run dev` — run the frontend (port 25091)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit OpenAI proxy

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS v4, Wouter, shadcn/ui
- API: Express 5 + Clerk auth middleware
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (@clerk/react on frontend, @clerk/express on backend)
- AI: Replit OpenAI proxy (gpt-5-mini, gpt-5-nano)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema: profiles.ts, resumes.ts, applications.ts, generatedResponses.ts
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/api.ts` — Generated Zod schemas (do not edit)
- `artifacts/api-server/src/routes/` — API route handlers: profiles, resumes, applications, ai, dashboard
- `artifacts/career-copilot/src/pages/` — All frontend pages
- `artifacts/career-copilot/src/components/` — Shared components + shadcn/ui

## Architecture decisions

- Contract-first API: OpenAPI spec drives Orval codegen; generated hooks and schemas are used everywhere
- Clerk proxy: all Clerk auth requests go through `/api/__clerk` to avoid CORS issues in production
- AI routes call Replit OpenAI proxy — models `gpt-5-mini` and `gpt-5-nano` — no user API key needed
- All DB access is server-side only; frontend only sees serialized JSON through the API
- Dark mode is default, stored in localStorage under `career-copilot-theme`

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

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing openapi.yaml — it rebuilds both the React hooks and Zod schemas
- The Clerk middleware on the backend uses `getAuth(req)` to extract userId — never trust userId from the request body
- `req.params.id` in Express is typed as `string | string[]` — always cast with `req.params.id as string` before parseInt
- Frontend env vars must be prefixed with `VITE_` to be available at runtime (e.g. `VITE_CLERK_PUBLISHABLE_KEY`)
- Do NOT run `pnpm dev` at workspace root — use workflow restart or the individual filter commands above

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `lib/api-spec/openapi.yaml` for the canonical API contract — add endpoints here first, then run codegen
- Generated hooks: `useGetMyProfile`, `useListResumes`, `useListApplications`, `useGenerateAiContent`, etc. — see full list in `lib/api-client-react/src/generated/api.ts`
