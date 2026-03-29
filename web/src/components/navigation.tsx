"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "@/providers/theme-provider";
import { SearchModal } from "@/components/ui/search-modal";
import { Post } from "@/types/post";
import { ui } from "@/i18n/en";

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posts] = useState<Post[]>([]);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  // Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-50 mx-auto w-[95%] max-w-7xl">
        <nav className="flex items-center justify-between px-6 py-2 rounded-full bg-surface-container-lowest/80 dark:bg-surface-container/80 backdrop-blur-xl shadow-xl shadow-on-surface/5 border border-outline-variant/10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10">
              <img src="/assets/james-miller-blog-logo.png" alt={ui.nav.logoAlt} className="w-10 h-10 rounded-full absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-0" />
              <img src="/assets/james-miller-blog-logo-active.png" alt={ui.nav.logoAlt} className="w-10 h-10 rounded-full absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/" active={isActive("/") && pathname === "/"} showHard>
              {ui.nav.play}
            </NavLink>
            <NavLink href="/projects" active={isActive("/projects")} showHard>
              {ui.nav.work}
            </NavLink>
          </div>

          {/* Actions & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
              aria-label={ui.nav.searchLabel}
            >
              <SearchIcon />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all"
              aria-label={ui.nav.toggleTheme}
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
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
              className={`px-4 py-3 rounded-xl font-headline font-bold transition-colors ${isActive("/") && pathname === "/" ? "bg-secondary-container text-on-secondary-container" : "text-on-surface"}`}
            >
              {ui.nav.play}
            </Link>
            <Link
              href="/projects"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl font-headline font-bold transition-colors ${isActive("/projects") ? "bg-secondary-container text-on-secondary-container" : "text-on-surface"}`}
            >
              {ui.nav.work}
            </Link>
          </div>
        )}
      </header>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        posts={posts}
      />
    </>
  );
}

function NavLink({
  href,
  active,
  children,
  showHard,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  showHard?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`px-4 py-1.5 rounded-full font-semibold transition-colors duration-300 font-headline text-sm inline-flex items-center ${
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
      }`}
    >
      {children}
      {showHard && (
        <span
          className="inline-block overflow-hidden whitespace-nowrap transition-all duration-200 ease-out"
          style={{
            maxWidth: hovered ? "2.5rem" : "0",
            marginLeft: hovered ? "0.2rem" : "0",
            opacity: hovered ? 1 : 0,
          }}
        >
          {ui.nav.hard}
        </span>
      )}
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
