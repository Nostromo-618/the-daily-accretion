import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const PRIMARY_TABS = ['/', '/blog', '/random', '/about'] as const

export function useSwipeNav() {
  const router = useRouter()
  const route = useRoute()

  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let isSwiping = false

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return

    const target = e.target as HTMLElement | null
    // Avoid triggering page swipe when interacting with specific controls
    if (
      target &&
      target.closest(
        'canvas, input, textarea, select, .vd-slider, pre, code, .vd-dock, .tda-dock',
      )
    ) {
      isSwiping = false
      return
    }

    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    touchStartTime = Date.now()
    isSwiping = true
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!isSwiping || e.changedTouches.length !== 1) return
    isSwiping = false

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY
    const deltaTime = Date.now() - touchStartTime

    // Disambiguate: horizontal swipe must dominate vertical movement
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    const MIN_DISTANCE = 45
    const MAX_TIME = 600

    if (absX >= MIN_DISTANCE && absX > 1.4 * absY && deltaTime <= MAX_TIME) {
      const currentPath = route.path
      const tabIndex = PRIMARY_TABS.indexOf(currentPath as (typeof PRIMARY_TABS)[number])

      if (deltaX < 0) {
        // Swiped LEFT -> go to next tab
        if (tabIndex >= 0 && tabIndex < PRIMARY_TABS.length - 1) {
          void router.push(PRIMARY_TABS[tabIndex + 1])
        }
      } else {
        // Swiped RIGHT -> go to previous tab
        if (tabIndex > 0) {
          void router.push(PRIMARY_TABS[tabIndex - 1])
        } else if (currentPath.startsWith('/blog/')) {
          // Inside an article page: swiping right returns to blog index
          void router.push('/blog')
        }
      }
    }
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
  })
}

