<script setup lang="ts">
import { computed } from 'vue'

// Deterministic pseudo-random so server render and client hydration match.
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const stars = computed(() =>
  Array.from({ length: 46 }, (_, i) => ({
    cx: +(rand(i + 1) * 100).toFixed(2),
    cy: +(rand(i + 100) * 100).toFixed(2),
    r: +(rand(i + 200) * 1.3 + 0.3).toFixed(2),
    o: +(rand(i + 300) * 0.6 + 0.2).toFixed(2),
    dur: +(rand(i + 400) * 4 + 2.5).toFixed(2),
    delay: +(rand(i + 500) * 4).toFixed(2),
  })),
)
</script>

<template>
  <svg class="starfield" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <circle
      v-for="(s, i) in stars"
      :key="i"
      :cx="s.cx"
      :cy="s.cy"
      :r="s.r"
      fill="var(--vd-color-primary)"
      :style="{ '--o': s.o, animationDuration: s.dur + 's', animationDelay: s.delay + 's' }"
      class="star"
    />
  </svg>
</template>

<style scoped>
.star {
  opacity: var(--o);
  animation-name: twinkle;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}
@keyframes twinkle {
  0%,
  100% {
    opacity: calc(var(--o) * 0.35);
  }
  50% {
    opacity: var(--o);
  }
}
@media (prefers-reduced-motion: reduce) {
  .star {
    animation: none;
  }
}
</style>
