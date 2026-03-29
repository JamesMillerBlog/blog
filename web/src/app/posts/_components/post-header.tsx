import Avatar from '@/components/ui/avatar'
import CoverImage from '@/components/ui/cover-image'
import DateFormatter from '@/components/ui/date-formatter'
import { PostTitle } from '@/components/ui/post-title'
import { type Author } from '@/types/author'
import { ui } from '@/i18n/en'

type Props = {
  title: string
  coverImage: string
  date: string
  author: Author
}

export function PostHeader({ title, coverImage, date, author }: Props) {
  return (
    <header className="max-w-[980px] mx-auto mb-16">
      <div className="mb-8">
        <PostTitle>{title}</PostTitle>
      </div>

      {/* Meta info block */}
      <div className="flex flex-wrap items-center gap-6 mb-12 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
        <Avatar name={author.name} picture={author.picture} />
        <div className="w-px h-8 bg-outline-variant/30 hidden sm:block"></div>
        <div className="text-sm font-headline font-semibold text-on-surface-variant flex items-center gap-2">
          <span className="opacity-70">{ui.posts.published}</span>
          <span className="text-primary">
            <DateFormatter dateString={date} />
          </span>
        </div>
      </div>

      <div className="mb-8 sm:mx-0 rounded-3xl overflow-hidden shadow-xl shadow-primary/5 border border-outline-variant/5">
        <CoverImage title={title} src={coverImage} />
      </div>
    </header>
  )
}
