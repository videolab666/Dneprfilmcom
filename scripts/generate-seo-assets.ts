import { existsSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

interface RouteEntry {
  path: string;
  source: 'static' | 'case' | 'gallery' | 'video' | 'article';
}

const routeFile = 'dist/prerender-routes.json';
const snapshotFile = 'dist/portfolio-prerender-data.json';
const delays = [0, 1500, 3500, 7000];

function validateDynamicSnapshot(): { ok: boolean; dynamic: number; records: number } {
  if (!existsSync(routeFile) || !existsSync(snapshotFile)) return { ok: false, dynamic: 0, records: 0 };
  try {
    const routes = JSON.parse(readFileSync(routeFile, 'utf8')) as RouteEntry[];
    const snapshot = JSON.parse(readFileSync(snapshotFile, 'utf8')) as Record<string, unknown>;
    const dynamic = routes.filter(route => route.source !== 'static').length;
    const records = Object.keys(snapshot).length;
    return { ok: dynamic > 0 && records === dynamic, dynamic, records };
  } catch {
    return { ok: false, dynamic: 0, records: 0 };
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
  const validation = validateDynamicSnapshot();

  if (result.status === 0 && validation.ok) {
    console.log(`SEO snapshot ready on attempt ${attempt}: ${validation.dynamic} dynamic route(s), ${validation.records} record(s).`);
    process.exit(0);
  }

  console.warn(`SEO snapshot attempt ${attempt} incomplete: process=${result.status ?? 'unknown'}, dynamic=${validation.dynamic}, records=${validation.records}.`);
}

throw new Error('Could not build an authoritative Firestore SEO snapshot after all retry attempts. Refusing to continue with a static-only manifest.');
