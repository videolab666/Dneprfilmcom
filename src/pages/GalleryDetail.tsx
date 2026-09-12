import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, CalendarDays, Images, MapPin } from 'lucide-react';
import { db } from '../lib/firebase';
import {
  GALLERY_COLLECTION,
  galleryCover,
  getGallerySlug,
  isPhotoGallery,
  localizeGallery,
  type PhotoGallery,
} from '../lib/galleryContent';
import { useSiteContent } from '../context/SiteContentContext';
import { GalleryGrid } from '../components/galleries/GalleryGrid';

function formatGalleryDate(value: string | undefined, locale: 'uk' | 'ru' | 'en'): string {
  if (!value) return '';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  const language = locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

export function GalleryDetail() {
  const { slug = '' } = useParams();
  const { locale, l } = useSiteContent();
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const unsubscribe = onSnapshot(collection(db, GALLERY_COLLECTION), snapshot => {
      const loaded = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(isPhotoGallery);
      setGalleries(loaded);
      setLoading(false);
    }, error => {
      console.warn('Could not load photo gallery:', error);
      setGalleries([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [slug]);

  const rawGallery = useMemo(() => {
    const decoded = decodeURIComponent(slug);
    return galleries.find(item => item.published !== false && (getGallerySlug(item) === decoded || item.id === decoded)) || null;
  }, [galleries, slug]);

  const gallery = rawGallery ? localizeGallery(rawGallery, locale) : null;
  const cover = gallery ? galleryCover(gallery) : '';
  const dateLabel = gallery ? formatGalleryDate(gallery.date, locale) : '';

  useEffect(() => {
    if (!gallery) return;
    const title = `${gallery.title} — Dneprfilm`;
    const description = gallery.description || l(
      `Фотогалерея «${gallery.title}»`,
      `Фотогалерея «${gallery.title}»`,
      `Photo gallery “${gallery.title}”`,
    );
    document.title = title;

    const setMeta = (selector: string, attr: string, attrValue: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', description.slice(0, 220));
    setMeta('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large');
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description.slice(0, 220));
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
    if (cover) setMeta('meta[property="og:image"]', 'property', 'og:image', cover);
  }, [gallery, cover, l]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-b-indigo-600" />
      </div>
    );
  }

  if (!gallery || !rawGallery) {
    return (
      <section className="min-h-[70vh] bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Images className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-3xl font-black text-slate-950">
            {l('Галерею не знайдено', 'Галерея не найдена', 'Gallery not found')}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {l(
              'Можливо, посилання застаріло або галерею ще не опубліковано.',
              'Возможно, ссылка устарела или галерея ещё не опубликована.',
              'The link may be outdated or the gallery has not been published yet.',
            )}
          </p>
          <Link to="/galleries" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500">
            <ArrowLeft className="h-4 w-4" />
            {l('До всіх галерей', 'Ко всем галереям', 'Back to galleries')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {cover && (
          <div className="absolute inset-0">
            <img src={cover} alt="" className="h-full w-full object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <Link to="/galleries" className="mb-9 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {l('Усі фотогалереї', 'Все фотогалереи', 'All photo galleries')}
          </Link>

          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
              <Images className="h-4 w-4" />
              {gallery.images.length} {l('фото', 'фото', 'photos')}
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{gallery.title}</h1>
            {gallery.description && <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-xl">{gallery.description}</p>}

            {(gallery.location || dateLabel) && (
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                {dateLabel && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{dateLabel}</span>}
                {gallery.location && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{gallery.location}</span>}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {gallery.images.length > 0 ? (
          <GalleryGrid images={gallery.images} galleryTitle={gallery.title} />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">
            {l('У цій галереї поки немає фотографій.', 'В этой галерее пока нет фотографий.', 'There are no photos in this gallery yet.')}
          </div>
        )}
      </section>
    </div>
  );
}
