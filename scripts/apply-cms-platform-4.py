from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def write(path: str, content: str):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.strip() + "\n", encoding="utf-8")

# -----------------------------------------------------------------------------
# Full Page CMS v4: published + draft + structures + scheduling/runtime preview.
# -----------------------------------------------------------------------------
write('src/lib/fullPageEditing.ts', r'''
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
  return { version: 4, ...published, draft, workflow };
}

export function fullPageRuntimeConfig(input: unknown, options?: { preview?: boolean; now?: number }): FullPageCmsConfig {
  const config = normalizeFullPageCms(input);
  const now = options?.now ?? Date.now();
  const scheduled = typeof config.workflow.scheduledAt === 'number' && config.workflow.scheduledAt > 0 && config.workflow.scheduledAt <= now;
  if (!options?.preview && !scheduled) return config;
  return { ...config, ...clone(config.draft) };
}

export function publishFullPageDraft(input: unknown, actor?: string): FullPageCmsConfig {
  const config = normalizeFullPageCms(input);
  return {
    ...config,
    ...clone(config.draft),
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
    workflow: { ...config.workflow, draftUpdatedAt: Date.now(), scheduledAt: null },
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
''')

# -----------------------------------------------------------------------------
# Generator now emits both copy catalog and editable legacy-structure catalog.
# -----------------------------------------------------------------------------
write('scripts/generate-editable-copy-catalog.ts', r'''
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { TRANSLATIONS } from '../src/locales/translations';
import { legacyText } from '../src/locales/legacyEnglish';
import { copyOverrideKey, legacyStructureItemId, legacyStructureKey, translationOverrideKey } from '../src/lib/fullPageEditing';

interface CatalogEntry {
  id: string;
  kind: 'l' | 't' | 'legacy';
  page: string;
  source: string;
  line: number;
  label: string;
  uk: string;
  ru: string;
  en: string;
}

interface StructureFieldEntry {
  key: string;
  copyId: string;
  uk: string;
  ru: string;
  en: string;
}

interface StructureItemEntry {
  id: string;
  label: string;
  fields: StructureFieldEntry[];
}

interface StructureCatalogEntry {
  id: string;
  page: string;
  source: string;
  line: number;
  label: string;
  items: StructureItemEntry[];
}

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const outputPath = path.join(srcRoot, 'generated', 'editableCopyCatalog.ts');
const structuresOutputPath = path.join(srcRoot, 'generated', 'editableStructureCatalog.ts');

function walk(directory: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'generated' || entry.name === 'admin') continue;
      result.push(...walk(absolute));
      continue;
    }
    if (/\.(tsx?|jsx?)$/.test(entry.name)) result.push(absolute);
  }
  return result;
}

function pageFromSource(relative: string): string {
  const normalized = relative.replace(/\\/g, '/');
  if (/pages\/Home\.tsx|components\/home\//.test(normalized)) return 'home';
  if (/LiveProduction/.test(normalized)) return 'live';
  if (/VideoProduction/.test(normalized)) return 'video';
  if (/ConstructionMedia/.test(normalized)) return 'construction';
  if (/PhotoProduction/.test(normalized)) return 'photo';
  if (/About/.test(normalized)) return 'about';
  if (/Contacts/.test(normalized)) return 'contacts';
  if (/CaseDetail/.test(normalized)) return 'case-detail';
  if (/pages\/Cases\.tsx/.test(normalized)) return 'cases';
  if (/VideoDetail/.test(normalized)) return 'video-detail';
  if (/pages\/Videos\.tsx/.test(normalized)) return 'videos';
  if (/GalleryDetail/.test(normalized)) return 'gallery-detail';
  if (/pages\/Galleries\.tsx/.test(normalized)) return 'galleries';
  if (/ArticleDetail/.test(normalized)) return 'article-detail';
  if (/MediaCenter/.test(normalized)) return 'media-center';
  if (/layout\//.test(normalized)) return 'layout';
  if (/portfolio\//.test(normalized)) return 'portfolio-ui';
  return 'common';
}

const files = walk(srcRoot).filter(file => {
  const normalized = file.replace(/\\/g, '/');
  return !normalized.includes('/components/admin/') && !normalized.includes('/pages/Admin') && !normalized.includes('/components/ProtectedRoute');
});

const program = ts.createProgram(files, {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: false,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();
const entries = new Map<string, CatalogEntry>();
const structures = new Map<string, StructureCatalogEntry>();

function unwrap(node: ts.Expression | undefined, seen = new Set<ts.Node>()): ts.Expression | undefined {
  if (!node || seen.has(node)) return node;
  seen.add(node);
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) return unwrap(node.expression, seen);
  if (!ts.isIdentifier(node)) return node;
  let symbol = checker.getSymbolAtLocation(node);
  if (!symbol) return node;
  if (symbol.flags & ts.SymbolFlags.Alias) {
    try { symbol = checker.getAliasedSymbol(symbol); } catch { return node; }
  }
  for (const declaration of symbol.declarations || []) {
    if (ts.isVariableDeclaration(declaration) && declaration.initializer) return unwrap(declaration.initializer, seen);
    if (ts.isPropertyAssignment(declaration)) return unwrap(declaration.initializer, seen);
  }
  return node;
}

function stringValue(node: ts.Expression | undefined): string | undefined {
  const resolved = unwrap(node);
  if (!resolved) return undefined;
  if (ts.isStringLiteralLike(resolved) || ts.isNoSubstitutionTemplateLiteral(resolved)) return resolved.text;
  return undefined;
}

function propertyName(node: ts.ObjectLiteralElementLike): string | undefined {
  if (!('name' in node) || !node.name) return undefined;
  if (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name) || ts.isNumericLiteral(node.name)) return node.name.text;
  return undefined;
}

function sourceInfo(sourceFile: ts.SourceFile, node: ts.Node) {
  const relative = path.relative(root, sourceFile.fileName).replace(/\\/g, '/');
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  return { source: relative, line, page: pageFromSource(relative) };
}

function shortLabel(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 90) || 'Пустой текст';
}

function addPair(kind: 'l' | 'legacy', uk: string, ru: string, en: string | undefined, sourceFile: ts.SourceFile, node: ts.Node) {
  if (!uk && !ru) return;
  const id = copyOverrideKey(uk, ru, en);
  const info = sourceInfo(sourceFile, node);
  const normalizedEn = en || legacyText('en', uk, ru);
  const existing = entries.get(id);
  if (existing) {
    if (!existing.source.includes(info.source)) existing.source += `, ${info.source}`;
    return;
  }
  entries.set(id, { id, kind, ...info, label: shortLabel(uk || ru), uk, ru, en: normalizedEn });
}

function pairObjectProperties(left: ts.ObjectLiteralExpression, right: ts.ObjectLiteralExpression) {
  const leftMap = new Map<string, ts.Expression>();
  const rightMap = new Map<string, ts.Expression>();
  for (const property of left.properties) {
    const name = propertyName(property);
    if (!name) continue;
    if (ts.isPropertyAssignment(property)) leftMap.set(name, property.initializer);
    if (ts.isShorthandPropertyAssignment(property)) leftMap.set(name, property.name);
  }
  for (const property of right.properties) {
    const name = propertyName(property);
    if (!name) continue;
    if (ts.isPropertyAssignment(property)) rightMap.set(name, property.initializer);
    if (ts.isShorthandPropertyAssignment(property)) rightMap.set(name, property.name);
  }
  return { leftMap, rightMap };
}

function collectLegacyPair(leftNode: ts.Expression | undefined, rightNode: ts.Expression | undefined, sourceFile: ts.SourceFile, anchor: ts.Node, depth = 0) {
  if (depth > 12) return;
  const left = unwrap(leftNode);
  const right = unwrap(rightNode);
  if (!left || !right) return;
  const uk = stringValue(left);
  const ru = stringValue(right);
  if (uk !== undefined && ru !== undefined) {
    addPair('legacy', uk, ru, undefined, sourceFile, anchor);
    return;
  }
  if (ts.isArrayLiteralExpression(left) && ts.isArrayLiteralExpression(right)) {
    const count = Math.min(left.elements.length, right.elements.length);
    for (let index = 0; index < count; index += 1) collectLegacyPair(left.elements[index], right.elements[index], sourceFile, anchor, depth + 1);
    return;
  }
  if (ts.isObjectLiteralExpression(left) && ts.isObjectLiteralExpression(right)) {
    const { leftMap, rightMap } = pairObjectProperties(left, right);
    for (const [name, a] of leftMap.entries()) {
      const b = rightMap.get(name);
      if (b) collectLegacyPair(a, b, sourceFile, anchor, depth + 1);
    }
  }
}

function collectStructure(leftNode: ts.Expression | undefined, rightNode: ts.Expression | undefined, sourceFile: ts.SourceFile, anchor: ts.Node) {
  const left = unwrap(leftNode);
  const right = unwrap(rightNode);
  if (!left || !right || !ts.isArrayLiteralExpression(left) || !ts.isArrayLiteralExpression(right)) return;
  const count = Math.min(left.elements.length, right.elements.length);
  if (count < 2) return;
  const ukSkeleton: Array<Record<string, string>> = [];
  const ruSkeleton: Array<Record<string, string>> = [];
  const items: StructureItemEntry[] = [];

  for (let index = 0; index < count; index += 1) {
    const a = unwrap(left.elements[index]);
    const b = unwrap(right.elements[index]);
    if (!a || !b || !ts.isObjectLiteralExpression(a) || !ts.isObjectLiteralExpression(b)) return;
    const { leftMap, rightMap } = pairObjectProperties(a, b);
    const ukObject: Record<string, string> = {};
    const ruObject: Record<string, string> = {};
    const fields: StructureFieldEntry[] = [];
    for (const [key, leftValue] of leftMap.entries()) {
      const rightValue = rightMap.get(key);
      if (!rightValue) continue;
      const uk = stringValue(leftValue);
      const ru = stringValue(rightValue);
      if (uk === undefined || ru === undefined) continue;
      ukObject[key] = uk;
      ruObject[key] = ru;
      fields.push({ key, copyId: copyOverrideKey(uk, ru), uk, ru, en: legacyText('en', uk, ru) });
    }
    if (!fields.length) return;
    ukSkeleton.push(ukObject);
    ruSkeleton.push(ruObject);
    items.push({ id: legacyStructureItemId(ukObject, ruObject, index), label: shortLabel(fields[0]?.uk || `Элемент ${index + 1}`), fields });
  }

  const id = legacyStructureKey(ukSkeleton, ruSkeleton);
  const info = sourceInfo(sourceFile, anchor);
  if (!structures.has(id)) structures.set(id, { id, ...info, label: `${info.page}: ${shortLabel(items[0]?.label || 'список')}`, items });
}

for (const sourceFile of program.getSourceFiles()) {
  if (!sourceFile.fileName.startsWith(srcRoot) || sourceFile.fileName.includes(`${path.sep}generated${path.sep}`)) continue;
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      if (name === 'l') {
        const uk = stringValue(node.arguments[0] as ts.Expression | undefined);
        const ru = stringValue(node.arguments[1] as ts.Expression | undefined);
        const en = stringValue(node.arguments[2] as ts.Expression | undefined);
        if (uk !== undefined && ru !== undefined) addPair('l', uk, ru, en, sourceFile, node);
      } else if (name === 'legacy' && node.arguments.length >= 2) {
        collectLegacyPair(node.arguments[0] as ts.Expression, node.arguments[1] as ts.Expression, sourceFile, node);
        collectStructure(node.arguments[0] as ts.Expression, node.arguments[1] as ts.Expression, sourceFile, node);
      } else if (name === 't') {
        const key = stringValue(node.arguments[0] as ts.Expression | undefined);
        if (key) {
          const uk = TRANSLATIONS.uk?.[key] || '';
          const ru = TRANSLATIONS.ru?.[key] || uk;
          const en = TRANSLATIONS.en?.[key] || uk;
          if (uk || ru || en) {
            const info = sourceInfo(sourceFile, node);
            const id = translationOverrideKey(key);
            const existing = entries.get(id);
            if (existing) {
              if (!existing.source.includes(info.source)) existing.source += `, ${info.source}`;
            } else entries.set(id, { id, kind: 't', ...info, label: `${key} — ${shortLabel(uk || ru || en)}`, uk, ru, en });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const sorted = [...entries.values()].sort((a, b) => a.page.localeCompare(b.page) || a.source.localeCompare(b.source) || a.line - b.line || a.id.localeCompare(b.id));
const structureSorted = [...structures.values()].sort((a, b) => a.page.localeCompare(b.page) || a.source.localeCompare(b.source) || a.line - b.line || a.id.localeCompare(b.id));
const header = `export type EditableCopyCatalogKind = 'l' | 't' | 'legacy';\n\nexport interface EditableCopyCatalogEntry {\n  id: string;\n  kind: EditableCopyCatalogKind;\n  page: string;\n  source: string;\n  line: number;\n  label: string;\n  uk: string;\n  ru: string;\n  en: string;\n}\n\n`;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, header + `export const EDITABLE_COPY_CATALOG: EditableCopyCatalogEntry[] = ${JSON.stringify(sorted, null, 2)};\n`, 'utf8');
const structureHeader = `export interface EditableStructureField { key: string; copyId: string; uk: string; ru: string; en: string; }\nexport interface EditableStructureItem { id: string; label: string; fields: EditableStructureField[]; }\nexport interface EditableStructureCatalogEntry { id: string; page: string; source: string; line: number; label: string; items: EditableStructureItem[]; }\n\n`;
fs.writeFileSync(structuresOutputPath, structureHeader + `export const EDITABLE_STRUCTURE_CATALOG: EditableStructureCatalogEntry[] = ${JSON.stringify(structureSorted, null, 2)};\n`, 'utf8');
console.log(`Generated ${sorted.length} editable public copy entries and ${structureSorted.length} editable structures.`);
''')

