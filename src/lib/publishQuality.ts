export type PublishQualityType = 'case' | 'gallery' | 'video' | 'article';

export interface PublishQualityIssue {
  code: string;
  label: string;
  severity: 'warning' | 'error';
}

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function text(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === 'string' ? String(record[key]).trim() : '';
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function hasArticleLocale(record: Record<string, unknown>, locale: 'uk' | 'en'): boolean {
  const translation = recordOf(record[locale]);
  return Boolean(text(translation, 'title') && text(translation, 'summary') && arrayOf(translation.content).length);
}

function hasPortfolioLocale(record: Record<string, unknown>, locale: 'uk' | 'en'): boolean {
  return Boolean(text(record, `title_${locale}`) && text(record, `description_${locale}`));
}

function hasDescription(type: PublishQualityType, record: Record<string, unknown>): boolean {
  if (type === 'article') {
    const uk = recordOf(record.uk);
    const ru = recordOf(record.ru);
    const en = recordOf(record.en);
    return Boolean(text(uk, 'summary') || text(ru, 'summary') || text(en, 'summary'));
  }
  return Boolean(text(record, 'description') || text(record, 'description_uk') || text(record, 'description_en'));
}

function hasCover(type: PublishQualityType, record: Record<string, unknown>): boolean {
  if (type === 'case') return Boolean(text(record, 'imageUrl'));
  if (type === 'article') return Boolean(text(record, 'coverImage'));
  if (type === 'gallery') return Boolean(text(record, 'coverUrl') || arrayOf(record.images).some(item => text(recordOf(item), 'url')));
  return Boolean(text(record, 'coverUrl') || arrayOf(record.videos).some(item => text(recordOf(item), 'posterUrl')));
}

function imageAltMissing(type: PublishQualityType, record: Record<string, unknown>): boolean {
  const media = type === 'case' ? arrayOf(record.media) : type === 'gallery' ? arrayOf(record.images) : [];
  return media.some(item => {
    const image = recordOf(item);
    if (type === 'case' && text(image, 'type') !== 'image') return false;
    if (!text(image, 'url')) return false;
    return !(text(image, 'alt') || text(image, 'alt_uk') || text(image, 'alt_en'));
  });
}

function videoPosterMissing(type: PublishQualityType, record: Record<string, unknown>): boolean {
  const videos = type === 'video' ? arrayOf(record.videos) : type === 'case' ? arrayOf(record.media) : [];
  return videos.some(item => {
    const video = recordOf(item);
    if (type === 'case' && text(video, 'type') === 'image') return false;
    if (!text(video, 'url')) return false;
    return !(text(video, 'posterUrl') || text(video, 'thumbnailUrl') || text(record, 'coverUrl') || text(record, 'imageUrl'));
  });
}

export function evaluatePublishQuality(
  type: PublishQualityType,
  value: unknown,
  options?: { duplicateSlug?: boolean; brokenRelation?: boolean },
): PublishQualityIssue[] {
  const record = recordOf(value);
  const issues: PublishQualityIssue[] = [];

  if (type === 'article' ? !hasArticleLocale(record, 'uk') : !hasPortfolioLocale(record, 'uk')) {
    issues.push({ code: 'missing-uk', label: 'Неполная украинская локализация', severity: 'warning' });
  }
  if (type === 'article' ? !hasArticleLocale(record, 'en') : !hasPortfolioLocale(record, 'en')) {
    issues.push({ code: 'missing-en', label: 'Неполная английская локализация', severity: 'warning' });
  }
  if (!hasCover(type, record)) issues.push({ code: 'missing-cover', label: 'Нет обложки / poster', severity: 'warning' });
  if (!hasDescription(type, record)) issues.push({ code: 'missing-description', label: 'Пустое описание', severity: 'warning' });
  if (options?.duplicateSlug) issues.push({ code: 'duplicate-slug', label: 'Дублирующийся slug', severity: 'error' });
  if (options?.brokenRelation) issues.push({ code: 'broken-relation', label: 'Есть битая связь с другим материалом', severity: 'warning' });
  if (imageAltMissing(type, record)) issues.push({ code: 'missing-alt', label: 'У одного или нескольких изображений нет alt', severity: 'warning' });
  if ((type === 'video' || type === 'case') && videoPosterMissing(type, record)) issues.push({ code: 'missing-video-poster', label: 'У видео нет poster/thumbnail', severity: 'warning' });

  return issues;
}
