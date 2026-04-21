---
title: "feat: LinkedIn brand account (Corvo Labs vs the lower dB)"
type: feat
status: active
date: 2026-04-21
origin: docs/brainstorms/2026-04-21-linkedin-brand-account-requirements.md
---

# feat: LinkedIn brand account (Corvo Labs vs the lower dB)

## Overview

Add a persisted **LinkedIn brand** field on `posts` (two values: Corvo Labs and the lower dB), default and backfill **Corvo Labs**, expose it in the LinkedIn editor with accessible controls, and surface it on the **Content Library** and **calendar** with a library-side brand filter. Align all Convex insert/patch paths for LinkedIn—including import upserts—with the same rules (see origin **R4**).

## Problem Frame

Cross-promoting between two company pages makes an undifferentiated LinkedIn list ambiguous. The product must record which page each LinkedIn post targets and make that visible for planning (see origin: [docs/brainstorms/2026-04-21-linkedin-brand-account-requirements.md](docs/brainstorms/2026-04-21-linkedin-brand-account-requirements.md)).

## Requirements Trace

- **R1:** Persist brand per LinkedIn post (`corvo_labs` | `lower_db`); labels “Corvo Labs” / “the lower dB”.
- **R2:** Backfill existing LinkedIn rows to Corvo Labs; document assumption in deploy notes.
- **R3:** Blog posts omit the field (no UI, no required arg).
- **R4:** All insert/patch paths for LinkedIn, including `convex/backfill.ts` `upsertMany`, set or preserve brand; new inserts default Corvo unless payload adds brand later.
- **R5:** Editor: labeled, keyboard-operable control; default Corvo.
- **R6:** Non-editor creates default Corvo (ideas, workflow).
- **R7:** Content Library rows + calendar: visible brand; calendar must not use hover-only as sole signal for brand.
- **R8:** Content Library brand filter for type LinkedIn or all; default all brands; control near existing filters.
- **R9:** No LinkedIn API scope change.

Success criteria from origin: editor updates, post-migration correction, visible brand on library/calendar without hover-only dependence, accessible editor control.

## Scope Boundaries

- No configurable list of extra LinkedIn pages in this plan.
- Workflow Kanban cards do not require brand badges unless trivial reuse of the same formatter; origin emphasizes library + calendar.
- `scripts/backfill-content.ts` / `lib/backfill.ts`: update types and tests if import payloads are affected; optional `linkedinBrand` on imported LinkedIn posts can default Corvo for parity with **R4**.

## Context & Research

### Relevant Code and Patterns

- Schema: `convex/schema.ts` — `posts` table.
- Mutations: `convex/posts.ts` (`create`, `update`, `createFromIdea`); `convex/workflow.ts` (`createDraftFromIdea` insert); `convex/backfill.ts` (`upsertMany` insert/patch).
- Editor: `components/LinkedInPostEditor/LinkedInPostEditor.tsx`.
- Dashboard: `app/page.tsx` — loads `api.posts.list`, owns `filter` / `timePeriod`, renders `Calendar` and `ContentLibrary`.
- List UIs: `components/ContentLibrary/ContentLibrary.tsx` (grid with type column); `components/Calendar/Calendar.tsx` (day cells, first 3 posts + “+N more”).
- Tests: `components/Calendar/__tests__/Calendar.test.tsx`, `components/ContentLibrary/__tests__/ContentLibrary.test.tsx`, `app/__tests__/page.test.tsx`, `lib/__tests__/backfill.test.ts`.

### Institutional Learnings

- None in `docs/solutions/` for this repo.

### External References

- None required; Convex optional fields + discriminated usage by `type` is local convention.

## Key Technical Decisions

- **Field name and shape:** `linkedinBrand: v.optional(v.union(v.literal("corvo_labs"), v.literal("lower_db")))` on `posts`. After migration, every LinkedIn document should have the field set; blog docs leave it `undefined`. Mutations enforce: on `create`/`update` when `type === "linkedin"` (or when patching a document that is LinkedIn), require or default `linkedinBrand` so writes never clear it accidentally.
- **Internal vs display:** Store snake_case literals in Convex; map to display strings in the UI (single small helper or constant map in `lib/` or colocated in components—avoid duplication across Calendar, ContentLibrary, editor).
- **Migration:** One-shot internal mutation (e.g. `internal.posts.backfillLinkedinBrand`) or admin-only `mutation` run once from Convex dashboard after deploy; patches all `posts` where `type === "linkedin"` and `linkedinBrand` is missing → `corvo_labs`. Document operator step in plan verification.
- **Calendar density:** Each visible post row includes an inline brand indicator (abbreviation or second line). For posts hidden behind “+N more”, replace or augment with a **focusable** control (e.g. button) that expands the day’s list in-place or opens a minimal dialog listing posts with brands—satisfies origin **R7** non-hover-primary rule for all posts on that day.
- **Library filter:** New tri-state: `all | corvo_labs | lower_db`, applied only to LinkedIn rows when `filter` is `linkedin` or `all`; blog rows unchanged when type filter is `all`.

## Open Questions

### Resolved During Planning

