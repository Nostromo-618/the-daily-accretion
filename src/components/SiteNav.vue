<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  VdDock,
  VdDockItem,
  VdThemeCustomizer,
  VdThemeSwitcher,
  dockOrientationOf,
  useThemePreference,
  useTooltips,
  type DockItemLayout,
  type DockPlacement,
  type DockTint,
} from '@vanduo-oss/vd3'
import { NAV, SITE } from '@/data/site'

const DOCK_STORAGE_KEY = 'tda-site-dock'
const DOCK_SWATCHES = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'cyan',
  'sky',
  'blue',
  'violet',
  'purple',
  'pink',
  'rose',
] as const

const route = useRoute()
const router = useRouter()
const { state: themeState } = useThemePreference()

const VALID_DOCK_TINTS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'violet',
  'pink',
] as const

const currentTint = computed<DockTint>(() => {
  const p = themeState.primary
  if ((VALID_DOCK_TINTS as readonly string[]).includes(p)) {
    return p as DockTint
  }
  if (p === 'cyan') return 'teal'
  if (p === 'sky') return 'blue'
  if (p === 'rose') return 'pink'
  if (p === 'purple') return 'violet'
  return 'blue'
})

type DockExposed = { $el?: unknown }

const getInitialPlacement = (): DockPlacement => {
  if (typeof window === 'undefined') return 'top'
  try {
    const saved = localStorage.getItem(DOCK_STORAGE_KEY) as DockPlacement | null
    if (saved === 'left' || saved === 'right' || saved === 'bottom' || saved === 'top') {
      return saved
    }
  } catch {}
  return 'top'
}

const placement = ref<DockPlacement>(getInitialPlacement())
const dockRoot = ref<HTMLElement | null>(null)
const isNarrow = ref(false)

/** Function ref so dockRoot is the dock's element before useTooltips scans. */
const setDockRef = (inst: unknown): void => {
  const el = (inst as DockExposed | null)?.$el
  dockRoot.value = el instanceof HTMLElement ? el : null
}

const isHorizontalEdge = computed(
  () => dockOrientationOf(placement.value) === 'horizontal',
)

/** Horizontal edges show inline labels when there is room; otherwise icon-only. */
const itemLayout = computed<DockItemLayout>(() =>
  isHorizontalEdge.value && !isNarrow.value ? 'inline' : 'stack',
)

/** Tooltips only make sense on vertical edges, where labels are hidden. */
const showDockTooltips = computed(() => !isNarrow.value && !isHorizontalEdge.value)

const tooltipPlacement = computed(() => {
  switch (placement.value) {
    case 'top':
      return 'bottom'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
    default:
      return 'top'
  }
})

const dockTooltipBind = computed(() =>
  showDockTooltips.value
    ? {
        'data-tooltip-placement': tooltipPlacement.value,
        'data-tooltip-variant': 'dock',
        'data-tooltip-delay': '400',
      }
    : {},
)

/** The swatch fan opens away from the dock edge. */
const fanDirection = computed(() => {
  switch (placement.value) {
    case 'top':
      return 'down'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
    default:
      return 'up'
  }
})

