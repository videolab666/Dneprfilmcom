import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSiteContent } from '../context/SiteContentContext';
import { contactsPageForLocale, normalizeContactsPage } from '../lib/contactsContent';
import type { ContactCardKind, ContactIconKey, ContactPageSectionId, ContactRightPanelId } from '../types';

const iconFor = (icon: ContactIconKey, className = 'w-5 h-5 text-indigo-600') => {
  if (icon === 'phone') return <Phone className={className} />;
  if (icon === 'mail') return <Mail className={className} />;
  if (icon === 'message') return <MessageSquare className={className} />;
  if (icon === 'globe') return <Globe2 className={className} />;
  if (icon === 'truck') return <Truck className={className} />;
  return <Building2 className={className} />;
};

const normalizeTelegram = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return { display: '@dneprfilm', href: 'https://t.me/dneprfilm' };
  if (/^https?:\/\//i.test(trimmed)) {
    const tail = trimmed.replace(/\/+$/, '').split('/').pop() || trimmed;
    return { display: tail.startsWith('@') ? tail : `@${tail}`, href: trimmed };
  }
  const handle = trimmed.replace(/^@/, '');
  return { display: `@${handle}`, href: `https://t.me/${handle}` };
};

const cardGlobalValue = (kind: ContactCardKind, settings: ReturnType<typeof useSiteContent>['settings']) => {
  if (kind === 'phone') {
    const display = settings.phone || '+380 (67) 560-68-80';
    return { display, href: `tel:+${display.replace(/\D/g, '')}` };
  }
  if (kind === 'email') {
    const display = settings.email || 'Dneprfilmcom@gmail.com';
    return { display, href: `mailto:${display}` };
  }
  if (kind === 'telegram') return normalizeTelegram(settings.telegram || '@dneprfilm');
  if (kind === 'whatsapp') {
    const display = settings.whatsapp || settings.phone || '+380675606880';
    return { display, href: `https://wa.me/${display.replace(/\D/g, '')}` };
  }
  return { display: '', href: '#' };
};

