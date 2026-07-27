import { useHead } from '@unhead/vue'
import { SITE } from '@/data/site'

export interface SeoInput {
  title?: string
  description?: string
  /** Absolute or root-relative path for this page, e.g. '/blog/ai-bliss'. */
  path?: string
  /** Root-relative or absolute image URL. */
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  /** Defaults to `index, follow`. Pass `noindex, follow` for error pages. */
  robots?: string
  /** Extra JSON-LD structured-data objects. */
  jsonLd?: Record<string, unknown>[]
}

/** Helper to turn any relative path into a fully qualified absolute URL for SEO meta & schema. */
export const abs = (pathOrUrl: string): string => {
  if (!pathOrUrl) return SITE.url
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl

  const siteUrlClean = SITE.url.endsWith('/') ? SITE.url.slice(0, -1) : SITE.url
  const base = import.meta.env.BASE_URL || '/'

  let cleanPath = pathOrUrl
  if (base !== '/' && cleanPath.startsWith(base)) {
    cleanPath = cleanPath.slice(base.length)
  }
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`
  }

  return `${siteUrlClean}${cleanPath}`
}

/** Centralised head management: title, meta, Open Graph, Twitter, canonical, JSON-LD. */
export function useSeo(input: SeoInput = {}) {
  const fullTitle = input.title ? `${input.title} | ${SITE.name}` : SITE.name
  const description = input.description ?? SITE.description
  const canonical = abs(input.path ?? '/')
  const image = abs(input.image ?? SITE.defaultImage)
  const type = input.type ?? 'website'
  const robots = input.robots ?? 'index, follow'

  const scripts = (input.jsonLd ?? []).map((obj) => ({
    type: 'application/ld+json',
    innerHTML: JSON.stringify(obj),
  }))

  useHead({
    title: fullTitle,
    link: [{ rel: 'canonical', href: canonical }],
    meta: [
      { name: 'description', content: description },
      { name: 'author', content: SITE.author },
      { name: 'robots', content: robots },
      // Open Graph
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: SITE.name },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { property: 'og:locale', content: SITE.locale },
      ...(input.publishedTime
        ? [{ property: 'article:published_time', content: input.publishedTime }]
        : []),
      // Twitter
      { name: 'twitter:card', content: SITE.twitter },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:url', content: canonical },
      { name: 'twitter:image', content: image },
    ],
    script: scripts,
  })
}
