# Project Status

Last updated: 04/09/2026 08:55:59 PDT

## State

`feature/fullscreen-editor` is mid-stream on the blog editor rollout. The fullscreen route is now the primary blog editing path from the dashboard, while LinkedIn editing remains on the legacy modal flow.

## Current Working Set

- `app/page.tsx` now routes blog create/edit actions from the calendar and library to `/editor/new` and `/editor/[id]`.
- `components/FullScreenEditor/FullScreenEditor.tsx` stages queued autosave, selection-aware AI rewrite acceptance, image upload/remove flows, and publish handoff.
- `components/TiptapEditor/TiptapEditor.tsx` exposes selection coordinates/text plus imperative range replacement and Markdown export.
- `components/EditorChat/EditorChat.tsx` sends selected text as quoted context to `/api/llm` and surfaces `<rewrite>...</rewrite>` suggestions for acceptance.
- `app/api/publish/route.ts` now validates optional publish metadata and prefers `heroImageUrl` when present.
- `lib/imageOptimize.ts` preserves WebP uploads, converts GIF uploads to PNG, and still rejects unsupported types or files over 10MB.

## Non-Obvious Behavior

- Autosave is serialized, not parallel: a save in flight blocks another write, and the latest pending title/content pair is replayed immediately after the current save finishes.
- Metadata is not stored in that pending payload; saves read the latest local metadata snapshot when they execute.
- Publish first ensures the post exists in Convex, then sends Markdown rather than HTML to `/api/publish`.
- Accepting an AI suggestion replaces the stored range directly; if the selected text drifted, the user gets a confirm prompt before overwrite.
- Dismissing selection state from the sidebar clears sidebar state only; it does not actively clear the browser/editor text selection.

## Open Risks

- Publish semantics still depend on whatever local `status` is set when the PR request runs, so the PR handoff model and local post status should be re-checked together.
- The rewrite path assumes the saved ProseMirror range is still usable; heavy edits between request and acceptance can still produce awkward replacements even with the confirm guard.
- The docs agent did not run tests, so the current staged suite status is unknown.

## Next Agent Pickup

- Start in the fullscreen editor and verify the current staged behavior before adding more surface area.
- Check that queued autosave, metadata-only edits, and publish interactions still behave correctly together.
- Decide whether sidebar dismissal should also clear editor selection and whether publish should normalize post status after PR creation.
- Run the relevant tests for dashboard routing, editor chat, fullscreen editor behavior, publish route validation, and image optimization before shipping.

## Recent Commits

- a78192c feat: wire selection-aware editor chat and queued autosave
- 474f527 feat: phase 4 image handling and publish hardening
- df246ee feat: Phase 3 — markdown serialization, metadata bar, publish + CodeRabbit fixes
- 2e5f0b7 feat: Phase 2 — resizable AI chat sidebar + fix TypeScript build error
- 1ae26ae feat: Phase 1 tracer bullet — full-screen editor route with Tiptap and auto-save

## Local Working Tree

- M  app/__tests__/page.test.tsx
- M  app/api/publish/__tests__/route.test.ts
- M  app/api/publish/route.ts
- M  app/page.tsx
- M  components/EditorChat/EditorChat.tsx
- M  components/EditorChat/__tests__/EditorChat.test.tsx
- M  components/FullScreenEditor/FullScreenEditor.tsx
- M  components/FullScreenEditor/MetadataBar.tsx
- M  components/FullScreenEditor/ResizeHandle.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M  components/TiptapEditor/TiptapEditor.tsx
- M  components/TiptapEditor/Toolbar.tsx
- M  lib/__tests__/imageOptimize.test.ts
- M  lib/imageOptimize.ts

## Branch

- feature/fullscreen-editor