export function Contacts() {
  const { settings, rawSettings, locale } = useSiteContent();
  const page = useMemo(() => contactsPageForLocale(rawSettings, locale), [rawSettings, locale]);
  const layout = useMemo(() => normalizeContactsPage(rawSettings.contactsPage).layout, [rawSettings.contactsPage]);

  const firstService = page.form.services[0]?.id || 'LIVE';
  const firstPreferred = page.form.preferredContacts[0]?.id || 'telegram';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredContact, setPreferredContact] = useState(firstPreferred);
  const [service, setService] = useState(firstService);
  const [location, setLocation] = useState(page.form.defaultLocation);
  const [eventDate, setEventDate] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!page.form.services.some(item => item.id === service)) setService(firstService);
  }, [firstService, page.form.services, service]);

  useEffect(() => {
    if (!page.form.preferredContacts.some(item => item.id === preferredContact)) setPreferredContact(firstPreferred);
  }, [firstPreferred, page.form.preferredContacts, preferredContact]);

  useEffect(() => {
    setLocation(current => current || page.form.defaultLocation);
  }, [page.form.defaultLocation]);

  const phoneGlobal = cardGlobalValue('phone', settings);
  const telegramGlobal = cardGlobalValue('telegram', settings);
  const emailGlobal = cardGlobalValue('email', settings);

  const contactCards = page.contactCards.map(card => {
    const global = cardGlobalValue(card.kind, settings);
    return {
      ...card,
      value: card.valueOverride.trim() || global.display,
      href: card.hrefOverride.trim() || global.href,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg(page.form.requiredError);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addDoc(collection(db, 'leads'), {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        service,
        eventType: `${page.form.eventTypeLabel} (${service})`,
        location: location.trim(),
        cameraCount: page.form.cameraCountText,
        preferredContact,
        eventDate: eventDate || undefined,
        message: message.trim() || undefined,
        status: 'new',
        createdAt: Date.now(),
      });
      setIsSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
      setEventDate('');
    } catch (error) {
      console.error('Failed to submit contact lead:', error);
      setErrorMsg(page.form.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hero = (
    <section className="relative pt-32 pb-20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /><span>{page.hero.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {page.hero.title} <span className="text-indigo-400">{page.hero.accent || settings.studioName || 'Dneprfilm'}</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-light">{page.hero.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={phoneGlobal.href} className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all">
              <Phone className="w-4 h-4" /><span>{page.hero.phoneButtonPrefix} {phoneGlobal.display}</span>
            </a>
            <a href={telegramGlobal.href} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-md transition-all">
              <MessageSquare className="w-4 h-4" /><span>{page.hero.telegramButton}</span>
            </a>
            <a href={emailGlobal.href} className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-all">
              <Mail className="w-4 h-4" /><span>{emailGlobal.display}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );

  const channels = (
    <section className="-mt-10 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${contactCards.length >= 4 ? 'lg:grid-cols-4' : contactCards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
        {contactCards.map(card => (
          <a key={card.id} href={card.href} target={card.href.startsWith('http') ? '_blank' : undefined} rel={card.href.startsWith('http') ? 'noreferrer' : undefined} className="p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white shadow-sm transition-all hover:shadow-lg group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">{iconFor(card.icon, 'w-6 h-6 text-indigo-600')}</div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{card.badge}</span>
              </div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</h2>
              <div className="mt-1 text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors break-words">{card.value}</div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{card.subtitle}</span><ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );

  const formPanel = (
    <div className="lg:col-span-7">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm relative">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3"><FileText className="w-3.5 h-3.5" /><span>{page.form.badge}</span></div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{page.form.title}</h2>
        <p className="text-slate-600 text-sm mt-2">{page.form.description}</p>

        {isSuccess ? (
          <div className="mt-8 p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-xl font-black text-emerald-950">{page.form.successTitle}</h3>
            <p className="mt-2 text-sm text-emerald-800 max-w-md mx-auto">{page.form.successDescription}</p>
            <button type="button" onClick={() => setIsSuccess(false)} className="mt-6 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer">{page.form.successButton}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {errorMsg && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{errorMsg}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{page.form.nameLabel}</label><input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={page.form.namePlaceholder} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900" /></div>
              <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{page.form.phoneLabel}</label><input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder={page.form.phonePlaceholder} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900" /></div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{page.form.preferredContactLabel}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {page.form.preferredContacts.map(ch => <button key={ch.id} type="button" onClick={() => setPreferredContact(ch.id)} className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${preferredContact === ch.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{ch.label}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{page.form.serviceLabel}</label><select value={service} onChange={e => setService(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900">{page.form.services.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{page.form.locationLabel}</label><input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={page.form.locationPlaceholder} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{page.form.dateLabel}</label><input type="text" value={eventDate} onChange={e => setEventDate(e.target.value)} placeholder={page.form.datePlaceholder} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900" /></div>
              <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{page.form.emailLabel}</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={page.form.emailPlaceholder} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900" /></div>
            </div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{page.form.messageLabel}</label><textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder={page.form.messagePlaceholder} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-sm font-medium text-slate-900" /></div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center space-x-2 text-xs text-slate-500"><ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" /><span>{page.form.privacyText}</span></div>
              <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer">{isSubmitting ? <span>{page.form.submittingText}</span> : <><Send className="w-4 h-4" /><span>{page.form.submitText}</span></>}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  const rightPanels: Record<ContactRightPanelId, React.ReactNode> = {
    workingHours: (
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-4"><div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400"><Clock className="w-5 h-5" /></div><div><h3 className="text-base font-bold text-white">{page.workingHours.title}</h3><p className="text-xs text-slate-400">{page.workingHours.subtitle}</p></div></div>
        <div className="space-y-3 text-xs sm:text-sm">{page.workingHours.rows.map((row, index) => <div key={row.id} className={`flex justify-between gap-4 py-2 ${index < page.workingHours.rows.length - 1 ? 'border-b border-slate-800' : ''}`}><span className="text-slate-400">{row.label}</span><span className={`font-semibold text-right ${row.tone === 'indigo' ? 'text-indigo-300' : row.tone === 'emerald' ? 'text-emerald-400' : 'text-white'}`}>{row.value}</span></div>)}</div>
      </div>
    ),
    locations: (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-2"><MapPin className="w-5 h-5 text-indigo-600" /><h3 className="text-base font-bold text-slate-900">{page.locations.title}</h3></div>
        <div className="space-y-4">{page.locations.items.map(loc => {
          const body = <><div className="flex items-start justify-between gap-3"><div className="flex items-center space-x-2">{iconFor(loc.icon)}<span className="font-bold text-slate-900 text-sm">{loc.city}</span></div><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">{loc.type}</span></div><div className="text-xs font-semibold text-indigo-600 flex items-center gap-1">{loc.address}{loc.mapUrl && <ExternalLink className="w-3 h-3" />}</div><p className="text-xs text-slate-500 leading-relaxed">{loc.description}</p></>;
          return loc.mapUrl ? <a key={loc.id} href={loc.mapUrl} target="_blank" rel="noreferrer" className="block p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 hover:border-indigo-200 transition-colors">{body}</a> : <div key={loc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">{body}</div>;
        })}</div>
      </div>
    ),
    legal: (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /><h3 className="text-base font-bold text-slate-900">{page.legal.title}</h3></div>
        <ul className="space-y-2.5 text-xs text-slate-600">{page.legal.items.map(item => <li key={item.id} className="flex items-start space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><span><strong>{item.title}</strong>{item.description}</span></li>)}</ul>
      </div>
    ),
  };

  const main = (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {layout.mainEnabled.form && formPanel}
        {(layout.mainEnabled.workingHours || layout.mainEnabled.locations || layout.mainEnabled.legal) && (
          <div className={`${layout.mainEnabled.form ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-6`}>
            {layout.rightPanelOrder.filter(id => layout.mainEnabled[id]).map(id => <React.Fragment key={id}>{rightPanels[id]}</React.Fragment>)}
          </div>
        )}
      </div>
    </section>
  );

  const faq = (
    <section className="py-16 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10"><h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{page.faq.title}</h2><p className="mt-2 text-sm text-slate-600">{page.faq.subtitle}</p></div>
        <div className="space-y-3">{page.faq.items.map((item, index) => <div key={item.id} className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50"><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-indigo-600 transition-colors"><span>{item.question}</span><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${openFaq === index ? 'rotate-180 text-indigo-600' : ''}`} /></button>{openFaq === index && <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">{item.answer}</div>}</div>)}</div>
      </div>
    </section>
  );

  const sections: Record<ContactPageSectionId, React.ReactNode> = { hero, channels, main, faq };

  return <div className="bg-slate-50 min-h-screen">{layout.sectionOrder.filter(id => layout.sectionEnabled[id]).map(id => <React.Fragment key={id}>{sections[id]}</React.Fragment>)}</div>;
}
