export interface PhotoItem {
  id: string;
  title: string;
  category: 'interior' | 'food' | 'kids' | 'wedding' | 'corporate';
  categoryLabel: string;
  location?: string;
  client?: string;
  description: string;
  imageUrl: string;
  aspect?: 'landscape' | 'portrait' | 'square';
  specs?: string;
}

export const INITIAL_PHOTOS: PhotoItem[] = [
  // --- ИНТЕРЬЕРЫ И АРХИТЕКТУРА ---
  {
    id: 'photo-int-1',
    title: 'Гостиная пентхауса с панорамным остеклением',
    category: 'interior',
    categoryLabel: 'Интерьеры & Архитектура',
    location: 'ЖК Riverside',
    description: 'Интерьерная съемка в естественном свете с сохранением детального вида из окон и прорисовкой фактур дерева и мрамора.',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Sony A7 IV + 16-35mm GM, HDR Bracketing'
  },
  {
    id: 'photo-int-2',
    title: 'Ресторан авторской кухни «Saffron»',
    category: 'interior',
    categoryLabel: 'Интерьеры & Архитектура',
    location: 'Центр города',
    description: 'Вечерний свет ресторана: точечные акцентные споты, теплая камерная атмосфера и выверенная вертикальная геометрия стен.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Съемка со штатива, длинная выдержка'
  },
  {
    id: 'photo-int-3',
    title: 'Вилла в стиле минимализм на закате',
    category: 'interior',
    categoryLabel: 'Интерьеры & Архитектура',
    location: 'Коттеджный поселок',
    description: 'Фасадная архитектурная съемка в «синий час» с включенной ландшафтной подсветкой и отражением в бассейне.',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Golden Hour + Dji Mavic 3 Cine'
  },
  {
    id: 'photo-int-4',
    title: 'Минималистичная спальня с гардеробной',
    category: 'interior',
    categoryLabel: 'Интерьеры & Архитектура',
    location: 'Частный дизайн-проект',
    description: 'Мягкий рассеянный утренний свет, акцент на текстиле, фактуре льна и натурального дуба.',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Polarizing Filter, 24-70mm GM'
  },

  // --- ФУД-СЪЕМКА И МЕНЮ ---
  {
    id: 'photo-food-1',
    title: 'Стейк Рибай сухого вызревания на углях',
    category: 'food',
    categoryLabel: 'Фуд-съемка & Меню',
    client: 'Мясной ресторан & Grill',
    description: 'Макротекстура карамелизированной корочки, свежий розмарин, крупная морская соль и естественный блеск сока.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: '90mm Macro f/2.8, стрипбокс Profoto'
  },
  {
    id: 'photo-food-2',
    title: 'Неаполитанская пицца из дровяной печи',
    category: 'food',
    categoryLabel: 'Фуд-съемка & Меню',
    client: 'Girtech BBQ & Ovens',
    description: 'Пышные леопардовые бортики, свежий базилик, расплавленная моцарелла di bufala и живой огонь на заднем плане.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Импульсный свет с контровым отражателем'
  },
  {
    id: 'photo-food-3',
    title: 'Авторский десерт Павлова с лесными ягодами',
    category: 'food',
    categoryLabel: 'Фуд-съемка & Меню',
    client: 'Кондитерская мастерская',
    description: 'Хрустящее безе, воздушный крем маскарпоне, капли ягодного кули и свежая мята для сезонного меню.',
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Мягкий октабокс, акцентная подсветка текстур'
  },
  {
    id: 'photo-food-4',
    title: 'Крафтовый коктейль с цитрусовым твистом',
    category: 'food',
    categoryLabel: 'Фуд-съемка & Меню',
    client: 'Коктейльный бар',
    description: 'Хрустальный прозрачный лед, капли конденсата на бокале и глубина янтарного цвета напитка.',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Съемка со встречным световым контуром'
  },

  // --- ДЕТСКИЕ ПРАЗДНИКИ И СЕМЕЙНЫЕ СОБЫТИЯ ---
  {
    id: 'photo-kids-1',
    title: 'Задувание свечей на пятилетии',
    category: 'kids',
    categoryLabel: 'Детские праздники',
    location: 'Детский клуб',
    description: 'Искренние детские эмоции, мерцание свечей, праздничный торт и восторг в глазах именинника.',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Быстрый автофокус по глазам, f/1.8'
  },
  {
    id: 'photo-kids-2',
    title: 'Шоу мыльных пузырей и конфетти',
    category: 'kids',
    categoryLabel: 'Детские праздники',
    location: 'Парк развлечений',
    description: 'Динамичный репортажный кадр в движении: полет радужных пузырей, улыбки детей и живая анимация.',
    imageUrl: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Выдержка 1/1000с, мгновенная фиксация эмоций'
  },
  {
    id: 'photo-kids-3',
    title: 'Семейная фотосессия в яблоневом саду',
    category: 'kids',
    categoryLabel: 'Детские праздники',
    location: 'Загородная локация',
    description: 'Теплые естественные объятия родителей с детьми, золотой закатный свет без скованности и позирования.',
    imageUrl: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: '85mm f/1.4 GM, художественное боке'
  },

  // --- СВАДЕБНАЯ СЪЕМКА & LOVE STORY ---
  {
    id: 'photo-wed-1',
    title: 'Выездная церемония на закате у воды',
    category: 'wedding',
    categoryLabel: 'Свадьбы & Love Story',
    location: 'Яхт-клуб Riverside',
    description: 'Трогательный момент обмена клятвами, флористическая арка из живых цветов и золотые лучи заходящего солнца.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Двухкамерный сетап, светосильная оптика'
  },
  {
    id: 'photo-wed-2',
    title: 'Утро невесты: мягкий свет и детали платья',
    category: 'wedding',
    categoryLabel: 'Свадьбы & Love Story',
    location: 'Отель Grand Palace',
    description: 'Нежный утренний свет из окна, фактура кружева, свадебные кольца и искреннее волнение перед встречей.',
    imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: '50mm f/1.2 GM, естественный свет'
  },
  {
    id: 'photo-wed-3',
    title: 'Первый танец под фонтанами искр',
    category: 'wedding',
    categoryLabel: 'Свадьбы & Love Story',
    location: 'Банкетный зал',
    description: 'Холодные фонтаны, тяжелый дым, романтичный танец пары и репортажная съемка восторженных взглядов гостей.',
    imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Вспышка с синхронизатором, радио-управление'
  },

  // --- БИЗНЕС-ПОРТРЕТЫ И РЕПОРТАЖИ ---
  {
    id: 'photo-corp-1',
    title: 'Деловой портрет руководителя в офисе',
    category: 'corporate',
    categoryLabel: 'Бизнес & Репортаж',
    location: 'Бизнес-центр Sky',
    description: 'Уверенный и открытый бизнес-портрет для сайта компании, Forbes и деловых публикаций.',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Мобильный софтбокс, естественный фон'
  },
  {
    id: 'photo-corp-2',
    title: 'Выступление спикера на бизнес-форуме',
    category: 'corporate',
    categoryLabel: 'Бизнес & Репортаж',
    location: 'Конференц-холл',
    description: 'Репортажная съемка ключевого доклада с экранами сцены, реакцией зала и эмоциями спикера.',
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: '70-200mm f/2.8 GM II, работа без вспышки'
  }
];

