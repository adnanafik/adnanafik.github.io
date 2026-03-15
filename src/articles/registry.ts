import type { ComponentType } from 'react'

export interface ArticleSeo {
  title: string
  description: string
}

export interface ArticleSeoMeta {
  datePublished: string
  dateModified: string
  keywords: string[]
  articleType: 'Article' | 'TechArticle'
  articleTags: string
  images: string[]
  about: Array<Record<string, string>>
  extra?: Record<string, string>
  citation?: Array<{ '@type': string; name: string; url: string }>
  isBasedOn?: Record<string, unknown>
  mentions?: Array<Record<string, string>>
}

export interface ArticleConfig {
  id: string
  slugs: { es: string; en: string }
  titles: { es: string; en: string }
  seo: { es: ArticleSeo; en: ArticleSeo }
  sectionLabels: { es: Record<string, string>; en: Record<string, string> }
  type: 'collab' | 'case-study' | 'bridge'
  /** Absolute OG image URL for prerender (social cards: LinkedIn, Twitter) */
  ogImage?: string
  /** Hero image path for JSON-LD / GEO (what AI search engines see). Falls back to ogImage if not set. */
  heroImage?: string
  component: () => Promise<{ default: ComponentType<{ lang: 'es' | 'en' }> }>
  /** x-default hreflang slug (defaults to ES slug) */
  xDefaultSlug?: string
  /** Whether this article is ready for RAG indexing (default: false) */
  ragReady?: boolean
  /** SEO metadata for prerender JSON-LD + article meta tags */
  seoMeta?: ArticleSeoMeta
}

