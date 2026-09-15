import type { ArticleTranslation, Locale } from '../types';
import {
  createRichText,
  normalizeRichText,
  richTextPlainText,
  type RichTextDocument,
  type RichTextValue,
} from './richText';

export type ArticleBlockType =
  | 'paragraph'
  | 'h2'
  | 'h3'
  | 'image'
  | 'gallery'
  | 'video'
  | 'quote'
  | 'callout'
  | 'cta'
  | 'table'
  | 'faq'
  | 'columns'
  | 'related'
  | 'divider'
  | 'spacer';

interface ArticleBlockBase {
  id: string;
  type: ArticleBlockType;
}

export interface ArticleTextBlock extends ArticleBlockBase {
  type: 'paragraph' | 'h2' | 'h3';
  text: string;
  richText?: RichTextDocument;
}

export interface ArticleImageBlock extends ArticleBlockBase {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
}

export interface ArticleGalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

export interface ArticleGalleryBlock extends ArticleBlockBase {
  type: 'gallery';
  images: ArticleGalleryImage[];
  layout: 'grid' | 'masonry';
  columns: 2 | 3 | 4;
}

export interface ArticleVideoBlock extends ArticleBlockBase {
  type: 'video';
  url: string;
  caption?: string;
}

export interface ArticleQuoteBlock extends ArticleBlockBase {
  type: 'quote';
  text: string;
  richText?: RichTextDocument;
  attribution?: string;
}

export interface ArticleCalloutBlock extends ArticleBlockBase {
  type: 'callout';
  tone: 'info' | 'success' | 'warning';
  title?: string;
  text: string;
  richText?: RichTextDocument;
}

export interface ArticleCtaBlock extends ArticleBlockBase {
  type: 'cta';
  title: string;
  text?: string;
  richText?: RichTextDocument;
  label: string;
  url: string;
}

export interface ArticleTableBlock extends ArticleBlockBase {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ArticleFaqItem {
  question: string;
  answer: string;
  answerRichText?: RichTextDocument;
}

export interface ArticleFaqBlock extends ArticleBlockBase {
  type: 'faq';
  items: ArticleFaqItem[];
}

export interface ArticleColumnsBlock extends ArticleBlockBase {
  type: 'columns';
  ratio: '1-1' | '2-1' | '1-2';
  left: RichTextDocument;
  right: RichTextDocument;
}

export interface ArticleRelatedBlock extends ArticleBlockBase {
  type: 'related';
  contentType: 'case' | 'gallery' | 'video';
  targetId: string;
  title: string;
  url: string;
  imageUrl?: string;
  description?: string;
}

export interface ArticleDividerBlock extends ArticleBlockBase {
  type: 'divider';
  style: 'line' | 'dots';
}

export interface ArticleSpacerBlock extends ArticleBlockBase {
  type: 'spacer';
  size: 'small' | 'medium' | 'large';
}

export type ArticleBlock =
  | ArticleTextBlock
  | ArticleImageBlock
  | ArticleGalleryBlock
  | ArticleVideoBlock
  | ArticleQuoteBlock
  | ArticleCalloutBlock
  | ArticleCtaBlock
  | ArticleTableBlock
  | ArticleFaqBlock
  | ArticleColumnsBlock
  | ArticleRelatedBlock
  | ArticleDividerBlock
  | ArticleSpacerBlock;

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function newId(prefix = 'block'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rich(value: unknown, fallback = ''): RichTextDocument | undefined {
  if (!value && !fallback) return undefined;
  return normalizeRichText(value as RichTextValue, fallback);
}

export function articleBlocksField(locale: Locale): string {
  return locale === 'ru' ? 'contentBlocks' : `contentBlocks_${locale}`;
}

export function createArticleBlock(type: ArticleBlockType): ArticleBlock {
  const id = newId(type);
  if (type === 'paragraph') return { id, type, text: '', richText: createRichText() };
  if (type === 'h2' || type === 'h3') return { id, type, text: '' };
  if (type === 'image') return { id, type, url: '', alt: '', caption: '' };
  if (type === 'gallery') return { id, type, images: [], layout: 'grid', columns: 3 };
  if (type === 'video') return { id, type, url: '', caption: '' };
  if (type === 'quote') return { id, type, text: '', richText: createRichText(), attribution: '' };
  if (type === 'callout') return { id, type, tone: 'info', title: '', text: '', richText: createRichText() };
  if (type === 'cta') return { id, type, title: '', text: '', richText: createRichText(), label: '', url: '' };
  if (type === 'table') return { id, type, headers: ['Колонка 1', 'Колонка 2'], rows: [['', '']] };
  if (type === 'faq') return { id, type, items: [{ question: '', answer: '', answerRichText: createRichText() }] };
  if (type === 'columns') return { id, type, ratio: '1-1', left: createRichText(), right: createRichText() };
  if (type === 'related') return { id, type, contentType: 'case', targetId: '', title: '', url: '' };
  if (type === 'divider') return { id, type, style: 'line' };
  return { id, type: 'spacer', size: 'medium' };
}

function normalizeGalleryImages(value: unknown): ArticleGalleryImage[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      id: text(row.id) || `gallery-image-${index}`,
      url: text(row.url),
      alt: text(row.alt),
      caption: text(row.caption),
    };
  }).filter(item => Boolean(item.url));
}

