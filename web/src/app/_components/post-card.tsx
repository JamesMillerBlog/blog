import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Post } from '@/types/post'
import { readingTime } from '@/common/utils/reading-time'

export const PostCard = ({
  post,
  variant = 'default',
}: {
  post: Post
  variant?: 'default' | 'glow'
}): React.JSX.Element => {
  return (
    <Link href={`/posts/${post.slug}`} className="block h-full">
      <article
        className={`ds-card group h-full flex flex-col overflow-hidden hover:scale-[1.02] transition-all duration-300 ${
          variant === 'default' ? 'hover:shadow-lg' : ''
        }`}
        style={
          variant === 'glow'
            ? { animation: 'gradientGlowBloom 4s ease-in-out infinite' }
            : undefined
        }
      >
        <div className="relative h-48 w-full overflow-hidden shrink-0 bg-surface-container-low">
          {post.coverImage && (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>
        <div className="p-6 flex flex-col flex-grow">
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full border border-outline-variant/50 text-on-surface-variant text-xs font-headline font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="ds-card-title mb-2 line-clamp-2 group-hover:font-extrabold transition-all">
            {post.title}
          </h3>
          <p className="font-body text-on-surface-variant text-sm line-clamp-3 mb-4 flex-grow">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-2 mt-auto">
            <span className="ds-metadata">{format(new Date(post.date), 'MMM d, yyyy')}</span>
            <span className="ds-metadata">·</span>
            <span className="ds-metadata">{readingTime(post.content || '')} min read</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
