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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 max-w-6xl mx-auto py-8">
          {projects.map((project, idx) => (
            <article
              key={project._id}
              ref={setRef(idx)}
              className="bg-transparent"
            >
              <div
                className="group block rounded-xl overflow-hidden"
                style={{ margin: idx == 0 ? '100px 0' : '200px 0' }}
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
                      className="relative"
                      style={{ margin: '20px 0' }}
                    >
                      <img
                        src={project.mainImage.asset.url}
                        alt={project.title}
                        className="rounded w-full max-w-xs h-auto object-cover max-h-[110vh]"
                        style={{ height: idx == 0 ? '80vh' : 'auto' }}
                        loading='lazy'
                      />
                      <div
                        style={{
                          pointerEvents: 'none',
                          position: 'absolute',
                          bottom: '-1.5rem',
                          color: 'black',
                          width: '100%',
                          textAlign: 'center',
                        }}
                      >
                        <span className="mt-2 text-xs text-gray-500">{project.title}</span>
                      </div>
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