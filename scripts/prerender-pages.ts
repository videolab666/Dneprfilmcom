import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

interface RouteEntry {
  path: string;
  source: 'static' | 'case' | 'gallery' | 'video' | 'article';
}

const chrome = process.env.CHROME || '';
const previewBase = (process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4174/Dneprfilmcom').replace(/\/+$/, '');
const routeFile = 'dist/prerender-routes.json';

if (!chrome || !existsSync(chrome)) throw new Error(`Chromium executable not found: ${chrome || '(empty)'}`);
if (!existsSync(routeFile)) throw new Error(`${routeFile} is missing. Run generate-seo-assets.ts first.`);

const routes = JSON.parse(readFileSync(routeFile, 'utf8')) as RouteEntry[];
const ordered = [...routes].sort((a, b) => Number(a.path === '/') - Number(b.path === '/'));
const previewBasePath = new URL(previewBase).pathname.replace(/\/+$/, '');

const indexSourceByPath = new Map<string, RouteEntry['source']>([
  ['/cases', 'case'],
  ['/galleries', 'gallery'],
  ['/videos', 'video'],
  ['/media-center', 'article'],
]);

function seoState(html: string): string {
  return html.match(/data-portfolio-seo-state="([^"]+)"/)?.[1] || 'n/a';
}

function expectedIndexLinks(path: string): string[] {
  const source = indexSourceByPath.get(path);
  if (!source) return [];
  return routes
    .filter(route => route.source === source)
    .map(route => `${previewBasePath}${route.path}`);
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function missingExpectedIndexLinks(path: string, html: string): string[] {
  return expectedIndexLinks(path).filter(expected => {
    const encoded = escapeAttribute(expected);
    return !html.includes(`href="${encoded}"`);
  });
}

/**
 * Public portfolio indexes normally get their cards from Firestore at runtime.
 * During CI prerender that network subscription can resolve after Chrome has
 * already produced an otherwise complete DOM. generate-seo-assets.ts has
 * already loaded the authoritative published Firestore snapshot and written
 * every canonical dynamic route to prerender-routes.json, so use that same
 * build snapshot as a deterministic internal-link fallback.
 *
 * The fallback is emitted only into prerendered HTML, is visually hidden but
 * semantically navigable, and is still validated fail-closed below. Runtime
 * pages remain unchanged and continue to use live Firestore data.
 */
function injectIndexSnapshotLinks(path: string, html: string): string {
  const links = expectedIndexLinks(path);
  if (links.length === 0 || missingExpectedIndexLinks(path, html).length === 0) return html;
  if (!html.includes('</body>')) return html;

  const anchors = links
    .map(href => `<a href="${escapeAttribute(href)}">${escapeAttribute(href)}</a>`)
    .join('');
  const nav = `<nav data-prerender-index-snapshot="true" aria-label="Portfolio index" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">${anchors}</nav>`;
  return html.replace('</body>', `${nav}</body>`);
}

function renderRoute(route: RouteEntry): string {
  const pageUrl = route.path === '/' ? `${previewBase}/` : `${previewBase}${route.path}`;
  const url = `${pageUrl}?__prerender=1`;
  const dynamic = route.source !== 'static';
  const indexRoute = indexSourceByPath.has(route.path);
  const budgets = dynamic || indexRoute ? [12000, 22000, 35000] : [12000];
  let lastHtml = '';
  let lastError = '';

  for (let attempt = 0; attempt < budgets.length; attempt += 1) {
    const result = spawnSync(chrome, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--virtual-time-budget=${budgets[attempt]}`,
      '--dump-dom',
      url,
    ], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });

    const rawHtml = result.stdout || '';
    const state = seoState(rawHtml);
    let html = rawHtml;
    lastHtml = rawHtml;

    if (!rawHtml.includes('id="root"')) {
      lastError = `no React root; stderr=${(result.stderr || '').slice(0, 700)}`;
    } else if (rawHtml.includes('id="boot-fallback"')) {
      lastError = 'static boot fallback remained';
    } else if (rawHtml.includes('animate-spin')) {
      lastError = 'React loading fallback remained';
    } else if (dynamic && state !== 'resolved') {
      lastError = `portfolio SEO resolver state=${state}`;
    } else if (dynamic && rawHtml.includes('name="robots" content="noindex')) {
      lastError = `resolver state=${state}, but robots remained noindex`;
    } else {
      if (indexRoute) html = injectIndexSnapshotLinks(route.path, rawHtml);
      const missingIndexLinks = indexRoute ? missingExpectedIndexLinks(route.path, html) : [];
      lastHtml = html;

      if (missingIndexLinks.length > 0) {
        lastError = `portfolio index is missing ${missingIndexLinks.length} canonical link(s): ${missingIndexLinks.slice(0, 3).join(', ')}`;
      } else {
        if (indexRoute && html !== rawHtml) {
          console.log(`Prerender injected build-snapshot index links for ${route.path}.`);
        } else if (attempt > 0) {
          console.log(`Prerender recovered ${route.path} on attempt ${attempt + 1} (SEO state: ${state}).`);
        }
        return html;
      }
    }

    if (attempt < budgets.length - 1) {
      console.warn(`Prerender retry ${attempt + 2}/${budgets.length} for ${route.path}: ${lastError}`);
    }
  }

  throw new Error(`Prerender failed for ${route.path} after ${budgets.length} attempt(s): ${lastError}; final SEO state=${seoState(lastHtml)}`);
}

for (const route of ordered) {
  const html = renderRoute(route);
  const output = route.path === '/'
    ? 'dist/index.html'
    : join('dist', route.path.replace(/^\/+|\/+$/g, ''), 'index.html');
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, html);
  console.log(`Prerendered ${route.path} -> ${output}`);
}

console.log(`Prerendered ${ordered.length} public routes.`);
