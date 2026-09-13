import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deleteApp, initializeApp, type FirebaseOptions } from 'firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { INITIAL_CASES } from '../src/data/initialCases';

interface FirebaseConfig extends FirebaseOptions {
  firestoreDatabaseId?: string;
}

interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
}

type DynamicSource = 'case' | 'gallery' | 'video';

interface RouteEntry {
  path: string;
  lastmod?: string;
  source: 'static' | DynamicSource;
  images?: SitemapImage[];
  hasVideos?: boolean;
}

interface PrerenderContentEntry {
  source: DynamicSource;
  id: string;
  data: Record<string, unknown>;
}

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya', ы: 'y', э: 'e', ё: 'yo', ъ: '',
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split('')
    .map(char => CYRILLIC_MAP[char] ?? char)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'page';
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

function asLastmod(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString().slice(0, 10);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (value && typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof candidate.toDate === 'function') {
      const parsed = candidate.toDate();
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    }
    const seconds = candidate.seconds ?? candidate._seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString().slice(0, 10);
  }
  return undefined;
}

function jsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number; _seconds?: number; nanoseconds?: number; _nanoseconds?: number };
    if (typeof candidate.toDate === 'function') {
      const parsed = candidate.toDate();
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    const seconds = candidate.seconds ?? candidate._seconds;
    const nanos = candidate.nanoseconds ?? candidate._nanoseconds;
    if (typeof seconds === 'number' && (typeof nanos === 'number' || Object.keys(candidate).length <= 3)) {
      const millis = seconds * 1000 + (typeof nanos === 'number' ? Math.floor(nanos / 1_000_000) : 0);
      return new Date(millis).toISOString();
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, jsonSafe(nested)]),
    );
  }
  return String(value);
}

function discoverStaticRoutes(): string[] {
  const source = readFileSync('src/App.tsx', 'utf8');
  const routes = new Set<string>(['/']);
  const regex = /<Route\s+path="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source))) {
    const raw = match[1];
    if (!raw || raw === '*' || raw.includes(':') || raw.startsWith('admin')) continue;
    routes.add(normalizePath(raw));
  }
  return Array.from(routes);
}

function caseSlug(data: Record<string, unknown>, id: string): string {
  const explicit = String(data.slug || '').trim();
  if (explicit) return explicit;
  const title = String(data.title_uk || data.title_en || data.title || id);
  const base = slugify(title);
  const suffix = id.replace(/^case-/, '').replace(/[^a-zA-Z0-9-]/g, '').slice(-18).toLowerCase();
  return suffix && !base.endsWith(suffix) ? `${base}-${suffix}` : base;
}

