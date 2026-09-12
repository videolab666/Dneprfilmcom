import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, CalendarDays, Film, MapPin, Tag } from 'lucide-react';
import { db } from '../lib/firebase';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { VideoProjectPlayer } from '../components/videos/VideoProjectPlayer';
import {
  VIDEO_PROJECT_COLLECTION,
  getVideoProjectSlug,
  isVideoProject,
  localizeVideoProject,
  videoEmbedUrl,
  videoMediaPoster,
  videoProjectCover,
  type VideoProject,
} from '../lib/videoPortfolio';
import { useSiteContent } from '../context/SiteContentContext';

function formatDate(value: string | undefined, locale: 'uk' | 'ru' | 'en'): string {
  if (!value) return '';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  const language = locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

export function VideoDetail() {
  const { slug = '' } = useParams();
  const { locale, l } = useSiteContent();
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const unsubscribe = onSnapshot(collection(db, VIDEO_PROJECT_COLLECTION), snapshot => {
      const loaded = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
        .filter(isVideoProject);
      setProjects(loaded);
      setLoading(false);
    }, error => {
      console.warn('Could not load video project:', error);
      setProjects([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [slug]);

  const rawProject = useMemo(() => {
    const decoded = decodeURIComponent(slug);
    return projects.find(item => item.published !== false && (getVideoProjectSlug(item) === decoded || item.id === decoded)) || null;
  }, [projects, slug]);

  const project = rawProject ? localizeVideoProject(rawProject, locale) : null;
  const cover = project ? videoProjectCover(project) : '';
  const dateLabel = project ? formatDate(project.date, locale) : '';

  useEffect(() => {
    if (!project) return;
    const title = `${project.title} — Dneprfilm`;
    const description = (project.description || project.result || '').slice(0, 220);
    document.title = title;

    const setMeta = (selector: string, attr: string, attrValue: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-video-preview:-1');
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'video.other');
    if (cover) setMeta('meta[property="og:image"]', 'property', 'og:image', cover);

    const previous = document.getElementById('video-project-jsonld');
    previous?.remove();
    const videos = (project.videos || []).map(media => {
      const embed = videoEmbedUrl(media);
      const poster = videoMediaPoster(media) || cover;
      return {
        '@type': 'VideoObject',
        name: media.title || project.title,
        description: media.caption || project.description || project.title,
        thumbnailUrl: poster ? [poster] : undefined,
        uploadDate: project.date || undefined,
        embedUrl: embed || undefined,
        contentUrl: media.type === 'video' ? media.url : undefined,
      };
    });
    const script = document.createElement('script');
    script.id = 'video-project-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: project.title,
      itemListElement: videos.map((video, index) => ({ '@type': 'ListItem', position: index + 1, item: video })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [project, cover]);

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-b-indigo-600" /></div>;
  }

  if (!project) {
    return (
      <section className="min-h-[70vh] bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Film className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-3xl font-black text-slate-950">{l('Відеопроєкт не знайдено', 'Видеопроект не найден', 'Video project not found')}</h1>
          <Link to="/videos" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500"><ArrowLeft className="h-4 w-4" />{l('До відеопортфоліо', 'К видеопортфолио', 'Back to video portfolio')}</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {cover && (
          <div className="absolute inset-0">
            <ResponsiveImage src={cover} alt="" displayWidth={2000} sizes="100vw" loading="eager" className="h-full w-full object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <Link to="/videos" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" />{l('Усі відеопроєкти', 'Все видеопроекты', 'All video projects')}</Link>
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {project.category && <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">{project.category}</span>}
              {project.featured && <span className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950">FEATURED</span>}
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{project.title}</h1>
            {project.client && <div className="mt-4 text-lg font-bold text-indigo-300">{project.client}</div>}
            {project.description && <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-xl">{project.description}</p>}
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-300">
              {dateLabel && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{dateLabel}</span>}
              {project.location && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{project.location}</span>}
              <span className="inline-flex items-center gap-2"><Film className="h-4 w-4" />{project.videos.length} {l('відео', 'видео', 'videos')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            {project.videos.length > 0 ? project.videos.map(media => (
              <VideoProjectPlayer key={media.id} media={media} projectTitle={project.title} />
            )) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">{l('Відео ще не додано.', 'Видео ещё не добавлено.', 'No videos have been added yet.')}</div>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            {(project.tags || []).length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-600"><Tag className="h-4 w-4" />{l('Формати та технології', 'Форматы и технологии', 'Formats & technology')}</div>
                <div className="mt-4 flex flex-wrap gap-2">{(project.tags || []).map(tag => <span key={tag} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">{tag}</span>)}</div>
              </div>
            )}
            {project.result && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{l('Результат', 'Результат', 'Result')}</div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{project.result}</p>
              </div>
            )}
            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-indigo-300">{l('Потрібне схоже відео?', 'Нужно похожее видео?', 'Need a similar video?')}</div>
              <h2 className="mt-2 text-xl font-black">{l('Обговоримо ваш проєкт', 'Обсудим ваш проект', 'Discuss your project')}</h2>
              <Link to="/contacts" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500">{l('Зв’язатися', 'Связаться', 'Contact us')}<ArrowRight className="h-4 w-4" /></Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
