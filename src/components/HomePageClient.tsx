'use client'

import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import { useVisibleSection } from '@/hooks/useVisibleSection'
import DynamicBackground from '@/components/DynamicBackground'

type Project = {
    _id: string
    title: string
    slug?: { current?: string } | null
    bgColor?: { hex: string }
    mainImage?: {
        asset: {
            url: string
            metadata?: {
                lqip?: string
                dimensions?: { width: number; height: number }
            }
        }
    }
}

interface HomePageClientProps {
    projects: Project[]
}

export default function HomePageClient({ projects }: HomePageClientProps) {
    const { activeIndex, setRef } = useVisibleSection()

    return (
        <>
            <DynamicBackground projects={projects} activeIndex={activeIndex} />
            <Header />
            <main className="relative z-10 min-h-screen bg-transparent px-2 sm:px-4">
                <div className="grid grid-cols-1">
                    {projects.map((project, idx) => (
                        <article
                            key={project._id}
                            ref={setRef(idx)}
                            className="bg-transparent"
                        >
                            <div
                                className="group block overflow-hidden"
                                style={{ margin: idx == 0 ? '100px 0' : '150px 0' }}
                            >
                                {project.mainImage?.asset?.url && (() => {
                                    const asset = project.mainImage.asset
                                    const hasDimensions = Boolean(
                                        asset.metadata?.dimensions?.width &&
                                        asset.metadata?.dimensions?.height
                                    )
                                    const imgWidth = asset.metadata?.dimensions?.width ?? 1920
                                    const imgHeight = asset.metadata?.dimensions?.height ?? 1080
                                    const maxHeightClass = idx === 0
                                        ? 'max-h-[80svh]'
                                        : 'max-h-[55svh] sm:max-h-[110svh]'
                                    const imgClassName = `rounded-xl  max-w-[75vw]`

                                    const imageEl = hasDimensions ? (
                                        <Image
                                            src={asset.url}
                                            alt={project.title}
                                            width={imgWidth}
                                            height={imgHeight}
                                            className={imgClassName}
                                            style={{ width: 'auto', maxWidth: '100%' }}
                                            sizes="75vw"
                                            placeholder={asset.metadata?.lqip ? 'blur' : 'empty'}
                                            blurDataURL={asset.metadata?.lqip}
                                        />
                                    ) : (
                                        <img
                                            src={asset.url}
                                            alt={project.title}
                                            className={imgClassName}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    )

                                    return (
                                        <div
                                            className={
                                                idx % 2 === 0
                                                    ? 'flex justify-center'
                                                    : idx % 4 === 1
                                                        ? 'flex justify-start'
                                                        : 'flex justify-end'
                                            }
                                        >
                                            {project.slug?.current ? (
                                                <Link href={`/project/${project.slug.current}`}>
                                                    {imageEl}
                                                    <div className="py-2 text-xs sm:text-base text-gray-800">{project.title}</div>
                                                </Link>
                                            ) : (
                                                <div>
                                                    {imageEl}
                                                    <div className="py-2 text-xs sm:text-base text-gray-800">{project.title}</div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })()}
                            </div>
                        </article>
                    ))}
                </div>
            </main>
        </>
    )
}