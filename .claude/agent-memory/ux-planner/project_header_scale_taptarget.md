---
name: header-scale-taptarget
description: Header about button meets 44px at rest but scale-75 on scroll shrinks the effective hit area to ~33px
metadata:
  type: project
---

The Header "about" button (`src/components/Header.tsx`) uses `min-h-[44px] px-2` for touch-target size, but applies `scale-75` via transform when `scrollY > 100`. CSS transform shrinks the rendered/hit-test box, so the effective tap height drops to ~33px in the scrolled state — exactly when mobile users tap most. Layout reservation stays 44px (transform doesn't reflow), so AC "no layout change" is unaffected.

**Why:** The scaling pre-dates the Task 8 a11y work (the original span scaled too), so it's not a Task 8 regression — but it undercuts strict WCAG 2.5.5/2.5.8 target-size guarantees.

**How to apply:** If asked to enforce a strict 44px guarantee, account for the post-scale size (e.g. bump min-h/padding so 0.75x still clears 44px, or exempt the hit area from the transform). Also note the name span carries `aria-hidden="true"`, hiding the portfolio owner's name from assistive tech — flag for exposure (ideally as a heading) in future a11y passes.
