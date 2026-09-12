import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Play,
  Radio,
  Search,
  Send,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CaseStudy } from '../types';
import { INITIAL_CASES } from '../data/initialCases';
import { getCasePath, getMediaPreview, normalizedCaseMedia } from '../lib/caseMedia';
import { useSiteContent } from '../context/SiteContentContext';
import { ClientsMarquee } from '../components/ClientsMarquee';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80';

function categoryIcon(category: CaseStudy['category']) {
  if (category === 'LIVE') return <Radio className="h-3.5 w-3.5" />;
  if (category === 'CONSTRUCTION') return <Building2 className="h-3.5 w-3.5" />;
  return <Video className="h-3.5 w-3.5" />;
}

function coverForCase(item: CaseStudy): string {
  if (item.imageUrl) return item.imageUrl;
  const mediaPreview = normalizedCaseMedia(item).map(getMediaPreview).find(Boolean);
  return mediaPreview || FALLBACK_COVER;
}

export function Cases() {
  const { settings, getLocalizedCase, l } = useSiteContent();
  const [cases, setCases] = useState<CaseStudy[]>(INITIAL_CASES);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'LIVE' | 'VIDEO' | 'CONSTRUCTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inquiryCase, setInquiryCase] = useState<CaseStudy | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cases'), snapshot => {
      const loaded = snapshot.empty
        ? INITIAL_CASES
        : snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CaseStudy));
      loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setCases(loaded.filter(item => item.published !== false));
      setLoading(false);
    }, error => {
      console.warn('Could not subscribe to cases from Firestore, using initial cases:', error);
      setCases(INITIAL_CASES.filter(item => item.published !== false));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const localizedCases = useMemo(() => cases.map(item => getLocalizedCase(item)), [cases, getLocalizedCase]);

  const filteredCases = useMemo(() => {
    return localizedCases.filter(item => {
      const categoryMatch = activeCategory === 'ALL' || item.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return categoryMatch;
      const searchMatch = [item.title, item.client, item.description, item.categoryLabel, item.solution]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query));
      return categoryMatch && searchMatch;
    });
  }, [localizedCases, activeCategory, searchQuery]);

  const categories = [
    { id: 'ALL', label: l('Усі проєкти', 'Все проекты', 'All projects'), count: localizedCases.length, icon: <Layers className="h-4 w-4" /> },
    { id: 'LIVE', label: l('Прямі трансляції', 'Прямые трансляции', 'Live production'), count: localizedCases.filter(item => item.category === 'LIVE').length, icon: <Radio className="h-4 w-4" /> },
    { id: 'VIDEO', label: l('Реклама & продакшн', 'Реклама & продакшн', 'Video production'), count: localizedCases.filter(item => item.category === 'VIDEO').length, icon: <Video className="h-4 w-4" /> },
    { id: 'CONSTRUCTION', label: l('Будівельний моніторинг', 'Строительный мониторинг', 'Construction media'), count: localizedCases.filter(item => item.category === 'CONSTRUCTION').length, icon: <Building2 className="h-4 w-4" /> },
  ] as const;

  const sendInquiry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inquiryCase || !clientName.trim() || !clientPhone.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name: clientName.trim(),
        phone: clientPhone.trim(),
        service: `${l('Кейс', 'Кейс', 'Case')}: ${inquiryCase.title}`,
        eventType: inquiryCase.category,
        message: clientNote.trim() || l(
          `Цікавить реалізація проєкту за аналогією з кейсом «${inquiryCase.title}»`,
          `Интересует реализация проекта по аналогии с кейсом «${inquiryCase.title}»`,
          `Interested in a project similar to “${inquiryCase.title}”`,
        ),
        status: 'new',
        createdAt: Date.now(),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting portfolio inquiry:', error);
      alert(l(
        'Помилка під час надсилання заявки. Будь ласка, зателефонуйте нам напряму.',
        'Ошибка при отправке заявки. Пожалуйста, позвоните нам напрямую.',
        'Could not send the request. Please call us directly.',
      ));
    } finally {
      setSubmitting(false);
    }
  };

  const closeInquiry = () => {
    setInquiryCase(null);
    setSubmitted(false);
    setClientName('');
    setClientPhone('');
    setClientNote('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 pb-16 pt-16 text-white lg:pb-24 lg:pt-24">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-indigo-600 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-amber-500 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              {l('Реалізовані проєкти студії', 'Реализованные проекты студии', 'Selected studio projects')}
            </div>
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {l('Портфоліо & перевірені рішення', 'Портфолио & проверенные решения', 'Portfolio & proven solutions')}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-xl">
              {l(
                'Кожен кейс — це завершене інженерне та творче завдання: від ідеї й знімального сетапу до ефіру, постпродакшну та вимірюваного результату.',
                'Каждый кейс — это законченная инженерная и творческая задача: от идеи и съёмочного сетапа до эфира, постпродакшна и измеримого результата.',
                'Each case is a complete creative and engineering project: from concept and production setup to broadcast, post-production and measurable results.',
              )}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800 pt-6 sm:grid-cols-4">
              <div><div className="text-3xl font-black">400+</div><div className="mt-1 text-xs text-slate-400">{l('Виконаних робіт', 'Выполненных работ', 'Projects delivered')}</div></div>
              <div><div className="text-3xl font-black text-amber-400">100%</div><div className="mt-1 text-xs text-slate-400">{l('Ефірів без збоїв', 'Эфиров без сбоев', 'Reliable broadcasts')}</div></div>
              <div><div className="text-3xl font-black text-indigo-400">4K</div><div className="mt-1 text-xs text-slate-400">{l('Продакшн', 'Продакшн', 'Production')}</div></div>
              <div><div className="text-3xl font-black text-emerald-400">Starlink</div><div className="mt-1 text-xs text-slate-400">{l('Резервні канали', 'Резервные каналы', 'Backup connectivity')}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-20 z-20 border-b border-slate-200 bg-white/95 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {categories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${activeCategory === category.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
              >
                {category.icon}
                <span>{category.label}</span>
                <span className={`rounded-full px-1.5 text-[10px] ${activeCategory === category.id ? 'bg-white/20' : 'bg-slate-200 text-slate-700'}`}>{category.count}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder={l('Пошук за клієнтом або завданням…', 'Поиск по клиенту или задаче…', 'Search by client or project…')}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-9 text-xs outline-none transition focus:border-indigo-500 focus:bg-white"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-b-indigo-600" /></div>
          ) : filteredCases.length === 0 ? (
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-lg font-bold">{l('Проєкти не знайдено', 'Проекты не найдены', 'No projects found')}</h2>
              <button type="button" onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500">
                {l('Скинути фільтри', 'Сбросить фильтры', 'Reset filters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredCases.map(item => {
                const media = normalizedCaseMedia(item);
                const videoCount = media.filter(mediaItem => mediaItem.type !== 'image').length;
                const imageCount = media.filter(mediaItem => mediaItem.type === 'image').length;
                return (
                  <article key={item.id} className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl">
                    <Link to={getCasePath(item)} className="relative block aspect-[16/10] overflow-hidden bg-slate-900">
                      <img src={coverForCase(item)} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
                      <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/75 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                          {categoryIcon(item.category)}
                          {item.categoryLabel || item.category}
                        </span>
                        {item.videoBadge && <span className="rounded-full bg-indigo-600/90 px-2.5 py-1 text-[10px] font-bold text-white">{item.videoBadge}</span>}
                      </div>
                      {(videoCount > 0 || imageCount > 1) && (
                        <div className="absolute bottom-3.5 right-3.5 flex gap-2">
                          {videoCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur"><Play className="h-3 w-3 fill-current" />{videoCount}</span>}
                          {imageCount > 1 && <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur"><ImageIcon className="h-3 w-3" />{imageCount}</span>}
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="text-xs font-semibold text-slate-400">{item.client}</div>
                      <Link to={getCasePath(item)} className="mt-2 text-xl font-black leading-snug text-slate-950 transition hover:text-indigo-600">{item.title}</Link>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{item.description}</p>

                      {item.metrics && item.metrics.length > 0 && (
                        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                          {item.metrics.slice(0, 3).map((metric, index) => (
                            <div key={`${metric.label}-${index}`} className="min-w-0 text-center">
                              <div className="truncate text-[11px] font-black text-indigo-600">{metric.value}</div>
                              <div className="mt-0.5 truncate text-[9px] text-slate-500">{metric.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto flex gap-3 border-t border-slate-100 pt-5">
                        <Link to={getCasePath(item)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600">
                          {l('Дивитися кейс', 'Смотреть кейс', 'View case')}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <button type="button" onClick={() => { setInquiryCase(item); setSubmitted(false); }} className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100">
                          {l('Хочу так само', 'Хочу так же', 'I want this')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ClientsMarquee showStats={false} />

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-black sm:text-4xl">{l('Готові обговорити ваш проєкт?', 'Готовы обсудить ваш проект?', 'Ready to discuss your project?')}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {l(
              'Олександр Пітель особисто вивчить завдання, запропонує оптимальну конфігурацію та прозорий кошторис.',
              'Александр Питель лично изучит задачу, предложит оптимальную конфигурацию и прозрачную смету.',
              'Oleksandr Pitel will review the brief personally and propose an efficient production setup with a transparent estimate.',
            )}
          </p>
          <Link to="/contacts" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500">
            {l('Отримати розрахунок', 'Получить расчёт', 'Get a quote')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {inquiryCase && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={closeInquiry} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
            {submitted ? (
              <div className="py-7 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>
                <h3 className="mt-4 text-xl font-black">{l('Заявку надіслано', 'Заявка отправлена', 'Request sent')}</h3>
                <p className="mt-2 text-sm text-slate-500">{l('Ми зв’яжемося з вами найближчим часом.', 'Мы свяжемся с вами в ближайшее время.', 'We will contact you shortly.')}</p>
                <button type="button" onClick={closeInquiry} className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white">OK</button>
              </div>
            ) : (
              <form onSubmit={sendInquiry} className="space-y-4">
                <div className="pr-10">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">{l('Схожий проєкт', 'Похожий проект', 'Similar project')}</div>
                  <h3 className="mt-2 text-2xl font-black">{inquiryCase.title}</h3>
                </div>
                <input required value={clientName} onChange={event => setClientName(event.target.value)} placeholder={l('Ваше ім’я', 'Ваше имя', 'Your name')} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
                <input required value={clientPhone} onChange={event => setClientPhone(event.target.value)} placeholder={l('Телефон', 'Телефон', 'Phone')} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
                <textarea rows={4} value={clientNote} onChange={event => setClientNote(event.target.value)} placeholder={l('Коротко про ваше завдання', 'Коротко о вашей задаче', 'Tell us briefly about your project')} className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500" />
                <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-60">
                  <Send className="h-4 w-4" />
                  {submitting ? l('Надсилання…', 'Отправка…', 'Sending…') : l('Надіслати заявку', 'Отправить заявку', 'Send request')}
                </button>
                {settings.phone && <div className="text-center text-xs text-slate-400">{settings.phone}</div>}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
