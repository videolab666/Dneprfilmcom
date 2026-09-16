import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, CheckCircle2, FileText, RotateCcw, Save, Search, SlidersHorizontal } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { EDITABLE_COPY_CATALOG, type EditableCopyCatalogEntry } from '../../generated/editableCopyCatalog';
import {
  DEFAULT_FULL_PAGE_CMS,
  normalizeFullPageCms,
  type EditableCopyOverride,
  type FullPageCmsConfig,
} from '../../lib/fullPageEditing';
import type { Locale } from '../../types';

const PAGE_LABELS: Record<string, string> = {
  home: 'Главная',
  live: 'LIVE',
  video: 'Video',
  construction: 'Construction',
  photo: 'Photo',
  about: 'About',
  contacts: 'Contacts',
  cases: 'Cases — каталог',
  'case-detail': 'Case — детальная',
  videos: 'Videos — каталог',
  'video-detail': 'Video — детальная',
  galleries: 'Galleries — каталог',
  'gallery-detail': 'Gallery — детальная',
  'media-center': 'Media Center',
  'article-detail': 'Article — детальная',
  layout: 'Шапка / подвал / навигация',
  'portfolio-ui': 'Общий интерфейс портфолио',
  common: 'Общие компоненты',
};

const LANGS: Array<{ key: Locale; label: string }> = [
  { key: 'uk', label: 'UA' },
  { key: 'ru', label: 'RU' },
  { key: 'en', label: 'EN' },
];

function cloneCms(value: FullPageCmsConfig): FullPageCmsConfig {
  return JSON.parse(JSON.stringify(value)) as FullPageCmsConfig;
}

function copyValue(entry: EditableCopyCatalogEntry, override: EditableCopyOverride | undefined, locale: Locale): string {
  const overridden = override?.[locale];
  if (typeof overridden === 'string') return overridden;
  return entry[locale];
}

function NumericField({ label, value, onChange, suffix = 'грн' }: { label: string; value: number; onChange: (value: number) => void; suffix?: string }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="block text-xs font-bold text-slate-600 mb-2">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={100}
          value={value}
          onChange={event => onChange(Math.max(0, Number(event.target.value) || 0))}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
        <span className="text-xs font-bold text-slate-400">{suffix}</span>
      </div>
    </label>
  );
}

