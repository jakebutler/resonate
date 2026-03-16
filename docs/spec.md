# Resonate Spec

Last updated: 2026-03-16

## Purpose

Resonate is an internal content operations app for Corvo Labs. It combines planning, drafting, editorial workflow, idea capture, AI-assisted writing, and blog publishing in one Next.js + Convex app.

This spec stays intentionally high-level. It describes product shape and cross-file behavior that is easy to miss if you only read one area of the codebase.

## Product Surfaces

### Dashboard

- `/` is the main workspace.
- It exposes three primary views inside one screen:
  - Publishing calendar
  - Content library
  - Workflow kanban
- Calendar and library actions open the standalone blog or LinkedIn editors against shared `posts` records.

### Setup

- `/setup` manages whether blog and LinkedIn are enabled and how frequently each should publish.
- These settings currently act like one shared app record, not per-user preferences.

### Captured Ideas

- `/ideas` is the lightweight capture inbox.
- A captured idea can hold tags, source metadata, and multiple appended note entries.
- Captured ideas can spawn a blog or LinkedIn draft directly into the shared `posts` table.

### Workflow Board

- The workflow board is separate from `/ideas`.
- It tracks selected ideas, research, drafting, review passes, and recent publication state.
- The visible columns are:
  - Ideas
  - Research
  - Outline
  - Review
  - Published
- The backend draft stages are stricter:
  - `outline`
  - `copyedit`
  - `seo`
  - `final`
  - `published`
- `copyedit`, `seo`, and `final` intentionally collapse into the single Review column in the UI.

### AI and Publishing

- `/api/llm` is the authenticated server route for AI assistant calls from editors and workflow actions.
- `/api/publish` creates a GitHub PR for blog publication.
- LinkedIn content is managed in-app and does not publish through `/api/publish`.
- Workflow agents are single-pass prompt runs on the current record, not background autonomous workers.

## System Boundaries

### Frontend

- Next.js App Router app.
- Clerk route protection is implemented in `proxy.ts`; sign-in and sign-up are the only public routes.
- Convex React handles most app state.
- The workflow board uses Kibo-based UI primitives plus explicit stage mapping logic.

### Backend

- Convex stores most product data and business logic.
- Next.js route handlers own external side effects such as LLM requests and GitHub publishing.
- Clerk auth is bridged into Convex with the `convex` JWT template.

### AI

- `lib/cortex.ts` is the canonical LLM client entry point.
- The app prefers Corvo Cortex via `CORTEX_API_KEY`.
- If Cortex is unavailable but `OPENAI_API_KEY` exists, the app falls back to OpenAI-compatible chat completions.
- If neither key is set, AI requests fail at runtime.

## Core Data Model

### `posts`

- Shared content record for both blog and LinkedIn.
- Used by the calendar, content library, editors, captured-idea draft creation, and workflow drafts.
- Blog publishing metadata and LinkedIn-specific metadata live on the same record.
- Historical published content can be backfilled idempotently by `externalUrl`.

### `settings`

- Stores blog and LinkedIn enablement plus target frequency.
- Current implementation is a single shared settings record.

### Captured idea tables

- `capturedIdeas`
- `capturedIdeaEntries`
- `capturedIdeaPostLinks`

These power `/ideas`.

### Workflow tables

- `ideas`
- `workflowDrafts`

These power the kanban workflow.

## Non-Obvious Behavior

- There are still two idea systems:
  - `/ideas` uses `capturedIdeas` for note capture and source tracking.
  - The workflow board uses `ideas` for editorial progression.
- Workflow drafts are not separate documents. Each `workflowDrafts` row points at a `posts` row, so workflow edits also change what the calendar and library show.
- Sending a workflow item back to inspiration only returns it to workflow `backlog`; it does not create or sync a `/ideas` captured idea.
- Captured-idea draft creation links the source idea to the new post, but workflow draft creation starts from the separate workflow idea model.
- Workflow gate checks in `lib/workflow.ts` are heuristic readiness checks, not model-based validation.
- AI passes can rewrite notes or content, but stage advancement still goes through explicit mutations and gate checks.
- Published workflow cards disappear from the board after seven days even though the underlying records stay in Convex.
- `capturedIdeas`, `capturedIdeaEntries`, `capturedIdeaPostLinks`, `ideas`, and `workflowDrafts` are user-scoped. `posts` and `settings` are not scoped the same way.
- That scoping difference matters because the dashboard reads `posts` directly, while the idea and workflow systems enforce ownership inside Convex functions.
- Auth and env wiring is intentionally strict now:
  - `CLERK_JWT_ISSUER_DOMAIN` is required by `convex/auth.config.ts`.
  - `NEXT_PUBLIC_CONVEX_URL` is required by `components/ConvexClientProvider.tsx`.
  - `app/layout.tsx` passes through the real env values instead of placeholder defaults.
- A user can be signed into Clerk but still fail Convex-backed screens if the Clerk-to-Convex JWT bridge is misconfigured.

## Current Route Inventory

- `/`
- `/setup`
- `/ideas`
- `/sign-in/[[...sign-in]]`
- `/sign-up/[[...sign-up]]`
- `/api/llm`
- `/api/publish`

## Current Direction

- Keep captured ideas and workflow ideas separate until there is a deliberate migration plan.
- Preserve the simplified kanban UI while keeping the stricter backend stage model.
- Continue removing placeholder env assumptions and validating auth wiring explicitly.
