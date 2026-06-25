import type { ReactNode } from 'react'

type Props = {
  logo: string
  title: string
  href: string
  children: ReactNode
}

export const TechCard = ({ logo, title, href, children }: Props): React.JSX.Element => {
  return (
    <div className="not-prose my-6 flex gap-5 rounded-xl bg-surface-container p-5 items-start">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
        aria-label={title}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={`${title} logo`}
          className="h-16 w-16 rounded-lg object-contain bg-surface-container-lowest p-1 shadow-sm"
        />
      </a>
      <div className="min-w-0">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-headline font-bold text-lg text-on-surface hover:font-extrabold transition-all"
        >
          {title}
        </a>
        <p className="mt-1 text-base leading-relaxed text-on-surface-variant">{children}</p>
      </div>
    </div>
  )
}
