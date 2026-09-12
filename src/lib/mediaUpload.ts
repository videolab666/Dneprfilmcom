const CLOUDINARY_CLOUD_NAME = 'n6l9imb7';
const CLOUDINARY_UPLOAD_PRESET = '123123';
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 2400;
const WEBP_QUALITY = 0.88;

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
}

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

export async function uploadCaseImage(file: File, caseId: string): Promise<{ url: string; publicId: string }> {
  const optimized = await optimizeImage(file);
  const formData = new FormData();
  formData.append('file', optimized, `${sanitizeName(file.name)}.webp`);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `dneprfilm/cases/${sanitizeName(caseId)}`);
  formData.append('filename_override', `${sanitizeName(file.name)}.webp`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );
  const data = await response.json() as CloudinaryUploadResponse;

  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new Error(data.error?.message || `Cloudinary upload failed (${response.status}).`);
  }

  return { url: data.secure_url, publicId: data.public_id };
}
