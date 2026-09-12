import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import type { HeroSlide, Locale } from '../../types';

const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1590845947698-8924d7409b56?auto=format&fit=crop&q=80';

type SlideTextField = 'badge' | 'title' | 'subtitle' | 'ctaPrimaryText' | 'ctaSecondaryText';

function localizedSlideText(slide: HeroSlide, field: SlideTextField, locale: Locale): string {
  const key = locale === 'ru' ? field : `${field}_${locale}`;
  const value = slide[key as keyof HeroSlide];
  return typeof value === 'string' ? value.trim() : '';
}

function clampDuration(value?: number): number {
  if (!Number.isFinite(value)) return 7000;
  return Math.min(30000, Math.max(3000, Number(value)));
}

function HeroAction({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (!href) return null;
  if (href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return <a href={href} className={className}>{children}</a>;
  }
  return <Link to={href} className={className}>{children}</Link>;
}

export function HeroSlider() {
  const { settings, rawSettings, locale } = useSiteContent();
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [documentVisible, setDocumentVisible] = useState(() => document.visibilityState !== 'hidden');
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const touchStartX = useRef<number | null>(null);

  const slides = useMemo<HeroSlide[]>(() => {
    const configured = (rawSettings.heroSlides || []).filter(slide => slide.enabled !== false && slide.url?.trim());
    if (configured.length) return configured;
    return [{
      id: 'legacy-hero',
      type: 'image',
      url: settings.heroBgImage || FALLBACK_HERO_IMAGE,
      durationMs: 7000,
      overlayOpacity: 58,
      enabled: true,
    }];
  }, [rawSettings.heroSlides, settings.heroBgImage]);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    const onVisibilityChange = () => setDocumentVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const goTo = (index: number) => {
    const count = slides.length;
    if (!count) return;
    setActiveIndex((index + count) % count);
  };

  const next = () => goTo(activeIndex + 1);
  const previous = () => goTo(activeIndex - 1);

  useEffect(() => {
    if (slides.length <= 1 || prefersReducedMotion || !documentVisible) return undefined;
    const timer = window.setTimeout(next, clampDuration(slides[activeIndex]?.durationMs));
    return () => window.clearTimeout(timer);
  }, [activeIndex, documentVisible, prefersReducedMotion, slides]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const upcoming = slides[(activeIndex + 1) % slides.length];
    const url = isMobile && upcoming.mobileUrl ? upcoming.mobileUrl : upcoming.url;
    if (!url) return;
    if (upcoming.type === 'image') {
      const image = new Image();
      image.src = url;
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
  }, [activeIndex, isMobile, slides]);

  const slide = slides[activeIndex] || slides[0];
  const mediaUrl = isMobile && slide.mobileUrl ? slide.mobileUrl : slide.url;
  const overlayOpacity = Math.min(90, Math.max(20, slide.overlayOpacity ?? 58));
  const baseOpacity = overlayOpacity / 100;
  const overlayStyle = {
    background: `linear-gradient(90deg, rgba(15,23,42,${Math.min(0.96, baseOpacity + 0.25)}) 0%, rgba(15,23,42,${baseOpacity}) 55%, rgba(15,23,42,${Math.max(0.18, baseOpacity - 0.22)}) 100%)`,
  };

  const badge = localizedSlideText(slide, 'badge', locale) || settings.heroBadge;
  const title = localizedSlideText(slide, 'title', locale) || settings.heroTitle;
  const subtitle = localizedSlideText(slide, 'subtitle', locale) || settings.heroSubtitle;
  const primaryText = localizedSlideText(slide, 'ctaPrimaryText', locale) || settings.heroCtaPrimaryText;
  const secondaryText = localizedSlideText(slide, 'ctaSecondaryText', locale) || settings.heroCtaSecondaryText;
  const primaryLink = slide.ctaPrimaryLink || settings.heroCtaPrimaryLink || '/live';
  const secondaryLink = slide.ctaSecondaryLink || settings.heroCtaSecondaryLink || '#cases-section';

  return (
    <section
      className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-slate-950"
      onTouchStart={event => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
      onTouchEnd={event => {
        if (touchStartX.current == null || slides.length <= 1) return;
        const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) < 45) return;
        if (delta < 0) next(); else previous();
      }}
    >
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: 'easeInOut' }}
          >
            {slide.type === 'video' ? (
              <video
                key={mediaUrl}
                src={mediaUrl}
                poster={slide.posterUrl || undefined}
                autoPlay
                muted
                playsInline
                loop
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              <picture>
                {slide.mobileUrl && <source media="(max-width: 767px)" srcSet={slide.mobileUrl} />}
                <img
                  src={slide.url || FALLBACK_HERO_IMAGE}
                  alt=""
                  fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
                  className="h-full w-full object-cover"
                />
              </picture>
            )}
            <div className="absolute inset-0" style={overlayStyle} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 py-20 text-center text-white sm:px-6 lg:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`copy-${slide.id}`}
            initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.45 }}
          >
            {badge && (
              <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300 backdrop-blur-md sm:text-sm">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{badge}</span>
              </div>
            )}

            <h1 className="mx-auto mb-6 max-w-5xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              {title}
            </h1>

            {subtitle && (
              <p className="mx-auto mt-6 max-w-3xl text-xl font-light leading-relaxed text-slate-300 md:text-2xl">
                {subtitle}
              </p>
            )}

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {primaryText && (
                <HeroAction href={primaryLink} className="rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition-colors hover:bg-indigo-500">
                  {primaryText}
                </HeroAction>
              )}
              {secondaryText && (
                <HeroAction href={secondaryLink} className="rounded-full border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                  {secondaryText}
                </HeroAction>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Previous hero slide"
            className="absolute left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/25 p-3 text-white backdrop-blur-md transition hover:bg-black/45 md:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next hero slide"
            className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/25 p-3 text-white backdrop-blur-md transition hover:bg-black/45 md:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-2 backdrop-blur-md">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Hero slide ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/45 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
