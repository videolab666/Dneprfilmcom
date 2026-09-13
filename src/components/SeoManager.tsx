import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext';
import {
  NOT_FOUND_SEO,
  STATIC_SEO,
  canonicalUrlForPath,
  dynamicPortfolioTypeForPath,
  normalizeRoutePath,
  removeCanonical,
  removeMeta,
  upsertCanonical,
  upsertMeta,
} from '../lib/seo';

export function SeoManager() {
  const location = useLocation();
  const { locale } = useSiteContent();

  useEffect(() => {
    const path = normalizeRoutePath(location.pathname);
    const isAdmin = path === '/admin' || path.startsWith('/admin/');
    const dynamicType = dynamicPortfolioTypeForPath(path);
    const staticEntry = STATIC_SEO[path];
    const isKnownStatic = Boolean(staticEntry);
    const isNotFound = !isAdmin && !isKnownStatic && !dynamicType;

    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, 'Dneprfilm');
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, locale === 'uk' ? 'uk_UA' : locale === 'ru' ? 'ru_UA' : 'en_US');
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');

    if (dynamicType) {
      // Dynamic detail pages validate the Firestore document themselves before switching to index/follow.
      // This prevents a non-existent /cases/foo, /videos/foo or /galleries/foo URL from being indexed.
      upsertMeta('meta[name="robots"]', { name: 'robots' }, 'noindex, follow');
      removeCanonical();
      return;
    }

    if (isAdmin) {
      document.title = 'Admin — Dneprfilm';
      upsertMeta('meta[name="description"]', { name: 'description' }, 'Dneprfilm administration panel.');
      upsertMeta('meta[name="robots"]', { name: 'robots' }, 'noindex, nofollow, noarchive');
      removeCanonical();
      removeMeta('meta[property="og:image"]');
      return;
    }

    const entry = isNotFound ? NOT_FOUND_SEO[locale] : (staticEntry?.[locale] ?? STATIC_SEO['/'][locale]);
    document.title = entry.title;
    upsertMeta('meta[name="description"]', { name: 'description' }, entry.description);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, entry.title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, entry.description);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, entry.title);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, entry.description);
    removeMeta('meta[property="og:image"]');
    removeMeta('meta[name="twitter:image"]');

    if (isNotFound) {
      upsertMeta('meta[name="robots"]', { name: 'robots' }, 'noindex, nofollow, noarchive');
      removeCanonical();
      return;
    }

    const canonical = canonicalUrlForPath(path);
    upsertMeta('meta[name="robots"]', { name: 'robots' }, 'index, follow, max-image-preview:large');
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonical);
    upsertCanonical(canonical);
  }, [location.pathname, locale]);

  return null;
}
