type Lang = 'es' | 'en'

interface JsonLdOptions {
  lang: Lang
  url: string
  altUrl: string
  headline: string
  alternativeHeadline: string
  description: string
  datePublished: string
  dateModified: string
  keywords: string[]
  images: string[]
  breadcrumbHome: string
  breadcrumbCurrent: string
  /** Publisher org — only for collabs (e.g. Marily) */
  publisher?: { name: string; url: string }
  /** FAQ items — generates FAQPage schema */
  faq?: readonly { q: string; a: string }[]
  /** Article type — default 'Article' */
  articleType?: 'Article' | 'TechArticle'
  /** Extra 'about' entities */
  about?: Array<Record<string, string>>
  /** Extra fields like proficiencyLevel, dependencies */
  extra?: Record<string, string>
  /** Citation URLs (LinkedIn posts, external sources) */
  citation?: Array<{ '@type': string; name: string; url: string }>
  /** isBasedOn — source material (course, workshop, research) */
  isBasedOn?: Record<string, unknown>
  /** mentions — tools and platforms referenced */
  mentions?: Array<Record<string, string>>
  /** discussionUrl — link to Reddit/HN thread */
  discussionUrl?: string
  /** relatedLink — link to cross-posted article (Dev.to, etc.) */
  relatedLink?: string
}

const PERSON = {
  '@type': 'Person',
  '@id': 'https://santifer.io/#person',
  name: 'Santiago Fernández de Valderrama Aparicio',
  url: 'https://santifer.io',
  jobTitle: 'AI Product Manager',
  sameAs: [
    'https://www.linkedin.com/in/santifer',
    'https://github.com/santifer',
    'https://x.com/santifer',
    'https://dev.to/santifer',
    'https://santifer.substack.com',
    'https://contentdigest.santifer.io',
    'https://www.youtube.com/@santifer_io',
    'https://www.wikidata.org/wiki/Q138710224',
    'https://www.facebook.com/santifer.io/',
    'https://www.producthunt.com/@santifer',
    'https://app.daily.dev/santifer',
  ],
}

const WEBSITE = {
  '@type': 'WebSite',
  '@id': 'https://santifer.io/#website',
  name: 'santifer.io',
  url: 'https://santifer.io',
}

export function buildArticleJsonLd(opts: JsonLdOptions) {
  const inLanguage = opts.lang === 'es' ? 'es' : 'en'

  const graph: Record<string, unknown>[] = [
    {
      '@type': opts.articleType || 'Article',
      '@id': `${opts.url}/#article`,
      headline: opts.headline,
      alternativeHeadline: opts.alternativeHeadline,
      description: opts.description,
      author: { '@id': 'https://santifer.io/#person' },
      ...(opts.publisher ? {
        publisher: {
          '@type': 'Organization',
          name: opts.publisher.name,
          url: opts.publisher.url,
        },
      } : {}),
      datePublished: opts.datePublished,
      dateModified: opts.dateModified,
      keywords: opts.keywords,
      url: opts.url,
      mainEntityOfPage: opts.url,
      image: opts.images,
      inLanguage,
      isPartOf: { '@id': 'https://santifer.io/#website' },
      ...(opts.about ? { about: opts.about } : {}),
      ...(opts.extra || {}),
      ...(opts.citation ? { citation: opts.citation } : {}),
      ...(opts.isBasedOn ? { isBasedOn: opts.isBasedOn } : {}),
      ...(opts.mentions ? { mentions: opts.mentions } : {}),
      ...(opts.discussionUrl ? { discussionUrl: opts.discussionUrl } : {}),
      ...(opts.relatedLink ? { relatedLink: opts.relatedLink } : {}),
      workTranslation: { '@id': `${opts.altUrl}/#article` },
    },
    PERSON,
    WEBSITE,
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: opts.breadcrumbHome, item: 'https://santifer.io' },
        { '@type': 'ListItem', position: 2, name: opts.breadcrumbCurrent, item: opts.url },
      ],
    },
  ]

  if (opts.faq && opts.faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: opts.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    })
  }

  // HowTo schema removed — deprecated by Google Sept 2023

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
