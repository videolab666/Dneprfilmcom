import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  X, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Article } from '../../types';

export function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'articles'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Article));
      setArticles(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    await setDoc(doc(db, 'articles', editingArticle.id), editingArticle);
    setEditingArticle(null);
    await fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить эту статью?')) {
      await deleteDoc(doc(db, 'articles', id));
      await fetchArticles();
    }
  };

  const handleStartAdd = () => {
    setEditingArticle({
      id: `art-${Date.now()}`,
      title: '',
      category: 'LIVE',
      excerpt: '',
      content: '',
      imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
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
            <FileText className="w-3.5 h-3.5" />
            <span>Медиа-центр и база знаний</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Управление статьями и гайдами
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Публикуйте технические экспертные статьи о прямых эфирах, видеопроизводстве и аэросъемке стройки.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Написать статью</span>
        </button>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка статей...</div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-slate-800 mb-1">Статей пока нет</h4>
          <p className="text-sm text-slate-500 mb-4">Нажмите «Написать статью», чтобы опубликовать первый экспертный материал.</p>
          <button
            onClick={handleStartAdd}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
          >
            Написать статью
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <div key={art.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
              {art.imageUrl && (
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {art.category}
                  </div>
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">{art.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {art.excerpt || art.content}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {art.createdAt ? new Date(art.createdAt).toLocaleDateString('ru-RU') : ''}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => { setEditingArticle(art); setIsNew(false); }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Редактировать"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(art.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-black text-slate-900">
                {isNew ? 'Новая статья' : 'Редактирование статьи'}
              </h3>
              <button
                onClick={() => setEditingArticle(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Заголовок статьи
                </label>
                <input
                  type="text"
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                  placeholder="Как организовать гибридный телемост без лагов..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Категория
                  </label>
                  <select
                    value={editingArticle.category}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="LIVE">LIVE Production</option>
                    <option value="VIDEO">Video Production</option>
                    <option value="CONSTRUCTION">Construction Media</option>
                    <option value="TECH">Технологии & ПТС</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    URL обложки
                  </label>
                  <input
                    type="url"
                    value={editingArticle.imageUrl || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Краткое превью (Excerpt)
                </label>
                <textarea
                  rows={2}
                  value={editingArticle.excerpt || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="1-2 предложения для карточки в каталоге"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Полный текст статьи
                </label>
                <textarea
                  rows={8}
                  value={editingArticle.content}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="Подробный текст статьи..."
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
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
