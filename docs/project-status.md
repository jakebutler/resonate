# Project Status

Last updated: 04/09/2026 01:19:23 PDT

## State

Resonate is a working content operations app with live calendar, library, workflow, ideas, and fullscreen blog-drafting surfaces. The active branch is extending the fullscreen editor beyond plain title/body autosave into metadata-aware drafting and PR-based publication.

## Current Task

Bring the fullscreen editor's metadata and publish flow to a coherent state without regressing the existing autosave editor path.

## Session Focus

- The fullscreen editor now has a `MetadataBar` for status, date, time, tags, SEO description, and GitHub PR state.
- `posts` schema and mutations were expanded to store fullscreen-editor metadata fields.
- `/api/publish` and `lib/github.ts` now accept richer frontmatter inputs for blog PR creation.
- `TiptapEditor` gained `tiptap-markdown`, but the publish caller has not fully switched to Markdown output yet.

## Last Completed Task

- 2e5f0b7 feat: Phase 2 — resizable AI chat sidebar + fix TypeScript build error

## Recent Commits

- 2e5f0b7 feat: Phase 2 — resizable AI chat sidebar + fix TypeScript build error
- 1ae26ae feat: Phase 1 tracer bullet — full-screen editor route with Tiptap and auto-save
- 160be4a fix: harden prod auth wiring
- 0a744a3 docs: add living documentation workflow
- f93c209 Fix brittle editor test dates

## Local Working Tree

- M  app/api/publish/route.ts
- M  components/FullScreenEditor/FullScreenEditor.tsx
- A  components/FullScreenEditor/MetadataBar.tsx
- M  components/FullScreenEditor/ResizeHandle.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- A  components/FullScreenEditor/__tests__/MetadataBar.test.tsx
- MM components/TiptapEditor/TiptapEditor.tsx
- M  convex/posts.ts
- M  convex/schema.ts
- M  lib/github.ts
- M  package-lock.json
- M  package.json

## Open Edges

- `handlePublish` still calls `editorRef.current?.getHTML()` even though `TiptapEditor` now exposes `getMarkdown()`. The GitHub helper writes `.mdx`, so the content format decision is still unresolved in code.
- The publish request can include `heroImage`, but the fullscreen UI and current post writes only handle `heroImageId`; there is no hero-image selection/upload path yet.
- After PR creation, the post is patched to `status: "scheduled"` even though the outbound publish payload uses `status: "published"` for frontmatter. That mismatch should be made deliberate or removed.
- New-post creation still only seeds `type`, `title`, `content`, `status`, and `scheduledDate`; richer metadata is only persisted on later updates.
- The AI sidebar remains scaffolded around `selectedText`, but the fullscreen editor still does not populate selection state from Tiptap or apply accepted suggestions back into the document.

## Next Agent Pickup

- Start in [components/FullScreenEditor/FullScreenEditor.tsx](/Users/jacobbutler/Documents/GitHub/resonate/components/FullScreenEditor/FullScreenEditor.tsx) and decide whether publish output should be Markdown or HTML in the generated GitHub file.
- Reconcile the publish-state contract across [components/FullScreenEditor/FullScreenEditor.tsx](/Users/jacobbutler/Documents/GitHub/resonate/components/FullScreenEditor/FullScreenEditor.tsx), [app/api/publish/route.ts](/Users/jacobbutler/Documents/GitHub/resonate/app/api/publish/route.ts), and [lib/github.ts](/Users/jacobbutler/Documents/GitHub/resonate/lib/github.ts) so post status, PR state, and frontmatter mean the same thing.
- If hero images are in scope for this branch, add an end-to-end path that connects the `heroImageId` field in Convex to the publish payload; otherwise leave the schema field in place but keep it explicitly unused.
- Re-run or extend the fullscreen editor tests once the content-format and publish-state decisions are finalized, especially around metadata autosave and PR creation behavior.

## Branch

- feature/fullscreen-editor
