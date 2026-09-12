import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Edit3,
  GripVertical,
  Image as ImageIcon,
  Link2,
  Loader2,
  Play,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CaseMediaItem, CaseMediaType, CaseStudy, Locale } from '../../types';
import {
  createCaseMediaItem,
  detectCaseMediaType,
  getCaseSlug,
  getMediaPreview,
  getYouTubeThumbnail,
  normalizedCaseMedia,
  slugifyCase,
} from '../../lib/caseMedia';
import { deleteCaseImage, uploadCaseImage } from '../../lib/mediaUpload';

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

const emptyCase = (): CaseStudy => ({
  id: `case-${Date.now()}`,
  slug: '',
  title: '',
  title_uk: '',
  title_en: '',
  category: 'LIVE',
  client: '',
  categoryLabel: '',
  categoryLabel_uk: '',
  categoryLabel_en: '',
  description: '',
  description_uk: '',
  description_en: '',
  challenge: '',
  challenge_uk: '',
  challenge_en: '',
  solution: '',
  solution_uk: '',
  solution_en: '',
  result: '',
  result_uk: '',
  result_en: '',
  location: '',
  location_uk: '',
  location_en: '',
  year: '',
  metrics: [],
  metrics_uk: [],
  metrics_en: [],
  imageUrl: '',
  videoUrl: '',
  videoBadge: '',
  media: [],
  published: true,
  featured: true,
  featuredOrder: 99,
  createdAt: Date.now(),
});

function metricsToText(metrics?: { label: string; value: string }[]): string {
  return (metrics || []).map(item => `${item.label} | ${item.value}`).join('\n');
}

function textToMetrics(value: string): { label: string; value: string }[] {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [label, ...rest] = line.split('|');
      return { label: label.trim(), value: rest.join('|').trim() };
    })
    .filter(item => item.label && item.value);
}

function mediaLabel(type: CaseMediaType): string {
  if (type === 'youtube') return 'YouTube';
  if (type === 'vimeo') return 'Vimeo';
  if (type === 'video') return 'Video URL';
  return 'Фото';
}

