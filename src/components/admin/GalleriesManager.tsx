import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
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
import { uploadCaseImage } from '../../lib/mediaUpload';
import { slugifyCase } from '../../lib/caseMedia';
import type { MediaLibraryAsset } from '../../lib/mediaLibrary';
import { cleanupPortfolioRelations } from '../../lib/portfolioRelationsAdmin';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import {
  PortfolioRelationsField,
  type PortfolioRelationsFieldHandle,
} from './PortfolioRelationsField';
import {
  GALLERY_COLLECTION,
  GALLERY_KIND,
  galleryCover,
  getGalleryPath,
  getGallerySlug,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const relationsRef = useRef<PortfolioRelationsFieldHandle>(null);

  const fetchGalleries = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, GALLERY_COLLECTION));
      const list = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .filter(isPhotoGallery);
      setGalleries(sortGalleries(list));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleries();
  }, []);

  const startEditing = (gallery: PhotoGallery) => {
    setEditing({
      ...gallery,
      slug: gallery.slug || '',
      images: [...(gallery.images || [])],
      published: gallery.published !== false,
    });
    setLanguage('uk');
    setError('');
    setLibraryPickerOpen(false);
  };

  const createNew = () => {
    const nextOrder = galleries.length === 0
      ? 10
      : Math.max(...galleries.map(item => item.order ?? 0)) + 10;
    setEditing(emptyGallery(nextOrder));
    setLanguage('uk');
    setError('');
    setLibraryPickerOpen(false);
  };

  const getLocalizedField = (base: 'title' | 'description' | 'location'): string => {
    if (!editing) return '';
    if (language === 'ru') return String(editing[base] || '');
    return String(editing[`${base}_${language}` as keyof PhotoGallery] || '');
  };

  const setLocalizedField = (base: 'title' | 'description' | 'location', value: string) => {
    if (!editing) return;
    if (language === 'ru') {
      setEditing({ ...editing, [base]: value });
      return;
    }
    setEditing({ ...editing, [`${base}_${language}`]: value });
  };

  const images = editing?.images || [];

  const getImageText = (image: GalleryImage, base: 'alt' | 'caption'): string => {
    if (language === 'ru') return image[base] || '';
    return String(image[`${base}_${language}` as keyof GalleryImage] || '');
  };

  const updateImage = (id: string, patch: Partial<GalleryImage>) => {
    if (!editing) return;
    setEditing({
      ...editing,
      images: images.map(image => image.id === id ? { ...image, ...patch } : image),
    });
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
      const selected = Array.from(files).slice(0, 50);
      for (const file of selected) {
        const uploaded = await uploadCaseImage(file, `gallery-${editing.id}`);
        added.push({
          id: makeImageId(),
          url: uploaded.url,
          cloudinaryPublicId: uploaded.publicId,
          alt: editing.title || editing.title_uk || file.name,
          alt_uk: editing.title_uk || editing.title || file.name,
          alt_en: editing.title_en || editing.title_uk || editing.title || file.name,
          caption: '',
          caption_uk: '',
          caption_en: '',
        });
      }
      const nextImages = [...images, ...added];
      setEditing({
        ...editing,
        images: nextImages,
        coverUrl: editing.coverUrl || added[0]?.url || '',
      });
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
          id: makeImageId(),
          url: asset.url,
          cloudinaryPublicId: asset.publicId,
          alt: editing.title || editing.title_uk || fallback,
          alt_uk: editing.title_uk || editing.title || fallback,
          alt_en: editing.title_en || editing.title_uk || editing.title || fallback,
          caption: '',
          caption_uk: '',
          caption_en: '',
        };
      });
    setEditing({
      ...editing,
      images: [...images, ...added],
      coverUrl: editing.coverUrl || added[0]?.url || '',
    });
    setLibraryPickerOpen(false);
  };

  const removeImage = (image: GalleryImage) => {
    if (!editing) return;
    const nextImages = images.filter(item => item.id !== image.id);
    const nextCover = editing.coverUrl === image.url ? nextImages[0]?.url || '' : editing.coverUrl;
    setEditing({ ...editing, images: nextImages, coverUrl: nextCover });
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

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const anyTitle = editing.title_uk?.trim() || editing.title?.trim() || editing.title_en?.trim();
    if (!anyTitle) {
      setError('Укажите название галереи хотя бы на одном языке.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let slug = editing.slug?.trim() ? slugifyCase(editing.slug) : getGallerySlug({ ...editing, slug: '' });
      if (!slug) slug = editing.id;
      const duplicate = galleries.some(item => item.id !== editing.id && getGallerySlug(item) === slug);
      if (duplicate) slug = `${slug}-${editing.id.replace(/^gallery-/, '').slice(-8)}`;

      const cleanedImages = images
        .filter(image => image.url?.trim())
        .map(image => ({ ...image, url: image.url.trim() }));
      const imageUrls = new Set(cleanedImages.map(image => image.url));
      const coverUrl = editing.coverUrl && imageUrls.has(editing.coverUrl)
        ? editing.coverUrl
        : cleanedImages[0]?.url || editing.coverUrl || '';

      const payload: PhotoGallery = {
        ...editing,
        kind: GALLERY_KIND,
        slug,
        images: cleanedImages,
        coverUrl,
        published: editing.published !== false,
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, GALLERY_COLLECTION, editing.id), payload);
      await relationsRef.current?.save();
      setEditing(null);
      setLibraryPickerOpen(false);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const moveGallery = async (id: string, direction: -1 | 1) => {
    const sorted = sortGalleries(galleries);
    const index = sorted.findIndex(item => item.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];
    const currentOrder = current.order ?? index * 10;
    const targetOrder = target.order ?? targetIndex * 10;

    try {
      await Promise.all([
        setDoc(doc(db, GALLERY_COLLECTION, current.id), { order: targetOrder, updatedAt: Date.now() }, { merge: true }),
        setDoc(doc(db, GALLERY_COLLECTION, target.id), { order: currentOrder, updatedAt: Date.now() }, { merge: true }),
      ]);
      await fetchGalleries();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const displayImages = useMemo(() => editing?.images || [], [editing]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-700">
            <Images className="h-3.5 w-3.5" /><span>Photo CMS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Фотогалереи</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Отдельные публичные галереи с собственным URL, обложкой, датой, описанием и массовой загрузкой фотографий.</p>
        </div>
        <button onClick={createNew} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-fuchsia-700">
          <Plus className="h-4 w-4" /> Создать галерею
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка галерей…</div>
      ) : galleries.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">Галерей пока нет. Создайте первую.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {galleries.map((gallery, index) => {
            const cover = galleryCover(gallery);
            const title = gallery.title_uk || gallery.title || gallery.title_en || 'Без названия';
            return (
              <article key={gallery.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {cover ? <img src={cover} alt={title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><Images className="h-14 w-14" /></div>}
                  <div className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold text-white">{gallery.images.length} фото</div>
                  <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${gallery.published === false ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {gallery.published === false ? 'Черновик' : 'Опубликована'}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black text-slate-950">{title}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                    {gallery.date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{gallery.date}</span>}
                    {(gallery.location_uk || gallery.location) && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{gallery.location_uk || gallery.location}</span>}
                  </div>
                  <div className="mt-auto flex items-center gap-1 pt-5">
                    <button type="button" onClick={() => moveGallery(gallery.id, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25" title="Выше"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => moveGallery(gallery.id, 1)} disabled={index === galleries.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25" title="Ниже"><ArrowDown className="h-4 w-4" /></button>
                    <Link to={getGalleryPath(gallery)} target="_blank" className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" title="Открыть"><ExternalLink className="h-4 w-4" /></Link>
                    <button type="button" onClick={() => startEditing(gallery)} className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><Edit3 className="h-3.5 w-3.5" /> Редактировать</button>
                    <button type="button" onClick={() => handleDelete(gallery)} className="rounded-xl p-2 text-red-500 hover:bg-red-50" title="Удалить"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
          <div className="mx-auto my-4 max-w-6xl rounded-3xl bg-white shadow-2xl">
            <form onSubmit={handleSave} className="space-y-7 p-5 sm:p-8">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">{editing.createdAt === editing.updatedAt ? 'Галерея' : (editing.title_uk || editing.title || editing.title_en || 'Новая галерея')}</h3>
                  <p className="mt-1 text-xs text-slate-500">URL после сохранения: /galleries/{editing.slug || getGallerySlug(editing)}</p>
                </div>
                <button type="button" onClick={() => { setEditing(null); setLibraryPickerOpen(false); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Закрыть</button>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                {LANGS.map(item => (
                  <button key={item.id} type="button" onClick={() => setLanguage(item.id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${language === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {item.label}
                  </button>
                ))}
              </div>

              <section className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Название ({language.toUpperCase()})
                  <input value={getLocalizedField('title')} onChange={event => setLocalizedField('title', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Дата
                  <input type="date" value={editing.date || ''} onChange={event => setEditing({ ...editing, date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Локация ({language.toUpperCase()})
                  <input value={getLocalizedField('location')} onChange={event => setLocalizedField('location', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Описание ({language.toUpperCase()})
                  <textarea rows={3} value={getLocalizedField('description')} onChange={event => setLocalizedField('description', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Slug / URL
                  <div className="mt-1 flex overflow-hidden rounded-xl border border-slate-300 bg-white">
                    <span className="flex items-center bg-slate-100 px-3 text-xs text-slate-500">/galleries/</span>
                    <input value={editing.slug || ''} onChange={event => setEditing({ ...editing, slug: event.target.value })} placeholder="tournament-final-2026" className="min-w-0 flex-1 px-3 py-2.5 font-normal text-sm outline-none" />
                  </div>
                </label>
                <label className="text-xs font-bold text-slate-700">Порядок
                  <input type="number" value={editing.order ?? 10} onChange={event => setEditing({ ...editing, order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">URL обложки
                  <input type="url" value={editing.coverUrl || ''} onChange={event => setEditing({ ...editing, coverUrl: event.target.value })} placeholder="Выбирается автоматически из первой фотографии" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" />
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                  <input type="checkbox" checked={editing.published !== false} onChange={event => setEditing({ ...editing, published: event.target.checked })} className="h-4 w-4" /> Опубликована
                </label>
              </section>

              <PortfolioRelationsField
                ref={relationsRef}
                entityType="gallery"
                entityId={editing.id}
                entityTitle={editing.title_uk || editing.title || editing.title_en || 'Новая галерея'}
              />

              <section className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/40 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Фотографии</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">Можно выбрать до 50 файлов за одну загрузку или повторно использовать уже загруженные изображения из медиатеки. Порядок меняется перетаскиванием или стрелками.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setLibraryPickerOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-white px-4 py-2.5 text-xs font-bold text-fuchsia-700 hover:bg-fuchsia-50">
                      <Library className="h-4 w-4" /> Из медиатеки
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => uploadImages(event.target.files)} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-fuchsia-700 disabled:opacity-60">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? 'Загрузка…' : 'Загрузить фото'}
                    </button>
                  </div>
                </div>

                {displayImages.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-sm text-slate-400">Фотографий пока нет.</div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {displayImages.map((image, index) => (
                      <div
                        key={image.id}
                        draggable
                        onDragStart={() => setDraggedImageId(image.id)}
                        onDragEnd={() => setDraggedImageId(null)}
                        onDragOver={event => event.preventDefault()}
                        onDrop={() => dropImage(image.id)}
                        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[28px_160px_minmax(0,1fr)_auto] lg:items-start"
                      >
                        <div className="hidden cursor-grab pt-2 text-slate-300 lg:block"><GripVertical className="h-5 w-5" /></div>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                          <img src={image.url} alt="" className="h-full w-full object-cover" />
                          {editing.coverUrl === image.url && <span className="absolute bottom-2 left-2 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">ОБЛОЖКА</span>}
                          <span className="absolute right-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold text-white">#{index + 1}</span>
                        </div>
                        <div className="space-y-3">
                          <input value={getImageText(image, 'alt')} onChange={event => setImageText(image, 'alt', event.target.value)} placeholder={`ALT — ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
                          <textarea rows={2} value={getImageText(image, 'caption')} onChange={event => setImageText(image, 'caption', event.target.value)} placeholder={`Подпись — ${language.toUpperCase()}`} className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs" />
                        </div>
                        <div className="flex gap-1 lg:flex-col">
                          {editing.coverUrl !== image.url && <button type="button" onClick={() => setEditing({ ...editing, coverUrl: image.url })} className="rounded-lg p-2 text-amber-500 hover:bg-amber-50" title="Сделать обложкой"><Star className="h-4 w-4" /></button>}
                          <button type="button" onClick={() => moveImage(image.id, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Выше"><ArrowUp className="h-4 w-4" /></button>
                          <button type="button" onClick={() => moveImage(image.id, 1)} disabled={index === displayImages.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Ниже"><ArrowDown className="h-4 w-4" /></button>
                          <button type="button" onClick={() => removeImage(image)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Удалить"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="sticky bottom-0 -mx-5 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
                <button type="button" onClick={() => { setEditing(null); setLibraryPickerOpen(false); }} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Отмена</button>
                <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Сохранение…' : 'Сохранить галерею'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && libraryPickerOpen && (
        <MediaLibraryPicker
          type="image"
          multiple
          title="Добавить фотографии из медиатеки"
          onSelectMany={addImagesFromLibrary}
          onClose={() => setLibraryPickerOpen(false)}
        />
      )}
    </div>
  );
}
