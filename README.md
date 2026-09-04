# The Daily Accretion

> Exploring the mind, universe, and everything in between

A personal blog built with **Vue 3** and [`@vanduo-oss/vd3`](https://www.npmjs.com/package/@vanduo-oss/vd3) — the Vue 3 line of the Vanduo design system. Statically pre-rendered with [vite-ssg](https://github.com/antfu/vite-ssg) so every page ships as real HTML (great for SEO), then hydrates into a fast SPA.

## Live Site

**https://accretion.blog**

## Tech Stack

- [Vue 3](https://vuejs.org) + [Vue Router](https://router.vuejs.org)
- [`@vanduo-oss/vd3`](https://www.npmjs.com/package/@vanduo-oss/vd3) — components, composables, theme layer & tokens
- [Vite](https://vitejs.dev) + [vite-ssg](https://github.com/antfu/vite-ssg) (static pre-render)
- [`@unhead/vue`](https://unhead.unjs.io) — per-page `<title>`, meta, Open Graph & JSON-LD
- Phosphor Icons (bundled with vd3)

## Local Development

```bash
pnpm install
pnpm dev        # start the dev server (http://localhost:5173)
pnpm build      # static build → ./dist
pnpm preview    # preview the production build
```

## Project Structure

```
├── index.html              # Vite entry + no-FOUC theme bootstrap
├── vite.config.ts          # Vite + vite-ssg config (route pre-render list)
├── public/                 # Copied verbatim into dist
│   ├── robots.txt · sitemap.xml · favicon.svg · 404.html
│   ├── images/             # Article + page images
│   └── blog/*.html         # Redirect stubs: old .html URLs → clean URLs
└── src/
    ├── main.ts             # ViteSSG app entry (installs VanduoVue + theme defaults)
    ├── App.vue             # Shell: nav + <RouterView> + footer
    ├── router/routes.ts    # Route table
    ├── data/
    │   ├── site.ts         # Site metadata + nav
    │   └── articles.ts     # All post content (single source of truth)
    ├── components/         # SiteNav, SiteFooter, ArticleCard, StarField
    ├── pages/              # Home, Blog, Random, About, Article, NotFound
    ├── composables/        # useSeo (head/SEO), reveal (scroll-in directive)
    └── styles/site.css     # Cosmic design layer, all on vd3 --vd-* tokens
```

## Adding a New Post

1. Add an entry to the `articles` array in [`src/data/articles.ts`](src/data/articles.ts)
   (set `section: 'blog'` or `'random'`, dates, images, and `bodyHtml`).
2. That's it — the home feed, the Blog/Random lists, the article page, SEO tags,
   and the pre-render route list are all derived from that data. Add the new URL
   to [`public/sitemap.xml`](public/sitemap.xml).

## Theming

Brand defaults (sky / stone / `0.5` radius / Lato) are set once in
[`src/main.ts`](src/main.ts) via `VanduoVue({ themeDefaults })`, and mirrored
pre-hydration in [`index.html`](index.html) to avoid a flash. Visitors can still
change palette, dark/light mode, radius and font via the in-nav theme switcher;
their choices persist in `localStorage`.

## Deployment

Published via **GitHub Pages**. Pushing to `main` runs
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): `pnpm build`,
then upload `./dist` as a Pages artifact and deploy.

## License

Content © 2025-2026 The Daily Accretion
