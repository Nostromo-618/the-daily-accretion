<script setup lang="ts">
import { useSeo } from '@/composables/useSeo'

useSeo({ title: 'Page not found', description: 'This page has drifted beyond the event horizon.' })
</script>

<template>
  <section class="notfound">
    <div>
      <div class="code">404</div>
      <p>This page has drifted beyond the event horizon.</p>
      <RouterLink to="/" class="vd-btn vd-btn-primary vd-btn-lg">
        <i class="ph ph-house" aria-hidden="true"></i>&nbsp; Back home
      </RouterLink>
    </div>
  </section>
</template>
