import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Play, 
  Sparkles, 
  Camera, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Compass, 
  CloudSun, 
  HardHat, 
  Sliders, 
  Send, 
  Clock, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Award,
  Video,
  Radio,
  FileCheck,
  Check,
  Maximize2
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSiteContent } from '../context/SiteContentContext';
import { usePageCmsContent } from '../hooks/usePageCmsContent';

// Featured construction showcase items
const SHOWCASED_CONSTRUCTION_WORKS_RU = [
  {
    id: 'case-riverside',
    title: 'Строительный мониторинг & 3D-панорамы ЖК Riverside',
    objectType: 'Жилой комплекс комфорт-класса (24 этажа)',
    client: 'Девелоперская группа Grand House',
    duration: '24 месяца наблюдения (от котлована до сдачи)',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&q=80&w=1000',
    description: 'Круглогодичный непрерывный мониторинг строительства 24-этажного монолитно-каркасного комплекса: 2 автономных 4K таймлапс-камеры с башенных кранов, ежемесячные GPS-облеты дроном и виртуальные 3D-панорамы видов из окон будущих квартир.',
    features: ['2 точки таймлапса 24/7', 'GPS-привязка дрона', '3D виды из окон 5–24 этажей', 'Ежемесячные Reels'],
    results: '+35% удаленных продаж квартир на этапе монолита благодаря интерактивным панорамам видов.'
  },
  {
    id: 'case-logistics',
    title: 'Логистический комплекс «West Gate Hub»',
    objectType: 'Индустриально-складской парк класса А (35 000 м²)',
    client: 'Инвестиционная группа Logistics Capital',
    duration: '14 месяцев активного строительства',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000',
    description: 'Аудит и видеоконтроль монтажа металлоконструкций, сэндвич-панелей и бетонных полов с топпингом. Фиксация перемещения техники и графика сдачи очередей для кредитного комитета банка.',
    features: ['Термобоксы IP67 на мачтах', 'Ортофотопланы кровли', 'Контроль графика генподрядчика', 'Таймлапс-фильм 4K'],
    results: '100% прозрачность перед банком-кредитором и привлечение якорных арендаторов еще до ввода объекта.'
  },
  {
    id: 'case-cottage',
    title: 'Коттеджный поселок закрытого типа «Green Hills»',
    objectType: 'Элитный поселок (42 домовладения + инфраструктура)',
    client: 'Строительная компания Green Hills Development',
    duration: '18 месяцев',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000',
    description: 'Медиасопровождение прокладки коммуникаций, асфальтирования дорог и возведения вилл. Визуализация ландшафтного благоустройства, прогулочных аллей и зон отдыха для премиального отдела продаж.',
    features: ['Аэросъемка в золотой час', 'FPV-пролеты между домами', 'Интерактивная карта участков', 'Фильм для инвесторов'],
    results: 'Полная распродажа первой очереди коттеджей в течение 6 месяцев с начала рекламной кампании.'
  }
];

const SHOWCASED_CONSTRUCTION_WORKS_UK = [
  {
    id: 'case-riverside',
    title: 'Будівельний моніторинг & 3D-панорами ЖК Riverside',
    objectType: 'Житловий комплекс комфорт-класу (24 поверхи)',
    client: 'Девелоперська група Grand House',
    duration: '24 місяці спостереження (від котловану до здачі)',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&q=80&w=1000',
    description: 'Цілорічний безперервний моніторинг будівництва 24-поверхового монолітно-каркасного комплексу: 2 автономні 4K таймлапс-камери з баштових кранів, щомісячні GPS-обльоти дроном та віртуальні 3D-панорами краєвидів з вікон майбутніх квартир.',
    features: ['2 точки таймлапсу 24/7', 'GPS-прив\'язка дрона', '3D види з вікон 5–24 поверхів', 'Щомісячні Reels'],
    results: '+35% віддалених продажів квартир на етапі моноліту завдяки інтерактивним панорамах краєвидів.'
  },
  {
    id: 'case-logistics',
    title: 'Логістичний комплекс «West Gate Hub»',
    objectType: 'Індустріально-складський парк класу А (35 000 м²)',
    client: 'Інвестиційна група Logistics Capital',
    duration: '14 місяців активного будівництва',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000',
    description: 'Аудит та відеоконтроль монтажу металоконструкцій, сендвіч-панелей та бетонних підлог із топінгом. Фіксація переміщення техніки та графіка здачі черг для кредитного комітету банку.',
    features: ['Термобокси IP67 на щоглах', 'Ортофотоплани покрівлі', 'Контроль графіка генпідрядника', 'Таймлапс-фільм 4K'],
    results: '100% прозорість перед банком-кредитором та залучення якірних орендарів ще до введення об\'єкта.'
  },
  {
    id: 'case-cottage',
    title: 'Котеджне містечко закритого типу «Green Hills»',
    objectType: 'Елітне містечко (42 домоволодіння + інфраструктура)',
    client: 'Будівельна компанія Green Hills Development',
    duration: '18 місяців',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1000',
    description: 'Медіасупровід прокладання комунікацій, асфальтування доріг та зведення вілл. Візуалізація ландшафтного благоустрою, прогулянкових алей та зон відпочинку для преміального відділу продажів.',
    features: ['Аерозйомка у золоту годину', 'FPV-прольоти між будинками', 'Інтерактивна карта ділянок', 'Фільм для інвесторів'],
    results: 'Повний розпродаж першої черги котеджів протягом 6 місяців від початку рекламної кампанії.'
  }
];