export function FullPageEditingManager() {
  const { rawSettings, updateSettings } = useSiteContent();
  const [draft, setDraft] = useState<FullPageCmsConfig>(() => cloneCms(normalizeFullPageCms(rawSettings.fullPageCms)));
  const [activeTab, setActiveTab] = useState<'copy' | 'calculators'>('copy');
  const [page, setPage] = useState('all');
  const [query, setQuery] = useState('');
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [visibleCount, setVisibleCount] = useState(40);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(cloneCms(normalizeFullPageCms(rawSettings.fullPageCms)));
  }, [rawSettings.fullPageCms, dirty]);

  const pages = useMemo(() => {
    const values = new Set(EDITABLE_COPY_CATALOG.map(item => item.page));
    return [...values].sort((a, b) => (PAGE_LABELS[a] || a).localeCompare(PAGE_LABELS[b] || b));
  }, []);

  const changedCount = Object.keys(draft.copyOverrides).filter(key => {
    const value = draft.copyOverrides[key];
    return value && (value.uk !== undefined || value.ru !== undefined || value.en !== undefined);
  }).length;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return EDITABLE_COPY_CATALOG.filter(item => {
      if (page !== 'all' && item.page !== page) return false;
      if (onlyChanged && !draft.copyOverrides[item.id]) return false;
      if (!needle) return true;
      return [item.label, item.uk, item.ru, item.en, item.source, PAGE_LABELS[item.page] || item.page]
        .some(value => value.toLowerCase().includes(needle));
    });
  }, [draft.copyOverrides, onlyChanged, page, query]);

  const setCopy = (entry: EditableCopyCatalogEntry, locale: Locale, value: string) => {
    const next = cloneCms(draft);
    const current = next.copyOverrides[entry.id] || {};
    const defaultValue = entry[locale];
    if (value === defaultValue) {
      delete current[locale];
    } else {
      current[locale] = value;
    }
    if (current.uk === undefined && current.ru === undefined && current.en === undefined) delete next.copyOverrides[entry.id];
    else next.copyOverrides[entry.id] = current;
    setDraft(next);
    setDirty(true);
  };

  const resetEntry = (id: string) => {
    const next = cloneCms(draft);
    delete next.copyOverrides[id];
    setDraft(next);
    setDirty(true);
  };

  const setLive = (key: keyof FullPageCmsConfig['calculators']['live'], value: number) => {
    setDraft(current => ({ ...current, calculators: { ...current.calculators, live: { ...current.calculators.live, [key]: value } } }));
    setDirty(true);
  };

  const setVideoSimple = (key: 'base' | 'script' | 'actors' | 'drone' | 'voiceover' | 'graphics3d', value: number) => {
    setDraft(current => ({ ...current, calculators: { ...current.calculators, video: { ...current.calculators.video, [key]: value } } }));
    setDirty(true);
  };

  const setVideoType = (key: keyof FullPageCmsConfig['calculators']['video']['videoType'], value: number) => {
    setDraft(current => ({ ...current, calculators: { ...current.calculators, video: { ...current.calculators.video, videoType: { ...current.calculators.video.videoType, [key]: value } } } }));
    setDirty(true);
  };

  const setVideoDuration = (key: keyof FullPageCmsConfig['calculators']['video']['duration'], value: number) => {
    setDraft(current => ({ ...current, calculators: { ...current.calculators, video: { ...current.calculators.video, duration: { ...current.calculators.video.duration, [key]: value } } } }));
    setDirty(true);
  };

  const setConstruction = (key: keyof FullPageCmsConfig['calculators']['construction'], value: number) => {
    setDraft(current => ({ ...current, calculators: { ...current.calculators, construction: { ...current.calculators.construction, [key]: value } } }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSettings({ fullPageCms: draft } as any);
      setDirty(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const resetCalculators = () => {
    if (!window.confirm('Вернуть встроенные цены всех трёх калькуляторов?')) return;
    setDraft(current => ({ ...current, calculators: cloneCms(DEFAULT_FULL_PAGE_CMS).calculators }));
    setDirty(true);
  };

  const resetAllCopy = () => {
    if (!window.confirm('Удалить все текстовые переопределения Full Page CMS и вернуть встроенный текст сайта?')) return;
    setDraft(current => ({ ...current, copyOverrides: {} }));
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Full Page Editing 3.0</div>
            <h2 className="text-2xl font-black text-slate-900">Полное редактирование публичного сайта</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
              Все тексты, которые публичные страницы получают через l(), t() и legacy(), доступны здесь без правки JSX. Отдельно вынесены реальные коэффициенты калькуляторов LIVE, Video и Construction. В Firestore сохраняются только ваши отличия от встроенных значений.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Сохранено</span>}
            <button onClick={save} disabled={!dirty || saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40">
              <Save className="h-4 w-4" /> {saving ? 'Сохранение…' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button onClick={() => setActiveTab('copy')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${activeTab === 'copy' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          <FileText className="h-4 w-4" /> Тексты страниц <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-700">{EDITABLE_COPY_CATALOG.length}</span>
        </button>
        <button onClick={() => setActiveTab('calculators')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${activeTab === 'calculators' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          <Calculator className="h-4 w-4" /> Калькуляторы цен
        </button>
      </div>

      {activeTab === 'copy' && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <label className="relative block">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input value={query} onChange={event => { setQuery(event.target.value); setVisibleCount(40); }} placeholder="Найти текст, заголовок, страницу…" className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none" />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">
                <input type="checkbox" checked={onlyChanged} onChange={event => setOnlyChanged(event.target.checked)} /> Только изменённые ({changedCount})
              </label>
              <button onClick={resetAllCopy} disabled={changedCount === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30">
                <RotateCcw className="h-4 w-4" /> Сбросить тексты
              </button>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => { setPage('all'); setVisibleCount(40); }} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${page === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Все страницы</button>
              {pages.map(item => <button key={item} onClick={() => { setPage(item); setVisibleCount(40); }} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${page === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{PAGE_LABELS[item] || item}</button>)}
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500">Найдено: {filtered.length}. Пустая строка считается намеренным скрытием текста; кнопка «Сбросить» возвращает встроенное значение.</div>

          <div className="space-y-4">
            {filtered.slice(0, visibleCount).map(entry => {
              const override = draft.copyOverrides[entry.id];
              return (
                <div key={entry.id} className={`rounded-3xl border bg-white p-5 shadow-sm ${override ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">{PAGE_LABELS[entry.page] || entry.page}</span>
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">{entry.kind}</span>
                        {override && <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-700">изменено</span>}
                      </div>
                      <div className="mt-2 font-bold text-slate-900">{entry.label}</div>
                      <div className="mt-1 truncate text-[11px] text-slate-400">{entry.source}:{entry.line} · {entry.id}</div>
                    </div>
                    <button onClick={() => resetEntry(entry.id)} disabled={!override} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-25"><RotateCcw className="h-3.5 w-3.5" /> Сбросить</button>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-3">
                    {LANGS.map(language => (
                      <label key={language.key} className="block">
                        <span className="mb-1.5 block text-xs font-black text-slate-600">{language.label}</span>
                        <textarea
                          rows={Math.min(8, Math.max(2, Math.ceil(copyValue(entry, override, language.key).length / 70)))}
                          value={copyValue(entry, override, language.key)}
                          onChange={event => setCopy(entry, language.key, event.target.value)}
                          className={`w-full resize-y rounded-xl border px-3 py-2.5 text-sm leading-relaxed focus:outline-none ${override?.[language.key] !== undefined ? 'border-indigo-300 bg-indigo-50/40 focus:border-indigo-500' : 'border-slate-300 bg-white focus:border-indigo-500'}`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {visibleCount < filtered.length && <button onClick={() => setVisibleCount(count => count + 40)} className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">Показать ещё ({filtered.length - visibleCount})</button>}
        </div>
      )}

      {activeTab === 'calculators' && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            <div className="flex gap-3"><SlidersHorizontal className="mt-0.5 h-5 w-5 shrink-0" /><p><b>Это реальные коэффициенты.</b> Изменение влияет на расчёт суммы на публичных страницах и на сумму, которая записывается в CRM-заявку. Все значения неотрицательные.</p></div>
            <button onClick={resetCalculators} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-300 bg-white/70 px-3 py-2 text-xs font-black"><RotateCcw className="h-3.5 w-3.5" /> По умолчанию</button>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-black">LIVE — трансляции</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <NumericField label="Базовый сетап" value={draft.calculators.live.base} onChange={value => setLive('base', value)} />
              <NumericField label="Одна камера" value={draft.calculators.live.camera} onChange={value => setLive('camera', value)} />
              <NumericField label="Starlink / bonding" value={draft.calculators.live.starlink} onChange={value => setLive('starlink', value)} />
              <NumericField label="Графика / титры" value={draft.calculators.live.graphics} onChange={value => setLive('graphics', value)} />
              <NumericField label="Replay" value={draft.calculators.live.replay} onChange={value => setLive('replay', value)} />
              <NumericField label="Синхронный перевод" value={draft.calculators.live.translation} onChange={value => setLive('translation', value)} />
              <NumericField label="LED output" value={draft.calculators.live.led} onChange={value => setLive('led', value)} />
              <NumericField label="Надбавка: спорт" value={draft.calculators.live.sports} onChange={value => setLive('sports', value)} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-black">Video — видеопродакшн</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <NumericField label="Базовая съёмка + монтаж" value={draft.calculators.video.base} onChange={value => setVideoSimple('base', value)} />
              <NumericField label="Тип: реклама" value={draft.calculators.video.videoType.commercial} onChange={value => setVideoType('commercial', value)} />
              <NumericField label="Тип: завод" value={draft.calculators.video.videoType.factory} onChange={value => setVideoType('factory', value)} />
              <NumericField label="Тип: corporate" value={draft.calculators.video.videoType.corporate} onChange={value => setVideoType('corporate', value)} />
              <NumericField label="Тип: event" value={draft.calculators.video.videoType.event} onChange={value => setVideoType('event', value)} />
              <NumericField label="30 секунд" value={draft.calculators.video.duration['30s']} onChange={value => setVideoDuration('30s', value)} />
              <NumericField label="60 секунд" value={draft.calculators.video.duration['60s']} onChange={value => setVideoDuration('60s', value)} />
              <NumericField label="2 минуты" value={draft.calculators.video.duration['2m']} onChange={value => setVideoDuration('2m', value)} />
              <NumericField label="5+ минут" value={draft.calculators.video.duration['5m+']} onChange={value => setVideoDuration('5m+', value)} />
              <NumericField label="Сценарий" value={draft.calculators.video.script} onChange={value => setVideoSimple('script', value)} />
              <NumericField label="Актёры" value={draft.calculators.video.actors} onChange={value => setVideoSimple('actors', value)} />
              <NumericField label="Drone" value={draft.calculators.video.drone} onChange={value => setVideoSimple('drone', value)} />
              <NumericField label="Voice-over" value={draft.calculators.video.voiceover} onChange={value => setVideoSimple('voiceover', value)} />
              <NumericField label="3D / Motion graphics" value={draft.calculators.video.graphics3d} onChange={value => setVideoSimple('graphics3d', value)} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-black">Construction — мониторинг</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <NumericField label="Таймлапс-камера / месяц" value={draft.calculators.construction.timelapseCameraMonthly} onChange={value => setConstruction('timelapseCameraMonthly', value)} />
              <NumericField label="Дрон: раз в месяц" value={draft.calculators.construction.droneMonthly} onChange={value => setConstruction('droneMonthly', value)} />
              <NumericField label="Дрон: 2 раза / месяц" value={draft.calculators.construction.droneBiweekly} onChange={value => setConstruction('droneBiweekly', value)} />
              <NumericField label="Дрон: еженедельно" value={draft.calculators.construction.droneWeekly} onChange={value => setConstruction('droneWeekly', value)} />
              <NumericField label="Панорамы / месяц" value={draft.calculators.construction.windowPanoramasMonthly} onChange={value => setConstruction('windowPanoramasMonthly', value)} />
              <NumericField label="Reels / месяц" value={draft.calculators.construction.monthlyReels} onChange={value => setConstruction('monthlyReels', value)} />
              <NumericField label="Live stream / месяц" value={draft.calculators.construction.liveStreamMonthly} onChange={value => setConstruction('liveStreamMonthly', value)} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
