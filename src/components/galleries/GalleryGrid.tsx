import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryImage } from '../../lib/galleryContent';
import { useSiteContent } from '../../context/SiteContentContext';

interface GalleryGridProps {
  images: GalleryImage[];
  galleryTitle: string;
}

export function GalleryGrid({ images, galleryTitle }: GalleryGridProps) {
  const { l } = useSiteContent();
  const visibleImages = useMemo(() => images.filter(image => Boolean(image.url)), [images]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeIndex = visibleImages.findIndex(image => image.id === activeId);
  const activeImage = activeIndex >= 0 ? visibleImages[activeIndex] : null;

  useEffect(() => {
    if (!activeImage) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveId(null);
      if (event.key === 'ArrowLeft' && visibleImages.length > 1) {
        const previous = visibleImages[(activeIndex - 1 + visibleImages.length) % visibleImages.length];
        setActiveId(previous.id);
      }
      if (event.key === 'ArrowRight' && visibleImages.length > 1) {
        const next = visibleImages[(activeIndex + 1) % visibleImages.length];
        setActiveId(next.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeImage, activeIndex, visibleImages]);

  if (visibleImages.length === 0) return null;

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {visibleImages.map((image, index) => (
          <figure key={image.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setActiveId(image.id)}
              className="group block w-full cursor-zoom-in overflow-hidden bg-slate-100 text-left"
              aria-label={image.alt || `${galleryTitle} — ${index + 1}`}
            >
              <img
                src={image.url}
                alt={image.alt || `${galleryTitle} — ${index + 1}`}
                className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.015]"
                loading="lazy"
              />
            </button>
            {image.caption && (
              <figcaption className="px-4 py-3 text-xs leading-relaxed text-slate-500">{image.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>

      {activeImage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/95 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={l('Перегляд фотографії', 'Просмотр фотографии', 'Photo viewer')}
          onClick={() => setActiveId(null)}
        >
          <button
            type="button"
            onClick={() => setActiveId(null)}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label={l('Закрити', 'Закрыть', 'Close')}
          >
            <X className="h-5 w-5" />
          </button>

          {visibleImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  const previous = visibleImages[(activeIndex - 1 + visibleImages.length) % visibleImages.length];
                  setActiveId(previous.id);
                }}
                className="absolute left-3 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
                aria-label={l('Попереднє фото', 'Предыдущее фото', 'Previous photo')}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  const next = visibleImages[(activeIndex + 1) % visibleImages.length];
                  setActiveId(next.id);
                }}
                className="absolute right-3 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
                aria-label={l('Наступне фото', 'Следующее фото', 'Next photo')}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="flex max-h-[94vh] max-w-[94vw] flex-col items-center gap-3" onClick={event => event.stopPropagation()}>
            <img
              src={activeImage.url}
              alt={activeImage.alt || galleryTitle}
              className="max-h-[84vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            {activeImage.caption && (
              <div className="max-w-3xl text-center text-xs leading-relaxed text-slate-300">{activeImage.caption}</div>
            )}
            <div className="text-[11px] font-semibold text-white/60">{activeIndex + 1} / {visibleImages.length}</div>
          </div>
        </div>
      )}
    </>
  );
}
