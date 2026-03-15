/**
 * Post-build script: SSR prerender using React's renderToString.
 *
 * Renders the actual App component to HTML so the pre-rendered content
 * matches exactly what React produces. This enables hydrateRoot() on the
 * client to adopt the existing DOM without replacing it (zero CLS).
 *
 * Articles are loaded from the article registry. Only articles whose
 * component files exist will be prerendered (new case studies added to the
 * registry but not yet created will be skipped gracefully).
 *
 * Usage: npx tsx scripts/prerender.tsx  (runs automatically via "npm run build")
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { Suspense, type ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import Critters from 'critters';
import App from '../src/App.tsx';
import GlobalNav from '../src/GlobalNav.tsx';
import { articleRegistry, type ArticleConfig } from '../src/articles/registry.ts';
import { buildArticleJsonLd } from '../src/articles/json-ld.ts';
import { seo } from '../src/i18n.ts';
import { n8nContent } from '../src/n8n-i18n.ts';
import { jacoboContent } from '../src/jacobo-i18n.ts';
import { businessOsContent } from '../src/business-os-i18n.ts';
import { pseoContent } from '../src/pseo-i18n.ts';
import { chatbotContent } from '../src/chatbot-i18n.ts';

// Map article id → i18n content for JSON-LD generation
const i18nMap: Record<string, Record<string, { header: { h1: string }; nav: { breadcrumbHome: string; breadcrumbCurrent: string }; faq: { items: readonly { q: string; a: string }[] } }>> = {
  'n8n-for-pms': n8nContent,
  'jacobo': jacoboContent,
  'business-os': businessOsContent,
  'programmatic-seo': pseoContent,
  'self-healing-chatbot': chatbotContent,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

/** Strip React 19 SSR-injected <link> tags from inside #root to prevent hydration mismatch */
function stripReactSSRTags(html: string): string {
  return html.replace(/<link[^>]*>/g, '');
}

// ---------------------------------------------------------------------------
// SSR render per language (home page)
// ---------------------------------------------------------------------------
function renderApp(lang: 'es' | 'en'): string {
  const path = lang === 'en' ? '/en' : '/';
  return stripReactSSRTags(renderToString(
    <StaticRouter location={path}>
      <div>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/en" element={<App />} />
          </Routes>
        </Suspense>
      </div>
    </StaticRouter>
  ));
}

function renderArticlePage(slug: string, ArticleComponent: ComponentType<{ lang: 'es' | 'en' }>, lang: 'es' | 'en'): string {
  return stripReactSSRTags(renderToString(
    <StaticRouter location={`/${slug}`}>
      <GlobalNav />
      <div>
        <Suspense fallback={null}>
          <Routes>
            <Route path={`/${slug}`} element={<ArticleComponent lang={lang} />} />
          </Routes>
        </Suspense>
      </div>
    </StaticRouter>
  ));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Inject into built HTML
// ---------------------------------------------------------------------------
const distDir = resolve(root, 'dist');
const indexPath = resolve(distDir, 'index.html');

let indexHtml: string;
try {
  indexHtml = readFileSync(indexPath, 'utf-8');
} catch {
  console.error('Error: dist/index.html not found. Run "vite build" first.');
  process.exit(1);
}

// --- ES version (inject into existing index.html) ---
let esHtml: string;
try {
  esHtml = renderApp('es');
} catch (err) {
  console.error('[prerender] SSR failed for ES, falling back to empty root:', err);
  esHtml = '';
}

const esSeo = seo.es;

const injectedEs = indexHtml
  .replace('<div id="root"></div>', `<div id="root">${esHtml}</div>`)
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(esSeo.title)}</title>`)
  .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${esc(esSeo.title)}" />`)
  .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(esSeo.description)}" />`)
  .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(esSeo.title)}" />`)
  .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(esSeo.description)}" />`)
  .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(esSeo.title)}" />`)
  .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(esSeo.description)}" />`);

// --- EN version ---
let enHtml: string;
try {
  enHtml = renderApp('en');
} catch (err) {
  console.error('[prerender] SSR failed for EN, falling back to empty root:', err);
  enHtml = '';
}

const enSeo = seo.en;

let enPage = indexHtml
  .replace('<div id="root"></div>', `<div id="root">${enHtml}</div>`)
  .replace('<html lang="es" class="dark">', '<html lang="en" class="dark">')
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(enSeo.title)}</title>`)
  .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${esc(enSeo.title)}" />`)
  .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(enSeo.description)}" />`)
  .replace(/<link rel="canonical" href="[^"]*" \/>/, '<link rel="canonical" href="https://santifer.io/en" />')
  .replace(/<meta property="og:url" content="[^"]*" \/>/, '<meta property="og:url" content="https://santifer.io/en" />')
  .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(enSeo.title)}" />`)
  .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(enSeo.description)}" />`)
  .replace(/<meta property="og:locale" content="es_ES" \/>/, '<meta property="og:locale" content="en_US" />')
  .replace(/<meta property="og:locale:alternate" content="en_US" \/>/, '<meta property="og:locale:alternate" content="es_ES" />')
  .replace(/<meta name="twitter:url" content="[^"]*" \/>/, '<meta name="twitter:url" content="https://santifer.io/en" />')
  .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(enSeo.title)}" />`)
  .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(enSeo.description)}" />`);

