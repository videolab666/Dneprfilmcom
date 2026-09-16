import type {
  ContactPageConfig,
  ContactPageLocaleContent,
  Locale,
  SiteSetting,
} from '../types';

const ru: ContactPageLocaleContent = {
  hero: {
    badge: 'Прямой контакт с продакшеном',
    title: 'Контакты студии',
    accent: 'Dneprfilm',
    description: 'Обсудите ваш прямой эфир, съемку имиджевого видео, таймлапс строительства или фотосессию напрямую с Александром Пителем и технической дирекцией студии.',
    phoneButtonPrefix: 'Позвонить:',
    telegramButton: 'Написать в Telegram',
  },
  contactCards: [
    { id: 'phone', kind: 'phone', icon: 'phone', title: 'Прямая связь с продюсером', subtitle: 'Звонки и срочные вопросы', badge: 'Ответ до 3-5 мин', valueOverride: '', hrefOverride: '' },
    { id: 'telegram', kind: 'telegram', icon: 'message', title: 'Telegram (Рекомендуем)', subtitle: 'Быстрый обмен файлами и ТЗ', badge: 'Самый оперативный', valueOverride: '', hrefOverride: '' },
    { id: 'email', kind: 'email', icon: 'mail', title: 'Официальный Email', subtitle: 'Для брифов, смет и договоров', badge: 'КП за 1-2 часа', valueOverride: '', hrefOverride: '' },
    { id: 'whatsapp', kind: 'whatsapp', icon: 'globe', title: 'WhatsApp / Viber', subtitle: 'Международная связь и мессенджеры', badge: 'Online', valueOverride: '', hrefOverride: '' },
  ],
  form: {
    badge: 'Онлайн-бриф на расчет сметы',
    title: 'Опишите вашу задачу',
    description: 'Заполните форму ниже — мы свяжемся с вами в течение 15 минут с готовыми вариантами сетапа и расчетом бюджета.',
    nameLabel: 'Ваше имя / Компания *',
    namePlaceholder: 'Александр / Компания',
    phoneLabel: 'Телефон *',
    phonePlaceholder: '+380 (__) ___-__-__',
    preferredContactLabel: 'Где вам удобнее получить ответ и смету?',
    preferredContacts: [
      { id: 'telegram', label: '💬 Telegram' },
      { id: 'phone', label: '📞 Звонок' },
      { id: 'whatsapp', label: '🟢 WhatsApp' },
      { id: 'email', label: '✉️ Email' },
    ],
    serviceLabel: 'Направление задачи',
    services: [
      { id: 'LIVE', label: 'LIVE Прямая трансляция (спорт, форум, шоу)' },
      { id: 'VIDEO', label: 'Имиджевый корпоративный фильм / промо' },
      { id: 'CONSTRUCTION', label: 'Мониторинг строительства / 4K таймлапс' },
      { id: 'DRONE', label: 'Аэросъемка & FPV-пролеты цехов' },
      { id: 'COMMERCIAL', label: 'Реклама продукта / фуд-видео' },
      { id: 'PHOTO', label: 'Репортажная или студийная фотосъемка' },
      { id: 'FULL_PACKAGE', label: 'Комплексный медиа-пакет под ключ' },
    ],
    locationLabel: 'Город / Локация',
    locationPlaceholder: 'Днепр, Киев, другой город...',
    defaultLocation: 'Днепр',
    dateLabel: 'Примерная дата / Дедлайн',
    datePlaceholder: 'Например: 25 октября или срочно',
    emailLabel: 'Email (опционально)',
    emailPlaceholder: 'company@domain.ua',
    messageLabel: 'Описание задачи или ссылка на референс',
    messagePlaceholder: 'Расскажите о масштабе проекта, количестве участников или прикрепите ссылку на пример ролика...',
    privacyText: 'Конфиденциальность гарантирована. Заключаем NDA.',
    submitText: 'Получить расчет сметы',
    submittingText: 'Отправка данных...',
    requiredError: 'Пожалуйста, укажите ваше имя и контактный телефон.',
    submitError: 'Не удалось отправить заявку через форму. Пожалуйста, напишите нам напрямую в Telegram или позвоните.',
    eventTypeLabel: 'Контакты: Заявка на просчет',
    cameraCountText: 'Уточняется в ТЗ',
    successTitle: 'Спасибо! Заявка успешно принята',
    successDescription: 'Продюсер Александр Питель или технический директор свяжутся с вами в выбранном мессенджере в течение 15 минут.',
    successButton: 'Отправить еще одну задачу',
  },
  workingHours: {
    title: 'Режим работы',
    subtitle: 'Связь и выездные смены',
    rows: [
      { id: 'office', label: 'Офис & Консультации:', value: 'Пн–Сб 09:00 — 20:00', tone: 'default' },
      { id: 'live', label: 'Эфирные смены & ПТС:', value: '24/7 по графику эфира', tone: 'indigo' },
      { id: 'render', label: 'Ночной рендеринг & монтаж:', value: 'Круглосуточно', tone: 'emerald' },
    ],
  },
  locations: {
    title: 'Локации и съемочные базы',
    items: [
      { id: 'dnipro', icon: 'building', city: 'г. Днепр (Главная база)', address: 'ул. Сичеславская Набережная, 29', description: 'Главный продакшен-офис студии Dneprfilm, монтажные залы, тон-ателье записи звука, склад кинокамер, оптики и технический парк ПТС.', type: 'Штаб-квартира & Студия', mapUrl: '' },
      { id: 'kyiv', icon: 'building', city: 'г. Киев (Оперативная группа)', address: 'ул. Эспланадная, 20 (БЦ рядом с Дворцом Спорта)', description: 'Постоянная съемочная группа и ПТС в столице. Быстрый выезд на ключевые арены (Дворец Спорта, КВЦ Парковый, НСК Олимпийский, Menorah).', type: 'Представительство', mapUrl: '' },
      { id: 'mobile', icon: 'truck', city: 'Выездные ПТС по всей Украине и ЕС', address: 'Спецавтомобили с автономным питанием & Starlink', description: 'Регулярная работа в Одессе, Львове, Харькове, Запорожье, а также выезды в Польшу, Германию и ОАЭ (Дубай Expo). Спутниковый интернет и резервные генераторы 10 кВт.', type: 'Мобильные бригады', mapUrl: '' },
    ],
  },
  legal: {
    title: 'Юридические гарантии',
    items: [
      { id: 'payments', title: 'Безналичный расчет', description: ': ФОП 3 группа без НДС / ТОВ с НДС.' },
      { id: 'contract', title: 'Типовой договор', description: ' с детальной спецификацией техники и хронометража.' },
      { id: 'nda', title: 'Соглашение о неразглашении (NDA)', description: ' для закрытых производств.' },
      { id: 'estimate', title: 'Фиксированная смета', description: ' — без скрытых доплат за бензин или переработку на площадке.' },
    ],
  },
  faq: {
    title: 'Часто задаваемые вопросы по заказу',
    subtitle: 'Все, что нужно знать перед тем, как связаться с нами и утвердить смету',
    items: [
      { id: 'estimate-time', question: 'Как быстро вы можете рассчитать смету и подготовить коммерческое предложение?', answer: 'При наличии базового технического задания (дата, локация, количество камер и формат) мы предоставляем подробный расчет сметы в течение 1–2 часов. Для нестандартных задач возможен оперативный созвон с продюсером.' },
      { id: 'official', question: 'Работаете ли вы официально по договору и с безналичным расчетом?', answer: 'Да, 100% наших проектов реализуются по официальному договору. Работаем как с юридическими лицами с НДС (ТОВ), так и без НДС (ФОП 3 группа). Предоставляем полный пакет закрывающих документов, смет и актов.' },
      { id: 'nda', question: 'Подписываете ли вы NDA (соглашение о неразглашении)?', answer: 'Да, перед съемками на закрытых промышленных заводах, медицинских операциях или закрытых корпоративных форумах мы обязательно подписываем двустороннее соглашение о конфиденциальности.' },
      { id: 'internet', question: 'Что делать, если на локации нет проводного интернета?', answer: 'Мы полностью автономны. В нашем арсенале собственные спутниковые терминалы Starlink с приоритетным трафиком, а также многомодемные 4G-бондинг станции LiveU/Dejero, объединяющие операторов Киевстар, Vodafone и Lifecell.' },
    ],
  },
};

