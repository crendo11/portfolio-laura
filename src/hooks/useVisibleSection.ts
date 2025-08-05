'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useVisibleSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  // A stable function to assign refs to our articles
  const setRef = useCallback((index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el
  }, [])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return

      // Create an observer for each article
      const observer = new IntersectionObserver(
        ([entry]) => {
          // If the article is more than 50% visible, set it as active
          if (entry.isIntersecting) {
            setActiveIndex(index)
          }
        },
        {
          threshold: 0.5, // Triggers when 50% of the element is visible
        }
      )

      observer.observe(ref)
      observers.push(observer)
    })

    // Cleanup observers on component unmount
    return () => {
      observers.forEach((observer) => observer.disconnect())
    }
  }, [sectionRefs.current.length]) // Rerun if the number of articles changes

  return { activeIndex, setRef }
}