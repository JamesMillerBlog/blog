'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Project } from '@/app/projects/data'

export function VideoPlayer({ project, priority }: { project: Project; priority?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const thumbUrl =
    project.image ?? `https://img.youtube.com/vi/${project.youtubeId}/maxresdefault.jpg`
  const [imgSrc, setImgSrc] = useState(thumbUrl)

  if (!project.youtubeId) {
    return (
      <div className="aspect-video rounded-xl bg-surface-container-low flex items-center justify-center">
        <span className="text-on-surface-variant font-body text-sm">No media yet</span>
      </div>
    )
  }

  return (
    <div
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-container-low cursor-pointer"
      onClick={() => setPlaying(true)}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${project.youtubeId}?autoplay=1`}
          title={project.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      ) : (
        <>
          {!imageLoaded && <div className="absolute inset-0 bg-surface-container animate-pulse" />}
          <Image
            src={imgSrc}
            alt={project.title}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImgSrc(`https://img.youtube.com/vi/${project.youtubeId}/hqdefault.jpg`)
              setImageLoaded(true)
            }}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            priority={priority}
            className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          {imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-on-surface/90 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-surface ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
