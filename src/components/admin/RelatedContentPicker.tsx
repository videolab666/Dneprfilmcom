import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, Search, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getCasePath } from '../../lib/caseMedia';
import { getGalleryPath, isPhotoGallery } from '../../lib/galleryContent';
import { getVideoProjectPath, isVideoProject } from '../../lib/videoPortfolio';
import type { CaseStudy, Locale } from '../../types';
import type { ArticleRelatedBlock } from '../../lib/articleBlocks';

interface RelatedContentPickerProps {
  locale: Locale;
  onSelect: (value: Pick<ArticleRelatedBlock, 'contentType' | 'targetId' | 'title' | 'url' | 'imageUrl' | 'description'>) => void;
  onClose: () => void;
}

type Option = Pick<ArticleRelatedBlock, 'contentType' | 'targetId' | 'title' | 'url' | 'imageUrl' | 'description'>;

function localized(record: Record<string, unknown>, field: string, locale: Locale): string {
  if (locale === 'ru') return String(record[field] || record[`${field}_uk`] || record[`${field}_en`] || '');
  return String(record[`${field}_${locale}`] || record[field] || record[`${field}_uk`] || '');
}

export function RelatedContentPicker({ locale, onSelect, onClose }: RelatedContentPickerProps) {
  const [items, setItems] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | Option['contentType']>('all');

  useEffect(() => {
    let active = true;
    void Promise.all([
      getDocs(collection(db, 'cases')),
      getDocs(collection(db, 'site_settings')),
    ]).then(([casesSnapshot, settingsSnapshot]) => {
      if (!active) return;
      const next: Option[] = [];

      casesSnapshot.docs.forEach(snapshot => {
        const raw = { id: snapshot.id, ...snapshot.data() } as CaseStudy & Record<string, unknown>;
        if (raw.published === false) return;
        next.push({
          contentType: 'case',
          targetId: raw.id,
          title: localized(raw, 'title', locale) || raw.id,
          url: getCasePath(raw),
          imageUrl: String(raw.imageUrl || ''),
          description: localized(raw, 'description', locale),
        });
      });

      settingsSnapshot.docs.forEach(snapshot => {
        const raw = { id: snapshot.id, ...snapshot.data() };
        if (isPhotoGallery(raw) && raw.published !== false) {
          next.push({
            contentType: 'gallery',
            targetId: raw.id,
            title: localized(raw as unknown as Record<string, unknown>, 'title', locale) || raw.id,
            url: getGalleryPath(raw),
            imageUrl: raw.coverUrl || raw.images?.[0]?.url || '',
            description: localized(raw as unknown as Record<string, unknown>, 'description', locale),
          });
        }
        if (isVideoProject(raw) && raw.published !== false) {
          next.push({
            contentType: 'video',
            targetId: raw.id,
            title: localized(raw as unknown as Record<string, unknown>, 'title', locale) || raw.id,
            url: getVideoProjectPath(raw),
            imageUrl: raw.coverUrl || '',
            description: localized(raw as unknown as Record<string, unknown>, 'description', locale),
          });
        }
      });

      setItems(next.sort((a, b) => a.title.localeCompare(b.title)));
    }).catch(error => {
      console.error('Could not load related content options:', error);
      if (active) setItems([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [locale]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(item => {
      if (type !== 'all' && item.contentType !== type) return false;
      if (!needle) return true;
      return `${item.title} ${item.description || ''} ${item.url}`.toLowerCase().includes(needle);
    });
  }, [items, query, type]);

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mx-auto my-8 max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600">Content picker</div>
            <h3 className="mt-1 text-xl font-black text-slate-950">Связанный материал</h3>
          </div>
          <button type="button" onClick={onClose} className="ml-auto rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-[1fr_auto] sm:p-6">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по названию, описанию или URL" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" />
          </label>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['all', 'case', 'gallery', 'video'] as const).map(item => (
              <button key={item} type="button" onClick={() => setType(item)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${type === item ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{item === 'all' ? 'Все' : item}</button>
            ))}
          </div>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Загрузка…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">Ничего не найдено.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map(item => (
                <button key={`${item.contentType}:${item.targetId}`} type="button" onClick={() => onSelect(item)} className="group grid grid-cols-[88px_1fr] gap-3 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] font-black uppercase text-slate-400">{item.contentType}</div>}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{item.contentType}</div>
                    <div className="mt-1 line-clamp-2 text-sm font-black text-slate-900">{item.title}</div>
                    {item.description && <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.description}</div>}
                    <div className="mt-2 flex items-center gap-1 truncate text-[10px] font-semibold text-slate-400"><ExternalLink className="h-3 w-3" />{item.url}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
