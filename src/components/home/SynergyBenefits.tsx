import { Check, X, Layers, CheckCircle2 } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';

const SERVICES = {
  ru: [
    { name: 'LIVE Трансляции', desc: 'До 12 камер, повторы, Starlink, телемосты' },
    { name: 'Корпоративное видео', desc: 'Имиджевые фильмы, интервью, отчеты' },
    { name: 'Профессиональное фото', desc: 'Репортажи, пресс-волы, каталоги' },
    { name: 'Аэросъемка и дроны', desc: '4K мониторинг, FPV-полеты, панорамы' },
    { name: 'Бизнес-подкасты', desc: 'Студийный звук, 3 камеры, выжимка' },
    { name: '3D-туры и сканирование', desc: 'Matterport 4K для застройщиков и бизнеса' },
    { name: 'Reels, TikTok & Shorts', desc: 'Вертикальный вирусный контент под ключ' },
  ],
  uk: [
    { name: 'LIVE Трансляції', desc: 'До 12 камер, повтори, Starlink, телемости' },
    { name: 'Корпоративне відео', desc: 'Іміджеві фільми, інтерв\'ю, звіти' },
    { name: 'Професійне фото', desc: 'Репортажі, прес-воли, каталоги' },
    { name: 'Аерозйомка та дрони', desc: '4K моніторинг, FPV-польоти, панорами' },
    { name: 'Бізнес-подкасти', desc: 'Студійний звук, 3 камери, вижимка' },
    { name: '3D-тури та сканування', desc: 'Matterport 4K для забудовників та бізнесу' },
    { name: 'Reels, TikTok & Shorts', desc: 'Вертикальний вірусний контент під ключ' },
  ],
  en: [
    { name: 'LIVE Broadcasts', desc: 'Up to 12 cameras, replays, Starlink, remote guests' },
    { name: 'Corporate Video', desc: 'Brand films, interviews, reports' },
    { name: 'Professional Photography', desc: 'Event coverage, press walls, catalogs' },
    { name: 'Aerial Filming & Drones', desc: '4K monitoring, FPV flights, panoramas' },
    { name: 'Business Podcasts', desc: 'Studio audio, 3 cameras, short-form edits' },
    { name: '3D Tours & Scanning', desc: 'Matterport 4K for developers and businesses' },
    { name: 'Reels, TikTok & Shorts', desc: 'Turnkey vertical social content' },
  ],
};

const OLD_WAY = [
  {
    uk: 'Кожен підрядник тягне ковдру на себе, оператори заважають стрімерам і перекривають кадр.',
    ru: 'Каждый подрядчик тянет одеяло на себя, операторы мешают стримерам и перекрывают кадр.',
    en: 'Separate contractors compete for space: camera crews interfere with streaming teams and block each other’s shots.',
  },
  {
    uk: 'Різна передача кольору, різні об\'єктиви — відео та трансляція виглядають неузгоджено.',
    ru: 'Разная цветопередача, разные объективы — видео и трансляция выглядят несогласованно.',
    en: 'Different color pipelines and lenses make the video production and live broadcast look inconsistent.',
  },
  {
    uk: 'Чотири рахунки, чотири договори, нескінченні дзвінки організатора та перекладання провини при збоях.',
    ru: 'Четыре счета, четыре договора, бесконечные созвоны организатора и перекладывание вины при сбоях.',
    en: 'Four invoices, four contracts, endless coordination calls, and unclear responsibility when something goes wrong.',
  },
  {
    uk: 'Переплата за роздільну логістику, бензин та апаратуру кожного фрілансера.',
    ru: 'Переплата за раздельную логистику, бензин и аппаратуру каждого фрилансера.',
    en: 'You overpay for separate logistics, transport, and equipment from every individual contractor.',
  },
];

