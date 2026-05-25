import { NextResponse, type NextRequest } from 'next/server'
import { getAllPosts } from '@/common/utils/posts'
import { projects } from '@/app/projects/data'

export const dynamic = 'force-dynamic'

export interface SearchResultItem {
  type: 'post' | 'project'
  title: string
  slug: string
  excerpt: string
  date?: string
  tags: string[]
  href: string
}

// In-memory rate limiter: 60 requests per minute per IP
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 60
let lastCleanup = 0
const CLEANUP_COOLDOWN_MS = 60_000

function checkAndRecordRequest(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) ?? []
  // Prune expired timestamps
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) return true
  recent.push(now)
  rateLimitMap.set(ip, recent)
  // Periodic cleanup: sweep if needed and last sweep was >60s ago (avoids latency spikes)
  if (rateLimitMap.size > 10_000 && now - lastCleanup > CLEANUP_COOLDOWN_MS) {
    lastCleanup = now
    for (const [key, ts] of rateLimitMap) {
      const valid = ts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
      if (valid.length === 0) rateLimitMap.delete(key)
      else rateLimitMap.set(key, valid)
    }
  }
  return false
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  if (checkAndRecordRequest(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // getAllPosts() already filters by isPostVisible internally
  const allPosts = await getAllPosts()

  const postResults: SearchResultItem[] = allPosts.map((post) => ({
    type: 'post',
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    date: post.date,
    tags: post.tags ?? [],
    href: `/posts/${post.slug}`,
  }))

  const projectResults: SearchResultItem[] = projects
    .filter((p) => p.portfolio !== false)
    .map((p) => ({
      type: 'project',
      title: p.title,
      slug: p.slug,
      excerpt: p.description,
      date: `${p.year}`,
      tags: p.tags,
      href: `/projects#${p.slug}`,
    }))

  return NextResponse.json([...postResults, ...projectResults])
}
