<script setup lang="ts">
interface Article {
  slug: string
  filename: string
  modifiedAt: string
}

const props = defineProps<{
  articles: Article[]
  selectedSlug: string | null
}>()

const emit = defineEmits<{
  select: [slug: string]
  create: []
  delete: [slug: string]
}>()

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const articleToDelete = ref<string | null>(null)
const showDeleteModal = ref(false)

const confirmDelete = (slug: string) => {
  articleToDelete.value = slug
  showDeleteModal.value = true
}

const handleDelete = () => {
  if (articleToDelete.value) {
    emit('delete', articleToDelete.value)
    showDeleteModal.value = false
    articleToDelete.value = null
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="p-4 border-b border-default">
      <UButton
        icon="i-lucide-plus"
        label="New Article"
        color="primary"
        block
        @click="emit('create')"
      />
    </div>

    <div class="flex-1 overflow-y-auto">
      <div
        v-for="article in articles"
        :key="article.slug"
        class="p-3 border-b border-default cursor-pointer transition-colors"
        :class="selectedSlug === article.slug ? 'bg-primary/10' : 'hover:bg-muted/50'"
        @click="emit('select', article.slug)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate text-sm">
              {{ article.slug.replace(/-/g, ' ') }}
            </p>
            <p class="text-xs text-muted mt-1">
              {{ formatDate(article.modifiedAt) }}
            </p>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            @click.stop="confirmDelete(article.slug)"
          />
        </div>
      </div>

      <div
        v-if="articles.length === 0"
        class="p-4 text-center text-muted"
      >
        No articles yet
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-alert-triangle" class="text-error" />
              <span class="font-semibold">Delete Article</span>
            </div>
          </template>

          <p>
            Are you sure you want to delete
            <strong>{{ articleToDelete?.replace(/-/g, ' ') }}</strong>?
            This action cannot be undone.
          </p>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                @click="showDeleteModal = false"
              />
              <UButton
                label="Delete"
                color="error"
                @click="handleDelete"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
