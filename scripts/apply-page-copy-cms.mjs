import fs from 'node:fs';

const touched = new Set();

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, content) { fs.writeFileSync(path, content, 'utf8'); touched.add(path); }
function exact(path, from, to, label) {
  const source = read(path);
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  write(path, source.replace(from, to));
}
function all(path, from, to, label) {
  const source = read(path);
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  write(path, source.split(from).join(to));
}

// VIDEO ---------------------------------------------------------------------
exact(
  'src/pages/VideoProduction.tsx',
  "import { usePageCmsContent } from '../hooks/usePageCmsContent';",
  "import { usePageCmsContent } from '../hooks/usePageCmsContent';\nimport { usePageCopyContent } from '../hooks/usePageCopyContent';",
  'video copy hook import'
);

exact(
  'src/pages/VideoProduction.tsx',
  `  const { content: pageContent, localize } = usePageCmsContent();\n\n  const videoIconMap`,
  `  const { content: pageContent, localize } = usePageCmsContent();\n  const { content: copyContent, localize: localizeCopy, byId: copyById } = usePageCopyContent();\n  const videoHero = copyById(copyContent.video.hero, 'video-hero')?.text;\n  const videoWorksHeading = copyById(copyContent.video.headings, 'video-heading-works')?.text;\n  const videoFaqHeading = copyById(copyContent.video.headings, 'video-heading-faq')?.text;\n  const cmsFaqs = localizeCopy(copyContent.video.faqs).map(item => ({ q: item.text.title || '', a: item.text.description || '' }));\n\n  const videoIconMap`,
  'video copy bindings'
);

exact(
  'src/pages/VideoProduction.tsx',
  `{isUk ? 'Комерційний та корпоративний продакшн' : 'Коммерческий и корпоративный продакшн'}`,
  `{videoHero?.badge}`,
  'video hero badge'
);

exact(
  'src/pages/VideoProduction.tsx',
  `{isUk ? (\n                <>Відео, яке <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-500">продає цінність</span> вашого бізнесу</>\n              ) : (\n                <>Видео, которое <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-500">продает ценность</span> вашего бизнеса</>\n              )}`,
  `{videoHero?.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-500">{videoHero?.meta1}</span> {videoHero?.meta2}`,
  'video hero h1'
);

exact(
  'src/pages/VideoProduction.tsx',
  `{isUk\n                ? 'Створюємо висококласні рекламні ролики, презентаційні фільми для заводів та підприємств, контент для міжнародних виставок (Dubai Expo) та динамічні промо. Від сценарію і розкадрування до кольорокорекції DaVinci та 3D-графіки.'\n                : 'Создаем высококлассные рекламные ролики, презентационные фильмы для заводов и предприятий, контент для международных выставок (Dubai Expo) и динамичные промо. От сценария и раскадровки до цветокоррекции DaVinci и 3D-графики.'\n              }`,
  `{videoHero?.description}`,
  'video hero description'
);

exact(
  'src/pages/VideoProduction.tsx',
  `{isUk ? 'Розрахувати кошторис ролика' : 'Рассчитать смету ролика'}`,
  `{videoHero?.meta3}`,
  'video hero cta'
);

exact(
  'src/pages/VideoProduction.tsx',
  `{isUk ? 'Реальні роботи з портфоліо студії' : 'Реальные работы из портфолио студии'}`,
  `{videoWorksHeading?.badge}`,
  'video works badge'
);
exact(
  'src/pages/VideoProduction.tsx',
  `{isUk ? 'Обрані комерційні та промо-проєкти' : 'Избранные коммерческие и промо-проекты'}`,
  `{videoWorksHeading?.title}`,
  'video works title'
);
exact(
  'src/pages/VideoProduction.tsx',
  `{isUk\n                ? 'Кожен ролик вирішує конкретне бізнес-завдання: вихід на експорт, залучення дилерів, зростання конверсії на сайті або створення яскравого іміджу бренду.'\n                : 'Каждый ролик решает конкретную бизнес-задачу: выход на экспорт, привлечение дилеров, рост конверсии на сайте или создание яркого имиджа бренда.'\n              }`,
  `{videoWorksHeading?.description}`,
  'video works description'
);

