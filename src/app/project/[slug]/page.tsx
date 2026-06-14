import Image from 'next/image'
import { sanityClient } from '@/lib/sanity'
import { PortableText } from '@portabletext/react'
import GalleryLightbox from '@/components/GalleryLightbox'
import VideoFacade from '@/components/VideoFacade'

type Project = {
    title: string
    mainImage?: {
        asset: {
            url: string
            metadata: {
                dimensions: {
                    width: number
                    height: number
                }
            }
        }
    }
    gallery?: {
      asset: {
        url: string
        metadata?: {
          lqip?: string
          dimensions?: { width: number; height: number }
        }
      }
    }[]
    video?: string
    description?: any
    process?: any
}

interface PageProps {
  params: Promise<{ slug: string }>
}

// Utility to build embed iframe src
function buildEmbedSrc(raw?: string): { type: 'youtube' | 'vimeo' | 'file' | 'none'; src?: string } {
  if (!raw) return { type: 'none' }
  const url = raw.trim()

  // Ignore YouTube Clip URLs (cannot be directly embedded without resolving underlying video)
  if (/youtube\.com\/clip\//.test(url)) {
    return { type: 'none' } // deliberate: do not render anything, no fallback
  }

  // YouTube (watch, embed, live, short youtu.be)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([\w-]{11})/
  )
  if (ytMatch) {
    const id = ytMatch[1]

    // Optional: preserve start time (?t= or &t= or ?start=)
    let start = 0
    const tParam = url.match(/[?&#](?:t|start)=(\d+)/)
    if (tParam) start = parseInt(tParam[1], 10)
    const startQuery = start > 0 ? `&start=${start}` : ''

    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${startQuery}`
    }
  }

  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) {
    return {
      type: 'vimeo',
      src: `https://player.vimeo.com/video/${vmMatch[1]}?title=0&byline=0&portrait=0`
    }
  }

  // Direct file
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: 'file', src: url }

  return { type: 'none' }
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params
  const project: Project = await sanityClient.fetch(
    `*[_type == "project" && slug.current == $slug][0]{
      title,
      mainImage{ asset->{ url, metadata{ dimensions } } },
      gallery[]{ asset->{ url, metadata{ lqip, dimensions } } },
      video,
      description,
      process
    }`,
    { slug }
  )

  const videoInfo = buildEmbedSrc(project.video)

  // Extract YouTube video ID from the embed src (e.g. .../embed/{ID}?...) so the
  // VideoFacade can build the thumbnail URL without re-parsing the original raw URL.
  const youtubeVideoId =
    videoInfo.type === 'youtube' && videoInfo.src
      ? (videoInfo.src.match(/\/embed\/([\w-]{11})/) ?? [])[1]
      : undefined

  return (
    <main className="mx-auto w-full max-w-5xl lg:py-12 lg:px-6 py-4 px-0">
      {project.mainImage?.asset?.url && (
        <Image
          src={project.mainImage.asset.url}
          alt={project.title}
          width={project.mainImage.asset.metadata?.dimensions?.width ?? 1920}
          height={project.mainImage.asset.metadata?.dimensions?.height ?? 1080}
          className="w-full h-auto object-cover rounded mb-6"
          sizes="(max-width: 1024px) 100vw, 1024px"
          priority
        />
      )}

      <h1 className="text-2xl font-semibold mb-4 px-4 lg:px-0">{project.title}</h1>

      {project.description && (
        <section className="prose max-w-none px-4 lg:px-0 mb-8">
          <PortableText value={project.description} />
        </section>
      )}
      {videoInfo.type !== 'none' && (
        <div className="mb-8 px-0 lg:px-0">
          {videoInfo.type === 'file' && videoInfo.src && (
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full rounded aspect-video bg-black"
            >
              <source src={videoInfo.src} />
              Your browser does not support the video tag.
            </video>
          )}
          {videoInfo.type !== 'file' && videoInfo.src && (
            <div className="relative w-full aspect-video rounded overflow-hidden bg-black">
              <VideoFacade
                src={videoInfo.src}
                type={videoInfo.type}
                videoId={youtubeVideoId}
              />
            </div>
          )}
        </div>
      )}

      {project.gallery && project.gallery.length > 0 && (
        <GalleryLightbox
          images={project.gallery
            .filter((img) => Boolean(img.asset?.url))
            .map((img) => ({
              url: img.asset.url,
              lqip: img.asset.metadata?.lqip,
              width: img.asset.metadata?.dimensions?.width,
              height: img.asset.metadata?.dimensions?.height,
            }))}
        />
      )}

      {project.process && (
        <section className="prose prose-neutral max-w-none px-4 lg:px-0 pb-16">
          <PortableText value={project.process} />
        </section>
      )}
    </main>
  )
}