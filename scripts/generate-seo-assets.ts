import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deleteApp, initializeApp, type FirebaseOptions } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

interface FirebaseConfig extends FirebaseOptions {
  firestoreDatabaseId?: string;
}

interface RouteEntry {
  path: string;
  lastmod?: string;
  source: 'static' | 'case' | 'gallery' | 'video';
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

async function loadDynamicRoutes(config: FirebaseConfig, routes: Map<string, RouteEntry>) {
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
    const [caseSnapshot, settingsSnapshot] = await Promise.all([
      getDocs(collection(db, 'cases')),
      getDocs(collection(db, 'site_settings')),
    ]);

    caseSnapshot.docs.forEach(document => {
      const data = document.data() as Record<string, unknown>;
      if (data.published === false) return;
      const slug = caseSlug(data, document.id);
      const path = `/cases/${encodeURIComponent(slug)}`;
      routes.set(path, {
        path,
        source: 'case',
        lastmod: asLastmod(data.updatedAt ?? data.createdAt),
      });
    });

    settingsSnapshot.docs.forEach(document => {
      const data = document.data() as Record<string, unknown>;
      if (data.published === false) return;

      if (data.kind === 'gallery') {
        const path = `/galleries/${encodeURIComponent(projectSlug(data, document.id))}`;
        routes.set(path, {
          path,
          source: 'gallery',
          lastmod: asLastmod(data.updatedAt ?? data.createdAt),
        });
      }

      if (data.kind === 'video_project') {
        const path = `/videos/${encodeURIComponent(projectSlug(data, document.id))}`;
        routes.set(path, {
          path,
          source: 'video',
          lastmod: asLastmod(data.updatedAt ?? data.createdAt),
        });
      }
    });

    return {
      cases: caseSnapshot.size,
      settings: settingsSnapshot.size,
      dynamic: Array.from(routes.values()).filter(item => item.source !== 'static').length,
    };
  } finally {
    await deleteApp(app);
  }
}

async function main() {
  const distDir = 'dist';
  mkdirSync(distDir, { recursive: true });

  const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8')) as FirebaseConfig;
  const siteUrl = (process.env.SITE_URL || 'https://videolab666.github.io/Dneprfilmcom').replace(/\/+$/, '');
  const routes = new Map<string, RouteEntry>();

  discoverStaticRoutes().forEach(path => routes.set(path, { path, source: 'static' }));

  try {
    const stats = await loadDynamicRoutes(config, routes);
    console.log(`Firebase SDK loaded ${stats.cases} cases and ${stats.settings} site_settings documents; ${stats.dynamic} published dynamic routes discovered.`);
  } catch (error) {
    console.warn('Dynamic Firestore routes could not be loaded. Static sitemap/prerender routes will still be generated.', error);
  }

  const ordered = Array.from(routes.values()).sort((a, b) => a.path.localeCompare(b.path));
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...ordered.map(route => {
      const loc = route.path === '/' ? `${siteUrl}/` : `${siteUrl}${route.path}`;
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

  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  const routeFile = join(distDir, 'prerender-routes.json');
  mkdirSync(dirname(routeFile), { recursive: true });
  writeFileSync(join(distDir, 'sitemap.xml'), sitemap);
  writeFileSync(join(distDir, 'robots.txt'), robots);
  writeFileSync(routeFile, JSON.stringify(ordered, null, 2));

  console.log(`Generated sitemap.xml, robots.txt and ${ordered.length} prerender routes (${ordered.filter(item => item.source !== 'static').length} dynamic).`);
}

await main();
