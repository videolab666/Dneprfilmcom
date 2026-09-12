import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Sparkles, 
  Home, 
  UtensilsCrossed, 
  PartyPopper, 
  Heart, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  Send, 
  Calendar,
  Layers
} from 'lucide-react';
import type { PhotoItem } from '../data/initialPhotos';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSiteContent } from '../context/SiteContentContext';
import { usePageCmsContent } from '../hooks/usePageCmsContent';
import { usePageCopyContent } from '../hooks/usePageCopyContent';

type CategoryFilter = 'all' | 'interior' | 'food' | 'kids' | 'wedding' | 'corporate';

export function PhotoProduction() {
  const { isUk, l } = useSiteContent();
  const { content: pageContent, localize } = usePageCmsContent();
  const { content: copyContent, byId: copyById } = usePageCopyContent();
  const photoHero = copyById(copyContent.photo.hero, 'photo-hero')?.text;
  const photoGalleryHeading = copyById(copyContent.photo.headings, 'photo-heading-gallery')?.text;
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const allPhotos: PhotoItem[] = localize(pageContent.photo.gallery).map(item => ({
    id: item.id,
    title: item.text.title || '',
    category: (item.categoryKey || 'interior') as PhotoItem['category'],
    categoryLabel: item.text.meta1 || '',
    location: item.text.meta2 || undefined,
    client: item.text.meta3 || undefined,
    description: item.text.description || '',
    imageUrl: item.imageUrl || '',
    aspect: item.aspect || 'landscape',
    specs: item.text.badge || undefined,
  }));

  const allPackages = localize(pageContent.photo.packages).map(item => ({
    id: item.id,
    title: item.text.title || '',
    subtitle: item.text.subtitle || '',
    price: item.text.meta1 || '',
    period: item.text.meta2 || '',
    badge: item.text.badge || '',
    features: item.text.items || [],
    highlight: Boolean(item.highlight),
  }));

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    emailOrTelegram: '',
    photoType: 'interior',
    desiredDate: '',
    locationDetails: '',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtered photos
  const filteredPhotos = activeCategory === 'all'
    ? allPhotos
    : allPhotos.filter(p => p.category === activeCategory);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') setSelectedPhotoIndex(null);
      if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((prev) => (prev !== null ? (prev + 1) % filteredPhotos.length : 0));
      }
      if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((prev) => (prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, filteredPhotos.length]);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg(l("Будь ласка, вкажіть ім'я та телефон для зв'язку", "Пожалуйста, укажите имя и телефон для связи"));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await addDoc(collection(db, 'leads'), {
        source: 'photography_booking',
        name: formData.name,
        phone: formData.phone,
        contactDetail: formData.emailOrTelegram,
        serviceType: `Фотозйомка: ${formData.photoType}`,
        desiredDate: formData.desiredDate,
        locationDetails: formData.locationDetails,
        comment: formData.comment,
        status: 'new',
        createdAt: serverTimestamp()
      });

      setIsSubmitted(true);
      setFormData({
        name: '',
        phone: '',
        emailOrTelegram: '',
        photoType: 'interior',
        desiredDate: '',
        locationDetails: '',
        comment: ''
      });
    } catch (err) {
      console.error('Error saving photography lead:', err);
      setErrorMsg(l("Сталася помилка під час надсилання заявки. Спробуйте ще раз або зв'яжіться телефоном.", "Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или свяжитесь по телефону.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPackage = (pkgTitle: string) => {
    let matchedType = 'interior';
    if (pkgTitle.includes('Интерьер') || pkgTitle.includes('Інтер\'єр')) matchedType = 'interior';
    else if (pkgTitle.includes('Фуд')) matchedType = 'food';
    else if (pkgTitle.includes('Детск') || pkgTitle.includes('Дитяч')) matchedType = 'kids';
    else if (pkgTitle.includes('Свадеб') || pkgTitle.includes('Весіль')) matchedType = 'wedding';
    else if (pkgTitle.includes('КОМБО')) matchedType = 'combo';

    setFormData(prev => ({
      ...prev,
      photoType: matchedType,
      comment: isUk ? `Цікавить тарифний пакет «${pkgTitle}»` : `Интересует тарифный пакет «${pkgTitle}»`
    }));

    const formElement = document.getElementById('booking-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const categoriesConfig: { id: CategoryFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: l("Усі роботи", "Все работы"), icon: <Camera className="w-4 h-4" />, count: allPhotos.length },
    { id: 'interior', label: l("Інтер'єри & Архітектура", "Интерьеры & Архитектура"), icon: <Home className="w-4 h-4" />, count: allPhotos.filter(p => p.category === 'interior').length },
    { id: 'food', label: l("Фуд-зйомка & Меню", "Фуд-съемка & Меню"), icon: <UtensilsCrossed className="w-4 h-4" />, count: allPhotos.filter(p => p.category === 'food').length },
    { id: 'kids', label: l("Дитячі свята", "Детские праздники"), icon: <PartyPopper className="w-4 h-4" />, count: allPhotos.filter(p => p.category === 'kids').length },
    { id: 'wedding', label: l("Весілля & Love Story", "Свадьбы & Love Story"), icon: <Heart className="w-4 h-4" />, count: allPhotos.filter(p => p.category === 'wedding').length },
    { id: 'corporate', label: l("Бізнес & Репортаж", "Бизнес & Репортаж"), icon: <Briefcase className="w-4 h-4" />, count: allPhotos.filter(p => p.category === 'corporate').length },
  ];

  const currentPhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <Camera className="w-3.5 h-3.5" />
              <span>{photoHero?.badge}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {photoHero?.title}
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
              {photoHero?.description}
            </p>

            {/* Value Badges */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-300">{l("Прев'ю за 48 годин", "Превью за 48 часов")}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-300">{l("Sony G-Master & Світло", "Sony G-Master & Свет")}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-300">{l("Чітка геометрія стін", "Четкая геометрия стен")}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-300">{l("КОМБО: Відео + Фото", "КОМБО: Видео + Фото")}</span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#portfolio"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25"
              >
                {photoHero?.meta1}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <a
                href="#booking-form"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
              >
                {photoHero?.meta2}
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* 2. GALLERY SECTION WITH CATEGORY FILTER */}
      <section id="portfolio" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {photoGalleryHeading?.title}
          </h2>
          <p className="mt-3 text-slate-600 text-base">
            {photoGalleryHeading?.description}
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 mb-10">
          {categoriesConfig.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhotoIndex(index)}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 cursor-pointer flex flex-col"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                
                {/* Category Pill Over Image */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-white border border-white/10">
                    {photo.categoryLabel}
                  </span>
                </div>

                {/* Hover overlay with zoom icon */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-3 bg-white/90 rounded-full text-slate-900 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {photo.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {photo.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{photo.location || photo.client || (l("Авторська зйомка", "Авторская съемка"))}</span>
                  {photo.specs && (
                    <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {photo.specs}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 3. LIGHTBOX MODAL */}
      {currentPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={l("Закрити (ESC)", "Закрыть (ESC)")}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Prev/Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhotoIndex((prev) => (prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0));
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={l("Попереднє фото", "Предыдущее фото")}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhotoIndex((prev) => (prev !== null ? (prev + 1) % filteredPhotos.length : 0));
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={l("Наступне фото", "Следующее фото")}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Modal Content */}
          <div 
            className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentPhoto.imageUrl}
              alt={currentPhoto.title}
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
            
            <div className="mt-4 text-center max-w-2xl px-4">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
                {currentPhoto.categoryLabel}
              </span>
              <h4 className="text-lg font-bold text-white">
                {currentPhoto.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {currentPhoto.description}
              </p>
              {currentPhoto.specs && (
                <p className="text-xs text-indigo-300 mt-2 font-mono">
                  {currentPhoto.specs}
                </p>
              )}

              <div className="mt-4 flex items-center justify-center space-x-3">
                <button
                  onClick={() => {
                    handleSelectPackage(currentPhoto.categoryLabel);
                    setSelectedPhotoIndex(null);
                  }}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  {l("Замовити таку зйомку", "Заказать такую съемку")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 4. WHY CHOOSE US / STANDARDS SECTION */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              {l("Стандарти зйомки", "Стандарты съемки")}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              {l("Чому клієнти довіряють свої проекти та події", "Почему клиенты доверяют свои проекты и события")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {l("Інтер'єр & Архітектура", "Интерьер & Архитектура")}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {l("Спеціалізована ширококутна оптика без дисторсії («риб'ячого ока»). Вирівнювання всіх вертикалей, зшивка кількох експозицій (HDR) для ідеального промальовування виду з панорамних вікон та текстур оздоблення.", "Специализированная широкоугольная оптика без дисторсии («рыбьего глаза»). Выравнивание всех вертикалей, сшивка нескольких экспозиций (HDR) для идеальной прорисовки вида из панорамных окон и текстур отделки.")
                }
              </p>
              <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-200">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> {l("Готово для каталогів та Booking / Airbnb", "Готово для каталогов и Booking / Airbnb")}</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> {l("Точна передача кольорів дизайнерських матеріалів", "Точная цветопередача дизайнерских материалов")}</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {l("Фуд-зйомка & Ресторани", "Фуд-съемка & Рестораны")}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {l("Привозимо виїзне імпульсне світло та модифікатори прямо на кухню ресторану. Зйомка в моменті подачі шеф-кухаря, макродеталізація, підкреслення соковитості м'яса, хрусткої скоринки та свіжості інгредієнтів.", "Привозим выездной импульсный свет и модификаторы прямо на кухню ресторана. Съемка в моменте подачи шеф-повара, макродетализация, подчеркивание сочности мяса, хрустящей корочки и свежести ингредиентов.")
                }
              </p>
              <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-200">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> {l("Формати під друковане меню, сайт та служби доставки", "Форматы под печатное меню, сайт и службы доставки")}</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> {l("Робота без зупинки роботи закладу", "Работа без остановки работы заведения")}</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {l("Події, Діти & Весілля", "События, Дети & Свадьбы")}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {l("Жодної дерев'яної скутості перед камерою. Репортажна легкість, вловлювання щирих непостановочних дитячих посмішок, зворушливих поглядів та святкового драйву. Авторський благородний колір без отруйних фільтрів.", "Никакой деревянной скованности перед камерой. Репортажная легкость, поимка искренних непостановочных детских улыбок, трогательных взглядов и праздничного драйва. Авторский благородный цвет без ядовитых фильтров.")
                }
              </p>
              <ul className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-200">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> {l("Експрес-анонс серії фото за перші 24-48 годин", "Экспресс-анонс серии фото за первые 24-48 часов")}</li>
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> {l("Зручна фірмова онлайн-галерея для гостей", "Удобная фирменная онлайн-галерея для гостей")}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* 5. PRICING PACKAGES */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
            {l("Тарифи та умови", "Тарифы и условия")}
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
            {l("Прозорі пакети без прихованих доплат", "Прозрачные пакеты без скрытых доплат")}
          </h2>
          <p className="mt-3 text-slate-600 text-base">
            {l("У кожен пакет уже включено виїзд з усім комплектом техніки, базову кольорокорекцію всіх кадрів та передачу матеріалу через зручну онлайн-галерею.", "В каждый пакет уже включены выезд со всем комплектом техники, базовая цветокоррекция всех кадров и отдача материала через удобную онлайн-галерею.")
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl p-7 flex flex-col justify-between transition-all duration-300 ${
                pkg.highlight
                  ? 'bg-gradient-to-b from-indigo-900 to-slate-900 text-white shadow-xl shadow-indigo-900/20 ring-2 ring-indigo-500 relative'
                  : 'bg-white text-slate-900 border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {pkg.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow">
                  {l("Супер-вигода", "Супер-выгода")}
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      pkg.highlight ? 'bg-indigo-800/80 text-indigo-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {pkg.badge}
                    </span>
                    <h3 className={`text-xl font-bold mt-3 ${pkg.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {pkg.title}
                    </h3>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed mb-6 ${pkg.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {pkg.subtitle}
                </p>

                <div className="mb-6 pb-6 border-b border-slate-100/10">
                  <div className={`text-3xl font-extrabold ${pkg.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {pkg.price}
                  </div>
                  <div className={`text-xs mt-1 ${pkg.highlight ? 'text-indigo-300' : 'text-slate-400'}`}>
                    {pkg.period}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 text-xs sm:text-sm">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle2 className={`w-4 h-4 mr-2.5 mt-0.5 shrink-0 ${
                        pkg.highlight ? 'text-indigo-400' : 'text-emerald-500'
                      }`} />
                      <span className={pkg.highlight ? 'text-slate-200' : 'text-slate-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPackage(pkg.title)}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  pkg.highlight
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-900 hover:bg-indigo-600 text-white'
                }`}
              >
                {l("Обрати цей пакет", "Выбрать этот пакет")}
              </button>
            </div>
          ))}
        </div>
      </section>


      {/* 6. BOOKING FORM SECTION */}
      <section id="booking-form" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
              {l("Бронювання дати & Консультація", "Бронирование даты & Консультация")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              {l("Обговорити вашу фотосесію або комбо-зйомку", "Обсудить вашу фотосессию или комбо-съемку")}
            </h2>
            <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
              {l("Залиште контакти та деталі зйомки. Олександр Пітель зв'яжеться з вами протягом 15-30 хвилин для узгодження дати, таймінгу та точного кошторису.", "Оставьте контакты и детали съемки. Александр Питель свяжется с вами в течение 15-30 минут для согласования даты, тайминга и точной сметы.")
              }
            </p>
          </div>

          <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-3xl p-6 sm:p-10 shadow-2xl">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">{l("Заявку успішно надіслано!", "Заявка успешно отправлена!")}</h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto">
                  {l("Дякуємо! Ми вже отримали вашу заявку на фотозйомку та зв'яжемося з вами найближчим часом для підтвердження деталей.", "Спасибо! Мы уже получили вашу заявку на фотосъемку и свяжемся с вами в ближайшее время для подтверждения деталей.")
                  }
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  {l("Надіслати ще одну заявку", "Отправить еще одну заявку")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-6">
                {errorMsg && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      {l("Ваше ім'я", "Ваше имя")} <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={l("Олександр або назва компанії", "Александр или название компании")}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      {l("Телефон для зв'язку", "Телефон для связи")} <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+380 (50) 000-00-00"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      {l("Telegram / Email (опціонально)", "Telegram / Email (опционально)")}
                    </label>
                    <input
                      type="text"
                      placeholder={l("@username або пошта", "@username или почта")}
                      value={formData.emailOrTelegram}
                      onChange={(e) => setFormData({ ...formData, emailOrTelegram: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      {l("Напрямок зйомки", "Направление съемки")}
                    </label>
                    <select
                      value={formData.photoType}
                      onChange={(e) => setFormData({ ...formData, photoType: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="interior">{l("Інтер'єри & Нерухомість", "Интерьеры & Недвижимость")}</option>
                      <option value="food">{l("Фуд-зйомка & Ресторанне меню", "Фуд-съемка & Ресторанное меню")}</option>
                      <option value="kids">{l("Дитяче свято / Сімейна подія", "Детский праздник / Семейное событие")}</option>
                      <option value="wedding">{l("Весільна зйомка / Love Story", "Свадебная съемка / Love Story")}</option>
                      <option value="corporate">{l("Бізнес-портрет / Репортаж форуму", "Бизнес-портрет / Репортаж форума")}</option>
                      <option value="combo">{l("КОМБО: Відео + Фотозйомка", "КОМБО: Видео + Фотосъемка")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      {l("Бажана дата зйомки", "Желаемая дата съемки")}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.desiredDate}
                        onChange={(e) => setFormData({ ...formData, desiredDate: e.target.value })}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      {l("Місто / Локація об'єкта", "Город / Локация объекта")}
                    </label>
                    <input
                      type="text"
                      placeholder={l("м. Дніпро, ресторан / ЖК / студія", "г. Днепр, ресторан / ЖК / студия")}
                      value={formData.locationDetails}
                      onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    {l("Побажання або технічне завдання (ТЗ)", "Пожелания или техническое задание (ТЗ)")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={l("Наприклад: потрібно відзняти 15 страв нового меню, або 3-кімнатну квартиру на продаж...", "Например: нужно отснять 15 блюд нового меню, либо 3-комнатную квартиру на продажу...")}
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>{l("Надсилання заявки...", "Отправка заявки...")}</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{l("Забронювати зйомку / Отримати кошторис", "Забронировать съемку / Получить смету")}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
