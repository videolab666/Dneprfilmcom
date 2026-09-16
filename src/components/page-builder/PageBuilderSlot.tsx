import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useSiteContent } from '../../context/SiteContentContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import {
  localizedBuilderBlock,
  pageBlocks,
  resolveBuilderDraft,
  type BuilderSiteBlock,
  type PageBuilderPage,
  type PageBuilderPlacement,
  type StoredBuilderSiteBlock,
} from '../../lib/pageBuilder';
import { PageBuilderRenderer } from './PageBuilderRenderer';

interface PageBuilderSlotProps {
  page: PageBuilderPage;
  placement: PageBuilderPlacement;
}

function nativeSectionEmbedRequested(): boolean {
  try { return Boolean(new URLSearchParams(window.location.search).get('cmsNativeSection')); } catch { return false; }
}

function useBuilderDraftPreview(): { enabled: boolean; blocks: BuilderSiteBlock[] | null } {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<BuilderSiteBlock[] | null>(null);
  const requested = useMemo(() => {
    try { return new URLSearchParams(window.location.search).get('cmsPreview') === '1'; } catch { return false; }
  }, []);
  const enabled = requested && Boolean(user);

  useEffect(() => {
    if (!enabled) {
      setBlocks(null);
      return;
    }
    return onSnapshot(collection(db, 'site_blocks'), snapshot => {
      const resolved = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() } as StoredBuilderSiteBlock))
        .map(resolveBuilderDraft)
        .filter((item): item is BuilderSiteBlock => Boolean(item));
      setBlocks(resolved);
    }, error => {
      console.warn('Page Builder draft preview:', error);
      setBlocks(null);
    });
  }, [enabled]);

  return { enabled, blocks };
}

export function PageBuilderSlot({ page, placement }: PageBuilderSlotProps) {
  const { blocks: publishedBlocks, locale } = useSiteContent();
  const preview = useBuilderDraftPreview();
  const source = preview.enabled && preview.blocks ? preview.blocks : publishedBlocks;
  const items = pageBlocks(source, page, placement).map(block => localizedBuilderBlock(block, locale));
  if (!items.length) return null;
  return (
    <div data-page-builder-slot={`${page}:${placement}`} data-cms-builder-preview={preview.enabled ? 'draft' : 'published'}>
      {items.map(block => <div key={block.id} className="contents" data-cms-builder-block={block.id}><PageBuilderRenderer block={block} preview={preview.enabled} /></div>)}
    </div>
  );
}

interface PageBuilderSurfaceProps {
  page: PageBuilderPage;
  children: ReactNode;
}

export function PageBuilderSurface({ page, children }: PageBuilderSurfaceProps) {
  // A pixel-perfect section is rendered inside an isolated same-origin iframe.
  // Never render builder slots inside that iframe, otherwise a native builder
  // block could recursively embed itself.
  if (nativeSectionEmbedRequested()) return <>{children}</>;

  return (
    <>
      <PageBuilderSlot page={page} placement="before" />
      {children}
      {page !== 'home' ? <PageBuilderSlot page={page} placement="inline" /> : null}
      <PageBuilderSlot page={page} placement="after" />
    </>
  );
}