- **Where to place filter state?** `app/page.tsx` alongside existing `filter` / `timePeriod`, passed into `ContentLibrary` as props.
- **Patch behavior on import:** `upsertMany` patches must not strip `linkedinBrand`; on insert for LinkedIn, set default `corvo_labs`.

### Deferred to Implementation

- Exact calendar expansion interaction (inline expand vs modal) and breakpoint styling.
- Whether `posts.list` needs a `linkedinBrand` index for scale (current dashboard loads full list); defer unless perf issue.

## Implementation Units

- [ ] **Unit 1: Schema and one-shot data migration**

**Goal:** Add `linkedinBrand` to `posts`; backfill existing LinkedIn documents to `corvo_labs`.

**Requirements:** R1, R2, R4 (data completeness).

**Dependencies:** None.

**Files:**

- Modify: `convex/schema.ts`
- Create or modify: `convex/posts.ts` (or `convex/migrations.ts` if project prefers) — internal/public mutation to run backfill once
- Test: add or extend `convex/` tests if the repo has Convex test harness; otherwise **Verification** lists manual Convex dashboard run

**Approach:**

- Add optional field to schema; deploy schema first.
- Implement `mutation` (or `internalMutation`) that patches all LinkedIn posts missing `linkedinBrand` to `corvo_labs`. Guard with comment that it is idempotent.

**Patterns to follow:**

- Existing Convex patterns in `convex/posts.ts`.

**Test scenarios:**

- **Happy path:** After migration, no `type === "linkedin"` doc lacks `linkedinBrand` (verify via query or script).
- **Edge case:** Running migration twice does not error and does not change already-set values.

**Verification:**

- Schema deploy succeeds; migration run once; sample query shows all LinkedIn posts have `linkedinBrand`.

- [ ] **Unit 2: Convex write paths — posts, workflow, captured ideas, backfill import**

**Goal:** Every code path that inserts or patches LinkedIn posts sets or preserves `linkedinBrand`.

**Requirements:** R3, R4, R5 (server defaults), R6.

**Dependencies:** Unit 1.

**Files:**

- Modify: `convex/posts.ts` (`create`, `update`, `createFromIdea`)
- Modify: `convex/workflow.ts` (`createDraftFromIdea` insert)
- Modify: `convex/backfill.ts` (`upsertMany` insert and patch; optional validator extension for future explicit brand)
- Modify: `convex/_generated/*` (regenerated by Convex CLI in dev)

**Approach:**

- `create`: accept optional `linkedinBrand` for LinkedIn; default `corvo_labs` when omitted and `type === "linkedin"`. Omit or ignore for blog.
- `update`: if document is LinkedIn, patch must preserve `linkedinBrand` when not provided, or apply provided value; never set to undefined for LinkedIn.
- `createFromIdea` / `createDraftFromIdea`: for LinkedIn, set `linkedinBrand: "corvo_labs"`.
- `backfill.upsertMany`: on insert for LinkedIn, set `linkedinBrand: "corvo_labs"`; on patch, include existing `linkedinBrand` if not in incoming payload, or default Corvo for new LinkedIn if missing on existing doc.

**Patterns to follow:**

- Existing validators in `convex/posts.ts` and `convex/backfill.ts`.

**Test scenarios:**

- **Integration:** `create` LinkedIn without `linkedinBrand` persists `corvo_labs`.
- **Integration:** `update` LinkedIn content without passing `linkedinBrand` leaves brand unchanged.
- **Integration:** `upsertMany` insert LinkedIn sets brand; patch does not remove brand.

**Verification:**

- Grep for `insert("posts"` and `patch` on posts; all LinkedIn paths covered.

- [ ] **Unit 3: Display helpers**

**Goal:** Single source for literal → label and optional abbreviation for calendar.

**Requirements:** R1 (labels), R7.

**Dependencies:** Unit 1 (literals stable).

**Files:**

- Create: `lib/linkedinBrand.ts` (or equivalent) — `LINKEDIN_BRAND_LABELS`, `formatLinkedinBrandLabel`, `formatLinkedinBrandShort`

**Approach:**

- Map `corvo_labs` → “Corvo Labs”, `lower_db` → “the lower dB”; short forms for tight UI (e.g. “Corvo” / “lower dB”) per design judgment.

**Test scenarios:**

- **Happy path:** Each key maps to expected label.

**Verification:**

- Imported by editor, ContentLibrary, Calendar only (no circular deps).

- [ ] **Unit 4: LinkedInPostEditor**

**Goal:** Brand selector on create/edit; persist via `create`/`update`.

**Requirements:** R5, R1, success criteria (a11y).

**Dependencies:** Unit 2, Unit 3.

**Files:**

- Modify: `components/LinkedInPostEditor/LinkedInPostEditor.tsx`
- Test: add `components/LinkedInPostEditor/__tests__/LinkedInPostEditor.test.tsx` if missing, or extend closest existing test

**Approach:**

- State `linkedinBrand` synced from `existing.linkedinBrand` defaulting to `corvo_labs`.
- Use native `<select>` or radio group with `aria-label` / `fieldset` + `legend` (“LinkedIn page”).
- Include in save payload; on create pass `linkedinBrand`.

