import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  BookOpen, 
  Radio, 
  Video, 
  Wifi, 
  Mic, 
  Compass, 
  Sun, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Calendar, 
  Clock, 
  User, 
  Share2, 
  Send, 
  Check, 
  HelpCircle,
  FileCheck,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  MEDIA_ARTICLES, 
  TECH_RIDER_ITEMS, 
  DOWNLOADABLE_DOCS, 
  MEDIA_ARTICLES_UK,
  TECH_RIDER_ITEMS_UK,
  DOWNLOADABLE_DOCS_UK,
  MediaArticle, 
  DownloadableDoc 
} from '../data/mediaCenterData';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSiteContent } from '../context/SiteContentContext';

type TabType = 'articles' | 'rider' | 'docs';
type CategoryFilter = 'all' | 'live' | 'video' | 'construction' | 'photo' | 'tech';

export function MediaCenter() {
  const { isUk } = useSiteContent();
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [readingArticle, setReadingArticle] = useState<MediaArticle | null>(null);
  const [downloadSuccessDocId, setDownloadSuccessDocId] = useState<string | null>(null);

  // Localized data lists
  const articlesList = isUk ? MEDIA_ARTICLES_UK : MEDIA_ARTICLES;
  const riderItemsList = isUk ? TECH_RIDER_ITEMS_UK : TECH_RIDER_ITEMS;
  const downloadableDocsList = isUk ? DOWNLOADABLE_DOCS_UK : DOWNLOADABLE_DOCS;

  // Quick Consultation Form
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articlesList.filter(article => {
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [articlesList, selectedCategory, searchQuery]);

  const handleDownloadDoc = (doc: DownloadableDoc) => {
    setDownloadSuccessDocId(doc.id);
    
    // Simulate generation and download of file
    const element = document.createElement('a');
    const file = new Blob([
      `Dneprfilm Media Production - ${doc.title}\n\n${isUk ? 'Документ' : 'Документ'}: ${doc.downloadName}\n${isUk ? 'Дата вивантаження' : 'Дата выгрузки'}: ${new Date().toLocaleDateString()}\n\n${isUk ? 'Контакти продюсера' : 'Контакты продюсера'}:\n${isUk ? 'Олександр Пітель' : 'Александр Питель'}\nEmail: Dneprfilmcom@gmail.com\n${isUk ? 'Телефон' : 'Телефон'} / Telegram: +380 (50) 000-00-00\n\n${isUk ? 'Технічна база: Мобільна ПТС vMix 4K, Starlink v2, Sony Cinema Line, DJI Mavic 3 Cine' : 'Техническая база: Мобильная ПТС vMix 4K, Starlink v2, Sony Cinema Line, DJI Mavic 3 Cine'}`
    ], { type: 'text/plain' });
    
    element.href = URL.createObjectURL(file);
    element.download = doc.downloadName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setTimeout(() => {
      setDownloadSuccessDocId(null);
    }, 4000);
  };

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      setFormError(isUk ? 'Будь ласка, введіть ваше ім\'я та номер телефону' : 'Пожалуйста, введите ваше имя и номер телефона');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await addDoc(collection(db, 'leads'), {
        source: 'media_center_consultation',
        name: contactName,
        phone: contactPhone,
        question: questionText || (isUk ? 'Запит на консультацію з Медіа-центру' : 'Запрос консультации из Медиа-центра'),
        status: 'new',
        createdAt: serverTimestamp()
      });

      setIsSubmitted(true);
      setContactName('');
      setContactPhone('');
      setQuestionText('');
    } catch (err) {
      console.error('Error submitting media center lead:', err);
      setFormError(isUk ? 'Сталася помилка під час надсилання. Будь ласка, спробуйте знову.' : 'Произошла ошибка при отправке. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRiderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Radio': return <Radio className="w-5 h-5 text-indigo-400" />;
      case 'Video': return <Video className="w-5 h-5 text-indigo-400" />;
      case 'Wifi': return <Wifi className="w-5 h-5 text-indigo-400" />;
      case 'Mic': return <Mic className="w-5 h-5 text-indigo-400" />;
      case 'Compass': return <Compass className="w-5 h-5 text-indigo-400" />;
      case 'Sun': return <Sun className="w-5 h-5 text-indigo-400" />;
      default: return <Cpu className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isUk ? 'База знань & Технічний хаб Dneprfilm' : 'База знаний & Технический хаб Dneprfilm'}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {isUk ? 'Media Center: Практика, Райдери & Експертиза' : 'Media Center: Практика, Райдеры & Экспертиза'}
            </h1>

            <p className="mt-6 text-lg text-slate-300 font-normal leading-relaxed">
              {isUk
                ? 'Інженерні чек-листи підготовки трансляцій, гайди з відеовиробництва для бізнесу, офіційний технічний райдер мобільної ПТС vMix та шаблони брифів для економії вашого часу.'
                : 'Инженерные чек-листы подготовки трансляций, гайды по видеопроизводству для бизнеса, официальный технический райдер мобильной ПТС vMix и скачиваемые шаблоны брифов для экономии вашего времени.'}
            </p>

            {/* Quick Navigation Tabs */}
            <div className="mt-10 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('articles')}
                className={`inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  activeTab === 'articles'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>
                  {isUk ? 'Експертні статті & Гайди' : 'Экспертные статьи & Гайды'} ({articlesList.length})
                </span>
              </button>

              <button
                onClick={() => setActiveTab('rider')}
                className={`inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  activeTab === 'rider'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>
                  {isUk ? 'Технічний парк & Райдер ПТС' : 'Технический парк & Райдер ПТС'} ({riderItemsList.length})
                </span>
              </button>

              <button
                onClick={() => setActiveTab('docs')}
                className={`inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  activeTab === 'docs'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>
                  {isUk ? 'Шаблони брифів & Документи' : 'Скачиваемые брифы & Документы'} ({downloadableDocsList.length})
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* 2. TAB CONTENT 1: ARTICLES & GUIDES */}
      {activeTab === 'articles' && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Controls: Search and Categories */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-8 border-b border-slate-200">
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isUk ? 'Пошук за темою (Starlink, інтерв\'ю, таймлапс, звук)...' : 'Поиск по теме (Starlink, интервью, таймлапс, звук)...'}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {isUk ? 'Всі статті' : 'Все статьи'}
              </button>
              <button
                onClick={() => setSelectedCategory('live')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'live'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {isUk ? 'LIVE & Стрімінг' : 'LIVE & Стриминг'}
              </button>
              <button
                onClick={() => setSelectedCategory('video')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'video'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {isUk ? 'Відеовиробництво' : 'Видеопроизводство'}
              </button>
              <button
                onClick={() => setSelectedCategory('construction')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'construction'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {isUk ? 'Будівництво & Таймлапс' : 'Стройка & Таймлапс'}
              </button>
              <button
                onClick={() => setSelectedCategory('photo')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'photo'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {isUk ? 'Фото & Світло' : 'Фото & Свет'}
              </button>
              <button
                onClick={() => setSelectedCategory('tech')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'tech'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {isUk ? 'Звук & Інженерія' : 'Звук & Инженерия'}
              </button>
            </div>
          </div>

          {/* Articles Grid */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">
                {isUk ? 'Статей за цим запитом не знайдено' : 'Статей по данному запросу не найдено'}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                {isUk
                  ? 'Спробуйте скинути пошуковий запит або обрати іншу категорію'
                  : 'Попробуйте сбросить поисковый запрос или выбрать другую категорию'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                {isUk ? 'Показати всі матеріали' : 'Показать все материалы'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => setReadingArticle(article)}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Cover image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900/85 backdrop-blur-md text-white">
                          {article.categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mb-3">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          {article.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {article.readTime}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="mt-3 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                    <span className="flex items-center text-slate-500 font-normal">
                      <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {article.author}
                    </span>
                    <span className="flex items-center">
                      {isUk ? 'Читати статтю' : 'Читать статью'}
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}


      {/* 3. TAB CONTENT 2: TECH RIDER & EQUIPMENT FLEET */}
      {activeTab === 'rider' && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {isUk ? 'Власна матеріально-технічна база' : 'Собственная материально-техническая база'}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              {isUk ? 'Технічний райдер та парк обладнання Dneprfilm' : 'Технический райдер и парк оборудования Dneprfilm'}
            </h2>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed">
              {isUk
                ? 'Ми не беремо техніку в перенайм третіх осіб в останній момент: усе обладнання у власності студії, обслуговане, протестоване та готове до виїзду на ПТС протягом 2 годин.'
                : 'Мы не берем технику в перенаем третьих лиц в последний момент: всё оборудование находится в собственности студии, обслужено, протестировано и готово к выезду на ПТС в течение 2 часов.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riderItemsList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      {renderRiderIcon(item.icon)}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      {item.status}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    {item.category}
                  </span>

                  <h3 className="text-lg font-bold text-slate-900 mt-1 mb-3">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    {isUk ? 'Специфікація сетапу:' : 'Спецификация сетапа:'}
                  </span>
                  {item.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-center text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mr-2 shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick CTA to download full PDF Rider */}
          <div className="mt-12 bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold">
                {isUk ? 'Потрібен офіційний PDF-райдер для техслужби майданчика?' : 'Нужен официальный PDF-райдер для техслужбы площадки?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isUk
                  ? 'Завантажте докладні вимоги щодо живлення, комутації та розсадки режисерської групи.'
                  : 'Скачайте подробные требования по питанию, коммутации и рассадке режиссерской группы.'}
              </p>
            </div>
            <button
              onClick={() => handleDownloadDoc(downloadableDocsList[0])}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shrink-0 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              <span>{isUk ? 'Завантажити PDF-райдер ПТС (1.8 MB)' : 'Скачать PDF-райдер ПТС (1.8 MB)'}</span>
            </button>
          </div>
        </section>
      )}


      {/* 4. TAB CONTENT 3: DOWNLOADABLE DOCS & TEMPLATES */}
      {activeTab === 'docs' && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {isUk ? 'Робоча документація & Брифи' : 'Рабочая документация & Брифы'}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              {isUk ? 'Шаблони та документи для погодження' : 'Шаблоны и документы для согласования'}
            </h2>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed">
              {isUk
                ? 'Завантажуйте типові брифи на відеовиробництво, чек-листи перевірки локацій та юридичні реквізити для швидкого оформлення безготівкового розрахунку.'
                : 'Скачивайте типовые брифы на видеопроизводство, чек-листы проверки площадок и юридические реквизиты для быстрого оформления безналичного расчета.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {downloadableDocsList.map((doc) => {
              const isDownloaded = downloadSuccessDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700">
                        {doc.format} • {doc.fileSize}
                      </span>
                      <FileCheck className="w-5 h-5 text-indigo-500" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {doc.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                      {doc.description}
                    </p>
                  </div>

                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      {doc.downloadName}
                    </span>

                    <button
                      onClick={() => handleDownloadDoc(doc)}
                      className={`inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isDownloaded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      }`}
                    >
                      {isDownloaded ? (
                        <>
                          <Check className="w-4 h-4 mr-1.5" />
                          <span>{isUk ? 'Файл завантажено!' : 'Файл выгружен!'}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1.5" />
                          <span>{isUk ? 'Завантажити файл' : 'Скачать файл'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}


      {/* 5. ARTICLE READER MODAL (FULLSCREEN READING EXPERIENCE) */}
      {readingArticle && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setReadingArticle(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Cover */}
            <div className="relative aspect-[21/9] w-full bg-slate-900 overflow-hidden rounded-t-3xl">
              <img
                src={readingArticle.coverImage}
                alt={readingArticle.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setReadingArticle(null)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white transition-colors cursor-pointer"
                title={isUk ? 'Закрити статтю' : 'Закрыть статью'}
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6">
                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-indigo-600 text-white">
                  {readingArticle.categoryLabel}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-10">
              <div className="flex items-center space-x-3 text-xs text-slate-400 mb-4">
                <span>{readingArticle.date}</span>
                <span>•</span>
                <span>{readingArticle.readTime}</span>
                <span>•</span>
                <span>{isUk ? 'Автор' : 'Автор'}: {readingArticle.author}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {readingArticle.title}
              </h2>

              <p className="mt-4 text-sm sm:text-base font-medium text-slate-600 italic border-l-4 border-indigo-500 pl-4 py-1">
                {readingArticle.summary}
              </p>

              {/* Key Takeaways Box */}
              <div className="mt-6 p-5 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" />
                  <span>{isUk ? 'Ключові інженерні висновки:' : 'Ключевые инженерные выводы:'}</span>
                </h4>
                <ul className="space-y-2">
                  {readingArticle.keyTakeaways.map((takeaway, tIdx) => (
                    <li key={tIdx} className="flex items-start text-xs sm:text-sm text-indigo-950">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 mt-0.5 shrink-0" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Article Paragraphs */}
              <div className="mt-8 space-y-5 text-sm sm:text-base text-slate-700 leading-relaxed">
                {readingArticle.content.map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>

              {/* Article Footer & Consultation Prompt */}
              <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  {isUk
                    ? 'Сподобався матеріал? Обговоріть впровадження рішення з автором.'
                    : 'Понравился материал? Обсудите внедрение решения с автором.'}
                </div>
                <button
                  onClick={() => {
                    setReadingArticle(null);
                    const consultElement = document.getElementById('consultation-form');
                    if (consultElement) consultElement.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {isUk ? 'Поставити запитання Олександру Пітелю' : 'Задать вопрос Александру Пителю'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 6. ASK AN ENGINEER / EXPERT CONSULTATION FORM */}
      <section id="consultation-form" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {isUk ? 'Технічна підтримка & Консультація' : 'Техническая поддержка & Консультация'}
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-2">
                {isUk ? 'Є нестандартне технічне завдання?' : 'Есть нестандартная техническая задача?'}
              </h2>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                {isUk
                  ? 'Потрібна трансляція з кар\'єру, зйомка в чистій зоні операційної, інтеграція Starlink на яхті або розрахунок кошторису таймлапсу на 2 роки? Залиште запитання — Олександр Пітель розбере вашу задачу з технічної точки зору.'
                  : 'Нужна трансляция с карьера, съемка в чистой зоне операционной, интеграция Starlink на яхте или расчет сметы таймлапса на 2 года? Оставьте вопрос — Александр Питель разберет вашу задачу с технической точки зрения.'}
              </p>

              {isSubmitted ? (
                <div className="mt-8 p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div className="text-sm">
                    <strong>{isUk ? 'Дякуємо за звернення!' : 'Спасибо за обращение!'}</strong>{' '}
                    {isUk
                      ? 'Олександр Пітель зв\'яжеться з вами протягом робочого дня.'
                      : 'Александр Питель свяжется с вами в течение рабочего дня.'}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConsultationSubmit} className="mt-8 space-y-4">
                  {formError && (
                    <div className="p-3 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder={isUk ? 'Ваше ім\'я' : 'Ваше имя'}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <input
                      type="tel"
                      required
                      placeholder={isUk ? 'Номер телефону' : 'Номер телефона'}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <textarea
                    rows={3}
                    placeholder={isUk
                      ? 'Опишіть завдання або параметри майданчика (місто, дата, кількість камер, наявність інтернету)...'
                      : 'Опишите задачу или параметры площадки (город, дата, количество камер, наличие интернета)...'}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                  ></textarea>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>{isUk ? 'Надсилання...' : 'Отправка...'}</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{isUk ? 'Отримати експертну консультацію' : 'Получить экспертную консультацию'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
