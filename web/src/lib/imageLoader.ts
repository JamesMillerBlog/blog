import { ASSETS_BASE_URL } from '@/common/consts/constants'

interface ImageLoaderProps {
  src: string
  width: number
  quality?: number
}

export default function assetImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Absolute URLs (e.g. external images) pass through unchanged
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }

  // In development, serve from local public folder
  if (process.env.NODE_ENV === 'development') {
    return src
  }

  const q = quality ?? 75
  return `${ASSETS_BASE_URL}${src}?w=${width}&q=${q}`
}
