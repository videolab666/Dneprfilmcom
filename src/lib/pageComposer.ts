import {
  blockMatchesPage,
  blockPlacement,
  resolveBuilderDraft,
  type BuilderSiteBlock,
  type PageBuilderPage,
  type StoredBuilderSiteBlock,
} from './pageBuilder';
import { pixelPerfectSectionsForPage, type PixelPerfectPage } from './pixelPerfectSections';

export const PAGE_COMPOSER_VERSION = 1 as const;
export const PAGE_COMPOSER_PAGES: PixelPerfectPage[] = ['live', 'video', 'construction', 'photo'];

export type PageComposerItemKind = 'native' | 'block';

export interface PageComposerItem {
  id: string;
  kind: PageComposerItemKind;
  refId: string;
  enabled: boolean;
  order: number;
}

export interface PageComposerPageState {
  items: PageComposerItem[];
}

export interface PageComposerSnapshot {
  pages: Partial<Record<PageBuilderPage, PageComposerPageState>>;
}

export interface PageComposerContent {
  version: typeof PAGE_COMPOSER_VERSION;
  published: PageComposerSnapshot;
  draft: PageComposerSnapshot;
  draftUpdatedAt?: number;
  draftUpdatedBy?: string;
  publishedAt?: number;
  publishedBy?: string;
}

const EMPTY_SNAPSHOT: PageComposerSnapshot = { pages: {} };

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeItem(raw: unknown, fallbackOrder: number): PageComposerItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<PageComposerItem>;
  if ((value.kind !== 'native' && value.kind !== 'block') || typeof value.refId !== 'string' || !value.refId) return null;
  const id = typeof value.id === 'string' && value.id ? value.id : `${value.kind}:${value.refId}`;
  return {
    id,
    kind: value.kind,
    refId: value.refId,
    enabled: value.enabled !== false,
    order: Number.isFinite(Number(value.order)) ? Number(value.order) : fallbackOrder,
  };
}

function normalizeSnapshot(raw: unknown): PageComposerSnapshot {
  if (!raw || typeof raw !== 'object') return clone(EMPTY_SNAPSHOT);
  const pagesRaw = (raw as { pages?: unknown }).pages;
  if (!pagesRaw || typeof pagesRaw !== 'object') return clone(EMPTY_SNAPSHOT);
  const pages: PageComposerSnapshot['pages'] = {};
  for (const [page, pageRaw] of Object.entries(pagesRaw as Record<string, unknown>)) {
    if (!pageRaw || typeof pageRaw !== 'object') continue;
    const itemsRaw = (pageRaw as { items?: unknown }).items;
    if (!Array.isArray(itemsRaw)) continue;
    const items = itemsRaw
      .map((item, index) => normalizeItem(item, index * 10))
      .filter((item): item is PageComposerItem => Boolean(item))
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index * 10 }));
    pages[page as PageBuilderPage] = { items };
  }
  return { pages };
}

export function normalizePageComposer(raw: unknown): PageComposerContent {
  if (!raw || typeof raw !== 'object') {
    return { version: PAGE_COMPOSER_VERSION, published: clone(EMPTY_SNAPSHOT), draft: clone(EMPTY_SNAPSHOT) };
  }
  const value = raw as Partial<PageComposerContent>;
  return {
    version: PAGE_COMPOSER_VERSION,
    published: normalizeSnapshot(value.published),
    draft: normalizeSnapshot(value.draft),
    ...(typeof value.draftUpdatedAt === 'number' ? { draftUpdatedAt: value.draftUpdatedAt } : {}),
    ...(typeof value.draftUpdatedBy === 'string' ? { draftUpdatedBy: value.draftUpdatedBy } : {}),
    ...(typeof value.publishedAt === 'number' ? { publishedAt: value.publishedAt } : {}),
    ...(typeof value.publishedBy === 'string' ? { publishedBy: value.publishedBy } : {}),
  };
}

export function pageComposerSupported(page: PageBuilderPage): page is PixelPerfectPage {
  return PAGE_COMPOSER_PAGES.includes(page as PixelPerfectPage);
}

export function publishedComposerPage(content: PageComposerContent, page: PageBuilderPage): PageComposerPageState | undefined {
  return content.published.pages[page];
}

