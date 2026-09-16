import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Layers3,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useSiteContent } from '../context/SiteContentContext';
import {
  PAGE_BUILDER_CATEGORIES,
  PAGE_BUILDER_KINDS,
  PAGE_BUILDER_PAGES,
  blockMatchesPage,
  builderDraftData,
  createBuilderBlock,
  resolveBuilderDraft,
  type BuilderSiteBlock,
  type PageBuilderKind,
  type PageBuilderPage,
  type StoredBuilderSiteBlock,
} from '../lib/pageBuilder';
import {
  discardComposerDraftPage,
  normalizePageComposer,
  pageComposerSupported,
  publishComposerPage,
  replaceComposerDraftPage,
  syncComposerPage,
  type PageComposerItem,
  type PageComposerPageState,
} from '../lib/pageComposer';
import { PIXEL_PERFECT_SECTIONS, pixelPerfectSectionById } from '../lib/pixelPerfectSections';
import {
  versionedDeleteDoc as deleteDoc,
  versionedSetDoc as setDoc,
  versionedUpdateDoc,
} from '../lib/cmsVersioning';

interface ItemRect {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function pageFromPath(): PageBuilderPage | null {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = window.location.pathname.replace(base, '').replace(/\/$/, '') || '/';
  const found = PAGE_BUILDER_PAGES.find(item => item.path === path);
  return found?.id || null;
}

function editableBlock(stored: StoredBuilderSiteBlock): BuilderSiteBlock {
  return resolveBuilderDraft(stored) || stored;
}

function reindex(items: PageComposerItem[]): PageComposerItem[] {
  return items.map((item, index) => ({ ...item, order: index * 10 }));
}

export function CmsPageComposer() {
  const { user } = useAuth();
  const { rawSettings, locale } = useSiteContent();
  const page = useMemo(() => pageFromPath(), []);
  const [stored, setStored] = useState<StoredBuilderSiteBlock[]>([]);
  const [rects, setRects] = useState<ItemRect[]>([]);
  const [draggedId, setDraggedId] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState(0);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => onSnapshot(collection(db, 'site_blocks'), snapshot => {
    setStored(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StoredBuilderSiteBlock)));
  }, err => setError(err.message)), []);

  const resolvedBlocks = useMemo(() => stored
    .map(resolveBuilderDraft)
    .filter((item): item is BuilderSiteBlock => Boolean(item)), [stored]);

  const composer = useMemo(() => normalizePageComposer(
    (rawSettings as unknown as { pageComposer?: unknown }).pageComposer,
  ), [rawSettings]);

  const layout = useMemo<PageComposerPageState | null>(() => {
    if (!page || !pageComposerSupported(page)) return null;
    return syncComposerPage(page, composer.draft.pages[page] || composer.published.pages[page], resolvedBlocks);
  }, [composer, page, resolvedBlocks]);

  const blockById = useMemo(() => new Map(resolvedBlocks.map(block => [block.id, block])), [resolvedBlocks]);
  const storedById = useMemo(() => new Map(stored.map(block => [block.id, block])), [stored]);

  useEffect(() => {
    if (!layout) return;
    const refresh = () => {
      const next: ItemRect[] = [];
      document.querySelectorAll<HTMLElement>('[data-cms-composer-item]').forEach(element => {
        const id = element.dataset.cmsComposerItem;
        if (!id) return;
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const rect = element.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        next.push({ id, left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      });
      const order = new Map(layout.items.map((item, index) => [item.id, index]));
      next.sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999));
      setRects(next);
    };
    refresh();
    const interval = window.setInterval(refresh, 350);
    window.addEventListener('resize', refresh);
    window.addEventListener('scroll', refresh, true);
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'data-cms-composer-item'] });
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', refresh);
      window.removeEventListener('scroll', refresh, true);
      observer.disconnect();
    };
  }, [layout]);

  if (!user || !page || !pageComposerSupported(page) || !layout) return null;

  const actor = user.email || user.uid;
  const pageMeta = PAGE_BUILDER_PAGES.find(item => item.id === page);

  const saveLayout = async (next: PageComposerPageState) => {
    const ref = doc(db, 'site_settings', 'global');
    const snapshot = await getDoc(ref);
    const canonical = normalizePageComposer(snapshot.exists() ? snapshot.data().pageComposer : undefined);
    const value = replaceComposerDraftPage(canonical, page, { items: reindex(next.items) }, actor);
    await versionedUpdateDoc(ref, { pageComposer: value, updatedAt: Date.now() });
  };

  const nextBlockOrder = () => {
    const orders = resolvedBlocks.filter(block => blockMatchesPage(block, page)).map(block => Number(block.order) || 0);
    return (orders.length ? Math.max(...orders) : 0) + 10;
  };

  const insertComposerItem = async (item: PageComposerItem, index: number) => {
    const current = layout.items.filter(existing => existing.id !== item.id);
    current.splice(Math.max(0, Math.min(index, current.length)), 0, item);
    await saveLayout({ items: reindex(current) });
  };

  const createDraftBlock = async (kind: PageBuilderKind, index: number, nativeSection?: string) => {
    const block = createBuilderBlock(kind, page, nextBlockOrder());
    block.id = makeId(nativeSection ? 'native-section' : `builder-${kind}`);
    block.isActive = true;
    block.config.builderScope = 'page';
    block.config.builderPlacement = 'after';
    if (nativeSection) {
      const definition = pixelPerfectSectionById(nativeSection);
      block.title = definition?.label || 'Pixel Perfect section';
      block.title_uk = block.title;
      block.title_en = block.title;
      block.config.nativeSection = nativeSection;
      block.config.width = 'full';
    }
    const placeholder = clean({
      ...block,
      isActive: false,
      _builderUnpublished: true,
      builderDraft: builderDraftData(block),
      builderDraftUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await setDoc(doc(db, 'site_blocks', block.id), placeholder);
    await insertComposerItem({ id: `block:${block.id}`, kind: 'block', refId: block.id, enabled: true, order: index * 10 }, index);
    setMessage(`Добавлен Draft-блок «${block.title_uk || block.title}».`);
  };

  const moveItem = async (id: string, targetIndex: number) => {
    const items = [...layout.items];
    const sourceIndex = items.findIndex(item => item.id === id);
    if (sourceIndex < 0) return;
    const [moved] = items.splice(sourceIndex, 1);
    const adjusted = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    items.splice(Math.max(0, Math.min(adjusted, items.length)), 0, moved);
    await saveLayout({ items: reindex(items) });
  };

  const moveBy = async (id: string, delta: number) => {
    const index = layout.items.findIndex(item => item.id === id);
    if (index < 0) return;
    await moveItem(id, Math.max(0, Math.min(layout.items.length, index + delta)));
  };

  const toggleItem = async (id: string) => {
    await saveLayout({ items: layout.items.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item) });
  };

  const duplicateItem = async (item: PageComposerItem) => {
    const index = layout.items.findIndex(entry => entry.id === item.id) + 1;
    if (item.kind === 'native') {
      await createDraftBlock('text_image', index, item.refId);
      return;
    }
    const source = blockById.get(item.refId);
    if (!source) return;
    const copy = clean(source);
    copy.id = makeId('builder-copy');
    copy.order = nextBlockOrder();
    copy.title = `${source.title} — copy`;
    copy.title_uk = source.title_uk ? `${source.title_uk} — копія` : source.title_uk;
    copy.title_en = source.title_en ? `${source.title_en} — copy` : source.title_en;
    const placeholder = clean({
      ...copy,
      isActive: false,
      _builderUnpublished: true,
      builderDraft: builderDraftData(copy),
      builderDraftUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await setDoc(doc(db, 'site_blocks', copy.id), placeholder);
    await insertComposerItem({ id: `block:${copy.id}`, kind: 'block', refId: copy.id, enabled: true, order: index * 10 }, index);
  };

  const removeItem = async (item: PageComposerItem) => {
    if (item.kind === 'native') {
      await saveLayout({ items: layout.items.map(entry => entry.id === item.id ? { ...entry, enabled: false } : entry) });
      return;
    }
    const storedBlock = storedById.get(item.refId);
    if (!storedBlock) return;
    if (!window.confirm('Удалить этот блок из Draft страницы?')) return;
    if (storedBlock._builderUnpublished) {
      await deleteDoc(doc(db, 'site_blocks', storedBlock.id));
    } else {
      const view = editableBlock(storedBlock);
      await setDoc(doc(db, 'site_blocks', storedBlock.id), clean({
        builderDraft: builderDraftData(view, true),
        builderDraftUpdatedAt: Date.now(),
        updatedAt: Date.now(),
      }), { merge: true });
    }
    await saveLayout({ items: layout.items.filter(entry => entry.id !== item.id) });
  };

  const publish = async () => {
    if (!window.confirm(`Опубликовать визуальную структуру страницы «${pageMeta?.label || page}» и все её Draft-блоки?`)) return;
    setSaving(true);
    setError('');
    try {
      const settingsRef = doc(db, 'site_settings', 'global');
      const settingsSnapshot = await getDoc(settingsRef);
      let canonical = normalizePageComposer(settingsSnapshot.exists() ? settingsSnapshot.data().pageComposer : undefined);
      canonical = replaceComposerDraftPage(canonical, page, layout, actor);
      canonical = publishComposerPage(canonical, page, actor);
      await versionedUpdateDoc(settingsRef, { pageComposer: canonical, updatedAt: Date.now() });

      const candidates = stored.filter(item => {
        const view = editableBlock(item);
        return blockMatchesPage(view, page) && (item.builderDraft || item._builderUnpublished);
      });
      await Promise.all(candidates.map(async item => {
        if (item.builderDraft?.deleted) {
          await deleteDoc(doc(db, 'site_blocks', item.id));
          return;
        }
        const resolved = resolveBuilderDraft(item);
        if (!resolved) return;
        await setDoc(doc(db, 'site_blocks', item.id), clean({
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
        }), { merge: true });
      }));
      setMessage(`Страница опубликована. Builder-блоков: ${candidates.length}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    if (!window.confirm('Отменить все изменения Visual Composer на этой странице и вернуть published-версию?')) return;
    setSaving(true);
    try {
      const candidates = stored.filter(item => {
        const view = editableBlock(item);
        return blockMatchesPage(view, page) && (item.builderDraft || item._builderUnpublished);
      });
      await Promise.all(candidates.map(item => item._builderUnpublished
        ? deleteDoc(doc(db, 'site_blocks', item.id))
        : setDoc(doc(db, 'site_blocks', item.id), { builderDraft: null, builderDraftUpdatedAt: null }, { merge: true })));
      const settingsRef = doc(db, 'site_settings', 'global');
      const snapshot = await getDoc(settingsRef);
      const canonical = normalizePageComposer(snapshot.exists() ? snapshot.data().pageComposer : undefined);
      await versionedUpdateDoc(settingsRef, { pageComposer: discardComposerDraftPage(canonical, page, actor), updatedAt: Date.now() });
      setMessage('Draft Visual Composer сброшен.');
    } finally {
      setSaving(false);
    }
  };

  const exitComposer = () => {
    const query = new URLSearchParams(window.location.search);
    query.delete('cmsCompose');
    query.delete('cmsPreview');
    const suffix = query.toString();
    window.location.assign(`${window.location.pathname}${suffix ? `?${suffix}` : ''}`);
  };

  const visibleRects = rects.filter(rect => layout.items.some(item => item.id === rect.id && item.enabled));
  const rectById = new Map(visibleRects.map(rect => [rect.id, rect]));
  const hiddenItems = layout.items.filter(item => !item.enabled);
  const libraryGroups = PAGE_BUILDER_CATEGORIES.map(category => ({
    ...category,
    items: PAGE_BUILDER_KINDS
      .filter(item => item.category === category.id)
      .filter(item => !libraryQuery.trim() || `${item.label} ${item.description}`.toLowerCase().includes(libraryQuery.trim().toLowerCase())),
  })).filter(group => group.items.length);

  const itemLabel = (item: PageComposerItem): string => {
    if (item.kind === 'native') return pixelPerfectSectionById(item.refId)?.label || item.refId;
    const block = blockById.get(item.refId);
    return block?.title_uk || block?.title || item.refId;
  };

  const insertionPoints: Array<{ index: number; top: number; left: number; width: number }> = [];
  if (visibleRects.length) {
    const first = visibleRects[0];
    insertionPoints.push({ index: 0, top: first.top, left: first.left, width: first.width });
    visibleRects.forEach(rect => {
      const layoutIndex = layout.items.findIndex(item => item.id === rect.id);
      insertionPoints.push({ index: layoutIndex + 1, top: rect.top + rect.height, left: rect.left, width: rect.width });
    });
  }

  return (
    <div data-cms-inspector-ui>
      <div className="fixed left-4 top-24 z-[2147483200] w-[min(620px,calc(100vw-2rem))] rounded-2xl border border-indigo-300 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto flex items-center gap-2"><Layers3 className="h-4 w-4 text-indigo-400" /><div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-300">CMS 4.4 · Visual Page Composer</div><div className="text-xs font-bold">{pageMeta?.label} · {locale.toUpperCase()}</div></div></div>
          <button type="button" onClick={() => { setInsertIndex(layout.items.length); setLibraryOpen(true); }} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-black"><Plus className="h-3.5 w-3.5" />Секция</button>
          <button type="button" onClick={() => void discard()} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-[11px] font-bold disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />Сбросить</button>
          <button type="button" onClick={() => void publish()} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-black disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? 'Сохранение…' : 'Опубликовать'}</button>
          <button type="button" onClick={exitComposer} className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {message && <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-[10px] font-bold text-emerald-300">{message}</div>}
        {error && <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-[10px] font-bold text-red-300">{error}</div>}
        {hiddenItems.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1.5"><span className="text-[10px] font-bold text-slate-400">Скрыто:</span>{hiddenItems.map(item => <button key={item.id} onClick={() => void toggleItem(item.id)} className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-[9px] font-bold text-slate-300"><Eye className="h-3 w-3" />{itemLabel(item)}</button>)}</div>}
      </div>

      {visibleRects.map(rect => {
        const item = layout.items.find(entry => entry.id === rect.id);
        if (!item || rect.top > window.innerHeight || rect.top + rect.height < 0) return null;
        return <div key={item.id}>
          <div className="pointer-events-none fixed z-[2147483000] border-2 border-indigo-500/70 bg-indigo-500/[0.025]" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />
          <div className="fixed z-[2147483100] flex items-center gap-1 rounded-xl bg-slate-950/95 p-1.5 text-white shadow-xl" style={{ right: Math.max(6, window.innerWidth - rect.left - rect.width + 8), top: Math.max(6, rect.top + 8) }}>
            <button draggable onDragStart={event => { setDraggedId(item.id); event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDraggedId('')} title="Перетащить" className="cursor-grab rounded-lg p-1.5 text-indigo-300 hover:bg-slate-800"><GripVertical className="h-4 w-4" /></button>
            <span className="max-w-52 truncate px-1 text-[10px] font-black">{itemLabel(item)}</span>
            <button onClick={() => void moveBy(item.id, -1)} title="Выше" className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button onClick={() => void moveBy(item.id, 1)} title="Ниже" className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button onClick={() => void duplicateItem(item)} title="Дублировать" className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"><Copy className="h-3.5 w-3.5" /></button>
            <button onClick={() => void toggleItem(item.id)} title="Скрыть" className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"><EyeOff className="h-3.5 w-3.5" /></button>
            <button onClick={() => void removeItem(item)} title={item.kind === 'native' ? 'Убрать со страницы' : 'Удалить Draft-блок'} className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/20"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>;
      })}

      {insertionPoints.map((point, idx) => (
        <div key={`${point.index}-${idx}`} className="fixed z-[2147483050] -translate-y-1/2" style={{ left: point.left, top: point.top, width: point.width }} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={event => { event.preventDefault(); const id = draggedId || event.dataTransfer.getData('text/plain'); setDraggedId(''); if (id) void moveItem(id, point.index); }}>
          <div className={`relative h-7 ${draggedId ? 'pointer-events-auto' : ''}`}>
            <div className={`pointer-events-none absolute left-0 right-0 top-1/2 h-px ${draggedId ? 'bg-emerald-400' : 'bg-indigo-400/0 hover:bg-indigo-400'}`} />
            <button type="button" onClick={() => { setInsertIndex(point.index); setLibraryOpen(true); }} className="pointer-events-auto absolute left-1/2 top-1/2 flex h-7 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-indigo-300 bg-white px-2.5 text-[9px] font-black text-indigo-700 opacity-30 shadow transition hover:opacity-100"><Plus className="h-3 w-3" />добавить</button>
          </div>
        </div>
      ))}

      {libraryOpen && <aside className="fixed inset-y-0 right-0 z-[2147483300] w-[min(520px,100vw)] overflow-y-auto border-l border-slate-700 bg-slate-950 p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-400">Вставка позиции {insertIndex + 1}</div><h2 className="mt-1 text-xl font-black">Библиотека секций</h2></div><button onClick={() => setLibraryOpen(false)} className="rounded-lg bg-slate-800 p-2"><X className="h-4 w-4" /></button></div>
        <div className="relative mt-4"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" /><input value={libraryQuery} onChange={event => setLibraryQuery(event.target.value)} placeholder="Поиск блока…" className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" /></div>

        <div className="mt-5 space-y-5">
          {libraryGroups.map(group => <section key={group.id}><div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{group.label}</div><div className="grid gap-2 sm:grid-cols-2">{group.items.map(kind => <button key={kind.id} onClick={() => { void createDraftBlock(kind.id, insertIndex).then(() => setLibraryOpen(false)); }} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-left hover:border-indigo-500"><div className="text-xs font-black">{kind.label}</div><div className="mt-1 text-[10px] leading-4 text-slate-400">{kind.description}</div></button>)}</div></section>)}

          <section><div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-400">DNEPRFILM · исходные секции</div><div className="grid gap-2 sm:grid-cols-2">{PIXEL_PERFECT_SECTIONS.filter(section => !libraryQuery.trim() || `${section.label} ${section.description}`.toLowerCase().includes(libraryQuery.trim().toLowerCase())).map(section => <button key={section.id} onClick={() => { void createDraftBlock('text_image', insertIndex, section.id).then(() => setLibraryOpen(false)); }} className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3 text-left hover:border-emerald-500"><div className="text-xs font-black text-emerald-100">{section.label}</div><div className="mt-1 text-[10px] leading-4 text-emerald-300/60">{section.description}</div></button>)}</div></section>
        </div>
      </aside>}
    </div>
  );
}
