import { useEffect, useMemo, useRef } from 'react';
import {
  Bold,
  Eraser,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
} from 'lucide-react';
import {
  normalizeRichText,
  richTextToEditorHtml,
  safeRichTextHref,
  type RichTextBlock,
  type RichTextDocument,
  type RichTextMark,
  type RichTextSpan,
  type RichTextValue,
} from '../../lib/richText';

interface RichTextEditorProps {
  value: RichTextValue;
  onChange: (value: RichTextDocument) => void;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
}

function sameMarks(a?: RichTextMark[], b?: RichTextMark[]): boolean {
  return JSON.stringify(a || []) === JSON.stringify(b || []);
}

function appendSpan(target: RichTextSpan[], span: RichTextSpan) {
  if (!span.text) return;
  const last = target[target.length - 1];
  if (last && last.href === span.href && sameMarks(last.marks, span.marks)) {
    last.text += span.text;
    return;
  }
  target.push(span);
}

function inlineSpans(node: Node, inheritedMarks: RichTextMark[] = [], inheritedHref = ''): RichTextSpan[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = node.textContent || '';
    return value ? [{ text: value, ...(inheritedMarks.length ? { marks: inheritedMarks } : {}), ...(inheritedHref ? { href: inheritedHref } : {}) }] : [];
  }
  if (!(node instanceof HTMLElement)) return [];
  if (node.tagName === 'BR') {
    return [{ text: '\n', ...(inheritedMarks.length ? { marks: inheritedMarks } : {}), ...(inheritedHref ? { href: inheritedHref } : {}) }];
  }

  const marks = [...inheritedMarks];
  const addMark = (mark: RichTextMark) => {
    if (!marks.includes(mark)) marks.push(mark);
  };
  const tag = node.tagName.toLowerCase();
  if (tag === 'strong' || tag === 'b' || Number(node.style.fontWeight || 0) >= 600) addMark('bold');
  if (tag === 'em' || tag === 'i' || node.style.fontStyle === 'italic') addMark('italic');
  if (tag === 'u' || node.style.textDecorationLine.includes('underline')) addMark('underline');
  if (tag === 'code') addMark('code');
  if (tag === 'mark' || Boolean(node.style.backgroundColor)) addMark('highlight');

  const href = tag === 'a' ? safeRichTextHref(node.getAttribute('href') || '') : inheritedHref;
  const result: RichTextSpan[] = [];
  node.childNodes.forEach(child => {
    inlineSpans(child, marks, href).forEach(span => appendSpan(result, span));
  });
  return result;
}

function serializeEditor(root: HTMLElement): RichTextDocument {
  const blocks: RichTextBlock[] = [];
  const pushParagraph = (node: Node, type: RichTextBlock['type'] = 'paragraph') => {
    const spans = inlineSpans(node);
    blocks.push({ type, spans });
  };

  root.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if ((node.textContent || '').trim()) pushParagraph(node);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'ul' || tag === 'ol') {
      const type: RichTextBlock['type'] = tag === 'ul' ? 'bullet' : 'number';
      Array.from(node.children).forEach(child => {
        if (child.tagName.toLowerCase() === 'li') pushParagraph(child, type);
      });
      return;
    }
    if (tag === 'li') {
      pushParagraph(node, 'bullet');
      return;
    }
    pushParagraph(node);
  });

  return {
    version: 1,
    blocks: blocks.length ? blocks : [{ type: 'paragraph', spans: [] }],
  };
}

function ToolButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-indigo-700 hover:shadow-sm"
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder = 'Введите текст…', minHeight = 132, compact = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const normalized = useMemo(() => normalizeRichText(value), [value]);
  const html = useMemo(() => richTextToEditorHtml(normalized), [normalized]);
  const lastHtmlRef = useRef('');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor || lastHtmlRef.current === html) return;
    editor.innerHTML = html;
    lastHtmlRef.current = html;
  }, [html]);

  const emit = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = serializeEditor(editor);
    lastHtmlRef.current = editor.innerHTML;
    onChange(next);
  };

  const runCommand = (command: string, commandValue?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, commandValue);
    emit();
  };

  const createLink = () => {
    const current = window.getSelection()?.toString() || '';
    const entered = window.prompt(current ? 'URL для выделенного текста' : 'Сначала выделите текст, затем укажите URL');
    if (!entered) return;
    const href = safeRichTextHref(entered);
    if (!href) {
      window.alert('Разрешены внутренние ссылки, http(s), mailto и tel.');
      return;
    }
    runCommand('createLink', href);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
        <ToolButton title="Жирный (Ctrl+B)" onClick={() => runCommand('bold')}><Bold className="h-4 w-4" /></ToolButton>
        <ToolButton title="Курсив (Ctrl+I)" onClick={() => runCommand('italic')}><Italic className="h-4 w-4" /></ToolButton>
        <ToolButton title="Подчёркивание (Ctrl+U)" onClick={() => runCommand('underline')}><Underline className="h-4 w-4" /></ToolButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolButton title="Маркированный список" onClick={() => runCommand('insertUnorderedList')}><List className="h-4 w-4" /></ToolButton>
        <ToolButton title="Нумерованный список" onClick={() => runCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></ToolButton>
        <ToolButton title="Ссылка" onClick={createLink}><Link2 className="h-4 w-4" /></ToolButton>
        <ToolButton title="Выделение" onClick={() => runCommand('hiliteColor', '#fef08a')}><Highlighter className="h-4 w-4" /></ToolButton>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <ToolButton title="Очистить форматирование" onClick={() => { runCommand('unlink'); runCommand('removeFormat'); }}><Eraser className="h-4 w-4" /></ToolButton>
        <span className="ml-auto px-2 text-[10px] font-semibold text-slate-400">Rich text</span>
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder}
          onInput={emit}
          onBlur={emit}
          className={`rich-text-editor w-full px-3 py-2.5 text-sm leading-7 text-slate-800 outline-none ${compact ? 'text-[13px]' : ''}`}
          style={{ minHeight }}
        />
        <style>{`.rich-text-editor:empty:before{content:attr(data-placeholder);color:#94a3b8;pointer-events:none}.rich-text-editor p{margin:0 0 .6rem}.rich-text-editor p:last-child{margin-bottom:0}.rich-text-editor ul{list-style:disc;padding-left:1.4rem;margin:.35rem 0}.rich-text-editor ol{list-style:decimal;padding-left:1.4rem;margin:.35rem 0}.rich-text-editor a{color:#4f46e5;text-decoration:underline}.rich-text-editor mark{background:#fef08a}.rich-text-editor code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#f1f5f9;padding:.08rem .28rem;border-radius:.25rem}`}</style>
      </div>
    </div>
  );
}
