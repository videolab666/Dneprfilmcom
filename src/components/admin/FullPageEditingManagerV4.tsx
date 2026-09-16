import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  ListTree,
  Plus,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { useAuth } from '../../context/AuthContext';
import { EDITABLE_COPY_CATALOG, type EditableCopyCatalogEntry } from '../../generated/editableCopyCatalog';
import { EDITABLE_STRUCTURE_CATALOG } from '../../generated/editableStructureCatalog';
import {
  discardFullPageDraft,
  normalizeFullPageCms,
  publishFullPageDraft,
  replaceFullPageDraft,
  type FullPageCmsConfig,
  type FullPageCmsContent,
  type StructureItemOverride,
  type StructureLayout,
  type StructureScalar,
} from '../../lib/fullPageEditing';
import { validateFullPageDraft } from '../../lib/cmsValidation';
import type { Locale } from '../../types';

const PAGE_LABELS: Record<string, string> = {
  home: 'Главная', live: 'LIVE', video: 'Video', construction: 'Construction', photo: 'Photo', about: 'About', contacts: 'Contacts',
  cases: 'Cases — каталог', 'case-detail': 'Case — детальная', videos: 'Videos — каталог', 'video-detail': 'Video — детальная',
  galleries: 'Galleries — каталог', 'gallery-detail': 'Gallery — детальная', 'media-center': 'Media Center', 'article-detail': 'Article — детальная',
  layout: 'Шапка / подвал', 'portfolio-ui': 'Portfolio UI', common: 'Общие компоненты',
};
const PAGE_PATHS: Record<string, string> = {
  home: '/', live: '/live', video: '/video', construction: '/construction', photo: '/photo', about: '/about', contacts: '/contacts',
  cases: '/cases', videos: '/videos', galleries: '/galleries', 'media-center': '/media-center',
};
const LANGS: Locale[] = ['uk', 'ru', 'en'];
type Tab = 'copy' | 'structure' | 'calculators' | 'workflow' | 'quality';
type FieldScope = 'locale' | 'common';
type FieldType = 'string' | 'number' | 'boolean' | 'null';
type StructureField = {
  key: string;
  scope?: FieldScope;
  valueType?: FieldType;
  copyId?: string;
  uk?: string;
  ru?: string;
  en?: string;
  common?: StructureScalar;
};
type StructureItem = { id: string; label: string; fields: StructureField[] };
type StructureGroup = { id: string; page: string; source: string; line: number; label: string; items: StructureItem[] };

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function inputClass(): string { return 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'; }
function fieldScope(field: StructureField): FieldScope { return field.scope || 'locale'; }
function fieldType(field: StructureField): FieldType { return field.valueType || 'string'; }
function scalarInput(value: StructureScalar | undefined): string { return value === null || value === undefined ? '' : String(value); }
function parseScalar(field: StructureField, value: string, checked?: boolean): StructureScalar {
  if (fieldType(field) === 'boolean') return Boolean(checked);
  if (fieldType(field) === 'number') return Number.isFinite(Number(value)) ? Number(value) : 0;
  if (fieldType(field) === 'null') return null;
  return value;
}

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
  const [dragging, setDragging] = useState<{ groupId: string; itemId: string } | null>(null);

  useEffect(() => { if (!dirty) setConfig(normalizeFullPageCms(rawSettings.fullPageCms)); }, [rawSettings.fullPageCms, dirty]);
  useEffect(() => {
    if (!config.workflow.scheduledAt) return;
    const d = new Date(config.workflow.scheduledAt);
    setSchedule(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  }, [config.workflow.scheduledAt]);

  const actor = user?.email || user?.uid || 'admin';
  const structureCatalog = EDITABLE_STRUCTURE_CATALOG as StructureGroup[];
  const pages = useMemo(() => [...new Set(EDITABLE_COPY_CATALOG.map(item => item.page))].sort((a, b) => (PAGE_LABELS[a] || a).localeCompare(PAGE_LABELS[b] || b)), []);
  const structures = useMemo(() => structureCatalog.filter(item => page === 'all' || item.page === page), [page, structureCatalog]);
  const issues = useMemo(() => validateFullPageDraft(config, EDITABLE_COPY_CATALOG, EDITABLE_STRUCTURE_CATALOG), [config]);
  const errors = issues.filter(issue => issue.level === 'error');
  const warnings = issues.filter(issue => issue.level === 'warning');

  const mutateDraft = (mutator: (draft: FullPageCmsContent) => void) => {
    setConfig(current => {
      const next = clone(current);
      mutator(next.draft);
      next.workflow.draftUpdatedAt = Date.now();
      next.workflow.draftBy = actor;
      return next;
    });
    setDirty(true);
    setMessage('');
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const next = replaceFullPageDraft(config, config.draft, actor);
      await updateSettings({ fullPageCms: next } as never);
      setConfig(next);
      setDirty(false);
      setMessage('Черновик сохранён. Публичная версия не изменилась.');
    } finally { setSaving(false); }
  };

  const publish = async () => {
    if (errors.length) {
      setTab('quality');
      setMessage(`Публикация остановлена: ошибок ${errors.length}.`);
      return;
    }
    if (!window.confirm('Опубликовать текущий черновик Full Page CMS?')) return;
    setSaving(true);
    try {
      const next = publishFullPageDraft(config, actor);
      await updateSettings({ fullPageCms: next } as never);
      setConfig(next);
      setDirty(false);
      setMessage('Опубликовано.');
    } finally { setSaving(false); }
  };

  const saveSchedule = async () => {
    const at = schedule ? new Date(schedule).getTime() : null;
    const next = replaceFullPageDraft(config, config.draft, actor);
    next.workflow.scheduledAt = Number.isFinite(at) ? at : null;
    next.scheduled = Number.isFinite(at) ? clone(config.draft) : undefined;
    await updateSettings({ fullPageCms: next } as never);
    setConfig(next);
    setDirty(false);
    setMessage(at ? `Публикация запланирована на ${new Date(at!).toLocaleString()}; сохранён отдельный snapshot.` : 'Расписание очищено.');
  };

  const discard = async () => {
    if (!window.confirm('Отменить все изменения черновика и вернуть опубликованную версию?')) return;
    const next = discardFullPageDraft(config);
    await updateSettings({ fullPageCms: next } as never);
    setConfig(next);
    setDirty(false);
    setMessage('Черновик сброшен к опубликованной версии.');
  };

  const filteredCopy = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return EDITABLE_COPY_CATALOG.filter(item =>
      (page === 'all' || item.page === page)
      && (!onlyChanged || config.draft.copyOverrides[item.id])
      && (!needle || [item.label, item.uk, item.ru, item.en, item.source].some(value => value.toLowerCase().includes(needle))),
    );
  }, [config.draft.copyOverrides, onlyChanged, page, query]);

  const setCopy = (entry: EditableCopyCatalogEntry, language: Locale, value: string) => mutateDraft(draft => {
    const current = draft.copyOverrides[entry.id] || {};
    if (value === entry[language]) delete current[language]; else current[language] = value;
    if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete draft.copyOverrides[entry.id];
    else draft.copyOverrides[entry.id] = current;
  });

  const ensureStructure = (draft: FullPageCmsContent, group: StructureGroup) => {
    if (!draft.structures[group.id]) draft.structures[group.id] = {
      items: group.items.map((item, index) => ({ id: item.id, enabled: true, order: index * 10 })),
      layout: 'auto',
    };
    return draft.structures[group.id];
  };

  const ensurePatch = (draft: FullPageCmsContent, group: StructureGroup, id: string) => {
    const structure = ensureStructure(draft, group);
    let patch = structure.items.find(item => item.id === id);
    if (!patch) {
      const index = group.items.findIndex(item => item.id === id);
      patch = { id, enabled: true, order: Math.max(0, index) * 10 };
      structure.items.push(patch);
    }
    return patch;
  };

  const orderedItems = (group: StructureGroup, sourceConfig = config.draft) => {
    const override = sourceConfig.structures[group.id];
    const originals = group.items.map((catalog, index) => ({
      catalog,
      patch: override?.items.find(patch => patch.id === catalog.id) || { id: catalog.id, enabled: true, order: index * 10 },
    }));
    const added = (override?.items || [])
      .filter(item => item.cloneFromId && !group.items.some(original => original.id === item.id))
      .map(item => ({ catalog: group.items.find(source => source.id === item.cloneFromId) || group.items[0], patch: item }))
      .filter(entry => Boolean(entry.catalog));
    return [...originals, ...added].sort((a, b) => (a.patch.order ?? 0) - (b.patch.order ?? 0));
  };

  const reorderTo = (group: StructureGroup, sourceId: string, targetId: string) => mutateDraft(draft => {
    const structure = ensureStructure(draft, group);
    const order = orderedItems(group).map(entry => entry.patch.id);
    const from = order.indexOf(sourceId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    order.forEach((itemId, index) => { ensurePatch(draft, group, itemId).order = index * 10; });
    structure.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  const setEnabled = (group: StructureGroup, id: string, enabled: boolean) => mutateDraft(draft => { ensurePatch(draft, group, id).enabled = enabled; });

  const structureFieldValue = (group: StructureGroup, source: StructureItem, patch: StructureItemOverride, field: StructureField, lang: Locale): StructureScalar => {
    if (fieldScope(field) === 'common') return patch.common?.[field.key] ?? field.common ?? '';
    if (patch.cloneFromId) return patch.locales?.[lang]?.[field.key] ?? field[lang] ?? '';
    if (field.copyId) return config.draft.copyOverrides[field.copyId]?.[lang] ?? field[lang] ?? '';
    return field[lang] ?? '';
  };

  const setStructureField = (group: StructureGroup, source: StructureItem, patch: StructureItemOverride, field: StructureField, lang: Locale, value: StructureScalar) => {
    if (fieldScope(field) === 'common') {
      mutateDraft(draft => {
        const item = ensurePatch(draft, group, patch.id);
        item.common = { ...(item.common || {}) };
        if (value === field.common) delete item.common[field.key]; else item.common[field.key] = value;
      });
      return;
    }
    if (patch.cloneFromId) {
      mutateDraft(draft => {
        const item = ensurePatch(draft, group, patch.id);
        item.locales = item.locales || {};
        item.locales[lang] = { ...(item.locales[lang] || {}), [field.key]: String(value ?? '') };
      });
      return;
    }
    if (!field.copyId) return;
    mutateDraft(draft => {
      const current = draft.copyOverrides[field.copyId!] || {};
      if (String(value ?? '') === (field[lang] || '')) delete current[lang]; else current[lang] = String(value ?? '');
      if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete draft.copyOverrides[field.copyId!];
      else draft.copyOverrides[field.copyId!] = current;
    });
  };

  const duplicateItem = (group: StructureGroup, source: StructureItem, sourcePatch?: StructureItemOverride) => mutateDraft(draft => {
    const structure = ensureStructure(draft, group);
    const basePatch = sourcePatch || structure.items.find(item => item.id === source.id) || { id: source.id };
    const sourceId = basePatch.cloneFromId || source.id;
    const id = `added-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const common: Record<string, StructureScalar> = {};
    const locales: StructureItemOverride['locales'] = {};
    for (const field of source.fields) {
      if (fieldScope(field) === 'common') {
        common[field.key] = basePatch.common?.[field.key] ?? field.common ?? null;
      } else {
        for (const lang of LANGS) {
          locales[lang] = locales[lang] || {};
          const current = basePatch.cloneFromId
            ? basePatch.locales?.[lang]?.[field.key] ?? field[lang] ?? ''
            : field.copyId ? draft.copyOverrides[field.copyId]?.[lang] ?? field[lang] ?? '' : field[lang] ?? '';
          locales[lang]![field.key] = String(current);
        }
      }
    }
    structure.items.push({
      id,
      cloneFromId: sourceId,
      enabled: true,
      order: Math.max(0, ...structure.items.map(item => item.order || 0)) + 10,
      ...(Object.keys(common).length ? { common } : {}),
      locales,
    });
  });

  const deleteAdded = (group: StructureGroup, id: string) => mutateDraft(draft => {
    const structure = ensureStructure(draft, group);
    structure.items = structure.items.filter(item => item.id !== id);
  });

  const setLayout = (group: StructureGroup, layout: StructureLayout) => mutateDraft(draft => { ensureStructure(draft, group).layout = layout; });

  const openPreview = (inspect = false) => {
    const targetPage = page !== 'all' && PAGE_PATHS[page] ? PAGE_PATHS[page] : '/';
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}${targetPage}?cmsPreview=1${inspect ? '&cmsInspect=1' : ''}`, '_blank', 'noopener,noreferrer');
  };

  const calc = config.draft.calculators;
  const numberField = (label: string, value: number, onChange: (value: number) => void) => (
    <label className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span><input type="number" min={0} step={100} value={value} onChange={event => onChange(Math.max(0, Number(event.target.value) || 0))} className={inputClass()} /></label>
  );
  const tabButton = (id: Tab, label: string, icon: ReactNode) => <button onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${tab === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{icon}{label}</button>;

  const fieldEditor = (group: StructureGroup, source: StructureItem, patch: StructureItemOverride, field: StructureField) => {
    const scope = fieldScope(field);
    const lang = scope === 'common' ? locale : locale;
    const current = structureFieldValue(group, source, patch, field, lang);
    const label = scope === 'common' ? `${field.key} · ОБЩЕЕ` : `${field.key} · ${locale.toUpperCase()}`;
    if (fieldType(field) === 'boolean') return <label key={field.key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><input type="checkbox" checked={Boolean(current)} onChange={event => setStructureField(group, source, patch, field, lang, event.target.checked)} /><span className="text-xs font-black text-slate-600">{label}</span></label>;
    if (fieldType(field) === 'number') return <label key={field.key}><span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{label}</span><input type="number" value={scalarInput(current)} onChange={event => setStructureField(group, source, patch, field, lang, parseScalar(field, event.target.value))} className={inputClass()} /></label>;
    return <label key={field.key}><span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{label}</span><textarea rows={scope === 'common' ? 1 : 2} value={scalarInput(current)} onChange={event => setStructureField(group, source, patch, field, lang, parseScalar(field, event.target.value))} className={inputClass()} /></label>;
  };

  return <div className="space-y-6">
    <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div><div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">CMS Platform · Full Page Editing 4.1</div><h2 className="mt-1 text-2xl font-black text-slate-950">Контент, структура, preview и публикация</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Тексты локализованы по UA/RU/EN. Иконки, URL, изображения, типы, числа и другие structural fields общие. Структуру можно перетаскивать мышью.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => openPreview(false)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50"><Eye className="h-4 w-4" />Preview</button><button onClick={() => openPreview(true)} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 px-4 py-2.5 text-xs font-black text-fuchsia-700 hover:bg-fuchsia-50"><Eye className="h-4 w-4" />Visual edit</button><button onClick={() => void saveDraft()} disabled={!dirty || saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Save className="h-4 w-4" />Сохранить Draft</button><button onClick={() => void publish()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Send className="h-4 w-4" />Опубликовать</button></div>
      </div>
    </header>

    {message && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">{message}</div>}
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{tabButton('copy', 'Тексты', <FileText className="h-4 w-4" />)}{tabButton('structure', 'Структура', <ListTree className="h-4 w-4" />)}{tabButton('calculators', 'Калькуляторы', <SlidersHorizontal className="h-4 w-4" />)}{tabButton('workflow', 'Draft / Publish', <CalendarClock className="h-4 w-4" />)}{tabButton('quality', `Quality ${errors.length ? `(${errors.length})` : ''}`, <ShieldCheck className="h-4 w-4" />)}</div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex gap-2 overflow-x-auto"><button onClick={() => setPage('all')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${page === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Все страницы</button>{pages.map(item => <button key={item} onClick={() => setPage(item)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${page === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{PAGE_LABELS[item] || item}</button>)}</div></div>

    {tab === 'copy' && <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти текст…" className={inputClass()} /><label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={onlyChanged} onChange={event => setOnlyChanged(event.target.checked)} />Только изменённые</label></div>
      {filteredCopy.slice(0, 180).map(entry => <article key={entry.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${config.draft.copyOverrides[entry.id] ? 'border-indigo-200' : 'border-slate-200'}`}><div className="mb-3 flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase text-indigo-600">{PAGE_LABELS[entry.page] || entry.page} · {entry.kind}</div><div className="mt-1 text-sm font-black text-slate-900">{entry.label}</div><div className="mt-1 font-mono text-[9px] text-slate-400">{entry.source}:{entry.line}</div></div><button onClick={() => mutateDraft(draft => { delete draft.copyOverrides[entry.id]; })} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><RotateCcw className="h-4 w-4" /></button></div><div className="grid gap-3 xl:grid-cols-3">{LANGS.map(lang => <label key={lang}><span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{lang}</span><textarea rows={3} value={config.draft.copyOverrides[entry.id]?.[lang] ?? entry[lang]} onChange={event => setCopy(entry, lang, event.target.value)} className={inputClass()} /></label>)}</div></article>)}
    </div>}

    {tab === 'structure' && <div className="space-y-5">
      {structures.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">Для этой страницы автоматически редактируемых структур не найдено.</div>}
      {structures.map(group => {
        const layout = config.draft.structures[group.id]?.layout || 'auto';
        return <section key={group.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><div className="text-[10px] font-black uppercase text-indigo-600">{PAGE_LABELS[group.page] || group.page}</div><h3 className="mt-1 font-black text-slate-950">{group.label}</h3><div className="mt-1 font-mono text-[9px] text-slate-400">{group.source}:{group.line}</div></div><div className="flex flex-wrap items-center gap-2"><select value={layout} onChange={event => setLayout(group, event.target.value as StructureLayout)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black"><option value="auto">Layout: исходный</option><option value="stack">1 колонка</option><option value="grid-2">2 колонки</option><option value="grid-3">3 колонки</option><option value="grid-4">4 колонки</option></select>{LANGS.map(lang => <button key={lang} onClick={() => setLocale(lang)} className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase ${locale === lang ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{lang}</button>)}</div></div>
          <div className="mt-4 space-y-3">{orderedItems(group).map(({ catalog, patch }, index) => {
            const commonFields = catalog.fields.filter(field => fieldScope(field) === 'common');
            const localeFields = catalog.fields.filter(field => fieldScope(field) === 'locale');
            return <div key={patch.id} draggable onDragStart={() => setDragging({ groupId: group.id, itemId: patch.id })} onDragEnd={() => setDragging(null)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (dragging?.groupId === group.id) reorderTo(group, dragging.itemId, patch.id); setDragging(null); }} className={`rounded-2xl border p-4 transition ${dragging?.itemId === patch.id ? 'border-indigo-400 bg-indigo-50/60' : patch.enabled === false ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><GripVertical className="h-4 w-4 cursor-grab text-slate-400" /><span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black text-white">{index + 1}</span><span className="text-sm font-black text-slate-900">{catalog.label}</span>{patch.cloneFromId && <span className="rounded-lg bg-fuchsia-50 px-2 py-1 text-[10px] font-black text-fuchsia-700">добавлен</span>}{patch.enabled === false && <span className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-black text-slate-600">скрыт</span>}</div><div className="flex gap-1"><button onClick={() => setEnabled(group, patch.id, patch.enabled === false)} className="rounded-lg border p-2" title={patch.enabled === false ? 'Восстановить' : 'Убрать со страницы'}>{patch.enabled === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button><button onClick={() => duplicateItem(group, catalog, patch)} className="rounded-lg border p-2" title="Дублировать"><Copy className="h-3.5 w-3.5" /></button>{patch.cloneFromId ? <button onClick={() => deleteAdded(group, patch.id)} className="rounded-lg border border-red-200 p-2 text-red-600" title="Удалить добавленный элемент"><Trash2 className="h-3.5 w-3.5" /></button> : <button onClick={() => setEnabled(group, patch.id, false)} className="rounded-lg border border-red-100 p-2 text-red-500" title="Удалить со страницы (можно восстановить)"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div>
              {commonFields.length > 0 && <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="mb-2 text-[10px] font-black uppercase text-slate-400">Общие поля — не зависят от языка</div><div className="grid gap-3 lg:grid-cols-2">{commonFields.map(field => fieldEditor(group, catalog, patch, field))}</div></div>}
              {localeFields.length > 0 && <div className="mt-3 grid gap-3 lg:grid-cols-2">{localeFields.map(field => fieldEditor(group, catalog, patch, field))}</div>}
            </div>;
          })}</div>
          <button onClick={() => group.items[0] && duplicateItem(group, group.items[0])} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50"><Plus className="h-4 w-4" />Добавить элемент</button>
        </section>;
      })}
    </div>}

    {tab === 'calculators' && <div className="grid gap-5 xl:grid-cols-3"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">LIVE</h3><div className="mt-4 grid gap-3">{Object.entries(calc.live).map(([key, value]) => numberField(key, Number(value), next => mutateDraft(draft => { (draft.calculators.live as unknown as Record<string, number>)[key] = next; })))}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Video</h3><div className="mt-4 grid gap-3">{numberField('base', calc.video.base, value => mutateDraft(draft => { draft.calculators.video.base = value; }))}{Object.entries(calc.video.videoType).map(([key, value]) => numberField(`type.${key}`, Number(value), next => mutateDraft(draft => { (draft.calculators.video.videoType as unknown as Record<string, number>)[key] = next; })))}{Object.entries(calc.video.duration).map(([key, value]) => numberField(`duration.${key}`, Number(value), next => mutateDraft(draft => { (draft.calculators.video.duration as unknown as Record<string, number>)[key] = next; })))}{(['script', 'actors', 'drone', 'voiceover', 'graphics3d'] as const).map(key => numberField(key, calc.video[key], value => mutateDraft(draft => { draft.calculators.video[key] = value; })))}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Construction</h3><div className="mt-4 grid gap-3">{Object.entries(calc.construction).map(([key, value]) => numberField(key, Number(value), next => mutateDraft(draft => { (draft.calculators.construction as unknown as Record<string, number>)[key] = next; })))}</div></section></div>}

    {tab === 'workflow' && <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-slate-950">Состояние</h3><div className="mt-4 space-y-2 text-sm text-slate-600"><div>Draft: <b>{config.workflow.draftUpdatedAt ? new Date(config.workflow.draftUpdatedAt).toLocaleString() : 'совпадает с published'}</b></div><div>Published: <b>{config.workflow.publishedAt ? new Date(config.workflow.publishedAt).toLocaleString() : 'legacy / исходное состояние'}</b></div><div>Изменения в текущей сессии: <b>{dirty ? 'есть' : 'нет'}</b></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void saveDraft()} disabled={!dirty} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">Сохранить Draft</button><button onClick={() => void discard()} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Отменить Draft</button></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-slate-950">Scheduled publishing</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">При сохранении расписания фиксируется отдельный snapshot текущего Draft.</p><input type="datetime-local" value={schedule} onChange={event => setSchedule(event.target.value)} className={`${inputClass()} mt-4`} /><div className="mt-3 flex gap-2"><button onClick={() => void saveSchedule()} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white">Сохранить расписание</button>{config.workflow.scheduledAt && <button onClick={() => { setSchedule(''); void saveSchedule(); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Очистить</button>}</div></section></div>}

    {tab === 'quality' && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-600" /><h3 className="font-black text-slate-950">Publish Quality Gate 3.1</h3></div><div className="mt-2 text-xs text-slate-500">Ошибки блокируют Publish; предупреждения требуют проверки.</div>{issues.length === 0 ? <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" />Проверки пройдены.</div> : <div className="mt-4 space-y-2">{issues.map((issue, index) => <div key={`${issue.area}-${index}`} className={`rounded-xl border p-3 text-xs ${issue.level === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}><b>{issue.level === 'error' ? 'ERROR' : 'WARN'} · {issue.area}</b><div className="mt-1">{issue.message}</div></div>)}</div>}<div className="mt-4 text-xs font-bold text-slate-500">Errors: {errors.length} · Warnings: {warnings.length}</div></div>}
  </div>;
}
