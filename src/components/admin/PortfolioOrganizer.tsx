import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs } from 'firebase/firestore';
import {
  Briefcase,
  CheckCircle2,
  Eye,
  ExternalLink,
  Film,
  GripVertical,
  Images,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Tags,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { versionedSetDoc as setDoc } from '../../lib/cmsVersioning';
import { slugifyCase } from '../../lib/caseMedia';
import { isPhotoGallery } from '../../lib/galleryContent';
import { isVideoProject } from '../../lib/videoPortfolio';
import {
  PORTFOLIO_CATEGORIES,
  getPortfolioCategoryLabel,
  taxonomyForValue,
  type PortfolioCategoryId,
} from '../../lib/portfolioTaxonomy';

const LOCAL_DRAFT_KEY = 'dneprfilm:portfolio-organizer:draft:v1';

type EntityType = 'case' | 'gallery' | 'video';
type EntityFilter = EntityType | 'all';
type PublishFilter = 'all' | 'published' | 'draft';

interface OrganizerItem {
  key: string;
  type: EntityType;
  id: string;
  title: string;
  subtitle: string;
  previewUrl: string;
  path: string;
  published: boolean;
  order: number;
  taxonomy: {
    category: PortfolioCategoryId;
    tags: string[];
  };
}

interface LocalPatch {
  published: boolean;
  order: number;
  taxonomy: OrganizerItem['taxonomy'];
}

function titleFor(data: Record<string, unknown>, fallback: string): string {
  return String(data.title_uk || data.title || data.title_en || fallback);
}

function entityPath(type: EntityType, data: Record<string, unknown>, id: string): string {
  const source = String(data.slug || data.title_uk || data.title || data.title_en || id);
  const slug = slugifyCase(source) || id;
  if (type === 'case') return `/cases/${slug}`;
  if (type === 'gallery') return `/galleries/${slug}`;
  return `/videos/${slug}`;
}

function firstMediaUrl(value: unknown, preferredKey: 'url' | 'posterUrl' = 'url'): string {
  if (!Array.isArray(value)) return '';
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const candidate = String(record[preferredKey] || record.url || '');
    if (candidate) return candidate;
  }
  return '';
}

function normalizeItem(type: EntityType, id: string, data: Record<string, unknown>): OrganizerItem {
  const title = titleFor(data, id);
  const previewUrl = type === 'case'
    ? String(data.imageUrl || firstMediaUrl(data.media) || '')
    : type === 'gallery'
      ? String(data.coverUrl || firstMediaUrl(data.images) || '')
      : String(data.coverUrl || firstMediaUrl(data.videos, 'posterUrl') || '');

  const subtitle = type === 'case'
    ? String(data.client || data.categoryLabel_uk || data.category || '')
    : type === 'gallery'
      ? String(data.location_uk || data.location || data.date || '')
      : String(data.client_uk || data.client || data.category_uk || data.category || '');

  const orderValue = type === 'case' ? data.featuredOrder : data.order;
  const order = Number.isFinite(Number(orderValue)) ? Number(orderValue) : 9999;

  return {
    key: `${type}:${id}`,
    type,
    id,
    title,
    subtitle,
    previewUrl,
    path: entityPath(type, data, id),
    published: data.published !== false,
    order,
    taxonomy: taxonomyForValue(data),
  };
}

function fingerprint(item: OrganizerItem): string {
  return JSON.stringify({
    published: item.published,
    order: item.order,
    taxonomy: item.taxonomy,
  });
}

function typeLabel(type: EntityType): string {
  if (type === 'case') return 'Кейс';
  if (type === 'gallery') return 'Галерея';
  return 'Видео';
}

function TypeIcon({ type }: { type: EntityType }) {
  if (type === 'case') return <Briefcase className="h-4 w-4" />;
  if (type === 'gallery') return <Images className="h-4 w-4" />;
  return <Film className="h-4 w-4" />;
}

