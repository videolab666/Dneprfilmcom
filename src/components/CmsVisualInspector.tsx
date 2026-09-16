import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MousePointer2, Save, X } from 'lucide-react';
import { EDITABLE_COPY_CATALOG, type EditableCopyCatalogEntry } from '../generated/editableCopyCatalog';
import { useSiteContent } from '../context/SiteContentContext';
import { useAuth } from '../context/AuthContext';
import { normalizeFullPageCms, replaceFullPageDraft } from '../lib/fullPageEditing';

function pageFromPath(pathname: string): string {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/') return 'home';
  if (path === '/live') return 'live';
  if (path === '/video') return 'video';
  if (path === '/construction') return 'construction';
  if (path === '/photo') return 'photo';
  if (path === '/about') return 'about';
  if (path === '/contacts') return 'contacts';
  if (path === '/cases') return 'cases';
  if (/^\/cases\//.test(path)) return 'case-detail';
  if (path === '/videos') return 'videos';
  if (/^\/videos\//.test(path)) return 'video-detail';
  if (path === '/galleries') return 'galleries';
  if (/^\/galleries\//.test(path)) return 'gallery-detail';
  if (path === '/media-center') return 'media-center';
  if (/^\/media-center\//.test(path)) return 'article-detail';
  return 'common';
}

function normalized(value: string): string { return value.replace(/\s+/g, ' ').trim(); }

export function CmsVisualInspector() {
  const { locale, rawSettings, updateSettings } = useSiteContent();
  const { user } = useAuth();
  const [selected, setSelected] = useState<EditableCopyCatalogEntry | null>(null);
  const [value, setValue] = useState('');
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [saved, setSaved] = useState(false);
  const page = useMemo(() => pageFromPath(window.location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '') || '/'), []);
  const config = useMemo(() => normalizeFullPageCms(rawSettings.fullPageCms), [rawSettings.fullPageCms]);
  const entries = useMemo(() => EDITABLE_COPY_CATALOG.filter(item => item.page === page || item.page === 'common' || item.page === 'layout'), [page]);

  const displayValue = (entry: EditableCopyCatalogEntry) => config.draft.copyOverrides[entry.id]?.[locale] ?? entry[locale];

  useEffect(() => {
    const findEntry = (element: HTMLElement): EditableCopyCatalogEntry | null => {
      const text = normalized(element.innerText || element.textContent || '');
      if (!text || text.length > 500) return null;
      const matches = entries.filter(entry => {
        const candidate = normalized(displayValue(entry));
        return candidate.length >= 2 && (text === candidate || text.includes(candidate));
      });
      return matches.sort((a, b) => displayValue(b).length - displayValue(a).length)[0] || null;
    };
    const move = (event: PointerEvent) => {
      const element = (event.target as HTMLElement | null)?.closest?.('body *') as HTMLElement | null;
      if (!element || element.closest('[data-cms-inspector-ui]')) return;
      const entry = findEntry(element);
      setRect(entry ? element.getBoundingClientRect() : null);
    };
    const click = (event: MouseEvent) => {
      const element = event.target as HTMLElement | null;
      if (!element || element.closest('[data-cms-inspector-ui]')) return;
      const entry = findEntry(element);
      if (!entry) return;
      event.preventDefault(); event.stopPropagation();
      setSelected(entry); setValue(displayValue(entry)); setRect(element.getBoundingClientRect());
    };
    document.addEventListener('pointermove', move, true);
    document.addEventListener('click', click, true);
    return () => { document.removeEventListener('pointermove', move, true); document.removeEventListener('click', click, true); };
  }, [entries, config, locale]);

  const save = async () => {
    if (!selected || !user) return;
    const nextDraft = JSON.parse(JSON.stringify(config.draft));
    const current = nextDraft.copyOverrides[selected.id] || {};
    if (value === selected[locale]) delete current[locale]; else current[locale] = value;
    if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete nextDraft.copyOverrides[selected.id]; else nextDraft.copyOverrides[selected.id] = current;
    await updateSettings({ fullPageCms: replaceFullPageDraft(config, nextDraft, user.email || user.uid) } as never);
    setSaved(true); window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      {rect && <div data-cms-inspector-ui className="pointer-events-none fixed z-[9997] border-2 border-fuchsia-500 bg-fuchsia-400/10" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />}
      <div data-cms-inspector-ui className="fixed bottom-4 left-4 z-[9998] flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-2xl"><MousePointer2 className="h-4 w-4 text-fuchsia-400" />Visual CMS Inspector · {page} · {locale.toUpperCase()}</div>
      {selected && <aside data-cms-inspector-ui className="fixed right-4 top-24 z-[9999] w-[min(420px,calc(100vw-2rem))] rounded-3xl border border-slate-700 bg-slate-950 p-5 text-white shadow-2xl"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-wider text-fuchsia-400">{selected.page} · {selected.kind}</div><div className="mt-1 text-sm font-black">{selected.label}</div><div className="mt-1 font-mono text-[9px] text-slate-500">{selected.source}:{selected.line}</div></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button></div>{!user ? <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Для сохранения войдите в /admin в этом браузере.</div> : <><textarea rows={5} value={value} onChange={e => setValue(e.target.value)} className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-fuchsia-500" /><button onClick={() => void save()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-xs font-black text-white hover:bg-fuchsia-500"><Save className="h-4 w-4" />Сохранить в черновик</button>{saved && <span className="ml-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 className="h-4 w-4" />Сохранено</span>}</>}</aside>}
    </>
  );
}
