import Link from 'next/link'
import { BookOpenIcon, CheckIcon } from 'lucide-react'

type SeriesPost = {
  title: string
  slug: string
}

type Props = {
  series: string
  current: number
  posts: SeriesPost[]
}

export function SeriesNav({ series, current, posts }: Props) {
  return (
    <div className="not-prose my-10 rounded-xl border border-primary/20 bg-primary/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <BookOpenIcon className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-primary font-headline">
          Series
        </span>
      </div>
      <p className="mb-4 font-headline text-lg font-bold text-on-surface">{series}</p>
      <ol className="space-y-2">
        {posts.map((post, i) => {
          const partNumber = i + 1
          const isCurrent = partNumber === current
          const isPast = partNumber < current

          return (
            <li key={post.slug} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold font-headline ${
                  isCurrent
                    ? 'bg-primary text-on-primary'
                    : isPast
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {isPast ? <CheckIcon className="h-3 w-3" /> : partNumber}
              </span>
              {isCurrent ? (
                <span className="font-headline text-sm font-bold text-primary">{post.title}</span>
              ) : (
                <Link
                  href={`/posts/${post.slug}`}
                  className="font-headline text-sm text-on-surface-variant transition-colors hover:text-primary"
                >
                  {post.title}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