// Core media solutions
const SOLUTIONS_RU = [
  {
    id: 'timelapse',
    title: 'Автономный 4K Таймлапс 24/7',
    subtitle: 'Непрерывное наблюдение сквозь месяцы и сезоны',
    icon: <Camera className="w-6 h-6 text-amber-500" />,
    badge: 'Круглосуточно',
    description: 'Установка профессиональных камер высокого разрешения в специализированных термобоксах IP67 с подогревом стекол, защитой от строительной пыли, осадков и вибраций кранов.',
    bullets: [
      'Кадры каждые 5–15 минут круглосуточно в разрешении 4K Ultra HD',
      'Бесперебойное питание 220V + автономный резерв UPS',
      'Передача данных по 4G/LTE в облачный дашборд',
      'Финальный динамичный ролик стройки от нуля за 2-3 минуты'
    ]
  },
  {
    id: 'drone-inspection',
    title: 'Регулярная Аэросъемка по GPS',
    subtitle: 'Высокоточная фиксация прогресса с дрона',
    icon: <Compass className="w-6 h-6 text-indigo-500" />,
    badge: '1–2 раза в месяц',
    description: 'Облет объекта по строго запрограммированным GPS-координатам. Сохранение одинаковых ракурсов, высоты и наклона камеры на всех визитах для идеального визуального сопоставления темпов строительства.',
    bullets: [
      'Официальные разрешения на полеты и опытные пилоты',
      'Кинематографичные круговые облеты и ортофотопланы',
      'Эффект бесшовного превращения «было — стало» для рекламы',
      'Видеофиксация труднодоступных узлов кровли и фасадов'
    ]
  },
  {
    id: 'panoramas-360',
    title: '3D-Аэропанорамы видов из окон',
    subtitle: 'Оружие №1 для отдела продаж квартир',
    icon: <Eye className="w-6 h-6 text-emerald-500" />,
    badge: 'Для отдела продаж',
    description: 'Съемка интерактивных 360-градусных аэропанорам на точной высоте будущих этажей (5-й, 10-й, 20-й, пентхаусы) еще на стадии фундамента или монолитного каркаса здания.',
    bullets: [
      'Покупатель видит реальный вид из окна спальни за 2 года до сдачи',
      'Демонстрация рассветов, закатов, парков и городского горизонта',
      'Интеграция на сайт застройщика и в презентационные планшеты',
      'Увеличение конверсии в бронирование квартир на верхних этажах'
    ]
  },
  {
    id: 'bank-audit',
    title: 'Видеоаудит для Инвесторов и Банков',
    subtitle: 'Независимое медиадоказательство темпов',
    icon: <FileCheck className="w-6 h-6 text-blue-500" />,
    badge: 'Технадзор & Банк',
    description: 'Структурированные ежемесячные видеоотчеты с инфографикой, титрами объемов выполненных работ (кубометры бетона, этажи, кирпичная кладка, монтаж остекления).',
    bullets: [
      'Контроль соответствия графику генподрядчика',
      'Официальный отчет для кредитных комитетов банков',
      'Архив фото- и видеоматериалов с фиксацией скрытых работ',
      'Защита интересов девелопера при спорах с подрядчиками'
    ]
  },
  {
    id: 'marketing-reels',
    title: 'Маркетинговые ролики для соцсетей',
    subtitle: 'Живой контент для Instagram, YouTube & TikTok',
    icon: <Video className="w-6 h-6 text-rose-500" />,
    badge: 'SMM & Реклама',
    description: 'Ежемесячный монтаж сочных вертикальных Reels/Shorts и горизонтальных роликов для подогрева интереса покупателей и ведения социальных сетей девелопера.',
    bullets: [
      'Энергичный монтаж под трендовые аудиодорожки',
      'Титры со статусом готовности объекта и спецпредложениями',
      'Съемка эстетики фасадов в вечернее режимное время',
      'Форматы под мобильные экраны и городские LED-билборды'
    ]
  },
  {
    id: 'live-stream',
    title: 'Live-трансляция стройки на сайт',
    subtitle: '100% доверие инвесторов и открытость',
    icon: <Radio className="w-6 h-6 text-purple-500" />,
    badge: 'Трансляция',
    description: 'Организация стабильного защищенного видеопотока со строительной площадки для встраивания в официальный сайт жилого комплекса и личный кабинет инвестора.',
    bullets: [
      'Видеоплеер без рекламы с адаптивным битрейтом',
      'Совместимость с любыми CMS и мобильными браузерами',
      'Резервирование интернет-канала через 4G LTE модемы',
      'Рост лояльности покупателей благодаря полной открытости'
    ]
  }
];

