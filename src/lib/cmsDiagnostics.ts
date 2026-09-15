import { getApps, initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { db } from './firebase';
import { getCaseSlug } from './caseMedia';
import { normalizeArticle } from './articleCms';
import { getGallerySlug, isPhotoGallery, type PhotoGallery } from './galleryContent';
import { getVideoProjectSlug, isVideoProject, type VideoProject } from './videoPortfolio';
import { isProjectRelation, type ProjectRelation } from './projectRelations';
import { MEDIA_ASSET_KIND, loadMediaLibrary, type MediaLibraryAsset } from './mediaLibrary';
import { evaluateContentHealth, type ContentHealthGrade, type ContentHealthIssue } from './contentHealth';
import type { PublishQualityType } from './publishQuality';
import type { Article, CaseStudy } from '../types';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';
export type SecurityProbeStatus = 'ok' | 'warning' | 'error';

export interface DiagnosticIssue {
  id: string;
  severity: DiagnosticSeverity;
  title: string;
  detail: string;
  entityType?: PublishQualityType;
  entityId?: string;
  publicPath?: string;
}

export interface SecurityProbeCheck {
  id: string;
  label: string;
  expected: 'allow' | 'deny';
  passed: boolean;
  detail: string;
}

export interface EntityCount {
  total: number;
  published: number;
  draft: number;
}

export interface ContentHealthEntity {
  key: string;
  type: PublishQualityType;
  id: string;
  title: string;
  slug: string;
  publicPath: string;
  published: boolean;
  score: number;
  grade: ContentHealthGrade;
  errors: number;
  warnings: number;
  infos: number;
  issues: ContentHealthIssue[];
}

export interface ContentHealthTypeSummary extends EntityCount {
  score: number;
  errors: number;
  warnings: number;
  infos: number;
}

export interface CmsDiagnosticsReport {
  generatedAt: number;
  migration: {
    version: number;
    migratedAt?: number;
    legacyVideoWorks: number;
    legacyPhotoItems: number;
    legacyConstructionWorks: number;
  };
  counts: {
    cases: EntityCount;
    galleries: EntityCount;
    videos: EntityCount;
    articles: EntityCount;
    relations: number;
    mediaRegistry: number;
  };
  health: {
    score: number;
    total: number;
    excellent: number;
    good: number;
    needsWork: number;
    critical: number;
    errors: number;
    warnings: number;
    infos: number;
    byType: Record<PublishQualityType, ContentHealthTypeSummary>;
    items: ContentHealthEntity[];
  };
  duplicateIssues: DiagnosticIssue[];
  relationIssues: DiagnosticIssue[];
  contentIssues: DiagnosticIssue[];
  media: {
    total: number;
    registered: number;
    used: number;
    unusedRegistered: number;
    unregisteredReferenced: number;
    duplicateRegistryUrls: number;
    orphanAssets: MediaLibraryAsset[];
    unregisteredAssets: MediaLibraryAsset[];
  };
  security: {
    status: SecurityProbeStatus;
    checks: SecurityProbeCheck[];
  };
}

interface GenericRecord extends Record<string, unknown> {
  id: string;
}

interface HealthSource {
  type: PublishQualityType;
  id: string;
  title: string;
  slug: string;
  publicPath: string;
  published: boolean;
  data: Record<string, unknown>;
}

const PUBLIC_PROBE_APP_NAME = 'cms-diagnostics-public-probe';
const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || 'ai-studio-2b172e30-4fd3-4131-ba5b-61712d198b9e';

function getPublicProbeDb() {
  const existing = getApps().find(app => app.name === PUBLIC_PROBE_APP_NAME);
  const app = existing || initializeApp(firebaseConfig, PUBLIC_PROBE_APP_NAME);
  return getFirestore(app, FIRESTORE_DATABASE_ID);
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) return String((error as { code?: unknown }).code || '');
  return '';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function probe(id: string, label: string, expected: 'allow' | 'deny', action: () => Promise<unknown>): Promise<SecurityProbeCheck> {
  try {
    await action();
    return {
      id,
      label,
      expected,
      passed: expected === 'allow',
      detail: expected === 'allow' ? 'Запрос разрешён как ожидалось.' : 'Запрос неожиданно разрешён анонимному клиенту.',
    };
  } catch (error) {
    const code = errorCode(error);
    const denied = code === 'permission-denied' || code.endsWith('/permission-denied');
    return {
      id,
      label,
      expected,
      passed: expected === 'deny' && denied,
      detail: expected === 'deny' && denied ? 'Firestore вернул permission-denied как ожидалось.' : `${code || 'error'}: ${errorMessage(error)}`,
    };
  }
}

function numberLike(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object') {
    const candidate = value as { toMillis?: () => number; seconds?: number };
    if (typeof candidate.toMillis === 'function') {
      const millis = candidate.toMillis();
      return Number.isFinite(millis) ? millis : undefined;
    }
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  }
  return undefined;
}

