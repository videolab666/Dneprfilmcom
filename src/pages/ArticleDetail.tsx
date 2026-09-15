import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, Clock, Copy, Share2, User } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { DEFAULT_ARTICLES, localizeArticle, normalizeArticle } from '../lib/articleCms';
import { loadPrerenderPortfolioEntry } from '../lib/prerenderContent';
import { resolveSeoOverrides } from '../lib/seoOverrides';
import {
  applyDetailSeo,
  breadcrumbJsonLd,
  canonicalUrlForPath,
  removeCanonical,
  removeJsonLd,
  toIsoDate,
  upsertMeta,
} from '../lib/seo';
import type { Article } from '../types';
import { useSiteContent } from '../context/SiteContentContext';
import { ArticleRelatedContent } from '../components/article/ArticleRelatedContent';

interface LoadedArticle {
  article: Article;
  raw: Record<string, unknown>;
}

function setSeoState(state: 'loading' | 'resolved' | 'missing' | 'error') {
  if (typeof document !== 'undefined') document.documentElement.dataset.portfolioSeoState = state;
}

function organizationId(): string {
  return `${canonicalUrlForPath('/').replace(/\/$/, '')}/#organization`;
}

export function ArticleDetail() {
  const { slug = '' } = useParams();
  const { locale, l } = useSiteContent();
  const [loaded, setLoaded] = useState<LoadedArticle | null>(null);
  const [resolved, setResolved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setResolved(false);
    setLoaded(null);
    setSeoState('loading');
    upsertMeta('meta[name="robots"]', { name: 'robots' }, 'noindex, follow');
    removeCanonical();
    removeJsonLd('detail-seo-jsonld');

    const run = async () => {
      const decoded = decodeURIComponent(slug);
      try {
        const prerender = await loadPrerenderPortfolioEntry('article', decoded);
        if (prerender?.source === 'article') {
          const article = normalizeArticle(prerender.id, prerender.data);
          if (!cancelled && article.published && article.slug === decoded) setLoaded({ article, raw: prerender.data });
          return;
        }

        const snapshot = await getDocs(query(collection(db, 'articles'), where('published', '==', true)));
        const records = snapshot.docs.map(item => ({
          article: normalizeArticle(item.id, item.data()),
          raw: item.data() as Record<string, unknown>,
        }));
        const found = records.find(item => item.article.published && item.article.slug === decoded) || null;
        const fallback = snapshot.empty
          ? DEFAULT_ARTICLES
              .map(article => ({ article, raw: article as unknown as Record<string, unknown> }))
              .find(item => item.article.slug === decoded) || null
          : null;
        if (!cancelled) setLoaded(found || fallback);
      } catch (error) {
        console.warn('Could not resolve article detail:', error);
        if (!cancelled) setSeoState('error');
      } finally {
        if (!cancelled) setResolved(true);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [slug]);

  const localized = useMemo(() => loaded ? localizeArticle(loaded.article, locale) : null, [loaded, locale]);

  useEffect(() => {
    if (!resolved) return;
    if (!loaded || !localized) {
      if (document.documentElement.dataset.portfolioSeoState !== 'error') setSeoState('missing');
      upsertMeta('meta[name="robots"]', { name: 'robots' }, 'noindex, nofollow, noarchive');
      removeCanonical();
      removeJsonLd('detail-seo-jsonld');
      return;
    }

    const article = loaded.article;
    const seo = resolveSeoOverrides(loaded.raw, locale);
    const title = seo.title || localized.title;
    const description = seo.description || localized.summary || localized.content[0] || localized.title;
    const image = seo.socialImage || article.coverImage;
    const path = `/media-center/${encodeURIComponent(article.slug)}`;
    const canonical = canonicalUrlForPath(path);
    const datePublished = toIsoDate(article.publishedAt || article.createdAt);
    const dateModified = toIsoDate(article.updatedAt || article.publishedAt || article.createdAt);
    const authorName = localized.author || (locale === 'en' ? 'Oleksandr Pitel' : locale === 'uk' ? 'Олександр Пітель' : 'Александр Питель');
    const homeName = locale === 'en' ? 'Home' : locale === 'uk' ? 'Головна' : 'Главная';
    const mediaCenterName = locale === 'en' ? 'Media Center' : locale === 'uk' ? 'Медіацентр' : 'Медиацентр';

    const articleJsonLd = {
      '@type': ['Article', 'BlogPosting'],
      '@id': `${canonical}#article`,
      url: canonical,
      headline: title,
      name: title,
      description,
      ...(image ? { image: [image] } : {}),
      ...(datePublished ? { datePublished } : {}),
      ...(dateModified ? { dateModified } : {}),
      author: { '@type': 'Person', name: authorName },
      publisher: { '@id': organizationId() },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      articleSection: localized.categoryLabel,
      inLanguage: locale,
    };
    const breadcrumb = breadcrumbJsonLd([
      { name: homeName, path: '/' },
      { name: mediaCenterName, path: '/media-center' },
      { name: title, path },
    ]);

    setSeoState('resolved');
    return applyDetailSeo({
      title: title.includes('Dneprfilm') ? title : `${title} — Dneprfilm`,
      description,
      path,
      image,
      imageAlt: localized.title,
      ogType: 'article',
      datePublished,
      dateModified,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [articleJsonLd, { ...breadcrumb, '@context': undefined }],
      },
    });
  }, [resolved, loaded, localized, locale]);

  const share = async () => {
    if (!loaded || !localized) return;
    const url = canonicalUrlForPath(`/media-center/${encodeURIComponent(loaded.article.slug)}`);
    if (navigator.share) {
      try { await navigator.share({ title: localized.title, url }); } catch { /* user cancelled */ }
      return;
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (!resolved) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">{l('Завантаження статті…', 'Загрузка статьи…', 'Loading article…')}</div>;
  }

  if (!loaded || !localized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-black text-slate-900">{l('Статтю не знайдено', 'Статья не найдена', 'Article not found')}</h1>
        <Link to="/media-center" className="mt-5 inline-flex items-center gap-2 text-indigo-700 font-bold"><ArrowLeft className="w-4 h-4" />{l('До медіацентру', 'В медиацентр', 'Back to Media Center')}</Link>
      </div>
    );
  }

  const article = loaded.article;
  return (
    <article className="bg-white min-h-screen text-slate-900">
      <header className="bg-slate-950 text-white pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/media-center" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-300 hover:text-white"><ArrowLeft className="w-4 h-4" />{l('Медіацентр', 'Медиацентр', 'Media Center')}</Link>
          <div className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-indigo-300">{localized.categoryLabel}</div>
          <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight">{localized.title}</h1>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-300">{localized.summary}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400">
            {localized.date && <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" />{localized.date}</span>}
            {localized.readTime && <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" />{localized.readTime}</span>}
            {localized.author && <span className="inline-flex items-center gap-1.5"><User className="w-4 h-4" />{localized.author}</span>}
            <button onClick={share} className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 font-bold text-slate-200 hover:bg-slate-800">
              {copied ? <Copy className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}{copied ? l('Скопійовано', 'Скопировано', 'Copied') : l('Поділитися', 'Поделиться', 'Share')}
            </button>
          </div>
        </div>
      </header>

      {article.coverImage && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-1">
          <img src={article.coverImage} alt={localized.title} className="w-full max-h-[620px] object-cover rounded-b-3xl shadow-lg" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
        <div className="space-y-7 text-[17px] leading-8 text-slate-700">
          {localized.content.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
        </div>

        {localized.keyTakeaways.length > 0 && (
          <section className="mt-12 rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 sm:p-8">
            <h2 className="text-xl font-black text-slate-950">{l('Ключові висновки', 'Ключевые выводы', 'Key takeaways')}</h2>
            <ul className="mt-5 space-y-3">
              {localized.keyTakeaways.map(item => <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700"><CheckCircle2 className="mt-0.5 w-5 h-5 shrink-0 text-indigo-600" />{item}</li>)}
            </ul>
          </section>
        )}
      </div>

      <ArticleRelatedContent raw={loaded.raw} />
    </article>
  );
}
