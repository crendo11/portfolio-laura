# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # Run ESLint via Next.js
```

No test suite is configured.

## Architecture

Next.js 15 (App Router) portfolio for Leidy Laura Rendon, backed by Sanity CMS. Uses React 19, TypeScript, and Tailwind CSS v4.

### Data flow

Content lives entirely in Sanity. The homepage is a Server Component (`src/app/page.tsx`) that fetches all projects with the `projects` cache tag, then passes the data down to the client. Individual project pages (`src/app/project/[slug]/page.tsx`) are also Server Components.

The on-demand revalidation webhook at `POST /api/revalidate` invalidates the `projects` tag and the `/` path when triggered from Sanity with a matching `REVALIDATE_SECRET`.

### Client-side interaction

`HomePageClient` (`src/components/HomePageClient.tsx`) renders the scrollable project list. It uses `useVisibleSection` (IntersectionObserver, 50% threshold) to track which project article is currently in view, and passes the `activeIndex` to `DynamicBackground`.

`DynamicBackground` maintains two fixed CSS gradient layers (A for even indices, B for odd). When the active index changes, only the relevant layer's gradient is updated; the layers cross-fade via CSS `opacity` transition (1500ms). This avoids re-computing both layers on every scroll event.

`Header` is a fixed nav that scales down when `scrollY > 100`. Clicking "about" opens `InfoModal`, which lazily fetches the `about` Sanity document on mount.

### Sanity schema (inferred from queries)

- `project`: `_id, title, slug.current, bgColor.hex, mainImage.asset.url, gallery[].asset.url, video (URL string), description (Portable Text), process (Portable Text), order (integer for sorting)`
- `about`: `name, description (Portable Text), email, profilePic.asset.url`

Video URLs in `project.video` are parsed by `buildEmbedSrc` in the project page — supports YouTube, Vimeo, and direct mp4/webm/ogg files. YouTube Clip URLs are intentionally skipped with no fallback.

### Environment variables

```
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
NEXT_PUBLIC_SANITY_API_VERSION
REVALIDATE_SECRET
```

## Goal:
Improve UX and interactions.

Preserve:
- branding
- typography
- color palette
- visual identity

Focus on:
- scroll animations
- image viewing
- gallery UX
- responsiveness
- improve transtion in the background grading
- performance

Avoid:
- redesign proposals