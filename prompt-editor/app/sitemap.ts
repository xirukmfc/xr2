import { MetadataRoute } from 'next'

const BASE_URL = 'https://xr2.uk'

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'ru']
  const lastModified = new Date()

  // Public pages that should be indexed
  const publicPages = [
    '', // home
    '/legal/privacy',
    '/legal/terms',
    '/legal/cookies',
  ]

  const urls: MetadataRoute.Sitemap = []

  // Add localized versions of public pages
  for (const locale of locales) {
    for (const page of publicPages) {
      urls.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified,
        changeFrequency: page === '' ? 'weekly' : 'monthly',
        priority: page === '' ? 1.0 : 0.5,
      })
    }
  }

  // Add documentation site
  urls.push({
    url: 'https://docs.xr2.uk',
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  })

  return urls
}
