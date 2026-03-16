# Project Status

Last updated: 03/16/2026 01:04:35 PDT

## State

Resonate is a working Next.js + Convex content operations app with four active product surfaces:

- `/` for calendar, content library, and workflow kanban
- `/setup` for shared channel settings
- `/ideas` for captured ideas and threaded note capture
- Authenticated API routes for AI generation and blog PR publishing

## Current Task

Documentation refresh only. This pass aligned the living docs with the current product shape, the stricter Clerk/Convex env wiring, and the new docs automation files that are already in the working tree.

## What Changed This Session

- `docs/spec.md` now reflects the current app boundaries and the easy-to-miss split between captured ideas and workflow ideas.
- `docs/changelog.md` got one append-only entry for this session.
- `docs/project-status.md` was rewritten as a handoff snapshot.

## Recent Commits

- f93c209 Fix brittle editor test dates
- 1b0c676 Merge branch 'codex/inspiration-ideas'
- 906bd3e Harden env wiring and simplify workflow board cards
- d11e5bf Harden workflow board drag logic and expand UI/workflow tests
- 6e43928 Refine workflow board card actions and spacing

## Local Working Tree

- A  .codex/prompts/documentation-subagent.md
- A  .githooks/pre-commit
-  M app/layout.tsx
-  M convex/auth.config.ts
- A  docs/changelog.md
- AM docs/project-status.md
- A  docs/spec.md
- M  package.json
- A  scripts/install-git-hooks.sh
- A  scripts/update-docs.mjs

## Non-Obvious Current State

- The app has two separate idea systems. `/ideas` uses `capturedIdeas`; the kanban workflow uses `ideas`.
- Workflow drafts edit shared `posts` records, so workflow draft changes also surface in the calendar and content library.
- Clerk sign-in can succeed while Convex auth still fails. In that case `/ideas` renders an explicit warning instead of data.
- `posts` and `settings` are still effectively shared records, while idea-related tables are user-scoped.
- `/api/publish` is blog-only even though blog and LinkedIn drafts share the same `posts` table.

## Next Agent Pickup

- Review the in-flight auth/env changes in [app/layout.tsx](/Users/jacobbutler/Documents/GitHub/resonate/app/layout.tsx) and [convex/auth.config.ts](/Users/jacobbutler/Documents/GitHub/resonate/convex/auth.config.ts) before changing Clerk or Convex setup. The placeholder build-time defaults were removed, so local and CI env completeness matters now.
- If you touch docs automation, inspect [scripts/update-docs.mjs](/Users/jacobbutler/Documents/GitHub/resonate/scripts/update-docs.mjs), [scripts/install-git-hooks.sh](/Users/jacobbutler/Documents/GitHub/resonate/scripts/install-git-hooks.sh), and [.githooks/pre-commit](/Users/jacobbutler/Documents/GitHub/resonate/.githooks/pre-commit). The intent is to keep docs synced automatically at commit time.
- Preserve the distinction between the captured-ideas inbox and the workflow board unless you are deliberately doing a migration. That split is visible in both the schema and the UI.
- Keep future `docs/changelog.md` edits append-only and limit doc edits to the three living docs unless the task explicitly expands scope.

## Branch

- main
