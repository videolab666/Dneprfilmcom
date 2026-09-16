import { lazy, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PortfolioCrosslinks } from './PortfolioCrosslinks';
import { SeoManager } from '../SeoManager';
import { useSiteContent } from '../../context/SiteContentContext';
import { hasRuntimeStructureLayout } from '../CmsStructureRuntime';
import { pixelPerfectSectionById } from '../../lib/pixelPerfectSections';

const CmsVisualInspector = lazy(() => import('../CmsVisualInspector').then(module => ({ default: module.CmsVisualInspector })));
const CmsStructureRuntime = lazy(() => import('../CmsStructureRuntime').then(module => ({ default: module.CmsStructureRuntime })));
const CmsPageComposer = lazy(() => import('../CmsPageComposer').then(module => ({ default: module.CmsPageComposer })));

interface NativeEmbedMessage {
  type: 'cms-native-section-resize' | 'cms-native-section-overlay' | 'cms-native-section-anchor' | 'cms-native-section-navigate';
  sectionId: string;
  height?: number;
  open?: boolean;
  target?: string;
  href?: string;
  fallbackHref?: string;
}

function NativeSectionEmbedRuntime({ sectionId, sectionIndex }: { sectionId: string; sectionIndex: number }) {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>('[data-cms-native-embed-main]');
    if (!main) return;

    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let lastOverlay = false;

    const post = (message: NativeEmbedMessage) => {
      if (window.parent === window) return;
      window.parent.postMessage(message, window.location.origin);
    };

    const pageRoot = () => main.firstElementChild as HTMLElement | null;
    const selectedSection = () => pageRoot()?.querySelector<HTMLElement>(`:scope > section:nth-of-type(${sectionIndex})`) || null;

    const report = () => {
      const section = selectedSection();
      if (section) {
        const rect = section.getBoundingClientRect();
        const height = Math.max(1, Math.ceil(Math.max(rect.height, section.scrollHeight)));
        post({ type: 'cms-native-section-resize', sectionId, height });
      }

      const overlay = Boolean(pageRoot()?.querySelector(':scope > .fixed.inset-0'));
      if (overlay !== lastOverlay) {
        lastOverlay = overlay;
        post({ type: 'cms-native-section-overlay', sectionId, open: overlay });
      }
    };

    const attachObservers = () => {
      resizeObserver?.disconnect();
      const section = selectedSection();
      if (section && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(report);
        resizeObserver.observe(section);
      }
      report();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      const rawHref = anchor.getAttribute('href') || '';
      if (!rawHref || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || anchor.target === '_blank') return;

      if (rawHref.startsWith('#')) {
        event.preventDefault();
        const hashTarget = rawHref.slice(1);
        post({
          type: 'cms-native-section-anchor',
          sectionId,
          target: hashTarget,
          fallbackHref: `${window.location.pathname}${rawHref}`,
        });
        return;
      }

      try {
        const url = new URL(rawHref, window.location.href);
        if (url.origin !== window.location.origin) return;
        event.preventDefault();
        post({
          type: 'cms-native-section-navigate',
          sectionId,
          href: `${url.pathname}${url.search}${url.hash}`,
        });
      } catch {
        // Leave unusual protocols and malformed URLs to the browser.
      }
    };

    const raf = window.requestAnimationFrame(attachObservers);
    const timeout = window.setTimeout(attachObservers, 120);
    main.addEventListener('click', onClick, true);

    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        attachObservers();
      });
      mutationObserver.observe(main, { childList: true, subtree: true });
    }

    window.addEventListener('load', report);
    window.addEventListener('resize', report);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      main.removeEventListener('click', onClick, true);
      window.removeEventListener('load', report);
      window.removeEventListener('resize', report);
    };
  }, [sectionId, sectionIndex]);

  return null;
}

export function Layout() {
  const { rawSettings } = useSiteContent();
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const nativeSectionId = params.get('cmsNativeSection') || '';
  const nativeSection = pixelPerfectSectionById(nativeSectionId);
  const inspectorRequested = params.get('cmsInspect') === '1';
  const composerRequested = params.get('cmsCompose') === '1';
  const structureRuntimeRequested = inspectorRequested || hasRuntimeStructureLayout(rawSettings.fullPageCms);

  if (nativeSection) {
    const scope = '[data-cms-native-embed-main]';
    const css = `
      html, body, #root { margin: 0 !important; min-height: 0 !important; background: transparent !important; }
      body { overflow-x: hidden !important; }
      ${scope} { margin: 0 !important; padding: 0 !important; min-height: 0 !important; }
      ${scope} > div { min-height: 0 !important; }
      ${scope} > div > * { display: none !important; }
      ${scope} > div > section:nth-of-type(${nativeSection.sectionIndex}) { display: block !important; }
      ${scope} > div > .fixed.inset-0 { display: flex !important; }
    `;

    return (
      <div data-cms-native-embed-root={nativeSection.id} className="m-0 min-h-0 bg-transparent p-0">
        <style>{css}</style>
        <NativeSectionEmbedRuntime sectionId={nativeSection.id} sectionIndex={nativeSection.sectionIndex} />
        <main data-cms-native-embed-main className="m-0 min-h-0 bg-transparent p-0">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <SeoManager />
      {structureRuntimeRequested ? <Suspense fallback={null}><CmsStructureRuntime /></Suspense> : null}
      {inspectorRequested ? <Suspense fallback={null}><CmsVisualInspector /></Suspense> : null}
      {composerRequested ? <Suspense fallback={null}><CmsPageComposer /></Suspense> : null}
      <Navbar />
      <main className="flex-grow pt-20">
        <Outlet />
        <PortfolioCrosslinks />
      </main>
      <Footer />
    </div>
  );
}
