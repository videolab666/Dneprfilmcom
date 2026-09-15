import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onSnapshot } from 'firebase/firestore';
import { ArrowRight, CheckCircle2, Play } from 'lucide-react';
import { DynamicBlockRenderer } from '../home/DynamicBlockRenderer';
import { Testimonials } from '../home/Testimonials';
import { QuickContactCTA } from '../home/QuickContactCTA';
import { RichTextRenderer } from '../article/RichTextRenderer';
import { GalleryGrid } from '../galleries/GalleryGrid';
import { ResponsiveImage } from '../ResponsiveImage';
import { useSiteContent } from '../../context/SiteContentContext';
import { getCasePath } from '../../lib/caseMedia';
import { publishedCasesQuery, publishedVideoProjectsQuery } from '../../lib/publicPortfolioQueries';
import { getVideoProjectPath, isVideoProject, localizeVideoProject, type VideoProject } from '../../lib/videoPortfolio';
import { blockKind, type BuilderSiteBlock, type PageBuilderWidth } from '../../lib/pageBuilder';
import type { CaseStudy } from '../../types';

interface PageBuilderRendererProps {
  block: BuilderSiteBlock;
  preview?: boolean;
}

function widthClass(width: PageBuilderWidth | undefined): string {
  if (width === 'narrow') return 'max-w-3xl';
  if (width === 'wide') return 'max-w-7xl';
  if (width === 'full') return 'max-w-none';
  return 'max-w-6xl';
}

function spacingClass(spacing: BuilderSiteBlock['config']['spacing']): string {
  if (spacing === 'compact') return 'py-10';
  if (spacing === 'large') return 'py-28';
  return 'py-20';
}

function surfaceClass(style: BuilderSiteBlock['config']['style']): string {
  if (style === 'dark') return 'bg-slate-950 text-white';
  if (style === 'indigo' || style === 'gradient') return 'bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 text-white';
  return 'bg-white text-slate-900';
}

