import type { Locale } from '../types';
import { PAGE_ITEM_EN_BY_ID } from '../locales/pageEnglish';
import { translateEnglishValue } from '../locales/legacyEnglish';
import { slugifyCase } from './caseMedia';

export const GALLERY_COLLECTION = 'site_settings';
export const GALLERY_KIND = 'gallery' as const;

export type GalleryLayout = 'masonry' | 'grid' | 'justified' | 'cinematic';
export type GalleryAspect = 'original' | '4:3' | '3:2' | '1:1';
export type GalleryGap = 'small' | 'medium' | 'large';
export type GalleryCaptionMode = 'always' | 'hover' | 'lightbox';

export interface GalleryDisplaySettings {
  layout: GalleryLayout;
  columns: 2 | 3 | 4;
  gap: GalleryGap;
  aspect: GalleryAspect;
  captionMode: GalleryCaptionMode;
}

export interface GalleryImage {
  id: string;
  url: string;
  cloudinaryPublicId?: string;
  alt?: string;
  alt_uk?: string;
  alt_en?: string;
  caption?: string;
  caption_uk?: string;
  caption_en?: string;
  featured?: boolean;
  focalX?: number;
  focalY?: number;
}

export interface PhotoGallery {
  id: string;
  kind: typeof GALLERY_KIND;
  slug?: string;
  title: string;
  title_uk?: string;
  title_en?: string;
  description?: string;
  description_uk?: string;
  description_en?: string;
  location?: string;
  location_uk?: string;
  location_en?: string;
  date?: string;
  coverUrl?: string;
  images: GalleryImage[];
  layout?: GalleryLayout;
  columns?: 2 | 3 | 4;
  gap?: GalleryGap;
  aspect?: GalleryAspect;
  captionMode?: GalleryCaptionMode;
  published?: boolean;
  order?: number;
  createdAt: number;
  updatedAt?: number;
}

const CYRILLIC_RE = /[А-Яа-яЁёІіЇїЄєҐґ]/;
const LEGACY_GALLERY_EN: Record<string, { title: string; firstPhotoKey: string }> = {
  interior: { title: 'Interiors & Architecture', firstPhotoKey: 'photo-int-1' },
  food: { title: 'Food Photography & Menu', firstPhotoKey: 'photo-food-1' },
  kids: { title: "Children's Events", firstPhotoKey: 'photo-kids-1' },
  wedding: { title: 'Weddings & Love Story', firstPhotoKey: 'photo-wed-1' },
  corporate: { title: 'Business & Event Coverage', firstPhotoKey: 'photo-corp-1' },
};

function cleanEnglish(value: string | undefined): string | undefined {
  const text = String(value || '').trim();
  return text && !CYRILLIC_RE.test(text) ? text : undefined;
}

function translatedEnglish(value: string | undefined): string | undefined {
  const source = String(value || '').trim();
  if (!source) return undefined;
  const translated = String(translateEnglishValue(source) || '').trim();
  return translated && !CYRILLIC_RE.test(translated) ? translated : undefined;
}

function englishValue(explicit: string | undefined, curated: string | undefined, source: string | undefined, generic = ''): string {
  return cleanEnglish(explicit) || cleanEnglish(curated) || translatedEnglish(source) || generic;
}

function legacyGalleryMeta(gallery: PhotoGallery) {
  if (!gallery.id.startsWith('legacy-gallery-')) return undefined;
  const key = gallery.id.slice('legacy-gallery-'.length);
  return LEGACY_GALLERY_EN[key];
}

function legacyImageKey(image: GalleryImage): string | undefined {
  const match = image.id.match(/^legacy-(photo-[a-z]+-\d+)-\d+$/i);
  return match?.[1];
}

export function galleryDisplaySettings(gallery: PhotoGallery): GalleryDisplaySettings {
  return {
    layout: gallery.layout || 'masonry',
    columns: gallery.columns === 2 || gallery.columns === 4 ? gallery.columns : 3,
    gap: gallery.gap || 'medium',
    aspect: gallery.aspect || 'original',
    captionMode: gallery.captionMode || 'always',
  };
}

export function imageFocalPoint(image: GalleryImage): string {
  const x = Math.max(0, Math.min(100, Number.isFinite(image.focalX) ? Number(image.focalX) : 50));
  const y = Math.max(0, Math.min(100, Number.isFinite(image.focalY) ? Number(image.focalY) : 50));
  return `${x}% ${y}%`;
}

export function isPhotoGallery(value: unknown): value is PhotoGallery & Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PhotoGallery>;
  return candidate.kind === GALLERY_KIND && typeof candidate.id === 'string';
}

export function getGallerySlug(gallery: PhotoGallery): string {
  const source = gallery.slug?.trim()
    || gallery.title_uk?.trim()
    || gallery.title?.trim()
    || gallery.title_en?.trim()
    || gallery.id;
  return slugifyCase(source);
}

export function getGalleryPath(gallery: PhotoGallery): string {
  return `/galleries/${getGallerySlug(gallery)}`;
}

function localizedValue(
  locale: Locale,
  base?: string,
  uk?: string,
  en?: string,
): string {
  if (locale === 'uk') return uk || base || en || '';
  if (locale === 'en') return en || uk || base || '';
  return base || uk || en || '';
}

export function localizeGalleryImage(image: GalleryImage, locale: Locale): GalleryImage {
  if (locale === 'en') {
    const key = legacyImageKey(image);
    const curated = key ? PAGE_ITEM_EN_BY_ID[key] : undefined;
    return {
      ...image,
      alt: englishValue(image.alt_en, curated?.title, image.alt_uk || image.alt, 'Photo'),
      caption: englishValue(image.caption_en, curated?.description, image.caption_uk || image.caption),
    };
  }

  return {
    ...image,
    alt: localizedValue(locale, image.alt, image.alt_uk, image.alt_en),
    caption: localizedValue(locale, image.caption, image.caption_uk, image.caption_en),
  };
}

export function localizeGallery(gallery: PhotoGallery, locale: Locale): PhotoGallery {
  if (locale === 'en') {
    const legacy = legacyGalleryMeta(gallery);
    const firstCopy = legacy ? PAGE_ITEM_EN_BY_ID[legacy.firstPhotoKey] : undefined;
    return {
      ...gallery,
      title: englishValue(gallery.title_en, legacy?.title, gallery.title_uk || gallery.title, 'Photo gallery'),
      description: englishValue(gallery.description_en, firstCopy?.description, gallery.description_uk || gallery.description),
      location: englishValue(gallery.location_en, firstCopy?.meta2, gallery.location_uk || gallery.location),
      images: (gallery.images || []).map(image => localizeGalleryImage(image, locale)),
    };
  }

  return {
    ...gallery,
    title: localizedValue(locale, gallery.title, gallery.title_uk, gallery.title_en),
    description: localizedValue(locale, gallery.description, gallery.description_uk, gallery.description_en),
    location: localizedValue(locale, gallery.location, gallery.location_uk, gallery.location_en),
    images: (gallery.images || []).map(image => localizeGalleryImage(image, locale)),
  };
}

export function galleryCover(gallery: PhotoGallery): string {
  return gallery.coverUrl || gallery.images?.[0]?.url || '';
}

export function sortGalleries(items: PhotoGallery[]): PhotoGallery[] {
  return [...items].sort((a, b) => {
    const orderDelta = (a.order ?? 9999) - (b.order ?? 9999);
    if (orderDelta !== 0) return orderDelta;
    const dateDelta = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateDelta !== 0) return dateDelta;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}