const NEW_WAY = [
  {
    ukStrong: 'Злагоджена команда:',
    ruStrong: 'Слаженная команда:',
    enStrong: 'Coordinated Team:',
    uk: ' радіозв\'язок (інтерком), єдиний таймінг, чіткі сектори зйомок без хаосу.',
    ru: ' радиосвязь (интерком), единый тайминг, четкие сектора съемок без хаоса.',
    en: ' intercom communication, one production timeline, and clearly assigned shooting zones without chaos.',
  },
  {
    ukStrong: 'Еталонний стиль:',
    ruStrong: 'Эталонный стиль:',
    enStrong: 'Consistent Visual Standard:',
    uk: ' єдині профілі кольору, калібрована кінооптика та спільний брендбук.',
    ru: ' единые цветовые профили, калиброванная кинооптика и общий брендбук.',
    en: ' shared color profiles, calibrated cinema optics, and one brand guideline across every deliverable.',
  },
  {
    ukStrong: 'Економія до 25% бюджету',
    ruStrong: 'Экономия до 25% бюджета',
    enStrong: 'Up to 25% Budget Savings',
    uk: ' за рахунок єдиної логістики та оптимізації знімальних змін.',
    ru: ' за счет единой логистики и оптимизации съемочных смен.',
    en: ' through consolidated logistics and optimized production shifts.',
  },
  {
    ukStrong: 'Персональна відповідальність:',
    ruStrong: 'Персональная ответственность:',
    enStrong: 'Single Point of Accountability:',
    uk: ' один генеральний договір та гарантія засновника Олександра Пітеля.',
    ru: ' один генеральный договор и гарантия основателя Александра Пителя.',
    en: ' one master contract backed by founder Alexander Pitel’s personal oversight.',
  },
];

export function SynergyBenefits() {
  const { locale, l } = useSiteContent();
  const services = SERVICES[locale];

  return (
    <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Layers className="w-4 h-4" />
            <span>{l('Синергія виробництва', 'Синергия производства', 'Production Synergy')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            {l('Один генеральний підрядник.', 'Один генеральный подрядчик.', 'One General Contractor.')} <br />{' '}
            {l('Всі візуальні рішення.', 'Все визуальные решения.', 'Every Visual Solution.')}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 font-light leading-relaxed">
            {l(
              'Вам більше не потрібно шукати окремо операторів, стрімерів, звукорежисерів, монтажерів та дронщиків. Ми закриваємо всі завдання одним злагодженим продакшном.',
              'Вам больше не нужно искать отдельно операторов, стримеров, звукарей, монтажеров и дронщиков. Мы закрываем все задачи одним слаженным продакшном.',
              'You no longer need to hire camera operators, streaming crews, sound engineers, editors, and drone pilots separately. One coordinated production team handles the complete scope.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
          {services.map((service, idx) => (
            <div key={service.name} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all hover:scale-[1.02]">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs mb-3">0{idx + 1}</div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1">{service.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{service.desc}</p>
            </div>
          ))}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                {l('Головний плюс', 'Главный плюс', 'Key Advantage')}
              </div>
              <div className="text-lg font-extrabold text-white">
                {l('Єдиний договір та стиль', 'Единый договор и стиль', 'One Contract, One Visual Standard')}
              </div>
            </div>
            <p className="text-xs text-indigo-200 mt-2">
              {l('Один відповідальний — засновник Олександр Пітель.', 'Один ответственный — основатель Александр Питель.', 'One person accountable — founder Alexander Pitel.')}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl">
          <h3 className="text-xl sm:text-2xl font-bold text-center mb-8 text-white">
            {l('Порівняння: 4 різних підрядники vs LIVE & VIDEO', 'Сравнение: 4 разных подрядчика vs LIVE & VIDEO', 'Comparison: 4 Separate Contractors vs. LIVE & VIDEO')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-red-950/40 space-y-4">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm uppercase tracking-wider">
                <X className="w-5 h-5" />
                <span>{l('Звичайний підхід (багато фрілансерів):', 'Обычный подход (множество фрилансеров):', 'Traditional Approach (Multiple Freelancers):')}</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
                {OLD_WAY.map((item) => (
                  <li key={item.en} className="flex items-start">
                    <X className="w-4 h-4 text-red-500 mr-2 shrink-0 mt-0.5" />
                    <span>{l(item.uk, item.ru, item.en)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                <Check className="w-5 h-5" />
                <span>{l('Підхід LIVE & VIDEO (єдиний продакшн):', 'Подход LIVE & VIDEO (единый продакшн):', 'LIVE & VIDEO Approach (One Production Team):')}</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                {NEW_WAY.map((item) => (
                  <li key={item.enStrong} className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0 mt-0.5" />
                    <span>
                      <strong>{l(item.ukStrong, item.ruStrong, item.enStrong)}</strong>
                      {l(item.uk, item.ru, item.en)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
