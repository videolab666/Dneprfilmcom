import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Globe2, 
  Building2, 
  Truck, 
  MessageSquare, 
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSiteContent } from '../context/SiteContentContext';

export function Contacts() {
  const { settings, isUk, l, legacy } = useSiteContent();

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContact, setPreferredContact] = useState<'telegram' | 'phone' | 'whatsapp' | 'email'>('telegram');
  const [service, setService] = useState('LIVE');
  const [location, setLocation] = useState(l("Дніпро", "Днепр"));
  const [eventDate, setEventDate] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const phoneDisplay = settings.phone || '+380 (67) 560-68-80';
  const phoneRaw = phoneDisplay.replace(/\D/g, '');
  const emailDisplay = settings.email || 'Dneprfilmcom@gmail.com';
  const telegramHandle = (settings.telegram || '@dneprfilm').replace('@', '');
  const whatsappNum = (settings.whatsapp || '+380675606880').replace(/\D/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg(l("Будь ласка, вкажіть ваше ім'я та контактний телефон.", "Пожалуйста, укажите ваше имя и контактный телефон."));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await addDoc(collection(db, 'leads'), {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        service,
        eventType: `${l("Контакти", "Контакты")}: ${l("Заявка на розрахунок", "Заявка на просчет")} (${service})`,
        location: location.trim(),
        cameraCount: l("Уточнюється в ТЗ", "Уточняется в ТЗ"),
        preferredContact,
        eventDate: eventDate || undefined,
        message: message.trim() || undefined,
        status: 'new',
        createdAt: Date.now()
      });

      setIsSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      setEventDate('');
    } catch (err: any) {
      console.error('Failed to submit contact lead:', err);
      setErrorMsg(l("Не вдалося надіслати заявку через форму. Будь ласка, напишіть нам напряму в Telegram або зателефонуйте.", "Не удалось отправить заявку через форму. Пожалуйста, напишите нам напрямую в Telegram или позвоните."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactCards_RU = [
    {
      title: 'Прямая связь с продюсером',
      value: phoneDisplay,
      href: `tel:+${phoneRaw}`,
      subtitle: 'Звонки и срочные вопросы',
      badge: 'Ответ до 3-5 мин',
      icon: <Phone className="w-6 h-6 text-indigo-600" />,
      color: 'border-indigo-100 hover:border-indigo-400 bg-white'
    },
    {
      title: 'Telegram (Рекомендуем)',
      value: `@${telegramHandle}`,
      href: `https://t.me/${telegramHandle}`,
      subtitle: 'Быстрый обмен файлами и ТЗ',
      badge: 'Самый оперативный',
      icon: <MessageSquare className="w-6 h-6 text-sky-500" />,
      color: 'border-sky-100 hover:border-sky-400 bg-white'
    },
    {
      title: 'Официальный Email',
      value: emailDisplay,
      href: `mailto:${emailDisplay}`,
      subtitle: 'Для брифов, смет и договоров',
      badge: 'КП за 1-2 часа',
      icon: <Mail className="w-6 h-6 text-emerald-600" />,
      color: 'border-emerald-100 hover:border-emerald-400 bg-white'
    },
    {
      title: 'WhatsApp / Viber',
      value: '+380 (67) 560-68-80',
      href: `https://wa.me/${whatsappNum}`,
      subtitle: 'Международная связь и мессенджеры',
      badge: 'Online',
      icon: <Globe2 className="w-6 h-6 text-teal-600" />,
      color: 'border-teal-100 hover:border-teal-400 bg-white'
    }
  ];

  const contactCards_UK = [
    {
      title: 'Прямий зв\'язок з продюсером',
      value: phoneDisplay,
      href: `tel:+${phoneRaw}`,
      subtitle: 'Дзвінки та термінові запитання',
      badge: 'Відповідь до 3-5 хв',
      icon: <Phone className="w-6 h-6 text-indigo-600" />,
      color: 'border-indigo-100 hover:border-indigo-400 bg-white'
    },
    {
      title: 'Telegram (Рекомендуємо)',
      value: `@${telegramHandle}`,
      href: `https://t.me/${telegramHandle}`,
      subtitle: 'Швидкий обмін файлами та ТЗ',
      badge: 'Найбільш оперативний',
      icon: <MessageSquare className="w-6 h-6 text-sky-500" />,
      color: 'border-sky-100 hover:border-sky-400 bg-white'
    },
    {
      title: 'Офіційний Email',
      value: emailDisplay,
      href: `mailto:${emailDisplay}`,
      subtitle: 'Для брифів, кошторисів та договорів',
      badge: 'КП за 1-2 години',
      icon: <Mail className="w-6 h-6 text-emerald-600" />,
      color: 'border-emerald-100 hover:border-emerald-400 bg-white'
    },
    {
      title: 'WhatsApp / Viber',
      value: '+380 (67) 560-68-80',
      href: `https://wa.me/${whatsappNum}`,
      subtitle: 'Міжнародний зв\'язок та месенджери',
      badge: 'Online',
      icon: <Globe2 className="w-6 h-6 text-teal-600" />,
      color: 'border-teal-100 hover:border-teal-400 bg-white'
    }
  ];

  const locations_RU = [
    {
      city: 'г. Днепр (Главная база)',
      address: 'ул. Сичеславская Набережная, 29',
      desc: 'Главный продакшен-офис студии Dneprfilm, монтажные залы, тон-ателье записи звука, склад кинокамер, оптики и технический парк ПТС.',
      type: 'Штаб-квартира & Студия',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />
    },
    {
      city: 'г. Киев (Оперативная группа)',
      address: 'ул. Эспланадная, 20 (БЦ рядом с Дворцом Спорта)',
      desc: 'Постоянная съемочная группа и ПТС в столице. Быстрый выезд на ключевые арены (Дворец Спорта, КВЦ Парковый, НСК Олимпийский, Menorah).',
      type: 'Представительство',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />
    },
    {
      city: 'Выездные ПТС по всей Украине и ЕС',
      address: 'Спецавтомобили с автономным питанием & Starlink',
      desc: 'Регулярная работа в Одессе, Львове, Харькове, Запорожье, а также выезды в Польшу, Германию и ОАЭ (Дубай Expo). Спутниковый интернет и резервные генераторы 10 кВт.',
      type: 'Мобильные бригады',
      icon: <Truck className="w-5 h-5 text-indigo-600" />
    }
  ];

  const locations_UK = [
    {
      city: 'м. Дніпро (Головна база)',
      address: 'вул. Січеславська Набережна, 29',
      desc: 'Головний продакшен-офіс студії Dneprfilm, монтажні зали, тон-ательє запису звуку, склад кінокамер, оптики та технічний парк ПТС.',
      type: 'Штаб-квартира & Студія',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />
    },
    {
      city: 'м. Київ (Оперативна група)',
      address: 'вул. Еспланадна, 20 (БЦ поруч з Палацом Спорту)',
      desc: 'Постійна знімальна група та ПТС у столиці. Швидкий виїзд на ключові локації (Палац Спорту, КВЦ Парковий, НСК Олімпійський тощо).',
      type: 'Представництво',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />
    },
    {
      city: 'Виїзні ПТС по всій Україні та ЄС',
      address: 'Спецавтомобілі з автономним живленням & Starlink',
      desc: 'Регулярна робота в Одесі, Львові, Харкові, Запоріжжі, а також виїзди до Польщі, Німеччини та ОАЕ (Дубай Expo). Супутниковий інтернет та резервні генератори 10 кВт.',
      type: 'Мобільні бригади',
      icon: <Truck className="w-5 h-5 text-indigo-600" />
    }
  ];

  const faqs_RU = [
    {
      q: 'Как быстро вы можете рассчитать смету и подготовить коммерческое предложение?',
      a: 'При наличии базового технического задания (дата, локация, количество камер и формат) мы предоставляем подробный расчет сметы в течение 1–2 часов. Для нестандартных задач возможен оперативный созвон с продюсером.'
    },
    {
      q: 'Работаете ли вы официально по договору и с безналичным расчетом?',
      a: 'Да, 100% наших проектов реализуются по официальному договору. Работаем как с юридическими лицами с НДС (ТОВ), так и без НДС (ФОП 3 группа). Предоставляем полный пакет закрывающих документов, смет и актов.'
    },
    {
      q: 'Подписываете ли вы NDA (соглашение о неразглашении)?',
      a: 'Да, перед съемками на закрытых промышленных заводах, медицинских операциях или закрытых корпоративных форумах мы обязательно подписываем двустороннее соглашение о конфиденциальности.'
    },
    {
      q: 'Что делать, если на локации нет проводного интернета?',
      a: 'Мы полностью автономны. В нашем арсенале собственные спутниковые терминалы Starlink с приоритетным трафиком, а также многомодемные 4G-бондинг станции LiveU/Dejero, объединяющие операторов Киевстар, Vodafone и Lifecell.'
    }
  ];

  const faqs_UK = [
    {
      q: 'Як швидко ви можете розрахувати кошторис та підготувати комерційну пропозицію?',
      a: 'За наявності базового технічного завдання (дата, локація, кількість камер та формат) ми надаємо детальний розрахунок кошторису протягом 1–2 годин. Для нестандартних завдань можливий оперативний дзвінок із продюсером.'
    },
    {
      q: 'Чи працюєте ви офіційно за договором та безготівковим розрахунком?',
      a: 'Так, 100% наших проєктів реалізуються за офіційним договором. Працюємо як з юридичними особами з ПДВ (ТОВ), так і без ПДВ (ФОП 3 група). Надаємо повний пакет закриваючих документів, кошторисів та актів.'
    },
    {
      q: 'Чи підписуєте ви NDA (угоду про нерозголошення)?',
      a: 'Так, перед зйомками на закритих промислових заводах, медичних операціях або закритих корпоративних форумах ми обов\'язково підписуємо двосторонню угоду про конфіденційність.'
    },
    {
      q: 'Що робити, якщо на локації немає дротового інтернету?',
      a: 'Ми повністю автономні. У нашому арсеналі власні супутникові термінали Starlink з пріоритетним трафіком, а також багатомодемні 4G-бондінг станції LiveU/Dejero, що об\'єднують операторів Київстар, Vodafone та Lifecell.'
    }
  ];

  const contactCards = legacy(contactCards_UK, contactCards_RU);
  const locations = legacy(locations_UK, locations_RU);
  const faqs = legacy(faqs_UK, faqs_RU);

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* 1. HERO HEADER */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{l("Прямий контакт з продакшеном", "Прямой контакт с продакшеном")}</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {l("Контакти студії ", "Контакты студии ")}
              <span className="text-indigo-400">Dneprfilm</span>
            </h1>
            
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-light">
              {l("Обговоріть ваш прямий ефір, зйомку іміджевого відео, таймлапс будівництва або фотосесію безпосередньо з Олександром Пітелем та технічною дирекцією студії.", "Обсудите ваш прямой эфир, съемку имиджевого видео, таймлапс строительства или фотосессию напрямую с Александром Пителем и технической дирекцией студии.")}
            </p>

            {/* Fast direct buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={`tel:+${phoneRaw}`}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>{l("Зателефонувати: ", "Позвонить: ")}{phoneDisplay}</span>
              </a>

              <a
                href={`https://t.me/${telegramHandle}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-md transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{l("Написати в Telegram", "Написать в Telegram")}</span>
              </a>

              <a
                href={`mailto:${emailDisplay}`}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>{emailDisplay}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CHANNELS OF COMMUNICATION (CARDS) */}
      <section className="-mt-10 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactCards.map((card, idx) => (
            <a
              key={idx}
              href={card.href}
              target={card.href.startsWith('http') ? '_blank' : undefined}
              rel={card.href.startsWith('http') ? 'noreferrer' : undefined}
              className={`p-6 rounded-2xl border shadow-sm transition-all hover:shadow-lg group flex flex-col justify-between ${card.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                    {card.icon}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {card.badge}
                  </span>
                </div>
                
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </h2>
                
                <div className="mt-1 text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {card.value}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{card.subtitle}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 3. MAIN SECTION: ESTIMATE FORM & PRODUCTION BASES */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: INTERACTIVE BRIEF / ESTIMATE FORM */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm relative">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
                <FileText className="w-3.5 h-3.5" />
                <span>{l("Онлайн-бриф на розрахунок кошторису", "Онлайн-бриф на расчет сметы")}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {l("Опишіть ваше завдання", "Опишите вашу задачу")}
              </h2>
              <p className="text-slate-600 text-sm mt-2">
                {l("Заповніть форму нижче — ми зв'яжемося з вами протягом 15 хвилин з готовими варіантами сетапу та розрахунком бюджету.", "Заполните форму ниже — мы свяжемся с вами в течение 15 минут с готовыми вариантами сетапа и расчетом бюджета.")}
              </p>

              {isSuccess ? (
                <div className="mt-8 p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-emerald-950">
                    {l("Дякуємо! Заявку успішно прийнято", "Спасибо! Заявка успешно принята")}
                  </h3>
                  <p className="mt-2 text-sm text-emerald-800 max-w-md mx-auto">
                    {l("Продюсер Олександр Пітель або технічний директор зв'яжуться з вами в обраному месенджері протягом 15 хвилин.", "Продюсер Александр Питель или технический директор свяжутся с вами в выбранном мессенджере в течение 15 минут.")}
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    {l("Надіслати ще одну задачу", "Отправить еще одну задачу")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  {errorMsg && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {l("Ваше ім'я / Компанія *", "Ваше имя / Компания *")}
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={l("Олександр / Компанія", "Александр / Компания")}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {l("Телефон *", "Телефон *")}
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+380 (__) ___-__-__"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Preferred contact channel */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {l("Де вам зручніше отримати відповідь та кошторис?", "Где вам удобнее получить ответ и смету?")}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['telegram', 'phone', 'whatsapp', 'email'] as const).map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setPreferredContact(ch)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            preferredContact === ch
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {ch === 'telegram' && '💬 Telegram'}
                          {ch === 'phone' && (l("📞 Дзвінок", "📞 Звонок"))}
                          {ch === 'whatsapp' && '🟢 WhatsApp'}
                          {ch === 'email' && '✉️ Email'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {l("Напрямок завдання", "Направление задачи")}
                      </label>
                      <select
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900"
                      >
                        {isUk ? (
                          <>
                            <option value="LIVE">LIVE Пряма трансляція (спорт, форум, шоу)</option>
                            <option value="VIDEO">Іміджевий корпоративний фільм / промо</option>
                            <option value="CONSTRUCTION">Моніторинг будівництва / 4K таймлапс</option>
                            <option value="DRONE">Аерозйомка & FPV-прольоти цехів</option>
                            <option value="COMMERCIAL">Реклама продукту / фуд-відео</option>
                            <option value="PHOTO">Репортажна або студійна фотозйомка</option>
                            <option value="FULL_PACKAGE">Комплексний медіа-пакет під ключ</option>
                          </>
                        ) : (
                          <>
                            <option value="LIVE">LIVE Прямая трансляция (спорт, форум, шоу)</option>
                            <option value="VIDEO">Имиджевый корпоративный фильм / промо</option>
                            <option value="CONSTRUCTION">Мониторинг строительства / 4K таймлапс</option>
                            <option value="DRONE">Аэросъемка & FPV-пролеты цехов</option>
                            <option value="COMMERCIAL">Реклама продукта / фуд-видео</option>
                            <option value="PHOTO">Репортажная или студийная фотосъемка</option>
                            <option value="FULL_PACKAGE">Комплексный медиа-пакет под ключ</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {l("Місто / Локація", "Город / Локация")}
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={l("Дніпро, Київ, інше місто...", "Днепр, Киев, другой город...")}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {l("Орієнтовна дата / Дедлайн", "Примерная дата / Дедлайн")}
                      </label>
                      <input
                        type="text"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        placeholder={l("Наприклад: 25 жовтня або терміново", "Например: 25 октября или срочно")}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {l("Email (необов'язково)", "Email (опционально)")}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="company@domain.ua"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      {l("Опис завдання або посилання на референс", "Описание задачи или ссылка на референс")}
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={l("Розкажіть про масштаб проєкту, кількість учасників або прикріпіть посилання на приклад ролика...", "Расскажите о масштабе проекта, количестве участников или прикрепите ссылку на пример ролика...")}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        {l("Конфіденційність гарантовано. Укладаємо NDA.", "Конфиденциальность гарантирована. Заключаем NDA.")}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>{l("Відправка даних...", "Отправка данных...")}</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{l("Отримати розрахунок кошторису", "Получить расчет сметы")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT: BASES & WORKING STANDARDS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Working Hours Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {l("Режим роботи", "Режим работы")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {l("Зв'язок та виїзні зміни", "Связь и выездные смены")}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">{l("Офіс & Консультації:", "Офис & Консультации:")}</span>
                  <span className="font-semibold text-white">{l("Пн–Сб 09:00 — 20:00", "Пн–Сб 09:00 — 20:00")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">{l("Ефірні зміни & ПТС:", "Эфирные смены & ПТС:")}</span>
                  <span className="font-semibold text-indigo-300">{l("24/7 за графіком ефіру", "24/7 по графику эфира")}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">{l("Нічний рендеринг & монтаж:", "Ночной рендеринг & монтаж:")}</span>
                  <span className="font-semibold text-emerald-400">{l("Цілодобово", "Круглосуточно")}</span>
                </div>
              </div>
            </div>

            {/* Production Bases List */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {l("Локації та знімальні бази", "Локации и съемочные базы")}
                </h3>
              </div>

              <div className="space-y-4">
                {locations.map((loc, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {loc.icon}
                        <span className="font-bold text-slate-900 text-sm">{loc.city}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        {loc.type}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-600">
                      {loc.address}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {loc.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal and Invoicing Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {l("Юридичні гарантії", "Юридические гарантии")}
                </h3>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{l("Безготівковий розрахунок", "Безналичный расчет")}</strong>
                    {l(": ФОП 3 група без ПДВ / ТОВ з ПДВ.", ": ФОП 3 группа без НДС / ТОВ с НДС.")}
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{l("Типовий договір", "Типовой договор")}</strong>
                    {l(" з детальною специфікацією техніки та хронометражу.", " с детальной спецификацией техники и хронометража.")}
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{l("Угода про нерозголошення (NDA)", "Соглашение о неразглашении (NDA)")}</strong>
                    {l(" для закритих виробництв.", " для закрытых производств.")}
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{l("Фіксований кошторис", "Фиксированная смета")}</strong>
                    {l(" — без прихованих доплат за паливо або перепрацювання на майданчику.", " — без скрытых доплат за бензин или переработку на площадке.")}
                  </span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 4. FAQ SECTION */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {l("Часті запитання щодо замовлення", "Часто задаваемые вопросы по заказу")}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {l("Усе, що потрібно знати перед тим, як зв'язатися з нами та затвердити кошторис", "Все, что нужно знать перед тем, как связаться с нами и утвердить смету")}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-bold text-slate-900 text-sm sm:text-base hover:text-indigo-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
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
