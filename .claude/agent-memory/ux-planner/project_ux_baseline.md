---
name: project-ux-baseline
description: Non-obvious UX/performance/a11y gaps and constraints for the Leidy Laura Rendon portfolio, established during the roadmap audit
metadata:
  type: project
---

UX baseline established for the portfolio (`/portfolio` Next.js app) during the 2026-06 roadmap audit. A 10-item roadmap lives at `portfolio/docs/roadmap.md`.

**Hard constraints (from CLAUDE.md "Goal" section + agent mandate):** never propose changes to typography, color palette, branding, or visual/layout redesign. UX/perf/a11y/motion only. The owner explicitly listed: scroll animations, image viewing, gallery UX, responsiveness, smoother background gradient transition, performance.

**Why:** This is a working design portfolio where visual identity is the product; improvements must be invisible to the eye, felt only as smoothness/speed/access.

**How to apply:** When planning or implementing, route any UX goal that would require visual change to an alternative that preserves appearance. Always add `prefers-reduced-motion` guards to animation work — the codebase currently has none.

Non-obvious gaps worth remembering (verify against code before acting — these were true at audit time):
- All images are raw `<img>` (no `next/image`); the project-page LCP `mainImage` is wrongly `loading="lazy"`.
- Sanity provides `metadata.lqip` + `metadata.dimensions` for free — use for blur-up placeholders and CLS-free sizing instead of build-time generation.
- `useVisibleSection` creates one IntersectionObserver per article (50% threshold) — consolidation candidate; keep its `{activeIndex, setRef}` API stable so `HomePageClient`/`DynamicBackground` are untouched.
- `DynamicBackground` 1500ms cross-fade has no reduced-motion guard.
- `InfoModal` and the Header "about" `<span onClick>` are the main a11y debt (no focus trap, no Esc, no roles, not keyboard reachable).
- No `loading.tsx` anywhere; project navigation has no skeleton.
- Video embeds render iframes eagerly (lite-embed/facade pattern is the fix).
