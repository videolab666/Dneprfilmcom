import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import {
  composerHasPublishedPage,
  draftComposerPage,
  normalizePageComposer,
  pageComposerSupported,
} from '../../lib/pageComposer';
import { PageBuilderRenderer } from './PageBuilderRenderer';

const LazyPageComposerRuntime = lazy(() => import('./PageComposerRuntime').then(module => ({ default: module.PageComposerRuntime })));
const LazyCmsInlineEditingOverlay = lazy(() => import('../CmsInlineEditingOverlay').then(module => ({ default: module.CmsInlineEditingOverlay })));

interface PageBuilderSlotProps {
  page: PageBuilderPage;
  placement: PageBuilderPlacement;
}

function params(): URLSearchParams {
  try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); }
}

function nativeSectionEmbedRequested(): boolean {
  return Boolean(params().get('cmsNativeSection'));
}

function useBuilderDraftPreview(): { enabled: boolean; blocks: BuilderSiteBlock[] | null } {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<BuilderSiteBlock[] | null>(null);
  const requested = useMemo(() => params().get('cmsPreview') === '1', []);
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
  const { rawSettings } = useSiteContent();
  const { user } = useAuth();

  if (nativeSectionEmbedRequested()) return <>{children}</>;

  const query = params();
  const composeRequested = query.get('cmsCompose') === '1' && Boolean(user);
  const previewRequested = (query.get('cmsPreview') === '1' || composeRequested) && Boolean(user);
  const composer = normalizePageComposer((rawSettings as unknown as { pageComposer?: unknown }).pageComposer);
  const supported = pageComposerSupported(page);
  const composerMode = supported && (
    composerHasPublishedPage(composer, page)
    || (previewRequested && Boolean(draftComposerPage(composer, page)))
    || composeRequested
  );

  if (composerMode) {
    return (
      <>
        <span hidden data-cms-page-root-marker={page} />
        {children}
        <Suspense fallback={null}>
          <LazyPageComposerRuntime page={page} preview={previewRequested} compose={composeRequested} />
          {composeRequested ? <LazyCmsInlineEditingOverlay page={page} /> : null}
        </Suspense>
      </>
    );
  }

  return (
    <>
      <PageBuilderSlot page={page} placement="before" />
      {children}
      {page !== 'home' ? <PageBuilderSlot page={page} placement="inline" /> : null}
      <PageBuilderSlot page={page} placement="after" />
    </>
  );
}
