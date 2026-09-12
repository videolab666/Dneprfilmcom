import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Edit3, FileText, Plus, Save, Trash2, X } from 'lucide-react';
import { DEFAULT_PAGE_COPY_CONTENT, PageCopyContent } from '../../data/pageCopyContent';
import { PageContentItem, PageContentLocale, PageItemText, clonePageContent } from '../../data/pageContent';
import { usePageCopyContent } from '../../hooks/usePageCopyContent';
import { useSiteContent } from '../../context/SiteContentContext';

type PageKey = keyof PageCopyContent;
type LangKey = PageContentLocale;

interface SectionConfig {
  key: string;
  label: string;
  singular: string;
  allowAdd?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
  showMeta1?: boolean;
  meta1Label?: string;
  showMeta2?: boolean;
  meta2Label?: string;
  showMeta3?: boolean;
  meta3Label?: string;
  showItems?: boolean;
  itemsLabel?: string;
  showIcon?: boolean;
}

const CONFIG: Record<PageKey, SectionConfig[]> = {
  video: [
    { key: 'hero', label: 'Hero / первый экран', singular: 'hero', showBadge: true, showMeta1: true, meta1Label: 'Акцентная часть H1', showMeta2: true, meta2Label: 'Окончание H1', showMeta3: true, meta3Label: 'Текст CTA', showItems: true, itemsLabel: 'Метрики: значение|подпись' },
    { key: 'headings', label: 'Заголовки секций', singular: 'заголовок', allowAdd: true, showBadge: true },
    { key: 'faqs', label: 'FAQ', singular: 'вопрос', allowAdd: true },
  ],
  construction: [
    { key: 'hero', label: 'Hero / первый экран', singular: 'hero', showBadge: true, showMeta1: true, meta1Label: 'Акцентная часть H1', showItems: true, itemsLabel: 'Преимущества — по одному на строку' },
    { key: 'headings', label: 'Заголовки секций', singular: 'заголовок', allowAdd: true, showBadge: true },
    { key: 'solutions', label: 'Решения / услуги', singular: 'решение', allowAdd: true, showSubtitle: true, showBadge: true, showItems: true, itemsLabel: 'Преимущества — по одному на строку', showIcon: true },
    { key: 'workflow', label: 'Этапы запуска', singular: 'этап', allowAdd: true, showBadge: true },
    { key: 'faqs', label: 'FAQ', singular: 'вопрос', allowAdd: true },
  ],
  photo: [
    { key: 'hero', label: 'Hero / первый экран', singular: 'hero', showBadge: true, showMeta1: true, meta1Label: 'Кнопка галереи', showMeta2: true, meta2Label: 'Кнопка расчёта', showItems: true, itemsLabel: 'Преимущества — по одному на строку' },
    { key: 'headings', label: 'Заголовки секций', singular: 'заголовок', allowAdd: true, showBadge: true },
  ],
  about: [
    { key: 'headings', label: 'Заголовки секций', singular: 'заголовок', allowAdd: true, showBadge: true },
  ],
};

const PAGE_LABELS: Record<PageKey, string> = { video: 'Video', construction: 'Construction', photo: 'Photo', about: 'About' };
const LANGS: { key: LangKey; label: string }[] = [{ key: 'uk', label: 'UA' }, { key: 'ru', label: 'RU' }, { key: 'en', label: 'EN' }];

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getSection(content: PageCopyContent, page: PageKey, section: string): PageContentItem[] {
  return (((content as any)[page] || {})[section] || []) as PageContentItem[];
}

function setSection(content: PageCopyContent, page: PageKey, section: string, value: PageContentItem[]): PageCopyContent {
  return { ...content, [page]: { ...(content as any)[page], [section]: value } } as PageCopyContent;
}

function emptyText(): PageItemText {
  return { title: '', subtitle: '', description: '', meta1: '', meta2: '', meta3: '', badge: '', items: [] };
}

