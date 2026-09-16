import { lazy, Suspense } from 'react';
import type { BuilderSiteBlock } from '../../lib/pageBuilder';

const LazyPageBuilderRenderer = lazy(() =>
  import('./PageBuilderRendererV4').then(module => ({ default: module.PageBuilderRenderer })),
);

interface PageBuilderRendererProps {
  block: BuilderSiteBlock;
  preview?: boolean;
}

export function PageBuilderRenderer({ block, preview = false }: PageBuilderRendererProps) {
  return (
    <Suspense fallback={null}>
      <LazyPageBuilderRenderer block={block} preview={preview} />
    </Suspense>
  );
}