function normalizeBlock(value: unknown, index: number): ArticleBlock | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const type = text(data.type) as ArticleBlockType;
  const id = text(data.id) || `block-${index}`;
  if (type === 'paragraph' || type === 'h2' || type === 'h3') {
    const plain = text(data.text);
    return { id, type, text: plain, ...(type === 'paragraph' && data.richText ? { richText: rich(data.richText, plain) } : {}) };
  }
  if (type === 'image') return { id, type, url: text(data.url), alt: text(data.alt), caption: text(data.caption) };
  if (type === 'gallery') {
    const columns = Number(data.columns);
    return {
      id,
      type,
      images: normalizeGalleryImages(data.images),
      layout: data.layout === 'masonry' ? 'masonry' : 'grid',
      columns: columns === 2 || columns === 4 ? columns : 3,
    };
  }
  if (type === 'video') return { id, type, url: text(data.url), caption: text(data.caption) };
  if (type === 'quote') {
    const plain = text(data.text);
    return { id, type, text: plain, richText: rich(data.richText, plain), attribution: text(data.attribution) };
  }
  if (type === 'callout') {
    const plain = text(data.text);
    const tone = data.tone === 'success' || data.tone === 'warning' ? data.tone : 'info';
    return { id, type, tone, title: text(data.title), text: plain, richText: rich(data.richText, plain) };
  }
  if (type === 'cta') {
    const plain = text(data.text);
    return { id, type, title: text(data.title), text: plain, richText: rich(data.richText, plain), label: text(data.label), url: text(data.url) };
  }
  if (type === 'table') {
    const rows = Array.isArray(data.rows)
      ? data.rows.map(row => Array.isArray(row) ? row.map(cell => String(cell ?? '')) : []).filter(row => row.length > 0)
      : [];
    return { id, type, headers: strings(data.headers), rows };
  }
  if (type === 'faq') {
    const items = Array.isArray(data.items)
      ? data.items.map(item => {
          const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
          const answer = text(row.answer);
          return { question: text(row.question), answer, ...(row.answerRichText ? { answerRichText: rich(row.answerRichText, answer) } : {}) };
        }).filter(item => item.question || item.answer || item.answerRichText)
      : [];
    return { id, type, items: items.length ? items : [{ question: '', answer: '', answerRichText: createRichText() }] };
  }
  if (type === 'columns') {
    const ratio = data.ratio === '2-1' || data.ratio === '1-2' ? data.ratio : '1-1';
    return {
      id,
      type,
      ratio,
      left: normalizeRichText(data.left as RichTextValue),
      right: normalizeRichText(data.right as RichTextValue),
    };
  }
  if (type === 'related') {
    const contentType = data.contentType === 'gallery' || data.contentType === 'video' ? data.contentType : 'case';
    return {
      id,
      type,
      contentType,
      targetId: text(data.targetId),
      title: text(data.title),
      url: text(data.url),
      imageUrl: text(data.imageUrl),
      description: text(data.description),
    };
  }
  if (type === 'divider') return { id, type, style: data.style === 'dots' ? 'dots' : 'line' };
  if (type === 'spacer') {
    const size = data.size === 'small' || data.size === 'large' ? data.size : 'medium';
    return { id, type, size };
  }
  return null;
}

