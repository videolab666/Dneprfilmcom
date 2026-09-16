import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { useSiteContent } from '../../context/SiteContentContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import {
  localizedBuilderBlock,
  resolveBuilderDraft,
  type BuilderSiteBlock,
  type PageBuilderPage,
  type StoredBuilderSiteBlock,
} from '../../lib/pageBuilder';
import {
  composerPageForRuntime,
  normalizePageComposer,
  pageComposerSupported,
  syncComposerPage,
  type PageComposerItem,
} from '../../lib/pageComposer';
import { pixelPerfectSectionById } from '../../lib/pixelPerfectSections';
import { PageBuilderRenderer } from './PageBuilderRenderer';

interface PageComposerRuntimeProps {
  page: PageBuilderPage;
  preview?: boolean;
  compose?: boolean;
}

interface PortalEntry {
  item: PageComposerItem;
  host: HTMLDivElement;
  block: BuilderSiteBlock;
}

function useRuntimeBlocks(preview: boolean): StoredBuilderSiteBlock[] | null {
  const { user } = useAuth();
  const [stored, setStored] = useState<StoredBuilderSiteBlock[] | null>(null);
  const enabled = preview && Boolean(user);

  useEffect(() => {
    if (!enabled) {
      setStored(null);
      return;
    }
    return onSnapshot(collection(db, 'site_blocks'), snapshot => {
      setStored(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StoredBuilderSiteBlock)));
    }, error => {
      console.warn('Page Composer draft blocks:', error);
      setStored(null);
    });
  }, [enabled]);

  return stored;
}

export function PageComposerRuntime({ page, preview = false, compose = false }: PageComposerRuntimeProps) {
  const { rawSettings, blocks: publishedBlocks, locale } = useSiteContent();
  const stored = useRuntimeBlocks(preview);
  const [portals, setPortals] = useState<PortalEntry[]>([]);

  const sourceBlocks = useMemo<BuilderSiteBlock[]>(() => {
    if (preview && stored) {
      return stored.map(resolveBuilderDraft).filter((item): item is BuilderSiteBlock => Boolean(item));
    }
    return publishedBlocks as BuilderSiteBlock[];
  }, [preview, publishedBlocks, stored]);

  const content = useMemo(() => normalizePageComposer(
    (rawSettings as unknown as { pageComposer?: unknown }).pageComposer,
  ), [rawSettings]);

  const layout = useMemo(() => {
    if (!pageComposerSupported(page)) return undefined;
    const configured = composerPageForRuntime(content, page, preview);
    if (!configured && !compose) return undefined;
    return syncComposerPage(page, configured, sourceBlocks);
  }, [compose, content, page, preview, sourceBlocks]);

  useEffect(() => {
    setPortals([]);
    if (!layout || !pageComposerSupported(page)) return;
    const marker = document.querySelector<HTMLElement>(`[data-cms-page-root-marker="${page}"]`);
    const root = marker?.nextElementSibling as HTMLElement | null;
    if (!root) return;

    const previousDisplay = root.style.display;
    const previousDirection = root.style.flexDirection;
    root.style.display = 'flex';
    root.style.flexDirection = 'column';
    root.setAttribute('data-cms-composer-root', page);

    const directSections = Array.from(root.querySelectorAll<HTMLElement>(':scope > section'));
    const restored: Array<{ element: HTMLElement; display: string; order: string; item?: string | null; label?: string | null }> = [];
    const nativeItems = layout.items.filter(item => item.kind === 'native');

    for (const item of nativeItems) {
      const definition = pixelPerfectSectionById(item.refId);
      if (!definition || definition.page !== page) continue;
      const element = directSections[definition.sectionIndex - 1];
      if (!element) continue;
      restored.push({
        element,
        display: element.style.display,
        order: element.style.order,
        item: element.getAttribute('data-cms-composer-item'),
        label: element.getAttribute('data-cms-composer-label'),
      });
      element.style.order = String(item.order);
      if (!item.enabled) element.style.display = 'none';
      element.setAttribute('data-cms-composer-item', item.id);
      element.setAttribute('data-cms-composer-label', definition.label);
    }

    const byId = new Map<string, BuilderSiteBlock>(sourceBlocks.map(block => [block.id, block] as [string, BuilderSiteBlock]));
    const entries: PortalEntry[] = [];
    for (const item of layout.items.filter(entry => entry.kind === 'block')) {
      const block = byId.get(item.refId);
      if (!block || !block.isActive || !item.enabled) continue;
      const host = document.createElement('div');
      host.dataset.cmsComposerItem = item.id;
      host.dataset.cmsComposerBlock = block.id;
      host.dataset.cmsComposerLabel = block.title_uk || block.title;
      host.className = 'w-full';
      host.style.order = String(item.order);
      root.appendChild(host);
      entries.push({ item, host, block: localizedBuilderBlock(block, locale) });
    }

    setPortals(entries);

    return () => {
      setPortals([]);
      for (const entry of entries) entry.host.remove();
      for (const saved of restored) {
        saved.element.style.display = saved.display;
        saved.element.style.order = saved.order;
        if (saved.item == null) saved.element.removeAttribute('data-cms-composer-item');
        else saved.element.setAttribute('data-cms-composer-item', saved.item);
        if (saved.label == null) saved.element.removeAttribute('data-cms-composer-label');
        else saved.element.setAttribute('data-cms-composer-label', saved.label);
      }
      root.style.display = previousDisplay;
      root.style.flexDirection = previousDirection;
      root.removeAttribute('data-cms-composer-root');
    };
  }, [layout, locale, page, sourceBlocks]);

  return <>{portals.map(entry => createPortal(
    <PageBuilderRenderer block={entry.block} preview={preview} />,
    entry.host,
    entry.item.id,
  ))}</>;
}
