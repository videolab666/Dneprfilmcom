import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Copy, Eye, EyeOff, GripVertical, MousePointer2, Save, Trash2, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { EDITABLE_COPY_CATALOG, type EditableCopyCatalogEntry } from '../generated/editableCopyCatalog';
import { EDITABLE_STRUCTURE_CATALOG } from '../generated/editableStructureCatalog';
import { useSiteContent } from '../context/SiteContentContext';
import { useAuth } from '../context/AuthContext';
import {
  normalizeFullPageCms,
  replaceFullPageDraft,
  type FullPageCmsContent,
  type StructureItemOverride,
  type StructureLayout,
  type StructureScalar,
} from '../lib/fullPageEditing';
import { versionedUpdateDoc } from '../lib/cmsVersioning';
import { db } from '../lib/firebase';
import type { HeroSlide, Locale, SiteBlock, SiteSetting } from '../types';

type ValueKind = 'text' | 'url' | 'media' | 'number' | 'boolean';
type RuntimeContent = Pick<FullPageCmsContent, 'copyOverrides' | 'structures'>;

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

type RuntimeItem = { id: string; label: string; fields: RuntimeField[] };
type RuntimeGroup = { id: string; page: string; source: string; line: number; label: string; items: RuntimeItem[] };

type Candidate = {
  id: string;
  sourceType: 'copy' | 'structure-field' | 'structure-item' | 'setting' | 'hero' | 'block';
  label: string;
  detail: string;
  kind: ValueKind;
  value: StructureScalar;
  priority: number;
  copyEntry?: EditableCopyCatalogEntry;
  groupId?: string;
  itemId?: string;
  field?: RuntimeField;
  settingKey?: string;
  heroId?: string;
  heroField?: string;
  blockId?: string;
  blockPath?: string;
};

const LANGS: Locale[] = ['uk', 'ru', 'en'];
const LOCALIZED_SETTING_BASES = new Set([
  'studioName', 'address', 'workingHours', 'heroBadge', 'heroTitle', 'heroSubtitle',
  'heroCtaPrimaryText', 'heroCtaSecondaryText', 'founderName', 'founderRole',
  'founderQuote', 'founderBio', 'announcementText',
]);
const COMMON_FIELD_RE = /(^|\.)(id|key|slug|icon|iconname|image|imageurl|thumbnail|thumbnailurl|poster|posterurl|videourl|url|href|link|buttonlink|primarylink|secondarylink|ctaprimarylink|ctasecondarylink|downloadname|doctype|format|filesize|status|type|kind|variant|layout|enabled|active|isactive|order|price|amount|count|number|num|durationms|overlayopacity|objectposition|target|rel|tone|color|style|size)$/i;

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function normalized(value: string): string { return value.replace(/\s+/g, ' ').trim(); }
function canonicalText(value: string): string { return normalized(value).replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim(); }

function pageFromPath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = pathname.replace(base, '').replace(/\/$/, '') || '/';
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

function valueKind(key: string, value: StructureScalar): ValueKind {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (/(image|photo|poster|thumbnail|media|video).*url|imageurl|posterurl|thumbnailurl/i.test(key)) return 'media';
  if (/(url|href|link)$/i.test(key)) return 'url';
  return 'text';
}

function fieldValue(field: RuntimeField, locale: Locale, config: RuntimeContent, patch?: StructureItemOverride): StructureScalar | undefined {
  if ((field.scope || 'locale') === 'common') return patch?.common?.[field.key] ?? field.common;
  if (patch?.cloneFromId) return patch.locales?.[locale]?.[field.key] ?? field[locale];
  if (field.copyId) return config.copyOverrides[field.copyId]?.[locale] ?? field[locale];
  return field[locale];
}

