import type { Locale, SiteSetting } from '../types';

export type SeoEntry = Record<Locale, { title: string; description: string }>;

export const STATIC_SEO: Record<string, SeoEntry> = {
  '/': {
    uk: { title: 'Dneprfilm — відеопродакшн і прямі трансляції', description: 'Відеопродакшн повного циклу, багатокамерні прямі трансляції, фотографія та медіасупровід будівництва в Україні.' },
    ru: { title: 'Dneprfilm — видеопродакшн и прямые трансляции', description: 'Видеопродакшн полного цикла, многокамерные прямые трансляции, фотография и медиасопровождение строительства в Украине.' },
    en: { title: 'Dneprfilm — video production and live broadcasting', description: 'Full-cycle video production, multi-camera live broadcasting, photography and construction media services in Ukraine.' },
  },
  '/live': {
    uk: { title: 'Прямі трансляції та мобільна ПТС — Dneprfilm', description: 'Багатокамерні прямі трансляції спортивних подій, конференцій і шоу з мобільною ПТС, резервуванням живлення та інтернету.' },
    ru: { title: 'Прямые трансляции и мобильная ПТС — Dneprfilm', description: 'Многокамерные прямые трансляции спортивных событий, конференций и шоу с мобильной ПТС, резервированием питания и интернета.' },
    en: { title: 'Live broadcasting and mobile TV production — Dneprfilm', description: 'Multi-camera live production for sports, conferences and shows with a mobile production unit and redundant power and connectivity.' },
  },
  '/video': {
    uk: { title: 'Відеопродакшн для бізнесу — Dneprfilm', description: 'Рекламні ролики, іміджеві фільми, промислова зйомка, контент для виставок і соцмереж: від сценарію до фінального мастера.' },
    ru: { title: 'Видеопродакшн для бизнеса — Dneprfilm', description: 'Рекламные ролики, имиджевые фильмы, промышленная съемка, контент для выставок и соцсетей: от сценария до финального мастера.' },
    en: { title: 'Business video production — Dneprfilm', description: 'Commercials, corporate films, industrial video and exhibition content from concept and filming to final master delivery.' },
  },
  '/videos': {
    uk: { title: 'Відеопортфоліо — Dneprfilm', description: 'Добірка відеопроєктів Dneprfilm: рекламні ролики, корпоративне відео, спорт, події, Reels та інші формати.' },
    ru: { title: 'Видеопортфолио — Dneprfilm', description: 'Подборка видеопроектов Dneprfilm: рекламные ролики, корпоративное видео, спорт, события, Reels и другие форматы.' },
    en: { title: 'Video portfolio — Dneprfilm', description: 'Selected Dneprfilm video projects including commercials, corporate films, sports, events, Reels and other formats.' },
  },
  '/construction': {
    uk: { title: 'Construction Media і 4K таймлапс — Dneprfilm', description: '4K таймлапс будівництва 24/7, GPS-аерозйомка, 3D-панорами, відеозвіти для девелоперів, інвесторів і банків.' },
    ru: { title: 'Construction Media и 4K таймлапс — Dneprfilm', description: '4K таймлапс строительства 24/7, GPS-аэросъемка, 3D-панорамы, видеоотчеты для девелоперов, инвесторов и банков.' },
    en: { title: 'Construction media and 4K timelapse — Dneprfilm', description: '24/7 construction timelapse, GPS drone monitoring, 3D panoramas and progress video reports for developers, investors and banks.' },
  },
  '/photo': {
    uk: { title: 'Професійна фотозйомка — Dneprfilm', description: 'Інтер’єри, архітектура, фуд-зйомка, бізнес-репортажі, події та весілля з професійним світлом і ретушшю.' },
    ru: { title: 'Профессиональная фотосъемка — Dneprfilm', description: 'Интерьеры, архитектура, фуд-съемка, бизнес-репортажи, события и свадьбы с профессиональным светом и ретушью.' },
    en: { title: 'Professional photography — Dneprfilm', description: 'Interior, architecture, food, corporate, event and wedding photography with professional lighting and post-production.' },
  },
  '/galleries': {
    uk: { title: 'Фотогалереї — Dneprfilm', description: 'Повні фотогалереї Dneprfilm: інтер’єри, архітектура, події, бізнес-репортажі, спорт та інші фотопроєкти.' },
    ru: { title: 'Фотогалереи — Dneprfilm', description: 'Полные фотогалереи Dneprfilm: интерьеры, архитектура, события, бизнес-репортажи, спорт и другие фотопроекты.' },
    en: { title: 'Photo galleries — Dneprfilm', description: 'Complete Dneprfilm photo galleries covering interiors, architecture, events, corporate reportage, sports and other projects.' },
  },
  '/cases': {
    uk: { title: 'Кейси та портфоліо — Dneprfilm', description: 'Реалізовані проєкти Dneprfilm у відеопродакшні, прямих трансляціях, фотографії та медіасупроводі бізнесу.' },
    ru: { title: 'Кейсы и портфолио — Dneprfilm', description: 'Реализованные проекты Dneprfilm в видеопродакшне, прямых трансляциях, фотографии и медиасопровождении бизнеса.' },
    en: { title: 'Case studies and portfolio — Dneprfilm', description: 'Selected Dneprfilm projects in video production, live broadcasting, photography and business media services.' },
  },
  '/media-center': {
    uk: { title: 'Медіацентр — Dneprfilm', description: 'Статті, новини та практичні матеріали Dneprfilm про відеопродакшн, трансляції, техніку та медіавиробництво.' },
    ru: { title: 'Медиацентр — Dneprfilm', description: 'Статьи, новости и практические материалы Dneprfilm о видеопродакшне, трансляциях, технике и медиапроизводстве.' },
    en: { title: 'Media center — Dneprfilm', description: 'Dneprfilm articles and practical notes about video production, live broadcasting, equipment and media workflows.' },
  },
  '/about': {
    uk: { title: 'Про Dneprfilm та Олександра Пітеля', description: 'Історія Dneprfilm, принципи роботи студії та досвід засновника і генерального продюсера Олександра Пітеля.' },
    ru: { title: 'О Dneprfilm и Александре Пителе', description: 'История Dneprfilm, принципы работы студии и опыт основателя и генерального продюсера Александра Пителя.' },
    en: { title: 'About Dneprfilm and Oleksandr Pitel', description: 'The Dneprfilm story, studio principles and the experience of founder and executive producer Oleksandr Pitel.' },
  },
  '/contacts': {
    uk: { title: 'Контакти — Dneprfilm', description: 'Зв’яжіться з Dneprfilm для розрахунку відеозйомки, прямої трансляції, фотозйомки або комплексного медіапроєкту.' },
    ru: { title: 'Контакты — Dneprfilm', description: 'Свяжитесь с Dneprfilm для расчета видеосъемки, прямой трансляции, фотосъемки или комплексного медиапроекта.' },
    en: { title: 'Contacts — Dneprfilm', description: 'Contact Dneprfilm for a quote on video production, live broadcasting, photography or a complete media project.' },
  },
};

