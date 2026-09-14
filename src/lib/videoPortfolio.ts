import type { Locale } from '../types';
import { PAGE_ITEM_EN_BY_ID } from '../locales/pageEnglish';
import { translateEnglishValue } from '../locales/legacyEnglish';
import {
  extractVimeoId,
  extractYouTubeId,
  getYouTubeThumbnail,
  slugifyCase,
} from './caseMedia';

export const VIDEO_PROJECT_COLLECTION = 'site_settings';
export const VIDEO_PROJECT_KIND = 'video_project' as const;

export type VideoProjectMediaType = 'youtube' | 'vimeo' | 'video';
export type VideoProjectFormat = '16:9' | '9:16' | '1:1';

export interface VideoProjectMedia {
  id: string;
  type: VideoProjectMediaType;
  url: string;
  posterUrl?: string;
  cloudinaryPublicId?: string;
  format?: VideoProjectFormat;
  title?: string;
  title_uk?: string;
  title_en?: string;
  caption?: string;
  caption_uk?: string;
  caption_en?: string;
}

export interface VideoProject {
  id: string;
  kind: typeof VIDEO_PROJECT_KIND;
  slug?: string;
  title: string;
  title_uk?: string;
  title_en?: string;
  client?: string;
  client_uk?: string;
  client_en?: string;
  category?: string;
  category_uk?: string;
  category_en?: string;
  description?: string;
  description_uk?: string;
  description_en?: string;
  result?: string;
  result_uk?: string;
  result_en?: string;
  location?: string;
  location_uk?: string;
  location_en?: string;
  date?: string;
  coverUrl?: string;
  coverCloudinaryPublicId?: string;
  tags?: string[];
  tags_uk?: string[];
  tags_en?: string[];
  videos: VideoProjectMedia[];
  published?: boolean;
  featured?: boolean;
  order?: number;
  createdAt: number;
  updatedAt?: number;
}

const CYRILLIC_RE = /[А-Яа-яЁёІіЇїЄєҐґ]/;

function cleanEnglish(value: string | undefined): string | undefined {
  const text = String(value || '').trim();
  return text && !CYRILLIC_RE.test(text) ? text : undefined;
}

function cleanEnglishList(value: string[] | undefined): string[] | undefined {
  if (!value?.length) return undefined;
  const cleaned = value.map(item => item.trim()).filter(item => item && !CYRILLIC_RE.test(item));
  return cleaned.length === value.length ? cleaned : undefined;
}

function translatedEnglish(value: string | undefined): string | undefined {
  const source = String(value || '').trim();
  if (!source) return undefined;
  const translated = String(translateEnglishValue(source) || '').trim();
  return translated && !CYRILLIC_RE.test(translated) ? translated : undefined;
}

function legacyPageKey(project: VideoProject): string | undefined {
  if (project.id.startsWith('legacy-video-')) return project.id.slice('legacy-video-'.length);

  const haystack = `${project.id} ${project.title} ${project.title_uk || ''}`.toLowerCase();
  if (haystack.includes('girtech')) return 'girtech';
  if (haystack.includes('ministry') || haystack.includes('міністер') || haystack.includes('министер')) return 'ministry-doors';
  if (haystack.includes('ulka')) return 'ulka-dubai';
  if (haystack.includes('helios') || haystack.includes('геліос') || haystack.includes('гелиос')) return 'helios-medical';
  if (haystack.includes('hyamax')) return 'hyamax-conf';
  if (haystack.includes('fit4you')) return 'fit4you';
  return undefined;
}

function englishProjectValue(
  explicit: string | undefined,
  curated: string | undefined,
  source: string | undefined,
  generic = '',
): string {
  return cleanEnglish(explicit)
    || cleanEnglish(curated)
    || translatedEnglish(source)
    || generic;
}

function englishProjectList(
  explicit: string[] | undefined,
  curated: string[] | undefined,
  source: string[] | undefined,
): string[] {
  const direct = cleanEnglishList(explicit) || cleanEnglishList(curated);
  if (direct) return direct;
  return (source || [])
    .map(item => translatedEnglish(item))
    .filter((item): item is string => Boolean(item));
}

export function isVideoProject(value: unknown): value is VideoProject & Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<VideoProject>;
  return candidate.kind === VIDEO_PROJECT_KIND && typeof candidate.id === 'string';
}

export function getVideoProjectSlug(project: VideoProject): string {
  const source = project.slug?.trim()
    || project.title_uk?.trim()
    || project.title?.trim()
    || project.title_en?.trim()
    || project.id;
  return slugifyCase(source);
}

export function getVideoProjectPath(project: VideoProject): string {
  return `/videos/${getVideoProjectSlug(project)}`;
}

