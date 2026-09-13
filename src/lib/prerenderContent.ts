export type PrerenderPortfolioSource = 'case' | 'gallery' | 'video';

export interface PrerenderPortfolioEntry {
  source: PrerenderPortfolioSource;
  id: string;
  data: Record<string, unknown>;
}

type PrerenderPortfolioManifest = Record<string, PrerenderPortfolioEntry>;

let manifestPromise: Promise<PrerenderPortfolioManifest | null> | null = null;

function isPrerenderRequest(): boolean {
  if (typeof window === 'undefined') return false;
  return new URL(window.location.href).searchParams.get('__prerender') === '1';
}

async function loadManifest(): Promise<PrerenderPortfolioManifest | null> {
  if (!isPrerenderRequest()) return null;
  if (manifestPromise) return manifestPromise;

  const base = String(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  manifestPromise = fetch(`${base}portfolio-prerender-data.json`, { cache: 'no-store' })
    .then(async response => {
      if (!response.ok) throw new Error(`Prerender content snapshot returned HTTP ${response.status}`);
      return await response.json() as PrerenderPortfolioManifest;
    })
    .catch(error => {
      console.warn('Could not load prerender content snapshot; falling back to Firestore.', error);
      return null;
    });

  return manifestPromise;
}

export async function loadPrerenderPortfolioEntry(
  source: PrerenderPortfolioSource,
  decodedSlug: string,
): Promise<PrerenderPortfolioEntry | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;

  const prefix = source === 'case' ? '/cases/' : source === 'gallery' ? '/galleries/' : '/videos/';
  const path = `${prefix}${encodeURIComponent(decodedSlug)}`;
  const entry = manifest[path];
  return entry?.source === source ? entry : null;
}
