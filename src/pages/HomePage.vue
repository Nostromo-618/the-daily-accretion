<script setup lang="ts">
import StarField from '@/components/StarField.vue'
import ArticleCard from '@/components/ArticleCard.vue'
import { sortedArticles } from '@/data/articles'
import { SITE } from '@/data/site'
import { useSeo } from '@/composables/useSeo'

const latest = sortedArticles.slice(0, 3)

useSeo({
  path: '/',
  type: 'website',
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: SITE.name,
      description: SITE.description,
      url: SITE.url,
      author: { '@type': 'Person', name: SITE.author },
    },
  ],
})
</script>

<template>
  <div>
    <section class="hero">
      <StarField />
      <div class="hero-orb">
        <i class="ph-fill ph-planet planet" aria-hidden="true"></i>
      </div>
      <h1>The Daily Accretion</h1>
      <p class="lead">Exploring the mind, universe, and everything in between.</p>
      <div class="hero-cta">
        <RouterLink to="/blog" class="vd-btn vd-btn-primary vd-btn-lg">
          <i class="ph ph-article" aria-hidden="true"></i>&nbsp; Read the Blog
        </RouterLink>
        <RouterLink to="/about" class="vd-btn vd-btn-ghost-primary vd-btn-lg">
          About&nbsp; <i class="ph ph-arrow-right" aria-hidden="true"></i>
        </RouterLink>
      </div>
      <a href="#latest" class="scroll-cue" aria-label="Scroll to latest articles">
        <i class="ph ph-caret-down" aria-hidden="true"></i>
      </a>
    </section>

    <section id="latest" class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow"><i class="ph ph-shooting-star" aria-hidden="true"></i> Fresh from the disk</span>
          <h2>Latest articles</h2>
          <p>Recent explorations, thoughts, and musings.</p>
        </div>

        <div class="post-grid">
          <ArticleCard v-for="(a, i) in latest" :key="a.slug" v-reveal="i * 90" :article="a" />
        </div>
      </div>
    </section>
  </div>
</template>
