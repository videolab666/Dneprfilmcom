import { useMemo, useState, type ReactNode } from 'react';
import { Image as ImageIcon, Plus, Save, Trash2, X } from 'lucide-react';
import type { Locale } from '../types';
import {
  PAGE_BUILDER_KINDS,
  blockKind,
  type BuilderSiteBlock,
  type PageBuilderImage,
} from '../lib/pageBuilder';
import { MediaLibraryPicker } from './admin/MediaLibraryPicker';

interface CmsBlockInlineEditorProps {
  block: BuilderSiteBlock;
  locale: Locale;
  onClose: () => void;
  onSave: (block: BuilderSiteBlock) => Promise<void>;
}

type Config = BuilderSiteBlock['config'];
type MediaTarget = 'image' | 'video' | 'gallery' | null;

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'UA' },
  { id: 'ru', label: 'RU' },
  { id: 'en', label: 'EN' },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fieldClass(extra = ''): string {
  return `w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 ${extra}`;
}

function Label({ children }: { children: string }) {
  return <div className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{children}</div>;
}

function TextField({ label, value, onChange, multiline = false, placeholder = '' }: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return <label className="block"><Label>{label}</Label>{multiline
    ? <textarea rows={3} value={value || ''} placeholder={placeholder} onChange={event => onChange(event.target.value)} className={fieldClass('resize-y')} />
    : <input value={value || ''} placeholder={placeholder} onChange={event => onChange(event.target.value)} className={fieldClass()} />}</label>;
}

