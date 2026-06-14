# UX Improvement Roadmap — Leidy Laura Rendon Portfolio

A prioritized, incremental plan of the 12 highest-impact UX improvements for this Next.js 15 / React 19 / Tailwind v4 / Sanity portfolio.

**Guiding constraints:** No changes to typography, color palette, branding, or visual layout. Every item below changes *how the portfolio feels and performs*, never *how it looks*. All animation work must respect `prefers-reduced-motion`.

**Codebase baseline (verified):**
- Images are plain `<img>` tags (no `next/image`), all `loading="lazy"` — including the LCP `mainImage` on project pages.
- Gallery is a static 2-column grid with no lightbox, zoom, or keyboard navigation.
- `DynamicBackground` cross-fades two fixed gradient layers over 1500ms.
- No `loading.tsx` skeletons; modal shows a bare "Loading..." string.

**All 12 original roadmap tasks are now DONE.** Summary of what was resolved across two implementation sessions:

Session 1 (Tasks 7–12 + bug fix):
- `InfoModal` now has a focus trap, Escape handling, ARIA dialog semantics, body scroll lock, and a labeled 44px close button — Task 7.
- Header "about" trigger is now a real `<button>`, keyboard reachable with a 44px touch target at rest — Task 8.
- `useVisibleSection` now uses a single shared `IntersectionObserver` with a center-band `rootMargin` (was one observer per article at 50% threshold) — Task 9.
- `DynamicBackground` cross-fade now respects `prefers-reduced-motion` — Task 10.
- Project-page YouTube/Vimeo embeds now load behind a click-to-load facade — Task 11.
- `<body>` hydration mismatch from browser extensions suppressed; `sanity.ts` `useCdn` set to `false` to fix a homepage `fetch failed` runtime error — Task 12 + bug fix.

Session 2 (Tasks 1–6):
- Project-page `mainImage` replaced with `next/image priority` + Sanity dimension metadata — Task 1.
- Gallery lightbox with keyboard navigation, focus trap, swipe, and portal — Task 2.
- Pinch / double-tap / double-click zoom with pan inside the lightbox — Task 3.
- Blur-up LQIP placeholders on homepage and gallery via `placeholder="blur"` — Task 4.
- Route-level loading skeleton at `src/app/project/[slug]/loading.tsx` — Task 5.
- Homepage image cropping fixed: `object-cover` removed, `style` override restores proportional scaling — Task 6.

---

### 1. Optimize the project-page main image as a true LCP element — DONE

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

### 2. Add a gallery lightbox with keyboard navigation — DONE

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

### 3. Add pinch / double-tap zoom inside the lightbox — DONE

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

### 4. Progressive image loading with blur-up placeholders — DONE

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

### 5. Add route-level loading skeletons for project pages — DONE

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

### 6. Fix homepage image cropping introduced by the `next/image` migration — DONE

**Objective**: After Task 4 migrated the homepage list images in `src/components/HomePageClient.tsx` from raw `<img>` to `next/image`, the images are being cropped. With the old `<img>`, sizing was controlled purely by the Tailwind classes `max-h-[80vh]` (first project), `max-h-[55vh] sm:max-h-[110vh]` (rest), and `max-w-[75vw]`, letting each image scale down proportionally to fit. `next/image` requires explicit `width`/`height`, which it emits as intrinsic sizing; combined with the retained `object-cover` class, the height cap (`max-h-*`) now clips overflow instead of shrinking the image, so portions of the image are cut off. This is a visual regression that breaks the original presentation.

**User Benefit**: Homepage project images are shown in full again — uncropped and proportionally scaled exactly as they were before the optimization work — while keeping the faster, blur-up loading from Task 4.

