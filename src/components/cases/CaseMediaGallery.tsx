import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Play, X } from 'lucide-react';
import type { CaseMediaItem } from '../../types';
import { getMediaPreview, getVideoEmbedUrl, localizeMediaItem } from '../../lib/caseMedia';
import { useSiteContent } from '../../context/SiteContentContext';
import { ResponsiveImage } from '../ResponsiveImage';

interface CaseMediaGalleryProps {
  media: CaseMediaItem[];
  caseTitle: string;
}

function EmbeddedVideo({ item }: { item: CaseMediaItem }) {
  const [active, setActive] = useState(false);
  const embedUrl = getVideoEmbedUrl(item);
  const preview = getMediaPreview(item);

  if (item.type === 'video') {
    return (
      <video
        className="h-full w-full bg-black object-contain"
        controls
        preload="metadata"
        poster={item.thumbnailUrl}
        playsInline
      >
        <source src={item.url} />
      </video>
    );
  }

  if (!embedUrl) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="flex h-full min-h-64 items-center justify-center gap-2 bg-slate-900 text-sm font-bold text-white"
      >
        <ExternalLink className="h-4 w-4" />
        Open video
      </a>
    );
  }

  if (active) {
    return (
      <iframe
        src={embedUrl}
        title={item.title || 'Portfolio video'}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className="group relative h-full w-full overflow-hidden bg-slate-950 text-white"
      aria-label="Play video"
    >
      {preview ? (
        <ResponsiveImage src={preview} alt="" displayWidth={1200} sizes="(max-width: 768px) 100vw, 50vw" className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-70" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-950 to-indigo-950" />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-indigo-700 shadow-2xl transition group-hover:scale-110">
          <Play className="ml-1 h-6 w-6 fill-current" />
        </span>
      </span>
    </button>
  );
}

export function CaseMediaGallery({ media, caseTitle }: CaseMediaGalleryProps) {
  const { locale, l } = useSiteContent();
  const localized = useMemo(() => media.map(item => localizeMediaItem(item, locale)), [media, locale]);
  const images = useMemo(() => localized.filter(item => item.type === 'image'), [localized]);
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  const lightboxIndex = images.findIndex(item => item.id === lightboxId);
  const lightboxItem = lightboxIndex >= 0 ? images[lightboxIndex] : null;

  useEffect(() => {
    if (!lightboxItem) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxId(null);
      if (event.key === 'ArrowLeft') {
        const prev = images[(lightboxIndex - 1 + images.length) % images.length];
        if (prev) setLightboxId(prev.id);
      }
      if (event.key === 'ArrowRight') {
        const next = images[(lightboxIndex + 1) % images.length];
        if (next) setLightboxId(next.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images, lightboxIndex, lightboxItem]);

  if (!localized.length) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {localized.map((item, index) => {
          const isWide = localized.length === 1 || index === 0 || (item.type !== 'image' && index % 3 === 0);
          return (
            <figure
              key={item.id}
              className={`${isWide ? 'md:col-span-2' : ''} overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm`}
            >
              <div className={`relative ${isWide ? 'aspect-video' : 'aspect-[4/3]'} overflow-hidden bg-slate-950`}>
                {item.type === 'image' ? (
                  <button
                    type="button"
                    onClick={() => setLightboxId(item.id)}
                    className="group h-full w-full cursor-zoom-in"
                    aria-label={item.alt || item.title || caseTitle}
                  >
                    <ResponsiveImage
                      src={item.url}
                      alt={item.alt || item.title || caseTitle}
                      displayWidth={1400}
                      sizes={isWide ? '(max-width: 1024px) 100vw, 900px' : '(max-width: 768px) 100vw, 50vw'}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  </button>
                ) : (
                  <EmbeddedVideo item={item} />
                )}
              </div>
              {(item.title || item.caption) && (
                <figcaption className="space-y-1 px-5 py-4">
                  {item.title && <div className="text-sm font-bold text-slate-900">{item.title}</div>}
                  {item.caption && <p className="text-xs leading-relaxed text-slate-500">{item.caption}</p>}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {lightboxItem && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/95 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={l('Перегляд зображення', 'Просмотр изображения', 'Image viewer')}
        >
          <button
            type="button"
            onClick={() => setLightboxId(null)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label={l('Закрити', 'Закрыть', 'Close')}
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setLightboxId(images[(lightboxIndex - 1 + images.length) % images.length].id)}
                className="absolute left-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
                aria-label={l('Попереднє фото', 'Предыдущее фото', 'Previous image')}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxId(images[(lightboxIndex + 1) % images.length].id)}
                className="absolute right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
                aria-label={l('Наступне фото', 'Следующее фото', 'Next image')}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="flex max-h-[92vh] max-w-[94vw] flex-col items-center gap-3">
            <ResponsiveImage
              src={lightboxItem.url}
              alt={lightboxItem.alt || lightboxItem.title || caseTitle}
              displayWidth={2400}
              sizes="94vw"
              loading="eager"
              className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            {(lightboxItem.title || lightboxItem.caption) && (
              <div className="max-w-3xl text-center text-white">
                {lightboxItem.title && <div className="text-sm font-bold">{lightboxItem.title}</div>}
                {lightboxItem.caption && <div className="mt-1 text-xs text-slate-300">{lightboxItem.caption}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
