import { MetadataRoute } from 'next'
import { SITE_URL } from '@/common/consts/constants'

export const dynamic = 'force-static'

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
