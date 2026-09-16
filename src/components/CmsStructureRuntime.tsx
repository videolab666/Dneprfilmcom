import { useEffect, useMemo } from 'react';
import { EDITABLE_STRUCTURE_CATALOG } from '../generated/editableStructureCatalog';
import { normalizeFullPageCms, type StructureItemOverride, type StructureLayout, type StructureScalar } from '../lib/fullPageEditing';
import { useSiteContent } from '../context/SiteContentContext';
import type { Locale } from '../types';

type RuntimeField = {
  key: string;
  scope?: 'locale' | 'common';
  valueType?: 'string' | 'number' | 'boolean' | 'null';
  copyId?: string;
  uk?: string;
  ru?: string;
  en?: string;
  common?: StructureScalar;
};

type RuntimeItem = {
  id: string;
  label: string;
  fields: RuntimeField[];
};

type RuntimeGroup = {
  id: string;
  page: string;
  source: string;
  line: number;
  label: string;
  items: RuntimeItem[];
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function currentPage(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const pathname = window.location.pathname.replace(base, '').replace(/\/$/, '') || '/';
  if (pathname === '/') return 'home';
  if (pathname === '/live') return 'live';
  if (pathname === '/video') return 'video';
  if (pathname === '/construction') return 'construction';
  if (pathname === '/photo') return 'photo';
  if (pathname === '/about') return 'about';
  if (pathname === '/contacts') return 'contacts';
  if (pathname === '/cases') return 'cases';
  if (/^\/cases\//.test(pathname)) return 'case-detail';
  if (pathname === '/videos') return 'videos';
  if (/^\/videos\//.test(pathname)) return 'video-detail';
  if (pathname === '/galleries') return 'galleries';
  if (/^\/galleries\//.test(pathname)) return 'gallery-detail';
  if (pathname === '/media-center') return 'media-center';
  if (/^\/media-center\//.test(pathname)) return 'article-detail';
  return 'common';
}

function textNodeIndex(): Map<string, HTMLElement[]> {
  const result = new Map<string, HTMLElement[]>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest('[data-cms-inspector-ui]')) return NodeFilter.FILTER_REJECT;
      if (parent.closest('script,style,noscript,textarea,input,select,option')) return NodeFilter.FILTER_REJECT;
      const value = normalizeText(node.textContent || '');
      return value.length >= 2 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  let node: Node | null = walker.nextNode();
  while (node) {
    const value = normalizeText(node.textContent || '');
    const parent = node.parentElement;
    if (parent) {
      const list = result.get(value) || [];
      if (!list.includes(parent)) list.push(parent);
      result.set(value, list);
    }
    node = walker.nextNode();
  }
  return result;
}

function patchFor(group: RuntimeGroup, id: string, config: ReturnType<typeof normalizeFullPageCms>): StructureItemOverride | undefined {
  return config.structures[group.id]?.items?.find(item => item.id === id);
}

function fieldValue(
  field: RuntimeField,
  locale: Locale,
  config: ReturnType<typeof normalizeFullPageCms>,
  patch?: StructureItemOverride,
): StructureScalar | undefined {
  const scope = field.scope || 'locale';
  if (scope === 'common') return patch?.common?.[field.key] ?? field.common;
  if (patch?.cloneFromId) return patch.locales?.[locale]?.[field.key] ?? field[locale];
  const copyId = field.copyId;
  if (copyId) return config.copyOverrides[copyId]?.[locale] ?? field[locale];
  return field[locale];
}

function orderedItems(group: RuntimeGroup, config: ReturnType<typeof normalizeFullPageCms>) {
  const structure = config.structures[group.id];
  const originals = group.items.map((catalog, index) => ({
    catalog,
    patch: patchFor(group, catalog.id, config) || { id: catalog.id, enabled: true, order: index * 10 },
  }));
  const added = (structure?.items || [])
    .filter(item => item.cloneFromId && !group.items.some(original => original.id === item.id))
    .map(item => ({
      catalog: group.items.find(original => original.id === item.cloneFromId) || group.items[0],
      patch: item,
    }))
    .filter(entry => Boolean(entry.catalog));
  return [...originals, ...added]
    .filter(entry => entry.patch.enabled !== false)
    .sort((a, b) => (a.patch.order ?? 0) - (b.patch.order ?? 0));
}

function ancestors(element: HTMLElement): HTMLElement[] {
  const list: HTMLElement[] = [];
  let cursor: HTMLElement | null = element;
  while (cursor && cursor !== document.body) {
    list.push(cursor);
    cursor = cursor.parentElement;
  }
  list.push(document.body);
  return list;
}

function lowestCommonAncestor(elements: HTMLElement[]): HTMLElement | null {
  if (!elements.length) return null;
  const firstAncestors = ancestors(elements[0]);
  return firstAncestors.find(candidate => elements.every(element => candidate.contains(element))) || null;
}

function directBranch(root: HTMLElement, element: HTMLElement): HTMLElement {
  let cursor = element;
  while (cursor.parentElement && cursor.parentElement !== root) cursor = cursor.parentElement;
  return cursor;
}

function bestAnchor(
  catalog: RuntimeItem,
  patch: StructureItemOverride,
  locale: Locale,
  config: ReturnType<typeof normalizeFullPageCms>,
  index: Map<string, HTMLElement[]>,
): { value: string; element: HTMLElement; field: RuntimeField } | null {
  const candidates = catalog.fields
    .map(field => ({ field, value: fieldValue(field, locale, config, patch) }))
    .filter((entry): entry is { field: RuntimeField; value: string } => typeof entry.value === 'string')
    .map(entry => ({ ...entry, value: normalizeText(entry.value) }))
    .filter(entry => entry.value.length >= 2 && entry.value.length <= 300 && index.has(entry.value))
    .sort((a, b) => {
      const aCount = index.get(a.value)?.length || 999;
      const bCount = index.get(b.value)?.length || 999;
      const aLocalized = (a.field.scope || 'locale') === 'locale' ? 0 : 1;
      const bLocalized = (b.field.scope || 'locale') === 'locale' ? 0 : 1;
      return aCount - bCount || aLocalized - bLocalized || b.value.length - a.value.length;
    });
  const winner = candidates[0];
  if (!winner) return null;
  const element = index.get(winner.value)?.[0];
  return element ? { ...winner, element } : null;
}

function bindGroup(
  group: RuntimeGroup,
  locale: Locale,
  config: ReturnType<typeof normalizeFullPageCms>,
  index: Map<string, HTMLElement[]>,
) {
  const resolved = orderedItems(group, config)
    .map(entry => ({ ...entry, anchor: bestAnchor(entry.catalog, entry.patch, locale, config, index) }))
    .filter(entry => Boolean(entry.anchor));
  if (resolved.length < 2) return;

  const anchorElements = resolved.map(entry => entry.anchor!.element);
  const root = lowestCommonAncestor(anchorElements);
  if (!root || root === document.body) return;
  const branches = resolved.map(entry => directBranch(root, entry.anchor!.element));
  if (new Set(branches).size < 2) return;

  root.dataset.cmsStructureGroup = group.id;
  root.dataset.cmsStructureLabel = group.label;
  for (let indexValue = 0; indexValue < resolved.length; indexValue += 1) {
    const entry = resolved[indexValue];
    const branch = branches[indexValue];
    branch.dataset.cmsStructureGroup = group.id;
    branch.dataset.cmsStructureItem = entry.patch.id;
    branch.dataset.cmsStructureSource = `${group.source}:${group.line}`;
    const anchor = entry.anchor!;
    anchor.element.dataset.cmsStructureField = anchor.field.key;
  }

  const layout = config.structures[group.id]?.layout;
  if (layout && layout !== 'auto') root.dataset.cmsRuntimeLayout = layout;
}

function clearBindings() {
  document.querySelectorAll<HTMLElement>('[data-cms-structure-group],[data-cms-structure-item],[data-cms-structure-field],[data-cms-runtime-layout]').forEach(element => {
    delete element.dataset.cmsStructureGroup;
    delete element.dataset.cmsStructureLabel;
    delete element.dataset.cmsStructureItem;
    delete element.dataset.cmsStructureField;
    delete element.dataset.cmsStructureSource;
    delete element.dataset.cmsRuntimeLayout;
  });
}

export function CmsStructureRuntime() {
  const { locale, rawSettings } = useSiteContent();
  const config = useMemo(() => normalizeFullPageCms(rawSettings.fullPageCms), [rawSettings.fullPageCms]);
  const page = useMemo(currentPage, []);

  useEffect(() => {
    let raf = 0;
    let running = false;
    const bind = () => {
      running = false;
      clearBindings();
      const index = textNodeIndex();
      (EDITABLE_STRUCTURE_CATALOG as RuntimeGroup[])
        .filter(group => group.page === page || group.page === 'common' || group.page === 'layout')
        .forEach(group => bindGroup(group, locale, config, index));
    };
    const schedule = () => {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(bind);
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const late = window.setTimeout(schedule, 500);
    return () => {
      observer.disconnect();
      window.clearTimeout(late);
      window.cancelAnimationFrame(raf);
      clearBindings();
    };
  }, [config, locale, page]);

  return <style>{`
    [data-cms-runtime-layout="stack"] { display:grid !important; grid-template-columns:minmax(0,1fr) !important; }
    [data-cms-runtime-layout="grid-2"] { display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
    [data-cms-runtime-layout="grid-3"] { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; }
    [data-cms-runtime-layout="grid-4"] { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
    @media (max-width: 767px) {
      [data-cms-runtime-layout="grid-2"],
      [data-cms-runtime-layout="grid-3"],
      [data-cms-runtime-layout="grid-4"] { grid-template-columns:minmax(0,1fr) !important; }
    }
  `}</style>;
}

export function hasRuntimeStructureLayout(input: unknown): boolean {
  const config = normalizeFullPageCms(input);
  return Object.values(config.structures).some(structure => {
    const layout = structure.layout as StructureLayout | undefined;
    return Boolean(layout && layout !== 'auto');
  });
}
