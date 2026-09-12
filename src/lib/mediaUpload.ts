import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 2400;
const WEBP_QUALITY = 0.88;

function sanitizeName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'image';
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if ('createImageBitmap' in window) return createImageBitmap(file);
  throw new Error('Этот браузер не поддерживает подготовку изображений для загрузки.');
}

async function optimizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Можно загружать только изображения.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('Исходное изображение больше 25 МБ.');

  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('Не удалось подготовить изображение.');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
  if (!blob) throw new Error('Не удалось сжать изображение.');
  return blob;
}

export async function uploadCaseImage(file: File, caseId: string): Promise<{ url: string; storagePath: string }> {
  const optimized = await optimizeImage(file);
  const storagePath = `cases/${caseId}/${Date.now()}-${sanitizeName(file.name)}.webp`;
  const objectRef = ref(storage, storagePath);
  await uploadBytes(objectRef, optimized, {
    contentType: 'image/webp',
    cacheControl: 'public,max-age=31536000,immutable',
  });
  return {
    url: await getDownloadURL(objectRef),
    storagePath,
  };
}

export async function deleteCaseImage(storagePath?: string): Promise<void> {
  if (!storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (error) {
    console.warn('Could not delete case image from Firebase Storage:', error);
  }
}