export function PortfolioOrganizer() {
  const [items, setItems] = useState<OrganizerItem[]>([]);
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityFilter>('all');
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<PortfolioCategoryId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [bulkCategory, setBulkCategory] = useState<PortfolioCategoryId>('other');
  const [bulkTags, setBulkTags] = useState('');
  const [draggedKey, setDraggedKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [caseSnapshot, settingsSnapshot] = await Promise.all([
        getDocs(collection(db, 'cases')),
        getDocs(collection(db, 'site_settings')),
      ]);

      const loaded: OrganizerItem[] = caseSnapshot.docs.map(item => normalizeItem('case', item.id, item.data()));
      for (const item of settingsSnapshot.docs) {
        const data = { id: item.id, ...item.data() };
        if (isPhotoGallery(data)) loaded.push(normalizeItem('gallery', item.id, data));
        else if (isVideoProject(data)) loaded.push(normalizeItem('video', item.id, data));
      }

      loaded.sort((a, b) => a.type.localeCompare(b.type) || a.order - b.order || a.title.localeCompare(b.title));
      const nextBaseline = Object.fromEntries(loaded.map(item => [item.key, fingerprint(item)]));

      let merged = loaded;
      try {
        const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
        if (raw) {
          const patches = JSON.parse(raw) as Record<string, LocalPatch>;
          merged = loaded.map(item => patches[item.key]
            ? { ...item, ...patches[item.key], taxonomy: patches[item.key].taxonomy || item.taxonomy }
            : item);
        }
      } catch (draftError) {
        console.warn('Could not restore portfolio organizer draft:', draftError);
      }

      setBaseline(nextBaseline);
      setItems(merged);
      setFocusedKey(current => current && merged.some(item => item.key === current) ? current : merged[0]?.key || null);
      setSelected(new Set());
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const dirtyKeys = useMemo(
    () => new Set(items.filter(item => baseline[item.key] !== fingerprint(item)).map(item => item.key)),
    [items, baseline],
  );

  useEffect(() => {
    if (loading) return;
    if (dirtyKeys.size === 0) {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
      return;
    }
    const patches: Record<string, LocalPatch> = {};
    for (const item of items) {
      if (!dirtyKeys.has(item.key)) continue;
      patches[item.key] = {
        published: item.published,
        order: item.order,
        taxonomy: item.taxonomy,
      };
    }
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(patches));
  }, [items, dirtyKeys, loading]);

  useEffect(() => {
    if (dirtyKeys.size === 0) return undefined;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyKeys.size]);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items
      .filter(item => typeFilter === 'all' || item.type === typeFilter)
      .filter(item => publishFilter === 'all' || (publishFilter === 'published' ? item.published : !item.published))
      .filter(item => categoryFilter === 'all' || item.taxonomy.category === categoryFilter)
      .filter(item => !normalizedQuery || [item.title, item.subtitle, item.id, ...item.taxonomy.tags].join(' ').toLowerCase().includes(normalizedQuery))
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  }, [items, typeFilter, publishFilter, categoryFilter, query]);

  const focused = items.find(item => item.key === focusedKey) || null;

  const updateItem = (key: string, patch: Partial<OrganizerItem>) => {
    setItems(current => current.map(item => item.key === key ? { ...item, ...patch } : item));
  };

  const toggleSelection = (key: string) => {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectVisible = () => {
    setSelected(current => {
      const allSelected = visible.length > 0 && visible.every(item => current.has(item.key));
      const next = new Set(current);
      for (const item of visible) {
        if (allSelected) next.delete(item.key);
        else next.add(item.key);
      }
      return next;
    });
  };

  const patchSelected = (updater: (item: OrganizerItem) => OrganizerItem) => {
    if (selected.size === 0) return;
    setItems(current => current.map(item => selected.has(item.key) ? updater(item) : item));
  };

  const applyBulkTags = () => {
    const tags = bulkTags.split(',').map(item => item.trim()).filter(Boolean);
    if (!tags.length) return;
    patchSelected(item => ({
      ...item,
      taxonomy: {
        ...item.taxonomy,
        tags: Array.from(new Set([...item.taxonomy.tags, ...tags])),
      },
    }));
    setBulkTags('');
  };

  const reorder = (targetKey: string) => {
    if (!draggedKey || draggedKey === targetKey) return;
    const source = items.find(item => item.key === draggedKey);
    const target = items.find(item => item.key === targetKey);
    if (!source || !target || source.type !== target.type) return;

    const sameType = items.filter(item => item.type === source.type).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
    const from = sameType.findIndex(item => item.key === source.key);
    const to = sameType.findIndex(item => item.key === target.key);
    if (from < 0 || to < 0) return;
    const [moved] = sameType.splice(from, 1);
    sameType.splice(to, 0, moved);
    const nextOrder = new Map(sameType.map((item, index) => [item.key, (index + 1) * 10]));
    setItems(current => current.map(item => nextOrder.has(item.key) ? { ...item, order: nextOrder.get(item.key)! } : item));
    setDraggedKey(null);
  };

  const saveChanges = async () => {
    if (dirtyKeys.size === 0) return;
    setSaving(true);
    setError('');
    try {
      const now = Date.now();
      const writes = [];
      for (const item of items) {
        if (!dirtyKeys.has(item.key)) continue;
        const collectionName = item.type === 'case' ? 'cases' : 'site_settings';
        const orderField = item.type === 'case' ? { featuredOrder: item.order } : { order: item.order };
        writes.push(setDoc(doc(db, collectionName, item.id), {
          ...orderField,
          published: item.published,
          taxonomy: item.taxonomy,
          updatedAt: now,
        }, { merge: true }));
      }
      await Promise.all(writes);
      setBaseline(Object.fromEntries(items.map(item => [item.key, fingerprint(item)])));
      localStorage.removeItem(LOCAL_DRAFT_KEY);
      setSelected(new Set());
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  };

  const discardDraft = async () => {
    if (dirtyKeys.size > 0 && !window.confirm('Отменить локальные изменения организатора?')) return;
    localStorage.removeItem(LOCAL_DRAFT_KEY);
    await load();
  };

  if (loading) {
    return <div className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Portfolio Organizer</div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Организатор портфолио</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Единое управление кейсами, галереями и видеопроектами: порядок, публикация, категории и теги. Незаписанные изменения автоматически сохраняются локально в браузере.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void discardDraft()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RotateCcw className="h-4 w-4" />Отменить локальные</button>
            <button type="button" onClick={() => void saveChanges()} disabled={saving || dirtyKeys.size === 0} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Сохранить {dirtyKeys.size ? `(${dirtyKeys.size})` : ''}</button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-600">Всего: {items.length}</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">Опубликовано: {items.filter(item => item.published).length}</span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 font-bold text-amber-700">Черновики: {items.filter(item => !item.published).length}</span>
          {dirtyKeys.size > 0 && <span className="rounded-full bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700">Локальный autosave: {dirtyKeys.size} изменений</span>}
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[auto_auto_auto_minmax(220px,1fr)]">
          <select value={typeFilter} onChange={event => setTypeFilter(event.target.value as EntityFilter)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700">
            <option value="all">Все типы</option><option value="case">Кейсы</option><option value="gallery">Галереи</option><option value="video">Видео</option>
          </select>
          <select value={publishFilter} onChange={event => setPublishFilter(event.target.value as PublishFilter)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700">
            <option value="all">Любой статус</option><option value="published">Опубликованные</option><option value="draft">Черновики</option>
          </select>
          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value as PortfolioCategoryId | 'all')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700">
            <option value="all">Все категории</option>{PORTFOLIO_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.ru}</option>)}
          </select>
          <div className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Название, клиент, тег, ID…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white" /></div>
        </div>
      </section>

      <section className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={selectVisible} className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700">{visible.length > 0 && visible.every(item => selected.has(item.key)) ? 'Снять видимые' : 'Выбрать видимые'}</button>
          <span className="text-xs font-bold text-slate-500">Выбрано: {selected.size}</span>
          <button type="button" disabled={!selected.size} onClick={() => patchSelected(item => ({ ...item, published: true }))} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Опубликовать</button>
          <button type="button" disabled={!selected.size} onClick={() => patchSelected(item => ({ ...item, published: false }))} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">В черновики</button>
          <select value={bulkCategory} onChange={event => setBulkCategory(event.target.value as PortfolioCategoryId)} className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">{PORTFOLIO_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.ru}</option>)}</select>
          <button type="button" disabled={!selected.size} onClick={() => patchSelected(item => ({ ...item, taxonomy: { ...item.taxonomy, category: bulkCategory } }))} className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 disabled:opacity-40">Применить категорию</button>
          <div className="flex min-w-[260px] flex-1 gap-2"><input value={bulkTags} onChange={event => setBulkTags(event.target.value)} placeholder="Добавить теги через запятую" className="min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs" /><button type="button" disabled={!selected.size || !bulkTags.trim()} onClick={applyBulkTags} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 disabled:opacity-40"><Tags className="h-3.5 w-3.5" />Добавить</button></div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {visible.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">Ничего не найдено.</div>}
          {visible.map(item => (
            <article
              key={item.key}
              draggable
              onDragStart={() => setDraggedKey(item.key)}
              onDragEnd={() => setDraggedKey(null)}
              onDragOver={event => event.preventDefault()}
              onDrop={() => reorder(item.key)}
              onClick={() => setFocusedKey(item.key)}
              className={`grid cursor-pointer gap-3 rounded-2xl border bg-white p-3 shadow-sm transition sm:grid-cols-[auto_120px_minmax(0,1fr)_auto] sm:items-center ${focusedKey === item.key ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2"><input type="checkbox" checked={selected.has(item.key)} onChange={() => toggleSelection(item.key)} onClick={event => event.stopPropagation()} className="h-4 w-4" /><GripVertical className="h-4 w-4 text-slate-300" /></div>
              <div className="overflow-hidden rounded-xl bg-slate-100">{item.previewUrl ? <img src={item.previewUrl} alt="" className="aspect-video h-full w-full object-cover" loading="lazy" /> : <div className="flex aspect-video items-center justify-center text-slate-300"><TypeIcon type={item.type} /></div>}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500"><TypeIcon type={item.type} />{typeLabel(item.type)}</span><span className={`rounded px-2 py-1 text-[10px] font-black ${item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.published ? 'PUBLIC' : 'DRAFT'}</span>{dirtyKeys.has(item.key) && <span className="rounded bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">UNSAVED</span>}</div>
                <h3 className="mt-1 truncate text-sm font-black text-slate-950">{item.title}</h3>
                <div className="mt-1 truncate text-xs text-slate-500">{item.subtitle || item.id}</div>
                <div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">{getPortfolioCategoryLabel(item.taxonomy.category, 'ru')}</span>{item.taxonomy.tags.slice(0, 4).map(tag => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{tag}</span>)}</div>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-black text-slate-500">#{item.order}</span><button type="button" onClick={event => { event.stopPropagation(); updateItem(item.key, { published: !item.published }); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600">{item.published ? 'Скрыть' : 'Опубликовать'}</button></div>
            </article>
          ))}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400"><Eye className="h-4 w-4" />Предпросмотр</div>
            {focused ? (
              <div className="mt-4">
                <div className="overflow-hidden rounded-2xl bg-slate-100">{focused.previewUrl ? <img src={focused.previewUrl} alt="" className="aspect-video w-full object-cover" /> : <div className="flex aspect-video items-center justify-center text-slate-300"><TypeIcon type={focused.type} /></div>}</div>
                <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700">{getPortfolioCategoryLabel(focused.taxonomy.category, 'ru')}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${focused.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{focused.published ? 'Опубликован' : 'Черновик'}</span></div>
                <h3 className="mt-3 text-xl font-black text-slate-950">{focused.title}</h3>
                {focused.subtitle && <p className="mt-1 text-sm text-slate-500">{focused.subtitle}</p>}
                <div className="mt-4 flex flex-wrap gap-1.5">{focused.taxonomy.tags.map(tag => <span key={tag} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{tag}</span>)}</div>
                <label className="mt-5 block text-xs font-bold text-slate-600">Категория<select value={focused.taxonomy.category} onChange={event => updateItem(focused.key, { taxonomy: { ...focused.taxonomy, category: event.target.value as PortfolioCategoryId } })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{PORTFOLIO_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.ru}</option>)}</select></label>
                <label className="mt-3 block text-xs font-bold text-slate-600">Теги<input value={focused.taxonomy.tags.join(', ')} onChange={event => updateItem(focused.key, { taxonomy: { ...focused.taxonomy, tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) } })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                <label className="mt-3 block text-xs font-bold text-slate-600">Порядок<input type="number" value={focused.order} onChange={event => updateItem(focused.key, { order: Number(event.target.value) || 0 })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                {focused.published ? <a href={focused.path} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold text-white hover:bg-indigo-600"><ExternalLink className="h-4 w-4" />Открыть публичную страницу</a> : <div className="mt-5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">Черновик показывается здесь локально. Публичный URL станет доступен после публикации.</div>}
              </div>
            ) : <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">Выберите материал.</div>}
          </section>
        </aside>
      </div>

      {dirtyKeys.size === 0 && items.length > 0 && <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Все изменения синхронизированы с Firestore.</div>}
    </div>
  );
}
