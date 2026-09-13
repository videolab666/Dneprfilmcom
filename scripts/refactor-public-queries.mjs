import { readFileSync, writeFileSync } from 'node:fs';

function edit(path, transform) {
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`${path}: transformation made no changes`);
  writeFileSync(path, after);
  console.log(`Updated ${path}`);
}

function replaceOne(text, from, to, context) {
  const index = text.indexOf(from);
  if (index < 0) throw new Error(`${context}: expected source fragment not found`);
  if (text.indexOf(from, index + from.length) >= 0) throw new Error(`${context}: source fragment is not unique`);
  return text.slice(0, index) + to + text.slice(index + from.length);
}

function addAfter(text, anchor, insertion, context) {
  return replaceOne(text, anchor, `${anchor}${insertion}`, context);
}

edit('src/pages/Cases.tsx', text => {
  text = addAfter(text, "import { db } from '../lib/firebase';\n", "import { publishedCasesQuery } from '../lib/publicPortfolioQueries';\n", 'Cases import');
  return replaceOne(text, "onSnapshot(collection(db, 'cases'),", 'onSnapshot(publishedCasesQuery(),', 'Cases published query');
});

edit('src/pages/CaseDetail.tsx', text => {
  text = addAfter(text, "import { db } from '../lib/firebase';\n", "import { publishedCasesQuery } from '../lib/publicPortfolioQueries';\n", 'CaseDetail import');
  return replaceOne(text, "onSnapshot(collection(db, 'cases'),", 'onSnapshot(publishedCasesQuery(),', 'CaseDetail published query');
});

edit('src/components/home/FeaturedCases.tsx', text => {
  text = replaceOne(text, "import { collection, onSnapshot } from 'firebase/firestore';\n", "import { onSnapshot } from 'firebase/firestore';\n", 'FeaturedCases Firestore import');
  text = replaceOne(text, "import { db } from '../../lib/firebase';\n", "import { publishedCasesQuery } from '../../lib/publicPortfolioQueries';\n", 'FeaturedCases query import');
  return replaceOne(text, "collection(db, 'cases')", 'publishedCasesQuery()', 'FeaturedCases published query');
});

edit('src/pages/Galleries.tsx', text => {
  text = replaceOne(text, "import { collection, onSnapshot } from 'firebase/firestore';\n", "import { onSnapshot } from 'firebase/firestore';\n", 'Galleries Firestore import');
  text = replaceOne(text, "import { db } from '../lib/firebase';\n", "import { publishedGalleriesQuery } from '../lib/publicPortfolioQueries';\n", 'Galleries query import');
  text = replaceOne(text, "  GALLERY_COLLECTION,\n", '', 'Galleries collection constant');
  return replaceOne(text, 'onSnapshot(collection(db, GALLERY_COLLECTION),', 'onSnapshot(publishedGalleriesQuery(),', 'Galleries published query');
});

edit('src/pages/GalleryDetail.tsx', text => {
  text = replaceOne(text, "import { collection, onSnapshot } from 'firebase/firestore';\n", "import { onSnapshot } from 'firebase/firestore';\n", 'GalleryDetail Firestore import');
  text = replaceOne(text, "import { db } from '../lib/firebase';\n", "import { publishedGalleriesQuery } from '../lib/publicPortfolioQueries';\n", 'GalleryDetail query import');
  text = replaceOne(text, "  GALLERY_COLLECTION,\n", '', 'GalleryDetail collection constant');
  return replaceOne(text, 'onSnapshot(collection(db, GALLERY_COLLECTION),', 'onSnapshot(publishedGalleriesQuery(),', 'GalleryDetail published query');
});

edit('src/pages/Videos.tsx', text => {
  text = replaceOne(text, "import { collection, onSnapshot } from 'firebase/firestore';\n", "import { onSnapshot } from 'firebase/firestore';\n", 'Videos Firestore import');
  text = replaceOne(text, "import { db } from '../lib/firebase';\n", "import { publishedVideoProjectsQuery } from '../lib/publicPortfolioQueries';\n", 'Videos query import');
  text = replaceOne(text, "  VIDEO_PROJECT_COLLECTION,\n", '', 'Videos collection constant');
  return replaceOne(text, 'onSnapshot(collection(db, VIDEO_PROJECT_COLLECTION),', 'onSnapshot(publishedVideoProjectsQuery(),', 'Videos published query');
});

