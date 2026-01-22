<script setup lang="ts">
// Only allow access in development
if (!import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

interface Article {
  slug: string
  filename: string
  modifiedAt: string
}

interface ArticleData {
  slug: string
  frontmatter: {
    title?: string
    description?: string
    date?: string
    minRead?: number
    image?: string
    author?: { name?: string }
  }
  body: string
}

// State
const articles = ref<Article[]>([])
const selectedSlug = ref<string | null>(null)
const currentArticle = ref<ArticleData | null>(null)
const isNewArticle = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)

const toast = useToast()

// Fetch articles list
const fetchArticles = async () => {
  try {
    const data = await $fetch<Article[]>('/api/admin/articles')
    articles.value = data
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to load articles',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Fetch single article
const fetchArticle = async (slug: string) => {
  try {
    const data = await $fetch<ArticleData>(`/api/admin/articles/${slug}`)
    currentArticle.value = data
    isNewArticle.value = false
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to load article',
      color: 'error'
    })
  }
}

// Handle article selection
const handleSelect = (slug: string) => {
  selectedSlug.value = slug
  fetchArticle(slug)
}

// Handle new article
const handleCreate = () => {
  selectedSlug.value = null
  currentArticle.value = null
  isNewArticle.value = true
}

// Handle cancel
const handleCancel = () => {
  selectedSlug.value = null
  currentArticle.value = null
  isNewArticle.value = false
}

// Handle save
const handleSave = async (data: { slug: string, frontmatter: ArticleData['frontmatter'], content: string }) => {
  isSaving.value = true
  try {
    await $fetch(`/api/admin/articles/${data.slug}`, {
      method: 'PUT',
      body: {
        frontmatter: data.frontmatter,
        content: data.content
      }
    })

    toast.add({
      title: 'Saved',
      description: 'Article saved successfully',
      color: 'success'
    })

    // Refresh articles list
    await fetchArticles()

    // Select the saved article
    selectedSlug.value = data.slug
    await fetchArticle(data.slug)
    isNewArticle.value = false
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to save article',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

// Handle delete
const handleDelete = async (slug: string) => {
  try {
    await $fetch(`/api/admin/articles/${slug}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Deleted',
      description: 'Article deleted successfully',
      color: 'success'
    })

    // Clear selection if deleted article was selected
    if (selectedSlug.value === slug) {
      selectedSlug.value = null
      currentArticle.value = null
    }

    // Refresh articles list
    await fetchArticles()
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to delete article',
      color: 'error'
    })
  }
}

// Initial load
onMounted(() => {
  fetchArticles()
})

// Use admin layout (full width, no container)
definePageMeta({
  layout: 'admin'
})

// SEO - hide from search engines
useSeoMeta({
  robots: 'noindex, nofollow'
})

useHead({
  title: 'Admin - Article Editor'
})
</script>

<template>
  <div>
    <!-- Header -->
    <header class="border-b border-default bg-muted/30">
      <div class="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/"
            class="text-muted hover:text-default transition-colors"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="size-5"
            />
          </NuxtLink>
          <h1 class="text-lg font-semibold">
            Article Editor
          </h1>
          <UBadge
            color="warning"
            variant="subtle"
            size="sm"
          >
            Development Only
          </UBadge>
        </div>
        <NuxtLink
          to="/blog"
          class="text-sm text-muted hover:text-default transition-colors"
        >
          View Blog →
        </NuxtLink>
      </div>
    </header>

    <!-- Main content -->
    <div class="flex h-[calc(100vh-57px)]">
      <!-- Sidebar -->
      <aside class="w-72 border-r border-default bg-muted/20">
        <AdminArticleList
          v-if="!isLoading"
          :articles="articles"
          :selected-slug="selectedSlug"
          @select="handleSelect"
          @create="handleCreate"
          @delete="handleDelete"
        />
        <div
          v-else
          class="flex items-center justify-center h-full"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="size-6 animate-spin text-muted"
          />
        </div>
      </aside>

      <!-- Editor area -->
      <main class="flex-1 bg-default">
        <AdminArticleEditor
          v-if="currentArticle || isNewArticle"
          :article="currentArticle"
          :is-new="isNewArticle"
          @save="handleSave"
          @cancel="handleCancel"
        />
        <div
          v-else
          class="flex flex-col items-center justify-center h-full text-muted"
        >
          <UIcon
            name="i-lucide-file-text"
            class="size-16 mb-4 opacity-50"
          />
          <p class="text-lg">
            Select an article to edit
          </p>
          <p class="text-sm mt-1">
            or create a new one
          </p>
        </div>
      </main>
    </div>
  </div>
</template>