**Technical Approach**: In the `imageEl` `next/image` branch in `HomePageClient.tsx`, make the explicit `width`/`height` props (already passed as `imgWidth`/`imgHeight` from Sanity `metadata.dimensions`) act only as the intrinsic aspect-ratio hint, and let the existing Tailwind constraints win at render time. Concretely:
- Remove `object-cover` from `imgClassName` for the `next/image` element (it is the property doing the cropping; with proportional scaling there is nothing to "cover"). Keep `rounded-xl`, the `max-h-*` classes, and `max-w-[75vw]` exactly as they are.
- Add an inline `style={{ width: 'auto', height: 'auto', maxWidth: '100%' }}` to the `Image` so the browser ignores `next/image`'s fixed pixel `width`/`height` and instead honors the CSS `max-h-[80vh]` / `max-h-[55vh] sm:max-h-[110vh]` / `max-w-[75vw]` caps, scaling the image proportionally to fit within whichever cap binds first. The `width`/`height` props are still required by `next/image` (and still reserve aspect-ratio to prevent layout shift) but no longer force the rendered box size.
- Leave `sizes="75vw"`, `placeholder`, and `blurDataURL` unchanged so the Task 4 blur-up placeholders are preserved.
- Do not change the `<img>` fallback branch, the alternating `justify-center` / `justify-start` / `justify-end` alignment logic, the per-index `maxHeightClass` selection, the wrapper margins, or any other class. The change is limited to the `next/image` element's `className` (drop `object-cover`) and its new `style` prop.