edit('src/pages/VideoDetail.tsx', text => {
  text = replaceOne(text, "import { collection, onSnapshot } from 'firebase/firestore';\n", "import { onSnapshot } from 'firebase/firestore';\n", 'VideoDetail Firestore import');
  text = replaceOne(text, "import { db } from '../lib/firebase';\n", "import { publishedVideoProjectsQuery } from '../lib/publicPortfolioQueries';\n", 'VideoDetail query import');
  text = replaceOne(text, "  VIDEO_PROJECT_COLLECTION,\n", '', 'VideoDetail collection constant');
  return replaceOne(text, 'onSnapshot(collection(db, VIDEO_PROJECT_COLLECTION),', 'onSnapshot(publishedVideoProjectsQuery(),', 'VideoDetail published query');
});

edit('src/components/layout/PortfolioCrosslinks.tsx', text => {
  text = replaceOne(text, "import { collection, onSnapshot } from 'firebase/firestore';\n", "import { onSnapshot } from 'firebase/firestore';\n", 'PortfolioCrosslinks Firestore import');
  text = replaceOne(text, "import { db } from '../../lib/firebase';\n", "import { publishedGalleriesQuery, publishedVideoProjectsQuery } from '../../lib/publicPortfolioQueries';\n", 'PortfolioCrosslinks query import');
  text = replaceOne(text, "  GALLERY_COLLECTION,\n", '', 'PortfolioCrosslinks collection constant');
  const from = `  useEffect(() => {\n    if (!isPhotoPage && !isVideoPage) return;\n    const unsubscribe = onSnapshot(collection(db, GALLERY_COLLECTION), snapshot => {\n      const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));\n      setGalleries(sortGalleries(docs.filter(isPhotoGallery).filter(item => item.published !== false)));\n      setVideos(sortVideoProjects(docs.filter(isVideoProject).filter(item => item.published !== false)));\n    }, error => console.warn('Could not load portfolio crosslinks:', error));\n    return () => unsubscribe();\n  }, [isPhotoPage, isVideoPage]);`;
  const to = `  useEffect(() => {\n    if (!isPhotoPage && !isVideoPage) return;\n    const unsubscribeGalleries = onSnapshot(publishedGalleriesQuery(), snapshot => {\n      const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));\n      setGalleries(sortGalleries(docs.filter(isPhotoGallery)));\n    }, error => console.warn('Could not load portfolio gallery crosslinks:', error));\n    const unsubscribeVideos = onSnapshot(publishedVideoProjectsQuery(), snapshot => {\n      const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));\n      setVideos(sortVideoProjects(docs.filter(isVideoProject)));\n    }, error => console.warn('Could not load portfolio video crosslinks:', error));\n    return () => { unsubscribeGalleries(); unsubscribeVideos(); };\n  }, [isPhotoPage, isVideoPage]);`;
  return replaceOne(text, from, to, 'PortfolioCrosslinks public listeners');
});

