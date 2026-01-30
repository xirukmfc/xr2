import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
    sitemap: 'https://xr2.uk/sitemap.xml',
  }
}
