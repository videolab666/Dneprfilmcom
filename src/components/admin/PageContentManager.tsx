import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Camera,
  Edit3,
  Library,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { clonePageContent, PageContent, PageContentItem, PageContentLocale, PageItemText } from '../../data/pageContent';
import { usePageCmsContent } from '../../hooks/usePageCmsContent';
import { useSiteContent } from '../../context/SiteContentContext';
import { uploadLibraryImage } from '../../lib/mediaUpload';
import { registerMediaAsset, type MediaLibraryAsset } from '../../lib/mediaLibrary';
import { MediaLibraryPicker } from './MediaLibraryPicker';

type PageKey = keyof PageContent;
type LangKey = PageContentLocale;

type SectionConfig = {
  key: string;
  label: string;
  singular: string;
  meta1?: string;
  meta2?: string;
  meta3?: string;
  showImage?: boolean;
  showCategory?: boolean;
  showAspect?: boolean;
  showIcon?: boolean;
  showHighlight?: boolean;
  showSubtitle?: boolean;
  showBadge?: boolean;
  showResult?: boolean;
  showItems?: boolean;
};

const PAGE_CONFIG: Record<PageKey, { label: string; icon: React.ReactNode; sections: SectionConfig[] }> = {
  video: {
    label: 'Video',
    icon: <Video className="w-4 h-4" />,
    sections: [
      { key: 'works', label: 'Работы / портфолио', singular: 'видеоработу', meta1: 'Клиент', meta2: 'Категория', showImage: true, showIcon: true, showResult: true, showItems: true },
      { key: 'steps', label: 'Этапы производства', singular: 'этап', showSubtitle: true, showBadge: true },
    ],
  },
  construction: {
    label: 'Construction',
    icon: <Building2 className="w-4 h-4" />,
    sections: [
      { key: 'works', label: 'Проекты мониторинга', singular: 'строительный проект', meta1: 'Тип объекта', meta2: 'Клиент', meta3: 'Срок', showImage: true, showResult: true, showItems: true },
    ],
  },
  photo: {
    label: 'Photo',
    icon: <Camera className="w-4 h-4" />,
    sections: [
      { key: 'gallery', label: 'Галерея', singular: 'фотографию', meta1: 'Название категории', meta2: 'Локация', meta3: 'Клиент', showImage: true, showCategory: true, showAspect: true, showBadge: true },
      { key: 'packages', label: 'Пакеты / цены', singular: 'пакет', meta1: 'Цена', meta2: 'Период / единица', showSubtitle: true, showBadge: true, showHighlight: true, showItems: true },
    ],
  },
  about: {
    label: 'About',
    icon: <UserRound className="w-4 h-4" />,
    sections: [
      { key: 'milestones', label: 'История / этапы', singular: 'этап истории', showBadge: true },
      { key: 'principles', label: 'Принципы', singular: 'принцип' },
    ],
  },
};

const LANGS: { key: LangKey; label: string }[] = [
  { key: 'uk', label: 'UA' },
  { key: 'ru', label: 'RU' },
  { key: 'en', label: 'EN' },
];

function getItems(content: PageContent, page: PageKey, section: string): PageContentItem[] {
  return (((content as any)[page] as any)?.[section] || []) as PageContentItem[];
}

function replaceItems(content: PageContent, page: PageKey, section: string, items: PageContentItem[]): PageContent {
  return {
    ...content,
    [page]: {
      ...(content as any)[page],
      [section]: items,
    },
  } as PageContent;
}

function blankText(): PageItemText {
  return { title: '', subtitle: '', description: '', meta1: '', meta2: '', meta3: '', badge: '', result: '', items: [] };
}

function newItem(page: PageKey, section: string, order: number): PageContentItem {
  return {
    id: `${page}-${section}-${Date.now()}`,
    order,
    ru: blankText(),
    uk: blankText(),
    en: blankText(),
    imageUrl: '',
  };
}

