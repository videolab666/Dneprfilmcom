import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { DEFAULT_CONTACTS_PAGE, normalizeContactsPage } from '../../lib/contactsContent';
import type {
  ContactCardContent,
  ContactLocationContent,
  ContactPageConfig,
  ContactPageLocaleContent,
  ContactPageSectionId,
  ContactRightPanelId,
  ContactWorkingHoursRow,
  Locale,
} from '../../types';

type EditorSection = 'layout' | 'hero' | 'cards' | 'form' | 'operations' | 'faq';
type ContactGlobalField = 'phone' | 'email' | 'telegram' | 'whatsapp';

const localeMeta: Record<Locale, { label: string; flag: string }> = {
  uk: { label: 'Українська', flag: '🇺🇦' },
  ru: { label: 'Русский', flag: '🇷🇺' },
  en: { label: 'English', flag: '🇬🇧' },
};

const sectionLabels: Record<ContactPageSectionId, string> = {
  hero: 'Hero',
  channels: 'Карточки связи',
  main: 'Форма + боковые панели',
  faq: 'FAQ',
};

const rightPanelLabels: Record<ContactRightPanelId, string> = {
  workingHours: 'Режим работы',
  locations: 'Локации',
  legal: 'Юридические гарантии',
};

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
const textareaClass = `${inputClass} min-h-24 resize-y`;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function Field({ label, value, onChange, placeholder = '', type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputClass} /></label>;
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</span><textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} className={textareaClass} /></label>;
}

