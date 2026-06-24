'use client'

import { HeroCyclingHeading } from '@/components/ui/hero-cycling-heading'

export const HeroSection = ({
  onWordChange,
  word,
}: {
  onWordChange?: (word: string) => void
  word?: string
}): React.JSX.Element => {
  return (
    <section className="mb-24 pt-32 max-w-3xl">
      <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
        <HeroCyclingHeading onWordChange={onWordChange} word={word} />
      </h1>
    </section>
  )
}
