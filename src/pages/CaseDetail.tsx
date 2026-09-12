import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addDoc, collection, onSnapshot } from 'firebase/firestore';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Copy,
  MapPin,
  Radio,
  Send,
  Video,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { INITIAL_CASES } from '../data/initialCases';
import type { CaseStudy } from '../types';
import { getCaseSlug, getMediaPreview, normalizedCaseMedia } from '../lib/caseMedia';
import { useSiteContent } from '../context/SiteContentContext';
import { CaseMediaGallery } from '../components/cases/CaseMediaGallery';

function categoryIcon(category: CaseStudy['category']) {
  if (category === 'LIVE') return <Radio className="h-4 w-4" />;
  if (category === 'CONSTRUCTION') return <Building2 className="h-4 w-4" />;
  return <Video className="h-4 w-4" />;
}

export function CaseDetail() {
  const { slug = '' } = useParams();
  const { locale, getLocalizedCase, settings, l } = useSiteContent();
  const [cases, setCases] = useState<CaseStudy[]>(INITIAL_CASES);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const unsubscribe = onSnapshot(collection(db, 'cases'), snapshot => {
      if (!snapshot.empty) {
        setCases(snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CaseStudy)));
      } else {
        setCases(INITIAL_CASES);
      }
      setLoading(false);
    }, error => {
      console.warn('Could not load case details from Firestore, using bundled cases:', error);
      setCases(INITIAL_CASES);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [slug]);

  const rawCase = useMemo(() => {
    const decoded = decodeURIComponent(slug);
    return cases.find(item => item.published !== false && (getCaseSlug(item) === decoded || item.id === decoded)) || null;
  }, [cases, slug]);

  const currentCase = rawCase ? getLocalizedCase(rawCase) : null;

  const location = rawCase
    ? locale === 'uk'
      ? rawCase.location_uk || rawCase.location || rawCase.location_en
      : locale === 'en'
        ? rawCase.location_en || rawCase.location_uk || rawCase.location
        : rawCase.location || rawCase.location_uk || rawCase.location_en
    : '';

  const media = useMemo(() => {
    if (!rawCase) return [];
    const items = normalizedCaseMedia(rawCase);
    if (items.length <= 1) return [];
    return items.filter(item => !(item.type === 'image' && rawCase.imageUrl && item.url === rawCase.imageUrl));
  }, [rawCase]);

  const heroImage = rawCase?.imageUrl || (rawCase ? normalizedCaseMedia(rawCase).map(getMediaPreview).find(Boolean) || '' : '');

  useEffect(() => {
    if (!currentCase) return;
    const title = `${currentCase.title} — Dneprfilm`;
    const description = currentCase.description || currentCase.result || currentCase.challenge || '';
    document.title = title;

    const setMeta = (selector: string, attr: string, attrValue: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', description.slice(0, 220));
    setMeta('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large');
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description.slice(0, 220));
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
    if (heroImage) setMeta('meta[property="og:image"]', 'property', 'og:image', heroImage);
  }, [currentCase, heroImage]);

  const submitInquiry = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentCase || !name.trim() || !phone.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name: name.trim(),
        phone: phone.trim(),
        service: `${l('Кейс', 'Кейс', 'Case')}: ${currentCase.title}`,
        eventType: currentCase.category,
        message: message.trim() || l(
          `Цікавить схожий проєкт на «${currentCase.title}»`,
          `Интересует похожий проект на «${currentCase.title}»`,
          `Interested in a project similar to “${currentCase.title}”`,
        ),
        status: 'new',
        createdAt: Date.now(),
      });
      setSent(true);
    } catch (error) {
      console.error('Could not submit case inquiry:', error);
      alert(l(
        'Не вдалося надіслати заявку. Будь ласка, зателефонуйте нам напряму.',
        'Не удалось отправить заявку. Пожалуйста, позвоните нам напрямую.',
        'Could not send the request. Please call us directly.',
      ));
    } finally {
      setSending(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable in some embedded browsers.
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-b-indigo-600" />
      </div>
    );
  }

  if (!currentCase || !rawCase) {
    return (
      <section className="min-h-[70vh] bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">{l('Кейс не знайдено', 'Кейс не найден', 'Case not found')}</h1>
          <p className="mt-3 text-sm text-slate-500">{l(
            'Можливо, посилання застаріло або проєкт було переміщено.',
            'Возможно, ссылка устарела или проект был перемещён.',
            'The link may be outdated or the project may have moved.',
          )}</p>
          <Link to="/cases" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500">
            <ArrowLeft className="h-4 w-4" />
            {l('До портфоліо', 'К портфолио', 'Back to portfolio')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {heroImage && (
          <div className="absolute inset-0">
            <img src={heroImage} alt="" className="h-full w-full object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <Link to="/cases" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            {l('Усі кейси', 'Все кейсы', 'All case studies')}
          </Link>

          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                {categoryIcon(currentCase.category)}
                {currentCase.categoryLabel || currentCase.category}
              </span>
              {rawCase.videoBadge && (
                <span className="rounded-full bg-indigo-500/90 px-3 py-1.5 text-xs font-bold">{rawCase.videoBadge}</span>
              )}
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{currentCase.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-xl">{currentCase.description}</p>

            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-300">
              <span className="font-semibold text-white">{l('Клієнт', 'Клиент', 'Client')}: {currentCase.client}</span>
              {rawCase.year && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{rawCase.year}</span>}
              {location && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{location}</span>}
              <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 text-slate-300 transition hover:text-white">
                <Copy className="h-4 w-4" />
                {copied ? l('Скопійовано', 'Скопировано', 'Copied') : l('Скопіювати посилання', 'Скопировать ссылку', 'Copy link')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-10">
            {currentCase.metrics && currentCase.metrics.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {currentCase.metrics.map((metric, index) => (
                  <div key={`${metric.label}-${index}`} className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
                    <div className="text-xl font-black text-indigo-700">{metric.value}</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500">{metric.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-3">
              {currentCase.challenge && (
                <article className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{l('Завдання', 'Задача', 'Challenge')}</div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{currentCase.challenge}</p>
                </article>
              )}
              {currentCase.solution && (
                <article className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">{l('Рішення', 'Решение', 'Solution')}</div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{currentCase.solution}</p>
                </article>
              )}
              {currentCase.result && (
                <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{l('Результат', 'Результат', 'Result')}</div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{currentCase.result}</p>
                </article>
              )}
            </div>

            {media.length > 0 && (
              <div>
                <div className="mb-6">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">{l('Медіа проєкту', 'Медиа проекта', 'Project media')}</div>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{l('Фото та відео', 'Фото и видео', 'Photos and video')}</h2>
                </div>
                <CaseMediaGallery media={media} caseTitle={currentCase.title} />
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {sent ? (
                <div className="py-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-xl font-black">{l('Заявку надіслано', 'Заявка отправлена', 'Request sent')}</h2>
                  <p className="mt-2 text-sm text-slate-500">{l(
                    'Ми зв’яжемося з вами та обговоримо схожий проєкт.',
                    'Мы свяжемся с вами и обсудим похожий проект.',
                    'We will contact you to discuss a similar project.',
                  )}</p>
                </div>
              ) : (
                <form onSubmit={submitInquiry} className="space-y-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">{l('Схожий проєкт', 'Похожий проект', 'Similar project')}</div>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">{l('Обговорити реалізацію', 'Обсудить реализацию', 'Discuss your project')}</h2>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{l(
                      'Залиште контакти — ми орієнтуватимемося на цей кейс під час розмови.',
                      'Оставьте контакты — мы будем ориентироваться на этот кейс при разговоре.',
                      'Leave your details and we will use this case as a reference point.',
                    )}</p>
                  </div>
                  <input
                    required
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder={l('Ваше ім’я', 'Ваше имя', 'Your name')}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <input
                    required
                    value={phone}
                    onChange={event => setPhone(event.target.value)}
                    placeholder={l('Телефон', 'Телефон', 'Phone')}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <textarea
                    rows={4}
                    value={message}
                    onChange={event => setMessage(event.target.value)}
                    placeholder={l('Що хочете зробити?', 'Что хотите сделать?', 'What would you like to create?')}
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? l('Надсилання…', 'Отправка…', 'Sending…') : l('Отримати розрахунок', 'Получить расчёт', 'Get a quote')}
                  </button>
                </form>
              )}

              <div className="mt-5 border-t border-slate-100 pt-5 text-xs text-slate-500">
                {settings.phone && (
                  <a href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`} className="font-bold text-slate-900 hover:text-indigo-600">{settings.phone}</a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-4 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-950">{l('Подивитися інші роботи', 'Посмотреть другие работы', 'Explore more work')}</h2>
            <p className="mt-1 text-sm text-slate-500">{l('Відео, LIVE та будівельний медіасупровід.', 'Видео, LIVE и строительное медиасопровождение.', 'Video, live production and construction media projects.')}</p>
          </div>
          <Link to="/cases" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-600">
            {l('Все портфоліо', 'Всё портфолио', 'Full portfolio')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