const uk: ContactPageLocaleContent = {
  hero: {
    badge: 'Прямий контакт з продакшеном',
    title: 'Контакти студії',
    accent: 'Dneprfilm',
    description: 'Обговоріть ваш прямий ефір, зйомку іміджевого відео, таймлапс будівництва або фотосесію безпосередньо з Олександром Пітелем та технічною дирекцією студії.',
    phoneButtonPrefix: 'Зателефонувати:',
    telegramButton: 'Написати в Telegram',
  },
  contactCards: [
    { id: 'phone', kind: 'phone', icon: 'phone', title: "Прямий зв'язок з продюсером", subtitle: 'Дзвінки та термінові запитання', badge: 'Відповідь до 3-5 хв', valueOverride: '', hrefOverride: '' },
    { id: 'telegram', kind: 'telegram', icon: 'message', title: 'Telegram (Рекомендуємо)', subtitle: 'Швидкий обмін файлами та ТЗ', badge: 'Найбільш оперативний', valueOverride: '', hrefOverride: '' },
    { id: 'email', kind: 'email', icon: 'mail', title: 'Офіційний Email', subtitle: 'Для брифів, кошторисів та договорів', badge: 'КП за 1-2 години', valueOverride: '', hrefOverride: '' },
    { id: 'whatsapp', kind: 'whatsapp', icon: 'globe', title: 'WhatsApp / Viber', subtitle: "Міжнародний зв'язок та месенджери", badge: 'Online', valueOverride: '', hrefOverride: '' },
  ],
  form: {
    badge: 'Онлайн-бриф на розрахунок кошторису',
    title: 'Опишіть ваше завдання',
    description: "Заповніть форму нижче — ми зв'яжемося з вами протягом 15 хвилин з готовими варіантами сетапу та розрахунком бюджету.",
    nameLabel: "Ваше ім'я / Компанія *",
    namePlaceholder: 'Олександр / Компанія',
    phoneLabel: 'Телефон *',
    phonePlaceholder: '+380 (__) ___-__-__',
    preferredContactLabel: 'Де вам зручніше отримати відповідь та кошторис?',
    preferredContacts: [
      { id: 'telegram', label: '💬 Telegram' },
      { id: 'phone', label: '📞 Дзвінок' },
      { id: 'whatsapp', label: '🟢 WhatsApp' },
      { id: 'email', label: '✉️ Email' },
    ],
    serviceLabel: 'Напрямок завдання',
    services: [
      { id: 'LIVE', label: 'LIVE Пряма трансляція (спорт, форум, шоу)' },
      { id: 'VIDEO', label: 'Іміджевий корпоративний фільм / промо' },
      { id: 'CONSTRUCTION', label: 'Моніторинг будівництва / 4K таймлапс' },
      { id: 'DRONE', label: 'Аерозйомка & FPV-прольоти цехів' },
      { id: 'COMMERCIAL', label: 'Реклама продукту / фуд-відео' },
      { id: 'PHOTO', label: 'Репортажна або студійна фотозйомка' },
      { id: 'FULL_PACKAGE', label: 'Комплексний медіа-пакет під ключ' },
    ],
    locationLabel: 'Місто / Локація',
    locationPlaceholder: 'Дніпро, Київ, інше місто...',
    defaultLocation: 'Дніпро',
    dateLabel: 'Орієнтовна дата / Дедлайн',
    datePlaceholder: 'Наприклад: 25 жовтня або терміново',
    emailLabel: "Email (необов'язково)",
    emailPlaceholder: 'company@domain.ua',
    messageLabel: 'Опис завдання або посилання на референс',
    messagePlaceholder: 'Розкажіть про масштаб проєкту, кількість учасників або прикріпіть посилання на приклад ролика...',
    privacyText: 'Конфіденційність гарантовано. Укладаємо NDA.',
    submitText: 'Отримати розрахунок кошторису',
    submittingText: 'Відправка даних...',
    requiredError: "Будь ласка, вкажіть ваше ім'я та контактний телефон.",
    submitError: 'Не вдалося надіслати заявку через форму. Будь ласка, напишіть нам напряму в Telegram або зателефонуйте.',
    eventTypeLabel: 'Контакти: Заявка на розрахунок',
    cameraCountText: 'Уточнюється в ТЗ',
    successTitle: 'Дякуємо! Заявку успішно прийнято',
    successDescription: "Продюсер Олександр Пітель або технічний директор зв'яжуться з вами в обраному месенджері протягом 15 хвилин.",
    successButton: 'Надіслати ще одну задачу',
  },
  workingHours: {
    title: 'Режим роботи',
    subtitle: "Зв'язок та виїзні зміни",
    rows: [
      { id: 'office', label: 'Офіс & Консультації:', value: 'Пн–Сб 09:00 — 20:00', tone: 'default' },
      { id: 'live', label: 'Ефірні зміни & ПТС:', value: '24/7 за графіком ефіру', tone: 'indigo' },
      { id: 'render', label: 'Нічний рендеринг & монтаж:', value: 'Цілодобово', tone: 'emerald' },
    ],
  },
  locations: {
    title: 'Локації та знімальні бази',
    items: [
      { id: 'dnipro', icon: 'building', city: 'м. Дніпро (Головна база)', address: 'вул. Січеславська Набережна, 29', description: 'Головний продакшен-офіс студії Dneprfilm, монтажні зали, тон-ательє запису звуку, склад кінокамер, оптики та технічний парк ПТС.', type: 'Штаб-квартира & Студія', mapUrl: '' },
      { id: 'kyiv', icon: 'building', city: 'м. Київ (Оперативна група)', address: 'вул. Еспланадна, 20 (БЦ поруч з Палацом Спорту)', description: 'Постійна знімальна група та ПТС у столиці. Швидкий виїзд на ключові локації (Палац Спорту, КВЦ Парковий, НСК Олімпійський тощо).', type: 'Представництво', mapUrl: '' },
      { id: 'mobile', icon: 'truck', city: 'Виїзні ПТС по всій Україні та ЄС', address: 'Спецавтомобілі з автономним живленням & Starlink', description: 'Регулярна робота в Одесі, Львові, Харкові, Запоріжжі, а також виїзди до Польщі, Німеччини та ОАЕ (Дубай Expo). Супутниковий інтернет та резервні генератори 10 кВт.', type: 'Мобільні бригади', mapUrl: '' },
    ],
  },
  legal: {
    title: 'Юридичні гарантії',
    items: [
      { id: 'payments', title: 'Безготівковий розрахунок', description: ': ФОП 3 група без ПДВ / ТОВ з ПДВ.' },
      { id: 'contract', title: 'Типовий договір', description: ' з детальною специфікацією техніки та хронометражу.' },
      { id: 'nda', title: 'Угода про нерозголошення (NDA)', description: ' для закритих виробництв.' },
      { id: 'estimate', title: 'Фіксований кошторис', description: ' — без прихованих доплат за паливо або перепрацювання на майданчику.' },
    ],
  },
  faq: {
    title: 'Часті запитання щодо замовлення',
    subtitle: "Усе, що потрібно знати перед тим, як зв'язатися з нами та затвердити кошторис",
    items: [
      { id: 'estimate-time', question: 'Як швидко ви можете розрахувати кошторис та підготувати комерційну пропозицію?', answer: 'За наявності базового технічного завдання (дата, локація, кількість камер та формат) ми надаємо детальний розрахунок кошторису протягом 1–2 годин. Для нестандартних завдань можливий оперативний дзвінок із продюсером.' },
      { id: 'official', question: 'Чи працюєте ви офіційно за договором та безготівковим розрахунком?', answer: 'Так, 100% наших проєктів реалізуються за офіційним договором. Працюємо як з юридичними особами з ПДВ (ТОВ), так і без ПДВ (ФОП 3 група). Надаємо повний пакет закриваючих документів, кошторисів та актів.' },
      { id: 'nda', question: 'Чи підписуєте ви NDA (угоду про нерозголошення)?', answer: 'Так, перед зйомками на закритих промислових заводах, медичних операціях або закритих корпоративних форумах ми підписуємо двосторонню угоду про конфіденційність.' },
      { id: 'internet', question: 'Що робити, якщо на локації немає дротового інтернету?', answer: 'Ми повністю автономні. У нашому арсеналі власні супутникові термінали Starlink з пріоритетним трафіком, а також багатомодемні 4G-бондинг станції LiveU/Dejero, що об’єднують операторів Київстар, Vodafone та Lifecell.' },
    ],
  },
};

