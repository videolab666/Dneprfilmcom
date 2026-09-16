import { blockKind, type BuilderSiteBlock } from './pageBuilder';

export function validateBuilderBlock(block: BuilderSiteBlock): string[] {
  const kind = blockKind(block);
  const config = block.config;
  const errors: string[] = [];

  if (!block.title.trim()) errors.push('Не задано внутреннее название секции.');

  if (kind === 'downloads') {
    const items = config.downloadItems || [];
    if (!items.length) errors.push('Downloads: нужен минимум один файл.');
    items.forEach((item, index) => {
      if (!item.title.trim()) errors.push(`Файл ${index + 1}: нет названия.`);
      if (!item.url.trim()) errors.push(`Файл ${index + 1}: нет URL.`);
    });
  }

  if (kind === 'timeline') {
    const items = config.timelineItems || [];
    if (!items.length) errors.push('Timeline: нужен минимум один этап.');
    items.forEach((item, index) => {
      if (!item.title.trim()) errors.push(`Timeline ${index + 1}: нет заголовка.`);
    });
  }

  if (kind === 'tabs') {
    const items = config.tabs || [];
    if (!items.length) errors.push('Tabs: нужна минимум одна вкладка.');
    items.forEach((item, index) => {
      if (!item.title.trim()) errors.push(`Вкладка ${index + 1}: нет названия.`);
    });
  }

  if (kind === 'table') {
    if (!(config.tableColumns || []).length) errors.push('Таблица: нужна минимум одна колонка.');
  }

  if (kind === 'team') {
    const items = config.teamItems || [];
    if (!items.length) errors.push('Команда: нужна минимум одна карточка.');
    items.forEach((item, index) => {
      if (!item.name.trim()) errors.push(`Команда ${index + 1}: нет имени.`);
    });
  }

  if (kind === 'video_embed' && !String(config.videoUrl || '').trim()) {
    errors.push('Видео: не указан URL.');
  }

  return errors;
}
