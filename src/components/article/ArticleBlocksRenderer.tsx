import type { ArticleBlock } from '../../lib/articleBlocks';
import { videoEmbedUrl } from '../../lib/articleBlocks';

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

export function ArticleBlocksRenderer({ blocks }: ArticleBlocksRendererProps) {
  return (
    <div className="space-y-7 text-[17px] leading-8 text-slate-700">
      {blocks.map(block => {
        if (block.type === 'paragraph') {
          return <p key={block.id}>{block.text}</p>;
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
        if (block.type === 'video') {
          const embedUrl = videoEmbedUrl(block.url);
          return (
            <figure key={block.id} className="my-9 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-lg">
              <div className="aspect-video">
                {embedUrl && (
                  <iframe
                    src={embedUrl}
                    title={block.caption || 'Video'}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                )}
              </div>
              {block.caption && <figcaption className="bg-white px-5 py-3 text-sm leading-relaxed text-slate-500">{block.caption}</figcaption>}
            </figure>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={block.id} className="my-9 rounded-3xl border-l-4 border-indigo-500 bg-indigo-50 px-6 py-6 text-xl font-semibold leading-relaxed text-slate-900">
              <p>“{block.text}”</p>
              {block.attribution && <footer className="mt-3 text-sm font-bold text-indigo-700">— {block.attribution}</footer>}
            </blockquote>
          );
        }
        if (block.type === 'cta') {
          return (
            <aside key={block.id} className="my-10 rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
              {block.title && <h3 className="text-2xl font-black">{block.title}</h3>}
              {block.text && <p className="mt-3 text-base leading-relaxed text-slate-300">{block.text}</p>}
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
        if (block.type === 'faq' && 'items' in block) {
          return (
            <section key={block.id} className="my-10 space-y-3">
              {block.items.map((item, index) => (
                <details key={`${block.id}-${index}`} className="group rounded-2xl border border-slate-200 bg-white p-4 open:bg-slate-50">
                  <summary className="cursor-pointer list-none pr-6 font-black text-slate-950">{item.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </section>
          );
        }
        return null;
      })}
    </div>
  );
}
