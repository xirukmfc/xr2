import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers()
  const host = headersList.get('host') || 'xr2.uk'
  const baseUrl = host.includes('xr2.site') ? 'https://xr2.site' : 'https://xr2.uk'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/editor/',
          '/prompts/',
          '/analytics/',
          '/api-keys/',
          '/settings/',
          '/logs/',
          '/login/',
          '/share/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
