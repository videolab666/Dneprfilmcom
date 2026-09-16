import type { Locale } from '../types';
import { legacyText, legacyValue } from '../locales/legacyEnglish';

export interface EditableCopyOverride {
  uk?: string;
  ru?: string;
  en?: string;
}

export interface LiveCalculatorPricing {
  base: number;
  camera: number;
  starlink: number;
  graphics: number;
  replay: number;
  translation: number;
  led: number;
  sports: number;
}

export interface VideoCalculatorPricing {
  base: number;
  videoType: {
    commercial: number;
    factory: number;
    corporate: number;
    event: number;
  };
  duration: {
    '30s': number;
    '60s': number;
    '2m': number;
    '5m+': number;
  };
  script: number;
  actors: number;
  drone: number;
  voiceover: number;
  graphics3d: number;
}

export interface ConstructionCalculatorPricing {
  timelapseCameraMonthly: number;
  droneMonthly: number;
  droneBiweekly: number;
  droneWeekly: number;
  windowPanoramasMonthly: number;
  monthlyReels: number;
  liveStreamMonthly: number;
}

export interface FullPageCmsConfig {
  version: 3;
  copyOverrides: Record<string, EditableCopyOverride>;
  calculators: {
    live: LiveCalculatorPricing;
    video: VideoCalculatorPricing;
    construction: ConstructionCalculatorPricing;
  };
}

export const DEFAULT_FULL_PAGE_CMS: FullPageCmsConfig = {
  version: 3,
  copyOverrides: {},
  calculators: {
    live: {
      base: 12000,
      camera: 4500,
      starlink: 5000,
      graphics: 3500,
      replay: 4500,
      translation: 4000,
      led: 3000,
      sports: 3000,
    },
    video: {
      base: 15000,
      videoType: {
        commercial: 10000,
        factory: 12000,
        corporate: 14000,
        event: 5000,
      },
      duration: {
        '30s': 0,
        '60s': 3000,
        '2m': 7000,
        '5m+': 15000,
      },
      script: 4000,
      actors: 8000,
      drone: 4500,
      voiceover: 3000,
      graphics3d: 9000,
    },
    construction: {
      timelapseCameraMonthly: 4500,
      droneMonthly: 6000,
      droneBiweekly: 11000,
      droneWeekly: 20000,
      windowPanoramasMonthly: 3500,
      monthlyReels: 4000,
      liveStreamMonthly: 3000,
    },
  },
};

function finiteNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