function projectSlug(data: Record<string, unknown>, id: string): string {
  return String(data.slug || '').trim() || slugify(String(data.title_uk || data.title || data.title_en || id));
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueImages(images: SitemapImage[]): SitemapImage[] {
  const map = new Map<string, SitemapImage>();
  images.forEach(image => {
    if (!image.loc) return;
    if (!map.has(image.loc)) map.set(image.loc, image);
  });
  return Array.from(map.values()).slice(0, 1000);
}

function caseImages(data: Record<string, unknown>): SitemapImage[] {
  const title = stringValue(data.title_uk) || stringValue(data.title) || stringValue(data.title_en);
  const images: SitemapImage[] = [];
  const cover = stringValue(data.imageUrl);
  if (cover) images.push({ loc: cover, title });
  if (Array.isArray(data.media)) {
    data.media.forEach(value => {
      if (!value || typeof value !== 'object') return;
      const media = value as Record<string, unknown>;
      if (media.type !== 'image') return;
      const loc = stringValue(media.url);
      if (!loc) return;
      images.push({
        loc,
        title: stringValue(media.alt_uk) || stringValue(media.alt) || stringValue(media.title_uk) || title,
        caption: stringValue(media.caption_uk) || stringValue(media.caption),
      });
    });
  }
  return uniqueImages(images);
}

function galleryImages(data: Record<string, unknown>): SitemapImage[] {
  const title = stringValue(data.title_uk) || stringValue(data.title) || stringValue(data.title_en);
  const images: SitemapImage[] = [];
  const cover = stringValue(data.coverUrl);
  if (cover) images.push({ loc: cover, title });
  if (Array.isArray(data.images)) {
    data.images.forEach(value => {
      if (!value || typeof value !== 'object') return;
      const image = value as Record<string, unknown>;
      const loc = stringValue(image.url);
      if (!loc) return;
      images.push({
        loc,
        title: stringValue(image.alt_uk) || stringValue(image.alt) || title,
        caption: stringValue(image.caption_uk) || stringValue(image.caption),
      });
    });
  }
  return uniqueImages(images);
}

function videoImages(data: Record<string, unknown>): SitemapImage[] {
  const title = stringValue(data.title_uk) || stringValue(data.title) || stringValue(data.title_en);
  const images: SitemapImage[] = [];
  const cover = stringValue(data.coverUrl);
  if (cover) images.push({ loc: cover, title });
  if (Array.isArray(data.videos)) {
    data.videos.forEach(value => {
      if (!value || typeof value !== 'object') return;
      const media = value as Record<string, unknown>;
      const loc = stringValue(media.posterUrl);
      if (!loc) return;
      images.push({
        loc,
        title: stringValue(media.title_uk) || stringValue(media.title) || title,
        caption: stringValue(media.caption_uk) || stringValue(media.caption),
      });
    });
  }
  return uniqueImages(images);
}

function hasVideoMedia(data: Record<string, unknown>): boolean {
  if (!Array.isArray(data.videos)) return false;
  return data.videos.some(value => {
    if (!value || typeof value !== 'object') return false;
    const media = value as Record<string, unknown>;
    return Boolean(stringValue(media.url));
  });
}

async function loadDynamicRoutes(
  config: FirebaseConfig,
  routes: Map<string, RouteEntry>,
  prerenderContent: Record<string, PrerenderContentEntry>,
) {
  const app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    appId: config.appId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
  }, `seo-build-${Date.now()}`);

  try {
    const db = getFirestore(app, config.firestoreDatabaseId || '(default)');
    const [caseSnapshot, gallerySnapshot, videoSnapshot, globalSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'cases'), where('published', '==', true))),
      getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'gallery'), where('published', '==', true))),
      getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'video_project'), where('published', '==', true))),
      getDoc(doc(db, 'site_settings', 'global')),
    ]);
    const portfolioSettingsDocs = [...gallerySnapshot.docs, ...videoSnapshot.docs];
    const migrationVersion = Number(globalSnapshot.data()?.portfolioMigrationVersion || 0);
    const publishedCaseRecords: Array<{ id: string; data: Record<string, unknown> }> = caseSnapshot.docs.map(document => ({
      id: document.id,
      data: document.data() as Record<string, unknown>,
    }));
    if (publishedCaseRecords.length === 0 && migrationVersion < 1) {
      INITIAL_CASES.forEach(item => publishedCaseRecords.push({
        id: item.id,
        data: item as unknown as Record<string, unknown>,
      }));
      console.warn('No explicit published case records yet; using bundled legacy cases until CMS migration v1 is completed.');
    }

    publishedCaseRecords.forEach(document => {
      const data = document.data;
      if (data.published === false) return;
      const slug = caseSlug(data, document.id);
      const path = `/cases/${encodeURIComponent(slug)}`;
      routes.set(path, {
        path,
        source: 'case',
        lastmod: asLastmod(data.updatedAt ?? data.createdAt),
        images: caseImages(data),
      });
      prerenderContent[path] = {
        source: 'case',
        id: document.id,
        data: jsonSafe(data) as Record<string, unknown>,
      };
    });

    portfolioSettingsDocs.forEach(document => {
      const data = document.data() as Record<string, unknown>;
      if (data.published === false) return;

      if (data.kind === 'gallery') {
        const path = `/galleries/${encodeURIComponent(projectSlug(data, document.id))}`;
        routes.set(path, {
          path,
          source: 'gallery',
          lastmod: asLastmod(data.updatedAt ?? data.createdAt),
          images: galleryImages(data),
        });
        prerenderContent[path] = {
          source: 'gallery',
          id: document.id,
          data: jsonSafe(data) as Record<string, unknown>,
        };
      }

      if (data.kind === 'video_project') {
        const path = `/videos/${encodeURIComponent(projectSlug(data, document.id))}`;
        routes.set(path, {
          path,
          source: 'video',
          lastmod: asLastmod(data.updatedAt ?? data.createdAt),
          images: videoImages(data),
          hasVideos: hasVideoMedia(data),
        });
        prerenderContent[path] = {
          source: 'video',
          id: document.id,
          data: jsonSafe(data) as Record<string, unknown>,
        };
      }
    });

    return {
      cases: publishedCaseRecords.length,
      settings: portfolioSettingsDocs.length,
      dynamic: Array.from(routes.values()).filter(item => item.source !== 'static').length,
    };
  } finally {
    await deleteApp(app);
  }
}

