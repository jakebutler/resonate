# Changelog

Append-only session log for repository-level updates. Each documentation refresh should add one new entry at the bottom.

## 03/16/2026 00:42:14 PDT

### Summary

- Refreshed `docs/spec.md` against the current codebase instead of the previous docs snapshot.
- Recorded the active auth/env hardening work and docs-update automation in the handoff docs.
- Preserved append-only changelog behavior while leaving non-doc work untouched.

### Staged Changes

- No staged changes were present during this documentation pass.

### Working Tree Snapshot

-  M app/layout.tsx
-  M convex/auth.config.ts
-  M package.json
- ?? .codex/
- ?? .githooks/
- ?? docs/changelog.md
- ?? docs/project-status.md
- ?? docs/spec.md
- ?? scripts/install-git-hooks.sh
- ?? scripts/update-docs.mjs

### Branch

- main

## 03/16/2026 01:04:35 PDT

### Summary

- Refreshed the living docs against the current codebase and kept `docs/spec.md` high-level.
- Recorded the stricter Clerk and Convex environment requirements now present in the in-flight auth wiring.
- Captured the new docs automation and pre-commit hook work in the handoff docs without touching non-doc files.

### Staged Changes

- A	.codex/prompts/documentation-subagent.md
- A	.githooks/pre-commit
- A	docs/changelog.md
- A	docs/project-status.md
- A	docs/spec.md
- M	package.json
- A	scripts/install-git-hooks.sh
- A	scripts/update-docs.mjs

### Working Tree Snapshot

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

### Branch

- main

## 03/16/2026 01:29:04 PDT

### Summary

- Repaired the production Clerk-to-Convex auth path by aligning the app and Convex auth config with explicit environment-driven values.
- Verified the production app now points at the Convex prod deployment instead of the old shared dev target.
- Ran the historical content backfill against Convex production and confirmed the published Corvo Labs archive is present there.

### Staged Changes

- No staged changes were present when the docs refresh ran.

### Working Tree Snapshot

-  M app/layout.tsx
-  M convex/auth.config.ts

### Branch

- main

## 03/16/2026 01:30:02 PDT

### Summary

- Finalized the production auth recovery by aligning Clerk, Convex, and Vercel around explicit environment-driven config.
- Confirmed the production app now points at the Convex prod deployment and no longer depends on placeholder layout defaults.
- Verified the historical content backfill is present in Convex prod and documented the remaining repo cleanup as a source-control task.

### Staged Changes

- M	app/layout.tsx
- M	convex/auth.config.ts
- M	docs/changelog.md
- M	docs/project-status.md
- M	docs/spec.md

### Working Tree Snapshot

- M  app/layout.tsx
- M  convex/auth.config.ts
- M  docs/changelog.md
- M  docs/project-status.md
- M  docs/spec.md

### Branch

- main

## 04/09/2026 01:03:39 PDT

### Summary

- Refreshed the living docs against the current `feature/fullscreen-editor` working tree and staged changes.
- Kept `docs/spec.md` high-level while documenting the new `/editor/[id]` fullscreen editor, its autosave-first create flow, and the fact that it still coexists with the older modal editors.
- Replaced the project handoff with the current branch state, open risks, and next pickup points for the fullscreen editor work.

### Staged Changes

- A	app/editor/[id]/page.tsx
- A	components/FullScreenEditor/FullScreenEditor.tsx
- A	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- A	components/TiptapEditor/TiptapEditor.tsx
- A	components/TiptapEditor/Toolbar.tsx
- A	docs/plans/2026-04-09-fullscreen-editor-implementation-plan.md
- A	docs/plans/2026-04-09-ppg-flow-implementation-plan.md
- M	package-lock.json
- M	package.json

### Working Tree Snapshot

- A  app/editor/[id]/page.tsx
- A  components/FullScreenEditor/FullScreenEditor.tsx
- A  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- A  components/TiptapEditor/TiptapEditor.tsx
- A  components/TiptapEditor/Toolbar.tsx
- A  docs/plans/2026-04-09-fullscreen-editor-implementation-plan.md
- A  docs/plans/2026-04-09-ppg-flow-implementation-plan.md
-  M docs/project-status.md
- M  package-lock.json
- M  package.json

### Branch

- feature/fullscreen-editor

## 04/09/2026 01:09:56 PDT

### Summary

- Refreshed the living docs for the current `feature/fullscreen-editor` working tree after the new editor copilot sidebar was staged.
- Kept `docs/spec.md` high-level while documenting the fullscreen editor's resizable AI panel, model selection, and the still-unwired text-selection/apply-suggestion path.
- Replaced the handoff doc with the latest pickup guidance centered on wiring editor selection into the sidebar and deciding whether accepted AI output should patch the document.

