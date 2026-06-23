'use client'

import { useEffect, useState } from 'react'

type Heading = {
  id: string
  text: string
  level: 2 | 3 | 4
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function useHeadings() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const container = document.querySelector('.markdown')
    if (!container) return

    const elements = Array.from(container.querySelectorAll('h2, h3, h4')) as HTMLElement[]
    const extracted: Heading[] = elements.map((el) => {
      if (!el.id) el.id = slugify(el.textContent ?? '')
      return {
        id: el.id,
        text: el.textContent ?? '',
        level: el.tagName === 'H2' ? 2 : el.tagName === 'H3' ? 3 : 4,
      }
    })

    const timer = setTimeout(() => setHeadings(extracted), 0)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId((entry.target as HTMLElement).id)
        }
      },
      { rootMargin: '-80px 0px -66% 0px' }
    )
    elements.forEach((el) => observer.observe(el))
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return { headings, activeId }
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ── Sidebar TOC (desktop, xl+) ────────────────────────────────────────────
export function TableOfContents() {
  const { headings, activeId } = useHeadings()
  if (headings.length === 0) return null

  return (
    <nav className="sticky top-28 font-headline text-sm">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">
        On this page
      </p>
      <ul className="space-y-0.5">
        {headings.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => scrollTo(h.id)}
              className={`block w-full py-1 text-left transition-colors duration-150 leading-snug ${
                h.level === 3 ? 'pl-3 text-[0.8rem]' : h.level === 4 ? 'pl-6 text-[0.75rem]' : ''
              } ${
                activeId === h.id
                  ? 'border-l-2 border-primary pl-2 font-bold text-primary'
                  : 'text-on-surface-variant/70 hover:text-on-surface'
              }`}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ── Inline TOC (mobile, below xl) ────────────────────────────────────────
export function InlineTableOfContents() {
  const { headings, activeId } = useHeadings()
  const [open, setOpen] = useState(false)

  if (headings.length === 0) return null

  return (
    <nav className="xl:hidden mb-10 rounded-2xl bg-surface-container-lowest overflow-hidden font-headline">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-sm font-bold text-on-surface"
      >
        <span className="text-xs uppercase tracking-widest text-on-surface-variant/60">
          On this page
        </span>
        <svg
          className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="border-t border-outline-variant/10 px-5 py-3 space-y-0.5">
          {headings.map((h) => (
            <li key={h.id}>
              <button
                onClick={() => {
                  scrollTo(h.id)
                  setOpen(false)
                }}
                className={`block w-full py-1.5 text-left text-sm transition-colors duration-150 leading-snug ${
                  h.level === 3 ? 'pl-4 text-[0.8rem]' : h.level === 4 ? 'pl-8 text-[0.75rem]' : ''
                } ${
                  activeId === h.id
                    ? 'font-bold text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
