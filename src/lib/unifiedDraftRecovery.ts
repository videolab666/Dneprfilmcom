import type { PublishQualityType } from './publishQuality';

const STORAGE_PREFIX = 'dneprfilm:unified-content-draft:v2:';
const SNAPSHOT_VERSION = 2;
const MAX_NEW_DRAFT_AGE = 7 * 24 * 60 * 60 * 1000;

export interface UnifiedDraftSnapshot<T = Record<string, unknown>> {
  version: number;
  type: PublishQualityType;
  id: string;
  savedAt: number;
  sourceUpdatedAt: number;
  data: T;
}

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function keyFor(type: PublishQualityType, id: string): string {
  return `${STORAGE_PREFIX}${type}:${id}`;
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      const current = (value as Record<string, unknown>)[key];
      if (current !== undefined) result[key] = normalize(current);
      return result;
    }, {});
}

export function draftFingerprint(value: unknown): string {
  try {
    return JSON.stringify(normalize(value));
  } catch {
    return '';
  }
}

export function saveUnifiedDraft<T extends Record<string, unknown>>(
  type: PublishQualityType,
  id: string,
  data: T,
  sourceUpdatedAt = 0,
): UnifiedDraftSnapshot<T> | null {
  if (!storageAvailable() || !id) return null;
  const snapshot: UnifiedDraftSnapshot<T> = {
    version: SNAPSHOT_VERSION,
    type,
    id,
    savedAt: Date.now(),
    sourceUpdatedAt,
    data,
  };
  try {
    window.localStorage.setItem(keyFor(type, id), JSON.stringify(snapshot));
    return snapshot;
  } catch (error) {
    console.warn('Could not autosave unified content draft:', error);
    return null;
  }
}

export function readUnifiedDraft<T extends Record<string, unknown>>(
  type: PublishQualityType,
  id: string,
): UnifiedDraftSnapshot<T> | null {
  if (!storageAvailable() || !id) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(type, id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UnifiedDraftSnapshot<T>;
    if (
      parsed.version !== SNAPSHOT_VERSION
      || parsed.type !== type
      || parsed.id !== id
      || typeof parsed.savedAt !== 'number'
      || !parsed.data
      || typeof parsed.data !== 'object'
    ) {
      window.localStorage.removeItem(keyFor(type, id));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearUnifiedDraft(type: PublishQualityType, id: string): void {
  if (!storageAvailable() || !id) return;
  try {
    window.localStorage.removeItem(keyFor(type, id));
  } catch {
    // Local draft cleanup should never break the editor.
  }
}

export function isRecoverableDraft(
  snapshot: UnifiedDraftSnapshot | null,
  sourceUpdatedAt: number,
  currentData: unknown,
): boolean {
  if (!snapshot) return false;
  if (snapshot.sourceUpdatedAt > sourceUpdatedAt) return true;
  if (snapshot.savedAt <= sourceUpdatedAt) return false;
  return draftFingerprint(snapshot.data) !== draftFingerprint(currentData);
}

export function readLatestNewUnifiedDraft<T extends Record<string, unknown>>(
  type: PublishQualityType,
): UnifiedDraftSnapshot<T> | null {
  if (!storageAvailable()) return null;
  const now = Date.now();
  let latest: UnifiedDraftSnapshot<T> | null = null;
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(`${STORAGE_PREFIX}${type}:`)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as UnifiedDraftSnapshot<T>;
      if (
        parsed.version !== SNAPSHOT_VERSION
        || parsed.type !== type
        || parsed.sourceUpdatedAt !== 0
        || !parsed.data
        || typeof parsed.savedAt !== 'number'
        || now - parsed.savedAt > MAX_NEW_DRAFT_AGE
      ) continue;
      if (!latest || parsed.savedAt > latest.savedAt) latest = parsed;
    }
  } catch {
    return null;
  }
  return latest;
}