const SOLUTIONS_UK = [
  {
    id: 'timelapse',
    title: 'Автономний 4K Таймлапс 24/7',
    subtitle: 'Безперервний моніторинг крізь місяці та сезони',
    icon: <Camera className="w-6 h-6 text-amber-500" />,
    badge: 'Цілодобово',
    description: 'Встановлення професійних камер високої роздільної здатності у спеціалізованих термобоксах IP67 з підігрівом скла, захистом від будівельного пилу, опадів та вібрацій кранів.',
    bullets: [
      'Кадри кожні 5–15 хвилин цілодобово у роздільній здатності 4K Ultra HD',
      'Безперебійне живлення 220V + автономний резерв UPS',
      'Передача даних через 4G/LTE до хмарного дашборду',
      'Фінальний динамічний ролик будівництва від нуля за 2-3 хвилини'
    ]
  },
  {
    id: 'drone-inspection',
    title: 'Регулярна Аерозйомка за GPS',
    subtitle: 'Високоточна фіксація прогресу з дрона',
    icon: <Compass className="w-6 h-6 text-indigo-500" />,
    badge: '1–2 рази на місяць',
    description: 'Обліт об\'єкта за чітко запрограмованими GPS-координатами. Збереження однакових ракурсів, висоти та нахилу камери на всіх візитах для ідеального візуального зіставлення темпів будівництва.',
    bullets: [
      'Офіційні дозволи на польоти та досвідчені пілоти',
      'Кінематографічні кругові обльоти та ортофотоплани',
      'Ефект безшовного перетворення «було — стало» для реклами',
      'Відеофіксація важкодоступних вузлів покрівлі та фасадів'
    ]
  },
  {
    id: 'panoramas-360',
    title: '3D-Аеропанорами краєвидів з вікон',
    subtitle: 'Зброя №1 для відділу продажів квартир',
    icon: <Eye className="w-6 h-6 text-emerald-500" />,
    badge: 'Для відділу продажів',
    description: 'Зйомка інтерактивних 360-градусних аеропанорам на точній висоті майбутніх поверхів (5-й, 10-й, 20-й, пентхауси) ще на стадії фундаменту чи монолітного каркаса будівлі.',
    bullets: [
      'Покупець бачить реальний краєвид з вікна спальні за 2 роки до здачі',
      'Демонстрація світанків, заходів сонця, парків та міського горизонту',
      'Інтеграція на сайт забудовника та у презентаційні планшети',
      'Збільшення конверсії у бронювання квартир на верхніх поверхах'
    ]
  },
  {
    id: 'bank-audit',
    title: 'Відеоаудит для Інвесторів та Банків',
    subtitle: 'Незалежний медіадоказ темпів',
    icon: <FileCheck className="w-6 h-6 text-blue-500" />,
    badge: 'Технагляд & Банк',
    description: 'Структуровані щомісячні відеозвіти з інфографікою, титрами обсягів виконаних робіт (кубометри бетону, поверхи, цегляна кладка, монтаж скління).',
    bullets: [
      'Контроль відповідності графіку генпідрядника',
      'Офіційний звіт для кредитних комітетів банків',
      'Архів фото- та відеоматеріалів із фіксацією прихованих робіт',
      'Захист інтересів девелопера при суперечках із підрядниками'
    ]
  },
  {
    id: 'marketing-reels',
    title: 'Маркетингові ролики для соцмереж',
    subtitle: 'Живий контент для Instagram, YouTube & TikTok',
    icon: <Video className="w-6 h-6 text-rose-500" />,
    badge: 'SMM & Реклама',
    description: 'Щомісячний монтаж яскравих вертикальних Reels/Shorts та горизонтальних роликів для підігріву інтересу покупців та ведення соціальних мереж девелопера.',
    bullets: [
      'Енергійний монтаж під трендові аудіодоріжки',
      'Титри зі статусом готовності об\'єкта та спецпропозиціями',
      'Зйомка естетики фасадів у вечірній режимний час',
      'Формати під мобільні екрани та міські LED-білборди'
    ]
  },
  {
    id: 'live-stream',
    title: 'Live-трансляція будівництва на сайт',
    subtitle: '100% довіра інвесторів та відкритість',
    icon: <Radio className="w-6 h-6 text-purple-500" />,
    badge: 'Трансляція',
    description: 'Організація стабільного захищеного відеопотоку з будівельного майданчика для вбудовування в офіційний сайт житлового комплексу та особистий кабінет інвестора.',
    bullets: [
      'Відеоплеєр без реклами з адаптивним бітрейтом',
      'Сумісність із будь-якими CMS та мобільними браузерами',
      'Резервування інтернет-каналу через 4G LTE модеми',
      'Зростання лояльності покупців завдяки повній відкритості'
    ]
  }
];

// Workflow steps
const WORKFLOW_STEPS_RU = [
  {
    step: '01',
    title: 'Инженерный скаутинг объекта',
    desc: 'Выезд на стройплощадку, выбор оптимальных точек крепления камер (башенный кран, соседнее здание, мачта), замер углов обзора и проверка источников электропитания.'
  },
  {
    step: '02',
    title: 'Монтаж термобоксов & запуск канала',
    desc: 'Установка герметичного оборудования IP67, прокладка защищенных кабелей, настройка автономных контроллеров и резервного облачного хранилища кадров.'
  },
  {
    step: '03',
    title: 'Калибровка GPS-полетных точек',
    desc: 'Определение точных спутниковых координат для регулярных полетов дрона. Запись траекторий для абсолютно идентичных ракурсов на протяжении всего года.'
  },
  {
    step: '04',
    title: 'Ежемесячная выдача медиапакета',
    desc: 'Передача готовых материалов отделу маркетинга и технадзору: ускоренный таймлапс месяца, фотоотчет высокого разрешения, аэровидео и готовые Reels.'
  }
];

const WORKFLOW_STEPS_UK = [
  {
    step: '01',
    title: 'Інженерний скаутинг об\'єкта',
    desc: 'Виїзд на будмайданчик, вибір оптимальних точок кріплення камер (баштовий кран, сусідня будівля, щогла), замір кутів огляду та перевірка джерел електроживлення.'
  },
  {
    step: '02',
    title: 'Монтаж термобоксів & запуск каналу',
    desc: 'Встановлення герметичного обладнання IP67, прокладання захищених кабелів, налаштування автономних контролерів та резервного хмарного сховища кадрів.'
  },
  {
    step: '03',
    title: 'Калібрування GPS-польотних точок',
    desc: 'Визначення точних супутникових координат для регулярних польотів дрона. Запис траєкторій для абсолютно ідентичних ракурсів протягом усього року.'
  },
  {
    step: '04',
    title: 'Щомісячна видача медіапакета',
    desc: 'Передача готових матеріалів відділу маркетингу та технагляду: прискорений таймлапс місяця, фотозвіт високої роздільної здатності, аеровідео та готові Reels.'
  }
];

