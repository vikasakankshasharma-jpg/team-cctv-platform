import { MetadataRoute } from 'next';
import { cityDatabase } from '@/lib/city-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cctvquotation.com';

  const baseRoutes: MetadataRoute.Sitemap = [
    // ── Homepage — highest priority, refreshes often ──────────────────────
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // ── Wizard — conversion funnel entry ─────────────────────────────────
    {
      url: `${baseUrl}/wizard`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // ── Legal pages — rarely change ───────────────────────────────────────
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // ── Dynamically generate city pages ───────────────────────────────────
  const cityRoutes: MetadataRoute.Sitemap = Object.keys(cityDatabase).map(slug => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: slug === 'jaipur' ? 0.95 : 0.8,
  }));

  // ── Programmatic Local SEO landing pages ──────────────────────────────
  const seoRoutes: MetadataRoute.Sitemap = [];
  const cities = ['jaipur', 'jodhpur', 'kota', 'ajmer'];
  const seoPermutations = [
    { prefix: 'cctv-quotation', priority: 0.8 },
    { prefix: 'cp-plus-camera-installation', priority: 0.85 },
    { prefix: 'cp-plus-cctv-quotation', priority: 0.8 },
    { prefix: 'hikvision-cctv-installation', priority: 0.85 },
    { prefix: 'hikvision-cctv-quotation', priority: 0.8 },
  ];

  cities.forEach(city => {
    seoPermutations.forEach(item => {
      seoRoutes.push({
        url: `${baseUrl}/${item.prefix}-in-${city}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: item.priority,
      });
    });
  });

  return [...baseRoutes, ...cityRoutes, ...seoRoutes];
}
