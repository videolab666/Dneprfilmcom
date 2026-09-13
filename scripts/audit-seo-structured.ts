import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface RouteEntry {
  path: string;
  source: 'static' | 'case' | 'gallery' | 'video';
  images?: Array<{ loc: string }>;
  hasVideos?: boolean;
}

function fail(message: string): never {
  throw new Error(`[SEO audit] ${message}`);
}

function htmlPath(path: string): string {
  return path === '/'
    ? 'dist/index.html'
    : join('dist', path.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function requireText(html: string, needle: string, context: string) {
  if (!html.includes(needle)) fail(`${context}: missing ${needle}`);
}

const routesFile = 'dist/prerender-routes.json';
if (!existsSync(routesFile)) fail('dist/prerender-routes.json is missing');
if (!existsSync('dist/sitemap.xml')) fail('dist/sitemap.xml is missing');
if (!existsSync('dist/sitemap-images.xml')) fail('dist/sitemap-images.xml is missing');
if (!existsSync('dist/robots.txt')) fail('dist/robots.txt is missing');

const routes = JSON.parse(readFileSync(routesFile, 'utf8')) as RouteEntry[];
const robots = readFileSync('dist/robots.txt', 'utf8');
const imageSitemap = readFileSync('dist/sitemap-images.xml', 'utf8');
requireText(robots, 'sitemap.xml', 'robots.txt');
requireText(robots, 'sitemap-images.xml', 'robots.txt');
requireText(imageSitemap, 'xmlns:image=', 'sitemap-images.xml');

const rootHtml = readFileSync('dist/index.html', 'utf8');
requireText(rootHtml, 'id="organization-jsonld"', '/');
requireText(rootHtml, '"@type":"Organization"', '/');
requireText(rootHtml, 'id="static-breadcrumb-jsonld"', '/');
requireText(rootHtml, '"@type":"BreadcrumbList"', '/');

const dynamic = routes.filter(route => route.source !== 'static');
for (const route of dynamic) {
  const file = htmlPath(route.path);
  if (!existsSync(file)) fail(`${route.path}: prerendered HTML is missing`);
  const html = readFileSync(file, 'utf8');

  requireText(html, 'rel="canonical"', route.path);
  requireText(html, 'property="og:url"', route.path);
  requireText(html, 'name="twitter:title"', route.path);
  requireText(html, 'name="twitter:description"', route.path);
  requireText(html, 'id="organization-jsonld"', route.path);
  requireText(html, 'id="detail-seo-jsonld"', route.path);
  requireText(html, '"@type":"BreadcrumbList"', route.path);
  if (html.includes('name="robots" content="noindex')) fail(`${route.path}: published dynamic route is noindex`);

  if (route.source === 'case') requireText(html, '"@type":"CreativeWork"', route.path);
  if (route.source === 'gallery') requireText(html, '"@type":"ImageGallery"', route.path);
  if (route.source === 'video') {
    requireText(html, '"@type":"CollectionPage"', route.path);
    // A migrated legacy video-project can legitimately be a portfolio landing
    // page with cover/copy but no actual video URL yet. Do not invent a
    // VideoObject for such records; require it only when real video media exists.
    if (route.hasVideos) requireText(html, '"@type":"VideoObject"', route.path);
  }

  for (const image of route.images || []) {
    if (!image.loc) continue;
    if (!imageSitemap.includes(image.loc.replace(/&/g, '&amp;'))) {
      fail(`${route.path}: image is missing from sitemap-images.xml: ${image.loc}`);
    }
  }
}

console.log(`Structured SEO audit passed for ${dynamic.length} dynamic route(s) and ${routes.length} total prerender route(s).`);
