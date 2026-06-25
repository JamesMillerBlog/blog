import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  author?: string
}

export const PullQuote = ({ children, author }: Props): React.JSX.Element => {
  return (
    <blockquote className="not-prose my-10 rounded-xl border-l-4 border-surface-container-high bg-surface-container-lowest px-6 py-8 md:px-10">
      <div className="relative">
        <span className="absolute -top-5 -left-2 font-body text-6xl leading-none text-on-surface/10 select-none">
          &ldquo;
        </span>
        <p className="font-body text-2xl italic leading-relaxed text-on-surface md:text-3xl">
          {children}
        </p>
      </div>
      {author && (
        <p className="mt-4 text-sm font-headline font-medium text-on-surface-variant">- {author}</p>
      )}
    </blockquote>
  )
}
