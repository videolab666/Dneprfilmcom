import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { INITIAL_CASES } from '../data/initialCases';
import { DEFAULT_BACKSTAGE_ITEMS, DEFAULT_TESTIMONIALS } from '../data/cmsSeeds';
import { DEFAULT_PAGE_CONTENT, type PageContent, type PageContentItem } from '../data/pageContent';
import type { CaseStudy } from '../types';
import { DEFAULT_ARTICLES, isModernArticleData, normalizeArticle } from './articleCms';
import { slugifyCase } from './caseMedia';
import {
  GALLERY_KIND,
  type GalleryImage,
  type PhotoGallery,
} from './galleryContent';
import {
  VIDEO_PROJECT_KIND,
  type VideoProject,
} from './videoPortfolio';

export interface CmsMigrationResult {
  articlesSeeded: number;
  articlesMigrated: number;
  casesSeeded: number;
  casesPublishedBackfilled: number;
  legacyVideosMigrated: number;
  legacyGalleriesMigrated: number;
  legacyConstructionCasesMigrated: number;
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

function effectivePageContent(stored: Partial<PageContent> | undefined): PageContent {
  return {
    video: {
      works: Array.isArray(stored?.video?.works) ? stored.video.works : DEFAULT_PAGE_CONTENT.video.works,
      steps: Array.isArray(stored?.video?.steps) ? stored.video.steps : DEFAULT_PAGE_CONTENT.video.steps,
    },
    construction: {
      works: Array.isArray(stored?.construction?.works) ? stored.construction.works : DEFAULT_PAGE_CONTENT.construction.works,
    },
    photo: {
      gallery: Array.isArray(stored?.photo?.gallery) ? stored.photo.gallery : DEFAULT_PAGE_CONTENT.photo.gallery,
      packages: Array.isArray(stored?.photo?.packages) ? stored.photo.packages : DEFAULT_PAGE_CONTENT.photo.packages,
    },
    about: {
      milestones: Array.isArray(stored?.about?.milestones) ? stored.about.milestones : DEFAULT_PAGE_CONTENT.about.milestones,
      principles: Array.isArray(stored?.about?.principles) ? stored.about.principles : DEFAULT_PAGE_CONTENT.about.principles,
    },
  };
}

function normalizeText(value: string | undefined): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-zа-яёіїєґ0-9]+/giu, ' ')
    .trim();
}

function titleTokens(value: string | undefined): Set<string> {
  return new Set(normalizeText(value).split(/\s+/).filter(token => token.length >= 4));
}

function titlesEquivalent(a: string | undefined, b: string | undefined): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (Math.min(left.length, right.length) >= 18 && (left.includes(right) || right.includes(left))) return true;

  const aTokens = titleTokens(left);
  const bTokens = titleTokens(right);
  if (!aTokens.size || !bTokens.size) return false;
  let overlap = 0;
  aTokens.forEach(token => { if (bTokens.has(token)) overlap += 1; });
  return overlap / Math.min(aTokens.size, bTokens.size) >= 0.6;
}

function stableLegacyId(prefix: string, sourceId: string): string {
  return `${prefix}-${slugifyCase(sourceId || 'item')}`;
}

function pageTitle(item: PageContentItem): string {
  return item.uk?.title || item.ru?.title || item.en?.title || item.id;
}

