import React, { useState } from 'react';
import { 
  Save, 
  Sparkles, 
  UserCheck, 
  Phone, 
  Bell, 
  CheckCircle2, 
  Globe2 
} from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { SiteSetting } from '../../types';

type EditableTextField = 
  | 'studioName' 
  | 'address' 
  | 'workingHours' 
  | 'heroBadge' 
  | 'heroTitle' 
  | 'heroSubtitle' 
  | 'heroCtaPrimaryText' 
  | 'heroCtaSecondaryText' 
  | 'founderName' 
  | 'founderRole' 
  | 'founderQuote' 
  | 'founderBio' 
  | 'announcementText';

export function SiteSettingsEditor() {
  const { rawSettings, updateSettings } = useSiteContent();
  const [formData, setFormData] = useState<SiteSetting>(rawSettings);
  const [saved, setSaved] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'founder' | 'contacts' | 'announcement'>('hero');
  const [langTab, setLangTab] = useState<'uk' | 'ru' | 'en'>('uk');

  // Keep local form in sync if context loaded new data
  React.useEffect(() => {
    setFormData(rawSettings);
  }, [rawSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getFieldValue = (field: EditableTextField): string => {
    if (langTab === 'uk') return formData[`${field}_uk`] ?? '';
    if (langTab === 'en') return formData[`${field}_en`] ?? '';
    return formData[field] ?? '';
  };

  const setFieldValue = (field: EditableTextField, value: string) => {
    if (langTab === 'uk') {
      setFormData(prev => ({ ...prev, [`${field}_uk`]: value }));
    } else if (langTab === 'en') {
      setFormData(prev => ({ ...prev, [`${field}_en`]: value }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const getPlaceholder = (field: EditableTextField): string => {
    if (langTab === 'uk') {
      return formData[field] ? `(Базовый): ${formData[field]}` : '';
    }
    if (langTab === 'en') {
      return formData[`${field}_uk`] 
        ? `(UA): ${formData[`${field}_uk`]}` 
        : (formData[field] ? `(RU): ${formData[field]}` : '');
    }
    return '';
  };

  const langBadges = {
    uk: { label: 'Українська (UA)', flag: '🇺🇦' },
    ru: { label: 'Русский (RU)', flag: '🇷🇺' },
    en: { label: 'English (EN)', flag: '🇬🇧' },
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Главные экраны и тексты</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Редактирование сайта и реквизитов
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Изменяйте заголовок первого экрана (H1), слоган, блок основателя Александра Пителя, контактные телефоны и верхнее объявление параллельно на украинском, русском и английском языках.
          </p>
        </div>

        {saved && (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Настройки успешно сохранены!</span>
          </div>
        )}
      </div>

      {/* Language Selector Bar */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Язык редактирования текстов</h3>
            <p className="text-xs text-slate-400">
              Переключайте вкладки, чтобы вносить параллельные переводы
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setLangTab('uk')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              langTab === 'uk'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🇺🇦</span>
            <span>Українська (UA)</span>
          </button>
          <button
            type="button"
            onClick={() => setLangTab('ru')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              langTab === 'ru'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🇷🇺</span>
            <span>Русский (RU)</span>
          </button>
          <button
            type="button"
            onClick={() => setLangTab('en')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              langTab === 'en'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🇬🇧</span>
            <span>English (EN)</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-8 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveSubTab('hero')}
          className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
            activeSubTab === 'hero'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          1. Главный экран (Hero H1)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('founder')}
          className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
            activeSubTab === 'founder'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          2. Основатель (Александр Питель)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('contacts')}
          className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
            activeSubTab === 'contacts'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          3. Контакты и Студия
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('announcement')}
          className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
            activeSubTab === 'announcement'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          4. Верхняя строка (Alert bar)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Current Active Language Indicator */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-indigo-900">
          <span className="font-semibold flex items-center space-x-2">
            <span>Сейчас редактируется версия:</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
              {langBadges[langTab].flag} {langBadges[langTab].label}
            </span>
          </span>
          <span className="text-indigo-600 hidden sm:inline">
            Все изменения сохраняются в общей базе данных
          </span>
        </div>

        {/* HERO TAB */}
        {activeSubTab === 'hero' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Настройки первого экрана (Hero Section)</span>
            </h3>

            {/* Mini visual live preview */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 p-6 sm:p-8 text-white border border-slate-800">
              <div className="absolute inset-0 opacity-30 bg-center bg-cover" style={{ backgroundImage: `url(${formData.heroBgImage})` }} />
              <div className="relative z-10 max-w-xl">
                {getFieldValue('heroBadge') && (
                  <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 border border-white/15">
                    {getFieldValue('heroBadge')}
                  </span>
                )}
                <h4 className="text-xl sm:text-2xl font-black mb-2 leading-tight">
                  {getFieldValue('heroTitle') || 'Заголовок Hero'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mb-4 line-clamp-2">
                  {getFieldValue('heroSubtitle')}
                </p>
                <div className="flex gap-2">
                  <span className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                    {getFieldValue('heroCtaPrimaryText') || 'Кнопка 1'}
                  </span>
                  <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20">
                    {getFieldValue('heroCtaSecondaryText') || 'Кнопка 2'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Верхний бейдж над заголовком [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('heroBadge')}
                  onChange={(e) => setFieldValue('heroBadge', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium text-sm"
                  placeholder={getPlaceholder('heroBadge') || "ПТС 4K HDR • Starlink • Zero Failure Protocol"}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Главный заголовок H1 [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('heroTitle')}
                  onChange={(e) => setFieldValue('heroTitle', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 font-bold text-base"
                  placeholder={getPlaceholder('heroTitle') || "Медиа-продакшен и прямые трансляции без права на ошибку"}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Подзаголовок Hero [{langBadges[langTab].label}]
                </label>
                <textarea
                  rows={2}
                  value={getFieldValue('heroSubtitle')}
                  onChange={(e) => setFieldValue('heroSubtitle', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  placeholder={getPlaceholder('heroSubtitle') || "Телевизионный стандарт многокамерного эфира..."}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Текст 1-й кнопки [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('heroCtaPrimaryText')}
                  onChange={(e) => setFieldValue('heroCtaPrimaryText', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold"
                  placeholder={getPlaceholder('heroCtaPrimaryText')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Ссылка 1-й кнопки (общая)
                </label>
                <input
                  type="text"
                  value={formData.heroCtaPrimaryLink || ''}
                  onChange={(e) => setFormData({ ...formData, heroCtaPrimaryLink: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  placeholder="/live"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Текст 2-й кнопки [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('heroCtaSecondaryText')}
                  onChange={(e) => setFieldValue('heroCtaSecondaryText', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold"
                  placeholder={getPlaceholder('heroCtaSecondaryText')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Ссылка 2-й кнопки (общая)
                </label>
                <input
                  type="text"
                  value={formData.heroCtaSecondaryLink || ''}
                  onChange={(e) => setFormData({ ...formData, heroCtaSecondaryLink: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  placeholder="/cases"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Фоновое изображение первого экрана (URL)
                </label>
                <input
                  type="url"
                  value={formData.heroBgImage || ''}
                  onChange={(e) => setFormData({ ...formData, heroBgImage: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>
          </div>
        )}

        {/* FOUNDER TAB */}
        {activeSubTab === 'founder' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <span>Секция основателя: Александр Питель</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Имя и Фамилия [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('founderName')}
                  onChange={(e) => setFieldValue('founderName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold"
                  placeholder={getPlaceholder('founderName') || "Олександр Пітель"}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Должность / Титул [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('founderRole')}
                  onChange={(e) => setFieldValue('founderRole', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  placeholder={getPlaceholder('founderRole') || "Засновник студії Dneprfilm & Генеральний продюсер"}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Главная цитата [{langBadges[langTab].label}]
                </label>
                <textarea
                  rows={3}
                  value={getFieldValue('founderQuote')}
                  onChange={(e) => setFieldValue('founderQuote', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium"
                  placeholder={getPlaceholder('founderQuote')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Биография / Стандарты работы [{langBadges[langTab].label}]
                </label>
                <textarea
                  rows={4}
                  value={getFieldValue('founderBio')}
                  onChange={(e) => setFieldValue('founderBio', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  placeholder={getPlaceholder('founderBio')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Фотография основателя (URL)
                </label>
                <div className="flex gap-4 items-center">
                  <img
                    src={formData.founderPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80'}
                    alt="Портрет"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <input
                    type="url"
                    value={formData.founderPhoto || ''}
                    onChange={(e) => setFormData({ ...formData, founderPhoto: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTACTS TAB */}
        {activeSubTab === 'contacts' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Phone className="w-5 h-5 text-indigo-600" />
              <span>Контакты студии и социальные сети</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Название бренда [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('studioName')}
                  onChange={(e) => setFieldValue('studioName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold"
                  placeholder={getPlaceholder('studioName') || "Dneprfilm"}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Основной телефон (общий)
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold"
                  placeholder="+380 (67) 560-64-67"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email (общий)
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  placeholder="dneprfilm.dp@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Telegram канал / контакт
                </label>
                <input
                  type="text"
                  value={formData.telegram || ''}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  placeholder="https://t.me/dneprfilm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  placeholder="+380675606467"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Физический адрес [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('address')}
                  onChange={(e) => setFieldValue('address', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  placeholder={getPlaceholder('address')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  График работы [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('workingHours')}
                  onChange={(e) => setFieldValue('workingHours', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900"
                  placeholder={getPlaceholder('workingHours')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Instagram ссылка
                </label>
                <input
                  type="url"
                  value={formData.instagramUrl || ''}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Facebook ссылка
                </label>
                <input
                  type="url"
                  value={formData.facebookUrl || ''}
                  onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENT TAB */}
        {activeSubTab === 'announcement' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Bell className="w-5 h-5 text-indigo-600" />
              <span>Верхняя полоса оповещения на всем сайте</span>
            </h3>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={formData.announcementEnabled || false}
                  onChange={(e) => setFormData({ ...formData, announcementEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-sm text-slate-900">
                    Отображать верхнюю строчку с объявлением
                  </span>
                  <p className="text-xs text-slate-500">
                    Полоса появится в самом верху над меню на всех страницах сайта
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Текст объявления [{langBadges[langTab].label}]
                </label>
                <input
                  type="text"
                  value={getFieldValue('announcementText')}
                  onChange={(e) => setFieldValue('announcementText', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  placeholder={getPlaceholder('announcementText') || "🔥 Открыта бронь ПТС..."}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Ссылка для перехода по клику (общая)
                </label>
                <input
                  type="text"
                  value={formData.announcementLink || ''}
                  onChange={(e) => setFormData({ ...formData, announcementLink: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  placeholder="/live"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save button bar */}
        <div className="flex justify-end items-center space-x-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm sticky bottom-4 z-20">
          {saved && (
            <span className="text-sm font-bold text-emerald-600 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Изменения сохранены и опубликованы!</span>
            </span>
          )}
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Save className="w-5 h-5" />
            <span>Сохранить настройки сайта</span>
          </button>
        </div>
      </form>
    </div>
  );
}
