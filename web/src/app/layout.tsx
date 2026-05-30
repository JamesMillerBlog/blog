import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, TWITTER_HANDLE } from '@/common/consts/constants'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/providers/theme-provider'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { getAllPosts } from '@/common/utils/posts'
import { Post } from '@/types/post'

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
  icons: {
    icon: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    shortcut: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',
  themeColor: '#00675d',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let posts: Post[] = []
  try {
    posts = await getAllPosts()
  } catch {
    // Graceful fallback when _posts directory or S3 bucket is unavailable (local dev)
    posts = []
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-label antialiased bg-surface text-on-surface">
        <ThemeProvider>
          <div className="min-h-screen">
            <Navigation posts={posts} />
            {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