# -----------------------------------------------------------------------------
# Generic versioning wrappers for admin Firestore mutations.
# -----------------------------------------------------------------------------
write('src/lib/cmsVersioning.ts', r'''
import {
  addDoc,
  collection,
  deleteDoc as firestoreDeleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface CmsVersionRecord {
  id: string;
  targetPath: string;
  targetCollection: string;
  targetId: string;
  operation: string;
  createdAt: number;
  createdBy: string;
  existed: boolean;
  snapshot: DocumentData | null;
  changedKeys: string[];
}

function topLevelChangedKeys(before: DocumentData | null, after: unknown): string[] {
  if (!after || typeof after !== 'object' || Array.isArray(after)) return [];
  const right = after as Record<string, unknown>;
  const left = before || {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].filter(key => {
    try { return JSON.stringify(left[key]) !== JSON.stringify(right[key]); } catch { return true; }
  }).slice(0, 40);
}

export async function snapshotDocument(ref: DocumentReference<DocumentData>, operation: string, nextData?: unknown): Promise<void> {
  if (!auth.currentUser) return;
  const current = await getDoc(ref);
  const snapshot = current.exists() ? current.data() : null;
  await addDoc(collection(db, 'content_versions'), {
    targetPath: ref.path,
    targetCollection: ref.parent.id,
    targetId: ref.id,
    operation,
    createdAt: Date.now(),
    createdBy: auth.currentUser.email || auth.currentUser.uid,
    existed: current.exists(),
    snapshot,
    changedKeys: topLevelChangedKeys(snapshot, nextData),
  });

  try {
    const old = await getDocs(query(collection(db, 'content_versions'), where('targetPath', '==', ref.path), orderBy('createdAt', 'desc'), limit(36)));
    if (old.docs.length > 30) await Promise.all(old.docs.slice(30).map(item => firestoreDeleteDoc(item.ref)));
  } catch (error) {
    console.warn('Version retention cleanup skipped:', error);
  }
}

export async function versionedSetDoc(ref: DocumentReference<DocumentData>, data: unknown, options?: unknown): Promise<void> {
  await snapshotDocument(ref, 'set', data);
  if (options) await firestoreSetDoc(ref, data as DocumentData, options as never);
  else await firestoreSetDoc(ref, data as DocumentData);
}

export async function versionedUpdateDoc(ref: DocumentReference<DocumentData>, data: unknown): Promise<void> {
  await snapshotDocument(ref, 'update', data);
  await firestoreUpdateDoc(ref, data as never);
}

export async function versionedDeleteDoc(ref: DocumentReference<DocumentData>): Promise<void> {
  await snapshotDocument(ref, 'delete');
  await firestoreDeleteDoc(ref);
}

export async function loadCmsVersions(max = 120): Promise<CmsVersionRecord[]> {
  const snap = await getDocs(query(collection(db, 'content_versions'), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map(item => ({ id: item.id, ...(item.data() as Omit<CmsVersionRecord, 'id'>) }));
}

export async function restoreCmsVersion(record: CmsVersionRecord): Promise<void> {
  const parts = record.targetPath.split('/').filter(Boolean);
  const ref = doc(db, ...parts) as DocumentReference<DocumentData>;
  await snapshotDocument(ref, 'restore-backup');
  if (!record.existed || !record.snapshot) await firestoreDeleteDoc(ref);
  else await firestoreSetDoc(ref, record.snapshot);
}
''')

