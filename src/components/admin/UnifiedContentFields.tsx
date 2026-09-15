import type { Locale } from '../../types';
import type { PublishQualityType } from '../../lib/publishQuality';
import {
  UnifiedContentFields as UnifiedContentFieldsCore,
  type UnifiedContentRecord,
} from './UnifiedContentFieldsCore';
import { ArticleBlockEditor } from './ArticleBlockEditor';

export { articleTranslation, portfolioField } from './UnifiedContentFieldsCore';
export type { UnifiedContentRecord } from './UnifiedContentFieldsCore';

interface UnifiedContentFieldsProps {
  type: PublishQualityType;
  value: UnifiedContentRecord;
  locale: Locale;
  onPatch: (patch: UnifiedContentRecord) => void;
}

export function UnifiedContentFields(props: UnifiedContentFieldsProps) {
  if (props.type !== 'article') return <UnifiedContentFieldsCore {...props} />;

  return (
    <div className="space-y-5">
      <UnifiedContentFieldsCore {...props} />
      <ArticleBlockEditor value={props.value} locale={props.locale} onPatch={props.onPatch} />
    </div>
  );
}
