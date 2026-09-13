import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

interface RouteEntry {
  path: string;
  source: 'static' | 'case' | 'gallery' | 'video';
}

const chrome = process.env.CHROME || '';
const previewBase = (process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4174/Dneprfilmcom').replace(/\/+$/, '');
const routeFile = 'dist/prerender-routes.json';

if (!chrome || !existsSync(chrome)) throw new Error(`Chromium executable not found: ${chrome || '(empty)'}`);
if (!existsSync(routeFile)) throw new Error(`${routeFile} is missing. Run generate-seo-assets.ts first.`);

const routes = JSON.parse(readFileSync(routeFile, 'utf8')) as RouteEntry[];
const ordered = [...routes].sort((a, b) => Number(a.path === '/') - Number(b.path === '/'));

for (const route of ordered) {
  const url = route.path === '/' ? `${previewBase}/` : `${previewBase}${route.path}`;
  const result = spawnSync(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--virtual-time-budget=12000',
    '--dump-dom',
    url,
  ], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });

  const html = result.stdout || '';
  if (!html.includes('id="root"')) {
    throw new Error(`Prerender returned no React root for ${route.path}: ${(result.stderr || '').slice(0, 1000)}`);
  }
  if (html.includes('id="boot-fallback"')) throw new Error(`Static boot fallback remained for ${route.path}`);
  if (html.includes('animate-spin')) throw new Error(`React loading fallback remained for ${route.path}`);

  if (route.source !== 'static' && html.includes('name="robots" content="noindex')) {
    throw new Error(`Dynamic route resolved from Firestore but remained noindex: ${route.path}`);
  }

  const output = route.path === '/'
    ? 'dist/index.html'
    : join('dist', route.path.replace(/^\/+|\/+$/g, ''), 'index.html');
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, html);
  console.log(`Prerendered ${route.path} -> ${output}`);
}

console.log(`Prerendered ${ordered.length} public routes.`);
