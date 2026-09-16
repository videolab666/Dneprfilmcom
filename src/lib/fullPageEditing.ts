import type { Locale } from '../types';
import { legacyText, legacyValue } from '../locales/legacyEnglish';

export interface EditableCopyOverride {
  uk?: string;
  ru?: string;
  en?: string;
}

export interface LiveCalculatorPricing {
  base: number;
  camera: number;
  starlink: number;
  graphics: number;
  replay: number;
  translation: number;
  led: number;
  sports: number;
}

export interface VideoCalculatorPricing {
  base: number;
  videoType: {
    commercial: number;
    factory: number;
    corporate: number;
    event: number;
  };
  duration: {
    '30s': number;
    '60s': number;
    '2m': number;
    '5m+': number;
  };
  script: number;
  actors: number;
  drone: number;
  voiceover: number;
  graphics3d: number;
}

export interface ConstructionCalculatorPricing {
  timelapseCameraMonthly: number;
  droneMonthly: number;
  droneBiweekly: number;
  droneWeekly: number;
  windowPanoramasMonthly: number;
  monthlyReels: number;
  liveStreamMonthly: number;
}

export type StructureScalar = string | number | boolean | null;

export interface StructureItemOverride {
  id: string;
  cloneFromId?: string;
  enabled?: boolean;
  order?: number;
  common?: Record<string, StructureScalar>;
  locales?: Partial<Record<Locale, Record<string, string>>>;
}

export interface StructureOverride {
  items: StructureItemOverride[];
}

export interface FullPageCmsContent {
  copyOverrides: Record<string, EditableCopyOverride>;
  calculators: {
    live: LiveCalculatorPricing;
    video: VideoCalculatorPricing;
    construction: ConstructionCalculatorPricing;
  };
  structures: Record<string, StructureOverride>;
}

export interface FullPageCmsWorkflow {
  draftUpdatedAt?: number;
  draftBy?: string;
  publishedAt?: number;
  publishedBy?: string;
  scheduledAt?: number | null;
}

export interface FullPageCmsConfig extends FullPageCmsContent {
  version: 4;
  draft: FullPageCmsContent;
  scheduled?: FullPageCmsContent;
  workflow: FullPageCmsWorkflow;
}

