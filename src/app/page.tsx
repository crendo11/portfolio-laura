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
    `*[_type == "project"] | order(order asc){
      _id,
      title,
      slug,
      bgColor,
      mainImage{
        asset->{
          url
        }
      }
    }`,
    {},
    { next: { tags: ['projects'] } }
  )

  return (
    <>
      <header className="fixed w-full flex justify-between items-center px-4 py-3 bg-transparent">
        <span className="text-lg font-bold">Leidy Laura Rendon</span>
        <span className="text-base">about</span>
      </header>
      <main className="min-h-screen bg-white px-2 sm:px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 max-w-6xl mx-auto py-8">
          {projects.map((project, idx) => {
            const color = project.bgColor?.hex || '#f0f0f0'
            const nextColor = projects[idx + 1]?.bgColor?.hex || color

            let gradient: string
            if (idx % 2 === 0) {
              // Project 1, 3, ...
              gradient = `linear-gradient(to bottom, ${color} 30%, #fff 100%)`
            } else {
              // Project 2, 4, ...
              gradient = `linear-gradient(to bottom, #fff 0%, ${color} 80%, ${nextColor} 100%)`
            }


            return (
              <article
                key={project._id}
                style={{ background: gradient }}
                className="rounded-xl transition-shadow duration-300 shadow-lg hover:shadow-2xl"
              >
                <Link
                  href={`/project/${project.slug.current}`}
                  className="group block rounded-xl overflow-hidden"
                  style={{ margin: idx == 0 ? '100px 0' : '200px 0' }}
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
                        style={{ margin: '20px 0' }}
                      >
                        <img
                          src={project.mainImage.asset.url}
                          alt={project.title}
                          className="rounded w-full max-w-xs h-auto object-cover max-h-[130vh]"
                          style={{  height: idx == 0 ? '80vh' : 'auto' }}
                        />
                        <div
                          style={{
                            pointerEvents: 'none',
                            position: 'absolute',
                            bottom: '-1.5rem',
                            color: 'black',
                            width: '100%',
                            textAlign: 'center'
                          }}
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
    </>
  )
}