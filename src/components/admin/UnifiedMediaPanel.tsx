import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Film, Image as ImageIcon, Library, Loader2, Trash2, Upload } from 'lucide-react';
import type { CaseMediaItem, CaseMediaType, Locale } from '../../types';
import type { PublishQualityType } from '../../lib/publishQuality';
import {
  createCaseMediaItem,
  detectCaseMediaType,
  getMediaPreview,
  getYouTubeThumbnail,
} from '../../lib/caseMedia';
import { createVideoProjectMedia, videoMediaPoster, type VideoProjectFormat, type VideoProjectMedia } from '../../lib/videoPortfolio';
import type { GalleryImage } from '../../lib/galleryContent';
import { uploadCaseImage, uploadGalleryImage, uploadPortfolioVideo } from '../../lib/mediaUpload';
import { registerMediaAsset, type MediaLibraryAsset } from '../../lib/mediaLibrary';
import { AdminImageField } from './AdminImageField';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { ResponsiveImage } from '../ResponsiveImage';
import type { UnifiedContentRecord } from './UnifiedContentFields';

type PickerMode = 'case' | 'gallery' | 'video' | { posterId: string } | null;

interface UnifiedMediaPanelProps {
  type: PublishQualityType;
  value: UnifiedContentRecord;
  locale: Locale;
  onPatch: (patch: UnifiedContentRecord) => void;
  onBusyChange?: (busy: boolean) => void;
  onError?: (message: string) => void;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function id(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function UnifiedMediaPanel({ type, value, locale, onPatch, onBusyChange, onError }: UnifiedMediaPanelProps) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [picker, setPicker] = useState<PickerMode>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const setBusyState = (next: boolean) => {
    setBusy(next);
    onBusyChange?.(next);
  };

  const fail = (reason: unknown) => {
    console.error(reason);
    onError?.(reason instanceof Error ? reason.message : String(reason));
  };

  if (type === 'article') {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <AdminImageField
          label="Обложка статьи"
          value={text(value.coverImage)}
          onChange={coverImage => onPatch({ coverImage })}
          previewAlt={text(value.uk?.title) || text(value.ru?.title) || text(value.en?.title) || 'Article cover'}
          helperText="Обложка используется в карточке Media Center, image sitemap и как SEO/social fallback."
        />
      </section>
    );
  }