export const NOT_FOUND_SEO: SeoEntry = {
  uk: { title: '404 — Сторінку не знайдено | Dneprfilm', description: 'Запитану сторінку Dneprfilm не знайдено.' },
  ru: { title: '404 — Страница не найдена | Dneprfilm', description: 'Запрошенная страница Dneprfilm не найдена.' },
  en: { title: '404 — Page not found | Dneprfilm', description: 'The requested Dneprfilm page could not be found.' },
};

export type DynamicPortfolioType = 'case' | 'gallery' | 'video';

export function dynamicPortfolioTypeForPath(path: string): DynamicPortfolioType | null {
  if (/^\/cases\/[^/]+\/?$/.test(path)) return 'case';
  if (/^\/galleries\/[^/]+\/?$/.test(path)) return 'gallery';
  if (/^\/videos\/[^/]+\/?$/.test(path)) return 'video';
  return null;
}

export function normalizeRoutePath(path: string): string {
  if (!path || path === '/') return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

export function configuredSiteBaseUrl(): string {
  const configured = typeof import.meta !== 'undefined'
    ? String(import.meta.env?.VITE_SITE_URL || '').trim().replace(/\/+$/, '')
    : '';
  if (configured) return configured;
  if (typeof window === 'undefined') return '';
  const basePath = String(import.meta.env?.BASE_URL || '/').replace(/\/+$/, '');
  return `${window.location.origin}${basePath}`.replace(/\/+$/, '');
}

export function canonicalUrlForPath(path: string): string {
  const base = configuredSiteBaseUrl();
  const normalized = normalizeRoutePath(path);
  return normalized === '/' ? `${base}/` : `${base}${normalized}`;
}

export function toIsoDate(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const date = typeof value === 'number'
    ? new Date(value)
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00Z`)
      : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
  if (typeof document === 'undefined') return;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function upsertCanonical(url: string) {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

export function removeCanonical() {
  if (typeof document === 'undefined') return;
  document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.remove();
}

export function removeMeta(selector: string) {
  if (typeof document === 'undefined') return;
  document.head.querySelector<HTMLMetaElement>(selector)?.remove();
}

export function upsertJsonLd(id: string, value: unknown) {
  if (typeof document === 'undefined') return;
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(value).replace(/</g, '\\u003c');
}

export function removeJsonLd(id: string) {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.remove();
}

export function organizationJsonLd(settings: SiteSetting, locale: Locale): Record<string, unknown> {
  const siteUrl = canonicalUrlForPath('/').replace(/\/$/, '');
  const name = locale === 'uk'
    ? settings.studioName_uk || settings.studioName || 'Dneprfilm'
    : locale === 'en'
      ? settings.studioName_en || settings.studioName_uk || settings.studioName || 'Dneprfilm'
      : settings.studioName || settings.studioName_uk || 'Dneprfilm';
  const address = locale === 'uk'
    ? settings.address_uk || settings.address
    : locale === 'en'
      ? settings.address_en || settings.address_uk || settings.address
      : settings.address || settings.address_uk;
  const sameAs = [settings.youtubeUrl, settings.instagramUrl, settings.facebookUrl].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name,
    url: `${siteUrl}/`,
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(address ? { address: { '@type': 'PostalAddress', streetAddress: address, addressCountry: 'UA' } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrlForPath(item.path),
    })),
  };
}

export interface DetailSeoOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  ogType?: string;
  datePublished?: number | string;
  dateModified?: number | string;
  allowVideoPreview?: boolean;
  jsonLd?: unknown;
}

export function applyDetailSeo(options: DetailSeoOptions): () => void {
  const description = options.description.trim().slice(0, 220);
  const canonical = canonicalUrlForPath(options.path);
  const published = toIsoDate(options.datePublished);
  const modified = toIsoDate(options.dateModified);

  document.title = options.title;
  upsertMeta('meta[name="description"]', { name: 'description' }, description);
  upsertMeta('meta[name="robots"]', { name: 'robots' }, options.allowVideoPreview
    ? 'index, follow, max-image-preview:large, max-video-preview:-1'
    : 'index, follow, max-image-preview:large');
  upsertMeta('meta[property="og:title"]', { property: 'og:title' }, options.title);
  upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
  upsertMeta('meta[property="og:type"]', { property: 'og:type' }, options.ogType || 'article');
  upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonical);
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, options.title);
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
  upsertCanonical(canonical);

  if (options.image) {
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, options.image);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, options.image);
    if (options.imageAlt) {
      upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, options.imageAlt);
      upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, options.imageAlt);
    }
  } else {
    removeMeta('meta[property="og:image"]');
    removeMeta('meta[name="twitter:image"]');
    removeMeta('meta[property="og:image:alt"]');
    removeMeta('meta[name="twitter:image:alt"]');
  }

  if (published) upsertMeta('meta[property="article:published_time"]', { property: 'article:published_time' }, published);
  else removeMeta('meta[property="article:published_time"]');
  if (modified) upsertMeta('meta[property="article:modified_time"]', { property: 'article:modified_time' }, modified);
  else removeMeta('meta[property="article:modified_time"]');

  if (options.jsonLd) upsertJsonLd('detail-seo-jsonld', options.jsonLd);
  else removeJsonLd('detail-seo-jsonld');

  return () => {
    removeMeta('meta[property="article:published_time"]');
    removeMeta('meta[property="article:modified_time"]');
    removeMeta('meta[property="og:image:alt"]');
    removeMeta('meta[name="twitter:image:alt"]');
    removeJsonLd('detail-seo-jsonld');
  };
}
