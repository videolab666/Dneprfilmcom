import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  FilePenLine,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { ResponsiveImage } from '../ResponsiveImage';
import {
  loadMediaLibrary,
  registerMediaAsset,
  type MediaLibraryAsset,
} from '../../lib/mediaLibrary';
import {
  readMediaAssetMetadata,
  replaceMediaAssetEverywhere,
  safelyRemoveMediaAssetRecord,
  saveMediaAssetMetadata,
  type MediaAssetMetadata,
} from '../../lib/mediaLibraryOperations';
import { uploadLibraryImage, uploadLibraryVideo } from '../../lib/mediaUpload';

type MetadataLocale = 'uk' | 'ru' | 'en';

const EMPTY_METADATA: MediaAssetMetadata = {
  alt: '',
  alt_uk: '',
  alt_en: '',
  caption: '',
  caption_uk: '',
  caption_en: '',
};

function metadataKeys(locale: MetadataLocale): { alt: keyof MediaAssetMetadata; caption: keyof MediaAssetMetadata } {
  if (locale === 'uk') return { alt: 'alt_uk', caption: 'caption_uk' };
  if (locale === 'en') return { alt: 'alt_en', caption: 'caption_en' };
  return { alt: 'alt', caption: 'caption' };
}

export function MediaLibraryOperations() {
  const [assets, setAssets] = useState<MediaLibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedUrl, setSelectedUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [metadata, setMetadata] = useState<MediaAssetMetadata>(EMPTY_METADATA);
  const [metadataLocale, setMetadataLocale] = useState<MetadataLocale>('uk');
  const [message, setMessage] = useState('');
  const replacementInputRef = useRef<HTMLInputElement>(null);

  const reload = async (preferredUrl?: string) => {
    setLoading(true);
    setMessage('');
    try {
      const next = await loadMediaLibrary();
      setAssets(next);
      setSelectedUrl(current => {
        const candidate = preferredUrl || current;
        return candidate && next.some(item => item.url === candidate) ? candidate : next[0]?.url || '';
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const selected = useMemo(
    () => assets.find(asset => asset.url === selectedUrl) || null,
    [assets, selectedUrl],
  );
  const target = useMemo(
    () => assets.find(asset => asset.url === targetUrl) || null,
    [assets, targetUrl],
  );

  useEffect(() => {
    setTargetUrl('');
    if (!selected) {
      setMetadata(EMPTY_METADATA);
      return;
    }
    let cancelled = false;
    void readMediaAssetMetadata(selected)
      .then(value => { if (!cancelled) setMetadata({ ...EMPTY_METADATA, ...value }); })
      .catch(error => { if (!cancelled) setMessage(error instanceof Error ? error.message : String(error)); });
    return () => { cancelled = true; };
  }, [selected]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assets.slice(0, 80);
    return assets.filter(asset => [
      asset.name,
      asset.publicId,
      asset.url,
      asset.format,
      ...asset.usages.map(usage => `${usage.sourceType} ${usage.sourceTitle} ${usage.sourceId} ${usage.field}`),
    ].filter(Boolean).join(' ').toLowerCase().includes(normalized)).slice(0, 120);
  }, [assets, query]);

  const replacementCandidates = useMemo(
    () => selected
      ? assets.filter(asset => asset.url !== selected.url && asset.assetType === selected.assetType)
      : [],
    [assets, selected],
  );

  const activeKeys = metadataKeys(metadataLocale);

  const saveMetadata = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage('');
    try {
      await saveMediaAssetMetadata(selected, metadata);
      setMessage('ALT и caption сохранены в registry-записи медиатеки.');
      await reload(selected.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const replaceEverywhere = async () => {
    if (!selected || !target) return;
    const confirmation = `Заменить файл «${selected.name || 'media'}» на «${target.name || 'media'}» во всех ссылках CMS?\n\nСейчас найдено использований: ${selected.useCount}. Операция меняет ссылки в Firestore, но не удаляет исходный Cloudinary-файл.`;
    if (!window.confirm(confirmation)) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await replaceMediaAssetEverywhere(selected, target);
      setMessage(`Готово: заменено ${result.referencesReplaced} ссылок в ${result.documentsUpdated} документах (${result.collectionsTouched.join(', ')}).`);
      await reload(selected.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const removeRegistry = async () => {
    if (!selected) return;
    if (!window.confirm(`Безопасно убрать registry-запись «${selected.name || 'media'}»? Перед удалением использование будет проверено повторно. Cloudinary-файл физически не удаляется.`)) return;
    setBusy(true);
    setMessage('');
    try {
      await safelyRemoveMediaAssetRecord(selected);
      setMessage('Registry-запись удалена. Физический файл в Cloudinary оставлен.');
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const uploadReplacement = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !selected) return;
    setBusy(true);
    setMessage('');
    try {
      const uploaded = selected.assetType === 'image'
        ? await uploadLibraryImage(file)
        : await uploadLibraryVideo(file);
      await registerMediaAsset(uploaded, file.name);
      const next = await loadMediaLibrary();
      setAssets(next);
      setTargetUrl(uploaded.url);
      setMessage('Новый файл загружен. Проверьте его и нажмите «Заменить во всём CMS».');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
      if (replacementInputRef.current) replacementInputRef.current.value = '';
    }
  };

  return (
    <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Media Library 4.0</div>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Использование, metadata и global replace</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">Выберите файл, посмотрите все найденные ссылки CMS, сохраните ALT/caption или замените asset сразу во всех Firestore-документах. Удаление registry повторно проверяет использование перед записью.</p>
        </div>
        <button type="button" onClick={() => void reload(selected?.url)} disabled={loading || busy} className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">Обновить индекс</button>
      </div>

      {message && <div className="mt-4 rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm font-semibold text-indigo-800">{message}</div>}

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Файл, public ID или место использования" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" />
          </div>
          <div className="mt-3 max-h-[430px] space-y-2 overflow-y-auto pr-1">
            {loading ? <div className="flex min-h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div> : filtered.map(asset => (
              <button key={asset.url} type="button" onClick={() => setSelectedUrl(asset.url)} className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${selectedUrl === asset.url ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                  {asset.previewUrl && <ResponsiveImage src={asset.previewUrl} alt="" displayWidth={180} sizes="64px" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-black text-slate-900">{asset.name || 'media'}</div>
                  <div className="mt-1 text-[10px] font-semibold text-slate-500">{asset.assetType.toUpperCase()} · {asset.useCount ? `используется ${asset.useCount}` : 'не используется'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {!selected ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">Выберите файл слева.</div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-slate-950 sm:w-48">
                    {selected.previewUrl && <ResponsiveImage src={selected.previewUrl} alt={selected.name || ''} displayWidth={500} sizes="192px" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-black text-slate-950">{selected.name || 'media'}</div>
                    <div className="mt-1 break-all font-mono text-[10px] text-slate-400">{selected.publicId || selected.url}</div>
                    <div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${selected.useCount ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{selected.useCount ? `Используется в ${selected.useCount} местах` : 'ORPHAN / не используется'}</div>
                  </div>
                </div>

                <div className="mt-4 max-h-44 space-y-2 overflow-y-auto">
                  {selected.usages.length === 0 ? <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><AlertTriangle className="h-4 w-4" />Ссылки из контента не найдены.</div> : selected.usages.map((usage, index) => (
                    <div key={`${usage.sourceType}-${usage.sourceId}-${usage.field}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="text-[10px] font-black uppercase text-indigo-600">{usage.sourceType}</div>
                      <div className="truncate text-xs font-bold text-slate-800">{usage.sourceTitle}</div>
                      <div className="truncate font-mono text-[9px] text-slate-400">{usage.sourceId} · {usage.field}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900"><FilePenLine className="h-4 w-4 text-indigo-600" />ALT / Caption metadata</div>
                <div className="mt-3 flex gap-2">{(['uk', 'ru', 'en'] as MetadataLocale[]).map(locale => <button key={locale} type="button" onClick={() => setMetadataLocale(locale)} className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase ${metadataLocale === locale ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{locale}</button>)}</div>
                <div className="mt-3 grid gap-3">
                  <label className="text-xs font-bold text-slate-700">ALT
                    <input value={String(metadata[activeKeys.alt] || '')} onChange={event => setMetadata(current => ({ ...current, [activeKeys.alt]: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500" placeholder="Описание изображения для accessibility и SEO" />
                  </label>
                  <label className="text-xs font-bold text-slate-700">Caption
                    <textarea rows={2} value={String(metadata[activeKeys.caption] || '')} onChange={event => setMetadata(current => ({ ...current, [activeKeys.caption]: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-indigo-500" placeholder="Подпись к файлу" />
                  </label>
                  <button type="button" onClick={() => void saveMetadata()} disabled={busy} className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-500 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Сохранить metadata</button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900"><ArrowRightLeft className="h-4 w-4 text-indigo-600" />Заменить файл во всём CMS</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Меняются точные URL во всех известных CMS-коллекциях, включая вложенные массивы и article data. Старый Cloudinary-файл не удаляется.</p>
                <input ref={replacementInputRef} type="file" className="hidden" accept={selected.assetType === 'image' ? 'image/*' : 'video/mp4,video/webm'} onChange={event => void uploadReplacement(event.target.files)} />
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <select value={targetUrl} onChange={event => setTargetUrl(event.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500">
                    <option value="">Выберите новый {selected.assetType === 'image' ? 'image' : 'video'} asset…</option>
                    {replacementCandidates.map(asset => <option key={asset.url} value={asset.url}>{asset.name || asset.publicId || asset.url}</option>)}
                  </select>
                  <button type="button" onClick={() => replacementInputRef.current?.click()} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Upload className="h-4 w-4" />Загрузить новый</button>
                </div>
                {target && <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">Новый файл: <strong>{target.name || target.publicId}</strong></div>}
                <button type="button" onClick={() => void replaceEverywhere()} disabled={busy || !target} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-40"><ArrowRightLeft className="h-4 w-4" />Заменить во всём CMS ({selected.useCount})</button>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div><div className="text-xs font-black text-amber-900">Safe delete</div><p className="mt-1 text-xs leading-relaxed text-amber-800">Перед удалением registry-записи индекс использования строится заново. Если появилась хотя бы одна ссылка, операция блокируется. Физический Cloudinary asset не удаляется из браузера.</p></div></div>
                <button type="button" onClick={() => void removeRegistry()} disabled={busy || !selected.registered || selected.useCount > 0} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-35"><Trash2 className="h-4 w-4" />Убрать registry-запись</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