export function PageCopyManager() {
  const { content } = usePageCopyContent();
  const { updateSettings } = useSiteContent();
  const [draft, setDraft] = useState<PageCopyContent>(() => deepClone(content));
  const [page, setPage] = useState<PageKey>('video');
  const [sectionKey, setSectionKey] = useState(CONFIG.video[0].key);
  const [editing, setEditing] = useState<PageContentItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lang, setLang] = useState<LangKey>('uk');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(deepClone(content));
  }, [content, dirty]);

  const config = CONFIG[page];
  const section = config.find(item => item.key === sectionKey) || config[0];
  const rows = useMemo(() => [...getSection(draft, page, section.key)].sort((a, b) => (a.order || 0) - (b.order || 0)), [draft, page, section.key]);

  const switchPage = (next: PageKey) => {
    setPage(next);
    setSectionKey(CONFIG[next][0].key);
  };

  const startAdd = () => {
    const order = rows.length ? Math.max(...rows.map(row => row.order || 0)) + 10 : 10;
    setEditing({ id: `${page}-${section.key}-${Date.now()}`, order, ru: emptyText(), uk: emptyText(), en: emptyText() });
    setEditingId(null);
    setLang('uk');
  };

  const startEdit = (item: PageContentItem) => {
    setEditing(deepClone(item));
    setEditingId(item.id);
    setLang('uk');
  };

  const applyEdit = () => {
    if (!editing) return;
    const current = [...getSection(draft, page, section.key)];
    if (editingId === null) current.push(editing);
    else {
      const index = current.findIndex(item => item.id === editingId);
      if (index >= 0) current[index] = editing;
    }
    setDraft(setSection(draft, page, section.key, current));
    setDirty(true);
    setEditing(null);
    setEditingId(null);
  };

  const remove = (id: string) => {
    if (!window.confirm('Удалить этот элемент?')) return;
    setDraft(setSection(draft, page, section.key, getSection(draft, page, section.key).filter(item => item.id !== id)));
    setDirty(true);
  };

  const move = (id: string, direction: -1 | 1) => {
    const ordered = [...rows];
    const index = ordered.findIndex(item => item.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;
    [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
    setDraft(setSection(draft, page, section.key, ordered.map((item, idx) => ({ ...item, order: (idx + 1) * 10 }))));
    setDirty(true);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await updateSettings({ pageCopyContent: draft } as any);
      setDirty(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    if (!window.confirm('Вернуть тексты этой CMS к встроенным значениям? Несохранённые изменения будут потеряны.')) return;
    setDraft(deepClone(DEFAULT_PAGE_COPY_CONTENT));
    setDirty(true);
  };

  const text = editing ? (editing[lang] || emptyText()) : emptyText();
  const setText = (field: keyof PageItemText, value: string | string[]) => {
    if (!editing) return;
    setEditing({ ...editing, [lang]: { ...(editing[lang] || emptyText()), [field]: value } });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 mb-2"><FileText className="w-4 h-4" /> Page Copy CMS</div>
          <h2 className="text-2xl font-black text-slate-900">Тексты, FAQ и сервисные блоки</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">Первый экран, вопросы-ответы, заголовки разделов и технические решения. RU/UA/EN хранятся в Firestore и используются теми же публичными страницами.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={resetDefaults} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-50">Встроенные значения</button>
          <button onClick={saveAll} disabled={!dirty || saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> {saving ? 'Сохранение…' : saved ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 flex gap-2 overflow-x-auto border-b border-slate-200">
          {(Object.keys(CONFIG) as PageKey[]).map(key => <button key={key} onClick={() => switchPage(key)} className={`px-4 py-2.5 rounded-xl text-sm font-black whitespace-nowrap ${page === key ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{PAGE_LABELS[key]}</button>)}
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex gap-2 overflow-x-auto">
              {config.map(item => <button key={item.key} onClick={() => setSectionKey(item.key)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${section.key === item.key ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>{item.label}</button>)}
            </div>
            {section.allowAdd && <button onClick={startAdd} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"><Plus className="w-4 h-4" /> Добавить {section.singular}</button>}
          </div>

          <div className="space-y-3">
            {rows.map((item, index) => <div key={item.id} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-indigo-200">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-slate-400">#{index + 1} · {item.id}</div>
                <div className="font-bold text-slate-900 truncate">{item.uk?.title || item.ru?.title || item.uk?.badge || item.ru?.badge || item.id}</div>
                {(item.uk?.description || item.ru?.description) && <div className="text-xs text-slate-500 truncate mt-1">{item.uk?.description || item.ru?.description}</div>}
              </div>
              <div className="flex gap-1 shrink-0">
                {rows.length > 1 && <><button onClick={() => move(item.id, -1)} disabled={index === 0} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button><button onClick={() => move(item.id, 1)} disabled={index === rows.length - 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button></>}
                <button onClick={() => startEdit(item)} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"><Edit3 className="w-4 h-4" /></button>
                {section.allowAdd && <button onClick={() => remove(item.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>)}
          </div>
        </div>
      </div>

      {editing && <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto my-6 bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-wider text-indigo-600">{PAGE_LABELS[page]} / {section.label}</div><h3 className="text-xl font-black">Редактирование</h3></div><button onClick={() => setEditing(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
          <div className="p-5 sm:p-7 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="text-sm font-semibold">ID<input value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" /></label><label className="text-sm font-semibold">Порядок<input type="number" value={editing.order} onChange={e => setEditing({ ...editing, order: Number(e.target.value) })} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" /></label></div>
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">{LANGS.map(item => <button key={item.key} onClick={() => setLang(item.key)} className={`px-4 py-2 rounded-lg text-xs font-black ${lang === item.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{item.label}</button>)}</div>
            <label className="block text-sm font-semibold">Название / вопрос / начало H1<input value={text.title || ''} onChange={e => setText('title', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" /></label>
            {section.showSubtitle && <label className="block text-sm font-semibold">Подзаголовок<input value={text.subtitle || ''} onChange={e => setText('subtitle', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" /></label>}
            {section.showBadge && <label className="block text-sm font-semibold">Badge / номер / надзаголовок<input value={text.badge || ''} onChange={e => setText('badge', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" /></label>}
            {section.showMeta1 && <label className="block text-sm font-semibold">{section.meta1Label}<input value={text.meta1 || ''} onChange={e => setText('meta1', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" /></label>}
            {section.showMeta2 && <label className="block text-sm font-semibold">{section.meta2Label}<input value={text.meta2 || ''} onChange={e => setText('meta2', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" /></label>}
            {section.showMeta3 && <label className="block text-sm font-semibold">{section.meta3Label}<input value={text.meta3 || ''} onChange={e => setText('meta3', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" /></label>}
            <label className="block text-sm font-semibold">Описание / ответ<textarea rows={5} value={text.description || ''} onChange={e => setText('description', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal resize-y" /></label>
            {section.showItems && <label className="block text-sm font-semibold">{section.itemsLabel}<textarea rows={6} value={(text.items || []).join('\n')} onChange={e => setText('items', e.target.value.split('\n').map(value => value.trim()).filter(Boolean))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal resize-y" /></label>}
            {section.showIcon && <label className="block text-sm font-semibold">Иконка<select value={editing.iconKey || 'camera'} onChange={e => setEditing({ ...editing, iconKey: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-normal"><option value="camera">Камера</option><option value="compass">GPS / дрон</option><option value="eye">Панорама</option><option value="file">Отчёт</option><option value="video">Видео</option><option value="radio">Трансляция</option></select></label>}
          </div>
          <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3"><button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600">Отмена</button><button onClick={applyEdit} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700">Применить</button></div>
        </div>
      </div>}
    </div>
  );
}
