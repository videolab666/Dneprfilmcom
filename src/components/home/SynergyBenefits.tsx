import { Check, X, Layers, CheckCircle2 } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';

const SERVICES_RU = [
  { name: 'LIVE Трансляции', desc: 'До 12 камер, повторы, Starlink, телемосты' },
  { name: 'Корпоративное видео', desc: 'Имиджевые фильмы, интервью, отчеты' },
  { name: 'Профессиональное фото', desc: 'Репортажи, пресс-волы, каталоги' },
  { name: 'Аэросъемка и дроны', desc: '4K мониторинг, FPV-полеты, панорамы' },
  { name: 'Бизнес-подкасты', desc: 'Студийный звук, 3 камеры, выжимка' },
  { name: '3D-туры и сканирование', desc: 'Matterport 4K для застройщиков и бизнеса' },
  { name: 'Reels, TikTok & Shorts', desc: 'Вертикальный вирусный контент под ключ' }
];

const SERVICES_UK = [
  { name: 'LIVE Трансляції', desc: 'До 12 камер, повтори, Starlink, телемости' },
  { name: 'Корпоративне відео', desc: 'Іміджеві фільми, інтерв\'ю, звіти' },
  { name: 'Професійне фото', desc: 'Репортажі, прес-воли, каталоги' },
  { name: 'Аерозйомка та дрони', desc: '4K моніторинг, FPV-польоти, панорами' },
  { name: 'Бізнес-подкасти', desc: 'Студійний звук, 3 камери, вижимка' },
  { name: '3D-тури та сканування', desc: 'Matterport 4K для забудовників та бізнесу' },
  { name: 'Reels, TikTok & Shorts', desc: 'Вертикальний вірусний контент під ключ' }
];

export function SynergyBenefits() {
  const { isUk } = useSiteContent();
  const services = isUk ? SERVICES_UK : SERVICES_RU;

  return (
    <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Layers className="w-4 h-4" />
            <span>{isUk ? 'Синергія виробництва' : 'Синергия производства'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            {isUk ? (
              <>Один генеральний підрядник. <br /> Всі візуальні рішення.</>
            ) : (
              <>Один генеральный подрядчик. <br /> Все визуальные решения.</>
            )}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 font-light leading-relaxed">
            {isUk
              ? 'Вам більше не потрібно шукати окремо операторів, стрімерів, звукорежисерів, монтажерів та дронщиків. Ми закриваємо всі завдання одним злагодженим продакшном.'
              : 'Вам больше не нужно искать отдельно операторов, стримеров, звукарей, монтажеров и дронщиков. Мы закрываем все задачи одним слаженным продакшном.'}
          </p>
        </div>

        {/* 7 Services Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
          {services.map((s, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all hover:scale-[1.02]"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs mb-3">
                0{idx + 1}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1">{s.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/40 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                {isUk ? 'Головний плюс' : 'Главный плюс'}
              </div>
              <div className="text-lg font-extrabold text-white">
                {isUk ? 'Єдиний договір та стиль' : 'Единый договор и стиль'}
              </div>
            </div>
            <p className="text-xs text-indigo-200 mt-2">
              {isUk ? 'Один відповідальний — засновник Олександр Пітель.' : 'Один ответственный — основатель Александр Питель.'}
            </p>
          </div>
        </div>

        {/* Comparison: Several Vendors vs LIVE & VIDEO */}
        <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl">
          <h3 className="text-xl sm:text-2xl font-bold text-center mb-8 text-white">
            {isUk ? 'Порівняння: 4 різних підрядники vs LIVE & VIDEO' : 'Сравнение: 4 разных подрядчика vs LIVE & VIDEO'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-red-950/40 space-y-4">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm uppercase tracking-wider">
                <X className="w-5 h-5" />
                <span>{isUk ? 'Звичайний підхід (багато фрілансерів):' : 'Обычный подход (множество фрилансеров):'}</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
                <li className="flex items-start">
                  <X className="w-4 h-4 text-red-500 mr-2 shrink-0 mt-0.5" />
                  <span>
                    {isUk
                      ? 'Кожен підрядник тягне ковдру на себе, оператори заважають стрімерам і перекривають кадр.'
                      : 'Каждый подрядчик тянет одеяло на себя, операторы мешают стримерам и перекрывают кадр.'}
                  </span>
                </li>
                <li className="flex items-start">
                  <X className="w-4 h-4 text-red-500 mr-2 shrink-0 mt-0.5" />
                  <span>
                    {isUk
                      ? 'Різна передача кольору, різні об\'єктиви — відео та трансляція виглядають неузгоджено.'
                      : 'Разная цветопередача, разные объективы — видео и трансляция выглядят несогласованно.'}
                  </span>
                </li>
                <li className="flex items-start">
                  <X className="w-4 h-4 text-red-500 mr-2 shrink-0 mt-0.5" />
                  <span>
                    {isUk
                      ? 'Чотири рахунки, чотири договори, нескінченні дзвінки організатора та перекладання провини при збоях.'
                      : 'Четыре счета, четыре договора, бесконечные созвоны организатора и перекладывание вины при сбоях.'}
                  </span>
                </li>
                <li className="flex items-start">
                  <X className="w-4 h-4 text-red-500 mr-2 shrink-0 mt-0.5" />
                  <span>
                    {isUk
                      ? 'Переплата за роздільну логістику, бензин та апаратуру кожного фрілансера.'
                      : 'Переплата за раздельную логистику, бензин и аппаратуру каждого фрилансера.'}
                  </span>
                </li>
              </ul>
            </div>

            {/* LIVE & VIDEO Way */}
            <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                <Check className="w-5 h-5" />
                <span>{isUk ? 'Підхід LIVE & VIDEO (єдиний продакшн):' : 'Подход LIVE & VIDEO (единый продакшн):'}</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0 mt-0.5" />
                  <span>
                    {isUk ? (
                      <><strong>Злагоджена команда:</strong> радіозв'язок (інтерком), єдиний таймінг, чіткі сектори зйомок без хаосу.</>
                    ) : (
                      <><strong>Слаженная команда:</strong> радиосвязь (интерком), единый тайминг, четкие сектора съемок без хаоса.</>
                    )}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0 mt-0.5" />
                  <span>
                    {isUk ? (
                      <><strong>Еталонний стиль:</strong> єдині профілі кольору, калібрована кінооптика та спільний брендбук.</>
                    ) : (
                      <><strong>Эталонный стиль:</strong> единые цветовые профили, калиброванная кинооптика и общий брендбук.</>
                    )}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0 mt-0.5" />
                  <span>
                    {isUk ? (
                      <><strong>Економія до 25% бюджету</strong> за рахунок єдиної логістики та оптимізації знімальних змін.</>
                    ) : (
                      <><strong>Экономия до 25% бюджета</strong> за счет единой логистики и оптимизации съемочных смен.</>
                    )}
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0 mt-0.5" />
                  <span>
                    {isUk ? (
                      <><strong>Персональна відповідальність:</strong> один генеральний договір та гарантія засновника Олександра Пітеля.</>
                    ) : (
                      <><strong>Персональная ответственность:</strong> один генеральный договор и гарантия основателя Александра Пителя.</>
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