function nestedArrayLength(value: unknown, path: string[]): number {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== 'object') return 0;
    current = (current as Record<string, unknown>)[key];
  }
  return Array.isArray(current) ? current.length : 0;
}

function titleValue(value: { title?: string; title_uk?: string; title_en?: string; id: string }): string {
  return value.title_uk?.trim() || value.title?.trim() || value.title_en?.trim() || value.id;
}

function articleTitle(article: Article): string {
  return article.uk?.title?.trim() || article.ru?.title?.trim() || article.en?.title?.trim() || article.id;
}

function normalizeTitle(value: string): string {
  return value.toLocaleLowerCase('uk-UA').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function stringIds(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map(item => item.trim()).filter(Boolean) : [];
}

function entityCount(items: Array<{ published?: boolean }>): EntityCount {
  const published = items.filter(item => item.published === true).length;
  return { total: items.length, published, draft: items.length - published };
}

function duplicateIssuesFor(
  entityLabel: string,
  type: PublishQualityType,
  entities: Array<{ id: string; title: string; slug: string; publicPath: string }>,
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const bySlug = new Map<string, Array<{ id: string; publicPath: string }>>();
  const byTitle = new Map<string, Array<{ id: string; publicPath: string }>>();

  for (const entity of entities) {
    const slug = entity.slug.trim().toLowerCase();
    const normalizedTitle = normalizeTitle(entity.title);
    if (slug) bySlug.set(slug, [...(bySlug.get(slug) || []), { id: entity.id, publicPath: entity.publicPath }]);
    if (normalizedTitle) byTitle.set(normalizedTitle, [...(byTitle.get(normalizedTitle) || []), { id: entity.id, publicPath: entity.publicPath }]);
  }

  for (const [slug, entries] of bySlug) {
    if (entries.length < 2) continue;
    issues.push({
      id: `${entityLabel}-slug-${slug}`,
      severity: 'error',
      title: `Дублирующий slug в ${entityLabel}`,
      detail: `${slug}: ${entries.map(item => item.id).join(', ')}`,
      entityType: type,
      entityId: entries[0]?.id,
      publicPath: entries[0]?.publicPath,
    });
  }

  for (const [normalizedTitle, entries] of byTitle) {
    if (entries.length < 2) continue;
    issues.push({
      id: `${entityLabel}-title-${normalizedTitle}`,
      severity: 'warning',
      title: `Похожие записи по названию в ${entityLabel}`,
      detail: `${normalizedTitle}: ${entries.map(item => item.id).join(', ')}`,
      entityType: type,
      entityId: entries[0]?.id,
      publicPath: entries[0]?.publicPath,
    });
  }

  return issues;
}

function relationDiagnostics(
  relations: ProjectRelation[],
  cases: CaseStudy[],
  galleries: PhotoGallery[],
  videos: VideoProject[],
  articles: Array<Article & Record<string, unknown>>,
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const caseById = new Map(cases.map(item => [item.id, item]));
  const galleryById = new Map(galleries.map(item => [item.id, item]));
  const videoById = new Map(videos.map(item => [item.id, item]));
  const relationsByCase = new Map<string, ProjectRelation[]>();

  for (const relation of relations) {
    relationsByCase.set(relation.caseId, [...(relationsByCase.get(relation.caseId) || []), relation]);
    if (!caseById.has(relation.caseId)) {
      issues.push({ id: `${relation.id}-case-missing`, severity: 'error', title: 'Связь ссылается на отсутствующий кейс', detail: `${relation.id} → ${relation.caseId}`, entityType: 'case', entityId: relation.caseId });
    }
    if (!relation.galleryIds.length && !relation.videoProjectIds.length) {
      issues.push({ id: `${relation.id}-empty`, severity: 'warning', title: 'Пустая связь портфолио', detail: `${relation.id} не содержит gallery/video ссылок.`, entityType: 'case', entityId: relation.caseId });
    }

    for (const galleryId of new Set(relation.galleryIds)) {
      const gallery = galleryById.get(galleryId);
      if (!gallery) {
        issues.push({ id: `${relation.id}-gallery-${galleryId}`, severity: 'error', title: 'Связь ссылается на отсутствующую галерею', detail: `${relation.id} → ${galleryId}`, entityType: 'case', entityId: relation.caseId });
      } else if (gallery.published !== true) {
        issues.push({ id: `${relation.id}-gallery-draft-${galleryId}`, severity: 'warning', title: 'Связь ведёт на draft-галерею', detail: `${titleValue(gallery)} (${galleryId}) не показывается публично.`, entityType: 'gallery', entityId: galleryId, publicPath: `/galleries/${encodeURIComponent(getGallerySlug(gallery))}` });
      }
    }

    for (const videoId of new Set(relation.videoProjectIds)) {
      const video = videoById.get(videoId);
      if (!video) {
        issues.push({ id: `${relation.id}-video-${videoId}`, severity: 'error', title: 'Связь ссылается на отсутствующий видеопроект', detail: `${relation.id} → ${videoId}`, entityType: 'case', entityId: relation.caseId });
      } else if (video.published !== true) {
        issues.push({ id: `${relation.id}-video-draft-${videoId}`, severity: 'warning', title: 'Связь ведёт на draft-видеопроект', detail: `${titleValue(video)} (${videoId}) не показывается публично.`, entityType: 'video', entityId: videoId, publicPath: `/videos/${encodeURIComponent(getVideoProjectSlug(video))}` });
      }
    }

    if (new Set(relation.galleryIds).size !== relation.galleryIds.length) issues.push({ id: `${relation.id}-gallery-duplicates`, severity: 'warning', title: 'Повторяющиеся gallery ID в связи', detail: relation.id, entityType: 'case', entityId: relation.caseId });
    if (new Set(relation.videoProjectIds).size !== relation.videoProjectIds.length) issues.push({ id: `${relation.id}-video-duplicates`, severity: 'warning', title: 'Повторяющиеся video ID в связи', detail: relation.id, entityType: 'case', entityId: relation.caseId });
  }

  for (const [caseId, items] of relationsByCase) {
    if (items.length > 1) issues.push({ id: `duplicate-relations-${caseId}`, severity: 'error', title: 'Несколько relation-документов для одного кейса', detail: `${caseId}: ${items.map(item => item.id).join(', ')}`, entityType: 'case', entityId: caseId });
  }

  for (const article of articles) {
    const publicPath = `/media-center/${encodeURIComponent(article.slug)}`;
    const groups: Array<{ label: string; ids: string[]; lookup: Map<string, { published?: boolean }> }> = [
      { label: 'кейс', ids: stringIds(article.relatedCaseIds), lookup: caseById },
      { label: 'галерею', ids: stringIds(article.relatedGalleryIds), lookup: galleryById },
      { label: 'видеопроект', ids: stringIds(article.relatedVideoProjectIds), lookup: videoById },
    ];

    for (const group of groups) {
      if (new Set(group.ids).size !== group.ids.length) issues.push({ id: `article-${article.id}-${group.label}-duplicates`, severity: 'warning', title: 'Повторяющиеся ID в связях статьи', detail: `${articleTitle(article)}: ${group.label}`, entityType: 'article', entityId: article.id, publicPath });
      for (const id of new Set(group.ids)) {
        const linked = group.lookup.get(id);
        if (!linked) issues.push({ id: `article-${article.id}-${group.label}-${id}-missing`, severity: 'error', title: `Статья ссылается на отсутствующую ${group.label}`, detail: `${articleTitle(article)} → ${id}`, entityType: 'article', entityId: article.id, publicPath });
        else if (linked.published !== true) issues.push({ id: `article-${article.id}-${group.label}-${id}-draft`, severity: 'warning', title: 'Связанный материал статьи находится в draft', detail: `${articleTitle(article)} → ${id}`, entityType: 'article', entityId: article.id, publicPath });
      }
    }
  }

  return issues;
}

function contentDiagnostics(cases: CaseStudy[], galleries: PhotoGallery[], videos: VideoProject[]): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  for (const item of cases) {
    const empty = (item.media || []).filter(media => !media.url?.trim()).length;
    if (empty) issues.push({ id: `case-empty-media-${item.id}`, severity: 'warning', title: 'Пустые media-элементы в кейсе', detail: `${titleValue(item)}: ${empty}`, entityType: 'case', entityId: item.id, publicPath: `/cases/${encodeURIComponent(getCaseSlug(item))}` });
  }
  for (const item of galleries) {
    const empty = (item.images || []).filter(media => !media.url?.trim()).length;
    if (empty) issues.push({ id: `gallery-empty-images-${item.id}`, severity: 'warning', title: 'Пустые изображения в галерее', detail: `${titleValue(item)}: ${empty}`, entityType: 'gallery', entityId: item.id, publicPath: `/galleries/${encodeURIComponent(getGallerySlug(item))}` });
  }
  for (const item of videos) {
    const empty = (item.videos || []).filter(media => !media.url?.trim()).length;
    if (empty) issues.push({ id: `video-empty-media-${item.id}`, severity: 'warning', title: 'Пустые video-элементы в проекте', detail: `${titleValue(item)}: ${empty}`, entityType: 'video', entityId: item.id, publicPath: `/videos/${encodeURIComponent(getVideoProjectSlug(item))}` });
  }
  return issues;
}

