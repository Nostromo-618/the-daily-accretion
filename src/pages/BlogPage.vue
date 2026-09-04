<script setup lang="ts">
import ArticleCard from '@/components/ArticleCard.vue'
import { bySection } from '@/data/articles'
import { useSeo, abs } from '@/composables/useSeo'

const posts = bySection('blog')

useSeo({
  title: 'Blog',
  description:
    'Latest articles from The Daily Accretion. Exploring AI, consciousness, space, and the curious corners of existence.',
  path: '/blog',
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: abs('/') },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: abs('/blog') },
      ],
    },
  ],
})
</script>

<template>
  <div>
    <header class="page-header">
      <span class="eyebrow"><i class="ph ph-article" aria-hidden="true"></i> Long-form</span>
      <h1>Articles</h1>
      <p>Long-form explorations, thoughts, and musings.</p>
    </header>

    <section class="section" style="padding-top: 0">
      <div class="container">
        <div class="post-grid">
          <ArticleCard v-for="(a, i) in posts" :key="a.slug" v-reveal="i * 90" :article="a" />
        </div>
      </div>
    </section>
  </div>
</template>
