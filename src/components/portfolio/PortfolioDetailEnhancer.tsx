import { useEffect, useState, type ReactNode } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { INITIAL_CASES } from '../../data/initialCases';
import type { CaseStudy, Locale } from '../../types';
import {
  getCaseSlug,
  getMediaPreview,
  getVideoEmbedUrl,
  localizeMediaItem,
  normalizedCaseMedia,
} from '../../lib/caseMedia';
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
  videoEmbedUrl,
  videoMediaPoster,
  videoProjectCover,
  type VideoProject,
} from '../../lib/videoPortfolio';
import {
  applyDetailSeo,
  breadcrumbJsonLd,
  canonicalUrlForPath,
  removeCanonical,
  removeJsonLd,
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
  createdAt?: number | string;
  updatedAt?: number | string;
  jsonLd: Record<string, unknown>;
};

type LocalizedCaseSeo = {
  title: string;
  description: string;
  challenge: string;
  result: string;
  location: string;
  categoryLabel: string;
  client: string;
};

function organizationId(): string {
  return `${canonicalUrlForPath('/').replace(/\/$/, '')}/#organization`;
}

function localizedParentLabel(type: RelatedEntityType, locale: Locale): string {
  if (type === 'case') return locale === 'uk' ? 'Кейси' : locale === 'ru' ? 'Кейсы' : 'Case studies';
  if (type === 'gallery') return locale === 'uk' ? 'Фотогалереї' : locale === 'ru' ? 'Фотогалереи' : 'Photo galleries';
  return locale === 'uk' ? 'Відеопортфоліо' : locale === 'ru' ? 'Видеопортфолио' : 'Video portfolio';
}

function parentPath(type: RelatedEntityType): string {
  if (type === 'case') return '/cases';
  if (type === 'gallery') return '/galleries';
  return '/videos';
}

function homeLabel(locale: Locale): string {
  return locale === 'uk' ? 'Головна' : locale === 'ru' ? 'Главная' : 'Home';
}

function localizeCaseForSeo(raw: CaseStudy, locale: Locale): LocalizedCaseSeo {
  if (locale === 'uk') {
    return {
      title: raw.title_uk || raw.title || raw.title_en || raw.id,
      description: raw.description_uk || raw.description || raw.description_en || '',
      challenge: raw.challenge_uk || raw.challenge || raw.challenge_en || raw.problem_uk || raw.problem || raw.problem_en || '',
      result: raw.result_uk || raw.result || raw.result_en || '',
      location: raw.location_uk || raw.location || raw.location_en || '',
      categoryLabel: raw.categoryLabel_uk || raw.categoryLabel || raw.categoryLabel_en || raw.category,
      client: raw.client || '',
    };
  }

  if (locale === 'en') {
    return {
      title: raw.title_en || raw.title_uk || raw.title || raw.id,
      description: raw.description_en || raw.description_uk || raw.description || '',
      challenge: raw.challenge_en || raw.challenge_uk || raw.challenge || raw.problem_en || raw.problem_uk || raw.problem || '',
      result: raw.result_en || raw.result_uk || raw.result || '',
      location: raw.location_en || raw.location_uk || raw.location || '',
      categoryLabel: raw.categoryLabel_en || raw.categoryLabel_uk || raw.categoryLabel || raw.category,
      client: raw.client || '',
    };
  }

  return {
    title: raw.title || raw.title_uk || raw.title_en || raw.id,
    description: raw.description || raw.description_uk || raw.description_en || '',
    challenge: raw.challenge || raw.challenge_uk || raw.challenge_en || raw.problem || raw.problem_uk || raw.problem_en || '',
    result: raw.result || raw.result_uk || raw.result_en || '',
    location: raw.location || raw.location_uk || raw.location_en || '',
    categoryLabel: raw.categoryLabel || raw.categoryLabel_uk || raw.categoryLabel_en || raw.category,
    client: raw.client || '',
  };
}

function galleryFallbackDescription(title: string, locale: Locale): string {
  if (locale === 'uk') return `Фотогалерея «${title}»`;
  if (locale === 'en') return `Photo gallery “${title}”`;
  return `Фотогалерея «${title}»`;
}

