import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Image as ImageIcon,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CaseStudy, Locale } from '../../types';
import { getCaseSlug } from '../../lib/caseMedia';
import { getGallerySlug, isPhotoGallery, type PhotoGallery } from '../../lib/galleryContent';
import { getVideoProjectSlug, isVideoProject, type VideoProject } from '../../lib/videoPortfolio';
import { normalizeArticle } from '../../lib/articleCms';
import { evaluatePublishQuality, type PublishQualityIssue, type PublishQualityType } from '../../lib/publishQuality';
import { seoFieldName } from '../../lib/seoOverrides';
import { isProjectRelation, type ProjectRelation } from '../../lib/projectRelations';

interface ContentRecord {
  key: string;
  id: string;
  type: PublishQualityType;
  collectionName: 'cases' | 'site_settings' | 'articles';
  raw: Record<string, unknown>;
  title: string;
  slug: string;
  path: string;
  published: boolean;
}

interface SeoDraft {
  title: string;
  description: string;
  socialImage: string;
}

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'uk', label: 'Українська' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

const TYPE_LABELS: Record<PublishQualityType, string> = {
  case: 'Case',
  gallery: 'Gallery',
  video: 'Video',
  article: 'Article',
};

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function exactString(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === 'string' ? String(record[key]) : '';
}

function localizedPortfolioValue(raw: Record<string, unknown>, base: string, locale: Locale): string {
  if (locale === 'uk') return exactString(raw, `${base}_uk`) || exactString(raw, base) || exactString(raw, `${base}_en`);
  if (locale === 'en') return exactString(raw, `${base}_en`) || exactString(raw, `${base}_uk`) || exactString(raw, base);
  return exactString(raw, base) || exactString(raw, `${base}_uk`) || exactString(raw, `${base}_en`);
}

function articleTranslation(raw: Record<string, unknown>, locale: Locale): Record<string, unknown> {
  const primary = recordOf(raw[locale]);
  if (Object.keys(primary).length) return primary;
  if (locale === 'en') return recordOf(raw.uk) || recordOf(raw.ru);
  if (locale === 'uk') return recordOf(raw.ru) || recordOf(raw.en);
  return recordOf(raw.uk) || recordOf(raw.en);
}

function automaticSeo(record: ContentRecord, locale: Locale): SeoDraft {
  if (record.type === 'article') {
    const translation = articleTranslation(record.raw, locale);
    return {
      title: exactString(translation, 'title') || record.title,
      description: exactString(translation, 'summary') || (Array.isArray(translation.content) ? String(translation.content[0] || '') : ''),
      socialImage: exactString(record.raw, 'coverImage'),
    };
  }

  const title = localizedPortfolioValue(record.raw, 'title', locale) || record.title;
  const description = localizedPortfolioValue(record.raw, 'description', locale)
    || localizedPortfolioValue(record.raw, 'result', locale)
    || localizedPortfolioValue(record.raw, 'challenge', locale)
    || title;
  const socialImage = record.type === 'case'
    ? exactString(record.raw, 'imageUrl')
    : exactString(record.raw, 'coverUrl');
  return { title, description, socialImage };
}

function exactSeoDraft(record: ContentRecord, locale: Locale): SeoDraft {
  return {
    title: exactString(record.raw, seoFieldName('seoTitle', locale)),
    description: exactString(record.raw, seoFieldName('seoDescription', locale)),
    socialImage: exactString(record.raw, seoFieldName('socialImage', locale)),
  };
}

function articleRecord(id: string, raw: Record<string, unknown>): ContentRecord {
  const article = normalizeArticle(id, raw);
  const title = article.uk.title || article.ru.title || article.en?.title || id;
  return {
    key: `article:${id}`,
    id,
    type: 'article',
    collectionName: 'articles',
    raw,
    title,
    slug: article.slug,
    path: `/media-center/${encodeURIComponent(article.slug)}`,
    published: article.published,
  };
}

