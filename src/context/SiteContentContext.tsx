import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SiteSetting, SiteBlock, CaseStudy, Testimonial, BackstageItem, Locale } from '../types';
import { 
  DEFAULT_SITE_SETTINGS, 
  DEFAULT_SITE_SETTINGS_UK, 
  DEFAULT_SITE_SETTINGS_EN,
  DEFAULT_SITE_BLOCKS, 
  DEFAULT_SITE_BLOCKS_UK 
} from '../lib/cmsDefaults';
import { TRANSLATIONS } from '../locales/translations';
import { legacyText, legacyValue, translateEnglishValue } from '../locales/legacyEnglish';
import { normalizeFullPageCms, resolveEditableCopy, resolveEditableLegacy, translationOverrideKey } from '../lib/fullPageEditing';
import { DEFAULT_SITE_BLOCKS_EN } from '../locales/siteBlocksEn';
import { 
  CASE_TRANSLATIONS_UK, 
  TESTIMONIALS_TRANSLATIONS_UK, 
  BACKSTAGE_TRANSLATIONS_UK 
} from '../locales/localizedContent';
import {
  CASE_TRANSLATIONS_EN,
  TESTIMONIALS_TRANSLATIONS_EN,
  BACKSTAGE_TRANSLATIONS_EN
} from '../locales/localizedContentEn';
import { BACKSTAGE_SEED_EN } from '../locales/backstageSeedEn';
import { localizeMigratedConstructionCase } from '../lib/legacyMigratedCaseEnglish';