// ---------------------------------------------------------------------------
// Article pages — build from registry
// ---------------------------------------------------------------------------
interface ArticlePage {
  slug: string;
  html: string;
}

function buildArticlePage(
  config: ArticleConfig,
  lang: 'es' | 'en',
  ArticleComponent: ComponentType<{ lang: 'es' | 'en' }>,
): string {
  const slug = config.slugs[lang];
  const altSlug = config.slugs[lang === 'es' ? 'en' : 'es'];
  const url = `https://santifer.io/${slug}`;
  const altUrl = `https://santifer.io/${altSlug}`;
  const altLang = lang === 'es' ? 'en' : 'es';
  const htmlLang = lang;
  const ogLocale = lang === 'es' ? 'es_ES' : 'en_US';
  const ogLocaleAlt = lang === 'es' ? 'en_US' : 'es_ES';
  const articleSeo = config.seo[lang];
  const xDefaultHref = `https://santifer.io/${config.xDefaultSlug || config.slugs.es}`;

  let renderedHtml: string;
  try {
    renderedHtml = renderArticlePage(slug, ArticleComponent, lang);
  } catch (err) {
    console.error(`[prerender] SSR failed for ${slug}, falling back to empty root:`, err);
    renderedHtml = '';
  }

  const hreflangLinks = `<link rel="alternate" hreflang="${lang}" href="${url}" /><link rel="alternate" hreflang="${altLang}" href="${altUrl}" /><link rel="alternate" hreflang="x-default" href="${xDefaultHref}" />`;

  let result = indexHtml
    .replace('<div id="root"></div>', `<div id="root">${renderedHtml}</div>`)
    .replace('<html lang="es" class="dark">', `<html lang="${htmlLang}" class="dark">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(articleSeo.title)}</title>`)
    .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${esc(articleSeo.title)}" />`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(articleSeo.description)}" />`)
    // Remove home hreflang tags before injecting article-specific ones
    .replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\s*/g, '')
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />${hreflangLinks}`)
    .replace(/<meta property="og:type" content="[^"]*" \/>/, '<meta property="og:type" content="article" />')
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(articleSeo.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(articleSeo.description)}" />`)
    .replace(/<meta property="og:locale" content="es_ES" \/>/, `<meta property="og:locale" content="${ogLocale}" />`)
    .replace(/<meta property="og:locale:alternate" content="en_US" \/>/, `<meta property="og:locale:alternate" content="${ogLocaleAlt}" />`)
    .replace(/<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${url}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(articleSeo.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(articleSeo.description)}" />`)
    // OG image — replace with article-specific image if configured
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(config.ogImage || 'https://santifer.io/og-image.webp')}" />`)
    .replace(/<meta property="og:image:alt" content="[^"]*" \/>/, `<meta property="og:image:alt" content="${esc(articleSeo.title)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, config.ogImage ? `<meta name="twitter:image" content="${esc(config.ogImage)}" />` : '');

  // Inject article:published_time + article:modified_time + article:tag
  const seoMeta = config.seoMeta;
  if (seoMeta) {
    const articleMetaTags = [
      `<meta property="article:published_time" content="${seoMeta.datePublished}" />`,
      `<meta property="article:modified_time" content="${seoMeta.dateModified}" />`,
      `<meta property="article:author" content="https://www.linkedin.com/in/santifer" />`,
      `<meta property="article:tag" content="${esc(seoMeta.articleTags)}" />`,
    ].join('\n    ');
    result = result.replace('</head>', `    ${articleMetaTags}\n  </head>`);
  }

  // Inject article JSON-LD (replace homepage Person/WebSite schema)
  const i18n = i18nMap[config.id];
  if (seoMeta && i18n) {
    const t = i18n[lang];
    if (t) {
      const jsonLd = buildArticleJsonLd({
        lang,
        url: `https://santifer.io/${slug}`,
        altUrl: `https://santifer.io/${altSlug}`,
        headline: t.header.h1,
        alternativeHeadline: articleSeo.title,
        description: articleSeo.description,
        datePublished: seoMeta.datePublished,
        dateModified: seoMeta.dateModified,
        keywords: seoMeta.keywords,
        images: config.heroImage ? [config.heroImage] : seoMeta.images,
        breadcrumbHome: t.nav.breadcrumbHome,
        breadcrumbCurrent: t.nav.breadcrumbCurrent,
        faq: t.faq.items,
        articleType: seoMeta.articleType,
        about: seoMeta.about,
        extra: seoMeta.extra,
        citation: seoMeta.citation,
        isBasedOn: seoMeta.isBasedOn,
        mentions: seoMeta.mentions,
      });
      const jsonLdScript = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;
      // Replace the homepage JSON-LD with article-specific one
      result = result.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        jsonLdScript,
      );
    }
  }

  return result;
}

