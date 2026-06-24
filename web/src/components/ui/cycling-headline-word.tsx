'use client'

import { useState, useRef, useEffect, MouseEvent } from 'react'
import { BRAND_GRADIENT } from '@/common/consts/constants'

const WORD_VARIANTS = ['Made', 'Built', 'Architected', 'Launched']

export const CyclingHeadlineWord = ({
  onWordChange,
  word,
}: {
  onWordChange?: (word: string) => void
  word?: string
}): React.JSX.Element => {
  const ref = useRef<HTMLSpanElement>(null)
  const mounted = useRef(false)
  const [index, setIndex] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [bgPos, setBgPos] = useState(0)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const idx = WORD_VARIANTS.indexOf(word ?? 'Made')
    if (idx === -1 || idx === index) return
    setAnimating(true)
    setTimeout(() => {
      setIndex(idx)
      setAnimating(false)
    }, 200)
    // index intentionally omitted: we only want to react to external word changes,
    // not re-run when the internal index updates mid-animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word])

  const handleClick = () => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      const next = (index + 1) % WORD_VARIANTS.length
      setIndex(next)
      onWordChange?.(WORD_VARIANTS[next])
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
      ref={ref}
      className="cursor-pointer italic select-none"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={onMouseMove}
      style={{
        display: 'inline-block',
        padding: '0.05em 0.15em 0.12em 0.05em',
        backgroundImage: BRAND_GRADIENT,
        backgroundSize: '300% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        animation: hovered ? 'none' : 'gBoost 4s linear infinite',
        backgroundPosition: hovered ? `${bgPos * 3}% center` : undefined,
        filter: animating
          ? 'blur(12px) saturate(0.6) brightness(0.9)'
          : hovered
            ? 'saturate(1.8) brightness(1.15)'
            : 'saturate(0.6) brightness(0.9)',
        opacity: animating ? 0 : 1,
        transition: 'filter 0.3s ease, opacity 0.2s ease',
      }}
    >
      {WORD_VARIANTS[index]}
    </span>
  )
}