export function PageContentManager() {
  const { content } = usePageCmsContent();
  const { updateSettings } = useSiteContent();
  const [draft, setDraft] = useState<PageContent>(() => clonePageContent(content));
  const [page, setPage] = useState<PageKey>('video');
  const [section, setSection] = useState('works');
  const [editing, setEditing] = useState<PageContentItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [lang, setLang] = useState<LangKey>('uk');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dirty) setDraft(clonePageContent(content));
  }, [content, dirty]);

  const pageConfig = PAGE_CONFIG[page];
  const sectionConfig = pageConfig.sections.find(item => item.key === section) || pageConfig.sections[0];
  const items = useMemo(
    () => [...getItems(draft, page, sectionConfig.key)].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [draft, page, sectionConfig.key]
  );

  const switchPage = (nextPage: PageKey) => {
    setPage(nextPage);
    setSection(PAGE_CONFIG[nextPage].sections[0].key);
  };

  const startEdit = (item: PageContentItem) => {
    const originalItems = getItems(draft, page, sectionConfig.key);
    setEditingIndex(originalItems.findIndex(current => current.id === item.id));
    setEditing(JSON.parse(JSON.stringify(item)) as PageContentItem);
    setLang('uk');
    setImageError('');
    setLibraryPickerOpen(false);
  };

  const startAdd = () => {
    const current = getItems(draft, page, sectionConfig.key);
    const nextOrder = current.length ? Math.max(...current.map(item => item.order || 0)) + 10 : 10;
    setEditingIndex(null);
    setEditing(newItem(page, sectionConfig.key, nextOrder));
    setLang('uk');
    setImageError('');
    setLibraryPickerOpen(false);
  };

  const closeEditor = () => {
    setEditing(null);
    setEditingIndex(null);
    setLibraryPickerOpen(false);
    setImageError('');
  };

  const saveModal = () => {
    if (!editing) return;
    const current = [...getItems(draft, page, sectionConfig.key)];
    if (editingIndex === null) current.push(editing);
    else current[editingIndex] = editing;
    setDraft(replaceItems(draft, page, sectionConfig.key, current));
    setDirty(true);
    closeEditor();
  };

  const removeItem = (id: string) => {
    if (!window.confirm('Удалить этот элемент со страницы?')) return;
    const next = getItems(draft, page, sectionConfig.key).filter(item => item.id !== id);
    setDraft(replaceItems(draft, page, sectionConfig.key, next));
    setDirty(true);
  };

  const moveItem = (id: string, direction: -1 | 1) => {
    const ordered = [...items];
    const index = ordered.findIndex(item => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const normalized = ordered.map((item, idx) => ({ ...item, order: (idx + 1) * 10 }));
    setDraft(replaceItems(draft, page, sectionConfig.key, normalized));
    setDirty(true);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await updateSettings({ pageContent: draft } as any);
      setDirty(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const setCommon = <K extends keyof PageContentItem>(key: K, value: PageContentItem[K]) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  };

  const setText = (field: keyof PageItemText, value: string | string[]) => {
    if (!editing) return;
    const current = editing[lang] || blankText();
    setEditing({ ...editing, [lang]: { ...current, [field]: value } });
  };

  const uploadImage = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !editing) return;
    setUploadingImage(true);
    setImageError('');
    try {
      const uploaded = await uploadLibraryImage(file);
      await registerMediaAsset(uploaded, file.name);
      setEditing(current => current ? { ...current, imageUrl: uploaded.url } : current);
    } catch (error) {
      console.error(error);
      setImageError(error instanceof Error ? error.message : String(error));
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const chooseImageFromLibrary = (asset: MediaLibraryAsset) => {
    if (asset.assetType !== 'image') return;
    setEditing(current => current ? { ...current, imageUrl: asset.url } : current);
    setLibraryPickerOpen(false);
    setImageError('');
  };

  const text = editing ? (editing[lang] || blankText()) : blankText();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Page CMS</div>
          <h2 className="text-2xl font-black text-slate-900">Контент внутренних страниц</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">Портфолио Video и Construction, фотогалерея и тарифы, история и принципы About. Изменения сохраняются в Firestore и сразу используются публичными страницами.</p>
        </div>
        <button onClick={saveAll} disabled={!dirty || saving} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-40 hover:bg-indigo-700 transition-colors">
          <Save className="w-4 h-4" />
          {saving ? 'Сохранение…' : saved ? 'Сохранено' : dirty ? 'Сохранить изменения' : 'Нет изменений'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex gap-2 overflow-x-auto">
          {(Object.keys(PAGE_CONFIG) as PageKey[]).map(key => (
            <button key={key} onClick={() => switchPage(key)} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap ${page === key ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              {PAGE_CONFIG[key].icon}{PAGE_CONFIG[key].label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex gap-2 overflow-x-auto">
              {pageConfig.sections.map(item => (
                <button key={item.key} onClick={() => setSection(item.key)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${sectionConfig.key === item.key ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 border border-transparent hover:bg-slate-50'}`}>{item.label}</button>
              ))}
            </div>
            <button onClick={startAdd} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Добавить {sectionConfig.singular}
            </button>
          </div>

          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">В этом разделе пока нет элементов.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const preview = item.uk?.title || item.ru?.title || item.id;
                const sub = item.uk?.meta1 || item.ru?.meta1 || item.uk?.subtitle || item.ru?.subtitle;
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors">
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="w-20 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-400 mb-0.5">#{index + 1} · {item.id}</div>
                      <div className="font-bold text-slate-900 truncate">{preview}</div>
                      {sub && <div className="text-xs text-slate-500 truncate mt-0.5">{sub}</div>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveItem(item.id, -1)} disabled={index === 0} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-25"><ArrowUp className="w-4 h-4" /></button>
                      <button onClick={() => moveItem(item.id, 1)} disabled={index === items.length - 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-25"><ArrowDown className="w-4 h-4" /></button>
                      <button onClick={() => startEdit(item)} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => removeItem(item.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto my-6 bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-indigo-600 font-black uppercase tracking-wider">{pageConfig.label} / {sectionConfig.label}</div>
                <h3 className="text-xl font-black text-slate-900">{editingIndex === null ? 'Новый элемент' : 'Редактирование'}</h3>
              </div>
              <button onClick={closeEditor} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 sm:p-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="text-sm font-semibold text-slate-700">ID
                  <input value={editing.id} onChange={e => setCommon('id', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" />
                </label>
                <label className="text-sm font-semibold text-slate-700">Порядок
                  <input type="number" value={editing.order} onChange={e => setCommon('order', Number(e.target.value))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" />
                </label>
              </div>

              {sectionConfig.showImage && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700">URL изображения
                    <input value={editing.imageUrl || ''} onChange={e => setCommon('imageUrl', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" placeholder="Можно вставить URL вручную или загрузить фото ниже" />
                  </label>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={event => void uploadImage(event.target.files)}
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadingImage ? 'Загрузка…' : 'Загрузить фото'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLibraryPickerOpen(true)}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Library className="w-4 h-4" />
                      Из медиатеки
                    </button>
                    {editing.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setCommon('imageUrl', '')}
                        disabled={uploadingImage}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Убрать фото
                      </button>
                    )}
                  </div>

                  {imageError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{imageError}</div>}

                  {editing.imageUrl && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <img src={editing.imageUrl} alt="Предпросмотр" className="max-h-64 w-full object-contain" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
                {LANGS.map(item => <button key={item.key} type="button" onClick={() => setLang(item.key)} className={`px-4 py-2 rounded-lg text-xs font-black ${lang === item.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>{item.label}</button>)}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Название
                  <input value={text.title || ''} onChange={e => setText('title', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" />
                </label>
                {sectionConfig.showSubtitle && <label className="block text-sm font-semibold text-slate-700">Подзаголовок
                  <input value={text.subtitle || ''} onChange={e => setText('subtitle', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" />
                </label>}
                {sectionConfig.meta1 && <label className="block text-sm font-semibold text-slate-700">{sectionConfig.meta1}
                  <input value={text.meta1 || ''} onChange={e => setText('meta1', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" />
                </label>}
                {sectionConfig.meta2 && <label className="block text-sm font-semibold text-slate-700">{sectionConfig.meta2}
                  <input value={text.meta2 || ''} onChange={e => setText('meta2', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" />
                </label>}
                {sectionConfig.meta3 && <label className="block text-sm font-semibold text-slate-700">{sectionConfig.meta3}
                  <input value={text.meta3 || ''} onChange={e => setText('meta3', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" />
                </label>}
                {sectionConfig.showBadge && <label className="block text-sm font-semibold text-slate-700">Метка / badge
                  <input value={text.badge || ''} onChange={e => setText('badge', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal" />
                </label>}
                <label className="block text-sm font-semibold text-slate-700">Описание
                  <textarea rows={4} value={text.description || ''} onChange={e => setText('description', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal resize-y" />
                </label>
                {sectionConfig.showResult && <label className="block text-sm font-semibold text-slate-700">Результат
                  <textarea rows={2} value={text.result || ''} onChange={e => setText('result', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal resize-y" />
                </label>}
                {sectionConfig.showItems && <label className="block text-sm font-semibold text-slate-700">Список — один пункт на строку
                  <textarea rows={5} value={(text.items || []).join('\n')} onChange={e => setText('items', e.target.value.split('\n').map(v => v.trim()).filter(Boolean))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal resize-y" />
                </label>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sectionConfig.showIcon && <label className="text-sm font-semibold text-slate-700">Иконка
                  <select value={editing.iconKey || 'video'} onChange={e => setCommon('iconKey', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal bg-white">
                    <option value="flame">Огонь / продукт</option><option value="factory">Завод</option><option value="globe">Международный</option><option value="medical">Медицина</option><option value="award">Ивент</option><option value="fitness">Фитнес</option><option value="video">Видео</option>
                  </select>
                </label>}
                {sectionConfig.showCategory && <label className="text-sm font-semibold text-slate-700">Категория фильтра
                  <select value={editing.categoryKey || 'interior'} onChange={e => setCommon('categoryKey', e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal bg-white">
                    <option value="interior">Интерьер</option><option value="food">Food</option><option value="kids">Дети</option><option value="wedding">Свадьба</option><option value="corporate">Бизнес</option>
                  </select>
                </label>}
                {sectionConfig.showAspect && <label className="text-sm font-semibold text-slate-700">Формат карточки
                  <select value={editing.aspect || 'landscape'} onChange={e => setCommon('aspect', e.target.value as PageContentItem['aspect'])} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-300 font-normal bg-white">
                    <option value="landscape">Landscape</option><option value="portrait">Portrait</option><option value="square">Square</option>
                  </select>
                </label>}
                {sectionConfig.showHighlight && <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 mt-6">
                  <input type="checkbox" checked={Boolean(editing.highlight)} onChange={e => setCommon('highlight', e.target.checked)} className="w-4 h-4" /> Выделить пакет как рекомендуемый
                </label>}
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={closeEditor} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-600">Отмена</button>
              <button type="button" onClick={saveModal} disabled={uploadingImage} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">Применить</button>
            </div>
          </div>
        </div>
      )}

      {libraryPickerOpen && editing && (
        <MediaLibraryPicker
          type="image"
          title="Выбрать изображение"
          onClose={() => setLibraryPickerOpen(false)}
          onSelect={chooseImageFromLibrary}
        />
      )}
    </div>
  );
}