# -----------------------------------------------------------------------------
# Validation / publish quality for Full Page CMS draft.
# -----------------------------------------------------------------------------
write('src/lib/cmsValidation.ts', r'''
import type { EditableCopyCatalogEntry } from '../generated/editableCopyCatalog';
import type { EditableStructureCatalogEntry } from '../generated/editableStructureCatalog';
import type { FullPageCmsConfig, StructureItemOverride } from './fullPageEditing';

export interface CmsValidationIssue {
  level: 'error' | 'warning';
  area: string;
  message: string;
}

function validLink(value: string): boolean {
  const text = value.trim();
  if (!text) return true;
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(text);
}

export function validateFullPageDraft(
  config: FullPageCmsConfig,
  copyCatalog: EditableCopyCatalogEntry[],
  structureCatalog: EditableStructureCatalogEntry[],
): CmsValidationIssue[] {
  const issues: CmsValidationIssue[] = [];
  for (const [key, value] of Object.entries(config.draft.copyOverrides)) {
    for (const locale of ['uk', 'ru', 'en'] as const) {
      if (value[locale] === '') issues.push({ level: 'warning', area: 'Тексты', message: `${key}: ${locale.toUpperCase()} намеренно пустой.` });
      const catalog = copyCatalog.find(item => item.id === key);
      const label = catalog?.label.toLowerCase() || '';
      if (typeof value[locale] === 'string' && /(url|href|ссылка|посилання|link)/i.test(label) && !validLink(value[locale] || '')) {
        issues.push({ level: 'error', area: 'Ссылки', message: `${catalog?.label || key}: некорректная ссылка (${locale.toUpperCase()}).` });
      }
    }
  }

  const prices = JSON.parse(JSON.stringify(config.draft.calculators)) as Record<string, unknown>;
  const walkNumbers = (value: unknown, path: string) => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) issues.push({ level: 'error', area: 'Калькуляторы', message: `${path}: цена должна быть числом ≥ 0.` });
      return;
    }
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value as Record<string, unknown>)) walkNumbers(child, `${path}.${key}`);
  };
  walkNumbers(prices, 'pricing');

  for (const group of structureCatalog) {
    const override = config.draft.structures[group.id];
    if (!override) continue;
    const seen = new Set<string>();
    const originals = new Set(group.items.map(item => item.id));
    const all: StructureItemOverride[] = override.items || [];
    for (const item of all) {
      if (seen.has(item.id)) issues.push({ level: 'error', area: 'Структура', message: `${group.label}: повторяющийся ID ${item.id}.` });
      seen.add(item.id);
      if (item.cloneFromId && !originals.has(item.cloneFromId)) issues.push({ level: 'error', area: 'Структура', message: `${group.label}: источник клона ${item.cloneFromId} больше не существует.` });
      if (item.cloneFromId) {
        const source = group.items.find(entry => entry.id === item.cloneFromId);
        for (const locale of ['uk', 'ru', 'en'] as const) {
          for (const field of source?.fields || []) {
            const value = item.locales?.[locale]?.[field.key];
            if (value === undefined || !value.trim()) issues.push({ level: 'warning', area: 'Локализация', message: `${group.label}: добавленный элемент ${item.id}, поле ${field.key}, ${locale.toUpperCase()} не заполнено.` });
            if (/(url|href|link)/i.test(field.key) && value && !validLink(value)) issues.push({ level: 'error', area: 'Ссылки', message: `${group.label}: ${field.key} содержит некорректную ссылку.` });
          }
        }
      }
    }
  }

  if (config.workflow.scheduledAt && config.workflow.scheduledAt < Date.now()) {
    issues.push({ level: 'warning', area: 'Публикация', message: 'Запланированное время уже наступило: draft сейчас используется публичным runtime.' });
  }
  return issues;
}
''')

# -----------------------------------------------------------------------------
# History manager UI.
# -----------------------------------------------------------------------------
write('src/components/admin/CmsHistoryManager.tsx', r'''
import { useEffect, useMemo, useState } from 'react';
import { Clock3, History, Loader2, RefreshCw, RotateCcw, Search } from 'lucide-react';
import { loadCmsVersions, restoreCmsVersion, type CmsVersionRecord } from '../../lib/cmsVersioning';

export function CmsHistoryManager() {
  const [items, setItems] = useState<CmsVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  const reload = async () => {
    setLoading(true);
    setMessage('');
    try { setItems(await loadCmsVersions()); }
    catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void reload(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(item => [item.targetPath, item.operation, item.createdBy, ...item.changedKeys].join(' ').toLowerCase().includes(needle));
  }, [items, query]);

  const restore = async (item: CmsVersionRecord) => {
    if (!window.confirm(`Восстановить ${item.targetPath} до состояния перед операцией ${item.operation}? Текущее состояние сначала попадёт в историю.`)) return;
    setBusy(item.id);
    try {
      await restoreCmsVersion(item);
      setMessage(`Восстановлено: ${item.targetPath}`);
      await reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(''); }
  };

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div><div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">CMS Versioning / Undo 1.0</div><h2 className="mt-1 text-2xl font-black text-slate-950">История изменений и восстановление</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Перед изменением или удалением admin-записи автоматически сохраняется snapshot. Для каждого документа хранится до 30 последних состояний.</p></div>
          <button onClick={() => void reload()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Обновить</button>
        </div>
      </header>
      {message && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">{message}</div>}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Документ, коллекция, поле или автор…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" /></label></div>
      <div className="space-y-3">
        {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div> : filtered.map(item => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase text-white">{item.operation}</span><span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">{item.targetCollection}</span></div><div className="mt-2 break-all font-mono text-xs font-bold text-slate-800">{item.targetPath}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(item.createdAt).toLocaleString()}</span><span>{item.createdBy}</span></div>{item.changedKeys.length > 0 && <div className="mt-2 text-xs text-slate-500">Поля: <span className="font-semibold text-slate-700">{item.changedKeys.join(', ')}</span></div>}</div>
              <button onClick={() => void restore(item)} disabled={busy === item.id} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-500 disabled:opacity-50">{busy === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}Восстановить</button>
            </div>
            <details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-slate-500">Snapshot / технический просмотр</summary><pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-relaxed text-slate-200">{JSON.stringify(item.snapshot, null, 2)}</pre></details>
          </article>
        ))}
        {!loading && filtered.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400"><History className="mx-auto mb-2 h-6 w-6" />История пока пуста или ничего не найдено.</div>}
      </div>
    </div>
  );
}
''')

