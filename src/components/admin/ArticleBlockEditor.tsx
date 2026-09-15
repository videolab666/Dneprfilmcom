import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  FileImage,
  Heading2,
  Heading3,
  ListPlus,
  MessageSquareQuote,
  Plus,
  Table2,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import type { Locale } from '../../types';
import {
  articleBlocksField,
  createArticleBlock,
  normalizeArticleBlocks,
  type ArticleBlock,
  type ArticleBlockType,
} from '../../lib/articleBlocks';
import { articleTranslation, type UnifiedContentRecord } from './UnifiedContentFieldsCore';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { ArticleBlocksRenderer } from '../article/ArticleBlocksRenderer';

interface ArticleBlockEditorProps {
  value: UnifiedContentRecord;
  locale: Locale;
  onPatch: (patch: UnifiedContentRecord) => void;
}

const BLOCK_BUTTONS: Array<{ type: ArticleBlockType; label: string; icon: typeof Plus }> = [
  { type: 'paragraph', label: 'Абзац', icon: Plus },
  { type: 'h2', label: 'H2', icon: Heading2 },
  { type: 'h3', label: 'H3', icon: Heading3 },
  { type: 'image', label: 'Фото', icon: FileImage },
  { type: 'video', label: 'Видео', icon: Video },
  { type: 'quote', label: 'Цитата', icon: MessageSquareQuote },
  { type: 'cta', label: 'CTA', icon: ListPlus },
  { type: 'table', label: 'Таблица', icon: Table2 },
  { type: 'faq', label: 'FAQ', icon: ListPlus },
];

function blockLabel(block: ArticleBlock): string {
  const labels: Record<ArticleBlockType, string> = {
    paragraph: 'Paragraph', h2: 'H2', h3: 'H3', image: 'Image', video: 'Video', quote: 'Quote', cta: 'CTA', table: 'Table', faq: 'FAQ',
  };
  return labels[block.type];
}

function tableText(rows: string[][]): string {
  return rows.map(row => row.join(' | ')).join('\n');
}

function parseTableText(value: string): string[][] {
  return value.split('\n').map(line => line.trim()).filter(Boolean).map(line => line.split('|').map(cell => cell.trim()));
}

