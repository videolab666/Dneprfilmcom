import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Layers, 
  Sparkles, 
  Check, 
  X, 
  HelpCircle, 
  Video, 
  Grid, 
  BarChart3, 
  AlignLeft, 
  RefreshCw 
} from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { SiteBlock, BlockType } from '../../types';

export function BlocksManager() {
  const { blocks, saveBlock, deleteBlock, toggleBlockActive, reorderBlock, resetToDefaults } = useSiteContent();
  const [editingBlock, setEditingBlock] = useState<SiteBlock | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalLangTab, setModalLangTab] = useState<'uk' | 'ru' | 'en'>('uk');

  const getBlockText = (field: 'heading' | 'subheading' | 'badge' | 'content' | 'buttonText' | 'secondaryButtonText'): string => {
    if (!editingBlock) return '';
    if (modalLangTab === 'uk') return editingBlock.config_uk?.[field] ?? '';
    if (modalLangTab === 'en') return editingBlock.config_en?.[field] ?? '';
    return editingBlock.config[field] ?? '';
  };

  const setBlockText = (field: 'heading' | 'subheading' | 'badge' | 'content' | 'buttonText' | 'secondaryButtonText', val: string) => {
    if (!editingBlock) return;
    if (modalLangTab === 'uk') {
      setEditingBlock({
        ...editingBlock,
        config_uk: { ...(editingBlock.config_uk || {}), [field]: val }
      });
    } else if (modalLangTab === 'en') {
      setEditingBlock({
        ...editingBlock,
        config_en: { ...(editingBlock.config_en || {}), [field]: val }
      });
    } else {
      setEditingBlock({
        ...editingBlock,
        config: { ...editingBlock.config, [field]: val }
      });
    }
  };

  const blockTypeLabels: Record<BlockType, { name: string; icon: React.ReactNode; desc: string }> = {
    cta: { 
      name: 'CTA / Баннер призыва', 
      icon: <Sparkles className="w-4 h-4 text-amber-500" />, 
      desc: 'Яркая полоса с призывом к действию, кнопками и бейджем' 
    },
    text_image: { 
      name: 'Текст + Изображение', 
      icon: <AlignLeft className="w-4 h-4 text-indigo-500" />, 
      desc: 'Двухколоночный блок с описанием, фото и кнопкой' 
    },
    features_grid: { 
      name: 'Сетка услуг / Преимуществ', 
      icon: <Grid className="w-4 h-4 text-blue-500" />, 
      desc: 'Карточки преимуществ с номерами и описанием' 
    },
    stats_counter: { 
      name: 'Метрики и Цифры (Счетчики)', 
      icon: <BarChart3 className="w-4 h-4 text-emerald-500" />, 
      desc: 'Блок с крупными числами (450+ эфиров, 4K HDR)' 
    },
    faq: { 
      name: 'Вопрос-Ответ (FAQ)', 
      icon: <HelpCircle className="w-4 h-4 text-purple-500" />, 
      desc: 'Раскрывающийся аккордеон с ответами на частые вопросы' 
    },
    video_embed: { 
      name: 'Видео-презентация', 
      icon: <Video className="w-4 h-4 text-red-500" />, 
      desc: 'Большой видеоплеер (YouTube / Vimeo / превью)' 
    },
    partners: { 
      name: 'Партнеры и Клиенты', 
      icon: <Layers className="w-4 h-4 text-slate-500" />, 
      desc: 'Шеренга брендов и логотипов клиентов' 
    }
  };

  const handleStartAdd = (type: BlockType) => {
    const newBlock: SiteBlock = {
      id: `block-${Date.now()}`,
      title: blockTypeLabels[type].name,
      type,
      order: blocks.length + 1,
      isActive: true,
      page: 'home',
      config: {
        heading: 'Новый заголовок секции',
        subheading: 'Краткое описание данного раздела',
        style: type === 'stats_counter' ? 'dark' : type === 'cta' ? 'indigo' : 'light',
        items: type === 'stats_counter' 
          ? [
              { value: '100+', title: 'Проектов', description: 'По всей стране' },
              { value: '4K', title: 'Качество', description: 'Телевизионный тракт' },
              { value: '100%', title: 'Надежность', description: 'Двойное питание' },
              { value: '24/7', title: 'Поддержка', description: 'Инженер на связи' }
            ]
          : type === 'features_grid'
            ? [
                { title: 'Многокамерная съемка', description: 'До 16 камер одновременно' },
                { title: 'Мгновенные повторы', description: 'Система Slow Motion 4K' },
                { title: 'Спутниковый интернет', description: 'Starlink Gen 2 на площадке' }
              ]
            : undefined,
        faqItems: type === 'faq' 
          ? [
              { question: 'Какой срок бронирования оборудования?', answer: 'Рекомендуем бронировать минимум за 3-5 дней до мероприятия.' },
              { question: 'Предоставляете ли вы запись эфира?', answer: 'Да, отдаем чистую мастер-запись и покамерные исходники в день события.' }
            ]
          : undefined,
        partnerNames: type === 'partners'
          ? ['Федерация бокса', 'EventHub Global', 'EBA Europe', 'Riverside Park', 'Dnipro Steel', 'TechInvest']
          : undefined,
        buttonText: type === 'cta' || type === 'text_image' ? 'Связаться с нами' : undefined,
        buttonLink: type === 'cta' || type === 'text_image' ? '#contact-cta' : undefined,
        imageUrl: type === 'text_image' || type === 'video_embed' ? 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80' : undefined,
        imagePosition: 'right'
      }
    };
    setEditingBlock(newBlock);
    setIsNew(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlock) return;
    await saveBlock(editingBlock);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    setEditingBlock(null);
  };

  return (
    <div className="space-y-8">
      {/* Header controls */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Конструктор структуры сайта</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Управление блоками Главной страницы
          </h2>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Добавляйте, перемещайте, отключайте и редактируйте любые смысловые блоки сайта. Изменения моментально видны всем посетителям.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={resetToDefaults}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors shadow-sm"
            title="Восстановить базовые блоки в Firestore"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Загрузить базовые блоки</span>
          </button>
        </div>
      </div>

      {/* Add block dropdown / buttons */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Добавить новый блок на страницу:</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {(Object.keys(blockTypeLabels) as BlockType[]).map((type) => {
            const item = blockTypeLabels[type];
            return (
              <button
                key={type}
                onClick={() => handleStartAdd(type)}
                className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/60 hover:border-indigo-500 transition-all text-left group"
              >
                <div className="flex items-center space-x-2 mb-1.5">
                  {item.icon}
                  <span className="font-bold text-sm text-white group-hover:text-indigo-300">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs text-slate-400 line-clamp-2">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Blocks List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-base font-bold text-slate-800">
            Активные и настроенные блоки ({blocks.length}):
          </h3>
          <span className="text-xs text-slate-500">
            Порядок отображения сверху вниз
          </span>
        </div>

        {blocks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-800 mb-1">Пока нет созданных блоков</h4>
            <p className="text-sm text-slate-500 mb-4">Нажмите «Загрузить базовые блоки» или выберите блок выше.</p>
            <button
              onClick={resetToDefaults}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
            >
              Загрузить базовые блоки
            </button>
          </div>
        ) : (
          blocks.map((block, index) => {
            const typeInfo = blockTypeLabels[block.type] || {
              name: block.type,
              icon: <Layers className="w-4 h-4" />,
              desc: ''
            };

            return (
              <div
                key={block.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  block.isActive 
                    ? 'bg-white border-slate-200 shadow-sm hover:shadow-md' 
                    : 'bg-slate-100/70 border-slate-200 opacity-60'
                }`}
              >
                {/* Left info */}
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                        {typeInfo.icon}
                        <span>{typeInfo.name}</span>
                      </span>
                      {!block.isActive && (
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                          Отключен
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {block.title || block.config.heading || 'Без названия'}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {block.config.heading} • {block.config.subheading || block.config.badge || ''}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  {/* Order controls */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => reorderBlock(block.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-white transition-colors"
                      title="Поднять выше"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => reorderBlock(block.id, 'down')}
                      disabled={index === blocks.length - 1}
                      className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-white transition-colors"
                      title="Опустить ниже"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle Active */}
                  <button
                    onClick={() => toggleBlockActive(block.id, !block.isActive)}
                    className={`p-2 rounded-xl border transition-colors ${
                      block.isActive 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                        : 'bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300'
                    }`}
                    title={block.isActive ? 'Скрыть с сайта' : 'Опубликовать на сайте'}
                  >
                    {block.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditingBlock(JSON.parse(JSON.stringify(block)));
                      setIsNew(false);
                    }}
                    className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    title="Редактировать содержимое"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Удалить блок «${block.title}»?`)) {
                        deleteBlock(block.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                    title="Удалить блок"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EDIT MODAL */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {blockTypeLabels[editingBlock.type]?.name}
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {isNew ? 'Создание блока' : 'Редактирование содержимого'}
                </h3>
              </div>
              <button
                onClick={() => setEditingBlock(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 bg-slate-100 p-1 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => setModalLangTab('uk')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  modalLangTab === 'uk' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇺🇦 Українська (UA)
              </button>
              <button
                type="button"
                onClick={() => setModalLangTab('ru')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  modalLangTab === 'ru' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇷🇺 Русский (RU)
              </button>
              <button
                type="button"
                onClick={() => setModalLangTab('en')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  modalLangTab === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇬🇧 English (EN)
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-6">
              {/* Internal admin title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Название блока (для админки)
                </label>
                <input
                  type="text"
                  value={editingBlock.title}
                  onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  required
                />
              </div>

              {/* Section Headline */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Основной заголовок (H2) ({modalLangTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={getBlockText('heading')}
                  onChange={(e) => setBlockText('heading', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-900 font-bold"
                  placeholder={
                    modalLangTab === 'uk'
                      ? `Базовий: ${editingBlock.config.heading || ''}`
                      : modalLangTab === 'en'
                      ? `RU: ${editingBlock.config.heading || ''}`
                      : 'Например: Почему выбирают наш продакшен'
                  }
                />
              </div>

              {/* Subheading / description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Подзаголовок / Описание секции ({modalLangTab.toUpperCase()})
                </label>
                <textarea
                  rows={2}
                  value={getBlockText('subheading')}
                  onChange={(e) => setBlockText('subheading', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm"
                  placeholder={
                    modalLangTab === 'uk'
                      ? `Базовий: ${editingBlock.config.subheading || ''}`
                      : modalLangTab === 'en'
                      ? `RU: ${editingBlock.config.subheading || ''}`
                      : 'Дополнительный поясняющий текст'
                  }
                />
              </div>

              {/* Badge (if applicable) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Мини-бейдж над заголовком ({modalLangTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={getBlockText('badge')}
                  onChange={(e) => setBlockText('badge', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  placeholder="Например: Надежность 100%"
                />
              </div>

              {/* Style selector for CTA / Stats */}
              {(editingBlock.type === 'cta' || editingBlock.type === 'stats_counter') && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Цветовой стиль секции
                  </label>
                  <select
                    value={editingBlock.config.style || 'indigo'}
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      config: { ...editingBlock.config, style: e.target.value as any }
                    })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium"
                  >
                    <option value="indigo">Фирменный Indigo Градиент</option>
                    <option value="dark">Темный премиум (Slate 950)</option>
                    <option value="light">Светлый чистый (White/Slate 50)</option>
                  </select>
                </div>
              )}

              {/* Rich Content for text_image */}
              {editingBlock.type === 'text_image' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Развернутый текст статьи / описания ({modalLangTab.toUpperCase()})
                    </label>
                    <textarea
                      rows={4}
                      value={getBlockText('content')}
                      onChange={(e) => setBlockText('content', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      URL изображения (общий)
                    </label>
                    <input
                      type="url"
                      value={editingBlock.config.imageUrl || ''}
                      onChange={(e) => setEditingBlock({
                        ...editingBlock,
                        config: { ...editingBlock.config, imageUrl: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Расположение картинки
                    </label>
                    <select
                      value={editingBlock.config.imagePosition || 'right'}
                      onChange={(e) => setEditingBlock({
                        ...editingBlock,
                        config: { ...editingBlock.config, imagePosition: e.target.value as any }
                      })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                    >
                      <option value="right">Справа</option>
                      <option value="left">Слева</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Buttons for CTA / text_image */}
              {(editingBlock.type === 'cta' || editingBlock.type === 'text_image') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Текст главной кнопки ({modalLangTab.toUpperCase()})</label>
                    <input
                      type="text"
                      value={getBlockText('buttonText')}
                      onChange={(e) => setBlockText('buttonText', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      placeholder="Заказать звонок"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ссылка главной кнопки (общая)</label>
                    <input
                      type="text"
                      value={editingBlock.config.buttonLink || ''}
                      onChange={(e) => setEditingBlock({
                        ...editingBlock,
                        config: { ...editingBlock.config, buttonLink: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      placeholder="#contact-cta или /live"
                    />
                  </div>
                  {editingBlock.type === 'cta' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Текст 2-й кнопки ({modalLangTab.toUpperCase()})</label>
                        <input
                          type="text"
                          value={getBlockText('secondaryButtonText')}
                          onChange={(e) => setBlockText('secondaryButtonText', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          placeholder="Калькулятор"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ссылка 2-й кнопки (общая)</label>
                        <input
                          type="text"
                          value={editingBlock.config.secondaryButtonLink || ''}
                          onChange={(e) => setEditingBlock({
                            ...editingBlock,
                            config: { ...editingBlock.config, secondaryButtonLink: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          placeholder="/live"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Items for stats_counter & features_grid */}
              {(editingBlock.type === 'stats_counter' || editingBlock.type === 'features_grid') && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Карточки / Элементы ({editingBlock.config.items?.length || 0})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = editingBlock.config.items || [];
                        setEditingBlock({
                          ...editingBlock,
                          config: {
                            ...editingBlock.config,
                            items: [...current, { value: '100+', title: 'Новый пункт', description: 'Описание пункта' }]
                          }
                        });
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      + Добавить элемент
                    </button>
                  </div>

                  {editingBlock.config.items?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-2 items-center">
                      {editingBlock.type === 'stats_counter' && (
                        <input
                          type="text"
                          value={item.value || ''}
                          onChange={(e) => {
                            const copy = [...(editingBlock.config.items || [])];
                            copy[idx].value = e.target.value;
                            setEditingBlock({ ...editingBlock, config: { ...editingBlock.config, items: copy } });
                          }}
                          className="w-24 px-2 py-1.5 rounded border border-slate-300 text-xs font-bold text-indigo-600"
                          placeholder="Значение"
                        />
                      )}
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const copy = [...(editingBlock.config.items || [])];
                          copy[idx].title = e.target.value;
                          setEditingBlock({ ...editingBlock, config: { ...editingBlock.config, items: copy } });
                        }}
                        className="flex-1 px-2 py-1.5 rounded border border-slate-300 text-xs font-semibold"
                        placeholder="Название"
                      />
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => {
                          const copy = [...(editingBlock.config.items || [])];
                          copy[idx].description = e.target.value;
                          setEditingBlock({ ...editingBlock, config: { ...editingBlock.config, items: copy } });
                        }}
                        className="flex-1 px-2 py-1.5 rounded border border-slate-300 text-xs"
                        placeholder="Описание"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...(editingBlock.config.items || [])];
                          copy.splice(idx, 1);
                          setEditingBlock({ ...editingBlock, config: { ...editingBlock.config, items: copy } });
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* FAQ items */}
              {editingBlock.type === 'faq' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Вопросы и ответы FAQ ({editingBlock.config.faqItems?.length || 0})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = editingBlock.config.faqItems || [];
                        setEditingBlock({
                          ...editingBlock,
                          config: {
                            ...editingBlock.config,
                            faqItems: [...current, { question: 'Новый вопрос?', answer: 'Подробный ответ на вопрос...' }]
                          }
                        });
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      + Добавить вопрос
                    </button>
                  </div>

                  {editingBlock.config.faqItems?.map((faq, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const copy = [...(editingBlock.config.faqItems || [])];
                            copy[idx].question = e.target.value;
                            setEditingBlock({ ...editingBlock, config: { ...editingBlock.config, faqItems: copy } });
                          }}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-bold"
                          placeholder="Текст вопроса"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...(editingBlock.config.faqItems || [])];
                            copy.splice(idx, 1);
                            setEditingBlock({ ...editingBlock, config: { ...editingBlock.config, faqItems: copy } });
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const copy = [...(editingBlock.config.faqItems || [])];
                          copy[idx].answer = e.target.value;
                          setEditingBlock({ ...editingBlock, config: { ...editingBlock.config, faqItems: copy } });
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs text-slate-700"
                        placeholder="Текст ответа"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Video Embed */}
              {editingBlock.type === 'video_embed' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Ссылка на видео (YouTube / Vimeo / Embed)
                    </label>
                    <input
                      type="url"
                      value={editingBlock.config.videoUrl || ''}
                      onChange={(e) => setEditingBlock({
                        ...editingBlock,
                        config: { ...editingBlock.config, videoUrl: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Подпись под видео
                    </label>
                    <input
                      type="text"
                      value={editingBlock.config.videoCaption || ''}
                      onChange={(e) => setEditingBlock({
                        ...editingBlock,
                        config: { ...editingBlock.config, videoCaption: e.target.value }
                      })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingBlock(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
                >
                  {isNew ? 'Создать блок' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
