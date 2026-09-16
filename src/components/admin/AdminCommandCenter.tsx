import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowRight, FileSearch, Loader2, RefreshCw, Search } from 'lucide-react';
import { db } from '../../lib/firebase';
import { loadMediaLibrary } from '../../lib/mediaLibrary';
import { EDITABLE_COPY_CATALOG } from '../../generated/editableCopyCatalog';
import { normalizeFullPageCms } from '../../lib/fullPageEditing';
import { useSiteContent } from '../../context/SiteContentContext';

interface SearchRecord {
  id: string;
  source: string;
  title: string;
  text: string;
  tab: string;
  target?: { type: 'case' | 'article' | 'gallery' | 'video'; id: string };
  meta?: string;
}

function flatten(value: unknown, prefix = '', output: string[] = [], depth = 0): string[] {
  if (depth > 8 || output.length > 400) return output;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') { output.push(`${prefix} ${String(value)}`); return output; }
  if (Array.isArray(value)) { value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, output, depth + 1)); return output; }
  if (value && typeof value === 'object') for (const [key, item] of Object.entries(value as Record<string, unknown>)) flatten(item, prefix ? `${prefix}.${key}` : key, output, depth + 1);
  return output;
}

function tabFor(collectionName: string, data: Record<string, unknown>): string {
  if (collectionName === 'site_blocks') return 'blocks';
  if (collectionName === 'leads') return 'leads';
  if (collectionName === 'cases' || collectionName === 'articles') return 'content';
  if (collectionName === 'testimonials') return 'testimonials';
  if (collectionName === 'backstage') return 'backstage';
  if (collectionName === 'site_settings') {
    if (data.kind === 'gallery' || data.kind === 'video_project') return 'content';
    return 'settings';
  }
  return 'command-center';
}

export function AdminCommandCenter({ onNavigate }: { onNavigate: (tab: string, target?: SearchRecord['target']) => void }) {
  const { rawSettings } = useSiteContent();
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const rebuild = async () => {
    setLoading(true); setMessage('');
    try {
      const next: SearchRecord[] = [];
      for (const collectionName of ['cases', 'articles', 'site_blocks', 'site_settings', 'testimonials', 'backstage', 'leads']) {
        const snap = await getDocs(collection(db, collectionName));
        for (const item of snap.docs) {
          const data = item.data() as Record<string, unknown>;
          const title = String(data.title || data.name || data.studioName || data.kind || item.id);
          let target: SearchRecord['target'];
          if (collectionName === 'cases') target = { type: 'case', id: item.id };
          else if (collectionName === 'articles') target = { type: 'article', id: item.id };
          else if (collectionName === 'site_settings' && data.kind === 'gallery') target = { type: 'gallery', id: item.id };
          else if (collectionName === 'site_settings' && data.kind === 'video_project') target = { type: 'video', id: item.id };
          next.push({ id: `${collectionName}:${item.id}`, source: collectionName, title, text: flatten(data).join('\n'), tab: tabFor(collectionName, data), target, meta: item.id });
        }
      }

      const fullPage = normalizeFullPageCms(rawSettings.fullPageCms);
      for (const entry of EDITABLE_COPY_CATALOG) {
        const override = fullPage.draft.copyOverrides[entry.id];
        next.push({ id: `copy:${entry.id}`, source: `Full Page / ${entry.page}`, title: entry.label, text: [entry.uk, entry.ru, entry.en, override?.uk, override?.ru, override?.en].filter(Boolean).join('\n'), tab: 'full-page', meta: `${entry.source}:${entry.line}` });
      }

      const assets = await loadMediaLibrary();
      for (const asset of assets) next.push({ id: `media:${asset.url}`, source: 'Media Library', title: asset.name || asset.publicId || 'media', text: [asset.url, asset.publicId, ...asset.usages.map(usage => `${usage.sourceType} ${usage.sourceTitle} ${usage.sourceId} ${usage.field}`)].filter(Boolean).join('\n'), tab: 'media', meta: asset.useCount ? `${asset.useCount} использований` : 'не используется' });
      setRecords(next);
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void rebuild(); }, []);

  const results = useMemo(() => {
    const needle = queryText.trim().toLowerCase();
    if (!needle) return records.slice(0, 40);
    const terms = needle.split(/\s+/).filter(Boolean);
    return records.filter(record => {
      const haystack = `${record.source} ${record.title} ${record.text} ${record.meta || ''}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    }).slice(0, 120);
  }, [queryText, records]);

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Global Admin Search 1.0</div><h2 className="mt-1 text-2xl font-black text-slate-950">Командный центр CMS</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Поиск одновременно по кейсам, статьям, Page Builder, настройкам, галереям, видео, отзывам, backstage, CRM-заявкам, всем Full Page текстам и Media Usage.</p></div><button onClick={() => void rebuild()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Переиндексировать</button></div></header>
      {message && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</div>}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><label className="relative block"><Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" /><input autoFocus value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Например: Starlink, Nordgas, hero, timelapse, имя файла…" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-base font-semibold outline-none focus:border-indigo-500" /></label><div className="mt-3 text-xs font-bold text-slate-500">Индекс: {records.length} объектов · результатов: {results.length}</div></div>
      {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div> : <div className="grid gap-3">{results.map(result => <article key={result.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{result.source}</div><div className="mt-1 truncate font-black text-slate-950">{result.title}</div>{result.meta && <div className="mt-1 truncate font-mono text-[10px] text-slate-400">{result.meta}</div>}<div className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{result.text.slice(0, 450)}</div></div><button onClick={() => onNavigate(result.tab, result.target)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-600">Открыть<ArrowRight className="h-4 w-4" /></button></div></article>)}</div>}
      {!loading && results.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400"><FileSearch className="mx-auto mb-2 h-7 w-7" />Ничего не найдено.</div>}
    </div>
  );
}
