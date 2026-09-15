import type { ArticleTranslation, Locale } from '../types';

export type ArticleBlockType = 'paragraph' | 'h2' | 'h3' | 'image' | 'video' | 'quote' | 'cta' | 'table' | 'faq';

interface ArticleBlockBase {
  id: string;
  type: ArticleBlockType;
}

export interface ArticleTextBlock extends ArticleBlockBase {
  type: 'paragraph' | 'h2' | 'h3';
  text: string;
}

export interface ArticleImageBlock extends ArticleBlockBase {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
}

export interface ArticleVideoBlock extends ArticleBlockBase {
  type: 'video';
  url: string;
  caption?: string;
}

export interface ArticleQuoteBlock extends ArticleBlockBase {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface ArticleCtaBlock extends ArticleBlockBase {
  type: 'cta';
  title: string;
  text?: string;
  label: string;
  url: string;
}

export interface ArticleTableBlock extends ArticleBlockBase {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ArticleFaqBlock extends ArticleBlockBase {
  type: 'faq';
  items: Array<{ question: string; answer: string }>;
}

export type ArticleBlock =
  | ArticleTextBlock
  | ArticleImageBlock
  | ArticleVideoBlock
  | ArticleQuoteBlock
  | ArticleCtaBlock
  | ArticleTableBlock
  | ArticleFaqBlock;

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function newId(prefix = 'block'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function articleBlocksField(locale: Locale): string {
  return locale === 'ru' ? 'contentBlocks' : `contentBlocks_${locale}`;
}

export function createArticleBlock(type: ArticleBlockType): ArticleBlock {
  const id = newId(type);
  if (type === 'paragraph' || type === 'h2' || type === 'h3') return { id, type, text: '' };
  if (type === 'image') return { id, type, url: '', alt: '', caption: '' };
  if (type === 'video') return { id, type, url: '', caption: '' };
  if (type === 'quote') return { id, type, text: '', attribution: '' };
  if (type === 'cta') return { id, type, title: '', text: '', label: '', url: '' };
  if (type === 'table') return { id, type, headers: ['Колонка 1', 'Колонка 2'], rows: [['', '']] };
  return { id, type: 'faq', items: [{ question: '', answer: '' }] };
}

function normalizeBlock(value: unknown, index: number): ArticleBlock | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const type = text(data.type) as ArticleBlockType;
  const id = text(data.id) || `block-${index}`;
  if (type === 'paragraph' || type === 'h2' || type === 'h3') return { id, type, text: text(data.text) };
  if (type === 'image') return { id, type, url: text(data.url), alt: text(data.alt), caption: text(data.caption) };
  if (type === 'video') return { id, type, url: text(data.url), caption: text(data.caption) };
  if (type === 'quote') return { id, type, text: text(data.text), attribution: text(data.attribution) };
  if (type === 'cta') return { id, type, title: text(data.title), text: text(data.text), label: text(data.label), url: text(data.url) };
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
          return { question: text(row.question), answer: text(row.answer) };
        }).filter(item => item.question || item.answer)
      : [];
    return { id, type, items: items.length ? items : [{ question: '', answer: '' }] };
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
  }));
}

export function articleBlocksPlainText(blocks: ArticleBlock[]): string {
  return blocks.flatMap(block => {
    if (block.type === 'paragraph' || block.type === 'h2' || block.type === 'h3') return [block.text];
    if (block.type === 'quote') return [block.text, block.attribution || ''];
    if (block.type === 'image' || block.type === 'video') return [block.caption || '', block.type === 'image' ? block.alt || '' : ''];
    if (block.type === 'cta') return [block.title, block.text || '', block.label];
    if (block.type === 'table') return [...block.headers, ...block.rows.flat()];
    return block.items.flatMap(item => [item.question, item.answer]);
  }).filter(Boolean).join(' ');
}

export function articleFaqItems(blocks: ArticleBlock[]): Array<{ question: string; answer: string }> {
  return blocks
    .filter((block): block is ArticleFaqBlock => block.type === 'faq')
    .flatMap(block => block.items)
    .filter(item => item.question.trim() && item.answer.trim());
}

export function articleImageBlocks(blocks: ArticleBlock[]): ArticleImageBlock[] {
  return blocks.filter((block): block is ArticleImageBlock => block.type === 'image' && Boolean(block.url));
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
