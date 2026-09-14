import { Article, ArticleCategory, ArticleTranslation, Locale } from '../types';
import { MEDIA_ARTICLES, MEDIA_ARTICLES_UK, MediaArticle } from '../data/mediaCenterData';
import { MEDIA_ARTICLES_EN } from '../data/mediaCenterDataEn';

const CATEGORY_MAP: Record<string, ArticleCategory> = {
  LIVE: 'live',
  VIDEO: 'video',
  CONSTRUCTION: 'construction',
  PHOTO: 'photo',
  TECH: 'tech',
  live: 'live',
  video: 'video',
  construction: 'construction',
  photo: 'photo',
  tech: 'tech',
};

const EMPTY_TRANSLATION: ArticleTranslation = {
  title: '',
  categoryLabel: '',
  readTime: '',
  date: '',
  author: '',
  summary: '',
  content: [],
  keyTakeaways: [],
};

export function slugifyArticleTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[’'"«»]/g, '')
    .replace(/[^a-zа-яёіїєґ0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || `article-${Date.now()}`;
}

function mediaArticleToTranslation(item: MediaArticle): ArticleTranslation {
  return {
    title: item.title,
    categoryLabel: item.categoryLabel,
    readTime: item.readTime,
    date: item.date,
    author: item.author,
    summary: item.summary,
    content: [...item.content],
    keyTakeaways: [...item.keyTakeaways],
  };
}

export const DEFAULT_ARTICLES: Article[] = MEDIA_ARTICLES.map((ru, index) => {
  const uk = MEDIA_ARTICLES_UK.find(item => item.id === ru.id) || ru;
  const en = MEDIA_ARTICLES_EN.find(item => item.id === ru.id);
  const publishedAt = Date.now() - index * 60_000;

  return {
    id: ru.id,
    slug: ru.slug || slugifyArticleTitle(ru.title),
    category: CATEGORY_MAP[ru.category] || 'tech',
    coverImage: ru.coverImage,
    published: true,
    publishedAt,
    createdAt: publishedAt,
    ru: mediaArticleToTranslation(ru),
    uk: mediaArticleToTranslation(uk),
    en: en ? mediaArticleToTranslation(en) : undefined,
  };
});

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') {
    return value
      .split(/\n\s*\n|\n/)
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeTranslation(value: unknown, fallback: ArticleTranslation): ArticleTranslation {
  if (!value || typeof value !== 'object') return fallback;
  const data = value as Record<string, unknown>;
  return {
    title: asString(data.title, fallback.title),
    categoryLabel: asString(data.categoryLabel, fallback.categoryLabel),
    readTime: asString(data.readTime, fallback.readTime),
    date: asString(data.date, fallback.date),
    author: asString(data.author, fallback.author),
    summary: asString(data.summary, fallback.summary),
    content: asStringArray(data.content).length ? asStringArray(data.content) : fallback.content,
    keyTakeaways: asStringArray(data.keyTakeaways).length ? asStringArray(data.keyTakeaways) : fallback.keyTakeaways,
  };
}

export function isModernArticleData(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return typeof data.slug === 'string' && !!data.ru && !!data.uk;
}

export function normalizeArticle(id: string, value: unknown): Article {
  const data = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const seed = DEFAULT_ARTICLES.find(item => item.id === id);

  if (isModernArticleData(data)) {
    const ruFallback = seed?.ru || EMPTY_TRANSLATION;
    const ukFallback = seed?.uk || ruFallback;
    const enFallback = seed?.en || EMPTY_TRANSLATION;
    const ru = normalizeTranslation(data.ru, ruFallback);
    const uk = normalizeTranslation(data.uk, ukFallback);
    const en = data.en ? normalizeTranslation(data.en, enFallback) : seed?.en;
    const publishedAt = typeof data.publishedAt === 'number'
      ? data.publishedAt
      : typeof data.createdAt === 'number'
        ? data.createdAt
        : Date.now();

    return {
      ...data,
      id,
      slug: asString(data.slug, seed?.slug || slugifyArticleTitle(ru.title)),
      category: CATEGORY_MAP[asString(data.category)] || seed?.category || 'tech',
      coverImage: asString(data.coverImage, seed?.coverImage || ''),
      published: data.published !== false,
      publishedAt,
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : publishedAt,
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
      ru,
      uk,
      en,
    } as Article;
  }

  // Legacy ArticlesManager schema: title/category/excerpt/content/imageUrl/createdAt.
  const title = asString(data.title, seed?.ru.title || 'Без названия');
  const summary = asString(data.excerpt, seed?.ru.summary || '');
  const content = asStringArray(data.content);
  const createdAt = typeof data.createdAt === 'number' ? data.createdAt : Date.now();
  const category = CATEGORY_MAP[asString(data.category)] || seed?.category || 'tech';
  const categoryLabel = seed?.ru.categoryLabel || asString(data.category, 'Материал');
  const legacyTranslation: ArticleTranslation = {
    title,
    categoryLabel,
    readTime: seed?.ru.readTime || '',
    date: seed?.ru.date || new Date(createdAt).toLocaleDateString('ru-RU'),
    author: seed?.ru.author || 'Александр Питель',
    summary,
    content: content.length ? content : seed?.ru.content || [],
    keyTakeaways: seed?.ru.keyTakeaways || [],
  };

  return {
    ...data,
    id,
    slug: seed?.slug || slugifyArticleTitle(title),
    category,
    coverImage: asString(data.imageUrl, seed?.coverImage || ''),
    published: true,
    publishedAt: createdAt,
    createdAt,
    ru: legacyTranslation,
    uk: seed?.uk || legacyTranslation,
    en: seed?.en,
  } as Article;
}

export function hasArticleLocale(article: Article, locale: Locale): boolean {
  if (locale !== 'en') return true;
  const text = article.en;
  return Boolean(
    text &&
    text.title.trim() &&
    text.categoryLabel.trim() &&
    text.summary.trim() &&
    text.content.length > 0,
  );
}

export function localizeArticle(article: Article, locale: Locale): ArticleTranslation {
  if (locale === 'en') return article.en || EMPTY_TRANSLATION;
  if (locale === 'uk') return article.uk || article.ru;
  return article.ru || article.uk;
}

export function articleCategoryLabel(category: ArticleCategory, locale: Locale): string {
  const labels: Record<ArticleCategory, { ru: string; uk: string; en: string }> = {
    live: { ru: 'LIVE & Стриминг', uk: 'LIVE & Стрімінг', en: 'LIVE & Streaming' },
    video: { ru: 'Видеопроизводство', uk: 'Відеовиробництво', en: 'Video Production' },
    construction: { ru: 'Стройка & Таймлапс', uk: 'Будівництво & Таймлапс', en: 'Construction & Timelapse' },
    photo: { ru: 'Фотосъемка', uk: 'Фотозйомка', en: 'Photography' },
    tech: { ru: 'Технологии', uk: 'Технології', en: 'Technology' },
  };
  return labels[category][locale];
}
