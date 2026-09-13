import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Film,
  GripVertical,
  Images,
  Loader2,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { ResponsiveImage } from '../ResponsiveImage';
import {
  loadMediaLibrary,
  registerMediaAsset,
  type MediaAssetType,
  type MediaLibraryAsset,
} from '../../lib/mediaLibrary';
import { uploadLibraryImage, uploadLibraryVideo } from '../../lib/mediaUpload';

interface BasePickerProps {
  type?: MediaAssetType | 'all';
  title?: string;
  onClose: () => void;
}

type MediaLibraryPickerProps = BasePickerProps & (
  | {
      multiple?: false;
      onSelect: (asset: MediaLibraryAsset) => void;
      onSelectMany?: never;
    }
  | {
      multiple: true;
      onSelect?: never;
      onSelectMany: (assets: MediaLibraryAsset[]) => void;
    }
);

function formatBytes(value?: number): string {
  if (!value || value <= 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryPicker(props: MediaLibraryPickerProps) {
  const { type = 'all', title = 'Выбрать из медиатеки', onClose } = props;
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [draggedUrl, setDraggedUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const reloadAssets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAssets(await loadMediaLibrary());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadAssets();
  }, [reloadAssets]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter(asset => {
      if (type !== 'all' && asset.assetType !== type) return false;
      if (!normalized) return true;
      const haystack = [
        asset.name,
        asset.publicId,
        asset.url,
        asset.format,
        asset.width && asset.height ? `${asset.width}x${asset.height}` : '',
        ...asset.usages.map(item => `${item.sourceType} ${item.sourceTitle}`),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [assets, query, type]);

  const selectedAssets = useMemo(() => {
    const byUrl = new Map(assets.map(asset => [asset.url, asset]));
    return selectedUrls.map(url => byUrl.get(url)).filter(Boolean) as MediaLibraryAsset[];
  }, [assets, selectedUrls]);

  const handleAssetClick = (asset: MediaLibraryAsset) => {
    if (!props.multiple) {
      props.onSelect(asset);
      return;
    }
    setSelectedUrls(current => current.includes(asset.url)
      ? current.filter(url => url !== asset.url)
      : [...current, asset.url]);
  };

  const selectAllFiltered = () => {
    if (!props.multiple) return;
    setSelectedUrls(current => {
      const next = [...current];
      const seen = new Set(next);
      filtered.forEach(asset => {
        if (!seen.has(asset.url)) {
          seen.add(asset.url);
          next.push(asset.url);
        }
      });
      return next;
    });
  };

  const clearSelection = () => setSelectedUrls([]);

  const reorderSelected = (targetUrl: string) => {
    if (!draggedUrl || draggedUrl === targetUrl) return;
    setSelectedUrls(current => {
      const source = current.indexOf(draggedUrl);
      const target = current.indexOf(targetUrl);
      if (source < 0 || target < 0) return current;
      const next = [...current];
      const [moved] = next.splice(source, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setDraggedUrl(null);
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    const uploadedUrls: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, 30)) {
        const uploaded = await uploadLibraryImage(file);
        await registerMediaAsset(uploaded, file.name);
        uploadedUrls.push(uploaded.url);
      }
      const refreshed = await loadMediaLibrary();
      setAssets(refreshed);
      if (props.multiple) {
        setSelectedUrls(current => [...current, ...uploadedUrls.filter(url => !current.includes(url))]);
      }
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
    const uploadedUrls: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, 8)) {
        const uploaded = await uploadLibraryVideo(file);
        await registerMediaAsset(uploaded, file.name);
        uploadedUrls.push(uploaded.url);
      }
      const refreshed = await loadMediaLibrary();
      setAssets(refreshed);
      if (props.multiple) {
        setSelectedUrls(current => [...current, ...uploadedUrls.filter(url => !current.includes(url))]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const confirmMultiple = () => {
    if (!props.multiple || selectedAssets.length === 0) return;
    props.onSelectMany(selectedAssets);
  };

  const canUploadImages = type === 'all' || type === 'image';
  const canUploadVideos = type === 'all' || type === 'video';

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mx-auto my-4 max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600">Media Library</div>
            <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
            {props.multiple && <p className="mt-1 text-xs text-slate-500">Выбирайте несколько файлов в нужном порядке. Порядок можно изменить перетаскиванием ниже.</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => void uploadImages(event.target.files)} />
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" multiple className="hidden" onChange={event => void uploadVideos(event.target.files)} />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по имени, проекту, public ID, формату или разрешению" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white" autoFocus />
            </div>
            <div className="flex flex-wrap gap-2">
              {canUploadImages && <button type="button" disabled={uploading} onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"><Upload className="h-4 w-4" />Загрузить фото</button>}
              {canUploadVideos && <button type="button" disabled={uploading} onClick={() => videoInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"><Film className="h-4 w-4" />Загрузить видео</button>}
              {props.multiple && <button type="button" disabled={!filtered.length} onClick={selectAllFiltered} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Выбрать все</button>}
              {props.multiple && selectedUrls.length > 0 && <button type="button" onClick={clearSelection} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Снять выбор</button>}
            </div>
          </div>
          {uploading && <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-700"><Loader2 className="h-4 w-4 animate-spin" />Загружаем и регистрируем файлы в медиатеке…</div>}
        </div>

        {props.multiple && selectedAssets.length > 0 && (
          <div className="border-b border-slate-200 bg-indigo-50/60 px-4 py-3 sm:px-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Порядок выбранных файлов</div>
              <div className="text-xs font-semibold text-slate-500">Перетащите карточки</div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {selectedAssets.map((asset, index) => (
                <div
                  key={asset.url}
                  draggable
                  onDragStart={() => setDraggedUrl(asset.url)}
                  onDragEnd={() => setDraggedUrl(null)}
                  onDragOver={event => event.preventDefault()}
                  onDrop={() => reorderSelected(asset.url)}
                  className="flex min-w-[190px] max-w-[230px] cursor-grab items-center gap-2 rounded-xl border border-indigo-200 bg-white p-2 shadow-sm active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="h-10 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                    {asset.previewUrl ? <ResponsiveImage src={asset.previewUrl} alt="" displayWidth={120} sizes="48px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/40">{asset.assetType === 'video' ? <Film className="h-4 w-4" /> : <Images className="h-4 w-4" />}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-black text-slate-800">{index + 1}. {asset.name || 'media'}</div>
                    <div className="mt-0.5 text-[9px] text-slate-500">{asset.width && asset.height ? `${asset.width}×${asset.height}` : asset.assetType.toUpperCase()}</div>
                  </div>
                  <button type="button" onClick={() => setSelectedUrls(current => current.filter(url => url !== asset.url))} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[62vh] overflow-y-auto p-4 sm:p-6">
          {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-slate-400"><Loader2 className="h-7 w-7 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">Подходящих файлов не найдено. Можно загрузить новый файл прямо здесь.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map(asset => {
                const selectedIndex = selectedUrls.indexOf(asset.url);
                const selected = selectedIndex >= 0;
                return (
                  <button
                    key={asset.url}
                    type="button"
                    onClick={() => handleAssetClick(asset)}
                    className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-400'}`}
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-900">
                      {asset.previewUrl ? <ResponsiveImage src={asset.previewUrl} alt={asset.name || ''} displayWidth={420} sizes="220px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/30">{asset.assetType === 'video' ? <Film className="h-10 w-10" /> : <Images className="h-10 w-10" />}</div>}
                      <div className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-black uppercase text-white backdrop-blur">{asset.assetType === 'video' ? 'VIDEO' : 'IMAGE'}</div>
                      {props.multiple ? (
                        <span className={`absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full border-2 px-1 text-[10px] font-black shadow ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-white bg-black/35 text-transparent'}`}>{selected ? selectedIndex + 1 : <Check className="h-4 w-4" />}</span>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/0 transition group-hover:bg-indigo-600/30"><span className="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-white text-indigo-700 opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100"><Check className="h-5 w-5" /></span></div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="truncate text-xs font-black text-slate-800" title={asset.name}>{asset.name || 'media'}</div>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-slate-500">
                        <span>{asset.width && asset.height ? `${asset.width}×${asset.height}` : '—'}</span>
                        <span>{formatBytes(asset.bytes)}</span>
                        {asset.format && <span>{asset.format.toUpperCase()}</span>}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">Используется: {asset.useCount}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {props.multiple && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <div className="text-sm font-semibold text-slate-600">Выбрано: <span className="font-black text-slate-950">{selectedAssets.length}</span></div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Отмена</button>
              <button type="button" onClick={confirmMultiple} disabled={selectedAssets.length === 0 || uploading} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">Добавить {selectedAssets.length || ''}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
