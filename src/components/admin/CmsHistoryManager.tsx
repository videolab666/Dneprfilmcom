import { useEffect, useMemo, useState } from 'react';
import { Clock3, History, Loader2, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { loadCmsVersions, restoreCmsVersion, type CmsVersionRecord } from '../../lib/cmsVersioning';

export function CmsHistoryManager() {
  const [items, setItems] = useState<CmsVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  const reload = async () => {
    setLoading(true);
    setMessage('');
    try { setItems(await loadCmsVersions()); }
    catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(item => [item.targetPath, item.operation, item.createdBy, ...item.changedKeys].join(' ').toLowerCase().includes(needle));
  }, [items, query]);

  const restore = async (item: CmsVersionRecord) => {
    if (!window.confirm(`Восстановить ${item.targetPath} до состояния перед операцией ${item.operation}? Текущее состояние сначала попадёт в историю.`)) return;
    setBusy(item.id);
    try {
      await restoreCmsVersion(item);
      setMessage(`Восстановлено: ${item.targetPath}`);
      await reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(''); }
  };

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div><div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">CMS Versioning / Undo 1.0</div><h2 className="mt-1 text-2xl font-black text-slate-950">История изменений и восстановление</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Перед изменением или удалением admin-записи автоматически сохраняется snapshot. Для каждого документа хранится до 30 последних состояний.</p></div>
          <button onClick={() => void reload()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Обновить</button>
        </div>
      </header>
      {message && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">{message}</div>}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Документ, коллекция, поле или автор…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" /></label></div>
      <div className="space-y-3">
        {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div> : filtered.map(item => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase text-white">{item.operation}</span><span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">{item.targetCollection}</span></div><div className="mt-2 break-all font-mono text-xs font-bold text-slate-800">{item.targetPath}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(item.createdAt).toLocaleString()}</span><span>{item.createdBy}</span></div>{item.changedKeys.length > 0 && <div className="mt-2 text-xs text-slate-500">Поля: <span className="font-semibold text-slate-700">{item.changedKeys.join(', ')}</span></div>}</div>
              <button onClick={() => void restore(item)} disabled={busy === item.id} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-500 disabled:opacity-50">{busy === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}Восстановить</button>
            </div>
            <details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-slate-500">Snapshot / технический просмотр</summary><pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-relaxed text-slate-200">{JSON.stringify(item.snapshot, null, 2)}</pre></details>
          </article>
        ))}
        {!loading && filtered.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400"><History className="mx-auto mb-2 h-6 w-6" />История пока пуста или ничего не найдено.</div>}
      </div>
    </div>
  );
}