exact(
  'src/pages/VideoProduction.tsx',
  `{isUk ? 'Питання та відповіді' : 'Вопросы и ответы'}`,
  `{videoFaqHeading?.badge}`,
  'video faq badge'
);
exact(
  'src/pages/VideoProduction.tsx',
  `{isUk ? 'Часті запитання про відеопродакшн' : 'Часто задаваемые вопросы о видеопродакшне'}`,
  `{videoFaqHeading?.title}`,
  'video faq title'
);
all('src/pages/VideoProduction.tsx', '{faqs.map((faq, i) => (', '{cmsFaqs.map((faq, i) => (', 'video FAQ source');

// CONSTRUCTION --------------------------------------------------------------
exact(
  'src/pages/ConstructionMedia.tsx',
  "import { usePageCmsContent } from '../hooks/usePageCmsContent';",
  "import { usePageCmsContent } from '../hooks/usePageCmsContent';\nimport { usePageCopyContent } from '../hooks/usePageCopyContent';",
  'construction copy hook import'
);

exact(
  'src/pages/ConstructionMedia.tsx',
  `  const { content: pageContent, localize } = usePageCmsContent();\n\n  const showcaseWorks`,
  `  const { content: pageContent, localize } = usePageCmsContent();\n  const { content: copyContent, localize: localizeCopy, byId: copyById } = usePageCopyContent();\n  const constructionHero = copyById(copyContent.construction.hero, 'construction-hero')?.text;\n  const solutionIconMap: Record<string, React.ReactNode> = {\n    camera: <Camera className="w-6 h-6 text-amber-500" />,\n    compass: <Compass className="w-6 h-6 text-indigo-500" />,\n    eye: <Eye className="w-6 h-6 text-emerald-500" />,\n    file: <FileCheck className="w-6 h-6 text-blue-500" />,\n    video: <Video className="w-6 h-6 text-rose-500" />,\n    radio: <Radio className="w-6 h-6 text-purple-500" />,\n  };\n\n  const showcaseWorks`,
  'construction copy bindings'
);

exact(
  'src/pages/ConstructionMedia.tsx',
  `  const solutions = isUk ? SOLUTIONS_UK : SOLUTIONS_RU;\n  const workflowSteps = isUk ? WORKFLOW_STEPS_UK : WORKFLOW_STEPS_RU;\n  const faqs = isUk ? FAQS_UK : FAQS_RU;`,
  `  const solutions = localizeCopy(copyContent.construction.solutions).map(item => ({\n    id: item.id, title: item.text.title || '', subtitle: item.text.subtitle || '',\n    icon: solutionIconMap[item.iconKey || 'camera'] || solutionIconMap.camera,\n    badge: item.text.badge || '', description: item.text.description || '', bullets: item.text.items || [],\n  }));\n  const workflowSteps = localizeCopy(copyContent.construction.workflow).map(item => ({ step: item.text.badge || '', title: item.text.title || '', desc: item.text.description || '' }));\n  const faqs = localizeCopy(copyContent.construction.faqs).map(item => ({ q: item.text.title || '', a: item.text.description || '' }));`,
  'construction CMS lists'
);

exact(
  'src/pages/ConstructionMedia.tsx',
  `{isUk ? 'Інженерний медіамоніторинг для девелоперів' : 'Инженерный медиамониторинг для девелоперов'}`,
  `{constructionHero?.badge}`,
  'construction hero badge'
);
exact(
  'src/pages/ConstructionMedia.tsx',
  `{isUk ? 'Медіаконтроль' : 'Медиаконтроль'} <br />`,
  `{constructionHero?.title} <br />`,
  'construction hero title'
);
exact(
  'src/pages/ConstructionMedia.tsx',
  `{isUk ? 'будівництва & 4K Аеромоніторинг' : 'строительства & 4K Аэромониторинг'}`,
  `{constructionHero?.meta1}`,
  'construction hero accent'
);
exact(
  'src/pages/ConstructionMedia.tsx',
  `{isUk\n                  ? 'Автономний 4K таймлапс 24/7 у термобоксах IP67, регулярні обльоти дронами за фіксованими GPS-точками, 3D-аеропанорами краєвидів з вікон майбутніх квартир та відеозвіти для інвесторів і банків.'\n                  : 'Автономный 4K таймлапс 24/7 в термобоксах IP67, регулярные облеты дронами по фиксированным GPS-точкам, 3D-аэропанорамы видов из окон будущих квартир и видеоотчеты для инвесторов и банков.'}`,
  `{constructionHero?.description}`,
  'construction hero description'
);

