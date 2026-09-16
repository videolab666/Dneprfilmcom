import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { versionedSetDoc as setDoc } from './cmsVersioning';
import type { CaseStudy } from '../types';
import { getCaseSlug } from './caseMedia';
import { getGallerySlug, isPhotoGallery, type PhotoGallery } from './galleryContent';
import { getVideoProjectSlug, isVideoProject, type VideoProject } from './videoPortfolio';
import { normalizeArticle } from './articleCms';
import { isProjectRelation, type ProjectRelation } from './projectRelations';
import type { PublishQualityType } from './publishQuality';

export interface SeoIntelligenceRecord {
  key: string;
  id: string;
  type: PublishQualityType;
  collectionName: 'cases' | 'site_settings' | 'articles';
  title: string;
  slug: string;
  path: string;
  published: boolean;
  category: string;
  tags: string[];
  raw: Record<string, unknown>;
}

export interface SeoLinkSuggestion {
  target: SeoIntelligenceRecord;
  score: number;
  reasons: string[];
  alreadyLinked: boolean;
}

export interface SeoGraphItem extends SeoIntelligenceRecord {
  incomingKeys: string[];
  outgoingKeys: string[];
  incomingCount: number;
  outgoingCount: number;
  orphan: boolean;
  canonicalIssues: string[];
  suggestions: SeoLinkSuggestion[];
}

export interface SeoIntelligenceReport {
  records: SeoGraphItem[];
  totalPublished: number;
  orphanCount: number;
  linkedCount: number;
  canonicalIssueCount: number;
}

interface LoadedSeoData {
  records: SeoIntelligenceRecord[];
  relations: ProjectRelation[];
}

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(item => String(item || '').trim()).filter(Boolean)
    : [];
}

function taxonomy(raw: Record<string, unknown>): { category: string; tags: string[] } {
  const nested = recordOf(raw.taxonomy);
  const category = stringValue(nested.category)
    || stringValue(raw.category)
    || stringValue(raw.categoryLabel)
    || stringValue(raw.category_uk)
    || stringValue(raw.category_en);
  const tags = [...stringArray(nested.tags), ...stringArray(raw.tags)];
  return { category, tags: Array.from(new Set(tags.map(tag => tag.toLowerCase()))) };
}

function caseRecord(id: string, raw: Record<string, unknown>): SeoIntelligenceRecord {
  const item = { id, ...raw } as unknown as CaseStudy;
  const slug = getCaseSlug(item);
  return {
    key: `case:${id}`,
    id,
    type: 'case',
    collectionName: 'cases',
    title: item.title_uk || item.title || item.title_en || id,
    slug,
    path: `/cases/${encodeURIComponent(slug)}`,
    published: raw.published !== false,
    ...taxonomy(raw),
    raw,
  };
}

function galleryRecord(id: string, raw: Record<string, unknown>): SeoIntelligenceRecord | null {
  const item = { id, ...raw };
  if (!isPhotoGallery(item)) return null;
  const gallery = item as PhotoGallery;
  const slug = getGallerySlug(gallery);
  return {
    key: `gallery:${id}`,
    id,
    type: 'gallery',
    collectionName: 'site_settings',
    title: gallery.title_uk || gallery.title || gallery.title_en || id,
    slug,
    path: `/galleries/${encodeURIComponent(slug)}`,
    published: gallery.published !== false,
    ...taxonomy(raw),
    raw,
  };
}

function videoRecord(id: string, raw: Record<string, unknown>): SeoIntelligenceRecord | null {
  const item = { id, ...raw };
  if (!isVideoProject(item)) return null;
  const project = item as VideoProject;
  const slug = getVideoProjectSlug(project);
  return {
    key: `video:${id}`,
    id,
    type: 'video',
    collectionName: 'site_settings',
    title: project.title_uk || project.title || project.title_en || id,
    slug,
    path: `/videos/${encodeURIComponent(slug)}`,
    published: project.published !== false,
    ...taxonomy(raw),
    raw,
  };
}

function articleRecord(id: string, raw: Record<string, unknown>): SeoIntelligenceRecord {
  const article = normalizeArticle(id, raw);
  return {
    key: `article:${id}`,
    id,
    type: 'article',
    collectionName: 'articles',
    title: article.uk.title || article.ru.title || article.en?.title || id,
    slug: article.slug,
    path: `/media-center/${encodeURIComponent(article.slug)}`,
    published: article.published,
    ...taxonomy(raw),
    raw,
  };
}

function addEdge(edges: Map<string, Set<string>>, source: string, target: string): void {
  if (!source || !target || source === target) return;
  if (!edges.has(source)) edges.set(source, new Set());
  edges.get(source)!.add(target);
}