function caseRecord(id: string, raw: Record<string, unknown>): ContentRecord {
  const item = { id, ...raw } as unknown as CaseStudy;
  const slug = getCaseSlug(item);
  return {
    key: `case:${id}`,
    id,
    type: 'case',
    collectionName: 'cases',
    raw,
    title: item.title_uk || item.title || item.title_en || id,
    slug,
    path: `/cases/${encodeURIComponent(slug)}`,
    published: raw.published !== false,
  };
}

function galleryRecord(id: string, raw: Record<string, unknown>): ContentRecord | null {
  const item = { id, ...raw };
  if (!isPhotoGallery(item)) return null;
  const gallery = item as PhotoGallery;
  const slug = getGallerySlug(gallery);
  return {
    key: `gallery:${id}`,
    id,
    type: 'gallery',
    collectionName: 'site_settings',
    raw,
    title: gallery.title_uk || gallery.title || gallery.title_en || id,
    slug,
    path: `/galleries/${encodeURIComponent(slug)}`,
    published: gallery.published !== false,
  };
}

function videoRecord(id: string, raw: Record<string, unknown>): ContentRecord | null {
  const item = { id, ...raw };
  if (!isVideoProject(item)) return null;
  const project = item as VideoProject;
  const slug = getVideoProjectSlug(project);
  return {
    key: `video:${id}`,
    id,
    type: 'video',
    collectionName: 'site_settings',
    raw,
    title: project.title_uk || project.title || project.title_en || id,
    slug,
    path: `/videos/${encodeURIComponent(slug)}`,
    published: project.published !== false,
  };
}

function brokenRelationKeys(records: ContentRecord[], relations: ProjectRelation[]): Set<string> {
  const ids = {
    case: new Set(records.filter(item => item.type === 'case').map(item => item.id)),
    gallery: new Set(records.filter(item => item.type === 'gallery').map(item => item.id)),
    video: new Set(records.filter(item => item.type === 'video').map(item => item.id)),
  };
  const broken = new Set<string>();
  relations.forEach(relation => {
    const relationBroken = !ids.case.has(relation.caseId)
      || relation.galleryIds.some(id => !ids.gallery.has(id))
      || relation.videoProjectIds.some(id => !ids.video.has(id));
    if (!relationBroken) return;
    if (ids.case.has(relation.caseId)) broken.add(`case:${relation.caseId}`);
    relation.galleryIds.forEach(id => { if (ids.gallery.has(id)) broken.add(`gallery:${id}`); });
    relation.videoProjectIds.forEach(id => { if (ids.video.has(id)) broken.add(`video:${id}`); });
  });
  return broken;
}

