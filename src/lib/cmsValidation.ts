import type { EditableCopyCatalogEntry } from '../generated/editableCopyCatalog';
import type { EditableStructureCatalogEntry } from '../generated/editableStructureCatalog';
import type { FullPageCmsConfig, StructureItemOverride, StructureScalar } from './fullPageEditing';

export interface CmsValidationIssue {
  level: 'error' | 'warning';
  area: string;
  message: string;
}

type ValidationStructureField = {
  key: string;
  scope?: 'locale' | 'common';
  valueType?: 'string' | 'number' | 'boolean' | 'null';
  copyId?: string;
  uk?: string;
  ru?: string;
  en?: string;
  common?: StructureScalar;
};

function validLink(value: string): boolean {
  const text = value.trim();
  if (!text) return true;
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(text);
}

function fieldScope(field: ValidationStructureField): 'locale' | 'common' {
  return field.scope || 'locale';
}

function validateCommonValue(
  issues: CmsValidationIssue[],
  groupLabel: string,
  itemId: string,
  field: ValidationStructureField,
  value: StructureScalar | undefined,
) {
  if (value === undefined) return;
  if (field.valueType === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
    issues.push({ level: 'error', area: 'Структура', message: `${groupLabel}: ${itemId}.${field.key} должно быть числом.` });
  }
  if (field.valueType === 'boolean' && typeof value !== 'boolean') {
    issues.push({ level: 'error', area: 'Структура', message: `${groupLabel}: ${itemId}.${field.key} должно быть boolean.` });
  }
  if (/(url|href|link)$/i.test(field.key) && typeof value === 'string' && !validLink(value)) {
    issues.push({ level: 'error', area: 'Ссылки', message: `${groupLabel}: ${itemId}.${field.key} содержит некорректную ссылку.` });
  }
}

export function validateFullPageDraft(
  config: FullPageCmsConfig,
  copyCatalog: EditableCopyCatalogEntry[],
  structureCatalog: EditableStructureCatalogEntry[],
): CmsValidationIssue[] {
  const issues: CmsValidationIssue[] = [];

  for (const [key, value] of Object.entries(config.draft.copyOverrides)) {
    for (const locale of ['uk', 'ru', 'en'] as const) {
      if (value[locale] === '') issues.push({ level: 'warning', area: 'Тексты', message: `${key}: ${locale.toUpperCase()} намеренно пустой.` });
      const catalog = copyCatalog.find(item => item.id === key);
      const label = catalog?.label.toLowerCase() || '';
      if (typeof value[locale] === 'string' && /(url|href|ссылка|посилання|link)/i.test(label) && !validLink(value[locale] || '')) {
        issues.push({ level: 'error', area: 'Ссылки', message: `${catalog?.label || key}: некорректная ссылка (${locale.toUpperCase()}).` });
      }
    }
  }

  const prices = JSON.parse(JSON.stringify(config.draft.calculators)) as Record<string, unknown>;
  const walkNumbers = (value: unknown, path: string) => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) issues.push({ level: 'error', area: 'Калькуляторы', message: `${path}: цена должна быть числом ≥ 0.` });
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) walkNumbers(child, `${path}.${key}`);
    }
  };
  walkNumbers(prices, 'pricing');

  for (const rawGroup of structureCatalog) {
    const group = rawGroup as typeof rawGroup & { items: Array<{ id: string; fields: ValidationStructureField[] }> };
    const override = config.draft.structures[group.id];
    if (!override) continue;

    if (override.layout && !['auto', 'stack', 'grid-2', 'grid-3', 'grid-4'].includes(override.layout)) {
      issues.push({ level: 'error', area: 'Структура', message: `${group.label}: неизвестный layout ${override.layout}.` });
    }

    const seen = new Set<string>();
    const seenOrder = new Map<number, string>();
    const originals = new Set(group.items.map(item => item.id));
    const all: StructureItemOverride[] = override.items || [];

    for (const item of all) {
      if (seen.has(item.id)) issues.push({ level: 'error', area: 'Структура', message: `${group.label}: повторяющийся ID ${item.id}.` });
      seen.add(item.id);

      if (typeof item.order === 'number') {
        const previous = seenOrder.get(item.order);
        if (previous && previous !== item.id) {
          issues.push({ level: 'warning', area: 'Структура', message: `${group.label}: одинаковый order ${item.order} у ${previous} и ${item.id}.` });
        } else {
          seenOrder.set(item.order, item.id);
        }
      }

      if (item.cloneFromId && !originals.has(item.cloneFromId)) {
        issues.push({ level: 'error', area: 'Структура', message: `${group.label}: источник клона ${item.cloneFromId} больше не существует.` });
      }

      const source = group.items.find(entry => entry.id === (item.cloneFromId || item.id));
      if (!source) continue;

      for (const field of source.fields || []) {
        if (fieldScope(field) === 'common') {
          validateCommonValue(issues, group.label, item.id, field, item.common?.[field.key] ?? field.common);
          continue;
        }

        if (!item.cloneFromId) continue;
        for (const locale of ['uk', 'ru', 'en'] as const) {
          const localized = item.locales?.[locale]?.[field.key];
          if (localized === undefined || !localized.trim()) {
            issues.push({ level: 'warning', area: 'Локализация', message: `${group.label}: добавленный элемент ${item.id}, поле ${field.key}, ${locale.toUpperCase()} не заполнено.` });
          }
          if (/(url|href|link)$/i.test(field.key) && localized && !validLink(localized)) {
            issues.push({ level: 'error', area: 'Ссылки', message: `${group.label}: ${field.key} содержит некорректную ссылку.` });
          }
        }
      }
    }
  }

  if (config.workflow.scheduledAt && config.workflow.scheduledAt < Date.now()) {
    issues.push({ level: 'warning', area: 'Публикация', message: 'Запланированное время уже наступило: scheduled snapshot сейчас используется публичным runtime.' });
  }
  return issues;
}
