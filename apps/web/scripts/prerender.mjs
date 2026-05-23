import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CASE_STUDIES,
  HOME_META,
  INDUSTRY_PAGES,
  SERVICE_PAGES,
  SITE_URL,
} from '../src/data/siteContent.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(rootDir, 'dist');
const indexPath = join(distDir, 'index.html');
const template = await readFile(indexPath, 'utf8');
const today = new Date().toISOString().slice(0, 10);

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const routes = [
  {
    path: '/',
    title: HOME_META.title,
    description: HOME_META.description,
    content: renderHome(),
  },
  ...SERVICE_PAGES.map((page) => ({
    path: `/${page.slug}`,
    title: `${page.title} | AgentsOX`,
    description: page.metaDescription,
    content: renderLanding(page, 'service'),
  })),
  ...INDUSTRY_PAGES.map((page) => ({
    path: `/${page.slug}`,
    title: `${page.title} | AgentsOX`,
    description: page.metaDescription,
    content: renderLanding(page, 'industry'),
  })),
  ...CASE_STUDIES.map((study) => ({
    path: `/case-studies/${study.slug}`,
    title: `${study.title} Case Study | AgentsOX`,
    description: `${study.description} Result: ${study.outcome}.`,
    content: renderCaseStudy(study),
  })),
  {
    path: '/privacy',
    title: 'Privacy Policy | AgentsOX',
    description: 'Privacy Policy for AgentsOX AI chatbots, workflow automation, workshops, analytics, and website contact workflows.',
    content: renderLegal('Privacy Policy', 'How AgentsOX handles website, contact form, chatbot, workshop, and client workflow information.'),
  },
  {
    path: '/terms',
    title: 'Terms of Service | AgentsOX',
    description: 'Terms of Service for AgentsOX website use, AI workshops, automation services, client work, disclaimers, and limitations.',
    content: renderLegal('Terms of Service', 'Terms covering AgentsOX website use, AI workshops, automation services, client work, disclaimers, and limitations.'),
  },
];

function renderHome() {
  return `
    <a href="#main-content" class="skip-link">Skip to content</a>
    <main id="main-content" class="static-page">
      <section class="static-page__hero">
        <h1>AI automation for business operations</h1>
        <p>AgentsOX designs practical AI systems around your real workflow: leads, admin, reporting, support, branding, SEO, and internal tools.</p>
        <p><strong>Built around the business problem, not a fixed product.</strong></p>
        <p><a href="#contact">Audit My Workflow</a></p>
      </section>
      <section>
        <h2>AI Systems Built Around One Business Workflow</h2>
        ${SERVICE_PAGES.map((page) => `
          <article>
            <h3><a href="/${page.slug}">${escapeHtml(page.shortTitle)}</a></h3>
            <p>${escapeHtml(page.description)}</p>
          </article>
        `).join('')}
      </section>
      <section>
        <h2>Proof That We Execute</h2>
        ${CASE_STUDIES.map((study) => `
          <article>
            <h3><a href="/case-studies/${study.slug}">${escapeHtml(study.title)}</a></h3>
            <p>${escapeHtml(study.description)}</p>
            <p><strong>${escapeHtml(study.outcome)}</strong></p>
          </article>
        `).join('')}
      </section>
      <section id="contact">
        <h2>Start With One Workflow</h2>
        <p>Describe one workflow, offer, or client acquisition problem you want to improve. AgentsOX will shape the first useful system around it.</p>
        <p><a href="mailto:nadav@agentsox.com">nadav@agentsox.com</a></p>
      </section>
    </main>
  `;
}

function renderLanding(page, type) {
  return `
    <main id="main-content" class="static-page">
      <section class="static-page__hero">
        <p>${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.description)}</p>
        <p><a href="/#contact">Send Your Workflow Problem</a></p>
      </section>
      <section>
        <h2>${type === 'industry' ? 'Use Cases' : 'What This Should Fix'}</h2>
        ${page.outcomes.map((outcome) => `
          <article>
            <h3>${escapeHtml(outcome)}</h3>
            <p>AgentsOX maps the existing tools, handoffs, and failure points first, then builds the smallest useful system that can be trusted in daily use.</p>
          </article>
        `).join('')}
      </section>
      <section>
        <h2>Related Work</h2>
        ${CASE_STUDIES.map((study) => `
          <article>
            <h3><a href="/case-studies/${study.slug}">${escapeHtml(study.title)}</a></h3>
            <p>${escapeHtml(study.outcome)}</p>
          </article>
        `).join('')}
      </section>
    </main>
  `;
}

function renderCaseStudy(study) {
  return `
    <main id="main-content" class="static-page">
      <section class="static-page__hero">
        <p>${escapeHtml(study.tag)}</p>
        <h1>${escapeHtml(study.title)}</h1>
        <p>${escapeHtml(study.description)}</p>
        <p><strong>Result: ${escapeHtml(study.outcome)}</strong></p>
        <p><a href="${escapeHtml(study.url)}">View Live Work</a></p>
      </section>
      <section>
        <h2>What Needed to Change</h2>
        <p>${escapeHtml(study.problem)}</p>
      </section>
      <section>
        <h2>How AgentsOX Thinks About This Work</h2>
        <p>The project started by clarifying the real workflow, the people using it, and the points where the system needed to be practical instead of impressive.</p>
      </section>
    </main>
  `;
}

function renderLegal(title, description) {
  return `
    <main id="main-content" class="static-page">
      <section class="static-page__hero">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <p><a href="/">Back to AgentsOX</a></p>
      </section>
    </main>
  `;
}

function routeHtml(route) {
  const canonical = `${SITE_URL}${route.path === '/' ? '' : route.path}`;
  return template
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(route.description)}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(route.description)}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`)
    .replace('<div id="root"></div>', `<div id="root">${route.content}</div>`);
}

for (const route of routes) {
  const outputPath = route.path === '/'
    ? indexPath
    : join(distDir, route.path, 'index.html');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, routeHtml(route));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url>
    <loc>${SITE_URL}${route.path === '/' ? '' : route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.path === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${route.path === '/' ? '1.0' : route.path === '/privacy' || route.path === '/terms' ? '0.3' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>
`;

await writeFile(join(distDir, 'sitemap.xml'), sitemap);