function orderedStructureItems(group: RuntimeGroup, config: RuntimeContent) {
  const override = config.structures[group.id];
  const originals = group.items.map((catalog, index) => ({
    catalog,
    patch: override?.items.find(item => item.id === catalog.id) || { id: catalog.id, enabled: true, order: index * 10 },
  }));
  const added = (override?.items || [])
    .filter(item => item.cloneFromId && !group.items.some(original => original.id === item.id))
    .map(item => ({ catalog: group.items.find(original => original.id === item.cloneFromId) || group.items[0], patch: item }))
    .filter(entry => Boolean(entry.catalog));
  return [...originals, ...added].sort((a, b) => (a.patch.order ?? 0) - (b.patch.order ?? 0));
}

function localizedSettingKey(base: string, locale: Locale): string {
  if (!LOCALIZED_SETTING_BASES.has(base) || locale === 'ru') return base;
  return `${base}_${locale}`;
}

function localizedBlockPath(path: string, locale: Locale, common: boolean): string {
  if (common || locale === 'ru') return path;
  if (path === 'title') return `title_${locale}`;
  if (path.startsWith('config.')) return `config_${locale}.${path.slice('config.'.length)}`;
  return path;
}

function buildCandidates(page: string, locale: Locale, rawSettings: SiteSetting, settings: SiteSetting, blocks: SiteBlock[]): Candidate[] {
  const config = normalizeFullPageCms(rawSettings.fullPageCms);
  const groups = (EDITABLE_STRUCTURE_CATALOG as RuntimeGroup[]).filter(group => group.page === page || group.page === 'common' || group.page === 'layout');
  const structureCopyIds = new Set(groups.flatMap(group => group.items.flatMap(item => item.fields.map(field => field.copyId).filter((id): id is string => Boolean(id)))));
  const output: Candidate[] = [];

  for (const group of groups) {
    for (const { catalog, patch } of orderedStructureItems(group, config)) {
      output.push({
        id: `structure-item:${group.id}:${patch.id}`,
        sourceType: 'structure-item',
        label: `${group.label} → ${catalog.label}`,
        detail: `${group.source}:${group.line}`,
        kind: 'text', value: '', priority: -10, groupId: group.id, itemId: patch.id,
      });
      for (const field of catalog.fields) {
        const value = fieldValue(field, locale, config, patch);
        if (value === undefined || value === null || value === '') continue;
        output.push({
          id: `structure-field:${group.id}:${patch.id}:${field.key}`,
          sourceType: 'structure-field',
          label: `${group.label} → ${catalog.label} → ${field.key}`,
          detail: `${group.source}:${group.line}`,
          kind: valueKind(field.key, value), value, priority: 0,
          groupId: group.id, itemId: patch.id, field,
        });
      }
    }
  }

  for (const entry of EDITABLE_COPY_CATALOG) {
    if (!(entry.page === page || entry.page === 'common' || entry.page === 'layout')) continue;
    if (structureCopyIds.has(entry.id)) continue;
    const value = config.copyOverrides[entry.id]?.[locale] ?? entry[locale];
    if (!value) continue;
    output.push({
      id: `copy:${entry.id}`, sourceType: 'copy', label: entry.label, detail: `${entry.source}:${entry.line}`,
      kind: valueKind(entry.label, value), value, priority: 10, copyEntry: entry,
    });
  }

  for (const base of LOCALIZED_SETTING_BASES) {
    const display = (settings as unknown as Record<string, unknown>)[base];
    if (typeof display !== 'string' || !display.trim()) continue;
    const key = localizedSettingKey(base, locale);
    output.push({
      id: `setting:${key}`, sourceType: 'setting', label: `Site Settings → ${base}`,
      detail: `site_settings/global · ${key}`, kind: valueKind(base, display), value: display,
      priority: 30, settingKey: key,
    });
  }

  for (const [key, raw] of Object.entries(rawSettings as unknown as Record<string, unknown>)) {
    if (LOCALIZED_SETTING_BASES.has(key) || /_(uk|en)$/.test(key) || key === 'id' || key === 'fullPageCms' || key === 'heroSlides') continue;
    if (typeof raw !== 'string' || !raw.trim()) continue;
    output.push({
      id: `setting:${key}`, sourceType: 'setting', label: `Site Settings → ${key}`, detail: 'site_settings/global',
      kind: valueKind(key, raw), value: raw, priority: 35, settingKey: key,
    });
  }

  const heroTextFields = ['badge', 'title', 'subtitle', 'ctaPrimaryText', 'ctaSecondaryText'] as const;
  const heroCommonFields = ['url', 'mobileUrl', 'posterUrl', 'ctaPrimaryLink', 'ctaSecondaryLink', 'objectPosition'] as const;
  for (const slide of rawSettings.heroSlides || []) {
    for (const field of heroTextFields) {
      const storageField = locale === 'ru' ? field : `${field}_${locale}` as keyof HeroSlide;
      const raw = slide[storageField];
      if (typeof raw !== 'string' || !raw.trim()) continue;
      output.push({
        id: `hero:${slide.id}:${String(storageField)}`, sourceType: 'hero', label: `Hero → ${slide.id} → ${field}`,
        detail: `heroSlides.${slide.id}.${String(storageField)}`, kind: 'text', value: raw, priority: 20,
        heroId: slide.id, heroField: String(storageField),
      });
    }
    for (const field of heroCommonFields) {
      const raw = slide[field];
      if (typeof raw !== 'string' || !raw.trim()) continue;
      output.push({
        id: `hero:${slide.id}:${field}`, sourceType: 'hero', label: `Hero → ${slide.id} → ${field}`,
        detail: `heroSlides.${slide.id}.${field}`, kind: valueKind(field, raw), value: raw, priority: 15,
        heroId: slide.id, heroField: field,
      });
    }
  }

  for (const block of blocks) {
    if (block.page !== 'all' && block.page !== page) continue;
    if (block.title) {
      output.push({
        id: `block:${block.id}:title`, sourceType: 'block', label: `Page Builder → ${block.id} → title`, detail: block.type,
        kind: 'text', value: block.title, priority: 25, blockId: block.id, blockPath: localizedBlockPath('title', locale, false),
      });
    }
    for (const [key, raw] of Object.entries(block.config || {})) {
      if (typeof raw !== 'string' || !raw.trim()) continue;
      const common = COMMON_FIELD_RE.test(`config.${key}`);
      output.push({
        id: `block:${block.id}:config.${key}`, sourceType: 'block', label: `Page Builder → ${block.id} → ${key}`,
        detail: block.type, kind: valueKind(key, raw), value: raw, priority: 25,
        blockId: block.id, blockPath: localizedBlockPath(`config.${key}`, locale, common),
      });
    }
  }

  return output;
}

