import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.ts',
  },
}

export default withSentryConfig(nextConfig, {
  org: 'james-miller-blog-s4',
  project: 'blog',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
