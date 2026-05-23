'use client'

import { useState, useRef, useEffect, MouseEvent } from 'react'
import { BRAND_GRADIENT } from '@/common/consts/constants'

const WORDS = ['software', 'websites', 'APIs', 'agents', 'infrastructure', 'experiences']

const BEFORE = ['I', 'build']
const AFTER = ['and', 'share', 'what', 'I', 'learn.']

export function HeroCyclingHeading({
  onWordChange,
  word,
}: {
  onWordChange?: (word: string) => void
  word?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const mounted = useRef(false)
  const [wordIdx, setWordIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [bgPos, setBgPos] = useState(0)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const idx = WORDS.indexOf(word ?? 'software')
    if (idx === -1 || idx === wordIdx) return
    setAnimating(true)
    setTimeout(() => {
      setWordIdx(idx)
      setAnimating(false)
    }, 200)
    // wordIdx intentionally omitted: we only want to react to external word changes,
    // not re-run when the internal index updates mid-animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word])

  const handleCycle = () => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      const next = (wordIdx + 1) % WORDS.length
      setWordIdx(next)
      onWordChange?.(WORDS[next])
      setAnimating(false)
    }, 200)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setBgPos(Math.round(((e.clientX - rect.left) / rect.width) * 100))
  }

  return (
    <span
      className="select-none cursor-pointer"
      onClick={handleCycle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={onMouseMove}
    >
      {BEFORE.map((word, i) => (
        <span key={i} className="inline-block mr-[0.25em] text-on-surface">
          {word}
        </span>
      ))}

      <span
        ref={ref}
        className="inline-block italic mr-[0.25em]"
        style={{
          padding: '0.05em 0.15em 0.12em 0.05em',
          backgroundImage: BRAND_GRADIENT,
          backgroundSize: '300% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          backgroundPosition: hovered ? `${bgPos * 3}% center` : undefined,
          animation: hovered ? 'none' : 'gBoost 4s linear infinite',
          filter: animating
            ? 'blur(12px) saturate(0.6) brightness(0.9)'
            : hovered
              ? 'saturate(1.8) brightness(1.15)'
              : 'saturate(0.6) brightness(0.9)',
          opacity: animating ? 0 : 1,
          transition: 'filter 0.3s ease, opacity 0.2s ease',
        }}
      >
        {WORDS[wordIdx]}
      </span>

      {AFTER.map((word, i) => (
        <span
          key={i}
          className={`inline-block text-on-surface ${i < AFTER.length - 1 ? 'mr-[0.25em]' : ''}`}
        >
          {word}
        </span>
      ))}
    </span>
  )
}
