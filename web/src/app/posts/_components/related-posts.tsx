import Link from 'next/link'
import Image from 'next/image'
import { BookOpenIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { Post } from '@/types/post'

type Props = {
  posts: Post[]
}

export function RelatedPosts({ posts }: Props) {
  if (posts.length === 0) return null

  return (
    <div className="mt-16">
      <h2 className="mb-6 font-headline text-2xl font-bold text-on-surface">More to Read</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
              {post.coverImage ? (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <BookOpenIcon className="h-12 w-12 text-primary/30" />
              )}
            </div>
            <div className="p-5">
              {post.tags && post.tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold uppercase tracking-wider text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h3 className="font-headline text-lg font-bold leading-snug text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="mt-3 font-headline text-xs text-on-surface-variant">
                {format(new Date(post.date), 'MMM d, yyyy')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
