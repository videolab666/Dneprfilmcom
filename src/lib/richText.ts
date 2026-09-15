export type RichTextMark = 'bold' | 'italic' | 'underline' | 'code' | 'highlight';

export interface RichTextSpan {
  text: string;
  marks?: RichTextMark[];
  href?: string;
}

export interface RichTextBlock {
  type: 'paragraph' | 'bullet' | 'number';
  spans: RichTextSpan[];
}

export interface RichTextDocument {
  version: 1;
  blocks: RichTextBlock[];
}

export type RichTextValue = RichTextDocument | string | null | undefined;

const MARK_ORDER: RichTextMark[] = ['bold', 'italic', 'underline', 'code', 'highlight'];

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeMarks(value: unknown): RichTextMark[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const allowed = new Set<RichTextMark>(MARK_ORDER);
  const marks = value.filter((item): item is RichTextMark => typeof item === 'string' && allowed.has(item as RichTextMark));
  const unique = MARK_ORDER.filter(mark => marks.includes(mark));
  return unique.length ? unique : undefined;
}

function normalizeSpan(value: unknown): RichTextSpan | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const spanText = text(data.text);
  if (!spanText) return null;
  const href = text(data.href).trim();
  return {
    text: spanText,
    ...(normalizeMarks(data.marks) ? { marks: normalizeMarks(data.marks) } : {}),
    ...(href ? { href } : {}),
  };
}

function normalizeBlock(value: unknown): RichTextBlock | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const type = data.type === 'bullet' || data.type === 'number' ? data.type : 'paragraph';
  const spans = Array.isArray(data.spans)
    ? data.spans.map(normalizeSpan).filter((item): item is RichTextSpan => Boolean(item))
    : [];
  return { type, spans };
}

export function createRichText(value = ''): RichTextDocument {
  return {
    version: 1,
    blocks: value
      ? value.split(/\r?\n/).map(line => ({ type: 'paragraph' as const, spans: [{ text: line }] }))
      : [{ type: 'paragraph', spans: [] }],
  };
}

export function isRichTextDocument(value: unknown): value is RichTextDocument {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<RichTextDocument>;
  return data.version === 1 && Array.isArray(data.blocks);
}

export function normalizeRichText(value: RichTextValue, fallback = ''): RichTextDocument {
  if (isRichTextDocument(value)) {
    const blocks = value.blocks.map(normalizeBlock).filter((item): item is RichTextBlock => Boolean(item));
    return { version: 1, blocks: blocks.length ? blocks : [{ type: 'paragraph', spans: [] }] };
  }
  if (typeof value === 'string' && value.trim()) return createRichText(value);
  return createRichText(fallback);
}

export function richTextPlainText(value: RichTextValue): string {
  const document = normalizeRichText(value);
  return document.blocks
    .map(block => block.spans.map(span => span.text).join(''))
    .join('\n')
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function safeRichTextHref(value: string | undefined): string {
  const href = String(value || '').trim();
  if (!href) return '';
  if (href.startsWith('/') || href.startsWith('#')) return href;
  try {
    const parsed = new URL(href);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? href : '';
  } catch {
    return '';
  }
}

function spanHtml(span: RichTextSpan): string {
  let output = escapeHtml(span.text).replace(/\n/g, '<br>');
  const marks = span.marks || [];
  if (marks.includes('code')) output = `<code>${output}</code>`;
  if (marks.includes('highlight')) output = `<mark>${output}</mark>`;
  if (marks.includes('underline')) output = `<u>${output}</u>`;
  if (marks.includes('italic')) output = `<em>${output}</em>`;
  if (marks.includes('bold')) output = `<strong>${output}</strong>`;
  const href = safeRichTextHref(span.href);
  if (href) output = `<a href="${escapeHtml(href)}">${output}</a>`;
  return output;
}

export function richTextToEditorHtml(value: RichTextValue): string {
  const document = normalizeRichText(value);
  let html = '';
  let listType: 'bullet' | 'number' | null = null;

  const closeList = () => {
    if (!listType) return;
    html += listType === 'bullet' ? '</ul>' : '</ol>';
    listType = null;
  };

  for (const block of document.blocks) {
    if (block.type === 'paragraph') {
      closeList();
      html += `<p>${block.spans.map(spanHtml).join('') || '<br>'}</p>`;
      continue;
    }
    if (listType !== block.type) {
      closeList();
      listType = block.type;
      html += block.type === 'bullet' ? '<ul>' : '<ol>';
    }
    html += `<li>${block.spans.map(spanHtml).join('') || '<br>'}</li>`;
  }
  closeList();
  return html;
}
