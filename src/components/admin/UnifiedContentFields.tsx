import type { ArticleCategory, ArticleTranslation, CaseStudy, Locale } from '../../types';
import { articleCategoryLabel } from '../../lib/articleCms';
import type { PublishQualityType } from '../../lib/publishQuality';

export type UnifiedContentRecord = Record<string, any>;

const ARTICLE_CATEGORIES: ArticleCategory[] = ['live', 'video', 'construction', 'photo', 'tech'];

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function portfolioKey(base: string, locale: Locale): string {
  return locale === 'ru' ? base : `${base}_${locale}`;
}

export function portfolioField(record: UnifiedContentRecord, base: string, locale: Locale): string {
  return text(record[portfolioKey(base, locale)]);
}

export function articleTranslation(record: UnifiedContentRecord, locale: Locale): ArticleTranslation {
  const current = record[locale] && typeof record[locale] === 'object' ? record[locale] : {};
  return {
    title: text(current.title),
    categoryLabel: text(current.categoryLabel) || articleCategoryLabel((record.category || 'live') as ArticleCategory, locale),
    readTime: text(current.readTime),
    date: text(current.date),
    author: text(current.author),
    summary: text(current.summary),
    content: Array.isArray(current.content) ? current.content.map(String) : [],
    keyTakeaways: Array.isArray(current.keyTakeaways) ? current.keyTakeaways.map(String) : [],
  };
}

function splitParagraphs(value: string): string[] {
  return value.split(/\n\s*\n/).map(item => item.trim()).filter(Boolean);
}

function splitLines(value: string): string[] {
  return value.split('\n').map(item => item.trim()).filter(Boolean);
}

function metricsText(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.map(item => `${text(item?.label)} | ${text(item?.value)}`).join('\n');
}

function metricsValue(value: string): Array<{ label: string; value: string }> {
  return value.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [label, ...rest] = line.split('|');
    return { label: label.trim(), value: rest.join('|').trim() };
  }).filter(item => item.label && item.value);
}

interface UnifiedContentFieldsProps {
  type: PublishQualityType;
  value: UnifiedContentRecord;
  locale: Locale;
  onPatch: (patch: UnifiedContentRecord) => void;
}

