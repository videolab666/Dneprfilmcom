import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Clipboard,
  Database,
  Eye,
  Film,
  Images,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ResponsiveImage } from '../ResponsiveImage';
import { uploadLibraryImage, uploadLibraryVideo } from '../../lib/mediaUpload';
import {
  ensureMediaAssetRegistered,
  loadMediaLibrary,
  registerMediaAsset,
  removeMediaAssetRecord,
  type MediaAssetType,
  type MediaLibraryAsset,
} from '../../lib/mediaLibrary';

type UsageFilter = 'all' | 'used' | 'unused' | 'orphan' | 'duplicates';
type SortMode = 'newest' | 'oldest' | 'largest' | 'smallest' | 'usage' | 'name';

function formatBytes(value?: number): string {
  if (!value || value <= 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function duplicateFingerprint(asset: MediaLibraryAsset): string | undefined {
  if (asset.publicId) return `public:${asset.assetType}:${asset.publicId}`;
  if (asset.bytes && asset.width && asset.height) {
    return `meta:${asset.assetType}:${asset.bytes}:${asset.width}x${asset.height}:${asset.format || ''}`;
  }
  return undefined;
}

function sortAssets(items: MediaLibraryAsset[], mode: SortMode): MediaLibraryAsset[] {
  return [...items].sort((a, b) => {
    if (mode === 'oldest') return (a.createdAt || Number.MAX_SAFE_INTEGER) - (b.createdAt || Number.MAX_SAFE_INTEGER);
    if (mode === 'largest') return (b.bytes || 0) - (a.bytes || 0);
    if (mode === 'smallest') return (a.bytes || Number.MAX_SAFE_INTEGER) - (b.bytes || Number.MAX_SAFE_INTEGER);
    if (mode === 'usage') return b.useCount - a.useCount || String(a.name || '').localeCompare(String(b.name || ''), 'ru');
    if (mode === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'ru');
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

export function MediaLibraryManager() {
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<MediaAssetType | 'all'>('all');
  const [usage, setUsage] = useState<UsageFilter>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<MediaLibraryAsset | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      setAssets(await loadMediaLibrary());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const duplicateInfo = useMemo(() => {
    const groups = new Map<string, MediaLibraryAsset[]>();
    for (const asset of assets) {
      const fingerprint = duplicateFingerprint(asset);
      if (!fingerprint) continue;
      const list = groups.get(fingerprint) || [];
      list.push(asset);
      groups.set(fingerprint, list);
    }
    const duplicateGroups = [...groups.values()].filter(group => group.length > 1);
    const urls = new Set(duplicateGroups.flatMap(group => group.map(asset => asset.url)));
    return { groups: duplicateGroups, urls };
  }, [assets]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const items = assets.filter(asset => {
      if (type !== 'all' && asset.assetType !== type) return false;
      if (usage === 'used' && asset.useCount === 0) return false;
      if (usage === 'unused' && asset.useCount > 0) return false;
      if (usage === 'orphan' && !(asset.registered && asset.useCount === 0)) return false;
      if (usage === 'duplicates' && !duplicateInfo.urls.has(asset.url)) return false;
      if (!normalized) return true;
      const haystack = [
        asset.name,
        asset.publicId,
        asset.url,
        asset.format,
        asset.width && asset.height ? `${asset.width}x${asset.height}` : '',
        ...asset.usages.map(item => `${item.sourceType} ${item.sourceTitle} ${item.sourceId} ${item.field}`),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
    return sortAssets(items, sort);
  }, [assets, duplicateInfo.urls, query, sort, type, usage]);

  const stats = useMemo(() => ({
    total: assets.length,
    images: assets.filter(item => item.assetType === 'image').length,
    videos: assets.filter(item => item.assetType === 'video').length,
    orphans: assets.filter(item => item.registered && item.useCount === 0).length,
    duplicateGroups: duplicateInfo.groups.length,
  }), [assets, duplicateInfo.groups.length]);

  const selectedAssets = useMemo(
    () => assets.filter(asset => selected.has(asset.url)),
    [assets, selected],
  );
  const selectedRegisterable = selectedAssets.filter(asset => !asset.registered);
  const selectedRemovable = selectedAssets.filter(asset => asset.registered && asset.useCount === 0);
  const allVisibleSelected = filtered.length > 0 && filtered.every(asset => selected.has(asset.url));

  useEffect(() => {
    const existing = new Set(assets.map(asset => asset.url));
    setSelected(current => {
      const next = new Set([...current].filter(url => existing.has(url)));
      return next.size === current.size ? current : next;
    });
  }, [assets]);

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files).slice(0, 30)) {
        const uploaded = await uploadLibraryImage(file);
        await registerMediaAsset(uploaded, file.name);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const uploadVideos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files).slice(0, 8)) {
        const uploaded = await uploadLibraryVideo(file);
        await registerMediaAsset(uploaded, file.name);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Скопируйте URL:', url);
    }
  };

  const toggleSelected = (url: string) => {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const toggleVisible = () => {
    setSelected(current => {
      const next = new Set(current);
      if (allVisibleSelected) filtered.forEach(asset => next.delete(asset.url));
      else filtered.forEach(asset => next.add(asset.url));
      return next;
    });
  };

  const removeRecord = async (asset: MediaLibraryAsset) => {
    if (asset.useCount > 0) return;
    if (!asset.registered) {
      window.alert('Файл найден в контенте автоматически и не имеет отдельной записи медиатеки.');
      return;
    }
    if (!window.confirm(`Убрать «${asset.name || 'media'}» из медиатеки? Сам файл в Cloudinary останется.`)) return;
    try {
      await removeMediaAssetRecord(asset);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const bulkRegister = async () => {
    if (!selectedRegisterable.length) return;
    setBulkBusy(true);
    setError('');
    try {
      for (const asset of selectedRegisterable) await ensureMediaAssetRegistered(asset);
      setSelected(new Set());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkRemoveRecords = async () => {
    if (!selectedRemovable.length) return;
    const names = selectedRemovable.slice(0, 4).map(asset => asset.name || 'media').join(', ');
    if (!window.confirm(`Убрать ${selectedRemovable.length} неиспользуемых записей из медиатеки?\n${names}${selectedRemovable.length > 4 ? '…' : ''}\n\nФайлы физически останутся в Cloudinary.`)) return;
    setBulkBusy(true);
    setError('');
    try {
      for (const asset of selectedRemovable) await removeMediaAssetRecord(asset);
      setSelected(new Set());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Media Library 3.0</div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Медиатека сайта</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Поиск использования, orphan-записей и возможных дублей. Можно массово регистрировать обнаруженные файлы и очищать неиспользуемые записи без передачи Cloudinary API secret в браузер.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => void uploadImages(event.target.files)} />
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" multiple className="hidden" onChange={event => void uploadVideos(event.target.files)} />
            <button type="button" disabled={uploading || bulkBusy} onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-60"><Upload className="h-4 w-4" />Фото</button>
            <button type="button" disabled={uploading || bulkBusy} onClick={() => videoInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"><Film className="h-4 w-4" />Видео</button>
            <button type="button" disabled={loading || uploading || bulkBusy} onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Обновить</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-black text-slate-950">{stats.total}</div><div className="mt-1 text-xs font-semibold text-slate-500">Всего assets</div></div>
          <div className="rounded-2xl bg-indigo-50 p-4"><div className="text-2xl font-black text-indigo-700">{stats.images}</div><div className="mt-1 text-xs font-semibold text-indigo-600">Изображения</div></div>
          <div className="rounded-2xl bg-violet-50 p-4"><div className="text-2xl font-black text-violet-700">{stats.videos}</div><div className="mt-1 text-xs font-semibold text-violet-600">Видео</div></div>
          <button type="button" onClick={() => setUsage('orphan')} className="rounded-2xl bg-amber-50 p-4 text-left transition hover:bg-amber-100"><div className="text-2xl font-black text-amber-700">{stats.orphans}</div><div className="mt-1 text-xs font-semibold text-amber-600">Orphan-записи</div></button>
          <button type="button" onClick={() => setUsage('duplicates')} className="rounded-2xl bg-rose-50 p-4 text-left transition hover:bg-rose-100"><div className="text-2xl font-black text-rose-700">{stats.duplicateGroups}</div><div className="mt-1 text-xs font-semibold text-rose-600">Группы дублей</div></button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Файл, public ID, формат, размер или место использования" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white" />
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1">{(['all', 'image', 'video'] as const).map(value => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${type === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>{value === 'all' ? 'Все' : value === 'image' ? 'Фото' : 'Видео'}</button>)}</div>
          <select value={usage} onChange={event => setUsage(event.target.value as UsageFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none">
            <option value="all">Любое использование</option><option value="used">Используются</option><option value="unused">Не используются</option><option value="orphan">Orphan registry</option><option value="duplicates">Возможные дубли</option>
          </select>
          <select value={sort} onChange={event => setSort(event.target.value as SortMode)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none">
            <option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option><option value="largest">Сначала большие</option><option value="smallest">Сначала маленькие</option><option value="usage">По использованию</option><option value="name">По имени</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={toggleVisible} disabled={!filtered.length} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">{allVisibleSelected ? 'Снять выбор видимых' : `Выбрать видимые (${filtered.length})`}</button>
          {selected.size > 0 && <button type="button" onClick={() => setSelected(new Set())} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">Очистить выбор</button>}
          <span className="text-xs font-semibold text-slate-400">Выбрано: {selected.size}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" disabled={bulkBusy || selectedRegisterable.length === 0} onClick={() => void bulkRegister()} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-35"><Database className="h-3.5 w-3.5" />Зарегистрировать ({selectedRegisterable.length})</button>
            <button type="button" disabled={bulkBusy || selectedRemovable.length === 0} onClick={() => void bulkRemoveRecords()} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-35"><Trash2 className="h-3.5 w-3.5" />Убрать записи ({selectedRemovable.length})</button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
        <div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Безопасность:</strong> очистка удаляет только registry-запись Firestore. Сам Cloudinary-файл остаётся. Для физического удаления нужен отдельный server-side endpoint с API secret; secret никогда не должен попадать в React.</span></div>
      </div>

      {loading || bulkBusy ? (
        <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center text-sm text-slate-400">Файлы не найдены.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(asset => {
            const possibleDuplicate = duplicateInfo.urls.has(asset.url);
            const orphan = asset.registered && asset.useCount === 0;
            return (
              <article key={asset.url} className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${selected.has(asset.url) ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  {asset.previewUrl ? <ResponsiveImage src={asset.previewUrl} alt={asset.name || ''} displayWidth={800} sizes="(max-width: 640px) 100vw, 33vw" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/30">{asset.assetType === 'video' ? <Film className="h-12 w-12" /> : <Images className="h-12 w-12" />}</div>}
                  <label className="absolute left-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/95 shadow"><input type="checkbox" checked={selected.has(asset.url)} onChange={() => toggleSelected(asset.url)} className="h-4 w-4 accent-indigo-600" aria-label={`Выбрать ${asset.name || 'media'}`} /></label>
                  <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
                    {orphan && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-800">ORPHAN</span>}
                    {possibleDuplicate && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-800">DUP?</span>}
                  </div>
                  <div className="absolute bottom-3 left-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase text-white backdrop-blur">{asset.assetType}</div>
                  <div className={`absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-black ${asset.useCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{asset.useCount > 0 ? `Используется ${asset.useCount}` : 'Не используется'}</div>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-2"><h3 className="min-w-0 flex-1 truncate text-sm font-black text-slate-950" title={asset.name}>{asset.name || 'media'}</h3>{!asset.registered && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[9px] font-black text-sky-700">DISCOVERED</span>}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"><span>{asset.width && asset.height ? `${asset.width}×${asset.height}` : 'размер —'}</span><span>{formatBytes(asset.bytes)}</span>{asset.format && <span>{asset.format.toUpperCase()}</span>}</div>
                  {asset.publicId && <div className="mt-2 truncate rounded-lg bg-slate-50 px-2.5 py-2 font-mono text-[10px] text-slate-500" title={asset.publicId}>{asset.publicId}</div>}

                  <div className="mt-4 space-y-2">
                    {asset.usages.slice(0, 2).map((item, index) => <div key={`${item.sourceId}-${item.field}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"><div className="text-[10px] font-black uppercase text-indigo-600">{item.sourceType}</div><div className="mt-0.5 truncate text-xs font-semibold text-slate-700" title={item.sourceTitle}>{item.sourceTitle}</div><div className="mt-0.5 truncate font-mono text-[9px] text-slate-400" title={item.field}>{item.field}</div></div>)}
                    {asset.usages.length > 2 && <button type="button" onClick={() => setDetails(asset)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">Показать все {asset.usages.length} использований</button>}
                    {asset.usages.length === 0 && <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />Нет ссылок из контента</div>}
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button type="button" onClick={() => void copyUrl(asset.url)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Clipboard className="h-3.5 w-3.5" />URL</button>
                    <button type="button" onClick={() => setDetails(asset)} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title="Все места использования"><Eye className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => void removeRecord(asset)} disabled={asset.useCount > 0 || !asset.registered} title={asset.useCount > 0 ? 'Сначала уберите файл из всех материалов' : !asset.registered ? 'Файл обнаружен автоматически' : 'Убрать registry-запись'} className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {details && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setDetails(null); }}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="text-xs font-black uppercase tracking-wider text-indigo-600">Media usages</div><h3 className="mt-1 truncate text-xl font-black text-slate-950">{details.name || 'media'}</h3><div className="mt-2 break-all font-mono text-[10px] text-slate-400">{details.publicId || details.url}</div></div><button type="button" onClick={() => setDetails(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 grid gap-2">
              {details.usages.length === 0 ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">Файл зарегистрирован, но ссылки на него в текущем контенте не найдены.</div> : details.usages.map((item, index) => <div key={`${item.sourceType}-${item.sourceId}-${item.field}-${index}`} className="rounded-2xl border border-slate-200 p-4"><div className="text-[10px] font-black uppercase text-indigo-600">{item.sourceType}</div><div className="mt-1 text-sm font-bold text-slate-900">{item.sourceTitle}</div><div className="mt-1 font-mono text-[10px] text-slate-500">ID: {item.sourceId}</div><div className="mt-1 break-all font-mono text-[10px] text-slate-400">{item.field}</div></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
