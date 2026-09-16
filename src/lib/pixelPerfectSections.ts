import type { PageBuilderPage } from './pageBuilder';

export type PixelPerfectPage = Extract<PageBuilderPage, 'live' | 'video' | 'construction' | 'photo'>;

export interface PixelPerfectSectionDefinition {
  id: string;
  page: PixelPerfectPage;
  pageLabel: string;
  sectionIndex: number;
  label: string;
  description: string;
  interactive?: boolean;
}

export const PIXEL_PERFECT_SECTIONS: PixelPerfectSectionDefinition[] = [
  { id: 'live.hero', page: 'live', pageLabel: 'LIVE', sectionIndex: 1, label: 'LIVE · Hero', description: 'Исходный Hero Screen страницы LIVE.' },
  { id: 'live.formats', page: 'live', pageLabel: 'LIVE', sectionIndex: 2, label: 'LIVE · Форматы вещания', description: 'Исходная секция Four Core Formats.' },
  { id: 'live.engineering', page: 'live', pageLabel: 'LIVE', sectionIndex: 3, label: 'LIVE · Инженерия', description: 'Behind The Scenes / Engineering Mastery.' },
  { id: 'live.founder-quote', page: 'live', pageLabel: 'LIVE', sectionIndex: 4, label: 'LIVE · Цитата основателя', description: 'Исходная цитата Александра Пителя.' },
  { id: 'live.calculator', page: 'live', pageLabel: 'LIVE', sectionIndex: 5, label: 'LIVE · Калькулятор', description: 'Interactive Calculator / Instant Brief.' },
  { id: 'live.cases', page: 'live', pageLabel: 'LIVE', sectionIndex: 6, label: 'LIVE · Кейсы', description: 'Key LIVE Case Studies.' },
  { id: 'live.workflow', page: 'live', pageLabel: 'LIVE', sectionIndex: 7, label: 'LIVE · Регламент', description: 'Step-by-Step Workflow.' },
  { id: 'live.faq', page: 'live', pageLabel: 'LIVE', sectionIndex: 8, label: 'LIVE · FAQ', description: 'Исходный FAQ-аккордеон.' },
  { id: 'live.cta', page: 'live', pageLabel: 'LIVE', sectionIndex: 9, label: 'LIVE · Финальный CTA', description: 'Исходный финальный призыв к действию.' },

  { id: 'video.hero', page: 'video', pageLabel: 'VIDEO', sectionIndex: 1, label: 'VIDEO · Hero', description: 'Исходный Hero страницы видеопродакшна.' },
  { id: 'video.works', page: 'video', pageLabel: 'VIDEO', sectionIndex: 2, label: 'VIDEO · Работы', description: 'Showcased Real Works.' },
  { id: 'video.lifecycle', page: 'video', pageLabel: 'VIDEO', sectionIndex: 3, label: 'VIDEO · Этапы производства', description: 'Production Lifecycle.' },
  { id: 'video.calculator', page: 'video', pageLabel: 'VIDEO', sectionIndex: 4, label: 'VIDEO · Калькулятор', description: 'Interactive Price Calculator.' },
  { id: 'video.faq', page: 'video', pageLabel: 'VIDEO', sectionIndex: 5, label: 'VIDEO · FAQ', description: 'Исходный FAQ видеопродакшна.' },

  { id: 'construction.hero', page: 'construction', pageLabel: 'CONSTRUCTION', sectionIndex: 1, label: 'Construction · Hero', description: 'Исходный Hero Construction Media.' },
  { id: 'construction.benefits', page: 'construction', pageLabel: 'CONSTRUCTION', sectionIndex: 2, label: 'Construction · Преимущества', description: 'Three Key Benefits for Developer.' },
  { id: 'construction.solutions', page: 'construction', pageLabel: 'CONSTRUCTION', sectionIndex: 3, label: 'Construction · Media Solutions', description: 'Core Media Solutions.' },
  { id: 'construction.projects', page: 'construction', pageLabel: 'CONSTRUCTION', sectionIndex: 4, label: 'Construction · Объекты', description: 'Showcased Projects.' },
  { id: 'construction.calculator', page: 'construction', pageLabel: 'CONSTRUCTION', sectionIndex: 5, label: 'Construction · Калькулятор', description: 'Interactive Construction Calculator.' },
  { id: 'construction.workflow', page: 'construction', pageLabel: 'CONSTRUCTION', sectionIndex: 6, label: 'Construction · Workflow', description: 'Workflow & Protocol.' },
  { id: 'construction.faq', page: 'construction', pageLabel: 'CONSTRUCTION', sectionIndex: 7, label: 'Construction · FAQ', description: 'FAQ Accordion.' },
  { id: 'construction.cta', page: 'construction', pageLabel: 'CONSTRUCTION', sectionIndex: 8, label: 'Construction · CTA', description: 'Bottom Contact / CTA Banner.' },

  { id: 'photo.hero', page: 'photo', pageLabel: 'PHOTO', sectionIndex: 1, label: 'PHOTO · Hero', description: 'Исходный Hero страницы фотопродакшна.' },
  { id: 'photo.gallery', page: 'photo', pageLabel: 'PHOTO', sectionIndex: 2, label: 'PHOTO · Галерея', description: 'Gallery with Category Filter.' },
  { id: 'photo.standards', page: 'photo', pageLabel: 'PHOTO', sectionIndex: 3, label: 'PHOTO · Стандарты', description: 'Why Choose Us / Standards.' },
  { id: 'photo.pricing', page: 'photo', pageLabel: 'PHOTO', sectionIndex: 4, label: 'PHOTO · Пакеты', description: 'Исходная секция пакетов и тарифов.' },
  { id: 'photo.booking', page: 'photo', pageLabel: 'PHOTO', sectionIndex: 5, label: 'PHOTO · Booking Form', description: 'Исходная форма бронирования.' },
];

const BY_ID = new Map(PIXEL_PERFECT_SECTIONS.map(section => [section.id, section]));

export function pixelPerfectSectionById(id?: string): PixelPerfectSectionDefinition | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export function pixelPerfectSectionsForPage(page: PixelPerfectPage): PixelPerfectSectionDefinition[] {
  return PIXEL_PERFECT_SECTIONS.filter(section => section.page === page);
}
