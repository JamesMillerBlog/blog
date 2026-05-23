'use client'

import { useState } from 'react'
import { PlayIcon } from 'lucide-react'
import Image from 'next/image'

type Props = {
  videoId: string
  title?: string
}

export function YouTubeEmbed({ videoId, title }: Props) {
  const [playing, setPlaying] = useState(false)

  return (
    <figure className="not-prose my-10">
      <div className="relative aspect-video overflow-hidden rounded-xl shadow-md">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title ?? 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            aria-label={title ? `Play: ${title}` : 'Play video'}
            className="group relative h-full w-full block"
          >
            <Image
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={title ?? 'Video thumbnail'}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg transition-transform group-hover:scale-110">
                <PlayIcon className="h-6 w-6 fill-on-primary text-on-primary" />
              </div>
            </div>
          </button>
        )}
      </div>
      {title && (
        <figcaption className="mt-3 text-center text-sm italic text-on-surface-variant">
          {title}
        </figcaption>
      )}
    </figure>
  )
}
