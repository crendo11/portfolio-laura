'use client'

import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

type GalleryImage = {
  url: string
  lqip?: string
  width?: number
  height?: number
}

interface GalleryLightboxProps {
  images: GalleryImage[]
}

// Clamp a number between min and max
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// Euclidean distance between two touch points
function getTouchDistance(t1: Touch, t2: Touch): number {
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_ZOOM = 2.5
const DOUBLE_TAP_MS = 300
const SWIPE_THRESHOLD = 50

export default function GalleryLightbox({ images }: GalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Zoom / pan state
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)

  // Reduced-motion preference
  const [reducedMotion, setReducedMotion] = useState(false)

  // Refs to each thumbnail button so we can return focus on close
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([])
  // Ref to the dialog container for focus trapping and native touch listeners
  const dialogRef = useRef<HTMLDivElement>(null)

  // ── Gesture tracking refs (not state — avoids re-render mid-gesture) ──

  // Swipe / pan: finger start positions
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Pinch: initial distance and scale snapshot
  const pinchStartDistance = useRef<number | null>(null)
  const pinchStartScale = useRef<number>(1)

  // Double-tap: timestamp of last tap
  const lastTapTime = useRef<number>(0)

  // Pan: translate snapshot at pan start
  const panStartTranslate = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  // Pan: flag to suppress swipe navigation after a drag
  const isPanning = useRef<boolean>(false)

  // Mouse pan refs
  const isDragging = useRef<boolean>(false)
  const mouseStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Stale-ref mirrors for use inside native event handlers
  // (native listeners close over the initial render; ref mirrors give live values)
  const scaleRef = useRef<number>(1)
  const translateXRef = useRef<number>(0)
  const translateYRef = useRef<number>(0)

  const isOpen = activeIndex !== null
  const count = images.length

  // Keep stale refs in sync with state
  useEffect(() => { scaleRef.current = scale }, [scale])
  useEffect(() => { translateXRef.current = translateX }, [translateX])
  useEffect(() => { translateYRef.current = translateY }, [translateY])

  // Mount guard + reduced-motion detection
  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Reset zoom/pan to identity
  const resetZoom = useCallback(() => {
    setScale(1)
    setTranslateX(0)
    setTranslateY(0)
    scaleRef.current = 1
    translateXRef.current = 0
    translateYRef.current = 0
  }, [])

  // Open a specific image
  const open = useCallback((idx: number) => {
    setActiveIndex(idx)
    resetZoom()
  }, [resetZoom])

  // Close the lightbox and return focus to the triggering thumbnail
  const close = useCallback(() => {
    const idx = activeIndex
    setActiveIndex(null)
    resetZoom()
    if (idx !== null) {
      requestAnimationFrame(() => {
        triggerRefs.current[idx]?.focus()
      })
    }
  }, [activeIndex, resetZoom])

  const prev = useCallback(() => {
    resetZoom()
    setActiveIndex((i) => (i !== null ? (i - 1 + count) % count : null))
  }, [count, resetZoom])

  const next = useCallback(() => {
    resetZoom()
    setActiveIndex((i) => (i !== null ? (i + 1) % count : null))
  }, [count, resetZoom])

  // Keep prev/next accessible from native touch handlers without closures going stale
  const prevRef = useRef(prev)
  const nextRef = useRef(next)
  useEffect(() => { prevRef.current = prev }, [prev])
  useEffect(() => { nextRef.current = next }, [next])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.key === 'Tab') {
        if (!dialogRef.current) return
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, close, prev, next])

  // Move focus into dialog when it opens
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusable = dialogRef.current.querySelector<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    }
  }, [isOpen])

  // ── Native (non-passive) touch listeners ─────────────────────────────────
  // React attaches synthetic touch events as passive at the root, which means
  // e.preventDefault() in onTouchMove/Start is silently ignored — the browser
  // will still scroll or trigger its native pinch-zoom. We attach our own
  // non-passive listeners directly on the dialog element to gain preventDefault.
  useEffect(() => {
    const el = dialogRef.current
    if (!el || !isOpen) return

    const onTouchStart = (e: TouchEvent) => {
      const touches = e.touches

      if (touches.length === 2) {
        // Pinch start
        pinchStartDistance.current = getTouchDistance(touches[0], touches[1])
        pinchStartScale.current = scaleRef.current
        touchStartX.current = null
        touchStartY.current = null
        isPanning.current = false
        // Prevent browser native pinch-zoom
        e.preventDefault()
      } else if (touches.length === 1) {
        const t = touches[0]
        const now = Date.now()
        const elapsed = now - lastTapTime.current

        if (elapsed < DOUBLE_TAP_MS && elapsed > 0) {
          // Double-tap — toggle zoom
          e.preventDefault()
          lastTapTime.current = 0
          setScale((prev) => {
            const next = prev > MIN_SCALE ? MIN_SCALE : DOUBLE_TAP_ZOOM
            if (next === MIN_SCALE) {
              setTranslateX(0)
              setTranslateY(0)
              scaleRef.current = MIN_SCALE
              translateXRef.current = 0
              translateYRef.current = 0
            } else {
              scaleRef.current = next
            }
            return next
          })
          touchStartX.current = null
          touchStartY.current = null
          return
        }

        lastTapTime.current = now
        touchStartX.current = t.clientX
        touchStartY.current = t.clientY
        panStartTranslate.current = {
          x: translateXRef.current,
          y: translateYRef.current,
        }
        isPanning.current = false
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const touches = e.touches

      if (touches.length === 2 && pinchStartDistance.current !== null) {
        // Active pinch
        e.preventDefault()
        const newDistance = getTouchDistance(touches[0], touches[1])
        const ratio = newDistance / pinchStartDistance.current
        const newScale = clamp(pinchStartScale.current * ratio, MIN_SCALE, MAX_SCALE)
        scaleRef.current = newScale
        setScale(newScale)
        if (newScale <= MIN_SCALE) {
          setTranslateX(0)
          setTranslateY(0)
          translateXRef.current = 0
          translateYRef.current = 0
        }
      } else if (touches.length === 1 && touchStartX.current !== null) {
        const t = touches[0]
        const dx = t.clientX - touchStartX.current
        const dy = t.clientY - (touchStartY.current ?? t.clientY)

        if (scaleRef.current > MIN_SCALE) {
          // Pan mode
          e.preventDefault()
          isPanning.current = true
          const newX = panStartTranslate.current.x + dx
          const newY = panStartTranslate.current.y + dy
          translateXRef.current = newX
          translateYRef.current = newY
          setTranslateX(newX)
          setTranslateY(newY)
        }
        // At scale === 1: do not preventDefault — let native scroll work
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStartDistance.current = null
      }

      if (e.touches.length === 0) {
        const endX = e.changedTouches[0]?.clientX ?? null

        if (
          !isPanning.current &&
          scaleRef.current <= MIN_SCALE &&
          touchStartX.current !== null &&
          endX !== null
        ) {
          const deltaX = endX - touchStartX.current
          if (deltaX > SWIPE_THRESHOLD) {
            prevRef.current()
          } else if (deltaX < -SWIPE_THRESHOLD) {
            nextRef.current()
          }
        }

        touchStartX.current = null
        touchStartY.current = null
        isPanning.current = false
      }
    }

    const opts: AddEventListenerOptions = { passive: false }
    el.addEventListener('touchstart', onTouchStart, opts)
    el.addEventListener('touchmove', onTouchMove, opts)
    el.addEventListener('touchend', onTouchEnd, opts)

    return () => {
      el.removeEventListener('touchstart', onTouchStart, opts)
      el.removeEventListener('touchmove', onTouchMove, opts)
      el.removeEventListener('touchend', onTouchEnd, opts)
    }
  }, [isOpen])
  // Note: isOpen is the only dep — handlers read live values via refs.

  // ── Double-click zoom on desktop ──────────────────────────────────────────
  const handleDoubleClick = useCallback(() => {
    setScale((prev) => {
      const next = prev > MIN_SCALE ? MIN_SCALE : DOUBLE_TAP_ZOOM
      if (next === MIN_SCALE) {
        setTranslateX(0)
        setTranslateY(0)
        scaleRef.current = MIN_SCALE
        translateXRef.current = 0
        translateYRef.current = 0
      } else {
        scaleRef.current = next
      }
      return next
    })
  }, [])

  // Mouse-drag cursor state (drives re-render when dragging starts/ends)
  const [mouseDragging, setMouseDragging] = useState(false)

  // ── Mouse pan handlers (desktop) ──────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scaleRef.current <= MIN_SCALE) return
    e.preventDefault()
    isDragging.current = true
    mouseStart.current = { x: e.clientX, y: e.clientY }
    panStartTranslate.current = {
      x: translateXRef.current,
      y: translateYRef.current,
    }
    setMouseDragging(true)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - mouseStart.current.x
    const dy = e.clientY - mouseStart.current.y
    const newX = panStartTranslate.current.x + dx
    const newY = panStartTranslate.current.y + dy
    translateXRef.current = newX
    translateYRef.current = newY
    setTranslateX(newX)
    setTranslateY(newY)
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    setMouseDragging(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false
    setMouseDragging(false)
  }, [])

  // ── CSS transition for zoom toggles ──────────────────────────────────────
  // Active pinch: no transition (raw finger tracking). reducedMotion: no transition.
  // Tap/double-click toggles: smooth 0.2s ease.
  const isPinching = pinchStartDistance.current !== null
  const zoomTransition =
    reducedMotion || isPinching ? 'none' : 'transform 0.2s ease'

  // Cursor for the image container
  const imageCursor = mouseDragging ? 'grabbing' : scale > MIN_SCALE ? 'grab' : 'pointer'

  return (
    <>
      {/* Thumbnail grid — unchanged visual layout */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-10 px-0 lg:px-0">
        {images.map((img, idx) => (
          <button
            key={idx}
            ref={(el) => { triggerRefs.current[idx] = el }}
            type="button"
            onClick={() => open(idx)}
            aria-label={`View image ${idx + 1} of ${count} full size`}
            className="block w-full text-left cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            {img.width && img.height ? (
              <Image
                src={img.url}
                alt={`Gallery image ${idx + 1}`}
                width={img.width}
                height={img.height}
                className="w-full h-auto object-cover rounded"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 512px"
                placeholder={img.lqip ? 'blur' : 'empty'}
                blurDataURL={img.lqip}
              />
            ) : (
              <img
                src={img.url}
                alt={`Gallery image ${idx + 1}`}
                className="w-full h-auto object-cover rounded"
                loading="lazy"
              />
            )}
          </button>
        ))}
      </div>

      {/* Lightbox portal */}
      {mounted && isOpen && activeIndex !== null &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Gallery image ${activeIndex + 1} of ${count}`}
            className="fixed inset-0 z-50 flex items-center justify-center"
            // Touch handlers are attached via native addEventListener (non-passive)
            // in the useEffect above so that e.preventDefault() works correctly.
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black opacity-80"
              onClick={close}
              aria-hidden="true"
            />

            {/* Close button — min 44×44px touch target */}
            <button
              type="button"
              onClick={close}
              aria-label="Close image viewer"
              className="absolute top-3 right-3 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Previous button */}
            {count > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev() }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            {/* Next button */}
            {count > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next() }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            {/* Image container — overflow hidden clips panned image at viewport edges */}
            <div
              className="relative z-10 flex items-center justify-center max-w-[90vw] max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: imageCursor }}
            >
              {images[activeIndex].width && images[activeIndex].height ? (
                <Image
                  key={activeIndex}
                  src={images[activeIndex].url}
                  alt={`Gallery image ${activeIndex + 1} of ${count}`}
                  width={images[activeIndex].width}
                  height={images[activeIndex].height}
                  className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded"
                  sizes="90vw"
                  placeholder={images[activeIndex].lqip ? 'blur' : 'empty'}
                  blurDataURL={images[activeIndex].lqip}
                  priority
                  draggable={false}
                  style={{
                    transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
                    transition: zoomTransition,
                    animation: 'lightbox-fadein 0.2s ease',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: scale > MIN_SCALE ? 'none' : 'auto',
                  }}
                />
              ) : (
                <img
                  key={activeIndex}
                  src={images[activeIndex].url}
                  alt={`Gallery image ${activeIndex + 1} of ${count}`}
                  className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded"
                  draggable={false}
                  style={{
                    transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
                    transition: zoomTransition,
                    animation: 'lightbox-fadein 0.2s ease',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: scale > MIN_SCALE ? 'none' : 'auto',
                  }}
                />
              )}
            </div>

            {/* Image counter */}
            {count > 1 && (
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-white text-sm bg-black/50 px-3 py-1 rounded-full"
                aria-live="polite"
                aria-atomic="true"
              >
                {activeIndex + 1} / {count}
              </div>
            )}

            {/* Zoom level badge — visible only when zoomed */}
            {scale > MIN_SCALE && (
              <div
                className="absolute top-3 left-3 z-20 text-white text-xs bg-black/50 px-2 py-1 rounded-full select-none"
                aria-hidden="true"
              >
                {Math.round(scale * 100)}%
              </div>
            )}
          </div>,
          document.body
        )
      }
    </>
  )
}
