import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { INITIAL_CASES } from '../data/initialCases';
import { DEFAULT_BACKSTAGE_ITEMS, DEFAULT_TESTIMONIALS } from '../data/cmsSeeds';
import { DEFAULT_ARTICLES, isModernArticleData, normalizeArticle } from './articleCms';

export interface CmsMigrationResult {
  articlesSeeded: number;
  articlesMigrated: number;
  casesSeeded: number;
  testimonialsSeeded: number;
  backstageSeeded: number;
}

async function seedMissing<T extends { id: string }>(collectionName: string, defaults: T[]): Promise<number> {
  const snapshot = await getDocs(collection(db, collectionName));
  const existingIds = new Set(snapshot.docs.map(item => item.id));
  const missing = defaults.filter(item => !existingIds.has(item.id));
  if (!missing.length) return 0;

  const batch = writeBatch(db);
  for (const item of missing) {
    batch.set(doc(db, collectionName, item.id), item);
  }
  await batch.commit();
  return missing.length;
}

async function migrateArticles(): Promise<{ seeded: number; migrated: number }> {
  const snapshot = await getDocs(collection(db, 'articles'));
  const existingIds = new Set(snapshot.docs.map(item => item.id));
  const batch = writeBatch(db);
  let pendingWrites = 0;
  let migrated = 0;
  let seeded = 0;

  for (const articleDoc of snapshot.docs) {
    const data = articleDoc.data();
    if (!isModernArticleData(data)) {
      batch.set(doc(db, 'articles', articleDoc.id), normalizeArticle(articleDoc.id, data));
      pendingWrites += 1;
      migrated += 1;
    }
  }

  for (const article of DEFAULT_ARTICLES) {
    if (!existingIds.has(article.id)) {
      batch.set(doc(db, 'articles', article.id), article);
      pendingWrites += 1;
      seeded += 1;
    }
  }

  if (pendingWrites) await batch.commit();
  return { seeded, migrated };
}

export async function ensureCmsSeedData(): Promise<CmsMigrationResult> {
  const articles = await migrateArticles();
  const [casesSeeded, testimonialsSeeded, backstageSeeded] = await Promise.all([
    seedMissing('cases', INITIAL_CASES),
    seedMissing('testimonials', DEFAULT_TESTIMONIALS),
    seedMissing('backstage', DEFAULT_BACKSTAGE_ITEMS),
  ]);

  return {
    articlesSeeded: articles.seeded,
    articlesMigrated: articles.migrated,
    casesSeeded,
    testimonialsSeeded,
    backstageSeeded,
  };
}
