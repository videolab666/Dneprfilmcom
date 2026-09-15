import type { Locale } from '../types';
import { evaluatePublishQuality, type PublishQualityIssue, type PublishQualityType } from './publishQuality';
import { seoFieldName } from './seoOverrides';

export type ContentHealthArea = 'publish' | 'localization' | 'seo' | 'media' | 'taxonomy' | 'relations';
export type ContentHealthSeverity = 'error' | 'warning' | 'info';

export interface ContentHealthIssue {
  id: string;
  area: ContentHealthArea;
  severity: ContentHealthSeverity;
  title: string;
  detail: string;
}

export interface ContentHealthCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ContentHealthReport {
  score: number;
  grade: 'excellent' | 'good' | 'needs-work' | 'critical';
  issues: ContentHealthIssue[];
  checks: ContentHealthCheck[];
  publishIssues: PublishQualityIssue[];
}

interface ContentHealthOptions {
  duplicateSlug?: boolean;
  brokenRelation?: boolean;
}

const LOCALES: Locale[] = ['uk', 'ru', 'en'];

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function portfolioField(record: Record<string, unknown>, base: string, locale: Locale): string {
  return text(record[locale === 'ru' ? base : `${base}_${locale}`]);
}

function articleTranslation(record: Record<string, unknown>, locale: Locale): Record<string, unknown> {
  return recordOf(record[locale]);
}

function localizedTitle(type: PublishQualityType, record: Record<string, unknown>, locale: Locale): string {
  if (type === 'article') return text(articleTranslation(record, locale).title);
  return portfolioField(record, 'title', locale);
}

function localizedDescription(type: PublishQualityType, record: Record<string, unknown>, locale: Locale): string {
  if (type === 'article') return text(articleTranslation(record, locale).summary);
  return portfolioField(record, 'description', locale);
}

function articleContentLength(record: Record<string, unknown>, locale: Locale): number {
  const content = articleTranslation(record, locale).content;
  return Array.isArray(content) ? content.map(String).join(' ').trim().length : 0;
}

function coverValue(type: PublishQualityType, record: Record<string, unknown>): string {
  if (type === 'case') return text(record.imageUrl);
  if (type === 'article') return text(record.coverImage);
  return text(record.coverUrl);
}

function relationCount(type: PublishQualityType, record: Record<string, unknown>): number {
  if (type !== 'article') return 0;
  return ['relatedCaseIds', 'relatedGalleryIds', 'relatedVideoProjectIds']
    .reduce((sum, key) => sum + (Array.isArray(record[key]) ? (record[key] as unknown[]).length : 0), 0);
}

function taxonomyTags(record: Record<string, unknown>): string[] {
  const taxonomy = recordOf(record.taxonomy);
  return Array.isArray(taxonomy.tags) ? taxonomy.tags.map(String).map(item => item.trim()).filter(Boolean) : [];
}

function mapPublishIssue(issue: PublishQualityIssue): ContentHealthIssue {
  const area: ContentHealthArea = issue.code.includes('alt') || issue.code.includes('poster') || issue.code.includes('cover')
    ? 'media'
    : issue.code.includes('relation')
      ? 'relations'
      : issue.code.includes('uk') || issue.code.includes('en') || issue.code.includes('description')
        ? 'localization'
        : 'publish';
  return {
    id: `publish-${issue.code}`,
    area,
    severity: issue.severity,
    title: issue.label,
    detail: issue.severity === 'error' ? 'Блокирует публикацию.' : 'Publish Quality Gate требует внимания.',
  };
}

