# Project Status

Last updated: 06/05/2026 08:55:00 PDT

## State

Resonate is a working content operations app with active surfaces for calendar planning, content editing, workflow review, idea capture, and a protected `/v2` Postiz-style tracer for the rebuild workflow. Legacy Resonate remains deployed behind Clerk auth while the Postiz fork continues side-by-side.

## Current Task

Track the Postiz rebuild against issue #38 and its related implementation issues while keeping legacy Resonate functional.

## Session Focus

- Merged the Postiz fork runtime fix for Corvo Labs Blog publishing workflows in `jakebutler/resonate-postiz` PR #6.
- Validated local real Postiz runtime: Corvo Labs Blog custom channel connected, Idea -> Pioneer AI draft -> linked draft Post worked, and immediate Corvo blog publishing created `jakebutler/corvo-labs-dot-com` PR #51.
- Refreshed Vercel production env for `PIONEER_API_KEY`, `PIONEER_DRAFT_MODEL`, and `V2_OPS_SECRET`.
- Fixed Vercel deploy failure by making `scripts/install-git-hooks.sh` skip hook installation outside git worktrees.
- Deployed Resonate production successfully to `https://resonate.corvolabs.com`.
- Ran the protected production `/api/v2/ops/validate-workflow` smoke: Pioneer draft passed, YouTube placeholder validation passed, and Corvo Labs blog PR creation returned `jakebutler/corvo-labs-dot-com` PR #50.
- Updated #38 and closed proven implementation slices #42, #45, #46, and #47.

## Last Completed Task

- 84b6e9a fix: skip git hook install outside worktrees

## Recent Commits

- 84b6e9a fix: skip git hook install outside worktrees
- 59ff50f docs: record Postiz fork creation
- b5833e3 docs: add Postiz brand workspace validation notes
- f2ff655 docs: add Postiz foundation runbook
- 4e44e1f docs: complete Postiz feasibility spike

## Local Working Tree

- Clean in Resonate after the production deploy fix.
- The sibling Postiz fork checkout at `/Volumes/rexy/GitHub/postiz-app` is on `main` at `7fd573df` with only local-only `docker-compose.local-runtime.yml` untracked.

## Next Agent Pickup

- Keep issue #38 open until the remaining related backlog is either intentionally descoped or completed.
- Continue with the still-open related issues: #43/#44 for fuller Ideas inbox/source duplicate behavior, #48/#49 for richer AI session and multi-platform adaptation, #50/#51 for Postiz off-the-shelf media/inbox validation, #52-#54 for the research/editorial pipeline, and #55-#57 for cutover readiness, ops hardening, and credential checklists.
- Production validation proof currently lives in issue #38 comment `4633290113`.
- Do not delete legacy Resonate yet; both legacy Resonate and the Postiz fork must keep working side-by-side.

## Branch

- main
