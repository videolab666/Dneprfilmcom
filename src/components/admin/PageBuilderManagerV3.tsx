import { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileStack,
  GripVertical,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useSiteContent } from '../../context/SiteContentContext';
import { AdminImageField } from './AdminImageField';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { RichTextEditor } from './RichTextEditor';
import { PageBuilderRenderer } from '../page-builder/PageBuilderRenderer';
import {
  PAGE_BUILDER_CATEGORIES,
  PAGE_BUILDER_KINDS,
  PAGE_BUILDER_PAGES,
  blockKind,
  blockMatchesPage,
  builderDraftData,
  createBuilderBlock,
  isNativeBuilderKind,
  localizedBuilderBlock,
  resolveBuilderDraft,
  type BuilderSiteBlock,
  type PageBuilderCategory,
  type PageBuilderDownloadItem,
  type PageBuilderImage,
  type PageBuilderKind,
  type PageBuilderPage,
  type PageBuilderPreset,
  type PageBuilderTableRow,
  type PageBuilderTabItem,
  type PageBuilderTeamItem,
  type PageBuilderTimelineItem,
  type StoredBuilderSiteBlock,
} from '../../lib/pageBuilder';
import type { Locale } from '../../types';
import { versionedDeleteDoc as deleteDoc, versionedSetDoc as setDoc } from '../../lib/cmsVersioning';

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'UA' },
  { id: 'ru', label: 'RU' },
  { id: 'en', label: 'EN' },
];

type BuilderPageSelection = PageBuilderPage | 'all';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function inputClass(extra = ''): string {
  return `w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${extra}`;
}

function localizedConfig(block: BuilderSiteBlock, locale: Locale): BuilderSiteBlock['config'] {
  if (locale === 'ru') return block.config;
  return { ...block.config, ...(locale === 'uk' ? block.config_uk : block.config_en) };
}

function localizedTitle(block: BuilderSiteBlock, locale: Locale): string {
  if (locale === 'uk') return block.title_uk || block.title;
  if (locale === 'en') return block.title_en || block.title_uk || block.title;
  return block.title;
}

function editableView(block: StoredBuilderSiteBlock): BuilderSiteBlock {
  const draft = block.builderDraft;
  if (!draft) return block;
  return {
    ...block,
    title: draft.title,
    title_uk: draft.title_uk,
    title_en: draft.title_en,
    type: draft.type,
    order: draft.order,
    isActive: draft.isActive,
    page: draft.page,
    config: draft.config,
    config_uk: draft.config_uk,
    config_en: draft.config_en,
  };
}

function kindLabel(kind: PageBuilderKind): string {
  return PAGE_BUILDER_KINDS.find(item => item.id === kind)?.label || kind;
}

