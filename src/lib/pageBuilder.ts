import type { BlockType, Locale, SiteBlock } from '../types';
import type { RichTextDocument } from './richText';
import type { GalleryAspect, GalleryCaptionMode, GalleryGap, GalleryLayout } from './galleryContent';

export type PageBuilderPage = 'home' | 'live' | 'video' | 'construction' | 'photo' | 'about' | 'contacts';
export type PageBuilderPlacement = 'before' | 'inline' | 'after';
export type PageBuilderWidth = 'narrow' | 'normal' | 'wide' | 'full';
export type PageBuilderSpacing = 'compact' | 'normal' | 'large';
export type PageBuilderAlignment = 'left' | 'center';
export type PageBuilderCategory = 'content' | 'cards' | 'data' | 'interactive' | 'media' | 'files' | 'cta' | 'layout' | 'dneprfilm';

export type PageBuilderKind =
  | BlockType
  | 'rich_text'
  | 'image'
  | 'gallery'
  | 'process'
  | 'pricing'
  | 'cases'
  | 'videos'
  | 'testimonials'
  | 'contact'
  | 'divider'
  | 'spacer'
  | 'timeline'
  | 'downloads'
  | 'tabs'
  | 'table'
  | 'team'
  | 'quote'
  | 'native_page_section'
  | 'native_home_hero'
  | 'native_home_clients'
  | 'native_home_featured_cases'
  | 'native_home_synergy'
  | 'native_home_how_we_work'
  | 'native_home_backstage'
  | 'native_home_testimonials'
  | 'native_home_contact';