export function normalizeFullPageCms(input: unknown): FullPageCmsConfig {
  const source = input && typeof input === 'object' ? input as Partial<FullPageCmsConfig> : {};
  const calculators = source.calculators || {} as FullPageCmsConfig['calculators'];
  const live = calculators.live || {} as LiveCalculatorPricing;
  const video = calculators.video || {} as VideoCalculatorPricing;
  const construction = calculators.construction || {} as ConstructionCalculatorPricing;

  return {
    version: 3,
    copyOverrides: source.copyOverrides && typeof source.copyOverrides === 'object'
      ? source.copyOverrides
      : {},
    calculators: {
      live: {
        base: finiteNumber(live.base, DEFAULT_FULL_PAGE_CMS.calculators.live.base),
        camera: finiteNumber(live.camera, DEFAULT_FULL_PAGE_CMS.calculators.live.camera),
        starlink: finiteNumber(live.starlink, DEFAULT_FULL_PAGE_CMS.calculators.live.starlink),
        graphics: finiteNumber(live.graphics, DEFAULT_FULL_PAGE_CMS.calculators.live.graphics),
        replay: finiteNumber(live.replay, DEFAULT_FULL_PAGE_CMS.calculators.live.replay),
        translation: finiteNumber(live.translation, DEFAULT_FULL_PAGE_CMS.calculators.live.translation),
        led: finiteNumber(live.led, DEFAULT_FULL_PAGE_CMS.calculators.live.led),
        sports: finiteNumber(live.sports, DEFAULT_FULL_PAGE_CMS.calculators.live.sports),
      },
      video: {
        base: finiteNumber(video.base, DEFAULT_FULL_PAGE_CMS.calculators.video.base),
        videoType: {
          commercial: finiteNumber(video.videoType?.commercial, DEFAULT_FULL_PAGE_CMS.calculators.video.videoType.commercial),
          factory: finiteNumber(video.videoType?.factory, DEFAULT_FULL_PAGE_CMS.calculators.video.videoType.factory),
          corporate: finiteNumber(video.videoType?.corporate, DEFAULT_FULL_PAGE_CMS.calculators.video.videoType.corporate),
          event: finiteNumber(video.videoType?.event, DEFAULT_FULL_PAGE_CMS.calculators.video.videoType.event),
        },
        duration: {
          '30s': finiteNumber(video.duration?.['30s'], DEFAULT_FULL_PAGE_CMS.calculators.video.duration['30s']),
          '60s': finiteNumber(video.duration?.['60s'], DEFAULT_FULL_PAGE_CMS.calculators.video.duration['60s']),
          '2m': finiteNumber(video.duration?.['2m'], DEFAULT_FULL_PAGE_CMS.calculators.video.duration['2m']),
          '5m+': finiteNumber(video.duration?.['5m+'], DEFAULT_FULL_PAGE_CMS.calculators.video.duration['5m+']),
        },
        script: finiteNumber(video.script, DEFAULT_FULL_PAGE_CMS.calculators.video.script),
        actors: finiteNumber(video.actors, DEFAULT_FULL_PAGE_CMS.calculators.video.actors),
        drone: finiteNumber(video.drone, DEFAULT_FULL_PAGE_CMS.calculators.video.drone),
        voiceover: finiteNumber(video.voiceover, DEFAULT_FULL_PAGE_CMS.calculators.video.voiceover),
        graphics3d: finiteNumber(video.graphics3d, DEFAULT_FULL_PAGE_CMS.calculators.video.graphics3d),
      },
      construction: {
        timelapseCameraMonthly: finiteNumber(construction.timelapseCameraMonthly, DEFAULT_FULL_PAGE_CMS.calculators.construction.timelapseCameraMonthly),
        droneMonthly: finiteNumber(construction.droneMonthly, DEFAULT_FULL_PAGE_CMS.calculators.construction.droneMonthly),
        droneBiweekly: finiteNumber(construction.droneBiweekly, DEFAULT_FULL_PAGE_CMS.calculators.construction.droneBiweekly),
        droneWeekly: finiteNumber(construction.droneWeekly, DEFAULT_FULL_PAGE_CMS.calculators.construction.droneWeekly),
        windowPanoramasMonthly: finiteNumber(construction.windowPanoramasMonthly, DEFAULT_FULL_PAGE_CMS.calculators.construction.windowPanoramasMonthly),
        monthlyReels: finiteNumber(construction.monthlyReels, DEFAULT_FULL_PAGE_CMS.calculators.construction.monthlyReels),
        liveStreamMonthly: finiteNumber(construction.liveStreamMonthly, DEFAULT_FULL_PAGE_CMS.calculators.construction.liveStreamMonthly),
      },
    },
  };
}

export function copyOverrideKey(uk: string, ru: string, en?: string): string {
  const input = `${uk}\u0000${ru}\u0000${en || ''}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `copy:${(hash >>> 0).toString(36)}`;
}

export function translationOverrideKey(key: string): string {
  return `t:${key}`;
}

function overrideValue(
  locale: Locale,
  overrides: Record<string, EditableCopyOverride> | undefined,
  key: string,
): string | undefined {
  const value = overrides?.[key]?.[locale];
  return typeof value === 'string' ? value : undefined;
}

export function resolveEditableCopy(
  locale: Locale,
  uk: string,
  ru: string,
  en: string | undefined,
  overrides: Record<string, EditableCopyOverride> | undefined,
): string {
  const override = overrideValue(locale, overrides, copyOverrideKey(uk, ru, en));
  if (override !== undefined) return override;
  return legacyText(locale, uk, ru, en);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if ('$$typeof' in (value as Record<string, unknown>)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function resolveEditableLegacy<T>(
  locale: Locale,
  uk: T,
  ru: T,
  overrides: Record<string, EditableCopyOverride> | undefined,
): T {
  if (typeof uk === 'string' && typeof ru === 'string') {
    return resolveEditableCopy(locale, uk, ru, undefined, overrides) as T;
  }

  if (Array.isArray(uk) && Array.isArray(ru)) {
    const preferred = locale === 'ru' ? ru : uk;
    return preferred.map((_, index) => {
      if (index < uk.length && index < ru.length) {
        return resolveEditableLegacy(locale, uk[index], ru[index], overrides);
      }
      return legacyValue(locale, uk[index] as never, ru[index] as never);
    }) as T;
  }

  if (isPlainObject(uk) && isPlainObject(ru)) {
    const preferred = (locale === 'ru' ? ru : uk) as Record<string, unknown>;
    const output: Record<string, unknown> = { ...preferred };
    for (const key of Object.keys(preferred)) {
      if (key in uk && key in ru) {
        output[key] = resolveEditableLegacy(locale, uk[key], ru[key], overrides);
      }
    }
    return output as T;
  }

  return legacyValue(locale, uk, ru);
}
