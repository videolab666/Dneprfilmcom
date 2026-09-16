import { useEffect, useMemo, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSiteContent } from '../context/SiteContentContext';
import {
  PAGE_BUILDER_PAGES,
  builderDraftData,
  resolveBuilderDraft,
  type BuilderSiteBlock,
  type PageBuilderPage,
  type StoredBuilderSiteBlock,
} from '../lib/pageBuilder';
import { pixelPerfectSectionById } from '../lib/pixelPerfectSections';
import { versionedSetDoc as setDoc } from '../lib/cmsVersioning';
import { CmsBlockInlineEditor } from './CmsBlockInlineEditor';

interface CmsInlineEditingOverlayProps {
  page: PageBuilderPage;
}

interface EditTargetRect {
  itemId: string;
  blockId?: string;
  nativeSection?: string;
  left: number;
  top: number;
  width: number;
}

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function CmsInlineEditingOverlay({ page }: CmsInlineEditingOverlayProps) {
  const { locale } = useSiteContent();
  const [stored, setStored] = useState<StoredBuilderSiteBlock[]>([]);
  const [editingBlockId, setEditingBlockId] = useState('');
  const [rects, setRects] = useState<EditTargetRect[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => onSnapshot(collection(db, 'site_blocks'), snapshot => {
    setStored(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StoredBuilderSiteBlock)));
  }, error => console.warn('CMS Inline Editor blocks:', error)), []);

  const blocks = useMemo(() => stored
    .map(resolveBuilderDraft)
    .filter((item): item is BuilderSiteBlock => Boolean(item)), [stored]);
  const blockById = useMemo(() => new Map<string, BuilderSiteBlock>(blocks.map(block => [block.id, block] as [string, BuilderSiteBlock])), [blocks]);
  const editingBlock = editingBlockId ? blockById.get(editingBlockId) || null : null;

  const openNativeInspector = (sectionId: string) => {
    const definition = pixelPerfectSectionById(sectionId);
    if (!definition) return;
    const pageMeta = PAGE_BUILDER_PAGES.find(item => item.id === definition.page);
    if (!pageMeta) return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const query = new URLSearchParams();
    query.set('cmsPreview', '1');
    query.set('cmsInspect', '1');
    query.set('lang', locale);
    window.open(`${base}${pageMeta.path}?${query.toString()}`, '_blank', 'noopener,noreferrer');
    setMessage(`Visual Inspector открыт для «${definition.label}».`);
    window.setTimeout(() => setMessage(''), 2000);
  };

  const editTarget = (target: EditTargetRect) => {
    if (target.nativeSection) {
      openNativeInspector(target.nativeSection);
      return;
    }
    if (target.blockId) setEditingBlockId(target.blockId);
  };

  useEffect(() => {
    const refresh = () => {
      const next: EditTargetRect[] = [];
      document.querySelectorAll<HTMLElement>('[data-cms-composer-item]').forEach(element => {
        const itemId = element.dataset.cmsComposerItem;
        if (!itemId) return;
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const rect = element.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        const blockId = element.dataset.cmsComposerBlock;
        const block = blockId ? blockById.get(blockId) : undefined;
        const nativeSection = block?.config.nativeSection || (itemId.startsWith('native:') ? itemId.slice('native:'.length) : undefined);
        next.push({ itemId, blockId, nativeSection, left: rect.left, top: rect.top, width: rect.width });
      });
      setRects(next);
    };
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'data-cms-composer-item', 'data-cms-composer-block'] });
    const interval = window.setInterval(refresh, 400);
    window.addEventListener('scroll', refresh, true);
    window.addEventListener('resize', refresh);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.removeEventListener('scroll', refresh, true);
      window.removeEventListener('resize', refresh);
    };
  }, [blockById]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest('[data-cms-inspector-ui]')) return;
      const composerItem = target.closest<HTMLElement>('[data-cms-composer-item]');
      if (!composerItem) return;
      const itemId = composerItem.dataset.cmsComposerItem || '';
      const blockId = composerItem.dataset.cmsComposerBlock;
      if (!blockId) return;
      const block = blockById.get(blockId);
      if (!block) return;
      event.preventDefault();
      event.stopPropagation();
      if (block.config.nativeSection) openNativeInspector(block.config.nativeSection);
      else setEditingBlockId(blockId);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [blockById, locale]);

  const saveBlock = async (block: BuilderSiteBlock) => {
    const storedBlock = stored.find(item => item.id === block.id);
    if (!storedBlock) throw new Error('Блок больше не существует.');
    await setDoc(doc(db, 'site_blocks', block.id), clean({
      builderDraft: builderDraftData(block),
      builderDraftUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    }), { merge: true });
    setMessage(`Draft «${block.title_uk || block.title}» сохранён.`);
    window.setTimeout(() => setMessage(''), 1800);
  };

  return <>
    <div data-cms-inspector-ui className="fixed bottom-4 left-1/2 z-[2147483250] -translate-x-1/2 rounded-full border border-fuchsia-400/30 bg-slate-950/95 px-4 py-2 text-[10px] font-black text-white shadow-2xl backdrop-blur">
      CMS 4.5 · клик по builder-блоку = редактировать
    </div>

    {message && <div data-cms-inspector-ui className="fixed bottom-16 left-1/2 z-[2147483450] -translate-x-1/2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-xl">{message}</div>}

    {rects.map(target => {
      if (target.top > window.innerHeight || target.top < -80) return null;
      return <button
        key={target.itemId}
        data-cms-inspector-ui
        type="button"
        title={target.nativeSection ? 'Редактировать исходную pixel-perfect секцию' : 'Редактировать блок'}
        onClick={() => editTarget(target)}
        className="fixed z-[2147483205] flex h-8 w-8 items-center justify-center rounded-full border border-fuchsia-300 bg-slate-950/95 text-fuchsia-300 shadow-lg transition hover:scale-105 hover:bg-fuchsia-600 hover:text-white"
        style={{ left: Math.max(6, target.left + 8), top: Math.max(6, target.top + 8) }}
      ><Edit3 className="h-3.5 w-3.5" /></button>;
    })}

    {editingBlock && !editingBlock.config.nativeSection && <CmsBlockInlineEditor
      key={editingBlock.id}
      block={editingBlock}
      locale={locale}
      onClose={() => setEditingBlockId('')}
      onSave={saveBlock}
    />}
  </>;
}
