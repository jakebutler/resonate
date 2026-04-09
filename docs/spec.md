# Resonate Spec

Last updated: 2026-04-09

## Purpose

Resonate is Corvo Labs' internal content operations app. It combines planning, drafting, workflow review, idea capture, AI assistance, and blog publication in one Next.js + Convex product.

This spec stays intentionally high-level. It focuses on product shape and repo-wide behavior that is easy to miss if you read only one route or component.

## Product Surfaces

### Dashboard

- `/` is the main workspace.
- It combines the publishing calendar, content library, and workflow board in one shell.
- Calendar and library actions still open the legacy modal editors for blog and LinkedIn posts.

### Fullscreen Editor

- `/editor/[id]` is the newer dedicated drafting route.
- It is currently blog-first:
  - `/editor/new?date=YYYY-MM-DD` creates a new blog draft on first autosave.
  - `/editor/[postId]` loads and autosaves a shared `posts` record.
- The editor uses Tiptap rich text with a compact toolbar.
- The fullscreen layout now includes:
  - a right-side AI copilot panel that is collapsible and resizable
  - an inline metadata bar for status, publish date/time, tags, SEO description, and PR state
  - a publish action that opens a GitHub PR instead of directly publishing content
- The route still coexists with the older modal editors and is not yet the default entry point from the dashboard.

### Setup

- `/setup` controls whether blog and LinkedIn are enabled and how often each should publish.
- These settings behave like one shared app record, not per-user preferences.

### Captured Ideas

- `/ideas` is the lightweight capture inbox.
- A captured idea stores source metadata, tags, and appended note entries.
- A captured idea can spawn a blog or LinkedIn draft into the shared `posts` table.

### Workflow Board

- The workflow board is separate from `/ideas`.
- It tracks selected ideas through research, drafting, review, and recent publication state.
- The UI columns are Ideas, Research, Outline, Review, and Published.
- Backend workflow stages are stricter: `outline`, `copyedit`, `seo`, `final`, and `published`.
- `copyedit`, `seo`, and `final` intentionally collapse into one Review column.

### AI and Publishing

- `/api/llm` is the authenticated server route for editor and workflow AI calls.
- The fullscreen editor uses `/api/llm` with `assistantType: "blog"` and streams responses into the sidebar chat UI.
- `/api/publish` opens a GitHub PR for blog publication and now supports extra frontmatter inputs such as tags and description.
- LinkedIn posts stay in-app and do not publish through `/api/publish`.
- Workflow agents are synchronous prompt runs on the current record, not background workers.

## System Boundaries

### Frontend

- Next.js App Router app.
- Clerk route protection is implemented in `proxy.ts`; sign-in and sign-up are the only public routes.
- Convex React owns most client data flow.
- The app currently has two parallel editing paradigms:
  - legacy slide-over editors for dashboard-driven flows
  - a newer fullscreen Tiptap route for blog drafting

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
- It now carries additional fullscreen-editor metadata such as tags, SEO description, and a stored GitHub PR URL.
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
- The fullscreen editor also writes directly to `posts`, not to a separate draft table.
- The fullscreen route remains blog-oriented even though `posts` is shared:
  - New drafts created there are always `type: "blog"` and `status: "draft"`.
  - Existing non-blog records are not blocked at the route layer.
- `/editor/new?date=...` uses the query param only for the initial create mutation; after the first autosave it redirects to `/editor/[newId]`.
- Metadata edits in the fullscreen editor autosave back to Convex, but the publish action is a separate PR-creation step.
- The publish flow is intentionally indirect: creating a PR stores `githubPrUrl` on the post and the UI tells the user to review and merge externally.
- The current publish path is only partially aligned:
  - the editor exposes tags and SEO description, and the GitHub helper includes them in frontmatter
  - hero image storage exists in the schema, but the fullscreen UI does not expose a hero-image picker yet
  - the editor has a Markdown-capable Tiptap handle, but the publish action still sends HTML content into the GitHub file path today
  - after PR creation, the post is patched to `scheduled` even though the outbound PR payload uses `status: "published"`
- The editor sidebar looks selection-aware, but the fullscreen editor still does not populate `selectedText` from Tiptap or apply accepted suggestions back into the document.
- Existing post content is reloaded into Tiptap with updates suppressed to avoid autosave loops when async data arrives.
- Captured-idea draft creation links the source idea to the new post, but workflow draft creation starts from the separate workflow idea model.
- Sending a workflow item back to inspiration only returns it to workflow `backlog`; it does not create or sync a `/ideas` captured idea.
- Workflow gate checks in `lib/workflow.ts` are heuristic readiness checks, not model-based validation.
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
