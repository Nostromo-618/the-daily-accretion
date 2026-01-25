// https://nuxt.com/docs/api/configuration/nuxt-config
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'motion-v/nuxt'
  ],

  devtools: {
    enabled: true
  },

  app: {
    baseURL: '/'
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  devServer: {
    port: 3011
  },

  compatibilityDate: '2024-11-01',

  nitro: {
    prerender: {
      routes: [
        '/',
        '/404.html',
        ...readdirSync(join(process.cwd(), 'content/blog'))
          .filter(file => file.endsWith('.md'))
          .map(file => `/blog/${file.replace('.md', '')}`)
      ],
      crawlLinks: true,
      // Ignore admin routes - they are dev-only
      ignore: [
        '/admin',
        '/api/admin'
      ]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
