<script setup lang="ts">
const route = useRoute()

// Get slug from route (e.g., "astronomy-observation-tracker" from "/projects/astronomy-observation-tracker")
const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug

// Guard against null/undefined slugs during SSG
if (!slug || slug === 'null' || slug === 'undefined') {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

// Query all projects and find the one matching the slug
const { data: page } = await useAsyncData(`project-${slug}`, async () => {
  const projects = await queryCollection('projects').all()
  if (!projects) return null
  
  // Find project by matching slug to filename
  const project = projects.find((p: any) => {
    // For 'data' type collections, _id is the full path like 'projects:astronomy-observation-tracker.yml'
    const id = (p as any)._id || ''
    if (id) {
      // Handle format like 'projects:filename.yml' or 'projects/filename.yml'
      const match = id.match(/(?:projects[:/])?([\w-]+)(?:\.ya?ml)?$/)
      if (match && match[1]) {
        return match[1] === slug
      }
    }
    
    // Fallback - compare slugified title
    if (p.title) {
      const titleSlug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return titleSlug === slug
    }
    
    return false
  })
  
  return project || null
})

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project not found',
    fatal: true
  })
}

if (page.value.image) {
  defineOgImage({ url: page.value.image })
}

const title = page.value?.title
const description = page.value?.description

useSeoMeta({
  title,
  description,
  ogDescription: description,
  ogTitle: title
})

const projectLink = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.href
  }
  return ''
})

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatYear = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.getFullYear()
}
</script>

<template>
  <UMain class="mt-20 px-2">
    <UContainer class="relative min-h-screen">
      <UPage v-if="page">
        <ULink
          to="/projects"
          class="text-sm flex items-center gap-1"
        >
          <UIcon name="lucide:chevron-left" />
          Projects
        </ULink>
        <div class="flex flex-col gap-3 mt-8">
          <div class="flex text-xs text-muted items-center justify-center gap-2">
            <span v-if="page.date">
              {{ formatDate(page.date) }}
            </span>
          </div>
          <NuxtImg
            :src="page.image"
            :alt="page.title"
            class="rounded-lg w-full h-[300px] object-cover object-center"
          />
          <h1 class="text-4xl text-center font-medium max-w-3xl mx-auto mt-4">
            {{ page.title }}
          </h1>
          <p class="text-muted text-center max-w-2xl mx-auto">
            {{ page.description }}
          </p>
          <div
            v-if="page.tags && page.tags.length > 0"
            class="flex items-center justify-center gap-2 mt-4 flex-wrap"
          >
            <UBadge
              v-for="tag in page.tags"
              :key="tag"
              color="neutral"
              variant="soft"
            >
              {{ tag }}
            </UBadge>
          </div>
        </div>
        <UPageBody class="max-w-3xl mx-auto">
          <div class="flex items-center justify-end gap-2 text-sm text-muted mt-8">
            <UButton
              size="sm"
              variant="link"
              color="neutral"
              label="Copy link"
              @click="copyToClipboard(projectLink, 'Project link copied to clipboard')"
            />
          </div>
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
</template>

