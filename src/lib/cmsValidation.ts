import type { EditableCopyCatalogEntry } from '../generated/editableCopyCatalog';
import type { EditableStructureCatalogEntry } from '../generated/editableStructureCatalog';
import type { FullPageCmsConfig, StructureItemOverride } from './fullPageEditing';

export interface CmsValidationIssue {
  level: 'error' | 'warning';
  area: string;
  message: string;
}

function validLink(value: string): boolean {
  const text = value.trim();
  if (!text) return true;
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(text);
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
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value as Record<string, unknown>)) walkNumbers(child, `${path}.${key}`);
  };
  walkNumbers(prices, 'pricing');

  for (const group of structureCatalog) {
    const override = config.draft.structures[group.id];
    if (!override) continue;
    const seen = new Set<string>();
    const originals = new Set(group.items.map(item => item.id));
    const all: StructureItemOverride[] = override.items || [];
    for (const item of all) {
      if (seen.has(item.id)) issues.push({ level: 'error', area: 'Структура', message: `${group.label}: повторяющийся ID ${item.id}.` });
      seen.add(item.id);
      if (item.cloneFromId && !originals.has(item.cloneFromId)) issues.push({ level: 'error', area: 'Структура', message: `${group.label}: источник клона ${item.cloneFromId} больше не существует.` });
      if (item.cloneFromId) {
        const source = group.items.find(entry => entry.id === item.cloneFromId);
        for (const locale of ['uk', 'ru', 'en'] as const) {
          for (const field of source?.fields || []) {
            const value = item.locales?.[locale]?.[field.key];
            if (value === undefined || !value.trim()) issues.push({ level: 'warning', area: 'Локализация', message: `${group.label}: добавленный элемент ${item.id}, поле ${field.key}, ${locale.toUpperCase()} не заполнено.` });
            if (/(url|href|link)/i.test(field.key) && value && !validLink(value)) issues.push({ level: 'error', area: 'Ссылки', message: `${group.label}: ${field.key} содержит некорректную ссылку.` });
          }
        }
      }
    }
  }

  if (config.workflow.scheduledAt && config.workflow.scheduledAt < Date.now()) {
    issues.push({ level: 'warning', area: 'Публикация', message: 'Запланированное время уже наступило: draft сейчас используется публичным runtime.' });
  }
  return issues;
}
