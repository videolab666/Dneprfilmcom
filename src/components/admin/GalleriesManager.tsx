import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  Edit3,
  ExternalLink,
  GripVertical,
  Images,
  Library,
  Loader2,
  MapPin,
  Plus,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Locale } from '../../types';
import { uploadGalleryImage } from '../../lib/mediaUpload';
import { slugifyCase } from '../../lib/caseMedia';
import { registerMediaAsset, type MediaLibraryAsset } from '../../lib/mediaLibrary';
import { cleanupPortfolioRelations } from '../../lib/portfolioRelationsAdmin';
import { requestPublishApproval } from '../../lib/publishQuality';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import {
  PortfolioRelationsField,
  type PortfolioRelationsFieldHandle,
} from './PortfolioRelationsField';
import {
  GALLERY_COLLECTION,
  GALLERY_KIND,
  galleryCover,
  galleryDisplaySettings,
  getGalleryPath,
  getGallerySlug,
  imageFocalPoint,
  isPhotoGallery,
  sortGalleries,
  type GalleryImage,
  type PhotoGallery,
} from '../../lib/galleryContent';

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

function makeImageId(): string {
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyGallery(order: number): PhotoGallery {
  return {
    id: `gallery-${Date.now()}`,
    kind: GALLERY_KIND,
    slug: '',
    title: '',
    title_uk: '',
    title_en: '',
    description: '',
    description_uk: '',
    description_en: '',
    location: '',
    location_uk: '',
    location_en: '',
    date: new Date().toISOString().slice(0, 10),
    coverUrl: '',
    images: [],
    layout: 'masonry',
    columns: 3,
    gap: 'medium',
    aspect: 'original',
    captionMode: 'always',
    published: true,
    order,
    createdAt: Date.now(),
  };
}

export function GalleriesManager() {
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PhotoGallery | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [bulkAltTemplate, setBulkAltTemplate] = useState('{gallery} — фото {n}');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const relationsRef = useRef<PortfolioRelationsFieldHandle>(null);

  const fetchGalleries = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, GALLERY_COLLECTION));
      const list = snapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(isPhotoGallery);
      setGalleries(sortGalleries(list));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchGalleries(); }, []);

  const resetSelection = () => setSelectedImageIds(new Set());

  const startEditing = (gallery: PhotoGallery) => {
    const display = galleryDisplaySettings(gallery);
    setEditing({ ...gallery, ...display, slug: gallery.slug || '', images: [...(gallery.images || [])], published: gallery.published !== false });
    setLanguage('uk');
    setError('');
    setLibraryPickerOpen(false);
    resetSelection();
  };

  const createNew = () => {
    const nextOrder = galleries.length === 0 ? 10 : Math.max(...galleries.map(item => item.order ?? 0)) + 10;
    setEditing(emptyGallery(nextOrder));
    setLanguage('uk');
    setError('');
    setLibraryPickerOpen(false);
    resetSelection();
  };

  const getLocalizedField = (base: 'title' | 'description' | 'location'): string => {
    if (!editing) return '';
    if (language === 'ru') return String(editing[base] || '');
    return String(editing[`${base}_${language}` as keyof PhotoGallery] || '');
  };

  const setLocalizedField = (base: 'title' | 'description' | 'location', value: string) => {
    if (!editing) return;
    if (language === 'ru') setEditing({ ...editing, [base]: value });
    else setEditing({ ...editing, [`${base}_${language}`]: value });
  };

  const images = editing?.images || [];

  const getImageText = (image: GalleryImage, base: 'alt' | 'caption'): string => {
    if (language === 'ru') return image[base] || '';
    return String(image[`${base}_${language}` as keyof GalleryImage] || '');
  };

  const updateImage = (id: string, patch: Partial<GalleryImage>) => {
    if (!editing) return;
    setEditing({ ...editing, images: images.map(image => image.id === id ? { ...image, ...patch } : image) });
  };

  const setImageText = (image: GalleryImage, base: 'alt' | 'caption', value: string) => {
    const key = language === 'ru' ? base : `${base}_${language}`;
    updateImage(image.id, { [key]: value });
  };

  const uploadImages = async (files: FileList | null) => {
    if (!editing || !files?.length) return;
    setUploading(true);
    setError('');
    try {
      const added: GalleryImage[] = [];
      for (const file of Array.from(files).slice(0, 50)) {
        const uploaded = await uploadGalleryImage(file, editing.id);
        await registerMediaAsset(uploaded, file.name);
        added.push({
          id: makeImageId(),
          url: uploaded.url,
          cloudinaryPublicId: uploaded.publicId,
          alt: editing.title || editing.title_uk || file.name,
          alt_uk: editing.title_uk || editing.title || file.name,
          alt_en: editing.title_en || editing.title_uk || editing.title || file.name,
          caption: '', caption_uk: '', caption_en: '',
          focalX: 50, focalY: 50, featured: false,
        });
      }
      const nextImages = [...images, ...added];
      setEditing({ ...editing, images: nextImages, coverUrl: editing.coverUrl || added[0]?.url || '' });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addImagesFromLibrary = (assets: MediaLibraryAsset[]) => {
    if (!editing) return;
    const existingUrls = new Set(images.map(image => image.url));
    const added: GalleryImage[] = assets
      .filter(asset => asset.assetType === 'image' && !existingUrls.has(asset.url))
      .map(asset => {
        const fallback = asset.name || editing.title_uk || editing.title || editing.title_en || 'Фото';
        return {
          id: makeImageId(), url: asset.url, cloudinaryPublicId: asset.publicId,
          alt: editing.title || editing.title_uk || fallback,
          alt_uk: editing.title_uk || editing.title || fallback,
          alt_en: editing.title_en || editing.title_uk || editing.title || fallback,
          caption: '', caption_uk: '', caption_en: '', focalX: 50, focalY: 50, featured: false,
        };
      });
    setEditing({ ...editing, images: [...images, ...added], coverUrl: editing.coverUrl || added[0]?.url || '' });
    setLibraryPickerOpen(false);
  };

  const removeImage = (image: GalleryImage) => {
    if (!editing) return;
    const nextImages = images.filter(item => item.id !== image.id);
    const nextCover = editing.coverUrl === image.url ? nextImages[0]?.url || '' : editing.coverUrl;
    setEditing({ ...editing, images: nextImages, coverUrl: nextCover });
    setSelectedImageIds(current => {
      const next = new Set(current); next.delete(image.id); return next;
    });
  };

  const moveImage = (id: string, direction: -1 | 1) => {
    if (!editing) return;
    const index = images.findIndex(image => image.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setEditing({ ...editing, images: next });
  };

  const dropImage = (targetId: string) => {
    if (!editing || !draggedImageId || draggedImageId === targetId) return;
    const source = images.findIndex(image => image.id === draggedImageId);
    const target = images.findIndex(image => image.id === targetId);
    if (source < 0 || target < 0) return;
    const next = [...images];
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    setEditing({ ...editing, images: next });
    setDraggedImageId(null);
  };

  const toggleSelected = (id: string) => {
    setSelectedImageIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedImageIds(new Set(images.map(image => image.id)));

  const bulkDelete = () => {
    if (!editing || selectedImageIds.size === 0) return;
    if (!window.confirm(`Удалить выбранные фотографии (${selectedImageIds.size}) из галереи?`)) return;
    const nextImages = images.filter(image => !selectedImageIds.has(image.id));
    const nextCover = nextImages.some(image => image.url === editing.coverUrl) ? editing.coverUrl : nextImages[0]?.url || '';
    setEditing({ ...editing, images: nextImages, coverUrl: nextCover });
    resetSelection();
  };

  const bulkMove = (position: 'start' | 'end') => {
    if (!editing || selectedImageIds.size === 0) return;
    const selected = images.filter(image => selectedImageIds.has(image.id));
    const rest = images.filter(image => !selectedImageIds.has(image.id));
    setEditing({ ...editing, images: position === 'start' ? [...selected, ...rest] : [...rest, ...selected] });
  };

  const bulkApplyAlt = () => {
    if (!editing || selectedImageIds.size === 0) return;
    const field = language === 'ru' ? 'alt' : `alt_${language}`;
    const galleryName = getLocalizedField('title') || editing.title_uk || editing.title || editing.title_en || 'Галерея';
    let ordinal = 0;
    const next = images.map((image, index) => {
      if (!selectedImageIds.has(image.id)) return image;
      ordinal += 1;
      const value = bulkAltTemplate.replaceAll('{gallery}', galleryName).replaceAll('{n}', String(ordinal || index + 1));
      return { ...image, [field]: value };
    });
    setEditing({ ...editing, images: next });
  };

  const bulkClearCaptions = () => {
    if (!editing || selectedImageIds.size === 0) return;
    const field = language === 'ru' ? 'caption' : `caption_${language}`;
    setEditing({ ...editing, images: images.map(image => selectedImageIds.has(image.id) ? { ...image, [field]: '' } : image) });
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const anyTitle = editing.title_uk?.trim() || editing.title?.trim() || editing.title_en?.trim();
    if (!anyTitle) { setError('Укажите название галереи хотя бы на одном языке.'); return; }

    setSaving(true);
    setError('');
    try {
      let slug = editing.slug?.trim() ? slugifyCase(editing.slug) : getGallerySlug({ ...editing, slug: '' });
      if (!slug) slug = editing.id;
      const duplicate = galleries.some(item => item.id !== editing.id && getGallerySlug(item) === slug);
      if (duplicate) slug = `${slug}-${editing.id.replace(/^gallery-/, '').slice(-8)}`;

      const cleanedImages = images.filter(image => image.url?.trim()).map(image => ({
        ...image,
        url: image.url.trim(),
        focalX: Math.max(0, Math.min(100, Number(image.focalX ?? 50))),
        focalY: Math.max(0, Math.min(100, Number(image.focalY ?? 50))),
      }));
      const imageUrls = new Set(cleanedImages.map(image => image.url));
      const coverUrl = editing.coverUrl && imageUrls.has(editing.coverUrl) ? editing.coverUrl : cleanedImages[0]?.url || editing.coverUrl || '';
      const display = galleryDisplaySettings(editing);

      const payload: PhotoGallery = { ...editing, ...display, kind: GALLERY_KIND, slug, images: cleanedImages, coverUrl, published: editing.published !== false, updatedAt: Date.now() };
      if (payload.published && !requestPublishApproval('gallery', payload).allowed) return;

      await setDoc(doc(db, GALLERY_COLLECTION, editing.id), payload);
      await relationsRef.current?.save();
      setEditing(null);
      setLibraryPickerOpen(false);
      resetSelection();
      await fetchGalleries();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (gallery: PhotoGallery) => {
    if (!window.confirm(`Удалить галерею «${gallery.title_uk || gallery.title || gallery.title_en}»?`)) return;
    try {
      await deleteDoc(doc(db, GALLERY_COLLECTION, gallery.id));
      await cleanupPortfolioRelations('gallery', gallery.id);
      await fetchGalleries();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const moveGallery = async (id: string, direction: -1 | 1) => {
    const sorted = sortGalleries(galleries);
    const index = sorted.findIndex(item => item.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const current = sorted[index];
    const target = sorted[targetIndex];
    try {
      await Promise.all([
        setDoc(doc(db, GALLERY_COLLECTION, current.id), { order: target.order ?? targetIndex * 10, updatedAt: Date.now() }, { merge: true }),
        setDoc(doc(db, GALLERY_COLLECTION, target.id), { order: current.order ?? index * 10, updatedAt: Date.now() }, { merge: true }),
      ]);
      await fetchGalleries();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const displayImages = useMemo(() => editing?.images || [], [editing]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-700"><Images className="h-3.5 w-3.5" /><span>Gallery Layout 2.0</span></div>
          <h2 className="text-2xl font-black text-slate-900">Фотогалереи</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Masonry, grid, justified и cinematic layouts; featured-кадры, focal point, режимы подписей, bulk-операции и медиатека.</p>
        </div>
        <button onClick={createNew} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-fuchsia-700"><Plus className="h-4 w-4" /> Создать галерею</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? <div className="p-12 text-center text-slate-500">Загрузка галерей…</div> : galleries.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">Галерей пока нет. Создайте первую.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {galleries.map((gallery, index) => {
            const cover = galleryCover(gallery);
            const title = gallery.title_uk || gallery.title || gallery.title_en || 'Без названия';
            const settings = galleryDisplaySettings(gallery);
            return (
              <article key={gallery.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {cover ? <img src={cover} alt={title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><Images className="h-14 w-14" /></div>}
                  <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">{gallery.published === false ? 'Draft' : 'Published'}</div>
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-slate-700 backdrop-blur">{gallery.images?.length || 0} фото</div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black text-slate-950">{title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><span>{settings.layout}</span><span>·</span><span>{settings.columns} col</span><span>·</span><span>{settings.aspect}</span></div>
                  {(gallery.location_uk || gallery.location || gallery.date) && <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">{gallery.location_uk || gallery.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{gallery.location_uk || gallery.location}</span> : null}{gallery.date ? <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{gallery.date}</span> : null}</div>}
                  <div className="mt-auto flex items-center gap-2 pt-5">
                    <button type="button" onClick={() => moveGallery(gallery.id, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => moveGallery(gallery.id, 1)} disabled={index === galleries.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button>
                    <Link to={getGalleryPath(gallery)} target="_blank" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Открыть"><ExternalLink className="h-4 w-4" /></Link>
                    <button type="button" onClick={() => startEditing(gallery)} className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-100"><Edit3 className="h-4 w-4" />Редактировать</button>
                    <button type="button" onClick={() => handleDelete(gallery)} className="rounded-xl p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
          <div className="mx-auto my-4 max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 p-5 sm:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div><div className="text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-600">Gallery Layout 2.0</div><h3 className="mt-1 text-2xl font-black text-slate-950">{editing.title_uk || editing.title || editing.title_en || 'Новая галерея'}</h3></div>
                <div className="flex rounded-xl bg-slate-100 p-1">{LANGS.map(item => <button key={item.id} type="button" onClick={() => setLanguage(item.id)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${language === item.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{item.label}</button>)}</div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6 p-5 sm:p-8">
              <section className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Название ({language.toUpperCase()})<input value={getLocalizedField('title')} onChange={event => setLocalizedField('title', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
                <label className="text-xs font-bold text-slate-700">Дата<input type="date" value={editing.date || ''} onChange={event => setEditing({ ...editing, date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
                <label className="text-xs font-bold text-slate-700">Локация ({language.toUpperCase()})<input value={getLocalizedField('location')} onChange={event => setLocalizedField('location', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Описание ({language.toUpperCase()})<textarea rows={3} value={getLocalizedField('description')} onChange={event => setLocalizedField('description', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
                <label className="text-xs font-bold text-slate-700">Slug / URL<div className="mt-1 flex overflow-hidden rounded-xl border border-slate-300 bg-white"><span className="flex items-center bg-slate-100 px-3 text-xs text-slate-500">/galleries/</span><input value={editing.slug || ''} onChange={event => setEditing({ ...editing, slug: event.target.value })} placeholder="tournament-final-2026" className="min-w-0 flex-1 px-3 py-2.5 font-normal text-sm outline-none" /></div></label>
                <label className="text-xs font-bold text-slate-700">Порядок<input type="number" value={editing.order ?? 10} onChange={event => setEditing({ ...editing, order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">URL обложки<input type="url" value={editing.coverUrl || ''} onChange={event => setEditing({ ...editing, coverUrl: event.target.value })} placeholder="Выбирается автоматически из первой фотографии" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2"><input type="checkbox" checked={editing.published !== false} onChange={event => setEditing({ ...editing, published: event.target.checked })} className="h-4 w-4" /> Опубликована</label>
              </section>

              <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
                <div className="mb-4"><h4 className="text-sm font-black text-slate-900">Оформление галереи</h4><p className="mt-1 text-xs text-slate-500">Настройки только представления; изображения и SEO-данные не меняются.</p></div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <label className="text-xs font-bold text-slate-600">Layout<select value={editing.layout || 'masonry'} onChange={event => setEditing({ ...editing, layout: event.target.value as PhotoGallery['layout'] })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="masonry">Masonry</option><option value="grid">Grid</option><option value="justified">Justified</option><option value="cinematic">Cinematic</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Колонки<select value={editing.columns || 3} onChange={event => setEditing({ ...editing, columns: Number(event.target.value) as 2 | 3 | 4 })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Отступ<select value={editing.gap || 'medium'} onChange={event => setEditing({ ...editing, gap: event.target.value as PhotoGallery['gap'] })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="small">Small</option><option value="medium">Normal</option><option value="large">Large</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Aspect<select value={editing.aspect || 'original'} onChange={event => setEditing({ ...editing, aspect: event.target.value as PhotoGallery['aspect'] })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="original">Original</option><option value="4:3">4:3</option><option value="3:2">3:2</option><option value="1:1">Square</option></select></label>
                  <label className="text-xs font-bold text-slate-600">Подписи<select value={editing.captionMode || 'always'} onChange={event => setEditing({ ...editing, captionMode: event.target.value as PhotoGallery['captionMode'] })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="always">Always</option><option value="hover">Hover</option><option value="lightbox">Lightbox only</option></select></label>
                </div>
              </section>

              <PortfolioRelationsField ref={relationsRef} entityType="gallery" entityId={editing.id} entityTitle={editing.title_uk || editing.title || editing.title_en || 'Новая галерея'} />

              <section className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/40 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div><h4 className="text-sm font-black text-slate-900">Фотографии</h4><p className="mt-1 text-xs leading-relaxed text-slate-500">До 50 файлов за загрузку, drag&drop, featured, focal point и групповые операции.</p></div>
                  <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setLibraryPickerOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-white px-4 py-2.5 text-xs font-bold text-fuchsia-700"><Library className="h-4 w-4" /> Из медиатеки</button><input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => uploadImages(event.target.files)} /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? 'Загрузка…' : 'Загрузить фото'}</button></div>
                </div>

                {displayImages.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={selectedImageIds.size === images.length ? resetSelection : selectAll} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">{selectedImageIds.size === images.length ? 'Снять выделение' : 'Выбрать все'}</button>
                      <span className="text-[11px] font-semibold text-slate-400">Выбрано: {selectedImageIds.size}</span>
                      {selectedImageIds.size > 0 && <><button type="button" onClick={() => bulkMove('start')} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">В начало</button><button type="button" onClick={() => bulkMove('end')} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">В конец</button><button type="button" onClick={bulkClearCaptions} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">Очистить подписи {language.toUpperCase()}</button><button type="button" onClick={bulkDelete} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600">Удалить выбранные</button></>}
                    </div>
                    {selectedImageIds.size > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input value={bulkAltTemplate} onChange={event => setBulkAltTemplate(event.target.value)} placeholder="{gallery} — фото {n}" className="rounded-lg border border-slate-200 px-3 py-2 text-xs" /><button type="button" onClick={bulkApplyAlt} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white">Заполнить ALT {language.toUpperCase()}</button></div>}
                  </div>
                )}

                {displayImages.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-400">Фотографий пока нет.</div> : (
                  <div className="mt-5 space-y-3">
                    {displayImages.map((image, index) => {
                      const selected = selectedImageIds.has(image.id);
                      return (
                        <div key={image.id} draggable onDragStart={() => setDraggedImageId(image.id)} onDragEnd={() => setDraggedImageId(null)} onDragOver={event => event.preventDefault()} onDrop={() => dropImage(image.id)} className={`grid gap-4 rounded-2xl border bg-white p-4 lg:grid-cols-[28px_180px_minmax(0,1fr)_auto] lg:items-start ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                          <div className="hidden cursor-grab pt-2 text-slate-300 lg:block"><GripVertical className="h-5 w-5" /></div>
                          <div>
                            <button type="button" onClick={() => toggleSelected(image.id)} className={`mb-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-black ${selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{selected && <Check className="h-3 w-3" />}{selected ? 'Выбрано' : 'Выбрать'}</button>
                            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"><img src={image.url} alt="" className="h-full w-full object-cover" style={{ objectPosition: imageFocalPoint(image) }} />{editing.coverUrl === image.url && <span className="absolute bottom-2 left-2 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">ОБЛОЖКА</span>}{image.featured && <span className="absolute right-2 bottom-2 rounded-full bg-fuchsia-600 px-2 py-1 text-[9px] font-black text-white">FEATURED</span>}<span className="absolute right-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold text-white">#{index + 1}</span></div>
                          </div>
                          <div className="space-y-3">
                            <input value={getImageText(image, 'alt')} onChange={event => setImageText(image, 'alt', event.target.value)} placeholder={`ALT — ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
                            <textarea rows={2} value={getImageText(image, 'caption')} onChange={event => setImageText(image, 'caption', event.target.value)} placeholder={`Подпись — ${language.toUpperCase()}`} className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs" />
                            <div className="grid gap-2 sm:grid-cols-2"><label className="text-[10px] font-bold text-slate-500">Focal X — {Math.round(image.focalX ?? 50)}%<input type="range" min={0} max={100} value={image.focalX ?? 50} onChange={event => updateImage(image.id, { focalX: Number(event.target.value) })} className="mt-1 w-full" /></label><label className="text-[10px] font-bold text-slate-500">Focal Y — {Math.round(image.focalY ?? 50)}%<input type="range" min={0} max={100} value={image.focalY ?? 50} onChange={event => updateImage(image.id, { focalY: Number(event.target.value) })} className="mt-1 w-full" /></label></div>
                          </div>
                          <div className="flex gap-1 lg:flex-col">
                            {editing.coverUrl !== image.url && <button type="button" onClick={() => setEditing({ ...editing, coverUrl: image.url })} className="rounded-lg p-2 text-amber-500 hover:bg-amber-50" title="Сделать обложкой"><Star className="h-4 w-4" /></button>}
                            <button type="button" onClick={() => updateImage(image.id, { featured: !image.featured })} className={`rounded-lg p-2 ${image.featured ? 'bg-fuchsia-50 text-fuchsia-600' : 'text-slate-400 hover:bg-slate-100'}`} title="Featured"><Images className="h-4 w-4" /></button>
                            <button type="button" onClick={() => moveImage(image.id, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                            <button type="button" onClick={() => moveImage(image.id, 1)} disabled={index === displayImages.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                            <button type="button" onClick={() => removeImage(image)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="sticky bottom-0 -mx-5 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
                <button type="button" onClick={() => { setEditing(null); setLibraryPickerOpen(false); resetSelection(); }} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Отмена</button>
                <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Сохранение…' : 'Сохранить галерею'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && libraryPickerOpen && <MediaLibraryPicker type="image" multiple title="Добавить фотографии из медиатеки" onSelectMany={addImagesFromLibrary} onClose={() => setLibraryPickerOpen(false)} />}
    </div>
  );
}
