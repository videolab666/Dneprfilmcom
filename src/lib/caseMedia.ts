import type { CaseMediaItem, CaseMediaType, CaseStudy, Locale } from '../types';

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya', ы: 'y', э: 'e', ё: 'yo', ъ: '',
};

export function slugifyCase(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .split('')
    .map(char => CYRILLIC_MAP[char] ?? char)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || 'case';
}

export function getCaseSlug(item: CaseStudy): string {
  if (item.slug?.trim()) return item.slug.trim();
  const title = item.title_uk || item.title_en || item.title || item.id;
  const base = slugifyCase(title);
  const suffix = item.id.replace(/^case-/, '').replace(/[^a-zA-Z0-9-]/g, '').slice(-18);
  return suffix && !base.endsWith(suffix.toLowerCase()) ? `${base}-${suffix.toLowerCase()}` : base;
}

export function getCasePath(item: CaseStudy): string {
  return `/cases/${encodeURIComponent(getCaseSlug(item))}`;
}

export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || null;
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      const parts = parsed.pathname.split('/').filter(Boolean);
      const index = parts.findIndex(part => ['embed', 'shorts', 'live'].includes(part));
      if (index >= 0) return parts[index + 1] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function extractVimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (!host.endsWith('vimeo.com')) return null;
    const numeric = parsed.pathname.split('/').filter(Boolean).reverse().find(part => /^\d+$/.test(part));
    return numeric || null;
  } catch {
    return null;
  }
}

export function detectCaseMediaType(url: string): CaseMediaType {
  if (extractYouTubeId(url)) return 'youtube';
  if (extractVimeoId(url)) return 'vimeo';
  if (/\.(?:mp4|webm|ogg)(?:$|[?#])/i.test(url)) return 'video';
  return 'image';
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function getVideoEmbedUrl(item: CaseMediaItem): string | null {
  if (item.type === 'youtube') {
    const id = extractYouTubeId(item.url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
  }
  if (item.type === 'vimeo') {
    const id = extractVimeoId(item.url);
    return id ? `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0` : null;
  }
  return null;
}

export function getMediaPreview(item: CaseMediaItem): string | null {
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.type === 'youtube') return getYouTubeThumbnail(item.url);
  if (item.type === 'image') return item.url;
  return null;
}

export function localizeMediaItem(item: CaseMediaItem, locale: Locale): CaseMediaItem {
  if (locale === 'uk') {
    return {
      ...item,
      title: item.title_uk || item.title || item.title_en,
      caption: item.caption_uk || item.caption || item.caption_en,
      alt: item.alt_uk || item.alt || item.alt_en,
    };
  }
  if (locale === 'en') {
    return {
      ...item,
      title: item.title_en || item.title_uk || item.title,
      caption: item.caption_en || item.caption_uk || item.caption,
      alt: item.alt_en || item.alt_uk || item.alt,
    };
  }
  return item;
}

export function normalizedCaseMedia(item: CaseStudy): CaseMediaItem[] {
  if (item.media?.length) return item.media.filter(media => Boolean(media.url?.trim()));

  const legacy: CaseMediaItem[] = [];
  if (item.imageUrl?.trim()) {
    legacy.push({
      id: `${item.id}-cover`,
      type: 'image',
      url: item.imageUrl,
      title: item.title,
      title_uk: item.title_uk,
      title_en: item.title_en,
    });
  }

  if (item.videoUrl?.trim()) {
    const type = detectCaseMediaType(item.videoUrl);
    if (type !== 'image') {
      legacy.push({
        id: `${item.id}-video`,
        type,
        url: item.videoUrl,
        thumbnailUrl: type === 'youtube' ? getYouTubeThumbnail(item.videoUrl) || undefined : undefined,
      });
    }
  }

  return legacy;
}

export function createCaseMediaItem(type: CaseMediaType, url = ''): CaseMediaItem {
  const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type,
    url,
    thumbnailUrl: type === 'youtube' && url ? getYouTubeThumbnail(url) || undefined : undefined,
  };
}
