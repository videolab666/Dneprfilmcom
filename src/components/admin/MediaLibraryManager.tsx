import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clipboard,
  Film,
  Images,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import { ResponsiveImage } from '../ResponsiveImage';
import { uploadLibraryImage, uploadLibraryVideo } from '../../lib/mediaUpload';
import {
  loadMediaLibrary,
  registerMediaAsset,
  removeMediaAssetRecord,
  type MediaAssetType,
  type MediaLibraryAsset,
} from '../../lib/mediaLibrary';

type UsageFilter = 'all' | 'used' | 'unused';

function formatBytes(value?: number): string {
  if (!value || value <= 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryManager() {
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<MediaAssetType | 'all'>('all');
  const [usage, setUsage] = useState<UsageFilter>('all');
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

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter(asset => {
      if (type !== 'all' && asset.assetType !== type) return false;
      if (usage === 'used' && asset.useCount === 0) return false;
      if (usage === 'unused' && asset.useCount > 0) return false;
      if (!normalized) return true;
      const haystack = [asset.name, asset.publicId, asset.url, ...asset.usages.map(item => `${item.sourceType} ${item.sourceTitle} ${item.field}`)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [assets, query, type, usage]);

  const stats = useMemo(() => ({
    total: assets.length,
    images: assets.filter(item => item.assetType === 'image').length,
    videos: assets.filter(item => item.assetType === 'video').length,
    unused: assets.filter(item => item.useCount === 0).length,
  }), [assets]);

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

  const removeRecord = async (asset: MediaLibraryAsset) => {
    if (asset.useCount > 0) return;
    if (!asset.registered) {
      window.alert('Файл найден в контенте автоматически и не имеет отдельной записи медиатеки.');
      return;
    }
    if (!window.confirm(`Убрать «${asset.name || 'media'}» из медиатеки? Сам файл в Cloudinary пока останется.`)) return;
    try {
      await removeMediaAssetRecord(asset);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Media Library</div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Медиатека сайта</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Единый каталог Cloudinary-файлов, которые уже используются в кейсах, фотогалереях, видеопроектах и настройках сайта. Новые файлы можно загрузить один раз и затем выбирать повторно.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => void uploadImages(event.target.files)} />
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" multiple className="hidden" onChange={event => void uploadVideos(event.target.files)} />
            <button type="button" disabled={uploading} onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-60"><Upload className="h-4 w-4" />Фото</button>
            <button type="button" disabled={uploading} onClick={() => videoInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"><Film className="h-4 w-4" />Видео</button>
            <button type="button" disabled={loading || uploading} onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Обновить</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-black text-slate-950">{stats.total}</div><div className="mt-1 text-xs font-semibold text-slate-500">Всего assets</div></div>
          <div className="rounded-2xl bg-indigo-50 p-4"><div className="text-2xl font-black text-indigo-700">{stats.images}</div><div className="mt-1 text-xs font-semibold text-indigo-600">Изображения</div></div>
          <div className="rounded-2xl bg-violet-50 p-4"><div className="text-2xl font-black text-violet-700">{stats.videos}</div><div className="mt-1 text-xs font-semibold text-violet-600">Видео</div></div>
          <div className="rounded-2xl bg-amber-50 p-4"><div className="text-2xl font-black text-amber-700">{stats.unused}</div><div className="mt-1 text-xs font-semibold text-amber-600">Не используются</div></div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по файлу, public ID или месту использования" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white" />
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1">{(['all', 'image', 'video'] as const).map(value => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${type === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>{value === 'all' ? 'Все' : value === 'image' ? 'Фото' : 'Видео'}</button>)}</div>
          <div className="flex rounded-xl bg-slate-100 p-1">{(['all', 'used', 'unused'] as const).map(value => <button key={value} type="button" onClick={() => setUsage(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${usage === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>{value === 'all' ? 'Любые' : value === 'used' ? 'Используются' : 'Свободные'}</button>)}</div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
        <div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Безопасность:</strong> браузер не получает Cloudinary API secret. Поэтому кнопка удаления сейчас удаляет только самостоятельную запись из медиатеки и доступна только для неиспользуемых файлов. Физическое удаление из Cloudinary будет подключено через server-side endpoint.</span></div>
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center text-sm text-slate-400">Файлы не найдены.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(asset => (
            <article key={asset.url} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                {asset.previewUrl ? <ResponsiveImage src={asset.previewUrl} alt={asset.name || ''} displayWidth={800} sizes="(max-width: 640px) 100vw, 33vw" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/30">{asset.assetType === 'video' ? <Film className="h-12 w-12" /> : <Images className="h-12 w-12" />}</div>}
                <div className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase text-white backdrop-blur">{asset.assetType}</div>
                <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black ${asset.useCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{asset.useCount > 0 ? `Используется ${asset.useCount}` : 'Свободен'}</div>
              </div>
              <div className="p-5">
                <h3 className="truncate text-sm font-black text-slate-950" title={asset.name}>{asset.name || 'media'}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>{asset.width && asset.height ? `${asset.width}×${asset.height}` : 'размер —'}</span>
                  <span>{formatBytes(asset.bytes)}</span>
                  {asset.format && <span>{asset.format.toUpperCase()}</span>}
                </div>
                {asset.publicId && <div className="mt-2 truncate rounded-lg bg-slate-50 px-2.5 py-2 font-mono text-[10px] text-slate-500" title={asset.publicId}>{asset.publicId}</div>}

                <div className="mt-4 space-y-2">
                  {asset.usages.slice(0, 4).map((item, index) => <div key={`${item.sourceId}-${item.field}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"><div className="text-[10px] font-black uppercase text-indigo-600">{item.sourceType}</div><div className="mt-0.5 truncate text-xs font-semibold text-slate-700" title={item.sourceTitle}>{item.sourceTitle}</div><div className="mt-0.5 truncate font-mono text-[9px] text-slate-400" title={item.field}>{item.field}</div></div>)}
                  {asset.usages.length > 4 && <div className="text-[10px] font-semibold text-slate-400">+ ещё {asset.usages.length - 4}</div>}
                </div>

                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => void copyUrl(asset.url)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Clipboard className="h-3.5 w-3.5" />URL</button>
                  <button type="button" onClick={() => void removeRecord(asset)} disabled={asset.useCount > 0 || !asset.registered} title={asset.useCount > 0 ? 'Сначала уберите файл из всех материалов' : !asset.registered ? 'Файл обнаружен автоматически и не имеет самостоятельной записи' : 'Убрать запись из медиатеки'} className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
