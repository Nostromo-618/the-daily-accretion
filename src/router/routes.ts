import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue') },
  { path: '/blog', name: 'blog', component: () => import('@/pages/BlogPage.vue') },
  { path: '/random', name: 'random', component: () => import('@/pages/RandomPage.vue') },
  { path: '/about', name: 'about', component: () => import('@/pages/AboutPage.vue') },
  { path: '/blog/:slug', name: 'article', component: () => import('@/pages/ArticlePage.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFound.vue') },
]
