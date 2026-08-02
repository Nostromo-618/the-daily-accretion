import { ViteSSG } from 'vite-ssg'
import { VanduoVue } from '@vanduo-oss/vd3'
import '@vanduo-oss/vd3/css'
import './styles/site.css'
import App from './App.vue'
import { routes } from './router/routes'
import { reveal } from './composables/reveal'

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL,
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, top: 80, behavior: 'smooth' }
      return { top: 0 }
    },
  },
  ({ app }) => {
    // Lock in the site's brand theme defaults (teal / stone / 0.25 radius /
    // Source Sans). User selections in the theme customizer still persist and
    // win on the client — these are only the first-visit baseline.
    app.use(VanduoVue, {
      themeDefaults: {
        PRIMARY_LIGHT: 'teal',
        PRIMARY_DARK: 'teal',
        NEUTRAL: 'stone',
        RADIUS: '0.25',
        FONT: 'jetbrains-mono',
      },
    })
    app.directive('reveal', reveal)
  },
)
