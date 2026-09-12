import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Video, Sparkles, ArrowRight, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useSiteContent } from '../../context/SiteContentContext';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { settings, t, l, locale, setLocale } = useSiteContent();

  const navLinks = [
    { name: t('nav.live'), path: '/live' },
    { name: t('nav.video'), path: '/video' },
    { name: t('nav.construction'), path: '/construction' },
    { name: t('nav.photo'), path: '/photo' },
    { name: l('Галереї', 'Галереи', 'Galleries'), path: '/galleries' },
    { name: t('nav.cases'), path: '/cases' },
    { name: t('nav.mediaCenter'), path: '/media-center' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.contacts'), path: '/contacts' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      {/* Dynamic Announcement Bar if enabled */}
      {settings.announcementEnabled && settings.announcementText && (
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>{settings.announcementText}</span>
          {settings.announcementLink && (
            <Link to={settings.announcementLink} className="underline hover:text-indigo-200 ml-1 inline-flex items-center">
              {t('announcement.details')} <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-indigo-600" />
            <span className="font-bold text-xl tracking-tight text-slate-900">
              {settings.studioName || 'LIVE & VIDEO'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-4 xl:space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-indigo-600",
                  location.pathname === link.path ? "text-indigo-600" : "text-slate-600"
                )}
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <Link to="/admin" className="text-sm font-medium text-amber-600 hover:text-amber-700">
                {t('nav.admin')}
              </Link>
            )}
          </nav>

          <div className="hidden lg:flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLocale('uk')}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-all duration-200",
                  locale === 'uk'
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Українська"
              >
                UA
              </button>
              <button
                type="button"
                onClick={() => setLocale('ru')}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-all duration-200",
                  locale === 'ru'
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Русский"
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-all duration-200",
                  locale === 'en'
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="English"
              >
                EN
              </button>
            </div>

            <Link
              to="/contacts"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              {t('nav.discussProject')}
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center space-x-2 lg:hidden">
            {/* Mobile Language Switcher */}
            <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200 text-xs font-bold mr-1">
              <button
                type="button"
                onClick={() => setLocale('uk')}
                className={cn(
                  "px-2 py-0.5 rounded-full transition-all",
                  locale === 'uk' ? "bg-indigo-600 text-white" : "text-slate-600"
                )}
              >
                UA
              </button>
              <button
                type="button"
                onClick={() => setLocale('ru')}
                className={cn(
                  "px-2 py-0.5 rounded-full transition-all",
                  locale === 'ru' ? "bg-indigo-600 text-white" : "text-slate-600"
                )}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={cn(
                  "px-2 py-0.5 rounded-full transition-all",
                  locale === 'en' ? "bg-indigo-600 text-white" : "text-slate-600"
                )}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none p-2"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-base font-medium",
                location.pathname === link.path
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {link.name}
            </Link>
          ))}
          {user && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-amber-600 hover:bg-amber-50"
            >
              {t('nav.adminDashboard')}
            </Link>
          )}
          <div className="pt-4">
            <Link
              to="/contacts"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {t('nav.discussProject')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