### Staged Changes

- A	components/EditorChat/EditorChat.tsx
- A	components/EditorChat/__tests__/EditorChat.test.tsx
- M	components/FullScreenEditor/FullScreenEditor.tsx
- A	components/FullScreenEditor/ResizeHandle.tsx
- M	components/TiptapEditor/TiptapEditor.tsx

### Working Tree Snapshot

- A  components/EditorChat/EditorChat.tsx
- A  components/EditorChat/__tests__/EditorChat.test.tsx
- M  components/FullScreenEditor/FullScreenEditor.tsx
- A  components/FullScreenEditor/ResizeHandle.tsx
- M  components/TiptapEditor/TiptapEditor.tsx
- M  docs/project-status.md

### Branch

- feature/fullscreen-editor

## 04/09/2026 01:19:23 PDT

### Summary

- Refreshed the living docs against the current `feature/fullscreen-editor` working tree after the fullscreen editor picked up metadata controls and a PR-based publish path.
- Kept `docs/spec.md` high-level while documenting the new scheduling and SEO metadata, the GitHub PR handoff model, and the non-obvious gaps that are still easy to miss in the current editor flow.
- Replaced the project handoff with the latest pickup guidance centered on aligning publish output, metadata persistence, and the remaining incomplete editor integrations.

### Staged Changes

- M	app/api/publish/route.ts
- M	components/FullScreenEditor/FullScreenEditor.tsx
- A	components/FullScreenEditor/MetadataBar.tsx
- M	components/FullScreenEditor/ResizeHandle.tsx
- M	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- A	components/FullScreenEditor/__tests__/MetadataBar.test.tsx
- M	components/TiptapEditor/TiptapEditor.tsx
- M	convex/posts.ts
- M	convex/schema.ts
- M	lib/github.ts
- M	package-lock.json
- M	package.json

### Working Tree Snapshot

- M  app/api/publish/route.ts
- M  components/FullScreenEditor/FullScreenEditor.tsx
- A  components/FullScreenEditor/MetadataBar.tsx
- M  components/FullScreenEditor/ResizeHandle.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- A  components/FullScreenEditor/__tests__/MetadataBar.test.tsx
- MM components/TiptapEditor/TiptapEditor.tsx
- M  convex/posts.ts
- M  convex/schema.ts
- M  docs/project-status.md
- M  lib/github.ts
- M  package-lock.json
- M  package.json

### Branch

- feature/fullscreen-editor

## 04/09/2026 09:00:10 PDT

### Summary

- Refreshed the living docs against the current `feature/fullscreen-editor` state after the fullscreen editor hardening work landed and blog entry points on `/` were routed into `/editor/[id]`.
- Kept `docs/spec.md` high-level while tightening the non-obvious behavior around queued autosave, publish-before-first-save protection, selection-aware AI rewrites, and the PR handoff model.
- Replaced the handoff doc with the latest pickup guidance, explicitly separating committed fullscreen-editor behavior from the two non-doc local changes still present in the working tree.

### Staged Changes

- M	components/EditorChat/EditorChat.tsx
- M	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx

### Working Tree Snapshot

- M  components/EditorChat/EditorChat.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
-  M docs/project-status.md

### Branch

- feature/fullscreen-editor

## 04/09/2026 08:55:59 PDT

### Summary

- Refreshed the living docs for the current `feature/fullscreen-editor` working tree after the editor picked up queued autosave, selection-aware rewrite acceptance, dashboard routing into the fullscreen blog editor, and tighter publish/image handling.
- Kept `docs/spec.md` high-level while documenting the new cross-file behavior that is easy to miss: blog actions now route from the dashboard into `/editor/[id]`, publish sends Markdown plus validated metadata, and autosave now serializes overlapping writes instead of racing them.
- Replaced the handoff doc with the latest pickup guidance for the staged fullscreen-editor work without touching non-doc files.

### Staged Changes

- M	app/__tests__/page.test.tsx
- M	app/api/publish/__tests__/route.test.ts
- M	app/api/publish/route.ts
- M	app/page.tsx
- M	components/EditorChat/EditorChat.tsx
- M	components/EditorChat/__tests__/EditorChat.test.tsx
- M	components/FullScreenEditor/FullScreenEditor.tsx
- M	components/FullScreenEditor/MetadataBar.tsx
- M	components/FullScreenEditor/ResizeHandle.tsx
- M	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M	components/TiptapEditor/TiptapEditor.tsx
- M	components/TiptapEditor/Toolbar.tsx
- M	lib/__tests__/imageOptimize.test.ts
- M	lib/imageOptimize.ts

