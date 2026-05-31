'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useTheme } from '@/providers/theme-provider'
import { SearchModal } from '@/components/ui/search-modal'
import type { SearchItem } from '@/types/search'
import { projects } from '@/app/projects/data'
import { ui } from '@/i18n/en'

function buildProjectItems(): SearchItem[] {
  return projects.map((p) => ({
    type: 'project' as const,
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    url: `/projects/#${p.slug}`,
    dateOrYear: p.year,
  }))
}

export function Navigation({ posts = [] }: { posts?: SearchItem[] }) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchKey, setSearchKey] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const allItems = useMemo(() => [...posts, ...buildProjectItems()], [posts])
  const logoRef = useRef<HTMLDivElement>(null)
  const searchIconRef = useRef<HTMLDivElement>(null)
  const themeIconRef = useRef<HTMLDivElement>(null)
  const themeAnimating = useRef(false)
  // Tracks which icon SVG to show — allows mid-animation swap ahead of theme state
  const [iconDark, setIconDark] = useState(false)

  useEffect(() => {
    setIconDark(theme === 'dark')
  }, [theme])

  const triggerLogoAnim = (type: 'hover' | 'click') => {
    const el = logoRef.current
    if (!el) return
    el.style.animation = 'none'
    void el.offsetHeight
    el.style.animation =
      type === 'click' ? 'wobble 0.4s ease forwards' : 'rubberBand 0.35s ease forwards'
  }

  const triggerSearchAnim = (type: 'hover' | 'click') => {
    const el = searchIconRef.current
    if (!el) return
    el.style.animation = 'none'
    void el.offsetHeight
    el.style.animation =
      type === 'click' ? 'searchFound 0.4s ease forwards' : 'searchZoomIn 0.4s ease forwards'
  }

  const handleThemeToggle = () => {
    if (themeAnimating.current) return
    themeAnimating.current = true
    const goingDark = theme === 'light'

    // Icon: sky sweep (sun sets west/right → moon rises east/left, reversed for sunrise)
    const el = themeIconRef.current
    if (el) {
      el.style.animation = 'none'
      void el.offsetHeight
      el.style.animation = goingDark
        ? 'themeSweepRight 0.42s ease forwards, themeSweepLeftIn 0.42s ease forwards'
        : 'themeSweepLeft 0.42s ease forwards, themeSweepRightIn 0.42s ease forwards'
      setTimeout(() => setIconDark(goingDark), 210)
      // Clear animation after it finishes so hover transform isn't blocked by fill-mode
      setTimeout(() => {
        if (themeIconRef.current) themeIconRef.current.style.animation = ''
      }, 440)
    }

    // Page: crossfade by briefly adding transition to all elements while theme class swaps
    document.documentElement.classList.add('theme-transitioning')
    toggleTheme()
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
      themeAnimating.current = false
    }, 320)
  }

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  // Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 mx-auto w-[95%] max-w-7xl">
        <nav className="flex items-center justify-between px-6 py-2 rounded-full bg-surface-container-lowest/60 dark:bg-surface-container/60 backdrop-blur-xl shadow-xl shadow-on-surface/5 border border-outline-variant/10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div
              ref={logoRef}
              className="relative w-10 h-10"
              onMouseEnter={() => triggerLogoAnim('hover')}
              onClick={() => triggerLogoAnim('click')}
            >
              <Image
                src="/assets/james-miller-blog-logo.png"
                alt={ui.nav.logoAlt}
                width={40}
                height={40}
                className="rounded-full absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-0"
              />
              <Image
                src="/assets/james-miller-blog-logo-active.png"
                alt={ui.nav.logoAlt}
                width={40}
                height={40}
                className="rounded-full absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/" active={isActive('/') && pathname === '/'}>
              {ui.nav.posts}
            </NavLink>
            <NavLink href="/projects" active={isActive('/projects')}>
              {ui.nav.projects}
            </NavLink>
          </div>

          {/* Actions & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                triggerSearchAnim('click')
                setSearchKey((k) => k + 1)
                setSearchOpen(true)
              }}
              onMouseEnter={() => triggerSearchAnim('hover')}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors duration-150 focus:outline-none"
              aria-label={ui.nav.searchLabel}
            >
              <div ref={searchIconRef} className="w-5 h-5">
                <SearchIcon />
              </div>
            </button>
            <button
              onClick={handleThemeToggle}
              className="theme-toggle-btn p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
              aria-label={ui.nav.toggleTheme}
            >
              <div ref={themeIconRef} data-theme-icon={iconDark ? 'sun' : 'moon'}>
                {iconDark ? <SunIcon /> : <MoonIcon />}
              </div>
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={ui.nav.toggleMenu}
            >
              <MenuIcon />
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 p-4 bg-surface-container-lowest/95 dark:bg-surface-container/95 backdrop-blur-xl rounded-2xl shadow-xl border border-outline-variant/10 flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl font-headline font-bold transition-colors ${isActive('/') && pathname === '/' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface'}`}
            >
              {ui.nav.posts}
            </Link>
            <Link
              href="/projects"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl font-headline font-bold transition-colors ${isActive('/projects') ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface'}`}
            >
              {ui.nav.projects}
            </Link>
          </div>
        )}
      </header>

      <SearchModal
        key={searchKey}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={allItems}
      />
    </>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full font-semibold transition-colors duration-300 font-headline text-sm inline-flex items-center ${
        active
          ? 'bg-secondary-container text-on-secondary-container'
          : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
      }`}
    >
      {children}
    </Link>
  )
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  )
}
