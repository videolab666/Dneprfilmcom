import {
  collection,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { versionedSetDoc as setDoc } from './cmsVersioning';

import {
  ensureMediaAssetRegistered,
  loadMediaLibrary,
  MEDIA_ASSET_COLLECTION,
  MEDIA_ASSET_KIND,
  removeMediaAssetRecord,
  type MediaLibraryAsset,
} from './mediaLibrary';

const CONTENT_COLLECTIONS = [
  'site_settings',
  'cases',
  'articles',
  'testimonials',
  'backstage',
  'site_blocks',
] as const;

export interface MediaAssetMetadata {
  alt?: string;
  alt_uk?: string;
  alt_en?: string;
  caption?: string;
  caption_uk?: string;
  caption_en?: string;
}

export interface MediaReplacementResult {
  documentsUpdated: number;
  referencesReplaced: number;
  collectionsTouched: string[];
}

interface ReplaceResult<T> {
  value: T;
  replacements: number;
  changed: boolean;
}

function cleanMetadata(metadata: MediaAssetMetadata): MediaAssetMetadata {
  const clean = (value?: string) => value?.trim() || '';
  return {
    alt: clean(metadata.alt),
    alt_uk: clean(metadata.alt_uk),
    alt_en: clean(metadata.alt_en),
    caption: clean(metadata.caption),
    caption_uk: clean(metadata.caption_uk),
    caption_en: clean(metadata.caption_en),
  };
}

function replaceString(value: string, sourceUrl: string, targetUrl: string): ReplaceResult<string> {
  if (!value.includes(sourceUrl)) return { value, replacements: 0, changed: false };
  const parts = value.split(sourceUrl);
  const replacements = Math.max(0, parts.length - 1);
  return {
    value: parts.join(targetUrl),
    replacements,
    changed: replacements > 0,
  };
}

function replaceMediaValue(
  value: unknown,
  sourceUrl: string,
  targetUrl: string,
  sourcePublicId?: string,
  targetPublicId?: string,
  depth = 0,
): ReplaceResult<unknown> {
  if (depth > 18 || value == null) return { value, replacements: 0, changed: false };

  if (typeof value === 'string') return replaceString(value, sourceUrl, targetUrl);

  if (Array.isArray(value)) {
    let replacements = 0;
    let changed = false;
    const next = value.map(item => {
      const result = replaceMediaValue(item, sourceUrl, targetUrl, sourcePublicId, targetPublicId, depth + 1);
      replacements += result.replacements;
      changed = changed || result.changed;
      return result.value;
    });
    return { value: changed ? next : value, replacements, changed };
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    let replacements = 0;
    let changed = false;
    let directUrlChanged = false;
    const next: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(record)) {
      const result = replaceMediaValue(child, sourceUrl, targetUrl, sourcePublicId, targetPublicId, depth + 1);
      next[key] = result.value;
      replacements += result.replacements;
      if (result.changed) {
        changed = true;
        if (typeof child === 'string' && child.includes(sourceUrl)) directUrlChanged = true;
      }
    }

    if (directUrlChanged && targetPublicId) {
      for (const key of ['cloudinaryPublicId', 'publicId']) {
        const current = record[key];
        if (typeof current !== 'string') continue;
        if (!sourcePublicId || current === sourcePublicId) {
          next[key] = targetPublicId;
          if (current !== targetPublicId) changed = true;
        }
      }
    }

    return { value: changed ? next : value, replacements, changed };
  }

  return { value, replacements: 0, changed: false };
}

export async function readMediaAssetMetadata(asset: MediaLibraryAsset): Promise<MediaAssetMetadata> {
  if (!asset.registered) return {};
  const snapshot = await getDoc(doc(db, MEDIA_ASSET_COLLECTION, asset.id));
  if (!snapshot.exists()) return {};
  const data = snapshot.data() as Record<string, unknown>;
  const value = (key: keyof MediaAssetMetadata) => typeof data[key] === 'string' ? String(data[key]) : '';
  return {
    alt: value('alt'),
    alt_uk: value('alt_uk'),
    alt_en: value('alt_en'),
    caption: value('caption'),
    caption_uk: value('caption_uk'),
    caption_en: value('caption_en'),
  };
}

export async function saveMediaAssetMetadata(
  asset: MediaLibraryAsset,
  metadata: MediaAssetMetadata,
): Promise<void> {
  await ensureMediaAssetRegistered(asset);
  const id = asset.registered ? asset.id : `media_asset_${asset.id.replace(/^media_asset_/, '')}`;
  await setDoc(doc(db, MEDIA_ASSET_COLLECTION, id), {
    ...cleanMetadata(metadata),
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function replaceMediaAssetEverywhere(
  source: MediaLibraryAsset,
  target: MediaLibraryAsset,
): Promise<MediaReplacementResult> {
  if (source.url === target.url) throw new Error('Исходный и новый файл совпадают.');
  if (source.assetType !== target.assetType) throw new Error('Для безопасной замены тип файла должен совпадать.');

  const snapshots = await Promise.all(CONTENT_COLLECTIONS.map(name => getDocs(collection(db, name))));
  let documentsUpdated = 0;
  let referencesReplaced = 0;
  const touched = new Set<string>();

  for (let collectionIndex = 0; collectionIndex < CONTENT_COLLECTIONS.length; collectionIndex += 1) {
    const collectionName = CONTENT_COLLECTIONS[collectionIndex];
    const snapshot = snapshots[collectionIndex];

    for (const item of snapshot.docs) {
      const data = item.data() as Record<string, unknown>;
      if (collectionName === MEDIA_ASSET_COLLECTION && data.kind === MEDIA_ASSET_KIND) continue;

      const result = replaceMediaValue(
        data,
        source.url,
        target.url,
        source.publicId,
        target.publicId,
      );
      if (!result.changed || result.replacements === 0) continue;

      await setDoc(doc(db, collectionName, item.id), {
        ...(result.value as Record<string, unknown>),
        updatedAt: Date.now(),
      });
      documentsUpdated += 1;
      referencesReplaced += result.replacements;
      touched.add(collectionName);
    }
  }

  if (referencesReplaced === 0) throw new Error('Актуальные ссылки на исходный файл не найдены.');

  return {
    documentsUpdated,
    referencesReplaced,
    collectionsTouched: [...touched],
  };
}

export async function safelyRemoveMediaAssetRecord(asset: MediaLibraryAsset): Promise<void> {
  const latest = (await loadMediaLibrary()).find(item => item.url === asset.url);
  if (!latest) throw new Error('Файл уже отсутствует в медиатеке.');
  if (latest.useCount > 0) {
    throw new Error(`Удаление заблокировано: файл сейчас используется в ${latest.useCount} месте(ах).`);
  }
  if (!latest.registered) throw new Error('У файла нет отдельной registry-записи для удаления.');
  await removeMediaAssetRecord(latest);
}
