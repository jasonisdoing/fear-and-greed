import type { MetadataRoute } from 'next';
import { detailPages, siteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ['/', ...detailPages.map((page) => page.path)];

  return pages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'hourly' : 'daily',
    priority: path === '/' ? 1 : 0.8,
  }));
}