export function evaluateContentHealth(
  type: PublishQualityType,
  value: unknown,
  options?: ContentHealthOptions,
): ContentHealthReport {
  const record = recordOf(value);
  const publishIssues = evaluatePublishQuality(type, record, options);
  const issues: ContentHealthIssue[] = publishIssues.map(mapPublishIssue);
  const checks: ContentHealthCheck[] = [];

  for (const locale of LOCALES) {
    const title = localizedTitle(type, record, locale);
    const description = localizedDescription(type, record, locale);
    const complete = Boolean(title && description && (type !== 'article' || articleContentLength(record, locale) > 0));
    checks.push({
      id: `locale-${locale}`,
      label: `${locale.toUpperCase()} localization`,
      passed: complete,
      detail: complete ? 'Заголовок и основной контент заполнены.' : 'Не хватает заголовка, описания или основного текста.',
    });
    if (!complete && !issues.some(issue => issue.id === `publish-missing-${locale}`)) {
      issues.push({
        id: `locale-${locale}`,
        area: 'localization',
        severity: locale === 'ru' ? 'info' : 'warning',
        title: `Неполная локализация ${locale.toUpperCase()}`,
        detail: 'Заполните заголовок, описание и основной контент для этого языка.',
      });
    }

    const fallbackTitle = title;
    const fallbackDescription = description;
    const seoTitle = text(record[seoFieldName('seoTitle', locale)]) || fallbackTitle;
    const seoDescription = text(record[seoFieldName('seoDescription', locale)]) || fallbackDescription;
    const titleOk = seoTitle.length >= 20 && seoTitle.length <= 60;
    const descriptionOk = seoDescription.length >= 70 && seoDescription.length <= 160;
    checks.push({
      id: `seo-${locale}`,
      label: `${locale.toUpperCase()} SEO`,
      passed: titleOk && descriptionOk,
      detail: `Title ${seoTitle.length}/60 · Description ${seoDescription.length}/160`,
    });
    if (seoTitle && !titleOk) issues.push({
      id: `seo-title-${locale}`,
      area: 'seo',
      severity: 'info',
      title: `SEO title ${locale.toUpperCase()} вне рекомендуемой длины`,
      detail: `${seoTitle.length} символов; ориентир 20–60.`,
    });
    if (seoDescription && !descriptionOk) issues.push({
      id: `seo-description-${locale}`,
      area: 'seo',
      severity: 'info',
      title: `Meta description ${locale.toUpperCase()} вне рекомендуемой длины`,
      detail: `${seoDescription.length} символов; ориентир 70–160.`,
    });
  }

  const cover = coverValue(type, record);
  checks.push({ id: 'cover', label: 'Обложка', passed: Boolean(cover), detail: cover ? 'Основная обложка задана.' : 'Обложка отсутствует.' });

  const taxonomy = recordOf(record.taxonomy);
  const category = text(taxonomy.category);
  const tags = taxonomyTags(record);
  checks.push({
    id: 'taxonomy',
    label: 'Taxonomy',
    passed: Boolean(category),
    detail: category ? `${category}; тегов: ${tags.length}` : 'Portfolio category не задана.',
  });
  if (!category) issues.push({ id: 'taxonomy-category', area: 'taxonomy', severity: 'info', title: 'Не задана taxonomy category', detail: 'Рекомендуется явная категория вместо автоматического определения.' });
  if (tags.length === 0) issues.push({ id: 'taxonomy-tags', area: 'taxonomy', severity: 'info', title: 'Нет taxonomy tags', detail: 'Теги улучшают фильтрацию и повторное использование контента.' });

  if (type === 'article') {
    const relations = relationCount(type, record);
    checks.push({ id: 'relations', label: 'Связанный контент', passed: relations > 0, detail: relations > 0 ? `Связей: ${relations}` : 'Связанный portfolio-контент не выбран.' });
    if (relations === 0) issues.push({ id: 'article-relations', area: 'relations', severity: 'info', title: 'У статьи нет связанных работ', detail: 'Добавьте релевантные кейсы, галереи или видео, если они есть.' });
  }

  const uniqueIssues = Array.from(new Map(issues.map(issue => [issue.id, issue])).values());
  const penalty = uniqueIssues.reduce((sum, issue) => sum + (issue.severity === 'error' ? 30 : issue.severity === 'warning' ? 10 : 3), 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const grade: ContentHealthReport['grade'] = score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 50 ? 'needs-work' : 'critical';

  return { score, grade, issues: uniqueIssues, checks, publishIssues };
}
