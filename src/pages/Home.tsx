import { Link } from 'react-router-dom';
import { Camera, Radio, Building2, Video, Play, ArrowRight } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import { PageBuilderSlot } from '../components/page-builder/PageBuilderSlot';
import { FeaturedCases } from '../components/home/FeaturedCases';
import { SynergyBenefits } from '../components/home/SynergyBenefits';
import { HowWeWork } from '../components/home/HowWeWork';
import { BackstageGallery } from '../components/home/BackstageGallery';
import { Testimonials } from '../components/home/Testimonials';
import { QuickContactCTA } from '../components/home/QuickContactCTA';
import { ClientsMarquee } from '../components/ClientsMarquee';
import { HeroSlider } from '../components/home/HeroSlider';

export function Home() {
  const { settings, t, l } = useSiteContent();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <HeroSlider />

      {/* Clients & Partners Infinite Marquee Strip */}
      <ClientsMarquee />

      {/* Directions Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{t('home.directionsTitle')}</h2>
            <p className="mt-4 text-lg text-slate-600">
              {t('home.directionsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-slate-50 rounded-3xl p-7 hover:bg-indigo-50 transition-colors duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-5 group-hover:scale-110 transition-transform">
                  <Radio className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t('nav.live')}</h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 mb-6">
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-indigo-500 shrink-0" /> {t('live.liveSports')}</li>
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-indigo-500 shrink-0" /> {t('live.conferences')}</li>
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-indigo-500 shrink-0" /> {t('live.vmixStarlink')}</li>
                </ul>
              </div>
              <Link to="/live" className="text-indigo-600 font-semibold text-sm flex items-center hover:text-indigo-700">
                {t('home.more')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="group bg-slate-50 rounded-3xl p-7 hover:bg-purple-50 transition-colors duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-5 group-hover:scale-110 transition-transform">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t('nav.video')}</h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 mb-6">
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-purple-500 shrink-0" /> {t('video.imageAds')}</li>
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-purple-500 shrink-0" /> {t('video.factories')}</li>
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-purple-500 shrink-0" /> {t('video.podcasts')}</li>
                </ul>
              </div>
              <Link to="/video" className="text-purple-600 font-semibold text-sm flex items-center hover:text-purple-700">
                {t('home.more')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="group bg-slate-50 rounded-3xl p-7 hover:bg-amber-50 transition-colors duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t('nav.construction')}</h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 mb-6">
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-amber-500 shrink-0" /> {t('construction.timelapse')}</li>
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-amber-500 shrink-0" /> {t('construction.drone')}</li>
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-amber-500 shrink-0" /> {t('construction.views3d')}</li>
                </ul>
              </div>
              <Link to="/construction" className="text-amber-600 font-semibold text-sm flex items-center hover:text-amber-700">
                {t('home.more')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="group bg-slate-50 rounded-3xl p-7 hover:bg-emerald-50 transition-colors duration-300 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t('nav.photo')}</h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 mb-6">
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-emerald-500 shrink-0" /> {t('photo.interiors')}</li>
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-emerald-500 shrink-0" /> {t('photo.food')}</li>
                  <li className="flex items-center"><Play className="w-3.5 h-3.5 mr-2 text-emerald-500 shrink-0" /> {t('photo.events')}</li>
                </ul>
              </div>
              <Link to="/photo" className="text-emerald-600 font-semibold text-sm flex items-center hover:text-emerald-700">
                {t('home.more')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] lg:aspect-square">
              <img
                src={settings.founderPhoto || "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80"}
                alt={settings.founderName || l("Олександр Пітель", "Александр Питель")}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
                <span>{settings.founderRole || l("Засновник студії", "Основатель студии", "Studio founder")}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">{settings.founderName || l("Олександр Пітель", "Александр Питель")}</h2>
              <p className="text-xl text-slate-300 mb-8 font-light leading-relaxed">"{settings.founderQuote}"</p>
              <div className="space-y-4 text-slate-400 mb-10 text-sm sm:text-base leading-relaxed"><p>{settings.founderBio}</p></div>
              <div className="flex flex-wrap gap-4">
                <Link to="/about" className="inline-flex items-center justify-center px-6 py-3 border border-white/20 rounded-full text-base font-medium text-white hover:bg-white/10 transition-colors">{t('home.aboutFounderBtn')}</Link>
                <a href="#contact-cta" className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-base font-medium text-white transition-colors">{t('home.discussPersonally')}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturedCases />
      <SynergyBenefits />
      <HowWeWork />

      {/* Unified Page Builder preserves the historical Home insertion point. */}
      <PageBuilderSlot page="home" placement="inline" />

      <BackstageGallery />
      <Testimonials />
      <QuickContactCTA />
    </div>
  );
}
