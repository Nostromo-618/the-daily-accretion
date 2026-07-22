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
  /** Extra JSON-LD structured-data objects. */
  jsonLd?: Record<string, unknown>[]
}

const abs = (pathOrUrl: string): string =>
  pathOrUrl.startsWith('http') ? pathOrUrl : `${SITE.url}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`

/** Centralised head management: title, meta, Open Graph, Twitter, canonical, JSON-LD. */
export function useSeo(input: SeoInput = {}) {
  const fullTitle = input.title ? `${input.title} | ${SITE.name}` : SITE.name
  const description = input.description ?? SITE.description
  const canonical = abs(input.path ?? '/')
  const image = abs(input.image ?? SITE.defaultImage)
  const type = input.type ?? 'website'

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
      { name: 'robots', content: 'index, follow' },
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
