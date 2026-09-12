import { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { ResponsiveImage } from '../ResponsiveImage';
import {
  videoAspectClass,
  videoEmbedUrl,
  videoMediaPoster,
  type VideoProjectMedia,
} from '../../lib/videoPortfolio';
import { useSiteContent } from '../../context/SiteContentContext';

interface VideoProjectPlayerProps {
  media: VideoProjectMedia;
  projectTitle: string;
}

export function VideoProjectPlayer({ media, projectTitle }: VideoProjectPlayerProps) {
  const { l } = useSiteContent();
  const [playing, setPlaying] = useState(false);
  const embedUrl = videoEmbedUrl(media);
  const poster = videoMediaPoster(media);
  const aspect = videoAspectClass(media.format);
  const label = media.title || projectTitle;

  if (media.type === 'video') {
    return (
      <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm">
        <div className={`${aspect} mx-auto w-full overflow-hidden bg-black`}>
          <video
            src={media.url}
            poster={poster || undefined}
            controls
            preload="metadata"
            playsInline
            className="h-full w-full object-contain"
          />
        </div>
        {(media.title || media.caption) && (
          <figcaption className="border-t border-white/10 bg-slate-950 px-5 py-4 text-white">
            {media.title && <div className="text-sm font-bold">{media.title}</div>}
            {media.caption && <div className="mt-1 text-xs leading-relaxed text-slate-400">{media.caption}</div>}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm">
      <div className={`${aspect} relative mx-auto w-full overflow-hidden bg-slate-950`}>
        {playing && embedUrl ? (
          <iframe
            src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
            title={label}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden text-white"
            aria-label={l('Відтворити відео', 'Воспроизвести видео', 'Play video')}
          >
            {poster ? (
              <ResponsiveImage
                src={poster}
                alt={label}
                displayWidth={1200}
                sizes="(max-width: 1024px) 100vw, 900px"
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-75"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-950 to-slate-900" />
            )}
            <div className="absolute inset-0 bg-black/25" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-950 shadow-2xl transition duration-300 group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 fill-current" />
            </span>
          </button>
        )}
      </div>
      {(media.title || media.caption) && (
        <figcaption className="border-t border-white/10 bg-slate-950 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              {media.title && <div className="text-sm font-bold">{media.title}</div>}
              {media.caption && <div className="mt-1 text-xs leading-relaxed text-slate-400">{media.caption}</div>}
            </div>
            <a href={media.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-500 transition hover:text-white" aria-label={l('Відкрити оригінал', 'Открыть оригинал', 'Open original')}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </figcaption>
      )}
    </figure>
  );
}
