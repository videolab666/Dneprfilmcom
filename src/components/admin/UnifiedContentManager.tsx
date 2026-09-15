import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckSquare,
  CircleGauge,
  Edit3,
  Eye,
  FileSearch,
  FileText,
  Film,
  Images,
  Link2,
  Loader2,
  Plus,
  Search,
  Tags,
  Trash2,
} from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ArticleCategory, ArticleTranslation, CaseMediaItem, CaseStudy, Locale } from '../../types';
import { getCaseSlug, getYouTubeThumbnail, normalizedCaseMedia, slugifyCase } from '../../lib/caseMedia';
import { articleCategoryLabel, normalizeArticle, slugifyArticleTitle } from '../../lib/articleCms';
import {
  GALLERY_COLLECTION,
  GALLERY_KIND,
  galleryCover,
  getGallerySlug,
  isPhotoGallery,
  type GalleryImage,
  type PhotoGallery,
} from '../../lib/galleryContent';
import {
  VIDEO_PROJECT_COLLECTION,
  VIDEO_PROJECT_KIND,
  getVideoProjectSlug,
  isVideoProject,
  videoProjectCover,
  type VideoProject,
  type VideoProjectMedia,
} from '../../lib/videoPortfolio';
import {
  evaluatePublishQuality,
  requestPublishApproval,
  type PublishQualityType,
} from '../../lib/publishQuality';
import { evaluateContentHealth } from '../../lib/contentHealth';
import {
  clearUnifiedDraft,
  draftFingerprint,
  isRecoverableDraft,
  readLatestNewUnifiedDraft,
  readUnifiedDraft,
  saveUnifiedDraft,
} from '../../lib/unifiedDraftRecovery';
import { cleanupPortfolioRelations } from '../../lib/portfolioRelationsAdmin';
import {
  PortfolioRelationsField,
  type PortfolioRelationsFieldHandle,
} from './PortfolioRelationsField';
import {
  UnifiedContentEditorShell,
  type UnifiedEditorSection,
  type UnifiedEditorTabId,
} from './UnifiedContentEditorShell';
import {
  UnifiedContentFields,
  articleTranslation,
  portfolioField,
  type UnifiedContentRecord,
} from './UnifiedContentFields';
import { UnifiedContentHealthPanel } from './UnifiedContentHealthPanel';
import { UnifiedMediaPanel } from './UnifiedMediaPanel';
import { UnifiedSeoPanel } from './UnifiedSeoPanel';
import { UnifiedTaxonomyPanel } from './UnifiedTaxonomyPanel';

