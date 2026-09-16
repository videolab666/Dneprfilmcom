import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { snapshotDocument, versionedDeleteDoc as deleteDoc, versionedSetDoc as setDoc } from './cmsVersioning';
import type { CaseStudy } from '../types';
import {
  isPhotoGallery,
  sortGalleries,
  type PhotoGallery,
} from './galleryContent';
import {
  isVideoProject,
  sortVideoProjects,
  type VideoProject,
} from './videoPortfolio';
import {
  PROJECT_RELATION_COLLECTION,
  PROJECT_RELATION_KIND,
  isProjectRelation,
  relationDocumentId,
  type ProjectRelation,
} from './projectRelations';

export type PortfolioRelationEntityType = 'case' | 'gallery' | 'video';

export interface PortfolioRelationAdminData {
  cases: CaseStudy[];
  galleries: PhotoGallery[];
  videos: VideoProject[];
  relations: ProjectRelation[];
}

export interface PortfolioRelationSelection {
  caseIds: string[];
  galleryIds: string[];
  videoProjectIds: string[];
}

export async function loadPortfolioRelationAdminData(): Promise<PortfolioRelationAdminData> {
  const [caseSnapshot, settingsSnapshot] = await Promise.all([
    getDocs(collection(db, 'cases')),
    getDocs(collection(db, PROJECT_RELATION_COLLECTION)),
  ]);

  const cases = caseSnapshot.docs
    .map(item => ({ id: item.id, ...item.data() } as CaseStudy))
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  const settingsDocs = settingsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));

  return {
    cases,
    galleries: sortGalleries(settingsDocs.filter(isPhotoGallery)),
    videos: sortVideoProjects(settingsDocs.filter(isVideoProject)),
    relations: settingsDocs.filter(isProjectRelation),
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function sameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

function stringIds(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

export function selectionForEntity(
  entityType: PortfolioRelationEntityType,
  entityId: string,
  relations: ProjectRelation[],
): PortfolioRelationSelection {
  if (entityType === 'case') {
    const relation = relations.find(item => item.caseId === entityId);
    return {
      caseIds: [entityId],
      galleryIds: [...(relation?.galleryIds || [])],
      videoProjectIds: [...(relation?.videoProjectIds || [])],
    };
  }

  const caseIds = relations
    .filter(item => entityType === 'gallery'
      ? item.galleryIds.includes(entityId)
      : item.videoProjectIds.includes(entityId))
    .map(item => item.caseId);

  return {
    caseIds,
    galleryIds: entityType === 'gallery' ? [entityId] : [],
    videoProjectIds: entityType === 'video' ? [entityId] : [],
  };
}

export async function savePortfolioRelationSelection(
  entityType: PortfolioRelationEntityType,
  entityId: string,
  selection: PortfolioRelationSelection,
): Promise<void> {
  if (!entityId) return;

  if (entityType === 'case') {
    const id = relationDocumentId(entityId);
    const galleryIds = unique(selection.galleryIds);
    const videoProjectIds = unique(selection.videoProjectIds);
    if (galleryIds.length === 0 && videoProjectIds.length === 0) {
      await deleteDoc(doc(db, PROJECT_RELATION_COLLECTION, id));
      return;
    }
    const payload: ProjectRelation = {
      id,
      kind: PROJECT_RELATION_KIND,
      caseId: entityId,
      galleryIds,
      videoProjectIds,
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, PROJECT_RELATION_COLLECTION, id), payload);
    return;
  }

  // Gallery/video relations are stored in case-centric relation documents.
  // Re-read before writing so edits from another admin session on the opposite
  // relation type are preserved rather than overwritten by stale modal state.
  const snapshot = await getDocs(collection(db, PROJECT_RELATION_COLLECTION));
  const relations = snapshot.docs
    .map(item => ({ id: item.id, ...item.data() }))
    .filter(isProjectRelation);
  const byCase = new Map(relations.map(item => [item.caseId, item]));
  const selectedCases = new Set(selection.caseIds);
  const allCaseIds = new Set([...byCase.keys(), ...selectedCases]);
  const batch = writeBatch(db);
  const snapshots: Promise<void>[] = [];
  let changes = 0;

  for (const caseId of allCaseIds) {
    const current = byCase.get(caseId);
    const currentlyLinked = entityType === 'gallery'
      ? Boolean(current?.galleryIds.includes(entityId))
      : Boolean(current?.videoProjectIds.includes(entityId));
    const shouldLink = selectedCases.has(caseId);
    if (currentlyLinked === shouldLink) continue;

    const galleryIds = unique(current?.galleryIds || []);
    const videoProjectIds = unique(current?.videoProjectIds || []);
    const nextGalleryIds = entityType === 'gallery'
      ? (shouldLink ? unique([...galleryIds, entityId]) : galleryIds.filter(id => id !== entityId))
      : galleryIds;
    const nextVideoIds = entityType === 'video'
      ? (shouldLink ? unique([...videoProjectIds, entityId]) : videoProjectIds.filter(id => id !== entityId))
      : videoProjectIds;
    const relationId = relationDocumentId(caseId);
    const relationRef = doc(db, PROJECT_RELATION_COLLECTION, relationId);

    if (nextGalleryIds.length === 0 && nextVideoIds.length === 0) {
      snapshots.push(snapshotDocument(relationRef, 'batch-delete'));
      batch.delete(relationRef);
    } else {
      const payload: ProjectRelation = {
        id: relationId,
        kind: PROJECT_RELATION_KIND,
        caseId,
        galleryIds: nextGalleryIds,
        videoProjectIds: nextVideoIds,
        updatedAt: Date.now(),
      };
      snapshots.push(snapshotDocument(relationRef, 'batch-set', payload));
      batch.set(relationRef, payload);
    }
    changes += 1;
  }

  if (changes > 0) { await Promise.all(snapshots); await batch.commit(); }
}

export async function cleanupPortfolioRelations(
  entityType: PortfolioRelationEntityType,
  entityId: string,
): Promise<void> {
  if (!entityId) return;

  const [relationSnapshot, articleSnapshot] = await Promise.all([
    getDocs(collection(db, PROJECT_RELATION_COLLECTION)),
    getDocs(collection(db, 'articles')),
  ]);
  const relations = relationSnapshot.docs
    .map(item => ({ id: item.id, ...item.data() }))
    .filter(isProjectRelation);
  const batch = writeBatch(db);
  const snapshots: Promise<void>[] = [];
  let changes = 0;

  if (entityType === 'case') {
    const relationRef = doc(db, PROJECT_RELATION_COLLECTION, relationDocumentId(entityId));
    snapshots.push(snapshotDocument(relationRef, 'batch-delete'));
    batch.delete(relationRef);
    changes += 1;
  } else {
    for (const relation of relations) {
      const nextGalleryIds = entityType === 'gallery'
        ? relation.galleryIds.filter(id => id !== entityId)
        : relation.galleryIds;
      const nextVideoIds = entityType === 'video'
        ? relation.videoProjectIds.filter(id => id !== entityId)
        : relation.videoProjectIds;
      if (sameIds(nextGalleryIds, relation.galleryIds) && sameIds(nextVideoIds, relation.videoProjectIds)) continue;

      const relationRef = doc(db, PROJECT_RELATION_COLLECTION, relationDocumentId(relation.caseId));
      if (nextGalleryIds.length === 0 && nextVideoIds.length === 0) {
        snapshots.push(snapshotDocument(relationRef, 'batch-delete'));
        batch.delete(relationRef);
      } else {
        const payload = { ...relation, galleryIds: nextGalleryIds, videoProjectIds: nextVideoIds, updatedAt: Date.now() };
        snapshots.push(snapshotDocument(relationRef, 'batch-set', payload));
        batch.set(relationRef, payload);
      }
      changes += 1;
    }
  }

  const articleField = entityType === 'case'
    ? 'relatedCaseIds'
    : entityType === 'gallery'
      ? 'relatedGalleryIds'
      : 'relatedVideoProjectIds';

  for (const article of articleSnapshot.docs) {
    const current = stringIds(article.data()[articleField]);
    if (!current.includes(entityId)) continue;
    const payload = { [articleField]: current.filter(id => id !== entityId), updatedAt: Date.now() };
    snapshots.push(snapshotDocument(article.ref, 'batch-update', payload));
    batch.update(article.ref, payload);
    changes += 1;
  }

  if (changes > 0) { await Promise.all(snapshots); await batch.commit(); }
}
