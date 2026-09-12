import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PortfolioCrosslinks } from './PortfolioCrosslinks';
import { SeoManager } from '../SeoManager';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <SeoManager />
      <Navbar />
      <main className="flex-grow pt-20">
        <Outlet />
        <PortfolioCrosslinks />
      </main>
      <Footer />
    </div>
  );
}
