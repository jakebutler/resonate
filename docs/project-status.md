# Project Status

Last updated: 04/09/2026 01:47:24 PDT

## State

`feature/fullscreen-editor` is in the middle of extending the fullscreen blog editor beyond plain text drafting. The active working set adds image upload and management, client-side image optimization, and publish-route changes that carry more metadata into the GitHub PR flow.

## What Changed In This Working Set

- The fullscreen editor now uploads images to Convex storage, inserts them into Tiptap, and derives an image tray from the current document plus stored `fileIds`.
- The image tray can scroll to an image, remove it from the document, and toggle which uploaded image is the hero image.
- Tiptap now exposes Markdown for publish, and the toolbar includes image insertion.
- `/api/publish` and `lib/github.ts` now accept richer metadata including `heroImageUrl`, tags, and description.
- `lib/imageOptimize.ts` adds client-side validation and compression before upload, with new tests around that path.

## Non-Obvious Current Behavior

- Uploads are optimistic in the editor: the inserted image initially uses a blob preview URL, then later HTML is rewritten with resolved storage URLs from Convex.
- The image tray is derived from editor HTML and `fileIds`, so image removal is not just UI state; it also has to remove the matching `img[data-file-id]` node from the document.
- Publish now sends Markdown to GitHub, but the local post is still patched to `scheduled` after creating a PR even though the outbound frontmatter status is `"published"`.
- Hero image frontmatter depends on converting the selected storage ID back into a URL during publish; if that resolution fails, the post can still save locally without a usable hero image URL for GitHub output.

## Recent Commits

- df246ee feat: Phase 3 — markdown serialization, metadata bar, publish + CodeRabbit fixes
- 2e5f0b7 feat: Phase 2 — resizable AI chat sidebar + fix TypeScript build error
- 1ae26ae feat: Phase 1 tracer bullet — full-screen editor route with Tiptap and auto-save
- 160be4a fix: harden prod auth wiring
- 0a744a3 docs: add living documentation workflow

## Local Working Tree

- M  app/api/publish/__tests__/route.test.ts
- M  app/api/publish/route.ts
- M  components/FullScreenEditor/FullScreenEditor.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- A  components/ImageTray/ImageTray.tsx
- A  components/ImageTray/__tests__/ImageTray.test.tsx
- M  components/TiptapEditor/TiptapEditor.tsx
- M  components/TiptapEditor/Toolbar.tsx
- M  lib/__tests__/github.test.ts
- A  lib/__tests__/imageOptimize.test.ts
- M  lib/github.ts
- A  lib/imageOptimize.ts
- M  package-lock.json
- M  package.json

## Next Agent Pickup

- Verify the new image workflow end to end: upload, autosave, reload existing post, hero-image selection, image removal, and publish with resolved image URLs.
- Decide whether the post status mismatch is intentional. Right now GitHub frontmatter receives `"published"` while Convex is updated to `scheduled` after PR creation.
- Check for any remaining editor/publish format drift. The editor now emits Markdown for publish, but the runtime path still depends on HTML for local editing and image-tray derivation.
- Keep documentation synced only if the working set changes behavior again; otherwise focus on stabilizing the editor path instead of expanding scope.

## Branch

- feature/fullscreen-editor
