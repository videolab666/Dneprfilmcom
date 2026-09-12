import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Star, 
  CheckCircle2, 
  X, 
  MessageSquare, 
  RefreshCw 
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Testimonial } from '../../types';

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    author: 'Сергей Ковальчук',
    role: 'Вице-президент',
    company: 'Федерация спорта и единоборств',
    project: 'Трансляция 3-дневного всеукраинского турнира (6 камер, повторы)',
    quote: 'В спорте повторного дубля не бывает. Команда Александра Пителя отработала на высшем телевизионном уровне: моментальные повторы острых нокдаунов, чистый звук комментаторов и железная стабильность трансляции при перебоях на арене благодаря их Старлинку.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
    rating: 5
  },
  {
    id: 'test-2',
    author: 'Елена Воропаева',
    role: 'Chief Operating Officer',
    company: 'EventHub Global Conferences',
    project: 'Гибридный бизнес-форум на 3 зала и 3 500 онлайн-участников',
    quote: 'Главное преимущество работы с LIVE & VIDEO — полное спокойствие организатора. Мы передали им технический райдер по трансляции, звуку и экранам, и ни о чем не беспокоились. Спикеры из Лондона подключились без секундной задержки, картинка презентаций 4K.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80',
    rating: 5
  },
  {
    id: 'test-3',
    author: 'Дмитрий Мельник',
    role: 'Директор по маркетингу',
    company: 'Инвестиционно-девелоперская группа',
    project: '18 месяцев аэросъемки стройки, таймлапс и 3D-туры шоурумов',
    quote: 'Застройщику критически важно иметь одного надежного подрядчика на весь цикл строительства. Александр и его группа регулярно выдавали потрясающие 4K-кадры, а их интерактивный 3D-тур увеличил продажи квартир клиентам из других городов на 38%.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80',
    rating: 5
  }
];

