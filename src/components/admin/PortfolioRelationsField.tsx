import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Check,
  ExternalLink,
  Film,
  Images,
  Link2,
  Loader2,
  Search,
} from 'lucide-react';
import { getCaseSlug } from '../../lib/caseMedia';
import { galleryCover, getGalleryPath, type PhotoGallery } from '../../lib/galleryContent';
import {
  getVideoProjectPath,
  videoProjectCover,
  type VideoProject,
} from '../../lib/videoPortfolio';
import type { CaseStudy } from '../../types';
import {
  loadPortfolioRelationAdminData,
  savePortfolioRelationSelection,
  selectionForEntity,
  type PortfolioRelationAdminData,
  type PortfolioRelationEntityType,
  type PortfolioRelationSelection,
} from '../../lib/portfolioRelationsAdmin';

export interface PortfolioRelationsFieldHandle {
  save: () => Promise<void>;
  hasChanges: () => boolean;
}

interface PortfolioRelationsFieldProps {
  entityType: PortfolioRelationEntityType;
  entityId: string;
  entityTitle: string;
}

const EMPTY_SELECTION: PortfolioRelationSelection = {
  caseIds: [],
  galleryIds: [],
  videoProjectIds: [],
};

function normalizeSelection(selection: PortfolioRelationSelection): PortfolioRelationSelection {
  return {
    caseIds: Array.from(new Set(selection.caseIds)).sort(),
    galleryIds: Array.from(new Set(selection.galleryIds)).sort(),
    videoProjectIds: Array.from(new Set(selection.videoProjectIds)).sort(),
  };
}

function selectionKey(selection: PortfolioRelationSelection): string {
  return JSON.stringify(normalizeSelection(selection));
}

function caseTitle(item: CaseStudy): string {
  return item.title_uk || item.title || item.title_en || item.id;
}

function galleryTitle(item: PhotoGallery): string {
  return item.title_uk || item.title || item.title_en || item.id;
}

function videoTitle(item: VideoProject): string {
  return item.title_uk || item.title || item.title_en || item.id;
}

function matchesSearch(values: Array<string | undefined>, search: string): boolean {
  if (!search) return true;
  const haystack = values.filter(Boolean).join(' ').toLocaleLowerCase('uk-UA');
  return haystack.includes(search.toLocaleLowerCase('uk-UA'));
}

