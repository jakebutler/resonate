# Project Status

Last updated: 04/12/2026 00:12:04 PDT

## State

Resonate is running with the newer fullscreen blog editor layered on top of the older dashboard and workflow surfaces. The active branch is focused on editor image-tray usability rather than a broader product change.

## Current Task

The living docs were refreshed to match branch `fix/pinned-image-tray-touch-hero` and the current dirty worktree.

## Last Completed Task

- `493487c` `fix: pin image tray and expose hero control on touch`

## Verified In This Session

- `components/ImageTray/__tests__/ImageTray.test.tsx`
- `components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx`
- Result: 31 tests passed via `npm test -- --run components/ImageTray/__tests__/ImageTray.test.tsx components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx`

## Local Working Tree

- M `components/FullScreenEditor/FullScreenEditor.tsx`
- M `components/FullScreenEditor/__tests__/FullScreenEditor.test.tsx`
- M `components/ImageTray/ImageTray.tsx`
- M `components/ImageTray/__tests__/ImageTray.test.tsx`

## Non-Obvious Current Behavior

- The image tray is rendered outside the main editor scroll container, so it stays reachable while long post content scrolls.
- Hero-image selection still lives only in the image tray. There is no duplicate control in the metadata bar.
- Tray controls are input-aware: hover devices reveal actions on hover, while touch or coarse-pointer devices keep them visible.
- Removing an image updates both the stored `fileIds` metadata and the editor HTML. Clearing the active hero happens implicitly if that image is removed.

## Next Agent Pickup

- Start from the four dirty editor/image-tray files, not from commit `493487c` alone. The branch already has the pinned-tray and touch-control behavior in history, but the worktree still contains uncommitted edits in the same area.
- If you change image handling again, keep the cross-file contract aligned: `FullScreenEditor` owns HTML and metadata updates, while `ImageTray` is only the tray UI plus input-mode behavior.
- Re-run the two targeted Vitest files after any further tray/editor change.

## Recent Commits

- `493487c` `fix: pin image tray and expose hero control on touch`
- `ea0f959` `feat: Full-screen blog post editor with Tiptap WYSIWYG (#32)`
- `160be4a` `fix: harden prod auth wiring`
- `0a744a3` `docs: add living documentation workflow`
- `f93c209` `Fix brittle editor test dates`

## Branch

- `fix/pinned-image-tray-touch-hero`
