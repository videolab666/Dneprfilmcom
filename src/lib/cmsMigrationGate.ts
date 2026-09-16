import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ensureCmsSeedData, type CmsMigrationResult } from './cmsMigration';
import { ensureLegacyConstructionEnglishBackfill } from './legacyConstructionEnglishMigration';

export const CMS_MIGRATION_TARGET_VERSION = 2;

export interface CmsMigrationGateResult {
  initialVersion: number;
  finalVersion: number;
  skipped: boolean;
  seed: CmsMigrationResult;
  legacyConstructionEnglishBackfilled: number;
}

function emptySeedResult(): CmsMigrationResult {
  return {
    articlesSeeded: 0,
    articlesMigrated: 0,
    casesSeeded: 0,
    casesPublishedBackfilled: 0,
    legacyVideosMigrated: 0,
    legacyGalleriesMigrated: 0,
    legacyConstructionCasesMigrated: 0,
    testimonialsSeeded: 0,
    backstageSeeded: 0,
  };
}

/**
 * Keep automatic CMS migrations cheap after they have completed.
 *
 * Older code called every idempotent migration on every admin entry. Even when
 * there was nothing left to change, that meant full reads of articles, cases,
 * testimonials, backstage and site_settings. portfolioMigrationVersion is
 * already the authoritative migration marker:
 *   v1 = seed/legacy portfolio migration completed
 *   v2 = curated legacy-construction English backfill completed
 *
 * Steady state therefore costs one read of site_settings/global. Full scans are
 * only performed when the stored migration version is genuinely behind.
 */
export async function ensureCmsMigrations(): Promise<CmsMigrationGateResult> {
  const globalSnapshot = await getDoc(doc(db, 'site_settings', 'global'));
  const initialVersion = Number(globalSnapshot.data()?.portfolioMigrationVersion || 0);

  if (initialVersion >= CMS_MIGRATION_TARGET_VERSION) {
    return {
      initialVersion,
      finalVersion: initialVersion,
      skipped: true,
      seed: emptySeedResult(),
      legacyConstructionEnglishBackfilled: 0,
    };
  }

  const seed = initialVersion < 1
    ? await ensureCmsSeedData()
    : emptySeedResult();

  const english = await ensureLegacyConstructionEnglishBackfill();

  return {
    initialVersion,
    finalVersion: english.version,
    skipped: false,
    seed,
    legacyConstructionEnglishBackfilled: english.casesBackfilled,
  };
}

export function isFirestoreQuotaExceeded(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return /quota\s+(limit\s+)?exceeded|resource-exhausted/i.test(String(error || ''));
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const code = String(candidate.code || '').toLowerCase();
  const message = String(candidate.message || '').toLowerCase();
  return code.includes('resource-exhausted')
    || message.includes('quota limit exceeded')
    || message.includes('quota exceeded');
}

export function isFirestorePermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return /permission-denied|missing or insufficient permissions/i.test(String(error || ''));
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const code = String(candidate.code || '').toLowerCase();
  const message = String(candidate.message || '').toLowerCase();
  return code.includes('permission-denied')
    || message.includes('missing or insufficient permissions');
}