function sectionLabel(text: string) {
  return <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{text}</div>;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function validateBlock(block: BuilderSiteBlock): string[] {
  const kind = blockKind(block);
  const config = block.config;
  const errors: string[] = [];
  if (!block.title.trim()) errors.push('Не задано внутреннее название секции.');
  if (kind === 'downloads') {
    (config.downloadItems || []).forEach((item, index) => {
      if (!item.title.trim()) errors.push(`Файл ${index + 1}: нет названия.`);
      if (!item.url.trim()) errors.push(`Файл ${index + 1}: нет URL.`);
    });
  }
  if (kind === 'timeline') (config.timelineItems || []).forEach((item, index) => { if (!item.title.trim()) errors.push(`Timeline ${index + 1}: нет заголовка.`); });
  if (kind === 'tabs') {
    if (!(config.tabs || []).length) errors.push('Tabs: нужна минимум одна вкладка.');
    (config.tabs || []).forEach((item, index) => { if (!item.title.trim()) errors.push(`Вкладка ${index + 1}: нет названия.`); });
  }
  if (kind === 'table' && !(config.tableColumns || []).length) errors.push('Таблица: нужна минимум одна колонка.');
  if (kind === 'team') (config.teamItems || []).forEach((item, index) => { if (!item.name.trim()) errors.push(`Команда ${index + 1}: нет имени.`); });
  return errors;
}

export function PageBuilderManager() {
  const { rawSettings, updateSettings } = useSiteContent();
  const [stored, setStored] = useState<StoredBuilderSiteBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<BuilderPageSelection>('home');
  const [editing, setEditing] = useState<BuilderSiteBlock | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);
  const [language, setLanguage] = useState<Locale>('uk');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [libraryQuery, setLibraryQuery] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const presets = useMemo(() => {
    const value = (rawSettings as unknown as { pageBuilderPresets?: PageBuilderPreset[] }).pageBuilderPresets;
    return Array.isArray(value) ? value : [];
  }, [rawSettings]);

  useEffect(() => onSnapshot(collection(db, 'site_blocks'), snapshot => {
    const next = snapshot.docs
      .map(item => ({ id: item.id, ...item.data() } as StoredBuilderSiteBlock))
      .sort((a, b) => (editableView(a).order || 0) - (editableView(b).order || 0));
    setStored(next);
    setLoading(false);
  }, err => {
    setError(err.message);
    setLoading(false);
  }), []);

  const visibleStored = useMemo(() => stored.filter(item => {
    const block = editableView(item);
    if (page === 'all') return block.page === 'all' || block.config.builderScope === 'global';
    return blockMatchesPage(block, page);
  }).sort((a, b) => (editableView(a).order || 0) - (editableView(b).order || 0)), [stored, page]);

  const dirtyStored = useMemo(() => visibleStored.filter(item => Boolean(item.builderDraft) || item._builderUnpublished), [visibleStored]);

  const nextOrder = () => visibleStored.length ? Math.max(...visibleStored.map(item => editableView(item).order || 0)) + 10 : 10;

  const patchConfig = (patch: Partial<BuilderSiteBlock['config']>, common = false) => {
    setEditing(current => {
      if (!current) return current;
      if (common || language === 'ru') return { ...current, config: { ...current.config, ...patch } };
      if (language === 'uk') return { ...current, config_uk: { ...(current.config_uk || {}), ...patch } };
      return { ...current, config_en: { ...(current.config_en || {}), ...patch } };
    });
  };

  const patchTitle = (value: string) => setEditing(current => {
    if (!current) return current;
    if (language === 'uk') return { ...current, title_uk: value };
    if (language === 'en') return { ...current, title_en: value };
    return { ...current, title: value };
  });

  const createBlock = (kind: PageBuilderKind) => {
    const targetPage: PageBuilderPage = page === 'all' ? 'home' : page;
    const next = createBuilderBlock(kind, targetPage, nextOrder());
    if (page === 'all') {
      next.page = 'all';
      next.config.builderScope = 'global';
      next.config.builderPlacement = 'after';
    }
    setEditing(next);
    setEditingIsNew(true);
    setLanguage('uk');
    setPreviewOpen(false);
    setError('');
    setMessage('');
  };

  const editBlock = (storedBlock: StoredBuilderSiteBlock) => {
    setEditing(clone(editableView(storedBlock)));
    setEditingIsNew(false);
    setLanguage('uk');
    setPreviewOpen(false);
    setError('');
    setMessage('');
  };

  const saveDraft = async () => {
    if (!editing) return;
    const validation = validateBlock(editing);
    if (validation.length) {
      setError(validation.join(' '));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const draft = builderDraftData(editing);
      if (editingIsNew) {
        const placeholder = clean({
          ...editing,
          isActive: false,
          _builderUnpublished: true,
          builderDraft: draft,
          builderDraftUpdatedAt: Date.now(),
          updatedAt: Date.now(),
        }) as StoredBuilderSiteBlock;
        await setDoc(doc(db, 'site_blocks', editing.id), placeholder);
      } else {
        await setDoc(doc(db, 'site_blocks', editing.id), clean({ builderDraft: draft, builderDraftUpdatedAt: Date.now(), updatedAt: Date.now() }), { merge: true });
      }
      setEditing(null);
      setEditingIsNew(false);
      setPickerOpen(false);
      setMessage('Черновик секции сохранён. Публичный сайт не изменён.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const draftToggle = async (storedBlock: StoredBuilderSiteBlock) => {
    const block = editableView(storedBlock);
    const next = { ...block, isActive: !block.isActive };
    await setDoc(doc(db, 'site_blocks', block.id), clean({ builderDraft: builderDraftData(next), builderDraftUpdatedAt: Date.now() }), { merge: true });
  };

  const draftDelete = async (storedBlock: StoredBuilderSiteBlock) => {
    const block = editableView(storedBlock);
    if (!window.confirm(`Убрать секцию «${block.title_uk || block.title}» из черновика страницы?`)) return;
    if (storedBlock._builderUnpublished) {
      await deleteDoc(doc(db, 'site_blocks', storedBlock.id));
      return;
    }
    await setDoc(doc(db, 'site_blocks', storedBlock.id), clean({ builderDraft: builderDraftData(block, true), builderDraftUpdatedAt: Date.now() }), { merge: true });
  };

  const duplicateBlock = async (storedBlock: StoredBuilderSiteBlock) => {
    const source = editableView(storedBlock);
    const copy = clone(source);
    copy.id = makeId('builder-copy');
    copy.order = nextOrder();
    copy.title = `${source.title} — copy`;
    copy.title_uk = source.title_uk ? `${source.title_uk} — копія` : undefined;
    copy.title_en = source.title_en ? `${source.title_en} — copy` : undefined;
    const placeholder = clean({ ...copy, isActive: false, _builderUnpublished: true, builderDraft: builderDraftData(copy), builderDraftUpdatedAt: Date.now(), updatedAt: Date.now() });
    await setDoc(doc(db, 'site_blocks', copy.id), placeholder);
  };

  const persistOrder = async (ordered: StoredBuilderSiteBlock[]) => {
    await Promise.all(ordered.map((storedBlock, index) => {
      const block = { ...editableView(storedBlock), order: (index + 1) * 10 };
      return setDoc(doc(db, 'site_blocks', block.id), clean({ builderDraft: builderDraftData(block), builderDraftUpdatedAt: Date.now() }), { merge: true });
    }));
  };

  const dropBlock = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const source = visibleStored.findIndex(item => item.id === draggedId);
    const target = visibleStored.findIndex(item => item.id === targetId);
    if (source < 0 || target < 0) return;
    const next = [...visibleStored];
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    setDraggedId(null);
    await persistOrder(next);
  };

  const affectsSelection = (storedBlock: StoredBuilderSiteBlock): boolean => {
    const block = editableView(storedBlock);
    if (page === 'all') return block.page === 'all' || block.config.builderScope === 'global';
    return blockMatchesPage(block, page);
  };

  const publishPage = async () => {
    const candidates = stored.filter(item => affectsSelection(item) && (item.builderDraft || item._builderUnpublished));
    const errors = candidates.flatMap(item => {
      const resolved = resolveBuilderDraft(item);
      return resolved ? validateBlock(resolved).map(issue => `${resolved.title_uk || resolved.title}: ${issue}`) : [];
    });
    if (errors.length) {
      setError(`Публикация остановлена. ${errors.join(' ')}`);
      return;
    }
    if (!candidates.length) {
      setMessage('Нет изменений для публикации на выбранной странице.');
      return;
    }
    if (!window.confirm(`Опубликовать изменения секций (${candidates.length})?`)) return;
    setSaving(true);
    try {
      await Promise.all(candidates.map(async storedBlock => {
        const draft = storedBlock.builderDraft;
        if (draft?.deleted) {
          await deleteDoc(doc(db, 'site_blocks', storedBlock.id));
          return;
        }
        const resolved = resolveBuilderDraft(storedBlock);
        if (!resolved) return;
        const published = clean({
          title: resolved.title,
          title_uk: resolved.title_uk,
          title_en: resolved.title_en,
          type: resolved.type,
          order: resolved.order,
          isActive: resolved.isActive,
          page: resolved.page,
          config: resolved.config,
          config_uk: resolved.config_uk,
          config_en: resolved.config_en,
          builderDraft: null,
          builderDraftUpdatedAt: null,
          builderPublishedAt: Date.now(),
          _builderUnpublished: false,
          updatedAt: Date.now(),
        });
        await setDoc(doc(db, 'site_blocks', storedBlock.id), published, { merge: true });
      }));
      setMessage(`Опубликовано секций: ${candidates.length}.`);
      setError('');
    } finally {
      setSaving(false);
    }
  };

  const discardPage = async () => {
    const candidates = stored.filter(item => affectsSelection(item) && (item.builderDraft || item._builderUnpublished));
    if (!candidates.length) return;
    if (!window.confirm(`Отменить изменения секций (${candidates.length}) и вернуть опубликованную версию?`)) return;
    setSaving(true);
    try {
      await Promise.all(candidates.map(item => item._builderUnpublished
        ? deleteDoc(doc(db, 'site_blocks', item.id))
        : setDoc(doc(db, 'site_blocks', item.id), { builderDraft: null, builderDraftUpdatedAt: null }, { merge: true })));
      setMessage('Черновик секций сброшен к опубликованной версии.');
      setError('');
    } finally {
      setSaving(false);
    }
  };

  const openPreview = () => {
    if (page === 'all') return;
    const meta = PAGE_BUILDER_PAGES.find(item => item.id === page);
    if (!meta) return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}${meta.path}?cmsPreview=1&lang=${language}`, '_blank', 'noopener,noreferrer');
  };

  const savePreset = async () => {
    if (!editing) return;
    const name = presetName.trim() || localizedTitle(editing, language) || kindLabel(blockKind(editing));
    const preset: PageBuilderPreset = {
      id: makeId('preset'),
      name,
      type: editing.type,
      title: editing.title,
      config: clone(editing.config),
      config_uk: clone(editing.config_uk || {}),
      config_en: clone(editing.config_en || {}),
      createdAt: Date.now(),
    };
    await updateSettings({ pageBuilderPresets: [...presets, preset] } as never);
    setPresetName('');
  };

  const deletePreset = async (id: string) => updateSettings({ pageBuilderPresets: presets.filter(item => item.id !== id) } as never);

  const addPreset = (preset: PageBuilderPreset) => {
    const targetPage: PageBuilderPage = page === 'all' ? 'home' : page;
    const block = createBuilderBlock((preset.config.builderKind || preset.type) as PageBuilderKind, targetPage, nextOrder());
    block.type = preset.type;
    block.title = preset.title;
    block.config = clone(preset.config);
    block.config_uk = clone(preset.config_uk || {});
    block.config_en = clone(preset.config_en || {});
    if (page === 'all') { block.page = 'all'; block.config.builderScope = 'global'; }
    else { block.page = page; block.config.builderScope = 'page'; }
    setEditing(block);
    setEditingIsNew(true);
    setLanguage('uk');
  };

  const activeConfig = editing ? localizedConfig(editing, language) : null;
  const activeKind = editing ? blockKind(editing) : null;
  const previewBlock = editing ? localizedBuilderBlock(editing, language) : null;

  const libraryGroups = useMemo(() => {
    const needle = libraryQuery.trim().toLowerCase();
    return PAGE_BUILDER_CATEGORIES.map(category => ({
      ...category,
      items: PAGE_BUILDER_KINDS.filter(item => item.category === category.id)
        .filter(item => !needle || `${item.label} ${item.description}`.toLowerCase().includes(needle)),
    })).filter(group => group.items.length);
  }, [libraryQuery]);

  const patchItems = (items: NonNullable<BuilderSiteBlock['config']['items']>) => patchConfig({ items });
  const addGenericItem = () => patchItems([...(activeConfig?.items || []), { title: 'Новый пункт', description: '' }]);
  const patchGenericItem = (index: number, patch: Record<string, string>) => {
    const items = [...(activeConfig?.items || [])];
    items[index] = { ...items[index], ...patch };
    patchItems(items);
  };
  const moveGenericItem = (index: number, direction: -1 | 1) => {
    const items = [...(activeConfig?.items || [])];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    patchItems(items);
  };

  const patchTimeline = (items: PageBuilderTimelineItem[]) => patchConfig({ timelineItems: items });
  const patchDownloads = (items: PageBuilderDownloadItem[]) => patchConfig({ downloadItems: items });
  const patchTabs = (items: PageBuilderTabItem[]) => patchConfig({ tabs: items });
  const patchRows = (items: PageBuilderTableRow[]) => patchConfig({ tableRows: items });
  const patchTeam = (items: PageBuilderTeamItem[]) => patchConfig({ teamItems: items });

  const addGalleryAssets = (assets: Array<{ url: string; name?: string; publicId?: string }>) => {
    if (!editing) return;
    const existing = new Set(editing.config.galleryImages?.map(image => image.url) || []);
    const additions: PageBuilderImage[] = assets.filter(asset => !existing.has(asset.url)).map((asset, index) => ({
      id: `pb-image-${Date.now()}-${index}`,
      url: asset.url,
      cloudinaryPublicId: asset.publicId,
      alt: asset.name || '', alt_uk: asset.name || '', alt_en: asset.name || '',
      caption: '', caption_uk: '', caption_en: '', featured: false, focalX: 50, focalY: 50,
    }));
    patchConfig({ galleryImages: [...(editing.config.galleryImages || []), ...additions] }, true);
    setPickerOpen(false);
  };

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Загрузка Component Library…</div>;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700"><Layers className="h-3.5 w-3.5" />CMS Platform · Component & Section Library 4.2</div>
            <h2 className="text-2xl font-black text-slate-950">Конструктор секций без изменения текущего дизайна</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">Новые секции сохраняются в Draft. DNEPRFILM Pixel Perfect вызывает существующие React-компоненты напрямую — их DOM и CSS не переписываются.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openPreview} disabled={page === 'all'} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-xs font-black text-indigo-700 disabled:opacity-40"><ExternalLink className="h-4 w-4" />Preview Draft</button>
            <button type="button" onClick={() => void discardPage()} disabled={!dirtyStored.length || saving} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 disabled:opacity-40"><RotateCcw className="h-4 w-4" />Сбросить Draft</button>
            <button type="button" onClick={() => void publishPage()} disabled={!dirtyStored.length || saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Send className="h-4 w-4" />Опубликовать ({dirtyStored.length})</button>
          </div>
        </div>
      </header>

      {message && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">{message}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap gap-2">{PAGE_BUILDER_PAGES.map(item => <button key={item.id} type="button" onClick={() => setPage(item.id)} className={`rounded-xl px-3 py-2 text-xs font-black ${page === item.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item.label}</button>)}<button type="button" onClick={() => setPage('all')} className={`rounded-xl px-3 py-2 text-xs font-black ${page === 'all' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Весь сайт</button></div>
      </section>

      <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-300"><Plus className="h-4 w-4" />Библиотека компонентов</div><div className="mt-1 text-xs text-slate-400">Существующие + универсальные + pixel-perfect native секции.</div></div><label className="relative block sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={libraryQuery} onChange={event => setLibraryQuery(event.target.value)} placeholder="Найти блок…" className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-indigo-500" /></label></div>
        <div className="space-y-5">{libraryGroups.map(group => <div key={group.id}><div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{group.label}</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{group.items.map(item => <button key={item.id} type="button" onClick={() => createBlock(item.id)} className={`rounded-2xl border p-3 text-left transition ${item.native ? 'border-emerald-700/60 bg-emerald-950/30 hover:border-emerald-400' : 'border-slate-700 bg-slate-900/70 hover:border-indigo-500 hover:bg-indigo-500/10'}`}><div className="flex items-center gap-2"><span className="text-sm font-black text-white">{item.label}</span>{item.native && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-300">pixel perfect</span>}</div><div className="mt-1 text-[11px] leading-5 text-slate-400">{item.description}</div></button>)}</div></div>)}</div>
      </section>

      {presets.length > 0 && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500"><FileStack className="h-4 w-4" />Мои шаблоны</div><div className="flex flex-wrap gap-2">{presets.map(preset => <div key={preset.id} className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><button type="button" onClick={() => addPreset(preset)} className="px-3 py-2 text-xs font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-700">+ {preset.name}</button><button type="button" onClick={() => void deletePreset(preset.id)} className="border-l border-slate-200 px-2 py-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></div>)}</div></section>}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4"><div><div className="text-lg font-black text-slate-950">Секции страницы</div><div className="text-xs text-slate-500">Drag & drop меняет порядок только в Draft до публикации.</div></div><div className="flex gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{visibleStored.length}</span>{dirtyStored.length > 0 && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Draft {dirtyStored.length}</span>}</div></div>
        <div className="space-y-2">
          {visibleStored.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">На этой странице пока нет builder-секций. Текущие hardcoded-секции сайта остаются без изменений.</div>}
          {visibleStored.map(storedBlock => {
            const block = editableView(storedBlock);
            const deleted = Boolean(storedBlock.builderDraft?.deleted);
            const dirty = Boolean(storedBlock.builderDraft) || storedBlock._builderUnpublished;
            return <div key={block.id} draggable={!deleted} onDragStart={() => setDraggedId(block.id)} onDragEnd={() => setDraggedId(null)} onDragOver={event => event.preventDefault()} onDrop={() => void dropBlock(block.id)} className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center ${deleted ? 'border-red-200 bg-red-50 opacity-65' : block.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
              <GripVertical className="hidden h-5 w-5 shrink-0 cursor-grab text-slate-300 sm:block" />
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-black text-slate-900">{block.title_uk || block.title}</span><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700">{kindLabel(blockKind(block))}</span>{dirty && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">draft</span>}{storedBlock._builderUnpublished && <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-black uppercase text-fuchsia-700">новый</span>}{deleted && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-700">будет удалён</span>}{isNativeBuilderKind(blockKind(block)) && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700">pixel perfect</span>}</div><div className="mt-1 text-[11px] text-slate-500">{block.page} · {block.config.builderPlacement || 'inline'} · order {block.order}</div></div>
              {!deleted && <div className="flex flex-wrap gap-1"><button type="button" onClick={() => editBlock(storedBlock)} className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700" title="Редактировать Draft"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => void duplicateBlock(storedBlock)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Дублировать в Draft"><Copy className="h-4 w-4" /></button><button type="button" onClick={() => void draftToggle(storedBlock)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title={block.isActive ? 'Скрыть в Draft' : 'Показать в Draft'}>{block.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button type="button" onClick={() => void draftDelete(storedBlock)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Удалить в Draft"><Trash2 className="h-4 w-4" /></button></div>}
            </div>;
          })}
        </div>
      </section>

      {editing && activeConfig && activeKind && <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null); }}>
        <div className="mx-auto my-3 max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6"><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">{kindLabel(activeKind)}{isNativeBuilderKind(activeKind) ? ' · PIXEL PERFECT' : ''}</div><div className="mt-1 text-lg font-black text-slate-950">{editingIsNew ? 'Добавление секции' : 'Редактор Draft'}</div></div><div className="flex items-center gap-2"><button type="button" onClick={() => setPreviewOpen(value => !value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Preview</button><button type="button" onClick={() => setEditing(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div></div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">{LANGS.map(item => <button key={item.id} type="button" onClick={() => setLanguage(item.id)} className={`rounded-xl px-3 py-2 text-xs font-black ${language === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{item.label}</button>)}</div>

              {isNativeBuilderKind(activeKind) ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-sm font-black text-emerald-900">Pixel-perfect native component</div><p className="mt-2 text-xs leading-6 text-emerald-800">Эта секция рендерит существующий React-компонент сайта напрямую. Его DOM, Tailwind-классы и внутренний дизайн не копируются и не заменяются. Внутренний контент редактируется существующими CMS-инструментами; здесь управляются размещение, порядок, видимость и дублирование.</p></section> : <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Тексты')}<input value={localizedTitle(editing, language)} onChange={event => patchTitle(event.target.value)} placeholder="Внутреннее название секции" className={inputClass()} /><div className="grid gap-3 sm:grid-cols-2"><input value={activeConfig.badge || ''} onChange={event => patchConfig({ badge: event.target.value })} placeholder={`Badge — ${language.toUpperCase()}`} className={inputClass()} /><input value={activeConfig.heading || ''} onChange={event => patchConfig({ heading: event.target.value })} placeholder={`Заголовок — ${language.toUpperCase()}`} className={inputClass()} /></div><textarea rows={3} value={activeConfig.subheading || ''} onChange={event => patchConfig({ subheading: event.target.value })} placeholder={`Подзаголовок — ${language.toUpperCase()}`} className={inputClass()} /></section>}

              {activeKind === 'rich_text' && <section className="rounded-2xl border border-slate-200 p-4"><RichTextEditor value={activeConfig.richText || activeConfig.content || ''} onChange={richText => patchConfig({ richText })} minHeight={240} /></section>}

              {(activeKind === 'image' || activeKind === 'text_image') && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Изображение')}<AdminImageField label="Изображение" value={editing.config.imageUrl || ''} onChange={imageUrl => patchConfig({ imageUrl }, true)} previewAlt={activeConfig.imageAlt || activeConfig.heading || editing.title} helperText="Загрузка, медиатека или внешний URL." />{activeKind === 'image' && <><input value={activeConfig.imageAlt || ''} onChange={event => patchConfig({ imageAlt: event.target.value })} placeholder={`ALT — ${language.toUpperCase()}`} className={inputClass()} /><input value={activeConfig.imageCaption || ''} onChange={event => patchConfig({ imageCaption: event.target.value })} placeholder={`Caption — ${language.toUpperCase()}`} className={inputClass()} /></>}{activeKind === 'text_image' && <><textarea rows={5} value={activeConfig.content || ''} onChange={event => patchConfig({ content: event.target.value })} placeholder="Текст" className={inputClass()} /><select value={editing.config.imagePosition || 'right'} onChange={event => patchConfig({ imagePosition: event.target.value as 'left' | 'right' }, true)} className={inputClass()}><option value="right">Фото справа</option><option value="left">Фото слева</option></select></>}</section>}

              {activeKind === 'gallery' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Галерея')}<button type="button" onClick={() => setPickerOpen(true)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white">+ Добавить из медиатеки</button><div className="grid gap-3 sm:grid-cols-2">{(editing.config.galleryImages || []).map((image, index) => <div key={image.id} className="rounded-xl border border-slate-200 p-3"><div className="aspect-video overflow-hidden rounded-lg bg-slate-100">{image.url && <img src={image.url} alt="" className="h-full w-full object-cover" />}</div><input value={image.alt || ''} onChange={event => { const images = [...(editing.config.galleryImages || [])]; images[index] = { ...image, alt: event.target.value }; patchConfig({ galleryImages: images }, true); }} placeholder="ALT" className={`${inputClass()} mt-2`} /><button type="button" onClick={() => patchConfig({ galleryImages: (editing.config.galleryImages || []).filter((_, i) => i !== index) }, true)} className="mt-2 text-xs font-black text-red-600">Удалить</button></div>)}</div></section>}

              {['features_grid', 'stats_counter', 'process', 'pricing'].includes(activeKind) && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Карточки / элементы')}{(activeConfig.items || []).map((item, index) => <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="grid gap-2 sm:grid-cols-2"><input value={item.title || ''} onChange={event => patchGenericItem(index, { title: event.target.value })} placeholder="Заголовок" className={inputClass()} /><input value={item.value || ''} onChange={event => patchGenericItem(index, { value: event.target.value })} placeholder="Значение / цена" className={inputClass()} /></div><textarea rows={2} value={item.description || ''} onChange={event => patchGenericItem(index, { description: event.target.value })} placeholder="Описание" className={`${inputClass()} mt-2`} /><div className="mt-2 flex gap-2"><button type="button" onClick={() => moveGenericItem(index, -1)} className="text-xs font-black text-slate-500">↑</button><button type="button" onClick={() => moveGenericItem(index, 1)} className="text-xs font-black text-slate-500">↓</button><button type="button" onClick={() => patchItems((activeConfig.items || []).filter((_, i) => i !== index))} className="ml-auto text-xs font-black text-red-600">Удалить</button></div></div>)}<button type="button" onClick={addGenericItem} className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-700">+ Карточка</button></section>}

              {activeKind === 'faq' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('FAQ')}{(activeConfig.faqItems || []).map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-3"><input value={item.question} onChange={event => { const items = [...(activeConfig.faqItems || [])]; items[index] = { ...item, question: event.target.value }; patchConfig({ faqItems: items }); }} placeholder="Вопрос" className={inputClass()} /><textarea rows={3} value={item.answer} onChange={event => { const items = [...(activeConfig.faqItems || [])]; items[index] = { ...item, answer: event.target.value }; patchConfig({ faqItems: items }); }} placeholder="Ответ" className={`${inputClass()} mt-2`} /><button type="button" onClick={() => patchConfig({ faqItems: (activeConfig.faqItems || []).filter((_, i) => i !== index) })} className="mt-2 text-xs font-black text-red-600">Удалить</button></div>)}<button type="button" onClick={() => patchConfig({ faqItems: [...(activeConfig.faqItems || []), { question: 'Вопрос', answer: 'Ответ' }] })} className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-700">+ Вопрос</button></section>}

              {activeKind === 'video_embed' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Видео')}<input value={editing.config.videoUrl || ''} onChange={event => patchConfig({ videoUrl: event.target.value }, true)} placeholder="YouTube / Vimeo URL" className={inputClass()} /><input value={activeConfig.videoCaption || ''} onChange={event => patchConfig({ videoCaption: event.target.value })} placeholder="Подпись" className={inputClass()} /></section>}

              {activeKind === 'partners' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Партнёры')}<textarea rows={7} value={(activeConfig.partnerNames || []).join('\n')} onChange={event => patchConfig({ partnerNames: event.target.value.split('\n').map(value => value.trim()).filter(Boolean) })} placeholder="Один партнёр в строке" className={inputClass()} /></section>}

              {['cases', 'videos', 'testimonials'].includes(activeKind) && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Выбор данных')}<label className="text-xs font-bold text-slate-600">Максимум элементов<input type="number" min={1} max={24} value={editing.config.maxItems || 6} onChange={event => patchConfig({ maxItems: Math.max(1, Number(event.target.value) || 1) }, true)} className={`${inputClass()} mt-1`} /></label></section>}

              {(activeKind === 'cta' || activeKind === 'contact') && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Кнопки')}<div className="grid gap-2 sm:grid-cols-2"><input value={activeConfig.buttonText || ''} onChange={event => patchConfig({ buttonText: event.target.value })} placeholder="Текст кнопки" className={inputClass()} /><input value={editing.config.buttonLink || ''} onChange={event => patchConfig({ buttonLink: event.target.value }, true)} placeholder="Ссылка" className={inputClass()} /></div><div className="grid gap-2 sm:grid-cols-2"><input value={activeConfig.secondaryButtonText || ''} onChange={event => patchConfig({ secondaryButtonText: event.target.value })} placeholder="Вторая кнопка" className={inputClass()} /><input value={editing.config.secondaryButtonLink || ''} onChange={event => patchConfig({ secondaryButtonLink: event.target.value }, true)} placeholder="Ссылка" className={inputClass()} /></div>{activeKind === 'contact' && <div className="flex gap-4 text-xs font-bold text-slate-600"><label><input type="checkbox" checked={editing.config.contactShowPhone !== false} onChange={event => patchConfig({ contactShowPhone: event.target.checked }, true)} /> Телефон</label><label><input type="checkbox" checked={editing.config.contactShowEmail !== false} onChange={event => patchConfig({ contactShowEmail: event.target.checked }, true)} /> Email</label></div>}</section>}

              {activeKind === 'timeline' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Timeline')}<select value={editing.config.timelineOrientation || 'vertical'} onChange={event => patchConfig({ timelineOrientation: event.target.value as 'vertical' | 'horizontal' }, true)} className={inputClass()}><option value="vertical">Вертикальный</option><option value="horizontal">Горизонтальный</option></select>{(activeConfig.timelineItems || []).map((item, index) => <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="grid gap-2 sm:grid-cols-[120px_1fr]"><input value={item.date || ''} onChange={event => { const items = [...(activeConfig.timelineItems || [])]; items[index] = { ...item, date: event.target.value }; patchTimeline(items); }} placeholder="Дата" className={inputClass()} /><input value={item.title} onChange={event => { const items = [...(activeConfig.timelineItems || [])]; items[index] = { ...item, title: event.target.value }; patchTimeline(items); }} placeholder="Заголовок" className={inputClass()} /></div><textarea rows={2} value={item.description || ''} onChange={event => { const items = [...(activeConfig.timelineItems || [])]; items[index] = { ...item, description: event.target.value }; patchTimeline(items); }} placeholder="Описание" className={`${inputClass()} mt-2`} /><input value={item.imageUrl || ''} onChange={event => { const items = [...(activeConfig.timelineItems || [])]; items[index] = { ...item, imageUrl: event.target.value }; patchTimeline(items); }} placeholder="URL изображения (опционально)" className={`${inputClass()} mt-2`} /><button type="button" onClick={() => patchTimeline((activeConfig.timelineItems || []).filter((_, i) => i !== index))} className="mt-2 text-xs font-black text-red-600">Удалить</button></div>)}<button type="button" onClick={() => patchTimeline([...(activeConfig.timelineItems || []), { id: makeId('timeline'), date: '', title: 'Новый этап', description: '' }])} className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-700">+ Этап</button></section>}

              {activeKind === 'downloads' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Файлы для скачивания')}<select value={editing.config.downloadLayout || 'list'} onChange={event => patchConfig({ downloadLayout: event.target.value as 'list' | 'cards' }, true)} className={inputClass()}><option value="list">Список</option><option value="cards">Карточки</option></select>{(activeConfig.downloadItems || []).map((item, index) => <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><input value={item.title} onChange={event => { const items = [...(activeConfig.downloadItems || [])]; items[index] = { ...item, title: event.target.value }; patchDownloads(items); }} placeholder="Название" className={inputClass()} /><textarea rows={2} value={item.description || ''} onChange={event => { const items = [...(activeConfig.downloadItems || [])]; items[index] = { ...item, description: event.target.value }; patchDownloads(items); }} placeholder="Описание" className={`${inputClass()} mt-2`} /><input value={item.url} onChange={event => { const items = [...(activeConfig.downloadItems || [])]; items[index] = { ...item, url: event.target.value }; patchDownloads(items); }} placeholder="URL файла" className={`${inputClass()} mt-2`} /><div className="mt-2 grid gap-2 sm:grid-cols-3"><input value={item.fileName || ''} onChange={event => { const items = [...(activeConfig.downloadItems || [])]; items[index] = { ...item, fileName: event.target.value }; patchDownloads(items); }} placeholder="Имя файла" className={inputClass()} /><input value={item.fileType || ''} onChange={event => { const items = [...(activeConfig.downloadItems || [])]; items[index] = { ...item, fileType: event.target.value }; patchDownloads(items); }} placeholder="PDF / DOCX" className={inputClass()} /><input value={item.fileSize || ''} onChange={event => { const items = [...(activeConfig.downloadItems || [])]; items[index] = { ...item, fileSize: event.target.value }; patchDownloads(items); }} placeholder="12.4 MB" className={inputClass()} /></div><button type="button" onClick={() => patchDownloads((activeConfig.downloadItems || []).filter((_, i) => i !== index))} className="mt-2 text-xs font-black text-red-600">Удалить</button></div>)}<button type="button" onClick={() => patchDownloads([...(activeConfig.downloadItems || []), { id: makeId('download'), title: 'Документ', description: '', url: '', fileName: '', fileType: 'PDF', fileSize: '' }])} className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-700">+ Файл</button></section>}

              {activeKind === 'tabs' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Tabs')}{(activeConfig.tabs || []).map((item, index) => <div key={item.id} className="rounded-xl border border-slate-200 p-3"><input value={item.title} onChange={event => { const items = [...(activeConfig.tabs || [])]; items[index] = { ...item, title: event.target.value }; patchTabs(items); }} placeholder="Название вкладки" className={inputClass()} /><textarea rows={4} value={item.content} onChange={event => { const items = [...(activeConfig.tabs || [])]; items[index] = { ...item, content: event.target.value }; patchTabs(items); }} placeholder="Содержимое" className={`${inputClass()} mt-2`} /><button type="button" onClick={() => patchTabs((activeConfig.tabs || []).filter((_, i) => i !== index))} className="mt-2 text-xs font-black text-red-600">Удалить</button></div>)}<button type="button" onClick={() => patchTabs([...(activeConfig.tabs || []), { id: makeId('tab'), title: 'Новая вкладка', content: '' }])} className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-700">+ Вкладка</button></section>}

              {activeKind === 'table' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Таблица')}<input value={(activeConfig.tableColumns || []).join(' | ')} onChange={event => patchConfig({ tableColumns: event.target.value.split('|').map(value => value.trim()).filter(Boolean) })} placeholder="Колонка 1 | Колонка 2 | Колонка 3" className={inputClass()} />{(activeConfig.tableRows || []).map((row, index) => <div key={row.id} className="rounded-xl border border-slate-200 p-3"><input value={row.cells.join(' | ')} onChange={event => { const rows = [...(activeConfig.tableRows || [])]; rows[index] = { ...row, cells: event.target.value.split('|').map(value => value.trim()) }; patchRows(rows); }} placeholder="Ячейка 1 | Ячейка 2" className={inputClass()} /><button type="button" onClick={() => patchRows((activeConfig.tableRows || []).filter((_, i) => i !== index))} className="mt-2 text-xs font-black text-red-600">Удалить</button></div>)}<button type="button" onClick={() => patchRows([...(activeConfig.tableRows || []), { id: makeId('row'), cells: (activeConfig.tableColumns || []).map(() => '') }])} className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-700">+ Строка</button></section>}

              {activeKind === 'team' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Команда')}<select value={editing.config.teamColumns || 3} onChange={event => patchConfig({ teamColumns: Number(event.target.value) as 2 | 3 | 4 }, true)} className={inputClass()}><option value={2}>2 колонки</option><option value={3}>3 колонки</option><option value={4}>4 колонки</option></select>{(activeConfig.teamItems || []).map((item, index) => <div key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="grid gap-2 sm:grid-cols-2"><input value={item.name} onChange={event => { const items = [...(activeConfig.teamItems || [])]; items[index] = { ...item, name: event.target.value }; patchTeam(items); }} placeholder="Имя" className={inputClass()} /><input value={item.role || ''} onChange={event => { const items = [...(activeConfig.teamItems || [])]; items[index] = { ...item, role: event.target.value }; patchTeam(items); }} placeholder="Роль" className={inputClass()} /></div><textarea rows={2} value={item.bio || ''} onChange={event => { const items = [...(activeConfig.teamItems || [])]; items[index] = { ...item, bio: event.target.value }; patchTeam(items); }} placeholder="Описание" className={`${inputClass()} mt-2`} /><div className="mt-2 grid gap-2 sm:grid-cols-2"><input value={item.imageUrl || ''} onChange={event => { const items = [...(activeConfig.teamItems || [])]; items[index] = { ...item, imageUrl: event.target.value }; patchTeam(items); }} placeholder="URL фото" className={inputClass()} /><input value={item.link || ''} onChange={event => { const items = [...(activeConfig.teamItems || [])]; items[index] = { ...item, link: event.target.value }; patchTeam(items); }} placeholder="Ссылка" className={inputClass()} /></div><button type="button" onClick={() => patchTeam((activeConfig.teamItems || []).filter((_, i) => i !== index))} className="mt-2 text-xs font-black text-red-600">Удалить</button></div>)}<button type="button" onClick={() => patchTeam([...(activeConfig.teamItems || []), { id: makeId('team'), name: 'Имя', role: '', bio: '', imageUrl: '', link: '' }])} className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-700">+ Сотрудник</button></section>}

              {activeKind === 'quote' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Цитата')}<textarea rows={4} value={activeConfig.quoteText || ''} onChange={event => patchConfig({ quoteText: event.target.value })} placeholder="Текст цитаты" className={inputClass()} /><div className="grid gap-2 sm:grid-cols-2"><input value={activeConfig.quoteAuthor || ''} onChange={event => patchConfig({ quoteAuthor: event.target.value })} placeholder="Автор" className={inputClass()} /><input value={activeConfig.quoteRole || ''} onChange={event => patchConfig({ quoteRole: event.target.value })} placeholder="Должность / компания" className={inputClass()} /></div></section>}

              <section className="space-y-3 rounded-2xl border border-slate-200 p-4">{sectionLabel('Размещение и стиль')}<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><select value={editing.page} onChange={event => setEditing(current => current ? { ...current, page: event.target.value as PageBuilderPage | 'all' } : current)} className={inputClass()}>{PAGE_BUILDER_PAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}<option value="all">Весь сайт</option></select><select value={editing.config.builderPlacement || 'after'} onChange={event => patchConfig({ builderPlacement: event.target.value as 'before' | 'inline' | 'after' }, true)} className={inputClass()}><option value="before">До основной страницы</option><option value="inline">Inline slot</option><option value="after">После основной страницы</option></select><select value={editing.config.width || 'normal'} onChange={event => patchConfig({ width: event.target.value as 'narrow' | 'normal' | 'wide' | 'full' }, true)} className={inputClass()}><option value="narrow">Narrow</option><option value="normal">Normal</option><option value="wide">Wide</option><option value="full">Full</option></select><select value={editing.config.spacing || 'normal'} onChange={event => patchConfig({ spacing: event.target.value as 'compact' | 'normal' | 'large' }, true)} className={inputClass()}><option value="compact">Compact</option><option value="normal">Normal</option><option value="large">Large</option></select><select value={editing.config.alignment || 'left'} onChange={event => patchConfig({ alignment: event.target.value as 'left' | 'center' }, true)} className={inputClass()}><option value="left">Слева</option><option value="center">По центру</option></select><select value={editing.config.style || 'light'} onChange={event => patchConfig({ style: event.target.value as 'light' | 'dark' | 'indigo' | 'gradient' }, true)} className={inputClass()}><option value="light">Light</option><option value="dark">Dark</option><option value="indigo">Indigo</option><option value="gradient">Gradient</option></select></div><input value={editing.config.anchor || ''} onChange={event => patchConfig({ anchor: event.target.value }, true)} placeholder="Anchor ID, например services" className={inputClass()} /></section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-3 sm:flex-row"><input value={presetName} onChange={event => setPresetName(event.target.value)} placeholder="Название шаблона" className={inputClass()} /><button type="button" onClick={() => void savePreset()} className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700">Сохранить как шаблон</button></div></section>
            </div>

            <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0"><div className="sticky top-24 space-y-4"><div>{sectionLabel('Draft workflow')}<p className="mt-2 text-xs leading-6 text-slate-500">«Сохранить Draft» не меняет production. Проверьте через Preview Draft и только затем публикуйте страницу.</p></div><button type="button" onClick={() => void saveDraft()} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white disabled:opacity-40"><Save className="h-4 w-4" />Сохранить Draft</button>{previewOpen && previewBlock && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-200 px-3 py-2 text-[10px] font-black uppercase text-slate-500">Предпросмотр {language.toUpperCase()}</div><div className="max-h-[60vh] overflow-auto"><div className="origin-top scale-[0.72]" style={{ width: '138.888%' }}><PageBuilderRenderer block={previewBlock} preview /></div></div></div>}</div></aside>
          </div>
        </div>
      </div>}

      {pickerOpen && <MediaLibraryPicker multiple type="image" title="Добавить изображения в галерею" onClose={() => setPickerOpen(false)} onSelectMany={assets => addGalleryAssets(assets.map(asset => ({ url: asset.url, name: asset.name, publicId: asset.publicId })))} />}
    </div>
  );
}
