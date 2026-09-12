import { SiteSetting, SiteBlock } from '../types';

export const DEFAULT_SITE_SETTINGS: SiteSetting = {
  studioName: 'Dneprfilm',
  studioName_uk: 'Dneprfilm',
  phone: '+380 (67) 560-68-80',
  email: 'Dneprfilmcom@gmail.com',
  telegram: '@dneprfilm',
  whatsapp: '+380675606880',
  address: 'г. Днепр, ул. Сичеславская Набережная, 29 / Киев, ул. Эспланадная, 20 (выезды по всей Украине и ЕС)',
  address_uk: 'м. Дніпро, вул. Січеславська Набережна, 29 / Київ, вул. Еспланадна, 20 (виїзди по всій Україні та ЄС)',
  workingHours: 'Пн-Сб: 09:00 - 20:00 (Эфирные смены и выездные съемки 24/7)',
  workingHours_uk: 'Пн-Сб: 09:00 - 20:00 (Ефірні зміни та виїзні зйомки 24/7)',
  // Hero
  heroBadge: 'ПТС 4K HDR • Starlink • Zero Failure Protocol',
  heroBadge_uk: 'ПТС 4K HDR • Starlink • Zero Failure Protocol',
  heroTitle: 'Медиа-продакшен и прямые трансляции без права на ошибку',
  heroTitle_uk: 'Медіа-продакшн та прямі трансляції без права на помилку',
  heroSubtitle: 'Телевизионный стандарт многокамерного эфира, имиджевое видео и мониторинг строительных объектов от команды Александра Пителя.',
  heroSubtitle_uk: 'Телевізійний стандарт багатокамерного ефіру, іміджеве відео та моніторинг будівельних об\'єктів від команди Олександра Пітеля.',
  heroCtaPrimaryText: 'Флагман: LIVE Production',
  heroCtaPrimaryText_uk: 'Флагман: LIVE Production',
  heroCtaPrimaryLink: '/live',
  heroCtaSecondaryText: 'Смотреть кейсы',
  heroCtaSecondaryText_uk: 'Дивитися кейси',
  heroCtaSecondaryLink: '#cases-section',
  heroBgImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',
  // Founder
  founderName: 'Александр Питель',
  founderName_uk: 'Олександр Пітель',
  founderRole: 'Основатель студии Dneprfilm & Генеральный продюсер',
  founderRole_uk: 'Засновник студії Dneprfilm & Генеральний продюсер',
  founderQuote: 'Я создал студию Dneprfilm, чтобы помогать бизнесу, спортивным лигам и застройщикам решать задачи через бескомпромиссное качество видео и прямых эфиров. За каждый проект я отвечаю лично.',
  founderQuote_uk: 'Я створив студію Dneprfilm, щоб допомагати бізнесу, спортивним лігам та забудовникам вирішувати завдання через безкомпромісну якість відео та прямих ефірів. За кожен проєкт я відповідаю особисто.',
  founderBio: 'Мы работаем по строгим телевизионным стандартам качества. В прямом эфире и на съемках масштабных заводов нет права на второй дубль. Наш регламент исключает технические сбои еще на этапе предварительного аудита локации.',
  founderBio_uk: 'Ми працюємо за суворими телевізійними стандартами якості. У прямому ефірі та на зйомках масштабних заводів немає права на другий дубль. Наш регламент виключає технічні збої ще на етапі попереднього аудиту локації.',
  founderPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
  // Announcement
  announcementEnabled: false,
  announcementText: '🔥 Открыта бронь ПТС на сезон конференций и турниров. Скидка 10% на раннее бронирование.',
  announcementText_uk: '🔥 Відкрито бронювання ПТС на сезон конференцій та турнірів. Знижка 10% на раннє бронювання.',
  announcementLink: '/live',
  // Socials
  youtubeUrl: 'https://youtube.com/@dneprfilm',
  instagramUrl: 'https://instagram.com/dneprfilm',
  facebookUrl: 'https://facebook.com/dneprfilm',
};

export const DEFAULT_SITE_SETTINGS_UK: SiteSetting = {
  ...DEFAULT_SITE_SETTINGS,
  address: 'м. Дніпро, вул. Січеславська Набережна, 29 / Київ, вул. Еспланадна, 20 (виїзди по всій Україні та ЄС)',
  workingHours: 'Пн-Сб: 09:00 - 20:00 (Ефірні зміни та виїзні зйомки 24/7)',
  heroBadge: 'ПТС 4K HDR • Starlink • Zero Failure Protocol',
  heroTitle: 'Медіа-продакшн та прямі трансляції без права на помилку',
  heroSubtitle: 'Телевізійний стандарт багатокамерного ефіру, іміджеве відео та моніторинг будівельних об\'єктів від команди Олександра Пітеля.',
  heroCtaPrimaryText: 'Флагман: LIVE Production',
  heroCtaSecondaryText: 'Дивитися кейси',
  founderName: 'Олександр Пітель',
  founderRole: 'Засновник студії Dneprfilm & Генеральний продюсер',
  founderQuote: 'Я створив студію Dneprfilm, щоб допомагати бізнесу, спортивним лігам та забудовникам вирішувати завдання через безкомпромісну якість відео та прямих ефірів. За кожен проєкт я відповідаю особисто.',
  founderBio: 'Ми працюємо за суворими телевізійними стандартами якості. У прямому ефірі та на зйомках масштабних заводів немає права на другий дубль. Наш регламент виключає технічні збої ще на етапі попереднього аудиту локації.',
  announcementText: '🔥 Відкрито бронювання ПТС на сезон конференцій та турнірів. Знижка 10% на раннє бронювання.',
};

