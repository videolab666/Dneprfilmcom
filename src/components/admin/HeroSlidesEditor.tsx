import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Image as ImageIcon,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import type { HeroSlide, HeroSlideType, Locale, SiteSetting } from '../../types';
import { uploadHeroImage, uploadHeroVideo } from '../../lib/mediaUpload';

type HeroTextField = 'badge' | 'title' | 'subtitle' | 'ctaPrimaryText' | 'ctaSecondaryText';

interface HeroSlidesEditorProps {
  formData: SiteSetting;
  setFormData: Dispatch<SetStateAction<SiteSetting>>;
  langTab: Locale;
}

const languageLabel: Record<Locale, string> = {
  uk: 'UA',
  ru: 'RU',
  en: 'EN',
};

function makeSlide(type: HeroSlideType, url: string, extra: Partial<HeroSlide> = {}): HeroSlide {
  return {
    id: `hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    url,
    durationMs: type === 'video' ? 8000 : 6500,
    overlayOpacity: 58,
    enabled: true,
    objectPosition: 'center center',
    ...extra,
  };
}

export function HeroSlidesEditor({ formData, setFormData, langTab }: HeroSlidesEditorProps) {
  const [uploading, setUploading] = useState<'image' | 'video' | null>(null);
  const [error, setError] = useState('');
  const [newType, setNewType] = useState<HeroSlideType>('image');
  const [newUrl, setNewUrl] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const slides = useMemo(() => formData.heroSlides || [], [formData.heroSlides]);

  const setSlides = (next: HeroSlide[]) => {
    setFormData(prev => ({ ...prev, heroSlides: next }));
  };

  const updateSlide = (id: string, patch: Partial<HeroSlide>) => {
    setSlides(slides.map(slide => slide.id === id ? { ...slide, ...patch } : slide));
  };

  const removeSlide = (id: string) => {
    setSlides(slides.filter(slide => slide.id !== id));
  };

  const moveSlide = (id: string, direction: -1 | 1) => {
    const index = slides.findIndex(slide => slide.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    setSlides(next);
  };

  const dropSlide = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const source = slides.findIndex(slide => slide.id === draggedId);
    const target = slides.findIndex(slide => slide.id === targetId);
    if (source < 0 || target < 0) return;
    const next = [...slides];
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    setDraggedId(null);
    setSlides(next);
  };

  const getLocalized = (slide: HeroSlide, field: HeroTextField): string => {
    const key = langTab === 'ru' ? field : `${field}_${langTab}`;
    const value = slide[key as keyof HeroSlide];
    return typeof value === 'string' ? value : '';
  };

  const setLocalized = (slide: HeroSlide, field: HeroTextField, value: string) => {
    const key = langTab === 'ru' ? field : `${field}_${langTab}`;
    updateSlide(slide.id, { [key]: value });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading('image');
    setError('');
    try {
      const added: HeroSlide[] = [];
      for (const file of Array.from(files).slice(0, 10)) {
        const uploaded = await uploadHeroImage(file);
        added.push(makeSlide('image', uploaded.url, { cloudinaryPublicId: uploaded.publicId }));
      }
      setSlides([...slides, ...added]);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading('video');
    setError('');
    try {
      const uploaded = await uploadHeroVideo(file);
      setSlides([
        ...slides,
        makeSlide('video', uploaded.url, {
          cloudinaryPublicId: uploaded.publicId,
          posterUrl: uploaded.posterUrl,
        }),
      ]);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const addByUrl = () => {
    const url = newUrl.trim();
    if (!url) return;
    setSlides([...slides, makeSlide(newType, url)]);
    setNewUrl('');
  };

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h4 className="text-sm font-black text-slate-900">Hero media slider</h4>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
            Добавляйте фото и фоновые MP4/WebM-видео. Пустые поля текста слайда используют общий H1, подзаголовок и CTA ниже. Фото оптимизируются в WebP, медиа хранится в Cloudinary.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => void handleImageUpload(e.target.files)} />
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={e => void handleVideoUpload(e.target.files)} />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {uploading === 'image' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading === 'image' ? 'Загрузка…' : 'Загрузить фото'}
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {uploading === 'video' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            {uploading === 'video' ? 'Загрузка…' : 'Загрузить MP4/WebM'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)_auto]">
        <select value={newType} onChange={e => setNewType(e.target.value as HeroSlideType)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs">
          <option value="image">Фото URL</option>
          <option value="video">Видео URL</option>
        </select>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addByUrl(); } }}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-xs outline-none focus:border-indigo-500"
          />
        </div>
        <button type="button" onClick={addByUrl} className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50">
          <Plus className="h-4 w-4" /> Добавить
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-7 text-center text-sm text-slate-400">
          Слайдов пока нет. Пока список пуст, сайт продолжает использовать старое поле «Фоновое изображение Hero».
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {slides.map((slide, index) => (
            <article
              key={slide.id}
              draggable
              onDragStart={() => setDraggedId(slide.id)}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={event => event.preventDefault()}
              onDrop={() => dropSlide(slide.id)}
              className={`rounded-2xl border bg-white p-4 transition ${slide.enabled === false ? 'border-slate-200 opacity-65' : 'border-slate-200 shadow-sm'}`}
            >
              <div className="grid gap-4 lg:grid-cols-[28px_210px_minmax(0,1fr)]">
                <div className="hidden cursor-grab pt-2 text-slate-300 lg:block"><GripVertical className="h-5 w-5" /></div>

                <div>
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-950">
                    {slide.type === 'video' ? (
                      slide.posterUrl ? (
                        <img src={slide.posterUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <video src={slide.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      )
                    ) : slide.url ? (
                      <img src={slide.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/40"><ImageIcon className="h-8 w-8" /></div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold uppercase text-white">{slide.type}</span>
                    <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">#{index + 1}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input type="checkbox" checked={slide.enabled !== false} onChange={e => updateSlide(slide.id, { enabled: e.target.checked })} className="h-4 w-4" />
                      Активен
                    </label>
                    <div className="flex gap-1">
                      <button type="button" disabled={index === 0} onClick={() => moveSlide(slide.id, -1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25" title="Выше"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" disabled={index === slides.length - 1} onClick={() => moveSlide(slide.id, 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-25" title="Ниже"><ArrowDown className="h-4 w-4" /></button>
                      <button type="button" onClick={() => removeSlide(slide.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Удалить слайд"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Тип
                      <select value={slide.type} onChange={e => updateSlide(slide.id, { type: e.target.value as HeroSlideType })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-normal normal-case tracking-normal text-slate-800">
                        <option value="image">Фото</option><option value="video">Видео</option>
                      </select>
                    </label>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">URL медиа
                      <input value={slide.url} onChange={e => updateSlide(slide.id, { url: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-normal normal-case tracking-normal text-slate-800" />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Показ, сек.
                      <input type="number" min={3} max={30} step={0.5} value={(slide.durationMs || 7000) / 1000} onChange={e => updateSlide(slide.id, { durationMs: Math.round(Number(e.target.value || 7) * 1000) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-normal text-slate-800" />
                    </label>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Затемнение, %
                      <input type="number" min={20} max={90} value={slide.overlayOpacity ?? 58} onChange={e => updateSlide(slide.id, { overlayOpacity: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-normal text-slate-800" />
                    </label>
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Фокус кадра
                      <select value={slide.objectPosition || 'center center'} onChange={e => updateSlide(slide.id, { objectPosition: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-normal normal-case text-slate-800">
                        <option value="center center">Центр</option><option value="center top">Верх</option><option value="center bottom">Низ</option><option value="left center">Слева</option><option value="right center">Справа</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Мобильный URL (опционально)
                    <input value={slide.mobileUrl || ''} onChange={e => updateSlide(slide.id, { mobileUrl: e.target.value || undefined })} placeholder="Если пусто — используется основной файл" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-normal normal-case tracking-normal text-slate-800" />
                  </label>

                  {slide.type === 'video' && (
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Poster видео (URL)
                      <input value={slide.posterUrl || ''} onChange={e => updateSlide(slide.id, { posterUrl: e.target.value || undefined })} placeholder="Первый кадр до старта видео" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-normal normal-case tracking-normal text-slate-800" />
                    </label>
                  )}

                  <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <summary className="cursor-pointer text-xs font-bold text-slate-700">Свой текст для этого слайда [{languageLabel[langTab]}]</summary>
                    <p className="mt-2 text-[11px] text-slate-400">Оставьте поле пустым, чтобы использовать общий текст Hero.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-[11px] font-bold text-slate-500 sm:col-span-2">Badge
                        <input value={getLocalized(slide, 'badge')} onChange={e => setLocalized(slide, 'badge', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal text-slate-800" />
                      </label>
                      <label className="text-[11px] font-bold text-slate-500 sm:col-span-2">H1
                        <input value={getLocalized(slide, 'title')} onChange={e => setLocalized(slide, 'title', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal text-slate-800" />
                      </label>
                      <label className="text-[11px] font-bold text-slate-500 sm:col-span-2">Подзаголовок
                        <textarea rows={2} value={getLocalized(slide, 'subtitle')} onChange={e => setLocalized(slide, 'subtitle', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal text-slate-800" />
                      </label>
                      <label className="text-[11px] font-bold text-slate-500">CTA 1 текст
                        <input value={getLocalized(slide, 'ctaPrimaryText')} onChange={e => setLocalized(slide, 'ctaPrimaryText', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal text-slate-800" />
                      </label>
                      <label className="text-[11px] font-bold text-slate-500">CTA 1 ссылка
                        <input value={slide.ctaPrimaryLink || ''} onChange={e => updateSlide(slide.id, { ctaPrimaryLink: e.target.value || undefined })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal text-slate-800" />
                      </label>
                      <label className="text-[11px] font-bold text-slate-500">CTA 2 текст
                        <input value={getLocalized(slide, 'ctaSecondaryText')} onChange={e => setLocalized(slide, 'ctaSecondaryText', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal text-slate-800" />
                      </label>
                      <label className="text-[11px] font-bold text-slate-500">CTA 2 ссылка
                        <input value={slide.ctaSecondaryLink || ''} onChange={e => updateSlide(slide.id, { ctaSecondaryLink: e.target.value || undefined })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-normal text-slate-800" />
                      </label>
                    </div>
                  </details>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