export function PortfolioDetailEnhancer({ type, children }: PortfolioDetailEnhancerProps) {
  const { slug = '' } = useParams();
  const { locale } = useSiteContent();
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
          const localized = localizeCaseForSeo(raw, locale);
          const media = normalizedCaseMedia(raw).map(item => localizeMediaItem(item, locale));
          const image = raw.imageUrl || media.map(getMediaPreview).find(Boolean) || '';
          const canonicalPath = `/cases/${encodeURIComponent(getCaseSlug(raw))}`;
          const canonical = canonicalUrlForPath(canonicalPath);
          const description = localized.description || localized.result || localized.challenge || localized.title;
          const images = Array.from(new Set([
            image,
            ...media.filter(item => item.type === 'image').map(item => item.url),
          ].filter(Boolean)));
          const videos = media.filter(item => item.type !== 'image').map((item, index) => ({
            '@type': 'VideoObject',
            '@id': `${canonical}#video-${index + 1}`,
            name: item.title || `${localized.title} — video ${index + 1}`,
            description: item.caption || description,
            ...(getMediaPreview(item) ? { thumbnailUrl: [getMediaPreview(item)] } : {}),
            ...(getVideoEmbedUrl(item) ? { embedUrl: getVideoEmbedUrl(item) } : {}),
            ...(item.type === 'video' ? { contentUrl: item.url } : {}),
            ...(raw.updatedAt || raw.createdAt ? { uploadDate: new Date(raw.updatedAt || raw.createdAt).toISOString() } : {}),
            publisher: { '@id': organizationId() },
          }));
          const graph: Record<string, unknown>[] = [
            {
              '@type': 'CreativeWork',
              '@id': `${canonical}#case`,
              url: canonical,
              name: localized.title,
              headline: localized.title,
              description,
              ...(images.length ? { image: images } : {}),
              ...(raw.createdAt ? { datePublished: new Date(raw.createdAt).toISOString() } : {}),
              ...(raw.updatedAt || raw.createdAt ? { dateModified: new Date(raw.updatedAt || raw.createdAt).toISOString() } : {}),
              ...(localized.client ? { about: { '@type': 'Organization', name: localized.client } } : {}),
              ...(localized.categoryLabel || raw.category ? { genre: localized.categoryLabel || raw.category } : {}),
              ...(localized.location ? { locationCreated: { '@type': 'Place', name: localized.location } } : {}),
              creator: { '@id': organizationId() },
              publisher: { '@id': organizationId() },
              ...(videos.length ? { video: videos.map(video => ({ '@id': video['@id'] })) } : {}),
            },
            breadcrumbJsonLd([
              { name: homeLabel(locale), path: '/' },
              { name: localizedParentLabel(type, locale), path: parentPath(type) },
              { name: localized.title, path: canonicalPath },
            ]),
            ...videos,
          ];
          if (cancelled) return;
          setPayload({
            id: raw.id,
            title: localized.title,
            description,
            image,
            canonicalPath,
            ogType: 'article',
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt || raw.createdAt,
            jsonLd: { '@context': 'https://schema.org', '@graph': graph.map(item => {
              const { ['@context']: _context, ...rest } = item;
              return rest;
            }) },
          });
          return;
        }

        const snapshot = await getDocs(collection(db, 'site_settings'));
        const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));

        if (type === 'gallery') {
          const raw = docs.filter(isPhotoGallery).find(item => item.published !== false && (getGallerySlug(item) === decoded || item.id === decoded)) as PhotoGallery | undefined;
          if (!raw || cancelled) return;
          const localized = localizeGallery(raw, locale);
          const canonicalPath = `/galleries/${encodeURIComponent(getGallerySlug(raw))}`;
          const canonical = canonicalUrlForPath(canonicalPath);
          const description = localized.description || galleryFallbackDescription(localized.title, locale);
          const imageObjects = localized.images.slice(0, 100).map((image, index) => ({
            '@type': 'ImageObject',
            '@id': `${canonical}#image-${index + 1}`,
            contentUrl: image.url,
            name: image.alt || localized.title,
            ...(image.caption ? { caption: image.caption } : {}),
            ...(index === 0 ? { representativeOfPage: true } : {}),
          }));
          const graph: Record<string, unknown>[] = [
            {
              '@type': 'ImageGallery',
              '@id': `${canonical}#gallery`,
              url: canonical,
              name: localized.title,
              description,
              ...(raw.date ? { dateCreated: raw.date } : {}),
              ...(raw.updatedAt || raw.createdAt ? { dateModified: new Date(raw.updatedAt || raw.createdAt).toISOString() } : {}),
              ...(localized.location ? { contentLocation: { '@type': 'Place', name: localized.location } } : {}),
              provider: { '@id': organizationId() },
              image: imageObjects.map(image => ({ '@id': image['@id'] })),
            },
            breadcrumbJsonLd([
              { name: homeLabel(locale), path: '/' },
              { name: localizedParentLabel(type, locale), path: parentPath(type) },
              { name: localized.title, path: canonicalPath },
            ]),
            ...imageObjects,
          ];
          if (cancelled) return;
          setPayload({
            id: raw.id,
            title: localized.title,
            description,
            image: galleryCover(raw),
            canonicalPath,
            ogType: 'article',
            createdAt: raw.date || raw.createdAt,
            updatedAt: raw.updatedAt || raw.createdAt,
            jsonLd: { '@context': 'https://schema.org', '@graph': graph.map(item => {
              const { ['@context']: _context, ...rest } = item;
              return rest;
            }) },
          });
          return;
        }

        const raw = docs.filter(isVideoProject).find(item => item.published !== false && (getVideoProjectSlug(item) === decoded || item.id === decoded)) as VideoProject | undefined;
        if (!raw || cancelled) return;
        const localized = localizeVideoProject(raw, locale);
        const canonicalPath = `/videos/${encodeURIComponent(getVideoProjectSlug(raw))}`;
        const canonical = canonicalUrlForPath(canonicalPath);
        const description = localized.description || localized.result || localized.title;
        const cover = videoProjectCover(raw);
        const videoObjects = localized.videos.map((media, index) => {
          const embed = videoEmbedUrl(media);
          const poster = videoMediaPoster(media) || cover;
          return {
            '@type': 'VideoObject',
            '@id': `${canonical}#video-${index + 1}`,
            name: media.title || localized.title,
            description: media.caption || description,
            ...(poster ? { thumbnailUrl: [poster] } : {}),
            ...(raw.date || raw.createdAt ? { uploadDate: raw.date || new Date(raw.createdAt).toISOString() } : {}),
            ...(embed ? { embedUrl: embed } : {}),
            ...(media.type === 'video' ? { contentUrl: media.url } : {}),
            publisher: { '@id': organizationId() },
          };
        });
        const graph: Record<string, unknown>[] = [
          {
            '@type': 'CollectionPage',
            '@id': `${canonical}#project`,
            url: canonical,
            name: localized.title,
            description,
            ...(cover ? { primaryImageOfPage: { '@type': 'ImageObject', contentUrl: cover } } : {}),
            ...(raw.createdAt ? { datePublished: new Date(raw.createdAt).toISOString() } : {}),
            ...(raw.updatedAt || raw.createdAt ? { dateModified: new Date(raw.updatedAt || raw.createdAt).toISOString() } : {}),
            publisher: { '@id': organizationId() },
            mainEntity: videoObjects.map(video => ({ '@id': video['@id'] })),
          },
          breadcrumbJsonLd([
            { name: homeLabel(locale), path: '/' },
            { name: localizedParentLabel(type, locale), path: parentPath(type) },
            { name: localized.title, path: canonicalPath },
          ]),
          ...videoObjects,
        ];
        if (cancelled) return;
        setPayload({
          id: raw.id,
          title: localized.title,
          description,
          image: cover,
          canonicalPath,
          ogType: 'video.other',
          createdAt: raw.date || raw.createdAt,
          updatedAt: raw.updatedAt || raw.createdAt,
          jsonLd: { '@context': 'https://schema.org', '@graph': graph.map(item => {
            const { ['@context']: _context, ...rest } = item;
            return rest;
          }) },
        });
      } catch (error) {
        console.warn('Could not resolve portfolio detail SEO:', error);
      } finally {
        if (!cancelled) setResolved(true);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [type, slug, locale]);

  useEffect(() => {
    if (!resolved) return;

    if (!payload) {
      upsertMeta('meta[name="robots"]', { name: 'robots' }, 'noindex, nofollow, noarchive');
      removeCanonical();
      removeJsonLd('detail-seo-jsonld');
      return;
    }

    return applyDetailSeo({
      title: `${payload.title} — Dneprfilm`,
      description: payload.description,
      path: payload.canonicalPath,
      image: payload.image,
      imageAlt: payload.title,
      ogType: payload.ogType,
      datePublished: payload.createdAt,
      dateModified: payload.updatedAt,
      allowVideoPreview: type === 'video',
      jsonLd: payload.jsonLd,
    });
  }, [resolved, payload, type]);

  return (
    <>
      {children}
      {payload && <RelatedProjectContent entityType={type} entityId={payload.id} />}
    </>
  );
}
