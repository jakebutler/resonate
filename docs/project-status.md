# Project Status

Last updated: 04/09/2026 01:03:39 PDT

## State

Resonate is a working internal content ops app with active calendar, library, workflow, and idea-capture surfaces. On `feature/fullscreen-editor`, a new fullscreen blog drafting route is staged but not yet wired into the main dashboard editing flow.

## Current Branch Focus

Ship the fullscreen editor slice without losing clarity about how it fits with the older editors:

- `app/editor/[id]/page.tsx` adds the dedicated route shell.
- `components/FullScreenEditor/FullScreenEditor.tsx` adds a fullscreen editor with 3-second debounced autosave.
- `components/TiptapEditor/TiptapEditor.tsx` and `components/TiptapEditor/Toolbar.tsx` add the Tiptap-based rich text surface.
- `components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx` covers render, back navigation, new-post create, save status, and existing-post update behavior.

## What Is True Right Now

- `/editor/new?date=YYYY-MM-DD` does not create a `posts` record immediately; the first autosave does.
- The first create from the fullscreen route always inserts a blog post with `status: "draft"` and passes `date` through as the initial `scheduledDate`.
- After first save, the route replaces itself with `/editor/[newId]`.
- The fullscreen editor currently edits only title and HTML content through shared `posts.create` and `posts.update` Convex mutations.
- The toolbar exposes headings, bold, italic, links, lists, blockquotes, and code blocks.
- The toolbar also shows an image button, but no image insertion flow is implemented yet.
- The dashboard at `/` still opens the legacy slide-over blog and LinkedIn editors. No current code routes dashboard create/edit actions into `/editor/[id]`.

## Open Risks And Next Decisions

- Decide whether the fullscreen editor is the new primary blog editor or an additional drafting surface.
- If it should replace the blog slide-over, wire calendar and library blog actions to `/editor/[id]` and define how scheduling, publish-to-GitHub, uploads, and AI tools move over.
- Confirm whether autosave-only creation is acceptable for empty drafts, because a user can land on `/editor/new` and leave without creating any record.
- Confirm whether direct navigation to an existing non-blog `posts` record should be blocked or intentionally supported.
- Run the relevant tests once the branch settles; this docs pass did not run them.

## Recent Commits

- 160be4a fix: harden prod auth wiring
- 0a744a3 docs: add living documentation workflow
- f93c209 Fix brittle editor test dates
- 1b0c676 Merge branch 'codex/inspiration-ideas'
- 906bd3e Harden env wiring and simplify workflow board cards

## Local Working Tree

- A  app/editor/[id]/page.tsx
- A  components/FullScreenEditor/FullScreenEditor.tsx
- A  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- A  components/TiptapEditor/TiptapEditor.tsx
- A  components/TiptapEditor/Toolbar.tsx
- A  docs/plans/2026-04-09-fullscreen-editor-implementation-plan.md
- A  docs/plans/2026-04-09-ppg-flow-implementation-plan.md
- M  docs/changelog.md
- M  docs/spec.md
- M  package-lock.json
- M  package.json

## Next Agent Pickup

- Start from the staged fullscreen editor files, not from the older modal-editor assumptions.
- Check whether this branch is supposed to re-route blog editing from the dashboard or keep the new route isolated for now.
- If product behavior changes, keep [`docs/spec.md`](/Users/jacobbutler/Documents/GitHub/resonate/docs/spec.md), [`docs/changelog.md`](/Users/jacobbutler/Documents/GitHub/resonate/docs/changelog.md), and [`docs/project-status.md`](/Users/jacobbutler/Documents/GitHub/resonate/docs/project-status.md) aligned in the same session.

## Branch

- feature/fullscreen-editor
