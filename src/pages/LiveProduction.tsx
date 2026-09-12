import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Radio, 
  Tv, 
  Wifi, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  ArrowRight, 
  Headphones, 
  Cpu, 
  Activity, 
  HelpCircle, 
  Send, 
  Users, 
  Sparkles, 
  Globe, 
  Clock, 
  Video, 
  MonitorPlay,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSiteContent } from '../context/SiteContentContext';

export function LiveProduction() {
  const { isUk } = useSiteContent();

  // Configurator state
  const [format, setFormat] = useState<'sports' | 'conference' | 'corporate' | 'concert'>('conference');
  const [cameraCount, setCameraCount] = useState<number>(3);
  const [hasStarlink, setHasStarlink] = useState<boolean>(true);
  const [needGraphics, setNeedGraphics] = useState<boolean>(true);
  const [needReplay, setNeedReplay] = useState<boolean>(false);
  const [needTranslation, setNeedTranslation] = useState<boolean>(false);
  const [needLedOutput, setNeedLedOutput] = useState<boolean>(true);
  const [city, setCity] = useState<string>(isUk ? 'Київ' : 'Киев');

  // Contact form state
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
    let base = 12000; // Base station, director, streaming hardware
    base += cameraCount * 4500; // Each camera + operator + wireless/SDI link
    if (hasStarlink) base += 5000;
    if (needGraphics) base += 3500;
    if (needReplay) base += 4500;
    if (needTranslation) base += 4000;
    if (needLedOutput) base += 3000;
    if (format === 'sports') base += 3000;
    return base;
  };

  const handleSubmitBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    setSubmitting(true);
    try {
      const formatNames = isUk ? {
        sports: 'Спортивна трансляція',
        conference: 'Бізнес-конференція / Форум',
        corporate: 'Корпоративний ефір',
        concert: 'Концерт / Шоу'
      } : {
        sports: 'Спортивная трансляция',
        conference: 'Бизнес-конференция / Форум',
        corporate: 'Корпоративный эфир',
        concert: 'Концерт / Шоу'
      };

      const selectedServices = [];
      if (hasStarlink) selectedServices.push(isUk ? 'Starlink + Multi-SIM бондинг' : 'Starlink + Multi-SIM бондинг');
      if (needGraphics) selectedServices.push(isUk ? 'Ефірна графіка та титри' : 'Эфирная графика и титры');
      if (needReplay) selectedServices.push(isUk ? 'Система повторів (Replay)' : 'Система повторов (Replay)');
      if (needTranslation) selectedServices.push(isUk ? 'Синхронний переклад' : 'Синхронный перевод');
      if (needLedOutput) selectedServices.push(isUk ? 'Виведення на екрани зали (LED)' : 'Вывод на экраны зала (LED)');

      await addDoc(collection(db, 'leads'), {
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
        eventType: formatNames[format],
        cameraCount: isUk ? `${cameraCount} камер(и)` : `${cameraCount} камер(ы)`,
        location: city,
        hasStarlink,
        additionalServices: selectedServices,
        estimatedCost: calculateEstimate(),
        message: clientNote,
        createdAt: Date.now()
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit brief:', err);
      alert(isUk 
        ? 'Сталася помилка під час надсилання заявки. Будь ласка, зв\'яжіться з нами безпосередньо за телефоном.'
        : 'Произошла ошибка при отправке заявки. Пожалуйста, свяжитесь с нами напрямую по телефону.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = isUk ? [
    {
      q: 'Що відбувається, якщо на майданчику раптово зникає інтернет?',
      a: 'Ми використовуємо відмовостійку систему резервування зв\'язку на базі супутникового терміналу Starlink та мульти-SIM бондинг-роутерів Peplink/LiveU, які об\'єднують одночасно канали 3 національних операторів зв\'язку (Kyivstar, Vodafone, Lifecell). При обриві дротового інтернету перемикання відбувається миттєво та абсолютно безшовно для глядачів ефіру.'
    },
    {
      q: 'За який час до початку заходу приїжджає знімальна група?',
      a: 'Стандартний регламент технічної групи: прибуття за 3-5 годин до старту для монтажу комутації, розстановки камер, калібрування звукового тракту та тестового прогону. Для великих багатокамерних форумів і спортивних трансляцій монтаж сетапу та генеральне тестування проводяться напередодні (Day-1).'
    },
    {
      q: 'На які платформи можна вести трансляцію?',
      a: 'Ми підтримуємо одночасний стрімінг (мультистрім) на будь-які платформи: YouTube, Facebook, Twitch, LinkedIn, а також виведення в закриті корпоративні плеєри, Zoom/Microsoft Teams або безпосередньо на ваш корпоративний сайт із захистом паролем і обмеженням за геолокацією.'
    },
    {
      q: 'Чи надаєте ви запис трансляції і коли він буде готовий?',
      a: 'Майстер-запис трансляції ведеться у нестиснутій якості з резервуванням на два незалежні накопичувачі. Повний архів ефіру в роздільній здатності Full HD або 4K передається вам одразу після закінчення заходу на жорсткому диску або завантажується на захищене хмарне сховище протягом кількох годин.'
    },
    {
      q: 'Як ви забезпечуєте чистий звук без відлуння та шумів із зали?',
      a: 'Ми привозимо власний цифровий аудіомікшерний пульт (Midas/Behringer X32) та комплект радіомікрофонів Sennheiser зі спрямованими антенними системами. Звук від спікерів, ведучих, відеороликів та інтершуму зали зводиться звукорежисером в ізольований ефірний мікс, незалежний від колонок у залі.'
    },
    {
      q: 'Чи можливе додавання фірмової графіки, титрів та рахунку матчу?',
      a: 'Так, наша графічна станція дозволяє виводити анімовані плашки спікерів, логотипи, таймери зворотного відліку, інфографіку, презентації «картинка-в-картинці» (PiP), а також повноцінний спортивний скорборд з автоматичною або ручною фіксацією очок і складів команд.'
    }
  ] : [
    {
      q: 'Что происходит, если на площадке внезапно пропадает интернет?',
      a: 'Мы используем отказоустойчивую систему резервирования связи на базе спутникового терминала Starlink и мульти-SIM бондинг-роутеров Peplink/LiveU, объединяющих одновременно каналы 3 национальных операторов связи (Kyivstar, Vodafone, Lifecell). При обрыве проводного интернета переключение происходит мгновенно и абсолютно бесшовно для зрителей эфира.'
    },
    {
      q: 'За какое время до начала мероприятия приезжает съемочная группа?',
      a: 'Стандартный регламент технической группы: прибытие за 3-5 часов до старта для монтажа коммутации, расстановки камер, калибровки звукового тракта и тестового прогона. Для крупных многокамерных форумов и спортивных трансляций монтаж сетапа и генеральное тестирование производятся накануне (Day-1).'
    },
    {
      q: 'На какие платформы можно вести трансляцию?',
      a: 'Мы поддерживаем одновременный стриминг (мультистрим) на любые платформы: YouTube, Facebook, Twitch, LinkedIn, а также вывод в закрытые корпоративные плееры, Zoom/Microsoft Teams или напрямую на ваш корпоративный сайт с защитой паролем и ограничением по геолокации.'
    },
    {
      q: 'Предоставляете ли вы запись трансляции и когда она будет готова?',
      a: 'Мастер-запись трансляции ведется в несжатом качестве с резервированием на два независимых накопителя. Полный архив эфира в разрешении Full HD или 4K передается вам сразу по окончании мероприятия на жестком диске или загружается на защищенное облачное хранилище в течение нескольких часов.'
    },
    {
      q: 'Как вы обеспечиваете чистый звук без эха и шумов из зала?',
      a: 'Мы привозим собственный цифровой аудиомикшерный пульт (Midas/Behringer X32) и комплект радиомикрофонов Sennheiser с направленными антенными системами. Звук от спикеров, ведущих, видеороликов и интершума зала сводится звукорежиссером в изолированный эфирный микс, независимый от колонок в зале.'
    },
    {
      q: 'Возможно ли добавление фирменной графики, титров и счета матча?',
      a: 'Да, наша графическая станция позволяет выводить анимированные плашки спикеров, логотипы, таймеры обратного отсчета, инфографику, презентации "картинка-в-картинке" (PiP), а также полноценный спортивный скорборд с автоматической или ручной фиксацией очков и составов команд.'
    }
  ];

  return (
    <div className="w-full bg-slate-50">
      {/* 1. Breadcrumbs / Header notice */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-2">
          <Link to="/" className="hover:text-white transition-colors">{isUk ? 'Головна' : 'Главная'}</Link>
          <span>/</span>
          <span className="text-indigo-400 font-medium">{isUk ? 'Рішення' : 'Решения'}</span>
          <span>/</span>
          <span className="text-white font-medium">LIVE Production</span>
        </div>
      </div>

      {/* 2. Hero Screen */}
      <section className="relative bg-slate-950 text-white overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-indigo-950/40 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80" 
            alt={isUk ? 'Режисерський пульт трансляції' : 'Режиссерский пульт трансляции'} 
            className="w-full h-full object-cover opacity-35"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block mr-1" />
              {isUk ? 'Флагманський напрямок • LIVE Production' : 'Флагманское направление • LIVE Production'}
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              {isUk ? 'Прямі трансляції та ефіри' : 'Прямые трансляции и эфиры'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">
                {isUk ? 'без права на помилку' : 'без права на ошибку'}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 font-light leading-relaxed mb-8">
              {isUk
                ? 'Багатокамерна зйомка спортивних змагань, конференцій, форумів та гібридних подій. 100% інженерна надійність, резервний інтернет Starlink, миттєві повтори та ефірна графіка телевізійного рівня.'
                : 'Многокамерная съемка спортивных соревнований, конференций, форумов и гибридных событий. 100% инженерная надежность, резервный интернет Starlink, мгновенные повторы и эфирная графика телевизионного уровня.'
              }
            </p>

            <div className="flex flex-wrap gap-4 items-center mb-12">
              <a 
                href="#calculator" 
                className="px-7 py-3.5 rounded-full bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center"
              >
                {isUk ? 'Розрахувати трансляцію' : 'Рассчитать трансляцию'} <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <a 
                href="#behind-scenes" 
                className="px-7 py-3.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-700 transition-all"
              >
                {isUk ? 'Інженерія та обладнання' : 'Инженерия и оборудование'}
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80 text-left">
              <div>
                <div className="text-2xl font-bold text-white">{isUk ? 'До 12' : 'До 12'}</div>
                <div className="text-xs text-slate-400 mt-0.5">{isUk ? 'Камер в одному ефірі' : 'Камер в одном эфире'}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-400">100%</div>
                <div className="text-xs text-slate-400 mt-0.5">{isUk ? 'Резервування зв\'язку' : 'Резервирование связи'}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">4K / 60fps</div>
                <div className="text-xs text-slate-400 mt-0.5">{isUk ? 'Якість майстер-запису' : 'Качество мастер-записи'}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-400">&lt; 1 {isUk ? 'сек' : 'сек'}</div>
                <div className="text-xs text-slate-400 mt-0.5">{isUk ? 'Затримка в телемостах' : 'Задержка в телемостах'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Core Formats */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {isUk ? 'Формати мовлення' : 'Форматы вещания'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
              {isUk ? 'Рішення під будь-які завдання вашого бізнесу' : 'Решения под любые задачи вашего бизнеса'}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-3">
              {isUk
                ? 'Кожен захід має свою специфіку. Ми налаштовуємо техніку та сценарій під ваші цілі.'
                : 'Каждое мероприятие имеет свою специфику. Мы настраиваем технику и сценарий под ваши цели.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Format 1: Sports */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200/80 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-6">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{isUk ? 'Спортивні трансляції' : 'Спортивные трансляции'}</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {isUk
                    ? 'Динамічні змагання з повільними повторами з кількох ракурсів, інтеграцією спортивного табло, часу та плашок гравців.'
                    : 'Динамичные соревнования с медленными повторами с нескольких ракурсов, интеграцией спортивного табло, времени и плашек игроков.'
                  }
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Уповільнені повтори (Replay)' : 'Замедленные повторы (Replay)'}</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Табло рахунку та часу матчу' : 'Табло счета и времени матча'}</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Кабіна коментатора з гарнітурами' : 'Кабина комментатора с гарнитурами'}</li>
                </ul>
              </div>
              <a href="#calculator" onClick={() => setFormat('sports')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center mt-2">
                {isUk ? 'Сконфігурувати спорт' : 'Сконфигурировать спорт'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>

            {/* Format 2: Conferences */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200/80 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{isUk ? 'Конференції та форуми' : 'Конференции и форумы'}</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {isUk
                    ? 'Трансляція презентацій спікерів із кришталевою чіткістю слайдів, синхронним перекладом та інтеграцією запитань із зали.'
                    : 'Трансляция презентаций спикеров с кристальной четкостью слайдов, синхронным переводом и интеграцией вопросов из зала.'
                  }
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Захоплення презентацій 1:1 без розмиття' : 'Захват презентаций 1:1 без размытия'}</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Синхронний переклад на 2+ мови' : 'Синхронный перевод на 2+ языка'}</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Інтерактив: запитання з Telegram/Slido' : 'Интерактив: вопросы из Telegram/Slido'}</li>
                </ul>
              </div>
              <a href="#calculator" onClick={() => setFormat('conference')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center mt-2">
                {isUk ? 'Сконфігурувати форум' : 'Сконфигурировать форум'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>

            {/* Format 3: Hybrid */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200/80 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{isUk ? 'Гібридні події та телемости' : 'Гибридные события и телемосты'}</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {isUk
                    ? 'Об\'єднання офлайн-зали з віддаленими спікерами та експертами з усього світу захищеними каналами без затримок.'
                    : 'Объединение офлайн-зала с удаленными спикерами и экспертами со всего мира по защищенным каналам без задержек.'
                  }
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Підключення через vMix Call / Zoom' : 'Подключение через vMix Call / Zoom'}</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Пряме виведення на LED-екрани зали' : 'Прямой вывод на LED-экраны зала'}</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Повне придушення відлуння (Acoustic Echo)' : 'Полное подавление эха (Acoustic Echo)'}</li>
                </ul>
              </div>
              <a href="#calculator" onClick={() => setFormat('corporate')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center mt-2">
                {isUk ? 'Сконфігурувати телеміст' : 'Сконфигурировать телемост'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>

            {/* Format 4: Corporate */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200/80 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{isUk ? 'Закриті корпоративні ефіри' : 'Закрытые корпоративные эфиры'}</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {isUk
                    ? 'Безпечне мовлення для співробітників, акціонерів або закритих клубів із суворим контролем доступу та конфіденційності.'
                    : 'Безопасное вещание для сотрудников, акционеров или закрытых клубов со строгим контролем доступа и конфиденциальности.'
                  }
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Захист паролем та whitelist доменів' : 'Защита паролем и whitelist доменов'}</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Стрімінг на корпоративний портал' : 'Стриминг на корпоративный портал'}</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-indigo-600 mr-2 shrink-0" /> {isUk ? 'Захист від перехоплення та копіювання' : 'Защита от перехвата и копирования'}</li>
                </ul>
              </div>
              <a href="#calculator" onClick={() => setFormat('corporate')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center mt-2">
                {isUk ? 'Сконфігурувати ефір' : 'Сконфигурировать эфир'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Behind The Scenes / Engineering Mastery */}
      <section id="behind-scenes" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800">
              {isUk ? 'За лаштунками ефіру' : 'За кулисами эфира'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4">
              {isUk ? 'Інженерія, якій можна довіряти' : 'Инженерия, которой можно доверять'}
            </h2>
            <p className="text-base sm:text-lg text-slate-400 mt-3">
              {isUk
                ? 'Професійний ефір складається із сотень технічних нюансів. Ми не сподіваємось на удачу — ми вибудовуємо відмовостійкі системи.'
                : 'Профессиональный эфир складывается из сотен технических нюансов. Мы не надеемся на удачу — мы выстраиваем отказоустойчивые системы.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Tech 1 */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Wifi className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{isUk ? 'Резервування зв\'язку (Bonding)' : 'Резервирование связи (Bonding)'}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isUk
                  ? 'Супутниковий термінал Starlink + апаратна агрегація 3 незалежних мобільних операторів (Kyivstar, Vodafone, Lifecell). Якщо кабель на майданчику пошкоджено, ефір не зупиниться.'
                  : 'Спутниковый терминал Starlink + аппаратная агрегация 3 независимых мобильных операторов (Kyivstar, Vodafone, Lifecell). Если кабель на площадке поврежден, эфир не остановится.'
                }
              </p>
            </div>

            {/* Tech 2 */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{isUk ? 'Режисерські станції vMix & ATEM' : 'Режиссерские станции vMix & ATEM'}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isUk
                  ? 'Потужні мобільні ПТС-станції на базі професійних GPU NVIDIA RTX та мікшерів Blackmagic ATEM Constellation. Швидке перемикання камер, графічні накладення та моментальні титри.'
                  : 'Мощные мобильные ПТС-станции на базе профессиональных GPU NVIDIA RTX и микшеров Blackmagic ATEM Constellation. Быстрое переключение камер, графические наложения и моментальные титры.'
                }
              </p>
            </div>

            {/* Tech 3 */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{isUk ? 'Бездротові тракти без затримки' : 'Беспроводные тракты без задержки'}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isUk
                  ? 'Системи бездротової передачі нестиснутого відеосигналу Teradek / Hollyland Cosmos. Оператори вільні у переміщенні залою та стадіоном без ризику заплутатися в кабелях.'
                  : 'Системы беспроводной передачи несжатого видеосигнала Teradek / Hollyland Cosmos. Операторы свободны в перемещении по залу и стадиону без риска запутаться в кабелях.'
                }
              </p>
            </div>

            {/* Tech 4 */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{isUk ? 'Службовий зв\'язок Intercom' : 'Служебная связь Intercom'}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isUk
                  ? 'Повнодуплексні бездротові гарнітури Hollyland Solidcom із шумозаглушенням та Tally-індикацією. Режисер керує операторами щосекунди, не створюючи шуму на майданчику.'
                  : 'Полнодуплексные беспроводные гарнитуры Hollyland Solidcom с шумоподавлением и Tally-индикацией. Режиссер управляет операторами каждую секунду, не создавая шума на площадке.'
                }
              </p>
            </div>

            {/* Tech 5 */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{isUk ? 'Цифровий звуковий тракт' : 'Цифровой звуковой тракт'}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isUk
                  ? 'Мікшери Midas/Behringer X32, мікрофони Sennheiser EW-D. Окреме зведення для інтернет-ефіру та для акустичних систем зали виключає ефект «бочки» та виникнення свисту зворотного зв\'язку.'
                  : 'Микшеры Midas/Behringer X32, микрофоны Sennheiser EW-D. Отдельное сведение для интернет-эфира и для акустических систем зала исключает эффект "бочки" и возникновение свиста обратной связи.'
                }
              </p>
            </div>

            {/* Tech 6 */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{isUk ? 'ДБЖ подвійного перетворення' : 'ИБП двойного преобразования'}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isUk
                  ? 'Уся центральна апаратна заживлена через онлайнові джерела безперебійного живлення (Online UPS). Повний імунітет до стрибків напруги, перешкод та вимкнень електрики.'
                  : 'Вся центральная аппаратная запитана через онлайновые источники бесперебойного питания (Online UPS). Полный иммунитет к скачкам напряжения, помехам и отключениям электричества.'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Quote from Alexander Pitel */}
      <section className="py-20 bg-indigo-900 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <Radio className="w-96 h-96" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-indigo-400/40 shrink-0 shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80" 
                alt={isUk ? 'Олександр Пітель' : 'Александр Питель'} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <blockquote className="text-xl sm:text-2xl font-light italic leading-relaxed text-indigo-100">
                {isUk
                  ? '«У зйомці кіно або рекламного ролика завжди є можливість зробити другий або третій дубль. У прямому ефірі дублів не буває: глядач бачить усе, що відбувається, у реальному часі. Тому надійність — це не випадковість, а результат математично вивіреної схеми комутації, резервування вузлів та холоднокровності команди.»'
                  : '"В съемке кино или рекламного ролика всегда есть возможность сделать второй или третий дубль. В прямом эфире дублей не бывает: зритель видит все происходящее в реальном времени. Поэтому надежность — это не случайность, а результат математически выверенной схемы коммутации, резервирования узлов и хладнокровия команды."'
                }
              </blockquote>
              <div className="mt-4 font-semibold text-white flex items-center">
                <span>{isUk ? 'Олександр Пітель' : 'Александр Питель'}</span>
                <span className="mx-2 text-indigo-400">•</span>
                <span className="text-indigo-300 font-normal text-sm">{isUk ? 'Засновник LIVE & VIDEO Production' : 'Основатель LIVE & VIDEO Production'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive Calculator / Instant Brief */}
      <section id="calculator" className="py-24 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {isUk ? 'Інтерактивний конфігуратор' : 'Интерактивный конфигуратор'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
              {isUk ? 'Розрахуйте параметри вашої трансляції за 1 хвилину' : 'Рассчитайте параметры вашей трансляции за 1 минуту'}
            </h2>
            <p className="text-base text-slate-600 mt-2">
              {isUk
                ? 'Оберіть конфігурацію вашої події та отримайте миттєвий розрахунок складу сетапу та вартості.'
                : 'Выберите конфигурацию вашего события и получите мгновенный расчет состава сетапа и стоимости.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Options Column */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
              {/* Step 1: Format */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-900 mb-3">
                  {isUk ? '1. Тип заходу' : '1. Тип мероприятия'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(isUk ? [
                    { id: 'sports', label: 'Спорт' },
                    { id: 'conference', label: 'Конференція' },
                    { id: 'corporate', label: 'Корпоратив' },
                    { id: 'concert', label: 'Концерт / Шоу' },
                  ] : [
                    { id: 'sports', label: 'Спорт' },
                    { id: 'conference', label: 'Конференция' },
                    { id: 'corporate', label: 'Корпоратив' },
                    { id: 'concert', label: 'Концерт / Шоу' },
                  ]).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormat(item.id as any)}
                      className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                        format === item.id 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Camera Count */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-900">
                    {isUk ? '2. Кількість камер' : '2. Количество камер'}
                  </label>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                    {isUk 
                      ? `${cameraCount} ${cameraCount === 1 ? 'камера' : cameraCount < 5 ? 'камери' : 'камер'}`
                      : `${cameraCount} ${cameraCount === 1 ? 'камера' : cameraCount < 5 ? 'камеры' : 'камер'}`
                    }
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {[1, 2, 3, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCameraCount(num)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        cameraCount === num 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {num} {isUk ? 'кам.' : 'кам.'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {cameraCount === 1 && (isUk ? 'Компактний стрім одного спікера або інтерв\'ю.' : 'Компактный стрим одного спикера или интервью.')}
                  {cameraCount === 2 && (isUk ? 'Загальний план зали + великий план спікера.' : 'Общий план зала + крупный план спикера.')}
                  {cameraCount === 3 && (isUk ? 'Класичний стандарт: загальний, середній та великий план + реакція зали.' : 'Классический стандарт: общий, средний и крупный план + реакция зала.')}
                  {cameraCount >= 4 && (isUk ? 'Професійне мультикамерне охоплення зі стедікамами та мобільними точками.' : 'Профессиональный мультикамерный охват со стедикамами и мобильными точками.')}
                </p>
              </div>

              {/* Step 3: Location */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-900 mb-3">
                  {isUk ? '3. Локація заходу' : '3. Локация мероприятия'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(isUk 
                    ? ['Київ', 'Дніпро', 'Львів', 'Одеса', 'Інше'] 
                    : ['Киев', 'Днепр', 'Львов', 'Одесса', 'Другой']
                  ).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setCity(loc)}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all ${
                        city === loc 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Technical Options */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-900 mb-3">
                  {isUk ? '4. Технічні опції та резервування' : '4. Технические опции и резервирование'}
                </label>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={hasStarlink} 
                        onChange={(e) => setHasStarlink(e.target.checked)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900">Starlink + Multi-SIM бондинг</div>
                        <div className="text-xs text-slate-500">
                          {isUk ? '100% гарантія ефіру без перебоїв зі зв\'язком' : '100% гарантия эфира без перебоев со связью'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">+5 000 ₴</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={needGraphics} 
                        onChange={(e) => setNeedGraphics(e.target.checked)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900">
                          {isUk ? 'Ефірна графіка та титри' : 'Эфирная графика и титры'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isUk ? 'Плашки спікерів, заставки, таймери, логотипи' : 'Плашки спикеров, заставки, таймеры, логотипы'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">+3 500 ₴</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={needReplay} 
                        onChange={(e) => setNeedReplay(e.target.checked)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900">
                          {isUk ? 'Уповільнені повтори (Replay)' : 'Замедленные повторы (Replay)'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isUk ? 'Окремий оператор повторів ключових моментів' : 'Отдельный оператор повторов ключевых моментов'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">+4 500 ₴</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={needTranslation} 
                        onChange={(e) => setNeedTranslation(e.target.checked)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900">
                          {isUk ? 'Синхронний переклад (2 аудіодоріжки)' : 'Синхронный перевод (2 аудиодорожки)'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isUk ? 'Окремі стрім-потоки під оригінальний звук та перекладача' : 'Отдельные стрим-потоки под оригинальный звук и переводчика'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">+4 000 ₴</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        checked={needLedOutput} 
                        onChange={(e) => setNeedLedOutput(e.target.checked)} 
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900">
                          {isUk ? 'Виведення ефіру на LED-екрани зали' : 'Вывод эфира на LED-экраны зала'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isUk ? 'Передача чистого сигналу без затримки на сцену' : 'Передача чистого сигнала без задержки на сцену'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">+3 000 ₴</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Summary & Booking Column */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 sticky top-24">
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                {isUk ? 'Параметри сетапу' : 'Параметры сетапа'}
              </h3>
              
              <div className="space-y-3.5 pb-6 border-b border-slate-100 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>{isUk ? 'Режисерська група:' : 'Режиссерская группа:'}</span>
                  <span className="font-semibold text-slate-900">{isUk ? 'Включено' : 'Включено'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isUk ? 'Камерні оператори:' : 'Камерные операторы:'}</span>
                  <span className="font-semibold text-slate-900">
                    {isUk ? `${cameraCount} ос.` : `${cameraCount} чел.`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isUk ? 'Звуковий пульт та мікрофони:' : 'Звуковой пульт и микрофоны:'}</span>
                  <span className="font-semibold text-slate-900">{isUk ? 'Включено' : 'Включено'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isUk ? 'Майстер-запис Full HD / 4K:' : 'Мастер-запись Full HD / 4K:'}</span>
                  <span className="font-semibold text-slate-900">{isUk ? 'Включено' : 'Включено'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{isUk ? 'Місто проведення:' : 'Город проведения:'}</span>
                  <span className="font-semibold text-slate-900">{city}</span>
                </div>
              </div>

              <div className="pt-6 mb-8">
                <div className="text-xs text-slate-500 mb-1">{isUk ? 'Орієнтовний бюджет:' : 'Ориентировочный бюджет:'}</div>
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600">
                  {isUk ? 'від' : 'от'} {calculateEstimate().toLocaleString('uk-UA')} ₴
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {isUk 
                    ? 'Точний кошторис формується після узгодження технічного райдера майданчика.'
                    : 'Точная смета формируется после согласования технического райдера площадки.'
                  }
                </div>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-emerald-900 mb-1">
                    {isUk ? 'Заявку успішно прийнято!' : 'Заявка успешно принята!'}
                  </h4>
                  <p className="text-xs text-emerald-700">
                    {isUk 
                      ? 'Олександр Пітель або головний інженер зв\'яжеться з вами протягом 30 хвилин для узгодження дати та деталей.'
                      : 'Александр Питель или главный инженер свяжется с вами в течение 30 минут для согласования даты и деталей.'
                    }
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBrief} className="space-y-3">
                  <div>
                    <input 
                      type="text" 
                      required
                      placeholder={isUk ? 'Ваше ім\'я *' : 'Ваше имя *'} 
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <input 
                      type="tel" 
                      required
                      placeholder={isUk ? 'Номер телефону *' : 'Номер телефона *'} 
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <input 
                      type="email" 
                      placeholder={isUk ? 'Електронна пошта (для кошторису)' : 'Электронная почта (для сметы)'} 
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {submitting 
                      ? (isUk ? 'Надсилання...' : 'Отправка...') 
                      : (isUk ? 'Забронювати дату та отримати кошторис' : 'Забронировать дату и получить смету')
                    }
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    {isUk 
                      ? 'Натискаючи кнопку, ви погоджуєтеся на обробку контактних даних.'
                      : 'Нажимая кнопку, вы соглашаетесь на обработку контактных данных.'
                    }
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Key LIVE Case Studies */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {isUk ? 'Досвід в ефірі' : 'Опыт в эфире'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
                {isUk ? 'Реалізовані проекти трансляцій' : 'Реализованные проекты трансляций'}
              </h2>
            </div>
            <Link to="/cases" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center mt-4 md:mt-0">
              {isUk ? 'Дивитися всі кейси продакшену' : 'Смотреть все кейсы продакшена'} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Case 1 */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col">
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-900">
                <img 
                  src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80" 
                  alt={isUk ? 'Футбольний матч трансляція' : 'Футбольный матч трансляция'} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {isUk ? 'Спорт • 6 камер' : 'Спорт • 6 камер'}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {isUk ? 'Всеукраїнський турнір з футболу' : 'Всеукраинский турнир по футболу'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    {isUk
                      ? 'Два дні безперервного мовлення, 6 камер з повторами спірних моментів (VAR), інтеграція рахунку матчу та коментаторська позиція.'
                      : 'Два дня непрерывного вещания, 6 камер с повторами спорных моментов (VAR), интеграция счета матча и комментаторская позиция.'
                    }
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <span>{isUk ? 'Аудиторія: 45 000+' : 'Аудитория: 45 000+'}</span>
                  <span className="font-semibold text-slate-800">YouTube Live</span>
                </div>
              </div>
            </div>

            {/* Case 2 */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col">
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-900">
                <img 
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80" 
                  alt={isUk ? 'Бізнес-форум трансляція' : 'Бизнес-форум трансляция'} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {isUk ? 'Форум • 4 камери' : 'Форум • 4 камеры'}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {isUk ? 'Міжнародний IT & Tech Forum' : 'Международный IT & Tech Forum'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    {isUk
                      ? 'Синхронний переклад англійською мовою, захоплення слайдів презентацій у 4K, телеміст зі спікерами з Великої Британії та Німеччини.'
                      : 'Синхронный перевод на английский язык, захват слайдов презентаций в 4K, телемост со спикерами из Великобритании и Германии.'
                    }
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <span>{isUk ? '2 паралельні потоки' : '2 параллельных потока'}</span>
                  <span className="font-semibold text-slate-800">Сайт + YouTube</span>
                </div>
              </div>
            </div>

            {/* Case 3 */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col">
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-900">
                <img 
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80" 
                  alt={isUk ? 'Корпоративний саміт' : 'Корпоративный саммит'} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {isUk ? 'Корпоратив • Закритий ефір' : 'Корпоратив • Закрытый эфир'}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {isUk ? 'Щорічний саміт агрохолдингу' : 'Ежегодный саммит агрохолдинга'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                    {isUk
                      ? 'Захищений ефір для 3 500 співробітників по всій країні. Інтерактивні голосування, телемости між 4 філіями та 100% аптайм.'
                      : 'Защищенный эфир для 3 500 сотрудников по всей стране. Интерактивные голосования, телемосты между 4 филиалами и 100% аптайм.'
                    }
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Starlink {isUk ? 'Резерв' : 'Резерв'}</span>
                  <span className="font-semibold text-slate-800">{isUk ? 'Корпоративний плеєр' : 'Корпоративный плеер'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Step-by-Step Workflow */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {isUk ? 'Регламент підготовки' : 'Регламент подготовки'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
              {isUk ? 'Як ми готуємося до вашого ефіру' : 'Как мы готовимся к вашему эфиру'}
            </h2>
            <p className="text-base text-slate-600 mt-3">
              {isUk
                ? 'Чіткий покроковий процес виключає будь-які несподіванки під час відповідального заходу.'
                : 'Четкий пошаговый процесс исключает любые неожиданности во время ответственного мероприятия.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(isUk ? [
              { num: '01', title: 'Бриф та аудит', desc: 'Замір швидкості каналів зв\'язку на локації, аудит електрики та акустики зали.' },
              { num: '02', title: 'ТЗ та схема', desc: 'Проектування комутації, розрахунок розстановки камер та траєкторій кабелів.' },
              { num: '03', title: 'Графіка', desc: 'Створення фірмових титрів, плашок спікерів, заставок початку та перерв.' },
              { num: '04', title: 'Монтаж сетапу', desc: 'Прибуття за 3-5 годин до старту. Розгортання ПТС, калібрування звуку.' },
              { num: '05', title: 'Прямий ефір', desc: 'Злагоджена робота режисера, операторів та звукоінженера з резервом каналів.' },
              { num: '06', title: 'Майстер-архів', desc: 'Передача запису у 4K та нарізка ключових моментів протягом першої доби.' },
            ] : [
              { num: '01', title: 'Бриф и аудит', desc: 'Замер скорости каналов связи на локации, аудит электричества и акустики зала.' },
              { num: '02', title: 'ТЗ и схема', desc: 'Проектирование коммутации, расчет расстановки камер и траекторий кабелей.' },
              { num: '03', title: 'Графика', desc: 'Создание фирменных титров, плашек спикеров, заставок начала и перерывов.' },
              { num: '04', title: 'Монтаж сетапа', desc: 'Прибытие за 3-5 часов до старта. Развертывание ПТС, калибровка звука.' },
              { num: '05', title: 'Прямой эфир', desc: 'Слаженная работа режиссера, операторов и звукоинженера с резервом каналов.' },
              { num: '06', title: 'Мастер-архив', desc: 'Передача записи в 4K и нарезка ключевых моментов в течение первых суток.' },
            ]).map((step) => (
              <div key={step.num} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-2xl font-extrabold text-indigo-600 mb-2 font-mono">{step.num}</div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ Section */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {isUk ? 'Питання та відповіді' : 'Вопросы и ответы'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
              {isUk ? 'Часті запитання щодо трансляцій' : 'Часто задаваемые вопросы по трансляциям'}
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div 
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm sm:text-base pr-4">{item.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-indigo-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Final Call to Action */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
            {isUk 
              ? 'Плануєте захід? Давайте обговоримо технічне завдання' 
              : 'Планируете мероприятие? Давайте обсудим техническое задание'
            }
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light mb-8">
            {isUk
              ? 'Залиште заявку або зателефонуйте нам. Ми безкоштовно проведемо попередній аудит майданчика та підготуємо детальну специфікацію обладнання.'
              : 'Оставьте заявку или позвоните нам. Мы бесплатно проведем предварительный аудит площадки и подготовим подробную спецификацию оборудования.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#calculator" 
              className="px-8 py-4 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all"
            >
              {isUk ? 'Перейти до калькулятора' : 'Перейти к калькулятору'}
            </a>
            <Link 
              to="/contacts" 
              className="px-8 py-4 rounded-full bg-slate-800 border border-slate-700 text-white font-bold text-sm hover:bg-slate-700 transition-all"
            >
              {isUk ? 'Зв\'язатися з продакшеном' : 'Связаться с продакшеном'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