function ItemShell({ title, index, count, onMove, onRemove, children }: { title: string; index: number; count: number; onMove: (from: number, to: number) => void; onRemove: () => void; children: React.ReactNode }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; setDragging(true); }}
      onDragEnd={() => setDragging(false)}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); if (Number.isInteger(from)) onMove(from, index); }}
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${dragging ? 'opacity-50 border-indigo-300' : 'border-slate-200'}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2"><GripVertical className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate text-sm font-black text-slate-800">{title}</span></div>
        <div className="flex items-center gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(index, index - 1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" disabled={index === count - 1} onClick={() => onMove(index, index + 1)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
          <button type="button" onClick={onRemove} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function ContactsPageEditor() {
  const { rawSettings, updateSettings } = useSiteContent();
  const [draft, setDraft] = useState<ContactPageConfig>(() => normalizeContactsPage(rawSettings.contactsPage));
  const [locale, setLocale] = useState<Locale>('uk');
  const [section, setSection] = useState<EditorSection>('layout');
  const [globalContacts, setGlobalContacts] = useState<Record<ContactGlobalField, string>>({
    phone: rawSettings.phone || '', email: rawSettings.email || '', telegram: rawSettings.telegram || '', whatsapp: rawSettings.whatsapp || '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const current = draft[locale];

  useEffect(() => {
    setDraft(normalizeContactsPage(rawSettings.contactsPage));
    setGlobalContacts({ phone: rawSettings.phone || '', email: rawSettings.email || '', telegram: rawSettings.telegram || '', whatsapp: rawSettings.whatsapp || '' });
  }, [rawSettings.contactsPage, rawSettings.phone, rawSettings.email, rawSettings.telegram, rawSettings.whatsapp]);

  const updateCurrent = (updater: (value: ContactPageLocaleContent) => ContactPageLocaleContent) => {
    setDraft(prev => ({ ...prev, [locale]: updater(clone(prev[locale])) }));
  };

  const updateAllLocales = (updater: (value: ContactPageLocaleContent, locale: Locale) => ContactPageLocaleContent) => {
    setDraft(prev => ({ ...prev, uk: updater(clone(prev.uk), 'uk'), ru: updater(clone(prev.ru), 'ru'), en: updater(clone(prev.en), 'en') }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSettings({ contactsPage: draft, ...globalContacts });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const copyLocale = (from: Locale) => {
    if (from === locale) return;
    setDraft(prev => ({ ...prev, [locale]: clone(prev[from]) }));
  };

  const addCard = () => {
    const id = `contact-${Date.now()}`;
    updateAllLocales(value => ({ ...value, contactCards: [...value.contactCards, { id, kind: 'custom', icon: 'message', title: '', subtitle: '', badge: '', valueOverride: '', hrefOverride: '' }] }));
  };
  const removeCard = (id: string) => updateAllLocales(value => ({ ...value, contactCards: value.contactCards.filter(item => item.id !== id) }));

  const addChoice = (key: 'services' | 'preferredContacts') => {
    const id = key === 'services' ? `SERVICE_${Date.now()}` : `channel-${Date.now()}`;
    updateAllLocales(value => ({ ...value, form: { ...value.form, [key]: [...value.form[key], { id, label: '' }] } }));
  };
  const removeChoice = (key: 'services' | 'preferredContacts', id: string) => updateAllLocales(value => ({ ...value, form: { ...value.form, [key]: value.form[key].filter(item => item.id !== id) } }));
  const renameChoiceId = (key: 'services' | 'preferredContacts', oldId: string, nextId: string) => {
    const clean = nextId.trim();
    if (!clean) return;
    updateAllLocales(value => ({ ...value, form: { ...value.form, [key]: value.form[key].map(item => item.id === oldId ? { ...item, id: clean } : item) } }));
  };

  const addHour = () => {
    const id = `hours-${Date.now()}`;
    updateAllLocales(value => ({ ...value, workingHours: { ...value.workingHours, rows: [...value.workingHours.rows, { id, label: '', value: '', tone: 'default' }] } }));
  };
  const removeHour = (id: string) => updateAllLocales(value => ({ ...value, workingHours: { ...value.workingHours, rows: value.workingHours.rows.filter(item => item.id !== id) } }));

  const addLocation = () => {
    const id = `location-${Date.now()}`;
    updateAllLocales(value => ({ ...value, locations: { ...value.locations, items: [...value.locations.items, { id, icon: 'building', city: '', address: '', description: '', type: '', mapUrl: '' }] } }));
  };
  const removeLocation = (id: string) => updateAllLocales(value => ({ ...value, locations: { ...value.locations, items: value.locations.items.filter(item => item.id !== id) } }));

  const addLegal = () => {
    const id = `legal-${Date.now()}`;
    updateAllLocales(value => ({ ...value, legal: { ...value.legal, items: [...value.legal.items, { id, title: '', description: '' }] } }));
  };
  const removeLegal = (id: string) => updateAllLocales(value => ({ ...value, legal: { ...value.legal, items: value.legal.items.filter(item => item.id !== id) } }));

  const addFaq = () => {
    const id = `faq-${Date.now()}`;
    updateAllLocales(value => ({ ...value, faq: { ...value.faq, items: [...value.faq.items, { id, question: '', answer: '' }] } }));
  };
  const removeFaq = (id: string) => updateAllLocales(value => ({ ...value, faq: { ...value.faq, items: value.faq.items.filter(item => item.id !== id) } }));

  const sectionTabs: Array<{ id: EditorSection; label: string }> = [
    { id: 'layout', label: 'Структура' }, { id: 'hero', label: 'Hero' }, { id: 'cards', label: 'Связь' }, { id: 'form', label: 'Форма' }, { id: 'operations', label: 'Офисы & гарантии' }, { id: 'faq', label: 'FAQ' },
  ];

  const completeness = useMemo(() => {
    const checks = [current.hero.title, current.hero.description, current.form.title, current.form.submitText, current.locations.title, current.faq.title];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [current]);

  return (
    <div className="space-y-6 pb-24">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">Contacts Full Editing 2.0</div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Полное редактирование страницы «Контакты»</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Здесь редактируется весь основной контент /contacts/: Hero, каналы связи, форма и ее варианты, услуги, часы работы, локации, юридические гарантии и FAQ. Дополнительные маркетинговые секции по-прежнему можно добавлять через Конструктор страниц.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><span className="font-black text-slate-900">{localeMeta[locale].flag} {localeMeta[locale].label}</span><span className="ml-3 text-slate-500">Заполнено: {completeness}%</span></div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {(['phone', 'email', 'telegram', 'whatsapp'] as ContactGlobalField[]).map(key => <Field key={key} label={key === 'phone' ? 'Основной телефон' : key === 'email' ? 'Email' : key === 'telegram' ? 'Telegram' : 'WhatsApp'} value={globalContacts[key]} onChange={value => setGlobalContacts(prev => ({ ...prev, [key]: value }))} />)}
        </div>
        <p className="mt-3 text-xs text-slate-500">Эти четыре значения глобальные: изменения одновременно попадут в карточки Contacts и другие места сайта, использующие общие реквизиты.</p>
      </div>

      <div className="sticky top-16 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {sectionTabs.map(tab => <button key={tab.id} type="button" onClick={() => setSection(tab.id)} className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-black ${section === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{tab.label}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['uk', 'ru', 'en'] as Locale[]).map(item => <button key={item} type="button" onClick={() => setLocale(item)} className={`rounded-xl px-3 py-2 text-xs font-black ${locale === item ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'}`}>{localeMeta[item].flag} {localeMeta[item].label}</button>)}
            <div className="h-6 w-px bg-slate-200" />
            {(['uk', 'ru', 'en'] as Locale[]).filter(item => item !== locale).map(item => <button key={item} type="button" onClick={() => copyLocale(item)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100"><Copy className="h-3 w-3" />из {localeMeta[item].flag}</button>)}
          </div>
        </div>
      </div>

      {section === 'layout' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-black">Порядок основных секций</h3>
            <div className="space-y-2">{draft.layout.sectionOrder.map((id, index) => <div key={id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><GripVertical className="h-4 w-4 text-slate-400" /><span className="flex-1 text-sm font-bold">{sectionLabels[id]}</span><button type="button" onClick={() => setDraft(prev => ({ ...prev, layout: { ...prev.layout, sectionEnabled: { ...prev.layout.sectionEnabled, [id]: !prev.layout.sectionEnabled[id] } } }))} className={`rounded-lg p-2 ${draft.layout.sectionEnabled[id] ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{draft.layout.sectionEnabled[id] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button type="button" disabled={index === 0} onClick={() => setDraft(prev => ({ ...prev, layout: { ...prev.layout, sectionOrder: move(prev.layout.sectionOrder, index, index - 1) } }))} className="p-1.5 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={index === draft.layout.sectionOrder.length - 1} onClick={() => setDraft(prev => ({ ...prev, layout: { ...prev.layout, sectionOrder: move(prev.layout.sectionOrder, index, index + 1) } }))} className="p-1.5 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button></div>)}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-black">Основной двухколоночный блок</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-bold"><span>Форма заявки</span><input type="checkbox" checked={draft.layout.mainEnabled.form} onChange={e => setDraft(prev => ({ ...prev, layout: { ...prev.layout, mainEnabled: { ...prev.layout.mainEnabled, form: e.target.checked } } }))} className="h-5 w-5" /></label>
              {draft.layout.rightPanelOrder.map((id, index) => <div key={id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className="flex-1 text-sm font-bold">{rightPanelLabels[id]}</span><input type="checkbox" checked={draft.layout.mainEnabled[id]} onChange={e => setDraft(prev => ({ ...prev, layout: { ...prev.layout, mainEnabled: { ...prev.layout.mainEnabled, [id]: e.target.checked } } }))} className="h-5 w-5" /><button type="button" disabled={index === 0} onClick={() => setDraft(prev => ({ ...prev, layout: { ...prev.layout, rightPanelOrder: move(prev.layout.rightPanelOrder, index, index - 1) } }))} className="p-1.5 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={index === draft.layout.rightPanelOrder.length - 1} onClick={() => setDraft(prev => ({ ...prev, layout: { ...prev.layout, rightPanelOrder: move(prev.layout.rightPanelOrder, index, index + 1) } }))} className="p-1.5 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button></div>)}
            </div>
          </div>
        </div>
      )}

      {section === 'hero' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Бейдж" value={current.hero.badge} onChange={value => updateCurrent(c => ({ ...c, hero: { ...c.hero, badge: value } }))} />
            <Field label="Акцент после H1" value={current.hero.accent} onChange={value => updateCurrent(c => ({ ...c, hero: { ...c.hero, accent: value } }))} placeholder="Dneprfilm" />
            <Field label="H1" value={current.hero.title} onChange={value => updateCurrent(c => ({ ...c, hero: { ...c.hero, title: value } }))} />
            <Field label="Префикс кнопки телефона" value={current.hero.phoneButtonPrefix} onChange={value => updateCurrent(c => ({ ...c, hero: { ...c.hero, phoneButtonPrefix: value } }))} />
            <div className="md:col-span-2"><TextArea label="Описание" value={current.hero.description} onChange={value => updateCurrent(c => ({ ...c, hero: { ...c.hero, description: value } }))} /></div>
            <Field label="Кнопка Telegram" value={current.hero.telegramButton} onChange={value => updateCurrent(c => ({ ...c, hero: { ...c.hero, telegramButton: value } }))} />
          </div>
        </div>
      )}

      {section === 'cards' && (
        <div className="space-y-4">
          {current.contactCards.map((card, index) => <ItemShell key={card.id} title={card.title || `Карточка ${index + 1}`} index={index} count={current.contactCards.length} onMove={(from, to) => updateCurrent(c => ({ ...c, contactCards: move(c.contactCards, from, to) }))} onRemove={() => removeCard(card.id)}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Заголовок" value={card.title} onChange={value => updateCurrent(c => ({ ...c, contactCards: c.contactCards.map(item => item.id === card.id ? { ...item, title: value } : item) }))} />
              <Field label="Подпись" value={card.subtitle} onChange={value => updateCurrent(c => ({ ...c, contactCards: c.contactCards.map(item => item.id === card.id ? { ...item, subtitle: value } : item) }))} />
              <Field label="Бейдж" value={card.badge} onChange={value => updateCurrent(c => ({ ...c, contactCards: c.contactCards.map(item => item.id === card.id ? { ...item, badge: value } : item) }))} />
              <label className="space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">Источник значения</span><select value={card.kind} onChange={e => updateCurrent(c => ({ ...c, contactCards: c.contactCards.map(item => item.id === card.id ? { ...item, kind: e.target.value as ContactCardContent['kind'] } : item) }))} className={inputClass}><option value="phone">Глобальный телефон</option><option value="telegram">Глобальный Telegram</option><option value="email">Глобальный Email</option><option value="whatsapp">Глобальный WhatsApp</option><option value="custom">Свое значение</option></select></label>
              <Field label="Свое отображаемое значение (override)" value={card.valueOverride} onChange={value => updateCurrent(c => ({ ...c, contactCards: c.contactCards.map(item => item.id === card.id ? { ...item, valueOverride: value } : item) }))} />
              <Field label="Своя ссылка (override)" value={card.hrefOverride} onChange={value => updateCurrent(c => ({ ...c, contactCards: c.contactCards.map(item => item.id === card.id ? { ...item, hrefOverride: value } : item) }))} />
              <label className="space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">Иконка</span><select value={card.icon} onChange={e => updateCurrent(c => ({ ...c, contactCards: c.contactCards.map(item => item.id === card.id ? { ...item, icon: e.target.value as ContactCardContent['icon'] } : item) }))} className={inputClass}><option value="phone">Телефон</option><option value="mail">Email</option><option value="message">Сообщение</option><option value="globe">Глобус</option><option value="building">Здание</option><option value="truck">ПТС / авто</option></select></label>
            </div>
          </ItemShell>)}
          <button type="button" onClick={addCard} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-black text-indigo-700"><Plus className="h-4 w-4" />Добавить карточку</button>
        </div>
      )}

      {section === 'form' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><Field label="Бейдж" value={current.form.badge} onChange={value => updateCurrent(c => ({ ...c, form: { ...c.form, badge: value } }))} /><Field label="Заголовок" value={current.form.title} onChange={value => updateCurrent(c => ({ ...c, form: { ...c.form, title: value } }))} /><div className="md:col-span-2"><TextArea label="Описание" value={current.form.description} onChange={value => updateCurrent(c => ({ ...c, form: { ...c.form, description: value } }))} /></div></div></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="mb-4 text-lg font-black">Подписи и placeholders</h3><div className="grid gap-4 md:grid-cols-2">{([
            ['nameLabel','Имя: label'], ['namePlaceholder','Имя: placeholder'], ['phoneLabel','Телефон: label'], ['phonePlaceholder','Телефон: placeholder'], ['preferredContactLabel','Канал связи: label'], ['serviceLabel','Услуга: label'], ['locationLabel','Локация: label'], ['locationPlaceholder','Локация: placeholder'], ['defaultLocation','Локация по умолчанию'], ['dateLabel','Дата: label'], ['datePlaceholder','Дата: placeholder'], ['emailLabel','Email: label'], ['emailPlaceholder','Email: placeholder'], ['messageLabel','Задача: label'], ['messagePlaceholder','Задача: placeholder'], ['privacyText','Текст конфиденциальности'], ['submitText','Кнопка отправки'], ['submittingText','Текст при отправке'], ['requiredError','Ошибка обязательных полей'], ['submitError','Ошибка отправки'], ['eventTypeLabel','Название лида в CRM'], ['cameraCountText','Поле cameraCount в CRM'], ['successTitle','Success: заголовок'], ['successButton','Success: кнопка']
          ] as Array<[keyof ContactPageLocaleContent['form'], string]>).map(([key,label]) => <Field key={String(key)} label={label} value={current.form[key] as string} onChange={value => updateCurrent(c => ({ ...c, form: { ...c.form, [key]: value } }))} />)}<div className="md:col-span-2"><TextArea label="Success: описание" value={current.form.successDescription} onChange={value => updateCurrent(c => ({ ...c, form: { ...c.form, successDescription: value } }))} /></div></div></div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black">Услуги</h3><button type="button" onClick={() => addChoice('services')} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-black text-indigo-700"><Plus className="h-3.5 w-3.5" />Добавить</button></div><div className="space-y-3">{current.form.services.map((item,index) => <ItemShell key={item.id} title={item.label || item.id} index={index} count={current.form.services.length} onMove={(from,to) => updateCurrent(c => ({ ...c, form: { ...c.form, services: move(c.form.services, from, to) } }))} onRemove={() => removeChoice('services', item.id)}><div className="grid gap-3 sm:grid-cols-2"><Field label="ID / CRM value" value={item.id} onChange={value => renameChoiceId('services', item.id, value)} /><Field label="Название" value={item.label} onChange={value => updateCurrent(c => ({ ...c, form: { ...c.form, services: c.form.services.map(row => row.id === item.id ? { ...row, label: value } : row) } }))} /></div></ItemShell>)}</div></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black">Варианты связи</h3><button type="button" onClick={() => addChoice('preferredContacts')} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-black text-indigo-700"><Plus className="h-3.5 w-3.5" />Добавить</button></div><div className="space-y-3">{current.form.preferredContacts.map((item,index) => <ItemShell key={item.id} title={item.label || item.id} index={index} count={current.form.preferredContacts.length} onMove={(from,to) => updateCurrent(c => ({ ...c, form: { ...c.form, preferredContacts: move(c.form.preferredContacts, from, to) } }))} onRemove={() => removeChoice('preferredContacts', item.id)}><div className="grid gap-3 sm:grid-cols-2"><Field label="ID" value={item.id} onChange={value => renameChoiceId('preferredContacts', item.id, value)} /><Field label="Название" value={item.label} onChange={value => updateCurrent(c => ({ ...c, form: { ...c.form, preferredContacts: c.form.preferredContacts.map(row => row.id === item.id ? { ...row, label: value } : row) } }))} /></div></ItemShell>)}</div></div>
          </div>
        </div>
      )}

      {section === 'operations' && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><Field label="Режим работы: заголовок" value={current.workingHours.title} onChange={value => updateCurrent(c => ({ ...c, workingHours: { ...c.workingHours, title: value } }))} /><Field label="Режим работы: подзаголовок" value={current.workingHours.subtitle} onChange={value => updateCurrent(c => ({ ...c, workingHours: { ...c.workingHours, subtitle: value } }))} /></div><div className="mt-5 space-y-3">{current.workingHours.rows.map((row,index) => <ItemShell key={row.id} title={row.label || `Строка ${index + 1}`} index={index} count={current.workingHours.rows.length} onMove={(from,to) => updateCurrent(c => ({ ...c, workingHours: { ...c.workingHours, rows: move(c.workingHours.rows, from, to) } }))} onRemove={() => removeHour(row.id)}><div className="grid gap-3 md:grid-cols-3"><Field label="Подпись" value={row.label} onChange={value => updateCurrent(c => ({ ...c, workingHours: { ...c.workingHours, rows: c.workingHours.rows.map(item => item.id === row.id ? { ...item, label: value } : item) } }))} /><Field label="Значение" value={row.value} onChange={value => updateCurrent(c => ({ ...c, workingHours: { ...c.workingHours, rows: c.workingHours.rows.map(item => item.id === row.id ? { ...item, value } : item) } }))} /><label className="space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">Акцент</span><select className={inputClass} value={row.tone} onChange={e => updateCurrent(c => ({ ...c, workingHours: { ...c.workingHours, rows: c.workingHours.rows.map(item => item.id === row.id ? { ...item, tone: e.target.value as ContactWorkingHoursRow['tone'] } : item) } }))}><option value="default">Белый</option><option value="indigo">Indigo</option><option value="emerald">Emerald</option></select></label></div></ItemShell>)}</div><button type="button" onClick={addHour} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700"><Plus className="h-4 w-4" />Добавить строку</button></div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Field label="Заголовок локаций" value={current.locations.title} onChange={value => updateCurrent(c => ({ ...c, locations: { ...c.locations, title: value } }))} /><button type="button" onClick={addLocation} className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700"><Plus className="h-4 w-4" />Добавить локацию</button></div><div className="space-y-4">{current.locations.items.map((item,index) => <ItemShell key={item.id} title={item.city || `Локация ${index + 1}`} index={index} count={current.locations.items.length} onMove={(from,to) => updateCurrent(c => ({ ...c, locations: { ...c.locations, items: move(c.locations.items, from, to) } }))} onRemove={() => removeLocation(item.id)}><div className="grid gap-3 md:grid-cols-2"><Field label="Город / название" value={item.city} onChange={value => updateCurrent(c => ({ ...c, locations: { ...c.locations, items: c.locations.items.map(row => row.id === item.id ? { ...row, city: value } : row) } }))} /><Field label="Тип / бейдж" value={item.type} onChange={value => updateCurrent(c => ({ ...c, locations: { ...c.locations, items: c.locations.items.map(row => row.id === item.id ? { ...row, type: value } : row) } }))} /><Field label="Адрес" value={item.address} onChange={value => updateCurrent(c => ({ ...c, locations: { ...c.locations, items: c.locations.items.map(row => row.id === item.id ? { ...row, address: value } : row) } }))} /><Field label="Google Maps / карта URL" value={item.mapUrl} onChange={value => updateCurrent(c => ({ ...c, locations: { ...c.locations, items: c.locations.items.map(row => row.id === item.id ? { ...row, mapUrl: value } : row) } }))} /><label className="space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">Иконка</span><select value={item.icon} onChange={e => updateCurrent(c => ({ ...c, locations: { ...c.locations, items: c.locations.items.map(row => row.id === item.id ? { ...row, icon: e.target.value as ContactLocationContent['icon'] } : row) } }))} className={inputClass}><option value="building">Здание</option><option value="truck">ПТС / авто</option><option value="globe">Глобус</option><option value="message">Сообщение</option><option value="phone">Телефон</option><option value="mail">Email</option></select></label><div className="md:col-span-2"><TextArea label="Описание" value={item.description} onChange={value => updateCurrent(c => ({ ...c, locations: { ...c.locations, items: c.locations.items.map(row => row.id === item.id ? { ...row, description: value } : row) } }))} /></div></div></ItemShell>)}</div></div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Field label="Заголовок гарантий" value={current.legal.title} onChange={value => updateCurrent(c => ({ ...c, legal: { ...c.legal, title: value } }))} /><button type="button" onClick={addLegal} className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700"><Plus className="h-4 w-4" />Добавить пункт</button></div><div className="space-y-3">{current.legal.items.map((item,index) => <ItemShell key={item.id} title={item.title || `Пункт ${index + 1}`} index={index} count={current.legal.items.length} onMove={(from,to) => updateCurrent(c => ({ ...c, legal: { ...c.legal, items: move(c.legal.items, from, to) } }))} onRemove={() => removeLegal(item.id)}><div className="grid gap-3 md:grid-cols-2"><Field label="Жирная часть" value={item.title} onChange={value => updateCurrent(c => ({ ...c, legal: { ...c.legal, items: c.legal.items.map(row => row.id === item.id ? { ...row, title: value } : row) } }))} /><Field label="Продолжение" value={item.description} onChange={value => updateCurrent(c => ({ ...c, legal: { ...c.legal, items: c.legal.items.map(row => row.id === item.id ? { ...row, description: value } : row) } }))} /></div></ItemShell>)}</div></div>
        </div>
      )}

      {section === 'faq' && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 md:grid-cols-2"><Field label="Заголовок FAQ" value={current.faq.title} onChange={value => updateCurrent(c => ({ ...c, faq: { ...c.faq, title: value } }))} /><Field label="Подзаголовок FAQ" value={current.faq.subtitle} onChange={value => updateCurrent(c => ({ ...c, faq: { ...c.faq, subtitle: value } }))} /></div></div>
          {current.faq.items.map((item,index) => <ItemShell key={item.id} title={item.question || `FAQ ${index + 1}`} index={index} count={current.faq.items.length} onMove={(from,to) => updateCurrent(c => ({ ...c, faq: { ...c.faq, items: move(c.faq.items, from, to) } }))} onRemove={() => removeFaq(item.id)}><div className="space-y-3"><Field label="Вопрос" value={item.question} onChange={value => updateCurrent(c => ({ ...c, faq: { ...c.faq, items: c.faq.items.map(row => row.id === item.id ? { ...row, question: value } : row) } }))} /><TextArea label="Ответ" value={item.answer} onChange={value => updateCurrent(c => ({ ...c, faq: { ...c.faq, items: c.faq.items.map(row => row.id === item.id ? { ...row, answer: value } : row) } }))} /></div></ItemShell>)}
          <button type="button" onClick={addFaq} className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-black text-indigo-700"><Plus className="h-4 w-4" />Добавить FAQ</button>
        </div>
      )}

      <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl">
        <button type="button" onClick={() => setDraft(clone(DEFAULT_CONTACTS_PAGE))} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-100"><RotateCcw className="h-4 w-4" />Defaults</button>
        {saved && <span className="hidden items-center gap-1 text-xs font-black text-emerald-600 sm:inline-flex"><CheckCircle2 className="h-4 w-4" />Сохранено</span>}
        <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Сохранение…' : 'Сохранить и опубликовать'}</button>
      </div>
    </div>
  );
}