export const DEFAULT_SITE_SETTINGS_EN: SiteSetting = {
  ...DEFAULT_SITE_SETTINGS,
  address: 'Dnipro, Sicheslavska Naberezhna, 29 / Kyiv, Esplanadna, 20 (deployments across Ukraine and EU)',
  workingHours: 'Mon-Sat: 09:00 - 20:00 (Broadcast shifts & on-location shoots 24/7)',
  heroBadge: 'OB Van 4K HDR • Starlink • Zero Failure Protocol',
  heroTitle: 'Media Production & Live Broadcasting with Zero Margin for Error',
  heroSubtitle: 'Television-standard multi-camera live streaming, commercial video, and construction monitoring by Alexander Pitel’s team.',
  heroCtaPrimaryText: 'Flagship: LIVE Production',
  heroCtaSecondaryText: 'View Case Studies',
  founderName: 'Alexander Pitel',
  founderRole: 'Founder of Dneprfilm Studio & Executive Producer',
  founderQuote: 'I founded Dneprfilm Studio to help businesses, sports leagues, and developers achieve their goals with uncompromising video quality and live broadcasts. I personally oversee every single project.',
  founderBio: 'We work according to strict television quality standards. During live broadcasts and complex industrial shoots, there is no second take. Our protocol eliminates technical failures at the site audit stage.',
  announcementText: '🔥 OB Van booking is now open for the upcoming conference and tournament season. 10% discount for early reservations.',
};

export const DEFAULT_SITE_BLOCKS: SiteBlock[] = [
  {
    id: 'block-stats',
    title: 'Ключевые цифры студии (Метрики)',
    type: 'stats_counter',
    order: 1,
    isActive: true,
    page: 'home',
    config: {
      heading: 'Факты и цифры надежности',
      subheading: 'Реальные показатели качества за 7 лет работы на ключевых аренах страны',
      style: 'dark',
      items: [
        { value: '450+', title: 'Прямых эфиров', description: 'Спорт, бизнес-форумы, концерты' },
        { value: '0 сек', title: 'Простоя эфира', description: 'Благодаря двойному резервированию' },
        { value: '4K 60fps', title: 'Стандарт вещания', description: 'Чистый цифровой 12G-SDI тракт' },
        { value: '100 Мбит/с', title: 'Starlink канал', description: 'Автономный стриминг из любой точки' }
      ]
    }
  },
  {
    id: 'block-tech-advantage',
    title: 'Техническое превосходство (Текст + Картинка)',
    type: 'text_image',
    order: 2,
    isActive: true,
    page: 'home',
    config: {
      badge: 'Инженерия вещания',
      heading: 'Почему наши трансляции никогда не прерываются',
      content: 'Каждый выезд студии комплектуется системой гарантированного питания (online ИБП с чистой синусоидой), спутниковым терминалом Starlink Gen 2 и 4G-мультибондингом с 4 независимыми операторами. Даже если на площадке погаснет свет или пропадет проводной интернет, зритель не заметит ни миллисекунды задержки.',
      imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
      imagePosition: 'right',
      buttonText: 'Рассчитать ПТС в калькуляторе',
      buttonLink: '/live#calc-section',
      style: 'light'
    }
  },
  {
    id: 'block-faq',
    title: 'Часто задаваемые вопросы (FAQ)',
    type: 'faq',
    order: 3,
    isActive: true,
    page: 'home',
    config: {
      heading: 'Часто задаваемые вопросы',
      subheading: 'Все, что нужно знать перед заказом трансляции, видеосъемки или 3D-тура',
      style: 'light',
      faqItems: [
        {
          question: 'Сколько времени требуется на подготовку и монтаж ПТС на локации?',
          answer: 'Стандартное время заезда и развертывания режиссерского узла, прокладки защищенных кабельных трасс и настройки камер — от 3 до 5 часов до старта мероприятия. Для масштабных фестивалей и турниров мы проводим технический чек-ин накануне вечером.'
        },
        {
          question: 'Что происходит, если на локации полностью отключится электричество?',
          answer: 'Весь наш режиссерский комплекс и ключевые камеры запитаны через промышленные online ИБП двойного преобразования. При аварии на подстанции оборудование мгновенно переходит на аккумуляторы, а затем подключается автономный генератор.'
        },
        {
          question: 'Можно ли передавать прямые трансляции одновременно на YouTube, Facebook и в закрытый Zoom/платформу?',
          answer: 'Да, наш медиасервер поддерживает мультистриминг на неограниченное количество платформ одновременно без потери битрейта, включая защищенные корпоративные порталы и CDN с авторизацией.'
        },
        {
          question: 'Выезжает ли съемочная группа в другие города и страны?',
          answer: 'Да. Мы регулярно работаем в Киеве, Днепре, Львове, Одессе, Харькове и выезжаем в страны Европы со всем комплектом сертифицированного оборудования.'
        }
      ]
    }
  },
  {
    id: 'block-cta-banner',
    title: 'Широкий баннер призыва (CTA)',
    type: 'cta',
    order: 4,
    isActive: true,
    page: 'home',
    config: {
      heading: 'Планируете мероприятие или съемку?',
      subheading: 'Получите детальный технический райдер и предварительную смету в течение 30 минут.',
      buttonText: 'Связаться с Александром Пителем',
      buttonLink: '#contact-cta',
      secondaryButtonText: 'Перейти в калькулятор LIVE',
      secondaryButtonLink: '/live',
      style: 'indigo'
    }
  }
];

