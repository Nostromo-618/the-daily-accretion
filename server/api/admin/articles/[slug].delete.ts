// Delete an article
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
    // Only allow in development
    if (!import.meta.dev) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Admin API only available in development'
        })
    }

    const slug = getRouterParam(event, 'slug')
    if (!slug) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Slug is required'
        })
    }

    const filePath = join(process.cwd(), 'content', 'blog', `${slug}.md`)

    try {
        await unlink(filePath)
        return { success: true, slug }
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            throw createError({
                statusCode: 404,
                statusMessage: 'Article not found'
            })
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete article'
        })
    }
})
