'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// A single IntersectionObserver watches all section elements.
// The rootMargin carves a center band (~10% of viewport height) so only
// elements that overlap the middle of the screen are considered visible.
// Among all entries that fire in one callback batch, the one with the
// highest intersectionRatio wins — making selection deterministic and
// flicker-free even when two adjacent sections share the center band.
const CENTER_BAND_MARGIN = '-45% 0px -45% 0px'

export function useVisibleSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  // A stable function to assign refs to our articles.
  const setRef = useCallback((index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el
  }, [])

  useEffect(() => {
    const elements = sectionRefs.current
    if (elements.length === 0) return

    // Map each observed element back to its index for O(1) lookup in the callback.
    const indexByElement = new Map<Element, number>()
    elements.forEach((el, idx) => {
      if (el) indexByElement.set(el, idx)
    })

    const observer = new IntersectionObserver(
      (entries) => {
        // Among all entries intersecting the center band, keep the one with
        // the greatest intersectionRatio (most centered in the viewport).
        let bestIndex = -1
        let bestRatio = 0

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio
            bestIndex = indexByElement.get(entry.target) ?? -1
          }
        })

        // Only update activeIndex when at least one element is in the center band.
        // If nothing is intersecting (e.g. fast scroll between two sections),
        // we leave the previous activeIndex in place rather than resetting.
        if (bestIndex !== -1) {
          setActiveIndex(bestIndex)
        }
      },
      {
        rootMargin: CENTER_BAND_MARGIN,
        // Multiple thresholds give the callback a finer-grained intersectionRatio
        // to compare, making the "greatest ratio" heuristic more accurate when two
        // sections partially overlap the center band at the same time.
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      }
    )

    elements.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => {
      observer.disconnect()
    }
  }, [sectionRefs.current.length]) // Re-run if the number of articles changes.

  return { activeIndex, setRef }
}
