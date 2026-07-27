<script setup lang="ts">
import { VdBadge } from '@vanduo-oss/vd3'
import type { Article } from '@/data/articles'
import { withBase } from '@/utils/withBase'

defineProps<{ article: Article }>()
</script>

<template>
  <RouterLink :to="`/blog/${article.slug}`" class="post-card">
    <div class="post-card__media">
      <span class="post-card__badge">
        <VdBadge :variant="article.section === 'blog' ? 'primary' : 'info'" pill>
          {{ article.section === 'blog' ? 'Blog' : 'Random' }}
        </VdBadge>
      </span>
      <img :src="withBase(article.image)" :alt="article.imageAlt" loading="lazy" decoding="async" />
    </div>

    <div class="post-card__body">
      <div class="post-card__meta">
        <time :datetime="article.date">
          <i class="ph ph-calendar" aria-hidden="true"></i> {{ article.dateLabel }}
        </time>
        <span><i class="ph ph-clock" aria-hidden="true"></i> {{ article.readTime }}</span>
      </div>
      <h3>{{ article.title }}</h3>
      <p class="post-card__excerpt">{{ article.excerpt }}</p>
      <span class="read-more">Read article <i class="ph ph-arrow-right" aria-hidden="true"></i></span>
    </div>
  </RouterLink>
</template>
