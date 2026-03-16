# Resonate Spec

Last updated: 2026-03-16

## Purpose

Resonate is an internal content operations app for Corvo Labs. It combines content planning, draft editing, editorial workflow, idea capture, AI-assisted writing, and blog publishing into one Next.js + Convex product.

This document stays high-level on purpose. It should describe the product shape and the important cross-file behaviors without turning into an implementation dump.

## Product Surfaces

### Dashboard

- `/` is the main workspace.
- It has three primary views:
  - Publishing calendar
  - Content library
  - Workflow kanban
- Draft creation from the calendar still opens the standalone blog or LinkedIn editors.

### Setup

- `/setup` manages channel enablement and target posting frequency for blog and LinkedIn.
- Settings currently behave like app-wide configuration, not per-user preferences.

### Captured Ideas

- `/ideas` is the lightweight note-first inbox.
- Each captured idea can store tags, source metadata, and a thread of appended entries over time.
- Captured ideas can create a blog or LinkedIn draft directly in the main `posts` table.

### Workflow Board

- The workflow board is a separate editorial workflow from `/ideas`.
- It manages selected ideas, research, draft progression, review passes, and recently published items.
- The UI shows five columns:
  - Ideas
  - Research
  - Outline
  - Review
  - Published
- The backend keeps more granular draft stages:
  - `outline`
  - `copyedit`
  - `seo`
  - `final`
  - `published`
- `copyedit`, `seo`, and `final` intentionally collapse into the single Review column.

### AI and Publishing

- `/api/llm` is the authenticated server route for AI assistant calls from editors and workflow passes.
- `/api/publish` creates a GitHub PR for blog publication; LinkedIn content stays in-app and is not published through this route.
- Workflow “agents” are single-pass prompt runs over the current idea or draft, not autonomous background agents.

## System Boundaries

### Frontend

- Next.js App Router application.
- Clerk middleware protects app routes and API routes; only sign-in and sign-up are public.
- Convex React queries and mutations back most product state.
- The workflow board uses the Kibo kanban/choicebox/combobox components.

### Backend

- Convex stores product data and most business logic.
- Next.js route handlers own LLM calls and GitHub publishing.
- Clerk auth is bridged into Convex with the `convex` JWT template configuration.

### AI

- `lib/cortex.ts` is the canonical LLM client.
- The app prefers Corvo Cortex via `CORTEX_API_KEY`.
- If Cortex is absent but `OPENAI_API_KEY` is present, the app falls back to OpenAI-compatible chat completions.
- Missing both keys breaks AI requests at runtime.

## Core Data Model

### `posts`

- Shared content record for blog and LinkedIn drafts/posts.
- Used by the calendar, content library, standalone editors, captured-idea draft creation, and workflow drafts.
- Blog publishing metadata and LinkedIn-specific fields live on the same table.

### `settings`

- Stores blog/LinkedIn enablement and publishing frequency.
- Current implementation is a single shared record.

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

- There are two idea systems and they are still separate:
  - `/ideas` uses `capturedIdeas` for quick capture and threaded notes.
  - The workflow board uses `ideas` for editorial progression.
- Workflow drafts are not isolated documents. A workflow draft always points to a `posts` row, so edits made in the workflow editor also affect the calendar and content library views.
- Sending a workflow idea “back to inspiration” moves it to workflow `backlog`; it does not copy it into the `/ideas` captured-ideas inbox.
- Workflow gate checks are heuristic checks in `lib/workflow.ts`, not model-based validation.
- AI workflow passes can update research notes or draft content, but advancing stages still goes through explicit mutations and gate checks.
- Published workflow cards age off the board after seven days even though the underlying Convex records remain.
- `ideas`, `workflowDrafts`, and captured idea tables are user-scoped. `posts` and `settings` are not currently user-scoped the same way.
- Auth and env wiring is now strict:
  - `CLERK_JWT_ISSUER_DOMAIN` is required for Convex auth config.
  - `NEXT_PUBLIC_CONVEX_URL` is required for the client provider.
  - The layout no longer injects build-time placeholder Clerk or Convex values.
- The `/ideas` page can show a signed-in-but-not-Convex-authenticated warning when Clerk app auth works but the Convex JWT bridge is misconfigured.
- Captured-idea draft creation links the source idea to the new post, but workflow draft creation uses the separate workflow idea model.

## Current Route Inventory

- `/`
- `/setup`
- `/ideas`
- `/sign-in/[[...sign-in]]`
- `/sign-up/[[...sign-up]]`
- `/api/llm`
- `/api/publish`

## Current Direction

- Keep captured ideas and workflow ideas distinct until there is a deliberate migration plan.
- Preserve the simplified kanban UI while keeping the stricter backend stage model.
- Continue hardening environment and auth setup instead of relying on placeholder local defaults.