// FAQ items
const FAQS_RU = [
  {
    q: 'Что происходит с камерой таймлапса при отключении электричества на стройке?',
    a: 'Наши системы оснащены встроенным блоком бесперебойного питания (UPS). При кратковременном отключении электричества камера продолжает съемку без потери кадров. При длительном отключении система безопасно сохраняет буфер и автоматически возобновляет работу и синхронизацию с облаком сразу после подачи напряжения.'
  },
  {
    q: 'Как оборудование выдерживает мороз, дождь и цементную пыль?',
    a: 'Камеры монтируются в промышленные герметичные термобоксы класса защиты IP67 с автоматическим подогревом фронтального стекла (защита от запотевания и обледенения) и козырьком от осадков. Рабочий температурный диапазон — от -25°C до +50°C.'
  },
  {
    q: 'Законны ли полеты дронов и есть ли у вас официальные разрешения?',
    a: 'Наши операторы БПЛА имеют необходимую государственную сертификацию и опыт работы. Перед каждым полетом мы согласовываем регламент с администрацией площадки и службой безопасности девелопера с соблюдением актуальных требований воздушного законодательства.'
  },
  {
    q: 'В каком формате отдел продаж получает 3D-аэропанорамы видов из окон?',
    a: 'Мы предоставляем готовый интерактивный HTML5-виджет, который легко встраивается на сайт ЖК или открывается на iPad менеджера в офисе продаж. Клиент может вращать вид на 360°, приближать детали парка или набережной и переключаться между этажами.'
  },
  {
    q: 'Как часто отдел маркетинга получает готовые видеоролики?',
    a: 'Стандартный график — 1 раз в месяц в течение 2-3 дней после проведения плановой съемки. При необходимости срочных релизов (заливка фундамента, монтаж шпиля, старт продаж секции) возможна выдача готового ролика в течение 24 часов.'
  }
];

const FAQS_UK = [
  {
    q: 'Що відбувається з камерою таймлапсу при відключенні електрики на будівництві?',
    a: 'Наші системи оснащені вбудованим блоком безперебійного живлення (UPS). При короткочасному відключенні електрики камера продовжує зйомку без втрати кадрів. При тривалому відключенні система безпечно зберігає буфер і автоматично відновлює роботу та синхронізацію з хмарою відразу після подачі напруги.'
  },
  {
    q: 'Як обладнання витримує мороз, дощ та цементний пил?',
    a: 'Камери монтуються у промислові герметичні термобокси класу захисту IP67 з автоматичним підігрівом фронтального скла (захист від запотівання та обмерзання) та козирком від опадів. Робочий температурний діапазон — від -25°C до +50°C.'
  },
  {
    q: 'Чи законні польоти дронів та чи є у вас офіційні дозволи?',
    a: 'Наші оператори БПЛА мають необхідну державну сертифікацію та досвід роботи. Перед кожним польотом ми погоджуємо регламент із адміністрацією майданчика та службою безпеки девелопера з дотриманням актуальних вимог повітряного законодавства.'
  },
  {
    q: 'В якому форматі відділ продажів отримує 3D-аеропанорами краєвидів з вікон?',
    a: 'Ми надаємо готовий інтерактивний HTML5-віджет, який легко вбудовується на сайт ЖК або відкривається на iPad менеджера в офісі продажів. Клієнт може обертати вид на 360°, наближати деталі парку чи набережної та перемикатися між поверхами.'
  },
  {
    q: 'Як часто відділ маркетингу отримує готові відеоролики?',
    a: 'Стандартний графік — 1 раз на місяць протягом 2-3 днів після проведення планової зйомки. За необхідності термінових релізів (заливання фундаменту, монтаж шпиля, старт продажів секції) можлива видача готового ролика протягом 24 годин.'
  }
];

