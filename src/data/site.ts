// Global site metadata — single source of truth for SEO + branding.
export const SITE = {
  name: 'The Daily Accretion',
  tagline: 'Exploring the mind, universe, and everything in between',
  description:
    'Exploring the mind, universe, and everything in between. A blog about AI, consciousness, space, and the curious corners of existence.',
  url: 'https://nostromo-618.github.io/the-daily-accretion',
  author: 'The Daily Accretion',
  locale: 'en_US',
  twitter: 'summary_large_image',
  defaultImage: '/images/og-default.jpg',
} as const

export interface NavItem {
  label: string
  to: string
  icon: string
}

export const NAV: NavItem[] = [
  { label: 'Home', to: '/', icon: 'house' },
  { label: 'Blog', to: '/blog', icon: 'article' },
  { label: 'Random', to: '/random', icon: 'sparkle' },
  { label: 'About', to: '/about', icon: 'planet' },
]
