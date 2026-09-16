import React, { lazy, Suspense, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  Layers,
  Sliders,
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
  LayoutGrid,
  FileSearch,
  ContactRound,
} from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import type { PublishQualityType } from '../lib/publishQuality';

const PageBuilderManager = lazy(() => import('../components/admin/PageBuilderManager').then(module => ({ default: module.PageBuilderManager })));
const SiteSettingsEditor = lazy(() => import('../components/admin/SiteSettingsEditor').then(module => ({ default: module.SiteSettingsEditor })));
const ContactsPageEditor = lazy(() => import('../components/admin/ContactsPageEditor').then(module => ({ default: module.ContactsPageEditor })));
const FullPageEditingManager = lazy(() => import('../components/admin/FullPageEditingManager').then(module => ({ default: module.FullPageEditingManager })));
const UnifiedContentManager = lazy(() => import('../components/admin/UnifiedContentManager').then(module => ({ default: module.UnifiedContentManager })));
const PortfolioOrganizer = lazy(() => import('../components/admin/PortfolioOrganizer').then(module => ({ default: module.PortfolioOrganizer })));
const SeoQualityManager = lazy(() => import('../components/admin/SeoQualityManager').then(module => ({ default: module.SeoQualityManager })));
const MediaLibraryManager = lazy(() => import('../components/admin/MediaLibraryManager').then(module => ({ default: module.MediaLibraryManager })));
const TestimonialsManager = lazy(() => import('../components/admin/TestimonialsManager').then(module => ({ default: module.TestimonialsManager })));
const BackstageManager = lazy(() => import('../components/admin/BackstageManager').then(module => ({ default: module.BackstageManager })));
const LeadsCRM = lazy(() => import('../components/admin/LeadsCRM').then(module => ({ default: module.LeadsCRM })));
const PageContentManager = lazy(() => import('../components/admin/PageContentManager').then(module => ({ default: module.PageContentManager })));
const PageCopyManager = lazy(() => import('../components/admin/PageCopyManager').then(module => ({ default: module.PageCopyManager })));
const RelationsManager = lazy(() => import('../components/admin/RelationsManager').then(module => ({ default: module.RelationsManager })));
const CmsDiagnostics = lazy(() => import('../components/admin/CmsDiagnostics').then(module => ({ default: module.CmsDiagnostics })));

type AdminTab = 'blocks' | 'contacts-page' | 'full-page' | 'settings' | 'pages' | 'page-copy' | 'content' | 'organizer' | 'seo-quality' | 'relations' | 'media' | 'diagnostics' | 'testimonials' | 'backstage' | 'leads';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface ContentFocusTarget {
  type: PublishQualityType;
  id: string;
  requestKey: number;
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
  const [contentFocus, setContentFocus] = useState<ContentFocusTarget | null>(null);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login', { replace: true });
  };

  const openUnifiedContent = (target?: { type: PublishQualityType; id: string }) => {
    setContentFocus(target ? { ...target, requestKey: Date.now() } : null);
    setActiveTab('content');
  };

  const navItems: NavItem[] = [
    { id: 'blocks', label: isUk ? 'Конструктор сторінок' : 'Конструктор страниц', icon: <Layers className="w-4 h-4" />, badge: '1.0' },
    { id: 'contacts-page', label: isUk ? 'Контакти' : 'Контакты', icon: <ContactRound className="w-4 h-4" />, badge: '2.0' },
    { id: 'full-page', label: isUk ? 'Повне редагування' : 'Полное редактирование', icon: <FileText className="w-4 h-4" />, badge: '3.0' },
    { id: 'settings', label: isUk ? 'Головна & Засновник' : 'Главная & Основатель', icon: <Sliders className="w-4 h-4" /> },
    { id: 'pages', label: isUk ? 'Контент сторінок' : 'Контент страниц', icon: <Layers className="w-4 h-4" /> },
    { id: 'page-copy', label: isUk ? 'Тексти & FAQ' : 'Тексты & FAQ', icon: <FileText className="w-4 h-4" />, badge: 'CMS' },
    { id: 'content', label: isUk ? 'Єдиний контент' : 'Единый контент', icon: <LayoutGrid className="w-4 h-4" />, badge: '2.1' },
    { id: 'organizer', label: isUk ? 'Організатор портфоліо' : 'Организатор портфолио', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'seo-quality', label: 'SEO & Quality', icon: <FileSearch className="w-4 h-4" />, badge: '4.0' },
    { id: 'relations', label: isUk ? 'Зв’язки портфоліо' : 'Связи портфолио', icon: <Link2 className="w-4 h-4" /> },
    { id: 'media', label: isUk ? 'Медіатека' : 'Медиатека', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'diagnostics', label: isUk ? 'Здоров’я CMS' : 'Здоровье CMS', icon: <Activity className="w-4 h-4" />, badge: '2.1' },
    { id: 'testimonials', label: isUk ? 'Відгуки клієнтів' : 'Отзывы клиентов', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'backstage', label: isUk ? 'ПТС та Бекстейдж' : 'ПТС и Бэкстейдж', icon: <Radio className="w-4 h-4" /> },
    { id: 'leads', label: 'Заявки / CRM', icon: <Inbox className="w-4 h-4" /> },
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
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"><ShieldCheck className="w-3 h-3 mr-1" /> {isUk ? 'Панель керування' : 'Панель управления'}</span>
              </div>
              <p className="text-[11px] text-slate-400">{isUk ? 'Повний контроль вмісту сайту' : 'Полный контроль содержимого сайта'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"><span>{isUk ? 'Відкрити сайт' : 'Открыть сайт'}</span><ExternalLink className="w-3.5 h-3.5" /></Link>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"><LogOut className="w-3.5 h-3.5" /><span>{isUk ? 'Вийти' : 'Выйти'}</span></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-x-auto flex gap-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
              {item.icon}<span>{item.label}</span>{item.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${activeTab === item.id ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-700'}`}>{item.badge}</span>}
            </button>
          ))}
        </div>

        <Suspense fallback={<AdminPanelFallback />}>
          {activeTab === 'blocks' && <PageBuilderManager />}
          {activeTab === 'contacts-page' && <ContactsPageEditor />}
          {activeTab === 'full-page' && <FullPageEditingManager />}
          {activeTab === 'settings' && <SiteSettingsEditor />}
          {activeTab === 'pages' && <PageContentManager />}
          {activeTab === 'page-copy' && <PageCopyManager />}
          {activeTab === 'content' && <UnifiedContentManager focusTarget={contentFocus} onFocusHandled={() => setContentFocus(null)} />}
          {activeTab === 'organizer' && <PortfolioOrganizer />}
          {activeTab === 'seo-quality' && <SeoQualityManager />}
          {activeTab === 'relations' && <RelationsManager />}
          {activeTab === 'media' && <MediaLibraryManager />}
          {activeTab === 'diagnostics' && <CmsDiagnostics onOpenContent={openUnifiedContent} />}
          {activeTab === 'testimonials' && <TestimonialsManager />}
          {activeTab === 'backstage' && <BackstageManager />}
          {activeTab === 'leads' && <LeadsCRM />}
        </Suspense>
      </div>
    </div>
  );
}
