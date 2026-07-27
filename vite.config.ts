import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { articles } from './src/data/articles'
import { SITE } from './src/data/site'

// Every route we want pre-rendered to static HTML.
const ssgRoutes = [
  '/',
  '/blog',
  '/random',
  '/about',
  ...articles.map((a) => `/blog/${a.slug}`),
]

function generateSeoFiles() {
  const siteUrl = SITE.url.endsWith('/') ? SITE.url.slice(0, -1) : SITE.url

  // 1. Generate Sitemap XML
  const sitemapUrls = [
    { loc: `${siteUrl}/`, lastmod: '2026-02-01', changefreq: 'weekly', priority: '1.0' },
    { loc: `${siteUrl}/blog`, lastmod: '2026-02-01', changefreq: 'weekly', priority: '0.9' },
    { loc: `${siteUrl}/random`, lastmod: '2026-02-01', changefreq: 'weekly', priority: '0.9' },
    { loc: `${siteUrl}/about`, lastmod: '2026-02-01', changefreq: 'monthly', priority: '0.7' },
    ...articles.map((a) => ({
      loc: `${siteUrl}/blog/${a.slug}`,
      lastmod: a.date,
      changefreq: 'monthly',
      priority: '0.8',
    })),
  ]

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

  // 2. Generate RSS Feed XML
  const sortedArticles = [...articles].sort((a, b) => b.date.localeCompare(a.date))
  const rssItems = sortedArticles.map((a) => {
    const pubDate = new Date(a.date).toUTCString()
    return `    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${siteUrl}/blog/${a.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${a.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${a.description}]]></description>
    </item>`
  })

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${SITE.name}]]></title>
    <link>${siteUrl}/</link>
    <description><![CDATA[${SITE.description}]]></description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems.join('\n')}
  </channel>
</rss>`

  const rootDir = process.cwd()
  const publicDir = join(rootDir, 'public')
  writeFileSync(join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8')
  writeFileSync(join(publicDir, 'rss.xml'), rssXml, 'utf-8')

  const distDir = join(rootDir, 'dist')
  if (existsSync(distDir)) {
    writeFileSync(join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8')
    writeFileSync(join(distDir, 'rss.xml'), rssXml, 'utf-8')
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/the-daily-accretion/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // vite-ssg options
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    // Critical-CSS inlining (beasties) is an optional peer — skip it so the
    // build has zero extra peer requirements and ships the full stylesheet.
    beastiesOptions: false,
    dirStyle: 'nested',
    includedRoutes: () => ssgRoutes,
    onFinished() {
      generateSeoFiles()
    },
  },
})
