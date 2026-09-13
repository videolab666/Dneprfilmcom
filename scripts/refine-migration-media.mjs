import { readFileSync, writeFileSync } from 'node:fs';

function edit(path, transform) {
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`${path}: no changes made`);
  writeFileSync(path, after);
  console.log(`Updated ${path}`);
}

function replaceOne(text, from, to, context) {
  const index = text.indexOf(from);
  if (index < 0) throw new Error(`${context}: expected fragment not found`);
  if (text.indexOf(from, index + from.length) >= 0) throw new Error(`${context}: fragment not unique`);
  return text.slice(0, index) + to + text.slice(index + from.length);
}

edit('src/components/admin/GalleriesManager.tsx', text => {
  text = replaceOne(text, "import { uploadCaseImage } from '../../lib/mediaUpload';", "import { uploadGalleryImage } from '../../lib/mediaUpload';", 'gallery uploader import');
  text = replaceOne(text, "import type { MediaLibraryAsset } from '../../lib/mediaLibrary';", "import { registerMediaAsset, type MediaLibraryAsset } from '../../lib/mediaLibrary';", 'gallery media registry import');
  text = replaceOne(text, "        const uploaded = await uploadCaseImage(file, `gallery-${editing.id}`);", "        const uploaded = await uploadGalleryImage(file, editing.id);\n        await registerMediaAsset(uploaded, file.name);", 'gallery upload implementation');
  return text;
});

edit('src/lib/mediaLibrary.ts', text => replaceOne(
  text,
  "  if (kind === 'photo_gallery') return 'Фотогалерея';",
  "  if (kind === 'gallery' || kind === 'photo_gallery') return 'Фотогалерея';",
  'media library gallery source label',
));

edit('src/lib/cmsMigration.ts', text => {
  text = replaceOne(
    text,
    "  const globalData = globalSnapshot.exists() ? globalSnapshot.data() as { pageContent?: Partial<PageContent> } : {};",
    "  const globalData = globalSnapshot.exists()\n    ? globalSnapshot.data() as { pageContent?: Partial<PageContent>; portfolioMigrationVersion?: number }\n    : {};",
    'migration global metadata type',
  );
  const anchor = `  let legacyConstructionCasesMigrated = 0;\n\n  // Prior versions treated a missing \`published\` field as public.`;
  const replacement = `  let legacyConstructionCasesMigrated = 0;\n\n  if ((globalData.portfolioMigrationVersion || 0) < 1) {\n    batch.set(doc(db, 'site_settings', 'global'), {\n      portfolioMigrationVersion: 1,\n      portfolioMigratedAt: now,\n    }, { merge: true });\n    writeCount += 1;\n  }\n\n  // Prior versions treated a missing \`published\` field as public.`;
  return replaceOne(text, anchor, replacement, 'migration version marker');
});

edit('scripts/generate-seo-assets.ts', text => {
  text = replaceOne(
    text,
    "import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';",
    "import { collection, doc, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore';\nimport { INITIAL_CASES } from '../src/data/initialCases';",
    'SEO fallback imports',
  );
  const snapshotsFrom = `    const [caseSnapshot, gallerySnapshot, videoSnapshot] = await Promise.all([\n      getDocs(query(collection(db, 'cases'), where('published', '==', true))),\n      getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'gallery'), where('published', '==', true))),\n      getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'video_project'), where('published', '==', true))),\n    ]);\n    const portfolioSettingsDocs = [...gallerySnapshot.docs, ...videoSnapshot.docs];\n\n    caseSnapshot.docs.forEach(document => {\n      const data = document.data() as Record<string, unknown>;`;
  const snapshotsTo = `    const [caseSnapshot, gallerySnapshot, videoSnapshot, globalSnapshot] = await Promise.all([\n      getDocs(query(collection(db, 'cases'), where('published', '==', true))),\n      getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'gallery'), where('published', '==', true))),\n      getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'video_project'), where('published', '==', true))),\n      getDoc(doc(db, 'site_settings', 'global')),\n    ]);\n    const portfolioSettingsDocs = [...gallerySnapshot.docs, ...videoSnapshot.docs];\n    const migrationVersion = Number(globalSnapshot.data()?.portfolioMigrationVersion || 0);\n    const publishedCaseRecords: Array<{ id: string; data: Record<string, unknown> }> = caseSnapshot.docs.map(document => ({\n      id: document.id,\n      data: document.data() as Record<string, unknown>,\n    }));\n    if (publishedCaseRecords.length === 0 && migrationVersion < 1) {\n      INITIAL_CASES.forEach(item => publishedCaseRecords.push({\n        id: item.id,\n        data: item as unknown as Record<string, unknown>,\n      }));\n      console.warn('No explicit published case records yet; using bundled legacy cases until CMS migration v1 is completed.');\n    }\n\n    publishedCaseRecords.forEach(document => {\n      const data = document.data;`;
  text = replaceOne(text, snapshotsFrom, snapshotsTo, 'SEO published snapshot + legacy fallback');
  text = replaceOne(text, '      cases: caseSnapshot.size,', '      cases: publishedCaseRecords.length,', 'SEO case stats');
  return text;
});
