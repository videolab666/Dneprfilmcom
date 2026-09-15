import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Link2,
  Lightbulb,
  Loader2,
  RefreshCw,
  Search,
  Unlink,
} from 'lucide-react';
import type { PublishQualityType } from '../../lib/publishQuality';
import {
  addArticleInternalRelation,
  buildSeoIntelligenceReport,
  loadSeoIntelligenceData,
  type SeoGraphItem,
  type SeoIntelligenceReport,
} from '../../lib/seoIntelligence';

const TYPE_LABELS: Record<PublishQualityType, string> = {
  case: 'Case',
  gallery: 'Gallery',
  video: 'Video',
  article: 'Article',
};

function publicHref(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;
}

export function SeoIntelligencePanel() {
  const [report, setReport] = useState<SeoIntelligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<PublishQualityType | 'all'>('all');
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [selectedKey, setSelectedKey] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await loadSeoIntelligenceData();
      const next = buildSeoIntelligenceReport(data);
      setReport(next);
      setSelectedKey(current => current && next.records.some(item => item.key === current) ? current : next.records[0]?.key || '');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    if (!report) return [];
    const needle = query.trim().toLowerCase();
    return report.records.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (orphanOnly && !item.orphan) return false;
      if (!needle) return true;
      return `${item.title} ${item.slug} ${item.category} ${item.tags.join(' ')}`.toLowerCase().includes(needle);
    });
  }, [report, query, typeFilter, orphanOnly]);

  const selected = useMemo<SeoGraphItem | null>(
    () => report?.records.find(item => item.key === selectedKey) || filtered[0] || null,
    [report, selectedKey, filtered],
  );

  const applySuggestion = async (source: SeoGraphItem, targetKey: string) => {
    const target = report?.records.find(item => item.key === targetKey);
    if (!target) return;
    if (source.type !== 'article') {
      setMessage('Автоприменение доступно только для Article: у других типов текущая модель связей управляется Project Relations.');
      return;
    }
    if (target.type === 'article') {
      setMessage('Article → Article relation пока отсутствует в текущей схеме CMS; рекомендация оставлена как ручная внутренняя ссылка.');
      return;
    }
    setBusyKey(`${source.key}->${target.key}`);
    setMessage('');
    try {
      await addArticleInternalRelation(source, target);
      setMessage(`Связь добавлена: ${source.title} → ${target.title}`);
      await load();
      setSelectedKey(source.key);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusyKey('');
    }
  };

  return (
    <section className="rounded-3xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-700">SEO 4.0 · Internal Link Intelligence</div>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Orphan pages, suggestions и canonical integrity</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">Граф строится по реальным article relations, project relations и найденным внутренним URL в контенте. Листинги не считаются contextual backlinks, поэтому orphan означает: на материал не ведёт ни одна содержательная внутренняя связь.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-white px-4 py-2.5 text-xs font-black text-fuchsia-700 hover:bg-fuchsia-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Пересчитать граф</button>
      </div>

      {message && <div className="mt-4 rounded-2xl border border-fuchsia-200 bg-white px-4 py-3 text-sm font-semibold text-fuchsia-800">{message}</div>}

      {report && (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-2xl font-black text-slate-950">{report.totalPublished}</div><div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Published detail pages</div></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="text-2xl font-black text-amber-900">{report.orphanCount}</div><div className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Contextual orphans</div></div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-2xl font-black text-emerald-900">{report.linkedCount}</div><div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Есть inbound link</div></div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><div className="text-2xl font-black text-red-900">{report.canonicalIssueCount}</div><div className="text-[11px] font-bold uppercase tracking-wide text-red-700">Slug / path issues</div></div>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Название, slug, category, tag" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-fuchsia-500" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select value={typeFilter} onChange={event => setTypeFilter(event.target.value as PublishQualityType | 'all')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <option value="all">Все типы</option>
              <option value="case">Cases</option>
              <option value="gallery">Galleries</option>
              <option value="video">Videos</option>
              <option value="article">Articles</option>
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={orphanOnly} onChange={event => setOrphanOnly(event.target.checked)} />Только orphan</label>
          </div>
          <div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {loading ? <div className="flex min-h-36 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-fuchsia-600" /></div> : filtered.map(item => (
              <button key={item.key} type="button" onClick={() => setSelectedKey(item.key)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.key === item.key ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-900 px-1.5 py-1 text-[9px] font-black uppercase text-white">{TYPE_LABELS[item.type]}</span>
                  {item.orphan ? <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-1 text-[9px] font-black text-amber-800"><Unlink className="h-3 w-3" />ORPHAN</span> : <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-1 text-[9px] font-black text-emerald-800"><Link2 className="h-3 w-3" />IN {item.incomingCount}</span>}
                  {item.canonicalIssues.length > 0 && <span className="rounded-md bg-red-100 px-1.5 py-1 text-[9px] font-black text-red-700">URL {item.canonicalIssues.length}</span>}
                </div>
                <div className="mt-2 truncate text-xs font-black text-slate-900">{item.title}</div>
                <div className="mt-1 truncate font-mono text-[9px] text-slate-400">{item.path}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {!selected ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">Нет опубликованных материалов.</div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-wide text-fuchsia-700">{TYPE_LABELS[selected.type]}</div><h3 className="mt-1 text-xl font-black text-slate-950">{selected.title}</h3><div className="mt-1 break-all font-mono text-[10px] text-slate-400">{selected.path}</div></div>
                  <a href={publicHref(selected.path)} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">Public <ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-lg font-black">{selected.incomingCount}</div><div className="text-[10px] font-bold uppercase text-slate-500">Inbound</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-lg font-black">{selected.outgoingCount}</div><div className="text-[10px] font-bold uppercase text-slate-500">Outbound</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="truncate text-sm font-black">{selected.category || '—'}</div><div className="text-[10px] font-bold uppercase text-slate-500">Category</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-lg font-black">{selected.tags.length}</div><div className="text-[10px] font-bold uppercase text-slate-500">Tags</div></div>
                </div>

                {selected.orphan && <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />На эту detail page не найдено ни одной contextual внутренней ссылки. Индексная карточка специально не считается заменой перелинковке.</div>}
                {!selected.orphan && <div className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4 shrink-0" />Есть contextual inbound links: {selected.incomingCount}.</div>}

                {selected.canonicalIssues.length > 0 && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3"><div className="text-xs font-black text-red-800">Slug / canonical integrity</div><ul className="mt-2 space-y-1 text-xs text-red-700">{selected.canonicalIssues.map(issue => <li key={issue}>• {issue}</li>)}</ul></div>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /><h3 className="text-sm font-black text-slate-950">Suggested internal links</h3></div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Рейтинг учитывает category, общие tags, слова в title и разнообразие типов. Это подсказка, а не автоматическая публикация текста.</p>
                <div className="mt-4 space-y-2">
                  {selected.suggestions.length === 0 ? <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-400">Сильных рекомендаций не найдено.</div> : selected.suggestions.map(suggestion => {
                    const applyKey = `${selected.key}->${suggestion.target.key}`;
                    const canApply = selected.type === 'article' && suggestion.target.type !== 'article';
                    return (
                      <div key={suggestion.target.key} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-600">{TYPE_LABELS[suggestion.target.type]}</span><span className="text-[10px] font-black text-fuchsia-700">score {suggestion.score}</span></div><div className="mt-1 truncate text-xs font-black text-slate-900">{suggestion.target.title}</div><div className="mt-1 text-[10px] text-slate-500">{suggestion.reasons.join(' · ') || 'semantic proximity'}</div></div>
                          {canApply ? <button type="button" onClick={() => void applySuggestion(selected, suggestion.target.key)} disabled={Boolean(busyKey)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-fuchsia-600 px-3 py-2 text-[10px] font-black text-white hover:bg-fuchsia-500 disabled:opacity-50">{busyKey === applyKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}Добавить relation</button> : <a href={publicHref(suggestion.target.path)} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600">Открыть</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