const DEFAULT_CONTENT: FullPageCmsContent = {
  copyOverrides: {},
  calculators: {
    live: {
      base: 12000,
      camera: 4500,
      starlink: 5000,
      graphics: 3500,
      replay: 4500,
      translation: 4000,
      led: 3000,
      sports: 3000,
    },
    video: {
      base: 15000,
      videoType: {
        commercial: 10000,
        factory: 12000,
        corporate: 14000,
        event: 5000,
      },
      duration: {
        '30s': 0,
        '60s': 3000,
        '2m': 7000,
        '5m+': 15000,
      },
      script: 4000,
      actors: 8000,
      drone: 4500,
      voiceover: 3000,
      graphics3d: 9000,
    },
    construction: {
      timelapseCameraMonthly: 4500,
      droneMonthly: 6000,
      droneBiweekly: 11000,
      droneWeekly: 20000,
      windowPanoramasMonthly: 3500,
      monthlyReels: 4000,
      liveStreamMonthly: 3000,
    },
  },
  structures: {},
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const DEFAULT_FULL_PAGE_CMS: FullPageCmsConfig = {
  version: 4,
  ...clone(DEFAULT_CONTENT),
  draft: clone(DEFAULT_CONTENT),
  workflow: {},
};

function finiteNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

function normalizeContent(input: unknown): FullPageCmsContent {
  const source = input && typeof input === 'object' ? input as Partial<FullPageCmsContent> : {};
  const calculators = source.calculators || {} as FullPageCmsContent['calculators'];
  const live = calculators.live || {} as LiveCalculatorPricing;
  const video = calculators.video || {} as VideoCalculatorPricing;
  const construction = calculators.construction || {} as ConstructionCalculatorPricing;
  return {
    copyOverrides: source.copyOverrides && typeof source.copyOverrides === 'object' ? source.copyOverrides : {},
    structures: source.structures && typeof source.structures === 'object' ? source.structures : {},
    calculators: {
      live: {
        base: finiteNumber(live.base, DEFAULT_CONTENT.calculators.live.base),
        camera: finiteNumber(live.camera, DEFAULT_CONTENT.calculators.live.camera),
        starlink: finiteNumber(live.starlink, DEFAULT_CONTENT.calculators.live.starlink),
        graphics: finiteNumber(live.graphics, DEFAULT_CONTENT.calculators.live.graphics),
        replay: finiteNumber(live.replay, DEFAULT_CONTENT.calculators.live.replay),
        translation: finiteNumber(live.translation, DEFAULT_CONTENT.calculators.live.translation),
        led: finiteNumber(live.led, DEFAULT_CONTENT.calculators.live.led),
        sports: finiteNumber(live.sports, DEFAULT_CONTENT.calculators.live.sports),
      },
      video: {
        base: finiteNumber(video.base, DEFAULT_CONTENT.calculators.video.base),
        videoType: {
          commercial: finiteNumber(video.videoType?.commercial, DEFAULT_CONTENT.calculators.video.videoType.commercial),
          factory: finiteNumber(video.videoType?.factory, DEFAULT_CONTENT.calculators.video.videoType.factory),
          corporate: finiteNumber(video.videoType?.corporate, DEFAULT_CONTENT.calculators.video.videoType.corporate),
          event: finiteNumber(video.videoType?.event, DEFAULT_CONTENT.calculators.video.videoType.event),
        },
        duration: {
          '30s': finiteNumber(video.duration?.['30s'], DEFAULT_CONTENT.calculators.video.duration['30s']),
          '60s': finiteNumber(video.duration?.['60s'], DEFAULT_CONTENT.calculators.video.duration['60s']),
          '2m': finiteNumber(video.duration?.['2m'], DEFAULT_CONTENT.calculators.video.duration['2m']),
          '5m+': finiteNumber(video.duration?.['5m+'], DEFAULT_CONTENT.calculators.video.duration['5m+']),
        },
        script: finiteNumber(video.script, DEFAULT_CONTENT.calculators.video.script),
        actors: finiteNumber(video.actors, DEFAULT_CONTENT.calculators.video.actors),
        drone: finiteNumber(video.drone, DEFAULT_CONTENT.calculators.video.drone),
        voiceover: finiteNumber(video.voiceover, DEFAULT_CONTENT.calculators.video.voiceover),
        graphics3d: finiteNumber(video.graphics3d, DEFAULT_CONTENT.calculators.video.graphics3d),
      },
      construction: {
        timelapseCameraMonthly: finiteNumber(construction.timelapseCameraMonthly, DEFAULT_CONTENT.calculators.construction.timelapseCameraMonthly),
        droneMonthly: finiteNumber(construction.droneMonthly, DEFAULT_CONTENT.calculators.construction.droneMonthly),
        droneBiweekly: finiteNumber(construction.droneBiweekly, DEFAULT_CONTENT.calculators.construction.droneBiweekly),
        droneWeekly: finiteNumber(construction.droneWeekly, DEFAULT_CONTENT.calculators.construction.droneWeekly),
        windowPanoramasMonthly: finiteNumber(construction.windowPanoramasMonthly, DEFAULT_CONTENT.calculators.construction.windowPanoramasMonthly),
        monthlyReels: finiteNumber(construction.monthlyReels, DEFAULT_CONTENT.calculators.construction.monthlyReels),
        liveStreamMonthly: finiteNumber(construction.liveStreamMonthly, DEFAULT_CONTENT.calculators.construction.liveStreamMonthly),
      },
    },
  };
}

export function normalizeFullPageCms(input: unknown): FullPageCmsConfig {
  const source = input && typeof input === 'object' ? input as Partial<FullPageCmsConfig> & { version?: number } : {};
  const published = normalizeContent(source);
  const draft = source.version === 4 && source.draft ? normalizeContent(source.draft) : clone(published);
  const workflow = source.version === 4 && source.workflow && typeof source.workflow === 'object' ? source.workflow : {};
  const scheduled = source.version === 4 && source.scheduled ? normalizeContent(source.scheduled) : undefined;
  return { version: 4, ...published, draft, scheduled, workflow };
}

export function fullPageRuntimeConfig(input: unknown, options?: { preview?: boolean; now?: number }): FullPageCmsConfig {
  const config = normalizeFullPageCms(input);
  const now = options?.now ?? Date.now();
  const scheduledDue = typeof config.workflow.scheduledAt === 'number' && config.workflow.scheduledAt > 0 && config.workflow.scheduledAt <= now;
  if (options?.preview) return { ...config, ...clone(config.draft) };
  if (scheduledDue) return { ...config, ...clone(config.scheduled || config.draft) };
  return config;
}

export function publishFullPageDraft(input: unknown, actor?: string): FullPageCmsConfig {
  const config = normalizeFullPageCms(input);
  return {
    ...config,
    ...clone(config.draft),
    scheduled: undefined,
    workflow: {
      ...config.workflow,
      publishedAt: Date.now(),
      publishedBy: actor || config.workflow.publishedBy,
      scheduledAt: null,
    },
  };
}

export function replaceFullPageDraft(input: unknown, draft: FullPageCmsContent, actor?: string): FullPageCmsConfig {
  const config = normalizeFullPageCms(input);
  return {
    ...config,
    draft: normalizeContent(draft),
    workflow: { ...config.workflow, draftUpdatedAt: Date.now(), draftBy: actor || config.workflow.draftBy },
  };
}

export function discardFullPageDraft(input: unknown): FullPageCmsConfig {
  const config = normalizeFullPageCms(input);
  return {
    ...config,
    draft: normalizeContent(config),
    workflow: { ...config.workflow, draftUpdatedAt: Date.now() },
  };
}

function hashKey(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function copyOverrideKey(uk: string, ru: string, en?: string): string {
  return `copy:${hashKey(`${uk}\u0000${ru}\u0000${en || ''}`)}`;
}

export function translationOverrideKey(key: string): string {
  return `t:${key}`;
}

function topLevelStringSignature(value: unknown): unknown {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object' || Array.isArray(item)) return '';
    return Object.keys(item as Record<string, unknown>)
      .sort()
      .flatMap(key => {
        const field = (item as Record<string, unknown>)[key];
        return typeof field === 'string' ? [`${key}:${field}`] : [];
      });
  });
}