export const PortfolioRelationsField = forwardRef<PortfolioRelationsFieldHandle, PortfolioRelationsFieldProps>(
  function PortfolioRelationsField({ entityType, entityId, entityTitle }, ref) {
    const [data, setData] = useState<PortfolioRelationAdminData | null>(null);
    const [selection, setSelection] = useState<PortfolioRelationSelection>(EMPTY_SELECTION);
    const [baseline, setBaseline] = useState<PortfolioRelationSelection>(EMPTY_SELECTION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
      let active = true;
      setLoading(true);
      setError('');
      setSearch('');
      void loadPortfolioRelationAdminData()
        .then(nextData => {
          if (!active) return;
          const nextSelection = normalizeSelection(selectionForEntity(entityType, entityId, nextData.relations));
          setData(nextData);
          setSelection(nextSelection);
          setBaseline(nextSelection);
        })
        .catch(reason => {
          if (!active) return;
          console.error('Could not load portfolio relations:', reason);
          setError(reason instanceof Error ? reason.message : String(reason));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }, [entityId, entityType]);

    const dirty = selectionKey(selection) !== selectionKey(baseline);

    useImperativeHandle(ref, () => ({
      hasChanges: () => dirty,
      save: async () => {
        if (loading) throw new Error('Связи портфолио ещё загружаются. Повторите сохранение через секунду.');
        if (error) throw new Error(`Не удалось загрузить связи портфолио: ${error}`);
        if (!dirty) return;
        await savePortfolioRelationSelection(entityType, entityId, normalizeSelection(selection));
        setBaseline(normalizeSelection(selection));
      },
    }), [dirty, entityId, entityType, error, loading, selection]);

    const relationByCase = useMemo(
      () => new Map((data?.relations || []).map(item => [item.caseId, item])),
      [data],
    );

    const galleryUseCount = (id: string) => (data?.relations || []).filter(item => item.galleryIds.includes(id)).length;
    const videoUseCount = (id: string) => (data?.relations || []).filter(item => item.videoProjectIds.includes(id)).length;

    const toggle = (field: 'caseIds' | 'galleryIds' | 'videoProjectIds', id: string) => {
      setSelection(current => {
        const values = new Set(current[field]);
        if (values.has(id)) values.delete(id);
        else values.add(id);
        return { ...current, [field]: Array.from(values) };
      });
    };

    const filteredCases = useMemo(() => (data?.cases || [])
      .filter(item => matchesSearch([caseTitle(item), item.client, item.category, item.categoryLabel_uk, item.categoryLabel], search))
      .sort((a, b) => Number(selection.caseIds.includes(b.id)) - Number(selection.caseIds.includes(a.id))), [data, search, selection.caseIds]);

    const filteredGalleries = useMemo(() => (data?.galleries || [])
      .filter(item => matchesSearch([galleryTitle(item), item.location_uk, item.location, item.description_uk, item.description], search))
      .sort((a, b) => Number(selection.galleryIds.includes(b.id)) - Number(selection.galleryIds.includes(a.id))), [data, search, selection.galleryIds]);

    const filteredVideos = useMemo(() => (data?.videos || [])
      .filter(item => matchesSearch([videoTitle(item), item.client_uk, item.client, item.category_uk, item.category, item.description_uk], search))
      .sort((a, b) => Number(selection.videoProjectIds.includes(b.id)) - Number(selection.videoProjectIds.includes(a.id))), [data, search, selection.videoProjectIds]);

    return (
      <section className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-700">
              <Link2 className="h-4 w-4" />Связанные материалы
            </div>
            <h4 className="mt-2 text-base font-black text-slate-950">{entityTitle || 'Без названия'}</h4>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
              Связи сохраняются вместе с основной карточкой. Можно искать по названию/клиенту, видеть превью и сразу понимать, где материал уже используется.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {entityType === 'case' ? (
              <>
                <span className="rounded-lg bg-fuchsia-100 px-2.5 py-1.5 text-fuchsia-700">{selection.galleryIds.length} фото</span>
                <span className="rounded-lg bg-indigo-100 px-2.5 py-1.5 text-indigo-700">{selection.videoProjectIds.length} видео</span>
              </>
            ) : (
              <span className="rounded-lg bg-indigo-100 px-2.5 py-1.5 text-indigo-700">Используется в {selection.caseIds.length} кейсах</span>
            )}
            {dirty && <span className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-amber-800">Есть несохранённые связи</span>}
          </div>
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Поиск по названию, клиенту, категории…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Загрузка связей…</div>
        ) : entityType === 'case' ? (
          <div className="mt-5 grid gap-6 xl:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900"><Images className="h-4 w-4 text-fuchsia-600" />Фотогалереи</div>
              <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {filteredGalleries.length === 0 ? <div className="rounded-xl bg-white p-4 text-xs text-slate-500">Ничего не найдено.</div> : filteredGalleries.map(item => {
                  const selected = selection.galleryIds.includes(item.id);
                  const cover = galleryCover(item);
                  return (
                    <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${selected ? 'border-fuchsia-300 bg-fuchsia-50' : 'border-slate-200 bg-white'}`}>
                      <button type="button" onClick={() => toggle('galleryIds', item.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-fuchsia-600 bg-fuchsia-600 text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
                        <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <Images className="m-auto mt-3 h-6 w-6 text-slate-300" />}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{galleryTitle(item)}</span><span className="block text-[11px] text-slate-500">{item.published === false ? 'Черновик' : `${item.images.length} фото`} · используется в {galleryUseCount(item.id)} кейсах</span></span>
                      </button>
                      <Link to={getGalleryPath(item)} target="_blank" className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-indigo-600" title="Открыть галерею"><ExternalLink className="h-4 w-4" /></Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900"><Film className="h-4 w-4 text-indigo-600" />Видеопроекты</div>
              <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {filteredVideos.length === 0 ? <div className="rounded-xl bg-white p-4 text-xs text-slate-500">Ничего не найдено.</div> : filteredVideos.map(item => {
                  const selected = selection.videoProjectIds.includes(item.id);
                  const cover = videoProjectCover(item);
                  return (
                    <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${selected ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                      <button type="button" onClick={() => toggle('videoProjectIds', item.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
                        <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <Film className="m-auto mt-3 h-6 w-6 text-slate-300" />}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{videoTitle(item)}</span><span className="block text-[11px] text-slate-500">{item.published === false ? 'Черновик' : `${item.videos.length} видео`} · используется в {videoUseCount(item.id)} кейсах</span></span>
                      </button>
                      <Link to={getVideoProjectPath(item)} target="_blank" className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-indigo-600" title="Открыть видеопроект"><ExternalLink className="h-4 w-4" /></Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Briefcase className="h-4 w-4 text-indigo-600" />Связанные кейсы</div>
              <div className="text-[11px] text-slate-500">Обратная связь: видно, сколько фото/видео уже связано с каждым кейсом.</div>
            </div>
            <div className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {filteredCases.length === 0 ? <div className="rounded-xl bg-white p-4 text-xs text-slate-500">Ничего не найдено.</div> : filteredCases.map(item => {
                const selected = selection.caseIds.includes(item.id);
                const relation = relationByCase.get(item.id);
                return (
                  <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${selected ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                    <button type="button" onClick={() => toggle('caseIds', item.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
                      <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <Briefcase className="m-auto mt-3 h-6 w-6 text-slate-300" />}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{caseTitle(item)}</span><span className="block truncate text-[11px] text-slate-500">{item.client || item.category} · {relation?.galleryIds.length || 0} фото / {relation?.videoProjectIds.length || 0} видео</span></span>
                    </button>
                    <Link to={`/cases/${getCaseSlug(item)}`} target="_blank" className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-indigo-600" title="Открыть кейс"><ExternalLink className="h-4 w-4" /></Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    );
  },
);