function walkStrings(value: unknown, output: string[], depth = 0): void {
  if (depth > 15 || value == null) return;
  if (typeof value === 'string') {
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(child => walkStrings(child, output, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(child => walkStrings(child, output, depth + 1));
  }
}

function internalPaths(raw: Record<string, unknown>): string[] {
  const values: string[] = [];
  walkStrings(raw, values);
  const result = new Set<string>();
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  for (const value of values) {
    const matches = value.match(/(?:https?:\/\/[^\s"')]+)?\/(?:Dneprfilmcom\/)?(?:cases|galleries|videos|media-center)\/[^\s"')?#]+/g) || [];
    for (const match of matches) {
      try {
        let pathname = match;
        if (match.startsWith('http')) {
          const parsed = new URL(match);
          if (currentOrigin && parsed.origin !== currentOrigin) continue;
          pathname = parsed.pathname;
        }
        const clean = pathname.replace(/^\/Dneprfilmcom/, '').replace(/\/$/, '');
        if (clean) result.add(clean);
      } catch {
        // Ignore malformed manual URLs.
      }
    }
  }
  return [...result];
}

function articleRelationKeys(record: SeoIntelligenceRecord): string[] {
  if (record.type !== 'article') return [];
  return [
    ...stringArray(record.raw.relatedCaseIds).map(id => `case:${id}`),
    ...stringArray(record.raw.relatedGalleryIds).map(id => `gallery:${id}`),
    ...stringArray(record.raw.relatedVideoProjectIds).map(id => `video:${id}`),
  ];
}

function normalizedTokens(value: string): Set<string> {
  const stop = new Set(['для', 'про', 'при', 'the', 'and', 'with', 'from', 'video', 'фото', 'відео', 'видео', 'case', 'кейс']);
  return new Set(
    value.toLowerCase()
      .replace(/[^a-zа-яёіїєґ0-9]+/giu, ' ')
      .split(/\s+/)
      .map(token => token.trim())
      .filter(token => token.length >= 3 && !stop.has(token)),
  );
}

function suggestionScore(source: SeoIntelligenceRecord, target: SeoIntelligenceRecord): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  if (source.category && target.category && source.category.toLowerCase() === target.category.toLowerCase()) {
    score += 45;
    reasons.push('та же категория');
  }
  const targetTags = new Set(target.tags);
  const sharedTags = source.tags.filter(tag => targetTags.has(tag));
  if (sharedTags.length) {
    score += Math.min(36, sharedTags.length * 12);
    reasons.push(`общие теги: ${sharedTags.slice(0, 3).join(', ')}`);
  }
  const sourceTokens = normalizedTokens(source.title);
  const targetTokens = normalizedTokens(target.title);
  const sharedTokens = [...sourceTokens].filter(token => targetTokens.has(token));
  if (sharedTokens.length) {
    score += Math.min(24, sharedTokens.length * 8);
    reasons.push(`общие слова: ${sharedTokens.slice(0, 3).join(', ')}`);
  }
  if (source.type !== target.type) score += 6;
  return { score, reasons };
}

function canonicalIssues(record: SeoIntelligenceRecord, duplicatePath: boolean): string[] {
  const issues: string[] = [];
  const slug = record.slug.trim();
  if (!slug) issues.push('Пустой resolved slug');
  if (slug !== slug.toLowerCase()) issues.push('Slug содержит uppercase');
  if (/\s|[?#%]/.test(slug)) issues.push('Slug содержит пробел или служебный символ');
  if (/^\/+|\/+$/g.test(slug)) issues.push('Slug содержит ведущий/конечный slash');
  const expectedPrefix = record.type === 'case' ? '/cases/' : record.type === 'gallery' ? '/galleries/' : record.type === 'video' ? '/videos/' : '/media-center/';
  if (!record.path.startsWith(expectedPrefix)) issues.push('Canonical path не соответствует типу материала');
  if (duplicatePath) issues.push('Resolved canonical path дублируется другим опубликованным материалом');
  return issues;
}

export async function loadSeoIntelligenceData(): Promise<LoadedSeoData> {
  const [casesSnapshot, galleriesSnapshot, videosSnapshot, articlesSnapshot, relationsSnapshot] = await Promise.all([
    getDocs(collection(db, 'cases')),
    getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'gallery'))),
    getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'video_project'))),
    getDocs(collection(db, 'articles')),
    getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'project_relation'))),
  ]);

  const records = [
    ...casesSnapshot.docs.map(item => caseRecord(item.id, item.data() as Record<string, unknown>)),
    ...galleriesSnapshot.docs.map(item => galleryRecord(item.id, item.data() as Record<string, unknown>)).filter((item): item is SeoIntelligenceRecord => Boolean(item)),
    ...videosSnapshot.docs.map(item => videoRecord(item.id, item.data() as Record<string, unknown>)).filter((item): item is SeoIntelligenceRecord => Boolean(item)),
    ...articlesSnapshot.docs.map(item => articleRecord(item.id, item.data() as Record<string, unknown>)),
  ];
  const relations = relationsSnapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(isProjectRelation);
  return { records, relations };
}

