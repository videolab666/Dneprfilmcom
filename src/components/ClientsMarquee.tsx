import React, { useState } from 'react';
import { 
  Building2, 
  Factory, 
  Flame, 
  HeartPulse, 
  Trophy, 
  ShoppingBag, 
  Sparkles, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  LayoutGrid,
  SlidersHorizontal,
  Quote
} from 'lucide-react';
import { CLIENTS_LIST, CLIENT_STATS, ClientLogo } from '../data/clientsData';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext';

interface ClientsMarqueeProps {
  showTitle?: boolean;
  showStats?: boolean;
  showFilterToggle?: boolean;
  variant?: 'light' | 'dark';
}

export function ClientsMarquee({
  showTitle = true,
  showStats = true,
  showFilterToggle = true,
  variant = 'light'
}: ClientsMarqueeProps) {
  const { isUk, t } = useSiteContent();
  const [selectedClient, setSelectedClient] = useState<ClientLogo | null>(null);
  const [viewMode, setViewMode] = useState<'marquee' | 'grid'>('marquee');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const filteredClients = selectedIndustry === 'all'
    ? CLIENTS_LIST
    : CLIENTS_LIST.filter(c => c.industry === selectedIndustry);

  // Split into 2 rows for rich dual-speed marquee
  const row1 = CLIENTS_LIST.slice(0, 6);
  const row2 = CLIENTS_LIST.slice(6);

  const getIndustryIcon = (industry: ClientLogo['industry']) => {
    switch (industry) {
      case 'industry':
        return <Factory className="w-3.5 h-3.5" />;
      case 'construction':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'medical':
        return <HeartPulse className="w-3.5 h-3.5" />;
      case 'sport':
        return <Trophy className="w-3.5 h-3.5" />;
      case 'commercial':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'events':
        return <Flame className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  const isDark = variant === 'dark';

  return (
    <div className={`relative overflow-hidden py-14 lg:py-20 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50/70 border-y border-slate-200/80'}`}>
      
      {/* Container Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        {showTitle && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('clients.badge')}</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('clients.title')}
              </h2>
              <p className={`mt-2 text-sm sm:text-base max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('clients.subtitle')}
              </p>
            </div>

            {/* Mode Toggle Button (Marquee vs Grid) */}
            {showFilterToggle && (
              <div className="flex items-center space-x-2 self-start md:self-auto bg-slate-200/80 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('marquee')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    viewMode === 'marquee'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{t('clients.marqueeTab')}</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{t('clients.catalogTab')} ({CLIENTS_LIST.length})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats Strip */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-200/80">
            {CLIENT_STATS.map((stat, idx) => (
              <div key={idx} className="p-3 sm:p-4 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-indigo-600">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 font-medium">
                  {isUk ? (stat.labelUk || stat.label) : stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: INFINITE LOGO TICKER / MARQUEE */}
      {viewMode === 'marquee' ? (
        <div className="relative w-full space-y-4">
          
          {/* Gradient Edge Masks */}
          <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-24 sm:w-40 z-10 bg-gradient-to-r ${isDark ? 'from-slate-900' : 'from-slate-50/90'} to-transparent`}></div>
          <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-24 sm:w-40 z-10 bg-gradient-to-l ${isDark ? 'from-slate-900' : 'from-slate-50/90'} to-transparent`}></div>

          {/* Row 1: Leftward Marquee */}
          <div className="flex overflow-hidden group">
            <div className="animate-marquee flex items-center space-x-4 pr-4">
              {/* Duplicate array for seamless infinite looping */}
              {[...row1, ...row1, ...row1].map((client, idx) => (
                <button
                  key={`${client.id}-r1-${idx}`}
                  onClick={() => setSelectedClient(client)}
                  className="group/card flex items-center space-x-3.5 px-5 py-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-400/60 transition-all text-left shrink-0 cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${client.primaryColor} flex items-center justify-center text-white font-black text-xs shadow-xs group-hover/card:scale-105 transition-transform`}>
                    {client.shortName.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover/card:text-indigo-600 transition-colors flex items-center">
                      <span>{client.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover/card:text-indigo-500 ml-1 transition-transform group-hover/card:translate-x-0.5" />
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                      <span className={client.accentColor}>{getIndustryIcon(client.industry)}</span>
                      <span>{isUk ? (client.industryLabelUk || client.industryLabel) : client.industryLabel}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Rightward (Reverse) Marquee */}
          <div className="flex overflow-hidden group">
            <div className="animate-marquee-reverse flex items-center space-x-4 pr-4">
              {[...row2, ...row2, ...row2].map((client, idx) => (
                <button
                  key={`${client.id}-r2-${idx}`}
                  onClick={() => setSelectedClient(client)}
                  className="group/card flex items-center space-x-3.5 px-5 py-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-400/60 transition-all text-left shrink-0 cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${client.primaryColor} flex items-center justify-center text-white font-black text-xs shadow-xs group-hover/card:scale-105 transition-transform`}>
                    {client.shortName.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover/card:text-indigo-600 transition-colors flex items-center">
                      <span>{client.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover/card:text-indigo-500 ml-1 transition-transform group-hover/card:translate-x-0.5" />
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                      <span className={client.accentColor}>{getIndustryIcon(client.industry)}</span>
                      <span>{isUk ? (client.industryLabelUk || client.industryLabel) : client.industryLabel}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Instruction hint under ticker */}
          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-400 font-medium">
              {t('clients.hint')}
            </span>
          </div>

        </div>
      ) : (
        /* VIEW 2: FILTERABLE CLIENT GRID */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              onClick={() => setSelectedIndustry('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedIndustry === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('clients.allIndustries')} ({CLIENTS_LIST.length})
            </button>
            <button
              onClick={() => setSelectedIndustry('industry')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedIndustry === 'industry'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('clients.industry')}
            </button>
            <button
              onClick={() => setSelectedIndustry('construction')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedIndustry === 'construction'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('clients.construction')}
            </button>
            <button
              onClick={() => setSelectedIndustry('medical')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedIndustry === 'medical'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('clients.medical')}
            </button>
            <button
              onClick={() => setSelectedIndustry('sport')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedIndustry === 'sport'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('clients.sport')}
            </button>
            <button
              onClick={() => setSelectedIndustry('commercial')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedIndustry === 'commercial'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('clients.commercial')}
            </button>
            <button
              onClick={() => setSelectedIndustry('events')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedIndustry === 'events'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {t('clients.events')}
            </button>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${client.primaryColor} flex items-center justify-center text-white font-black text-sm shadow-xs`}>
                      {client.shortName.slice(0, 3)}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                      <span className="mr-1">{getIndustryIcon(client.industry)}</span>
                      {isUk ? (client.industryLabelUk || client.industryLabel) : client.industryLabel}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {client.name}
                  </h3>

                  <div className="mt-2 text-xs font-medium text-slate-700">
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider">{t('clients.project')}</span>
                    {isUk ? (client.workDoneUk || client.workDone) : client.workDone}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    <span className="text-slate-400 block text-[11px] uppercase tracking-wider">{t('clients.scope')}</span>
                    {isUk ? (client.scopeUk || client.scope) : client.scope}
                  </div>
                </div>

                {client.quote && (
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs italic text-slate-600 line-clamp-2">
                    {isUk ? (client.quoteUk || client.quote) : client.quote}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>{t('clients.details')}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* DETAIL MODAL FOR CLICKED CLIENT */}
      {selectedClient && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedClient(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedClient.primaryColor} flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0`}>
                {selectedClient.shortName.slice(0, 3)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {selectedClient.name}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-indigo-600">
                    {isUk ? (selectedClient.industryLabelUk || selectedClient.industryLabel) : selectedClient.industryLabel}
                  </span>
                  <span>•</span>
                  <span>
                    {isUk ? (selectedClient.locationUk || selectedClient.location) : selectedClient.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t('clients.doneBy')}
                </span>
                <p className="font-semibold text-slate-900">
                  {isUk ? (selectedClient.workDoneUk || selectedClient.workDone) : selectedClient.workDone}
                </p>
                <p className="text-slate-600 mt-1">
                  {isUk ? (selectedClient.scopeUk || selectedClient.scope) : selectedClient.scope}
                </p>
              </div>

              {selectedClient.quote && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-950">
                  <Quote className="w-4 h-4 text-indigo-400 mb-1" />
                  <p className="italic text-xs sm:text-sm leading-relaxed">
                    {isUk ? (selectedClient.quoteUk || selectedClient.quote) : selectedClient.quote}
                  </p>
                  {(selectedClient.quoteAuthor || selectedClient.quoteAuthorUk) && (
                    <div className="text-[11px] font-bold text-indigo-700 mt-2 text-right">
                      — {isUk ? (selectedClient.quoteAuthorUk || selectedClient.quoteAuthor) : selectedClient.quoteAuthor}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              {selectedClient.associatedCaseId ? (
                <Link
                  to="/cases"
                  onClick={() => setSelectedClient(null)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  <span>{t('clients.viewCase')}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              ) : (
                <div className="text-xs text-slate-400">
                  {t('clients.nda')}
                </div>
              )}

              <button
                onClick={() => setSelectedClient(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors text-center cursor-pointer"
              >
                {t('clients.close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
