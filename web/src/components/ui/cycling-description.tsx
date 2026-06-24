'use client'

import { useState, useRef, MouseEvent } from 'react'
import { BRAND_GRADIENT } from '@/common/consts/constants'

const FROM_WORDS = [
  'web apps',
  'mobile',
  'the cloud',
  'generative ai',
  'machine learning',
  'custom hardware',
  'printed circuit boards',
  'spatial computing',
  'mixed reality',
  'augmented reality',
]
const TO_WORDS = [
  'computer vision',
  'serverless',
  'machine learning',
  'connected devices',
  'experiential activations',
  'immersive experiences',
  'virtual reality',
  'spatial computing',
]

const WORD_TO_CATEGORY: Record<string, string> = {
  // Web
  serverless: 'Web',
  mobile: 'Web',
  'the cloud': 'Web',
  'web apps': 'Web',
  // Artificial Intelligence
  'large language models': 'Artificial Intelligence',
  'machine learning': 'Artificial Intelligence',
  'computer vision': 'Artificial Intelligence',
  'generative ai': 'Artificial Intelligence',
  // Internet of Things
  'custom hardware': 'Internet of Things',
  'printed circuit boards': 'Internet of Things',
  'connected devices': 'Internet of Things',
  'experiential activations': 'Internet of Things',
  // Extended Reality
  'spatial computing': 'Extended Reality',
  'mixed reality': 'Extended Reality',
  'augmented reality': 'Extended Reality',
  'immersive experiences': 'Extended Reality',
  'virtual reality': 'Extended Reality',
}

// Advance to next index that has a category, avoids a specific word, and avoids the given categories
const nextIndex = (
  words: string[],
  current: number,
  avoidWord: string,
  avoidCategories: string[]
): number => {
  const len = words.length
  // Ideal: has a category, different from avoided ones
  for (let i = 1; i <= len; i++) {
    const next = (current + i) % len
    const word = words[next]
    const cat = WORD_TO_CATEGORY[word]
    if (word !== avoidWord && cat && !avoidCategories.includes(cat)) return next
  }
  // Fallback: at least has a category (relax the avoid-category constraint)
  for (let i = 1; i <= len; i++) {
    const next = (current + i) % len
    const word = words[next]
    if (word !== avoidWord && WORD_TO_CATEGORY[word]) return next
  }
  return (current + 1) % len
}

const CyclingWord = ({
  words,
  index,
  onCycle,
}: {
  words: string[]
  index: number
  onCycle: () => void
}): React.JSX.Element => {
  const ref = useRef<HTMLSpanElement>(null)
  const [animating, setAnimating] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [bgPos, setBgPos] = useState(0)

  const handleClick = () => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      onCycle()
      setAnimating(false)
    }, 200)
  }

  const onMouseMove = (e: MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    setBgPos(Math.round(((e.clientX - rect.left) / rect.width) * 100))
  }

  return (
    <span
      ref={ref}
      className="cursor-pointer select-none relative inline-block"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={onMouseMove}
      style={{ padding: '0.02em 0.04em 0.1em' }}
    >
      <span
        style={{
          fontWeight: 800,
          backgroundImage: BRAND_GRADIENT,
          backgroundSize: '300% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          animation: hovered ? 'none' : 'gBoost 4s linear infinite',
          backgroundPosition: hovered ? `${bgPos * 3}% center` : undefined,
          filter: animating
            ? 'blur(10px) saturate(0.6) brightness(0.9)'
            : hovered
              ? 'saturate(1.8) brightness(1.15)'
              : 'saturate(0.6) brightness(0.9)',
          opacity: animating ? 0 : 1,
          transition: 'filter 0.3s ease, opacity 0.2s ease',
          display: 'inline-block',
        }}
      >
        {words[index]}
      </span>
      <span
        className="absolute bottom-0 inset-x-0"
        style={{
          borderBottom: '2px dashed',
          borderColor: hovered ? '#a02d70' : '#00675d66',
          transition: 'border-color 0.25s ease',
        }}
      />
    </span>
  )
}

export const CyclingDescription = ({
  onCategorySelect,
}: {
  onCategorySelect?: (category: string) => void
}): React.JSX.Element => {
  const [fromIdx, setFromIdx] = useState(0)
  const [toIdx, setToIdx] = useState(0)

  const cycleFrom = () => {
    const toWord = TO_WORDS[toIdx]
    const toCat = WORD_TO_CATEGORY[toWord]
    const fromCat = WORD_TO_CATEGORY[FROM_WORDS[fromIdx]]
    const avoidCats = [fromCat, toCat].filter(Boolean) as string[]
    const next = nextIndex(FROM_WORDS, fromIdx, toWord, avoidCats)
    setFromIdx(next)
    const newCat = WORD_TO_CATEGORY[FROM_WORDS[next]]
    if (newCat) onCategorySelect?.(newCat)
  }

  const cycleTo = () => {
    const fromWord = FROM_WORDS[fromIdx]
    const fromCat = WORD_TO_CATEGORY[fromWord]
    const toCat = WORD_TO_CATEGORY[TO_WORDS[toIdx]]
    const avoidCats = [toCat, fromCat].filter(Boolean) as string[]
    const next = nextIndex(TO_WORDS, toIdx, fromWord, avoidCats)
    setToIdx(next)
    const newCat = WORD_TO_CATEGORY[TO_WORDS[next]]
    if (newCat) onCategorySelect?.(newCat)
  }

  return (
    <p className="text-xl md:text-2xl text-on-surface-variant leading-relaxed mb-4">
      Over a decade of products and experiences
      <br />
      from <CyclingWord words={FROM_WORDS} index={fromIdx} onCycle={cycleFrom} /> to{' '}
      <CyclingWord words={TO_WORDS} index={toIdx} onCycle={cycleTo} />.
    </p>
  )
}
