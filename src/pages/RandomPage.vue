<script setup lang="ts">
import ArticleCard from '@/components/ArticleCard.vue'
import { bySection } from '@/data/articles'
import { useSeo } from '@/composables/useSeo'

const posts = bySection('random')

useSeo({
  title: 'Random',
  description:
    "Short random thoughts, asides, and musings that don't fit the main blog — quick sparks and reflections.",
  path: '/random',
})
</script>

<template>
  <div>
    <header class="page-header">
      <span class="eyebrow"><i class="ph ph-sparkle" aria-hidden="true"></i> Off the cuff</span>
      <h1>Random</h1>
      <p>Short thoughts, asides, and little sparks that don't fit the main blog.</p>
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
