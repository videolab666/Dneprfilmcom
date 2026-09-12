import { BackstageItem, Testimonial } from '../types';

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    author: 'Сергей Ковальчук',
    role: 'Вице-президент',
    company: 'Федерация спорта и единоборств',
    project: 'Трансляция 3-дневного всеукраинского турнира (6 камер, повторы)',
    quote: 'В спорте повторного дубля не бывает. Команда Александра Пителя отработала на высшем телевизионном уровне: моментальные повторы острых нокдаунов, чистый звук комментаторов и железная стабильность трансляции при перебоях на арене благодаря их Старлинку.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    id: 'test-2',
    author: 'Елена Воропаева',
    role: 'Chief Operating Officer',
    company: 'EventHub Global Conferences',
    project: 'Гибридный бизнес-форум на 3 зала и 3 500 онлайн-участников',
    quote: 'Главное преимущество работы с LIVE & VIDEO — полное спокойствие организатора. Мы передали им технический райдер по трансляции, звуку и экранам, и ни о чем не беспокоились. Спикеры из Лондона подключились без секундной задержки, картинка презентаций 4K.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    id: 'test-3',
    author: 'Дмитрий Мельник',
    role: 'Директор по маркетингу',
    company: 'Инвестиционно-девелоперская группа',
    project: '18 месяцев аэросъемки стройки, таймлапс и 3D-туры шоурумов',
    quote: 'Застройщику критически важно иметь одного надежного подрядчика на весь цикл строительства. Александр и его группа регулярно выдавали потрясающие 4K-кадры, а их интерактивный 3D-тур увеличил продажи квартир клиентам из других городов на 38%.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80',
    rating: 5,
  },
];

export const DEFAULT_BACKSTAGE_ITEMS: BackstageItem[] = [
  {
    id: 'backstage-1',
    title: 'Мобильный режиссерский узел ПТС',
    category: 'Режиссерская',
    tech: 'vMix Pro 4K + Blackmagic ATEM Constellation',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
    description: 'Центр управления эфиром: мультивьюер на 16 источников, станция повторов Slow Motion и титровальный сервер.',
  },
  {
    id: 'backstage-2',
    title: 'Операторская группа на ринге и стадионе',
    category: 'Операторы',
    tech: 'Sony FX6 / FX9 + длиннофокусная кинооптика G Master',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80',
    description: 'Операторы работают на беспроводных радиофокусах и радиоканалах связи с режиссером в режиме 0 задержки.',
  },
  {
    id: 'backstage-3',
    title: 'Коммутация и резервирование тракта 12G-SDI',
    category: 'Коммутация',
    tech: 'Бронированные оптические кабели + конвертеры Neutrik',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80',
    description: 'Защищенные кабель-каналы (капы) для безопасности участников и чистый цифровой сигнал без наводок.',
  },
  {
    id: 'backstage-4',
    title: 'Автономная станция связи и Starlink',
    category: 'Связь и питание',
    tech: 'Starlink Gen 2 + LiveU / Peplink мульти-SIM бондинг',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80',
    description: 'Гарантия стабильной отдачи потока 50+ Мбит/с даже на стадионах и загородных полигонах без проводного интернета.',
  },
];