interface ContentItem {
  key: string;
  type: PublishQualityType;
  id: string;
  collectionName: 'cases' | 'site_settings' | 'articles';
  data: UnifiedContentRecord;
  title: string;
  description: string;
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

const PORTFOLIO_CATEGORY_OPTIONS = [
  ['advertising', 'Реклама'],
  ['industry', 'Промышленность'],
  ['medicine', 'Медицина'],
  ['construction', 'Строительство'],
  ['live', 'Live'],
  ['sport', 'Спорт'],
  ['events', 'Мероприятия'],
  ['other', 'Другое'],
] as const;

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function nowDate(): string {
  return new Date().toISOString().slice(0, 10);
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

function emptyRecord(type: PublishQualityType): UnifiedContentRecord {
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
    uk: emptyArticleTranslation('uk'),
    ru: emptyArticleTranslation('ru'),
    en: emptyArticleTranslation('en'),
    taxonomy: { category: 'other', tags: [] },
    relatedCaseIds: [], relatedGalleryIds: [], relatedVideoProjectIds: [],
  };
}

function titleFor(type: PublishQualityType, data: UnifiedContentRecord, locale: Locale = 'uk'): string {
  if (type === 'article') {
    return articleTranslation(data, locale).title
      || articleTranslation(data, 'uk').title
      || articleTranslation(data, 'ru').title
      || articleTranslation(data, 'en').title
      || text(data.id)
      || 'Без названия';
  }
  return portfolioField(data, 'title', locale)
    || text(data.title_uk)
    || text(data.title)
    || text(data.title_en)
    || text(data.id)
    || 'Без названия';
}

function descriptionFor(type: PublishQualityType, data: UnifiedContentRecord, locale: Locale = 'uk'): string {
  if (type === 'article') return articleTranslation(data, locale).summary;
  return portfolioField(data, 'description', locale)
    || portfolioField(data, 'result', locale)
    || portfolioField(data, 'challenge', locale);
}

function coverFor(type: PublishQualityType, data: UnifiedContentRecord): string {
  if (type === 'case') return text(data.imageUrl);
  if (type === 'article') return text(data.coverImage);
  if (type === 'gallery') return galleryCover(data as unknown as PhotoGallery);
  return videoProjectCover(data as unknown as VideoProject);
}

function slugFor(type: PublishQualityType, data: UnifiedContentRecord): string {
  if (type === 'case') return getCaseSlug(data as unknown as CaseStudy);
  if (type === 'gallery') return getGallerySlug(data as unknown as PhotoGallery);
  if (type === 'video') return getVideoProjectSlug(data as unknown as VideoProject);
  return normalizeArticle(text(data.id), data).slug;
}

function pathFor(type: PublishQualityType, slug: string): string {
  if (type === 'case') return `/cases/${encodeURIComponent(slug)}`;
  if (type === 'gallery') return `/galleries/${encodeURIComponent(slug)}`;
  if (type === 'video') return `/videos/${encodeURIComponent(slug)}`;
  return `/media-center/${encodeURIComponent(slug)}`;
}

function itemFrom(type: PublishQualityType, id: string, raw: UnifiedContentRecord): ContentItem {
  const data: UnifiedContentRecord = type === 'article'
    ? { ...raw, ...normalizeArticle(id, raw), id }
    : { id, ...raw };
  const slug = slugFor(type, data);
  return {
    key: `${type}:${id}`,
    type,
    id,
    collectionName: type === 'case' ? 'cases' : type === 'article' ? 'articles' : 'site_settings',
    data,
    title: titleFor(type, data),
    description: descriptionFor(type, data),
    slug,
    path: pathFor(type, slug),
    cover: coverFor(type, data),
    published: data.published !== false,
    updatedAt: Number(data.updatedAt || data.publishedAt || data.createdAt || 0),
  };
}

function prepareDraft(item: ContentItem): UnifiedContentRecord {
  if (item.type === 'case') {
    const typed = item.data as unknown as CaseStudy;
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

function primaryTitle(type: PublishQualityType, data: UnifiedContentRecord): string {
  if (type === 'article') return articleTranslation(data, 'uk').title || articleTranslation(data, 'ru').title || articleTranslation(data, 'en').title;
  return text(data.title_uk) || text(data.title) || text(data.title_en);
}

function resolvedSlug(type: PublishQualityType, data: UnifiedContentRecord): string {
  const explicit = text(data.slug).trim();
  if (explicit) return type === 'article' ? slugifyArticleTitle(explicit) : slugifyCase(explicit);
  if (type === 'case') return getCaseSlug(data as unknown as CaseStudy);
  if (type === 'gallery') return getGallerySlug(data as unknown as PhotoGallery);
  if (type === 'video') return getVideoProjectSlug(data as unknown as VideoProject);
  return slugifyArticleTitle(primaryTitle(type, data) || text(data.id) || 'article');
}

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function taxonomyRecord(data: UnifiedContentRecord): Record<string, unknown> {
  return data.taxonomy && typeof data.taxonomy === 'object' ? data.taxonomy as Record<string, unknown> : {};
}

export function UnifiedContentManager() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<PublishQualityType>('case');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<PublishQualityType | null>(null);
  const [draft, setDraft] = useState<UnifiedContentRecord | null>(null);
  const [language, setLanguage] = useState<Locale>('uk');
  const [activeTab, setActiveTab] = useState<UnifiedEditorTabId>('content');
  const [saving, setSaving] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set<string>());
  const [bulkCategory, setBulkCategory] = useState('other');
  const [bulkTag, setBulkTag] = useState('');
  const [baselineFingerprint, setBaselineFingerprint] = useState('');
  const [sourceUpdatedAt, setSourceUpdatedAt] = useState(0);
  const [autosavedAt, setAutosavedAt] = useState<number | null>(null);
  const [recovered, setRecovered] = useState(false);
  const relationsRef = useRef<PortfolioRelationsFieldHandle>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [casesSnapshot, gallerySnapshot, videoSnapshot, articleSnapshot] = await Promise.all([
        getDocs(collection(db, 'cases')),
        getDocs(query(collection(db, GALLERY_COLLECTION), where('kind', '==', GALLERY_KIND))),
        getDocs(query(collection(db, VIDEO_PROJECT_COLLECTION), where('kind', '==', VIDEO_PROJECT_KIND))),
        getDocs(collection(db, 'articles')),
      ]);
      const galleryDocs = gallerySnapshot.docs
        .map(snapshot => ({ id: snapshot.id, ...snapshot.data() }))
        .filter(isPhotoGallery);
      const videoDocs = videoSnapshot.docs
        .map(snapshot => ({ id: snapshot.id, ...snapshot.data() }))
        .filter(isVideoProject);
      const next: ContentItem[] = [
        ...casesSnapshot.docs.map(snapshot => itemFrom('case', snapshot.id, snapshot.data() as UnifiedContentRecord)),
        ...galleryDocs.map(item => itemFrom('gallery', item.id, item as unknown as UnifiedContentRecord)),
        ...videoDocs.map(item => itemFrom('video', item.id, item as unknown as UnifiedContentRecord)),
        ...articleSnapshot.docs.map(snapshot => itemFrom('article', snapshot.id, snapshot.data() as UnifiedContentRecord)),
      ];
      next.sort((a, b) => b.updatedAt - a.updatedAt || a.title.localeCompare(b.title));
      setItems(next);
      const validKeys = new Set<string>(next.map(item => item.key));
      setSelected(current => new Set<string>(Array.from(current).filter((key: string) => validKeys.has(key))));
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    setSelected(new Set<string>());
  }, [typeFilter]);

  const counts = useMemo(() => ({
    case: items.filter(item => item.type === 'case').length,
    gallery: items.filter(item => item.type === 'gallery').length,
    video: items.filter(item => item.type === 'video').length,
    article: items.filter(item => item.type === 'article').length,
  }), [items]);

  const filteredItems = useMemo(() => {
    const queryText = searchText.trim().toLowerCase();
    return items.filter(item => item.type === typeFilter && (!queryText || `${item.title} ${item.slug} ${item.description}`.toLowerCase().includes(queryText)));
  }, [items, searchText, typeFilter]);

  const selectedItems = useMemo(() => items.filter(item => selected.has(item.key)), [items, selected]);
  const dirty = Boolean(draft && baselineFingerprint && draftFingerprint(draft) !== baselineFingerprint);

  const patchDraft = (patch: UnifiedContentRecord) => setDraft(current => current ? { ...current, ...patch } : current);

  const openEditor = (item: ContentItem) => {
    const original = prepareDraft(item);
    const local = readUnifiedDraft<UnifiedContentRecord>(item.type, item.id);
    let next = original;
    let didRecover = false;
    if (isRecoverableDraft(local, item.updatedAt, original)) {
      const restore = window.confirm(`Найдена локальная несохранённая версия «${item.title}» от ${new Date(local!.savedAt).toLocaleString('ru-RU')}.\n\nВосстановить её?`);
      if (restore) {
        next = local!.data;
        didRecover = true;
      } else {
        clearUnifiedDraft(item.type, item.id);
      }
    }
    setEditingType(item.type);
    setDraft(next);
    setBaselineFingerprint(draftFingerprint(original));
    setSourceUpdatedAt(item.updatedAt);
    setAutosavedAt(didRecover ? local!.savedAt : null);
    setRecovered(didRecover);
    setLanguage('uk');
    setActiveTab('content');
    setError('');
  };

  const createNew = () => {
    const original = emptyRecord(typeFilter);
    const local = readLatestNewUnifiedDraft<UnifiedContentRecord>(typeFilter);
    let next = original;
    let didRecover = false;
    if (local) {
      const restore = window.confirm(`Есть локальный несохранённый новый материал типа «${TYPE_META[typeFilter].label}» от ${new Date(local.savedAt).toLocaleString('ru-RU')}.\n\nПродолжить его редактирование?`);
      if (restore) {
        next = local.data;
        didRecover = true;
      } else {
        clearUnifiedDraft(typeFilter, local.id);
      }
    }
    setEditingType(typeFilter);
    setDraft(next);
    setBaselineFingerprint(didRecover ? draftFingerprint({}) : draftFingerprint(original));
    setSourceUpdatedAt(0);
    setAutosavedAt(didRecover ? local!.savedAt : null);
    setRecovered(didRecover);
    setLanguage('uk');
    setActiveTab('content');
    setError('');
  };

  const closeEditor = (force = false) => {
    if (!force && draft && editingType && dirty) {
      const confirmed = window.confirm('Есть несохранённые изменения. Закрыть редактор?\n\nЛокальная копия останется в браузере и будет предложена для восстановления при следующем открытии.');
      if (!confirmed) return;
      saveUnifiedDraft(editingType, String(draft.id), clean(draft), sourceUpdatedAt);
    }
    setEditingType(null);
    setDraft(null);
    setBaselineFingerprint('');
    setSourceUpdatedAt(0);
    setAutosavedAt(null);
    setRecovered(false);
    setError('');
    setMediaBusy(false);
  };

  const duplicateSlug = useMemo(() => {
    if (!draft || !editingType) return false;
    const slug = resolvedSlug(editingType, draft).toLowerCase();
    return items.some(item => item.type === editingType && item.id !== draft.id && item.slug.toLowerCase() === slug);
  }, [draft, editingType, items]);

  const brokenRelation = useMemo(() => {
    if (!draft || editingType !== 'article') return false;
    const sets = {
      relatedCaseIds: new Set<string>(items.filter(item => item.type === 'case').map(item => item.id)),
      relatedGalleryIds: new Set<string>(items.filter(item => item.type === 'gallery').map(item => item.id)),
      relatedVideoProjectIds: new Set<string>(items.filter(item => item.type === 'video').map(item => item.id)),
    };
    return (['relatedCaseIds', 'relatedGalleryIds', 'relatedVideoProjectIds'] as const).some(field =>
      (Array.isArray(draft[field]) ? draft[field].map(String) : []).some((id: string) => sets[field].has(id) === false),
    );
  }, [draft, editingType, items]);

  const issues = useMemo(() => editingType && draft
    ? evaluatePublishQuality(editingType, draft, { duplicateSlug, brokenRelation })
    : [], [draft, duplicateSlug, brokenRelation, editingType]);

  const healthReport = useMemo(() => editingType && draft
    ? evaluateContentHealth(editingType, draft, { duplicateSlug, brokenRelation })
    : null, [draft, duplicateSlug, brokenRelation, editingType]);

  const publicPath = editingType && draft ? pathFor(editingType, resolvedSlug(editingType, draft)) : '';

  useEffect(() => {
    if (!draft || !editingType || !dirty || saving) return;
    const timer = window.setTimeout(() => {
      const snapshot = saveUnifiedDraft(editingType, String(draft.id), clean(draft), sourceUpdatedAt);
      if (snapshot) setAutosavedAt(snapshot.savedAt);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draft, editingType, dirty, saving, sourceUpdatedAt]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const prepareForSave = (type: PublishQualityType, value: UnifiedContentRecord): UnifiedContentRecord => {
    let prepared: UnifiedContentRecord = {
      ...value,
      slug: resolvedSlug(type, value),
      updatedAt: Date.now(),
    };

    if (type === 'case') {
      const media: CaseMediaItem[] = (Array.isArray(prepared.media) ? prepared.media : [])
        .filter((item: CaseMediaItem) => item.url?.trim())
        .map((item: CaseMediaItem) => {
          const mediaUrl = item.url.trim();
          return {
            ...item,
            url: mediaUrl,
            thumbnailUrl: item.type === 'youtube' ? item.thumbnailUrl || getYouTubeThumbnail(mediaUrl) || undefined : item.thumbnailUrl,
          };
        });
      prepared = {
        ...prepared,
        media,
        imageUrl: text(prepared.imageUrl) || media.find(item => item.type === 'image')?.url || '',
        videoUrl: text(prepared.videoUrl) || media.find(item => item.type !== 'image')?.url || '',
      };
    } else if (type === 'gallery') {
      const images: GalleryImage[] = (Array.isArray(prepared.images) ? prepared.images : [])
        .filter((item: GalleryImage) => item.url?.trim())
        .map((item: GalleryImage) => ({ ...item, url: item.url.trim() }));
      prepared = { ...prepared, kind: GALLERY_KIND, images, coverUrl: text(prepared.coverUrl) || images[0]?.url || '' };
    } else if (type === 'video') {
      const videos: VideoProjectMedia[] = (Array.isArray(prepared.videos) ? prepared.videos : []).filter((item: VideoProjectMedia) => item.url?.trim());
      prepared = { ...prepared, kind: VIDEO_PROJECT_KIND, videos };
    } else {
      prepared = {
        ...prepared,
        uk: articleTranslation(prepared, 'uk'),
        ru: articleTranslation(prepared, 'ru'),
        en: articleTranslation(prepared, 'en'),
        category: (prepared.category || 'live') as ArticleCategory,
        publishedAt: prepared.publishedAt || Date.now(),
      };
    }
    return prepared;
  };

  const persistDraft = async (closeAfter = false) => {
    if (!editingType || !draft || saving || mediaBusy) return;
    if (!primaryTitle(editingType, draft).trim()) {
      setError('Укажите название хотя бы на одном языке.');
      setActiveTab('content');
      return;
    }
    if (duplicateSlug) {
      setError('Slug уже используется другим материалом этого типа.');
      setActiveTab('health');
      return;
    }

    const prepared = prepareForSave(editingType, draft);
    if (prepared.published !== false && !requestPublishApproval(editingType, prepared, { duplicateSlug: false, brokenRelation }).allowed) return;

    setSaving(true);
    setError('');
    try {
      const collectionName = editingType === 'case' ? 'cases' : editingType === 'article' ? 'articles' : 'site_settings';
      await setDoc(doc(db, collectionName, String(prepared.id)), clean(prepared));
      if (editingType !== 'article') await relationsRef.current?.save();
      clearUnifiedDraft(editingType, String(prepared.id));
      setDraft(prepared);
      setBaselineFingerprint(draftFingerprint(prepared));
      setSourceUpdatedAt(Number(prepared.updatedAt || Date.now()));
      setAutosavedAt(null);
      setRecovered(false);
      await load();
      if (closeAfter) closeEditor(true);
    } catch (reason) {
      console.error(reason);
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void persistDraft(false);
  };

  useEffect(() => {
    if (!draft || !editingType) return;
    const handler = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void persistDraft(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [draft, editingType, saving, mediaBusy, duplicateSlug, brokenRelation]);

  const remove = async (item: ContentItem) => {
    if (!window.confirm(`Удалить ${TYPE_META[item.type].label.toLowerCase()} «${item.title}»? Это действие нельзя отменить.`)) return;
    try {
      await deleteDoc(doc(db, item.collectionName, item.id));
      if (item.type !== 'article') await cleanupPortfolioRelations(item.type, item.id);
      clearUnifiedDraft(item.type, item.id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const duplicateSlugForItem = (candidate: ContentItem): boolean =>
    items.some(item => item.type === candidate.type && item.id !== candidate.id && item.slug.toLowerCase() === candidate.slug.toLowerCase());

  const bulkPublish = async (published: boolean) => {
    if (!selectedItems.length || bulkBusy) return;
    if (published) {
      const reports = selectedItems.map(item => ({ item, issues: evaluatePublishQuality(item.type, item.data, { duplicateSlug: duplicateSlugForItem(item) }) }));
      const blocking = reports.filter(report => report.issues.some(issue => issue.severity === 'error'));
      if (blocking.length) {
        window.alert(`Массовая публикация остановлена. Критические ошибки:\n\n${blocking.map(report => `• ${report.item.title}: ${report.issues.filter(issue => issue.severity === 'error').map(issue => issue.label).join(', ')}`).join('\n')}`);
        return;
      }
      const warnings = reports.filter(report => report.issues.some(issue => issue.severity === 'warning'));
      if (warnings.length && !window.confirm(`У ${warnings.length} из ${selectedItems.length} материалов есть предупреждения Quality Gate. Опубликовать выбранные материалы всё равно?`)) return;
    }

    setBulkBusy(true);
    try {
      const batch = writeBatch(db);
      const now = Date.now();
      selectedItems.forEach(item => batch.update(doc(db, item.collectionName, item.id), { published, updatedAt: now }));
      await batch.commit();
      setSelected(new Set<string>());
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkApplyCategory = async () => {
    if (!selectedItems.length || bulkBusy) return;
    setBulkBusy(true);
    try {
      const batch = writeBatch(db);
      const now = Date.now();
      selectedItems.forEach(item => {
        const taxonomy = taxonomyRecord(item.data);
        batch.update(doc(db, item.collectionName, item.id), { taxonomy: { ...taxonomy, category: bulkCategory }, updatedAt: now });
      });
      await batch.commit();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkAddTag = async () => {
    const tag = bulkTag.trim();
    if (!selectedItems.length || !tag || bulkBusy) return;
    setBulkBusy(true);
    try {
      const batch = writeBatch(db);
      const now = Date.now();
      selectedItems.forEach(item => {
        const taxonomy = taxonomyRecord(item.data);
        const tags = Array.isArray(taxonomy.tags) ? taxonomy.tags.map(String).filter(Boolean) : [];
        batch.update(doc(db, item.collectionName, item.id), { taxonomy: { ...taxonomy, tags: Array.from(new Set<string>([...tags, tag])) }, updatedAt: now });
      });
      await batch.commit();
      setBulkTag('');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkDelete = async () => {
    if (!selectedItems.length || bulkBusy) return;
    if (!window.confirm(`Удалить выбранные материалы (${selectedItems.length})? Это действие нельзя отменить.`)) return;
    setBulkBusy(true);
    try {
      for (const item of selectedItems) {
        await deleteDoc(doc(db, item.collectionName, item.id));
        if (item.type !== 'article') await cleanupPortfolioRelations(item.type, item.id);
        clearUnifiedDraft(item.type, item.id);
      }
      setSelected(new Set<string>());
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBulkBusy(false);
    }
  };

  const toggleSelected = (key: string) => setSelected(current => {
    const next = new Set<string>(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const toggleAllVisible = () => {
    const allSelected = filteredItems.length > 0 && filteredItems.every(item => selected.has(item.key));
    setSelected(current => {
      const next = new Set<string>(current);
      filteredItems.forEach(item => allSelected ? next.delete(item.key) : next.add(item.key));
      return next;
    });
  };

  const toggleArticleRelation = (field: 'relatedCaseIds' | 'relatedGalleryIds' | 'relatedVideoProjectIds', id: string) => {
    if (!draft) return;
    const current = new Set<string>(Array.isArray(draft[field]) ? draft[field].map(String) : []);
    if (current.has(id)) current.delete(id); else current.add(id);
    patchDraft({ [field]: Array.from(current) });
  };

  const relationsPanel = () => {
    if (!draft || !editingType) return null;
    if (editingType !== 'article') {
      return <PortfolioRelationsField ref={relationsRef} entityType={editingType} entityId={String(draft.id)} entityTitle={primaryTitle(editingType, draft) || 'Новый материал'} />;
    }
    const groups: Array<{ field: 'relatedCaseIds' | 'relatedGalleryIds' | 'relatedVideoProjectIds'; type: Exclude<PublishQualityType, 'article'>; label: string }> = [
      { field: 'relatedCaseIds', type: 'case', label: 'Кейсы' },
      { field: 'relatedGalleryIds', type: 'gallery', label: 'Галереи' },
      { field: 'relatedVideoProjectIds', type: 'video', label: 'Видео' },
    ];
    return (
      <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700"><Link2 className="h-3.5 w-3.5" />Article relations</div>
        <h3 className="mt-2 text-lg font-black text-slate-950">Связать статью с портфолио</h3>
        <p className="mt-1 text-xs text-slate-500">Ссылки сохраняются в article-документе без изменения действующей portfolio relation-схемы.</p>
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          {groups.map(group => {
            const currentIds = Array.isArray(draft[group.field]) ? draft[group.field].map(String) : [];
            const currentSet = new Set<string>(currentIds);
            return (
              <div key={group.field}>
                <div className="mb-2 text-sm font-black text-slate-900">{group.label} <span className="text-xs text-violet-600">{currentSet.size}</span></div>
                <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                  {items.filter(item => item.type === group.type).map(item => (
                    <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 ${currentSet.has(item.id) ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}>
                      <input type="checkbox" checked={currentSet.has(item.id)} onChange={() => toggleArticleRelation(group.field, item.id)} className="h-4 w-4 accent-violet-600" />
                      {item.cover ? <img src={item.cover} alt="" className="h-10 w-14 rounded-lg object-cover" /> : <div className="h-10 w-14 rounded-lg bg-slate-200" />}
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-900">{item.title}</span><span className="block truncate text-[10px] text-slate-400">{item.slug}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const previewPanel = () => {
    if (!draft || !editingType) return null;
    const previewTitle = titleFor(editingType, draft, language);
    const description = descriptionFor(editingType, draft, language);
    const cover = coverFor(editingType, draft);
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="aspect-video bg-slate-900">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/25"><Eye className="h-14 w-14" /></div>}</div>
          <div className="p-6"><div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">{TYPE_META[editingType].label} · {language.toUpperCase()}</div><h3 className="mt-2 text-2xl font-black text-slate-950">{previewTitle || 'Без названия'}</h3><p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{description || 'Описание пока не заполнено.'}</p><div className="mt-5 rounded-xl bg-slate-50 px-3 py-2 text-xs text-indigo-600">{publicPath}</div><Link to={publicPath} target="_blank" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-indigo-600"><Eye className="h-4 w-4" />Открыть публичную страницу</Link></div>
        </section>
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-44 xl:self-start">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">Publish Quality Gate</div>
          <div className="mt-4 space-y-2">{issues.length === 0 ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">✓ Материал готов к публикации.</div> : issues.map(issue => <div key={issue.code} className={`rounded-2xl border p-3 text-sm ${issue.severity === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><div className="font-black">{issue.severity === 'error' ? 'Ошибка' : 'Предупреждение'}</div><div className="mt-0.5 text-xs">{issue.label}</div></div>)}</div>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">Ошибки блокируют публикацию. Предупреждения требуют подтверждения. Черновики можно сохранять до завершения контента.</p>
        </aside>
      </div>
    );
  };

  const sections = useMemo<UnifiedEditorSection[]>(() => {
    if (!draft || !editingType || !healthReport) return [];
    const mediaCount = editingType === 'case' ? (draft.media?.length || 0) : editingType === 'gallery' ? (draft.images?.length || 0) : editingType === 'video' ? (draft.videos?.length || 0) : (draft.coverImage ? 1 : 0);
    const seoFallback = { title: titleFor(editingType, draft, language), description: descriptionFor(editingType, draft, language), socialImage: coverFor(editingType, draft) };
    return [
      { id: 'content', label: 'Контент', icon: <FileText className="h-4 w-4" />, content: <UnifiedContentFields type={editingType} value={draft} locale={language} onPatch={patchDraft} /> },
      { id: 'media', label: 'Медиа', icon: <Images className="h-4 w-4" />, badge: mediaCount, content: <UnifiedMediaPanel type={editingType} value={draft} locale={language} onPatch={patchDraft} onBusyChange={setMediaBusy} onError={setError} /> },
      { id: 'taxonomy', label: 'Taxonomy', icon: <Tags className="h-4 w-4" />, content: <UnifiedTaxonomyPanel value={draft} onPatch={patchDraft} articleCategory={editingType === 'article' ? text(draft.category) : undefined} articleCategories={editingType === 'article' ? ['live', 'video', 'construction', 'photo', 'tech'] : undefined} onArticleCategoryChange={editingType === 'article' ? category => patchDraft({ category }) : undefined} /> },
      { id: 'relations', label: 'Связи', icon: <Link2 className="h-4 w-4" />, content: relationsPanel() },
      { id: 'seo', label: 'SEO', icon: <FileSearch className="h-4 w-4" />, content: <UnifiedSeoPanel value={draft} locale={language} fallback={seoFallback} publicPath={publicPath} onPatch={patchDraft} /> },
      { id: 'health', label: 'Health', icon: <CircleGauge className="h-4 w-4" />, badge: healthReport.score, content: <UnifiedContentHealthPanel report={healthReport} /> },
      { id: 'preview', label: 'Preview & Quality', icon: <Eye className="h-4 w-4" />, badge: issues.length || undefined, content: previewPanel() },
    ];
  }, [draft, editingType, healthReport, issues, language, publicPath, items]);

  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every(item => selected.has(item.key));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div><div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700"><FileText className="h-3.5 w-3.5" />Unified Content Editor 2.0</div><h2 className="mt-2 text-2xl font-black text-slate-950">Единый редактор контента</h2><p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">Autosave + recovery, dirty-state protection, Content Health, массовые операции и единая архитектура Cases / Galleries / Videos / Articles без миграции Firestore.</p></div>
          <button type="button" onClick={createNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-500"><Plus className="h-4 w-4" />Создать: {TYPE_META[typeFilter].label}</button>
        </div>
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">{(Object.keys(TYPE_META) as PublishQualityType[]).map(type => { const Icon = TYPE_META[type].icon; return <button key={type} type="button" onClick={() => setTypeFilter(type)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black ${typeFilter === type ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Icon className="h-4 w-4" />{TYPE_META[type].plural}<span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] text-slate-600">{counts[type]}</span></button>; })}</div>
          <div className="flex w-full max-w-xl items-center gap-2"><label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="h-4 w-4 accent-indigo-600" />Все</label><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchText} onChange={event => setSearchText(event.target.value)} placeholder={`Поиск: ${TYPE_META[typeFilter].plural.toLowerCase()}…`} className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" /></div></div>
        </div>
      </section>

      {selectedItems.length > 0 && (
        <section className="sticky top-2 z-20 rounded-3xl border border-indigo-200 bg-indigo-50/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex items-center gap-2 text-sm font-black text-indigo-950"><CheckSquare className="h-5 w-5 text-indigo-600" />Выбрано: {selectedItems.length}</div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <button type="button" disabled={bulkBusy} onClick={() => void bulkPublish(true)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">Опубликовать</button>
              <button type="button" disabled={bulkBusy} onClick={() => void bulkPublish(false)} className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">В черновики</button>
              <div className="flex overflow-hidden rounded-xl border border-indigo-200 bg-white"><select value={bulkCategory} onChange={event => setBulkCategory(event.target.value)} className="bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none">{PORTFOLIO_CATEGORY_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><button type="button" disabled={bulkBusy} onClick={() => void bulkApplyCategory()} className="border-l border-indigo-100 px-3 text-xs font-black text-indigo-700 disabled:opacity-50">Применить category</button></div>
              <div className="flex overflow-hidden rounded-xl border border-indigo-200 bg-white"><input value={bulkTag} onChange={event => setBulkTag(event.target.value)} placeholder="Добавить tag" className="w-32 px-3 py-2 text-xs outline-none" /><button type="button" disabled={bulkBusy || !bulkTag.trim()} onClick={() => void bulkAddTag()} className="border-l border-indigo-100 px-3 text-xs font-black text-indigo-700 disabled:opacity-50">Добавить</button></div>
              <button type="button" disabled={bulkBusy} onClick={() => setSelected(new Set<string>())} className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 disabled:opacity-50">Снять выбор</button>
              <button type="button" disabled={bulkBusy} onClick={() => void bulkDelete()} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"><Trash2 className="h-4 w-4" />Удалить</button>
            </div>
            {bulkBusy && <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />}
          </div>
        </section>
      )}

      {error && !draft && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {loading ? <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div> : filteredItems.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">Материалов этого типа пока нет.</div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredItems.map(item => { const Icon = TYPE_META[item.type].icon; const checked = selected.has(item.key); return <article key={item.key} className={`relative flex overflow-hidden rounded-3xl border bg-white shadow-sm ${checked ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'}`}><label className="absolute left-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white/95 shadow"><input type="checkbox" checked={checked} onChange={() => toggleSelected(item.key)} className="h-4 w-4 accent-indigo-600" /></label><div className="w-32 shrink-0 bg-slate-900 sm:w-40">{item.cover ? <img src={item.cover} alt="" className="h-full min-h-44 w-full object-cover" /> : <div className="flex h-full min-h-44 items-center justify-center text-white/25"><Icon className="h-10 w-10" /></div>}</div><div className="min-w-0 flex-1 p-4"><div className="flex items-center gap-2"><span className="text-[9px] font-black uppercase tracking-wider text-indigo-600">{TYPE_META[item.type].label}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${item.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.published ? 'LIVE' : 'DRAFT'}</span></div><h3 className="mt-2 line-clamp-2 text-sm font-black text-slate-950">{item.title}</h3><div className="mt-1 truncate text-[10px] text-slate-400">{item.path}</div><p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{item.description}</p><div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3"><button type="button" onClick={() => openEditor(item)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-bold text-white hover:bg-indigo-600"><Edit3 className="h-3.5 w-3.5" />Редактировать</button><Link to={item.path} target="_blank" className="rounded-xl p-2 text-indigo-600 hover:bg-indigo-50"><Eye className="h-4 w-4" /></Link><button type="button" onClick={() => void remove(item)} className="ml-auto rounded-xl p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></div></article>; })}</div>}

      {draft && editingType && <UnifiedContentEditorShell type={editingType} title={titleFor(editingType, draft, language) || `Новый: ${TYPE_META[editingType].label}`} id={String(draft.id)} publicPath={publicPath} published={draft.published !== false} onPublishedChange={published => patchDraft({ published })} language={language} onLanguageChange={setLanguage} activeTab={activeTab} onTabChange={setActiveTab} sections={sections} issues={issues} saving={saving} busy={mediaBusy} error={error} dirty={dirty} autosavedAt={autosavedAt} recovered={recovered} onClose={() => closeEditor(false)} onSubmit={submit} onSaveAndClose={() => void persistDraft(true)} saveLabel={`Сохранить ${TYPE_META[editingType].label.toLowerCase()}`} />}
    </div>
  );
}
