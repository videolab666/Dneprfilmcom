import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Loader2,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { Locale } from '../../types';
import type { PublishQualityIssue, PublishQualityType } from '../../lib/publishQuality';

export type UnifiedEditorTabId = 'content' | 'media' | 'taxonomy' | 'relations' | 'seo' | 'preview';

export interface UnifiedEditorSection {
  id: UnifiedEditorTabId;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  content: ReactNode;
}

interface UnifiedContentEditorShellProps {
  type: PublishQualityType;
  title: string;
  id: string;
  publicPath?: string;
  published: boolean;
  onPublishedChange: (value: boolean) => void;
  language: Locale;
  onLanguageChange: (locale: Locale) => void;
  activeTab: UnifiedEditorTabId;
  onTabChange: (tab: UnifiedEditorTabId) => void;
  sections: UnifiedEditorSection[];
  issues: PublishQualityIssue[];
  saving: boolean;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  saveLabel?: string;
}

const LANGS: Array<{ id: Locale; label: string; short: string }> = [
  { id: 'uk', label: 'Українська', short: 'UK' },
  { id: 'ru', label: 'Русский', short: 'RU' },
  { id: 'en', label: 'English', short: 'EN' },
];

const TYPE_LABEL: Record<PublishQualityType, string> = {
  case: 'CASE',
  gallery: 'GALLERY',
  video: 'VIDEO',
  article: 'ARTICLE',
};

export function UnifiedContentEditorShell({
  type,
  title,
  id,
  publicPath,
  published,
  onPublishedChange,
  language,
  onLanguageChange,
  activeTab,
  onTabChange,
  sections,
  issues,
  saving,
  busy = false,
  error,
  onClose,
  onSubmit,
  saveLabel = 'Сохранить',
}: UnifiedContentEditorShellProps) {
  const errors = issues.filter(issue => issue.severity === 'error');
  const warnings = issues.filter(issue => issue.severity === 'warning');

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5">
      <form onSubmit={onSubmit} className="mx-auto my-2 min-h-[calc(100vh-1rem)] w-full max-w-7xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl sm:my-3 sm:min-h-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-indigo-700">{TYPE_LABEL[type]}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{published ? 'PUBLISHED' : 'DRAFT'}</span>
                {errors.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black text-red-700"><AlertTriangle className="h-3 w-3" />{errors.length} error</span>}
                {warnings.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800"><AlertTriangle className="h-3 w-3" />{warnings.length} warning</span>}
                {issues.length === 0 && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700"><CheckCircle2 className="h-3 w-3" />READY</span>}
              </div>
              <h2 className="mt-2 truncate text-xl font-black text-slate-950 sm:text-2xl">{title || 'Новый материал'}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span>ID: {id}</span>
                {publicPath && <span className="truncate text-indigo-500">{publicPath}</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                <span>{published ? 'Опубликован' : 'Черновик'}</span>
                <input type="checkbox" checked={published} onChange={event => onPublishedChange(event.target.checked)} className="h-4 w-4 accent-indigo-600" />
              </label>
              {publicPath && (
                <Link to={publicPath} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <ExternalLink className="h-4 w-4" />Preview
                </Link>
              )}
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                <X className="h-4 w-4" />Закрыть
              </button>
              <button type="submit" disabled={saving || busy} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Сохранение…' : saveLabel}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1" aria-label="Разделы редактора">
              {sections.map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onTabChange(section.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${activeTab === section.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {section.icon}
                  <span>{section.label}</span>
                  {section.badge !== undefined && <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${activeTab === section.id ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{section.badge}</span>}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1">
              <span className="hidden items-center gap-1 px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 sm:inline-flex"><Globe2 className="h-3.5 w-3.5" />Language</span>
              {LANGS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onLanguageChange(item.id)}
                  title={item.label}
                  className={`rounded-xl px-3 py-1.5 text-xs font-black ${language === item.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span className="sm:hidden">{item.short}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          {sections.map(section => (
            <div key={section.id} className={activeTab === section.id ? 'block' : 'hidden'} aria-hidden={activeTab !== section.id}>
              {section.content}
            </div>
          ))}
        </main>

        <footer className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className={`h-4 w-4 ${errors.length ? 'text-red-500' : warnings.length ? 'text-amber-500' : 'text-emerald-500'}`} />
            {errors.length ? `Публикация заблокирована: ${errors.length} критических ошибок` : warnings.length ? `Quality Gate: ${warnings.length} предупреждений` : 'Quality Gate: материал готов к публикации'}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">Отмена</button>
            <button type="submit" disabled={saving || busy} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black text-white hover:bg-indigo-500 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Сохранение…' : saveLabel}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
