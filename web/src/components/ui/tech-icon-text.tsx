'use client'

import { useState } from 'react'

const charStyle = (i: number, hovered: number | null): React.CSSProperties => {
  if (hovered === null) return {}
  const d = Math.abs(i - hovered)
  if (d === 0) return { transform: 'scale(1.15)', color: 'var(--color-secondary)' }
  if (d === 1) return { transform: 'scale(1.08)', color: 'var(--color-primary)' }
  if (d === 2) return { transform: 'scale(1.03)' }
  return {}
}

export const TechIconText = ({
  children,
  className,
  onHeadingClick,
}: {
  children: string
  className?: string
  onHeadingClick?: () => void
}): React.JSX.Element => {
  const [hoveredChar, setHoveredChar] = useState<number | null>(null)
  const [jumpingWord, setJumpingWord] = useState<number | null>(null)

  const words = children.split(' ')

  const handleWordClick = (wordIdx: number) => {
    setJumpingWord(wordIdx)
    setTimeout(() => setJumpingWord(null), 350)
    onHeadingClick?.()
  }

  // Build a flat char index offset per word so hover tracks across words
  const offsets: number[] = []
  let offset = 0
  for (const word of words) {
    offsets.push(offset)
    offset += word.length
  }

  return (
    <span className={`inline-block select-none ${className ?? ''}`}>
      <style>{`
        @keyframes wordJump {
          0%   { transform: translateY(0)       scale(1);   color: var(--color-on-surface-variant); }
          35%  { transform: translateY(-2px)    scale(1.15); color: var(--color-secondary); }
          100% { transform: translateY(0)       scale(1);   color: var(--color-on-surface-variant); }
        }
      `}</style>

      {words.map((word, wi) => (
        <span key={wi} style={{ display: 'inline' }}>
          <span
            className="inline-block cursor-pointer"
            onClick={() => handleWordClick(wi)}
            style={{ display: 'inline-block' }}
          >
            {word.split('').map((char, ci) => {
              const gi = offsets[wi] + ci
              return (
                <span
                  key={ci}
                  className="inline-block"
                  style={{
                    transformOrigin: 'bottom center',
                    animation: jumpingWord === wi ? `wordJump 0.35s ease-in-out forwards` : 'none',
                    transition:
                      jumpingWord === wi
                        ? 'none'
                        : 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), color 0.15s ease',
                    ...(jumpingWord === wi ? {} : charStyle(gi, hoveredChar)),
                  }}
                  onMouseEnter={() => jumpingWord === null && setHoveredChar(gi)}
                  onMouseLeave={() => setHoveredChar(null)}
                >
                  {char}
                </span>
              )
            })}
          </span>
          {wi < words.length - 1 && <span style={{ display: 'inline-block', width: '0.28em' }} />}
        </span>
      ))}
    </span>
  )
}
