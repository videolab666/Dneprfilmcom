import React, { useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  FileText,
  Plus,
  Trash2,
  X } from 'lucide-react';
import { collection,
  doc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Article, ArticleCategory, ArticleTranslation, Locale } from '../../types';
import { articleCategoryLabel, normalizeArticle, slugifyArticleTitle } from '../../lib/articleCms';
import { requestPublishApproval } from '../../lib/publishQuality';
import { AdminImageField } from './AdminImageField';

import { versionedDeleteDoc as deleteDoc, versionedSetDoc as setDoc } from '../../lib/cmsVersioning';

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

const CATEGORIES: ArticleCategory[] = ['live', 'video', 'construction', 'photo', 'tech'];

function emptyTranslation(locale: Locale): ArticleTranslation {
  return {
    title: '',
    categoryLabel: articleCategoryLabel('live', locale),
    readTime: locale === 'uk' ? '5 хв читання' : locale === 'en' ? '5 min read' : '5 мин чтения',
    date: new Date().toLocaleDateString(locale === 'uk' ? 'uk-UA' : locale === 'en' ? 'en-GB' : 'ru-RU'),
    author: locale === 'uk' ? 'Олександр Пітель' : 'Александр Питель',
    summary: '',
    content: [],
    keyTakeaways: [],
  };
}

function newArticle(): Article {
  const now = Date.now();
  return {
    id: `art-${now}`,
    slug: '',
    category: 'live',
    coverImage: '',
    published: false,
    publishedAt: now,
    createdAt: now,
    ru: emptyTranslation('ru'),
    uk: emptyTranslation('uk'),
    en: emptyTranslation('en'),
  };
}

function splitParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);
}

function articleResolvedSlug(article: Article): string {
  const fallbackTitle = article.uk.title || article.ru.title || article.en?.title || article.id;
  return (article.slug || slugifyArticleTitle(fallbackTitle)).trim().toLowerCase();
}

export function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchArticles = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'articles'));
      const list = snapshot.docs
        .map(item => normalizeArticle(item.id, item.data()))
        .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt));
      setArticles(list);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const translation = useMemo<ArticleTranslation | null>(() => {
    if (!editing) return null;
    if (language === 'en') return editing.en || emptyTranslation('en');
    return editing[language];
  }, [editing, language]);

  const updateTranslation = (patch: Partial<ArticleTranslation>) => {
    if (!editing) return;
    const current = language === 'en' ? (editing.en || emptyTranslation('en')) : editing[language];
    setEditing({ ...editing, [language]: { ...current, ...patch } });
  };

  const updateCategory = (category: ArticleCategory) => {
    if (!editing) return;
    setEditing({
      ...editing,
      category,
      ru: { ...editing.ru, categoryLabel: articleCategoryLabel(category, 'ru') },
      uk: { ...editing.uk, categoryLabel: articleCategoryLabel(category, 'uk') },
      en: editing.en ? { ...editing.en, categoryLabel: articleCategoryLabel(category, 'en') } : editing.en,
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;

    const primaryTitle = editing.uk.title || editing.ru.title || editing.en?.title || '';
    if (!primaryTitle.trim()) {
      setError('Укажите заголовок статьи хотя бы на одном языке.');
      return;
    }

    const prepared: Article = {
      ...editing,
      slug: editing.slug.trim() || slugifyArticleTitle(primaryTitle),
      coverImage: editing.coverImage.trim(),
      publishedAt: editing.publishedAt || Date.now(),
      updatedAt: Date.now(),
    };

    const duplicateSlug = articles.some(article => article.id !== prepared.id && articleResolvedSlug(article) === articleResolvedSlug(prepared));
    if (prepared.published && !requestPublishApproval('article', prepared, { duplicateSlug }).allowed) return;

    setSaving(true);
    setError('');
    try {
      await setDoc(doc(db, 'articles', prepared.id), prepared);
      setEditing(null);
      await fetchArticles();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить статью? Это действие нельзя отменить.')) return;
    try {
      await deleteDoc(doc(db, 'articles', id));
      await fetchArticles();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Media Center CMS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Статьи и гайды</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Это тот же источник данных, который использует публичный Media Center. Старые встроенные статьи автоматически импортируются в Firestore и не теряются.
          </p>
        </div>
        <button
          onClick={() => { setEditing(newArticle()); setLanguage('uk'); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md"
        >
          <Plus className="w-4 h-4" /> Новая статья
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500">Загрузка статей…</div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">Статьи не найдены</h3>
          <p className="text-sm text-slate-500 mt-1">Если миграция была заблокирована, проверьте опубликованные Firestore Rules.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {articles.map(article => {
            const title = article.uk.title || article.ru.title;
            const summary = article.uk.summary || article.ru.summary;
            return (
              <article key={article.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="aspect-video bg-slate-100 overflow-hidden relative">
                  {article.coverImage ? (
                    <img src={article.coverImage} alt={title} className="w-full h-full object-cover" />
                  ) : null}
                  <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold ${article.published ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
                    {article.published ? 'Опубликована' : 'Черновик'}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-bold uppercase tracking-wide text-indigo-600 mb-2">{article.category}</div>
                  <h3 className="font-bold text-slate-900 leading-snug">{title}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3 flex-1">{summary}</p>
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-400">/{article.slug}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(article); setLanguage('uk'); }} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50" title="Редактировать">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(article.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Удалить">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && translation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto">
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Редактор статьи</h3>
                  <p className="text-xs text-slate-500 mt-1">ID: {editing.id}</p>
                </div>
                <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="text-xs font-bold text-slate-700">
                  Категория
                  <select value={editing.category} onChange={e => updateCategory(e.target.value as ArticleCategory)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-normal text-sm">
                    {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700 lg:col-span-2">
                  Slug
                  <input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="auto-from-title" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} className="w-4 h-4" />
                  Опубликована
                </label>
              </div>

              <AdminImageField
                label="Обложка статьи"
                value={editing.coverImage || ''}
                onChange={coverImage => setEditing({ ...editing, coverImage })}
                previewAlt={editing.uk.title || editing.ru.title || editing.en?.title || 'Обложка статьи'}
                helperText="Новое фото автоматически оптимизируется и сохраняется в медиатеке. При необходимости можно оставить внешний URL."
              />

              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {LANGS.map(item => (
                  <button key={item.id} type="button" onClick={() => setLanguage(item.id)} className={`px-4 py-2 rounded-xl text-sm font-bold ${language === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">
                  Заголовок
                  <input required={language !== 'en'} value={translation.title} onChange={e => updateTranslation({ title: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Подпись категории
                  <input value={translation.categoryLabel} onChange={e => updateTranslation({ categoryLabel: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Автор
                  <input value={translation.author} onChange={e => updateTranslation({ author: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Дата (текст на сайте)
                  <input value={translation.date} onChange={e => updateTranslation({ date: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Время чтения
                  <input value={translation.readTime} onChange={e => updateTranslation({ readTime: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">
                  Краткое описание
                  <textarea rows={3} value={translation.summary} onChange={e => updateTranslation({ summary: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">
                  Основной текст — абзацы разделяйте пустой строкой
                  <textarea rows={11} value={translation.content.join('\n\n')} onChange={e => updateTranslation({ content: splitParagraphs(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm leading-relaxed" />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">
                  Ключевые выводы — один пункт на строку
                  <textarea rows={5} value={translation.keyTakeaways.join('\n')} onChange={e => updateTranslation({ keyTakeaways: splitLines(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 font-normal text-sm" />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700">Отмена</button>
                <button type="submit" disabled={saving} className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50">
                  {saving ? 'Сохраняю…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
