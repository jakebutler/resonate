# Resonate Spec

Last updated: 2026-04-09

## Purpose

Resonate is Corvo Labs' internal content operations app. It centralizes post planning, drafting, workflow review, idea capture, AI-assisted writing, and blog publication in one Next.js + Convex product.

This spec stays intentionally high-level. It focuses on product shape and cross-file behavior that is easy to miss if you only inspect one component or route.

## Product Surfaces

### Dashboard

- `/` is the main workspace.
- It contains three primary views in one shell:
  - Publishing calendar
  - Content library
  - Workflow kanban
- Calendar and library actions still open the legacy modal editors for blog and LinkedIn posts.

### Fullscreen Editor

- `/editor/[id]` is a dedicated fullscreen drafting route.
- It currently behaves like a blog editor:
  - `/editor/new?date=YYYY-MM-DD` creates a new blog draft on first autosave.
  - `/editor/[postId]` loads an existing `posts` record and autosaves title and HTML content.
- The editing surface is Tiptap-based rich text with a compact formatting toolbar.
- The fullscreen layout now includes a right-side AI copilot panel:
  - collapsible from the header
  - resizable with a drag handle
  - backed by `/api/llm` streaming responses
  - model-selectable from the shared `lib/models.ts` list
- The toolbar includes an image action affordance, but no image insertion flow is wired yet.
- This route exists alongside the older modal editors; it is not yet the default dashboard entry point.

### Setup

- `/setup` controls whether blog and LinkedIn are enabled and how often each should publish.
- These settings act like one shared app record, not per-user preferences.

### Captured Ideas

- `/ideas` is the lightweight capture inbox.
- A captured idea stores source metadata, tags, and appended note entries.
- A captured idea can spawn a blog or LinkedIn draft into the shared `posts` table.

### Workflow Board

- The workflow board is separate from `/ideas`.
- It tracks selected ideas through research, drafting, review, and recent publication state.
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
- `copyedit`, `seo`, and `final` intentionally collapse into one Review column in the UI.

### AI and Publishing

- `/api/llm` is the authenticated server route for editor and workflow AI calls.
- The fullscreen editor uses `/api/llm` with `assistantType: "blog"` and streams tokens into the sidebar chat UI.
- `/api/publish` creates a GitHub PR for blog publication.
- LinkedIn posts stay in-app and do not publish through `/api/publish`.
- Workflow agents are synchronous prompt runs on the current record, not background workers.

## System Boundaries

### Frontend

- Next.js App Router app.
- Clerk route protection is implemented in `proxy.ts`; sign-in and sign-up are the only public routes.
- Convex React owns most client data flow.
- The app currently has two editing paradigms:
  - Legacy slide-over editors for dashboard-driven create/edit flows.
  - A newer fullscreen Tiptap editor route for rich blog drafting.

### Backend

- Convex stores most app data and business logic.
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
- Used by the calendar, content library, modal editors, fullscreen editor, captured-idea draft creation, and workflow drafts.
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
- The new fullscreen editor also writes directly to `posts`, not to a separate draft table.
- The fullscreen route is currently blog-oriented even though `posts` is shared:
  - New drafts created there are always `type: "blog"` and `status: "draft"`.
  - Its UI edits title and rich HTML body, and now exposes an AI sidebar, but not status, schedule, assets, or LinkedIn-specific fields.
- Existing non-blog `posts` records are not blocked at the route layer, so behavior depends on whatever shared fields are already on the record.
- The dashboard still opens the older modal editors, so the repo currently has two parallel blog-editing experiences with different capabilities.
- `/editor/new?date=...` uses the query param only for the initial create mutation; after the first autosave it redirects to `/editor/[newId]`.
- The editor sidebar looks selection-aware, but the current fullscreen editor does not yet populate `selectedText` from Tiptap or wire suggestion acceptance back into the document, so that flow is scaffolded rather than complete.
- Existing post content is reloaded into Tiptap with updates suppressed to avoid an autosave loop when async data arrives.
- Captured-idea draft creation links the source idea to the new post, but workflow draft creation starts from the separate workflow idea model.
- Sending a workflow item back to inspiration only returns it to workflow `backlog`; it does not create or sync a `/ideas` captured idea.
- Workflow gate checks in `lib/workflow.ts` are heuristic readiness checks, not model-based validation.
- AI passes can rewrite notes or content, but stage advancement still goes through explicit mutations and gate checks.
- Published workflow cards disappear from the board after seven days even though the underlying records stay in Convex.
- `capturedIdeas`, `capturedIdeaEntries`, `capturedIdeaPostLinks`, `ideas`, and `workflowDrafts` are user-scoped. `posts` and `settings` are not scoped the same way.
- That scoping difference matters because the dashboard and fullscreen editor read `posts` directly, while the idea and workflow systems enforce ownership inside Convex functions.
- Auth and env wiring is intentionally strict:
  - `CLERK_JWT_ISSUER_DOMAIN` is required by `convex/auth.config.ts`.
  - `NEXT_PUBLIC_CONVEX_URL` is required by `components/ConvexClientProvider.tsx`.
  - `app/layout.tsx` passes real env values instead of placeholder defaults.
- A user can be signed into Clerk but still fail Convex-backed screens if the Clerk-to-Convex JWT bridge is misconfigured.

## Current Route Inventory

- `/`
- `/editor/[id]`
- `/setup`
- `/ideas`
- `/sign-in/[[...sign-in]]`
- `/sign-up/[[...sign-up]]`
- `/api/llm`
- `/api/publish`

## Current Direction

- Keep captured ideas and workflow ideas separate until there is a deliberate migration plan.
- Preserve the simplified kanban UI while keeping the stricter backend stage model.
- Keep the spec aligned with the current editor split until one editing flow replaces the other.
