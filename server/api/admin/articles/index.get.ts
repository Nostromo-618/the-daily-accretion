// List all articles in /content/blog/
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (_event) => {
  // Only allow in development
  if (!import.meta.dev) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin API only available in development'
    })
  }

  const contentDir = join(process.cwd(), 'content', 'blog')

  try {
    const files = await readdir(contentDir)
    const articles = await Promise.all(
      files
        .filter(file => file.endsWith('.md'))
        .map(async (file) => {
          const filePath = join(contentDir, file)
          const stats = await stat(filePath)
          const slug = file.replace('.md', '')

          return {
            slug,
            filename: file,
            modifiedAt: stats.mtime.toISOString()
          }
        })
    )

    return articles.sort((a, b) =>
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
    )
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to list articles'
    })
  }
})
