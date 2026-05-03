import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import matter from 'gray-matter'
import { join } from 'path'
import { Post } from '@/types/post'
import { STAGING_ENVIRONMENT, PRODUCTION_ENVIRONMENT } from '@/common/consts/constants'

const POSTS_BUCKET = process.env.POSTS_BUCKET
const POSTS_BUCKET_REGION = process.env.POSTS_BUCKET_REGION ?? 'us-east-1'
const POSTS_PREFIX = process.env.POSTS_PREFIX ?? ''

if (process.env.NEXT_PUBLIC_ENVIRONMENT === PRODUCTION_ENVIRONMENT && !POSTS_BUCKET) {
  console.warn('POSTS_BUCKET is not set in production — falling back to local _posts directory')
}

// Allowlist: lowercase/uppercase letters, digits, hyphens. Blocks ../ traversal.
const VALID_SLUG = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/

// Local filesystem fallback for development
const postsDirectory = join(process.cwd(), '_posts')

let s3: S3Client | null = null
function getS3Client() {
  if (!s3) s3 = new S3Client({ region: POSTS_BUCKET_REGION })
  return s3
}

async function fetchS3Object(key: string): Promise<string> {
  const response = await getS3Client().send(
    new GetObjectCommand({ Bucket: POSTS_BUCKET!, Key: key })
  )
  return response.Body!.transformToString()
}

export async function getPostSlugs(): Promise<string[]> {
  if (!POSTS_BUCKET) {
    return fs.readdirSync(postsDirectory)
  }

  const response = await getS3Client().send(
    new ListObjectsV2Command({ Bucket: POSTS_BUCKET, Prefix: POSTS_PREFIX })
  )

  return (response.Contents ?? [])
    .map((obj) => obj.Key!)
    .filter((key) => key.endsWith('.mdx') || key.endsWith('.md'))
    .map((key) => key.slice(POSTS_PREFIX.length))
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const realSlug = slug.replace(/\.(md|mdx)$/, '')
  if (!VALID_SLUG.test(realSlug)) return null

  let fileContents: string

  if (!POSTS_BUCKET) {
    let fullPath = join(postsDirectory, `${realSlug}.mdx`)
    if (!fs.existsSync(fullPath)) {
      fullPath = join(postsDirectory, `${realSlug}.md`)
    }
    try {
      fileContents = fs.readFileSync(fullPath, 'utf8')
    } catch {
      return null
    }
  } else {
    try {
      fileContents = await fetchS3Object(`${POSTS_PREFIX}${realSlug}.mdx`)
    } catch {
      try {
        fileContents = await fetchS3Object(`${POSTS_PREFIX}${realSlug}.md`)
      } catch {
        return null
      }
    }
  }

  const { data, content } = matter(fileContents)
  return { ...data, slug: realSlug, content } as Post
}

export function isPostVisible(post: Post): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === STAGING_ENVIRONMENT ||
    !post.draft
  )
}

export async function getAllPosts(): Promise<Post[]> {
  const slugs = await getPostSlugs()
  const posts = await Promise.all(slugs.map((slug) => getPostBySlug(slug)))
  return (posts.filter(Boolean) as Post[])
    .filter(isPostVisible)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
}
