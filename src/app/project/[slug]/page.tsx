import { sanityClient } from '@/lib/sanity'
import { PortableText } from '@portabletext/react'

type Project = {
    title: string
    mainImage?: { asset: { url: string } }
    gallery?: { asset: { url: string } }[]
    video?: string
    description?: string
    process?: any
}

interface PageProps {
  params: Promise<{ slug: string }>
}


export default async function ProjectPage( { params }: PageProps ) {
    // Destructure params from props (no need to await props in the latest Next.js, just use props.params)
    const { slug } = await params

    // Fetch the project from Sanity using the slug
    const project: Project = await sanityClient.fetch(
        `*[_type == "project" && slug.current == $slug][0]{
        title,
        mainImage{ asset->{ url } },
        gallery[]{ asset->{ url } },
        video,
        description,
        process
      }`,
        { slug }
    )

    if (!project) return <div>Project not found</div>

    return (
        <main className="max-w-5xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-6">{project.title}</h1>
            {project.mainImage?.asset?.url && (
                <img
                    src={project.mainImage.asset.url}
                    alt={project.title}
                    className="w-full h-auto object-cover rounded mb-6"
                />
            )}
            {project.description && (
                <p className="mb-6 text-lg text-gray-700">{project.description}</p>
            )}
            {project.video && (
                <div className="mb-6">
                    <video controls className="w-full rounded">
                        <source src={project.video} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}
            {project.gallery && project.gallery.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {project.gallery.map((img, idx) =>
                        img.asset?.url ? (
                            <img
                                key={idx}
                                src={img.asset.url}
                                alt={`Gallery image ${idx + 1}`}
                                className="w-full h-auto object-cover rounded"
                                loading='lazy'
                            />
                        ) : null
                    )}
                </div>
            )}
            {project.process && (
                <div className="prose">
                    <h2>Design Process</h2>
                    <PortableText value={project.process} />
                </div>
            )}
        </main>
    )
}