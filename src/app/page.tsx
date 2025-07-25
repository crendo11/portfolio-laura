import Link from 'next/link'
import { sanityClient } from '@/lib/sanity'

type Project = {
  _id: string
  title: string
  slug: { current: string }
  bgColor?: { hex: string }
  mainImage?: { asset: { url: string } }
}

export default async function HomePage() {
  const projects: Project[] = await sanityClient.fetch(
    `*[_type == "project"]{
      _id,
      title,
      slug,
      bgColor,
      mainImage{
        asset->{
          url
        }
      }
    }`
  )

  return (
    <main className="min-h-screen bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {projects.map((project, idx) => {
          const color = project.bgColor?.hex || '#f0f0f0'
          const gradient =
            idx % 2 === 0
              ? `linear-gradient(to bottom, ${color} 0%, #fff 100%)`
              : `linear-gradient(to bottom, #fff 0%, ${color} 100%)`


          return (
            <article
              key={project._id}
              style={{ background: gradient }}
              className="rounded-xl transition-shadow duration-300 shadow-lg hover:shadow-2xl"
            >
              <Link
                href={`/project/${project.slug.current}`}
                className="group block rounded-xl overflow-hidden"
                style={{ margin: '200px 0' }}
              >
                {project.mainImage?.asset?.url && (
                  <div
                    className={
                      idx % 2 === 0
                        ? "flex justify-center"
                        : idx % 4 === 1
                          ? "flex justify-start"
                          : "flex justify-end"
                    }
                  >
                    <div 
                      className="relative"
                      style={{ margin: '30px 0' }}
                      >
                      <img
                        src={project.mainImage.asset.url}
                        alt={project.title}
                        className="rounded max-w-xs h-auto"
                      />
                      <div style={{ pointerEvents: 'none', position: 'absolute', bottom: '-1.5rem', color: 'black'}}
                      >
                        <span className="mt-2 text-xs text-gray-500">{project.title}</span>
                      </div>
                    </div>

                  </div>
                )}
              </Link>
            </article>
          )
        })}
      </div>
    </main>
  )
}