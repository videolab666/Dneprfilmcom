import { useState, type ReactNode } from 'react';
import { Download, FileText, Quote as QuoteIcon } from 'lucide-react';
import { PageBuilderRenderer as PageBuilderRendererV2 } from './PageBuilderRendererV2';
import { ResponsiveImage } from '../ResponsiveImage';
import { HeroSlider } from '../home/HeroSlider';
import { FeaturedCases } from '../home/FeaturedCases';
import { SynergyBenefits } from '../home/SynergyBenefits';
import { HowWeWork } from '../home/HowWeWork';
import { BackstageGallery } from '../home/BackstageGallery';
import { Testimonials } from '../home/Testimonials';
import { QuickContactCTA } from '../home/QuickContactCTA';
import { ClientsMarquee } from '../ClientsMarquee';
import { blockKind, type BuilderSiteBlock, type PageBuilderWidth } from '../../lib/pageBuilder';

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

function mutedClass(style: BuilderSiteBlock['config']['style']): string {
  return style === 'dark' || style === 'indigo' || style === 'gradient' ? 'text-slate-300' : 'text-slate-500';
}

function SectionHeader({ block }: { block: BuilderSiteBlock }) {
  const centered = block.config.alignment === 'center';
  if (!block.config.badge && !block.config.heading && !block.config.subheading) return null;
  return (
    <div className={`mb-10 ${centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
      {block.config.badge && <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-indigo-400">{block.config.badge}</div>}
      {block.config.heading && <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{block.config.heading}</h2>}
      {block.config.subheading && <p className={`mt-4 text-base leading-7 ${mutedClass(block.config.style)}`}>{block.config.subheading}</p>}
    </div>
  );
}

function SectionShell({ block, children }: { block: BuilderSiteBlock; children: ReactNode }) {
  return (
    <section id={block.config.anchor || undefined} className={`${spacingClass(block.config.spacing)} ${surfaceClass(block.config.style)}`} data-cms-builder-kind={blockKind(block)}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${widthClass(block.config.width)}`}>
        <SectionHeader block={block} />
        {children}
      </div>
    </section>
  );
}