function ensureStructure(draft: FullPageCmsContent, group: RuntimeGroup) {
  if (!draft.structures[group.id]) draft.structures[group.id] = {
    items: group.items.map((item, index) => ({ id: item.id, enabled: true, order: index * 10 })),
  };
  return draft.structures[group.id];
}

function ensurePatch(draft: FullPageCmsContent, group: RuntimeGroup, itemId: string): StructureItemOverride {
  const structure = ensureStructure(draft, group);
  let patch = structure.items.find(item => item.id === itemId);
  if (!patch) {
    const index = group.items.findIndex(item => item.id === itemId);
    patch = { id: itemId, enabled: true, order: Math.max(index, 0) * 10 };
    structure.items.push(patch);
  }
  return patch;
}

function inputValue(value: StructureScalar): string { return value === null || value === undefined ? '' : String(value); }
function parseValue(kind: ValueKind, value: string, checked: boolean): StructureScalar {
  if (kind === 'boolean') return checked;
  if (kind === 'number') return Number.isFinite(Number(value)) ? Number(value) : 0;
  return value;
}

function attributeAliases(value: string): string[] {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const aliases = new Set([value]);
  if (value.startsWith('/') && base && !value.startsWith(`${base}/`) && value !== base) aliases.add(`${base}${value}`);
  if (base && value.startsWith(`${base}/`)) aliases.add(value.slice(base.length));
  return [...aliases];
}