Alternative considered: wrapping each image in a sized `position: relative` div and using `next/image` with `fill`. Rejected because `fill` requires the wrapper to have explicit dimensions (it cannot derive size from the image's own aspect ratio), which would force hardcoding a box and lose the original "scale the natural image down to fit the cap" behavior — exactly what produced the alternating, variable-height layout. The `width`/`height` + `style` override keeps that behavior intact with a smaller, lower-risk change.

**Complexity**: `Low` — a single-component change touching one `className` and adding one `style` prop; no data, query, or layout-structure changes.

**Acceptance Criteria**:
- [ ] Homepage images render full and uncropped — no portion of any project image is clipped — matching the pre-Task-4 appearance.
- [ ] The first project image is still capped at `max-h-[80vh]`, subsequent images at `max-h-[55vh]` (mobile) / `sm:max-h-[110vh]` (desktop), and all at `max-w-[75vw]`; images scale proportionally to whichever cap binds first.
- [ ] Images still load via `next/image` with the Task 4 blur-up (`placeholder="blur"` / `blurDataURL` from `lqip`) intact; no revert to `<img>` for the optimized branch.
- [ ] The alternating left/center/right alignment and per-index sizing logic are unchanged, and no layout shift occurs as images load.
- [ ] On a mobile viewport the `max-h-[55vh]` cap is respected and images remain uncropped and within `max-w-[75vw]`.

---

### 7. Make `InfoModal` fully accessible and keyboard-operable — DONE

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

### 8. Convert the Header "about" trigger to an accessible button with proper touch targets — DONE

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

### 9. Consolidate `useVisibleSection` into a single IntersectionObserver and guard active-state logic — DONE

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

### 10. Respect `prefers-reduced-motion` in the dynamic background cross-fade — DONE

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

### 11. Lazy-mount video embeds behind a click-to-load facade — DONE

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

### 12. Suppress the `<body>` hydration mismatch caused by browser-extension attributes — DONE

**Objective**: The browser console logs a React hydration warning on every page load: *"A tree hydrated but some attributes of the server rendered HTML didn't match the client properties."* The diff points at `<body>`, specifically `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed`. These attributes are injected into `<body>` at runtime by the Grammarly browser extension — the server renders `<body>` without them, the client (with the extension active) sees them present, and React flags the mismatch. This is not an application bug, but the warning is noisy, can mask real hydration issues, and erodes confidence in the build.

**User Benefit**: A clean console with no spurious hydration warnings, so genuine hydration errors are not lost in the noise. End users see no change; developers and anyone inspecting the site get an accurate signal.

**Technical Approach**: Add the `suppressHydrationWarning` boolean prop to the `<body>` element in `src/app/layout.tsx`. React applies this prop one level deep, telling it to ignore attribute/content differences on that specific element during hydration — the standard, documented approach for the `<html>`/`<body>` tags where browser extensions (Grammarly, password managers, dark-mode tools) routinely inject attributes the server cannot know about. It does not disable hydration checks for any child elements, so real mismatches elsewhere are still reported. No other change is needed; the `className`, fonts, and all existing markup stay exactly as they are.

**Complexity**: `Low` — a single boolean attribute on one element in one file; no logic, data, or styling change.

**Acceptance Criteria**:
- [ ] `<body>` in `src/app/layout.tsx` carries `suppressHydrationWarning`, with `className` and all other attributes unchanged.
- [ ] With the Grammarly (or similar) extension installed, no `<body>` hydration mismatch warning appears in the console on load.
- [ ] The suppression is scoped to `<body>` only; hydration warnings on child components still surface normally.
- [ ] No visual or behavioral change on desktop or mobile — the rendered page is identical.

---

## Follow-up tasks discovered during implementation

These emerged from review of the Tasks 7–12 work. They are tracked here so they are not lost; none block the in-flight roadmap, but the two accessibility regressions (13, 14) undercut the very tasks that introduced them and should be cleaned up before those tasks are considered fully closed.

---

### 13. Restore 44px "about" touch target in the scrolled (`scale-75`) header state

**Objective**: Task 8 gave the "about" `<button>` a 44px target at rest, but the Header applies `scale-75` once `scrollY > 100`. A CSS transform scales the *rendered* box, so the effective touch target shrinks to ~33px while scrolled — below the WCAG 2.5.5 / 2.5.8 minimum exactly when most users are interacting with it (mid-page).

**User Benefit**: The About control stays comfortably tappable on mobile throughout the page, not just at the top.

**Technical Approach**: Compensate for the `scale-75` factor on the interactive control without changing its visible size. Options, in order of preference: (a) keep the visual scale on the header text/branding but exclude the button's hit area from the transform — e.g. give the button a larger invisible padding/`min-height`/`min-width` that nets to >=44px after scaling; or (b) replace the `scale-75` shrink with a non-transform size change on the header so rendered geometry and hit area stay in sync. Do not alter the at-rest appearance or the visual shrink effect. Verify the computed target with the element's `getBoundingClientRect()` in the scrolled state.

**Complexity**: `Low` — contained to `Header.tsx`; the subtlety is ensuring the fix is invisible while scrolled.

**Acceptance Criteria**:
- [ ] In the scrolled state, the "about" control's actual hit area measures >=44x44px (verified via `getBoundingClientRect`).
- [ ] The visual `scale-75` shrink effect and at-rest appearance are unchanged.
- [ ] Verified on a mobile viewport after scrolling past the 100px threshold.

---

### 14. Preserve keyboard focus when the VideoFacade play button unmounts

**Objective**: In `VideoFacade.tsx` (Task 11), activating the play `<button>` unmounts it and mounts the iframe. Focus is dropped to `<body>`, so keyboard and screen-reader users lose their place after pressing play — a regression introduced by the facade pattern.

**User Benefit**: Keyboard users land somewhere sensible (the now-playing video) after activating it, instead of being thrown to the top of the document.

**Technical Approach**: After the iframe mounts, move focus to it (or to a wrapping container) — e.g. give the iframe/container a ref and call `.focus()` in an effect that runs when the playing state flips to true, adding `tabIndex={-1}` to the focus target if needed. Ensure the iframe is focusable and that this does not steal focus on initial render (only on user-initiated activation).

**Complexity**: `Low` — single component, one focus-management effect.

**Acceptance Criteria**:
- [ ] After activating play via keyboard, focus moves to the video/iframe (not `<body>`).
- [ ] Focus is only moved on user activation, never on initial mount.
- [ ] Verified with keyboard-only navigation and a screen reader.

---

### 15. Add a clean fallback for unavailable YouTube thumbnails in VideoFacade

**Objective**: The YouTube facade uses `hqdefault.jpg` with no `onError` handler. Private, deleted, or otherwise unavailable videos return YouTube's grey "no thumbnail" placeholder, which clashes with the site and looks broken inside the otherwise-clean `aspect-video` container.

**User Benefit**: A video whose thumbnail fails still presents a tidy, on-brand facade rather than a grey YouTube error image.

**Technical Approach**: Add an `onError` handler to the YouTube thumbnail `<img>` that swaps to the existing neutral dark fallback already used for the Vimeo case (or the project `mainImage` if available). Keep the play button overlay and container styling intact. Optionally try `maxresdefault.jpg` first with a graceful fall back to `hqdefault.jpg` then the dark placeholder.

**Complexity**: `Low` — one `onError` branch in `VideoFacade.tsx`, reusing the Vimeo fallback path.

**Acceptance Criteria**:
- [ ] A YouTube video with no available thumbnail shows the neutral dark fallback, not YouTube's grey placeholder.
- [ ] The play affordance, aspect ratio, and container styling are unchanged in the fallback state.
- [ ] No additional network request is made on the happy path (fallback only triggers on error).

---

### 16. Harden VideoFacade autoplay and tighten `useVisibleSection` selection edge cases

**Objective**: Two small robustness gaps from Tasks 9 and 11: (a) the YouTube facade appends `autoplay=1` without `mute=1`, so strict mobile browsers may refuse to autoplay after the user taps play, leaving a loaded-but-paused player; (b) `useVisibleSection` initializes `bestRatio` to `0`, so an entry intersecting at a ratio of exactly `0` is skipped, and it uses `sectionRefs.current.length` as an effect dependency, which is fragile if the project count is unchanged but ref identities change.

**User Benefit**: Videos reliably start playing after a tap on mobile; the active-project background selection stays correct in boundary cases.

**Technical Approach**:
- VideoFacade: append `mute=1` alongside `autoplay=1` for the YouTube embed (autoplay-with-sound is broadly blocked on mobile regardless); confirm this matches the desired UX, or gate muting to touch/mobile only.
- `useVisibleSection`: initialize `bestRatio` to `-1` so a genuine `0`-ratio intersection can still win; reconsider the effect dependency so the observer re-subscribes when the *set of observed elements* changes, not merely when the count does (e.g. depend on a stable key derived from the refs, or re-run on ref registration).

**Complexity**: `Low` — two isolated one-to-few-line changes across `VideoFacade.tsx` and `useVisibleSection.ts`.

**Acceptance Criteria**:
- [ ] YouTube videos autoplay after activation on a strict mobile browser (muted as needed).
- [ ] An entry intersecting at ratio exactly `0` can be selected as active in `useVisibleSection`.
- [ ] The observer correctly re-subscribes when observed element identities change even if the count is constant.

---

## Suggested sequencing

**All 12 original tasks are done.** The remaining follow-up tasks (13–16) are low-complexity close-out items that repair accessibility regressions introduced by the main implementation work.

**Recommended order for Tasks 13–16:**

1. **Task 13 + Task 14 — together first (a11y regressions, Low).** Task 13 fixes the scrolled-header touch target that shrinks below 44px under `scale-75`; Task 14 fixes the VideoFacade keyboard-focus drop. Both undercut tasks already nominally shipped (8 and 11) and are the highest-priority close-out.
2. **Task 15 + Task 16 — same pass (Low, same files).** Task 15 adds the YouTube thumbnail `onError` fallback in `VideoFacade.tsx`; Task 16 hardens the autoplay (`mute=1`) and fixes the `bestRatio` init value and effect dependency in `useVisibleSection.ts`. Landing them alongside Tasks 13–14 keeps the close-out contained to two files.

Each remaining item is independently shippable and invisible to the visual design.
