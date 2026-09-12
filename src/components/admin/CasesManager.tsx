import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Edit3, Plus, Trash2, X } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CaseStudy, Locale } from '../../types';

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

const emptyCase = (): CaseStudy => ({
  id: `case-${Date.now()}`,
  title: '',
  category: 'LIVE',
  client: '',
  categoryLabel: '',
  description: '',
  challenge: '',
  solution: '',
  result: '',
  metrics: [],
  imageUrl: '',
  videoUrl: '',
  videoBadge: '',
  featured: true,
  featuredOrder: 99,
  createdAt: Date.now(),
});

function metricsToText(metrics?: { label: string; value: string }[]): string {
  return (metrics || []).map(item => `${item.label} | ${item.value}`).join('\n');
}

function textToMetrics(value: string): { label: string; value: string }[] {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [label, ...rest] = line.split('|');
      return { label: label.trim(), value: rest.join('|').trim() };
    })
    .filter(item => item.label && item.value);
}

export function CasesManager() {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCases = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'cases'));
      const list = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() } as CaseStudy))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setCases(list);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const getLocalizedField = (base: 'title' | 'categoryLabel' | 'description' | 'challenge' | 'solution' | 'result'): string => {
    if (!editing) return '';
    if (language === 'ru') return String(editing[base] || '');
    const localizedKey = `${base}_${language}` as keyof CaseStudy;
    return String(editing[localizedKey] || '');
  };

  const setLocalizedField = (base: 'title' | 'categoryLabel' | 'description' | 'challenge' | 'solution' | 'result', value: string) => {
    if (!editing) return;
    if (language === 'ru') {
      setEditing({ ...editing, [base]: value });
      return;
    }
    const localizedKey = `${base}_${language}`;
    setEditing({ ...editing, [localizedKey]: value });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (!editing.title.trim() && !editing.title_uk?.trim() && !editing.title_en?.trim()) {
      setError('Укажите название кейса хотя бы на одном языке.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await setDoc(doc(db, 'cases', editing.id), editing);
      setEditing(null);
      await fetchCases();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить кейс? Он исчезнет и с публичной страницы.')) return;
    try {
      await deleteDoc(doc(db, 'cases', id));
      await fetchCases();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const displayTitle = (item: CaseStudy) => item.title_uk || item.title || item.title_en || 'Без названия';

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Briefcase className="w-3.5 h-3.5" /><span>Portfolio CMS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Кейсы студии</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">Эти записи используются и на странице «Кейсы», и в блоке избранных кейсов на главной. Встроенные стартовые кейсы добавляются автоматически только если их нет.</p>
        </div>
        <button onClick={() => { setEditing(emptyCase()); setLanguage('uk'); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md">
          <Plus className="w-4 h-4" /> Добавить кейс
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка кейсов…</div>
      ) : cases.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">Кейсы не найдены. При входе администратора CMS должна автоматически восстановить отсутствующие стартовые записи.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cases.map(item => (
            <article key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {item.imageUrl && <img src={item.imageUrl} alt={displayTitle(item)} className="w-full h-full object-cover" />}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold">{item.category}</div>
                {item.featured === false && <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold">Не на главной</div>}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-900">{displayTitle(item)}</h3>
                <div className="text-xs text-slate-500 mt-1">{item.client}</div>
                <p className="text-sm text-slate-500 mt-3 line-clamp-3 flex-1">{item.description_uk || item.description}</p>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{item.id}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(item); setLanguage('uk'); }} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50" title="Редактировать"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Удалить"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto">
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between gap-4">
                <div><h3 className="text-xl font-black">Редактор кейса</h3><p className="text-xs text-slate-400 mt-1">ID: {editing.id}</p></div>
                <button type="button" onClick={() => setEditing(null)} className="p-2 h-fit rounded-full hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="text-xs font-bold text-slate-700">Категория
                  <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value as CaseStudy['category'] })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-normal text-sm">
                    <option value="LIVE">LIVE</option><option value="VIDEO">VIDEO</option><option value="CONSTRUCTION">CONSTRUCTION</option><option value="OTHER">OTHER</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700 lg:col-span-2">Клиент
                  <input value={editing.client} onChange={e => setEditing({ ...editing, client: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={editing.featured !== false} onChange={e => setEditing({ ...editing, featured: e.target.checked })} className="w-4 h-4" /> На главной
                </label>
                <label className="text-xs font-bold text-slate-700">Порядок на главной
                  <input type="number" value={editing.featuredOrder ?? 99} onChange={e => setEditing({ ...editing, featuredOrder: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 lg:col-span-2">URL изображения
                  <input type="url" value={editing.imageUrl || ''} onChange={e => setEditing({ ...editing, imageUrl: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">Видео badge
                  <input value={editing.videoBadge || ''} onChange={e => setEditing({ ...editing, videoBadge: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">URL видео
                  <input type="url" value={editing.videoUrl || ''} onChange={e => setEditing({ ...editing, videoUrl: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Метрики: одна строка = Название | Значение
                  <textarea rows={4} value={metricsToText(editing.metrics)} onChange={e => setEditing({ ...editing, metrics: textToMetrics(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {LANGS.map(item => <button key={item.id} type="button" onClick={() => setLanguage(item.id)} className={`px-4 py-2 rounded-xl text-sm font-bold ${language === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item.label}</button>)}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Название
                  <input value={getLocalizedField('title')} onChange={e => setLocalizedField('title', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Подпись категории
                  <input value={getLocalizedField('categoryLabel')} onChange={e => setLocalizedField('categoryLabel', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Описание
                  <textarea rows={3} value={getLocalizedField('description')} onChange={e => setLocalizedField('description', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Задача / Challenge
                  <textarea rows={3} value={getLocalizedField('challenge')} onChange={e => setLocalizedField('challenge', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Решение
                  <textarea rows={3} value={getLocalizedField('solution')} onChange={e => setLocalizedField('solution', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Результат
                  <textarea rows={3} value={getLocalizedField('result')} onChange={e => setLocalizedField('result', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700">Отмена</button>
                <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50">{saving ? 'Сохраняю…' : 'Сохранить'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
