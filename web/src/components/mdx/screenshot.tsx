type Props = {
  src: string
  alt: string
  caption?: string
}

export function Screenshot({ src, alt, caption }: Props) {
  return (
    <figure className="not-prose my-8 mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-outline-variant/20 shadow-lg">
        <div className="flex items-center gap-1.5 bg-surface-container-high px-4 py-2.5 border-b border-outline-variant/20">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-auto block" />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm italic text-on-surface-variant">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
