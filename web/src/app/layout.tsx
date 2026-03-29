import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, TWITTER_HANDLE } from '@/common/consts/constants'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/providers/theme-provider'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Creative Technology Blog`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'WebXR',
    'Serverless',
    'AWS',
    'React',
    'Three.js',
    'TypeScript',
    'DevOps',
    'Blockchain',
  ],
  authors: [{ name: 'James Miller', url: SITE_URL }],
  creator: 'James Miller',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    creator: TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon/favicon-96x96.png" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <meta name="theme-color" content="#00675d" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      </head>
      <body className="font-label antialiased bg-surface text-on-surface">
        <ThemeProvider>
          <div className="min-h-screen">
            <Navigation />
            {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