export const PHOTO_PACKAGES = [
  {
    id: 'pack-interior',
    title: 'Интерьер & Архитектура',
    subtitle: 'Для отелей, ресторанов, застройщиков и дизайнеров',
    price: 'от 4 000 ₴',
    period: 'за объект (до 15-25 ракурсов)',
    badge: 'Популярно в недвижимости',
    features: [
      'Съемка на сверхширокоугольную оптику без искажений',
      'Выравнивание вертикалей и коррекция перспективы',
      'HDR-брекетинг: сохранение красивого вида из окон',
      'Цветокоррекция в Capture One + детальная ретушь',
      'Готовность фото за 48 часов',
      'Передача прав для коммерческого использования'
    ],
    highlight: false
  },
  {
    id: 'pack-food',
    title: 'Фуд-съемка & Меню',
    subtitle: 'Для ресторанов, доставок и маркетплейсов',
    price: 'от 4 500 ₴',
    period: 'за сессию (до 20 блюд)',
    badge: 'Для HoReCa',
    features: [
      'Выездной студийный свет (импульсные моноблоки/стрипбоксы)',
      'Макросъемка аппетитных текстур и свежести ингредиентов',
      'Съемка по таймингу выдачи блюд шеф-поваром',
      'Глубокая цветокоррекция и чистка фона',
      'Форматы под меню, доставку (1:1) и рекламу',
      'Первые 5 фото — в день съемки'
    ],
    highlight: false
  },
  {
    id: 'pack-events',
    title: 'Детские праздники & Ивенты',
    subtitle: 'Дни рождения, юбилеи, корпоративы и выпускные',
    price: 'от 2 000 ₴',
    period: 'за 1 час съемки (от 2 часов)',
    badge: 'Живые эмоции',
    features: [
      'Скоростной репортаж искренних детских эмоций',
      'Съемка всех ключевых моментов (торт, анимация, шоу)',
      'Общие семейные портреты со всеми гостями',
      'Цветокоррекция ВСЕХ удачных снимков (от 80-100 фото/час)',
      'Праздничная онлайн-галерея для скачивания гостями',
      'Анонс из 15 фото в течение 24 часов'
    ],
    highlight: false
  },
  {
    id: 'pack-wedding',
    title: 'Свадебный день & Love Story',
    subtitle: 'Полный день или камерная роспись для двоих',
    price: 'от 12 000 ₴',
    period: 'пакет от сборов до торта',
    badge: 'Особый день',
    features: [
      'Консультация по таймингу и локациям для прогулки',
      'Съемка сборов, выездной церемонии, банкета и танцев',
      'Полнокадровая кинооптика с красивым боке',
      'От 500+ обработанных фотографий с авторским цветом',
      'Деликатная журнальная ретушь крупных портретов',
      'Фирменная онлайн-галерея со сроком хранения 1 год'
    ],
    highlight: false
  },
  {
    id: 'pack-combo',
    title: 'КОМБО: Видео + Фото в один день',
    subtitle: 'Полное медиасопровождение без переплат',
    price: 'от 14 000 ₴',
    period: 'специальная комплексная цена',
    badge: 'Выбор 75% клиентов',
    features: [
      'Слаженная работа оператора и фотографа без конфликтов',
      'Единый цветовой профиль видеоролика и фотографий',
      'Экономия до 25% по сравнению с раздельным заказом',
      'Динамичный видеоролик (Full HD / 4K) + серия фото',
      'Вертикальный Reels/Shorts для соцсетей в подарок',
      'Единый договор и единый ответственный продюсер'
    ],
    highlight: true
  }
];

