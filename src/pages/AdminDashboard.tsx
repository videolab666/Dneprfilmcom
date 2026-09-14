import React, { lazy, Suspense, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  Layers,
  Sliders,
  Briefcase,
  Film,
  Images,
  FolderOpen,
  MessageSquare,
  Radio,
  Inbox,
  FileText,
  ExternalLink,
  ShieldCheck,
  Link2,
  Activity,
  Loader2,
} from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';

const BlocksManager = lazy(() => import('../components/admin/BlocksManager').then(module => ({ default: module.BlocksManager })));
const SiteSettingsEditor = lazy(() => import('../components/admin/SiteSettingsEditor').then(module => ({ default: module.SiteSettingsEditor })));
const CasesManager = lazy(() => import('../components/admin/CasesManager').then(module => ({ default: module.CasesManager })));
const GalleriesManager = lazy(() => import('../components/admin/GalleriesManager').then(module => ({ default: module.GalleriesManager })));
const VideosManager = lazy(() => import('../components/admin/VideosManager').then(module => ({ default: module.VideosManager })));
const MediaLibraryManager = lazy(() => import('../components/admin/MediaLibraryManager').then(module => ({ default: module.MediaLibraryManager })));
const TestimonialsManager = lazy(() => import('../components/admin/TestimonialsManager').then(module => ({ default: module.TestimonialsManager })));
const BackstageManager = lazy(() => import('../components/admin/BackstageManager').then(module => ({ default: module.BackstageManager })));
const LeadsCRM = lazy(() => import('../components/admin/LeadsCRM').then(module => ({ default: module.LeadsCRM })));
const ArticlesManager = lazy(() => import('../components/admin/ArticlesManager').then(module => ({ default: module.ArticlesManager })));
const PageContentManager = lazy(() => import('../components/admin/PageContentManager').then(module => ({ default: module.PageContentManager })));
const PageCopyManager = lazy(() => import('../components/admin/PageCopyManager').then(module => ({ default: module.PageCopyManager })));
const RelationsManager = lazy(() => import('../components/admin/RelationsManager').then(module => ({ default: module.RelationsManager })));
const CmsDiagnostics = lazy(() => import('../components/admin/CmsDiagnostics').then(module => ({ default: module.CmsDiagnostics })));

type AdminTab = 'blocks' | 'settings' | 'pages' | 'page-copy' | 'cases' | 'galleries' | 'videos' | 'relations' | 'media' | 'diagnostics' | 'testimonials' | 'backstage' | 'leads' | 'articles';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

function AdminPanelFallback() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        Загрузка раздела…
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { settings, isUk } = useSiteContent();
  const [activeTab, setActiveTab] = useState<AdminTab>('blocks');

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login', { replace: true });
  };

  const navItems: NavItem[] = [
    { id: 'blocks', label: isUk ? 'Конструктор блоків' : 'Конструктор блоков', icon: <Layers className="w-4 h-4" />, badge: 'CMS' },
    { id: 'settings', label: isUk ? 'Головна & Засновник' : 'Главная & Основатель', icon: <Sliders className="w-4 h-4" /> },
    { id: 'pages', label: isUk ? 'Контент сторінок' : 'Контент страниц', icon: <Layers className="w-4 h-4" /> },
    { id: 'page-copy', label: isUk ? 'Тексти & FAQ' : 'Тексты & FAQ', icon: <FileText className="w-4 h-4" />, badge: 'CMS' },
    { id: 'cases', label: isUk ? 'Кейси студії' : 'Кейсы студии', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'galleries', label: isUk ? 'Фотогалереї' : 'Фотогалереи', icon: <Images className="w-4 h-4" /> },
    { id: 'videos', label: isUk ? 'Відеопортфоліо' : 'Видеопортфолио', icon: <Film className="w-4 h-4" /> },
    { id: 'relations', label: isUk ? 'Зв’язки портфоліо' : 'Связи портфолио', icon: <Link2 className="w-4 h-4" />, badge: 'NEW' },
    { id: 'media', label: isUk ? 'Медіатека' : 'Медиатека', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'diagnostics', label: isUk ? 'Діагностика CMS' : 'Диагностика CMS', icon: <Activity className="w-4 h-4" />, badge: 'NEW' },
    { id: 'testimonials', label: isUk ? 'Відгуки клієнтів' : 'Отзывы клиентов', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'backstage', label: isUk ? 'ПТС та Бекстейдж' : 'ПТС и Бэкстейдж', icon: <Radio className="w-4 h-4" /> },
    { id: 'leads', label: 'Заявки / CRM', icon: <Inbox className="w-4 h-4" /> },
    { id: 'articles', label: isUk ? 'Статті' : 'Статьи', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <header className="bg-slate-900 text-white sticky top-0 z-30 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black shadow-md shadow-indigo-500/20">LP</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight">{settings.studioName || 'LIVE & VIDEO'}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1" /> {isUk ? 'Панель керування' : 'Панель управления'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{isUk ? 'Повний контроль вмісту сайту' : 'Полный контроль содержимого сайта'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors">
              <span>{isUk ? 'Відкрити сайт' : 'Открыть сайт'}</span><ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors">
              <LogOut className="w-3.5 h-3.5" /><span>{isUk ? 'Вийти' : 'Выйти'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-x-auto flex gap-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
              {item.icon}<span>{item.label}</span>
              {item.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${activeTab === item.id ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'}`}>{item.badge}</span>}
            </button>
          ))}
        </div>

        <Suspense fallback={<AdminPanelFallback />}>
          {activeTab === 'blocks' && <BlocksManager />}
          {activeTab === 'settings' && <SiteSettingsEditor />}
          {activeTab === 'pages' && <PageContentManager />}
          {activeTab === 'page-copy' && <PageCopyManager />}
          {activeTab === 'cases' && <CasesManager />}
          {activeTab === 'galleries' && <GalleriesManager />}
          {activeTab === 'videos' && <VideosManager />}
          {activeTab === 'relations' && <RelationsManager />}
          {activeTab === 'media' && <MediaLibraryManager />}
          {activeTab === 'diagnostics' && <CmsDiagnostics />}
          {activeTab === 'testimonials' && <TestimonialsManager />}
          {activeTab === 'backstage' && <BackstageManager />}
          {activeTab === 'leads' && <LeadsCRM />}
          {activeTab === 'articles' && <ArticlesManager />}
        </Suspense>
      </div>
    </div>
  );
}