export function SeoQualityManager() {
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [relations, setRelations] = useState<ProjectRelation[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [language, setLanguage] = useState<Locale>('uk');
  const [draft, setDraft] = useState<SeoDraft>({ title: '', description: '', socialImage: '' });
  const [queryText, setQueryText] = useState('');
  const [typeFilter, setTypeFilter] = useState<PublishQualityType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [casesSnapshot, galleriesSnapshot, videosSnapshot, articlesSnapshot, relationsSnapshot] = await Promise.all([
        getDocs(collection(db, 'cases')),
        getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'gallery'))),
        getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'video_project'))),
        getDocs(collection(db, 'articles')),
        getDocs(query(collection(db, 'site_settings'), where('kind', '==', 'project_relation'))),
      ]);

      const next: ContentRecord[] = [
        ...casesSnapshot.docs.map(item => caseRecord(item.id, item.data() as Record<string, unknown>)),
        ...galleriesSnapshot.docs.map(item => galleryRecord(item.id, item.data() as Record<string, unknown>)).filter((item): item is ContentRecord => Boolean(item)),
        ...videosSnapshot.docs.map(item => videoRecord(item.id, item.data() as Record<string, unknown>)).filter((item): item is ContentRecord => Boolean(item)),
        ...articlesSnapshot.docs.map(item => articleRecord(item.id, item.data() as Record<string, unknown>)),
      ].sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
      const nextRelations = relationsSnapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .filter(isProjectRelation);
      setRecords(next);
      setRelations(nextRelations);
      setSelectedKey(current => current && next.some(item => item.key === current) ? current : next[0]?.key || '');
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const selected = useMemo(() => records.find(item => item.key === selectedKey) || null, [records, selectedKey]);
  useEffect(() => {
    if (selected) setDraft(exactSeoDraft(selected, language));
  }, [selected, language]);

  const duplicateSlugs = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach(item => counts.set(`${item.type}:${item.slug}`, (counts.get(`${item.type}:${item.slug}`) || 0) + 1));
    return counts;
  }, [records]);
  const brokenKeys = useMemo(() => brokenRelationKeys(records, relations), [records, relations]);

  const issuesFor = (item: ContentRecord): PublishQualityIssue[] => evaluatePublishQuality(item.type, item.raw, {
    duplicateSlug: (duplicateSlugs.get(`${item.type}:${item.slug}`) || 0) > 1,
    brokenRelation: brokenKeys.has(item.key),
  });

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return records.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (!q) return true;
      return `${item.title} ${item.slug} ${item.type}`.toLowerCase().includes(q);
    });
  }, [records, queryText, typeFilter]);

  const auto = selected ? automaticSeo(selected, language) : { title: '', description: '', socialImage: '' };
  const previewTitle = (draft.title.trim() || auto.title).trim();
  const previewDescription = (draft.description.trim() || auto.description).trim();
  const previewImage = (draft.socialImage.trim() || auto.socialImage).trim();
  const selectedIssues = selected ? issuesFor(selected) : [];

  const saveSeo = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage('');
    try {
      const patch: Record<string, unknown> = {
        [seoFieldName('seoTitle', language)]: draft.title.trim(),
        [seoFieldName('seoDescription', language)]: draft.description.trim(),
        [seoFieldName('socialImage', language)]: draft.socialImage.trim(),
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, selected.collectionName, selected.id), patch, { merge: true });
      setMessage('SEO-поля сохранены. Пустые значения продолжают использовать автоматический fallback.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!selected) return;
    const nextPublished = !selected.published;
    if (nextPublished && selectedIssues.length) {
      const list = selectedIssues.map(item => `• ${item.label}`).join('\n');
      if (!window.confirm(`Материал имеет предупреждения качества:\n\n${list}\n\nОпубликовать всё равно?`)) return;
    }
    setSaving(true);
    setMessage('');
    try {
      const patch: Record<string, unknown> = { published: nextPublished, updatedAt: Date.now() };
      if (selected.type === 'article' && nextPublished && !selected.raw.publishedAt) patch.publishedAt = Date.now();
      await setDoc(doc(db, selected.collectionName, selected.id), patch, { merge: true });
      setMessage(nextPublished ? 'Материал опубликован.' : 'Материал переведён в черновик.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700"><FileSearch className="w-3.5 h-3.5" />SEO Control 3.0</div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">SEO overrides + Publish Quality Gate</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">Case / Gallery / Video / Article. SEO-поля необязательны: пустое значение оставляет текущую автоматическую генерацию. Проверки качества предупреждают до публикации, но пока не блокируют старый контент.</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Обновить</button>
        </div>
      </div>

      {message && <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] items-start">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={queryText} onChange={event => setQueryText(event.target.value)} placeholder="Поиск по title / slug" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-300" />
            </div>
            <select value={typeFilter} onChange={event => setTypeFilter(event.target.value as PublishQualityType | 'all')} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="all">Все типы</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {filtered.map(item => {
              const issues = issuesFor(item);
              return (
                <button key={item.key} onClick={() => setSelectedKey(item.key)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedKey === item.key ? 'border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                        <span className="text-indigo-700">{TYPE_LABELS[item.type]}</span>
                        <span className={item.published ? 'text-emerald-700' : 'text-slate-400'}>{item.published ? 'PUBLIC' : 'DRAFT'}</span>
                      </div>
                      <div className="mt-1 truncate font-bold text-slate-900">{item.title}</div>
                      <div className="mt-1 truncate text-xs text-slate-400">/{item.slug}</div>
                    </div>
                    <div className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${issues.length ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{issues.length ? `${issues.length} WARN` : 'OK'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm xl:sticky xl:top-24">
          {!selected ? (
            <div className="py-16 text-center text-slate-400">Выберите материал слева.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-indigo-600">{TYPE_LABELS[selected.type]}</div>
                  <h3 className="mt-1 text-xl font-black text-slate-950">{selected.title}</h3>
                  <a href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}${selected.path}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:underline"><ExternalLink className="w-3.5 h-3.5" />Открыть публичный URL</a>
                </div>
                <button onClick={togglePublish} disabled={saving} className={`rounded-xl px-4 py-2 text-xs font-black text-white disabled:opacity-50 ${selected.published ? 'bg-slate-700 hover:bg-slate-600' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{selected.published ? 'В черновик' : 'Publish'}</button>
              </div>

              <div className={`rounded-2xl border p-4 ${selectedIssues.length ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                  {selectedIssues.length ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  Publish Quality: {selectedIssues.length ? `${selectedIssues.length} предупреждений` : 'готово'}
                </div>
                {selectedIssues.length > 0 && <ul className="mt-3 space-y-1.5 text-xs text-slate-700">{selectedIssues.map(issue => <li key={issue.code}>• {issue.label}</li>)}</ul>}
              </div>

              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                {LANGS.map(item => <button key={item.id} onClick={() => setLanguage(item.id)} className={`rounded-xl px-4 py-2 text-xs font-bold ${language === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item.label}</button>)}
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-700">SEO title <span className="float-right font-normal text-slate-400">{draft.title.length}/60</span>
                  <input value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder={`AUTO: ${auto.title}`} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="block text-xs font-bold text-slate-700">SEO description <span className="float-right font-normal text-slate-400">{draft.description.length}/160</span>
                  <textarea rows={4} value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} placeholder={`AUTO: ${auto.description}`} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="block text-xs font-bold text-slate-700">Social image (OG/Twitter)
                  <div className="mt-1 flex gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">{previewImage ? <img src={previewImage} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="w-4 h-4 text-slate-400" />}</div>
                    <input value={draft.socialImage} onChange={event => setDraft(current => ({ ...current, socialImage: event.target.value }))} placeholder={`AUTO: ${auto.socialImage || 'нет'}`} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal" />
                  </div>
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Google preview</div>
                  <div className="mt-3 text-[18px] leading-6 text-blue-700 line-clamp-2">{previewTitle || 'Title'}{previewTitle.includes('Dneprfilm') ? '' : ' — Dneprfilm'}</div>
                  <div className="mt-1 text-xs text-emerald-700">dneprfilm.com{selected.path}</div>
                  <div className="mt-1 text-sm leading-5 text-slate-600 line-clamp-3">{previewDescription || 'Description'}</div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="aspect-[1.91/1] bg-slate-100">{previewImage ? <img src={previewImage} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon className="w-6 h-6" /></div>}</div>
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">OG / social preview</div>
                    <div className="mt-1 font-black text-slate-900 line-clamp-2">{previewTitle || selected.title}</div>
                    <div className="mt-1 text-xs text-slate-500 line-clamp-2">{previewDescription}</div>
                  </div>
                </div>
              </div>

              <button onClick={saveSeo} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Сохранение…' : 'Сохранить SEO overrides'}</button>

              <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500"><ShieldCheck className="mt-0.5 w-4 h-4 shrink-0 text-slate-400" />Пустые SEO-поля не меняют текущий SEO 2.0: detail-страница продолжает использовать автоматические title, description и cover.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
