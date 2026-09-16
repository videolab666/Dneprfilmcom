import { useEffect, useMemo, useState } from 'react';
import { PageBuilderRenderer as PageBuilderRendererV3 } from './PageBuilderRendererV3';
import { PAGE_BUILDER_PAGES, type BuilderSiteBlock } from '../../lib/pageBuilder';
import {
  pixelPerfectSectionById,
  type PixelPerfectSectionDefinition,
} from '../../lib/pixelPerfectSections';

interface PageBuilderRendererProps {
  block: BuilderSiteBlock;
  preview?: boolean;
}

interface NativeEmbedMessage {
  type?: string;
  sectionId?: string;
  height?: number;
  open?: boolean;
  target?: string;
  href?: string;
  fallbackHref?: string;
}

function sourcePath(section: PixelPerfectSectionDefinition): string {
  return PAGE_BUILDER_PAGES.find(item => item.id === section.page)?.path || `/${section.page}`;
}

function NativePageSection({ section, preview }: { section: PixelPerfectSectionDefinition; preview: boolean }) {
  const [height, setHeight] = useState(520);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const src = useMemo(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const params = new URLSearchParams();
    params.set('cmsNativeSection', section.id);
    if (preview) params.set('cmsPreview', '1');
    try {
      const lang = new URLSearchParams(window.location.search).get('lang');
      if (lang) params.set('lang', lang);
    } catch {
      // Browser-only component; keep default locale if URL parsing is unavailable.
    }
    return `${base}${sourcePath(section)}?${params.toString()}`;
  }, [preview, section]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<NativeEmbedMessage>) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.sectionId !== section.id) return;

      if (data.type === 'cms-native-section-resize' && typeof data.height === 'number') {
        setHeight(Math.max(80, Math.min(12000, Math.ceil(data.height))));
        return;
      }

      if (data.type === 'cms-native-section-overlay') {
        setOverlayOpen(Boolean(data.open));
        return;
      }

      if (data.type === 'cms-native-section-anchor' && data.fallbackHref) {
        window.location.assign(data.fallbackHref);
        return;
      }

      if (data.type === 'cms-native-section-navigate' && data.href) {
        window.location.assign(data.href);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [section.id]);

  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayOpen]);

  return (
    <div
      className="cms-native-page-section"
      data-cms-native-page-section={section.id}
      data-cms-native-page={section.page}
      data-cms-native-section-index={section.sectionIndex}
    >
      <iframe
        src={src}
        title={section.label}
        loading="lazy"
        scrolling="no"
        allowFullScreen
        className={overlayOpen
          ? 'fixed inset-0 z-[2147483000] block h-screen w-screen border-0 bg-white'
          : 'block w-full border-0 bg-transparent'}
        style={overlayOpen ? undefined : { height: `${height}px` }}
        data-cms-native-section-frame={section.id}
      />
    </div>
  );
}

export function PageBuilderRenderer({ block, preview = false }: PageBuilderRendererProps) {
  const nativeSection = pixelPerfectSectionById(block.config.nativeSection);
  if (nativeSection) return <NativePageSection section={nativeSection} preview={preview} />;
  return <PageBuilderRendererV3 block={block} preview={preview} />;
}
