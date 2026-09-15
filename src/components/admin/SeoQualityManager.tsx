import { SeoIntelligencePanel } from './SeoIntelligencePanel';
import { SeoQualityManager as SeoQualityManagerCore } from './SeoQualityManagerCore';

export function SeoQualityManager() {
  return (
    <div className="space-y-6">
      <SeoIntelligencePanel />
      <SeoQualityManagerCore />
    </div>
  );
}
