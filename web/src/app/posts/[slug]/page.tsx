import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllPosts, getPostBySlug, isPostVisible } from '@/common/utils/posts'
import { SITE_URL, TWITTER_HANDLE, AUTHOR } from '@/common/consts/constants'
import { ui } from '@/i18n/en'
import { compileMDXContent } from '@/common/utils/mdx'
import { PostBody } from '@/app/posts/_components/post-body'
import { PostHeader } from '@/app/posts/_components/post-header'
import { JsonLd } from '@/components/ui/json-ld'
import { ArrowLeftIcon } from 'lucide-react'

export default async function Post(props: Params) {
  const params = await props.params
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return notFound()
  }

  if (!isPostVisible(post)) {
    return notFound()
  }

  const content = await compileMDXContent(post.content || '')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      url: AUTHOR.url,
    },
    publisher: {
      '@type': 'Person',
      name: AUTHOR.name,
      url: AUTHOR.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/posts/${post.slug}`,
    },
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="pt-32 pb-20">
        <article>
          {/* Breadcrumb */}
          <div className="max-w-[980px] mx-auto mb-10 px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary font-headline font-bold text-sm hover:text-secondary transition-colors px-4 py-2 bg-primary/5 hover:bg-secondary/5 rounded-full"
            >
              <ArrowLeftIcon className="w-4 h-4" /> {ui.posts.backToBlog}
            </Link>
          </div>
          <PostHeader
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            author={post.author}
          />
          <PostBody content={content} />
        </article>
      </main>
    </>
  )
}

type Params = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return notFound()
  }

  const url = `${SITE_URL}/posts/${post.slug}`

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: AUTHOR.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url,
      publishedTime: post.date,
      authors: [AUTHOR.name],
      images: [
        {
          url: post.ogImage.url,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.ogImage.url],
      creator: TWITTER_HANDLE,
    },
    alternates: {
      canonical: url,
    },
  }
}

export async function generateStaticParams() {
  const posts = await getAllPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}
