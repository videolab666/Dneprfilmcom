import type { ReactNode } from 'react';
import {
  normalizeRichText,
  safeRichTextHref,
  type RichTextSpan,
  type RichTextValue,
} from '../../lib/richText';

interface RichTextRendererProps {
  key?: string;
  value: RichTextValue;
  className?: string;
  paragraphClassName?: string;
}

function renderSpan(span: RichTextSpan, index: number): ReactNode {
  let content: ReactNode = span.text;
  const marks = span.marks || [];
  if (marks.includes('code')) content = <code>{content}</code>;
  if (marks.includes('highlight')) content = <mark>{content}</mark>;
  if (marks.includes('underline')) content = <u>{content}</u>;
  if (marks.includes('italic')) content = <em>{content}</em>;
  if (marks.includes('bold')) content = <strong>{content}</strong>;
  const href = safeRichTextHref(span.href);
  if (href) {
    const external = /^https?:\/\//i.test(href);
    content = <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}>{content}</a>;
  }
  return <span key={index}>{content}</span>;
}

export function RichTextRenderer({ value, className = '', paragraphClassName = '' }: RichTextRendererProps) {
  const document = normalizeRichText(value);
  const nodes: ReactNode[] = [];

  for (let index = 0; index < document.blocks.length;) {
    const block = document.blocks[index];
    if (block.type === 'paragraph') {
      nodes.push(<p key={`p-${index}`} className={paragraphClassName}>{block.spans.map(renderSpan)}</p>);
      index += 1;
      continue;
    }

    const listType = block.type;
    const items: ReactNode[] = [];
    let cursor = index;
    while (cursor < document.blocks.length && document.blocks[cursor].type === listType) {
      const row = document.blocks[cursor];
      items.push(<li key={`li-${cursor}`}>{row.spans.map(renderSpan)}</li>);
      cursor += 1;
    }
    if (listType === 'bullet') {
      nodes.push(<ul key={`ul-${index}`} className="list-disc space-y-2 pl-6">{items}</ul>);
    } else {
      nodes.push(<ol key={`ol-${index}`} className="list-decimal space-y-2 pl-6">{items}</ol>);
    }
    index = cursor;
  }

  return <div className={`space-y-4 ${className}`}>{nodes}</div>;
}
