import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Search, 
  Play, 
  Sparkles, 
  Radio, 
  Video, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  X, 
  Layers, 
  Send, 
  Phone, 
  Filter,
  ShieldCheck,
  Award,
  ChevronRight
} from 'lucide-react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CaseStudy } from '../types';
import { INITIAL_CASES } from '../data/initialCases';
import { useSiteContent } from '../context/SiteContentContext';
import { ClientsMarquee } from '../components/ClientsMarquee';

export function Cases() {
  const { settings, isUk, getLocalizedCase, l } = useSiteContent();
  const [cases, setCases] = useState<CaseStudy[]>(INITIAL_CASES);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'LIVE' | 'VIDEO' | 'CONSTRUCTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  // Quick inquiry state
  const [inquiryCase, setInquiryCase] = useState<CaseStudy | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cases'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreCases = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CaseStudy[];
        firestoreCases.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setCases(firestoreCases);
      } else {
        setCases(INITIAL_CASES);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Could not subscribe to cases from Firestore, using initial cases:', err);
      setCases(INITIAL_CASES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const localizedCases = useMemo(() => {
    return cases.map(c => getLocalizedCase(c));
  }, [cases, getLocalizedCase]);

  const filteredCases = useMemo(() => {
    return localizedCases.filter(item => {
      const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        item.title.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.categoryLabel && item.categoryLabel.toLowerCase().includes(q)) ||
        (item.solution && item.solution.toLowerCase().includes(q))
      );
      return matchesCategory && matchesSearch;
    });
  }, [localizedCases, activeCategory, searchQuery]);

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name: clientName,
        phone: clientPhone,
        service: inquiryCase ? `${l("Кейс", "Кейс")}: ${inquiryCase.title}` : (l("Запит щодо портфоліо", "Запрос по портфолио")),
        eventType: inquiryCase?.category || 'Портфолио',
        message: clientNote || (inquiryCase ? `${l("Цікавить реалізація проєкту за аналогією з кейсом", "Интересует реализация проекта по аналогии с кейсом")} "${inquiryCase.title}"` : (l("Заявка зі сторінки кейсів", "Заявка со страницы кейсов"))),
        status: 'new',
        createdAt: Date.now()
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert(l("Помилка під час надсилання заявки. Будь ласка, зателефонуйте нам напряму.", "Ошибка при отправке заявки. Пожалуйста, позвоните нам напрямую."));
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { id: 'ALL', label: l("Всі проекти", "Все проекты"), count: localizedCases.length, icon: <Layers className="w-4 h-4" /> },
    { id: 'LIVE', label: l("Прямі трансляції", "Прямые трансляции"), count: localizedCases.filter(c => c.category === 'LIVE').length, icon: <Radio className="w-4 h-4" /> },
    { id: 'VIDEO', label: l("Реклама & Продакшн", "Реклама & Продакшн"), count: localizedCases.filter(c => c.category === 'VIDEO').length, icon: <Video className="w-4 h-4" /> },
    { id: 'CONSTRUCTION', label: l("Будівельний моніторинг", "Строительный мониторинг"), count: localizedCases.filter(c => c.category === 'CONSTRUCTION').length, icon: <Building2 className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* 1. Header / Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 bg-slate-950 text-white overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {l("Реалізовані проекти студії ", "Реализованные проекты студии ")}
                {settings.studioName || 'LIVE & VIDEO'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6">
              {l("Портфоліо & ", "Портфолио & ")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-500">
                {l("перевірені рішення", "проверенные решения")}
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed mb-8">
              {l("Кожен проєкт — це закінчене інженерне та творче завдання. Ми не просто знімаємо гарну картинку, а створюємо стабільний телеефір, залучаємо дилерів на міжнародних виставках або організовуємо цілодобовий відеоконтроль будівництва.", "Каждый проект — это законченная инженерная и творческая задача. Мы не просто снимаем красивую картинку, а создаем стабильный телеэфир, привлекаем дилеров на международных выставках или организуем круглосуточный видеоконтроль строительства.")}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">400+</div>
                <div className="text-xs text-slate-400 mt-0.5">{l("Виконаних робіт", "Выполненных работ")}</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">100%</div>
                <div className="text-xs text-slate-400 mt-0.5">{l("Ефірів без збоїв", "Эфиров без сбоев")}</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-400">4K HDR</div>
                <div className="text-xs text-slate-400 mt-0.5">{l("Кінооптика Sony", "Кинооптика Sony")}</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">Starlink</div>
                <div className="text-xs text-slate-400 mt-0.5">{l("Резервні канали", "Резервные каналы")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Filter Bar & Search Container */}
      <section className="sticky top-20 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                    activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={l("Пошук за клієнтом або завданням...", "Поиск по клиенту или задаче...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cases Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredCases.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {l("Проєкти не знайдено", "Проекты не найдены")}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {isUk
                  ? `За запитом «${searchQuery}» нічого не знайдено. Спробуйте змінити параметри пошуку або скинути фільтри.`
                  : `По запросу «${searchQuery}» ничего не найдено. Попробуйте изменить параметры поиска или сбросить фильтры.`}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                {l("Скинути фільтри", "Сбросить фильтры")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCases.map((cs) => (
                <div
                  key={cs.id}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Media Header */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                      <img
                        src={cs.imageUrl || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80'}
                        alt={cs.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                          {cs.category === 'LIVE' && <Radio className="w-3 h-3 text-red-400" />}
                          {cs.category === 'VIDEO' && <Video className="w-3 h-3 text-amber-400" />}
                          {cs.category === 'CONSTRUCTION' && <Building2 className="w-3 h-3 text-blue-400" />}
                          <span>{cs.categoryLabel || cs.category}</span>
                        </span>

                        {cs.videoBadge && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-bold shadow-md">
                            {cs.videoBadge}
                          </span>
                        )}
                      </div>

                      {/* Client bottom overlay */}
                      <div className="absolute bottom-3 left-3.5 right-3.5 text-xs text-slate-200 font-semibold truncate">
                        {l("Клієнт", "Клиент")}: {cs.client}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors mb-3">
                        {cs.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                        {cs.description}
                      </p>

                      {/* Metrics row */}
                      {cs.metrics && cs.metrics.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                          {cs.metrics.map((m, idx) => (
                            <div key={idx} className="text-center">
                              <div className="text-[11px] font-black text-indigo-600 truncate">{m.value}</div>
                              <div className="text-[9px] text-slate-500 truncate">{m.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Challenge & Solution snippets */}
                      <div className="space-y-3 text-xs">
                        {cs.challenge && (
                          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-slate-700">
                            <span className="font-bold text-amber-900 block mb-0.5">
                              {l("Виклик завдання:", "Вызов задачи:")}
                            </span>
                            <span className="text-slate-600 line-clamp-2">{cs.challenge}</span>
                          </div>
                        )}

                        {cs.solution && (
                          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-slate-700">
                            <span className="font-bold text-indigo-950 block mb-0.5">
                              {l("Інженерне рішення:", "Инженерное решение:")}
                            </span>
                            <span className="text-slate-600 line-clamp-2">{cs.solution}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedCase(cs)}
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>{l("Аналіз кейсу", "Разбор кейса")}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setInquiryCase(cs);
                        setSubmitted(false);
                      }}
                      className="inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200 cursor-pointer"
                    >
                      <span>{l("Хочу так само", "Хочу так же")}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Clients & Partners Strip */}
      <ClientsMarquee showStats={false} />

      {/* 4. Bottom Call-To-Action Banner */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-4 border border-indigo-500/30">
            <Award className="w-3.5 h-3.5" />
            <span>{l("Індивідуальний інженерний розрахунок", "Индивидуальный инженерный расчет")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            {l("Готові обговорити ваш ефір чи зйомку?", "Готовы обсудить ваш эфир или съемку?")}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8">
            {l("Засновник студії Олександр Пітель особисто вивчить технічне завдання, запропонує оптимальну конфігурацію знімального тракту та надасть прозорий кошторис без прихованих переплат.", "Основатель студии Александр Питель лично изучит техническое задание, предложит оптимальную конфигурацию съемочного тракта и предоставит прозрачную смету без скрытых переплат.")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                setInquiryCase(null);
                setSubmitted(false);
              }}
              className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95 cursor-pointer"
            >
              <span>{l("Залишити заявку на розрахунок", "Оставить заявку на расчет")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://www.youtube.com/@dneprfilm152/playlists"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-colors"
            >
              <Play className="w-4 h-4 text-red-500 fill-red-500" />
              <span>{l("Дивитися плейлисти на YouTube", "Смотреть плейлисты на YouTube")}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </section>

      {/* MODAL 1: Full Case Study Breakdown Details */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCase(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Banner */}
            <div className="relative aspect-video bg-slate-900">
              <img
                src={selectedCase.imageUrl || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80'}
                alt={selectedCase.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold mb-2">
                  {selectedCase.categoryLabel || selectedCase.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black leading-tight">
                  {selectedCase.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                  {l("Замовник", "Заказчик")}: {selectedCase.client}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Metrics bar if available */}
              {selectedCase.metrics && selectedCase.metrics.length > 0 && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                  {selectedCase.metrics.map((m, idx) => (
                    <div key={idx} className="text-center">
                      <div className="text-sm font-black text-indigo-700">{m.value}</div>
                      <div className="text-[10px] text-slate-500">{m.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {l("Огляд проєкту", "Обзор проекта")}
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedCase.description}
                </p>
              </div>

              {/* Challenge */}
              {selectedCase.challenge && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center">
                    <span>{l("Складність та виклик завдання", "Сложность и вызов задачи")}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {selectedCase.challenge}
                  </p>
                </div>
              )}

              {/* Solution */}
              {selectedCase.solution && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1 flex items-center">
                    <span>{l("Інженерне рішення та знімальний сетап", "Инженерное решение и съемочный сетап")}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {selectedCase.solution}
                  </p>
                </div>
              )}

              {/* Result */}
              {selectedCase.result && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1 flex items-center">
                    <span>{l("Підсумковий результат та показники", "Итоговый результат и показатели")}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {selectedCase.result}
                  </p>
                </div>
              )}

              {/* Action buttons inside modal */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3 items-center justify-between">
                <a
                  href={selectedCase.videoUrl || "https://www.youtube.com/@dneprfilm152"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                  <span>{l("Відкрити на YouTube каналі", "Открыть на YouTube каналу")}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <button
                  onClick={() => {
                    const c = selectedCase;
                    setSelectedCase(null);
                    setInquiryCase(c);
                    setSubmitted(false);
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <span>{l("Замовити подібний проєкт", "Заказать подобный проект")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Project Inquiry Modal */}
      {inquiryCase !== undefined && inquiryCase !== null && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setInquiryCase(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {l("Заявку успішно надіслано!", "Заявка успешно отправлена!")}
                </h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  {l("Олександр Пітель зв'яжеться з вами протягом 15 хвилин для обговорення завдання та складання кошторису.", "Александр Питель свяжется с вами в течение 15 минут для обсуждения задачи и составления сметы.")}
                </p>
                <button
                  onClick={() => setInquiryCase(null)}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  {l("Закрити", "Закрыть")}
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                    {l("Швидкий розрахунок проєкту", "Быстрый расчет проекта")}
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    {l("Хочу проєкт як", "Хочу проект как")}: {inquiryCase.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {l("Вкажіть ваші контактні дані, і ми підготуємо кошторис за аналогічною схемою виробництва.", "Укажите ваши контактные данные, и мы подготовим смету по аналогичной схеме производства.")}
                  </p>
                </div>

                <form onSubmit={handleSendInquiry} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {l("Ваше ім'я / Компанія *", "Ваше имя / Компания *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={l("Іван, Торгова марка", "Иван, Торговая марка")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {l("Телефон / Telegram / WhatsApp *", "Телефон / Telegram / WhatsApp *")}
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+380 (__) ___-__-__"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {l("Коментар або побажання щодо дати / локації", "Комментарий или пожелания по дате / локации")}
                    </label>
                    <textarea
                      rows={3}
                      value={clientNote}
                      onChange={(e) => setClientNote(e.target.value)}
                      placeholder={l("Потрібен аналогічний ефір / ролик наступного місяця...", "Нужен аналогичный эфир / ролик в следующем месяце...")}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {submitting
                        ? (l("Відправка заявки...", "Отправка заявки..."))
                        : (l("Отримати кошторис проєкту", "Получить смету проекта"))}
                    </span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
