import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext';

export function NotFound() {
  const { locale } = useSiteContent();

  const copy = {
    uk: {
      badge: 'Помилка 404',
      title: 'Сторінку не знайдено',
      description: 'Можливо, посилання застаріло або адресу введено з помилкою. Поверніться на головну сторінку Dneprfilm.',
      home: 'На головну',
      back: 'Назад',
    },
    ru: {
      badge: 'Ошибка 404',
      title: 'Страница не найдена',
      description: 'Возможно, ссылка устарела или адрес введён с ошибкой. Вернитесь на главную страницу Dneprfilm.',
      home: 'На главную',
      back: 'Назад',
    },
    en: {
      badge: 'Error 404',
      title: 'Page not found',
      description: 'The link may be outdated or the address may be incorrect. Return to the Dneprfilm home page.',
      home: 'Home',
      back: 'Back',
    },
  }[locale];

  return (
    <section className="min-h-[70vh] bg-slate-950 text-white flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400 mb-5">{copy.badge}</div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-5">{copy.title}</h1>
        <p className="max-w-xl mx-auto text-slate-400 text-base sm:text-lg leading-relaxed">{copy.description}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold hover:bg-indigo-500 transition-colors">
            <Home className="w-4 h-4" />
            {copy.home}
          </Link>
          <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {copy.back}
          </button>
        </div>
      </div>
    </section>
  );
}
