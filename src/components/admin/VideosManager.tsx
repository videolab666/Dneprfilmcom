import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  ExternalLink,
  Film,
  GripVertical,
  Library,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import type { Locale } from '../../types';
import { slugifyCase } from '../../lib/caseMedia';
import { uploadPortfolioImage, uploadPortfolioVideo } from '../../lib/mediaUpload';
import type { MediaLibraryAsset } from '../../lib/mediaLibrary';
import { cleanupPortfolioRelations } from '../../lib/portfolioRelationsAdmin';
import { ResponsiveImage } from '../ResponsiveImage';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import {
  PortfolioRelationsField,
  type PortfolioRelationsFieldHandle,
} from './PortfolioRelationsField';
import {
  VIDEO_PROJECT_COLLECTION,
  VIDEO_PROJECT_KIND,
  createVideoProjectMedia,
  getVideoProjectPath,
  isVideoProject,
  sortVideoProjects,
  videoMediaPoster,
  videoProjectCover,
  type VideoProject,
  type VideoProjectMedia,
  type VideoProjectFormat,
} from '../../lib/videoPortfolio';

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

type LibraryPickerMode =
  | { kind: 'cover' }
  | { kind: 'videos' }
  | { kind: 'poster'; mediaId: string }
  | null;

function localDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function emptyProject(order: number): VideoProject {
  return {
    id: `video-project-${Date.now()}`,
    kind: VIDEO_PROJECT_KIND,
    slug: '',
    title: '',
    title_uk: '',
    title_en: '',
    client: '',
    client_uk: '',
    client_en: '',
    category: '',
    category_uk: '',
    category_en: '',
    description: '',
    description_uk: '',
    description_en: '',
    result: '',
    result_uk: '',
    result_en: '',
    location: '',
    location_uk: '',
    location_en: '',
    date: localDateValue(),
    coverUrl: '',
    tags: [],
    tags_uk: [],
    tags_en: [],
    videos: [],
    published: true,
    featured: false,
    order,
    createdAt: Date.now(),
  };
}

function localeKey(base: string, locale: Locale): string {
  if (locale === 'uk') return `${base}_uk`;
  if (locale === 'en') return `${base}_en`;
  return base;
}

function cleanForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function libraryVideoId(): string {
  return `video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function VideosManager() {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VideoProject | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [libraryPicker, setLibraryPicker] = useState<LibraryPickerMode>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const relationsRef = useRef<PortfolioRelationsFieldHandle>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, VIDEO_PROJECT_COLLECTION));
      const loaded = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(isVideoProject);
      setProjects(sortVideoProjects(loaded));
    } catch (err) {
      console.error('Could not load video projects:', err);
      setError('Не удалось загрузить видеопроекты.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchProjects(); }, []);

  const maxOrder = useMemo(() => Math.max(-1, ...projects.map(item => item.order ?? -1)), [projects]);

  const setProjectField = (base: string, value: string) => {
    if (!editing) return;
    const key = localeKey(base, language);
    setEditing({ ...editing, [key]: value });
  };

  const getProjectField = (base: string): string => {
    if (!editing) return '';
    return String((editing as unknown as Record<string, unknown>)[localeKey(base, language)] || '');
  };

  const getTags = (): string => {
    if (!editing) return '';
    const key = language === 'uk' ? 'tags_uk' : language === 'en' ? 'tags_en' : 'tags';
    return ((editing as unknown as Record<string, unknown>)[key] as string[] | undefined || []).join(', ');
  };

  const setTags = (value: string) => {
    if (!editing) return;
    const key = language === 'uk' ? 'tags_uk' : language === 'en' ? 'tags_en' : 'tags';
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    setEditing({ ...editing, [key]: tags });
  };

  const saveProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const fallbackTitle = editing.title_uk || editing.title || editing.title_en;
    if (!fallbackTitle.trim()) {
      setError('Укажите название хотя бы на одном языке.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let slug = editing.slug?.trim() ? slugifyCase(editing.slug) : slugifyCase(fallbackTitle);
      const duplicate = projects.some(project => project.id !== editing.id && slugifyCase(project.slug || project.title_uk || project.title || project.title_en || project.id) === slug);
      if (duplicate) slug = `${slug}-${editing.id.replace(/^video-project-/, '').slice(-8)}`;
      const payload: VideoProject = {
        ...editing,
        kind: VIDEO_PROJECT_KIND,
        slug,
        videos: (editing.videos || []).filter(item => item.url.trim()),
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, VIDEO_PROJECT_COLLECTION, payload.id), cleanForFirestore(payload));
      await relationsRef.current?.save();
      setEditing(null);
      setLibraryPicker(null);
      await fetchProjects();
    } catch (err) {
      console.error('Could not save video project:', err);
      setError(err instanceof Error ? err.message : 'Не удалось сохранить видеопроект.');
    } finally {
      setSaving(false);
    }
  };

  const removeProject = async (project: VideoProject) => {
    if (!window.confirm(`Удалить видеопроект «${project.title_uk || project.title || project.title_en || project.id}»?`)) return;
    try {
      await deleteDoc(doc(db, VIDEO_PROJECT_COLLECTION, project.id));
      await cleanupPortfolioRelations('video', project.id);
      await fetchProjects();
    } catch (err) {
      console.error('Could not delete video project:', err);
      setError('Не удалось удалить видеопроект.');
    }
  };

  const moveProject = async (project: VideoProject, direction: -1 | 1) => {
    const ordered = sortVideoProjects(projects);
    const index = ordered.findIndex(item => item.id === project.id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) return;
    const first = { ...ordered[index], order: swapIndex, updatedAt: Date.now() };
    const second = { ...ordered[swapIndex], order: index, updatedAt: Date.now() };
    await Promise.all([
      setDoc(doc(db, VIDEO_PROJECT_COLLECTION, first.id), cleanForFirestore(first)),
      setDoc(doc(db, VIDEO_PROJECT_COLLECTION, second.id), cleanForFirestore(second)),
    ]);
    await fetchProjects();
  };

  const uploadCover = async (files: FileList | null) => {
    if (!editing || !files?.[0]) return;
    setUploadingCover(true);
    setError('');
    try {
      const uploaded = await uploadPortfolioImage(files[0], editing.id);
      setEditing({ ...editing, coverUrl: uploaded.url, coverCloudinaryPublicId: uploaded.publicId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки обложки.');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const chooseCoverFromLibrary = (asset: MediaLibraryAsset) => {
    if (!editing || asset.assetType !== 'image') return;
    setEditing({ ...editing, coverUrl: asset.url, coverCloudinaryPublicId: asset.publicId });
    setLibraryPicker(null);
  };

  const addVideoUrl = () => {
    if (!editing || !videoUrl.trim()) return;
    const media = createVideoProjectMedia(videoUrl.trim());
    if (editing.videos.some(item => item.url === media.url)) {
      setVideoUrl('');
      return;
    }
    setEditing({ ...editing, videos: [...editing.videos, media] });
    setVideoUrl('');
  };

  const uploadVideos = async (files: FileList | null) => {
    if (!editing || !files?.length) return;
    setUploadingVideo(true);
    setError('');
    try {
      const uploadedItems: VideoProjectMedia[] = [];
      for (const file of Array.from(files).slice(0, 10)) {
        const uploaded = await uploadPortfolioVideo(file, editing.id);
        uploadedItems.push({
          id: libraryVideoId(),
          type: 'video',
          url: uploaded.url,
          posterUrl: uploaded.posterUrl,
          cloudinaryPublicId: uploaded.publicId,
          format: '16:9',
        });
      }
      setEditing(current => current ? { ...current, videos: [...current.videos, ...uploadedItems] } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки видео.');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const addVideosFromLibrary = (assets: MediaLibraryAsset[]) => {
    if (!editing) return;
    const existing = new Set(editing.videos.map(item => item.url));
    const added: VideoProjectMedia[] = assets
      .filter(asset => asset.assetType === 'video' && !existing.has(asset.url))
      .map(asset => ({
        id: libraryVideoId(),
        type: 'video',
        url: asset.url,
        posterUrl: asset.previewUrl,
        cloudinaryPublicId: asset.publicId,
        format: '16:9',
        title: asset.name || undefined,
        title_uk: asset.name || undefined,
        title_en: asset.name || undefined,
      }));
    setEditing({ ...editing, videos: [...editing.videos, ...added] });
    setLibraryPicker(null);
  };

  const choosePosterFromLibrary = (asset: MediaLibraryAsset) => {
    if (!editing || asset.assetType !== 'image' || !libraryPicker || libraryPicker.kind !== 'poster') return;
    setEditing({
      ...editing,
      videos: editing.videos.map(item => item.id === libraryPicker.mediaId ? { ...item, posterUrl: asset.url } : item),
    });
    setLibraryPicker(null);
  };

  const updateMedia = (id: string, patch: Partial<VideoProjectMedia>) => {
    if (!editing) return;
    setEditing({ ...editing, videos: editing.videos.map(item => item.id === id ? { ...item, ...patch } : item) });
  };

  const updateMediaLocalized = (id: string, base: 'title' | 'caption', value: string) => {
    const key = localeKey(base, language);
    updateMedia(id, { [key]: value });
  };

  const mediaLocalizedValue = (media: VideoProjectMedia, base: 'title' | 'caption'): string => {
    const key = localeKey(base, language);
    return String((media as unknown as Record<string, unknown>)[key] || '');
  };

  const moveMedia = (id: string, direction: -1 | 1) => {
    if (!editing) return;
    const index = editing.videos.findIndex(item => item.id === id);
    const swap = index + direction;
    if (index < 0 || swap < 0 || swap >= editing.videos.length) return;
    const next = [...editing.videos];
    [next[index], next[swap]] = [next[swap], next[index]];
    setEditing({ ...editing, videos: next });
  };

  const dropMedia = (targetId: string) => {
    if (!editing || !draggedId || draggedId === targetId) return;
    const next = [...editing.videos];
    const from = next.findIndex(item => item.id === draggedId);
    const to = next.findIndex(item => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setEditing({ ...editing, videos: next });
    setDraggedId(null);
  };

  const closeEditor = () => {
    setEditing(null);
    setLibraryPicker(null);
    setError('');
  };

  if (editing) {
    const cover = videoProjectCover(editing);
    return (
      <>
        <form onSubmit={saveProject} className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Video Portfolio CMS</div>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{editing.title_uk || editing.title || editing.title_en || 'Новый видеопроект'}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={closeEditor} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Отмена</button>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Сохранить</button>
            </div>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          <PortfolioRelationsField
            ref={relationsRef}
            entityType="video"
            entityId={editing.id}
            entityTitle={editing.title_uk || editing.title || editing.title_en || 'Новый видеопроект'}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap gap-2">
                  {LANGS.map(lang => (
                    <button type="button" key={lang.id} onClick={() => setLanguage(lang.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${language === lang.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{lang.label}</button>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Название *</span><input value={getProjectField('title')} onChange={e => setProjectField('title', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
                  <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Клиент</span><input value={getProjectField('client')} onChange={e => setProjectField('client', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
                  <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Категория</span><input value={getProjectField('category')} onChange={e => setProjectField('category', e.target.value)} placeholder="Реклама / Спорт / Corporate / Reels" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
                  <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Описание</span><textarea value={getProjectField('description')} onChange={e => setProjectField('description', e.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
                  <label className="md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Результат / эффект</span><textarea value={getProjectField('result')} onChange={e => setProjectField('result', e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
                  <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Локация</span><input value={getProjectField('location')} onChange={e => setProjectField('location', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
                  <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Теги через запятую</span><input value={getTags()} onChange={e => setTags(e.target.value)} placeholder="4K, Sony FX6, Drone, Reels" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" /></label>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><h3 className="text-lg font-black text-slate-950">Видео проекта</h3><p className="mt-1 text-xs text-slate-500">YouTube, Vimeo, прямой MP4/WebM, загрузка файла или повторное использование из медиатеки.</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setLibraryPicker({ kind: 'videos' })} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><Library className="h-4 w-4" />Из медиатеки</button>
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" multiple className="hidden" onChange={e => void uploadVideos(e.target.files)} />
                    <button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploadingVideo} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">{uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Загрузить видео</button>
                  </div>
                </div>
                <div className="mt-4 flex gap-2"><input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube / Vimeo / https://.../video.mp4" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500" /><button type="button" onClick={addVideoUrl} className="rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800">Добавить URL</button></div>

                <div className="mt-6 space-y-4">
                  {editing.videos.map((media, index) => {
                    const poster = videoMediaPoster(media);
                    return (
                      <div key={media.id} draggable onDragStart={() => setDraggedId(media.id)} onDragEnd={() => setDraggedId(null)} onDragOver={e => e.preventDefault()} onDrop={() => dropMedia(media.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex gap-4">
                          <div className="hidden w-36 shrink-0 sm:block">{poster ? <ResponsiveImage src={poster} alt="" displayWidth={320} sizes="144px" className="aspect-video w-full rounded-xl object-cover" /> : <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-white/40"><Film className="h-8 w-8" /></div>}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2"><GripVertical className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate text-xs font-black uppercase tracking-wide text-slate-500">{index + 1}. {media.type}</span></div>
                              <div className="flex gap-1"><button type="button" onClick={() => moveMedia(media.id, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => moveMedia(media.id, 1)} disabled={index === editing.videos.length - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => setEditing({ ...editing, videos: editing.videos.filter(item => item.id !== media.id) })} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <label className="md:col-span-2"><span className="mb-1 block text-[11px] font-bold text-slate-500">URL</span><input value={media.url} onChange={e => updateMedia(media.id, { url: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" /></label>
                              <label><span className="mb-1 block text-[11px] font-bold text-slate-500">Формат</span><select value={media.format || '16:9'} onChange={e => updateMedia(media.id, { format: e.target.value as VideoProjectFormat })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option value="16:9">16:9</option><option value="9:16">9:16 / Reels</option><option value="1:1">1:1</option></select></label>
                              <div>
                                <span className="mb-1 block text-[11px] font-bold text-slate-500">Poster</span>
                                <div className="flex gap-2"><input value={media.posterUrl || ''} onChange={e => updateMedia(media.id, { posterUrl: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" /><button type="button" onClick={() => setLibraryPicker({ kind: 'poster', mediaId: media.id })} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-indigo-600 hover:bg-indigo-50" title="Выбрать poster из медиатеки"><Library className="h-4 w-4" /></button></div>
                              </div>
                              <label><span className="mb-1 block text-[11px] font-bold text-slate-500">Название ({language.toUpperCase()})</span><input value={mediaLocalizedValue(media, 'title')} onChange={e => updateMediaLocalized(media.id, 'title', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" /></label>
                              <label><span className="mb-1 block text-[11px] font-bold text-slate-500">Подпись ({language.toUpperCase()})</span><input value={mediaLocalizedValue(media, 'caption')} onChange={e => updateMediaLocalized(media.id, 'caption', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" /></label>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {editing.videos.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">Добавьте хотя бы одно видео.</div>}
                </div>
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black text-slate-950">Обложка проекта</h3>
                <div className="mt-4 overflow-hidden rounded-2xl bg-slate-900">{cover ? <ResponsiveImage src={cover} alt="" displayWidth={700} sizes="340px" className="aspect-video w-full object-cover" /> : <div className="flex aspect-video items-center justify-center text-white/30"><Film className="h-12 w-12" /></div>}</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setLibraryPicker({ kind: 'cover' })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><Library className="h-4 w-4" />Медиатека</button>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => void uploadCover(e.target.files)} />
                  <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">{uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Загрузить</button>
                </div>
                <input value={editing.coverUrl || ''} onChange={e => setEditing({ ...editing, coverUrl: e.target.value })} placeholder="или URL обложки" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" />
              </section>

              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Slug</span><input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="автоматически из названия" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Дата проекта</span><input type="date" value={editing.date || ''} onChange={e => setEditing({ ...editing, date: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                <label><span className="mb-1.5 block text-xs font-bold text-slate-600">Порядок</span><input type="number" value={editing.order ?? 0} onChange={e => setEditing({ ...editing, order: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700"><span>Опубликован</span><input type="checkbox" checked={editing.published !== false} onChange={e => setEditing({ ...editing, published: e.target.checked })} className="h-4 w-4" /></label>
                <label className="flex items-center justify-between gap-4 rounded-xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-800"><span>Featured</span><input type="checkbox" checked={Boolean(editing.featured)} onChange={e => setEditing({ ...editing, featured: e.target.checked })} className="h-4 w-4" /></label>
                {editing.slug && <Link to={getVideoProjectPath(editing)} target="_blank" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600"><ExternalLink className="h-4 w-4" />Открыть страницу</Link>}
              </section>
            </aside>
          </div>
        </form>

        {libraryPicker?.kind === 'cover' && (
          <MediaLibraryPicker type="image" title="Выбрать обложку из медиатеки" onSelect={chooseCoverFromLibrary} onClose={() => setLibraryPicker(null)} />
        )}
        {libraryPicker?.kind === 'videos' && (
          <MediaLibraryPicker type="video" multiple title="Добавить видео из медиатеки" onSelectMany={addVideosFromLibrary} onClose={() => setLibraryPicker(null)} />
        )}
        {libraryPicker?.kind === 'poster' && (
          <MediaLibraryPicker type="image" title="Выбрать poster из медиатеки" onSelect={choosePosterFromLibrary} onClose={() => setLibraryPicker(null)} />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Video Portfolio CMS</div><h2 className="mt-1 text-2xl font-black text-slate-950">Видеопроекты</h2><p className="mt-1 text-sm text-slate-500">YouTube, Vimeo, MP4/WebM, Reels и несколько роликов внутри одного проекта.</p></div>
        <button type="button" onClick={() => { setError(''); setLibraryPicker(null); setEditing(emptyProject(maxOrder + 1)); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500"><Plus className="h-4 w-4" />Создать видеопроект</button>
      </div>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>
      ) : projects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><Film className="mx-auto h-12 w-12 text-slate-300" /><div className="mt-4 text-lg font-black text-slate-800">Видеопроектов пока нет</div></div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((project, index) => {
            const cover = videoProjectCover(project);
            return (
              <article key={project.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid sm:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="relative bg-slate-950">
                    {cover ? <ResponsiveImage src={cover} alt="" displayWidth={500} sizes="220px" className="h-full min-h-44 w-full object-cover" /> : <div className="flex min-h-44 items-center justify-center text-white/30"><Film className="h-12 w-12" /></div>}
                    <div className="absolute left-3 top-3 flex gap-2">{project.featured && <span className="rounded-full bg-amber-400 px-2 py-1 text-[10px] font-black text-slate-950"><Star className="mr-1 inline h-3 w-3 fill-current" />FEATURED</span>}<span className={`rounded-full px-2 py-1 text-[10px] font-black ${project.published !== false ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'}`}>{project.published !== false ? 'LIVE' : 'DRAFT'}</span></div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4"><div><div className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">{project.category_uk || project.category || 'Видео'}</div><h3 className="mt-1 text-lg font-black text-slate-950">{project.title_uk || project.title || project.title_en || project.id}</h3><div className="mt-1 text-xs text-slate-500">{project.client_uk || project.client || ''} · {project.videos.length} видео</div></div><div className="flex gap-1"><button type="button" disabled={index === 0} onClick={() => void moveProject(project, -1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={index === projects.length - 1} onClick={() => void moveProject(project, 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button></div></div>
                    <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => { setLanguage('uk'); setError(''); setLibraryPicker(null); setEditing(project); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"><Edit3 className="h-3.5 w-3.5" />Редактировать</button><Link to={getVideoProjectPath(project)} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5" />Страница</Link><button type="button" onClick={() => void removeProject(project)} className="ml-auto inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Удалить</button></div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
