# UX Improvement Roadmap — Leidy Laura Rendon Portfolio

A prioritized, incremental plan of the 10 highest-impact UX improvements for this Next.js 15 / React 19 / Tailwind v4 / Sanity portfolio.

**Guiding constraints:** No changes to typography, color palette, branding, or visual layout. Every item below changes *how the portfolio feels and performs*, never *how it looks*. All animation work must respect `prefers-reduced-motion`.

**Codebase baseline (verified):**
- Images are plain `<img>` tags (no `next/image`), all `loading="lazy"` — including the LCP `mainImage` on project pages.
- Gallery is a static 2-column grid with no lightbox, zoom, or keyboard navigation.
- `useVisibleSection` instantiates one `IntersectionObserver` per article (50% threshold).
- `DynamicBackground` cross-fades two fixed gradient layers over 1500ms with no reduced-motion guard.
- `InfoModal` has no focus trap, Escape handling, ARIA roles, or body scroll lock; close button is unlabeled.
- Header "about" trigger is a `<span onClick>` — not keyboard reachable, sub-minimum touch target.
- No `loading.tsx` skeletons; modal shows a bare "Loading..." string.

---

### 1. Optimize the project-page main image as a true LCP element

**Objective**: The project detail page's `mainImage` is the Largest Contentful Paint element but is currently `loading="lazy"` and served as a raw `<img>` with no responsive sizing. This delays first meaningful paint and ships oversized bytes.

**User Benefit**: Project pages feel like they load almost instantly; the hero image appears sooner, especially on mobile data connections.

**Technical Approach**: Replace the `mainImage` `<img>` in `src/app/project/[slug]/page.tsx` with `next/image`. Set `priority` (which removes lazy loading and adds a high `fetchpriority`), provide `sizes="(max-width: 1024px) 100vw, 1024px"` to match the `max-w-5xl` container, and supply intrinsic `width`/`height` (or `fill` with an aspect wrapper) to reserve space and eliminate layout shift. Pipe Sanity image dimensions through the GROQ query (`asset->{ url, metadata { dimensions } }`) so the component can pass real width/height. Keep `rounded` and existing classes unchanged.

**Complexity**: `Medium` — touches the GROQ query and requires confirming `next.config` allows the Sanity CDN domain; isolated to one component.

**Acceptance Criteria**:
- [ ] Main image renders via `next/image` with `priority` and no `loading="lazy"`.
- [ ] Cumulative Layout Shift for the hero image is 0 (space reserved before load).
- [ ] On a throttled mobile (Fast 3G) Lighthouse run, LCP improves versus baseline and the image is served at an appropriately scaled size.
- [ ] Visual output (rounded corners, full-width, spacing) is pixel-identical to current.

---

### 2. Add a gallery lightbox with keyboard navigation

**Objective**: Gallery images in `src/app/project/[slug]/page.tsx` are capped in a 2-column grid with no way to view them larger. Users cannot inspect detail work, which is the core purpose of a design portfolio.

**User Benefit**: Visitors can click any gallery image to view it full-size, page through images with arrow keys, and close with Escape — a expected, polished interaction.

