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

function chooseItems(stored: PageContentItem[] | undefined, fallback: PageContentItem[]): PageContentItem[] {
  return Array.isArray(stored) ? stored : fallback;
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
    sortPageItems(items).map(item => ({ ...item, text: getPageItemText(item, locale) }));

  return { content, locale, localize };
}
