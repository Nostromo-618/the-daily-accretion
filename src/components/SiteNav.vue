<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { VdNavbar, VdThemeSwitcher, VdThemeCustomizer } from '@vanduo-oss/vd3'
import { NAV, SITE } from '@/data/site'

const route = useRoute()
const customizer = ref<InstanceType<typeof VdThemeCustomizer>>()
const triggerBtn = ref<HTMLButtonElement>()

const isActive = (to: string): boolean => route.path === to

const updatePanelPosition = () => {
  if (!triggerBtn.value) return
  const panel = document.querySelector('.vd-theme-customizer-panel') as HTMLElement | null
  if (panel) {
    const rect = triggerBtn.value.getBoundingClientRect()
    const top = rect.bottom + 8
    const right = Math.max(12, window.innerWidth - rect.right)
    panel.style.setProperty('top', `${top}px`, 'important')
    panel.style.setProperty('right', `${right}px`, 'important')
    panel.style.setProperty('left', 'auto', 'important')
  }
}

const toggleCustomizer = () => {
  customizer.value?.toggle()
  requestAnimationFrame(() => {
    updatePanelPosition()
  })
}

onMounted(() => {
  window.addEventListener('resize', updatePanelPosition)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePanelPosition)
})
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
        <button
          ref="triggerBtn"
          type="button"
          class="nav-icon-btn customizer-btn"
          aria-label="Customize theme"
          @click="toggleCustomizer"
        >
          <i class="ph ph-paint-roller" aria-hidden="true"></i>
        </button>
        <VdThemeSwitcher align="end" />
        <VdThemeCustomizer ref="customizer" :show-palette="false" />
      </div>
    </template>
  </VdNavbar>
</template>

