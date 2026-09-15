import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Columns3,
  Copy,
  Eye,
  FileImage,
  GalleryHorizontalEnd,
  GripVertical,
  Heading2,
  Heading3,
  Info,
  Link2,
  ListPlus,
  Minus,
  MessageSquareQuote,
  PanelTop,
  Plus,
  Space,
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
  type ArticleGalleryBlock,
} from '../../lib/articleBlocks';
import { createRichText, richTextPlainText } from '../../lib/richText';
import { articleTranslation, type UnifiedContentRecord } from './UnifiedContentFieldsCore';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { ArticleBlocksRenderer } from '../article/ArticleBlocksRenderer';
import { RichTextEditor } from './RichTextEditor';
import { RelatedContentPicker } from './RelatedContentPicker';

interface ArticleBlockEditorProps {
  value: UnifiedContentRecord;
  locale: Locale;
  onPatch: (patch: UnifiedContentRecord) => void;
}

const BLOCK_BUTTONS: Array<{ type: ArticleBlockType; label: string; icon: typeof Plus }> = [
  { type: 'paragraph', label: 'Текст', icon: Plus },
  { type: 'h2', label: 'H2', icon: Heading2 },
  { type: 'h3', label: 'H3', icon: Heading3 },
  { type: 'image', label: 'Фото', icon: FileImage },
  { type: 'gallery', label: 'Галерея', icon: GalleryHorizontalEnd },
  { type: 'video', label: 'Видео', icon: Video },
  { type: 'quote', label: 'Цитата', icon: MessageSquareQuote },
  { type: 'callout', label: 'Callout', icon: Info },
  { type: 'cta', label: 'CTA', icon: ListPlus },
  { type: 'table', label: 'Таблица', icon: Table2 },
  { type: 'faq', label: 'FAQ', icon: ListPlus },
  { type: 'columns', label: '2 колонки', icon: Columns3 },
  { type: 'related', label: 'Материал', icon: Link2 },
  { type: 'divider', label: 'Разделитель', icon: Minus },
  { type: 'spacer', label: 'Отступ', icon: Space },
];

function blockLabel(block: ArticleBlock): string {
  const labels: Record<ArticleBlockType, string> = {
    paragraph: 'Rich text', h2: 'H2', h3: 'H3', image: 'Image', gallery: 'Gallery', video: 'Video', quote: 'Quote', callout: 'Callout', cta: 'CTA', table: 'Table', faq: 'FAQ', columns: 'Columns', related: 'Related', divider: 'Divider', spacer: 'Spacer',
  };
  return labels[block.type];
}

function tableText(rows: string[][]): string {
  return rows.map(row => row.join(' | ')).join('\n');
}

function parseTableText(value: string): string[][] {
  return value.split('\n').map(line => line.trim()).filter(Boolean).map(line => line.split('|').map(cell => cell.trim()));
}

