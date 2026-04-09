# Project Status

Last updated: 04/09/2026 09:00:10 PDT

## State

Resonate is a working content operations app with active surfaces for planning, drafting, workflow review, and idea capture. On `feature/fullscreen-editor`, blog drafting now routes through the fullscreen Tiptap editor while LinkedIn still uses the legacy modal path.

## Current Task

Maintain the living docs and leave a handoff-quality snapshot of the current branch state without touching non-doc product files.

## What Is Landed

- `a4b8018` hardened the fullscreen editor around first-save and publish timing, tightened `/api/publish` metadata handling, and routed blog create/edit entry points from the dashboard into `/editor/[id]`.
- The current editor route supports queued autosave, selection-aware AI chat, inline image upload with hero selection, metadata editing, and PR-based publish handoff.
- Publish creates a GitHub PR and stores `githubPrUrl` back on the `posts` record; it does not complete the final merge or live-publish step inside Resonate.

## Local Working Tree

- `M components/EditorChat/EditorChat.tsx`
- `M components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx`

Those two non-doc changes were already present during this documentation pass. No code changes were made outside the three docs files.

## Non-Obvious Constraints

- The fullscreen editor writes directly to the shared `posts` table, so calendar, library, workflow drafts, and fullscreen edits all converge on the same records.
- The route is blog-first, not blog-only: new `/editor/new` drafts are always blog posts, but existing non-blog `posts` are not blocked at the route boundary.
- Autosave is serialized. If a save is in flight, the next title/content pair is buffered and written immediately after the first request resolves.
- Publish on a brand-new draft must persist the post first. That guard exists to avoid duplicate `posts.create` calls when publish is pressed during the first autosave window.
- AI rewrites depend on the stored editor selection range still being valid. If the underlying text changed, the editor asks for confirmation before overwriting.

## Recommended Pickup

- Check the local diffs in `components/EditorChat/EditorChat.tsx` and `components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx` before adding more fullscreen-editor work; they are the only non-doc files still marked modified.
- If product work continues on publish semantics, verify whether post status, `publishedAt`, and GitHub merge completion should stay decoupled or be aligned more explicitly.
- If AI rewrite polish continues, decide whether dismissing the selection chip should also clear the visible editor selection, not just sidebar state.

## Recent Commits

- a4b8018 fix: harden fullscreen editor flows and route blog entry points
- a78192c feat: wire selection-aware editor chat and queued autosave
- 474f527 feat: phase 4 image handling and publish hardening
- df246ee feat: Phase 3 — markdown serialization, metadata bar, publish + CodeRabbit fixes
- 2e5f0b7 feat: Phase 2 — resizable AI chat sidebar + fix TypeScript build error

## Branch

- feature/fullscreen-editor
