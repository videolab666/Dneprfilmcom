import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  Play,
  Radio,
  Send,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { publishedCasesQuery } from '../lib/publicPortfolioQueries';
import type { CaseStudy } from '../types';
import { INITIAL_CASES } from '../data/initialCases';
import { getCasePath, getCaseSlug, getMediaPreview, normalizedCaseMedia } from '../lib/caseMedia';
import { portfolioMatchesFilter, type PortfolioCategoryId } from '../lib/portfolioTaxonomy';
import { useSiteContent } from '../context/SiteContentContext';
import { ClientsMarquee } from '../components/ClientsMarquee';
import { PortfolioFilterBar } from '../components/portfolio/PortfolioFilterBar';

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
  const { settings, getLocalizedCase, l, locale } = useSiteContent();
  const [cases, setCases] = useState<CaseStudy[]>(INITIAL_CASES);
  const [category, setCategory] = useState<PortfolioCategoryId | 'all'>('all');
  const [tag, setTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inquiryCase, setInquiryCase] = useState<CaseStudy | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(publishedCasesQuery(), snapshot => {
      const loaded = snapshot.empty
        ? [...INITIAL_CASES]
        : snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CaseStudy));
      loaded.sort((a, b) => {
        const orderDelta = (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999);
        if (orderDelta !== 0) return orderDelta;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      setCases(loaded.filter(item => item.published !== false));
    }, error => {
      console.warn('Could not subscribe to cases from Firestore, using initial cases:', error);
      setCases(INITIAL_CASES.filter(item => item.published !== false));
    });
    return () => unsubscribe();
  }, []);

  const localizedCases = useMemo(
    () => cases.map(item => ({ ...getLocalizedCase(item), slug: getCaseSlug(item) })),
    [cases, getLocalizedCase],
  );

  const filteredCases = useMemo(
    () => localizedCases.filter(item => portfolioMatchesFilter(item, category, tag, searchQuery)),
    [localizedCases, category, tag, searchQuery],
  );

  const sendInquiry = async (event: FormEvent) => {
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

      <PortfolioFilterBar
        items={localizedCases}
        locale={locale}
        category={category}
        tag={tag}
        query={searchQuery}
        onCategoryChange={setCategory}
        onTagChange={setTag}
        onQueryChange={setSearchQuery}
      />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredCases.length === 0 ? (
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-lg font-bold">{l('Проєкти не знайдено', 'Проекты не найдены', 'No projects found')}</h2>
              <button type="button" onClick={() => { setSearchQuery(''); setCategory('all'); setTag('all'); }} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500">
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
