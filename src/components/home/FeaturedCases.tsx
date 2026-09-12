import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, CheckCircle2, Trophy, Building, Presentation, Film, Mic, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CaseStudy } from '../../types';
import { useSiteContent } from '../../context/SiteContentContext';

interface CuratedCase {
  id: string;
  title: string;
  category: 'LIVE' | 'VIDEO' | 'CONSTRUCTION' | 'OTHER';
  client: string;
  categoryLabel: string;
  icon: typeof Play;
  problem: string;
  solution: string;
  result: string;
  metrics: { label: string; value: string }[];
  imageUrl: string;
  videoBadge?: string;
}

const DEFAULT_CASES: CuratedCase[] = [
  {
    id: 'case-boxing',
    title: 'Чемпионат Украины по боксу: 3 дня бескомпромиссного прямого эфира',
    category: 'LIVE',
    categoryLabel: 'Спортивный эфир',
    client: 'Федерация бокса Украины',
    icon: Trophy,
    problem: 'Требовалось обеспечить бесперебойное вещание 3 соревновательных дней на YouTube и ТВ без задержек и сбоев в условиях нестабильного локального интернета.',
    solution: 'Развернули ПТС на 6 камер (включая операторский кран и рельсовую систему), станцию мгновенных повторов (Slow Motion Replay), Starlink + 4-SIM бондинг и титровальную графику со статистикой боев.',
    result: '120 000+ уникальных зрителей, 0 секунд простоя эфира, мгновенная передача хайлайтов в соцсети во время поединков.',
    metrics: [
      { label: 'Камер в тракте', value: '6 камер' },
      { label: 'Зрителей онлайн', value: '120K+' },
      { label: 'Аптайм эфира', value: '100%' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80',
    videoBadge: '4K 60fps'
  },
  {
    id: 'case-forum',
    title: 'Tech & Investment Summit: 3 одновременных потока и телемосты',
    category: 'LIVE',
    categoryLabel: 'Бизнес-форум',
    client: 'Европейская Бизнес Ассоциация',
    icon: Presentation,
    problem: 'Организовать синхронное вещание из трех параллельных залов с международными спикерами из Великобритании и США и интерактивным голосованием.',
    solution: '3 независимые режиссерские группы, vMix Call телемосты с задержкой < 0.8 сек, захват презентаций спикеров 4K пиксель-в-пиксель, интеграция Slido и 2 синхронные языковые дорожки.',
    result: '3 500+ зарегистрированных онлайн-делегатов, идеальный тайминг сессий и безупречные телемосты с европейскими экспертами.',
    metrics: [
      { label: 'Параллельных залов', value: '3 потока' },
      { label: 'Языков перевода', value: '2 дорожки' },
      { label: 'Задержка телемоста', value: '< 0.8с' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80',
    videoBadge: 'Мультистрим'
  },
  {
    id: 'case-riverside',
    title: 'ЖК «Riverside Park»: Мониторинг стройки, 4K-таймлапс и 3D-тур',
    category: 'CONSTRUCTION',
    categoryLabel: 'Девелопмент',
    client: 'Инвестиционно-строительная группа «GreenWood»',
    icon: Building,
    problem: 'Инвесторы требовали ежемесячной прозрачности прогресса строительства жилого комплекса бизнес-класса, а отделу продаж нужен был инструмент удаленных сделок.',
    solution: 'Ежемесячная ортофотоплановая аэросъемка с дрона по фиксированным GPS-точкам, 18-месячный динамический таймлапс, съемка шоурумов и виртуальный 3D-тур Matterport.',
    result: 'Увеличение конверсии удаленных продаж квартир на 38%, более 200 000 просмотров таймлапса в рекламных кампаниях застройщика.',
    metrics: [
      { label: 'Длительность мониторинга', value: '18 мес' },
      { label: 'Рост онлайн-продаж', value: '+38%' },
      { label: 'Качество сканирования', value: '4K HDR' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&q=80',
    videoBadge: '3D & Drone'
  },
  {
    id: 'case-steel',
    title: 'Промышленный гигант «Dnipro Steel»: Имиджевый фильм для инвесторов',
    category: 'VIDEO',
    categoryLabel: 'Корпоративное кино',
    client: 'Металлургический холдинг «Dnipro Steel»',
    icon: Film,
    problem: 'Создать масштабное презентационное видео к международной выставке в Дюссельдорфе, передающее технологическую мощь и эко-модернизацию завода.',
    solution: 'Кинематографическая съемка на камеры RED с анаморфотной оптикой в горячих цехах, FPV-полеты внутри производственных линий, дикторская озвучка на 3 языках и саунд-дизайн.',
    result: 'Фильм отмечен на индустриальном форуме, помог привлечь экспортный контракт на поставку металлопроката в ЕС.',
    metrics: [
      { label: 'Локаций завода', value: '14 цехов' },
      { label: 'Языков озвучки', value: 'UA / EN / DE' },
      { label: 'Формат съемки', value: '6K Cinema' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&q=80',
    videoBadge: 'Cinema 6K'
  },
  {
    id: 'case-podcast',
    title: 'Серия видеоподкастов «Лидеры индустрии»: Сезон из 12 эпизодов',
    category: 'VIDEO',
    categoryLabel: 'Бизнес-подкасты',
    client: 'Венчурный фонд TechHorizon',
    icon: Mic,
    problem: 'Запустить регулярный видеоподкаст с топ-менеджерами в сжатые сроки с гарантией качественного звука и быстрой нарезкой под соцсети.',
    solution: 'Студийный сетап на 3 камеры Blackmagic 6K Pro, микрофоны Shure SM7B, динамический контровой свет, одновременная запись исходников и монтаж 30+ Reels/Shorts на каждый выпуск.',
    result: 'Общий охват сезона превысил 850 000 просмотров на YouTube и в Instagram, сформирован сильный личный бренд спикеров фонда.',
    metrics: [
      { label: 'Эпизодов выпущено', value: '12 серий' },
      { label: 'Коротких Reels/Shorts', value: '60+ роликов' },
      { label: 'Суммарный охват', value: '850K+' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80',
    videoBadge: '3 камеры'
  },
  {
    id: 'case-commercial',
    title: 'Презентация премиальной линейки авто: Динамика и драйв',
    category: 'VIDEO',
    categoryLabel: 'Коммерческое видео',
    client: 'Официальный дистрибьютор ElectroDrive',
    icon: Sparkles,
    problem: 'Снять эмоциональный промо-ролик и презентационный фильм нового флагманского автомобиля для закрытой премьеры и digital-кампании.',
    solution: 'Съемка в ночном городе с использованием операторского автомобиля с гиростабилизированной головой, студийный световой сетап на закрытой локации, цветокоррекция в стиле нео-нуар.',
    result: '100% бронирование первой партии автомобилей в течение 48 часов после публикации ролика.',
    metrics: [
      { label: 'Съемочных смен', value: '2 ночи' },
      { label: 'Конверсия в тест-драйв', value: '+42%' },
      { label: 'Досмотры ролика', value: '78%' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80',
    videoBadge: 'Commercial'
  }
];

const CURATED_CASES_UK: Record<string, Partial<CuratedCase>> = {
  'case-boxing': {
    title: 'Чемпіонат України з боксу: 3 дні безкомпромісного прямого ефіру',
    categoryLabel: 'Спортивний ефір',
    client: 'Федерація боксу України',
    problem: 'Потрібно було забезпечити безперебійне мовлення 3 змагальних днів на YouTube і ТБ без затримок та збоїв в умовах нестабільного локального інтернету.',
    solution: 'Розгорнули ПТС на 6 камер (включаючи операторський кран і рейкову систему), станцію миттєвих повторів (Slow Motion Replay), Starlink + 4-SIM бондинг і титрувальну графіку зі статистикою боїв.',
    result: '120 000+ унікальних глядачів, 0 секунд простою ефіру, миттєва передача хайлайтів у соцмережі під час поєдинків.',
    metrics: [
      { label: 'Камер у тракті', value: '6 камер' },
      { label: 'Глядачів онлайн', value: '120K+' },
      { label: 'Аптайм ефіру', value: '100%' }
    ]
  },
  'case-forum': {
    title: 'Tech & Investment Summit: 3 одночасні потоки та телемости',
    categoryLabel: 'Бізнес-форум',
    videoBadge: 'Мультистрім',
    client: 'Європейська Бізнес Асоціація',
    problem: 'Організувати синхронне мовлення з трьох паралельних залів з міжнародними спікерами з Великобританії та США та інтерактивним голосуванням.',
    solution: '3 незалежні режисерські групи, vMix Call телемости із затримкою < 0.8 сек, захоплення презентацій спікерів 4K піксель-у-піксель, інтеграція Slido та 2 синхронні мовні доріжки.',
    result: '3 500+ зареєстрованих онлайн-делегатів, ідеальний таймінг сесій та бездоганні телемости з європейськими експертами.',
    metrics: [
      { label: 'Паралельних залів', value: '3 потоки' },
      { label: 'Мов перекладу', value: '2 доріжки' },
      { label: 'Затримка телемосту', value: '< 0.8с' }
    ]
  },
  'case-riverside': {
    title: 'ЖК «Riverside Park»: Моніторинг будівництва, 4K-таймлапс та 3D-тур',
    categoryLabel: 'Девелопмент',
    videoBadge: '3D & Дрон',
    client: 'Інвестиційно-будівельна група «GreenWood»',
    problem: 'Інвестори вимагали щомісячної прозорості прогресу будівництва житлового комплексу бізнес-класу, а відділу продажу потрібен був інструмент дистанційних угод.',
    solution: 'Щомісячна ортофотопланова аерозйомка з дрона по фіксованих GPS-точках, 18-місячний динамічний таймлапс, зйомка шоурумів та віртуальний 3D-тур Matterport.',
    result: 'Збільшення конверсії дистанційних продажів квартир на 38%, понад 200 000 переглядів таймлапсу в рекламних кампаніях забудовника.',
    metrics: [
      { label: 'Тривалість моніторингу', value: '18 міс' },
      { label: 'Зростання онлайн-продажів', value: '+38%' },
      { label: 'Якість сканування', value: '4K HDR' }
    ]
  },
  'case-steel': {
    title: 'Промисловий гігант «Dnipro Steel»: Іміджевий фільм для інвесторів',
    categoryLabel: 'Корпоративне кіно',
    client: 'Металургійний холдинг «Dnipro Steel»',
    problem: 'Створити масштабне презентаційне відео до міжнародної виставки в Дюссельдорфі, що передає технологічну міць та еко-модернізацію заводу.',
    solution: 'Кінематографічна зйомка на камери RED з анаморфотною оптикою в гарячих цехах, FPV-польоти всередині виробничих ліній, дикторська озвучка 3 мовами та саунд-дизайн.',
    result: 'Фільм відзначений на індустріальному форумі, допоміг залучити експортний контракт на постачання металопрокату до ЄС.',
    metrics: [
      { label: 'Локацій заводу', value: '14 цехів' },
      { label: 'Мов озвучки', value: 'UA / EN / DE' },
      { label: 'Формат зйомки', value: '6K Cinema' }
    ]
  },
  'case-podcast': {
    title: 'Серія відеоподкастів «Лідери індустрії»: Сезон із 12 епізодів',
    categoryLabel: 'Бізнес-подкасти',
    videoBadge: '3 камери',
    client: 'Венчурний фонд TechHorizon',
    problem: 'Запустити регулярний відеоподкаст з топ-менеджерами у стислі терміни з гарантією якісного звуку та швидкою нарізкою під соцмережі.',
    solution: 'Студійний сетап на 3 камери Blackmagic 6K Pro, мікрофони Shure SM7B, динамічне контрове світло, одночасний запис вихідних матеріалів та монтаж 30+ Reels/Shorts на кожен випуск.',
    result: 'Загальне охоплення сезону перевищило 850 000 переглядів на YouTube та в Instagram, сформовано сильний особистий бренд спікерів фонду.',
    metrics: [
      { label: 'Епізодів випущено', value: '12 серій' },
      { label: 'Коротких Reels/Shorts', value: '60+ роликів' },
      { label: 'Сумарне охоплення', value: '850K+' }
    ]
  },
  'case-commercial': {
    title: 'Презентація преміальної лінійки авто: Динаміка та драйв',
    categoryLabel: 'Комерційне відео',
    client: 'Офіційний дистриб\'ютор ElectroDrive',
    problem: 'Зняти емоційний промо-ролик та презентаційний фільм нового флагманського автомобіля для закритої прем\'єри та digital-кампанії.',
    solution: 'Зйомка в нічному місті з використанням операторського авто з гіростабілізованою головою, студійний світловий сетап на закритій локації, кольорокорекція в стилі нео-нуар.',
    result: '100% бронювання першої партії автомобілів протягом 48 годин після публікації ролика.',
    metrics: [
      { label: 'Знімальних змін', value: '2 ночі' },
      { label: 'Конверсія в тест-драйв', value: '+42%' },
      { label: 'Перегляди ролика', value: '78%' }
    ]
  }
};

export function FeaturedCases() {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'LIVE' | 'VIDEO' | 'CONSTRUCTION'>('ALL');
  const [activeModalCase, setActiveModalCase] = useState<CuratedCase | null>(null);
  const [dbCases, setDbCases] = useState<CaseStudy[]>([]);
  const { isUk } = useSiteContent();

  useEffect(() => {
    const loadDbCases = async () => {
      try {
        const snap = await getDocs(collection(db, 'cases'));
        const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() })) as CaseStudy[];
        setDbCases(loaded);
      } catch (err) {
        console.error('Error loading db cases in FeaturedCases:', err);
      }
    };
    loadDbCases();
  }, []);

  const localizedCases = useMemo<CuratedCase[]>(() => {
    if (!isUk) return DEFAULT_CASES;
    return DEFAULT_CASES.map(c => {
      const tr = CURATED_CASES_UK[c.id];
      if (!tr) return c;
      return {
        ...c,
        title: tr.title || c.title,
        categoryLabel: tr.categoryLabel || c.categoryLabel,
        videoBadge: tr.videoBadge || c.videoBadge,
        client: tr.client || c.client,
        problem: tr.problem || c.problem,
        solution: tr.solution || c.solution,
        result: tr.result || c.result,
        metrics: tr.metrics || c.metrics,
      };
    });
  }, [isUk]);

  const filteredCases = localizedCases.filter(item => {
    if (selectedFilter === 'ALL') return true;
    return item.category === selectedFilter;
  });

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden" id="cases-section">
      {/* Background glow elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <span>{isUk ? 'Портфоліо проєктів' : 'Портфолио проектов'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              {isUk ? 'Обрані кейси студії' : 'Избранные кейсы студии'}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-2xl font-light">
              {isUk ? (
                <>Формат роботи: <strong className="text-white font-medium">«Завдання → Технічне рішення → Вимірний результат»</strong>. Жодних шаблонних зйомок.</>
              ) : (
                <>Формат работы: <strong className="text-white font-medium">«Задача → Техническое решение → Измеримый результат»</strong>. Никаких шаблонных съемок.</>
              )}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 self-start md:self-end">
            {[
              { id: 'ALL', label: isUk ? 'Всі проєкти' : 'Все проекты' },
              { id: 'LIVE', label: 'LIVE Production' },
              { id: 'VIDEO', label: 'Video' },
              { id: 'CONSTRUCTION', label: isUk ? 'Будівництво та 3D' : 'Стройка и 3D' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  selectedFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredCases.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="group bg-slate-800/60 rounded-3xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/10"
                >
                  {/* Image container */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    
                    {/* Top badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30">
                        <Icon className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                        {item.categoryLabel}
                      </span>
                      {item.videoBadge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600/90 text-white">
                          {item.videoBadge}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-xs text-slate-300 font-medium">
                        {isUk ? 'Клієнт' : 'Клиент'}: <strong className="text-white">{item.client}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h3>

                      {/* Problem & Solution Mini */}
                      <div className="space-y-2.5 text-xs text-slate-300 mb-6 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-0.5">
                            {isUk ? 'Завдання' : 'Задача'}:
                          </span>
                          <p className="line-clamp-2 text-slate-300">{item.problem}</p>
                        </div>
                        <div className="border-t border-slate-800 pt-2">
                          <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[10px] block mb-0.5">
                            {isUk ? 'Результат' : 'Результат'}:
                          </span>
                          <p className="line-clamp-2 text-slate-200 font-medium">{item.result}</p>
                        </div>
                      </div>

                      {/* Metrics bar */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 mb-6">
                        {item.metrics.map((m, mIdx) => (
                          <div key={mIdx} className="text-center p-2 rounded-xl bg-slate-800/40">
                            <div className="text-sm font-extrabold text-indigo-400">{m.value}</div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setActiveModalCase(item)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-700/50 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>{isUk ? 'Детальніше про рішення' : 'Подробнее о решении'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Additional Admin-Added Cases Banner if any exists */}
        {dbCases.length > 0 && (
          <div className="mt-12 p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-sm font-medium text-indigo-200">
                {isUk ? (
                  <>В архіві студії збережено ще <strong>{dbCases.length}</strong> актуальних проєктів та прямих включень.</>
                ) : (
                  <>В архиве студии сохранено еще <strong>{dbCases.length}</strong> актуальных проектов и прямых включений.</>
                )}
              </span>
            </div>
            <Link
              to="/cases"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shrink-0"
            >
              {isUk ? 'Відкрити повний каталог' : 'Открыть полный каталог'} ({DEFAULT_CASES.length + dbCases.length})
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Link>
          </div>
        )}

        {/* Bottom CTA to all cases */}
        <div className="mt-16 text-center">
          <Link
            to="/cases"
            className="inline-flex items-center px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <span>{isUk ? 'Дивитися всі кейси студії' : 'Смотреть все кейсы студии'}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>

      {/* Case Details Modal */}
      <AnimatePresence>
        {activeModalCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative text-white shadow-2xl"
            >
              <button
                onClick={() => setActiveModalCase(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                ✕
              </button>

              <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                <span>{activeModalCase.categoryLabel}</span>
                <span>•</span>
                <span>{activeModalCase.client}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white">
                {activeModalCase.title}
              </h3>

              <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 bg-slate-950">
                <img
                  src={activeModalCase.imageUrl}
                  alt={activeModalCase.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4 text-sm text-slate-300">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                    {isUk ? 'Вихідне завдання клієнта:' : 'Исходная задача клиента:'}
                  </h4>
                  <p className="text-slate-200">{activeModalCase.problem}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                    {isUk ? 'Інженерне рішення та сетап:' : 'Инженерное решение и сетап:'}
                  </h4>
                  <p className="text-slate-200">{activeModalCase.solution}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                    {isUk ? 'Підсумковий результат:' : 'Итоговый результат:'}
                  </h4>
                  <p className="text-slate-200">{activeModalCase.result}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 my-6">
                {activeModalCase.metrics.map((m, i) => (
                  <div key={i} className="p-3 bg-slate-800 rounded-xl text-center border border-slate-700/60">
                    <div className="text-lg font-bold text-indigo-400">{m.value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setActiveModalCase(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition-colors"
                >
                  {isUk ? 'Закрити' : 'Закрыть'}
                </button>
                <Link
                  to="/contacts"
                  onClick={() => setActiveModalCase(null)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  {isUk ? 'Обговорити схожий проєкт' : 'Обсудить похожий проект'}
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
