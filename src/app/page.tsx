import { sanityClient } from '@/lib/sanity'
import HomePageClient from '@/components/HomePageClient'

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

// This is now a Server Component. It fetches data and passes it to the client.
export default async function HomePage() {
  // Fetch data on the server
  const projects: Project[] = await sanityClient.fetch(
    `*[_type == "project"] | order(order asc){
      _id, title, slug, bgColor, mainImage{ asset->{ url, metadata{ lqip, dimensions } } }
    }`,
    {},
    {next: { tags: ['projects'] }}
  )

  // Pass the server-fetched data to the client component for rendering
  return <HomePageClient projects={projects} />
}