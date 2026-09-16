import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
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
  Star,
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
type GalleryTextField = 'alt' | 'caption';

const PREVIEW_WIDTH: Record<PreviewDevice, string> = { desktop: '100%', tablet: '768px', mobile: '390px' };

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

function galleryText(image: PageBuilderImage, field: GalleryTextField, locale: Locale): string {
  if (locale === 'uk') return String(image[`${field}_uk` as keyof PageBuilderImage] || image[field] || '');
  if (locale === 'en') return String(image[`${field}_en` as keyof PageBuilderImage] || image[`${field}_uk` as keyof PageBuilderImage] || image[field] || '');
  return String(image[field] || '');
}

function inputClass(extra = ''): string {
  return `w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${extra}`;
}

function sectionLabel(text: string) {
  return <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{text}</div>;
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
  const [pickerOpen, setPickerOpen] = useState(false);
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

  const visibleBlocks = useMemo(() => {
    if (page === 'all') return blocks.filter(block => block.page === 'all' && block.config.builderScope === 'global').sort((a, b) => (a.order || 0) - (b.order || 0));
    return blocks.filter(block => blockMatchesPage(block, page)).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [blocks, page]);

  const nextOrder = () => visibleBlocks.length ? Math.max(...visibleBlocks.map(block => block.order || 0)) + 10 : 10;

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
      setPickerOpen(false);
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
    const source = visibleBlocks.findIndex(block => block.id === draggedId);
    const target = visibleBlocks.findIndex(block => block.id === targetId);
    if (source < 0 || target < 0) return;
    const next = [...visibleBlocks];
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

  const patchFaq = (index: number, patch: { question?: string; answer?: string }) => {
    if (!activeConfig) return;
    const faqItems = [...(activeConfig.faqItems || [])];
    faqItems[index] = { ...faqItems[index], ...patch };
    patchConfig({ faqItems });
  };

  const addGalleryAssets = (assets: Array<{ url: string; name?: string; publicId?: string }>) => {
    if (!editing) return;
    const existing = new Set(editing.config.galleryImages?.map(image => image.url) || []);
    const additions: PageBuilderImage[] = assets
      .filter(asset => !existing.has(asset.url))
      .map((asset, index) => ({
        id: `pb-image-${Date.now()}-${index}`,
        url: asset.url,
        cloudinaryPublicId: asset.publicId,
        alt: asset.name || '', alt_uk: asset.name || '', alt_en: asset.name || '',
        caption: '', caption_uk: '', caption_en: '',
        featured: false, focalX: 50, focalY: 50,
      }));
    patchConfig({ galleryImages: [...(editing.config.galleryImages || []), ...additions] }, true);
    setPickerOpen(false);
  };

  const patchGalleryText = (index: number, field: GalleryTextField, value: string) => {
    if (!editing) return;
    const images = [...(editing.config.galleryImages || [])];
    const image = images[index];
    if (!image) return;
    const key = language === 'ru' ? field : `${field}_${language}` as 'alt_uk' | 'alt_en' | 'caption_uk' | 'caption_en';
    images[index] = { ...image, [key]: value };
    patchConfig({ galleryImages: images }, true);
  };

  const patchGalleryCommon = (index: number, patch: Partial<PageBuilderImage>) => {
    if (!editing) return;
    const images = [...(editing.config.galleryImages || [])];
    if (!images[index]) return;
    images[index] = { ...images[index], ...patch };
    patchConfig({ galleryImages: images }, true);
  };

  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    if (!editing) return;
    const target = index + direction;
    const images = [...(editing.config.galleryImages || [])];
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    patchConfig({ galleryImages: images }, true);
  };

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Загрузка конструктора…</div>;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700"><Layers className="h-3.5 w-3.5" />Unified Page Builder 1.0</div>
            <h2 className="text-2xl font-black text-slate-950">Конструктор страниц</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Структурные секции без произвольного CSS: drag&drop, локализации, reusable presets, Media Library и responsive preview. Старые core-секции не удаляются.</p>
          </div>
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
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Presets</div>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => <div key={preset.id} className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><button type="button" onClick={() => void addPreset(preset)} className="px-3 py-2 text-xs font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-700">+ {preset.name}</button><button type="button" onClick={() => void deletePreset(preset.id)} className="border-l border-slate-200 px-2 py-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></div>)}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4"><div><div className="text-lg font-black text-slate-950">Секции</div><div className="text-xs text-slate-500">Перетаскивайте карточки для изменения порядка.</div></div><div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{visibleBlocks.length}</div></div>
        <div className="space-y-2">
          {visibleBlocks.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">Для этой страницы пока нет builder-секций.</div>}
          {visibleBlocks.map(block => (
            <div key={block.id} draggable onDragStart={() => setDraggedId(block.id)} onDragEnd={() => setDraggedId(null)} onDragOver={event => event.preventDefault()} onDrop={() => void dropBlock(block.id)} className={`flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center ${block.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-65'}`}>
              <GripVertical className="hidden h-5 w-5 shrink-0 cursor-grab text-slate-300 sm:block" />
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-black text-slate-900">{block.title_uk || block.title}</span><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700">{kindLabel(blockKind(block))}</span>{block.page === 'all' && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase text-white">global</span>}</div><div className="mt-1 text-[11px] text-slate-500">{block.page} · {block.config.builderPlacement || 'inline'} · order {block.order}</div></div>
              <div className="flex flex-wrap gap-1"><button type="button" onClick={() => editBlock(block)} className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => void duplicateBlock(block)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Copy className="h-4 w-4" /></button><button type="button" onClick={() => void toggleActive(block)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">{block.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button type="button" onClick={() => void deleteBlock(block)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>
            </div>
          ))}
        </div>
      </section>

      {editing && activeConfig && activeKind && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null); }}>
          <div className="mx-auto my-3 max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">{kindLabel(activeKind)}</div><div className="mt-1 text-lg font-black text-slate-950">Редактор секции</div></div>
              <div className="flex items-center gap-2"><button type="button" onClick={() => setPreviewOpen(value => !value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">Preview</button><button type="button" onClick={() => setEditing(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-6 p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">{LANGS.map(item => <button key={item.id} type="button" onClick={() => setLanguage(item.id)} className={`rounded-xl px-3 py-2 text-xs font-black ${language === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{item.label}</button>)}</div>

                <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
                  {sectionLabel('Тексты')}
                  <input value={localizedTitle(editing, language)} onChange={event => patchTitle(event.target.value)} placeholder="Внутреннее название секции" className={inputClass()} />
                  <div className="grid gap-3 sm:grid-cols-2"><input value={activeConfig.badge || ''} onChange={event => patchConfig({ badge: event.target.value })} placeholder={`Badge — ${language.toUpperCase()}`} className={inputClass()} /><input value={activeConfig.heading || ''} onChange={event => patchConfig({ heading: event.target.value })} placeholder={`Заголовок — ${language.toUpperCase()}`} className={inputClass()} /></div>
                  <textarea rows={3} value={activeConfig.subheading || ''} onChange={event => patchConfig({ subheading: event.target.value })} placeholder={`Подзаголовок — ${language.toUpperCase()}`} className={inputClass()} />
                </section>

                {activeKind === 'rich_text' && <section className="rounded-2xl border border-slate-200 p-4"><RichTextEditor value={activeConfig.richText || activeConfig.content || ''} onChange={richText => patchConfig({ richText })} minHeight={240} /></section>}

                {(activeKind === 'image' || activeKind === 'text_image') && (
                  <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
                    {sectionLabel('Изображение')}
                    <AdminImageField label="Изображение" value={editing.config.imageUrl || ''} onChange={imageUrl => patchConfig({ imageUrl }, true)} previewAlt={activeConfig.imageAlt || activeConfig.heading || editing.title} helperText="Загрузка, медиатека или внешний URL." />
                    {activeKind === 'image' && <><input value={activeConfig.imageAlt || ''} onChange={event => patchConfig({ imageAlt: event.target.value })} placeholder={`ALT — ${language.toUpperCase()}`} className={inputClass()} /><input value={activeConfig.imageCaption || ''} onChange={event => patchConfig({ imageCaption: event.target.value })} placeholder={`Caption — ${language.toUpperCase()}`} className={inputClass()} /></>}
                    {activeKind === 'text_image' && <><textarea rows={5} value={activeConfig.content || ''} onChange={event => patchConfig({ content: event.target.value })} placeholder="Текст секции" className={inputClass()} /><select value={editing.config.imagePosition || 'right'} onChange={event => patchConfig({ imagePosition: event.target.value as 'left' | 'right' }, true)} className={inputClass()}><option value="right">Фото справа</option><option value="left">Фото слева</option></select></>}
                  </section>
                )}

                {activeKind === 'gallery' && (
                  <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">{sectionLabel('Gallery Layout 2.0')}<button type="button" onClick={() => setPickerOpen(true)} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">+ Из медиатеки</button></div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <label className="text-xs font-bold text-slate-600">Layout<select value={editing.config.galleryLayout || 'masonry'} onChange={event => patchConfig({ galleryLayout: event.target.value as NonNullable<BuilderSiteBlock['config']['galleryLayout']> }, true)} className={`mt-1 ${inputClass()}`}><option value="masonry">Masonry</option><option value="grid">Grid</option><option value="justified">Justified</option><option value="cinematic">Cinematic</option></select></label>
                      <label className="text-xs font-bold text-slate-600">Колонки<select value={editing.config.galleryColumns || 3} onChange={event => patchConfig({ galleryColumns: Number(event.target.value) as 2 | 3 | 4 }, true)} className={`mt-1 ${inputClass()}`}><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label>
                      <label className="text-xs font-bold text-slate-600">Gap<select value={editing.config.galleryGap || 'medium'} onChange={event => patchConfig({ galleryGap: event.target.value as NonNullable<BuilderSiteBlock['config']['galleryGap']> }, true)} className={`mt-1 ${inputClass()}`}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
                      <label className="text-xs font-bold text-slate-600">Aspect<select value={editing.config.galleryAspect || 'original'} onChange={event => patchConfig({ galleryAspect: event.target.value as NonNullable<BuilderSiteBlock['config']['galleryAspect']> }, true)} className={`mt-1 ${inputClass()}`}><option value="original">Original</option><option value="4:3">4:3</option><option value="3:2">3:2</option><option value="1:1">1:1</option></select></label>
                      <label className="text-xs font-bold text-slate-600">Captions<select value={editing.config.galleryCaptionMode || 'always'} onChange={event => patchConfig({ galleryCaptionMode: event.target.value as NonNullable<BuilderSiteBlock['config']['galleryCaptionMode']> }, true)} className={`mt-1 ${inputClass()}`}><option value="always">Always</option><option value="hover">Hover</option><option value="lightbox">Lightbox</option></select></label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {(editing.config.galleryImages || []).map((image, index) => (
                        <article key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          <div className="relative aspect-video overflow-hidden bg-slate-900"><img src={image.url} alt="" className="h-full w-full object-cover" style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }} />{image.featured && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black text-slate-950"><Star className="h-3 w-3 fill-current" />Featured</span>}</div>
                          <div className="space-y-2 p-3"><input value={galleryText(image, 'alt', language)} onChange={event => patchGalleryText(index, 'alt', event.target.value)} placeholder={`ALT — ${language.toUpperCase()}`} className={inputClass('text-xs')} /><input value={galleryText(image, 'caption', language)} onChange={event => patchGalleryText(index, 'caption', event.target.value)} placeholder={`Caption — ${language.toUpperCase()}`} className={inputClass('text-xs')} /><label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={image.featured === true} onChange={event => patchGalleryCommon(index, { featured: event.target.checked })} />Featured frame</label><div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-bold text-slate-500">Focal X<input type="range" min={0} max={100} value={image.focalX ?? 50} onChange={event => patchGalleryCommon(index, { focalX: Number(event.target.value) })} className="w-full" /></label><label className="text-[10px] font-bold text-slate-500">Focal Y<input type="range" min={0} max={100} value={image.focalY ?? 50} onChange={event => patchGalleryCommon(index, { focalY: Number(event.target.value) })} className="w-full" /></label></div><div className="flex items-center justify-between"><div className="flex gap-1"><button type="button" disabled={index === 0} onClick={() => moveGalleryImage(index, -1)} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" disabled={index === (editing.config.galleryImages || []).length - 1} onClick={() => moveGalleryImage(index, 1)} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button></div><button type="button" onClick={() => patchConfig({ galleryImages: (editing.config.galleryImages || []).filter((_, i) => i !== index) }, true)} className="rounded-lg px-2 py-1.5 text-[11px] font-black text-red-600 hover:bg-red-50">Удалить</button></div></div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {activeKind === 'video_embed' && <section className="grid gap-3 rounded-2xl border border-slate-200 p-4"><input value={editing.config.videoUrl || ''} onChange={event => patchConfig({ videoUrl: event.target.value }, true)} placeholder="YouTube / Vimeo embed URL" className={inputClass()} /><input value={activeConfig.videoCaption || ''} onChange={event => patchConfig({ videoCaption: event.target.value })} placeholder={`Подпись — ${language.toUpperCase()}`} className={inputClass()} /></section>}

                {['features_grid', 'stats_counter', 'process', 'pricing'].includes(activeKind) && <section className="space-y-3 rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between">{sectionLabel('Элементы')}<button type="button" onClick={addItem} className="text-xs font-black text-indigo-600">+ Добавить</button></div>{(activeConfig.items || []).map((item, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[120px_1fr_auto]">{(activeKind === 'stats_counter' || activeKind === 'pricing') && <input value={item.value || ''} onChange={event => patchItem(index, { value: event.target.value })} placeholder={activeKind === 'pricing' ? 'Цена' : 'Значение'} className={inputClass('text-xs font-bold')} />}<div className="grid gap-2"><input value={item.title} onChange={event => patchItem(index, { title: event.target.value })} placeholder="Название" className={inputClass('text-xs font-bold')} /><textarea rows={2} value={item.description || ''} onChange={event => patchItem(index, { description: event.target.value })} placeholder="Описание" className={inputClass('text-xs')} /></div><button type="button" onClick={() => removeItem(index)} className="self-start rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>)}</section>}

                {activeKind === 'faq' && <section className="space-y-3 rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between">{sectionLabel('FAQ')}<button type="button" onClick={() => patchConfig({ faqItems: [...(activeConfig.faqItems || []), { question: 'Вопрос', answer: 'Ответ' }] })} className="text-xs font-black text-indigo-600">+ Вопрос</button></div>{(activeConfig.faqItems || []).map((item, index) => <div key={index} className="space-y-2 rounded-xl bg-slate-50 p-3"><input value={item.question} onChange={event => patchFaq(index, { question: event.target.value })} className={inputClass('font-bold')} /><textarea rows={3} value={item.answer} onChange={event => patchFaq(index, { answer: event.target.value })} className={inputClass()} /><button type="button" onClick={() => patchConfig({ faqItems: (activeConfig.faqItems || []).filter((_, i) => i !== index) })} className="text-xs font-black text-red-600">Удалить</button></div>)}</section>}

                {activeKind === 'partners' && <section className="rounded-2xl border border-slate-200 p-4"><textarea rows={6} value={(activeConfig.partnerNames || []).join('\n')} onChange={event => patchConfig({ partnerNames: event.target.value.split('\n').map(value => value.trim()).filter(Boolean) })} placeholder="Один клиент / партнёр на строку" className={inputClass()} /></section>}

                {(activeKind === 'cta' || activeKind === 'contact') && <section className="space-y-3 rounded-2xl border border-slate-200 p-4"><div className="grid gap-3 sm:grid-cols-2"><input value={activeConfig.buttonText || ''} onChange={event => patchConfig({ buttonText: event.target.value })} placeholder={`Основная кнопка — ${language.toUpperCase()}`} className={inputClass()} /><input value={editing.config.buttonLink || ''} onChange={event => patchConfig({ buttonLink: event.target.value }, true)} placeholder="/contacts или URL" className={inputClass()} /><input value={activeConfig.secondaryButtonText || ''} onChange={event => patchConfig({ secondaryButtonText: event.target.value })} placeholder={`Вторая кнопка — ${language.toUpperCase()}`} className={inputClass()} /><input value={editing.config.secondaryButtonLink || ''} onChange={event => patchConfig({ secondaryButtonLink: event.target.value }, true)} placeholder="URL второй кнопки" className={inputClass()} /></div>{activeKind === 'contact' && <><textarea rows={2} value={activeConfig.contactNote || ''} onChange={event => patchConfig({ contactNote: event.target.value })} placeholder={`Дополнительная строка — ${language.toUpperCase()}`} className={inputClass()} /><div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600"><label className="flex items-center gap-2"><input type="checkbox" checked={editing.config.contactShowPhone !== false} onChange={event => patchConfig({ contactShowPhone: event.target.checked }, true)} />Показывать телефон</label><label className="flex items-center gap-2"><input type="checkbox" checked={editing.config.contactShowEmail !== false} onChange={event => patchConfig({ contactShowEmail: event.target.checked }, true)} />Показывать email</label></div></>}</section>}

                {(activeKind === 'cases' || activeKind === 'videos') && <label className="block rounded-2xl border border-slate-200 p-4 text-xs font-bold text-slate-600">Количество карточек<input type="number" min={1} max={12} value={editing.config.maxItems || 6} onChange={event => patchConfig({ maxItems: Math.max(1, Math.min(12, Number(event.target.value) || 6)) }, true)} className={`mt-2 ${inputClass()}`} /></label>}
                {activeKind === 'divider' && <select value={editing.config.dividerStyle || 'line'} onChange={event => patchConfig({ dividerStyle: event.target.value as 'line' | 'dots' }, true)} className={inputClass()}><option value="line">Линия</option><option value="dots">Точки</option></select>}
                {activeKind === 'spacer' && <select value={editing.config.spacerSize || 'medium'} onChange={event => patchConfig({ spacerSize: event.target.value as 'small' | 'medium' | 'large' }, true)} className={inputClass()}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>}
              </div>

              <aside className="space-y-5 border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0 sm:p-6">
                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">{sectionLabel('Layout')}<label className="block text-xs font-bold text-slate-600">Scope<select value={editing.config.builderScope || 'page'} onChange={event => { const scope = event.target.value as 'page' | 'global'; setEditing(current => current ? { ...current, page: scope === 'global' ? 'all' : current.page === 'all' ? (page === 'all' ? 'home' : page) : current.page, config: { ...current.config, builderScope: scope } } : current); }} className={`mt-1 ${inputClass()}`}><option value="page">Текущая страница</option><option value="global">Весь сайт</option></select></label>{editing.config.builderScope !== 'global' && <label className="block text-xs font-bold text-slate-600">Страница<select value={editing.page === 'all' ? 'home' : editing.page} onChange={event => setEditing(current => current ? { ...current, page: event.target.value as PageBuilderPage } : current)} className={`mt-1 ${inputClass()}`}>{PAGE_BUILDER_PAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}<label className="block text-xs font-bold text-slate-600">Позиция<select value={editing.config.builderPlacement || 'after'} onChange={event => patchConfig({ builderPlacement: event.target.value as 'before' | 'inline' | 'after' }, true)} className={`mt-1 ${inputClass()}`}><option value="before">До core-контента</option><option value="inline">Inline slot</option><option value="after">После core-контента</option></select></label><div className="grid grid-cols-2 gap-2"><select value={editing.config.width || 'normal'} onChange={event => patchConfig({ width: event.target.value as NonNullable<BuilderSiteBlock['config']['width']> }, true)} className={inputClass()}><option value="narrow">Narrow</option><option value="normal">Normal</option><option value="wide">Wide</option><option value="full">Full</option></select><select value={editing.config.spacing || 'normal'} onChange={event => patchConfig({ spacing: event.target.value as NonNullable<BuilderSiteBlock['config']['spacing']> }, true)} className={inputClass()}><option value="compact">Compact</option><option value="normal">Normal</option><option value="large">Large</option></select><select value={editing.config.alignment || 'left'} onChange={event => patchConfig({ alignment: event.target.value as 'left' | 'center' }, true)} className={inputClass()}><option value="left">Left</option><option value="center">Center</option></select><select value={editing.config.style || 'light'} onChange={event => patchConfig({ style: event.target.value as NonNullable<BuilderSiteBlock['config']['style']> }, true)} className={inputClass()}><option value="light">Light</option><option value="dark">Dark</option><option value="indigo">Indigo</option><option value="gradient">Gradient</option></select></div><input value={editing.config.anchor || ''} onChange={event => patchConfig({ anchor: event.target.value.replace(/^#/, '').replace(/\s+/g, '-') }, true)} placeholder="anchor-id" className={inputClass()} /></section>

                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">{sectionLabel('Preset')}<input value={presetName} onChange={event => setPresetName(event.target.value)} placeholder="Название preset" className={inputClass()} /><button type="button" onClick={() => void savePreset()} className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-100">Сохранить как preset</button></section>

                <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">{sectionLabel('Preview')}<div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => setPreviewDevice('desktop')} className={`rounded-xl p-2 ${previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Monitor className="mx-auto h-4 w-4" /></button><button type="button" onClick={() => setPreviewDevice('tablet')} className={`rounded-xl p-2 ${previewDevice === 'tablet' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Tablet className="mx-auto h-4 w-4" /></button><button type="button" onClick={() => setPreviewDevice('mobile')} className={`rounded-xl p-2 ${previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Smartphone className="mx-auto h-4 w-4" /></button></div><button type="button" onClick={() => setPreviewOpen(value => !value)} className="w-full rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-black text-white">{previewOpen ? 'Скрыть preview' : 'Показать preview'}</button></section>

                <button type="button" disabled={saving} onClick={() => void saveEditing()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Сохранение…' : 'Сохранить секцию'}</button>
              </aside>
            </div>

            {previewOpen && previewBlock && <div className="border-t border-slate-200 bg-slate-100 p-4 sm:p-6"><div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Responsive preview · {previewDevice}</div><div className="mx-auto overflow-hidden rounded-2xl bg-white shadow-xl transition-all" style={{ width: PREVIEW_WIDTH[previewDevice], maxWidth: '100%' }}><PageBuilderRenderer block={previewBlock} preview /></div></div>}
          </div>
        </div>
      )}

      {pickerOpen && <MediaLibraryPicker type="image" multiple onClose={() => setPickerOpen(false)} onSelectMany={assets => addGalleryAssets(assets)} title="Добавить изображения в Page Builder Gallery" />}
    </div>
  );
}
