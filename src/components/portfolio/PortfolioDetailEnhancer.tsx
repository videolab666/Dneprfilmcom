import { useEffect, useState, type ReactNode } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { INITIAL_CASES } from '../../data/initialCases';
import type { CaseStudy } from '../../types';
import { getCaseSlug, getMediaPreview, normalizedCaseMedia } from '../../lib/caseMedia';
import {
  galleryCover,
  getGallerySlug,
  isPhotoGallery,
  localizeGallery,
  type PhotoGallery,
} from '../../lib/galleryContent';
import {
  getVideoProjectSlug,
  isVideoProject,
  localizeVideoProject,
  videoProjectCover,
  type VideoProject,
} from '../../lib/videoPortfolio';
import {
  canonicalUrlForPath,
  removeCanonical,
  removeMeta,
  upsertCanonical,
  upsertMeta,
} from '../../lib/seo';
import { useSiteContent } from '../../context/SiteContentContext';
import { RelatedProjectContent, type RelatedEntityType } from './RelatedProjectContent';

interface PortfolioDetailEnhancerProps {
  type: RelatedEntityType;
  children: ReactNode;
}

type SeoPayload = {
  id: string;
  title: string;
  description: string;
  image: string;
  canonicalPath: string;
  ogType: string;
};

export function PortfolioDetailEnhancer({ type, children }: PortfolioDetailEnhancerProps) {
  const { slug = '' } = useParams();
  const { locale, getLocalizedCase, l } = useSiteContent();
  const [payload, setPayload] = useState<SeoPayload | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResolved(false);
    setPayload(null);

    const load = async () => {
      const decoded = decodeURIComponent(slug);
      try {
        if (type === 'case') {
          const snapshot = await getDocs(collection(db, 'cases'));
          const loaded = snapshot.empty
            ? INITIAL_CASES
            : snapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy));
          const raw = loaded.find(item => item.published !== false && (getCaseSlug(item) === decoded || item.id === decoded)) || null;
          if (!raw || cancelled) return;
          const localized = getLocalizedCase(raw);
          const image = raw.imageUrl || normalizedCaseMedia(raw).map(getMediaPreview).find(Boolean) || '';
          setPayload({
            id: raw.id,
            title: localized.title,
            description: localized.description || localized.result || localized.challenge || '',
            image,
            canonicalPath: `/cases/${encodeURIComponent(getCaseSlug(raw))}`,
            ogType: 'article',
          });
          return;
        }

        const snapshot = await getDocs(collection(db, 'site_settings'));
        const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));

        if (type === 'gallery') {
          const raw = docs.filter(isPhotoGallery).find(item => item.published !== false && (getGallerySlug(item) === decoded || item.id === decoded)) as PhotoGallery | undefined;
          if (!raw || cancelled) return;
          const localized = localizeGallery(raw, locale);
          setPayload({
            id: raw.id,
            title: localized.title,
            description: localized.description || l(`Фотогалерея «${localized.title}»`, `Фотогалерея «${localized.title}»`, `Photo gallery “${localized.title}”`),
            image: galleryCover(raw),
            canonicalPath: `/galleries/${encodeURIComponent(getGallerySlug(raw))}`,
            ogType: 'article',
          });
          return;
        }

        const raw = docs.filter(isVideoProject).find(item => item.published !== false && (getVideoProjectSlug(item) === decoded || item.id === decoded)) as VideoProject | undefined;
        if (!raw || cancelled) return;
        const localized = localizeVideoProject(raw, locale);
        setPayload({
          id: raw.id,
          title: localized.title,
          description: localized.description || localized.result || localized.title,
          image: videoProjectCover(raw),
          canonicalPath: `/videos/${encodeURIComponent(getVideoProjectSlug(raw))}`,
          ogType: 'video.other',
        });
      } catch (error) {
        console.warn('Could not resolve portfolio detail SEO:', error);
      } finally {
        if (!cancelled) setResolved(true);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [type, slug, locale, getLocalizedCase, l]);

  useEffect(() => {
    if (!resolved) return;

    if (!payload) {
      upsertMeta('meta[name="robots"]', { name: 'robots' }, 'noindex, nofollow, noarchive');
      removeCanonical();
      return;
    }

    const title = `${payload.title} — Dneprfilm`;
    const description = payload.description.slice(0, 220);
    const canonical = canonicalUrlForPath(payload.canonicalPath);
    document.title = title;

    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta('meta[name="robots"]', { name: 'robots' }, type === 'video'
      ? 'index, follow, max-image-preview:large, max-video-preview:-1'
      : 'index, follow, max-image-preview:large');
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, payload.ogType);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonical);
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    if (payload.image) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image' }, payload.image);
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, payload.image);
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[name="twitter:image"]');
    }
    upsertCanonical(canonical);
  }, [resolved, payload, type]);

  return (
    <>
      {children}
      {payload && <RelatedProjectContent entityType={type} entityId={payload.id} />}
    </>
  );
}
