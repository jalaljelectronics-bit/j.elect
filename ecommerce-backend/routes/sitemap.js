import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const SITE_URL = 'https://www.jelectronics.store';

router.get('/sitemap.xml', async (req, res) => {
  try {
    const [products, projects, blogPosts, categories] = await Promise.all([
      prisma.product.findMany({ select: { id: true, updatedAt: true } }),
      prisma.project.findMany({ select: { id: true, updatedAt: true } }),
      prisma.blogPost.findMany({
        where: { status: 'Published' },
        select: { id: true, updatedAt: true },
      }),
      prisma.category.findMany({ select: { id: true } }),
    ]);

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/products', priority: '0.9', changefreq: 'daily' },
      { url: '/projects', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.6', changefreq: 'monthly' },
      { url: '/blog', priority: '0.7', changefreq: 'weekly' },
      { url: '/contact', priority: '0.5', changefreq: 'monthly' },
      { url: '/policies', priority: '0.3', changefreq: 'yearly' },
    ];

    const buildUrl = (loc, updatedAt, priority, changefreq) => `
  <url>
    <loc>${SITE_URL}${loc}</loc>${updatedAt ? `
    <lastmod>${new Date(updatedAt).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

    const urls = [
      ...staticPages.map((p) => buildUrl(p.url, null, p.priority, p.changefreq)),
      ...products.map((p) => buildUrl(`/product/${p.id}`, p.updatedAt, '0.8', 'weekly')),
      ...projects.map((p) => buildUrl(`/project/${p.id}`, p.updatedAt, '0.8', 'weekly')),
      ...blogPosts.map((b) => buildUrl(`/blog/${b.id}`, b.updatedAt, '0.7', 'monthly')),
      ...categories.map((c) => buildUrl(`/products?category=${c.id}`, null, '0.6', 'weekly')),
    ].join('');

    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`);
  } catch (err) {
    console.error('Sitemap generation failed:', err);
    res.status(500).send('Failed to generate sitemap');
  }
});

export default router;