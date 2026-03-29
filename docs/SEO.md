# SEO Configuration

This guide covers SEO setup for migrating from WordPress while preserving rankings.

## SEO Checklist

### Critical (Before Launch)
- [ ] Meta tags component
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] XML Sitemap
- [ ] robots.txt
- [ ] 301 redirects from old URLs
- [ ] JSON-LD structured data
- [ ] Canonical URLs

### Post-Launch
- [ ] Submit sitemap to Google Search Console
- [ ] Verify in Bing Webmaster Tools
- [ ] Monitor for 404 errors
- [ ] Check Core Web Vitals

## URL Structure

Maintain WordPress URL structure:
```
WordPress:  https://jamesmiller.blog/post-slug/
New:        https://your-domain.com/posts/post-slug
```

Set up redirects for the URL change.

## Meta Tags

Every page should have:
```html
<title>Post Title | James Miller Blog</title>
<meta name="description" content="Post excerpt here..." />
<link rel="canonical" href="https://your-domain.com/posts/slug" />
```

## Open Graph Tags

For social sharing:
```html
<meta property="og:title" content="Post Title" />
<meta property="og:description" content="Post excerpt" />
<meta property="og:image" content="https://your-domain.com/cover.jpg" />
<meta property="og:url" content="https://your-domain.com/posts/slug" />
<meta property="og:type" content="article" />
```

## Twitter Cards

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Post Title" />
<meta name="twitter:description" content="Post excerpt" />
<meta name="twitter:image" content="https://your-domain.com/cover.jpg" />
```

## JSON-LD Structured Data

For rich search results:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Post Title",
  "image": "cover-image-url",
  "datePublished": "2023-01-01",
  "dateModified": "2023-01-01",
  "author": {
    "@type": "Person",
    "name": "James Miller"
  }
}
```

## Sitemap

Auto-generated at `/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/posts/post-slug</loc>
    <lastmod>2023-01-01</lastmod>
  </url>
</urlset>
```

## robots.txt

```
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
```

## Redirects (Vercel)

In `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/old-slug/",
      "destination": "/posts/old-slug",
      "permanent": true
    }
  ]
}
```

## Google Search Console Setup

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your new domain
3. Verify ownership (DNS or file)
4. Submit sitemap
5. Monitor indexing

## Monitoring

### Weekly Checks
- Search Console for errors
- 404 pages
- Core Web Vitals
- Indexing status

### Monthly Checks
- Keyword rankings
- Traffic trends
- Backlink profile