// PHOTO ---------------------------------------------------------------------
exact(
  'src/pages/PhotoProduction.tsx',
  "import { usePageCmsContent } from '../hooks/usePageCmsContent';",
  "import { usePageCmsContent } from '../hooks/usePageCmsContent';\nimport { usePageCopyContent } from '../hooks/usePageCopyContent';",
  'photo copy hook import'
);
exact(
  'src/pages/PhotoProduction.tsx',
  `  const { content: pageContent, localize } = usePageCmsContent();\n  const [activeCategory`,
  `  const { content: pageContent, localize } = usePageCmsContent();\n  const { content: copyContent, byId: copyById } = usePageCopyContent();\n  const photoHero = copyById(copyContent.photo.hero, 'photo-hero')?.text;\n  const photoGalleryHeading = copyById(copyContent.photo.headings, 'photo-heading-gallery')?.text;\n  const [activeCategory`,
  'photo copy bindings'
);
exact('src/pages/PhotoProduction.tsx', `{isUk ? 'Професійна фотозйомка • Олександр Пітель' : 'Профессиональная фотосъемка • Александр Питель'}`, `{photoHero?.badge}`, 'photo hero badge');
exact('src/pages/PhotoProduction.tsx', `{isUk ? 'Бездоганні кадри для бізнесу, інтер\\'єрів та життя' : 'Безупречные кадры для бизнеса, интерьеров и жизни'}`, `{photoHero?.title}`, 'photo hero title');
exact(
  'src/pages/PhotoProduction.tsx',
  `{isUk \n                ? 'Від вивіреної геометрії розкішних апартаментів та апетитної фуд-зйомки ресторанів до щирого дитячого сміху і кінематографічних весіль. Повнокадрова оптика, мобільне світло та глибока кольорокорекція.'\n                : 'От выверенной геометрии роскошных апартаментов и аппетитной фуд-съемки ресторанов до искреннего детского смеха и кинематографичных свадеб. Полнокадровая оптика, мобильный свет и глубокая цветокоррекция.'\n              }`,
  `{photoHero?.description}`,
  'photo hero description'
);
exact('src/pages/PhotoProduction.tsx', `{isUk ? 'Дивитися галерею робіт' : 'Смотреть галерею работ'}`, `{photoHero?.meta1}`, 'photo hero primary CTA');
exact('src/pages/PhotoProduction.tsx', `{isUk ? 'Розрахувати вартість зйомки' : 'Рассчитать стоимость съемки'}`, `{photoHero?.meta2}`, 'photo hero secondary CTA');
exact('src/pages/PhotoProduction.tsx', `{isUk ? 'Вибрані фотороботи' : 'Избранные фотоработы'}`, `{photoGalleryHeading?.title}`, 'photo gallery title');
exact(
  'src/pages/PhotoProduction.tsx',
  `{isUk \n              ? 'Оберіть потрібний напрямок, щоб оцінити стиль кольорокорекції, роботу з композицією та деталізацію.'\n              : 'Выберите интересующее направление, чтобы оценить стиль цветокоррекции, работу с композицией и детализацию.'\n            }`,
  `{photoGalleryHeading?.description}`,
  'photo gallery description'
);

// ABOUT ---------------------------------------------------------------------
exact(
  'src/pages/About.tsx',
  "import { usePageCmsContent } from '../hooks/usePageCmsContent';",
  "import { usePageCmsContent } from '../hooks/usePageCmsContent';\nimport { usePageCopyContent } from '../hooks/usePageCopyContent';",
  'about copy hook import'
);
exact(
  'src/pages/About.tsx',
  `  const { content: pageContent, localize } = usePageCmsContent();`,
  `  const { content: pageContent, localize } = usePageCmsContent();\n  const { content: copyContent, byId: copyById } = usePageCopyContent();\n  const aboutPrinciplesHeading = copyById(copyContent.about.headings, 'about-heading-principles')?.text;\n  const aboutMilestonesHeading = copyById(copyContent.about.headings, 'about-heading-milestones')?.text;`,
  'about copy bindings'
);
exact('src/pages/About.tsx', `{isUk ? 'Принципи роботи студії Dneprfilm' : 'Принципы работы студии Dneprfilm'}`, `{aboutPrinciplesHeading?.title}`, 'about principles title');
exact('src/pages/About.tsx', `{isUk ? 'Історія розвитку' : 'История развития'}`, `{aboutMilestonesHeading?.title}`, 'about milestones title');

for (const path of touched) console.log(`Updated ${path}`);
for (const path of ['scripts/apply-page-copy-cms.mjs', '.github/workflows/apply-page-copy-cms.yml']) {
  if (fs.existsSync(path)) fs.unlinkSync(path);
}
console.log('Page copy CMS transform completed.');
