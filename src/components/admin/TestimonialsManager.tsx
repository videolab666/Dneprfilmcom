import React, { useEffect, useState } from 'react';
import { Edit3, MessageSquare, Plus, Star, Trash2, X } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Locale, Testimonial } from '../../types';
import { AdminImageField } from './AdminImageField';

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

const emptyItem = (): Testimonial => ({
  id: `test-${Date.now()}`,
  author: '',
  role: '',
  company: '',
  project: '',
  quote: '',
  avatar: '',
  rating: 5,
  createdAt: Date.now(),
});

type LocalizedField = 'author' | 'role' | 'company' | 'project' | 'quote';

export function TestimonialsManager() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'testimonials'));
      setItems(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Testimonial)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const fieldValue = (field: LocalizedField): string => {
    if (!editing) return '';
    if (language === 'ru') return String(editing[field] || '');
    return String(editing[`${field}_${language}` as keyof Testimonial] || '');
  };

  const setFieldValue = (field: LocalizedField, value: string) => {
    if (!editing) return;
    if (language === 'ru') setEditing({ ...editing, [field]: value });
    else setEditing({ ...editing, [`${field}_${language}`]: value });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    try {
      await setDoc(doc(db, 'testimonials', editing.id), editing);
      setEditing(null);
      await fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить отзыв? Он исчезнет с главной страницы.')) return;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
      await fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2"><MessageSquare className="w-3.5 h-3.5" />Отзывы CMS</div>
          <h2 className="text-2xl font-black">Отзывы клиентов</h2>
          <p className="text-sm text-slate-500 mt-1">Публичный блок и админка используют одну коллекцию Firestore. Отсутствующие стартовые отзывы добавляются автоматически без перезаписи ваших изменений.</p>
        </div>
        <button onClick={() => { setEditing(emptyItem()); setLanguage('uk'); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold"><Plus className="w-4 h-4" />Добавить отзыв</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {loading ? <div className="p-12 text-center text-slate-500">Загрузка…</div> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map(item => (
            <article key={item.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                {item.avatar ? <img src={item.avatar} alt={item.author_uk || item.author || ''} className="h-11 w-11 rounded-full object-cover border border-slate-200" /> : null}
                <div className="flex gap-1 text-amber-400">{Array.from({ length: item.rating || 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}</div>
              </div>
              <p className="text-sm text-slate-600 italic line-clamp-5 flex-1">“{item.quote_uk || item.quote}”</p>
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center gap-3">
                <div className="min-w-0"><div className="font-bold text-sm truncate">{item.author_uk || item.author}</div><div className="text-xs text-slate-500 truncate">{item.company_uk || item.company}</div></div>
                <div className="flex gap-1"><button onClick={() => { setEditing(item); setLanguage('uk'); }} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"><Edit3 className="w-4 h-4" /></button><button onClick={() => remove(item.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto">
            <form onSubmit={save} className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between"><div><h3 className="text-xl font-black">Редактор отзыва</h3><p className="text-xs text-slate-400">{editing.id}</p></div><button type="button" onClick={() => setEditing(null)} className="p-2 h-fit rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
              <div className="grid sm:grid-cols-[minmax(0,1fr)_180px] gap-4 items-start">
                <AdminImageField
                  label="Аватар клиента"
                  value={editing.avatar || ''}
                  onChange={avatar => setEditing({ ...editing, avatar })}
                  previewAlt={editing.author_uk || editing.author || 'Клиент'}
                  previewShape="square"
                  helperText="Загрузите фото или выберите существующее из медиатеки. URL остаётся доступен как запасной вариант."
                />
                <label className="text-xs font-bold">Рейтинг 1–5<input type="number" min="1" max="5" value={editing.rating || 5} onChange={e => setEditing({ ...editing, rating: Math.max(1, Math.min(5, Number(e.target.value))) })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" /></label>
              </div>
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">{LANGS.map(lang => <button key={lang.id} type="button" onClick={() => setLanguage(lang.id)} className={`px-4 py-2 rounded-xl text-sm font-bold ${language === lang.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{lang.label}</button>)}</div>
              <div className="grid sm:grid-cols-2 gap-4">
                {(['author', 'role', 'company', 'project'] as LocalizedField[]).map(field => <label key={field} className="text-xs font-bold capitalize">{field}<input value={fieldValue(field)} onChange={e => setFieldValue(field, e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" /></label>)}
                <label className="text-xs font-bold sm:col-span-2">Текст отзыва<textarea rows={7} value={fieldValue('quote')} onChange={e => setFieldValue('quote', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" /></label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold">Отмена</button><button type="submit" disabled={saving} className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50">{saving ? 'Сохраняю…' : 'Сохранить'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
