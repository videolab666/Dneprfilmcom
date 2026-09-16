import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { PageBuilderRenderer as PageBuilderRendererV3 } from './PageBuilderRendererV3';
import type { BuilderSiteBlock } from '../../lib/pageBuilder';
import {
  pixelPerfectSectionById,
  type PixelPerfectPage,
  type PixelPerfectSectionDefinition,
} from '../../lib/pixelPerfectSections';

interface PageBuilderRendererProps {
  block: BuilderSiteBlock;
  preview?: boolean;
}

const NativeLive = lazy(() => import('../../pages/LiveProduction').then(module => ({ default: module.LiveProduction })));
const NativeVideo = lazy(() => import('../../pages/VideoProduction').then(module => ({ default: module.VideoProduction })));
const NativeConstruction = lazy(() => import('../../pages/ConstructionMedia').then(module => ({ default: module.ConstructionMedia })));
const NativePhoto = lazy(() => import('../../pages/PhotoProduction').then(module => ({ default: module.PhotoProduction })));

const PAGE_COMPONENTS: Record<PixelPerfectPage, LazyExoticComponent<ComponentType>> = {
  live: NativeLive,
  video: NativeVideo,
  construction: NativeConstruction,
  photo: NativePhoto,
};

function NativePageSection({ section }: { section: PixelPerfectSectionDefinition }) {
  const Page = PAGE_COMPONENTS[section.page];
  const escapedId = section.id.replace(/"/g, '\\"');
  const scope = `[data-cms-native-page-section="${escapedId}"]`;
  const css = `
    ${scope} > div { min-height: 0 !important; }
    ${scope} > div > * { display: none !important; }
    ${scope} > div > section:nth-of-type(${section.sectionIndex}) { display: block !important; }
  `;

  return (
    <div
      className="cms-native-page-section"
      data-cms-native-page-section={section.id}
      data-cms-native-page={section.page}
      data-cms-native-section-index={section.sectionIndex}
    >
      <style>{css}</style>
      <Suspense fallback={<div className="min-h-48 bg-slate-50" aria-hidden="true" />}>
        <Page />
      </Suspense>
    </div>
  );
}

export function PageBuilderRenderer({ block, preview = false }: PageBuilderRendererProps) {
  const nativeSection = pixelPerfectSectionById(block.config.nativeSection);
  if (nativeSection) return <NativePageSection section={nativeSection} />;
  return <PageBuilderRendererV3 block={block} preview={preview} />;
}
