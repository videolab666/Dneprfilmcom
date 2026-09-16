import type { BlockType, Locale, SiteBlock } from '../types';
import type { RichTextDocument } from './richText';
import type { GalleryAspect, GalleryCaptionMode, GalleryGap, GalleryLayout } from './galleryContent';

export type PageBuilderPage = 'home' | 'live' | 'video' | 'construction' | 'photo' | 'about' | 'contacts';
export type PageBuilderPlacement = 'before' | 'inline' | 'after';
export type PageBuilderWidth = 'narrow' | 'normal' | 'wide' | 'full';
export type PageBuilderSpacing = 'compact' | 'normal' | 'large';
export type PageBuilderAlignment = 'left' | 'center';

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
  | 'spacer';

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
}

export type BuilderSiteBlock = Omit<SiteBlock, 'page' | 'config' | 'config_uk' | 'config_en'> & {
  page: PageBuilderPage | 'all';
  config: SiteBlock['config'] & PageBuilderConfig;
  config_uk?: Partial<SiteBlock['config'] & PageBuilderConfig>;
  config_en?: Partial<SiteBlock['config'] & PageBuilderConfig>;
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

export const PAGE_BUILDER_PAGES: Array<{ id: PageBuilderPage; label: string; path: string }> = [
  { id: 'home', label: 'Главная', path: '/' },
  { id: 'live', label: 'Live', path: '/live' },
  { id: 'video', label: 'Video', path: '/video' },
  { id: 'construction', label: 'Construction', path: '/construction' },
  { id: 'photo', label: 'Photo', path: '/photo' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'contacts', label: 'Contacts', path: '/contacts' },
];

export const PAGE_BUILDER_KINDS: Array<{ id: PageBuilderKind; label: string; description: string; legacyType: BlockType }> = [
  { id: 'rich_text', label: 'Rich text', description: 'Форматированный текст, списки и ссылки', legacyType: 'text_image' },
  { id: 'text_image', label: 'Текст + изображение', description: 'Двухколоночная секция', legacyType: 'text_image' },
  { id: 'image', label: 'Большое изображение', description: 'Фото с заголовком и подписью', legacyType: 'text_image' },
  { id: 'gallery', label: 'Галерея', description: 'Gallery Layout 2.0: masonry/grid/justified/cinematic', legacyType: 'text_image' },
  { id: 'video_embed', label: 'Видео', description: 'YouTube / Vimeo / preview', legacyType: 'video_embed' },
  { id: 'features_grid', label: 'Преимущества', description: 'Карточки преимуществ', legacyType: 'features_grid' },
  { id: 'stats_counter', label: 'Метрики', description: 'Крупные цифры и показатели', legacyType: 'stats_counter' },
  { id: 'process', label: 'Процесс / этапы', description: 'Последовательность шагов', legacyType: 'features_grid' },
  { id: 'pricing', label: 'Пакеты / цены', description: 'Тарифные карточки', legacyType: 'features_grid' },
  { id: 'cases', label: 'Кейсы', description: 'Актуальные опубликованные кейсы', legacyType: 'features_grid' },
  { id: 'videos', label: 'Видеоработы', description: 'Опубликованные видеопроекты', legacyType: 'features_grid' },
  { id: 'testimonials', label: 'Отзывы', description: 'Отзывы клиентов', legacyType: 'features_grid' },
  { id: 'partners', label: 'Клиенты / партнёры', description: 'Логотипы / названия клиентов', legacyType: 'partners' },
  { id: 'faq', label: 'FAQ', description: 'Вопросы и ответы', legacyType: 'faq' },
  { id: 'cta', label: 'CTA', description: 'Призыв с кнопками', legacyType: 'cta' },
  { id: 'contact', label: 'Контактный CTA', description: 'Настраиваемая контактная секция с телефоном/email', legacyType: 'cta' },
  { id: 'divider', label: 'Разделитель', description: 'Линия или точки', legacyType: 'cta' },
  { id: 'spacer', label: 'Отступ', description: 'Контролируемое вертикальное пространство', legacyType: 'cta' },
];

export function asBuilderBlock(block: SiteBlock): BuilderSiteBlock {
  return block as unknown as BuilderSiteBlock;
}

export function blockKind(block: SiteBlock | BuilderSiteBlock): PageBuilderKind {
  const builder = asBuilderBlock(block as SiteBlock);
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
  blocks: SiteBlock[],
  page: PageBuilderPage,
  placement?: PageBuilderPlacement,
): BuilderSiteBlock[] {
  return blocks
    .map(asBuilderBlock)
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
    heading: 'Новая секция',
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