const en: ContactPageLocaleContent = {
  hero: {
    badge: 'Direct production contact',
    title: 'Studio contacts',
    accent: 'Dneprfilm',
    description: 'Discuss your live broadcast, corporate film, construction timelapse or photo production directly with Alexander Pitel and the studio technical team.',
    phoneButtonPrefix: 'Call:',
    telegramButton: 'Message on Telegram',
  },
  contactCards: [
    { id: 'phone', kind: 'phone', icon: 'phone', title: 'Direct producer line', subtitle: 'Calls and urgent questions', badge: 'Reply in 3–5 min', valueOverride: '', hrefOverride: '' },
    { id: 'telegram', kind: 'telegram', icon: 'message', title: 'Telegram (Recommended)', subtitle: 'Fast exchange of files and briefs', badge: 'Fastest channel', valueOverride: '', hrefOverride: '' },
    { id: 'email', kind: 'email', icon: 'mail', title: 'Official Email', subtitle: 'Briefs, estimates and contracts', badge: 'Estimate in 1–2 h', valueOverride: '', hrefOverride: '' },
    { id: 'whatsapp', kind: 'whatsapp', icon: 'globe', title: 'WhatsApp / Viber', subtitle: 'International communication and messengers', badge: 'Online', valueOverride: '', hrefOverride: '' },
  ],
  form: {
    badge: 'Online production estimate brief',
    title: 'Tell us about your project',
    description: 'Complete the form below and we will contact you within 15 minutes with suitable production setups and an initial budget estimate.',
    nameLabel: 'Your name / Company *',
    namePlaceholder: 'Name / Company',
    phoneLabel: 'Phone *',
    phonePlaceholder: '+380 (__) ___-__-__',
    preferredContactLabel: 'Where would you prefer to receive our reply and estimate?',
    preferredContacts: [
      { id: 'telegram', label: '💬 Telegram' },
      { id: 'phone', label: '📞 Phone' },
      { id: 'whatsapp', label: '🟢 WhatsApp' },
      { id: 'email', label: '✉️ Email' },
    ],
    serviceLabel: 'Project type',
    services: [
      { id: 'LIVE', label: 'LIVE Broadcast (sports, forum, show)' },
      { id: 'VIDEO', label: 'Corporate brand film / promo' },
      { id: 'CONSTRUCTION', label: 'Construction monitoring / 4K timelapse' },
      { id: 'DRONE', label: 'Aerial filming & FPV factory fly-throughs' },
      { id: 'COMMERCIAL', label: 'Product advertising / food video' },
      { id: 'PHOTO', label: 'Event or studio photography' },
      { id: 'FULL_PACKAGE', label: 'Turnkey full media package' },
    ],
    locationLabel: 'City / Location',
    locationPlaceholder: 'Dnipro, Kyiv, another city...',
    defaultLocation: 'Dnipro',
    dateLabel: 'Approximate date / Deadline',
    datePlaceholder: 'For example: October 25 or urgent',
    emailLabel: 'Email (optional)',
    emailPlaceholder: 'company@domain.com',
    messageLabel: 'Project description or reference link',
    messagePlaceholder: 'Tell us about the project scale, number of participants, or share a reference link...',
    privacyText: 'Confidentiality guaranteed. NDA available.',
    submitText: 'Request an estimate',
    submittingText: 'Sending...',
    requiredError: 'Please enter your name and contact phone number.',
    submitError: 'The form could not be sent. Please contact us directly via Telegram or phone.',
    eventTypeLabel: 'Contacts: Estimate request',
    cameraCountText: 'To be defined in the brief',
    successTitle: 'Thank you! Your request has been received',
    successDescription: 'Producer Alexander Pitel or our technical director will contact you through your selected channel within 15 minutes.',
    successButton: 'Send another request',
  },
  workingHours: {
    title: 'Working hours',
    subtitle: 'Office communication and field crews',
    rows: [
      { id: 'office', label: 'Office & consultations:', value: 'Mon–Sat 09:00 — 20:00', tone: 'default' },
      { id: 'live', label: 'Live shifts & OB van:', value: '24/7 according to production schedule', tone: 'indigo' },
      { id: 'render', label: 'Overnight rendering & editing:', value: '24/7', tone: 'emerald' },
    ],
  },
  locations: {
    title: 'Locations and production bases',
    items: [
      { id: 'dnipro', icon: 'building', city: 'Dnipro (Main base)', address: '29 Sicheslavska Naberezhna St.', description: 'Dneprfilm main production office with editing suites, sound recording facilities, camera and lens storage, and the OB technical fleet.', type: 'HQ & Studio', mapUrl: '' },
      { id: 'kyiv', icon: 'building', city: 'Kyiv (Field team)', address: '20 Esplanadna St. (near Palace of Sports)', description: 'Permanent production crew and mobile broadcast setup in the capital with rapid deployment to major venues.', type: 'Representation', mapUrl: '' },
      { id: 'mobile', icon: 'truck', city: 'Mobile crews across Ukraine and the EU', address: 'Specialized vehicles with autonomous power & Starlink', description: 'Regular work across Ukraine as well as projects in Poland, Germany and the UAE. Satellite connectivity and backup 10 kW generators.', type: 'Mobile crews', mapUrl: '' },
    ],
  },
  legal: {
    title: 'Legal guarantees',
    items: [
      { id: 'payments', title: 'Bank transfer', description: ': sole proprietor without VAT / LLC with VAT.' },
      { id: 'contract', title: 'Standard contract', description: ' with a detailed equipment and timing specification.' },
      { id: 'nda', title: 'Non-disclosure agreement (NDA)', description: ' for restricted production environments.' },
      { id: 'estimate', title: 'Fixed estimate', description: ' — no hidden fuel or overtime charges.' },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    subtitle: 'What to know before contacting us and approving an estimate',
    items: [
      { id: 'estimate-time', question: 'How quickly can you prepare an estimate and commercial proposal?', answer: 'With a basic brief covering the date, location, camera count and format, we normally prepare a detailed estimate within 1–2 hours. Complex projects can start with an immediate producer call.' },
      { id: 'official', question: 'Do you work under formal contracts and accept bank transfer?', answer: 'Yes. Projects are delivered under formal contracts and we provide the required estimates, acts and closing documents for business customers.' },
      { id: 'nda', question: 'Can you sign an NDA?', answer: 'Yes. We routinely sign bilateral confidentiality agreements before work at restricted industrial facilities, medical productions and closed corporate events.' },
      { id: 'internet', question: 'What if the venue has no wired internet?', answer: 'We can operate autonomously using Starlink terminals with priority traffic and multi-modem 4G bonding systems such as LiveU/Dejero across multiple mobile operators.' },
    ],
  },
};

export const DEFAULT_CONTACTS_PAGE: ContactPageConfig = {
  version: 2,
  layout: {
    sectionOrder: ['hero', 'channels', 'main', 'faq'],
    sectionEnabled: { hero: true, channels: true, main: true, faq: true },
    mainEnabled: { form: true, workingHours: true, locations: true, legal: true },
    rightPanelOrder: ['workingHours', 'locations', 'legal'],
  },
  ru,
  uk,
  en,
};

function cloneLocaleContent(value: ContactPageLocaleContent): ContactPageLocaleContent {
  return JSON.parse(JSON.stringify(value)) as ContactPageLocaleContent;
}

export function normalizeContactsPage(value?: ContactPageConfig | null): ContactPageConfig {
  if (!value) return JSON.parse(JSON.stringify(DEFAULT_CONTACTS_PAGE)) as ContactPageConfig;

  return {
    version: 2,
    layout: {
      sectionOrder: value.layout?.sectionOrder?.length ? [...value.layout.sectionOrder] : [...DEFAULT_CONTACTS_PAGE.layout.sectionOrder],
      sectionEnabled: { ...DEFAULT_CONTACTS_PAGE.layout.sectionEnabled, ...(value.layout?.sectionEnabled || {}) },
      mainEnabled: { ...DEFAULT_CONTACTS_PAGE.layout.mainEnabled, ...(value.layout?.mainEnabled || {}) },
      rightPanelOrder: value.layout?.rightPanelOrder?.length ? [...value.layout.rightPanelOrder] : [...DEFAULT_CONTACTS_PAGE.layout.rightPanelOrder],
    },
    ru: { ...cloneLocaleContent(ru), ...(value.ru || {}) },
    uk: { ...cloneLocaleContent(uk), ...(value.uk || {}) },
    en: { ...cloneLocaleContent(en), ...(value.en || {}) },
  };
}

export function contactsPageForLocale(settings: SiteSetting, locale: Locale): ContactPageLocaleContent {
  const normalized = normalizeContactsPage(settings.contactsPage);
  return normalized[locale] || normalized.uk;
}
