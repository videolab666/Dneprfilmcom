import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { onSnapshot } from 'firebase/firestore';
import { ArrowRight, Film, Images, Play } from 'lucide-react';
import { publishedGalleriesQuery, publishedVideoProjectsQuery } from '../../lib/publicPortfolioQueries';
import { ResponsiveImage } from '../ResponsiveImage';
import { useSiteContent } from '../../context/SiteContentContext';
import {
  galleryCover,
  getGalleryPath,
  isPhotoGallery,
  localizeGallery,
  sortGalleries,
  type PhotoGallery,
} from '../../lib/galleryContent';
import {
  getVideoProjectPath,
  isVideoProject,
  localizeVideoProject,
  sortVideoProjects,
  videoProjectCover,
  type VideoProject,
} from '../../lib/videoPortfolio';

export function PortfolioCrosslinks() {
  const location = useLocation();
  const { locale, l } = useSiteContent();
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const isPhotoPage = location.pathname === '/photo';
  const isVideoPage = location.pathname === '/video';

  useEffect(() => {
    if (!isPhotoPage && !isVideoPage) return;
    const unsubscribeGalleries = onSnapshot(publishedGalleriesQuery(), snapshot => {
      const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setGalleries(sortGalleries(docs.filter(isPhotoGallery)));
    }, error => console.warn('Could not load portfolio gallery crosslinks:', error));
    const unsubscribeVideos = onSnapshot(publishedVideoProjectsQuery(), snapshot => {
      const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setVideos(sortVideoProjects(docs.filter(isVideoProject)));
    }, error => console.warn('Could not load portfolio video crosslinks:', error));
    return () => { unsubscribeGalleries(); unsubscribeVideos(); };
  }, [isPhotoPage, isVideoPage]);

  const photoItems = useMemo(() => galleries.slice(0, 3).map(item => localizeGallery(item, locale)), [galleries, locale]);
  const videoItems = useMemo(() => videos.slice(0, 3).map(item => localizeVideoProject(item, locale)), [videos, locale]);

  if (!isPhotoPage && !isVideoPage) return null;

  if (isPhotoPage) {
    return (
      <section className="border-t border-slate-200 bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-300"><Images className="h-4 w-4" />{l('Повні фотосерії', 'Полные фотосерии', 'Full photo stories')}</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{l('Дивіться зйомки як окремі галереї', 'Смотрите съёмки как отдельные галереи', 'Browse shoots as complete galleries')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{l('На сторінці фотопослуг залишається коротка вітрина, а повні репортажі та серії зберігаються окремо.', 'На странице фотоуслуг остаётся короткая витрина, а полные репортажи и серии хранятся отдельно.', 'The service page stays concise while full reports and photo series live in dedicated galleries.')}</p>
            </div>
            <Link to="/galleries" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-indigo-50">{l('Усі фотогалереї', 'Все фотогалереи', 'All photo galleries')}<ArrowRight className="h-4 w-4" /></Link>
          </div>
          {photoItems.length > 0 && <div className="grid gap-5 md:grid-cols-3">{photoItems.map(item => { const cover = galleryCover(item); return <Link key={item.id} to={getGalleryPath(item)} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5"><div className="relative aspect-[4/3] overflow-hidden bg-slate-900">{cover ? <ResponsiveImage src={cover} alt={item.title} displayWidth={700} sizes="(max-width: 768px) 100vw, 33vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="absolute inset-0 bg-slate-900" />}<div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" /><div className="absolute bottom-3 left-3 right-3"><div className="text-sm font-black text-white">{item.title}</div><div className="mt-1 text-[11px] font-semibold text-slate-300">{item.images.length} {l('фото', 'фото', 'photos')}</div></div></div></Link>; })}</div>}
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600"><Film className="h-4 w-4" />Video Portfolio</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{l('Окремі відеопроєкти', 'Отдельные видеопроекты', 'Individual video projects')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{l('Повні ролики, тизери, Reels і додаткові версії тепер зібрані в окремому відеопортфоліо.', 'Полные ролики, тизеры, Reels и дополнительные версии теперь собраны в отдельном видеопортфолио.', 'Full cuts, teasers, Reels and alternate edits are now grouped in a dedicated video portfolio.')}</p>
          </div>
          <Link to="/videos" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-500">{l('Усе відеопортфоліо', 'Все видеопортфолио', 'Full video portfolio')}<ArrowRight className="h-4 w-4" /></Link>
        </div>
        {videoItems.length > 0 ? <div className="grid gap-5 md:grid-cols-3">{videoItems.map(item => { const cover = videoProjectCover(item); return <Link key={item.id} to={getVideoProjectPath(item)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="relative aspect-video overflow-hidden bg-slate-950">{cover ? <ResponsiveImage src={cover} alt={item.title} displayWidth={700} sizes="(max-width: 768px) 100vw, 33vw" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-950" />}<div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" /><span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 opacity-90"><Play className="ml-0.5 h-4 w-4 fill-current" /></span><div className="absolute bottom-3 left-3 right-3"><div className="text-sm font-black text-white">{item.title}</div><div className="mt-1 text-[11px] font-semibold text-slate-300">{item.client || item.category || `${item.videos.length} video`}</div></div></div></Link>; })}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">{l('Каталог готовий: нові відеопроєкти з’являться тут після публікації в адмінці.', 'Каталог готов: новые видеопроекты появятся здесь после публикации в админке.', 'The catalogue is ready; published video projects will appear here automatically.')}</div>}
      </div>
    </section>
  );
}
