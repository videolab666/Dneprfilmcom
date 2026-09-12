import { 
  Sparkles, 
  ArrowRight, 
  MessageSquare, 
  Quote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext';
import { ClientsMarquee } from '../components/ClientsMarquee';
import { usePageCmsContent } from '../hooks/usePageCmsContent';
import { usePageCopyContent } from '../hooks/usePageCopyContent';

export function About() {
  const { settings, isUk, l } = useSiteContent();
  const { content: pageContent, localize } = usePageCmsContent();
  const { content: copyContent, byId: copyById } = usePageCopyContent();
  const aboutPrinciplesHeading = copyById(copyContent.about.headings, 'about-heading-principles')?.text;
  const aboutMilestonesHeading = copyById(copyContent.about.headings, 'about-heading-milestones')?.text;

  const phoneDisplay = settings.phone || '+380 (67) 560-68-80';
  const telegramHandle = (settings.telegram || '@dneprfilm').replace('@', '');

  const milestones = localize(pageContent.about.milestones).map(item => ({
    year: item.text.badge || '',
    title: item.text.title || '',
    desc: item.text.description || '',
  }));
  const principles = localize(pageContent.about.principles).map(item => ({
    title: item.text.title || '',
    desc: item.text.description || '',
  }));

  const founderName = isUk ? (settings.founderName_uk || 'Олександр Пітель') : (settings.founderName || 'Александр Питель');
  const founderRole = isUk ? (settings.founderRole_uk || 'Засновник продакшен-студії Dneprfilm') : (settings.founderRole || 'Основатель продакшен-студии Dneprfilm');
  const founderQuote = isUk ? (settings.founderQuote_uk || 'Я створив студію Dneprfilm, щоб бізнес, спортивні ліги та девелопери отримували безкомпромісний медіа-продукт світового рівня. За якість кожного кадру і кожного ефіру я відповідаю особисто.') : (settings.founderQuote || 'Я создал студию Dneprfilm, чтобы бизнес, спортивные лиги и девелоперы получали бескомпромиссный медиа-продукт мирового уровня. За качество каждого кадра и каждого эфира я отвечаю лично.');
  const founderBio = isUk ? (settings.founderBio_uk || 'Понад 12 років досвіду у виробництві рекламних фільмів, телевізійних трансляцій та документальних проєктів. Під керівництвом Олександра реалізовано понад 450 прямих ефірів та понад 200 відеопроєктів для лідерів українського та міжнародного бізнесу.') : (settings.founderBio || 'Более 12 лет опыта в производстве рекламных фильмов, телевизионных трансляций и документальных проектов. Под руководством Александра реализовано более 450 прямых эфиров и свыше 200 видеопроектов для лидеров украинского и международного бизнеса.');

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* 1. HERO FOUNDER SECTION */}
      <section className="pt-32 pb-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4338ca_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{l("Засновник & Генеральний продюсер", "Основатель & Генеральный продюсер")}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                {founderName}
              </h1>

              <p className="text-lg text-indigo-300 font-medium">
                {founderRole}
              </p>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-200">
                <Quote className="w-6 h-6 text-indigo-400 mb-2" />
                <p className="italic text-base sm:text-lg leading-relaxed font-light">
                  «{founderQuote}»
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
                {founderBio}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/contacts"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all"
                >
                  <span>{l("Обговорити проєкт з Олександром", "Обсудить проект с Александром")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={`https://t.me/${telegramHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-md transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{l("Написати в Telegram", "Написать в Telegram")}</span>
                </a>
              </div>
            </div>

            {/* Right: Photo */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-30" />
                <div className="relative rounded-3xl overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-2xl">
                  <img
                    src={settings.founderPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'}
                    alt={founderName}
                    className="w-full h-[460px] object-cover object-center"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-6 text-white">
                    <div className="font-bold text-lg">{founderName}</div>
                    <div className="text-xs text-indigo-400">
                      {l("Генеральний продюсер Dneprfilm", "Генеральный продюсер Dneprfilm")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-600">12+</div>
              <div className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                {l("Років у медіа-продакшні", "Лет в медиа-продакшне")}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-600">450+</div>
              <div className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                {l("Прямих телевізійних ефірів", "Прямых телевизионных эфиров")}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-600">80+</div>
              <div className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                {l("Корпоративних замовників", "Корпоративных заказчиков")}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-600">100%</div>
              <div className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                {l("Договір та закриваючі акти", "Договор и закрывающие акты")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRINCIPLES */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {aboutPrinciplesHeading?.title}
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            {l("Ми не просто натискаємо кнопку «запис» — ми забезпечуємо телевізійний рівень надійності та естетики на кожному проєкті.", "Мы не просто нажимаем кнопку «запись» — мы обеспечиваем телевизионный уровень надежности и эстетики на каждом проекте.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((item, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-base">
                0{idx + 1}
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MILESTONES */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {aboutMilestonesHeading?.title}
            </h2>
            <p className="mt-3 text-slate-400 text-sm">
              {l("Еволюція від локального продакшну до пересувної телестудії європейського рівня", "Эволюция от локального продакшна до передвижной телестудии европейского уровня")}
            </p>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 sm:before:left-1/2 before:w-0.5 before:bg-slate-800">
            {milestones.map((m, idx) => (
              <div key={idx} className={`relative flex flex-col sm:flex-row items-start ${idx % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
                <div className="w-full sm:w-1/2 pl-12 sm:pl-8 sm:pr-8">
                  <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest block mb-1">
                      {m.year}
                    </span>
                    <h3 className="text-base font-bold text-white mb-2">
                      {m.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>
                <div className="absolute left-2.5 sm:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900 top-6" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CLIENTS MARQUEE */}
      <ClientsMarquee showStats={false} />

      {/* 6. BOTTOM CTA */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {l("Готові обговорити ваше завдання?", "Готовы обсудить вашу задачу?")}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            {l("Зв'яжіться безпосередньо з Олександром Пітелем для консультації, узгодження дат та розрахунку кошторису.", "Свяжитесь напрямую с Александром Пителем для консультации, согласования дат и расчета сметы.")}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/contacts"
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
            >
              {l("Перейти в контакти", "Перейти в контакты")}
            </Link>
            <a
              href={`tel:+${settings.phone ? settings.phone.replace(/\D/g, '') : '380675606880'}`}
              className="px-8 py-3.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-sm transition-all"
            >
              {phoneDisplay}
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
