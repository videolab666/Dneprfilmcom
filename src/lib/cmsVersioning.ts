import {
  addDoc,
  collection,
  deleteDoc as firestoreDeleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface CmsVersionRecord {
  id: string;
  targetPath: string;
  targetCollection: string;
  targetId: string;
  operation: string;
  createdAt: number;
  createdBy: string;
  existed: boolean;
  snapshot: DocumentData | null;
  changedKeys: string[];
}

function topLevelChangedKeys(before: DocumentData | null, after: unknown): string[] {
  if (!after || typeof after !== 'object' || Array.isArray(after)) return [];
  const right = after as Record<string, unknown>;
  const left = before || {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].filter(key => {
    try { return JSON.stringify(left[key]) !== JSON.stringify(right[key]); } catch { return true; }
  }).slice(0, 40);
}

export async function snapshotDocument(ref: DocumentReference<DocumentData>, operation: string, nextData?: unknown): Promise<void> {
  if (!auth.currentUser) return;
  const current = await getDoc(ref);
  const snapshot = current.exists() ? current.data() : null;
  await addDoc(collection(db, 'content_versions'), {
    targetPath: ref.path,
    targetCollection: ref.parent.id,
    targetId: ref.id,
    operation,
    createdAt: Date.now(),
    createdBy: auth.currentUser.email || auth.currentUser.uid,
    existed: current.exists(),
    snapshot,
    changedKeys: topLevelChangedKeys(snapshot, nextData),
  });

  try {
    const old = await getDocs(query(collection(db, 'content_versions'), where('targetPath', '==', ref.path), orderBy('createdAt', 'desc'), limit(36)));
    if (old.docs.length > 30) await Promise.all(old.docs.slice(30).map(item => firestoreDeleteDoc(item.ref)));
  } catch (error) {
    console.warn('Version retention cleanup skipped:', error);
  }
}

export async function versionedSetDoc(ref: DocumentReference<DocumentData>, data: unknown, options?: unknown): Promise<void> {
  await snapshotDocument(ref, 'set', data);
  if (options) await firestoreSetDoc(ref, data as DocumentData, options as never);
  else await firestoreSetDoc(ref, data as DocumentData);
}

export async function versionedUpdateDoc(ref: DocumentReference<DocumentData>, data: unknown): Promise<void> {
  await snapshotDocument(ref, 'update', data);
  await firestoreUpdateDoc(ref, data as never);
}

export async function versionedDeleteDoc(ref: DocumentReference<DocumentData>): Promise<void> {
  await snapshotDocument(ref, 'delete');
  await firestoreDeleteDoc(ref);
}

export async function loadCmsVersions(max = 120): Promise<CmsVersionRecord[]> {
  const snap = await getDocs(query(collection(db, 'content_versions'), orderBy('createdAt', 'desc'), limit(max)));
  return snap.docs.map(item => ({ id: item.id, ...(item.data() as Omit<CmsVersionRecord, 'id'>) }));
}

export async function restoreCmsVersion(record: CmsVersionRecord): Promise<void> {
  const ref = doc(db, record.targetPath) as DocumentReference<DocumentData>;
  await snapshotDocument(ref, 'restore-backup');
  if (!record.existed || !record.snapshot) await firestoreDeleteDoc(ref);
  else await firestoreSetDoc(ref, record.snapshot);
}