function duplicateRegistryUrlCount(records: GenericRecord[]): number {
  const counts = new Map<string, number>();
  for (const record of records) {
    if (record.kind !== MEDIA_ASSET_KIND || typeof record.url !== 'string' || !record.url) continue;
    counts.set(record.url, (counts.get(record.url) || 0) + 1);
  }
  return Array.from(counts.values()).filter(count => count > 1).length;
}

function buildHealthReport(sources: HealthSource[], relations: ProjectRelation[]): CmsDiagnosticsReport['health'] {
  const duplicateKeys = new Set<string>();
  for (const type of ['case', 'gallery', 'video', 'article'] as PublishQualityType[]) {
    const bySlug = new Map<string, HealthSource[]>();
    for (const item of sources.filter(source => source.type === type)) {
      const slug = item.slug.trim().toLowerCase();
      if (slug) bySlug.set(slug, [...(bySlug.get(slug) || []), item]);
    }
    for (const group of bySlug.values()) if (group.length > 1) group.forEach(item => duplicateKeys.add(`${item.type}:${item.id}`));
  }

  const caseMap = new Map(sources.filter(item => item.type === 'case').map(item => [item.id, item]));
  const galleryMap = new Map(sources.filter(item => item.type === 'gallery').map(item => [item.id, item]));
  const videoMap = new Map(sources.filter(item => item.type === 'video').map(item => [item.id, item]));
  const relationByCase = new Map(relations.map(item => [item.caseId, item]));

  const items: ContentHealthEntity[] = sources.map(source => {
    let brokenRelation = false;
    if (source.type === 'case') {
      const relation = relationByCase.get(source.id);
      brokenRelation = Boolean(relation && (relation.galleryIds.some(id => !galleryMap.has(id)) || relation.videoProjectIds.some(id => !videoMap.has(id))));
    } else if (source.type === 'article') {
      brokenRelation = stringIds(source.data.relatedCaseIds).some(id => !caseMap.has(id))
        || stringIds(source.data.relatedGalleryIds).some(id => !galleryMap.has(id))
        || stringIds(source.data.relatedVideoProjectIds).some(id => !videoMap.has(id));
    }

    const health = evaluateContentHealth(source.type, source.data, { duplicateSlug: duplicateKeys.has(`${source.type}:${source.id}`), brokenRelation });
    return {
      key: `${source.type}:${source.id}`,
      type: source.type,
      id: source.id,
      title: source.title,
      slug: source.slug,
      publicPath: source.publicPath,
      published: source.published,
      score: health.score,
      grade: health.grade,
      errors: health.issues.filter(issue => issue.severity === 'error').length,
      warnings: health.issues.filter(issue => issue.severity === 'warning').length,
      infos: health.issues.filter(issue => issue.severity === 'info').length,
      issues: health.issues,
    };
  }).sort((a, b) => a.score - b.score || b.errors - a.errors || b.warnings - a.warnings || a.title.localeCompare(b.title));

  const summarize = (type: PublishQualityType): ContentHealthTypeSummary => {
    const subset = items.filter(item => item.type === type);
    const published = subset.filter(item => item.published).length;
    return {
      total: subset.length,
      published,
      draft: subset.length - published,
      score: subset.length ? Math.round(subset.reduce((sum, item) => sum + item.score, 0) / subset.length) : 100,
      errors: subset.reduce((sum, item) => sum + item.errors, 0),
      warnings: subset.reduce((sum, item) => sum + item.warnings, 0),
      infos: subset.reduce((sum, item) => sum + item.infos, 0),
    };
  };

  return {
    score: items.length ? Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length) : 100,
    total: items.length,
    excellent: items.filter(item => item.grade === 'excellent').length,
    good: items.filter(item => item.grade === 'good').length,
    needsWork: items.filter(item => item.grade === 'needs-work').length,
    critical: items.filter(item => item.grade === 'critical').length,
    errors: items.reduce((sum, item) => sum + item.errors, 0),
    warnings: items.reduce((sum, item) => sum + item.warnings, 0),
    infos: items.reduce((sum, item) => sum + item.infos, 0),
    byType: { case: summarize('case'), gallery: summarize('gallery'), video: summarize('video'), article: summarize('article') },
    items,
  };
}

