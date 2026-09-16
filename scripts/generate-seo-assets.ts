import { existsSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

interface RouteEntry {
  path: string;
  source: 'static' | 'case' | 'gallery' | 'video' | 'article';
}

const routeFile = 'dist/prerender-routes.json';
const snapshotFile = 'dist/portfolio-prerender-data.json';
const delays = [0, 1500, 3500, 7000];
const allowStaticOnly = process.env.SEO_ALLOW_STATIC_ONLY === '1' || process.env.GITHUB_EVENT_NAME === 'pull_request';

function validateSnapshot(): { ok: boolean; filesReady: boolean; routes: number; dynamic: number; records: number } {
  if (!existsSync(routeFile) || !existsSync(snapshotFile)) return { ok: false, filesReady: false, routes: 0, dynamic: 0, records: 0 };
  try {
    const routes = JSON.parse(readFileSync(routeFile, 'utf8')) as RouteEntry[];
    const snapshot = JSON.parse(readFileSync(snapshotFile, 'utf8')) as Record<string, unknown>;
    const dynamic = routes.filter(route => route.source !== 'static').length;
    const records = Object.keys(snapshot).length;
    const filesReady = routes.length > 0 && records === dynamic;
    return { ok: filesReady && dynamic > 0, filesReady, routes: routes.length, dynamic, records };
  } catch {
    return { ok: false, filesReady: false, routes: 0, dynamic: 0, records: 0 };
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
    console.warn(`PR SEO check is using a static-only fallback: ${validation.routes} route(s), ${validation.dynamic} dynamic route(s), ${validation.records} record(s). Production builds remain strict.`);
    process.exit(0);
  }

  console.warn(`SEO snapshot attempt ${attempt} incomplete: process=${result.status ?? 'unknown'}, routes=${validation.routes}, dynamic=${validation.dynamic}, records=${validation.records}.`);
}

throw new Error('Could not build an authoritative Firestore SEO snapshot after all retry attempts. Refusing to continue with a static-only manifest.');