# -----------------------------------------------------------------------------
# Global admin search / command center, including media usage index.
# -----------------------------------------------------------------------------
write('src/components/admin/AdminCommandCenter.tsx', r'''
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowRight, FileSearch, Loader2, RefreshCw, Search } from 'lucide-react';
import { db } from '../../lib/firebase';
import { loadMediaLibrary } from '../../lib/mediaLibrary';
import { EDITABLE_COPY_CATALOG } from '../../generated/editableCopyCatalog';
import { normalizeFullPageCms } from '../../lib/fullPageEditing';
import { useSiteContent } from '../../context/SiteContentContext';

interface SearchRecord {
  id: string;
  source: string;
  title: string;
  text: string;
  tab: string;
  target?: { type: 'case' | 'article' | 'gallery' | 'video'; id: string };
  meta?: string;
}

function flatten(value: unknown, prefix = '', output: string[] = [], depth = 0): string[] {
  if (depth > 8 || output.length > 400) return output;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') { output.push(`${prefix} ${String(value)}`); return output; }
  if (Array.isArray(value)) { value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, output, depth + 1)); return output; }
  if (value && typeof value === 'object') for (const [key, item] of Object.entries(value as Record<string, unknown>)) flatten(item, prefix ? `${prefix}.${key}` : key, output, depth + 1);
  return output;
}

function tabFor(collectionName: string, data: Record<string, unknown>): string {
  if (collectionName === 'site_blocks') return 'blocks';
  if (collectionName === 'cases' || collectionName === 'articles') return 'content';
  if (collectionName === 'testimonials') return 'testimonials';
  if (collectionName === 'backstage') return 'backstage';
  if (collectionName === 'site_settings') {
    if (data.kind === 'gallery' || data.kind === 'video_project') return 'content';
    return 'settings';
  }
  return 'command-center';
}

export function AdminCommandCenter({ onNavigate }: { onNavigate: (tab: string, target?: SearchRecord['target']) => void }) {
  const { rawSettings } = useSiteContent();
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const rebuild = async () => {
    setLoading(true); setMessage('');
    try {
      const next: SearchRecord[] = [];
      for (const collectionName of ['cases', 'articles', 'site_blocks', 'site_settings', 'testimonials', 'backstage']) {
        const snap = await getDocs(collection(db, collectionName));
        for (const item of snap.docs) {
          const data = item.data() as Record<string, unknown>;
          const title = String(data.title || data.name || data.studioName || data.kind || item.id);
          let target: SearchRecord['target'];
          if (collectionName === 'cases') target = { type: 'case', id: item.id };
          else if (collectionName === 'articles') target = { type: 'article', id: item.id };
          else if (collectionName === 'site_settings' && data.kind === 'gallery') target = { type: 'gallery', id: item.id };
          else if (collectionName === 'site_settings' && data.kind === 'video_project') target = { type: 'video', id: item.id };
          next.push({ id: `${collectionName}:${item.id}`, source: collectionName, title, text: flatten(data).join('\n'), tab: tabFor(collectionName, data), target, meta: item.id });
        }
      }

      const fullPage = normalizeFullPageCms(rawSettings.fullPageCms);
      for (const entry of EDITABLE_COPY_CATALOG) {
        const override = fullPage.draft.copyOverrides[entry.id];
        next.push({ id: `copy:${entry.id}`, source: `Full Page / ${entry.page}`, title: entry.label, text: [entry.uk, entry.ru, entry.en, override?.uk, override?.ru, override?.en].filter(Boolean).join('\n'), tab: 'full-page', meta: `${entry.source}:${entry.line}` });
      }

      const assets = await loadMediaLibrary();
      for (const asset of assets) next.push({ id: `media:${asset.url}`, source: 'Media Library', title: asset.name || asset.publicId || 'media', text: [asset.url, asset.publicId, ...asset.usages.map(usage => `${usage.sourceType} ${usage.sourceTitle} ${usage.sourceId} ${usage.field}`)].filter(Boolean).join('\n'), tab: 'media', meta: asset.useCount ? `${asset.useCount} использований` : 'не используется' });
      setRecords(next);
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void rebuild(); }, []);

  const results = useMemo(() => {
    const needle = queryText.trim().toLowerCase();
    if (!needle) return records.slice(0, 40);
    const terms = needle.split(/\s+/).filter(Boolean);
    return records.filter(record => {
      const haystack = `${record.source} ${record.title} ${record.text} ${record.meta || ''}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    }).slice(0, 120);
  }, [queryText, records]);

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Global Admin Search 1.0</div><h2 className="mt-1 text-2xl font-black text-slate-950">Командный центр CMS</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Поиск одновременно по кейсам, статьям, Page Builder, настройкам, галереям, видео, отзывам, backstage, всем Full Page текстам и Media Usage.</p></div><button onClick={() => void rebuild()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Переиндексировать</button></div></header>
      {message && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</div>}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><label className="relative block"><Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" /><input autoFocus value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Например: Starlink, Nordgas, hero, timelapse, имя файла…" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-base font-semibold outline-none focus:border-indigo-500" /></label><div className="mt-3 text-xs font-bold text-slate-500">Индекс: {records.length} объектов · результатов: {results.length}</div></div>
      {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div> : <div className="grid gap-3">{results.map(result => <article key={result.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{result.source}</div><div className="mt-1 truncate font-black text-slate-950">{result.title}</div>{result.meta && <div className="mt-1 truncate font-mono text-[10px] text-slate-400">{result.meta}</div>}<div className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{result.text.slice(0, 450)}</div></div><button onClick={() => onNavigate(result.tab, result.target)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-600">Открыть<ArrowRight className="h-4 w-4" /></button></div></article>)}</div>}
      {!loading && results.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400"><FileSearch className="mx-auto mb-2 h-7 w-7" />Ничего не найдено.</div>}
    </div>
  );
}
''')

