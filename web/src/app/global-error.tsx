'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="font-label antialiased bg-surface text-on-surface">
        <main className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-headline text-8xl md:text-9xl font-extrabold text-primary/20 mb-4 select-none">
              500
            </h1>
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-6">
              Something went wrong
            </h2>
            <p className="font-body text-xl text-on-surface-variant mb-12">
              An unexpected error occurred. It has been reported automatically.
            </p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-block bg-primary text-on-primary font-headline font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-md"
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
