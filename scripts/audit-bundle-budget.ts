import { gzipSync } from 'node:zlib';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve('dist');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');
const ENTRY_GZIP_BUDGET = 350 * 1024;
const INITIAL_GZIP_BUDGET = 450 * 1024;

if (!existsSync(INDEX_FILE)) {
  throw new Error('dist/index.html is missing; run the production build before the bundle audit.');
}

const html = readFileSync(INDEX_FILE, 'utf8');
const assetRefs = new Set<string>();
const entryRefs: string[] = [];

for (const match of html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["'][^>]*>/gi)) {
  const ref = match[1];
  assetRefs.add(ref);
  entryRefs.push(ref);
}

for (const match of html.matchAll(/<link\b[^>]*rel=["']modulepreload["'][^>]*href=["']([^"']+)["'][^>]*>/gi)) {
  assetRefs.add(match[1]);
}

function resolveAsset(ref: string): string {
  const withoutQuery = ref.split('?')[0].split('#')[0];
  const normalized = withoutQuery.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/Dneprfilmcom\//, '/').replace(/^\//, '');
  return path.join(DIST_DIR, normalized);
}

function sizeOf(ref: string) {
  const file = resolveAsset(ref);
  if (!existsSync(file)) return undefined;
  const source = readFileSync(file);
  return {
    ref,
    bytes: statSync(file).size,
    gzipBytes: gzipSync(source, { level: 9 }).byteLength,
  };
}

const initialAssets = [...assetRefs]
  .filter(ref => /\.js(?:$|[?#])/.test(ref))
  .map(sizeOf)
  .filter((item): item is NonNullable<ReturnType<typeof sizeOf>> => Boolean(item));

const entryAssets = entryRefs
  .map(sizeOf)
  .filter((item): item is NonNullable<ReturnType<typeof sizeOf>> => Boolean(item));

if (entryAssets.length === 0) {
  throw new Error('Could not identify the production module entry in dist/index.html.');
}

const totalInitialGzip = initialAssets.reduce((sum, item) => sum + item.gzipBytes, 0);
const largestEntryGzip = Math.max(...entryAssets.map(item => item.gzipBytes));

const kb = (value: number) => `${(value / 1024).toFixed(1)} kB`;
console.log('Initial production JS assets:');
for (const item of [...initialAssets].sort((a, b) => b.gzipBytes - a.gzipBytes)) {
  console.log(`  ${item.ref}: ${kb(item.bytes)} raw / ${kb(item.gzipBytes)} gzip`);
}
console.log(`Initial JS total: ${kb(totalInitialGzip)} gzip`);
console.log(`Largest entry module: ${kb(largestEntryGzip)} gzip`);

if (largestEntryGzip > ENTRY_GZIP_BUDGET) {
  throw new Error(`Entry bundle regression: ${kb(largestEntryGzip)} exceeds ${kb(ENTRY_GZIP_BUDGET)} gzip.`);
}

if (totalInitialGzip > INITIAL_GZIP_BUDGET) {
  throw new Error(`Initial JS regression: ${kb(totalInitialGzip)} exceeds ${kb(INITIAL_GZIP_BUDGET)} gzip.`);
}

console.log('Bundle performance budget passed.');
