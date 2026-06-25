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

export const SeriesNav = ({ series, current, posts }: Props): React.JSX.Element => {
  return (
    <div className="not-prose my-10 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6">
      <div className="mb-4 flex items-center gap-2">
        <BookOpenIcon className="h-4 w-4 text-on-surface-variant" />
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-headline">
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
                    ? 'bg-on-surface text-surface'
                    : isPast
                      ? 'bg-surface-container-high text-on-surface-variant'
                      : 'bg-surface-container-high text-on-surface-variant/50'
                }`}
              >
                {isPast ? <CheckIcon className="h-3 w-3" /> : partNumber}
              </span>
              {isCurrent ? (
                <span className="font-headline text-sm font-extrabold text-on-surface">
                  {post.title}
                </span>
              ) : (
                <Link
                  href={`/posts/${post.slug}`}
                  className="font-headline text-sm text-on-surface-variant transition-colors hover:text-on-surface"
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
