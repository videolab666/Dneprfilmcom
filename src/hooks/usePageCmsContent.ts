import { useMemo } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import {
  DEFAULT_PAGE_CONTENT,
  PageContent,
  PageContentItem,
  PageItemText,
  getPageItemText,
  sortPageItems,
} from '../data/pageContent';

export interface LocalizedPageContentItem extends PageContentItem {
  text: PageItemText;
}

const CYRILLIC_RE = /[А-Яа-яЁёІіЇїЄєҐґ]/;

function chooseItems(stored: PageContentItem[] | undefined, fallback: PageContentItem[]): PageContentItem[] {
  return Array.isArray(stored) ? stored : fallback;
}

function englishText(item: PageContentItem): PageItemText {
  const fallback = getPageItemText({ ...item, en: undefined }, 'en');
  const explicit = item.en;
  if (!explicit) return fallback;

  const result: PageItemText = { ...fallback };

  for (const [key, value] of Object.entries(explicit) as [keyof PageItemText, PageItemText[keyof PageItemText]][]) {
    if (typeof value === 'string') {
      if (value.trim() && !CYRILLIC_RE.test(value)) {
        (result as Record<string, unknown>)[key] = value;
      }
      continue;
    }

    if (Array.isArray(value) && value.length && value.every(entry => !CYRILLIC_RE.test(entry))) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

export function usePageCmsContent() {
  const { rawSettings, locale } = useSiteContent();

  const content = useMemo<PageContent>(() => {
    const stored = (rawSettings as typeof rawSettings & { pageContent?: Partial<PageContent> }).pageContent;
    return {
      video: {
        works: chooseItems(stored?.video?.works, DEFAULT_PAGE_CONTENT.video.works),
        steps: chooseItems(stored?.video?.steps, DEFAULT_PAGE_CONTENT.video.steps),
      },
      construction: {
        works: chooseItems(stored?.construction?.works, DEFAULT_PAGE_CONTENT.construction.works),
      },
      photo: {
        gallery: chooseItems(stored?.photo?.gallery, DEFAULT_PAGE_CONTENT.photo.gallery),
        packages: chooseItems(stored?.photo?.packages, DEFAULT_PAGE_CONTENT.photo.packages),
      },
      about: {
        milestones: chooseItems(stored?.about?.milestones, DEFAULT_PAGE_CONTENT.about.milestones),
        principles: chooseItems(stored?.about?.principles, DEFAULT_PAGE_CONTENT.about.principles),
      },
    };
  }, [rawSettings]);

  const localize = (items: PageContentItem[]): LocalizedPageContentItem[] =>
    sortPageItems(items).map(item => ({
      ...item,
      text: locale === 'en' ? englishText(item) : getPageItemText(item, locale),
    }));

  return { content, locale, localize };
}
