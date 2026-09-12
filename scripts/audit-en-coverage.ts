import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { LEGACY_EN_TRANSLATIONS, translateEnglishValue } from '../src/locales/legacyEnglish';
import { DEFAULT_PAGE_CONTENT } from '../src/data/pageContent';
import { DEFAULT_PAGE_COPY_CONTENT } from '../src/data/pageCopyContent';

const CYRILLIC = /[А-Яа-яЁёІіЇїЄєҐґ]/;
const missing = new Map<string, Set<string>>();

function report(group: string, text: string, location?: string) {
  if (!CYRILLIC.test(text)) return;
  if (LEGACY_EN_TRANSLATIONS[text]) return;
  const key = location ? `${group} :: ${location}` : group;
  if (!missing.has(key)) missing.set(key, new Set());
  missing.get(key)!.add(text);
}

function literalText(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

function collectCyrillicLiterals(node: ts.Node, sourceFile: ts.SourceFile, group: string) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    report(group, node.text, `${sourceFile.fileName}:${line + 1}`);
  }
  node.forEachChild(child => collectCyrillicLiterals(child, sourceFile, group));
}

function walkSourceFile(filePath: string) {
  const source = fs.readFileSync(filePath, 'utf8');
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      if (name === 'l' && node.arguments.length >= 2) {
        const uk = literalText(node.arguments[0]);
        const en = node.arguments.length >= 3 ? literalText(node.arguments[2]) : undefined;
        if (uk && (!en || CYRILLIC.test(en))) {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
          report('l()', uk, `${filePath}:${line + 1}`);
        }
      } else if (name === 'legacy' && node.arguments.length >= 2) {
        collectCyrillicLiterals(node.arguments[0], sf, 'legacy()');
      }
    }
    node.forEachChild(visit);
  }
  visit(sf);
}

function walkDir(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'admin') continue;
      walkDir(full);
    } else if (/\.(tsx|ts)$/.test(entry.name) && !full.includes(`${path.sep}locales${path.sep}`) && !full.includes(`${path.sep}data${path.sep}`)) {
      walkSourceFile(full);
    }
  }
}

function inspectTranslated(value: unknown, group: string, trail: string[] = []) {
  const translated = translateEnglishValue(value);
  function visit(current: unknown, currentTrail: string[]) {
    if (typeof current === 'string') {
      if (CYRILLIC.test(current)) report(group, current, currentTrail.join('.'));
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, i) => visit(item, [...currentTrail, String(i)]));
      return;
    }
    if (current && typeof current === 'object') {
      for (const [key, nested] of Object.entries(current as Record<string, unknown>)) {
        visit(nested, [...currentTrail, key]);
      }
    }
  }
  visit(translated, trail);
}

walkDir('src/pages');
walkDir('src/components');
inspectTranslated(DEFAULT_PAGE_CONTENT, 'DEFAULT_PAGE_CONTENT');
inspectTranslated(DEFAULT_PAGE_COPY_CONTENT, 'DEFAULT_PAGE_COPY_CONTENT');

let count = 0;
for (const values of missing.values()) count += values.size;
console.log(`MISSING_EN_TOTAL=${count}`);
for (const [where, values] of missing) {
  for (const text of values) console.log(`MISSING_EN\t${where}\t${JSON.stringify(text)}`);
}