### Working Tree Snapshot

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

### Branch

- feature/fullscreen-editor

## 04/09/2026 01:47:24 PDT

### Summary

- Refreshed the living docs against the current `feature/fullscreen-editor` working tree after the editor picked up image upload, image tray, hero-image selection, and publish-path adjustments.
- Kept `docs/spec.md` high-level while documenting the split image flow across Tiptap HTML, Convex storage, and GitHub frontmatter, plus the still-easy-to-miss publish status mismatch.
- Replaced the handoff doc with the latest pickup guidance centered on validating the image workflow and finishing the remaining editor-to-publish alignment work.

### Staged Changes

- M	app/api/publish/__tests__/route.test.ts
- M	app/api/publish/route.ts
- M	components/FullScreenEditor/FullScreenEditor.tsx
- M	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- A	components/ImageTray/ImageTray.tsx
- A	components/ImageTray/__tests__/ImageTray.test.tsx
- M	components/TiptapEditor/TiptapEditor.tsx
- M	components/TiptapEditor/Toolbar.tsx
- M	lib/__tests__/github.test.ts
- A	lib/__tests__/imageOptimize.test.ts
- M	lib/github.ts
- A	lib/imageOptimize.ts
- M	package-lock.json
- M	package.json

### Working Tree Snapshot

- M  app/api/publish/__tests__/route.test.ts
- M  app/api/publish/route.ts
- M  components/FullScreenEditor/FullScreenEditor.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- A  components/ImageTray/ImageTray.tsx
- A  components/ImageTray/__tests__/ImageTray.test.tsx
- M  components/TiptapEditor/TiptapEditor.tsx
- M  components/TiptapEditor/Toolbar.tsx
- M  docs/project-status.md
- M  lib/__tests__/github.test.ts
- A  lib/__tests__/imageOptimize.test.ts
- M  lib/github.ts
- A  lib/imageOptimize.ts
- M  package-lock.json
- M  package.json

### Branch

- feature/fullscreen-editor

## 04/09/2026 08:42:46 PDT

### Summary

- Refreshed the living docs against the current `feature/fullscreen-editor` working tree after the fullscreen editor picked up real text-selection handoff into the AI sidebar and in-editor suggestion acceptance.
- Kept `docs/spec.md` high-level while documenting the now-wired Ask-AI flow, the still-easy-to-miss overwrite confirmation behavior, and the remaining split between editor UI state and actual ProseMirror selection state.
- Replaced the handoff doc with the latest pickup guidance centered on hardening the selection-rewrite path and validating the current editor changes before the next commit attempt.

### Staged Changes

- M	app/editor/[id]/page.tsx
- M	components/EditorChat/EditorChat.tsx
- M	components/EditorChat/__tests__/EditorChat.test.tsx
- M	components/FullScreenEditor/FullScreenEditor.tsx
- M	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M	components/TiptapEditor/TiptapEditor.tsx

### Working Tree Snapshot

- M  app/editor/[id]/page.tsx
- M  components/EditorChat/EditorChat.tsx
- M  components/EditorChat/__tests__/EditorChat.test.tsx
- M  components/FullScreenEditor/FullScreenEditor.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M  components/TiptapEditor/TiptapEditor.tsx

### Branch

- feature/fullscreen-editor

## 04/09/2026 11:11:27 PDT

### Summary

- Adjusted commit-time automation for documentation refreshes.

### Staged Changes

- M	components/FullScreenEditor/FullScreenEditor.tsx
- M	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx

### Working Tree Snapshot

-  M .githooks/pre-commit
- M  components/FullScreenEditor/FullScreenEditor.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
-  M package-lock.json
-  M package.json
-  M scripts/update-docs.mjs

### Branch

- feature/fullscreen-editor

## 04/09/2026 11:20:48 PDT

### Summary

- Adjusted commit-time automation for documentation refreshes.

### Staged Changes

- M	components/TiptapEditor/TiptapEditor.tsx
- A	components/TiptapEditor/__tests__/TiptapEditor.test.tsx

### Working Tree Snapshot

-  M .githooks/pre-commit
- M  components/TiptapEditor/TiptapEditor.tsx
- A  components/TiptapEditor/__tests__/TiptapEditor.test.tsx
-  M package-lock.json
-  M package.json
-  M scripts/update-docs.mjs

### Branch