export function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [modalLangTab, setModalLangTab] = useState<'uk' | 'ru' | 'en'>('uk');

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'testimonials'));
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial));
        setTestimonials(list);
      } else {
        setTestimonials([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    for (const t of INITIAL_TESTIMONIALS) {
      await setDoc(doc(db, 'testimonials', t.id), t);
    }
    await fetchTestimonials();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    await setDoc(doc(db, 'testimonials', editingItem.id), editingItem);
    setEditingItem(null);
    await fetchTestimonials();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить этот отзыв?')) {
      await deleteDoc(doc(db, 'testimonials', id));
      await fetchTestimonials();
    }
  };

  const handleStartAdd = () => {
    setEditingItem({
      id: `test-${Date.now()}`,
      author: '',
      role: '',
      company: '',
      project: '',
      quote: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
      rating: 5,
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
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Социальное доказательство</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Управление отзывами клиентов
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Добавляйте и редактируйте отзывы партнеров и клиентов. Они транслируются в блоке «Что говорят клиенты» на Главной.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSeedDefaults}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors"
            title="Загрузить стартовые 3 отзыва"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Загрузить базовые отзывы</span>
          </button>
          <button
            onClick={handleStartAdd}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить отзыв</span>
          </button>
        </div>
      </div>

      {/* Testimonials List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка отзывов...</div>
      ) : testimonials.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-slate-800 mb-1">Пока нет отзывов в базе</h4>
          <p className="text-sm text-slate-500 mb-4">Нажмите «Загрузить базовые отзывы», чтобы скопировать 3 реальных кейса.</p>
          <button
            onClick={handleSeedDefaults}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
          >
            Загрузить базовые отзывы
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => { setEditingItem(t); setIsNew(false); }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Редактировать"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {t.project && (
                  <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-2">
                    {t.project}
                  </div>
                )}

                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                <img
                  src={t.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'}
                  alt={t.author}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.author}</h4>
                  <p className="text-xs text-slate-500">{t.role}, {t.company}</p>
                </div>
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
                {isNew ? 'Новый отзыв' : 'Редактирование отзыва'}
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
                  Автор (Имя Фамилия) ({modalLangTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={
                    modalLangTab === 'uk'
                      ? (editingItem.author_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingItem.author_en ?? '')
                      : (editingItem.author ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingItem({ ...editingItem, author_uk: val });
                    else if (modalLangTab === 'en') setEditingItem({ ...editingItem, author_en: val });
                    else setEditingItem({ ...editingItem, author: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                  placeholder={
                    modalLangTab === 'uk'
                      ? `Базовий: ${editingItem.author || ''}`
                      : modalLangTab === 'en'
                      ? `RU: ${editingItem.author || ''}`
                      : 'Сергей Ковальчук'
                  }
                  required={modalLangTab === 'ru'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Должность ({modalLangTab.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={
                      modalLangTab === 'uk'
                        ? (editingItem.role_uk ?? '')
                        : modalLangTab === 'en'
                        ? (editingItem.role_en ?? '')
                        : (editingItem.role ?? '')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (modalLangTab === 'uk') setEditingItem({ ...editingItem, role_uk: val });
                      else if (modalLangTab === 'en') setEditingItem({ ...editingItem, role_en: val });
                      else setEditingItem({ ...editingItem, role: val });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    placeholder={
                      modalLangTab === 'uk'
                        ? `Базовий: ${editingItem.role || ''}`
                        : modalLangTab === 'en'
                        ? `RU: ${editingItem.role || ''}`
                        : 'Вице-президент'
                    }
                    required={modalLangTab === 'ru'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Компания ({modalLangTab.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={
                      modalLangTab === 'uk'
                        ? (editingItem.company_uk ?? '')
                        : modalLangTab === 'en'
                        ? (editingItem.company_en ?? '')
                        : (editingItem.company ?? '')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (modalLangTab === 'uk') setEditingItem({ ...editingItem, company_uk: val });
                      else if (modalLangTab === 'en') setEditingItem({ ...editingItem, company_en: val });
                      else setEditingItem({ ...editingItem, company: val });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    placeholder={
                      modalLangTab === 'uk'
                        ? `Базовий: ${editingItem.company || ''}`
                        : modalLangTab === 'en'
                        ? `RU: ${editingItem.company || ''}`
                        : 'Федерация спорта'
                    }
                    required={modalLangTab === 'ru'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Проект / Тип сотрудничества ({modalLangTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={
                    modalLangTab === 'uk'
                      ? (editingItem.project_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingItem.project_en ?? '')
                      : (editingItem.project ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingItem({ ...editingItem, project_uk: val });
                    else if (modalLangTab === 'en') setEditingItem({ ...editingItem, project_en: val });
                    else setEditingItem({ ...editingItem, project: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="Трансляция конференции на 3 зала..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Текст отзыва ({modalLangTab.toUpperCase()})
                </label>
                <textarea
                  rows={4}
                  value={
                    modalLangTab === 'uk'
                      ? (editingItem.quote_uk ?? '')
                      : modalLangTab === 'en'
                      ? (editingItem.quote_en ?? '')
                      : (editingItem.quote ?? '')
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (modalLangTab === 'uk') setEditingItem({ ...editingItem, quote_uk: val });
                    else if (modalLangTab === 'en') setEditingItem({ ...editingItem, quote_en: val });
                    else setEditingItem({ ...editingItem, quote: val });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder={
                    modalLangTab === 'uk'
                      ? `Базовий: ${editingItem.quote || ''}`
                      : modalLangTab === 'en'
                      ? `RU: ${editingItem.quote || ''}`
                      : 'Отзыв клиента...'
                  }
                  required={modalLangTab === 'ru'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  URL фото автора (общий)
                </label>
                <input
                  type="url"
                  value={editingItem.avatar}
                  onChange={(e) => setEditingItem({ ...editingItem, avatar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
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