edit('src/components/portfolio/RelatedProjectContent.tsx', text => {
  text = replaceOne(text, "import { collection, onSnapshot } from 'firebase/firestore';\n", "import { onSnapshot } from 'firebase/firestore';\n", 'RelatedProjectContent Firestore import');
  text = replaceOne(text, "import { db } from '../../lib/firebase';\n", "import {\n  publicProjectRelationsQuery,\n  publishedCasesQuery,\n  publishedGalleriesQuery,\n  publishedVideoProjectsQuery,\n} from '../../lib/publicPortfolioQueries';\n", 'RelatedProjectContent query imports');
  const from = `  useEffect(() => {\n    const unsubscribeSettings = onSnapshot(collection(db, 'site_settings'), snapshot => {\n      const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));\n      setRelations(docs.filter(isProjectRelation));\n      setGalleries(docs.filter(isPhotoGallery));\n      setVideos(docs.filter(isVideoProject));\n    }, error => console.warn('Could not load related portfolio settings:', error));\n\n    const unsubscribeCases = onSnapshot(collection(db, 'cases'), snapshot => {\n      setCases(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy)));\n    }, error => console.warn('Could not load related cases:', error));\n\n    return () => {\n      unsubscribeSettings();\n      unsubscribeCases();\n    };\n  }, []);`;
  const to = `  useEffect(() => {\n    const unsubscribeRelations = onSnapshot(publicProjectRelationsQuery(), snapshot => {\n      const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));\n      setRelations(docs.filter(isProjectRelation));\n    }, error => console.warn('Could not load related portfolio relations:', error));\n    const unsubscribeGalleries = onSnapshot(publishedGalleriesQuery(), snapshot => {\n      const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));\n      setGalleries(docs.filter(isPhotoGallery));\n    }, error => console.warn('Could not load related galleries:', error));\n    const unsubscribeVideos = onSnapshot(publishedVideoProjectsQuery(), snapshot => {\n      const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));\n      setVideos(docs.filter(isVideoProject));\n    }, error => console.warn('Could not load related videos:', error));\n    const unsubscribeCases = onSnapshot(publishedCasesQuery(), snapshot => {\n      setCases(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy)));\n    }, error => console.warn('Could not load related cases:', error));\n\n    return () => {\n      unsubscribeRelations();\n      unsubscribeGalleries();\n      unsubscribeVideos();\n      unsubscribeCases();\n    };\n  }, []);`;
  return replaceOne(text, from, to, 'RelatedProjectContent public listeners');
});

edit('src/components/portfolio/PortfolioDetailEnhancer.tsx', text => {
  text = replaceOne(text, "import { collection, getDocs } from 'firebase/firestore';\n", "import { getDocs } from 'firebase/firestore';\n", 'PortfolioDetailEnhancer Firestore import');
  text = replaceOne(text, "import { db } from '../../lib/firebase';\n", "import { publishedCasesQuery, publishedGalleriesQuery, publishedVideoProjectsQuery } from '../../lib/publicPortfolioQueries';\n", 'PortfolioDetailEnhancer query import');
  text = replaceOne(text, "getDocs(collection(db, 'cases'))", 'getDocs(publishedCasesQuery())', 'PortfolioDetailEnhancer case query');
  return replaceOne(
    text,
    "const snapshot = await getDocs(collection(db, 'site_settings'));",
    "const snapshot = await getDocs(type === 'gallery' ? publishedGalleriesQuery() : publishedVideoProjectsQuery());",
    'PortfolioDetailEnhancer settings query',
  );
});

edit('scripts/generate-seo-assets.ts', text => {
  text = replaceOne(text, "import { collection, getDocs, getFirestore } from 'firebase/firestore';\n", "import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';\n", 'SEO generator Firestore import');
  const from = `    const [caseSnapshot, settingsSnapshot] = await Promise.all([\n      getDocs(collection(db, 'cases')),\n      getDocs(collection(db, 'site_settings')),\n    ]);`;
  const to = `    const [caseSnapshot, gallerySnapshot, videoSnapshot] = await Promise.all([\n      getDocs(query(collection(db, 'cases'), where('published', '==', true))),\n      getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'gallery'), where('published', '==', true))),\n      getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'video_project'), where('published', '==', true))),\n    ]);\n    const portfolioSettingsDocs = [...gallerySnapshot.docs, ...videoSnapshot.docs];`;
  text = replaceOne(text, from, to, 'SEO generator published queries');
  text = replaceOne(text, '    settingsSnapshot.docs.forEach(document => {', '    portfolioSettingsDocs.forEach(document => {', 'SEO generator settings iteration');
  text = replaceOne(text, '      settings: settingsSnapshot.size,', '      settings: portfolioSettingsDocs.length,', 'SEO generator settings stats');
  return text;
});