- feature/fullscreen-editor

## 04/09/2026 12:20:49 PDT

### Summary

- Adjusted commit-time automation for documentation refreshes.

### Staged Changes

- M	components/FullScreenEditor/FullScreenEditor.tsx
- M	components/FullScreenEditor/MetadataBar.tsx
- M	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M	components/FullScreenEditor/__tests__/MetadataBar.test.tsx
- M	components/TiptapEditor/TiptapEditor.tsx
- M	components/TiptapEditor/__tests__/TiptapEditor.test.tsx

### Working Tree Snapshot

-  M .githooks/pre-commit
- M  components/FullScreenEditor/FullScreenEditor.tsx
- M  components/FullScreenEditor/MetadataBar.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M  components/FullScreenEditor/__tests__/MetadataBar.test.tsx
- M  components/TiptapEditor/TiptapEditor.tsx
- M  components/TiptapEditor/__tests__/TiptapEditor.test.tsx
-  M package-lock.json
-  M package.json
-  M scripts/update-docs.mjs

### Branch

- feature/fullscreen-editor

## 04/09/2026 13:48:15 PDT

### Summary

- Adjusted commit-time automation for documentation refreshes.

### Staged Changes

- M	components/FullScreenEditor/FullScreenEditor.tsx
- M	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M	components/TiptapEditor/TiptapEditor.tsx
- M	components/TiptapEditor/__tests__/TiptapEditor.test.tsx

### Working Tree Snapshot

-  M .githooks/pre-commit
- M  components/FullScreenEditor/FullScreenEditor.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M  components/TiptapEditor/TiptapEditor.tsx
- M  components/TiptapEditor/__tests__/TiptapEditor.test.tsx
-  M package-lock.json
-  M package.json
-  M scripts/update-docs.mjs

### Branch

- feature/fullscreen-editor

## 04/09/2026 13:59:26 PDT

### Summary

- Adjusted commit-time automation for documentation refreshes.

### Staged Changes

- M	components/FullScreenEditor/MetadataBar.tsx
- M	components/FullScreenEditor/__tests__/MetadataBar.test.tsx

### Working Tree Snapshot

-  M .githooks/pre-commit
- M  components/FullScreenEditor/MetadataBar.tsx
- M  components/FullScreenEditor/__tests__/MetadataBar.test.tsx
-  M package-lock.json
-  M package.json
-  M scripts/update-docs.mjs

### Branch

- feature/fullscreen-editor

## 04/09/2026 14:13:59 PDT

### Summary

- Adjusted commit-time automation for documentation refreshes.

### Staged Changes

- M	.github/workflows/test.yml

### Working Tree Snapshot

-  M .githooks/pre-commit
- M  .github/workflows/test.yml
-  M package-lock.json
-  M package.json
-  M scripts/update-docs.mjs

### Branch

- feature/fullscreen-editor

## 04/09/2026 14:16:32 PDT

### Summary

- Adjusted commit-time automation for documentation refreshes.

### Staged Changes

- M	.github/workflows/test.yml

### Working Tree Snapshot

-  M .githooks/pre-commit
- M  .github/workflows/test.yml
-  M package-lock.json
-  M package.json
-  M scripts/update-docs.mjs

### Branch

- feature/fullscreen-editor

## 04/09/2026 16:17:48 PDT

### Summary

- Adjusted commit-time automation for documentation refreshes.

### Staged Changes

- M	components/FullScreenEditor/FullScreenEditor.tsx
- M	components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M	components/TiptapEditor/Toolbar.tsx
- A	components/TiptapEditor/__tests__/Toolbar.test.tsx

### Working Tree Snapshot

-  M .githooks/pre-commit
- M  components/FullScreenEditor/FullScreenEditor.tsx
- M  components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx
- M  components/TiptapEditor/Toolbar.tsx
- A  components/TiptapEditor/__tests__/Toolbar.test.tsx
-  M package-lock.json
-  M package.json
-  M scripts/update-docs.mjs

### Branch

- feature/fullscreen-editor

## 04/09/2026 16:40:14 PDT

### Summary

- Adjusted commit-time automation for documentation refreshes.

### Staged Changes

- M	.github/workflows/test.yml
- M	playwright.config.ts
- M	proxy.ts

### Working Tree Snapshot

-  M .githooks/pre-commit
- M  .github/workflows/test.yml
-  M package-lock.json
-  M package.json
- M  playwright.config.ts
- M  proxy.ts
-  M scripts/update-docs.mjs
- ?? playwright-report/
- ?? test-results/

### Branch

- feature/fullscreen-editor