export function draftComposerPage(content: PageComposerContent, page: PageBuilderPage): PageComposerPageState | undefined {
  return content.draft.pages[page];
}

export function composerPageForRuntime(content: PageComposerContent, page: PageBuilderPage, preview: boolean): PageComposerPageState | undefined {
  return (preview ? content.draft.pages[page] : undefined) || content.published.pages[page];
}

export function composerHasPublishedPage(content: PageComposerContent, page: PageBuilderPage): boolean {
  return Boolean(content.published.pages[page]?.items.length);
}

export function resolveComposerBlocks(stored: StoredBuilderSiteBlock[], preview: boolean): BuilderSiteBlock[] {
  if (!preview) return stored.filter(item => !item._builderUnpublished) as BuilderSiteBlock[];
  return stored.map(resolveBuilderDraft).filter((item): item is BuilderSiteBlock => Boolean(item));
}

export function defaultComposerPage(page: PixelPerfectPage, blocks: BuilderSiteBlock[]): PageComposerPageState {
  const native = pixelPerfectSectionsForPage(page).map((section, index): PageComposerItem => ({
    id: `native:${section.id}`,
    kind: 'native',
    refId: section.id,
    enabled: true,
    order: index * 10,
  }));

  const matching = blocks
    .filter(block => blockMatchesPage(block, page))
    .filter(block => block.config.builderScope !== 'global')
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const before = matching.filter(block => blockPlacement(block, page) === 'before');
  const after = matching.filter(block => blockPlacement(block, page) !== 'before');
  const sequence: PageComposerItem[] = [
    ...before.map(block => ({ id: `block:${block.id}`, kind: 'block' as const, refId: block.id, enabled: block.isActive, order: 0 })),
    ...native,
    ...after.map(block => ({ id: `block:${block.id}`, kind: 'block' as const, refId: block.id, enabled: block.isActive, order: 0 })),
  ];
  return { items: sequence.map((item, index) => ({ ...item, order: index * 10 })) };
}

export function syncComposerPage(page: PixelPerfectPage, current: PageComposerPageState | undefined, blocks: BuilderSiteBlock[]): PageComposerPageState {
  const fallback = defaultComposerPage(page, blocks);
  if (!current) return fallback;
  const nativeIds = new Set(pixelPerfectSectionsForPage(page).map(section => section.id));
  const blockIds = new Set(blocks.filter(block => blockMatchesPage(block, page) && block.config.builderScope !== 'global').map(block => block.id));
  const known = current.items.filter(item => item.kind === 'native' ? nativeIds.has(item.refId) : blockIds.has(item.refId));
  const keys = new Set(known.map(item => `${item.kind}:${item.refId}`));
  const appended = fallback.items.filter(item => !keys.has(`${item.kind}:${item.refId}`));
  return { items: [...known, ...appended].map((item, index) => ({ ...item, order: index * 10 })) };
}

export function replaceComposerDraftPage(
  content: PageComposerContent,
  page: PageBuilderPage,
  state: PageComposerPageState,
  actor?: string,
): PageComposerContent {
  return {
    ...content,
    draft: { pages: { ...content.draft.pages, [page]: clone(state) } },
    draftUpdatedAt: Date.now(),
    ...(actor ? { draftUpdatedBy: actor } : {}),
  };
}

export function publishComposerPage(content: PageComposerContent, page: PageBuilderPage, actor?: string): PageComposerContent {
  const source = content.draft.pages[page];
  if (!source) return content;
  return {
    ...content,
    published: { pages: { ...content.published.pages, [page]: clone(source) } },
    publishedAt: Date.now(),
    ...(actor ? { publishedBy: actor } : {}),
  };
}

export function discardComposerDraftPage(content: PageComposerContent, page: PageBuilderPage, actor?: string): PageComposerContent {
  const nextDraft = { ...content.draft.pages };
  const published = content.published.pages[page];
  if (published) nextDraft[page] = clone(published);
  else delete nextDraft[page];
  return {
    ...content,
    draft: { pages: nextDraft },
    draftUpdatedAt: Date.now(),
    ...(actor ? { draftUpdatedBy: actor } : {}),
  };
}
