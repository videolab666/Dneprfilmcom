import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { CheckCircle2, Copy, FileText, Layers, Plus, Upload } from 'lucide-react';
import { db } from '../../lib/firebase';
import { PageBuilderManager as PageBuilderManagerV3 } from './PageBuilderManagerV3';
import {
  PAGE_BUILDER_PAGES,
  blockKind,
  builderDraftData,
  createBuilderBlock,
  type BuilderSiteBlock,
  type PageBuilderDownloadItem,
  type PageBuilderPage,
  type StoredBuilderSiteBlock,
} from '../../lib/pageBuilder';
import {
  PIXEL_PERFECT_SECTIONS,
  type PixelPerfectPage,
  type PixelPerfectSectionDefinition,
} from '../../lib/pixelPerfectSections';
import {
  documentTypeLabel,
  formatDocumentSize,
  loadDocumentLibrary,
  uploadDocument,
  type DocumentAsset,
} from '../../lib/documentLibrary';
import { versionedSetDoc as setDoc } from '../../lib/cmsVersioning';

const PIXEL_PAGES: PixelPerfectPage[] = ['live', 'video', 'construction', 'photo'];

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function editableBlock(stored: StoredBuilderSiteBlock): BuilderSiteBlock {
  const draft = stored.builderDraft;
  if (!draft) return stored;
  return {
    ...stored,
    title: draft.title,
    title_uk: draft.title_uk,
    title_en: draft.title_en,
    type: draft.type,
    order: draft.order,
    isActive: draft.isActive,
    page: draft.page,
    config: draft.config,
    config_uk: draft.config_uk,
    config_en: draft.config_en,
  };
}

function labelForPage(page: PageBuilderPage): string {
  return PAGE_BUILDER_PAGES.find(item => item.id === page)?.label || page;
}

function stem(name: string): string {
  return name.replace(/\.[^.]+$/, '') || name;
}