async function runSecurityProbe(
  cases: CaseStudy[],
  galleries: PhotoGallery[],
  videos: VideoProject[],
  articles: Array<Article & Record<string, unknown>>,
  settingsRecords: GenericRecord[],
): Promise<CmsDiagnosticsReport['security']> {
  const publicDb = getPublicProbeDb();
  const checks: SecurityProbeCheck[] = [];

  checks.push(await probe('global-public', 'Анонимное чтение site_settings/global', 'allow', () => getDoc(doc(publicDb, 'site_settings', 'global'))));
  checks.push(await probe('published-cases-query', 'Публичный query cases: published == true', 'allow', () => getDocs(query(collection(publicDb, 'cases'), where('published', '==', true)))));
  checks.push(await probe('published-articles-query', 'Публичный query articles: published == true', 'allow', () => getDocs(query(collection(publicDb, 'articles'), where('published', '==', true)))));
  checks.push(await probe('unfiltered-cases-denied', 'Анонимный unfiltered query cases', 'deny', () => getDocs(collection(publicDb, 'cases'))));
  checks.push(await probe('unfiltered-settings-denied', 'Анонимный unfiltered query site_settings', 'deny', () => getDocs(collection(publicDb, 'site_settings'))));

  const publishedGallery = galleries.find(item => item.published === true);
  if (publishedGallery) checks.push(await probe('published-gallery-direct', 'Прямое чтение опубликованной gallery', 'allow', () => getDoc(doc(publicDb, 'site_settings', publishedGallery.id))));
  const publishedVideo = videos.find(item => item.published === true);
  if (publishedVideo) checks.push(await probe('published-video-direct', 'Прямое чтение опубликованного video_project', 'allow', () => getDoc(doc(publicDb, 'site_settings', publishedVideo.id))));

  const draftCase = cases.find(item => item.published !== true);
  if (draftCase) checks.push(await probe('draft-case-direct', 'Прямое чтение draft-case', 'deny', () => getDoc(doc(publicDb, 'cases', draftCase.id))));
  const draftGallery = galleries.find(item => item.published !== true);
  if (draftGallery) checks.push(await probe('draft-gallery-direct', 'Прямое чтение draft-gallery', 'deny', () => getDoc(doc(publicDb, 'site_settings', draftGallery.id))));
  const draftVideo = videos.find(item => item.published !== true);
  if (draftVideo) checks.push(await probe('draft-video-direct', 'Прямое чтение draft-video_project', 'deny', () => getDoc(doc(publicDb, 'site_settings', draftVideo.id))));
  const draftArticle = articles.find(item => item.published !== true);
  if (draftArticle) checks.push(await probe('draft-article-direct', 'Прямое чтение draft-article', 'deny', () => getDoc(doc(publicDb, 'articles', draftArticle.id))));

  const mediaAsset = settingsRecords.find(item => item.kind === MEDIA_ASSET_KIND);
  if (mediaAsset) checks.push(await probe('media-asset-direct', 'Прямое анонимное чтение media_asset', 'deny', () => getDoc(doc(publicDb, 'site_settings', mediaAsset.id))));

  const failed = checks.filter(check => !check.passed);
  const networkLike = failed.some(check => !/permission-denied|unexpectedly|неожиданно/i.test(check.detail));
  return { status: failed.length === 0 ? 'ok' : networkLike ? 'warning' : 'error', checks };
}

