import { ReactElement } from 'react'
import { TableOfContents, InlineTableOfContents } from './table-of-contents'

type Props = {
  content: ReactElement
}

export const PostBody = ({ content }: Props): React.JSX.Element => {
  return (
    <div className="px-6">
      <div className="max-w-[1100px] mx-auto xl:grid xl:grid-cols-[1fr_240px] xl:gap-16 xl:items-start">
        <div>
          <InlineTableOfContents />
          <div className="markdown">{content}</div>
        </div>
        <aside className="hidden xl:block">
          <TableOfContents />
        </aside>
      </div>
    </div>
  )
}
