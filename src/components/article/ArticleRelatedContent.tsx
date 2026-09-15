import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Briefcase, Film, Images } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { getCasePath } from '../../lib/caseMedia';
import { GALLERY_KIND, getGalleryPath, isPhotoGallery, type PhotoGallery } from '../../lib/galleryContent';
import { VIDEO_PROJECT_KIND, getVideoProjectPath, isVideoProject, type VideoProject } from '../../lib/videoPortfolio';
import type { CaseStudy, Locale } from '../../types';
import { useSiteContent } from '../../context/SiteContentContext';

type RelatedKind = 'case' | 'gallery' | 'video';

interface RelatedCard {
  kind: RelatedKind;
  id: string;
  path: string;
  title: string;
  description: string;
  cover: string;
}

interface ArticleRelatedContentProps {
  raw: Record<string, unknown>;
}

function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map(item => item.trim()).filter(Boolean) : [];
}

function localized(data: Record<string, unknown>, base: string, locale: Locale): string {
  const fallback = typeof data[base] === 'string' ? String(data[base]) : '';
  if (locale === 'uk') return typeof data[`${base}_uk`] === 'string' && data[`${base}_uk`] ? String(data[`${base}_uk`]) : fallback;
  if (locale === 'en') return typeof data[`${base}_en`] === 'string' && data[`${base}_en`] ? String(data[`${base}_en`]) : (typeof data[`${base}_uk`] === 'string' ? String(data[`${base}_uk`]) : fallback);
  return fallback || (typeof data[`${base}_uk`] === 'string' ? String(data[`${base}_uk`]) : '');
}

function caseCover(data: Record<string, unknown>): string {
  return typeof data.imageUrl === 'string' ? data.imageUrl : '';
}

function galleryCover(data: Record<string, unknown>): string {
  if (typeof data.coverUrl === 'string' && data.coverUrl) return data.coverUrl;
  const first = Array.isArray(data.images) ? data.images[0] : null;
  return first && typeof first === 'object' && typeof (first as Record<string, unknown>).url === 'string' ? String((first as Record<string, unknown>).url) : '';
}

function videoCover(data: Record<string, unknown>): string {
  if (typeof data.coverUrl === 'string' && data.coverUrl) return data.coverUrl;
  const first = Array.isArray(data.videos) ? data.videos[0] : null;
  if (!first || typeof first !== 'object') return '';
  const record = first as Record<string, unknown>;
  return typeof record.posterUrl === 'string' ? record.posterUrl : '';
}

export function ArticleRelatedContent({ raw }: ArticleRelatedContentProps) {
  const { locale, l } = useSiteContent();
  const caseIds = useMemo(() => ids(raw.relatedCaseIds), [raw]);
  const galleryIds = useMemo(() => ids(raw.relatedGalleryIds), [raw]);
  const videoIds = useMemo(() => ids(raw.relatedVideoProjectIds), [raw]);
  const [records, setRecords] = useState<Array<{ kind: RelatedKind; id: string; data: Record<string, unknown> }>>([]);

  useEffect(() => {
    let cancelled = false;
    if (caseIds.length + galleryIds.length + videoIds.length === 0) {
      setRecords([]);
      return;
    }

    const load = async () => {
      const requests = [
        ...caseIds.map(async id => ({ kind: 'case' as const, id, snapshot: await getDoc(doc(db, 'cases', id)) })),
        ...galleryIds.map(async id => ({ kind: 'gallery' as const, id, snapshot: await getDoc(doc(db, 'site_settings', id)) })),
        ...videoIds.map(async id => ({ kind: 'video' as const, id, snapshot: await getDoc(doc(db, 'site_settings', id)) })),
      ];
      const loaded = await Promise.all(requests);
      if (cancelled) return;
      setRecords(loaded.flatMap(item => {
        if (!item.snapshot.exists()) return [];
        const data = item.snapshot.data() as Record<string, unknown>;
        if (data.published === false) return [];
        if (item.kind === 'gallery' && data.kind !== GALLERY_KIND) return [];
        if (item.kind === 'video' && data.kind !== VIDEO_PROJECT_KIND) return [];
        return [{ kind: item.kind, id: item.id, data }];
      }));
    };

    void load().catch(error => console.warn('Could not load related article portfolio content:', error));
    return () => { cancelled = true; };
  }, [caseIds, galleryIds, videoIds]);

  const cards = useMemo<RelatedCard[]>(() => records.flatMap(record => {
    const title = localized(record.data, 'title', locale);
    if (!title) return [];
    if (record.kind === 'case') {
      const item = { id: record.id, ...record.data } as unknown as CaseStudy;
      return [{ kind: record.kind, id: record.id, path: getCasePath(item), title, description: localized(record.data, 'description', locale), cover: caseCover(record.data) }];
    }
    if (record.kind === 'gallery') {
      const item = { id: record.id, ...record.data };
      if (!isPhotoGallery(item)) return [];
      return [{ kind: record.kind, id: record.id, path: getGalleryPath(item as PhotoGallery), title, description: localized(record.data, 'description', locale), cover: galleryCover(record.data) }];
    }
    const item = { id: record.id, ...record.data };
    if (!isVideoProject(item)) return [];
    return [{ kind: record.kind, id: record.id, path: getVideoProjectPath(item as VideoProject), title, description: localized(record.data, 'description', locale), cover: videoCover(record.data) }];
  }), [records, locale]);

  if (cards.length === 0) return null;

  const icon = (kind: RelatedKind) => kind === 'case' ? <Briefcase className="h-3.5 w-3.5" /> : kind === 'gallery' ? <Images className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />;
  const kindLabel = (kind: RelatedKind) => kind === 'case' ? l('Кейс', 'Кейс', 'Case') : kind === 'gallery' ? l('Галерея', 'Галерея', 'Gallery') : l('Відео', 'Видео', 'Video');

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">{l('Пов’язані матеріали', 'Связанные материалы', 'Related work')}</div>
          <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{l('Дивіться також у портфоліо', 'Смотрите также в портфолио', 'Explore related portfolio work')}</h2>
        </div>
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(card => (
            <Link key={`${card.kind}:${card.id}`} to={card.path} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl">
              <div className="aspect-[16/10] overflow-hidden bg-slate-900">{card.cover ? <img src={card.cover} alt={card.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-white/30">{icon(card.kind)}</div>}</div>
              <div className="p-5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600">{icon(card.kind)}{kindLabel(card.kind)}</div>
                <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-950">{card.title}</h3>
                {card.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{card.description}</p>}
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">{l('Відкрити', 'Открыть', 'Open')}<ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
