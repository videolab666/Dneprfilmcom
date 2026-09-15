import { Image as ImageIcon, Search, Share2 } from 'lucide-react';
import type { Locale } from '../../types';
import { seoFieldName } from '../../lib/seoOverrides';
import { AdminImageField } from './AdminImageField';

interface SeoFallback {
  title: string;
  description: string;
  socialImage: string;
}

interface UnifiedSeoPanelProps {
  value: Record<string, unknown>;
  locale: Locale;
  fallback: SeoFallback;
  publicPath?: string;
  onPatch: (patch: Record<string, unknown>) => void;
}

function stringField(value: Record<string, unknown>, key: string): string {
  return typeof value[key] === 'string' ? String(value[key]) : '';
}

export function UnifiedSeoPanel({ value, locale, fallback, publicPath, onPatch }: UnifiedSeoPanelProps) {
  const titleKey = seoFieldName('seoTitle', locale);
  const descriptionKey = seoFieldName('seoDescription', locale);
  const imageKey = seoFieldName('socialImage', locale);
  const title = stringField(value, titleKey);
  const description = stringField(value, descriptionKey);
  const socialImage = stringField(value, imageKey);
  const previewTitle = title.trim() || fallback.title;
  const previewDescription = description.trim() || fallback.description;
  const previewImage = socialImage.trim() || fallback.socialImage;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700"><Search className="h-3.5 w-3.5" />SEO override · {locale.toUpperCase()}</div>
          <h3 className="mt-2 text-lg font-black text-slate-950">Поисковая выдача и social preview</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Поля необязательны. Если оставить их пустыми, публичная страница продолжит использовать автоматический fallback из заголовка, описания и обложки.</p>
        </div>

        <div className="space-y-5">
          <label className="block text-xs font-bold text-slate-700">
            SEO title
            <input value={title} onChange={event => onPatch({ [titleKey]: event.target.value })} placeholder={fallback.title || 'Автоматический заголовок'} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
            <span className={`mt-1 block text-[10px] ${previewTitle.length > 60 ? 'text-amber-600' : 'text-slate-400'}`}>{previewTitle.length}/60 символов в итоговом title</span>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Meta description
            <textarea rows={5} value={description} onChange={event => onPatch({ [descriptionKey]: event.target.value })} placeholder={fallback.description || 'Автоматическое описание'} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm leading-relaxed" />
            <span className={`mt-1 block text-[10px] ${previewDescription.length > 160 ? 'text-amber-600' : 'text-slate-400'}`}>{previewDescription.length}/160 символов в итоговом description</span>
          </label>
          <AdminImageField
            label="Social / Open Graph image"
            value={socialImage}
            onChange={next => onPatch({ [imageKey]: next })}
            previewAlt={previewTitle || 'Social preview'}
            helperText="Если поле пустое, используется основная обложка материала."
          />
        </div>
      </section>

      <aside className="space-y-5 xl:sticky xl:top-44 xl:self-start">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><Search className="h-4 w-4 text-indigo-600" />Google preview</div>
          <div className="mt-4 text-[12px] text-emerald-700">{publicPath || '/'}</div>
          <div className="mt-1 line-clamp-2 text-xl font-medium text-[#1a0dab]">{previewTitle || 'Заголовок страницы'}</div>
          <div className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-600">{previewDescription || 'Описание страницы будет сформировано автоматически.'}</div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="aspect-[1.91/1] bg-slate-100">
            {previewImage ? <img src={previewImage} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><ImageIcon className="h-10 w-10" /></div>}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><Share2 className="h-4 w-4 text-indigo-600" />Open Graph</div>
            <div className="mt-2 line-clamp-2 text-base font-black text-slate-950">{previewTitle || 'Заголовок материала'}</div>
            <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{previewDescription || 'Описание материала'}</div>
          </div>
        </section>
      </aside>
    </div>
  );
}
