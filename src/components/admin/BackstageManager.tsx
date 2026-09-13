import React, { useEffect, useState } from 'react';
import { Edit3, Plus, Radio, Trash2, X } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BackstageItem, Locale } from '../../types';
import { AdminImageField } from './AdminImageField';

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

type LocalizedField = 'title' | 'category' | 'tech' | 'description';

const emptyItem = (): BackstageItem => ({
  id: `backstage-${Date.now()}`,
  title: '',
  category: '',
  tech: '',
  imageUrl: '',
  description: '',
  createdAt: Date.now(),
});

export function BackstageManager() {
  const [items, setItems] = useState<BackstageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BackstageItem | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'backstage'));
      setItems(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as BackstageItem)));
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
    return String(editing[`${field}_${language}` as keyof BackstageItem] || '');
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
      await setDoc(doc(db, 'backstage', editing.id), editing);
      setEditing(null);
      await fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Удалить карточку backstage? Она исчезнет с главной страницы.')) return;
    try {
      await deleteDoc(doc(db, 'backstage', id));
      await fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2"><Radio className="w-3.5 h-3.5" />Backstage CMS</div>
          <h2 className="text-2xl font-black">ПТС и backstage</h2>
          <p className="text-sm text-slate-500 mt-1">Карточки главной страницы и админка используют одну коллекцию. Стартовые карточки восстанавливаются только если отсутствуют.</p>
        </div>
        <button onClick={() => { setEditing(emptyItem()); setLanguage('uk'); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold"><Plus className="w-4 h-4" />Добавить карточку</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {loading ? <div className="p-12 text-center text-slate-500">Загрузка…</div> : (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map(item => (
            <article key={item.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="aspect-[16/8] bg-slate-100 overflow-hidden">{item.imageUrl && <img src={item.imageUrl} alt={item.title_uk || item.title} className="w-full h-full object-cover" />}</div>
              <div className="p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">{item.category_uk || item.category}</div>
                <h3 className="font-bold text-slate-900 mt-1">{item.title_uk || item.title}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-3">{item.description_uk || item.description}</p>
                <div className="flex justify-end gap-1 mt-4 pt-4 border-t border-slate-100"><button onClick={() => { setEditing(item); setLanguage('uk'); }} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"><Edit3 className="w-4 h-4" /></button><button onClick={() => remove(item.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto">
            <form onSubmit={save} className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between"><div><h3 className="text-xl font-black">Редактор backstage</h3><p className="text-xs text-slate-400">{editing.id}</p></div><button type="button" onClick={() => setEditing(null)} className="p-2 h-fit rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
              <AdminImageField
                label="Изображение карточки"
                value={editing.imageUrl || ''}
                onChange={imageUrl => setEditing({ ...editing, imageUrl })}
                previewAlt={editing.title_uk || editing.title || 'Backstage'}
                helperText="Можно загрузить новое фото, выбрать уже загруженное из медиатеки или оставить внешний URL."
              />
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">{LANGS.map(lang => <button key={lang.id} type="button" onClick={() => setLanguage(lang.id)} className={`px-4 py-2 rounded-xl text-sm font-bold ${language === lang.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{lang.label}</button>)}</div>
              <div className="grid sm:grid-cols-2 gap-4">
                {(['title', 'category', 'tech'] as LocalizedField[]).map(field => <label key={field} className={`text-xs font-bold ${field === 'title' ? 'sm:col-span-2' : ''}`}>{field}<input value={fieldValue(field)} onChange={e => setFieldValue(field, e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" /></label>)}
                <label className="text-xs font-bold sm:col-span-2">Описание<textarea rows={7} value={fieldValue('description')} onChange={e => setFieldValue('description', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" /></label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100"><button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold">Отмена</button><button type="submit" disabled={saving} className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50">{saving ? 'Сохраняю…' : 'Сохранить'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
