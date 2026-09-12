import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Film, 
  Play, 
  Sparkles, 
  Video, 
  Clapperboard, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Flame, 
  Factory, 
  Globe2, 
  Stethoscope, 
  Dumbbell, 
  Cpu, 
  Sliders, 
  Send, 
  Clock, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSiteContent } from '../context/SiteContentContext';
import { usePageCmsContent } from '../hooks/usePageCmsContent';
import { usePageCopyContent } from '../hooks/usePageCopyContent';

export function VideoProduction() {
  const { isUk } = useSiteContent();
  const { content: pageContent, localize } = usePageCmsContent();
  const { content: copyContent, localize: localizeCopy, byId: copyById } = usePageCopyContent();
  const videoHero = copyById(copyContent.video.hero, 'video-hero')?.text;
  const videoWorksHeading = copyById(copyContent.video.headings, 'video-heading-works')?.text;
  const videoFaqHeading = copyById(copyContent.video.headings, 'video-heading-faq')?.text;
  const cmsFaqs = localizeCopy(copyContent.video.faqs).map(item => ({ q: item.text.title || '', a: item.text.description || '' }));

  const videoIconMap: Record<string, React.ReactNode> = {
    flame: <Flame className="w-5 h-5 text-amber-500" />,
    factory: <Factory className="w-5 h-5 text-blue-500" />,
    globe: <Globe2 className="w-5 h-5 text-indigo-500" />,
    medical: <Stethoscope className="w-5 h-5 text-emerald-500" />,
    award: <Award className="w-5 h-5 text-purple-500" />,
    fitness: <Dumbbell className="w-5 h-5 text-rose-500" />,
    video: <Video className="w-5 h-5 text-indigo-500" />,
  };

  const featuredWorks = localize(pageContent.video.works).map(item => ({
    id: item.id,
    title: item.text.title || '',
    client: item.text.meta1 || '',
    category: item.text.meta2 || '',
    description: item.text.description || '',
    icon: videoIconMap[item.iconKey || 'video'] || videoIconMap.video,
    image: item.imageUrl || '',
    tags: item.text.items || [],
    results: item.text.result || '',
  }));

  const productionSteps = localize(pageContent.video.steps).map(item => ({
    step: item.text.badge || '',
    title: item.text.title || '',
    subtitle: item.text.subtitle || '',
    desc: item.text.description || '',
  }));

  // Configurator state
  const [videoType, setVideoType] = useState<'commercial' | 'factory' | 'corporate' | 'event'>('commercial');
  const [duration, setDuration] = useState<'30s' | '60s' | '2m' | '5m+'>('60s');
  const [needScript, setNeedScript] = useState<boolean>(true);
  const [needActors, setNeedActors] = useState<boolean>(false);
  const [needDrone, setNeedDrone] = useState<boolean>(true);
  const [needVoiceover, setNeedVoiceover] = useState<boolean>(true);
  const [needGraphics3D, setNeedGraphics3D] = useState<boolean>(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNote, setClientNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Approximate cost calculation
  const calculateEstimate = () => {
    let base = 15000; // Basic filming day + editing

    if (videoType === 'commercial') base += 10000;
    if (videoType === 'factory') base += 12000;
    if (videoType === 'corporate') base += 14000;
    if (videoType === 'event') base += 5000;

    if (duration === '60s') base += 3000;
    if (duration === '2m') base += 7000;
    if (duration === '5m+') base += 15000;

    if (needScript) base += 4000;
    if (needActors) base += 8000;
    if (needDrone) base += 4500;
    if (needVoiceover) base += 3000;
    if (needGraphics3D) base += 9000;

    return base;
  };

  const handleSubmitBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name: clientName,
        phone: clientPhone,
        email: clientEmail || '',
        service: isUk ? 'Відеопродакшн' : 'Видеопродакшн',
        eventType: `${isUk ? 'Відео' : 'Видео'}: ${videoType}, ${isUk ? 'хронометраж' : 'хронометраж'}: ${duration}`,
        calculatedCost: calculateEstimate(),
        calculatorDetails: {
          videoType,
          duration,
          needScript,
          needActors,
          needDrone,
          needVoiceover,
          needGraphics3D
        },
        message: clientNote || (isUk ? 'Заявка на розрахунок відеоролика' : 'Заявка на расчет видеоролика'),
        status: 'new',
        createdAt: Date.now()
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting brief:', err);
      alert(isUk ? 'Помилка під час надсилання заявки. Будь ласка, зв\'яжіться з нами напряму за телефоном.' : 'Ошибка при отправке заявки. Пожалуйста, свяжитесь с нами напрямую по телефону.');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = isUk ? [
    {
      q: 'Скільки часу займає виробництво рекламного або іміджевого ролика?',
      a: 'Стандартний цикл виробництва рекламного ролика або промо заводу займає від 10 до 20 робочих днів. За необхідності термінового продакшну до виставки або заходу ми можемо вкластися у 5–7 днів за рахунок виділення двох паралельних монтажних станцій.'
    },
    {
      q: 'На яку техніку ведеться відеозйомка?',
      a: 'Ми працюємо виключно на сертифіковане кіно- та телевізійне обладнання: камери Sony лінійки Cinema Line (FX9, FX6, FX3) з 10-бітною кольоропередачею 4:2:2, світлосильна кінооптика з кінематографічним боке, електронні стабілізатори Ronin, квадрокоптери та FPV-дрони, професійне світло Aputure та радіопетлички Sennheiser/Rode.'
    },
    {
      q: 'Чи допомагаєте ви з ідеєю, сценарієм та підбором акторів?',
      a: 'Так, ми беремо на себе повний цикл під ключ. Розробляємо 2–3 різні концепції сценарію під ваше завдання, пишемо дикторський текст, організуємо кастинг професійних акторів чи моделей, знаходимо знімальні локації та отримуємо всі необхідні дозволи.'
    },
    {
      q: 'Як ролик адаптується під Instagram Reels, TikTok та YouTube?',
      a: 'Під час монтажу ми враховуємо вимоги всіх майданчиків. Ви отримуєте основний горизонтальний майстер 16:9 у 4K для сайту, ТБ і YouTube, а також оптимізовані вертикальні версії 9:16 з великим кадруванням та анімованими субтитрами для соцмереж.'
    }
  ] : [
    {
      q: 'Сколько времени занимает производство рекламного или имиджевого ролика?',
      a: 'Стандартный цикл производства рекламного ролика или промо завода занимает от 10 до 20 рабочих дней. При необходимости срочного продакшна к выставке или мероприятию мы можем уложиться в 5–7 дней за счет выделения двух параллельных монтажных станций.'
    },
    {
      q: 'На какую технику ведется видеосъемка?',
      a: 'Мы работаем исключительно на сертифицированное кино- и телевизионное оборудование: камеры Sony линейки Cinema Line (FX9, FX6, FX3) с 10-битной цветопередачей 4:2:2, светосильная кинооптика с кинематографичным боке, электронные стабилизаторы Ronin, квадрокоптеры и FPV-дроны, профессиональный свет Aputure и радиопетлички Sennheiser/Rode.'
    },
    {
      q: 'Помогаете ли вы с идеей, сценарием и подбором актеров?',
      a: 'Да, мы берем на себя полный цикл под ключ. Разрабатываем 2–3 разных концепции сценария под вашу задачу, пишем дикторский текст, организуем кастинг профессиональных актеров или моделей, находим съемочные локации и получаем все необходимые разрешения.'
    },
    {
      q: 'Как ролик адаптируется под Instagram Reels, TikTok и YouTube?',
      a: 'При монтаже мы учитываем требования всех площадок. Вы получаете основной горизонтальный мастер 16:9 в 4K для сайта, ТВ и YouTube, а также оптимизированные вертикальные версии 9:16 с крупным кадрированием и анимированными субтитрами для соцсетей.'
    }
  ];

  return (
    <div className="bg-white min-h-screen text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-slate-950 text-white">
        {/* Ambient background glow */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
        </div>

        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{videoHero?.badge}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6">
              {videoHero?.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-500">{videoHero?.meta1}</span> {videoHero?.meta2}
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed mb-8">
              {videoHero?.description}
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="#calculator"
                className="inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
              >
                <span>{videoHero?.meta3}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="https://www.youtube.com/@dneprfilm152/playlists"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-semibold transition-colors"
              >
                <Play className="w-4 h-4 text-red-500 fill-red-500" />
                <span>YouTube @dneprfilm152</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">400+</div>
                <div className="text-xs text-slate-400 mt-0.5">{isUk ? 'Знятих відеопроєктів' : 'Снятых видеопроектов'}</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">4K 10-bit</div>
                <div className="text-xs text-slate-400 mt-0.5">Sony Cinema Line</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-400">10-20 {isUk ? 'дн.' : 'дн.'}</div>
                <div className="text-xs text-slate-400 mt-0.5">{isUk ? 'Повний цикл під ключ' : 'Полный цикл под ключ'}</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
                <div className="text-xs text-slate-400 mt-0.5">{isUk ? 'Дотримання дедлайну' : 'Соблюдение дедлайна'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Showcased Real Works from @dneprfilm152 */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
                {videoWorksHeading?.badge}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {videoWorksHeading?.title}
              </h2>
            </div>
            <p className="mt-4 md:mt-0 text-sm text-slate-600 max-w-md">
              {videoWorksHeading?.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredWorks.map((work) => (
              <div 
                key={work.id}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  <img 
                    src={work.image} 
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                  
                  {/* Category Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                      {work.icon}
                      <span>{work.category}</span>
                    </span>
                  </div>

                  {/* Client badge bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                    <span className="font-semibold truncate">{work.client}</span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2.5">
                      {work.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                      {work.description}
                    </p>
                  </div>

                  <div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {work.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Result */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <span className="font-bold text-slate-900">{isUk ? 'Результат: ' : 'Результат: '}</span>
                      {work.results}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="https://www.youtube.com/@dneprfilm152/playlists"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 text-sm font-bold shadow-sm transition-colors"
            >
              <Play className="w-4 h-4 text-red-600 fill-red-600" />
              <span>{isUk ? 'Дивитися всі відеоролики та шоу на YouTube каналі' : 'Смотреть все видеоролики и шоу на YouTube канале'}</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. Production Lifecycle (Stages 01-04) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              {isUk ? 'Прозорий процес' : 'Прозрачный процесс'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              {isUk ? 'Як ми створюємо ваше відео' : 'Как мы создаем ваше видео'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {isUk
                ? 'Чіткий покроковий процес виключає хаос, затримки та непередбачені витрати. Ви затверджуєте кожен етап до переходу до наступного.'
                : 'Четкий пошаговый процесс исключает хаос, задержки и непредвиденные расходы. Вы утверждаете каждый этап до перехода к следующему.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productionSteps.map((step) => (
              <div 
                key={step.step}
                className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors"
              >
                <div className="text-3xl font-black text-indigo-600/30 mb-4 font-mono">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {step.title}
                </h3>
                <div className="text-xs font-semibold text-indigo-600 mb-3">
                  {step.subtitle}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Interactive Price Calculator for Video */}
      <section id="calculator" className="py-20 bg-slate-900 text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
              <Sliders className="w-3.5 h-3.5" />
              <span>{isUk ? 'Інтерактивний калькулятор' : 'Интерактивный калькулятор'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              {isUk ? 'Розрахуйте орієнтовний кошторис' : 'Рассчитайте ориентировочную смету'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isUk
                ? 'Сконфігуруйте параметри проєкту, щоб отримати прозорий орієнтир вартості та надіслати завдання до нашого продакшну.'
                : 'Сконфигурируйте параметры проекта, чтобы получить прозрачный ориентир стоимости и отправить задачу в наш продакшн.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Options Side */}
            <div className="lg:col-span-7 bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-700 space-y-6">
              {/* Type of Video */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  {isUk ? '1. Формат відеоролика' : '1. Формат видеоролика'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'commercial', label: isUk ? 'Рекламний ролик' : 'Рекламный ролик' },
                    { id: 'factory', label: isUk ? 'Промо заводу / цеху' : 'Промо завода / цеха' },
                    { id: 'corporate', label: isUk ? 'Іміджевий фільм' : 'Имиджевый фильм' },
                    { id: 'event', label: isUk ? 'Івент / Репортаж' : 'Ивент / Репортаж' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setVideoType(t.id as any)}
                      className={`p-3 rounded-xl text-xs font-bold text-center border transition-all ${
                        videoType === t.id
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  {isUk ? '2. Орієнтовний хронометраж' : '2. Предполагаемый хронометраж'}
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: '30s', label: isUk ? '30 сек' : '30 сек', sub: isUk ? 'ТБ / Reels' : 'ТВ / Reels' },
                    { id: '60s', label: isUk ? '60 сек' : '60 сек', sub: isUk ? 'Оптимум' : 'Оптимум' },
                    { id: '2m', label: isUk ? '2 хв' : '2 мин', sub: isUk ? 'Презентація' : 'Презентация' },
                    { id: '5m+', label: isUk ? '5+ хв' : '5+ мин', sub: isUk ? 'Фільм' : 'Фильм' }
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDuration(d.id as any)}
                      className={`p-3 rounded-xl text-center border transition-all ${
                        duration === d.id
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">{d.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{d.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Services Checklist */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  {isUk ? '3. Необхідні опції продакшну' : '3. Необходимые опции продакшна'}
                </label>
                <div className="space-y-2.5">
                  {[
                    {
                      label: isUk ? 'Розробка сценарію та розкадрування (Storyboard)' : 'Разработка сценария и раскадровки (Storyboard)',
                      checked: needScript,
                      toggle: () => setNeedScript(!needScript)
                    },
                    {
                      label: isUk ? 'Кастинг акторів / професійні диктори в кадрі' : 'Кастинг актеров / профессиональные дикторы в кадре',
                      checked: needActors,
                      toggle: () => setNeedActors(!needActors)
                    },
                    {
                      label: isUk ? 'Аерозйомка / FPV-дрон для динамічних прольотів' : 'Аэросъемка / FPV-дрон для динамичных пролетов',
                      checked: needDrone,
                      toggle: () => setNeedDrone(!needDrone)
                    },
                    {
                      label: isUk ? 'Професійна дикторська озвучка в студії' : 'Профессиональная дикторская озвучка в студии',
                      checked: needVoiceover,
                      toggle: () => setNeedVoiceover(!needVoiceover)
                    },
                    {
                      label: isUk ? '3D-моделювання та моушн-дизайн (Motion Graphics)' : '3D-моделирование и Motion Graphics графика',
                      checked: needGraphics3D,
                      toggle: () => setNeedGraphics3D(!needGraphics3D)
                    }
                  ].map((item, i) => (
                    <div
                      key={i}
                      onClick={item.toggle}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        item.checked
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                          : 'bg-slate-900/40 border-slate-700/70 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-medium">{item.label}</span>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        item.checked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 bg-slate-800'
                      }`}>
                        {item.checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary & Form Side */}
            <div className="lg:col-span-5 bg-slate-800/95 p-6 sm:p-8 rounded-2xl border border-indigo-500/30 shadow-2xl relative">
              <div className="flex items-center justify-between pb-6 border-b border-slate-700">
                <div>
                  <div className="text-xs font-semibold text-indigo-400">
                    {isUk ? 'Орієнтовний бюджет' : 'Ориентировочный бюджет'}
                  </div>
                  <div className="text-3xl font-black text-white mt-1">
                    {isUk ? 'від' : 'от'} {calculateEstimate().toLocaleString()} {isUk ? 'грн' : 'грн'}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  {isUk ? <>Фіксований кошторис<br />після брифу</> : <>Фиксированная смета<br />после брифа</>}
                </div>
              </div>

              {submitted ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {isUk ? 'Заявку прийнято в роботу!' : 'Заявка принята в работу!'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xs mx-auto">
                    {isUk
                      ? 'Олександр Пітель зв\'яжеться з вами протягом 15 хвилин для уточнення деталей та погодження концепції.'
                      : 'Александр Питель свяжется с вами в течение 15 минут для уточнения деталей и согласования концепции.'
                    }
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-indigo-400 underline pt-2"
                  >
                    {isUk ? 'Надіслати ще одну заявку' : 'Отправить еще одну заявку'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitBrief} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isUk ? 'Ваше ім\'я / Компанія *' : 'Ваше имя / Компания *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={isUk ? 'Іван, Фабрика дверей' : 'Иван, Фабрика дверей'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isUk ? 'Телефон / Месенджер (Telegram, WhatsApp) *' : 'Телефон / Мессенджер (Telegram, WhatsApp) *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+380 (__) ___-__-__"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isUk ? 'Email для надсилання КП та кошторису' : 'Email для отправки КП и сметы'}
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {isUk ? 'Короткий опис завдання або посилання на референс' : 'Краткое описание задачи или ссылка на референс'}
                    </label>
                    <textarea
                      rows={2}
                      value={clientNote}
                      onChange={(e) => setClientNote(e.target.value)}
                      placeholder={isUk ? 'Потрібен промо-ролик заводу для сайту та виставки...' : 'Нужен промо-ролик завода для сайта и выставки...'}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? (isUk ? 'Надсилання...' : 'Отправка...') : (isUk ? 'Отримати точний кошторис і таймінг' : 'Получить точную смету и тайминг')}</span>
                  </button>

                  <p className="text-[10px] text-slate-400 text-center">
                    {isUk ? 'Конфіденційність гарантовано. Кошторис не зобов\'язує до замовлення.' : 'Конфиденциальность гарантирована. Смета не обязывает к заказу.'}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              {videoFaqHeading?.badge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {videoFaqHeading?.title}
            </h2>
          </div>

          <div className="space-y-3">
            {cmsFaqs.map((faq, i) => (
              <div 
                key={i} 
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-slate-900 font-bold text-sm hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