function TimelineSection({ block }: { block: BuilderSiteBlock }) {
  const items = block.config.timelineItems || [];
  if (block.config.timelineOrientation === 'horizontal') {
    return (
      <SectionShell block={block}>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <article key={item.id || index} className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
              <div className="mb-5 flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">{index + 1}</span><span className="text-sm font-black text-indigo-600">{item.date}</span></div>
              {item.imageUrl && <ResponsiveImage src={item.imageUrl} alt={item.title} displayWidth={800} sizes="(max-width:768px) 100vw, 25vw" className="mb-5 aspect-video w-full rounded-2xl object-cover" />}
              <h3 className="text-lg font-black">{item.title}</h3>
              {item.description && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-500">{item.description}</p>}
            </article>
          ))}
        </div>
      </SectionShell>
    );
  }
  return (
    <SectionShell block={block}>
      <div className="mx-auto max-w-4xl">
        {items.map((item, index) => (
          <article key={item.id || index} className="relative grid gap-5 pb-10 pl-12 last:pb-0 sm:grid-cols-[120px_1fr] sm:pl-14">
            {index < items.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-1rem)] w-px bg-slate-200 sm:left-[21px]" />}
            <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white shadow-lg sm:h-11 sm:w-11">{index + 1}</span>
            <div className="pt-1 text-sm font-black text-indigo-600">{item.date}</div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm sm:p-6">
              {item.imageUrl && <ResponsiveImage src={item.imageUrl} alt={item.title} displayWidth={1200} sizes="(max-width:768px) 100vw, 700px" className="mb-5 aspect-video w-full rounded-2xl object-cover" />}
              <h3 className="text-xl font-black">{item.title}</h3>
              {item.description && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-500">{item.description}</p>}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function DownloadsSection({ block }: { block: BuilderSiteBlock }) {
  const cards = block.config.downloadLayout === 'cards';
  return (
    <SectionShell block={block}>
      <div className={cards ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
        {(block.config.downloadItems || []).map((item, index) => {
          const content = <><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><FileText className="h-6 w-6" /></div><div className="min-w-0 flex-1"><h3 className="font-black text-slate-900">{item.title || item.fileName || `Файл ${index + 1}`}</h3>{item.description && <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>}<div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{item.fileType && <span>{item.fileType}</span>}{item.fileSize && <span>· {item.fileSize}</span>}</div></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition group-hover:bg-indigo-600"><Download className="h-4 w-4" /></span></>;
          if (!item.url) return <div key={item.id || index} className={`flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-60 ${cards ? 'items-start' : 'items-center'}`}>{content}</div>;
          return <a key={item.id || index} href={item.url} download={item.fileName || undefined} target="_blank" rel="noreferrer" className={`group flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md ${cards ? 'items-start' : 'items-center'}`}>{content}</a>;
        })}
      </div>
    </SectionShell>
  );
}

function TabsSection({ block }: { block: BuilderSiteBlock }) {
  const tabs = block.config.tabs || [];
  const [activeId, setActiveId] = useState(tabs[0]?.id || '');
  const active = tabs.find(item => item.id === activeId) || tabs[0];
  return (
    <SectionShell block={block}>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2">{tabs.map((item, index) => <button key={item.id || index} type="button" onClick={() => setActiveId(item.id)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition ${active?.id === item.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>{item.title}</button>)}</div>
        <div className="p-6 sm:p-8"><div className="whitespace-pre-line text-base leading-8 text-slate-600">{active?.content || ''}</div></div>
      </div>
    </SectionShell>
  );
}

function TableSection({ block }: { block: BuilderSiteBlock }) {
  const columns = block.config.tableColumns || [];
  return (
    <SectionShell block={block}>
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm"><table className="min-w-full border-collapse text-left text-sm">{columns.length > 0 && <thead><tr className="bg-slate-950 text-white">{columns.map((column, index) => <th key={`${column}-${index}`} className="px-5 py-4 font-black">{column}</th>)}</tr></thead>}<tbody>{(block.config.tableRows || []).map((row, rowIndex) => <tr key={row.id || rowIndex} className={`border-t border-slate-100 ${block.config.tableStriped !== false && rowIndex % 2 ? 'bg-slate-50' : 'bg-white'}`}>{columns.map((_, cellIndex) => <td key={cellIndex} className="px-5 py-4 align-top text-slate-600">{row.cells[cellIndex] || ''}</td>)}</tr>)}</tbody></table></div>
    </SectionShell>
  );
}

function TeamSection({ block }: { block: BuilderSiteBlock }) {
  const columns = block.config.teamColumns === 2 ? 'md:grid-cols-2' : block.config.teamColumns === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3';
  return (
    <SectionShell block={block}>
      <div className={`grid gap-5 ${columns}`}>{(block.config.teamItems || []).map((item, index) => {
        const card = <article className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">{item.imageUrl && <ResponsiveImage src={item.imageUrl} alt={item.name} displayWidth={900} sizes="(max-width:768px) 100vw, 33vw" className="aspect-[4/3] w-full object-cover" />}<div className="p-6"><h3 className="text-xl font-black">{item.name}</h3>{item.role && <div className="mt-1 text-xs font-black uppercase tracking-wider text-indigo-600">{item.role}</div>}{item.bio && <p className="mt-4 text-sm leading-7 text-slate-500">{item.bio}</p>}</div></article>;
        return item.link ? <a key={item.id || index} href={item.link} className="block">{card}</a> : <div key={item.id || index}>{card}</div>;
      })}</div>
    </SectionShell>
  );
}

function QuoteSection({ block }: { block: BuilderSiteBlock }) {
  return (
    <SectionShell block={block}>
      <figure className={`rounded-[2rem] border border-slate-200 bg-slate-50 p-7 text-slate-900 sm:p-10 ${block.config.alignment === 'center' ? 'mx-auto max-w-4xl text-center' : ''}`}><QuoteIcon className={`h-10 w-10 text-indigo-300 ${block.config.alignment === 'center' ? 'mx-auto' : ''}`} /><blockquote className="mt-5 text-2xl font-black leading-tight tracking-tight sm:text-3xl">{block.config.quoteText || ''}</blockquote>{(block.config.quoteAuthor || block.config.quoteRole) && <figcaption className="mt-6 text-sm"><strong className="font-black text-slate-900">{block.config.quoteAuthor}</strong>{block.config.quoteRole && <span className="ml-2 text-slate-500">{block.config.quoteRole}</span>}</figcaption>}</figure>
    </SectionShell>
  );
}

function NativeSection({ kind }: { kind: ReturnType<typeof blockKind> }) {
  if (kind === 'native_home_hero') return <HeroSlider />;
  if (kind === 'native_home_clients') return <ClientsMarquee />;
  if (kind === 'native_home_featured_cases') return <FeaturedCases />;
  if (kind === 'native_home_synergy') return <SynergyBenefits />;
  if (kind === 'native_home_how_we_work') return <HowWeWork />;
  if (kind === 'native_home_backstage') return <BackstageGallery />;
  if (kind === 'native_home_testimonials') return <Testimonials />;
  if (kind === 'native_home_contact') return <QuickContactCTA />;
  return null;
}

export function PageBuilderRenderer({ block, preview = false }: PageBuilderRendererProps) {
  const kind = blockKind(block);
  if (String(kind).startsWith('native_')) return <div className="contents" data-cms-native-section={kind}><NativeSection kind={kind} /></div>;
  if (kind === 'timeline') return <TimelineSection block={block} />;
  if (kind === 'downloads') return <DownloadsSection block={block} />;
  if (kind === 'tabs') return <TabsSection block={block} />;
  if (kind === 'table') return <TableSection block={block} />;
  if (kind === 'team') return <TeamSection block={block} />;
  if (kind === 'quote') return <QuoteSection block={block} />;
  return <PageBuilderRendererV2 block={block} preview={preview} />;
}
