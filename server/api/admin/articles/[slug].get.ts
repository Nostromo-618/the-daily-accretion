// Read a specific article's content
import { readFile } from 'node:fs/promises'
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
        const content = await readFile(filePath, 'utf-8')

        // Parse frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)

        if (frontmatterMatch) {
            const frontmatterRaw = frontmatterMatch[1]
            const body = frontmatterMatch[2]

            // Simple YAML parsing for our known fields
            const frontmatter: Record<string, any> = {}
            const lines = frontmatterRaw.split('\n')
            let currentKey = ''

            for (const line of lines) {
                if (line.match(/^[a-z]+:/i)) {
                    const [key, ...valueParts] = line.split(':')
                    const value = valueParts.join(':').trim()
                    currentKey = key.trim()

                    if (value.startsWith('"') && value.endsWith('"')) {
                        frontmatter[currentKey] = value.slice(1, -1)
                    } else if (value) {
                        frontmatter[currentKey] = value
                    } else {
                        frontmatter[currentKey] = {}
                    }
                } else if (line.startsWith('  ') && currentKey) {
                    // Nested property
                    const [nestedKey, ...valueParts] = line.trim().split(':')
                    const value = valueParts.join(':').trim()
                    if (typeof frontmatter[currentKey] === 'object') {
                        frontmatter[currentKey][nestedKey.trim()] = value
                    }
                }
            }

            return {
                slug,
                frontmatter,
                body: body.trim()
            }
        }

        return {
            slug,
            frontmatter: {},
            body: content.trim()
        }
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            throw createError({
                statusCode: 404,
                statusMessage: 'Article not found'
            })
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to read article'
        })
    }
})