export interface PageBuilderImage {
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

export interface PageBuilderTimelineItem {
  id: string;
  date?: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface PageBuilderDownloadItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
}

export interface PageBuilderTabItem {
  id: string;
  title: string;
  content: string;
}

export interface PageBuilderTableRow {
  id: string;
  cells: string[];
}

export interface PageBuilderTeamItem {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  imageUrl?: string;
  link?: string;
}

export interface PageBuilderConfig {
  builderKind?: PageBuilderKind;
  builderPlacement?: PageBuilderPlacement;
  builderScope?: 'page' | 'global';
  width?: PageBuilderWidth;
  spacing?: PageBuilderSpacing;
  alignment?: PageBuilderAlignment;
  anchor?: string;
  richText?: RichTextDocument;
  galleryImages?: PageBuilderImage[];
  galleryLayout?: GalleryLayout;
  galleryColumns?: 2 | 3 | 4;
  galleryGap?: GalleryGap;
  galleryAspect?: GalleryAspect;
  galleryCaptionMode?: GalleryCaptionMode;
  imageAlt?: string;
  imageCaption?: string;
  maxItems?: number;
  dividerStyle?: 'line' | 'dots';
  spacerSize?: 'small' | 'medium' | 'large';
  contactShowPhone?: boolean;
  contactShowEmail?: boolean;
  contactNote?: string;
  timelineItems?: PageBuilderTimelineItem[];
  timelineOrientation?: 'vertical' | 'horizontal';
  downloadItems?: PageBuilderDownloadItem[];
  downloadLayout?: 'list' | 'cards';
  tabs?: PageBuilderTabItem[];
  tableColumns?: string[];
  tableRows?: PageBuilderTableRow[];
  tableStriped?: boolean;
  teamItems?: PageBuilderTeamItem[];
  teamColumns?: 2 | 3 | 4;
  quoteText?: string;
  quoteAuthor?: string;
  quoteRole?: string;
  nativeSection?: string;
}

export type BuilderSiteBlock = Omit<SiteBlock, 'page' | 'config' | 'config_uk' | 'config_en'> & {
  page: PageBuilderPage | 'all';
  config: SiteBlock['config'] & PageBuilderConfig;
  config_uk?: Partial<SiteBlock['config'] & PageBuilderConfig>;
  config_en?: Partial<SiteBlock['config'] & PageBuilderConfig>;
};

export interface PageBuilderDraftData {
  title: string;
  title_uk?: string;
  title_en?: string;
  type: BlockType;
  order: number;
  isActive: boolean;
  page: PageBuilderPage | 'all';
  config: BuilderSiteBlock['config'];
  config_uk?: BuilderSiteBlock['config_uk'];
  config_en?: BuilderSiteBlock['config_en'];
  deleted?: boolean;
}

export type StoredBuilderSiteBlock = BuilderSiteBlock & {
  builderDraft?: PageBuilderDraftData | null;
  builderDraftUpdatedAt?: number;
  builderPublishedAt?: number;
  _builderUnpublished?: boolean;
};

export interface PageBuilderPreset {
  id: string;
  name: string;
  type: BlockType;
  title: string;
  config: BuilderSiteBlock['config'];
  config_uk?: BuilderSiteBlock['config_uk'];
  config_en?: BuilderSiteBlock['config_en'];
  createdAt: number;
}

export interface PageBuilderKindDefinition {
  id: PageBuilderKind;
  label: string;
  description: string;
  legacyType: BlockType;
  category: PageBuilderCategory;
  native?: boolean;
}

export const PAGE_BUILDER_PAGES: Array<{ id: PageBuilderPage; label: string; path: string }> = [
  { id: 'home', label: 'Главная', path: '/' },
  { id: 'live', label: 'Live', path: '/live' },
  { id: 'video', label: 'Video', path: '/video' },
  { id: 'construction', label: 'Construction', path: '/construction' },
  { id: 'photo', label: 'Photo', path: '/photo' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'contacts', label: 'Contacts', path: '/contacts' },
];

export const PAGE_BUILDER_CATEGORIES: Array<{ id: PageBuilderCategory; label: string }> = [
  { id: 'content', label: 'Контент' },
  { id: 'cards', label: 'Карточки и сетки' },
  { id: 'data', label: 'Данные' },
  { id: 'interactive', label: 'Интерактивные' },
  { id: 'media', label: 'Медиа' },
  { id: 'files', label: 'Файлы' },
  { id: 'cta', label: 'CTA и контакты' },
  { id: 'layout', label: 'Разметка' },
  { id: 'dneprfilm', label: 'DNEPRFILM · Pixel Perfect' },
];

export const PAGE_BUILDER_KINDS: PageBuilderKindDefinition[] = [
  { id: 'rich_text', label: 'Rich text', description: 'Форматированный текст, списки и ссылки', legacyType: 'text_image', category: 'content' },
  { id: 'text_image', label: 'Текст + изображение', description: 'Двухколоночная секция', legacyType: 'text_image', category: 'content' },
  { id: 'image', label: 'Большое изображение', description: 'Фото с заголовком и подписью', legacyType: 'text_image', category: 'content' },
  { id: 'quote', label: 'Цитата', description: 'Акцентная цитата с автором и должностью', legacyType: 'text_image', category: 'content' },

  { id: 'features_grid', label: 'Преимущества', description: 'Редактируемая сетка карточек', legacyType: 'features_grid', category: 'cards' },
  { id: 'stats_counter', label: 'Метрики', description: 'Крупные цифры и показатели', legacyType: 'stats_counter', category: 'cards' },
  { id: 'process', label: 'Процесс / этапы', description: 'Последовательность шагов', legacyType: 'features_grid', category: 'cards' },
  { id: 'pricing', label: 'Пакеты / цены', description: 'Тарифные карточки', legacyType: 'features_grid', category: 'cards' },
  { id: 'team', label: 'Команда', description: 'Карточки сотрудников с фото и описанием', legacyType: 'features_grid', category: 'cards' },

  { id: 'timeline', label: 'Timeline', description: 'Вертикальная или горизонтальная хронология', legacyType: 'features_grid', category: 'data' },
  { id: 'table', label: 'Таблица', description: 'Адаптивная таблица с колонками и строками', legacyType: 'features_grid', category: 'data' },

  { id: 'faq', label: 'FAQ', description: 'Вопросы и ответы', legacyType: 'faq', category: 'interactive' },
  { id: 'tabs', label: 'Tabs', description: 'Переключаемые вкладки с контентом', legacyType: 'features_grid', category: 'interactive' },

  { id: 'gallery', label: 'Галерея', description: 'Masonry / grid / justified / cinematic', legacyType: 'text_image', category: 'media' },
  { id: 'video_embed', label: 'Видео', description: 'YouTube / Vimeo / preview', legacyType: 'video_embed', category: 'media' },
  { id: 'cases', label: 'Кейсы', description: 'Актуальные опубликованные кейсы', legacyType: 'features_grid', category: 'media' },
  { id: 'videos', label: 'Видеоработы', description: 'Опубликованные видеопроекты', legacyType: 'features_grid', category: 'media' },
  { id: 'testimonials', label: 'Отзывы', description: 'Отзывы клиентов', legacyType: 'features_grid', category: 'media' },
  { id: 'partners', label: 'Клиенты / партнёры', description: 'Логотипы / названия клиентов', legacyType: 'partners', category: 'media' },

  { id: 'downloads', label: 'Документы / Downloads', description: 'Список или карточки файлов для скачивания', legacyType: 'features_grid', category: 'files' },

  { id: 'cta', label: 'CTA', description: 'Призыв с кнопками', legacyType: 'cta', category: 'cta' },
  { id: 'contact', label: 'Контактный CTA', description: 'Контактная секция с телефоном и email', legacyType: 'cta', category: 'cta' },

  { id: 'divider', label: 'Разделитель', description: 'Линия или точки', legacyType: 'cta', category: 'layout' },
  { id: 'spacer', label: 'Отступ', description: 'Контролируемое вертикальное пространство', legacyType: 'cta', category: 'layout' },

  { id: 'native_page_section', label: 'Секция исходной страницы', description: 'Pixel-perfect секция LIVE / Video / Construction / Photo; полный каталог расположен выше', legacyType: 'text_image', category: 'dneprfilm', native: true },
  { id: 'native_home_hero', label: 'Hero главной', description: 'Текущий HeroSlider без изменения DOM/CSS', legacyType: 'text_image', category: 'dneprfilm', native: true },
  { id: 'native_home_clients', label: 'Лента клиентов', description: 'Текущий ClientsMarquee pixel-perfect', legacyType: 'partners', category: 'dneprfilm', native: true },
  { id: 'native_home_featured_cases', label: 'Избранные кейсы', description: 'Текущий FeaturedCases pixel-perfect', legacyType: 'features_grid', category: 'dneprfilm', native: true },
  { id: 'native_home_synergy', label: 'Synergy Benefits', description: 'Текущая секция преимуществ pixel-perfect', legacyType: 'features_grid', category: 'dneprfilm', native: true },
  { id: 'native_home_how_we_work', label: 'Как мы работаем', description: 'Текущая секция HowWeWork pixel-perfect', legacyType: 'features_grid', category: 'dneprfilm', native: true },
  { id: 'native_home_backstage', label: 'Backstage', description: 'Текущая BackstageGallery pixel-perfect', legacyType: 'features_grid', category: 'dneprfilm', native: true },
  { id: 'native_home_testimonials', label: 'Отзывы DNEPRFILM', description: 'Текущая Testimonials pixel-perfect', legacyType: 'features_grid', category: 'dneprfilm', native: true },
  { id: 'native_home_contact', label: 'Финальный CTA', description: 'Текущий QuickContactCTA pixel-perfect', legacyType: 'cta', category: 'dneprfilm', native: true },
];

const NATIVE_KINDS = new Set<PageBuilderKind>(PAGE_BUILDER_KINDS.filter(item => item.native).map(item => item.id));

export function isNativeBuilderKind(kind: PageBuilderKind): boolean {
  return NATIVE_KINDS.has(kind);
}

export function asBuilderBlock(block: SiteBlock): BuilderSiteBlock {
  return block as unknown as BuilderSiteBlock;
}

export function blockKind(block: SiteBlock | BuilderSiteBlock): PageBuilderKind {
  const builder = asBuilderBlock(block as SiteBlock);
  if (builder.config.nativeSection?.includes('.')) return 'native_page_section';
  return builder.config.builderKind || builder.type;
}

export function blockMatchesPage(block: SiteBlock | BuilderSiteBlock, page: PageBuilderPage): boolean {
  const builder = asBuilderBlock(block as SiteBlock);
  if (builder.page === page) return true;
  if (builder.page === 'all') {
    if (builder.config.builderScope === 'global') return true;
    return page === 'home';
  }
  return false;
}

export function blockPlacement(block: SiteBlock | BuilderSiteBlock, page: PageBuilderPage): PageBuilderPlacement {
  const builder = asBuilderBlock(block as SiteBlock);
  return builder.config.builderPlacement || (page === 'home' ? 'inline' : 'after');
}

export function pageBlocks(
  blocks: Array<SiteBlock | BuilderSiteBlock>,
  page: PageBuilderPage,
  placement?: PageBuilderPlacement,
): BuilderSiteBlock[] {
  return blocks
    .map(block => asBuilderBlock(block as SiteBlock))
    .filter(block => block.isActive && blockMatchesPage(block, page))
    .filter(block => !placement || blockPlacement(block, page) === placement)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function localizeImage(image: PageBuilderImage, locale: Locale): PageBuilderImage {
  if (locale === 'uk') return { ...image, alt: image.alt_uk || image.alt || image.alt_en || '', caption: image.caption_uk || image.caption || image.caption_en || '' };
  if (locale === 'en') return { ...image, alt: image.alt_en || image.alt_uk || image.alt || '', caption: image.caption_en || image.caption_uk || image.caption || '' };
  return { ...image, alt: image.alt || image.alt_uk || image.alt_en || '', caption: image.caption || image.caption_uk || image.caption_en || '' };
}

export function localizedBuilderBlock(block: BuilderSiteBlock, locale: Locale): BuilderSiteBlock {
  const localized = locale === 'ru' ? undefined : locale === 'uk' ? block.config_uk : block.config_en;
  const config = { ...block.config, ...(localized || {}) };
  if (config.galleryImages?.length) config.galleryImages = config.galleryImages.map(image => localizeImage(image, locale));
  return {
    ...block,
    title: locale === 'uk' ? block.title_uk || block.title : locale === 'en' ? block.title_en || block.title_uk || block.title : block.title,
    config,
    config_uk: undefined,
    config_en: undefined,
  };
}

export function builderDraftData(block: BuilderSiteBlock, deleted = false): PageBuilderDraftData {
  return {
    title: block.title,
    title_uk: block.title_uk,
    title_en: block.title_en,
    type: block.type,
    order: block.order,
    isActive: block.isActive,
    page: block.page,
    config: JSON.parse(JSON.stringify(block.config)) as BuilderSiteBlock['config'],
    config_uk: block.config_uk ? JSON.parse(JSON.stringify(block.config_uk)) as BuilderSiteBlock['config_uk'] : undefined,
    config_en: block.config_en ? JSON.parse(JSON.stringify(block.config_en)) as BuilderSiteBlock['config_en'] : undefined,
    ...(deleted ? { deleted: true } : {}),
  };
}

export function resolveBuilderDraft(block: StoredBuilderSiteBlock): BuilderSiteBlock | null {
  const draft = block.builderDraft;
  if (!draft) return block._builderUnpublished ? null : block;
  if (draft.deleted) return null;
  return {
    ...block,
    title: draft.title,
    title_uk: draft.title_uk,
    title_en: draft.title_en,
    type: draft.type,
    order: draft.order,
    isActive: draft.isActive,
    page: draft.page,
    config: draft.config,
    config_uk: draft.config_uk,
    config_en: draft.config_en,
  };
}

export function createBuilderBlock(kind: PageBuilderKind, page: PageBuilderPage, order: number): BuilderSiteBlock {
  const definition = PAGE_BUILDER_KINDS.find(item => item.id === kind);
  const legacyType = definition?.legacyType || 'text_image';
  const id = `builder-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const config: BuilderSiteBlock['config'] = {
    builderKind: kind,
    builderPlacement: page === 'home' ? 'inline' : 'after',
    builderScope: 'page',
    width: 'normal',
    spacing: 'normal',
    alignment: 'left',
    anchor: '',
    heading: isNativeBuilderKind(kind) ? '' : 'Новая секция',
    subheading: '',
    style: 'light',
  };

  if (kind === 'rich_text') config.richText = { version: 1, blocks: [{ type: 'paragraph', spans: [{ text: 'Введите текст секции.' }] }] };
  if (kind === 'image') config.imageUrl = '';
  if (kind === 'gallery') {
    config.galleryImages = [];
    config.galleryLayout = 'masonry';
    config.galleryColumns = 3;
    config.galleryGap = 'medium';
    config.galleryAspect = 'original';
    config.galleryCaptionMode = 'always';
  }
  if (kind === 'divider') { config.dividerStyle = 'line'; config.heading = ''; }
  if (kind === 'spacer') { config.spacerSize = 'medium'; config.heading = ''; }
  if (kind === 'process') config.items = [{ title: 'Шаг 1', description: 'Описание этапа' }, { title: 'Шаг 2', description: 'Описание этапа' }, { title: 'Шаг 3', description: 'Описание этапа' }];
  if (kind === 'pricing') config.items = [{ value: 'від 0 ₴', title: 'Пакет', description: 'Что входит в пакет' }];
  if (kind === 'faq') config.faqItems = [{ question: 'Вопрос', answer: 'Ответ' }];
  if (kind === 'partners') config.partnerNames = ['Клиент 1', 'Клиент 2', 'Клиент 3'];
  if (kind === 'video_embed') config.videoUrl = '';
  if (kind === 'timeline') {
    config.timelineOrientation = 'vertical';
    config.timelineItems = [
      { id: `timeline-${Date.now()}-1`, date: '2024', title: 'Первый этап', description: 'Описание события' },
      { id: `timeline-${Date.now()}-2`, date: '2025', title: 'Второй этап', description: 'Описание события' },
    ];
  }
  if (kind === 'downloads') {
    config.downloadLayout = 'list';
    config.downloadItems = [{ id: `download-${Date.now()}`, title: 'Документ', description: '', url: '', fileName: '', fileType: 'PDF', fileSize: '' }];
  }
  if (kind === 'tabs') config.tabs = [{ id: `tab-${Date.now()}`, title: 'Вкладка 1', content: 'Содержимое вкладки' }];
  if (kind === 'table') {
    config.tableColumns = ['Параметр', 'Значение'];
    config.tableRows = [{ id: `row-${Date.now()}`, cells: ['Параметр', 'Значение'] }];
    config.tableStriped = true;
  }
  if (kind === 'team') {
    config.teamColumns = 3;
    config.teamItems = [{ id: `team-${Date.now()}`, name: 'Имя', role: 'Роль', bio: '', imageUrl: '', link: '' }];
  }
  if (kind === 'quote') {
    config.quoteText = 'Текст цитаты';
    config.quoteAuthor = 'Автор';
    config.quoteRole = '';
    config.alignment = 'center';
  }
  if (kind === 'cta' || kind === 'contact') {
    config.buttonText = 'Связаться с нами';
    config.buttonLink = '/contacts';
    config.style = 'indigo';
    config.alignment = 'center';
  }
  if (kind === 'contact') {
    config.contactShowPhone = true;
    config.contactShowEmail = true;
    config.contactNote = '';
  }
  if (kind === 'native_page_section') config.nativeSection = 'live.hero';
  else if (isNativeBuilderKind(kind)) config.nativeSection = kind;

  return {
    id,
    title: definition?.label || kind,
    type: legacyType,
    order,
    isActive: true,
    page,
    config,
    config_uk: {},
    config_en: {},
  };
}
