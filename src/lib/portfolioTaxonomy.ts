export type PortfolioCategoryId =
  | 'advertising'
  | 'industry'
  | 'medicine'
  | 'construction'
  | 'live'
  | 'sport'
  | 'events'
  | 'other';

export type PortfolioLocale = 'uk' | 'ru' | 'en';

export interface PortfolioTaxonomyValue {
  category?: PortfolioCategoryId;
  tags?: string[];
}

export const PORTFOLIO_CATEGORIES: ReadonlyArray<{
  id: PortfolioCategoryId;
  uk: string;
  ru: string;
  en: string;
}> = [
  { id: 'advertising', uk: 'Реклама', ru: 'Реклама', en: 'Advertising' },
  { id: 'industry', uk: 'Промисловість', ru: 'Промышленность', en: 'Industry' },
  { id: 'medicine', uk: 'Медицина', ru: 'Медицина', en: 'Medicine' },
  { id: 'construction', uk: 'Будівництво', ru: 'Строительство', en: 'Construction' },
  { id: 'live', uk: 'Live', ru: 'Live', en: 'Live' },
  { id: 'sport', uk: 'Спорт', ru: 'Спорт', en: 'Sport' },
  { id: 'events', uk: 'Події', ru: 'Мероприятия', en: 'Events' },
  { id: 'other', uk: 'Інше', ru: 'Другое', en: 'Other' },
];

const CATEGORY_IDS = new Set<PortfolioCategoryId>(PORTFOLIO_CATEGORIES.map(item => item.id));

const CATEGORY_KEYWORDS: Array<{ id: PortfolioCategoryId; words: string[] }> = [
  { id: 'medicine', words: ['медицин', 'медицина', 'клінік', 'клиник', 'hospital', 'medical', 'doctor', 'health', 'стомат', 'нейро', 'helios'] },
  { id: 'sport', words: ['спорт', 'sport', 'теннис', 'теніс', 'padel', 'падел', 'турнир', 'турнір', 'match', 'матч', 'чемпион', 'чемпіон'] },
  { id: 'industry', words: ['промышлен', 'промислов', 'industrial', 'factory', 'завод', 'виробництв', 'производств', 'энерг', 'енерг', 'gas', 'oil'] },
  { id: 'construction', words: ['строител', 'будівниц', 'construction', 'стройк', 'будмайдан', 'architecture', 'архитект', 'архітект'] },
  { id: 'live', words: ['live', 'стрим', 'stream', 'трансляц', 'broadcast', 'эфир', 'ефір', 'multi-camera', 'multicam'] },
  { id: 'events', words: ['event', 'events', 'мероприят', 'поді', 'событ', 'конференц', 'conference', 'форум', 'festival', 'фестиваль', 'корпоратив'] },
  { id: 'advertising', words: ['реклам', 'advert', 'commercial', 'promo', 'промо', 'reels', 'ролик', 'бренд', 'brand', 'product', 'продукт'] },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function stringValues(value: unknown, depth = 0): string[] {
  if (depth > 2 || value == null) return [];
  if (typeof value === 'string') return [value];
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(item => stringValues(item, depth + 1));
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !['media', 'images', 'videos', 'metrics'].includes(key))
      .flatMap(([, item]) => stringValues(item, depth + 1));
  }
  return [];
}

function explicitCategory(value: unknown): PortfolioCategoryId | undefined {
  const record = asRecord(value);
  const taxonomy = asRecord(record.taxonomy);
  const candidate = taxonomy.category;
  return typeof candidate === 'string' && CATEGORY_IDS.has(candidate as PortfolioCategoryId)
    ? candidate as PortfolioCategoryId
    : undefined;
}

export function getPortfolioCategory(value: unknown): PortfolioCategoryId {
  const explicit = explicitCategory(value);
  if (explicit) return explicit;

  const record = asRecord(value);
  const haystack = stringValues({
    title: record.title,
    title_uk: record.title_uk,
    title_en: record.title_en,
    client: record.client,
    category: record.category,
    category_uk: record.category_uk,
    category_en: record.category_en,
    categoryLabel: record.categoryLabel,
    categoryLabel_uk: record.categoryLabel_uk,
    categoryLabel_en: record.categoryLabel_en,
    description: record.description,
    description_uk: record.description_uk,
    description_en: record.description_en,
    location: record.location,
    tags: record.tags,
    tags_uk: record.tags_uk,
    tags_en: record.tags_en,
  }).join(' ').toLowerCase();

  for (const category of CATEGORY_KEYWORDS) {
    if (category.words.some(word => haystack.includes(word))) return category.id;
  }

  const legacy = String(record.category || '').toUpperCase();
  if (legacy === 'LIVE') return 'live';
  if (legacy === 'CONSTRUCTION') return 'construction';
  if (legacy === 'VIDEO') return 'advertising';
  return 'other';
}

export function getPortfolioCategoryLabel(category: PortfolioCategoryId, locale: PortfolioLocale): string {
  const item = PORTFOLIO_CATEGORIES.find(entry => entry.id === category);
  return item?.[locale] || item?.ru || category;
}

function cleanTags(source: unknown): string[] {
  return Array.isArray(source)
    ? source.map(tag => String(tag).trim()).filter(Boolean)
    : [];
}

export function getPortfolioTags(value: unknown): string[] {
  const record = asRecord(value);
  const taxonomy = asRecord(record.taxonomy);
  const taxonomyTags = cleanTags(taxonomy.tags);

  // Public pages pass already-localized portfolio records. Use their active `tags`
  // array only, otherwise UK/RU/EN tag arrays would be mixed in one locale.
  // Raw admin records still fall back to one available language when `tags` is absent.
  const localizedTags = cleanTags(record.tags);
  const fallbackTags = localizedTags.length
    ? []
    : cleanTags(record.tags_uk).length
      ? cleanTags(record.tags_uk)
      : cleanTags(record.tags_en);

  return Array.from(new Set([...taxonomyTags, ...localizedTags, ...fallbackTags]));
}

export function portfolioSearchText(value: unknown): string {
  return stringValues(value)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function portfolioMatchesFilter(
  value: unknown,
  category: PortfolioCategoryId | 'all',
  tag: string,
  query: string,
): boolean {
  if (category !== 'all' && getPortfolioCategory(value) !== category) return false;
  if (tag !== 'all') {
    const needle = tag.toLowerCase();
    if (!getPortfolioTags(value).some(item => item.toLowerCase() === needle)) return false;
  }
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery && !portfolioSearchText(value).includes(normalizedQuery)) return false;
  return true;
}

export function taxonomyForValue(value: unknown): Required<PortfolioTaxonomyValue> {
  return {
    category: getPortfolioCategory(value),
    tags: getPortfolioTags(value),
  };
}