export function ArticleBlockEditor({ value, locale, onPatch }: ArticleBlockEditorProps) {
  const translation = articleTranslation(value, locale);
  const field = articleBlocksField(locale);
  const blocks = useMemo(() => normalizeArticleBlocks(value, locale, translation), [value, locale, translation]);
  const [pickerBlockId, setPickerBlockId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const commit = (next: ArticleBlock[]) => onPatch({ [field]: next });

  const addBlock = (type: ArticleBlockType) => commit([...blocks, createArticleBlock(type)]);
  const patchBlock = (id: string, patch: Partial<ArticleBlock>) => commit(blocks.map(block => block.id === id ? ({ ...block, ...patch } as ArticleBlock) : block));
  const removeBlock = (id: string) => commit(blocks.filter(block => block.id !== id));
  const moveBlock = (id: string, delta: -1 | 1) => {
    const index = blocks.findIndex(block => block.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    commit(next);
  };

  return (
    <section className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700">Articles / Media Center 3.0</div>
          <h3 className="mt-1 text-lg font-black text-slate-950">Rich blocks · {locale.toUpperCase()}</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">Структурированный контент хранится отдельно от legacy paragraphs. Старые статьи автоматически отображаются как paragraph-блоки до первого сохранения нового редактора.</p>
        </div>
        <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-50"><Eye className="h-4 w-4" />Draft preview</button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {BLOCK_BUTTONS.map(item => <button key={item.type} type="button" onClick={() => addBlock(item.type)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"><item.icon className="h-3.5 w-3.5" />{item.label}</button>)}
      </div>

      <div className="mt-5 space-y-3">
        {blocks.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">Добавьте первый блок.</div>}
        {blocks.map((block, index) => (
          <article key={block.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase text-white">{blockLabel(block)}</span>
              <span className="text-[10px] font-semibold text-slate-400">#{index + 1}</span>
              <div className="ml-auto flex gap-1">
                <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={index === blocks.length - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeBlock(block.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            {(block.type === 'paragraph' || block.type === 'h2' || block.type === 'h3') && (
              <textarea rows={block.type === 'paragraph' ? 5 : 2} value={block.text} onChange={event => patchBlock(block.id, { text: event.target.value } as Partial<ArticleBlock>)} placeholder={block.type === 'paragraph' ? 'Текст абзаца…' : block.type.toUpperCase()} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-indigo-500" />
            )}

            {block.type === 'image' && (
              <div className="grid gap-3">
                {block.url && <img src={block.url} alt={block.alt || ''} className="max-h-64 w-full rounded-xl bg-slate-100 object-cover" />}
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input value={block.url} onChange={event => patchBlock(block.id, { url: event.target.value } as Partial<ArticleBlock>)} placeholder="Image URL" className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <button type="button" onClick={() => setPickerBlockId(block.id)} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">Медиатека</button>
                </div>
                <input value={block.alt || ''} onChange={event => patchBlock(block.id, { alt: event.target.value } as Partial<ArticleBlock>)} placeholder="ALT" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                <input value={block.caption || ''} onChange={event => patchBlock(block.id, { caption: event.target.value } as Partial<ArticleBlock>)} placeholder="Caption" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
            )}

            {block.type === 'video' && (
              <div className="grid gap-3">
                <input value={block.url} onChange={event => patchBlock(block.id, { url: event.target.value } as Partial<ArticleBlock>)} placeholder="YouTube / Vimeo / embed URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                <input value={block.caption || ''} onChange={event => patchBlock(block.id, { caption: event.target.value } as Partial<ArticleBlock>)} placeholder="Подпись к видео" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
            )}

            {block.type === 'quote' && (
              <div className="grid gap-3">
                <textarea rows={4} value={block.text} onChange={event => patchBlock(block.id, { text: event.target.value } as Partial<ArticleBlock>)} placeholder="Цитата" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                <input value={block.attribution || ''} onChange={event => patchBlock(block.id, { attribution: event.target.value } as Partial<ArticleBlock>)} placeholder="Автор / источник" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
            )}

            {block.type === 'cta' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={block.title} onChange={event => patchBlock(block.id, { title: event.target.value } as Partial<ArticleBlock>)} placeholder="CTA title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 sm:col-span-2" />
                <textarea rows={3} value={block.text || ''} onChange={event => patchBlock(block.id, { text: event.target.value } as Partial<ArticleBlock>)} placeholder="CTA text" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 sm:col-span-2" />
                <input value={block.label} onChange={event => patchBlock(block.id, { label: event.target.value } as Partial<ArticleBlock>)} placeholder="Button label" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                <input value={block.url} onChange={event => patchBlock(block.id, { url: event.target.value } as Partial<ArticleBlock>)} placeholder="Button URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
            )}

            {block.type === 'table' && (
              <div className="grid gap-3">
                <input value={block.headers.join(' | ')} onChange={event => patchBlock(block.id, { headers: event.target.value.split('|').map(item => item.trim()).filter(Boolean) } as Partial<ArticleBlock>)} placeholder="Заголовки: Колонка 1 | Колонка 2" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                <textarea rows={5} value={tableText(block.rows)} onChange={event => patchBlock(block.id, { rows: parseTableText(event.target.value) } as Partial<ArticleBlock>)} placeholder={'Строка 1: значение | значение\nСтрока 2: значение | значение'} className="rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-indigo-500" />
              </div>
            )}

            {block.type === 'faq' && (
              <div className="space-y-3">
                {block.items.map((item, itemIndex) => (
                  <div key={`${block.id}-${itemIndex}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <input value={item.question} onChange={event => patchBlock(block.id, { items: block.items.map((row, index) => index === itemIndex ? { ...row, question: event.target.value } : row) } as Partial<ArticleBlock>)} placeholder="Вопрос" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                    <textarea rows={3} value={item.answer} onChange={event => patchBlock(block.id, { items: block.items.map((row, index) => index === itemIndex ? { ...row, answer: event.target.value } : row) } as Partial<ArticleBlock>)} placeholder="Ответ" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                    {block.items.length > 1 && <button type="button" onClick={() => patchBlock(block.id, { items: block.items.filter((_, index) => index !== itemIndex) } as Partial<ArticleBlock>)} className="mt-2 text-[11px] font-bold text-red-600">Удалить вопрос</button>}
                  </div>
                ))}
                <button type="button" onClick={() => patchBlock(block.id, { items: [...block.items, { question: '', answer: '' }] } as Partial<ArticleBlock>)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">+ Вопрос</button>
              </div>
            )}
          </article>
        ))}
      </div>

      {pickerBlockId && (
        <MediaLibraryPicker
          type="image"
          onClose={() => setPickerBlockId(null)}
          onSelect={asset => {
            patchBlock(pickerBlockId, { url: asset.url, alt: asset.name || '' } as Partial<ArticleBlock>);
            setPickerBlockId(null);
          }}
        />
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
          <div className="mx-auto my-6 max-w-4xl rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
            <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div><div className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600">Draft preview</div><h2 className="mt-1 text-3xl font-black text-slate-950">{translation.title || 'Без заголовка'}</h2><p className="mt-2 text-sm text-slate-500">{translation.summary}</p></div>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <ArticleBlocksRenderer blocks={blocks} />
          </div>
        </div>
      )}
    </section>
  );
}