export function PageBuilderManager() {
  const [blocks, setBlocks] = useState<StoredBuilderSiteBlock[]>([]);
  const [targetPage, setTargetPage] = useState<PageBuilderPage>('home');
  const [pixelBusyId, setPixelBusyId] = useState('');
  const [pixelMessage, setPixelMessage] = useState('');
  const [pixelError, setPixelError] = useState('');

  const [documents, setDocuments] = useState<DocumentAsset[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [documentQuery, setDocumentQuery] = useState('');
  const [downloadTarget, setDownloadTarget] = useState('new');
  const [downloadPage, setDownloadPage] = useState<PageBuilderPage>('home');
  const [documentMessage, setDocumentMessage] = useState('');
  const [documentError, setDocumentError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => onSnapshot(collection(db, 'site_blocks'), snapshot => {
    setBlocks(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StoredBuilderSiteBlock)));
  }), []);

  const reloadDocuments = async () => {
    setDocumentsLoading(true);
    try {
      setDocuments(await loadDocumentLibrary());
      setDocumentError('');
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : String(error));
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    void reloadDocuments();
  }, []);

  const nextOrder = (page: PageBuilderPage): number => {
    const pageOrders = blocks
      .map(editableBlock)
      .filter(block => block.page === page || block.page === 'all')
      .map(block => Number(block.order) || 0);
    return (pageOrders.length ? Math.max(...pageOrders) : 0) + 10;
  };

  const addPixelPerfectSection = async (section: PixelPerfectSectionDefinition) => {
    setPixelBusyId(section.id);
    setPixelError('');
    setPixelMessage('');
    try {
      const block = createBuilderBlock('text_image', targetPage, nextOrder(targetPage));
      block.id = uniqueId(`native-${section.page}`);
      block.title = section.label;
      block.title_uk = section.label;
      block.title_en = section.label;
      block.isActive = true;
      block.config = {
        ...block.config,
        builderScope: 'page',
        builderPlacement: 'after',
        width: 'full',
        spacing: 'normal',
        nativeSection: section.id,
      };
      const draft = builderDraftData(block);
      const placeholder = clean({
        ...block,
        isActive: false,
        _builderUnpublished: true,
        builderDraft: draft,
        builderDraftUpdatedAt: Date.now(),
        updatedAt: Date.now(),
      });
      await setDoc(doc(db, 'site_blocks', block.id), placeholder);
      setPixelMessage(`${section.label} добавлен в Draft страницы «${labelForPage(targetPage)}».`);
    } catch (error) {
      setPixelError(error instanceof Error ? error.message : String(error));
    } finally {
      setPixelBusyId('');
    }
  };

  const downloadBlocks = useMemo(() => blocks
    .map(stored => ({ stored, view: editableBlock(stored) }))
    .filter(item => blockKind(item.view) === 'downloads' && !item.stored.builderDraft?.deleted)
    .sort((a, b) => (a.view.order || 0) - (b.view.order || 0)), [blocks]);

  const filteredDocuments = useMemo(() => {
    const query = documentQuery.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter(asset => `${asset.name} ${asset.format || ''}`.toLowerCase().includes(query));
  }, [documents, documentQuery]);

  const selectedAssets = useMemo(() => {
    const selected = new Set(selectedDocuments);
    return documents.filter(asset => selected.has(asset.id));
  }, [documents, selectedDocuments]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setDocumentError('');
    setDocumentMessage('');
    const uploadedIds: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, 20)) {
        const asset = await uploadDocument(file);
        uploadedIds.push(asset.id);
      }
      await reloadDocuments();
      setSelectedDocuments(current => Array.from(new Set([...current, ...uploadedIds])));
      setDocumentMessage(`Загружено документов: ${uploadedIds.length}. Они сразу выбраны.`);
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : String(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const toDownloadItems = (assets: DocumentAsset[]): PageBuilderDownloadItem[] => assets.map(asset => ({
    id: uniqueId('download'),
    title: stem(asset.name),
    description: '',
    url: asset.url,
    fileName: asset.name,
    fileType: documentTypeLabel(asset),
    fileSize: formatDocumentSize(asset.bytes),
  }));

  const addDocumentsToDraft = async () => {
    if (!selectedAssets.length) {
      setDocumentError('Выберите минимум один документ.');
      return;
    }
    setDocumentError('');
    setDocumentMessage('');
    const additions = toDownloadItems(selectedAssets);
    try {
      if (downloadTarget === 'new') {
        const block = createBuilderBlock('downloads', downloadPage, nextOrder(downloadPage));
        block.id = uniqueId('downloads');
        block.title = 'Документы';
        block.title_uk = 'Документи';
        block.title_en = 'Documents';
        block.isActive = true;
        block.config = {
          ...block.config,
          builderScope: 'page',
          builderPlacement: 'after',
          downloadLayout: 'list',
          downloadItems: additions,
        };
        const draft = builderDraftData(block);
        await setDoc(doc(db, 'site_blocks', block.id), clean({
          ...block,
          isActive: false,
          _builderUnpublished: true,
          builderDraft: draft,
          builderDraftUpdatedAt: Date.now(),
          updatedAt: Date.now(),
        }));
        setDocumentMessage(`Создан Draft-блок «Документы» на странице «${labelForPage(downloadPage)}».`);
      } else {
        const target = blocks.find(item => item.id === downloadTarget);
        if (!target) throw new Error('Целевой Downloads-блок больше не существует.');
        const view = editableBlock(target);
        const existing = view.config.downloadItems || [];
        const existingUrls = new Set(existing.map(item => item.url));
        const uniqueAdditions = additions.filter(item => !existingUrls.has(item.url));
        const next: BuilderSiteBlock = {
          ...view,
          config: { ...view.config, downloadItems: [...existing, ...uniqueAdditions] },
        };
        await setDoc(doc(db, 'site_blocks', view.id), clean({
          builderDraft: builderDraftData(next),
          builderDraftUpdatedAt: Date.now(),
          updatedAt: Date.now(),
        }), { merge: true });
        setDocumentMessage(`В Draft «${view.title_uk || view.title}» добавлено файлов: ${uniqueAdditions.length}.`);
      }
      setSelectedDocuments([]);
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : String(error));
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setDocumentMessage('URL документа скопирован.');
    } catch {
      setDocumentError('Браузер не разрешил скопировать URL автоматически.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700"><Layers className="h-3.5 w-3.5" />DNEPRFILM · Pixel Perfect Pages 4.3</div>
            <h3 className="mt-3 text-xl font-black text-slate-950">27 исходных секций LIVE / Video / Construction / Photo</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">Секция не копируется и не переписывается: builder рендерит исходную страницу и оставляет видимым только выбранный верхнеуровневый section. Поэтому JSX, классы, анимации и responsive-поведение остаются теми же.</p>
          </div>
          <label className="min-w-56 text-xs font-bold text-slate-600">Добавить на страницу<select value={targetPage} onChange={event => setTargetPage(event.target.value as PageBuilderPage)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500">{PAGE_BUILDER_PAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        </div>

        {pixelMessage && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">{pixelMessage}</div>}
        {pixelError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{pixelError}</div>}

        <div className="mt-6 space-y-5">
          {PIXEL_PAGES.map(page => (
            <div key={page}>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{page}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {PIXEL_PERFECT_SECTIONS.filter(section => section.page === page).map(section => (
                  <button key={section.id} type="button" disabled={pixelBusyId === section.id} onClick={() => void addPixelPerfectSection(section)} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50">
                    <div className="flex items-center justify-between gap-2"><span className="text-sm font-black text-slate-900">{section.label}</span><Plus className="h-4 w-4 shrink-0 text-emerald-600" /></div>
                    <div className="mt-1 text-[11px] leading-5 text-slate-500">{section.description}</div>
                    {section.interactive && targetPage === section.page && <div className="mt-2 text-[10px] font-bold text-amber-700">Интерактивная копия на исходной странице может дублировать anchor/id.</div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700"><FileText className="h-3.5 w-3.5" />Document Library</div>
            <h3 className="mt-3 text-xl font-black text-slate-950">PDF / Office / архивы → Downloads Draft</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Документы загружаются в Cloudinary Raw до 50 МБ и регистрируются отдельно от фото/видео. Выберите несколько файлов и добавьте их в новый или существующий Downloads-блок.</p>
          </div>
          <div>
            <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.rtf,.zip,.rar,.7z" className="hidden" onChange={event => void handleUpload(event.target.files)} />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><Upload className="h-4 w-4" />{uploading ? 'Загрузка…' : 'Загрузить документы'}</button>
          </div>
        </div>

        {documentMessage && <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-800">{documentMessage}</div>}
        {documentError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{documentError}</div>}

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <input value={documentQuery} onChange={event => setDocumentQuery(event.target.value)} placeholder="Поиск документа…" className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {documentsLoading && <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-400">Загрузка библиотеки…</div>}
              {!documentsLoading && filteredDocuments.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">Документы ещё не загружены.</div>}
              {filteredDocuments.map(asset => {
                const selected = selectedDocuments.includes(asset.id);
                return <div key={asset.id} className={`flex items-center gap-3 rounded-xl border p-3 ${selected ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                  <button type="button" onClick={() => setSelectedDocuments(current => selected ? current.filter(id => id !== asset.id) : [...current, asset.id])} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{selected ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</button>
                  <div className="min-w-0 flex-1"><div className="truncate text-xs font-black text-slate-900">{asset.name}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{documentTypeLabel(asset)} · {formatDocumentSize(asset.bytes)} · используется {asset.useCount || 0}</div></div>
                  <button type="button" onClick={() => void copyUrl(asset.url)} title="Скопировать URL" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><Copy className="h-4 w-4" /></button>
                </div>;
              })}
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Добавить выбранные</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{selectedAssets.length}</div>
            <label className="mt-4 block text-xs font-bold text-slate-600">Куда<select value={downloadTarget} onChange={event => setDownloadTarget(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold"><option value="new">Новый Downloads-блок</option>{downloadBlocks.map(({ view }) => <option key={view.id} value={view.id}>{labelForPage(view.page === 'all' ? 'home' : view.page)} · {view.title_uk || view.title}</option>)}</select></label>
            {downloadTarget === 'new' && <label className="mt-3 block text-xs font-bold text-slate-600">Страница<select value={downloadPage} onChange={event => setDownloadPage(event.target.value as PageBuilderPage)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold">{PAGE_BUILDER_PAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
            <button type="button" onClick={() => void addDocumentsToDraft()} disabled={!selectedAssets.length} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white disabled:opacity-40"><Plus className="h-4 w-4" />Добавить в Draft</button>
            <p className="mt-3 text-[10px] leading-5 text-slate-500">Публичный сайт меняется только после обычной кнопки «Опубликовать» в конструкторе ниже.</p>
          </aside>
        </div>
      </section>

      <PageBuilderManagerV3 />
    </div>
  );
}
