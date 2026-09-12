import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Tv, 
  Activity, 
  Radio 
} from 'lucide-react';
import { SiteBlock } from '../../types';
import { useSiteContent } from '../../context/SiteContentContext';

export interface DynamicBlockRendererProps {
  block: SiteBlock;
  key?: React.Key;
}

export const DynamicBlockRenderer: React.FC<DynamicBlockRendererProps> = ({ block }) => {
  const { isUk } = useSiteContent();
  const rawConfig = block.config;
  const config = (isUk && block.config_uk) ? { ...rawConfig, ...block.config_uk } : rawConfig;
  const { type } = block;

  if (type === 'cta') {
    const isIndigo = config.style === 'indigo';
    const isDark = config.style === 'dark';
    
    return (
      <section className={`py-20 relative overflow-hidden ${
        isIndigo 
          ? 'bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white' 
          : isDark 
            ? 'bg-slate-900 text-white' 
            : 'bg-indigo-50/70 border-y border-indigo-100 text-slate-900'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {config.badge && (
            <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 ${
              isIndigo || isDark 
                ? 'bg-white/10 text-indigo-300 border border-white/15' 
                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{config.badge}</span>
            </div>
          )}

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
            {config.heading}
          </h2>

          {config.subheading && (
            <p className={`text-base sm:text-lg lg:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-light ${
              isIndigo || isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {config.subheading}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            {config.buttonText && config.buttonLink && (
              config.buttonLink.startsWith('#') ? (
                <a
                  href={config.buttonLink}
                  className="px-8 py-4 text-base font-semibold rounded-full bg-white text-indigo-900 hover:bg-slate-100 shadow-xl transition-all"
                >
                  {config.buttonText}
                </a>
              ) : (
                <Link
                  to={config.buttonLink}
                  className="px-8 py-4 text-base font-semibold rounded-full bg-white text-indigo-900 hover:bg-slate-100 shadow-xl transition-all"
                >
                  {config.buttonText}
                </Link>
              )
            )}

            {config.secondaryButtonText && config.secondaryButtonLink && (
              config.secondaryButtonLink.startsWith('#') ? (
                <a
                  href={config.secondaryButtonLink}
                  className={`px-8 py-4 text-base font-semibold rounded-full transition-all border ${
                    isIndigo || isDark 
                      ? 'bg-white/10 text-white hover:bg-white/20 border-white/20' 
                      : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-300'
                  }`}
                >
                  {config.secondaryButtonText}
                </a>
              ) : (
                <Link
                  to={config.secondaryButtonLink}
                  className={`px-8 py-4 text-base font-semibold rounded-full transition-all border ${
                    isIndigo || isDark 
                      ? 'bg-white/10 text-white hover:bg-white/20 border-white/20' 
                      : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-300'
                  }`}
                >
                  {config.secondaryButtonText}
                </Link>
              )
            )}
          </div>
        </div>
      </section>
    );
  }

  if (type === 'text_image') {
    const isImageRight = config.imagePosition !== 'left';
    return (
      <section className="py-24 bg-white text-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
            isImageRight ? '' : 'lg:grid-flow-dense'
          }`}>
            <div className={isImageRight ? '' : 'lg:col-start-2'}>
              {config.badge && (
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{config.badge}</span>
                </div>
              )}
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-6">
                {config.heading}
              </h2>
              {config.subheading && (
                <p className="text-lg text-indigo-600 font-medium mb-4">
                  {config.subheading}
                </p>
              )}
              <div className="prose prose-slate max-w-none text-slate-600 text-base leading-relaxed mb-8">
                {config.content}
              </div>
              {config.buttonText && config.buttonLink && (
                config.buttonLink.startsWith('#') ? (
                  <a
                    href={config.buttonLink}
                    className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
                  >
                    <span>{config.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <Link
                    to={config.buttonLink}
                    className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
                  >
                    <span>{config.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )
              )}
            </div>

            <div className={`relative ${isImageRight ? '' : 'lg:col-start-1'}`}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                <img
                  src={config.imageUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80'}
                  alt={config.heading || 'Продакшн'}
                  className="w-full h-80 sm:h-96 lg:h-[460px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (type === 'stats_counter') {
    const isDark = config.style !== 'light';
    return (
      <section className={`py-20 relative ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900 border-y border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(config.heading || config.subheading) && (
            <div className="text-center max-w-3xl mx-auto mb-14">
              {config.heading && (
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                  {config.heading}
                </h2>
              )}
              {config.subheading && (
                <p className={`text-base sm:text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {config.subheading}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {config.items && config.items.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-6 sm:p-8 rounded-2xl border text-center transition-all ${
                  isDark 
                    ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50' 
                    : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                }`}
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-indigo-400 mb-2">
                  {item.value}
                </div>
                <div className="text-sm sm:text-base font-bold mb-1">
                  {item.title}
                </div>
                {item.description && (
                  <div className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (type === 'features_grid') {
    return (
      <section className="py-24 bg-slate-50 text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            {config.badge && (
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-4">
                <span>{config.badge}</span>
              </div>
            )}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
              {config.heading}
            </h2>
            {config.subheading && (
              <p className="text-base sm:text-lg text-slate-600">
                {config.subheading}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {config.items && config.items.map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 font-bold text-lg">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (type === 'faq') {
    return <FaqAccordion block={block} />;
  }

  if (type === 'video_embed') {
    return (
      <section className="py-24 bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            {config.heading}
          </h2>
          {config.subheading && (
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10">
              {config.subheading}
            </p>
          )}

          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl aspect-video bg-slate-900 max-w-4xl mx-auto flex items-center justify-center group">
            {config.videoUrl?.includes('youtube') || config.videoUrl?.includes('vimeo') ? (
              <iframe
                src={config.videoUrl}
                title={config.heading || 'Видео'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <img
                  src={config.imageUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80'}
                  alt={config.heading}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 ml-1" />
                  </div>
                </div>
              </>
            )}
          </div>
          {config.videoCaption && (
            <p className="text-xs sm:text-sm text-slate-500 mt-4">
              {config.videoCaption}
            </p>
          )}
        </div>
      </section>
    );
  }

  if (type === 'partners') {
    return (
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {config.heading && (
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 mb-8">
              {config.heading}
            </h3>
          )}
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
            {(config.partnerNames || (isUk 
              ? ['Федерація боксу', 'EventHub Global', 'EBA Europe', 'Riverside Park', 'Dnipro Steel', 'TechInvest'] 
              : ['Федерация бокса', 'EventHub Global', 'EBA Europe', 'Riverside Park', 'Dnipro Steel', 'TechInvest']
            )).map((p, idx) => (
              <span key={idx} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm tracking-tight border border-slate-200">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}

function FaqAccordion({ block }: { block: SiteBlock }) {
  const { isUk } = useSiteContent();
  const rawConfig = block.config;
  const config = (isUk && block.config_uk) ? { ...rawConfig, ...block.config_uk } : rawConfig;
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const items = config.faqItems || [];

  return (
    <section className="py-24 bg-slate-50 text-slate-900 border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            {config.heading || (isUk ? 'Часті запитання' : 'Часто задаваемые вопросы')}
          </h2>
          {config.subheading && (
            <p className="text-base sm:text-lg text-slate-600">
              {config.subheading}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center space-x-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {item.question}
                  </span>
                  <span className="shrink-0 text-slate-400">
                    {isOpen ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
