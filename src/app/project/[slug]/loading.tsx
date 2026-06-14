export default function ProjectLoading() {
  // Each placeholder uses `animate-pulse` for motion-enabled users.
  // `motion-reduce:animate-none` compiles to a CSS media query
  // (@media (prefers-reduced-motion: reduce)) that strips the animation —
  // no JavaScript, no hydration side-effects.
  const pulse = 'bg-gray-200 animate-pulse motion-reduce:animate-none rounded'

  return (
    <main className="mx-auto w-full max-w-5xl lg:py-12 lg:px-6 py-4 px-0">
      {/* Hero image placeholder */}
      <div className={`w-full aspect-video ${pulse} mb-6`} aria-hidden="true" />

      {/* Title placeholder */}
      <div className={`h-8 w-64 ${pulse} mb-4 mx-4 lg:mx-0`} aria-hidden="true" />

      {/* Description placeholder — 3 lines */}
      <div className="px-4 lg:px-0 mb-8 space-y-3" aria-hidden="true">
        <div className={`h-4 w-full ${pulse}`} />
        <div className={`h-4 w-5/6 ${pulse}`} />
        <div className={`h-4 w-4/6 ${pulse}`} />
      </div>

      {/* Video placeholder */}
      <div className="mb-8" aria-hidden="true">
        <div className={`w-full aspect-video ${pulse}`} />
      </div>

      {/* Gallery grid placeholder — mirrors GalleryLightbox grid */}
      <div
        className="grid grid-cols-2 gap-2 sm:gap-4 mb-10 px-0 lg:px-0"
        aria-hidden="true"
      >
        <div className={`w-full aspect-video ${pulse}`} />
        <div className={`w-full aspect-video ${pulse}`} />
        <div className={`w-full aspect-video ${pulse}`} />
        <div className={`w-full aspect-video ${pulse}`} />
      </div>

      {/* Process placeholder — 5 lines */}
      <div className="px-4 lg:px-0 pb-16 space-y-3" aria-hidden="true">
        <div className={`h-4 w-full ${pulse}`} />
        <div className={`h-4 w-5/6 ${pulse}`} />
        <div className={`h-4 w-full ${pulse}`} />
        <div className={`h-4 w-3/4 ${pulse}`} />
        <div className={`h-4 w-4/6 ${pulse}`} />
      </div>
    </main>
  )
}
