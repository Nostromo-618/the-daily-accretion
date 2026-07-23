<script setup lang="ts">
import { useSeo } from '@/composables/useSeo'

useSeo({
  title: 'About',
  description:
    "Learn about The Daily Accretion — why 'Accretion' and what drives this exploration of mind, universe, and everything in between.",
  path: '/about',
  image: '/images/about.webp',
})
</script>

<template>
  <div>
    <header class="page-header">
      <span class="eyebrow"><i class="ph ph-planet" aria-hidden="true"></i> The why</span>
      <h1>About The Daily Accretion</h1>
      <p>The story behind the name — and the impulse behind the writing.</p>
    </header>

    <section class="section" style="padding-top: 0">
      <div class="container">
        <img
          src="/images/about.webp"
          alt="About The Daily Accretion"
          class="about-image"
          v-reveal
        />
        <div class="about-content" v-reveal="120">
          <p>
            Welcome to <span class="about-highlight">The Daily Accretion</span> — a place where
            curious minds explore the universe peacefully and freely.
          </p>
          <h3>Why "Accretion"?</h3>
          <p>
            In astrophysics, accretion refers to the process by which matter accumulates — like how
            black holes grow by pulling in surrounding material. Similarly, I believe that knowledge
            grows through the gradual accumulation of understanding, one article at a time.
          </p>
          <h4>Thanks for joining me on this journey through space and time.</h4>
        </div>
      </div>
    </section>
  </div>
</template>
