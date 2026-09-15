import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CaseStudy } from '../../types';
import { getCaseSlug } from '../../lib/caseMedia';
import { normalizeArticle } from '../../lib/articleCms';
import { getGallerySlug, type PhotoGallery } from '../../lib/galleryContent';
import { getVideoProjectSlug, type VideoProject } from '../../lib/videoPortfolio';
import type { PublishQualityType } from '../../lib/publishQuality';
import { UnifiedContentManager as UnifiedContentManagerCore } from './UnifiedContentManagerCore';

export interface UnifiedContentFocusTarget {
  type: PublishQualityType;
  id: string;
  requestKey: number;
}

interface UnifiedContentManagerProps {
  focusTarget?: UnifiedContentFocusTarget | null;
  onFocusHandled?: () => void;
}

const TYPE_LABEL: Record<PublishQualityType, string> = {
  case: 'Кейсы',
  gallery: 'Галереи',
  video: 'Видео',
  article: 'Статьи',
};

async function resolveTargetPath(target: UnifiedContentFocusTarget): Promise<string | null> {
  const collectionName = target.type === 'case' ? 'cases' : target.type === 'article' ? 'articles' : 'site_settings';
  const snapshot = await getDoc(doc(db, collectionName, target.id));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  if (target.type === 'case') return `/cases/${encodeURIComponent(getCaseSlug({ id: target.id, ...data } as CaseStudy))}`;
  if (target.type === 'gallery') return `/galleries/${encodeURIComponent(getGallerySlug({ id: target.id, ...data } as PhotoGallery))}`;
  if (target.type === 'video') return `/videos/${encodeURIComponent(getVideoProjectSlug({ id: target.id, ...data } as VideoProject))}`;
  return `/media-center/${encodeURIComponent(normalizeArticle(target.id, data).slug)}`;
}

function findTargetCard(root: HTMLElement, path: string): HTMLElement | null {
  const anchor = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .find(candidate => candidate.getAttribute('href') === path);
  return anchor?.closest<HTMLElement>('article') || null;
}

function clickEditorButton(card: HTMLElement): boolean {
  const button = Array.from(card.querySelectorAll<HTMLButtonElement>('button'))
    .find(candidate => candidate.textContent?.includes('Редактировать'));
  if (!button) return false;
  button.click();
  return true;
}

export function UnifiedContentManager({ focusTarget = null, onFocusHandled }: UnifiedContentManagerProps = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [handoffError, setHandoffError] = useState('');

  useEffect(() => {
    if (!focusTarget) return;

    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;
    setHandoffError('');

    const finish = () => {
      if (!cancelled) onFocusHandled?.();
    };

    const openTarget = async () => {
      try {
        const path = await resolveTargetPath(focusTarget);
        if (cancelled) return;
        if (!path) {
          setHandoffError(`Материал ${focusTarget.type}:${focusTarget.id} больше не найден в CMS. Возможно, запись уже удалена или диагностика устарела.`);
          finish();
          return;
        }

        const poll = () => {
          if (cancelled) return;
          const root = rootRef.current;
          if (!root) {
            timer = window.setTimeout(poll, 100);
            return;
          }

          const card = findTargetCard(root, path);
          if (card && clickEditorButton(card)) {
            finish();
            return;
          }

          const label = TYPE_LABEL[focusTarget.type];
          const typeButtons = Array.from(root.querySelectorAll('button')) as HTMLButtonElement[];
          const typeButton = typeButtons.find(candidate => candidate.textContent?.trim().startsWith(label));
          if (typeButton) typeButton.click();

          attempts += 1;
          if (attempts >= 100) {
            setHandoffError(`Не удалось автоматически открыть ${focusTarget.type}:${focusTarget.id}. Материал найден, но карточка редактора не появилась.`);
            finish();
            return;
          }
          timer = window.setTimeout(poll, 100);
        };

        poll();
      } catch (error) {
        if (cancelled) return;
        setHandoffError(error instanceof Error ? error.message : String(error));
        finish();
      }
    };

    void openTarget();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [focusTarget?.requestKey]);

  return (
    <div ref={rootRef} className="space-y-3">
      {handoffError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {handoffError}
        </div>
      )}
      <UnifiedContentManagerCore />
    </div>
  );
}
