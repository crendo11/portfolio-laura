'use client'

import { useState, useCallback } from 'react'

interface VideoFacadeProps {
  /** The iframe embed src (without autoplay). */
  src: string
  /** 'youtube' | 'vimeo' — determines thumbnail strategy. */
  type: 'youtube' | 'vimeo'
  /**
   * YouTube video ID extracted from the embed src.
   * Required when type === 'youtube' so we can build the thumbnail URL.
   */
  videoId?: string
}

/**
 * Click-to-load facade for YouTube/Vimeo iframes.
 *
 * While the user has not activated the video:
 * - YouTube: shows hqdefault.jpg thumbnail from img.youtube.com
 * - Vimeo: shows a neutral dark placeholder (no public thumbnail API without auth)
 *
 * On activation (click or Enter/Space), mounts the real <iframe> with autoplay=1.
 * Container dimensions match the parent's aspect-video container exactly.
 */
export default function VideoFacade({ src, type, videoId }: VideoFacadeProps) {
  const [loaded, setLoaded] = useState(false)

  const activate = useCallback(() => {
    setLoaded(true)
  }, [])

  // Append autoplay parameter when the user activates the facade
  const autoplaySrc = src.includes('?')
    ? `${src}&autoplay=1`
    : `${src}?autoplay=1`

  if (loaded) {
    return (
      <iframe
        src={autoplaySrc}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title="Project video"
      />
    )
  }

  const thumbnailUrl =
    type === 'youtube' && videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null

  return (
    <button
      type="button"
      onClick={activate}
      aria-label="Play video"
      className="absolute inset-0 h-full w-full flex items-center justify-center bg-black group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {/* Thumbnail image — only for YouTube */}
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      )}

      {/* Dark overlay to ensure play button is always legible */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-200"
      />

      {/* Play button circle */}
      <span
        aria-hidden="true"
        className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white/90 group-hover:bg-white transition-colors duration-200 group-hover:scale-110 transition-transform"
      >
        {/* Play triangle SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7 text-black translate-x-0.5"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  )
}
