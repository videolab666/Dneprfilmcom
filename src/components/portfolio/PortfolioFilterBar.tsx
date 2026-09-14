import { useMemo } from 'react';
import { Search, Tags, X } from 'lucide-react';
import {
  PORTFOLIO_CATEGORIES,
  getPortfolioCategory,
  getPortfolioCategoryLabel,
  getPortfolioTags,
  type PortfolioCategoryId,
  type PortfolioLocale,
} from '../../lib/portfolioTaxonomy';

interface PortfolioFilterBarProps {
  items: unknown[];
  locale: PortfolioLocale;
  category: PortfolioCategoryId | 'all';
  tag: string;
  query: string;
  onCategoryChange: (value: PortfolioCategoryId | 'all') => void;
  onTagChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  sticky?: boolean;
}

function text(locale: PortfolioLocale, uk: string, ru: string, en: string): string {
  if (locale === 'uk') return uk;
  if (locale === 'en') return en;
  return ru;
}

export function PortfolioFilterBar({
  items,
  locale,
  category,
  tag,
  query,
  onCategoryChange,
  onTagChange,
  onQueryChange,
  sticky = true,
}: PortfolioFilterBarProps) {
  const categoryCounts = useMemo(() => {
    const map = new Map<PortfolioCategoryId, number>();
    for (const item of items) {
      const id = getPortfolioCategory(item);
      map.set(id, (map.get(id) || 0) + 1);
    }
    return map;
  }, [items]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const itemTag of getPortfolioTags(item)) {
        counts.set(itemTag, (counts.get(itemTag) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 16)
      .map(([name]) => name);
  }, [items]);

  const hasActiveFilters = category !== 'all' || tag !== 'all' || Boolean(query.trim());

  const reset = () => {
    onCategoryChange('all');
    onTagChange('all');
    onQueryChange('');
  };

  return (
    <section className={`${sticky ? 'sticky top-20 z-20' : ''} border-b border-slate-200 bg-white/95 py-4 shadow-sm backdrop-blur-md`}>
      <div className="mx-auto max-w-7xl space-y-3 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            <button
              type="button"
              onClick={() => onCategoryChange('all')}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${category === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {text(locale, 'Усі', 'Все', 'All')} · {items.length}
            </button>
            {PORTFOLIO_CATEGORIES.filter(item => (categoryCounts.get(item.id) || 0) > 0).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onCategoryChange(item.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${category === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {getPortfolioCategoryLabel(item.id, locale)} · {categoryCounts.get(item.id) || 0}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={event => onQueryChange(event.target.value)}
              placeholder={text(locale, 'Пошук у портфоліо…', 'Поиск по портфолио…', 'Search portfolio…')}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-9 text-xs outline-none transition focus:border-indigo-500 focus:bg-white"
            />
            {query && (
              <button type="button" onClick={() => onQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {(tags.length > 0 || hasActiveFilters) && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <Tags className="h-3.5 w-3.5" />
              {text(locale, 'Теги', 'Теги', 'Tags')}
            </span>
            {tags.length > 0 && (
              <button type="button" onClick={() => onTagChange('all')} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${tag === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {text(locale, 'Усі', 'Все', 'All')}
              </button>
            )}
            {tags.map(item => (
              <button key={item} type="button" onClick={() => onTagChange(item)} className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${tag === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {item}
              </button>
            ))}
            {hasActiveFilters && (
              <button type="button" onClick={reset} className="ml-auto shrink-0 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50">
                {text(locale, 'Скинути', 'Сбросить', 'Reset')}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
