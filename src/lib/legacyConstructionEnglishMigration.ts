import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import {
  LEGACY_CONSTRUCTION_PREFIX,
  getLegacyConstructionEnglishFields,
  type LegacyConstructionEnglishFields,
} from './legacyMigratedCaseEnglish';

export interface LegacyConstructionEnglishMigrationResult {
  casesBackfilled: number;
  version: number;
}

const TARGET_PORTFOLIO_MIGRATION_VERSION = 2;

function missingEnglishFields(
  current: Record<string, unknown>,
  fallback: LegacyConstructionEnglishFields,
): Record<string, string> {
  const updates: Record<string, string> = {};

  for (const [key, value] of Object.entries(fallback)) {
    if (!value) continue;
    const existing = current[key];
    if (typeof existing === 'string' && existing.trim()) continue;
    updates[key] = value;
  }

  return updates;
}

/**
 * Migration v2 is deliberately idempotent and non-destructive:
 * it only fills missing curated English fields on v1 legacy construction cases.
 * Existing admin-authored English values are never overwritten.
 */
export async function ensureLegacyConstructionEnglishBackfill(): Promise<LegacyConstructionEnglishMigrationResult> {
  const globalRef = doc(db, 'site_settings', 'global');
  const [globalSnapshot, casesSnapshot] = await Promise.all([
    getDoc(globalRef),
    getDocs(collection(db, 'cases')),
  ]);

  const currentVersion = Number(globalSnapshot.data()?.portfolioMigrationVersion || 0);
  if (currentVersion >= TARGET_PORTFOLIO_MIGRATION_VERSION) {
    return { casesBackfilled: 0, version: currentVersion };
  }

  const batch = writeBatch(db);
  const now = Date.now();
  let casesBackfilled = 0;

  for (const caseDoc of casesSnapshot.docs) {
    if (!caseDoc.id.startsWith(LEGACY_CONSTRUCTION_PREFIX)) continue;

    const fallback = getLegacyConstructionEnglishFields(caseDoc.id);
    if (!fallback) continue;

    const updates = missingEnglishFields(caseDoc.data() as Record<string, unknown>, fallback);
    if (!Object.keys(updates).length) continue;

    batch.set(caseDoc.ref, { ...updates, updatedAt: now }, { merge: true });
    casesBackfilled += 1;
  }

  batch.set(globalRef, {
    portfolioMigrationVersion: TARGET_PORTFOLIO_MIGRATION_VERSION,
    portfolioMigratedAt: now,
    portfolioEnglishBackfilledAt: now,
  }, { merge: true });

  await batch.commit();

  return {
    casesBackfilled,
    version: TARGET_PORTFOLIO_MIGRATION_VERSION,
  };
}