export function CmsVisualInspector() {
  const { locale, rawSettings, settings, blocks } = useSiteContent();
  const { user } = useAuth();
  const page = useMemo(() => pageFromPath(window.location.pathname), []);
  const candidates = useMemo(() => buildCandidates(page, locale, rawSettings, settings, blocks), [blocks, locale, page, rawSettings, settings]);
  const groups = useMemo(() => (EDITABLE_STRUCTURE_CATALOG as RuntimeGroup[]).filter(group => group.page === page || group.page === 'common' || group.page === 'layout'), [page]);
  const displayConfig = useMemo(() => normalizeFullPageCms(rawSettings.fullPageCms), [rawSettings.fullPageCms]);
  const bindingsRef = useRef<WeakMap<HTMLElement, Candidate[]>>(new WeakMap());
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const selected = selectedCandidates.find(candidate => candidate.id === selectedId) || selectedCandidates[0] || null;

  useEffect(() => {
    let frame = 0;
    let scheduled = false;
    const rebuild = () => {
      scheduled = false;
      const map = new WeakMap<HTMLElement, Candidate[]>();
      bindingsRef.current = map;
      const bind = (element: HTMLElement, candidate: Candidate) => {
        const current = map.get(element) || [];
        if (!current.some(item => item.id === candidate.id)) map.set(element, [...current, candidate].sort((a, b) => a.priority - b.priority));
      };
      const byText = new Map<string, Candidate[]>();
      const byAttribute = new Map<string, Candidate[]>();
      const structureEntries = candidates.filter((item): item is Candidate => item.sourceType === 'structure-item');
      const structureItems = new Map<string, Candidate>(structureEntries.map(item => [`${item.groupId}:${item.itemId}`, item] as [string, Candidate]));

      for (const candidate of candidates) {
        if (candidate.sourceType === 'structure-item' || candidate.value === null || typeof candidate.value === 'boolean') continue;
        const text = canonicalText(String(candidate.value));
        if (text.length >= 2) byText.set(text, [...(byText.get(text) || []), candidate]);
        if ((candidate.kind === 'url' || candidate.kind === 'media') && typeof candidate.value === 'string') {
          for (const alias of attributeAliases(candidate.value)) byAttribute.set(alias, [...(byAttribute.get(alias) || []), candidate]);
        }
      }

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || parent.closest('[data-cms-inspector-ui]') || parent.closest('script,style,noscript,textarea,input,select,option')) return NodeFilter.FILTER_REJECT;
          return canonicalText(node.textContent || '').length >= 2 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      let node: Node | null = walker.nextNode();
      while (node) {
        const parent = node.parentElement;
        const matches = byText.get(canonicalText(node.textContent || ''));
        if (parent && matches) matches.forEach(candidate => bind(parent, candidate));
        node = walker.nextNode();
      }

      document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6,p,span,a,button,li,dt,dd,strong,em,small,label').forEach(element => {
        if (element.closest('[data-cms-inspector-ui]')) return;
        const text = canonicalText(element.innerText || element.textContent || '');
        if (!text || text.length > 500) return;
        (byText.get(text) || []).forEach(candidate => bind(element, candidate));
      });

      document.querySelectorAll<HTMLElement>('a[href],img[src],video[src],source[src],source[srcset]').forEach(element => {
        if (element.closest('[data-cms-inspector-ui]')) return;
        for (const name of ['href', 'src', 'srcset']) {
          const attribute = element.getAttribute(name);
          if (attribute) (byAttribute.get(attribute) || []).forEach(candidate => bind(element, candidate));
        }
      });

      document.querySelectorAll<HTMLElement>('[data-cms-structure-item][data-cms-structure-group]').forEach(element => {
        const candidate = structureItems.get(`${element.dataset.cmsStructureGroup}:${element.dataset.cmsStructureItem}`);
        if (candidate) bind(element, candidate);
      });
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      frame = window.requestAnimationFrame(rebuild);
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const late = window.setTimeout(schedule, 500);
    return () => {
      observer.disconnect();
      window.clearTimeout(late);
      window.cancelAnimationFrame(frame);
    };
  }, [candidates]);

  const findBinding = (target: HTMLElement | null): { element: HTMLElement; candidates: Candidate[] } | null => {
    let element = target;
    while (element && element !== document.body) {
      if (element.closest('[data-cms-inspector-ui]')) return null;
      const found = bindingsRef.current.get(element);
      if (found?.length) return { element, candidates: found };
      element = element.parentElement;
    }
    return null;
  };

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const found = findBinding(event.target as HTMLElement | null);
      setHoverRect(found ? found.element.getBoundingClientRect() : null);
    };
    const click = (event: MouseEvent) => {
      const found = findBinding(event.target as HTMLElement | null);
      if (!found) return;
      event.preventDefault();
      event.stopPropagation();
      const candidate = found.candidates[0];
      setSelectedCandidates(found.candidates);
      setSelectedId(candidate.id);
      setValue(inputValue(candidate.value));
      setChecked(Boolean(candidate.value));
      setHoverRect(found.element.getBoundingClientRect());
    };
    document.addEventListener('pointermove', move, true);
    document.addEventListener('click', click, true);
    return () => {
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('click', click, true);
    };
  }, [candidates]);

  useEffect(() => {
    if (!selected) return;
    setValue(inputValue(selected.value));
    setChecked(Boolean(selected.value));
  }, [selectedId, selected?.value]);

  const mutateDraft = async (mutator: (draft: FullPageCmsContent, canonical: ReturnType<typeof normalizeFullPageCms>) => void) => {
    if (!user) return;
    const ref = doc(db, 'site_settings', 'global');
    const snapshot = await getDoc(ref);
    const canonical = normalizeFullPageCms(snapshot.exists() ? snapshot.data().fullPageCms : rawSettings.fullPageCms);
    const draft = clone(canonical.draft);
    mutator(draft, canonical);
    const next = replaceFullPageDraft(canonical, draft, user.email || user.uid);
    await versionedUpdateDoc(ref, { fullPageCms: next, updatedAt: Date.now() });
  };

  const saveCandidate = async () => {
    if (!selected || !user || selected.sourceType === 'structure-item') return;
    setSaving(true);
    try {
      const nextValue = parseValue(selected.kind, value, checked);
      if (selected.sourceType === 'copy' && selected.copyEntry) {
        await mutateDraft(draft => {
          const entry = selected.copyEntry!;
          const current = draft.copyOverrides[entry.id] || {};
          if (String(nextValue ?? '') === entry[locale]) delete current[locale]; else current[locale] = String(nextValue ?? '');
          if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete draft.copyOverrides[entry.id];
          else draft.copyOverrides[entry.id] = current;
        });
      } else if (selected.sourceType === 'structure-field' && selected.groupId && selected.itemId && selected.field) {
        const group = groups.find(item => item.id === selected.groupId);
        if (!group) return;
        await mutateDraft(draft => {
          const patch = ensurePatch(draft, group, selected.itemId!);
          const field = selected.field!;
          if ((field.scope || 'locale') === 'common') {
            patch.common = { ...(patch.common || {}) };
            if (nextValue === field.common) delete patch.common[field.key]; else patch.common[field.key] = nextValue;
          } else if (patch.cloneFromId) {
            patch.locales = patch.locales || {};
            patch.locales[locale] = { ...(patch.locales[locale] || {}), [field.key]: String(nextValue ?? '') };
          } else if (field.copyId) {
            const current = draft.copyOverrides[field.copyId] || {};
            if (String(nextValue ?? '') === (field[locale] || '')) delete current[locale]; else current[locale] = String(nextValue ?? '');
            if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete draft.copyOverrides[field.copyId];
            else draft.copyOverrides[field.copyId] = current;
          }
        });
      } else if (selected.sourceType === 'setting' && selected.settingKey) {
        await versionedUpdateDoc(doc(db, 'site_settings', 'global'), { [selected.settingKey]: nextValue, updatedAt: Date.now() });
      } else if (selected.sourceType === 'hero' && selected.heroId && selected.heroField) {
        const ref = doc(db, 'site_settings', 'global');
        const snapshot = await getDoc(ref);
        const source = snapshot.exists() ? snapshot.data() as SiteSetting : rawSettings;
        const heroSlides = clone(source.heroSlides || []);
        const slide = heroSlides.find(item => item.id === selected.heroId);
        if (!slide) return;
        (slide as unknown as Record<string, StructureScalar>)[selected.heroField] = nextValue;
        await versionedUpdateDoc(ref, { heroSlides, updatedAt: Date.now() });
      } else if (selected.sourceType === 'block' && selected.blockId && selected.blockPath) {
        await versionedUpdateDoc(doc(db, 'site_blocks', selected.blockId), { [selected.blockPath]: nextValue, updatedAt: Date.now() });
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } finally { setSaving(false); }
  };

  const structureContext = selected?.groupId && selected.itemId ? {
    group: groups.find(group => group.id === selected.groupId),
    itemId: selected.itemId,
  } : null;

  const mutateStructure = async (operation: 'toggle' | 'up' | 'down' | 'duplicate' | 'delete' | 'layout', layout?: StructureLayout) => {
    if (!structureContext?.group || !user) return;
    const group = structureContext.group;
    const itemId = structureContext.itemId;
    await mutateDraft((draft, canonical) => {
      const structure = ensureStructure(draft, group);
      const currentConfig: RuntimeContent = canonical.draft;
      const order = orderedStructureItems(group, currentConfig).map(entry => entry.patch.id);
      const patch = ensurePatch(draft, group, itemId);
      if (operation === 'toggle') patch.enabled = patch.enabled === false;
      if (operation === 'layout') structure.layout = layout || 'auto';
      if (operation === 'delete' && patch.cloneFromId) structure.items = structure.items.filter(item => item.id !== itemId);
      if (operation === 'up' || operation === 'down') {
        const index = order.indexOf(itemId);
        const target = index + (operation === 'up' ? -1 : 1);
        if (index >= 0 && target >= 0 && target < order.length) {
          [order[index], order[target]] = [order[target], order[index]];
          order.forEach((id, indexValue) => { ensurePatch(draft, group, id).order = indexValue * 10; });
        }
      }
      if (operation === 'duplicate') {
        const current = orderedStructureItems(group, currentConfig).find(entry => entry.patch.id === itemId);
        if (!current) return;
        const sourceId = current.patch.cloneFromId || current.catalog.id;
        const id = `added-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const common: Record<string, StructureScalar> = {};
        const locales: StructureItemOverride['locales'] = {};
        for (const field of current.catalog.fields) {
          if ((field.scope || 'locale') === 'common') {
            const currentValue = fieldValue(field, locale, currentConfig, current.patch);
            if (currentValue !== undefined) common[field.key] = currentValue;
          } else {
            for (const lang of LANGS) {
              locales[lang] = locales[lang] || {};
              locales[lang]![field.key] = String(fieldValue(field, lang, currentConfig, current.patch) ?? '');
            }
          }
        }
        structure.items.push({
          id, cloneFromId: sourceId, enabled: true,
          order: Math.max(0, ...structure.items.map(item => item.order || 0)) + 10,
          ...(Object.keys(common).length ? { common } : {}), locales,
        });
      }
    });
  };

  const structurePatch = structureContext?.group ? displayConfig.structures[structureContext.group.id]?.items.find(item => item.id === structureContext.itemId) : undefined;
  const structureLayout: StructureLayout = structureContext?.group ? displayConfig.structures[structureContext.group.id]?.layout || 'auto' : 'auto';

  return <>
    {hoverRect && <div data-cms-inspector-ui className="pointer-events-none fixed z-[9997] rounded-md border-2 border-fuchsia-500 bg-fuchsia-400/10" style={{ left: hoverRect.left, top: hoverRect.top, width: hoverRect.width, height: hoverRect.height }} />}
    <div data-cms-inspector-ui className="fixed bottom-4 left-4 z-[9998] flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-2xl"><MousePointer2 className="h-4 w-4 text-fuchsia-400" />Visual CMS Inspector 2.0 · {page} · {locale.toUpperCase()}</div>
    {selected && <aside data-cms-inspector-ui className="fixed right-4 top-20 z-[9999] max-h-[calc(100vh-6rem)] w-[min(460px,calc(100vw-2rem))] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-950 p-5 text-white shadow-2xl">
      <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-wider text-fuchsia-400">{selected.sourceType} · {selected.kind}</div><div className="mt-1 text-sm font-black">{selected.label}</div><div className="mt-1 font-mono text-[9px] text-slate-500">{selected.detail}</div></div><button onClick={() => setSelectedCandidates([])} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button></div>

      {selectedCandidates.length > 1 && <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3"><div className="mb-2 text-[10px] font-black uppercase text-amber-300">Несколько CMS-привязок</div><div className="flex flex-wrap gap-1.5">{selectedCandidates.map(candidate => <button key={candidate.id} onClick={() => setSelectedId(candidate.id)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${selected.id === candidate.id ? 'bg-amber-300 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{candidate.label.slice(0, 42)}</button>)}</div></div>}

      {!user ? <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Для сохранения войдите в /admin в этом браузере.</div> : selected.sourceType !== 'structure-item' && <div className="mt-4">
        {selected.kind === 'boolean' ? <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />Включено</label> : selected.kind === 'text' ? <textarea rows={5} value={value} onChange={event => setValue(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-fuchsia-500" /> : <input type={selected.kind === 'number' ? 'number' : 'text'} value={value} onChange={event => setValue(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-fuchsia-500" />}
        <button onClick={() => void saveCandidate()} disabled={saving} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-xs font-black text-white hover:bg-fuchsia-500 disabled:opacity-50"><Save className="h-4 w-4" />{selected.sourceType === 'copy' || selected.sourceType === 'structure-field' ? 'Сохранить в Draft' : 'Сохранить'}</button>
        {saved && <span className="ml-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 className="h-4 w-4" />Сохранено</span>}
        {(selected.sourceType === 'setting' || selected.sourceType === 'hero' || selected.sourceType === 'block') && <div className="mt-2 text-[10px] leading-relaxed text-amber-300">Этот источник относится к существующему Site Settings/Page Builder workflow и сохраняется сразу; перед изменением автоматически создаётся Undo snapshot.</div>}
      </div>}

      {user && structureContext?.group && <div className="mt-5 border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><GripVertical className="h-3.5 w-3.5" />Структура элемента</div>
        <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => void mutateStructure('up')} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-800">↑ Выше</button><button onClick={() => void mutateStructure('down')} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-800">↓ Ниже</button><button onClick={() => void mutateStructure('toggle')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-800">{structurePatch?.enabled === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{structurePatch?.enabled === false ? 'Показать' : 'Скрыть'}</button><button onClick={() => void mutateStructure('duplicate')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-800"><Copy className="h-3.5 w-3.5" />Дублировать</button></div>
        {structurePatch?.cloneFromId && <button onClick={() => void mutateStructure('delete')} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" />Удалить добавленный элемент</button>}
        <label className="mt-3 block"><span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Layout секции</span><select value={structureLayout} onChange={event => void mutateStructure('layout', event.target.value as StructureLayout)} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"><option value="auto">Исходный</option><option value="stack">1 колонка</option><option value="grid-2">2 колонки</option><option value="grid-3">3 колонки</option><option value="grid-4">4 колонки</option></select></label>
      </div>}
    </aside>}
  </>;
}
