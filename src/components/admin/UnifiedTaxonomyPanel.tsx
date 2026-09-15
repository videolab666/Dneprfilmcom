import { Tags } from 'lucide-react';
import {
  PORTFOLIO_CATEGORIES,
  getPortfolioCategory,
  getPortfolioTags,
  type PortfolioCategoryId,
} from '../../lib/portfolioTaxonomy';

interface UnifiedTaxonomyPanelProps {
  value: Record<string, unknown>;
  onPatch: (patch: Record<string, unknown>) => void;
  articleCategory?: string;
  onArticleCategoryChange?: (category: string) => void;
  articleCategories?: string[];
}

function taxonomyRecord(value: Record<string, unknown>): Record<string, unknown> {
  const taxonomy = value.taxonomy;
  return taxonomy && typeof taxonomy === 'object' ? taxonomy as Record<string, unknown> : {};
}

export function UnifiedTaxonomyPanel({
  value,
  onPatch,
  articleCategory,
  onArticleCategoryChange,
  articleCategories,
}: UnifiedTaxonomyPanelProps) {
  const taxonomy = taxonomyRecord(value);
  const category = (typeof taxonomy.category === 'string' ? taxonomy.category : getPortfolioCategory(value)) as PortfolioCategoryId;
  const tags = Array.isArray(taxonomy.tags) ? taxonomy.tags.map(String) : getPortfolioTags(value);

  const patchTaxonomy = (patch: Record<string, unknown>) => {
    onPatch({ taxonomy: { ...taxonomy, ...patch } });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-700"><Tags className="h-3.5 w-3.5" />Unified taxonomy</div>
          <h3 className="mt-2 text-lg font-black text-slate-950">Категория и теги</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Одинаковая taxonomy-модель используется Cases / Galleries / Videos и сохраняется рядом с материалом. Для Article дополнительно сохраняется его собственная категория Media Center.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-xs font-bold text-slate-700">
            Portfolio category
            <select value={category} onChange={event => patchTaxonomy({ category: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-sm">
              {PORTFOLIO_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.ru} · {item.en}</option>)}
            </select>
          </label>

          {articleCategory !== undefined && onArticleCategoryChange && articleCategories && (
            <label className="text-xs font-bold text-slate-700">
              Media Center category
              <select value={articleCategory} onChange={event => onArticleCategoryChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-sm">
                {articleCategories.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          )}

          <label className="text-xs font-bold text-slate-700 md:col-span-2">
            Теги через запятую
            <input
              value={tags.join(', ')}
              onChange={event => patchTaxonomy({ tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
              placeholder="live, 4K, medicine, drone, interview"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm"
            />
          </label>
        </div>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-44 xl:self-start">
        <div className="text-xs font-black uppercase tracking-wider text-slate-500">Итоговая taxonomy</div>
        <div className="mt-4 rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">
          <div><span className="text-violet-300">category</span>: {category}</div>
          <div className="mt-2"><span className="text-violet-300">tags</span>: [{tags.map(tag => `“${tag}”`).join(', ')}]</div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">Публичные фильтры портфолио уже читают <code className="rounded bg-slate-100 px-1 py-0.5">taxonomy.category</code> и <code className="rounded bg-slate-100 px-1 py-0.5">taxonomy.tags</code>, поэтому ручная категория имеет приоритет над автоопределением.</p>
      </aside>
    </div>
  );
}
