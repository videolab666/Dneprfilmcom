const CLOUDINARY_CLOUD_NAME = 'n6l9imb7';
const CLOUDINARY_UPLOAD_PRESET = '123123';
const MAX_IMAGE_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_SOURCE_BYTES = 100 * 1024 * 1024;
const MAX_EDGE = 2400;
const WEBP_QUALITY = 0.88;

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  resource_type?: 'image' | 'video';
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  original_filename?: string;
  error?: { message?: string };
}

export interface UploadedAsset {
  url: string;
  publicId: string;
  resourceType?: 'image' | 'video';
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  originalFilename?: string;
}

function sanitizeName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'media';
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if ('createImageBitmap' in window) return createImageBitmap(file);
  throw new Error('Этот браузер не поддерживает подготовку изображений для загрузки.');
}

async function optimizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Можно загружать только изображения.');
  if (file.size > MAX_IMAGE_SOURCE_BYTES) throw new Error('Исходное изображение больше 25 МБ.');

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

async function uploadUnsigned(
  file: Blob,
  resourceType: 'image' | 'video',
  folder: string,
  filename: string,
): Promise<UploadedAsset> {
  const formData = new FormData();
  formData.append('file', file, filename);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData },
  );
  const data = await response.json() as CloudinaryUploadResponse;

  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new Error(data.error?.message || `Cloudinary upload failed (${response.status}).`);
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type || resourceType,
    bytes: data.bytes,
    width: data.width,
    height: data.height,
    format: data.format,
    originalFilename: data.original_filename,
  };
}

export function videoPosterUrl(url: string): string | undefined {
  const marker = '/video/upload/';
  const index = url.indexOf(marker);
  if (index < 0) return undefined;
  const prefix = url.slice(0, index + marker.length);
  const rest = url.slice(index + marker.length);
  const queryIndex = rest.indexOf('?');
  const pathPart = queryIndex >= 0 ? rest.slice(0, queryIndex) : rest;
  const withoutExtension = pathPart.replace(/\.[a-z0-9]+$/i, '');
  return `${prefix}so_0,f_jpg,q_auto/${withoutExtension}.jpg`;
}

export async function uploadCaseImage(file: File, caseId: string): Promise<UploadedAsset> {
  const optimized = await optimizeImage(file);
  return uploadUnsigned(
    optimized,
    'image',
    `dneprfilm/cases/${sanitizeName(caseId)}`,
    `${sanitizeName(file.name)}.webp`,
  );
}

export async function uploadPortfolioImage(file: File, projectId: string): Promise<UploadedAsset> {
  const optimized = await optimizeImage(file);
  return uploadUnsigned(
    optimized,
    'image',
    `dneprfilm/video-projects/${sanitizeName(projectId)}`,
    `${sanitizeName(file.name)}.webp`,
  );
}

export async function uploadPortfolioVideo(
  file: File,
  projectId: string,
): Promise<UploadedAsset & { posterUrl?: string }> {
  if (!['video/mp4', 'video/webm'].includes(file.type)) {
    throw new Error('Для видеопортфолио используйте MP4 или WebM.');
  }
  if (file.size > MAX_VIDEO_SOURCE_BYTES) {
    throw new Error('Видео больше 100 МБ. Для больших файлов добавьте прямую ссылку/YouTube/Vimeo.');
  }
  const extension = file.type === 'video/webm' ? 'webm' : 'mp4';
  const uploaded = await uploadUnsigned(
    file,
    'video',
    `dneprfilm/video-projects/${sanitizeName(projectId)}`,
    `${sanitizeName(file.name)}.${extension}`,
  );
  return { ...uploaded, posterUrl: videoPosterUrl(uploaded.url) };
}

export async function uploadLibraryImage(file: File): Promise<UploadedAsset> {
  const optimized = await optimizeImage(file);
  return uploadUnsigned(
    optimized,
    'image',
    'dneprfilm/library/images',
    `${sanitizeName(file.name)}-${Date.now()}.webp`,
  );
}

export async function uploadLibraryVideo(file: File): Promise<UploadedAsset & { posterUrl?: string }> {
  if (!['video/mp4', 'video/webm'].includes(file.type)) {
    throw new Error('Для медиатеки используйте MP4 или WebM.');
  }
  if (file.size > MAX_VIDEO_SOURCE_BYTES) {
    throw new Error('Видео больше 100 МБ. Сожмите файл или используйте внешнюю ссылку.');
  }
  const extension = file.type === 'video/webm' ? 'webm' : 'mp4';
  const uploaded = await uploadUnsigned(
    file,
    'video',
    'dneprfilm/library/videos',
    `${sanitizeName(file.name)}-${Date.now()}.${extension}`,
  );
  return { ...uploaded, posterUrl: videoPosterUrl(uploaded.url) };
}

export async function uploadHeroImage(file: File): Promise<UploadedAsset> {
  const optimized = await optimizeImage(file);
  return uploadUnsigned(
    optimized,
    'image',
    'dneprfilm/hero',
    `${sanitizeName(file.name)}.webp`,
  );
}

export async function uploadHeroVideo(file: File): Promise<UploadedAsset & { posterUrl?: string }> {
  if (!['video/mp4', 'video/webm'].includes(file.type)) {
    throw new Error('Для Hero используйте MP4 или WebM.');
  }
  if (file.size > MAX_VIDEO_SOURCE_BYTES) {
    throw new Error('Видео Hero больше 100 МБ. Сожмите клип или добавьте его URL.');
  }
  const extension = file.type === 'video/webm' ? 'webm' : 'mp4';
  const uploaded = await uploadUnsigned(
    file,
    'video',
    'dneprfilm/hero',
    `${sanitizeName(file.name)}.${extension}`,
  );
  return { ...uploaded, posterUrl: videoPosterUrl(uploaded.url) };
}