export const INITIAL_PHOTOS_UK: PhotoItem[] = [
  // --- ІНТЕР'ЄРИ ТА АРХІТЕКТУРА ---
  {
    id: 'photo-int-1',
    title: 'Вітальня пентхаусу з панорамним заскленням',
    category: 'interior',
    categoryLabel: 'Інтер\'єри & Архітектура',
    location: 'ЖК Riverside',
    description: 'Інтер\'єрна зйомка в природному світлі зі збереженням детального виду з вікон та промальовуванням фактур дерева і мармуру.',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Sony A7 IV + 16-35mm GM, HDR Bracketing'
  },
  {
    id: 'photo-int-2',
    title: 'Ресторан авторської кухні «Saffron»',
    category: 'interior',
    categoryLabel: 'Інтер\'єри & Архітектура',
    location: 'Центр міста',
    description: 'Вечірнє світло ресторану: точкові акцентні споти, тепла камерна атмосфера та вивірена вертикальна геометрія стін.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Зйомка зі штатива, довга витримка'
  },
  {
    id: 'photo-int-3',
    title: 'Вілла в стилі мінімалізм на заході сонця',
    category: 'interior',
    categoryLabel: 'Інтер\'єри & Архітектура',
    location: 'Котеджне містечко',
    description: 'Фасадна архітектурна зйомка в «синю годину» з увімкненим ландшафтним підсвічуванням та відображенням у басейні.',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Golden Hour + Dji Mavic 3 Cine'
  },
  {
    id: 'photo-int-4',
    title: 'Мінімалістична спальня з гардеробною',
    category: 'interior',
    categoryLabel: 'Інтер\'єри & Архітектура',
    location: 'Приватний дизайн-проєкт',
    description: 'М\'яке розсіяне ранкове світло, акцент на текстилі, фактурі льону та натурального дуба.',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Polarizing Filter, 24-70mm GM'
  },

  // --- ФУД-ЗЙОМКА ТА МЕНЮ ---
  {
    id: 'photo-food-1',
    title: 'Стейк Рібай сухого визрівання на вугіллі',
    category: 'food',
    categoryLabel: 'Фуд-зйомка & Меню',
    client: 'М\'ясний ресторан & Grill',
    description: 'Макротекстура карамелізованої скоринки, свіжий розмарин, велика морська сіль та природний блиск соку.',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: '90mm Macro f/2.8, стріпбокс Profoto'
  },
  {
    id: 'photo-food-2',
    title: 'Неаполітанська піца з дров\'яної печі',
    category: 'food',
    categoryLabel: 'Фуд-зйомка & Меню',
    client: 'Girtech BBQ & Ovens',
    description: 'Пишні леопардові бортики, свіжий базилік, розплавлена моцарела di bufala та живий вогонь на задньому плані.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Імпульсне світло з контровим відбивачем'
  },
  {
    id: 'photo-food-3',
    title: 'Авторський десерт Павлова з лісовими ягодами',
    category: 'food',
    categoryLabel: 'Фуд-зйомка & Меню',
    client: 'Кондитерська майстерня',
    description: 'Хрустке безе, повітряний крем маскарпоне, краплі ягідного кулі та свіжа м\'ята для сезонного меню.',
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'М\'який октабокс, акцентне підсвічування текстур'
  },
  {
    id: 'photo-food-4',
    title: 'Крафтовий коктейль із цитрусовим твістом',
    category: 'food',
    categoryLabel: 'Фуд-зйомка & Меню',
    client: 'Коктейльний бар',
    description: 'Кришталевий прозорий лід, краплі конденсату на келиху та глибина бурштинового кольору напою.',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Зйомка зі зустрічним світловим контуром'
  },

  // --- ДИТЯЧІ СВЯТА ТА СІМЕЙНІ ПОДІЇ ---
  {
    id: 'photo-kids-1',
    title: 'Задування свічок на п\'ятиріччі',
    category: 'kids',
    categoryLabel: 'Дитячі свята',
    location: 'Дитячий клуб',
    description: 'Щирі дитячі емоції, мерехтіння свічок, святковий торт та захват в очах іменинника.',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Швидкий автофокус за очима, f/1.8'
  },
  {
    id: 'photo-kids-2',
    title: 'Шоу мильних бульбашок та конфеті',
    category: 'kids',
    categoryLabel: 'Дитячі свята',
    location: 'Парк розваг',
    description: 'Динамічний репортажний кадр у русі: політ райдужних бульбашок, посмішки дітей та жива анімація.',
    imageUrl: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Витримка 1/1000с, миттєва фіксація емоцій'
  },
  {
    id: 'photo-kids-3',
    title: 'Сімейна фотосесія в яблуневому саду',
    category: 'kids',
    categoryLabel: 'Дитячі свята',
    location: 'Заміська локація',
    description: 'Теплі природні обійми батьків з дітьми, золоте західне світло без скутості та позування.',
    imageUrl: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: '85mm f/1.4 GM, художнє боке'
  },

  // --- ВЕСІЛЬНА ЗЙОМКА & LOVE STORY ---
  {
    id: 'photo-wed-1',
    title: 'Виїзна церемонія на заході сонця біля води',
    category: 'wedding',
    categoryLabel: 'Весілля & Love Story',
    location: 'Яхт-клуб Riverside',
    description: 'Зворушливий момент обміну обітницями, флористична арка з живих квітів та золоті промені сонця, що сідає.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Двокамерний сетап, світлосильна оптика'
  },
  {
    id: 'photo-wed-2',
    title: 'Ранок нареченої: м\'яке світло та деталі сукні',
    category: 'wedding',
    categoryLabel: 'Весілля & Love Story',
    location: 'Готель Grand Palace',
    description: 'Ніжне ранкове світло з вікна, фактура мережива, весільні обручки та щире хвилювання перед зустріччю.',
    imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: '50mm f/1.2 GM, природне світло'
  },
  {
    id: 'photo-wed-3',
    title: 'Перший танець під фонтанами іскор',
    category: 'wedding',
    categoryLabel: 'Весілля & Love Story',
    location: 'Банкетний зал',
    description: 'Холодні фонтани, важкий дим, романтичний танець пари та репортажна зйомка захоплених поглядів гостей.',
    imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Спалах із синхронізатором, радіо-керування'
  },

  // --- БІЗНЕС-ПОРТРЕТИ ТА РЕПОРТАЖІ ---
  {
    id: 'photo-corp-1',
    title: 'Діловий портрет керівника в офісі',
    category: 'corporate',
    categoryLabel: 'Бізнес & Репортаж',
    location: 'Бізнес-центр Sky',
    description: 'Впевнений та відкритий бізнес-портрет для сайту компанії, Forbes та ділових публікацій.',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: 'Мобільний софтбокс, природний фон'
  },
  {
    id: 'photo-corp-2',
    title: 'Виступ спікера на бізнес-форумі',
    category: 'corporate',
    categoryLabel: 'Бізнес & Репортаж',
    location: 'Конференц-хол',
    description: 'Репортажна зйомка ключової доповіді з екранами сцени, реакцією залу та емоціями спікера.',
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=85&w=1200',
    aspect: 'landscape',
    specs: '70-200mm f/2.8 GM II, робота без спалаху'
  }
];

