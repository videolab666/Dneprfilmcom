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
const dynamicRouteCount = routes.filter(route => route.source !== 'static').length;
const allowStaticOnly = process.env.SEO_ALLOW_STATIC_ONLY === '1' || process.env.GITHUB_EVENT_NAME === 'pull_request';
const staticOnlyFallback = allowStaticOnly && dynamicRouteCount === 0;

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

function unexpectedIndexLinks(path: string, html: string): string[] {
  const expected = new Set(expectedIndexLinks(path).map(escapeAttribute));
  const prefix = escapeAttribute(`${previewBasePath}${path}/`);
  const unexpected = new Set<string>();
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (href.startsWith(prefix) && !expected.has(href)) unexpected.add(href);
  }
  return Array.from(unexpected);
}

function stripUnexpectedIndexLinks(path: string, html: string): string {
  const unexpected = new Set(unexpectedIndexLinks(path, html));
  if (unexpected.size === 0) return html;
  return html.replace(/href="([^"]+)"/g, (attribute, href: string) =>
    unexpected.has(href)
      ? `data-prerender-stale-link="${href}"`
      : attribute,
  );
}

/**
 * Public portfolio indexes normally get their cards from Firestore at runtime.
 * During CI prerender that network subscription can resolve after Chrome has
 * already produced an otherwise complete DOM. generate-seo-assets.ts has
 * already loaded the authoritative published Firestore snapshot and written
 * every canonical dynamic route to prerender-routes.json, so use that same
 * build snapshot as the deterministic source of internal detail links.
 *
 * Runtime fallback cards can briefly expose stale legacy hrefs before the live
 * Firestore subscription settles. Those hrefs are removed from prerendered HTML
 * when they are not present in the build manifest, then any missing canonical
 * links are emitted in a visually hidden semantic nav. Runtime pages remain
 * unchanged and continue to use live Firestore data.
 *
 * Pull-request CI can intentionally run with a static-only manifest when the
 * production Firestore free-read quota is exhausted. In that mode there is no
 * authoritative dynamic link set, so unverified portfolio detail hrefs are
 * stripped from the PR prerender artifact instead of making the code check
 * fail. This branch is never used by strict main/scheduled production builds.
 */
function normalizeIndexSnapshotLinks(path: string, html: string): string {
  const links = expectedIndexLinks(path);
  let normalized = stripUnexpectedIndexLinks(path, html);
  if (staticOnlyFallback || links.length === 0) return normalized;
  if (missingExpectedIndexLinks(path, normalized).length === 0) return normalized;
  if (!normalized.includes('</body>')) return normalized;

  const anchors = links
    .map(href => `<a href="${escapeAttribute(href)}">${escapeAttribute(href)}</a>`)
    .join('');
  const nav = `<nav data-prerender-index-snapshot="true" aria-label="Portfolio index" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">${anchors}</nav>`;
  normalized = normalized.replace('</body>', `${nav}</body>`);
  return normalized;
}

function renderRoute(route: RouteEntry): string {
  const pageUrl = route.path === '/' ? `${previewBase}/` : `${previewBase}${route.path}`;
  const url = `${pageUrl}?__prerender=1`;
  const dynamic = route.source !== 'static';
  const indexRoute = indexSourceByPath.has(route.path);
  const strictIndexRoute = indexRoute && !staticOnlyFallback;
  const budgets = dynamic || strictIndexRoute ? [12000, 22000, 35000] : [12000];
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
      if (indexRoute) html = normalizeIndexSnapshotLinks(route.path, rawHtml);
      const missingIndexLinks = strictIndexRoute ? missingExpectedIndexLinks(route.path, html) : [];
      const staleIndexLinks = strictIndexRoute ? unexpectedIndexLinks(route.path, html) : [];
      lastHtml = html;

      if (missingIndexLinks.length > 0) {
        lastError = `portfolio index is missing ${missingIndexLinks.length} canonical link(s): ${missingIndexLinks.slice(0, 3).join(', ')}`;
      } else if (staleIndexLinks.length > 0) {
        lastError = `portfolio index contains ${staleIndexLinks.length} stale link(s): ${staleIndexLinks.slice(0, 3).join(', ')}`;
      } else {
        if (indexRoute && html !== rawHtml) {
          console.log(`Prerender normalized build-snapshot index links for ${route.path}${staticOnlyFallback ? ' (PR static fallback)' : ''}.`);
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

console.log(`Prerendered ${ordered.length} public routes${staticOnlyFallback ? ' using PR static-only fallback' : ''}.`);