export function CasesManager() {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);
  const [pendingDeletePaths, setPendingDeletePaths] = useState<string[]>([]);
  const [newUploadPaths, setNewUploadPaths] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCases = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'cases'));
      const list = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() } as CaseStudy))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setCases(list);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const startEditing = (item: CaseStudy) => {
    setEditing({
      ...item,
      slug: item.slug || '',
      media: normalizedCaseMedia(item),
      published: item.published !== false,
    });
    setLanguage('uk');
    setError('');
    setPendingDeletePaths([]);
    setNewUploadPaths([]);
    setNewMediaUrl('');
  };

  const createNew = () => {
    setEditing(emptyCase());
    setLanguage('uk');
    setError('');
    setPendingDeletePaths([]);
    setNewUploadPaths([]);
    setNewMediaUrl('');
  };

  const getLocalizedField = (base: 'title' | 'categoryLabel' | 'description' | 'challenge' | 'solution' | 'result' | 'location'): string => {
    if (!editing) return '';
    if (language === 'ru') return String(editing[base] || '');
    const localizedKey = `${base}_${language}` as keyof CaseStudy;
    return String(editing[localizedKey] || '');
  };

  const setLocalizedField = (base: 'title' | 'categoryLabel' | 'description' | 'challenge' | 'solution' | 'result' | 'location', value: string) => {
    if (!editing) return;
    if (language === 'ru') {
      setEditing({ ...editing, [base]: value });
      return;
    }
    setEditing({ ...editing, [`${base}_${language}`]: value });
  };

  const getLocalizedMetrics = (): { label: string; value: string }[] => {
    if (!editing) return [];
    if (language === 'uk') return editing.metrics_uk || editing.metrics || [];
    if (language === 'en') return editing.metrics_en || editing.metrics_uk || editing.metrics || [];
    return editing.metrics || [];
  };

  const setLocalizedMetrics = (value: string) => {
    if (!editing) return;
    const next = textToMetrics(value);
    if (language === 'uk') {
      setEditing({ ...editing, metrics_uk: next });
    } else if (language === 'en') {
      setEditing({ ...editing, metrics_en: next });
    } else {
      setEditing({ ...editing, metrics: next });
    }
  };

  const cancelEditing = async () => {
    const orphaned = Array.from(new Set<string>(newUploadPaths));
    if (orphaned.length) await Promise.all(orphaned.map((path: string) => deleteCaseImage(path)));
    setNewUploadPaths([]);
    setPendingDeletePaths([]);
    setEditing(null);
  };

  const media = editing?.media || [];

  const updateMedia = (id: string, patch: Partial<CaseMediaItem>) => {
    if (!editing) return;
    setEditing({
      ...editing,
      media: media.map(item => item.id === id ? { ...item, ...patch } : item),
    });
  };

  const getMediaText = (item: CaseMediaItem, base: 'title' | 'caption' | 'alt') => {
    if (language === 'ru') return item[base] || '';
    return item[`${base}_${language}` as keyof CaseMediaItem] as string || '';
  };

  const setMediaText = (item: CaseMediaItem, base: 'title' | 'caption' | 'alt', value: string) => {
    const key = language === 'ru' ? base : `${base}_${language}`;
    updateMedia(item.id, { [key]: value });
  };

  const addMediaByUrl = () => {
    if (!editing) return;
    const url = newMediaUrl.trim();
    if (!url) return;
    const type = detectCaseMediaType(url);
    const item = createCaseMediaItem(type, url);
    if (type === 'youtube') item.thumbnailUrl = getYouTubeThumbnail(url) || undefined;
    setEditing({
      ...editing,
      media: [...media, item],
      imageUrl: editing.imageUrl || (type === 'image' ? url : editing.imageUrl),
      videoUrl: editing.videoUrl || (type !== 'image' ? url : editing.videoUrl),
    });
    setNewMediaUrl('');
  };

  const uploadImages = async (files: FileList | null) => {
    if (!editing || !files?.length) return;
    setUploading(true);
    setError('');
    try {
      const added: CaseMediaItem[] = [];
      for (const file of Array.from(files).slice(0, 20)) {
        const uploaded = await uploadCaseImage(file, editing.id);
        setNewUploadPaths(paths => [...paths, uploaded.storagePath]);
        added.push({
          ...createCaseMediaItem('image', uploaded.url),
          storagePath: uploaded.storagePath,
          alt_uk: editing.title_uk || editing.title || file.name,
          alt: editing.title || editing.title_uk || file.name,
          alt_en: editing.title_en || editing.title_uk || editing.title || file.name,
        });
      }
      const nextMedia = [...media, ...added];
      setEditing({
        ...editing,
        media: nextMedia,
        imageUrl: editing.imageUrl || added[0]?.url || '',
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (item: CaseMediaItem) => {
    if (!editing) return;
    const nextMedia = media.filter(mediaItem => mediaItem.id !== item.id);
    if (item.storagePath) setPendingDeletePaths(paths => [...paths, item.storagePath!]);
    const nextCover = editing.imageUrl === item.url
      ? nextMedia.find(mediaItem => mediaItem.type === 'image')?.url || ''
      : editing.imageUrl;
    const nextVideo = editing.videoUrl === item.url
      ? nextMedia.find(mediaItem => mediaItem.type !== 'image')?.url || ''
      : editing.videoUrl;
    setEditing({ ...editing, media: nextMedia, imageUrl: nextCover, videoUrl: nextVideo });
  };

  const moveMedia = (id: string, direction: -1 | 1) => {
    if (!editing) return;
    const index = media.findIndex(item => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= media.length) return;
    const next = [...media];
    [next[index], next[target]] = [next[target], next[index]];
    setEditing({ ...editing, media: next });
  };

  const dropMedia = (targetId: string) => {
    if (!editing || !draggedMediaId || draggedMediaId === targetId) return;
    const source = media.findIndex(item => item.id === draggedMediaId);
    const target = media.findIndex(item => item.id === targetId);
    if (source < 0 || target < 0) return;
    const next = [...media];
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    setEditing({ ...editing, media: next });
    setDraggedMediaId(null);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const anyTitle = editing.title_uk?.trim() || editing.title?.trim() || editing.title_en?.trim();
    if (!anyTitle) {
      setError('Укажите название кейса хотя бы на одном языке.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let slug = editing.slug?.trim() ? slugifyCase(editing.slug) : slugifyCase(anyTitle);
      const duplicate = cases.some(item => item.id !== editing.id && getCaseSlug(item) === slug);
      if (duplicate) slug = `${slug}-${editing.id.replace(/^case-/, '').slice(-8)}`;

      const cleanedMedia = (editing.media || [])
        .filter(item => item.url?.trim())
        .map(item => ({
          ...item,
          url: item.url.trim(),
          type: item.type || detectCaseMediaType(item.url),
          thumbnailUrl: item.type === 'youtube' ? (item.thumbnailUrl || getYouTubeThumbnail(item.url) || undefined) : item.thumbnailUrl,
        }));

      const firstImage = cleanedMedia.find(item => item.type === 'image');
      const firstVideo = cleanedMedia.find(item => item.type !== 'image');
      const payload: CaseStudy = {
        ...editing,
        slug,
        title_uk: editing.title_uk || undefined,
        title_en: editing.title_en || undefined,
        imageUrl: editing.imageUrl || firstImage?.url || '',
        videoUrl: editing.videoUrl || firstVideo?.url || '',
        media: cleanedMedia,
        published: editing.published !== false,
      };

      await setDoc(doc(db, 'cases', editing.id), payload);
      const referencedPaths = new Set<string>(
        cleanedMedia
          .map(item => item.storagePath)
          .filter((path): path is string => Boolean(path))
      );
      const orphanedUploads = newUploadPaths.filter(path => !referencedPaths.has(path));
      const pathsToDelete = [...new Set([...pendingDeletePaths, ...orphanedUploads])];
      await Promise.all(pathsToDelete.map(path => deleteCaseImage(path)));
      setPendingDeletePaths([]);
      setNewUploadPaths([]);
      setEditing(null);
      await fetchCases();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CaseStudy) => {
    if (!window.confirm('Удалить кейс? Он исчезнет с публичной страницы.')) return;
    try {
      await deleteDoc(doc(db, 'cases', item.id));
      const paths = (item.media || []).map(mediaItem => mediaItem.storagePath).filter(Boolean) as string[];
      await Promise.all(paths.map(path => deleteCaseImage(path)));
      await fetchCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const displayTitle = (item: CaseStudy) => item.title_uk || item.title || item.title_en || 'Без названия';
  const displayMedia = useMemo(() => editing?.media || [], [editing]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <Briefcase className="h-3.5 w-3.5" /><span>Portfolio CMS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Кейсы студии</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Полноценные страницы проектов: обложка, YouTube/Vimeo, фотогалерея, подписи на трёх языках, метрики и отдельный SEO-friendly URL.</p>
        </div>
        <button onClick={createNew} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Добавить кейс
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка кейсов…</div>
      ) : cases.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">Кейсы не найдены.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cases.map(item => (
            <article key={item.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                {item.imageUrl ? <img src={item.imageUrl} alt={displayTitle(item)} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><ImageIcon className="h-10 w-10" /></div>}
                <div className="absolute left-3 top-3 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white">{item.category}</div>
                <div className="absolute right-3 top-3 flex gap-2">
                  {item.published === false && <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white">Черновик</span>}
                  {item.featured !== false && <span className="rounded-full bg-slate-950/85 p-1.5 text-amber-300"><Star className="h-3 w-3 fill-current" /></span>}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-bold text-slate-900">{displayTitle(item)}</h3>
                <div className="mt-1 text-xs text-slate-500">{item.client}</div>
                <div className="mt-2 text-[11px] text-indigo-600">/cases/{getCaseSlug(item)}</div>
                <p className="mt-3 line-clamp-3 flex-1 text-sm text-slate-500">{item.description_uk || item.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">{(item.media || []).length} media</span>
                  <div className="flex gap-1">
                    <button onClick={() => startEditing(item)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50" title="Редактировать"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Удалить"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <form onSubmit={handleSave} className="space-y-7 p-5 sm:p-8">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black">Редактор кейса</h3>
                  <p className="mt-1 text-xs text-slate-400">ID: {editing.id}</p>
                </div>
                <button type="button" onClick={() => void cancelEditing()} className="h-fit rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="mb-4 text-sm font-black text-slate-900">Основные параметры</h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs font-bold text-slate-700">Категория
                    <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value as CaseStudy['category'] })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal text-sm">
                      <option value="LIVE">LIVE</option><option value="VIDEO">VIDEO</option><option value="CONSTRUCTION">CONSTRUCTION</option><option value="OTHER">OTHER</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700 lg:col-span-2">Клиент
                    <input value={editing.client} onChange={e => setEditing({ ...editing, client: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                  </label>
                  <label className="text-xs font-bold text-slate-700">Год
                    <input value={editing.year || ''} onChange={e => setEditing({ ...editing, year: e.target.value })} placeholder="2026" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                  </label>
                  <label className="text-xs font-bold text-slate-700 sm:col-span-2">Slug / URL
                    <div className="mt-1 flex overflow-hidden rounded-xl border border-slate-300 bg-white">
                      <span className="flex items-center bg-slate-100 px-3 text-xs text-slate-500">/cases/</span>
                      <input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="ulka-dubai-expo" className="min-w-0 flex-1 px-3 py-2 font-normal text-sm outline-none" />
                    </div>
                  </label>
                  <label className="text-xs font-bold text-slate-700 sm:col-span-2">URL обложки
                    <input type="url" value={editing.imageUrl || ''} onChange={e => setEditing({ ...editing, imageUrl: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                  </label>
                  <label className="text-xs font-bold text-slate-700">Видео badge
                    <input value={editing.videoBadge || ''} onChange={e => setEditing({ ...editing, videoBadge: e.target.value })} placeholder="4K / LIVE / Case film" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                  </label>
                  <label className="text-xs font-bold text-slate-700">Порядок на главной
                    <input type="number" value={editing.featuredOrder ?? 99} onChange={e => setEditing({ ...editing, featuredOrder: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={editing.published !== false} onChange={e => setEditing({ ...editing, published: e.target.checked })} className="h-4 w-4" /> Опубликован</label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={editing.featured !== false} onChange={e => setEditing({ ...editing, featured: e.target.checked })} className="h-4 w-4" /> Показывать на главной</label>
                  <label className="text-xs font-bold text-slate-700 sm:col-span-2">Метрики ({language.toUpperCase()}): одна строка = Название | Значение
                    <textarea rows={4} value={metricsToText(getLocalizedMetrics())} onChange={e => setLocalizedMetrics(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Фото и видео кейса</h4>
                    <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">Фото загружаются в Firebase Storage и автоматически уменьшаются до WebP ≤ 2400 px. Видео лучше добавлять ссылкой YouTube/Vimeo; MP4/WebM URL тоже поддерживаются. Порядок элементов можно менять перетаскиванием.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => uploadImages(e.target.files)} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-60">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? 'Загрузка…' : 'Загрузить фото'}
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={newMediaUrl} onChange={e => setNewMediaUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMediaByUrl(); } }} placeholder="YouTube / Vimeo / MP4 / URL изображения" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <button type="button" onClick={addMediaByUrl} className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50">Добавить URL</button>
                </div>

                {displayMedia.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-400">Пока нет медиа. Загрузите фотографии или вставьте ссылку на YouTube/Vimeo.</div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {displayMedia.map((item, index) => {
                      const preview = getMediaPreview(item);
                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={() => setDraggedMediaId(item.id)}
                          onDragOver={event => event.preventDefault()}
                          onDrop={() => dropMedia(item.id)}
                          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[28px_160px_minmax(0,1fr)_auto] lg:items-start"
                        >
                          <div className="hidden cursor-grab pt-2 text-slate-300 lg:block"><GripVertical className="h-5 w-5" /></div>
                          <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
                            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/70">{item.type === 'image' ? <ImageIcon className="h-8 w-8" /> : <Play className="h-8 w-8" />}</div>}
                            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">{mediaLabel(item.type)}</span>
                            {editing.imageUrl === item.url && item.type === 'image' && <span className="absolute bottom-2 left-2 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">ОБЛОЖКА</span>}
                          </div>

                          <div className="space-y-3">
                            <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)]">
                              <select value={item.type} onChange={e => updateMedia(item.id, { type: e.target.value as CaseMediaType })} className="rounded-xl border border-slate-300 px-3 py-2 text-xs">
                                <option value="image">Фото</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="video">Video URL</option>
                              </select>
                              <input value={item.url} onChange={e => {
                                const url = e.target.value;
                                const type = detectCaseMediaType(url);
                                updateMedia(item.id, { url, type, thumbnailUrl: type === 'youtube' ? getYouTubeThumbnail(url) || undefined : item.thumbnailUrl });
                              }} className="min-w-0 rounded-xl border border-slate-300 px-3 py-2 text-xs" />
                            </div>
                            <input value={getMediaText(item, 'title')} onChange={e => setMediaText(item, 'title', e.target.value)} placeholder={`Заголовок медиа — ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
                            <textarea rows={2} value={getMediaText(item, 'caption')} onChange={e => setMediaText(item, 'caption', e.target.value)} placeholder={`Подпись / описание — ${language.toUpperCase()}`} className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs" />
                            {item.type === 'image' && <input value={getMediaText(item, 'alt')} onChange={e => setMediaText(item, 'alt', e.target.value)} placeholder={`ALT изображения — ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />}
                          </div>

                          <div className="flex gap-1 lg:flex-col">
                            {item.type === 'image' && editing.imageUrl !== item.url && <button type="button" onClick={() => setEditing({ ...editing, imageUrl: item.url })} className="rounded-lg p-2 text-amber-500 hover:bg-amber-50" title="Сделать обложкой"><Star className="h-4 w-4" /></button>}
                            <button type="button" onClick={() => moveMedia(item.id, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Выше"><ArrowUp className="h-4 w-4" /></button>
                            <button type="button" onClick={() => moveMedia(item.id, 1)} disabled={index === displayMedia.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30" title="Ниже"><ArrowDown className="h-4 w-4" /></button>
                            <button type="button" onClick={() => removeMedia(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Удалить"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {LANGS.map(item => <button key={item.id} type="button" onClick={() => setLanguage(item.id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${language === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item.label}</button>)}
                <span className="ml-auto self-center text-xs text-slate-400">Подписи медиа выше тоже редактируются для выбранного языка.</span>
              </div>

              <section className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Название
                  <input value={getLocalizedField('title')} onChange={e => setLocalizedField('title', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Подпись категории
                  <input value={getLocalizedField('categoryLabel')} onChange={e => setLocalizedField('categoryLabel', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Локация
                  <input value={getLocalizedField('location')} onChange={e => setLocalizedField('location', e.target.value)} placeholder="Дніпро / Dubai, UAE" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Описание
                  <textarea rows={3} value={getLocalizedField('description')} onChange={e => setLocalizedField('description', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Задача / Challenge
                  <textarea rows={3} value={getLocalizedField('challenge')} onChange={e => setLocalizedField('challenge', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Решение
                  <textarea rows={3} value={getLocalizedField('solution')} onChange={e => setLocalizedField('solution', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Результат
                  <textarea rows={3} value={getLocalizedField('result')} onChange={e => setLocalizedField('result', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal text-sm" />
                </label>
              </section>

              <div className="sticky bottom-0 -mx-5 flex justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
                <button type="button" onClick={() => void cancelEditing()} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Отмена</button>
                <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Сохранение…' : 'Сохранить кейс'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
