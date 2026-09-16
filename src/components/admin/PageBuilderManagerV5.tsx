import { useState } from 'react';
import { Edit3, ExternalLink, LayoutTemplate } from 'lucide-react';
import { PageBuilderManager as PageBuilderManagerV4 } from './PageBuilderManagerV4';
import { PAGE_BUILDER_PAGES, type PageBuilderPage } from '../../lib/pageBuilder';
import { pageComposerSupported } from '../../lib/pageComposer';

export function PageBuilderManager() {
  const [page, setPage] = useState<PageBuilderPage>('live');
  const supported = PAGE_BUILDER_PAGES.filter(item => pageComposerSupported(item.id));

  const openComposer = () => {
    const meta = PAGE_BUILDER_PAGES.find(item => item.id === page);
    if (!meta) return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}${meta.path}?cmsPreview=1&cmsCompose=1&lang=uk`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-indigo-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white"><LayoutTemplate className="h-3.5 w-3.5" />CMS 4.5 · Visual Page Composer</div>
            <h2 className="mt-3 text-xl font-black text-slate-950">Собирайте и редактируйте страницу прямо поверх её дизайна</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Добавляйте и переставляйте секции, затем нажмите на builder-блок или кнопку <Edit3 className="inline h-3.5 w-3.5 align-[-2px] text-fuchsia-600" /> для редактирования текста, карточек, файлов, медиа и параметров. Все изменения сначала сохраняются в Draft и публикуются общей кнопкой Composer.</p>
          </div>
          <div className="flex min-w-[280px] flex-col gap-2 sm:flex-row xl:flex-col">
            <select value={page} onChange={event => setPage(event.target.value as PageBuilderPage)} className="rounded-xl border border-fuchsia-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-fuchsia-500">
              {supported.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <button type="button" onClick={openComposer} className="inline-flex items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-fuchsia-500"><ExternalLink className="h-4 w-4" />Открыть Visual Composer 4.5</button>
          </div>
        </div>
      </section>

      <PageBuilderManagerV4 />
    </div>
  );
}
