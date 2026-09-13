import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { ArrowRight, Briefcase, Film, Images } from 'lucide-react';
import { db } from '../../lib/firebase';
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
import { useSiteContent } from '../../context/SiteContentContext';
import { ResponsiveImage } from '../ResponsiveImage';

export type RelatedEntityType = 'case' | 'gallery' | 'video';

interface RelatedProjectContentProps {
  entityType: RelatedEntityType;
  entityId: string;
}

type RelatedCard = {
  id: string;
  type: RelatedEntityType;
  title: string;
  subtitle: string;
  path: string;
  image: string;
};

export function RelatedProjectContent({ entityType, entityId }: RelatedProjectContentProps) {
  const { locale, getLocalizedCase, l } = useSiteContent();
  const [relations, setRelations] = useState<ProjectRelation[]>([]);
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [videos, setVideos] = useState<VideoProject[]>([]);

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(collection(db, 'site_settings'), snapshot => {
      const docs = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
      setRelations(docs.filter(isProjectRelation));
      setGalleries(docs.filter(isPhotoGallery));
      setVideos(docs.filter(isVideoProject));
    }, error => console.warn('Could not load related portfolio settings:', error));

    const unsubscribeCases = onSnapshot(collection(db, 'cases'), snapshot => {
      setCases(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy)));
    }, error => console.warn('Could not load related cases:', error));

    return () => {
      unsubscribeSettings();
      unsubscribeCases();
    };
  }, []);

  const relation = useMemo(() => {
    if (entityType === 'case') return relations.find(item => item.caseId === entityId) || null;
    if (entityType === 'gallery') return relations.find(item => item.galleryIds.includes(entityId)) || null;
    return relations.find(item => item.videoProjectIds.includes(entityId)) || null;
  }, [relations, entityType, entityId]);

  const cards = useMemo<RelatedCard[]>(() => {
    if (!relation) return [];
    const result: RelatedCard[] = [];

    if (entityType !== 'case') {
      const rawCase = cases.find(item => item.id === relation.caseId && item.published !== false);
      if (rawCase) {
        const localized = getLocalizedCase(rawCase);
        result.push({
          id: rawCase.id,
          type: 'case',
          title: localized.title,
          subtitle: localized.client || l('Кейс проєкту', 'Кейс проекта', 'Project case study'),
          path: getCasePath(rawCase),
          image: rawCase.imageUrl || '',
        });
      }
    }

    if (entityType !== 'gallery') {
      relation.galleryIds.forEach(id => {
        const raw = galleries.find(item => item.id === id && item.published !== false);
        if (!raw) return;
        const gallery = localizeGallery(raw, locale);
        result.push({
          id: raw.id,
          type: 'gallery',
          title: gallery.title,
          subtitle: gallery.location || l('Фотогалерея', 'Фотогалерея', 'Photo gallery'),
          path: getGalleryPath(raw),
          image: galleryCover(raw),
        });
      });
    }

    if (entityType !== 'video') {
      relation.videoProjectIds.forEach(id => {
        const raw = videos.find(item => item.id === id && item.published !== false);
        if (!raw) return;
        const project = localizeVideoProject(raw, locale);
        result.push({
          id: raw.id,
          type: 'video',
          title: project.title,
          subtitle: project.category || l('Відеопроєкт', 'Видеопроект', 'Video project'),
          path: getVideoProjectPath(raw),
          image: videoProjectCover(raw),
        });
      });
    }

    return result;
  }, [relation, entityType, cases, galleries, videos, locale, getLocalizedCase, l]);

  if (!cards.length) return null;

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

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-7">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            {l('Один проєкт — усі матеріали', 'Один проект — все материалы', 'One project — all media')}
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {l('Пов’язані матеріали проєкту', 'Связанные материалы проекта', 'Related project content')}
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(card => (
            <Link key={`${card.type}-${card.id}`} to={card.path} className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
              <div className="aspect-video overflow-hidden bg-slate-200">
                {card.image ? (
                  <ResponsiveImage src={card.image} alt={card.title} displayWidth={900} sizes="(max-width: 768px) 100vw, 33vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">{iconFor(card.type)}</div>
                )}
              </div>
              <div className="p-5">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-600">{iconFor(card.type)}{labelFor(card.type)}</div>
                <h3 className="mt-2 text-lg font-black text-slate-950">{card.title}</h3>
                {card.subtitle && <p className="mt-1 text-sm text-slate-500">{card.subtitle}</p>}
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700">{l('Відкрити', 'Открыть', 'Open')}<ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
