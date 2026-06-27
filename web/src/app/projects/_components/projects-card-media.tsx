'use client'

import { useState } from 'react'
import Image from 'next/image'

export const CARD_VARIANTS = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 500, damping: 32, delay: i * 0.02 },
  }),
}

export const CardPlaceholderContent = () => (
  <div className="flex flex-col gap-3 px-4">
    <div className="w-full h-3 rounded-full bg-surface-container-high opacity-50" />
    <div className="w-4/5 h-3 rounded-full bg-surface-container-high opacity-40" />
    <div className="w-full h-3 rounded-full bg-surface-container-high opacity-50 mt-2" />
    <div className="w-3/5 h-3 rounded-full bg-surface-container-high opacity-30" />
    <div className="w-4/5 h-3 rounded-full bg-surface-container-high opacity-40" />
    <div className="w-full h-3 rounded-full bg-surface-container-high opacity-50 mt-2" />
    <div className="w-2/3 h-3 rounded-full bg-surface-container-high opacity-30" />
  </div>
)

export const VideoSection = ({
  youtubeId,
  title,
  initialSrc,
  priority,
  hoverScale = false,
}: {
  youtubeId: string
  title: string
  initialSrc?: string | null
  priority?: boolean
  hoverScale?: boolean
}) => {
  const [playing, setPlaying] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const defaultSrc = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
  const [imgSrc, setImgSrc] = useState(initialSrc || defaultSrc)

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-container-low">
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      ) : (
        <>
          {!imageLoaded && <div className="absolute inset-0 bg-surface-container animate-pulse" />}
          <Image
            src={imgSrc}
            alt={title}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImgSrc(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`)
              setImageLoaded(true)
            }}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={priority}
            className={`object-cover transition-all duration-500 ${hoverScale ? 'group-hover:scale-[1.02]' : ''} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          {imageLoaded && (
            <button
              type="button"
              aria-label={`Play video: ${title}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setPlaying(true)
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-on-surface/90 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-surface ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}
        </>
      )}
    </div>
  )
}
