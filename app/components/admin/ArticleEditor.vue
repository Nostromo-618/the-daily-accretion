<script setup lang="ts">
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

const props = defineProps<{
  article: ArticleData | null
  isNew?: boolean
}>()

const emit = defineEmits<{
  save: [data: { slug: string, frontmatter: ArticleData['frontmatter'], content: string }]
  cancel: []
}>()

// Local state for editing
const slug = ref('')
const title = ref('')
const description = ref('')
const date = ref<string>('')
const minRead = ref(5)
const image = ref('/placeholder-blog.jpg')
const authorName = ref('The Daily Accretion')
const content = ref('')

// Watch for article changes
watch(() => props.article, (newArticle) => {
  if (newArticle) {
    slug.value = newArticle.slug
    title.value = newArticle.frontmatter.title || ''
    description.value = newArticle.frontmatter.description || ''
    date.value = newArticle.frontmatter.date ?? new Date().toISOString().split('T')[0]!
    minRead.value = newArticle.frontmatter.minRead || 5
    image.value = newArticle.frontmatter.image || '/placeholder-blog.jpg'
    authorName.value = newArticle.frontmatter.author?.name || 'The Daily Accretion'
    content.value = newArticle.body
  }
}, { immediate: true })

// For new articles
watch(() => props.isNew, (isNew) => {
  if (isNew) {
    slug.value = ''
    title.value = ''
    description.value = ''
    date.value = new Date().toISOString().split('T')[0]!
    minRead.value = 5
    image.value = '/placeholder-blog.jpg'
    authorName.value = 'The Daily Accretion'
    content.value = ''
  }
}, { immediate: true })

// Generate slug from title
const generateSlug = () => {
  slug.value = title.value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const handleSave = () => {
  emit('save', {
    slug: slug.value,
    frontmatter: {
      title: title.value,
      description: description.value,
      date: date.value,
      minRead: minRead.value,
      image: image.value,
      author: { name: authorName.value }
    },
    content: content.value
  })
}

const isSaveDisabled = computed(() => {
  return !slug.value || !title.value || !content.value
})

// Editor ref for programmatic focus
const editorRef = ref<{ editor: { commands: { focus: () => void } } } | null>(null)

// Focus editor when clicking anywhere in the wrapper
const focusEditor = () => {
  editorRef.value?.editor?.commands?.focus()
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header with actions -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-default">
      <h2 class="text-lg font-semibold">
        {{ isNew ? 'New Article' : 'Edit Article' }}
      </h2>
      <div class="flex gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          @click="emit('cancel')"
        />
        <UButton
          label="Save"
          icon="i-lucide-save"
          color="primary"
          :disabled="isSaveDisabled"
          @click="handleSave"
        />
      </div>
    </div>

    <!-- Editor content -->
    <div class="flex-1 overflow-y-auto px-6 py-5">
      <!-- Frontmatter Section -->
      <div class="mb-6 p-5 rounded-lg bg-muted/30 border border-default">
        <h3 class="text-sm font-semibold mb-5 text-muted">
          Article Metadata
        </h3>

        <!-- Responsive grid: 2 columns on lg+ screens -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
          <!-- Title - full width -->
          <UFormField
            label="Title"
            class="lg:col-span-2"
          >
            <UInput
              v-model="title"
              placeholder="Enter article title..."
              size="lg"
              class="w-full"
              @blur="isNew && generateSlug()"
            />
          </UFormField>

          <!-- Slug - full width -->
          <UFormField
            label="Slug (URL path)"
            class="lg:col-span-2"
          >
            <UInput
              v-model="slug"
              :disabled="!isNew"
              placeholder="article-url-slug"
              class="w-full"
            />
          </UFormField>

          <!-- Description - full width -->
          <UFormField
            label="Description"
            class="lg:col-span-2"
          >
            <UTextarea
              v-model="description"
              placeholder="Brief description of the article..."
              :rows="2"
              class="w-full"
            />
          </UFormField>

          <!-- Date -->
          <UFormField label="Date">
            <UInput
              v-model="date"
              type="date"
              class="w-full"
            />
          </UFormField>

          <!-- Read Time -->
          <UFormField label="Read Time (minutes)">
            <UInput
              v-model.number="minRead"
              type="number"
              min="1"
              class="w-full"
            />
          </UFormField>

          <!-- Cover Image Path -->
          <UFormField label="Cover Image Path">
            <UInput
              v-model="image"
              placeholder="/placeholder-blog.jpg"
              class="w-full"
            />
          </UFormField>

          <!-- Author Name -->
          <UFormField label="Author Name">
            <UInput
              v-model="authorName"
              placeholder="Author name"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>

      <!-- Content Editor -->
      <div class="flex flex-col flex-1">
        <h3 class="text-sm font-semibold mb-3 text-muted">
          Content (Markdown)
        </h3>
        <div
          class="editor-wrapper"
          @click="focusEditor"
        >
          <UEditor
            ref="editorRef"
            v-model="content"
            content-type="markdown"
            placeholder="Start writing your article..."
            class="editor-full-height"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 500px;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.editor-full-height {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
}

/* Force the TipTap/ProseMirror editor to fill the container */
.editor-full-height :deep(.tiptap) {
  flex: 1;
  min-height: 100%;
  padding: 1rem;
}

.editor-full-height :deep(.ProseMirror) {
  min-height: 100%;
  height: 100%;
  outline: none;
}

/* Prose styling for the content */
.editor-full-height :deep(.prose) {
  max-width: none;
  width: 100%;
}
</style>