export function normalizeArticleBlocks(
  article: Record<string, unknown>,
  locale: Locale,
  fallbackTranslation?: ArticleTranslation | null,
): ArticleBlock[] {
  const raw = article[articleBlocksField(locale)];
  if (Array.isArray(raw)) {
    const blocks = raw.map(normalizeBlock).filter((item): item is ArticleBlock => Boolean(item));
    if (blocks.length) return blocks;
  }

  return (fallbackTranslation?.content || []).map((paragraph, index) => ({
    id: `legacy-paragraph-${index}`,
    type: 'paragraph' as const,
    text: paragraph,
    richText: createRichText(paragraph),
  }));
}

export function articleBlocksPlainText(blocks: ArticleBlock[]): string {
  return blocks.flatMap(block => {
    if (block.type === 'paragraph') return [richTextPlainText(block.richText || block.text) || block.text];
    if (block.type === 'h2' || block.type === 'h3') return [block.text];
    if (block.type === 'quote') return [richTextPlainText(block.richText || block.text) || block.text, block.attribution || ''];
    if (block.type === 'callout') return [block.title || '', richTextPlainText(block.richText || block.text) || block.text];
    if (block.type === 'image' || block.type === 'video') return [block.caption || '', block.type === 'image' ? block.alt || '' : ''];
    if (block.type === 'gallery') return block.images.flatMap(image => [image.alt || '', image.caption || '']);
    if (block.type === 'cta') return [block.title, richTextPlainText(block.richText || block.text || ''), block.label];
    if (block.type === 'table') return [...block.headers, ...block.rows.flat()];
    if (block.type === 'faq') return block.items.flatMap(item => [item.question, richTextPlainText(item.answerRichText || item.answer) || item.answer]);
    if (block.type === 'columns') return [richTextPlainText(block.left), richTextPlainText(block.right)];
    if (block.type === 'related') return [block.title, block.description || ''];
    return [];
  }).filter(Boolean).join(' ');
}

export function articleFaqItems(blocks: ArticleBlock[]): Array<{ question: string; answer: string }> {
  return blocks
    .filter((block): block is ArticleFaqBlock => block.type === 'faq')
    .flatMap(block => block.items)
    .map(item => ({ question: item.question, answer: richTextPlainText(item.answerRichText || item.answer) || item.answer }))
    .filter(item => item.question.trim() && item.answer.trim());
}

export function articleImageBlocks(blocks: ArticleBlock[]): ArticleImageBlock[] {
  return blocks.flatMap(block => {
    if (block.type === 'image' && block.url) return [block];
    if (block.type === 'gallery') {
      return block.images.filter(image => Boolean(image.url)).map(image => ({
        id: `${block.id}-${image.id}`,
        type: 'image' as const,
        url: image.url,
        alt: image.alt,
        caption: image.caption,
      }));
    }
    if (block.type === 'related' && block.imageUrl) {
      return [{ id: `${block.id}-related`, type: 'image' as const, url: block.imageUrl, alt: block.title, caption: block.description }];
    }
    return [];
  });
}

export function articleVideoBlocks(blocks: ArticleBlock[]): ArticleVideoBlock[] {
  return blocks.filter((block): block is ArticleVideoBlock => block.type === 'video' && Boolean(block.url));
}

export function videoEmbedUrl(value: string): string {
  const url = value.trim();
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = parsed.pathname.split('/').filter(Boolean);
      const short = parts[0] === 'shorts' ? parts[1] : parts[0] === 'embed' ? parts[1] : '';
      return short ? `https://www.youtube.com/embed/${short}` : url;
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
  } catch {
    return url;
  }
  return url;
}
