<script setup lang="ts">
import ArticleCard from '@/components/ArticleCard.vue'
import { bySection } from '@/data/articles'
import { useSeo } from '@/composables/useSeo'

const posts = bySection('blog')

useSeo({
  title: 'Blog',
  description:
    'Latest articles from The Daily Accretion. Exploring AI, consciousness, space, and the curious corners of existence.',
  path: '/blog',
})
</script>

<template>
  <div>
    <header class="page-header">
      <span class="eyebrow"><i class="ph ph-article" aria-hidden="true"></i> Long-form</span>
      <h1>Latest Articles</h1>
      <p>Deeper explorations, thoughts, and musings.</p>
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
