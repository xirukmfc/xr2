import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers()
  const host = headersList.get('host') || 'xr2.uk'
  const isRussianDomain = host.includes('xr2.site')
  const baseUrl = isRussianDomain ? 'https://xr2.site' : 'https://xr2.uk'

  const lastModified = new Date()

  // Public pages that should be indexed (root-level, no /en or /ru prefix)
  const publicPages = [
    '', // home
    '/legal/privacy',
    '/legal/terms',
    '/legal/cookies',
  ]

  // Blog pages (both domains)
  const blogPages = [
    '/blog',
    '/blog/n8n-prompt-management',
    '/blog/make-prompt-management',
    '/blog/prompt-versioning',
    '/blog/prompt-ab-testing',
    '/blog/langfuse-alternative',
  ]

  const urls: MetadataRoute.Sitemap = []

  // All pages at root level — locale is handled by middleware rewrite
  for (const page of publicPages) {
    urls.push({
      url: `${baseUrl}${page}`,
      lastModified,
      changeFrequency: page === '' ? 'weekly' : 'monthly',
      priority: page === '' ? 1.0 : 0.5,
    })
  }

  // Blog pages (both domains)
  for (const page of blogPages) {
    urls.push({
      url: `${baseUrl}${page}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: page === '/blog' ? 0.8 : 0.7,
    })
  }

  if (isRussianDomain) {
    // Documentation on xr2.site
    urls.push({
      url: `${baseUrl}/documentation/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  } else {
    // Documentation on docs.xr2.uk
    urls.push({
      url: 'https://docs.xr2.uk',
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  return urls
}
