import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Briefcase, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Play, 
  ExternalLink 
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CaseStudy } from '../../types';
import { INITIAL_CASES } from '../../data/initialCases';

export function CasesManager() {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCase, setEditingCase] = useState<CaseStudy | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [modalLangTab, setModalLangTab] = useState<'uk' | 'ru' | 'en'>('uk');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'cases'));
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CaseStudy));
        setCases(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      } else {
        setCases([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    for (const c of INITIAL_CASES) {
      await setDoc(doc(db, 'cases', c.id), c);
    }
    await fetchCases();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) return;
    await setDoc(doc(db, 'cases', editingCase.id), editingCase);
    setEditingCase(null);
    await fetchCases();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить этот кейс?')) {
      await deleteDoc(doc(db, 'cases', id));
      await fetchCases();
    }
  };

  const handleStartAdd = () => {
    setEditingCase({
      id: `case-${Date.now()}`,
      title: '',
      category: 'LIVE',
      client: '',
      description: '',
      challenge: '',
      solution: '',
      result: '',
      imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80',
      createdAt: Date.now()
    });
    setIsNew(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Портфолио проектов</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Управление кейсами студии
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Добавляйте реализованные проекты с описанием проблемы, решения и результата. Они выводятся на Главной и на странице Кейсов.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSeedDefaults}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Загрузить базовые кейсы</span>
          </button>
          <button
            onClick={handleStartAdd}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить кейс</span>
          </button>
        </div>
      </div>

      {/* Cases list */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка кейсов...</div>
      ) : cases.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-slate-800 mb-1">Пока нет кейсов в базе</h4>
          <p className="text-sm text-slate-500 mb-4">Нажмите «Загрузить базовые кейсы», чтобы добавить стартовые проекты.</p>
          <button
            onClick={handleSeedDefaults}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
          >
            Загрузить базовые кейсы
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div key={c.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {c.category}
                </div>
                <div className="absolute top-3 right-3 flex space-x-1">
                  <button
                    onClick={() => { setEditingCase(c); setIsNew(false); }}
                    className="p-2 bg-white/90 hover:bg-white text-slate-900 rounded-xl shadow-md"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 bg-white/90 hover:bg-red-50 text-red-600 rounded-xl shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="text-xs font-bold text-slate-500 mb-1">{c.client}</div>
                <h4 className="text-base font-bold text-slate-900 mb-2 line-clamp-2">{c.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4">{c.description}</p>
                {c.result && (
                  <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl">
                    Результат: {c.result}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editingCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-black text-slate-900">
                {isNew ? 'Создание кейса' : 'Редактирование кейса'}
              </h3>
              <button
                onClick={() => setEditingCase(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 bg-slate-100 p-1 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => setModalLangTab('uk')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  modalLangTab === 'uk' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇺🇦 Українська (UA)
              </button>
              <button
                type="button"
                onClick={() => setModalLangTab('ru')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  modalLangTab === 'ru' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇷🇺 Русский (RU)
              </button>
              <button
                type="button"
                onClick={() => setModalLangTab('en')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  modalLangTab === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇬🇧 English (EN)
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Название проекта ({modalLangTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={
                    modalLangTab === 'uk'
                      ? (editingCase.title_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingCase.title_en ?? '')
                      : (editingCase.title ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingCase({ ...editingCase, title_uk: val });
                    else if (modalLangTab === 'en') setEditingCase({ ...editingCase, title_en: val });
                    else setEditingCase({ ...editingCase, title: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                  placeholder={
                    modalLangTab === 'uk'
                      ? `Базовий: ${editingCase.title || 'Назва...'}`
                      : modalLangTab === 'en'
                      ? `RU: ${editingCase.title || 'Project title...'}`
                      : 'Трансляция международного турнира...'
                  }
                  required={modalLangTab === 'ru'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Категория (общая)
                  </label>
                  <select
                    value={editingCase.category}
                    onChange={(e) => setEditingCase({ ...editingCase, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="LIVE">LIVE Production</option>
                    <option value="VIDEO">Video Production</option>
                    <option value="CONSTRUCTION">Construction Media</option>
                    <option value="OTHER">Другое</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Клиент / Заказчик (общий)
                  </label>
                  <input
                    type="text"
                    value={editingCase.client}
                    onChange={(e) => setEditingCase({ ...editingCase, client: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    placeholder="Федерация бокса..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  URL обложки проекта (общий)
                </label>
                <input
                  type="url"
                  value={editingCase.imageUrl}
                  onChange={(e) => setEditingCase({ ...editingCase, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Краткое описание ({modalLangTab.toUpperCase()})
                </label>
                <textarea
                  rows={2}
                  value={
                    modalLangTab === 'uk'
                      ? (editingCase.description_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingCase.description_en ?? '')
                      : (editingCase.description ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingCase({ ...editingCase, description_uk: val });
                    else if (modalLangTab === 'en') setEditingCase({ ...editingCase, description_en: val });
                    else setEditingCase({ ...editingCase, description: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder={
                    modalLangTab === 'uk'
                      ? `Базовий: ${editingCase.description || ''}`
                      : modalLangTab === 'en'
                      ? `RU: ${editingCase.description || ''}`
                      : 'Краткое описание проекта...'
                  }
                  required={modalLangTab === 'ru'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Сложность / Задача (Challenge) ({modalLangTab.toUpperCase()})
                </label>
                <textarea
                  rows={2}
                  value={
                    modalLangTab === 'uk'
                      ? (editingCase.challenge_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingCase.challenge_en ?? '')
                      : (editingCase.challenge ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingCase({ ...editingCase, challenge_uk: val });
                    else if (modalLangTab === 'en') setEditingCase({ ...editingCase, challenge_en: val });
                    else setEditingCase({ ...editingCase, challenge: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Решение (Solution) ({modalLangTab.toUpperCase()})
                </label>
                <textarea
                  rows={2}
                  value={
                    modalLangTab === 'uk'
                      ? (editingCase.solution_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingCase.solution_en ?? '')
                      : (editingCase.solution ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingCase({ ...editingCase, solution_uk: val });
                    else if (modalLangTab === 'en') setEditingCase({ ...editingCase, solution_en: val });
                    else setEditingCase({ ...editingCase, solution: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Итоговый результат ({modalLangTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={
                    modalLangTab === 'uk'
                      ? (editingCase.result_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingCase.result_en ?? '')
                      : (editingCase.result ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingCase({ ...editingCase, result_uk: val });
                    else if (modalLangTab === 'en') setEditingCase({ ...editingCase, result_en: val });
                    else setEditingCase({ ...editingCase, result: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="1.2 млн просмотров, 0 сбоев..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
