<script setup lang="ts">
import { useHead } from '@unhead/vue'
import SiteNav from '@/components/SiteNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { SITE } from '@/data/site'

// Baseline head applied on every route (pages layer their own SEO on top).
useHead({
  htmlAttrs: { lang: 'en' },
  meta: [{ name: 'theme-color', content: '#0d9488' }],
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
})

void SITE
</script>

<template>
  <div class="app-shell">
    <a href="#main-content" class="skip-link">Skip to content</a>
    <SiteNav />
    <main id="main-content" class="app-main">
      <RouterView v-slot="{ Component, route }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter />
  </div>
</template>
