import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Radio, Video } from 'lucide-react';
import { onSnapshot } from 'firebase/firestore';
import { publishedCasesQuery } from '../../lib/publicPortfolioQueries';
import type { CaseStudy } from '../../types';
import { INITIAL_CASES } from '../../data/initialCases';
import { getCasePath, getMediaPreview, normalizedCaseMedia } from '../../lib/caseMedia';
import { useSiteContent } from '../../context/SiteContentContext';

type Filter = 'ALL' | 'LIVE' | 'VIDEO' | 'CONSTRUCTION';

function categoryIcon(category: CaseStudy['category']) {
  if (category === 'LIVE') return Radio;
  if (category === 'CONSTRUCTION') return Building2;
  return Video;
}

function coverForCase(item: CaseStudy): string | undefined {
  if (item.imageUrl) return item.imageUrl;
  return normalizedCaseMedia(item).map(getMediaPreview).find(Boolean) || undefined;
}

export function FeaturedCases() {
  const { getLocalizedCase, l } = useSiteContent();
  const [cases, setCases] = useState<CaseStudy[]>(INITIAL_CASES);
  const [selectedFilter, setSelectedFilter] = useState<Filter>('ALL');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      publishedCasesQuery(),
      snapshot => {
        const loaded = snapshot.empty
          ? INITIAL_CASES
          : snapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy));
        setCases(loaded.filter(item => item.published !== false));
      },
      error => {
        console.warn('Could not load featured cases, using bundled fallback:', error.message);
        setCases(INITIAL_CASES.filter(item => item.published !== false));
      },
    );
    return () => unsubscribe();
  }, []);

  const featuredCases = useMemo(() => {
    const localized = cases.map(item => getLocalizedCase(item));
    const explicitlyFeatured = localized.filter(item => item.featured === true);
    const pool = explicitlyFeatured.length ? explicitlyFeatured : localized.filter(item => item.featured !== false);
    return [...pool]
      .sort((a, b) => {
        const orderA = a.featuredOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.featuredOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return (b.createdAt || 0) - (a.createdAt || 0);
      })
      .slice(0, 6);
  }, [cases, getLocalizedCase]);

  const filtered = featuredCases.filter(item => selectedFilter === 'ALL' || item.category === selectedFilter);

  return (
    <section className="relative overflow-hidden bg-slate-900 py-24 text-white" id="cases-section">
      <div className="pointer-events-none absolute right-1/4 top-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {l('Портфоліо проєктів', 'Портфолио проектов', 'Project portfolio')}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {l('Обрані кейси студії', 'Избранные кейсы студии', 'Featured case studies')}
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              {l('Ключові роботи з повними сторінками, фото та відео.', 'Ключевые работы с полноценными страницами, фото и видео.', 'Selected projects with full case pages, photography and video.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-700 bg-slate-800 p-1.5">
            {([
              ['ALL', l('Усі', 'Все', 'All')],
              ['LIVE', 'LIVE'],
              ['VIDEO', 'VIDEO'],
              ['CONSTRUCTION', l('Будівництво', 'Стройка', 'Construction')],
            ] as Array<[Filter, string]>).map(([id, label]) => (
              <button key={id} onClick={() => setSelectedFilter(id)} className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${selectedFilter === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => {
            const Icon = categoryIcon(item.category);
            const problem = item.problem || item.challenge || item.description;
            const result = item.result || item.description;
            const cover = coverForCase(item);
            return (
              <article key={item.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-800/70 transition-colors hover:border-indigo-500/50">
                <Link to={getCasePath(item)} className="relative block aspect-[16/10] overflow-hidden bg-slate-950">
                  {cover && <img src={cover} alt={item.title} className="h-full w-full object-cover opacity-80 transition duration-500 hover:scale-105" loading="lazy" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-slate-950/80 px-3 py-1 text-xs font-bold text-indigo-300">
                    <Icon className="h-3.5 w-3.5" />{item.categoryLabel || item.category}
                  </div>
                  {item.videoBadge && <div className="absolute right-4 top-4 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold">{item.videoBadge}</div>}
                </Link>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-2 text-xs text-slate-400">{l('Клієнт', 'Клиент', 'Client')}: <span className="font-semibold text-slate-200">{item.client}</span></div>
                  <Link to={getCasePath(item)} className="text-lg font-bold leading-snug transition hover:text-indigo-300">{item.title}</Link>
                  <div className="mt-4 flex-1 space-y-3 rounded-2xl bg-slate-950/40 p-4 text-xs text-slate-300">
                    <div><div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{l('Завдання', 'Задача', 'Challenge')}</div><p className="line-clamp-3">{problem}</p></div>
                    <div className="border-t border-slate-800 pt-3"><div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">{l('Результат', 'Результат', 'Result')}</div><p className="line-clamp-3">{result}</p></div>
                  </div>
                  {item.metrics?.length ? (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {item.metrics.slice(0, 3).map(metric => <div key={`${metric.label}-${metric.value}`} className="rounded-xl bg-slate-900/60 p-2 text-center"><div className="text-sm font-black text-indigo-400">{metric.value}</div><div className="truncate text-[10px] text-slate-500">{metric.label}</div></div>)}
                    </div>
                  ) : null}
                  <Link to={getCasePath(item)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-700 py-2.5 text-sm font-semibold transition-colors hover:bg-indigo-600">
                    {l('Дивитися кейс', 'Смотреть кейс', 'View case')} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <Link to="/cases" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-900 hover:bg-indigo-50">
            {l('Відкрити всі кейси', 'Открыть все кейсы', 'Open all case studies')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