# -----------------------------------------------------------------------------
# Visual inspector: only loaded for ?cmsInspect=1, requires current admin auth to save.
# -----------------------------------------------------------------------------
write('src/components/CmsVisualInspector.tsx', r'''
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MousePointer2, Save, X } from 'lucide-react';
import { EDITABLE_COPY_CATALOG, type EditableCopyCatalogEntry } from '../generated/editableCopyCatalog';
import { useSiteContent } from '../context/SiteContentContext';
import { useAuth } from '../context/AuthContext';
import { normalizeFullPageCms, replaceFullPageDraft } from '../lib/fullPageEditing';

function pageFromPath(pathname: string): string {
  const path = pathname.replace(/\/$/, '') || '/';
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

function normalized(value: string): string { return value.replace(/\s+/g, ' ').trim(); }

export function CmsVisualInspector() {
  const { locale, rawSettings, updateSettings } = useSiteContent();
  const { user } = useAuth();
  const [selected, setSelected] = useState<EditableCopyCatalogEntry | null>(null);
  const [value, setValue] = useState('');
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [saved, setSaved] = useState(false);
  const page = useMemo(() => pageFromPath(window.location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '') || '/'), []);
  const config = useMemo(() => normalizeFullPageCms(rawSettings.fullPageCms), [rawSettings.fullPageCms]);
  const entries = useMemo(() => EDITABLE_COPY_CATALOG.filter(item => item.page === page || item.page === 'common' || item.page === 'layout'), [page]);

  const displayValue = (entry: EditableCopyCatalogEntry) => config.draft.copyOverrides[entry.id]?.[locale] ?? entry[locale];

  useEffect(() => {
    const findEntry = (element: HTMLElement): EditableCopyCatalogEntry | null => {
      const text = normalized(element.innerText || element.textContent || '');
      if (!text || text.length > 500) return null;
      const matches = entries.filter(entry => {
        const candidate = normalized(displayValue(entry));
        return candidate.length >= 2 && (text === candidate || text.includes(candidate));
      });
      return matches.sort((a, b) => displayValue(b).length - displayValue(a).length)[0] || null;
    };
    const move = (event: PointerEvent) => {
      const element = (event.target as HTMLElement | null)?.closest?.('body *') as HTMLElement | null;
      if (!element || element.closest('[data-cms-inspector-ui]')) return;
      const entry = findEntry(element);
      setRect(entry ? element.getBoundingClientRect() : null);
    };
    const click = (event: MouseEvent) => {
      const element = event.target as HTMLElement | null;
      if (!element || element.closest('[data-cms-inspector-ui]')) return;
      const entry = findEntry(element);
      if (!entry) return;
      event.preventDefault(); event.stopPropagation();
      setSelected(entry); setValue(displayValue(entry)); setRect(element.getBoundingClientRect());
    };
    document.addEventListener('pointermove', move, true);
    document.addEventListener('click', click, true);
    return () => { document.removeEventListener('pointermove', move, true); document.removeEventListener('click', click, true); };
  }, [entries, config, locale]);

  const save = async () => {
    if (!selected || !user) return;
    const nextDraft = JSON.parse(JSON.stringify(config.draft));
    const current = nextDraft.copyOverrides[selected.id] || {};
    if (value === selected[locale]) delete current[locale]; else current[locale] = value;
    if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete nextDraft.copyOverrides[selected.id]; else nextDraft.copyOverrides[selected.id] = current;
    await updateSettings({ fullPageCms: replaceFullPageDraft(config, nextDraft, user.email || user.uid) } as never);
    setSaved(true); window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      {rect && <div data-cms-inspector-ui className="pointer-events-none fixed z-[9997] border-2 border-fuchsia-500 bg-fuchsia-400/10" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />}
      <div data-cms-inspector-ui className="fixed bottom-4 left-4 z-[9998] flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-2xl"><MousePointer2 className="h-4 w-4 text-fuchsia-400" />Visual CMS Inspector · {page} · {locale.toUpperCase()}</div>
      {selected && <aside data-cms-inspector-ui className="fixed right-4 top-24 z-[9999] w-[min(420px,calc(100vw-2rem))] rounded-3xl border border-slate-700 bg-slate-950 p-5 text-white shadow-2xl"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-wider text-fuchsia-400">{selected.page} · {selected.kind}</div><div className="mt-1 text-sm font-black">{selected.label}</div><div className="mt-1 font-mono text-[9px] text-slate-500">{selected.source}:{selected.line}</div></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button></div>{!user ? <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Для сохранения войдите в /admin в этом браузере.</div> : <><textarea rows={5} value={value} onChange={e => setValue(e.target.value)} className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-fuchsia-500" /><button onClick={() => void save()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-xs font-black text-white hover:bg-fuchsia-500"><Save className="h-4 w-4" />Сохранить в черновик</button>{saved && <span className="ml-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 className="h-4 w-4" />Сохранено</span>}</>}</aside>}
    </>
  );
}
''')

