import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { videoPosterUrl, type UploadedAsset } from './mediaUpload';

export const MEDIA_ASSET_COLLECTION = 'site_settings';
export const MEDIA_ASSET_KIND = 'media_asset' as const;

export type MediaAssetType = 'image' | 'video';

export interface StoredMediaAsset {
  id: string;
  kind: typeof MEDIA_ASSET_KIND;
  assetType: MediaAssetType;
  url: string;
  publicId?: string;
  name?: string;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface MediaUsage {
  sourceType: string;
  sourceId: string;
  sourceTitle: string;
  field: string;
}

export interface MediaLibraryAsset extends StoredMediaAsset {
  registered: boolean;
  usages: MediaUsage[];
  useCount: number;
  previewUrl?: string;
}

interface ScanContext {
  sourceType: string;
  sourceId: string;
  sourceTitle: string;
}

interface FoundAsset {
  url: string;
  publicId?: string;
  assetType: MediaAssetType;
  name: string;
}

function hashString(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193);
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`;
}

export function mediaAssetDocumentId(url: string): string {
  return `media_asset_${hashString(url)}`;
}

export function isCloudinaryMediaUrl(value: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\//i.test(value)
    && (value.includes('/image/upload/') || value.includes('/video/upload/'));
}

export function mediaAssetTypeFromUrl(url: string): MediaAssetType {
  return url.includes('/video/upload/') ? 'video' : 'image';
}

export function mediaNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const last = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || 'media');
    return last.replace(/\.[a-z0-9]+$/i, '') || 'media';
  } catch {
    return 'media';
  }
}

export function cloudinaryPublicIdFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex < 0) return undefined;
    let start = uploadIndex + 1;
    while (start < parts.length && !/^v\d+$/.test(parts[start])) {
      const part = parts[start];
      if (!part.includes(',') && !/^[a-z]{1,3}_[^/]+$/i.test(part)) break;
      start += 1;
    }
    if (start < parts.length && /^v\d+$/.test(parts[start])) start += 1;
    const path = parts.slice(start).join('/');
    if (!path) return undefined;
    return decodeURIComponent(path.replace(/\.[a-z0-9]+$/i, ''));
  } catch {
    return undefined;
  }
}

function titleForDocument(data: Record<string, unknown>, id: string): string {
  const candidates = [
    data.title_uk,
    data.title,
    data.title_en,
    data.name_uk,
    data.name,
    data.name_en,
    data.author_uk,
    data.author,
    data.author_en,
    data.client_uk,
    data.client,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  const config = data.config;
  if (config && typeof config === 'object') {
    const heading = (config as Record<string, unknown>).heading;
    if (typeof heading === 'string' && heading.trim()) return heading.trim();
  }

  const uk = data.uk;
  if (uk && typeof uk === 'object') {
    const title = (uk as Record<string, unknown>).title;
    if (typeof title === 'string' && title.trim()) return title.trim();
  }

  return id;
}

function sourceTypeFor(collectionName: string, data: Record<string, unknown>): string {
  if (collectionName === 'cases') return 'Кейс';
  if (collectionName === 'articles') return 'Статья';
  if (collectionName === 'testimonials') return 'Отзыв';
  if (collectionName === 'backstage') return 'Backstage';
  if (collectionName === 'site_blocks') return 'Блок главной';

  const kind = typeof data.kind === 'string' ? data.kind : '';
  if (kind === 'gallery' || kind === 'photo_gallery') return 'Фотогалерея';
  if (kind === 'video_project') return 'Видеопроект';
  if (kind === 'article') return 'Статья';
  if (kind === 'media_asset') return 'Медиатека';
  return 'Контент сайта';
}

function scanValue(
  value: unknown,
  field: string,
  context: ScanContext,
  found: Map<string, FoundAsset>,
  usages: Map<string, MediaUsage[]>,
  siblingPublicId?: string,
  depth = 0,
): void {
  if (depth > 14 || value == null) return;

  if (typeof value === 'string') {
    if (!isCloudinaryMediaUrl(value)) return;
    const url = value;
    const existing = found.get(url);
    if (!existing) {
      found.set(url, {
        url,
        publicId: siblingPublicId || cloudinaryPublicIdFromUrl(url),
        assetType: mediaAssetTypeFromUrl(url),
        name: mediaNameFromUrl(url),
      });
    } else if (!existing.publicId && siblingPublicId) {
      existing.publicId = siblingPublicId;
    }

    const list = usages.get(url) || [];
    const usage: MediaUsage = { ...context, field };
    const key = `${usage.sourceType}|${usage.sourceId}|${usage.field}`;
    if (!list.some(item => `${item.sourceType}|${item.sourceId}|${item.field}` === key)) list.push(usage);
    usages.set(url, list);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanValue(item, `${field}[${index}]`, context, found, usages, undefined, depth + 1));
    return;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const publicId = typeof record.cloudinaryPublicId === 'string'
      ? record.cloudinaryPublicId
      : typeof record.publicId === 'string'
        ? record.publicId
        : siblingPublicId;
    Object.entries(record).forEach(([key, child]) => {
      if (key === 'cloudinaryPublicId' || key === 'publicId') return;
      const nextField = field ? `${field}.${key}` : key;
      scanValue(child, nextField, context, found, usages, publicId, depth + 1);
    });
  }
}

export async function loadMediaLibrary(): Promise<MediaLibraryAsset[]> {
  const [
    siteSnapshot,
    casesSnapshot,
    articlesSnapshot,
    testimonialsSnapshot,
    backstageSnapshot,
    blocksSnapshot,
  ] = await Promise.all([
    getDocs(collection(db, 'site_settings')),
    getDocs(collection(db, 'cases')),
    getDocs(collection(db, 'articles')),
    getDocs(collection(db, 'testimonials')),
    getDocs(collection(db, 'backstage')),
    getDocs(collection(db, 'site_blocks')),
  ]);

  const registered = new Map<string, StoredMediaAsset>();
  const found = new Map<string, FoundAsset>();
  const usages = new Map<string, MediaUsage[]>();

  for (const snap of siteSnapshot.docs) {
    const data = snap.data() as Record<string, unknown>;
    if (data.kind === MEDIA_ASSET_KIND && typeof data.url === 'string') {
      const stored: StoredMediaAsset = {
        id: snap.id,
        kind: MEDIA_ASSET_KIND,
        assetType: data.assetType === 'video' ? 'video' : 'image',
        url: data.url,
        publicId: typeof data.publicId === 'string' ? data.publicId : undefined,
        name: typeof data.name === 'string' ? data.name : mediaNameFromUrl(data.url),
        bytes: typeof data.bytes === 'number' ? data.bytes : undefined,
        width: typeof data.width === 'number' ? data.width : undefined,
        height: typeof data.height === 'number' ? data.height : undefined,
        format: typeof data.format === 'string' ? data.format : undefined,
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
      };
      registered.set(stored.url, stored);
      continue;
    }

    const context: ScanContext = {
      sourceType: sourceTypeFor('site_settings', data),
      sourceId: snap.id,
      sourceTitle: titleForDocument(data, snap.id),
    };
    scanValue(data, '', context, found, usages);
  }

  const contentSnapshots = [
    { name: 'cases', docs: casesSnapshot.docs },
    { name: 'articles', docs: articlesSnapshot.docs },
    { name: 'testimonials', docs: testimonialsSnapshot.docs },
    { name: 'backstage', docs: backstageSnapshot.docs },
    { name: 'site_blocks', docs: blocksSnapshot.docs },
  ];

  for (const source of contentSnapshots) {
    for (const snap of source.docs) {
      const data = snap.data() as Record<string, unknown>;
      const context: ScanContext = {
        sourceType: sourceTypeFor(source.name, data),
        sourceId: snap.id,
        sourceTitle: titleForDocument(data, snap.id),
      };
      scanValue(data, '', context, found, usages);
    }
  }

  const urls = new Set<string>([...registered.keys(), ...found.keys()]);
  const result: MediaLibraryAsset[] = [];

  for (const url of urls) {
    const stored = registered.get(url);
    const discovered = found.get(url);
    const usageList = usages.get(url) || [];
    const assetType = stored?.assetType || discovered?.assetType || mediaAssetTypeFromUrl(url);
    const publicId = stored?.publicId || discovered?.publicId || cloudinaryPublicIdFromUrl(url);
    result.push({
      id: stored?.id || mediaAssetDocumentId(url),
      kind: MEDIA_ASSET_KIND,
      assetType,
      url,
      publicId,
      name: stored?.name || discovered?.name || mediaNameFromUrl(url),
      bytes: stored?.bytes,
      width: stored?.width,
      height: stored?.height,
      format: stored?.format,
      createdAt: stored?.createdAt || 0,
      updatedAt: stored?.updatedAt,
      registered: Boolean(stored),
      usages: usageList,
      useCount: usageList.length,
      previewUrl: assetType === 'video' ? videoPosterUrl(url) : url,
    });
  }

  return result.sort((a, b) => {
    const timeDelta = (b.createdAt || 0) - (a.createdAt || 0);
    if (timeDelta !== 0) return timeDelta;
    const usageDelta = b.useCount - a.useCount;
    if (usageDelta !== 0) return usageDelta;
    return String(a.name || '').localeCompare(String(b.name || ''), 'ru');
  });
}

export async function registerMediaAsset(uploaded: UploadedAsset, name?: string): Promise<StoredMediaAsset> {
  const now = Date.now();
  const assetType: MediaAssetType = uploaded.resourceType === 'video' || mediaAssetTypeFromUrl(uploaded.url) === 'video' ? 'video' : 'image';
  const payload: StoredMediaAsset = {
    id: mediaAssetDocumentId(uploaded.url),
    kind: MEDIA_ASSET_KIND,
    assetType,
    url: uploaded.url,
    publicId: uploaded.publicId,
    name: name?.replace(/\.[^.]+$/, '') || uploaded.originalFilename || mediaNameFromUrl(uploaded.url),
    bytes: uploaded.bytes,
    width: uploaded.width,
    height: uploaded.height,
    format: uploaded.format,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, MEDIA_ASSET_COLLECTION, payload.id), payload, { merge: true });
  return payload;
}

export async function ensureMediaAssetRegistered(asset: MediaLibraryAsset): Promise<void> {
  if (asset.registered) return;
  const now = Date.now();
  const payload: StoredMediaAsset = {
    id: mediaAssetDocumentId(asset.url),
    kind: MEDIA_ASSET_KIND,
    assetType: asset.assetType,
    url: asset.url,
    publicId: asset.publicId,
    name: asset.name || mediaNameFromUrl(asset.url),
    bytes: asset.bytes,
    width: asset.width,
    height: asset.height,
    format: asset.format,
    createdAt: asset.createdAt || now,
    updatedAt: now,
  };
  await setDoc(doc(db, MEDIA_ASSET_COLLECTION, payload.id), payload, { merge: true });
}

export async function removeMediaAssetRecord(asset: MediaLibraryAsset): Promise<void> {
  if (asset.useCount > 0) throw new Error('Файл используется на сайте и не может быть удалён из медиатеки.');
  if (!asset.registered) throw new Error('Это обнаруженный файл без отдельной записи медиатеки.');
  await deleteDoc(doc(db, MEDIA_ASSET_COLLECTION, asset.id));
}
