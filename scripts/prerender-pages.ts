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

function seoState(html: string): string {
  return html.match(/data-portfolio-seo-state="([^"]+)"/)?.[1] || 'n/a';
}

function renderRoute(route: RouteEntry): string {
  const pageUrl = route.path === '/' ? `${previewBase}/` : `${previewBase}${route.path}`;
  const url = `${pageUrl}?__prerender=1`;
  const dynamic = route.source !== 'static';
  const budgets = dynamic ? [12000, 22000, 35000] : [12000];
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

    const html = result.stdout || '';
    const state = seoState(html);
    lastHtml = html;

    if (!html.includes('id="root"')) {
      lastError = `no React root; stderr=${(result.stderr || '').slice(0, 700)}`;
    } else if (html.includes('id="boot-fallback"')) {
      lastError = 'static boot fallback remained';
    } else if (html.includes('animate-spin')) {
      lastError = 'React loading fallback remained';
    } else if (dynamic && state !== 'resolved') {
      lastError = `portfolio SEO resolver state=${state}`;
    } else if (dynamic && html.includes('name="robots" content="noindex')) {
      lastError = `resolver state=${state}, but robots remained noindex`;
    } else {
      if (attempt > 0) {
        console.log(`Prerender recovered ${route.path} on attempt ${attempt + 1} (SEO state: ${state}).`);
      }
      return html;
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