export function legacyStructureKey(uk: unknown, ru: unknown): string {
  return `structure:${hashKey(JSON.stringify([topLevelStringSignature(uk), topLevelStringSignature(ru)]))}`;
}

export function legacyStructureItemId(uk: unknown, ru: unknown, index: number): string {
  return `item:${hashKey(JSON.stringify([index, topLevelStringSignature([uk]), topLevelStringSignature([ru])]))}`;
}

function overrideValue(locale: Locale, overrides: Record<string, EditableCopyOverride> | undefined, key: string): string | undefined {
  const value = overrides?.[key]?.[locale];
  return typeof value === 'string' ? value : undefined;
}

export function resolveEditableCopy(
  locale: Locale,
  uk: string,
  ru: string,
  en: string | undefined,
  overrides: Record<string, EditableCopyOverride> | undefined,
): string {
  const override = overrideValue(locale, overrides, copyOverrideKey(uk, ru, en));
  if (override !== undefined) return override;
  return legacyText(locale, uk, ru, en);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if ('$$typeof' in (value as Record<string, unknown>)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function cloneRuntime<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => cloneRuntime(item)) as T;
  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) output[key] = cloneRuntime(item);
    return output as T;
  }
  return value;
}

function setPath(target: unknown, path: string, value: unknown): unknown {
  if (!isPlainObject(target)) return target;
  const parts = path.split('.').filter(Boolean);
  if (!parts.length) return target;
  const output = cloneRuntime(target);
  let cursor = output as Record<string, unknown>;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    const current = cursor[part];
    if (!isPlainObject(current)) cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
  return output;
}

function applyStructurePatch<T>(value: T, patch: StructureItemOverride | undefined, locale: Locale): T {
  if (!patch) return value;
  let output: unknown = cloneRuntime(value);
  for (const [path, fieldValue] of Object.entries(patch.common || {})) output = setPath(output, path, fieldValue);
  for (const [path, fieldValue] of Object.entries(patch.locales?.[locale] || {})) output = setPath(output, path, fieldValue);
  return output as T;
}

export function resolveEditableLegacy<T>(
  locale: Locale,
  uk: T,
  ru: T,
  overrides: Record<string, EditableCopyOverride> | undefined,
  structures?: Record<string, StructureOverride>,
): T {
  if (typeof uk === 'string' && typeof ru === 'string') {
    return resolveEditableCopy(locale, uk, ru, undefined, overrides) as T;
  }

  if (Array.isArray(uk) && Array.isArray(ru)) {
    const count = Math.min(uk.length, ru.length);
    const localized: unknown[] = [];
    for (let index = 0; index < count; index += 1) {
      localized.push(resolveEditableLegacy(locale, uk[index], ru[index], overrides, structures));
    }
    const preferred = locale === 'ru' ? ru : uk;
    for (let index = count; index < preferred.length; index += 1) localized.push(cloneRuntime(preferred[index]));

    const structure = structures?.[legacyStructureKey(uk, ru)];
    if (!structure?.items?.length) return localized as T;

    const originals = localized.map((value, index) => ({
      id: legacyStructureItemId(uk[index], ru[index], index),
      value,
      defaultOrder: index * 10,
    }));
    const byId = new Map(originals.map(item => [item.id, item]));
    const patches = new Map(structure.items.map(item => [item.id, item]));
    const output: Array<{ id: string; value: unknown; order: number }> = [];

    for (const original of originals) {
      const patch = patches.get(original.id);
      if (patch?.enabled === false) continue;
      output.push({ id: original.id, value: applyStructurePatch(original.value, patch, locale), order: patch?.order ?? original.defaultOrder });
    }

    for (const patch of structure.items) {
      if (!patch.cloneFromId || byId.has(patch.id) || patch.enabled === false) continue;
      const source = byId.get(patch.cloneFromId);
      if (!source) continue;
      output.push({ id: patch.id, value: applyStructurePatch(source.value, patch, locale), order: patch.order ?? output.length * 10 + 1000 });
    }

    output.sort((a, b) => a.order - b.order);
    return output.map(item => item.value) as T;
  }

  if (isPlainObject(uk) && isPlainObject(ru)) {
    const preferred = (locale === 'ru' ? ru : uk) as Record<string, unknown>;
    const output: Record<string, unknown> = { ...preferred };
    for (const key of Object.keys(preferred)) {
      if (key in uk && key in ru) output[key] = resolveEditableLegacy(locale, uk[key], ru[key], overrides, structures);
    }
    return output as T;
  }

  return legacyValue(locale, uk, ru);
}
