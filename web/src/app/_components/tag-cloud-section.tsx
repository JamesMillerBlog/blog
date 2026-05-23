'use client'

import { useRef, useState, useCallback } from 'react'
import { Post } from '@/types/post'
import { ui } from '@/i18n/en'
import { TechIconText } from '@/components/ui/tech-icon-text'

const TAG_EMOJIS: Record<string, string[]> = {
  'Artificial Intelligence': ['🤖', '🧠', '💡', '⚡', '🔮'],
  'Amazon Web Services': ['☁️', '🏗️', '🛰️', '⚙️', '🔧'],
  'Spacial Computing': ['🥽', '🌐', '🎮', '🚀', '🌀'],
  DevOps: ['🐳', '🔗', '🛠️', '🔒', '⚙️'],
  Blockchain: ['₿', '🔗', '💎', '🔐', '🌐'],
  'Front End': ['⚛️', '🎨', '✨', '💻', '🖥️'],
  'Back End': ['🖥️', '⚡', '🗄️', '🔧', '🛰️'],
}

interface Particle {
  id: number
  x: number
  y: number
  icon: string
  tx: number
  ty: number
  rotation: number
  scale: number
}
let pid = 0

type Props = {
  tags: string[]
  posts: Post[]
  selectedTag: string
  onTagSelect: (tag: string) => void
}

export function TagCloudSection({ tags, selectedTag, onTagSelect }: Props) {
  const allTags = ['Everything', ...tags]
  const containerRef = useRef<HTMLDivElement>(null)
  const tagRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [particles, setParticles] = useState<Particle[]>([])
  const [flashingTag, setFlashingTag] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleHeadingClick = useCallback(() => {
    const available = tags.filter((t) => t !== selectedTag)
    const randomTag = available[Math.floor(Math.random() * available.length)]
    onTagSelect(randomTag)

    // Cancel any in-flight timers so rapid clicks don't leave stale state
    if (flashTimer.current) clearTimeout(flashTimer.current)
    if (clearTimer.current) clearTimeout(clearTimer.current)
    setFlashingTag(null)

    flashTimer.current = setTimeout(() => {
      setFlashingTag(randomTag)
      const el = tagRefs.current[randomTag]
      if (!el || !containerRef.current) return
      const elRect = el.getBoundingClientRect()
      const cRect = containerRef.current.getBoundingClientRect()
      const x = elRect.left - cRect.left + elRect.width / 2
      const y = elRect.top - cRect.top + elRect.height / 2
      const emojis = TAG_EMOJIS[randomTag] ?? ['✨']
      const newP: Particle[] = Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * 360 + Math.random() * 15
        const d = 55 + Math.random() * 75
        return {
          id: pid++,
          x,
          y,
          icon: emojis[Math.floor(Math.random() * emojis.length)],
          tx: Math.cos((angle * Math.PI) / 180) * d,
          ty: Math.sin((angle * Math.PI) / 180) * d,
          rotation: (Math.random() - 0.5) * 400,
          scale: 0.8 + Math.random() * 0.8,
        }
      })
      setParticles((p) => [...p, ...newP])
      clearTimer.current = setTimeout(() => {
        setFlashingTag(null)
        setParticles((p) => p.filter((pt) => !newP.find((b) => b.id === pt.id)))
      }, 950)
    }, 150)
  }, [tags, selectedTag, onTagSelect])

  return (
    <section className="mb-16 relative" ref={containerRef}>
      <style>{`
        @keyframes fly {
          0%   { transform: translate(0,0) rotate(0deg) scale(0.2); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(var(--sc)); opacity: 0; }
        }
      `}</style>

      <div className="mb-6">
        <h2 className="font-headline text-xl font-semibold">
          <TechIconText onHeadingClick={handleHeadingClick}>
            {ui.home.tagCloud.heading}
          </TechIconText>
        </h2>
      </div>

      <div className="flex flex-wrap gap-3">
        {allTags.map((tag) => {
          const isSelected = selectedTag === tag
          return (
            <button
              key={tag}
              ref={(el) => {
                tagRefs.current[tag] = el
              }}
              onClick={() => onTagSelect(isSelected && tag !== 'Everything' ? 'Everything' : tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold font-headline transition-colors duration-150 cursor-pointer focus:outline-none ${
                isSelected
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
              } ${flashingTag === tag ? 'scale-110 ring-2 ring-secondary' : ''}`}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            fontSize: '1.3rem',
            lineHeight: 1,
            pointerEvents: 'none',
            ['--tx' as string]: `${p.tx}px`,
            ['--ty' as string]: `${p.ty}px`,
            ['--rot' as string]: `${p.rotation}deg`,
            ['--sc' as string]: String(p.scale),
            animation: 'fly 0.85s cubic-bezier(0.22,1,0.36,1) forwards',
          }}
        >
          {p.icon}
        </span>
      ))}
    </section>
  )
}
