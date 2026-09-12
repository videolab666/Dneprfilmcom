import type { Locale } from '../types';
import { slugifyCase } from './caseMedia';

export const GALLERY_COLLECTION = 'site_settings';
export const GALLERY_KIND = 'gallery' as const;

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
  published?: boolean;
  order?: number;
  createdAt: number;
  updatedAt?: number;
}

export function isPhotoGallery(value: unknown): value is PhotoGallery {
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
  return {
    ...image,
    alt: localizedValue(locale, image.alt, image.alt_uk, image.alt_en),
    caption: localizedValue(locale, image.caption, image.caption_uk, image.caption_en),
  };
}

export function localizeGallery(gallery: PhotoGallery, locale: Locale): PhotoGallery {
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
