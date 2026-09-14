import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onSnapshot } from 'firebase/firestore';
import {
  ArrowRight,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Copy,
  Film,
  Images,
  Link2,
  Share2,
  Sparkles,
} from 'lucide-react';
import {
  publicProjectRelationsQuery,
  publishedCasesQuery,
  publishedGalleriesQuery,
  publishedVideoProjectsQuery,
} from '../../lib/publicPortfolioQueries';
import type { CaseStudy } from '../../types';
import { getCasePath } from '../../lib/caseMedia';
import {
  galleryCover,
  getGalleryPath,
  isPhotoGallery,
  localizeGallery,
  type PhotoGallery,
} from '../../lib/galleryContent';
import {
  getVideoProjectPath,
  isVideoProject,
  localizeVideoProject,
  videoProjectCover,
  type VideoProject,
} from '../../lib/videoPortfolio';
import { isProjectRelation, type ProjectRelation } from '../../lib/projectRelations';
import { getPortfolioCategory, getPortfolioTags } from '../../lib/portfolioTaxonomy';
import { useSiteContent } from '../../context/SiteContentContext';
import { ResponsiveImage } from '../ResponsiveImage';

export type RelatedEntityType = 'case' | 'gallery' | 'video';

interface RelatedProjectContentProps {
  entityType: RelatedEntityType;
  entityId: string;
}

type RelatedCard = {
  key: string;
  id: string;
  type: RelatedEntityType;
  title: string;
  subtitle: string;
  path: string;
  image: string;
  automatic?: boolean;
};

type RawEntity = CaseStudy | PhotoGallery | VideoProject;

function orderValue(value: RawEntity): number {
  const record = value as unknown as Record<string, unknown>;
  if (typeof record.featuredOrder === 'number') return record.featuredOrder;
  if (typeof record.order === 'number') return record.order;
  return 9999;
}

