<script setup lang="ts">
import { NAV, SITE } from '@/data/site'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="da-footer">
    <div class="container footer-inner">
      <div>
        <RouterLink to="/" class="footer-brand">
          <i class="ph-fill ph-planet" aria-hidden="true"></i>
          <span>{{ SITE.name }}</span>
        </RouterLink>
        <p class="footer-tag">
          Knowledge grows the way matter does — by accretion, one article at a time.
        </p>
      </div>

      <nav class="footer-links" aria-label="Footer">
        <RouterLink v-for="item in NAV" :key="item.to" :to="item.to">{{ item.label }}</RouterLink>
      </nav>
    </div>

    <div class="container footer-bottom">
      © {{ year }} {{ SITE.name }} · Exploring the mind, universe &amp; everything in between
    </div>
  </footer>
</template>
