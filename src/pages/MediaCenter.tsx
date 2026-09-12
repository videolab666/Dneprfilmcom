import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  FileText,
  Search,
  Send,
  User,
  X,
} from 'lucide-react';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  DOWNLOADABLE_DOCS,
  DOWNLOADABLE_DOCS_UK,
  TECH_RIDER_ITEMS,
  TECH_RIDER_ITEMS_UK,
  DownloadableDoc,
} from '../data/mediaCenterData';
import { useSiteContent } from '../context/SiteContentContext';
import { Article, ArticleCategory } from '../types';
import { DEFAULT_ARTICLES, localizeArticle, normalizeArticle } from '../lib/articleCms';

type TabType = 'articles' | 'rider' | 'docs';
type CategoryFilter = 'all' | ArticleCategory;

export function MediaCenter() {
  const { locale, isUk } = useSiteContent();
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [articles, setArticles] = useState<Article[]>(DEFAULT_ARTICLES);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [downloadSuccessDocId, setDownloadSuccessDocId] = useState<string | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const articlesQuery = query(collection(db, 'articles'), where('published', '==', true));
    const unsubscribe = onSnapshot(
      articlesQuery,
      snapshot => {
        const loaded = snapshot.docs
          .map(item => normalizeArticle(item.id, item.data()))
          .filter(item => item.published)
          .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt));
        setArticles(loaded.length ? loaded : DEFAULT_ARTICLES);
        setArticlesLoading(false);
      },
      error => {
        console.warn('Could not load Media Center articles, using bundled fallback:', error.message);
        setArticles(DEFAULT_ARTICLES);
        setArticlesLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const riderItems = isUk ? TECH_RIDER_ITEMS_UK : TECH_RIDER_ITEMS;
  const downloadableDocs = isUk ? DOWNLOADABLE_DOCS_UK : DOWNLOADABLE_DOCS;

  const localizedArticles = useMemo(
    () => articles.map(article => ({ article, text: localizeArticle(article, locale) })),
    [articles, locale],
  );

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return localizedArticles.filter(({ article, text }) => {
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchesSearch = !q ||
        text.title.toLowerCase().includes(q) ||
        text.summary.toLowerCase().includes(q) ||
        text.categoryLabel.toLowerCase().includes(q) ||
        text.content.some(paragraph => paragraph.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [localizedArticles, searchQuery, selectedCategory]);

  const handleDownloadDoc = (doc: DownloadableDoc) => {
    const element = document.createElement('a');
    const file = new Blob([
      `Dneprfilm Media Production - ${doc.title}\n\n${doc.description}\n\nEmail: Dneprfilmcom@gmail.com`,
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = doc.downloadName;
    document.body.appendChild(element);
    element.click();
    URL.revokeObjectURL(element.href);
    document.body.removeChild(element);
    setDownloadSuccessDocId(doc.id);
    window.setTimeout(() => setDownloadSuccessDocId(null), 3000);
  };

  const handleConsultationSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      setFormError(isUk ? 'Вкажіть ім’я та номер телефону.' : 'Укажите имя и номер телефона.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await addDoc(collection(db, 'leads'), {
        source: 'media_center_consultation',
        name: contactName.trim(),
        phone: contactPhone.trim(),
        question: questionText.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setIsSubmitted(true);
      setContactName('');
      setContactPhone('');
      setQuestionText('');
    } catch (error) {
      console.error('Error submitting Media Center lead:', error);
      setFormError(isUk ? 'Не вдалося надіслати заявку. Спробуйте ще раз.' : 'Не удалось отправить заявку. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: Array<{ id: CategoryFilter; ru: string; uk: string }> = [
    { id: 'all', ru: 'Все статьи', uk: 'Усі статті' },
    { id: 'live', ru: 'LIVE & Стриминг', uk: 'LIVE & Стрімінг' },
    { id: 'video', ru: 'Видеопроизводство', uk: 'Відеовиробництво' },
    { id: 'construction', ru: 'Стройка & Таймлапс', uk: 'Будівництво & Таймлапс' },
    { id: 'photo', ru: 'Фото', uk: 'Фото' },
    { id: 'tech', ru: 'Технологии', uk: 'Технології' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 text-white pt-28 pb-20">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isUk ? 'База знань & Технічний хаб Dneprfilm' : 'База знаний & Технический хаб Dneprfilm'}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              {isUk ? 'Media Center: практика, райдери & експертиза' : 'Media Center: практика, райдеры & экспертиза'}
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-3xl">
              {isUk
                ? 'Практичні матеріали про прямі ефіри, відеовиробництво, будівельний моніторинг, техніку та підготовку проєктів.'
                : 'Практические материалы о прямых эфирах, видеопроизводстве, строительном мониторинге, технике и подготовке проектов.'}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <TabButton active={activeTab === 'articles'} onClick={() => setActiveTab('articles')} icon={<FileText className="w-4 h-4" />}>
                {isUk ? 'Статті & Гайди' : 'Статьи & Гайды'} ({articles.length})
              </TabButton>
              <TabButton active={activeTab === 'rider'} onClick={() => setActiveTab('rider')} icon={<Cpu className="w-4 h-4" />}>
                {isUk ? 'Технічний парк & Райдер' : 'Технический парк & Райдер'} ({riderItems.length})
              </TabButton>
              <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<Download className="w-4 h-4" />}>
                {isUk ? 'Документи & Брифи' : 'Документы & Брифы'} ({downloadableDocs.length})
              </TabButton>
            </div>
          </div>
        </div>
      </section>

      {activeTab === 'articles' && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-10 pb-8 border-b border-slate-200">
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={isUk ? 'Пошук за статтями…' : 'Поиск по статьям…'} className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 shadow-sm" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedCategory === category.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  {isUk ? category.uk : category.ru}
                </button>
              ))}
            </div>
          </div>

          {articlesLoading ? (
            <div className="py-20 text-center text-slate-500">{isUk ? 'Завантаження статей…' : 'Загрузка статей…'}</div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl text-slate-500">{isUk ? 'Нічого не знайдено.' : 'Ничего не найдено.'}</div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-7">
              {filteredArticles.map(({ article, text }) => (
                <article key={article.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow flex flex-col">
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                    {article.coverImage && <img src={article.coverImage} alt={text.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">{text.categoryLabel}</div>
                    <h2 className="text-xl font-black mt-2 leading-snug">{text.title}</h2>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed flex-1">{text.summary}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-5 pt-4 border-t border-slate-100">
                      {text.date && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{text.date}</span>}
                      {text.readTime && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{text.readTime}</span>}
                    </div>
                    <button onClick={() => setReadingArticle(article)} className="mt-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-sm font-bold transition-colors">
                      {isUk ? 'Читати статтю' : 'Читать статью'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'rider' && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {riderItems.map(item => (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-4">{item.category}</div>
                <h2 className="text-lg font-black">{item.title}</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.description}</p>
                <ul className="mt-4 space-y-2">
                  {item.specs.map(spec => <li key={spec} className="text-xs text-slate-600 flex gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{spec}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'docs' && (
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {downloadableDocs.map(docItem => (
              <div key={docItem.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between shadow-sm">
                <div>
                  <div className="flex gap-2 items-center"><FileText className="w-5 h-5 text-indigo-600" /><h2 className="font-bold">{docItem.title}</h2></div>
                  <p className="text-sm text-slate-500 mt-1">{docItem.description}</p>
                  <p className="text-xs text-slate-400 mt-2">{docItem.format} · {docItem.fileSize}</p>
                </div>
                <button onClick={() => handleDownloadDoc(docItem)} className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700">
                  {downloadSuccessDocId === docItem.id ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  {downloadSuccessDocId === docItem.id ? (isUk ? 'Готово' : 'Готово') : (isUk ? 'Завантажити' : 'Скачать')}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-950 text-white rounded-3xl p-7 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-black">{isUk ? 'Потрібна консультація по вашому проєкту?' : 'Нужна консультация по вашему проекту?'}</h2>
            <p className="text-slate-400 mt-2">{isUk ? 'Опишіть задачу — підкажемо технічну схему та формат виробництва.' : 'Опишите задачу — подскажем техническую схему и формат производства.'}</p>
            {isSubmitted ? (
              <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200 flex gap-2"><CheckCircle2 className="w-5 h-5" />{isUk ? 'Заявку надіслано.' : 'Заявка отправлена.'}</div>
            ) : (
              <form onSubmit={handleConsultationSubmit} className="mt-7 grid sm:grid-cols-2 gap-4">
                <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder={isUk ? 'Ваше ім’я' : 'Ваше имя'} className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500" />
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Телефон / Telegram" className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500" />
                <textarea value={questionText} onChange={e => setQuestionText(e.target.value)} rows={3} placeholder={isUk ? 'Коротко про задачу' : 'Коротко о задаче'} className="sm:col-span-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500" />
                {formError && <div className="sm:col-span-2 text-sm text-red-300">{formError}</div>}
                <button disabled={isSubmitting} className="sm:col-span-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold disabled:opacity-50">
                  <Send className="w-4 h-4" />{isSubmitting ? (isUk ? 'Надсилання…' : 'Отправка…') : (isUk ? 'Надіслати запит' : 'Отправить запрос')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {readingArticle && (() => {
        const text = localizeArticle(readingArticle, locale);
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setReadingArticle(null)}>
            <article className="max-w-4xl mx-auto my-6 bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={event => event.stopPropagation()}>
              {readingArticle.coverImage && <img src={readingArticle.coverImage} alt={text.title} className="w-full aspect-[16/7] object-cover" />}
              <div className="p-6 sm:p-10">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">{text.categoryLabel}</div>
                    <h1 className="text-2xl sm:text-4xl font-black leading-tight mt-2">{text.title}</h1>
                  </div>
                  <button onClick={() => setReadingArticle(null)} className="p-2 h-fit rounded-full bg-slate-100 hover:bg-slate-200"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-5 pb-6 border-b border-slate-200">
                  {text.author && <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" />{text.author}</span>}
                  {text.date && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{text.date}</span>}
                  {text.readTime && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{text.readTime}</span>}
                </div>
                <p className="mt-6 text-lg text-slate-600 font-medium leading-relaxed">{text.summary}</p>
                {text.keyTakeaways.length > 0 && (
                  <div className="my-8 rounded-2xl bg-indigo-50 border border-indigo-100 p-5">
                    <h2 className="font-black text-indigo-950 mb-3">{isUk ? 'Ключові висновки' : 'Ключевые выводы'}</h2>
                    <ul className="space-y-2">{text.keyTakeaways.map(item => <li key={item} className="text-sm text-slate-700 flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />{item}</li>)}</ul>
                  </div>
                )}
                <div className="space-y-5 text-base text-slate-700 leading-8">
                  {text.content.map((paragraph, index) => <p key={`${readingArticle.id}-${index}`}>{paragraph}</p>)}
                </div>
              </div>
            </article>
          </div>
        );
      })()}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}>
      {icon}{children}
    </button>
  );
}