export function buildSeoIntelligenceReport(data: LoadedSeoData): SeoIntelligenceReport {
  const published = data.records.filter(record => record.published);
  const byKey = new Map(published.map(record => [record.key, record]));
  const byPath = new Map(published.map(record => [decodeURIComponent(record.path), record]));
  const pathCounts = new Map<string, number>();
  published.forEach(record => {
    const path = decodeURIComponent(record.path).toLowerCase();
    pathCounts.set(path, (pathCounts.get(path) || 0) + 1);
  });
  const outgoing = new Map<string, Set<string>>();

  for (const record of published) {
    articleRelationKeys(record).forEach(target => { if (byKey.has(target)) addEdge(outgoing, record.key, target); });
    internalPaths(record.raw).forEach(path => {
      const target = byPath.get(decodeURIComponent(path));
      if (target) addEdge(outgoing, record.key, target.key);
    });
  }

  for (const relation of data.relations) {
    const caseKey = `case:${relation.caseId}`;
    if (!byKey.has(caseKey)) continue;
    relation.galleryIds.forEach(id => {
      const target = `gallery:${id}`;
      if (byKey.has(target)) {
        addEdge(outgoing, caseKey, target);
        addEdge(outgoing, target, caseKey);
      }
    });
    relation.videoProjectIds.forEach(id => {
      const target = `video:${id}`;
      if (byKey.has(target)) {
        addEdge(outgoing, caseKey, target);
        addEdge(outgoing, target, caseKey);
      }
    });
  }

  const incoming = new Map<string, Set<string>>();
  for (const [source, targets] of outgoing) {
    targets.forEach(target => {
      if (!incoming.has(target)) incoming.set(target, new Set());
      incoming.get(target)!.add(source);
    });
  }

  const records: SeoGraphItem[] = published.map(record => {
    const outgoingKeys = [...(outgoing.get(record.key) || [])];
    const incomingKeys = [...(incoming.get(record.key) || [])];
    const linkedSet = new Set(outgoingKeys);
    const suggestions = published
      .filter(target => target.key !== record.key)
      .map(target => {
        const result = suggestionScore(record, target);
        return { target, ...result, alreadyLinked: linkedSet.has(target.key) };
      })
      .filter(item => !item.alreadyLinked && item.score >= 12)
      .sort((a, b) => b.score - a.score || a.target.title.localeCompare(b.target.title))
      .slice(0, 6);
    const normalizedPath = decodeURIComponent(record.path).toLowerCase();
    return {
      ...record,
      incomingKeys,
      outgoingKeys,
      incomingCount: incomingKeys.length,
      outgoingCount: outgoingKeys.length,
      orphan: incomingKeys.length === 0,
      canonicalIssues: canonicalIssues(record, (pathCounts.get(normalizedPath) || 0) > 1),
      suggestions,
    };
  }).sort((a, b) => Number(b.orphan) - Number(a.orphan) || b.canonicalIssues.length - a.canonicalIssues.length || a.type.localeCompare(b.type) || a.title.localeCompare(b.title));

  return {
    records,
    totalPublished: records.length,
    orphanCount: records.filter(record => record.orphan).length,
    linkedCount: records.filter(record => !record.orphan).length,
    canonicalIssueCount: records.reduce((sum, record) => sum + record.canonicalIssues.length, 0),
  };
}

export async function addArticleInternalRelation(article: SeoGraphItem, target: SeoIntelligenceRecord): Promise<void> {
  if (article.type !== 'article') throw new Error('Автоприменение relation доступно только для статьи.');
  if (target.type === 'article') throw new Error('Связи article → article пока не поддерживаются текущей моделью данных.');
  const field = target.type === 'case' ? 'relatedCaseIds' : target.type === 'gallery' ? 'relatedGalleryIds' : 'relatedVideoProjectIds';
  const current = stringArray(article.raw[field]);
  if (current.includes(target.id)) return;
  await setDoc(doc(db, 'articles', article.id), {
    [field]: [...current, target.id],
    updatedAt: Date.now(),
  }, { merge: true });
}
