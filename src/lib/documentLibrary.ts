import { collection, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { versionedSetDoc as setDoc } from './cmsVersioning';

const CLOUDINARY_CLOUD_NAME = 'n6l9imb7';
const CLOUDINARY_UPLOAD_PRESET = '123123';
const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

export const DOCUMENT_ASSET_KIND = 'document_asset' as const;
export const DOCUMENT_ASSET_COLLECTION = 'site_settings';

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'rtf', 'zip', 'rar', '7z',
]);

export interface DocumentAsset {
  id: string;
  kind: typeof DOCUMENT_ASSET_KIND;
  name: string;
  url: string;
  publicId: string;
  bytes?: number;
  format?: string;
  mimeType?: string;
  createdAt: number;
  updatedAt?: number;
  useCount?: number;
}

interface CloudinaryRawUploadResponse {
  secure_url?: string;
  public_id?: string;
  bytes?: number;
  format?: string;
  resource_type?: string;
  original_filename?: string;
  error?: { message?: string };
}

function hashString(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function extensionOf(name: string): string {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
}

function sanitizeName(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '');
  return stem
    .toLowerCase()
    .replace(/[^a-z0-9а-яёіїєґ_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'document';
}

export function documentAssetId(url: string): string {
  return `document_asset_${hashString(url)}`;
}

export function documentTypeLabel(asset: Pick<DocumentAsset, 'format' | 'name'>): string {
  return String(asset.format || extensionOf(asset.name) || 'FILE').toUpperCase();
}

export function formatDocumentSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function isSupportedDocument(file: Pick<File, 'name' | 'size'>): boolean {
  return file.size > 0 && file.size <= MAX_DOCUMENT_BYTES && ALLOWED_EXTENSIONS.has(extensionOf(file.name));
}

export async function uploadDocument(file: File): Promise<DocumentAsset> {
  if (!isSupportedDocument(file)) {
    throw new Error('Поддерживаются PDF, Office, CSV/TXT и архивы до 50 МБ.');
  }

  const extension = extensionOf(file.name);
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'dneprfilm/library/documents');
  formData.append('public_id', `${sanitizeName(file.name)}-${Date.now()}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
    { method: 'POST', body: formData },
  );
  const data = await response.json() as CloudinaryRawUploadResponse;
  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new Error(data.error?.message || `Cloudinary document upload failed (${response.status}).`);
  }

  const now = Date.now();
  const asset: DocumentAsset = {
    id: documentAssetId(data.secure_url),
    kind: DOCUMENT_ASSET_KIND,
    name: file.name,
    url: data.secure_url,
    publicId: data.public_id,
    bytes: data.bytes || file.size,
    format: data.format || extension,
    mimeType: file.type || undefined,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, DOCUMENT_ASSET_COLLECTION, asset.id), asset, { merge: true });
  return asset;
}

function countUrl(value: unknown, url: string, depth = 0): number {
  if (depth > 16 || value == null) return 0;
  if (typeof value === 'string') return value === url ? 1 : 0;
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countUrl(item, url, depth + 1), 0);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce<number>((sum, item) => sum + countUrl(item, url, depth + 1), 0);
  }
  return 0;
}

export async function loadDocumentLibrary(): Promise<DocumentAsset[]> {
  const [settingsSnapshot, blocksSnapshot] = await Promise.all([
    getDocs(collection(db, DOCUMENT_ASSET_COLLECTION)),
    getDocs(collection(db, 'site_blocks')),
  ]);

  const blocks = blocksSnapshot.docs.map(item => item.data());
  const assets = settingsSnapshot.docs
    .map(item => ({ id: item.id, ...item.data() } as Partial<DocumentAsset>))
    .filter((item): item is DocumentAsset => item.kind === DOCUMENT_ASSET_KIND && typeof item.url === 'string' && typeof item.name === 'string')
    .map(asset => ({
      ...asset,
      publicId: asset.publicId || '',
      createdAt: typeof asset.createdAt === 'number' ? asset.createdAt : 0,
      useCount: blocks.reduce<number>((sum, block) => sum + countUrl(block, asset.url), 0),
    }));

  return assets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