// Load article components and build pages
const articlePages: ArticlePage[] = [];

for (const config of articleRegistry) {
  let ArticleComponent: ComponentType<{ lang: 'es' | 'en' }>;
  try {
    const mod = await config.component();
    ArticleComponent = mod.default;
  } catch {
    console.log(`[prerender] Skipping ${config.id} — component not found yet`);
    continue;
  }

  const seen = new Set<string>();
  for (const lang of ['es', 'en'] as const) {
    const slug = config.slugs[lang];
    if (seen.has(slug)) continue; // same slug for both languages
    seen.add(slug);
    const html = buildArticlePage(config, lang, ArticleComponent);
    articlePages.push({ slug, html });
  }
}

// ---------------------------------------------------------------------------
// Critical CSS inlining with Critters
// ---------------------------------------------------------------------------
const critters = new Critters({
  path: distDir,
  publicPath: '/',
  inlineFonts: false,
  preload: 'media',
  compress: true,
  reduceInlineStyles: true,
});

function dedupePreloads(html: string): string {
  return html.replace(/<link rel="preload" as="image" href="\/foto-avatar\.webp">/g, '');
}

async function writePage(html: string, outputPath: string, label: string) {
  const dir = dirname(outputPath);
  mkdirSync(dir, { recursive: true });
  try {
    const processed = dedupePreloads(await critters.process(html));
    writeFileSync(outputPath, processed, 'utf-8');
    console.log(`[prerender] ${label} (with critical CSS)`);
  } catch {
    writeFileSync(outputPath, html, 'utf-8');
    console.log(`[prerender] ${label} (no critical CSS)`);
  }
}

async function inlineCriticalCSS() {
  // Home pages
  await writePage(injectedEs, indexPath, 'ES: dist/index.html updated');
  await writePage(enPage, resolve(distDir, 'en', 'index.html'), 'EN: dist/en/index.html created');

  // Article pages
  for (const { slug, html } of articlePages) {
    await writePage(html, resolve(distDir, slug, 'index.html'), `${slug}: dist/${slug}/index.html created`);
  }
}

await inlineCriticalCSS();

// ---------------------------------------------------------------------------
// 404 page — Vercel serves this with HTTP 404 status automatically
// ---------------------------------------------------------------------------
const notFoundHtml = indexHtml
  .replace('<div id="root"></div>', `<div id="root"><div style="min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 1.5rem"><p style="font-size:6rem;font-weight:bold;color:var(--primary);margin-bottom:1rem;font-family:var(--font-display)">404</p><h1 style="font-size:1.5rem;font-weight:600;color:var(--foreground);margin-bottom:0.5rem">Page not found</h1><p style="color:var(--muted-foreground);margin-bottom:2rem;max-width:28rem">The page you're looking for doesn't exist or has been moved.</p><a href="/" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;border-radius:0.75rem;background:var(--primary);color:var(--primary-foreground);font-weight:500;text-decoration:none">← Back to home</a></div></div>`)
  .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex, nofollow" />')
  .replace(/<title>[^<]*<\/title>/, '<title>404 — Page not found | santifer.io</title>');

// Add noindex if no robots meta exists
if (!notFoundHtml.includes('name="robots"')) {
  const withNoindex = notFoundHtml.replace('</head>', '<meta name="robots" content="noindex, nofollow" /></head>');
  writeFileSync(resolve(distDir, '404.html'), withNoindex, 'utf-8');
} else {
  writeFileSync(resolve(distDir, '404.html'), notFoundHtml, 'utf-8');
}
console.log('[prerender] 404: dist/404.html created');

// ---------------------------------------------------------------------------
// Hydration structure validation
// ---------------------------------------------------------------------------
function validateHydrationStructure(html: string, label: string) {
  const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/);
  if (!rootMatch || !rootMatch[1].trim()) return; // empty root = OK (fallback)
  const content = rootMatch[1];

  // Must NOT contain <link> tags (React 19 SSR artifacts)
  if (/<link\s/.test(content)) {
    console.error(`[hydration-check] FAIL ${label}: <link> tags found inside #root — will cause hydration mismatch`);
    process.exit(1);
  }

  // Must have <div> wrapper (PageTransition)
  if (!content.includes('<div')) {
    console.error(`[hydration-check] FAIL ${label}: missing <div> wrapper (PageTransition) inside #root`);
    process.exit(1);
  }
}

// Validate home pages
validateHydrationStructure(injectedEs, 'home-es');
validateHydrationStructure(enPage, 'home-en');

// Validate article pages
for (const { slug, html } of articlePages) {
  validateHydrationStructure(html, slug);
}

console.log('[hydration-check] All pages pass structural validation');
console.log('[prerender] Done.');
