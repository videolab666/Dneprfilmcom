import { useEffect, useState } from 'react';
import { Cpu, Radio } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BackstageItem } from '../../types';
import { useSiteContent } from '../../context/SiteContentContext';
import { DEFAULT_BACKSTAGE_ITEMS } from '../../data/cmsSeeds';

export function BackstageGallery() {
  const [items, setItems] = useState<BackstageItem[]>(DEFAULT_BACKSTAGE_ITEMS);
  const { isUk, getLocalizedBackstageItem } = useSiteContent();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'backstage'),
      snapshot => {
        if (snapshot.empty) {
          setItems(DEFAULT_BACKSTAGE_ITEMS);
          return;
        }
        setItems(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as BackstageItem)));
      },
      error => {
        console.warn('Could not load backstage items, using bundled fallback:', error.message);
        setItems(DEFAULT_BACKSTAGE_ITEMS);
      },
    );
    return () => unsubscribe();
  }, []);

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-slate-700">
            <Radio className="w-4 h-4" />
            <span>{isUk ? 'Інженерна виворітка ефіру' : 'Инженерная изнанка эфира'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {isUk ? 'За лаштунками проєктів' : 'За кулисами проектов'}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 font-light leading-relaxed">
            {isUk
              ? 'Реальна технічна кухня наших зйомок: ПТС, комутація, системи зв’язку та робота операторів.'
              : 'Реальная техническая кухня наших съемок: ПТС, коммутация, системы связи и работа операторов.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((rawItem, index) => {
            const item = getLocalizedBackstageItem(rawItem);
            return (
              <article key={item.id || index} className="group bg-slate-800/80 rounded-3xl overflow-hidden border border-slate-700/60 hover:border-indigo-500/50 transition-colors">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-indigo-300 border border-indigo-500/30">{item.category}</div>
                </div>
                <div className="p-6">
                  <div className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" />{item.tech}</div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
