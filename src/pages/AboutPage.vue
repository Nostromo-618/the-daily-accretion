<script setup lang="ts">
import { VdBadge } from '@vanduo-oss/vd3'
import { useSeo } from '@/composables/useSeo'
import { withBase } from '@/utils/withBase'

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
          :src="withBase('/images/about.webp')"
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

          <div class="about-sidequest-card" v-reveal="160">
            <div class="sidequest-badge">
              <VdBadge variant="primary" pill>
                <i class="ph ph-game-controller" aria-hidden="true"></i> Side Quest
              </VdBadge>
            </div>
            <h3>Dogfooding vd3 UI</h3>
            <p>
              A fun side quest for this blog is to dogfood and real-world test
              <a href="https://vanduo-oss.github.io/vd3-docs/" target="_blank" rel="noopener noreferrer">
                <strong>vd3 UI</strong>
              </a>
              — a Vue 3 component library &amp; design system being built under the
              <a href="https://github.com/vanduo-oss" target="_blank" rel="noopener noreferrer">
                vanduo-oss
              </a>
              GitHub organization.
            </p>
            <p>
              Every layout, theme customization, and interactive component here helps stress-test and refine the library in production.
            </p>
            <a
              href="https://vanduo-oss.github.io/vd3-docs/"
              target="_blank"
              rel="noopener noreferrer"
              class="vd-btn vd-btn-ghost-primary vd-btn-sm"
            >
              <i class="ph ph-book-open" aria-hidden="true"></i>&nbsp; Explore vd3 Docs &nbsp;<i class="ph ph-arrow-square-out" aria-hidden="true"></i>
            </a>
          </div>

          <h4>Thanks for joining me on this journey through space and time.</h4>
        </div>
      </div>
    </section>
  </div>
</template>
