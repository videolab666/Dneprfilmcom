import { useState } from 'react';
import { 
  FileSearch, 
  Layers, 
  Sliders, 
  Radio, 
  Scissors, 
  HardDrive, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../../context/SiteContentContext';

interface Step {
  number: string;
  title: string;
  subtitle: string;
  icon: typeof FileSearch;
  duration: string;
  deliverables: string[];
  description: string;
  details: string[];
}

const STEPS_RU: Step[] = [
  {
    number: '01',
    title: 'Бриф и технический аудит',
    subtitle: 'Погружение в задачи бизнеса и аудит локации',
    icon: FileSearch,
    duration: '1–2 дня',
    deliverables: ['Техническое задание', 'Оценка локации', 'Предварительная смета'],
    description: 'Мы не просто считаем количество камер. Мы анализируем цели проекта: привлечение спонсоров, продажа билетов, вовлечение зрителей или отчетность перед инвесторами.',
    details: [
      'Инспекция площадки: проверка мощности электросети, замеров света и акустики',
      'Тестирование скорости интернета и определение необходимости Starlink / бондинга',
      'Формирование прозрачной сметы без скрытых доплат в день мероприятия'
    ]
  },
  {
    number: '02',
    title: 'Подготовка и предпродакшн',
    subtitle: 'Сценарий, тайминг и технический райдер',
    icon: Layers,
    duration: '3–7 дней',
    deliverables: ['Посекундный таймлайн', 'План расстановки камер', 'Пакет эфирной графики'],
    description: 'Прямой эфир и сложные съемки готовятся заранее. На этом этапе прорабатываются все форс-мажорные сценарии и логистика съемочной группы.',
    details: [
      'Разработка эфирной графики: плашки спикеров, заставки, анимированные логотипы спонсоров',
      'Согласование кабельных трасс с администрацией площадки и службой безопасности',
      'Интеграция презентаций докладчиков и предварительная настройка телемостов (vMix / Zoom)'
    ]
  },
  {
    number: '03',
    title: 'Сетап и резервирование',
    subtitle: 'Развертывание ПТС и нулевой отказ',
    icon: Sliders,
    duration: 'За 4–6 часов до старта',
    deliverables: ['Развернутый ПТС-узел', 'Резервные каналы связи', 'Чек-лист готовности'],
    description: 'Команда прибывает на площадку задолго до прихода гостей. Мы разворачиваем контрольную комнату режиссера, подключаем камеры и дублирующие каналы.',
    details: [
      'Подключение онлайн-ИБП двойного преобразования (защита от скачков и отключения света)',
      'Агрегация интернет-каналов: Starlink + мобильный бондинг 4G/5G разных операторов',
      'Прокладка защищенных кабельных трасс с сигналом 12G-SDI и резервных оптических линий'
    ]
  },
  {
    number: '04',
    title: 'Эфир или съемочный процесс',
    subtitle: 'Слаженная работа команды без права на ошибку',
    icon: Radio,
    duration: 'В режиме реального времени',
    deliverables: ['Прямой эфир в 4K/FullHD', 'Многоканальная чистая запись', 'Мгновенные повторы'],
    description: 'Режиссер эфира, операторы на радиостанциях и звукорежиссер работают как единый механизм по четкому Zero Failure протоколу.',
    details: [
      'Динамическое переключение планов, мгновенные повторы (Replay) острых моментов',
      'Поканальная запись видео с каждой камеры без графики (Clean Feed) для монтажа',
      'Инженерный контроль качества стрима на YouTube, Twitch, Facebook или закрытый сервер'
    ]
  },
  {
    number: '05',
    title: 'Постпродакшн и монтаж',
    subtitle: 'Цветокоррекция, саунд-дизайн и графика',
    icon: Scissors,
    duration: '3–10 рабочих дней',
    deliverables: ['Итоговый фильм / хайлайт', 'Цветокоррекция DaVinci', 'Мастеринг звука'],
    description: 'Для видеороликов и отчетных материалов мы осуществляем профессиональный монтаж, отбор лучших дублей и работу со звуковым пространством.',
    details: [
      'Глубокая цветокоррекция с калибровкой под фирменные цвета бренда заказчика',
      'Чистка звука, сведение дорожек, лицензионный саундтрек и звуковые эффекты',
      '2 круга правок включены в регламент с удобным согласованием через интерактивные таймкоды'
    ]
  },
  {
    number: '06',
    title: 'Сдача материалов и архив',
    subtitle: 'Передача в облако и адаптация под соцсети',
    icon: HardDrive,
    duration: 'В течение 24–48 часов',
    deliverables: ['Облачный архив 4K', 'Комплект Reels/Shorts', 'Бессрочное резервное хранение'],
    description: 'Заказчик получает готовый медиапакет во всех необходимых разрешениях, а также нарезку ключевых моментов для максимального охвата в соцсетях.',
    details: [
      'Быстрая ссылка на облачное хранилище со структурированными папками',
      'Адаптация роликов под вертикальный формат 9:16 (TikTok, Instagram Reels, YouTube Shorts)',
      'Гарантированное хранение исходников проекта в защищенном локальном архиве студии 12 месяцев'
    ]
  }
];

const STEPS_UK: Step[] = [
  {
    number: '01',
    title: 'Бриф та технічний аудит',
    subtitle: 'Занурення в завдання бізнесу та аудит локації',
    icon: FileSearch,
    duration: '1–2 дні',
    deliverables: ['Технічне завдання', 'Оцінка локації', 'Попередній кошторис'],
    description: 'Ми не просто рахуємо кількість камер. Ми аналізуємо цілі проєкту: залучення спонсорів, продаж квитків, залучення глядачів або звітність перед інвесторами.',
    details: [
      'Інспекція майданчика: перевірка потужності електромережі, вимірювання світла та акустики',
      'Тестування швидкості інтернету та визначення потреби у Starlink / бондингу',
      'Формування прозорого кошторису без прихованих доплат у день заходу'
    ]
  },
  {
    number: '02',
    title: 'Підготовка та передпродакшн',
    subtitle: 'Сценарій, таймінг та технічний райдер',
    icon: Layers,
    duration: '3–7 днів',
    deliverables: ['Посекундний таймлайн', 'План розстановки камер', 'Пакет ефірної графіки'],
    description: 'Прямий ефір та складні зйомки готуються заздалегідь. На цьому етапі опрацьовуються всі форс-мажорні сценарії та логістика знімальної групи.',
    details: [
      'Розробка ефірної графіки: плашки спікерів, заставки, анімовані логотипи спонсорів',
      'Узгодження кабельних трас з адміністрацією майданчика та службою безпеки',
      'Інтеграція презентацій доповідачів та попереднє налаштування телемостів (vMix / Zoom)'
    ]
  },
  {
    number: '03',
    title: 'Сетап та резервування',
    subtitle: 'Розгортання ПТС та нульова відмова',
    icon: Sliders,
    duration: 'За 4–6 годин до старту',
    deliverables: ['Розгорнутий ПТС-вузол', 'Резервні канали зв\'язку', 'Чек-лист готовності'],
    description: 'Команда прибуває на майданчик задовго до приходу гостей. Ми розгортаємо контрольну кімнату режисера, підключаємо камери та дублюючі канали.',
    details: [
      'Підключення онлайн-ДБЖ подвійного перетворення (захист від стрибків та вимкнення світла)',
      'Агрегація інтернет-каналів: Starlink + мобільний бондинг 4G/5G різних операторів',
      'Прокладання захищених кабельних трас із сигналом 12G-SDI та резервних оптичних ліній'
    ]
  },
  {
    number: '04',
    title: 'Ефір або знімальний процес',
    subtitle: 'Злагоджена робота команди без права на помилку',
    icon: Radio,
    duration: 'У режимі реального часу',
    deliverables: ['Прямий ефір у 4K/FullHD', 'Багатоканальний чистий запис', 'Миттєві повтори'],
    description: 'Режисер ефіру, оператори на радіостанціях та звукорежисер працюють як єдиний механізм за чітким Zero Failure протоколом.',
    details: [
      'Динамічне перемикання планів, миттєві повтори (Replay) гострих моментів',
      'Поканальний запис відео з кожної камери без графіки (Clean Feed) для монтажу',
      'Інженерний контроль якості стріму на YouTube, Twitch, Facebook або закритий сервер'
    ]
  },
  {
    number: '05',
    title: 'Постпродакшн та монтаж',
    subtitle: 'Кольорокорекція, саунд-дизайн та графіка',
    icon: Scissors,
    duration: '3–10 робочих днів',
    deliverables: ['Підсумковий фільм / хайлайт', 'Кольорокорекція DaVinci', 'Мастеринг звуку'],
    description: 'Для відеороликів та звітних матеріалів ми здійснюємо професійний монтаж, відбір кращих дублів та роботу зі звуковим простором.',
    details: [
      'Глибока кольорокорекція з калібруванням під фірмові кольори бренду замовника',
      'Чистка звуку, зведення доріжок, ліцензійний саундтрек та звукові ефекти',
      '2 кола правок включено в регламент зі зручним узгодженням через інтерактивні таймкоди'
    ]
  },
  {
    number: '06',
    title: 'Здача матеріалів та архів',
    subtitle: 'Передача в хмару та адаптація під соцмережі',
    icon: HardDrive,
    duration: 'Протягом 24–48 годин',
    deliverables: ['Хмарний архів 4K', 'Комплект Reels/Shorts', 'Безстрокове резервне зберігання'],
    description: 'Замовник отримує готовий медіапакет у всіх необхідних роздільних здатностях, а також нарізку ключових моментів для максимального охоплення в соцмережах.',
    details: [
      'Швидке посилання на хмарне сховище зі структурованими папками',
      'Адаптація роликів під вертикальний формат 9:16 (TikTok, Instagram Reels, YouTube Shorts)',
      'Гарантоване зберігання вихідних матеріалів проєкту в захищеному локальному архіві студії 12 місяців'
    ]
  }
];

export function HowWeWork() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const { isUk } = useSiteContent();
  const steps = isUk ? STEPS_UK : STEPS_RU;

  return (
    <section className="py-24 bg-white text-slate-900 relative overflow-hidden" id="how-we-work">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>{isUk ? 'Прозорість та контроль' : 'Прозрачность и контроль'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            {isUk ? 'Регламент роботи студії' : 'Регламент работы студии'}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-light leading-relaxed">
            {isUk
              ? 'Покроковий виробничий цикл від першого дзвінка до передачі фінального архіву. Ви завжди знаєте, що відбувається на кожному етапі.'
              : 'Пошаговый производственный цикл от первого звонка до передачи финального архива. Вы всегда знаете, что происходит на каждом этапе.'}
          </p>
        </div>

        {/* Step Selector for Mobile & Desktop Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.number}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3 w-full">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {step.number}
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                </div>
                <div className="text-xs sm:text-sm font-bold leading-snug line-clamp-2">
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Showcase */}
        {steps[activeStep] && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Summary */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl sm:text-4xl font-black text-indigo-600">
                    {steps[activeStep].number}
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {steps[activeStep].title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">
                      {steps[activeStep].subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {steps[activeStep].description}
                </p>

                {/* Checklist */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isUk ? 'Що входить у цей етап:' : 'Что входит в этот этап:'}
                  </h4>
                  {steps[activeStep].details.map((item, dIdx) => (
                    <div key={dIdx} className="flex items-start space-x-3 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Deliverables Box */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {isUk ? 'Орієнтовний термін:' : 'Ориентировочный срок:'}
                  </div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {steps[activeStep].duration}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    {isUk ? 'Підсумкові артефакти етапу:' : 'Итоговые артефакты этапа:'}
                  </div>
                  <div className="space-y-2">
                    {steps[activeStep].deliverables.map((del, delIdx) => (
                      <div
                        key={delIdx}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-800 flex items-center justify-between"
                      >
                        <span>{del}</span>
                        <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/contacts"
                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm"
                  >
                    <span>{isUk ? 'Запросити регламент під ваш проєкт' : 'Запросить регламент под ваш проект'}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3 Core Guarantees underneath */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4">
              100%
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">
              {isUk ? 'Резервування трактів' : 'Резервирование трактов'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isUk
                ? 'Кожен критичний вузол (інтернет, живлення, пульти, запис) має гарячий дубль. Ефір не перерветься за жодних обставин.'
                : 'Каждый критический узел (интернет, питание, пульты, запись) имеет горячий дубль. Эфир не прервется ни при каких обстоятельствах.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
              0₴
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">
              {isUk ? 'Фіксований кошторис' : 'Фиксированная смета'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isUk
                ? 'Ціна узгоджується до старту робіт і закріплюється в договорі. Жодних раптових рахунків за бензин, паркування чи зайву годину монтажу.'
                : 'Цена согласовывается до старта работ и закрепляется в договоре. Никаких внезапных счетов за бензин, парковку или лишний час монтажа.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4">
              24/7
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">
              {isUk ? 'Особистий контроль засновника' : 'Личный контроль основателя'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isUk
                ? 'Олександр Пітель особисто курує технічний райдер та ключові процеси виробництва кожного проєкту студії.'
                : 'Александр Питель лично курирует технический райдер и ключевые процессы производства каждого проекта студии.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