export async function loadCmsDiagnostics(): Promise<CmsDiagnosticsReport> {
  const [casesSnapshot, settingsSnapshot, articlesSnapshot, mediaAssets] = await Promise.all([
    getDocs(collection(db, 'cases')),
    getDocs(collection(db, 'site_settings')),
    getDocs(collection(db, 'articles')),
    loadMediaLibrary(),
  ]);

  const cases = casesSnapshot.docs.map(snapshot => ({ id: snapshot.id, ...snapshot.data() } as CaseStudy));
  const settingsRecords = settingsSnapshot.docs.map(snapshot => ({ id: snapshot.id, ...snapshot.data() } as GenericRecord));
  const articleRecords = articlesSnapshot.docs.map(snapshot => ({ id: snapshot.id, ...snapshot.data() } as GenericRecord));
  const articles = articleRecords.map(record => normalizeArticle(record.id, record) as Article & Record<string, unknown>);
  const galleries = settingsRecords.filter(isPhotoGallery) as PhotoGallery[];
  const videos = settingsRecords.filter(isVideoProject) as VideoProject[];
  const relations = settingsRecords.filter(isProjectRelation) as ProjectRelation[];
  const global = settingsRecords.find(item => item.id === 'global') || ({ id: 'global' } as GenericRecord);

  const caseEntities = cases.map(item => ({ id: item.id, title: titleValue(item), slug: getCaseSlug(item), publicPath: `/cases/${encodeURIComponent(getCaseSlug(item))}` }));
  const galleryEntities = galleries.map(item => ({ id: item.id, title: titleValue(item), slug: getGallerySlug(item), publicPath: `/galleries/${encodeURIComponent(getGallerySlug(item))}` }));
  const videoEntities = videos.map(item => ({ id: item.id, title: titleValue(item), slug: getVideoProjectSlug(item), publicPath: `/videos/${encodeURIComponent(getVideoProjectSlug(item))}` }));
  const articleEntities = articles.map(item => ({ id: item.id, title: articleTitle(item), slug: item.slug, publicPath: `/media-center/${encodeURIComponent(item.slug)}` }));

  const healthSources: HealthSource[] = [
    ...cases.map(item => ({ type: 'case' as const, id: item.id, title: titleValue(item), slug: getCaseSlug(item), publicPath: `/cases/${encodeURIComponent(getCaseSlug(item))}`, published: item.published === true, data: item as unknown as Record<string, unknown> })),
    ...galleries.map(item => ({ type: 'gallery' as const, id: item.id, title: titleValue(item), slug: getGallerySlug(item), publicPath: `/galleries/${encodeURIComponent(getGallerySlug(item))}`, published: item.published === true, data: item as unknown as Record<string, unknown> })),
    ...videos.map(item => ({ type: 'video' as const, id: item.id, title: titleValue(item), slug: getVideoProjectSlug(item), publicPath: `/videos/${encodeURIComponent(getVideoProjectSlug(item))}`, published: item.published === true, data: item as unknown as Record<string, unknown> })),
    ...articles.map(item => ({ type: 'article' as const, id: item.id, title: articleTitle(item), slug: item.slug, publicPath: `/media-center/${encodeURIComponent(item.slug)}`, published: item.published === true, data: item as unknown as Record<string, unknown> })),
  ];

  const orphanAssets = mediaAssets.filter(asset => asset.registered && asset.useCount === 0);
  const unregisteredAssets = mediaAssets.filter(asset => !asset.registered && asset.useCount > 0);
  const registered = mediaAssets.filter(asset => asset.registered).length;
  const used = mediaAssets.filter(asset => asset.useCount > 0).length;
  const mediaRegistry = settingsRecords.filter(item => item.kind === MEDIA_ASSET_KIND).length;

  return {
    generatedAt: Date.now(),
    migration: {
      version: typeof global.portfolioMigrationVersion === 'number' ? global.portfolioMigrationVersion : 0,
      migratedAt: numberLike(global.portfolioMigratedAt),
      legacyVideoWorks: nestedArrayLength(global.pageContent, ['video', 'works']),
      legacyPhotoItems: nestedArrayLength(global.pageContent, ['photo', 'gallery']),
      legacyConstructionWorks: nestedArrayLength(global.pageContent, ['construction', 'works']),
    },
    counts: {
      cases: entityCount(cases),
      galleries: entityCount(galleries),
      videos: entityCount(videos),
      articles: entityCount(articles),
      relations: relations.length,
      mediaRegistry,
    },
    health: buildHealthReport(healthSources, relations),
    duplicateIssues: [
      ...duplicateIssuesFor('Cases', 'case', caseEntities),
      ...duplicateIssuesFor('Galleries', 'gallery', galleryEntities),
      ...duplicateIssuesFor('Videos', 'video', videoEntities),
      ...duplicateIssuesFor('Articles', 'article', articleEntities),
    ],
    relationIssues: relationDiagnostics(relations, cases, galleries, videos, articles),
    contentIssues: contentDiagnostics(cases, galleries, videos),
    media: {
      total: mediaAssets.length,
      registered,
      used,
      unusedRegistered: orphanAssets.length,
      unregisteredReferenced: unregisteredAssets.length,
      duplicateRegistryUrls: duplicateRegistryUrlCount(settingsRecords),
      orphanAssets,
      unregisteredAssets,
    },
    security: await runSecurityProbe(cases, galleries, videos, articles, settingsRecords),
  };
}
