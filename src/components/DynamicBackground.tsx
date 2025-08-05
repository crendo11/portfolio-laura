'use client'

import { useEffect, useState } from 'react'

type Project = {
  bgColor?: { hex: string }
}

interface DynamicBackgroundProps {
  projects: Project[]
  activeIndex: number
}

// Helper function to calculate the gradient string for a given project
const getGradient = (project: Project | undefined, isEven: boolean): string => {
  if (!project) return 'transparent' // Return transparent if no project
  const color = project.bgColor?.hex || '#f0f0f0'

  return isEven
    ? `linear-gradient(to bottom, ${color} 30%, #ffffff 100%)`
    : `linear-gradient(to bottom, #ffffff 0%, ${color} 70%)`
}

export default function DynamicBackground({ projects, activeIndex }: DynamicBackgroundProps) {
  // We manage two separate gradients: one for even sections, one for odd.
  const [gradientA, setGradientA] = useState(() => getGradient(projects[0], true)) // For even indices (0, 2, 4...)
  const [gradientB, setGradientB] = useState(() => getGradient(projects[1], false)) // For odd indices (1, 3, 5...)

  useEffect(() => {
    // When the active section changes, we only update the gradient for its corresponding layer.
    // The other layer remains in the background, ready to be faded to.
    if (activeIndex % 2 === 0) {
      setGradientA(getGradient(projects[activeIndex], true))
    } else {
      setGradientB(getGradient(projects[activeIndex], false))
    }
  }, [activeIndex, projects])

  const isLayerAVisible = activeIndex % 2 === 0

  return (
    <>
      {/* Layer A (for even-indexed sections) */}
      <div
        className="fixed inset-0 -z-10 transition-opacity duration-[1500ms] ease-in-out w-full h-full"
        style={{
          background: gradientA,
          opacity: isLayerAVisible ? 1 : 0,
        }}
      />
      {/* Layer B (for odd-indexed sections) */}
      <div
        className="fixed inset-0 -z-10 transition-opacity duration-[1500ms] ease-in-out w-full h-full"
        style={{
          background: gradientB,
          opacity: isLayerAVisible ? 0 : 1,
        }}
      />
    </>
  )
}