import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: 'jw0ycs1a', // <-- Replace with your project ID
  dataset: 'production',        // <-- Replace with your dataset name
  apiVersion: '2025-07-25',     // Use today's date or the date you set up Sanity
  useCdn: true,                 // `false` if you want fresh data
})