export const PHOTO_PACKAGES_UK = [
  {
    id: 'pack-interior',
    title: 'Інтер\'єр & Архітектура',
    subtitle: 'Для готелів, ресторанів, забудовників та дизайнерів',
    price: 'від 4 000 ₴',
    period: 'за об\'єкт (до 15-25 ракурсів)',
    badge: 'Популярно в нерухомості',
    features: [
      'Зйомка на надширококутну оптику без спотворень',
      'Вирівнювання вертикалей та корекція перспективи',
      'HDR-брекетинг: збереження красивого виду з вікон',
      'Кольорокорекція в Capture One + детальна ретуш',
      'Готовність фото за 48 годин',
      'Передача прав для комерційного використання'
    ],
    highlight: false
  },
  {
    id: 'pack-food',
    title: 'Фуд-зйомка & Меню',
    subtitle: 'Для ресторанів, доставок та маркетплейсів',
    price: 'від 4 500 ₴',
    period: 'за сесію (до 20 страв)',
    badge: 'Для HoReCa',
    features: [
      'Виїзне студійне світло (імпульсні моноблоки/стріпбокси)',
      'Макрозйомка апетитних текстур та свіжості інгредієнтів',
      'Зйомка за таймінгом видачі страв шеф-кухарем',
      'Глибока кольорокорекція та чистка фону',
      'Формати під меню, доставку (1:1) та рекламу',
      'Перші 5 фото — у день зйомки'
    ],
    highlight: false
  },
  {
    id: 'pack-events',
    title: 'Дитячі свята & Івенти',
    subtitle: 'Дні народження, ювілеї, корпоративи та випускні',
    price: 'від 2 000 ₴',
    period: 'за 1 годину зйомки (від 2 годин)',
    badge: 'Живі емоції',
    features: [
      'Швидкісний репортаж щирих дитячих емоцій',
      'Зйомка всіх ключових моментів (торт, анімація, шоу)',
      'Спільні сімейні портрети з усіма гостями',
      'Кольорокорекція ВСІХ вдалих знімків (від 80-100 фото/год)',
      'Святкова онлайн-галерея для завантаження гостями',
      'Анонс із 15 фото протягом 24 годин'
    ],
    highlight: false
  },
  {
    id: 'pack-wedding',
    title: 'Весільний день & Love Story',
    subtitle: 'Повний день або камерний розпис для двох',
    price: 'від 12 000 ₴',
    period: 'пакет від зборів до торта',
    badge: 'Особливий день',
    features: [
      'Консультація щодо таймінгу та локацій для прогулянки',
      'Зйомка зборів, виїзної церемонії, банкету та танців',
      'Повнокадрова кінооптика з красивим боке',
      'Від 500+ оброблених фотографій з авторським кольором',
      'Делікатна журнальна ретуш великих портретів',
      'Фірмова онлайн-галерея з терміном зберігання 1 рік'
    ],
    highlight: false
  },
  {
    id: 'pack-combo',
    title: 'КОМБО: Відео + Фото в один день',
    subtitle: 'Повний медіасупровід без переплат',
    price: 'від 14 000 ₴',
    period: 'спеціальна комплексна ціна',
    badge: 'Вибір 75% клієнтів',
    features: [
      'Злагоджена робота оператора та фотографа без конфліктів',
      'Єдиний колірний профіль відеоролика та фотографій',
      'Економія до 25% у порівнянні з окремим замовленням',
      'Динамічний відеоролик (Full HD / 4K) + серія фото',
      'Вертикальний Reels/Shorts для соцмереж у подарунок',
      'Єдиний договір та єдиний відповідальний продюсер'
    ],
    highlight: true
  }
];
