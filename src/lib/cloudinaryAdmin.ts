import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export type CloudinaryAdminResourceType = 'image' | 'video';

export interface CloudinaryReference {
  collection: string;
  documentId: string;
  title: string;
  field: string;
}

export interface CloudinaryAdminAsset {
  assetId?: string;
  publicId: string;
  resourceType: CloudinaryAdminResourceType;
  url: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
  createdAt?: string;
  folder?: string;
  referenceCount: number;
  references: CloudinaryReference[];
  used: boolean;
}

export interface CloudinaryAuditSummary {
  total: number;
  images: number;
  videos: number;
  used: number;
  orphaned: number;
  totalBytes: number;
  orphanBytes: number;
  scannedDocuments: number;
  truncated: boolean;
}

export interface CloudinaryAuditResult {
  assets: CloudinaryAdminAsset[];
  summary: CloudinaryAuditSummary;
  generatedAt: number;
}

interface DeleteResult {
  publicId: string;
  resourceType: CloudinaryAdminResourceType;
  status: string;
  registryRecordsRemoved: number;
}

const mediaAdmin = httpsCallable<Record<string, unknown>, CloudinaryAuditResult | DeleteResult>(
  functions,
  'cloudinaryMediaAdmin',
  { timeout: 120_000 },
);

export async function auditCloudinaryMedia(): Promise<CloudinaryAuditResult> {
  const response = await mediaAdmin({ action: 'audit' });
  return response.data as CloudinaryAuditResult;
}

export async function deleteCloudinaryMediaAsset(asset: Pick<CloudinaryAdminAsset, 'publicId' | 'resourceType'>): Promise<DeleteResult> {
  const response = await mediaAdmin({
    action: 'delete',
    publicId: asset.publicId,
    resourceType: asset.resourceType,
  });
  return response.data as DeleteResult;
}

export function cloudinaryAdminErrorMessage(error: unknown): string {
  const value = error as { code?: string; message?: string } | null;
  const code = value?.code || '';
  if (code.includes('functions/not-found')) {
    return 'Cloudinary backend ещё не развёрнут. Сначала настройте Firebase Functions и Secret Manager.';
  }
  if (code.includes('functions/permission-denied')) {
    return 'У текущего аккаунта нет прав на управление Cloudinary. Войдите под подтверждённым администратором.';
  }
  if (code.includes('functions/failed-precondition')) {
    return value?.message || 'Файл всё ещё используется на сайте и не может быть удалён.';
  }
  return value?.message || (error instanceof Error ? error.message : String(error));
}