function SectionHeader({ block }: { block: BuilderSiteBlock }) {
  const centered = block.config.alignment === 'center';
  if (!block.config.badge && !block.config.heading && !block.config.subheading) return null;
  return (
    <div className={`mb-10 ${centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
      {block.config.badge && <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-indigo-500">{block.config.badge}</div>}
      {block.config.heading && <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{block.config.heading}</h2>}
      {block.config.subheading && <p className="mt-4 text-base leading-7 text-slate-500 dark:text-slate-300">{block.config.subheading}</p>}
    </div>
  );
}

function BuilderCases({ block }: { block: BuilderSiteBlock }) {
  const { getLocalizedCase, l } = useSiteContent();
  const [items, setItems] = useState<CaseStudy[]>([]);
  useEffect(() => onSnapshot(publishedCasesQuery(), snapshot => {
    const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as CaseStudy));
    rows.sort((a, b) => Number(b.featured || false) - Number(a.featured || false) || (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    setItems(rows.slice(0, Math.max(1, block.config.maxItems || 6)));
  }, error => console.warn('Page Builder cases:', error)), [block.config.maxItems]);

  return (
    <section className={`${spacingClass(block.config.spacing)} ${surfaceClass(block.config.style)}`}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${widthClass(block.config.width)}`}>
        <SectionHeader block={block} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map(raw => {
            const item = getLocalizedCase(raw);
            return (
              <Link key={item.id} to={getCasePath(item)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                {item.imageUrl && <ResponsiveImage src={item.imageUrl} alt={item.title} displayWidth={900} sizes="(max-width:768px) 100vw, 33vw" className="aspect-video w-full object-cover" />}
                <div className="p-5"><div className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{item.categoryLabel || item.category}</div><h3 className="mt-1 text-lg font-black">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-indigo-600">{l('Відкрити кейс', 'Открыть кейс', 'Open case')}<ArrowRight className="h-3.5 w-3.5" /></span></div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BuilderVideos({ block }: { block: BuilderSiteBlock }) {
  const { locale, l } = useSiteContent();
  const [items, setItems] = useState<VideoProject[]>([]);
  useEffect(() => onSnapshot(publishedVideoProjectsQuery(), snapshot => {
    const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(isVideoProject);
    rows.sort((a, b) => Number(b.featured || false) - Number(a.featured || false) || (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    setItems(rows.slice(0, Math.max(1, block.config.maxItems || 6)));
  }, error => console.warn('Page Builder videos:', error)), [block.config.maxItems]);

  return (
    <section className={`${spacingClass(block.config.spacing)} ${surfaceClass(block.config.style)}`}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${widthClass(block.config.width)}`}>
        <SectionHeader block={block} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map(raw => {
            const item = localizeVideoProject(raw, locale);
            return (
              <Link key={item.id} to={getVideoProjectPath(item)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-video overflow-hidden bg-slate-900">{item.coverUrl && <ResponsiveImage src={item.coverUrl} alt={item.title} displayWidth={900} sizes="(max-width:768px) 100vw, 33vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />}<span className="absolute inset-0 flex items-center justify-center bg-black/20"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-indigo-700 shadow-lg"><Play className="h-5 w-5 fill-current" /></span></span></div>
                <div className="p-5"><div className="text-[10px] font-black uppercase tracking-wider text-indigo-600">{item.category || 'Video'}</div><h3 className="mt-1 text-lg font-black">{item.title}</h3>{item.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>}<span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-indigo-600">{l('Дивитися', 'Смотреть', 'Watch')}<ArrowRight className="h-3.5 w-3.5" /></span></div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function PageBuilderRenderer({ block, preview = false }: PageBuilderRendererProps) {
  const kind = blockKind(block);
  const config = block.config;
  const legacyKinds = new Set(['cta', 'text_image', 'features_grid', 'stats_counter', 'faq', 'video_embed', 'partners']);

  if (!config.builderKind && legacyKinds.has(kind)) {
    return <DynamicBlockRenderer block={block} />;
  }
  if (config.builderKind && legacyKinds.has(kind)) {
    return <DynamicBlockRenderer block={block} />;
  }
  if (kind === 'testimonials') return <Testimonials />;
  if (kind === 'contact') return <QuickContactCTA />;
  if (kind === 'cases') return <BuilderCases block={block} />;
  if (kind === 'videos') return <BuilderVideos block={block} />;
  if (kind === 'divider') {
    return <div id={config.anchor || undefined} className={`${config.spacerSize === 'large' ? 'py-10' : 'py-6'} bg-white`}>{config.dividerStyle === 'dots' ? <div className="text-center tracking-[0.8em] text-slate-300">•••</div> : <div className="mx-auto max-w-6xl border-t border-slate-200" />}</div>;
  }
  if (kind === 'spacer') {
    const size = config.spacerSize === 'small' ? 'h-8' : config.spacerSize === 'large' ? 'h-28' : 'h-16';
    return <div id={config.anchor || undefined} className={`${size} bg-white`} aria-hidden={!preview} />;
  }

  if (kind === 'rich_text') {
    return (
      <section id={config.anchor || undefined} className={`${spacingClass(config.spacing)} ${surfaceClass(config.style)}`}>
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${widthClass(config.width)} ${config.alignment === 'center' ? 'text-center' : ''}`}>
          <SectionHeader block={block} />
          <RichTextRenderer value={config.richText || config.content || ''} className="text-base leading-8 text-slate-600 [&_a]:font-semibold [&_a]:text-indigo-600" />
        </div>
      </section>
    );
  }

  if (kind === 'image') {
    return (
      <section id={config.anchor || undefined} className={`${spacingClass(config.spacing)} ${surfaceClass(config.style)}`}>
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${widthClass(config.width)}`}>
          <SectionHeader block={block} />
          {config.imageUrl && <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm"><ResponsiveImage src={config.imageUrl} alt={config.imageAlt || config.heading || ''} displayWidth={2000} sizes="100vw" className="max-h-[820px] w-full object-cover" />{config.imageCaption && <figcaption className="px-5 py-3 text-sm text-slate-500">{config.imageCaption}</figcaption>}</figure>}
        </div>
      </section>
    );
  }

  if (kind === 'gallery') {
    const galleryImages = (config.galleryImages || []).filter(image => image.url).map(image => ({ ...image, id: image.id || image.url }));
    return (
      <section id={config.anchor || undefined} className={`${spacingClass(config.spacing)} ${surfaceClass(config.style)}`}>
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${widthClass(config.width)}`}>
          <SectionHeader block={block} />
          <GalleryGrid images={galleryImages} galleryTitle={config.heading || block.title} />
        </div>
      </section>
    );
  }

  if (kind === 'process') {
    return (
      <section id={config.anchor || undefined} className={`${spacingClass(config.spacing)} ${surfaceClass(config.style)}`}>
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${widthClass(config.width)}`}><SectionHeader block={block} /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{(config.items || []).map((item, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">{index + 1}</div><h3 className="text-lg font-black">{item.title}</h3>{item.description && <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>}</div>)}</div></div>
      </section>
    );
  }

  if (kind === 'pricing') {
    return (
      <section id={config.anchor || undefined} className={`${spacingClass(config.spacing)} ${surfaceClass(config.style)}`}>
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${widthClass(config.width)}`}><SectionHeader block={block} /><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{(config.items || []).map((item, index) => <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm"><div className="text-sm font-black uppercase tracking-wider text-indigo-600">{item.title}</div>{item.value && <div className="mt-3 text-3xl font-black">{item.value}</div>}{item.description && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-500">{item.description}</p>}<div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" />Готовый пакет</div></div>)}</div></div>
      </section>
    );
  }

  return <DynamicBlockRenderer block={block} />;
}
