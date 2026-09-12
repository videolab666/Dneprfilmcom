import { Link } from 'react-router-dom';
import { Video, Mail, Phone, MapPin } from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';

export function Footer() {
  const { settings, t, l } = useSiteContent();

  return (
    <footer className="bg-slate-900 text-slate-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <Video className="h-6 w-6 text-indigo-400" />
              <span className="font-bold text-xl tracking-tight">
                {settings.studioName || 'LIVE & VIDEO'}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('footer.desc')}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.directions')}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/live" className="hover:text-white transition-colors">{t('nav.live')}</Link></li>
              <li><Link to="/video" className="hover:text-white transition-colors">{t('nav.video')}</Link></li>
              <li><Link to="/videos" className="hover:text-white transition-colors">{l('Відеопортфоліо', 'Видеопортфолио', 'Video portfolio')}</Link></li>
              <li><Link to="/construction" className="hover:text-white transition-colors">{t('nav.construction')}</Link></li>
              <li><Link to="/photo" className="hover:text-white transition-colors">{t('nav.photo')}</Link></li>
              <li><Link to="/galleries" className="hover:text-white transition-colors">{l('Фотогалереї', 'Фотогалереи', 'Photo galleries')}</Link></li>
              <li><Link to="/cases" className="hover:text-white transition-colors">{t('nav.cases')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.company')}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/contacts" className="hover:text-white transition-colors">{t('footer.requisites')}</Link></li>
              <li><Link to="/media-center" className="hover:text-white transition-colors">{t('nav.mediaCenter')}</Link></li>
              <li><Link to="/admin/login" className="hover:text-white transition-colors">{t('footer.authorLogin')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contacts')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-indigo-400 shrink-0" />
                <a href={`tel:${settings.phone || '+380675606880'}`} className="hover:text-white transition-colors font-medium">
                  {settings.phone || '+380 (67) 560-68-80'}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-indigo-400 shrink-0" />
                <a href={`mailto:${settings.email || 'Dneprfilmcom@gmail.com'}`} className="hover:text-white transition-colors">
                  {settings.email || 'Dneprfilmcom@gmail.com'}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-indigo-400 shrink-0" />
                <span className="text-slate-400 leading-snug">
                  {settings.address || t('footer.address')}
                </span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center space-x-3 text-xs">
              <a 
                href={settings.telegram ? `https://t.me/${settings.telegram.replace('@', '')}` : 'https://t.me/dneprfilm'} 
                target="_blank" 
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-slate-800 text-sky-400 hover:bg-slate-700 transition-colors font-medium"
              >
                Telegram
              </a>
              <a 
                href={settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}` : 'https://wa.me/380675606880'} 
                target="_blank" 
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors font-medium"
              >
                WhatsApp
              </a>
            </div>
          </div>

        </div>
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} {settings.studioName || 'LIVE & VIDEO'} Production. {t('footer.rightsReserved')}</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            {settings.youtubeUrl && (
              <a href={settings.youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                YouTube
              </a>
            )}
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                Instagram
              </a>
            )}
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                Facebook
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