export const articleRegistry: ArticleConfig[] = [
  {
    id: 'n8n-for-pms',
    slugs: { es: 'n8n-para-pms', en: 'n8n-for-pms' },
    titles: { es: 'n8n para PMs', en: 'n8n for PMs' },
    seo: {
      es: {
        title: 'n8n para Product Managers: Automatiza con IA',
        description: 'Guía práctica de n8n para PMs: automatiza sprint reports y clasifica feedback con IA. 2 workflows gratis y tutorial.',
      },
      en: {
        title: 'n8n for Product Managers: Automate with AI',
        description: 'Practical n8n cheat sheet for PMs: automate sprint reports and classify feedback with AI. 2 free workflow templates.',
      },
    },
    sectionLabels: {
      es: {
        'time-sinks': 'Tareas que Roban Tiempo',
        'workflow-1': 'Workflow 1',
        'workflow-2': 'Workflow 2',
        'the-pattern': 'El Patrón',
        'get-started': 'Empieza',
        'lessons': 'Lecciones',
        'faq': 'FAQ',
        'import': 'Importar',
        'resources': 'Recursos',
      },
      en: {
        'time-sinks': 'Time Sinks',
        'workflow-1': 'Workflow 1',
        'workflow-2': 'Workflow 2',
        'the-pattern': 'The Pattern',
        'get-started': 'Get Started',
        'lessons': 'Lessons',
        'faq': 'FAQ',
        'import': 'Import',
        'resources': 'Resources',
      },
    },
    type: 'collab',
    ragReady: true,
    ogImage: 'https://santifer.io/workflows/n8n-ai-feedback-classification-workflow.webp',
    heroImage: 'https://santifer.io/workflows/n8n-sprint-report-automation-workflow.webp',
    component: () => import('../N8nForPMs.tsx'),
    seoMeta: {
      datePublished: '2026-02-24',
      dateModified: '2026-03-06',
      keywords: ['n8n', 'product manager', 'automation', 'AI', 'workflow', 'sprint report', 'feedback classification', 'no-code', 'n8n tutorial', 'AI workflow automation'],
      articleType: 'TechArticle',
      articleTags: 'n8n,product manager,automation,AI,workflow,no-code',
      images: ['https://santifer.io/workflows/n8n-sprint-report-automation-workflow.webp', 'https://santifer.io/workflows/n8n-ai-feedback-classification-workflow.webp'],
      about: [
        { '@type': 'SoftwareApplication', name: 'n8n', url: 'https://n8n.io', applicationCategory: 'Workflow Automation' },
        { '@type': 'Thing', name: 'Product Management Automation' },
      ],
      extra: { proficiencyLevel: 'Beginner', dependencies: 'n8n Cloud (free tier), Airtable, Slack' },
      isBasedOn: {
        '@type': 'Course',
        name: 'Masterclass: n8n for PMs',
        provider: { '@type': 'Organization', name: 'Maven', url: 'https://maven.com' },
        url: 'https://maven.com/p/52fc7d/masterclass-n8n-for-p-ms',
      },
      mentions: [
        { '@type': 'SoftwareApplication', name: 'n8n', url: 'https://n8n.io' },
        { '@type': 'SoftwareApplication', name: 'Airtable', url: 'https://airtable.com' },
      ],
    },
  },
  {
    id: 'jacobo',
    slugs: { es: 'agente-ia-jacobo', en: 'ai-agent-jacobo' },
    titles: { es: 'Agente IA Jacobo', en: 'AI Agent Jacobo' },
    seo: {
      es: {
        title: 'Jacobo: Agente IA Omnicanal — 90% Autoservicio',
        description: 'Case study: agente IA omnicanal con sub-agentes, tool calling y orquestación multi-modelo (n8n + ElevenLabs). 90% autoservicio.',
      },
      en: {
        title: 'Jacobo: Multi-Agent AI — 90% Self-Service',
        description: 'Case study: omnichannel AI agent with sub-agents, tool calling & multi-model orchestration (n8n + ElevenLabs). 90% self-service.',
      },
    },
    sectionLabels: {
      es: {
        'the-problem': 'El Problema',
        'architecture': 'Arquitectura',
        'e2e-flows': 'Flujos E2E',
        'main-router': 'Los Dos Cerebros',
        'natural-language-booking': 'Deep Dive: Citas',
        'deep-dive-quotes': 'Deep Dive: Presupuestos',
        'deep-dive-others': 'Deep Dive: Tools',
        'results': 'Resultados',
        'decisions': 'ADRs',
        'platform-evolution': 'Evolución',
        'what-id-do-differently': 'Lecciones',
        'enterprise-patterns': 'Patrones',
        'run-it-yourself': 'Workflows',
        'faq': 'FAQ',
        'resources': 'Recursos',
      },
      en: {
        'the-problem': 'The Problem',
        'architecture': 'Architecture',
        'e2e-flows': 'E2E Flows',
        'main-router': 'The Two Brains',
        'natural-language-booking': 'Deep Dive: Booking',
        'deep-dive-quotes': 'Deep Dive: Quotes',
        'deep-dive-others': 'Deep Dive: Tools',
        'results': 'Results',
        'decisions': 'ADRs',
        'platform-evolution': 'Evolution',
        'what-id-do-differently': 'Lessons',
        'enterprise-patterns': 'Patterns',
        'run-it-yourself': 'Workflows',
        'faq': 'FAQ',
        'resources': 'Resources',
      },
    },
    type: 'case-study',
    ragReady: true,
    ogImage: 'https://santifer.io/jacobo/og-jacobo-agent.webp',
    heroImage: 'https://santifer.io/jacobo/santiago-headphones-thinking.webp',
    component: () => import('../JacoboAgent.tsx'),
    seoMeta: {
      datePublished: '2026-02-25',
      dateModified: '2026-03-07',
      keywords: ['multi-agent AI', 'multi agent orchestration', 'AI agent', 'sub-agent architecture', 'tool calling production', 'n8n workflows', 'n8n ai agent', 'ai agent case study', 'customer service AI', 'WhatsApp AI agent', 'ElevenLabs voice agent', 'voice AI', 'HITL', 'human in the loop', 'ia para pymes', 'agente ia whatsapp', 'multi-model orchestration', 'OpenRouter', 'FDE portfolio', 'solutions architect AI', 'AI production manager', 'enterprise AI patterns', 'voice AI platform', 'conversational AI case study', 'agentic workflows'],
      articleType: 'TechArticle',
      articleTags: 'AI agent,multi-agent,n8n,ElevenLabs,HITL,tool calling,WhatsApp,voice AI',
      images: ['https://santifer.io/jacobo/og-jacobo-agent.webp'],
      about: [
        { '@type': 'SoftwareApplication', name: 'n8n', url: 'https://n8n.io', applicationCategory: 'Workflow Automation' },
        { '@type': 'SoftwareApplication', name: 'ElevenLabs', url: 'https://elevenlabs.io', applicationCategory: 'Voice AI' },
        { '@type': 'Thing', name: 'Multi-Agent Orchestration' },
        { '@type': 'Thing', name: 'AI Customer Service' },
      ],
      extra: { proficiencyLevel: 'Expert', dependencies: 'n8n, OpenRouter, ElevenLabs, WATI, Airtable, Aircall, YouCanBookMe' },
    },
  },
  {
    id: 'business-os',
    slugs: { es: 'business-os-para-airtable', en: 'business-os-for-airtable' },
    titles: { es: 'Business OS', en: 'Business OS' },
    seo: {
      es: {
        title: 'Business OS Custom: Airtable + n8n — 170h/Mes',
        description: 'Case study: Business OS custom con 12 bases Airtable, 2100 campos y n8n que ahorra 170h/mes en reparación de móviles.',
      },
      en: {
        title: 'Custom Business OS: Airtable + n8n — 170h/Mo',
        description: 'Case study: custom Business OS with 12 Airtable bases, 2100 fields, and n8n saving 170h/month at a phone repair business.',
      },
    },
    sectionLabels: {
      es: {
        'why-custom': '¿Por Qué Custom?',
        'overview': 'Vista General',
        'e2e-flows': 'Flujos E2E',
        'cross-cutting': 'Transversales',
        'day-in-life': 'Un Día',
        'before-after': 'Antes/Después',
        'impact': 'Impacto',
        'decisions': 'ADRs',
        'platform-evolution': 'Evolución',
        'lessons': 'Lecciones',
        'replicability': 'Patrones',
        'faq': 'FAQ',
        'resources': 'Recursos',
      },
      en: {
        'why-custom': 'Why Custom?',
        'overview': 'Overview',
        'e2e-flows': 'E2E Flows',
        'cross-cutting': 'Cross-Cutting',
        'day-in-life': 'A Day',
        'before-after': 'Before/After',
        'impact': 'Impact',
        'decisions': 'ADRs',
        'platform-evolution': 'Evolution',
        'lessons': 'Lessons',
        'replicability': 'Patterns',
        'faq': 'FAQ',
        'resources': 'Resources',
      },
    },
    type: 'case-study',
    ragReady: true,
    ogImage: 'https://santifer.io/business-os/og-business-os.webp',
    heroImage: 'https://santifer.io/business-os/web-landing-hero.webp',
    component: () => import('../BusinessOS.tsx'),
    seoMeta: {
      datePublished: '2026-02-25',
      dateModified: '2026-03-06',
      keywords: ['Business OS', 'Airtable ERP', 'Airtable as ERP', 'no-code ERP', 'Airtable automation', 'CRM gamification', 'phone repair', 'inventory management', 'custom ERP case study', 'repair shop management', 'programmatic SEO', 'Airtable CRM', 'single source of truth', 'business operating system', 'multi-base architecture'],
      articleType: 'TechArticle',
      articleTags: 'Business OS,Airtable,n8n,ERP,CRM,automation,phone repair',
      images: ['https://santifer.io/business-os/og-business-os.webp'],
      about: [
        { '@type': 'SoftwareApplication', name: 'Airtable', url: 'https://airtable.com', applicationCategory: 'Database Platform' },
        { '@type': 'SoftwareApplication', name: 'n8n', url: 'https://n8n.io', applicationCategory: 'Workflow Automation' },
        { '@type': 'Thing', name: 'Enterprise Resource Planning' },
        { '@type': 'Thing', name: 'Business Process Automation' },
      ],
      extra: { proficiencyLevel: 'Advanced', dependencies: 'Airtable Pro, n8n, YouCanBookMe, WATI (WhatsApp API), DataForSEO' },
    },
  },
  {
    id: 'programmatic-seo',
    slugs: { es: 'seo-programatico', en: 'programmatic-seo' },
    titles: { es: 'SEO Programático', en: 'Programmatic SEO' },
    seo: {
      es: {
        title: 'SEO Programático: 4.000+ Páginas desde un ERP | santifer.io',
        description: 'Case study: cómo generé 4.730 landing pages estáticas con Airtable, DataForSEO y crawl budget optimization. 2M+ impresiones, 19K+ clicks.',
      },
      en: {
        title: 'Programmatic SEO: 4,000+ Pages from an ERP | santifer.io',
        description: 'Case study: 4,730 static landing pages from Airtable as headless CMS with DataForSEO crawl budget optimization and Astro SSG. 2M+ impressions, 19K+ clicks.',
      },
    },
    sectionLabels: {
      es: {
        'opportunity': 'La Oportunidad',
        'the-numbers': 'Los Números',
        'two-strategies': 'Dos Estrategias',
        'architecture': 'La Arquitectura',
        'url-taxonomy': 'Taxonomía URLs',
        'cms-deep-dive': 'El CMS',
        'page-anatomy': 'Anatomía de Página',
        'decision-engine': 'Motor de Decisión',
        'crawl-budget': 'Crawl Budget',
        'pipeline': 'Pipeline',
        'content-automation': 'Automatización',
        'image-pipeline': 'Pipeline de Imágenes',
        'reviews-pipeline': 'Pipeline de Reseñas',
        'before-after-pipeline': 'Pipeline Antes/Después',
        'growth': 'Crecimiento',
        'results': 'Resultados',
        'starting-point': 'El Punto de Partida',
        'stack': 'Stack',
        'lessons': 'Lecciones',
        'faq': 'FAQ',
        'resources': 'Recursos',
      },
      en: {
        'opportunity': 'The Opportunity',
        'the-numbers': 'The Numbers',
        'two-strategies': 'Two Strategies',
        'architecture': 'The Architecture',
        'url-taxonomy': 'URL Taxonomy',
        'cms-deep-dive': 'The CMS',
        'page-anatomy': 'Page Anatomy',
        'decision-engine': 'Decision Engine',
        'crawl-budget': 'Crawl Budget',
        'pipeline': 'Pipeline',
        'content-automation': 'Automation',
        'image-pipeline': 'Image Pipeline',
        'reviews-pipeline': 'Reviews Pipeline',
        'before-after-pipeline': 'Before/After Pipeline',
        'growth': 'Growth',
        'results': 'Results',
        'starting-point': 'The Starting Point',
        'stack': 'Stack',
        'lessons': 'Lessons',
        'faq': 'FAQ',
        'resources': 'Resources',
      },
    },
    type: 'case-study',
    ragReady: true,
    ogImage: 'https://santifer.io/pseo/og-programmatic-seo.png',
    heroImage: 'https://santifer.io/pseo/ss-repair-page-hero.webp',
    component: () => import('../ProgrammaticSeo.tsx'),
    seoMeta: {
      datePublished: '2026-02-25',
      dateModified: '2026-03-10',
      keywords: ['programmatic SEO', 'Airtable', 'headless CMS', 'Astro', 'DataForSEO', 'crawl budget', 'phone repair', 'static site generation', 'local SEO', 'ERP'],
      articleType: 'TechArticle',
      articleTags: 'programmatic SEO,Airtable,Astro,DataForSEO,crawl budget,phone repair,ERP,local SEO',
      images: ['https://santifer.io/pseo/og-programmatic-seo.png'],
      about: [
        { '@type': 'SoftwareApplication', name: 'Airtable', url: 'https://airtable.com', applicationCategory: 'Database Platform' },
        { '@type': 'SoftwareApplication', name: 'Astro', url: 'https://astro.build', applicationCategory: 'Static Site Generator' },
        { '@type': 'SoftwareApplication', name: 'DataForSEO', url: 'https://dataforseo.com', applicationCategory: 'SEO Data API' },
      ],
      extra: { proficiencyLevel: 'Intermediate', dependencies: 'Airtable, Astro, DataForSEO API, Node.js' },
    },
  },
  {
    id: 'self-healing-chatbot',
    slugs: { es: 'chatbot-que-se-cura-solo', en: 'self-healing-chatbot' },
    titles: { es: 'El Chatbot Que Se Cura Solo', en: 'The Self-Healing Chatbot' },
    seo: {
      es: {
        title: 'El Chatbot Que Se Cura Solo: De Widget a LLMOps en Producción',
        description: 'Case study: cómo evolucioné un chatbot de 50 líneas a un sistema LLMOps con RAG agéntico, defensa de jailbreak en 6 capas, 71 evals y closed-loop automático.',
      },
      en: {
        title: 'The Self-Healing Chatbot: From Widget to Production LLMOps',
        description: 'Case study: production LLMOps with agentic observability, 6-layer defense, 71 evals, voice mode, and a closed-loop that generates tests from real failures.',
      },
    },
    sectionLabels: {
      es: {
        'genesis': 'La Génesis',
        'evolution': 'La Evolución',
        'architecture': 'Arquitectura',
        'how-it-was-built': 'Cómo Se Construyó',
        'rag': 'RAG Agéntico',
        'defense': 'Defensa',
        'agentic-observability': 'Observabilidad Agéntica',
        'evals': 'Los 71 Tests',
        'closed-loop': 'El Loop Cerrado',
        'cost': 'Coste Real',
        'voice': 'Modo Voz',
        'lessons': 'Lecciones',
        'faq': 'FAQ',
      },
      en: {
        'genesis': 'The Genesis',
        'evolution': 'The Evolution',
        'architecture': 'Architecture',
        'how-it-was-built': 'How It Was Built',
        'rag': 'Agentic RAG',
        'defense': 'Defense',
        'agentic-observability': 'Agentic Observability',
        'evals': 'The 71 Tests',
        'closed-loop': 'The Closed Loop',
        'cost': 'Real Cost',
        'voice': 'Voice Mode',
        'lessons': 'Lessons',
        'faq': 'FAQ',
      },
    },
    type: 'case-study',
    ragReady: true,
    ogImage: 'https://santifer.io/chatbot/og-self-healing-chatbot.webp',
    heroImage: 'https://santifer.io/chatbot/hero-self-healing-chatbot.webp',
    component: () => import('../SelfHealingChatbot.tsx'),
    seoMeta: {
      datePublished: '2026-03-11',
      dateModified: '2026-03-14',
      keywords: ['LLMOps', 'self-healing chatbot', 'agentic RAG', 'jailbreak defense', 'prompt injection', 'LLM evaluation', 'closed loop LLM', 'Langfuse', 'prompt versioning', 'adversarial testing', 'trace-to-eval', 'hybrid search pgvector', 'AI portfolio', 'chatbot evals', 'CI gate LLM', 'voice mode chatbot', 'OpenAI Realtime API', 'speech-to-speech AI', 'agentic observability', 'developer feedback loop', 'AI maintaining AI'],
      articleType: 'TechArticle',
      articleTags: 'LLMOps,self-healing chatbot,agentic RAG,jailbreak defense,Langfuse,evals,closed-loop,prompt injection',
      images: ['https://santifer.io/chatbot/og-self-healing-chatbot.webp'],
      about: [
        { '@type': 'SoftwareApplication', name: 'Langfuse', url: 'https://langfuse.com', applicationCategory: 'LLM Observability' },
        { '@type': 'SoftwareApplication', name: 'Supabase', url: 'https://supabase.com', applicationCategory: 'Database' },
        { '@type': 'Thing', name: 'LLMOps' },
        { '@type': 'Thing', name: 'Retrieval-Augmented Generation' },
      ],
      extra: { proficiencyLevel: 'Expert', dependencies: 'Claude, Langfuse, Supabase, Vercel, OpenAI, Resend, GitHub Actions' },
      citation: [
        { '@type': 'SocialMediaPosting', name: 'Han hackeado a mi chatbot — LinkedIn post (300+ reactions)', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7421984735024816128/' },
      ],
      mentions: [
        { '@type': 'SoftwareApplication', name: 'Langfuse', url: 'https://langfuse.com' },
        { '@type': 'SoftwareApplication', name: 'Supabase', url: 'https://supabase.com' },
        { '@type': 'SoftwareApplication', name: 'OpenAI Realtime API', url: 'https://platform.openai.com' },
        { '@type': 'SoftwareApplication', name: 'Claude Code', url: 'https://claude.ai' },
        { '@type': 'SoftwareApplication', name: 'Vercel', url: 'https://vercel.com' },
      ],
    },
  },
  {
    id: 'santifer-irepair',
    slugs: { es: 'santifer-irepair', en: 'santifer-irepair-founder' },
    titles: { es: 'Santifer iRepair', en: 'Santifer iRepair' },
    seo: {
      es: {
        title: 'Santifer iRepair Sevilla | Reparación de Móviles desde 2009',
        description: 'La tienda de reparación de móviles fundada por Santiago en 2009 sigue abierta en Sevilla. 30.000+ reparaciones. Encuentra la tienda o conoce al fundador.',
      },
      en: {
        title: 'Santifer iRepair Seville | Phone Repair since 2009',
        description: 'The phone repair shop founded by Santiago in 2009 is still open in Seville, Spain. 30,000+ repairs. Find the shop or meet the founder.',
      },
    },
    sectionLabels: { es: {}, en: {} },
    type: 'bridge',
    ogImage: 'https://santifer.io/business-os/og-business-os.webp',
    component: () => import('../SantiferIRepair.tsx'),
    xDefaultSlug: 'santifer-irepair',
  },
]

// Derived maps for GlobalNav and routing
export function getAltPaths(): Record<string, string> {
  const map: Record<string, string> = {
    '/': '/en',
    '/en': '/',
  }
  for (const article of articleRegistry) {
    map[`/${article.slugs.es}`] = `/${article.slugs.en}`
    map[`/${article.slugs.en}`] = `/${article.slugs.es}`
  }
  return map
}

export function getPageTitles(): Record<string, string> {
  const map: Record<string, string> = {
    '/': 'Portfolio de Santiago',
    '/en': "Santiago's Portfolio",
  }
  for (const article of articleRegistry) {
    map[`/${article.slugs.es}`] = article.titles.es
    map[`/${article.slugs.en}`] = article.titles.en
  }
  return map
}

export function getSectionLabels(): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {}
  for (const article of articleRegistry) {
    map[`/${article.slugs.es}`] = article.sectionLabels.es
    map[`/${article.slugs.en}`] = article.sectionLabels.en
  }
  return map
}

/** All ES slugs (for lang detection: if pathname matches an ES slug → lang is 'es') */
export function getEsSlugs(): Set<string> {
  const slugs = new Set<string>(['/'])
  for (const article of articleRegistry) {
    slugs.add(`/${article.slugs.es}`)
  }
  return slugs
}