# -----------------------------------------------------------------------------
# Full Page Editing 4.0 manager.
# -----------------------------------------------------------------------------
write('src/components/admin/FullPageEditingManagerV4.tsx', r'''
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarClock, CheckCircle2, Copy, Eye, EyeOff, FileText, ListTree, Plus, RotateCcw, Save, Send, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { useAuth } from '../../context/AuthContext';
import { EDITABLE_COPY_CATALOG, type EditableCopyCatalogEntry } from '../../generated/editableCopyCatalog';
import { EDITABLE_STRUCTURE_CATALOG, type EditableStructureCatalogEntry, type EditableStructureItem } from '../../generated/editableStructureCatalog';
import {
  discardFullPageDraft,
  normalizeFullPageCms,
  publishFullPageDraft,
  replaceFullPageDraft,
  type FullPageCmsConfig,
  type FullPageCmsContent,
  type StructureItemOverride,
} from '../../lib/fullPageEditing';
import { validateFullPageDraft } from '../../lib/cmsValidation';
import type { Locale } from '../../types';

const PAGE_LABELS: Record<string, string> = { home: 'Главная', live: 'LIVE', video: 'Video', construction: 'Construction', photo: 'Photo', about: 'About', contacts: 'Contacts', cases: 'Cases — каталог', 'case-detail': 'Case — детальная', videos: 'Videos — каталог', 'video-detail': 'Video — детальная', galleries: 'Galleries — каталог', 'gallery-detail': 'Gallery — детальная', 'media-center': 'Media Center', 'article-detail': 'Article — детальная', layout: 'Шапка / подвал', 'portfolio-ui': 'Portfolio UI', common: 'Общие компоненты' };
const PAGE_PATHS: Record<string, string> = { home: '/', live: '/live', video: '/video', construction: '/construction', photo: '/photo', about: '/about', contacts: '/contacts', cases: '/cases', videos: '/videos', galleries: '/galleries', 'media-center': '/media-center' };
const LANGS: Locale[] = ['uk', 'ru', 'en'];
type Tab = 'copy' | 'structure' | 'calculators' | 'workflow' | 'quality';

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function inputClass(): string { return 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'; }

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

  useEffect(() => { if (!dirty) setConfig(normalizeFullPageCms(rawSettings.fullPageCms)); }, [rawSettings.fullPageCms, dirty]);
  useEffect(() => { if (config.workflow.scheduledAt) { const d = new Date(config.workflow.scheduledAt); setSchedule(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)); } }, []);

  const actor = user?.email || user?.uid || 'admin';
  const pages = useMemo(() => [...new Set(EDITABLE_COPY_CATALOG.map(item => item.page))].sort((a, b) => (PAGE_LABELS[a] || a).localeCompare(PAGE_LABELS[b] || b)), []);
  const structures = useMemo(() => EDITABLE_STRUCTURE_CATALOG.filter(item => page === 'all' || item.page === page), [page]);
  const issues = useMemo(() => validateFullPageDraft(config, EDITABLE_COPY_CATALOG, EDITABLE_STRUCTURE_CATALOG), [config]);
  const errors = issues.filter(issue => issue.level === 'error');
  const warnings = issues.filter(issue => issue.level === 'warning');

  const mutateDraft = (mutator: (draft: FullPageCmsContent) => void) => {
    setConfig(current => { const next = clone(current); mutator(next.draft); next.workflow.draftUpdatedAt = Date.now(); next.workflow.draftBy = actor; return next; });
    setDirty(true); setMessage('');
  };

  const saveDraft = async () => {
    setSaving(true);
    try { const next = replaceFullPageDraft(config, config.draft, actor); await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage('Черновик сохранён. Публичная версия не изменилась.'); }
    finally { setSaving(false); }
  };

  const publish = async () => {
    if (errors.length) { setTab('quality'); setMessage(`Публикация остановлена: ошибок ${errors.length}.`); return; }
    if (!window.confirm('Опубликовать текущий черновик Full Page CMS?')) return;
    setSaving(true);
    try { const next = publishFullPageDraft(config, actor); await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage('Опубликовано.'); }
    finally { setSaving(false); }
  };

  const saveSchedule = async () => {
    const at = schedule ? new Date(schedule).getTime() : null;
    const next = replaceFullPageDraft(config, config.draft, actor);
    next.workflow.scheduledAt = Number.isFinite(at) ? at : null;
    await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage(at ? `Публикация запланирована на ${new Date(at).toLocaleString()}.` : 'Расписание очищено.');
  };

  const discard = async () => {
    if (!window.confirm('Отменить все изменения черновика и вернуть опубликованную версию?')) return;
    const next = discardFullPageDraft(config); await updateSettings({ fullPageCms: next } as never); setConfig(next); setDirty(false); setMessage('Черновик сброшен к опубликованной версии.');
  };

  const filteredCopy = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return EDITABLE_COPY_CATALOG.filter(item => (page === 'all' || item.page === page) && (!onlyChanged || config.draft.copyOverrides[item.id]) && (!needle || [item.label, item.uk, item.ru, item.en, item.source].some(value => value.toLowerCase().includes(needle))));
  }, [config.draft.copyOverrides, onlyChanged, page, query]);

  const setCopy = (entry: EditableCopyCatalogEntry, language: Locale, value: string) => mutateDraft(draft => {
    const current = draft.copyOverrides[entry.id] || {};
    if (value === entry[language]) delete current[language]; else current[language] = value;
    if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete draft.copyOverrides[entry.id]; else draft.copyOverrides[entry.id] = current;
  });

  const ensureStructure = (draft: FullPageCmsContent, group: EditableStructureCatalogEntry) => {
    if (!draft.structures[group.id]) draft.structures[group.id] = { items: group.items.map((item, index) => ({ id: item.id, enabled: true, order: index * 10 })) };
    return draft.structures[group.id];
  };

  const patchStructureItem = (group: EditableStructureCatalogEntry, id: string, patch: Partial<StructureItemOverride>) => mutateDraft(draft => {
    const structure = ensureStructure(draft, group);
    const index = structure.items.findIndex(item => item.id === id);
    if (index >= 0) structure.items[index] = { ...structure.items[index], ...patch };
    else structure.items.push({ id, ...patch });
  });

  const orderedItems = (group: EditableStructureCatalogEntry) => {
    const override = config.draft.structures[group.id];
    const originals = group.items.map((item, index) => ({ catalog: item, patch: override?.items.find(p => p.id === item.id) || { id: item.id, enabled: true, order: index * 10 } }));
    const added = (override?.items || []).filter(item => item.cloneFromId && !group.items.some(original => original.id === item.id)).map(item => ({ catalog: group.items.find(source => source.id === item.cloneFromId) || group.items[0], patch: item }));
    return [...originals, ...added].sort((a, b) => (a.patch.order ?? 0) - (b.patch.order ?? 0));
  };

  const moveItem = (group: EditableStructureCatalogEntry, id: string, direction: -1 | 1) => mutateDraft(draft => {
    const structure = ensureStructure(draft, group);
    const order = orderedItems(group).map(entry => entry.patch.id);
    const index = order.indexOf(id); const target = index + direction; if (index < 0 || target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    order.forEach((itemId, idx) => { const existing = structure.items.find(item => item.id === itemId); if (existing) existing.order = idx * 10; else structure.items.push({ id: itemId, order: idx * 10, enabled: true }); });
  });

  const duplicateItem = (group: EditableStructureCatalogEntry, source: EditableStructureItem) => mutateDraft(draft => {
    const structure = ensureStructure(draft, group);
    const id = `added-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const locales = Object.fromEntries(LANGS.map(lang => [lang, Object.fromEntries(source.fields.map(field => [field.key, field[lang]]))])) as StructureItemOverride['locales'];
    structure.items.push({ id, cloneFromId: source.id, enabled: true, order: Math.max(0, ...structure.items.map(item => item.order || 0)) + 10, locales });
  });

  const deleteAdded = (group: EditableStructureCatalogEntry, id: string) => mutateDraft(draft => { const structure = ensureStructure(draft, group); structure.items = structure.items.filter(item => item.id !== id); });

  const structureFieldValue = (group: EditableStructureCatalogEntry, source: EditableStructureItem, patch: StructureItemOverride, fieldKey: string, lang: Locale) => {
    const field = source.fields.find(item => item.key === fieldKey); if (!field) return '';
    if (patch.cloneFromId) return patch.locales?.[lang]?.[fieldKey] ?? field[lang];
    const override = config.draft.copyOverrides[field.copyId]?.[lang]; return override ?? field[lang];
  };

  const setStructureField = (group: EditableStructureCatalogEntry, source: EditableStructureItem, patch: StructureItemOverride, fieldKey: string, lang: Locale, value: string) => {
    const field = source.fields.find(item => item.key === fieldKey); if (!field) return;
    if (!patch.cloneFromId) {
      mutateDraft(draft => { const current = draft.copyOverrides[field.copyId] || {}; if (value === field[lang]) delete current[lang]; else current[lang] = value; if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete draft.copyOverrides[field.copyId]; else draft.copyOverrides[field.copyId] = current; });
      return;
    }
    mutateDraft(draft => { const structure = ensureStructure(draft, group); const item = structure.items.find(entry => entry.id === patch.id); if (!item) return; item.locales = item.locales || {}; item.locales[lang] = { ...(item.locales[lang] || {}), [fieldKey]: value }; });
  };

  const openPreview = (inspect = false) => {
    const targetPage = page !== 'all' && PAGE_PATHS[page] ? PAGE_PATHS[page] : '/';
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}${targetPage}?cmsPreview=1${inspect ? '&cmsInspect=1' : ''}`, '_blank', 'noopener,noreferrer');
  };

  const calc = config.draft.calculators;
  const numberField = (label: string, value: number, onChange: (value: number) => void) => <label className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span><input type="number" min={0} step={100} value={value} onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))} className={inputClass()} /></label>;

  const tabButton = (id: Tab, label: string, icon: React.ReactNode) => <button onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${tab === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{icon}{label}</button>;

  return <div className="space-y-6">
    <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">CMS Platform · Full Page Editing 4.0</div><h2 className="mt-1 text-2xl font-black text-slate-950">Контент, структура, preview и публикация</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Изменения сначала попадают в Draft. Публичный сайт использует Published; Preview и Visual Inspector показывают Draft только авторизованному администратору.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => openPreview(false)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50"><Eye className="h-4 w-4" />Preview</button><button onClick={() => openPreview(true)} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 px-4 py-2.5 text-xs font-black text-fuchsia-700 hover:bg-fuchsia-50"><Eye className="h-4 w-4" />Visual edit</button><button onClick={() => void saveDraft()} disabled={!dirty || saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Save className="h-4 w-4" />Сохранить Draft</button><button onClick={() => void publish()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Send className="h-4 w-4" />Опубликовать</button></div></div></header>
    {message && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800">{message}</div>}
    <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{tabButton('copy','Тексты',<FileText className="h-4 w-4" />)}{tabButton('structure','Структура',<ListTree className="h-4 w-4" />)}{tabButton('calculators','Калькуляторы',<SlidersHorizontal className="h-4 w-4" />)}{tabButton('workflow','Draft / Publish',<CalendarClock className="h-4 w-4" />)}{tabButton('quality',`Quality ${errors.length ? `(${errors.length})` : ''}`,<ShieldCheck className="h-4 w-4" />)}</div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex gap-2 overflow-x-auto"><button onClick={() => setPage('all')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${page === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Все страницы</button>{pages.map(item => <button key={item} onClick={() => setPage(item)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${page === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{PAGE_LABELS[item] || item}</button>)}</div></div>

    {tab === 'copy' && <div className="space-y-4"><div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти текст…" className={inputClass()} /><label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={onlyChanged} onChange={e => setOnlyChanged(e.target.checked)} />Только изменённые</label></div>{filteredCopy.slice(0, 180).map(entry => <article key={entry.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${config.draft.copyOverrides[entry.id] ? 'border-indigo-200' : 'border-slate-200'}`}><div className="mb-3 flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase text-indigo-600">{PAGE_LABELS[entry.page] || entry.page} · {entry.kind}</div><div className="mt-1 text-sm font-black text-slate-900">{entry.label}</div><div className="mt-1 font-mono text-[9px] text-slate-400">{entry.source}:{entry.line}</div></div><button onClick={() => mutateDraft(draft => { delete draft.copyOverrides[entry.id]; })} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><RotateCcw className="h-4 w-4" /></button></div><div className="grid gap-3 xl:grid-cols-3">{LANGS.map(lang => <label key={lang}><span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{lang}</span><textarea rows={3} value={config.draft.copyOverrides[entry.id]?.[lang] ?? entry[lang]} onChange={e => setCopy(entry, lang, e.target.value)} className={inputClass()} /></label>)}</div></article>)}</div>}

    {tab === 'structure' && <div className="space-y-5">{structures.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">Для этой страницы автоматически редактируемых legacy-списков не найдено. Page Builder остаётся способом добавлять произвольные новые секции.</div>}{structures.map(group => <section key={group.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-[10px] font-black uppercase text-indigo-600">{PAGE_LABELS[group.page] || group.page}</div><h3 className="mt-1 font-black text-slate-950">{group.label}</h3><div className="mt-1 font-mono text-[9px] text-slate-400">{group.source}:{group.line}</div></div><div className="flex gap-1">{LANGS.map(lang => <button key={lang} onClick={() => setLocale(lang)} className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase ${locale === lang ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{lang}</button>)}</div></div><div className="mt-4 space-y-3">{orderedItems(group).map(({ catalog, patch }, index, all) => <div key={patch.id} className={`rounded-2xl border p-4 ${patch.enabled === false ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white'}`}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black text-white">{index + 1}</span><span className="text-sm font-black text-slate-900">{catalog.label}</span>{patch.cloneFromId && <span className="rounded-lg bg-fuchsia-50 px-2 py-1 text-[10px] font-black text-fuchsia-700">добавлен</span>}</div><div className="flex gap-1"><button onClick={() => moveItem(group, patch.id, -1)} disabled={index === 0} className="rounded-lg border p-2 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button><button onClick={() => moveItem(group, patch.id, 1)} disabled={index === all.length - 1} className="rounded-lg border p-2 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button><button onClick={() => patchStructureItem(group, patch.id, { enabled: patch.enabled === false })} className="rounded-lg border p-2">{patch.enabled === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button><button onClick={() => duplicateItem(group, catalog)} className="rounded-lg border p-2"><Copy className="h-3.5 w-3.5" /></button>{patch.cloneFromId && <button onClick={() => deleteAdded(group, patch.id)} className="rounded-lg border border-red-200 p-2 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div><div className="mt-3 grid gap-3 lg:grid-cols-2">{catalog.fields.map(field => <label key={field.key}><span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{field.key} · {locale.toUpperCase()}</span><textarea rows={2} value={structureFieldValue(group, catalog, patch, field.key, locale)} onChange={e => setStructureField(group, catalog, patch, field.key, locale, e.target.value)} className={inputClass()} /></label>)}</div></div>)}</div><button onClick={() => group.items[0] && duplicateItem(group, group.items[0])} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50"><Plus className="h-4 w-4" />Добавить элемент</button></section>)}</div>}

    {tab === 'calculators' && <div className="grid gap-5 xl:grid-cols-3"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">LIVE</h3><div className="mt-4 grid gap-3">{Object.entries(calc.live).map(([key, value]) => numberField(key, value, next => mutateDraft(draft => { (draft.calculators.live as unknown as Record<string, number>)[key] = next; })))}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Video</h3><div className="mt-4 grid gap-3">{numberField('base',calc.video.base,v=>mutateDraft(d=>{d.calculators.video.base=v;}))}{Object.entries(calc.video.videoType).map(([k,v])=>numberField(`type.${k}`,v,n=>mutateDraft(d=>{(d.calculators.video.videoType as unknown as Record<string,number>)[k]=n;})))}{Object.entries(calc.video.duration).map(([k,v])=>numberField(`duration.${k}`,v,n=>mutateDraft(d=>{(d.calculators.video.duration as unknown as Record<string,number>)[k]=n;})))}{(['script','actors','drone','voiceover','graphics3d'] as const).map(k=>numberField(k,calc.video[k],v=>mutateDraft(d=>{d.calculators.video[k]=v;})))}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Construction</h3><div className="mt-4 grid gap-3">{Object.entries(calc.construction).map(([key,value])=>numberField(key,value,next=>mutateDraft(d=>{(d.calculators.construction as unknown as Record<string,number>)[key]=next;})))}</div></section></div>}

    {tab === 'workflow' && <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-slate-950">Состояние</h3><div className="mt-4 space-y-2 text-sm text-slate-600"><div>Draft: <b>{config.workflow.draftUpdatedAt ? new Date(config.workflow.draftUpdatedAt).toLocaleString() : 'совпадает с published'}</b></div><div>Published: <b>{config.workflow.publishedAt ? new Date(config.workflow.publishedAt).toLocaleString() : 'legacy / исходное состояние'}</b></div><div>Изменения в текущей сессии: <b>{dirty ? 'есть' : 'нет'}</b></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void saveDraft()} disabled={!dirty} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40">Сохранить Draft</button><button onClick={() => void discard()} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-600">Отменить Draft</button><button onClick={() => void publish()} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white">Publish</button></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black text-slate-950">Scheduled publishing</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">После указанного времени public runtime автоматически начнёт использовать текущий Draft. Для SEO-prerender после этого всё равно рекомендуется обычный Publish.</p><input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)} className={`mt-4 ${inputClass()}`} /><button onClick={() => void saveSchedule()} className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white">Сохранить расписание</button></section></div>}

    {tab === 'quality' && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-red-200 bg-red-50 p-4"><div className="text-xs font-black uppercase text-red-600">Ошибки</div><div className="mt-1 text-3xl font-black text-red-900">{errors.length}</div></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="text-xs font-black uppercase text-amber-600">Предупреждения</div><div className="mt-1 text-3xl font-black text-amber-900">{warnings.length}</div></div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-xs font-black uppercase text-emerald-600">Publish gate</div><div className="mt-1 text-lg font-black text-emerald-900">{errors.length ? 'Заблокирован' : 'Готов'}</div></div></div>{issues.map((issue,index)=><div key={`${issue.area}-${index}`} className={`rounded-xl border px-4 py-3 text-sm ${issue.level==='error'?'border-red-200 bg-red-50 text-red-800':'border-amber-200 bg-amber-50 text-amber-800'}`}><b>{issue.area}:</b> {issue.message}</div>)}{issues.length===0&&<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline h-5 w-5" />Черновик прошёл CMS Validation 3.0.</div>}</div>}
  </div>;
}
''')

