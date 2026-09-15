import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { DiagnosticIssue } from './cmsDiagnostics';

export interface DiagnosticSafeFix {
  label: string;
  confirm: string;
}

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function hasUrl(value: unknown): boolean {
  return typeof recordOf(value).url === 'string' && String(recordOf(value).url).trim().length > 0;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(String).map(item => item.trim()).filter(Boolean)));
}

export function diagnosticSafeFix(issue: DiagnosticIssue): DiagnosticSafeFix | null {
  if (issue.entityType === 'case' && issue.entityId && issue.id.startsWith('case-empty-media-')) {
    return {
      label: 'Удалить пустые media',
      confirm: 'Удалить из этого кейса media-элементы без URL? Остальные элементы и их порядок не изменятся.',
    };
  }
  if (issue.entityType === 'gallery' && issue.entityId && issue.id.startsWith('gallery-empty-images-')) {
    return {
      label: 'Удалить пустые изображения',
      confirm: 'Удалить из этой галереи элементы изображений без URL? Остальные элементы и их порядок не изменятся.',
    };
  }
  if (issue.entityType === 'video' && issue.entityId && issue.id.startsWith('video-empty-media-')) {
    return {
      label: 'Удалить пустые видео',
      confirm: 'Удалить из этого видеопроекта media-элементы без URL? Остальные элементы и их порядок не изменятся.',
    };
  }
  if (issue.title === 'Повторяющиеся gallery ID в связи' || issue.title === 'Повторяющиеся video ID в связи') {
    return {
      label: 'Убрать дубли ID',
      confirm: 'Удалить повторяющиеся ID из relation-документа, сохранив первое вхождение и исходный порядок?',
    };
  }
  if (issue.entityType === 'article' && issue.entityId && issue.title === 'Повторяющиеся ID в связях статьи') {
    return {
      label: 'Убрать дубли ID',
      confirm: 'Удалить повторяющиеся ID из всех relation-массивов этой статьи, сохранив первое вхождение и исходный порядок?',
    };
  }
  return null;
}

export async function applyDiagnosticSafeFix(issue: DiagnosticIssue): Promise<string> {
  const now = Date.now();

  if (issue.entityType === 'case' && issue.entityId && issue.id.startsWith('case-empty-media-')) {
    const ref = doc(db, 'cases', issue.entityId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error(`Кейс ${issue.entityId} не найден.`);
    const data = snapshot.data();
    const media = Array.isArray(data.media) ? data.media.filter(hasUrl) : [];
    await updateDoc(ref, { media, updatedAt: now });
    return `Кейс ${issue.entityId}: пустые media-элементы удалены.`;
  }

  if (issue.entityType === 'gallery' && issue.entityId && issue.id.startsWith('gallery-empty-images-')) {
    const ref = doc(db, 'site_settings', issue.entityId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error(`Галерея ${issue.entityId} не найдена.`);
    const data = snapshot.data();
    const images = Array.isArray(data.images) ? data.images.filter(hasUrl) : [];
    await updateDoc(ref, { images, updatedAt: now });
    return `Галерея ${issue.entityId}: пустые изображения удалены.`;
  }

  if (issue.entityType === 'video' && issue.entityId && issue.id.startsWith('video-empty-media-')) {
    const ref = doc(db, 'site_settings', issue.entityId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error(`Видеопроект ${issue.entityId} не найден.`);
    const data = snapshot.data();
    const videos = Array.isArray(data.videos) ? data.videos.filter(hasUrl) : [];
    await updateDoc(ref, { videos, updatedAt: now });
    return `Видеопроект ${issue.entityId}: пустые media-элементы удалены.`;
  }

  if (issue.title === 'Повторяющиеся gallery ID в связи' || issue.title === 'Повторяющиеся video ID в связи') {
    const relationId = issue.detail.trim();
    if (!relationId) throw new Error('Не удалось определить relation ID.');
    const ref = doc(db, 'site_settings', relationId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error(`Relation ${relationId} не найден.`);
    const data = snapshot.data();
    const patch = issue.title.includes('gallery')
      ? { galleryIds: uniqueStrings(data.galleryIds), updatedAt: now }
      : { videoProjectIds: uniqueStrings(data.videoProjectIds), updatedAt: now };
    await updateDoc(ref, patch);
    return `Relation ${relationId}: повторяющиеся ID удалены.`;
  }

  if (issue.entityType === 'article' && issue.entityId && issue.title === 'Повторяющиеся ID в связях статьи') {
    const ref = doc(db, 'articles', issue.entityId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error(`Статья ${issue.entityId} не найдена.`);
    const data = snapshot.data();
    await updateDoc(ref, {
      relatedCaseIds: uniqueStrings(data.relatedCaseIds),
      relatedGalleryIds: uniqueStrings(data.relatedGalleryIds),
      relatedVideoProjectIds: uniqueStrings(data.relatedVideoProjectIds),
      updatedAt: now,
    });
    return `Статья ${issue.entityId}: повторяющиеся relation ID удалены.`;
  }

  throw new Error('Для этой проблемы безопасное автоматическое исправление не предусмотрено.');
}
