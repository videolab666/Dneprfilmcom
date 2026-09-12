import { useState, useEffect } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Testimonial } from '../../types';
import { useSiteContent } from '../../context/SiteContentContext';

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    author: 'Сергей Ковальчук',
    role: 'Вице-президент',
    company: 'Федерация спорта и единоборств',
    project: 'Трансляция 3-дневного всеукраинского турнира (6 камер, повторы)',
    quote: 'В спорте повторного дубля не бывает. Команда Александра Пителя отработала на высшем телевизионном уровне: моментальные повторы острых нокдаунов, чистый звук комментаторов и железная стабильность трансляции при перебоях на арене благодаря их Старлинку.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80'
  },
  {
    id: 'test-2',
    author: 'Елена Воропаева',
    role: 'Chief Operating Officer',
    company: 'EventHub Global Conferences',
    project: 'Гибридный бизнес-форум на 3 зала и 3 500 онлайн-участников',
    quote: 'Главное преимущество работы с LIVE & VIDEO — полное спокойствие организатора. Мы передали им технический райдер по трансляции, звуку и экранам, и ни о чем не беспокоились. Спикеры из Лондона подключились без секундной задержки, картинка презентаций 4K.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80'
  },
  {
    id: 'test-3',
    author: 'Дмитрий Мельник',
    role: 'Директор по маркетингу',
    company: 'Инвестиционно-девелоперская группа',
    project: '18 месяцев аэросъемки стройки, таймлапс и 3D-туры шоурумов',
    quote: 'Застройщику критически важно иметь одного надежного подрядчика на весь цикл строительства. Александр и его группа регулярно выдавали потрясающие 4K-кадры, а их интерактивный 3D-тур увеличил продажи квартир клиентам из других городов на 38%.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80'
  }
];

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const { t, getLocalizedTestimonial } = useSiteContent();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'testimonials'), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial));
        setTestimonials(list);
      } else {
        setTestimonials(DEFAULT_TESTIMONIALS);
      }
    }, (err) => {
      console.warn('Could not fetch testimonials:', err.message);
    });
    return () => unsub();
  }, []);

  return (
    <section className="py-24 bg-slate-50 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-100">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('testimonials.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            {t('testimonials.title')}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-light leading-relaxed">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((rawTestimonial, idx) => {
            const item = getLocalizedTestimonial(rawTestimonial);
            return (
              <div
                key={item.id || idx}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Rating stars */}
                  <div className="flex items-center space-x-1 text-amber-400 mb-6">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  {/* Project Tag */}
                  {item.project && (
                    <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-3">
                      {item.project}
                    </div>
                  )}

                  {/* Quote */}
                  <p className="text-sm text-slate-700 leading-relaxed italic mb-8">
                    "{item.quote}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="flex items-center space-x-4 pt-4 border-t border-slate-100">
                  <img
                    src={item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'}
                    alt={item.author}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.author}</h4>
                    <div className="text-xs text-slate-500 font-medium">{item.role}</div>
                    <div className="text-xs font-semibold text-slate-700">{item.company}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

