import type { Locale, CaseStudy } from '../types';
import { PAGE_ITEM_EN_BY_ID } from '../locales/pageEnglish';

const LEGACY_CONSTRUCTION_PREFIX = 'legacy-construction-';

type LocalizedLegacyCase = CaseStudy & {
  client_en?: string;
  videoBadge_en?: string;
};

/**
 * Portfolio migration v1 copied legacy construction records before the curated
 * Page CMS English fallback was applied. Keep already-migrated production
 * records fully English even before the v2 backfill is written to Firestore.
 */
export function localizeMigratedConstructionCase(item: CaseStudy, locale: Locale): CaseStudy {
  if (locale !== 'en' || !item.id.startsWith(LEGACY_CONSTRUCTION_PREFIX)) return item;

  const sourceId = item.id.slice(LEGACY_CONSTRUCTION_PREFIX.length);
  const english = PAGE_ITEM_EN_BY_ID[sourceId];
  if (!english) return item;

  const extended = item as LocalizedLegacyCase;
  return {
    ...item,
    title: item.title_en || english.title || item.title,
    client: extended.client_en || english.meta2 || item.client,
    categoryLabel: item.categoryLabel_en || english.meta1 || item.categoryLabel,
    description: item.description_en || english.description || item.description,
    challenge: item.challenge_en || english.subtitle || item.challenge,
    result: item.result_en || english.result || item.result,
    videoBadge: extended.videoBadge_en || english.meta3 || item.videoBadge,
  };
}
