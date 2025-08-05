'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import { useVisibleSection } from '@/hooks/useVisibleSection'
import DynamicBackground from '@/components/DynamicBackground'

type Project = {
    _id: string
    title: string
    slug: { current: string }
    bgColor?: { hex: string }
    mainImage?: { asset: { url: string } }
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
                                style={{ margin: idx == 0 ? '100px 0' : '100px 0' }}
                            >
                                {project.mainImage?.asset?.url && (
                                    <div
                                        className={
                                            idx % 2 === 0
                                                ? 'flex justify-center'
                                                : idx % 4 === 1
                                                    ? 'flex justify-start'
                                                    : 'flex justify-end'
                                        }
                                    >
                                        <Link
                                            href={`/project/${project.slug.current}`}
                                        >
                                            <img
                                                src={project.mainImage.asset.url}
                                                alt={project.title}
                                                className={`rounded-xl object-cover ${idx == 0 ? 'max-h-[80vh]' : 'max-h-[55vh] sm:max-h-[110vh]'} max-w-[75vw]`}
                                                loading='lazy'
                                            />
                                            <div className="py-2 text-xs text-gray-800">{project.title}</div>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </main>
        </>
    )
}