write('src/components/admin/FullPageEditingManager.tsx', "export { FullPageEditingManagerV4 as FullPageEditingManager } from './FullPageEditingManagerV4';\n")

# -----------------------------------------------------------------------------
# Patch SiteContentContext for preview/scheduled runtime and structure overrides.
# -----------------------------------------------------------------------------
ctx_path = ROOT / 'src/context/SiteContentContext.tsx'
ctx = ctx_path.read_text(encoding='utf-8')
ctx = ctx.replace("import { normalizeFullPageCms, resolveEditableCopy, resolveEditableLegacy, translationOverrideKey } from '../lib/fullPageEditing';", "import { fullPageRuntimeConfig, resolveEditableCopy, resolveEditableLegacy, translationOverrideKey } from '../lib/fullPageEditing';\nimport { useAuth } from './AuthContext';")
ctx = ctx.replace("export function SiteContentProvider({ children }: { children: React.ReactNode }) {\n", "export function SiteContentProvider({ children }: { children: React.ReactNode }) {\n  const { user } = useAuth();\n")
ctx = ctx.replace("  const fullPageCms = useMemo(() => normalizeFullPageCms(rawSettings.fullPageCms), [rawSettings.fullPageCms]);", "  const previewRequested = useMemo(() => {\n    try { return new URLSearchParams(window.location.search).get('cmsPreview') === '1'; } catch { return false; }\n  }, []);\n  const fullPageCms = useMemo(() => fullPageRuntimeConfig(rawSettings.fullPageCms, { preview: previewRequested && Boolean(user) }), [rawSettings.fullPageCms, previewRequested, user]);\n  const effectiveRawSettings = useMemo<SiteSetting>(() => ({ ...rawSettings, fullPageCms }), [rawSettings, fullPageCms]);")
ctx = ctx.replace("  const legacy = <T,>(uk: T, ru: T): T => resolveEditableLegacy(locale, uk, ru, fullPageCms.copyOverrides);", "  const legacy = <T,>(uk: T, ru: T): T => resolveEditableLegacy(locale, uk, ru, fullPageCms.copyOverrides, fullPageCms.structures);")
start = ctx.find("  // Compute localized settings dynamically\n  const settings = useMemo<SiteSetting>(() => {")
end_marker = "  }, [rawSettings, locale]);"
end = ctx.find(end_marker, start)
if start >= 0 and end >= 0:
    end += len(end_marker)
    block = ctx[start:end].replace('rawSettings', 'effectiveRawSettings').replace('[effectiveRawSettings, locale]', '[effectiveRawSettings, locale]')
    ctx = ctx[:start] + block + ctx[end:]