export function UnifiedContentFields({ type, value, locale, onPatch }: UnifiedContentFieldsProps) {
  const patchPortfolio = (base: string, next: string) => onPatch({ [portfolioKey(base, locale)]: next });

  if (type === 'article') {
    const translation = articleTranslation(value, locale);
    const patchTranslation = (patch: Partial<ArticleTranslation>) => onPatch({
      [locale]: { ...translation, ...patch },
    });
    const updateCategory = (category: ArticleCategory) => onPatch({
      category,
      uk: { ...articleTranslation(value, 'uk'), categoryLabel: articleCategoryLabel(category, 'uk') },
      ru: { ...articleTranslation(value, 'ru'), categoryLabel: articleCategoryLabel(category, 'ru') },
      en: { ...articleTranslation(value, 'en'), categoryLabel: articleCategoryLabel(category, 'en') },
    });

    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold text-slate-700 md:col-span-2">Заголовок ({locale.toUpperCase()})
            <input value={translation.title} onChange={event => patchTranslation({ title: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700">Категория Media Center
            <select value={value.category || 'live'} onChange={event => updateCategory(event.target.value as ArticleCategory)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-sm">
              {ARTICLE_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700">Подпись категории
            <input value={translation.categoryLabel} onChange={event => patchTranslation({ categoryLabel: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700">Автор
            <input value={translation.author} onChange={event => patchTranslation({ author: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700">Дата на сайте
            <input value={translation.date} onChange={event => patchTranslation({ date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700">Время чтения
            <input value={translation.readTime} onChange={event => patchTranslation({ readTime: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700 md:col-span-2">Краткое описание
            <textarea rows={4} value={translation.summary} onChange={event => patchTranslation({ summary: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700 md:col-span-2">Основной текст — абзацы разделяйте пустой строкой
            <textarea rows={14} value={translation.content.join('\n\n')} onChange={event => patchTranslation({ content: splitParagraphs(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm leading-relaxed" />
          </label>
          <label className="text-xs font-bold text-slate-700 md:col-span-2">Ключевые выводы — один пункт на строку
            <textarea rows={5} value={translation.keyTakeaways.join('\n')} onChange={event => patchTranslation({ keyTakeaways: splitLines(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700 md:col-span-2">Slug / URL
            <div className="mt-1 flex overflow-hidden rounded-xl border border-slate-300"><span className="bg-slate-100 px-3 py-2.5 text-xs text-slate-500">/media-center/</span><input value={text(value.slug)} onChange={event => onPatch({ slug: event.target.value })} placeholder="auto-from-title" className="min-w-0 flex-1 px-3 py-2.5 font-normal text-sm outline-none" /></div>
          </label>
        </div>
      </section>
    );
  }

  const slugPrefix = type === 'case' ? '/cases/' : type === 'gallery' ? '/galleries/' : '/videos/';
  const metricsKey = locale === 'ru' ? 'metrics' : `metrics_${locale}`;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs font-bold text-slate-700 md:col-span-2">Название ({locale.toUpperCase()})
          <input value={portfolioField(value, 'title', locale)} onChange={event => patchPortfolio('title', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
        </label>

        {type === 'case' && <label className="text-xs font-bold text-slate-700">Тип кейса
          <select value={value.category || 'OTHER'} onChange={event => onPatch({ category: event.target.value as CaseStudy['category'] })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-sm"><option value="LIVE">LIVE</option><option value="VIDEO">VIDEO</option><option value="CONSTRUCTION">CONSTRUCTION</option><option value="OTHER">OTHER</option></select>
        </label>}
        {type === 'case' && <label className="text-xs font-bold text-slate-700">Клиент
          <input value={text(value.client)} onChange={event => onPatch({ client: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
        </label>}
        {type === 'video' && <label className="text-xs font-bold text-slate-700">Клиент ({locale.toUpperCase()})
          <input value={portfolioField(value, 'client', locale)} onChange={event => patchPortfolio('client', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
        </label>}
        {type === 'case' && <label className="text-xs font-bold text-slate-700">Подпись категории ({locale.toUpperCase()})
          <input value={portfolioField(value, 'categoryLabel', locale)} onChange={event => patchPortfolio('categoryLabel', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
        </label>}
        {type === 'video' && <label className="text-xs font-bold text-slate-700">Подпись категории ({locale.toUpperCase()})
          <input value={portfolioField(value, 'category', locale)} onChange={event => patchPortfolio('category', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
        </label>}
        <label className="text-xs font-bold text-slate-700">Локация ({locale.toUpperCase()})
          <input value={portfolioField(value, 'location', locale)} onChange={event => patchPortfolio('location', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
        </label>
        {type === 'case' && <label className="text-xs font-bold text-slate-700">Год
          <input value={text(value.year)} onChange={event => onPatch({ year: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
        </label>}
        {(type === 'gallery' || type === 'video') && <label className="text-xs font-bold text-slate-700">Дата
          <input type="date" value={text(value.date)} onChange={event => onPatch({ date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
        </label>}
        <label className="text-xs font-bold text-slate-700 md:col-span-2">Описание ({locale.toUpperCase()})
          <textarea rows={4} value={portfolioField(value, 'description', locale)} onChange={event => patchPortfolio('description', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
        </label>
        {type === 'case' && <><label className="text-xs font-bold text-slate-700 md:col-span-2">Задача / Challenge<textarea rows={3} value={portfolioField(value, 'challenge', locale)} onChange={event => patchPortfolio('challenge', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label><label className="text-xs font-bold text-slate-700 md:col-span-2">Решение<textarea rows={3} value={portfolioField(value, 'solution', locale)} onChange={event => patchPortfolio('solution', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label></>}
        {(type === 'case' || type === 'video') && <label className="text-xs font-bold text-slate-700 md:col-span-2">Результат<textarea rows={3} value={portfolioField(value, 'result', locale)} onChange={event => patchPortfolio('result', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
        {type === 'case' && <label className="text-xs font-bold text-slate-700 md:col-span-2">Метрики ({locale.toUpperCase()}): Название | Значение<textarea rows={5} value={metricsText(value[metricsKey])} onChange={event => onPatch({ [metricsKey]: metricsValue(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
        <label className="text-xs font-bold text-slate-700 md:col-span-2">Slug / URL
          <div className="mt-1 flex overflow-hidden rounded-xl border border-slate-300"><span className="bg-slate-100 px-3 py-2.5 text-xs text-slate-500">{slugPrefix}</span><input value={text(value.slug)} onChange={event => onPatch({ slug: event.target.value })} placeholder="auto-from-title" className="min-w-0 flex-1 px-3 py-2.5 font-normal text-sm outline-none" /></div>
        </label>
        {type === 'gallery' && <label className="text-xs font-bold text-slate-700">Порядок<input type="number" value={Number(value.order ?? 999)} onChange={event => onPatch({ order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
        {type === 'video' && <><label className="text-xs font-bold text-slate-700">Порядок<input type="number" value={Number(value.order ?? 999)} onChange={event => onPatch({ order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label><label className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-800"><input type="checkbox" checked={Boolean(value.featured)} onChange={event => onPatch({ featured: event.target.checked })} className="h-4 w-4" />Featured</label></>}
        {type === 'case' && <><label className="text-xs font-bold text-slate-700">Видео badge<input value={text(value.videoBadge)} onChange={event => onPatch({ videoBadge: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label><label className="text-xs font-bold text-slate-700">Порядок на главной<input type="number" value={Number(value.featuredOrder ?? 99)} onChange={event => onPatch({ featuredOrder: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label><label className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-800"><input type="checkbox" checked={Boolean(value.featured)} onChange={event => onPatch({ featured: event.target.checked })} className="h-4 w-4" />Показывать на главной</label></>}
      </div>
    </section>
  );
}
