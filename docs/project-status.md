# Project Status

Last updated: 03/16/2026 01:30:02 PDT

## State

Resonate is a working internal content operations app with four active product areas:

- Dashboard calendar and content library on `/`
- Workflow kanban on `/`
- Captured-ideas inbox on `/ideas`
- Publishing setup on `/setup`

## Current Session

Production auth recovery and repository cleanup. The production app is working, Convex prod has the historical published content, and the remaining local task is to commit and push the auth/env hardening changes.

## What Is True Right Now

- Clerk route protection is handled in `proxy.ts`, with only sign-in and sign-up left public.
- Convex-backed surfaces depend on a working Clerk JWT bridge, not just a valid Clerk browser session.
- `CLERK_JWT_ISSUER_DOMAIN` is required by Convex auth config.
- `NEXT_PUBLIC_CONVEX_URL` is required by the Convex client provider.
- `app/layout.tsx` now passes real env values through instead of using placeholder defaults.
- Production depends on explicit parity across Vercel production, Convex production, and the Clerk prod JWT template named `convex`.
- `posts` remains the shared content table for calendar, library, editors, captured-idea draft creation, and workflow drafts.
- Historical published blog and LinkedIn content is already present in Convex prod through the idempotent `externalUrl` backfill path.
- The captured-ideas system and the workflow-ideas system are still separate data models.

## In-Flight Local Changes

- `app/layout.tsx`
- `convex/auth.config.ts`
- `docs/spec.md`
- `docs/changelog.md`
- `docs/project-status.md`

## Recent Commits

- `0a744a3` docs: add living documentation workflow
- `f93c209` Fix brittle editor test dates
- `1b0c676` Merge branch 'codex/inspiration-ideas'
- `906bd3e` Harden env wiring and simplify workflow board cards
- `d11e5bf` Harden workflow board drag logic and expand UI/workflow tests

## Next Agent Pickup

- Commit and push the in-flight auth/env fixes so GitHub matches the currently healthy production setup.
- If auth wiring changes again, verify `app/layout.tsx`, `components/ConvexClientProvider.tsx`, and `convex/auth.config.ts` as one path instead of editing them in isolation.
- Preserve the documented distinction between captured ideas and workflow ideas.

## Branch

- `main`
