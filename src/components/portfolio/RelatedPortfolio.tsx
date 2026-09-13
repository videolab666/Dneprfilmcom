import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Film, Images, Link2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CaseStudy } from '../../types';
import { getCaseSlug } from '../../lib/caseMedia';
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
import { useSiteContent } from '../../context/SiteContentContext';
import { ResponsiveImage } from '../ResponsiveImage';

export type RelatedPortfolioEntityType = 'case' | 'gallery' | 'video';

interface RelatedPortfolioProps {
  entityType: RelatedPortfolioEntityType;
  entityId: string;
}

interface RelatedData {
  cases: CaseStudy[];
  galleries: PhotoGallery[];
  videos: VideoProject[];
  relations: ProjectRelation[];
}

interface RelatedCard {
  key: string;
  href: string;
  title: string;
  eyebrow: string;
  image: string;
  icon: 'case' | 'gallery' | 'video';
}

function caseLocalizedTitle(item: CaseStudy, locale: 'uk' | 'ru' | 'en'): string {
  if (locale === 'uk') return item.title_uk || item.title || item.title_en || item.id;
  if (locale === 'en') return item.title_en || item.title_uk || item.title || item.id;
  return item.title || item.title_uk || item.title_en || item.id;
}

export function RelatedPortfolio({ entityType, entityId }: RelatedPortfolioProps) {
  const { locale, l } = useSiteContent();
  const [data, setData] = useState<RelatedData | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getDocs(collection(db, 'cases')),
      getDocs(collection(db, 'site_settings')),
    ]).then(([caseSnapshot, settingsSnapshot]) => {
      if (!active) return;
      const cases = caseSnapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy));
      const settings = settingsSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setData({
        cases,
        galleries: settings.filter(isPhotoGallery),
        videos: settings.filter(isVideoProject),
        relations: settings.filter(isProjectRelation),
      });
    }).catch(error => {
      console.warn('Could not load related portfolio content:', error);
      if (active) setData({ cases: [], galleries: [], videos: [], relations: [] });
    });
    return () => { active = false; };
  }, [entityId, entityType]);

  const cards = useMemo<RelatedCard[]>(() => {
    if (!data) return [];
    const visibleCases = new Map(data.cases.filter(item => item.published !== false).map(item => [item.id, item]));
    const visibleGalleries = new Map(data.galleries.filter(item => item.published !== false).map(item => [item.id, item]));
    const visibleVideos = new Map(data.videos.filter(item => item.published !== false).map(item => [item.id, item]));
    const result: RelatedCard[] = [];

    const pushCase = (caseId: string) => {
      const item = visibleCases.get(caseId);
      if (!item || (entityType === 'case' && item.id === entityId)) return;
      result.push({
        key: `case:${item.id}`,
        href: `/cases/${getCaseSlug(item)}`,
        title: caseLocalizedTitle(item, locale),
        eyebrow: l('Кейс', 'Кейс', 'Case study'),
        image: item.imageUrl || '',
        icon: 'case',
      });
    };

    const pushGallery = (galleryId: string) => {
      const raw = visibleGalleries.get(galleryId);
      if (!raw || (entityType === 'gallery' && raw.id === entityId)) return;
      const item = localizeGallery(raw, locale);
      result.push({
        key: `gallery:${item.id}`,
        href: getGalleryPath(item),
        title: item.title,
        eyebrow: l('Фотогалерея', 'Фотогалерея', 'Photo gallery'),
        image: galleryCover(item),
        icon: 'gallery',
      });
    };

    const pushVideo = (videoId: string) => {
      const raw = visibleVideos.get(videoId);
      if (!raw || (entityType === 'video' && raw.id === entityId)) return;
      const item = localizeVideoProject(raw, locale);
      result.push({
        key: `video:${item.id}`,
        href: getVideoProjectPath(item),
        title: item.title,
        eyebrow: l('Відеопроєкт', 'Видеопроект', 'Video project'),
        image: videoProjectCover(item),
        icon: 'video',
      });
    };

    if (entityType === 'case') {
      const relation = data.relations.find(item => item.caseId === entityId);
      relation?.galleryIds.forEach(pushGallery);
      relation?.videoProjectIds.forEach(pushVideo);
    } else {
      const matching = data.relations.filter(item => entityType === 'gallery'
        ? item.galleryIds.includes(entityId)
        : item.videoProjectIds.includes(entityId));
      matching.forEach(relation => {
        pushCase(relation.caseId);
        relation.galleryIds.forEach(pushGallery);
        relation.videoProjectIds.forEach(pushVideo);
      });
    }

    const unique = new Map(result.map(item => [item.key, item]));
    return Array.from(unique.values()).slice(0, 8);
  }, [data, entityId, entityType, l, locale]);

  if (!data || cards.length === 0) return null;

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600"><Link2 className="h-4 w-4" />{l('Пов’язані матеріали', 'Связанные материалы', 'Related work')}</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{l('Більше про цей проєкт', 'Больше об этом проекте', 'More from this project')}</h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-slate-500">{l(
            'Пов’язані кейси, фотогалереї та відео з одного проєкту або зйомки.',
            'Связанные кейсы, фотогалереи и видео из одного проекта или съёмки.',
            'Related case studies, galleries and videos from the same production.',
          )}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map(card => (
            <Link key={card.key} to={card.href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
              <div className="aspect-video overflow-hidden bg-slate-900">
                {card.image ? (
                  <ResponsiveImage src={card.image} alt={card.title} displayWidth={700} sizes="(max-width: 640px) 100vw, 33vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/30">
                    {card.icon === 'gallery' ? <Images className="h-10 w-10" /> : card.icon === 'video' ? <Film className="h-10 w-10" /> : <Briefcase className="h-10 w-10" />}
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">{card.eyebrow}</div>
                <h3 className="mt-1 line-clamp-2 text-sm font-black leading-snug text-slate-950">{card.title}</h3>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition group-hover:text-indigo-600">{l('Відкрити', 'Открыть', 'Open')}<ArrowRight className="h-3.5 w-3.5" /></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
