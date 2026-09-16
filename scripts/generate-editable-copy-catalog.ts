import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { TRANSLATIONS } from '../src/locales/translations';
import { legacyText } from '../src/locales/legacyEnglish';
import {
  copyOverrideKey,
  legacyStructureItemId,
  legacyStructureKey,
  translationOverrideKey,
  type StructureScalar,
} from '../src/lib/fullPageEditing';

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

type StructureFieldType = 'string' | 'number' | 'boolean' | 'null';

interface StructureFieldEntry {
  key: string;
  scope: 'locale' | 'common';
  valueType: StructureFieldType;
  copyId?: string;
  uk?: string;
  ru?: string;
  en?: string;
  common?: StructureScalar;
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
  if (
    ts.isParenthesizedExpression(node)
    || ts.isAsExpression(node)
    || ts.isTypeAssertionExpression(node)
    || ts.isNonNullExpression(node)
    || ts.isSatisfiesExpression(node)
  ) return unwrap(node.expression, seen);
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

function scalarValue(node: ts.Expression | undefined): StructureScalar | undefined {
  const resolved = unwrap(node);
  if (!resolved) return undefined;
  if (ts.isStringLiteralLike(resolved) || ts.isNoSubstitutionTemplateLiteral(resolved)) return resolved.text;
  if (ts.isNumericLiteral(resolved)) return Number(resolved.text);
  if (resolved.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (resolved.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (resolved.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(resolved) && ts.isNumericLiteral(resolved.operand)) {
    const value = Number(resolved.operand.text);
    if (resolved.operator === ts.SyntaxKind.MinusToken) return -value;
    if (resolved.operator === ts.SyntaxKind.PlusToken) return value;
  }
  return undefined;
}

function scalarType(value: StructureScalar): StructureFieldType {
  if (value === null) return 'null';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
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

const COMMON_FIELD_RE = /(^|\.)(id|key|slug|icon|iconname|image|imageurl|thumbnail|thumbnailurl|poster|posterurl|videourl|url|href|link|buttonlink|primarylink|secondarylink|ctaprimarylink|ctasecondarylink|downloadname|doctype|format|filesize|status|type|kind|variant|layout|enabled|active|isactive|order|price|amount|count|number|num|durationms|overlayopacity|objectposition|target|rel|tone|color|style|size)$/i;

function isCommonField(pathValue: string, left: StructureScalar, right: StructureScalar): boolean {
  if (typeof left !== 'string' || typeof right !== 'string') return true;
  return COMMON_FIELD_RE.test(pathValue);
}

function collectLegacyPair(
  leftNode: ts.Expression | undefined,
  rightNode: ts.Expression | undefined,
  sourceFile: ts.SourceFile,
  anchor: ts.Node,
  depth = 0,
  fieldPath = '',
) {
  if (depth > 12) return;
  const left = unwrap(leftNode);
  const right = unwrap(rightNode);
  if (!left || !right) return;
  const uk = stringValue(left);
  const ru = stringValue(right);
  if (uk !== undefined && ru !== undefined) {
    if (!fieldPath || !isCommonField(fieldPath, uk, ru)) addPair('legacy', uk, ru, undefined, sourceFile, anchor);
    return;
  }
  if (ts.isArrayLiteralExpression(left) && ts.isArrayLiteralExpression(right)) {
    const count = Math.min(left.elements.length, right.elements.length);
    for (let index = 0; index < count; index += 1) {
      collectLegacyPair(left.elements[index], right.elements[index], sourceFile, anchor, depth + 1, fieldPath);
    }
    return;
  }
  if (ts.isObjectLiteralExpression(left) && ts.isObjectLiteralExpression(right)) {
    const { leftMap, rightMap } = pairObjectProperties(left, right);
    for (const [name, a] of leftMap.entries()) {
      const b = rightMap.get(name);
      if (b) collectLegacyPair(a, b, sourceFile, anchor, depth + 1, fieldPath ? `${fieldPath}.${name}` : name);
    }
  }
}

function collectStructureFields(
  left: ts.ObjectLiteralExpression,
  right: ts.ObjectLiteralExpression,
  prefix = '',
  depth = 0,
): StructureFieldEntry[] {
  if (depth > 5) return [];
  const fields: StructureFieldEntry[] = [];
  const { leftMap, rightMap } = pairObjectProperties(left, right);
  for (const [name, leftNode] of leftMap.entries()) {
    const rightNode = rightMap.get(name);
    if (!rightNode) continue;
    const fieldPath = prefix ? `${prefix}.${name}` : name;
    const a = unwrap(leftNode);
    const b = unwrap(rightNode);
    if (!a || !b) continue;

    if (ts.isObjectLiteralExpression(a) && ts.isObjectLiteralExpression(b)) {
      fields.push(...collectStructureFields(a, b, fieldPath, depth + 1));
      continue;
    }

    const leftValue = scalarValue(a);
    const rightValue = scalarValue(b);
    if (leftValue === undefined || rightValue === undefined) continue;

    if (typeof leftValue === 'string' && typeof rightValue === 'string' && !isCommonField(fieldPath, leftValue, rightValue)) {
      fields.push({
        key: fieldPath,
        scope: 'locale',
        valueType: 'string',
        copyId: copyOverrideKey(leftValue, rightValue),
        uk: leftValue,
        ru: rightValue,
        en: legacyText('en', leftValue, rightValue),
      });
      continue;
    }

    if (typeof leftValue !== typeof rightValue && !(leftValue === null && rightValue === null)) continue;
    fields.push({
      key: fieldPath,
      scope: 'common',
      valueType: scalarType(leftValue),
      common: leftValue,
    });
  }
  return fields;
}

function topLevelStringSkeleton(object: ts.ObjectLiteralExpression): Record<string, string> {
  const result: Record<string, string> = {};
  for (const property of object.properties) {
    const name = propertyName(property);
    if (!name) continue;
    const value = ts.isPropertyAssignment(property)
      ? stringValue(property.initializer)
      : ts.isShorthandPropertyAssignment(property)
        ? stringValue(property.name)
        : undefined;
    if (value !== undefined) result[name] = value;
  }
  return result;
}

function itemLabel(fields: StructureFieldEntry[], fallback: string): string {
  const localized = fields.find(field => field.scope === 'locale' && field.uk)?.uk;
  if (localized) return shortLabel(localized);
  const commonText = fields.find(field => field.scope === 'common' && typeof field.common === 'string')?.common;
  return shortLabel(typeof commonText === 'string' ? commonText : fallback);
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
    const fields = collectStructureFields(a, b);
    if (!fields.length) return;
    const ukObject = topLevelStringSkeleton(a);
    const ruObject = topLevelStringSkeleton(b);
    ukSkeleton.push(ukObject);
    ruSkeleton.push(ruObject);
    items.push({
      id: legacyStructureItemId(ukObject, ruObject, index),
      label: itemLabel(fields, `Элемент ${index + 1}`),
      fields,
    });
  }

  const id = legacyStructureKey(ukSkeleton, ruSkeleton);
  const info = sourceInfo(sourceFile, anchor);
  if (!structures.has(id)) structures.set(id, {
    id,
    ...info,
    label: `${info.page}: ${items[0]?.label || 'список'}`,
    items,
  });
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
            } else {
              entries.set(id, { id, kind: 't', ...info, label: `${key} — ${shortLabel(uk || ru || en)}`, uk, ru, en });
            }
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
const structureHeader = `import type { StructureScalar } from '../lib/fullPageEditing';\n\nexport type EditableStructureFieldScope = 'locale' | 'common';\nexport type EditableStructureFieldType = 'string' | 'number' | 'boolean' | 'null';\nexport interface EditableStructureField { key: string; scope: EditableStructureFieldScope; valueType: EditableStructureFieldType; copyId?: string; uk?: string; ru?: string; en?: string; common?: StructureScalar; }\nexport interface EditableStructureItem { id: string; label: string; fields: EditableStructureField[]; }\nexport interface EditableStructureCatalogEntry { id: string; page: string; source: string; line: number; label: string; items: EditableStructureItem[]; }\n\n`;
fs.writeFileSync(structuresOutputPath, structureHeader + `export const EDITABLE_STRUCTURE_CATALOG: EditableStructureCatalogEntry[] = ${JSON.stringify(structureSorted, null, 2)};\n`, 'utf8');
console.log(`Generated ${sorted.length} editable public copy entries and ${structureSorted.length} editable structures.`);
