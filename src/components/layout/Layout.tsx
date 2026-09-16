import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PortfolioCrosslinks } from './PortfolioCrosslinks';
import { SeoManager } from '../SeoManager';

const CmsVisualInspector = lazy(() => import('../CmsVisualInspector').then(module => ({ default: module.CmsVisualInspector })));

export function Layout() {
  const inspectorRequested = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cmsInspect') === '1';
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <SeoManager />
      {inspectorRequested ? <Suspense fallback={null}><CmsVisualInspector /></Suspense> : null}
      <Navbar />
      <main className="flex-grow pt-20">
        <Outlet />
        <PortfolioCrosslinks />
      </main>
      <Footer />
    </div>
  );
}
