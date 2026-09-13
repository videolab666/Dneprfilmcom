import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clipboard,
  Cloud,
  Film,
  HardDrive,
  Images,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { ResponsiveImage } from '../ResponsiveImage';
import { uploadLibraryImage, uploadLibraryVideo, videoPosterUrl } from '../../lib/mediaUpload';
import {
  loadMediaLibrary,
  registerMediaAsset,
  removeMediaAssetRecord,
  type MediaAssetType,
  type MediaLibraryAsset,
} from '../../lib/mediaLibrary';
import {
  auditCloudinaryMedia,
  cloudinaryAdminErrorMessage,
  deleteCloudinaryMediaAsset,
  type CloudinaryAdminAsset,
  type CloudinaryAuditResult,
} from '../../lib/cloudinaryAdmin';

type UsageFilter = 'all' | 'used' | 'unused';

function formatBytes(value?: number): string {
  if (!value || value <= 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function assetName(asset: CloudinaryAdminAsset): string {
  const last = asset.publicId.split('/').pop() || asset.publicId;
  return last;
}

function remotePreview(asset: CloudinaryAdminAsset): string | undefined {
  return asset.resourceType === 'video' ? videoPosterUrl(asset.url) : asset.url;
}

export function MediaLibraryManager() {
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<MediaAssetType | 'all'>('all');
  const [usage, setUsage] = useState<UsageFilter>('all');
  const [cloudAudit, setCloudAudit] = useState<CloudinaryAuditResult | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [deletingRemote, setDeletingRemote] = useState('');
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

  const runCloudAudit = async () => {
    setCloudLoading(true);
    setError('');
    try {
      setCloudAudit(await auditCloudinaryMedia());
    } catch (err) {
      console.error(err);
      setError(cloudinaryAdminErrorMessage(err));
    } finally {
      setCloudLoading(false);
    }
  };

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

  const cloudByKey = useMemo(() => new Map(
    (cloudAudit?.assets || []).map(asset => [`${asset.resourceType}:${asset.publicId}`, asset] as const),
  ), [cloudAudit]);

  const orphanedRemote = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (cloudAudit?.assets || []).filter(asset => {
      if (asset.used) return false;
      if (type !== 'all' && asset.resourceType !== type) return false;
      if (!normalized) return true;
      return `${asset.publicId} ${asset.url}`.toLowerCase().includes(normalized);
    });
  }, [cloudAudit, query, type]);

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
    if (!window.confirm(`Убрать «${asset.name || 'media'}» только из индекса медиатеки? Файл в Cloudinary останется.`)) return;
    try {
      await removeMediaAssetRecord(asset);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const deleteRemote = async (asset: CloudinaryAdminAsset) => {
    if (asset.used) return;
    if (!window.confirm(`Физически удалить «${asset.publicId}» из Cloudinary? Это действие необратимо.`)) return;
    const key = `${asset.resourceType}:${asset.publicId}`;
    setDeletingRemote(key);
    setError('');
    try {
      await deleteCloudinaryMediaAsset(asset);
      await Promise.all([refresh(), runCloudAudit()]);
    } catch (err) {
      setError(cloudinaryAdminErrorMessage(err));
    } finally {
      setDeletingRemote('');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Media Library</div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Медиатека сайта</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Локальный CMS-индекс плюс серверная сверка с реальным Cloudinary. Серверный аудит показывает фактический объём, потерянные orphan-assets и разрешает физическое удаление только после повторной проверки Firestore.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => void uploadImages(event.target.files)} />
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" multiple className="hidden" onChange={event => void uploadVideos(event.target.files)} />
            <button type="button" disabled={uploading} onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-60"><Upload className="h-4 w-4" />Фото</button>
            <button type="button" disabled={uploading} onClick={() => videoInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"><Film className="h-4 w-4" />Видео</button>
            <button type="button" disabled={loading || uploading} onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />CMS</button>
            <button type="button" disabled={cloudLoading || uploading} onClick={() => void runCloudAudit()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"><Cloud className={`h-4 w-4 ${cloudLoading ? 'animate-pulse' : ''}`} />{cloudLoading ? 'Проверка…' : 'Cloudinary audit'}</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-black text-slate-950">{stats.total}</div><div className="mt-1 text-xs font-semibold text-slate-500">CMS assets</div></div>
          <div className="rounded-2xl bg-indigo-50 p-4"><div className="text-2xl font-black text-indigo-700">{stats.images}</div><div className="mt-1 text-xs font-semibold text-indigo-600">Изображения</div></div>
          <div className="rounded-2xl bg-violet-50 p-4"><div className="text-2xl font-black text-violet-700">{stats.videos}</div><div className="mt-1 text-xs font-semibold text-violet-600">Видео</div></div>
          <div className="rounded-2xl bg-amber-50 p-4"><div className="text-2xl font-black text-amber-700">{stats.unused}</div><div className="mt-1 text-xs font-semibold text-amber-600">Свободные в CMS</div></div>
        </div>

        {cloudAudit && (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="text-xl font-black text-emerald-800">{cloudAudit.summary.total}</div><div className="mt-1 text-[11px] font-semibold text-emerald-700">Реально в Cloudinary</div></div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4"><div className="text-xl font-black text-sky-800">{formatBytes(cloudAudit.summary.totalBytes)}</div><div className="mt-1 text-[11px] font-semibold text-sky-700">Фактический объём</div></div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><div className="text-xl font-black text-amber-800">{cloudAudit.summary.orphaned}</div><div className="mt-1 text-[11px] font-semibold text-amber-700">Orphan-assets</div></div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><div className="text-xl font-black text-rose-800">{formatBytes(cloudAudit.summary.orphanBytes)}</div><div className="mt-1 text-[11px] font-semibold text-rose-700">Можно освободить</div></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xl font-black text-slate-800">{cloudAudit.summary.scannedDocuments}</div><div className="mt-1 text-[11px] font-semibold text-slate-600">Проверено документов</div></div>
          </div>
        )}
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

      <div className={`rounded-2xl border px-4 py-3 text-xs leading-relaxed ${cloudAudit ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        <div className="flex items-start gap-2">{cloudAudit ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <HardDrive className="mt-0.5 h-4 w-4 shrink-0" />}<span>{cloudAudit ? <><strong>Server-side защита активна:</strong> список получен напрямую из Cloudinary Admin API. Перед каждым физическим удалением Firebase Function ещё раз проверяет ссылки в Firestore.</> : <><strong>Cloudinary backend:</strong> нажмите «Cloudinary audit». Если функция ещё не развёрнута, CMS продолжит работать в локальном режиме без доступа к API Secret.</>}</span></div>
      </div>

      {cloudAudit && orphanedRemote.length > 0 && (
        <section className="rounded-3xl border border-rose-200 bg-rose-50/40 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="text-xs font-black uppercase tracking-[0.16em] text-rose-600">Cloudinary cleanup</div><h3 className="mt-1 text-xl font-black text-slate-950">Orphan-assets: {orphanedRemote.length}</h3><p className="mt-1 text-xs text-slate-500">Эти оригиналы существуют в Cloudinary, но сервер не нашёл ссылок на них в контентных коллекциях Firestore.</p></div>
            <div className="text-sm font-black text-rose-700">{formatBytes(orphanedRemote.reduce((sum, asset) => sum + (asset.bytes || 0), 0))}</div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orphanedRemote.map(asset => {
              const key = `${asset.resourceType}:${asset.publicId}`;
              const preview = remotePreview(asset);
              return <article key={key} className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
                <div className="relative aspect-video overflow-hidden bg-slate-950">{preview ? <ResponsiveImage src={preview} alt="" displayWidth={700} sizes="(max-width: 640px) 100vw, 33vw" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/30">{asset.resourceType === 'video' ? <Film className="h-10 w-10" /> : <Images className="h-10 w-10" />}</div>}<span className="absolute left-3 top-3 rounded-full bg-black/65 px-2 py-1 text-[10px] font-black uppercase text-white">{asset.resourceType}</span></div>
                <div className="p-4"><div className="truncate text-sm font-black text-slate-900" title={asset.publicId}>{assetName(asset)}</div><div className="mt-1 truncate font-mono text-[9px] text-slate-400" title={asset.publicId}>{asset.publicId}</div><div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500"><span>{formatBytes(asset.bytes)}</span>{asset.width && asset.height && <span>{asset.width}×{asset.height}</span>}{asset.format && <span>{asset.format.toUpperCase()}</span>}</div><div className="mt-4 flex gap-2"><button type="button" onClick={() => void copyUrl(asset.url)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Clipboard className="h-3.5 w-3.5" />URL</button><button type="button" disabled={deletingRemote === key} onClick={() => void deleteRemote(asset)} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50">{deletingRemote === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Удалить</button></div></div>
              </article>;
            })}
          </div>
        </section>
      )}

      {cloudAudit && orphanedRemote.length === 0 && cloudAudit.summary.orphaned === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Cloudinary чист: orphan-assets в `dneprfilm/` не найдены.</div>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center text-sm text-slate-400">Файлы не найдены.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(asset => {
            const authoritative = asset.publicId ? cloudByKey.get(`${asset.assetType}:${asset.publicId}`) : undefined;
            const bytes = authoritative?.bytes ?? asset.bytes;
            const width = authoritative?.width ?? asset.width;
            const height = authoritative?.height ?? asset.height;
            const format = authoritative?.format ?? asset.format;
            return <article key={asset.url} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-video overflow-hidden bg-slate-950">
                {asset.previewUrl ? <ResponsiveImage src={asset.previewUrl} alt={asset.name || ''} displayWidth={800} sizes="(max-width: 640px) 100vw, 33vw" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/30">{asset.assetType === 'video' ? <Film className="h-12 w-12" /> : <Images className="h-12 w-12" />}</div>}
                <div className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase text-white backdrop-blur">{asset.assetType}</div>
                <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black ${asset.useCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{asset.useCount > 0 ? `Используется ${asset.useCount}` : 'Свободен'}</div>
              </div>
              <div className="p-5">
                <h3 className="truncate text-sm font-black text-slate-950" title={asset.name}>{asset.name || 'media'}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"><span>{width && height ? `${width}×${height}` : 'размер —'}</span><span>{formatBytes(bytes)}</span>{format && <span>{format.toUpperCase()}</span>}{authoritative && <span className="font-bold text-emerald-600">Cloudinary ✓</span>}</div>
                {asset.publicId && <div className="mt-2 truncate rounded-lg bg-slate-50 px-2.5 py-2 font-mono text-[10px] text-slate-500" title={asset.publicId}>{asset.publicId}</div>}
                <div className="mt-4 space-y-2">{asset.usages.slice(0, 4).map((item, index) => <div key={`${item.sourceId}-${item.field}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"><div className="text-[10px] font-black uppercase text-indigo-600">{item.sourceType}</div><div className="mt-0.5 truncate text-xs font-semibold text-slate-700" title={item.sourceTitle}>{item.sourceTitle}</div><div className="mt-0.5 truncate font-mono text-[9px] text-slate-400" title={item.field}>{item.field}</div></div>)}{asset.usages.length > 4 && <div className="text-[10px] font-semibold text-slate-400">+ ещё {asset.usages.length - 4}</div>}</div>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => void copyUrl(asset.url)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Clipboard className="h-3.5 w-3.5" />URL</button><button type="button" onClick={() => void removeRecord(asset)} disabled={asset.useCount > 0 || !asset.registered} title={asset.useCount > 0 ? 'Сначала уберите файл из всех материалов' : !asset.registered ? 'Файл обнаружен автоматически и не имеет самостоятельной записи' : 'Убрать только запись из CMS-индекса'} className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button></div>
              </div>
            </article>;
          })}
        </div>
      )}
    </div>
  );
}
