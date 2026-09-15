import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Edit3,
  Eye,
  FileSearch,
  FileText,
  Film,
  Image as ImageIcon,
  Images,
  Library,
  Link2,
  Loader2,
  Plus,
  Search,
  Tags,
  Trash2,
  Upload,
} from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type {
  Article,
  ArticleCategory,
  ArticleTranslation,
  CaseMediaItem,
  CaseMediaType,
  CaseStudy,
  Locale,
} from '../../types';
import {
  createCaseMediaItem,
  detectCaseMediaType,
  getCaseSlug,
  getMediaPreview,
  getYouTubeThumbnail,
  normalizedCaseMedia,
  slugifyCase,
} from '../../lib/caseMedia';
import {
  articleCategoryLabel,
  normalizeArticle,
  slugifyArticleTitle,
} from '../../lib/articleCms';
import {
  GALLERY_COLLECTION,
  GALLERY_KIND,
  galleryCover,
  getGalleryPath,
  getGallerySlug,
  isPhotoGallery,
  type GalleryImage,
  type PhotoGallery,
} from '../../lib/galleryContent';
import {
  VIDEO_PROJECT_COLLECTION,
  VIDEO_PROJECT_KIND,
  createVideoProjectMedia,
  getVideoProjectPath,
  getVideoProjectSlug,
  isVideoProject,
  videoMediaPoster,
  videoProjectCover,
  type VideoProject,
  type VideoProjectFormat,
  type VideoProjectMedia,
} from '../../lib/videoPortfolio';
import {
  evaluatePublishQuality,
  requestPublishApproval,
  type PublishQualityType,
} from '../../lib/publishQuality';
import { cleanupPortfolioRelations } from '../../lib/portfolioRelationsAdmin';
import {
  uploadCaseImage,
  uploadGalleryImage,
  uploadPortfolioVideo,
} from '../../lib/mediaUpload';
import { registerMediaAsset, type MediaLibraryAsset } from '../../lib/mediaLibrary';
import { AdminImageField } from './AdminImageField';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import {
  PortfolioRelationsField,
  type PortfolioRelationsFieldHandle,
} from './PortfolioRelationsField';
import {
  UnifiedContentEditorShell,
  type UnifiedEditorSection,
  type UnifiedEditorTabId,
} from './UnifiedContentEditorShell';
import { UnifiedSeoPanel } from './UnifiedSeoPanel';
import { UnifiedTaxonomyPanel } from './UnifiedTaxonomyPanel';
import { ResponsiveImage } from '../ResponsiveImage';

const ARTICLE_CATEGORIES: ArticleCategory[] = ['live', 'video', 'construction', 'photo', 'tech'];

type UnifiedRecord = Record<string, any>;
type ContentFilter = PublishQualityType;
type CollectionName = 'cases' | 'site_settings' | 'articles';

type PickerMode =
  | { kind: 'case-media' }
  | { kind: 'gallery-media' }
  | { kind: 'video-media' }
  | { kind: 'video-poster'; mediaId: string }
  | null;

interface ContentItem {
  key: string;
  type: PublishQualityType;
  id: string;
  collectionName: CollectionName;
  data: UnifiedRecord;
  title: string;
  slug: string;
  path: string;
  cover: string;
  published: boolean;
  updatedAt: number;
}

const TYPE_META: Record<PublishQualityType, { label: string; plural: string; icon: typeof Briefcase }> = {
  case: { label: 'Кейс', plural: 'Кейсы', icon: Briefcase },
  gallery: { label: 'Галерея', plural: 'Галереи', icon: Images },
  video: { label: 'Видеопроект', plural: 'Видео', icon: Film },
  article: { label: 'Статья', plural: 'Статьи', icon: FileText },
};