function SmallButton({ onClick, children, danger = false }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${danger ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{children}</button>;
}

export function CmsBlockInlineEditor({ block, locale, onClose, onSave }: CmsBlockInlineEditorProps) {
  const [draft, setDraft] = useState<BuilderSiteBlock>(() => clone(block));
  const [language, setLanguage] = useState<Locale>(locale);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mediaTarget, setMediaTarget] = useState<MediaTarget>(null);

  const kind = blockKind(draft);
  const definition = PAGE_BUILDER_KINDS.find(item => item.id === kind);
  const activeConfig = useMemo<Config>(() => {
    if (language === 'ru') return draft.config;
    const localized = language === 'uk' ? draft.config_uk : draft.config_en;
    return { ...draft.config, ...(localized || {}) };
  }, [draft, language]);

  const patchCommon = (patch: Partial<Config>) => setDraft(current => ({
    ...current,
    config: { ...current.config, ...patch },
  }));

  const patchLocalized = (patch: Partial<Config>) => setDraft(current => {
    if (language === 'ru') return { ...current, config: { ...current.config, ...patch } };
    if (language === 'uk') return { ...current, config_uk: { ...(current.config_uk || {}), ...patch } };
    return { ...current, config_en: { ...(current.config_en || {}), ...patch } };
  });

  const setInternalTitle = (value: string) => setDraft(current => {
    if (language === 'uk') return { ...current, title_uk: value };
    if (language === 'en') return { ...current, title_en: value };
    return { ...current, title: value };
  });

  const internalTitle = language === 'uk' ? draft.title_uk || draft.title : language === 'en' ? draft.title_en || draft.title : draft.title;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(clone(draft));
      setMessage('Draft сохранён. Preview обновлён.');
      window.setTimeout(() => setMessage(''), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const updateLocalizedArray = <K extends keyof Config>(key: K, value: Config[K]) => {
    patchLocalized({ [key]: value } as Partial<Config>);
  };

  const patchGalleryImage = (index: number, patch: Partial<PageBuilderImage>) => {
    const images = clone(draft.config.galleryImages || []);
    images[index] = { ...images[index], ...patch };
    patchCommon({ galleryImages: images });
  };

  const imageTextKey = (base: 'alt' | 'caption'): keyof PageBuilderImage => {
    if (language === 'uk') return `${base}_uk` as keyof PageBuilderImage;
    if (language === 'en') return `${base}_en` as keyof PageBuilderImage;
    return base;
  };

  const renderGenericItems = () => {
    const items = activeConfig.items || [];
    return <div className="space-y-3">
      {items.map((item, index) => <div key={index} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="mb-2 flex items-center justify-between"><div className="text-[10px] font-black uppercase text-indigo-300">Карточка {index + 1}</div><SmallButton danger onClick={() => updateLocalizedArray('items', items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3 w-3" />Удалить</SmallButton></div>
        <div className="space-y-2">
          <TextField label="Заголовок" value={item.title} onChange={value => updateLocalizedArray('items', items.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: value } : entry))} />
          <TextField label="Описание" multiline value={item.description} onChange={value => updateLocalizedArray('items', items.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: value } : entry))} />
          <TextField label="Значение / цена" value={item.value} onChange={value => updateLocalizedArray('items', items.map((entry, itemIndex) => itemIndex === index ? { ...entry, value } : entry))} />
          <TextField label="Icon key" value={item.iconName} onChange={value => updateLocalizedArray('items', items.map((entry, itemIndex) => itemIndex === index ? { ...entry, iconName: value } : entry))} />
        </div>
      </div>)}
      <SmallButton onClick={() => updateLocalizedArray('items', [...items, { title: 'Новая карточка', description: '' }])}><Plus className="h-3 w-3" />Карточка</SmallButton>
    </div>;
  };

  const renderFaq = () => {
    const items = activeConfig.faqItems || [];
    return <div className="space-y-3">{items.map((item, index) => <div key={index} className="rounded-2xl border border-slate-800 p-3"><div className="mb-2 flex justify-between"><span className="text-[10px] font-black uppercase text-indigo-300">FAQ {index + 1}</span><SmallButton danger onClick={() => updateLocalizedArray('faqItems', items.filter((_, i) => i !== index))}><Trash2 className="h-3 w-3" />Удалить</SmallButton></div><div className="space-y-2"><TextField label="Вопрос" value={item.question} onChange={value => updateLocalizedArray('faqItems', items.map((entry, i) => i === index ? { ...entry, question: value } : entry))} /><TextField label="Ответ" multiline value={item.answer} onChange={value => updateLocalizedArray('faqItems', items.map((entry, i) => i === index ? { ...entry, answer: value } : entry))} /></div></div>)}<SmallButton onClick={() => updateLocalizedArray('faqItems', [...items, { question: 'Новый вопрос', answer: 'Ответ' }])}><Plus className="h-3 w-3" />Вопрос</SmallButton></div>;
  };

  const renderTimeline = () => {
    const items = activeConfig.timelineItems || [];
    return <div className="space-y-3">{items.map((item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 p-3"><div className="mb-2 flex justify-between"><span className="text-[10px] font-black uppercase text-indigo-300">Этап {index + 1}</span><SmallButton danger onClick={() => updateLocalizedArray('timelineItems', items.filter((_, i) => i !== index))}><Trash2 className="h-3 w-3" />Удалить</SmallButton></div><div className="space-y-2"><TextField label="Дата / номер" value={item.date} onChange={value => updateLocalizedArray('timelineItems', items.map((entry, i) => i === index ? { ...entry, date: value } : entry))} /><TextField label="Заголовок" value={item.title} onChange={value => updateLocalizedArray('timelineItems', items.map((entry, i) => i === index ? { ...entry, title: value } : entry))} /><TextField label="Описание" multiline value={item.description} onChange={value => updateLocalizedArray('timelineItems', items.map((entry, i) => i === index ? { ...entry, description: value } : entry))} /><TextField label="Изображение URL" value={item.imageUrl} onChange={value => updateLocalizedArray('timelineItems', items.map((entry, i) => i === index ? { ...entry, imageUrl: value } : entry))} /></div></div>)}<SmallButton onClick={() => updateLocalizedArray('timelineItems', [...items, { id: makeId('timeline'), date: '', title: 'Новый этап', description: '' }])}><Plus className="h-3 w-3" />Этап</SmallButton></div>;
  };

  const renderDownloads = () => {
    const items = activeConfig.downloadItems || [];
    return <div className="space-y-3">{items.map((item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 p-3"><div className="mb-2 flex justify-between"><span className="text-[10px] font-black uppercase text-indigo-300">Файл {index + 1}</span><SmallButton danger onClick={() => updateLocalizedArray('downloadItems', items.filter((_, i) => i !== index))}><Trash2 className="h-3 w-3" />Удалить</SmallButton></div><div className="space-y-2"><TextField label="Название" value={item.title} onChange={value => updateLocalizedArray('downloadItems', items.map((entry, i) => i === index ? { ...entry, title: value } : entry))} /><TextField label="Описание" multiline value={item.description} onChange={value => updateLocalizedArray('downloadItems', items.map((entry, i) => i === index ? { ...entry, description: value } : entry))} /><TextField label="URL файла" value={item.url} onChange={value => updateLocalizedArray('downloadItems', items.map((entry, i) => i === index ? { ...entry, url: value } : entry))} /><div className="grid grid-cols-2 gap-2"><TextField label="Тип" value={item.fileType} onChange={value => updateLocalizedArray('downloadItems', items.map((entry, i) => i === index ? { ...entry, fileType: value } : entry))} /><TextField label="Размер" value={item.fileSize} onChange={value => updateLocalizedArray('downloadItems', items.map((entry, i) => i === index ? { ...entry, fileSize: value } : entry))} /></div></div></div>)}<SmallButton onClick={() => updateLocalizedArray('downloadItems', [...items, { id: makeId('download'), title: 'Документ', url: '', description: '' }])}><Plus className="h-3 w-3" />Файл</SmallButton></div>;
  };

  const renderTabs = () => {
    const items = activeConfig.tabs || [];
    return <div className="space-y-3">{items.map((item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 p-3"><div className="mb-2 flex justify-between"><span className="text-[10px] font-black uppercase text-indigo-300">Вкладка {index + 1}</span><SmallButton danger onClick={() => updateLocalizedArray('tabs', items.filter((_, i) => i !== index))}><Trash2 className="h-3 w-3" />Удалить</SmallButton></div><div className="space-y-2"><TextField label="Название" value={item.title} onChange={value => updateLocalizedArray('tabs', items.map((entry, i) => i === index ? { ...entry, title: value } : entry))} /><TextField label="Содержимое" multiline value={item.content} onChange={value => updateLocalizedArray('tabs', items.map((entry, i) => i === index ? { ...entry, content: value } : entry))} /></div></div>)}<SmallButton onClick={() => updateLocalizedArray('tabs', [...items, { id: makeId('tab'), title: 'Новая вкладка', content: '' }])}><Plus className="h-3 w-3" />Вкладка</SmallButton></div>;
  };

  const renderTeam = () => {
    const items = activeConfig.teamItems || [];
    return <div className="space-y-3">{items.map((item, index) => <div key={item.id || index} className="rounded-2xl border border-slate-800 p-3"><div className="mb-2 flex justify-between"><span className="text-[10px] font-black uppercase text-indigo-300">Сотрудник {index + 1}</span><SmallButton danger onClick={() => updateLocalizedArray('teamItems', items.filter((_, i) => i !== index))}><Trash2 className="h-3 w-3" />Удалить</SmallButton></div><div className="space-y-2"><TextField label="Имя" value={item.name} onChange={value => updateLocalizedArray('teamItems', items.map((entry, i) => i === index ? { ...entry, name: value } : entry))} /><TextField label="Роль" value={item.role} onChange={value => updateLocalizedArray('teamItems', items.map((entry, i) => i === index ? { ...entry, role: value } : entry))} /><TextField label="Bio" multiline value={item.bio} onChange={value => updateLocalizedArray('teamItems', items.map((entry, i) => i === index ? { ...entry, bio: value } : entry))} /><TextField label="Фото URL" value={item.imageUrl} onChange={value => updateLocalizedArray('teamItems', items.map((entry, i) => i === index ? { ...entry, imageUrl: value } : entry))} /><TextField label="Ссылка" value={item.link} onChange={value => updateLocalizedArray('teamItems', items.map((entry, i) => i === index ? { ...entry, link: value } : entry))} /></div></div>)}<SmallButton onClick={() => updateLocalizedArray('teamItems', [...items, { id: makeId('team'), name: 'Имя', role: '', bio: '', imageUrl: '', link: '' }])}><Plus className="h-3 w-3" />Сотрудник</SmallButton></div>;
  };

  const renderTable = () => {
    const columns = activeConfig.tableColumns || [];
    const rows = activeConfig.tableRows || [];
    return <div className="space-y-3"><div className="space-y-2">{columns.map((column, index) => <div key={index} className="flex gap-2"><input value={column} onChange={event => { const next = [...columns]; next[index] = event.target.value; updateLocalizedArray('tableColumns', next); }} className={fieldClass()} /><SmallButton danger onClick={() => { const nextColumns = columns.filter((_, i) => i !== index); const nextRows = rows.map(row => ({ ...row, cells: row.cells.filter((_, i) => i !== index) })); updateLocalizedArray('tableColumns', nextColumns); updateLocalizedArray('tableRows', nextRows); }}><Trash2 className="h-3 w-3" /></SmallButton></div>)}<SmallButton onClick={() => { updateLocalizedArray('tableColumns', [...columns, `Колонка ${columns.length + 1}`]); updateLocalizedArray('tableRows', rows.map(row => ({ ...row, cells: [...row.cells, ''] }))); }}><Plus className="h-3 w-3" />Колонка</SmallButton></div>{rows.map((row, rowIndex) => <div key={row.id || rowIndex} className="rounded-2xl border border-slate-800 p-3"><div className="mb-2 flex justify-between"><span className="text-[10px] font-black uppercase text-indigo-300">Строка {rowIndex + 1}</span><SmallButton danger onClick={() => updateLocalizedArray('tableRows', rows.filter((_, i) => i !== rowIndex))}><Trash2 className="h-3 w-3" />Удалить</SmallButton></div><div className="grid gap-2">{columns.map((column, cellIndex) => <label key={cellIndex}><Label>{column || `Колонка ${cellIndex + 1}`}</Label><input value={row.cells[cellIndex] || ''} onChange={event => updateLocalizedArray('tableRows', rows.map((entry, i) => i === rowIndex ? { ...entry, cells: columns.map((_, ci) => ci === cellIndex ? event.target.value : entry.cells[ci] || '') } : entry))} className={fieldClass()} /></label>)}</div></div>)}<SmallButton onClick={() => updateLocalizedArray('tableRows', [...rows, { id: makeId('row'), cells: columns.map(() => '') }])}><Plus className="h-3 w-3" />Строка</SmallButton></div>;
  };

  const renderGallery = () => {
    const images = draft.config.galleryImages || [];
    return <div className="space-y-3">{images.map((image, index) => <div key={image.id || index} className="rounded-2xl border border-slate-800 p-3"><div className="mb-2 flex justify-between"><span className="text-[10px] font-black uppercase text-indigo-300">Фото {index + 1}</span><SmallButton danger onClick={() => patchCommon({ galleryImages: images.filter((_, i) => i !== index) })}><Trash2 className="h-3 w-3" />Удалить</SmallButton></div><div className="space-y-2"><TextField label="URL" value={image.url} onChange={value => patchGalleryImage(index, { url: value })} /><TextField label="Alt" value={String(image[imageTextKey('alt')] || '')} onChange={value => patchGalleryImage(index, { [imageTextKey('alt')]: value } as Partial<PageBuilderImage>)} /><TextField label="Подпись" value={String(image[imageTextKey('caption')] || '')} onChange={value => patchGalleryImage(index, { [imageTextKey('caption')]: value } as Partial<PageBuilderImage>)} /></div></div>)}<SmallButton onClick={() => setMediaTarget('gallery')}><ImageIcon className="h-3 w-3" />Добавить из медиатеки</SmallButton></div>;
  };

  const kindEditor = () => {
    if (['features_grid', 'stats_counter', 'process', 'pricing'].includes(String(kind))) return renderGenericItems();
    if (kind === 'faq') return renderFaq();
    if (kind === 'timeline') return renderTimeline();
    if (kind === 'downloads') return renderDownloads();
    if (kind === 'tabs') return renderTabs();
    if (kind === 'table') return renderTable();
    if (kind === 'team') return renderTeam();
    if (kind === 'gallery') return renderGallery();
    if (kind === 'partners') {
      const names = activeConfig.partnerNames || [];
      return <div className="space-y-2">{names.map((name, index) => <div key={index} className="flex gap-2"><input value={name} onChange={event => { const next = [...names]; next[index] = event.target.value; updateLocalizedArray('partnerNames', next); }} className={fieldClass()} /><SmallButton danger onClick={() => updateLocalizedArray('partnerNames', names.filter((_, i) => i !== index))}><Trash2 className="h-3 w-3" /></SmallButton></div>)}<SmallButton onClick={() => updateLocalizedArray('partnerNames', [...names, 'Новый партнёр'])}><Plus className="h-3 w-3" />Партнёр</SmallButton></div>;
    }
    return null;
  };

  return <>
    <aside data-cms-inspector-ui className="fixed inset-y-0 right-0 z-[2147483400] w-[min(560px,100vw)] overflow-y-auto border-l border-slate-700 bg-slate-950 p-5 text-white shadow-2xl">
      <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-400">CMS 4.5 · Inline Editor</div><h2 className="mt-1 text-xl font-black">{definition?.label || String(kind)}</h2><div className="mt-1 font-mono text-[9px] text-slate-500">{draft.id}</div></div><button type="button" onClick={onClose} className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:text-white"><X className="h-4 w-4" /></button></div>

      <div className="mt-4 flex gap-1 rounded-xl bg-slate-900 p-1">{LANGS.map(item => <button key={item.id} type="button" onClick={() => setLanguage(item.id)} className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-black ${language === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{item.label}</button>)}</div>

      {message && <div className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">{message}</div>}
      {error && <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">{error}</div>}

      <div className="mt-5 space-y-5">
        <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Контент · {language.toUpperCase()}</div><TextField label="Внутреннее название" value={internalTitle} onChange={setInternalTitle} /><TextField label="Badge" value={activeConfig.badge} onChange={value => patchLocalized({ badge: value })} /><TextField label="Заголовок" value={activeConfig.heading} onChange={value => patchLocalized({ heading: value })} /><TextField label="Подзаголовок" multiline value={activeConfig.subheading} onChange={value => patchLocalized({ subheading: value })} />{(['text_image', 'rich_text'].includes(String(kind)) || activeConfig.content !== undefined) && <TextField label="Текст" multiline value={activeConfig.content} onChange={value => patchLocalized({ content: value })} />}</section>

        <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Разметка · общая</div><div className="grid grid-cols-2 gap-2"><label><Label>Ширина</Label><select value={draft.config.width || 'normal'} onChange={event => patchCommon({ width: event.target.value as Config['width'] })} className={fieldClass()}><option value="narrow">Narrow</option><option value="normal">Normal</option><option value="wide">Wide</option><option value="full">Full</option></select></label><label><Label>Отступы</Label><select value={draft.config.spacing || 'normal'} onChange={event => patchCommon({ spacing: event.target.value as Config['spacing'] })} className={fieldClass()}><option value="compact">Compact</option><option value="normal">Normal</option><option value="large">Large</option></select></label><label><Label>Выравнивание</Label><select value={draft.config.alignment || 'left'} onChange={event => patchCommon({ alignment: event.target.value as Config['alignment'] })} className={fieldClass()}><option value="left">Left</option><option value="center">Center</option></select></label><label><Label>Стиль</Label><select value={draft.config.style || 'light'} onChange={event => patchCommon({ style: event.target.value as Config['style'] })} className={fieldClass()}><option value="light">Light</option><option value="dark">Dark</option><option value="indigo">Indigo</option><option value="gradient">Gradient</option></select></label></div><TextField label="Anchor / ID" value={draft.config.anchor} onChange={value => patchCommon({ anchor: value })} /></section>

        {(activeConfig.buttonText !== undefined || ['cta', 'contact'].includes(String(kind))) && <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Кнопки</div><div className="grid gap-2 sm:grid-cols-2"><TextField label="Основная кнопка" value={activeConfig.buttonText} onChange={value => patchLocalized({ buttonText: value })} /><TextField label="Ссылка" value={draft.config.buttonLink} onChange={value => patchCommon({ buttonLink: value })} /><TextField label="Вторая кнопка" value={activeConfig.secondaryButtonText} onChange={value => patchLocalized({ secondaryButtonText: value })} /><TextField label="Ссылка 2" value={draft.config.secondaryButtonLink} onChange={value => patchCommon({ secondaryButtonLink: value })} /></div></section>}

        {(kind === 'image' || kind === 'text_image' || activeConfig.imageUrl !== undefined) && <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><div className="flex items-center justify-between"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Изображение</div><SmallButton onClick={() => setMediaTarget('image')}><ImageIcon className="h-3 w-3" />Медиатека</SmallButton></div><TextField label="URL" value={draft.config.imageUrl} onChange={value => patchCommon({ imageUrl: value })} /><TextField label="Alt" value={activeConfig.imageAlt} onChange={value => patchLocalized({ imageAlt: value })} /><TextField label="Подпись" value={activeConfig.imageCaption} onChange={value => patchLocalized({ imageCaption: value })} />{kind === 'text_image' && <label><Label>Позиция</Label><select value={draft.config.imagePosition || 'right'} onChange={event => patchCommon({ imagePosition: event.target.value as Config['imagePosition'] })} className={fieldClass()}><option value="left">Слева</option><option value="right">Справа</option></select></label>}</section>}

        {kind === 'video_embed' && <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><div className="flex items-center justify-between"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Видео</div><SmallButton onClick={() => setMediaTarget('video')}><ImageIcon className="h-3 w-3" />Медиатека</SmallButton></div><TextField label="Video URL / YouTube / Vimeo" value={draft.config.videoUrl} onChange={value => patchCommon({ videoUrl: value })} /><TextField label="Подпись" value={activeConfig.videoCaption} onChange={value => patchLocalized({ videoCaption: value })} /></section>}

        {kind === 'quote' && <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Цитата</div><TextField label="Текст" multiline value={activeConfig.quoteText} onChange={value => patchLocalized({ quoteText: value })} /><TextField label="Автор" value={activeConfig.quoteAuthor} onChange={value => patchLocalized({ quoteAuthor: value })} /><TextField label="Должность" value={activeConfig.quoteRole} onChange={value => patchLocalized({ quoteRole: value })} /></section>}

        {kind === 'contact' && <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Контакты</div><TextField label="Примечание" multiline value={activeConfig.contactNote} onChange={value => patchLocalized({ contactNote: value })} /><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={draft.config.contactShowPhone !== false} onChange={event => patchCommon({ contactShowPhone: event.target.checked })} />Телефон</label><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={draft.config.contactShowEmail !== false} onChange={event => patchCommon({ contactShowEmail: event.target.checked })} />Email</label></section>}

        {kind === 'timeline' && <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><label><Label>Ориентация</Label><select value={draft.config.timelineOrientation || 'vertical'} onChange={event => patchCommon({ timelineOrientation: event.target.value as Config['timelineOrientation'] })} className={fieldClass()}><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select></label>{renderTimeline()}</section>}
        {kind === 'downloads' && <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><label><Label>Вид</Label><select value={draft.config.downloadLayout || 'list'} onChange={event => patchCommon({ downloadLayout: event.target.value as Config['downloadLayout'] })} className={fieldClass()}><option value="list">Список</option><option value="cards">Карточки</option></select></label>{renderDownloads()}</section>}
        {kind === 'team' && <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><label><Label>Колонки</Label><select value={draft.config.teamColumns || 3} onChange={event => patchCommon({ teamColumns: Number(event.target.value) as Config['teamColumns'] })} className={fieldClass()}><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label>{renderTeam()}</section>}
        {kind === 'table' && <section className="space-y-3 rounded-2xl border border-slate-800 p-4"><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={draft.config.tableStriped !== false} onChange={event => patchCommon({ tableStriped: event.target.checked })} />Чередовать строки</label>{renderTable()}</section>}
        {kind === 'tabs' && <section className="space-y-3 rounded-2xl border border-slate-800 p-4">{renderTabs()}</section>}
        {kind === 'gallery' && <section className="space-y-3 rounded-2xl border border-slate-800 p-4">{renderGallery()}</section>}
        {!['timeline', 'downloads', 'team', 'table', 'tabs', 'gallery'].includes(String(kind)) && kindEditor() && <section className="rounded-2xl border border-slate-800 p-4">{kindEditor()}</section>}

        {kind === 'rich_text' && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">Форматированный Rich Text сохраняет структуру документа. В Inline Editor можно менять заголовок/подзаголовок и fallback-текст; для сложного форматирования остаётся полный редактор в Page Builder.</div>}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-6 flex items-center gap-2 border-t border-slate-800 bg-slate-950/95 px-5 py-4 backdrop-blur"><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Сохранение…' : 'Сохранить Draft'}</button><button type="button" onClick={onClose} className="rounded-xl bg-slate-800 px-4 py-3 text-xs font-black text-slate-300">Закрыть</button></div>
    </aside>

    {mediaTarget === 'image' && <MediaLibraryPicker type="image" onClose={() => setMediaTarget(null)} onSelect={asset => { patchCommon({ imageUrl: asset.url }); setMediaTarget(null); }} />}
    {mediaTarget === 'video' && <MediaLibraryPicker type="video" onClose={() => setMediaTarget(null)} onSelect={asset => { patchCommon({ videoUrl: asset.url }); setMediaTarget(null); }} />}
    {mediaTarget === 'gallery' && <MediaLibraryPicker type="image" multiple onClose={() => setMediaTarget(null)} onSelectMany={assets => { const existing = draft.config.galleryImages || []; const seen = new Set(existing.map(image => image.url)); const additions: PageBuilderImage[] = assets.filter(asset => !seen.has(asset.url)).map(asset => ({ id: makeId('gallery-image'), url: asset.url, cloudinaryPublicId: asset.publicId, alt: asset.name, alt_uk: asset.name, alt_en: asset.name })); patchCommon({ galleryImages: [...existing, ...additions] }); setMediaTarget(null); }} />}
  </>;
}
