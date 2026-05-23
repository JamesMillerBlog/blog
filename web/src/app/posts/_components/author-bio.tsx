'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { GithubIcon, TwitterIcon } from 'lucide-react'
import { TWITTER_HANDLE } from '@/common/consts/constants'
import type { Author } from '@/types/author'

type Props = {
  author: Author
}

const ASPECTS = [
  {
    id: 'work',
    heading: (name: string) => name,
    body: 'Creative technologist writing about AI, WebXR, AWS, and the intersection of code and creativity.',
    getImage: (picture: string) => picture,
    imageAlt: (_name: string) => 'Author photo',
  },
  {
    id: 'keith',
    heading: () => 'Keith',
    body: 'Chief Distractions Officer. Fully qualified squirrel chaser. Will beg for your attention, and steal your food.',
    getImage: () => '/assets/keith.jpeg',
    imageAlt: () => 'Keith',
  },
  {
    id: 'location',
    heading: () => 'North Wales, UK',
    body: 'Halfway up a mountain somewhere in North Wales, with surprisingly good broadband.',
    getImage: () => '/assets/north-wales.png',
    imageAlt: () => 'North Wales',
  },
]

export function AuthorBio({ author }: Props) {
  const [idx, setIdx] = useState(0)
  const [nxtIdx, setNxtIdx] = useState(1)
  const [hovered, setHovered] = useState(false)
  // After clicking, hover is locked out until the cursor leaves and re-enters.
  // This naturally covers scrolling — when the image scrolls away from the cursor,
  // mouseleave fires and the lock clears ready for the next hover.
  const [hoverLocked, setHoverLocked] = useState(false)
  const flipRef = useRef<HTMLDivElement>(null)
  const animating = useRef(false)

  const cur = ASPECTS[idx]
  const nxt = ASPECTS[nxtIdx]
  const isHovering = !hoverLocked && hovered

  const handleMouseEnter = () => setHovered(true)

  const handleMouseLeave = () => {
    setHovered(false)
    // Clear the lock on any leave — cursor has moved away so next enter is fresh
    setHoverLocked(false)
  }

  const handleClick = () => {
    if (animating.current) return
    animating.current = true
    setHoverLocked(true)

    const el = flipRef.current
    if (el) {
      el.style.animation = 'none'
      void el.offsetHeight
      el.style.animation = 'authorFlip 0.52s cubic-bezier(0.4,0.2,0.2,1)'
    }

    const nextI = (idx + 1) % ASPECTS.length
    setTimeout(() => setIdx(nextI), 255)
    setTimeout(() => {
      setNxtIdx((nextI + 1) % ASPECTS.length)
      if (flipRef.current) flipRef.current.style.animation = ''
      animating.current = false
    }, 540)
  }

  return (
    <div className="mt-16 flex gap-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8 items-start">
      <style>{`
        @keyframes authorFlip {
          0%   { transform: rotateY(0deg); }
          48%  { transform: rotateY(-90deg); }
          52%  { transform: rotateY(-90deg); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes authorTextIn {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Image slot */}
      <div
        className="relative shrink-0 cursor-pointer"
        style={{ width: 80, height: 80, perspective: 400 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label={`Switch to ${nxt.heading(author.name)}`}
      >
        {/* Underlying image — frozen during animation to prevent flicker */}
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 16 }}>
          <Image
            src={nxt.getImage(author.picture)}
            alt={nxt.imageAlt(author.name)}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Rotating layer — overflow+borderRadius so corners round with the tilt */}
        <div
          ref={flipRef}
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: 16,
            transformOrigin: 'right center',
            backfaceVisibility: 'hidden',
            transform: isHovering ? 'rotateY(-18deg)' : 'rotateY(0deg)',
            transition: 'transform 0.35s ease',
          }}
        >
          <Image
            src={cur.getImage(author.picture)}
            alt={cur.imageAlt(author.name)}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-y-0 right-0 w-4 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, rgba(0,0,0,0.22), transparent)',
              opacity: isHovering ? 1 : 0,
              transition: 'opacity 0.25s ease',
            }}
          />
        </div>
      </div>

      {/* Text — social links always rendered (invisible when not on work) to prevent height jumps */}
      <div key={idx} style={{ animation: 'authorTextIn 0.3s ease forwards' }} className="flex-1">
        <p className="font-headline text-xl font-bold text-on-surface">
          {cur.heading(author.name)}
        </p>
        <p className="font-body mt-2 leading-relaxed text-on-surface-variant">{cur.body}</p>
        <div className={`flex gap-4 mt-4 ${cur.id !== 'work' ? 'invisible' : ''}`}>
          <a
            href={`https://x.com/${TWITTER_HANDLE.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-headline text-primary transition-colors hover:text-secondary"
          >
            <TwitterIcon className="h-4 w-4" />
            {TWITTER_HANDLE}
          </a>
          <a
            href="https://github.com/JamesMillerBlog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-headline text-primary transition-colors hover:text-secondary"
          >
            <GithubIcon className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
