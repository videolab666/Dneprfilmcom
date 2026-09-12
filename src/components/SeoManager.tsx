import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext';
import type { Locale } from '../types';

type SeoEntry = Record<Locale, { title: string; description: string }>;

const SEO: Record<string, SeoEntry> = {
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

function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

export function SeoManager() {
  const location = useLocation();
  const { locale } = useSiteContent();

  useEffect(() => {
    const path = location.pathname === '' ? '/' : location.pathname.replace(/\/$/, '') || '/';
    const isAdmin = path === '/admin' || path.startsWith('/admin/');
    const entry = SEO[path]?.[locale] ?? SEO['/'][locale];
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, '') || `${window.location.origin}/`;

    document.title = isAdmin ? `Admin — Dneprfilm` : entry.title;

    upsertMeta('meta[name="description"]', { name: 'description' }, isAdmin ? 'Dneprfilm administration panel.' : entry.description);
    upsertMeta('meta[name="robots"]', { name: 'robots' }, isAdmin ? 'noindex, nofollow, noarchive' : 'index, follow, max-image-preview:large');
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, isAdmin ? 'Admin — Dneprfilm' : entry.title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, isAdmin ? 'Dneprfilm administration panel.' : entry.description);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, 'Dneprfilm');
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, locale === 'uk' ? 'uk_UA' : locale === 'ru' ? 'ru_UA' : 'en_US');
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, isAdmin ? 'Admin — Dneprfilm' : entry.title);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, isAdmin ? 'Dneprfilm administration panel.' : entry.description);

    if (!isAdmin) {
      upsertCanonical(canonicalUrl);
    } else {
      document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.remove();
    }
  }, [location.pathname, locale]);

  return null;
}
