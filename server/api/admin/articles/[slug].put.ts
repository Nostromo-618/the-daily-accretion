// Save article content
import { writeFile } from 'node:fs/promises'
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

    const body = await readBody<{
        frontmatter: {
            title: string
            description: string
            date: string
            minRead?: number
            image?: string
            author?: { name: string }
        }
        content: string
    }>(event)

    if (!body.frontmatter || !body.content) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Frontmatter and content are required'
        })
    }

    // Build markdown content with frontmatter
    const frontmatterLines = [
        '---',
        `title: "${body.frontmatter.title}"`,
        `description: ${body.frontmatter.description}`,
        `date: ${body.frontmatter.date}`,
    ]

    if (body.frontmatter.minRead) {
        frontmatterLines.push(`minRead: ${body.frontmatter.minRead}`)
    }

    if (body.frontmatter.image) {
        frontmatterLines.push(`image: ${body.frontmatter.image}`)
    }

    if (body.frontmatter.author?.name) {
        frontmatterLines.push('author:')
        frontmatterLines.push(`  name: ${body.frontmatter.author.name}`)
    }

    frontmatterLines.push('---')

    const markdownContent = frontmatterLines.join('\n') + '\n\n' + body.content

    const filePath = join(process.cwd(), 'content', 'blog', `${slug}.md`)

    try {
        await writeFile(filePath, markdownContent, 'utf-8')
        return { success: true, slug }
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to save article'
        })
    }
})
