/**
 * Export article content into normalized JSON chunks for RAG indexing.
 *
 * Supports multiple input formats via pluggable parsers:
 *   - i18n TypeScript objects (articles)
 *   - Plaintext (llms.txt)
 *   - Markdown (future)
 *
 * Output: scripts/chunks/{source}.json
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.app.json scripts/export-chunks.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { articleRegistry } from '../src/articles/registry.ts'

// i18n content imports
import { jacoboContent } from '../src/jacobo-i18n.ts'
import { businessOsContent } from '../src/business-os-i18n.ts'
import { n8nContent } from '../src/n8n-i18n.ts'
import { pseoContent } from '../src/pseo-i18n.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const CHUNKS_DIR = resolve(root, 'scripts/chunks')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChunkMetadata {
  article_id: string
  article_slug_en: string
  article_slug_es: string
  section_id: string
  section_anchor: string
  page_path_en: string
  page_path_es: string
  source_file: string
  format: 'i18n' | 'markdown' | 'plaintext'
}

interface Chunk {
  content: string
  metadata: ChunkMetadata
}

// ---------------------------------------------------------------------------
// Keys to EXCLUDE when traversing i18n objects (metadata, navigation, images)
// ---------------------------------------------------------------------------

const EXCLUDE_KEYS = new Set([
  'slug', 'altSlug', 'readingTime', 'date', 'badge', 'seo', 'nav',
  'breadcrumbHome', 'breadcrumbCurrent', 'back',
  'href', 'icon', 'src', 'imgAlt', 'imgTitle', 'image', 'ogImage',
  'kickerLink', 'figcaption', 'importUrl', 'downloadUrl', 'jsonUrl',
  'num', 'emoji', 'kind', 'value',  // metric values, step numbers
  'internalLinks',
])

// ---------------------------------------------------------------------------
// HTML stripping
// ---------------------------------------------------------------------------

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim()
}

// ---------------------------------------------------------------------------
// Recursive text extraction from nested i18n objects
// ---------------------------------------------------------------------------

function extractText(obj: unknown, depth = 0): string {
  if (depth > 10) return '' // safety guard

  if (typeof obj === 'string') {
    return stripHtml(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(item => extractText(item, depth + 1)).filter(Boolean).join('\n')
  }

  if (typeof obj === 'object' && obj !== null) {
    const parts: string[] = []
    for (const [key, value] of Object.entries(obj)) {
      if (EXCLUDE_KEYS.has(key)) continue
      const text = extractText(value, depth + 1)
      if (text) parts.push(text)
    }
    return parts.join('\n')
  }

  return ''
}

// ---------------------------------------------------------------------------
// Parser 1: i18n TypeScript objects
// ---------------------------------------------------------------------------

interface I18nSource {
  articleId: string
  content: Record<string, unknown>
  sourceFile: string
}

const I18N_SOURCES: I18nSource[] = [
  { articleId: 'jacobo', content: jacoboContent as Record<string, unknown>, sourceFile: 'src/jacobo-i18n.ts' },
  { articleId: 'business-os', content: businessOsContent as Record<string, unknown>, sourceFile: 'src/business-os-i18n.ts' },
  { articleId: 'n8n-for-pms', content: n8nContent as Record<string, unknown>, sourceFile: 'src/n8n-i18n.ts' },
  { articleId: 'programmatic-seo', content: pseoContent as Record<string, unknown>, sourceFile: 'src/pseo-i18n.ts' },
]

function parseI18n(source: I18nSource): Chunk[] {
  const article = articleRegistry.find(a => a.id === source.articleId)
  if (!article) {
    console.warn(`  ⚠ Article ${source.articleId} not found in registry, skipping`)
    return []
  }

  const en = source.content.en as Record<string, unknown> | undefined
  if (!en) {
    console.warn(`  ⚠ No .en key found in ${source.sourceFile}, skipping`)
    return []
  }

  const baseMetadata: Omit<ChunkMetadata, 'section_id' | 'section_anchor'> = {
    article_id: source.articleId,
    article_slug_en: `/${article.slugs.en}`,
    article_slug_es: `/${article.slugs.es}`,
    page_path_en: `/${article.slugs.en}`,
    page_path_es: `/${article.slugs.es}`,
    source_file: source.sourceFile,
    format: 'i18n',
  }

  const chunks: Chunk[] = []

  // Extract header + intro as a single "intro" chunk
  const introText = [
    extractText(en.header),
    extractText(en.intro),
    typeof en.tldr === 'string' ? stripHtml(en.tldr) : extractText(en.tldr),
  ].filter(Boolean).join('\n')

  if (introText.trim()) {
    chunks.push({
      content: introText.trim(),
      metadata: { ...baseMetadata, section_id: 'intro', section_anchor: '' },
    })
  }

  // Extract heroMetrics
  if (en.heroMetrics) {
    const metricsText = extractText(en.heroMetrics)
    if (metricsText.trim()) {
      chunks.push({
        content: metricsText.trim(),
        metadata: { ...baseMetadata, section_id: 'metrics', section_anchor: '' },
      })
    }
  }

  // Extract each section
  const sections = en.sections as Record<string, unknown> | undefined
  if (sections && typeof sections === 'object') {
    for (const [sectionKey, sectionValue] of Object.entries(sections)) {
      const text = extractText(sectionValue)
      if (!text.trim()) continue

      // Map camelCase section key to kebab-case anchor
      const anchor = sectionKey.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')

      chunks.push({
        content: text.trim(),
        metadata: {
          ...baseMetadata,
          section_id: sectionKey,
          section_anchor: `#${anchor}`,
        },
      })
    }
  }

  // Also process top-level keys that aren't sections, intro, or header
  const topLevelContentKeys = ['previewCta', 'timeSinks', 'workflow1', 'workflow2']
  for (const key of topLevelContentKeys) {
    if (en[key]) {
      const text = extractText(en[key])
      if (text.trim()) {
        const anchor = key.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
        chunks.push({
          content: text.trim(),
          metadata: {
            ...baseMetadata,
            section_id: key,
            section_anchor: `#${anchor}`,
          },
        })
      }
    }
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Parser 2: Plaintext (llms.txt)
// ---------------------------------------------------------------------------

function parsePlaintext(filePath: string, articleId: string): Chunk[] {
  const fullPath = resolve(root, filePath)
  let content: string
  try {
    content = readFileSync(fullPath, 'utf-8')
  } catch {
    console.warn(`  ⚠ File ${filePath} not found, skipping`)
    return []
  }

  // Split by double newlines or section headers
  const sections = content.split(/\n{2,}/)
  const chunks: Chunk[] = []
  let currentSection = 'general'

  for (const block of sections) {
    const trimmed = block.trim()
    if (!trimmed) continue

    // Detect section headers (lines starting with ## or all caps)
    const headerMatch = trimmed.match(/^##?\s+(.+)/)
    if (headerMatch) {
      currentSection = headerMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }

    chunks.push({
      content: trimmed,
      metadata: {
        article_id: articleId,
        article_slug_en: '',
        article_slug_es: '',
        section_id: currentSection,
        section_anchor: '',
        page_path_en: '/llms.txt',
        page_path_es: '/llms.txt',
        source_file: filePath,
        format: 'plaintext',
      },
    })
  }

  return chunks
}

// ---------------------------------------------------------------------------
// Parser 3: Markdown (for future use)
// ---------------------------------------------------------------------------

function parseMarkdown(content: string, articleId: string, sourceFile: string): Chunk[] {
  // Strip frontmatter
  const body = content.replace(/^---[\s\S]*?---\n/, '')

  const chunks: Chunk[] = []
  let currentH2 = 'general'
  let currentH3 = ''
  let currentText = ''

  for (const line of body.split('\n')) {
    const h2Match = line.match(/^##\s+(.+)/)
    const h3Match = line.match(/^###\s+(.+)/)

    if (h2Match || h3Match) {
      // Flush current text
      if (currentText.trim()) {
        const sectionId = currentH3 || currentH2
        chunks.push({
          content: currentText.trim(),
          metadata: {
            article_id: articleId,
            article_slug_en: '',
            article_slug_es: '',
            section_id: sectionId,
            section_anchor: `#${sectionId}`,
            page_path_en: '',
            page_path_es: '',
            source_file: sourceFile,
            format: 'markdown',
          },
        })
      }
      currentText = ''

      if (h2Match) {
        currentH2 = h2Match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        currentH3 = ''
      } else if (h3Match) {
        currentH3 = h3Match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      }
    }

    currentText += line + '\n'
  }

  // Flush remaining
  if (currentText.trim()) {
    const sectionId = currentH3 || currentH2
    chunks.push({
      content: currentText.trim(),
      metadata: {
        article_id: articleId,
        article_slug_en: '',
        article_slug_es: '',
        section_id: sectionId,
        section_anchor: `#${sectionId}`,
        page_path_en: '',
        page_path_es: '',
        source_file: sourceFile,
        format: 'markdown',
      },
    })
  }

  return chunks
}

// Expose for future use
void parseMarkdown

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('📦 Exporting content chunks for RAG...\n')

  mkdirSync(CHUNKS_DIR, { recursive: true })

  let totalChunks = 0

  // Process i18n sources (only ragReady articles)
  for (const source of I18N_SOURCES) {
    const article = articleRegistry.find(a => a.id === source.articleId)
    if (!article?.ragReady) {
      console.log(`  ⏭  ${source.articleId} — ragReady=false, skipping`)
      continue
    }

    const chunks = parseI18n(source)
    if (chunks.length === 0) continue

    const outPath = resolve(CHUNKS_DIR, `${source.articleId}.json`)
    writeFileSync(outPath, JSON.stringify(chunks, null, 2))
    console.log(`  ✓ ${source.articleId} → ${chunks.length} chunks`)
    totalChunks += chunks.length
  }

  console.log(`\n✅ Total: ${totalChunks} chunks exported to scripts/chunks/`)
}

main()
