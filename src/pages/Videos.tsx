import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onSnapshot } from 'firebase/firestore';
import { ArrowRight, CalendarDays, Film, MapPin, Play, Sparkles } from 'lucide-react';
import { publishedVideoProjectsQuery } from '../lib/publicPortfolioQueries';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { PortfolioFilterBar } from '../components/portfolio/PortfolioFilterBar';
import {
  getVideoProjectPath,
  isVideoProject,
  localizeVideoProject,
  sortVideoProjects,
  videoProjectCover,
  type VideoProject,
} from '../lib/videoPortfolio';
import { portfolioMatchesFilter, type PortfolioCategoryId } from '../lib/portfolioTaxonomy';
import { useSiteContent } from '../context/SiteContentContext';

function formatDate(value: string | undefined, locale: 'uk' | 'ru' | 'en'): string {
  if (!value) return '';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  const language = locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

export function Videos() {
  const { locale, l } = useSiteContent();
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<PortfolioCategoryId | 'all'>('all');
  const [tag, setTag] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(publishedVideoProjectsQuery(), snapshot => {
      const loaded = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(isVideoProject)
        .filter(item => item.published !== false);
      setProjects(sortVideoProjects(loaded));
      setLoading(false);
    }, error => {
      console.warn('Could not load video portfolio:', error);
      setProjects([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const localized = useMemo(
    () => projects.map(project => localizeVideoProject(project, locale)),
    [projects, locale],
  );

  const filtered = useMemo(
    () => localized.filter(item => portfolioMatchesFilter(item, category, tag, query)),
    [localized, category, tag, query],
  );

  useEffect(() => {
    const title = l('Відеопортфоліо — Dneprfilm', 'Видеопортфолио — Dneprfilm', 'Video portfolio — Dneprfilm');
    const description = l(
      'Рекламні ролики, корпоративні фільми, репортажі, Reels та інші відеопроєкти студії Dneprfilm.',
      'Рекламные ролики, корпоративные фильмы, репортажи, Reels и другие видеопроекты студии Dneprfilm.',
      'Commercials, corporate films, reports, Reels and other video projects by Dneprfilm.',
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
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-indigo-600 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-amber-500 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              {l('Відеороботи студії', 'Видеоработы студии', 'Studio video work')}
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {l('Відеопортфоліо', 'Видеопортфолио', 'Video portfolio')}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-xl">
              {l(
                'Окремі відеопроєкти з повними версіями, тизерами, вертикальними роликами та додатковими матеріалами.',
                'Отдельные видеопроекты с полными версиями, тизерами, вертикальными роликами и дополнительными материалами.',
                'Individual video projects with full cuts, teasers, vertical edits and supporting media.',
              )}
            </p>
            <Link to="/video" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
              {l('Послуги відеопродакшну', 'Услуги видеопродакшна', 'Video production services')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <PortfolioFilterBar
        items={localized}
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
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3" aria-label={l('Завантаження відеопортфоліо', 'Загрузка видеопортфолио', 'Loading video portfolio')}>
              {[0, 1, 2].map(item => (
                <div key={item} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="aspect-video animate-pulse bg-slate-200" />
                  <div className="space-y-3 p-6">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Film className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-xl font-black text-slate-950">
                {localized.length ? l('Нічого не знайдено', 'Ничего не найдено', 'No projects found') : l('Відеопроєкти скоро з’являться', 'Видеопроекты скоро появятся', 'Video projects are coming soon')}
              </h2>
              {localized.length > 0 && <p className="mt-2 text-sm text-slate-500">{l('Змініть категорію, тег або пошуковий запит.', 'Измените категорию, тег или поисковый запрос.', 'Change the category, tag or search query.')}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(project => {
                const cover = videoProjectCover(project);
                const dateLabel = formatDate(project.date, locale);
                return (
                  <article key={project.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl">
                    <Link to={getVideoProjectPath(project)} className="relative block aspect-video overflow-hidden bg-slate-950">
                      {cover ? (
                        <ResponsiveImage src={cover} alt={project.title} displayWidth={900} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-950 to-slate-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-950 shadow-xl"><Play className="ml-0.5 h-6 w-6 fill-current" /></span>
                      </div>
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {project.category && <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">{project.category}</span>}
                        {project.featured && <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-slate-950">FEATURED</span>}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold backdrop-blur"><Film className="h-3.5 w-3.5" />{project.videos.length}</span>
                        {dateLabel && <span className="text-xs font-semibold text-white/90">{dateLabel}</span>}
                      </div>
                    </Link>
                    <div className="p-5 sm:p-6">
                      <h2 className="text-xl font-black tracking-tight text-slate-950">{project.title}</h2>
                      {project.client && <div className="mt-1 text-sm font-semibold text-indigo-600">{project.client}</div>}
                      {(project.location || dateLabel) && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                          {project.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{project.location}</span>}
                          {dateLabel && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{dateLabel}</span>}
                        </div>
                      )}
                      {project.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">{project.description}</p>}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(project.tags || []).slice(0, 4).map(tagName => <span key={tagName} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{tagName}</span>)}
                      </div>
                      <Link to={getVideoProjectPath(project)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-800">
                        {l('Дивитися проєкт', 'Смотреть проект', 'View project')} <ArrowRight className="h-4 w-4" />
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
