import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Play, Radio, Video, X } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CaseStudy } from '../../types';
import { INITIAL_CASES } from '../../data/initialCases';
import { useSiteContent } from '../../context/SiteContentContext';

type Filter = 'ALL' | 'LIVE' | 'VIDEO' | 'CONSTRUCTION';

function categoryIcon(category: CaseStudy['category']) {
  if (category === 'LIVE') return Radio;
  if (category === 'CONSTRUCTION') return Building2;
  return Video;
}

export function FeaturedCases() {
  const { isUk, getLocalizedCase, l } = useSiteContent();
  const [cases, setCases] = useState<CaseStudy[]>(INITIAL_CASES);
  const [selectedFilter, setSelectedFilter] = useState<Filter>('ALL');
  const [activeCase, setActiveCase] = useState<CaseStudy | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'cases'),
      snapshot => {
        if (snapshot.empty) {
          setCases(INITIAL_CASES);
          return;
        }
        const loaded = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy));
        setCases(loaded);
      },
      error => {
        console.warn('Could not load featured cases, using bundled fallback:', error.message);
        setCases(INITIAL_CASES);
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
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden" id="cases-section">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              {l("Портфоліо проєктів", "Портфолио проектов")}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {l("Обрані кейси студії", "Избранные кейсы студии")}
            </h2>
            <p className="mt-3 text-slate-400 max-w-2xl">
              {l("Ті самі кейси, якими ви керуєте в адмін-панелі.", "Те же кейсы, которыми вы управляете в админ-панели.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-800 rounded-2xl border border-slate-700">
            {([
              ['ALL', l("Усі", "Все")],
              ['LIVE', 'LIVE'],
              ['VIDEO', 'VIDEO'],
              ['CONSTRUCTION', l("Будівництво", "Стройка")],
            ] as Array<[Filter, string]>).map(([id, label]) => (
              <button key={id} onClick={() => setSelectedFilter(id)} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${selectedFilter === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(item => {
            const Icon = categoryIcon(item.category);
            const problem = item.problem || item.challenge || item.description;
            const result = item.result || item.description;
            return (
              <article key={item.id} className="bg-slate-800/70 rounded-3xl overflow-hidden border border-slate-700 hover:border-indigo-500/50 transition-colors flex flex-col">
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 text-indigo-300 border border-indigo-500/30">
                    <Icon className="w-3.5 h-3.5" />{item.categoryLabel || item.category}
                  </div>
                  {item.videoBadge && <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-indigo-600 text-[11px] font-bold">{item.videoBadge}</div>}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-xs text-slate-400 mb-2">{l("Клієнт", "Клиент")}: <span className="text-slate-200 font-semibold">{item.client}</span></div>
                  <h3 className="text-lg font-bold leading-snug">{item.title}</h3>
                  <div className="mt-4 rounded-2xl bg-slate-950/40 p-4 text-xs text-slate-300 space-y-3 flex-1">
                    <div><div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">{l("Завдання", "Задача")}</div><p className="line-clamp-3">{problem}</p></div>
                    <div className="pt-3 border-t border-slate-800"><div className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-1">{l("Результат", "Результат")}</div><p className="line-clamp-3">{result}</p></div>
                  </div>
                  {item.metrics?.length ? (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {item.metrics.slice(0, 3).map(metric => <div key={`${metric.label}-${metric.value}`} className="text-center rounded-xl bg-slate-900/60 p-2"><div className="text-sm font-black text-indigo-400">{metric.value}</div><div className="text-[10px] text-slate-500 truncate">{metric.label}</div></div>)}
                    </div>
                  ) : null}
                  <button onClick={() => setActiveCase(item)} className="mt-5 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700 hover:bg-indigo-600 text-sm font-semibold transition-colors">
                    {l("Детальніше", "Подробнее")} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="text-center mt-14">
          <Link to="/cases" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-indigo-50">
            {l("Відкрити всі кейси", "Открыть все кейсы")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {activeCase && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setActiveCase(null)}>
          <div className="max-w-3xl mx-auto my-8 bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl" onClick={event => event.stopPropagation()}>
            {activeCase.imageUrl && <img src={activeCase.imageUrl} alt={activeCase.title} className="w-full aspect-[16/7] object-cover" />}
            <div className="p-6 sm:p-8 relative">
              <button onClick={() => setActiveCase(null)} className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700"><X className="w-5 h-5" /></button>
              <div className="text-xs uppercase tracking-wider font-bold text-indigo-400">{activeCase.categoryLabel || activeCase.category}</div>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 pr-12">{activeCase.title}</h3>
              <p className="text-sm text-slate-400 mt-2">{activeCase.client}</p>
              <div className="mt-7 space-y-5 text-sm text-slate-300 leading-relaxed">
                <div><h4 className="font-bold text-white mb-1">{l("Опис", "Описание")}</h4><p>{activeCase.description}</p></div>
                {(activeCase.challenge || activeCase.problem) && <div><h4 className="font-bold text-white mb-1">{l("Завдання", "Задача")}</h4><p>{activeCase.challenge || activeCase.problem}</p></div>}
                {activeCase.solution && <div><h4 className="font-bold text-white mb-1">{l("Рішення", "Решение")}</h4><p>{activeCase.solution}</p></div>}
                {activeCase.result && <div><h4 className="font-bold text-white mb-1">{l("Результат", "Результат")}</h4><p>{activeCase.result}</p></div>}
              </div>
              {activeCase.videoUrl && <a href={activeCase.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold"><Play className="w-4 h-4" />{l("Дивитися відео", "Смотреть видео")}</a>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
