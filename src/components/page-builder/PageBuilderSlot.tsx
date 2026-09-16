import type { ReactNode } from 'react';
import { useSiteContent } from '../../context/SiteContentContext';
import {
  blockMatchesPage,
  blockPlacement,
  localizedBuilderBlock,
  pageBlocks,
  type PageBuilderPage,
  type PageBuilderPlacement,
} from '../../lib/pageBuilder';
import { PageBuilderRenderer } from './PageBuilderRenderer';

interface PageBuilderSlotProps {
  page: PageBuilderPage;
  placement: PageBuilderPlacement;
}

export function PageBuilderSlot({ page, placement }: PageBuilderSlotProps) {
  const { blocks, locale } = useSiteContent();
  const items = pageBlocks(blocks, page, placement).map(block => localizedBuilderBlock(block, locale));
  if (!items.length) return null;
  return (
    <div data-page-builder-slot={`${page}:${placement}`}>
      {items.map(block => <PageBuilderRenderer key={block.id} block={block} />)}
    </div>
  );
}

interface PageBuilderSurfaceProps {
  page: PageBuilderPage;
  children: ReactNode;
}

export function PageBuilderSurface({ page, children }: PageBuilderSurfaceProps) {
  const { blocks } = useSiteContent();
  const hasInline = blocks.some(block => block.isActive && blockMatchesPage(block, page) && blockPlacement(block, page) === 'inline');
  return (
    <>
      <PageBuilderSlot page={page} placement="before" />
      {children}
      {page !== 'home' && hasInline ? <PageBuilderSlot page={page} placement="inline" /> : null}
      <PageBuilderSlot page={page} placement="after" />
    </>
  );
}
