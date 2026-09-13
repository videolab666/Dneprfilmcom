import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { GalleryImage } from '../../lib/galleryContent';
import { useSiteContent } from '../../context/SiteContentContext';
import { ResponsiveImage } from '../ResponsiveImage';

interface GalleryGridProps {
  images: GalleryImage[];
  galleryTitle: string;
}

type Point = { x: number; y: number };

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function GalleryGrid({ images, galleryTitle }: GalleryGridProps) {
  const { l } = useSiteContent();
  const visibleImages = useMemo(() => images.filter(image => Boolean(image.url)), [images]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const pointersRef = useRef<Map<number, Point>>(new Map<number, Point>());
  const gestureRef = useRef<{ start: Point; offset: Point; pinchDistance?: number; pinchScale?: number } | null>(null);
  const lastTapRef = useRef<{ time: number; point: Point } | null>(null);

  const activeIndex = visibleImages.findIndex(image => image.id === activeId);
  const activeImage = activeIndex >= 0 ? visibleImages[activeIndex] : null;

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    pointersRef.current.clear();
    gestureRef.current = null;
  };

  const setZoom = (value: number) => {
    const next = Math.max(1, Math.min(4, value));
    setScale(next);
    if (next === 1) setOffset({ x: 0, y: 0 });
  };

  const showRelative = (direction: -1 | 1) => {
    if (!visibleImages.length || activeIndex < 0) return;
    const next = visibleImages[(activeIndex + direction + visibleImages.length) % visibleImages.length];
    resetZoom();
    setActiveId(next.id);
  };

  useEffect(() => {
    if (!activeImage) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveId(null);
      if (event.key === 'ArrowLeft' && visibleImages.length > 1) showRelative(-1);
      if (event.key === 'ArrowRight' && visibleImages.length > 1) showRelative(1);
      if (event.key === '+' || event.key === '=') setZoom(scale + 0.5);
      if (event.key === '-') setZoom(scale - 0.5);
      if (event.key === '0') resetZoom();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeImage, activeIndex, visibleImages, scale]);

  useEffect(() => {
    if (!activeImage || visibleImages.length < 2 || activeIndex < 0) return;
    const neighbors = [
      visibleImages[(activeIndex - 1 + visibleImages.length) % visibleImages.length],
      visibleImages[(activeIndex + 1) % visibleImages.length],
    ];
    neighbors.forEach(image => {
      const preload = new Image();
      preload.src = image.url;
    });
  }, [activeImage, activeIndex, visibleImages]);

  useEffect(() => {
    if (!activeImage) resetZoom();
  }, [activeImage]);

  const pointerPoint = (event: ReactPointerEvent<HTMLElement>): Point => ({ x: event.clientX, y: event.clientY });

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = pointerPoint(event);
    pointersRef.current.set(event.pointerId, point);

    if (pointersRef.current.size === 1) {
      gestureRef.current = { start: point, offset };
    } else if (pointersRef.current.size === 2) {
      const points: Point[] = Array.from(pointersRef.current.values());
      const [a, b] = points;
      gestureRef.current = {
        start: point,
        offset,
        pinchDistance: distance(a, b),
        pinchScale: scale,
      };
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    const point = pointerPoint(event);
    pointersRef.current.set(event.pointerId, point);
    const gesture = gestureRef.current;
    if (!gesture) return;

    if (pointersRef.current.size >= 2 && gesture.pinchDistance && gesture.pinchScale) {
      const points: Point[] = Array.from(pointersRef.current.values());
      const [a, b] = points;
      const ratio = distance(a, b) / Math.max(1, gesture.pinchDistance);
      setZoom(gesture.pinchScale * ratio);
      return;
    }

    if (scale > 1 && pointersRef.current.size === 1) {
      setOffset({
        x: gesture.offset.x + point.x - gesture.start.x,
        y: gesture.offset.y + point.y - gesture.start.y,
      });
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = pointerPoint(event);
    const gesture = gestureRef.current;
    const wasSinglePointer = pointersRef.current.size === 1;
    pointersRef.current.delete(event.pointerId);

    if (wasSinglePointer && gesture && scale <= 1.05) {
      const dx = point.x - gesture.start.x;
      const dy = point.y - gesture.start.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25 && visibleImages.length > 1) {
        showRelative(dx > 0 ? -1 : 1);
        return;
      }

      if (event.pointerType === 'touch' && Math.hypot(dx, dy) < 16) {
        const now = Date.now();
        const last = lastTapRef.current;
        if (last && now - last.time < 320 && distance(last.point, point) < 45) {
          setZoom(scale > 1 ? 1 : 2.5);
          lastTapRef.current = null;
          return;
        }
        lastTapRef.current = { time: now, point };
      }
    }

    if (pointersRef.current.size === 1) {
      const remaining = Array.from(pointersRef.current.values())[0];
      if (remaining) gestureRef.current = { start: remaining, offset };
    } else if (pointersRef.current.size === 0) {
      gestureRef.current = null;
    }
  };

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
              <ResponsiveImage
                src={image.url}
                alt={image.alt || `${galleryTitle} — ${index + 1}`}
                displayWidth={1200}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.015]"
              />
            </button>
            {image.caption && <figcaption className="px-4 py-3 text-xs leading-relaxed text-slate-500">{image.caption}</figcaption>}
          </figure>
        ))}
      </div>

      {activeImage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/97 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={l('Перегляд фотографії', 'Просмотр фотографии', 'Photo viewer')}
          onClick={event => {
            if (event.currentTarget === event.target && scale === 1) setActiveId(null);
          }}
        >
          <div className="absolute left-3 top-3 z-30 flex items-center gap-1 rounded-full bg-black/35 p-1.5 text-white backdrop-blur sm:left-5 sm:top-5">
            <button type="button" onClick={() => setZoom(scale - 0.5)} disabled={scale <= 1} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-35" aria-label={l('Зменшити', 'Уменьшить', 'Zoom out')}><ZoomOut className="h-4 w-4" /></button>
            <span className="min-w-12 text-center text-[11px] font-bold">{Math.round(scale * 100)}%</span>
            <button type="button" onClick={() => setZoom(scale + 0.5)} disabled={scale >= 4} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-35" aria-label={l('Збільшити', 'Увеличить', 'Zoom in')}><ZoomIn className="h-4 w-4" /></button>
            {scale > 1 && <button type="button" onClick={resetZoom} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15" aria-label={l('Скинути масштаб', 'Сбросить масштаб', 'Reset zoom')}><RotateCcw className="h-4 w-4" /></button>}
          </div>

          <button type="button" onClick={() => setActiveId(null)} className="absolute right-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-white/20 sm:right-5 sm:top-5" aria-label={l('Закрити', 'Закрыть', 'Close')}><X className="h-5 w-5" /></button>

          {visibleImages.length > 1 && scale === 1 && (
            <>
              <button type="button" onClick={() => showRelative(-1)} className="absolute left-2 z-20 hidden h-12 w-12 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-white/20 sm:flex sm:left-6" aria-label={l('Попереднє фото', 'Предыдущее фото', 'Previous photo')}><ChevronLeft className="h-6 w-6" /></button>
              <button type="button" onClick={() => showRelative(1)} className="absolute right-2 z-20 hidden h-12 w-12 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-white/20 sm:flex sm:right-6" aria-label={l('Наступне фото', 'Следующее фото', 'Next photo')}><ChevronRight className="h-6 w-6" /></button>
            </>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-2 pb-16 pt-14 sm:px-16 sm:pb-20 sm:pt-16">
            <div
              className={`flex h-full w-full items-center justify-center select-none ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
              style={{ touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onDoubleClick={() => setZoom(scale > 1 ? 1 : 2.5)}
            >
              <div
                className="flex max-h-full max-w-full items-center justify-center transition-transform duration-75"
                style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})` }}
              >
                <ResponsiveImage src={activeImage.url} alt={activeImage.alt || galleryTitle} displayWidth={2400} sizes="100vw" loading="eager" className="max-h-[82vh] max-w-[96vw] rounded-xl object-contain shadow-2xl sm:max-w-[90vw]" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 left-1/2 z-30 w-[min(92vw,800px)] -translate-x-1/2 text-center text-white sm:bottom-5">
            {activeImage.caption && <div className="mb-2 line-clamp-2 text-xs leading-relaxed text-slate-300 sm:text-sm">{activeImage.caption}</div>}
            <div className="text-[11px] font-semibold text-white/65">{activeIndex + 1} / {visibleImages.length} · {l('свайп — наступне фото, подвійний тап — масштаб', 'свайп — следующее фото, двойной тап — масштаб', 'swipe to navigate, double-tap to zoom')}</div>
          </div>
        </div>
      )}
    </>
  );
}
