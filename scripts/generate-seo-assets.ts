import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
}

interface RouteEntry {
  path: string;
  lastmod?: string;
  source: 'static' | 'case' | 'gallery' | 'video';
}

type FirestoreValue = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
};

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

function decodeValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(decodeValue);
  if (value.mapValue) return decodeFields(value.mapValue.fields || {});
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

function asLastmod(value: unknown, fallback?: string): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value).toISOString().slice(0, 10);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  if (fallback) {
    const parsed = new Date(fallback);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return undefined;
}

async function fetchJsonWithRetry(url: string, attempts = 3): Promise<any> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${(await response.text()).slice(0, 240)}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, 700 * attempt));
    }
  }
  throw lastError;
}

async function listCollection(config: FirebaseConfig, collectionId: string): Promise<FirestoreDocument[]> {
  const database = config.firestoreDatabaseId || '(default)';
  const documents: FirestoreDocument[] = [];
  let pageToken = '';

  do {
    const endpoint = new URL(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${database}/documents/${collectionId}`);
    endpoint.searchParams.set('pageSize', '300');
    if (pageToken) endpoint.searchParams.set('pageToken', pageToken);

    let payload: any;
    try {
      const withKey = new URL(endpoint);
      withKey.searchParams.set('key', config.apiKey);
      payload = await fetchJsonWithRetry(withKey.toString());
    } catch (keyError) {
      console.warn(`Firestore request with API key failed for ${collectionId}; retrying public REST access.`, keyError);
      payload = await fetchJsonWithRetry(endpoint.toString());
    }

    documents.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return documents;
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

async function main() {
  const distDir = 'dist';
  mkdirSync(distDir, { recursive: true });

  const config = JSON.parse(readFileSync('firebase-applet-config.json', 'utf8')) as FirebaseConfig;
  const siteUrl = (process.env.SITE_URL || 'https://videolab666.github.io/Dneprfilmcom').replace(/\/+$/, '');
  const routes = new Map<string, RouteEntry>();

  discoverStaticRoutes().forEach(path => routes.set(path, { path, source: 'static' }));

  try {
    const [caseDocs, settingDocs] = await Promise.all([
      listCollection(config, 'cases'),
      listCollection(config, 'site_settings'),
    ]);

    caseDocs.forEach(document => {
      const data = decodeFields(document.fields || {});
      if (data.published === false) return;
      const id = document.name.split('/').pop() || '';
      const slug = caseSlug(data, id);
      const path = `/cases/${encodeURIComponent(slug)}`;
      routes.set(path, { path, source: 'case', lastmod: asLastmod(data.updatedAt ?? data.createdAt, document.updateTime) });
    });

    settingDocs.forEach(document => {
      const data = decodeFields(document.fields || {});
      if (data.published === false) return;
      const id = document.name.split('/').pop() || '';
      if (data.kind === 'gallery') {
        const path = `/galleries/${encodeURIComponent(projectSlug(data, id))}`;
        routes.set(path, { path, source: 'gallery', lastmod: asLastmod(data.updatedAt ?? data.createdAt, document.updateTime) });
      }
      if (data.kind === 'video_project') {
        const path = `/videos/${encodeURIComponent(projectSlug(data, id))}`;
        routes.set(path, { path, source: 'video', lastmod: asLastmod(data.updatedAt ?? data.createdAt, document.updateTime) });
      }
    });
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
