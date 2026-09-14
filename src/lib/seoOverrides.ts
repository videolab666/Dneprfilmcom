import type { Locale } from '../types';

export interface LocalizedSeoOverrides {
  title: string;
  description: string;
  socialImage: string;
}

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function stringField(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === 'string' ? String(record[key]).trim() : '';
}

function localizedField(record: Record<string, unknown>, base: string, locale: Locale): string {
  if (locale === 'uk') return stringField(record, `${base}_uk`) || stringField(record, base) || stringField(record, `${base}_en`);
  if (locale === 'en') return stringField(record, `${base}_en`) || stringField(record, `${base}_uk`) || stringField(record, base);
  return stringField(record, base) || stringField(record, `${base}_uk`) || stringField(record, `${base}_en`);
}

export function resolveSeoOverrides(value: unknown, locale: Locale): LocalizedSeoOverrides {
  const record = recordOf(value);
  return {
    title: localizedField(record, 'seoTitle', locale),
    description: localizedField(record, 'seoDescription', locale),
    socialImage: localizedField(record, 'socialImage', locale),
  };
}

export function seoFieldName(base: 'seoTitle' | 'seoDescription' | 'socialImage', locale: Locale): string {
  return locale === 'ru' ? base : `${base}_${locale}`;
}
