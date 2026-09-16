import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

interface RouteEntry {
  path: string;
  source: 'static' | 'case' | 'gallery' | 'video' | 'article';
}

const routeFile = 'dist/prerender-routes.json';
const snapshotFile = 'dist/portfolio-prerender-data.json';
const delays = [0, 1500, 3500, 7000];
const allowStaticOnly = process.env.SEO_ALLOW_STATIC_ONLY === '1' || process.env.GITHUB_EVENT_NAME === 'pull_request';
const siteUrl = (process.env.SITE_URL || 'https://videolab666.github.io/Dneprfilmcom').replace(/\/+$/, '');

function validatePayload(routes: RouteEntry[], snapshot: Record<string, unknown>) {
  const dynamicPaths = routes.filter(route => route.source !== 'static').map(route => route.path);
  const dynamic = dynamicPaths.length;
  const snapshotKeys = Object.keys(snapshot);
  const records = snapshotKeys.length;
  const dynamicSet = new Set(dynamicPaths);
  const snapshotSet = new Set(snapshotKeys);
  const missing = dynamicPaths.filter(path => !snapshotSet.has(path));
  const unexpected = snapshotKeys.filter(path => !dynamicSet.has(path));
  const filesReady = routes.length > 0 && records === dynamic && missing.length === 0 && unexpected.length === 0;
  return {
    ok: filesReady && dynamic > 0,
    filesReady,
    routes: routes.length,
    dynamic,
    records,
    missing,
    unexpected,
  };
}

function validateSnapshot(): { ok: boolean; filesReady: boolean; routes: number; dynamic: number; records: number } {
  if (!existsSync(routeFile) || !existsSync(snapshotFile)) return { ok: false, filesReady: false, routes: 0, dynamic: 0, records: 0 };
  try {
    const routes = JSON.parse(readFileSync(routeFile, 'utf8')) as RouteEntry[];
    const snapshot = JSON.parse(readFileSync(snapshotFile, 'utf8')) as Record<string, unknown>;
    const validation = validatePayload(routes, snapshot);
    return {
      ok: validation.ok,
      filesReady: validation.filesReady,
      routes: validation.routes,
      dynamic: validation.dynamic,
      records: validation.records,
    };
  } catch {
    return { ok: false, filesReady: false, routes: 0, dynamic: 0, records: 0 };
  }
}

async function fetchText(path: string): Promise<string> {
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`${siteUrl}/${path}${separator}seoFallback=${Date.now()}`, {
    headers: { accept: 'application/json,text/xml,text/plain,*/*' },
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
}

async function restoreLastDeployedSnapshot(allowInPullRequest = false): Promise<boolean> {
  if (allowStaticOnly && !allowInPullRequest) return false;
  console.warn(`Live Firestore SEO snapshot is unavailable. Trying the last successfully deployed snapshot from ${siteUrl}.`);
  try {
    const [routesText, snapshotText, sitemapText, imageSitemapText] = await Promise.all([
      fetchText('prerender-routes.json'),
      fetchText('portfolio-prerender-data.json'),
      fetchText('sitemap.xml'),
      fetchText('sitemap-images.xml'),
    ]);
    const routes = JSON.parse(routesText) as RouteEntry[];
    const snapshot = JSON.parse(snapshotText) as Record<string, unknown>;
    const validation = validatePayload(routes, snapshot);
    if (!validation.ok) {
      throw new Error(`deployed snapshot failed validation: routes=${validation.routes}, dynamic=${validation.dynamic}, records=${validation.records}, missing=${validation.missing.length}, unexpected=${validation.unexpected.length}`);
    }
    if (!sitemapText.includes('<urlset') || !imageSitemapText.includes('<urlset')) {
      throw new Error('deployed sitemap payload is invalid');
    }

    writeFileSync(routeFile, routesText);
    writeFileSync(snapshotFile, snapshotText);
    writeFileSync('dist/sitemap.xml', sitemapText);
    writeFileSync('dist/sitemap-images.xml', imageSitemapText);
    console.warn(`Using last-known-good deployed SEO snapshot: ${validation.dynamic} dynamic route(s), ${validation.records} record(s). Public runtime content is unchanged; a later successful Firestore build will refresh this snapshot.`);
    return true;
  } catch (error) {
    console.error('Last deployed SEO snapshot fallback failed.', error);
    return false;
  }
}

for (let index = 0; index < delays.length; index += 1) {
  if (delays[index] > 0) await new Promise(resolve => setTimeout(resolve, delays[index]));
  rmSync(routeFile, { force: true });
  rmSync(snapshotFile, { force: true });

  const attempt = index + 1;
  console.log(`SEO snapshot attempt ${attempt}/${delays.length}...`);
  const result = spawnSync('bun', ['scripts/generate-seo-assets-once.ts'], {
    stdio: 'inherit',
    env: process.env,
  });
  const validation = validateSnapshot();

  if (result.status === 0 && validation.ok) {
    console.log(`SEO snapshot ready on attempt ${attempt}: ${validation.dynamic} dynamic route(s), ${validation.records} record(s).`);
    process.exit(0);
  }

  if (result.status === 0 && allowStaticOnly && validation.filesReady) {
    if (await restoreLastDeployedSnapshot(true)) process.exit(0);
    console.warn(`PR SEO check is using a static-only fallback because neither Firestore nor the last deployed snapshot was available: ${validation.routes} route(s), ${validation.dynamic} dynamic route(s), ${validation.records} record(s). Production builds remain strict.`);
    process.exit(0);
  }

  console.warn(`SEO snapshot attempt ${attempt} incomplete: process=${result.status ?? 'unknown'}, routes=${validation.routes}, dynamic=${validation.dynamic}, records=${validation.records}.`);
}

if (await restoreLastDeployedSnapshot()) process.exit(0);

throw new Error('Could not build an authoritative Firestore SEO snapshot and could not validate the last deployed dynamic snapshot. Refusing to continue with a static-only manifest.');
