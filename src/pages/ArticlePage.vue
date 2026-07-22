<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getArticle } from '@/data/articles'
import { SITE } from '@/data/site'
import { useSeo } from '@/composables/useSeo'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const article = computed(() => getArticle(slug.value))

const backTo = computed(() => (article.value?.section === 'blog' ? '/blog' : '/random'))
const backLabel = computed(() => (article.value?.section === 'blog' ? 'Back to Blog' : 'Back to Random'))

// SEO (guarded — SSG only renders known slugs, but stay safe on client nav).
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
        image: a.image.startsWith('http') ? a.image : `${SITE.url}${a.image}`,
        datePublished: a.date,
        dateModified: a.date,
        author: { '@type': 'Person', name: SITE.author },
        publisher: { '@type': 'Organization', name: SITE.name },
        mainEntityOfPage: `${SITE.url}/blog/${a.slug}`,
      },
    ],
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
            <span><i class="ph ph-calendar" aria-hidden="true"></i> {{ article.dateLabel }}</span>
            <span><i class="ph ph-clock" aria-hidden="true"></i> {{ article.readTime }}</span>
            <span><i class="ph ph-user" aria-hidden="true"></i> The Daily Accretion</span>
          </div>
        </header>

        <img
          v-if="article.heroImage"
          :src="article.heroImage"
          :alt="article.imageAlt"
          class="article-hero-image"
        />

        <!-- Trusted, authored content -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="article-content" v-html="article.bodyHtml"></div>

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
