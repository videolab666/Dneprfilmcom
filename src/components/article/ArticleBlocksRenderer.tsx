import { useEffect } from 'react';
import { ArrowUpRight, Info, TriangleAlert } from 'lucide-react';
import type { ArticleBlock } from '../../lib/articleBlocks';
import {
  articleFaqItems,
  articleImageBlocks,
  articleVideoBlocks,
  videoEmbedUrl,
} from '../../lib/articleBlocks';
import { RichTextRenderer } from './RichTextRenderer';

interface ArticleBlocksRendererProps {
  blocks: ArticleBlock[];
}

function safeExternalUrl(value: string): string {
  const url = value.trim();
  if (!url) return '#';
  if (url.startsWith('/') || url.startsWith('#')) return url;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? url : '#';
  } catch {
    return '#';
  }
}

function publicArticleTitle(): string {
  return document.querySelector('article h1')?.textContent?.trim()
    || document.title.replace(/\s+[—-]\s+Dneprfilm.*$/i, '').trim()
    || 'Article';
}

export function ArticleBlocksRenderer({ blocks }: ArticleBlocksRendererProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.pathname.includes('/media-center/')) return;

    const faqItems = articleFaqItems(blocks);
    const images = articleImageBlocks(blocks);
    const videos = articleVideoBlocks(blocks);
    const graph: Record<string, unknown>[] = [];
    const title = publicArticleTitle();
    const canonical = `${window.location.origin}${window.location.pathname}`;

    if (faqItems.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      });
    }

    if (videos.length > 0) {
      videos.forEach((video, index) => {
        const embed = videoEmbedUrl(video.url);
        const isHostedEmbed = /youtube\.com\/embed|player\.vimeo\.com\/video/i.test(embed);
        graph.push({
          '@type': 'VideoObject',
          '@id': `${canonical}#article-video-${index + 1}`,
          name: video.caption || `${title} — video ${index + 1}`,
          description: video.caption || title,
          ...(isHostedEmbed ? { embedUrl: embed } : { contentUrl: video.url }),
          isPartOf: { '@id': `${canonical}#article` },
        });
      });
    }

    if (images.length > 1) {
      graph.push({
        '@type': 'ImageGallery',
        '@id': `${canonical}#article-images`,
        name: `${title} — images`,
        image: images.map((image, index) => ({
          '@type': 'ImageObject',
          '@id': `${canonical}#article-image-${index + 1}`,
          contentUrl: image.url,
          name: image.alt || image.caption || `${title} — image ${index + 1}`,
          ...(image.caption ? { caption: image.caption } : {}),
        })),
      });
    }

    document.getElementById('article-rich-block-jsonld')?.remove();
    if (graph.length === 0) return;

    const script = document.createElement('script');
    script.id = 'article-rich-block-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    document.head.appendChild(script);
    return () => script.remove();
  }, [blocks]);

  return (
    <div className="space-y-7 text-[17px] leading-8 text-slate-700">
      {blocks.map(block => {
        if (block.type === 'paragraph') {
          return <RichTextRenderer key={block.id} value={block.richText || block.text} className="article-rich-text" />;
        }
        if (block.type === 'h2') {
          return <h2 key={block.id} className="pt-4 text-3xl font-black leading-tight tracking-tight text-slate-950">{block.text}</h2>;
        }
        if (block.type === 'h3') {
          return <h3 key={block.id} className="pt-2 text-2xl font-black leading-tight text-slate-950">{block.text}</h3>;
        }
        if (block.type === 'image') {
          return (
            <figure key={block.id} className="my-9 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
              {block.url && <img src={block.url} alt={block.alt || block.caption || ''} className="max-h-[720px] w-full object-cover" loading="lazy" />}
              {block.caption && <figcaption className="px-5 py-3 text-sm leading-relaxed text-slate-500">{block.caption}</figcaption>}
            </figure>
          );
        }
        if (block.type === 'gallery') {
          const columnsClass = block.columns === 2 ? 'sm:grid-cols-2' : block.columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';
          if (block.layout === 'masonry') {
            const columnClass = block.columns === 2 ? 'sm:columns-2' : block.columns === 4 ? 'sm:columns-2 lg:columns-4' : 'sm:columns-2 lg:columns-3';
            return (
              <div key={block.id} className={`my-10 columns-1 gap-4 ${columnClass}`}>
                {block.images.map(image => (
                  <figure key={image.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                    <img src={image.url} alt={image.alt || image.caption || ''} className="h-auto w-full" loading="lazy" />
                    {image.caption && <figcaption className="px-4 py-2.5 text-xs leading-relaxed text-slate-500">{image.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            );
          }
          return (
            <div key={block.id} className={`my-10 grid grid-cols-1 gap-4 ${columnsClass}`}>
              {block.images.map(image => (
                <figure key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                  <div className="aspect-[4/3] overflow-hidden"><img src={image.url} alt={image.alt || image.caption || ''} className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]" loading="lazy" /></div>
                  {image.caption && <figcaption className="px-4 py-2.5 text-xs leading-relaxed text-slate-500">{image.caption}</figcaption>}
                </figure>
              ))}
            </div>
          );
        }
        if (block.type === 'video') {
          const embedUrl = videoEmbedUrl(block.url);
          return (
            <figure key={block.id} className="my-9 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-lg">
              <div className="aspect-video">
                {embedUrl && <iframe src={embedUrl} title={block.caption || 'Video'} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />}
              </div>
              {block.caption && <figcaption className="bg-white px-5 py-3 text-sm leading-relaxed text-slate-500">{block.caption}</figcaption>}
            </figure>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={block.id} className="my-9 rounded-3xl border-l-4 border-indigo-500 bg-indigo-50 px-6 py-6 text-xl font-semibold leading-relaxed text-slate-900">
              <RichTextRenderer value={block.richText || block.text} />
              {block.attribution && <footer className="mt-3 text-sm font-bold text-indigo-700">— {block.attribution}</footer>}
            </blockquote>
          );
        }
        if (block.type === 'callout') {
          const toneClass = block.tone === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : block.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
              : 'border-blue-200 bg-blue-50 text-blue-950';
          return (
            <aside key={block.id} className={`my-8 rounded-2xl border p-5 sm:p-6 ${toneClass}`}>
              <div className="flex items-start gap-3">
                {block.tone === 'warning' ? <TriangleAlert className="mt-1 h-5 w-5 shrink-0" /> : <Info className="mt-1 h-5 w-5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  {block.title && <h3 className="mb-2 text-lg font-black">{block.title}</h3>}
                  <RichTextRenderer value={block.richText || block.text} className="text-[15px] leading-7" />
                </div>
              </div>
            </aside>
          );
        }
        if (block.type === 'cta') {
          return (
            <aside key={block.id} className="my-10 rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
              {block.title && <h3 className="text-2xl font-black">{block.title}</h3>}
              <RichTextRenderer value={block.richText || block.text || ''} className="mt-3 text-base leading-relaxed text-slate-300" />
              {block.label && block.url && <a href={safeExternalUrl(block.url)} className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500">{block.label}</a>}
            </aside>
          );
        }
        if (block.type === 'table') {
          return (
            <div key={block.id} className="my-9 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full border-collapse text-left text-sm">
                {block.headers.length > 0 && <thead className="bg-slate-100 text-slate-900"><tr>{block.headers.map((header, index) => <th key={`${block.id}-h-${index}`} className="border-b border-slate-200 px-4 py-3 font-black">{header}</th>)}</tr></thead>}
                <tbody>{block.rows.map((row, rowIndex) => <tr key={`${block.id}-r-${rowIndex}`} className="border-b border-slate-100 last:border-b-0">{row.map((cell, cellIndex) => <td key={`${block.id}-${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top text-slate-700">{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        }
        if (block.type === 'faq') {
          return (
            <section key={block.id} className="my-10 space-y-3">
              {block.items.map((item, index) => (
                <details key={`${block.id}-${index}`} className="group rounded-2xl border border-slate-200 bg-white p-4 open:bg-slate-50">
                  <summary className="cursor-pointer list-none pr-6 font-black text-slate-950">{item.question}</summary>
                  <RichTextRenderer value={item.answerRichText || item.answer} className="mt-3 text-sm leading-7 text-slate-600" />
                </details>
              ))}
            </section>
          );
        }
        if (block.type === 'columns') {
          const ratioClass = block.ratio === '2-1' ? 'lg:grid-cols-[2fr_1fr]' : block.ratio === '1-2' ? 'lg:grid-cols-[1fr_2fr]' : 'lg:grid-cols-2';
          return (
            <div key={block.id} className={`my-10 grid gap-8 ${ratioClass}`}>
              <RichTextRenderer value={block.left} />
              <RichTextRenderer value={block.right} />
            </div>
          );
        }
        if (block.type === 'related') {
          if (!block.url) return null;
          return (
            <a key={block.id} href={safeExternalUrl(block.url)} className="group my-10 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg sm:grid-cols-[220px_1fr]">
              {block.imageUrl ? <img src={block.imageUrl} alt="" className="h-full min-h-44 w-full object-cover" loading="lazy" /> : <div className="flex min-h-40 items-center justify-center bg-slate-100 text-xs font-black uppercase tracking-widest text-slate-400">{block.contentType}</div>}
              <div className="flex flex-col justify-center p-5 sm:p-6">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">{block.contentType}</div>
                <h3 className="mt-1 text-xl font-black text-slate-950 group-hover:text-indigo-700">{block.title}</h3>
                {block.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{block.description}</p>}
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-indigo-600">Открыть <ArrowUpRight className="h-3.5 w-3.5" /></span>
              </div>
            </a>
          );
        }
        if (block.type === 'divider') {
          return block.style === 'dots'
            ? <div key={block.id} className="my-12 text-center tracking-[0.7em] text-slate-300">•••</div>
            : <hr key={block.id} className="my-12 border-0 border-t border-slate-200" />;
        }
        if (block.type === 'spacer') {
          return <div key={block.id} aria-hidden="true" className={block.size === 'small' ? 'h-4' : block.size === 'large' ? 'h-20' : 'h-10'} />;
        }
        return null;
      })}
    </div>
  );
}
