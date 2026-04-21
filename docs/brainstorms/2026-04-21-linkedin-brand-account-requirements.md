---
date: 2026-04-21
topic: linkedin-brand-account
---

# LinkedIn post brand account (Corvo Labs vs the lower dB)

## Problem Frame

The operator runs two LinkedIn presences (Corvo Labs and the lower dB) and cross-promotes between them. Resonate currently treats LinkedIn posts as a single undifferentiated stream, so it is unclear which company page each row represents. The product should record that explicitly per post and make it visible enough to plan and review work by account.

In these requirements, **brand** means which LinkedIn company page the post is for (Corvo Labs or the lower dB)—not a separate marketing abstraction.

## Requirements

**Data and migration**

- R1. Each LinkedIn post MUST record which LinkedIn brand/page it is for: **Corvo Labs** or **the lower dB** (exactly two allowed values in this version; user-visible labels SHOULD match those names).
- R2. All existing LinkedIn posts in the system MUST be backfilled to **Corvo Labs**, under the explicit assumption that every historical LinkedIn row in this deployment was for that page; if that assumption is wrong for any rows, the operator corrects them after ship (no separate reconciliation workflow required in v1 beyond normal edit).
- R3. Blog posts MUST NOT require or surface this field; it applies only to LinkedIn posts.
- R4. Any code path that **inserts or patches** a LinkedIn row—including import or sync mutations (for example bulk upsert by `externalUrl`)—MUST set or preserve the brand field so LinkedIn posts are never left in an ambiguous state: new LinkedIn inserts from those paths default to **Corvo Labs** unless the path accepts an explicit brand in the payload in the same release.

**Editor and creation**

- R5. The create and edit LinkedIn post experience MUST include a clearly labeled control to choose the brand (keyboard operable, with a programmatic name such as “LinkedIn page” or “Post for”). New posts MUST default that control to **Corvo Labs** (consistent with historical usage).
- R6. Any flow that creates a LinkedIn post without the full editor (for example from a captured idea or workflow spawn) MUST set the brand to **Corvo Labs** by default in v1 unless the same release adds a brand choice on that path; silent default is acceptable when no choice is shown.

**Surfacing in the UI (v1)**

- R7. Where LinkedIn posts appear in **Content Library rows** or on the **calendar**, each item MUST show which brand it belongs to (short label, badge, or equivalent) so the operator can scan without opening the editor. On dense calendar days, the implementation MUST NOT rely on **hover-only** tooltips as the sole way to read brand; brand MUST remain available via focus, expanded day detail, or another non-hover-primary pattern to be decided in planning.
- R8. Content Library MUST allow filtering by brand when the type filter is LinkedIn or **all** (for mixed lists, only LinkedIn rows are affected). The control SHOULD sit alongside existing type/time filters, default to **all brands**, and use clear labels (e.g. “LinkedIn page” or “Brand”).

**Explicit non-goals for v1**

- R9. No new LinkedIn API integration, automated posting, or URL validation beyond current behavior.

## Success Criteria

- Every LinkedIn post can be assigned and updated to the correct brand from the primary LinkedIn editor.
- After migration, historical LinkedIn posts appear as Corvo Labs until changed; the operator can correct any mis-attributed row through the same editor.
- The operator can see which brand a LinkedIn post belongs to on Content Library rows and on the calendar without hover-only dependence, and can narrow Content Library to one brand.
- The brand control in the editor is usable with keyboard and exposes an accessible name and value to assistive technology.

## Scope Boundaries

- No user-configurable list of additional LinkedIn pages in v1—only the two named brands.
- No change to blog authoring, publishing, or blog-specific fields.
- Per-user or multi-tenant brand directories are out of scope for v1. If discovery during planning shows existing architecture already requires tenant-scoped brand lists, that becomes a scheduling and scope input for planning—not an automatic expansion of this requirements set.

## Key Decisions

- **Fixed two-brand model for v1:** Limits carrying cost; adding more pages later is an intentional follow-on.
- **Default Corvo Labs:** Aligns with backfill and the prior implicit single-account mental model.
- **Badges plus Content Library filter in v1:** Recommended over “editor only” so cross-promotion stays tractable in day-to-day use without opening every post.

## Dependencies / Assumptions

- Assumption: This Resonate deployment is used for Corvo Labs and the lower dB together; a shared two-value enum is sufficient.
- Assumption (for R2): All LinkedIn posts already stored before migration were authored for the Corvo Labs page. Lower dB–only history, if any, is corrected manually after release.

## Outstanding Questions

### Resolve Before Planning

- (none)

### Deferred to Planning

- [Affects R6][Technical] Volume and UX for workflow or idea flows that spawn LinkedIn drafts (silent Corvo default vs prompting for brand when those flows become a large share of creates).
- [Affects R7][Technical] Concrete calendar pattern for dense days (stacking, “+N”, expanded day panel, etc.) while meeting the non-hover-primary rule.
- [Affects product][Research] Whether a later slice should support paired or sequenced cross-brand campaigns; v1 stays labeling and filtering only.

## Next Steps

-> `/ce:plan` for structured implementation planning
