import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarClock, CheckCircle2, Copy, Eye, EyeOff, FileText, ListTree, Plus, RotateCcw, Save, Send, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { useAuth } from '../../context/AuthContext';
import { EDITABLE_COPY_CATALOG, type EditableCopyCatalogEntry } from '../../generated/editableCopyCatalog';
import { EDITABLE_STRUCTURE_CATALOG, type EditableStructureCatalogEntry, type EditableStructureItem } from '../../generated/editableStructureCatalog';
import {
  discardFullPageDraft,
  normalizeFullPageCms,
  publishFullPageDraft,
  replaceFullPageDraft,
  type FullPageCmsConfig,
  type FullPageCmsContent,
  type StructureItemOverride,
} from '../../lib/fullPageEditing';
import { validateFullPageDraft } from '../../lib/cmsValidation';
import type { Locale } from '../../types';

const PAGE_LABELS: Record<string, string> = { home: 'Главная', live: 'LIVE', video: 'Video', construction: 'Construction', photo: 'Photo', about: 'About', contacts: 'Contacts', cases: 'Cases — каталог', 'case-detail': 'Case — детальная', videos: 'Videos — каталог', 'video-detail': 'Video — детальная', galleries: 'Galleries — каталог', 'gallery-detail': 'Gallery — детальная', 'media-center': 'Media Center', 'article-detail': 'Article — детальная', layout: 'Шапка / подвал', 'portfolio-ui': 'Portfolio UI', common: 'Общие компоненты' };
const PAGE_PATHS: Record<string, string> = { home: '/', live: '/live', video: '/video', construction: '/construction', photo: '/photo', about: '/about', contacts: '/contacts', cases: '/cases', videos: '/videos', galleries: '/galleries', 'media-center': '/media-center' };
const LANGS: Locale[] = ['uk', 'ru', 'en'];
type Tab = 'copy' | 'structure' | 'calculators' | 'workflow' | 'quality';

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function inputClass(): string { return 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'; }

export function FullPageEditingManagerV4() {
  const { rawSettings, updateSettings } = useSiteContent();
  const { user } = useAuth();
  const [config, setConfig] = useState<FullPageCmsConfig>(() => normalizeFullPageCms(rawSettings.fullPageCms));
  const [tab, setTab] = useState<Tab>('copy');
  const [page, setPage] = useState('all');
  const [locale, setLocale] = useState<Locale>('uk');
  const [query, setQuery] = useState('');
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [schedule, setSchedule] = useState('');

  useEffect(() => { if (!dirty) setConfig(normalizeFullPageCms(rawSettings.fullPageCms)); }, [rawSettings.fullPageCms, dirty]);
  useEffect(() => { if (config.workflow.scheduledAt) { const d = new Date(config.workflow.scheduledAt); setSchedule(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)); } }, []);

  const actor = user?.email || user?.uid || 'admin';
  const pages = useMemo(() => [...new Set(EDITABLE_COPY_CATALOG.map(item => item.page))].sort((a, b) => (PAGE_LABELS[a] || a).localeCompare(PAGE_LABELS[b] || b)), []);
  const structures = useMemo(() => EDITABLE_STRUCTURE_CATALOG.filter(item => page === 'all' || item.page === page), [page]);
  const issues = useMemo(() => validateFullPageDraft(config, EDITABLE_COPY_CATALOG, EDITABLE_STRUCTURE_CATALOG), [config]);
  const errors = issues.filter(issue => issue.level === 'error');
  const warnings = issues.filter(issue => issue.level === 'warning');

  const mutateDraft = (mutator: (draft: FullPageCmsContent) => void) => {
    setConfig(current => { const next = clone(current); mutator(next.draft); next.workflow.draftUpdatedAt = Date.now(); next.workflow.draftBy = actor; return next; });
    setDirty(true); setMessage('');
  };

  const saveDraft = async () => {
    setSaving(true);
    try { const next = replaceFullPageDraft(config, config.draft, actor); await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage('Черновик сохранён. Публичная версия не изменилась.'); }
    finally { setSaving(false); }
  };

  const publish = async () => {
    if (errors.length) { setTab('quality'); setMessage(`Публикация остановлена: ошибок ${errors.length}.`); return; }
    if (!window.confirm('Опубликовать текущий черновик Full Page CMS?')) return;
    setSaving(true);
    try { const next = publishFullPageDraft(config, actor); await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage('Опубликовано.'); }
    finally { setSaving(false); }
  };

  const saveSchedule = async () => {
    const at = schedule ? new Date(schedule).getTime() : null;
    const next = replaceFullPageDraft(config, config.draft, actor);
    next.workflow.scheduledAt = Number.isFinite(at) ? at : null;
    await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage(at ? `Публикация запланирована на ${new Date(at).toLocaleString()}.` : 'Расписание очищено.');
  };

  const discard = async () => {
    if (!window.confirm('Отменить все изменения черновика и вернуть опубликованную версию?')) return;
    const next = discardFullPageDraft(config); await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage('Черновик сброшен к опубликованной версии.');
  };

  const filteredCopy = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return EDITABLE_COPY_CATALOG.filter(item => (page === 'all' || item.page === page) && (!onlyChanged || config.draft.copyOverrides[item.id]) && (!needle || [item.label, item.uk, item.ru, item.en, item.source].some(value => value.toLowerCase().includes(needle))));
  }, [config.draft.copyOverrides, onlyChanged, page, query]);

  const setCopy = (entry: EditableCopyCatalogEntry, language: Locale, value: string) => mutateDraft(draft => {
    const current = draft.copyOverrides[entry.id] || {};
    if (value === entry[language]) delete current[language]; else current[language] = value;
    if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete draft.copyOverrides[entry.id]; else draft.copyOverrides[entry.id] = current;
  });

  const ensureStructure = (draft: FullPageCmsContent, group: EditableStructureCatalogEntry) => {
    if (!draft.structures[group.id]) draft.structures[group.id] = { items: group.items.map((item, index) => ({ id: item.id, enabled: true, order: index * 10 })) };
    return draft.structures[group.id];
  };

  const patchStructureItem = (group: EditableStructureCatalogEntry, id: string, patch: Partial<StructureItemOverride>) => mutateDraft(draft => {
    const structure = ensureStructure(draft, group);
    const index = structure.items.findIndex(item => item.id === id);
    if (index >= 0) structure.items[index] = { ...structure.items[index], ...patch };
    else structure.items.push({ id, ...patch });
  });

  const orderedItems = (group: EditableStructureCatalogEntry) => {
    const override = config.draft.structures[group.id];
    const originals = group.items.map((item, index) => ({ catalog: item, patch: override?.items.find(p => p.id === item.id) || { id: item.id, enabled: true, order: index * 10 } }));
    const added = (override?.items || []).filter(item => item.cloneFromId && !group.items.some(original => original.id === item.id)).map(item => ({ catalog: group.items.find(source => source.id === item.cloneFromId) || group.items[0], patch: item }));
    return [...originals, ...added].sort((a, b) => (a.patch.order ?? 0) - (b.patch.order ?? 0));
  };

  const moveItem = (group: EditableStructureCatalogEntry, id: string, direction: -1 | 1) => mutateDraft(draft => {
    const structure = ensureStructure(draft, group);
    const order = orderedItems(group).map(entry => entry.patch.id);
    const index = order.indexOf(id); const target = index + direction; if (index < 0 || target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    order.forEach((itemId, idx) => { const existing = structure.items.find(item => item.id === itemId); if (existing) existing.order = idx * 10; else structure.items.push({ id: itemId, order: idx * 10, enabled: true }); });
  });

  const duplicateItem = (group: EditableStructureCatalogEntry, source: EditableStructureItem) => mutateDraft(draft => {
    const structure = ensureStructure(draft, group);
    const id = `added-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const locales = Object.fromEntries(LANGS.map(lang => [lang, Object.fromEntries(source.fields.map(field => [field.key, field[lang]]))])) as StructureItemOverride['locales'];
    structure.items.push({ id, cloneFromId: source.id, enabled: true, order: Math.max(0, ...structure.items.map(item => item.order || 0)) + 10, locales });
  });

  const deleteAdded = (group: EditableStructureCatalogEntry, id: string) => mutateDraft(draft => { const structure = ensureStructure(draft, group); structure.items = structure.items.filter(item => item.id !== id); });

  const structureFieldValue = (group: EditableStructureCatalogEntry, source: EditableStructureItem, patch: StructureItemOverride, fieldKey: string, lang: Locale) => {
    const field = source.fields.find(item => item.key === fieldKey); if (!field) return '';
    if (patch.cloneFromId) return patch.locales?.[lang]?.[fieldKey] ?? field[lang];
    const override = config.draft.copyOverrides[field.copyId]?.[lang]; return override ?? field[lang];
  };

  const setStructureField = (group: EditableStructureCatalogEntry, source: EditableStructureItem, patch: StructureItemOverride, fieldKey: string, lang: Locale, value: string) => {
    const field = source.fields.find(item => item.key === fieldKey); if (!field) return;
    if (!patch.cloneFromId) {
      mutateDraft(draft => { const current = draft.copyOverrides[field.copyId] || {}; if (value === field[lang]) delete current[lang]; else current[lang] = value; if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete draft.copyOverrides[field.copyId]; else draft.copyOverrides[field.copyId] = current; });
      return;
    }
    mutateDraft(draft => { const structure = ensureStructure(draft, group); const item = structure.items.find(entry => entry.id === patch.id); if (!item) return; item.locales = item.locales || {}; item.locales[lang] = { ...(item.locales[lang] || {}), [fieldKey]: value }; });
  };

  const openPreview = (inspect = false) => {
    const targetPage = page !== 'all' && PAGE_PATHS[page] ? PAGE_PATHS[page] : '/';
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}${targetPage}?cmsPreview=1${inspect ? '&cmsInspect=1' : ''}`, '_blank', 'noopener,noreferrer');
  };

  const calc = config.draft.calculators;
  const numberField = (label: string, value: number, onChange: (value: number) => void) => <label className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span><input type="number" min={0} step={100} value={value} onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))} className={inputClass()} /></label>;

  const tabButton = (id: Tab, label: string, icon: ReactNode) => <button onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${tab === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{icon}{label}</button>;

  return <div className="space-y-6">
    <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">CMS Platform · Full Page Editing 4.0</div><h2 className="mt-1 text-2xl font-black text-slate-950">Контент, структура, preview и публикация</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Изменения сначала попадают в Draft. Публичный сайт использует Published; Preview и Visual Inspector показывают Draft только авторизованному администратору.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => openPreview(false)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50"><Eye className="h-4 w-4" />Preview</button><button onClick={() => openPreview(true)} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 px-4 py-2.5 text-xs font-black text-fuchsia-700 hover:bg-fuchsia-50"><Eye className="h-4 w-4" />Visual edit</button><button onClick={() => void saveDraft()} disabled={!dirty || saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Save className="h-4 w-4" />Сохранить Draft</button><button onClick={() => void publish()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Send className="h-4 w-4" />Опубликовать</button></div></div></header>
    {message && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">{message}</div>}
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{tabButton('copy','Тексты',<FileText className="h-4 w-4" />)}{tabButton('structure','Структура',<ListTree className="h-4 w-4" />)}{tabButton('calculators','Калькуляторы',<SlidersHorizontal className="h-4 w-4" />)}{tabButton('workflow','Draft / Publish',<CalendarClock className="h-4 w-4" />)}{tabButton('quality',`Quality ${errors.length ? `(${errors.length})` : ''}`,<ShieldCheck className="h-4 w-4" />)}</div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex gap-2 overflow-x-auto"><button onClick={() => setPage('all')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${page === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Все страницы</button>{pages.map(item => <button key={item} onClick={() => setPage(item)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${page === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{PAGE_LABELS[item] || item}</button>)}</div></div>

    {tab === 'copy' && <div className="space-y-4"><div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти текст…" className={inputClass()} /><label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={onlyChanged} onChange={e => setOnlyChanged(e.target.checked)} />Только изменённые</label></div>{filteredCopy.slice(0, 180).map(entry => <article key={entry.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${config.draft.copyOverrides[entry.id] ? 'border-indigo-200' : 'border-slate-200'}`}><div className="mb-3 flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase text-indigo-600">{PAGE_LABELS[entry.page] || entry.page} · {entry.kind}</div><div className="mt-1 text-sm font-black text-slate-900">{entry.label}</div><div className="mt-1 font-mono text-[9px] text-slate-400">{entry.source}:{entry.line}</div></div><button onClick={() => mutateDraft(draft => { delete draft.copyOverrides[entry.id]; })} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><RotateCcw className="h-4 w-4" /></button></div><div className="grid gap-3 xl:grid-cols-3">{LANGS.map(lang => <label key={lang}><span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{lang}</span><textarea rows={3} value={config.draft.copyOverrides[entry.id]?.[lang] ?? entry[lang]} onChange={e => setCopy(entry, lang, e.target.value)} className={inputClass()} /></label>)}</div></article>)}</div>}

    {tab === 'structure' && <div className="space-y-5">{structures.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">Для этой страницы автоматически редактируемых legacy-списков не найдено. Page Builder остаётся способом добавлять произвольные новые секции.</div>}{structures.map(group => <section key={group.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-[10px] font-black uppercase text-indigo-600">{PAGE_LABELS[group.page] || group.page}</div><h3 className="mt-1 font-black text-slate-950">{group.label}</h3><div className="mt-1 font-mono text-[9px] text-slate-400">{group.source}:{group.line}</div></div><div className="flex gap-1">{LANGS.map(lang => <button key={lang} onClick={() => setLocale(lang)} className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase ${locale === lang ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{lang}</button>)}</div></div><div className="mt-4 space-y-3">{orderedItems(group).map(({ catalog, patch }, index, all) => <div key={patch.id} className={`rounded-2xl border p-4 ${patch.enabled === false ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white'}`}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black text-white">{index + 1}</span><span className="text-sm font-black text-slate-900">{catalog.label}</span>{patch.cloneFromId && <span className="rounded-lg bg-fuchsia-50 px-2 py-1 text-[10px] font-black text-fuchsia-700">добавлен</span>}</div><div className="flex gap-1"><button onClick={() => moveItem(group, patch.id, -1)} disabled={index === 0} className="rounded-lg border p-2 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button><button onClick={() => moveItem(group, patch.id, 1)} disabled={index === all.length - 1} className="rounded-lg border p-2 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button><button onClick={() => patchStructureItem(group, patch.id, { enabled: patch.enabled === false })} className="rounded-lg border p-2">{patch.enabled === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button><button onClick={() => duplicateItem(group, catalog)} className="rounded-lg border p-2"><Copy className="h-3.5 w-3.5" /></button>{patch.cloneFromId && <button onClick={() => deleteAdded(group, patch.id)} className="rounded-lg border border-red-200 p-2 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div><div className="mt-3 grid gap-3 lg:grid-cols-2">{catalog.fields.map(field => <label key={field.key}><span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{field.key} · {locale.toUpperCase()}</span><textarea rows={2} value={structureFieldValue(group, catalog, patch, field.key, locale)} onChange={e => setStructureField(group, catalog, patch, field.key, locale, e.target.value)} className={inputClass()} /></label>)}</div></div>)}</div><button onClick={() => group.items[0] && duplicateItem(group, group.items[0])} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50"><Plus className="h-4 w-4" />Добавить элемент</button></section>)}</div>}

    {tab === 'calculators' && <div className="grid gap-5 xl:grid-cols-3"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">LIVE</h3><div className="mt-4 grid gap-3">{Object.entries(calc.live).map(([key, value]) => numberField(key, Number(value), next => mutateDraft(draft => { (draft.calculators.live as unknown as Record<string, number>)[key] = next; })))}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Video</h3><div className="mt-4 grid gap-3">{numberField('base',calc.video.base,v=>mutateDraft(d=>{d.calculators.video.base=v;}))}{Object.entries(calc.video.videoType).map(([k,v])=>numberField(`type.${k}`,Number(v),n=>mutateDraft(d=>{(d.calculators.video.videoType as unknown as Record<string,number>)[k]=n;})))}{Object.entries(calc.video.duration).map(([k,v])=>numberField(`duration.${k}`,Number(v),n=>mutateDraft(d=>{(d.calculators.video.duration as unknown as Record<string,number>)[k]=n;})))}{(['script','actors','drone','voiceover','graphics3d'] as const).map(k=>numberField(k,calc.video[k],v=>mutateDraft(d=>{d.calculators.video[k]=v;})))}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Construction</h3><div className="mt-4 grid gap-3">{Object.entries(calc.construction).map(([key,value])=>numberField(key,Number(value),next=>mutateDraft(d=>{(d.calculators.construction as unknown as Record<string,number>)[key]=next;})))}</div></section></div>}

    {tab === 'workflow' && <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-slate-950">Состояние</h3><div className="mt-4 space-y-2 text-sm text-slate-600"><div>Draft: <b>{config.workflow.draftUpdatedAt ? new Date(config.workflow.draftUpdatedAt).toLocaleString() : 'совпадает с published'}</b></div><div>Published: <b>{config.workflow.publishedAt ? new Date(config.workflow.publishedAt).toLocaleString() : 'legacy / исходное состояние'}</b></div><div>Изменения в текущей сессии: <b>{dirty ? 'есть' : 'нет'}</b></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void saveDraft()} disabled={!dirty} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">Сохранить Draft</button><button onClick={() => void discard()} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Отменить Draft</button><button onClick={() => void publish()} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white">Publish</button></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-slate-950">Scheduled publishing</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">После указанного времени public runtime автоматически начнёт использовать текущий Draft. Для SEO-prerender после этого всё равно рекомендуется обычный Publish.</p><input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)} className={`mt-4 ${inputClass()}`} /><button onClick={() => void saveSchedule()} className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white">Сохранить расписание</button></section></div>}

    {tab === 'quality' && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-red-200 bg-red-50 p-4"><div className="text-xs font-black uppercase text-red-600">Ошибки</div><div className="mt-1 text-3xl font-black text-red-900">{errors.length}</div></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="text-xs font-black uppercase text-amber-600">Предупреждения</div><div className="mt-1 text-3xl font-black text-amber-900">{warnings.length}</div></div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-xs font-black uppercase text-emerald-600">Publish gate</div><div className="mt-1 text-lg font-black text-emerald-900">{errors.length ? 'Заблокирован' : 'Готов'}</div></div></div>{issues.map((issue,index)=><div key={`${issue.area}-${index}`} className={`rounded-xl border px-4 py-3 text-sm ${issue.level==='error'?'border-red-200 bg-red-50 text-red-800':'border-amber-200 bg-amber-50 text-amber-800'}`}><b>{issue.area}:</b> {issue.message}</div>)}{issues.length===0&&<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline h-5 w-5" />Черновик прошёл CMS Validation 3.0.</div>}</div>}
  </div>;
}
