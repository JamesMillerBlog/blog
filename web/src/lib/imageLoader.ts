import { ASSETS_BASE_URL } from '@/common/consts/constants'

interface ImageLoaderProps {
  src: string
  width: number
  quality?: number
}

export default function assetImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `${src}${src.includes('?') ? '&' : '?'}w=${width}`
  }

  // In development, serve from local public folder
  if (process.env.NODE_ENV === 'development') {
    return `${src}?w=${width}`
  }

  const q = quality ?? 75
  return `${ASSETS_BASE_URL}${src}?w=${width}&q=${q}`
}
