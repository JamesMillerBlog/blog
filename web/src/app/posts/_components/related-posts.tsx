import Link from 'next/link'
import Image from 'next/image'
import { BookOpenIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { Post } from '@/types/post'

type Props = {
  posts: Post[]
}

export const RelatedPosts = ({ posts }: Props): React.JSX.Element | null => {
  if (posts.length === 0) return null

  return (
    <div className="mt-16">
      <h2 className="mb-6 font-headline text-2xl font-bold text-on-surface">More to Read</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="ds-card group overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="relative flex h-40 items-center justify-center overflow-hidden bg-surface-container-low">
              {post.coverImage ? (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <BookOpenIcon className="h-12 w-12 text-on-surface/20" />
              )}
            </div>
            <div className="p-5">
              {post.tags && post.tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="ds-post-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h3 className="ds-card-title leading-snug line-clamp-2 group-hover:font-extrabold transition-all">
                {post.title}
              </h3>
              <p className="ds-metadata mt-3">{format(new Date(post.date), 'MMM d, yyyy')}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
