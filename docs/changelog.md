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
