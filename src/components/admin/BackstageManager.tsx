import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Radio, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Camera, 
  Cpu 
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BackstageItem } from '../../types';

const INITIAL_BACKSTAGE: BackstageItem[] = [
  {
    id: 'backstage-1',
    title: 'Мобильный режиссерский узел ПТС',
    category: 'Режиссерская',
    tech: 'vMix Pro 4K + Blackmagic ATEM Constellation',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
    description: 'Центр управления эфиром: мультивьюер на 16 источников, станция повторов Slow Motion и титровальный сервер.'
  },
  {
    id: 'backstage-2',
    title: 'Операторская группа на ринге и стадионе',
    category: 'Операторы',
    tech: 'Sony FX6 / FX9 + длиннофокусная кинооптика G Master',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80',
    description: 'Операторы работают на беспроводных радиофокусах и радиоканалах связи с режиссером в режиме 0 задержки.'
  },
  {
    id: 'backstage-3',
    title: 'Коммутация и резервирование тракта 12G-SDI',
    category: 'Коммутация',
    tech: 'Бронированные оптические кабели + конвертеры Neutrik',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80',
    description: 'Защищенные кабель-каналы (капы) для безопасности участников и чистый цифровой сигнал без наводок.'
  },
  {
    id: 'backstage-4',
    title: 'Автономная станция связи и Starlink',
    category: 'Связь и питание',
    tech: 'Starlink Gen 2 + LiveU / Peplink мульти-SIM бондинг',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80',
    description: 'Гарантия стабильной отдачи потока 50+ Мбит/с даже на стадионах и загородных полигонах без проводного интернета.'
  }
];

export function BackstageManager() {
  const [items, setItems] = useState<BackstageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<BackstageItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [modalLangTab, setModalLangTab] = useState<'uk' | 'ru' | 'en'>('uk');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'backstage'));
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as BackstageItem));
        setItems(list);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    for (const b of INITIAL_BACKSTAGE) {
      await setDoc(doc(db, 'backstage', b.id), b);
    }
    await fetchItems();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    await setDoc(doc(db, 'backstage', editingItem.id), editingItem);
    setEditingItem(null);
    await fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить эту карточку бэкстейджа?')) {
      await deleteDoc(doc(db, 'backstage', id));
      await fetchItems();
    }
  };

  const handleStartAdd = () => {
    setEditingItem({
      id: `backstage-${Date.now()}`,
      title: '',
      category: 'Режиссерская',
      tech: '',
      imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
      description: '',
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
            <Radio className="w-3.5 h-3.5" />
            <span>Инженерная изнанка</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            За кулисами проектов (ПТС & Техника)
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Управляйте карточками оборудования, оптической коммутации и операторской работы в блоке «За кулисами проектов» на Главной.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSeedDefaults}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors"
            title="Загрузить базовые 4 карточки"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Загрузить базовую технику</span>
          </button>
          <button
            onClick={handleStartAdd}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить карточку</span>
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка карточек...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Radio className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-slate-800 mb-1">Пока нет карточек в базе</h4>
          <p className="text-sm text-slate-500 mb-4">Нажмите «Загрузить базовую технику», чтобы заполнить галерею.</p>
          <button
            onClick={handleSeedDefaults}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
          >
            Загрузить базовую технику
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((b) => (
            <div key={b.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-indigo-300">
                  {b.category}
                </div>
                <div className="absolute top-3 right-3 flex space-x-1">
                  <button
                    onClick={() => { setEditingItem(b); setIsNew(false); }}
                    className="p-2 bg-white/90 hover:bg-white text-slate-900 rounded-xl shadow-md"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-2 bg-white/90 hover:bg-red-50 text-red-600 rounded-xl shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="text-xs font-bold text-slate-500 mb-1">
                  Тех. стек: <span className="text-indigo-600">{b.tech}</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{b.title}</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-black text-slate-900">
                {isNew ? 'Новая карточка техники' : 'Редактирование'}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
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
                  Заголовок ({modalLangTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={
                    modalLangTab === 'uk'
                      ? (editingItem.title_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingItem.title_en ?? '')
                      : (editingItem.title ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingItem({ ...editingItem, title_uk: val });
                    else if (modalLangTab === 'en') setEditingItem({ ...editingItem, title_en: val });
                    else setEditingItem({ ...editingItem, title: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                  placeholder={
                    modalLangTab === 'uk'
                      ? `Базовий: ${editingItem.title || ''}`
                      : modalLangTab === 'en'
                      ? `RU: ${editingItem.title || ''}`
                      : 'Мобильный режиссерский узел ПТС'
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
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="Режиссерская">Режиссерская</option>
                    <option value="Операторы">Операторы</option>
                    <option value="Коммутация">Коммутация</option>
                    <option value="Связь и питание">Связь и питание</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Оборудование / Спецификация ({modalLangTab.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={
                      modalLangTab === 'uk'
                        ? (editingItem.tech_uk ?? '')
                        : modalLangTab === 'en'
                        ? (editingItem.tech_en ?? '')
                        : (editingItem.tech ?? '')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (modalLangTab === 'uk') setEditingItem({ ...editingItem, tech_uk: val });
                      else if (modalLangTab === 'en') setEditingItem({ ...editingItem, tech_en: val });
                      else setEditingItem({ ...editingItem, tech: val });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    placeholder="vMix Pro 4K + ATEM..."
                    required={modalLangTab === 'ru'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  URL фотографии (общий)
                </label>
                <input
                  type="url"
                  value={editingItem.imageUrl}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Описание процесса и надежности ({modalLangTab.toUpperCase()})
                </label>
                <textarea
                  rows={3}
                  value={
                    modalLangTab === 'uk'
                      ? (editingItem.description_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingItem.description_en ?? '')
                      : (editingItem.description ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingItem({ ...editingItem, description_uk: val });
                    else if (modalLangTab === 'en') setEditingItem({ ...editingItem, description_en: val });
                    else setEditingItem({ ...editingItem, description: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder={
                    modalLangTab === 'uk'
                      ? `Базовий: ${editingItem.description || ''}`
                      : modalLangTab === 'en'
                      ? `RU: ${editingItem.description || ''}`
                      : 'Описание процесса...'
                  }
                  required={modalLangTab === 'ru'}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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
