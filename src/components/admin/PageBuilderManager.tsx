import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  X,
} from 'lucide-react';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useSiteContent } from '../../context/SiteContentContext';
import { AdminImageField } from './AdminImageField';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { RichTextEditor } from './RichTextEditor';
import { PageBuilderRenderer } from '../page-builder/PageBuilderRenderer';
import {
  PAGE_BUILDER_KINDS,
  PAGE_BUILDER_PAGES,
  asBuilderBlock,
  blockKind,
  blockMatchesPage,
  createBuilderBlock,
  localizedBuilderBlock,
  type BuilderSiteBlock,
  type PageBuilderImage,
  type PageBuilderKind,
  type PageBuilderPage,
  type PageBuilderPreset,
} from '../../lib/pageBuilder';
import type { Locale, SiteBlock } from '../../types';

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'UA' },
  { id: 'ru', label: 'RU' },
  { id: 'en', label: 'EN' },
];

type BuilderPageSelection = PageBuilderPage | 'all';
type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const PREVIEW_WIDTH: Record<PreviewDevice, string> = {
  desktop: '100%', tablet: '768px', mobile: '390px',
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

function kindLabel(kind: PageBuilderKind): string {
  return PAGE_BUILDER_KINDS.find(item => item.id === kind)?.label || kind;
}

function blockPage(block: BuilderSiteBlock): BuilderPageSelection {
  return block.page === 'all' ? 'all' : block.page;
}

export function PageBuilderManager() {
  const { rawSettings, updateSettings } = useSiteContent();
  const [blocks, setBlocks] = useState<BuilderSiteBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<BuilderPageSelection>('home');
  const [editing, setEditing] = useState<BuilderSiteBlock | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerMode, setPickerMode] = useState<'gallery' | null>(null);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [error, setError] = useState('');

  const presets = useMemo(() => {
    const value = (rawSettings as unknown as { pageBuilderPresets?: PageBuilderPreset[] }).pageBuilderPresets;
    return Array.isArray(value) ? value : [];
  }, [rawSettings]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'site_blocks'), snapshot => {
      const next = snapshot.docs
        .map(item => asBuilderBlock({ id: item.id, ...item.data() } as SiteBlock))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setBlocks(next);
      setLoading(false);
    }, err => {
      console.error(err);
      setError(err.message);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const pageBlocks = useMemo(() => {
    if (page === 'all') {
      return blocks.filter(block => block.page === 'all' && block.config.builderScope === 'global').sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return blocks.filter(block => blockMatchesPage(block, page)).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [blocks, page]);

  const nextOrder = () => pageBlocks.length ? Math.max(...pageBlocks.map(block => block.order || 0)) + 10 : 10;

  const createBlock = (kind: PageBuilderKind) => {
    const targetPage: PageBuilderPage = page === 'all' ? 'home' : page;
    const next = createBuilderBlock(kind, targetPage, nextOrder());
    if (page === 'all') {
      next.page = 'all';
      next.config.builderScope = 'global';
      next.config.builderPlacement = 'after';
    }
    setEditing(next);
    setLanguage('uk');
    setPreviewOpen(false);
    setError('');
  };

  const editBlock = (block: BuilderSiteBlock) => {
    setEditing(clone(block));
    setLanguage('uk');
    setPreviewOpen(false);
    setError('');
  };

  const patchRoot = (patch: Partial<BuilderSiteBlock>) => {
    setEditing(current => current ? { ...current, ...patch } : current);
  };

  const patchConfig = (patch: Partial<BuilderSiteBlock['config']>, common = false) => {
    setEditing(current => {
      if (!current) return current;
      if (common || language === 'ru') return { ...current, config: { ...current.config, ...patch } };
      if (language === 'uk') return { ...current, config_uk: { ...(current.config_uk || {}), ...patch } };
      return { ...current, config_en: { ...(current.config_en || {}), ...patch } };
    });
  };

  const patchTitle = (value: string) => {
    setEditing(current => {
      if (!current) return current;
      if (language === 'uk') return { ...current, title_uk: value };
      if (language === 'en') return { ...current, title_en: value };
      return { ...current, title: value };
    });
  };

  const saveEditing = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      const payload: BuilderSiteBlock = {
        ...editing,
        updatedAt: Date.now(),
        page: editing.config.builderScope === 'global' ? 'all' : editing.page === 'all' ? 'home' : editing.page,
      };
      await setDoc(doc(db, 'site_blocks', payload.id), payload);
      setEditing(null);
      setPickerMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteBlock = async (block: BuilderSiteBlock) => {
    if (!window.confirm(`Удалить секцию «${block.title_uk || block.title}»?`)) return;
    await deleteDoc(doc(db, 'site_blocks', block.id));
  };

  const duplicateBlock = async (block: BuilderSiteBlock) => {
    const copy = clone(block);
    copy.id = `builder-copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    copy.title = `${block.title} — copy`;
    copy.title_uk = block.title_uk ? `${block.title_uk} — копія` : undefined;
    copy.title_en = block.title_en ? `${block.title_en} — copy` : undefined;
    copy.order = nextOrder();
    copy.updatedAt = Date.now();
    await setDoc(doc(db, 'site_blocks', copy.id), copy);
  };

  const toggleActive = async (block: BuilderSiteBlock) => {
    await setDoc(doc(db, 'site_blocks', block.id), { isActive: !block.isActive, updatedAt: Date.now() }, { merge: true });
  };

  const persistOrder = async (ordered: BuilderSiteBlock[]) => {
    await Promise.all(ordered.map((block, index) => setDoc(doc(db, 'site_blocks', block.id), { order: (index + 1) * 10, updatedAt: Date.now() }, { merge: true })));
  };

  const dropBlock = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const source = pageBlocks.findIndex(block => block.id === draggedId);
    const target = pageBlocks.findIndex(block => block.id === targetId);
    if (source < 0 || target < 0) return;
    const next = [...pageBlocks];
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    setDraggedId(null);
    await persistOrder(next);
  };

  const savePreset = async () => {
    if (!editing) return;
    const name = presetName.trim() || localizedTitle(editing, language) || kindLabel(blockKind(editing));
    const preset: PageBuilderPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

  const deletePreset = async (id: string) => {
    await updateSettings({ pageBuilderPresets: presets.filter(item => item.id !== id) } as never);
  };

  const addPreset = async (preset: PageBuilderPreset) => {
    const targetPage: PageBuilderPage = page === 'all' ? 'home' : page;
    const block = createBuilderBlock((preset.config.builderKind || preset.type) as PageBuilderKind, targetPage, nextOrder());
    block.type = preset.type;
    block.title = preset.title;
    block.config = clone(preset.config);
    block.config_uk = clone(preset.config_uk || {});
    block.config_en = clone(preset.config_en || {});
    if (page === 'all') { block.page = 'all'; block.config.builderScope = 'global'; }
    else { block.page = page; block.config.builderScope = 'page'; }
    await setDoc(doc(db, 'site_blocks', block.id), block);
  };

  const activeConfig = editing ? localizedConfig(editing, language) : null;
  const activeKind = editing ? blockKind(editing) : null;
  const previewBlock = editing ? localizedBuilderBlock(editing, language) : null;
  const currentPageMeta = PAGE_BUILDER_PAGES.find(item => item.id === page);

  const patchItem = (index: number, patch: Record<string, string>) => {
    if (!activeConfig) return;
    const items = [...(activeConfig.items || [])];
    items[index] = { ...items[index], ...patch };
    patchConfig({ items });
  };

  const addItem = () => patchConfig({ items: [...(activeConfig?.items || []), { title: 'Новый пункт', description: '' }] });
  const removeItem = (index: number) => patchConfig({ items: (activeConfig?.items || []).filter((_, itemIndex) => itemIndex !== index) });

  const addGalleryAssets = (assets: Array<{ url: string; name?: string }>) => {
    if (!editing) return;
    const existing = new Set(editing.config.galleryImages?.map(image => image.url) || []);
    const additions: PageBuilderImage[] = assets.filter(asset => !existing.has(asset.url)).map((asset, index) => ({ id: `pb-image-${Date.now()}-${index}`, url: asset.url, alt: asset.name || '', caption: '' }));
    patchConfig({ galleryImages: [...(editing.config.galleryImages || []), ...additions] }, true);
    setPickerMode(null);
  };

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Загрузка конструктора…</div>;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700"><Layers className="h-3.5 w-3.5" />Unified Page Builder 1.0</div><h2 className="text-2xl font-black text-slate-950">Конструктор страниц</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Структурные секции без произвольного CSS: страницы, drag&drop, локализации, presets и responsive preview. Существующие core-секции страниц остаются безопасно сохранены.</p></div>
          {currentPageMeta && <Link to={currentPageMeta.path} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">Открыть страницу <ExternalLink className="h-4 w-4" /></Link>}
        </div>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap gap-2">
          {PAGE_BUILDER_PAGES.map(item => <button key={item.id} type="button" onClick={() => setPage(item.id)} className={`rounded-xl px-3 py-2 text-xs font-black ${page === item.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item.label}</button>)}
          <button type="button" onClick={() => setPage('all')} className={`rounded-xl px-3 py-2 text-xs font-black ${page === 'all' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Весь сайт</button>
        </div>
      </section>

      <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-300"><Plus className="h-4 w-4" />Добавить секцию</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PAGE_BUILDER_KINDS.map(item => <button key={item.id} type="button" onClick={() => createBlock(item.id)} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 text-left transition hover:border-indigo-500 hover:bg-indigo-500/10"><div className="text-sm font-black text-white">{item.label}</div><div className="mt-1 text-[11px] leading-5 text-slate-400">{item.description}</div></button>)}
        </div>
      </section>

      {presets.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="mb-3 text-xs font-black uppercase tracking-wider text-amber-800">Presets</div>
          <div className="flex flex-wrap gap-2">{presets.map(preset => <div key={preset.id} className="inline-flex items-center overflow-hidden rounded-xl border border-amber-200 bg-white"><button type="button" onClick={() => addPreset(preset)} className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50">+ {preset.name}</button><button type="button" onClick={() => deletePreset(preset.id)} className="border-l border-amber-100 p-2 text-red-400 hover:bg-red-50"><X className="h-3.5 w-3.5" /></button></div>)}</div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1"><h3 className="text-sm font-black text-slate-800">Секции: {pageBlocks.length}</h3><span className="text-[11px] text-slate-400">Перетащите за ⠿ для изменения порядка</span></div>
        {pageBlocks.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">На этой странице пока нет дополнительных секций.</div> : pageBlocks.map((block, index) => (
          <article key={block.id} onDragOver={event => event.preventDefault()} onDrop={() => dropBlock(block.id)} className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center ${draggedId === block.id ? 'border-indigo-400 opacity-60' : 'border-slate-200'} ${!block.isActive ? 'opacity-55' : ''}`}>
            <div draggable onDragStart={() => setDraggedId(block.id)} onDragEnd={() => setDraggedId(null)} className="cursor-grab rounded-xl p-2 text-slate-300 hover:bg-slate-100 hover:text-slate-500"><GripVertical className="h-5 w-5" /></div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">{index + 1}</div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">{kindLabel(blockKind(block))}</span><span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{block.config.builderPlacement || (blockPage(block) === 'home' ? 'inline' : 'after')}</span></div><h4 className="mt-1 truncate text-sm font-black text-slate-900">{block.title_uk || block.title}</h4>{block.config.heading && <p className="mt-0.5 truncate text-xs text-slate-400">{block.config.heading}</p>}</div>
            <div className="flex items-center gap-1 self-end sm:self-auto"><button type="button" onClick={() => toggleActive(block)} className={`rounded-lg p-2 ${block.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>{block.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button type="button" onClick={() => duplicateBlock(block)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Copy className="h-4 w-4" /></button><button type="button" onClick={() => editBlock(block)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => deleteBlock(block)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>
          </article>
        ))}
      </section>

      {editing && activeConfig && activeKind && (
        <div className="fixed inset-0 z-[140] overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-sm sm:p-5" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setEditing(null); }}>
          <div className="mx-auto my-4 max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start gap-4 border-b border-slate-200 p-5 sm:p-6"><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">{kindLabel(activeKind)}</div><h3 className="mt-1 text-xl font-black text-slate-950">{localizedTitle(editing, language) || 'Секция'}</h3></div><button type="button" onClick={() => setEditing(null)} className="ml-auto rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6 p-5 sm:p-6">
                <div className="flex rounded-xl bg-slate-100 p-1">{LANGS.map(item => <button key={item.id} type="button" onClick={() => setLanguage(item.id)} className={`flex-1 rounded-lg py-2 text-xs font-black ${language === item.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{item.label}</button>)}</div>

                <section className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-slate-600 sm:col-span-2">Название секции ({language.toUpperCase()})<input value={localizedTitle(editing, language)} onChange={event => patchTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                  <label className="text-xs font-bold text-slate-600">Страница<select value={editing.config.builderScope === 'global' ? 'all' : editing.page === 'all' ? 'home' : editing.page} onChange={event => { const selected = event.target.value as BuilderPageSelection; setEditing(current => current ? { ...current, page: selected === 'all' ? 'all' : selected, config: { ...current.config, builderScope: selected === 'all' ? 'global' : 'page' } } : current); }} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">{PAGE_BUILDER_PAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}<option value="all">Весь сайт</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Позиция<select value={editing.config.builderPlacement || (editing.page === 'home' ? 'inline' : 'after')} onChange={event => patchConfig({ builderPlacement: event.target.value as BuilderSiteBlock['config']['builderPlacement'] }, true)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="before">До core-контента</option><option value="inline">Inline / штатная точка</option><option value="after">После core-контента</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Ширина<select value={editing.config.width || 'normal'} onChange={event => patchConfig({ width: event.target.value as BuilderSiteBlock['config']['width'] }, true)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="narrow">Narrow</option><option value="normal">Normal</option><option value="wide">Wide</option><option value="full">Full</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Вертикальный ритм<select value={editing.config.spacing || 'normal'} onChange={event => patchConfig({ spacing: event.target.value as BuilderSiteBlock['config']['spacing'] }, true)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="compact">Compact</option><option value="normal">Normal</option><option value="large">Large</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Выравнивание<select value={editing.config.alignment || 'left'} onChange={event => patchConfig({ alignment: event.target.value as BuilderSiteBlock['config']['alignment'] }, true)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="left">Left</option><option value="center">Center</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Фон<select value={editing.config.style || 'light'} onChange={event => patchConfig({ style: event.target.value as BuilderSiteBlock['config']['style'] }, true)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="light">Light</option><option value="dark">Dark</option><option value="indigo">Brand</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Anchor ID<input value={editing.config.anchor || ''} onChange={event => patchConfig({ anchor: event.target.value.replace(/[^a-zA-Z0-9_-]/g, '') }, true)} placeholder="section-name" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
                </section>

                {!['divider', 'spacer', 'testimonials', 'contact'].includes(activeKind) && <section className="grid gap-3"><input value={activeConfig.badge || ''} onChange={event => patchConfig({ badge: event.target.value })} placeholder={`Badge — ${language.toUpperCase()}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input value={activeConfig.heading || ''} onChange={event => patchConfig({ heading: event.target.value })} placeholder={`Заголовок — ${language.toUpperCase()}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" /><textarea rows={2} value={activeConfig.subheading || ''} onChange={event => patchConfig({ subheading: event.target.value })} placeholder={`Подзаголовок — ${language.toUpperCase()}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /></section>}

                {activeKind === 'rich_text' && <RichTextEditor value={activeConfig.richText || activeConfig.content || ''} onChange={richText => patchConfig({ richText })} minHeight={220} />}

                {(activeKind === 'image' || activeKind === 'text_image') && <div className="space-y-3"><AdminImageField label="Изображение" value={editing.config.imageUrl || ''} onChange={imageUrl => patchConfig({ imageUrl }, true)} previewAlt={activeConfig.imageAlt || activeConfig.heading || editing.title} helperText="Загрузка, медиатека или внешний URL." />{activeKind === 'image' && <><input value={activeConfig.imageAlt || ''} onChange={event => patchConfig({ imageAlt: event.target.value })} placeholder={`ALT — ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input value={activeConfig.imageCaption || ''} onChange={event => patchConfig({ imageCaption: event.target.value })} placeholder={`Caption — ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></>}{activeKind === 'text_image' && <><textarea rows={5} value={activeConfig.content || ''} onChange={event => patchConfig({ content: event.target.value })} placeholder="Текст секции" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /><select value={editing.config.imagePosition || 'right'} onChange={event => patchConfig({ imagePosition: event.target.value as 'left' | 'right' }, true)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="right">Фото справа</option><option value="left">Фото слева</option></select></>}</div>}

                {activeKind === 'gallery' && <section className="space-y-3"><div className="flex flex-wrap gap-2"><select value={editing.config.galleryLayout || 'grid'} onChange={event => patchConfig({ galleryLayout: event.target.value as 'grid' | 'masonry' }, true)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="grid">Grid</option><option value="masonry">Masonry</option></select><select value={editing.config.galleryColumns || 3} onChange={event => patchConfig({ galleryColumns: Number(event.target.value) as 2 | 3 | 4 }, true)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value={2}>2 колонки</option><option value={3}>3 колонки</option><option value={4}>4 колонки</option></select><button type="button" onClick={() => setPickerMode('gallery')} className="ml-auto rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">+ Из медиатеки</button></div><div className="grid gap-3 sm:grid-cols-2">{(editing.config.galleryImages || []).map((image, index) => <div key={image.id} className="rounded-xl border border-slate-200 p-3"><img src={image.url} alt="" className="aspect-video w-full rounded-lg object-cover" /><input value={image.alt || ''} onChange={event => { const next = [...(editing.config.galleryImages || [])]; next[index] = { ...image, alt: event.target.value }; patchConfig({ galleryImages: next }, true); }} placeholder="ALT" className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs" /><input value={image.caption || ''} onChange={event => { const next = [...(editing.config.galleryImages || [])]; next[index] = { ...image, caption: event.target.value }; patchConfig({ galleryImages: next }, true); }} placeholder="Caption" className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs" /><button type="button" onClick={() => patchConfig({ galleryImages: (editing.config.galleryImages || []).filter((_, i) => i !== index) }, true)} className="mt-2 text-[11px] font-bold text-red-600">Удалить</button></div>)}</div></section>}

                {activeKind === 'video_embed' && <div className="grid gap-3"><input value={editing.config.videoUrl || ''} onChange={event => patchConfig({ videoUrl: event.target.value }, true)} placeholder="YouTube / Vimeo embed URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input value={activeConfig.videoCaption || ''} onChange={event => patchConfig({ videoCaption: event.target.value })} placeholder={`Подпись — ${language.toUpperCase()}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div>}

                {['features_grid', 'stats_counter', 'process', 'pricing'].includes(activeKind) && <section className="space-y-3"><div className="flex items-center justify-between"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Элементы</div><button type="button" onClick={addItem} className="text-xs font-black text-indigo-600">+ Добавить</button></div>{(activeConfig.items || []).map((item, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[120px_1fr_auto]">{(activeKind === 'stats_counter' || activeKind === 'pricing') && <input value={item.value || ''} onChange={event => patchItem(index, { value: event.target.value })} placeholder={activeKind === 'pricing' ? 'Цена' : 'Значение'} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold" />}<div className="grid gap-2"><input value={item.title} onChange={event => patchItem(index, { title: event.target.value })} placeholder="Название" className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold" /><textarea rows={2} value={item.description || ''} onChange={event => patchItem(index, { description: event.target.value })} placeholder="Описание" className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs" /></div><button type="button" onClick={() => removeItem(index)} className="self-start rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>)}</section>}

                {activeKind === 'faq' && <section className="space-y-3">{(activeConfig.faqItems || []).map((item, index) => <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><input value={item.question} onChange={event => { const next = [...(activeConfig.faqItems || [])]; next[index] = { ...item, question: event.target.value }; patchConfig({ faqItems: next }); }} placeholder="Вопрос" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /><textarea rows={3} value={item.answer} onChange={event => { const next = [...(activeConfig.faqItems || [])]; next[index] = { ...item, answer: event.target.value }; patchConfig({ faqItems: next }); }} placeholder="Ответ" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /><button type="button" onClick={() => patchConfig({ faqItems: (activeConfig.faqItems || []).filter((_, i) => i !== index) })} className="mt-2 text-[11px] font-bold text-red-600">Удалить</button></div>)}<button type="button" onClick={() => patchConfig({ faqItems: [...(activeConfig.faqItems || []), { question: 'Новый вопрос', answer: 'Ответ' }] })} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">+ Вопрос</button></section>}

                {activeKind === 'partners' && <textarea rows={5} value={(editing.config.partnerNames || []).join('\n')} onChange={event => patchConfig({ partnerNames: event.target.value.split('\n').map(value => value.trim()).filter(Boolean) }, true)} placeholder="Один клиент / партнёр на строку" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />}

                {(activeKind === 'cta' || activeKind === 'contact') && <div className="grid gap-3 sm:grid-cols-2"><input value={activeConfig.buttonText || ''} onChange={event => patchConfig({ buttonText: event.target.value })} placeholder={`Текст кнопки — ${language.toUpperCase()}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input value={editing.config.buttonLink || ''} onChange={event => patchConfig({ buttonLink: event.target.value }, true)} placeholder="/contacts или #anchor" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div>}

                {(activeKind === 'cases' || activeKind === 'videos') && <label className="block text-xs font-bold text-slate-600">Количество карточек<input type="number" min={1} max={12} value={editing.config.maxItems || 6} onChange={event => patchConfig({ maxItems: Math.max(1, Math.min(12, Number(event.target.value) || 6)) }, true)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>}

                {activeKind === 'divider' && <select value={editing.config.dividerStyle || 'line'} onChange={event => patchConfig({ dividerStyle: event.target.value as 'line' | 'dots' }, true)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="line">Линия</option><option value="dots">Точки</option></select>}
                {activeKind === 'spacer' && <select value={editing.config.spacerSize || 'medium'} onChange={event => patchConfig({ spacerSize: event.target.value as 'small' | 'medium' | 'large' }, true)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>}

                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="text-xs font-black uppercase tracking-wider text-amber-800">Preset</div><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]"><input value={presetName} onChange={event => setPresetName(event.target.value)} placeholder="Название шаблона" className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm" /><button type="button" onClick={savePreset} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950">Сохранить preset</button></div></section>
              </div>

              <aside className="border-t border-slate-200 bg-slate-50 p-4 lg:border-l lg:border-t-0">
                <div className="sticky top-4">
                  <div className="mb-3 flex items-center gap-2"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Preview</div><div className="ml-auto flex rounded-lg bg-white p-1 shadow-sm"><button type="button" onClick={() => setPreviewDevice('desktop')} className={`rounded p-1.5 ${previewDevice === 'desktop' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><Monitor className="h-4 w-4" /></button><button type="button" onClick={() => setPreviewDevice('tablet')} className={`rounded p-1.5 ${previewDevice === 'tablet' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><Tablet className="h-4 w-4" /></button><button type="button" onClick={() => setPreviewDevice('mobile')} className={`rounded p-1.5 ${previewDevice === 'mobile' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><Smartphone className="h-4 w-4" /></button></div></div>
                  <button type="button" onClick={() => setPreviewOpen(true)} className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-indigo-600">Открыть большой preview</button>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner"><div style={{ width: PREVIEW_WIDTH[previewDevice], maxWidth: '100%', transformOrigin: 'top left' }} className="mx-auto overflow-hidden text-[10px]"><div className="pointer-events-none origin-top-left scale-[0.52]" style={{ width: '192%', marginBottom: '-48%' }}>{previewBlock && <PageBuilderRenderer block={previewBlock} preview />}</div></div></div>
                </div>
              </aside>
            </div>

            <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white/95 p-4 backdrop-blur"><button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Отмена</button><button type="button" onClick={saveEditing} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Сохранение…' : 'Сохранить секцию'}</button></footer>
          </div>
        </div>
      )}

      {editing && pickerMode === 'gallery' && <MediaLibraryPicker type="image" multiple title="Изображения секции" onClose={() => setPickerMode(null)} onSelectMany={assets => addGalleryAssets(assets)} />}

      {previewOpen && previewBlock && (
        <div className="fixed inset-0 z-[160] overflow-auto bg-slate-950/80 p-3 backdrop-blur" onMouseDown={event => { if (event.target === event.currentTarget) setPreviewOpen(false); }}><div className="mx-auto my-5 overflow-hidden rounded-3xl bg-white shadow-2xl" style={{ width: PREVIEW_WIDTH[previewDevice], maxWidth: '96vw' }}><div className="flex items-center border-b border-slate-200 bg-white p-3"><div className="text-xs font-black text-slate-600">{previewDevice} · {language.toUpperCase()}</div><button type="button" onClick={() => setPreviewOpen(false)} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div><PageBuilderRenderer block={previewBlock} preview /></div></div>
      )}
    </div>
  );
}
