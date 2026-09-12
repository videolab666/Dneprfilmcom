import { useEffect, useState } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Testimonial } from '../../types';
import { useSiteContent } from '../../context/SiteContentContext';
import { DEFAULT_TESTIMONIALS } from '../../data/cmsSeeds';

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const { t, getLocalizedTestimonial } = useSiteContent();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'testimonials'),
      snapshot => {
        if (snapshot.empty) {
          setTestimonials(DEFAULT_TESTIMONIALS);
          return;
        }
        setTestimonials(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Testimonial)));
      },
      error => {
        console.warn('Could not load testimonials, using bundled fallback:', error.message);
        setTestimonials(DEFAULT_TESTIMONIALS);
      },
    );
    return () => unsubscribe();
  }, []);

  return (
    <section className="py-24 bg-slate-50 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-100">
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('testimonials.badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">{t('testimonials.title')}</h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-light leading-relaxed">{t('testimonials.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((rawItem, index) => {
            const item = getLocalizedTestimonial(rawItem);
            return (
              <article key={item.id || index} className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-6">
                    {Array.from({ length: item.rating || 5 }).map((_, starIndex) => <Star key={starIndex} className="w-4 h-4 fill-amber-400" />)}
                  </div>
                  {item.project && <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-3">{item.project}</div>}
                  <p className="text-sm text-slate-700 leading-relaxed italic mb-8">“{item.quote}”</p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <img src={item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'} alt={item.author} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                  <div>
                    <h3 className="text-sm font-bold">{item.author}</h3>
                    <div className="text-xs text-slate-500 font-medium">{item.role}</div>
                    <div className="text-xs font-semibold text-slate-700">{item.company}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
