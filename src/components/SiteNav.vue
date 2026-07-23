<script setup lang="ts">
import { useRoute } from 'vue-router'
import { VdNavbar, VdThemeSwitcher } from '@vanduo-oss/vd3'
import { NAV, SITE } from '@/data/site'

const route = useRoute()

const isActive = (to: string): boolean => route.path === to
</script>

<template>
  <VdNavbar variant="glass" position="fixed" class="da-nav">
    <template #brand>
      <RouterLink to="/" class="brand" :aria-label="SITE.name">
        <i class="ph-fill ph-planet brand-mark" aria-hidden="true"></i>
        <span class="brand-name">The Daily Accretion</span>
      </RouterLink>
    </template>

    <ul class="vd-navbar-nav">
      <li v-for="item in NAV" :key="item.to">
        <RouterLink
          :to="item.to"
          class="vd-nav-link"
          :class="{ 'vd-active': isActive(item.to) }"
        >
          {{ item.label }}
        </RouterLink>
      </li>
    </ul>

    <template #actions>
      <div class="nav-actions">
        <VdThemeSwitcher align="end" />
      </div>
    </template>
  </VdNavbar>
</template>