**Patterns to follow:**

- Existing form controls and `SlideOver` layout in the same file.

**Test scenarios:**

- **Happy path:** Save new post sends `linkedinBrand` matching selection.
- **Happy path:** Edit loads existing brand and saves changes.
- **Edge case:** Missing `linkedinBrand` on old doc still defaults UI to Corvo and saves explicit value.

**Verification:**

- Manual: keyboard-only navigation through control works.

- [ ] **Unit 5: Dashboard filter bar and ContentLibrary**

**Goal:** Brand filter next to type/time filters; library lists show brand for LinkedIn rows.

**Requirements:** R8, R7 (library), R3.

**Dependencies:** Unit 3, Unit 4 (posts return brand from queries automatically once schema populated).

**Files:**

- Modify: `app/page.tsx`
- Modify: `components/ContentLibrary/ContentLibrary.tsx`
- Test: `components/ContentLibrary/__tests__/ContentLibrary.test.tsx`, `app/__tests__/page.test.tsx` as needed

**Approach:**

- Add `linkedinBrandFilter: "all" | "corvo_labs" | "lower_db"` state in `page.tsx`; render control only when `activeView === "library"` and `filter` is `all` or `linkedin`.
- Pass prop into `ContentLibrary`; filter rows: blog always shown when type `all`; LinkedIn rows filtered by brand when not `all`.
- Extend LinkedIn type badge text or add sub-label using Unit 3 helpers.

**Patterns to follow:**

- Existing pill button groups in `app/page.tsx`.

**Test scenarios:**

- **Happy path:** With `linkedinBrandFilter` corvo, lower dB LinkedIn row hidden.
- **Happy path:** Blog rows still visible when type filter is `all` regardless of brand filter.
- **Edge case:** LinkedIn row with missing brand treated as Corvo for display/filter (defensive) until migration completes.

**Verification:**

- Library matches origin **R8** placement and default all brands.

- [ ] **Unit 6: Calendar brand surfacing and dense-day access**

**Goal:** Each LinkedIn post chip shows brand; non-hover access for overflow posts.

**Requirements:** R7.

**Dependencies:** Unit 3, Unit 5 (optional consistency).

**Files:**

- Modify: `components/Calendar/Calendar.tsx`
- Test: `components/Calendar/__tests__/Calendar.test.tsx`

**Approach:**

- Add `linkedinBrand` to `Post` interface; render short label or icon beside LinkedIn text on each visible chip.
- For `dayPosts.length > 3`, implement focusable “+N more” behavior that reveals remaining posts with brands (inline expansion or dialog—pick one implementation).

**Patterns to follow:**

- Existing day cell and button styles.

**Test scenarios:**

- **Happy path:** LinkedIn post renders brand text or abbreviation in document.
- **Happy path:** “+N more” is focusable and reveals hidden posts’ brands (query by role/label in test).
- **Edge case:** Blog posts unchanged.

**Verification:**

- No chip relies on `title` alone for brand (tooltip may supplement).

- [ ] **Unit 7: Client import script and tests**

**Goal:** Type-level alignment for offline import tooling; default Corvo for LinkedIn seeds.

**Requirements:** R4 (parity with Convex import).

**Dependencies:** Unit 2 patterns settled.

**Files:**

- Modify: `lib/backfill.ts`, `scripts/backfill-content.ts` if they construct LinkedIn posts
- Modify: `lib/__tests__/backfill.test.ts`

**Approach:**

- Extend `ImportedPostType` / validators to optional `linkedinBrand`; default `corvo_labs` when sending to API.

**Test scenarios:**

- **Happy path:** LinkedIn seed without brand defaults Corvo in payload.

**Verification:**

- `lib/__tests__/backfill.test.ts` passes.

## System-Wide Impact

- **Interaction graph:** Dashboard → `posts.list` → Calendar / ContentLibrary / LinkedInPostEditor; workflow and ideas → Convex mutations creating posts.
- **API surface parity:** All Convex `posts` writes that touch LinkedIn must accept or default `linkedinBrand`.
- **Unchanged invariants:** Blog editor, blog routes, and non-LinkedIn workflow behavior unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Migration not run in prod leaves undefined brands | Checklist: run migration after deploy; defensive UI treats undefined as Corvo temporarily |
| Calendar clutter with long labels | Use compact short labels from Unit 3 |
| Import script and Convex validator drift | Unit 7 + grep review |

## Documentation / Operational Notes

- **Deploy:** Push schema → run backfill mutation once → verify with Convex data browser.
- Operator assumption: all pre-existing LinkedIn posts were Corvo Labs (origin); fix mis-tagged posts in editor.

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-21-linkedin-brand-account-requirements.md](docs/brainstorms/2026-04-21-linkedin-brand-account-requirements.md)
- Related code: `convex/schema.ts`, `convex/posts.ts`, `convex/backfill.ts`, `convex/workflow.ts`, `components/LinkedInPostEditor/LinkedInPostEditor.tsx`, `app/page.tsx`, `components/ContentLibrary/ContentLibrary.tsx`, `components/Calendar/Calendar.tsx`