export const DEFAULT_SITE_BLOCKS_UK: SiteBlock[] = [
  {
    id: 'block-stats',
    title: 'Ключові цифри студії (Метрики)',
    type: 'stats_counter',
    order: 1,
    isActive: true,
    page: 'home',
    config: {
      heading: 'Факти та цифри надійності',
      subheading: 'Реальні показники якості за 7 років роботи на ключових аренах країни',
      style: 'dark',
      items: [
        { value: '450+', title: 'Прямих ефірів', description: 'Спорт, бізнес-форуми, концерти' },
        { value: '0 сек', title: 'Простою ефіру', description: 'Завдяки подвійному резервуванню' },
        { value: '4K 60fps', title: 'Стандарт мовлення', description: 'Чистий цифровий 12G-SDI тракт' },
        { value: '100 Мбіт/с', title: 'Starlink канал', description: 'Автономний стрімінг з будь-якої точки' }
      ]
    }
  },
  {
    id: 'block-tech-advantage',
    title: 'Технічна перевага (Текст + Зображення)',
    type: 'text_image',
    order: 2,
    isActive: true,
    page: 'home',
    config: {
      badge: 'Інженерія мовлення',
      heading: 'Чому наші трансляції ніколи не перериваються',
      content: 'Кожен виїзд студії комплектується системою гарантованого живлення (online ДБЖ з чистою синусоїдою), супутниковим терміналом Starlink Gen 2 та 4G-мультибондингом з 4 незалежними операторами. Навіть якщо на майданчику згасне світло або зникне дротовий інтернет, глядач не помітить жодної мілісекунди затримки.',
      imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
      imagePosition: 'right',
      buttonText: 'Розрахувати ПТС у калькуляторі',
      buttonLink: '/live#calc-section',
      style: 'light'
    }
  },
  {
    id: 'block-faq',
    title: 'Часті запитання (FAQ)',
    type: 'faq',
    order: 3,
    isActive: true,
    page: 'home',
    config: {
      heading: 'Часті запитання',
      subheading: 'Все, що потрібно знати перед замовленням трансляції, відеозйомки або 3D-туру',
      style: 'light',
      faqItems: [
        {
          question: 'Скільки часу потрібно на підготовку та монтаж ПТС на локації?',
          answer: 'Стандартний час заїзду та розгортання режисерського вузла, прокладання захищених кабельних трас та налаштування камер — від 3 до 5 годин до старту заходу. Для масштабних фестивалів та турнірів ми проводимо технічний чек-ін напередодні ввечері.'
        },
        {
          question: 'Що відбувається, якщо на локації повністю вимкнеться електрика?',
          answer: 'Весь наш режисерський комплекс та ключові камери заживлені через промислові online ДБЖ подвійного перетворення. При аварії на підстанції обладнання миттєво переходить на акумулятори, а потім підключається автономний генератор.'
        },
        {
          question: 'Чи можна передавати прямі трансляції одночасно на YouTube, Facebook та в закритий Zoom/платформу?',
          answer: 'Так, наш медіасервер підтримує мультістрімінг на необмежену кількість платформ одночасно без втрати бітрейту, включаючи захищені корпоративні портали та CDN з авторизацією.'
        },
        {
          question: 'Чи виїжджає знімальна група в інші міста та країни?',
          answer: 'Так. Ми регулярно працюємо в Києві, Дніпрі, Львові, Одесі, Харкові та виїжджаємо до країн Європи з усім комплектом сертифікованого обладнання.'
        }
      ]
    }
  },
  {
    id: 'block-cta-banner',
    title: 'Широкий банер заклику (CTA)',
    type: 'cta',
    order: 4,
    isActive: true,
    page: 'home',
    config: {
      heading: 'Плануєте захід або зйомку?',
      subheading: 'Отримайте детальний технічний райдер та попередній кошторис протягом 30 хвилин.',
      buttonText: 'Зв\'язатися з Олександром Пітелем',
      buttonLink: '#contact-cta',
      secondaryButtonText: 'Перейти до калькулятора LIVE',
      secondaryButtonLink: '/live',
      style: 'indigo'
    }
  }
];