const isActive = (to: string): boolean => {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

const activeId = computed(() => NAV.find((link) => isActive(link.to))?.to ?? '')

const go = (to: string): void => {
  if (route.path === to) return
  void router.push(to)
}

/** VdDockItem does not declare a click emit — navigate via delegation. */
const onDockClick = (event: Event): void => {
  const target = event.target
  if (!(target instanceof Element)) return
  const item = target.closest('.vd-dock-item')
  if (!(item instanceof HTMLElement)) return
  const label = item.getAttribute('aria-label')
  const link = NAV.find((entry) => entry.label === label)
  if (link) go(link.to)
}

const syncDockAttr = (edge: DockPlacement): void => {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-tda-dock', edge)
}

const getResolvedTheme = (): 'dark' | 'light' => {
  if (themeState.theme === 'light' || themeState.theme === 'dark') {
    return themeState.theme
  }
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const syncBinaryTheme = (): void => {
  if (typeof document === 'undefined') return
  const resolved = getResolvedTheme()
  if (document.documentElement.getAttribute('data-theme') !== resolved) {
    document.documentElement.setAttribute('data-theme', resolved)
  }
}

useTooltips(dockRoot, { showDelay: 400 })

watch(placement, (edge) => {
  syncDockAttr(edge)
})

watch(
  () => themeState.theme,
  () => {
    syncBinaryTheme()
  },
  { immediate: true },
)

const narrowQuery = '(max-width: 768px)'
let narrowMql: MediaQueryList | null = null
let themeSchemeMql: MediaQueryList | null = null
let themeSchemeHandler: (() => void) | null = null
let themeObserver: MutationObserver | null = null

onMounted(() => {
  const el = dockRoot.value
  if (el instanceof HTMLElement) {
    el.addEventListener('click', onDockClick)
  }
  syncDockAttr(placement.value)
  syncBinaryTheme()

  if (typeof window === 'undefined') return
  narrowMql = window.matchMedia(narrowQuery)
  isNarrow.value = narrowMql.matches
  narrowMql.addEventListener('change', (event) => {
    isNarrow.value = event.matches
  })

  themeSchemeMql = window.matchMedia('(prefers-color-scheme: dark)')
  themeSchemeHandler = () => {
    if (themeState.theme === 'system') {
      syncBinaryTheme()
    }
  }
  themeSchemeMql.addEventListener('change', themeSchemeHandler)

  themeObserver = new MutationObserver(() => {
    const current = document.documentElement.getAttribute('data-theme')
    if (current !== 'light' && current !== 'dark') {
      syncBinaryTheme()
    }
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
})

onUnmounted(() => {
  const el = dockRoot.value
  if (el instanceof HTMLElement) {
    el.removeEventListener('click', onDockClick)
  }
  narrowMql?.removeEventListener('change', () => {})
  if (themeSchemeMql && themeSchemeHandler) {
    themeSchemeMql.removeEventListener('change', themeSchemeHandler)
  }
  themeObserver?.disconnect()
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-tda-dock')
  }
})
</script>

<template>
  <VdDock
    :ref="setDockRef"
    class="tda-dock"
    v-model:placement="placement"
    position="fixed"
    cycle="edges"
    persist
    :storage-key="DOCK_STORAGE_KEY"
    radius="9999"
    glass="34"
    :tint="currentTint"
    tint-mode="surface"
    :item-layout="itemLayout"
    :label="SITE.name"
  >
    <template #brand>
      <span class="tda-dock-brand">
        <i class="ph-fill ph-planet" aria-hidden="true"></i>
        <span class="tda-dock-brand-label">{{ SITE.name }}</span>
      </span>
    </template>

    <VdDockItem
      v-for="link in NAV"
      :key="link.to"
      :icon="link.icon"
      :label="link.label"
      :active="activeId === link.to"
      :data-tooltip="showDockTooltips ? link.label : undefined"
      v-bind="dockTooltipBind"
    />

    <template #actions>
      <VdThemeSwitcher
        :menu="false"
        :data-tooltip="showDockTooltips ? 'Toggle theme' : undefined"
        v-bind="dockTooltipBind"
      />
      <VdThemeCustomizer
        variant="swatches"
        :swatches="DOCK_SWATCHES"
        :direction="fanDirection"
        :preview="true"
        :data-tooltip="showDockTooltips ? 'Theme color' : undefined"
        v-bind="dockTooltipBind"
      />
    </template>
  </VdDock>
</template>

<style scoped>
.tda-dock-brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.tda-dock-brand i {
  font-size: var(--vd-dock-brand-size, 1.5rem);
  line-height: 1;
  color: var(--vd-color-primary);
}

.tda-dock-brand-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
