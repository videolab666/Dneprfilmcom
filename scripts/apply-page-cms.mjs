import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function write(path, content) {
  fs.writeFileSync(path, content, 'utf8');
}

function replaceExact(path, from, to, label) {
  const source = read(path);
  if (!source.includes(from)) {
    throw new Error(`Could not find ${label} in ${path}`);
  }
  const next = source.replace(from, to);
  if (next === source) throw new Error(`Replacement ${label} did not change ${path}`);
  write(path, next);
}

// VIDEO
replaceExact(
  'src/pages/VideoProduction.tsx',
  "import { useSiteContent } from '../context/SiteContentContext';",
  "import { useSiteContent } from '../context/SiteContentContext';\nimport { usePageCmsContent } from '../hooks/usePageCmsContent';",
  'Video CMS import'
);

replaceExact(
  'src/pages/VideoProduction.tsx',
  `export function VideoProduction() {\n  const { isUk } = useSiteContent();\n\n  const featuredWorks = isUk ? FEATURED_VIDEO_WORKS_UK : FEATURED_VIDEO_WORKS_RU;\n  const productionSteps = isUk ? PRODUCTION_STEPS_UK : PRODUCTION_STEPS_RU;`,
  `export function VideoProduction() {\n  const { isUk } = useSiteContent();\n  const { content: pageContent, localize } = usePageCmsContent();\n\n  const videoIconMap: Record<string, React.ReactNode> = {\n    flame: <Flame className=\"w-5 h-5 text-amber-500\" />,\n    factory: <Factory className=\"w-5 h-5 text-blue-500\" />,\n    globe: <Globe2 className=\"w-5 h-5 text-indigo-500\" />,\n    medical: <Stethoscope className=\"w-5 h-5 text-emerald-500\" />,\n    award: <Award className=\"w-5 h-5 text-purple-500\" />,\n    fitness: <Dumbbell className=\"w-5 h-5 text-rose-500\" />,\n    video: <Video className=\"w-5 h-5 text-indigo-500\" />,\n  };\n\n  const featuredWorks = localize(pageContent.video.works).map(item => ({\n    id: item.id,\n    title: item.text.title || '',\n    client: item.text.meta1 || '',\n    category: item.text.meta2 || '',\n    description: item.text.description || '',\n    icon: videoIconMap[item.iconKey || 'video'] || videoIconMap.video,\n    image: item.imageUrl || '',\n    tags: item.text.items || [],\n    results: item.text.result || '',\n  }));\n\n  const productionSteps = localize(pageContent.video.steps).map(item => ({\n    step: item.text.badge || '',\n    title: item.text.title || '',\n    subtitle: item.text.subtitle || '',\n    desc: item.text.description || '',\n  }));`,
  'Video CMS mappings'
);

// CONSTRUCTION
replaceExact(
  'src/pages/ConstructionMedia.tsx',
  "import { useSiteContent } from '../context/SiteContentContext';",
  "import { useSiteContent } from '../context/SiteContentContext';\nimport { usePageCmsContent } from '../hooks/usePageCmsContent';",
  'Construction CMS import'
);

replaceExact(
  'src/pages/ConstructionMedia.tsx',
  `export function ConstructionMedia() {\n  const { isUk, settings } = useSiteContent();\n\n  const showcaseWorks = isUk ? SHOWCASED_CONSTRUCTION_WORKS_UK : SHOWCASED_CONSTRUCTION_WORKS_RU;`,
  `export function ConstructionMedia() {\n  const { isUk, settings } = useSiteContent();\n  const { content: pageContent, localize } = usePageCmsContent();\n\n  const showcaseWorks = localize(pageContent.construction.works).map(item => ({\n    id: item.id,\n    title: item.text.title || '',\n    objectType: item.text.meta1 || '',\n    client: item.text.meta2 || '',\n    duration: item.text.meta3 || '',\n    image: item.imageUrl || '',\n    description: item.text.description || '',\n    features: item.text.items || [],\n    results: item.text.result || '',\n  }));`,
  'Construction CMS mapping'
);

// PHOTO
replaceExact(
  'src/pages/PhotoProduction.tsx',
  "import { useSiteContent } from '../context/SiteContentContext';",
  "import { useSiteContent } from '../context/SiteContentContext';\nimport { usePageCmsContent } from '../hooks/usePageCmsContent';",
  'Photo CMS import'
);

replaceExact(
  'src/pages/PhotoProduction.tsx',
  `export function PhotoProduction() {\n  const { isUk } = useSiteContent();\n  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');\n  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);\n  \n  const allPhotos = isUk ? INITIAL_PHOTOS_UK : INITIAL_PHOTOS;\n  const allPackages = isUk ? PHOTO_PACKAGES_UK : PHOTO_PACKAGES;`,
  `export function PhotoProduction() {\n  const { isUk } = useSiteContent();\n  const { content: pageContent, localize } = usePageCmsContent();\n  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');\n  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);\n\n  const allPhotos: PhotoItem[] = localize(pageContent.photo.gallery).map(item => ({\n    id: item.id,\n    title: item.text.title || '',\n    category: (item.categoryKey || 'interior') as PhotoItem['category'],\n    categoryLabel: item.text.meta1 || '',\n    location: item.text.meta2 || undefined,\n    client: item.text.meta3 || undefined,\n    description: item.text.description || '',\n    imageUrl: item.imageUrl || '',\n    aspect: item.aspect || 'landscape',\n    specs: item.text.badge || undefined,\n  }));\n\n  const allPackages = localize(pageContent.photo.packages).map(item => ({\n    id: item.id,\n    title: item.text.title || '',\n    subtitle: item.text.subtitle || '',\n    price: item.text.meta1 || '',\n    period: item.text.meta2 || '',\n    badge: item.text.badge || '',\n    features: item.text.items || [],\n    highlight: Boolean(item.highlight),\n  }));`,
  'Photo CMS mappings'
);

// ABOUT
replaceExact(
  'src/pages/About.tsx',
  "import { ClientsMarquee } from '../components/ClientsMarquee';",
  "import { ClientsMarquee } from '../components/ClientsMarquee';\nimport { usePageCmsContent } from '../hooks/usePageCmsContent';",
  'About CMS import'
);

replaceExact(
  'src/pages/About.tsx',
  `export function About() {\n  const { settings, isUk } = useSiteContent();`,
  `export function About() {\n  const { settings, isUk } = useSiteContent();\n  const { content: pageContent, localize } = usePageCmsContent();`,
  'About CMS hook'
);

replaceExact(
  'src/pages/About.tsx',
  `  const milestones = isUk ? milestones_UK : milestones_RU;\n  const principles = isUk ? principles_UK : principles_RU;`,
  `  const milestones = localize(pageContent.about.milestones).map(item => ({\n    year: item.text.badge || '',\n    title: item.text.title || '',\n    desc: item.text.description || '',\n  }));\n  const principles = localize(pageContent.about.principles).map(item => ({\n    title: item.text.title || '',\n    desc: item.text.description || '',\n  }));`,
  'About CMS mappings'
);

// The old constants stay in the page modules as a temporary source-history/fallback reference.
// They are no longer used by the rendered sections. Keeping this transform deliberately
// small avoids touching unrelated layout/calculator/lead logic on these production pages.

for (const path of ['scripts/apply-page-cms.mjs', '.github/workflows/apply-page-cms.yml']) {
  if (fs.existsSync(path)) fs.unlinkSync(path);
}

console.log('Page CMS transformations applied successfully.');
