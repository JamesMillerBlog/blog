import type { ReactNode } from 'react'

type Props = {
  src: string
  alt: string
  title: string
  caption?: string
  reverse?: boolean
  children: ReactNode
}

export function SplitMedia({ src, alt, title, caption, reverse = false, children }: Props) {
  return (
    <div
      className={`my-10 flex flex-col gap-8 md:items-center md:gap-12 ${
        reverse ? 'md:flex-row-reverse' : 'md:flex-row'
      }`}
    >
      <div className="mdx-inner flex-1 min-w-0">
        <h4
          className="font-headline font-bold text-2xl leading-snug mb-3"
          style={{ color: 'var(--color-on-background)' }}
        >
          {title}
        </h4>
        <div className="text-[17px] leading-[1.7]" style={{ color: 'var(--color-on-surface)' }}>
          {children}
        </div>
      </div>
      <figure className="shrink-0 w-full md:w-[48%] m-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-auto rounded-xl shadow-md block" />
        {caption && (
          <figcaption
            className="mt-2 text-center text-sm italic"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            {caption}
          </figcaption>
        )}
      </figure>
    </div>
  )
}
