import type { ReactNode } from 'react'

type GridProps = {
  children: ReactNode
}

export const ExampleGrid = ({ children }: GridProps): React.JSX.Element => {
  return <div className="not-prose my-10 grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>
}

type CardProps = {
  src: string
  alt: string
  title: string
  href?: string
  children: ReactNode
}

export const ExampleCard = ({ src, alt, title, href, children }: CardProps): React.JSX.Element => {
  return (
    <div className="ds-card flex flex-col overflow-hidden bg-surface-container">
      <figure className="h-[32rem] overflow-hidden m-0 p-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </figure>
      <div className="mdx-inner p-5 flex flex-col gap-2">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-headline font-bold text-lg leading-snug text-primary hover:text-secondary transition-colors"
          >
            {title}
          </a>
        ) : (
          <p className="font-headline font-bold text-lg leading-snug text-on-surface">{title}</p>
        )}
        <div
          className="text-base leading-relaxed"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