function recordOf(value: unknown): UnifiedRecord {
  return value && typeof value === 'object' ? value as UnifiedRecord : {};
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function cleanForFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyArticleTranslation(locale: Locale): ArticleTranslation {
  return {
    title: '',
    categoryLabel: articleCategoryLabel('live', locale),
    readTime: locale === 'uk' ? '5 хв читання' : locale === 'en' ? '5 min read' : '5 мин чтения',
    date: new Date().toLocaleDateString(locale === 'uk' ? 'uk-UA' : locale === 'en' ? 'en-GB' : 'ru-RU'),
    author: locale === 'uk' ? 'Олександр Пітель' : locale === 'en' ? 'Oleksandr Pitel' : 'Александр Питель',
    summary: '',
    content: [],
    keyTakeaways: [],
  };
}

function emptyRecord(type: PublishQualityType): UnifiedRecord {
  const now = Date.now();
  if (type === 'case') {
    return {
      id: `case-${now}`,
      slug: '',
      title: '', title_uk: '', title_en: '',
      category: 'LIVE',
      client: '',
      categoryLabel: '', categoryLabel_uk: '', categoryLabel_en: '',
      description: '', description_uk: '', description_en: '',
      challenge: '', challenge_uk: '', challenge_en: '',
      solution: '', solution_uk: '', solution_en: '',
      result: '', result_uk: '', result_en: '',
      location: '', location_uk: '', location_en: '',
      year: String(new Date().getFullYear()),
      metrics: [], metrics_uk: [], metrics_en: [],
      imageUrl: '', videoUrl: '', videoBadge: '', media: [],
      published: false, featured: false, featuredOrder: 99,
      taxonomy: { category: 'other', tags: [] },
      createdAt: now,
    };
  }
  if (type === 'gallery') {
    return {
      id: `gallery-${now}`,
      kind: GALLERY_KIND,
      slug: '',
      title: '', title_uk: '', title_en: '',
      description: '', description_uk: '', description_en: '',
      location: '', location_uk: '', location_en: '',
      date: nowDate(), coverUrl: '', images: [], published: false, order: 999,
      taxonomy: { category: 'other', tags: [] },
      createdAt: now,
    };
  }
  if (type === 'video') {
    return {
      id: `video-project-${now}`,
      kind: VIDEO_PROJECT_KIND,
      slug: '',
      title: '', title_uk: '', title_en: '',
      client: '', client_uk: '', client_en: '',
      category: '', category_uk: '', category_en: '',
      description: '', description_uk: '', description_en: '',
      result: '', result_uk: '', result_en: '',
      location: '', location_uk: '', location_en: '',
      date: nowDate(), coverUrl: '', tags: [], tags_uk: [], tags_en: [], videos: [],
      published: false, featured: false, order: 999,
      taxonomy: { category: 'other', tags: [] },
      createdAt: now,
    };
  }
  return {
    id: `art-${now}`,
    slug: '', category: 'live', coverImage: '', published: false,
    publishedAt: now, createdAt: now,
    ru: emptyArticleTranslation('ru'),
    uk: emptyArticleTranslation('uk'),
    en: emptyArticleTranslation('en'),
    taxonomy: { category: 'other', tags: [] },
    relatedCaseIds: [], relatedGalleryIds: [], relatedVideoProjectIds: [],
  };
}

function portfolioKey(base: string, locale: Locale): string {
  return locale === 'ru' ? base : `${base}_${locale}`;
}

function localizedPortfolioValue(data: UnifiedRecord, base: string, locale: Locale): string {
  return stringValue(data[portfolioKey(base, locale)]);
}

function articleTranslation(data: UnifiedRecord, locale: Locale): ArticleTranslation {
  const current = recordOf(data[locale]);
  return {
    ...emptyArticleTranslation(locale),
    ...current,
    content: Array.isArray(current.content) ? current.content.map(String) : [],
    keyTakeaways: Array.isArray(current.keyTakeaways) ? current.keyTakeaways.map(String) : [],
  };
}

function contentTitle(type: PublishQualityType, data: UnifiedRecord, locale: Locale = 'uk'): string {
  if (type === 'article') {
    const translation = articleTranslation(data, locale);
    return translation.title || articleTranslation(data, 'uk').title || articleTranslation(data, 'ru').title || data.id || 'Без названия';
  }
  return localizedPortfolioValue(data, 'title', locale)
    || stringValue(data.title_uk)
    || stringValue(data.title)
    || stringValue(data.title_en)
    || stringValue(data.id)
    || 'Без названия';
}

function contentDescription(type: PublishQualityType, data: UnifiedRecord, locale: Locale = 'uk'): string {
  if (type === 'article') return articleTranslation(data, locale).summary;
  return localizedPortfolioValue(data, 'description', locale)
    || localizedPortfolioValue(data, 'result', locale)
    || localizedPortfolioValue(data, 'challenge', locale);
}

function contentCover(type: PublishQualityType, data: UnifiedRecord): string {
  if (type === 'case') return stringValue(data.imageUrl);
  if (type === 'article') return stringValue(data.coverImage);
  if (type === 'gallery') return galleryCover(data as PhotoGallery);
  return videoProjectCover(data as VideoProject);
}

function contentSlug(type: PublishQualityType, data: UnifiedRecord): string {
  if (type === 'case') return getCaseSlug(data as CaseStudy);
  if (type === 'gallery') return getGallerySlug(data as PhotoGallery);
  if (type === 'video') return getVideoProjectSlug(data as VideoProject);
  const article = normalizeArticle(String(data.id || ''), data);
  return article.slug;
}

function contentPath(type: PublishQualityType, data: UnifiedRecord): string {
  const slug = contentSlug(type, data);
  if (type === 'case') return `/cases/${encodeURIComponent(slug)}`;
  if (type === 'gallery') return `/galleries/${encodeURIComponent(slug)}`;
  if (type === 'video') return `/videos/${encodeURIComponent(slug)}`;
  return `/media-center/${encodeURIComponent(slug)}`;
}

function asItem(type: PublishQualityType, id: string, raw: UnifiedRecord): ContentItem {
  const data = type === 'article'
    ? { ...raw, ...normalizeArticle(id, raw), id }
    : { id, ...raw };
  return {
    key: `${type}:${id}`,
    type,
    id,
    collectionName: type === 'case' ? 'cases' : type === 'article' ? 'articles' : 'site_settings',
    data,
    title: contentTitle(type, data),
    slug: contentSlug(type, data),
    path: contentPath(type, data),
    cover: contentCover(type, data),
    published: data.published !== false,
    updatedAt: Number(data.updatedAt || data.publishedAt || data.createdAt || 0),
  };
}

function prepareDraft(item: ContentItem): UnifiedRecord {
  if (item.type === 'case') {
    const typed = item.data as CaseStudy;
    return { ...item.data, media: normalizedCaseMedia(typed), published: typed.published !== false };
  }
  if (item.type === 'gallery') return { ...item.data, images: [...(item.data.images || [])], published: item.data.published !== false };
  if (item.type === 'video') return { ...item.data, videos: [...(item.data.videos || [])], published: item.data.published !== false };
  return {
    ...item.data,
    uk: articleTranslation(item.data, 'uk'),
    ru: articleTranslation(item.data, 'ru'),
    en: articleTranslation(item.data, 'en'),
    published: Boolean(item.data.published),
  };
}

function primaryTitle(type: PublishQualityType, data: UnifiedRecord): string {
  if (type === 'article') return articleTranslation(data, 'uk').title || articleTranslation(data, 'ru').title || articleTranslation(data, 'en').title;
  return stringValue(data.title_uk) || stringValue(data.title) || stringValue(data.title_en);
}

function resolvedDraftSlug(type: PublishQualityType, data: UnifiedRecord): string {
  const explicit = stringValue(data.slug).trim();
  const title = primaryTitle(type, data) || String(data.id || 'page');
  return type === 'article'
    ? (explicit || slugifyArticleTitle(title)).trim().toLowerCase()
    : slugifyCase(explicit || title);
}

function splitParagraphs(value: string): string[] {
  return value.split(/\n\s*\n/).map(item => item.trim()).filter(Boolean);
}

function splitLines(value: string): string[] {
  return value.split('\n').map(item => item.trim()).filter(Boolean);
}

function metricsToText(value: unknown): string {
  return Array.isArray(value)
    ? value.map(item => `${String(recordOf(item).label || '')} | ${String(recordOf(item).value || '')}`).join('\n')
    : '';
}

function metricsFromText(value: string) {
  return value.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [label, ...rest] = line.split('|');
    return { label: label.trim(), value: rest.join('|').trim() };
  }).filter(item => item.label && item.value);
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function UnifiedContentManager() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<ContentFilter>('case');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<PublishQualityType | null>(null);
  const [draft, setDraft] = useState<UnifiedRecord | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [activeTab, setActiveTab] = useState<UnifiedEditorTabId>('content');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const relationsRef = useRef<PortfolioRelationsFieldHandle>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [casesSnapshot, galleriesSnapshot, videosSnapshot, articlesSnapshot] = await Promise.all([
        getDocs(collection(db, 'cases')),
        getDocs(query(collection(db, GALLERY_COLLECTION), where('kind', '==', GALLERY_KIND))),
        getDocs(query(collection(db, VIDEO_PROJECT_COLLECTION), where('kind', '==', VIDEO_PROJECT_KIND))),
        getDocs(collection(db, 'articles')),
      ]);
      const next: ContentItem[] = [
        ...casesSnapshot.docs.map(item => asItem('case', item.id, item.data() as UnifiedRecord)),
        ...galleriesSnapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(isPhotoGallery).map(item => asItem('gallery', item.id, item as UnifiedRecord)),
        ...videosSnapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(isVideoProject).map(item => asItem('video', item.id, item as UnifiedRecord)),
        ...articlesSnapshot.docs.map(item => asItem('article', item.id, item.data() as UnifiedRecord)),
      ].sort((a, b) => b.updatedAt - a.updatedAt || a.title.localeCompare(b.title));
      setItems(next);
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return items.filter(item => item.type === typeFilter && (!q || `${item.title} ${item.slug} ${contentDescription(item.type, item.data)}`.toLowerCase().includes(q)));
  }, [items, searchText, typeFilter]);

  const counts = useMemo(() => ({
    case: items.filter(item => item.type === 'case').length,
    gallery: items.filter(item => item.type === 'gallery').length,
    video: items.filter(item => item.type === 'video').length,
    article: items.filter(item => item.type === 'article').length,
  }), [items]);

  const openEditor = (item: ContentItem) => {
    setEditingType(item.type);
    setDraft(prepareDraft(item));
    setLanguage('uk');
    setActiveTab('content');
    setError('');
    setNewMediaUrl('');
    setPickerMode(null);
  };

  const createNew = () => {
    setEditingType(typeFilter);
    setDraft(emptyRecord(typeFilter));
    setLanguage('uk');
    setActiveTab('content');
    setError('');
    setNewMediaUrl('');
    setPickerMode(null);
  };

  const closeEditor = () => {
    setEditingType(null);
    setDraft(null);
    setPickerMode(null);
    setError('');
  };

  const patchDraft = (patch: UnifiedRecord) => setDraft(current => current ? { ...current, ...patch } : current);

  const setPortfolioField = (base: string, value: string) => {
    if (!draft) return;
    patchDraft({ [portfolioKey(base, language)]: value });
  };

  const getPortfolioField = (base: string) => draft ? localizedPortfolioValue(draft, base, language) : '';

  const setArticleTranslation = (patch: Partial<ArticleTranslation>) => {
    if (!draft) return;
    patchDraft({ [language]: { ...articleTranslation(draft, language), ...patch } });
  };

  const setArticleCategory = (category: ArticleCategory) => {
    if (!draft) return;
    const uk = articleTranslation(draft, 'uk');
    const ru = articleTranslation(draft, 'ru');
    const en = articleTranslation(draft, 'en');
    patchDraft({
      category,
      uk: { ...uk, categoryLabel: articleCategoryLabel(category, 'uk') },
      ru: { ...ru, categoryLabel: articleCategoryLabel(category, 'ru') },
      en: { ...en, categoryLabel: articleCategoryLabel(category, 'en') },
    });
  };

  const duplicateSlug = useMemo(() => {
    if (!draft || !editingType) return false;
    const slug = resolvedDraftSlug(editingType, draft);
    return items.some(item => item.type === editingType && item.id !== draft.id && item.slug.toLowerCase() === slug.toLowerCase());
  }, [draft, editingType, items]);

  const issues = useMemo(() => editingType && draft
    ? evaluatePublishQuality(editingType, draft, { duplicateSlug })
    : [], [draft, duplicateSlug, editingType]);

  const publicPath = editingType && draft ? (() => {
    const slug = resolvedDraftSlug(editingType, draft);
    if (editingType === 'case') return `/cases/${encodeURIComponent(slug)}`;
    if (editingType === 'gallery') return `/galleries/${encodeURIComponent(slug)}`;
    if (editingType === 'video') return `/videos/${encodeURIComponent(slug)}`;
    return `/media-center/${encodeURIComponent(slug)}`;
  })() : '';

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !editingType) return;
    const title = primaryTitle(editingType, draft).trim();
    if (!title) {
      setError('Укажите название хотя бы на одном языке.');
      setActiveTab('content');
      return;
    }
    if (duplicateSlug) {
      setError('Slug уже используется другим материалом этого типа. Измените URL перед сохранением.');
      setActiveTab('preview');
      return;
    }

    let prepared: UnifiedRecord = { ...draft, slug: resolvedDraftSlug(editingType, draft), updatedAt: Date.now() };
    if (editingType === 'case') {
      const media = (Array.isArray(prepared.media) ? prepared.media : [])
        .filter((item: CaseMediaItem) => item.url?.trim())
        .map((item: CaseMediaItem) => {
          const url = item.url.trim();
          const type = item.type || detectCaseMediaType(url);
          return { ...item, url, type, thumbnailUrl: type === 'youtube' ? item.thumbnailUrl || getYouTubeThumbnail(url) || undefined : item.thumbnailUrl };
        });
      prepared = {
        ...prepared,
        media,
        imageUrl: stringValue(prepared.imageUrl) || media.find((item: CaseMediaItem) => item.type === 'image')?.url || '',
        videoUrl: stringValue(prepared.videoUrl) || media.find((item: CaseMediaItem) => item.type !== 'image')?.url || '',
      };
    } else if (editingType === 'gallery') {
      const images = (Array.isArray(prepared.images) ? prepared.images : []).filter((item: GalleryImage) => item.url?.trim()).map((item: GalleryImage) => ({ ...item, url: item.url.trim() }));
      const urls = new Set(images.map((item: GalleryImage) => item.url));
      prepared = { ...prepared, kind: GALLERY_KIND, images, coverUrl: urls.has(stringValue(prepared.coverUrl)) ? prepared.coverUrl : images[0]?.url || stringValue(prepared.coverUrl) };
    } else if (editingType === 'video') {
      prepared = { ...prepared, kind: VIDEO_PROJECT_KIND, videos: (Array.isArray(prepared.videos) ? prepared.videos : []).filter((item: VideoProjectMedia) => item.url?.trim()) };
    } else {
      prepared = {
        ...prepared,
        uk: articleTranslation(prepared, 'uk'),
        ru: articleTranslation(prepared, 'ru'),
        en: articleTranslation(prepared, 'en'),
        publishedAt: prepared.publishedAt || Date.now(),
      };
    }

    if (prepared.published !== false) {
      const approval = requestPublishApproval(editingType, prepared, { duplicateSlug: false });
      if (!approval.allowed) return;
    }

    setSaving(true);
    setError('');
    try {
      const collectionName: CollectionName = editingType === 'case' ? 'cases' : editingType === 'article' ? 'articles' : 'site_settings';
      await setDoc(doc(db, collectionName, String(prepared.id)), cleanForFirestore(prepared));
      if (editingType !== 'article') await relationsRef.current?.save();
      closeEditor();
      await load();
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ContentItem) => {
    if (!window.confirm(`Удалить ${TYPE_META[item.type].label.toLowerCase()} «${item.title}»? Это действие нельзя отменить.`)) return;
    try {
      await deleteDoc(doc(db, item.collectionName, item.id));
      if (item.type !== 'article') await cleanupPortfolioRelations(item.type, item.id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const caseMedia = (): CaseMediaItem[] => Array.isArray(draft?.media) ? draft!.media : [];
  const galleryImages = (): GalleryImage[] => Array.isArray(draft?.images) ? draft!.images : [];
  const videoMedia = (): VideoProjectMedia[] => Array.isArray(draft?.videos) ? draft!.videos : [];

  const addMediaUrl = () => {
    if (!draft || !editingType || !newMediaUrl.trim()) return;
    const url = newMediaUrl.trim();
    if (editingType === 'case') {
      if (caseMedia().some(item => item.url === url)) return setNewMediaUrl('');
      const type = detectCaseMediaType(url);
      const item = createCaseMediaItem(type, url);
      if (type === 'youtube') item.thumbnailUrl = getYouTubeThumbnail(url) || undefined;
      patchDraft({ media: [...caseMedia(), item], imageUrl: draft.imageUrl || (type === 'image' ? url : ''), videoUrl: draft.videoUrl || (type !== 'image' ? url : '') });
    } else if (editingType === 'video') {
      const media = createVideoProjectMedia(url);
      if (videoMedia().some(item => item.url === media.url)) return setNewMediaUrl('');
      patchDraft({ videos: [...videoMedia(), media] });
    }
    setNewMediaUrl('');
  };

  const uploadImages = async (files: FileList | null) => {
    if (!draft || !editingType || !files?.length || !['case', 'gallery'].includes(editingType)) return;
    setUploading(true);
    setError('');
    try {
      if (editingType === 'case') {
        const added: CaseMediaItem[] = [];
        for (const file of Array.from(files).slice(0, 20)) {
          const uploaded = await uploadCaseImage(file, String(draft.id));
          added.push({
            ...createCaseMediaItem('image', uploaded.url),
            cloudinaryPublicId: uploaded.publicId,
            alt: stringValue(draft.title) || stringValue(draft.title_uk) || file.name,
            alt_uk: stringValue(draft.title_uk) || stringValue(draft.title) || file.name,
            alt_en: stringValue(draft.title_en) || stringValue(draft.title_uk) || file.name,
          });
        }
        patchDraft({ media: [...caseMedia(), ...added], imageUrl: draft.imageUrl || added[0]?.url || '' });
      } else {
        const added: GalleryImage[] = [];
        for (const file of Array.from(files).slice(0, 50)) {
          const uploaded = await uploadGalleryImage(file, String(draft.id));
          await registerMediaAsset(uploaded, file.name);
          added.push({
            id: makeId('photo'), url: uploaded.url, cloudinaryPublicId: uploaded.publicId,
            alt: stringValue(draft.title) || stringValue(draft.title_uk) || file.name,
            alt_uk: stringValue(draft.title_uk) || stringValue(draft.title) || file.name,
            alt_en: stringValue(draft.title_en) || stringValue(draft.title_uk) || file.name,
            caption: '', caption_uk: '', caption_en: '',
          });
        }
        patchDraft({ images: [...galleryImages(), ...added], coverUrl: draft.coverUrl || added[0]?.url || '' });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const uploadVideos = async (files: FileList | null) => {
    if (!draft || editingType !== 'video' || !files?.length) return;
    setUploading(true);
    setError('');
    try {
      const added: VideoProjectMedia[] = [];
      for (const file of Array.from(files).slice(0, 10)) {
        const uploaded = await uploadPortfolioVideo(file, String(draft.id));
        added.push({ id: makeId('video'), type: 'video', url: uploaded.url, posterUrl: uploaded.posterUrl, cloudinaryPublicId: uploaded.publicId, format: '16:9' });
      }
      patchDraft({ videos: [...videoMedia(), ...added] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const addFromLibrary = (assets: MediaLibraryAsset[]) => {
    if (!draft || !editingType) return;
    if (pickerMode?.kind === 'case-media') {
      const existing = new Set(caseMedia().map(item => item.url));
      const added = assets.filter(asset => !existing.has(asset.url)).map(asset => {
        const item = createCaseMediaItem(asset.assetType === 'video' ? 'video' : 'image', asset.url);
        item.cloudinaryPublicId = asset.publicId;
        if (asset.assetType === 'video') item.thumbnailUrl = asset.previewUrl;
        if (asset.assetType === 'image') {
          const fallback = asset.name || primaryTitle('case', draft) || 'Фото';
          item.alt = stringValue(draft.title) || fallback;
          item.alt_uk = stringValue(draft.title_uk) || fallback;
          item.alt_en = stringValue(draft.title_en) || fallback;
        }
        return item;
      });
      patchDraft({ media: [...caseMedia(), ...added], imageUrl: draft.imageUrl || added.find(item => item.type === 'image')?.url || '', videoUrl: draft.videoUrl || added.find(item => item.type !== 'image')?.url || '' });
    }
    if (pickerMode?.kind === 'gallery-media') {
      const existing = new Set(galleryImages().map(item => item.url));
      const added = assets.filter(asset => asset.assetType === 'image' && !existing.has(asset.url)).map(asset => ({
        id: makeId('photo'), url: asset.url, cloudinaryPublicId: asset.publicId,
        alt: stringValue(draft.title) || asset.name || 'Фото', alt_uk: stringValue(draft.title_uk) || asset.name || 'Фото', alt_en: stringValue(draft.title_en) || asset.name || 'Photo',
        caption: '', caption_uk: '', caption_en: '',
      }));
      patchDraft({ images: [...galleryImages(), ...added], coverUrl: draft.coverUrl || added[0]?.url || '' });
    }
    if (pickerMode?.kind === 'video-media') {
      const existing = new Set(videoMedia().map(item => item.url));
      const added = assets.filter(asset => asset.assetType === 'video' && !existing.has(asset.url)).map(asset => ({
        id: makeId('video'), type: 'video' as const, url: asset.url, posterUrl: asset.previewUrl, cloudinaryPublicId: asset.publicId, format: '16:9' as const,
        title: asset.name || undefined, title_uk: asset.name || undefined, title_en: asset.name || undefined,
      }));
      patchDraft({ videos: [...videoMedia(), ...added] });
    }
    setPickerMode(null);
  };

  const choosePoster = (asset: MediaLibraryAsset) => {
    if (!draft || pickerMode?.kind !== 'video-poster' || asset.assetType !== 'image') return;
    patchDraft({ videos: videoMedia().map(item => item.id === pickerMode.mediaId ? { ...item, posterUrl: asset.url } : item) });
    setPickerMode(null);
  };

  const toggleArticleRelation = (field: 'relatedCaseIds' | 'relatedGalleryIds' | 'relatedVideoProjectIds', id: string) => {
    if (!draft) return;
    const current = new Set(Array.isArray(draft[field]) ? draft[field].map(String) : []);
    if (current.has(id)) current.delete(id); else current.add(id);
    patchDraft({ [field]: Array.from(current) });
  };

  const renderContentTab = () => {
    if (!draft || !editingType) return null;
    if (editingType === 'article') {
      const translation = articleTranslation(draft, language);
      return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-bold text-slate-700 md:col-span-2">Заголовок ({language.toUpperCase()})<input value={translation.title} onChange={event => setArticleTranslation({ title: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
            <label className="text-xs font-bold text-slate-700">Подпись категории<input value={translation.categoryLabel} onChange={event => setArticleTranslation({ categoryLabel: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
            <label className="text-xs font-bold text-slate-700">Автор<input value={translation.author} onChange={event => setArticleTranslation({ author: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
            <label className="text-xs font-bold text-slate-700">Дата на сайте<input value={translation.date} onChange={event => setArticleTranslation({ date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
            <label className="text-xs font-bold text-slate-700">Время чтения<input value={translation.readTime} onChange={event => setArticleTranslation({ readTime: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
            <label className="text-xs font-bold text-slate-700 md:col-span-2">Краткое описание<textarea rows={4} value={translation.summary} onChange={event => setArticleTranslation({ summary: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
            <label className="text-xs font-bold text-slate-700 md:col-span-2">Основной текст — абзацы разделяйте пустой строкой<textarea rows={14} value={translation.content.join('\n\n')} onChange={event => setArticleTranslation({ content: splitParagraphs(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm leading-relaxed" /></label>
            <label className="text-xs font-bold text-slate-700 md:col-span-2">Ключевые выводы — один пункт на строку<textarea rows={5} value={translation.keyTakeaways.join('\n')} onChange={event => setArticleTranslation({ keyTakeaways: splitLines(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
            <label className="text-xs font-bold text-slate-700 md:col-span-2">Slug / URL<div className="mt-1 flex overflow-hidden rounded-xl border border-slate-300"><span className="bg-slate-100 px-3 py-2.5 text-xs text-slate-500">/media-center/</span><input value={stringValue(draft.slug)} onChange={event => patchDraft({ slug: event.target.value })} placeholder="auto-from-title" className="min-w-0 flex-1 px-3 py-2.5 font-normal text-sm outline-none" /></div></label>
          </div>
        </section>
      );
    }

    const slugPrefix = editingType === 'case' ? '/cases/' : editingType === 'gallery' ? '/galleries/' : '/videos/';
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold text-slate-700 md:col-span-2">Название ({language.toUpperCase()})<input value={getPortfolioField('title')} onChange={event => setPortfolioField('title', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
          {editingType === 'case' && <label className="text-xs font-bold text-slate-700">Клиент<input value={stringValue(draft.client)} onChange={event => patchDraft({ client: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
          {editingType === 'video' && <label className="text-xs font-bold text-slate-700">Клиент ({language.toUpperCase()})<input value={getPortfolioField('client')} onChange={event => setPortfolioField('client', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
          {editingType === 'case' && <label className="text-xs font-bold text-slate-700">Подпись категории ({language.toUpperCase()})<input value={getPortfolioField('categoryLabel')} onChange={event => setPortfolioField('categoryLabel', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
          {editingType === 'video' && <label className="text-xs font-bold text-slate-700">Подпись категории ({language.toUpperCase()})<input value={getPortfolioField('category')} onChange={event => setPortfolioField('category', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
          <label className="text-xs font-bold text-slate-700">Локация ({language.toUpperCase()})<input value={getPortfolioField('location')} onChange={event => setPortfolioField('location', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
          {editingType === 'case' && <label className="text-xs font-bold text-slate-700">Год<input value={stringValue(draft.year)} onChange={event => patchDraft({ year: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
          {(editingType === 'gallery' || editingType === 'video') && <label className="text-xs font-bold text-slate-700">Дата<input type="date" value={stringValue(draft.date)} onChange={event => patchDraft({ date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
          <label className="text-xs font-bold text-slate-700 md:col-span-2">Описание ({language.toUpperCase()})<textarea rows={4} value={getPortfolioField('description')} onChange={event => setPortfolioField('description', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>
          {editingType === 'case' && <><label className="text-xs font-bold text-slate-700 md:col-span-2">Задача / Challenge<textarea rows={3} value={getPortfolioField('challenge')} onChange={event => setPortfolioField('challenge', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label><label className="text-xs font-bold text-slate-700 md:col-span-2">Решение<textarea rows={3} value={getPortfolioField('solution')} onChange={event => setPortfolioField('solution', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label></>}
          {(editingType === 'case' || editingType === 'video') && <label className="text-xs font-bold text-slate-700 md:col-span-2">Результат<textarea rows={3} value={getPortfolioField('result')} onChange={event => setPortfolioField('result', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
          {editingType === 'case' && <label className="text-xs font-bold text-slate-700 md:col-span-2">Метрики ({language.toUpperCase()}): Название | Значение<textarea rows={5} value={metricsToText(draft[language === 'ru' ? 'metrics' : `metrics_${language}`])} onChange={event => patchDraft({ [language === 'ru' ? 'metrics' : `metrics_${language}`]: metricsFromText(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
          <label className="text-xs font-bold text-slate-700 md:col-span-2">Slug / URL<div className="mt-1 flex overflow-hidden rounded-xl border border-slate-300"><span className="bg-slate-100 px-3 py-2.5 text-xs text-slate-500">{slugPrefix}</span><input value={stringValue(draft.slug)} onChange={event => patchDraft({ slug: event.target.value })} placeholder="auto-from-title" className="min-w-0 flex-1 px-3 py-2.5 font-normal text-sm outline-none" /></div></label>
          {editingType === 'gallery' && <label className="text-xs font-bold text-slate-700">Порядок<input type="number" value={Number(draft.order ?? 999)} onChange={event => patchDraft({ order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label>}
          {editingType === 'video' && <><label className="text-xs font-bold text-slate-700">Порядок<input type="number" value={Number(draft.order ?? 999)} onChange={event => patchDraft({ order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label><label className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-800"><input type="checkbox" checked={Boolean(draft.featured)} onChange={event => patchDraft({ featured: event.target.checked })} className="h-4 w-4" />Featured</label></>}
          {editingType === 'case' && <><label className="text-xs font-bold text-slate-700">Видео badge<input value={stringValue(draft.videoBadge)} onChange={event => patchDraft({ videoBadge: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label><label className="text-xs font-bold text-slate-700">Порядок на главной<input type="number" value={Number(draft.featuredOrder ?? 99)} onChange={event => patchDraft({ featuredOrder: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal text-sm" /></label><label className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-800"><input type="checkbox" checked={Boolean(draft.featured)} onChange={event => patchDraft({ featured: event.target.checked })} className="h-4 w-4" />Показывать на главной</label></>}
        </div>
      </section>
    );
  };

  const renderCaseMedia = () => {
    if (!draft) return null;
    const media = caseMedia();
    return (
      <div className="space-y-5">
        <AdminImageField label="Обложка кейса" value={stringValue(draft.imageUrl)} onChange={imageUrl => patchDraft({ imageUrl })} previewAlt={primaryTitle('case', draft)} />
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-950">Фото и видео</h3><p className="mt-1 text-xs text-slate-500">Общая медиатека, загрузка фото и URL YouTube/Vimeo/MP4.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setPickerMode({ kind: 'case-media' })} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"><Library className="h-4 w-4" />Медиатека</button><input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => void uploadImages(event.target.files)} /><button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Загрузить фото</button></div></div>
          <div className="mt-4 flex gap-2"><input value={newMediaUrl} onChange={event => setNewMediaUrl(event.target.value)} placeholder="YouTube / Vimeo / MP4 / image URL" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><button type="button" onClick={addMediaUrl} className="rounded-xl bg-slate-900 px-4 text-xs font-bold text-white">Добавить URL</button></div>
          <div className="mt-5 space-y-3">{media.map((item, index) => {
            const preview = getMediaPreview(item);
            const fieldKey = (base: 'title' | 'caption' | 'alt') => language === 'ru' ? base : `${base}_${language}`;
            const patchMedia = (patch: Partial<CaseMediaItem>) => patchDraft({ media: media.map(current => current.id === item.id ? { ...current, ...patch } : current) });
            return <div key={item.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[150px_minmax(0,1fr)_auto]">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">{preview ? <ResponsiveImage src={preview} alt="" displayWidth={360} sizes="150px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/40">{item.type === 'image' ? <ImageIcon className="h-8 w-8" /> : <Film className="h-8 w-8" />}</div>}{draft.imageUrl === item.url && item.type === 'image' && <span className="absolute bottom-2 left-2 rounded bg-amber-400 px-2 py-1 text-[9px] font-black">COVER</span>}</div>
              <div className="space-y-2"><div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)]"><select value={item.type} onChange={event => patchMedia({ type: event.target.value as CaseMediaType })} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"><option value="image">Фото</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="video">Video</option></select><input value={item.url} onChange={event => { const url = event.target.value; const type = detectCaseMediaType(url); patchMedia({ url, type, thumbnailUrl: type === 'youtube' ? getYouTubeThumbnail(url) || undefined : item.thumbnailUrl }); }} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /></div><input value={stringValue((item as UnifiedRecord)[fieldKey('title')])} onChange={event => patchMedia({ [fieldKey('title')]: event.target.value })} placeholder={`Название · ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><textarea rows={2} value={stringValue((item as UnifiedRecord)[fieldKey('caption')])} onChange={event => patchMedia({ [fieldKey('caption')]: event.target.value })} placeholder={`Подпись · ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" />{item.type === 'image' && <input value={stringValue((item as UnifiedRecord)[fieldKey('alt')])} onChange={event => patchMedia({ [fieldKey('alt')]: event.target.value })} placeholder={`ALT · ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" />}</div>
              <div className="flex gap-1 lg:flex-col">{item.type === 'image' && draft.imageUrl !== item.url && <button type="button" onClick={() => patchDraft({ imageUrl: item.url })} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50" title="Сделать обложкой">★</button>}<button type="button" onClick={() => patchDraft({ media: moveItem(media, index, -1) })} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => patchDraft({ media: moveItem(media, index, 1) })} disabled={index === media.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => patchDraft({ media: media.filter(current => current.id !== item.id) })} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>
            </div>;
          })}{media.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">Медиа пока нет.</div>}</div>
        </section>
      </div>
    );
  };

  const renderGalleryMedia = () => {
    if (!draft) return null;
    const images = galleryImages();
    return <div className="space-y-5"><AdminImageField label="Обложка галереи" value={stringValue(draft.coverUrl)} onChange={coverUrl => patchDraft({ coverUrl })} previewAlt={primaryTitle('gallery', draft)} /><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-950">Фотографии</h3><p className="mt-1 text-xs text-slate-500">До 50 фото за загрузку, повторное использование из медиатеки, ALT и подписи на каждом языке.</p></div><div className="flex gap-2"><button type="button" onClick={() => setPickerMode({ kind: 'gallery-media' })} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs font-bold text-fuchsia-700"><Library className="h-4 w-4" />Медиатека</button><input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={event => void uploadImages(event.target.files)} /><button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Загрузить</button></div></div><div className="mt-5 space-y-3">{images.map((image, index) => { const altKey = language === 'ru' ? 'alt' : `alt_${language}`; const captionKey = language === 'ru' ? 'caption' : `caption_${language}`; const patchImage = (patch: Partial<GalleryImage>) => patchDraft({ images: images.map(current => current.id === image.id ? { ...current, ...patch } : current) }); return <div key={image.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[150px_minmax(0,1fr)_auto]"><div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"><img src={image.url} alt="" className="h-full w-full object-cover" />{draft.coverUrl === image.url && <span className="absolute bottom-2 left-2 rounded bg-amber-400 px-2 py-1 text-[9px] font-black">COVER</span>}</div><div className="space-y-2"><input value={stringValue((image as UnifiedRecord)[altKey])} onChange={event => patchImage({ [altKey]: event.target.value })} placeholder={`ALT · ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><textarea rows={2} value={stringValue((image as UnifiedRecord)[captionKey])} onChange={event => patchImage({ [captionKey]: event.target.value })} placeholder={`Подпись · ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><div className="truncate text-[10px] text-slate-400">{image.url}</div></div><div className="flex gap-1 lg:flex-col">{draft.coverUrl !== image.url && <button type="button" onClick={() => patchDraft({ coverUrl: image.url })} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50">★</button>}<button type="button" onClick={() => patchDraft({ images: moveItem(images, index, -1) })} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => patchDraft({ images: moveItem(images, index, 1) })} disabled={index === images.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => patchDraft({ images: images.filter(current => current.id !== image.id) })} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>; })}{images.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">Фотографий пока нет.</div>}</div></section></div>;
  };

  const renderVideoMedia = () => {
    if (!draft) return null;
    const videos = videoMedia();
    return <div className="space-y-5"><AdminImageField label="Обложка видеопроекта" value={stringValue(draft.coverUrl)} onChange={coverUrl => patchDraft({ coverUrl })} previewAlt={primaryTitle('video', draft)} /><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-950">Видео проекта</h3><p className="mt-1 text-xs text-slate-500">YouTube, Vimeo, прямые MP4/WebM, загрузка и медиатека.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setPickerMode({ kind: 'video-media' })} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700"><Library className="h-4 w-4" />Медиатека</button><input ref={videoInputRef} type="file" accept="video/mp4,video/webm" multiple className="hidden" onChange={event => void uploadVideos(event.target.files)} /><button type="button" onClick={() => videoInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Загрузить видео</button></div></div><div className="mt-4 flex gap-2"><input value={newMediaUrl} onChange={event => setNewMediaUrl(event.target.value)} placeholder="YouTube / Vimeo / MP4 URL" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><button type="button" onClick={addMediaUrl} className="rounded-xl bg-slate-900 px-4 text-xs font-bold text-white">Добавить URL</button></div><div className="mt-5 space-y-3">{videos.map((media, index) => { const titleKey = language === 'ru' ? 'title' : `title_${language}`; const captionKey = language === 'ru' ? 'caption' : `caption_${language}`; const patchMedia = (patch: Partial<VideoProjectMedia>) => patchDraft({ videos: videos.map(current => current.id === media.id ? { ...current, ...patch } : current) }); const poster = videoMediaPoster(media); return <div key={media.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[150px_minmax(0,1fr)_auto]"><div className="aspect-video overflow-hidden rounded-xl bg-slate-900">{poster ? <ResponsiveImage src={poster} alt="" displayWidth={360} sizes="150px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/40"><Film className="h-8 w-8" /></div>}</div><div className="space-y-2"><input value={media.url} onChange={event => patchMedia({ url: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><div className="grid gap-2 sm:grid-cols-2"><select value={media.format || '16:9'} onChange={event => patchMedia({ format: event.target.value as VideoProjectFormat })} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option></select><div className="flex gap-2"><input value={media.posterUrl || ''} onChange={event => patchMedia({ posterUrl: event.target.value })} placeholder="Poster URL" className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><button type="button" onClick={() => setPickerMode({ kind: 'video-poster', mediaId: media.id })} className="rounded-xl border border-slate-300 bg-white px-3 text-indigo-600"><Library className="h-4 w-4" /></button></div></div><input value={stringValue((media as UnifiedRecord)[titleKey])} onChange={event => patchMedia({ [titleKey]: event.target.value })} placeholder={`Название · ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><input value={stringValue((media as UnifiedRecord)[captionKey])} onChange={event => patchMedia({ [captionKey]: event.target.value })} placeholder={`Подпись · ${language.toUpperCase()}`} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /></div><div className="flex gap-1 lg:flex-col"><button type="button" onClick={() => patchDraft({ videos: moveItem(videos, index, -1) })} disabled={index === 0} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => patchDraft({ videos: moveItem(videos, index, 1) })} disabled={index === videos.length - 1} className="rounded-lg p-2 text-slate-500 hover:bg-white disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => patchDraft({ videos: videos.filter(current => current.id !== media.id) })} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div>; })}{videos.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">Видео пока нет.</div>}</div></section></div>;
  };

  const renderMediaTab = () => {
    if (!draft || !editingType) return null;
    if (editingType === 'case') return renderCaseMedia();
    if (editingType === 'gallery') return renderGalleryMedia();
    if (editingType === 'video') return renderVideoMedia();
    return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><AdminImageField label="Обложка статьи" value={stringValue(draft.coverImage)} onChange={coverImage => patchDraft({ coverImage })} previewAlt={primaryTitle('article', draft)} helperText="Для изображений внутри текста пока используется обычный URL/медиатека в контентных блоках; эта обложка участвует в карточке, sitemap image и SEO fallback." /></section>;
  };

  const renderRelationsTab = () => {
    if (!draft || !editingType) return null;
    if (editingType !== 'article') return <PortfolioRelationsField ref={relationsRef} entityType={editingType} entityId={String(draft.id)} entityTitle={primaryTitle(editingType, draft) || 'Новый материал'} />;
    const groups: Array<{ field: 'relatedCaseIds' | 'relatedGalleryIds' | 'relatedVideoProjectIds'; type: PublishQualityType; label: string }> = [
      { field: 'relatedCaseIds', type: 'case', label: 'Кейсы' },
      { field: 'relatedGalleryIds', type: 'gallery', label: 'Галереи' },
      { field: 'relatedVideoProjectIds', type: 'video', label: 'Видео' },
    ];
    return <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6"><div><div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700"><Link2 className="h-3.5 w-3.5" />Article relations</div><h3 className="mt-2 text-lg font-black text-slate-950">Связать статью с портфолио</h3><p className="mt-1 text-xs text-slate-500">Связи статьи сохраняются прямо в документе как relatedCaseIds / relatedGalleryIds / relatedVideoProjectIds и не ломают существующую portfolio relation-схему.</p></div><div className="mt-5 grid gap-5 xl:grid-cols-3">{groups.map(group => { const selected = new Set(Array.isArray(draft[group.field]) ? draft[group.field].map(String) : []); const candidates = items.filter(item => item.type === group.type); return <div key={group.field}><div className="mb-2 text-sm font-black text-slate-900">{group.label} <span className="text-xs text-violet-600">{selected.size}</span></div><div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">{candidates.map(item => <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 ${selected.has(item.id) ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleArticleRelation(group.field, item.id)} className="h-4 w-4 accent-violet-600" />{item.cover ? <img src={item.cover} alt="" className="h-10 w-14 rounded-lg object-cover" /> : <div className="h-10 w-14 rounded-lg bg-slate-200" />}<span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-900">{item.title}</span><span className="block truncate text-[10px] text-slate-400">{item.slug}</span></span></label>)}</div></div>; })}</div></section>;
  };

  const renderPreviewTab = () => {
    if (!draft || !editingType) return null;
    const title = contentTitle(editingType, draft, language);
    const description = contentDescription(editingType, draft, language);
    const cover = contentCover(editingType, draft);
    return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]"><section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="aspect-video bg-slate-900">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/25"><Eye className="h-14 w-14" /></div>}</div><div className="p-6"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">{TYPE_META[editingType].label} · {language.toUpperCase()}</div><h3 className="mt-2 text-2xl font-black text-slate-950">{title || 'Без названия'}</h3><p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{description || 'Описание пока не заполнено.'}</p><div className="mt-5 rounded-xl bg-slate-50 px-3 py-2 text-xs text-indigo-600">{publicPath}</div>{publicPath && <Link to={publicPath} target="_blank" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-indigo-600"><Eye className="h-4 w-4" />Открыть текущую публичную страницу</Link>}</div></section><aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-44 xl:self-start"><div className="text-xs font-black uppercase tracking-wider text-slate-500">Publish Quality Gate</div><div className="mt-4 space-y-2">{issues.length === 0 ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">✓ Критических проблем и предупреждений не найдено.</div> : issues.map(issue => <div key={issue.code} className={`rounded-2xl border p-3 text-sm ${issue.severity === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><div className="font-black">{issue.severity === 'error' ? 'Ошибка' : 'Предупреждение'}</div><div className="mt-0.5 text-xs">{issue.label}</div></div>)}</div><div className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">Ошибки блокируют публикацию. Предупреждения требуют явного подтверждения. Черновик можно сохранить с предупреждениями, если slug уникален.</div></aside></div>;
  };

  const sections = useMemo<UnifiedEditorSection[]>(() => {
    if (!draft || !editingType) return [];
    const seoFallback = {
      title: contentTitle(editingType, draft, language),
      description: contentDescription(editingType, draft, language),
      socialImage: contentCover(editingType, draft),
    };
    return [
      { id: 'content', label: 'Контент', icon: <FileText className="h-4 w-4" />, content: renderContentTab() },
      { id: 'media', label: 'Медиа', icon: <Images className="h-4 w-4" />, badge: editingType === 'case' ? caseMedia().length : editingType === 'gallery' ? galleryImages().length : editingType === 'video' ? videoMedia().length : (draft.coverImage ? 1 : 0), content: renderMediaTab() },
      { id: 'taxonomy', label: 'Taxonomy', icon: <Tags className="h-4 w-4" />, content: <UnifiedTaxonomyPanel value={draft} onPatch={patchDraft} articleCategory={editingType === 'article' ? stringValue(draft.category) : undefined} onArticleCategoryChange={editingType === 'article' ? value => setArticleCategory(value as ArticleCategory) : undefined} articleCategories={editingType === 'article' ? ARTICLE_CATEGORIES : undefined} /> },
      { id: 'relations', label: 'Связи', icon: <Link2 className="h-4 w-4" />, content: renderRelationsTab() },
      { id: 'seo', label: 'SEO', icon: <FileSearch className="h-4 w-4" />, content: <UnifiedSeoPanel value={draft} locale={language} fallback={seoFallback} publicPath={publicPath} onPatch={patchDraft} /> },
      { id: 'preview', label: 'Preview & Quality', icon: <Eye className="h-4 w-4" />, badge: issues.length || undefined, content: renderPreviewTab() },
    ];
  }, [draft, editingType, language, publicPath, issues]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700"><FileText className="h-3.5 w-3.5" />Unified Content Editor 1.0</div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Единый редактор контента</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">Cases / Galleries / Videos / Articles теперь редактируются в одной архитектуре: Content → Media → Taxonomy → Relations → SEO → Preview & Quality. Форматы существующих Firestore-документов сохраняются.</p>
          </div>
          <button type="button" onClick={createNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500"><Plus className="h-4 w-4" />Создать: {TYPE_META[typeFilter].label}</button>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
            {(Object.keys(TYPE_META) as PublishQualityType[]).map(type => { const Icon = TYPE_META[type].icon; return <button key={type} type="button" onClick={() => setTypeFilter(type)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black ${typeFilter === type ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Icon className="h-4 w-4" />{TYPE_META[type].plural}<span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] text-slate-600">{counts[type]}</span></button>; })}
          </div>
          <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder={`Поиск: ${TYPE_META[typeFilter].plural.toLowerCase()}…`} className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" /></div>
        </div>
      </section>

      {error && !draft && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">Материалов этого типа пока нет. Создайте первый.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map(item => { const Icon = TYPE_META[item.type].icon; return <article key={item.key} className="flex overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="w-32 shrink-0 bg-slate-900 sm:w-40">{item.cover ? <img src={item.cover} alt="" className="h-full min-h-44 w-full object-cover" /> : <div className="flex h-full min-h-44 items-center justify-center text-white/25"><Icon className="h-10 w-10" /></div>}</div><div className="min-w-0 flex-1 p-4"><div className="flex items-center gap-2"><span className="text-[9px] font-black uppercase tracking-wider text-indigo-600">{TYPE_META[item.type].label}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${item.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.published ? 'LIVE' : 'DRAFT'}</span></div><h3 className="mt-2 line-clamp-2 text-sm font-black text-slate-950">{item.title}</h3><div className="mt-1 truncate text-[10px] text-slate-400">{item.path}</div><p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{contentDescription(item.type, item.data)}</p><div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3"><button type="button" onClick={() => openEditor(item)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-bold text-white hover:bg-indigo-600"><Edit3 className="h-3.5 w-3.5" />Редактировать</button><Link to={item.path} target="_blank" className="rounded-xl p-2 text-indigo-600 hover:bg-indigo-50" title="Открыть"><Eye className="h-4 w-4" /></Link><button type="button" onClick={() => void remove(item)} className="ml-auto rounded-xl p-2 text-red-500 hover:bg-red-50" title="Удалить"><Trash2 className="h-4 w-4" /></button></div></div></article>; })}
        </div>
      )}

      {draft && editingType && (
        <UnifiedContentEditorShell
          type={editingType}
          title={contentTitle(editingType, draft, language) || `Новый: ${TYPE_META[editingType].label}`}
          id={String(draft.id)}
          publicPath={publicPath}
          published={draft.published !== false}
          onPublishedChange={published => patchDraft({ published })}
          language={language}
          onLanguageChange={setLanguage}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sections={sections}
          issues={issues}
          saving={saving}
          busy={uploading}
          error={error}
          onClose={closeEditor}
          onSubmit={save}
          saveLabel={`Сохранить ${TYPE_META[editingType].label.toLowerCase()}`}
        />
      )}

      {pickerMode?.kind === 'case-media' && <MediaLibraryPicker type="all" multiple title="Добавить медиа в кейс" onSelectMany={addFromLibrary} onClose={() => setPickerMode(null)} />}
      {pickerMode?.kind === 'gallery-media' && <MediaLibraryPicker type="image" multiple title="Добавить фотографии" onSelectMany={addFromLibrary} onClose={() => setPickerMode(null)} />}
      {pickerMode?.kind === 'video-media' && <MediaLibraryPicker type="video" multiple title="Добавить видео" onSelectMany={addFromLibrary} onClose={() => setPickerMode(null)} />}
      {pickerMode?.kind === 'video-poster' && <MediaLibraryPicker type="image" title="Выбрать poster" onSelect={choosePoster} onClose={() => setPickerMode(null)} />}
    </div>
  );
}