interface SiteContentContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  l: (uk: string, ru: string, en?: string) => string;
  legacy: <T>(uk: T, ru: T) => T;
  isUk: boolean;
  isEn: boolean;
  isRu: boolean;
  settings: SiteSetting;
  rawSettings: SiteSetting;
  blocks: SiteBlock[];
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSetting>) => Promise<void>;
  saveBlock: (block: SiteBlock) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  toggleBlockActive: (blockId: string, isActive: boolean) => Promise<void>;
  reorderBlock: (blockId: string, direction: 'up' | 'down') => Promise<void>;
  resetToDefaults: () => Promise<void>;
  getLocalizedCase: (item: CaseStudy) => CaseStudy;
  getLocalizedTestimonial: (item: Testimonial) => Testimonial;
  getLocalizedBackstageItem: (item: BackstageItem) => BackstageItem;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export function SiteContentProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const requested = new URLSearchParams(window.location.search).get('lang');
      if (requested === 'ru' || requested === 'uk' || requested === 'en') {
        return requested;
      }
      const saved = localStorage.getItem('dneprfilm_locale');
      if (saved === 'ru' || saved === 'uk' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'uk'; // Default to Ukrainian as requested
  });

  const [rawSettings, setRawSettings] = useState<SiteSetting>(DEFAULT_SITE_SETTINGS);
  const [blocks, setBlocks] = useState<SiteBlock[]>(DEFAULT_SITE_BLOCKS);
  const [loading, setLoading] = useState(true);
  const fullPageCms = useMemo(() => normalizeFullPageCms(rawSettings.fullPageCms), [rawSettings.fullPageCms]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('dneprfilm_locale', newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
    } catch {
      // ignore
    }
  }, [locale]);

  // Translation function
  const t = (key: string, fallback?: string): string => {
    const override = fullPageCms.copyOverrides[translationOverrideKey(key)]?.[locale];
    if (typeof override === 'string') return override;
    const activeDict = TRANSLATIONS[locale] || TRANSLATIONS.uk;
    if (activeDict && activeDict[key]) {
      return activeDict[key];
    }
    // Fallback to UK, then RU dictionary
    if (TRANSLATIONS.uk && TRANSLATIONS.uk[key]) {
      return TRANSLATIONS.uk[key];
    }
    if (TRANSLATIONS.ru && TRANSLATIONS.ru[key]) {
      return TRANSLATIONS.ru[key];
    }
    return fallback ?? key;
  };

  const l = (uk: string, ru: string, en?: string): string => resolveEditableCopy(locale, uk, ru, en, fullPageCms.copyOverrides);
  const legacy = <T,>(uk: T, ru: T): T => resolveEditableLegacy(locale, uk, ru, fullPageCms.copyOverrides);

  const isUk = locale === 'uk';
  const isEn = locale === 'en';
  const isRu = locale === 'ru';

  useEffect(() => {
    // 1. Subscribe to site_settings/global
    const settingsDocRef = doc(db, 'site_settings', 'global');
    const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setRawSettings({ ...DEFAULT_SITE_SETTINGS, ...docSnap.data() } as SiteSetting);
      } else {
        setRawSettings(DEFAULT_SITE_SETTINGS);
      }
    }, (err) => {
      console.warn('Could not load site_settings from firestore, using defaults:', err.message);
      setRawSettings(DEFAULT_SITE_SETTINGS);
    });

    // 2. Subscribe to site_blocks
    const blocksColRef = collection(db, 'site_blocks');
    const unsubscribeBlocks = onSnapshot(blocksColRef, (querySnap) => {
      if (!querySnap.empty) {
        const fetchedBlocks = querySnap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as SiteBlock[];
        fetchedBlocks.sort((a, b) => (a.order || 0) - (b.order || 0));
        setBlocks(fetchedBlocks);
      } else {
        setBlocks(DEFAULT_SITE_BLOCKS);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Could not load site_blocks from firestore, using defaults:', err.message);
      setBlocks(DEFAULT_SITE_BLOCKS);
      setLoading(false);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeBlocks();
    };
  }, []);

  // Compute localized settings dynamically
  const settings = useMemo<SiteSetting>(() => {
    if (locale === 'en') {
      return {
        ...rawSettings,
        studioName: rawSettings.studioName_en || rawSettings.studioName,
        address: rawSettings.address_en || 
          (rawSettings.address === DEFAULT_SITE_SETTINGS.address ? DEFAULT_SITE_SETTINGS_EN.address : rawSettings.address),
        workingHours: rawSettings.workingHours_en || 
          (rawSettings.workingHours === DEFAULT_SITE_SETTINGS.workingHours ? DEFAULT_SITE_SETTINGS_EN.workingHours : rawSettings.workingHours),
        heroBadge: rawSettings.heroBadge_en || 
          (rawSettings.heroBadge === DEFAULT_SITE_SETTINGS.heroBadge ? DEFAULT_SITE_SETTINGS_EN.heroBadge : rawSettings.heroBadge),
        heroTitle: rawSettings.heroTitle_en || 
          (rawSettings.heroTitle === DEFAULT_SITE_SETTINGS.heroTitle ? DEFAULT_SITE_SETTINGS_EN.heroTitle : rawSettings.heroTitle),
        heroSubtitle: rawSettings.heroSubtitle_en || 
          (rawSettings.heroSubtitle === DEFAULT_SITE_SETTINGS.heroSubtitle ? DEFAULT_SITE_SETTINGS_EN.heroSubtitle : rawSettings.heroSubtitle),
        heroCtaPrimaryText: rawSettings.heroCtaPrimaryText_en || 
          (rawSettings.heroCtaPrimaryText === DEFAULT_SITE_SETTINGS.heroCtaPrimaryText ? DEFAULT_SITE_SETTINGS_EN.heroCtaPrimaryText : rawSettings.heroCtaPrimaryText),
        heroCtaSecondaryText: rawSettings.heroCtaSecondaryText_en || 
          (rawSettings.heroCtaSecondaryText === DEFAULT_SITE_SETTINGS.heroCtaSecondaryText ? DEFAULT_SITE_SETTINGS_EN.heroCtaSecondaryText : rawSettings.heroCtaSecondaryText),
        founderName: rawSettings.founderName_en || 
          (rawSettings.founderName === DEFAULT_SITE_SETTINGS.founderName ? DEFAULT_SITE_SETTINGS_EN.founderName : rawSettings.founderName),
        founderRole: rawSettings.founderRole_en || 
          (rawSettings.founderRole === DEFAULT_SITE_SETTINGS.founderRole ? DEFAULT_SITE_SETTINGS_EN.founderRole : rawSettings.founderRole),
        founderQuote: rawSettings.founderQuote_en || 
          (rawSettings.founderQuote === DEFAULT_SITE_SETTINGS.founderQuote ? DEFAULT_SITE_SETTINGS_EN.founderQuote : rawSettings.founderQuote),
        founderBio: rawSettings.founderBio_en || 
          (rawSettings.founderBio === DEFAULT_SITE_SETTINGS.founderBio ? DEFAULT_SITE_SETTINGS_EN.founderBio : rawSettings.founderBio),
        announcementText: rawSettings.announcementText_en || 
          (rawSettings.announcementText === DEFAULT_SITE_SETTINGS.announcementText ? DEFAULT_SITE_SETTINGS_EN.announcementText : rawSettings.announcementText),
      };
    }

    if (locale === 'uk') {
      // For Ukrainian: use custom _uk fields if provided, or default uk settings when matches default RU
      return {
        ...rawSettings,
        studioName: rawSettings.studioName_uk || rawSettings.studioName,
        address: rawSettings.address_uk || 
          (rawSettings.address === DEFAULT_SITE_SETTINGS.address ? DEFAULT_SITE_SETTINGS_UK.address : rawSettings.address),
        workingHours: rawSettings.workingHours_uk || 
          (rawSettings.workingHours === DEFAULT_SITE_SETTINGS.workingHours ? DEFAULT_SITE_SETTINGS_UK.workingHours : rawSettings.workingHours),
        heroBadge: rawSettings.heroBadge_uk || 
          (rawSettings.heroBadge === DEFAULT_SITE_SETTINGS.heroBadge ? DEFAULT_SITE_SETTINGS_UK.heroBadge : rawSettings.heroBadge),
        heroTitle: rawSettings.heroTitle_uk || 
          (rawSettings.heroTitle === DEFAULT_SITE_SETTINGS.heroTitle ? DEFAULT_SITE_SETTINGS_UK.heroTitle : rawSettings.heroTitle),
        heroSubtitle: rawSettings.heroSubtitle_uk || 
          (rawSettings.heroSubtitle === DEFAULT_SITE_SETTINGS.heroSubtitle ? DEFAULT_SITE_SETTINGS_UK.heroSubtitle : rawSettings.heroSubtitle),
        heroCtaPrimaryText: rawSettings.heroCtaPrimaryText_uk || 
          (rawSettings.heroCtaPrimaryText === DEFAULT_SITE_SETTINGS.heroCtaPrimaryText ? DEFAULT_SITE_SETTINGS_UK.heroCtaPrimaryText : rawSettings.heroCtaPrimaryText),
        heroCtaSecondaryText: rawSettings.heroCtaSecondaryText_uk || 
          (rawSettings.heroCtaSecondaryText === DEFAULT_SITE_SETTINGS.heroCtaSecondaryText ? DEFAULT_SITE_SETTINGS_UK.heroCtaSecondaryText : rawSettings.heroCtaSecondaryText),
        founderName: rawSettings.founderName_uk || 
          (rawSettings.founderName === DEFAULT_SITE_SETTINGS.founderName ? DEFAULT_SITE_SETTINGS_UK.founderName : rawSettings.founderName),
        founderRole: rawSettings.founderRole_uk || 
          (rawSettings.founderRole === DEFAULT_SITE_SETTINGS.founderRole ? DEFAULT_SITE_SETTINGS_UK.founderRole : rawSettings.founderRole),
        founderQuote: rawSettings.founderQuote_uk || 
          (rawSettings.founderQuote === DEFAULT_SITE_SETTINGS.founderQuote ? DEFAULT_SITE_SETTINGS_UK.founderQuote : rawSettings.founderQuote),
        founderBio: rawSettings.founderBio_uk || 
          (rawSettings.founderBio === DEFAULT_SITE_SETTINGS.founderBio ? DEFAULT_SITE_SETTINGS_UK.founderBio : rawSettings.founderBio),
        announcementText: rawSettings.announcementText_uk || 
          (rawSettings.announcementText === DEFAULT_SITE_SETTINGS.announcementText ? DEFAULT_SITE_SETTINGS_UK.announcementText : rawSettings.announcementText),
      };
    }

    return rawSettings;
  }, [rawSettings, locale]);

  // Compute localized blocks dynamically
  const localizedBlocks = useMemo<SiteBlock[]>(() => {
    if (locale === 'en') {
    const ukDefaultsMap = new Map(DEFAULT_SITE_BLOCKS_UK.map(b => [b.id, b]));
    const enDefaultsMap = new Map(DEFAULT_SITE_BLOCKS_EN.map(b => [b.id, b]));

    return blocks.map(block => {
      const ukDefault = ukDefaultsMap.get(block.id);
      const enDefault = enDefaultsMap.get(block.id);
      const customUk = block.config_uk;
      const hasCustomUk = Boolean(customUk || block.title_uk);

      const ukConfig = {
        ...block.config,
        badge: customUk?.badge || ukDefault?.config.badge || block.config.badge,
        heading: customUk?.heading || ukDefault?.config.heading || block.config.heading,
        subheading: customUk?.subheading || ukDefault?.config.subheading || block.config.subheading,
        content: customUk?.content || ukDefault?.config.content || block.config.content,
        buttonText: customUk?.buttonText || ukDefault?.config.buttonText || block.config.buttonText,
        secondaryButtonText: customUk?.secondaryButtonText || ukDefault?.config.secondaryButtonText || block.config.secondaryButtonText,
        items: customUk?.items || ukDefault?.config.items || block.config.items,
        faqItems: customUk?.faqItems || ukDefault?.config.faqItems || block.config.faqItems,
      };

      const fallbackConfig = hasCustomUk
        ? translateEnglishValue(ukConfig)
        : (enDefault?.config || translateEnglishValue(ukConfig));

      const fallbackTitle = hasCustomUk
        ? translateEnglishValue(block.title_uk || ukDefault?.title || block.title)
        : (enDefault?.title || translateEnglishValue(block.title_uk || ukDefault?.title || block.title));

      return {
        ...block,
        title: block.title_en || fallbackTitle,
        config: {
          ...fallbackConfig,
          ...(block.config_en || {}),
        },
      };
    });
  }

    if (locale === 'uk') {
      const ukDefaultsMap = new Map(DEFAULT_SITE_BLOCKS_UK.map(b => [b.id, b]));

      return blocks.map(block => {
        const ukDefault = ukDefaultsMap.get(block.id);
        const customUk = block.config_uk;
        if (customUk || ukDefault) {
          return {
            ...block,
            title: block.title_uk || ukDefault?.title || block.title,
            config: {
              ...block.config,
              badge: customUk?.badge || ukDefault?.config.badge || block.config.badge,
              heading: customUk?.heading || ukDefault?.config.heading || block.config.heading,
              subheading: customUk?.subheading || ukDefault?.config.subheading || block.config.subheading,
              content: customUk?.content || ukDefault?.config.content || block.config.content,
              buttonText: customUk?.buttonText || ukDefault?.config.buttonText || block.config.buttonText,
              secondaryButtonText: customUk?.secondaryButtonText || ukDefault?.config.secondaryButtonText || block.config.secondaryButtonText,
              items: customUk?.items || ukDefault?.config.items || block.config.items,
              faqItems: customUk?.faqItems || ukDefault?.config.faqItems || block.config.faqItems,
            }
          };
        }
        return block;
      });
    }

    return blocks;
  }, [blocks, locale]);

  // Localized helpers for items
  const getLocalizedCase = (c: CaseStudy): CaseStudy => {
    if (locale === 'en') {
    const uk = CASE_TRANSLATIONS_UK[c.id];
    const en = CASE_TRANSLATIONS_EN[c.id];
    const localized = {
      ...c,
      client: en?.client || translateEnglishValue(c.client),
      title: c.title_en || en?.title || translateEnglishValue(c.title_uk || uk?.title || c.title),
      categoryLabel: c.categoryLabel_en || en?.categoryLabel || translateEnglishValue(c.categoryLabel_uk || uk?.categoryLabel || c.categoryLabel),
      description: c.description_en || en?.description || translateEnglishValue(c.description_uk || uk?.description || c.description),
      challenge: c.challenge_en || en?.challenge || translateEnglishValue(c.challenge_uk || uk?.challenge || c.challenge),
      problem: c.problem_en || en?.problem || translateEnglishValue(c.problem_uk || uk?.problem || c.problem),
      solution: c.solution_en || en?.solution || translateEnglishValue(c.solution_uk || uk?.solution || c.solution),
      result: c.result_en || en?.result || translateEnglishValue(c.result_uk || uk?.result || c.result),
      metrics: c.metrics_en || en?.metrics || translateEnglishValue(c.metrics_uk || uk?.metrics || c.metrics),
    };
    return localizeMigratedConstructionCase(localized, locale);
  }
    if (locale === 'uk') {
      const uk = CASE_TRANSLATIONS_UK[c.id];
      return {
        ...c,
        client: uk?.client || c.client,
        title: c.title_uk || uk?.title || c.title,
        categoryLabel: c.categoryLabel_uk || uk?.categoryLabel || c.categoryLabel,
        description: c.description_uk || uk?.description || c.description,
        challenge: c.challenge_uk || uk?.challenge || c.challenge,
        problem: c.problem_uk || uk?.problem || c.problem,
        solution: c.solution_uk || uk?.solution || c.solution,
        result: c.result_uk || uk?.result || c.result,
        metrics: c.metrics_uk || uk?.metrics || c.metrics,
      };
    }
    return c;
  };

  const getLocalizedTestimonial = (item: Testimonial): Testimonial => {
    if (locale === 'en') {
    const uk = TESTIMONIALS_TRANSLATIONS_UK[item.id];
    const en = TESTIMONIALS_TRANSLATIONS_EN[item.id];
    return {
      ...item,
      author: item.author_en || en?.author || translateEnglishValue(item.author_uk || uk?.author || item.author),
      role: item.role_en || en?.role || translateEnglishValue(item.role_uk || uk?.role || item.role),
      company: item.company_en || en?.company || translateEnglishValue(item.company_uk || uk?.company || item.company),
      project: item.project_en || en?.project || translateEnglishValue(item.project_uk || uk?.project || item.project),
      quote: item.quote_en || en?.quote || translateEnglishValue(item.quote_uk || uk?.quote || item.quote),
    };
  }
    if (locale === 'uk') {
      const uk = TESTIMONIALS_TRANSLATIONS_UK[item.id];
      return {
        ...item,
        author: item.author_uk || uk?.author || item.author,
        role: item.role_uk || uk?.role || item.role,
        company: item.company_uk || uk?.company || item.company,
        project: item.project_uk || uk?.project || item.project,
        quote: item.quote_uk || uk?.quote || item.quote,
      };
    }
    return item;
  };

  const getLocalizedBackstageItem = (item: BackstageItem): BackstageItem => {
    if (locale === 'en') {
    const uk = BACKSTAGE_TRANSLATIONS_UK[item.id];
    const en = BACKSTAGE_TRANSLATIONS_EN[item.id] || BACKSTAGE_SEED_EN[item.id];
    return {
      ...item,
      title: item.title_en || en?.title || translateEnglishValue(item.title_uk || uk?.title || item.title),
      category: item.category_en || en?.category || translateEnglishValue(item.category_uk || uk?.category || item.category),
      tech: item.tech_en || en?.tech || translateEnglishValue(item.tech_uk || uk?.tech || item.tech),
      description: item.description_en || en?.description || translateEnglishValue(item.description_uk || uk?.description || item.description),
    };
  }
    if (locale === 'uk') {
      const uk = BACKSTAGE_TRANSLATIONS_UK[item.id];
      return {
        ...item,
        title: item.title_uk || uk?.title || item.title,
        category: item.category_uk || uk?.category || item.category,
        tech: item.tech_uk || uk?.tech || item.tech,
        description: item.description_uk || uk?.description || item.description,
      };
    }
    return item;
  };

  const updateSettings = async (newSettings: Partial<SiteSetting>) => {
    const updated = {
      ...rawSettings,
      ...newSettings,
      updatedAt: Date.now()
    };
    await setDoc(doc(db, 'site_settings', 'global'), updated, { merge: true });
    setRawSettings(updated);
  };

  const saveBlock = async (block: SiteBlock) => {
    const blockRef = doc(db, 'site_blocks', block.id);
    const dataToSave = {
      ...block,
      updatedAt: Date.now()
    };
    await setDoc(blockRef, dataToSave, { merge: true });
  };

  const deleteBlock = async (blockId: string) => {
    await deleteDoc(doc(db, 'site_blocks', blockId));
  };

  const toggleBlockActive = async (blockId: string, isActive: boolean) => {
    const blockRef = doc(db, 'site_blocks', blockId);
    await updateDoc(blockRef, { isActive, updatedAt: Date.now() });
  };

  const reorderBlock = async (blockId: string, direction: 'up' | 'down') => {
    const sorted = [...blocks].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex(b => b.id === blockId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const prev = sorted[index - 1];
      const curr = sorted[index];
      const tempOrder = prev.order;
      prev.order = curr.order;
      curr.order = tempOrder;
      await Promise.all([
        updateDoc(doc(db, 'site_blocks', curr.id), { order: curr.order }),
        updateDoc(doc(db, 'site_blocks', prev.id), { order: prev.order }),
      ]);
    } else if (direction === 'down' && index < sorted.length - 1) {
      const next = sorted[index + 1];
      const curr = sorted[index];
      const tempOrder = next.order;
      next.order = curr.order;
      curr.order = tempOrder;
      await Promise.all([
        updateDoc(doc(db, 'site_blocks', curr.id), { order: curr.order }),
        updateDoc(doc(db, 'site_blocks', next.id), { order: next.order }),
      ]);
    }
  };

  const resetToDefaults = async () => {
    await setDoc(doc(db, 'site_settings', 'global'), {
      ...DEFAULT_SITE_SETTINGS,
      updatedAt: Date.now()
    });

    for (const b of DEFAULT_SITE_BLOCKS) {
      await setDoc(doc(db, 'site_blocks', b.id), {
        ...b,
        updatedAt: Date.now()
      });
    }
  };

  return (
    <SiteContentContext.Provider
      value={{
        locale,
        setLocale,
        t,
        l,
        legacy,
        isUk,
        isEn,
        isRu,
        settings,
        rawSettings,
        blocks: localizedBlocks,
        loading,
        updateSettings,
        saveBlock,
        deleteBlock,
        toggleBlockActive,
        reorderBlock,
        resetToDefaults,
        getLocalizedCase,
        getLocalizedTestimonial,
        getLocalizedBackstageItem
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return ctx;
}
