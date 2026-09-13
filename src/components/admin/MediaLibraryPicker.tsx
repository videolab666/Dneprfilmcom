import { useEffect, useMemo, useState } from 'react';
import { Check, Film, Images, Loader2, Search, X } from 'lucide-react';
import { ResponsiveImage } from '../ResponsiveImage';
import { loadMediaLibrary, type MediaAssetType, type MediaLibraryAsset } from '../../lib/mediaLibrary';

interface MediaLibraryPickerProps {
  type?: MediaAssetType | 'all';
  title?: string;
  onSelect: (asset: MediaLibraryAsset) => void;
  onClose: () => void;
}

export function MediaLibraryPicker({ type = 'all', title = 'Выбрать из медиатеки', onSelect, onClose }: MediaLibraryPickerProps) {
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadMediaLibrary()
      .then(items => { if (active) setAssets(items); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter(asset => {
      if (type !== 'all' && asset.assetType !== type) return false;
      if (!normalized) return true;
      const haystack = [asset.name, asset.publicId, asset.url, ...asset.usages.map(item => `${item.sourceType} ${item.sourceTitle}`)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [assets, query, type]);

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mx-auto my-4 max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600">Media Library</div>
            <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по имени, проекту или public ID" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white" autoFocus />
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-slate-400"><Loader2 className="h-7 w-7 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">Подходящих файлов не найдено.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map(asset => (
                <button key={asset.url} type="button" onClick={() => onSelect(asset)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg">
                  <div className="relative aspect-square overflow-hidden bg-slate-900">
                    {asset.previewUrl ? <ResponsiveImage src={asset.previewUrl} alt={asset.name || ''} displayWidth={420} sizes="220px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/30">{asset.assetType === 'video' ? <Film className="h-10 w-10" /> : <Images className="h-10 w-10" />}</div>}
                    <div className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-black uppercase text-white backdrop-blur">{asset.assetType === 'video' ? 'VIDEO' : 'IMAGE'}</div>
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/0 transition group-hover:bg-indigo-600/30"><span className="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-white text-indigo-700 opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100"><Check className="h-5 w-5" /></span></div>
                  </div>
                  <div className="p-3">
                    <div className="truncate text-xs font-black text-slate-800" title={asset.name}>{asset.name || 'media'}</div>
                    <div className="mt-1 text-[10px] text-slate-500">Используется: {asset.useCount}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
