import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cctvquotation.com';

  // Public customer-facing routes
  const routes = [
    '',
    '/wizard',
    '/jaipur',
    '/privacy-policy',
    '/terms-of-service'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : (route === '/jaipur' ? 0.9 : 0.8),
  }));

  return routes;
}
