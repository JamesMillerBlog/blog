'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root layout error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-on-surface mb-4">
          Something went wrong
        </h1>
        <p className="font-body text-lg text-on-surface-variant mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="inline-block bg-primary text-on-primary font-headline font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-md"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