ctx = ctx.replace("        rawSettings,\n", "        rawSettings: effectiveRawSettings,\n")
ctx_path.write_text(ctx, encoding='utf-8')

# -----------------------------------------------------------------------------
# Layout: lazy-load visual inspector only when explicitly requested.
# -----------------------------------------------------------------------------
layout_path = ROOT / 'src/components/layout/Layout.tsx'
layout = layout_path.read_text(encoding='utf-8')
layout = layout.replace("import { Outlet } from 'react-router-dom';", "import { lazy, Suspense } from 'react';\nimport { Outlet } from 'react-router-dom';")
layout = layout.replace("import { SeoManager } from '../SeoManager';", "import { SeoManager } from '../SeoManager';\n\nconst CmsVisualInspector = lazy(() => import('../CmsVisualInspector').then(module => ({ default: module.CmsVisualInspector })));" )
layout = layout.replace("export function Layout() {\n  return (", "export function Layout() {\n  const inspectorRequested = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cmsInspect') === '1';\n  return (")
layout = layout.replace("      <SeoManager />", "      <SeoManager />\n      {inspectorRequested ? <Suspense fallback={null}><CmsVisualInspector /></Suspense> : null}")
layout_path.write_text(layout, encoding='utf-8')

# -----------------------------------------------------------------------------
# AdminDashboard: command center + history tabs and navigation.
# -----------------------------------------------------------------------------
admin_path = ROOT / 'src/pages/AdminDashboard.tsx'
admin = admin_path.read_text(encoding='utf-8')
admin = admin.replace("  ContactRound,\n", "  ContactRound,\n  History,\n  Search,\n")
admin = admin.replace("const FullPageEditingManager = lazy(() => import('../components/admin/FullPageEditingManager').then(module => ({ default: module.FullPageEditingManager })));", "const FullPageEditingManager = lazy(() => import('../components/admin/FullPageEditingManager').then(module => ({ default: module.FullPageEditingManager })));\nconst AdminCommandCenter = lazy(() => import('../components/admin/AdminCommandCenter').then(module => ({ default: module.AdminCommandCenter })));\nconst CmsHistoryManager = lazy(() => import('../components/admin/CmsHistoryManager').then(module => ({ default: module.CmsHistoryManager })));" )
admin = admin.replace("type AdminTab = 'blocks' |", "type AdminTab = 'command-center' | 'history' | 'blocks' |")
admin = admin.replace("  const navItems: NavItem[] = [\n", "  const navItems: NavItem[] = [\n    { id: 'command-center', label: isUk ? 'Пошук CMS' : 'Поиск CMS', icon: <Search className=\"w-4 h-4\" />, badge: '1.0' },\n    { id: 'history', label: isUk ? 'Історія & Undo' : 'История & Undo', icon: <History className=\"w-4 h-4\" />, badge: '1.0' },\n")
admin = admin.replace("badge: '3.0'", "badge: '4.0'")
admin = admin.replace("        <Suspense fallback={<AdminPanelFallback />}>\n", "        <Suspense fallback={<AdminPanelFallback />}>\n          {activeTab === 'command-center' && <AdminCommandCenter onNavigate={(tab, target) => { if (tab === 'content' && target) openUnifiedContent(target as never); else setActiveTab(tab as AdminTab); }} />}\n          {activeTab === 'history' && <CmsHistoryManager />}\n")
admin_path.write_text(admin, encoding='utf-8')

# -----------------------------------------------------------------------------
# Firestore rules: explicit admin-only history collection.
# -----------------------------------------------------------------------------
rules_path = ROOT / 'firestore.rules'
rules = rules_path.read_text(encoding='utf-8')
needle = "    match /leads/{leadId} {\n"
if "match /content_versions/" not in rules:
    rules = rules.replace(needle, "    match /content_versions/{versionId} {\n      allow read, write: if isAdmin();\n    }\n\n" + needle)
rules_path.write_text(rules, encoding='utf-8')

# -----------------------------------------------------------------------------
# Version all admin Firestore set/update/delete mutations without changing callsites.
# -----------------------------------------------------------------------------
def patch_versioned_imports(path: Path, relative_import: str):
    text = path.read_text(encoding='utf-8')
    needed = []
    pattern = re.compile(r"import\s*\{([\s\S]*?)\}\s*from\s*['\"]firebase/firestore['\"];")
    match = pattern.search(text)
    if not match:
        return
    specs = [piece.strip() for piece in match.group(1).split(',') if piece.strip()]
    kept = []
    for spec in specs:
        base = spec.split()[0]
        if base == 'setDoc': needed.append(('versionedSetDoc', 'setDoc'))
        elif base == 'updateDoc': needed.append(('versionedUpdateDoc', 'updateDoc'))
        elif base == 'deleteDoc': needed.append(('versionedDeleteDoc', 'deleteDoc'))
        else: kept.append(spec)
    if not needed:
        return
    replacement = "import {\n  " + ",\n  ".join(kept) + "\n} from 'firebase/firestore';" if kept else ""
    text = text[:match.start()] + replacement + text[match.end():]
    aliases = ', '.join(f"{source} as {alias}" for source, alias in dict(needed).items())
    import_line = f"\nimport {{ {aliases} }} from '{relative_import}';\n"
    insertion = 0
    last_import = list(re.finditer(r"^import .*?;\s*$", text, flags=re.M))
    if last_import:
        insertion = last_import[-1].end()
    text = text[:insertion] + import_line + text[insertion:]
    path.write_text(text, encoding='utf-8')

for path in (ROOT / 'src/components/admin').glob('*.tsx'):
    if path.name in {'CmsHistoryManager.tsx'}:
        continue
    patch_versioned_imports(path, '../../lib/cmsVersioning')
patch_versioned_imports(ROOT / 'src/context/SiteContentContext.tsx', '../lib/cmsVersioning')
if (ROOT / 'src/lib/mediaLibraryOperations.ts').exists():
    patch_versioned_imports(ROOT / 'src/lib/mediaLibraryOperations.ts', './cmsVersioning')

print('CMS Platform 4.0 migration applied.')