function cloneBlock(block: ArticleBlock): ArticleBlock {
  const clone = JSON.parse(JSON.stringify(block)) as ArticleBlock;
  clone.id = `${block.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  if (clone.type === 'gallery') {
    clone.images = clone.images.map((image, index) => ({ ...image, id: `${clone.id}-image-${index}-${Math.random().toString(36).slice(2, 5)}` }));
  }
  return clone;
}

export function ArticleBlockEditor({ value, locale, onPatch }: ArticleBlockEditorProps) {
  const translation = articleTranslation(value, locale);
  const field = articleBlocksField(locale);
  const blocks = useMemo(() => normalizeArticleBlocks(value, locale, translation), [value, locale, translation]);
  const [picker, setPicker] = useState<{ blockId: string; mode: 'single' | 'gallery' } | null>(null);
  const [relatedPickerBlockId, setRelatedPickerBlockId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  const commit = (next: ArticleBlock[]) => onPatch({ [field]: next });

  const addBlock = (type: ArticleBlockType) => commit([...blocks, createArticleBlock(type)]);
  const patchBlock = (id: string, patch: Partial<ArticleBlock>) => commit(blocks.map(block => block.id === id ? ({ ...block, ...patch } as ArticleBlock) : block));
  const removeBlock = (id: string) => commit(blocks.filter(block => block.id !== id));
  const duplicateBlock = (id: string) => {
    const index = blocks.findIndex(block => block.id === id);
    if (index < 0) return;
    const next = [...blocks];
    next.splice(index + 1, 0, cloneBlock(blocks[index]));
    commit(next);
  };
  const moveBlock = (id: string, delta: -1 | 1) => {
    const index = blocks.findIndex(block => block.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    commit(next);
  };
  const dropBlock = (targetId: string) => {
    if (!draggedBlockId || draggedBlockId === targetId) return;
    const source = blocks.findIndex(block => block.id === draggedBlockId);
    const target = blocks.findIndex(block => block.id === targetId);
    if (source < 0 || target < 0) return;
    const next = [...blocks];
    const [moved] = next.splice(source, 1);
    next.splice(target, 0, moved);
    commit(next);
    setDraggedBlockId(null);
  };

  const patchGalleryImage = (block: ArticleGalleryBlock, imageId: string, patch: Partial<ArticleGalleryBlock['images'][number]>) => {
    patchBlock(block.id, { images: block.images.map(image => image.id === imageId ? { ...image, ...patch } : image) } as Partial<ArticleBlock>);
  };

  const removeGalleryImage = (block: ArticleGalleryBlock, imageId: string) => {
    patchBlock(block.id, { images: block.images.filter(image => image.id !== imageId) } as Partial<ArticleBlock>);
  };

  return (
    <section className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700">Content Builder 4.0</div>
          <h3 className="mt-1 text-lg font-black text-slate-950">Rich blocks · {locale.toUpperCase()}</h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">Безопасный structured rich text, списки и ссылки, галереи внутри статьи, callout, две колонки, связанные материалы, drag&drop и draft preview. Legacy-статьи остаются совместимыми.</p>
        </div>
        <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-50"><Eye className="h-4 w-4" />Draft preview</button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {BLOCK_BUTTONS.map(item => <button key={item.type} type="button" onClick={() => addBlock(item.type)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"><item.icon className="h-3.5 w-3.5" />{item.label}</button>)}
      </div>

      <div className="mt-5 space-y-3">
        {blocks.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">Добавьте первый блок.</div>}
        {blocks.map((block, index) => (
          <article
            key={block.id}
            onDragOver={event => event.preventDefault()}
            onDrop={() => dropBlock(block.id)}
            className={`rounded-2xl border bg-white p-4 shadow-sm transition ${draggedBlockId === block.id ? 'border-indigo-400 opacity-60' : 'border-slate-200'}`}
          >
            <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
              <div
                draggable
                onDragStart={() => setDraggedBlockId(block.id)}
                onDragEnd={() => setDraggedBlockId(null)}
                className="cursor-grab rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
                title="Перетащить блок"
              ><GripVertical className="h-4 w-4" /></div>
              <span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black uppercase text-white">{blockLabel(block)}</span>
              <span className="text-[10px] font-semibold text-slate-400">#{index + 1}</span>
              <div className="ml-auto flex gap-1">
                <button type="button" onClick={() => duplicateBlock(block.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600" title="Дублировать"><Copy className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={index === blocks.length - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeBlock(block.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            {block.type === 'paragraph' && (
              <RichTextEditor
                value={block.richText || block.text}
                onChange={richText => patchBlock(block.id, { richText, text: richTextPlainText(richText) } as Partial<ArticleBlock>)}
                placeholder="Текст абзаца…"
              />
            )}

            {(block.type === 'h2' || block.type === 'h3') && (
              <input value={block.text} onChange={event => patchBlock(block.id, { text: event.target.value } as Partial<ArticleBlock>)} placeholder={block.type.toUpperCase()} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-indigo-500" />
            )}

            {block.type === 'image' && (
              <div className="grid gap-3">
                {block.url && <img src={block.url} alt={block.alt || ''} className="max-h-64 w-full rounded-xl bg-slate-100 object-cover" />}
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input value={block.url} onChange={event => patchBlock(block.id, { url: event.target.value } as Partial<ArticleBlock>)} placeholder="Image URL" className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <button type="button" onClick={() => setPicker({ blockId: block.id, mode: 'single' })} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">Медиатека</button>
                </div>
                <input value={block.alt || ''} onChange={event => patchBlock(block.id, { alt: event.target.value } as Partial<ArticleBlock>)} placeholder="ALT" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                <input value={block.caption || ''} onChange={event => patchBlock(block.id, { caption: event.target.value } as Partial<ArticleBlock>)} placeholder="Caption" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
            )}

            {block.type === 'gallery' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <select value={block.layout} onChange={event => patchBlock(block.id, { layout: event.target.value as ArticleGalleryBlock['layout'] } as Partial<ArticleBlock>)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                    <option value="grid">Grid</option>
                    <option value="masonry">Masonry</option>
                  </select>
                  <select value={block.columns} onChange={event => patchBlock(block.id, { columns: Number(event.target.value) as ArticleGalleryBlock['columns'] } as Partial<ArticleBlock>)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                    <option value={2}>2 колонки</option><option value={3}>3 колонки</option><option value={4}>4 колонки</option>
                  </select>
                  <button type="button" onClick={() => setPicker({ blockId: block.id, mode: 'gallery' })} className="ml-auto rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-500">+ Фото из медиатеки</button>
                </div>
                {block.images.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">Добавьте изображения.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {block.images.map((image, imageIndex) => (
                      <div key={image.id} className="rounded-xl border border-slate-200 p-3">
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100"><img src={image.url} alt="" className="h-full w-full object-cover" /><span className="absolute right-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold text-white">#{imageIndex + 1}</span></div>
                        <input value={image.alt || ''} onChange={event => patchGalleryImage(block, image.id, { alt: event.target.value })} placeholder="ALT" className="mt-2 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                        <input value={image.caption || ''} onChange={event => patchGalleryImage(block, image.id, { caption: event.target.value })} placeholder="Caption" className="mt-2 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs" />
                        <div className="mt-2 flex justify-end gap-1">
                          <button type="button" onClick={() => {
                            if (imageIndex === 0) return;
                            const next = [...block.images];
                            [next[imageIndex - 1], next[imageIndex]] = [next[imageIndex], next[imageIndex - 1]];
                            patchBlock(block.id, { images: next } as Partial<ArticleBlock>);
                          }} disabled={imageIndex === 0} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowUp className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => {
                            if (imageIndex >= block.images.length - 1) return;
                            const next = [...block.images];
                            [next[imageIndex], next[imageIndex + 1]] = [next[imageIndex + 1], next[imageIndex]];
                            patchBlock(block.id, { images: next } as Partial<ArticleBlock>);
                          }} disabled={imageIndex === block.images.length - 1} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25"><ArrowDown className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => removeGalleryImage(block, image.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <RichTextEditor value={block.richText || block.text} onChange={richText => patchBlock(block.id, { richText, text: richTextPlainText(richText) } as Partial<ArticleBlock>)} placeholder="Цитата" minHeight={96} />
                <input value={block.attribution || ''} onChange={event => patchBlock(block.id, { attribution: event.target.value } as Partial<ArticleBlock>)} placeholder="Автор / источник" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
              </div>
            )}

            {block.type === 'callout' && (
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  <select value={block.tone} onChange={event => patchBlock(block.id, { tone: event.target.value as typeof block.tone } as Partial<ArticleBlock>)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option>
                  </select>
                  <input value={block.title || ''} onChange={event => patchBlock(block.id, { title: event.target.value } as Partial<ArticleBlock>)} placeholder="Заголовок callout" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <RichTextEditor value={block.richText || block.text} onChange={richText => patchBlock(block.id, { richText, text: richTextPlainText(richText) } as Partial<ArticleBlock>)} placeholder="Текст callout…" minHeight={96} />
              </div>
            )}

            {block.type === 'cta' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={block.title} onChange={event => patchBlock(block.id, { title: event.target.value } as Partial<ArticleBlock>)} placeholder="CTA title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 sm:col-span-2" />
                <div className="sm:col-span-2"><RichTextEditor value={block.richText || block.text || ''} onChange={richText => patchBlock(block.id, { richText, text: richTextPlainText(richText) } as Partial<ArticleBlock>)} placeholder="CTA text" minHeight={96} /></div>
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
                    <input value={item.question} onChange={event => patchBlock(block.id, { items: block.items.map((row, rowIndex) => rowIndex === itemIndex ? { ...row, question: event.target.value } : row) } as Partial<ArticleBlock>)} placeholder="Вопрос" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                    <div className="mt-2"><RichTextEditor compact minHeight={92} value={item.answerRichText || item.answer} onChange={answerRichText => patchBlock(block.id, { items: block.items.map((row, rowIndex) => rowIndex === itemIndex ? { ...row, answerRichText, answer: richTextPlainText(answerRichText) } : row) } as Partial<ArticleBlock>)} placeholder="Ответ" /></div>
                    {block.items.length > 1 && <button type="button" onClick={() => patchBlock(block.id, { items: block.items.filter((_, rowIndex) => rowIndex !== itemIndex) } as Partial<ArticleBlock>)} className="mt-2 text-[11px] font-bold text-red-600">Удалить вопрос</button>}
                  </div>
                ))}
                <button type="button" onClick={() => patchBlock(block.id, { items: [...block.items, { question: '', answer: '', answerRichText: createRichText() }] } as Partial<ArticleBlock>)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">+ Вопрос</button>
              </div>
            )}

            {block.type === 'columns' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Пропорции:</span>
                  <select value={block.ratio} onChange={event => patchBlock(block.id, { ratio: event.target.value as typeof block.ratio } as Partial<ArticleBlock>)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold">
                    <option value="1-1">50 / 50</option><option value="2-1">66 / 33</option><option value="1-2">33 / 66</option>
                  </select>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div><div className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Левая колонка</div><RichTextEditor value={block.left} onChange={left => patchBlock(block.id, { left } as Partial<ArticleBlock>)} minHeight={150} /></div>
                  <div><div className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Правая колонка</div><RichTextEditor value={block.right} onChange={right => patchBlock(block.id, { right } as Partial<ArticleBlock>)} minHeight={150} /></div>
                </div>
              </div>
            )}

            {block.type === 'related' && (
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-700">{block.contentType}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-black text-slate-900">{block.title || 'Материал не выбран'}</span>
                  <button type="button" onClick={() => setRelatedPickerBlockId(block.id)} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">Выбрать материал</button>
                </div>
                {block.imageUrl && <img src={block.imageUrl} alt="" className="max-h-52 w-full rounded-xl object-cover" />}
                <input value={block.title} onChange={event => patchBlock(block.id, { title: event.target.value } as Partial<ArticleBlock>)} placeholder="Заголовок карточки" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <textarea rows={2} value={block.description || ''} onChange={event => patchBlock(block.id, { description: event.target.value } as Partial<ArticleBlock>)} placeholder="Короткое описание" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                <input value={block.url} onChange={event => patchBlock(block.id, { url: event.target.value } as Partial<ArticleBlock>)} placeholder="URL" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
            )}

            {block.type === 'divider' && (
              <div className="flex items-center gap-3">
                <select value={block.style} onChange={event => patchBlock(block.id, { style: event.target.value as typeof block.style } as Partial<ArticleBlock>)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="line">Линия</option><option value="dots">Точки</option></select>
                <div className="flex-1">{block.style === 'line' ? <div className="h-px bg-slate-300" /> : <div className="text-center tracking-[.5em] text-slate-400">•••</div>}</div>
              </div>
            )}

            {block.type === 'spacer' && (
              <div className="flex items-center gap-3">
                <select value={block.size} onChange={event => patchBlock(block.id, { size: event.target.value as typeof block.size } as Partial<ArticleBlock>)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="small">Маленький</option><option value="medium">Средний</option><option value="large">Большой</option></select>
                <div className={`flex-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 ${block.size === 'small' ? 'h-6' : block.size === 'large' ? 'h-20' : 'h-12'}`} />
              </div>
            )}
          </article>
        ))}
      </div>

      {picker && picker.mode === 'single' && (
        <MediaLibraryPicker
          type="image"
          onClose={() => setPicker(null)}
          onSelect={asset => {
            patchBlock(picker.blockId, { url: asset.url, alt: asset.name || '' } as Partial<ArticleBlock>);
            setPicker(null);
          }}
        />
      )}

      {picker && picker.mode === 'gallery' && (
        <MediaLibraryPicker
          type="image"
          multiple
          title="Добавить изображения в блок-галерею"
          onClose={() => setPicker(null)}
          onSelectMany={assets => {
            const current = blocks.find(item => item.id === picker.blockId);
            if (current?.type === 'gallery') {
              const known = new Set(current.images.map(image => image.url));
              const additions = assets.filter(asset => !known.has(asset.url)).map((asset, index) => ({
                id: `${current.id}-image-${Date.now()}-${index}`,
                url: asset.url,
                alt: asset.name || '',
                caption: '',
              }));
              patchBlock(current.id, { images: [...current.images, ...additions] } as Partial<ArticleBlock>);
            }
            setPicker(null);
          }}
        />
      )}

      {relatedPickerBlockId && (
        <RelatedContentPicker
          locale={locale}
          onClose={() => setRelatedPickerBlockId(null)}
          onSelect={selected => {
            patchBlock(relatedPickerBlockId, selected as Partial<ArticleBlock>);
            setRelatedPickerBlockId(null);
          }}
        />
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
          <div className="mx-auto my-6 max-w-5xl rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
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
