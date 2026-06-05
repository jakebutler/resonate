# Project Status

Last updated: 06/05/2026 01:09:21 PDT

## State

Resonate is a working content operations app with active surfaces for calendar planning, content editing, workflow review, and idea capture.

## Current Task

Maintain the living documentation and preserve a handoff-quality snapshot of the repo state.

## Session Focus

- Touched the captured ideas experience.
- Touched auth or environment wiring.
- Touched the main dashboard surfaces.

## Last Completed Task

- 5bc37c7 Enforce Corvo Labs MDX contract; fix editor scroll; ship publish flow to main (#36)

## Recent Commits

- 5bc37c7 Enforce Corvo Labs MDX contract; fix editor scroll; ship publish flow to main (#36)
- 2835656 chore: harden docs pre-commit workflow (#33)
- 296117e fix: keep image tray pinned and hero control visible on touch (#34)
- ea0f959 feat: Full-screen blog post editor with Tiptap WYSIWYG (#32)
- 160be4a fix: harden prod auth wiring

## Local Working Tree

- M  .env.local.example
- M  app/api/publish/route.ts
- A  app/api/v2/generate-draft/route.ts
- A  app/api/v2/validate-youtube/route.ts
- M  app/ideas/page.tsx
- M  app/layout.tsx
- M  app/page.tsx
- A  app/v2/page.tsx
- M  components/ConvexClientProvider.tsx
- A  components/V2ResonateApp.tsx
- A  lib/__tests__/v2.test.ts
- M  lib/github.ts
- A  lib/v2.ts
-  M package-lock.json

## Next Agent Pickup

- Start by checking the living docs against the current code before making assumptions.
- If the working set includes product changes, keep `docs/spec.md`, `docs/changelog.md`, and `docs/project-status.md` aligned in the same session.
- Review the in-flight auth/env wiring changes before touching shared layout or Clerk/Convex setup.
- Do not conflate the captured ideas inbox with the separate workflow idea system.

## Branch

- codex/postiz-v2-mvp