export function RelatedProjectContent({ entityType, entityId }: RelatedProjectContentProps) {
  const { locale, getLocalizedCase, l } = useSiteContent();
  const [relations, setRelations] = useState<ProjectRelation[]>([]);
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribeRelations = onSnapshot(publicProjectRelationsQuery(), snapshot => {
      const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setRelations(docs.filter(isProjectRelation));
    }, error => console.warn('Could not load related portfolio relations:', error));
    const unsubscribeGalleries = onSnapshot(publishedGalleriesQuery(), snapshot => {
      const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setGalleries(docs.filter(isPhotoGallery));
    }, error => console.warn('Could not load related galleries:', error));
    const unsubscribeVideos = onSnapshot(publishedVideoProjectsQuery(), snapshot => {
      const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setVideos(docs.filter(isVideoProject));
    }, error => console.warn('Could not load related videos:', error));
    const unsubscribeCases = onSnapshot(publishedCasesQuery(), snapshot => {
      setCases(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy)));
    }, error => console.warn('Could not load related cases:', error));

    return () => {
      unsubscribeRelations();
      unsubscribeGalleries();
      unsubscribeVideos();
      unsubscribeCases();
    };
  }, []);

  const matchingRelations = useMemo(() => {
    if (entityType === 'case') return relations.filter(item => item.caseId === entityId);
    if (entityType === 'gallery') return relations.filter(item => item.galleryIds.includes(entityId));
    return relations.filter(item => item.videoProjectIds.includes(entityId));
  }, [relations, entityType, entityId]);

  const makeCaseCard = (rawCase: CaseStudy, automatic = false): RelatedCard => {
    const localized = getLocalizedCase(rawCase);
    return {
      key: `case:${rawCase.id}`,
      id: rawCase.id,
      type: 'case',
      title: localized.title,
      subtitle: localized.client || l('Кейс проєкту', 'Кейс проекта', 'Project case study'),
      path: getCasePath(rawCase),
      image: rawCase.imageUrl || '',
      automatic,
    };
  };

  const makeGalleryCard = (raw: PhotoGallery, automatic = false): RelatedCard => {
    const gallery = localizeGallery(raw, locale);
    return {
      key: `gallery:${raw.id}`,
      id: raw.id,
      type: 'gallery',
      title: gallery.title,
      subtitle: gallery.location || l('Фотогалерея', 'Фотогалерея', 'Photo gallery'),
      path: getGalleryPath(raw),
      image: galleryCover(raw),
      automatic,
    };
  };

  const makeVideoCard = (raw: VideoProject, automatic = false): RelatedCard => {
    const project = localizeVideoProject(raw, locale);
    return {
      key: `video:${raw.id}`,
      id: raw.id,
      type: 'video',
      title: project.title,
      subtitle: project.category || l('Відеопроєкт', 'Видеопроект', 'Video project'),
      path: getVideoProjectPath(raw),
      image: videoProjectCover(raw),
      automatic,
    };
  };

  const currentEntity = useMemo<RawEntity | null>(() => {
    if (entityType === 'case') return cases.find(item => item.id === entityId) || null;
    if (entityType === 'gallery') return galleries.find(item => item.id === entityId) || null;
    return videos.find(item => item.id === entityId) || null;
  }, [entityType, entityId, cases, galleries, videos]);

  const manualCards = useMemo<RelatedCard[]>(() => {
    if (!matchingRelations.length) return [];
    const result: RelatedCard[] = [];

    const addCase = (id: string) => {
      if (entityType === 'case' && id === entityId) return;
      const raw = cases.find(item => item.id === id && item.published !== false);
      if (raw) result.push(makeCaseCard(raw));
    };
    const addGallery = (id: string) => {
      if (entityType === 'gallery' && id === entityId) return;
      const raw = galleries.find(item => item.id === id && item.published !== false);
      if (raw) result.push(makeGalleryCard(raw));
    };
    const addVideo = (id: string) => {
      if (entityType === 'video' && id === entityId) return;
      const raw = videos.find(item => item.id === id && item.published !== false);
      if (raw) result.push(makeVideoCard(raw));
    };

    matchingRelations.forEach(relation => {
      addCase(relation.caseId);
      relation.galleryIds.forEach(addGallery);
      relation.videoProjectIds.forEach(addVideo);
    });

    return Array.from(new Map(result.map(item => [item.key, item])).values());
  }, [matchingRelations, entityType, entityId, cases, galleries, videos, locale, getLocalizedCase, l]);

  const cards = useMemo<RelatedCard[]>(() => {
    const manual = manualCards.slice(0, 6);
    if (!currentEntity || manual.length >= 3) return manual;

    const currentCategory = getPortfolioCategory(currentEntity);
    const currentTags = new Set(getPortfolioTags(currentEntity).map(tag => tag.toLowerCase()));
    const used = new Set(manual.map(item => item.key));
    used.add(`${entityType}:${entityId}`);

    const candidates: Array<{ card: RelatedCard; score: number; order: number }> = [];
    const score = (candidate: RawEntity) => {
      let value = getPortfolioCategory(candidate) === currentCategory ? 10 : 0;
      const sharedTags = getPortfolioTags(candidate).filter(tag => currentTags.has(tag.toLowerCase())).length;
      value += sharedTags * 4;
      return value;
    };

    cases.forEach(item => {
      const key = `case:${item.id}`;
      if (used.has(key) || item.published === false) return;
      const relevance = score(item);
      if (relevance > 0) candidates.push({ card: makeCaseCard(item, true), score: relevance, order: orderValue(item) });
    });
    galleries.forEach(item => {
      const key = `gallery:${item.id}`;
      if (used.has(key) || item.published === false) return;
      const relevance = score(item);
      if (relevance > 0) candidates.push({ card: makeGalleryCard(item, true), score: relevance, order: orderValue(item) });
    });
    videos.forEach(item => {
      const key = `video:${item.id}`;
      if (used.has(key) || item.published === false) return;
      const relevance = score(item);
      if (relevance > 0) candidates.push({ card: makeVideoCard(item, true), score: relevance, order: orderValue(item) });
    });

    candidates.sort((a, b) => b.score - a.score || a.order - b.order || a.card.title.localeCompare(b.card.title));
    return [...manual, ...candidates.map(item => item.card)].slice(0, 6);
  }, [manualCards, currentEntity, entityType, entityId, cases, galleries, videos, locale, getLocalizedCase, l]);

  const adjacent = useMemo(() => {
    let list: RawEntity[] = [];
    if (entityType === 'case') list = [...cases];
    else if (entityType === 'gallery') list = [...galleries];
    else list = [...videos];
    list = list
      .filter(item => (item as { published?: boolean }).published !== false)
      .sort((a, b) => orderValue(a) - orderValue(b) || String((b as { createdAt?: number }).createdAt || 0).localeCompare(String((a as { createdAt?: number }).createdAt || 0)));
    const index = list.findIndex(item => item.id === entityId);
    if (index < 0) return { previous: null as RelatedCard | null, next: null as RelatedCard | null };
    const asCard = (item: RawEntity | undefined): RelatedCard | null => {
      if (!item) return null;
      if ('kind' in item && item.kind === 'gallery') return makeGalleryCard(item as PhotoGallery);
      if ('kind' in item && item.kind === 'video_project') return makeVideoCard(item as VideoProject);
      return makeCaseCard(item as CaseStudy);
    };
    return { previous: asCard(list[index - 1]), next: asCard(list[index + 1]) };
  }, [entityType, entityId, cases, galleries, videos, locale, getLocalizedCase, l]);

  const iconFor = (type: RelatedEntityType) => {
    if (type === 'gallery') return <Images className="h-4 w-4" />;
    if (type === 'video') return <Film className="h-4 w-4" />;
    return <Briefcase className="h-4 w-4" />;
  };

  const labelFor = (type: RelatedEntityType) => {
    if (type === 'gallery') return l('Фото', 'Фото', 'Photos');
    if (type === 'video') return l('Відео', 'Видео', 'Video');
    return l('Кейс', 'Кейс', 'Case study');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.warn('Could not copy portfolio link:', error);
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: window.location.href });
        return;
      } catch {
        return;
      }
    }
    await copyLink();
  };

  if (!currentEntity) return null;

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-2">
            {adjacent.previous ? (
              <Link to={adjacent.previous.path} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-indigo-200">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400"><ChevronLeft className="h-3.5 w-3.5" />{l('Попередній', 'Предыдущий', 'Previous')}</div>
                <div className="mt-1 truncate text-sm font-bold text-slate-800">{adjacent.previous.title}</div>
              </Link>
            ) : <div className="flex-1" />}
            {adjacent.next ? (
              <Link to={adjacent.next.path} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-right hover:border-indigo-200">
                <div className="flex items-center justify-end gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{l('Наступний', 'Следующий', 'Next')}<ChevronRight className="h-3.5 w-3.5" /></div>
                <div className="mt-1 truncate text-sm font-bold text-slate-800">{adjacent.next.title}</div>
              </Link>
            ) : <div className="flex-1" />}
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-700"><Copy className="h-3.5 w-3.5" />{copied ? l('Скопійовано', 'Скопировано', 'Copied') : l('Копіювати', 'Копировать', 'Copy link')}</button>
            <button onClick={share} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-indigo-600"><Share2 className="h-3.5 w-3.5" />{l('Поділитися', 'Поделиться', 'Share')}</button>
          </div>
        </div>

        {cards.length > 0 && (
          <>
            <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                  <Link2 className="h-4 w-4" />{l('Перелінковка портфоліо', 'Перелинковка портфолио', 'Portfolio discovery')}
                </div>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {l('Пов’язані та схожі проєкти', 'Связанные и похожие проекты', 'Related and similar projects')}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-slate-500">{l(
                'Спочатку показуються ручні зв’язки, а якщо їх мало — система доповнює добірку за категорією та спільними тегами.',
                'Сначала показываются ручные связи, а если их мало — система дополняет подборку по категории и общим тегам.',
                'Manual relations come first; when there are too few, the list is completed using taxonomy category and shared tags.',
              )}</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {cards.map(card => (
                <Link key={card.key} to={card.path} className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
                  <div className="aspect-video overflow-hidden bg-slate-200">
                    {card.image ? (
                      <ResponsiveImage src={card.image} alt={card.title} displayWidth={900} sizes="(max-width: 768px) 100vw, 33vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">{iconFor(card.type)}</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">{iconFor(card.type)}{labelFor(card.type)}</div>
                      {card.automatic && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700"><Sparkles className="h-3 w-3" />{l('Схожий', 'Похожий', 'Similar')}</span>}
                    </div>
                    <h3 className="mt-2 text-lg font-black text-slate-950">{card.title}</h3>
                    {card.subtitle && <p className="mt-1 text-sm text-slate-500">{card.subtitle}</p>}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700">{l('Відкрити', 'Открыть', 'Open')}<ArrowRight className="h-3.5 w-3.5" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