async function migrateLegacyPortfolio(): Promise<{
  casesPublishedBackfilled: number;
  legacyVideosMigrated: number;
  legacyGalleriesMigrated: number;
  legacyConstructionCasesMigrated: number;
}> {
  const [casesSnapshot, settingsSnapshot, globalSnapshot] = await Promise.all([
    getDocs(collection(db, 'cases')),
    getDocs(collection(db, 'site_settings')),
    getDoc(doc(db, 'site_settings', 'global')),
  ]);

  const existingCases = casesSnapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy));
  const settingsDocs = settingsSnapshot.docs.map(item => ({ id: item.id, ...item.data() } as Record<string, unknown> & { id: string }));
  const existingSettingIds = new Set(settingsDocs.map(item => item.id));
  const existingVideoTitles = settingsDocs
    .filter(item => item.kind === VIDEO_PROJECT_KIND)
    .map(item => String(item.title_uk || item.title || item.title_en || ''));
  const existingGalleryTitles = settingsDocs
    .filter(item => item.kind === GALLERY_KIND)
    .map(item => String(item.title_uk || item.title || item.title_en || ''));

  const globalData = globalSnapshot.exists()
    ? globalSnapshot.data() as { pageContent?: Partial<PageContent>; portfolioMigrationVersion?: number }
    : {};
  const legacy = effectivePageContent(globalData.pageContent);
  const batch = writeBatch(db);
  const now = Date.now();
  let writeCount = 0;
  let casesPublishedBackfilled = 0;
  let legacyVideosMigrated = 0;
  let legacyGalleriesMigrated = 0;
  let legacyConstructionCasesMigrated = 0;

  if ((globalData.portfolioMigrationVersion || 0) < 1) {
    batch.set(doc(db, 'site_settings', 'global'), {
      portfolioMigrationVersion: 1,
      portfolioMigratedAt: now,
    }, { merge: true });
    writeCount += 1;
  }

  // Prior versions treated a missing `published` field as public. Preserve that
  // meaning explicitly before public Firestore queries switch to published == true.
  casesSnapshot.docs.forEach(caseDoc => {
    const data = caseDoc.data();
    if (typeof data.published !== 'boolean') {
      batch.set(caseDoc.ref, { published: true, updatedAt: now }, { merge: true });
      writeCount += 1;
      casesPublishedBackfilled += 1;
    }
  });

  legacy.video.works.forEach((item, index) => {
    const id = stableLegacyId('legacy-video', item.id);
    const title = pageTitle(item);
    if (existingSettingIds.has(id) || existingVideoTitles.some(existing => titlesEquivalent(existing, title))) return;

    const payload: VideoProject = {
      id,
      kind: VIDEO_PROJECT_KIND,
      slug: slugifyCase(item.uk?.title || item.ru?.title || item.en?.title || item.id),
      title: item.ru?.title || item.uk?.title || item.en?.title || item.id,
      title_uk: item.uk?.title || item.ru?.title || item.id,
      title_en: item.en?.title,
      client: item.ru?.meta1 || item.uk?.meta1 || '',
      client_uk: item.uk?.meta1 || item.ru?.meta1 || '',
      client_en: item.en?.meta1,
      category: item.ru?.meta2 || item.uk?.meta2 || 'Video',
      category_uk: item.uk?.meta2 || item.ru?.meta2 || 'Відео',
      category_en: item.en?.meta2,
      description: item.ru?.description || item.uk?.description || '',
      description_uk: item.uk?.description || item.ru?.description || '',
      description_en: item.en?.description,
      result: item.ru?.result || item.uk?.result || '',
      result_uk: item.uk?.result || item.ru?.result || '',
      result_en: item.en?.result,
      coverUrl: item.imageUrl || '',
      tags: item.ru?.items || item.uk?.items || [],
      tags_uk: item.uk?.items || item.ru?.items || [],
      tags_en: item.en?.items,
      videos: [],
      published: true,
      order: item.order || (index + 1) * 10,
      createdAt: now + index,
      updatedAt: now,
    };
    batch.set(doc(db, 'site_settings', id), payload);
    writeCount += 1;
    legacyVideosMigrated += 1;
    existingSettingIds.add(id);
    existingVideoTitles.push(title);
  });

  legacy.construction.works.forEach((item, index) => {
    const id = stableLegacyId('legacy-construction', item.id);
    const title = pageTitle(item);
    const alreadyExists = existingCases.some(existing =>
      titlesEquivalent(existing.title_uk || existing.title || existing.title_en, title),
    );
    if (casesSnapshot.docs.some(itemDoc => itemDoc.id === id) || alreadyExists) return;

    const payload: CaseStudy = {
      id,
      slug: slugifyCase(item.uk?.title || item.ru?.title || item.en?.title || item.id),
      title: item.ru?.title || item.uk?.title || item.en?.title || item.id,
      title_uk: item.uk?.title || item.ru?.title || item.id,
      title_en: item.en?.title,
      category: 'CONSTRUCTION',
      client: item.uk?.meta2 || item.ru?.meta2 || '',
      categoryLabel: item.ru?.meta1 || 'Construction Media',
      categoryLabel_uk: item.uk?.meta1 || item.ru?.meta1 || 'Construction Media',
      categoryLabel_en: item.en?.meta1,
      description: item.ru?.description || item.uk?.description || '',
      description_uk: item.uk?.description || item.ru?.description || '',
      description_en: item.en?.description,
      challenge: item.ru?.subtitle || '',
      challenge_uk: item.uk?.subtitle || item.ru?.subtitle || '',
      challenge_en: item.en?.subtitle,
      result: item.ru?.result || item.uk?.result || '',
      result_uk: item.uk?.result || item.ru?.result || '',
      result_en: item.en?.result,
      imageUrl: item.imageUrl || '',
      videoBadge: item.uk?.meta3 || item.ru?.meta3 || '',
      published: true,
      createdAt: now + 100 + index,
      updatedAt: now,
    };
    batch.set(doc(db, 'cases', id), payload);
    writeCount += 1;
    legacyConstructionCasesMigrated += 1;
    existingCases.push(payload);
  });

  const galleryGroups = new Map<string, PageContentItem[]>();
  legacy.photo.gallery.forEach(item => {
    if (!item.imageUrl) return;
    const key = item.categoryKey || item.uk?.meta1 || item.ru?.meta1 || 'photo';
    const current = galleryGroups.get(key) || [];
    current.push(item);
    galleryGroups.set(key, current);
  });

  Array.from(galleryGroups.entries()).forEach(([groupKey, group], groupIndex) => {
    const ordered = [...group].sort((a, b) => (a.order || 0) - (b.order || 0));
    const first = ordered[0];
    const id = stableLegacyId('legacy-gallery', groupKey);
    const title = first.uk?.meta1 || first.ru?.meta1 || first.uk?.title || first.ru?.title || groupKey;
    if (existingSettingIds.has(id) || existingGalleryTitles.some(existing => titlesEquivalent(existing, title))) return;

    const images: GalleryImage[] = ordered.map((item, index) => ({
      id: `legacy-${slugifyCase(item.id)}-${index + 1}`,
      url: item.imageUrl || '',
      alt: item.ru?.title || item.uk?.title || title,
      alt_uk: item.uk?.title || item.ru?.title || title,
      alt_en: item.en?.title,
      caption: item.ru?.description || '',
      caption_uk: item.uk?.description || item.ru?.description || '',
      caption_en: item.en?.description,
    }));

    const payload: PhotoGallery = {
      id,
      kind: GALLERY_KIND,
      slug: slugifyCase(title),
      title: first.ru?.meta1 || first.ru?.title || title,
      title_uk: first.uk?.meta1 || first.uk?.title || title,
      title_en: first.en?.meta1 || first.en?.title,
      description: first.ru?.description || '',
      description_uk: first.uk?.description || first.ru?.description || '',
      description_en: first.en?.description,
      location: first.ru?.meta2 || '',
      location_uk: first.uk?.meta2 || first.ru?.meta2 || '',
      location_en: first.en?.meta2,
      coverUrl: images[0]?.url || '',
      images,
      published: true,
      order: (groupIndex + 1) * 10,
      createdAt: now + 200 + groupIndex,
      updatedAt: now,
    };
    batch.set(doc(db, 'site_settings', id), payload);
    writeCount += 1;
    legacyGalleriesMigrated += 1;
    existingSettingIds.add(id);
    existingGalleryTitles.push(title);
  });

  if (writeCount) await batch.commit();

  return {
    casesPublishedBackfilled,
    legacyVideosMigrated,
    legacyGalleriesMigrated,
    legacyConstructionCasesMigrated,
  };
}

export async function ensureCmsSeedData(): Promise<CmsMigrationResult> {
  const articles = await migrateArticles();
  const [casesSeeded, testimonialsSeeded, backstageSeeded] = await Promise.all([
    seedMissing('cases', INITIAL_CASES),
    seedMissing('testimonials', DEFAULT_TESTIMONIALS),
    seedMissing('backstage', DEFAULT_BACKSTAGE_ITEMS),
  ]);
  const portfolio = await migrateLegacyPortfolio();

  return {
    articlesSeeded: articles.seeded,
    articlesMigrated: articles.migrated,
    casesSeeded,
    casesPublishedBackfilled: portfolio.casesPublishedBackfilled,
    legacyVideosMigrated: portfolio.legacyVideosMigrated,
    legacyGalleriesMigrated: portfolio.legacyGalleriesMigrated,
    legacyConstructionCasesMigrated: portfolio.legacyConstructionCasesMigrated,
    testimonialsSeeded,
    backstageSeeded,
  };
}
