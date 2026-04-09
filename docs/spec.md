# Resonate Spec

Last updated: 2026-04-09

## Purpose

Resonate is Corvo Labs' internal content operations app. It combines editorial planning, drafting, AI assistance, workflow review, and publication handoff in one Next.js + Convex product.

This spec stays high-level on purpose. It describes the current product shape and the cross-file behavior that is easiest to miss during implementation work.

## Product Surfaces

### Dashboard

- `/` is the main workspace.
- It combines the content calendar, content library, and workflow board in one shell.
- Dashboard-driven edit actions still use the older modal editors.

### Fullscreen Editor

- `/editor/[id]` is the dedicated drafting route for the current blog-first editor work.
- `/editor/new?date=YYYY-MM-DD` creates a new blog draft on first autosave, then replaces the URL with `/editor/[newId]`.
- `/editor/[postId]` loads and autosaves the shared `posts` record directly.
- The layout currently includes:
  - a Tiptap editor with a compact toolbar
  - a collapsible, resizable AI sidebar backed by `/api/llm`
  - an inline metadata bar for status, schedule, tags, SEO description, and PR state
  - an image workflow with upload, inline insertion, hero-image designation, and image removal
  - a publish action that opens a GitHub PR rather than directly pushing live content
- This route still coexists with the legacy modal editors and is not yet the only editing path.

### Setup

- `/setup` controls whether blog and LinkedIn are enabled and how often each should publish.
- These settings behave like one shared app-level record, not per-user preferences.

### Captured Ideas

- `/ideas` is the lightweight capture inbox.
- Captured ideas store source metadata, tags, and appended note entries.
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
- `/api/publish` creates a GitHub PR for blog publication and can include frontmatter metadata such as tags, description, and hero image URL.
- LinkedIn posts stay in-app and do not publish through `/api/publish`.
- Workflow AI remains synchronous prompt execution on the current record, not background processing.

## System Boundaries

### Frontend

- Next.js App Router app.
- Clerk route protection is implemented in `proxy.ts`; sign-in and sign-up are the public routes.
- Convex React owns most client-side data flow.
- The repo currently supports two editing paradigms in parallel:
  - legacy slide-over editors for dashboard flows
  - the newer fullscreen Tiptap route for blog drafting

### Backend

- Convex stores most app data and business logic.
- Next.js route handlers own external side effects such as LLM requests and GitHub PR creation.
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
- The fullscreen-editor work now relies on `posts` for status, schedule, tags, SEO description, stored GitHub PR URL, uploaded file IDs, and hero image selection.
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
- The fullscreen editor writes directly to `posts`, not to a separate draft table.
- The fullscreen route remains blog-oriented even though `posts` is shared:
  - New drafts created there are always `type: "blog"`.
  - Existing non-blog records are not blocked at the route layer.
- Existing post content is pushed back into Tiptap with update emission disabled to avoid autosave loops when async data arrives.
- Image handling is split across several layers:
  - uploads go to Convex storage through a generated upload URL
  - the editor inserts an immediate blob preview for responsiveness
  - later, a query-driven URL replacement pass swaps those blob URLs for resolved storage URLs in the HTML
  - the image tray is derived from the current HTML plus stored `fileIds`, so removing an image must update both the document and metadata
- Client-side image optimization happens before upload:
  - only common image MIME types are accepted
  - files over 10MB are rejected client-side
  - wide images are resized to 2000px max width before upload
- The image tray is currently the hero-image picker. There is no separate metadata control for hero selection.
- Metadata changes autosave back to Convex, but publish is a separate PR-creation step.
- The publish flow is intentionally indirect: creating a PR stores `githubPrUrl` on the post and expects the actual merge to happen outside Resonate.
- The publish path is still only partially aligned:
  - the editor now sends Markdown from the Tiptap markdown extension to `/api/publish`
  - the editor sends `status: "published"` to the PR helper, but the local post is patched to `scheduled` after PR creation
  - hero image frontmatter depends on resolving the selected storage ID back to a URL at publish time
- The AI sidebar looks selection-aware, but the fullscreen editor still does not wire actual editor selection into `selectedText` or apply accepted suggestions back into the document.
- Captured-idea draft creation links the source idea to the new post, but workflow draft creation starts from the separate workflow idea model.
- Sending a workflow item back to inspiration only returns it to workflow `backlog`; it does not create or sync a `/ideas` captured idea.
- Workflow gate checks in `lib/workflow.ts` are heuristic readiness checks, not model-based validation.
- Published workflow cards disappear from the board after seven days even though the underlying records stay in Convex.
- `capturedIdeas`, `capturedIdeaEntries`, `capturedIdeaPostLinks`, `ideas`, and `workflowDrafts` are user-scoped. `posts` and `settings` are not scoped the same way.
- That scoping difference matters because the dashboard and fullscreen editor read `posts` directly, while the idea and workflow systems enforce ownership inside Convex functions.
- Auth and env wiring is intentionally strict:
  - `CLERK_JWT_ISSUER_DOMAIN` is required by `convex/auth.config.ts`
  - `NEXT_PUBLIC_CONVEX_URL` is required by the Convex client provider
  - a user can be signed into Clerk but still fail Convex-backed screens if the Clerk-to-Convex JWT bridge is misconfigured

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
- Keep the spec aligned with the current split between legacy modal editing and the fullscreen editor until one path replaces the other.
