import { getApps, initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { db } from './firebase';
import { getCaseSlug, normalizedCaseMedia } from './caseMedia';
import {
  GALLERY_KIND,
  getGallerySlug,
  isPhotoGallery,
  type PhotoGallery,
} from './galleryContent';
import {
  VIDEO_PROJECT_KIND,
  getVideoProjectSlug,
  isVideoProject,
  type VideoProject,
} from './videoPortfolio';
import {
  PROJECT_RELATION_KIND,
  isProjectRelation,
  type ProjectRelation,
} from './projectRelations';
import {
  MEDIA_ASSET_KIND,
  loadMediaLibrary,
  type MediaLibraryAsset,
} from './mediaLibrary';
import type { CaseStudy } from '../types';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';
export type SecurityProbeStatus = 'ok' | 'warning' | 'error';

export interface DiagnosticIssue {
  id: string;
  severity: DiagnosticSeverity;
  title: string;
  detail: string;
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
    relations: number;
    mediaRegistry: number;
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

const PUBLIC_PROBE_APP_NAME = 'cms-diagnostics-public-probe';
const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId
  || 'ai-studio-2b172e30-4fd3-4131-ba5b-61712d198b9e';

function getPublicProbeDb() {
  const existing = getApps().find(app => app.name === PUBLIC_PROBE_APP_NAME);
  const app = existing || initializeApp(firebaseConfig, PUBLIC_PROBE_APP_NAME);
  return getFirestore(app, FIRESTORE_DATABASE_ID);
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code?: unknown }).code || '');
  }
  return '';
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function probe(
  id: string,
  label: string,
  expected: 'allow' | 'deny',
  action: () => Promise<unknown>,
): Promise<SecurityProbeCheck> {
  try {
    await action();
    return {
      id,
      label,
      expected,
      passed: expected === 'allow',
      detail: expected === 'allow'
        ? 'Запрос разрешён как ожидалось.'
        : 'Запрос неожиданно разрешён анонимному клиенту.',
    };
  } catch (error) {
    const code = errorCode(error);
    const denied = code === 'permission-denied' || code.endsWith('/permission-denied');
    return {
      id,
      label,
      expected,
      passed: expected === 'deny' && denied,
      detail: expected === 'deny' && denied
        ? 'Firestore вернул permission-denied как ожидалось.'
        : `${code || 'error'}: ${errorMessage(error)}`,
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

function normalizeTitle(value: string): string {
  return value
    .toLocaleLowerCase('uk-UA')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function duplicateIssuesFor(
  entityLabel: string,
  entities: Array<{ id: string; title: string; slug: string }>,
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const bySlug = new Map<string, string[]>();
  const byTitle = new Map<string, string[]>();

  for (const entity of entities) {
    const slug = entity.slug.trim().toLowerCase();
    if (slug) bySlug.set(slug, [...(bySlug.get(slug) || []), entity.id]);
    const title = normalizeTitle(entity.title);
    if (title) byTitle.set(title, [...(byTitle.get(title) || []), entity.id]);
  }

  for (const [slug, ids] of bySlug) {
    if (ids.length < 2) continue;
    issues.push({
      id: `${entityLabel}-slug-${slug}`,
      severity: 'error',
      title: `Дублирующий slug в ${entityLabel}`,
      detail: `${slug}: ${ids.join(', ')}`,
    });
  }

  for (const [title, ids] of byTitle) {
    if (ids.length < 2) continue;
    issues.push({
      id: `${entityLabel}-title-${title}`,
      severity: 'warning',
      title: `Похожие записи по названию в ${entityLabel}`,
      detail: `${title}: ${ids.join(', ')}`,
    });
  }

  return issues;
}

function entityCount(items: Array<{ published?: boolean }>): EntityCount {
  const published = items.filter(item => item.published === true).length;
  return {
    total: items.length,
    published,
    draft: items.length - published,
  };
}

function relationDiagnostics(
  relations: ProjectRelation[],
  cases: CaseStudy[],
  galleries: PhotoGallery[],
  videos: VideoProject[],
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const caseById = new Map(cases.map(item => [item.id, item]));
  const galleryById = new Map(galleries.map(item => [item.id, item]));
  const videoById = new Map(videos.map(item => [item.id, item]));
  const relationsByCase = new Map<string, ProjectRelation[]>();

  for (const relation of relations) {
    relationsByCase.set(relation.caseId, [...(relationsByCase.get(relation.caseId) || []), relation]);
    const linkedCase = caseById.get(relation.caseId);
    if (!linkedCase) {
      issues.push({
        id: `${relation.id}-case-missing`,
        severity: 'error',
        title: 'Связь ссылается на отсутствующий кейс',
        detail: `${relation.id} → ${relation.caseId}`,
      });
    }

    if (!relation.galleryIds.length && !relation.videoProjectIds.length) {
      issues.push({
        id: `${relation.id}-empty`,
        severity: 'warning',
        title: 'Пустая связь портфолио',
        detail: `${relation.id} не содержит gallery/video ссылок.`,
      });
    }

    for (const galleryId of new Set(relation.galleryIds)) {
      const gallery = galleryById.get(galleryId);
      if (!gallery) {
        issues.push({
          id: `${relation.id}-gallery-${galleryId}`,
          severity: 'error',
          title: 'Связь ссылается на отсутствующую галерею',
          detail: `${relation.id} → ${galleryId}`,
        });
      } else if (gallery.published !== true) {
        issues.push({
          id: `${relation.id}-gallery-draft-${galleryId}`,
          severity: 'warning',
          title: 'Связь ведёт на draft-галерею',
          detail: `${titleValue(gallery)} (${galleryId}) не показывается публично.`,
        });
      }
    }

    for (const videoId of new Set(relation.videoProjectIds)) {
      const video = videoById.get(videoId);
      if (!video) {
        issues.push({
          id: `${relation.id}-video-${videoId}`,
          severity: 'error',
          title: 'Связь ссылается на отсутствующий видеопроект',
          detail: `${relation.id} → ${videoId}`,
        });
      } else if (video.published !== true) {
        issues.push({
          id: `${relation.id}-video-draft-${videoId}`,
          severity: 'warning',
          title: 'Связь ведёт на draft-видеопроект',
          detail: `${titleValue(video)} (${videoId}) не показывается публично.`,
        });
      }
    }

    if (new Set(relation.galleryIds).size !== relation.galleryIds.length) {
      issues.push({
        id: `${relation.id}-gallery-duplicates`,
        severity: 'warning',
        title: 'Повторяющиеся gallery ID в связи',
        detail: relation.id,
      });
    }
    if (new Set(relation.videoProjectIds).size !== relation.videoProjectIds.length) {
      issues.push({
        id: `${relation.id}-video-duplicates`,
        severity: 'warning',
        title: 'Повторяющиеся video ID в связи',
        detail: relation.id,
      });
    }
  }

  for (const [caseId, items] of relationsByCase) {
    if (items.length < 2) continue;
    issues.push({
      id: `duplicate-relations-${caseId}`,
      severity: 'error',
      title: 'Несколько relation-документов для одного кейса',
      detail: `${caseId}: ${items.map(item => item.id).join(', ')}`,
    });
  }

  return issues;
}

function contentDiagnostics(
  cases: CaseStudy[],
  galleries: PhotoGallery[],
  videos: VideoProject[],
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  for (const item of cases) {
    const media = normalizedCaseMedia(item);
    if (item.published === true && media.length === 0) {
      issues.push({
        id: `case-no-media-${item.id}`,
        severity: 'warning',
        title: 'Опубликованный кейс без media',
        detail: `${titleValue(item)} (${item.id})`,
      });
    }
    const empty = (item.media || []).filter(mediaItem => !mediaItem.url?.trim()).length;
    if (empty > 0) {
      issues.push({
        id: `case-empty-media-${item.id}`,
        severity: 'warning',
        title: 'Пустые media-элементы в кейсе',
        detail: `${titleValue(item)}: ${empty}`,
      });
    }
  }

  for (const gallery of galleries) {
    if (gallery.published === true && !(gallery.images || []).some(image => image.url?.trim())) {
      issues.push({
        id: `gallery-no-images-${gallery.id}`,
        severity: 'warning',
        title: 'Опубликованная галерея без фотографий',
        detail: `${titleValue(gallery)} (${gallery.id})`,
      });
    }
    const empty = (gallery.images || []).filter(image => !image.url?.trim()).length;
    if (empty > 0) {
      issues.push({
        id: `gallery-empty-images-${gallery.id}`,
        severity: 'warning',
        title: 'Пустые изображения в галерее',
        detail: `${titleValue(gallery)}: ${empty}`,
      });
    }
  }

  for (const video of videos) {
    if (video.published === true && !(video.videos || []).some(media => media.url?.trim())) {
      issues.push({
        id: `video-no-media-${video.id}`,
        severity: 'warning',
        title: 'Опубликованный видеопроект без видео',
        detail: `${titleValue(video)} (${video.id})`,
      });
    }
    const empty = (video.videos || []).filter(media => !media.url?.trim()).length;
    if (empty > 0) {
      issues.push({
        id: `video-empty-media-${video.id}`,
        severity: 'warning',
        title: 'Пустые video-элементы в проекте',
        detail: `${titleValue(video)}: ${empty}`,
      });
    }
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

async function runSecurityProbe(
  cases: CaseStudy[],
  galleries: PhotoGallery[],
  videos: VideoProject[],
  settingsRecords: GenericRecord[],
): Promise<CmsDiagnosticsReport['security']> {
  const publicDb = getPublicProbeDb();
  const checks: SecurityProbeCheck[] = [];

  checks.push(await probe(
    'global-public',
    'Анонимное чтение site_settings/global',
    'allow',
    () => getDoc(doc(publicDb, 'site_settings', 'global')),
  ));
  checks.push(await probe(
    'published-cases-query',
    'Публичный query cases: published == true',
    'allow',
    () => getDocs(query(collection(publicDb, 'cases'), where('published', '==', true))),
  ));
  checks.push(await probe(
    'unfiltered-cases-denied',
    'Анонимный unfiltered query cases',
    'deny',
    () => getDocs(collection(publicDb, 'cases')),
  ));
  checks.push(await probe(
    'unfiltered-settings-denied',
    'Анонимный unfiltered query site_settings',
    'deny',
    () => getDocs(collection(publicDb, 'site_settings')),
  ));

  const publishedGallery = galleries.find(item => item.published === true);
  if (publishedGallery) {
    checks.push(await probe(
      'published-gallery-direct',
      'Прямое чтение опубликованной gallery',
      'allow',
      () => getDoc(doc(publicDb, 'site_settings', publishedGallery.id)),
    ));
  }

  const publishedVideo = videos.find(item => item.published === true);
  if (publishedVideo) {
    checks.push(await probe(
      'published-video-direct',
      'Прямое чтение опубликованного video_project',
      'allow',
      () => getDoc(doc(publicDb, 'site_settings', publishedVideo.id)),
    ));
  }

  const draftCase = cases.find(item => item.published !== true);
  if (draftCase) {
    checks.push(await probe(
      'draft-case-direct',
      'Прямое чтение draft-case',
      'deny',
      () => getDoc(doc(publicDb, 'cases', draftCase.id)),
    ));
  }

  const draftGallery = galleries.find(item => item.published !== true);
  if (draftGallery) {
    checks.push(await probe(
      'draft-gallery-direct',
      'Прямое чтение draft-gallery',
      'deny',
      () => getDoc(doc(publicDb, 'site_settings', draftGallery.id)),
    ));
  }

  const draftVideo = videos.find(item => item.published !== true);
  if (draftVideo) {
    checks.push(await probe(
      'draft-video-direct',
      'Прямое чтение draft-video_project',
      'deny',
      () => getDoc(doc(publicDb, 'site_settings', draftVideo.id)),
    ));
  }

  const mediaAsset = settingsRecords.find(item => item.kind === MEDIA_ASSET_KIND);
  if (mediaAsset) {
    checks.push(await probe(
      'media-asset-direct',
      'Прямое анонимное чтение media_asset',
      'deny',
      () => getDoc(doc(publicDb, 'site_settings', mediaAsset.id)),
    ));
  }

  const failed = checks.filter(check => !check.passed);
  const networkLike = failed.some(check => !/permission-denied|unexpectedly|неожиданно/i.test(check.detail));
  return {
    status: failed.length === 0 ? 'ok' : networkLike ? 'warning' : 'error',
    checks,
  };
}

export async function loadCmsDiagnostics(): Promise<CmsDiagnosticsReport> {
  const [casesSnapshot, settingsSnapshot, mediaAssets] = await Promise.all([
    getDocs(collection(db, 'cases')),
    getDocs(collection(db, 'site_settings')),
    loadMediaLibrary(),
  ]);

  const cases = casesSnapshot.docs.map(snapshot => ({
    id: snapshot.id,
    ...snapshot.data(),
  } as CaseStudy));
  const settingsRecords = settingsSnapshot.docs.map(snapshot => ({
    id: snapshot.id,
    ...snapshot.data(),
  } as GenericRecord));

  const galleries = settingsRecords.filter(isPhotoGallery) as PhotoGallery[];
  const videos = settingsRecords.filter(isVideoProject) as VideoProject[];
  const relations = settingsRecords.filter(isProjectRelation) as ProjectRelation[];
  const global = settingsRecords.find(item => item.id === 'global') || ({ id: 'global' } as GenericRecord);

  const caseEntities = cases.map(item => ({
    id: item.id,
    title: titleValue(item),
    slug: getCaseSlug(item),
  }));
  const galleryEntities = galleries.map(item => ({
    id: item.id,
    title: titleValue(item),
    slug: getGallerySlug(item),
  }));
  const videoEntities = videos.map(item => ({
    id: item.id,
    title: titleValue(item),
    slug: getVideoProjectSlug(item),
  }));

  const duplicateIssues = [
    ...duplicateIssuesFor('Cases', caseEntities),
    ...duplicateIssuesFor('Galleries', galleryEntities),
    ...duplicateIssuesFor('Videos', videoEntities),
  ];
  const relationIssues = relationDiagnostics(relations, cases, galleries, videos);
  const contentIssues = contentDiagnostics(cases, galleries, videos);

  const orphanAssets = mediaAssets.filter(asset => asset.registered && asset.useCount === 0);
  const unregisteredAssets = mediaAssets.filter(asset => !asset.registered && asset.useCount > 0);
  const registered = mediaAssets.filter(asset => asset.registered).length;
  const used = mediaAssets.filter(asset => asset.useCount > 0).length;
  const mediaRegistry = settingsRecords.filter(item => item.kind === MEDIA_ASSET_KIND).length;

  const security = await runSecurityProbe(cases, galleries, videos, settingsRecords);

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
      relations: relations.length,
      mediaRegistry,
    },
    duplicateIssues,
    relationIssues,
    contentIssues,
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
    security,
  };
}
