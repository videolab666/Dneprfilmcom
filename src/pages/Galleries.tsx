import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onSnapshot } from 'firebase/firestore';
import { ArrowRight, CalendarDays, Images, MapPin, Sparkles } from 'lucide-react';
import { publishedGalleriesQuery } from '../lib/publicPortfolioQueries';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { PortfolioFilterBar } from '../components/portfolio/PortfolioFilterBar';
import {
  galleryCover,
  getGalleryPath,
  isPhotoGallery,
  localizeGallery,
  sortGalleries,
  type PhotoGallery,
} from '../lib/galleryContent';
import { portfolioMatchesFilter, type PortfolioCategoryId } from '../lib/portfolioTaxonomy';
import { useSiteContent } from '../context/SiteContentContext';

function formatGalleryDate(value: string | undefined, locale: 'uk' | 'ru' | 'en'): string {
  if (!value) return '';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  const language = locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

export function Galleries() {
  const { locale, l } = useSiteContent();
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<PortfolioCategoryId | 'all'>('all');
  const [tag, setTag] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(publishedGalleriesQuery(), snapshot => {
      const loaded = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(isPhotoGallery)
        .filter(item => item.published !== false);
      setGalleries(sortGalleries(loaded));
      setLoading(false);
    }, error => {
      console.warn('Could not load photo galleries:', error);
      setGalleries([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const localizedGalleries = useMemo(
    () => galleries.map(gallery => localizeGallery(gallery, locale)),
    [galleries, locale],
  );

  const filteredGalleries = useMemo(
    () => localizedGalleries.filter(gallery => portfolioMatchesFilter(gallery, category, tag, query)),
    [localizedGalleries, category, tag, query],
  );

  useEffect(() => {
    const title = l('Фотогалереї — Dneprfilm', 'Фотогалереи — Dneprfilm', 'Photo galleries — Dneprfilm');
    const description = l(
      'Фоторепортажі зі зйомок, подій, спортивних турнірів, трансляцій та комерційних проєктів Dneprfilm.',
      'Фоторепортажи со съёмок, событий, спортивных турниров, трансляций и коммерческих проектов Dneprfilm.',
      'Photo reports from productions, events, sports tournaments, broadcasts and commercial projects by Dneprfilm.',
    );
    document.title = title;
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [l, locale]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-indigo-600 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-fuchsia-500 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              {l('Фоторепортажі студії', 'Фоторепортажи студии', 'Studio photo reports')}
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {l('Фотогалереї', 'Фотогалереи', 'Photo galleries')}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-xl">
              {l(
                'Окремі добірки фотографій зі зйомок, спортивних подій, трансляцій, бекстейджу та комерційних проєктів.',
                'Отдельные подборки фотографий со съёмок, спортивных событий, трансляций, бэкстейджа и коммерческих проектов.',
                'Curated photo sets from productions, sports events, broadcasts, backstage work and commercial projects.',
              )}
            </p>
          </div>
        </div>
      </section>

      <PortfolioFilterBar
        items={localizedGalleries}
        locale={locale}
        category={category}
        tag={tag}
        query={query}
        onCategoryChange={setCategory}
        onTagChange={setTag}
        onQueryChange={setQuery}
      />

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3" aria-label={l('Завантаження фотогалерей', 'Загрузка фотогалерей', 'Loading photo galleries')}>
              {[0, 1, 2].map(item => (
                <div key={item} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="aspect-[4/3] animate-pulse bg-slate-200" />
                  <div className="space-y-3 p-6">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : localizedGalleries.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Images className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-xl font-black text-slate-950">
                {l('Галереї скоро з’являться', 'Галереи скоро появятся', 'Galleries are coming soon')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {l(
                  'Нові фотодобірки можна публікувати безпосередньо з панелі адміністратора.',
                  'Новые фотоподборки можно публиковать прямо из панели администратора.',
                  'New photo sets can be published directly from the admin panel.',
                )}
              </p>
            </div>
          ) : filteredGalleries.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Images className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-xl font-black text-slate-950">{l('Нічого не знайдено', 'Ничего не найдено', 'Nothing found')}</h2>
              <p className="mt-2 text-sm text-slate-500">{l('Змініть категорію, тег або пошуковий запит.', 'Измените категорию, тег или поисковый запрос.', 'Change the category, tag or search query.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
              {filteredGalleries.map(gallery => {
                const cover = galleryCover(gallery);
                const dateLabel = formatGalleryDate(gallery.date, locale);
                return (
                  <article key={gallery.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl">
                    <Link to={getGalleryPath(gallery)} className="relative block aspect-[4/3] overflow-hidden bg-slate-900">
                      {cover ? (
                        <ResponsiveImage src={cover} alt={gallery.title} displayWidth={900} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-white/40">
                          <Images className="h-16 w-16" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
                          <Images className="h-3.5 w-3.5" /> {gallery.images.length}
                        </span>
                        {dateLabel && <span className="text-xs font-semibold text-white/90">{dateLabel}</span>}
                      </div>
                    </Link>
                    <div className="p-5 sm:p-6">
                      <h2 className="text-xl font-black tracking-tight text-slate-950">{gallery.title}</h2>
                      {(gallery.location || dateLabel) && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                          {gallery.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{gallery.location}</span>}
                          {dateLabel && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{dateLabel}</span>}
                        </div>
                      )}
                      {gallery.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">{gallery.description}</p>}
                      <Link to={getGalleryPath(gallery)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-800">
                        {l('Відкрити галерею', 'Открыть галерею', 'Open gallery')}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
