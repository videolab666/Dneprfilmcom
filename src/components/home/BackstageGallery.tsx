import { useState, useEffect } from 'react';
import { Radio, Cpu } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BackstageItem } from '../../types';
import { useSiteContent } from '../../context/SiteContentContext';

const DEFAULT_BACKSTAGE_ITEMS: BackstageItem[] = [
  {
    id: 'backstage-1',
    title: 'Мобильный режиссерский узел ПТС',
    category: 'Режиссерская',
    tech: 'vMix Pro 4K + Blackmagic ATEM Constellation',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
    description: 'Центр управления эфиром: мультивьюер на 16 источников, станция повторов Slow Motion и титровальный сервер.'
  },
  {
    id: 'backstage-2',
    title: 'Операторская группа на ринге и стадионе',
    category: 'Операторы',
    tech: 'Sony FX6 / FX9 + длиннофокусная кинооптика G Master',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80',
    description: 'Операторы работают на беспроводных радиофокусах и радиоканалах связи с режиссером в режиме 0 задержки.'
  },
  {
    id: 'backstage-3',
    title: 'Коммутация и резервирование тракта 12G-SDI',
    category: 'Коммутация',
    tech: 'Бронированные оптические кабели + конвертеры Neutrik',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80',
    description: 'Защищенные кабель-каналы (капы) для безопасности участников и чистый цифровой сигнал без наводок.'
  },
  {
    id: 'backstage-4',
    title: 'Автономная станция связи и Starlink',
    category: 'Связь и питание',
    tech: 'Starlink Gen 2 + LiveU / Peplink мульти-SIM бондинг',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80',
    description: 'Гарантия стабильной отдачи потока 50+ Мбит/с даже на стадионах и загородных полигонах без проводного интернета.'
  }
];

export function BackstageGallery() {
  const [items, setItems] = useState<BackstageItem[]>(DEFAULT_BACKSTAGE_ITEMS);
  const { isUk, getLocalizedBackstageItem } = useSiteContent();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'backstage'), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as BackstageItem));
        setItems(list);
      } else {
        setItems(DEFAULT_BACKSTAGE_ITEMS);
      }
    }, (err) => {
      console.warn('Could not fetch backstage items:', err.message);
    });
    return () => unsub();
  }, []);

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-slate-700">
            <Radio className="w-4 h-4" />
            <span>{isUk ? 'Інженерна виворітка ефіру' : 'Инженерная изнанка эфира'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            {isUk ? 'За лаштунками проєктів' : 'За кулисами проектов'}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 font-light leading-relaxed">
            {isUk
              ? 'Показуємо реальну технічну кухню наших зйомок: ПТС-пульти, оптичну комутацію, системи зв\'язку та роботу операторів.'
              : 'Показываем реальную техническую кухню наших съемок: ПТС-пульты, оптическую коммутацию, системы связи и работу операторов.'}
          </p>
        </div>

        {/* 4 Large Visual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((rawItem, idx) => {
            const item = getLocalizedBackstageItem(rawItem);
            return (
              <div
                key={item.id || idx}
                className="group bg-slate-800/80 rounded-3xl overflow-hidden border border-slate-700/60 hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-indigo-300 border border-indigo-500/30">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="text-xs font-semibold text-indigo-400 mb-1 flex items-center">
                    <Cpu className="w-3.5 h-3.5 mr-1.5" />
                    {item.tech}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
