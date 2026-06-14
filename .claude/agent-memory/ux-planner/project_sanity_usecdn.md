---
name: sanity-usecdn-false
description: Sanity client useCdn is intentionally false to avoid a homepage fetch failed runtime error — do not flip back to true without re-testing
metadata:
  type: project
---

`src/lib/sanity.ts` sets `useCdn: false` deliberately.

**Why:** With `useCdn: true` the homepage threw a `fetch failed` runtime `TypeError`. Switching to `false` (direct API reads instead of the CDN edge cache) resolved it.

**How to apply:** Do not flip `useCdn` back to `true` as a "perf win" without reproducing the original fetch failure first. The tradeoff (losing CDN edge caching) is accepted because content is revalidated on demand via the `/api/revalidate` webhook. If API latency or rate limits become a problem later, revisit — but verify the fetch error is actually gone before re-enabling the CDN.
