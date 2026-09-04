<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getArticle } from '@/data/articles'
import { SITE } from '@/data/site'
import { abs, useSeo } from '@/composables/useSeo'
import { withBase } from '@/utils/withBase'
import PendulumPlayground from '@/components/PendulumPlayground.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const article = computed(() => getArticle(slug.value))

const backTo = computed(() => (article.value?.section === 'blog' ? '/blog' : '/random'))
const backLabel = computed(() => (article.value?.section === 'blog' ? 'Back to Blog' : 'Back to Random'))
const hasLeadingHeading = computed(() => article.value?.bodyHtml.trim().startsWith('<h2') ?? false)

// Articles may embed the interactive pendulum playground via this marker.
const PENDULUM_MARKER = '<!-- pendulum-playground -->'
const playgroundParts = computed(() => {
  const body = article.value?.bodyHtml
  if (!body || !body.includes(PENDULUM_MARKER)) return []
  return body.split(PENDULUM_MARKER)
})

// SEO — SSG renders known slugs; client nav to unknown slugs gets noindex.
if (article.value) {
  const a = article.value
  useSeo({
    title: a.title,
    description: a.description,
    path: `/blog/${a.slug}`,
    image: a.image,
    type: 'article',
    publishedTime: a.date,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: a.title,
        description: a.description,
        image: [abs(a.heroImage ?? a.image)],
        datePublished: a.date,
        dateModified: a.date,
        articleSection: a.section,
        author: {
          '@type': 'Person',
          name: SITE.author,
          url: SITE.url,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE.name,
          url: SITE.url,
          logo: {
            '@type': 'ImageObject',
            url: abs(SITE.defaultImage),
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': abs(`/blog/${a.slug}`),
        },
      },
    ],
  })
} else {
  useSeo({
    title: 'Article not found',
    description: 'That article seems to have drifted beyond the event horizon.',
    path: `/blog/${slug.value}`,
    robots: 'noindex, follow',
  })
}

// Reading progress
const progress = ref(0)
const articleEl = ref<HTMLElement | null>(null)

const onScroll = () => {
  const el = articleEl.value
  if (!el) return
  const start = el.offsetTop
  const distance = el.offsetHeight - window.innerHeight
  const scrolled = window.scrollY - start
  const ratio = distance > 0 ? scrolled / distance : 1
  progress.value = Math.min(1, Math.max(0, ratio))
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
const onHeroError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<template>
  <div v-if="article" ref="articleEl">
    <div class="reading-progress" :style="{ '--progress': progress }" aria-hidden="true"></div>

    <article class="article">
      <div class="container">
        <RouterLink :to="backTo" class="back-link">
          <i class="ph ph-arrow-left" aria-hidden="true"></i> {{ backLabel }}
        </RouterLink>

        <header class="article-head">
          <h1>{{ article.title }}</h1>
          <div class="article-meta">
            <time :datetime="article.date">
              <i class="ph ph-calendar" aria-hidden="true"></i> {{ article.dateLabel }}
            </time>
            <span><i class="ph ph-clock" aria-hidden="true"></i> {{ article.readTime }}</span>
            <span><i class="ph ph-user" aria-hidden="true"></i> {{ SITE.author }}</span>
          </div>
        </header>

        <img
          v-if="article.heroImage"
          :src="withBase(article.heroImage)"
          :alt="article.imageAlt"
          class="article-hero-image"
          @error="onHeroError"
        />

        <div
          v-if="playgroundParts.length === 0"
          class="article-content"
          :class="{ 'article-content--no-dropcap': hasLeadingHeading }"
          v-html="article.bodyHtml"
        />

        <div
          v-else
          class="article-content article-content--split"
          :class="{ 'article-content--no-dropcap': hasLeadingHeading }"
        >
          <template v-for="(part, index) in playgroundParts" :key="index">
            <div class="article-part" v-html="part"></div>
            <PendulumPlayground v-if="index < playgroundParts.length - 1" />
          </template>
        </div>

        <div class="article-nav">
          <RouterLink :to="backTo" class="vd-btn vd-btn-ghost-primary">
            <i class="ph ph-arrow-left" aria-hidden="true"></i>&nbsp; {{ backLabel }}
          </RouterLink>
        </div>
      </div>
    </article>
  </div>

  <div v-else class="notfound">
    <div>
      <div class="code">404</div>
      <p>That article seems to have drifted beyond the event horizon.</p>
      <RouterLink to="/blog" class="vd-btn vd-btn-primary">Browse the Blog</RouterLink>
    </div>
  </div>
</template>
