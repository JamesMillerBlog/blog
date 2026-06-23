import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug, isPostVisible } from '@/common/utils/posts'
import { SITE_URL, TWITTER_HANDLE, AUTHOR } from '@/common/consts/constants'
import { ui } from '@/i18n/en'
import { compileMDXContent } from '@/common/utils/mdx'
import { readingTime } from '@/common/utils/reading-time'
import { PostBody } from '@/app/posts/_components/post-body'
import { PostHeader } from '@/app/posts/_components/post-header'
import { AuthorBio } from '@/app/posts/_components/author-bio'
import { RelatedPosts } from '@/app/posts/_components/related-posts'
import { JsonLd } from '@/components/ui/json-ld'
import { BackButton } from '@/app/posts/_components/back-button'

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
  const minutes = readingTime(post.content || '')

  const allPosts = await getAllPosts()
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .filter((p) => post.tags?.some((tag) => p.tags?.includes(tag)))
    .slice(0, 3)

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
            <BackButton label={ui.posts.backToBlog} />
          </div>
          <PostHeader
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            author={post.author}
            readingTime={minutes}
          />
          <PostBody content={content} />
          <div className="max-w-[1100px] mx-auto px-6">
            <AuthorBio author={post.author} />
            <RelatedPosts posts={relatedPosts} />
          </div>
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

  if (!post || !isPostVisible(post)) {
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