**Technical Approach**: Introduce a client component (e.g. `GalleryLightbox`) that wraps the existing grid. Each thumbnail becomes a `<button>` that opens an overlay rendered in a portal. Implement focus trapping, `Escape` to close, `ArrowLeft`/`ArrowRight` to navigate, return focus to the triggering thumbnail on close, and lock body scroll while open. Use `role="dialog"` + `aria-modal="true"` + `aria-label`. Render the large image with `next/image`. Reuse the gradient/overlay styling conventions already present (e.g. `InfoModal`'s `bg-black opacity-50` backdrop) so it looks native to the site. Do not restyle the thumbnail grid itself.

**Complexity**: `Medium` — new isolated client component plus keyboard/focus logic; no change to data flow.

**Acceptance Criteria**:
- [ ] Clicking or activating (Enter/Space) any gallery thumbnail opens it full-size.
- [ ] `ArrowLeft`/`ArrowRight` move between images; `Escape` closes and returns focus to the opener.
- [ ] On touch devices, swipe left/right navigates and the close affordance is at least 44x44px.
- [ ] Focus is trapped within the dialog and the overlay carries `role="dialog"` / `aria-modal="true"`.

---

### 3. Add pinch / double-tap zoom inside the lightbox

**Objective**: Even at full screen, detailed work (typography specimens, illustration detail) benefits from zoom. Mobile users especially expect pinch-to-zoom on portfolio imagery.

**User Benefit**: Users can zoom into fine detail of any gallery image directly in the viewer, on both desktop (scroll/double-click) and mobile (pinch/double-tap).

**Technical Approach**: Extend the lightbox from item 2. On desktop, support double-click-to-zoom toggling a `transform: scale()` with `transform-origin` set from cursor position, and pointer-drag to pan when zoomed. On mobile, use the Pointer Events API (or a small dependency-free pinch handler) to track two-pointer gestures and apply `scale` + `translate` via CSS transform. Wrap transforms in `transition` only for non-gesture toggles, and disable zoom transitions under `prefers-reduced-motion`. Reset zoom when navigating to another image.

**Complexity**: `High` — gesture math (pinch midpoint, clamping, panning) requires careful cross-device testing; depends on item 2 existing first.

**Acceptance Criteria**:
- [ ] Double-tap (mobile) and double-click (desktop) toggle zoom; pinch gesture zooms smoothly on touch devices.
- [ ] When zoomed, the user can pan; zoom resets on image change and on close.
- [ ] Zoom is bounded (cannot zoom out past fit or in past a sane max) and never breaks layout.
- [ ] `prefers-reduced-motion` users get instant zoom with no animated transition.

---

### 4. Progressive image loading with blur-up placeholders

**Objective**: Across the homepage list and galleries, images pop in abruptly against the gradient background, and slow connections see blank gaps. There are no placeholders or loading states.

**User Benefit**: Images fade in gracefully from a low-res blur, so the page never feels broken or empty while loading — perceived performance improves markedly on mobile.

**Technical Approach**: Migrate homepage (`HomePageClient.tsx`) and gallery images to `next/image` with `placeholder="blur"`. Generate `blurDataURL` from Sanity's `metadata.lqip` (low-quality image placeholder), which Sanity provides natively — add `metadata { lqip, dimensions }` to the relevant GROQ queries. For any image kept as `<img>`, add a CSS opacity transition triggered on the `load` event as a fallback. Respect `prefers-reduced-motion` by skipping the fade and showing the image immediately once loaded. Keep `rounded-xl` and all sizing classes intact.

**Complexity**: `Medium` — query changes plus component swaps across two files; LQIP comes free from Sanity so no build-time generation needed.

**Acceptance Criteria**:
- [ ] Homepage and gallery images render an LQIP blur that resolves to the full image.
- [ ] No layout shift occurs as images load (dimensions reserved).
- [ ] On Fast 3G, the homepage shows blurred previews rather than blank space.
- [ ] Reduced-motion users see no fade animation; image simply appears when ready.

---

### 5. Add route-level loading skeletons for project pages

**Objective**: Navigating from the homepage to a project page currently shows nothing until the Server Component's Sanity fetch resolves. There is no `loading.tsx`. This creates a perceived stall on each navigation.

**User Benefit**: Clicking a project gives immediate visual feedback — a skeleton matching the page structure — so navigation feels instant and intentional rather than frozen.

**Technical Approach**: Add `src/app/project/[slug]/loading.tsx` returning a skeleton that mirrors the real layout: a full-width hero placeholder block, a title bar, body lines, and a 2-column gallery grid of placeholders. Build the skeleton purely from existing neutral utility classes (e.g. `bg-gray-200` / `animate-pulse`) so it introduces no new colors. Match the `max-w-5xl` container and spacing so the transition to real content is seamless. Gate `animate-pulse` behind `prefers-reduced-motion` (use a static placeholder when motion is reduced).

**Complexity**: `Low` — single new file using existing structure; no logic.

**Acceptance Criteria**:
- [ ] A skeleton appears immediately on navigation to any project route.
- [ ] Skeleton structure (hero, title, gallery grid) matches the loaded page so there is no jarring reflow.
- [ ] On mobile, the skeleton respects the same responsive container and spacing.
- [ ] Pulse animation is suppressed under `prefers-reduced-motion`.

---

### 6. Make `InfoModal` fully accessible and keyboard-operable

**Objective**: The About modal lacks a focus trap, Escape-to-close, body scroll lock, ARIA dialog semantics, and an accessible label on its close button. Keyboard and screen-reader users cannot operate it properly, and background scroll bleeds through.

**User Benefit**: All users — including those on keyboard or assistive tech — can open, read, and dismiss the About info reliably, with focus handled correctly and the page behind locked.

**Technical Approach**: In `src/components/InfoModal.tsx`, add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing at the name heading. On mount, move focus into the modal and trap Tab/Shift+Tab within it; restore focus to the "about" trigger on close. Handle `Escape` via a `keydown` listener. Lock `document.body` scroll while open (toggle `overflow: hidden`). Give the close button `aria-label="Close"` and ensure it is at least 44x44px. Keep the existing markup, spacing, and `bg-black opacity-50` backdrop unchanged.

**Complexity**: `Medium` — focus-trap logic and effect cleanup require care, but contained to one component.

**Acceptance Criteria**:
- [ ] Modal can be closed with Escape, the close button, and a backdrop click.
- [ ] Focus is trapped inside the modal and returns to the "about" trigger on close.
- [ ] Background page does not scroll while the modal is open.
- [ ] Screen readers announce a dialog with the person's name; close button has an accessible label and a >=44px target.

---

### 7. Convert the Header "about" trigger to an accessible button with proper touch targets

**Objective**: The "about" control is a `<span onClick>` — not focusable, not keyboard-activatable, and missing a button role. On mobile, both header items are tight tap targets.

**User Benefit**: Keyboard and screen-reader users can reach and trigger the About modal; mobile users get a comfortably tappable control.

**Technical Approach**: In `src/components/Header.tsx`, change the "about" `<span>` to a `<button type="button">` (keeping identical classes so it looks unchanged — reset native button styling via `appearance-none bg-transparent` as needed). Ensure focus-visible styling is present (an outline that fits the existing palette). Add adequate hit area (padding or min-size) to reach 44x44px without altering visible layout. Also wrap the fixed header in a `<header>`/`<nav>` with an `aria-label` and ensure the name remains a non-interactive heading. Confirm the scroll listener stays passive (`{ passive: true }`) for scroll performance.

**Complexity**: `Low` — markup/attribute change in one small component.

**Acceptance Criteria**:
- [ ] "about" is a real `<button>`, reachable by Tab and activatable with Enter/Space.
- [ ] A visible focus indicator appears on keyboard focus.
- [ ] Tap target is >=44x44px on mobile with no visible layout change.
- [ ] The control looks identical to the current design at rest.

---

### 8. Consolidate `useVisibleSection` into a single IntersectionObserver and guard active-state logic

**Objective**: `useVisibleSection` creates one `IntersectionObserver` per article and sets `activeIndex` on any `isIntersecting` entry at a 50% threshold. With many tall images this can produce ambiguous/competing active states and unnecessary observer overhead, making the background change feel imprecise.

**User Benefit**: The background reliably reflects the project actually centered in the viewport, and scroll tracking stays smooth even with many projects.

**Technical Approach**: Refactor `src/hooks/useVisibleSection.ts` to use a single `IntersectionObserver` watching all sections with multiple thresholds (or a `rootMargin` that defines a center band, e.g. `-45% 0px -45% 0px`). On each callback, pick the entry with the greatest `intersectionRatio` (or the one intersecting the center band) and set that as active. This removes the per-element observer array and makes selection deterministic. Keep the `setRef`/`activeIndex` API identical so `HomePageClient` and `DynamicBackground` need no changes.

**Complexity**: `Medium` — observer logic rewrite with the same public API; requires testing across varied image heights.

**Acceptance Criteria**:
- [ ] Exactly one IntersectionObserver instance is created regardless of project count.
- [ ] The active project corresponds to the one centered in the viewport, with no flicker between two projects mid-scroll.
- [ ] The hook's returned API (`activeIndex`, `setRef`) is unchanged.
- [ ] Behavior verified on mobile viewport heights where images are tall.

---

### 9. Respect `prefers-reduced-motion` in the dynamic background cross-fade

**Objective**: `DynamicBackground` always animates a 1500ms opacity cross-fade between gradient layers. For motion-sensitive users this is an unguarded animation, and the long duration can feel laggy when scrolling quickly through many projects.

**User Benefit**: Motion-sensitive users get an instant, comfortable background change; fast scrollers no longer see the background lagging far behind the content.

**Technical Approach**: In `src/components/DynamicBackground.tsx`, read `prefers-reduced-motion` (via `matchMedia`, or a CSS class hook) and set the transition duration to `0ms` when reduced motion is preferred. Keep the gradient colors and the two-layer cross-fade approach exactly as-is for everyone else. Optionally expose the duration as a constant so it can be tuned without restyling. Do not change the gradient definitions or colors.

**Complexity**: `Low` — conditional transition duration in one component.

**Acceptance Criteria**:
- [ ] With `prefers-reduced-motion: reduce`, the background changes instantly (no opacity animation).
- [ ] With motion allowed, the cross-fade behaves exactly as today (same colors, same two-layer logic).
- [ ] No gradient color or layout value is altered.
- [ ] Rapid scrolling does not leave the background visibly stuck behind the active project.

---

### 10. Lazy-mount video embeds behind a click-to-load facade

**Objective**: On project pages, YouTube/Vimeo `<iframe>` embeds are rendered immediately (only `loading="lazy"` on the iframe), pulling in heavy third-party players and scripts that compete with image loading and hurt performance, even if the user never plays the video.

**User Benefit**: Project pages load faster and use less data; the video still plays on demand, with a clear play affordance.

**Technical Approach**: Replace the immediately-rendered embed with a lightweight client "facade": show the video's poster/thumbnail (YouTube thumbnail URL, or the project's `mainImage` as a neutral fallback) inside the existing `aspect-video rounded` container, with an accessible play `<button>` overlay. Only on activation does the real `<iframe>` mount (with `autoplay=1` appended). This is the well-known lite-embed pattern and can be implemented without a dependency. Keep direct-file `<video>` elements as they are (they already use `preload="metadata"`). Preserve the existing container classes and aspect ratio exactly.

**Complexity**: `Medium` — new small client component plus thumbnail derivation per provider; project page is a Server Component so the facade must be a client island.

**Acceptance Criteria**:
- [ ] Third-party video iframe/scripts are not requested until the user activates play.
- [ ] The play control is a real `<button>`, keyboard-activatable, with an `aria-label` and a >=44px target.
- [ ] Activating play loads and autoplays the video in the same-sized container with no layout shift.
- [ ] On a project page with a video, total bytes and third-party requests on initial load drop versus baseline.

---

## Suggested sequencing

1. **Quick wins first (Low complexity):** Items 5 (loading skeleton), 7 (accessible header button), 9 (reduced-motion background).
2. **Core performance & a11y (Medium):** Items 1 (LCP image), 4 (blur-up loading), 6 (modal a11y), 8 (observer consolidation), 10 (video facade).
3. **Signature gallery experience (Medium → High):** Item 2 (lightbox) then item 3 (zoom), which depends on it.

Each item is independently shippable and invisible to the visual design — the portfolio looks identical, just smoother, faster, and more accessible.
