import { readFileSync } from 'node:fs';

const checks: Array<{ file: string; mustContain: string[]; mustNotContain?: string[] }> = [
  {
    file: 'src/components/admin/ArticlesManager.tsx',
    mustContain: ['AdminImageField', 'label="Обложка статьи"'],
    mustNotContain: ['URL обложки'],
  },
  {
    file: 'src/components/admin/BackstageManager.tsx',
    mustContain: ['AdminImageField', 'label="Изображение карточки"'],
    mustNotContain: ['URL изображения<input'],
  },
  {
    file: 'src/components/admin/TestimonialsManager.tsx',
    mustContain: ['AdminImageField', 'label="Аватар клиента"'],
    mustNotContain: ['URL аватара<input'],
  },
  {
    file: 'src/components/admin/BlocksManager.tsx',
    mustContain: ['AdminImageField', 'label="Изображение блока"'],
    mustNotContain: ['URL изображения (общий)'],
  },
  {
    file: 'src/components/admin/SiteSettingsEditor.tsx',
    mustContain: ['label="Fallback-фото Hero"', 'label="Фотография основателя"'],
    mustNotContain: ['Фотография основателя (URL)'],
  },
  {
    file: 'src/components/admin/HeroSlidesEditor.tsx',
    mustContain: ['Фото из медиатеки', 'Видео из медиатеки', 'registerMediaAsset'],
  },
  {
    file: 'src/components/admin/MediaLibraryPicker.tsx',
    mustContain: [
      'uploadLibraryImage',
      'uploadLibraryVideo',
      'registerMediaAsset',
      'Выбрать все',
      'draggable',
      'Порядок выбранных файлов',
      'formatBytes',
    ],
  },
  {
    file: 'src/lib/mediaUpload.ts',
    mustContain: ['dneprfilm/galleries/', 'uploadGalleryImage'],
  },
  {
    file: 'src/lib/mediaLibrary.ts',
    mustContain: [
      "collection(db, 'articles')",
      "collection(db, 'testimonials')",
      "collection(db, 'backstage')",
      "collection(db, 'site_blocks')",
    ],
  },
  {
    file: 'src/pages/Cases.tsx',
    mustContain: ['publishedCasesQuery()'],
    mustNotContain: ["onSnapshot(collection(db, 'cases')"],
  },
  {
    file: 'src/pages/CaseDetail.tsx',
    mustContain: ['publishedCasesQuery()'],
    mustNotContain: ["onSnapshot(collection(db, 'cases')"],
  },
  {
    file: 'src/components/home/FeaturedCases.tsx',
    mustContain: ['publishedCasesQuery()'],
    mustNotContain: ["collection(db, 'cases')"],
  },
  {
    file: 'src/pages/Galleries.tsx',
    mustContain: ['publishedGalleriesQuery()'],
    mustNotContain: ['onSnapshot(collection(db, GALLERY_COLLECTION)'],
  },
  {
    file: 'src/pages/GalleryDetail.tsx',
    mustContain: ['publishedGalleriesQuery()'],
    mustNotContain: ['onSnapshot(collection(db, GALLERY_COLLECTION)'],
  },
  {
    file: 'src/pages/Videos.tsx',
    mustContain: ['publishedVideoProjectsQuery()'],
    mustNotContain: ['onSnapshot(collection(db, VIDEO_PROJECT_COLLECTION)'],
  },
  {
    file: 'src/pages/VideoDetail.tsx',
    mustContain: ['publishedVideoProjectsQuery()'],
    mustNotContain: ['onSnapshot(collection(db, VIDEO_PROJECT_COLLECTION)'],
  },
  {
    file: 'src/components/layout/PortfolioCrosslinks.tsx',
    mustContain: ['publishedGalleriesQuery()', 'publishedVideoProjectsQuery()'],
    mustNotContain: ["collection(db, 'site_settings')"],
  },
  {
    file: 'src/components/portfolio/RelatedProjectContent.tsx',
    mustContain: ['publicProjectRelationsQuery()', 'publishedCasesQuery()', 'publishedGalleriesQuery()', 'publishedVideoProjectsQuery()'],
    mustNotContain: ["collection(db, 'site_settings')", "collection(db, 'cases')"],
  },
  {
    file: 'src/components/portfolio/PortfolioDetailEnhancer.tsx',
    mustContain: ['publishedCasesQuery()', 'publishedGalleriesQuery()', 'publishedVideoProjectsQuery()'],
    mustNotContain: ["getDocs(collection(db, 'site_settings'))", "getDocs(collection(db, 'cases'))"],
  },
  {
    file: 'scripts/generate-seo-assets-once.ts',
    mustContain: [
      "where('published', '==', true)",
      "where('kind', '==', 'gallery')",
      "where('kind', '==', 'video_project')",
    ],
    mustNotContain: ["getDocs(collection(db, 'site_settings'))", "getDocs(collection(db, 'cases'))"],
  },
  {
    file: 'scripts/generate-seo-assets.ts',
    mustContain: [
      "['scripts/generate-seo-assets-once.ts']",
      'dynamic > 0',
      'records === dynamic',
      'delays = [0, 1500, 3500, 7000]',
      'Refusing to continue with a static-only manifest',
    ],
  },
];

let failed = false;

for (const check of checks) {
  const source = readFileSync(check.file, 'utf8');
  for (const needle of check.mustContain) {
    if (!source.includes(needle)) {
      console.error(`FAIL ${check.file}: missing ${JSON.stringify(needle)}`);
      failed = true;
    }
  }
  for (const needle of check.mustNotContain || []) {
    if (source.includes(needle)) {
      console.error(`FAIL ${check.file}: stale/insecure pattern ${JSON.stringify(needle)}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Admin media + public Firestore consistency audit passed.');
