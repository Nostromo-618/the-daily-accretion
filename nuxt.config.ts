// https://nuxt.com/docs/api/configuration/nuxt-config
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

  devServer: {
    port: 3011
  },

  colorMode: {
    preference: 'system'
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2024-11-01',

  app: {
    baseURL: '/'
  },

  nitro: {
    prerender: {
      routes: [
        '/'
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
