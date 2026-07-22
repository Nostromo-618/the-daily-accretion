import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { articles } from './src/data/articles'

// Every route we want pre-rendered to static HTML.
const ssgRoutes = [
  '/',
  '/blog',
  '/random',
  '/about',
  ...articles.map((a) => `/blog/${a.slug}`),
]

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // vite-ssg options
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    // Critical-CSS inlining (beasties) is an optional peer — skip it so the
    // build has zero extra peer requirements and ships the full stylesheet.
    beastiesOptions: false,
    dirStyle: 'nested',
    includedRoutes: () => ssgRoutes,
  },
})
