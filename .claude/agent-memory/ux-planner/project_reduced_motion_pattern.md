---
name: reduced-motion-pattern
description: The codebase's established way to honor prefers-reduced-motion is CSS-only Tailwind motion-reduce: variants, not JS matchMedia
metadata:
  type: project
---

Reduced-motion accommodations in this portfolio are implemented with Tailwind's CSS `motion-reduce:` variants (e.g. `motion-reduce:animate-none` in `loading.tsx`, `motion-reduce:duration-0` in `DynamicBackground.tsx`), not JS `matchMedia`.

**Why:** CSS-only keeps server and client markup identical (no hydration mismatch), re-evaluates live when the OS setting toggles at runtime with no event listener, and needs no `window` guard in Server/Client components. The roadmap explicitly allowed either CSS or `matchMedia`; CSS was chosen for these reasons.

**How to apply:** For any future animation/transition task that must respect reduced motion, prefer a `motion-reduce:` Tailwind variant over a JS preference read. Confirmed working under Tailwind v4. See [[roadmap]] Task 10.