export function ConstructionMedia() {
  const { isUk, settings } = useSiteContent();
  const { content: pageContent, localize } = usePageCmsContent();

  const showcaseWorks = localize(pageContent.construction.works).map(item => ({
    id: item.id,
    title: item.text.title || '',
    objectType: item.text.meta1 || '',
    client: item.text.meta2 || '',
    duration: item.text.meta3 || '',
    image: item.imageUrl || '',
    description: item.text.description || '',
    features: item.text.items || [],
    results: item.text.result || '',
  }));
  const solutions = isUk ? SOLUTIONS_UK : SOLUTIONS_RU;
  const workflowSteps = isUk ? WORKFLOW_STEPS_UK : WORKFLOW_STEPS_RU;
  const faqs = isUk ? FAQS_UK : FAQS_RU;

  // Configurator state
  const [objectType, setObjectType] = useState<'residential' | 'cottage' | 'logistics' | 'infrastructure'>('residential');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [timelapseCameras, setTimelapseCameras] = useState<number>(2);
  const [droneFrequency, setDroneFrequency] = useState<'none' | 'monthly' | 'biweekly' | 'weekly'>('monthly');
  const [needWindowPanoramas, setNeedWindowPanoramas] = useState<boolean>(true);
  const [needMonthlyReels, setNeedMonthlyReels] = useState<boolean>(true);
  const [needLiveStream, setNeedLiveStream] = useState<boolean>(false);

  // Inquiry form
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactNote, setContactNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Approximate pricing calculation
  const calculateEstimate = () => {
    let monthlyBase = 0;

    // Base camera maintenance & cloud archive
    monthlyBase += timelapseCameras * 4500; // 4,500 грн/мес за точку таймлапса

    // Drone flight frequency
    if (droneFrequency === 'monthly') monthlyBase += 6000;
    if (droneFrequency === 'biweekly') monthlyBase += 11000;
    if (droneFrequency === 'weekly') monthlyBase += 20000;

    // Addons
    if (needWindowPanoramas) monthlyBase += 3500;
    if (needMonthlyReels) monthlyBase += 4000;
    if (needLiveStream) monthlyBase += 3000;

    const totalEstimate = monthlyBase * durationMonths;
    return {
      monthly: monthlyBase,
      total: totalEstimate
    };
  };

  const estimate = calculateEstimate();

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) return;

    setSubmitting(true);
    try {
      const configurationSummary = isUk
        ? `Об'єкт: ${
            objectType === 'residential' ? 'Багатоповерховий ЖК' :
            objectType === 'cottage' ? 'Котеджне містечко' :
            objectType === 'logistics' ? 'Склад / Логістика / Завод' : 'Інфраструктурний об\'єкт'
          }; Термін: ${durationMonths} міс; Камер таймлапсу: ${timelapseCameras}; Дрон: ${droneFrequency}; Панорами краєвидів: ${needWindowPanoramas ? 'Так' : 'Ні'}; Reels: ${needMonthlyReels ? 'Так' : 'Ні'}; Live-стрім: ${needLiveStream ? 'Так' : 'Ні'}; Розрахунок: ~${estimate.monthly.toLocaleString()} грн/міс.`
        : `Объект: ${
            objectType === 'residential' ? 'Многоэтажный ЖК' :
            objectType === 'cottage' ? 'Коттеджный поселок' :
            objectType === 'logistics' ? 'Склад / Логистика / Завод' : 'Инфраструктурный объект'
          }; Срок: ${durationMonths} мес; Камер таймлапса: ${timelapseCameras}; Дрон: ${droneFrequency}; Панорамы видов: ${needWindowPanoramas ? 'Да' : 'Нет'}; Reels: ${needMonthlyReels ? 'Да' : 'Нет'}; Live-стрим: ${needLiveStream ? 'Да' : 'Нет'}; Расчет: ~${estimate.monthly.toLocaleString()} грн/мес.`;

      await addDoc(collection(db, 'leads'), {
        name: contactName,
        phone: contactPhone,
        company: contactCompany || (isUk ? 'Не вказана' : 'Не указана'),
        service: isUk ? 'Construction Media — Моніторинг будівництва' : 'Construction Media — Мониторинг строительства',
        eventType: isUk ? 'Будівельний об\'єкт' : 'Строительный объект',
        message: contactNote ? `${contactNote} | ${isUk ? 'Конфігурація' : 'Конфигурация'}: ${configurationSummary}` : configurationSummary,
        status: 'new',
        createdAt: Date.now()
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting construction inquiry:', error);
      alert(isUk ? 'Помилка під час надсилання заявки. Будь ласка, зателефонуйте нам напряму.' : 'Ошибка при отправке заявки. Пожалуйста, позвоните нам напрямую.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 bg-slate-950 text-white overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[140px]" />
          <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-indigo-600 rounded-full blur-[140px]" />
        </div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Column */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-6">
                <HardHat className="w-3.5 h-3.5" />
                <span>{isUk ? 'Інженерний медіамоніторинг для девелоперів' : 'Инженерный медиамониторинг для девелоперов'}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-6">
                {isUk ? 'Медіаконтроль' : 'Медиаконтроль'} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-indigo-400">
                  {isUk ? 'будівництва & 4K Аеромоніторинг' : 'строительства & 4K Аэромониторинг'}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8 max-w-2xl">
                {isUk
                  ? 'Автономний 4K таймлапс 24/7 у термобоксах IP67, регулярні обльоти дронами за фіксованими GPS-точками, 3D-аеропанорами краєвидів з вікон майбутніх квартир та відеозвіти для інвесторів і банків.'
                  : 'Автономный 4K таймлапс 24/7 в термобоксах IP67, регулярные облеты дронами по фиксированным GPS-точкам, 3D-аэропанорамы видов из окон будущих квартир и видеоотчеты для инвесторов и банков.'}
              </p>

              {/* Badges / Differentiators */}
              <div className="flex flex-wrap gap-2.5 mb-10">
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUk ? 'Термобокси IP67 (-25°C...+50°C)' : 'Термобоксы IP67 (-25°C...+50°C)'}</span>
                </div>
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUk ? 'GPS-польоти без розбіжності ракурсів' : 'GPS-полеты без расхождения ракурсов'}</span>
                </div>
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUk ? 'Хмарний доступ для технагляду' : 'Облачный доступ для технадзора'}</span>
                </div>
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isUk ? 'Інструмент для відділу продажів ЖК' : 'Инструмент для отдела продаж ЖК'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#calculator"
                  className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
                >
                  <Sliders className="w-4 h-4" />
                  <span>{isUk ? 'Розрахувати кошторис моніторингу' : 'Рассчитать смету мониторинга'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#showcase"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-sm font-semibold transition-colors"
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>{isUk ? 'Дивитися об\'єкти' : 'Смотреть объекты'}</span>
                </a>
              </div>
            </div>

            {/* Right Hero Column: Visual Monitor Widget */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-2 group">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950">
                  <img
                    src="https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&q=80&w=1000"
                    alt={isUk ? 'Будівельний таймлапс 4K' : 'Строительный таймлапс 4K'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/40" />

                  {/* Top Status */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{isUk ? 'CAM 01 — ЖК Riverside (Кран 2)' : 'CAM 01 — ЖК Riverside (Кран 2)'}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider">
                      4K LIVE
                    </span>
                  </div>

                  {/* Bottom Stats Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-400">{isUk ? 'Прогрес зведення:' : 'Прогресс возведения:'}</span>
                      <span className="text-amber-400 font-black">{isUk ? '22 з 24 поверхів (91%)' : '22 из 24 этажей (91%)'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 w-[91%]" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-300 text-center pt-2 border-t border-slate-800">
                      <div>
                        <div className="font-bold text-white">43 200+</div>
                        <div className="text-slate-500">{isUk ? 'Знімків у хмарі' : 'Снимков в облаке'}</div>
                      </div>
                      <div>
                        <div className="font-bold text-white">{isUk ? '24 міс' : '24 мес'}</div>
                        <div className="text-slate-500">{isUk ? 'Термін проєкту' : 'Срок проекта'}</div>
                      </div>
                      <div>
                        <div className="font-bold text-emerald-400">100%</div>
                        <div className="text-slate-500">{isUk ? 'Аптайм системи' : 'Аптайм системы'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THREE KEY BENEFITS FOR DEVELOPER */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-amber-400 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6 font-black text-xl">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isUk ? 'Збільшення темпу продажів квартир' : 'Увеличение темпа продаж квартир'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isUk
                  ? '3D-панорами краєвидів з вікон майбутніх квартир та динамічні щомісячні ролики будівництва знімають страх «недобудови» та залучають покупців з інших міст.'
                  : '3D-панорамы видов из окон будущих квартир и динамичные ежемесячные ролики стройки снимают страх «недостроя» и привлекают покупателей из других городов.'}
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-indigo-400 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 font-black text-xl">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isUk ? 'Бездоганний аудит для банків та інвесторів' : 'Безупречный аудит для банков и инвесторов'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isUk
                  ? '100% документальна відеофіксація обсягів робіт, темпів заливання моноліту та прокладання мереж захищає девелопера при кредитуванні та перевірках.'
                  : '100% документальная видеофиксация объемов работ, темпов заливки монолита и прокладки сетей защищает девелопера при кредитовании и проверках.'}
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 font-black text-xl">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isUk ? 'Автономність & Надійність 24/7' : 'Автономность & Надежность 24/7'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {isUk
                  ? 'Обладнання працює без участі персоналу будівництва: захищені термобокси з підігрівом, безперебійне живлення та пряма передача даних у захищену хмару.'
                  : 'Оборудование работает без участия персонала стройки: защищенные термобоксы с подогревом, бесперебойное питание и прямая передача данных в защищенное облако.'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CORE MEDIA SOLUTIONS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>{isUk ? 'Інструменти девелопменту' : 'Инструменты девелопмента'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              {isUk ? 'Повний медіакомплекс для будівельного майданчика' : 'Полный медиакомплекс для строительной площадки'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {isUk
                ? 'Ми об\'єднуємо передову кінооптику, безпілотну авіацію та промислову телеметрію в єдину злагоджену систему.'
                : 'Мы объединяем передовую кинооптику, беспилотную авиацию и промышленную телеметрию в единую слаженную систему.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((sol) => (
              <div
                key={sol.id}
                className="bg-white rounded-3xl p-8 border border-slate-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      {sol.icon}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                      {sol.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {sol.title}
                  </h3>
                  <p className="text-xs font-semibold text-amber-600 mb-4">
                    {sol.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {sol.description}
                  </p>

                  <ul className="space-y-2.5 mb-6">
                    {sol.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="#calculator"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-900 hover:text-amber-600 pt-4 border-t border-slate-100 transition-colors"
                >
                  <span>{isUk ? 'Включити до кошторису проєкту' : 'Включить в смету проекта'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. SHOWCASED PROJECTS */}
      <section id="showcase" className="py-24 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Building2 className="w-3.5 h-3.5" />
                <span>{isUk ? 'Реалізований досвід студії' : 'Реализованный опыт студии'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                {isUk ? 'Об\'єкти під медіанаглядом' : 'Объекты под медианаблюдением'}
              </h2>
            </div>
            <Link
              to="/cases"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition-colors"
            >
              <span>{isUk ? 'Всі кейси в портфоліо' : 'Все кейсы в портфолио'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {showcaseWorks.map((work) => (
              <div
                key={work.id}
                className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-amber-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src={work.image}
                      alt={work.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    <div className="absolute top-3.5 left-3.5">
                      <span className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-amber-400 text-[10px] font-black border border-amber-500/20">
                        {work.duration}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3.5 right-3.5 text-xs text-slate-300 font-semibold truncate">
                      {work.client}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-[11px] font-bold text-amber-400 mb-1">
                      {work.objectType}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">
                      {work.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      {work.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {work.features.map((f, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-[10px] font-medium border border-slate-700/50">
                          {f}
                        </span>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                      <span className="font-bold text-amber-400 block mb-0.5">
                        {isUk ? 'Результат для девелопера:' : 'Результат для девелопера:'}
                      </span>
                      <span>{work.results}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <a
                    href="#calculator"
                    className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-bold transition-all"
                  >
                    <span>{isUk ? 'Розрахувати схожий об\'єкт' : 'Рассчитать подобный объект'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE CONSTRUCTION CALCULATOR */}
      <section id="calculator" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold mb-3">
              <Sliders className="w-3.5 h-3.5" />
              <span>{isUk ? 'Інтерактивний конфігуратор' : 'Интерактивный конфигуратор'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              {isUk ? 'Розрахуйте попередній кошторис моніторингу' : 'Рассчитайте предварительную смету мониторинга'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {isUk
                ? 'Оберіть параметри вашого споруджуваного об\'єкта, необхідну кількість точок таймлапсу та частоту польотів дрона.'
                : 'Выберите параметры вашего строящегося объекта, необходимое количество точек таймлапса и частоту полетов дрона.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Configurator Column */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Object Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {isUk ? '1. Тип будівельного об\'єкта' : '1. Тип строительного объекта'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'residential', label: isUk ? 'Житловий комплекс' : 'Жилой комплекс', sub: isUk ? 'Багатоповерховий ЖК' : 'Многоэтажный ЖК' },
                    { id: 'cottage', label: isUk ? 'Котеджне містечко' : 'Коттеджный поселок', sub: isUk ? 'Вілли, таунхауси' : 'Виллы, таунхаусы' },
                    { id: 'logistics', label: isUk ? 'Склад / Завод' : 'Склад / Завод', sub: isUk ? 'Індустріальний парк' : 'Индустриальный парк' },
                    { id: 'infrastructure', label: isUk ? 'Інфраструктура' : 'Инфраструктура', sub: isUk ? 'ТРЦ, дороги, мости' : 'ТРЦ, дороги, мосты' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setObjectType(t.id as any)}
                      className={`p-4 rounded-2xl text-left border transition-all ${
                        objectType === t.id
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className={`text-[10px] mt-0.5 ${objectType === t.id ? 'text-slate-900' : 'text-slate-500'}`}>
                        {t.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {isUk ? '2. Запланований термін медіасупроводу' : '2. Планируемый срок медиасопровождения'}
                  </label>
                  <span className="text-sm font-black text-amber-600">
                    {durationMonths} {isUk ? 'місяців' : 'месяцев'} ({Math.round(durationMonths / 12 * 10) / 10} {isUk ? 'року' : 'года'})
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="36"
                  step="1"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>3 {isUk ? 'міс' : 'мес'}</span>
                  <span>12 {isUk ? 'міс (1 рік)' : 'мес (1 год)'}</span>
                  <span>24 {isUk ? 'міс (2 роки)' : 'мес (2 года)'}</span>
                  <span>36 {isUk ? 'міс (3 роки)' : 'мес (3 года)'}</span>
                </div>
              </div>

              {/* Timelapse Cameras */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {isUk ? '3. Кількість автономних 4K таймлапс-камер 24/7' : '3. Количество автономных 4K таймлапс-камер 24/7'}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { count: 0, label: isUk ? 'Без таймлапсу' : 'Без таймлапса' },
                    { count: 1, label: isUk ? '1 камера (Загальний план)' : '1 камера (Общий план)' },
                    { count: 2, label: isUk ? '2 камери (2 ракурси)' : '2 камеры (2 ракурса)' },
                    { count: 3, label: isUk ? '3+ камери (Комплекс)' : '3+ камеры (Комплекс)' },
                  ].map((c) => (
                    <button
                      key={c.count}
                      type="button"
                      onClick={() => setTimelapseCameras(c.count)}
                      className={`p-3.5 rounded-2xl text-center border transition-all ${
                        timelapseCameras === c.count
                          ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-black">{c.count === 0 ? '—' : `${c.count} ${isUk ? 'шт' : 'шт'}`}</div>
                      <div className="text-[10px] mt-0.5 text-slate-400">{c.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drone Frequency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {isUk ? '4. Частота польотів дрона за фіксованими GPS-точками' : '4. Частота полетов дрона по фиксированным GPS-точкам'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'none', label: isUk ? 'Без дрона' : 'Без дрона', desc: isUk ? 'Тільки камери' : 'Только камеры' },
                    { id: 'monthly', label: isUk ? '1 раз на місяць' : '1 раз в месяц', desc: isUk ? 'Базовий звіт' : 'Базовый отчет' },
                    { id: 'biweekly', label: isUk ? '2 рази на місяць' : '2 раза в месяц', desc: isUk ? 'Оптимально' : 'Оптимально' },
                    { id: 'weekly', label: isUk ? 'Щотижня' : 'Еженедельно', desc: isUk ? 'Макс. динаміка' : 'Макс. динамика' },
                  ].map((df) => (
                    <button
                      key={df.id}
                      type="button"
                      onClick={() => setDroneFrequency(df.id as any)}
                      className={`p-3.5 rounded-2xl text-left border transition-all ${
                        droneFrequency === df.id
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{df.label}</div>
                      <div className={`text-[10px] mt-0.5 ${droneFrequency === df.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {df.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {isUk ? '5. Додаткові опції для відділу продажів та маркетингу' : '5. Дополнительные опции для отдела продаж и маркетинга'}
                </label>
                <div className="space-y-3">
                  
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={needWindowPanoramas}
                        onChange={(e) => setNeedWindowPanoramas(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {isUk ? '3D-аеропанорами краєвидів з вікон майбутніх квартир (поповерхово)' : '3D-аэропанорамы видов из окон будущих квартир (поэтажно)'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isUk ? 'Для демонстрації покупцям реальних краєвидів з вікон пентхаусів та середніх поверхів' : 'Для демонстрации покупателям реальных видов из окон пентхаусов и средних этажей'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 shrink-0">+3 500 ₴/{isUk ? 'міс' : 'мес'}</span>
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={needMonthlyReels}
                        onChange={(e) => setNeedMonthlyReels(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {isUk ? 'Щомісячний динамічний Reels/Shorts для соцмереж девелопера' : 'Ежемесячный динамичный Reels/Shorts для соцсетей девелопера'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isUk ? 'Змонтований ролик зі статусом готовності та титрами виконаних обсягів' : 'Смонтированный ролик со статусом готовности и титрами выполненных объемов'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 shrink-0">+4 000 ₴/{isUk ? 'міс' : 'мес'}</span>
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={needLiveStream}
                        onChange={(e) => setNeedLiveStream(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {isUk ? 'Пряма онлайн-трансляція з будівництва на сайт забудовника' : 'Прямая онлайн-трансляция со стройки на сайт застройщика'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isUk ? 'Плеєр без реклами з адаптивним бітрейтом для вбудовування на сайт ЖК' : 'Плеер без рекламы с адаптивным битрейтом для встраивания на сайт ЖК'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 shrink-0">+3 000 ₴/{isUk ? 'міс' : 'мес'}</span>
                  </label>

                </div>
              </div>

            </div>

            {/* Right Summary & Lead Form */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800">
                
                <div className="border-b border-slate-800 pb-6 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    {isUk ? 'Кошторис будівельного моніторингу' : 'Смета строительного мониторинга'}
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white">
                    {isUk ? 'від' : 'от'} {estimate.monthly.toLocaleString()} ₴ <span className="text-xs text-slate-400 font-normal">/ {isUk ? 'місяць' : 'месяц'}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {isUk ? 'Орієнтовний бюджет на' : 'Ориентировочный бюджет на'} {durationMonths} {isUk ? 'міс' : 'мес'}: ~{estimate.total.toLocaleString()} ₴
                  </div>
                </div>

                {/* Selected summary */}
                <div className="space-y-2 text-xs text-slate-300 mb-8">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">{isUk ? 'Об\'єкт:' : 'Объект:'}</span>
                    <span className="font-semibold text-white">
                      {objectType === 'residential' ? (isUk ? 'Багатоповерховий ЖК' : 'Многоэтажный ЖК') :
                       objectType === 'cottage' ? (isUk ? 'Котеджне містечко' : 'Коттеджный поселок') :
                       objectType === 'logistics' ? (isUk ? 'Склад / Логістика' : 'Склад / Логистика') : (isUk ? 'Інфраструктура' : 'Инфраструктура')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">{isUk ? 'Таймлапс 24/7:' : 'Таймлапс 24/7:'}</span>
                    <span className="font-semibold text-white">{timelapseCameras} {isUk ? 'точки' : 'точки'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">{isUk ? 'Польоти дрона:' : 'Полеты дрона:'}</span>
                    <span className="font-semibold text-white">
                      {droneFrequency === 'none' ? (isUk ? 'Без дрона' : 'Без дрона') :
                       droneFrequency === 'monthly' ? (isUk ? '1 раз на місяць' : '1 раз в месяц') :
                       droneFrequency === 'biweekly' ? (isUk ? '2 рази на місяць' : '2 раза в месяц') : (isUk ? 'Щотижня' : 'Еженедельно')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">{isUk ? 'Термін проєкту:' : 'Срок проекта:'}</span>
                    <span className="font-semibold text-amber-400">{durationMonths} {isUk ? 'місяців' : 'месяцев'}</span>
                  </div>
                </div>

                {/* Form */}
                {submitted ? (
                  <div className="py-6 text-center space-y-3 bg-slate-800/50 rounded-2xl p-4 border border-emerald-500/30">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{isUk ? 'Заявку прийнято!' : 'Заявка принята!'}</h3>
                    <p className="text-xs text-slate-300">
                      {isUk ? 'Олександр Пітель зв\'яжеться з вами для узгодження виїзду інженера на майданчик.' : 'Александр Питель свяжется с вами для согласования выезда инженера на площадку.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isUk ? 'Ваше ім\'я та посада *' : 'Ваше имя и должность *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={isUk ? 'Олексій, Керівник проєкту' : 'Алексей, Руководитель проекта'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isUk ? 'Девелопер / Будівельна компанія' : 'Девелопер / Строительная компания'}
                      </label>
                      <input
                        type="text"
                        value={contactCompany}
                        onChange={(e) => setContactCompany(e.target.value)}
                        placeholder={isUk ? 'ТОВ «Гранд Девелопмент»' : 'ООО «Гранд Девелопмент»'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isUk ? 'Телефон / Telegram *' : 'Телефон / Telegram *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+380 (__) ___-__-__"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isUk ? 'Локація об\'єкта / Додаткові побажання' : 'Локация объекта / Дополнительные пожелания'}
                      </label>
                      <textarea
                        rows={2}
                        value={contactNote}
                        onChange={(e) => setContactNote(e.target.value)}
                        placeholder={isUk ? 'м. Дніпро / Київ, старт моноліту наступного місяця...' : 'г. Днепр / Киев, старт монолита в следующем месяце...'}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? (isUk ? 'Надсилання...' : 'Отправка...') : (isUk ? 'Отримати комерційну пропозицію' : 'Получить коммерческое предложение')}</span>
                    </button>
                    
                    <p className="text-[10px] text-slate-500 text-center">
                      {isUk ? 'Можливий безготівковий розрахунок з ПДВ / ФОП. Повний юридичний супровід.' : 'Возможен безналичный расчет с НДС / ФОП. Полное юридическое сопровождение.'}
                    </p>
                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. WORKFLOW & PROTOCOL */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isUk ? 'Регламент безпеки та точності' : 'Регламент безопасности и точности'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              {isUk ? 'Як влаштований процес впровадження' : 'Как устроен процесс внедрения'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isUk
                ? 'Від першого виїзду інженера до регулярного автоматичного постачання медіаконтенту відділу продажів та технагляду.'
                : 'От первого выезда инженера до регулярной автоматической поставки медиаконтента отделу продаж и технадзору.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step) => (
              <div
                key={step.step}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative"
              >
                <div className="text-3xl font-black text-amber-500/30 mb-4">
                  {step.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>{isUk ? 'Питання та відповіді девелоперів' : 'Вопросы и ответы девелоперов'}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
              {isUk ? 'Часті технічні запитання' : 'Часто задаваемые технические вопросы'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {isUk
                ? 'Все, що потрібно знати головному інженеру, маркетологу та керівнику проєкту перед початком робіт.'
                : 'Все, что нужно знать главному инженеру, маркетологу и руководителю проекта перед началом работ.'}
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. BOTTOM CONTACT / CTA BANNER */}
      <section className="py-20 bg-slate-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-4 border border-amber-500/30">
            <Award className="w-3.5 h-3.5" />
            <span>{isUk ? 'Пілотний виїзд на об\'єкт' : 'Пилотный выезд на объект'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            {isUk ? 'Бажаєте протестувати ракурси на вашому об\'єкті?' : 'Хотите протестировать ракурсы на вашем объекте?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            {isUk
              ? 'Ми проведемо попередній тестовий обліт будівельного майданчика дроном, визначимо висотні видові точки та підготуємо презентаційну схему розстановки камер таймлапсу.'
              : 'Мы проведем предварительный тестовый облет строительной площадки дроном, определим высотные видовые точки и подготовим презентационную схему расстановки камер таймлапса.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#calculator"
              className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
            >
              <span>{isUk ? 'Замовити виїзд інженера' : 'Заказать выезд инженера'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href={`tel:${settings.phone || '+380675661152'}`}
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-colors"
            >
              <span>{isUk ? 'Зателефонувати засновнику:' : 'Позвонить основателю:'} {settings.phone || '+380 (67) 566-11-52'}</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
