import { useMemo } from 'react';
import { useSiteContent } from '../context/SiteContentContext';
import { DEFAULT_PAGE_COPY_CONTENT, PageCopyContent } from '../data/pageCopyContent';
import { PageContentItem, getPageItemText, sortPageItems } from '../data/pageContent';

export interface LocalizedCopyItem extends PageContentItem {
  text: ReturnType<typeof getPageItemText>;
}

function items(stored: PageContentItem[] | undefined, fallback: PageContentItem[]) {
  return Array.isArray(stored) ? stored : fallback;
}

export function usePageCopyContent() {
  const { rawSettings, locale } = useSiteContent();

  const content = useMemo<PageCopyContent>(() => {
    const stored = (rawSettings as typeof rawSettings & { pageCopyContent?: Partial<PageCopyContent> }).pageCopyContent;
    return {
      video: {
        hero: items(stored?.video?.hero, DEFAULT_PAGE_COPY_CONTENT.video.hero),
        headings: items(stored?.video?.headings, DEFAULT_PAGE_COPY_CONTENT.video.headings),
        faqs: items(stored?.video?.faqs, DEFAULT_PAGE_COPY_CONTENT.video.faqs),
      },
      construction: {
        hero: items(stored?.construction?.hero, DEFAULT_PAGE_COPY_CONTENT.construction.hero),
        headings: items(stored?.construction?.headings, DEFAULT_PAGE_COPY_CONTENT.construction.headings),
        solutions: items(stored?.construction?.solutions, DEFAULT_PAGE_COPY_CONTENT.construction.solutions),
        workflow: items(stored?.construction?.workflow, DEFAULT_PAGE_COPY_CONTENT.construction.workflow),
        faqs: items(stored?.construction?.faqs, DEFAULT_PAGE_COPY_CONTENT.construction.faqs),
      },
      photo: {
        hero: items(stored?.photo?.hero, DEFAULT_PAGE_COPY_CONTENT.photo.hero),
        headings: items(stored?.photo?.headings, DEFAULT_PAGE_COPY_CONTENT.photo.headings),
      },
      about: {
        headings: items(stored?.about?.headings, DEFAULT_PAGE_COPY_CONTENT.about.headings),
      },
    };
  }, [rawSettings]);

  const localize = (source: PageContentItem[]): LocalizedCopyItem[] =>
    sortPageItems(source).map(item => ({ ...item, text: getPageItemText(item, locale) }));

  const byId = (source: PageContentItem[], id: string): LocalizedCopyItem | undefined =>
    localize(source).find(item => item.id === id);

  return { content, locale, localize, byId };
}
