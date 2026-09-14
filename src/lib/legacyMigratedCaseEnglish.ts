import type { Locale, CaseStudy } from '../types';

export const LEGACY_CONSTRUCTION_PREFIX = 'legacy-construction-';

export interface LegacyConstructionEnglishFields {
  title_en?: string;
  client_en?: string;
  categoryLabel_en?: string;
  description_en?: string;
  result_en?: string;
  videoBadge_en?: string;
}

const LEGACY_CONSTRUCTION_EN: Record<string, LegacyConstructionEnglishFields> = {
  'legacy-construction-case-riverside': {
    title_en: 'Construction Monitoring & 3D Panoramas — Riverside Residence',
    client_en: 'Grand House Development Group',
    categoryLabel_en: '24-storey comfort-class residential complex',
    description_en: 'Year-round monitoring of a 24-storey monolithic-frame complex using two autonomous 4K timelapse cameras on tower cranes, monthly GPS drone flights and virtual 3D panoramas from future apartment windows.',
    result_en: '+35% remote apartment sales during the structural stage, supported by interactive view panoramas.',
    videoBadge_en: '24 months of monitoring, from excavation to handover',
  },
  'legacy-construction-case-logistics': {
    title_en: 'West Gate Hub Logistics Complex',
    client_en: 'Logistics Capital Investment Group',
    categoryLabel_en: 'Class A industrial & warehouse park (35,000 m²)',
    description_en: 'Video audit of steel erection, sandwich-panel installation and concrete flooring, with progress tracking for the bank’s credit committee.',
    result_en: 'Full transparency for the financing bank and anchor tenants attracted before commissioning.',
    videoBadge_en: '14 months of active construction',
  },
  'legacy-construction-case-cottage': {
    title_en: 'Green Hills Gated Cottage Community',
    client_en: 'Green Hills Development',
    categoryLabel_en: 'Premium community: 42 homes plus infrastructure',
    description_en: 'Media coverage of utilities, road construction and villa development, plus landscaping and amenity visualization for the premium sales team.',
    result_en: 'The first phase sold out within six months of the advertising campaign launch.',
    videoBadge_en: '18 months',
  },
};

type LocalizedLegacyCase = CaseStudy & LegacyConstructionEnglishFields;

export function getLegacyConstructionEnglishFields(id: string): LegacyConstructionEnglishFields | null {
  return LEGACY_CONSTRUCTION_EN[id] || null;
}

/**
 * Portfolio migration v1 copied legacy construction records before curated
 * English fields were persisted. Keep those production records fully English
 * immediately, while migration v2 backfills the same values into Firestore.
 */
export function localizeMigratedConstructionCase(item: CaseStudy, locale: Locale): CaseStudy {
  if (locale !== 'en' || !item.id.startsWith(LEGACY_CONSTRUCTION_PREFIX)) return item;

  const english = getLegacyConstructionEnglishFields(item.id);
  if (!english) return item;

  const extended = item as LocalizedLegacyCase;
  return {
    ...item,
    title: item.title_en || english.title_en || item.title,
    client: extended.client_en || english.client_en || item.client,
    categoryLabel: item.categoryLabel_en || english.categoryLabel_en || item.categoryLabel,
    description: item.description_en || english.description_en || item.description,
    result: item.result_en || english.result_en || item.result,
    videoBadge: extended.videoBadge_en || english.videoBadge_en || item.videoBadge,
  };
}