function localizedValue(locale: Locale, base?: string, uk?: string, en?: string): string {
  if (locale === 'uk') return uk || base || en || '';
  if (locale === 'en') return en || uk || base || '';
  return base || uk || en || '';
}

function localizedList(locale: Locale, base?: string[], uk?: string[], en?: string[]): string[] {
  if (locale === 'uk') return uk?.length ? uk : base?.length ? base : en || [];
  if (locale === 'en') return en?.length ? en : uk?.length ? uk : base || [];
  return base?.length ? base : uk?.length ? uk : en || [];
}

export function localizeVideoMedia(media: VideoProjectMedia, locale: Locale): VideoProjectMedia {
  if (locale === 'en') {
    return {
      ...media,
      title: englishProjectValue(media.title_en, undefined, media.title_uk || media.title),
      caption: englishProjectValue(media.caption_en, undefined, media.caption_uk || media.caption),
    };
  }

  return {
    ...media,
    title: localizedValue(locale, media.title, media.title_uk, media.title_en),
    caption: localizedValue(locale, media.caption, media.caption_uk, media.caption_en),
  };
}

export function localizeVideoProject(project: VideoProject, locale: Locale): VideoProject {
  if (locale === 'en') {
    const pageKey = legacyPageKey(project);
    const curated = pageKey ? PAGE_ITEM_EN_BY_ID[pageKey] : undefined;

    return {
      ...project,
      title: englishProjectValue(project.title_en, curated?.title, project.title_uk || project.title, 'Video project'),
      client: englishProjectValue(project.client_en, curated?.meta1, project.client_uk || project.client),
      category: englishProjectValue(project.category_en, curated?.meta2, project.category_uk || project.category, 'Video production'),
      description: englishProjectValue(project.description_en, curated?.description, project.description_uk || project.description),
      result: englishProjectValue(project.result_en, curated?.result, project.result_uk || project.result),
      location: englishProjectValue(project.location_en, undefined, project.location_uk || project.location),
      tags: englishProjectList(project.tags_en, curated?.items, project.tags_uk || project.tags),
      videos: (project.videos || []).map(media => localizeVideoMedia(media, locale)),
    };
  }

  return {
    ...project,
    title: localizedValue(locale, project.title, project.title_uk, project.title_en),
    client: localizedValue(locale, project.client, project.client_uk, project.client_en),
    category: localizedValue(locale, project.category, project.category_uk, project.category_en),
    description: localizedValue(locale, project.description, project.description_uk, project.description_en),
    result: localizedValue(locale, project.result, project.result_uk, project.result_en),
    location: localizedValue(locale, project.location, project.location_uk, project.location_en),
    tags: localizedList(locale, project.tags, project.tags_uk, project.tags_en),
    videos: (project.videos || []).map(media => localizeVideoMedia(media, locale)),
  };
}

export function detectVideoProjectMediaType(url: string): VideoProjectMediaType {
  if (extractYouTubeId(url)) return 'youtube';
  if (extractVimeoId(url)) return 'vimeo';
  return 'video';
}

export function createVideoProjectMedia(url = ''): VideoProjectMedia {
  const type = detectVideoProjectMediaType(url);
  return {
    id: `video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    url,
    posterUrl: type === 'youtube' ? getYouTubeThumbnail(url) || undefined : undefined,
    format: '16:9',
  };
}

export function videoMediaPoster(media: VideoProjectMedia): string {
  if (media.posterUrl) return media.posterUrl;
  if (media.type === 'youtube') return getYouTubeThumbnail(media.url) || '';
  return '';
}

export function videoProjectCover(project: VideoProject): string {
  if (project.coverUrl) return project.coverUrl;
  for (const media of project.videos || []) {
    const poster = videoMediaPoster(media);
    if (poster) return poster;
  }
  return '';
}

export function videoEmbedUrl(media: VideoProjectMedia): string | null {
  if (media.type === 'youtube') {
    const id = extractYouTubeId(media.url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
  }
  if (media.type === 'vimeo') {
    const id = extractVimeoId(media.url);
    return id ? `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0` : null;
  }
  return null;
}

export function videoAspectClass(format: VideoProjectFormat | undefined): string {
  if (format === '9:16') return 'aspect-[9/16]';
  if (format === '1:1') return 'aspect-square';
  return 'aspect-video';
}

export function sortVideoProjects(items: VideoProject[]): VideoProject[] {
  return [...items].sort((a, b) => {
    const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (featuredDelta !== 0) return featuredDelta;
    const orderDelta = (a.order ?? 9999) - (b.order ?? 9999);
    if (orderDelta !== 0) return orderDelta;
    const dateDelta = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateDelta !== 0) return dateDelta;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}