function absolutePageUrl(siteUrl: string, path: string): string {
  return path === '/' ? `${siteUrl}/` : `${siteUrl}${path}`;
}

async function main() {
  const distDir = 'dist';
  mkdirSync(distDir, { recursive: true });

  const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8')) as FirebaseConfig;
  const siteUrl = (process.env.SITE_URL || 'https://videolab666.github.io/Dneprfilmcom').replace(/\/+$/, '');
  const routes = new Map<string, RouteEntry>();
  const prerenderContent: Record<string, PrerenderContentEntry> = {};

  discoverStaticRoutes().forEach(path => routes.set(path, { path, source: 'static' }));

  try {
    const stats = await loadDynamicRoutes(config, routes, prerenderContent);
    console.log(`Firebase SDK loaded ${stats.cases} cases and ${stats.settings} site_settings documents; ${stats.dynamic} published dynamic routes discovered.`);
  } catch (error) {
    console.warn('Dynamic Firestore routes could not be loaded. Static sitemap/prerender routes will still be generated.', error);
  }

  const ordered = Array.from(routes.values()).sort((a, b) => a.path.localeCompare(b.path));
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...ordered.map(route => {
      const loc = absolutePageUrl(siteUrl, route.path);
      return [
        '  <url>',
        `    <loc>${xmlEscape(loc)}</loc>`,
        ...(route.lastmod ? [`    <lastmod>${route.lastmod}</lastmod>`] : []),
        '  </url>',
      ].join('\n');
    }),
    '</urlset>',
    '',
  ].join('\n');

  const imageRoutes = ordered.filter(route => route.images?.length);
  const imageSitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...imageRoutes.map(route => [
      '  <url>',
      `    <loc>${xmlEscape(absolutePageUrl(siteUrl, route.path))}</loc>`,
      ...(route.images || []).flatMap(image => [
        '    <image:image>',
        `      <image:loc>${xmlEscape(image.loc)}</image:loc>`,
        ...(image.title ? [`      <image:title>${xmlEscape(image.title)}</image:title>`] : []),
        ...(image.caption ? [`      <image:caption>${xmlEscape(image.caption)}</image:caption>`] : []),
        '    </image:image>',
      ]),
      '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
  ].join('\n');

  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Sitemap: ${siteUrl}/sitemap-images.xml`,
    '',
  ].join('\n');

  const routeFile = join(distDir, 'prerender-routes.json');
  mkdirSync(dirname(routeFile), { recursive: true });
  writeFileSync(join(distDir, 'sitemap.xml'), sitemap);
  writeFileSync(join(distDir, 'sitemap-images.xml'), imageSitemap);
  writeFileSync(join(distDir, 'robots.txt'), robots);
  writeFileSync(routeFile, JSON.stringify(ordered, null, 2));
  writeFileSync(join(distDir, 'portfolio-prerender-data.json'), JSON.stringify(prerenderContent));

  const imageCount = imageRoutes.reduce((total, route) => total + (route.images?.length || 0), 0);
  console.log(`Generated sitemap.xml, sitemap-images.xml (${imageCount} images), robots.txt, ${Object.keys(prerenderContent).length} prerender data record(s) and ${ordered.length} prerender routes (${ordered.filter(item => item.source !== 'static').length} dynamic).`);
}

await main();