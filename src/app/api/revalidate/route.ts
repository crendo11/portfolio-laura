import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET

  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== secret) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }

  // Revalidate all pages that use the 'projects' tag
  revalidateTag('projects')
  return NextResponse.json({ revalidated: true, now: Date.now() })
}