  if (type === 'case') {
    const media: CaseMediaItem[] = Array.isArray(value.media) ? value.media : [];
    const update = (mediaId: string, patch: Partial<CaseMediaItem>) => onPatch({ media: media.map(item => item.id === mediaId ? { ...item, ...patch } : item) });
    const localizedKey = (base: 'title' | 'caption' | 'alt') => locale === 'ru' ? base : `${base}_${locale}`;

    const upload = async (files: FileList | null) => {
      if (!files?.length) return;
      setBusyState(true);
      try {
        const added: CaseMediaItem[] = [];
        for (const file of Array.from(files).slice(0, 20)) {
          const uploaded = await uploadCaseImage(file, String(value.id));
          added.push({
            ...createCaseMediaItem('image', uploaded.url),
            cloudinaryPublicId: uploaded.publicId,
            alt: text(value.title) || text(value.title_uk) || file.name,
            alt_uk: text(value.title_uk) || text(value.title) || file.name,
            alt_en: text(value.title_en) || text(value.title_uk) || file.name,
          });
        }
        onPatch({ media: [...media, ...added], imageUrl: value.imageUrl || added[0]?.url || '' });
      } catch (reason) { fail(reason); } finally {
        setBusyState(false);
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    };

    const addUrl = () => {
      const nextUrl = url.trim();
      if (!nextUrl || media.some(item => item.url === nextUrl)) return;
      const mediaType = detectCaseMediaType(nextUrl);
      const item = createCaseMediaItem(mediaType, nextUrl);
      if (mediaType === 'youtube') item.thumbnailUrl = getYouTubeThumbnail(nextUrl) || undefined;
      onPatch({
        media: [...media, item],
        imageUrl: value.imageUrl || (mediaType === 'image' ? nextUrl : ''),
        videoUrl: value.videoUrl || (mediaType !== 'image' ? nextUrl : ''),
      });
      setUrl('');
    };

    const library = (assets: MediaLibraryAsset[]) => {
      const existing = new Set(media.map(item => item.url));
      const added = assets.filter(asset => !existing.has(asset.url)).map(asset => {
        const item = createCaseMediaItem(asset.assetType === 'video' ? 'video' : 'image', asset.url);
        item.cloudinaryPublicId = asset.publicId;
        if (asset.assetType === 'video') item.thumbnailUrl = asset.previewUrl;
        if (asset.assetType === 'image') {
          const fallback = asset.name || text(value.title_uk) || text(value.title) || 'Фото';
          item.alt = text(value.title) || fallback;
          item.alt_uk = text(value.title_uk) || fallback;
          item.alt_en = text(value.title_en) || fallback;
        }
        return item;
      });
      onPatch({
        media: [...media, ...added],
        imageUrl: value.imageUrl || added.find(item => item.type === 'image')?.url || '',
        videoUrl: value.videoUrl || added.find(item => item.type !== 'image')?.url || '',
      });
      setPicker(null);
    };

    return (
      <div className="space-y-5">
        <AdminImageField label="Обложка кейса" value={text(value.imageUrl)} onChange={imageUrl => onPatch({ imageUrl })} previewAlt={text(value.title_uk) || text(value.title)} />
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="font-black text-slate-950">Фото и видео кейса</h3><p className="mt-1 text-xs text-slate-500">URL, загрузка файлов и повторное использование из общей медиатеки.</p></div>
            <div className="flex gap-2"><button type="button" onClick={() => setPicker('case')} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"><Library className="h-4 w-4" />Медиатека</button><input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => void upload(event.target.files)} /><button type="button" onClick={() => imageInputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Фото</button></div>
          </div>
          <div className="mt-4 flex gap-2"><input value={url} onChange={event => setUrl(event.target.value)} placeholder="YouTube / Vimeo / MP4 / image URL" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><button type="button" onClick={addUrl} className="rounded-xl bg-slate-900 px-4 text-xs font-bold text-white">Добавить URL</button></div>
          <div className="mt-5 space-y-3">{media.map((item, index) => { const preview = getMediaPreview(item); const titleKey = localizedKey('title'); const captionKey = localizedKey('caption'); const altKey = localizedKey('alt'); return <div key={item.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[150px_minmax(0,1fr)_auto]"><div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">{preview ? <ResponsiveImage src={preview} alt="" displayWidth={360} sizes="150px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/40">{item.type === 'image' ? <ImageIcon className="h-8 w-8" /> : <Film className="h-8 w-8" />}</div>}{value.imageUrl === item.url && item.type === 'image' && <span className="absolute bottom-2 left-2 rounded bg-amber-400 px-2 py-1 text-[9px] font-black">COVER</span>}</div><div className="space-y-2"><div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)]"><select value={item.type} onChange={event => update(item.id, { type: event.target.value as CaseMediaType })} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"><option value="image">Фото</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="video">Video</option></select><input value={item.url} onChange={event => { const nextUrl = event.target.value; const nextType = detectCaseMediaType(nextUrl); update(item.id, { url: nextUrl, type: nextType, thumbnailUrl: nextType === 'youtube' ? getYouTubeThumbnail(nextUrl) || undefined : item.thumbnailUrl }); }} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /></div><input value={text((item as any)[titleKey])} onChange={event => update(item.id, { [titleKey]: event.target.value } as Partial<CaseMediaItem>)} placeholder={`Название · ${locale.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><textarea rows={2} value={text((item as any)[captionKey])} onChange={event => update(item.id, { [captionKey]: event.target.value } as Partial<CaseMediaItem>)} placeholder={`Подпись · ${locale.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" />{item.type === 'image' && <input value={text((item as any)[altKey])} onChange={event => update(item.id, { [altKey]: event.target.value } as Partial<CaseMediaItem>)} placeholder={`ALT · ${locale.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" />}</div><div className="flex gap-1 lg:flex-col">{item.type === 'image' && value.imageUrl !== item.url && <button type="button" onClick={() => onPatch({ imageUrl: item.url })} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50">★</button>}<button type="button" onClick={() => onPatch({ media: move(media, index, -1) })} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => onPatch({ media: move(media, index, 1) })} disabled={index === media.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => onPatch({ media: media.filter(current => current.id !== item.id) })} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>; })}{media.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">Медиа пока нет.</div>}</div>
        </section>
        {picker === 'case' && <MediaLibraryPicker type="all" multiple title="Добавить медиа в кейс" onSelectMany={library} onClose={() => setPicker(null)} />}
      </div>
    );
  }

  if (type === 'gallery') {
    const images: GalleryImage[] = Array.isArray(value.images) ? value.images : [];
    const update = (imageId: string, patch: Partial<GalleryImage>) => onPatch({ images: images.map(item => item.id === imageId ? { ...item, ...patch } : item) });
    const altKey = locale === 'ru' ? 'alt' : `alt_${locale}`;
    const captionKey = locale === 'ru' ? 'caption' : `caption_${locale}`;
    const upload = async (files: FileList | null) => {
      if (!files?.length) return;
      setBusyState(true);
      try {
        const added: GalleryImage[] = [];
        for (const file of Array.from(files).slice(0, 50)) {
          const uploaded = await uploadGalleryImage(file, String(value.id));
          await registerMediaAsset(uploaded, file.name);
          added.push({ id: id('photo'), url: uploaded.url, cloudinaryPublicId: uploaded.publicId, alt: text(value.title) || file.name, alt_uk: text(value.title_uk) || file.name, alt_en: text(value.title_en) || file.name, caption: '', caption_uk: '', caption_en: '' });
        }
        onPatch({ images: [...images, ...added], coverUrl: value.coverUrl || added[0]?.url || '' });
      } catch (reason) { fail(reason); } finally {
        setBusyState(false);
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    };
    const library = (assets: MediaLibraryAsset[]) => {
      const existing = new Set(images.map(item => item.url));
      const added: GalleryImage[] = assets.filter(asset => asset.assetType === 'image' && !existing.has(asset.url)).map(asset => ({ id: id('photo'), url: asset.url, cloudinaryPublicId: asset.publicId, alt: text(value.title) || asset.name || 'Фото', alt_uk: text(value.title_uk) || asset.name || 'Фото', alt_en: text(value.title_en) || asset.name || 'Photo', caption: '', caption_uk: '', caption_en: '' }));
      onPatch({ images: [...images, ...added], coverUrl: value.coverUrl || added[0]?.url || '' });
      setPicker(null);
    };
    return <div className="space-y-5"><AdminImageField label="Обложка галереи" value={text(value.coverUrl)} onChange={coverUrl => onPatch({ coverUrl })} previewAlt={text(value.title_uk) || text(value.title)} /><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-950">Фотографии</h3><p className="mt-1 text-xs text-slate-500">Сортировка, обложка, ALT и подпись на каждом языке.</p></div><div className="flex gap-2"><button type="button" onClick={() => setPicker('gallery')} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-bold text-fuchsia-700"><Library className="h-4 w-4" />Медиатека</button><input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => void upload(event.target.files)} /><button type="button" onClick={() => imageInputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Загрузить</button></div></div><div className="mt-5 space-y-3">{images.map((image, index) => <div key={image.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[150px_minmax(0,1fr)_auto]"><div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"><img src={image.url} alt="" className="h-full w-full object-cover" />{value.coverUrl === image.url && <span className="absolute bottom-2 left-2 rounded bg-amber-400 px-2 py-1 text-[9px] font-black">COVER</span>}</div><div className="space-y-2"><input value={text((image as any)[altKey])} onChange={event => update(image.id, { [altKey]: event.target.value } as Partial<GalleryImage>)} placeholder={`ALT · ${locale.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><textarea rows={2} value={text((image as any)[captionKey])} onChange={event => update(image.id, { [captionKey]: event.target.value } as Partial<GalleryImage>)} placeholder={`Подпись · ${locale.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><div className="truncate text-[10px] text-slate-400">{image.url}</div></div><div className="flex gap-1 lg:flex-col">{value.coverUrl !== image.url && <button type="button" onClick={() => onPatch({ coverUrl: image.url })} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50">★</button>}<button type="button" onClick={() => onPatch({ images: move(images, index, -1) })} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => onPatch({ images: move(images, index, 1) })} disabled={index === images.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => onPatch({ images: images.filter(current => current.id !== image.id) })} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>)}{images.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">Фотографий пока нет.</div>}</div></section>{picker === 'gallery' && <MediaLibraryPicker type="image" multiple title="Добавить фотографии" onSelectMany={library} onClose={() => setPicker(null)} />}</div>;
  }

  const videos: VideoProjectMedia[] = Array.isArray(value.videos) ? value.videos : [];
  const update = (mediaId: string, patch: Partial<VideoProjectMedia>) => onPatch({ videos: videos.map(item => item.id === mediaId ? { ...item, ...patch } : item) });
  const titleKey = locale === 'ru' ? 'title' : `title_${locale}`;
  const captionKey = locale === 'ru' ? 'caption' : `caption_${locale}`;
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusyState(true);
    try {
      const added: VideoProjectMedia[] = [];
      for (const file of Array.from(files).slice(0, 10)) {
        const uploaded = await uploadPortfolioVideo(file, String(value.id));
        added.push({ id: id('video'), type: 'video', url: uploaded.url, posterUrl: uploaded.posterUrl, cloudinaryPublicId: uploaded.publicId, format: '16:9' });
      }
      onPatch({ videos: [...videos, ...added] });
    } catch (reason) { fail(reason); } finally {
      setBusyState(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };
  const addUrl = () => {
    const nextUrl = url.trim();
    if (!nextUrl || videos.some(item => item.url === nextUrl)) return;
    onPatch({ videos: [...videos, createVideoProjectMedia(nextUrl)] });
    setUrl('');
  };
  const library = (assets: MediaLibraryAsset[]) => {
    const existing = new Set(videos.map(item => item.url));
    const added: VideoProjectMedia[] = assets.filter(asset => asset.assetType === 'video' && !existing.has(asset.url)).map(asset => ({ id: id('video'), type: 'video', url: asset.url, posterUrl: asset.previewUrl, cloudinaryPublicId: asset.publicId, format: '16:9', title: asset.name || undefined, title_uk: asset.name || undefined, title_en: asset.name || undefined }));
    onPatch({ videos: [...videos, ...added] });
    setPicker(null);
  };
  const choosePoster = (asset: MediaLibraryAsset) => {
    if (typeof picker !== 'object' || !picker?.posterId || asset.assetType !== 'image') return;
    update(picker.posterId, { posterUrl: asset.url });
    setPicker(null);
  };

  return <div className="space-y-5"><AdminImageField label="Обложка видеопроекта" value={text(value.coverUrl)} onChange={coverUrl => onPatch({ coverUrl })} previewAlt={text(value.title_uk) || text(value.title)} /><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-950">Видео проекта</h3><p className="mt-1 text-xs text-slate-500">YouTube/Vimeo/MP4, poster и формат каждого ролика.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setPicker('video')} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"><Library className="h-4 w-4" />Медиатека</button><input ref={videoInputRef} type="file" accept="video/mp4,video/webm" multiple className="hidden" onChange={event => void upload(event.target.files)} /><button type="button" onClick={() => videoInputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Загрузить</button></div></div><div className="mt-4 flex gap-2"><input value={url} onChange={event => setUrl(event.target.value)} placeholder="YouTube / Vimeo / MP4 URL" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><button type="button" onClick={addUrl} className="rounded-xl bg-slate-900 px-4 text-xs font-bold text-white">Добавить URL</button></div><div className="mt-5 space-y-3">{videos.map((media, index) => { const poster = videoMediaPoster(media); return <div key={media.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[150px_minmax(0,1fr)_auto]"><div className="aspect-video overflow-hidden rounded-xl bg-slate-900">{poster ? <ResponsiveImage src={poster} alt="" displayWidth={360} sizes="150px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/40"><Film className="h-8 w-8" /></div>}</div><div className="space-y-2"><input value={media.url} onChange={event => update(media.id, { url: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><div className="grid gap-2 sm:grid-cols-2"><select value={media.format || '16:9'} onChange={event => update(media.id, { format: event.target.value as VideoProjectFormat })} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option></select><div className="flex gap-2"><input value={media.posterUrl || ''} onChange={event => update(media.id, { posterUrl: event.target.value })} placeholder="Poster URL" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><button type="button" onClick={() => setPicker({ posterId: media.id })} className="rounded-xl border border-slate-300 bg-white px-3 text-indigo-600"><Library className="h-4 w-4" /></button></div></div><input value={text((media as any)[titleKey])} onChange={event => update(media.id, { [titleKey]: event.target.value } as Partial<VideoProjectMedia>)} placeholder={`Название · ${locale.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><input value={text((media as any)[captionKey])} onChange={event => update(media.id, { [captionKey]: event.target.value } as Partial<VideoProjectMedia>)} placeholder={`Подпись · ${locale.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /></div><div className="flex gap-1 lg:flex-col"><button type="button" onClick={() => onPatch({ videos: move(videos, index, -1) })} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => onPatch({ videos: move(videos, index, 1) })} disabled={index === videos.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => onPatch({ videos: videos.filter(current => current.id !== media.id) })} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>; })}{videos.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">Видео пока нет.</div>}</div></section>{picker === 'video' && <MediaLibraryPicker type="video" multiple title="Добавить видео" onSelectMany={library} onClose={() => setPicker(null)} />}{typeof picker === 'object' && picker?.posterId && <MediaLibraryPicker type="image" title="Выбрать poster" onSelect={choosePoster} onClose={() => setPicker(null)} />}</div>;
}
