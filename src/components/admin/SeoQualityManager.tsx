import type { MouseEvent } from 'react';
import { SeoIntelligencePanel } from './SeoIntelligencePanel';
import { SeoQualityManager as SeoQualityManagerCore } from './SeoQualityManagerCore';

export function SeoQualityManager() {
  const guardLegacyPublish = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (!target || target.textContent?.trim() !== 'Publish') return;
    event.preventDefault();
    event.stopPropagation();
    window.alert('Публикация выполняется через Unified Content Editor, где slug/canonical и Publish Quality Gate проверяются перед изменением статуса. SEO Control можно использовать для SEO overrides и снятия материала с публикации.');
  };

  return (
    <div className="space-y-6">
      <SeoIntelligencePanel />
      <div onClickCapture={guardLegacyPublish}>
        <SeoQualityManagerCore />
      </div>
    </div>
  );
}