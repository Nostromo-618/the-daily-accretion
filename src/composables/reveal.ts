import type { Directive } from 'vue'

// Scroll-reveal directive. The `.reveal` class (opacity:0 → in) is only added on
// the client in `mounted`, so server-rendered HTML ships fully visible — safe
// for SEO crawlers and no-JS fallbacks.
export const reveal: Directive<HTMLElement> = {
  mounted(el, binding) {
    el.classList.add('reveal')
    const delay = Number(binding.value) || 0
    if (delay) el.style.transitionDelay = `${delay}ms`

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            io.unobserve(el)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
  },
}
